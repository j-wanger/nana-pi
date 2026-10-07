#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/pi-review.mjs
 * @purpose Run a `pi` REVIEW under the liveness watchdog and the per-item round cap, recording the verdict
 *  only when a review was produced.
 * @inputs argv (--out, --item, --tree, --role, --revision, --over-cap, --stall-secs, --retries, --poll, then `--`
 *  and the pi args), the user-scope review ledger, and the reviewed tree's git revision
 * @outputs the review text written to --out, a round recorded in the ledger, and the admission note,
 *  warnings and a SUCCESS / FAILED line on stderr
 * @effects disk (writes --out plus the ledger's reservation, tally and audit files), process (the
 *  watchdog's `pi` child, the reservation heartbeat, the exit code)
 * @errors exit 1 when admission is refused (over the cap, a git failure, a bad --out, bad args), when every
 *  attempt stalled or failed, or when the round could not be recorded; exit 0 otherwise
 */
// pi-review.mjs — run a `pi` (Codex) REVIEW under the liveness watchdog (pi-watchdog.mjs), with
// the per-item review round cap (review-round.mjs, T2b). Every launch here is a review: there is
// no opt-out flag (--worker was removed — a worker launch uses pi-worker, which records nothing).
//
// Usage:
//   node pi-review.mjs --out <file> --item <slug> [--tree <path>] [--role sol] [--revision <id>]
//                      [--stall-secs 75] [--retries 2] [--poll 15] [--over-cap <why>] -- <pi args...>
// Exit: 0 = a review was produced (written to --out) and its verdict recorded; 1 = refused, all
// retries stalled, bad args, or the verdict could not be recorded.

import { writeFileSync } from 'node:fs';
import { admit, complete, release, startHeartbeat } from './review-round.mjs';
import { reviewShaped } from './review-shape.mjs';
import { parseWatchdogArgv, runWatchdog, RETRIES_NOTICE } from './pi-watchdog.mjs';

const USAGE = 'usage: pi-review.mjs --out <file> --item <slug> [--tree <path>] [--role R] [--revision R] [--over-cap WHY] [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n';
const w = parseWatchdogArgv(process.argv);
if (w.error) {
  process.stderr.write(w.error === 'usage' ? USAGE : `pi-review: ${w.error}\n`);
  process.exit(1);
}

if (w.retriesExplicit) process.stderr.write(RETRIES_NOTICE('pi-review', w.retries));

// Round cap — only the argv BEFORE `--` is consulted, so a pi arg can never satisfy or spoof
// --item/--over-cap.
const adm = admit(w.ownArgs, { launcher: 'pi-review' });
if (!adm.ok) {
  process.stderr.write(`pi-review: ${adm.message}\n`);
  process.exit(1);
}
process.stderr.write(`pi-review: ${adm.note}\n`);
if (adm.warning) process.stderr.write(`pi-review: WARNING: ${adm.warning}\n`);

const stopHeartbeat = startHeartbeat(adm.res); // a live, renewing review never loses its reservation
let r;
try { r = await runWatchdog('pi-review', { ...w, accept: reviewShaped }); }
finally {
  stopHeartbeat();
  if (!r?.ok) release(adm.id);
}
if (r.signal) {
  release(adm.id);
  const code = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 }[r.signal] ?? 1;
  process.stderr.write(`[pi-review] aborted by ${r.signal}; reservation released\n`);
  process.exit(code);
}
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
process.stderr.write(`[pi-review] FAILED after ${w.retries + 1} attempts (endpoint likely in a bad stretch)\n`);
process.exit(1);
