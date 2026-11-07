/**
 * @module apps/desk/test/stage-key-persistence.test.mjs
 * @purpose Pin persisted app signing keys across restart and rename, plus store failure isolation.
 * @inputs The real app host, temporary manifests/session files, StageKeyStore and deterministic RPC children.
 * @outputs Awaited bounded TAP tests.
 * @effects disk (temporary homes and records), network (ephemeral loopback), process (host and stub).
 * @errors Assertion failures and timeouts fail the owning case.
 */
import assert from 'node:assert/strict';
import { test } from './test-case.mjs';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { signBlock } from '../../../packages/nana-stage/lib/sign.mjs';
import { StageKeyStore } from '../stage-keys.mjs';
import { tmpDir } from "./tmp-dir.mjs";
import { stopServer } from './stop-server.mjs';

const options = { timeout: 30000 };
const serverPath = fileURLToPath(new URL('../server.mjs', import.meta.url));
const signPath = new URL('../../../packages/nana-stage/lib/sign.mjs', import.meta.url).href;
const pause = ms => new Promise(r => setTimeout(r, ms));
const post = (base, route, body = {}) => fetch(base + route, { method: 'POST', signal: AbortSignal.timeout(5000), headers: { 'content-type': 'application/json', origin: base }, body: JSON.stringify(body) }).then(async r => { assert.equal(r.status, 200, await r.clone().text()); return r.json(); });
const rawBlock = id => ({ id, type: 'card', title: 'X', scope: 's', fields: [], slot: 'main', show: true, produced_by: { tool: 'read', args: {}, toolCallId: 'call', at: '2026-11-07T00:00:00Z' } });
const signed = (id, key) => { const b = rawBlock(id); return { ...b, produced_by: { ...b.produced_by, sig: signBlock(key, b) } }; };
const key = () => crypto.randomBytes(32).toString('hex');
const record = (dir, id) => path.join(dir, id + '.json');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));

