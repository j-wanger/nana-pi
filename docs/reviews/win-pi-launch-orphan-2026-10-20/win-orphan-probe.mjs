#!/usr/bin/env node
// Seat scratch probe (never merged): win-pi-launch-orphan, step one, before the build.
// Run on windows-latest (Node 22) from the repo root of main: node <this file>. No pi needed.
// It answers one question: when something kills install alone, or the relay alone, while install
// waits on a pi launch, which processes of that launch keep running, and for how long?
//   route "cmd":    relay -> cmd.exe -> node pi -> node child      (today's route for a pi.cmd)
//   route "direct": relay -> node pi -> node child                 (design (a): pi's npm Node entry)
// "install" is a wrapper that calls boundedSpawnSync exactly as stepPiRegister does today.
// Every phase prints one JSON line; the last line names the build branch.
// On macOS or Linux only the direct route runs, to sanity-check this script's own machinery.
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const win = process.platform === "win32";
const root = process.cwd();
const BOUND_MS = 2_200; // R-2131's test bound: parent poll 200 + signal grace 1000 + margin 1000
const OBSERVE_MS = 5_000; // a little over twice the bound
const HANG_MS = 30_000; // the fake pi's own lifetime, far past the observation window
const START_MS = 20_000; // a cold Windows runner may need seconds to start three Node processes
const POLL_MS = 50;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (error) { return error?.code === "EPERM"; } };
const bundled = (rel) => pathToFileURL(path.join(root, rel)).href;

function processTable() {
	if (win) {
		const r = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
			"Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress"],
			{ encoding: "utf8", windowsHide: true, timeout: 60_000 });
		try { return JSON.parse(r.stdout).map((p) => ({ pid: p.ProcessId, ppid: p.ParentProcessId, name: p.Name })); } catch { return []; }
	}
	const r = spawnSync("ps", ["-A", "-o", "pid=,ppid=,comm="], { encoding: "utf8" });
	return r.stdout.split("\n").filter(Boolean).map((line) => {
		const [pid, ppid, ...name] = line.trim().split(/\s+/);
		return { pid: Number(pid), ppid: Number(ppid), name: path.basename(name.join(" ")) };
	});
}

function descendants(table, top) {
	const out = [];
	const queue = [top];
	while (queue.length) {
		const parent = queue.shift();
		for (const p of table) if (p.ppid === parent && p.pid !== top && !out.some((o) => o.pid === p.pid)) { out.push(p); queue.push(p.pid); }
	}
	return out;
}

function fixture(name) {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), `orphan-probe-${name}-`));
	const pids = path.join(home, "pids.jsonl");
	const hang = path.join(home, "hang.cjs");
	fs.writeFileSync(hang, [
		'const fs = require("node:fs");',
		'const { spawn } = require("node:child_process");',
		'const role = process.argv[2] === "child" ? "child" : "pi";',
		'fs.appendFileSync(process.env.PIDS_FILE, JSON.stringify({ role, pid: process.pid, ppid: process.ppid }) + "\\n");',
		'if (role === "pi") spawn(process.execPath, [__filename, "child"], { stdio: "inherit", env: process.env });',
		'setTimeout(() => process.exit(0), Number(process.env.HANG_MS));',
	].join("\n"));
	const shim = path.join(home, "pi.cmd");
	if (win) fs.writeFileSync(shim, `@"${process.execPath}" "%~dp0hang.cjs" %*\r\n`);
	const wrapper = path.join(home, "install.mjs");
	fs.writeFileSync(wrapper, [
		`import { boundedSpawnSync } from ${JSON.stringify(bundled("packages/nana-setup/lib/bounded-spawn.mjs"))};`,
		`import { winCommand } from ${JSON.stringify(bundled("packages/nana-pack/lib/win-command.mjs"))};`,
		'const comspecKey = Object.keys(process.env).find((key) => key.toLowerCase() === "comspec");',
		'const launch = process.env.ROUTE === "cmd"',
		'  ? winCommand(process.env.SHIM, ["--version"], { comspec: comspecKey ? process.env[comspecKey] : undefined })',
		'  : { command: process.execPath, args: [process.env.HANG, "--version"], options: {} };',
		'const r = boundedSpawnSync(launch.command, launch.args, { ...launch.options, encoding: "utf8", timeout: Number(process.env.HANG_MS) });',
		'console.log(JSON.stringify({ status: r.status, error: r.error?.code ?? null }));',
	].join("\n"));
	return { home, pids, hang, shim, wrapper };
}

