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
import { killTree } from "../../../scripts/runtime-measure.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import { hardKillTempNames, killWorkerTree, watcherWorkerPid, windowsLaneWatchers } from "./process-tree-helper.mjs";
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
	LANE_BUILDER_PID_FILE,
	LANE_WATCHER_POLL_MS,
	LANE_WATCHER_REMOVE_RETRIES,
	LANE_WATCHER_REMOVE_RETRY_MS,
	LANE_WATCHER_STOP_WAIT_MS,
} = config;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACK = path.resolve(HERE, "..");
const WORKER = path.join(PACK, "bin", "pi-worker.mjs");
const BRIEF_CHECK = path.join(PACK, "bin", "brief-check.mjs");
const PREAMBLE = path.join(PACK, "prompts", "builder-preamble.md");
const CASE_LIMIT_MS = 20_000;
const STARTUP_SIGNAL_READY_LIMIT_MS = 5_000; // Chosen to bound fixture readiness below the per-case watchdog.
const BLOCKING_READ_SETTLE_MS = 500; // Chosen to let the selected start-up read begin after the precedent line.
const BLOCKING_READ_END_MS = 2_000; // Chosen to bound a lost SIGTERM well below the per-case watchdog.
const BLOCKING_HELPER_HANG_MS = 30_000; // Chosen to outlast both the bounded signal wait and the per-case watchdog.
const BLOCKING_HELPER_STOP_MS = 1_000; // Chosen to bound orphan cleanup after a FIFO is released or a helper is killed.
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
const DECOY_CONFIG = path.join(TEMP, "decoy-claude-config");
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

for (const directory of [REPO, HOME, AGENT, BIN, DECOY_CONFIG]) fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(DECOY_CONFIG, "settings.json"), JSON.stringify({ env: { HTTPS_PROXY: "http://decoy.invalid:9" } }));
process.env.CLAUDE_CONFIG_DIR = DECOY_CONFIG;
git(REPO, "init", "-q", "-b", "main");
fs.writeFileSync(path.join(REPO, "seed"), "seed\n");
fs.mkdirSync(path.join(REPO, "docs", "known-bugs"), { recursive: true });
const BUG_TEXT = "# FEAT-006 fixture bugs\n\n- fixture bug\n";
fs.writeFileSync(path.join(REPO, "docs", "known-bugs", "FEAT-006.md"), BUG_TEXT);
fs.writeFileSync(path.join(REPO, "docs", "known-bugs", "unplaced.md"), "# Unplaced fixture\n\n- never attach me\n");
git(REPO, "add", "seed", "docs/known-bugs/FEAT-006.md", "docs/known-bugs/unplaced.md");
git(REPO, "commit", "-qm", "seed");
git(REPO, "worktree", "add", "-q", "-b", "feat/alpha", LANE);
const BUG_BYTES = fs.readFileSync(path.join(LANE, "docs", "known-bugs", "FEAT-006.md"));
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
if (process.env.WC_GRANDCHILD) {
	const grand = require("node:child_process").spawn(process.execPath, ["-e", "setInterval(()=>{},100000)"], { stdio: "ignore" });
	if (process.env.WC_PID_FILE) fs.writeFileSync(process.env.WC_PID_FILE + ".grand", String(grand.pid));
	process.on("SIGTERM", () => {});
}
const record = { argv: args, cwd: process.cwd(), prompt, settings, settingsMode: settings ? fs.statSync(settings).mode : null, lock: process.env.WC_LOCK ? fs.existsSync(process.env.WC_LOCK) : false, env: Object.fromEntries(["NANA_ROLE","NANA_WORKTREE_ROOT","NANA_HANDOFF","CLAUDE_CODE_DISABLE_AUTO_MEMORY","BASH_DEFAULT_TIMEOUT_MS","BASH_MAX_TIMEOUT_MS","CLAUDE_CONFIG_DIR"].map((name) => [name, process.env[name] ?? null])) };
if (process.env.WC_RECORD) fs.appendFileSync(process.env.WC_RECORD, JSON.stringify(record) + "\\n");
setTimeout(() => { process.stdout.write("fake Claude builder report\\n"); }, Number(process.env.WC_SLEEP_MS ?? "0"));
`;
const fakeScript = path.join(BIN, "fake-claude.cjs");
fs.writeFileSync(fakeScript, FAKE_BODY);
if (process.platform === "win32") {
	fs.writeFileSync(path.join(BIN, "claude.cmd"), `@echo off\r\n"${process.execPath}" "${fakeScript}" %*\r\n`);
	writeFakePi(BIN, `const fs=require("node:fs"); if(process.env.WC_PI_SLEEP_SECS){fs.writeFileSync(process.env.WC_PID_FILE,String(process.pid));setTimeout(()=>process.stdout.write("fake pi\\n"),Number(process.env.WC_PI_SLEEP_SECS)*1000)}else{fs.writeFileSync(${JSON.stringify(PI_MARKER)},"spawned\\n");if(process.env.WC_HOLD_FILE){const wait=()=>fs.existsSync(process.env.WC_HOLD_FILE)?process.stdout.write("fake pi\\n"):setTimeout(wait,10);wait()}else process.stdout.write("fake pi\\n")}`);
} else {
	fs.writeFileSync(path.join(BIN, "claude"), `#!${process.execPath}\nrequire(${JSON.stringify(fakeScript)});\n`, { mode: 0o755 });
	fs.writeFileSync(path.join(BIN, "pi"), `#!/bin/sh\nif [ -n "$WC_PI_SLEEP_SECS" ]; then printf '%s\\n' "$$" > "$WC_PID_FILE"; exec sleep "$WC_PI_SLEEP_SECS"; fi\nprintf 'spawned\\n' > "${PI_MARKER}"\nif [ -n "$WC_HOLD_FILE" ]; then while [ ! -e "$WC_HOLD_FILE" ]; do sleep 0.01; done; fi\nprintf 'fake pi\\n'\n`, { mode: 0o755 });
}

