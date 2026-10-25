#!/usr/bin/env node
// Seat wrong-code pairs for lane win-temp-check (ordinary), written by the seat 2026-10-24 after build 2 at b4dd8320.
// They follow R-2803's red cases in the must-meet.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-temp-check-2026-10-24/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const H = "packages/nana-pack/tests/process-tree-helper.mjs";
const T_WC = "packages/nana-pack/tests/worker-claude.test.mjs";
const R_2803 = /^R-2803: /; // R-2803
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const READ = "try { return fs.readdirSync(root).sort(); }";
const MISSING = 'if (error?.code === "ENOENT") return [];';

const DECLARED = [
	"(seat) pairs 1 to 5 follow R-2803's red cases: unsorted names, a PowerShell-named file reported empty, a folder dropped, a missing folder throwing, and one name for many",
	"(seat) declared non-pairs: the `--poll 60` starts and the three hard-kill observations' use of the helper have no row (the must-meet shows them in the diff); their effect shows only on Windows, so the pull request's Windows suite leg is their evidence",
];

const PAIRS = [
	{ n: "1", name: "the names come back unsorted", edits: [one(H, READ, "try { return fs.readdirSync(root); }")], tests: [T_WC], expectRed: [R_2803] },
	{ n: "2", name: "a PowerShell policy-test file is skipped", edits: [one(H, READ, 'try { return fs.readdirSync(root).filter((name) => !name.startsWith("__PSScriptPolicyTest_")).sort(); }')], tests: [T_WC], expectRed: [R_2803] },
	{ n: "3", name: "a folder left behind is not named", edits: [one(H, READ, "try { return fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name).sort(); }")], tests: [T_WC], expectRed: [R_2803] },
	{ n: "4", name: "a missing folder throws", edits: [one(H, MISSING, "if (false) return [];")], tests: [T_WC], expectRed: [R_2803] },
	{ n: "5", name: "only the first name is returned", edits: [one(H, READ, "try { return fs.readdirSync(root).sort().slice(0, 1); }")], tests: [T_WC], expectRed: [R_2803] },
];

process.exitCode = await runMutations({ lane: "win-temp-check", self: import.meta.url, tip: "b4dd8320", declared: DECLARED, pairs: PAIRS });
