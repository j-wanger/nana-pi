/**
 * @module packages/nana-pack/bin/pi-watchdog.mjs
 * @purpose Run `pi` under a CPU-liveness watchdog that kills and retries attempts whose CPU time stays
 *  flat and cleans up child trees on termination signals.
 * @inputs the launcher's argv before `--` (--out, --stall-secs, --retries, --poll) and the pi args after
 *  it, the child's CPU seconds from `ps` or PowerShell, and the caller's accept(text) predicate
 * @outputs {ok, text, attempt} with captured output, signal-aborted status, per-poll `cpu=…s flat=n/m`, STALL and
 *  attempt lines on stderr, the RETRIES_NOTICE string, or a parse {error}
 * @effects process (spawns `pi` detached per attempt with NANA_HANDOFF=off, kills its process tree on a
 *  stall or signal, shells out to ps via execSync), disk (a mkdtemp dir per attempt holding the child's stdout and
 *  stderr)
 * @errors never throws — a bad invocation returns {error:'usage'} or a named message for a non-positive
 *  --stall-secs/--poll or a non-whole --retries, and a spawn failure or stall returns ok:false with the
 *  partial text
 */
// pi-watchdog.mjs — the liveness WATCHDOG shared by pi-review (reviews, round-capped) and
// pi-worker (workers, no ledger). Moved verbatim out of pi-review.mjs in T2b; behaviour unchanged.
//
// WHY: the Codex login uses the ChatGPT SUBSCRIPTION backend (not the metered API), which
// intermittently STALLS a request; `pi` has no request timeout, so it hangs indefinitely
// (0 CPU, 0 TCP — measured 0.84s CPU over 36 min). This polls the child's CPU-time; if it stays
// flat for --stall-secs, the request is stalled → kill + retry with a fresh session. A healthy
// call accumulates CPU and completes; a bad stretch fails fast + retries.
// (FRICTIONS: pi-reviewer-watchdog, 2026-07-17.) The endpoint stall is intermittent, not a
// login problem — auth is checked by pi itself; this only manages the hang.
// Success: the child exited 0 AND its output is non-empty AND the caller's `accept(text)` holds
// (T2b fix r3, sol r2 #13: the predicate is a PARAMETER — pi-review passes reviewShaped; a worker
// passes none). This module imports no ledger or review code.
// --retries N = re-attempts AFTER the first (N+1 attempts total); the default is the caller's
// (pi-review 2 → 3 attempts, unchanged; pi-worker 0 — a retried worker repeats its mutations).

