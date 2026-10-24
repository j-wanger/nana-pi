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
import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
	COMPLETION_FILE,
	COVERAGE_ENV,
	RECORD_FILE,
	STOP_WAIT_MS,
} from "../lib/runtime-map-config.mjs";
import {
	COVERAGE_FAILURE_POLICY,
	COVERAGE_OWNER_FILE,
	DIRTY_COUNT_ENV,
	HAND_MEASURE_ENV,
	LAND_NOTE_PREFIX,
	LAND_TIP_ENV,
	MAIN_REF,
	TIP_DIGITS,
	UNMEASURED_PLATFORMS,
} from "../lib/land-config.mjs";
import { handMeasure } from "../../../scripts/runtime-measure.mjs";
import * as productReportModule from "../../../scripts/product-report.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TEST_LOCKED = path.join(REPO, "scripts", "test-locked.mjs");
const RUNTIME_MEASURE = path.join(REPO, "scripts", "runtime-measure.mjs");
const TEST_LOCKED_URL = pathToFileURL(TEST_LOCKED).href;
const RUNTIME_MEASURE_URL = pathToFileURL(RUNTIME_MEASURE).href;
const SUITE_RECORDS_CONFIG_URL = pathToFileURL(path.join(REPO, "packages", "nana-pack", "lib", "suite-records-config.mjs")).href;
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "runtime-land-test-")));
const LAND_REPORT_SUBPATH = productReportModule.LAND_REPORT_SUBPATH ?? "nana/product-report.html";
const CASE_LIMIT_MS = 30_000;
const MEASURED_PLATFORM = "linux";
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

function installReportFixture(root) {
	fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
	fs.writeFileSync(path.join(root, "scripts", "runtime-measure.mjs"), "export const runtime = true;\n");
	fs.writeFileSync(path.join(root, "scripts", "test-locked.mjs"), "export const suite = true;\n");
	fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), [
		"# CAP-85 · Artifact stage", "Purpose: make artifacts.", "Outcome: artifacts exist.", "Kind: product", "Deliverables: R-8500, R-8501",
		"Made by: R-8500 · land: scripts/runtime-measure.mjs · A-001", "Read by: R-8500 · code: REQUIREMENTS.md",
		"Made by: R-8501 · suite: packages/nana-pack/lib/suite-records.mjs · A-002", "Read by: R-8501 · code: REQUIREMENTS.md", "",
		"## FEAT-085 · Artifact report", "Purpose: report artifact ages.", "Status: active",
		"Artifact: A-001 · runtime map · clone store: <git common dir>/nana/runtime-map.json · land: scripts/runtime-measure.mjs",
		"Artifact: A-002 · suite run records · clone store: <git common dir>/nana/suite-runs · suite: packages/nana-pack/lib/suite-records.mjs", "",
		"| ID | Requirement | Status | Evidence |", "|---|---|---|---|",
		"| R-8500 | The runtime artifact shall exist. | untested | — |", "| R-8501 | The suite artifact shall exist. | untested | — |", "",
	].join("\n"));
	fs.writeFileSync(path.join(root, "HANDOFF.md"), "# Handoff\n\n## Open for the owner\n");
	git(root, "add", "REQUIREMENTS.md", "HANDOFF.md", "scripts");
	git(root, "commit", "-m", "report fixture");
	return root;
}

