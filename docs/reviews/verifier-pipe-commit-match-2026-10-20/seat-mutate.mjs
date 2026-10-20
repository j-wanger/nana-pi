#!/usr/bin/env node
// Seat wrong-code pairs for lane verifier-pipe-commit-match (hook and gate lane), written by the seat 2026-10-20 after
// build 1, on the shared runner. Each pair puts one product site the lane changed into its wrong form: main's behaviour or
// the obvious wrong implementation. F pairs break the commit finder, X pairs the live-text exposures, S pairs the status
// reader, P pairs the pipeline starts, E pairs the errexit reader, V the pipefail exemption, D the README guard lines and
// C the install check's PowerShell sample (build brief wrong-code numbers in each name where one applies). Run from the
// worktree root:
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
const R983_GATE = [
	"pi headless gate blocks with verifier-pipe reason",
	"pi interactive gate prompts with verifier-pipe reason",
	"pi PowerShell gate does not treat Bash pipefail syntax as active",
	"allowPatterns cannot exempt the verifier-pipe floor",
];
const DISCARDED = [
	"bash semicolon", "bash LF", "bash intervening git add", "bash background", "bash command substitution",
	"bash question mark after an intervening command", "bash quoted question mark after an intervening command",
	"bash completed loop", "PowerShell semicolon", "PowerShell LF", "PowerShell CRLF",
].map(DS);
const GIT_EXE = [
	"bash git.exe", "bash GIT.EXE", "bash Git.Exe", "bash path", "bash single-quoted path", "bash double-quoted path with option",
	"PowerShell git.exe", "PowerShell GIT.exe", "PowerShell call double-quoted path", "PowerShell call single-quoted path",
	"PowerShell expandable path", "PowerShell bare path",
].map(GS);
const GIT_ALL = [...GIT_EXE, GS("bash quoted bare"), GS("bash backtick substitution")];
const CONSUMED_BY_AND = [
	"bash && after redirected pipeline", "bash brace group", "bash redirected brace group", "bash subshell", "bash output assignment",
	"bash pipe ampersand", "bash loop closer", "bash if closer", "PowerShell &&",
].map(CS);
const TABLE_ASKS = [
	"audit slip before commit", "git -C target commit", "git equals-valued global option", "env-prefixed commit",
	"commit in command substitution", "quoted command substitution remains executable", "pipe inside subshell",
	"pipefail enabled in background is inactive", "conditional pipefail enable is inactive",
	"pipefail enabled only in pipeline is not an exemption", "nested disable cancels pipefail exemption",
	"pipefail only in subshell is inactive", "PowerShell Bash syntax does not enable pipefail",
	"double-quoted backtick substitution pipeline", "double-quoted backtick substitution commit", "pipefail disabled later",
	"unquoted here-doc command substitution executes", "here-string does not hide following pipeline",
	"literal function body with pipeline and commit", "literal function keyword body with pipeline and commit", "PowerShell pipeline",
].map(PT);

// Anchors and main's forms.
const MAIN_FINDER = String.raw`/\bgit\s+(?:(?:-[\w-]+(?:=[^\s;&|()]+)?)(?:\s+[^\s;&|()]+)?\s+)*commit\b/gi`;
const FINDER_OPEN = "function commitIndexes(live) {\n\tconst commits = [];";
const COMMIT_HEAD = String.raw`const COMMIT_COMMAND = /git(?:\.exe)?\s+`;
const NEIGHBOURS = "const COMMIT_LEFT_NEIGHBOURS = /[\\s;&|(){}\\\\/`]/u;";
const NEIGHBOUR_TEST = "if (at > 0 && !COMMIT_LEFT_NEIGHBOURS.test(live[at - 1])) continue;";
const READS = '\t\tif ((ch === "&" && live[i + 1] === "&") || (ch === "|" && live[i + 1] === "|")) return i;';
const BACKGROUND = 'if (dialect !== "powershell" && ch === "&" && !REDIRECTION_NEIGHBOURS.has(live[i - 1]) && !REDIRECTION_NEIGHBOURS.has(live[i + 1])) return -1;';
const READER_WORDS = 'const BASH_STATUS_READER_WORDS = new Set(["then", "do"]);';
const CLOSER_WORDS = 'const BASH_STATUS_CLOSER_WORDS = new Set(["fi", "done", "esac"]);';
const GUARD_NOW = "only when a masked pipeline's exit status can reach the commit without earlier active `pipefail`; a `;` or a newline that discards it does not prompt, and `git.exe` and path spellings count as git";
const GUARD_MAIN = "that pipelines output before `git commit` without earlier active `pipefail`";