import { spawn, execSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, openSync, closeSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/** Parse the launcher's argv. Wrapper options are read ONLY from the slice before `--` (sol
 *  review 2026-09-16, F): a pi arg must never be mistaken for --out or any watchdog knob.
 *  Returns {error} or {ownArgs, outPath, stallSecs, retries, pollSecs, piArgs}. */
export function parseWatchdogArgv(argv, { defaultRetries = 2 } = {}) {
  const sep = argv.indexOf('--');
  const ownArgs = sep >= 0 ? argv.slice(0, sep) : argv;
  const arg = (name, def) => {
    const i = ownArgs.indexOf(name);
    return i >= 0 && i + 1 < ownArgs.length ? ownArgs[i + 1] : def;
  };
  const outPath = arg('--out', null);
  const stallSecs = Number(arg('--stall-secs', '75'));
  const retries = Number(arg('--retries', String(defaultRetries)));
  const pollSecs = Number(arg('--poll', '15'));
  if (!outPath || sep < 0 || sep === argv.length - 1) return { error: 'usage' };
  // Guard the numeric knobs: a NaN/0 would make the poll loop never fire (or busy-spin),
  // which would hang the watchdog ITSELF — the exact failure it exists to prevent.
  if (![stallSecs, pollSecs].every((n) => Number.isFinite(n) && n > 0)) {
    return { error: '--stall-secs and --poll must be positive numbers' };
  }
  if (!Number.isInteger(retries) || retries < 0) return { error: '--retries must be a whole number >= 0 (re-attempts after the first)' };
  return { ownArgs, outPath, stallSecs, retries, retriesExplicit: ownArgs.includes('--retries'), pollSecs, piArgs: argv.slice(sep + 1) };
}

/** One-line notice printed when --retries is passed explicitly (sol r3 LOW): the contract changed
 *  in T2b from "N attempts" to "N re-attempts after the first", so an old explicit value now runs
 *  one more attempt. Printed only for an explicit flag — the defaults are unchanged. */
export const RETRIES_NOTICE = (tag, n) =>
  `${tag}: note — --retries ${n} = ${n} re-attempt(s) after the first (${n + 1} attempt(s) total); before T2b it meant ${n} attempt(s) total\n`;

// CPU-time (seconds) of a pid via `ps -o time=` (mm:ss or hh:mm:ss). 0 if gone.
function cpuSeconds(pid) {
  try {
    if (process.platform === 'win32') {
      const raw = execSync(`powershell -NoProfile -Command \"(Get-Process -Id ${pid}).CPU\"`, { encoding: 'utf8' }).trim();
      const seconds = Number(raw);
      return Number.isFinite(seconds) ? seconds : 0;
    }
    const raw = execSync(`ps -o time= -p ${pid}`, { encoding: 'utf8' }).trim();
    if (!raw) return 0;
    const parts = raw.split(':').map(Number);
    return parts.reduce((acc, n) => acc * 60 + n, 0);
  } catch {
    return 0;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// SIGKILL the child's whole PROCESS GROUP (not just the pi pid): a stalled pi may hold the
// bad socket in a grandchild that would otherwise orphan and accumulate across retries —
// exactly the failure mode this tool exists for. `detached:true` makes pi a group leader.
function killGroup(child, signal = 'SIGKILL') {
  if (process.platform === 'win32') {
    try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: 'ignore' }); } catch { /* tree already gone */ }
  } else {
    try { process.kill(-child.pid, signal); } catch { /* group already gone */ }
    try { child.kill(signal); } catch { /* already dead */ }
  }
}

const nonEmpty = () => true;

async function runOnce(tag, { piArgs, stallSecs, pollSecs, cwd, accept = nonEmpty, childEnv = {}, maxSecs }, attempt, onChild, interrupted, signalWait, startedAt) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'pi-review-')), 'out.txt');
  const fd = openSync(tmp, 'w'); // 'w' truncates; stdio writes go here
  // Fresh session each attempt (a stalled session id can re-stall): append a per-attempt --name.
  const args = [...piArgs, '--name', `${tag}-a${attempt}-${Date.now() % 100000}`];
  // NANA_HANDOFF=off: a watchdog child is a NON-WRITER — it neither picks up nor writes the
  // nana handoff (L3; the role comes from this explicit marker, never the tool list).
  const child = spawn('pi', args, { cwd, stdio: ['ignore', fd, fd], detached: true, env: { ...process.env, NANA_HANDOFF: 'off', ...childEnv } });

  let spawnErr = null;
  onChild(child);
  child.on('error', (e) => { spawnErr = e; }); // e.g. ENOENT if pi not on PATH — no uncaught throw

  const cleanupCapture = () => {
    try { rmSync(dirname(tmp), { recursive: true, force: true }); } catch { /* best-effort cleanup */ }
  };
  const readOut = () => {
    try { closeSync(fd); } catch { /* already closed */ }
    try { return existsSync(tmp) ? readFileSync(tmp, 'utf8') : ''; }
    finally { cleanupCapture(); }
  };
  let lastCpu = -1, flatPolls = 0;
  const maxFlat = Math.max(1, Math.ceil(stallSecs / pollSecs));
  while (true) {
    const remainingMs = maxSecs ? Math.max(0, maxSecs * 1000 - (Date.now() - startedAt)) : pollSecs * 1000;
    await Promise.race([sleep(Math.min(pollSecs * 1000, remainingMs)), signalWait]);
    if (spawnErr) {
      try { closeSync(fd); } catch { /* already closed */ }
      cleanupCapture();
      return { ok: false, text: `pi spawn failed: ${spawnErr.message}` };
    }
    if (interrupted()) {
      killGroup(child, 'SIGKILL');
      await new Promise((r) => (child.exitCode !== null || child.signalCode !== null ? r() : child.once('close', r)));
      return { ok: false, text: readOut(), signal: interrupted() };
    }
    if (child.exitCode !== null || child.signalCode !== null) break; // exited
    if (maxSecs && Date.now() - startedAt >= maxSecs * 1000) {
      process.stderr.write(`[${tag}] FAILED: wall-clock ceiling ${maxSecs}s reached — killing process group\n`);
      killGroup(child);
      await new Promise((r) => (child.exitCode !== null || child.signalCode !== null ? r() : child.once('close', r)));
      return { ok: false, text: readOut(), ceiling: true };
    }
    const cpu = cpuSeconds(child.pid);
    if (cpu === lastCpu) flatPolls++; else flatPolls = 0;
    lastCpu = cpu;
    process.stderr.write(`  [${tag} a${attempt}] cpu=${cpu}s flat=${flatPolls}/${maxFlat}\n`);
    if (flatPolls >= maxFlat) {
      process.stderr.write(`  [${tag} a${attempt}] STALL (${stallSecs}s flat CPU) — killing group\n`);
      killGroup(child);
      await sleep(1000);
      return { ok: false, text: readOut() };
    }
  }
  // Child exited on its own — wait for close, read output.
  await new Promise((r) => (child.exitCode !== null ? r() : child.on('close', r)));
  const text = readOut();
  return { ok: child.exitCode === 0 && text.trim() !== '' && accept(text), text };
}