// req: R-3797 R-437 R-438 R-439 R-440 R-443 R-444
await test('R-3797: restart and renamed manifest session keep issued keys and redact forgeries without unrelated writes', options, async () => {
  const home = tmpDir(path.join(os.tmpdir(), 'desk-stagekey-'));
  const apps = path.join(home, 'apps'), agent = path.join(home, 'agent'), store = path.join(home, 'keys');
  const sessions = path.join(agent, 'sessions', 'project');
  for (const dir of [apps, sessions]) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(sessions, 'session.jsonl');
  const id = 'persisted-session';
  // Existing manifest session, malformed/non-object prefix, CRLF, trailing spaces/tabs,
  // and no final newline exercise the surviving bounded session-header reader.
  const issued = key(), other = key();
  fs.writeFileSync(file, ['bad', 'null', JSON.stringify({ type: 'session', version: 3, id, cwd: home }), JSON.stringify({ id: 'one', parentId: null, type: 'custom', customType: 'nana-block', data: signed('old', issued) }), JSON.stringify({ id: 'two', parentId: 'one', type: 'custom', customType: 'nana-block', data: signed('forged', other) }), JSON.stringify({ id: 'three', parentId: 'two', type: 'custom', customType: 'nana-block', data: signed('also-old', other) }), JSON.stringify({ id: 'four', parentId: 'three', type: 'custom', customType: 'nana-block', data: signed('unknown-key', key()) })].map(l => l + ' \t').join('\r\n'));
  new StageKeyStore({ dir: store }).record(id, issued);
  // A second issued key proves ledger verification uses the whole issuance set;
  // the forged block is tampered after signing, not merely signed with an old key.
  const entries = fs.readFileSync(file, 'utf8').replace('"id":"forged"', '"id":"tampered"');
  fs.writeFileSync(file, entries);
  new StageKeyStore({ dir: store }).seed(id, [other]);
  const notes = path.join(home, 'operator-notes.txt'), settings = path.join(agent, 'settings.json');
  fs.writeFileSync(notes, 'unrelated\r\nbytes\t'); fs.writeFileSync(settings, '{"keep":"owner"}\n');
  const untouched = new Map([notes, settings].map(f => [f, fs.readFileSync(f)]));
  const out = path.join(home, 'spawn.jsonl'), noState = path.join(home, 'no-state');
  const stub = path.join(home, 'pi.cjs');
  fs.writeFileSync(stub, `#!/usr/bin/env node
const fs=require('node:fs');
const file=process.argv[process.argv.indexOf('--session')+1];
fs.appendFileSync(${JSON.stringify(out)}, JSON.stringify({key:process.env.NANA_STAGE_KEY,file})+'\\n');
const say=o=>process.stdout.write(JSON.stringify(o)+'\\n');
setTimeout(()=>say({type:'extension_ui_request',method:'setStatus',statusKey:'nana-tools',statusText:'ready'}),20);
require('node:readline').createInterface({input:process.stdin}).on('line',async line=>{
 const c=JSON.parse(line), ok=data=>say({type:'response',id:c.id,command:c.type,success:true,data});
 if(c.type==='get_state') { if(fs.existsSync(${JSON.stringify(noState)})) say({type:'response',id:c.id,success:false}); else ok({sessionId:${JSON.stringify(id)},sessionFile:file}); }
 else if(c.type==='get_entries') ok({entries:fs.readFileSync(file,'utf8').split('\\n').flatMap(l=>{try {const e=JSON.parse(l);return e&&e.type!=='session'?[e]:[];}catch{return []}}),leafId:'four'});
 else if(c.type==='prompt') {const {signBlock}=await import(${JSON.stringify(signPath)});const b=${JSON.stringify(signed('foreign-live', other))};ok({});say({type:'tool_execution_end',toolName:'read',toolCallId:'call',result:{content:[],details:{blocks:[b]}}});}
 else ok({});
});
`, { mode: 0o755 });
  let bin = stub;
  if (process.platform === 'win32') { bin = path.join(home, 'pi.cmd'); fs.writeFileSync(bin, `@echo off\r\n"${process.execPath}" "${stub}" %*\r\n`); }
  const manifest = path.join(apps, 'alpha.json');
  const setSession = session => fs.writeFileSync(manifest, JSON.stringify({ port: 0, cwd: home, tools: ['read'], session }));
  setSession(file);
  let server;
  async function stop() {
    await stopServer(server);
  }
  async function start() {
    let log = '';
    server = spawn(process.execPath, [serverPath], { cwd: home, env: { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: agent, DESK_APPS_DIR: apps, DESK_STAGE_KEYS: store, DESK_PI_BIN: bin, DESK_PORT: '0' }, stdio: ['ignore','pipe','pipe'] });
    server.stdout.on('data', c => { log += c; }); server.stderr.on('data', c => { log += c; });
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const match = log.match(/nana code → http:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { const registry = await fetch(`http://127.0.0.1:${match[1]}/api/apps`).then(r => r.json()); if (registry[0]?.port) return `http://127.0.0.1:${registry[0].port}`; }
      if (server.exitCode !== null) throw new Error(log);
      await pause(30);
    }
    throw new Error('startup timeout: ' + log);
  }
  async function ledger(base) { return fetch(base + '/api/entries', { signal: AbortSignal.timeout(5000) }).then(r => r.json()); }
  try {
    for (let run = 0; run < 3; run++) {
      if (run === 2) { const renamed = path.join(sessions, 'renamed.jsonl'); fs.renameSync(file, renamed); setSession(renamed); }
      const base = await start(); await post(base, '/api/session');
      const spawned = fs.readFileSync(out, 'utf8').trim().split('\n').map(JSON.parse).at(-1);
      assert.equal(spawned.key, issued, 'resume reuses the most recent issued key');
      const result = await ledger(base);
      assert.deepEqual(result.entries.map(e => e.customType), ['nana-block','nana-block-rejected','nana-block','nana-block-rejected']);
      fs.writeFileSync(noState, '');
      assert.deepEqual((await ledger(base)).entries.map(e => e.customType), ['nana-block','nana-block-rejected','nana-block-rejected','nana-block-rejected']);
      fs.unlinkSync(noState);
      const stream = new AbortController();
      const response = await fetch(base + '/api/events', { signal: stream.signal });
      const reader = response.body.getReader();
      await post(base, '/api/prompt', { message: 'foreign-live' });
      let text = '';
      while (!text.includes('tool_execution_end')) text += new TextDecoder().decode((await reader.read()).value);
      stream.abort();
      const event = text.split('\n').find(l => l.includes('tool_execution_end'));
      assert.deepEqual(JSON.parse(event.slice(6)).result.details.blocks, [], 'recorded foreign key does not pass the live path');
      await stop();
      for (const [f, bytes] of untouched) assert.deepEqual(fs.readFileSync(f), bytes, 'unrelated file changed');
      assert.equal(read(record(store, id)).keys[0], issued);
    }
  } finally { await stop(); }
});

