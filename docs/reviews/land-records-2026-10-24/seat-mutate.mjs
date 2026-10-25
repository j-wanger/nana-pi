#!/usr/bin/env node
// Seat wrong-code pairs for lane land-records (land tool), written by the seat 2026-10-24 after build 3 at 5912a41b (first run at c354f281; pairs 14 and 15 re-judged at 1661558e).
// They follow the must-meet rows' red cases (R-2810 to R-2816) and the seal.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/land-records-2026-10-24/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const NL = "packages/nana-pack/bin/nana-land.mjs";
const LR = "packages/nana-pack/lib/land-records.mjs";
const LC = "packages/nana-pack/lib/land-records-config.mjs";
const RL = "packages/nana-pack/lib/record-ledger.mjs";
const BR = "packages/nana-pack/bin/build-report.mjs";
const REQ = "REQUIREMENTS.md";
const T_LR = "packages/nana-pack/tests/land-records.test.mjs";
const T_BR = "packages/nana-pack/tests/build-report.test.mjs";
const R_2810 = /^R-2810: /; // R-2810
const R_2811 = /^R-2811: /; // R-2811
const R_2812 = /^R-2812: /; // R-2812
const R_2813 = /^R-2813: /; // R-2813
const R_2814 = /^R-2814: /; // R-2814
const R_2815 = /^R-2815: /; // R-2815
const R_2816 = /^R-2816: /; // R-2816
const SEAL = /^seal: land records live /; // R-2810 R-2813 R-2814
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const BRANCH_MATCH = "const match = /^feat\\/(.+)$/.exec(branch);";
const START = "start = { v: LAND_RECORD_SCHEMA, kind: \"start\", attempt: randomUUID(), startedAt, lane, tip };";
const LANE_PICK = "lane = match && LANE_NAME_PATTERN.test(match[1]) ? match[1] : null;";
const MAIN_KEY = "lifecycle.mainRepoKey = repoKeyOf(resolvedMain);";
const LIFECYCLE = "const lifecycle = { stage: \"preflight\", ci: \"not reached\", ciWaitMs: null, suiteMs: null };";
const END_STAGE = "stage: result.code === 0 ? null : lifecycle.stage,";
const REASON = "const reason = result.code === 0 ? null : firstLine.replace(/^refused:\\s*/, \"\").slice(0, LAND_REASON_MAX_CHARS);";
const OUTCOME = "outcome: result.code === 0 ? \"landed\" : \"refused\",";
const END_APPEND = "const kept = appendLandRecord(common, end);";
const END_WAIT = "ciWaitMs: lifecycle.ci === \"passed\" ? lifecycle.ciWaitMs : null,";
const NOT_KEPT_START = "return { ...result, text: withLandRecordLine(result.text, `${LAND_RECORD_LINE_PREFIX} not kept: ${detail.file}";
const READ_FAIL = "laneLine = `lane line unavailable: ";
const FINAL = "return { ...result, text: withLandRecordLine(result.text, renderLandRecordLine(end, laneLine)) };";
const GLUE = String.raw`const withLandRecordLine = (text, line) => ` + "`${text}${text && !text.endsWith(\"\\n\") ? \"\\n\" : \"\"}${line}\\n`;";
const LANE_READ = "laneLine = renderLandLaneLine(ledger.records, start.lane);";
const NO_LANE = "if (start.lane === null) laneLine = \"no lane\";";
const CREATED = "export const LAND_CI_CREATED_FIELD = \"created_at\";";
const LONGEST = "longest = Math.max(longest, span);";
const BAD_SPAN = "if (!Number.isFinite(created) || !Number.isFinite(updated) || !Number.isFinite(span) || span < 0) return null;";
const TOTAL_ATTEMPTS = "lines.push(`land total | ${plural(attempts.length, \"attempt\")}";
const TORN = "try { record = JSON.parse(line); } catch { badLines++; continue; }";
const NO_END = "view.outcome = \"no end\";";
const MINUTE_TEXT = "const minuteText = (value, noun) => value === null ? `${noun} -` : `${noun} ${minutes(value)} min`;";
const ATTEMPT_REASON = "| reason ${view.reason ?? \"-\"} |";
const LANE_FILTER = "const attempts = lane === null ? paired.attempts : paired.attempts.filter((view) => view.start.lane === lane);";
const UNAVAILABLE = "lines.push(`land records unavailable: ${error.message}`);";
const LANE_SET = "const lanes = [...new Set(attempts.map((view) => view.start.lane).filter((name) => name !== null && name !== undefined))];";
const ENTRY = "Artifact: A-082 · land records · clone store: <git common dir>/nana/land-records.jsonl";
const DELIVERABLES = "Deliverables: R-1400, R-1008, R-1560, R-977, R-2597, R-2811";
const READ_BY = "Read by: R-2811 · code: packages/nana-pack/bin/build-report.mjs, packages/nana-pack/bin/nana-land.mjs";
const SUBPATH = "export const LAND_RECORDS_SUBPATH = \"nana/land-records.jsonl\";";
const READ_CAP = "export const LAND_LEDGER_READ_MAX_BYTES = 32 * 1024 * 1024;";