/** Run `pi <piArgs>`: one attempt plus opts.retries re-attempts. opts.accept(text) = the caller's
 *  success predicate beyond exit 0 + non-empty output. Returns {ok, text, attempt} (text = last). */
export async function runWatchdog(tag, opts) {
  const attempts = opts.retries + 1;
  let last = '', signal = null, active = null, notifySignal;
  const signalWait = new Promise((resolve) => { notifySignal = resolve; });
  const startedAt = Date.now();
  const stop = (name) => {
    if (signal) return;
    signal = name;
    if (active) killGroup(active, 'SIGKILL');
    notifySignal();
  };
  const handlers = new Map([['SIGINT', () => stop('SIGINT')], ['SIGTERM', () => stop('SIGTERM')], ['SIGHUP', () => stop('SIGHUP')]]);
  for (const [name, handler] of handlers) process.on(name, handler);
  try {
    for (let a = 1; a <= attempts; a++) {
      if (signal) break;
      const validation = opts.validateAttempt?.();
      if (validation) {
        process.stderr.write(`[${tag}] FAILED before attempt ${a}: ${validation}\n`);
        return { ok: false, text: last, attempt: a - 1, validationFailed: true };
      }
      if (opts.maxSecs && Date.now() - startedAt >= opts.maxSecs * 1000) {
        process.stderr.write(`[${tag}] FAILED: wall-clock ceiling ${opts.maxSecs}s reached — refusing another attempt\n`);
        return { ok: false, text: last, attempt: a - 1, ceiling: true };
      }
      process.stderr.write(`[${tag}] attempt ${a}/${attempts}\n`);
      const result = await runOnce(tag, opts, a, (child) => { active = child; }, () => signal, signalWait, startedAt);
      if (result.ceiling) return { ok: false, text: result.text, attempt: a, ceiling: true };
      active = null;
      last = result.text;
      if (result.signal || signal) return { ok: false, text: last, attempt: a, signal: signal ?? result.signal };
      if (result.ok) return { ok: true, text: last, attempt: a };
      process.stderr.write(`[${tag}] attempt ${a} did not succeed${a < attempts ? ' — retrying' : ''}\n`);
    }
    return { ok: false, text: last, attempt: attempts, signal };
  } finally {
    for (const [name, handler] of handlers) process.removeListener(name, handler);
  }
}
