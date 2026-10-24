/**
 * @module packages/nana-pack/lib/lane-watcher.mjs
 * @purpose Start and run the detached cleanup watcher for one pi-worker lane build.
 * @inputs an absolute lane-watch specification, worker and builder process state, lane files, build ledger and injected process/filesystem seams
 * @outputs watcher launch status and completed cleanup
 * @effects process (starts the hop, polls pids, may end one POSIX builder group and runs git), disk (removes lane temp files, appends an end record and may release one lock)
 * @errors launch errors reach the caller callback; watch and cleanup failures are contained
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
	CLAUDE_BUILDER_PROMPT_FILE,
	CLAUDE_BUILDER_SETTINGS_FILE,
	LANE_BUILDER_PID_FILE,
	LANE_WATCHER_GIT_TIMEOUT_MS,
	LANE_WATCHER_POLL_MS,
	LANE_WATCHER_REMOVE_RETRIES,
	LANE_WATCHER_REMOVE_RETRY_MS,
	LANE_WATCHER_START_TOLERANCE_MS,
	LANE_WATCHER_STOP_WAIT_MS,
} from "../bin/worker-config.mjs";
import { appendBuildRecord, buildEndRecord, buildRecordsPath, collectBuildUsage, readBuildLedger } from "./build-records.mjs";
import { releaseLaneLock } from "./lane-lock.mjs";
import { killProcessTree, pidAlive } from "./process-tree.mjs";

export const LANE_WATCHER_HOP_FLAG = "--hop";
export const LANE_WATCHER_WATCH_FLAG = "--watch";

const childScript = fileURLToPath(new URL("lane-watcher-child.mjs", import.meta.url));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const errorText = (error) => `${error?.code ? `${error.code}: ` : ""}${error?.message ?? String(error)}`;

/** Start the detached one-shot hop; return false only for a synchronous launch failure. */
export function startLaneWatcher(spec, {
	start = spawn,
	onError = () => {},
	execPath = process.execPath,
} = {}) {
	const absolute = {
		...spec,
		folder: path.resolve(spec.folder),
		lock: path.resolve(spec.lock),
		commonDir: path.resolve(spec.commonDir),
		cwd: spec.cwd ? path.resolve(spec.cwd) : undefined,
		watcherCwd: path.parse(execPath).root,
	};
	try {
		const hop = start(execPath, [childScript, LANE_WATCHER_HOP_FLAG, JSON.stringify(absolute)], {
			cwd: absolute.watcherCwd,
			detached: true,
			stdio: "ignore",
			windowsHide: true,
		});
		hop.once("error", onError);
		hop.unref();
		return true;
	} catch (error) {
		onError(error);
		return false;
	}
}

function lockOwner(lock, readFile = fs.readFileSync) {
	try {
		const pid = Number(readFile(lock, "utf8").trim());
		return Number.isSafeInteger(pid) && pid > 0 ? pid : null;
	} catch {
		return null;
	}
}

function readBuilder(folder, { readFile = fs.readFileSync, stat = fs.statSync } = {}) {
	const file = path.join(folder, LANE_BUILDER_PID_FILE);
	try {
		const value = JSON.parse(readFile(file, "utf8"));
		if (!Number.isSafeInteger(value?.pid) || value.pid <= 1) return null;
		return { pid: value.pid, launch: value.launch === "cmd" ? "cmd" : "direct", recordedAt: stat(file).mtimeMs };
	} catch {
		return null;
	}
}

function defaultProcessStartedAt(pid, { run = spawnSync } = {}) {
	try {
		const result = run("ps", ["-o", "lstart=", "-p", String(pid)], {
			encoding: "utf8",
			env: { ...process.env, LC_ALL: "C" },
			stdio: ["ignore", "pipe", "ignore"],
			timeout: LANE_WATCHER_GIT_TIMEOUT_MS,
			windowsHide: true,
		});
		if (result?.status !== 0 || result?.error) return null;
		const value = Date.parse(String(result.stdout ?? "").trim());
		return Number.isFinite(value) ? new Date(value) : null;
	} catch {
		return null;
	}
}

async function defaultWaitForExit(pid, limitMs, alive = pidAlive, wait = sleep) {
	const deadline = Date.now() + limitMs;
	while (alive(pid) && Date.now() < deadline) await wait(Math.min(LANE_WATCHER_POLL_MS, Math.max(1, deadline - Date.now())));
	return !alive(pid);
}

