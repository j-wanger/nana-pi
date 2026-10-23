/**
 * @module packages/nana-pack/tests/process-tree.test.mjs
 * @purpose Pin the shared process-tree kill forms, their guarded pid contract, tunables and duplicate-copy scan.
 * @inputs process-tree.mjs, injected platform/process seams, and temporary git fixtures for the source scan
 * @outputs one PASS / FAIL / SKIP line per check and a non-zero exit when any check failed
 * @effects process (one Windows-only real tree and temporary git commands), disk (OS-temp fixtures, removed at exit)
 * @errors a FAIL line naming the broken contract; a non-zero exit code
 */
import { tmpDir } from "./tmp-dir.mjs";
import { EventEmitter } from "node:events";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
	DEFAULT_KILL_SIGNAL,
	TASKKILL_COMMAND,
	killProcessTree,
	killProcessTreeNoWait,
} from "../lib/process-tree.mjs";
import { TREE_KILL_EXCEPTIONS, scanTreeKillCopies } from "../lib/tree-kill-scan.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const within = (promise, ms = 3000) => Promise.race([
	Promise.resolve(promise),
	new Promise((_, reject) => setTimeout(() => reject(new Error(`case exceeded ${ms}ms`)), ms)),
]);
const fakeProcess = () => new EventEmitter();

const posixCalls = [];
const posixFallbacks = [];
let posixStarts = 0;
const posixRun = () => { posixStarts++; throw new Error("POSIX must not start taskkill"); };
const posixOk = killProcessTree(4321, { platform: "darwin", kill: (...args) => posixCalls.push(args), run: posixRun, fallback: (...args) => posixFallbacks.push(args) });
killProcessTree(4321, { platform: "darwin", signal: "SIGTERM", kill: (...args) => posixCalls.push(args), run: posixRun });
killProcessTreeNoWait(4321, { platform: "darwin", kill: (...args) => posixCalls.push(args), start: posixRun });
killProcessTreeNoWait(4321, { platform: "darwin", signal: "SIGTERM", kill: (...args) => posixCalls.push(args), start: posixRun });
killProcessTree(4321, { platform: "darwin", signal: "SIGTERM", kill: () => { throw Object.assign(new Error("gone"), { code: "ESRCH" }); }, fallback: (...args) => posixFallbacks.push(args) });
killProcessTreeNoWait(4321, { platform: "darwin", kill: () => { throw Object.assign(new Error("gone"), { code: "ESRCH" }); }, fallback: (...args) => posixFallbacks.push(args) });
let noFallbackKillCalls = 0;
killProcessTree(4321, { platform: "darwin", kill: () => { noFallbackKillCalls++; throw new Error("gone"); } });
// req: R-2656
check("R-2656: off Windows both forms of the shared tree kill signal the pid's process group once, SIGKILL by default, and call the fallback only when that signal throws", posixOk === true && posixStarts === 0
	&& JSON.stringify(posixCalls) === JSON.stringify([[-4321, "SIGKILL"], [-4321, "SIGTERM"], [-4321, "SIGKILL"], [-4321, "SIGTERM"]])
	&& JSON.stringify(posixFallbacks) === JSON.stringify([["SIGTERM"], ["SIGKILL"]]) && noFallbackKillCalls === 1);

const taskkillCalls = [];
const fallbacks = [];
const runResult = (result) => (command, args, options) => { taskkillCalls.push({ command, args, options }); return result; };
const success = killProcessTree(4321, { platform: "win32", kill: () => { throw new Error("Windows called kill"); }, run: runResult({ status: 0 }), fallback: () => fallbacks.push("success") });
const refused = killProcessTree(4321, { platform: "win32", run: runResult({ status: 128 }), fallback: (signal) => fallbacks.push(signal) });
const missing = killProcessTree(4321, { platform: "win32", run: runResult({ status: null, error: Object.assign(new Error("missing"), { code: "ENOENT" }) }), fallback: (signal) => fallbacks.push(signal) });
const thrown = killProcessTree(4321, { platform: "win32", run: () => { throw new Error("start failed"); }, fallback: (signal) => fallbacks.push(signal) });

