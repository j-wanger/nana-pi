/**
 * @module packages/nana-pack/tests/land-ci-records.test.mjs
 * @purpose Pin the post-merge CI-record read, retention, slow-file notes, failures, and total read budget.
 * @inputs nana-land, the CI-record keeper, isolated Git repositories, and fake GitHub responses and downloads.
 * @outputs Seven requirement-tagged PASS or FAIL checks and a nonzero exit when one fails.
 * @effects disk (temporary Git repositories and CI-record stores), process (Git commands).
 * @errors Reports the requirement title whose land CI-record behavior differs and exits nonzero.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as nanaLand from "../bin/nana-land.mjs";
import { keepLandCiRecords } from "../lib/land-ci-records.mjs";
import { CI_READ_TIMEOUT_MS, CI_RECORDS_BUDGET_MS, LAND_NOTE_PREFIX } from "../lib/land-config.mjs";
import { CI_ARTIFACT_PREFIX, CI_RECORDS_KEEP, CI_SLOW_SHARE, CI_STORE_SUBPATH, RECORD_SCHEMA, SLOWEST_LIST_MAX } from "../lib/suite-records-config.mjs";
import { readSuiteRecords, storeSuiteRecord, suiteRecordStamp, suiteRecordsDir } from "../lib/suite-records.mjs";
import { withReviewLedgerLock } from "../bin/review-round.mjs";
import { ciFixture, ensureCiReview, git, gitRunner, runList, workflowRun } from "./land-fixtures.mjs";
import { tmpDir } from "./tmp-dir.mjs";

let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); }
	catch (error) { failures++; console.log("FAIL", title, error.stack ?? error.message); }
};
const run = (id = 501, overrides = {}) => workflowRun({ id, run_number: id, path: ".github/workflows/ci.yml", ...overrides });
const artifact = (id, leg, attempt, createdAt) => ({ id, name: `${CI_ARTIFACT_PREFIX}${leg}-${attempt}`, expired: false, created_at: createdAt });
const record = (options = {}) => {
	const platform = options.platform ?? "darwin", files = options.files ?? [{ path: "one.test.mjs", label: "PASS", seconds: 2 }];
	const fileTimeoutMs = Object.hasOwn(options, "fileTimeoutMs") ? options.fileTimeoutMs : 200_000;
	return { schema: RECORD_SCHEMA, files, unnamedFailures: [], exitCode: files.some((file) => file.label === "FAIL") ? 1 : 0,
		wallSeconds: files.reduce((sum, file) => sum + Number(file.seconds || 0), 0), jobs: 4, platform, coverage: false,
		...(fileTimeoutMs === undefined ? {} : { fileTimeoutMs }) };
};
const stateOf = (items, { runId = 501, event = "pull_request" } = {}) => {
	const runValue = run(runId, { event, run_attempt: Math.max(...items.map((item) => item.attempt)) });
	return {
		runs: [runValue],
		artifacts: { [runId]: { total_count: items.length, artifacts: items.map((item, index) => artifact(9000 + index, item.leg, item.attempt, item.createdAt)) } },
		jobs: { [runId]: { total_count: items.length, jobs: items.map((item, index) => ({ id: 8000 + index, name: `suite (${item.leg})`, run_attempt: item.attempt, status: "completed", conclusion: "success", started_at: item.createdAt })) } },
		downloads: { [runId]: Object.fromEntries(items.map((item) => [`${CI_ARTIFACT_PREFIX}${item.leg}-${item.attempt}`, item.value])) },
	};
};
const defaultState = () => stateOf([{ leg: "macos-latest", attempt: 1, createdAt: "2026-10-23T01:02:03Z", value: record() }]);

function ghRunner(state, { events = [], failDownloads = false, throwAfter = Infinity } = {}) {
	let calls = 0;
	return (cwd, args, options = {}) => {
		calls++; events.push({ kind: "gh", cwd, args, options });
		if (calls > throwAfter) throw new Error("injected records runner throw");
		if (args[0] === "api") {
			const endpoint = args.at(-1);
			if (/\/actions\/runs\?/.test(endpoint)) return { status: 0, stdout: runList(state.runs), stderr: "" };
			const match = /\/runs\/(\d+)\/(artifacts|jobs)\?/.exec(endpoint);
			if (!match) return { status: 9, stdout: "", stderr: "unexpected endpoint" };
			return { status: 0, stdout: JSON.stringify(state[match[2]]?.[match[1]] ?? { [match[2]]: [] }), stderr: "" };
		}
		if (args[0] === "run" && args[1] === "download") {
			if (failDownloads) return { status: 1, stdout: "", stderr: "download missing\r\nsecond line" };
			const repo = args[args.indexOf("--repo") + 1];
			if (options.env?.GH_HOST && repo !== "github.com/example/fixture") return { status: 1, stdout: "", stderr: "wrong host\n" };
			const runId = args[2], name = args[args.indexOf("--name") + 1], dir = args[args.indexOf("--dir") + 1];
			const value = state.downloads?.[runId]?.[name];
			if (!value) return { status: 1, stdout: "", stderr: "not found\n" };
			fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, "nana-suite-record.json"), JSON.stringify(value));
			return { status: 0, stdout: "", stderr: "" };
		}
		return { status: 9, stdout: "", stderr: "unexpected command" };
	};
}

function land(state, options = {}) {
	const fixture = ciFixture(`records-${Math.random().toString(16).slice(2)}`); ensureCiReview(fixture);
	const events = options.events ?? [];
	const baseGh = options.runGh ?? ghRunner(state, { events, failDownloads: options.failDownloads, throwAfter: options.throwAfter });
	const runGit = options.runGit ?? ((cwd, args) => { events.push({ kind: "git", cwd, args }); return gitRunner(cwd, args); });
	const lock = options.withReviewLedgerLock ?? ((home, step) => withReviewLedgerLock(home, (rows) => { events.push({ kind: "lock-enter" }); const value = step(rows); events.push({ kind: "lock-exit" }); return value; }));
	const suite = options.runCommand ?? (() => { events.push({ kind: "suite" }); return { status: 0, stdout: "", stderr: "" }; });
	const release = options.readReleaseStatus ?? (() => { events.push({ kind: "release" }); return { line: "ready" }; });
	const result = nanaLand.runLand({ tree: fixture.feature, main: fixture.main, suite: "injected", reviewed: fixture.reviewed, home: fixture.home,
		runGit, runGh: baseGh, runCommand: suite, withReviewLedgerLock: lock, readReleaseStatus: release,
		...(Object.hasOwn(options, "keepLandCiRecords") ? { keepLandCiRecords: options.keepLandCiRecords } : {}),
	});
	return { fixture, events, ...result };
}
const ciNotes = (text) => text.split(/\r?\n/).filter((line) => line.startsWith(`${LAND_NOTE_PREFIX} note: CI records`));
const assertLandedWithOneRecordsNote = (out, pattern) => {
	assert.equal(out.code, 0, out.text); assert.equal(git(out.fixture.main, "rev-parse", "HEAD"), out.fixture.tip);
	assert.match(out.text, /push command:/); assert.doesNotMatch(out.text, /refused:/); assert.equal(ciNotes(out.text).length, 1, out.text); assert.match(ciNotes(out.text)[0], pattern);
};

// req: R-2750
check("R-2750: after the merge, its containment check and outside the ledger lock, the land reads the tip's CI records from github.com in its gh environment and prints the reader's lines", () => {
	const oldHost = process.env.GH_HOST, oldColor = process.env.CLICOLOR_FORCE, oldTty = process.env.GH_FORCE_TTY;
	try {
		process.env.GH_HOST = "example.invalid"; process.env.CLICOLOR_FORCE = "1"; process.env.GH_FORCE_TTY = "1";
		const out = land(defaultState()); assert.equal(out.code, 0, out.text);
		const gh = out.events.filter((event) => event.kind === "gh"); assert(gh.length > 1); const firstRecords = out.events.indexOf(gh[1]);
		const lastLockExit = out.events.map((event) => event.kind).lastIndexOf("lock-exit");
		const containment = out.events.findIndex((event) => event.kind === "git" && event.args.join(" ").includes(`merge-base --is-ancestor ${out.fixture.tip} refs/heads/main`));
		assert(lastLockExit < firstRecords && containment < firstRecords && out.events.findIndex((event) => event.kind === "release") < firstRecords);
		for (const event of gh.slice(1)) { assert.equal(event.options.env.CLICOLOR_FORCE, "0"); assert.equal(Object.hasOwn(event.options.env, "GH_FORCE_TTY"), false); assert.notEqual(event.options.env, process.env); }
		assert.match(out.text, /ci record: darwin macos-latest run 501 attempt 1/); assert.match(out.text, /ci record: 1 records from 1 CI runs/);
		assert(out.text.indexOf("ci: ") < out.text.indexOf("ci record:")); assert(out.text.indexOf("ci record:") < out.text.indexOf("push command:"));
		const failed = land(defaultState(), { runCommand: () => ({ status: 7, stdout: "", stderr: "suite red\t" }) });
		assert.equal(failed.code, 1); assert.equal(failed.events.filter((event) => event.kind === "gh").length, 1);
	} finally {
		for (const [key, value] of [["GH_HOST", oldHost], ["CLICOLOR_FORCE", oldColor], ["GH_FORCE_TTY", oldTty]]) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
	}
});

// req: R-2751
check("R-2751: each CI record read at a land is kept once in the clone's ci-runs store with its tip, run, attempt, leg, event and time, never among local suite records", () => {
	const fixture = ciFixture("store");
	const items = [
		{ leg: "macos-latest", attempt: 1, createdAt: "2026-10-23T01:00:00Z", value: record({ platform: "darwin" }) },
		{ leg: "macos-latest", attempt: 2, createdAt: "2026-10-23T02:00:00Z", value: record({ platform: "darwin" }) },
		{ leg: "ubuntu-latest", attempt: 1, createdAt: "2026-10-23T03:00:00Z", value: record({ platform: "linux" }) },
		{ leg: "windows-latest", attempt: 1, createdAt: "2026-10-23T03:00:00Z", value: record({ platform: "win32" }) },
	];
	const state = stateOf(items); const originalPid = Object.getOwnPropertyDescriptor(process, "pid");
	try {
		Object.defineProperty(process, "pid", { ...originalPid, value: 11111 });
		const first = keepLandCiRecords({ main: fixture.main, tip: fixture.tip, runGh: ghRunner(state) }); assert.equal(first.records, 4, JSON.stringify(first));
		Object.defineProperty(process, "pid", { ...originalPid, value: 22222 });
		const second = keepLandCiRecords({ main: fixture.main, tip: fixture.tip, runGh: ghRunner(state) }); assert.equal(second.records, 4, JSON.stringify(second));
	} finally { Object.defineProperty(process, "pid", originalPid); }
	const dir = suiteRecordsDir(fixture.main, { subpath: CI_STORE_SUBPATH }); const names = fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort();
	const expected = items.map((item) => `${suiteRecordStamp(item.createdAt)}_${fixture.tip}_501-${item.leg}-${item.attempt}.json`).sort(); assert.deepEqual(names, expected);
	for (const [index, name] of names.entries()) {
		const value = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")); const item = items.find((entry) => name.includes(`501-${entry.leg}-${entry.attempt}.json`));
		assert.equal(value.tip, fixture.tip); assert.equal(value.recordedAt, item.createdAt); assert.equal(value.ci.run, 501); assert.equal(value.ci.attempt, item.attempt); assert.equal(value.ci.leg, item.leg); assert.equal(value.ci.event, "pull_request"); assert.deepEqual(value.ci.artifact, state.artifacts[501].artifacts.find((entry) => entry.name.endsWith(`${item.leg}-${item.attempt}`))); assert(value.files.length > 0, String(index));
	}
	assert.equal(readSuiteRecords({ root: fixture.main }).length, 0);
});

// req: R-2752
check("R-2752: the ci-runs store keeps only the newest CI_RECORDS_KEEP records", () => {
	let received; const out = land(defaultState(), { keepLandCiRecords: (options) => { received = options; return { lines: [], notes: [], records: 0 }; } });
	assert.equal(out.code, 0, out.text); assert.equal(received.keep, CI_RECORDS_KEEP); assert.equal(received.budgetMs, CI_RECORDS_BUDGET_MS); assert.equal(received.share, CI_SLOW_SHARE);
	const fixture = ciFixture("retention"); const times = ["2026-10-23T03:00:00Z", "2026-10-23T01:00:00Z", "2026-10-23T02:00:00Z"];
	for (const [index, now] of times.entries()) storeSuiteRecord({ ...record(), tip: fixture.tip }, { root: fixture.main, subpath: CI_STORE_SUBPATH, keep: 2, now: () => new Date(now), pid: index });
	const names = fs.readdirSync(suiteRecordsDir(fixture.main, { subpath: CI_STORE_SUBPATH })).filter((name) => name.endsWith(".json")).sort();
	assert.deepEqual(names.map((name) => name.split("_")[0]), times.filter((_, index) => index !== 1).map(suiteRecordStamp).sort());
});

// req: R-2754
check("R-2754: a land notes each CI file at or above its share of the record's own per-file limit, slowest first and capped", () => {
	const limitSeconds = 200, boundary = CI_SLOW_SHARE * limitSeconds;
	const firstFiles = [
		{ path: "under.test.mjs", label: "PASS", seconds: boundary - 0.1 }, { path: "boundary.test.mjs", label: "PASS", seconds: boundary },
		{ path: "above.test.mjs", label: "PASS", seconds: boundary + 1 }, { path: "higher.test.mjs", label: "PASS", seconds: boundary + 40 },
		{ path: "skip.test.mjs", label: "SKIP", seconds: limitSeconds }, { path: "timeout.test.mjs", label: "FAIL", seconds: limitSeconds, cause: "timed out" },
	];
	const cappedFiles = Array.from({ length: SLOWEST_LIST_MAX + 2 }, (_, index) => ({ path: `cap-${index}.test.mjs`, label: "PASS", seconds: boundary + index + 1 }));
	const state = stateOf([
		{ leg: "macos-latest", attempt: 1, createdAt: "2026-10-23T01:00:00Z", value: record({ platform: "darwin", files: firstFiles, fileTimeoutMs: limitSeconds * 1000 }) },
		{ leg: "windows-latest", attempt: 1, createdAt: "2026-10-23T02:00:00Z", value: record({ platform: "win32", files: cappedFiles, fileTimeoutMs: limitSeconds * 1000 }) },
		{ leg: "ubuntu-latest", attempt: 1, createdAt: "2026-10-23T03:00:00Z", value: record({ platform: "linux", files: [{ path: "no-limit.test.mjs", label: "PASS", seconds: 999 }], fileTimeoutMs: undefined }) },
	]);
	const out = land(state); assert.equal(out.code, 0, out.text);
	const notes = out.text.split(/\r?\n/).filter((line) => line.startsWith(`${LAND_NOTE_PREFIX} note: slow CI file:`));
	assert.equal(notes.length, 4 + SLOWEST_LIST_MAX, out.text); assert(notes[0].includes("timeout.test.mjs") && notes[1].includes("higher.test.mjs") && notes[2].includes("above.test.mjs") && notes[3].includes("boundary.test.mjs"));
	const capped = notes.filter((line) => line.includes("windows-latest")); assert.equal(capped.length, SLOWEST_LIST_MAX); assert(capped[0].includes(`cap-${SLOWEST_LIST_MAX + 1}.test.mjs`)); assert(!out.text.includes("cap-0.test.mjs") && !out.text.includes("cap-1.test.mjs"));
	for (const line of notes) assert.match(line, /took .*s on (darwin|win32) .* run 501 attempt 1, .*% of its 200s limit/);
	assert(!out.text.includes("slow CI file: no-limit.test.mjs") && !out.text.includes("slow CI file: skip.test.mjs") && !out.text.includes("slow CI file: under.test.mjs"));
});

// req: R-2755
check("R-2755: a CI-record failure after the merge is one land note and the land still succeeds", () => {
	{
		let runLists = 0; const state = defaultState(); const base = ghRunner(state); const out = land(state, { runGh: (cwd, args, options) => {
			if (args[0] === "api" && /\/actions\/runs\?/.test(args.at(-1)) && ++runLists > 1) return { status: 1, stdout: "", stderr: "records list unavailable\t" };
			return base(cwd, args, options);
		} }); assertLandedWithOneRecordsNote(out, /not read.*records list unavailable/i);
	}
	assertLandedWithOneRecordsNote(land(defaultState(), { failDownloads: true }), /not read.*no readable record/i);
	{
		const out = (() => { const fixture = ciFixture("blocked-store"); const dir = suiteRecordsDir(fixture.main, { subpath: CI_STORE_SUBPATH }); fs.mkdirSync(path.dirname(dir), { recursive: true }); fs.writeFileSync(dir, "plain file"); ensureCiReview(fixture);
			const result = nanaLand.runLand({ tree: fixture.feature, main: fixture.main, suite: "injected", reviewed: fixture.reviewed, home: fixture.home, runGit: gitRunner, runGh: ghRunner(defaultState()), runCommand: () => ({ status: 0 }), readReleaseStatus: () => ({ line: "ready" }) }); return { fixture, ...result }; })();
		assertLandedWithOneRecordsNote(out, /not kept/i);
	}
	assertLandedWithOneRecordsNote(land(defaultState(), { throwAfter: 1 }), /failed|not read/i);
	assertLandedWithOneRecordsNote(land(defaultState(), { keepLandCiRecords: () => { throw new Error("injected keeper throw"); } }), /failed.*injected keeper throw/i);
	assertLandedWithOneRecordsNote(land(defaultState(), { keepLandCiRecords: () => ({}) }), /failed.*malformed/i);
	{
		const state = stateOf([
			{ leg: "macos-latest", attempt: 1, createdAt: "2026-10-23T01:00:00Z", value: record() },
			{ leg: "ubuntu-latest", attempt: 1, createdAt: "not a date", value: record({ platform: "linux" }) },
			{ leg: "windows-latest", attempt: 1, createdAt: "2026-10-23T03:00:00Z", value: record({ platform: "win32" }) },
		]);
		const out = land(state); assertLandedWithOneRecordsNote(out, /not kept: 1 of 3/i);
		assert.equal(readSuiteRecords({ root: out.fixture.main, subpath: CI_STORE_SUBPATH }).length, 2);
	}
});

// req: R-2756
check("R-2756: the CI-record read starts no gh call past its budget and gives each call a whole-millisecond limit within the time left", () => {
	const fixture = ciFixture("budget"); const budget = CI_READ_TIMEOUT_MS * 2;
	const exercise = (step) => {
		let time = 0; const limits = []; const state = defaultState(); const base = ghRunner(state);
		const result = keepLandCiRecords({ main: fixture.main, tip: fixture.tip, budgetMs: budget, now: () => time, runGh: (cwd, args, options) => { limits.push(options.timeoutMs); const answer = base(cwd, args, options); time += step; return answer; } });
		assert(limits.every((value) => Number.isInteger(value) && value >= 1 && value <= CI_READ_TIMEOUT_MS)); return { limits, result };
	};
	const stepped = exercise(25_000); assert.deepEqual(stepped.limits, [CI_READ_TIMEOUT_MS, CI_READ_TIMEOUT_MS, budget - 50_000]); assert.equal(ciNotes(stepped.result.notes.join("\n")).length, 1); assert.match(stepped.result.notes.join("\n"), /budget/i);
	const equal = exercise(budget / 2); assert.equal(equal.limits.length, 2); assert.equal(ciNotes(equal.result.notes.join("\n")).length, 1);
	const fractional = exercise(budget - 1.5); assert.deepEqual(fractional.limits, [CI_READ_TIMEOUT_MS, 2]);
	const fast = exercise(100); assert.equal(fast.result.notes.filter((line) => line.includes("budget")).length, 0);
	const empty = tmpDir(path.join(os.tmpdir(), "land-gh-empty-")); let answer; assert.doesNotThrow(() => { answer = nanaLand.ghDefault()(fixture.main, ["--version"], { env: { PATH: empty }, timeoutMs: 1500.5 }); }); assert.equal(answer?.error?.code, "ERR_OUT_OF_RANGE");
});

// req: R-2751
// req: R-2752
// req: R-2754
// req: R-2756
check("seal: CI records are kept in nana/ci-runs up to 4000, files are noted at half their limit, and the read stops after 60 seconds", () => {
	assert.equal(CI_STORE_SUBPATH, "nana/ci-runs", "R-2751"); assert.equal(CI_RECORDS_KEEP, 4000, "R-2752"); assert.equal(CI_SLOW_SHARE, 0.5, "R-2754"); assert.equal(CI_RECORDS_BUDGET_MS, 60_000, "R-2756");
});

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exitCode = failures ? 1 : 0;
