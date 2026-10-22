#!/usr/bin/env node
// Seat wrong-code pairs for lane report-deliverables (ordinary lane), written by the seat 2026-10-22 after build 2, on
// the shared runner, at tip 2e8da63e. They are the must-meet's seat-step pairs, one per wrong build. Run from the
// worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/report-deliverables-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const REPORT = "scripts/product-report.mjs";
const DELIV = "scripts/deliverables.mjs";
const T = "packages/nana-pack/tests/product-report.test.mjs";
const R_2542 = /^R-2542: /; // R-2542
const R_2543 = /^R-2543: /; // R-2543
const R_2544 = /^R-2544: /; // R-2544
const R_2545 = /^R-2545: /; // R-2545
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(plan) p1 to p16 are the must-meet's seat-step pairs: walk without -c; count by walk position; days from calendar dates (UTC) and rounded days; no clamp; the runtime map aged by git; consumers kept; claims from every capability's span; marks from claim kinds alone; count line keyed on listed deliverables; a retyped paths-not-checked string; the walk without the helper's buffer; the newline kept on the first file name; a walk failure that refuses the page; a plain-path shallow clone; a side-branch runtime tip counted with rev-list",
	"(seat) p3 counts days between UTC calendar dates and p4 rounds; the +14:00 and -12:00 case should catch at least one; p7 renders a Consumers line, since the model no longer carries consumers",
];

const PAIRS = [
	{ n: "p1", name: "the walk without -c", edits: [
		one(REPORT, 'Object.freeze(["-z", "-c", "--name-only"', 'Object.freeze(["-z", "--name-only"'),
	], tests: [T], expectRed: [R_2544] },
	{ n: "p2", name: "commits counted by walk position", edits: [
		one(REPORT, "? formatArtifactAge(record, commits, headEpoch)", "? formatArtifactAge(record, records.indexOf(record), headEpoch)"),
	], tests: [T], expectRed: [R_2544] },
	{ n: "p3", name: "days between UTC calendar dates", edits: [
		one(REPORT, "const wholeDays = (laterEpoch, earlierEpoch) => Math.max(0, Math.floor((laterEpoch - earlierEpoch) / SECONDS_PER_DAY));", "const wholeDays = (laterEpoch, earlierEpoch) => Math.max(0, Math.round((new Date(laterEpoch * 1000).setUTCHours(0, 0, 0, 0) - new Date(earlierEpoch * 1000).setUTCHours(0, 0, 0, 0)) / 86400000));"),
	], tests: [T], expectRed: [R_2544] },
	{ n: "p4", name: "days rounded, not floored", edits: [
		one(REPORT, "Math.max(0, Math.floor((laterEpoch - earlierEpoch) / SECONDS_PER_DAY))", "Math.max(0, Math.round((laterEpoch - earlierEpoch) / SECONDS_PER_DAY))"),
	], tests: [T], expectRed: [R_2544] },
	{ n: "p5", name: "no clamp at 0 days", edits: [
		one(REPORT, "Math.max(0, Math.floor((laterEpoch - earlierEpoch) / SECONDS_PER_DAY))", "Math.floor((laterEpoch - earlierEpoch) / SECONDS_PER_DAY)"),
	], tests: [T], expectRed: [R_2544, R_2545] },
	{ n: "p6", name: "the runtime map aged by git", edits: [
		one(REPORT, "const regular = artifacts.filter((artifact) => artifact !== RUNTIME_MAP_ARTIFACT);", "const regular = artifacts;"),
		one(REPORT, "if (artifacts.includes(RUNTIME_MAP_ARTIFACT)) {", "if (false) {"),
	], tests: [T], expectRed: [R_2545] },
	{ n: "p7", name: "consumers kept on the card", edits: [
		one(REPORT, 'for (const mark of deliverable.marks) paragraph(item, "", mark, "deliverable-mark");', 'paragraph(item, "Consumers", deliverable.home?.id ?? ""); for (const mark of deliverable.marks) paragraph(item, "", mark, "deliverable-mark");'),
	], tests: [T], expectRed: [R_2542] },
	{ n: "p8", name: "claims from every capability's span", edits: [
		one(DELIV, "  for (const field of ownFieldLines(parsed, capability)) {\n    const row = ROW_AT_START", '  for (const field of parsed.headings.filter((heading) => heading.id.startsWith("CAP-")).flatMap((heading) => ownFieldLines(parsed, heading))) {\n    const row = ROW_AT_START'),
	], tests: [T], expectRed: [R_2542] },
	{ n: "p9", name: "marks from claim kinds alone (a bare land read as code-made)", edits: [
		one(DELIV, 'const madeByCode = field.label === "Made by" && parts.length <= 3 && MAKER_SET.has(kind) && !REASON_SET.has(kind) && detail.length > 0;', 'const madeByCode = field.label === "Made by" && MAKER_SET.has(kind) && !REASON_SET.has(kind);'),
	], tests: [T], expectRed: [R_2542] },
	{ n: "p10", name: "the count line keyed on listed deliverables", edits: [
		one(DELIV, "...(report.fieldLineCount > 0 ? [`deliverables:", "...(report.checkedDeliverables > 0 ? [`deliverables:"),
	], tests: [T], expectRed: [R_2543] },
	{ n: "p11", name: "a retyped paths-not-checked string", edits: [
		one(DELIV, "report = { ...pending, notes: [...pending.notes, DELIVERABLE_PATHS_NOT_CHECKED] };", 'report = { ...pending, notes: [...pending.notes, "deliverable note: paths not checked: git could not read HEAD"] };'),
	], tests: [T], expectRed: [R_2543] },
	{ n: "p12", name: "the walk without the helper's buffer", edits: [
		one(REPORT, '    env: { ...process.env, ...(options.env ?? {}), GIT_OPTIONAL_LOCKS: "0" },\n    maxBuffer: MAX_GIT_BUFFER,\n', '    env: { ...process.env, ...(options.env ?? {}), GIT_OPTIONAL_LOCKS: "0" },\n'),
	], tests: [T], expectRed: [R_2544] },
	{ n: "p13", name: "the newline kept on the first file name", edits: [
		one(REPORT, '      if (first) file = file.replace(/^\\n/, "");\n', ""),
	], tests: [T], expectRed: [R_2544] },
	{ n: "p14", name: "a walk failure that refuses the page", edits: [
		one(REPORT, "if (!walk || walk.status !== 0 || walk.error) {", 'if (!walk || walk.status !== 0 || walk.error) { throw new Error("walk failed"); } if (false) {'),
	], tests: [T], expectRed: [R_2544] },
	{ n: "p15", name: "a shallow clone read as full history", edits: [
		one(REPORT, 'const shallow = String(shallowResult.stdout ?? "").trim() === "true";', "const shallow = false;"),
	], tests: [T], expectRed: [R_2544, R_2545] },
	{ n: "p16", name: "a side-branch runtime tip counted with rev-list", edits: [
		one(REPORT, "if (!ancestor || ancestor.status !== 0) ages.set(", "if (false) ages.set("),
	], tests: [T], expectRed: [R_2545] },
];

process.exitCode = await runMutations({ lane: "report-deliverables", self: import.meta.url, tip: "2e8da63e", declared: DECLARED, pairs: PAIRS });