const DECLARED = [
	"(build 1, 1d92a68d) every pair runs on macOS with no pwsh: the span oracle and hooks-win32-exec skip here, so no pair names their checks; the scratch worktrees sit under the temp folder, whose path has none of the hook words install-check.test.mjs's call classifier matches (from the lane worktree itself, whose folder name holds `verifier-pipe`, that classifier counts every call naming the checkout as a hook and three of its checks fail: a test-fixture defect on main, not in the product)",
	"(a) names only must-meet titles (R-2350 to R-2357) in expectRed; older rows' checks that a pair also turns red are declared as alsoRed. S4 runs pipe-guard.test.mjs alone: verifier-pipe.test.mjs's first check parses the hook's stdout, so a hook that stops asking throws there and the rest of that file never runs",
	"(b) expected survivors, each a must-meet gap: X5 (no case glues a quoted git path to other text), S10 (no case/esac case), S14 (the R-2350 background case has nothing after `&` that could read the status, so the scan ends with no reader either way), S15 (no PowerShell case puts `&` between the pipe and its reader), S17 (no case puts a status read after the last commit; the `pipeline after commit` negative still uses `;`, which discards before order matters), P2 (the `logical OR is not a pipeline` negative still uses `;`, so `||` read as a pipe is discarded anyway), E3 (no case sets errexit after the pipe or turns it off with `set +e`), C1 (the PowerShell sample is sent only on Windows; install-check.test.mjs's stub reads the same name)",
	"(c) P1 has no must-meet title: no R-2350 to R-2357 case has two live pipelines, and only one R-1062 case catches it",
	"(d) no pair: a `&&` or `||` that opens the command after a separator (statusReadAfterPipeline's second reader; bash rejects that input as a syntax error); bracket-depth tracking in both scans (seat probe: neither turns a check red); `commits[0]` in place of the last commit (same cause as S17); exposures for nested PowerShell strings (the `report` guard; seat probe: no check turns red); the setup README hooks-table sentence (no check reads it); nana-gate.ts and liveText's masking (unchanged by this lane: brief wrong codes 15 and 16); every test, REQUIREMENTS, map and tree edit",
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
	], tests: [T], expectRed: [NC("legit"), NC("my-git"), NC("echo"), NC("git-lfs"), NC("quoted git status argument")] },

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
		one(PG, `if (quote === '"' && ch === "$" && source[i + 1] === "?") {`, "if (false) {"),
	], tests: [T], expectRed: [CS("bash quoted question mark")] },
	{ n: "X5", name: "a quoted git path glued to other text is exposed too", edits: [
		one(PG, "const exposure = isQuotedWord(source, quoteStart, i + 1) ? quotedGitExposure", "const exposure = true ? quotedGitExposure"),
	], tests: [T], expectRed: [] },

	// status reader
	{ n: "S1", name: "(1) today's rule: any live pipe before the last commit asks", edits: [
		one(PG, "const read = statusReadAfterPipeline(live, pipe, dialect, errexitStates[i] ?? false);", "const read = pipe;"),
	], tests: [T, VP], expectRed: [...DISCARDED, R2357, R2355] },
	{ n: "S2", name: "(2) a $? anywhere later reads the status", edits: [
		one(PG, "return nextCommandReadsStatus(live, next) ? next : -1;", 'return live.includes("$?", next) ? next : -1;'),
	], tests: [T], expectRed: [DS("bash question mark after an intervening command"), DS("bash quoted question mark after an intervening command")] },
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
	], tests: [T], expectRed: [CS("bash brace group"), CS("bash redirected brace group"), CS("bash loop closer"), CS("bash if closer")] },
	{ n: "S8", name: "(8) fi is not passed over", edits: [
		one(PG, CLOSER_WORDS, 'const BASH_STATUS_CLOSER_WORDS = new Set(["done", "esac"]);'),
	], tests: [T], expectRed: [CS("bash if closer")] },
	{ n: "S9", name: "(8) done is not passed over", edits: [
		one(PG, CLOSER_WORDS, 'const BASH_STATUS_CLOSER_WORDS = new Set(["fi", "esac"]);'),
	], tests: [T], expectRed: [CS("bash loop closer")] },
	{ n: "S10", name: "esac is not passed over", edits: [
		one(PG, CLOSER_WORDS, 'const BASH_STATUS_CLOSER_WORDS = new Set(["fi", "done"]);'),
	], tests: [T], expectRed: [] },
	{ n: "S11", name: "an unmatched ) or } ends the scan as discarded", edits: [
		one(PG, "\t\t\tif (depth > 0) depth--;\n\t\t\tcontinue;", "\t\t\tif (depth > 0) depth--;\n\t\t\telse return -1;\n\t\t\tcontinue;"),
	], tests: [T], expectRed: [CS("bash subshell"), CS("bash output assignment"), PT("pipe inside subshell"), PT("nested disable cancels pipefail exemption")] },
	{ n: "S12", name: "(9) 2>&1 is read as background", edits: [
		one(PG, BACKGROUND, 'if (dialect !== "powershell" && ch === "&") return -1;'),
	], tests: [T], expectRed: [CS("bash redirected brace group")] },
	{ n: "S13", name: "(9) |& is read as background", edits: [
		one(PG, 'for (let i = pipe + (live[pipe + 1] === "&" ? 2 : 1); i < live.length; i++) {', "for (let i = pipe + 1; i < live.length; i++) {"),
	], tests: [T], expectRed: [CS("bash pipe ampersand")] },
	{ n: "S14", name: "a bash background & does not end the pipeline", edits: [
		one(PG, BACKGROUND, "void REDIRECTION_NEIGHBOURS;"),
	], tests: [T], expectRed: [DS("bash background")] },
	{ n: "S15", name: "a PowerShell & ends the pipeline as in bash", edits: [
		one(PG, 'if (dialect !== "powershell" && ch === "&" && !REDIRECTION', 'if (ch === "&" && !REDIRECTION'),
	], tests: [T], expectRed: [] },
	{ n: "S16", name: "(6) no $? reader in the next command", edits: [
		one(PG, 'if (ch === "$" && live[i + 1] === "?") return true;', "if (false) return true;"),
	], tests: [T], expectRed: [CS("bash question mark in if"), CS("bash quoted question mark"), CS("bash question mark assignment"), CS("PowerShell question mark")] },
	{ n: "S17", name: "a status read asks even when no commit follows it", edits: [
		one(PG, "if (read >= 0 && commits[commits.length - 1] > read) {", "if (read >= 0) {"),
	], tests: [T], expectRed: [PT("pipeline after commit")] },

	// pipeline starts
	{ n: "P1", name: "only the command's first pipeline is scanned", edits: [
		one(PG, "\t\t\tif (!pipelineOpen) starts.push(i);", "\t\t\tif (starts.length === 0) starts.push(i);"),
	], tests: [T], expectRed: [], alsoRed: [PT("PS: a comment after a pipe hides a ) that would close early (§2.3.3 only)")] },
	{ n: "P2", name: "|| is read as a pipe", edits: [
		one(PG, 'if (ch === "|" && live[i - 1] !== "|" && live[i + 1] !== "|") {\n\t\t\tif (!pipelineOpen)', 'if (ch === "|") {\n\t\t\tif (!pipelineOpen)'),
	], tests: [T], expectRed: [PT("logical OR is not a pipeline")] },

	// errexit and the pipefail exemption
	{ n: "E1", name: "(5) no errexit reader", edits: [
		one(PG, 'if (dialect !== "powershell" && errexitActive) return pipe;', "if (false) return pipe;"),
	], tests: [T], expectRed: [CS("bash set -e"), CS("bash set -o errexit")] },
	{ n: "E2", name: "set -o errexit is not an errexit spelling", edits: [
		one(PG, String.raw`|([+-])o\s+errexit)\b/giu;`, String.raw`)\b/giu;`),
	], tests: [T], expectRed: [CS("bash set -o errexit")] },
	{ n: "E3", name: "errexit set after the pipe counts", edits: [
		one(PG, "(changes[change].index ?? 0) + changes[change][0].length <= pipe", "true"),
	], tests: [T], expectRed: [] },
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

process.exitCode = await runMutations({ lane: "verifier-pipe-commit-match", self: import.meta.url, tip: "1d92a68d", declared: DECLARED, pairs: PAIRS });