const FAKE_SUITE = path.join(TD, "fake-suite.mjs");
fs.writeFileSync(FAKE_SUITE, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	`const coverage = process.env.${COVERAGE_ENV} ?? null;`,
	`import { RECORD_FILE_ENV, RECORD_SCHEMA } from ${JSON.stringify(SUITE_RECORDS_CONFIG_URL)};`,
	'const args = process.argv.slice(2);',
	'const mode = process.env.NANA_FAKE_MODE ?? "pass";',
	'fs.appendFileSync(process.env.NANA_FAKE_LOG, JSON.stringify({ coverage, args, mode }) + "\\n");',
	'if (coverage) {',
	'  fs.mkdirSync(coverage, { recursive: true });',
	'  if (process.env.NANA_FAKE_COVERAGE_PATH) fs.writeFileSync(process.env.NANA_FAKE_COVERAGE_PATH, coverage);',
	'  if (mode === "sleep") { setTimeout(() => {}, 120000); } else {',
	'    const failing = mode === "coverage-fail" || mode === "always-fail" || mode === "whole-run-fail";',
	'    const records = [{ path: "fixture/a.test.mjs", label: "PASS", seconds: 1 }, { path: "fixture/b.test.mjs", label: failing ? "FAIL" : "PASS", seconds: 2 }];',
	'    if (process.env[RECORD_FILE_ENV]) fs.writeFileSync(process.env[RECORD_FILE_ENV], JSON.stringify({ schema: RECORD_SCHEMA, files: records, unnamedFailures: [], exitCode: failing ? 1 : 0, wallSeconds: 3, jobs: 1, platform: process.platform, coverage: true }));',
	'    records.forEach((record, index) => { const dir = path.join(coverage, String(index).padStart(4, "0")); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, ' + JSON.stringify(RECORD_FILE) + '), JSON.stringify(record)); fs.writeFileSync(path.join(dir, "coverage-1.json"), JSON.stringify({ result: [] })); });',
	'    const failures = failing ? (mode === "whole-run-fail" ? 2 : 1) : 0;',
	'    if (mode !== "no-completion") fs.writeFileSync(path.join(coverage, ' + JSON.stringify(COMPLETION_FILE) + '), JSON.stringify({ files: mode === "count-mismatch" ? 9 : records.length, failures }));',
	'    process.exit(failing ? 1 : 0);',
	'  }',
	'} else { const exitCode = mode === "always-fail" || mode === "no-tip-fail" ? 7 : 0; if (process.env[RECORD_FILE_ENV]) fs.writeFileSync(process.env[RECORD_FILE_ENV], JSON.stringify({ schema: RECORD_SCHEMA, files: [{ path: args[0] || "fixture/plain.test.mjs", label: exitCode ? "FAIL" : "PASS", seconds: 1 }], unnamedFailures: [], exitCode, wallSeconds: 1, jobs: 1, platform: process.platform, coverage: false })); process.exit(exitCode); }',
	'',
].join("\n"));

const ORPHAN_WORKER = path.join(TD, "orphan-worker.mjs");
fs.writeFileSync(ORPHAN_WORKER, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	'const [, , kind, outDir] = process.argv;',
	'for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => {});',
	'fs.writeFileSync(path.join(outDir, `${kind}.pid`), String(process.pid));',
	'setTimeout(() => {}, 120000);',
	'',
].join("\n"));
const ORPHAN_BRIDGE = path.join(TD, "orphan-bridge.mjs");
fs.writeFileSync(ORPHAN_BRIDGE, [
	'import { spawn } from "node:child_process";',
	'const [, , worker, outDir] = process.argv;',
	'spawn(process.execPath, [worker, "same-group", outDir], { stdio: "ignore" }).unref();',
	'',
].join("\n"));
const ORPHAN_SUITE = path.join(TD, "orphan-suite.mjs");
fs.writeFileSync(ORPHAN_SUITE, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	'import { spawn } from "node:child_process";',
	'const [, , worker, bridge, outDir] = process.argv;',
	`const coverage = process.env.${COVERAGE_ENV};`,
	'fs.mkdirSync(coverage, { recursive: true });',
	'fs.writeFileSync(process.env.NANA_FAKE_COVERAGE_PATH, coverage);',
	'for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => process.exit(23));',
	'const bridgeChild = spawn(process.execPath, [bridge, worker, outDir], { stdio: "ignore" });',
	'bridgeChild.unref();',
	'spawn(process.execPath, [worker, "detached", outDir], { detached: true, stdio: "ignore" }).unref();',
	'const ready = setInterval(() => {',
	'  let bridgeGone = false; try { process.kill(bridgeChild.pid, 0); } catch { bridgeGone = true; }',
	'  if (bridgeGone && fs.existsSync(path.join(outDir, "same-group.pid")) && fs.existsSync(path.join(outDir, "detached.pid"))) {',
	'    clearInterval(ready); fs.writeFileSync(path.join(outDir, "ready"), "1");',
	'  }',
	'}, 10);',
	'setTimeout(() => {}, 120000);',
	'',
].join("\n"));

