/**
 * @module packages/nana-pack/tests/review-launch.test.mjs
 * @purpose Pin review-ledger command-start failures and the injected Windows reviewer launch resolver.
 * @inputs review-launch.mjs, review-ledger.mjs, injected Windows files and environment, and temporary git repositories.
 * @outputs named PASS/FAIL/SKIP lines.
 * @effects disk (OS-temp fixtures), process (git and review-ledger child runs).
 * @errors failed assertions or fixture setup exit nonzero; a missing reviewLaunch export fails each resolver title.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ledgerBin = path.join(root, "bin", "review-ledger.mjs");
let reviewLaunch;
let loadError = "";
try { ({ reviewLaunch } = await import(pathToFileURL(path.join(root, "bin", "review-launch.mjs")).href)); } catch (error) { loadError = error.message; }
const { PI_BIN_NAME, PI_PACKAGE } = await import(pathToFileURL(path.join(root, "bin", "worker-config.mjs")).href);

let fails = 0;
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) fails++; };
const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "review-launch-")));
const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", ...args], { cwd, encoding: "utf8", timeout: 10000 });
const makeRepo = (name) => {
	const repo = path.join(temp, name);
	fs.mkdirSync(repo, { recursive: true });
	git(repo, "init", "-q");
	fs.writeFileSync(path.join(repo, "seed"), "seed\n");
	git(repo, "add", "seed");
	const committed = git(repo, "commit", "-qm", "seed");
	if (committed.status !== 0) throw new Error(committed.stderr);
	return repo;
};
const rows = (file) => { try { return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse); } catch { return []; } };

const startFailureResult = (() => {
	const repo = makeRepo("failure-repo");
	const cases = [
		{ item: "empty-command", word: "", out: path.join(temp, "empty-command.md") },
		{ item: "missing-command", word: "nana-absent-reviewer-xyz", out: path.join(temp, "missing-command.md"), args: ["-p", "x"] },
	];
	const runs = cases.map((entry) => {
		const home = path.join(temp, `${entry.item}-home`);
		fs.mkdirSync(home, { recursive: true });
		const env = { ...process.env, HOME: home, USERPROFILE: home, PATH: process.env.PATH ?? "" };
		const run = spawnSync(process.execPath, [ledgerBin, "run", "--item", entry.item, "--tree", repo, "--out", entry.out, "--", entry.word, ...(entry.args ?? [])], { cwd: temp, env, encoding: "utf8", timeout: 30000 });
		const carried = run.stderr.match(/^review-ledger: (cannot start \S+: \S[^\r\n]*)/m)?.[1];
		let outText = null;
		try { outText = fs.readFileSync(entry.out, "utf8"); } catch { /* reported below */ }
		let reservationNames = [];
		try { reservationNames = fs.readdirSync(path.join(home, ".pi", "agent", "review-ledger.reservations")); } catch { /* absent is empty */ }
		const rounds = rows(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl")).filter((row) => row.kind === "round");
		return { run, carried, outText, reservationNames, rounds };
	});
	const ok = runs.every(({ run, carried, outText, reservationNames, rounds }) => run.status === 1 && carried && outText?.startsWith(`${carried}\n`) && !/^\s+at /m.test(run.stderr) && reservationNames.length === 0 && rounds.length === 0);
	return { ok, detail: JSON.stringify({ runs }) };
})();
// req: R-2250
check("review-ledger run with an empty or a missing command exits 1 naming what it cannot start, with no stack trace, no reservation or round, and the reason in --out", startFailureResult.ok, startFailureResult.detail);

const files = new Map();
const winKey = (file) => path.win32.resolve("C:\\work", file).toLowerCase();
const put = (file, text = "") => files.set(winKey(file), text);
const entry = "C:\\npm\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js";
put("C:\\npm\\pi.cmd", "@echo off\r\n");
put("C:\\npm\\node_modules\\@earendil-works\\pi-coding-agent\\package.json", JSON.stringify({ name: PI_PACKAGE, bin: { [PI_BIN_NAME]: "dist/bundle/cli.js" } }));
put(entry, "#!/usr/bin/env node\n");
put("C:\\npm\\claude.cmd", "@echo off\r\n");
put("C:\\tools\\pip.exe", "MZ");
put("C:\\tools\\tool.py", "print(1)\n");
const winOpts = {
	platform: "win32",
	env: { PATH: "C:\\npm;C:\\tools", PATHEXT: ".COM;.EXE;.BAT;.CMD;.PY", cOmSpEc: "C:\\Windows\\System32\\cmd.exe" },
	cwd: "C:\\work",
	exists: (file) => files.has(winKey(file)),
	isFile: (file) => files.has(winKey(file)),
	readText: (file) => { const value = files.get(winKey(file)); if (value === undefined) throw new Error(`missing ${file}`); return value; },
	execPath: "C:\\Program Files\\nodejs\\node.exe",
};
const resolveLaunch = (child) => {
	if (typeof reviewLaunch !== "function") return { loadError: loadError || "reviewLaunch is not exported" };
	try { return reviewLaunch(child, winOpts); } catch (error) { return { threw: error.message }; }
};
const sameCommandArgs = (actual, command, args) => actual.command === command && JSON.stringify(actual.args) === JSON.stringify(args);
const piArgs = ["-p", "line one\nline two"];
const piResults = ["PI", "pi.cmd", "Pi.Exe", "pi.bat", "pi.COM"].map((word) => resolveLaunch([word, ...piArgs]));
const piOk = piResults.every((result) => sameCommandArgs(result, winOpts.execPath, [entry, ...piArgs]));
// req: R-2251
check("on win32 PI, pi.cmd, Pi.Exe, pi.bat and pi.COM take pi's own npm launch with the arguments unchanged", piOk, JSON.stringify(piResults));