function removeLaneFolder(folder, { unlink = fs.rmSync, remove = fs.rmSync } = {}) {
	for (const name of [CLAUDE_BUILDER_PROMPT_FILE, CLAUDE_BUILDER_SETTINGS_FILE]) {
		try { unlink(path.join(folder, name), { force: true }); } catch { /* recursive removal still gets another chance */ }
	}
	try {
		remove(folder, { recursive: true, force: true, maxRetries: LANE_WATCHER_REMOVE_RETRIES, retryDelay: LANE_WATCHER_REMOVE_RETRY_MS });
	} catch { /* silent best effort */ }
}

function headAt(cwd, run = spawnSync) {
	try {
		const result = run("git", ["rev-parse", "HEAD"], {
			cwd,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
			timeout: LANE_WATCHER_GIT_TIMEOUT_MS,
			windowsHide: true,
		});
		if (result?.status !== 0 || result?.error) return { tip: null, tipError: errorText(result?.error ?? new Error(String(result?.stderr ?? "git failed").trim())) };
		return { tip: String(result.stdout ?? "").trim() || null, tipError: null };
	} catch (error) {
		return { tip: null, tipError: errorText(error) };
	}
}

function keepStoppedEnd(spec, { exists = fs.existsSync, run = spawnSync } = {}) {
	if (!spec.build) return;
	const ledger = buildRecordsPath(spec.commonDir);
	if (!exists(ledger)) return;
	let records;
	try { ({ records } = readBuildLedger(ledger)); } catch { return; }
	const start = records.find((record) => record.kind === "start" && record.build === spec.build);
	if (!start || records.some((record) => record.kind === "end" && record.build === spec.build)) return;
	const found = collectBuildUsage(start);
	const { tip, tipError } = headAt(start.cwd, run);
	appendBuildRecord(spec.commonDir, buildEndRecord(start, {
		attempts: 1,
		exit: null,
		outcome: "stopped",
		signal: null,
		tip,
		tipError,
		found,
		outputError: null,
	}));
}

/** Clean one dead worker's lane while conservatively retaining a lock for any possible live builder. */
export async function cleanLane(spec, options = {}) {
	const platform = options.platform ?? process.platform;
	const alive = options.alive ?? pidAlive;
	const killTree = options.killTree ?? killProcessTree;
	const processStartedAt = options.processStartedAt ?? defaultProcessStartedAt;
	const waitForExit = options.waitForExit ?? ((pid) => defaultWaitForExit(pid, LANE_WATCHER_STOP_WAIT_MS, alive));
	const exists = options.exists ?? fs.existsSync;
	try {
		const ownsLock = lockOwner(spec.lock, options.readFile) === spec.workerPid;
		if (!exists(spec.folder) && !ownsLock) return;
		const builder = readBuilder(spec.folder, options);
		let mayRelease = true;
		if (builder) {
			if (platform === "win32") {
				mayRelease = builder.launch !== "cmd" && await waitForExit(builder.pid);
			} else {
				const leaderAlive = alive(builder.pid);
				const started = leaderAlive ? processStartedAt(builder.pid) : null;
				const identitySafe = !leaderAlive || (started instanceof Date && Number.isFinite(started.getTime()) && started.getTime() <= builder.recordedAt + LANE_WATCHER_START_TOLERANCE_MS);
				if (!identitySafe) mayRelease = false;
				else {
					try { killTree(builder.pid, { platform }); } catch { /* shared helper is best effort */ }
					mayRelease = await waitForExit(builder.pid);
				}
			}
		}
		removeLaneFolder(spec.folder, options);
		try { keepStoppedEnd(spec, { exists, run: options.run }); } catch { /* silent best effort */ }
		if (mayRelease) releaseLaneLock(spec.lock, spec.workerPid, { readFile: options.readFile, remove: options.remove });
	} catch {
		try { removeLaneFolder(spec.folder, options); } catch { /* silent best effort */ }
	}
}

/** Poll the recorded pi-worker and clean once it no longer names a live process. */
export async function watchLane(spec, { alive = pidAlive, wait = sleep, ...options } = {}) {
	try {
		while (alive(spec.workerPid)) await wait(LANE_WATCHER_POLL_MS);
		await cleanLane(spec, { ...options, alive });
	} catch { /* entry process stays silent and exits */ }
}
