#!/usr/bin/env node
/**
 * @module scripts/test-locked.mjs
 * @purpose Serialize full suites and measure eligible land or hand runs inside the same machine lock.
 * @inputs Filter arguments, land metadata, suite lock and command overrides, and injectable platform and write boundaries.
 * @outputs The deciding suite exit code plus prefixed land notes for skipped measures, reruns, and write failures.
 * @effects disk (lock and coverage folders, runtime data), process (spawns git and suite commands).
 * @errors Suite failures remain nonzero; runtime write failures after a passing suite become notes without changing its verdict.
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { JOBS_FLAG, SUITE_JOBS, SUITE_JOBS_ENV } from "../packages/nana-pack/lib/test-runner-config.mjs";
import { COVERAGE_ENV, COVERAGE_PREFIX } from "../packages/nana-pack/lib/runtime-map-config.mjs";
import {
	COVERAGE_FAILURE_POLICY,
	COVERAGE_OWNER_FILE,
	DIRTY_COUNT_ENV,
	HAND_MEASURE_ENV,
	LAND_NOTE_PREFIX,
	LAND_TIP_ENV,
	UNMEASURED_PLATFORMS,
} from "../packages/nana-pack/lib/land-config.mjs";
import { buildRuntimeData, writeRuntimeData } from "./runtime-measure.mjs";

// chosen: keep the machine-wide lock in the user's private home, independent of each worktree.
const DEFAULT_LOCK_DIR = path.join(os.homedir(), ".nana", "suite.lock");
const STALE_PIDLESS_MS = 60_000; // contract (design R-626): reclaim a pid-less lock only after 60 seconds
const RETRY_MS = 100; // chosen: short polling interval keeps contention responsive without busy-waiting
const KILL_WAIT_MS = 500; // chosen: retain the existing prompt escalation for an unresponsive suite

let child = null;
let ownsLock = false;
let stopping = false;
let signalExitCode = null;
let termination = null;
let activeCoverageDir = null;
let lockDir = DEFAULT_LOCK_DIR;

const note = (text) => console.log(`${LAND_NOTE_PREFIX} ${text}`);
const cleanupCoverage = () => {
	if (!activeCoverageDir) return;
	try { fs.rmSync(activeCoverageDir, { recursive: true, force: true }); } catch {}
	activeCoverageDir = null;
};

function releaseLock() {
	if (!ownsLock) return;
	ownsLock = false;
	try {
		const holder = Number(fs.readFileSync(path.join(lockDir, "pid"), "utf8").trim());
		if (holder === process.pid) fs.rmSync(lockDir, { recursive: true, force: true });
	} catch {}
}

function holderIsDead() {
	const pidFile = path.join(lockDir, "pid");
	const pidlessLockIsStale = () => {
		try { return Date.now() - fs.statSync(lockDir).mtimeMs > STALE_PIDLESS_MS; }
		catch { return true; }
	};
	try {
		const text = fs.readFileSync(pidFile, "utf8").trim();
		if (!/^\d+$/.test(text)) return pidlessLockIsStale();
		const pid = Number(text);
		if (!Number.isSafeInteger(pid) || pid < 1) return pidlessLockIsStale();
		try { process.kill(pid, 0); return false; }
		catch (error) { return error?.code !== "EPERM"; }
	} catch (error) {
		if (error?.code !== "ENOENT") return false;
		return pidlessLockIsStale();
	}
}

async function acquireLock() {
	fs.mkdirSync(path.dirname(lockDir), { recursive: true });
	for (;;) {
		if (stopping) throw new Error("suite run interrupted before lock acquisition");
		try { fs.mkdirSync(lockDir); }
		catch (error) {
			if (error?.code !== "EEXIST") throw error;
			if (holderIsDead()) {
				const quarantine = `${lockDir}.stale-${randomUUID()}`;
				try { fs.renameSync(lockDir, quarantine); fs.rmSync(quarantine, { recursive: true, force: true }); }
				catch (reclaimError) { if (!["ENOENT", "EEXIST", "ENOTEMPTY", "EPERM"].includes(reclaimError?.code)) throw reclaimError; }
				continue;
			}
			await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
			continue;
		}
		const token = fs.statSync(lockDir);
		try {
			fs.writeFileSync(path.join(lockDir, "pid"), `${process.pid}\n`, { flag: "wx" });
			ownsLock = true;
			return;
		} catch (error) {
			try { const current = fs.statSync(lockDir); if (current.dev === token.dev && current.ino === token.ino) fs.rmSync(lockDir, { recursive: true, force: true }); } catch {}
			throw error;
		}
	}
}

function commandSpec(filters, env) {
	const injected = env.NANA_SUITE_TEST_COMMAND ? JSON.parse(env.NANA_SUITE_TEST_COMMAND) : null;
	if (injected) {
		if (!Array.isArray(injected) || injected.length === 0 || injected.some((part) => typeof part !== "string")) throw new Error("NANA_SUITE_TEST_COMMAND must be a JSON array of strings");
		return { command: injected[0], args: [...injected.slice(1), ...filters] };
	}
	const envJobs = env[SUITE_JOBS_ENV];
	const jobsArg = `${JOBS_FLAG}${envJobs && envJobs.length > 0 ? envJobs : SUITE_JOBS}`;
	return { command: process.execPath, args: [env.npm_execpath, "test", "--", ...(filters.length ? filters : [jobsArg])] };
}

function runCommand(filters, env, cwd) {
	const spec = commandSpec(filters, env);
	return new Promise((resolve, reject) => {
		child = spawn(spec.command, spec.args, { cwd, env, stdio: "inherit", detached: process.platform !== "win32" });
		child.once("error", reject);
		child.once("exit", (code, signal) => { child = null; resolve(code ?? (signal ? 128 + (os.constants?.signals?.[signal] ?? 1) : 1)); });
	});
}

function signalChild(signal, target = child) {
	if (!target) return;
	try { if (process.platform !== "win32") process.kill(-target.pid, signal); else target.kill(signal); }
	catch (error) { if (error?.code !== "ESRCH") throw error; }
}

function terminateChild(signal) {
	if (!child) return Promise.resolve();
	const active = child;
	return new Promise((resolve) => {
		let childExited = false; let escalationFinished = false;
		const finish = () => { if (childExited && escalationFinished) resolve(); };
		active.once("exit", () => { childExited = true; finish(); });
		signalChild(signal, active);
		setTimeout(() => { signalChild("SIGKILL", active); escalationFinished = true; finish(); }, KILL_WAIT_MS);
	});
}

function ownerIsGone(ownerFile) {
	let pid;
	try { pid = Number(fs.readFileSync(ownerFile, "utf8").trim()); } catch { return false; }
	if (!Number.isSafeInteger(pid) || pid < 1) return true;
	try { process.kill(pid, 0); return false; }
	catch (error) { return error?.code !== "EPERM"; }
}

/** Remove coverage folders whose recorded owner process no longer exists. */
export function sweepDeadCoverage(tempRoot) {
	let entries;
	try { entries = fs.readdirSync(tempRoot, { withFileTypes: true }); } catch { return; }
	for (const entry of entries) {
		if (!entry.isDirectory() || !entry.name.startsWith(COVERAGE_PREFIX)) continue;
		const dir = path.join(tempRoot, entry.name);
		if (ownerIsGone(path.join(dir, COVERAGE_OWNER_FILE))) fs.rmSync(dir, { recursive: true, force: true });
	}
}

