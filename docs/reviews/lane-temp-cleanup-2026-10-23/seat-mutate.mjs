#!/usr/bin/env node
// Seat wrong-code pairs for lane lane-temp-cleanup (gate, on the owner's word), written by the seat 2026-10-23 after build 2, at tip f3df8596.
// They are the draft's pairs 1 to 14 and the must-meet's V1 to V4. Run from the lane worktree root, with CLAUDE_CONFIG_DIR unset
// (the mutation runner does not scrub it):
//   SEAT_MUTATE_OUT=<file> node docs/reviews/lane-temp-cleanup-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PW = "packages/nana-pack/bin/pi-worker.mjs";
const T_WC = "packages/nana-pack/tests/worker-claude.test.mjs";
const R_2647 = /^R-2647: /; // R-2647
const R_2655 = /^R-2655: /; // R-2655
const R_2664 = /^R-2664: /; // R-2664
const R_2665 = /^R-2665: /; // R-2665
const R_2691 = /^R-2691: /; // R-2691
const R_2692 = /^R-2692: /; // R-2692
const R_2693 = /^R-2693: /; // R-2693
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const REVIEW_MSG = "\tprocess.stderr.write(`pi-worker: ${reviewFlag} is a review option — pi-worker records nothing. A review goes through pi-review --item <slug>.\\n`);\n";
const EARLY_CHECK = "const reviewFlag = ['--item', '--role', '--revision', '--over-cap', '--worker'].find((flag) => own.includes(flag));\nif (reviewFlag) {\n" + REVIEW_MSG + "\tprocess.exit(1);\n}\n";
const LATE_CHECK = "const reviewFlag = ['--item', '--role', '--revision', '--over-cap', '--worker'].find((f) => w.ownArgs.includes(f));\nif (reviewFlag) {\n" + REVIEW_MSG + "\tprocess.exit(1);\n}\n";
const LATE_CHECK_RM = "const reviewFlag = ['--item', '--role', '--revision', '--over-cap', '--worker'].find((f) => w.ownArgs.includes(f));\nif (reviewFlag) {\n\tif (preambleFile) rmSync(path.dirname(preambleFile), { recursive: true, force: true });\n" + REVIEW_MSG + "\tprocess.exit(1);\n}\n";
const RETRIES_LINE = "if (laneMode && w.retries > 0) laneFailure('--retries greater than zero is refused in lane mode');\n";
const LISTENERS = "\tfor (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => {});\n";
const STDERR_LISTENER = "\tprocess.stderr.on('error', () => {});\n";
const TRUST_LINE = "\tif (!trusted(cwd)) process.stderr.write(`trust: none for ${cwd} — project post-edit checks are inert (nana-setup trust ${cwd})\\n`);\n";
const WATCHDOG_CALL = "\t\ttry { r = await runWatchdog(WORKER_TAG,";

const DECLARED = [
	"(plan) p1 to p14 follow the draft's wrong-code list in order; V1 to V4 are the must-meet's",
	"(seat) p1 rebuilds main's order: the review check after parseWatchdogArgv reading w.ownArgs, and no start-up listeners",
	"(seat) p3 guards the early check with !own.includes('--lane'), since laneMode is declared after it",
	"(seat) p7 keeps the try's finally as a no-op so the file still parses",
	"(seat) p13 and p14 are test-fixture edits; the decoy itself is not a pair, because it is the pin's trigger",
];

