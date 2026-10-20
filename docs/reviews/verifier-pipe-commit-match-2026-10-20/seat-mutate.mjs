#!/usr/bin/env node
// Seat wrong-code pairs for lane verifier-pipe-commit-match (hook and gate lane), written by the seat 2026-10-20 after
// build 1 and extended after builds 2 and 3, on the shared runner. Each pair puts one product site the lane changed into
// its wrong form: main's behaviour, an earlier build's form, or the obvious wrong implementation. F pairs break the commit
// finder, X pairs the live-text exposures, S pairs the status reader, K pairs the line-break continuations and the comment
// rule, Q pairs build 3's quoted line breaks, B the bash backslash escape, P pairs the pipeline starts, E pairs the errexit
// reader, V the pipefail exemption, D the README guard lines and C the install check's PowerShell sample (build brief
// wrong-code numbers in each name where one applies). Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/verifier-pipe-commit-match-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-pack/tests/pipe-guard.test.mjs";
const VP = "packages/nana-setup/tests/verifier-pipe.test.mjs";
const IC = "packages/nana-setup/tests/install-check.test.mjs";
const PG = "packages/nana-pack/lib/pipe-guard.mjs";
const PACK_README = "packages/nana-pack/README.md";
const SETUP_README = "packages/nana-setup/README.md";
const IC_CONFIG = "packages/nana-setup/lib/install-check-config.mjs";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// Titles, built with the test files' own templates.
const DS = (name) => `discarded status: ${name}`;
const CS = (name) => `consumed status: ${name}`;
const GS = (name) => `git spelling: ${name}`;
const NC = (name) => `not a commit: ${name}`;
const PT = (name) => `predicate table: ${name}`;
const R2355 = "installed hook abstains on a discarded pipeline status and asks on git.exe commit";
const R2356 = "both READMEs declare which pipelines the verifier-pipe guard asks on";
const R2354_README = "both READMEs declare the literal-text later-call gap and the sandbox boundary";
const R2357 = "pi headless gate lets a discarded pipeline status reach git commit";
const R1054_BASH = "decideHook keeps the Bash dialect for a Bash event (the same pipefail prefix is exempted there)";
const R1062_PS = /^predicate table: PS: /;
const R1062_COMMENT_PIPE = "predicate table: PS: a comment after a pipe hides a ) that would close early (§2.3.3 only)";
const R983_GATE = [
	"pi headless gate blocks with verifier-pipe reason",
	"pi interactive gate prompts with verifier-pipe reason",
	"pi PowerShell gate does not treat Bash pipefail syntax as active",
	"allowPatterns cannot exempt the verifier-pipe floor",
];
const DISCARDED = [
	"bash semicolon", "bash LF", "bash intervening git add", "bash background", "bash background followed by another command",
	"bash set -e after pipeline", "bash set +e disables errexit before pipeline", "bash command substitution",
	"bash question mark after an intervening command", "bash quoted question mark after an intervening command",
	"bash completed loop", "bash completed pipeline after a continued line", "PowerShell semicolon", "PowerShell LF",
	"PowerShell CRLF", "PowerShell LASTEXITCODE after Select-Object", "PowerShell LASTEXITCODE after case-insensitive Where-Object",
].map(DS);
const GIT_EXE = [
	"bash git.exe", "bash GIT.EXE", "bash Git.Exe", "bash path", "bash single-quoted path", "bash double-quoted path with option",
	"PowerShell git.exe", "PowerShell GIT.exe", "PowerShell call double-quoted path", "PowerShell call single-quoted path",
	"PowerShell expandable path", "PowerShell bare path",
].map(GS);
const GIT_ALL = [...GIT_EXE, GS("bash quoted bare"), GS("bash backtick substitution")];
// Build 2's continued pipelines (R-2351): a plain line break after the first pipe, and an escaped one anywhere.
const BASH_BREAK = ["bash pipeline continued after LF", "bash pipeline continued after CRLF", "bash pipeline continued after comment"].map(CS);
const BASH_ESCAPED = [
	"bash backslash-LF continuations", "bash backslash-CRLF continuation", "bash argument continued after backslash-LF",
	"bash pipe ampersand continued after backslash-LF",
].map(CS);
const PS_BREAK = ["PowerShell pipeline continued after LF", "PowerShell pipeline continued after CRLF"].map(CS);
const PS_ESCAPED = ["PowerShell backtick-LF continuation", "PowerShell backtick-CRLF continuation"].map(CS);
// Build 3's cases (R-2351): a line break after a later pipe (M2), a line break inside quotes (M1), the K2 and K5 quoted escapes.
const LATER_BREAK = [
	"bash three-stage pipeline continued after both pipes", "bash later pipeline stage continued after LF",
	"bash pipe ampersand and later stage continued after LF", "bash later pipeline stage continued after comment and CRLF",
	"PowerShell three-stage pipeline continued after both pipes", "PowerShell later pipeline stage continued after comment",
].map(CS);
const FIRST_BREAK_NEW = [
	"bash three-stage pipeline continued after both pipes", "bash pipe ampersand and later stage continued after LF",
	"PowerShell three-stage pipeline continued after both pipes",
].map(CS);
const QUOTED_BREAK_BASH = [
	"bash single-quoted multiline jq argument", "bash single-quoted multiline sed argument",
	"bash double-quoted multiline grep argument", "bash ANSI-C-quoted multiline grep argument",
].map(CS);
const QUOTED_BREAK_PS = [
	"PowerShell double-quoted multiline pattern", "PowerShell single-quoted multiline pattern",
	"PowerShell single-quoted multiline here-string pattern", "PowerShell double-quoted multiline here-string pattern",
].map(CS);
const BASH_QUOTED_ESCAPE = CS("bash backslash-LF inside double quotes");
const PS_QUOTED_ESCAPE = CS("PowerShell backtick-LF inside double quotes");
const ESCAPED_AMPERSAND = CS("bash escaped ampersand is a literal stage argument");
const COMMENT_BACKSLASH = CS("bash comment ends despite a line-final backslash");
const BRACED_STATUS = [CS("bash braced question mark"), CS("bash braced question mark inside double quotes")];
const WAITS = ["bash wait reads background pipeline status", "bash wait job reads background pipeline status", "bash assigned pid wait reads background pipeline status"].map(CS);
const NESTED_ERREXIT = ["bash errexit set inside brace group", "bash errexit set after then", "bash errexit set after do"].map(CS);
const LASTEXITCODE_NATIVE = [
	"PowerShell LASTEXITCODE after native command", "PowerShell LASTEXITCODE after native-looking alias",
	"PowerShell LASTEXITCODE after cmdlet then native command",
].map(CS);
const PIPE_AMPERSAND = [CS("bash pipe ampersand"), CS("bash pipe ampersand continued after backslash-LF"), CS("bash pipe ampersand and later stage continued after LF")];
const CONSUMED_BY_AND = [
	...[
		"bash && after redirected pipeline", "bash brace group", "bash redirected brace group", "bash subshell", "bash output assignment",
		"bash loop closer", "bash if closer", "bash case closer", "PowerShell &&", "PowerShell call operator in pipeline",
	].map(CS),
	...PIPE_AMPERSAND, ...BASH_BREAK, ...BASH_ESCAPED, ...PS_BREAK, ...PS_ESCAPED, ...LATER_BREAK.filter((t) => !PIPE_AMPERSAND.includes(t)),
	...QUOTED_BREAK_BASH, ...QUOTED_BREAK_PS, BASH_QUOTED_ESCAPE, PS_QUOTED_ESCAPE, ESCAPED_AMPERSAND, COMMENT_BACKSLASH,
];
const TABLE_ASKS = [
	"audit slip before commit", "git -C target commit", "git equals-valued global option", "env-prefixed commit",
	"commit in command substitution", "quoted command substitution remains executable", "pipe inside subshell",
	"pipefail enabled in background is inactive", "conditional pipefail enable is inactive",
	"pipefail enabled only in pipeline is not an exemption", "nested disable cancels pipefail exemption",
	"pipefail only in subshell is inactive", "PowerShell Bash syntax does not enable pipefail",
	"double-quoted backtick substitution pipeline", "double-quoted backtick substitution commit", "pipefail disabled later",
	"unquoted here-doc command substitution executes", "here-string does not hide following pipeline",
	"literal function body with pipeline and commit", "literal function keyword body with pipeline and commit", "PowerShell pipeline",
	"second pipeline status reaches commit",
].map(PT);

