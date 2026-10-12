/**
 * @module packages/nana-setup/tests/install-check.test.mjs
 * @purpose Pins install-check configuration, pure matching, environment and reporting contracts.
 * @inputs Sealed install-check values and injected process inputs.
 * @outputs PASS/FAIL lines and a nonzero exit on failed checks.
 * @effects none
 * @errors Failed checks set a nonzero exit code.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";
import { ALLOWED_HOOK_KEYS, HOOKS, KNOWN_RED, OVERRIDE_ENV } from "../lib/install-check-config.mjs";
import { buildEnvironment, classifyResult, formatResultLine, hookFailureReason, mapHookEntries, parsePiList, hookInvocation, journalHasUnadopted, runInstallCheck } from "../lib/install-check.mjs";
import { projectKey } from "../lib/project-key.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { findPi, winCommand } from "../../nana-pack/lib/win-command.mjs";

let failures = 0;
const check = (title, fn) => {
  try { fn(); console.log("PASS", title); }
  catch (error) { failures++; console.log("FAIL", title, error.message); }
};

// req: R-1074
check("sealed hook table and allowed entry shape", () => {
  assert.equal(HOOKS.length, 6);
  assert.deepEqual(ALLOWED_HOOK_KEYS, ["type", "command", "args", "timeout", "statusMessage"]);
  assert.deepEqual(HOOKS.map((h) => h.label), ["hook objective", "hook adoption", "hook shared memory", "hook verifier pipe (Bash)", "hook verifier pipe (PowerShell)", "hook knowledge pull"]);
  assert.ok(HOOKS.every((h) => h.form.darwin && h.form.linux && h.form.win32));
});

// req: R-1074, R-1082
check("hook mapping rejects wrong dispatch forms on both platform families", () => {
  const entries = HOOKS.filter((h) => !h.platforms || h.platforms.includes("darwin"));
  const groups = entries.map((h) => ({ event: h.event, group: { ...(h.matcher ? { matcher: h.matcher } : {}), hooks: [{ type: "command", command: `node ${h.script}`, timeout: h.timeout }] } }));
  assert.equal(mapHookEntries(groups, "darwin").failures.length, 0);
  assert.ok(mapHookEntries(groups, "win32").failures.some((x) => x.code === "wrong-form"));
});

// req: R-1071
check("environment removes overrides and redirects home, temp and npm cache", () => {
  const env = buildEnvironment({ HOME: "/outside", USERPROFILE: "C:\\outside", NANA_ROLE: "worker", PI_CODING_AGENT_DIR: "/bad", npm_config_userconfig: "/bad", PATH: "/bin" }, "/sandbox/home", "linux");
  assert.equal(env.HOME, "/sandbox/home");
  assert.equal(env.USERPROFILE, "/sandbox/home");
  for (const key of ["TMPDIR", "TEMP", "TMP"]) assert.equal(env[key], "/sandbox/home/tmp");
  assert.equal(env.npm_config_cache, "/sandbox/home/.npm");
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
  const source = readFileSync(fileURLToPath(new URL("../bin/install-check.mjs", import.meta.url)), "utf8");
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
function recordingRun({ platformName = "linux", env = {}, failInstall = false } = {}) {
  const home = tempHome();
  const calls = [];
  const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
  const spawn = async (command, args, options) => {
    calls.push({ command, args, options: { ...options, env: { ...options.env } } });
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
        (hooks[hook.event] ??= []).push({ ...(hook.matcher ? { matcher: hook.matcher } : {}), hooks: [entry] });
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
    if (joined.includes("nana-objective.mjs")) {
      const objective = fs.readFileSync(path.join(home, ".pi/agent/nana-objective.md"), "utf8");
      return { status: 0, stdout: `[nana:objective] ${objective.match(/installcheck_[a-z0-9]+/)?.[0] ?? "fixture"}` };
    }
    if (joined.includes("nana-adoption.mjs")) return { status: 0, stdout: `[nana:adoption] ${path.join(home, "project")}` };
    if (joined.includes("nana-shared-memory.mjs")) {
      const memory = fs.readFileSync(path.join(home, ".claude/nana-memory/shared/MEMORY.md"), "utf8");
      return { status: 0, stdout: `[nana:shared-memory] ${memory.split("\n").find((line) => line.startsWith("- [")) ?? ""}` };
    }
    if (joined.includes("nana-knowledge.ts")) return { status: 0, stdout: "[nana:knowledge] install-check.md" };
    if (joined.includes("verifier-pipe.mjs")) {
      const input = JSON.parse(options.input);
      return { status: 0, stdout: input.tool_input.command === (input.tool_name === "PowerShell" ? "npm test | Select-Object -Last 5; git commit -m x" : "npm test | tail -1 && git commit -m done") ? `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask" } })}\n` : "" };
    }
    if (joined.includes("nana-setup.mjs") && args.includes("doctor")) return { status: 0, stdout: "" };
    return { status: 0, stdout: "" };
  };
  const run = runInstallCheck({ root, home, platformName, env: { PATH: platformName === "win32" ? "C:\\tools" : "/bin", ComSpec: "C:\\Windows\\System32\\cmd.exe", ...env }, spawn, exists: platformName === "win32" ? (candidate) => candidate.toLowerCase().endsWith("\\pi.exe") : undefined, now: () => new Date("2026-10-12T00:00:00Z"), out: () => {} });
  return { home, calls, run };
}

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

// req: R-1071, R-1084
check("environment: the recording spawn sees the same sanitized environment on every child", async () => {
  const fixture = recordingRun({ env: { PI_CODING_AGENT_DIR: "/outside", npm_config_userconfig: "/outside" } });
  try {
    await fixture.run;
    assert.ok(fixture.calls.length > 10);
    const first = fixture.calls[0].options.env;
    for (const call of fixture.calls) assert.deepEqual(Object.keys(call.options.env).sort().map((key) => [key, call.options.env[key]]), Object.keys(first).sort().map((key) => [key, first[key]]));
    assert.equal(first.PI_CODING_AGENT_DIR, undefined); assert.equal(first.npm_config_userconfig, undefined);
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
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
        for (const name of ["nana-setup.mjs", "list", "--mode rpc", "nana-objective.mjs", "nana-adoption.mjs", "nana-shared-memory.mjs", "verifier-pipe.mjs", "nana-knowledge.ts"]) assert.ok(joined.includes(name), name);
        assert.ok(fixture.calls.some((call) => call.args[0] === "install" && call.args.some((arg) => arg.includes("pi-subagents"))));
        assert.ok(fixture.calls.some((call) => call.args.includes("doctor")));
        assert.ok(fixture.calls.filter((call) => call.options.input?.includes("PreToolUse")).length >= 2);
      } else assert.ok(fixture.calls.some((call) => call.args[0] === "--version"));
    } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
  }
});

// req: R-1071
check("install: the command line carries no override flag", async () => {
  const fixture = recordingRun();
  try { await fixture.run; const call = fixture.calls.find((item) => item.args.includes("install") && item.args.some((arg) => arg.includes("nana-setup.mjs"))); assert.ok(call); assert.deepEqual(call.args.slice(1), ["install"]); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});

// req: R-1071
check("platform: NANA_SETUP_PLATFORM in the caller changes nothing", () => {
  const expected = buildEnvironment({ PATH: "/bin" }, "/home", "linux");
  const actual = buildEnvironment({ PATH: "/bin", NANA_SETUP_PLATFORM: "win32" }, "/home", "linux");
  assert.deepEqual(actual, expected);
});

// req: R-1079
check("pi launch: on win32, pi install, pi list and the session go through findPi and winCommand", async () => {
  const fixture = recordingRun({ platformName: "win32" });
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
    const piCommands = fixture.calls.filter((call) => call.command === "C:\\tools\\pi.exe");
    assert.ok(piCommands.some((call) => call.args.some((arg) => arg.includes("pi-subagents"))));
    assert.ok(piCommands.some((call) => call.args.includes("list")));
    assert.ok(piCommands.some((call) => call.args.includes("--mode") && call.args.includes("rpc")));
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
check("reporting: a listed item that passes prints FAIL", () => {
  const item = { item: "case", code: "note-row", owner: "R-1", expires: "2026-10-13" };
  assert.equal(classifyResult("case", null, true, [item], new Date("2026-10-12T00:00:00Z")).status, "FAIL");
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
  for (const platform of ["darwin", "win32"]) for (const entry of KNOWN_RED[platform]) {
    assert.deepEqual(Object.keys(entry), ["item", "code", "owner", "expires"]);
    assert.equal(typeof entry.item, "string"); assert.ok(entry.code); assert.match(entry.owner, /^R-\d+$/); assert.match(entry.expires, /^\d{4}-\d{2}-\d{2}$/);
  }
});

if (failures) process.exitCode = 1;
