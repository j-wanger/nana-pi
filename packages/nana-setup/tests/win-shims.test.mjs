/**
 * @module packages/nana-setup/tests/win-shims.test.mjs
 * @purpose Prove the Windows PATH shim renderings preserve supported arguments, exit status, runtime lookup and self-rewrite safety.
 * @inputs lib/win-shims.mjs, the host POSIX shell or Windows Git Bash, cmd.exe and Windows PowerShell, and temporary hostile-path fixtures.
 * @outputs PASS, FAIL or named SKIP lines for the six shim and PATH-resolution requirements.
 * @effects disk (temporary callers, briefs, bins and shims), process (spawns shells and node through rendered shims).
 * @errors each case is awaited under a timeout; a failed assertion prints FAIL and makes the process exit nonzero.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { findGitBash } from "../lib/install-check.mjs";
import { renderWinShims, WIN_CMD_SHIM_LAYOUT, WIN_SHIM_LINE_ENDINGS, WIN_SHIM_SUFFIXES } from "../lib/win-shims.mjs";
import { tmpDir } from "./tmp-dir.mjs";

// Chosen 2026-10-19: one shell case must finish well below hosted CI's job timeout.
const CASE_TIMEOUT_MS = 30_000;
const cases = [];
const test = (title, row, platforms, fn) => cases.push({ title, row, platforms, fn });
const shq = (value) => `'${String(value).replaceAll("'", `'\\''`)}'`;
const psq = (value) => `'${String(value).replaceAll("'", "''")}'`;
const cmdq = (value) => `"${String(value).replaceAll("%", "%%")}"`;
const real = (value) => fs.realpathSync.native(value);

const root = tmpDir(path.join(os.tmpdir(), "nana shim space & % ( ) ' $a é-"));
const shims = path.join(root, "shims");
const binDir = path.join(root, "bin 100%&(x)");
const callerDir = path.join(root, "callers with a space");
const briefDir = path.join(root, "brief folder");
for (const directory of [shims, binDir, callerDir, briefDir]) fs.mkdirSync(directory, { recursive: true });
const brief = path.join(briefDir, "two line brief.md");
fs.writeFileSync(brief, "first line  \r\nsecond line\t");
const bin = path.join(binDir, "probe.mjs");
fs.writeFileSync(bin, `#!/usr/bin/env node\nimport fs from "node:fs";\nif (process.argv[2] === "--rewrite") {\n  const target = process.env.NANA_REWRITE_SHIM;\n  const line = target.toLowerCase().endsWith(".cmd") ? "@echo NANA_REWRITE_MARKER\\r\\n" : "echo NANA_REWRITE_MARKER\\n";\n  fs.writeFileSync(target, line.repeat(200));\n}\nprocess.stdout.write(JSON.stringify({ argv: process.argv.slice(2), execPath: fs.realpathSync(process.execPath) }) + "\\n");\nprocess.exit(7);\n`);
const rendered = renderWinShims(bin, shims);
fs.writeFileSync(path.join(shims, "pi-review"), rendered.sh);
fs.chmodSync(path.join(shims, "pi-review"), 0o755);
fs.writeFileSync(path.join(shims, "pi-review.cmd"), rendered.cmd);

const nodeDir = path.dirname(process.execPath);
const windowsPath = `${shims};${nodeDir};${process.env.Path ?? process.env.PATH ?? ""}`;
const posixPath = `${shims}:${nodeDir}:${process.env.PATH ?? ""}`;
const shellEnv = (shim) => ({
	...process.env,
	PATH: process.platform === "win32" ? windowsPath : posixPath,
	Path: process.platform === "win32" ? windowsPath : process.env.Path,
	PATHEXT: ".COM;.EXE;.BAT;.CMD",
	NANA_REWRITE_SHIM: shim,
});
const shRunner = () => {
	if (process.platform !== "win32") return "/bin/sh";
	const key = Object.keys(process.env).find((name) => name.toLowerCase() === "path");
	return findGitBash(String(key ? process.env[key] : "").split(";"));
};
const runShCaller = (args, rewrite = false) => {
	const caller = path.join(callerDir, rewrite ? "rewrite caller.sh" : "argument caller.sh");
	fs.writeFileSync(caller, `#!/bin/sh\npi-review ${args.map(shq).join(" ")}\n`);
	const runner = shRunner();
	if (!runner) return null;
	return spawnSync(runner, [], { cwd: callerDir, input: fs.readFileSync(caller), encoding: "utf8", env: shellEnv(path.join(shims, "pi-review")), timeout: CASE_TIMEOUT_MS });
};
const runCmdCaller = (args) => {
	const caller = path.join(callerDir, "argument caller.cmd");
	fs.writeFileSync(caller, `@echo off\r\npi-review ${args.map(cmdq).join(" ")}\r\nexit /b %ERRORLEVEL%\r\n`);
	return spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/v:off", "/s", "/c", `""${caller}""`], { cwd: callerDir, encoding: "utf8", env: shellEnv(path.join(shims, "pi-review.cmd")), windowsVerbatimArguments: true, timeout: CASE_TIMEOUT_MS });
};
const runPowerShellCaller = (args) => {
	const caller = path.join(callerDir, "argument caller.ps1");
	fs.writeFileSync(caller, `& pi-review ${args.map(psq).join(" ")}\nexit $LASTEXITCODE\n`);
	return spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", caller], { cwd: callerDir, encoding: "utf8", env: shellEnv(path.join(shims, "pi-review.cmd")), timeout: CASE_TIMEOUT_MS });
};
const jsonResult = (run) => JSON.parse(run.stdout.trim().split(/\r?\n/).at(-1));

// req: R-1611
test("sh shim hands node every argument unchanged and returns the bin's exit status", "R-1611", "all", () => {
	assert.deepEqual(WIN_SHIM_SUFFIXES, { sh: "", cmd: ".cmd" });
	assert.deepEqual(WIN_SHIM_LINE_ENDINGS, { sh: "\n", cmd: "\r\n" });
	assert.ok(!rendered.sh.includes("\r"));
	const briefArg = `@${process.platform === "win32" ? brief.replaceAll("/", "\\") : brief}`;
	const args = ["a space", "single'quote", 'double"quote', "% & ^ ! ( ) | < >", "trailing\\", "line one\nline two", "", briefArg];
	if (process.platform === "win32") assert.ok(args.every((arg) => !arg.includes("/")));
	const run = runShCaller(args);
	assert.ok(run, "Git Bash not found");
	assert.equal(run.status, 7, run.stderr);
	assert.deepEqual(jsonResult(run).argv, args);
});

// req: R-1617
test("an sh shim rewritten by its own bin runs none of the new text", "R-1617", "all", () => {
	const run = runShCaller(["--rewrite"], true);
	assert.ok(run, "Git Bash not found");
	assert.equal(run.status, 7, run.stderr);
	assert.doesNotMatch(run.stdout, /NANA_REWRITE_MARKER/);
});

// req: R-1612
test("Windows: cmd.exe hands a .cmd shim's bin every double-quoted argument unchanged on the PATH node and returns its exit status", "R-1612", "win32", () => {
	assert.equal(WIN_CMD_SHIM_LAYOUT, "npm cmd-shim 7.0.0");
	assert.ok(rendered.cmd.split("\r\n").length > 10 && !/(^|[^\r])\n/.test(rendered.cmd));
	fs.writeFileSync(path.join(callerDir, "node.js"), "WScript.Quit(42)\r\n");
	const args = ["a space", "single'quote", "100%", "% & ^ ! ( ) | < >", "", `@${brief}`];
	assert.ok(args.every((arg) => !arg.includes('"') && !arg.endsWith("\\")));
	const run = runCmdCaller(args);
	assert.equal(run.status, 7, run.stderr);
	const result = jsonResult(run);
	assert.deepEqual(result.argv, args);
	assert.equal(real(result.execPath).toLowerCase(), real(path.join(nodeDir, "node.exe")).toLowerCase());
});

// req: R-1613
test("Windows: PowerShell hands a .cmd shim's bin every spaced argument unchanged and returns its exit status", "R-1613", "win32", () => {
	const args = ["a space", "percent 100%", "amp & value", "pipe | value", "less < value", "greater > value", "caret ^ value", "left ( value", "right ) value"];
	assert.ok(args.every((arg) => !arg.includes('"') && arg !== "" && !arg.endsWith("\\")));
	const run = runPowerShellCaller(args);
	assert.equal(run.status, 7, run.stderr);
	assert.deepEqual(jsonResult(run).argv, args);
});

// req: R-1614
test("Windows: a .cmd shim rewritten by its own bin runs none of the new text", "R-1614", "win32", () => {
	const run = runCmdCaller(["--rewrite"]);
	assert.equal(run.status, 7, run.stderr);
	assert.doesNotMatch(run.stdout, /NANA_REWRITE_MARKER/);
});

// req: R-1616
test("Windows: doctor reads PATH resolves pi-review ✓ only when the bin directory's .cmd shim is found first", "R-1616", "win32", () => {
	const packageRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
	const cli = path.join(packageRoot, "bin", "nana-setup.mjs");
	const home = path.join(root, "real home");
	fs.mkdirSync(path.join(home, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(home, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	fs.writeFileSync(path.join(home, ".pi", "agent", "settings.json"), JSON.stringify({ packages: [path.join(packageRoot, "..", "nana-pack"), path.join(packageRoot, "..", "nana-knowledge")] }));
	const vendor = path.join(home, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(vendor, { recursive: true });
	fs.writeFileSync(path.join(vendor, "package.json"), JSON.stringify({ version: "0.75.0" }));
	const env = { ...process.env, HOME: home, USERPROFILE: home, Path: `${path.join(home, ".local", "bin")};${nodeDir};${process.env.Path ?? process.env.PATH ?? ""}`, PATH: `${path.join(home, ".local", "bin")};${nodeDir};${process.env.Path ?? process.env.PATH ?? ""}`, PATHEXT: ".COM;.EXE;.BAT;.CMD" };
	const invoke = (args, extra = {}) => spawnSync(process.execPath, [cli, ...args], { cwd: packageRoot, encoding: "utf8", env: { ...env, ...extra }, timeout: CASE_TIMEOUT_MS });
	assert.equal(invoke(["install"]).status, 0);
	const good = invoke(["doctor"]);
	assert.match(good.stdout, /✓ PATH resolves pi-review/);
	const absentPath = `${nodeDir};${process.env.Path ?? process.env.PATH ?? ""}`;
	const absent = invoke(["doctor"], { Path: absentPath, PATH: absentPath });
	assert.equal(absent.status, 1);
	assert.match(absent.stdout, /✗ PATH resolves pi-review/);
	const shadow = path.join(root, "earlier shadow");
	fs.mkdirSync(shadow, { recursive: true });
	fs.writeFileSync(path.join(shadow, "pi-review.cmd"), "@exit /b 0\r\n");
	const shadowPath = `${shadow};${env.Path}`;
	const earlier = invoke(["doctor"], { Path: shadowPath, PATH: shadowPath });
	assert.equal(earlier.status, 1);
	assert.match(earlier.stdout, new RegExp(shadow.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
});

let failures = 0;
for (const current of cases) {
	if (current.platforms === "win32" && process.platform !== "win32") {
		console.log("SKIP", `${current.row} Windows leg only`);
		continue;
	}
	let timer;
	try {
		await Promise.race([
			Promise.resolve().then(current.fn),
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`case timed out after ${CASE_TIMEOUT_MS} ms`)), CASE_TIMEOUT_MS); }),
		]);
		console.log("PASS", current.title);
	} catch (error) {
		failures++;
		console.log("FAIL", current.title, error?.message ?? String(error));
	} finally {
		clearTimeout(timer);
	}
}
fs.rmSync(root, { recursive: true, force: true });
if (failures) process.exitCode = 1;
