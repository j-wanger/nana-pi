#!/usr/bin/env node
// Seat wrong-code pairs for lane shared-memory-index-cap (hook lane), written by the seat 2026-10-20 after build 1, on the
// shared runner. Each pair puts one product site the lane changed into its wrong form: the H pairs revert a decision in the
// hook's new output block (claude/hooks/nana-shared-memory.mjs) to main's behaviour or to the obvious wrong implementation
// (the builder's W letters in each name where one applies); C1 breaks the sealed budget in lib/shared-memory-config.mjs.
// Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/shared-memory-index-cap-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-setup/tests/shared-memory-budget.test.mjs";
const HOOK = "packages/nana-setup/claude/hooks/nana-shared-memory.mjs";
const CONFIG = "packages/nana-setup/lib/shared-memory-config.mjs";
const R2340 = "R-2340: an over-budget CRLF index prints at most the output budget";
const R2341 = "R-2341: over budget, every entry prints and only the longest descriptions are cut, all to the longest length that fits";
const R2342 = "R-2342: a shortened line keeps its whole title and link and ends on a whole character before the trim mark";
const R2343 = "R-2343: when titles alone overflow the budget, leading entries print and trailing entries are left out whole";
const R2344 = "R-2344: a trimmed index ends with a line naming the shortened and left-out counts and the full index path";
const R2345 = "R-2345: an index whose output is exactly the budget prints every line unchanged with no fold line";
const R2346 = "R-2346: seal: SHARED_MEMORY_OUTPUT_BUDGET is 9,000 characters";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const FITS = "if (full.length <= SHARED_MEMORY_OUTPUT_BUDGET) {";
const HEAD = String.raw`const head = line.match(/^- \[[^\]]*\]\([^)]*\)/)?.[0] ?? line;`;
const FINAL_WRITE = "process.stdout.write(fixed + render(selected, limit) + `${FOLD_LINE(shortened, total, leftOut, idx)}\\n`);";

const DECLARED = [
	"(build 1, e5b95409) every pair runs the lane's new test file only; the hook's existing test files (hook, input, closed output, install) pin the unchanged parts and no pair here touches those",
	"(a) (build 1) R-2340's check ran on fixture A alone; build 2 (4641a6f2) added the drop path, the fit-at-zero boundary and the self-heal note to it. On build 1 fixture A, which takes the description-cut path; H7, H16 and H22 break the budget only at the fit-at-zero boundary (H7), on the drop path (H16) or with a self-heal note (H22), and name R-2340 as the row they break",
	"(b) no pair: shorten's `description.length <= limit` against `<` (a description exactly L long gains a mark it does not need; no fixture's L equals a description length, so the fixtures cannot tell them apart); the search's Math.ceil against Math.floor (the loop never ends: a hang, not a wrong output); the `end > 0` guard on the surrogate back-off (at limit 0, description[-1] is undefined and the test is false, so it is equivalent); the new import line and the @outputs header text (a reverted import fails the module load, not one check); SHARED_MEMORY_TRIM_MARK (the tests read it by name, so a changed mark is a retune that must stay green, and this runner has no stay-green pairs)",
	"(c) the builder's W6 (one proportional cut for every description) replaces the whole search rather than one site; the builder saw it red on R-2341 and no seat pair repeats it",
];

