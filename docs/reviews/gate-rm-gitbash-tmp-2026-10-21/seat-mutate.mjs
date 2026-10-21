#!/usr/bin/env node
// Seat wrong-code pairs for lane gate-rm-gitbash-tmp (gate lane), written by the seat 2026-10-21 after build 4, on the
// shared runner. They are the plan's pairs (a) to (i), with (i) redefined by the plan adversary as "translate before
// collapsing ..". Pair (j), nana-gate passing no platform or env, turns only the Windows-only rows R-2495 and R-2496
// red, so it rests on the Windows CI leg and is not run here. Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/gate-rm-gitbash-tmp-2026-10-21/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-pack/tests/gate-rm-outside.test.mjs";
const LIB = "packages/nana-pack/lib/gate-rm-outside.ts";
const ROOTS = "packages/nana-pack/lib/gate-temp-roots.ts";
const R_2490 = /^on Windows a Git Bash \/tmp target is judged/; // R-2490
const R_2491 = /^on Windows a cd to Git Bash \/tmp moves/; // R-2491
const R_2492 = /^on Windows a Git Bash drive spelling such as \/c\//; // R-2492
const R_2493 = /^Git Bash lookalikes, climb-outs/; // R-2493
const R_2494 = /^a Git Bash \/tmp target still asks when TMP names/; // R-2494
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(plan) pairs (a) to (i) from the plan and its adversary, each expected to turn a named row red on macOS",
	"(plan) pair (j), nana-gate.ts passing no platform or env, turns only R-2495 and R-2496 red; those rows skip off Windows, so the Windows CI leg is its only evidence",
];

const PAIRS = [
	{ n: "a", name: "no translation: gitBashPath returns every spelling unchanged", edits: [
		one(LIB, 'if (platform !== "win32" || env === undefined || spelling.startsWith("//") || spelling.includes("\\\\")) return spelling;', "return spelling;"),
	], tests: [T], expectRed: [R_2490, R_2491, R_2492, R_2493, R_2494] },
	{ n: "b", name: "rm targets translated, the cd folder not", edits: [
		one(LIB, "const typed = rawTyped !== null && !powershell && platform !== undefined && env !== undefined ? gitBashPath(rawTyped, { platform, env }) : rawTyped;", "const typed = rawTyped;"),
	], tests: [T], expectRed: [R_2491] },
	{ n: "c", name: "TEMP read before TMP", edits: [
		one(LIB, 'export const GIT_BASH_TEMP_VARIABLES = ["TMP", "TEMP"] as const;', 'export const GIT_BASH_TEMP_VARIABLES = ["TEMP", "TMP"] as const;'),
	], tests: [T], expectRed: [R_2490] },
	{ n: "d", name: "a /tmp prefix with no folder boundary", edits: [
		one(LIB, "normalized.startsWith(`${GIT_BASH_TEMP}/`)", "normalized.startsWith(GIT_BASH_TEMP)"),
	], tests: [T], expectRed: [R_2493] },
	{ n: "e", name: "the translation applied to PowerShell targets too", edits: [
		one(LIB, "const translated = powershell || platform === undefined || env === undefined ? target", "const translated = platform === undefined || env === undefined ? target"),
	], tests: [T], expectRed: [R_2493] },
	{ n: "f", name: "the translation applied on every platform", edits: [
		one(LIB, 'if (platform !== "win32" || env === undefined ||', "if (env === undefined ||"),
	], tests: [T], expectRed: [R_2493, R_2492] },
	{ n: "g", name: "TMP added straight to the temp roots, skipping the root and home exclusions", edits: [
		one(ROOTS, "return candidates.map(resolve).filter((t) => !isExcludedTempRoot(t, resolvedHome));", "return [...candidates.slice(0, 1).map(resolve).filter((t) => !isExcludedTempRoot(t, resolvedHome)), ...candidates.slice(1).map(resolve)];"),
	], tests: [T], expectRed: [R_2494] },
	{ n: "h1", name: "the drive letter kept lower-case", edits: [
		one(LIB, "drive[1].toUpperCase()", "drive[1]"),
	], tests: [T], expectRed: [R_2492] },
	{ n: "h2", name: "a bare /c read as the drive-relative C:", edits: [
		one(LIB, 'normalized.slice(drive[0].length) || "/"', 'normalized.slice(drive[0].length) || ""'),
	], tests: [T], expectRed: [R_2492] },
	{ n: "h3", name: "a drive match of up to two letters", edits: [
		one(LIB, "export const GIT_BASH_DRIVE = /^\\/([A-Za-z])(?=\\/|$)/;", "export const GIT_BASH_DRIVE = /^\\/([A-Za-z]{1,2})(?=\\/|$)/;"),
	], tests: [T], expectRed: [R_2492] },
	{ n: "i", name: "translate before collapsing .. (no path.posix.normalize)", edits: [
		one(LIB, "const normalized = path.posix.normalize(spelling);", "const normalized = spelling;"),
	], tests: [T], expectRed: [R_2493] },
];

process.exitCode = await runMutations({ lane: "gate-rm-gitbash-tmp", self: import.meta.url, tip: "731f5a22", declared: DECLARED, pairs: PAIRS });
