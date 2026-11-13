/**
 * @module packages/nana-pack/tests/runtime-land.test.mjs
 * @purpose Pin the locked suite's land report and remembered orphan-target cleanup.
 * @inputs The real locked-suite module, temporary git repositories and fake suites.
 * @outputs PASS or FAIL lines and a nonzero exit when a kept contract fails.
 * @effects process (spawns fixture suites and sends stop signals), disk (temporary repositories, locks and reports).
 * @errors A failed assertion, process timeout or unexpected child exit fails the named case.
 */
import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { LAND_NOTE_PREFIX, LAND_TIP_ENV, TIP_DIGITS } from "../lib/land-config.mjs";
import * as productReportModule from "../../../scripts/product-report.mjs";
import { killOwned, fileIdentity } from "./process-tree-helper.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const TEST_LOCKED_URL = pathToFileURL(path.join(REPO, "scripts", "test-locked.mjs")).href;
const SUITE_RECORDS_CONFIG_URL = pathToFileURL(path.join(REPO, "packages", "nana-pack", "lib", "suite-records-config.mjs")).href;
const TD = tmpDir(path.join(os.tmpdir(), "locked-land-test-"));
const LAND_REPORT_SUBPATH = productReportModule.LAND_REPORT_SUBPATH;
const CASE_LIMIT_MS = 30_000;
const STOP_WAIT_MS = 5000; // chosen: ten times the locked runner's kill escalation, plus assertions' margin.
let failures = 0;
async function check(title, fn) {
	let timer;
	try {
		await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timed out after ${CASE_LIMIT_MS}ms`)), CASE_LIMIT_MS); })]);
		console.log("PASS", title);
	} catch (error) { failures++; console.log("FAIL", title, error?.stack ?? error); }
	finally { clearTimeout(timer); }
}
function git(cwd, ...args) {
	return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function fixture(name) {
	const root = path.join(TD, name);
	fs.mkdirSync(root, { recursive: true });
	git(root, "init", "-b", "main");
	git(root, "config", "user.name", "Locked Land Test");
	git(root, "config", "user.email", "locked-land@example.invalid");
	fs.writeFileSync(path.join(root, "README.md"), "fixture\n");
	git(root, "add", "README.md"); git(root, "commit", "-m", "fixture");
	return root;
}
function installReportFixture(root) {
	fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), [
		"# CAP-85 · Artifact stage", "Purpose: make artifacts.", "Outcome: artifacts exist.", "Kind: product", "Deliverables: R-8501",
		"Made by: R-8501 · suite: packages/nana-pack/lib/suite-records.mjs · A-002", "Read by: R-8501 · code: REQUIREMENTS.md", "",
		"## FEAT-085 · Artifact report", "Purpose: report artifact ages.", "Status: active",
		"Artifact: A-002 · suite run records · clone store: <git common dir>/nana/suite-runs · suite: packages/nana-pack/lib/suite-records.mjs", "",
		"| ID | Requirement | Status | Evidence |", "|---|---|---|---|", "| R-8501 | The suite artifact shall exist. | untested | — |", "",
	].join("\n"));
	fs.writeFileSync(path.join(root, "HANDOFF.md"), "# Handoff\n\n## Open for the owner\n");
	git(root, "add", "REQUIREMENTS.md", "HANDOFF.md"); git(root, "commit", "-m", "report fixture");
	return root;
}
const FAKE_SUITE = path.join(TD, "fake-suite.mjs");
fs.writeFileSync(FAKE_SUITE, [
	'import * as fs from "node:fs";',
	`import { RECORD_FILE_ENV, RECORD_SCHEMA } from ${JSON.stringify(SUITE_RECORDS_CONFIG_URL)};`,
	'const exitCode = process.env.NANA_FAKE_MODE === "fail" ? 7 : 0;',
	'if (process.env[RECORD_FILE_ENV]) fs.writeFileSync(process.env[RECORD_FILE_ENV], JSON.stringify({ schema: RECORD_SCHEMA, files: [{ path: "fixture/plain.test.mjs", label: exitCode ? "FAIL" : "PASS", seconds: 1 }], unnamedFailures: [], exitCode, wallSeconds: 1, jobs: 1, platform: process.platform }));',
	'process.exitCode = exitCode;', '',
].join("\n"));
const ORPHAN_WORKER = path.join(TD, "orphan-worker.mjs");
fs.writeFileSync(ORPHAN_WORKER, [
	'import * as fs from "node:fs";', 'import * as path from "node:path";',
	'const [, , kind, outDir] = process.argv;',
	'for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => {});',
	'fs.writeFileSync(path.join(outDir, `${kind}.pid`), String(process.pid));', 'setTimeout(() => {}, 120000);', '',
].join("\n"));
const ORPHAN_BRIDGE = path.join(TD, "orphan-bridge.mjs");
fs.writeFileSync(ORPHAN_BRIDGE, [
	'import { spawn } from "node:child_process";', 'const [, , worker, outDir] = process.argv;',
	'spawn(process.execPath, [worker, "same-group", outDir], { stdio: "ignore" }).unref();', '',
].join("\n"));
const ORPHAN_SUITE = path.join(TD, "orphan-suite.mjs");
fs.writeFileSync(ORPHAN_SUITE, [
	'import * as fs from "node:fs";', 'import * as path from "node:path";', 'import { spawn } from "node:child_process";',
	'const [, , worker, bridge, outDir] = process.argv;',
	'for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => process.exit(23));',
	'const bridgeChild = spawn(process.execPath, [bridge, worker, outDir], { stdio: "ignore" });', 'bridgeChild.unref();',
	'spawn(process.execPath, [worker, "detached", outDir], { detached: true, stdio: "ignore" }).unref();',
	'const ready = setInterval(() => {',
	'  let bridgeGone = false; try { process.kill(bridgeChild.pid, 0); } catch { bridgeGone = true; }',
	'  if (bridgeGone && fs.existsSync(path.join(outDir, "same-group.pid")) && fs.existsSync(path.join(outDir, "detached.pid"))) {',
	'    clearInterval(ready); fs.writeFileSync(path.join(outDir, "ready"), "1");', '  }', '}, 10);',
	'setTimeout(() => {}, 120000);', '',
].join("\n"));
const LOCKED_WRAPPER = path.join(TD, "locked-wrapper.mjs");
fs.writeFileSync(LOCKED_WRAPPER, `import { runLocked } from ${JSON.stringify(TEST_LOCKED_URL)};\nprocess.exitCode = await runLocked();\n`);
function runCase(name, { args = [], tip = "head", mode = "pass", root: suppliedRoot } = {}) {
	const root = suppliedRoot ?? fixture(name);
	const commonDir = path.resolve(root, git(root, "rev-parse", "--git-common-dir"));
	const env = { ...process.env, NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, FAKE_SUITE]), NANA_SUITE_LOCK_DIR: path.join(TD, `${name}-lock`), NANA_FAKE_MODE: mode };
	if (tip === "head") env[LAND_TIP_ENV] = git(root, "rev-parse", "HEAD");
	else if (tip != null) env[LAND_TIP_ENV] = tip;
	else delete env[LAND_TIP_ENV];
	const result = spawnSync(process.execPath, [LOCKED_WRAPPER, ...args], { cwd: root, env, encoding: "utf8", timeout: CASE_LIMIT_MS - 1000 });
	return { root, commonDir, result };
}
const reportPath = (c) => path.join(c.commonDir, ...LAND_REPORT_SUBPATH.split("/"));
function pageModel(file) {
	return JSON.parse(fs.readFileSync(file, "utf8").match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
}
function ageFor(model, row) {
	const block = model.features.flatMap((feature) => feature.detailSections.flatMap((section) => section.blocks ?? [])).find((block) => block.heading.startsWith(`${row} `));
	const line = (block?.artifactLines[0] ?? []).map((segment) => segment.text).join("");
	return /(?:newest record at tip|last changed|age (?:unknown|not measured):).*$/u.exec(line)?.[0] ?? "";
}
const productReportNotes = (result) => String(result.stdout ?? "").split(/\r?\n/).filter((line) => line.startsWith(`${LAND_NOTE_PREFIX} product report`));
// req: R-2740
await check("R-2740: a passing land writes the product report for HEAD under the git common directory after its suite record, and names it in one land note", () => {
	assert.equal(productReportModule.LAND_REPORT_SUBPATH, "nana/product-report.html");
	const root = installReportFixture(fixture("report-pass"));
	const main = installReportFixture(fixture("report-linked-main"));
	const linked = path.join(TD, "report-linked-worktree");
	git(main, "worktree", "add", "-q", "-b", "report-linked-lane", linked);
	const cases = [runCase("report-pass", { root }), runCase("report-linked", { root: linked })];
	for (const c of cases) {
		assert.equal(c.result.status, 0, `${c.result.stdout}\n${c.result.stderr}`);
		const page = reportPath(c); const head = git(c.root, "rev-parse", "HEAD"); const model = pageModel(page);
		assert.equal(model.commit, head);
		assert.match(ageFor(model, "R-8501"), new RegExp(`^newest record at tip ${head.slice(0, TIP_DIGITS)} .*\\b0 commits?\\b`));
		const notes = productReportNotes(c.result); assert.equal(notes.length, 1, c.result.stdout);
		assert.ok(notes[0].includes(page)); assert.ok(notes[0].endsWith(`for ${head.slice(0, TIP_DIGITS)}`));
	}
	const privateGitDir = path.resolve(linked, git(linked, "rev-parse", "--git-dir"));
	assert.equal(reportPath(cases[1]).startsWith(privateGitDir), false);
});
// req: R-2741
await check("R-2741: filtered, tipless, wrong-tip and failing runs leave the earlier product report byte for byte and print no product report note", () => {
	const seeded = Buffer.from("earlier product report\r\nwith trailing space \t");
	for (const [name, options] of [["filtered", { args: ["--jobs=2"] }], ["tipless", { tip: null }], ["wrong-tip", { tip: "0".repeat(40) }], ["failing", { mode: "fail" }]]) {
		const root = installReportFixture(fixture(name));
		const page = path.join(path.resolve(root, git(root, "rev-parse", "--git-common-dir")), ...LAND_REPORT_SUBPATH.split("/"));
		fs.mkdirSync(path.dirname(page), { recursive: true }); fs.writeFileSync(page, seeded);
		const c = runCase(name, { root, ...options });
		assert.equal(c.result.status, name === "failing" ? 7 : 0, c.result.stderr);
		assert.deepEqual(fs.readFileSync(page), seeded); assert.equal(productReportNotes(c.result).length, 0, c.result.stdout);
	}
	const root = installReportFixture(fixture("positive-control"));
	const control = runCase("positive-control", { root });
	assert.equal(control.result.status, 0, control.result.stderr);
	assert.notDeepEqual(fs.readFileSync(reportPath(control)), seeded);
	assert.equal(productReportNotes(control.result).length, 1);
});
// req: R-2742
await check("R-2742: a land whose product report refuses or cannot be written prints one product report note on one line and keeps the suite's exit code", () => {
	const root = installReportFixture(fixture("report-page-folder"));
	const commonDir = path.resolve(root, git(root, "rev-parse", "--git-common-dir"));
	fs.mkdirSync(path.join(commonDir, ...LAND_REPORT_SUBPATH.split("/")), { recursive: true });
	const c = runCase("report-page-folder", { root });
	assert.equal(c.result.status, 0, `${c.result.stdout}\n${c.result.stderr}`);
	const notes = productReportNotes(c.result); assert.equal(notes.length, 1, c.result.stdout);
	assert.ok(notes[0].startsWith(`${LAND_NOTE_PREFIX} product report not written: `));
	assert.equal(/[\r\n]/.test(notes[0]), false); assert.match(notes[0], /EISDIR|EPERM|ENOTEMPTY/);
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
if (process.platform === "win32") console.log("SKIP off Windows, a stopped full locked run ends remembered orphan targets and its root group, leaves the caller alive and exits non-zero — POSIX process groups only");
else {
// req: R-2527
await check("off Windows, a stopped full locked run ends remembered orphan targets and its root group, leaves the caller alive and exits non-zero", async () => {
	for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
		const name = `stopped-${signal}`; const root = fixture(name);
		const lockDir = path.join(TD, `${name}-lock`); const outDir = path.join(TD, `${name}-processes`);
		fs.mkdirSync(outDir, { recursive: true });
		const env = { ...process.env, NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, ORPHAN_SUITE, ORPHAN_WORKER, ORPHAN_BRIDGE, outDir]), NANA_SUITE_LOCK_DIR: lockDir };
		delete env[LAND_TIP_ENV];
		const child = spawn(process.execPath, [LOCKED_WRAPPER], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
		const pidFiles = [path.join(outDir, "same-group.pid"), path.join(outDir, "detached.pid")];
		try {
			await waitForFile(path.join(outDir, "ready"));
			const exited = new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error(`${signal} child did not exit`)), STOP_WAIT_MS + 3000); child.once("exit", (code, childSignal) => { clearTimeout(timer); resolve({ code, signal: childSignal }); }); });
			child.kill(signal); const exit = await exited;
			const descendantPids = pidFiles.map((file) => Number(fs.readFileSync(file, "utf8")));
			assert.equal(await waitForPidsToEnd(descendantPids, STOP_WAIT_MS + 3000), true);
			assert.equal(processIsGone(process.pid), false); assert.notEqual(exit.code ?? 1, 0); assert.equal(fs.existsSync(lockDir), false);
		} finally {
			for (const file of pidFiles) killOwned(fileIdentity(file));
			killOwned(child);
		}
	}
});
}
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exitCode = failures ? 1 : 0;