function headOf(cwd) {
	const result = spawnSync("git", ["rev-parse", "HEAD^{commit}"], { cwd, encoding: "utf8" });
	return result.status === 0 ? result.stdout.trim() : null;
}

/** Run one locked suite invocation; dependencies are injectable for platform and write-failure checks. */
export async function runLocked({
	filters = process.argv.slice(2),
	env = process.env,
	cwd = process.cwd(),
	platform = process.platform,
	tempRoot = os.tmpdir(),
	writeData = writeRuntimeData,
	now = () => new Date().toISOString(),
} = {}) {
	child = null; ownsLock = false; stopping = false; signalExitCode = null; termination = null; activeCoverageDir = null;
	lockDir = env.NANA_SUITE_LOCK_DIR || DEFAULT_LOCK_DIR;
	const handlers = new Map();
	for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
		const handler = () => {
			if (stopping) return;
			stopping = true;
			signalExitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 129;
			termination = terminateChild(signal).then(() => { cleanupCoverage(); releaseLock(); });
		};
		handlers.set(signal, handler); process.on(signal, handler);
	}
	const plainEnv = { ...env }; delete plainEnv[COVERAGE_ENV];
	try {
		if (filters.length === 0) await acquireLock();
		const tip = env[LAND_TIP_ENV];
		if (tip && env[HAND_MEASURE_ENV] === undefined && UNMEASURED_PLATFORMS.includes(platform)) {
			note("runtime map on Windows was not measured");
			const code = await runCommand(filters, plainEnv, cwd);
			if (stopping && termination) await termination;
			return stopping ? (signalExitCode ?? 1) : code;
		}
		const head = tip ? headOf(cwd) : null;
		if (filters.length > 0 || !tip || tip !== head) {
			if (tip) note(`runtime map was not measured (${filters.length ? "filtered suite" : "land tip does not name HEAD"})`);
			const code = await runCommand(filters, plainEnv, cwd);
			if (stopping && termination) await termination;
			return stopping ? (signalExitCode ?? 1) : code;
		}

		sweepDeadCoverage(tempRoot);
		fs.mkdirSync(tempRoot, { recursive: true });
		activeCoverageDir = fs.mkdtempSync(path.join(tempRoot, COVERAGE_PREFIX));
		fs.writeFileSync(path.join(activeCoverageDir, COVERAGE_OWNER_FILE), `${process.pid}\n`);
		const coverageEnv = { ...env, [COVERAGE_ENV]: activeCoverageDir };
		const coverageCode = await runCommand([], coverageEnv, cwd);
		if (stopping) {
			if (termination) await termination;
			return signalExitCode ?? 1;
		}
		const dirtyText = env[DIRTY_COUNT_ENV];
		const dirty = dirtyText !== undefined && /^\d+$/.test(dirtyText) ? Number(dirtyText) : undefined;
		const built = buildRuntimeData({ root: cwd, coverageDir: activeCoverageDir, tip, measuredAt: now(), dirty });
		let writeProblem = null;
		if (built.ok) {
			try { writeData(built.data, { root: cwd, env }); }
			catch (error) { writeProblem = `runtime map write failed: ${error?.message ?? "unknown error"}`; }
		} else writeProblem = `runtime map not written: ${built.reason}`;

		if (coverageCode !== 0 && built.ok && COVERAGE_FAILURE_POLICY === "rerun-failed") {
			const failed = Object.entries(built.data.tests).filter(([, value]) => value.label === "FAIL").map(([file]) => file).sort();
			cleanupCoverage();
			if (writeProblem) note(writeProblem);
			if (!failed.length || built.failures !== failed.length) return coverageCode;
			for (const file of failed) note(`rerunning without coverage: ${file}`);
			return await runCommand(failed, plainEnv, cwd);
		}
		cleanupCoverage();
		if (writeProblem) note(writeProblem);
		return coverageCode;
	} catch (error) {
		console.error(`[test-locked] ${error.message}`);
		return 1;
	} finally {
		if (termination) await termination;
		cleanupCoverage(); releaseLock();
		for (const [signal, handler] of handlers) process.off(signal, handler);
	}
}

const invokedDirectly = process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) process.exitCode = await runLocked();
