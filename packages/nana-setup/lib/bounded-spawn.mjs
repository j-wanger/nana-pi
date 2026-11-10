/**
 * @module packages/nana-setup/lib/bounded-spawn.mjs
 * @purpose Run synchronous and asynchronous child launches through the shared bounded-spawn relay.
 * @inputs command, args and spawn options including an optional async abort signal; bounded-spawn-child.mjs; process.env, process.pid and process.platform
 * @outputs boundedSpawnSync result or boundedSpawn Promise shaped like child_process.spawnSync; relay parent-poll, result-size, settle, signal-grace and backstop limits
 * @effects process (starts the relay detached on POSIX, sends its launch specification on stdin and forwards async stops)
 * @errors launch, relay and timeout failures are returned in result.error with a code and never thrown
 */
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// chosen 2026-10-20: allow closed child pipes one second to settle before the relay reports its timeout.
export const RELAY_SETTLE_MS = 1_000;
// chosen 2026-10-20: give pi's signal handlers one second to remove locks and close before forced tree cleanup.
export const RELAY_SIGNAL_GRACE_MS = 1_000;
// chosen 2026-10-20: give the relay five seconds beyond its own deadline to report or fail closed.
export const RELAY_BACKSTOP_MS = 5_000;
// chosen 2026-10-20: pi gets its signal within 0.2 s of install's death.
export const RELAY_PARENT_POLL_MS = 200;
// chosen 2026-10-20: two streams at main's 1 MiB need 12 MiB after JSON's worst six-byte escape.
export const RELAY_RESULT_MAX_BYTES = 16 * 1024 * 1024;

const relay = fileURLToPath(new URL("bounded-spawn-child.mjs", import.meta.url));

function resultError(code, message, result = {}) {
	const error = new Error(message);
	error.code = code;
	return {
		status: result.status ?? null,
		signal: result.signal ?? null,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
		error,
	};
}

function launchSpec(command, args, options, timeout) {
	return JSON.stringify({
		command,
		args,
		parentPid: process.pid,
		options: {
			cwd: options.cwd,
			timeout: Number.isFinite(timeout) && timeout >= 0 ? timeout : undefined,
			windowsVerbatimArguments: options.windowsVerbatimArguments,
		},
	});
}

function relayResult(outer) {
	if (outer.error) return resultError(outer.error.code || "ERELAY", outer.error.message, outer);
	const line = String(outer.stdout ?? "").trimEnd().split(/\r?\n/).at(-1);
	if (!line) return resultError("ERELAY", `bounded spawn relay exited ${outer.status ?? "without a status"} without a result`, outer);
	let parsed;
	try {
		parsed = JSON.parse(line);
	} catch {
		return resultError("ERELAY", "bounded spawn relay returned a non-JSON result", outer);
	}
	if (!parsed || typeof parsed !== "object") return resultError("ERELAY", "bounded spawn relay returned an invalid result", outer);
	const result = {
		status: parsed.status ?? null,
		signal: parsed.signal ?? null,
		stdout: typeof parsed.stdout === "string" ? parsed.stdout : "",
		stderr: typeof parsed.stderr === "string" ? parsed.stderr : "",
	};
	if (parsed.error) {
		const code = typeof parsed.error.code === "string" && parsed.error.code ? parsed.error.code : "ERELAY";
		result.error = Object.assign(new Error(typeof parsed.error.message === "string" ? parsed.error.message : "bounded spawn failed"), { code });
	}
	return result;
}

export function boundedSpawnSync(command, args, options = {}) {
	try {
		const timeout = Number(options.timeout);
		const outer = spawnSync(process.execPath, [relay], {
			input: launchSpec(command, args, options, timeout),
			encoding: "utf8",
			env: options.env ?? process.env,
			maxBuffer: RELAY_RESULT_MAX_BYTES,
			...(process.platform === "win32" ? {} : { detached: true }),
			...(Number.isFinite(timeout) && timeout >= 0 ? { timeout: timeout + RELAY_BACKSTOP_MS } : {}),
		});
		return relayResult(outer);
	} catch (error) {
		return resultError(error?.code || "ERELAY", error?.message || "bounded spawn relay failed");
	}
}

/** Keep the caller responsive while the same relay owns the launched tree. */
export async function boundedSpawn(command, args, options = {}) {
	try {
		if (options.signal?.aborted) return { status: null, signal: options.signal.reason, stdout: "", stderr: "" };
		const timeout = Number(options.timeout);
		const input = launchSpec(command, args, options, timeout);
		return await new Promise((resolve) => {
			const child = spawn(process.execPath, [relay], {
				env: options.env ?? process.env,
				detached: process.platform !== "win32",
				stdio: ["pipe", "pipe", "pipe", "ipc"],
			});
			let stdout = "", stderr = "", bytes = 0, timer, finished = false, stopped;
			const stop = () => {
				// Windows cannot deliver catchable POSIX signals; IPC enters the relay's same termination handler.
				if (process.platform === "win32") {
					if (child.connected) child.send({ type: "bounded-spawn-stop", signal: "SIGTERM" }, () => {});
				} else {
					try { child.kill("SIGTERM"); } catch {}
				}
			};
			const finish = (result) => {
				if (finished) return;
				finished = true;
				clearTimeout(timer);
				options.signal?.removeEventListener("abort", abort);
				child.stdin.destroy();
				child.stdout.destroy();
				child.stderr.destroy();
				if (child.connected) child.disconnect();
				resolve(result);
			};
			const abort = () => { stopped = options.signal.reason; stop(); };
			const collect = (stream) => (chunk) => {
				bytes += Buffer.byteLength(chunk);
				if (bytes > RELAY_RESULT_MAX_BYTES) {
					stop();
					finish(resultError("ENOBUFS", "bounded spawn relay output exceeded its buffer"));
				} else if (stream === "stdout") stdout += chunk;
				else stderr += chunk;
			};
			child.stdout.setEncoding("utf8");
			child.stderr.setEncoding("utf8");
			child.stdout.on("data", collect("stdout"));
			child.stderr.on("data", collect("stderr"));
			child.stdin.on("error", () => {}); // A relay refusal can close stdin before the specification is written.
			child.once("error", (error) => finish(resultError(error.code || "ERELAY", error.message)));
			child.once("close", (status, signal) => finish(stopped !== undefined
				? { status: null, signal: stopped, stdout: "", stderr: "" }
				: relayResult({ status, signal, stdout, stderr })));
			options.signal?.addEventListener("abort", abort, { once: true });
			if (options.signal?.aborted) abort();
			if (Number.isFinite(timeout) && timeout >= 0) timer = setTimeout(() => {
				// The relay's own deadline and settle window have already elapsed.
				try { child.kill("SIGKILL"); } catch {}
				finish(resultError("ETIMEDOUT", "bounded spawn relay exceeded its backstop"));
			}, timeout + RELAY_BACKSTOP_MS);
			child.stdin.end(input);
		});
	} catch (error) {
		return resultError(error?.code || "ERELAY", error?.message || "bounded spawn relay failed");
	}
}