const LOCKED_WRAPPER = path.join(TD, "locked-wrapper.mjs");
fs.writeFileSync(LOCKED_WRAPPER, [
	`import { runLocked } from ${JSON.stringify(TEST_LOCKED_URL)};`,
	'const options = JSON.parse(process.env.NANA_LOCKED_OPTIONS ?? "{}");',
	'if (options.writeFailure) { delete options.writeFailure; options.writeData = () => { throw new Error("injected write refusal"); }; }',
	'process.exitCode = await runLocked(options);',
	'',
].join("\n"));

const HAND_WRAPPER = path.join(TD, "hand-wrapper.mjs");
fs.writeFileSync(HAND_WRAPPER, [
	`import { handMeasure } from ${JSON.stringify(RUNTIME_MEASURE_URL)};`,
	'const testLocked = process.env.NANA_HAND_TEST_LOCKED;',
	'process.exitCode = await handMeasure({ root: process.cwd(), env: process.env, ...(testLocked ? { testLocked } : {}) });',
	'',
].join("\n"));

function oldData(marker = "earlier") {
	return JSON.stringify({ schema: 1, hashes: {}, tests: {}, marker });
}

function starts(logFile) {
	if (!fs.existsSync(logFile)) return [];
	return fs.readFileSync(logFile, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function runCase(name, { args = [], tip = "head", mode = "pass", options = {}, initial = oldData(name), root: suppliedRoot, useCommonData = false } = {}) {
	const root = suppliedRoot ?? fixture(name);
	const commonDir = path.resolve(root, git(root, "rev-parse", "--git-common-dir"));
	const dataFile = useCommonData ? path.join(commonDir, "nana", "runtime-map.json") : path.join(TD, `${name}-data.json`);
	const logFile = path.join(TD, `${name}-starts.jsonl`);
	const lockDir = path.join(TD, `${name}-lock`);
	const tempRoot = path.join(TD, `${name}-tmp`);
	fs.mkdirSync(tempRoot, { recursive: true });
	fs.mkdirSync(path.dirname(dataFile), { recursive: true });
	fs.writeFileSync(dataFile, initial);
	const env = {
		...process.env,
		NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, FAKE_SUITE]),
		NANA_SUITE_LOCK_DIR: lockDir,
		NANA_RUNTIME_MAP_FILE: dataFile,
		NANA_FAKE_LOG: logFile,
		NANA_FAKE_MODE: mode,
		NANA_LOCKED_OPTIONS: JSON.stringify({ tempRoot, platform: MEASURED_PLATFORM, ...options }),
	};
	delete env[HAND_MEASURE_ENV];
	if (tip === "head") env[LAND_TIP_ENV] = git(root, "rev-parse", "HEAD");
	else if (tip != null) env[LAND_TIP_ENV] = tip;
	else delete env[LAND_TIP_ENV];
	const result = spawnSync(process.execPath, [LOCKED_WRAPPER, ...args], { cwd: root, env, encoding: "utf8", timeout: CASE_LIMIT_MS - 1000 });
	return { root, commonDir, dataFile, logFile, lockDir, tempRoot, initial, result, starts: starts(logFile), env };
}

function reportPath(c) {
	return path.join(c.commonDir, ...LAND_REPORT_SUBPATH.split("/"));
}

function pageModel(file) {
	const html = fs.readFileSync(file, "utf8");
	const data = html.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
	if (!data) throw new Error(`report data missing from ${file}`);
	return JSON.parse(data);
}

function ageFor(model, row) {
	const line = model.capabilities.flatMap((capability) => capability.deliverables).find((deliverable) => deliverable.id === row)?.artifactLines[0] ?? "";
	return /(?:newest record at tip|measured at tip|last changed|age (?:unknown|not measured):).*$/u.exec(line)?.[0] ?? "";
}

function productReportNotes(result) {
	return String(result.stdout ?? "").split(/\r?\n/).filter((line) => line.startsWith(`${LAND_NOTE_PREFIX} product report`));
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
	assert.equal(HAND_MEASURE_ENV, "NANA_RUNTIME_HAND_MEASURE");
});

