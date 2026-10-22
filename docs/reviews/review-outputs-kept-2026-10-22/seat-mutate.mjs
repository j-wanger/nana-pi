#!/usr/bin/env node
// Seat wrong-code pairs for lane review-outputs-kept (install, hook or gate lane: a review tool), written by the seat
// 2026-10-22 after build 2, on the shared runner, at tip 86bedefb. They are the must-meet's seat-step pairs: the
// planner's nine (p1 to p9) and the adversary's seven (p10 to p17; its "tally before the store write, or kept on a
// failed write" is two pairs). Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/review-outputs-kept-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const ROUND = "packages/nana-pack/bin/review-round.mjs";
const LEDGER = "packages/nana-pack/bin/review-ledger.mjs";
const LAND = "packages/nana-pack/bin/nana-land.mjs";
const TIMELINE = "packages/nana-pack/bin/review-timeline.mjs";
const T_LEDGER = "packages/nana-pack/tests/review-ledger.test.mjs";
const T_LAND = "packages/nana-pack/tests/land.test.mjs";
const T_TIMELINE = "packages/nana-pack/tests/review-timeline.test.mjs";
const R_2568 = /^R-2568: /; // R-2568
const R_2569 = /^R-2569: /; // R-2569
const R_2570 = /^R-2570: /; // R-2570
const R_2571 = /^R-2571: /; // R-2571
const R_2572 = /^R-2572: /; // R-2572
const R_2573 = /^R-2573: /; // R-2573
const R_2574 = /^R-2574: /; // R-2574
const R_2575 = /^R-2575: /; // R-2575
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const STORE_WRITE = "try { kept = writeReviewText(p, captured); } catch (e) {";
const STORE_THROW = "throw new Error(`${e.message} (output kept at ${out ?? held.out})`);";
const TEXT_BYTES = "const bytes = Buffer.from(String(text ?? ''), 'utf8');";

const DECLARED = [
	"(plan) p1 to p9 are the planner's nine: record without the store write; the text re-read from the output path; the hash over trimmed or BOM-stripped text; the land ignores text; the land checks existence but not the hash; the timeline reads the audit path first; keep overwrites a differing file; keep ignores the repository scope; a store under the reviewed tree",
	"(adversary) p10 to p17 are the adversary's seven: an existing output file preferred; only the first matching LAND checked; the tally appended before the store write; a round kept on a failed store write; a malformed text treated as legacy; keep checking names as it writes; the hash after CRLF normalising; the temp file in the system temp folder",
	"(seat) p9 writes the store under the reviewed tree from complete(), so it touches only the test's temp repositories; p17 points the temp file at the system temp folder the R-2568 fixture replaces with a missing one",
];

