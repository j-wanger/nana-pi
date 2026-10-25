/**
 * @module packages/nana-pack/lib/test-runner-config.mjs
 * @purpose Declare the test runner's parallel tunables and volume-dependent file preconditions.
 * @inputs os.tmpdir(), or a caller-supplied temporary root for the checkout-spelling probe
 * @outputs JOBS_FLAG, SUITE_JOBS, SUITE_JOBS_ENV, RUN_ALONE, the finished-file temporary-folder
 *  removal retry count and delay, and checkoutSpellingSkipReason
 * @effects disk (checkoutSpellingSkipReason creates and removes one temporary probe folder)
 * @errors checkoutSpellingSkipReason propagates temporary-folder creation errors
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// must-meet.md (docs/reviews/parallel-runner-2026-10-19/) is the plan of record: R-1470 to R-1477.
// scripts/test.mjs and scripts/test-locked.mjs import every tunable here by name — never an
// inline literal at a point of use.

// contract (R-1470, R-1477): the test runner's --jobs argument prefix.
export const JOBS_FLAG = "--jobs=";

/** Declare checkout-spelling unrunnable only where its own case-swap probe finds no second spelling. */
export function checkoutSpellingSkipReason(tmpRoot = os.tmpdir()) {
	const probe = fs.realpathSync.native(fs.mkdtempSync(path.join(tmpRoot, "nana-checkout-spelling-probe-")));
	try {
		const swapCase = (value) => [...value].map((char) => char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()).join("");
		const second = path.join(path.dirname(probe), swapCase(path.basename(probe)));
		return second !== probe && fs.existsSync(second) ? null : "no second spelling exists on a case-sensitive volume";
	} finally {
		fs.rmSync(probe, { recursive: true, force: true });
	}
}

// chosen (must-meet.md measured table, 2026-10-19, the 10-core seat Mac, other lanes running):
// 4 at once measured clean; 6 simulates 15-35s faster but adds load beside other lanes' builders;
// 8 is slower. This is scripts/test-locked.mjs's default job count for an unfiltered run.
export const SUITE_JOBS = 4;

// contract (R-1476); chosen: a NANA_ name, so R-618's existing scrub already keeps it out of
// every spawned test file's own env with no new code (the runner strips every ambient NANA_*
// but the NANA_TEST_* knobs before building a test file's env).
export const SUITE_JOBS_ENV = "NANA_SUITE_JOBS";

// chosen 2026-10-23 (R-2666): matches build-report's transient Windows-folder cleanup policy;
// Node's linear backoff gives about 1.5 seconds total. No Windows hold duration was measured.
export const TEMP_REMOVE_RETRIES = 5;
export const TEMP_REMOVE_RETRY_DELAY_MS = 100;

// contract (R-1473, R-1474): a file on this list runs only while no other test file runs, when
// --jobs=N is given with N greater than 1. Frozen so it can only be read, never mutated, by a
// file this module does not control.
// Chosen (must-meet.md measured table, 2026-10-19): each file here passed 8 of 8 runs under load
// at --jobs=8, but its timing bound is load-sensitive by construction — running it alone instead
// costs about 10s total across the four. A bound here is never loosened to make a file safe for
// the pool; it joins this list instead. CI run 39785202152 (Windows, four jobs, 2026-10-22)
// showed the post-edit-utf8 check timing out under load. Run 39792797841 (macOS, four jobs,
// 2026-10-22) showed review-ledger's 1000 ms reservation stale window with a 200 ms heartbeat
// missing a renewal under load. Windows run 1e77de81 showed hook-deadlines overrun
// HOOK_DEADLINE_MS under load; the adoption-reader miss shared a runner-wide stall, so its
// HOOK_PRODUCER_TIMEOUT_MS-sensitive producer cases also run outside the pool.
export const RUN_ALONE = Object.freeze({
	"packages/nana-knowledge/tests/hook.test.mjs": "load-sensitive timing bounds (1500/1800 ms)",
	"packages/nana-knowledge/tests/extension.test.mjs": "load-sensitive timing bounds (1000/1500 ms)",
	"packages/nana-pack/tests/bounded-read.test.mjs": "load-sensitive timing bound (1000 ms)",
	"packages/nana-pack/tests/test-locked.test.mjs": "load-sensitive timing bound (1200 ms) and 70-250 ms launch waits",
	"packages/nana-pack/tests/post-edit-utf8.test.mjs": "load-sensitive 3000 ms post-edit check starts a Python parent and child",
	"packages/nana-pack/tests/review-ledger.test.mjs": "load-sensitive 1000 ms reservation stale window with a 200 ms heartbeat",
	"packages/nana-setup/tests/hook-deadlines.test.mjs": "load-sensitive hook cases bounded by HOOK_DEADLINE_MS and HOOK_PRODUCER_TIMEOUT_MS",
	"packages/nana-pack/tests/adoption-reader.test.mjs": "load-sensitive adoption producer bounded by HOOK_PRODUCER_TIMEOUT_MS",
});