const PAIRS = [
	{ n: "p1", name: "main's pi-worker: the review check after the temp folder and no start-up listeners", edits: [
		one(PW, EARLY_CHECK, ""),
		one(PW, LISTENERS, ""),
		one(PW, RETRIES_LINE, RETRIES_LINE + LATE_CHECK),
	], tests: [T_WC], expectRed: [R_2691, R_2693] },
	{ n: "p2", name: "the review check left after the temp folder, with an rmSync of the folder before its exit", edits: [
		one(PW, EARLY_CHECK, ""),
		one(PW, RETRIES_LINE, RETRIES_LINE + LATE_CHECK_RM),
	], tests: [T_WC], expectRed: [R_2691] },
	{ n: "p3", name: "the early review check guarded by not lane mode", edits: [
		one(PW, "if (reviewFlag) {\n" + REVIEW_MSG, "if (reviewFlag && !own.includes('--lane')) {\n" + REVIEW_MSG),
	], tests: [T_WC], expectRed: [R_2691] },
	{ n: "p4", name: "the early review check's list cut to --item only", edits: [
		one(PW, "['--item', '--role', '--revision', '--over-cap', '--worker'].find((flag) => own.includes(flag))", "['--item'].find((flag) => own.includes(flag))"),
	], tests: [T_WC], expectRed: [R_2691] },
	{ n: "p5", name: "laneFailure without its rmSync", edits: [
		one(PW, "function laneFailure(reason) {\n\tif (preambleFile) rmSync(path.dirname(preambleFile), { recursive: true, force: true });\n", "function laneFailure(reason) {\n"),
	], tests: [T_WC], expectRed: [R_2692] },
	{ n: "p6", name: "the watchdog-option exit without its rmSync", edits: [
		one(PW, "if (w.error) { if (preambleFile) rmSync(path.dirname(preambleFile), { recursive: true, force: true }); process.stderr.write(", "if (w.error) { process.stderr.write("),
	], tests: [T_WC], expectRed: [R_2692] },
	{ n: "p7", name: "the runWatchdog finally without its rmSync", edits: [
		one(PW, "\t\tfinally { rmSync(preambleDir, { recursive: true, force: true }); }\n", "\t\tfinally { void preambleDir; }\n"),
	], tests: [T_WC], expectRed: [R_2692, R_2647, R_2655] },
	{ n: "p8", name: "the start-up listeners registered after mkdtempSync, with the trust check between them", edits: [
		one(PW, LISTENERS, ""),
		one(PW, TRUST_LINE, TRUST_LINE + LISTENERS),
	], tests: [T_WC], expectRed: [R_2693] },
	{ n: "p9", name: "no start-up listeners", edits: [
		one(PW, LISTENERS, ""),
	], tests: [T_WC], expectRed: [R_2693] },
	{ n: "p10", name: "the start-up listeners registered just before await runWatchdog", edits: [
		one(PW, LISTENERS, ""),
		one(PW, WATCHDOG_CALL, LISTENERS.replace("\t", "\t\t") + WATCHDOG_CALL),
	], tests: [T_WC], expectRed: [R_2693] },
	{ n: "p11", name: "a start-up listener that removes the folder and exits 1 itself", edits: [
		one(PW, "process.on(signal, () => {});", "process.on(signal, () => { if (preambleFile) rmSync(path.dirname(preambleFile), { recursive: true, force: true }); process.exit(1); });"),
	], tests: [T_WC], expectRed: [R_2693] },
	{ n: "p12", name: "start-up listeners for SIGTERM only", edits: [
		one(PW, "for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => {});", "for (const signal of ['SIGTERM']) process.on(signal, () => {});"),
	], tests: [T_WC], expectRed: [R_2693] },
	{ n: "p13", name: "test helper: workerArgs keeps its default --out when a case passes its own", edits: [
		one(T_WC, '\t...(extra.includes("--out") ? [] : ["--out", OUT]),\n', '\t"--out", OUT,\n'),
	], tests: [T_WC], expectRed: [R_2692] },
	{ n: "p14", name: "test fixture: baseEnv without delete env.CLAUDE_CONFIG_DIR", edits: [
		one(T_WC, "\tdelete env.CLAUDE_CONFIG_DIR;\n\treturn { ...env, ...extra };", "\treturn { ...env, ...extra };"),
	], tests: [T_WC], expectRed: [R_2655, R_2664, R_2665] },
	{ n: "V1", name: "start-up listeners removed before runWatchdog", edits: [
		one(PW, WATCHDOG_CALL, "\t\tfor (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.removeAllListeners(signal);\n" + WATCHDOG_CALL),
	], tests: [T_WC], expectRed: [R_2693] },
	{ n: "V2", name: "the lane-mode review check placed late in the lane block, just before the temp folder", edits: [
		one(PW, "if (reviewFlag) {\n" + REVIEW_MSG, "if (reviewFlag && !own.includes('--lane')) {\n" + REVIEW_MSG),
		one(PW, LISTENERS, "\tif (reviewFlag) { process.stderr.write(`pi-worker: ${reviewFlag} is a review option — pi-worker records nothing. A review goes through pi-review --item <slug>.\\n`); process.exit(1); }\n" + LISTENERS),
	], tests: [T_WC], expectRed: [R_2691] },
	{ n: "V3", name: "start-up listeners registered only for a Claude builder", edits: [
		one(PW, LISTENERS, "\tif (isClaudeBuilder) for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(signal, () => {});\n"),
	], tests: [T_WC], expectRed: [R_2693] },
	{ n: "V4", name: "no stderr error listener", edits: [
		one(PW, STDERR_LISTENER, ""),
	], tests: [T_WC], expectRed: [R_2692] },
];

process.exitCode = await runMutations({ lane: "lane-temp-cleanup", self: import.meta.url, tip: "f3df8596", declared: DECLARED, pairs: PAIRS });
