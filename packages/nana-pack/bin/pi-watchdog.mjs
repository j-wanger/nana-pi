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
// The success heuristic: the child exited 0 AND its output is non-empty AND contains a
// review-shaped token (VERDICT/LAND/FAIL/finding) — a stall produces an empty/partial file.

import { spawn, execSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, openSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reviewShaped } from './review-round.mjs';

/** Parse the launcher's argv. Wrapper options are read ONLY from the slice before `--` (sol
 *  review 2026-09-16, F): a pi arg must never be mistaken for --out or any watchdog knob.
 *  Returns {error} or {ownArgs, outPath, stallSecs, retries, pollSecs, piArgs}. */
export function parseWatchdogArgv(argv) {
  const sep = argv.indexOf('--');
  const ownArgs = sep >= 0 ? argv.slice(0, sep) : argv;
  const arg = (name, def) => {
    const i = ownArgs.indexOf(name);
    return i >= 0 && i + 1 < ownArgs.length ? ownArgs[i + 1] : def;
  };
  const outPath = arg('--out', null);
  const stallSecs = Number(arg('--stall-secs', '75'));
  const retries = Number(arg('--retries', '3'));
  const pollSecs = Number(arg('--poll', '15'));
  if (!outPath || sep < 0 || sep === argv.length - 1) return { error: 'usage' };
  // Guard the numeric knobs: a NaN/0 would make the poll loop never fire (or busy-spin),
  // which would hang the watchdog ITSELF — the exact failure it exists to prevent.
  if (![stallSecs, retries, pollSecs].every((n) => Number.isFinite(n) && n > 0)) {
    return { error: '--stall-secs, --retries, --poll must be positive numbers' };
  }
  return { ownArgs, outPath, stallSecs, retries, pollSecs, piArgs: argv.slice(sep + 1) };
}

// CPU-time (seconds) of a pid via `ps -o time=` (mm:ss or hh:mm:ss). 0 if gone.
function cpuSeconds(pid) {
  try {
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
function killGroup(child) {
  try { process.kill(-child.pid, 'SIGKILL'); } catch { /* group already gone */ }
  try { child.kill('SIGKILL'); } catch { /* already dead */ }
}

async function runOnce(tag, { piArgs, stallSecs, pollSecs }, attempt) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'pi-review-')), 'out.txt');
  const fd = openSync(tmp, 'w'); // 'w' truncates; stdio writes go here
  // Fresh session each attempt (a stalled session id can re-stall): append a per-attempt --name.
  const args = [...piArgs, '--name', `${tag}-a${attempt}-${Date.now() % 100000}`];
  // NANA_HANDOFF=off: a watchdog child is a NON-WRITER — it neither picks up nor writes the
  // nana handoff (L3; the role comes from this explicit marker, never the tool list).
  const child = spawn('pi', args, { stdio: ['ignore', fd, fd], detached: true, env: { ...process.env, NANA_HANDOFF: 'off' } });

  let spawnErr = null;
  child.on('error', (e) => { spawnErr = e; }); // e.g. ENOENT if pi not on PATH — no uncaught throw

  const readOut = () => (closeSync(fd), existsSync(tmp) ? readFileSync(tmp, 'utf8') : '');
  let lastCpu = -1, flatPolls = 0;
  const maxFlat = Math.max(1, Math.ceil(stallSecs / pollSecs));
  while (true) {
    await sleep(pollSecs * 1000);
    if (spawnErr) { closeSync(fd); return { ok: false, text: `pi spawn failed: ${spawnErr.message}` }; }
    if (child.exitCode !== null || child.signalCode !== null) break; // exited
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
  return { ok: child.exitCode === 0 && text.trim() !== '' && reviewShaped(text), text };
}

/** Run `pi <piArgs>` with retries. Returns {ok, text, attempt} (text = last output). */
export async function runWatchdog(tag, opts) {
  let last = '';
  for (let a = 1; a <= opts.retries; a++) {
    process.stderr.write(`[${tag}] attempt ${a}/${opts.retries}\n`);
    const { ok, text } = await runOnce(tag, opts, a);
    last = text;
    if (ok) return { ok: true, text, attempt: a };
    process.stderr.write(`[${tag}] attempt ${a} did not produce a review${a < opts.retries ? ' — retrying' : ''}\n`);
  }
  return { ok: false, text: last, attempt: opts.retries };
}