async function phase({ name, route, kill, detached }) {
	const f = fixture(name);
	const env = { ...process.env, PIDS_FILE: f.pids, HANG_MS: String(HANG_MS), ROUTE: route, SHIM: f.shim, HANG: f.hang };
	const install = spawn(process.execPath, [f.wrapper], { detached, stdio: "ignore", env });
	const startEnd = Date.now() + START_MS;
	const records = () => (fs.existsSync(f.pids) ? fs.readFileSync(f.pids, "utf8").split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l)) : []);
	while (Date.now() < startEnd && records().length < 2) await sleep(POLL_MS);
	const recs = records();
	const piRec = recs.find((r) => r.role === "pi");
	const childRec = recs.find((r) => r.role === "child");
	const tree = descendants(processTable(), install.pid);
	// Match by name: on Windows a console process can also list conhost.exe as its child.
	const relay = tree.find((p) => p.ppid === install.pid && /^node(\.exe)?$/i.test(p.name));
	const cmd = route === "cmd" ? tree.find((p) => /^cmd\.exe$/i.test(p.name)) : undefined;
	const watched = { install: install.pid, relay: relay?.pid, cmd: cmd?.pid, pi: piRec?.pid, child: childRec?.pid };
	const started = Boolean(piRec && childRec && relay);
	const target = kill === "install" ? install.pid : relay?.pid;
	const killedAt = Date.now();
	if (started && target) { try { process.kill(target, "SIGKILL"); } catch {} }
	const deadAt = {};
	while (Date.now() - killedAt < OBSERVE_MS) {
		for (const [role, pid] of Object.entries(watched)) if (pid && deadAt[role] === undefined && !alive(pid)) deadAt[role] = Date.now() - killedAt;
		if (Object.entries(watched).every(([role, pid]) => !pid || deadAt[role] !== undefined)) break;
		await sleep(POLL_MS);
	}
	const survivors = Object.entries(watched).filter(([role, pid]) => pid && deadAt[role] === undefined).map(([role]) => role);
	for (const [, pid] of Object.entries(watched)) if (pid && alive(pid)) {
		if (win) spawnSync("taskkill", ["/T", "/F", "/PID", String(pid)], { stdio: "ignore", windowsHide: true });
		else try { process.kill(pid, "SIGKILL"); } catch {}
	}
	try { fs.rmSync(f.home, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
	const result = { phase: name, route, kill, detached, started, watched, piParent: piRec?.ppid ?? null, treeNames: tree.map((p) => `${p.pid}:${p.name}<${p.ppid}`), deadAtMs: deadAt, survivorsAt5s: survivors };
	console.log(JSON.stringify(result));
	return result;
}

const within = (r, role) => r.deadAtMs[role] !== undefined && r.deadAtMs[role] <= BOUND_MS;
console.log(JSON.stringify({ node: process.version, platform: process.platform, release: os.release(), boundMs: BOUND_MS, observeMs: OBSERVE_MS }));
const P = {};
if (win) {
	P.A = await phase({ name: "A-cmd-kill-install", route: "cmd", kill: "install", detached: false });
	P.A2 = await phase({ name: "A2-cmd-kill-install-detached", route: "cmd", kill: "install", detached: true });
	P.D = await phase({ name: "D-cmd-kill-relay", route: "cmd", kill: "relay", detached: false });
}
P.B = await phase({ name: "B-direct-kill-install", route: "direct", kill: "install", detached: false });
P.B2 = await phase({ name: "B2-direct-kill-install-detached", route: "direct", kill: "install", detached: true });
P.C = await phase({ name: "C-direct-kill-relay", route: "direct", kill: "relay", detached: false });

if (!win) { console.log("BRANCH none: not Windows; this run only checks the probe's own machinery"); process.exit(0); }
const allStarted = Object.values(P).every((r) => r.started);
const jobHolds = [P.A, P.A2].every((r) => r.deadAtMs.relay !== undefined && r.deadAtMs.relay <= 500);
const todayRed = [P.A, P.A2].some((r) => !within(r, "pi") || !within(r, "child"));
const directEnds = [P.B, P.B2].every((r) => ["relay", "pi", "child"].every((role) => within(r, role)));
const relayKillEnds = within(P.C, "pi") && within(P.C, "child");
let branch;
if (!allStarted) branch = "BRANCH 0: a phase did not start; read the JSON lines, fix the probe, re-run";
else if (!todayRed) branch = "BRANCH 3: today's route already ends every process within the bound; pin only (R-2300 test, tests-only, ordinary), no code change";
else if (!jobHolds) branch = "BRANCH 2: the relay outlives install; build the win32 parent check in the relay, not the route change";
else if (directEnds) branch = `BRANCH 1: the relay dies with install and the direct route ends pi and its child; build design (a)${relayKillEnds ? "; R-2303 (relay kill) holds" : "; drop R-2303, relay kill leaves pi"}`;
else branch = "BRANCH 4: the relay dies with install but the direct route leaves pi or its child; stop, return to the seat";
console.log(branch);
