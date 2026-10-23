/**
 * @module packages/nana-pack/lib/process-tree.mjs
 * @purpose Provide the shared waiting and no-wait process-tree kill policy.
 * @inputs a positive pid, signal, platform, optional fallback and injected kill/run/start seams
 * @outputs killProcessTree's boolean outcome, killProcessTreeNoWait, and sealed taskkill/default constants
 * @effects process (signals a process group or starts taskkill)
 * @errors never throws
 */
import { spawn, spawnSync } from "node:child_process";

// contract R-2657: Windows' taskkill.exe, found on PATH without a shell.
export const TASKKILL_COMMAND = "taskkill";
// contract R-1233 and R-1700: taskkill must walk and forcibly end the whole tree.
export const TASKKILL_ARGS = Object.freeze(["/T", "/F", "/PID"]);
// chosen 2026-10-22: four of the six consolidated callers use SIGKILL.
export const DEFAULT_KILL_SIGNAL = "SIGKILL";

const validPid = (pid) => Number.isSafeInteger(pid) && pid > 1;
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