const noWaitCalls = [];
const runNoWait = async ({ events, throws = false }) => {
	let fallbackCount = 0;
	let call;
	const start = (command, args, options) => {
		call = { command, args, options };
		if (throws) throw new Error("start failed");
		const proc = fakeProcess();
		queueMicrotask(() => { for (const [event, value] of events) proc.emit(event, value); });
		return proc;
	};
	killProcessTreeNoWait(4321, { platform: "win32", start, kill: () => { throw new Error("Windows called kill"); }, fallback: () => { fallbackCount++; } });
	await within(new Promise((resolve) => setImmediate(resolve)));
	noWaitCalls.push({ call, fallbackCount });
};
await within(runNoWait({ events: [["close", 0]] }));
await within(runNoWait({ events: [["error", Object.assign(new Error("missing"), { code: "ENOENT" })], ["close", -4058]] }));
await within(runNoWait({ events: [["close", 1]] }));
await within(runNoWait({ events: [], throws: true }));
let waitingFallbackEscaped = false;
try { killProcessTree(4321, { platform: "win32", run: runResult({ status: 1 }), fallback: () => { throw new Error("fallback"); } }); } catch { waitingFallbackEscaped = true; }
const throwingProc = fakeProcess();
let noWaitFallbackEscaped = false;
killProcessTreeNoWait(4321, { platform: "win32", start: () => throwingProc, fallback: () => { throw new Error("fallback"); } });
try { throwingProc.emit("close", 1); } catch { noWaitFallbackEscaped = true; }
const allTaskkillCallsValid = [...taskkillCalls, ...noWaitCalls.map((entry) => entry.call).filter(Boolean)].every((entry) =>
	entry.command === "taskkill" && JSON.stringify(entry.args) === JSON.stringify(["/T", "/F", "/PID", "4321"])
	&& entry.options?.windowsHide === true && entry.options?.shell !== true);
// req: R-2657
check("R-2657: on Windows both forms start taskkill /T /F /PID once without a shell, signal no group, call the fallback once when taskkill cannot start or exits non-zero, and contain a throwing fallback", success === true && refused === false && missing === false && thrown === false
	&& allTaskkillCallsValid && JSON.stringify(fallbacks) === JSON.stringify(["SIGKILL", "SIGKILL", "SIGKILL"])
	&& JSON.stringify(noWaitCalls.map((entry) => entry.fallbackCount)) === JSON.stringify([0, 1, 1, 1])
	&& !waitingFallbackEscaped && !noWaitFallbackEscaped);

const badPids = [0, 1, -1, 1.5, NaN, null, undefined, Infinity, "12"];
let badEffects = 0;
for (const pid of badPids) {
	for (const platform of ["darwin", "win32"]) {
		killProcessTree(pid, { platform, kill: () => { badEffects++; }, run: () => { badEffects++; }, fallback: () => { badEffects++; } });
		killProcessTreeNoWait(pid, { platform, kill: () => { badEffects++; }, start: () => { badEffects++; }, fallback: () => { badEffects++; } });
	}
}
// req: R-2658
check("R-2658: a pid of 0, 1, -1, 1.5, NaN, null or undefined signals nothing, starts no taskkill and calls no fallback", badEffects === 0);

// req: R-2656 R-2657 R-2661
check("seal: taskkill, SIGKILL by default, and the four declared tree-kill exceptions",
	TASKKILL_COMMAND === "taskkill" && DEFAULT_KILL_SIGNAL === "SIGKILL" && Object.isFrozen(TREE_KILL_EXCEPTIONS)
	&& JSON.stringify(TREE_KILL_EXCEPTIONS) === JSON.stringify({
		"packages/nana-pack/lib/process-tree.mjs": "the one shared process-group and taskkill implementation",
		"scripts/runtime-measure.mjs": "the runtime measurer walks a process snapshot before choosing safe group or pid targets",
		"scripts/test-locked.mjs": "the locked runner composes runtime-measure targets with its live child handle",
		"apps/desk/server.mjs": "the frozen desk keeps its existing child lifecycle implementation",
	}));

