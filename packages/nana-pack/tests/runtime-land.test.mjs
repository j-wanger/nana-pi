/**
 * @module packages/nana-pack/tests/runtime-land.test.mjs
 * @purpose Pin the locked suite's land measurement, fallback, stop, exclusion, and hand-measure contracts.
 * @inputs The real locked-suite and runtime-measure modules plus temporary git repositories and fake suites.
 * @outputs PASS or FAIL lines and a nonzero exit when a runtime land contract fails.
 * @effects process (spawns fixture suites and sends stop signals), disk (temporary repositories, locks, coverage, and data files).
 * @errors A failed assertion, process timeout, or unexpected child exit fails the named case.
 */
import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
	COMPLETION_FILE,
	COVERAGE_ENV,
	RECORD_FILE,
} from "../lib/runtime-map-config.mjs";
import {
	COVERAGE_FAILURE_POLICY,
	COVERAGE_OWNER_FILE,
	DIRTY_COUNT_ENV,
	LAND_NOTE_PREFIX,
	LAND_TIP_ENV,
	MAIN_REF,
	TIP_DIGITS,
	UNMEASURED_PLATFORMS,
} from "../lib/land-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TEST_LOCKED = path.join(REPO, "scripts", "test-locked.mjs");
const RUNTIME_MEASURE = path.join(REPO, "scripts", "runtime-measure.mjs");
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "runtime-land-test-")));
const CASE_LIMIT_MS = 30_000;
let failures = 0;

