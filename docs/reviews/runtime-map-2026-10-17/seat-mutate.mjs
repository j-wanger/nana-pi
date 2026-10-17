#!/usr/bin/env node
// Seat wrong-code pairs for lane runtime-map (gate lane: pairs on the land gate's runner edit only, scripts/test.mjs),
// written by the seat 2026-10-17 after build 2, on the shared runner. Run from the worktree root:
//   node docs/reviews/runtime-map-2026-10-17/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const TR = "packages/nana-pack/tests/test-runner.test.mjs";
const RM = "packages/nana-pack/tests/runtime-map.test.mjs";
const RUNNER = "scripts/test.mjs";
const MM1 = "R-1270: with the coverage knob unset, the runner prints no knob line, writes no record or completion file, and passes the caller's NODE_V8_COVERAGE and NODE_OPTIONS unchanged, absent or set";
const MM2 = "R-1271: a fixture measurement credits each test file with the tracked files it ran, a node child's files included when the child's environment lacks the coverage variable, with the file's label and seconds, and credits no untracked file";
const MM6 = "R-1275: a run with no completion record, or with a count that differs from the records read, leaves the earlier runtime data byte for byte unchanged and exits non-zero";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(a) the lane's own pairs are only on the runner edit, as must-meet.md's gate-lane class says; the measure and impact code get the ordinary bar",
];

const PAIRS = [
	{ n: "1", name: "the runner points every test file's NODE_V8_COVERAGE at a folder even with the knob unset", edits: [one(RUNNER, "\t\tif (covFolder) env.NODE_V8_COVERAGE = covFolder;", "\t\tenv.NODE_V8_COVERAGE = covFolder ?? path.join(scratch, \"cov\");")], tests: [TR], expectRed: [MM1] },
	{ n: "2", name: "the runner prints the knob line with the knob unset", edits: [one(RUNNER, "if (coverageDir) console.log(`${KNOB_LINE} ${coverageDir}`);", "console.log(`${KNOB_LINE} ${coverageDir}`);")], tests: [TR], expectRed: [MM1] },
	{ n: "3", name: "the runner's completion record counts one file fewer than it collected", edits: [one(RUNNER, "JSON.stringify({ files: files.length })", "JSON.stringify({ files: files.length - 1 })")], tests: [RM], expectRed: [MM2] },
	{ n: "4", name: "the runner writes no record for a test file that passes or fails", edits: [one(RUNNER, "\t\tif (covFolder) writeRecord(covFolder, { path: rel(file), label, seconds: Number(secs) });", "")], tests: [RM], expectRed: [MM2] },
];

process.exitCode = await runMutations({ lane: "runtime-map", self: import.meta.url, tip: "a3e39c6", declared: DECLARED, pairs: PAIRS });