const baseEnv = (extra = {}) => {
	const env = {
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
	};
	delete env.CLAUDE_CONFIG_DIR;
	return { ...env, ...extra };
};
const writeBrief = (bytes) => { fs.writeFileSync(BRIEF, bytes); return BRIEF; };
const workerArgs = (brief = BRIEF, extra = []) => [
	WORKER,
	...(extra.includes("--poll") ? [] : ["--poll", "0.2"]),
	...(extra.includes("--stall-secs") ? [] : ["--stall-secs", "2"]),
	...(extra.includes("--out") ? [] : ["--out", OUT]),
	"--lane", "alpha", "--brief", brief,
	...(extra.includes("--lane-size") ? [] : ["--lane-size", "larger"]),
	...extra,
];
const runWorker = ({ brief = BRIEF, extra = [], env = {}, timeout = CASE_LIMIT_MS } = {}) => spawnSync(process.execPath, workerArgs(brief, extra), {
	cwd: LANE,
	encoding: "utf8",
	timeout,
	env: baseEnv(env),
});
const caseTemp = (name) => tmpDir(path.join(TEMP, `${name}-`));
const tempEnv = (root, extra = {}) => ({ TMPDIR: root, TEMP: root, TMP: root, ...extra });
const tempEmpty = (root) => fs.readdirSync(root).length === 0;
const hardKillTempNamesCheck = () => {
	const root = caseTemp("R-2803");
	const entries = [
		["zulu-folder", "folder"],
		["beta-file", "file"],
		["omega-folder", "folder"],
		["alpha-file", "file"],
		["middle-folder", "folder"],
	];
	for (const [name, kind] of entries) {
		const entry = path.join(root, name);
		if (kind === "folder") fs.mkdirSync(entry);
		else fs.writeFileSync(entry, name);
	}
	const occupied = hardKillTempNames(root);
	for (const [name] of entries) fs.rmSync(path.join(root, name), { recursive: true });
	const policyName = "__PSScriptPolicyTest_lvnwlq0m.dy0.ps1";
	fs.writeFileSync(path.join(root, policyName), "policy test");
	const policyOnly = hardKillTempNames(root);
	fs.rmSync(path.join(root, policyName));
	const empty = hardKillTempNames(root);
	fs.rmSync(root, { recursive: true });
	const missing = hardKillTempNames(root);
	const expected = ["alpha-file", "beta-file", "middle-folder", "omega-folder", "zulu-folder"];
	return JSON.stringify(occupied) === JSON.stringify(expected) &&
		JSON.stringify(policyOnly) === JSON.stringify([policyName]) && empty.length === 0 && missing.length === 0;
};
// req: R-2803
check("R-2803: the hard-kill temp check names every entry left in a case temp folder and calls it empty only when none is left", hardKillTempNamesCheck());
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const startWorker = ({ brief = BRIEF, extra = [], env = {} } = {}) => {
	const child = spawn(process.execPath, workerArgs(brief, extra), { cwd: LANE, env: baseEnv(env), stdio: ["ignore", "ignore", "pipe"] });
	let stderr = "";
	child.stderr.on("data", (chunk) => { stderr += chunk; });
	let forceTimer;
	const closed = new Promise((resolve) => {
		const timer = setTimeout(() => {
			try { child.kill("SIGKILL"); } catch {}
			forceTimer = setTimeout(() => resolve({ code: null, signal: "TIMEOUT" }), 1000);
		}, CASE_LIMIT_MS);
		child.once("close", (code, signal) => {
			clearTimeout(timer);
			clearTimeout(forceTimer);
			resolve({ code, signal });
		});
	});
	return { child, closed, stderr: () => stderr };
};
const waitFor = async (predicate, child, limit = 5000) => {
	const deadline = Date.now() + limit;
	while (!predicate() && child.exitCode === null && child.signalCode === null && Date.now() < deadline) await delay(1);
	return predicate();
};
const waitUntil = async (predicate, limit = CASE_LIMIT_MS) => {
	const deadline = Date.now() + limit;
	while (!predicate() && Date.now() < deadline) await delay(10);
	return predicate();
};
const watchersFor = (root) => {
	if (process.platform === "win32") return windowsLaneWatchers(root, { timeout: CASE_LIMIT_MS });
	const result = spawnSync("ps", ["-A", "-ww", "-o", "pid=,ppid=,args="], { encoding: "utf8", timeout: CASE_LIMIT_MS });
	return result.status === 0 ? result.stdout.split("\n").filter((line) => line.includes("lane-watcher-child.mjs") && line.includes(root)).map((line) => {
		const match = /^\s*(\d+)\s+(\d+)\s+/.exec(line);
		return { pid: Number(match?.[1]), ppid: Number(match?.[2]), line };
	}) : [];
};
const watcherReady = async (root) => waitUntil(() => {
	const found = watchersFor(root);
	return found.filter((item) => item.line.includes("--watch")).length === 1 && found.every((item) => !item.line.includes("--hop"));
}, 5_000);
const pidAlive = (pid) => {
	if (!Number.isSafeInteger(pid) || pid <= 0) return false;
	try { process.kill(pid, 0); return true; } catch (error) { return error?.code === "EPERM"; }
};
const groupAlive = (pid) => {
	if (process.platform === "win32" || !Number.isSafeInteger(pid)) return false;
	try { process.kill(-pid, 0); return true; } catch (error) { return error?.code === "EPERM"; }
};
const stopFixtureBuilder = () => {
	if (process.platform === "win32" || !fs.existsSync(PID_FILE)) return;
	const pid = Number(fs.readFileSync(PID_FILE, "utf8"));
	if (!Number.isSafeInteger(pid) || pid <= 0) return;
	try { process.kill(-pid, "SIGKILL"); } catch { try { process.kill(pid, "SIGKILL"); } catch {} }
};
const selectedBriefLine = (stderr) => stderr.split(/\r?\n/).find((line) => line.startsWith("pi-worker: lane refused:") || line.startsWith("pi-worker: precedent:")) ?? null;
const expectedPrompt = (briefBytes, withBugs, launchedCwd = LANE) => {
	const worktree = process.platform === "win32" ? fs.realpathSync.native(launchedCwd) : fs.realpathSync(launchedCwd);
	const preamble = fs.readFileSync(PREAMBLE, "utf8").replaceAll("{{WORKTREE}}", worktree).replaceAll("{{BRANCH}}", "feat/alpha");
	return Buffer.concat([Buffer.from(preamble), Buffer.from("\n\n"), Buffer.from(briefBytes), ...(withBugs ? [Buffer.from("\n\n"), BUG_BYTES] : [])]);
};
const countBytes = (haystack, needle) => {
	let count = 0;
	for (let at = 0; (at = haystack.indexOf(needle, at)) >= 0; at += needle.length) count++;
	return count;
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
	fixtureBug: BUG_BYTES.includes(Buffer.from("- fixture bug")),
	bytes: Boolean(promptCall) && typeof promptCall.cwd === "string" && Buffer.compare(promptCopy, expectedPrompt(promptBrief, true, promptCall.cwd)) === 0,
	rendered: !promptCopy.toString("utf8").includes("{{"),
	briefAfterPreamble: promptCopy.indexOf(promptBrief) > 0,
	bugsAfterBrief: promptCopy.indexOf(BUG_BYTES) > promptCopy.indexOf(promptBrief),
	bugsOnce: countBytes(promptCopy, BUG_BYTES) === 1,
	outsideWorktree: typeof promptCall?.prompt === "string" && typeof promptCall.cwd === "string" && !path.relative(real(LANE), promptCall.prompt).split(path.sep).every((part) => part !== ".."),
	removed: typeof promptCall?.prompt === "string" && !fs.existsSync(promptCall.prompt),
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
	bytes: Boolean(noFeatureCall) && typeof noFeatureCall.cwd === "string" && Buffer.compare(noFeatureCopy, expectedPrompt(noFeatureBrief, false, noFeatureCall.cwd)) === 0,
	noFeatureBugs: noFeatureCopy.indexOf(BUG_BYTES) < 0 && !noFeatureCopy.toString("utf8").includes(BUG_TEXT),
	noUnplacedBugs: !noFeatureCopy.toString("utf8").includes("Unplaced fixture"),
	removed: typeof noFeatureCall?.prompt === "string" && !fs.existsSync(noFeatureCall.prompt),
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
const expectedCarryEnv = [...new Set(["HTTPS_PROXY", "no_proxy", "NODE_EXTRA_CA_CERTS", "ANTHROPIC_API_KEY", "CLAUDE_CODE_USE_BEDROCK", ...Object.keys(sealedEnv())])].sort();
const carryLines = carryRun.stderr.split(/\r?\n/).filter((line) => line.startsWith("pi-worker: claude settings carry:"));
const expectedCarryLine = `pi-worker: claude settings carry: apiKeyHelper, awsAuthRefresh, awsCredentialExport, proxyAuthHelper, env ANTHROPIC_API_KEY, CLAUDE_CODE_USE_BEDROCK, HTTPS_PROXY, NODE_EXTRA_CA_CERTS, no_proxy; source: ${homeSettings}`;
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
	carryRun.status === 0 && carryCall && JSON.stringify(carryTop) === JSON.stringify(["apiKeyHelper", "awsAuthRefresh", "awsCredentialExport", "claudeMdExcludes", "env", "proxyAuthHelper"]) &&
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
	failureObservations.push({ name, ok: result.status === 0 && readRows(RECORD).length === 1 && carry.length === 1 && carry[0] === `pi-worker: claude settings carry: none; ${reason}; source: ${homeSettings}` && !outputs.includes("sk-ant-SEC") && !outputs.includes("SECRET-MARKER") && copy && JSON.stringify(Object.keys(copy)) === JSON.stringify(["claudeMdExcludes", "env"]) && JSON.stringify(copy.env) === JSON.stringify(sealedEnv()) && call?.argv.includes(CLAUDE_SETTINGS_FLAG), status: result.status, stderr: result.stderr, copy });
}
// req: R-2665
check("R-2665: a missing, unreadable, malformed or non-object user settings file prints one carry line without its content, and the builder still starts with only the sealed env",
	failureObservations.every((item) => item.ok), JSON.stringify(failureObservations));

