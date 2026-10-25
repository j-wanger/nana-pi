#!/usr/bin/env node
// Seat wrong-code pairs for lane win-test-limits (ordinary), written by the seat 2026-10-25 after build 1 at a6f7921c.
// They follow the must-meet's "Seat wrong-code pairs" list (pairs 1 to 21; 14 to 16 are Windows-only and declared, not in PAIRS).
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-test-limits-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const TR = "packages/nana-pack/tests/test-runner.test.mjs";
const MR = "packages/nana-pack/tests/mutation-runner.test.mjs";
const WL = "packages/nana-pack/tests/worker-lane.test.mjs";
const PEH = "packages/nana-pack/tests/post-edit-hardening.test.mjs";
const WSL = "packages/nana-pack/tests/windows-skip-lines.test.mjs";
const TRP = "packages/nana-pack/tests/test-runner-parallel.test.mjs";
const CFG = "packages/nana-pack/lib/test-runner-config.mjs";
const PS = "packages/nana-pack/tests/path-spelling.test.mjs";
const R_2880 = /^R-2880: /; // R-2880
const R_2881 = /^R-2881: /; // R-2881
const R_2882 = /^R-2882: /; // R-2882
const R_2883 = /^R-2883: /; // R-2883
const R_2885 = /^R-2885: /; // R-2885
const R_1954 = /^post-edit-hardening\.test\.mjs: each check it runs only off Windows has its own SKIP line/; // R-1954
const GP4 = /^GP4: a dead review checkout registered under one spelling of the temp folder is reclaimed/; // R-1353 (GP4)
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// R-1960's child guard; the identical R-1779 guard is told apart by the spawn line above it.
const R1960_GUARD_PRE = "String(injectedReleaseLimitMs)], { stdio: [\"ignore\", \"pipe\", \"pipe\"] });\n\tconst childResult = await new Promise((resolve) => {\n\t\tlet output = \"\";\n\t\tlet settled = false;\n\t\tchild.stdout.on(\"data\", (d) => { output += d; });\n\t\tchild.stderr.on(\"data\", (d) => { output += d; });\n\t\tconst timer = setTimeout(() => { try { child.kill(\"SIGKILL\"); } catch { /* already gone */ } }, ";
const HOOK_REASON = "\"load-sensitive hook cases bounded by HOOK_DEADLINE_MS and HOOK_PRODUCER_TIMEOUT_MS\"";

const DECLARED = [
	"(seat) pairs 1 to 21 follow the must-meet's seat wrong-code list in order; every item is one edit, so none splits; each names the rows the must-meet says it turns red",
	"(Windows-only, not in this table) pairs 14 to 16 are R-2884's: the taskkill-off-PATH case's timeoutMs back to TREE_DEADLINE_MS, its alive wait back to TREE_DEADLINE_MS, and level A's late start removed. R-2884's check runs only on win32 and prints a SKIP line elsewhere, so no macOS run can turn it red. The seat runs them on a scratch Windows CI push, as the must-meet says",
	"(seat) pair 17 removes R-2884's exact-title SKIP line; R-1954's scan of post-edit-hardening.test.mjs is static, so it runs on macOS",
	"(runner config) pairs 18 to 20 edit RUN_ALONE in test-runner-config.mjs, the lane's own change and the edit the must-meet's list names; every other pair edits a test file alone; no pair edits product code",
	"(not expressible) R-2885's third red case, a named constant hook-producer does not export as a number, has no one-place lane edit (must-meet); a rename in hook-producer.mjs would show it at a merge",
	"(seat) no alsoRed is declared: the table was written before any full run, and only pair 17 was run end to end",
];

