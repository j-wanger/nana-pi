/**
 * @module packages/nana-pack/tests/land-records.test.mjs
 * @purpose Pin clone-shared land start/end records, failure isolation, closing lines, CI waits, and ledger registration.
 * @inputs nana-land, build-report, land-record configuration, temporary Git repositories, and injected clocks and runners.
 * @outputs Six requirement-tagged PASS or FAIL checks plus one sealed-tunable check.
 * @effects disk (OS-temp repositories and ledgers), process (Git commands).
 * @errors Failed checks print their title and make the process exit nonzero.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runBuildReport } from "../bin/build-report.mjs";
import { runLand } from "../bin/nana-land.mjs";
import {
	LAND_CI_CREATED_FIELD,
	LAND_CI_STATES,
	LAND_CI_UPDATED_FIELD,
	LAND_LEDGER_READ_MAX_BYTES,
	LAND_OUTCOMES,
	LAND_REASON_MAX_CHARS,
	LAND_RECORD_KINDS,
	LAND_RECORD_LINE_PREFIX,
	LAND_RECORD_SCHEMA,
	LAND_RECORDS_SUBPATH,
	LAND_STAGES,
} from "../lib/land-records-config.mjs";
import { commit, ensureCiReview, git, gitRunner, repo, reviewTip, runList, tree, workflowRun } from "./land-fixtures.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); }
	catch (error) { failures++; console.log("FAIL", title, error.stack ?? error.message); }
};
const commonDir = (main) => path.resolve(main, git(main, "rev-parse", "--git-common-dir"));
const ledgerPath = (main) => path.join(commonDir(main), ...LAND_RECORDS_SUBPATH.split("/"));
const ledgerRows = (main) => fs.readFileSync(ledgerPath(main), "utf8").split(/\r\n|\r|\n/).filter((line) => line.trim()).map(JSON.parse);
const clock = (start = Date.parse("2026-10-24T10:00:00.000Z"), step = 1_000) => {
	let calls = 0;
	return () => new Date(start + calls++ * step);
};
const makeLand = (name, { branch = "feat/alpha", folder = branch.replaceAll("/", "-") } = {}) => {
	const root = tmpDir(path.join(os.tmpdir(), `land-records-${name}-`));
	const main = repo(root, "main");
	const feature = path.join(root, folder);
	git(main, "worktree", "add", "-b", branch, feature);
	const tip = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home");
	const reviewed = [`${reviewTip(feature, home)}=item`];
	return { root, main, feature, tip, home, reviewed };
};
const land = (fixture, options = {}) => runLand({
	tree: fixture.feature,
	main: fixture.main,
	suite: "injected",
	reviewed: fixture.reviewed,
	home: fixture.home,
	runGit: gitRunner,
	runCommand: () => ({ status: 0, stdout: "", stderr: "" }),
	readReleaseStatus: () => ({ line: "ready" }),
	keepLandCiRecords: () => ({ lines: [], notes: [], records: 0 }),
	now: clock(),
	...options,
});
const recordLines = (text) => text.split(/\r?\n/).filter((line) => line.startsWith(LAND_RECORD_LINE_PREFIX));
const withoutLastRecordLine = (text) => `${text.trimEnd().split(/\r?\n/).filter((line) => !line.startsWith(LAND_RECORD_LINE_PREFIX)).join("\n")}\n`;

// req: R-2810
check("R-2810: a land attempt appends one start record under the main clone's git common folder before it compares the checkouts", () => {
	const linked = makeLand("start-linked", { folder: "x" });
	let snapshot = [];
	const linkedOut = land(linked, { runCommand: () => { snapshot = ledgerRows(linked.main); return { status: 0, stdout: "", stderr: "" }; } });
	assert.equal(linkedOut.code, 0, linkedOut.text);
	assert.equal(snapshot.length, 1);
	assert.equal(snapshot[0].kind, "start");
	assert.equal(snapshot[0].lane, "alpha");
	assert.equal(snapshot[0].tip, linked.tip);
	assert.match(snapshot[0].attempt, /^[0-9a-f-]{20,}$/i);
	assert.equal(fs.existsSync(path.join(linked.feature, ".git", ...LAND_RECORDS_SUBPATH.split("/"))), false);

	const detached = makeLand("start-detached");
	git(detached.feature, "checkout", "--detach");
	const detachedOut = land(detached);
	assert.equal(detachedOut.code, 0, detachedOut.text);
	const detachedStart = ledgerRows(detached.main).find((row) => row.kind === "start");
	assert.equal(detachedStart.lane, null);
	assert.equal(detachedStart.tip, detached.tip);

	const root = tmpDir(path.join(os.tmpdir(), "land-records-separate-"));
	const main = repo(root, "main");
	const source = path.join(root, "source");
	git(root, "clone", main, source);
	const out = runLand({ tree: source, main, suite: "injected", reviewed: [`${"a".repeat(40)}=item`], runGit: gitRunner, now: clock() });
	assert.equal(out.code, 1, out.text);
	assert.match(out.text, /^refused: --tree and --main must share one git repository/m);
	const rows = ledgerRows(main);
	assert.equal(rows.length, 2);
	assert.equal(rows[0].kind, "start");
	assert.equal(rows[0].lane, null);
	assert.match(rows[0].tip, /^[0-9a-f]{40}$/);
	assert.deepEqual(rows[1], { ...rows[1], kind: "end", attempt: rows[0].attempt, outcome: "refused", stage: "preflight", reason: "--tree and --main must share one git repository" });
});

// req: R-2811
check("R-2811: each way a land ends appends one end record naming its start, with a null suite time when the suite never ran", () => {
	const cases = [];
	{
		const f = makeLand("end-landed");
		cases.push({ name: "landed", f, out: land(f), outcome: "landed", stage: null, ci: "skipped", suiteMs: 1_000, durationMs: 3_000, reason: null });
	}
	{
		const f = makeLand("end-preflight"); fs.writeFileSync(path.join(f.main, "base.txt"), "dirty\n");
		cases.push({ name: "preflight", f, out: land(f), outcome: "refused", stage: "preflight", ci: "not reached", suiteMs: null, durationMs: 1_000, reason: /main checkout has tracked changes/ });
	}
	{
		const f = makeLand("end-ci");
		fs.mkdirSync(path.join(f.feature, ".github", "workflows"), { recursive: true });
		f.tip = commit(f.feature, ".github/workflows/ci.yml", "name: ci\n", "workflow");
		f.reviewed = [`${reviewTip(f.feature, f.home)}=item`];
		git(f.main, "remote", "add", "origin", "https://github.com/example/fixture.git");
		const queued = workflowRun({ status: "queued", conclusion: null });
		cases.push({ name: "ci", f, out: land(f, { runGh: () => ({ status: 0, stdout: runList([queued]), stderr: "" }) }), outcome: "refused", stage: "ci", ci: "refused", suiteMs: null, durationMs: 1_000, reason: /is queued/ });
	}
	{
		const f = makeLand("end-suite");
		cases.push({ name: "suite", f, out: land(f, { runCommand: () => ({ status: 1, stdout: "suite stdout\n", stderr: "suite stderr" }) }), outcome: "refused", stage: "suite", ci: "skipped", suiteMs: 1_000, durationMs: 3_000, reason: /^suite failed \(exit 1\)$/ });
	}
	{
		const f = makeLand("end-merge");
		cases.push({ name: "merge", f, out: land(f, { runCommand: () => { commit(f.main, "parallel.txt", "parallel\n", "parallel"); return { status: 0, stdout: "", stderr: "" }; } }), outcome: "refused", stage: "merge", ci: "skipped", suiteMs: 1_000, durationMs: 3_000, reason: /main checkout HEAD changed during suite/ });
	}
	for (const expected of cases) {
		const rows = ledgerRows(expected.f.main);
		assert.equal(rows.length, 2, expected.name);
		const [start, end] = rows;
		assert.equal(start.kind, "start", expected.name);
		assert.equal(end.kind, "end", expected.name);
		assert.equal(end.attempt, start.attempt, expected.name);
		assert.equal(end.outcome, expected.outcome, expected.name);
		assert.equal(end.stage, expected.stage, expected.name);
		assert.equal(end.ci, expected.ci, expected.name);
		assert.equal(end.suiteMs, expected.suiteMs, expected.name);
		assert.equal(end.durationMs, expected.durationMs, expected.name);
		assert.equal(end.durationMs, Date.parse(end.endedAt) - Date.parse(start.startedAt), expected.name);
		if (expected.reason instanceof RegExp) assert.match(end.reason, expected.reason, expected.name); else assert.equal(end.reason, expected.reason, expected.name);
		assert(!String(end.reason).includes("suite stdout") && !String(end.reason).includes("suite stderr"), expected.name);
	}
});

// req: R-2812
check("R-2812: a CI-passed land records the longest judged run span as its CI wait, and a run without times still lands with a null wait", () => {
	const exercise = (name, runs) => {
		const f = makeLand(`wait-${name}`);
		fs.mkdirSync(path.join(f.feature, ".github", "workflows"), { recursive: true });
		f.tip = commit(f.feature, ".github/workflows/ci.yml", "name: ci\n", "workflow");
		f.reviewed = [`${reviewTip(f.feature, f.home)}=item`];
		git(f.main, "remote", "add", "origin", "https://github.com/example/fixture.git");
		const out = land(f, { runGh: () => ({ status: 0, stdout: runList(runs), stderr: "" }) });
		assert.equal(out.code, 0, out.text);
		return { out, end: ledgerRows(f.main).find((row) => row.kind === "end") };
	};
	const judgedShort = workflowRun({ workflow_id: 1, name: "one", id: 10, run_number: 2, created_at: "2026-10-24T10:00:00Z", run_started_at: "2026-10-24T10:04:00Z", updated_at: "2026-10-24T10:06:00Z" });
	const unjudgedLong = workflowRun({ workflow_id: 1, name: "one", id: 9, run_number: 1, created_at: "2026-10-24T01:00:00Z", updated_at: "2026-10-24T10:00:00Z" });
	const judgedLong = workflowRun({ workflow_id: 2, name: "two", id: 20, run_number: 1, created_at: "2026-10-24T10:00:00Z", run_started_at: "2026-10-24T10:09:00Z", updated_at: "2026-10-24T10:15:00Z" });
	const timed = exercise("timed", [unjudgedLong, judgedShort, judgedLong]);
	assert.equal(timed.end.ci, "passed");
	assert.equal(timed.end.ciWaitMs, 15 * 60_000);
	assert.equal((timed.out.text.match(/^ci: /gm) ?? []).length, 2, timed.out.text);
	assert.match(timed.out.text, /^ci: one run 10 attempt 1 .* success/m);
	assert.match(timed.out.text, /^ci: two run 20 attempt 1 .* success/m);
	const missing = exercise("missing", [workflowRun({ created_at: undefined, updated_at: "2026-10-24T10:15:00Z" })]);
	assert.equal(missing.end.ci, "passed");
	assert.equal(missing.end.ciWaitMs, null);
	assert.match(missing.out.text, /^ci: ci run 101 attempt 1 .* success/m);
});

// req: R-2813
check("R-2813: an unwritable land ledger leaves the land's verdict, merge and output unchanged and names why in one last line", () => {
	const writable = makeLand("guard-writable");
	const writableOut = land(writable);
	assert.equal(writableOut.code, 0, writableOut.text);
	const blocked = makeLand("guard-blocked");
	fs.writeFileSync(path.dirname(ledgerPath(blocked.main)), "blocker");
	const blockedOut = land(blocked);
	assert.equal(blockedOut.code, 0, blockedOut.text);
	assert.equal(git(blocked.main, "rev-parse", "HEAD"), blocked.tip);
	assert.equal(withoutLastRecordLine(blockedOut.text), withoutLastRecordLine(writableOut.text));
	assert.equal(recordLines(blockedOut.text).length, 1, blockedOut.text);
	assert.match(recordLines(blockedOut.text)[0], /land-records\.jsonl: .*ENOTDIR|land-records\.jsonl: .*EEXIST/);
	assert.equal(blockedOut.text.trimEnd().split(/\r?\n/).at(-1), recordLines(blockedOut.text)[0]);

	const refused = makeLand("guard-refused");
	fs.writeFileSync(path.join(refused.main, "base.txt"), "dirty\n");
	fs.writeFileSync(path.dirname(ledgerPath(refused.main)), "blocker");
	const refusedOut = land(refused);
	assert.equal(refusedOut.code, 1, refusedOut.text);
	assert.match(refusedOut.text, /^refused: main checkout has tracked changes/m);
	assert.equal(recordLines(refusedOut.text).length, 1, refusedOut.text);
	assert.equal(refusedOut.text.trimEnd().split(/\r?\n/).at(-1), recordLines(refusedOut.text)[0]);

	const swapped = makeLand("guard-end");
	const swappedOut = land(swapped, { runCommand: () => { fs.rmSync(ledgerPath(swapped.main)); fs.mkdirSync(ledgerPath(swapped.main)); return { status: 0, stdout: "", stderr: "" }; } });
	assert.equal(swappedOut.code, 0, swappedOut.text);
	assert.equal(git(swapped.main, "rev-parse", "HEAD"), swapped.tip);
	assert.equal(recordLines(swappedOut.text).length, 1, swappedOut.text);
	assert.match(recordLines(swappedOut.text)[0], /land-records\.jsonl: .*EISDIR/);

	const capped = makeLand("guard-cap");
	const cappedOut = land(capped, { landLedgerReadMaxBytes: 8 });
	assert.equal(cappedOut.code, 0, cappedOut.text);
	assert.equal(recordLines(cappedOut.text).length, 1, cappedOut.text);
	assert.match(recordLines(cappedOut.text)[0], /lane line unavailable: ledger over 8 bytes/);
	assert.equal(cappedOut.text.trimEnd().split(/\r?\n/).at(-1), recordLines(cappedOut.text)[0]);
});

// req: R-2814
check("R-2814: every ended land attempt's last line names it and its lane's land line exactly as the build report prints it", () => {
	const f = makeLand("line");
	const seed = [
		{ v: LAND_RECORD_SCHEMA, kind: "start", attempt: "old-refused", startedAt: "2026-10-24T08:00:00.000Z", lane: "alpha", tip: "a".repeat(40) },
		{ v: LAND_RECORD_SCHEMA, kind: "end", attempt: "old-refused", endedAt: "2026-10-24T08:02:00.000Z", durationMs: 120_000, outcome: "refused", stage: "ci", reason: "queued", ci: "refused", ciWaitMs: null, suiteMs: null },
		{ v: LAND_RECORD_SCHEMA, kind: "start", attempt: "old-open", startedAt: "2026-10-24T09:00:00.000Z", lane: "alpha", tip: "b".repeat(40) },
	];
	fs.mkdirSync(path.dirname(ledgerPath(f.main)), { recursive: true });
	fs.writeFileSync(ledgerPath(f.main), `${seed.map(JSON.stringify).join("\r\n")} \t\r\n`); // CRLF and trailing whitespace
	const out = land(f);
	assert.equal(out.code, 0, out.text);
	const last = out.text.trimEnd().split(/\r?\n/).at(-1);
	const writes = { text: "", write(value) { this.text += value; } };
	const status = runBuildReport(["--repo", f.main, "--lane", "alpha"], { cwd: ROOT, stdout: writes, stderr: { write() {} } });
	assert.equal(status, 0);
	const laneLine = writes.text.split(/\r?\n/).find((line) => line.startsWith("land lane alpha"));
	assert(laneLine, writes.text);
	assert(last.endsWith(`; ${laneLine}`), `${last}\n${laneLine}`);
	assert.match(last, new RegExp(`^${LAND_RECORD_LINE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} landed, stage -, 0 min total, 0 min suite, - CI wait; `));
	assert.match(laneLine, /3 attempts \| 1 landed, 1 refused, 1 no end/);

	const dirty = makeLand("line-dirty"); fs.writeFileSync(path.join(dirty.main, "base.txt"), "dirty\n");
	const dirtyOut = land(dirty);
	assert.equal(dirtyOut.code, 1);
	assert.equal(dirtyOut.text.split(/\r?\n/)[0], "refused: main checkout has tracked changes (git diff exit 1)");
	assert.equal(dirtyOut.text.trimEnd().split(/\r?\n/).at(-1), recordLines(dirtyOut.text)[0]);

	const failed = makeLand("line-suite");
	const failedOut = land(failed, { runCommand: () => ({ status: 1, stdout: "", stderr: "tail without newline" }) });
	assert.equal(failedOut.code, 1);
	assert(failedOut.text.includes("suite failed (exit 1)\ntail without newline\n[nana-land] land record:"), failedOut.text);
	assert.equal(failedOut.text.trimEnd().split(/\r?\n/).at(-1), recordLines(failedOut.text)[0]);
});

// req: R-2816
check("R-2816: the ledger lists the land records as a CAP-02 deliverable read by code at the store's own path", () => {
	const text = fs.readFileSync(path.join(ROOT, "REQUIREMENTS.md"), "utf8");
	const cap = text.slice(text.indexOf("# CAP-02 ·"), text.indexOf("# CAP-03 ·"));
	const feature = cap.slice(cap.indexOf("## FEAT-008 ·"));
	assert.match(cap, /^Deliverables: .*\bR-2811\b/m);
	assert.match(cap, /^Made by: R-2811 · land: .* · A-082$/m);
	assert.match(cap, /^Read by: R-2811 · code: packages\/nana-pack\/bin\/build-report\.mjs, packages\/nana-pack\/bin\/nana-land\.mjs$/m);
	assert.match(feature, new RegExp(`^Artifact: A-082 · land records · clone store: <git common dir>/${LAND_RECORDS_SUBPATH.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} · land: packages/nana-pack/lib/land-records\\.mjs$`, "m"));
});

// req: R-2810
// req: R-2813
// req: R-2814
check("seal: land records live at nana/land-records.jsonl in schema 1, are read up to 32 MiB, and their line starts [nana-land] land record:", () => {
	assert.equal(LAND_RECORDS_SUBPATH, "nana/land-records.jsonl", "R-2810");
	assert.equal(LAND_RECORD_SCHEMA, 1, "R-2810");
	assert.equal(LAND_LEDGER_READ_MAX_BYTES, 32 * 1024 * 1024, "R-2813");
	assert.deepEqual(LAND_RECORD_KINDS, ["start", "end"], "R-2810 R-2811");
	assert.deepEqual(LAND_OUTCOMES, ["landed", "refused", "no end"], "R-2811 R-2815");
	assert.deepEqual(LAND_STAGES, ["preflight", "ci", "suite", "merge"], "R-2811");
	assert.deepEqual(LAND_CI_STATES, ["passed", "skipped", "refused", "not reached"], "R-2811 R-2812");
	assert.equal(LAND_CI_CREATED_FIELD, "created_at", "R-2812");
	assert.equal(LAND_CI_UPDATED_FIELD, "updated_at", "R-2812");
	assert.equal(LAND_RECORD_LINE_PREFIX, "[nana-land] land record:", "R-2814");
	assert.equal(LAND_REASON_MAX_CHARS, 16 * 1024, "R-2811");
});

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exitCode = failures ? 1 : 0;
