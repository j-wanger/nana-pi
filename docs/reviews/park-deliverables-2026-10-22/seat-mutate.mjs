#!/usr/bin/env node
// Seat wrong-code pairs for lane park-deliverables (ordinary), written by the seat 2026-10-22 after build 2, on the
// shared runner, at tip a6382024. They are the must-meet's sixteen pairs in its order, less p10 (declared). Run from
// the worktree root on macOS:   SEAT_MUTATE_OUT=<file> node docs/reviews/park-deliverables-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const DEL = "scripts/deliverables.mjs";
const MOVED = "scripts/requirements-moved.mjs";
const T_TREE = "packages/nana-pack/tests/requirements-tree.test.mjs";
const T_DEL = "packages/nana-pack/tests/requirements-deliverables.test.mjs";
const T_REPORT = "packages/nana-pack/tests/product-report.test.mjs";
const T_MOVED = "packages/nana-pack/tests/requirements-moved.test.mjs";
const R_2639 = /^R-2639: /; // R-2639
const R_2640 = /^R-2640: /; // R-2640
const R_2641 = /^R-2641: /; // R-2641
const R_2642 = /^R-2642: /; // R-2642
const R_2643 = /^R-2643: /; // R-2643
const R_2537 = /^a missing or unreadable line, or an automatic claim with no code path, gets one note/; // R-2537
const R_2538 = /^the tree checker prints deliverable notes in every mode/; // R-2538
const R_2541 = /^the tree checker counts the deliverables made and read by code in every mode/; // R-2541
const R_2543 = /^R-2543: /; // R-2543
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const COUNT = "${report.checkedDeliverables - report.parkedDeliverables} made and read by code${report.parkedDeliverables ? `, ${report.parkedDeliverables} parked` : \"\"}";
const REASON = "          notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} needs a reason`));\n          continue;";
const UNLISTED = "        if (!listedSet.has(row)) {\n          notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} names an unlisted deliverable`));";
const STALE_IF = "if (isMadeAndReadByCode(claimsByRow.get(row) ?? [])) {";
const STALE_NOTE = "notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} parks nothing; code makes and reads it`));";
const CLAIM_PUSH = "claims.get(row).push({ label: field.label, text: claimText, artifact: null, madeByCode: false, readByCode: false });";

const DECLARED = [
	"(plan) p1 to p16 follow the must-meet's wrong-code list in order",
	"(seat) p10 is not written: deliverableClaims is read for every row before the field scan, so no natural build checks a park against only the lines above it (attack N2)",
	"(seat) p13 lists a park claim first instead of in ledger order",
];

const PAIRS = [
	{ n: "p1", name: "parked rows stay in the total; only the suffix is added", edits: [
		one(DEL, COUNT, "${report.checkedDeliverables} made and read by code${report.parkedDeliverables ? `, ${report.parkedDeliverables} parked` : \"\"}"),
	], tests: [T_TREE], expectRed: [R_2639] },
	{ n: "p2", name: "parked rows leave the total, but no suffix", edits: [
		one(DEL, COUNT, "${report.checkedDeliverables - report.parkedDeliverables} made and read by code"),
	], tests: [T_TREE], expectRed: [R_2639] },
	{ n: "p3", name: "the suffix prints , 0 parked when nothing is parked", edits: [
		one(DEL, COUNT, "${report.checkedDeliverables - report.parkedDeliverables} made and read by code, ${report.parkedDeliverables} parked"),
	], tests: [T_TREE, T_REPORT], expectRed: [R_2541, R_2538, R_2543] },
	{ n: "p4", name: "a park line with no since date parks its row", edits: [
		one(DEL, "if (!PARKED_DATE.test(dateClaim)) {", "if (false) {"),
	], tests: [T_DEL], expectRed: [R_2640] },
	{ n: "p5", name: "an empty reason gets its note but still parks", edits: [
		one(DEL, REASON, "          notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} needs a reason`));\n          parkedRows.add(row);\n          continue;"),
	], tests: [T_DEL], expectRed: [R_2640] },
	{ n: "p6", name: "the date's shape is not checked", edits: [
		one(DEL, "const PARKED_DATE = new RegExp(`^${PARKED_SINCE}\\\\s+(\\\\d{4}-\\\\d{2}-\\\\d{2})$`);", "const PARKED_DATE = new RegExp(`^${PARKED_SINCE}\\\\s+(\\\\S+)$`);"),
	], tests: [T_DEL], expectRed: [R_2640] },
	{ n: "p7", name: "another capability's park line parks the row", edits: [
		one(DEL, UNLISTED, "        if (false) {\n          notes.push(note(`${row} ${PARKED_LABEL}: line ${field.line} names an unlisted deliverable`));"),
	], tests: [T_DEL], expectRed: [R_2640] },
	{ n: "p8", name: "a park beats live", edits: [
		one(DEL, STALE_IF, "if (false) {"),
	], tests: [T_DEL], expectRed: [R_2641] },
	{ n: "p9", name: "the stale note is given, but the row still counts as parked", edits: [
		one(DEL, STALE_NOTE, `${STALE_NOTE} parkedRows.add(row);`),
	], tests: [T_DEL], expectRed: [R_2641] },
	{ n: "p11", name: "Parked joins the required labels", edits: [
		one(DEL, "export const DELIVERABLE_FIELD_LABELS = Object.freeze([\"Made by\", \"Read by\"]);", "export const DELIVERABLE_FIELD_LABELS = Object.freeze([\"Made by\", \"Read by\", \"Parked\"]);"),
	], tests: [T_DEL], expectRed: [R_2537] },
	{ n: "p12", name: "deliverableClaims leaves park lines out", edits: [
		one(DEL, CLAIM_PUSH, "/* park claim dropped */"),
	], tests: [T_REPORT], expectRed: [R_2642] },
	{ n: "p13", name: "park claims out of ledger order", edits: [
		one(DEL, CLAIM_PUSH, "claims.get(row).unshift({ label: field.label, text: claimText, artifact: null, madeByCode: false, readByCode: false });"),
	], tests: [T_REPORT], expectRed: [R_2642] },
	{ n: "p14", name: "the movement report folds park lines into maker and reader lines", edits: [
		one(MOVED, "deliverableLines: all.filter((line) => /^(?:Made by|Read by):/.test(line)),", "deliverableLines: all,"),
		one(MOVED, "parkedLines: all.filter((line) => /^Parked:/.test(line)),", "parkedLines: [],"),
	], tests: [T_MOVED], expectRed: [R_2643] },
	{ n: "p15", name: "the movement report ignores park lines", edits: [
		one(MOVED, "if (JSON.stringify(b.parkedLines) !== JSON.stringify(h.parkedLines)) parts.push(\"Parked lines changed\");", "/* park lines ignored */"),
	], tests: [T_MOVED], expectRed: [R_2643] },
	{ n: "p16", name: "the parked count counts park lines, not rows", edits: [
		one(DEL, "          parkedRows.add(row);", "          parkedRows.add(`${row}:${field.line}`);"),
	], tests: [T_TREE], expectRed: [R_2639] },
];

process.exitCode = await runMutations({ lane: "park-deliverables", self: import.meta.url, tip: "a6382024", declared: DECLARED, pairs: PAIRS });
