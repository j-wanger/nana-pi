/**
 * @module packages/nana-pack/tests/worker-claude.test.mjs
 * @purpose Pin Claude Code larger-lane builder launch, prompt and settings isolation, platform routing, liveness, and cleanup.
 * @inputs pi-worker, worker and Claude command configuration, temporary linked worktrees, user settings, and fake claude/pi commands.
 * @outputs requirement-tagged PASS/FAIL/SKIP checks.
 * @effects disk (OS-temp fixtures and clone-local build records), process (git and bounded worker/fake-builder children).
 * @errors failed checks or per-case time limits exit nonzero; unexpected fixture failures throw.
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { CLAUDE_ALLOW_FLAG, CLAUDE_BIN, CLAUDE_MODEL_FLAG, CLAUDE_PRINT_FLAG } from "../lib/claude-review-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const config = await import("../bin/worker-config.mjs");
const {
	CLAUDE_APPEND_PROMPT_FILE_FLAG,
	CLAUDE_BUILDER_BASH_LIMIT_MS,
	CLAUDE_BUILDER_CHILD_ENV,
	CLAUDE_BUILDER_PERMISSION_MODE,
	CLAUDE_BUILDER_PROMPT_FILE,
	CLAUDE_BUILDER_SETTING_SOURCES,
	CLAUDE_BUILDER_SETTINGS_FILE,
	CLAUDE_BUILDER_STALL_SECS,
	CLAUDE_BUILDER_TOOLS,
	CLAUDE_CARRY_ENV_NAMES,
	CLAUDE_CARRY_KEYS,
	CLAUDE_PERMISSION_MODE_FLAG,
	CLAUDE_SETTINGS_FLAG,
	CLAUDE_SETTING_SOURCES_FLAG,
	CLAUDE_STRICT_MCP_FLAG,
	CLAUDE_TOOLS_FLAG,
} = config;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACK = path.resolve(HERE, "..");
const WORKER = path.join(PACK, "bin", "pi-worker.mjs");
const BRIEF_CHECK = path.join(PACK, "bin", "brief-check.mjs");
const PREAMBLE = path.join(PACK, "prompts", "builder-preamble.md");
const CASE_LIMIT_MS = 20_000;
const TEMP = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "worker-claude-")));
const REPO = path.join(TEMP, "repo");
const LANE = path.join(TEMP, "lane");
const HOME = path.join(TEMP, "home");
const AGENT = path.join(TEMP, "agent");
const BIN = path.join(TEMP, "bin");
const BRIEF = path.join(TEMP, "brief.md");
const OUT = path.join(TEMP, "out.md");
const RECORD = path.join(TEMP, "claude-record.jsonl");
const PROMPT_COPY = path.join(TEMP, "prompt-copy.md");
const SETTINGS_COPY = path.join(TEMP, "settings-copy.json");
const PID_FILE = path.join(TEMP, "claude.pid");
const PI_MARKER = path.join(TEMP, "pi-spawned");
let failures = 0;

const check = (title, ok, detail = "", skipped = false) => {
	console.log(skipped ? "SKIP" : ok ? "PASS" : "FAIL", title, skipped ? `— ${detail}` : ok ? "" : detail);
	if (!skipped && !ok) failures++;
};
const git = (cwd, ...args) => {
	const result = spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args], { cwd, encoding: "utf8", timeout: CASE_LIMIT_MS });
	if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
	return result.stdout.trim();
};
const real = (value) => process.platform === "win32" ? fs.realpathSync.native(value) : fs.realpathSync(value);
const readRows = (file) => {
	try { return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse); }
	catch { return []; }
};
const removeArtifacts = () => {
	for (const file of [OUT, RECORD, PROMPT_COPY, SETTINGS_COPY, PID_FILE, PI_MARKER]) fs.rmSync(file, { force: true });
};
const roster = {
	scout: null,
	builder: { provider: "small-provider", model: "small-model", thinking: "low" },
	largerBuilder: { runtime: "claude-code", model: "fable" },
	reviewer: { provider: "review-provider", model: "review-model", thinking: null },
	land: null,
};

for (const directory of [REPO, HOME, AGENT, BIN]) fs.mkdirSync(directory, { recursive: true });
git(REPO, "init", "-q", "-b", "main");
fs.writeFileSync(path.join(REPO, "seed"), "seed\n");
fs.mkdirSync(path.join(REPO, "docs", "known-bugs"), { recursive: true });
const BUG_TEXT = "# FEAT-006 fixture bugs\n\n- fixture bug\n";
fs.writeFileSync(path.join(REPO, "docs", "known-bugs", "FEAT-006.md"), BUG_TEXT);
fs.writeFileSync(path.join(REPO, "docs", "known-bugs", "unplaced.md"), "# Unplaced fixture\n\n- never attach me\n");
git(REPO, "add", "seed", "docs/known-bugs/FEAT-006.md", "docs/known-bugs/unplaced.md");
git(REPO, "commit", "-qm", "seed");
git(REPO, "worktree", "add", "-q", "-b", "feat/alpha", LANE);
fs.writeFileSync(path.join(AGENT, "nana-pack.json"), JSON.stringify({ roster }));
const GIT_DIR = real(path.resolve(LANE, git(LANE, "rev-parse", "--git-dir")));
const COMMON_DIR = real(path.resolve(LANE, git(LANE, "rev-parse", "--git-common-dir")));
const LOCK = path.join(GIT_DIR, "nana-lane.lock");
const LEDGER = path.join(COMMON_DIR, "nana", "build-records.jsonl");

const FAKE_BODY = `const fs = require("node:fs");
const args = process.argv.slice(2);
const after = (flag) => { const at = args.indexOf(flag); return at >= 0 ? args[at + 1] : null; };
const prompt = after("--append-system-prompt-file");
const settings = after("--settings");
if (prompt && process.env.WC_PROMPT_COPY) fs.copyFileSync(prompt, process.env.WC_PROMPT_COPY);
if (settings && process.env.WC_SETTINGS_COPY) fs.copyFileSync(settings, process.env.WC_SETTINGS_COPY);
if (process.env.WC_PID_FILE) fs.writeFileSync(process.env.WC_PID_FILE, String(process.pid));
const record = { argv: args, cwd: process.cwd(), prompt, settings, settingsMode: settings ? fs.statSync(settings).mode : null, lock: process.env.WC_LOCK ? fs.existsSync(process.env.WC_LOCK) : false, env: Object.fromEntries(["NANA_ROLE","NANA_WORKTREE_ROOT","NANA_HANDOFF","CLAUDE_CODE_DISABLE_AUTO_MEMORY","BASH_DEFAULT_TIMEOUT_MS","BASH_MAX_TIMEOUT_MS","CLAUDE_CONFIG_DIR"].map((name) => [name, process.env[name] ?? null])) };
if (process.env.WC_RECORD) fs.appendFileSync(process.env.WC_RECORD, JSON.stringify(record) + "\\n");
setTimeout(() => { process.stdout.write("fake Claude builder report\\n"); }, Number(process.env.WC_SLEEP_MS ?? "0"));
`;
const fakeScript = path.join(BIN, "fake-claude.cjs");
fs.writeFileSync(fakeScript, FAKE_BODY);
if (process.platform === "win32") {
	fs.writeFileSync(path.join(BIN, "claude.cmd"), `@echo off\r\n"${process.execPath}" "${fakeScript}" %*\r\n`);
	fs.writeFileSync(path.join(BIN, "pi.cmd"), `@echo off\r\necho spawned>"${PI_MARKER}"\r\necho fake pi\r\n`);
} else {
	fs.writeFileSync(path.join(BIN, "claude"), `#!${process.execPath}\nrequire(${JSON.stringify(fakeScript)});\n`, { mode: 0o755 });
	fs.writeFileSync(path.join(BIN, "pi"), `#!/bin/sh\nprintf 'spawned\\n' > "${PI_MARKER}"\nprintf 'fake pi\\n'\n`, { mode: 0o755 });
}

const baseEnv = (extra = {}) => ({
	...process.env,
	HOME,
	USERPROFILE: HOME,
	PI_CODING_AGENT_DIR: AGENT,
	PATH: `${BIN}${path.delimiter}${process.env.PATH ?? ""}`,
	WC_RECORD: RECORD,
	WC_PROMPT_COPY: PROMPT_COPY,
	WC_SETTINGS_COPY: SETTINGS_COPY,
	WC_PID_FILE: PID_FILE,
	WC_LOCK: LOCK,
	...extra,
});
const writeBrief = (bytes) => { fs.writeFileSync(BRIEF, bytes); return BRIEF; };
const workerArgs = (brief = BRIEF, extra = []) => [
	WORKER,
	...(extra.includes("--poll") ? [] : ["--poll", "0.2"]),
	...(extra.includes("--stall-secs") ? [] : ["--stall-secs", "2"]),
	"--out", OUT, "--lane", "alpha", "--brief", brief, "--lane-size", "larger", ...extra,
];
const runWorker = ({ brief = BRIEF, extra = [], env = {}, timeout = CASE_LIMIT_MS } = {}) => spawnSync(process.execPath, workerArgs(brief, extra), {
	cwd: LANE,
	encoding: "utf8",
	timeout,
	env: baseEnv(env),
});
const selectedBriefLine = (stderr) => stderr.split(/\r?\n/).find((line) => line.startsWith("pi-worker: lane refused:") || line.startsWith("pi-worker: precedent:")) ?? null;
const expectedPrompt = (briefBytes, withBugs, launchedCwd = LANE) => {
	const worktree = process.platform === "win32" ? fs.realpathSync.native(launchedCwd) : fs.realpathSync(launchedCwd);
	const preamble = fs.readFileSync(PREAMBLE, "utf8").replaceAll("{{WORKTREE}}", worktree).replaceAll("{{BRANCH}}", "feat/alpha");
	return Buffer.concat([Buffer.from(preamble), Buffer.from("\n\n"), Buffer.from(briefBytes), ...(withBugs ? [Buffer.from("\n\n"), Buffer.from(BUG_TEXT)] : [])]);
};
const sealedEnv = () => ({
	NANA_ROLE: "worker",
	NANA_WORKTREE_ROOT: real(LANE),
	NANA_HANDOFF: "off",
	CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1",
	BASH_DEFAULT_TIMEOUT_MS: String(CLAUDE_BUILDER_BASH_LIMIT_MS),
	BASH_MAX_TIMEOUT_MS: String(CLAUDE_BUILDER_BASH_LIMIT_MS),
});

writeBrief("Feature: FEAT-006 · Claude builder\n\nPrecedent:\n- seed\n");
removeArtifacts();
const launch = runWorker();
const launchCall = readRows(RECORD)[0];
const expectedArgv = launchCall ? [
	CLAUDE_PRINT_FLAG,
	CLAUDE_MODEL_FLAG, "fable",
	CLAUDE_PERMISSION_MODE_FLAG, CLAUDE_BUILDER_PERMISSION_MODE,
	CLAUDE_SETTING_SOURCES_FLAG, CLAUDE_BUILDER_SETTING_SOURCES,
	CLAUDE_SETTINGS_FLAG, launchCall.settings,
	CLAUDE_STRICT_MCP_FLAG,
	CLAUDE_TOOLS_FLAG, CLAUDE_BUILDER_TOOLS,
	CLAUDE_ALLOW_FLAG, CLAUDE_BUILDER_TOOLS,
	CLAUDE_APPEND_PROMPT_FILE_FLAG, launchCall.prompt,
	"Do the work in your brief for lane alpha. Your cwd is the lane worktree. Finish with the report shape the brief gives.",
] : [];
const argvPrefixOk = launchCall && JSON.stringify(launchCall.argv.slice(0, expectedArgv.length)) === JSON.stringify(expectedArgv);
const nameTail = launchCall?.argv.slice(expectedArgv.length) ?? [];
// req: R-2646
check("R-2646: lane size larger starts a Claude Code larger-lane builder as claude -p with its model, default permission mode, project settings only, no MCP servers and the builder tools, in the locked worktree",
	launch.status === 0 && readRows(RECORD).length === 1 && argvPrefixOk && nameTail.length === 2 && nameTail[0] === "--name" && /^pi-worker-a1-\d+$/.test(nameTail[1]) &&
	launchCall.cwd === real(LANE) && launchCall.lock && launchCall.env.NANA_ROLE === "worker" && launchCall.env.NANA_WORKTREE_ROOT === real(LANE) && launchCall.env.NANA_HANDOFF === "off" &&
	!launchCall.argv.includes("--provider") && !launchCall.argv.includes("--thinking") && !launchCall.argv.includes("-t") && fs.readFileSync(OUT, "utf8") === "fake Claude builder report\n" &&
	!fs.existsSync(LOCK) && !fs.existsSync(PI_MARKER), JSON.stringify({ status: launch.status, stderr: launch.stderr, call: launchCall, expectedArgv }));

const promptBrief = Buffer.from("Feature: FEAT-006 · Prompt\r\n\r\nPrecedent:\r\n- seed\t");
writeBrief(promptBrief); removeArtifacts();
const promptRun = runWorker();
const promptCall = readRows(RECORD)[0];
const promptCopy = fs.existsSync(PROMPT_COPY) ? fs.readFileSync(PROMPT_COPY) : Buffer.alloc(0);
const promptChecks = {
	status: promptRun.status === 0,
	call: Boolean(promptCall),
	bytes: Boolean(promptCall) && Buffer.compare(promptCopy, expectedPrompt(promptBrief, true, promptCall.cwd)) === 0,
	rendered: !promptCopy.toString("utf8").includes("{{"),
	briefAfterPreamble: promptCopy.indexOf(promptBrief) > 0,
	bugsAfterBrief: promptCopy.indexOf(Buffer.from(BUG_TEXT)) > promptCopy.indexOf(promptBrief),
	bugsOnce: promptCopy.toString("utf8").split(BUG_TEXT).length - 1 === 1,
	outsideWorktree: Boolean(promptCall) && !path.relative(real(LANE), promptCall.prompt).split(path.sep).every((part) => part !== ".."),
	removed: Boolean(promptCall) && !fs.existsSync(promptCall.prompt),
};
const noFeatureBrief = Buffer.from("No feature line here.\r\n\r\nPrecedent:\r\n- seed\t");
writeBrief(noFeatureBrief); removeArtifacts();
const noFeatureRun = runWorker();
const noFeatureCall = readRows(RECORD)[0];
const noFeatureCopy = fs.existsSync(PROMPT_COPY) ? fs.readFileSync(PROMPT_COPY) : Buffer.alloc(0);
const cleanStatus = git(LANE, "status", "--porcelain");
const noFeatureChecks = {
	status: noFeatureRun.status === 0,
	call: Boolean(noFeatureCall),
	bytes: Boolean(noFeatureCall) && Buffer.compare(noFeatureCopy, expectedPrompt(noFeatureBrief, false, noFeatureCall.cwd)) === 0,
	noFeatureBugs: !noFeatureCopy.toString("utf8").includes(BUG_TEXT),
	noUnplacedBugs: !noFeatureCopy.toString("utf8").includes("Unplaced fixture"),
	removed: Boolean(noFeatureCall) && !fs.existsSync(noFeatureCall.prompt),
	clean: cleanStatus === "",
};
// req: R-2647
check("R-2647: the Claude Code builder's prompt file holds the rendered preamble, the brief and the feature's known bugs once each in that order, and is gone after the build",
	Object.values(promptChecks).every(Boolean) && Object.values(noFeatureChecks).every(Boolean),
	JSON.stringify({ promptChecks, promptStderr: promptRun.stderr, noFeatureChecks, noFeatureStderr: noFeatureRun.stderr, cleanStatus }));

const precedentCases = [
	["missing", "Feature: FEAT-006 · Missing\n"],
	["empty", "## Precedent\n\n## Done\n"],
	["reasonless", "Precedent:\n- none:\t"],
	["untracked", "Precedent:\n- missing.mjs\n"],
	["passing", "Feature: FEAT-006 · Passing\r\n\r\nPrecedent:\r\n- seed\t"],
];
const precedentObservations = [];
for (const [name, text] of precedentCases) {
	writeBrief(text); removeArtifacts();
	const checked = spawnSync(process.execPath, [BRIEF_CHECK, "--brief", BRIEF, "--tree", LANE], { cwd: TEMP, encoding: "utf8", timeout: CASE_LIMIT_MS, env: baseEnv() });
	const built = runWorker();
	precedentObservations.push({ name, checked: checked.status, built: built.status, checkLine: selectedBriefLine(checked.stderr), workerLine: selectedBriefLine(built.stderr), ran: readRows(RECORD).length, lock: fs.existsSync(LOCK), pi: fs.existsSync(PI_MARKER) });
}
// req: R-2648
check("R-2648: for a Claude Code builder a failing brief is refused with brief-check's line before the lock and claude, and a passing brief prints brief-check's launch line",
	precedentObservations.every((item, index) => item.checked === item.built && item.checkLine === item.workerLine && (index === precedentObservations.length - 1 ? item.built === 0 && item.ran === 1 && item.workerLine?.startsWith("pi-worker: precedent:") : item.built === 1 && item.ran === 0 && !item.lock && !item.pi)),
	JSON.stringify(precedentObservations));

writeBrief("Precedent:\n- seed\n"); removeArtifacts();
const lineRun = runWorker();
const builderLines = lineRun.stderr.split(/\r?\n/).filter((line) => line.startsWith("pi-worker: builder"));
const builderIndex = lineRun.stderr.indexOf("pi-worker: builder (larger lanes):");
const attemptIndex = lineRun.stderr.indexOf("[pi-worker] attempt 1/1");
// req: R-2649
check("R-2649: a Claude Code larger-lane launch prints one builder line naming claude-code and its model before claude starts",
	lineRun.status === 0 && builderLines.length === 1 && builderLines[0] === `pi-worker: builder (larger lanes): claude-code fable; source: ${path.join(AGENT, "nana-pack.json")}` && !builderLines[0].includes("undefined") && builderIndex >= 0 && builderIndex < attemptIndex,
	lineRun.stderr);

let windowsPass = true;
let windowsDetail = "Windows leg only";
if (process.platform === "win32") {
	const specialBrief = Buffer.from("Feature: FEAT-006 · Windows\r\n\r\nText \"quoted\" 100% bang!\r\nPrecedent:\r\n- seed\t");
	writeBrief(specialBrief); removeArtifacts();
	const windowsRun = runWorker();
	const call = readRows(RECORD)[0];
	const prompt = fs.existsSync(PROMPT_COPY) ? fs.readFileSync(PROMPT_COPY) : Buffer.alloc(0);
	windowsPass = windowsRun.status === 0 && call && call.argv.includes(CLAUDE_SETTINGS_FLAG) && call.argv[call.argv.indexOf(CLAUDE_SETTINGS_FLAG) + 1] === call.settings &&
		call.argv.includes(CLAUDE_BUILDER_TOOLS) && call.argv.includes(CLAUDE_BUILDER_SETTING_SOURCES) && prompt.indexOf(specialBrief) >= 0 &&
		fs.existsSync(OUT) && fs.readFileSync(OUT, "utf8") === "fake Claude builder report\n";
	windowsDetail = JSON.stringify({ result: windowsRun, call });
}
// req: R-2650
check("R-2650: Windows: a claude.cmd larger-lane builder starts through cmd.exe with its arguments unchanged and a brief holding quotes, percent, bang and line breaks intact in its prompt file", windowsPass, windowsDetail, process.platform !== "win32");

writeBrief("Precedent:\n- seed\n"); removeArtifacts();
const flatRun = runWorker({ extra: ["--stall-secs", "1", "--poll", "0.2", "--max-secs", "10"], env: { WC_SLEEP_MS: "3000" } });
const flatOk = flatRun.status === 0 && !flatRun.stderr.includes("STALL") && fs.readFileSync(OUT, "utf8") === "fake Claude builder report\n";
removeArtifacts();
const ceilingRun = runWorker({ extra: ["--stall-secs", "10", "--max-secs", "1"], env: { WC_SLEEP_MS: "10000" } });
const ceilingPid = fs.existsSync(PID_FILE) ? Number(fs.readFileSync(PID_FILE, "utf8")) : null;
await new Promise((resolve) => setTimeout(resolve, 100));
let ceilingAlive = false;
try { if (ceilingPid) process.kill(ceilingPid, 0); ceilingAlive = Boolean(ceilingPid); } catch {}
let signalOk = true;
let signalDetail = "Windows has no catchable SIGTERM child signal in this harness";
if (process.platform !== "win32") {
	removeArtifacts();
	const child = spawn(process.execPath, workerArgs(BRIEF, ["--stall-secs", "10", "--max-secs", "10"]), { cwd: LANE, env: baseEnv({ WC_SLEEP_MS: "10000" }), stdio: ["ignore", "ignore", "pipe"] });
	let stderr = ""; child.stderr.on("data", (chunk) => { stderr += chunk; });
	const childEnded = new Promise((resolve) => child.once("close", (code, signal) => resolve({ code, signal })));
	const deadline = Date.now() + 5000;
	while (!fs.existsSync(PID_FILE) && child.exitCode === null && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 25));
	if (fs.existsSync(PID_FILE)) child.kill("SIGTERM");
	const ended = await Promise.race([
		childEnded,
		new Promise((resolve) => setTimeout(() => { try { child.kill("SIGKILL"); } catch {} resolve({ code: null, signal: "TIMEOUT" }); }, CASE_LIMIT_MS)),
	]);
	signalOk = ended.code === 143 && stderr.includes("[pi-worker] aborted by SIGTERM");
	signalDetail = JSON.stringify({ ended, stderr });
} else console.log("SKIP R-2651 SIGTERM subcase — POSIX signal delivery only");
// req: R-2651
check("R-2651: a Claude Code builder whose CPU stays flat past the stall limit runs to its end, and the ceiling and SIGTERM still stop it",
	flatOk && ceilingRun.status === 1 && ceilingRun.stderr.includes("wall-clock ceiling 1s reached") && !ceilingAlive && signalOk,
	JSON.stringify({ flat: flatRun.stderr, ceiling: ceilingRun.stderr, ceilingAlive, signalDetail }));

writeBrief("Precedent:\n- seed\n"); removeArtifacts();
const envRun = runWorker({ env: { BASH_DEFAULT_TIMEOUT_MS: "7" } });
const envCall = readRows(RECORD)[0];
// req: R-2654
check("R-2654: a Claude Code builder runs with auto-memory off and the builder Bash limit as both Bash time limits",
	envRun.status === 0 && envCall?.env.CLAUDE_CODE_DISABLE_AUTO_MEMORY === "1" && envCall.env.BASH_DEFAULT_TIMEOUT_MS === String(CLAUDE_BUILDER_BASH_LIMIT_MS) && envCall.env.BASH_MAX_TIMEOUT_MS === String(CLAUDE_BUILDER_BASH_LIMIT_MS),
	JSON.stringify({ result: envRun, call: envCall }));

const userSettingsDir = path.join(HOME, ".claude");
fs.mkdirSync(userSettingsDir, { recursive: true });
const homeSettings = path.join(userSettingsDir, "settings.json");
const secretOne = "sk-ant-SECRET-MARKER-1";
fs.writeFileSync(homeSettings, JSON.stringify({
	apiKeyHelper: "/fake/api-helper",
	awsCredentialExport: "/fake/aws-helper",
	proxyAuthHelper: "/fake/proxy-helper",
	hooks: { Stop: [{ command: "never" }] },
	permissions: { defaultMode: "plan", deny: ["Bash"] },
	enabledPlugins: { unsafe: true },
	model: "haiku",
	otelHeadersHelper: "/fake/otel-helper",
	awsAuthRefresh: "/fake/refresh",
	env: {
		HTTPS_PROXY: "http://proxy.invalid:1",
		no_proxy: "localhost",
		NODE_EXTRA_CA_CERTS: "/fake/ca.pem",
		ANTHROPIC_API_KEY: secretOne,
		CLAUDE_CONFIG_DIR: "/wrong/config",
		CLAUDE_CODE_PLUGIN_DIRS: "/wrong/plugins",
		CLAUDE_ENV_FILE: "/wrong/env",
		NODE_OPTIONS: "--require /wrong/preload",
		CLAUDE_CODE_USE_BEDROCK: "1",
		PROBE_OTHER: "not-carried",
	},
}));
writeBrief("Precedent:\n- seed\n"); removeArtifacts();
const carryRun = runWorker();
const carryCall = readRows(RECORD)[0];
const carried = fs.existsSync(SETTINGS_COPY) ? JSON.parse(fs.readFileSync(SETTINGS_COPY, "utf8")) : null;
const carryTop = carried ? Object.keys(carried).sort() : [];
const carryEnv = carried ? Object.keys(carried.env).sort() : [];
const expectedCarryEnv = [...new Set(["HTTPS_PROXY", "no_proxy", "NODE_EXTRA_CA_CERTS", "ANTHROPIC_API_KEY", ...Object.keys(sealedEnv())])].sort();
const carryLines = carryRun.stderr.split(/\r?\n/).filter((line) => line.startsWith("pi-worker: claude settings carry:"));
const expectedCarryLine = `pi-worker: claude settings carry: apiKeyHelper, awsCredentialExport, proxyAuthHelper, env ANTHROPIC_API_KEY, HTTPS_PROXY, NODE_EXTRA_CA_CERTS, no_proxy; source: ${homeSettings}`;
const allCarryOutput = `${carryRun.stdout}\n${carryRun.stderr}\n${fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : ""}\n${fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, "utf8") : ""}`;
const configDir = path.join(TEMP, "config-home"); fs.mkdirSync(configDir, { recursive: true });
const configSettings = path.join(configDir, "settings.json");
fs.writeFileSync(configSettings, JSON.stringify({ env: { HTTPS_PROXY: "http://cfg.invalid:2" } }));
removeArtifacts();
const configCarryRun = runWorker({ env: { CLAUDE_CONFIG_DIR: configDir } });
const configCarried = fs.existsSync(SETTINGS_COPY) ? JSON.parse(fs.readFileSync(SETTINGS_COPY, "utf8")) : null;
const configCall = readRows(RECORD)[0];
// req: R-2655
check("R-2655: a Claude Code builder gets a settings file outside the worktree carrying only the login keys and network env names from the user settings, named in one line without values, and gone after the build",
	carryRun.status === 0 && carryCall && JSON.stringify(carryTop) === JSON.stringify(["apiKeyHelper", "awsCredentialExport", "env", "proxyAuthHelper"]) &&
	JSON.stringify(carryEnv) === JSON.stringify(expectedCarryEnv) && carried.apiKeyHelper === "/fake/api-helper" && carried.env.ANTHROPIC_API_KEY === secretOne && carried.env.no_proxy === "localhost" &&
	carryLines.length === 1 && carryLines[0] === expectedCarryLine && !allCarryOutput.includes(secretOne) && !path.relative(real(LANE), carryCall.settings).split(path.sep).every((part) => part !== "..") &&
	!fs.existsSync(carryCall.settings) && (process.platform === "win32" || (carryCall.settingsMode & 0o077) === 0) && git(LANE, "status", "--porcelain") === "" &&
	configCarryRun.status === 0 && configCall?.env.CLAUDE_CONFIG_DIR === configDir && configCarried?.env.HTTPS_PROXY === "http://cfg.invalid:2" && configCarryRun.stderr.includes(`source: ${configSettings}`),
	JSON.stringify({ carryResult: carryRun.status, carryStderr: carryRun.stderr, carryCall, carried, configResult: configCarryRun.status, configStderr: configCarryRun.stderr, configCarried }));

fs.writeFileSync(homeSettings, JSON.stringify({ env: {
	CLAUDE_CODE_DISABLE_AUTO_MEMORY: "0",
	nana_role: "seat",
	NANA_WORKTREE_ROOT: "/elsewhere",
	NANA_HANDOFF: "on",
	BASH_MAX_TIMEOUT_MS: "5",
} }));
removeArtifacts();
const sealedRun = runWorker();
const sealedCall = readRows(RECORD)[0];
const sealedSettings = fs.existsSync(SETTINGS_COPY) ? JSON.parse(fs.readFileSync(SETTINGS_COPY, "utf8")) : null;
const sealedNames = Object.keys(sealedEnv());
const noFoldedDuplicate = sealedSettings && sealedNames.every((name) => Object.keys(sealedSettings.env).filter((candidate) => candidate.toLowerCase() === name.toLowerCase()).length === 1);
// req: R-2664
check("R-2664: the builder's settings file holds the sealed builder env whatever the user settings env says",
	sealedRun.status === 0 && sealedSettings && JSON.stringify(sealedSettings.env) === JSON.stringify(sealedEnv()) && noFoldedDuplicate && sealedNames.every((name) => sealedCall?.env[name] === sealedEnv()[name]),
	JSON.stringify({ result: sealedRun, call: sealedCall, settings: sealedSettings }));

const failureCases = [
	["missing", "not found", () => fs.rmSync(homeSettings, { recursive: true, force: true })],
	["unreadable", "cannot read (EISDIR)", () => fs.mkdirSync(homeSettings, { recursive: true })],
	["malformed", "not valid JSON", () => fs.writeFileSync(homeSettings, '{"env": sk-ant-SECRET-MARKER-2}')],
	["non-object", "not a JSON object", () => fs.writeFileSync(homeSettings, '["sk-ant-SECRET-MARKER-3"]')],
];
const failureObservations = [];
for (const [name, reason, arrange] of failureCases) {
	fs.rmSync(homeSettings, { recursive: true, force: true });
	arrange(); removeArtifacts();
	const result = runWorker();
	const call = readRows(RECORD)[0];
	const copy = fs.existsSync(SETTINGS_COPY) ? JSON.parse(fs.readFileSync(SETTINGS_COPY, "utf8")) : null;
	const carry = result.stderr.split(/\r?\n/).filter((line) => line.startsWith("pi-worker: claude settings carry:"));
	const outputs = `${result.stdout}\n${result.stderr}\n${fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : ""}`;
	failureObservations.push({ name, ok: result.status === 0 && readRows(RECORD).length === 1 && carry.length === 1 && carry[0] === `pi-worker: claude settings carry: none; ${reason}; source: ${homeSettings}` && !outputs.includes("sk-ant-SEC") && !outputs.includes("SECRET-MARKER") && copy && JSON.stringify(Object.keys(copy)) === JSON.stringify(["env"]) && JSON.stringify(copy.env) === JSON.stringify(sealedEnv()) && call?.argv.includes(CLAUDE_SETTINGS_FLAG), status: result.status, stderr: result.stderr, copy });
}
// req: R-2665
check("R-2665: a missing, unreadable, malformed or non-object user settings file prints one carry line without its content, and the builder still starts with only the sealed env",
	failureObservations.every((item) => item.ok), JSON.stringify(failureObservations));

const literalCarryNames = [
	"HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY", "ALL_PROXY", "CLAUDE_CODE_PROXY_RESOLVES_HOSTS", "CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS", "CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER",
	"NODE_EXTRA_CA_CERTS", "CLAUDE_CODE_CERT_STORE", "CLAUDE_CODE_CLIENT_CERT", "CLAUDE_CODE_CLIENT_KEY", "CLAUDE_CODE_CLIENT_KEY_PASSPHRASE",
	"ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_CUSTOM_HEADERS",
];
const foldedCarry = new Set((CLAUDE_CARRY_ENV_NAMES ?? []).map((name) => name.toLowerCase()));
// req: R-2646 R-2651 R-2654 R-2655
check("seal: a Claude Code builder uses default permission mode, project and local settings, a carried settings file, no MCP servers, tools Read,Grep,Glob,Bash,Edit,Write, a prompt file, no stall stop, auto-memory off and the builder Bash limit",
	CLAUDE_BIN === "claude" && CLAUDE_PRINT_FLAG === "-p" && CLAUDE_MODEL_FLAG === "--model" && CLAUDE_ALLOW_FLAG === "--allowedTools" &&
	CLAUDE_PERMISSION_MODE_FLAG === "--permission-mode" && CLAUDE_BUILDER_PERMISSION_MODE === "default" && CLAUDE_SETTING_SOURCES_FLAG === "--setting-sources" && CLAUDE_BUILDER_SETTING_SOURCES === "project,local" &&
	CLAUDE_SETTINGS_FLAG === "--settings" && CLAUDE_STRICT_MCP_FLAG === "--strict-mcp-config" && CLAUDE_TOOLS_FLAG === "--tools" && CLAUDE_BUILDER_TOOLS === "Read,Grep,Glob,Bash,Edit,Write" &&
	CLAUDE_APPEND_PROMPT_FILE_FLAG === "--append-system-prompt-file" && CLAUDE_BUILDER_PROMPT_FILE === "builder-prompt.md" && CLAUDE_BUILDER_SETTINGS_FILE === "builder-settings.json" && CLAUDE_BUILDER_STALL_SECS === Infinity &&
	JSON.stringify(CLAUDE_BUILDER_CHILD_ENV) === JSON.stringify({ CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" }) && CLAUDE_BUILDER_BASH_LIMIT_MS === 3600000 &&
	JSON.stringify(CLAUDE_CARRY_KEYS) === JSON.stringify(["apiKeyHelper", "awsCredentialExport", "proxyAuthHelper"]) && JSON.stringify(CLAUDE_CARRY_ENV_NAMES) === JSON.stringify(literalCarryNames) &&
	Object.keys(sealedEnv()).every((name) => !foldedCarry.has(name.toLowerCase())), JSON.stringify(config));

fs.rmSync(TEMP, { recursive: true, force: true });
console.log(failures ? `${failures} FAILED` : "all passed");
process.exit(failures ? 1 : 0);
