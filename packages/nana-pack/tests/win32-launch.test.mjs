/**
 * @module packages/nana-pack/tests/win32-launch.test.mjs
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

// ---------------------------------------------------------------- Windows leg only
const WINDOWS_TITLES = [
	"Windows: lane pi-worker prints the builder line and starts the npm-installed pi entry with node and the lane argv",
	"Windows: non-lane pi-worker hands pi line breaks, %, !, quotes and a trailing backslash unchanged",
	"Windows: pi-review hands the review standard to pi as text",
	"Windows: a busy pi is not stopped as stalled",
	"Windows: a pi.cmd with no npm package beside it starts nothing and leaves no capture directory",
	"Windows: review-ledger run -- pi starts the npm-installed pi entry with node and the arguments unchanged",
	"Windows: review-ledger run -- pi with a pi.cmd that has no npm package starts nothing and consumes no round",
	"Windows: lane pi-worker starts pi from a short or differently cased worktree path",
];

if (process.platform !== "win32") {
	for (const title of WINDOWS_TITLES) console.log(`SKIP ${title} — Windows leg only`);
} else {
	const prefix = path.join(os.tmpdir(), "nana pi prefix &()");
	fs.mkdirSync(prefix, { recursive: true });
	const pkgDir = path.join(temp, "fake-pi-pkg");
	fs.mkdirSync(path.join(pkgDir, "dist", "bundle"), { recursive: true });
	const record = path.join(temp, "record.jsonl");
	fs.writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify({ name: PI_PACKAGE, version: "0.0.0-fake", bin: { [PI_BIN_NAME]: "dist/bundle/cli.js" } }));
	fs.writeFileSync(path.join(pkgDir, "dist", "bundle", "cli.js"), `#!/usr/bin/env node
const fs = require("node:fs");
const argv = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(record)}, JSON.stringify({ execPath: process.execPath, entry: process.argv[1], argv, ppid: process.ppid, cwd: process.cwd() }) + "\\n");
const spinIdx = argv.indexOf("--spin-secs");
if (spinIdx >= 0) { const until = Date.now() + Number(argv[spinIdx + 1]) * 1000; while (Date.now() < until) {} }
console.log("VERDICT: LAND");
`);
	// Invoke npm's JS CLI directly (process.execPath + npm_execpath) so a prefix or pack
	// destination holding a space stays one argv entry on Windows (pi-registration.test.mjs:319-325).
	const npmCli = process.env.npm_execpath;
	const tgz = npmCli
		? spawnSync(process.execPath, [npmCli, "pack", "--pack-destination", temp], { cwd: pkgDir, encoding: "utf8" })
		: { status: 1, stderr: "npm_execpath is not set" };
	const tgzPath = tgz.status === 0 ? path.join(temp, tgz.stdout.trim().split(/\r?\n/).pop()) : null;
	const installed = tgzPath && npmCli
		? spawnSync(process.execPath, [npmCli, "install", "--global", "--prefix", prefix, "--offline", "--ignore-scripts", tgzPath], { encoding: "utf8" })
		: { status: 1, stderr: tgz.stderr || "npm pack failed or npm_execpath is not set" };
	const shim = path.join(prefix, "pi.cmd");
	const env = { ...withPathPrepended(process.env, prefix), HOME: temp, USERPROFILE: temp, TEMP: temp, TMP: temp, PI_CODING_AGENT_DIR: path.join(temp, "empty-agent-dir") };
	const found = installed.status === 0 ? findPi({ env, cwd: prefix }) : null;
	const ready = installed.status === 0 && found === shim;
	if (!ready) {
		console.log(`FAIL Windows fixture: npm install or findPi precondition did not hold (${installed.stderr || found})`);
		fails++;
		for (const title of WINDOWS_TITLES) console.log(`SKIP ${title} — fixture precondition failed`);
	} else {
		const readRecord = () => { try { return fs.readFileSync(record, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
		const entryPath = path.join(pkgDir, "dist", "bundle", "cli.js");
		// Confirm the installed package's entry really is this fixture's (npm copies the file).
		const installedEntry = path.join(prefix, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "bundle", "cli.js");

		// -- lane pi-worker --
		fs.rmSync(record, { force: true });
		const laneRepo = path.join(temp, "lane-repo"), laneWt = path.join(temp, "lane-wt");
		fs.mkdirSync(laneRepo, { recursive: true });
		const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.invalid", ...args], { cwd, encoding: "utf8" });
		git(laneRepo, "init", "-q");
		fs.writeFileSync(path.join(laneRepo, "seed"), "seed\n");
		git(laneRepo, "add", "seed"); git(laneRepo, "commit", "-qm", "seed");
		git(laneRepo, "worktree", "add", "-qb", "feat/winlane", laneWt);
		const brief = path.join(temp, "brief.md");
		fs.writeFileSync(brief, "brief content\n\nPrecedent:\n- seed\n");
		const laneOut = path.join(temp, "lane-out.md");
		const laneRun = spawnSync(process.execPath, [workerBin, "--poll", "0.1", "--stall-secs", "15", "--out", laneOut, "--lane", "winlane", "--brief", brief], { cwd: laneWt, encoding: "utf8", timeout: 60000, env });
		const laneCalls = readRecord();
		const expectedArgv = ["--provider", LANE_DEFAULTS.provider, "--model", LANE_DEFAULTS.model, "--thinking", LANE_DEFAULTS.thinking, "-t", LANE_DEFAULTS.tools];
		const builderLine = laneRun.stderr.split(/\r?\n/).find((l) => l.startsWith("pi-worker: builder:"));
		// req: R-1125 R-1124 R-3453
		check("Windows: lane pi-worker prints the builder line and starts the npm-installed pi entry with node and the lane argv",
			laneRun.status === 0 && Boolean(builderLine) && laneCalls.length === 1 &&
			laneCalls[0].execPath.toLowerCase() === process.execPath.toLowerCase() &&
			laneCalls[0].entry.toLowerCase() === installedEntry.toLowerCase() &&
			laneCalls[0].ppid === laneRun.pid &&
			expectedArgv.every((v, i) => laneCalls[0].argv[i] === v) &&
			laneCalls[0].argv.includes("--name"),
			JSON.stringify({ laneRun, laneCalls }));

		// -- non-lane pi-worker, raw argv unchanged --
		fs.rmSync(record, { force: true });
		const rawArgs = ["--append-system-prompt", "line one\nline two\r\nline three", "-p", 'a%PATH%b !x! "q" ^&|<>', "trailing\\"];
		const nonLaneOut = path.join(temp, "non-lane-out.md");
		const nonLaneRun = spawnSync(process.execPath, [workerBin, "--poll", "0.1", "--stall-secs", "15", "--out", nonLaneOut, "--", ...rawArgs], { cwd: temp, encoding: "utf8", timeout: 60000, env });
		const nonLaneCalls = readRecord();
		// req: R-1125
		check("Windows: non-lane pi-worker hands pi line breaks, %, !, quotes and a trailing backslash unchanged",
			nonLaneRun.status === 0 && nonLaneCalls.length === 1 && rawArgs.every((v, i) => nonLaneCalls[0].argv[i] === v),
			JSON.stringify({ nonLaneRun, nonLaneCalls }));

		// -- pi-review --
		fs.rmSync(record, { force: true });
		const reviewTree = path.join(temp, "review-tree");
		fs.mkdirSync(reviewTree, { recursive: true });
		git(reviewTree, "init", "-q");
		fs.writeFileSync(path.join(reviewTree, "f"), "f\n");
		git(reviewTree, "add", "f");
		git(reviewTree, "update-index", "--chmod=+x", "f"); // R-1370: a committed 100755 file, mode from the index, never chmod
		git(reviewTree, "commit", "-qm", "f");
		const reviewBriefPath = path.join(temp, "review-brief.md");
		fs.writeFileSync(reviewBriefPath, "line one\nline two\n");
		const reviewOut = path.join(temp, "review-out.md");
		const reviewRun = spawnSync(process.execPath, [reviewBin, "--item", "winlaunch", "--tree", reviewTree, "--poll", "0.1", "--stall-secs", "15", "--out", reviewOut, "--", "--provider", "p", "--model", "m", "-p", reviewBriefPath], { cwd: temp, encoding: "utf8", timeout: 60000, env });
		const reviewCalls = readRecord();
		const reviewStandard = fs.readFileSync(path.join(root, "prompts", "review-standard.md"), "utf8");
		// req: R-1125
		check("Windows: pi-review hands the review standard to pi as text",
			reviewRun.status === 0 && reviewCalls.length >= 1 && reviewCalls[0].argv.includes(reviewStandard),
			JSON.stringify({ reviewRun, reviewCalls: reviewCalls.map((c) => ({ ...c, argv: "elided" })) }));
		// R-1370: `f` is committed 100755 (update-index --chmod=+x above), but NTFS stores no execute
		// bit, so the Windows checkout's disk mode never matches it. A `+snap` revision here would mean
		// this ordinary lost-exec-bit checkout does not match a plain-SHA LAND on Windows — the lane's
		// own "claim most likely wrong", and a named carry if it ever shows. The test runner prints a
		// failing check's detail even in non-verbose mode, so a `+snap` surfaces the revision to the
		// seat reading the CI log; a clean round passes silently (an extra check, not a seat-titles title).
		let revisionDetail = "(ledger unreadable)";
		let revisionIsSnap = true;
		try {
			// review-round.mjs's ledgerPaths() keys the tally to <home>/.pi/agent, deliberately not
			// to PI_CODING_AGENT_DIR (env.HOME here is `temp`).
			const tallyPath = path.join(temp, ".pi", "agent", "review-ledger.rounds.jsonl");
			const rounds = fs.readFileSync(tallyPath, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
			const last = rounds.filter((r) => r.kind === "round" && r.item === "winlaunch").at(-1);
			revisionDetail = last?.revision ?? "(no round recorded)";
			revisionIsSnap = String(revisionDetail).includes("+snap");
		} catch (e) {
			revisionDetail = `(ledger unreadable: ${e.message})`;
		}
		check("Windows: pi-review's recorded revision is a plain sha, not a +snap", !revisionIsSnap, `INFO Windows pi-review revision: ${revisionDetail}`);

		// -- a busy pi is not stalled --
		fs.rmSync(record, { force: true });
		const busyOut = path.join(temp, "busy-out.md");
		const busyRun = spawnSync(process.execPath, [workerBin, "--poll", "1", "--stall-secs", "3", "--out", busyOut, "--", "-p", "busy", "--spin-secs", "12"], { cwd: temp, encoding: "utf8", timeout: 60000, env });
		// req: R-1125
		check("Windows: a busy pi is not stopped as stalled", busyRun.status === 0 && !/STALL/.test(busyRun.stderr), busyRun.stderr);

		// -- a pi.cmd with no package beside it --
		fs.rmSync(record, { force: true });
		const voltaDir = path.join(temp, "volta-shim");
		fs.mkdirSync(voltaDir, { recursive: true });
		fs.writeFileSync(path.join(voltaDir, "pi.cmd"), "@echo off\r\nvolta run %~n0 %*\r\n");
		const voltaEnv = { ...env, PATH: `${voltaDir}${path.delimiter}${env.PATH}` };
		const noPkgOut = path.join(temp, "no-pkg-out.md");
		// The child's own TEMP/TMP point at `temp` (set above), so its mkdtemp capture dir would
		// land there too, not under this test process's own os.tmpdir().
		const beforeDirs = fs.readdirSync(temp);
		const noPkgRun = spawnSync(process.execPath, [workerBin, "--poll", "0.1", "--stall-secs", "15", "--out", noPkgOut, "--", "-p", "x"], { cwd: temp, encoding: "utf8", timeout: 60000, env: voltaEnv });
		const afterDirs = fs.readdirSync(temp);
		const newCaptureDirs = afterDirs.filter((d) => !beforeDirs.includes(d) && /^pi-review-/.test(d));
		// req: R-1125
		check("Windows: a pi.cmd with no npm package beside it starts nothing and leaves no capture directory",
			noPkgRun.status === 1 && /pi launch refused/.test(noPkgRun.stderr) && readRecord().length === 0 && newCaptureDirs.length === 0,
			JSON.stringify({ noPkgRun, newCaptureDirs }));
		const noPkgOutText = fs.existsSync(noPkgOut) ? fs.readFileSync(noPkgOut, "utf8") : null;
		// req: R-1125
		check("Windows: a refused launch writes its reason to --out",
			noPkgOutText !== null && noPkgOutText.startsWith("pi launch refused:") && noPkgRun.stderr.includes(noPkgOutText.trim()),
			JSON.stringify({ noPkgOutText, noPkgRun }));

		// -- review-ledger run starts pi through its npm package --
		fs.rmSync(record, { force: true });
		const ledgerOut = path.join(temp, "ledger-out.md");
		const ledgerRun = spawnSync(process.execPath, [reviewLedgerBin, "run", "--item", "winledger", "--tree", reviewTree, "--out", ledgerOut, "--", "pi", ...rawArgs], { cwd: temp, encoding: "utf8", timeout: 60000, env });
		const ledgerCalls = readRecord();
		// req: R-1722
		check("Windows: review-ledger run -- pi starts the npm-installed pi entry with node and the arguments unchanged",
			ledgerRun.status === 0 && ledgerCalls.length === 1 &&
			ledgerCalls[0].execPath.toLowerCase() === process.execPath.toLowerCase() &&
			ledgerCalls[0].entry.toLowerCase() === installedEntry.toLowerCase() &&
			ledgerCalls[0].ppid === ledgerRun.pid &&
			JSON.stringify(ledgerCalls[0].argv) === JSON.stringify(rawArgs),
			JSON.stringify({ ledgerRun, ledgerCalls }));

		const reservations = path.join(temp, ".pi", "agent", "review-ledger.reservations");
		const reservationNames = () => { try { return fs.readdirSync(reservations).sort(); } catch { return []; } };
		const reservationsBefore = reservationNames();
		fs.rmSync(record, { force: true });
		const refusedLedgerOut = path.join(temp, "ledger-refused-out.md");
		const refusedLedgerRun = spawnSync(process.execPath, [reviewLedgerBin, "run", "--item", "winledger-refused", "--tree", reviewTree, "--out", refusedLedgerOut, "--", "pi", "-p", "x"], { cwd: temp, encoding: "utf8", timeout: 60000, env: voltaEnv });
		let refusedRounds = [];
		try { refusedRounds = fs.readFileSync(path.join(temp, ".pi", "agent", "review-ledger.rounds.jsonl"), "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)).filter((row) => row.kind === "round" && row.item === "winledger-refused"); } catch { /* no ledger is also no round */ }
		const refusedLedgerOutText = fs.existsSync(refusedLedgerOut) ? fs.readFileSync(refusedLedgerOut, "utf8") : "";
		// req: R-1723 R-2250
		check("Windows: review-ledger run -- pi with a pi.cmd that has no npm package starts nothing and consumes no round",
			refusedLedgerRun.status === 1 && /pi launch refused: pi at .* is not an npm global install/.test(refusedLedgerRun.stderr) &&
			refusedLedgerOutText.startsWith("cannot start pi: pi launch refused:") &&
			readRecord().length === 0 && refusedRounds.length === 0 &&
			JSON.stringify(reservationNames()) === JSON.stringify(reservationsBefore),
			JSON.stringify({ refusedLedgerRun, calls: readRecord(), refusedRounds, reservationsBefore, reservationsAfter: reservationNames() }));

		// -- a short or differently cased worktree path --
		fs.rmSync(record, { force: true });
		const longRepo = path.join(temp, "A-Long-Named-Folder-Repo");
		const longWt = path.join(temp, "A-Long-Named-Folder-Wt");
		fs.mkdirSync(longRepo, { recursive: true });
		git(longRepo, "init", "-q");
		fs.writeFileSync(path.join(longRepo, "seed"), "seed\n");
		git(longRepo, "add", "seed"); git(longRepo, "commit", "-qm", "seed");
		git(longRepo, "worktree", "add", "-qb", "feat/altpath", longWt);
		const swapCase = (s) => [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("");
		const flippedDrive = longWt.replace(/^([A-Za-z]):/, (m, d) => `${d === d.toLowerCase() ? d.toUpperCase() : d.toLowerCase()}:`);
		const flippedCase = flippedDrive.replace(/[^\\]+$/, swapCase); // drive letter AND the final folder's case flipped
		const caseOut = path.join(temp, "case-out.md");
		const caseRun = spawnSync(process.execPath, [workerBin, "--poll", "0.1", "--stall-secs", "15", "--out", caseOut, "--lane", "altpath", "--brief", brief], { cwd: flippedCase, encoding: "utf8", timeout: 60000, env });
		const shortPathProbe = spawnSync("powershell", ["-NoProfile", "-Command", `(New-Object -ComObject Scripting.FileSystemObject).GetFolder('${longWt}').ShortPath`], { encoding: "utf8" });
		const shortPath = shortPathProbe.status === 0 ? shortPathProbe.stdout.trim() : null;
		let shortRunOk = true, shortNote = "";
		if (!shortPath || shortPath.toLowerCase() === longWt.toLowerCase()) {
			shortNote = "SKIP short-path launch: this volume keeps no 8.3 short name";
			console.log(shortNote);
		} else {
			const shortRun = spawnSync(process.execPath, [workerBin, "--poll", "0.1", "--stall-secs", "15", "--out", path.join(temp, "short-out.md"), "--lane", "altpath", "--brief", brief], { cwd: shortPath, encoding: "utf8", timeout: 60000, env });
			shortRunOk = shortRun.status === 0;
			shortNote = JSON.stringify(shortRun);
		}
		// req: R-1125
		check("Windows: lane pi-worker starts pi from a short or differently cased worktree path",
			caseRun.status === 0 && shortRunOk, `${JSON.stringify(caseRun)} ${shortNote}`);
	}
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