// Anchors and main's forms.
const MAIN_FINDER = String.raw`/\bgit\s+(?:(?:-[\w-]+(?:=[^\s;&|()]+)?)(?:\s+[^\s;&|()]+)?\s+)*commit\b/gi`;
const FINDER_OPEN = "function commitIndexes(live) {\n\tconst commits = [];";
const COMMIT_HEAD = String.raw`const COMMIT_COMMAND = /git(?:\.exe)?\s+`;
const NEIGHBOURS = "const COMMIT_LEFT_NEIGHBOURS = /[\\s;&|(){}\\\\/`]/u;";
const NEIGHBOUR_TEST = "if (at > 0 && !COMMIT_LEFT_NEIGHBOURS.test(live[at - 1])) continue;";
const READS = '\t\tif ((ch === "&" && live[i + 1] === "&") || (ch === "|" && live[i + 1] === "|")) return i;';
const BACKGROUND = 'if (dialect !== "powershell" && ch === "&" && !REDIRECTION_NEIGHBOURS.has(live[i - 1]) && !REDIRECTION_NEIGHBOURS.has(live[i + 1])) {';
const READER_WORDS = 'const BASH_STATUS_READER_WORDS = new Set(["then", "do"]);';
const CLOSER_WORDS = 'const BASH_STATUS_CLOSER_WORDS = new Set(["fi", "done", "esac"]);';
const QUOTED_STATUS = `if (quote === '"' && ch === "$" && BASH_STATUS_EXPANSION.test(source.slice(i))) {`;
const BASH_READER = 'if (dialect !== "powershell" && ch === "$" && BASH_STATUS_EXPANSION.test(live.slice(i))) return true;';
const PS_READER = 'if (dialect === "powershell" && ch === "$" && BASH_STATUS_EXPANSION.test(live.slice(i))) return true;';
const STATUS_EXPANSION = String.raw`const BASH_STATUS_EXPANSION = /^(?:\$\?|\$\{\?\})/u;`;
const CMDLET_NAME = String.raw`const POWERSHELL_CMDLET_NAME = /^[a-z]+-[a-z][\w]*$/iu;`;
const READER_START_SKIP = "while (start < live.length && isWhitespace(live[start])) start++;";
const BASH_ESCAPE = String.raw`escapedLineBreakEnd(source, i, "\\")`;
const PS_ESCAPE = 'escapedLineBreakEnd(source, i, "`")';
const WAIT_NOW = String.raw`const BASH_BACKGROUND_WAIT = /(?:^|[;&\r\n])\s*wait\b/iu;`;
const WAIT_BUILD2 = String.raw`const BASH_BACKGROUND_WAIT = /^\s*wait(?:\s+--)?\s+(?:\$!|\$\{!\})(?=\s|[;&|]|$)/iu;`;
const ERREXIT_PREFIX = String.raw`(?:^|[;&{}\r\n]|\b(?:then|do)\b|(\$?\())\s*set`;
const COMMENT_END = '\t\tif (comment) {\n\t\t\tif (ch === "\\n") { comment = false;';
const COMMENT_BUILD2 = `\t\tif (comment) {\n\t\t\tconst continued = ${BASH_ESCAPE};\n\t\t\tif (continued >= 0) {\n\t\t\t\tconst width = continued - i;\n\t\t\t\ttext += " ".repeat(width);\n\t\t\t\tline += " ".repeat(width);\n\t\t\t\ti = continued - 1;\n\t\t\t} else if (ch === "\\n") { comment = false;`;
const QUOTED_TEXT = '\t\t\ttext += " ";\n\t\t\tline += ch;\n\t\t\tcontinue;';
const LATER_PIPE_SKIP = "\t\tif (isWhitespace(ch)) {\n\t\t\tif (awaitingPipelineCommand) continue;\n\t\t} else awaitingPipelineCommand = false;";
const LATER_PIPE_AMPERSAND = '\t\t\tawaitingPipelineCommand = true;\n\t\t\tif (live[i + 1] === "&") i++;';
const BACKSLASH_ESCAPE = String.raw`if (ch === "\\" && i + 1 < source.length) {`;
const QUOTE_OPEN = `if (ch === "'" || ch === '"') {`;
const QUOTE_OPEN_BUILD2 = String.raw`if ((ch === "'" || ch === '"') && source[i - 1] !== "\\") {`;
const GUARD_NOW = "only when a masked pipeline's exit status can reach the commit without earlier active `pipefail`; a `;` or a newline that discards it does not prompt, and `git.exe` and path spellings count as git";
const GUARD_MAIN = "that pipelines output before `git commit` without earlier active `pipefail`";

