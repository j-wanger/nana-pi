#!/usr/bin/env node
// pi-worker.mjs — run a `pi` WORKER (a build/implementation agent, not a review) under the same
// liveness watchdog as pi-review (pi-watchdog.mjs). It never imports or touches the review
// ledger: it records nothing and can admit no verdict. It exists so that the review command
// needs no caller-controlled exemption (T2b, sol r1 #3: `pi-review --worker` was a free-review
// bypass). Running a review through here earns nothing and is not counted — exactly like
// running `pi -p` by hand; see README "Trust model".
//
// Usage: node pi-worker.mjs --out <file> [--stall-secs 75] [--retries 3] [--poll 15] -- <pi args...>
// Exit: 0 = the worker produced output (written to --out); 1 = all retries stalled / bad args.

import { writeFileSync } from 'node:fs';
import { parseWatchdogArgv, runWatchdog } from './pi-watchdog.mjs';

const USAGE = 'usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n';
const w = parseWatchdogArgv(process.argv);
if (w.error) {
  process.stderr.write(w.error === 'usage' ? USAGE : `pi-worker: ${w.error}\n`);
  process.exit(1);
}
const reviewFlag = ['--item', '--role', '--revision', '--over-cap', '--worker'].find((f) => w.ownArgs.includes(f));
if (reviewFlag) {
  process.stderr.write(`pi-worker: ${reviewFlag} is a review option — pi-worker records nothing. A review goes through pi-review --item <slug>.\n`);
  process.exit(1);
}

const r = await runWatchdog('pi-worker', w);
if (r.text.trim()) writeFileSync(w.outPath, r.text);
process.stderr.write(r.ok
  ? `[pi-worker] SUCCESS on attempt ${r.attempt} (${r.text.length} chars → ${w.outPath})\n`
  : `[pi-worker] FAILED after ${w.retries} attempts (endpoint likely in a bad stretch)\n`);
process.exit(r.ok ? 0 : 1);