const PAIRS = [
	{ n: "p1", name: "record without the store write", edits: [
		one(ROUND, STORE_WRITE, "try { kept = reviewTextRef(captured).record; } catch (e) {"),
	], tests: [T_LEDGER], expectRed: [R_2568] },
	{ n: "p2", name: "the text re-read from the output path", edits: [
		one(ROUND, "let captured = text === undefined ? String(out ?? '') : String(text ?? '');", "let captured = String(out ?? ''); text = undefined;"),
	], tests: [T_LEDGER], expectRed: [R_2569] },
	{ n: "p3", name: "the hash over trimmed or BOM-stripped text", edits: [
		one(ROUND, TEXT_BYTES, "const bytes = Buffer.from(String(text ?? '').replace(/^\\uFEFF/, '').trim(), 'utf8');"),
	], tests: [T_LEDGER], expectRed: [R_2568] },
	{ n: "p4", name: "the land ignores text", edits: [
		one(LAND, 'if (!Object.hasOwn(row, "text")) {', "if (true) {"),
	], tests: [T_LAND], expectRed: [R_2571, R_2572] },
	{ n: "p5", name: "the land checks existence but not the hash", edits: [
		one(LAND, 'if (evidence.status === "intact") {', 'if (evidence.status === "intact" || evidence.status === "altered") {'),
	], tests: [T_LAND], expectRed: [R_2571] },
	{ n: "p6", name: "the timeline reads the audit path first", edits: [
		one(TIMELINE, 'if (Object.hasOwn(row, "text")) {', 'if (Object.hasOwn(row, "text") && !recordedFileOf(row, auditByKey)) {'),
	], tests: [T_TIMELINE], expectRed: [R_2570] },
	{ n: "p7", name: "keep overwrites a differing file", edits: [
		one(LEDGER, "if (!existing.equals(bytes)) die(`${target} holds different bytes; wrote nothing`);", "if (!existing.equals(bytes)) { writes.push([target, bytes]); continue; }"),
		one(LEDGER, "writeFileSync(target, bytes, { flag: 'wx', mode: 0o600 });", "writeFileSync(target, bytes, { mode: 0o600 });"),
	], tests: [T_LEDGER], expectRed: [R_2574] },
	{ n: "p8", name: "keep ignores the repository scope", edits: [
		one(LEDGER, "const rows = readRounds(home, { item, repo });", "const rows = readRounds(home, { item });"),
	], tests: [T_LEDGER], expectRed: [R_2573] },
	{ n: "p9", name: "a store under the reviewed tree", edits: [
		one(ROUND, STORE_WRITE, "try { kept = writeReviewText({ ...p, texts: join(r.cwd, REVIEW_TEXT_STORE_NAME) }, captured); } catch (e) {"),
	], tests: [T_LEDGER], expectRed: [R_2568] },
	{ n: "p10", name: "an existing output file preferred", edits: [
		one(ROUND, "if (text === undefined) {\n        try { if (existsSync(captured)) captured = readFileSync(captured, 'utf8'); }", "if (true) {\n        try { if (existsSync(String(out))) captured = readFileSync(String(out), 'utf8'); }"),
	], tests: [T_LEDGER], expectRed: [R_2569] },
	{ n: "p11", name: "only the first matching LAND checked", edits: [
		one(LAND, "for (const row of matching) {", "for (const row of matching.slice(0, 1)) {"),
	], tests: [T_LAND], expectRed: [R_2571] },
	{ n: "p12", name: "the tally appended before the store write", edits: [
		one(ROUND, `${STORE_WRITE}\n        ${STORE_THROW}\n      }\n      const textRecord = { text: kept };`, "const textRecord = { text: reviewTextRef(captured).record };"),
		one(ROUND, "      unlinkSync(f);\n      if (!stable) {", `      try { writeReviewText(p, captured); } catch (e) { ${STORE_THROW} }\n      unlinkSync(f);\n      if (!stable) {`),
	], tests: [T_LEDGER], expectRed: [R_2575] },
	{ n: "p13", name: "a round kept on a failed store write", edits: [
		one(ROUND, STORE_THROW, "kept = reviewTextRef(captured).record;"),
	], tests: [T_LEDGER], expectRed: [R_2575] },
	{ n: "p14", name: "a malformed text treated as legacy", edits: [
		one(LAND, 'if (!Object.hasOwn(row, "text")) {', 'if (!Object.hasOwn(row, "text") || reviewTextEvidence(home, row.text).status === "malformed") {'),
	], tests: [T_LAND], expectRed: [R_2571] },
	{ n: "p15", name: "keep checking names as it writes", edits: [
		one(LEDGER, "if (!state) { writes.push([target, bytes]); continue; }", "if (!state) { mkdirSync(into, { recursive: true }); writeFileSync(target, bytes, { flag: 'wx', mode: 0o600 }); continue; }"),
	], tests: [T_LEDGER], expectRed: [R_2574] },
	{ n: "p16", name: "the hash after CRLF normalising", edits: [
		one(ROUND, TEXT_BYTES, "const bytes = Buffer.from(String(text ?? '').replace(/\\r\\n/g, '\\n'), 'utf8');"),
	], tests: [T_LEDGER], expectRed: [R_2568, R_2569] },
	{ n: "p17", name: "the temp file in the system temp folder", edits: [
		one(ROUND, "const temp = join(p.texts, `.${kept.record.sha256}", "const temp = join(tmpdir(), `.${kept.record.sha256}"),
	], tests: [T_LEDGER], expectRed: [R_2568] },
];

process.exitCode = await runMutations({ lane: "review-outputs-kept", self: import.meta.url, tip: "86bedefb", declared: DECLARED, pairs: PAIRS });