fs.rmSync(homeSettings, { recursive: true, force: true });
fs.writeFileSync(homeSettings, JSON.stringify({ apiKeyHelper: "/fake/early-helper", env: { ANTHROPIC_API_KEY: "sk-ant-EARLY-REFUSAL" } }));
writeBrief("Precedent:\n- seed\n");
const reviewOptionCases = [
	["--item", ["--item", "x"]],
	["--role", ["--role", "sol"]],
	["--revision", ["--revision", "HEAD"]],
	["--over-cap", ["--over-cap", "why"]],
	["--worker", ["--worker"]],
];
const reviewOptionObservations = [];
for (const [option, extra] of reviewOptionCases) {
	removeArtifacts(); fs.rmSync(LOCK, { force: true });
	const root = caseTemp(`review-${option.slice(2)}`);
	const result = runWorker({ extra, env: tempEnv(root) });
	reviewOptionObservations.push({ option, status: result.status, line: result.stderr.includes(`pi-worker: ${option} is a review option`), noCarry: !result.stderr.includes("pi-worker: claude settings carry:"), empty: tempEmpty(root), calls: readRows(RECORD).length, stderr: result.stderr });
}
removeArtifacts(); fs.rmSync(LOCK, { force: true });
const missingBriefRoot = caseTemp("review-missing-brief");
const missingBrief = path.join(TEMP, "does-not-exist.md");
const missingBriefResult = runWorker({ brief: missingBrief, extra: ["--item", "x"], env: tempEnv(missingBriefRoot) });
reviewOptionObservations.push({ option: "--item missing brief", status: missingBriefResult.status, line: missingBriefResult.stderr.includes("pi-worker: --item is a review option"), noCarry: !missingBriefResult.stderr.includes("pi-worker: claude settings carry:"), empty: tempEmpty(missingBriefRoot), calls: readRows(RECORD).length, stderr: missingBriefResult.stderr });
// req: R-2691
check("R-2691: in lane mode each review option exits 1 with the review-option line before the brief or the user Claude settings are read or any temp file is written",
	reviewOptionObservations.every((item) => item.status === 1 && item.line && item.noCarry && item.empty && item.calls === 0), JSON.stringify(reviewOptionObservations));

