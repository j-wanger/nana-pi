#!/usr/bin/env node
// Seat wrong-code pairs for lane runtime-map-live (install, hook or gate lane: it changes nana-land), written by the seat
// 2026-10-22 after build 2, on the shared runner, at tip 8a3df4bd, and again at 56435b70 after build 3, which added x4 and x5, at a2d72686 after build 4, and at 8dc89838 after build 5, which added x6 and x7. They are the must-meet's nine pairs ("Seat steps"),
// split where one names two wrong builds, plus the seat's two findings on build 1 (F1, F2) and three cheap extras.
// Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/runtime-map-live-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LAND = "packages/nana-pack/bin/nana-land.mjs";
const LOCKED = "scripts/test-locked.mjs";
const MEASURE = "scripts/runtime-measure.mjs";
const RMAP = "packages/nana-pack/lib/runtime-map.mjs";
const CMAP = "scripts/code-map.mjs";
const LAND_T = "packages/nana-pack/tests/land.test.mjs";
const RLAND_T = "packages/nana-pack/tests/runtime-land.test.mjs";
const RMAP_T = "packages/nana-pack/tests/runtime-map.test.mjs";
const R_2522 = /^the land runs its suite with the source tip's full SHA in NANA_LAND_TIP/; // R-2522
const R_2523 = /^a passing land suite writes runtime data naming the land tip and the time it measured/; // R-2523
const R_2524 = /^a land failing under coverage keeps its data and reruns only the failed files/; // R-2524
const R_2525 = /^a passing land suite whose runtime data cannot be written exits 0, keeps the earlier data and names why/; // R-2525
const R_2526 = /^on Windows a land suite runs once without coverage and says the runtime map was not measured/; // R-2526
const R_2528 = /^impact names the measured tip, its UTC time, its age in hours and how many tracked files differ/; // R-2528
const R_2529 = /^impact says how far main is past the measured tip, or that the tip is not on main/; // R-2529
const R_2530 = /^a passing land shows its suite's land notes/; // R-2530
const R_2531 = /^after a land the runtime data names main's tip and is not stale/; // R-2531
const R_2532 = /^filtered, wrong-tip and unset-tip runs neither measure nor rerun/; // R-2532
const R_2533 = /^a hand measure writes its tip, time and dirty-file count inside the lock/; // R-2533
const R_1277 = /^R-1277: off Windows, SIGINT or SIGTERM sent twice to the measure command/; // R-1277
const R_2534 = /^impact marks stale only the measured tests that ran a changed file/; // R-2534
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(plan) p1 to p9 are the must-meet's nine pairs; p4 names two wrong builds (rerun every file, rerun under coverage), run as p4a and p4b",
	"(seat) f1 and f2 are the seat's build-1 findings: a whole-run failure rerun away, and a write problem lost on the rerun path",
	"(seat) x1 to x3 are cheap extras: Windows measured anyway (R-2526), no tip in the data (R-2523), and main's distance counted the wrong way (R-2529)",
	"(seat) x4 and x5 (after build 3): the Windows branch ignores the hand-measure marker, and the measure command sets no marker; both leave a win32 hand measure writing nothing",
	"(seat) x6 and x7 (after round 1, the land reviewer's MUST): the measure command forwards no stop signal, and the locked suite signals only its child's process group, not the tree; R-1277 now drives the production command",
	"(seat) p2 stamps main's old SHA in the land's variable; the locked suite then sees a tip that is not HEAD and measures nothing, so R-2522 goes red with R-2531",
];

