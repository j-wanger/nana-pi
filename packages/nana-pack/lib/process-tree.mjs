/**
 * @module packages/nana-pack/lib/process-tree.mjs
 * @purpose Provide shared process liveness, group kills and remembered process-tree snapshot signalling.
 * @inputs a pid, signal, platform, optional fallback and injected kill/run/start seams
 * @outputs Liveness and kill outcomes, remembered snapshot targets, and sealed process-list/taskkill constants.
 * @effects process (lists processes, signals groups or PIDs, or starts taskkill)
 * @errors Snapshot signalling throws unexpected kill errors; group-kill helpers never throw.
 */
import { spawn, spawnSync } from "node:child_process";

// contract R-2657: Windows' taskkill.exe, found on PATH without a shell.
export const TASKKILL_COMMAND = "taskkill";
// contract R-1233 and R-1700: taskkill must walk and forcibly end the whole tree.
export const TASKKILL_ARGS = Object.freeze(["/T", "/F", "/PID"]);
// chosen 2026-10-22: four of the six consolidated callers use SIGKILL.
export const DEFAULT_KILL_SIGNAL = "SIGKILL";

// contract (R-2527); chosen: one listing gives pid, parent pid and process group id.
export const TREE_LIST = ["ps", "-A", "-o", "pid=,ppid=,pgid="];

/** pid -> {ppid, pgid} from a `ps -A -o pid=,ppid=,pgid=`-shaped listing. */
function parseTree(output) {
	const procs = new Map();
	for (const line of output.split("\n")) {
		const m = /^\s*(\d+)\s+(\d+)\s+(\d+)\s*$/.exec(line);
		if (m) procs.set(Number(m[1]), { ppid: Number(m[2]), pgid: Number(m[3]) });
	}
	return procs;
}

/** `rootPid` and every process reachable by following parent links down from it. */
function descendantsOf(rootPid, procs) {
	const children = new Map();
	for (const [pid, info] of procs) {
		if (!children.has(info.ppid)) children.set(info.ppid, []);
		children.get(info.ppid).push(pid);
	}
	const seen = new Set();
	const queue = [rootPid];
	while (queue.length) {
		const pid = queue.shift();
		if (seen.has(pid)) continue;
		seen.add(pid);
		for (const child of children.get(pid) ?? []) queue.push(child);
	}
	return seen;
}

/** Signal remembered process-group and single-pid targets; a gone or inaccessible target is harmless. */
export function signalTreeTargets(targets, { kill = process.kill, signal = "SIGKILL" } = {}) {
	for (const pgid of targets?.groups ?? []) {
		try { kill(-pgid, signal); }
		catch (error) { if (!["ESRCH", "EPERM"].includes(error?.code)) throw error; }
	}
	for (const pid of targets?.pids ?? []) {
		try { kill(pid, signal); }
		catch (error) { if (!["ESRCH", "EPERM"].includes(error?.code)) throw error; }
	}
}

/**
 * Signal the suite's whole process tree rooted at `rootPid` (R-2527), using
 * SIGKILL by default: signal by process group every group whose members all lie in the tree, and
 * by pid any tree process whose group also holds a process outside the tree. A group shared with
 * this command's caller is therefore never signalled as a group. Return every target signalled so
 * an escalation can reach a descendant orphaned after this snapshot.
 */
export function killTree(rootPid, { run = (args) => spawnSync(args[0], args.slice(1), { encoding: "utf8" }), kill = process.kill, signal = "SIGKILL" } = {}) {
	const listing = run(TREE_LIST);
	if (listing.status !== 0 || !listing.stdout) return { groups: [], pids: [] };
	const procs = parseTree(listing.stdout);
	const tree = descendantsOf(rootPid, procs);
	const groupHasOutsider = new Set();
	for (const [pid, info] of procs) if (!tree.has(pid)) groupHasOutsider.add(info.pgid);
	const targets = { groups: [], pids: [] };
	const targetGroups = new Set();
	for (const pid of tree) {
		const info = procs.get(pid);
		if (!info) continue;
		if (groupHasOutsider.has(info.pgid)) targets.pids.push(pid);
		else if (!targetGroups.has(info.pgid)) {
			targetGroups.add(info.pgid);
			targets.groups.push(info.pgid);
		}
	}
	signalTreeTargets(targets, { kill, signal });
	return targets;
}

const validPid = (pid) => Number.isSafeInteger(pid) && pid > 1;

/** Whether a pid names a live or inaccessible process; invalid and absent pids are false. */
export function pidAlive(pid, { kill = process.kill } = {}) {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try { kill(pid, 0); return true; }
	catch (error) { return error?.code === "EPERM"; }
}
const useFallback = (fallback, signal) => {
	if (typeof fallback !== "function") return;
	try { fallback(signal); } catch { /* best effort */ }
};

/** Signal a process tree and synchronously observe taskkill's status on Windows. */
export function killProcessTree(pid, {
	signal = DEFAULT_KILL_SIGNAL,
	fallback,
	platform = process.platform,
	kill = process.kill,
	run = (command, args, options) => spawnSync(command, args, options),
} = {}) {
	if (!validPid(pid)) return false;
	if (platform !== "win32") {
		try {
			kill(-pid, signal);
			return true;
		} catch {
			useFallback(fallback, signal);
			return false;
		}
	}
	try {
		const result = run(TASKKILL_COMMAND, [...TASKKILL_ARGS, String(pid)], { stdio: "ignore", windowsHide: true });
		if (result?.status === 0 && !result?.error) return true;
	} catch { /* fallback below */ }
	useFallback(fallback, signal);
	return false;
}

/** Start a Windows tree kill without waiting; on POSIX the group signal remains synchronous. */
export function killProcessTreeNoWait(pid, {
	signal = DEFAULT_KILL_SIGNAL,
	fallback,
	platform = process.platform,
	kill = process.kill,
	start = (command, args, options) => spawn(command, args, options),
} = {}) {
	if (!validPid(pid)) return;
	if (platform !== "win32") {
		try { kill(-pid, signal); } catch { useFallback(fallback, signal); }
		return;
	}
	let failed = false;
	const failOnce = () => {
		if (failed) return;
		failed = true;
		useFallback(fallback, signal);
	};
	try {
		const taskkill = start(TASKKILL_COMMAND, [...TASKKILL_ARGS, String(pid)], { stdio: "ignore", windowsHide: true });
		taskkill.once("error", failOnce);
		taskkill.once("close", (code) => { if (code !== 0) failOnce(); });
	} catch {
		failOnce();
	}
}