const DECLARED = [
	"(build 5, e5b0483e) E5 to E7 are re-anchored on build 5's errexit prefix, which moves ( and $( into their own group; E8 and Q3 pin build 5's two fixes: a subshell's set +e does not reach the outer command, and an even run of backslashes before a double quote closes it",
	"(build 4, c2d0dcb4) K2 and K5 are removed: build 4 deleted the two quoted-continuation branches they broke (dead since build 3). E5 and E6 are re-anchored on build 4's errexit prefix, which adds (. E7, B2 and B3 pin build 4's fixes: errexit after (, the escape rule that keeps an escaped letter visible (B3), and the raw line that keeps the backslash, which is what finds a backslash heredoc delimiter (B2 puts build 3's whole rule back)",
	"(build 3, ad08d901) every pair runs on macOS with no pwsh: the span oracle and hooks-win32-exec skip here, so no pair names their checks. install-check.test.mjs picks hook calls by the hook script's file name (build 2), so it passes from the lane worktree and from the runner's scratch worktrees",
	"(closed by build 3) of build 2's seven survivors, X6 and S24 now each name a new R-2351 case and are expected red; K3's site is gone (build 3 removed the comment continuation), so K3 now puts build 2's comment form back and names the new `bash comment ends despite a line-final backslash` case. K2, K5 and K8 each got the case the build-2 record asked for, but each is now an equivalent mutant on build 3 (declared in (b)); C1 still turns red only on the Windows live install check. Build 3 moved the anchors of S1 (the reader takes the bracket map), S11 (the reader now skips a lone closer) and S19 (the wait match); each is re-anchored on ad08d901 with the same wrong form. K1 and K4 keep their sites, but build 3's bash escape rule and its always-space `hidden` make an escaped LF a space without them: K4 now names only its CRLF case and K1 now survives (declared in (b)). New pairs: Q1 and Q2 (M1, a quoted line break per dialect), K9 (M2, a line break after a later pipe), K10 (a later `|&`), S25 (`wait %N` and `wait $var`), E5 and E6 (errexit set inside braces, after then or do), B1 (the escaped `\\&`)",
	"(a) names only must-meet titles (R-2350 to R-2357) in expectRed; older rows' checks that a pair also turns red are declared as alsoRed. A shorter title that begins a longer one (`bash background`, `bash pipe ampersand`, `bash braced question mark`) is named together with the longer one. S4 runs pipe-guard.test.mjs alone: verifier-pipe.test.mjs's first check parses the hook's stdout, so a hook that stops asking throws there and the rest of that file never runs",
	"(b) expected survivors: K1 is a test gap (build 3's escape rule writes a backslash-LF as the same two spaces, and the only backslash-CRLF case sits straight after a pipe, where the reader's start skip passes the LF the mutant leaves; seat probe: the mutant returns null on `npm test | tail -n \\⏎(CRLF) 20 && git commit -m x`, which ad08d901, 99ffeb73 and main ask on, though real bash agrees with the mutant there, since a backslash before CR escapes the CR and the LF ends the command); K2 and K5 are equivalent on build 3 (M1 turns every quoted line break into a space, so the quoted backslash-newline and backtick-newline branches write the same spaces the plain quoted-character path writes; each branch could be deleted); K8 is equivalent on honest input (build 3's reader continues over every later stage, so a pipeline start pipelineStarts adds after a continued line rescans a suffix the first start's scan already covers); K10 is a test gap (no case has a `|&` after a later stage; seat probe: the mutant returns null on `npm test | grep x |& tail -5 && git commit -m x`, which ad08d901 and main ask on and 99ffeb73 let through); C1 (the PowerShell sample is sent only on Windows; install-check.test.mjs's stub reads the same name)",
	"(c) the comment-then-newline rule has no site of its own: comments are blanked to spaces, so the reader's start skip (K6) and its later-pipe skip (K9) carry it with the plain line break. K7 is its obvious wrong form for the first pipe, skipping only a line break straight after it. The older R-1062 case `PS: a comment after a pipe hides a ) that would close early` puts a comment after a first pipe, and K6 and K7 turn it red (declared alsoRed)",
	"(d) no pair: the linear bracket scan (bracketClosers' early -1 on an unclosed opener and the PowerShell scan's lastParenClose guard) returns what the quadratic scan returned and no check times it; a `&&` or `||` that opens the command after a separator (bash rejects that input as a syntax error); `commits[0]` in place of the last commit (same site as S17); exposures for nested PowerShell strings (the `report` guard; seat probe on build 2: no check turns red); the `$LASTEXITCODE` pattern's letter case and the `&` call-operator skip in powershellPipelineEndsInCmdlet (no case uses them); the setup README hooks-table sentence (no check reads it); nana-gate.ts and liveText's masking (unchanged by this lane: brief wrong codes 15 and 16); every test, REQUIREMENTS, map and tree edit",
	"(e) seat probe outside the pairs, a fail-open build 3 added against main: B1's site (the bash backslash escape) writes `\\E` of a `<<\\EOF` heredoc delimiter into the line as spaces, so the heredoc marker is no longer found and the quoted body is scanned as live text. `cat <<\\EOF⏎don't⏎EOF⏎npm test | tail -5 && git commit -m x` asks on main and 99ffeb73 and returns null on ad08d901 (the body's `'` opens a quote that swallows the rest); `cat <<\\EOF⏎npm test | tail && git commit⏎EOF⏎git commit -m x` is null on main and asks on ad08d901. No case has a backslash heredoc delimiter, so B1 cannot name it",
];

