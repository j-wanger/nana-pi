/**
 * @module packages/nana-pack/tests/land-ci-suite.test.mjs
 * @purpose Pin CI suite substitution, fail-closed fallback, refusal, and land-record readers.
 * @inputs Isolated reviewed repositories, injected platform, gh responses, clocks and suite commands.
 * @outputs Requirement-tagged PASS/FAIL lines and a nonzero failure exit.
 * @effects disk (OS-temp git fixtures and artifact downloads), process (git).
 * @errors Failed assertions name the violated requirement.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import * as config from "../lib/land-config.mjs";
import { landReportLines, readLandLedger, landRecordsPath, renderLandRecordLine } from "../lib/land-records.mjs";
import { LAND_SUITE_SOURCES } from "../lib/land-records-config.mjs";
import { artifactGh, ciFixture, commit, executeCi, git, gitRunner, workflowRun } from "./land-fixtures.mjs";

let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); }
	catch (error) { failures++; console.log("FAIL", title, error.stack ?? error.message); }
};
const run = (overrides = {}) => workflowRun({ path: ".github/workflows/ci.yml", ...overrides });
const item = (record = {}, identity = {}) => ({ run: 101, leg: "macos-latest", attempt: 1,
	record: { schema: 1, platform: "darwin", filters: [], files: [{ path: "one.test.mjs", label: "PASS", seconds: 1 }], exitCode: 0, jobs: 4, wallSeconds: 1, ...record }, ...identity });

// Use the real artifact reader through the fixture's external gh seam.
function exercise(items = [item()], { runs = [run()], changed, diffText, runGh, ...options } = {}) {
	const fixture = ciFixture("suite-proof", { workflowOnMain: true });
	if (changed) {
		fs.mkdirSync(path.dirname(path.join(fixture.feature, changed)), { recursive: true });
		fixture.tip = commit(fixture.feature, changed, "changed\n", "change proof input");
	}
	let calls = 0;
	const out = executeCi(fixture, runs, { platform: "darwin", runGh: runGh ?? artifactGh(runs, items),
		runGit: (cwd, args) => diffText !== undefined && args[0] === "diff" && args.includes("--name-only") ? { status: 0, stdout: diffText } : gitRunner(cwd, args),
		runCommand: () => { calls++; return { status: 0, stdout: "" }; }, ...options });
	const common = path.resolve(fixture.main, git(fixture.main, "rev-parse", "--git-common-dir"));
	const records = readLandLedger(landRecordsPath(common)).records;
	return { ...out, fixture, calls, end: records.at(-1), records };
}

// req: R-3430
check("R-3430: passing same-platform full-suite CI replaces the local suite and records its source", () => {
	const out = exercise(); assert.equal(out.code, 0, out.text); assert.equal(out.calls, 0);
	assert.deepEqual(out.text.split(/\r?\n/).filter((line) => line.startsWith("suite:")), ["suite: ci run 101 attempt 1 platform darwin"]);
	assert.equal(out.end.suite, "ci"); assert.equal(out.end.suiteMs, null);
	assert.equal(git(out.fixture.main, "rev-parse", "HEAD"), out.fixture.tip);
	const injected = exercise([item({ platform: "linux" })], { platform: "linux" });
	assert.equal(injected.code, 0, injected.text); assert.equal(injected.calls, 0);
	assert.match(injected.text, /^suite: ci run 101 attempt 1 platform linux$/m);
});

// req: R-3431
check("R-3431: unproven full-suite CI falls back once, while a carried rerun leg qualifies", () => {
	const old = item(); delete old.record.filters;
	const cases = [
		["no record", []], ["other platform", [item({ platform: "win32" })]],
		["nonzero", [item({ exitCode: 1 })]], ["filtered", [item({ filters: ["land"] })]],
		["old schema-1 record", [old]], ["empty", [item({ files: [] })]],
		["superseded", [item({}, { run: 100 })]],
		["later failed attempt", [item(), item({ exitCode: 1 }, { attempt: 2 })]],
		["two darwin legs", [item(), item({ exitCode: 1 }, { leg: "macos-13" })]],
	];
	for (const [label, items] of cases) {
		const out = exercise(items, { runs: [run({ id: 100, run_number: 0 }), run({ run_attempt: 2 })] });
		assert.equal(out.code, 0, `${label}: ${out.text}`); assert.equal(out.calls, 1, label);
		assert.match(out.text, /^suite: local .+/m, label); assert.equal(out.end.suite, "local"); assert(out.end.suiteWhy, label);
	}
	const runs = [run({ run_attempt: 2 })];
	const failed = exercise([item()], { runs, runGh: artifactGh(runs, [item()], { failure: true }) });
	assert.equal(failed.code, 0, failed.text); assert.equal(failed.calls, 1); assert.match(failed.text, /^suite: local .+/m);
	let time = 0;
	const budget = exercise([item()], { recordsNow: () => time, runGh: artifactGh([run()], [item()], { afterCall: (args) => { if (args[0] === "run") time += config.CI_RECORDS_BUDGET_MS + 1; } }) });
	assert.equal(budget.code, 0, budget.text); assert.equal(budget.calls, 1); assert.match(budget.text, /^suite: local .*budget/m);
	const carried = exercise([item()], { runs }); assert.equal(carried.code, 0, carried.text); assert.equal(carried.calls, 0);
});

// req: R-3432
check("R-3432: changed workflow or runner forces local coverage, but other scripts do not", () => {
	for (const changed of [".github/workflows/ci.yml", "scripts/test.mjs"]) {
		const out = exercise([item()], { changed }); assert.equal(out.code, 0, out.text); assert.equal(out.calls, 1);
		assert.match(out.text, /^suite: local the lane changes the CI workflow or test runner$/m);
	}
	const other = exercise([item()], { changed: "scripts/other.mjs" }); assert.equal(other.code, 0, other.text); assert.equal(other.calls, 0);
	const renamed = ciFixture("suite-rename", { workflowOnMain: true });
	fs.mkdirSync(path.join(renamed.main, "scripts"), { recursive: true });
	fs.writeFileSync(path.join(renamed.main, "scripts/test.mjs"), "console.log('suite');\\n");
	git(renamed.main, "add", "scripts/test.mjs"); git(renamed.main, "commit", "-m", "add test runner");
	git(renamed.feature, "reset", "--hard", "main");
	execFileSync("git", ["mv", "scripts/test.mjs", "scripts/runner.mjs"], { cwd: renamed.feature });
	git(renamed.feature, "commit", "-m", "rename test runner");
	renamed.tip = git(renamed.feature, "rev-parse", "HEAD");
	let renameCalls = 0;
	const renamedOut = executeCi(renamed, [run()], { platform: "darwin", runGh: artifactGh([run()], [item()]), runCommand: () => { renameCalls++; return { status: 0, stdout: "" }; } });
	assert.equal(renamedOut.code, 0, renamedOut.text); assert.equal(renameCalls, 1);
	assert.match(renamedOut.text, /^suite: local the lane changes the CI workflow or test runner$/m);
	// Line-reader variants include CRLF, trailing space/tab, and no final newline.
	for (const diffText of [".github/workflows/ci.yml\r\n", "scripts/test.mjs \t\n", "scripts/test.mjs"]) {
		const out = exercise([item()], { diffText }); assert.equal(out.code, 0, out.text); assert.equal(out.calls, 1);
	}
});

// req: R-3434
check("R-3434: unreadable, absent, unfinished and unsuccessful CI refuse before any suite", () => {
	let calls = 0;
	const bad = exercise([item()], { runGh: () => { calls++; return { status: 4, stderr: "signed out\r\nsecond line\t" }; } });
	assert.equal(bad.code, 1); assert.equal(bad.calls, 0); assert.equal(calls, 1 + config.CI_RUN_LIST_RETRIES);
	assert.match(bad.text, /^refused: gh CI read failed \(exit 4\): signed out\n/);
	for (const error of [Object.assign(new Error("missing"), { code: "ENOENT" }), Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })]) {
		let reads = 0; const out = exercise([item()], { runGh: () => { reads++; return { status: null, error }; } });
		assert.equal(out.code, 1); assert.equal(out.calls, 0); assert.equal(reads, 1);
	}
	for (const overrides of [{ conclusion: "cancelled" }, { conclusion: "failure" }, { status: "queued", conclusion: null }]) {
		const out = exercise([item()], { runs: [run(overrides)] }); assert.equal(out.code, 1); assert.equal(out.calls, 0);
		assert.match(out.text, /refused: CI at .*ci run 101 attempt 1 is/);
	}
	const absent = exercise([item()], { runs: [] }); assert.equal(absent.code, 1); assert.equal(absent.calls, 0); assert.match(absent.text, /refused: no CI run/);
});

// req: R-3435
check("R-3435: land readers distinguish CI, local and legacy suite times without changing old lines", () => {
	const fixture = ciFixture("suite-no-ci", { origin: null, workflowOnTip: false });
	const out = executeCi(fixture, []); assert.equal(out.code, 0, out.text); assert.equal(out.suiteRan, true);
	const common = path.resolve(fixture.main, git(fixture.main, "rev-parse", "--git-common-dir"));
	const local = readLandLedger(landRecordsPath(common)).records.at(-1); assert.equal(local.ci, "skipped"); assert.equal(local.suite, "local");
	assert.match(out.text, /^suite: local no origin remote$/m);
	const start = { v: 1, kind: "start", attempt: "a", startedAt: "2026-11-01T00:00:00Z", lane: "proof", tip: "a".repeat(40) };
	const end = { v: 1, kind: "end", attempt: "a", endedAt: "2026-11-01T00:01:00Z", outcome: "landed", stage: null, reason: null, durationMs: 60000, suiteMs: 60000, ciWaitMs: null };
	const oldLine = "land 2026-11-01T00:00:00Z | lane proof | landed | stage - | reason - | 1 min total | suite 1 min | CI wait - | tip aaaaaaaa";
	assert.equal(landReportLines([start, end]).lines[0], oldLine);
	assert.equal(renderLandRecordLine(end, "lane"), "[nana-land] land record: landed, stage -, 1 min total, 1 min suite, - CI wait; lane");
	assert.equal(landReportLines([start, { ...end, suite: "local" }]).lines[0], oldLine);
	const ci = { ...end, suite: "ci", suiteMs: null };
	assert.equal(landReportLines([start, ci]).lines[0], oldLine.replace("suite 1 min", "suite ci"));
	assert.equal(renderLandRecordLine(ci, "lane"), "[nana-land] land record: landed, stage -, 1 min total, suite ci, - CI wait; lane");
	assert.equal(landReportLines([start, ci]).lines[1], "land lane proof | 1 attempt | 1 landed | 1 min total | 0 min suite | last landed CI wait -");
});

// req: R-3430 R-3432 R-3434 R-3435
check("seal: CI suite prefix, fallback paths and one run-list retry are declared once", () => {
	assert.deepEqual(LAND_SUITE_SOURCES, ["ci", "local"], "R-3435");
	assert.equal(config.CI_RUN_LIST_RETRIES, 1, "R-3434");
	assert.deepEqual(config.SUITE_FALLBACK_PATHS, [".github/workflows/", "scripts/test.mjs"], "R-3432");
	assert.equal(config.SUITE_LINE_PREFIX, "suite:", "R-3430");
	assert.equal(config.SUITE_CHANGED_REASON, "the lane changes the CI workflow or test runner", "R-3432");
});
process.exitCode = failures ? 1 : 0;
