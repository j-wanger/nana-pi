#!/usr/bin/env node
// Seat wrong-code pairs for lane win-leg-flakes (ordinary lane), written by the seat 2026-10-21 after build 1, on the
// shared runner. Build 1 reported PARTIAL with no wrong-code tries run, so the seat runs the brief's five here. Run from
// the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-leg-flakes-2026-10-21/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-setup/tests/install-check.test.mjs";
const LIB = "packages/nana-setup/lib/install-check.mjs";
const CFG = "packages/nana-setup/lib/install-check-config.mjs";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = ["(build 1, 6c99f999) the brief's five wrong-code tries for R-2480, R-2481, R-2486 and the retry pin"];

const PAIRS = [
	{ n: "W1", name: "no retry loop: one attempt only", edits: [
		one(LIB, "attempt <= PI_SUBAGENTS_RETRY.attempts; attempt++", "attempt <= 1; attempt++"),
	], tests: [T], expectRed: [/^R-2480: a pi-subagents install that exits 1 and then 0/] },
	{ n: "W2", name: "the NOTE line is dropped", edits: [
		one(LIB, "    emitLine(`NOTE pi-subagents attempt ${attempt} of ${PI_SUBAGENTS_RETRY.attempts} failed — ${failureReason}`);\n", ""),
	], tests: [T], expectRed: [/^R-2481: /] },
	{ n: "W3", name: "every NOTE names attempt 1's code line", edits: [
		one(LIB, "const failureReason = codeLine ?? reason(sub);", "const failureReason = (globalThis.__seatFirstCode ??= codeLine) ?? reason(sub);"),
	], tests: [T], expectRed: [/^R-2481: /] },
	{ n: "W4", name: "a timeout is retried too", edits: [
		one(LIB, "if (okay(sub) || sub.error || typeof sub.status !== \"number\" || sub.status === 0) break;", "if (okay(sub) || sub.status === 0) break;"),
	], tests: [T], expectRed: [/^R-2486: /] },
	{ n: "W5", name: "the sealed attempt count drops to two", edits: [
		one(CFG, "attempts: 3, pauseMs: 5000", "attempts: 2, pauseMs: 5000"),
	], tests: [T], expectRed: [/^R-2480: the pi-subagents retry is sealed/] },
];

process.exitCode = await runMutations({ lane: "win-leg-flakes", self: import.meta.url, tip: "6c99f999", declared: DECLARED, pairs: PAIRS });
