#!/usr/bin/env node
// Seat wrong-code pairs for lane deliverable-fields (ordinary lane), written by the seat 2026-10-22 after build 2, on the
// shared runner, at tip 0a57bf06. They are the plan's six pairs (must-meet "Seat steps") and build 2's four, plus one
// for the movement entry (R-2540). Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/deliverable-fields-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const DLV = "scripts/deliverables.mjs";
const TREE = "scripts/requirements-tree.mjs";
const MOVED = "scripts/requirements-moved.mjs";
const LEDGER = "REQUIREMENTS.md";
const DLV_T = "packages/nana-pack/tests/requirements-deliverables.test.mjs";
const TREE_T = "packages/nana-pack/tests/requirements-tree.test.mjs";
const MOVED_T = "packages/nana-pack/tests/requirements-moved.test.mjs";
const R_2535 = /^a manual maker or a rule or person reader with no reason gets one note naming the row/; // R-2535
const R_2536 = /^a maker or reader path not tracked at HEAD gets one note naming the row and the path/; // R-2536
const R_2537 = /^a missing or unreadable line, or an automatic claim with no code path, gets one note naming it/; // R-2537
const R_2538 = /^the tree checker prints deliverable notes in every mode and keeps its exit status and outline/; // R-2538
const R_2539 = /^every deliverable in this repository's ledger has a Made by and a Read by line/; // R-2539
const R_2540 = /^the movement report lists a row whose Made by or Read by lines changed/; // R-2540
const R_2541 = /^the tree checker counts the deliverables made and read by code in every mode/; // R-2541
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(plan) p1 to p6 are the must-meet's six wrong builds; b1 to b4 are build brief 2's four; m1 is the seat's for R-2540",
	"(seat) p1 is split into a bare run (p1a) and a bare code or prompt reader (p1b), because each takes its own branch",
	"(seat) p6 renders the lines by adding both labels to the capability field list, which is the one way the outline reads a span line",
];

const PAIRS = [
	{ n: "p1a", name: "a bare automatic run accepted as automatic", edits: [
		one(DLV, "notes.push(note(`${row} Made by: line ${field.line} needs a code path`));", "automaticMakers.add(row);"),
	], tests: [DLV_T], expectRed: [R_2537] },
	{ n: "p1b", name: "a bare code or prompt reader accepted as code", edits: [
		one(DLV, "notes.push(note(`${row} Read by: line ${field.line} needs a code path`));", "codeReaders.add(row);"),
	], tests: [DLV_T], expectRed: [R_2537] },
	{ n: "p2", name: "paths listed from the index instead of the HEAD tree", edits: [
		one(TREE, '["-C", ledgerFolder, "ls-tree", "-r", "-z", "--name-only", "HEAD"]', '["-C", ledgerFolder, "ls-files", "-z"]'),
	], tests: [DLV_T], expectRed: [R_2536] },
	{ n: "p3", name: "notes printed only under --root", edits: [
		one(TREE, '  printDeliverableReport(result.parsed, dirname(resolve(REPO_ROOT, "REQUIREMENTS.md")));\n  return 0;', "  return 0;"),
	], tests: [TREE_T], expectRed: [R_2538, R_2541] },
	{ n: "p4", name: "the reason test dropped for makers and readers", edits: [
		one(DLV, "if (!detail) notes.push(note(`${row} Made by: line ${field.line} needs a reason`));", "/* no reason test */"),
		one(DLV, "if (!detail) notes.push(note(`${row} Read by: line ${field.line} needs a reason`));", "/* no reason test */"),
	], tests: [DLV_T], expectRed: [R_2535] },
	{ n: "p5", name: "lines read on through feature and subgroup spans to the next capability", edits: [
		one(DLV, "if (index + 1 > start) { end = Math.min(end, index); break; }", 'if (index + 1 > start && parsed.headingsByLine.get(index)?.id?.startsWith("CAP-")) { end = Math.min(end, index); break; }'),
	], tests: [DLV_T], expectRed: [R_2537] },
	{ n: "p6", name: "the lines rendered in the outline as capability fields", edits: [
		one(TREE, 'export const CAPABILITY_FIELD_LABELS = ["Kind", "Needs", "Binds", "Deliverables", "Retired"];', 'export const CAPABILITY_FIELD_LABELS = ["Kind", "Needs", "Binds", "Deliverables", "Retired", "Made by", "Read by"];'),
	], tests: [TREE_T], expectRed: [R_2538] },
	{ n: "b1", name: "a manual maker counted as automatic", edits: [
		one(DLV, "if (!detail) notes.push(note(`${row} Made by: line ${field.line} needs a reason`));", "automaticMakers.add(row); if (!detail) notes.push(note(`${row} Made by: line ${field.line} needs a reason`));"),
	], tests: [TREE_T], expectRed: [R_2541] },
	{ n: "b2", name: "a rule or person reader counted as code", edits: [
		one(DLV, "if (!detail) notes.push(note(`${row} Read by: line ${field.line} needs a reason`));", "codeReaders.add(row); if (!detail) notes.push(note(`${row} Read by: line ${field.line} needs a reason`));"),
	], tests: [TREE_T], expectRed: [R_2541] },
	{ n: "b3", name: "the count printed only under --root", edits: [
		one(TREE, "if (report.fieldLineCount > 0) console.log(", "if (alwaysSummary && report.fieldLineCount > 0) console.log("),
	], tests: [TREE_T], expectRed: [R_2541] },
	{ n: "b4", name: "one deliverable's maker line dropped from this repository's ledger", edits: [
		one(LEDGER, "Made by: R-873 · manual: someone runs nana-frontier on HANDOFF.md by hand to see the word-budget finding\n", ""),
	], tests: [DLV_T], expectRed: [R_2539] },
	{ n: "m1", name: "the movement report blind to changed maker and reader lines", edits: [
		one(MOVED, 'if (JSON.stringify(b.deliverableLines) !== JSON.stringify(h.deliverableLines)) parts.push("Made by/Read by lines changed");', "/* lines ignored */"),
	], tests: [MOVED_T], expectRed: [R_2540] },
];

process.exitCode = await runMutations({ lane: "deliverable-fields", self: import.meta.url, tip: "0a57bf06", declared: DECLARED, pairs: PAIRS });
