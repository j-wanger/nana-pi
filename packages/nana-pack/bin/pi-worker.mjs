#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/pi-worker.mjs
 * @purpose Run a `pi` WORKER under the liveness watchdog, touching no review ledger and not retrying by
 *  default.
 * @inputs argv (--out, --stall-secs, --retries, --poll, then `--` and the pi args)
 * @outputs the worker's output written to --out (partial output included), plus usage, the explicit-retries
 *  notices and a SUCCESS / FAILED line on stderr
 * @effects disk (writes --out), process (the watchdog's `pi` child and this process's exit code)
 * @errors exit 1 on bad args, on any review-only flag (--item, --role, --revision, --over-cap, --worker)
 *  and when every attempt failed; exit 0 when an attempt produced output
 */
// pi-worker.mjs — run a `pi` WORKER (a build/implementation agent, not a review) under the same
// liveness watchdog as pi-review (pi-watchdog.mjs). It never imports or touches the review
// ledger: it records nothing and can admit no verdict. It exists so that the review command
// needs no caller-controlled exemption (T2b, sol r1 #3: `pi-review --worker` was a free-review
// bypass). Running a review through here earns nothing and is not counted — exactly like
// running `pi -p` by hand; see README "Trust model".
//
// Success = pi exited 0 with non-empty output (no review shape is required — sol r2 #13).
// NO RETRY by default (--retries 0): a worker mutates files, and a re-attempt repeats whatever the
// failed/stalled attempt already did. --retries N opts in explicitly and is warned about.
// Usage: node pi-worker.mjs --out <file> [--stall-secs 75] [--retries 0] [--poll 15] -- <pi args...>
// Exit: 0 = the worker produced output (written to --out); 1 = every attempt failed / bad args.

import { writeFileSync } from 'node:fs';
import { parseWatchdogArgv, runWatchdog, RETRIES_NOTICE } from './pi-watchdog.mjs';

const USAGE = 'usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n';
const w = parseWatchdogArgv(process.argv, { defaultRetries: 0 });
if (w.error) {
  process.stderr.write(w.error === 'usage' ? USAGE : `pi-worker: ${w.error}\n`);
  process.exit(1);
}
const reviewFlag = ['--item', '--role', '--revision', '--over-cap', '--worker'].find((f) => w.ownArgs.includes(f));
if (reviewFlag) {
  process.stderr.write(`pi-worker: ${reviewFlag} is a review option — pi-worker records nothing. A review goes through pi-review --item <slug>.\n`);
  process.exit(1);
}

if (w.retriesExplicit) process.stderr.write(RETRIES_NOTICE('pi-worker', w.retries));
if (w.retries > 0) {
  process.stderr.write(`pi-worker: --retries ${w.retries} — a re-attempt REPEATS any file mutations the failed attempt already made\n`);
}
const r = await runWatchdog('pi-worker', w); // no accept predicate: exit 0 + non-empty output
if (r.text.trim()) writeFileSync(w.outPath, r.text);
if (r.signal) {
  process.stderr.write(`[pi-worker] aborted by ${r.signal}\n`);
  process.exit({ SIGINT: 130, SIGTERM: 143, SIGHUP: 129 }[r.signal] ?? 1);
}
process.stderr.write(r.ok
  ? `[pi-worker] SUCCESS on attempt ${r.attempt} (${r.text.length} chars → ${w.outPath})\n`
  : `[pi-worker] FAILED after ${w.retries + 1} attempt(s) (endpoint likely in a bad stretch)\n`);
process.exit(r.ok ? 0 : 1);
