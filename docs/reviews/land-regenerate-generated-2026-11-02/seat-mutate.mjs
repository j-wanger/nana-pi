#!/usr/bin/env node
// Seat wrong-code pairs for lane land-regenerate-generated (gate lane: land tool), written by the windows sub-seat
// 2026-11-02 after build 2, on the shared runner. Each pair is one of the plan's named wrong versions.
// Run from the worktree root:
//   SEAT_MUTATE_SHARDS=1 SEAT_MUTATE_OUT=<file> node docs/reviews/land-regenerate-generated-2026-11-02/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LAND = "packages/nana-pack/bin/nana-land.mjs";
const T = "packages/nana-pack/tests/land-regenerate.test.mjs";
const M1 = /^M1: generated-only conflicts land actual generator bytes/; // R-3706
const M2 = /^M2: non-contract and rename conflicts refuse/; // R-3707
const M3 = /^M3: failed timed-out and post-write checks refuse/; // R-3708
const M4 = /^M4: scope guard catches/; // R-3709
const one = (anchor, replacement) => ({ file: LAND, anchor, replacement, times: 1 });

const DECLARED = [
	"(plan) one pair per named wrong version in plan Design and Revision 2",
	"(plan pair 'run the generator through npm') not written: no one-line edit routes the sealed argv through npm; M5 pins the argv and the npm-script decoy directly",
];

const PAIRS = [
	{ n: "G1", name: "treat any conflict as regenerable", edits: [
		one("if (conflicts.some(file => !GENERATOR_CONTRACT.some(entry => entry.path === file))) throw", "if (false) throw"),
	], tests: [T], expectRed: [M2] },
	{ n: "G2", name: "skip the generator check after the write", edits: [
		one("for (const entry of generatorContract) command(entry.check, \"generatorCheck\");", "// wrong: no check after write"),
	], tests: [T], expectRed: [M3] },
	{ n: "G3", name: "skip the non-contract tree comparison (index-only changes)", edits: [
		one("if (treeChanges.length) throw", "if (false) throw"),
	], tests: [T], expectRed: [M4] },
	{ n: "G4", name: "skip the working-copy scope check (untracked, ignored, tracked writes)", edits: [
		one("if (outside.length) throw", "if (false) throw"),
	], tests: [T], expectRed: [M4] },
	{ n: "G5", name: "skip the configuration guard", edits: [
		one("  guardGeneratorConfiguration(checkout);\n", "\n"),
	], tests: [T], expectRed: [M4] },
	{ n: "G6", name: "leave the temporary folder behind", edits: [
		one("} finally { rmSync(folder, { recursive: true, force: true }); }", "} finally { void folder; }"),
	], tests: [T], expectRed: [M3] },
	{ n: "G7", name: "land the conflicted tree without regenerating", edits: [
		one("return { tree: regenerateTree(runGit, main, lines[0], conflicts, generators), base, regenerated: conflicts };", "return { tree: lines[0], base, regenerated: conflicts };"),
	], tests: [T], expectRed: [M1] },
];

process.exitCode = await runMutations({ lane: "land-regenerate-generated", self: import.meta.url, tip: "HEAD", declared: DECLARED, pairs: PAIRS });
