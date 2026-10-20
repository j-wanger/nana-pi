#!/usr/bin/env node
// Seat wrong-code pairs for lane verifier-pipe-commit-match (hook and gate lane), written by the seat 2026-10-20 after
// build 1 and extended after build 2, on the shared runner. Each pair puts one product site the lane changed into its
// wrong form: main's behaviour or the obvious wrong implementation. F pairs break the commit finder, X pairs the live-text
// exposures, S pairs the status reader, K pairs build 2's line-break continuations, P pairs the pipeline starts, E pairs
// the errexit reader, V the pipefail exemption, D the README guard lines and C the install check's PowerShell sample
// (build brief wrong-code numbers in each name where one applies). Run from the worktree root:
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
	"bash completed loop", "PowerShell semicolon", "PowerShell LF", "PowerShell CRLF",
	"PowerShell LASTEXITCODE after Select-Object", "PowerShell LASTEXITCODE after case-insensitive Where-Object",
].map(DS);
const GIT_EXE = [
	"bash git.exe", "bash GIT.EXE", "bash Git.Exe", "bash path", "bash single-quoted path", "bash double-quoted path with option",
	"PowerShell git.exe", "PowerShell GIT.exe", "PowerShell call double-quoted path", "PowerShell call single-quoted path",
	"PowerShell expandable path", "PowerShell bare path",
].map(GS);
const GIT_ALL = [...GIT_EXE, GS("bash quoted bare"), GS("bash backtick substitution")];
// Build 2's continued pipelines (R-2351): a plain line break after the pipe, and an escaped one anywhere.
const BASH_BREAK = ["bash pipeline continued after LF", "bash pipeline continued after CRLF", "bash pipeline continued after comment"].map(CS);
const BASH_ESCAPED = [
	"bash backslash-LF continuations", "bash backslash-CRLF continuation", "bash argument continued after backslash-LF",
	"bash pipe ampersand continued after backslash-LF",
].map(CS);
const PS_BREAK = ["PowerShell pipeline continued after LF", "PowerShell pipeline continued after CRLF"].map(CS);
const PS_ESCAPED = ["PowerShell backtick-LF continuation", "PowerShell backtick-CRLF continuation"].map(CS);
const LASTEXITCODE_NATIVE = ["PowerShell LASTEXITCODE after native command", "PowerShell LASTEXITCODE after native-looking alias"].map(CS);
const CONSUMED_BY_AND = [
	...[
		"bash && after redirected pipeline", "bash brace group", "bash redirected brace group", "bash subshell", "bash output assignment",
		"bash pipe ampersand", "bash loop closer", "bash if closer", "bash case closer", "PowerShell &&", "PowerShell call operator in pipeline",
	].map(CS),
	...BASH_BREAK, ...BASH_ESCAPED, ...PS_BREAK, ...PS_ESCAPED,
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
const PS_READER = 'if (dialect === "powershell" && ch === "$" && live[i + 1] === "?") return true;';
const STATUS_EXPANSION = String.raw`const BASH_STATUS_EXPANSION = /^(?:\$\?|\$\{\?\})/u;`;
const CMDLET_NAME = String.raw`const POWERSHELL_CMDLET_NAME = /^[a-z]+-[a-z][\w]*$/iu;`;
const READER_START_SKIP = "while (start < live.length && isWhitespace(live[start])) start++;";
const BASH_ESCAPE = String.raw`escapedLineBreakEnd(source, i, "\\")`;
const PS_ESCAPE = 'escapedLineBreakEnd(source, i, "`")';
const GUARD_NOW = "only when a masked pipeline's exit status can reach the commit without earlier active `pipefail`; a `;` or a newline that discards it does not prompt, and `git.exe` and path spellings count as git";
const GUARD_MAIN = "that pipelines output before `git commit` without earlier active `pipefail`";

const DECLARED = [
	"(build 2, 99ffeb73) every pair runs on macOS with no pwsh: the span oracle and hooks-win32-exec skip here, so no pair names their checks. Build 2 made install-check.test.mjs pick hook calls by the hook script's file name, so that file now passes from the lane worktree (whose folder name holds `verifier-pipe`) as well as from the runner's scratch worktrees",
	"(closed by build 2) the build-1 survivors X5, S10, S14, S15, S17, P2 and E3 each now name a new R-2350 to R-2354 case, and P1 names `predicate table: second pipeline status reaches commit` (build 1's only P1 red, R-1062's `PS: a comment after a pipe hides a )` case, now stays green under P1: the first pipeline's reader continues over that comment and its line break and reads the `&&` itself); C1 still turns red only on the Windows live install check. Build 2 moved the anchors of X4, S2, S12, S13, S14 and S16 (now one edit per dialect's reader); each is re-anchored on 99ffeb73 with the same wrong form. New pairs: K1 to K8 (each continuation site per dialect, the comment-then-newline rule, pipelineStarts' continuation), X6 and S18 (`${?}`), S19 (`wait`), S20 to S24 (`$LASTEXITCODE` and its cmdlet rule), E4 (`set +e`)",
	"(a) names only must-meet titles (R-2350 to R-2357) in expectRed; older rows' checks that a pair also turns red are declared as alsoRed. A shorter title that begins a longer one (`bash background`, `bash pipe ampersand`) is named together with the longer one. S4 runs pipe-guard.test.mjs alone: verifier-pipe.test.mjs's first check parses the hook's stdout, so a hook that stops asking throws there and the rest of that file never runs",
	"(b) expected survivors, each a must-meet gap: K2 (no case has a backslash-newline inside bash double quotes), K3 (no case has a backslash before a comment's line break; the reverted form is real bash's, since bash 3.2 ends a comment at the line break even after a backslash, so build 2's form is itself a fail-open: seat probe on 99ffeb73, `echo hi # note \\⏎npm test | tail -5 && git commit -m x` returns null where main and 1d92a68d ask), K5 (no case has a backtick-newline inside a PowerShell double-quoted string), K8 (the mutant only adds pipeline starts, which can only add asks, and no case that expects null has a pipe after a continued line; seat probe: the mutant asks on `npm test |⏎ grep x |⏎ tail -5 && git commit -m x`, which 99ffeb73 lets through), X6 (no case quotes `${?}`), S24 (no PowerShell case has a cmdlet stage before a native last stage), C1 (the PowerShell sample is sent only on Windows; install-check.test.mjs's stub reads the same name)",
	"(c) the comment-then-newline rule has no site of its own: comments are blanked to spaces, so the reader's start skip (K6) carries it with the plain line break. K7 is its obvious wrong form, skipping only a line break straight after the pipe, so a comment or a space before the break ends the pipeline. No R-2351 PowerShell case puts a comment between a pipe and its line break, so K7 names only the bash comment case; the older R-1062 case `PS: a comment after a pipe hides a ) that would close early` does, and K6 and K7 turn it red (declared alsoRed)",
	"(d) no pair: a `&&` or `||` that opens the command after a separator (statusReadAfterPipeline's second reader; bash rejects that input as a syntax error); bracket-depth tracking in both scans (seat probe: neither turns a check red); `commits[0]` in place of the last commit (same site as S17); exposures for nested PowerShell strings (the `report` guard; seat probe: no check turns red); the `$LASTEXITCODE` pattern's letter case, the `&` call-operator skip in powershellPipelineEndsInCmdlet, and the `wait` pattern's `--` and `${!}` spellings (no case uses them); the setup README hooks-table sentence (no check reads it); nana-gate.ts and liveText's masking (unchanged by this lane: brief wrong codes 15 and 16); every test, REQUIREMENTS, map and tree edit",
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
	], tests: [T], expectRed: [CS("bash quoted question mark")] },
	{ n: "X5", name: "a quoted git path glued to other text is exposed too", edits: [
		one(PG, "const exposure = isQuotedWord(source, quoteStart, i + 1) ? quotedGitExposure", "const exposure = true ? quotedGitExposure"),
	], tests: [T], expectRed: [NC("quoted git path glued to other text")] },
	{ n: "X6", name: "a double-quoted bash ${?} stays masked (build 1's $?-only exposure)", edits: [
		one(PG, QUOTED_STATUS, `if (quote === '"' && ch === "$" && source[i + 1] === "?") {`),
	], tests: [T], expectRed: [] },

	// status reader
	{ n: "S1", name: "(1) today's rule: any live pipe before the last commit asks", edits: [
		one(PG, "const read = statusReadAfterPipeline(live, pipe, dialect, errexitStates[i] ?? false);", "const read = pipe;"),
	], tests: [T, VP], expectRed: [...DISCARDED, R2357, R2355] },
	{ n: "S2", name: "(2) a $? anywhere later reads the status", edits: [
		one(PG, "return nextCommandReadsStatus(live, next, dialect, powershellNativeStatus) ? next : -1;", 'return live.includes("$?", next) ? next : -1;'),
	], tests: [T], expectRed: [DS("bash question mark after an intervening command"), DS("bash quoted question mark after an intervening command"), CS("bash braced question mark"), ...LASTEXITCODE_NATIVE] },
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
		one(PG, "\t\t\tif (depth > 0) depth--;\n\t\t\tcontinue;", "\t\t\tif (depth > 0) depth--;\n\t\t\telse return -1;\n\t\t\tcontinue;"),
	], tests: [T], expectRed: [CS("bash subshell"), CS("bash output assignment"), PT("pipe inside subshell"), PT("nested disable cancels pipefail exemption")] },
	{ n: "S12", name: "(9) 2>&1 is read as background", edits: [
		one(PG, BACKGROUND, 'if (dialect !== "powershell" && ch === "&") {'),
	], tests: [T], expectRed: [CS("bash redirected brace group")] },
	{ n: "S13", name: "(9) |& is read as background", edits: [
		one(PG, 'let start = pipe + (live[pipe + 1] === "&" ? 2 : 1);', "let start = pipe + 1;"),
	], tests: [T], expectRed: [CS("bash pipe ampersand"), CS("bash pipe ampersand continued after backslash-LF")] },
	{ n: "S14", name: "a bash background & does not end the pipeline", edits: [
		one(PG, BACKGROUND, "if (false) {"),
	], tests: [T], expectRed: [DS("bash background followed by another command")] },
	{ n: "S15", name: "a PowerShell & ends the pipeline as in bash", edits: [
		one(PG, 'if (dialect !== "powershell" && ch === "&" && !REDIRECTION', 'if (ch === "&" && !REDIRECTION'),
	], tests: [T], expectRed: [CS("PowerShell call operator in pipeline")] },
	{ n: "S16", name: "(6) no $? reader in the next command, in either dialect", edits: [
		one(PG, BASH_READER, "if (false) return true;"),
		one(PG, PS_READER, "if (false) return true;"),
	], tests: [T], expectRed: [CS("bash question mark in if"), CS("bash quoted question mark"), CS("bash question mark assignment"), CS("bash braced question mark"), CS("PowerShell question mark")] },
	{ n: "S17", name: "a status read asks even when no commit follows it", edits: [
		one(PG, "if (read >= 0 && commits[commits.length - 1] > read) {", "if (read >= 0) {"),
	], tests: [T], expectRed: [PT("status read after last commit")] },
	{ n: "S18", name: "${?} is not a status spelling (build 1's $? only)", edits: [
		one(PG, STATUS_EXPANSION, String.raw`const BASH_STATUS_EXPANSION = /^\$\?/u;`),
	], tests: [T], expectRed: [CS("bash braced question mark")] },
	{ n: "S19", name: "bash wait after a background pipeline does not read its status", edits: [
		one(PG, "return BASH_BACKGROUND_WAIT.test(live.slice(next)) ? next : -1;", "return -1;"),
	], tests: [T], expectRed: [CS("bash wait reads background pipeline status")] },
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
	], tests: [T], expectRed: [] },

	// build 2's line-break continuations
	{ n: "K1", name: "a bash backslash-newline outside quotes is not whitespace (build 1's form)", edits: [
		one(PG, `\n\t\tconst continued = ${BASH_ESCAPE};`, "\n\t\tconst continued = -1;"),
	], tests: [T], expectRed: BASH_ESCAPED },
	{ n: "K2", name: "a bash backslash-newline inside double quotes is not whitespace (build 1's form)", edits: [
		one(PG, `const continued = quote === '"' ? ${BASH_ESCAPE} : -1;`, "const continued = -1;"),
	], tests: [T], expectRed: [] },
	{ n: "K3", name: "a backslash-newline in a bash comment ends the comment (main's and build 1's form)", edits: [
		one(PG, `\t\t\tconst continued = ${BASH_ESCAPE};`, "\t\t\tconst continued = -1;"),
	], tests: [T], expectRed: [] },
	{ n: "K4", name: "a PowerShell backtick-newline outside strings is not whitespace (build 1's form)", edits: [
		one(PG, "if (ch === \"`\") {\n\t\t\tconst continued = " + PS_ESCAPE + ";", "if (ch === \"`\") {\n\t\t\tconst continued = -1;"),
	], tests: [T], expectRed: PS_ESCAPED },
	{ n: "K5", name: "a PowerShell backtick-newline inside a double-quoted string is not whitespace (build 1's form)", edits: [
		one(PG, "if (kind === \"double\" && ch === \"`\") {\n\t\t\tconst continued = " + PS_ESCAPE + ";", "if (kind === \"double\" && ch === \"`\") {\n\t\t\tconst continued = -1;"),
	], tests: [T], expectRed: [] },
	{ n: "K6", name: "a line break straight after an open pipe ends the pipeline (no start skip in the reader)", edits: [
		one(PG, READER_START_SKIP, "void isWhitespace;"),
	], tests: [T], expectRed: [...BASH_BREAK, ...PS_BREAK], alsoRed: [R1062_COMMENT_PIPE] },
	{ n: "K7", name: "only a line break straight after the pipe continues it (a comment before the break does not)", edits: [
		one(PG, READER_START_SKIP, String.raw`if (live[start] === "\n") start++; else if (live[start] === "\r" && live[start + 1] === "\n") start += 2;`),
	], tests: [T], expectRed: [CS("bash pipeline continued after comment")], alsoRed: [R1062_COMMENT_PIPE] },
	{ n: "K8", name: "pipelineStarts ends an open pipeline at a line break (no continuation)", edits: [
		one(PG, String.raw`if ((ch === "\n" || ch === "\r") && expectingCommand) continue;`, "void expectingCommand;"),
	], tests: [T], expectRed: [] },

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
	], tests: [T], expectRed: [CS("bash set -e"), CS("bash set -o errexit")] },
	{ n: "E2", name: "set -o errexit is not an errexit spelling", edits: [
		one(PG, String.raw`|([+-])o\s+errexit)\b/giu;`, String.raw`)\b/giu;`),
	], tests: [T], expectRed: [CS("bash set -o errexit")] },
	{ n: "E3", name: "errexit set after the pipe counts", edits: [
		one(PG, "(changes[change].index ?? 0) + changes[change][0].length <= pipe", "true"),
	], tests: [T], expectRed: [DS("bash set -e after pipeline")] },
	{ n: "E4", name: "set +e does not turn errexit off", edits: [
		one(PG, 'active = (changes[change][1] ?? changes[change][3]) === "-";', 'active = active || (changes[change][1] ?? changes[change][3]) === "-";'),
	], tests: [T], expectRed: [DS("bash set +e disables errexit before pipeline")] },
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

process.exitCode = await runMutations({ lane: "verifier-pipe-commit-match", self: import.meta.url, tip: "99ffeb73", declared: DECLARED, pairs: PAIRS });
