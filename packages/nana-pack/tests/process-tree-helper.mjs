/**
 * @module packages/nana-pack/tests/process-tree-helper.mjs
 * @purpose Report what a killed worker left and end spawned test worker process trees without letting cleanup failures escape the test.
 * @inputs a case temp folder, child process, and optional platform, synchronous runner and query timeout
 * @outputs sorted temp entry names, Windows process snapshots or lane watcher rows; kill helpers return none
 * @effects disk (reads the case temp folder), process (signals children or starts taskkill and PowerShell)
 * @errors Windows snapshots throw on query or JSON failure; watcher and kill helpers suppress launcher errors
 */
import { spawnSync } from "node:child_process";
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

/** Find this lane's real watcher processes on Windows, excluding the PowerShell query process. */
export function windowsLaneWatchers(root, options = {}) {
	try {
		const token = path.basename(root).toLowerCase();
		return windowsProcesses(options).filter((row) => row.name.toLowerCase() === "node.exe" && row.line.toLowerCase().includes("lane-watcher-child.mjs") && row.line.toLowerCase().includes(token));
	} catch { return []; }
}

/** Best-effort hard stop for a test worker and its Windows descendants. */
export function killWorkerTree(child, { platform = process.platform, runner = spawnSync } = {}) {
	if (!child?.pid) return;
	try {
		if (platform === "win32") runner("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
		else child.kill("SIGKILL");
	} catch { /* the tree already ended or the command could not start */ }
}
