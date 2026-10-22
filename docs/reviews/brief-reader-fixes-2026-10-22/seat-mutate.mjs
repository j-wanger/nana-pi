#!/usr/bin/env node
// Seat wrong-code pairs for lane brief-reader-fixes (ordinary lane), written by the seat 2026-10-22 after build 1, on the
// shared runner, at tip a4e0c45f. They are the must-meet's seat-step pairs: the planner's eleven (p1 to p11) and the
// adversary's six (p12 to p17). Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/brief-reader-fixes-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LIB = "packages/nana-pack/lib/brief-precedent.mjs";
const SCAN = "packages/nana-pack/lib/markdown-list-sections.mjs";
const CONFIG = "packages/nana-pack/lib/brief-config.mjs";
const CHECK = "packages/nana-pack/bin/brief-check.mjs";
const T = "packages/nana-pack/tests/worker-lane.test.mjs";
const BC = "packages/nana-pack/tests/brief-check.test.mjs";
const F = "packages/nana-pack/tests/frontier.test.mjs";
const H = "packages/nana-pack/tests/handoff-asks.test.mjs";
const R_2580 = /^R-2580: /; // R-2580
const R_2616 = /^R-2616: /; // R-2616
const R_2617 = /^R-2617: /; // R-2617
const R_2618 = /^R-2618: /; // R-2618
const R_2619 = /^R-2619: /; // R-2619
const R_2620 = /^R-2620: /; // R-2620
const R_2621 = /^R-2621: /; // R-2621
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const KIND_BREAK = 'if (section.kind === "label" && firstListItem && currentListItem.kind !== firstListItem.kind && currentListItem.indent <= firstListItem.indent) break;';
const BOLD_STRIP = 'const text = entryText(entry).replaceAll("**", "");';
const HEADING_REST = "return !/^[\\p{L}\\p{N}]/u.test(rest);";

const DECLARED = [
	"(plan) p1 to p11 are the planner's: the label section keeps reading items of the other kind; it ends at any unindented non-list line; the kind boundary also on heading sections; kind compared by character; only **Precedent:** read as bold; the inline form read as a section; one trailing mark stripped, not a run; bold stripped only as a whole-token pair; every * stripped; the heading predicate left as plain isNamed; a heading counted only when exactly Precedent",
	"(adversary) p12 to p17 are the adversary's: the kind boundary ignores indentation; the colon not stripped; ** removed after the none: check; brief-check refuses without the path; brief-check resolves the brief from its working folder; the unsafe-path check only after the mark strip",
	"(seat) p3 runs the frontier and handoff-asks files as well, because heading sections must read as on main",
];

