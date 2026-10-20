#!/usr/bin/env node
// Seat wrong-code pairs for lane pwsh-lexer-oracle that only the PowerShell oracle (R-1730) can judge, in the shape
// win-pairs.mjs reads (docs/reviews/post-edit-win-survivors-2026-10-19/win-pairs.mjs). Written by the seat 2026-10-19
// for tip 983da287; run in place on a scratch CI branch, on a leg where pwsh is on PATH. Never merged:
//   node <win-pairs.mjs> docs/reviews/pwsh-lexer-oracle-2026-10-19/seat-mutate-ci.mjs
// Each pair is a lexer gap from the threat model's typographic quotes. Before writing a pair the seat read the
// deterministic tables (pipe-guard-pwsh-oracle.test.mjs R-1733..R-1736, pipe-guard.test.mjs, verifier-pipe.test.mjs):
// their only typographic cases are ‘ opening against an ASCII ' closer, " against ” and “ against ” (R-1734); none has
// a typographic here-string, a ’ or a doubled typographic quote. A scratch run on macOS then kept all three files green
// under each pair, while each pair changed powerShellSpans on generated corpus commands (seed 1, size 1,500). The
// oracle throws at the first disagreeing command, so each pair names the command its FAIL line must quote.
const PG = "packages/nana-pack/lib/pipe-guard.mjs";
const CF = "packages/nana-pack/lib/pwsh-lexer-config.mjs";
const OT = "packages/nana-pack/tests/pipe-guard-pwsh-oracle.test.mjs";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const ORACLE = (shell) => `oracle: ${shell} reports the lexer's comment and string spans for every generated command`;
// Off win32 the powershell check prints SKIP then PASS, so only the Windows leg can turn its title red.
const RED = process.platform === "win32" ? [ORACLE("pwsh"), ORACLE("powershell")] : [ORACLE("pwsh")];
export const PAIRS = [
	{ n: "W1", name: "a here-string opens only at an ASCII quote, so @‘ and @“ here-strings are missed (first disagreement: command 27, \"@‘\\ntypographic\\n’@\"; 2 commands differ)", edits: [
		one(PG, 'ch === "@" && quoteKind(source[i + 1]) && lineEndsAfter', "ch === \"@\" && (source[i + 1] === \"'\" || source[i + 1] === '\"') && lineEndsAfter"),
	], tests: [OT], expectRed: RED },
	{ n: "W2", name: "’ (U+2019) is dropped from the single-quote set (first disagreement: command 55, \"Write-Output ‘a’’b’ | Write-Output; Write-Output $(Write-Output inner)\"; 69 commands differ)", edits: [
		one(CF, 'new Set(["\'", "‘", "’", "‚", "‛"])', 'new Set(["\'", "‘", "‚", "‛"])'),
	], tests: [OT], expectRed: RED },
	{ n: "W3", name: "only an ASCII quote doubles as an escape, so ’’ and ”” end the string (main's rule; first disagreement: command 11, \"Write-Output ‘a’’b’\"; 265 commands differ)", edits: [
		one(PG, "if (quotes.has(source[i + 1])) {", "if (source[i + 1] === ch && (ch === \"'\" || ch === '\"')) {"),
	], tests: [OT], expectRed: RED },
];