const PAIRS = [
	// the fits test: today's exact output while the whole index fits the budget
	{ n: "H1", name: "main's form: the hook writes the header, the note and every entry with no bound", edits: [
		one(HOOK, FITS, "if (true) {"),
	], tests: [T], expectRed: [R2340, R2341, R2342, R2343, R2344] },
	{ n: "H2", name: "(W7) an over-budget output is cut at the budget mid-line", edits: [
		one(HOOK, FITS, "if (true) {"),
		one(HOOK, "process.stdout.write(full);", "process.stdout.write(full.slice(0, SHARED_MEMORY_OUTPUT_BUDGET));"),
	], tests: [T], expectRed: [R2341, R2342, R2343, R2344] },
	{ n: "H3", name: "(W4) the fits test uses < for <=", edits: [
		one(HOOK, FITS, "if (full.length < SHARED_MEMORY_OUTPUT_BUDGET) {"),
	], tests: [T], expectRed: [R2345] },
	{ n: "H4", name: "(W3) the fits test always reserves room for the fold line", edits: [
		one(HOOK, FITS, "if (full.length + FOLD_LINE(entries.length, entries.length, entries.length, idx).length + 1 <= SHARED_MEMORY_OUTPUT_BUDGET) {"),
	], tests: [T], expectRed: [R2345] },

	// entry split into head and description
	{ n: "H5", name: "(W1) the head is the whole line: descriptions are never cut, so an overflow drops trailing lines", edits: [
		one(HOOK, HEAD, "const head = line;"),
	], tests: [T], expectRed: [R2341, R2342, R2343, R2344] },
	{ n: "H6", name: "the head stops after the title, so the link is cut with the description", edits: [
		one(HOOK, HEAD, String.raw`const head = line.match(/^- \[[^\]]*\]/)?.[0] ?? line;`),
	], tests: [T], expectRed: [R2343] },

	// the fold line's reserved room
	{ n: "H7", name: "the fit-at-zero test reserves no room for the fold line", edits: [
		one(HOOK, "if ((fixed + render(parts, 0) + reservedFold).length <= SHARED_MEMORY_OUTPUT_BUDGET) {", "if ((fixed + render(parts, 0)).length <= SHARED_MEMORY_OUTPUT_BUDGET) {"),
	], tests: [T], expectRed: [R2340] },
	{ n: "H8", name: "no room is reserved for the fold line anywhere", edits: [
		one(HOOK, "const reservedFold = `${FOLD_LINE(total, total, total, idx)}\\n`;", 'const reservedFold = "";'),
	], tests: [T], expectRed: [R2340] },

	// the common description length
	{ n: "H9", name: "the search's upper bound is the shortest description, not the longest", edits: [
		one(HOOK, "let high = Math.max(0, ...parts.map(({ description }) => description.length));", "let high = Math.min(...parts.map(({ description }) => description.length));"),
	], tests: [T], expectRed: [R2341] },
	{ n: "H10", name: "(W9) the common length is half the largest length that fits", edits: [
		one(HOOK, "limit = low;", "limit = Math.floor(low / 2);"),
	], tests: [T], expectRed: [R2341] },
	{ n: "H11", name: "(W5) titles only when over budget: the search's result is never used", edits: [
		one(HOOK, "limit = low;", "limit = 0;"),
	], tests: [T], expectRed: [R2341] },

	// shortening one line
	{ n: "H12", name: "(W2) no surrogate back-off: a cut can end on a high surrogate", edits: [
		one(HOOK, String.raw`if (end > 0 && /[\uD800-\uDBFF]/.test(description[end - 1])) end--;`, "void end;"),
	], tests: [T], expectRed: [R2342] },
	{ n: "H13", name: "a shortened line carries no trim mark", edits: [
		one(HOOK, "return `${head}${description.slice(0, end)}${SHARED_MEMORY_TRIM_MARK}`;", "return `${head}${description.slice(0, end)}`;"),
	], tests: [T], expectRed: [R2341, R2342, R2343, R2344] },

	// the drop path (titles alone overflow)
	{ n: "H14", name: "the drop path keeps every entry", edits: [
		one(HOOK, "selected = parts.slice(0, kept);", "selected = parts;"),
	], tests: [T], expectRed: [R2343] },
	{ n: "H15", name: "the drop path keeps the trailing entries instead of the leading ones", edits: [
		one(HOOK, "selected = parts.slice(0, kept);", "selected = parts.slice(total - kept);"),
	], tests: [T], expectRed: [R2343] },
	{ n: "H16", name: "the drop loop reserves no room for the fold line", edits: [
		one(HOOK, "if (fixed.length + renderedLength + lineLength + reservedFold.length > SHARED_MEMORY_OUTPUT_BUDGET) break;", "if (fixed.length + renderedLength + lineLength > SHARED_MEMORY_OUTPUT_BUDGET) break;"),
	], tests: [T], expectRed: [R2340] },

	// the fold line
	{ n: "H17", name: "the shortened count counts every printed entry", edits: [
		one(HOOK, "const shortened = selected.filter(({ description }) => description.length > limit).length;", "const shortened = selected.length;"),
	], tests: [T], expectRed: [R2344] },
	{ n: "H18", name: "(W8) the left-out count is always 0", edits: [
		one(HOOK, "const leftOut = total - selected.length;", "const leftOut = 0;"),
	], tests: [T], expectRed: [R2344] },
	{ n: "H19", name: "the fold line swaps the shortened and left-out counts", edits: [
		one(HOOK, "FOLD_LINE(shortened, total, leftOut, idx)", "FOLD_LINE(leftOut, total, shortened, idx)"),
	], tests: [T], expectRed: [R2344] },
	{ n: "H20", name: "the fold line omits the full index path", edits: [
		one(HOOK, "left out; full index: ${idx}`;", "left out`;"),
	], tests: [T], expectRed: [R2344] },
	{ n: "H21", name: "the fold line is written before the entries, not last", edits: [
		one(HOOK, FINAL_WRITE, "process.stdout.write(fixed + `${FOLD_LINE(shortened, total, leftOut, idx)}\\n` + render(selected, limit));"),
	], tests: [T], expectRed: [R2344] },

	// the fixed part: header plus the self-heal note
	{ n: "H22", name: "the self-heal note is printed outside the budget", edits: [
		one(HOOK, "const fixed = `${HEADER(idx)}\\n${note ? `[nana:shared-memory] ${note}\\n` : \"\"}`;", "const noteLine = note ? `[nana:shared-memory] ${note}\\n` : \"\";\n\tconst fixed = `${HEADER(idx)}\\n`;"),
		one(HOOK, "process.stdout.write(full);", "process.stdout.write(fixed + noteLine + full.slice(fixed.length));"),
		one(HOOK, "process.stdout.write(fixed + render(selected, limit)", "process.stdout.write(fixed + noteLine + render(selected, limit)"),
	], tests: [T], expectRed: [R2340] },

	// lib/shared-memory-config.mjs
	{ n: "C1", name: "the budget is the platform's 10,000-character cap, with no margin", edits: [
		one(CONFIG, "export const SHARED_MEMORY_OUTPUT_BUDGET = 9000;", "export const SHARED_MEMORY_OUTPUT_BUDGET = 10000;"),
	], tests: [T], expectRed: [R2346] },
];

process.exitCode = await runMutations({ lane: "shared-memory-index-cap", self: import.meta.url, tip: "4641a6f2", declared: DECLARED, pairs: PAIRS });
