#!/usr/bin/env node
// Seat wrong-code pairs for lane win-config-json-path (install/hook/gate lane), written by the seat 2026-10-20 after
// build 1 (tip 82ed4542), on the shared runner. One pair per product site the lane changed: each reverts that site to
// main's form or to the obvious wrong implementation (must-meet.md Design 1-5; build-brief-1.md W1-W8). Run from the
// worktree root. Re-run after build 2 (2abae182, merged with main at d519cc09): titles renamed, M17/M23 name R-1973/R-1974,
// sites that moved into json-text.mjs's shared configFailureDetail re-anchored on each runtime's call site, M24/M25 added:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-config-json-path-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RM = "README.md";
const JT = "packages/nana-pack/lib/json-text.mjs";
const CF = "packages/nana-pack/lib/config.ts";
const OB = "packages/nana-pack/lib/objective.ts";
const DR = "packages/nana-setup/lib/doctor.mjs";
const FM = "packages/nana-setup/tests/fresh-machine.test.mjs";
const OG = "packages/nana-pack/tests/objective-golden.test.mjs";
const DD = "packages/nana-setup/tests/doctor-detail.test.mjs";
const R1970 = "Windows step 7 shows a nana-pack.json example that parses as JSON and whose objective.path resolves inside the home folder alike in the pack and in doctor";
const R1971 = "unparseable user nana-pack.json: both runtimes keep the objective and add one line with the error-kind repair, never file text";
const R1972 = "doctor names an unparseable nana-pack.json's file and the error-kind repair, never the file's text";
const R1973 = "unparseable user nana-pack.json and unreadable objective: both runtimes print the config line and UNAVAILABLE marker without file text";
const R1974 = "doctor keeps missing-or-unparseable detail for a missing or unreadable nana-pack.json";
const R1580 = "doctor reads a nana-pack.json saved with a byte-order mark and CRLF as it reads the same file without one";
const BYTE = ["single backslashes", "BOM and CRLF", "bad control character", "unquoted path", "trailing comma"].map((label) => `unparseable config ${label}: BYTE-IDENTICAL hook vs pi`);
const BYTE_UNAVAILABLE = "unparseable config and unavailable objective: BYTE-IDENTICAL hook vs pi";
const one = (file, anchor, replacement, times = 1) => ({ file, anchor, replacement, times });

const EXAMPLE_TAIL = '; write paths with forward slashes because JSON reads a single backslash as an escape, and `~/` means your user folder, for example `{ "objective": { "projectFile": "OBJECTIVE.md", "path": "~/umbrella/OBJECTIVE.md" } }`.';
const EXAMPLE_PATH = '"path": "~/umbrella/OBJECTIVE.md"';
const PARSE_FAIL_RETURN = "jsonFailure: jsonParseFailure(e), gateValid: false };";
const LOAD_CONFIG_ATTACH = '...("jsonFailure" in user ? { configFailure: { file: userFile, ...(user.jsonFailure ?? {}) } } : {}),';
const LOAD_USER_ATTACH = '...("jsonFailure" in user ? { configFailure: { file, ...(user.jsonFailure ?? {}) } } : {}),';
const LINE_TEXT = "${configFailureDetail(displayPath(failure.file), failure)} Tell the user";
const LINE_DETAIL = "configFailureDetail(displayPath(failure.file), failure)";
const DOCTOR_DETAIL = "parseDetail: configFailureDetail(file, jsonParseFailure(error))";
const ADVICE = 'const advice = failure?.repair === "forward-slash" ? FORWARD_SLASH_ADVICE : MANUAL_JSON_ADVICE;';

const DECLARED = [
	"(a) every pair runs on macOS with this machine's Node; the plan probed the same V8 place suffix on Node 22.22.2 and 24.22.0, and the Linux and Windows legs are CI's",
	"(b) M18 names no title: no check forces produceObjective's internal-error block, so the line there is unpinned (build brief 2 keeps it a declared limit); M17 and M23 now name build 2's R-1973 and R-1974",
	"(c) no pair for the plan's dropped folder-at-path read in the runtimes (the adversary's amendment removed it); build 2 reused R-1973 for the unavailable-objective line, and R-1974 covers doctor's folder case",
	"(d) no pair for the pack README's new objective-contract bullet: prose that no check reads",
];

