/**
 * @module packages/nana-pack/tests/process-tree-helper.mjs
 * @purpose Report worker leftovers and signal test processes only under live child or recorded ownership.
 * @inputs a case temp folder, child process, pid list, and optional platform, synchronous runner, strict identity mode and query timeout
 * @outputs sorted temp entry names, start tokens and epochs, pid-file identities, process snapshots, watcher rows and signalled pids
 * @effects disk (reads case folders and pid-file contents and mtimes), process (queries identities and signals owned children or trees)
 * @errors Windows snapshots and strict identity queries throw on query failure; snapshots also throw on JSON failure; watcher and kill helpers suppress launcher errors
 */
import { ChildProcess, spawn, spawnSync } from "node:child_process";
import { killProcessTree, killProcessTreeNoWait, killTree } from "../lib/process-tree.mjs";
import * as fs from "node:fs";
import * as path from "node:path";

/** Return sorted entry names; a missing case folder is already empty after cleanup. */
export function hardKillTempNames(root) {
	try { return fs.readdirSync(root).sort(); }
	catch (error) { if (error?.code === "ENOENT") return []; throw error; }
}

/** Read the worker pid from the watcher command line. */
export function watcherWorkerPid(line) {
	const match = /\\?"workerPid\\?":(\d+)/.exec(line);
	return match ? Number(match[1]) : null;
}

/** Snapshot live Windows processes; a failed query must not look like an empty tree. */
export function windowsProcesses({ runner = spawnSync, timeout = 10_000 } = {}) {
	const command = `$queryPid = $PID; @(Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $queryPid } | Select-Object ProcessId,ParentProcessId,Name,CommandLine) | ConvertTo-Json -Compress`;
	const result = runner("powershell", ["-NoProfile", "-Command", command], { cwd: path.parse(process.execPath).root, encoding: "utf8", windowsHide: true, timeout });
	if (result.status !== 0) throw new Error(`Windows process query failed: ${result.error?.message ?? result.stderr}`);
	const rows = JSON.parse(result.stdout);
	return (Array.isArray(rows) ? rows : [rows]).map((row) => ({ pid: row.ProcessId, ppid: row.ParentProcessId, name: row.Name, line: row.CommandLine ?? "" }));
}

// Exact OS start tokens authorize fixture cleanup signals, not pid liveness alone.
// POSIX tokens carry UTC explicitly so Date.parse never uses the reader's local zone.
export function processStarts(pids, { run = spawnSync, strict = false, platform = process.platform } = {}) {
	if (!pids.length) return new Map();
	const windows = platform === "win32";
	const result = windows
		? run('powershell', ['-NoProfile', '-Command', `Get-Process -Id ${pids.join(',')} -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Id) $($_.StartTime.ToUniversalTime().Ticks)" }`], { encoding: 'utf8', timeout: 10000, windowsHide: true })
		: run('ps', ['-o', 'pid=', '-o', 'lstart=', '-p', pids.join(',')], { encoding: 'utf8', timeout: 10000, env: { ...process.env, LC_ALL: 'C', TZ: 'UTC' } });
	if (strict && (result.error || result.signal)) throw new Error(`process identity query failed: ${result.error?.code ?? result.signal}`);
	if (strict && typeof result.status === 'number' && result.status !== 0 && result.status !== 1) throw new Error(`process identity query failed: status ${result.status}`);
	const starts = new Map();
	for (const line of String(result.stdout ?? '').split(/\r?\n/)) {
		const match = /^\s*(\d+)\s+(.+?)\s*$/.exec(line);
		if (match) starts.set(Number(match[1]), windows ? match[2] : `${match[2]} GMT`);
	}
	return starts;
}

/** Convert an OS start token to epoch milliseconds, retaining UTC for POSIX tokens. */
export function startTime(token, { platform = process.platform } = {}) {
	if (!token) return NaN;
	return platform === "win32" ? (Number(token) - 621355968000000000) / 10000 : Date.parse(token);
}

/** A self-written pid file vouches only for its writer, born before its own write.
 * A parent's record of a child cannot vouch: its mtime can precede the child's OS start time.
 */
export function fileIdentity(file) {
	try {
		const text = fs.readFileSync(file, "utf8");
		if (!/^[1-9]\d*\s*$/.test(text)) return null;
		const pid = Number(text);
		return Number.isSafeInteger(pid) ? { pid, recordedAt: fs.statSync(file).mtimeMs } : null;
	} catch { return null; }
}

/** Signal the owned leader and independently owned recorded members, never a bare pid. */
export function killOwned(target, {
	group = false, tree = false, walk = false, wait = true, members = [], signal = "SIGKILL",
	platform = process.platform, kill = process.kill, run = wait ? spawnSync : spawn, starts = processStarts,
} = {}) {
	const valid = (item) => item && typeof item === "object" && Number.isSafeInteger(item.pid) && item.pid > 1;
	const identities = [target, ...members].filter(item => valid(item) && !(item instanceof ChildProcess));
	const tokens = identities.length ? starts([...new Set(identities.map(item => item.pid))], { platform }) : new Map();
	const owned = (item) => {
		if (!valid(item)) return false;
		if (item instanceof ChildProcess) return item.exitCode === null && item.signalCode === null;
		const current = tokens.get(item.pid);
		if (!current) return false;
		if (item.start) return current === item.start;
		return Number.isFinite(item.recordedAt) && startTime(current, { platform }) <= item.recordedAt;
	};
	const signalled = [];
	const single = (item) => {
		try {
			const sent = item instanceof ChildProcess ? item.kill(signal) : (kill(item.pid, signal), true);
			if (sent !== false) signalled.push(item.pid);
		} catch { /* already ended */ }
	};
	if (owned(target)) {
		if (platform !== "win32" && walk) {
			try { killTree(target.pid, { signal, kill, run: args => run(args[0], args.slice(1), { encoding: "utf8" }) }); signalled.push(target.pid); }
			catch { single(target); }
		} else if (platform === "win32" ? tree : group) {
			let fallback = false;
			const options = { signal, platform, kill, fallback: () => { fallback = true; single(target); } };
			if (wait) killProcessTree(target.pid, { ...options, run });
			else killProcessTreeNoWait(target.pid, { ...options, start: run });
			if (!fallback) signalled.push(target.pid);
		} else single(target);
	}
	for (const member of members) if (owned(member)) single(member);
	return [...new Set(signalled)];
}

/** Find this lane's real watcher processes on Windows, excluding the PowerShell query process. */
export function windowsLaneWatchers(root, options = {}) {
	try {
		const token = path.basename(root).toLowerCase();
		return windowsProcesses(options).filter((row) => row.name.toLowerCase() === "node.exe" && row.line.toLowerCase().includes("lane-watcher-child.mjs") && row.line.toLowerCase().includes(token));
	} catch { return []; }
}

