/**
 * @module packages/nana-setup/tests/install-check.test.mjs
 * @purpose Pins install-check configuration, pure matching, environment and reporting contracts.
 * @inputs Sealed install-check values and injected process inputs.
 * @outputs PASS/FAIL lines and a nonzero exit on failed checks.
 * @effects none
 * @errors Failed checks set a nonzero exit code.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { ALLOWED_HOOK_KEYS, HOOKS, KNOWN_RED, OVERRIDE_ENV } from "../lib/install-check-config.mjs";
import { buildEnvironment, classifyResult, formatResultLine, hookFailureReason, mapHookEntries, parsePiList, hookInvocation, journalHasUnadopted } from "../lib/install-check.mjs";

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

if (failures) process.exitCode = 1;
