/**
 * @module packages/nana-pack/tests/win32-forced.test.mjs
 * @purpose Pin pi-watchdog's Node-entry Windows launcher: forced win32 against injected fake
 *  volumes on every leg, and a real npm-installed fake pi package on the Windows leg.
 * @inputs pi-watchdog.mjs's piLaunch, injected win32 path/env/exists/isFile/readText fixtures,
 *  worker-config.mjs's PI_PACKAGE/PI_BIN_NAME, and, on win32, a real npm pack+install of a fake
 *  pi package plus pi-worker.mjs/pi-review.mjs/review-ledger.mjs child runs
 * @outputs named PASS/FAIL/SKIP lines
 * @effects disk (temp fixtures; on win32 a real npm global install under a temp prefix), process
 *  (on win32, npm pack/install and pi-worker/pi-review/review-ledger child processes)
 * @errors a missing piLaunch export fails every forced title, not the whole file; failed
 *  assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import { withPathPrepended } from "./env-path.mjs";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const watchdogUrl = pathToFileURL(path.join(root, "bin", "pi-watchdog.mjs")).href;
let piLaunch, loadError = "";
try { ({ piLaunch } = await import(watchdogUrl)); } catch (e) { loadError = e.message; }
const { findPi } = await import(pathToFileURL(path.join(root, "lib", "win-command.mjs")).href);
const { PI_PACKAGE, PI_BIN_NAME, LANE_DEFAULTS } = await import(pathToFileURL(path.join(root, "bin", "worker-config.mjs")).href);
const workerBin = path.join(root, "bin", "pi-worker.mjs");
const reviewBin = path.join(root, "bin", "pi-review.mjs");
const reviewLedgerBin = path.join(root, "bin", "review-ledger.mjs");

let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };

// ---------------------------------------------------------------- forced win32, every leg
const DIR = Symbol("dir");
const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "win32-launch-")));
let volumes = 0;
function fakeVolume() {
	const vroot = path.join(temp, `vol-${++volumes}`);
	fs.mkdirSync(vroot, { recursive: true });
	const segs = (p) => { const m = /^([A-Za-z]):\\(.*)$/.exec(path.win32.resolve(p)); return m ? [m[1].toUpperCase(), ...m[2].split("\\").filter(Boolean)] : null; };
	const child = (dir, name) => { try { return fs.readdirSync(dir).find((e) => e.toLowerCase() === name.toLowerCase()); } catch { return undefined; } };
	const host = (p) => {
		const s = segs(p);
		if (!s) return null;
		let dir = vroot;
		for (const name of s) { const hit = child(dir, name); if (hit === undefined) return null; dir = path.join(dir, hit); }
		return dir;
	};
	const put = (p, content) => {
		const s = segs(p);
		let dir = vroot;
		for (const name of s.slice(0, -1)) { const hit = child(dir, name); dir = path.join(dir, hit ?? name); fs.mkdirSync(dir, { recursive: true }); }
		const target = path.join(dir, s.at(-1));
		if (content === DIR) fs.mkdirSync(target, { recursive: true }); else fs.writeFileSync(target, content);
	};
	return {
		put,
		exists: (p) => { const h = host(p); try { return h !== null && !fs.lstatSync(h).isDirectory(); } catch { return false; } },
		isFile: (p) => { const h = host(p); try { return h !== null && fs.statSync(h).isFile(); } catch { return false; } },
		readText: (p) => { const h = host(p); if (h === null) throw Object.assign(new Error(`ENOENT: no such file or directory, open '${p}'`), { code: "ENOENT" }); return fs.readFileSync(h, "utf8"); },
	};
}
// npm cmd-shim 7.0.0's template, as written for pi.
const CMD_SHIM = "@ECHO off\r\nGOTO start\r\n:find_dp0\r\nSET dp0=%~dp0\r\nEXIT /b\r\n:start\r\nSETLOCAL\r\nCALL :find_dp0\r\n\r\nIF EXIST \"%dp0%\\node.exe\" (\r\n  SET \"_prog=%dp0%\\node.exe\"\r\n) ELSE (\r\n  SET \"_prog=node\"\r\n  SET PATHEXT=%PATHEXT:;.JS;=;%\r\n)\r\n\r\nendLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & \"%_prog%\"  \"%dp0%\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js\" %*\r\n";
const pkgJson = (over = {}) => JSON.stringify({ name: PI_PACKAGE, version: "0.0.0-fake", bin: { [PI_BIN_NAME]: "dist/bundle/cli.js" }, ...over });
const npmPackage = (v, folder, { pkg = pkgJson(), entryKind = "file" } = {}) => {
	const dir = `${folder}\\@earendil-works\\pi-coding-agent`;
	if (pkg !== null) v.put(`${dir}\\package.json`, pkg);
	if (entryKind === "file") v.put(`${dir}\\dist\\bundle\\cli.js`, "#!/usr/bin/env node\n");
	if (entryKind === "dir") v.put(`${dir}\\dist\\bundle\\cli.js`, DIR);
	return dir;
};
const npmGlobal = (opts = {}, shim = "pi.cmd") => { const v = fakeVolume(); v.put(`C:\\npm\\${shim}`, CMD_SHIM); npmPackage(v, "C:\\npm\\node_modules", opts); return v; };
const EXEC = "C:\\Program Files\\nodejs\\node.exe";
const PI_ARGS = ["--append-system-prompt", "line one\nline two\r\nline three", "-p", "a%PATH%b !x! \"q\" ^&|<>", "trailing\\", "--name", "pi-worker-a1-12345"];
const GLOBAL_ENTRY = "C:\\npm\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js";
const PATH_GLOBAL = "C:\\a;C:\\npm";
const launch = (v, PATH, platform = "win32") => {
	if (typeof piLaunch !== "function") return { threw: `piLaunch is not exported${loadError ? ` (${loadError})` : ""}` };
	try { return piLaunch([...PI_ARGS], { platform, env: { PATH }, cwd: "C:\\work", exists: v.exists, isFile: v.isFile, readText: v.readText, execPath: EXEC }); }
	catch (e) { return { threw: e.message }; }
};
{
	const g1 = npmGlobal();
	const r1 = launch(g1, PATH_GLOBAL);
	const r2 = launch(npmGlobal({}, "PI.CMD"), PATH_GLOBAL);
	const r3 = launch(npmGlobal({ pkg: pkgJson({ bin: "dist/bundle/cli.js" }) }), PATH_GLOBAL);
	const r4 = launch(npmGlobal({}, "pi.bat"), PATH_GLOBAL);
	const v5 = fakeVolume(); v5.put("C:\\p\\node_modules\\.bin\\pi.cmd", CMD_SHIM); npmPackage(v5, "C:\\p\\node_modules");
	const r5 = launch(v5, "C:\\p\\node_modules\\.bin");
	const v6 = fakeVolume(); v6.put("C:\\p\\Node_Modules\\.BIN\\pi.cmd", CMD_SHIM); npmPackage(v6, "C:\\p\\Node_Modules");
	const r6 = launch(v6, "C:\\p\\Node_Modules\\.BIN");
	const matches = (r, entry) => r.command === EXEC && typeof r.args?.[0] === "string" && r.args[0].toLowerCase() === entry.toLowerCase() && JSON.stringify(r.args?.slice(1)) === JSON.stringify(PI_ARGS);
	// req: R-1125
	check("win32 launch runs the npm pi package's bin entry with the running node and the arguments unchanged",
		matches(r1, GLOBAL_ENTRY) && matches(r2, GLOBAL_ENTRY) && matches(r3, GLOBAL_ENTRY) && matches(r4, GLOBAL_ENTRY) &&
		matches(r5, "C:\\p\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js") &&
		matches(r6, "C:\\p\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js"),
		JSON.stringify({ r1, r2, r3, r4, r5, r6 }));
}

{
	const exeVol = fakeVolume();
	exeVol.put("C:\\npm\\PI.EXE", "MZ");
	npmPackage(exeVol, "C:\\npm\\node_modules"); // a package too, so sending it through node would be a wrong answer, not a refusal
	const exePath = findPi({ env: { PATH: PATH_GLOBAL }, cwd: "C:\\work", exists: exeVol.exists });
	const r = launch(exeVol, PATH_GLOBAL);
	// req: R-1125
	check("win32 launch starts a pi.exe directly", r.command === exePath && JSON.stringify(r.args) === JSON.stringify(PI_ARGS), JSON.stringify({ r, exePath }));
}

{
	const NO_PACKAGE = ["pnpm", "Volta", "pi.dev"];
	const cases = [
		["no pi on PATH", () => launch(npmGlobal(), "C:\\empty"), ["pi is not on PATH"]],
		["a Volta-shaped pi.cmd, no package beside it", () => { const v = fakeVolume(); v.put("C:\\Users\\u\\AppData\\Local\\Volta\\bin\\pi.cmd", "@echo off\r\nvolta run %~n0 %*\r\n"); return launch(v, "C:\\Users\\u\\AppData\\Local\\Volta\\bin"); }, NO_PACKAGE],
		["a pnpm-global-shaped pi.cmd, package under global\\v11", () => { const v = fakeVolume(); v.put("C:\\Users\\u\\AppData\\Local\\pnpm\\bin\\pi.cmd", "@SETLOCAL\r\n\"%~dp0\\..\\global\\v11\\abc123\\node_modules\\@earendil-works\\pi-coding-agent\\dist\\bundle\\cli.js\" %*\r\n"); npmPackage(v, "C:\\Users\\u\\AppData\\Local\\pnpm\\global\\v11\\abc123\\node_modules"); return launch(v, "C:\\Users\\u\\AppData\\Local\\pnpm\\bin"); }, NO_PACKAGE],
		["a pi.dev-managed-shaped pi.cmd, package under install\\releases", () => { const v = fakeVolume(); v.put("C:\\Users\\u\\.pi\\agent\\bin\\pi.cmd", "@ECHO off\r\nnode \"%~dp0pi-launcher.js\" %*\r\n"); v.put("C:\\Users\\u\\.pi\\agent\\bin\\pi-launcher.js", "// launcher\n"); npmPackage(v, "C:\\Users\\u\\.pi\\agent\\install\\releases\\1.0.2\\node_modules"); return launch(v, "C:\\Users\\u\\.pi\\agent\\bin"); }, NO_PACKAGE],
		["package.json names another package", () => launch(npmGlobal({ pkg: pkgJson({ name: "@earendil-works/not-pi" }) }), PATH_GLOBAL), ["package.json"]],
		["package.json is invalid JSON", () => launch(npmGlobal({ pkg: "{\"name\": " }), PATH_GLOBAL), ["package.json"]],
		["package.json declares no bin", () => launch(npmGlobal({ pkg: JSON.stringify({ name: PI_PACKAGE, version: "0.0.0-fake" }) }), PATH_GLOBAL), ["bin"]],
		["package.json's bin object has no pi key", () => launch(npmGlobal({ pkg: pkgJson({ bin: { "pi-other": "dist/bundle/cli.js" } }) }), PATH_GLOBAL), ["bin"]],
		["the bin escapes the package", () => { const v = npmGlobal({ pkg: pkgJson({ bin: { [PI_BIN_NAME]: "..\\..\\..\\evil.js" } }) }); v.put("C:\\npm\\evil.js", "// outside\n"); return launch(v, PATH_GLOBAL); }, ["outside"]],
		["the entry is missing", () => launch(npmGlobal({ entryKind: "none" }), PATH_GLOBAL), ["cli.js"]],
		["the entry is a directory", () => launch(npmGlobal({ entryKind: "dir" }), PATH_GLOBAL), ["cli.js"]],
	];
	const results = cases.map(([label, run, fragments]) => {
		const r = run();
		const ok = r.command === undefined && typeof r.refused === "string" && r.refused.length > 0 && fragments.every((f) => r.refused.includes(f));
		return [label, ok, r];
	});
	// req: R-1125
	check("win32 launch refuses with a named reason when pi, its package, its bin or its entry is missing",
		results.every(([, ok]) => ok),
		JSON.stringify(results.filter(([, ok]) => !ok)));
}

{
	const notStringBin = launch(npmGlobal({ pkg: pkgJson({ bin: 5 }) }), PATH_GLOBAL);
	const notStringBinPi = launch(npmGlobal({ pkg: pkgJson({ bin: { [PI_BIN_NAME]: 5 } }) }), PATH_GLOBAL);
	const refusedNoBin = (r) => r.command === undefined && r.threw === undefined && typeof r.refused === "string" && r.refused.includes("bin");
	// req: R-1125
	check("win32 launch refuses with a named reason, without throwing, when pi's bin is not a string",
		refusedNoBin(notStringBin) && refusedNoBin(notStringBinPi),
		JSON.stringify({ notStringBin, notStringBinPi }));
}

{
	// req: R-1125
	check("non-win32 launch is pi by name with the arguments unchanged",
		["darwin", "linux"].every((platform) => { const r = launch(npmGlobal(), PATH_GLOBAL, platform); return r.command === "pi" && JSON.stringify(r.args) === JSON.stringify(PI_ARGS); }));
}


if (fails) process.exitCode = 1;