const PAIRS = [
	{ n: "1", name: "RECORD_LIMIT_MS back to 800", edits: [one(TR, "const RECORD_LIMIT_MS = 5_000;", "const RECORD_LIMIT_MS = 800;")], tests: [TR], expectRed: [R_2880] },
	{ n: "2", name: "a-pass's sleep removed", edits: [one(TR, "\t\t`while (Date.now() - started < ${LATE_PASS_MS}) await sleep(Math.min(25, ${LATE_PASS_MS} - (Date.now() - started)));`,\n", "")], tests: [TR], expectRed: [R_2880] },
	{ n: "3", name: "d-timeout sleeps RECORD_LIMIT_MS - 1000, then ends", edits: [one(TR, "process.exit(0), ${TIMEOUT_FIXTURE_MS});", "process.exit(0), ${RECORD_LIMIT_MS - 1000});")], tests: [TR], expectRed: [R_2880] },
	{ n: "4", name: "R-1960's child guard back to 1500", edits: [one(MR, `${R1960_GUARD_PRE}CHILD_LIMIT_MS);`, `${R1960_GUARD_PRE}1500);`)], tests: [MR], expectRed: [R_2881] },
	{ n: "5", name: "R-1960's child late start removed", edits: [one(MR, "\t\t`Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${CHILD_LATE_START_MS});`,\n", "")], tests: [MR], expectRed: [R_2881] },
	{ n: "6", name: "the contend held wait back to 4000", edits: [one(MR, "\"lockheld-lock1\")), CONTEND_WAIT_MS);", "\"lockheld-lock1\")), 4000);")], tests: [MR], expectRed: [R_2882] },
	{ n: "7", name: "NANA_TEST_WAIT_MS dropped from run1's env", edits: [one(MR, "\t\t\tNANA_TEST_WAIT_MS: String(CONTEND_WAIT_MS),\n", "")], tests: [MR], expectRed: [R_2882] },
	{ n: "8", name: "NANA_TEST_START_DELAY_MS dropped from run1's env (the late mark removed)", edits: [one(MR, "\t\t\tNANA_TEST_START_DELAY_MS: String(PROBE_LATE_MARK_MS),\n", "")], tests: [MR], expectRed: [R_2882] },
	{ n: "9", name: "the late release's wait removed", edits: [one(MR, "\t\twhile (Date.now() - releaseStarted < LATE_RELEASE_MS) await sleep(Math.min(25, LATE_RELEASE_MS - (Date.now() - releaseStarted)));\n", "")], tests: [MR], expectRed: [R_2882] },
	{ n: "10", name: "worker-lane run's poll back to 0.1", edits: [one(WL, "\"--poll\", String(WORKER_POLL_SECS)", "\"--poll\", \"0.1\"")], tests: [WL], expectRed: [R_2883] },
	{ n: "11", name: "R-2883's shim folder placed after process.env.PATH", edits: [one(WL, "PATH: `${samplerDir2883}${path.delimiter}${stubDir}${path.delimiter}${process.env.PATH}`,", "PATH: `${stubDir}${path.delimiter}${process.env.PATH}${path.delimiter}${samplerDir2883}`,")], tests: [WL], expectRed: [R_2883] },
	{ n: "12", name: "R-2883's fake pi hold removed", edits: [one(WL, "}, ${FAKE_PI_HOLD_MS});", "}, 0);")], tests: [WL], expectRed: [R_2883] },
	{ n: "13", name: "R-2883's shim written into the stub folder", edits: [one(WL, "writeSlowSampler(samplerDir2883)", "writeSlowSampler(stubDir)")], tests: [WL], expectRed: [R_2883] },
	{ n: "17", name: "R-2884's SKIP line removed", edits: [one(PEH, "\tconsole.log(\"SKIP R-2884: with taskkill off PATH and the tree's first level starting 3 seconds late, the shell still ends and the run settles timed out — taskkill is Windows-only\");\n", "")], tests: [WSL], expectRed: [R_1954] },
	{ n: "18", name: "hook-deadlines removed from RUN_ALONE", edits: [one(CFG, `\t"packages/nana-setup/tests/hook-deadlines.test.mjs": ${HOOK_REASON},\n`, "")], tests: [TRP], expectRed: [R_2885] },
	{ n: "19", name: "adoption-reader removed from RUN_ALONE", edits: [one(CFG, "\t\"packages/nana-pack/tests/adoption-reader.test.mjs\": \"load-sensitive adoption producer bounded by HOOK_PRODUCER_TIMEOUT_MS\",\n", "")], tests: [TRP], expectRed: [R_2885] },
	{ n: "20", name: "hook-deadlines' reason stripped of both constant names", edits: [one(CFG, HOOK_REASON, "\"load-sensitive hook cases bounded by the hook deadline and the producer limit\"")], tests: [TRP], expectRed: [R_2885] },
	{ n: "21", name: "GP4 given process.pid instead of IMPOSSIBLE_PID", edits: [one(PS, "const IMPOSSIBLE_PID = 2_147_483_647;", "const IMPOSSIBLE_PID = process.pid;")], tests: [PS], expectRed: [GP4] },
];

process.exitCode = await runMutations({ lane: "win-test-limits", self: import.meta.url, tip: "a6f7921c", declared: DECLARED, pairs: PAIRS });