// req: R-2740
await check("R-2740: a passing land writes the product report for HEAD under the git common directory after its suite record and runtime data, and names it in one land note", () => {
	assert.equal(productReportModule.LAND_REPORT_SUBPATH, "nana/product-report.html");
	const cases = [];
	for (const [name, mode, options] of [
		["report-measured-pass", "pass", {}],
		["report-rerun-pass", "coverage-fail", {}],
		["report-windows-pass", "pass", { platform: "win32" }],
		["report-map-refused", "pass", { writeFailure: true }],
	]) {
		const root = installReportFixture(fixture(name));
		cases.push([name, runCase(name, { root, mode, options, useCommonData: true })]);
	}
	const main = installReportFixture(fixture("report-linked-main"));
	const linked = path.join(TD, "report-linked-worktree");
	git(main, "worktree", "add", "-q", "-b", "report-linked-lane", linked);
	cases.push(["report-linked", runCase("report-linked", { root: linked, useCommonData: true })]);
	for (const [name, c] of cases) {
		assert.equal(c.result.status, 0, `${name}: ${c.result.stdout}\n${c.result.stderr}`);
		const page = reportPath(c);
		assert.equal(fs.existsSync(page), true, name);
		const head = git(c.root, "rev-parse", "HEAD");
		const model = pageModel(page);
		assert.equal(model.commit, head, name);
		assert.match(ageFor(model, "R-8501"), new RegExp(`^newest record at tip ${head.slice(0, TIP_DIGITS)} .*\\b0 commits?\\b`), name);
		if (name === "report-measured-pass" || name === "report-rerun-pass") assert.match(ageFor(model, "R-8500"), new RegExp(`^measured at tip ${head.slice(0, TIP_DIGITS)} .*\\b0 commits?\\b`), name);
		const notes = productReportNotes(c.result);
		assert.equal(notes.length, 1, `${name}: ${c.result.stdout}`);
		assert.ok(notes[0].includes(fs.realpathSync.native(page)), `${name}: ${notes[0]}`);
		assert.ok(notes[0].endsWith(`for ${head.slice(0, TIP_DIGITS)}`), `${name}: ${notes[0]}`);
	}
	const linkedCase = cases.find(([name]) => name === "report-linked")[1];
	const privateGitDir = path.resolve(linkedCase.root, git(linkedCase.root, "rev-parse", "--git-dir"));
	assert.equal(reportPath(linkedCase).startsWith(privateGitDir), false);
});

