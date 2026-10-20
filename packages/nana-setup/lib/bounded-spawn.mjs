/**
 * @module packages/nana-setup/lib/bounded-spawn.mjs
 * @purpose Run a synchronous child launch through a relay that can end the launched process tree at its deadline.
 * @inputs command, args and spawn options; bounded-spawn-child.mjs; process.env
 * @outputs boundedSpawnSync result shaped like child_process.spawnSync; relay settle, signal-grace and backstop limits
 * @effects process (synchronously starts the relay and sends its launch specification on stdin)
 * @errors launch, relay and timeout failures are returned in result.error with a code and never thrown
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// chosen 2026-10-20: allow closed child pipes one second to settle before the relay reports its timeout.
export const RELAY_SETTLE_MS = 1_000;
// chosen 2026-10-20: give pi's signal handlers one second to remove locks and close before forced tree cleanup.
export const RELAY_SIGNAL_GRACE_MS = 1_000;
// chosen 2026-10-20: give the relay five seconds beyond its own deadline to report or fail closed.
export const RELAY_BACKSTOP_MS = 5_000;

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

export function boundedSpawnSync(command, args, options = {}) {
	try {
		const timeout = Number(options.timeout);
		const outer = spawnSync(process.execPath, [relay], {
			input: JSON.stringify({
				command,
				args,
				options: {
					cwd: options.cwd,
					timeout: Number.isFinite(timeout) && timeout >= 0 ? timeout : undefined,
					windowsVerbatimArguments: options.windowsVerbatimArguments,
				},
			}),
			encoding: "utf8",
			env: options.env ?? process.env,
			...(Number.isFinite(timeout) && timeout >= 0 ? { timeout: timeout + RELAY_BACKSTOP_MS } : {}),
		});
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
	} catch (error) {
		return resultError(error?.code || "ERELAY", error?.message || "bounded spawn relay failed");
	}
}
