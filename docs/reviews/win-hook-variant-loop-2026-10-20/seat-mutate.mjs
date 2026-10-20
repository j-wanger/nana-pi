#!/usr/bin/env node
// Seat wrong-code pairs for lane win-hook-variant-loop (install, hook or gate lane: doctor's Windows hook rows), written by
// the seat 2026-10-20 after build 1, on the shared runner. Each pair puts one product site the lane changed in
// lib/hook-health.mjs's win32 branch into its wrong form: main's form (no hand repair at all), or the obvious wrong
// implementation of the detail text, the merge on a copy, the left-as-written filter and the shape guard (the build brief's
// wrong-code list and the builder's report name most of them). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-hook-variant-loop-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-setup/tests/win32-hook-repair.test.mjs";
const HH = "packages/nana-setup/lib/hook-health.mjs";
const R2410 = "win32 doctor: after install, a ✗ settings row names each dead entry install leaves and its hand repair";
const R2411 = "win32 doctor: a ✗ settings row never names an entry install repairs as a hand repair";
const R2412 = "win32 doctor: a settings shape install refuses still prints all six settings rows as ✗";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const GUARD = "if (!healthy && validateShape(settings) === null) {";
const MERGE = "const merged = mergeRepoHooks(stepSettings, { repoRoot, wanted: [w], platform: platformValue });";

const DECLARED = [
	"(a) every pair runs on macOS: the test file's own run() forces NANA_SETUP_PLATFORM=win32 on each install and doctor it spawns, so the win32 branch runs on every leg",
	"(b) no pair: the import line (interface only; a dropped name fails the import, not a check); the resolvesInsideCheckout extraction (the same predicate, now named); `!healthy` in the guard (a healthy row's targets all resolve, so the list is empty and nothing is appended); structuredClone (each row's merge touches only that row's entries, and neither doctor nor the stale-copy producer reads those entries again, so the brief's 'never change the caller's settings' is unpinned); the mergeHooks fallback (it only adds an entry whose target lies inside the checkout, which the filter drops); the Set de-dup (F4's three look-alikes share one path, but R-2410 reads the line with includes, so design step 2's 'drop duplicates' is unpinned); the @outputs header. The seat ran win32-hook-repair on scratch copies of the tip with the clone, the mergeHooks fallback or the de-dup removed: each read 14/14 green",
	"(c) the brief's Windows-only pair (drop today's detail, which turns doctor-detail's R-393 check red) is not in this table: on macOS that check runs the POSIX branch, and the runner scrubs NANA_ variables from its test children, so no pair can force win32 there; it stays for the Windows CI leg",
];

const PAIRS = [
	// the appended hand repair text (R-2410)
	{ n: "H1", name: "main's form: the new block never runs, so no ✗ line names an entry or a fix", edits: [
		one(HH, GUARD, "if (false) {"),
	], tests: [T], expectRed: [R2410] },
	{ n: "H2", name: "(unnamed detail) the hand repair names no dead path", edits: [
		one(HH, 'install leaves ${leftAsWritten.join(", ")} as written', "install leaves an entry as written"),
	], tests: [T], expectRed: [R2410] },
	{ n: "H3", name: "(omitted checkout script) the hand repair does not name this checkout's script", edits: [
		one(HH, "edit that entry to run ${w.entry.args[0]} or remove it by hand", "edit that entry or remove it by hand"),
	], tests: [T], expectRed: [R2410] },
	{ n: "H4", name: "the appended text names the path and the script but no fix by hand", edits: [
		one(HH, "edit that entry to run ${w.entry.args[0]} or remove it by hand, then run nana-setup install", "this checkout's script is ${w.entry.args[0]}"),
	], tests: [T], expectRed: [R2410] },

	// which entries install leaves (R-2411)
	{ n: "H5", name: "(skipped merge-on-copy) install's merge never runs on the copy, so every dead target is named", edits: [
		one(HH, MERGE, "const merged = {};"),
	], tests: [T], expectRed: [R2411] },
	{ n: "H6", name: "the merge runs on the copy but the targets are read from the caller's unmerged settings", edits: [
		one(HH, "hookTargets(stepSettings, w.event, w.spec, platformValue)", "hookTargets(settings, w.event, w.spec, platformValue)"),
	], tests: [T], expectRed: [R2411] },
	{ n: "H7", name: "the merge on the copy runs with no platform, so it repairs by POSIX rules", edits: [
		one(HH, MERGE, "const merged = mergeRepoHooks(stepSettings, { repoRoot, wanted: [w] });"),
	], tests: [T], expectRed: [R2411] },
	{ n: "H8", name: "(repair on every unhealthy row) the hand repair is appended even when install leaves nothing", edits: [
		one(HH, "if (leftAsWritten.length > 0) {", "if (true) {"),
	], tests: [T], expectRed: [R2411] },
	{ n: "H9", name: "no filter: targets that resolve inside the checkout are named as left too", edits: [
		one(HH, "\n\t\t\t\t\t.filter((target) => !resolvesInsideCheckout(target))", ""),
	], tests: [T], expectRed: [R2411] },

	// the shape guard (R-2412)
	{ n: "H10", name: "(removed shape guard) the merge runs on a settings shape install refuses", edits: [
		one(HH, GUARD, "if (!healthy) {"),
	], tests: [T], expectRed: [R2412] },
];

process.exitCode = await runMutations({ lane: "win-hook-variant-loop", self: import.meta.url, tip: "32cdb9ee", declared: DECLARED, pairs: PAIRS });
