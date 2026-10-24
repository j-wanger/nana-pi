/**
 * @module packages/nana-pack/bin/pi-watchdog.mjs
 * @purpose Start pi, or an injected command launch, under a CPU-liveness watchdog that kills and retries flat attempts and cleans up child trees on signals.
 * @inputs launcher argv and child args, child CPU samples, caller accept predicate, optional launch resolver, capture root and spawn callback, and Windows PATH, PATHEXT and pi package metadata
 * @outputs {ok, text, attempt} with captured output, signal-aborted status, parseCpuSample seconds/null,
 *  per-poll `cpu=…s` or `cpu=unreadable` flat=n/m, STALL and attempt lines on stderr, the
 *  RETRIES_NOTICE string, a parse {error}, and piLaunch's own `{command, args}` or `{refused}`
 * @effects process (spawns pi detached, or an injected launch with its requested detached option,
 *  per attempt with NANA_HANDOFF=off — kills its process tree on a stall or signal,
 *  shells out to ps via execSync), disk (a mkdtemp dir per attempt holding the child's stdout and
 *  stderr under the optional capture root; on win32 a PATH lookup, a `package.json` read and the entry's stat)
 * @errors never throws — a bad invocation returns {error:'usage'} or a named message for a non-positive
 *  --stall-secs/--poll or a non-whole --retries, a spawn failure or stall returns ok:false with the
 *  partial text, and a win32 launch refusal is returned as `{refused}` and treated as a failed attempt
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
import { readFileSync, existsSync, mkdtempSync, openSync, closeSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import * as path from 'node:path';
import { killProcessTree } from '../lib/process-tree.mjs';
import { findPi } from '../lib/win-command.mjs';
import { PI_PACKAGE, PI_BIN_NAME, NPM_DIRS, WIN_CPU_TICKS_PER_SECOND } from './worker-config.mjs';

/**
 * Resolve how to launch pi on this platform (R-1125). Not win32: pi by name, argv unchanged —
 * today's behaviour, and the one every POSIX install (npm symlink, pnpm script, the managed
 * launcher) already keeps pi as the watched process with its argv intact. win32: findPi (R-1033)
 * locates the running pi; a `.cmd`/`.bat` npm shim starts through the Node running it, with the
 * npm package's own `pi` bin entry as the first argument and the pi arguments unchanged after it —
 * pi's own managed-install rule (pi.dev install.ps1:1456-1489): the bin, its containment in the
 * package folder and `isFile` are checked the same way, and `process.execPath` runs it, no shell;
 * a located `.exe`/`.com` starts directly. Anything else is refused, named, nothing started.
 * Returns `{command, args}` or `{refused}`, synchronously.
 */
export function piLaunch(piArgs, { platform = process.platform, env = process.env, cwd = process.cwd(), exists, isFile = (p) => { try { return statSync(p).isFile(); } catch { return false; } }, readText = (p) => readFileSync(p, 'utf8'), execPath = process.execPath } = {}) {
  if (platform !== 'win32') return { command: 'pi', args: piArgs };
  const win = path.win32;
  const found = findPi({ env, cwd, exists });
  if (!found) return { refused: 'pi is not on PATH' };
  const ext = win.extname(found).toLowerCase();
  if (ext === '.exe' || ext === '.com') return { command: found, args: piArgs };
  // A .cmd/.bat npm shim: the package sits beside it (the global layout) or one level up through
  // node_modules/.bin (the local layout, matched case-insensitively — NTFS folder names fold case).
  const shimDir = win.dirname(found);
  const lastTwo = shimDir.split(/[\\/]/).filter(Boolean).slice(-2).map((p) => p.toLowerCase());
  const isDotBinLayout = lastTwo.length === 2 && lastTwo[0] === NPM_DIRS[0] && lastTwo[1] === NPM_DIRS[1];
  const packageRoot = isDotBinLayout ? win.dirname(shimDir) : win.join(shimDir, NPM_DIRS[0]);
  const packageDir = win.join(packageRoot, ...PI_PACKAGE.split('/'));
  const packageJsonPath = win.join(packageDir, 'package.json');
  let packageJsonText;
  try {
    packageJsonText = readText(packageJsonPath);
  } catch {
    return { refused: `pi at ${found} is not an npm global install: no ${PI_PACKAGE} package beside it; install pi with npm (pnpm, Volta and the pi.dev installer are not supported by the launchers)` };
  }
  let packageJson;
  try {
    packageJson = JSON.parse(packageJsonText);
  } catch {
    return { refused: `${packageJsonPath} is not valid JSON` };
  }
  if (typeof packageJson !== 'object' || packageJson === null || packageJson.name !== PI_PACKAGE) {
    return { refused: `${packageJsonPath} is not the ${PI_PACKAGE} package` };
  }
  const bin = typeof packageJson.bin === 'string'
    ? packageJson.bin
    : (packageJson.bin !== null && typeof packageJson.bin === 'object' && typeof packageJson.bin[PI_BIN_NAME] === 'string' ? packageJson.bin[PI_BIN_NAME] : undefined);
  if (!bin) return { refused: `${PI_PACKAGE} at ${packageDir} declares no ${PI_BIN_NAME} bin` };
  const entry = win.resolve(packageDir, bin);
  const relative = win.relative(packageDir, entry);
  if (relative.startsWith('..') || win.isAbsolute(relative)) {
    return { refused: `pi bin ${bin} resolves outside ${packageDir}` };
  }
  if (!isFile(entry)) return { refused: `pi entry ${entry} is not a file` };
  return { command: execPath, args: [entry, ...piArgs] };
}

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

/** Parse one CPU reader result as seconds. Windows emits a whole .NET TimeSpan tick count;
 *  ps emits [dd-][hh:]mm:ss[.fraction]. Surrounding whitespace is ignored; all other text is
 *  unreadable and returns null. */
