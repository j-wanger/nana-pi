/**
 * @module packages/nana-pack/lib/gh-runner.mjs
 * @purpose Run gh through one cross-platform command seam and classify its process results.
 * @inputs Timeout and output cap, cwd, argv, environment, command override, injected spawn and clock, abort signal.
 * @outputs Synchronous or asynchronous process runners and success or named failure results.
 * @effects process (spawns gh or the injected command), network (through gh).
 * @errors Missing commands, timeouts, spawn errors and nonzero exits become classified results.
 */
import { spawn as nodeSpawn, spawnSync } from "node:child_process";
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

export function ghAsync({ command = ["gh"], maxBuffer = CHILD_OUTPUT_MAX_BYTES, spawn = nodeSpawn, clock = globalThis } = {}) {
	return (cwd, args, { env = process.env, timeoutMs, signal } = {}) => new Promise((resolve) => {
		let child, timer, finished = false, bytes = 0;
		const stdout = [], stderr = [];
		const finish = (result, kill = false) => {
			if (finished) return;
			finished = true;
			if (timer !== undefined) clock.clearTimeout(timer);
			signal?.removeEventListener("abort", abort);
			if (kill) { try { child?.kill("SIGKILL"); } catch {} }
			child?.stdout?.destroy?.(); child?.stderr?.destroy?.();
			resolve({ status: null, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8"), nanaTimeoutMs: timeoutMs, ...result });
		};
		const abort = () => finish({ error: Object.assign(new Error("gh cancelled"), { code: "ABORT_ERR" }) }, true);
		if (signal?.aborted) { abort(); return; }
		if (!Number.isInteger(timeoutMs) || timeoutMs < 1) { finish({ error: new RangeError("gh timeout must be a positive whole number of milliseconds") }); return; }
		try {
			child = spawn(command[0], [...command.slice(1), ...args], { cwd, env: ghEnvironment(env), stdio: ["ignore", "pipe", "pipe"] });
			child.on("error", (error) => finish({ error }));
			child.on("close", (status, signal) => finish({ status, signal }));
			const collect = (target) => (data) => {
				const chunk = Buffer.from(data); bytes += chunk.length;
				if (bytes > maxBuffer) finish({ error: Object.assign(new Error("gh output exceeded cap"), { code: "ENOBUFS" }) }, true);
				else target.push(chunk);
			};
			child.stdout.on("data", collect(stdout)); child.stderr.on("data", collect(stderr));
			signal?.addEventListener("abort", abort, { once: true });
			timer = clock.setTimeout(() => finish({ error: Object.assign(new Error("gh timed out"), { code: "ETIMEDOUT" }) }, true), timeoutMs);
		} catch (error) { finish({ error }, true); }
	});
}

/** Share command parsing and environment policy with the synchronous runner. */
export function ghAsyncFromEnvironment(env, options = {}) {
	return ghFromEnvironment(env, { ...options, factory: ghAsync });
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