const PAIRS = [
	{ n: "M1", name: "Windows step 7 reverts to main's text, with no JSON example", edits: [
		one(RM, EXAMPLE_TAIL, "."),
	], tests: [FM], expectRed: [R1970] },
	{ n: "M2", name: "the step 7 example writes the path with single backslashes (W1)", edits: [
		one(RM, EXAMPLE_PATH, '"path": "C:\\Users\\you\\umbrella\\OBJECTIVE.md"'),
	], tests: [FM], expectRed: [R1970] },
	{ n: "M3", name: "the step 7 example writes a forward-slash drive path (W2)", edits: [
		one(RM, EXAMPLE_PATH, '"path": "C:/Users/you/umbrella/OBJECTIVE.md"'),
	], tests: [FM], expectRed: [R1970] },
	{ n: "M4", name: "the step 7 example writes the path with doubled backslashes (W2)", edits: [
		one(RM, EXAMPLE_PATH, '"path": "C:\\\\Users\\\\you\\\\umbrella\\\\OBJECTIVE.md"'),
	], tests: [FM], expectRed: [R1970] },
	{ n: "M5", name: "jsonErrorPlace reads the place from V8's `at position N` as a line-1 column (W6)", edits: [
		one(JT, String.raw`const JSON_ERROR_PLACE = /\(line (\d+) column (\d+)\)$/;`, String.raw`const JSON_ERROR_PLACE = /at position (\d+)/;`),
		one(JT, "return match ? { line: Number(match[1]), column: Number(match[2]) } : null;", "return match ? { line: 1, column: Number(match[1]) + 1 } : null;"),
	], tests: [OG, DD], expectRed: [R1971, R1972] },
	{ n: "M6", name: "readConfigFile parses without removing a byte-order mark (W8)", edits: [
		one(CF, "raw = parseJsonText(text);", "raw = JSON.parse(text);"),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M7", name: "readConfigFile records no parse failure (main's form)", edits: [
		one(CF, PARSE_FAIL_RETURN, "gateValid: false };"),
	], tests: [OG], expectRed: [R1971, R1973] },
	{ n: "M8", name: "both loaders attach configFailure only when the parser reported a place", edits: [
		one(CF, '"jsonFailure" in user ?', "user.jsonFailure?.line ?", 2),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M9", name: "loadConfig (pi) does not attach configFailure; only loadUserObjective does (W3)", edits: [
		one(CF, LOAD_CONFIG_ATTACH, ""),
	], tests: [OG], expectRed: [R1971, ...BYTE, R1973, BYTE_UNAVAILABLE] },
	{ n: "M10", name: "loadUserObjective (the hook) does not attach configFailure; only loadConfig does", edits: [
		one(CF, LOAD_USER_ATTACH, ""),
	], tests: [OG], expectRed: [R1971, ...BYTE, R1973, BYTE_UNAVAILABLE] },
	{ n: "M11", name: "a broken file that spells enabled:false turns the objective off in both runtimes (W7)", edits: [
		one(CF, "return { present: true, blocks: {}, problems: [`invalid JSON (", 'return { present: true, blocks: /"enabled"\\s*:\\s*false/.test(text) ? { objective: { enabled: false } } : {}, problems: [`invalid JSON ('),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M12", name: "the runtimes' line carries the parser's message (W4)", edits: [
		one(CF, PARSE_FAIL_RETURN, "jsonFailure: { ...jsonParseFailure(e), message: String(e?.message ?? e) }, gateValid: false };"),
		one(OB, LINE_TEXT, '${configFailureDetail(displayPath(failure.file), failure)} (${Reflect.get(failure, "message")}) Tell the user'),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M13", name: "configFailureLine never renders a line (main's form)", edits: [
		one(OB, "if (!failure) return null;", "return null;"),
	], tests: [OG], expectRed: [R1971, R1973] },
	{ n: "M14", name: "the block for a found objective file drops the line", edits: [
		one(OB, "const parts = [HEADING, ...(configFailure ? [configFailure] : []), ...pre];", "const parts = [HEADING, ...pre];"),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M15", name: "the line replaces the objective block instead of joining it", edits: [
		one(OB, "const configFailure = configFailureLine(o);\n\n\tlet governing = umbrella;", 'const configFailure = configFailureLine(o);\n\tif (configFailure) return { text: finish([HEADING, configFailure].join("\\n\\n")), unavailable: true, events, notices };\n\n\tlet governing = umbrella;'),
	], tests: [OG], expectRed: [R1971, R1973] },
	{ n: "M16", name: "the line drops the line and column", edits: [
		one(OB, LINE_DETAIL, "configFailureDetail(displayPath(failure.file), { repair: failure.repair })"),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M17", name: "the line is dropped beside an OBJECTIVE UNAVAILABLE marker", edits: [
		one(OB, "finish([HEADING, ...(configFailure ? [configFailure] : []), ...pre, `${MARKER_PREFIX}${found.cause}", "finish([HEADING, ...pre, `${MARKER_PREFIX}${found.cause}"),
	], tests: [OG], expectRed: [R1973] },
	{ n: "M18", name: "the line is dropped from produceObjective's internal-error block", edits: [
		one(OB, "text: finish([HEADING, ...(configFailure ? [configFailure] : []), `${MARKER_PREFIX}${cause}", "text: finish([HEADING, `${MARKER_PREFIX}${cause}"),
	], tests: [OG], expectRed: [] },
	{ n: "M19", name: "doctor reads through readPiPackConfig and prints main's missing-or-unparseable text", edits: [
		one(DR, "objectiveTarget, ownSkillCopy, registrationState", "objectiveTarget, ownSkillCopy, readPiPackConfig, registrationState"),
		one(DR, "const configState = piPackConfigState(layout.piPackConfig);", "const configState = { cfg: readPiPackConfig(layout), parseDetail: null };"),
	], tests: [DD], expectRed: [R1972] },
	{ n: "M20", name: "doctor parses without removing a byte-order mark (W5)", edits: [
		one(DR, "return { cfg: parseJsonText(text), parseDetail: null };", "return { cfg: JSON.parse(text), parseDetail: null };"),
	], tests: [DD], expectRed: [R1972, R1580] },
	{ n: "M21", name: "doctor's detail shows the parser's message instead of the place (W4)", edits: [
		one(DR, DOCTOR_DETAIL, 'parseDetail: configFailureDetail(`${file} (${String(error?.message ?? error)})`, { repair: jsonParseFailure(error).repair })'),
	], tests: [DD], expectRed: [R1972] },
	{ n: "M22", name: "doctor's detail drops the line and column", edits: [
		one(DR, DOCTOR_DETAIL, "parseDetail: configFailureDetail(file, { repair: jsonParseFailure(error).repair })"),
	], tests: [DD], expectRed: [R1972] },
	{ n: "M23", name: "doctor reports a missing or unreadable file as unparseable", edits: [
		one(DR, "return { cfg: null, parseDetail: null };", 'return { cfg: null, parseDetail: configFailureDetail(file, { repair: "manual" }) };'),
	], tests: [DD], expectRed: [R1974] },
	{ n: "M24", name: "the advice helper gives the forward-slash advice for every parse error (build 1's form)", edits: [
		one(JT, ADVICE, "const advice = FORWARD_SLASH_ADVICE;"),
	], tests: [OG, DD], expectRed: [R1971, R1972] },
	{ n: "M25", name: "the advice helper gives the manual repair for every parse error, a bad escape included", edits: [
		one(JT, ADVICE, "const advice = MANUAL_JSON_ADVICE;"),
	], tests: [OG, DD], expectRed: [R1971, R1972] },
];

process.exitCode = await runMutations({ lane: "win-config-json-path", self: import.meta.url, tip: "d519cc0", declared: DECLARED, pairs: PAIRS });
