#!/usr/bin/env node
// Seat wrong-code pairs for lane claude-code-builder-parity (gate), written by the seat 2026-10-23 after build 1, on the
// shared runner; re-run at tip f8bdd255 after build 2. They are the must-meet's 34 pairs in its order, less p12 (Windows only); pair 3 is three runs (3a to 3c).
// The lane changes pi-watchdog, which the runner does not import, so the lane's runner judges them. Run from the
// worktree root on macOS:   SEAT_MUTATE_OUT=<file> node docs/reviews/claude-code-builder-parity-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PW = "packages/nana-pack/bin/pi-worker.mjs";
const WD = "packages/nana-pack/bin/pi-watchdog.mjs";
const WC = "packages/nana-pack/bin/worker-config.mjs";
const TPL = "templates/_shared/working-under-nana-pi.md";
const T_WC = "packages/nana-pack/tests/worker-claude.test.mjs";
const T_WL = "packages/nana-pack/tests/worker-lane.test.mjs";
const T_TR = "packages/nana-pack/tests/templates-render.test.mjs";
const T_BR = "packages/nana-pack/tests/build-records.test.mjs";
const R_2646 = /^R-2646: /; // R-2646
const R_2647 = /^R-2647: /; // R-2647
const R_2648 = /^R-2648: /; // R-2648
const R_2649 = /^R-2649: /; // R-2649
const R_2651 = /^R-2651: /; // R-2651
const R_2652 = /^R-2652: /; // R-2652
const R_2653 = /^R-2653: /; // R-2653
const R_2654 = /^R-2654: /; // R-2654
const R_2655 = /^R-2655: /; // R-2655
const R_2664 = /^R-2664: /; // R-2664
const R_2665 = /^R-2665: /; // R-2665
const SEAL = /^seal: a Claude Code builder uses /; // R-2646 R-2651 R-2654 R-2655
const R_1124 = /^lane prints the resolved builder and roster source on stderr before starting pi/; // R-1124
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const LARGER = "\t\tbuilder = roster.largerBuilder;\n\t\tbuilderLabel = LARGER_BUILDER_LABEL;";
const PROMPT_PARTS = "const promptParts = [Buffer.from(preamble), Buffer.from('\\n\\n'), readFileSync(briefPath)];";
const KNOWN_PUSH = "if (knownBugPath) promptParts.push(Buffer.from('\\n\\n'), readFileSync(knownBugPath));";
const APPEND = "\t\t\tCLAUDE_APPEND_PROMPT_FILE_FLAG, promptFile,\n\t\t\tinstruction,\n";
const SETTINGS_ARG = "\t\t\tCLAUDE_SETTINGS_FLAG, settingsFile,\n";
const SEALED_HEAD = "NANA_ROLE: 'worker', NANA_WORKTREE_ROOT: cwd, NANA_HANDOFF: 'off', ...CLAUDE_BUILDER_CHILD_ENV,";
const ENV_LOOP = "for (const [name, value] of Object.entries(sourceEnv)) if (allowed.has(name.toLowerCase())) {";
const JSON_REASON = "reason = `not valid JSON${place ? ` at line ${place.line}, column ${place.column}` : ''}`;";

const DECLARED = [
	"(plan) p1 to p34 follow the must-meet's wrong-code list in order; p3 is three runs, one per dropped flag",
	"(seat) p10 drops the brief refusal outright: the check runs before the roster is read, so no one-line build skips it for a Claude entry alone",
	"(seat) p12 (launch.options not spread into spawn, expecting R-2650) runs only on the Windows leg, so it is not in this macOS table; the seat runs it, with build 2's two Windows pairs w1 (pi-worker leaves a cmd.exe Claude launch detached) and w2 (the watchdog ignores a launch's detached option), on a scratch Windows CI branch (seat-win-pairs-f8bdd255.txt)",
	"(seat) p16 expects R-1124's existing worker-lane check, a pi lane launch through the default launcher",
];

