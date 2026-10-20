#!/usr/bin/env node
// Seat wrong-code pairs for lane win-config-json-path (install/hook/gate lane), written by the seat 2026-10-20 after
// build 1 (tip 82ed4542), on the shared runner. One pair per product site the lane changed: each reverts that site to
// main's form or to the obvious wrong implementation (must-meet.md Design 1-5; build-brief-1.md W1-W8). Run from the
// worktree root:
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
const R1971 = "unparseable user nana-pack.json: both runtimes keep the objective and add one line naming the file, the line and column, and the forward-slash repair, never file text";
const R1972 = "doctor names an unparseable nana-pack.json's file, the error's line and column and the forward-slash repair, never the file's text";
const R1580 = "doctor reads a nana-pack.json saved with a byte-order mark and CRLF as it reads the same file without one";
const BYTE = ["single backslashes", "BOM and CRLF", "unquoted path"].map((label) => `unparseable config ${label}: BYTE-IDENTICAL hook vs pi`);
const one = (file, anchor, replacement, times = 1) => ({ file, anchor, replacement, times });

const EXAMPLE_TAIL = '; write paths with forward slashes because JSON reads a single backslash as an escape, and `~/` means your user folder, for example `{ "objective": { "projectFile": "OBJECTIVE.md", "path": "~/umbrella/OBJECTIVE.md" } }`.';
const EXAMPLE_PATH = '"path": "~/umbrella/OBJECTIVE.md"';
const PARSE_FAIL_RETURN = "jsonFailure: jsonErrorPlace(e), gateValid: false };";
const LOAD_CONFIG_ATTACH = '...("jsonFailure" in user ? { configFailure: { file: userFile, ...(user.jsonFailure ?? {}) } } : {}),';
const LOAD_USER_ATTACH = '...("jsonFailure" in user ? { configFailure: { file, ...(user.jsonFailure ?? {}) } } : {}),';
const LINE_TEXT = "${CONFIG_FAILURE_PREFIX}${displayPath(failure.file)}${place}. Write";
const DOCTOR_WHERE = 'const where = place ? ` at line ${place.line}, column ${place.column}` : "";';

const DECLARED = [
	"(a) every pair runs on macOS with this machine's Node; the plan probed the same V8 place suffix on Node 22.22.2 and 24.22.0, and the Linux and Windows legs are CI's",
	"(b) M17, M18 and M23 name no title: no must-meet check covers the line beside an UNAVAILABLE marker, the line in the internal-error block, or doctor's text for a missing file (must-meet Design 4 and 5), and they run to show whether any check does",
	"(c) no pair for R-1973 (a folder at the nana-pack.json path): the adversary's amendment dropped it with the second read it guarded, and the build pins no R-1973",
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
	], tests: [OG], expectRed: [R1971] },
	{ n: "M8", name: "both loaders attach configFailure only when the parser reported a place", edits: [
		one(CF, '"jsonFailure" in user ?', "user.jsonFailure ?", 2),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M9", name: "loadConfig (pi) does not attach configFailure; only loadUserObjective does (W3)", edits: [
		one(CF, LOAD_CONFIG_ATTACH, ""),
	], tests: [OG], expectRed: [R1971, ...BYTE] },
	{ n: "M10", name: "loadUserObjective (the hook) does not attach configFailure; only loadConfig does", edits: [
		one(CF, LOAD_USER_ATTACH, ""),
	], tests: [OG], expectRed: [R1971, ...BYTE] },
	{ n: "M11", name: "a broken file that spells enabled:false turns the objective off in both runtimes (W7)", edits: [
		one(CF, "return { present: true, blocks: {}, problems: [`invalid JSON (", 'return { present: true, blocks: /"enabled"\\s*:\\s*false/.test(text) ? { objective: { enabled: false } } : {}, problems: [`invalid JSON ('),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M12", name: "the runtimes' line carries the parser's message (W4)", edits: [
		one(CF, PARSE_FAIL_RETURN, "jsonFailure: { ...jsonErrorPlace(e), message: String(e?.message ?? e) }, gateValid: false };"),
		one(OB, LINE_TEXT, '${CONFIG_FAILURE_PREFIX}${displayPath(failure.file)}${place} (${Reflect.get(failure, "message")}). Write'),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M13", name: "configFailureLine never renders a line (main's form)", edits: [
		one(OB, "if (!failure) return null;", "return null;"),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M14", name: "the block for a found objective file drops the line", edits: [
		one(OB, "const parts = [HEADING, ...(configFailure ? [configFailure] : []), ...pre];", "const parts = [HEADING, ...pre];"),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M15", name: "the line replaces the objective block instead of joining it", edits: [
		one(OB, "const configFailure = configFailureLine(o);\n\n\tlet governing = umbrella;", 'const configFailure = configFailureLine(o);\n\tif (configFailure) return { text: finish([HEADING, configFailure].join("\\n\\n")), unavailable: true, events, notices };\n\n\tlet governing = umbrella;'),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M16", name: "the line drops the line and column", edits: [
		one(OB, "? ` at line ${failure.line}, column ${failure.column}`", '? ""'),
	], tests: [OG], expectRed: [R1971] },
	{ n: "M17", name: "the line is dropped beside an OBJECTIVE UNAVAILABLE marker", edits: [
		one(OB, "finish([HEADING, ...(configFailure ? [configFailure] : []), ...pre, `${MARKER_PREFIX}${found.cause}", "finish([HEADING, ...pre, `${MARKER_PREFIX}${found.cause}"),
	], tests: [OG], expectRed: [] },
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
		one(DR, DOCTOR_WHERE, "const where = ` (${String(error?.message ?? error)})`;"),
	], tests: [DD], expectRed: [R1972] },
	{ n: "M22", name: "doctor's detail drops the line and column", edits: [
		one(DR, DOCTOR_WHERE, 'const where = "";'),
	], tests: [DD], expectRed: [R1972] },
	{ n: "M23", name: "doctor reports a missing or unreadable file as unparseable", edits: [
		one(DR, "return { cfg: null, parseDetail: null };", "return { cfg: null, parseDetail: `${CONFIG_FAILURE_PREFIX}${file}. Repair it by hand with forward slashes in objective.path because JSON reads a single backslash as an escape.` };"),
	], tests: [DD], expectRed: [] },
];

process.exitCode = await runMutations({ lane: "win-config-json-path", self: import.meta.url, tip: "82ed4542", declared: DECLARED, pairs: PAIRS });
