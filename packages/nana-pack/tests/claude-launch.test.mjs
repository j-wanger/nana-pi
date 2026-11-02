/**
 * @module packages/nana-pack/tests/claude-launch.test.mjs
 * @purpose Pin safe Windows npm Claude resolution and exact memory-runner process arguments.
 * @inputs Injected Windows PATH and package fixtures plus Claude runner spawn seams.
 * @outputs Named PASS/FAIL/SKIP lines.
 * @effects disk (OS temporary echo fixtures); process (echo child on Windows).
 * @errors Failed assertions set exit code 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { claudeRunner, createRunner } from "../../../scripts/memory-shape-runners.mjs";
let claudeCommand;
try { ({ claudeCommand } = await import("../lib/claude-launch.mjs")); } catch { claudeCommand = () => ({ refused: "resolver not implemented" }); }
import { tmpDir } from "./tmp-dir.mjs";

const PACKAGE = "@anthropic-ai/claude-code";
const ARGS = ["-p", "--json-schema", '{"type":"object"}', "line one\nline two", "trail\\", '\\"', '""', "", "%PATH%", "!"];
let fails = 0;
const check = async (name, fn) => {
 try { await fn(); console.log("PASS", name); }
 catch (error) { console.log("FAIL", name, error.message); fails++; }
};
const fixture = () => {
 const files = new Map();
 const isFile = (p) => files.has(p.toLowerCase());
 const exists = isFile;
 const readText = (p) => { const value = files.get(p.toLowerCase()); if (value === undefined) throw Error("ENOENT"); return value; };
 const pkg = (root, data = { name: PACKAGE, bin: { claude: "bin/claude.exe" } }) => {
  files.set(path.win32.join(root, "package.json").toLowerCase(), JSON.stringify(data));
  files.set(path.win32.join(root, "bin", "claude.exe").toLowerCase(), "MZ");
 };
 const options = { platform: "win32", env: { PATH: "C:\\npm" }, cwd: "C:\\work", exists, isFile, readText };
 return { files, pkg, options };
};

// req: R-3470
await check("native executable wins over an earlier npm shim", () => {
 const nativeOnly = fixture(); nativeOnly.files.set("c:\\native\\claude.exe", "MZ");
 assert.deepEqual(claudeCommand(ARGS, { ...nativeOnly.options, env: { PATH: "C:\\native" } }), { command: "C:\\native\\claude.exe", args: ARGS });
 const f = fixture();
 f.files.set("c:\\npm\\claude.cmd", "shim");
 f.files.set("c:\\native\\claude.exe", "MZ");
 const r = claudeCommand(ARGS, { ...f.options, env: { PATH: "C:\\npm;C:\\native" } });
 assert.deepEqual(r, { command: "C:\\native\\claude.exe", args: ARGS });
});
// req: R-3470
await check("resolves npm global and local layouts and case-insensitive Path", () => {
 for (const [shim, env, packageRoot] of [
  ["C:\\npm\\claude.cmd", { PATH: "C:\\npm" }, "C:\\npm\\node_modules\\@anthropic-ai\\claude-code"],
  ["C:\\repo\\node_modules\\.bin\\claude.cmd", { Path: "C:\\repo\\node_modules\\.bin" }, "C:\\repo\\node_modules\\@anthropic-ai\\claude-code"],
 ]) {
  const f = fixture(); f.options.env = env; f.files.set(shim.toLowerCase(), "shim"); f.pkg(packageRoot);
  const r = claudeCommand(ARGS, f.options);
  assert.equal(r.command, path.win32.join(packageRoot, "bin", "claude.exe")); assert.deepEqual(r.args, ARGS);
 }
});
// req: R-3471
await check("names every refusal and does not spawn on refusal", async () => {
 const f = fixture();
 const missingEntry = fixture(); missingEntry.files.set("c:\\npm\\claude.cmd", "shim");
 missingEntry.pkg("C:\\npm\\node_modules\\@anthropic-ai\\claude-code");
 missingEntry.files.delete("c:\\npm\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe");
 assert.equal(claudeCommand([], missingEntry.options).refused, "Claude entry C:\\npm\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe is not a file");
 const cases = [
  ["no Claude", { ...f.options, env: { PATH: "C:\\empty" } }, "not on PATH"],
  ["missing package", { ...f.options, exists: (p) => p.toLowerCase() === "c:\\npm\\claude.cmd", readText: () => { throw Error(); } }, "npm"],
  ["wrong package", (() => { const x = fixture(); x.files.set("c:\\npm\\claude.cmd", "shim"); x.pkg("C:\\npm\\node_modules\\@anthropic-ai\\claude-code", { name: "other", bin: { claude: "bin/claude.exe" } }); return x.options; })(), "not the"],
  ["no bin", (() => { const x = fixture(); x.files.set("c:\\npm\\claude.cmd", "shim"); x.pkg("C:\\npm\\node_modules\\@anthropic-ai\\claude-code", { name: PACKAGE }); return x.options; })(), "no claude bin"],
  ["outside bin", (() => { const x = fixture(); x.files.set("c:\\npm\\claude.cmd", "shim"); x.pkg("C:\\npm\\node_modules\\@anthropic-ai\\claude-code", { name: PACKAGE, bin: { claude: "..\\..\\evil.exe" } }); return x.options; })(), "outside"],
  ["non-exe bin", (() => { const x = fixture(); x.files.set("c:\\npm\\claude.cmd", "shim"); x.pkg("C:\\npm\\node_modules\\@anthropic-ai\\claude-code", { name: PACKAGE, bin: { claude: "bin/claude.js" } }); return x.options; })(), ".exe"],
 ];
 for (const [name, options, text] of cases) assert.ok(claudeCommand([], options).refused?.includes(text), name);
 let calls = 0;
 const result = await claudeRunner({ system: "sys", prompt: "prompt", schema: { type: "object" } }, { platform: "win32", resolveLaunch: () => ({ refused: "test refusal" }), spawnSync: () => { calls++; } });
 assert.equal(result.ok, false); assert.equal(calls, 0);
});
// req: R-3471
await check("scripts-disabled placeholder fails safely", async () => {
 if (process.platform !== "win32") return console.log("SKIP scripts-disabled placeholder fails safely — Windows leg only");
 const root = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "claude-placeholder-")));
 try {
  const shim = path.join(root, "claude.cmd"); fs.writeFileSync(shim, "stub");
  const pkgDir = path.join(root, "node_modules", ...PACKAGE.split("/"));
  fs.mkdirSync(path.join(pkgDir, "bin"), { recursive: true });
  fs.writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify({ name: PACKAGE, bin: { claude: "bin/claude.exe" } }));
  fs.writeFileSync(path.join(pkgDir, "bin", "claude.exe"), "#!/bin/sh\necho placeholder\n");
  const placeholder = path.join(pkgDir, "bin", "claude.exe");
  const result = await claudeRunner({ system: "sys", prompt: "prompt", schema: { type: "object" } }, { platform: "win32", resolveLaunch: (args) => ({ command: placeholder, args }) });
  assert.equal(result.ok, false);
 } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
// req: R-3472
await check("injected spawn stays unchanged and resolved spawn preserves arguments and options", async () => {
 const input = { system: "sys\nline", prompt: "prompt", schema: { type: "object", properties: { x: { type: "string" } } } };
 let injected;
 await createRunner({ runner: "claude", spawn: (...args) => { injected = args; return { status: 1, stdout: "" }; } })(input);
 assert.equal(injected[0], "claude"); assert.ok(injected[1].includes("--json-schema")); assert.equal(injected[2].windowsHide, true);
 let mainCall;
 await claudeRunner(input, { platform: "darwin", spawnSync: (...args) => { mainCall = args; return { status: 1, stdout: "" }; } });
 let resolverCalls = 0;
 let received;
 await createRunner({ runner: "claude", platform: "win32", resolveLaunch: (args, options) => {
  resolverCalls++; assert.deepEqual(args, mainCall[1]);
  assert.deepEqual({ env: options.env, cwd: options.cwd }, { env: mainCall[2].env, cwd: mainCall[2].cwd });
  return { command: "resolved.exe", args };
 }, spawnSync: (...args) => { received = args; return { status: 1, stdout: "" }; } })(input);
 assert.equal(resolverCalls, 1);
 assert.equal(received[0], "resolved.exe"); assert.deepEqual(received[1], mainCall[1]);
 assert.deepEqual({ input: received[2].input, encoding: received[2].encoding, stdio: received[2].stdio, maxBuffer: received[2].maxBuffer, timeout: received[2].timeout, cwd: received[2].cwd, windowsHide: received[2].windowsHide, env: received[2].env }, { input: mainCall[2].input, encoding: mainCall[2].encoding, stdio: mainCall[2].stdio, maxBuffer: mainCall[2].maxBuffer, timeout: mainCall[2].timeout, cwd: mainCall[2].cwd, windowsHide: mainCall[2].windowsHide, env: mainCall[2].env });
});
// req: R-3473
await check("win32 default spawn preserves byte-sensitive argv without a shell", async () => {
 if (process.platform !== "win32") return console.log("SKIP win32 default spawn preserves byte-sensitive argv without a shell — Windows leg only");
 const dir = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "claude-argv-")));
 const echo = path.join(dir, "echo.cjs");
 fs.writeFileSync(echo, "const model=process.argv[2];const argv=process.argv.slice(3);process.stdout.write(JSON.stringify({structured_output:{argv},modelUsage:{[model]:{}},total_cost_usd:0,result:'ok'}))");
 const input = { system: "sys", prompt: "prompt", schema: { type: "object" } };
 const { CLAUDE_MODEL, CLAUDE_EFFORT } = await import("../lib/memory-shaping-config.mjs");
 const result = await claudeRunner(input, { platform: "win32", resolveLaunch: (args) => ({ command: process.execPath, args: [echo, CLAUDE_MODEL, ...args, ...ARGS] }), spawnSync: (command, args, opts) => { assert.equal(opts.shell, undefined); assert.equal(opts.windowsVerbatimArguments, undefined); return spawnSync(command, args, opts); } });
 assert.equal(result.ok, true); assert.deepEqual(JSON.parse(result.text).argv, ["-p", "--model", CLAUDE_MODEL, "--output-format", "json", "--json-schema", JSON.stringify(input.schema), "--tools", "", "--strict-mcp-config", "--no-session-persistence", "--setting-sources", "", "--system-prompt", input.system, "--max-budget-usd", "0.5", "--effort", CLAUDE_EFFORT, ...ARGS]);
 assert.ok(!result.text.includes('"shell"'));
});
if (fails) process.exitCode = 1;
