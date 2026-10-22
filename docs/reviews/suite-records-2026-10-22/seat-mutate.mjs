#!/usr/bin/env node
// Seat wrong-code pairs for lane suite-records (ordinary lane), written by the seat 2026-10-22 after build 2, on the
// shared runner, at tip 01f5aabe; re-run at 514590a8 after build 3 and at 3db949cd after build 4 (s15, the final review's F1). They are the must-meet's pairs ("Seat steps") and the attack's (M1 to M5, S6), one
// per wrong build. Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/suite-records-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LIB = "packages/nana-pack/lib/suite-records.mjs";
const LOCKED = "scripts/test-locked.mjs";
const RUNNER = "scripts/test.mjs";
const SR_T = "packages/nana-pack/tests/suite-records.test.mjs";
const RUNNER_T = "packages/nana-pack/tests/test-runner.test.mjs";
const R_2546 = /^R-2546: /; // R-2546
const R_2547 = /^R-2547: /; // R-2547
const R_2548 = /^R-2548: /; // R-2548
const R_2549 = /^R-2549: /; // R-2549
const R_2550 = /^R-2550: /; // R-2550
const R_2551 = /^R-2551: /; // R-2551
const R_2552 = /^R-2552: /; // R-2552
const R_2553 = /^R-2553: /; // R-2553
const R_2554 = /^R-2554: /; // R-2554
const R_2555 = /^R-2555: /; // R-2555
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(plan) s1 to s14 are the must-meet's pairs and the attack's: newest ancestor (M3), dirty baseline, untracked files not counted (M5), dirty run called flaky, comparison across job counts, land prefix dropped, off-lane total (M6), unguarded runner write (M2), filtered run stored, store on a stop (S7), coverage label only for a rerun file (M4), the count line first (M1), a record written with the knob unset (S6), a store failure that changes the exit code",
	"(review) s15 is the final review round 1 F1: the rerun loop that keeps starting files after a stop",
	"(seat) s8 makes the runner's write failure rethrow instead of print, which is the unguarded write; s12 swaps the two lines, so the counts are no longer last",
];

const PAIRS = [
	{ n: "s1", name: "the newest ancestor wins over the nearest", edits: [
		one(LIB, ".sort((left, right) => distances.get(left.tip) - distances.get(right.tip)", ".sort((left, right) => timeValue(right) - timeValue(left) || distances.get(left.tip) - distances.get(right.tip)"),
	], tests: [SR_T], expectRed: [R_2549] },
	{ n: "s2", name: "a dirty record can be the baseline", edits: [
		one(LIB, ".filter((record) => record?.dirty === 0 && distances.has(record.tip))", ".filter((record) => distances.has(record.tip))"),
	], tests: [SR_T], expectRed: [R_2549] },
	{ n: "s3", name: "untracked files left out of the dirty count", edits: [
		one(LIB, '["status", "--porcelain", "-z", "--untracked-files=all"]', '["status", "--porcelain", "-z", "--untracked-files=no"]'),
	], tests: [SR_T], expectRed: [R_2547] },
	{ n: "s4", name: "a dirty run called flaky", edits: [
		one(LIB, "const passedAtTip = current.dirty === 0 && records.some(", "const passedAtTip = records.some("),
	], tests: [SR_T], expectRed: [R_2550] },
	{ n: "s5", name: "slower files compared across job counts", edits: [
		one(LIB, '\tif (current.jobs !== baseline.jobs) return "slower: none (job counts differ)";\n', ""),
	], tests: [SR_T], expectRed: [R_2551] },
	{ n: "s6", name: "the land prefix dropped", edits: [
		one(LOCKED, "const prefix = landTip === facts.tip ? `${LAND_NOTE_PREFIX} ` : \"\";", "const prefix = \"\";"),
	], tests: [SR_T], expectRed: [R_2552] },
	{ n: "s7", name: "every stored record counted in the lane total", edits: [
		one(LIB, "const included = records.filter((record) => tips.has(record.tip));", "const included = records;"),
	], tests: [SR_T], expectRed: [R_2555] },
	{ n: "s8", name: "the runner's record write unguarded", edits: [
		one(RUNNER, "console.log(`${RECORD_LINE_PREFIX} write failed: ${error?.message ?? \"unknown error\"}`);", "throw error;"),
	], tests: [SR_T], expectRed: [R_2553] },
	{ n: "s9", name: "a filtered run sets the knob", edits: [
		one(LOCKED, "const recordFile = filters.length === 0 ? path.join(", "const recordFile = true ? path.join("),
	], tests: [SR_T], expectRed: [R_2548] },
	{ n: "s10", name: "a stopped run still stores", edits: [
		one(LOCKED, "if (recordFile && !stopping) finishSuiteRecord(", "if (recordFile) finishSuiteRecord("),
	], tests: [SR_T], expectRed: [R_2548] },
	{ n: "s11", name: "a rerun file keeps only its coverage label", edits: [
		one(LOCKED, "\t\t\t\t...plainFiles,\n", ""),
	], tests: [SR_T], expectRed: [R_2547] },
	{ n: "s12", name: "the counts line printed first", edits: [
		one(LIB, "return [first, last];", "return [last, first];"),
	], tests: [SR_T], expectRed: [R_2554] },
	{ n: "s13", name: "the runner writes with the knob unset", edits: [
		one(RUNNER, "if (suiteRecordFile) {", "if (true) {"),
	], tests: [RUNNER_T], expectRed: [R_2546] },
	{ n: "s14", name: "a store failure changes the exit code", edits: [
		one(LOCKED, "recordProblem(error?.message ?? \"record could not be stored\");", "recordProblem(error?.message ?? \"record could not be stored\"); throw error;"),
	], tests: [SR_T], expectRed: [R_2553] },
	{ n: "s15", name: "a stopped land keeps starting rerun files", edits: [
		one(LOCKED, "\t\t\t\tif (stopping) break;\n", ""),
	], tests: [SR_T], expectRed: [R_2548] },
];

process.exitCode = await runMutations({ lane: "suite-records", self: import.meta.url, tip: "3db949cd", declared: DECLARED, pairs: PAIRS });
