/**
 * @module apps/desk/server.mjs
 * @purpose Host manifest-configured loopback apps and a retired desk-page notice.
 * @inputs HTTP requests; DESK_PORT, DESK_APPS_DIR, DESK_PI_BIN; pi's active agent directory;
 *  app manifests, session headers and persisted stage keys; child RPC events.
 * @outputs Retired notice, app registry, per-app listeners and bounded RPC/SSE transport.
 * @effects disk (session headers, manifests and stage keys), process (pi children), network (loopback).
 * @errors JSON errors including 400/403/404/409/429/500; startup errors are fatal; signals drain children.
 */
import { execFile, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { StringDecoder } from 'node:string_decoder';
import { fileURLToPath } from 'node:url';
import { isBuiltinExtensionRef, loadManifests, startAppListeners, verifiedBlocks } from './apps.mjs';
import { resolvePiBin } from './pi-session.mjs';
import { escapeHtml } from './public/md.js';
import { StageKeyStore } from './stage-keys.mjs';
import { piAgentDir, piAgentDirIsCwdRelative } from '../../packages/nana-pack/lib/agent-dir.mjs';

// 7317 avoids the OTLP port 4317 and its network filters (observed 2026-09-03).
const PORT = Number(process.env.DESK_PORT || 7317);
let BOUND_PORT = PORT;
const PI_BIN = resolvePiBin();
const AGENT_DIR_PIN = piAgentDirIsCwdRelative() ? { PI_CODING_AGENT_DIR: piAgentDir() } : {};
const SESSIONS_DIR = path.join(piAgentDir(), 'sessions');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(HERE, 'public');
const MAX_CHILDREN = 4;
const DIALOG_METHODS = new Set(['select', 'confirm', 'input', 'editor']);
// Existing transport caps; overrides are tests-only. Stdout counts decoded characters.
const STDOUT_LINE_CAP = Number(process.env.DESK_STDOUT_LINE_CAP) || 64 * 1024 * 1024;
const SSE_CLIENT_BUFFER_CAP = Number(process.env.DESK_SSE_BUFFER_CAP) || 8 * 1024 * 1024;
const MAX_PENDING_RPC = Number(process.env.DESK_MAX_PENDING_RPC) || 64;
const KILL_GRACE_MS = Number(process.env.DESK_KILL_GRACE_MS) || 3000;
const RPC_TIMEOUTS = { prompt: 600000, steer: 600000, follow_up: 600000 };
const children = new Map();
let nextId = 1;
let appListeners = [];

function childEnv(more = {}) {
  const extra = [path.dirname(process.execPath), path.dirname(path.resolve(PI_BIN)), path.join(os.homedir(), '.local', 'bin'), '/opt/homebrew/bin', '/usr/local/bin'];
  const merged = [...new Set([...extra, ...(process.env.PATH || '').split(path.delimiter)])].filter(Boolean);
  return { ...process.env, ...AGENT_DIR_PIN, PATH: merged.join(path.delimiter), ...more };
}

// Keep the old bounded header read, but no longer load pi's transcript parser:
// only the session id has a reader now. Malformed/non-object lines remain skipped.
function readSessionId(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(65536);
    const size = fs.readSync(fd, buf, 0, buf.length, 0);
    for (const line of buf.toString('utf8', 0, size).split('\n')) {
      let entry;
      try { entry = JSON.parse(line); } catch { continue; }
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
      return entry.type === 'session' && typeof entry.id === 'string' ? entry.id : null;
    }
    return null;
  } finally { fs.closeSync(fd); }
}
function knownSessionIds() {
  const ids = new Set();
  // An unreadable directory must not turn a partial enumeration into deletion
  // authority. StageKeyStore treats an empty set as "do not prune".
  try {
    for (const dir of fs.readdirSync(SESSIONS_DIR, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      for (const file of fs.readdirSync(path.join(SESSIONS_DIR, dir.name))) {
        if (!file.endsWith('.jsonl')) continue;
        const id = readSessionId(path.join(SESSIONS_DIR, dir.name, file));
        if (id) ids.add(id);
      }
    }
  } catch { return new Set(); }
  return ids;
}
const stageKeys = new StageKeyStore({ sessionsRoot: SESSIONS_DIR, knownSessionIds });
function stageKeyForSpawn(session) {
  let id = null;
  try { if (session) id = readSessionId(session); }
  catch (e) { console.error(`stage keys: cannot read session header (${e.message}) — minting a fresh key`); }
  const recorded = id ? stageKeys.keysFor(id)[0] : null;
  if (recorded) return recorded;
  const key = randomBytes(32).toString('hex');
  if (id) stageKeys.record(id, key);
  return key;
}
function noteStageSession(child, state) {
  const id = typeof state?.sessionId === 'string' && state.sessionId ? state.sessionId : null;
  if (!id || !child.stageKey) return null;
  stageKeys.record(id, child.stageKey);
  return id;
}
async function ledgerKeys(child) {
  let id = null;
  try { id = noteStageSession(child, (await sendRpc(child, { type: 'get_state' }))?.data); } catch {}
  if (!id) return child.stageKey ? [child.stageKey] : [];
  return [...new Set([child.stageKey, ...stageKeys.keysFor(id)].filter(Boolean))];
}

function sseLine(obj) {
  try { return `data: ${JSON.stringify(obj)}\n\n`; } catch { return null; }
}
function sseWrite(res, line) {
  if (line === null) return false;
  try {
    if (res.destroyed || res.writableEnded || !res.writable) return false;
    res.write(line);
    if (res.writableLength > SSE_CLIENT_BUFFER_CAP) {
      console.error(`nana code: SSE client over cap — dropped with ${res.writableLength} bytes buffered (cap ${SSE_CLIENT_BUFFER_CAP}); it will reconnect and resync`);
      try { res.end(); } catch {}
      try { res.destroy(); } catch {}
      return false;
    }
    return true;
  } catch { return false; }
}
function broadcast(child, obj) {
  const line = sseLine(obj) ?? sseLine({ type: 'desk_event_dropped', eventType: typeof obj?.type === 'string' ? obj.type : null, reason: 'event could not be serialized (too deeply nested?)' });
  for (const res of [...child.clients]) if (!sseWrite(res, line)) child.clients.delete(res);
}
function spawnChild({ cwd, session, name, trust, tools, resources, app }) {
  if ([...children.values()].filter(c => c.state === 'running' || c.state === 'exiting').length >= MAX_CHILDREN) throw new Error(`max ${MAX_CHILDREN} live sessions`);
  const args = ['--mode', 'rpc'];
  if (session) args.push('--session', session);
  if (name) args.push('--name', String(name));
  if (trust === 'approve') args.push('-a');
  else if (trust === 'no-approve') args.push('-na');
  if (Array.isArray(tools) && tools.length) args.push('-t', tools.join(','));
  if (resources) {
    args.push('--no-skills');
    for (const p of resources.skills || []) {
      if (!fs.existsSync(p)) throw new Error(`no such skill: ${p}`);
      args.push('--skill', p);
    }
    args.push('--no-extensions');
    for (const p of resources.extensions || []) {
      if (!isBuiltinExtensionRef(p) && !fs.existsSync(p)) throw new Error(`no such extension: ${p}`);
      args.push('-e', p);
    }
  }
  const stageKey = stageKeyForSpawn(session);
  const envMore = { NANA_STAGE_KEY: stageKey };
  const toolsExpected = !!(app && Array.isArray(tools) && tools.length);
  if (toolsExpected) envMore.NANA_STAGE_EXPECT_TOOLS = tools.join(',');
  let proc;
  if (process.platform === 'win32') {
    // Preserve cmd's single, non-recursive expansion: spaces, & and % in paths
    // ride environment values, never interpolated shell arguments.
    const env = childEnv(envMore);
    const line = [`"${PI_BIN.replaceAll('"', '')}"`, ...args.map((a, i) => {
      const v = a.replaceAll('"', '').replace(/\\+$/, '');
      if (!v) return '""';
      env[`NANA_PI_ARG_${i}`] = v;
      return `"%NANA_PI_ARG_${i}%"`;
    })].join(' ');
    proc = spawn(line, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'], shell: true, windowsHide: true });
  } else proc = spawn(PI_BIN, args, { cwd, env: childEnv(envMore), stdio: ['pipe', 'pipe', 'pipe'] });
  const id = String(nextId++);
  const child = { proc, cwd, app, stageKey, toolsExpected, clients: new Set(), state: 'running', startedAt: Date.now(), stderrTail: '', pending: new Map(), dialogs: new Map(), statuses: new Map(), widgets: new Map(), title: null, queue: { steering: [], followUp: [] }, nextRpc: 1, nextPrompt: 1, exitNote: null };
  children.set(id, child);
  const decoder = new StringDecoder('utf-8');
  let pending = '', droppingLine = false;
  const dropOverCapLine = () => {
    console.error(`session ${id}: child stdout line over cap (${STDOUT_LINE_CAP} chars) — discarded, session kept`);
    broadcast(child, { type: 'desk_event_dropped', eventType: null, reason: `child stdout line exceeded ${STDOUT_LINE_CAP} characters and was discarded` });
    for (const p of child.pending.values()) { clearTimeout(p.timer); p.reject(new Error(`child stdout line exceeded ${STDOUT_LINE_CAP} characters — a response may have been discarded`)); }
    child.pending.clear();
  };
  proc.stdout.on('data', chunk => {
    pending += decoder.write(chunk);
    let nl;
    while ((nl = pending.indexOf('\n')) >= 0) {
      const line = pending.slice(0, nl).replace(/\r$/, ''); pending = pending.slice(nl + 1);
      if (droppingLine) { droppingLine = false; continue; }
      if (!line) continue;
      if (line.length > STDOUT_LINE_CAP) { dropOverCapLine(); continue; }
      let obj;
      try { obj = JSON.parse(line); } catch { continue; }
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) continue;
      try { handleChildEvent(child, obj); } catch (e) { console.error(`session ${id}: dropped a child event (${obj.type}): ${e.message}`); }
    }
    if (pending.length > STDOUT_LINE_CAP) {
      pending = '';
      if (!droppingLine) { droppingLine = true; dropOverCapLine(); }
    }
  });
  proc.stdin.on('error', err => {
    if (child.state !== 'running') return;
    child.stderrTail = `${child.stderrTail}\nstdin: ${String(err)}`.slice(-2000);
    teardownChild(id, child);
    for (const p of child.pending.values()) { clearTimeout(p.timer); p.reject(new Error('session stdin closed')); }
    child.pending.clear();
  });
  proc.stderr.on('data', c => { child.stderrTail = (child.stderrTail + c.toString()).slice(-2000); });
  proc.on('exit', code => {
    child.state = 'exited';
    for (const p of child.pending.values()) { clearTimeout(p.timer); p.reject(new Error('session process exited')); }
    child.pending.clear(); child.dialogs.clear();
    child.exitNote = { type: 'desk_exit', code, stderrTail: child.stderrTail.slice(-500) };
    broadcast(child, child.exitNote);
  });
  let spawnOk = false;
  proc.on('spawn', () => { spawnOk = true; });
  proc.on('error', err => {
    if (spawnOk && proc.pid !== undefined) { child.stderrTail = `${child.stderrTail}\nchild error: ${String(err)}`.slice(-2000); return; }
    child.state = 'exited'; child.exitNote = { type: 'desk_exit', code: null, stderrTail: String(err) }; broadcast(child, child.exitNote);
  });
  return id;
}
function killTree(proc, signal = 'SIGTERM') {
  if (process.platform === 'win32') execFile('taskkill', ['/pid', String(proc.pid), '/t', '/f'], () => {});
  else proc.kill(signal);
}
function pidGone(child) {
  if (child.proc.exitCode !== null || child.proc.signalCode !== null || !child.proc.pid) return true;
  try { process.kill(child.proc.pid, 0); return false; } catch (e) { return e.code === 'ESRCH'; }
}
function teardownChild(id, child) {
  if (child.state === 'exited' || pidGone(child)) { children.delete(id); return; }
  if (child.state === 'exiting') return;
  child.state = 'exiting';
  child.proc.once('exit', () => children.delete(id));
  killTree(child.proc);
  setTimeout(() => {
    if (!children.has(id)) return;
    try { killTree(child.proc, 'SIGKILL'); } catch {}
    setTimeout(() => {
      if (!children.has(id)) return;
      if (pidGone(child)) { children.delete(id); return; }
      const watch = setInterval(() => { if (!children.has(id) || pidGone(child)) { children.delete(id); clearInterval(watch); } }, KILL_GRACE_MS);
      watch.unref?.();
    }, KILL_GRACE_MS).unref?.();
  }, KILL_GRACE_MS).unref?.();
}
function handleChildEvent(child, obj) {
  if (obj.type === 'response' && child.pending.has(obj.id)) {
    const p = child.pending.get(obj.id); child.pending.delete(obj.id); clearTimeout(p.timer); p.resolve(obj); return;
  }
  if (obj.type === 'extension_ui_request') {
    if (DIALOG_METHODS.has(obj.method)) {
      child.dialogs.set(obj.id, obj);
      if (Number.isFinite(obj.timeout) && obj.timeout > 0) setTimeout(() => {
        if (child.dialogs.get(obj.id) === obj) { child.dialogs.delete(obj.id); broadcast(child, { type: 'desk_ui_resolved', id: obj.id, reason: 'timeout' }); }
      }, obj.timeout + 250).unref?.();
    } else if (obj.method === 'setStatus') {
      if (obj.statusText === undefined || obj.statusText === null) child.statuses.delete(obj.statusKey); else child.statuses.set(obj.statusKey, obj.statusText);
    } else if (obj.method === 'setWidget') {
      if (!obj.widgetLines) child.widgets.delete(obj.widgetKey); else child.widgets.set(obj.widgetKey, { lines: obj.widgetLines, placement: obj.widgetPlacement || 'aboveEditor' });
    } else if (obj.method === 'setTitle') child.title = obj.title;
  } else if (obj.type === 'queue_update') child.queue = { steering: obj.steering || [], followUp: obj.followUp || [] };
  else if (obj.type === 'tool_execution_end' && obj.result?.details?.blocks !== undefined) obj = { ...obj, result: { ...obj.result, details: { ...obj.result.details, blocks: verifiedBlocks(child.stageKey, obj.result.details.blocks, obj) } } };
  broadcast(child, obj);
}
function httpError(status, message) { const e = new Error(message); e.status = status; return e; }
function sendRpc(child, command) {
  if (child.state !== 'running' || !child.proc.stdin.writable) return Promise.reject(new Error('session not running'));
  if (child.pending.size >= MAX_PENDING_RPC) return Promise.reject(httpError(429, `too many in-flight requests for this session (${MAX_PENDING_RPC})`));
  const id = `desk-${child.nextRpc++}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.pending.delete(id); reject(new Error(`rpc timeout: ${command.type}`)); }, RPC_TIMEOUTS[command.type] ?? 30000);
    child.pending.set(id, { resolve, reject, timer });
    try { child.proc.stdin.write(`${JSON.stringify({ ...command, id })}\n`); }
    catch (e) { child.pending.delete(id); clearTimeout(timer); reject(e); }
  });
}
function writeToChild(child, obj) {
  if (child.state !== 'running' || !child.proc.stdin.writable) return false;
  try { child.proc.stdin.write(`${JSON.stringify(obj)}\n`); return true; } catch { return false; }
}
// chosen: plan 6.5 / D4 2026-10-06; row R-699. Only app opens and prompts remain.
const USAGE = Object.freeze({ event: 'desk_usage', actions: Object.freeze({ open: 'open', prompt: 'prompt' }) });
function recordUsage(surface, action) { console.log(JSON.stringify({ ts: new Date().toISOString(), event: USAGE.event, surface, action })); }
async function promptChild(child, body) {
  recordUsage(`app:${child.app}`, USAGE.actions.prompt);
  const mode = ['prompt', 'steer', 'follow_up'].includes(body.mode) ? body.mode : 'prompt';
  const cmd = { type: mode, message: String(body.message || '') };
  if (Array.isArray(body.images)) {
    const images = body.images.filter(i => i && typeof i.data === 'string' && typeof i.mimeType === 'string').slice(0, 8).map(i => ({ type: 'image', data: i.data, mimeType: i.mimeType }));
    if (images.length) cmd.images = images;
  }
  if (mode === 'prompt' && body.streamingBehavior) cmd.streamingBehavior = body.streamingBehavior;
  const promptId = `p-${child.nextPrompt++}`;
  const p = sendRpc(child, cmd);
  let timer;
  const winner = await Promise.race([p.then(r => ({ r })).catch(e => ({ r: { success: false, error: String(e.message || e) } })), new Promise(resolve => { timer = setTimeout(() => resolve(null), 5000); })]);
  clearTimeout(timer);
  if (winner) return { status: winner.r.success ? 200 : 409, body: { ok: winner.r.success, error: winner.r.error, promptId } };
  const settle = (ok, error) => broadcast(child, { type: 'desk_prompt_settled', promptId, ok, error });
  p.then(r => { if (!r.success) broadcast(child, { type: 'desk_prompt_rejected', error: r.error }); settle(!!r.success, r.error); }, e => settle(false, String(e.message || e)));
  return { status: 200, body: { ok: true, pending: true, promptId } };
}
async function answerDialog(child, body) {
  const id = String(body.id || '');
  if (!child.dialogs.has(id)) return { status: 409, body: { error: 'dialog not open' } };
  const reply = { type: 'extension_ui_response', id };
  if (body.cancelled) reply.cancelled = true;
  else if (typeof body.confirmed === 'boolean') reply.confirmed = body.confirmed;
  else reply.value = body.value;
  const ok = writeToChild(child, reply);
  if (ok) { child.dialogs.delete(id); broadcast(child, { type: 'desk_ui_resolved', id }); }
  return { status: ok ? 200 : 409, body: { ok } };
}
function json(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); }
function sseHead(res) {
  try { res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' }); } catch { return false; }
  return sseWrite(res, ': ok\n\n');
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', c => { size += c.length; if (size > 32 * 1024 * 1024) { reject(new Error('body too large')); req.destroy(); return; } chunks.push(c); });
    req.on('end', () => {
      try { const data = Buffer.concat(chunks).toString('utf8'); const parsed = data ? JSON.parse(data) : {}; if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('body must be a JSON object'); resolve(parsed); }
      catch (e) { e.status = 400; reject(e); }
    });
    req.on('error', reject);
  });
}
function originRejection(req, port) {
  const origin = req.headers.origin;
  if (origin !== undefined && !new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`]).has(origin)) return `cross-origin request rejected (origin ${origin})`;
  const len = req.headers['content-length'];
  const hasBody = (len !== undefined && len !== '0') || req.headers['transfer-encoding'] !== undefined;
  if (hasBody && !/^application\/json\b/i.test(String(req.headers['content-type'] || ''))) return 'content-type must be application/json';
  return null;
}
function hostRejection(req, port) {
  const host = req.headers.host;
  if (host === undefined) return null;
  const allowed = new Set([`127.0.0.1:${port}`, `localhost:${port}`, `[::1]:${port}`]);
  if (port === 80) for (const h of ['127.0.0.1', 'localhost', '[::1]']) allowed.add(h);
  return allowed.has(String(host).toLowerCase()) ? null : `host not allowed: ${host} (this listener answers to loopback names only)`;
}
function failRequest(res, e) { try { if (res.headersSent) res.destroy(); else json(res, Number.isInteger(e?.status) ? e.status : 500, { error: String(e?.message || e) }); } catch {} }
const server = http.createServer((req, res) => {
  try {
    let url;
    try { url = new URL(req.url, 'http://localhost'); } catch { return json(res, 400, { error: 'malformed request URL' }); }
    const badHost = hostRejection(req, BOUND_PORT);
    if (badHost) return json(res, 403, { error: badHost });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) { const bad = originRejection(req, BOUND_PORT); if (bad) return json(res, 403, { error: bad }); }
    if (req.method === 'GET' && url.pathname === '/api/apps') return json(res, 200, appListeners.map(({ app, server: listener }) => ({ name: app.manifest.name, port: listener.address()?.port ?? null })));
    if (req.method === 'GET' && ['/', '/index.html'].includes(url.pathname)) {
      const links = appListeners.map(({ app, server: listener }) => {
        const port = listener.address()?.port;
        return port ? `<li><a href="http://127.0.0.1:${port}/">${escapeHtml(app.manifest.title)}</a></li>` : `<li>${escapeHtml(app.manifest.title)} (unavailable)</li>`;
      }).join('');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><title>App host</title><h1>The desk page was retired</h1><p>The app host remains.</p><ul>${links}</ul></html>`);
    }
    json(res, 404, { error: 'not found' });
  } catch (e) { failRequest(res, e); }
});
let shuttingDown = false;
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => {
  if (shuttingDown) process.exit(0);
  shuttingDown = true;
  const gone = c => c.proc.exitCode !== null || c.proc.signalCode !== null;
  for (const c of children.values()) killTree(c.proc);
  const poll = setInterval(() => { if ([...children.values()].every(gone)) { clearInterval(poll); process.exit(0); } }, 50);
  setTimeout(() => { clearInterval(poll); for (const c of children.values()) if (!gone(c)) killTree(c.proc, 'SIGKILL'); process.exit(0); }, KILL_GRACE_MS);
});
server.listen(PORT, '127.0.0.1', () => { BOUND_PORT = server.address().port; console.log(`nana code → http://127.0.0.1:${BOUND_PORT}`); });
const APPS_DIR = process.env.DESK_APPS_DIR || path.join(os.homedir(), '.pi', 'agent', 'apps');
appListeners = startAppListeners({
  manifests: loadManifests(APPS_DIR),
  deps: { spawnChild, children, sendRpc, json, readBody, sseHead, sseLine, sseWrite, originRejection, hostRejection, failRequest, promptChild, answerDialog, childEnv, ledgerKeys, noteStageSession, killTree, usage: recordUsage, usageOpen: USAGE.actions.open },
  dirs: { stage: path.join(PUBLIC, 'stage'), public: PUBLIC, blocks: path.join(HERE, '..', '..', 'packages', 'nana-stage', 'lib', 'blocks.mjs') },
});
