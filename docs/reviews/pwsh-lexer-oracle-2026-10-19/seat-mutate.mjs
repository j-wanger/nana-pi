#!/usr/bin/env node
// Seat wrong-code pairs for lane pwsh-lexer-oracle (gate lane: pipe-guard.mjs is the verifier hook's and nana-gate's
// predicate), written by the seat 2026-10-19 after build 1, on the shared runner. Each pair reverts one site of the
// token-start scanner, its config or the oracle helper to today's main rule or the obvious wrong form the build brief
// lists. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/pwsh-lexer-oracle-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PG = "packages/nana-pack/lib/pipe-guard.mjs";
const CF = "packages/nana-pack/lib/pwsh-lexer-config.mjs";
const OR = "packages/nana-pack/tests/pwsh-oracle.mjs";
const OT = "packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs";
const PGT = "packages/nana-pack/tests/pipe-guard.test.mjs";
const LEX = [OT, PGT];

const R1731 = "oracle: on win32 a Windows PowerShell that does not start fails the run instead of skipping";
const R1732 = "oracle: a parse error or a missing result fails the comparison and names the command";
const TS_QUOTE = "token start: quoted part before line comment marker";
const TS_BRACKET = "token start: closing bracket in a bare word";
const TS_DOLLAR = "token start: dollar before line comment marker";
const TS_SUBEXPR = "token start: word subexpression before line comment marker";
const TS_ESCAPE = "token start: escaped space before line comment marker";
const TS_BRACED = "token start: braced variable before line comment marker";
const TS_QUOTE_BLOCK = "token start: quoted part before block comment marker";
const TS_INDEX = "token start: indexed variable starts a comment";
const TS_STANDALONE = "token start: standalone string starts a comment";
const TS_HERE_SINGLE = "token start: single-quote here marker inside a word";
const TS_HERE_DOUBLE = "token start: double-quote here marker inside a word";
const TQ_SINGLE = "typographic quotes: typographic single opener";
const TQ_CLOSER = "typographic quotes: typographic double closer";
const TQ_PIPE = "typographic quotes: typographic double-quoted pipe";
const CR = "line end: a carriage return ends a line comment";
const AC_HERE_SINGLE = "token start after a close: single-quoted here-string";
const AC_HERE_DOUBLE = "token start after a close: expandable here-string";
const AC_BLOCK = "token start after a close: block comment";
// pipe-guard.test.mjs (R-1062): the case must-meet names as edited, then cases the same wrong code also turns red.
const PG_DOLLAR_HASH = "predicate table: PS: $# is one bare word, so its ) closes the subexpression";
const PG_BRACKET = "predicate table: PS: a comment after a closing bracket hides a ) that would close early (§2.2.3 example only)";
const PG_PAREN = "predicate table: PS: a comment after a closing paren hides a ) that would close early (§2.2.3 example, §2.3.3)";
const PG_SQ = "predicate table: PS: a comment after a closing single quote hides a ) that would close early (sol r3 repro; §2.2.3 example, §2.3.3 single-quote-character)";
const PG_DQ = "predicate table: PS: a comment after a closing double quote hides a ) that would close early (§2.2.3 example, §2.3.3 double-quote-character)";
const PG_HASH_WORD = "predicate table: PS: an embedded # inside a word does not start a comment";
const PG_URL = "predicate table: PS: a URL fragment's # does not start a comment";
const PG_BLOCK_WORD = "predicate table: PS: an embedded <# inside a word does not start a block comment (sol r2 repro)";
const PG_BLOCK_SUBEXPR = "predicate table: PS: an embedded <# inside a word inside $(...) does not start a block comment";
const PG_DIGIT = "predicate table: PS: a digit before # does not start a comment";
const PG_UNDERSCORE = "predicate table: PS: an underscore before # does not start a comment";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const ENDERS = '["&", "(", ")", ",", ";", "{", "|", "}"]';
const SINGLES = 'new Set(["\'", "‘", "’", "‚", "‛"])';
const DOUBLES = "new Set(['\"', \"“\", \"”\", \"„\"])";

const DECLARED = [
	"(a) this Mac has no PowerShell: the oracle check (R-1730) prints SKIP then PASS here, so no pair names it; R-1730 is covered only by seat-mutate-ci.mjs (W1-W3), which the seat runs in place on a CI leg with pwsh",
	"(b) M19-M21 edit packages/nana-pack/tests/pwsh-oracle.mjs, the oracle helper whose behaviour R-1731 and R-1732 state, never a test file; M1-M18 edit pipe-guard.mjs or pwsh-lexer-config.mjs",
	"(c) M18 names an R-1062 predicate-table case: the lane's `( … )` close rule has no must-meet case; alsoRed lists R-1062 cases the same wrong code also turns red, and the edited `$#` case is named where it turns red",
	"(d) no pair, because no deterministic check and no generated command catches it (scratch probe 2026-10-19): every `)` ends a word (main's rule, the mid-word `( … )` direction of M18); a lone CR after a here-string opener or before its closer; ‚ (U+201A) dropped from the single-quote set; typographic here-string closers matched only in ASCII; Windows PowerShell's required flag, its not-on-PATH throw, and dropping it from POWERSHELL_ORACLE_SHELLS",
	"(e) oracle-only and in neither table: reporting a mid-word quoted part as a span, and dropping the span sort (each changes the generated corpus's spans and no live text)",
];

