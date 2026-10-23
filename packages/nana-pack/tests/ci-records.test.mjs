/**
 * @module packages/nana-pack/tests/ci-records.test.mjs
 * @purpose Pin the CI suite-record reader from runner output through fake GitHub responses.
 * @inputs The root CI workflow, real test runner, ci-records library and CLI, and a fake gh command.
 * @outputs Six requirement-tagged PASS or FAIL checks and a nonzero exit when one fails.
 * @effects process (runs bounded runner, fake gh and CLI children), disk (temporary fixtures and downloaded artifacts).
 * @errors Reports the requirement title whose CI-record behavior differs and exits nonzero.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
	CI_ARTIFACT_PREFIX,
	CI_RECORD_LINE_PREFIX,
	CI_SUITE_JOB,
	CI_WORKFLOW_RUN_PATH,
	GH_COMMAND_ENV,
	GH_OUTPUT_MAX_BYTES,
	GH_PAGE_SIZE,
	RECORD_FILE_ENV,
	RECORD_SCHEMA,
	SLOWEST_LIST_MAX,
} from "../lib/suite-records-config.mjs";
import { readCiRecords } from "../lib/ci-records.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CLI = path.join(REPO, "scripts", "ci-records.mjs");
const RUNNER = path.join(REPO, "scripts", "test.mjs");
const WORKFLOW = fs.readFileSync(path.join(REPO, ".github", "workflows", "ci.yml"), "utf8");
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "ci-records-test-")));
const CASE_LIMIT_MS = 30_000;
const SHA = spawnSync("git", ["rev-parse", "HEAD"], { cwd: REPO, encoding: "utf8" }).stdout.trim();
const SHORT_SHA = SHA.slice(0, 9);
let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); }
	catch (error) { failures++; console.log("FAIL", title, error.stack ?? error.message); }
};

const FAKE_GH = path.join(TD, "fake-gh.mjs");
fs.writeFileSync(FAKE_GH, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	'const state = JSON.parse(fs.readFileSync(process.env.NANA_FAKE_GH_STATE, "utf8"));',
	'const args = process.argv.slice(2);',
	'const fail = (answer) => { if (answer.stdout) process.stdout.write(answer.stdout); if (answer.stderr) process.stderr.write(answer.stderr); process.exit(answer.status); };',
	'if (args[0] === "api") {',
	'  const endpoint = args.at(-1);',
	'  let answer;',
	'  if (/\\/actions\\/runs\\?/.test(endpoint)) {',
	'    if (!endpoint.includes(`head_sha=${state.sha}`)) fail({ status: 9, stdout: JSON.stringify({ message: "full sha required" }), stderr: "full sha required\\n" });',
	'    answer = state.runsFailure ?? { total_count: (state.runs ?? []).length, workflow_runs: state.runs ?? [] };',
	'  } else {',
	'    const run = /\\/runs\\/(\\d+)\\/(artifacts|jobs)\\?/.exec(endpoint);',
	'    if (!run) fail({ status: 9, stdout: JSON.stringify({ message: "unexpected endpoint" }), stderr: `unexpected endpoint ${endpoint}\\n` });',
	'    answer = state[run[2]]?.[run[1]] ?? { total_count: 0, [run[2]]: [] };',
	'  }',
	'  if (answer.failure) fail(answer.failure);',
	'  process.stdout.write(JSON.stringify(answer));',
	'} else if (args[0] === "run" && args[1] === "download") {',
	'  const id = args[2]; const repo = args[args.indexOf("--repo") + 1]; const name = args[args.indexOf("--name") + 1]; const dir = args[args.indexOf("--dir") + 1];',
	'  const run = (state.runs ?? []).find((item) => String(item.id) === id);',
	'  const artifact = state.artifacts?.[id]?.artifacts?.find((item) => item.name === name);',
	'  const answer = repo === "j-wanger/nana-pi" && run && artifact ? state.downloads?.[id]?.[name] : null;',
	'  if (!answer) fail({ status: 1, stdout: JSON.stringify({ message: "Not Found" }), stderr: "gh: Not Found (HTTP 404)\\n" });',
	'  if (answer.failure) fail(answer.failure);',
	'  fs.mkdirSync(dir, { recursive: true });',
	'  for (const file of answer.files ?? []) { const target = path.join(dir, file.name); if (file.source) fs.copyFileSync(file.source, target); else fs.writeFileSync(target, file.content ?? ""); }',
	'} else fail({ status: 9, stdout: JSON.stringify({ message: "unexpected command" }), stderr: `unexpected command ${args.join(" ")}\\n` });',
	"",
].join("\n"));

let stateNumber = 0;
function writeState(state) {
	const file = path.join(TD, `state-${++stateNumber}.json`);
	fs.writeFileSync(file, JSON.stringify({ sha: SHA, ...state }));
	return file;
}
const fakeCommand = Object.freeze([process.execPath, FAKE_GH]);
function runCli(state, rev = "HEAD", extraEnv = {}) {
	const stateFile = writeState(state);
	const result = spawnSync(process.execPath, [CLI, rev], {
		cwd: REPO,
		env: { ...process.env, [GH_COMMAND_ENV]: JSON.stringify(fakeCommand), NANA_FAKE_GH_STATE: stateFile, ...extraEnv },
		encoding: "utf8",
		timeout: CASE_LIMIT_MS,
		maxBuffer: GH_OUTPUT_MAX_BYTES,
	});
	return { ...result, out: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}
const fakeRunner = (stateFile) => (cwd, args, options = {}) => spawnSync(fakeCommand[0], [...fakeCommand.slice(1), ...args], {
	cwd,
	env: { ...process.env, ...options.env, NANA_FAKE_GH_STATE: stateFile },
	encoding: "utf8",
	timeout: CASE_LIMIT_MS,
	maxBuffer: GH_OUTPUT_MAX_BYTES,
});
const artifact = (id, leg, attempt, created = `2026-10-22T0${attempt}:00:00Z`, overrides = {}) => ({
	id,
	name: `${CI_ARTIFACT_PREFIX}${leg}-${attempt}`,
	expired: false,
	created_at: created,
	...overrides,
});
const job = (id, leg, attempt = 1, overrides = {}) => ({
	id,
	name: `${CI_SUITE_JOB} (${leg})`,
	run_attempt: attempt,
	status: "completed",
	conclusion: "success",
	started_at: `2026-10-22T0${attempt - 1}:00:00Z`,
	...overrides,
});
const run = (id, event = "pull_request", attempt = 1, overrides = {}) => ({
	id,
	path: CI_WORKFLOW_RUN_PATH,
	event,
	run_attempt: attempt,
	head_sha: SHA,
	status: "completed",
	conclusion: "success",
	...overrides,
});
const record = ({ platform = "darwin", files, unnamedFailures = [], exitCode, wallSeconds = 12.5, jobs = 4 } = {}) => {
	const entries = files ?? [
		{ path: "a.test.mjs", label: "PASS", seconds: 2 },
		{ path: "b.test.mjs", label: "FAIL", seconds: 3, cause: "exit 1" },
		{ path: "c.test.mjs", label: "SKIP", seconds: 0 },
	];
	return {
		schema: RECORD_SCHEMA,
		files: entries,
		unnamedFailures,
		exitCode: exitCode ?? (entries.some((entry) => entry.label === "FAIL") || unnamedFailures.length ? 1 : 0),
		wallSeconds,
		jobs,
		platform,
		coverage: false,
	};
};
function recordFile(name, value) {
	const file = path.join(TD, `${name}.json`);
	fs.writeFileSync(file, JSON.stringify(value));
	return file;
}
function oneRecordState({ runId = 1, leg = "macos-latest", attempt = 1, value = record(), event = "pull_request" } = {}) {
	const id = String(runId * 100 + attempt);
	return {
		runs: [run(runId, event, attempt)],
		artifacts: { [runId]: { total_count: 1, artifacts: [artifact(Number(id), leg, attempt)] } },
		jobs: { [runId]: { total_count: 1, jobs: [job(runId, leg, attempt)] } },
		downloads: { [runId]: { [`${CI_ARTIFACT_PREFIX}${leg}-${attempt}`]: { files: [{ name: "nana-suite-record.json", source: recordFile(`record-${id}-${stateNumber}`, value) }] } } },
	};
}
const totalsLines = (out) => out.split(/\r?\n/).filter((line) => line.startsWith(`${CI_RECORD_LINE_PREFIX} `) && line.includes(" files,"));
const slowestLines = (out) => out.split(/\r?\n/).filter((line) => line.startsWith(`${CI_RECORD_LINE_PREFIX} slowest `));

// req: R-2633
check("R-2633: a record the runner writes under CI's arguments reads back in ci-records with the runner's own totals", () => {
	const root = path.join(TD, "runner-fixture");
	fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
	fs.mkdirSync(path.join(root, "packages", "nana-pack", "lib"), { recursive: true });
	fs.mkdirSync(path.join(root, "packages", "probe", "tests"), { recursive: true });
	fs.mkdirSync(path.join(root, "apps", "bench", "test"), { recursive: true });
	fs.copyFileSync(RUNNER, path.join(root, "scripts", "test.mjs"));
	for (const name of ["runtime-map-config.mjs", "suite-records-config.mjs", "land-config.mjs", "windows-skips-config.mjs", "test-runner-config.mjs"])
		fs.copyFileSync(path.join(REPO, "packages", "nana-pack", "lib", name), path.join(root, "packages", "nana-pack", "lib", name));
	fs.writeFileSync(path.join(root, "packages", "probe", "tests", "a-pass.test.mjs"), 'console.log("PASS runner pass");\n');
	fs.writeFileSync(path.join(root, "packages", "probe", "tests", "b-fail.test.mjs"), 'console.log("PASS reached failure"); process.exit(2);\n');
	fs.writeFileSync(path.join(root, "packages", "probe", "tests", "c-change.test.mjs"), 'import * as fs from "node:fs"; fs.writeFileSync(new URL("../../../tracked.txt", import.meta.url), "after\\n"); console.log("PASS changed tracked file");\n');
	fs.writeFileSync(path.join(root, "apps", "bench", "test", "study-tasks.test.mjs"), 'console.log("FAIL skip fixture ran"); process.exit(1);\n');
	fs.writeFileSync(path.join(root, "tracked.txt"), "before\n");
	spawnSync("git", ["init", "-q", "-b", "main"], { cwd: root });
	spawnSync("git", ["add", "."], { cwd: root });
	spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture"], { cwd: root });
	const suite = WORKFLOW.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
	const jobsValue = suite.match(/^ {6}NANA_CI_JOBS: "(\d+)"$/m)?.[1];
	const commands = suite.split("\n").map((line) => line.match(/^ {6}- run: npm test -- (.+)$/)?.[1]).filter(Boolean);
	assert.equal(commands.length, 2);
	for (const [index, command] of commands.entries()) {
		spawnSync("git", ["checkout", "--", "tracked.txt"], { cwd: root });
		const args = command.replace("${{ env.NANA_CI_JOBS }}", jobsValue).trim().split(/\s+/);
		const outputRecord = path.join(TD, `runner-output-${index}.json`);
		const runner = spawnSync(process.execPath, [path.join(root, "scripts", "test.mjs"), ...args], {
			cwd: root,
			env: { ...process.env, [RECORD_FILE_ENV]: outputRecord, TMPDIR: TD, TEMP: TD, TMP: TD },
			encoding: "utf8",
			timeout: CASE_LIMIT_MS,
		});
		const match = /^(\d+) files: (\d+) PASS, (\d+) FAIL, (\d+) SKIP,/m.exec(`${runner.stdout}${runner.stderr}`);
		assert(match, "runner totals line is required");
		const value = JSON.parse(fs.readFileSync(outputRecord, "utf8"));
		const result = runCli(oneRecordState({ runId: 5 + index, leg: index ? "windows-latest" : "macos-latest", value }));
		assert.equal(result.status, 0, result.out);
		const line = totalsLines(result.out)[0] ?? "";
		assert(line.includes(`${match[1]} files, ${match[2]} PASS, ${match[3]} FAIL, ${match[4]} SKIP`), `${line}\n${runner.stdout}`);
	}
});

// req: R-2634
check("R-2634: ci-records prints one totals line per record artifact of each CI run of the commit", () => {
	const records = {
		101: recordFile("mac-1", record({ platform: "darwin" })),
		102: recordFile("linux-1", record({ platform: "linux" })),
		103: recordFile("win-1", record({ platform: "win32" })),
		201: recordFile("win-push-1", record({ platform: "win32", wallSeconds: 20 })),
		202: recordFile("win-push-2", record({ platform: "win32", wallSeconds: 21 })),
		301: recordFile("other-workflow", record({ platform: "linux" })),
	};
	const state = {
		runs: [run(20, "push", 2), run(30, "workflow_dispatch", 1, { path: ".github/workflows/other.yml" }), run(10)],
		artifacts: {
			10: { total_count: 5, artifacts: [artifact(101, "macos-latest", 1), artifact(102, "ubuntu-latest", 1), artifact(103, "windows-latest", 1), artifact(109, "expired", 1, undefined, { expired: true }), { id: 108, name: "unrelated", expired: false, created_at: "2026-10-22T01:00:00Z" }] },
			20: { total_count: 2, artifacts: [artifact(201, "windows-latest", 1), artifact(202, "windows-latest", 2)] },
			30: { total_count: 1, artifacts: [artifact(301, "ubuntu-latest", 1)] },
		},
		jobs: {
			10: { total_count: 3, jobs: [job(1, "macos-latest"), job(2, "ubuntu-latest"), job(3, "windows-latest")] },
			20: { total_count: 3, jobs: [job(4, "macos-latest", 2), job(5, "ubuntu-latest", 2), job(6, "windows-latest", 2)] },
			30: { total_count: 1, jobs: [job(7, "ubuntu-latest")] },
		},
		downloads: {
			[String(10)]: Object.fromEntries([101, 102, 103].map((id, index) => [`${CI_ARTIFACT_PREFIX}${["macos-latest", "ubuntu-latest", "windows-latest"][index]}-1`, { files: [{ name: "nana-suite-record.json", source: records[id] }] }])),
			[String(20)]: Object.fromEntries([201, 202].map((id, index) => [`${CI_ARTIFACT_PREFIX}windows-latest-${index + 1}`, { files: [{ name: "nana-suite-record.json", source: records[id] }] }])),
			[String(30)]: { [`${CI_ARTIFACT_PREFIX}ubuntu-latest-1`]: { files: [{ name: "nana-suite-record.json", source: records[301] }] } },
		},
	};
	for (const revision of [SHORT_SHA, "HEAD"]) {
		const result = runCli(state, revision);
		assert.equal(result.status, 0, result.out);
		const lines = totalsLines(result.out);
		assert.equal(lines.length, 5, result.out);
		assert.deepEqual(lines.map((line) => /run (\d+) attempt (\d+)/.exec(line)?.slice(1)), [["10", "1"], ["10", "1"], ["10", "1"], ["20", "1"], ["20", "2"]]);
		assert(lines[0].includes("darwin macos-latest") && lines[1].includes("linux ubuntu-latest") && lines[2].includes("win32 windows-latest"));
		assert(lines[3].includes("push") && lines[4].includes("wall 21s at 4 jobs"));
		assert(!result.out.includes("run 30") && !result.out.includes("expired") && !result.out.includes("unrelated"));
	}
});

// req: R-2635
check("R-2635: ci-records lists each record's slowest files, slowest first and capped", () => {
	const value = record({ files: [
		{ path: "z.test.mjs", label: "PASS", seconds: 9 },
		{ path: "b.test.mjs", label: "PASS", seconds: 8 },
		{ path: "a.test.mjs", label: "FAIL", seconds: 8, cause: "timed out" },
		{ path: "d.test.mjs", label: "PASS", seconds: 7 },
		{ path: "e.test.mjs", label: "PASS", seconds: 6 },
		{ path: "f.test.mjs", label: "PASS", seconds: 5 },
		{ path: "skip.test.mjs", label: "SKIP", seconds: 0 },
	] });
	const result = runCli(oneRecordState({ value }));
	assert.equal(result.status, 0, result.out);
	const line = slowestLines(result.out)[0] ?? "";
	assert.equal((line.match(/\.test\.mjs/g) ?? []).length, SLOWEST_LIST_MAX, line);
	assert(line.indexOf("z.test.mjs 9s") < line.indexOf("a.test.mjs 8s [FAIL]"));
	assert(line.indexOf("a.test.mjs 8s [FAIL]") < line.indexOf("b.test.mjs 8s"));
	assert(line.indexOf("b.test.mjs 8s") < line.indexOf("d.test.mjs 7s"));
	assert(!line.includes("f.test.mjs") && !line.includes("skip.test.mjs"));
});

// req: R-2637
check("R-2637: ci-records names each suite leg with no readable record and why", () => {
	const good = recordFile("good-rerun", record());
	const old = recordFile("old-attempt", record({ platform: "linux" }));
	const schemaTwo = recordFile("schema-two", { ...record(), schema: 2 });
	const state = {
		runs: [run(40, "push", 2), run(41), run(42)],
		artifacts: {
			40: { total_count: 8, artifacts: [
				artifact(401, "macos-latest", 1, "2026-10-22T01:30:00Z"),
				artifact(402, "windows-latest", 1), artifact(403, "windows-latest", 2),
				artifact(404, "stale-latest", 1, "2026-10-22T01:00:00Z"),
				artifact(405, "bad-download", 1), artifact(406, "garbage", 1), artifact(407, "schema-two", 1), artifact(408, "two-files", 1),
			] },
			41: { failure: { status: 1, stdout: '{"message":"Not Found"}', stderr: "artifact list unavailable\n" } },
			42: { total_count: 1, artifacts: [artifact(421, "ubuntu-latest", 1)] },
		},
		jobs: {
			40: { total_count: 9, jobs: [
				job(1, "macos-latest", 2, { started_at: "2026-10-22T00:30:00Z" }),
				job(2, "ubuntu-latest", 2, { conclusion: "failure" }), job(3, "windows-latest", 2),
				job(4, "running-latest", 2, { status: "in_progress", conclusion: null }),
				job(5, "stale-latest", 2, { started_at: "2026-10-22T02:00:00Z", conclusion: "cancelled" }),
				job(6, "bad-download"), job(7, "garbage"), job(8, "schema-two"), job(9, "two-files"),
			] },
			41: { total_count: 1, jobs: [job(10, "ubuntu-latest")] },
			42: { failure: { status: 4, stdout: '{"message":"auth"}', stderr: "please authenticate \t" } },
		},
		downloads: {
			40: {
				[`${CI_ARTIFACT_PREFIX}macos-latest-1`]: { files: [{ name: "nana-suite-record.json", source: good }] },
				[`${CI_ARTIFACT_PREFIX}windows-latest-1`]: { files: [{ name: "nana-suite-record.json", source: good }] },
				[`${CI_ARTIFACT_PREFIX}windows-latest-2`]: { files: [{ name: "nana-suite-record.json", source: good }] },
				[`${CI_ARTIFACT_PREFIX}stale-latest-1`]: { files: [{ name: "nana-suite-record.json", source: old }] },
				[`${CI_ARTIFACT_PREFIX}bad-download-1`]: { failure: { status: 1, stdout: '{"message":"Not Found"}', stderr: "gh: Not Found (HTTP 404) \t\r\nsecond\n" } },
				[`${CI_ARTIFACT_PREFIX}garbage-1`]: { files: [{ name: "nana-suite-record.json", content: "not json" }] },
				[`${CI_ARTIFACT_PREFIX}schema-two-1`]: { files: [{ name: "nana-suite-record.json", source: schemaTwo }] },
				[`${CI_ARTIFACT_PREFIX}two-files-1`]: { files: [{ name: "one.json", source: good }, { name: "two.json", source: good }] },
			},
			42: { [`${CI_ARTIFACT_PREFIX}ubuntu-latest-1`]: { files: [{ name: "nana-suite-record.json", source: good }] } },
		},
	};
	const result = runCli(state);
	assert.equal(result.status, 0, result.out);
	for (const text of [
		"ubuntu-latest: no record (failure)",
		"running-latest: still running",
		"stale-latest: attempt 2 left no record",
		"suite-record-bad-download-1 from run 40: download failed: gh: Not Found (HTTP 404)",
		"suite-record-garbage-1 from run 40: run record is unreadable:",
		"suite-record-schema-two-1 from run 40: run record is unreadable: unsupported schema or files",
		"suite-record-two-files-1 from run 40: expected one JSON file, found 2",
		"run 41: artifact listing failed: artifact list unavailable",
		"run 42: job listing failed: please authenticate",
	]) assert(result.out.includes(text), `${text}\n${result.out}`);
	assert(!result.out.includes("macos-latest: no record"), result.out);
	const cleanupStateFile = writeState(oneRecordState());
	const lines = [];
	const fsApi = { ...fs, rmSync(target, options) { if (options?.recursive) { const error = new Error("busy"); error.code = "EBUSY"; throw error; } return fs.rmSync(target, options); } };
	const cleanup = readCiRecords(["HEAD"], { cwd: REPO, runGh: fakeRunner(cleanupStateFile), fsApi, tempRoot: path.join(TD, "cleanup-injected"), writeLine: (line) => lines.push(line) });
	assert.equal(cleanup.code, 0, lines.join("\n"));
	assert(lines.some((line) => line.includes("cleanup-injected") && line.includes("EBUSY")), lines.join("\n"));
});

// req: R-2638
check("R-2638: ci-records exits 1 with one named line when the revision, gh or every record is missing, and 0 when a record printed", () => {
	const unresolved = runCli({}, "revision-that-does-not-exist");
	assert.equal(unresolved.status, 1); assert.match(unresolved.out, /revision.*does not resolve/i);
	const missingCommand = runCli({}, "HEAD", { [GH_COMMAND_ENV]: JSON.stringify([path.join(TD, "does-not-exist")]) });
	assert.equal(missingCommand.status, 1); assert.match(missingCommand.out, /cannot start gh/i);
	for (const [status, stderr] of [[4, "please run gh auth login"], [1, "gh: Not Found (HTTP 404)"]]) {
		const failed = runCli({ runsFailure: { failure: { status, stdout: '{"message":"error"}', stderr: `${stderr}\n` } } });
		assert.equal(failed.status, 1); assert(failed.out.includes(`exit ${status}`) && failed.out.includes(stderr), failed.out);
	}
	const noRuns = runCli({ runs: [] });
	assert.equal(noRuns.status, 1); assert.match(noRuns.out, /no CI run/i);
	const running = runCli({ runs: [run(9, "push", 1, { status: "in_progress", conclusion: null })], artifacts: { 9: { total_count: 0, artifacts: [] } }, jobs: { 9: { total_count: 1, jobs: [job(9, "windows-latest", 1, { status: "in_progress", conclusion: null })] } } });
	assert.equal(running.status, 1); assert.match(running.out, /no readable record/i);
	const passing = runCli(oneRecordState());
	assert.equal(passing.status, 0, passing.out); assert.equal(totalsLines(passing.out).length, 1);
});

// req: R-2632
// req: R-2634
check("seal: CI suite records are suite-record- artifacts of .github/workflows/ci.yml runs, and their lines start ci record:", () => {
	assert.equal(CI_ARTIFACT_PREFIX, "suite-record-", "R-2632");
	assert.equal(CI_WORKFLOW_RUN_PATH, ".github/workflows/ci.yml", "R-2634");
	assert.equal(CI_SUITE_JOB, "suite", "R-2634");
	assert.equal(CI_RECORD_LINE_PREFIX, "ci record:", "R-2634");
	assert.equal(SLOWEST_LIST_MAX, 5, "R-2634");
	assert.equal(GH_PAGE_SIZE, 100, "R-2634");
	assert.equal(GH_OUTPUT_MAX_BYTES, 4 * 1024 * 1024, "R-2634");
	assert.equal(GH_COMMAND_ENV, "NANA_CI_RECORDS_GH_COMMAND", "R-2634");
});

fs.rmSync(TD, { recursive: true, force: true });
console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exitCode = failures ? 1 : 0;
