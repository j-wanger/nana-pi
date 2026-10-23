/**
 * @module packages/nana-pack/lib/process-tree.mjs
 * @purpose Provide the one shared waiting and no-wait process-tree kill policy and detect new copies outside declared exceptions.
 * @inputs a positive pid, signal, platform, optional fallback and injected kill/run/start seams; repository root and code-map.config.json for scanning
 * @outputs killProcessTree's boolean outcome, killProcessTreeNoWait, scanTreeKillCopies findings, and sealed taskkill/default/exception constants
 * @effects process (signals a process group or starts taskkill)
 * @errors never throws
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// contract R-2657: Windows' taskkill.exe, found on PATH without a shell.
export const TASKKILL_COMMAND = "taskkill";
// contract R-1233 and R-1700: taskkill must walk and forcibly end the whole tree.
export const TASKKILL_ARGS = Object.freeze(["/T", "/F", "/PID"]);
// chosen 2026-10-22: four of the six consolidated callers use SIGKILL.
export const DEFAULT_KILL_SIGNAL = "SIGKILL";
// chosen 2026-10-22: only the shared implementation, the different snapshot walk, its composer,
// and the frozen desk implementation may contain the scan's process-tree kill spellings.
export const TREE_KILL_EXCEPTIONS = Object.freeze({
	"packages/nana-pack/lib/process-tree.mjs": "the one shared process-group and taskkill implementation",
	"scripts/runtime-measure.mjs": "the runtime measurer walks a process snapshot before choosing safe group or pid targets",
	"scripts/test-locked.mjs": "the locked runner composes runtime-measure targets with its live child handle",
	"apps/desk/server.mjs": "the frozen desk keeps its existing child lifecycle implementation",
});

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

const under = (file, root) => file === root || file.startsWith(`${root}/`);
const ignoredBy = (file, pattern) => {
	if (pattern.startsWith("**/")) {
		const tail = pattern.slice(3);
		if (tail.startsWith("*.")) return file.endsWith(tail.slice(1));
		return file.split("/").includes(tail);
	}
	return under(file, pattern);
};

/** Return every mapped production line that spells a process-group kill or taskkill outside the sealed exceptions. */
export function scanTreeKillCopies(repoRoot, {
	readFile = fs.readFileSync,
	run = (command, args, options) => spawnSync(command, args, options),
} = {}) {
	try {
		const config = JSON.parse(readFile(path.join(repoRoot, "code-map.config.json"), "utf8"));
		const roots = (config.roots ?? []).filter((root) => typeof root === "string");
		const extensions = config.moduleExtensions ?? [".mjs", ".ts", ".js"];
		const testRoots = (config.roots ?? []).filter((root) => typeof root === "object" && root?.path).map((root) => root.path);
		const ignored = config.ignore ?? [];
		const findings = [];
		for (const file of Object.keys(TREE_KILL_EXCEPTIONS)) {
			if (!fs.existsSync(path.join(repoRoot, file))) findings.push({ path: file, line: 0, text: "declared exception is missing" });
		}
		const listed = run("git", ["ls-files"], { cwd: repoRoot, encoding: "utf8" });
		if (listed?.status !== 0 || listed?.error) return [...findings, { path: "git ls-files", line: 0, text: listed?.error?.message ?? listed?.stderr ?? "failed" }];
		const files = listed.stdout.split(/\r?\n/).filter(Boolean).filter((file) =>
			extensions.some((extension) => file.endsWith(extension))
			&& roots.some((root) => under(file, root))
			&& !testRoots.some((root) => under(file, root))
			&& !ignored.some((pattern) => ignoredBy(file, pattern)));
		for (const file of files) {
			if (Object.hasOwn(TREE_KILL_EXCEPTIONS, file)) continue;
			let text;
			try { text = readFile(path.join(repoRoot, file), "utf8"); } catch { continue; }
			for (const [index, line] of text.split(/\r?\n/).entries()) {
				const start = line.trimStart();
				if (start.startsWith("//") || start.startsWith("/*") || start.startsWith("*")) continue;
				if (/["'`]taskkill(?:\.exe)?\b/i.test(line) || /\bkill\(\s*-/.test(line)) findings.push({ path: file, line: index + 1, text: line.trimEnd() });
			}
		}
		return findings;
	} catch (error) {
		return [{ path: "code-map.config.json", line: 0, text: error?.message ?? String(error) }];
	}
}
