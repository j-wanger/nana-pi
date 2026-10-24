/**
 * @module packages/nana-pack/tests/process-tree-helper.mjs
 * @purpose End a spawned test worker's process tree without making cleanup failures escape the test.
 * @inputs a child process and optional platform and synchronous runner
 * @outputs sorted names left in a hard-kill case temp folder; kill helpers return none
 * @effects process (signals the child or starts taskkill)
 * @errors suppresses absent-process and launcher errors
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

/** Find this lane's real watcher processes on Windows, excluding the PowerShell query process. */
export function windowsLaneWatchers(root, { runner = spawnSync, timeout = 10_000 } = {}) {
	const token = path.basename(root).replaceAll("'", "''");
	const command = `$queryPid = $PID; Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $queryPid -and $_.Name -ieq 'node.exe' -and $_.CommandLine -like '*lane-watcher-child.mjs*' -and $_.CommandLine -like '*${token}*' } | ForEach-Object { "$($_.ProcessId)|$($_.ParentProcessId)|$($_.CommandLine)" }`;
	const result = runner("powershell", ["-NoProfile", "-Command", command], { encoding: "utf8", windowsHide: true, timeout });
	if (result.status !== 0) return [];
	return result.stdout.split(/\r?\n/).filter(Boolean).map((line) => {
		const [pid, ppid, ...commandLine] = line.split("|");
		return { pid: Number(pid), ppid: Number(ppid), line: commandLine.join("|") };
	});
}

/** Best-effort hard stop for a test worker and its Windows descendants. */
export function killWorkerTree(child, { platform = process.platform, runner = spawnSync } = {}) {
	if (!child?.pid) return;
	try {
		if (platform === "win32") runner("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
		else child.kill("SIGKILL");
	} catch { /* the tree already ended or the command could not start */ }
}
