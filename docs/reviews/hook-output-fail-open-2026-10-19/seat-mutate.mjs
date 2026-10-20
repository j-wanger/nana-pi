#!/usr/bin/env node
// Seat wrong-code pairs for lane hook-output-fail-open (hook lane), written by the seat 2026-10-19 after build 1
// (1ca5420d), on the shared runner. M1-M4 each revert one hook entry's stdout error listener to main's form (no
// listener); M5 is the roster notice pin (must-meet.md R-1943): its entry's process.exit(0) removed. Run from the
// worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/hook-output-fail-open-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const HC = "packages/nana-setup/tests/hooks-closed-output.test.mjs";
const HOOKS = "packages/nana-setup/claude/hooks";
const OBJ = `${HOOKS}/nana-objective.mjs`;
const ADO = `${HOOKS}/nana-adoption.mjs`;
const MEM = `${HOOKS}/nana-shared-memory.mjs`;
const VER = `${HOOKS}/verifier-pipe.mjs`;
const ROS = `${HOOKS}/nana-roster-notice.mjs`;
const T1940 = "objective hook ignores a closed stdout and exits 0";
const T1941 = "adoption hook ignores a closed stdout and exits 0";
const T1942 = "shared-memory hook ignores a closed stdout and exits 0";
const T1943 = "roster-notice hook ignores a closed stdout and exits 0";
const T1944 = "verifier hook ignores a closed stdout and exits 0";
const LISTENER = 'process.stdout.on("error", () => {});';
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) every pair runs on macOS only; Windows, where a closed reader may surface as EPIPE or EOF, is unprobed (must-meet.md Known limits)",
	"(b) the 'ignore every stdout error' choice has no pair: an EPIPE-only listener stays green on macOS by design (must-meet.md Known limits), and this runner has no stay-green pairs",
	"(c) the four @errors header clauses are documentation and have no pair",
];

const PAIRS = [
	{ n: "M1", name: "objective hook has no stdout error listener (main's form)", edits: [one(OBJ, LISTENER, "")], tests: [HC], expectRed: [T1940] },
	{ n: "M2", name: "adoption hook has no stdout error listener (main's form)", edits: [one(ADO, LISTENER, "")], tests: [HC], expectRed: [T1941] },
	{ n: "M3", name: "shared-memory hook has no stdout error listener (main's form)", edits: [one(MEM, LISTENER, "")], tests: [HC], expectRed: [T1942] },
	{ n: "M4", name: "verifier hook has no stdout error listener (main's form)", edits: [one(VER, LISTENER, "")], tests: [HC], expectRed: [T1944] },
	{ n: "M5", name: "roster notice entry no longer exits before the stream error fires (pin)", edits: [one(ROS, "process.exit(0);", "")], tests: [HC], expectRed: [T1943] },
];

process.exitCode = await runMutations({ lane: "hook-output-fail-open", self: import.meta.url, tip: "1ca5420d", declared: DECLARED, pairs: PAIRS });