const PAIRS = [
	{ n: "p1", name: "R-1191's refusal kept", edits: [
		one(PW, LARGER, `\t\tif (roster.largerBuilder.runtime === CLAUDE_CODE_RUNTIME) laneFailure('roster.largerBuilder is a Claude Code entry');\n${LARGER}`),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p2", name: "the Claude entry handed to pi", edits: [
		one(PW, "const isClaudeBuilder = builder.runtime === CLAUDE_CODE_RUNTIME;", "const isClaudeBuilder = false;"),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p3a", name: "--tools dropped", edits: [
		one(PW, "\t\t\tCLAUDE_TOOLS_FLAG, CLAUDE_BUILDER_TOOLS,\n", ""),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p3b", name: "--allowedTools dropped", edits: [
		one(PW, "\t\t\tCLAUDE_ALLOW_FLAG, CLAUDE_BUILDER_TOOLS,\n", ""),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p3c", name: "--strict-mcp-config dropped", edits: [
		one(PW, "\t\t\tCLAUDE_STRICT_MCP_FLAG,\n", ""),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p4", name: "the model fixed at sonnet", edits: [
		one(PW, "CLAUDE_PRINT_FLAG, CLAUDE_MODEL_FLAG, builder.model,", "CLAUDE_PRINT_FLAG, CLAUDE_MODEL_FLAG, 'sonnet',"),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p5", name: "the child env built without NANA_ROLE and NANA_WORKTREE_ROOT", edits: [
		one(PW, "\t\tchildEnv = sealed;", "\t\tchildEnv = { ...CLAUDE_BUILDER_CHILD_ENV, BASH_DEFAULT_TIMEOUT_MS: String(CLAUDE_BUILDER_BASH_LIMIT_MS), BASH_MAX_TIMEOUT_MS: String(CLAUDE_BUILDER_BASH_LIMIT_MS) };"),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p6", name: "the preamble missing from the prompt file", edits: [
		one(PW, PROMPT_PARTS, "const promptParts = [readFileSync(briefPath)];"),
	], tests: [T_WC], expectRed: [R_2647] },
	{ n: "p7", name: "known bugs placed before the brief", edits: [
		one(PW, KNOWN_PUSH, "if (knownBugPath) promptParts.splice(2, 0, readFileSync(knownBugPath), Buffer.from('\\n\\n'));"),
	], tests: [T_WC], expectRed: [R_2647] },
	{ n: "p8", name: "the prompt file written into the worktree", edits: [
		one(PW, "const promptFile = path.join(preambleDir, CLAUDE_BUILDER_PROMPT_FILE);", "const promptFile = path.join(cwd, CLAUDE_BUILDER_PROMPT_FILE);"),
	], tests: [T_WC], expectRed: [R_2647] },
	{ n: "p9", name: "the prompt passed as argv text", edits: [
		one(PW, "\t\t\tCLAUDE_APPEND_PROMPT_FILE_FLAG, promptFile,\n", "\t\t\t'--append-system-prompt', readFileSync(promptFile, 'utf8'),\n"),
	], tests: [T_WC], expectRed: [R_2647] },
	{ n: "p10", name: "the brief refusal skipped", edits: [
		one(PW, "if (!briefCheck.ok) laneFailure(briefCheck.reason);", "if (false) laneFailure(briefCheck.reason);"),
	], tests: [T_WC], expectRed: [R_2648] },
	{ n: "p11", name: "the builder line built from pi tokens", edits: [
		one(PW, "const runtimeTokens = isClaudeBuilder ? `${CLAUDE_CODE_RUNTIME} ${builder.model}` : ", "const runtimeTokens = false ? `${CLAUDE_CODE_RUNTIME} ${builder.model}` : "),
	], tests: [T_WC], expectRed: [R_2649] },
	{ n: "p13", name: "the seat's --stall-secs passed through", edits: [
		one(PW, "{ launch: claudeLaunch, stallSecs: CLAUDE_BUILDER_STALL_SECS }", "{ launch: claudeLaunch }"),
	], tests: [T_WC], expectRed: [R_2651] },
	{ n: "p14", name: "the start record built from the entry's provider and thinking", edits: [
		one(PW, "provider: selectedBuilder.runtime === CLAUDE_CODE_RUNTIME ? CLAUDE_CODE_RUNTIME : selectedBuilder.provider,", "provider: selectedBuilder.provider,"),
		one(PW, "thinking: selectedBuilder.runtime === CLAUDE_CODE_RUNTIME ? null : selectedBuilder.thinking,", "thinking: selectedBuilder.thinking,"),
	], tests: [T_BR], expectRed: [R_2653] },
	{ n: "p15", name: "the bullet keeps the subagent route", edits: [
		one(TPL, "with it through `pi-worker --lane-size larger`, a pi entry or a Claude Code entry alike;", "with it: a pi entry through `pi-worker --lane-size larger`, a Claude Code entry as a Claude Code subagent in the lane worktree;"),
	], tests: [T_TR], expectRed: [R_2652] },
	{ n: "p16", name: "pi-watchdog's default launch removed", edits: [
		one(WD, "const launcher = opts.launch ?? piLaunch;", "const launcher = opts.launch;"),
	], tests: [T_WL], expectRed: [R_1124] },
	{ n: "p17", name: "--permission-mode default dropped", edits: [
		one(PW, "\t\t\tCLAUDE_PERMISSION_MODE_FLAG, CLAUDE_BUILDER_PERMISSION_MODE,\n", ""),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p18", name: "--setting-sources project,local dropped", edits: [
		one(PW, "\t\t\tCLAUDE_SETTING_SOURCES_FLAG, CLAUDE_BUILDER_SETTING_SOURCES,\n", ""),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p19", name: "the instruction placed right after the --allowedTools list", edits: [
		one(PW, APPEND, "\t\t\tinstruction,\n\t\t\tCLAUDE_APPEND_PROMPT_FILE_FLAG, promptFile,\n"),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p20", name: "auto-memory off left out of the child env", edits: [
		one(PW, SEALED_HEAD, "NANA_ROLE: 'worker', NANA_WORKTREE_ROOT: cwd, NANA_HANDOFF: 'off',"),
	], tests: [T_WC], expectRed: [R_2654] },
	{ n: "p21", name: "the seat's BASH_DEFAULT_TIMEOUT_MS passed through", edits: [
		one(PW, "\t\t\tBASH_DEFAULT_TIMEOUT_MS: String(CLAUDE_BUILDER_BASH_LIMIT_MS),", "\t\t\tBASH_DEFAULT_TIMEOUT_MS: process.env.BASH_DEFAULT_TIMEOUT_MS ?? String(CLAUDE_BUILDER_BASH_LIMIT_MS),"),
	], tests: [T_WC], expectRed: [R_2654] },
	{ n: "p22", name: "the user env copied whole", edits: [
		one(PW, ENV_LOOP, "for (const [name, value] of Object.entries(sourceEnv)) if (true) {"),
	], tests: [T_WC], expectRed: [R_2655] },
	{ n: "p23", name: "the whole user file copied", edits: [
		one(PW, "\tconst settings = {};\n", "\tconst settings = reason ? {} : { ...parsed };\n"),
	], tests: [T_WC], expectRed: [R_2655] },
	{ n: "p24", name: "carry names matched with case", edits: [
		one(PW, "const allowed = new Set(CLAUDE_CARRY_ENV_NAMES.map((name) => name.toLowerCase()));", "const allowed = new Set(CLAUDE_CARRY_ENV_NAMES);"),
		one(PW, ENV_LOOP, "for (const [name, value] of Object.entries(sourceEnv)) if (allowed.has(name)) {"),
	], tests: [T_WC], expectRed: [R_2655] },
	{ n: "p25", name: "CLAUDE_CONFIG_DIR ignored", edits: [
		one(PW, "const source = path.join(configured !== undefined && configured !== '' ? configured : path.join(homedir(), '.claude'), 'settings.json');", "const source = path.join(homedir(), '.claude', 'settings.json');"),
	], tests: [T_WC], expectRed: [R_2655] },
	{ n: "p26", name: "the sealed env kept only in the process env", edits: [
		one(PW, "settings.env = { ...(settings.env ?? {}), ...sealed };", "settings.env = { ...(settings.env ?? {}) };"),
	], tests: [T_WC], expectRed: [R_2664] },
	{ n: "p27", name: "the parser's message in the line", edits: [
		one(PW, JSON_REASON, "reason = `not valid JSON: ${error.message}`;"),
	], tests: [T_WC], expectRed: [R_2665] },
	{ n: "p28", name: "a malformed user file thrown", edits: [
		one(PW, "\t\tcatch (error) {\n\t\t\tconst place = jsonErrorPlace(error);", "\t\tcatch (error) {\n\t\t\tthrow error;\n\t\t\tconst place = jsonErrorPlace(error);"),
	], tests: [T_WC], expectRed: [R_2665] },
	{ n: "p29", name: "--settings omitted when the user file is missing", edits: [
		one(PW, SETTINGS_ARG, "\t\t\t...(carry.line.includes(': none; ') ? [] : [CLAUDE_SETTINGS_FLAG, settingsFile]),\n"),
	], tests: [T_WC], expectRed: [R_2665] },
	{ n: "p30", name: "the settings file written into the worktree", edits: [
		one(PW, "const settingsFile = path.join(preambleDir, CLAUDE_BUILDER_SETTINGS_FILE);", "const settingsFile = path.join(cwd, CLAUDE_BUILDER_SETTINGS_FILE);"),
	], tests: [T_WC], expectRed: [R_2655] },
	{ n: "p31", name: "inline JSON passed to --settings", edits: [
		one(PW, SETTINGS_ARG, "\t\t\tCLAUDE_SETTINGS_FLAG, readFileSync(settingsFile, 'utf8'),\n"),
	], tests: [T_WC], expectRed: [R_2655] },
	{ n: "p32", name: "values printed in the carry line", edits: [
		one(PW, "\t\t\t\tcarriedEnvNames.push(name);", "\t\t\t\tcarriedEnvNames.push(`${name}=${value}`);"),
	], tests: [T_WC], expectRed: [R_2655] },
	{ n: "p33", name: "--settings dropped from the argv", edits: [
		one(PW, SETTINGS_ARG, ""),
	], tests: [T_WC], expectRed: [R_2646] },
	{ n: "p34", name: "auto-memory off joins the carry names", edits: [
		one(WC, "  'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_CUSTOM_HEADERS',", "  'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_CUSTOM_HEADERS', 'CLAUDE_CODE_DISABLE_AUTO_MEMORY',"),
	], tests: [T_WC], expectRed: [SEAL] },
];

process.exitCode = await runMutations({ lane: "claude-code-builder-parity", self: import.meta.url, tip: "f8bdd255", declared: DECLARED, pairs: PAIRS });
