/**
 * @module packages/nana-pack/tests/suite-records.test.mjs
 * @purpose Pin whole-run suite records at the runner-to-locked-suite boundary.
 * @inputs The real locked suite and runner, temporary git repositories, injected suite commands, locks, platforms, and record paths.
 * @outputs Four requirement-tagged PASS or FAIL checks and a nonzero exit when one fails.
 * @effects process (runs bounded fixture suites), disk (temporary repositories, a linked worktree, locks, records, and runner fixtures).
 * @errors Reports the requirement title whose record behavior differs and exits nonzero.
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
	HAND_MEASURE_ENV,
	LAND_TIP_ENV,
} from "../lib/land-config.mjs";
import {
	RECORD_FILE_ENV,
	RECORD_LINE_PREFIX,
	RECORD_SCHEMA,
	RECORD_TRIGGERS,
	SLOWER_LIST_MAX,
	SLOWER_MIN_RATIO,
	SLOWER_MIN_SECONDS,
	STORE_SUBPATH,
	SUITE_RECORDS_KEEP,
} from "../lib/suite-records-config.mjs";
import { readSuiteRecords } from "../lib/suite-records.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const LOCKED = path.join(REPO, "scripts", "test-locked.mjs");
const RUNNER = path.join(REPO, "scripts", "test.mjs");
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "suite-records-test-")));
const CASE_LIMIT_MS = 20_000;
let failures = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (!ok) failures++;
};
const git = (cwd, ...args) => {
	const result = spawnSync("git", args, { cwd, encoding: "utf8" });
	if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
	return result.stdout.trim();
};
const listJson = (dir) => {
	try { return fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort(); }
	catch { return []; }
};
const snapshot = (dir) => listJson(dir).map((name) => [name, fs.readFileSync(path.join(dir, name), "utf8")]);

// All generated launchers import repository scripts through file URLs, so Windows path spelling
// never becomes an import specifier.
const WRAPPER = path.join(TD, "locked-wrapper.mjs");
fs.writeFileSync(WRAPPER, [
	`import { runLocked } from ${JSON.stringify(pathToFileURL(LOCKED).href)};`,
	'const options = JSON.parse(process.env.NANA_LOCKED_OPTIONS || "{}");',
	'let timer = null;',
	'if (process.env.NANA_EMIT_SIGNAL) timer = setTimeout(() => process.emit(process.env.NANA_EMIT_SIGNAL), 150);',
	'process.exitCode = await runLocked(options);',
	'if (timer) clearTimeout(timer);',
	"",
].join("\n"));

const FAKE = path.join(TD, "fake-suite.mjs");
const suiteConfigUrl = pathToFileURL(path.join(REPO, "packages", "nana-pack", "lib", "suite-records-config.mjs")).href;
const runtimeConfigUrl = pathToFileURL(path.join(REPO, "packages", "nana-pack", "lib", "runtime-map-config.mjs")).href;
fs.writeFileSync(FAKE, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	`import { RECORD_FILE_ENV, RECORD_SCHEMA } from ${JSON.stringify(suiteConfigUrl)};`,
	`import { COMPLETION_FILE, COVERAGE_ENV, RECORD_FILE } from ${JSON.stringify(runtimeConfigUrl)};`,
	'const mode = process.env.NANA_FAKE_MODE || "pass";',
	'const covered = !!process.env[COVERAGE_ENV];',
	'const knob = process.env[RECORD_FILE_ENV];',
	'const args = process.argv.slice(2);',
	'if (process.env.NANA_FAKE_LOG) fs.appendFileSync(process.env.NANA_FAKE_LOG, JSON.stringify({ knob: knob || null, covered, args, mode }) + "\\n");',
	'const selectedExit = Number(process.env.NANA_FAKE_EXIT || 0);',
	'const coverageFailure = mode === "coverage-rerun" && covered;',
	'const label = coverageFailure || selectedExit !== 0 ? "FAIL" : "PASS";',
	'const file = args[0] || "packages/probe/tests/example.test.mjs";',
	'const record = { schema: RECORD_SCHEMA, files: [{ path: file, label, seconds: covered ? 2 : 1, ...(label === "FAIL" ? { cause: `exit ${coverageFailure ? 1 : selectedExit}` } : {}) }], unnamedFailures: [], exitCode: coverageFailure ? 1 : selectedExit, wallSeconds: covered ? 2 : 1, jobs: 1, platform: process.platform, coverage: covered };',
	'if (knob && mode !== "missing") { try { if (mode === "garbage") fs.writeFileSync(knob, "not json"); else fs.writeFileSync(knob, JSON.stringify(record)); } catch {} }',
	'if (covered) { const dir = path.join(process.env[COVERAGE_ENV], "0000"); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, RECORD_FILE), JSON.stringify({ path: file, label, seconds: 2 })); fs.writeFileSync(path.join(process.env[COVERAGE_ENV], COMPLETION_FILE), JSON.stringify({ files: 1, failures: label === "FAIL" ? 1 : 0 })); }',
	'if (mode === "wait") await new Promise((resolve) => setTimeout(resolve, 5000));',
	'process.exitCode = coverageFailure ? 1 : selectedExit;',
	"",
].join("\n"));

function fixtureRepo(name = "repo") {
	const main = path.join(TD, name);
	const linked = path.join(TD, `${name}-linked`);
	fs.mkdirSync(main, { recursive: true });
	git(main, "init", "-q", "-b", "main");
	fs.writeFileSync(path.join(main, "README.md"), "fixture\n");
	git(main, "add", ".");
	git(main, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture");
	git(main, "worktree", "add", "-q", "-b", `${name}-lane`, linked);
	return { main, linked };
}
const fixture = fixtureRepo();
const common = path.resolve(fixture.linked, git(fixture.linked, "rev-parse", "--git-common-dir"));
const store = path.join(common, ...STORE_SUBPATH.split("/"));
const realCommon = path.resolve(REPO, git(REPO, "rev-parse", "--git-common-dir"));
const realStore = path.join(realCommon, ...STORE_SUBPATH.split("/"));
const realStoreBefore = snapshot(realStore);
const fakeLog = path.join(TD, "fake.jsonl");
let caseNumber = 0;
function runCase({ args = [], cwd = fixture.linked, exit = 0, mode = "pass", extraEnv = {}, tempRoot, platform = "darwin" } = {}) {
	caseNumber++;
	const caseRoot = tempRoot ?? path.join(TD, `case-${caseNumber}`);
	if (tempRoot === undefined) fs.mkdirSync(caseRoot, { recursive: true });
	const lock = path.join(TD, `lock-${caseNumber}`);
	const env = {
		...process.env,
		NANA_SUITE_LOCK_DIR: lock,
		NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, FAKE]),
		NANA_FAKE_LOG: fakeLog,
		NANA_FAKE_MODE: mode,
		NANA_FAKE_EXIT: String(exit),
		NANA_LOCKED_OPTIONS: JSON.stringify({ tempRoot: caseRoot, platform }),
		...extraEnv,
	};
	delete env[RECORD_FILE_ENV];
	delete env[LAND_TIP_ENV];
	delete env[HAND_MEASURE_ENV];
	Object.assign(env, extraEnv);
	const result = spawnSync(process.execPath, [WRAPPER, ...args], { cwd, env, encoding: "utf8", timeout: CASE_LIMIT_MS });
	return { result, lock, caseRoot };
}
const fakeLogEntries = () => {
	try { return fs.readFileSync(fakeLog, "utf8").trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)); }
	catch { return []; }
};

// Seed more than one schema and one malformed file too. The real store reader must ignore both,
// while pruning still treats every JSON filename as occupying retained store space.
fs.mkdirSync(store, { recursive: true });
const head = git(fixture.linked, "rev-parse", "HEAD");
for (let i = 0; i < SUITE_RECORDS_KEEP; i++) {
	const stamp = `20000101T000${String(i).padStart(5, "0")}Z`;
	fs.writeFileSync(path.join(store, `${stamp}_${head}_${i}.json`), JSON.stringify({ schema: RECORD_SCHEMA, tip: head, files: [] }));
}
fs.writeFileSync(path.join(store, `19990101T000000000Z_${head}_bad.json`), "garbage");
fs.writeFileSync(path.join(store, `19990101T000000001Z_${head}_old.json`), JSON.stringify({ schema: RECORD_SCHEMA + 1, tip: head }));
fs.writeFileSync(path.join(fixture.linked, "README.md"), "dirty fixture\n");
fs.writeFileSync(path.join(fixture.linked, "untracked.txt"), "untracked\n");
const ordinary = runCase();
let records = readSuiteRecords({ root: fixture.main });
const ordinaryRecord = records.find((record) => record.trigger === "run" && record.tip === head);
const ordinaryName = listJson(store).find((name) => {
	try { return name.includes(`_${head}_`) && JSON.parse(fs.readFileSync(path.join(store, name), "utf8")).trigger === "run"; }
	catch { return false; }
});

const land = runCase({ mode: "coverage-rerun", extraEnv: { [LAND_TIP_ENV]: head } });
records = readSuiteRecords({ root: fixture.main });
const landRecord = records.find((record) => record.trigger === "land");
const rerunLabels = landRecord?.files?.filter((entry) => entry.path === "packages/probe/tests/example.test.mjs").map((entry) => entry.label).sort();
const measure = runCase({ extraEnv: { [LAND_TIP_ENV]: head, [HAND_MEASURE_ENV]: "1" } });
records = readSuiteRecords({ root: fixture.main });
const measureRecord = records.find((record) => record.trigger === "measure");
const configPinned = RECORD_SCHEMA === 1 && RECORD_FILE_ENV === "NANA_SUITE_RECORD_FILE"
	&& STORE_SUBPATH === "nana/suite-runs" && SUITE_RECORDS_KEEP === 300
	&& SLOWER_MIN_SECONDS === 10 && SLOWER_MIN_RATIO === 1.5 && SLOWER_LIST_MAX === 5
	&& RECORD_LINE_PREFIX === "suite record:" && JSON.stringify(RECORD_TRIGGERS) === JSON.stringify(["land", "measure", "run"]);
// req: R-2547
check("R-2547: an unfiltered locked run stores one record naming HEAD, the main merge base, the dirty count, the trigger, the final exit code and the land tip under the git common directory, and keeps only the newest records",
	ordinary.result.status === 0 && ordinaryRecord?.tip === head && ordinaryRecord?.mergeBase === head
		&& ordinaryRecord?.dirty === 2 && ordinaryRecord?.trigger === "run" && ordinaryRecord?.exitCode === 0
		&& ordinaryRecord?.landTip === null && !!ordinaryName && !ordinaryName.includes(":")
		&& ordinaryName?.includes(`_${head}_`) && listJson(store).length === SUITE_RECORDS_KEEP
		&& land.result.status === 0 && landRecord?.exitCode === 0 && landRecord?.landTip === head
		&& JSON.stringify(rerunLabels) === JSON.stringify(["FAIL", "PASS"])
		&& measure.result.status === 0 && measureRecord?.trigger === "measure"
		&& records.every((record) => record.schema === RECORD_SCHEMA) && configPinned,
	JSON.stringify({ ordinary: ordinary.result.status, ordinaryOut: `${ordinary.result.stdout}${ordinary.result.stderr}`, ordinaryRecord, land: land.result.status, landOut: `${land.result.stdout}${land.result.stderr}`, landRecord, measure: measure.result.status, measureOut: `${measure.result.stdout}${measure.result.stderr}`, count: listJson(store).length }));

const beforeNoRecord = snapshot(store);
const logStart = fakeLogEntries().length;
const filtered = runCase({ args: ["packages/probe/tests/example.test.mjs"] });
const jobsFiltered = runCase({ args: ["--jobs=2"] });
const stopped = [];
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) stopped.push(runCase({ mode: "wait", extraEnv: { NANA_EMIT_SIGNAL: signal } }));
const noRecordLogs = fakeLogEntries().slice(logStart);
const afterNoRecord = snapshot(store);
// req: R-2548
check("R-2548: filtered and stopped locked runs store no record",
	filtered.result.status === 0 && jobsFiltered.result.status === 0
		&& stopped.map((entry) => entry.result.status).join(",") === "130,143,129"
		&& JSON.stringify(beforeNoRecord) === JSON.stringify(afterNoRecord)
		&& noRecordLogs.slice(0, 2).every((entry) => entry.knob === null),
	JSON.stringify({ filtered: filtered.result.status, jobs: jobsFiltered.result.status, stopped: stopped.map((entry) => entry.result.status), logs: noRecordLogs }));

const problemResults = [];
for (const exit of [0, 1]) {
	problemResults.push(runCase({ exit, mode: "missing" }));
	problemResults.push(runCase({ exit, mode: "garbage" }));
	const notRepo = path.join(TD, `not-repo-${exit}`); fs.mkdirSync(notRepo, { recursive: true });
	problemResults.push(runCase({ cwd: notRepo, exit }));
	const blocker = path.join(TD, `temp-blocker-${exit}`); fs.writeFileSync(blocker, "plain file");
	problemResults.push(runCase({ exit, tempRoot: path.join(blocker, "child") }));
}
// Make the actual store path unstorable only after all checks that need its earlier records.
fs.rmSync(store, { recursive: true, force: true });
fs.mkdirSync(path.dirname(store), { recursive: true });
fs.writeFileSync(store, "plain file");
for (const exit of [0, 1]) problemResults.push(runCase({ exit }));
fs.rmSync(store, { force: true });

// The real runner's own guarded write is exercised in a tiny temporary root. A plain file as the
// knob's parent produces ENOTDIR after every test has run, without changing either suite verdict.
function runnerFixture(name, exit) {
	const root = path.join(TD, name);
	fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
	fs.mkdirSync(path.join(root, "packages", "nana-pack", "lib"), { recursive: true });
	fs.mkdirSync(path.join(root, "packages", "probe", "tests"), { recursive: true });
	fs.copyFileSync(RUNNER, path.join(root, "scripts", "test.mjs"));
	for (const file of ["runtime-map-config.mjs", "suite-records-config.mjs", "land-config.mjs", "windows-skips-config.mjs", "test-runner-config.mjs"])
		fs.copyFileSync(path.join(REPO, "packages", "nana-pack", "lib", file), path.join(root, "packages", "nana-pack", "lib", file));
	fs.writeFileSync(path.join(root, "packages", "probe", "tests", "fixture.test.mjs"), `console.log("PASS fixture ran"); process.exitCode = ${exit};\n`);
	const plain = path.join(root, "plain"); fs.writeFileSync(plain, "file");
	return spawnSync(process.execPath, [path.join(root, "scripts", "test.mjs")], {
		cwd: root,
		env: { ...process.env, [RECORD_FILE_ENV]: path.join(plain, "record.json") },
		encoding: "utf8",
		timeout: CASE_LIMIT_MS,
	});
}
const realRunnerPass = runnerFixture("runner-pass", 0);
const realRunnerFail = runnerFixture("runner-fail", 1);
const problemOk = problemResults.every((entry, index) => {
	const expected = index < 8 ? Math.floor(index / 4) : index - 8;
	const out = `${entry.result.stdout ?? ""}${entry.result.stderr ?? ""}`;
	return entry.result.status === expected && out.includes(RECORD_LINE_PREFIX);
});
// req: R-2553
check("R-2553: a missing, unreadable, unwritable or unstorable record keeps the locked run's exit code and names why",
	problemOk && realRunnerPass.status === 0 && realRunnerFail.status === 1
		&& `${realRunnerPass.stdout}${realRunnerPass.stderr}`.includes(RECORD_LINE_PREFIX)
		&& `${realRunnerFail.stdout}${realRunnerFail.stderr}`.includes(RECORD_LINE_PREFIX),
	JSON.stringify({ locked: problemResults.map((entry) => entry.result.status), runner: [realRunnerPass.status, realRunnerFail.status] }));

const realStoreAfter = snapshot(realStore);
if (JSON.stringify(realStoreBefore) !== JSON.stringify(realStoreAfter)) {
	console.log("FAIL fixture runs changed the real suite-record store");
	failures++;
}
fs.rmSync(TD, { recursive: true, force: true });
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exitCode = failures ? 1 : 0;
