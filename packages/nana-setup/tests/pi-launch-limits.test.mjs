#!/usr/bin/env node
/**
 * @module packages/nana-setup/tests/pi-launch-limits.test.mjs
 * @purpose Prove install, its dry run and doctor bound pi launches and end every process those launches start.
 * @inputs steps.mjs, doctor.mjs, paths.mjs, and fake pi process trees under OS temporary directories
 * @outputs PASS/FAIL/SKIP lines for thirteen requirement checks and exit 1 when any check fails
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
import { tmpDir } from "./tmp-dir.mjs";

const { RELAY_BACKSTOP_MS, RELAY_PARENT_POLL_MS, RELAY_SETTLE_MS, RELAY_SIGNAL_GRACE_MS } = boundedSpawn;
const LIMIT_MS = 3_000;
const HANG_MS = 12_000;
// contract: R-2132 (main's spawnSync default per stream)
const MAIN_SPAWN_STREAM_BYTES = 1024 * 1024;
const SIGNAL_CASE_BOUND_MS = 9_000;
// Test-only margin for scheduler delay on shared CI after the relay's one-second settle window.
const RELAY_ELAPSED_MARGIN_MS = 1_000;
const RELAY_ELAPSED_BOUND_MS = LIMIT_MS + RELAY_SETTLE_MS + RELAY_ELAPSED_MARGIN_MS;
const PARENT_KILL_BOUND_MS = RELAY_PARENT_POLL_MS + RELAY_SIGNAL_GRACE_MS + RELAY_ELAPSED_MARGIN_MS;
const CLEANUP_DELAY_MS = 2 * RELAY_PARENT_POLL_MS;
const CASE_LIMIT_MS = SIGNAL_CASE_BOUND_MS + RELAY_BACKSTOP_MS + RELAY_SETTLE_MS;
const PID_POLL_MS = 2_000;
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

function processAlive(pid) {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return error?.code === "EPERM";
	}
}

function readPidRecords(file) {
	if (!fs.existsSync(file)) return [];
	return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function readPids(file) {
	return [...new Set(readPidRecords(file).flatMap(({ pid, ppid }) => [pid, ppid]).filter((pid) => Number.isInteger(pid) && pid > 0))];
}

function waitDeadSync(pids) {
	const end = Date.now() + PID_POLL_MS;
	while (Date.now() < end && pids.some(processAlive)) sleepSync(25);
	return pids.every((pid) => !processAlive(pid));
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

function makeFixture(target, { registerKnowledge = false } = {}) {
	const home = tmpDir(path.join(os.tmpdir(), "nana-pi-launch-limit-"));
	const bin = path.join(home, "bin");
	const pids = path.join(home, "pids.jsonl");
	fs.mkdirSync(bin);
	const hang = path.join(bin, "hang.cjs");
	fs.writeFileSync(
		hang,
		`const fs = require("node:fs");\nconst { spawn } = require("node:child_process");\nfs.appendFileSync(process.env.PIDS_FILE, JSON.stringify({ pid: process.pid, ppid: process.ppid, args: process.argv.slice(2), agentDir: process.env.PI_CODING_AGENT_DIR ?? null }) + "\\n");\nif (process.env.IGNORE_SIGINT) process.on("SIGINT", () => {});\nif (process.argv[2] === "child") { setTimeout(() => process.exit(0), Number(process.env.HANG_MS)); return; }\nconst args = process.argv.slice(2);\nconst target = process.env.HANG_TARGET;\nif (args[0] === "--version" && target !== "version") { process.stdout.write("1.0.2\\n"); process.exit(0); }\nif (args[0] === "install" && target !== "install") process.exit(0);\nspawn(process.execPath, [__filename, "child"], { stdio: "inherit", env: process.env });\nsetTimeout(() => process.exit(0), Number(process.env.HANG_MS));\n`,
	);
	if (process.platform === "win32") {
		fs.writeFileSync(path.join(bin, "pi.cmd"), `@"${process.execPath}" "%~dp0hang.cjs" %*\r\n`);
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

async function observeParentKill({ group }) {
	const fixture = makeFixture("version");
	const child = launchInstallWrapper(fixture, { IGNORE_SIGINT: "1" });
	const started = await waitFor(() => readPids(fixture.pids).length >= 3);
	const beforeKill = readPids(fixture.pids);
	const boundBelowHang = PARENT_KILL_BOUND_MS < HANG_MS;
	if (started) process.kill(group ? -child.pid : child.pid, "SIGKILL");
	const killedAt = Date.now();
	const dead = await waitFor(() => beforeKill.length >= 3 && beforeKill.every((pid) => !processAlive(pid)), PARENT_KILL_BOUND_MS);
	const elapsed = Date.now() - killedAt;
	if (!dead) for (const pid of beforeKill) try { process.kill(pid, "SIGKILL"); } catch {}
	return { started: Boolean(started), pids: beforeKill, dead: Boolean(dead), elapsed, bound: PARENT_KILL_BOUND_MS, boundBelowHang };
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
	if (!dead) for (const pid of pids) try { process.kill(pid, "SIGKILL"); } catch {}
	return { signalRelay, started: Boolean(started), relayPid, exited, cleaned: Boolean(cleaned), pids, dead: Boolean(dead) };
}

function withFixtureEnv(fixture, run) {
	const names = ["PATH", "PIDS_FILE", "HANG_TARGET", "HANG_MS", "LOCK_DIR", "READY_FILE", "CLEANUP_DELAY_MS", "OUTPUT_BYTES", "PI_EXIT_CODE"];
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

function timedStep(target, dryRun = false) {
	const fixture = makeFixture(target, { registerKnowledge: target === "install" });
	const start = Date.now();
	const rows = withFixtureEnv(fixture, () => stepPiRegister(fixture.layout, { dryRun }, { env: fixture.env, limits, platform: () => process.platform }));
	return { ...fixture, elapsed: Date.now() - start, rows, row: rows.find(({ label }) => label === "pi packages") };
}

function timedDoctor() {
	const fixture = makeFixture("version");
	const start = Date.now();
	const rows = withFixtureEnv(fixture, () => diagnose(fixture.layout, { projectDir: fixture.home, pi: { env: fixture.env, limits, platform: () => process.platform } }));
	return { ...fixture, elapsed: Date.now() - start, rows, row: rows.find(({ label }) => label === "pi executable") };
}

function stoppedVersion(row) {
	return row?.detail.includes("pi --version") && row.detail.includes(`${LIMIT_MS / 1_000} s`) && row.detail.includes("stopped");
}

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
	const runs = [timedStep("version"), timedStep("version", true), timedDoctor(), timedStep("install")];
	const observed = runs.map((run) => {
		const pids = readPids(run.pids);
		const dead = pids.length >= 3 && waitDeadSync(pids);
		if (!dead) for (const pid of pids) try { process.kill(pid, "SIGKILL"); } catch {}
		return { pids, dead, stopped: run.row?.detail.includes("stopped") };
	});
	return { ok: observed.every(({ dead, stopped }) => dead && stopped), detail: JSON.stringify(observed) };
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
		if (!dead) {
			for (const pid of pids) try { process.kill(pid, "SIGKILL"); } catch {}
		}
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
	if (!dead) for (const pid of pids) try { process.kill(pid, "SIGKILL"); } catch {}
	return { ok: Boolean(started && exited && cleaned && dead), detail: JSON.stringify({ started: Boolean(started), exited, cleaned: Boolean(cleaned), pids, dead: Boolean(dead) }) };
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