// req: R-2741
await check("R-2741: filtered, tipless, wrong-tip, hand-measure and failing runs leave the earlier product report byte for byte and print no product report note", () => {
	const seeded = Buffer.from("earlier product report\r\nwith trailing space \t");
	const cases = [];
	const runSeeded = (name, options) => {
		const root = installReportFixture(fixture(name));
		const commonDir = path.resolve(root, git(root, "rev-parse", "--git-common-dir"));
		const page = path.join(commonDir, ...LAND_REPORT_SUBPATH.split("/"));
		fs.mkdirSync(path.dirname(page), { recursive: true }); fs.writeFileSync(page, seeded);
		const c = runCase(name, { root, ...options }); cases.push([name, c, page]); return c;
	};
	runSeeded("report-filtered", { args: ["--jobs=2"] });
	runSeeded("report-filtered-windows", { args: ["--jobs=2"], options: { platform: "win32" } });
	runSeeded("report-tipless", { tip: null });
	runSeeded("report-wrong-tip", { tip: "0".repeat(40) });
	runSeeded("report-wrong-tip-windows", { tip: "0".repeat(40), options: { platform: "win32" } });
	runSeeded("report-always-fail", { mode: "always-fail" });
	runSeeded("report-whole-run-fail", { mode: "whole-run-fail" });

	const handRoot = installReportFixture(fixture("report-hand-measure"));
	const handCommon = path.resolve(handRoot, git(handRoot, "rev-parse", "--git-common-dir"));
	const handPage = path.join(handCommon, ...LAND_REPORT_SUBPATH.split("/"));
	fs.mkdirSync(path.dirname(handPage), { recursive: true }); fs.writeFileSync(handPage, seeded);
	const handEnv = { ...process.env, NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, FAKE_SUITE]), NANA_SUITE_LOCK_DIR: path.join(TD, "report-hand-lock"), NANA_RUNTIME_MAP_FILE: path.join(TD, "report-hand-map.json"), NANA_FAKE_LOG: path.join(TD, "report-hand-log.jsonl"), NANA_FAKE_MODE: "pass", NANA_HAND_TEST_LOCKED: LOCKED_WRAPPER, NANA_LOCKED_OPTIONS: JSON.stringify({ tempRoot: path.join(TD, "report-hand-tmp"), platform: MEASURED_PLATFORM }) };
	delete handEnv[LAND_TIP_ENV];
	const handResult = spawnSync(process.execPath, [HAND_WRAPPER], { cwd: handRoot, env: handEnv, encoding: "utf8", timeout: CASE_LIMIT_MS - 1000 });
	cases.push(["report-hand-measure", { result: handResult }, handPage]);

	for (const [name, c, page] of cases) {
		assert.deepEqual(fs.readFileSync(page), seeded, name);
		assert.equal(productReportNotes(c.result).length, 0, `${name}: ${c.result.stdout}`);
	}
	const controlRoot = installReportFixture(fixture("report-positive-control"));
	const controlCommon = path.resolve(controlRoot, git(controlRoot, "rev-parse", "--git-common-dir"));
	const controlPage = path.join(controlCommon, ...LAND_REPORT_SUBPATH.split("/"));
	fs.mkdirSync(path.dirname(controlPage), { recursive: true }); fs.writeFileSync(controlPage, seeded);
	const control = runCase("report-positive-control", { root: controlRoot });
	assert.equal(control.result.status, 0, control.result.stderr);
	assert.notDeepEqual(fs.readFileSync(controlPage), seeded);
	assert.equal(productReportNotes(control.result).length, 1, control.result.stdout);
});

// req: R-2742
await check("R-2742: a land whose product report refuses or cannot be written prints one product report note on one line and keeps the suite's exit code", () => {
	const seeded = Buffer.from("earlier page without final newline");
	const refusalCases = [];
	const noLedgerRoot = fixture("report-no-ledger");
	const noLedgerCommon = path.resolve(noLedgerRoot, git(noLedgerRoot, "rev-parse", "--git-common-dir"));
	const noLedgerPage = path.join(noLedgerCommon, ...LAND_REPORT_SUBPATH.split("/"));
	fs.mkdirSync(path.dirname(noLedgerPage), { recursive: true }); fs.writeFileSync(noLedgerPage, seeded);
	refusalCases.push(["no ledger", runCase("report-no-ledger", { root: noLedgerRoot }), noLedgerPage]);

	const badTreeRoot = installReportFixture(fixture("report-bad-tree"));
	fs.appendFileSync(path.join(badTreeRoot, "REQUIREMENTS.md"), "\n| R-9999 | malformed row | implemented | — |\n| R-9998 | another malformed row | implemented | — |\n");
	const badTreeCommon = path.resolve(badTreeRoot, git(badTreeRoot, "rev-parse", "--git-common-dir"));
	const badTreePage = path.join(badTreeCommon, ...LAND_REPORT_SUBPATH.split("/"));
	fs.mkdirSync(path.dirname(badTreePage), { recursive: true }); fs.writeFileSync(badTreePage, seeded);
	refusalCases.push(["tree problems", runCase("report-bad-tree", { root: badTreeRoot }), badTreePage]);

	const folderRoot = installReportFixture(fixture("report-page-folder"));
	const folderCommon = path.resolve(folderRoot, git(folderRoot, "rev-parse", "--git-common-dir"));
	const folderPage = path.join(folderCommon, ...LAND_REPORT_SUBPATH.split("/"));
	fs.mkdirSync(folderPage, { recursive: true });
	refusalCases.push(["page folder", runCase("report-page-folder", { root: folderRoot }), null]);

	for (const [name, c, earlierPage] of refusalCases) {
		assert.equal(c.result.status, 0, `${name}: ${c.result.stdout}\n${c.result.stderr}`);
		const notes = productReportNotes(c.result);
		assert.equal(notes.length, 1, `${name}: ${c.result.stdout}`);
		assert.ok(notes[0].startsWith(`${LAND_NOTE_PREFIX} product report not written: `), notes[0]);
		assert.equal(/[\r\n]/.test(notes[0]), false, notes[0]);
		if (name === "no ledger") assert.match(notes[0], /REQUIREMENTS\.md/);
		if (name === "tree problems") assert.match(notes[0], /requirements tree checker problems.*R-9999.*R-9998/);
		if (name === "page folder") assert.match(notes[0], /EISDIR|EPERM|ENOTEMPTY/);
		if (earlierPage) assert.deepEqual(fs.readFileSync(earlierPage), seeded, name);
	}
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
	const wholeRun = runCase("covered-file-and-whole-run-fail", { mode: "whole-run-fail" });
	assert.notEqual(wholeRun.result.status, 0); assert.equal(wholeRun.starts.length, 1); assert.ok(wholeRun.starts[0].coverage);
	assert.doesNotMatch(wholeRun.result.stdout, /rerunning without coverage/);
	const writeFailure = runCase("covered-fail-write-refused", { mode: "coverage-fail", options: { writeFailure: true } });
	assert.equal(writeFailure.result.status, 0); assert.equal(writeFailure.starts.length, 2);
	assert.match(writeFailure.result.stdout, /runtime map write failed: injected write refusal/);
});

