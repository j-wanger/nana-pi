/**
 * @module packages/nana-pack/tests/slow-sampler.mjs
 * @purpose Build and verify a caller-scoped slow CPU-sampler shim for watchdog tests.
 * @inputs A caller-supplied shim folder, environment and spawn limit.
 * @outputs Shared sampler tunables, the written shim paths, sampler resolution and first-on-PATH comparison.
 * @effects disk (writes the sampler body and platform shim), process (resolves the sampler command).
 * @errors File and child-process errors propagate; an unresolved sampler returns an empty path.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export const WORKER_POLL_SECS = 60; // chosen 2026-10-23 (R-2670): twice the child limit, so the fake exits before a CPU sample.
export const FAKE_PI_HOLD_MS = 1_000; // chosen 2026-10-23: ten times the old 0.1-second poll, forcing old code to sample.
export const SLOW_SAMPLER_MS = 60_000; // chosen 2026-10-23: twice the child limit, modeling a sampler that outlives it.

export function writeSlowSampler(dir) {
	fs.mkdirSync(dir, { recursive: true });
	const samplerBody = path.join(dir, "slow-sampler.cjs");
	fs.writeFileSync(samplerBody, 'const fs = require("node:fs"); fs.writeFileSync(process.env.SAMPLER_MARKER, String(process.pid)); setTimeout(() => {}, Number(process.env.SLOW_SAMPLER_MS));\n');
	const samplerName = process.platform === "win32" ? "powershell" : "ps";
	const samplerShim = path.join(dir, process.platform === "win32" ? "powershell.cmd" : "ps");
	if (process.platform === "win32") fs.writeFileSync(samplerShim, `@echo off\r\n"${process.execPath}" "${samplerBody}" %*\r\nexit /b %errorlevel%\r\n`);
	else {
		fs.writeFileSync(samplerShim, `#!/bin/sh\nexec "${process.execPath}" "${samplerBody}" "$@"\n`);
		fs.chmodSync(samplerShim, 0o755);
	}
	return { samplerBody, samplerName, samplerShim };
}

export function resolveSampler(env, spawnLimitMs) {
	return process.platform === "win32"
		? spawnSync("where", ["powershell"], { env, encoding: "utf8", timeout: spawnLimitMs }).stdout?.trim().split(/\r?\n/)[0] ?? ""
		: spawnSync("/bin/sh", ["-c", "command -v ps"], { env, encoding: "utf8", timeout: spawnLimitMs }).stdout?.trim() ?? "";
}

export function samplerIsFirst(resolvedSampler, samplerShim) {
	if (!resolvedSampler) return false;
	const realpath = process.platform === "win32" ? fs.realpathSync.native : fs.realpathSync;
	try { return realpath(resolvedSampler) === realpath(samplerShim); } catch { return false; }
}
