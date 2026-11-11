#!/usr/bin/env node
/**
 * @module scripts/test-locked.mjs
 * @purpose Serialize full suites, retain whole-run records, and write a passing land's product report inside the same machine lock.
 * @inputs Filter arguments, land and record metadata, suite lock and command overrides, and an injectable clock and temp root.
 * @outputs The deciding suite exit code plus record problems and prefixed land report notes.
 * @effects disk (lock, record folders, suite records, product report), process (spawns git and suite commands, lists and signals the suite process tree).
 * @errors Suite failures remain nonzero; record or report write failures become notes without changing its verdict.
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { JOBS_FLAG, PACK_FLAG, SUITE_JOBS, SUITE_JOBS_ENV } from "../packages/nana-pack/lib/test-runner-config.mjs";
import { RECORD_FILE_ENV, RECORD_LINE_PREFIX, RECORD_SCHEMA } from "../packages/nana-pack/lib/suite-records-config.mjs";
import { gitCommonDir, readRunRecord, readSuiteRecords, storeSuiteRecord, suiteGitFacts, suiteRecordLines } from "../packages/nana-pack/lib/suite-records.mjs";
import {
	LAND_NOTE_PREFIX,
	LAND_TIP_ENV,
} from "../packages/nana-pack/lib/land-config.mjs";
import { killTree, signalTreeTargets } from "../packages/nana-pack/lib/process-tree.mjs";

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
let lockDir = DEFAULT_LOCK_DIR;

const note = (text) => console.log(`${LAND_NOTE_PREFIX} ${text}`);
const recordProblem = (text) => console.log(`${RECORD_LINE_PREFIX} ${text}`);

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
	const args = filters.length ? [...filters] : [jobsArg];
	if (isCompletePackRun(filters) && !filters.some(arg => arg.startsWith(JOBS_FLAG))) args.push(jobsArg);
	return { command: process.execPath, args: [env.npm_execpath, "test", "--", ...args] };
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

function headOf(cwd) {
	const result = spawnSync("git", ["rev-parse", "HEAD^{commit}"], { cwd, encoding: "utf8" });
	return result.status === 0 ? result.stdout.trim() : null;
}

/** Whether suite metadata identifies an unfiltered land of the named HEAD. */
export function isLandRun({ filters = [], env = process.env, head } = {}) {
	const landTip = env[LAND_TIP_ENV];
	return filters.length === 0 && typeof landTip === "string" && landTip.length > 0 && landTip === head;
}

async function writeLandReport({ filters, env, cwd, decidingCode }) {
	if (decidingCode !== 0) return;
	const head = headOf(cwd);
	if (!isLandRun({ filters, env, head })) return;
	try {
		const { generateReport, LAND_REPORT_SUBPATH } = await import("./product-report.mjs");
		const out = path.join(gitCommonDir(cwd), ...LAND_REPORT_SUBPATH.split("/"));
		const written = await generateReport({ root: cwd, out });
		note(`product report: wrote ${written} for ${head.slice(0, 8)}`);
	} catch (error) {
		const reason = String(error?.message ?? "unknown error").replace(/\r\n?|\n/g, "; ");
		note(`product report not written: ${reason}`);
	}
}

function finishSuiteRecord({ recordFile, runnerRecord, suiteCode, root, env, recordedAt }) {
	try {
		const source = runnerRecord ?? readRunRecord(recordFile);
		const facts = suiteGitFacts(root);
		const landTip = env[LAND_TIP_ENV] ?? null;
		const land = isLandRun({ env, head: facts.tip });
		const trigger = land ? "land" : "run";
		const timestamp = new Date(recordedAt).toISOString();
		const record = { ...source, ...facts, schema: RECORD_SCHEMA, trigger, exitCode: suiteCode, landTip, recordedAt: timestamp };
		const earlier = readSuiteRecords({ root });
		storeSuiteRecord(record, { root, now: () => new Date(timestamp) });
		const prefix = land ? `${LAND_NOTE_PREFIX} ` : "";
		for (const line of suiteRecordLines(record, { root, records: earlier, now: timestamp })) console.log(`${prefix}${line}`);
	} catch (error) {
		recordProblem(error?.message ?? "record could not be stored");
	} finally {
		try { fs.rmSync(recordFile, { force: true }); } catch {}
	}
}

/** Pack selection is complete unless a substring, shard or self-test narrows its proof. */
export function isCompletePackRun(args) {
	return args.some(arg => arg.startsWith(PACK_FLAG)) && args.every(arg => arg.startsWith("--"))
		&& !args.some(arg => arg.startsWith("--shard") || arg === "--self-test");
}

/** Run one locked suite invocation with the full-run machine lock and signal cleanup. */
export async function runLocked({
	filters = process.argv.slice(2),
	env = process.env,
	cwd = process.cwd(),
	tempRoot = os.tmpdir(),
	now = () => new Date().toISOString(),
} = {}) {
	child = null; ownsLock = false; stopping = false; signalExitCode = null; termination = null;
	lockDir = env.NANA_SUITE_LOCK_DIR || DEFAULT_LOCK_DIR;
	const handlers = new Map();
	for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
		const handler = () => {
			if (stopping) return;
			stopping = true;
			signalExitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 129;
			termination = terminateChild(signal).then(() => { releaseLock(); });
		};
		handlers.set(signal, handler); process.on(signal, handler);
	}
	const complete = filters.length === 0 || isCompletePackRun(filters);
	const recordFile = complete ? path.join(tempRoot, `nana-suite-record-${process.pid}-${randomUUID()}.json`) : null;
	const plainEnv = { ...env };
	if (recordFile) plainEnv[RECORD_FILE_ENV] = recordFile;
	const finishRecord = (suiteCode, runnerRecord) => {
		if (recordFile && !stopping) finishSuiteRecord({ recordFile, runnerRecord, suiteCode, root: cwd, env, recordedAt: now() });
	};
	try {
		if (complete) await acquireLock();
		const code = await runCommand(filters, plainEnv, cwd);
		if (stopping && termination) await termination;
		if (!stopping) finishRecord(code);
		if (!stopping) await writeLandReport({ filters, env, cwd, decidingCode: code });
		if (stopping && termination) await termination;
		return stopping ? (signalExitCode ?? 1) : code;
	} catch (error) {
		console.error(`[test-locked] ${error.message}`);
		return 1;
	} finally {
		if (termination) await termination;
		if (recordFile) { try { fs.rmSync(recordFile, { force: true }); } catch {} }
		releaseLock();
		for (const [signal, handler] of handlers) process.off(signal, handler);
	}
}

const invokedDirectly = process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) process.exitCode = await runLocked();