// req: R-2525
await check("a passing land suite whose runtime data cannot be written exits 0, keeps the earlier data and names why", () => {
	for (const [name, mode, options] of [["missing-completion", "no-completion", {}], ["wrong-completion-count", "count-mismatch", {}], ["write-refused", "pass", { writeFailure: true }]]) {
		const c = runCase(name, { mode, options });
		assert.equal(c.result.status, 0, `${c.result.stdout}\n${c.result.stderr}`);
		assert.equal(fs.readFileSync(c.dataFile, "utf8"), c.initial);
		const notes = c.result.stdout.split(/\r?\n/).filter((line) => line.startsWith(LAND_NOTE_PREFIX) && line.includes("runtime map"));
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

const processIsGone = (pid) => { try { process.kill(pid, 0); return false; } catch { return true; } };
async function waitForPidsToEnd(pids, limit) {
	const deadline = Date.now() + limit;
	while (Date.now() < deadline) {
		if (pids.every(processIsGone)) return true;
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
	return pids.every(processIsGone);
}

if (process.platform === "win32") console.log("SKIP off Windows, a land suite stopped during its coverage run removes the coverage folder, keeps the earlier data and exits non-zero — R-2526: Windows lands do not measure");
else {
// req: R-2527
await check("off Windows, a land suite stopped during its coverage run removes the coverage folder, keeps the earlier data and exits non-zero", async () => {
	for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
		const name = `stopped-${signal}`; const root = fixture(name); const dataFile = path.join(TD, `${name}-data.json`); const initial = oldData(name);
		const logFile = path.join(TD, `${name}-starts.jsonl`); const lockDir = path.join(TD, `${name}-lock`); const tempRoot = path.join(TD, `${name}-tmp`); const coveragePath = path.join(TD, `${name}-coverage.txt`); const outDir = path.join(TD, `${name}-processes`);
		fs.mkdirSync(tempRoot, { recursive: true }); fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(dataFile, initial);
		const stale = path.join(tempRoot, "nana-runtime-stale"); fs.mkdirSync(stale); fs.writeFileSync(path.join(stale, COVERAGE_OWNER_FILE), "99999999\n");
		const env = { ...process.env, [LAND_TIP_ENV]: git(root, "rev-parse", "HEAD"), NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, ORPHAN_SUITE, ORPHAN_WORKER, ORPHAN_BRIDGE, outDir]), NANA_SUITE_LOCK_DIR: lockDir, NANA_RUNTIME_MAP_FILE: dataFile, NANA_FAKE_LOG: logFile, NANA_FAKE_MODE: "sleep", NANA_FAKE_COVERAGE_PATH: coveragePath, NANA_LOCKED_OPTIONS: JSON.stringify({ tempRoot, platform: "darwin" }) };
		const child = spawn(process.execPath, [LOCKED_WRAPPER], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
		const pidFiles = [path.join(outDir, "same-group.pid"), path.join(outDir, "detached.pid")];
		try {
			await waitForFile(path.join(outDir, "ready")); await waitForFile(coveragePath);
			const coverageDir = fs.readFileSync(coveragePath, "utf8"); child.kill(signal);
			const exit = await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`${signal} child did not exit`)), STOP_WAIT_MS + 3000); child.once("exit", (code, childSignal) => { clearTimeout(timer); resolve({ code, signal: childSignal }); }); });
			const descendantPids = pidFiles.map((file) => Number(fs.readFileSync(file, "utf8")));
			assert.equal(await waitForPidsToEnd(descendantPids, STOP_WAIT_MS + 3000), true);
			assert.equal(processIsGone(process.pid), false); assert.notEqual(exit.code ?? 1, 0); assert.equal(fs.existsSync(coverageDir), false); assert.equal(fs.existsSync(stale), false); assert.equal(fs.readFileSync(dataFile, "utf8"), initial);
		} finally {
			for (const file of pidFiles) { try { process.kill(Number(fs.readFileSync(file, "utf8")), "SIGKILL"); } catch {} }
			try { process.kill(child.pid, "SIGKILL"); } catch {}
		}
	}
});
}

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
await check("a hand measure writes its tip, time and dirty-file count inside the lock", async () => {
	for (const [name, options] of [["hand-measure", {}], ["hand-measure-win32", { platform: "win32" }]]) {
		const root = fixture(name); fs.writeFileSync(path.join(root, "README.md"), "dirty fixture\n");
		const dataFile = path.join(TD, `${name}-data.json`); const logFile = path.join(TD, `${name}-starts.jsonl`); const lockDir = path.join(TD, `${name}-lock`);
		const env = { ...process.env, NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, FAKE_SUITE]), NANA_SUITE_LOCK_DIR: lockDir, NANA_RUNTIME_MAP_FILE: dataFile, NANA_FAKE_LOG: logFile, NANA_FAKE_MODE: "pass" };
		if (options.platform) { env.NANA_HAND_TEST_LOCKED = LOCKED_WRAPPER; env.NANA_LOCKED_OPTIONS = JSON.stringify(options); }
		delete env[LAND_TIP_ENV]; delete env[DIRTY_COUNT_ENV];
		const before = Date.now(); const result = spawnSync(process.execPath, [HAND_WRAPPER], { cwd: root, env, encoding: "utf8", timeout: CASE_LIMIT_MS - 1000 }); const after = Date.now();
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`); assert.equal(fs.existsSync(lockDir), false);
		const data = JSON.parse(fs.readFileSync(dataFile, "utf8")); assert.equal(data.tip, git(root, "rev-parse", "HEAD")); assert.equal(data.dirty, 1);
		const measured = Date.parse(data.measuredAt); assert.ok(measured >= before && measured <= after);
		const recordedStarts = starts(logFile); assert.equal(recordedStarts.length, 1); assert.ok(recordedStarts[0].coverage);
	}

	const root = fixture("hand-stop-win32-unit");
	const fakeChild = new EventEmitter(); fakeChild.pid = 424242;
	const forwarded = []; fakeChild.kill = (signal) => { forwarded.push(signal); };
	const handlers = new Map(); const removed = [];
	let settled = false;
	const stopped = handMeasure({
		root,
		platform: "win32",
		start: () => fakeChild,
		onSignal: (signal, handler) => handlers.set(signal, handler),
		offSignal: (signal, handler) => { if (handlers.get(signal) === handler) removed.push(signal); },
	}).then((code) => { settled = true; return code; });
	const stopHandler = handlers.get("SIGINT");
	if (stopHandler) stopHandler();
	await new Promise((resolve) => setTimeout(resolve, 20));
	const waitedForLockedSuite = !settled;
	fakeChild.emit("exit", 0, null);
	const stopCode = await stopped;
	assert.equal(typeof stopHandler, "function"); assert.equal(waitedForLockedSuite, true); assert.deepEqual(forwarded, []); assert.notEqual(stopCode, 0); assert.deepEqual(removed.sort(), ["SIGHUP", "SIGINT", "SIGTERM"]);
});

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