async function check(title, fn) {
	let timer;
	try {
		await Promise.race([
			Promise.resolve().then(fn),
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timed out after ${CASE_LIMIT_MS}ms`)), CASE_LIMIT_MS); }),
		]);
		console.log("PASS", title);
	} catch (error) {
		failures++;
		console.log("FAIL", title, error?.stack ?? error);
	} finally {
		clearTimeout(timer);
	}
}

function git(cwd, ...args) {
	return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fixture(name) {
	const root = path.join(TD, name);
	fs.mkdirSync(root, { recursive: true });
	git(root, "init", "-b", "main");
	git(root, "config", "user.name", "Runtime Land Test");
	git(root, "config", "user.email", "runtime-land@example.invalid");
	fs.writeFileSync(path.join(root, "README.md"), "fixture\n");
	git(root, "add", "README.md");
	git(root, "commit", "-m", "fixture");
	return root;
}

const FAKE_SUITE = path.join(TD, "fake-suite.mjs");
fs.writeFileSync(FAKE_SUITE, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	`const coverage = process.env.${COVERAGE_ENV} ?? null;`,
	'const args = process.argv.slice(2);',
	'const mode = process.env.NANA_FAKE_MODE ?? "pass";',
	'fs.appendFileSync(process.env.NANA_FAKE_LOG, JSON.stringify({ coverage, args, mode }) + "\\n");',
	'if (coverage) {',
	'  fs.mkdirSync(coverage, { recursive: true });',
	'  if (process.env.NANA_FAKE_COVERAGE_PATH) fs.writeFileSync(process.env.NANA_FAKE_COVERAGE_PATH, coverage);',
	'  if (mode === "sleep") { setTimeout(() => {}, 120000); } else {',
	'    const failing = mode === "coverage-fail" || mode === "always-fail";',
	'    const records = [{ path: "fixture/a.test.mjs", label: "PASS", seconds: 1 }, { path: "fixture/b.test.mjs", label: failing ? "FAIL" : "PASS", seconds: 2 }];',
	'    records.forEach((record, index) => { const dir = path.join(coverage, String(index).padStart(4, "0")); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, ' + JSON.stringify(RECORD_FILE) + '), JSON.stringify(record)); fs.writeFileSync(path.join(dir, "coverage-1.json"), JSON.stringify({ result: [] })); });',
	'    if (mode !== "no-completion") fs.writeFileSync(path.join(coverage, ' + JSON.stringify(COMPLETION_FILE) + '), JSON.stringify({ files: mode === "count-mismatch" ? 9 : records.length }));',
	'    process.exit(failing ? 1 : 0);',
	'  }',
	'} else { process.exit(mode === "always-fail" || mode === "no-tip-fail" ? 7 : 0); }',
	'',
].join("\n"));

const LOCKED_WRAPPER = path.join(TD, "locked-wrapper.mjs");
fs.writeFileSync(LOCKED_WRAPPER, [
	`import { runLocked } from ${JSON.stringify(TEST_LOCKED)};`,
	'const options = JSON.parse(process.env.NANA_LOCKED_OPTIONS ?? "{}");',
	'if (options.writeFailure) { delete options.writeFailure; options.writeData = () => { throw new Error("injected write refusal"); }; }',
	'process.exitCode = await runLocked(options);',
	'',
].join("\n"));

const HAND_WRAPPER = path.join(TD, "hand-wrapper.mjs");
fs.writeFileSync(HAND_WRAPPER, [
	`import { handMeasure } from ${JSON.stringify(RUNTIME_MEASURE)};`,
	'process.exitCode = handMeasure({ root: process.cwd(), env: process.env });',
	'',
].join("\n"));

function oldData(marker = "earlier") {
	return JSON.stringify({ schema: 1, hashes: {}, tests: {}, marker });
}

function starts(logFile) {
	if (!fs.existsSync(logFile)) return [];
	return fs.readFileSync(logFile, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function runCase(name, { args = [], tip = "head", mode = "pass", options = {}, initial = oldData(name) } = {}) {
	const root = fixture(name);
	const dataFile = path.join(TD, `${name}-data.json`);
	const logFile = path.join(TD, `${name}-starts.jsonl`);
	const lockDir = path.join(TD, `${name}-lock`);
	const tempRoot = path.join(TD, `${name}-tmp`);
	fs.mkdirSync(tempRoot, { recursive: true });
	fs.writeFileSync(dataFile, initial);
	const env = {
		...process.env,
		NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, FAKE_SUITE]),
		NANA_SUITE_LOCK_DIR: lockDir,
		NANA_RUNTIME_MAP_FILE: dataFile,
		NANA_FAKE_LOG: logFile,
		NANA_FAKE_MODE: mode,
		NANA_LOCKED_OPTIONS: JSON.stringify({ tempRoot, ...options }),
	};
	if (tip === "head") env[LAND_TIP_ENV] = git(root, "rev-parse", "HEAD");
	else if (tip != null) env[LAND_TIP_ENV] = tip;
	else delete env[LAND_TIP_ENV];
	const result = spawnSync(process.execPath, [LOCKED_WRAPPER, ...args], { cwd: root, env, encoding: "utf8", timeout: CASE_LIMIT_MS - 1000 });
	return { root, dataFile, logFile, lockDir, tempRoot, initial, result, starts: starts(logFile), env };
}

await check("land runtime tunables retain their reviewed values", () => {
	assert.equal(LAND_TIP_ENV, "NANA_LAND_TIP");
	assert.equal(LAND_NOTE_PREFIX, "[nana-land]");
	assert.deepEqual(UNMEASURED_PLATFORMS, ["win32"]);
	assert.equal(MAIN_REF, "refs/heads/main");
	assert.equal(COVERAGE_FAILURE_POLICY, "rerun-failed");
	assert.equal(TIP_DIGITS, 8);
	assert.equal(DIRTY_COUNT_ENV, "NANA_RUNTIME_DIRTY");
	assert.equal(COVERAGE_OWNER_FILE, "owner.pid");
});

// req: R-2523
await check("a passing land suite writes runtime data naming the land tip and the time it measured", () => {
	const before = Date.now(); const c = runCase("passing-land"); const after = Date.now();
	assert.equal(c.result.status, 0, c.result.stderr); assert.equal(c.starts.length, 1); assert.ok(c.starts[0].coverage);
	const data = JSON.parse(fs.readFileSync(c.dataFile, "utf8"));
	assert.equal(data.tip, git(c.root, "rev-parse", "HEAD"));
	const measured = Date.parse(data.measuredAt); assert.ok(Number.isFinite(measured)); assert.ok(measured >= before && measured <= after);
});

// req: R-2524
await check("a land failing under coverage keeps its data and reruns only the failed files", () => {
	for (const [name, mode, expected] of [["covered-fail-plain-pass", "coverage-fail", 0], ["covered-fail-plain-fail", "always-fail", 7]]) {
		const c = runCase(name, { mode }); assert.equal(c.result.status, expected, `${c.result.stdout}\n${c.result.stderr}`);
		assert.equal(c.starts.length, 2); assert.ok(c.starts[0].coverage); assert.equal(c.starts[1].coverage, null);
		assert.deepEqual(c.starts[1].args, ["fixture/b.test.mjs"]);
		const data = JSON.parse(fs.readFileSync(c.dataFile, "utf8")); assert.equal(data.tests["fixture/b.test.mjs"].label, "FAIL");
		assert.match(c.result.stdout, new RegExp(`${LAND_NOTE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*fixture/b\\.test\\.mjs`));
	}
});

// req: R-2525
await check("a passing land suite whose runtime data cannot be written exits 0, keeps the earlier data and names why", () => {
	for (const [name, mode, options] of [["missing-completion", "no-completion", {}], ["wrong-completion-count", "count-mismatch", {}], ["write-refused", "pass", { writeFailure: true }]]) {
		const c = runCase(name, { mode, options });
		assert.equal(c.result.status, 0, `${c.result.stdout}\n${c.result.stderr}`);
		assert.equal(fs.readFileSync(c.dataFile, "utf8"), c.initial);
		const notes = c.result.stdout.split(/\r?\n/).filter((line) => line.startsWith(LAND_NOTE_PREFIX));
		assert.equal(notes.length, 1, c.result.stdout); assert.match(notes[0], /runtime map.*(completion|count|write|refusal)/i);
	}
});

// req: R-2526
await check("on Windows a land suite runs once without coverage and says the runtime map was not measured", () => {
	const c = runCase("windows-land", { options: { platform: "win32" } });
	assert.equal(c.result.status, 0); assert.deepEqual(c.starts.map((s) => s.coverage), [null]);
	assert.equal(fs.readFileSync(c.dataFile, "utf8"), c.initial);
	assert.match(c.result.stdout, new RegExp(`${LAND_NOTE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*Windows.*not measured`, "i"));
});

async function waitForFile(file, limit = 10000) {
	const deadline = Date.now() + limit;
	while (!fs.existsSync(file) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 25));
	if (!fs.existsSync(file)) throw new Error(`timed out waiting for ${file}`);
}

// req: R-2527
await check("off Windows, a land suite stopped during its coverage run removes the coverage folder, keeps the earlier data and exits non-zero", async () => {
	for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
		const name = `stopped-${signal}`; const root = fixture(name); const dataFile = path.join(TD, `${name}-data.json`); const initial = oldData(name);
		const logFile = path.join(TD, `${name}-starts.jsonl`); const lockDir = path.join(TD, `${name}-lock`); const tempRoot = path.join(TD, `${name}-tmp`); const coveragePath = path.join(TD, `${name}-coverage.txt`);
		fs.mkdirSync(tempRoot, { recursive: true }); fs.writeFileSync(dataFile, initial);
		const stale = path.join(tempRoot, "nana-runtime-stale"); fs.mkdirSync(stale); fs.writeFileSync(path.join(stale, COVERAGE_OWNER_FILE), "99999999\n");
		const env = { ...process.env, [LAND_TIP_ENV]: git(root, "rev-parse", "HEAD"), NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, FAKE_SUITE]), NANA_SUITE_LOCK_DIR: lockDir, NANA_RUNTIME_MAP_FILE: dataFile, NANA_FAKE_LOG: logFile, NANA_FAKE_MODE: "sleep", NANA_FAKE_COVERAGE_PATH: coveragePath, NANA_LOCKED_OPTIONS: JSON.stringify({ tempRoot, platform: "darwin" }) };
		const child = spawn(process.execPath, [LOCKED_WRAPPER], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
		await waitForFile(coveragePath); const coverageDir = fs.readFileSync(coveragePath, "utf8"); child.kill(signal);
		const exit = await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`${signal} child did not exit`)), 8000); child.once("exit", (code, childSignal) => { clearTimeout(timer); resolve({ code, signal: childSignal }); }); });
		assert.notEqual(exit.code ?? 1, 0); assert.equal(fs.existsSync(coverageDir), false); assert.equal(fs.existsSync(stale), false); assert.equal(fs.readFileSync(dataFile, "utf8"), initial);
	}
});

// req: R-2532
await check("filtered, wrong-tip and unset-tip runs neither measure nor rerun", () => {
	const cases = [
		runCase("filtered", { args: ["--jobs=2"] }),
		runCase("wrong-tip", { tip: "0".repeat(40) }),
		runCase("unset-tip-fail", { tip: null, mode: "no-tip-fail" }),
	];
	assert.deepEqual(cases.map((c) => c.result.status), [0, 0, 7]);
	for (const c of cases) {
		assert.equal(c.starts.length, 1); assert.equal(c.starts[0].coverage, null); assert.equal(fs.readFileSync(c.dataFile, "utf8"), c.initial);
	}
});

// req: R-2533
await check("a hand measure writes its tip, time and dirty-file count inside the lock", () => {
	const root = fixture("hand-measure"); fs.writeFileSync(path.join(root, "README.md"), "dirty fixture\n");
	const dataFile = path.join(TD, "hand-data.json"); const logFile = path.join(TD, "hand-starts.jsonl"); const lockDir = path.join(TD, "hand-lock");
	const env = { ...process.env, NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, FAKE_SUITE]), NANA_SUITE_LOCK_DIR: lockDir, NANA_RUNTIME_MAP_FILE: dataFile, NANA_FAKE_LOG: logFile, NANA_FAKE_MODE: "pass" };
	delete env[LAND_TIP_ENV]; delete env[DIRTY_COUNT_ENV];
	const before = Date.now(); const result = spawnSync(process.execPath, [HAND_WRAPPER], { cwd: root, env, encoding: "utf8", timeout: CASE_LIMIT_MS - 1000 }); const after = Date.now();
	assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`); assert.equal(fs.existsSync(lockDir), false);
	const data = JSON.parse(fs.readFileSync(dataFile, "utf8")); assert.equal(data.tip, git(root, "rev-parse", "HEAD")); assert.equal(data.dirty, 1);
	const measured = Date.parse(data.measuredAt); assert.ok(measured >= before && measured <= after);
	const recordedStarts = starts(logFile); assert.equal(recordedStarts.length, 1); assert.ok(recordedStarts[0].coverage);
});

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