const cleanupObservations = [];
const runCleanupCase = (name, options = {}, arrange = () => {}) => {
	removeArtifacts(); fs.rmSync(LOCK, { force: true });
	const root = caseTemp(`cleanup-${name}`);
	arrange(root);
	const result = runWorker({ ...options, env: tempEnv(root, options.env) });
	cleanupObservations.push({ name, status: result.status, empty: tempEmpty(root), carry: result.stderr.split(/\r?\n/).filter((line) => line.startsWith("pi-worker: claude settings carry:")).length, error: result.stderr, lock: fs.existsSync(LOCK) });
	fs.rmSync(LOCK, { force: true });
	return result;
};
runCleanupCase("finished");
runCleanupCase("held lock", {}, () => fs.writeFileSync(LOCK, "999999\n"));
runCleanupCase("bad stall option", { extra: ["--stall-secs", "abc"] });
const missingOutputParent = path.join(TEMP, "missing-output-parent");
fs.rmSync(missingOutputParent, { recursive: true, force: true });
runCleanupCase("unwritable output", { extra: ["--out", path.join(missingOutputParent, "out.md")] });
runCleanupCase("ceiling", { extra: ["--max-secs", "1", "--stall-secs", "10"], env: { WC_SLEEP_MS: "10000" } });
if (process.platform !== "win32") {
	removeArtifacts(); fs.rmSync(LOCK, { force: true });
	const signalRoot = caseTemp("cleanup-sigterm");
	const signalRun = startWorker({ extra: ["--max-secs", "10", "--stall-secs", "10"], env: tempEnv(signalRoot, { WC_SLEEP_MS: "10000" }) });
	const signalStarted = await waitFor(() => fs.existsSync(PID_FILE), signalRun.child);
	if (signalStarted) signalRun.child.kill("SIGTERM");
	const signalEnd = await signalRun.closed;
	cleanupObservations.push({ name: "SIGTERM", status: signalEnd.code, empty: tempEmpty(signalRoot), started: signalStarted, abort: signalRun.stderr().includes("[pi-worker] aborted by SIGTERM"), lock: fs.existsSync(LOCK), error: signalRun.stderr() });
	stopFixtureBuilder(); fs.rmSync(LOCK, { force: true });

	removeArtifacts(); fs.rmSync(LOCK, { force: true });
	const closedRoot = caseTemp("cleanup-closed-stderr");
	const closedRun = startWorker({ extra: ["--max-secs", "10", "--stall-secs", "10"], env: tempEnv(closedRoot, { WC_SLEEP_MS: "1200" }) });
	const closedStarted = await waitFor(() => fs.existsSync(PID_FILE), closedRun.child);
	if (closedStarted) closedRun.child.stderr.destroy();
	const closedEnd = await closedRun.closed;
	cleanupObservations.push({ name: "closed stderr", status: closedEnd.code, empty: tempEmpty(closedRoot), started: closedStarted, lock: fs.existsSync(LOCK), error: closedRun.stderr() });
	stopFixtureBuilder(); fs.rmSync(LOCK, { force: true });
} else console.log("SKIP R-2692 SIGTERM and closed-stderr subcases — POSIX pipe and signal delivery only");
const cleanupPass = cleanupObservations.every((item) => item.empty) &&
	cleanupObservations.find((item) => item.name === "finished")?.status === 0 && cleanupObservations.find((item) => item.name === "finished")?.carry === 1 &&
	cleanupObservations.find((item) => item.name === "held lock")?.status === 1 && cleanupObservations.find((item) => item.name === "held lock")?.carry === 1 &&
	cleanupObservations.find((item) => item.name === "bad stall option")?.status === 1 && cleanupObservations.find((item) => item.name === "bad stall option")?.error.includes("pi-worker: --stall-secs and --poll must be positive numbers") &&
	cleanupObservations.find((item) => item.name === "unwritable output")?.status === 1 && cleanupObservations.find((item) => item.name === "unwritable output")?.error.includes("[pi-worker] FAILED: cannot write") &&
	cleanupObservations.find((item) => item.name === "ceiling")?.status === 1 && cleanupObservations.find((item) => item.name === "ceiling")?.carry === 1 &&
	(process.platform === "win32" || (cleanupObservations.find((item) => item.name === "SIGTERM")?.status === 143 && cleanupObservations.find((item) => item.name === "SIGTERM")?.started && cleanupObservations.find((item) => item.name === "SIGTERM")?.abort && cleanupObservations.find((item) => item.name === "closed stderr")?.status === 0 && cleanupObservations.find((item) => item.name === "closed stderr")?.started));
// req: R-2692
check("R-2692: a finished build, a held lock, a bad stall option, an unwritable output, the ceiling and, off Windows, SIGTERM and a closed stderr each leave the temp folder empty",
	cleanupPass, JSON.stringify(cleanupObservations));

const startupSignalCase = async ({ signal, laneSize = "larger" }) => {
	let last = null;
	for (let attempt = 1; attempt <= 3; attempt++) {
		removeArtifacts(); fs.rmSync(LOCK, { force: true });
		const root = caseTemp(`startup-${laneSize}-${signal.toLowerCase()}-${attempt}`);
		const marker = laneSize === "small" ? PI_MARKER : PID_FILE;
		const holdFile = path.join(root, "hold-builder");
		const run = startWorker({ extra: ["--lane-size", laneSize, "--max-secs", "10", "--stall-secs", "10"], env: tempEnv(root, { WC_SLEEP_MS: "10000", WC_HOLD_FILE: holdFile }) });
		const hasTempFile = await waitFor(() => fs.readdirSync(root).length > 0, run.child, STARTUP_SIGNAL_READY_LIMIT_MS);
		const startedBeforeSignal = fs.existsSync(marker);
		const delivered = hasTempFile && !startedBeforeSignal;
		run.child.kill(delivered ? signal : "SIGTERM");
		const ended = await run.closed;
		last = { signal, laneSize, attempt, hasTempFile, startedBeforeSignal, ended, empty: tempEmpty(root), lock: fs.existsSync(LOCK), abort: run.stderr().includes(`[pi-worker] aborted by ${signal}`), stderr: run.stderr() };
		stopFixtureBuilder(); fs.rmSync(LOCK, { force: true });
		if (delivered) return last;
	}
	return last;
};
let startupSignalObservations = [];
if (process.platform !== "win32") {
	for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) startupSignalObservations.push(await startupSignalCase({ signal }));
	startupSignalObservations.push(await startupSignalCase({ signal: "SIGTERM", laneSize: "small" }));
} else console.log("SKIP R-2693: startup signal window — POSIX signal delivery only");
const expectedSignalExit = { SIGINT: 130, SIGTERM: 143, SIGHUP: 129 };
// req: R-2693
check("R-2693: off Windows, SIGINT, SIGTERM or SIGHUP sent once the temp files exist and before the builder starts stops a Claude or pi build with the stop exit code and abort line and leaves no temp file and no lane lock",
	process.platform === "win32" || (startupSignalObservations.length === 4 && startupSignalObservations.every((item) => item.hasTempFile && !item.startedBeforeSignal && item.ended.code === expectedSignalExit[item.signal] && item.abort && item.empty && !item.lock)),
	JSON.stringify(startupSignalObservations), process.platform === "win32");

