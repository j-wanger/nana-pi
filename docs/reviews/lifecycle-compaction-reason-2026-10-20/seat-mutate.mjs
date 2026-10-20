#!/usr/bin/env node
// Seat wrong-code pairs for lane lifecycle-compaction-reason (hook lane: the nana-lifecycle pi extension), written by
// the seat 2026-10-20 on build 1, on the shared runner. M1-M3 revert each compaction handler to main's form (no reason);
// M4 and M5 put the plan's W7 (spread pi's event) and W2 (default a missing reason) on one handler each, since
// main's form cannot turn R-2380 or R-2382 red (must-meet.md, Known limits). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/lifecycle-compaction-reason-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LJ = "packages/nana-pack/tests/lifecycle-journal.test.mjs";
const LC = "packages/nana-pack/extensions/nana-lifecycle.ts";
const R2141 = "journal: the three compaction lines carry pi's reason";
const R2380 = "journal: a compaction event with no reason leaves one line with no reason field";
const R2381 = "journal: a compaction reason outside manual, threshold and overflow is journaled unchanged";
const R2382 = "journal: a compaction line keeps only ts, event, cwd, pid and reason from pi's full event";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const fixed = (type) => `log(ctx, "${type}", { reason: (event as any).reason });`;

const DECLARED = [
	"(a) M1-M3 are main's form at each changed site; R-2380 and R-2382 are green on main by design, so M4 (W7) and M5 (W2) are the obvious wrong fixes that pin them",
	"(b) R-162 and R-2140 cover sites this lane did not change and have no pair",
];

const PAIRS = [
	{ n: "M1", name: "session_before_compact journals no reason (main's form)", edits: [
		one(LC, fixed("session_before_compact"), `log(ctx, "session_before_compact");`),
	], tests: [LJ], expectRed: [R2141, R2381] },
	{ n: "M2", name: "session_compact journals no reason (main's form)", edits: [
		one(LC, fixed("session_compact"), `log(ctx, "session_compact");`),
	], tests: [LJ], expectRed: [R2141, R2381] },
	{ n: "M3", name: "session_compact_failed journals no reason (main's form)", edits: [
		one(LC, fixed("session_compact_failed"), `log(ctx, "session_compact_failed");`),
	], tests: [LJ], expectRed: [R2141, R2381] },
	{ n: "M4", name: "session_before_compact spreads pi's whole event into the line (W7)", edits: [
		one(LC, fixed("session_before_compact"), `log(ctx, "session_before_compact", event as any);`),
	], tests: [LJ], expectRed: [R2382] },
	{ n: "M5", name: "session_compact_failed defaults a missing reason to \"unknown\" (W2)", edits: [
		one(LC, fixed("session_compact_failed"), `log(ctx, "session_compact_failed", { reason: (event as any).reason ?? "unknown" });`),
	], tests: [LJ], expectRed: [R2380] },
];

process.exitCode = await runMutations({ lane: "lifecycle-compaction-reason", self: import.meta.url, tip: "c81371f6", declared: DECLARED, pairs: PAIRS });
