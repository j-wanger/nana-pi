#!/usr/bin/env node
// Seat wrong-code pairs for lane frontier-first (ordinary lane), written by the seat 2026-10-21 after build 2, on the
// shared runner: the must-meet's pairs, each expected to turn its row red. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/frontier-first-2026-10-21/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-pack/tests/frontier.test.mjs";
const CLI = "packages/nana-pack/bin/nana-frontier.mjs";
const CFG = "packages/nana-pack/lib/frontier-config.mjs";
const H = "HANDOFF.md";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const R2470 = /^R-2470: /, R2471 = /^R-2471: /, R2472 = /^R-2472: /, R2473 = /^R-2473: /;

const DECLARED = ["(build 2, e8096fd4) the must-meet's wrong-code pairs over the three new kinds and this repository's HANDOFF"];

const PAIRS = [
	{ n: "F1", name: "Carried residuals is not an archive heading", edits: [
		one(CFG, '["Landed", "Carried residuals"]', '["Landed"]'),
	], tests: [T], expectRed: [R2470] },
	{ n: "F2", name: "every live heading is flagged whenever any archive heading exists", edits: [
		one(CLI, "		if (heading.index <= firstArchive.index) continue;\n", ""),
	], tests: [T], expectRed: [R2470] },
	{ n: "F3", name: "the last archive heading decides instead of the first", edits: [
		one(CLI, "const firstArchive = headings.find(", "const firstArchive = headings.findLast("),
	], tests: [T], expectRed: [R2470] },
	{ n: "F4", name: "read-window counts characters instead of UTF-8 bytes", edits: [
		one(CLI, 'Buffer.byteLength(text.slice(0, lineEnds[endIndex] ?? text.length), "utf8")', "text.slice(0, lineEnds[endIndex] ?? text.length).length"),
	], tests: [T], expectRed: [R2471] },
	{ n: "F5", name: "file-size counts characters instead of UTF-8 bytes", edits: [
		one(CLI, 'const bytes = Buffer.byteLength(text, "utf8");', "const bytes = text.length;"),
	], tests: [T], expectRed: [R2472] },
	{ n: "F6", name: "read-window tests the heading's own position, not the section's end", edits: [
		one(CLI, "const endIndex = boundary ? boundary.index - 1 :", "const endIndex = true ? heading.index :"),
	], tests: [T], expectRed: [R2471] },
	{ n: "F7", name: "a section ends at the next heading of any level", edits: [
		one(CLI, "candidate.index > heading.index && candidate.level <= heading.level", "candidate.index > heading.index"),
	], tests: [T], expectRed: [R2471] },
	{ n: "F8", name: "the final newline counts as an extra line", edits: [
		one(CLI, "const lineCount = lines.length - (hasFinalEol ? 1 : 0);", "const lineCount = lines.length;"),
	], tests: [T], expectRed: [R2472] },
	{ n: "F9", name: "file-size flags a document at the line limit", edits: [
		one(CLI, "if (bytes > READ_WINDOW_BYTES || lineCount > READ_WINDOW_LINES) {", "if (bytes > READ_WINDOW_BYTES || lineCount >= READ_WINDOW_LINES) {"),
	], tests: [T], expectRed: [R2472] },
	{ n: "F10", name: "a Landed heading lands above this repository's live sections (as a careless merge would)", edits: [
		one(H, "\n## Where things stand\n", "\n## Landed (one line each)\n\n- 2026-10-21: a misplaced line.\n\n## Where things stand\n"),
	], tests: [T], expectRed: [R2473] },
];

process.exitCode = await runMutations({ lane: "frontier-first", self: import.meta.url, tip: "e8096fd4", declared: DECLARED, pairs: PAIRS });
