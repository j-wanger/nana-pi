#!/usr/bin/env node
// Seat wrong-code pairs for lane objective-hook-win (hook), written by the seat 2026-10-23 after build 1, at tip 171778fb.
// They are the draft's pairs 1 to 9 and the must-meet's pairs 10 and 11. Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/objective-hook-win-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const HP = "packages/nana-setup/lib/hook-producer.mjs";
const OBJ = "packages/nana-setup/claude/hooks/nana-objective.mjs";
const ADO = "packages/nana-setup/claude/hooks/nana-adoption.mjs";
const T_DL = "packages/nana-setup/tests/hook-deadlines.test.mjs";
const T_PR = "packages/nana-setup/tests/hook-producers.test.mjs";
const R_2671 = /^R-2671: /; // R-2671
const R_2672 = /^R-2672: /; // R-2672
const R_2673 = /^R-2673: /; // R-2673
const R_2674 = /^R-2674: /; // R-2674
const SEAL = /^seal: the producer cap is 2,500 ms and the hook deadline 4,000 ms/; // R-2674 R-2672
const edit = (file, anchor, replacement, times = 1) => ({ file, anchor, replacement, times });

const LIMIT = "const limit = deadlineMs === undefined ? HOOK_PRODUCER_TIMEOUT_MS : Math.min(HOOK_PRODUCER_TIMEOUT_MS, Math.floor(deadlineMs - clock()));";
const REPO = 'const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");';
const DEADLINE = "deadlineMs: HOOK_DEADLINE_MS";

const DECLARED = [
	"(plan) p1 to p9 follow the draft's wrong-code list in order; p10 and p11 are the must-meet's",
	"(seat) p5 names R-2671 and the seal, not R-2674: R-2674's check imports the cap by name, and its one fewer-than-cap case stays under 1,500",
	"(seat) p9 runs as two pairs, p9a the cap and p9b the deadline",
	"(seat) the draft's side effects on R-2010, R-2011, R-2012 and R-2613 are not named; pair 1's R-2011 and R-2613 margins are about 50 ms",
];

const PAIRS = [
	{ n: "p1", name: "the hooks pass no deadline", edits: [
		edit(OBJ, `runHookProducer({ ...hookProducerConfig("objective", repo), ${DEADLINE} });`, 'runHookProducer(hookProducerConfig("objective", repo));'),
		edit(OBJ, `objectiveLength)], ${DEADLINE} });`, "objectiveLength)] });"),
		edit(ADO, `runHookProducer({ ...hookProducerConfig("adoption", repo), ${DEADLINE} });`, 'runHookProducer(hookProducerConfig("adoption", repo));'),
		edit(ADO, `runHookProducer({ ...hookProducerConfig("stale-copies", repo), ${DEADLINE} });`, 'runHookProducer(hookProducerConfig("stale-copies", repo));'),
	], tests: [T_DL], expectRed: [R_2672] },
	{ n: "p2", name: "no cap, only the deadline", edits: [
		edit(HP, LIMIT, "const limit = deadlineMs === undefined ? HOOK_PRODUCER_TIMEOUT_MS : Math.floor(deadlineMs - clock());"),
	], tests: [T_PR, T_DL], expectRed: [R_2674] },
	{ n: "p3", name: "the limit clamped to 0 and passed through", edits: [
		edit(HP, LIMIT, "const limit = deadlineMs === undefined ? HOOK_PRODUCER_TIMEOUT_MS : Math.min(HOOK_PRODUCER_TIMEOUT_MS, Math.max(0, Math.floor(deadlineMs - clock())));"),
		edit(HP, "\t\tif (limit > 0) {", "\t\tif (true) {"),
	], tests: [T_PR], expectRed: [R_2673] },
	{ n: "p4", name: "the deadline counted from a clock read when the launcher module loads", edits: [
		edit(HP, "export const HOOK_DEADLINE_MS = 4000;", "export const HOOK_DEADLINE_MS = 4000;\nconst LOADED_AT = performance.now();"),
		edit(HP, "Math.floor(deadlineMs - clock())", "Math.floor(deadlineMs - (clock() - LOADED_AT))"),
	], tests: [T_DL], expectRed: [R_2672] },
	{ n: "p5", name: "the cap left at 1,500", edits: [
		edit(HP, "export const HOOK_PRODUCER_TIMEOUT_MS = 2500;", "export const HOOK_PRODUCER_TIMEOUT_MS = 1500;"),
	], tests: [T_PR, T_DL], expectRed: [R_2671, SEAL] },
	{ n: "p6", name: "no Math.floor on the limit", edits: [
		edit(HP, "Math.floor(deadlineMs - clock())", "(deadlineMs - clock())"),
	], tests: [T_PR], expectRed: [R_2673, R_2674] },
	{ n: "p7", name: "the launcher's default deadline is HOOK_DEADLINE_MS", edits: [
		edit(HP, "env = process.env, deadlineMs, clock", "env = process.env, deadlineMs = HOOK_DEADLINE_MS, clock"),
	], tests: [T_PR], expectRed: [R_2674] },
	{ n: "p8", name: "the objective hook passes the deadline to its first producer only", edits: [
		edit(OBJ, `objectiveLength)], ${DEADLINE} });`, "objectiveLength)] });"),
	], tests: [T_DL], expectRed: [R_2672] },
	{ n: "p9a", name: "the cap changed", edits: [
		edit(HP, "export const HOOK_PRODUCER_TIMEOUT_MS = 2500;", "export const HOOK_PRODUCER_TIMEOUT_MS = 2600;"),
	], tests: [T_PR], expectRed: [SEAL] },
	{ n: "p9b", name: "the deadline changed", edits: [
		edit(HP, "export const HOOK_DEADLINE_MS = 4000;", "export const HOOK_DEADLINE_MS = 3900;"),
	], tests: [T_PR], expectRed: [SEAL] },
	{ n: "p10", name: "each hook computes HOOK_DEADLINE_MS - performance.now() once and passes that", edits: [
		edit(OBJ, REPO, `${REPO}\nconst deadline = HOOK_DEADLINE_MS - globalThis.performance.now();`),
		edit(OBJ, DEADLINE, "deadlineMs: deadline", 2),
		edit(ADO, REPO, `${REPO}\nconst deadline = HOOK_DEADLINE_MS - globalThis.performance.now();`),
		edit(ADO, DEADLINE, "deadlineMs: deadline", 2),
	], tests: [T_DL], expectRed: [R_2671] },
	{ n: "p11", name: "the skip tests only limit === 0", edits: [
		edit(HP, "\t\tif (limit > 0) {", "\t\tif (limit !== 0) {"),
	], tests: [T_PR], expectRed: [R_2673] },
];

process.exitCode = await runMutations({ lane: "objective-hook-win", self: import.meta.url, tip: "171778fb", declared: DECLARED, pairs: PAIRS });
