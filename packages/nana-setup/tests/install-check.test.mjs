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
import { buildEnvironment, classifyResult, mapHookEntries, parsePiList, hookInvocation } from "../lib/install-check.mjs";

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
check("install invokes real-home mode without sandbox flags", () => {
  const source = readFileSync(fileURLToPath(new URL("../bin/install-check.mjs", import.meta.url)), "utf8");
  assert.ok(source.includes('"packages/nana-setup/bin/nana-setup.mjs"), "install"'));
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

// req: R-1080
check("reporting matches known-red fingerprint and expiry and rejects unexpected passes", () => {
  const item = { item: "hook objective", code: "no-output", owner: "R-1057", expires: "2099-01-01" };
  assert.equal(classifyResult("hook objective", "no-output", false, [item], new Date("2098-12-31T00:00:00Z")).status, "XFAIL");
  assert.equal(classifyResult("hook objective", "wrong-form", false, [item], new Date("2098-12-31T00:00:00Z")).status, "FAIL");
  assert.equal(classifyResult("hook objective", "no-output", false, [item], new Date("2099-01-01T00:00:00Z")).status, "FAIL");
  assert.equal(classifyResult("hook objective", null, true, [item], new Date("2098-12-31T00:00:00Z")).status, "FAIL");
  assert.deepEqual(KNOWN_RED.darwin, []);
});

if (failures) process.exitCode = 1;