const PAIRS = [
	// commit finder
	{ n: "F1", name: "main's finder: \\bgit then commit over the live text", edits: [
		one(PG, FINDER_OPEN, `function commitIndexes(live) {\n\treturn [...live.matchAll(${MAIN_FINDER})].map((m) => m.index ?? 0);\n\tconst commits = [];`),
	], tests: [T, VP], expectRed: [...GIT_EXE, NC("my-git"), R2355] },
	{ n: "F2", name: "(10) no .exe in the finder", edits: [
		one(PG, COMMIT_HEAD, String.raw`const COMMIT_COMMAND = /git\s+`),
	], tests: [T, VP], expectRed: [...GIT_EXE, R2355] },
	{ n: "F3", name: "(10) a case-sensitive finder", edits: [
		one(PG, String.raw`commit\b/iyu;`, String.raw`commit\b/yu;`),
	], tests: [T], expectRed: [GS("bash GIT.EXE"), GS("bash Git.Exe"), GS("PowerShell GIT.exe")] },
	{ n: "F4", name: "(11) no backtick left neighbour", edits: [
		one(PG, NEIGHBOURS, "const COMMIT_LEFT_NEIGHBOURS = /[\\s;&|(){}\\\\/]/u;"),
	], tests: [T], expectRed: [GS("bash backtick substitution")] },
	{ n: "F5", name: "no / or \\ left neighbour", edits: [
		one(PG, NEIGHBOURS, "const COMMIT_LEFT_NEIGHBOURS = /[\\s;&|(){}`]/u;"),
	], tests: [T], expectRed: [GS("bash path"), GS("PowerShell bare path")] },
	{ n: "F6", name: "(13) a \\bgit boundary", edits: [
		one(PG, NEIGHBOUR_TEST, "if (at > 0 && /\\w/u.test(live[at - 1])) continue;"),
	], tests: [T], expectRed: [NC("my-git")] },
	{ n: "F7", name: "no left-neighbour check at all", edits: [
		one(PG, NEIGHBOUR_TEST, "void COMMIT_LEFT_NEIGHBOURS;"),
	], tests: [T], expectRed: [NC("legit"), NC("my-git")] },
	{ n: "F8", name: "(13) a git\\S* finder", edits: [
		one(PG, COMMIT_HEAD, String.raw`const COMMIT_COMMAND = /git\S*\s+`),
	], tests: [T], expectRed: [NC("git-lfs")] },
	{ n: "F9", name: "any git subcommand counts as a commit", edits: [
		one(PG, String.raw`*commit\b/iyu;`, String.raw`*\w+\b/iyu;`),
	], tests: [T], expectRed: [NC("bash git.exe status"), NC("PowerShell git.exe status")] },
	{ n: "F10", name: "the word commit alone counts, with no git before it", edits: [
		one(PG, FINDER_OPEN, "function commitIndexes(live) {\n\treturn [...live.matchAll(/\\bcommit\\b/giu)].map((m) => m.index ?? 0);\n\tconst commits = [];"),
	], tests: [T], expectRed: [NC("legit"), NC("my-git"), NC("echo"), NC("git-lfs"), NC("quoted git status argument"), NC("quoted git path glued to other text")] },

	// live-text exposures
	{ n: "X1", name: "(12) bash shows no quoted git word", edits: [
		one(PG, "if (exposure) text += ` ${exposure} `;", "void exposure;"),
	], tests: [T], expectRed: [GS("bash quoted bare"), GS("bash single-quoted path"), GS("bash double-quoted path with option")] },
	{ n: "X2", name: "(12) PowerShell shows no quoted git word", edits: [
		one(PG, "if (exposure) live += ` ${exposure} `;", "void exposure;"),
	], tests: [T], expectRed: [GS("PowerShell call double-quoted path"), GS("PowerShell call single-quoted path"), GS("PowerShell expandable path")] },
	{ n: "X3", name: "(12) the exposure is refused on any $", edits: [
		one(PG, 'if (content.includes("$(") ||', 'if (content.includes("$") ||'),
	], tests: [T], expectRed: [GS("PowerShell expandable path")] },
	{ n: "X4", name: "(7) a double-quoted bash $? stays masked", edits: [
		one(PG, QUOTED_STATUS, "if (false) {"),
	], tests: [T], expectRed: [CS("bash quoted question mark"), CS("bash braced question mark inside double quotes")] },
	{ n: "X5", name: "a quoted git path glued to other text is exposed too", edits: [
		one(PG, "const exposure = isQuotedWord(source, quoteStart, i + 1) ? quotedGitExposure", "const exposure = true ? quotedGitExposure"),
	], tests: [T], expectRed: [NC("quoted git path glued to other text")] },
	{ n: "X6", name: "a double-quoted bash ${?} stays masked (build 1's $?-only exposure)", edits: [
		one(PG, QUOTED_STATUS, `if (quote === '"' && ch === "$" && source[i + 1] === "?") {`),
	], tests: [T], expectRed: [CS("bash braced question mark inside double quotes")] },

	// status reader
	{ n: "S1", name: "(1) today's rule: any live pipe before the last commit asks", edits: [
		one(PG, "const read = statusReadAfterPipeline(live, pipe, dialect, errexitStates[i] ?? false, closers);", "const read = pipe; void closers;"),
	], tests: [T, VP], expectRed: [...DISCARDED, R2357, R2355] },
	{ n: "S2", name: "(2) a $? anywhere later reads the status", edits: [
		one(PG, "return nextCommandReadsStatus(live, next, dialect, powershellNativeStatus) ? next : -1;", 'return live.includes("$?", next) ? next : -1;'),
	], tests: [T], expectRed: [DS("bash question mark after an intervening command"), DS("bash quoted question mark after an intervening command"), ...BRACED_STATUS, ...LASTEXITCODE_NATIVE] },
	{ n: "S3", name: "(3) || does not read the status", edits: [
		one(PG, READS, '\t\tif (ch === "&" && live[i + 1] === "&") return i;'),
	], tests: [T], expectRed: [CS("bash ||"), CS("PowerShell ||")] },
	{ n: "S4", name: "&& does not read the status", edits: [
		one(PG, READS, '\t\tif (ch === "|" && live[i + 1] === "|") return i;'),
	], tests: [T], expectRed: [...CONSUMED_BY_AND, ...GIT_ALL, ...TABLE_ASKS], alsoRed: [R1062_PS, ...R983_GATE] },
	{ n: "S5", name: "(4) then does not read the status", edits: [
		one(PG, READER_WORDS, 'const BASH_STATUS_READER_WORDS = new Set(["do"]);'),
	], tests: [T], expectRed: [CS("bash if then")] },
	{ n: "S6", name: "(4) do does not read the status", edits: [
		one(PG, READER_WORDS, 'const BASH_STATUS_READER_WORDS = new Set(["then"]);'),
	], tests: [T], expectRed: [CS("bash while do"), CS("bash until do")] },
	{ n: "S7", name: "(8) a closer after a separator ends the scan as discarded", edits: [
		one(PG, 'if (BRACKET_CLOSERS.has(live[next]) || (dialect !== "powershell" && BASH_STATUS_CLOSER_WORDS.has(word))) {', "if (false) {"),
	], tests: [T], expectRed: [CS("bash brace group"), CS("bash redirected brace group"), CS("bash loop closer"), CS("bash if closer"), CS("bash case closer")] },
	{ n: "S8", name: "(8) fi is not passed over", edits: [
		one(PG, CLOSER_WORDS, 'const BASH_STATUS_CLOSER_WORDS = new Set(["done", "esac"]);'),
	], tests: [T], expectRed: [CS("bash if closer")] },
	{ n: "S9", name: "(8) done is not passed over", edits: [
		one(PG, CLOSER_WORDS, 'const BASH_STATUS_CLOSER_WORDS = new Set(["fi", "esac"]);'),
	], tests: [T], expectRed: [CS("bash loop closer")] },
	{ n: "S10", name: "esac is not passed over", edits: [
		one(PG, CLOSER_WORDS, 'const BASH_STATUS_CLOSER_WORDS = new Set(["fi", "done"]);'),
	], tests: [T], expectRed: [CS("bash case closer")] },
	{ n: "S11", name: "an unmatched ) or } ends the scan as discarded", edits: [
		one(PG, "\t\tif (BRACKET_CLOSERS.has(ch)) continue;", "\t\tif (BRACKET_CLOSERS.has(ch)) return -1;"),
	], tests: [T], expectRed: [CS("bash subshell"), CS("bash output assignment"), PT("pipe inside subshell"), PT("nested disable cancels pipefail exemption")] },
	{ n: "S12", name: "(9) 2>&1 is read as background", edits: [
		one(PG, BACKGROUND, 'if (dialect !== "powershell" && ch === "&") {'),
	], tests: [T], expectRed: [CS("bash redirected brace group")] },
	{ n: "S13", name: "(9) |& is read as background", edits: [
		one(PG, 'let start = pipe + (live[pipe + 1] === "&" ? 2 : 1);', "let start = pipe + 1;"),
	], tests: [T], expectRed: PIPE_AMPERSAND },
	{ n: "S14", name: "a bash background & does not end the pipeline", edits: [
		one(PG, BACKGROUND, "if (false) {"),
	], tests: [T], expectRed: [DS("bash background followed by another command"), WAITS[2]] },
	{ n: "S15", name: "a PowerShell & ends the pipeline as in bash", edits: [
		one(PG, 'if (dialect !== "powershell" && ch === "&" && !REDIRECTION', 'if (ch === "&" && !REDIRECTION'),
	], tests: [T], expectRed: [CS("PowerShell call operator in pipeline")] },
	{ n: "S16", name: "(6) no $? reader in the next command, in either dialect", edits: [
		one(PG, BASH_READER, "if (false) return true;"),
		one(PG, PS_READER, "if (false) return true;"),
	], tests: [T], expectRed: [CS("bash question mark in if"), CS("bash quoted question mark"), CS("bash question mark assignment"), ...BRACED_STATUS, CS("PowerShell question mark")] },
	{ n: "S17", name: "a status read asks even when no commit follows it", edits: [
		one(PG, "if (read >= 0 && commits[commits.length - 1] > read) {", "if (read >= 0) {"),
	], tests: [T], expectRed: [PT("status read after last commit")] },
	{ n: "S18", name: "${?} is not a status spelling (build 1's $? only)", edits: [
		one(PG, STATUS_EXPANSION, String.raw`const BASH_STATUS_EXPANSION = /^\$\?/u;`),
	], tests: [T], expectRed: BRACED_STATUS },
	{ n: "S19", name: "bash wait after a background pipeline does not read its status", edits: [
		one(PG, "return wait ? i + 1 + (wait.index ?? 0) : -1;", "return -1;"),
	], tests: [T], expectRed: WAITS },
	{ n: "S20", name: "PowerShell $LASTEXITCODE never reads the status (the plan's rule)", edits: [
		one(PG, 'if (dialect === "powershell" && powershellNativeStatus && POWERSHELL_LAST_EXIT_CODE.test(live.slice(i))) return true;', "if (false) return true;"),
	], tests: [T], expectRed: LASTEXITCODE_NATIVE },
	{ n: "S21", name: "PowerShell $LASTEXITCODE reads the status even after a cmdlet (no cmdlet rule)", edits: [
		one(PG, 'const powershellNativeStatus = dialect === "powershell" && !powershellPipelineEndsInCmdlet(live, pipe, i);', 'const powershellNativeStatus = dialect === "powershell";'),
	], tests: [T], expectRed: [DS("PowerShell LASTEXITCODE after Select-Object"), DS("PowerShell LASTEXITCODE after case-insensitive Where-Object")] },
	{ n: "S22", name: "the Verb-Noun cmdlet test is letter-case sensitive", edits: [
		one(PG, CMDLET_NAME, String.raw`const POWERSHELL_CMDLET_NAME = /^[A-Z][a-z]*-[A-Z][\w]*$/u;`),
	], tests: [T], expectRed: [DS("PowerShell LASTEXITCODE after case-insensitive Where-Object")] },
	{ n: "S23", name: "any command name counts as a cmdlet (no Verb-Noun test)", edits: [
		one(PG, CMDLET_NAME, String.raw`const POWERSHELL_CMDLET_NAME = /^[a-z][\w-]*$/iu;`),
	], tests: [T], expectRed: LASTEXITCODE_NATIVE },
	{ n: "S24", name: "the cmdlet rule judges the pipeline's first stage after the pipe, not its last", edits: [
		one(PG, 'if (live[i] === "|" && live[i - 1] !== "|" && live[i + 1] !== "|") {', "if (false) {"),
	], tests: [T], expectRed: [CS("PowerShell LASTEXITCODE after cmdlet then native command")] },
	{ n: "S25", name: "only wait $! or ${!} straight after the & reads the status (build 2's wait pattern)", edits: [
		one(PG, WAIT_NOW, WAIT_BUILD2),
	], tests: [T], expectRed: [WAITS[1], WAITS[2]] },

	// line-break continuations and the comment rule
	{ n: "K1", name: "a bash backslash-newline outside quotes is not whitespace (build 1's form)", edits: [
		one(PG, `\n\t\tconst continued = ${BASH_ESCAPE};`, "\n\t\tconst continued = -1;"),
	], tests: [T], expectRed: [] },
	{ n: "K3", name: "a backslash-newline continues a bash comment (build 2's comment form)", edits: [
		one(PG, COMMENT_END, COMMENT_BUILD2),
	], tests: [T], expectRed: [COMMENT_BACKSLASH] },
	{ n: "K4", name: "a PowerShell backtick-newline outside strings is not whitespace (build 1's form)", edits: [
		one(PG, "if (ch === \"`\") {\n\t\t\tconst continued = " + PS_ESCAPE + ";", "if (ch === \"`\") {\n\t\t\tconst continued = -1;"),
	], tests: [T], expectRed: [CS("PowerShell backtick-CRLF continuation")] },
	{ n: "K6", name: "a line break straight after the first pipe ends the pipeline (no start skip in the reader)", edits: [
		one(PG, READER_START_SKIP, "void isWhitespace;"),
	], tests: [T], expectRed: [...BASH_BREAK, ...PS_BREAK, ...FIRST_BREAK_NEW], alsoRed: [R1062_COMMENT_PIPE] },
	{ n: "K7", name: "only a line break straight after the first pipe continues it (a comment before the break does not)", edits: [
		one(PG, READER_START_SKIP, String.raw`if (live[start] === "\n") start++; else if (live[start] === "\r" && live[start + 1] === "\n") start += 2;`),
	], tests: [T], expectRed: [CS("bash pipeline continued after comment")], alsoRed: [R1062_COMMENT_PIPE] },
	{ n: "K8", name: "pipelineStarts ends an open pipeline at a line break (no continuation)", edits: [
		one(PG, String.raw`if ((ch === "\n" || ch === "\r") && expectingCommand) continue;`, "void expectingCommand;"),
	], tests: [T], expectRed: [] },
	{ n: "K9", name: "(M2) a line break after a later pipe ends the pipeline (build 2's form)", edits: [
		one(PG, LATER_PIPE_SKIP, "\t\tvoid awaitingPipelineCommand;"),
	], tests: [T], expectRed: LATER_BREAK },
	{ n: "K10", name: "a later |& is read as a background & (no skip of its &)", edits: [
		one(PG, LATER_PIPE_AMPERSAND, "\t\t\tawaitingPipelineCommand = true;"),
	], tests: [T], expectRed: [] },

	// build 3's quoted line breaks and the bash escape
	{ n: "Q1", name: "(M1) a line break inside bash quotes stays a separator (build 2's form)", edits: [
		one(PG, QUOTED_TEXT, '\t\t\ttext += ch === "\\n" ? "\\n" : " ";\n\t\t\tline += ch;\n\t\t\tcontinue;'),
	], tests: [T], expectRed: QUOTED_BREAK_BASH },
	{ n: "Q2", name: "(M1) a line break inside PowerShell strings and here-strings stays a separator (build 2's hidden)", edits: [
		one(PG, 'const hidden = () => " ";', 'const hidden = (ch) => ch === "\\n" || ch === "\\r" ? ch : " ";'),
	], tests: [T], expectRed: QUOTED_BREAK_PS },
	{ n: "B1", name: "a bash backslash does not escape the next character, so \\& is a background & (build 2's form)", edits: [
		one(PG, BACKSLASH_ESCAPE, "if (false) {"),
		one(PG, QUOTE_OPEN, QUOTE_OPEN_BUILD2),
	], tests: [T], expectRed: [ESCAPED_AMPERSAND] },

	// pipeline starts
	{ n: "P1", name: "only the command's first pipeline is scanned", edits: [
		one(PG, "\t\t\tif (!pipelineOpen) starts.push(i);", "\t\t\tif (starts.length === 0) starts.push(i);"),
	], tests: [T], expectRed: [PT("second pipeline status reaches commit")] },
	{ n: "P2", name: "|| is read as a pipe", edits: [
		one(PG, 'if (ch === "|" && live[i - 1] !== "|" && live[i + 1] !== "|") {\n\t\t\tif (!pipelineOpen)', 'if (ch === "|") {\n\t\t\tif (!pipelineOpen)'),
	], tests: [T], expectRed: [PT("logical OR is not a pipeline before &&")] },

	// errexit and the pipefail exemption
	{ n: "E1", name: "(5) no errexit reader", edits: [
		one(PG, 'if (dialect !== "powershell" && errexitActive) return pipe;', "if (false) return pipe;"),
	], tests: [T], expectRed: [CS("bash set -e"), CS("bash set -o errexit"), ...NESTED_ERREXIT] },
	{ n: "E2", name: "set -o errexit is not an errexit spelling", edits: [
		one(PG, String.raw`|([+-])o\s+errexit)\b/giu;`, String.raw`)\b/giu;`),
	], tests: [T], expectRed: [CS("bash set -o errexit")] },
	{ n: "E3", name: "errexit set after the pipe counts", edits: [
		one(PG, "changes[change].end <= cursor + 1", "true"),
	], tests: [T], expectRed: [DS("bash set -e after pipeline")] },
	{ n: "E4", name: "set +e does not turn errexit off", edits: [
		one(PG, 'active = changes[change].sign === "-";', 'if (changes[change].sign === "-") active = true;'),
	], tests: [T], expectRed: [DS("bash set +e disables errexit before pipeline")] },
	{ n: "E5", name: "errexit set right after { does not count (build 2's prefix without braces)", edits: [
		one(PG, ERREXIT_PREFIX, String.raw`(?:^|[;&\r\n]|\b(?:then|do)\b|(\$?\())\s*set`),
	], tests: [T], expectRed: [NESTED_ERREXIT[0]] },
	{ n: "E6", name: "errexit set right after then or do does not count (build 2's prefix without the words)", edits: [
		one(PG, ERREXIT_PREFIX, String.raw`(?:^|[;&{}\r\n]|(\$?\())\s*set`),
	], tests: [T], expectRed: [NESTED_ERREXIT[1], NESTED_ERREXIT[2]] },
	{ n: "E7", name: "errexit set right after ( does not count (build 3's prefix)", edits: [
		one(PG, ERREXIT_PREFIX, String.raw`(?:^|[;&{}\r\n]|\b(?:then|do)\b|(\$?\((?!)))\s*set`),
	], tests: [T], expectRed: [CS("bash errexit set inside subshell")] },
	{ n: "E8", name: "set +e or +o errexit inside a subshell turns errexit off for the outer command (build 4's form; build 6: no scope restore at the closer)", edits: [
		one(PG, "active = scopes.pop().active;", "scopes.pop();"),
	], tests: [T], expectRed: ["bash outer errexit survives set +e inside a subshell", "bash outer errexit survives set +e inside command substitution", "bash outer errexit survives set +o errexit inside a subshell", "bash outer errexit survives a later set +e inside a subshell", "bash outer errexit survives a later set +e inside a command substitution", "bash outer errexit survives a later set +o errexit inside a subshell"].map(CS) },
	// build 6 (9f155fd2): round 1's land reviewer MUSTs
	{ n: "E9", name: "(round 1 MUST 1) an unquoted bash backtick substitution is not a scope (build 5's text)", edits: [
		one(PG, "if (ch === \"`\") {\n\t\t\tlet end = i + 1;", "if (false) {\n\t\t\tlet end = i + 1;"),
	], tests: [T], expectRed: [] },
	{ n: "X20", name: "(round 1 MUST 2) a status read in a PowerShell double-quoted string is blanked (build 5's form)", edits: [
		one(PG, "\t\t\t\tlive += status;\n\t\t\t\ti += status.length;\n\t\t\t\tcontinue;", "\t\t\t\tlive += \" \".repeat(status.length);\n\t\t\t\ti += status.length;\n\t\t\t\tcontinue;"),
	], tests: [T], expectRed: [CS("PowerShell double-quoted question mark")] },
	{ n: "X21", name: "(round 1 MUST 2) a status read in a PowerShell expandable here-string is blanked", edits: [
		one(PG, "\t\t\t\tlive += status;\n\t\t\t\ti += status.length;\n\t\t\t\tlineStart = false;", "\t\t\t\tlive += \" \".repeat(status.length);\n\t\t\t\ti += status.length;\n\t\t\t\tlineStart = false;"),
	], tests: [T], expectRed: [CS("PowerShell question mark in an expandable here-string")] },
	{ n: "X22", name: "a status read in a PowerShell single-quoted string is live too (no double-quote test)", edits: [
		one(PG, "i = nested.end;\n\t\t\tcontinue;\n\t\t}\n\t\tif (kind === \"double\" && ch === \"$\") {", "i = nested.end;\n\t\t\tcontinue;\n\t\t}\n\t\tif (ch === \"$\") {"),
	], tests: [T], expectRed: [DS("PowerShell single-quoted question mark stays literal")] },
	{ n: "X23", name: "a backtick in a PowerShell expandable here-string escapes nothing (build 5's here-string)", edits: [
		one(PG, "if (kind === \"double\" && ch === \"`\" && i + 1 < source.length) {", "if (false) {"),
	], tests: [T], expectRed: [] },
	{ n: "S26", name: "PowerShell ${?} is not a status spelling (build 5's reader)", edits: [
		one(PG, 'if (dialect === "powershell" && ch === "$" && BASH_STATUS_EXPANSION.test(live.slice(i))) return true;', 'if (dialect === "powershell" && ch === "$" && live[i + 1] === "?") return true;'),
	], tests: [T], expectRed: [] },
	{ n: "Q3", name: "a double quote closes unless the one character before it is a backslash (builds 3 and 4)", edits: [
		one(PG, `if (ch === quote && (quote !== '"' || !escapedByOddBackslashes(source, i))) {`, `if (ch === quote && (quote !== '"' || source[i - 1] !== "\\\\")) {`),
	], tests: [T], expectRed: [CS("bash even backslashes close double quotes")] },
	{ n: "B2", name: "build 3's escape rule: an unquoted backslash blanks itself and any next character in both the scanned text and the raw line", edits: [
		one(PG, 'text += " ";\n\t\t\tline += ch;\n\t\t\tif (BASH_ESCAPED_HIDDEN.test(source[i + 1])) {\n\t\t\t\ttext += " ";\n\t\t\t\tline += source[i + 1];', 'text += " ";\n\t\t\tline += " ";\n\t\t\tif (true) {\n\t\t\t\ttext += " ";\n\t\t\t\tline += " ";'),
	], tests: [T], expectRed: [CS("bash escaped letter in git"), CS("bash backslash-quoted heredoc body is hidden"), DS("bash backslash-quoted heredoc body is inactive")] },
	{ n: "B3", name: "an escaped letter is hidden in the scanned text (the raw line keeps it)", edits: [
		one(PG, "if (BASH_ESCAPED_HIDDEN.test(source[i + 1])) {", "if (true) {"),
	], tests: [T], expectRed: [CS("bash escaped letter in git")] },
	{ n: "V1", name: "(14) no leading pipefail exemption", edits: [
		one(PG, "if (initialPipefail) return null;", "void initialPipefail;"),
	], tests: [T, VP], expectRed: [PT("pipefail enabled as the exact first command"), PT("combined pipefail enabled first"), PT("set eo pipefail first")], alsoRed: [R1054_BASH] },

	// README guard lines
	{ n: "D1", name: "the pack README guard line keeps main's wording", edits: [
		one(PACK_README, GUARD_NOW, GUARD_MAIN),
	], tests: [VP], expectRed: [R2356] },
	{ n: "D2", name: "the setup README guard line keeps main's wording", edits: [
		one(SETUP_README, GUARD_NOW, GUARD_MAIN),
	], tests: [VP], expectRed: [R2356] },
	{ n: "D3", name: "the pack README guard line drops the sandbox boundary (the R-2354 README check no site pair reaches)", edits: [
		one(PACK_README, "reached through a later call is not matched; the sandbox is the boundary", "reached through a later call is not matched"),
	], tests: [VP], expectRed: [R2354_README] },

	// install check's sealed PowerShell sample
	{ n: "C1", name: "the install check's PowerShell sample keeps main's ; form", edits: [
		one(IC_CONFIG, 'powershellHit: "npm test | Select-Object -Last 5 && git commit -m x",', 'powershellHit: "npm test | Select-Object -Last 5; git commit -m x",'),
	], tests: [IC], expectRed: [] },
];

process.exitCode = await runMutations({ lane: "verifier-pipe-commit-match", self: import.meta.url, tip: "9f155fd2", declared: DECLARED, pairs: PAIRS });