const r2694StartedAt = performance.now();
let blockingReadObservations = [];
if (process.platform !== "win32") {
	const makeFifo = (fifo) => {
		fs.rmSync(fifo, { force: true });
		const made = spawnSync("mkfifo", [fifo], { encoding: "utf8", timeout: CASE_LIMIT_MS });
		if (made.status !== 0) throw new Error(`mkfifo ${fifo} failed: ${made.stderr}`);
	};
	const unblockFifo = (fifo) => {
		let helperReader;
		let writer;
		try {
			try { writer = fs.openSync(fifo, fs.constants.O_WRONLY | fs.constants.O_NONBLOCK); }
			catch (error) {
				if (error?.code !== "ENXIO") throw error;
				helperReader = fs.openSync(fifo, fs.constants.O_RDONLY | fs.constants.O_NONBLOCK);
				writer = fs.openSync(fifo, fs.constants.O_WRONLY | fs.constants.O_NONBLOCK);
			}
			try { fs.writeFileSync(writer, "{}\n"); } catch (error) { if (error?.code !== "EPIPE") throw error; }
		} finally {
			if (writer !== undefined) fs.closeSync(writer);
			if (helperReader !== undefined) fs.closeSync(helperReader);
			fs.rmSync(fifo, { force: true });
		}
	};
	const pidAlive = (pid) => {
		try { process.kill(pid, 0); return true; } catch { return false; }
	};
	const stopHelper = async (pidFile) => {
		if (!fs.existsSync(pidFile)) return;
		const pid = Number(fs.readFileSync(pidFile, "utf8"));
		if (Number.isSafeInteger(pid) && pid > 0 && pidAlive(pid)) {
			try { process.kill(pid, "SIGKILL"); } catch {}
			const deadline = Date.now() + BLOCKING_HELPER_STOP_MS;
			while (pidAlive(pid) && Date.now() < deadline) await delay(5);
		}
		fs.rmSync(pidFile, { force: true });
	};
	const closeWithin = (closed) => new Promise((resolve) => {
		const timer = setTimeout(() => resolve({ code: null, signal: "TIMEOUT" }), BLOCKING_READ_END_MS);
		closed.then((ended) => { clearTimeout(timer); resolve(ended); });
	});
	const trustFifo = path.join(AGENT, "trust.json");
	const trustPid = path.join(TEMP, "blocking-trust.pid");
	const trustPreload = path.join(TEMP, "blocking-trust.cjs");
	fs.writeFileSync(trustPreload, `const fs = require("node:fs");\nconst { syncBuiltinESMExports } = require("node:module");\nconst originalOpen = fs.openSync;\nfs.openSync = (file, flags, ...rest) => {\n\tif (file === process.env.WC_BLOCKING_TRUST_FIFO) {\n\t\tfs.writeFileSync(process.env.WC_BLOCKING_HELPER_PID, String(process.pid));\n\t\tflags &= ~fs.constants.O_NONBLOCK;\n\t}\n\treturn originalOpen(file, flags, ...rest);\n};\nsyncBuiltinESMExports();\n`);
	const settingsFifo = homeSettings;
	const gitShimDir = path.join(TEMP, "blocking-git-bin");
	const gitPid = path.join(TEMP, "blocking-git.pid");
	const realGit = (process.env.PATH ?? "").split(path.delimiter).map((folder) => path.join(folder, "git")).find((file) => {
		try { fs.accessSync(file, fs.constants.X_OK); return true; } catch { return false; }
	});
	if (!realGit) throw new Error("git executable not found on PATH");
	fs.mkdirSync(gitShimDir, { recursive: true });
	fs.writeFileSync(path.join(gitShimDir, "git"), `#!${process.execPath}\nconst fs = require("node:fs");\nconst { spawnSync } = require("node:child_process");\nconst args = process.argv.slice(2);\nif (args.length === 2 && args[0] === "rev-parse" && args[1] === "HEAD") {\n\tfs.writeFileSync(process.env.WC_BLOCKING_HELPER_PID, String(process.pid));\n\tsetTimeout(() => {}, ${BLOCKING_HELPER_HANG_MS});\n} else {\n\tconst result = spawnSync(${JSON.stringify(realGit)}, args, { stdio: "inherit" });\n\tif (result.error) throw result.error;\n\tif (result.signal) process.kill(process.pid, result.signal);\n\telse process.exit(result.status ?? 1);\n}\n`, { mode: 0o755 });
	const cases = [
		{
			name: "trust check",
			prepare: () => {
				makeFifo(trustFifo);
				return {
					env: { WC_BLOCKING_TRUST_FIFO: trustFifo, WC_BLOCKING_HELPER_PID: trustPid, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --require=${trustPreload}`.trim() },
				blocked: () => fs.existsSync(trustPid),
				cleanup: async () => { unblockFifo(trustFifo); await stopHelper(trustPid); },
				};
			},
		},
		{
			name: "Claude settings read",
			prepare: () => {
				fs.rmSync(settingsFifo, { recursive: true, force: true });
				makeFifo(settingsFifo);
				return {
					env: { CLAUDE_CONFIG_DIR: userSettingsDir },
					blocked: (run) => run.child.exitCode === null && run.child.signalCode === null,
					cleanup: async () => { unblockFifo(settingsFifo); },
				};
			},
		},
		{
			name: "HEAD read",
			prepare: () => ({
				env: { PATH: `${gitShimDir}${path.delimiter}${BIN}${path.delimiter}${process.env.PATH ?? ""}`, WC_BLOCKING_HELPER_PID: gitPid },
				blocked: () => fs.existsSync(gitPid),
				cleanup: async () => { await stopHelper(gitPid); },
			}),
		},
	];
	for (const item of cases) {
		removeArtifacts(); fs.rmSync(LOCK, { force: true });
		const root = caseTemp(`blocking-${item.name.toLowerCase().replaceAll(" ", "-")}`);
		const fixture = item.prepare();
		const run = startWorker({ extra: ["--max-secs", "10", "--stall-secs", "10"], env: tempEnv(root, { ...fixture.env, WC_SLEEP_MS: "10000" }) });
		const precedent = await waitFor(() => run.stderr().includes("pi-worker: precedent:"), run.child);
		if (precedent) await delay(BLOCKING_READ_SETTLE_MS);
		const blocked = precedent && fixture.blocked(run);
		if (precedent && run.child.exitCode === null && run.child.signalCode === null) run.child.kill("SIGTERM");
		const ended = await closeWithin(run.closed);
		if (ended.signal === "TIMEOUT") {
			try { run.child.kill("SIGKILL"); } catch {}
			await run.closed;
		}
		blockingReadObservations.push({
			name: item.name,
			precedent,
			blocked,
			ended,
			empty: tempEmpty(root),
			lock: fs.existsSync(LOCK),
			calls: readRows(RECORD).length,
			fakeClaude: fs.existsSync(PID_FILE),
			stderr: run.stderr(),
		});
		await fixture.cleanup();
		stopFixtureBuilder();
		fs.rmSync(LOCK, { force: true });
	}
	fs.writeFileSync(homeSettings, JSON.stringify({ env: {} }));
} else console.log("SKIP R-2694: blocking start-up reads — POSIX signal delivery and FIFO only");
// req: R-2694
check("R-2694: off Windows, SIGTERM sent to pi-worker while its trust check, Claude settings read or HEAD read hangs ends it before any temp file or lane lock exists",
	process.platform === "win32" || (blockingReadObservations.length === 3 && blockingReadObservations.every((item) => item.precedent && item.blocked && item.ended.code === null && item.ended.signal === "SIGTERM" && item.empty && !item.lock && item.calls === 0 && !item.fakeClaude)),
	JSON.stringify(blockingReadObservations), process.platform === "win32");
console.log(`note: R-2694 elapsed ${Math.round(performance.now() - r2694StartedAt)} ms`);

const watcherLimit = () => (Number(LANE_WATCHER_POLL_MS) || 200) + (Number(LANE_WATCHER_STOP_WAIT_MS) || 2000) + (Number(LANE_WATCHER_REMOVE_RETRIES) || 5) * (Number(LANE_WATCHER_REMOVE_RETRY_MS) || 100) + 5_000;
const cleanProcess = (pid, group = false) => {
	if (!Number.isSafeInteger(pid) || pid <= 0) return;
	try { process.kill(group && process.platform !== "win32" ? -pid : pid, "SIGKILL"); } catch {}
};
const closeOf = (child) => new Promise((resolve) => {
	if (child.exitCode !== null || child.signalCode !== null) resolve({ code: child.exitCode, signal: child.signalCode });
	else child.once("close", (code, signal) => resolve({ code, signal }));
});
const startWrappedWorker = ({ args, env, leader = false }) => {
	const script = leader ? "sleep 30 & echo $! > \"$1\"; shift; exec \"$@\"" : "cd \"$1\" && shift && exec \"$@\"";
	const prefix = leader ? [path.join(TEMP, "worker-sibling.pid")] : [LANE];
	return spawn("bash", ["-c", script, "hkw", ...prefix, process.execPath, ...args], { cwd: LANE, env: baseEnv(env), stdio: "ignore", detached: true });
};
const hardCase = async ({ name, laneSize = "larger", wrapped = false, tree = false }) => {
	removeArtifacts(); fs.rmSync(LOCK, { force: true });
	const root = caseTemp(`hard-${name}`);
	const pidFile = path.join(TEMP, `hard-${name}.pid`);
	fs.rmSync(pidFile, { force: true }); fs.rmSync(`${pidFile}.grand`, { force: true });
	const extra = ["--poll", "60", "--lane-size", laneSize, "--max-secs", "30", "--stall-secs", "10"];
	const env = tempEnv(root, laneSize === "small" ? { WC_PID_FILE: pidFile, WC_PI_SLEEP_SECS: "30" } : { WC_PID_FILE: pidFile, WC_GRANDCHILD: "1", WC_SLEEP_MS: "30000" });
	const run = wrapped
		? startWrappedWorker({ args: workerArgs(BRIEF, extra), env })
		: startWorker({ extra, env });
	const child = wrapped ? run : run.child;
	const closed = wrapped ? closeOf(child) : run.closed;
	const started = await waitUntil(() => fs.existsSync(pidFile) && (laneSize === "small" || fs.existsSync(`${pidFile}.grand`)), 8_000);
	const ready = await watcherReady(root);
	if (tree) killTree(child.pid);
	else if (wrapped) cleanProcess(child.pid, true);
	else killWorkerTree(child);
	await delay(0);
	const watcherGone = await waitUntil(() => watchersFor(root).length === 0, watcherLimit());
	await Promise.race([closed, delay(2_000)]);
	const builderPid = fs.existsSync(pidFile) ? Number(fs.readFileSync(pidFile, "utf8")) : null;
	const remaining = hardKillTempNames(root);
	const observation = { name, started, ready, watcherGone, remaining, empty: remaining.length === 0, lock: fs.existsSync(LOCK), builderGroup: builderPid ? groupAlive(builderPid) : null };
	cleanProcess(builderPid, true); cleanProcess(child.pid, wrapped); stopFixtureBuilder(); fs.rmSync(LOCK, { force: true });
	fs.rmSync(root, { recursive: true, force: true });
	return observation;
};

let r2720 = [];
if (process.platform !== "win32") {
	r2720.push(await hardCase({ name: "alone" }));
	r2720.push(await hardCase({ name: "group-claude", wrapped: true }));
	r2720.push(await hardCase({ name: "group-pi", wrapped: true, laneSize: "small" }));
	r2720.push(await hardCase({ name: "tree", wrapped: true, tree: true }));
}
// req: R-2720
check("R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher",
	process.platform === "win32" || (r2720.length === 4 && r2720.every((item) => item.started && item.ready && item.watcherGone && item.empty && !item.lock && item.builderGroup === false)), JSON.stringify(r2720), process.platform === "win32");

let r2721 = { skipped: true };
if (process.platform === "win32") r2721 = await hardCase({ name: "windows-tree", laneSize: "small" });
// req: R-2721
check("R-2721: Windows: taskkill /F /T of pi-worker's tree while a directly launched builder runs leaves no temp file, no lane lock and no watcher",
	process.platform !== "win32" || (r2721.started && r2721.ready && r2721.watcherGone && r2721.empty && !r2721.lock), JSON.stringify(r2721), process.platform !== "win32");

const foreignLockObservations = [];
for (const owner of ["live", "dead"]) {
	removeArtifacts(); fs.rmSync(LOCK, { force: true });
	const root = caseTemp(`foreign-${owner}`);
	const pidFile = path.join(TEMP, `foreign-${owner}.pid`);
	let ownerPid = process.pid;
	if (owner === "dead") {
		const dead = spawn(process.execPath, ["-e", ""], { stdio: "ignore" }); ownerPid = dead.pid; await closeOf(dead);
	}
	const run = startWorker({ extra: ["--poll", "60", "--max-secs", "30", "--stall-secs", "10"], env: tempEnv(root, { WC_PID_FILE: pidFile, WC_SLEEP_MS: "30000" }) });
	const started = await waitUntil(() => fs.existsSync(pidFile), 8_000);
	const ready = await watcherReady(root);
	if (started) fs.writeFileSync(LOCK, `${ownerPid}\n`);
	killWorkerTree(run.child); await delay(0);
	const gone = await waitUntil(() => watchersFor(root).length === 0, watcherLimit());
	const remaining = hardKillTempNames(root);
	foreignLockObservations.push({ owner, started, ready, gone, remaining, empty: remaining.length === 0, lock: fs.existsSync(LOCK) ? fs.readFileSync(LOCK, "utf8") : null, expected: `${ownerPid}\n` });
	cleanProcess(fs.existsSync(pidFile) ? Number(fs.readFileSync(pidFile, "utf8")) : null, true); fs.rmSync(LOCK, { force: true }); fs.rmSync(root, { recursive: true, force: true });
}
// req: R-2722
check("R-2722: a hard kill while the lane lock names another process, live or dead, leaves that lock unchanged, the temp folder empty and no watcher",
	foreignLockObservations.every((item) => item.started && item.ready && item.gone && item.empty && item.lock === item.expected), JSON.stringify(foreignLockObservations));

let r2723 = { skipped: true };
if (process.platform !== "win32") {
	removeArtifacts(); fs.rmSync(LOCK, { force: true });
	const root = caseTemp("own-group");
	const pidFile = path.join(TEMP, "own-group-builder.pid");
	const siblingFile = path.join(TEMP, "worker-sibling.pid");
	fs.rmSync(siblingFile, { force: true });
	const run = startWrappedWorker({ args: workerArgs(BRIEF, ["--max-secs", "30", "--stall-secs", "10"]), env: tempEnv(root, { WC_PID_FILE: pidFile, WC_GRANDCHILD: "1", WC_SLEEP_MS: "30000" }), leader: true });
	const decoy = spawn(process.execPath, ["-e", "setInterval(()=>{},100000)"], { detached: true, stdio: "ignore" });
	const started = await waitUntil(() => fs.existsSync(pidFile) && fs.existsSync(`${pidFile}.grand`) && fs.existsSync(siblingFile), 8_000);
	const ready = await watcherReady(root);
	cleanProcess(run.pid); await delay(0);
	const gone = await waitUntil(() => watchersFor(root).length === 0, watcherLimit());
	const builderPid = fs.existsSync(pidFile) ? Number(fs.readFileSync(pidFile, "utf8")) : null;
	const siblingPid = fs.existsSync(siblingFile) ? Number(fs.readFileSync(siblingFile, "utf8")) : null;
	r2723 = { started, ready, gone, empty: tempEmpty(root), lock: fs.existsSync(LOCK), builderGroup: builderPid ? groupAlive(builderPid) : null, sibling: pidAlive(siblingPid), decoy: pidAlive(decoy.pid) };
	cleanProcess(run.pid, true); cleanProcess(builderPid, true); cleanProcess(decoy.pid, true); fs.rmSync(LOCK, { force: true }); fs.rmSync(root, { recursive: true, force: true });
}
// req: R-2723
check("R-2723: off Windows, after SIGKILL of pi-worker alone the builder's group is gone while the other members of pi-worker's own process group and an unrelated process keep running",
	process.platform === "win32" || (r2723.started && r2723.ready && r2723.gone && r2723.empty && !r2723.lock && r2723.builderGroup === false && r2723.sibling && r2723.decoy), JSON.stringify(r2723), process.platform === "win32");

const normalEndObservations = [];
for (const item of [{ name: "finished", extra: [], env: {} }, { name: "ceiling", extra: ["--max-secs", "1", "--stall-secs", "10"], env: { WC_SLEEP_MS: "10000" } }]) {
	removeArtifacts(); fs.rmSync(LOCK, { force: true });
	const root = caseTemp(`watcher-${item.name}`);
	const before = new Set(readRows(LEDGER).filter((row) => row.kind === "start").map((row) => row.build));
	const result = runWorker({ extra: item.extra, env: tempEnv(root, item.env) });
	const starts = readRows(LEDGER).filter((row) => row.kind === "start" && !before.has(row.build));
	const gone = await waitUntil(() => watchersFor(root).length === 0, watcherLimit());
	const ends = starts.length === 1 ? readRows(LEDGER).filter((row) => row.kind === "end" && row.build === starts[0].build) : [];
	normalEndObservations.push({ name: item.name, status: result.status, gone, starts: starts.length, ends: ends.length, empty: tempEmpty(root) });
	fs.rmSync(root, { recursive: true, force: true });
}
// req: R-2724
check("R-2724: after a finished build and after the ceiling the watcher exits and the ledger holds that build's one end record",
	normalEndObservations.length === 2 && normalEndObservations.every((item) => item.gone && item.starts === 1 && item.ends === 1 && item.empty) && normalEndObservations[0].status === 0 && normalEndObservations[1].status === 1,
	JSON.stringify(normalEndObservations));

let r2726 = {};
if (process.platform !== "win32") {
	const watcherChild = path.join(PACK, "lib", "lane-watcher-child.mjs");
	const root = caseTemp("reused-builder");
	const folder = path.join(root, "lane"); fs.mkdirSync(folder);
	const lock = path.join(root, "lane.lock");
	const dead = spawn(process.execPath, ["-e", ""], { stdio: "ignore" }); const workerPid = dead.pid; await closeOf(dead);
	const memberFile = path.join(TEMP, "reused-member.pid");
	const decoy = spawn(process.execPath, ["-e", `const fs=require('node:fs'),{spawn}=require('node:child_process');const c=spawn(process.execPath,['-e','setInterval(()=>{},100000)'],{stdio:'ignore'});fs.writeFileSync(${JSON.stringify(memberFile)},String(c.pid));setInterval(()=>{},100000)`], { detached: true, stdio: "ignore" });
	const memberReady = await waitUntil(() => fs.existsSync(memberFile), 5_000);
	const builderFile = path.join(folder, LANE_BUILDER_PID_FILE || "builder.pid");
	fs.writeFileSync(builderFile, JSON.stringify({ pid: decoy.pid, launch: "direct" }));
	const old = new Date(Date.now() - 30_000); fs.utimesSync(builderFile, old, old); fs.writeFileSync(lock, `${workerPid}\n`);
	const spec = { folder, lock, workerPid, build: "none", commonDir: root };
	const watched = spawn(process.execPath, [watcherChild, "--watch", JSON.stringify(spec)], { cwd: path.parse(process.execPath).root, stdio: "ignore", windowsHide: true });
	const ended = await Promise.race([closeOf(watched), delay(CASE_LIMIT_MS).then(() => ({ timeout: true }))]);
	const memberPid = memberReady ? Number(fs.readFileSync(memberFile, "utf8")) : null;
	r2726 = { ended, folderGone: !fs.existsSync(folder), lock: fs.existsSync(lock) ? fs.readFileSync(lock, "utf8") : null, expected: `${workerPid}\n`, decoy: pidAlive(decoy.pid), member: pidAlive(memberPid) };
	cleanProcess(decoy.pid, true); fs.rmSync(lock, { force: true }); fs.rmSync(root, { recursive: true, force: true });
}
// req: R-2726
check("R-2726: off Windows, a recorded builder pid now held by a process started after the record is not signalled and the lane lock stays",
	process.platform === "win32" || (!r2726.ended?.timeout && r2726.folderGone && r2726.lock === r2726.expected && r2726.decoy && r2726.member), JSON.stringify(r2726), process.platform === "win32");

let r2728 = {};
{
	const beta = path.join(TEMP, "lane-beta");
	if (!fs.existsSync(beta)) git(REPO, "worktree", "add", "-q", "-b", "feat/beta", beta);
	const betaBrief = path.join(beta, "brief.md"); fs.writeFileSync(betaBrief, "Feature: FEAT-006 · Beta\n\nPrecedent:\n- seed\n");
	const betaGit = real(path.resolve(beta, git(beta, "rev-parse", "--git-dir")));
	const betaLock = path.join(betaGit, "nana-lane.lock");
	removeArtifacts(); fs.rmSync(LOCK, { force: true }); fs.rmSync(betaLock, { force: true });
	const root = caseTemp("two-lanes");
	const alphaPid = path.join(TEMP, "two-alpha.pid"), betaPid = path.join(TEMP, "two-beta.pid");
	const laneSize = process.platform === "win32" ? "small" : "larger";
	const argsFor = (name, briefFile) => [WORKER, "--poll", name === "alpha" ? "60" : "0.2", "--stall-secs", "10", "--out", path.join(TEMP, `${name}.out`), "--lane", name, "--brief", briefFile, "--lane-size", laneSize, "--max-secs", "30"];
	const envFor = (pidFile, ms) => baseEnv(tempEnv(root, laneSize === "small" ? { WC_PID_FILE: pidFile, WC_PI_SLEEP_SECS: String(Math.ceil(ms / 1000)) } : { WC_PID_FILE: pidFile, WC_SLEEP_MS: String(ms) }));
	const alpha = spawn(process.execPath, argsFor("alpha", BRIEF), { cwd: LANE, env: envFor(alphaPid, 30_000), stdio: "ignore" });
	const alphaClose = closeOf(alpha);
	const alphaStarted = await waitUntil(() => fs.existsSync(alphaPid), 8_000);
	const betaChild = spawn(process.execPath, argsFor("beta", betaBrief), { cwd: beta, env: envFor(betaPid, process.platform === "win32" ? 15_000 : 3_000), stdio: "ignore" });
	const betaClose = closeOf(betaChild);
	const started = alphaStarted && await waitUntil(() => fs.existsSync(betaPid), 8_000);
	const ready = await waitUntil(() => { const found = watchersFor(root); return found.filter((item) => item.line.includes("--watch")).length === 2 && found.every((item) => !item.line.includes("--hop")); }, 8_000);
	killWorkerTree(alpha); await delay(0);
	const alphaGone = await waitUntil(() => !watchersFor(root).some((item) => watcherWorkerPid(item.line) === alpha.pid), watcherLimit());
	const betaBuilder = fs.existsSync(betaPid) ? Number(fs.readFileSync(betaPid, "utf8")) : null;
	const betaIntact = pidAlive(betaChild.pid) && pidAlive(betaBuilder) && fs.existsSync(betaLock) && watchersFor(root).some((item) => watcherWorkerPid(item.line) === betaChild.pid);
	await Promise.race([betaClose, delay(CASE_LIMIT_MS)]); await alphaClose;
	const allGone = await waitUntil(() => watchersFor(root).length === 0, watcherLimit());
	const remaining = hardKillTempNames(root);
	r2728 = { started, ready, alphaGone, betaIntact, allGone, remaining, empty: remaining.length === 0, alphaLock: fs.existsSync(LOCK), betaLock: fs.existsSync(betaLock) };
	cleanProcess(betaBuilder, true); cleanProcess(alpha.pid, true); cleanProcess(betaChild.pid, true); fs.rmSync(LOCK, { force: true }); fs.rmSync(betaLock, { force: true }); fs.rmSync(root, { recursive: true, force: true });
}
// req: R-2728
check("R-2728: a hard kill of one lane's pi-worker while a second lane builds in the same temp folder leaves the second lane's build, files, lock and watcher untouched",
	r2728.started && r2728.ready && r2728.alphaGone && r2728.betaIntact && r2728.allGone && r2728.empty && !r2728.alphaLock && !r2728.betaLock, JSON.stringify(r2728));

const literalCarryNames = [
	"HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY", "ALL_PROXY", "CLAUDE_CODE_PROXY_RESOLVES_HOSTS", "CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS", "CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER",
	"NODE_EXTRA_CA_CERTS", "CLAUDE_CODE_CERT_STORE", "CLAUDE_CODE_CLIENT_CERT", "CLAUDE_CODE_CLIENT_KEY", "CLAUDE_CODE_CLIENT_KEY_PASSPHRASE",
	"ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_OAUTH_TOKEN", "ANTHROPIC_CUSTOM_HEADERS",
	"CLAUDE_CODE_GIT_BASH_PATH", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "AWS_REGION", "AWS_PROFILE", "CLOUD_ML_REGION", "ANTHROPIC_VERTEX_PROJECT_ID",
	"AWS_BEARER_TOKEN_BEDROCK", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "ANTHROPIC_BEDROCK_BASE_URL", "ANTHROPIC_VERTEX_BASE_URL", "CLAUDE_CODE_SKIP_BEDROCK_AUTH", "CLAUDE_CODE_SKIP_VERTEX_AUTH", "GOOGLE_APPLICATION_CREDENTIALS", "CLAUDE_CODE_USE_FOUNDRY", "ANTHROPIC_MODEL", "ANTHROPIC_DEFAULT_OPUS_MODEL", "ANTHROPIC_DEFAULT_SONNET_MODEL", "ANTHROPIC_DEFAULT_HAIKU_MODEL",
];
const foldedCarry = new Set((CLAUDE_CARRY_ENV_NAMES ?? []).map((name) => name.toLowerCase()));
// req: R-2646 R-2651 R-2654 R-2655
check("seal: a Claude Code builder uses default permission mode, project and local settings, a carried settings file, no MCP servers, tools Read,Grep,Glob,Bash,Edit,Write, a prompt file, no stall stop, auto-memory off and the builder Bash limit",
	CLAUDE_BIN === "claude" && CLAUDE_PRINT_FLAG === "-p" && CLAUDE_MODEL_FLAG === "--model" && CLAUDE_ALLOW_FLAG === "--allowedTools" &&
	CLAUDE_PERMISSION_MODE_FLAG === "--permission-mode" && CLAUDE_BUILDER_PERMISSION_MODE === "default" && CLAUDE_SETTING_SOURCES_FLAG === "--setting-sources" && CLAUDE_BUILDER_SETTING_SOURCES === "project,local" &&
	CLAUDE_SETTINGS_FLAG === "--settings" && CLAUDE_STRICT_MCP_FLAG === "--strict-mcp-config" && CLAUDE_TOOLS_FLAG === "--tools" && CLAUDE_BUILDER_TOOLS === "Read,Grep,Glob,Bash,Edit,Write" &&
	CLAUDE_APPEND_PROMPT_FILE_FLAG === "--append-system-prompt-file" && CLAUDE_BUILDER_PROMPT_FILE === "builder-prompt.md" && CLAUDE_BUILDER_SETTINGS_FILE === "builder-settings.json" && CLAUDE_BUILDER_STALL_SECS === Infinity &&
	JSON.stringify(CLAUDE_BUILDER_CHILD_ENV) === JSON.stringify({ CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" }) && CLAUDE_BUILDER_BASH_LIMIT_MS === 3600000 &&
	JSON.stringify(CLAUDE_CARRY_KEYS) === JSON.stringify(["apiKeyHelper", "awsCredentialExport", "proxyAuthHelper", "awsAuthRefresh", "gcpAuthRefresh"]) && JSON.stringify(CLAUDE_CARRY_ENV_NAMES) === JSON.stringify(literalCarryNames) &&
	Object.keys(sealedEnv()).every((name) => !foldedCarry.has(name.toLowerCase())), JSON.stringify(config));

fs.rmSync(TEMP, { recursive: true, force: true });
console.log(failures ? `${failures} FAILED` : "all passed");
process.exit(failures ? 1 : 0);