const fixture = tmpDir(path.join(os.tmpdir(), "tree-kill-scan-"));
try {
	const config = {
		roots: ["scripts", "apps/desk", "packages/nana-pack/lib", "packages/nana-pack/bin", "packages/nana-pack/extensions", { path: "packages/nana-pack/tests", layerExempt: true }],
		ignore: ["**/fixtures"],
	};
	const files = {
		"code-map.config.json": `${JSON.stringify(config)}\r\n`,
		"packages/nana-pack/lib/process-tree.mjs": "const x = 'taskkill';\r\n",
		"scripts/runtime-measure.mjs": "process.kill(-pid, signal);\n",
		"scripts/test-locked.mjs": "target.kill(signal);\n",
		"apps/desk/server.mjs": "const command = `taskkill /pid ${pid}`;\n",
		"packages/nana-pack/bin/good.mjs": "// spawn(\"taskkill\")\r\n /* process.kill(-pid) */\t\r\n * taskkill\r\nconst harmless = 'kill';\t",
		"packages/nana-pack/bin/template.mjs": "const command = `taskkill ${pid}`;\t",
		"packages/nana-pack/extensions/bad.ts": "spawn(\"taskkill\", []);  \r\nexport const b = () => process.kill( -4321, 'SIGKILL');\t",
		"packages/nana-pack/tests/ignored.test.mjs": "const x = 'taskkill';\n",
	};
	for (const [relative, text] of Object.entries(files)) {
		const target = path.join(fixture, relative);
		fs.mkdirSync(path.dirname(target), { recursive: true });
		fs.writeFileSync(target, text);
	}
	spawnSync("git", ["init", "-q"], { cwd: fixture });
	spawnSync("git", ["add", "."], { cwd: fixture });
	const planted = scanTreeKillCopies(fixture);
	fs.rmSync(path.join(fixture, "scripts", "test-locked.mjs"));
	const missingException = scanTreeKillCopies(fixture);
	const repositoryFindings = scanTreeKillCopies(REPO);
	// req: R-2661
	check("R-2661: the tree-kill scan names each planted taskkill or negative-pid line outside the exceptions, and finds none in the repository",
		repositoryFindings.length === 0 && JSON.stringify(planted.map(({ path: file, line }) => [file, line])) === JSON.stringify([
			["packages/nana-pack/bin/template.mjs", 1],
			["packages/nana-pack/extensions/bad.ts", 1],
			["packages/nana-pack/extensions/bad.ts", 2],
		]) && missingException.some((finding) => finding.path === "scripts/test-locked.mjs" && finding.line === 0),
		JSON.stringify({ repositoryFindings, planted, missingException }));
} finally {
	fs.rmSync(fixture, { recursive: true, force: true });
}

if (process.platform === "win32") {
	const realDir = tmpDir(path.join(os.tmpdir(), "tree-kill-real-"));
	try {
		const pidFile = path.join(realDir, "child.pid");
		const parent = spawn(process.execPath, ["-e", `const {spawn}=require('node:child_process');const fs=require('node:fs');const c=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{cwd:require('node:os').tmpdir()});fs.writeFileSync(${JSON.stringify(pidFile)},String(c.pid));setInterval(()=>{},1000);`], { cwd: os.tmpdir(), detached: false, stdio: "ignore" });
		await within(new Promise((resolve, reject) => {
			const until = Date.now() + 2000;
			const poll = () => fs.existsSync(pidFile) ? resolve() : Date.now() > until ? reject(new Error("child pid not written")) : setTimeout(poll, 20);
			poll();
		}));
		const childPid = Number(fs.readFileSync(pidFile, "utf8"));
		const aliveBefore = [parent.pid, childPid].every((pid) => { try { process.kill(pid, 0); return true; } catch { return false; } });
		const killed = killProcessTree(parent.pid);
		const gone = async (pid) => within(new Promise((resolve) => {
			const poll = () => { try { process.kill(pid, 0); setTimeout(poll, 25); } catch { resolve(true); } };
			poll();
		}), 3000);
		const bothGone = await Promise.all([gone(parent.pid), gone(childPid)]);
		check("R-2657: Windows taskkill reaches a real child tree without a shell", aliveBefore && killed && bothGone.every(Boolean));
	} finally {
		fs.rmSync(realDir, { recursive: true, force: true });
	}
} else {
	console.log("SKIP R-2657: Windows taskkill reaches a real child tree without a shell");
}

process.exit(fails);
