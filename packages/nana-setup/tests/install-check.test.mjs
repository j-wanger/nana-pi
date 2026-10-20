/**
 * @module packages/nana-setup/tests/install-check.test.mjs
 * @purpose Pins install-check configuration, pure matching, environment and reporting contracts.
 * @inputs Sealed install-check values and injected process inputs.
 * @outputs PASS/FAIL lines and a nonzero exit on failed checks.
 * @effects process
 * @errors Failed checks set a nonzero exit code.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { EventEmitter } from "node:events";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ALLOWED_HOOK_KEYS, DOCTOR_NOTES, HOOKS, KNOWN_RED, OVERRIDE_ENV, PULL_LOG_PATH, README_REHEARSAL } from "../lib/install-check-config.mjs";
import * as installConfig from "../lib/install-check-config.mjs";
import { buildEnvironment, classifyResult, createSpawnAdapter, formatResultLine, hookFailureReason, mapHookEntries, parsePiList, hookInvocation, findGitBash, journalHasUnadopted, runInstallCheck, rosterNoticeOutputOk } from "../lib/install-check.mjs";
import * as installCheck from "../lib/install-check.mjs";
import { STALE_PREFIX, STALE_UNAVAILABLE_PREFIX } from "../lib/stale-copies-config.mjs";
import { projectKey } from "../lib/project-key.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { findPi, winCommand } from "../../nana-pack/lib/win-command.mjs";

// Chosen 2026-10-12: bound an individual asynchronous case while allowing ordinary setup variance.
const CASE_TIMEOUT_MS = 30000;
const cases = [];
let failures = 0;
const check = (title, fn) => cases.push({ title, fn });
async function runChecks() {
  for (const { title, fn } of cases) {
    let timer;
    try {
      await Promise.race([
        Promise.resolve().then(fn),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`case timed out after ${CASE_TIMEOUT_MS} ms`)), CASE_TIMEOUT_MS); }),
      ]);
      console.log("PASS", title);
    } catch (error) {
      failures++;
      console.log("FAIL", title, error?.message ?? String(error));
    } finally { clearTimeout(timer); }
  }
}


// req: R-1074
check("sealed hook table and allowed entry shape", () => {
  assert.equal(HOOKS.length, 6);
  assert.deepEqual(ALLOWED_HOOK_KEYS, ["type", "command", "args", "timeout", "statusMessage"]);
  assert.deepEqual(HOOKS.map((h) => h.label), ["hook objective", "hook adoption", "hook shared memory", "hook roster notice", "hook verifier pipe", "hook knowledge pull"]);
  assert.ok(HOOKS.every((h) => h.form.darwin && h.form.linux && h.form.win32));
});

// req: R-1209
check("roster notice: plain text, two objects, a missing user message, a missing SessionStart context or the unavailable notice each fail", () => {
  const good = { systemMessage: "nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra", hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: "nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra" } };
  assert.ok(rosterNoticeOutputOk(`${JSON.stringify(good)}\n`));
  assert.ok(!rosterNoticeOutputOk("nana active · roster (default): plain text, not JSON"));
  assert.ok(!rosterNoticeOutputOk(`${JSON.stringify(good)}\n${JSON.stringify(good)}\n`));
  assert.ok(!rosterNoticeOutputOk(JSON.stringify({ hookSpecificOutput: good.hookSpecificOutput })));
  assert.ok(!rosterNoticeOutputOk(JSON.stringify({ systemMessage: good.systemMessage })));
  const unavailable = "nana active · roster notice unavailable (ERR_MODULE_NOT_FOUND)";
  assert.ok(!rosterNoticeOutputOk(JSON.stringify({ systemMessage: unavailable, hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: unavailable } })));
});

// req: R-1074, R-1082
check("hook mapping rejects wrong dispatch forms on both platform families", () => {
  const entries = HOOKS.filter((h) => !h.platforms || h.platforms.includes("darwin"));
  const groups = entries.map((h) => { const matcher = h.matcher && typeof h.matcher === "object" ? h.matcher.darwin : h.matcher; return { event: h.event, group: { ...(matcher ? { matcher } : {}), hooks: [{ type: "command", command: `node ${h.script}`, timeout: h.timeout }] } }; });
  assert.equal(mapHookEntries(groups, "darwin").failures.length, 0);
  assert.ok(mapHookEntries(groups, "win32").failures.some((x) => x.code === "wrong-form"));
});

// req: R-1071
check("environment removes overrides and redirects home, temp and npm cache", () => {
  const env = buildEnvironment({ HOME: "/outside", USERPROFILE: "C:\\outside", NANA_ROLE: "worker", PI_CODING_AGENT_DIR: "/bad", npm_config_userconfig: "/bad", PATH: "/bin" }, "/sandbox/home", "linux");
  assert.equal(env.HOME, "/sandbox/home");
  assert.equal(env.USERPROFILE, "/sandbox/home");
  for (const key of ["TMPDIR", "TEMP", "TMP"]) assert.equal(env[key], path.join("/sandbox/home", "tmp"));
  assert.equal(env.npm_config_cache, path.join("/sandbox/home", ".npm"));
  for (const key of OVERRIDE_ENV) assert.equal(Object.keys(env).some((x) => x.toLowerCase() === key.toLowerCase()), false);
  assert.equal(Object.keys(env).some((x) => x.toLowerCase() === "npm_config_userconfig"), false);
});

// req: R-1071
check("sealed override list removes every listed key and caller npm config keys case-insensitively", () => {
  const source = Object.fromEntries([...OVERRIDE_ENV.map((key) => [key, "caller"]), ["Npm_Config_Cache", "outside"], ["npm_config_userconfig", "outside"], ["PATH", "/bin"]]);
  const env = buildEnvironment(source, "/temp/home", "win32");
  assert.equal(OVERRIDE_ENV.length, 8);
  assert.deepEqual(OVERRIDE_ENV, ["PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_SHARED_MEMORY_DIR", "NANA_KNOWLEDGE_HOME", "NANA_ROLE", "NANA_SETUP_PLATFORM", "NANA_TEST_TEMP_ROOTS", "NANA_HANDOFF"]);
  assert.deepEqual(Object.keys(env).filter((key) => key.toLowerCase().startsWith("npm_config_")).map((key) => key.toLowerCase()), ["npm_config_cache"]);
  assert.equal(Object.keys(env).some((key) => OVERRIDE_ENV.some((item) => item.toLowerCase() === key.toLowerCase())), false);
});

// req: R-1071
check("install invokes real-home mode without sandbox flags", () => {
  const source = readFileSync(fileURLToPath(new URL("../lib/install-check.mjs", import.meta.url)), "utf8");
  assert.ok(source.includes('[path.join(root, "packages/nana-setup/bin/nana-setup.mjs"), "install"]'));
  assert.doesNotMatch(source, /"install", "--(?:home|claude-home|pi-home)/);
});

// req: R-1073
check("pi list resolves both user packages and rejects filtered entries", () => {
  const parsed = parsePiList("User packages:\n  nana-pack\n    /repo/packages/nana-pack\n  nana-knowledge (filtered)\n    /repo/packages/nana-knowledge\n", "/repo", "linux");
  assert.equal(parsed.pack, true);
  assert.equal(parsed.knowledge, false);
});

// req: R-1075
check("dispatch chooses direct exec or platform shell", () => {
  assert.deepEqual(hookInvocation({ command: "node", args: ["hook.mjs"] }, "darwin", "/bin/bash"), { command: "node", args: ["hook.mjs"], shell: false });
  assert.deepEqual(hookInvocation({ command: "node hook.mjs" }, "darwin", "/bin/bash"), { command: "/bin/sh", args: ["-c", "node hook.mjs"], shell: false });
  assert.deepEqual(hookInvocation({ command: "node hook.mjs" }, "win32", "C:\\Git\\bin\\bash.exe"), { command: "C:\\Git\\bin\\bash.exe", args: ["-c", "node hook.mjs"], shell: false });
});

// req: R-1070
check("FAIL timeout report includes its measured duration", () => {
  assert.equal(formatResultLine("pi session", { status: "FAIL", code: "timeout" }, "timed out after 1234 ms"), "FAIL pi session — timeout: timed out after 1234 ms");
});

// req: R-1070
check("FAIL exit report includes status and the last stderr line", () => {
  assert.equal(formatResultLine("install", { status: "FAIL", code: "exit" }, "exit status 7; last stderr: denied"), "FAIL install — exit: exit status 7; last stderr: denied");
});

// req: R-1070
check("multiline FAIL reason collapses whitespace and is capped at 200 characters", () => {
  const line = formatResultLine("doctor", { status: "FAIL", code: "note-row" }, `  offending\n  ${"x".repeat(240)}  `);
  assert.equal(line.length, "FAIL doctor — note-row: ".length + 200);
  assert.equal(line, `FAIL doctor — note-row: offending ${"x".repeat(190)}`);
});

// req: R-1070, R-1080
check("XFAIL report includes code, known-red owner and expiry", () => {
  const knownRed = { owner: "R-1057", expires: "2026-10-24" };
  assert.equal(formatResultLine("hook objective", { status: "XFAIL", code: "missing-entry" }, "entry is absent", knownRed), "XFAIL hook objective — missing-entry: entry is absent (known red, R-1057, until 2026-10-24)");
});

// req: R-1070
check("PASS report has no reason suffix", () => {
  assert.equal(formatResultLine("install", { status: "PASS", code: null }, "ignored"), "PASS install");
});

// req: R-1070
check("wrong-form report names the observed and expected hook dispatch forms", () => {
  assert.equal(hookFailureReason({ command: "node hook.mjs" }, { label: "hook knowledge pull", form: { win32: "exec" } }, "wrong-form", "win32"), "dispatch form is shell, expected exec");
});

// req: R-1079
check("win32 pi command preserves ComSpec verbatim argv launch options", () => {
  const source = readFileSync(fileURLToPath(new URL("../lib/install-check.mjs", import.meta.url)), "utf8");
  assert.match(source, /windowsVerbatimArguments: options\.windowsVerbatimArguments/);
});

// req: R-1079
check("Windows JSON journal path matches parsed cwd and rejects other events or folders", () => {
  const project = "D:\\a\\_temp\\project";
  assert.equal(journalHasUnadopted(JSON.stringify({ event: "directory_unadopted", cwd: project }), project, "win32"), true);
  assert.equal(journalHasUnadopted(JSON.stringify({ event: "directory_unadopted", cwd: "D:\\a\\other" }), project, "win32"), false);
  assert.equal(journalHasUnadopted(JSON.stringify({ event: "session_start", cwd: project }), project, "win32"), false);
});

// req: R-1070, R-1080
check("sealed known-red entries carry item, failure code, owner and expiry", () => {
  assert.deepEqual(KNOWN_RED.darwin, []);
  for (const platform of ["darwin", "win32"]) for (const entry of KNOWN_RED[platform]) {
    assert.deepEqual(Object.keys(entry), ["item", "code", "owner", "expires"]);
    assert.ok(["missing-entry", "wrong-form", "no-output", "note-row"].includes(entry.code));
    assert.match(entry.owner, /^R-\d+$/);
    assert.equal(entry.expires, "2026-10-24");
  }
});

// req: R-1070, R-1080
check("reporting matches known-red fingerprint and expiry and rejects unexpected passes", () => {
  const item = { item: "hook objective", code: "no-output", owner: "R-1057", expires: "2099-01-01" };
  assert.equal(classifyResult("hook objective", "no-output", false, [item], new Date("2098-12-31T00:00:00Z")).status, "XFAIL");
  assert.equal(classifyResult("hook objective", "wrong-form", false, [item], new Date("2098-12-31T00:00:00Z")).status, "FAIL");
  assert.equal(classifyResult("hook objective", "no-output", false, [item], new Date("2099-01-01T00:00:00Z")).status, "FAIL");
  assert.equal(classifyResult("hook objective", null, true, [item], new Date("2098-12-31T00:00:00Z")).status, "FAIL");
  assert.deepEqual(KNOWN_RED.darwin, []);
});

function tempHome() { return tmpDir(path.join(os.tmpdir(), "install-check-test-")); }
function passingTurnRecord(token) {
  const turn = installConfig.PI_TURN;
  const edit = installConfig.PI_TURN_EDIT;
  const powershell = installConfig.PI_TURN_POWERSHELL;
  return {
    system: `${token}\n${turn.rulingsHeading}\n${turn.writingTag}`,
    userMessages: [`${turn.knowledgeMarker} ~/notes/docs/${turn.noteFile}`],
    toolResults: [
      { toolName: turn.tool, isError: true, text: `${turn.gateBlockPrefix} sample` },
      ...(edit ? [{ toolName: edit.tool, isError: false, text: `${edit.failureLead}fixture ${edit.exitText}: ${token}` }] : []),
      ...(powershell ? [{ toolName: powershell.tool, isError: true, text: `${turn.gateBlockPrefix} sample` }] : []),
    ],
  };
}
function recordingRun({ platformName = "linux", env = {}, failInstall = false, spawnOverride = null, piShim = null } = {}) {
  const home = tempHome();
  const calls = [];
  const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
  const readmeHome = path.join(home, README_REHEARSAL.home);
  const spawn = async (command, args, options) => {
    calls.push({ command, args, options: { ...options, env: { ...options.env } } });
    // Stub only the running platform's README rehearsal shell in its second home.
    if (command === README_REHEARSAL.shell?.[platformName] && options.cwd === readmeHome) return { status: 0, stdout: "\n  all good.\n" };
    const joined = `${command} ${args.join(" ")}`;
    if (joined.includes("nana-setup.mjs") && args.includes("install")) {
      if (failInstall) return { status: 1, stderr: "failed" };
      fs.mkdirSync(path.join(home, ".pi/agent"), { recursive: true });
      fs.mkdirSync(path.join(home, ".claude/nana-memory/shared"), { recursive: true });
      const sessionDir = path.join(home, ".claude/projects", projectKey(path.join(home, "project")));
      fs.mkdirSync(path.join(sessionDir, "memory"), { recursive: true });
      fs.symlinkSync(path.join(home, ".claude/nana-memory/shared"), path.join(sessionDir, "memory/shared"), "dir");
      const hooks = {};
      for (const hook of HOOKS.filter((item) => !item.platforms || item.platforms.includes(platformName))) {
        const entry = { type: "command", command: `node ${hook.script}`, timeout: hook.timeout };
        if (platformName === "win32") { entry.command = "node"; entry.args = [hook.script]; }
        const matcher = hook.matcher && typeof hook.matcher === "object" ? hook.matcher[platformName] : hook.matcher;
        (hooks[hook.event] ??= []).push({ ...(matcher ? { matcher } : {}), hooks: [entry] });
      }
      fs.mkdirSync(path.join(home, ".claude"), { recursive: true });
      fs.writeFileSync(path.join(home, ".claude/settings.json"), JSON.stringify({ hooks }));
      return { status: 0, stdout: "" };
    }
    if (args[0] === "init") return { status: 0 };
    if (args[0] === "--version") return { status: 0 };
    if (args[0] === "list") return { status: 0, stdout: `User packages:\n nana-pack\n  ${path.join(root, "packages/nana-pack")}\n nana-knowledge\n  ${path.join(root, "packages/nana-knowledge")}\n` };
    if (args.includes("--mode") && args.includes("rpc")) {
      fs.mkdirSync(path.join(home, ".pi/agent"), { recursive: true });
      fs.writeFileSync(path.join(home, ".pi/agent/nana-journal.jsonl"), JSON.stringify({ event: "directory_unadopted", cwd: path.join(home, "project") }));
      return { status: 0, stdout: "reload-runtime" };
    }
    if (installConfig.PI_TURN?.provider && joined.includes(installConfig.PI_TURN.provider)) {
      const token = args.at(-1)?.match(/installcheck_[a-z0-9]+/)?.[0] ?? args.at(-1);
      fs.writeFileSync(path.join(home, installConfig.PI_TURN.record), JSON.stringify(passingTurnRecord(token)));
      return { status: 0, stdout: "fixture turn complete" };
    }
    if (joined.includes("nana-objective.mjs")) {
      const objective = fs.readFileSync(path.join(home, ".pi/agent/nana-objective.md"), "utf8");
      return { status: 0, stdout: `[nana:objective] ${objective.match(/installcheck_[a-z0-9]+/)?.[0] ?? "fixture"}` };
    }
    if (joined.includes("nana-adoption.mjs")) return { status: 0, stdout: `[nana:adoption] ${path.join(home, "project")}` };
    if (joined.includes("nana-shared-memory.mjs")) {
      const memory = fs.readFileSync(path.join(home, ".claude/nana-memory/shared/MEMORY.md"), "utf8");
      return { status: 0, stdout: `[nana:shared-memory] ${memory.split("\n").find((line) => line.startsWith("- [")) ?? ""}` };
    }
    if (joined.includes("nana-roster-notice.mjs")) {
      const notice = "nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra";
      return { status: 0, stdout: `${JSON.stringify({ systemMessage: notice, hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: notice } })}\n` };
    }
    if (joined.includes("nana-knowledge.ts")) return { status: 0, stdout: `${installConfig.PI_TURN.knowledgeMarker} ${installConfig.PI_TURN.noteFile}` };
    if (joined.includes("verifier-pipe.mjs")) {
      const input = JSON.parse(options.input);
      return { status: 0, stdout: input.tool_input.command === (input.tool_name === "PowerShell" ? "npm test | Select-Object -Last 5; git commit -m x" : "npm test | tail -1 && git commit -m done") ? `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask" } })}\n` : "" };
    }
    if (joined.includes("nana-setup.mjs") && args.includes("doctor")) return { status: 0, stdout: "" };
    return { status: 0, stdout: "" };
  };
  const pathEnv = platformName === "win32" ? { Path: "C:\\tools" } : { PATH: "/bin" };
  const run = runInstallCheck({ root, home, platformName, env: { ...pathEnv, ComSpec: "C:\\Windows\\System32\\cmd.exe", ...env }, spawn: (command, args, options) => spawnOverride ? spawnOverride({ command, args, options, spawn }) : spawn(command, args, options), exists: platformName === "win32" ? (candidate) => candidate.toLowerCase() === (piShim ? "c:\\tools\\pi.cmd" : "c:\\tools\\pi.exe") : undefined, now: () => new Date("2026-10-12T00:00:00Z"), out: () => {} });
  return { home, calls, run };
}

// req: R-1540
check("readme gate: darwin prints one readme checklist result line from /bin/zsh runs in a second home; linux runs neither rehearsal shell and prints none", async () => {
  for (const platformName of ["darwin", "linux"]) {
    const fixture = recordingRun({ platformName });
    try {
      const result = await fixture.run;
      const readmeLines = result.lines.filter((line) => line.includes(README_REHEARSAL.item));
      const rehearsalCalls = fixture.calls.filter((call) => Object.values(README_REHEARSAL.shell).includes(call.command));
      if (platformName === "darwin") {
        assert.equal(readmeLines.length, 1, result.lines.join("\n"));
        assert.equal(readmeLines[0], `PASS ${README_REHEARSAL.item}`, result.lines.join("\n"));
        assert.ok(rehearsalCalls.length > 0);
        const readmeHome = path.join(fixture.home, README_REHEARSAL.home);
        assert.ok(rehearsalCalls.every((call) => call.command === README_REHEARSAL.shell.darwin && call.options.cwd === readmeHome && call.options.cwd !== fixture.home));
      } else {
        assert.equal(readmeLines.length, 0, result.lines.join("\n"));
        assert.equal(rehearsalCalls.length, 0);
      }
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
});

async function assertWin32ReadmeGate() {
  const fixture = recordingRun({ platformName: "win32" });
  try {
    const result = await fixture.run;
    const readmeLines = result.lines.filter((line) => line.includes(README_REHEARSAL.item));
    const readmeHome = path.join(fixture.home, README_REHEARSAL.home);
    const cmdCalls = fixture.calls.filter((call) => call.command === README_REHEARSAL.shell.win32 && call.options.cwd === readmeHome);
    assert.deepEqual(readmeLines, [`PASS ${README_REHEARSAL.item}`], result.lines.join("\n"));
    assert.ok(cmdCalls.length > 0);
    assert.equal(cmdCalls.at(-1).args.at(-1), '"cd /d "%USERPROFILE%\\nana-pi" && nana-setup trust "%USERPROFILE%\\nana-pi" --yes && nana-setup doctor"');
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
}

// req: R-1853
check("readme gate: win32 prints one readme checklist result line from cmd.exe runs in a second home, ending on the Windows checklist's last step", assertWin32ReadmeGate);

// req: R-1071
check("environment: every override variable and every caller npm_config_* variable is removed, without case on win32", () => {
  const source = Object.fromEntries([...OVERRIDE_ENV.map((key) => [key.toLowerCase(), "bad"]), ["NPM_CONFIG_USERCONFIG", "bad"], ["nPm_CoNfIg_CaChE", "bad"], ["PATH", "/bin"]]);
  const result = buildEnvironment(source, "/temp", "win32");
  assert.deepEqual(Object.keys(result).map((key) => key.toLowerCase()).filter((key) => key.startsWith("npm_config_") && key !== "npm_config_cache"), []);
  assert.ok(OVERRIDE_ENV.every((key) => !Object.keys(result).some((actual) => actual.toLowerCase() === key.toLowerCase())));
});

// req: R-1071
check("environment: HOME, USERPROFILE, TMPDIR, TEMP, TMP and npm_config_cache point into the temporary home", () => {
  const result = buildEnvironment({}, "/temp/home", "linux");
  assert.equal(result.HOME, "/temp/home"); assert.equal(result.USERPROFILE, "/temp/home");
  for (const key of ["TMPDIR", "TEMP", "TMP"]) assert.equal(result[key], path.join("/temp/home", "tmp"));
  assert.equal(result.npm_config_cache, path.join("/temp/home", ".npm"));
});

// req: R-1071, R-1075, R-1079, R-1084
check("environment: every child gets the base environment plus only its own step's additions (CLAUDE_PROJECT_DIR for each hook, NANA_TEST_TEMP_ROOTS empty for the pi session)", async () => {
  const fixture = recordingRun({ env: { PI_CODING_AGENT_DIR: "/outside", npm_config_userconfig: "/outside" } });
  try {
    await fixture.run;
    assert.ok(fixture.calls.length > 10);
    const base = buildEnvironment({ PATH: "/bin", ComSpec: "C:\\Windows\\System32\\cmd.exe", PI_CODING_AGENT_DIR: "/outside", npm_config_userconfig: "/outside" }, fixture.home, "linux");
    base.PATH = `${path.join(fixture.home, ".local", "bin")}${path.delimiter}${base.PATH}`;
    for (const call of fixture.calls) {
      const expected = { ...base };
      const isHook = /nana-(objective|adoption|shared-memory|roster-notice|knowledge)|verifier-pipe/.test(`${call.command} ${call.args.join(" ")}`);
      const isSession = call.args.includes("--mode") && call.args.includes("rpc");
      if (isHook) expected.CLAUDE_PROJECT_DIR = path.join(fixture.home, "project");
      if (isSession) expected.NANA_TEST_TEMP_ROOTS = "";
      assert.deepEqual(call.options.env, expected);
    }
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1079
check("pi session: a get_commands response without reload-runtime prints FAIL pi session", async () => {
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
    const result = await spawn(command, args, options);
    return args.includes("--mode") && args.includes("rpc") ? { ...result, stdout: "{}" } : result;
  } });
  try { const result = await fixture.run; assert.ok(result.lines.some((line) => line.startsWith("FAIL pi session — no-output:"))); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1079
check("pi session: a journal without a directory_unadopted line for the fixture project prints FAIL pi session", async () => {
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
    const result = await spawn(command, args, options);
    if (args.includes("--mode") && args.includes("rpc")) fs.writeFileSync(path.join(fixture.home, ".pi/agent/nana-journal.jsonl"), "");
    return result;
  } });
  try { const result = await fixture.run; assert.ok(result.lines.some((line) => line.startsWith("FAIL pi session — no-output:"))); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1079
check("pi session: runs with NANA_TEST_TEMP_ROOTS set empty", async () => {
  const fixture = recordingRun();
  try { await fixture.run; const call = fixture.calls.find((item) => item.args.includes("--mode") && item.args.includes("rpc")); assert.equal(call.options.env.NANA_TEST_TEMP_ROOTS, ""); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1084
check("spawn: every child goes through the injected spawn (git init twice, Git Bash discovery, install, pi install, pi list, pi session, each hook hit and miss, doctor)", async () => {
  for (const platformName of ["linux", "win32"]) {
    const fixture = recordingRun({ platformName });
    try {
      await fixture.run;
      const joined = fixture.calls.map(({ command, args }) => `${command} ${args.join(" ")}`).join("\\n");
      assert.equal(fixture.calls.filter((call) => call.args[0] === "init").length, 2);
      if (platformName === "linux") {
        for (const name of ["nana-setup.mjs", "list", "--mode rpc", "nana-objective.mjs", "nana-adoption.mjs", "nana-shared-memory.mjs", "nana-roster-notice.mjs", "verifier-pipe.mjs", "nana-knowledge.ts"]) assert.ok(joined.includes(name), name);
        assert.ok(fixture.calls.some((call) => call.args[0] === "install" && call.args.some((arg) => arg.includes("pi-subagents"))));
        assert.ok(fixture.calls.some((call) => call.args.includes("doctor")));
        assert.ok(fixture.calls.filter((call) => call.options.input?.includes("PreToolUse")).length >= 2);
      } else assert.ok(fixture.calls.some((call) => call.command === "C:\\tools\\pi.exe"));
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
});

// req: R-1071
check("install: an install that exits non-zero prints FAIL install with its exit status", async () => {
  const fixture = recordingRun({ failInstall: true });
  try { const result = await fixture.run; assert.ok(result.lines.includes("FAIL install — exit: exit status 1; last stderr: failed")); assert.equal(result.exitCode, 1); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1071
check("install: the command line carries no override flag", async () => {
  const fixture = recordingRun();
  try { await fixture.run; const call = fixture.calls.find((item) => item.args.includes("install") && item.args.some((arg) => arg.includes("nana-setup.mjs"))); assert.ok(call); assert.deepEqual(call.args.slice(1), ["install"]); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1071
check("platform: NANA_SETUP_PLATFORM in the caller changes nothing", async () => {
  const fixture = recordingRun({ platformName: "darwin", env: { NANA_SETUP_PLATFORM: "win32" } });
  try {
    const result = await fixture.run;
    assert.equal(result.exitCode, 0, result.lines.join("\\n"));
    assert.ok(!result.lines.some((line) => line.startsWith("Git Bash:")));
    assert.ok(!fixture.calls.some((call) => call.options.input?.includes('"PowerShell"')));
    const hooks = fixture.calls.filter((call) => /nana-(objective|adoption|shared-memory|roster-notice|knowledge)|verifier-pipe/.test(`${call.command} ${call.args.join(" ")}`));
    assert.ok(hooks.length >= 7);
    assert.ok(hooks.every((call) => call.command === "/bin/sh" && call.args[0] === "-c"));
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1079
check("pi launch: on win32, pi install, pi list and the session go through findPi and winCommand", async () => {
  const fixture = recordingRun({ platformName: "win32", piShim: "C:\\tools\\pi.cmd" });
  try {
    await fixture.run;
    const source = readFileSync(fileURLToPath(new URL("../lib/install-check.mjs", import.meta.url)), "utf8");
    assert.match(source, /findPi\(\{ env: childEnv, cwd: root, exists \}\)/);
    assert.match(source, /winCommand\(pi, args/);
    assert.match(source, /winCommand\(pi, sessionArgs/);
    assert.equal(findPi({ env: { PATH: "C:\\tools", PATHEXT: ".EXE" }, cwd: "C:\\repo", exists: (file) => file.endsWith("pi.exe") }), "C:\\tools\\pi.exe");
    const launch = winCommand("C:\\tools\\pi.cmd", ["list"], { comspec: "C:\\Windows\\cmd.exe" });
    assert.equal(launch.command, "C:\\Windows\\cmd.exe");
    assert.equal(launch.options.windowsVerbatimArguments, true);
    assert.deepEqual(launch.args, ["/d", "/v:off", "/s", "/c", '\"\"C:\\tools\\pi.cmd\" \"list\"\"']);
    const piCommands = fixture.calls.filter((call) => call.command.toLowerCase().endsWith("\\cmd.exe") && (call.args.join(" ").includes("pi-subagents") || call.args.join(" ").includes('"list"') || call.args.join(" ").includes('"--mode" "rpc"')));
    assert.equal(piCommands.length, 3);
    assert.ok(piCommands.every((call) => call.command.toLowerCase().endsWith("\\cmd.exe")));
    assert.ok(piCommands.every((call) => call.args[0] === "/d" && call.args.includes("/c") && call.args.some((arg) => arg.includes("C:\\tools\\pi.cmd"))));
    assert.equal(fixture.calls.some((call) => call.command === "C:\\tools\\pi.cmd"), false);
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1070
check("reporting: a run with any FAIL line exits non-zero and a run of only PASS lines exits 0", async () => {
  const bad = recordingRun({ failInstall: true }); const good = recordingRun();
  try {
    const failed = await bad.run; const passed = await good.run;
    assert.equal(failed.exitCode, 1); assert.ok(failed.lines.some((line) => line.startsWith("FAIL ")));
    assert.equal(passed.exitCode, 0, passed.lines.join("\\n")); assert.ok(passed.lines.every((line) => line.startsWith("PASS ") || line.startsWith("pi:") || line.startsWith("node:")));
  } finally { fs.rmSync(bad.home, { recursive: true, force: true }); fs.rmSync(good.home, { recursive: true, force: true }); }
});

// req: R-1080
check("reporting: a listed item failing with its sealed code before its expiry prints XFAIL", () => {
  const item = { item: "case", code: "note-row", owner: "R-1", expires: "2026-10-13" };
  assert.equal(classifyResult("case", "note-row", false, [item], new Date("2026-10-12T00:00:00Z")).status, "XFAIL");
});

// req: R-1080
check("reporting: a listed item failing with a different code prints FAIL", () => {
  const item = { item: "case", code: "note-row", owner: "R-1", expires: "2026-10-13" };
  assert.equal(classifyResult("case", "exit", false, [item], new Date("2026-10-12T00:00:00Z")).status, "FAIL");
});

// req: R-1080
check("reporting: a listed item failing on or after its expiry prints FAIL", () => {
  const item = { item: "case", code: "note-row", owner: "R-1", expires: "2026-10-13" };
  assert.equal(classifyResult("case", "note-row", false, [item], new Date("2026-10-13T00:00:00Z")).status, "FAIL");
});

// req: R-1080
check("reporting: an unexpected pass names the listed code and owner", () => {
  const item = { item: "case", code: "note-row", owner: "R-1", expires: "2026-10-13" };
  const result = classifyResult("case", null, true, [item], new Date("2026-10-12T00:00:00Z"));
  assert.equal(result.status, "FAIL");
  assert.equal(formatResultLine("case", result, "", item), "FAIL case — unexpected-pass: listed as known red (note-row, R-1, until 2026-10-13) but passed");
});

// req: R-1070
check("reporting: the first lines name Git Bash on win32 only, then pi and node", async () => {
  const win = recordingRun({ platformName: "win32" }); const unix = recordingRun();
  try {
    const winLines = (await win.run).lines; const unixLines = (await unix.run).lines;
    assert.match(winLines[0], /^Git Bash:/); assert.match(winLines[1], /^pi:/); assert.match(winLines[2], /^node:/);
    assert.match(unixLines[0], /^pi:/); assert.match(unixLines[1], /^node:/);
  } finally { fs.rmSync(win.home, { recursive: true, force: true }); fs.rmSync(unix.home, { recursive: true, force: true }); }
});

// req: R-1071
check("pin R-1071: the override list", () => {
  assert.deepEqual(OVERRIDE_ENV, ["PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_SHARED_MEMORY_DIR", "NANA_KNOWLEDGE_HOME", "NANA_ROLE", "NANA_SETUP_PLATFORM", "NANA_TEST_TEMP_ROOTS", "NANA_HANDOFF"]);
});

// req: R-1070, R-1080
check("pin R-1070 R-1080: the known-red list with each entry's code, owner and expiry", () => {
  assert.deepEqual(KNOWN_RED.darwin, []);
  assert.deepEqual(KNOWN_RED.win32, []);
  for (const platform of ["darwin", "win32"]) for (const entry of KNOWN_RED[platform]) {
    assert.deepEqual(Object.keys(entry), ["item", "code", "owner", "expires"]);
    assert.equal(typeof entry.item, "string"); assert.ok(entry.code); assert.match(entry.owner, /^R-\d+$/); assert.match(entry.expires, /^\d{4}-\d{2}-\d{2}$/);
  }
});

const hookGroups = (platform = "darwin", overrides = {}) => HOOKS.filter((h) => !h.platforms || h.platforms.includes(platform)).map((h) => {
  const e = { type: "command", command: h.form[platform] === "exec" ? "node" : `node ${h.script}`, timeout: h.timeout, ...(h.form[platform] === "exec" ? { args: [h.script] } : {}) };
  const matcher = Object.hasOwn(overrides, h.label) ? overrides[h.label] : h.matcher && typeof h.matcher === "object" ? h.matcher[platform] : h.matcher;
  return { event: h.event, group: { ...(matcher === null ? {} : { matcher }), hooks: [e] } };
});
const expectBad = (groups, platform = "darwin") => assert.ok(mapHookEntries(groups, platform).failures.length > 0);

// req: R-1074
check("hook set: an exact set passes", () => { assert.equal(mapHookEntries(hookGroups(), "darwin").failures.length, 0); });
// req: R-1074
check("hook set: a missing row fails", () => { expectBad(hookGroups().slice(1)); });
// req: R-1074
check("hook set: a duplicate entry fails", () => { const rows = hookGroups(); rows.push(structuredClone(rows[0])); expectBad(rows); });
// req: R-1074
check("hook set: an unmapped extra entry fails", () => { const rows = hookGroups(); rows.push({ event: "Notification", group: { hooks: [{ type: "command", command: "extra", timeout: 5 }] } }); expectBad(rows); });
// req: R-1074
check("hook set: a missing type, async true, a shell field, non-string args, or a missing or non-5 timeout each fail", () => {
  for (const mutate of [e => delete e.type, e => e.async = true, e => e.shell = true, e => e.args = [2], e => delete e.timeout, e => e.timeout = 4]) {
    const rows = hookGroups(); mutate(rows[0].group.hooks[0]); expectBad(rows);
  }
  const withNull = hookGroups(); withNull[0].group.hooks[0] = null; expectBad(withNull);
});
// req: R-1074
check("hook set: a group without the matcher-and-hooks nesting fails", () => { expectBad([{ event: "SessionStart", group: { hooks: [] } }]); });
// req: R-1074
check("matcher: *, empty and omitted admit everything", () => {
  for (const matcher of ["*", "", undefined]) { const rows = hookGroups("darwin", { "hook verifier pipe": matcher }); assert.equal(mapHookEntries(rows, "darwin").failures.length, 0); }
});
// req: R-1074
check("matcher: 'Bash, PowerShell' and 'Bash|PowerShell' admit both tools", () => {
  for (const matcher of ["Bash, PowerShell", "Bash|PowerShell"]) assert.equal(mapHookEntries(hookGroups("win32", { "hook verifier pipe": matcher }), "win32").failures.length, 0);
});
// req: R-1074
check("matcher: list separators admit only the exact listed tools", () => {
  for (const matcher of ["Bash, PowerShell", "Bash|PowerShell"]) {
    assert.equal(mapHookEntries(hookGroups("win32", { "hook verifier pipe": matcher }), "win32").failures.length, 0);
  }
});
// req: R-1074
check("matcher: ^Bash$ admits Bash", () => { assert.equal(mapHookEntries(hookGroups("darwin", { "hook verifier pipe": "^Bash$" }), "darwin").failures.length, 0); });
// req: R-1074
check("matcher: NotBash does not admit Bash", () => { expectBad(hookGroups("darwin", { "hook verifier pipe": "NotBash" })); });
// req: R-1074
check("matcher: a resume SessionStart matcher fails", () => { expectBad(hookGroups("darwin", { "hook objective": "resume" })); });
// req: R-1074
check("matcher: win32 requires PowerShell in the verifier matcher", () => { expectBad(hookGroups("win32", { "hook verifier pipe": "Bash" }), "win32"); });
// req: R-1082
check("form: a shell-form entry under win32 fails", () => { const rows = hookGroups("win32"); delete rows[0].group.hooks[0].args; rows[0].group.hooks[0].command = `node ${HOOKS[0].script}`; expectBad(rows, "win32"); });
// req: R-1082
check("form: an exec-form entry under darwin fails", () => { const rows = hookGroups(); rows[0].group.hooks[0].args = ["nana-objective.mjs"]; expectBad(rows); });
// req: R-1082
check("form: each row's form is read from the sealed table, never inferred from args", () => {
  for (const platform of ["darwin", "win32"]) for (const h of HOOKS.filter(x => !x.platforms || x.platforms.includes(platform))) assert.ok(["exec", "shell"].includes(h.form[platform]));
  const rows = hookGroups("darwin"); rows[0].group.hooks[0].args = ["nana-objective.mjs"]; expectBad(rows);
  const winRows = hookGroups("win32"); winRows[0].group.hooks[0].command = "not-node"; expectBad(winRows, "win32");
});
// req: R-1074, R-1082
check("pin R-1074 R-1082: the hook table with its form columns and the allowed entry keys", () => {
  assert.deepEqual(HOOKS.map(h => [h.label, h.event, h.matcher, h.tools ?? null, h.script, h.timeout, h.form]), [
    ["hook objective", "SessionStart", "startup", null, "nana-objective.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook adoption", "SessionStart", "startup", null, "nana-adoption.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook shared memory", "SessionStart", "startup", null, "nana-shared-memory.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook roster notice", "SessionStart", "startup", null, "nana-roster-notice.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook verifier pipe", "PreToolUse", { darwin: "Bash", linux: "Bash", win32: "Bash|PowerShell" }, { darwin: ["Bash"], linux: ["Bash"], win32: ["Bash", "PowerShell"] }, "verifier-pipe.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook knowledge pull", "UserPromptSubmit", null, null, "nana-knowledge.ts", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
  ]);
  assert.deepEqual(ALLOWED_HOOK_KEYS, ["type", "command", "args", "timeout", "statusMessage"]);
});
// req: R-1075
check("dispatch: an entry with args runs as exec form with no shell", () => { assert.deepEqual(hookInvocation({ command: "node", args: ["hook.mjs"] }, "darwin"), { command: "node", args: ["hook.mjs"], shell: false }); });
// req: R-1075
check("dispatch: an entry without args runs /bin/sh -c on POSIX and Git Bash bash -c on win32", () => {
  assert.deepEqual(hookInvocation({ command: "node hook.mjs" }, "linux"), { command: "/bin/sh", args: ["-c", "node hook.mjs"], shell: false });
  assert.deepEqual(hookInvocation({ command: "node hook.mjs" }, "win32", "C:\\\\Git\\\\bin\\\\bash.exe"), { command: "C:\\\\Git\\\\bin\\\\bash.exe", args: ["-c", "node hook.mjs"], shell: false });
});
// req: R-1075
check("dispatch: Git Bash is derived from git.exe in cmd, bin or mingw64\\bin, and System32\\bash.exe is refused", () => {
  for (const entry of ["C:\\Program Files\\Git\\cmd", "C:\\Program Files\\Git\\bin", "C:\\Program Files\\Git\\mingw64\\bin"]) {
    const expected = "C:\\Program Files\\Git\\bin\\bash.exe";
    assert.equal(findGitBash([entry], (candidate) => candidate.toLowerCase() === expected.toLowerCase() || candidate.toLowerCase() === `${entry.toLowerCase()}\\git.exe`), expected);
  }
  assert.equal(findGitBash(["C:\\Windows\\System32"], (candidate) => candidate.toLowerCase() === "c:\\windows\\system32\\bash.exe"), null);
});
// req: R-1075
check("dispatch: a PATH folder without git.exe yields no Git Bash", () => {
  const present = new Set(["C:\\Other\\bin\\bash.exe"]);
  assert.equal(findGitBash(["C:\\Other\\bin"], (candidate) => present.has(candidate)), null);
});
// req: R-1075
check("dispatch: on win32 Git Bash discovery reads the path variable under any letter case and uses the injected exists", async () => {
  const home = tempHome();
  try {
    const env = { Path: "C:\\Git\\cmd", ComSpec: "C:\\Windows\\System32\\cmd.exe" };
    const exists = (candidate) => ["C:\\Git\\cmd\\git.exe", "C:\\Git\\bin\\bash.exe"].includes(candidate);
    const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
    const result = await runInstallCheck({ root, home, platformName: "win32", env, exists, spawn: async () => ({ status: 1 }), out: () => {} });
    assert.equal(result.lines[0], "Git Bash: C:\\Git\\bin\\bash.exe");
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

// req: R-1075
check("dispatch: each hook runs in the fixture project with CLAUDE_PROJECT_DIR set to it", async () => {
  const fixture = recordingRun();
  try { await fixture.run; const hooks = fixture.calls.filter(c => /nana-(objective|adoption|shared-memory|roster-notice|knowledge)|verifier-pipe/.test(c.args.join(" "))); assert.ok(hooks.length >= 7); for (const c of hooks) { assert.equal(c.options.cwd, path.join(fixture.home, "project")); assert.equal(c.options.env.CLAUDE_PROJECT_DIR, path.join(fixture.home, "project")); } }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1075
check("dispatch: every SessionStart entry starts before any of them finishes", async () => {
  const sessionStartScripts = HOOKS.filter((h) => h.event === "SessionStart").map((h) => h.script);
  let starts = 0; let finishes = 0; let release;
  const gate = new Promise(resolve => { release = resolve; });
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
    const name = `${command} ${args.join(" ")}`;
    if (!sessionStartScripts.some((script) => name.includes(script))) return spawn(command, args, options);
    starts++;
    if (starts === sessionStartScripts.length) release();
    await gate;
    if (finishes > 0) throw new Error("SessionStart started after a finish");
    const result = await spawn(command, args, options); finishes++; return result;
  }});
  try { await fixture.run; assert.equal(starts, sessionStartScripts.length); assert.equal(finishes, sessionStartScripts.length); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1075
check("dispatch: each hook's spawn timeout is its row's timeout × 1000", async () => {
  const fixture = recordingRun();
  try {
    await fixture.run;
    for (const hook of HOOKS.filter((row) => !row.platforms || row.platforms.includes("linux"))) {
      const calls = fixture.calls.filter((call) => `${call.command} ${call.args.join(" ")}`.includes(hook.script));
      assert.equal(calls.length, hook.shortLabel === "verifier pipe" ? 2 : 1, hook.label);
      assert.ok(calls.every((call) => call.options.timeout === hook.timeout * 1000), hook.label);
    }
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1075
check("dispatch: a hook that runs past its timeout is a FAIL whose reason prints the duration", async () => {
  const seen = [];
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
    const hook = HOOKS.find((row) => `${command} ${args.join(" ")}`.includes(row.script));
    if (hook) seen.push({ script: hook.script, timeout: options.timeout });
    return hook?.shortLabel === "objective" ? { error: { code: "ETIMEDOUT" }, ms: 5432 } : spawn(command, args, options);
  }});
  try {
    const result = await fixture.run;
    assert.ok(result.lines.includes("FAIL hook objective — timeout: timed out after 5432 ms"));
    for (const hook of HOOKS.filter((row) => !row.platforms || row.platforms.includes("linux"))) {
      const calls = seen.filter((call) => call.script === hook.script);
      assert.equal(calls.length, hook.shortLabel === "verifier pipe" ? 2 : 1, hook.label);
      assert.ok(calls.every((call) => call.timeout === hook.timeout * 1000), hook.label);
    }
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

function scriptedFixture(match, change, platformName = "linux") {
  return recordingRun({ platformName, spawnOverride: async ({ command, args, options, spawn }) => {
    const result = await spawn(command, args, options);
    if (match(`${command} ${args.join(" ")}`, options)) return { ...result, ...change(result, options) };
    return result;
  }});
}
async function assertOnlyHookFails(fixture, label) {
  try {
    const result = await fixture.run;
    assert.deepEqual(result.lines.filter(line => line.startsWith("FAIL ")).map(line => line.split(" — ")[0]), [`FAIL ${label}`]);
    assert.ok(result.lines.filter(line => line.startsWith("PASS hook ")).length >= 4);
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
}
const hookIs = (script) => (command) => command.includes(script);
// req: R-1076
check("objective: the failure marker fails even though it starts with [nana:objective]", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-objective.mjs"), () => ({ stdout: "[nana:objective] OBJECTIVE UNAVAILABLE: producer failed" })), "hook objective"));
// req: R-1076
check("objective: output without the run token fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-objective.mjs"), () => ({ stdout: "[nana:objective] ordinary bounded objective" })), "hook objective"));
// req: R-1076
check("adoption: ADOPTION UNAVAILABLE fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-adoption.mjs"), () => ({ stdout: "[nana:adoption] ADOPTION UNAVAILABLE" })), "hook adoption"));
// req: R-1076
check("adoption: output that does not name the project fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-adoption.mjs"), () => ({ stdout: "[nana:adoption] another project" })), "hook adoption"));
// req: R-1076
check("shared memory: output without the seeded '- [' line fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-shared-memory.mjs"), () => ({ stdout: "[nana:shared-memory] unseeded" })), "hook shared memory"));
// req: R-1076
check("shared memory: a link at another key or with another target fails", async () => {
  const wrongOutput = scriptedFixture(hookIs("nana-shared-memory.mjs"), () => ({ stdout: "[nana:shared-memory] - [wrong]" }));
  await assertOnlyHookFails(wrongOutput, "hook shared memory");
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
    const result = await spawn(command, args, options);
    if (args.includes("install") && args.some(arg => arg.includes("nana-setup.mjs"))) {
      const link = path.join(fixture.home, ".claude/projects", projectKey(path.join(fixture.home, "project")), "memory/shared");
      fs.rmSync(link, { force: true });
      fs.symlinkSync(path.join(fixture.home, "notes"), link, "dir");
    }
    return result;
  }});
  await assertOnlyHookFails(fixture, "hook shared memory");
});
// req: R-1076
check("output: a 10,001-character stdout fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-objective.mjs"), (result) => {
  const token = result.stdout.match(/installcheck_[a-z0-9]+/)?.[0];
  const prefix = `[nana:objective] ${token} `;
  return { stdout: prefix + "x".repeat(10001 - prefix.length) };
}), "hook objective"));
// req: R-1077
check("verifier: an allow decision fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("verifier-pipe.mjs"), (result, options) => JSON.parse(options.input).tool_input.command === "git status" ? {} : { stdout: `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow" } })}\n` }), "hook verifier pipe (Bash)"));
// req: R-1077
check("verifier: a missing hookEventName fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("verifier-pipe.mjs"), (result, options) => JSON.parse(options.input).tool_input.command === "git status" ? {} : { stdout: `${JSON.stringify({ hookSpecificOutput: { permissionDecision: "ask" } })}\n` }), "hook verifier pipe (Bash)"));
// req: R-1077
check("verifier: malformed JSON fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("verifier-pipe.mjs"), (result, options) => JSON.parse(options.input).tool_input.command === "git status" ? {} : { stdout: "not-json\n" }), "hook verifier pipe (Bash)"));
// req: R-1077
check("verifier: two JSON lines fail", async () => await assertOnlyHookFails(scriptedFixture(hookIs("verifier-pipe.mjs"), (result, options) => JSON.parse(options.input).tool_input.command === "git status" ? {} : { stdout: `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask" } })}\n{}\n` }), "hook verifier pipe (Bash)"));
// req: R-1077
check("verifier: a miss sample that prints anything fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("verifier-pipe.mjs"), (result, options) => JSON.parse(options.input).tool_input.command === "git status" ? { stdout: "unexpected" } : {}), "hook verifier pipe (Bash)"));
// req: R-1083
check("knowledge: an empty output fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-knowledge.ts"), () => ({ stdout: "" })), "hook knowledge pull"));
// req: R-1083
check("knowledge: a win32 ~\\notes\\docs\\install-check.md pointer matches by file name", async () => {
  const fixture = scriptedFixture(hookIs("nana-knowledge.ts"), () => ({ stdout: "[nana:knowledge] ~\\notes\\docs\\install-check.md" }), "win32");
  try { const result = await fixture.run; assert.ok(result.lines.some(line => line === "PASS hook knowledge pull")); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1209
check("roster notice: plain text, not JSON, fails the run's roster row", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-roster-notice.mjs"), () => ({ stdout: "nana active · roster (default): plain text, not JSON" })), "hook roster notice"));
// req: R-1209
check("roster notice: the unavailable notice fails the run's roster row", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-roster-notice.mjs"), () => {
  const u = "nana active · roster notice unavailable (ERR_MODULE_NOT_FOUND)";
  return { stdout: `${JSON.stringify({ systemMessage: u, hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: u } })}\n` };
}), "hook roster notice"));
// req: R-1209
check("roster notice: a missing hookEventName fails the run's roster row", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-roster-notice.mjs"), () => {
  const notice = "nana active · roster (default): builder gpt-6-luna high, reviewer gpt-5.6-sol, land gpt-6-astra";
  return { stdout: `${JSON.stringify({ systemMessage: notice, hookSpecificOutput: { additionalContext: notice } })}\n` };
}), "hook roster notice"));
// req: R-1209
check("roster notice: a wrong prefix fails the run's roster row", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-roster-notice.mjs"), () => {
  const notice = "not the roster notice prefix at all";
  return { stdout: `${JSON.stringify({ systemMessage: notice, hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: notice } })}\n` };
}), "hook roster notice"));
// req: R-1072
check("checklist: the check writes only the objective lines and one MEMORY.md line, and puts the bin folder first on PATH", async () => {
  for (const platformName of ["linux", "win32"]) {
    const fixture = recordingRun({ platformName });
    try {
      await fixture.run;
      const objective = fs.readFileSync(path.join(fixture.home, ".pi/agent/nana-objective.md"), "utf8");
      const memory = fs.readFileSync(path.join(fixture.home, ".claude/nana-memory/shared/MEMORY.md"), "utf8");
      assert.equal((objective.match(/installcheck_/g) ?? []).length, 2);
      assert.equal((memory.match(/^- \[/gm) ?? []).length, 1);
      assert.equal(fs.existsSync(path.join(fixture.home, ".claude-placeholder")), false);
      assert.equal(fixture.calls.find(call => call.args[0] === "init").options.cwd, path.join(fixture.home, "notes"));
      const ownedByInstallOrPi = (relative) => relative === ".claude/settings.json" || relative.startsWith(".claude/projects/") || relative === ".pi/agent/nana-journal.jsonl" || relative === installConfig.PI_TURN?.record || relative === ["notes", "docs", installConfig.PI_TURN.noteFile].join("/");
      const written = [];
      const visit = (directory) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          const absolute = path.join(directory, entry.name);
          const relative = path.relative(fixture.home, absolute).split(path.sep).join("/");
          if (entry.isDirectory()) visit(absolute);
          else if (!ownedByInstallOrPi(relative)) written.push(relative);
        }
      };
      visit(fixture.home);
      assert.deepEqual(written.sort(), [".claude/nana-memory/shared/MEMORY.md", ".pi/agent/nana-objective.md"]);
      const child = fixture.calls.find(call => call.args[0] === "init").options.env;
      const pathKey = Object.keys(child).find((key) => key.toLowerCase() === "path");
      const pathValue = child[pathKey];
      assert.equal(pathValue.split(platformName === "win32" ? ";" : path.delimiter)[0], path.join(fixture.home, ".local/bin"));
      if (platformName === "win32") assert.equal(pathKey, "Path");
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
});
// req: R-1072
check("checklist: pi install npm:pi-subagents uses doctor's floor, from the fixture project, launched as install launches pi", async () => {
  const fixture = recordingRun();
  try {
    await fixture.run;
    const call = fixture.calls.find(item => item.args.some(arg => arg.startsWith("npm:pi-subagents@")));
    assert.ok(call.args.includes(`npm:pi-subagents@${(await import("../lib/doctor.mjs")).PI_SUBAGENTS_FLOOR}`));
    assert.equal(call.options.cwd, path.join(fixture.home, "project"));
    assert.ok(call.options.env.HOME === fixture.home);
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1081
check("doctor: exit 1 with only check and ! marks is a FAIL", async () => {
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => args.includes("doctor") ? { status: 1, stdout: "✓ check ! mark" } : spawn(command, args, options) });
  try { const result = await fixture.run; assert.ok(result.lines.some(line => line.startsWith("FAIL doctor — exit:"))); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1081
check("doctor: exit 0 with a note row off the note list is a FAIL", async () => {
  const fixture = recordingRun({ spawnOverride: async ({ args, options, spawn, command }) => args.includes("doctor") ? { status: 0, stdout: "· unknown note" } : spawn(command, args, options) });
  try { const result = await fixture.run; assert.ok(result.lines.includes("FAIL doctor — note-row: unknown note")); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1081
check("doctor: the reason names every note row off the note list", async () => {
  const fixture = recordingRun({ spawnOverride: async ({ args, options, spawn, command }) => args.includes("doctor") ? { status: 0, stdout: "· first unknown\n· second unknown" } : spawn(command, args, options) });
  try { const result = await fixture.run; assert.ok(result.lines.includes("FAIL doctor — note-row: first unknown; second unknown")); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1081
check("doctor: the reason caps note labels and reports the remainder", async () => {
  const notes = Array.from({ length: 20 }, (_, i) => `· row ${i} ${"x".repeat(20)}`).join("\n");
  const fixture = recordingRun({ spawnOverride: async ({ args, options, spawn, command }) => args.includes("doctor") ? { status: 0, stdout: notes } : spawn(command, args, options) });
  try {
    const result = await fixture.run; const line = result.lines.find((row) => row.startsWith("FAIL doctor — note-row:"));
    assert.ok(line.length <= "FAIL doctor — note-row: ".length + 200);
    assert.match(line, /… and \d+ more$/);
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1081
check("doctor: a win32 note row off the empty known-red list is a FAIL", async () => {
  const fixture = recordingRun({ platformName: "win32", spawnOverride: async ({ args, options, spawn, command }) => args.includes("doctor") ? { status: 0, stdout: "· unexpected note" } : spawn(command, args, options) });
  try { const result = await fixture.run; assert.ok(result.lines.includes("FAIL doctor — note-row: unexpected note")); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1081, R-1080
check("doctor: a known-red note row is an XFAIL", () => {
  const known = [{ item: "doctor", code: "note-row", owner: "R-1055", expires: "2099-01-01" }];
  const result = classifyResult("doctor", "note-row", false, known, new Date("2098-12-31T00:00:00Z"));
  assert.equal(formatResultLine("doctor", result, "note", known[0]), "XFAIL doctor — note-row: note (known red, R-1055, until 2099-01-01)");
});
// req: R-1096
check("diagnostics: a run with a FAIL line prints the settings hooks block and the last pull.log record after the result lines", async () => {
  const fixture = recordingRun({ spawnOverride: async ({ args, options, spawn, command }) => {
    if (args.includes("doctor")) {
      fs.mkdirSync(path.join(fixture.home, ".pi/agent/nana-knowledge"), { recursive: true });
      fs.writeFileSync(path.join(fixture.home, ...PULL_LOG_PATH), "first record\nsecond record\n");
      return { status: 0, stdout: "· unexpected" };
    }
    return spawn(command, args, options);
  } });
  try { const result = await fixture.run; const end = result.lines.slice(-2); assert.deepEqual(end, [`settings hooks: ${JSON.stringify(JSON.parse(fs.readFileSync(path.join(fixture.home, ".claude/settings.json"), "utf8")).hooks)}`, "last pull.log record: second record"]); assert.ok(result.lines.indexOf(end[0]) > result.lines.findIndex((line) => line.startsWith("FAIL doctor"))); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1096
check("diagnostics: missing settings and pull.log files print could-not-be-read lines with their error codes", async () => {
  const fixture = recordingRun({ failInstall: true });
  try { const result = await fixture.run; assert.deepEqual(result.lines.slice(-2), ["settings hooks: could not be read (ENOENT)", "last pull.log record: could not be read (ENOENT)"]); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1096
check("diagnostics: malformed settings print the error name and an empty pull.log prints none", async () => {
  let home;
  const fixture = recordingRun({ spawnOverride: async ({ args, options, spawn, command }) => {
    if (args.includes("doctor")) {
      fs.writeFileSync(path.join(home, ".claude/settings.json"), "{");
      fs.mkdirSync(path.join(home, ".pi/agent/nana-knowledge"), { recursive: true });
      fs.writeFileSync(path.join(home, ...PULL_LOG_PATH), "\n  \n");
      return { status: 0, stdout: "· unexpected" };
    }
    return spawn(command, args, options);
  } });
  home = fixture.home;
  try { const result = await fixture.run; assert.deepEqual(result.lines.slice(-2), ["settings hooks: could not be read (SyntaxError)", "last pull.log record: none"]); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1096
check("pin R-1096: the pull.log path under the temporary home", () => {
  assert.deepEqual(PULL_LOG_PATH, [".pi", "agent", "nana-knowledge", "pull.log"]);
});

// req: R-1081
check("pin R-1081: the doctor note list", () => {
  assert.deepEqual(DOCTOR_NOTES, {
    darwin: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
    linux: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
    win32: ["pi agent dir", "pi mcp.json", "desk service", "release status", "Claude Code hooks floor"],
  });
});
// req: R-1073
check("pi list: colour codes are stripped", () => assert.deepEqual(parsePiList("\u001b[32mnana-pack\u001b[0m\n  /repo/packages/nana-pack\nnana-knowledge\n  /repo/packages/nana-knowledge", "/repo", "linux"), { pack: true, knowledge: true }));
// req: R-1073
check("pi list: a relative ../../ source still matches", () => assert.equal(parsePiList(`packages\n  nana-pack\n    ../../packages/nana-pack\n  nana-knowledge\n    ../../packages/nana-knowledge`, path.resolve(process.cwd(), "../.."), "linux").pack, true));
// req: R-1073
check("pi list: D:\\ matches d:\\ on win32", () => assert.equal(parsePiList("nana-pack\n  D:\\repo\\packages\\nana-pack\nnana-knowledge\n  D:\\repo\\packages\\nana-knowledge", "d:\\repo", "win32").knowledge, true));
// req: R-1073
check("pi list: a (filtered) entry fails", () => assert.equal(parsePiList("nana-pack (filtered)\n  /repo/packages/nana-pack\nnana-knowledge\n  /repo/packages/nana-knowledge", "/repo", "linux").pack, false));
// req: R-1073
check("pi list: runs from the fixture project with no PI_CODING_AGENT_DIR", async () => {
  const fixture = recordingRun();
  try { await fixture.run; const call = fixture.calls.find(item => item.args[0] === "list"); assert.equal(call.options.cwd, path.join(fixture.home, "project")); assert.equal(Object.hasOwn(call.options.env, "PI_CODING_AGENT_DIR"), false); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1074, R-1077
check("verifier row: on win32 one entry whose matcher admits Bash and PowerShell satisfies the hook set and both verifier lines", async () => {
  const fixture = recordingRun({ platformName: "win32" });
  try {
    const result = await fixture.run;
    assert.ok(result.lines.includes("PASS hook set"), result.lines.filter(line => line.includes("hook set") || line.includes("verifier pipe")).join("\n"));
    assert.equal(result.lines.filter(line => /^PASS hook verifier pipe \((Bash|PowerShell)\)$/.test(line)).length, 2, result.lines.filter(line => line.includes("verifier pipe")).join("\n"));
    const settings = JSON.parse(fs.readFileSync(path.join(fixture.home, ".claude/settings.json"), "utf8"));
    assert.equal(settings.hooks.PreToolUse.length, 1);
    assert.equal(settings.hooks.PreToolUse[0].matcher, "Bash|PowerShell");
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1074, R-1077
check("verifier row: on win32 an entry whose matcher admits only Bash fails the PowerShell line", async () => {
  const fixture = recordingRun({ platformName: "win32", spawnOverride: async ({ command, args, options, spawn }) => {
    const result = await spawn(command, args, options);
    if (args.includes("install") && args.some(arg => arg.includes("nana-setup.mjs"))) {
      const file = path.join(fixture.home, ".claude/settings.json");
      const settings = JSON.parse(fs.readFileSync(file, "utf8"));
      settings.hooks.PreToolUse[0].matcher = "Bash";
      fs.writeFileSync(file, JSON.stringify(settings));
    }
    return result;
  }});
  try { const result = await fixture.run; assert.ok(result.lines.includes("PASS hook verifier pipe (Bash)"), result.lines.filter(line => line.includes("verifier pipe")).join("\n")); assert.ok(result.lines.some(line => line.startsWith("FAIL hook verifier pipe (PowerShell) — bad-matcher:")), result.lines.filter(line => line.includes("verifier pipe")).join("\n")); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1074, R-1077
check("verifier row: on darwin one entry admitting Bash satisfies the verifier line and no PowerShell line is printed", async () => {
  const fixture = recordingRun({ platformName: "darwin" });
  try { const result = await fixture.run; assert.ok(result.lines.includes("PASS hook verifier pipe (Bash)")); assert.equal(result.lines.some(line => line.includes("PowerShell")), false); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1075
check("spawn adapter: a child killed at its timeout reports ETIMEDOUT and its duration", async () => {
  const childSpawn = () => {
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.stdin = { end() {} };
    child.kill = () => queueMicrotask(() => child.emit("close", null, "SIGTERM"));
    return child;
  };
  let tick = 0;
  const run = createSpawnAdapter(childSpawn, { now: () => tick++ * 17 });
  const result = await run("fake", [], { timeout: 5 });
  assert.equal(result.error.code, "ETIMEDOUT"); assert.equal(result.ms, 17);
});
// req: R-1076
check("spawn adapter: stdout is kept to 10,001 characters, so a 10,001-character output fails the cap", async () => {
  const childSpawn = () => {
    const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); child.stdin = { end() {} };
    queueMicrotask(() => { child.stdout.emit("data", "x".repeat(10002)); child.emit("close", 0, null); });
    child.kill = () => {};
    return child;
  };
  const adapterResult = await createSpawnAdapter(childSpawn)("fake", [], { timeout: 1000 });
  assert.equal(adapterResult.stdout.length, 10001);
  await assertOnlyHookFails(scriptedFixture(hookIs("nana-objective.mjs"), () => ({ stdout: `[nana:objective] ${"x".repeat(10000)}` })), "hook objective");
});
// req: R-1075, R-1080
check("timeout: a hook past its timeout reports the timeout code, not no-output", async () => {
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) =>
    /nana-objective/.test(`${command} ${args.join(" ")}`) ? { error: { code: "ETIMEDOUT" }, ms: 5432 } : spawn(command, args, options) });
  try { const result = await fixture.run; assert.ok(result.lines.includes("FAIL hook objective — timeout: timed out after 5432 ms")); assert.ok(!result.lines.includes("XFAIL hook objective — no-output")); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1790
check("pi turn: one turn runs from the fixture project with the base environment, the sealed arguments, one prompt argument holding the prompt and run token, and timeout, through winCommand on win32, and prints one pi turn line", async () => {
  for (const platformName of ["linux", "win32"]) {
    const fixture = recordingRun({ platformName, env: { NANA_ROLE: "worker" }, piShim: platformName === "win32" ? "C:\\tools\\pi.cmd" : null });
    try {
      const result = await fixture.run;
      const turn = installConfig.PI_TURN;
      const calls = fixture.calls.filter((call) => `${call.command} ${call.args.join(" ")}`.includes(turn.provider));
      assert.equal(calls.length, 1, fixture.calls.map((call) => `${call.command} ${call.args.join(" ")}`).join("\n"));
      const call = calls[0];
      const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
      const token = call.args.join(" ").match(/installcheck_[a-z0-9]+/)?.[0];
      assert.ok(token);
      const prompt = `${installConfig.SAMPLE_INPUTS.prompt} ${token}`;
      const expectedArgs = [...turn.args.map((arg) => arg === turn.fixture ? path.join(root, arg) : arg), prompt];
      if (platformName === "linux") assert.deepEqual(call.args, expectedArgs);
      else {
        assert.equal(call.command, "C:\\Windows\\System32\\cmd.exe");
        assert.ok(call.args.at(-1).includes(`"${turn.provider}"`));
        assert.ok(call.args.at(-1).includes(`"${prompt}"`));
        assert.ok(!call.args.at(-1).includes(`"${installConfig.SAMPLE_INPUTS.prompt}" "${token}"`));
      }
      assert.equal(call.options.cwd, path.join(fixture.home, "project"));
      assert.equal(call.options.timeout, installConfig.SPAWN_TIMEOUT_MS.turn);
      assert.equal(Object.keys(call.options.env).some((key) => key.toLowerCase() === "nana_role"), false);
      assert.equal(result.lines.filter((line) => line.includes(turn.item)).length, 1, result.lines.join("\n"));
      assert.ok(result.lines.includes(`PASS ${turn.item}`), result.lines.join("\n"));
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
});

// req: R-1070, R-1791
check("pi turn: a nonzero exit or a missing record, run token, rulings heading, writing section or knowledge message each fails the pi turn line, and a full record passes", () => {
  const token = "installcheck_judge";
  const good = passingTurnRecord(token);
  const judge = (record = good, status = 0, stderr = "") => installCheck.judgePiTurn({ record, stderr, status, token });
  assert.equal(judge().passed, true);
  const exited = judge(good, 7, `earlier detail\r\n${"x".repeat(240)} \t`);
  assert.equal(exited.passed, false);
  const exitLine = formatResultLine(installConfig.PI_TURN.item, { status: "FAIL", code: exited.code }, exited.detail);
  assert.equal(exitLine, `FAIL pi turn — exit: exit status 7; last stderr: ${"x".repeat(172)}`);
  assert.equal(exitLine.includes("\n"), false);
  assert.equal(judge(null).passed, false);
  for (const record of [
    { ...good, system: good.system.replace(token, "missing") },
    { ...good, system: good.system.replace(installConfig.PI_TURN.rulingsHeading, "<nana-rulings>") },
    { ...good, system: good.system.replace(installConfig.PI_TURN.writingTag, "missing") },
    { ...good, userMessages: [`not ${installConfig.PI_TURN.knowledgeMarker} ${installConfig.PI_TURN.noteFile}`] },
    { ...good, userMessages: [`${installConfig.PI_TURN.knowledgeMarker} another-note.md`] },
  ]) assert.equal(judge(record).passed, false);
});

// req: R-1792
check("pi turn: a missing bash tool result, one not marked as an error, or one without the gate block text each fails the pi turn line", () => {
  const token = "installcheck_tool";
  const good = passingTurnRecord(token);
  const judge = (toolResults) => installCheck.judgePiTurn({ record: { ...good, toolResults }, stderr: "", status: 0, token });
  assert.equal(judge(good.toolResults).passed, true);
  assert.equal(judge([]).passed, false);
  assert.equal(judge([{ ...good.toolResults[0], toolName: "read" }]).passed, false);
  assert.equal(judge([{ ...good.toolResults[0], isError: false }]).passed, false);
  assert.equal(judge([{ ...good.toolResults[0], text: "ordinary tool failure" }]).passed, false);
});

// req: R-1793
check("pi turn: an extension error on stderr or a stale line in the system prompt fails the pi turn line though every expected text is present", () => {
  const token = "installcheck_stale";
  const good = passingTurnRecord(token);
  const judge = (record, stderr = "") => installCheck.judgePiTurn({ record, stderr, status: 0, token });
  const extensionLine = `${installConfig.PI_TURN.extensionErrorPrefix}fixture): exploded`;
  const extension = judge(good, `noise\r\n${extensionLine} \t`);
  assert.equal(extension.passed, false); assert.ok(extension.detail.includes(extensionLine));
  for (const prefix of [STALE_PREFIX, STALE_UNAVAILABLE_PREFIX]) {
    const staleLine = `${prefix} fixture`;
    const stale = judge({ ...good, system: `${good.system}\r\n${staleLine} \t` });
    assert.equal(stale.passed, false); assert.ok(stale.detail.includes(staleLine));
  }
});

// req: R-1794
check("pi session: an extension_error event or an unavailable notice, widget or status fails the pi session line though get_commands lists reload-runtime, and the session spawn carries the sealed output cap", async () => {
  const events = [
    { type: "extension_error", extensionPath: "fixture.ts", event: "session_start", error: "exploded" },
    { type: "extension_ui_request", id: "n", method: "notify", message: "objective UnAvAiLaBlE: missing" },
    { type: "extension_ui_request", id: "w", method: "setWidget", widgetLines: ["roster unavailable"] },
    { type: "extension_ui_request", id: "s", method: "setStatus", statusText: "knowledge UNAVAILABLE" },
  ];
  for (const [index, event] of events.entries()) {
    const encoded = `${JSON.stringify({ type: "response", command: "get_commands", commands: [{ name: "reload-runtime" }] })}\r\n${JSON.stringify(event)}${index % 2 ? " \t" : ""}`;
    const finding = installCheck.readPiSessionEvents(`not json\r\n${encoded}\r\n{\"truncated\"`);
    assert.ok(finding?.detail, JSON.stringify(event));
    assert.ok(installCheck.readPiSessionEvents(encoded)?.detail, `no-final-newline ${JSON.stringify(event)}`);
    const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
      const result = await spawn(command, args, options);
      return args.includes("--mode") && args.includes("rpc") ? { ...result, stdout: `${encoded}\n` } : result;
    } });
    try {
      const result = await fixture.run;
      assert.ok(result.lines.some((line) => line.startsWith("FAIL pi session —") && line.toLowerCase().includes(index === 0 ? "extension_error" : "unavailable")), result.lines.join("\n"));
      const call = fixture.calls.find((item) => item.args.includes("--mode") && item.args.includes("rpc"));
      assert.equal(call.options.maxOutput, installConfig.PI_SESSION.maxOutput);
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
  assert.equal(installCheck.readPiSessionEvents('{"truncated"'), null);
});

// req: R-1795
check("adoption: a stale line or a stale-check unavailable line fails though the output names the project", async () => {
  for (const [index, prefix] of [STALE_PREFIX, STALE_UNAVAILABLE_PREFIX].entries()) {
    const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
      const result = await spawn(command, args, options);
      if (!`${command} ${args.join(" ")}`.includes("nana-adoption.mjs")) return result;
      const ending = index === 0 ? " \t" : "";
      return { ...result, stdout: `[nana:adoption] ${path.join(fixture.home, "project")}\r\n${prefix} fixture${ending}` };
    } });
    await assertOnlyHookFails(fixture, "hook adoption");
  }
});

// req: R-1796
check("fixture: the turn's fixture extension sits under packages/nana-setup outside every pi package manifest's extension directories", () => {
  const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
  const fixture = path.resolve(root, installConfig.PI_TURN.fixture);
  assert.equal(fs.existsSync(fixture), true);
  const manifests = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.name === "package.json") manifests.push(absolute);
    }
  };
  visit(root);
  const extensionDirs = manifests.flatMap((manifest) => {
    const parsed = JSON.parse(fs.readFileSync(manifest, "utf8"));
    return (parsed.pi?.extensions ?? []).map((entry) => path.resolve(path.dirname(manifest), entry));
  });
  assert.ok(fixture.startsWith(`${path.join(root, "packages", "nana-setup")}${path.sep}`));
  assert.ok(extensionDirs.every((directory) => {
    const relative = path.relative(directory, fixture);
    return relative.startsWith("..") || path.isAbsolute(relative);
  }), `${fixture} is inside ${extensionDirs.join(", ")}`);
});

// req: R-1790, R-1791, R-1792, R-1793, R-1794, R-1795, R-1796
check("pin R-1790 to R-1796: the turn's sealed fixture path, provider, model, arguments, tool, record file, timeout and expected texts, and the session's unavailable word and output cap", () => {
  assert.deepEqual(installConfig.PI_TURN, {
    item: "pi turn",
    fixture: "packages/nana-setup/lib/install-check-turn.mjs",
    provider: "nana-install-check-fixture",
    model: "nana-install-check-turn",
    args: ["--offline", "-e", "packages/nana-setup/lib/install-check-turn.mjs", "--provider", "nana-install-check-fixture", "--model", "nana-install-check-turn", "--no-session", "-p"],
    tool: "bash",
    record: ".nana-install-check-turn.json",
    noteFile: "install-check.md",
    rulingsHeading: "## Standing rulings (nana)",
    writingTag: "<nana-writing>",
    knowledgeMarker: "[nana:knowledge]",
    gateBlockPrefix: "nana-gate: verifier pipe blocked (headless fail-closed):",
    extensionErrorPrefix: "Extension error (",
  });
  assert.equal(installConfig.SPAWN_TIMEOUT_MS.turn, 60000);
  assert.deepEqual(installConfig.PI_SESSION, { unavailableWord: "unavailable", maxOutput: 100000 });
});

// req: R-2000
check("pi post-edit config: before the turn, the installed nana-pack.json keeps its other keys and holds one post-edit command that matches only the fixture file and, run as nana-post-edit runs it, makes the running node print the file and exit with the sealed code", async () => {
  const seed = { objective: { projectFile: "OBJECTIVE.md" }, notify: { enabled: false } };
  let captured = null;
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
    const result = await spawn(command, args, options);
    const configPath = path.join(fixture.home, ".pi", "agent", "nana-pack.json");
    if (`${command} ${args.join(" ")}`.includes("nana-setup.mjs") && args.includes("install")) fs.writeFileSync(configPath, JSON.stringify(seed));
    if (`${command} ${args.join(" ")}`.includes(installConfig.PI_TURN.provider)) captured = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return result;
  } });
  try {
    await fixture.run;
    assert.deepEqual(captured.objective, seed.objective);
    assert.deepEqual(captured.notify, seed.notify);
    assert.deepEqual(Object.keys(captured).sort(), ["notify", "objective", "postEdit"]);
    assert.equal(captured.postEdit.commands.length, 1);
    const command = captured.postEdit.commands[0];
    const matcher = new RegExp(command.match);
    assert.equal(matcher.test(installConfig.PI_TURN_EDIT.file), true);
    assert.equal(matcher.test("other.txt"), false);
    assert.equal(matcher.test(`${installConfig.PI_TURN_EDIT.file}.bak`), false);
    assert.ok(command.run.includes(process.execPath));
    const target = path.join(fixture.home, installConfig.PI_TURN_EDIT.file);
    const contents = "fixture text\r\ntrailing tab\t";
    fs.writeFileSync(target, contents);
    const replacement = process.platform === "win32" ? '"%NANA_PI_FILE%"' : `"${target}"`;
    const commandLine = command.run.replaceAll(installConfig.PI_TURN_EDIT.placeholder, () => replacement);
    const commandEnv = process.platform === "win32" ? { ...process.env, NANA_PI_FILE: target } : process.env;
    const ran = spawnSync(commandLine, { shell: true, encoding: "utf8", env: commandEnv });
    assert.equal(ran.stdout, contents);
    assert.equal(ran.status, installConfig.PI_TURN_EDIT.exitCode);
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-2001
check("pi post-edit config: a missing, unparseable or non-object installed nana-pack.json is left as install left it", async () => {
  for (const original of [null, "{ not json", "[]"]) {
    const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
      const result = await spawn(command, args, options);
      if (`${command} ${args.join(" ")}`.includes("nana-setup.mjs") && args.includes("install") && original !== null) {
        fs.writeFileSync(path.join(fixture.home, ".pi", "agent", "nana-pack.json"), original);
      }
      return result;
    } });
    const configPath = path.join(fixture.home, ".pi", "agent", "nana-pack.json");
    try {
      await fixture.run;
      if (original === null) assert.equal(fs.existsSync(configPath), false);
      else assert.equal(fs.readFileSync(configPath, "utf8"), original);
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
});

// req: R-2002
check("pi post-edit: one line per run, PASS only when a write result not marked as an error holds a check line with the sealed exit text and the run token", async () => {
  const token = "installcheck_postedit";
  const edit = installConfig.PI_TURN_EDIT;
  const good = passingTurnRecord(token);
  const accepted = { ...good, toolResults: [good.toolResults[0], { toolName: edit.tool, isError: false, text: `noise\r\n${edit.failureLead}fixture ${edit.exitText}: ${token} \t` }] };
  assert.equal(installCheck.judgePiPostEdit({ record: accepted, token }).passed, true);
  const variants = [
    { record: { ...good, toolResults: [good.toolResults[0]] }, detail: `no ${edit.tool} tool result` },
    { record: { ...good, toolResults: [good.toolResults[0], { toolName: edit.tool, isError: true, text: `${edit.failureLead}${edit.exitText} ${token}` }] }, detail: "marked as an error" },
    { record: { ...good, toolResults: [good.toolResults[0], { toolName: edit.tool, isError: false, text: `not ${edit.failureLead}${edit.exitText} ${token}` }] }, detail: `starts with ${edit.failureLead}` },
    { record: { ...good, toolResults: [good.toolResults[0], { toolName: edit.tool, isError: false, text: `${edit.failureLead}missing exit ${token}` }] }, detail: edit.exitText },
    { record: { ...good, toolResults: [good.toolResults[0], { toolName: edit.tool, isError: false, text: `${edit.failureLead}fixture ${edit.exitText}` }] }, detail: "run token" },
  ];
  for (const variant of variants) {
    const judged = installCheck.judgePiPostEdit({ record: variant.record, token });
    assert.equal(judged.passed, false);
    assert.ok(judged.detail.includes(variant.detail), judged.detail);
  }
  for (const platformName of ["linux", "win32"]) {
    const fixture = recordingRun({ platformName });
    try {
      const result = await fixture.run;
      assert.deepEqual(result.lines.filter((line) => line.includes(edit.item)), [`PASS ${edit.item}`]);
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
});

// req: R-2003
check("pi turn tools: on win32 the sealed tool list naming powershell comes before the sealed turn arguments, and linux and darwin carry no tool list", async () => {
  const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
  for (const piShim of [null, "C:\\tools\\pi.cmd"]) {
    const fixture = recordingRun({ platformName: "win32", piShim });
    try {
      await fixture.run;
      const call = fixture.calls.find((item) => `${item.command} ${item.args.join(" ")}`.includes(installConfig.PI_TURN.provider));
      const mapped = installConfig.PI_TURN.args.map((arg) => arg === installConfig.PI_TURN.fixture ? path.join(root, arg) : arg);
      if (piShim === null) {
        const token = call.args.at(-1).match(/installcheck_[a-z0-9]+/)?.[0];
        assert.ok(token);
        assert.deepEqual(call.args.slice(0, 2), installConfig.PI_TURN_POWERSHELL.toolList);
        assert.deepEqual(call.args.slice(2), [...mapped, `${installConfig.SAMPLE_INPUTS.prompt} ${token}`]);
      } else {
        const commandLine = call.args.at(-1);
        assert.ok(commandLine.indexOf(`"${installConfig.PI_TURN_POWERSHELL.toolList[0]}"`) < commandLine.indexOf('"--offline"'));
        assert.ok(commandLine.indexOf(`"${installConfig.PI_TURN_POWERSHELL.toolList[1]}"`) < commandLine.indexOf('"--offline"'));
      }
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
  for (const platformName of ["linux", "darwin"]) {
    const fixture = recordingRun({ platformName });
    try {
      await fixture.run;
      const call = fixture.calls.find((item) => `${item.command} ${item.args.join(" ")}`.includes(installConfig.PI_TURN.provider));
      assert.equal(call.args.includes("--tools"), false);
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
});

// req: R-2004
check("pi powershell gate: win32 prints one line, PASS only when an errored powershell result starts with the gate block text, and linux and darwin print none", async () => {
  const powershell = installConfig.PI_TURN_POWERSHELL;
  const good = passingTurnRecord("installcheck_powershell");
  assert.equal(installCheck.judgePiPowerShell({ record: good }).passed, true);
  for (const record of [
    { ...good, toolResults: good.toolResults.filter((result) => result.toolName !== powershell.tool) },
    { ...good, toolResults: good.toolResults.map((result) => result.toolName === powershell.tool ? { ...result, isError: false } : result) },
    { ...good, toolResults: good.toolResults.map((result) => result.toolName === powershell.tool ? { ...result, text: `noise ${installConfig.PI_TURN.gateBlockPrefix}` } : result) },
  ]) assert.equal(installCheck.judgePiPowerShell({ record }).passed, false);
  for (const platformName of ["win32", "linux", "darwin"]) {
    const fixture = recordingRun({ platformName });
    try {
      const result = await fixture.run;
      const lines = result.lines.filter((line) => line.includes(powershell.item));
      assert.deepEqual(lines, platformName === "win32" ? [`PASS ${powershell.item}`] : []);
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
});

check("pin R-2000 to R-2004: the post-edit item, tool, fixture file, match, placeholder, failure lead, check source and exit code, and the PowerShell item, tool, platforms and tool list", () => {
  assert.deepEqual(installConfig.PI_TURN_EDIT, {
    item: "pi post-edit",
    tool: "write",
    file: "install-check-post-edit.txt",
    match: "install-check-post-edit\\.txt$",
    placeholder: "{file}",
    failureLead: "- check ",
    exitCode: 3,
    source: "process.stdout.write(require('fs').readFileSync(process.argv[1],'utf8'));process.exitCode=3",
    exitText: "exited 3",
  });
  assert.deepEqual(installConfig.PI_TURN_POWERSHELL, {
    item: "pi powershell gate",
    tool: "powershell",
    platforms: ["win32"],
    toolList: ["--tools", "read,bash,edit,write,powershell"],
  });
});

await runChecks();
if (failures) process.exitCode = 1;