const PAIRS = [
	{ n: "M1", name: "`$` ends a bare word (main's boundary set)", edits: [
		one(CF, ENDERS, '["&", "(", ")", ",", ";", "{", "|", "}", "$"]'),
	], tests: LEX, expectRed: [TS_DOLLAR, TS_INDEX, PG_DOLLAR_HASH], alsoRed: [PG_BRACKET] },
	{ n: "M2", name: "`]` ends a bare word outside a variable index (main's boundary set)", edits: [
		one(CF, ENDERS, '["&", "(", ")", ",", ";", "{", "|", "}", "]"]'),
	], tests: LEX, expectRed: [TS_BRACKET] },
	{ n: "M3", name: "`#` starts a line comment anywhere", edits: [
		one(PG, 'if (tokenStart && ch === "#") {', 'if (ch === "#") {'),
	], tests: LEX, expectRed: [TS_QUOTE, TS_BRACKET, TS_DOLLAR, TS_SUBEXPR, TS_ESCAPE, TS_BRACED, TS_QUOTE_BLOCK, PG_DOLLAR_HASH],
	alsoRed: [PG_HASH_WORD, PG_URL, PG_BLOCK_WORD, PG_BLOCK_SUBEXPR, PG_DIGIT, PG_UNDERSCORE] },
	{ n: "M4", name: "`<#` starts a block comment anywhere", edits: [
		one(PG, 'if (tokenStart && ch === "<" && source[i + 1] === "#") {', 'if (ch === "<" && source[i + 1] === "#") {'),
	], tests: LEX, expectRed: [TS_QUOTE_BLOCK], alsoRed: [PG_BLOCK_WORD, PG_BLOCK_SUBEXPR] },
	{ n: "M5", name: "a here-string opens at any line-final `@'` or `@\"` (main's rule)", edits: [
		one(PG, 'if (hereStringStart && ch === "@" && quoteKind', 'if (ch === "@" && quoteKind'),
	], tests: LEX, expectRed: [TS_HERE_SINGLE, TS_HERE_DOUBLE] },
	{ n: "M6", name: "every closing quote starts a token, a mid-word quoted part too (main's boundary set)", edits: [
		one(PG, "tokenStart = standalone && result.closed;", "tokenStart = result.closed;"),
	], tests: LEX, expectRed: [TS_QUOTE, TS_QUOTE_BLOCK] },
	{ n: "M7", name: "no closing quote starts a token, a standalone string's neither", edits: [
		one(PG, "tokenStart = standalone && result.closed;", "tokenStart = false;"),
	], tests: LEX, expectRed: [TS_STANDALONE], alsoRed: [PG_SQ, PG_DQ] },
	{ n: "M8", name: "the `}` of `${…}` starts a token (main's boundary set)", edits: [
		one(PG, "live += source.slice(i, end);\n\t\t\ti = end;\n\t\t\ttokenStart = false;", "live += source.slice(i, end);\n\t\t\ti = end;\n\t\t\ttokenStart = true;"),
	], tests: LEX, expectRed: [TS_BRACED] },
	{ n: "M9", name: "the `)` of a word's own `$( … )` starts a token (main's boundary set)", edits: [
		one(PG, "tokenStart = standalone && nested.closed;", "tokenStart = nested.closed;"),
	], tests: LEX, expectRed: [TS_SUBEXPR] },
	{ n: "M10", name: "every backtick escape starts a token, not only backtick-LF (main's boundary set)", edits: [
		one(PG, 'tokenStart = source[i + 1] === "\\n" || source[i + 1] === "\\r";', "tokenStart = true;"),
	], tests: LEX, expectRed: [TS_ESCAPE] },
	// Added after build 2 (7ca1eafb), whose fix makes a non-continuation escape clear the token start.
	{ n: "M22", name: "an escape that is not a line continuation keeps the token start (build 1's form; the independent check's F1)", edits: [
		one(PG, 'tokenStart = source[i + 1] === "\\n" || source[i + 1] === "\\r";', 'if (source[i + 1] === "\\n" || source[i + 1] === "\\r") tokenStart = true;'),
	], tests: LEX, expectRed: ["token start: leading escape before line comment marker", "token start: leading escape before block comment marker"] },
	{ n: "M11", name: "a variable's `[ … ]` index close starts no token", edits: [
		one(PG, "if (variableIndexDepth === 0) { tokenStart = true; wordStart = i; }", "if (variableIndexDepth === 0) { tokenStart = false; wordStart = i; }"),
	], tests: LEX, expectRed: [TS_INDEX], alsoRed: [PG_BRACKET] },
	{ n: "M12", name: "a block comment's close starts no token", edits: [
		one(PG, "i = end;\n\t\t\ttokenStart = true;", "i = end;\n\t\t\ttokenStart = false;"),
	], tests: LEX, expectRed: [AC_BLOCK] },
	{ n: "M13", name: "a here-string's close starts no token", edits: [
		one(PG, "i = result.end;\n\t\t\ttokenStart = true;", "i = result.end;\n\t\t\ttokenStart = false;"),
	], tests: LEX, expectRed: [AC_HERE_SINGLE, AC_HERE_DOUBLE] },
	{ n: "M14", name: "a line comment ends only at LF (main's rule)", edits: [
		one(PG, 'while (at < source.length && source[at] !== "\\r" && source[at] !== "\\n") at++;', 'while (at < source.length && source[at] !== "\\n") at++;'),
	], tests: LEX, expectRed: [CR] },
	{ n: "M15", name: "the single-quote set is ASCII only (main's rule)", edits: [
		one(CF, SINGLES, 'new Set(["\'"])'),
	], tests: LEX, expectRed: [TQ_SINGLE] },
	{ n: "M16", name: "the double-quote set is ASCII only (main's rule)", edits: [
		one(CF, DOUBLES, "new Set(['\"'])"),
	], tests: LEX, expectRed: [TQ_CLOSER, TQ_PIPE] },
	{ n: "M17", name: "a string closes only at the character that opened it", edits: [
		one(PG, "if (quotes.has(ch)) {", "if (ch === source[start]) {"),
	], tests: LEX, expectRed: [TQ_SINGLE, TQ_CLOSER] },
	{ n: "M18", name: "the `)` of a `( … )` opened at a token start starts no token", edits: [
		one(PG, "\t\t\ttokenStart = nested.closed;", "\t\t\ttokenStart = false;"),
	], tests: LEX, expectRed: [PG_PAREN] },
	{ n: "M19", name: "a Windows PowerShell that does not start on win32 is a SKIP", edits: [
		one(OR, 'if (missing && !(shell === "powershell" && platform === "win32")) return', "if (missing) return"),
	], tests: [OT], expectRed: [R1731] },
	{ n: "M20", name: "a parse-error line is read as an empty result", edits: [
		one(OR, 'if (tag === "E") errors.add(index);', 'if (tag === "E") results.set(index, []);'),
	], tests: [OT], expectRed: [R1732] },
	{ n: "M21", name: "a short result list is accepted", edits: [
		one(OR, "\t\tif (!results.has(index)) throw new Error(`${shell} missing result for command ${index}: ${shown}`);\n", ""),
	], tests: [OT], expectRed: [R1732] },
	// Added after build 3 (3327c1cd): R-1737 to R-1739.
	{ n: "M23", name: "a here-string opens only at a token start, never glued to an assignment (build 2's rule; Opus r1 M1)", edits: [
		one(PG, "const hereStringStart = tokenStart || isGluedVariableAssignment(source, i, wordStart);", "const hereStringStart = tokenStart;"),
	], tests: LEX, expectRed: ["assignment here-string: single-quoted assignment", "assignment here-string: single-quoted assignment with CRLF", "assignment here-string: pipeline before single-quoted assignment", "assignment here-string: plus-equals assignment", "assignment here-string: expandable assignment with an odd body quote", "assignment here-string: assignment opener with a trailing tab"] },
	{ n: "M24", name: "only a variable's first index counts as an index (build 2's rule; Fable r1 F1 shape 1)", edits: [
		one(PG, "if (ch === \"[\" && (variableIndexDepth > 0\n\t\t\t|| /^\\$(?:[\\w:]+|\\{[^}]+\\})$/u.test(source.slice(wordStart, i))\n\t\t\t|| (tokenStart && source[i - 1] === \"]\"))) variableIndexDepth++;", "if (ch === \"[\" && /^\\$(?:[\\w:]+|\\{[^}]+\\})$/u.test(source.slice(wordStart, i))) variableIndexDepth++;"),
	], tests: LEX, expectRed: ["comment after an index: numeric second index", "comment after an index: string-key second index", "comment after an index: nested variable index", "comment after an index: third index"] },
	{ n: "M25", name: "a closed ( … ) starts a token only when its opener did (build 2's rule; Fable r1 F1 shapes 2 and 3)", edits: [
		one(PG, "\t\t\tconst nested = scanPowerShellRange(source, i + 1, true, spans);", "\t\t\tconst openerAtTokenStart = tokenStart;\n\t\t\tconst nested = scanPowerShellRange(source, i + 1, true, spans);"),
		one(PG, "\t\t\ttokenStart = nested.closed;", "\t\t\ttokenStart = openerAtTokenStart && nested.closed;"),
	], tests: LEX, expectRed: ["comment after a parenthesized expression: nonempty array subexpression", "comment after a parenthesized expression: empty array subexpression", "comment after a parenthesized expression: member call with arguments"] },
];

process.exitCode = await runMutations({ lane: "pwsh-lexer-oracle", self: import.meta.url, tip: "37d2e671", declared: DECLARED, pairs: PAIRS });
