/**
 * @module packages/nana-pack/lib/gh-runner.mjs
 * @purpose Run gh through one cross-platform command seam and classify its process results.
 * @inputs Explicit optional timeout and output cap, cwd, argv, environment and command override.
 * @outputs Synchronous process runners and success or named failure results.
 * @effects process (spawns gh or the injected command), network (through gh).
 * @errors Missing commands, timeouts, spawn errors and nonzero exits become classified results.
 */
import { spawnSync } from "node:child_process";
import { CHILD_OUTPUT_MAX_BYTES } from "./land-config.mjs";
import { GH_COMMAND_ENV } from "./suite-records-config.mjs";

export const ghEnvironment = (environment) => {
	const env = {};
	for (const [key, value] of Object.entries(environment)) if (key.toUpperCase() !== "GH_FORCE_TTY") env[key] = value;
	env.CLICOLOR_FORCE = "0";
	return env;
};

/** No default timeout: each consumer owns its time budget. */
export function ghDefault({ timeoutMs, maxBuffer = CHILD_OUTPUT_MAX_BYTES, command = ["gh"] } = {}) {
	return (cwd, args, { env = process.env, timeoutMs: callTimeoutMs = timeoutMs } = {}) => {
		if (callTimeoutMs !== undefined && (!Number.isInteger(callTimeoutMs) || callTimeoutMs < 1)) {
			const error = Object.assign(new RangeError("gh timeout must be a positive whole number of milliseconds"), { code: "ERR_OUT_OF_RANGE" });
			return { status: null, signal: null, stdout: "", stderr: "", error, nanaTimeoutMs: callTimeoutMs };
		}
		try { return { ...spawnSync(command[0], [...command.slice(1), ...args], { cwd, env: ghEnvironment(env), stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", ...(callTimeoutMs === undefined ? {} : { timeout: callTimeoutMs }), maxBuffer }), nanaTimeoutMs: callTimeoutMs }; }
		catch (error) { return { status: null, signal: null, stdout: "", stderr: "", error, nanaTimeoutMs: callTimeoutMs }; }
	};
}

export function ghFromEnvironment(env, { factory = ghDefault, ...options } = {}) {
	const text = env[GH_COMMAND_ENV];
	if (!text) return factory(options);
	let command;
	try { command = JSON.parse(text); }
	catch (error) { return () => ({ error: new Error(`${GH_COMMAND_ENV} must be a JSON array of strings: ${error.message}`), status: null }); }
	if (!Array.isArray(command) || command.length === 0 || command.some((part) => typeof part !== "string")) return () => ({ error: new Error(`${GH_COMMAND_ENV} must be a JSON array of strings`), status: null });
	const run = factory({ ...options, command });
	return (cwd, args, { env: childEnv = env, ...callOptions } = {}) => run(cwd, args, { ...callOptions, env: childEnv });
}

export const firstLine = (value) => String(value ?? "").split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "";
export function ghResult(runGh, cwd, args, options = { env: process.env }) {
	let result;
	try { result = runGh(cwd, args, options); }
	catch (error) { result = { error }; }
	if (result?.error?.code === "ETIMEDOUT") return { ok: false, kind: "timeout", reason: `gh timed out after ${result.nanaTimeoutMs ?? options?.timeoutMs} ms` };
	if (result?.error) {
		const lead = result.error.code === "ENOENT" ? "cannot start gh" : "gh could not start";
		return { ok: false, kind: result.error.code === "ENOENT" ? "missing" : "spawn", reason: `${lead}: ${result.error.message ?? "unknown error"}` };
	}
	if (result?.status !== 0) {
		const detail = firstLine(result?.stderr) || firstLine(result?.stdout);
		return { ok: false, kind: "exit", reason: `gh failed (exit ${result?.status ?? result?.signal ?? "unknown"})${detail ? `: ${detail}` : ""}` };
	}
	return { ok: true, stdout: String(result.stdout ?? "") };
}
