#!/usr/bin/env node
/**
 * @module packages/nana-setup/lib/bounded-spawn-child.mjs
 * @purpose Relay one bounded child launch and end its process tree at the deadline, on termination or when its parent dies.
 * @inputs one JSON launch specification on stdin; TASKKILL_ARGS; relay parent-poll, settle and signal-grace limits; process.env and process.platform
 * @outputs one JSON result line on stdout
 * @effects process (spawns a detached POSIX group or Windows child, kills its tree when required, then exits)
 * @errors launch and timeout failures are serialized as result.error; malformed specifications become coded relay errors
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { TASKKILL_ARGS } from "../../nana-pack/lib/mutation-runner-config.mjs";
import { RELAY_PARENT_POLL_MS, RELAY_SETTLE_MS, RELAY_SIGNAL_GRACE_MS } from "./bounded-spawn.mjs";

let child;
let finished = false;
let timedOut = false;
let stdout = "";
let stderr = "";
let launchError = null;
let settleTimer;
let deadlineTimer;
let signalGraceTimer;
let parentTimer;
let terminatingSignal = null;
let terminationDone = false;

function errorRecord(error) {
	if (!error) return undefined;
	return {
		code: typeof error.code === "string" && error.code ? error.code : "ERELAY",
		message: typeof error.message === "string" ? error.message : String(error),
	};
}

function relay(result, exitCode = 0) {
	if (finished) return;
	finished = true;
	clearTimeout(deadlineTimer);
	clearTimeout(settleTimer);
	clearTimeout(signalGraceTimer);
	clearInterval(parentTimer);
	const line = `${JSON.stringify(result)}\n`;
	let exited = false;
	const exit = () => {
		if (exited) return;
		exited = true;
		process.exit(exitCode);
	};
	process.stdout.on("error", exit);
	process.stdout.write(line, exit);
}

function killTree() {
	if (!child?.pid) return;
	let ended = false;
	if (process.platform === "win32") {
		try {
			const result = spawnSync("taskkill", [...TASKKILL_ARGS, String(child.pid)], { stdio: "ignore", windowsHide: true });
			ended = result.status === 0;
		} catch {}
	} else {
		try {
			process.kill(-child.pid, "SIGKILL");
			ended = true;
		} catch {}
	}
	if (!ended) {
		try { child.kill("SIGKILL"); } catch {}
	}
}

function timeoutResult() {
	return {
		status: null,
		signal: "SIGKILL",
		stdout,
		stderr,
		error: { code: "ETIMEDOUT", message: "spawnSync ETIMEDOUT" },
	};
}

function finishTermination(signal) {
	if (terminationDone) return;
	terminationDone = true;
	clearTimeout(deadlineTimer);
	clearTimeout(settleTimer);
	clearTimeout(signalGraceTimer);
	clearInterval(parentTimer);
	killTree();
	const exits = { SIGHUP: 129, SIGINT: 130, SIGTERM: 143 };
	process.exit(exits[signal]);
}

function passSignal(signal) {
	if (process.platform === "win32" || !child?.pid) return;
	let sent = false;
	try {
		process.kill(-child.pid, signal);
		sent = true;
	} catch {}
	if (!sent) {
		try { child.kill(signal); } catch {}
	}
}

function terminate(signal) {
	if (terminatingSignal) {
		finishTermination(signal);
		return;
	}
	terminatingSignal = signal;
	clearTimeout(deadlineTimer);
	if (!child?.pid) {
		finishTermination(signal);
		return;
	}
	passSignal(signal);
	signalGraceTimer = setTimeout(() => finishTermination(signal), RELAY_SIGNAL_GRACE_MS);
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => terminate(signal));

let spec;
try {
	spec = JSON.parse(fs.readFileSync(0, "utf8"));
	if (!spec || typeof spec.command !== "string" || !Array.isArray(spec.args)) throw Object.assign(new Error("invalid bounded spawn specification"), { code: "EINVAL" });
} catch (error) {
	relay({ status: null, signal: null, stdout: "", stderr: "", error: errorRecord(error) }, 1);
}

if (!finished && process.platform !== "win32" && Number.isInteger(spec.parentPid)) {
	parentTimer = setInterval(() => {
		if (process.ppid === spec.parentPid) return;
		clearInterval(parentTimer);
		if (!terminatingSignal) terminate("SIGINT");
	}, RELAY_PARENT_POLL_MS);
	parentTimer.unref();
}

if (!finished) {
	try {
		child = spawn(spec.command, spec.args, {
			cwd: spec.options?.cwd,
			detached: process.platform !== "win32",
			env: process.env,
			stdio: ["ignore", "pipe", "pipe"],
			windowsVerbatimArguments: spec.options?.windowsVerbatimArguments,
		});
		child.stdout.setEncoding("utf8");
		child.stderr.setEncoding("utf8");
		child.stdout.on("data", (chunk) => { stdout += chunk; });
		child.stderr.on("data", (chunk) => { stderr += chunk; });
		child.on("error", (error) => { launchError = error; });
		child.on("close", (status, signal) => {
			if (terminatingSignal) finishTermination(terminatingSignal);
			else if (timedOut) relay(timeoutResult());
			else relay({ status: launchError ? null : status, signal, stdout, stderr, ...(launchError ? { error: errorRecord(launchError) } : {}) });
		});
		const timeout = Number(spec.options?.timeout);
		if (Number.isFinite(timeout) && timeout >= 0) {
			deadlineTimer = setTimeout(() => {
				timedOut = true;
				killTree();
				settleTimer = setTimeout(() => relay(timeoutResult()), RELAY_SETTLE_MS);
			}, timeout);
		}
	} catch (error) {
		relay({ status: null, signal: null, stdout, stderr, error: errorRecord(error) }, 1);
	}
}