const comspec = winOpts.env.cOmSpEc;
const cmdShape = (file, args) => ({ command: comspec, args: ["/d", "/v:off", "/s", "/c", `""${file}" ${args.map((arg) => `"${arg}"`).join(" ")}"`], options: { windowsVerbatimArguments: true } });
const claude = resolveLaunch(["claude", "-p", "hi"]);
const batPath = resolveLaunch(["C:\\s p\\stub.bat", "x"]);
const piPath = resolveLaunch(["C:\\npm\\pi.cmd", "x"]);
const pipArgs = ["-p", "line one\nline two"];
const pip = resolveLaunch(["pip", ...pipArgs]);
const codex = resolveLaunch(["C:\\tools\\codex", "-p", "x"]);
const matchesShape = (actual, expected) => sameCommandArgs(actual, expected.command, expected.args) && actual.options?.windowsVerbatimArguments === true;
const nonPiOk = matchesShape(claude, cmdShape("C:\\npm\\claude.cmd", ["-p", "hi"])) && matchesShape(batPath, cmdShape("C:\\s p\\stub.bat", ["x"])) && matchesShape(piPath, cmdShape("C:\\npm\\pi.cmd", ["x"])) && sameCommandArgs(pip, "C:\\tools\\pip.exe", pipArgs) && sameCommandArgs(codex, "C:\\tools\\codex", ["-p", "x"]);
// req: R-2252
check("on win32 a .cmd found on PATH and .bat or pi.cmd paths start through ComSpec, while pip.exe and an extensionless path start directly", nonPiOk, JSON.stringify({ claude, batPath, piPath, pip, codex }));

const absent = resolveLaunch(["nothere"]);
const py = resolveLaunch(["tool"]);
const lineFeed = resolveLaunch(["claude", "a\nb"]);
const percent = resolveLaunch(["claude", "100%"]);
const refusalOk = absent.refused === "not on PATH" && /\.py/i.test(py.refused ?? "") && /line feed/i.test(lineFeed.refused ?? "") && /%/.test(percent.refused ?? "");
// req: R-2253
check("on win32 a name not on PATH, a .py PATH finds and a .cmd argument with a line feed or % are refused, named", refusalOk, JSON.stringify({ absent, py, lineFeed, percent }));

const windowsTitle = "Windows: review-ledger run starts an npm-style .cmd reviewer found on PATH with its arguments and stdin unchanged and records a round";
// req-candidate: R-2254 (Windows only; becomes req: when the Windows CI leg passes it)
if (process.platform !== "win32") console.log(`SKIP ${windowsTitle} — Windows leg only`); else {
	const home = path.join(temp, "windows-home");
	const repo = makeRepo("windows-repo");
	const shimDir = path.join(temp, "shim dir");
	const moduleDir = path.join(shimDir, "node_modules", "stub-reviewer");
	const record = path.join(temp, "windows-record.jsonl");
	fs.mkdirSync(moduleDir, { recursive: true });
	const CMD_SHIM = "@ECHO off\r\nGOTO start\r\n:find_dp0\r\nSET dp0=%~dp0\r\nEXIT /b\r\n:start\r\nSETLOCAL\r\nCALL :find_dp0\r\n\r\nIF EXIST \"%dp0%\\node.exe\" (\r\n  SET \"_prog=%dp0%\\node.exe\"\r\n) ELSE (\r\n  SET \"_prog=node\"\r\n  SET PATHEXT=%PATHEXT:;.JS;=;%\r\n)\r\n\r\nendLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & \"%_prog%\"  \"%dp0%\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js\" %*\r\n";
	fs.writeFileSync(path.join(shimDir, "stub-reviewer.cmd"), CMD_SHIM.replace("@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js", "stub-reviewer\\cli.js"));
	fs.writeFileSync(path.join(moduleDir, "cli.js"), `const fs = require("node:fs");\nlet stdin = "";\nprocess.stdin.setEncoding("utf8");\nprocess.stdin.on("data", (chunk) => { stdin += chunk; });\nprocess.stdin.on("end", () => { fs.appendFileSync(${JSON.stringify(record)}, JSON.stringify({ argv: process.argv.slice(2), stdin }) + "\\n"); console.log("VERDICT: LAND"); });\n`);
	fs.mkdirSync(home, { recursive: true });
	const out = path.join(temp, "windows-out.md");
	const input = "line one\nline two\n";
	const env = { ...process.env, HOME: home, USERPROFILE: home, PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ""}` };
	const run = spawnSync(process.execPath, [ledgerBin, "run", "--item", "windows-shim", "--tree", repo, "--out", out, "--", "stub-reviewer", "-p", "review this & that (now)", "--model", "m-1"], { cwd: temp, env, input, encoding: "utf8", timeout: 60000 });
	const records = rows(record);
	const rounds = rows(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl")).filter((row) => row.kind === "round" && row.item === "windows-shim");
	check(windowsTitle, run.status === 0 && records.length === 1 && JSON.stringify(records[0].argv) === JSON.stringify(["-p", "review this & that (now)", "--model", "m-1"]) && records[0].stdin === input && rounds.length === 1, JSON.stringify({ run, records, rounds }));
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
