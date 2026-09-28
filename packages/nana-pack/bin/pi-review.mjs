#!/usr/bin/env node
// pi-review.mjs — run a `pi` (Codex) REVIEW under the liveness watchdog (pi-watchdog.mjs), with
// the per-item review round cap (review-round.mjs, T2b). Every launch here is a review: there is
// no opt-out flag (--worker was removed — a worker launch uses pi-worker, which records nothing).
//
// Usage:
//   node pi-review.mjs --out <file> --item <slug> [--role sol] [--revision <id>]
//                      [--stall-secs 75] [--retries 3] [--poll 15] [--over-cap <why>] -- <pi args...>
// Exit: 0 = a review was produced (written to --out) and its verdict recorded; 1 = refused, all
// retries stalled, bad args, or the verdict could not be recorded.

import { writeFileSync } from 'node:fs';
import { admit, complete, release } from './review-round.mjs';
import { parseWatchdogArgv, runWatchdog } from './pi-watchdog.mjs';

const USAGE = 'usage: pi-review.mjs --out <file> --item <slug> [--role R] [--revision R] [--over-cap WHY] [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n';
const w = parseWatchdogArgv(process.argv);
if (w.error) {
  process.stderr.write(w.error === 'usage' ? USAGE : `pi-review: ${w.error}\n`);
  process.exit(1);
}

// Round cap — only the argv BEFORE `--` is consulted, so a pi arg can never satisfy or spoof
// --item/--over-cap.
const adm = admit(w.ownArgs, { launcher: 'pi-review' });
if (!adm.ok) {
  process.stderr.write(`pi-review: ${adm.message}\n`);
  process.exit(1);
}
process.stderr.write(`pi-review: ${adm.note}\n`);

const r = await runWatchdog('pi-review', w);
if (r.ok) {
  writeFileSync(w.outPath, r.text);
  const c = complete(adm.res, w.outPath); // a completed verdict: the ONLY thing that earns a round
  if (!c.ok) {
    process.stderr.write(`pi-review: review written to ${w.outPath}, but ${c.message}\n`);
    process.exit(1);
  }
  process.stderr.write(`[pi-review] SUCCESS on attempt ${r.attempt} (${r.text.length} chars → ${w.outPath}; round ${c.round})\n`);
  process.exit(0);
}
if (r.text.trim()) writeFileSync(w.outPath, r.text); // preserve last partial for inspection
release(adm.id); // infrastructure failure is not a review: the reservation is returned
process.stderr.write(`[pi-review] FAILED after ${w.retries} attempts (endpoint likely in a bad stretch)\n`);
process.exit(1);
