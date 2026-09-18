#!/usr/bin/env node
// pi-review.mjs — run a `pi` (Codex) review under a liveness WATCHDOG with retry.
//
// WHY: the Codex login uses the ChatGPT SUBSCRIPTION backend (not the metered API), which
// intermittently STALLS a request; `pi` has no request timeout, so it hangs indefinitely
// (0 CPU, 0 TCP — measured 0.84s CPU over 36 min). This wrapper polls the child's CPU-time;
// if it stays flat for --stall-secs, the request is stalled → kill + retry with a fresh
// session. A healthy call accumulates CPU and completes; a bad stretch fails fast + retries.
// (FRICTIONS: pi-reviewer-watchdog, 2026-07-17.) The endpoint stall is intermittent, not a
// login problem — auth is checked by pi itself; this only manages the hang.
//
// Usage:
//   node pi-review.mjs --out <file> [--stall-secs 75] [--retries 3] [--poll 15] [--over-cap <why>] -- <pi args...>
// Exit: 0 = a review was produced (written to --out); 1 = all retries stalled / bad args.
// The success heuristic: the child exited 0 AND --out is non-empty AND contains a review-shaped
// token (VERDICT/LAND/FAIL/finding) — a stall produces an empty/partial file.

import { spawn, execSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REVIEW_ROUND_CAP, roundFromOutPath, roundCapVerdict } from './review-round.mjs';

// Wrapper options are parsed ONLY from the argv slice before `--` (sol review 2026-09-16, F):
// a pi arg must never be mistaken for --out/--over-cap or any watchdog knob.
const sep = process.argv.indexOf('--');
const ownArgs = sep >= 0 ? process.argv.slice(0, sep) : process.argv;
function arg(name, def) {
  const i = ownArgs.indexOf(name);
  return i >= 0 && i + 1 < ownArgs.length ? ownArgs[i + 1] : def;
}

const outPath = arg('--out', null);
const stallSecs = Number(arg('--stall-secs', '75'));
const retries = Number(arg('--retries', '3'));
const pollSecs = Number(arg('--poll', '15'));
if (!outPath || sep < 0 || sep === process.argv.length - 1) {
  process.stderr.write('usage: pi-review.mjs --out <file> [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n');
  process.exit(1);
}
// Guard the numeric knobs: a NaN/0 would make the poll loop never fire (or busy-spin),
// which would hang the watchdog ITSELF — the exact failure it exists to prevent.
if (![stallSecs, retries, pollSecs].every((n) => Number.isFinite(n) && n > 0)) {
  process.stderr.write('pi-review: --stall-secs, --retries, --poll must be positive numbers\n');
  process.exit(1);
}
const piArgs = process.argv.slice(sep + 1);

// Round cap (OBJECTIVE.md rule, 2026-09-16) — see review-round.mjs. Only look BEFORE `--`
// for the override so a pi arg can never satisfy or spoof it.
const overCapIdx = ownArgs.indexOf('--over-cap');
const overCap = overCapIdx >= 0 ? (ownArgs[overCapIdx + 1] ?? '') : '';
const round = roundFromOutPath(outPath);
const capVerdict = roundCapVerdict(round, overCap);
if (capVerdict === 'refuse') {
  process.stderr.write(
    `pi-review: round ${round} exceeds the cap of ${REVIEW_ROUND_CAP} rounds per item (OBJECTIVE.md). ` +
      `Land with residuals, subtract, or instrument/implement first. ` +
      `To run anyway: --over-cap "<what changed since r${REVIEW_ROUND_CAP}>"\n`,
  );
  process.exit(1);
}
if (capVerdict === 'override') {
  process.stderr.write(`pi-review: round ${round} over cap ${REVIEW_ROUND_CAP} — override: ${overCap.trim()}\n`);
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

function reviewShaped(text) {
  return /\b(VERDICT|LAND|FAIL|finding|BLOCKING)\b/i.test(text);
}

import { openSync, closeSync } from 'node:fs';

// SIGKILL the child's whole PROCESS GROUP (not just the pi pid): a stalled pi may hold the
// bad socket in a grandchild that would otherwise orphan and accumulate across retries —
// exactly the failure mode this tool exists for. `detached:true` makes pi a group leader.
function killGroup(child) {
  try { process.kill(-child.pid, 'SIGKILL'); } catch { /* group already gone */ }
  try { child.kill('SIGKILL'); } catch { /* already dead */ }
}

async function runOnce(attempt) {
  const tmp = join(mkdtempSync(join(tmpdir(), 'pi-review-')), 'out.txt');
  const fd = openSync(tmp, 'w'); // 'w' truncates; stdio writes go here
  // Fresh session each attempt (a stalled session id can re-stall): append a per-attempt --name.
  const args = [...piArgs, '--name', `pi-review-a${attempt}-${Date.now() % 100000}`];
  const child = spawn('pi', args, { stdio: ['ignore', fd, fd], detached: true });

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
    process.stderr.write(`  [pi-review a${attempt}] cpu=${cpu}s flat=${flatPolls}/${maxFlat}\n`);
    if (flatPolls >= maxFlat) {
      process.stderr.write(`  [pi-review a${attempt}] STALL (${stallSecs}s flat CPU) — killing group\n`);
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

let last = '';
for (let a = 1; a <= retries; a++) {
  process.stderr.write(`[pi-review] attempt ${a}/${retries}\n`);
  const { ok, text } = await runOnce(a);
  last = text;
  if (ok) {
    writeFileSync(outPath, text);
    process.stderr.write(`[pi-review] SUCCESS on attempt ${a} (${text.length} chars → ${outPath})\n`);
    process.exit(0);
  }
  process.stderr.write(`[pi-review] attempt ${a} did not produce a review${a < retries ? ' — retrying' : ''}\n`);
}
if (last.trim()) writeFileSync(outPath, last); // preserve last partial for inspection
process.stderr.write(`[pi-review] FAILED after ${retries} attempts (endpoint likely in a bad stretch)\n`);
process.exit(1);