const PAIRS = [
	{ n: "p1", name: "the land's suite without NANA_LAND_TIP", edits: [
		one(LAND, "{ env: { ...process.env, [LAND_TIP_ENV]: tip } }", "{ env: { ...process.env } }"),
	], tests: [LAND_T], expectRed: [R_2522, R_2531] },
	{ n: "p2", name: "the land stamps main's old SHA instead of the source tip", edits: [
		one(LAND, "{ env: { ...process.env, [LAND_TIP_ENV]: tip } }", "{ env: { ...process.env, [LAND_TIP_ENV]: capturedMain } }"),
	], tests: [LAND_T], expectRed: [R_2522, R_2531] },
	{ n: "p3", name: "a filtered run with the land tip measures", edits: [
		one(LOCKED, "if (filters.length > 0 || !tip || tip !== head) {", "if (!tip || tip !== head) {"),
	], tests: [RLAND_T], expectRed: [R_2532] },
	{ n: "p4a", name: "the rerun runs every file", edits: [
		one(LOCKED, "return await runCommand(failed, plainEnv, cwd);", "return await runCommand([], plainEnv, cwd);"),
	], tests: [RLAND_T], expectRed: [R_2524] },
	{ n: "p4b", name: "the rerun runs under coverage", edits: [
		one(LOCKED, "return await runCommand(failed, plainEnv, cwd);", "return await runCommand(failed, coverageEnv, cwd);"),
	], tests: [RLAND_T], expectRed: [R_2524] },
	{ n: "p5", name: "a write failure after a passing coverage run exits 1", edits: [
		one(LOCKED, "\t\tcleanupCoverage();\n\t\tif (writeProblem) note(writeProblem);\n\t\treturn coverageCode;", "\t\tcleanupCoverage();\n\t\tif (writeProblem) note(writeProblem);\n\t\treturn writeProblem ? 1 : coverageCode;"),
	], tests: [RLAND_T], expectRed: [R_2525] },
	{ n: "p6", name: "the land drops its suite's notes", edits: [
		one(LAND, "const notes = landNotes(suiteResult);", "const notes = [];"),
	], tests: [LAND_T], expectRed: [R_2530] },
	{ n: "p7", name: "a hand measure that passes no tip", edits: [
		one(MEASURE, "env: { ...env, [LAND_TIP_ENV]: head.stdout.trim(), [DIRTY_COUNT_ENV]: String(dirty), [HAND_MEASURE_ENV]: \"1\" },", "env: { ...env, [DIRTY_COUNT_ENV]: String(dirty), [HAND_MEASURE_ENV]: \"1\" },"),
	], tests: [RLAND_T], expectRed: [R_2533] },
	{ n: "p8", name: "a constant age", edits: [
		one(RMAP, "const ageHours = Math.max(0, Math.floor((current.getTime() - measured.getTime()) / (60 * 60 * 1000)));", "const ageHours = 0;"),
	], tests: [RMAP_T], expectRed: [R_2528] },
	{ n: "p9", name: "every measured test marked stale when any ran a changed file", edits: [
		one(RMAP, 'const staleTag = e.changed ? ` ${STALE_MARK}` : "";', 'const staleTag = entries.some((x) => x.changed) ? ` ${STALE_MARK}` : "";'),
	], tests: [RMAP_T], expectRed: [R_2534] },
	{ n: "f1", name: "a coverage run with a whole-run failure rerun away", edits: [
		one(LOCKED, "if (!failed.length || built.failures !== failed.length) return coverageCode;", "if (!failed.length) return coverageCode;"),
	], tests: [RLAND_T], expectRed: [R_2524] },
	{ n: "f2", name: "a write problem lost on the rerun path", edits: [
		one(LOCKED, "\t\t\tif (writeProblem) note(writeProblem);\n\t\t\tif (!failed.length", "\t\t\tif (!failed.length"),
	], tests: [RLAND_T], expectRed: [R_2524] },
	{ n: "x1", name: "Windows measured like any other platform", edits: [
		one(LOCKED, "if (tip && env[HAND_MEASURE_ENV] === undefined && UNMEASURED_PLATFORMS.includes(platform)) {", "if (false) {"),
	], tests: [RLAND_T], expectRed: [R_2526] },
	{ n: "x2", name: "runtime data written without its tip", edits: [
		one(MEASURE, "if (tip !== undefined) data.tip = tip;", "/* no tip */"),
	], tests: [RLAND_T], expectRed: [R_2523] },
	{ n: "x3", name: "main's distance from the tip counted the wrong way", edits: [
		one(CMAP, 'run(["rev-list", "--count", `${tip}..${MAIN_REF}`])', 'run(["rev-list", "--count", `${MAIN_REF}..${tip}`])'),
	], tests: [RMAP_T], expectRed: [R_2529] },
	{ n: "x4", name: "the Windows branch ignores the hand-measure marker", edits: [
		one(LOCKED, "if (tip && env[HAND_MEASURE_ENV] === undefined && UNMEASURED_PLATFORMS.includes(platform)) {", "if (tip && UNMEASURED_PLATFORMS.includes(platform)) {"),
	], tests: [RLAND_T], expectRed: [R_2533] },
	{ n: "x5", name: "the measure command sets no marker", edits: [
		one(MEASURE, ", [HAND_MEASURE_ENV]: \"1\" },", " },"),
	], tests: [RLAND_T], expectRed: [R_2533] },
	{ n: "x6", name: "the measure command forwards no stop signal", edits: [
		one(MEASURE, "try { child.kill(signal); } catch {}", "/* no forwarding */"),
	], tests: [RMAP_T], expectRed: [R_1277] },
	{ n: "x7", name: "the locked suite signals only its child's process group", edits: [
		one(LOCKED, "killTree(target.pid, { signal })", "process.kill(-target.pid, signal)"),
	], tests: [RMAP_T], expectRed: [R_1277] },
];

process.exitCode = await runMutations({ lane: "runtime-map-live", self: import.meta.url, tip: "8dc89838", declared: DECLARED, pairs: PAIRS });
