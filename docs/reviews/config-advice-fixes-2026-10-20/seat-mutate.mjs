#!/usr/bin/env node
// Seat wrong-code pairs for lane config-advice-fixes (install/hook/gate lane), written by the seat 2026-10-20 after
// build 1 (tip d22ad0b5), on the shared runner. One pair per product site the lane changed or pins: each reverts that
// site to main's form or to the obvious wrong implementation (must-meet.md Design 1-3 and W0-W7), plus three probes
// at the same sites (the line's order, one physical line, no V8 text) and one at the contract text the lane's tests
// stopped typing. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/config-advice-fixes-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const JT = "packages/nana-pack/lib/json-text.mjs";
const OB = "packages/nana-pack/lib/objective.ts";
const OG = "packages/nana-pack/tests/objective-golden.test.mjs";
const DD = "packages/nana-setup/tests/doctor-detail.test.mjs";
const R1971 = "unparseable user nana-pack.json: both runtimes keep the objective and add one line with the error-kind repair, never file text";
const R1972 = "doctor names an unparseable nana-pack.json's file and the error-kind repair, never the file's text";
const R2090 = "a pasted path with a backslash before u: both runtimes give the forward-slash repair, never file text";
const R2091 = "doctor gives the forward-slash repair for a pasted path with a backslash before u, never the file's text";
const R2092 = "a bad escape in a gate pattern: both runtimes tell the user to write the backslash as two and name no config key";
const R2093 = "produceObjective with no settings object returns the internal-error marker, never throws";
const R2094 = "an internal producer error keeps the config-failure line before the internal-error marker";
const one = (file, anchor, replacement, times = 1) => ({ file, anchor, replacement, times });

const CLASSIFIER = String.raw`const BACKSLASH_JSON_ERROR = /^(?:Bad escaped character in JSON|Bad control character in string literal in JSON|Bad Unicode escape in JSON)\b/;`;
const UNICODE_ALT = "|Bad Unicode escape in JSON)";
const ADVICE_TEXT = '"Write paths in this file with forward slashes and any other backslash as two, because JSON reads a single backslash as an escape."';
const MAIN_ADVICE_TEXT = '"Write objective.path with forward slashes because JSON reads a single backslash as an escape."';
const MANUAL_TEXT = '"Repair the JSON by hand."';
const OPTIONAL_READ = "const failure = o?.configFailure;";
const CATCH_PARTS = "[HEADING, ...(configFailure ? [configFailure] : []), `${MARKER_PREFIX}${cause}. Tell the user before spending.`]";
const PARSE_FAILURE = 'repair: BACKSLASH_JSON_ERROR.test(message) ? "forward-slash" : "manual" };';
const DETAIL_RETURN = "return `${CONFIG_FAILURE_PREFIX}${file}${where}. ${advice}`;";

const DECLARED = [
	"(a) every pair runs on macOS with this machine's Node 22.22.2; outside this table, Node 24.22.0 (reached through npx) gave the same V8 wording as 22.22.2 for the Unicode, bad escaped, control character, trailing comma and empty-file cases",
	"(b) no pair removes the two new exports or objective.ts's re-export: a missing export makes every importing check read undefined, a crash rather than wrong behaviour",
	"(c) the hook launcher, bin/nana-objective.mjs, the extension, config.ts, doctor.mjs and both READMEs are unchanged by the lane, so no pair reverts them; doctor reads the advice only through the shared constant",
	"(d) M9 probes the line's order inside the catch branch R-2094 pins, M12 one physical line, M13 V8's message in the line; M14 rewords the contract text the lane's tests stopped typing",
];