const PAIRS = [
	{ n: "p1", name: "the label section keeps reading items of the other kind", edits: [
		one(SCAN, KIND_BREAK, ""),
	], tests: [T], expectRed: [R_2616] },
	{ n: "p2", name: "the label section ends at any unindented non-list line", edits: [
		one(SCAN, "while (next < section.end && !/^\\s*$/.test(lines[next]) && !isListItem(lines[next]) && !isHeading(lines[next])) {", "while (next < section.end && !/^\\s*$/.test(lines[next]) && !isListItem(lines[next]) && !isHeading(lines[next]) && (section.kind !== \"label\" || /^\\s/.test(lines[next]))) {"),
	], tests: [T], expectRed: [R_2616] },
	{ n: "p3", name: "the kind boundary also on heading sections", edits: [
		one(SCAN, KIND_BREAK, 'if (firstListItem && currentListItem.kind !== firstListItem.kind && currentListItem.indent <= firstListItem.indent) break;'),
	], tests: [T, F, H], expectRed: [R_2580, R_2620] },
	{ n: "p4", name: "kind compared by character", edits: [
		one(SCAN, 'kind: /^\\d/.test(match[2]) ? "ordered" : "bullet"', 'kind: /^\\d/.test(match[2]) ? "ordered" : match[2]'),
	], tests: [T], expectRed: [R_2616] },
	{ n: "p5", name: "only **Precedent:** read as bold", edits: [
		one(LIB, "label: [`${PRECEDENT_SECTION}:`, `**${PRECEDENT_SECTION}:**`, `**${PRECEDENT_SECTION}**:`],", "label: [`${PRECEDENT_SECTION}:`, `**${PRECEDENT_SECTION}:**`],"),
	], tests: [T], expectRed: [R_2617] },
	{ n: "p6", name: "the inline form read as a section", edits: [
		one(SCAN, "labels.includes(lines[index].trim())", "labels.some((entry) => lines[index].trim().startsWith(entry))"),
	], tests: [T], expectRed: [R_2618] },
	{ n: "p7", name: "one trailing mark stripped, not a run", edits: [
		one(LIB, "while (value && PRECEDENT_TRAILING_PUNCTUATION.includes(value.at(-1))) value = value.slice(0, -1);", "if (value && PRECEDENT_TRAILING_PUNCTUATION.includes(value.at(-1))) value = value.slice(0, -1);"),
	], tests: [T], expectRed: [R_2619] },
	{ n: "p8", name: "bold stripped only as a whole-token pair", edits: [
		one(LIB, BOLD_STRIP, 'const text = entryText(entry).replace(/^\\*\\*(\\S+)\\*\\*(?=\\s|$)/, "$1");'),
	], tests: [T], expectRed: [R_2619] },
	{ n: "p9", name: "every * stripped", edits: [
		one(LIB, BOLD_STRIP, 'const text = entryText(entry).replaceAll("*", "");'),
	], tests: [T], expectRed: [R_2619] },
	{ n: "p10", name: "the heading predicate left as plain isNamed", edits: [
		one(LIB, HEADING_REST, "return true;"),
	], tests: [T], expectRed: [R_2620] },
	{ n: "p11", name: "a heading counted only when exactly Precedent", edits: [
		one(LIB, HEADING_REST, 'return rest === "";'),
	], tests: [T], expectRed: [R_2620] },
	{ n: "p12", name: "the kind boundary ignores indentation", edits: [
		one(SCAN, KIND_BREAK, 'if (section.kind === "label" && firstListItem && currentListItem.kind !== firstListItem.kind) break;'),
	], tests: [T], expectRed: [R_2616] },
	{ n: "p13", name: "the colon not stripped", edits: [
		one(CONFIG, 'export const PRECEDENT_TRAILING_PUNCTUATION = ",;.):";', 'export const PRECEDENT_TRAILING_PUNCTUATION = ",;.)";'),
	], tests: [T], expectRed: [R_2619] },
	{ n: "p14", name: "** removed after the none: check", edits: [
		one(LIB, BOLD_STRIP, "const text = entryText(entry);"),
		one(LIB, 'let value = text.split(/\\s+/, 1)[0]?.replaceAll("`", "") ?? "";', 'let value = text.replaceAll("**", "").split(/\\s+/, 1)[0]?.replaceAll("`", "") ?? "";'),
	], tests: [T], expectRed: [R_2619] },
	{ n: "p15", name: "brief-check refuses without the path", edits: [
		one(CHECK, "process.stderr.write(`brief-check: cannot read brief at ${briefPath}; a relative --brief resolves from --tree\\n`);", 'process.stderr.write("brief-check: cannot read brief\\n");'),
	], tests: [BC], expectRed: [R_2621] },
	{ n: "p16", name: "brief-check resolves the brief from its working folder", edits: [
		one(CHECK, 'const briefPath = path.resolve(worktreeRoot, values.get("--brief"));', 'const briefPath = path.resolve(values.get("--brief"));'),
	], tests: [BC], expectRed: [R_2621] },
	{ n: "p17", name: "the unsafe-path check only after the mark strip", edits: [
		one(LIB, "const unsafe = unsafeBeforeMarks || unsafePath(value);", "const unsafe = unsafePath(value);"),
	], tests: [T], expectRed: [R_2619] },
];

process.exitCode = await runMutations({ lane: "brief-reader-fixes", self: import.meta.url, tip: "a4e0c45f", declared: DECLARED, pairs: PAIRS });
