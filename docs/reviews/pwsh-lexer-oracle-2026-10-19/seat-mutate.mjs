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
		one(PG, 'if (tokenStart && ch === "@" && quoteKind', 'if (ch === "@" && quoteKind'),
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
		one(PG, 'if (source[i + 1] === "\\n" || source[i + 1] === "\\r") tokenStart = true;', "tokenStart = true;"),
	], tests: LEX, expectRed: [TS_ESCAPE] },
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
		one(PG, "tokenStart = openerAtTokenStart && nested.closed;", "tokenStart = false;"),
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
];

process.exitCode = await runMutations({ lane: "pwsh-lexer-oracle", self: import.meta.url, tip: "983da287", declared: DECLARED, pairs: PAIRS });
