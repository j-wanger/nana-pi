/**
 * @module packages/nana-pack/tests/suite-records.test.mjs
 * @purpose Pin whole-run suite records at the runner-to-locked-suite boundary.
 * @inputs The real locked suite and runner, temporary git repositories, injected suite commands, locks, platforms, and record paths.
 * @outputs Nine requirement-tagged PASS or FAIL checks and a nonzero exit when one fails.
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
	'if (process.env.NANA_FAKE_NOW) options.now = () => process.env.NANA_FAKE_NOW;',
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
	'const supplied = process.env.NANA_FAKE_RECORD ? JSON.parse(process.env.NANA_FAKE_RECORD) : null;',
	'const record = supplied ?? { schema: RECORD_SCHEMA, files: [{ path: file, label, seconds: covered ? 2 : 1, ...(label === "FAIL" ? { cause: `exit ${coverageFailure ? 1 : selectedExit}` } : {}) }], unnamedFailures: [], exitCode: coverageFailure ? 1 : selectedExit, wallSeconds: covered ? 2 : 1, jobs: 1, platform: process.platform, coverage: covered };',
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
function runCase({ args = [], cwd = fixture.linked, exit = 0, mode = "pass", extraEnv = {}, tempRoot, platform = "darwin", now } = {}) {
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
		...(now ? { NANA_FAKE_NOW: now } : {}),
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
const outputOf = (entry) => `${entry.result.stdout ?? ""}${entry.result.stderr ?? ""}`;
const recordLinesOf = (entry) => outputOf(entry).split(/\r?\n/).filter((line) => line.includes(RECORD_LINE_PREFIX));
const runRecord = ({ files = [{ path: "pass.test.mjs", label: "PASS", seconds: 1 }], unnamedFailures = [], wallSeconds = 60, jobs = 1, coverage = false } = {}) => ({
	schema: RECORD_SCHEMA,
	files,
	unnamedFailures,
	exitCode: files.some((file) => file.label === "FAIL") || unnamedFailures.length ? 1 : 0,
	wallSeconds,
	jobs,
	platform: "darwin",
	coverage,
});

function comparisonRepo(name, { mainAhead = false, noMain = false, laneCommits = 1 } = {}) {
	const main = path.join(TD, name);
	const linked = path.join(TD, `${name}-linked`);
	fs.mkdirSync(main, { recursive: true });
	git(main, "init", "-q", "-b", "main");
	fs.writeFileSync(path.join(main, "history.txt"), "a\n");
	git(main, "add", ".");
	git(main, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "a");
	const parent = git(main, "rev-parse", "HEAD");
	fs.appendFileSync(path.join(main, "history.txt"), "b\n");
	git(main, "add", ".");
	git(main, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "b");
	const mergeBase = git(main, "rev-parse", "HEAD");
	git(main, "worktree", "add", "-q", "-b", `${name}-lane`, linked);
	const laneTips = [];
	for (let index = 0; index < laneCommits; index++) {
		fs.appendFileSync(path.join(linked, "lane.txt"), `${index}\n`);
		git(linked, "add", ".");
		git(linked, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", `lane-${index}`);
		laneTips.push(git(linked, "rev-parse", "HEAD"));
	}
	let offLane = null;
	if (mainAhead) {
		fs.appendFileSync(path.join(main, "history.txt"), "c\n");
		git(main, "add", ".");
		git(main, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "c");
		offLane = git(main, "rev-parse", "HEAD");
	}
	if (noMain) {
		git(main, "checkout", "-q", "--detach");
		git(main, "branch", "-D", "main");
	}
	const commonDir = path.resolve(linked, git(linked, "rev-parse", "--git-common-dir"));
	return { main, linked, parent, mergeBase, laneTips, head: git(linked, "rev-parse", "HEAD"), offLane, store: path.join(commonDir, ...STORE_SUBPATH.split("/")) };
}
let seededRecord = 0;
function seedRecord(repo, recordedAt, values = {}) {
	seededRecord++;
	fs.mkdirSync(repo.store, { recursive: true });
	const stamp = recordedAt.replace(/[-:.]/g, "");
	const record = {
		...runRecord(),
		tip: repo.mergeBase,
		mergeBase: repo.mergeBase,
		dirty: 0,
		trigger: "run",
		landTip: null,
		recordedAt,
		...values,
	};
	fs.writeFileSync(path.join(repo.store, `${stamp}_${record.tip}_${seededRecord}.json`), `${JSON.stringify(record)}\n`);
	return record;
}
function runCompared(repo, record, { now = "2026-01-01T06:00:00.000Z", exit = record.exitCode, extraEnv = {} } = {}) {
	return runCase({ cwd: repo.linked, now, exit, extraEnv: { NANA_FAKE_RECORD: JSON.stringify(record), ...extraEnv } });
}

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

const baselineRepo = comparisonRepo("baseline", { mainAhead: true });
seedRecord(baselineRepo, "2026-01-01T04:00:00.000Z", { tip: baselineRepo.parent, trigger: "run", wallSeconds: 99 });
seedRecord(baselineRepo, "2026-01-01T01:00:00.000Z", { tip: baselineRepo.mergeBase, trigger: "land", landTip: baselineRepo.mergeBase, coverage: true, wallSeconds: 20 });
seedRecord(baselineRepo, "2026-01-01T05:00:00.000Z", { tip: baselineRepo.mergeBase, dirty: 2, trigger: "run", wallSeconds: 88 });
seedRecord(baselineRepo, "2026-01-01T04:30:00.000Z", { tip: baselineRepo.mergeBase, trigger: "run", wallSeconds: 77 });
seedRecord(baselineRepo, "2026-01-01T05:30:00.000Z", { tip: baselineRepo.offLane, trigger: "land", landTip: baselineRepo.offLane, wallSeconds: 66 });
const baselineRun = runCompared(baselineRepo, runRecord({ wallSeconds: 30 }));
const baselineLine = recordLinesOf(baselineRun)[0] ?? "";
const noMainRepo = comparisonRepo("no-main", { noMain: true });
const noMainRun = runCompared(noMainRepo, runRecord());
const movedRepo = comparisonRepo("moved-main", { mainAhead: true });
const movedRun = runCompared(movedRepo, runRecord());
const nextLandRepo = comparisonRepo("next-land");
const nextLandRun = runCompared(nextLandRepo, runRecord());
// req: R-2549
check("R-2549: a locked run names the nearest clean baseline record, land first, or says none exists and what records one",
	baselineRun.result.status === 0 && baselineLine.includes(`baseline ${baselineRepo.mergeBase.slice(0, 8)}`)
		&& baselineLine.includes("age 5h") && baselineLine.includes("coverage yes")
		&& baselineLine.includes("wall 20s -> 30s") && !baselineLine.includes(baselineRepo.parent.slice(0, 8))
		&& outputOf(noMainRun).includes("no baseline exists") && outputOf(noMainRun).includes("no main branch")
		&& !outputOf(noMainRun).includes("git ")
		&& outputOf(movedRun).includes("merge main") && outputOf(nextLandRun).includes("next land records one"),
	JSON.stringify({ baseline: outputOf(baselineRun), noMain: outputOf(noMainRun), moved: outputOf(movedRun), nextLand: outputOf(nextLandRun) }));

const classesRepo = comparisonRepo("classes");
seedRecord(classesRepo, "2026-01-01T01:00:00.000Z", { trigger: "land", landTip: classesRepo.mergeBase, files: [
	{ path: "coverage.test.mjs", label: "FAIL", seconds: 20, cause: "exit 1", coverage: true },
	{ path: "coverage.test.mjs", label: "PASS", seconds: 10, coverage: false },
	{ path: "old.test.mjs", label: "FAIL", seconds: 5, cause: "signal SIGTERM" },
] });
seedRecord(classesRepo, "2026-01-01T02:00:00.000Z", { tip: classesRepo.head, files: [{ path: "flaky.test.mjs", label: "PASS", seconds: 1 }] });
const classRecord = runRecord({ files: [
	{ path: "flaky.test.mjs", label: "FAIL", seconds: 2, cause: "exit 2" },
	{ path: "coverage.test.mjs", label: "FAIL", seconds: 22, cause: "timed out" },
	{ path: "old.test.mjs", label: "FAIL", seconds: 6, cause: "signal SIGTERM" },
	{ path: "new.test.mjs", label: "FAIL", seconds: 1, cause: "no passing check" },
] });
const classesRun = runCompared(classesRepo, classRecord, { exit: 1 });
const classesLast = recordLinesOf(classesRun).at(-1) ?? "";
const dirtyRepo = comparisonRepo("dirty-class");
seedRecord(dirtyRepo, "2026-01-01T01:00:00.000Z", { tip: dirtyRepo.head, files: [{ path: "dirty.test.mjs", label: "PASS", seconds: 1 }] });
fs.writeFileSync(path.join(dirtyRepo.linked, "untracked.test.mjs"), "untracked\n");
const dirtyRun = runCompared(dirtyRepo, runRecord({ files: [{ path: "dirty.test.mjs", label: "FAIL", seconds: 2, cause: "exit 1" }] }), { exit: 1 });
// req: R-2550
check("R-2550: a locked run sorts each failing file into passing in another clean run at this tip, failed only under coverage at the baseline, failing at the baseline too, or new",
	classesRun.result.status === 1
		&& classesLast.includes("flaky.test.mjs [passing in another clean run at this tip; exit 2]")
		&& classesLast.includes("coverage.test.mjs [failed only under coverage at baseline; timed out]")
		&& classesLast.includes("old.test.mjs [failing at baseline too; signal SIGTERM]")
		&& classesLast.includes("new.test.mjs [new; no passing check]")
		&& outputOf(dirtyRun).includes("dirty.test.mjs [new; exit 1]")
		&& !outputOf(dirtyRun).includes("dirty.test.mjs [passing in another clean run at this tip"),
	JSON.stringify({ classes: outputOf(classesRun), dirty: outputOf(dirtyRun) }));

const slowerRepo = comparisonRepo("slower");
const slowerBase = [
	["growth-60.test.mjs", 10, 70], ["growth-50.test.mjs", 10, 60], ["growth-40.test.mjs", 10, 50],
	["growth-30.test.mjs", 10, 40], ["growth-20.test.mjs", 10, 30], ["growth-10.test.mjs", 10, 20],
	["plus-12.test.mjs", 12, 24], ["plus-9.test.mjs", 4.5, 13.5], ["ratio-1_3.test.mjs", 50, 65],
];
seedRecord(slowerRepo, "2026-01-01T01:00:00.000Z", { trigger: "land", landTip: slowerRepo.mergeBase, jobs: 1, files: slowerBase.map(([file, seconds]) => ({ path: file, label: "PASS", seconds })) });
const slowerRun = runCompared(slowerRepo, runRecord({ jobs: 1, files: slowerBase.map(([file, , seconds]) => ({ path: file, label: "PASS", seconds })) }));
const slowerLine = recordLinesOf(slowerRun)[0] ?? "";
const jobsRepo = comparisonRepo("jobs");
seedRecord(jobsRepo, "2026-01-01T01:00:00.000Z", { trigger: "land", landTip: jobsRepo.mergeBase, jobs: 4, files: [{ path: "jobs.test.mjs", label: "PASS", seconds: 1 }] });
const jobsRun = runCompared(jobsRepo, runRecord({ jobs: 1, files: [{ path: "jobs.test.mjs", label: "PASS", seconds: 100 }] }));
// req: R-2551
check("R-2551: a locked run lists files slower than the baseline by the declared margins, largest first, and none when job counts differ",
	slowerRun.result.status === 0
		&& slowerLine.indexOf("growth-60.test.mjs") < slowerLine.indexOf("growth-50.test.mjs")
		&& slowerLine.indexOf("growth-50.test.mjs") < slowerLine.indexOf("growth-40.test.mjs")
		&& slowerLine.indexOf("growth-40.test.mjs") < slowerLine.indexOf("growth-30.test.mjs")
		&& slowerLine.indexOf("growth-30.test.mjs") < slowerLine.indexOf("growth-20.test.mjs")
		&& !slowerLine.includes("growth-10.test.mjs") && !slowerLine.includes("plus-12.test.mjs")
		&& !slowerLine.includes("plus-9.test.mjs") && !slowerLine.includes("ratio-1_3.test.mjs")
		&& (slowerLine.match(/\.test\.mjs/g) ?? []).length === SLOWER_LIST_MAX
		&& outputOf(jobsRun).includes("slower: none (job counts differ)"),
	JSON.stringify({ slower: outputOf(slowerRun), jobs: outputOf(jobsRun) }));

const landPrefixRepo = comparisonRepo("land-prefix");
const landPrefixRun = runCompared(landPrefixRepo, runRecord(), { extraEnv: { [LAND_TIP_ENV]: landPrefixRepo.head } });
const plainPrefixRun = runCompared(landPrefixRepo, runRecord(), { extraEnv: { [LAND_TIP_ENV]: landPrefixRepo.mergeBase } });
const landRecordLines = recordLinesOf(landPrefixRun);
const plainRecordLines = recordLinesOf(plainPrefixRun);
// req: R-2552
check("R-2552: a land's locked run prints its record lines with the land note prefix",
	landPrefixRun.result.status === 0 && landRecordLines.length > 0 && landRecordLines.every((line) => line.startsWith("[nana-land] "))
		&& plainPrefixRun.result.status === 0 && plainRecordLines.length > 0 && plainRecordLines.every((line) => !line.startsWith("[nana-land] ")),
	JSON.stringify({ land: outputOf(landPrefixRun), plain: outputOf(plainPrefixRun) }));

const shapeRepo = comparisonRepo("shape");
const passingShape = runCompared(shapeRepo, runRecord({ files: [{ path: "pass.test.mjs", label: "PASS", seconds: 1 }] }));
const unnamed = "tracked repository files changed by tests: generated.txt";
const failingShape = runCompared(shapeRepo, runRecord({ files: [
	{ path: "pass.test.mjs", label: "PASS", seconds: 1 },
	{ path: "first fail.test.mjs", label: "FAIL", seconds: 1, cause: "exit 2" },
	{ path: "second-fail.test.mjs", label: "FAIL", seconds: 1, cause: "timed out" },
], unnamedFailures: [unnamed] }), { exit: 1 });
const shapeLines = recordLinesOf(failingShape);
const shapeTail = outputOf(failingShape).trimEnd().split(/\r?\n/).slice(-2).join("\n");
// req: R-2554
check("R-2554: a locked run prints at most two record lines and the last restates the PASS and FAIL counts and every failed name",
	recordLinesOf(passingShape).length <= 2 && shapeLines.length <= 2
		&& shapeLines.at(-1)?.includes("1 PASS, 3 FAIL")
		&& shapeTail.includes("1 PASS, 3 FAIL") && shapeTail.includes("first fail.test.mjs")
		&& shapeTail.includes("second-fail.test.mjs") && shapeTail.includes(unnamed)
		&& shapeLines[0]?.includes("slower:"),
	JSON.stringify({ passing: outputOf(passingShape), failing: outputOf(failingShape) }));

const laneRepo = comparisonRepo("lane-total", { mainAhead: true, laneCommits: 3 });
seedRecord(laneRepo, "2026-01-01T01:00:00.000Z", { tip: laneRepo.laneTips[0], wallSeconds: 60 });
seedRecord(laneRepo, "2026-01-01T02:00:00.000Z", { tip: laneRepo.laneTips[1], wallSeconds: 120 });
seedRecord(laneRepo, "2026-01-01T03:00:00.000Z", { tip: laneRepo.laneTips[2], wallSeconds: 180 });
seedRecord(laneRepo, "2026-01-01T04:00:00.000Z", { tip: laneRepo.offLane, wallSeconds: 600 });
const laneRun = runCompared(laneRepo, runRecord({ wallSeconds: 60 }));
// req: R-2555
check("R-2555: a locked run names this lane's stored full-run count and minutes",
	laneRun.result.status === 0 && recordLinesOf(laneRun).at(-1)?.includes("this lane: 4 full runs, 7.0 min"),
	outputOf(laneRun));

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
