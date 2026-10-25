#!/usr/bin/env node
/**
 * @module packages/nana-setup/tests/pi-launch-limits.test.mjs
 * @purpose Prove install, its dry run and doctor bound pi launches and end every process those launches start.
 * @inputs steps.mjs, doctor.mjs, paths.mjs, and fake pi process trees under OS temporary directories
 * @outputs PASS/FAIL/SKIP lines for twenty-four requirement checks and exit 1 when any check fails
 * @effects disk (temporary fixtures only), process (starts and signals fake pi process trees), process environment (temporarily changes PATH and PI_CODING_AGENT_DIR)
 * @errors a failed or over-time check prints FAIL and makes the file exit nonzero
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { diagnose } from "../lib/doctor.mjs";
import { resolveLayout, repoRoot } from "../lib/paths.mjs";
import { installExitCode, PI_LAUNCH_LIMITS_MS, stepPiRegister } from "../lib/steps.mjs";
import * as boundedSpawn from "../lib/bounded-spawn.mjs";
import { PI_BIN_NAME, PI_PACKAGE } from "../../nana-pack/bin/worker-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const { RELAY_BACKSTOP_MS, RELAY_PARENT_POLL_MS, RELAY_SETTLE_MS, RELAY_SIGNAL_GRACE_MS } = boundedSpawn;
const LIMIT_MS = 3_000;
// chosen 2026-10-25 (R-2894): covers the observed late fixture starts without entering the self-exit window.
const START_ALLOWANCE_MS = 6_000;
// chosen 2026-10-25 (R-2891, R-2894): keeps the judge ahead of a fixture's own exit timer.
const SELF_EXIT_MARGIN_MS = 1_000;
const HANG_MS = 12_000;
// contract: R-2132 (main's spawnSync default per stream)
const MAIN_SPAWN_STREAM_BYTES = 1024 * 1024;
const SIGNAL_CASE_BOUND_MS = 9_000;
// Test-only margin for scheduler delay on shared CI after the relay's one-second settle window.
const RELAY_ELAPSED_MARGIN_MS = 1_000;
// Measured 2026-10-21: worst stop was 6,714 ms; 3.5 s covers the tail and stays 0.5 s under the relay backstop.
const HANG_STOP_MARGIN_MS = 3_500;
const RELAY_ELAPSED_BOUND_MS = LIMIT_MS + RELAY_SETTLE_MS + HANG_STOP_MARGIN_MS;
const PARENT_KILL_BOUND_MS = RELAY_PARENT_POLL_MS + RELAY_SIGNAL_GRACE_MS + RELAY_ELAPSED_MARGIN_MS;
const CLEANUP_DELAY_MS = 2 * RELAY_PARENT_POLL_MS;
const CASE_LIMIT_MS = SIGNAL_CASE_BOUND_MS + RELAY_BACKSTOP_MS + RELAY_SETTLE_MS;
const PID_POLL_MS = 2_000;
const BYSTANDER_ANSWER_LIMIT_MS = 2_000;
const LATE_CHILD_MS = (PID_POLL_MS + START_ALLOWANCE_MS) / 2;
const limits = Object.freeze({ version: LIMIT_MS, install: LIMIT_MS });
const expectedPack = path.join(repoRoot, "packages", "nana-pack");
const cases = [];
let fails = 0;

function check(title, run) {
	cases.push({ title, run });
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function sleepSync(ms) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function probeProcess(pid, kill = process.kill) {
	try { kill(pid, 0); return "alive"; }
	catch (error) { return error?.code === "ESRCH" ? "gone" : error?.code ?? "unknown error"; }
}

function processAlive(pid) {
	return probeProcess(pid) !== "gone";
}

function readPidRecords(file) {
	if (!fs.existsSync(file)) return [];
	return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function readPids(file) {
	return [...new Set(readPidRecords(file).flatMap(({ pid, ppid }) => [pid, ppid]).filter((pid) => Number.isInteger(pid) && pid > 0))];
}

function judgeRun(records, { kill = process.kill } = {}) {
	const judgeStartedAt = Date.now();
	const valid = records.map((record) => ({
		record,
		problem: !Number.isInteger(record?.pid) || record.pid <= 0 || !Number.isInteger(record?.ppid) || record.ppid <= 0 || !Number.isFinite(record?.at)
			? `invalid record ${JSON.stringify(record)}` : null,
	}));
	const starts = valid.filter(({ problem }) => !problem).map(({ record }) => record.at);
	const deadline = starts.length ? Math.min(...starts) + HANG_MS - SELF_EXIT_MARGIN_MS : Date.now();
	const waitEnd = Math.min(Date.now() + PID_POLL_MS, deadline);
	const seen = valid.map(({ record, problem }) => ({ record, problem, ended: false, first: null, last: null, firstAt: null }));
	let judgedTooLate = false;
	for (;;) {
		const now = Date.now();
		if (now >= deadline) { judgedTooLate = !seen.some((item) => item.first !== null); break; }
		if (now >= waitEnd) break;
		for (const item of seen) {
			if (item.problem || item.ended) continue;
			const result = probeProcess(item.record.pid, kill);
			item.first ??= result;
			item.firstAt ??= now;
			item.last = result;
			if (result === "gone") item.ended = true;
		}
		if (seen.every((item) => item.ended || item.problem)) break;
		if (Date.now() >= deadline) { judgedTooLate = !seen.some((item) => item.first !== null); break; }
		if (Date.now() >= waitEnd) break;
		sleepSync(Math.min(25, Math.max(1, waitEnd - Date.now())));
	}
	const invalid = seen.find((item) => item.problem)?.problem;
	const reason = invalid ?? (judgedTooLate ? "judged too late" : seen.find((item) => !item.ended)?.last ?? "stopped");
	const ended = !judgedTooLate && seen.length > 0 && seen.every((item) => item.ended && !item.problem);
	const distinct = new Set(valid.flatMap(({ record }) => [record?.pid, record?.ppid]).filter((pid) => Number.isInteger(pid) && pid > 0));
	return { started: distinct.size >= 3, ended, reason, judgedAt: Date.now(), waitMs: Date.now() - judgeStartedAt, details: seen.map(({ record, problem, first, last }) => ({ pid: record?.pid, args: record?.args, atOffset: record?.at - (starts.length ? Math.min(...starts) : judgeStartedAt), first: problem ?? first, last: problem ?? last })) };
}

async function waitFor(predicate, limit = PID_POLL_MS) {
	const end = Date.now() + limit;
	while (Date.now() < end) {
		const value = predicate();
		if (value) return value;
		await sleep(25);
	}
	return predicate();
}

function makeFixture(target, { registerKnowledge = false, npm = false } = {}) {
	const home = tmpDir(path.join(os.tmpdir(), "nana-pi-launch-limit-"));
	const bin = path.join(home, "bin");
	const pids = path.join(home, "pids.jsonl");
	fs.mkdirSync(bin);
	const hang = path.join(bin, "hang.cjs");
	const hangBody = `const fs = require("node:fs");\nconst { spawn } = require("node:child_process");\nfs.appendFileSync(process.env.PIDS_FILE, JSON.stringify({ pid: process.pid, ppid: process.ppid, args: process.argv.slice(2), agentDir: process.env.PI_CODING_AGENT_DIR ?? null, at: Date.now() }) + "\\n");\nif (process.env.IGNORE_SIGINT) process.on("SIGINT", () => {});\nif (process.argv[2] === "child") { setTimeout(() => process.exit(0), Number(process.env.HANG_MS)); return; }\nconst args = process.argv.slice(2);\nconst target = process.env.HANG_TARGET;\nif (args[0] === "--version" && target !== "version") { process.stdout.write("1.0.2\\n"); process.exit(0); }\nif (args[0] === "install" && target !== "install") process.exit(0);\nconst delay = Number(process.env.CHILD_DELAY_MS);\nsetTimeout(() => spawn(process.execPath, [__filename, "child"], { stdio: "inherit", env: process.env }), Number.isFinite(delay) && delay > 0 ? delay : 0);\nsetTimeout(() => process.exit(0), Number(process.env.HANG_MS));\n`;
	fs.writeFileSync(hang, hangBody);
	if (process.platform === "win32") {
		if (npm) {
			const packageDir = path.join(bin, "node_modules", ...PI_PACKAGE.split("/"));
			fs.mkdirSync(packageDir, { recursive: true });
			fs.writeFileSync(path.join(packageDir, "package.json"), JSON.stringify({ name: PI_PACKAGE, bin: { [PI_BIN_NAME]: "cli.js" } }));
			fs.writeFileSync(path.join(packageDir, "cli.js"), hangBody);
			const packagePart = PI_PACKAGE.split("/").join("\\");
			fs.writeFileSync(path.join(bin, "pi.cmd"), `@"${process.execPath}" "%~dp0node_modules\\${packagePart}\\cli.js" %*\r\n`);
		} else {
			fs.writeFileSync(path.join(bin, "pi.cmd"), `@"${process.execPath}" "%~dp0hang.cjs" %*\r\n`);
		}
	} else {
		const pi = path.join(bin, "pi");
		fs.writeFileSync(pi, `#!/bin/sh\n"${process.execPath}" "${hang}" "$@"\nexit $?\n`);
		fs.chmodSync(pi, 0o755);
	}
	const layout = { ...resolveLayout({ home }), isRealHome: true };
	fs.mkdirSync(layout.piHome, { recursive: true });
	if (registerKnowledge) {
		const knowledge = path.join(repoRoot, "packages", "nana-knowledge");
		fs.writeFileSync(layout.piSettings, JSON.stringify({ packages: [path.relative(layout.piHome, knowledge)] }));
	}
	return {
		home,
		bin,
		pids,
		layout,
		env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`, PIDS_FILE: pids, HANG_TARGET: target, HANG_MS: String(HANG_MS) },
	};
}

function makeSignalCleanupFixture() {
	const fixture = makeFixture("none", { registerKnowledge: true });
	const lock = path.join(fixture.home, "pi-install.lock");
	const ready = path.join(fixture.home, "pi-install.ready");
	const pi = path.join(fixture.bin, process.platform === "win32" ? "pi.cmd" : "pi");
	const cleanup = path.join(fixture.bin, "signal-cleanup.cjs");
	fs.writeFileSync(
		cleanup,
		`const fs = require("node:fs");\nconst { spawn } = require("node:child_process");\nconst args = process.argv.slice(2);\nif (args[0] === "--version") { process.stdout.write("1.0.2\\n"); process.exit(0); }\nfs.mkdirSync(process.env.LOCK_DIR);\nfs.appendFileSync(process.env.PIDS_FILE, JSON.stringify({ pid: process.pid, ppid: process.ppid }) + "\\n");\nspawn(process.execPath, ["-e", "require('node:fs').appendFileSync(process.env.PIDS_FILE, JSON.stringify({ pid: process.pid, ppid: process.ppid }) + '\\\\n'); setTimeout(() => {}, 60_000)"], { stdio: "ignore", env: process.env });\nprocess.on("SIGINT", () => { setTimeout(() => { fs.rmSync(process.env.LOCK_DIR, { recursive: true }); process.exit(0); }, Number(process.env.CLEANUP_DELAY_MS ?? 0)); });\nfs.writeFileSync(process.env.READY_FILE, "ready\\n");\nsetTimeout(() => {}, 60_000);\n`,
	);
	if (process.platform === "win32") {
		fs.writeFileSync(pi, `@"${process.execPath}" "%~dp0signal-cleanup.cjs" %*\r\n`);
	} else {
		fs.writeFileSync(pi, `#!/bin/sh\nexec "${process.execPath}" "${cleanup}" "$@"\n`);
		fs.chmodSync(pi, 0o755);
	}
	fixture.lock = lock;
	fixture.ready = ready;
	fixture.env.LOCK_DIR = lock;
	fixture.env.READY_FILE = ready;
	return fixture;
}

function makeLargeOutputFixture(exitCode) {
	const fixture = makeFixture("none", { registerKnowledge: true });
	const output = path.join(fixture.bin, "large-output.cjs");
	fs.writeFileSync(output, `const args = process.argv.slice(2);\nif (args[0] === "--version") { process.stdout.write("1.0.2\\n"); }\nelse {\n  const text = "\\u0001".repeat(Number(process.env.OUTPUT_BYTES));\n  process.stdout.write(text);\n  process.stderr.write(text);\n  process.stderr.write("\\nboom: last line\\n");\n  process.exitCode = Number(process.env.PI_EXIT_CODE);\n}\n`);
	const pi = path.join(fixture.bin, process.platform === "win32" ? "pi.cmd" : "pi");
	if (process.platform === "win32") fs.writeFileSync(pi, `@"${process.execPath}" "%~dp0large-output.cjs" %*\r\n`);
	else {
		fs.writeFileSync(pi, `#!/bin/sh\nexec "${process.execPath}" "${output}" "$@"\n`);
		fs.chmodSync(pi, 0o755);
	}
	fixture.env.OUTPUT_BYTES = String(MAIN_SPAWN_STREAM_BYTES - 64);
	fixture.env.PI_EXIT_CODE = String(exitCode);
	return fixture;
}

function makeInstallWrapper(fixture) {
	const wrapper = path.join(fixture.home, "wrapper.mjs");
	const stepsUrl = pathToFileURL(path.join(repoRoot, "packages", "nana-setup", "lib", "steps.mjs")).href;
	const pathsUrl = pathToFileURL(path.join(repoRoot, "packages", "nana-setup", "lib", "paths.mjs")).href;
	fs.writeFileSync(wrapper, `import { stepPiRegister } from ${JSON.stringify(stepsUrl)};\nimport { resolveLayout } from ${JSON.stringify(pathsUrl)};\nconst layout = { ...resolveLayout({ home: process.env.FIXTURE_HOME }), isRealHome: true };\nstepPiRegister(layout, {}, { env: process.env, limits: { version: Number(process.env.LIMIT_MS), install: Number(process.env.LIMIT_MS) }, platform: () => process.platform });\n`);
	return wrapper;
}

function launchInstallWrapper(fixture, extraEnv = {}) {
	return spawn(process.execPath, [makeInstallWrapper(fixture)], { detached: true, stdio: "ignore", env: { ...fixture.env, ...extraEnv, FIXTURE_HOME: fixture.home, LIMIT_MS: String(HANG_MS) } });
}

async function waitForStart(predicate) {
	return waitFor(predicate, START_ALLOWANCE_MS);
}

async function observeParentKill({ group, npm = false, childDelay = 0 }) {
	const fixture = makeFixture("version", { npm });
	const child = launchInstallWrapper(fixture, { IGNORE_SIGINT: "1", CHILD_DELAY_MS: String(childDelay) });
	const started = await waitForStart(() => readPids(fixture.pids).length >= 3);
	const beforeKill = readPids(fixture.pids);
	const boundBelowHang = PARENT_KILL_BOUND_MS < HANG_MS;
	if (started) process.kill(group ? -child.pid : child.pid, "SIGKILL");
	const killedAt = Date.now();
	const dead = await waitFor(() => beforeKill.length >= 3 && beforeKill.every((pid) => !processAlive(pid)), PARENT_KILL_BOUND_MS);
	const elapsed = Date.now() - killedAt;
	return { started: Boolean(started), pids: beforeKill, pidsFile: fixture.pids, dead: Boolean(dead), elapsed, bound: PARENT_KILL_BOUND_MS, boundBelowHang };
}

async function runCleanupSignalPhase(signalRelay) {
	const fixture = makeSignalCleanupFixture();
	const child = launchInstallWrapper(fixture, { CLEANUP_DELAY_MS: String(CLEANUP_DELAY_MS) });
	const exit = new Promise((resolve) => child.once("exit", () => resolve(true)));
	const started = await waitFor(() => fs.existsSync(fixture.lock) && fs.existsSync(fixture.ready) && readPids(fixture.pids).length >= 3);
	const records = readPidRecords(fixture.pids);
	const relayPid = records[0]?.ppid;
	if (started && signalRelay) process.kill(relayPid, "SIGINT");
	if (started) process.kill(-child.pid, "SIGINT");
	const exited = await Promise.race([exit, sleep(SIGNAL_CASE_BOUND_MS).then(() => false)]);
	const cleaned = await waitFor(() => !fs.existsSync(fixture.lock));
	const pids = readPids(fixture.pids);
	const dead = await waitFor(() => pids.length >= 3 && pids.every((pid) => !processAlive(pid)));
	return { signalRelay, started: Boolean(started), relayPid, exited, cleaned: Boolean(cleaned), pids, dead: Boolean(dead) };
}

function withFixtureEnv(fixture, run) {
	const names = ["PATH", "PIDS_FILE", "HANG_TARGET", "HANG_MS", "CHILD_DELAY_MS", "LOCK_DIR", "READY_FILE", "CLEANUP_DELAY_MS", "OUTPUT_BYTES", "PI_EXIT_CODE"];
	const saved = Object.fromEntries(names.map((name) => [name, process.env[name]]));
	for (const name of names) process.env[name] = fixture.env[name];
	try {
		return run();
	} finally {
		for (const name of names) {
			if (saved[name] === undefined) delete process.env[name];
			else process.env[name] = saved[name];
		}
	}
}

function timedStep(target, dryRun = false, runLimit = LIMIT_MS) {
	const fixture = makeFixture(target, { registerKnowledge: target === "install" });
	const start = Date.now();
	const rows = withFixtureEnv(fixture, () => stepPiRegister(fixture.layout, { dryRun }, { env: fixture.env, limits: { version: runLimit, install: runLimit }, platform: () => process.platform }));
	return { ...fixture, elapsed: Date.now() - start, rows, row: rows.find(({ label }) => label === "pi packages") };
}

function timedDoctor(runLimit = LIMIT_MS) {
	const fixture = makeFixture("version");
	const start = Date.now();
	const rows = withFixtureEnv(fixture, () => diagnose(fixture.layout, { projectDir: fixture.home, pi: { env: fixture.env, limits: { version: runLimit, install: runLimit }, platform: () => process.platform } }));
	return { ...fixture, elapsed: Date.now() - start, rows, row: rows.find(({ label }) => label === "pi executable") };
}

function stoppedVersion(row, runLimit = LIMIT_MS) {
	return row?.detail.includes("pi --version") && row.detail.includes(`${runLimit / 1_000} s`) && row.detail.includes("stopped");
}

// req: R-2484
check("R-2484: the launch-limit test accepts a stop up to the limit, the relay settle window and the sealed 3.5-second margin, below the relay backstop", () => {
	const parentKillExpected = RELAY_PARENT_POLL_MS + RELAY_SIGNAL_GRACE_MS + RELAY_ELAPSED_MARGIN_MS;
	const ok = HANG_STOP_MARGIN_MS === 3_500
		&& RELAY_ELAPSED_BOUND_MS === LIMIT_MS + RELAY_SETTLE_MS + HANG_STOP_MARGIN_MS
		&& RELAY_ELAPSED_BOUND_MS < LIMIT_MS + RELAY_BACKSTOP_MS
		&& RELAY_ELAPSED_BOUND_MS < HANG_MS
		&& PARENT_KILL_BOUND_MS === parentKillExpected;
	return { ok, detail: JSON.stringify({ HANG_STOP_MARGIN_MS, RELAY_ELAPSED_BOUND_MS, LIMIT_MS, RELAY_SETTLE_MS, RELAY_BACKSTOP_MS, HANG_MS, PARENT_KILL_BOUND_MS, RELAY_PARENT_POLL_MS, RELAY_SIGNAL_GRACE_MS, RELAY_ELAPSED_MARGIN_MS, parentKillExpected }) };
});

// req: R-2020
check("R-2020: a pi that hangs on --version makes install and install --dry-run stop at the limit, report pi packages ✗ naming pi --version and the limit, and exit 1", () => {
	const install = timedStep("version");
	const dryRun = timedStep("version", true);
	return {
		ok: [install, dryRun].every((run) => run.elapsed >= LIMIT_MS && run.elapsed < RELAY_ELAPSED_BOUND_MS && run.row?.status === "problem" && stoppedVersion(run.row) && installExitCode(run.rows) === 1),
		detail: JSON.stringify({ install: { elapsed: install.elapsed, row: install.row }, dryRun: { elapsed: dryRun.elapsed, row: dryRun.row } }),
	};
});

// req: R-2021
check("R-2021: a pi that hangs on --version makes doctor stop at the limit and report pi executable ✗ naming pi --version and the limit", () => {
	const run = timedDoctor();
	return { ok: run.elapsed >= LIMIT_MS && run.elapsed < RELAY_ELAPSED_BOUND_MS && run.row?.status === "fail" && stoppedVersion(run.row), detail: JSON.stringify({ elapsed: run.elapsed, row: run.row }) };
});

// req: R-2022
check("R-2022: a pi install that hangs makes install stop at the limit, report pi packages ✗ naming pi install, the package folder and the limit, and exit 1", () => {
	const run = timedStep("install");
	const detail = run.row?.detail ?? "";
	return { ok: run.elapsed >= LIMIT_MS && run.elapsed < RELAY_ELAPSED_BOUND_MS && run.row?.status === "problem" && detail.includes(`pi install ${expectedPack}`) && detail.includes(`${LIMIT_MS / 1_000} s`) && detail.includes("stopped") && installExitCode(run.rows) === 1, detail: JSON.stringify({ elapsed: run.elapsed, row: run.row }) };
});

// req: R-2023
check("R-2023: every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report", () => {
	const startedAt = Date.now();
	const runCases = [() => timedStep("version", false, START_ALLOWANCE_MS), () => timedStep("version", true, START_ALLOWANCE_MS), () => timedDoctor(START_ALLOWANCE_MS), () => timedStep("install", false, START_ALLOWANCE_MS)];
	const observed = [];
	for (const runCase of runCases) {
		const run = runCase();
		const records = readPidRecords(run.pids);
		const returnedAt = Date.now();
		const judgment = judgeRun(records);
		observed.push({ records, returnedAt, judgment, stopped: run.row?.detail.includes("stopped") && run.row.detail.includes(`${START_ALLOWANCE_MS / 1_000} s`) });
	}
	const unended = observed.flatMap(({ judgment, records }) => judgment.ended ? [] : records.filter((record) => record?.pid));
	let afterSelfExit = [];
	if (unended.length) {
		const until = Math.max(...unended.map(({ at }) => at + HANG_MS + SELF_EXIT_MARGIN_MS));
		while (Date.now() < until) sleepSync(Math.min(25, until - Date.now()));
		afterSelfExit = unended.map(({ pid }) => ({ pid, result: probeProcess(pid) === "gone" ? "after self-exit: gone" : "after self-exit: alive" }));
	}
	return { ok: observed.every(({ judgment, stopped }) => judgment.started && judgment.ended && stopped), detail: JSON.stringify({ elapsed: Date.now() - startedAt, runs: observed, afterSelfExit }) };
});

// req: R-2890
check("R-2890: a recorded pid still alive when the judge's wait ends makes the run read not ended, is named with its probe result, and is left running", async () => {
	const bystander = spawn(process.execPath, ["-e", `process.on("message", (m) => { if (m === "ping") process.send("pong"); }); setTimeout(() => process.exit(0), ${HANG_MS});`], { stdio: ["ignore", "ignore", "ignore", "ipc"] });
	try {
		const record = { pid: bystander.pid, ppid: process.pid, args: ["bystander"], at: Date.now() };
		const result = judgeRun([record]);
		const answered = new Promise((resolve) => {
			bystander.once("message", (message) => resolve(message === "pong"));
			bystander.once("error", () => resolve(false));
			bystander.once("exit", () => resolve(false));
			try { bystander.send("ping", (error) => { if (error) resolve(false); }); }
			catch { resolve(false); }
		});
		const pinged = await Promise.race([answered, sleep(BYSTANDER_ANSWER_LIMIT_MS).then(() => false)]);
		return { ok: !result.ended && result.details.some((item) => item.pid === record.pid && item.last === "alive") && pinged, detail: JSON.stringify({ result, pinged }) };
	} finally { bystander.kill("SIGKILL"); }
});

// req: R-2891
check("R-2891: a run judged after its fixture could have ended by itself, or holding a record with no start time, reads not ended with the reason named", () => {
	const late = judgeRun([{ pid: 1, ppid: 2, args: ["late"], at: Date.now() - HANG_MS + SELF_EXIT_MARGIN_MS / 2 }]);
	const missing = judgeRun([{ pid: 1, ppid: 2, args: ["missing"] }]);
	return { ok: !late.ended && late.reason.includes("judged too late") && !missing.ended && missing.reason.includes("invalid record"), detail: JSON.stringify({ late, missing }) };
});

// req: R-2892
check("R-2892: a probe error other than ESRCH, or a record without a positive integer pid and ppid, makes the judge report its run not ended and name it", () => {
	const e = judgeRun([{ pid: process.pid, ppid: process.ppid, at: Date.now(), args: [] }], { kill: () => { const error = new Error("invalid"); error.code = "EINVAL"; throw error; } });
	const p = judgeRun([{ pid: process.pid, ppid: 1, at: Date.now(), args: [] }], { kill: () => { const error = new Error("denied"); error.code = "EPERM"; throw error; } });
	const invalid = [judgeRun([{ pid: 0, ppid: 1, at: Date.now() }]), judgeRun([{ pid: "123", ppid: 1, at: Date.now() }]), judgeRun([{ pid: 1, at: Date.now() }])];
	return { ok: !e.ended && e.reason.includes("EINVAL") && !p.ended && p.reason.includes("EPERM") && invalid.every((item) => !item.ended && item.reason.includes("invalid record")), detail: JSON.stringify({ e, p, invalid }) };
});

// req: R-2893
check("R-2893: the launch-limit test signals only through its allowed kill calls, imports no tree-kill helper and starts no kill command", () => {
	const source = fs.readFileSync(new URL(import.meta.url), "utf8");
	const treeKill = "kill" + "ProcessTree";
	const workerKill = "kill" + "WorkerTree";
	const commandKill = "task" + "kill";
	const calls = [...source.matchAll(/([A-Za-z]+)\.kill\s*\(([^)]*)\)|(?<!\.)kill\s*\(([^)]*)\)/g)]
		.map((match) => ({ owner: match[1] ?? "injected", args: (match[2] ?? match[3]).replace(/\s+/g, " ").trim() }));
	const allowed = (call) => call.owner === "injected" ? call.args === "pid, 0"
		: call.owner === "process" ? /^group \? -child\.pid : child\.pid, |^-child\.pid, |^relayPid, /.test(call.args)
			: ["child", "bystander"].includes(call.owner) && call.args === "\"SIGKILL\"";
	const spawnedCommands = [...source.matchAll(/spawn(?:Sync)?\s*\(\s*(["'])([^"']*)/g)].map((match) => match[2]);
	const ok = calls.length > 0 && calls.every(allowed)
		&& !source.includes(treeKill) && !source.includes(workerKill)
		&& !source.includes(commandKill) && spawnedCommands.every((command) => command !== "kill");
	return { ok, detail: JSON.stringify({ calls, spawnedCommands }) };
});

// req: R-2894
check("R-2894: a fixture tree gets a sealed 6-second start allowance apart from the parent-kill bound and a sealed 1-second self-exit margin, and a stopped launch returns at least that margin before the fixture's hang", () => {
	const parentKillExpected = RELAY_PARENT_POLL_MS + RELAY_SIGNAL_GRACE_MS + RELAY_ELAPSED_MARGIN_MS;
	const ok = START_ALLOWANCE_MS === 6_000 && SELF_EXIT_MARGIN_MS === 1_000 && PARENT_KILL_BOUND_MS === parentKillExpected
		&& START_ALLOWANCE_MS + RELAY_SETTLE_MS + HANG_STOP_MARGIN_MS <= HANG_MS - SELF_EXIT_MARGIN_MS
		&& START_ALLOWANCE_MS + PARENT_KILL_BOUND_MS < HANG_MS;
	return { ok, detail: JSON.stringify({ START_ALLOWANCE_MS, SELF_EXIT_MARGIN_MS, PARENT_KILL_BOUND_MS, parentKillExpected }) };
});

// req: R-2895
check("R-2895: the parent-kill check counts a launch whose pi starts its child after the default poll but inside the start allowance as started", async () => {
	if (process.platform === "win32") return { skip: "POSIX process-tree timing" };
	const observed = await observeParentKill({ group: false, childDelay: LATE_CHILD_MS });
	const records = readPidRecords(observed.pidsFile);
	const piRecord = records.find(({ args }) => args?.[0] !== "child");
	const childRecord = records.find(({ args }) => args?.[0] === "child");
	return { ok: observed.started && PID_POLL_MS < LATE_CHILD_MS && LATE_CHILD_MS < START_ALLOWANCE_MS && childRecord?.at - piRecord?.at >= LATE_CHILD_MS, detail: JSON.stringify({ observed, childRecord, piRecord, LATE_CHILD_MS }) };
});

// req: R-2024
check("R-2024: with no limit injected, install, the dry run and doctor give pi --version 30 s and each pi install 120 s", () => {
	const calls = [];
	const recorder = (command, args, options) => {
		calls.push({ command, args, options });
		return { status: 0, signal: null, stdout: JSON.stringify(args).includes("--version") ? "1.0.2\n" : "", stderr: "" };
	};
	const makeLayout = () => ({ ...resolveLayout({ home: tmpDir(path.join(os.tmpdir(), "nana-pi-default-limit-")) }), isRealHome: true });
	stepPiRegister(makeLayout(), {}, { spawn: recorder, platform: () => process.platform });
	stepPiRegister(makeLayout(), { dryRun: true }, { spawn: recorder, platform: () => process.platform });
	diagnose(makeLayout(), { projectDir: os.tmpdir(), pi: { spawn: recorder, platform: () => process.platform } });
	const version = calls.filter(({ args }) => JSON.stringify(args).includes("--version"));
	const installs = calls.filter(({ args }) => JSON.stringify(args).includes("install") && !JSON.stringify(args).includes("--version"));
	return {
		ok: PI_LAUNCH_LIMITS_MS.version === 30_000 && PI_LAUNCH_LIMITS_MS.install === 120_000 && version.length === 3 && version.every(({ options }) => options.timeout === PI_LAUNCH_LIMITS_MS.version) && installs.length >= 1 && installs.every(({ options }) => options.timeout === PI_LAUNCH_LIMITS_MS.install),
		detail: JSON.stringify({ limits: PI_LAUNCH_LIMITS_MS, calls: calls.map(({ args, options }) => ({ args, timeout: options.timeout })) }),
	};
});

// req: R-2301
check("R-2301: on win32, install, its dry run and doctor start an npm pi.cmd's package entry with the running Node, its limit, install's agent folder and a checkout path holding % and ! unchanged, never through ComSpec", () => {
	const win = path.win32;
	const pi = "C:\\npm\\pi.cmd";
	const packageDir = win.join("C:\\npm", "node_modules", ...PI_PACKAGE.split("/"));
	const packageJson = win.join(packageDir, "package.json");
	const entry = win.join(packageDir, "cli.js");
	const env = { PATH: "C:\\npm", cOmSpEc: "C:\\Windows\\System32\\cmd.exe" };
	const exists = (candidate) => candidate.toLowerCase() === pi.toLowerCase();
	const readText = (candidate) => {
		if (candidate.toLowerCase() !== packageJson.toLowerCase()) throw new Error(`unexpected read ${candidate}`);
		return JSON.stringify({ name: PI_PACKAGE, bin: { [PI_BIN_NAME]: "cli.js" } });
	};
	const isFile = (candidate) => candidate.toLowerCase() === entry.toLowerCase();
	const calls = [];
	const recorder = (source, agentDir) => (command, args, options) => {
		calls.push({ source, agentDir, command, args, options });
		return { status: 0, signal: null, stdout: args.includes("--version") ? "1.0.2\n" : "", stderr: "" };
	};
	const makeLayout = () => ({ ...resolveLayout({ home: tmpDir(path.join(os.tmpdir(), "nana-pi-direct-launch-")) }), isRealHome: true });
	const installLayout = makeLayout();
	stepPiRegister(installLayout, {}, { spawn: recorder("install", installLayout.piHome), platform: "win32", env, exists, isFile, readText });
	const dryLayout = makeLayout();
	stepPiRegister(dryLayout, { dryRun: true }, { spawn: recorder("dry-run", dryLayout.piHome), platform: "win32", env, exists, isFile, readText });
	const doctorLayout = makeLayout();
	diagnose(doctorLayout, { projectDir: os.tmpdir(), pi: { spawn: recorder("doctor", doctorLayout.piHome), platform: "win32", env, exists, isFile, readText } });

	const manifestRoot = tmpDir(path.join(os.tmpdir(), "nana-%!-manifest-"));
	fs.writeFileSync(path.join(manifestRoot, "package.json"), JSON.stringify({ pi: { extensions: ["extensions"] } }));
	const specialLayout = makeLayout();
	const specialRows = stepPiRegister(specialLayout, {}, { spawn: recorder("special", specialLayout.piHome), platform: "win32", env, exists, isFile, readText, manifestRoot });
	const specialInstall = calls.find(({ source, args }) => source === "special" && args[1] === "install");
	const versionCalls = calls.filter(({ args }) => args[1] === "--version");
	const installCalls = calls.filter(({ args }) => args[1] === "install");
	return {
		ok: calls.length > 0
			&& calls.every(({ command, args, options }) => command === process.execPath && args[0] === entry && options.windowsVerbatimArguments === undefined)
			&& versionCalls.length === 4 && versionCalls.every(({ args, options }) => args.length === 2 && options.timeout === PI_LAUNCH_LIMITS_MS.version)
			&& installCalls.length >= 2 && installCalls.every(({ agentDir, options }) => options.timeout === PI_LAUNCH_LIMITS_MS.install && options.env?.PI_CODING_AGENT_DIR === agentDir)
			&& specialRows[0]?.status === "created" && specialInstall?.args[2] === manifestRoot,
		detail: JSON.stringify({ entry, calls, specialRows, manifestRoot }),
	};
});

// req: R-2302
check("R-2302: on win32, a pi.cmd with no npm package beside it, another package there, or the package's entry missing still runs through ComSpec in install, its dry run and doctor", () => {
	const win = path.win32;
	const pi = "C:\\npm\\pi.cmd";
	const packageDir = win.join("C:\\npm", "node_modules", ...PI_PACKAGE.split("/"));
	const packageJson = win.join(packageDir, "package.json");
	const entry = win.join(packageDir, "cli.js");
	const comspec = "C:\\Windows\\System32\\cmd.exe";
	const env = { PATH: "C:\\npm", CoMsPeC: comspec };
	const exists = (candidate) => candidate.toLowerCase() === pi.toLowerCase();
	const observations = [];
	for (const kind of ["no package", "another package", "entry missing"]) {
		const calls = [];
		const recorder = (command, args, options) => {
			calls.push({ command, args, options });
			return { status: 0, signal: null, stdout: args.some((arg) => String(arg).includes("--version")) ? "1.0.2\n" : "", stderr: "" };
		};
		const readText = (candidate) => {
			if (candidate.toLowerCase() !== packageJson.toLowerCase() || kind === "no package") throw new Error("missing");
			return JSON.stringify({ name: kind === "another package" ? "another-package" : PI_PACKAGE, bin: { [PI_BIN_NAME]: "cli.js" } });
		};
		const isFile = (candidate) => kind !== "entry missing" && candidate.toLowerCase() === entry.toLowerCase();
		const makeLayout = () => ({ ...resolveLayout({ home: tmpDir(path.join(os.tmpdir(), "nana-pi-fallback-launch-")) }), isRealHome: true });
		stepPiRegister(makeLayout(), {}, { spawn: recorder, platform: "win32", env, exists, isFile, readText });
		stepPiRegister(makeLayout(), { dryRun: true }, { spawn: recorder, platform: "win32", env, exists, isFile, readText });
		diagnose(makeLayout(), { projectDir: os.tmpdir(), pi: { spawn: recorder, platform: "win32", env, exists, isFile, readText } });
		observations.push({ kind, calls });
	}
	const calls = observations.flatMap(({ calls }) => calls);
	return {
		ok: observations.every(({ calls: caseCalls }) => caseCalls.length >= 5)
			&& calls.every(({ command, args, options }) => command === comspec && JSON.stringify(args.slice(0, 4)) === JSON.stringify(["/d", "/v:off", "/s", "/c"]) && options.windowsVerbatimArguments === true),
		detail: JSON.stringify(observations),
	};
});

// req: R-2027
check("R-2027: the relay gives a signalled pi launch 1000 ms to clean up before ending its process tree", () => ({
	ok: boundedSpawn.RELAY_SIGNAL_GRACE_MS === 1_000,
	detail: `RELAY_SIGNAL_GRACE_MS=${boundedSpawn.RELAY_SIGNAL_GRACE_MS}`,
}));

// req: R-2025
check("R-2025: pi install started under the limit receives the agent folder install chose as PI_CODING_AGENT_DIR", () => {
	const saved = process.env.PI_CODING_AGENT_DIR;
	delete process.env.PI_CODING_AGENT_DIR;
	const fixture = makeFixture("none");
	let rows;
	try {
		rows = withFixtureEnv(fixture, () => stepPiRegister(fixture.layout, {}, { env: fixture.env, limits, platform: () => process.platform }));
	} finally {
		if (saved === undefined) delete process.env.PI_CODING_AGENT_DIR;
		else process.env.PI_CODING_AGENT_DIR = saved;
	}
	const records = fs.readFileSync(fixture.pids, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
	const installs = records.filter(({ args }) => args[0] === "install");
	return { ok: rows[0]?.status === "created" && installs.length > 0 && installs.every(({ agentDir }) => agentDir === fixture.layout.piHome), detail: JSON.stringify({ rows, records }) };
});

// req: R-2026
check("R-2026: SIGINT, SIGTERM and SIGHUP each sent to install's process group end the pi launch it waits on", async () => {
	if (process.platform === "win32") {
		return { skip: "win32 has no process-group signal, and process.kill ends a process without running its handlers" };
	}
	const observations = [];
	for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
		const fixture = makeFixture("version");
		const child = launchInstallWrapper(fixture);
		const exit = new Promise((resolve) => child.once("exit", () => resolve(true)));
		const started = await waitFor(() => readPids(fixture.pids).length >= 3);
		if (started) process.kill(-child.pid, signal);
		const exited = await Promise.race([exit, sleep(SIGNAL_CASE_BOUND_MS).then(() => false)]);
		const pids = readPids(fixture.pids);
		const dead = await waitFor(() => pids.length >= 3 && pids.every((pid) => !processAlive(pid)));

		observations.push({ signal, started: Boolean(started), exited, pids, dead: Boolean(dead) });
	}
	return { ok: observations.every(({ started, exited, dead }) => started && exited && dead), detail: JSON.stringify(observations) };
});

// req: R-2027
check("R-2027: SIGINT lets pi install remove its lock before install ends its launch processes", async () => {
	if (process.platform === "win32") {
		return { skip: "win32 delivers console Ctrl-C to the attached pi process and has no process-group SIGINT equivalent" };
	}
	const fixture = makeSignalCleanupFixture();
	const child = launchInstallWrapper(fixture);
	const exit = new Promise((resolve) => child.once("exit", () => resolve(true)));
	const started = await waitFor(() => fs.existsSync(fixture.lock) && fs.existsSync(fixture.ready) && readPids(fixture.pids).length >= 3);
	if (started) process.kill(-child.pid, "SIGINT");
	const exited = await Promise.race([exit, sleep(SIGNAL_CASE_BOUND_MS).then(() => false)]);
	const cleaned = await waitFor(() => !fs.existsSync(fixture.lock));
	const pids = readPids(fixture.pids);
	const dead = await waitFor(() => pids.length >= 3 && pids.every((pid) => !processAlive(pid)));

	return { ok: Boolean(started && exited && cleaned && dead), detail: JSON.stringify({ started: Boolean(started), exited, cleaned: Boolean(cleaned), pids, dead: Boolean(dead) }) };
});

// req: R-2300
check("R-2300: on Windows, a kill of install alone ends the npm pi launch it waits on within the parent check and the signal grace", async () => {
	if (process.platform !== "win32") return { skip: "Windows kill-on-close job behavior only" };
	const observed = await observeParentKill({ group: false, npm: true });
	return { ok: observed.started && observed.dead && observed.elapsed <= observed.bound && observed.boundBelowHang, detail: JSON.stringify(observed) };
});

// req: R-2130
check("R-2130: a SIGKILL of install's whole process group ends the pi launch it waits on within the parent check and the signal grace", async () => {
	if (process.platform === "win32") return { skip: "Windows has no process-group SIGKILL" };
	const observed = await observeParentKill({ group: true });
	return { ok: observed.started && observed.dead && observed.elapsed <= observed.bound && observed.boundBelowHang, detail: JSON.stringify(observed) };
});

// req: R-2131
check("R-2131: a SIGKILL of install alone ends the pi launch it waits on within the parent check and the signal grace", async () => {
	if (process.platform === "win32") return { skip: "a Windows parent's death leaves process.ppid unchanged" };
	const observed = await observeParentKill({ group: false });
	return { ok: observed.started && observed.dead && observed.elapsed <= observed.bound && observed.boundBelowHang, detail: JSON.stringify(observed) };
});

// req: R-2303
check("R-2303: on Windows, a kill of the pi launch relay alone ends the npm pi it runs and pi's child within the parent check and the signal grace", async () => {
	if (process.platform !== "win32") return { skip: "Windows kill-on-close job behavior only" };
	const fixture = makeFixture("version", { npm: true });
	const child = launchInstallWrapper(fixture, { IGNORE_SIGINT: "1" });
	const started = await waitForStart(() => readPidRecords(fixture.pids).length >= 2);
	const records = readPidRecords(fixture.pids);
	const relayPid = records[0]?.ppid;
	const launchedPids = records.map(({ pid }) => pid);
	if (started && relayPid) process.kill(relayPid, "SIGKILL");
	const killedAt = Date.now();
	const dead = await waitFor(() => launchedPids.length >= 2 && launchedPids.every((pid) => !processAlive(pid)), PARENT_KILL_BOUND_MS);
	const elapsed = Date.now() - killedAt;
	child.kill("SIGKILL");
	const observed = { started: Boolean(started), relayPid, launchedPids, dead: Boolean(dead), elapsed, bound: PARENT_KILL_BOUND_MS, boundBelowHang: PARENT_KILL_BOUND_MS < HANG_MS };
	return { ok: observed.started && observed.relayPid && observed.dead && observed.elapsed <= observed.bound && observed.boundBelowHang, detail: JSON.stringify(observed) };
});

// req: R-2132
check("R-2132: a pi install that writes just under 1 MiB of control characters to each of stdout and stderr reads created on exit 0 and failed with its last error line on exit 1", () => {
	const runs = [0, 1].map((exitCode) => {
		const fixture = makeLargeOutputFixture(exitCode);
		const rows = withFixtureEnv(fixture, () => stepPiRegister(fixture.layout, {}, { env: fixture.env, limits: { version: HANG_MS, install: HANG_MS }, platform: () => process.platform }));
		return { exitCode, rows, installExitCode: installExitCode(rows) };
	});
	const [success, failure] = runs;
	return { ok: success.rows[0]?.status === "created" && success.installExitCode === 0 && failure.rows[0]?.status === "problem" && failure.installExitCode === 1 && failure.rows[0]?.detail.endsWith("failed: boom: last line"), detail: JSON.stringify(runs) };
});

// req: R-2133
check("R-2133: SIGINT to install's process group, alone or with the relay signalled too, still lets a pi install that cleans up over two parent checks remove its lock before its processes end", async () => {
	if (process.platform === "win32") return { skip: "Windows has no process-group SIGINT" };
	const delayBelowGrace = CLEANUP_DELAY_MS < RELAY_SIGNAL_GRACE_MS;
	const phases = [await runCleanupSignalPhase(false), await runCleanupSignalPhase(true)];
	return { ok: delayBelowGrace && phases.every(({ started, exited, cleaned, dead }) => started && exited && cleaned && dead), detail: JSON.stringify({ cleanupDelay: CLEANUP_DELAY_MS, signalGrace: RELAY_SIGNAL_GRACE_MS, phases }) };
});

for (const testCase of cases) {
	let timer;
	try {
		const result = await Promise.race([
			Promise.resolve().then(testCase.run),
			new Promise((resolve) => { timer = setTimeout(() => resolve({ ok: false, detail: `case exceeded ${CASE_LIMIT_MS} ms` }), CASE_LIMIT_MS); }),
		]);
		if (result?.skip) console.log("SKIP", testCase.title, result.skip);
		else console.log(result?.ok ? "PASS" : "FAIL", testCase.title, result?.ok ? "" : result?.detail ?? "");
		if (!result?.ok && !result?.skip) fails++;
	} catch (error) {
		console.log("FAIL", testCase.title, error?.stack || error);
		fails++;
	} finally {
		clearTimeout(timer);
	}
}

if (fails) process.exitCode = 1;
