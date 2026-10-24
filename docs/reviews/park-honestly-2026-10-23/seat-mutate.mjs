#!/usr/bin/env node
// Seat wrong-code pairs for lane park-honestly (ordinary), written by the seat 2026-10-23 after build 1, at tip 521016cc.
// They are the must-meet's pairs 1 to 5; each edits the real ledger and must turn R-2730 red.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/park-honestly-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LEDGER = "REQUIREMENTS.md";
const T_DEL = "packages/nana-pack/tests/requirements-deliverables.test.mjs";
const R_2730 = /^R-2730: /; // R-2730
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const P749 = "Parked: R-749 · since 2026-10-23: the owner parked it for now;";
const P694 = "Parked: R-694 · since 2026-10-23: the writing trial closed when the owner adopted the writing rule on 2026-10-21, and nothing has read the extract since; a new writing trial deletes this line";
const P327 = "Parked: R-327 · since 2026-10-23: the seeds are written once,";
const R301 = "Read by: R-301 · code: packages/nana-setup/claude/hooks/nana-adoption.mjs, packages/nana-setup/bin/stale-copies.mjs, packages/nana-setup/lib/stale-copies.mjs, packages/nana-setup/lib/hook-health.mjs\n";
const R1272 = "Read by: R-1272 · code: scripts/code-map.mjs";

const DECLARED = [
	"(plan) pairs 1 to 5 follow the must-meet's list; a park line under a feature heading or inside a code fence reads as prose and is a declared non-pair",
];

const PAIRS = [
	{ n: "1", name: "a park line written with - for ·", edits: [
		one(LEDGER, P749, "Parked: R-749 - since 2026-10-23: the owner parked it for now;"),
	], tests: [T_DEL], expectRed: [R_2730] },
	{ n: "2", name: "a park line with no reason", edits: [
		one(LEDGER, P694, "Parked: R-694 · since 2026-10-23:"),
	], tests: [T_DEL], expectRed: [R_2730] },
	{ n: "3", name: "a park line in another capability's span", edits: [
		one(LEDGER, P327, "Parked: R-1400 · since 2026-10-23: the seeds are written once,"),
	], tests: [T_DEL], expectRed: [R_2730] },
	{ n: "4", name: "a park line on a row code makes and reads", edits: [
		one(LEDGER, R301, `${R301}Parked: R-301 · since 2026-10-23: held by hand; a run deletes this line\n`),
	], tests: [T_DEL], expectRed: [R_2730] },
	{ n: "5", name: "the R-1272 reader path misspelled", edits: [
		one(LEDGER, R1272, "Read by: R-1272 · code: scripts/code_map.mjs"),
	], tests: [T_DEL], expectRed: [R_2730] },
];

process.exitCode = await runMutations({ lane: "park-honestly", self: import.meta.url, tip: "521016cc", declared: DECLARED, pairs: PAIRS });
