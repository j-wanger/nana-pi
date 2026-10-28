/**
 * @module packages/nana-pack/lib/gh-runner-async.mjs
 * @purpose Run gh asynchronously through the shared command seam with bounded output and cancellation.
 * @inputs Injected spawn and clock, cwd, argv, environment, timeout, output cap and abort signal.
 * @outputs Promise of a ghResult-compatible process result.
 * @effects process (spawns and kills gh), network (through gh).
 * @errors Process errors, timeout, cancellation and output overflow become result errors, never rejected promises.
 */
import { spawn as nodeSpawn } from "node:child_process";
import { ghEnvironment, ghFromEnvironment } from "./gh-runner.mjs";
import { CHILD_OUTPUT_MAX_BYTES } from "./land-config.mjs";

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

/** Import the synchronous runner's command parsing and environment policy, not a second copy. */
export function ghAsyncFromEnvironment(env, options = {}) {
	return ghFromEnvironment(env, { ...options, factory: ghAsync });
}
