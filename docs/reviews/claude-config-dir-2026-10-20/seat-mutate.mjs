#!/usr/bin/env node
// Seat wrong-code pairs for lane claude-config-dir (install, hook or gate lane), written by the seat 2026-10-20 after
// build 1 (53cba519 + README fix 58fe4374), on the shared runner. Each pair puts one product site the lane changed into
// its wrong form: main's behaviour (the variable ignored, SCRUB without it, no refusal call) or the obvious wrong
// implementation the build brief's "Wrong code to try" list names, plus the copy-paste and argument mistakes beside it.
// C pairs: lib/claude-config-home.mjs; P pairs: lib/paths.mjs resolveLayout and safeResolve; B pairs: bin/nana-setup.mjs;
// H1: the shared-memory hook's import of the resolver; S1: scripts/test.mjs SCRUB. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/claude-config-dir-2026-10-20/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-setup/tests/claude-config-dir.test.mjs";
const HOOK_T = "packages/nana-setup/tests/shared-memory-hook.test.mjs";
const RUNNER_T = "packages/nana-pack/tests/test-runner.test.mjs";
const HOME_MOD = "packages/nana-setup/lib/claude-config-home.mjs";
const PATHS = "packages/nana-setup/lib/paths.mjs";
const CLI = "packages/nana-setup/bin/nana-setup.mjs";
const HOOK = "packages/nana-setup/claude/hooks/nana-shared-memory.mjs";
const RUNNER = "scripts/test.mjs";
const R2390 = "install with an absolute CLAUDE_CONFIG_DIR writes the Claude files there and nothing under ~/.claude";
const R2391 = "doctor checks the CLAUDE_CONFIG_DIR folder, not a fully installed ~/.claude";
const R2392 = "--claude-home and --home win over CLAUDE_CONFIG_DIR";
const R2393 = "a relative CLAUDE_CONFIG_DIR: install exits 2 naming the variable and writes nothing";
const R2394 = "the install banner names the CLAUDE_CONFIG_DIR folder and its source";
const R2396 = "CLAUDE_CONFIG_DIR is scrubbed from the child env";
const R2397 = "an empty CLAUDE_CONFIG_DIR falls back to ~/.claude";
const R2398 = "a relative CLAUDE_CONFIG_DIR: doctor's summary names it as install's refusal";
const R386_PRINTS = "CLAUDE_CONFIG_DIR: prints from the alternate config dir";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const RESOLVER = 'return env[CLAUDE_CONFIG_ENV] || path.join(home, ".claude");';
const GUARD = "const ambientClaudeHome = !opts.claudeHome && !opts.home && process.env[CLAUDE_CONFIG_ENV]";
const CWD_RELATIVE = "const claudeHomeCwdRelative = ambientClaudeHome && !path.isAbsolute(ambientClaudeHome) ? safeCwd() : null;";
const AMBIENT_RESOLVE = "? safeResolve(ambientClaudeHome, claudeHomeCwdRelative)";
const SAFE_RESOLVE = "return path.isAbsolute(value) ? path.resolve(value) : path.resolve(cwd, value);";

const DECLARED = [
	"(a) every pair runs on macOS; R-2390's hook-link clause is checked off win32 only, so on this machine it is live",
	"(b) no pair: paths.mjs's default branch `: claudeConfigHome(base)` (with the guard intact it is reached only when the variable is unset or empty, where it equals main's `path.join(base, \".claude\")`); the CLAUDE_CONFIG_ENV import and re-export in paths.mjs and the CLI (interface only: a missing export fails the import, not a check); USAGE's --claude-home default and the CLI and paths headers (no check reads them); safeResolve's catch (only a vanished cwd reaches it); the three hermetic test edits (tests, not product)",
	"(c) H1 names only R-386's first hook check: with the hook reading ~/.claude, the second check's lstatSync of the alternate projects folder throws, so the file ends THREW before printing a line for that title",
	"(d) S1 runs test-runner.test.mjs, a single file that copies the mutated scripts/test.mjs into throwaway roots; it never runs the suite",
];