const DECLARED = [
	"(seat) pairs 1 to 4 follow R-2810's red cases; 5 to 9 R-2811's; 10 to 13 R-2812's; 14 and 15 R-2813's; 16 to 20 R-2814's; 21 to 28 R-2815's; 29 to 31 R-2816's; 32 and 33 the seal",
	"(seat) declared non-pairs: 'the line lands under ~/.pi/agent' (no one-line mutation reaches a second store; pair 4 covers a skipped start), 'the last landed CI wait from the wrong attempt' (the R-2815 fixture has one landed attempt per lane, a residual), and 'two lands at once tear a line' (no lock by design, a known limit)",
];

const PAIRS = [
	{ n: "1", name: "the lane comes from the tree's folder name", edits: [one(NL, BRANCH_MATCH, "const match = /^(.+)$/.exec(path.basename(resolvedTree));")], tests: [T_LR], expectRed: [R_2810] },
	{ n: "2", name: "the start keeps a short tip", edits: [one(NL, START, "start = { v: LAND_RECORD_SCHEMA, kind: \"start\", attempt: randomUUID(), startedAt, lane, tip: tip && tip.slice(0, 8) };")], tests: [T_LR], expectRed: [R_2810] },
	{ n: "3", name: "a detached tree gets a lane", edits: [one(NL, LANE_PICK, "lane = match && LANE_NAME_PATTERN.test(match[1]) ? match[1] : (branch || \"detached\");")], tests: [T_LR], expectRed: [R_2810] },
	{ n: "4", name: "a separate-clone attempt writes no start", edits: [one(NL, MAIN_KEY, "lifecycle.mainRepoKey = repoKeyOf(resolvedMain); if (repoKeyOf(resolvedTree) !== lifecycle.mainRepoKey) throw new Error(\"skip\");")], tests: [T_LR], expectRed: [R_2810] },
	{ n: "5", name: "a preflight refusal records suite 0", edits: [one(NL, LIFECYCLE, "const lifecycle = { stage: \"preflight\", ci: \"not reached\", ciWaitMs: null, suiteMs: 0 };")], tests: [T_LR], expectRed: [R_2811] },
	{ n: "6", name: "every refusal records one fixed stage", edits: [one(NL, END_STAGE, "stage: result.code === 0 ? null : \"preflight\",")], tests: [T_LR], expectRed: [R_2811] },
	{ n: "7", name: "the reason carries the suite output", edits: [one(NL, REASON, "const reason = result.code === 0 ? null : String(result.text).replace(/^refused:\\s*/, \"\").slice(0, LAND_REASON_MAX_CHARS);")], tests: [T_LR], expectRed: [R_2811] },
	{ n: "8", name: "a merge refusal is recorded as landed", edits: [one(NL, OUTCOME, "outcome: result.code === 0 || lifecycle.stage === \"merge\" ? \"landed\" : \"refused\",")], tests: [T_LR], expectRed: [R_2811] },
	{ n: "9", name: "only a landed attempt appends an end", edits: [one(NL, END_APPEND, "const kept = result.code === 0 ? appendLandRecord(common, end) : { ok: true };")], tests: [T_LR], expectRed: [R_2811] },
	{ n: "10", name: "the CI wait starts at run_started_at", edits: [one(LC, CREATED, "export const LAND_CI_CREATED_FIELD = \"run_started_at\";")], tests: [T_LR], expectRed: [R_2812] },
	{ n: "11", name: "the CI wait takes the shortest span", edits: [one(LR, LONGEST, "longest = longest === 0 ? span : Math.min(longest, span);")], tests: [T_LR], expectRed: [R_2812] },
	{ n: "12", name: "a run without times refuses the land", edits: [one(LR, BAD_SPAN, "if (!Number.isFinite(created) || !Number.isFinite(updated) || !Number.isFinite(span) || span < 0) throw new Error(\"bad CI time\");")], tests: [T_LR], expectRed: [R_2812] },
	{ n: "13", name: "a skipped-CI land records a wait", edits: [one(NL, LIFECYCLE, "const lifecycle = { stage: \"preflight\", ci: \"not reached\", ciWaitMs: 0, suiteMs: null };"), one(NL, END_WAIT, "ciWaitMs: lifecycle.ciWaitMs,")], tests: [T_LR], expectRed: [R_2812] },
	{ n: "14", name: "an unkept start changes the exit code", edits: [one(NL, NOT_KEPT_START, "return { ...result, code: 1, text: withLandRecordLine(result.text, `${LAND_RECORD_LINE_PREFIX} not kept: ${detail.file}")], tests: [T_LR], expectRed: [R_2813] },
	{ n: "15", name: "a read failure prints two record lines", edits: [one(NL, READ_FAIL, "result.text += LAND_RECORD_LINE_PREFIX + \" read failed\\n\"; laneLine = `lane line unavailable: ")], tests: [T_LR], expectRed: [R_2813] },
	{ n: "16", name: "the record line comes first", edits: [one(NL, FINAL, "return { ...result, text: `${renderLandRecordLine(end, laneLine)}\\n${result.text}` };")], tests: [T_LR], expectRed: [R_2814] },
	{ n: "17", name: "the record line glues onto unterminated output", edits: [one(NL, GLUE, "const withLandRecordLine = (text, line) => `${text}${line}\\n`;")], tests: [T_LR], expectRed: [R_2814] },
	{ n: "18", name: "the record line is printed only on a landed attempt", edits: [one(NL, FINAL, "return result.code === 0 ? { ...result, text: withLandRecordLine(result.text, renderLandRecordLine(end, laneLine)) } : result;")], tests: [T_LR], expectRed: [R_2814] },
	{ n: "19", name: "the lane part leaves out this attempt", edits: [one(NL, LANE_READ, "laneLine = renderLandLaneLine(ledger.records.filter((record) => record.attempt !== start.attempt), start.lane);")], tests: [T_LR], expectRed: [R_2814] },
	{ n: "20", name: "an attempt with no lane prints a dash", edits: [one(NL, NO_LANE, "if (start.lane === null) laneLine = \"-\";")], tests: [T_LR], expectRed: [R_2814] },
	{ n: "21", name: "the land total counts records, not attempts", edits: [one(LR, TOTAL_ATTEMPTS, "lines.push(`land total | ${plural(records.length, \"attempt\")}")], tests: [T_BR], expectRed: [R_2815] },
	{ n: "22", name: "a torn line stops the read", edits: [one(RL, TORN, "try { record = JSON.parse(line); } catch { badLines++; break; }")], tests: [T_BR], expectRed: [R_2815] },
	{ n: "23", name: "an unpaired start counts as landed", edits: [one(LR, NO_END, "view.outcome = \"landed\";")], tests: [T_BR], expectRed: [R_2815] },
	{ n: "24", name: "a null suite time prints as 0 min", edits: [one(LR, MINUTE_TEXT, "const minuteText = (value, noun) => `${noun} ${minutes(value) ?? 0} min`;")], tests: [T_BR], expectRed: [R_2815] },
	{ n: "25", name: "the attempt line leaves out the reason", edits: [one(LR, ATTEMPT_REASON, "| reason - |")], tests: [T_BR], expectRed: [R_2815] },
	{ n: "26", name: "--lane beta also prints alpha", edits: [one(LR, LANE_FILTER, "const attempts = paired.attempts;")], tests: [T_BR], expectRed: [R_2815] },
	{ n: "27", name: "an over-cap land ledger exits 1", edits: [one(BR, UNAVAILABLE, "stderr.write(`build-report: ${error.message}\\n`); return 1;")], tests: [T_BR], expectRed: [R_2815] },
	{ n: "28", name: "an attempt with no lane gets a lane line", edits: [one(LR, LANE_SET, "const lanes = [...new Set(attempts.map((view) => view.start.lane))];")], tests: [T_BR], expectRed: [R_2815] },
	{ n: "29", name: "the entry spells another file name", edits: [one(REQ, ENTRY, "Artifact: A-082 · land records · clone store: <git common dir>/nana/land-record.jsonl")], tests: [T_LR], expectRed: [R_2816] },
	{ n: "30", name: "R-2811 drops out of the deliverables", edits: [one(REQ, DELIVERABLES, "Deliverables: R-1400, R-1008, R-1560, R-977, R-2597")], tests: [T_LR], expectRed: [R_2816] },
	{ n: "31", name: "the deliverable's only reader is a person", edits: [one(REQ, READ_BY, "Read by: R-2811 · person: the owner reads the land lines")], tests: [T_LR], expectRed: [R_2816] },
	{ n: "32", name: "the ledger moves to another path", edits: [one(LC, SUBPATH, "export const LAND_RECORDS_SUBPATH = \"nana/lands.jsonl\";")], tests: [T_LR], expectRed: [SEAL] },
	{ n: "33", name: "the read cap halves", edits: [one(LC, READ_CAP, "export const LAND_LEDGER_READ_MAX_BYTES = 16 * 1024 * 1024;")], tests: [T_LR], expectRed: [SEAL] },
];

process.exitCode = await runMutations({ lane: "land-records", self: import.meta.url, tip: "1661558e", declared: DECLARED, pairs: PAIRS });
