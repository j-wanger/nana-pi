#!/usr/bin/env node
/**
 * @module packages/nana-setup/tests/pi-launch-limits.test.mjs
 * @purpose Prove install, its dry run and doctor bound pi launches and end every process those launches start.
 * @inputs steps.mjs, doctor.mjs, paths.mjs, and fake pi process trees under OS temporary directories
 * @outputs PASS/FAIL lines for seven requirement checks and exit 1 when any check fails
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
import { RELAY_BACKSTOP_MS, RELAY_SETTLE_MS } from "../lib/bounded-spawn.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const LIMIT_MS = 3_000;
const HANG_MS = 12_000;
const BOUND_MS = 9_000;
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

function readPids(file) {
	if (!fs.existsSync(file)) return [];
	const records = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
	return [...new Set(records.flatMap(({ pid, ppid }) => [pid, ppid]).filter((pid) => Number.isInteger(pid) && pid > 0))];
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
		`const fs = require("node:fs");\nconst { spawn } = require("node:child_process");\nfs.appendFileSync(process.env.PIDS_FILE, JSON.stringify({ pid: process.pid, ppid: process.ppid, args: process.argv.slice(2), agentDir: process.env.PI_CODING_AGENT_DIR ?? null }) + "\\n");\nif (process.argv[2] === "child") { setTimeout(() => process.exit(0), Number(process.env.HANG_MS)); return; }\nconst args = process.argv.slice(2);\nconst target = process.env.HANG_TARGET;\nif (args[0] === "--version" && target !== "version") { process.stdout.write("1.0.2\\n"); process.exit(0); }\nif (args[0] === "install" && target !== "install") process.exit(0);\nspawn(process.execPath, [__filename, "child"], { stdio: "inherit", env: process.env });\nsetTimeout(() => process.exit(0), Number(process.env.HANG_MS));\n`,
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

function withFixtureEnv(fixture, run) {
	const names = ["PATH", "PIDS_FILE", "HANG_TARGET", "HANG_MS"];
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
		ok: [install, dryRun].every((run) => run.elapsed >= LIMIT_MS && run.elapsed < BOUND_MS && run.row?.status === "problem" && stoppedVersion(run.row) && installExitCode(run.rows) === 1),
		detail: JSON.stringify({ install: { elapsed: install.elapsed, row: install.row }, dryRun: { elapsed: dryRun.elapsed, row: dryRun.row } }),
	};
});

// req: R-2021
check("R-2021: a pi that hangs on --version makes doctor stop at the limit and report pi executable ✗ naming pi --version and the limit", () => {
	const run = timedDoctor();
	return { ok: run.elapsed >= LIMIT_MS && run.elapsed < BOUND_MS && run.row?.status === "fail" && stoppedVersion(run.row), detail: JSON.stringify({ elapsed: run.elapsed, row: run.row }) };
});

// req: R-2022
check("R-2022: a pi install that hangs makes install stop at the limit, report pi packages ✗ naming pi install, the package folder and the limit, and exit 1", () => {
	const run = timedStep("install");
	const detail = run.row?.detail ?? "";
	return { ok: run.elapsed >= LIMIT_MS && run.elapsed < BOUND_MS && run.row?.status === "problem" && detail.includes(`pi install ${expectedPack}`) && detail.includes(`${LIMIT_MS / 1_000} s`) && detail.includes("stopped") && installExitCode(run.rows) === 1, detail: JSON.stringify({ elapsed: run.elapsed, row: run.row }) };
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
		console.log("SKIP R-2026: win32 has no process-group signal, and process.kill ends a process without running its handlers");
		return { ok: true };
	}
	const stepsUrl = pathToFileURL(path.join(repoRoot, "packages", "nana-setup", "lib", "steps.mjs")).href;
	const pathsUrl = pathToFileURL(path.join(repoRoot, "packages", "nana-setup", "lib", "paths.mjs")).href;
	const observations = [];
	for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
		const fixture = makeFixture("version");
		const wrapper = path.join(fixture.home, "wrapper.mjs");
		fs.writeFileSync(wrapper, `import { stepPiRegister } from ${JSON.stringify(stepsUrl)};\nimport { resolveLayout } from ${JSON.stringify(pathsUrl)};\nconst layout = { ...resolveLayout({ home: process.env.FIXTURE_HOME }), isRealHome: true };\nstepPiRegister(layout, {}, { env: process.env, limits: { version: Number(process.env.LIMIT_MS), install: Number(process.env.LIMIT_MS) }, platform: () => process.platform });\n`);
		const child = spawn(process.execPath, [wrapper], { detached: true, stdio: "ignore", env: { ...fixture.env, FIXTURE_HOME: fixture.home, LIMIT_MS: String(HANG_MS) } });
		const exit = new Promise((resolve) => child.once("exit", () => resolve(true)));
		const started = await waitFor(() => readPids(fixture.pids).length >= 3);
		if (started) process.kill(-child.pid, signal);
		const exited = await Promise.race([exit, sleep(BOUND_MS).then(() => false)]);
		const pids = readPids(fixture.pids);
		const dead = await waitFor(() => pids.length >= 3 && pids.every((pid) => !processAlive(pid)));
		if (!dead) {
			for (const pid of pids) try { process.kill(pid, "SIGKILL"); } catch {}
		}
		observations.push({ signal, started: Boolean(started), exited, pids, dead: Boolean(dead) });
	}
	return { ok: observations.every(({ started, exited, dead }) => started && exited && dead), detail: JSON.stringify(observations) };
});

for (const testCase of cases) {
	let timer;
	try {
		const result = await Promise.race([
			Promise.resolve().then(testCase.run),
			new Promise((resolve) => { timer = setTimeout(() => resolve({ ok: false, detail: `case exceeded ${BOUND_MS + RELAY_BACKSTOP_MS + RELAY_SETTLE_MS} ms` }), BOUND_MS + RELAY_BACKSTOP_MS + RELAY_SETTLE_MS); }),
		]);
		console.log(result?.ok ? "PASS" : "FAIL", testCase.title, result?.ok ? "" : result?.detail ?? "");
		if (!result?.ok) fails++;
	} catch (error) {
		console.log("FAIL", testCase.title, error?.stack || error);
		fails++;
	} finally {
		clearTimeout(timer);
	}
}

if (fails) process.exitCode = 1;