// Store checks retained from the original persistence harness; no session-control
// HTTP route remains, so fork/clone queue and confirmation cases retire with it.
// req: R-437 R-444
await test('store: issuance cap, modes, atomic failure, retry, corrupt isolation and root-scoped pruning', options, () => {
  const home = tmpDir(path.join(os.tmpdir(), 'stagekey-store-'));
  const dir = path.join(home, 'nested', 'keys');
  const log = () => {};
  const st = new StageKeyStore({ dir, log });
  const keys = Array.from({ length: 9 }, key);
  for (const k of keys) st.record('sid', k);
  assert.deepEqual(new StageKeyStore({ dir, log }).keysFor('sid'), keys.slice().reverse().slice(0,8));
  assert.equal(st.record('sid', keys[8]), false);
  if (process.platform !== 'win32') { assert.equal(fs.statSync(dir).mode & 0o777, 0o700); assert.equal(fs.statSync(record(dir, 'sid')).mode & 0o777, 0o600); }
  assert.equal(st.record('../escape', keys[0]), false); assert.deepEqual(st.keysFor('a/b'), []);
  const before = fs.readFileSync(record(dir, 'sid'));
  const rename = fs.renameSync, failed = key(), otherKey = key();
  try { fs.renameSync = () => { throw new Error('interrupted rename'); }; assert.doesNotThrow(() => st.record('sid', failed)); st.record('retry', failed); }
  finally { fs.renameSync = rename; }
  assert.deepEqual(fs.readFileSync(record(dir, 'sid')), before);
  assert.ok(!fs.readdirSync(dir).some(f => f.includes('.tmp')));
  assert.ok(!fs.existsSync(record(dir, 'retry')));
  new StageKeyStore({ dir, log }).record('retry', otherKey);
  assert.ok(st.keysFor('retry').includes(otherKey));
  assert.equal(st.record('retry', failed), false);
  assert.deepEqual(new Set(new StageKeyStore({ dir, log }).keysFor('retry')), new Set([failed, otherKey]));
  const a = new StageKeyStore({ dir, log }), b = new StageKeyStore({ dir, log });
  const shared = Array.from({ length: 4 }, key);
  a.keysFor('shared'); shared.forEach((k,i) => (i%2 ? a : b).record('shared', k));
  assert.deepEqual(a.keysFor('shared'), b.keysFor('shared')); assert.ok(shared.every(k => a.keysFor('shared').includes(k)));
  const fresh = key(), inherited = [key(),key()];
  st.record('dest', fresh); assert.equal(st.seed('dest', inherited), true); assert.deepEqual(st.keysFor('dest'), [fresh,...inherited]); assert.equal(st.seed('dest', inherited), false);
  fs.writeFileSync(record(dir, 'sid'), '{broken'); assert.deepEqual(new StageKeyStore({ dir, log }).keysFor('sid'), []);
  assert.ok(fs.readdirSync(dir).some(f => f.startsWith('sid.json.corrupt-'))); assert.ok(st.keysFor('retry').includes(failed));
  const pre = path.join(home, 'pre'); fs.mkdirSync(pre); fs.chmodSync(pre, 0o777);
  new StageKeyStore({ dir: pre, log }).record('sid', fresh);
  if (process.platform !== 'win32') assert.equal(fs.statSync(pre).mode & 0o777, 0o777);
  new StageKeyStore({ dir, log, knownSessionIds: () => new Set() }).keysFor('dest'); assert.ok(fs.existsSync(record(dir, 'dest')));
  fs.writeFileSync(path.join(dir, 'operator.notes.json'), '{}'); fs.writeFileSync(path.join(dir, 'sid.json.123.tmp'), '{}');
  new StageKeyStore({ dir, log, knownSessionIds: () => new Set(['retry']) }).keysFor('retry');
  assert.ok(!fs.existsSync(record(dir, 'dest'))); assert.ok(fs.existsSync(record(dir, 'retry')));
  for (const f of ['operator.notes.json','sid.json.123.tmp']) assert.ok(fs.existsSync(path.join(dir, f)));
  const roots = [path.join(home,'default'),path.join(home,'custom')]; roots.forEach(r => fs.mkdirSync(r));
  const sharedDir = path.join(home,'shared');
  const at = (sessionsRoot, known) => new StageKeyStore({ dir: sharedDir, log, sessionsRoot, knownSessionIds: () => new Set(known) });
  at(roots[0], ['liveD','goneD']).record('liveD', fresh); at(roots[0], ['liveD','goneD']).record('goneD', failed);
  at(roots[1], ['liveC','goneC']).record('liveC', otherKey); at(roots[1], ['liveC','goneC']).record('goneC', inherited[0]);
  at(roots[1], ['liveC']).keysFor('liveC'); assert.ok(!fs.existsSync(record(sharedDir,'goneC'))); assert.ok(fs.existsSync(record(sharedDir,'goneD')));
  at(roots[0], ['liveD']).keysFor('liveD'); assert.ok(!fs.existsSync(record(sharedDir,'goneD'))); assert.ok(fs.existsSync(record(sharedDir,'liveC')));
  assert.equal(read(record(sharedDir,'liveC')).sessionsRoot, fs.realpathSync(roots[1]));
  fs.writeFileSync(record(sharedDir,'legacy'), JSON.stringify({ v:1,keys:[fresh],updatedAt:1 }));
  at(roots[1], ['liveC']).keysFor('liveC'); assert.ok(fs.existsSync(record(sharedDir,'legacy')));
  new StageKeyStore({ dir: sharedDir, log, knownSessionIds: () => new Set(['liveD']) }).keysFor('liveD'); assert.ok(!fs.existsSync(record(sharedDir,'legacy')));
});