const PAIRS = [
	// lib/claude-config-home.mjs, the one resolver setup and the hook share
	{ n: "C1", name: "the resolver ignores CLAUDE_CONFIG_DIR and always returns <home>/.claude (main's rule)", edits: [
		one(HOME_MOD, RESOLVER, 'return path.join(home, ".claude");'),
	], tests: [T, HOOK_T], expectRed: [R2390, R2391, R2393, R2394, R2398, R386_PRINTS] },
	{ n: "C2", name: "the resolver reads the variable with ?? (an empty value is not unset)", edits: [
		one(HOME_MOD, RESOLVER, 'return env[CLAUDE_CONFIG_ENV] ?? path.join(home, ".claude");'),
	], tests: [T], expectRed: [R2397] },
	{ n: "C3", name: "the resolver resolves the value, so a relative value reaches resolveLayout absolute", edits: [
		one(HOME_MOD, RESOLVER, 'return env[CLAUDE_CONFIG_ENV] ? path.resolve(env[CLAUDE_CONFIG_ENV]) : path.join(home, ".claude");'),
	], tests: [T], expectRed: [R2393, R2398] },

	// lib/paths.mjs resolveLayout
	{ n: "P1", name: "resolveLayout reads no CLAUDE_CONFIG_DIR (main's form)", edits: [
		one(PATHS, GUARD, "const ambientClaudeHome = false"),
		one(PATHS, "\t\t\t\t: claudeConfigHome(base);", '\t\t\t\t: path.join(base, ".claude");'),
	], tests: [T], expectRed: [R2390, R2391, R2393, R2394, R2398] },
	{ n: "P2", name: "the variable beats --claude-home and --home", edits: [
		one(PATHS, GUARD, "const ambientClaudeHome = process.env[CLAUDE_CONFIG_ENV]"),
		one(PATHS, "const claudeHome = opts.claudeHome\n", `const claudeHome = ambientClaudeHome ${AMBIENT_RESOLVE} : opts.claudeHome\n`),
	], tests: [T], expectRed: [R2392] },
	{ n: "P3", name: "the variable is read under --home (only --claude-home beats it)", edits: [
		one(PATHS, GUARD, "const ambientClaudeHome = !opts.claudeHome && process.env[CLAUDE_CONFIG_ENV]"),
		one(PATHS, '\t\t: opts.home\n\t\t\t? path.join(base, ".claude")', '\t\t: opts.home && !ambientClaudeHome\n\t\t\t? path.join(base, ".claude")'),
	], tests: [T], expectRed: [R2392] },
	{ n: "P4", name: "the guard is dropped: the variable is read even when a flag picks the folder", edits: [
		one(PATHS, GUARD, "const ambientClaudeHome = process.env[CLAUDE_CONFIG_ENV]"),
	], tests: [T], expectRed: [R2392] },
	{ n: "P5", name: "a relative value is resolved against the cwd silently (no cwd-relative mark)", edits: [
		one(PATHS, CWD_RELATIVE, "const claudeHomeCwdRelative = null;"),
		one(PATHS, AMBIENT_RESOLVE, "? safeResolve(ambientClaudeHome, safeCwd())"),
	], tests: [T], expectRed: [R2393, R2398] },
	{ n: "P6", name: "claudeHomeSource never names CLAUDE_CONFIG_DIR", edits: [
		one(PATHS, ': ambientClaudeHome ? CLAUDE_CONFIG_ENV : "default",', ': "default",'),
	], tests: [T], expectRed: [R2394] },
	{ n: "P7", name: "safeResolve leaves a relative value unresolved (the refusal names the bare value)", edits: [
		one(PATHS, SAFE_RESOLVE, "return path.isAbsolute(value) ? path.resolve(value) : value;"),
	], tests: [T], expectRed: [R2393] },
	{ n: "P8", name: "safeResolve leaves an absolute value unnormalized (its trailing separator kept)", edits: [
		one(PATHS, SAFE_RESOLVE, "return path.isAbsolute(value) ? value : path.resolve(cwd, value);"),
	], tests: [T], expectRed: [R2390] },

	// bin/nana-setup.mjs
	{ n: "B1", name: "install never calls the Claude refusal", edits: [
		one(CLI, '\trefuseCwdRelativeClaudeHome(layout, "this install");\n\tconsole.log(', "\tconsole.log("),
	], tests: [T], expectRed: [R2393] },
	{ n: "B2", name: "doctor's install prediction never calls the Claude refusal", edits: [
		one(CLI, '\t\t\t\trefuseCwdRelativeClaudeHome(layout, "this install");\n', ""),
	], tests: [T], expectRed: [R2398] },
	{ n: "B3", name: "the Claude refusal throws a plain Error, not a SetupError", edits: [
		one(CLI, "throw new SetupError(\n\t\t`${CLAUDE_CONFIG_ENV} is a relative path", "throw new Error(\n\t\t`${CLAUDE_CONFIG_ENV} is a relative path"),
	], tests: [T], expectRed: [R2393, R2398] },
	{ n: "B4", name: "the banner's claude home line omits its source", edits: [
		one(CLI, '${layout.claudeHomeSource === CLAUDE_CONFIG_ENV ? `  (from ${CLAUDE_CONFIG_ENV})` : ""}', ""),
	], tests: [T], expectRed: [R2394] },
	{ n: "B5", name: "the Claude refusal is the pi refusal's text copied (names PI_CODING_AGENT_DIR and --pi-home)", edits: [
		one(CLI, "`${CLAUDE_CONFIG_ENV} is a relative path; here it resolves to ${layout.claudeHome}", "`PI_CODING_AGENT_DIR is a relative path; here it resolves to ${layout.claudeHome}"),
		one(CLI, "`Pass --claude-home <absolute dir>, or set ${CLAUDE_CONFIG_ENV} to an absolute path, and re-run.`", "`Pass --pi-home <absolute dir>, or set PI_CODING_AGENT_DIR to an absolute path, and re-run.`"),
	], tests: [T], expectRed: [R2393, R2398] },

	// claude/hooks/nana-shared-memory.mjs
	{ n: "H1", name: "the hook ignores the resolver and reads ~/.claude only", edits: [
		one(HOOK, "const claudeHome = claudeConfigHome(os.homedir());", 'const claudeHome = path.join(os.homedir(), ".claude");'),
	], tests: [HOOK_T], expectRed: [R386_PRINTS] },

	// scripts/test.mjs
	{ n: "S1", name: "SCRUB leaves CLAUDE_CONFIG_DIR in the child env (main's list)", edits: [
		one(RUNNER, '|| k === "PI_CODING_AGENT_DIR" || k === "CLAUDE_CONFIG_DIR";', '|| k === "PI_CODING_AGENT_DIR";'),
	], tests: [RUNNER_T], expectRed: [R2396] },
];

process.exitCode = await runMutations({ lane: "claude-config-dir", self: import.meta.url, tip: "58fe4374", declared: DECLARED, pairs: PAIRS });
