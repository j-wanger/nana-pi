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
import { ALLOWED_HOOK_KEYS, DOCTOR_NOTES, HOOKS, KNOWN_RED, OVERRIDE_ENV } from "../lib/install-check-config.mjs";
import { buildEnvironment, classifyResult, formatResultLine, hookFailureReason, mapHookEntries, parsePiList, hookInvocation, findGitBash, journalHasUnadopted, runInstallCheck } from "../lib/install-check.mjs";
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
function recordingRun({ platformName = "linux", env = {}, failInstall = false, spawnOverride = null } = {}) {
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
        const matcher = platformName === "win32" && hook.tool === "Bash" ? "Bash|PowerShell" : hook.matcher;
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
  const run = runInstallCheck({ root, home, platformName, env: { PATH: platformName === "win32" ? "C:\\tools" : "/bin", ComSpec: "C:\\Windows\\System32\\cmd.exe", ...env }, spawn: (command, args, options) => spawnOverride ? spawnOverride({ command, args, options, spawn }) : spawn(command, args, options), exists: platformName === "win32" ? (candidate) => candidate.toLowerCase().endsWith("\\pi.exe") : undefined, now: () => new Date("2026-10-12T00:00:00Z"), out: () => {} });
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
      const isHook = /nana-(objective|adoption|shared-memory|knowledge)|verifier-pipe/.test(`${call.command} ${call.args.join(" ")}`);
      const isSession = call.args.includes("--mode") && call.args.includes("rpc");
      if (isHook) expected.CLAUDE_PROJECT_DIR = path.join(fixture.home, "project");
      if (isSession) expected.NANA_TEST_TEMP_ROOTS = "";
      assert.deepEqual(call.options.env, expected);
    }
  } finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
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
        for (const name of ["nana-setup.mjs", "list", "--mode rpc", "nana-objective.mjs", "nana-adoption.mjs", "nana-shared-memory.mjs", "verifier-pipe.mjs", "nana-knowledge.ts"]) assert.ok(joined.includes(name), name);
        assert.ok(fixture.calls.some((call) => call.args[0] === "install" && call.args.some((arg) => arg.includes("pi-subagents"))));
        assert.ok(fixture.calls.some((call) => call.args.includes("doctor")));
        assert.ok(fixture.calls.filter((call) => call.options.input?.includes("PreToolUse")).length >= 2);
      } else assert.ok(fixture.calls.some((call) => call.command === "C:\\tools\\pi.exe"));
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