export function parseCpuSample(raw, platform = process.platform) {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (platform === 'win32') {
    if (!/^\d+$/.test(text)) return null;
    const ticks = Number(text);
    return Number.isFinite(ticks) ? ticks / WIN_CPU_TICKS_PER_SECOND : null;
  }
  const match = /^(?:(\d+)-)?(?:(\d+):)?(\d+):([0-5]\d(?:\.\d+)?)$/.exec(text);
  if (!match) return null;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3]);
  const seconds = Number(match[4]);
  const total = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) ? total : null;
}

// CPU-time (seconds) of a pid via a whole TimeSpan tick count on win32 or ps time elsewhere.
function cpuSeconds(pid) {
  try {
    const raw = process.platform === 'win32'
      ? execSync(`powershell -NoProfile -Command \"(Get-Process -Id ${pid}).TotalProcessorTime.Ticks\"`, { encoding: 'utf8' })
      : execSync(`ps -o time= -p ${pid}`, { encoding: 'utf8' });
    return parseCpuSample(raw);
  } catch {
    return null;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// SIGKILL the child's whole PROCESS GROUP (not just the pi pid): a stalled pi may hold the
// bad socket in a grandchild that would otherwise orphan and accumulate across retries —
// exactly the failure mode this tool exists for. `detached:true` makes POSIX children group leaders;
// Windows uses taskkill on the pid and needs no detached process group.
function killGroup(child, signal = 'SIGKILL') {
  killProcessTree(child?.pid, { signal });
  if (process.platform !== 'win32') try { child.kill(signal); } catch { /* already dead */ }
}

const nonEmpty = () => true;

async function runOnce(tag, opts, attempt, onChild, interrupted, signalWait, startedAt) {
  const { piArgs, stallSecs, pollSecs, cwd, accept = nonEmpty, childEnv = {}, maxSecs } = opts;
  const tmp = join(mkdtempSync(join(opts.captureRoot ?? tmpdir(), 'pi-review-')), 'out.txt');
  const fd = openSync(tmp, 'w'); // 'w' truncates; stdio writes go here
  // Fresh session each attempt (a stalled session id can re-stall): append a per-attempt --name.
  const args = [...piArgs, '--name', `${tag}-a${attempt}-${Date.now() % 100000}`];
  const launcher = opts.launch ?? piLaunch;
  const launch = launcher(args, { cwd });
  if (launch.refused) {
    // Nothing started: close and remove the capture dir, and report it as a failed attempt, the
    // same way today's spawn ENOENT is — a refusal is retried, named, every time (residual, not a
    // regression; see pack README and REQUIREMENTS.md R-1125's evidence note).
    try { closeSync(fd); } catch { /* already closed */ }
    try { rmSync(dirname(tmp), { recursive: true, force: true }); } catch { /* best-effort cleanup */ }
    process.stderr.write(`[${tag}] pi launch refused: ${launch.refused}\n`);
    return { ok: false, text: `pi launch refused: ${launch.refused}` };
  }
  // NANA_HANDOFF=off: a watchdog child is a NON-WRITER — it neither picks up nor writes the
  // nana handoff (L3; the role comes from this explicit marker, never the tool list).
  const child = spawn(launch.command, launch.args, { ...launch.options, cwd, stdio: ['ignore', fd, fd], detached: launch.options?.detached ?? true, env: { ...process.env, NANA_HANDOFF: 'off', ...childEnv } });

  let spawnErr = null;
  onChild(child);
  try { opts.onSpawn?.(child); } catch { /* a missing identity record leaves conservative hard-kill behaviour */ }
  // `ended` is settled by the child's own 'exit' or 'error' event, registered before the poll
  // loop starts — so a poll never misses it, unlike a 'close' listener added only after a wake
  // (R-1393/R-1395: that listener could attach AFTER 'close' already fired for a signal-killed
  // child, leaving the await unsettled forever — pi-review's exit 13).
  let notifyEnded;
  const ended = new Promise((resolve) => { notifyEnded = resolve; });
  child.on('exit', () => notifyEnded());
  child.on('error', (e) => { spawnErr = e; notifyEnded(); }); // e.g. ENOENT if pi not on PATH — no uncaught throw

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
    // R-1390/R-1391/R-1392: `ended` races the poll timer so an attempt closes as soon as pi
    // exits, not at the next tick; the timer is cleared either way — pi-review exits on its
    // own, so an uncleared timer would keep the event loop (and pi-review) alive for the rest
    // of the poll interval.
    let timer;
    const timerDone = new Promise((r) => { timer = setTimeout(r, Math.min(pollSecs * 1000, remainingMs)); });
    await Promise.race([timerDone, signalWait, ended]);
    clearTimeout(timer);
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
    await new Promise((r) => setImmediate(r));
    if (child.exitCode !== null || child.signalCode !== null) break;
    if (cpu === null) {
      flatPolls++;
      process.stderr.write(`  [${tag} a${attempt}] cpu=unreadable flat=${flatPolls}/${maxFlat}\n`);
    } else {
      if (cpu === lastCpu) flatPolls++; else flatPolls = 0;
      lastCpu = cpu;
      process.stderr.write(`  [${tag} a${attempt}] cpu=${cpu}s flat=${flatPolls}/${maxFlat}\n`);
    }
    if (flatPolls >= maxFlat) {
      process.stderr.write(`  [${tag} a${attempt}] STALL (${stallSecs}s flat CPU) — killing group\n`);
      killGroup(child);
      await sleep(1000);
      return { ok: false, text: readOut() };
    }
  }
  // Child exited on its own — `ended` is already settled (that's why the loop broke); read output.
  await ended;
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