const PAIRS = [
	{ n: "M1", name: "main's product code: no Unicode wording, main's advice, o.configFailure (W0)", edits: [
		one(JT, UNICODE_ALT, ")"),
		one(JT, ADVICE_TEXT, MAIN_ADVICE_TEXT),
		one(OB, OPTIONAL_READ, "const failure = o.configFailure;"),
	], tests: [OG, DD], expectRed: [R2090, R2091, R2092, R2093] },
	{ n: "M2", name: "the classifier drops the Unicode wording (W3)", edits: [
		one(JT, UNICODE_ALT, ")"),
	], tests: [OG, DD], expectRed: [R2090, R2091] },
	{ n: "M3", name: "the advice reverts to main's text, naming objective.path with no doubling clause (W6)", edits: [
		one(JT, ADVICE_TEXT, MAIN_ADVICE_TEXT),
	], tests: [OG], expectRed: [R2092] },
	{ n: "M4", name: "the advice names no key but drops the doubling clause (W5)", edits: [
		one(JT, ADVICE_TEXT, '"Write paths with forward slashes because JSON reads a single backslash as an escape."'),
	], tests: [OG], expectRed: [R2092] },
	{ n: "M5", name: "the advice keeps the doubling clause but names objective.path (W2)", edits: [
		one(JT, ADVICE_TEXT, '"Write objective.path with forward slashes and any other backslash as two, because JSON reads a single backslash as an escape."'),
	], tests: [OG], expectRed: [R2092] },
	{ n: "M6", name: "the classifier gives the forward-slash repair for every parse error (W7)", edits: [
		one(JT, CLASSIFIER, "const BACKSLASH_JSON_ERROR = /^/;"),
	], tests: [OG, DD], expectRed: [R1971, R1972] },
	{ n: "M7", name: "the classifier keeps only the Unicode wording", edits: [
		one(JT, CLASSIFIER, String.raw`const BACKSLASH_JSON_ERROR = /^Bad Unicode escape in JSON\b/;`),
	], tests: [OG, DD], expectRed: [R1971, R1972, R2092] },
	{ n: "M8", name: "configFailureLine reads o.configFailure (W4)", edits: [
		one(OB, OPTIONAL_READ, "const failure = o.configFailure;"),
	], tests: [OG], expectRed: [R2093] },
	{ n: "M9", name: "the catch branch puts the config line after the internal-error marker", edits: [
		one(OB, CATCH_PARTS, "[HEADING, `${MARKER_PREFIX}${cause}. Tell the user before spending.`, ...(configFailure ? [configFailure] : [])]"),
	], tests: [OG], expectRed: [R2094] },
	{ n: "M10", name: "the catch branch drops the config line (W1)", edits: [
		one(OB, CATCH_PARTS, "[HEADING, `${MARKER_PREFIX}${cause}. Tell the user before spending.`]"),
	], tests: [OG], expectRed: [R2094] },
	{ n: "M11", name: "the classifier keeps the Unicode wording but drops the bad escaped character wording", edits: [
		one(JT, "Bad escaped character in JSON|", ""),
	], tests: [OG, DD], expectRed: [R1971, R1972, R2092] },
	{ n: "M12", name: "the advice breaks onto a second physical line", edits: [
		one(JT, ADVICE_TEXT, '"Write paths in this file with forward slashes\\nand any other backslash as two, because JSON reads a single backslash as an escape."'),
	], tests: [OG, DD], expectRed: [R1971, R2090, R2092] },
	{ n: "M13", name: "the config-failure detail repeats V8's message", edits: [
		one(JT, PARSE_FAILURE, 'repair: BACKSLASH_JSON_ERROR.test(message) ? "forward-slash" : "manual", message };'),
		one(JT, DETAIL_RETURN, "return `${CONFIG_FAILURE_PREFIX}${file}${where}. ${advice}${failure?.message ? ` (${failure.message})` : \"\"}`;"),
	], tests: [OG, DD], expectRed: [R1971, R1972, R2090, R2091] },
	{ n: "M14", name: "the manual repair is reworded away from the R-1971/R-1972 contract text the pack README quotes", edits: [
		one(JT, MANUAL_TEXT, '"Fix the file."'),
	], tests: [OG, DD], expectRed: [R1971, R1972] },
];

process.exitCode = await runMutations({ lane: "config-advice-fixes", self: import.meta.url, tip: "d22ad0b5", declared: DECLARED, pairs: PAIRS });
