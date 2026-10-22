#!/usr/bin/env node
/**
 * @module scripts/test-locked.mjs
 * @purpose Serialize full suites, retain whole-run records, and measure eligible land or hand runs inside the same machine lock.
 * @inputs Filter arguments, land and record metadata, suite lock and command overrides, and injectable platform and write boundaries.
 * @outputs The deciding suite exit code plus record problems and prefixed land notes for skipped measures, reruns, and write failures.
 * @effects disk (lock, record and coverage folders, suite records, runtime data), process (spawns git and suite commands, lists and signals the suite process tree).
 * @errors Suite failures remain nonzero; record or runtime write failures after a passing suite become notes without changing its verdict.
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { JOBS_FLAG, SUITE_JOBS, SUITE_JOBS_ENV } from "../packages/nana-pack/lib/test-runner-config.mjs";
import { COVERAGE_ENV, COVERAGE_PREFIX } from "../packages/nana-pack/lib/runtime-map-config.mjs";
import { RECORD_FILE_ENV, RECORD_LINE_PREFIX, RECORD_SCHEMA } from "../packages/nana-pack/lib/suite-records-config.mjs";
import { storeSuiteRecord, suiteGitFacts } from "../packages/nana-pack/lib/suite-records.mjs";
import {
	COVERAGE_FAILURE_POLICY,
	COVERAGE_OWNER_FILE,
	DIRTY_COUNT_ENV,
	HAND_MEASURE_ENV,
	LAND_NOTE_PREFIX,
	LAND_TIP_ENV,
	UNMEASURED_PLATFORMS,
} from "../packages/nana-pack/lib/land-config.mjs";
import { buildRuntimeData, killTree, signalTreeTargets, writeRuntimeData } from "./runtime-measure.mjs";

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
const recordProblem = (text) => console.log(`${RECORD_LINE_PREFIX} ${text}`);
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

function signalChild(signal, target = child, remembered = null) {
	if (!target) return { groups: [], pids: [] };
	try {
		if (process.platform === "win32") { target.kill(signal); return { groups: [], pids: [] }; }
		if (signal !== "SIGKILL") return killTree(target.pid, { signal });
		signalTreeTargets(remembered, { signal });
		// runCommand starts a new process group, so this restores the original group-wide kill and
		// reaches a same-group process that was already orphaned before the first tree snapshot.
		try { process.kill(-target.pid, signal); } catch (error) { if (!["ESRCH", "EPERM"].includes(error?.code)) throw error; }
		return killTree(target.pid, { signal });
	} catch (error) {
		if (!["ESRCH", "EPERM"].includes(error?.code)) throw error;
		return { groups: [], pids: [] };
	}
}

function terminateChild(signal) {
	if (!child) return Promise.resolve();
	const active = child;
	return new Promise((resolve) => {
		let childExited = false; let escalationFinished = false;
		const finish = () => { if (childExited && escalationFinished) resolve(); };
		active.once("exit", () => { childExited = true; finish(); });
		const remembered = signalChild(signal, active);
		setTimeout(() => { signalChild("SIGKILL", active, remembered); escalationFinished = true; finish(); }, KILL_WAIT_MS);
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

function readRunRecord(recordFile) {
	let text;
	try { text = fs.readFileSync(recordFile, "utf8"); }
	catch (error) { throw new Error(`run record is missing or unreadable: ${error?.message ?? "unknown error"}`); }
	let record;
	try { record = JSON.parse(text); }
	catch (error) { throw new Error(`run record is unreadable: ${error?.message ?? "invalid JSON"}`); }
	if (record?.schema !== RECORD_SCHEMA || !Array.isArray(record.files)) throw new Error("run record is unreadable: unsupported schema or files");
	return record;
}

function finishSuiteRecord({ recordFile, runnerRecord, suiteCode, root, env, recordedAt }) {
	try {
		const source = runnerRecord ?? readRunRecord(recordFile);
		const facts = suiteGitFacts(root);
		const landTip = env[LAND_TIP_ENV] ?? null;
		const trigger = env[HAND_MEASURE_ENV] !== undefined ? "measure" : landTip === facts.tip ? "land" : "run";
		const record = { ...source, ...facts, schema: RECORD_SCHEMA, trigger, exitCode: suiteCode, landTip };
		storeSuiteRecord(record, { root, now: () => new Date(recordedAt) });
	} catch (error) {
		recordProblem(error?.message ?? "record could not be stored");
	} finally {
		try { fs.rmSync(recordFile, { force: true }); } catch {}
	}
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
	const recordFile = filters.length === 0 ? path.join(tempRoot, `nana-suite-record-${process.pid}-${randomUUID()}.json`) : null;
	const plainEnv = { ...env };
	delete plainEnv[COVERAGE_ENV];
	if (recordFile) plainEnv[RECORD_FILE_ENV] = recordFile;
	const finishRecord = (suiteCode, runnerRecord) => {
		if (recordFile && !stopping) finishSuiteRecord({ recordFile, runnerRecord, suiteCode, root: cwd, env, recordedAt: now() });
	};
	try {
		if (filters.length === 0) await acquireLock();
		const tip = env[LAND_TIP_ENV];
		if (tip && env[HAND_MEASURE_ENV] === undefined && UNMEASURED_PLATFORMS.includes(platform)) {
			note("runtime map on Windows was not measured");
			const code = await runCommand(filters, plainEnv, cwd);
			if (stopping && termination) await termination;
			if (!stopping) finishRecord(code);
			return stopping ? (signalExitCode ?? 1) : code;
		}
		const head = tip ? headOf(cwd) : null;
		if (filters.length > 0 || !tip || tip !== head) {
			if (tip) note(`runtime map was not measured (${filters.length ? "filtered suite" : "land tip does not name HEAD"})`);
			const code = await runCommand(filters, plainEnv, cwd);
			if (stopping && termination) await termination;
			if (!stopping) finishRecord(code);
			return stopping ? (signalExitCode ?? 1) : code;
		}

		sweepDeadCoverage(tempRoot);
		fs.mkdirSync(tempRoot, { recursive: true });
		activeCoverageDir = fs.mkdtempSync(path.join(tempRoot, COVERAGE_PREFIX));
		fs.writeFileSync(path.join(activeCoverageDir, COVERAGE_OWNER_FILE), `${process.pid}\n`);
		const coverageEnv = { ...plainEnv, [COVERAGE_ENV]: activeCoverageDir };
		const coverageCode = await runCommand([], coverageEnv, cwd);
		if (stopping) {
			if (termination) await termination;
			return signalExitCode ?? 1;
		}
		let coverageRecord = null;
		let coverageRecordError = null;
		try { coverageRecord = readRunRecord(recordFile); }
		catch (error) { coverageRecordError = error; }
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
			if (!failed.length || built.failures !== failed.length) {
				if (coverageRecordError) recordProblem(coverageRecordError.message);
				else finishRecord(coverageCode, coverageRecord);
				return coverageCode;
			}
			const plainFiles = [];
			let finalCode = 0;
			for (const file of failed) {
				note(`rerunning without coverage: ${file}`);
				const code = await runCommand([file], plainEnv, cwd);
				if (code !== 0 && finalCode === 0) finalCode = code;
				try { plainFiles.push(...readRunRecord(recordFile).files.map((entry) => ({ ...entry, coverage: false }))); }
				catch (error) { coverageRecordError ??= error; }
			}
			if (coverageRecordError) recordProblem(coverageRecordError.message);
			else finishRecord(finalCode, { ...coverageRecord, files: [
				...coverageRecord.files.map((entry) => ({ ...entry, coverage: true })),
				...plainFiles,
			] });
			return finalCode;
		}
		cleanupCoverage();
		if (writeProblem) note(writeProblem);
		if (coverageRecordError) recordProblem(coverageRecordError.message);
		else finishRecord(coverageCode, coverageRecord);
		return coverageCode;
	} catch (error) {
		console.error(`[test-locked] ${error.message}`);
		return 1;
	} finally {
		if (termination) await termination;
		if (recordFile) { try { fs.rmSync(recordFile, { force: true }); } catch {} }
		cleanupCoverage(); releaseLock();
		for (const [signal, handler] of handlers) process.off(signal, handler);
	}
}

const invokedDirectly = process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) process.exitCode = await runLocked();