const hookGroups = (platform = "darwin", overrides = {}) => HOOKS.filter((h) => !h.platforms || h.platforms.includes(platform)).map((h) => {
  const e = { type: "command", command: h.form[platform] === "exec" ? "node" : `node ${h.script}`, timeout: h.timeout, ...(h.form[platform] === "exec" ? { args: [h.script] } : {}) };
  const matcher = Object.hasOwn(overrides, h.label) ? overrides[h.label] : platform === "win32" && h.tool === "Bash" ? "Bash|PowerShell" : h.matcher;
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
  for (const matcher of ["*", "", undefined]) { const rows = hookGroups("darwin", { "hook verifier pipe (Bash)": matcher }); assert.equal(mapHookEntries(rows, "darwin").failures.length, 0); }
});
// req: R-1074
check("matcher: 'Bash, PowerShell' and 'Bash|PowerShell' admit both tools", () => {
  for (const matcher of ["Bash, PowerShell", "Bash|PowerShell"]) assert.equal(mapHookEntries(hookGroups("win32", { "hook verifier pipe (Bash)": matcher, "hook verifier pipe (PowerShell)": matcher }), "win32").failures.length, 0);
});
// req: R-1074
check("matcher: list separators admit only the exact listed tools", () => {
  for (const matcher of ["Bash, PowerShell", "Bash|PowerShell"]) {
    assert.equal(mapHookEntries(hookGroups("win32", { "hook verifier pipe (Bash)": matcher, "hook verifier pipe (PowerShell)": matcher }), "win32").failures.length, 0);
  }
});
// req: R-1074
check("matcher: ^Bash$ admits Bash", () => { assert.equal(mapHookEntries(hookGroups("darwin", { "hook verifier pipe (Bash)": "^Bash$" }), "darwin").failures.length, 0); });
// req: R-1074
check("matcher: NotBash does not admit Bash", () => { expectBad(hookGroups("darwin", { "hook verifier pipe (Bash)": "NotBash" })); });
// req: R-1074
check("matcher: a resume SessionStart matcher fails", () => { expectBad(hookGroups("darwin", { "hook objective": "resume" })); });
// req: R-1074
check("matcher: win32 requires PowerShell in the verifier matcher", () => { expectBad(hookGroups("win32", { "hook verifier pipe (Bash)": "Bash", "hook verifier pipe (PowerShell)": "Bash" }), "win32"); });
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
  assert.deepEqual(HOOKS.map(h => [h.label, h.event, h.matcher, h.script, h.timeout, h.form]), [
    ["hook objective", "SessionStart", "startup", "nana-objective.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook adoption", "SessionStart", "startup", "nana-adoption.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook shared memory", "SessionStart", "startup", "nana-shared-memory.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook verifier pipe (Bash)", "PreToolUse", "Bash", "verifier-pipe.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook verifier pipe (PowerShell)", "PreToolUse", "PowerShell", "verifier-pipe.mjs", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
    ["hook knowledge pull", "UserPromptSubmit", null, "nana-knowledge.ts", 5, { darwin: "shell", linux: "shell", win32: "exec" }],
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
    assert.equal(findGitBash([entry], (candidate) => candidate.toLowerCase() === expected.toLowerCase()), expected);
  }
  assert.equal(findGitBash(["C:\\Windows\\System32"], (candidate) => candidate.toLowerCase() === "c:\\windows\\system32\\bash.exe"), null);
});
// req: R-1075
check("dispatch: each hook runs in the fixture project with CLAUDE_PROJECT_DIR set to it", async () => {
  const fixture = recordingRun();
  try { await fixture.run; const hooks = fixture.calls.filter(c => /nana-(objective|adoption|shared-memory|knowledge)|verifier-pipe/.test(c.args.join(" "))); assert.ok(hooks.length >= 5); for (const c of hooks) { assert.equal(c.options.cwd, path.join(fixture.home, "project")); assert.equal(c.options.env.CLAUDE_PROJECT_DIR, path.join(fixture.home, "project")); } }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1075
check("dispatch: the three SessionStart entries start before any of them finishes", async () => {
  let starts = 0; let finishes = 0; let release;
  const gate = new Promise(resolve => { release = resolve; });
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) => {
    const name = `${command} ${args.join(" ")}`;
    if (!/nana-(objective|adoption|shared-memory)/.test(name)) return spawn(command, args, options);
    starts++;
    if (starts === 3) release();
    await gate;
    if (finishes > 0) throw new Error("SessionStart started after a finish");
    const result = await spawn(command, args, options); finishes++; return result;
  }});
  try { await fixture.run; assert.equal(starts, 3); assert.equal(finishes, 3); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1075
check("dispatch: a hook that runs past its timeout is a FAIL whose reason prints the duration", async () => {
  const fixture = recordingRun({ spawnOverride: async ({ command, args, options, spawn }) =>
    /nana-objective/.test(`${command} ${args.join(" ")}`) ? { error: { code: "ETIMEDOUT" }, ms: 5432 } : spawn(command, args, options) });
  try { const result = await fixture.run; assert.ok(result.lines.includes("FAIL hook objective — timeout: timed out after 5432 ms")); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
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
check("output: a 10,001-character stdout fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("nana-objective.mjs"), () => ({ stdout: `[nana:objective] ${"x".repeat(10000)}` })), "hook objective"));
// req: R-1077
check("verifier: an allow decision fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("verifier-pipe.mjs"), () => ({ stdout: `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow" } })}\\n` })), "hook verifier pipe (Bash)"));
// req: R-1077
check("verifier: a missing hookEventName fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("verifier-pipe.mjs"), () => ({ stdout: `${JSON.stringify({ hookSpecificOutput: { permissionDecision: "ask" } })}\\n` })), "hook verifier pipe (Bash)"));
// req: R-1077
check("verifier: malformed JSON fails", async () => await assertOnlyHookFails(scriptedFixture(hookIs("verifier-pipe.mjs"), () => ({ stdout: "not-json\\n" })), "hook verifier pipe (Bash)"));
// req: R-1077
check("verifier: two JSON lines fail", async () => await assertOnlyHookFails(scriptedFixture(hookIs("verifier-pipe.mjs"), () => ({ stdout: `${JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask" } })}\\n{}\\n` })), "hook verifier pipe (Bash)"));
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
// req: R-1072
check("checklist: the check writes only the objective lines and one MEMORY.md line, and puts the bin folder first on PATH except on win32", async () => {
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
      const pathValue = fixture.calls.find(call => call.args[0] === "init").options.env.PATH;
      if (platformName === "win32") assert.equal(pathValue, "C:\\tools");
      else assert.equal(pathValue.split(path.delimiter)[0], path.join(fixture.home, ".local/bin"));
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
  try { const result = await fixture.run; assert.ok(result.lines.includes("FAIL doctor — note-row: · unknown note")); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1081, R-1080
check("doctor: a known-red note row is an XFAIL", async () => {
  const fixture = recordingRun({ platformName: "win32", spawnOverride: async ({ args, options, spawn, command }) => args.includes("doctor") ? { status: 0, stdout: "· unexpected note" } : spawn(command, args, options) });
  try { const result = await fixture.run; assert.ok(result.lines.some(line => line.startsWith("XFAIL doctor — note-row:"))); }
  finally { fs.rmSync(fixture.home, { recursive: true, force: true }); }
});
// req: R-1081
check("pin R-1081: the doctor note list", () => {
  assert.deepEqual(DOCTOR_NOTES, {
    darwin: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
    linux: ["pi agent dir", "pi mcp.json", "desk service", "release status"],
    win32: ["pi agent dir", "pi mcp.json", "desk service", "release status", "PATH pi-review", "PATH pi-worker", "PATH nana-land", "PATH nana-setup", "skill requirements", "skill nana-standards"],
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
if (failures) process.exitCode = 1;
