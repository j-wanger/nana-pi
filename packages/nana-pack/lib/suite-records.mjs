/**
 * @module packages/nana-pack/lib/suite-records.mjs
 * @purpose Resolve, retain, read, compare, and summarize full-suite run records shared by a clone's worktrees.
 * @inputs A repository root, record file or run record, with injectable filesystem, git runner, clock, process id, and retention cap.
 * @outputs A validated run record, Git facts, a stored record path, valid current-schema records, final files, counts, or closing record lines.
 * @effects disk (git-common-dir suite record files), process (git queries through the injected runner).
 * @errors Throws a named git, filesystem, record-tip, or clock error for callers to report without changing a suite verdict.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import {
	MAIN_REF,
	RECORD_LINE_PREFIX,
	RECORD_SCHEMA,
	SLOWER_LIST_MAX,
	SLOWER_MIN_RATIO,
	SLOWER_MIN_SECONDS,
	STORE_SUBPATH,
	SUITE_RECORDS_KEEP,
	TIP_DIGITS,
} from "./suite-records-config.mjs";

const defaultGit = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8" });

function gitText(root, args, runGit) {
	const result = runGit(root, args);
	if (result?.error || result?.status !== 0) {
		const detail = result?.error?.message ?? (String(result?.stderr ?? "").trim() || `exit ${result?.status ?? "unknown"}`);
		throw new Error(`git ${args.join(" ")} failed: ${detail}`);
	}
	return String(result.stdout ?? "").trim();
}

/** Resolve the clone-shared suite store without assuming whether git returns a relative path. */
export function suiteRecordsDir(root, { runGit = defaultGit } = {}) {
	const common = gitText(root, ["rev-parse", "--git-common-dir"], runGit);
	const commonDir = path.isAbsolute(common) ? common : path.resolve(root, common);
	return path.join(commonDir, ...STORE_SUBPATH.split("/"));
}

/** Read the git facts stamped onto an unfiltered run after its suite process has ended. */
export function suiteGitFacts(root, { runGit = defaultGit } = {}) {
	const tip = gitText(root, ["rev-parse", "HEAD^{commit}"], runGit);
	const mainResult = runGit(root, ["rev-parse", "--verify", MAIN_REF]);
	const hasMain = !mainResult?.error && mainResult?.status === 0;
	const mainTip = hasMain ? String(mainResult.stdout ?? "").trim() : null;
	const mergeBase = hasMain ? gitText(root, ["merge-base", tip, MAIN_REF], runGit) : null;
	const args = ["status", "--porcelain", "-z", "--untracked-files=all"];
	const result = runGit(root, args);
	if (result?.error || result?.status !== 0) {
		const detail = result?.error?.message ?? (String(result?.stderr ?? "").trim() || `exit ${result?.status ?? "unknown"}`);
		throw new Error(`git ${args.join(" ")} failed: ${detail}`);
	}
	const entries = String(result.stdout ?? "").split("\0");
	let dirty = 0;
	for (let index = 0; index < entries.length; index++) {
		const entry = entries[index];
		if (!entry) continue;
		dirty++;
		if (/^[RC]/.test(entry) || /^[ RC][RC]/.test(entry)) index++;
	}
	return { tip, mergeBase, dirty, mainTip };
}

/** The chosen colon-free UTC filename stamp: YYYYMMDDTHHMMSSmmmZ. */
export function suiteRecordStamp(value) {
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) throw new Error("suite record clock returned an invalid date");
	return date.toISOString().replace(/[-:.]/g, "");
}

/** Store one record atomically, then retain only the newest configured JSON records. */
export function storeSuiteRecord(record, {
	root,
	fsApi = fs,
	runGit = defaultGit,
	now = () => new Date(),
	pid = process.pid,
	keep = SUITE_RECORDS_KEEP,
} = {}) {
	if (!root) throw new Error("suite record root is required");
	if (!/^[0-9a-f]{40,64}$/i.test(record?.tip ?? "")) throw new Error("suite record tip is not a full commit id");
	const dir = suiteRecordsDir(root, { runGit });
	fsApi.mkdirSync(dir, { recursive: true });
	const name = `${suiteRecordStamp(now())}_${record.tip}_${pid}.json`;
	const target = path.join(dir, name);
	const temporary = path.join(dir, `.${name}.tmp`);
	try {
		fsApi.writeFileSync(temporary, `${JSON.stringify(record)}\n`, { flag: "wx" });
		fsApi.renameSync(temporary, target);
	} catch (error) {
		try { fsApi.rmSync(temporary, { force: true }); } catch {}
		throw error;
	}
	const names = fsApi.readdirSync(dir)
		.filter((entry) => entry.endsWith(".json"))
		.sort()
		.reverse();
	for (const stale of names.slice(keep)) fsApi.rmSync(path.join(dir, stale), { force: true });
	return target;
}

function dateFromRecordName(name) {
	const match = /^(\d{8})T(\d{6})(\d{3})Z_/.exec(name);
	if (!match) return null;
	const [, day, time, millis] = match;
	const value = `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}.${millis}Z`;
	return Number.isNaN(Date.parse(value)) ? null : value;
}

/** Read newest-first current-schema records; malformed, unreadable, temp, and other-schema files disappear. */
export function readSuiteRecords({ root, fsApi = fs, runGit = defaultGit } = {}) {
	let dir;
	try { dir = suiteRecordsDir(root, { runGit }); }
	catch { return []; }
	let names;
	try { names = fsApi.readdirSync(dir).filter((name) => name.endsWith(".json")).sort().reverse(); }
	catch { return []; }
	const records = [];
	for (const name of names) {
		try {
			const record = JSON.parse(fsApi.readFileSync(path.join(dir, name), "utf8"));
			if (record?.schema === RECORD_SCHEMA) records.push({ ...record, recordedAt: record.recordedAt ?? dateFromRecordName(name) });
		} catch {}
	}
	return records;
}

function mainDistances(root, mergeBase, runGit) {
	if (!mergeBase) return { distances: null, mainTip: null };
	const result = runGit(root, ["rev-list", "--parents", MAIN_REF]);
	if (result?.error || result?.status !== 0) return { distances: null, mainTip: null };
	const rows = String(result.stdout ?? "").trim().split(/\r?\n/).filter(Boolean).map((line) => line.trim().split(/\s+/));
	if (!rows.length) return { distances: null, mainTip: null };
	const parents = new Map(rows.map(([commit, ...rest]) => [commit, rest]));
	const distances = new Map([[mergeBase, 0]]);
	const queue = [mergeBase];
	while (queue.length) {
		const commit = queue.shift();
		const distance = distances.get(commit);
		for (const parent of parents.get(commit) ?? []) {
			if (distances.has(parent)) continue;
			distances.set(parent, distance + 1);
			queue.push(parent);
		}
	}
	return { distances, mainTip: rows[0][0] };
}

function timeValue(record) {
	const value = Date.parse(record?.recordedAt ?? "");
	return Number.isNaN(value) ? 0 : value;
}

function baselineOf(records, distances) {
	if (!distances) return null;
	return records
		.filter((record) => record?.dirty === 0 && distances.has(record.tip))
		.sort((left, right) => distances.get(left.tip) - distances.get(right.tip)
			|| Number(right.trigger === "land") - Number(left.trigger === "land")
			|| timeValue(right) - timeValue(left))[0] ?? null;
}

/** Read one runner record with stable diagnostics shared by local and CI readers. */
export function readRunRecord(recordFile, { fsApi = fs } = {}) {
	let text;
	try { text = fsApi.readFileSync(recordFile, "utf8"); }
	catch (error) { throw new Error(`run record is missing or unreadable: ${error?.message ?? "unknown error"}`); }
	let record;
	try { record = JSON.parse(text); }
	catch (error) { throw new Error(`run record is unreadable: ${error?.message ?? "invalid JSON"}`); }
	if (record?.schema !== RECORD_SCHEMA || !Array.isArray(record.files)) throw new Error("run record is unreadable: unsupported schema or files");
	return record;
}

function numberText(value) {
	return Number.isInteger(value) ? String(value) : Number(value.toFixed(2)).toString();
}

export function finalFiles(record) {
	const byPath = new Map();
	for (const file of record?.files ?? []) {
		const entries = byPath.get(file.path) ?? [];
		entries.push(file);
		byPath.set(file.path, entries);
	}
	return [...byPath.values()].map((entries) => entries.filter((entry) => entry.coverage === false).at(-1) ?? entries.at(-1));
}

/** Count final PASS, FAIL and SKIP labels, including failures without a file. */
export function recordCounts(record) {
	const final = finalFiles(record);
	return {
		files: final.length,
		PASS: final.filter((file) => file.label === "PASS").length,
		FAIL: final.filter((file) => file.label === "FAIL").length + (record?.unnamedFailures ?? []).length,
		SKIP: final.filter((file) => file.label === "SKIP").length,
	};
}

function slowerText(current, baseline) {
	if (!baseline) return "slower: none";
	if (current.jobs !== baseline.jobs) return "slower: none (job counts differ)";
	const oldByPath = new Map(finalFiles(baseline).map((file) => [file.path, file]));
	const slower = [];
	for (const file of finalFiles(current)) {
		const old = oldByPath.get(file.path);
		if (!old || !(old.seconds > 0)) continue;
		const growth = file.seconds - old.seconds;
		const ratio = file.seconds / old.seconds;
		if (growth >= SLOWER_MIN_SECONDS && ratio >= SLOWER_MIN_RATIO) slower.push({ path: file.path, growth, ratio });
	}
	slower.sort((left, right) => right.growth - left.growth || right.ratio - left.ratio || left.path.localeCompare(right.path));
	if (!slower.length) return "slower: none";
	return `slower: ${slower.slice(0, SLOWER_LIST_MAX).map((entry) => `${entry.path} +${numberText(entry.growth)}s x${numberText(entry.ratio)}`).join(", ")}`;
}

function baselineText(current, baseline, { mainTip, now }) {
	if (!baseline) {
		if (!mainTip) return "no baseline exists (no main branch)";
		if (current.mergeBase !== mainTip) return "no baseline exists (merge main to record one)";
		return "no baseline exists (the next land records one)";
	}
	const age = Math.max(0, Math.floor((Date.parse(now) - timeValue(baseline)) / 3_600_000));
	return `baseline ${baseline.tip.slice(0, TIP_DIGITS)} age ${age}h coverage ${baseline.coverage ? "yes" : "no"} wall ${numberText(baseline.wallSeconds)}s -> ${numberText(current.wallSeconds)}s`;
}

function baselineLabels(baseline, filePath) {
	return (baseline?.files ?? []).filter((file) => file.path === filePath);
}

function failureClass(file, current, baseline, records) {
	const passedAtTip = current.dirty === 0 && records.some((record) => record.tip === current.tip && record.dirty === 0
		&& (record.files ?? []).some((entry) => entry.path === file.path && entry.label === "PASS"));
	if (passedAtTip) return "passing in another clean run at this tip";
	const labels = baselineLabels(baseline, file.path);
	if (labels.some((entry) => entry.coverage === true && entry.label === "FAIL")
		&& labels.some((entry) => entry.coverage === false && entry.label === "PASS")) return "failed only under coverage at baseline";
	if (labels.some((entry) => entry.label === "FAIL")) return "failing at baseline too";
	return "new";
}

function laneTotals(root, current, records, runGit) {
	let tips = new Set();
	if (current.mergeBase) {
		const result = runGit(root, ["rev-list", "HEAD", `^${current.mergeBase}`]);
		if (!result?.error && result?.status === 0) tips = new Set(String(result.stdout ?? "").trim().split(/\r?\n/).filter(Boolean));
	}
	const included = records.filter((record) => tips.has(record.tip));
	const seconds = [...included, current].reduce((sum, record) => sum + (Number(record.wallSeconds) || 0), 0);
	return { count: included.length + 1, minutes: (seconds / 60).toFixed(1) };
}

/** Compare a just-finished run with retained records and return its two bounded closing lines. */
export function suiteRecordLines(current, { root, records = readSuiteRecords({ root }), runGit = defaultGit, now = current.recordedAt } = {}) {
	const graph = mainDistances(root, current.mergeBase, runGit);
	const baseline = baselineOf(records, graph.distances);
	const first = `${RECORD_LINE_PREFIX} ${baselineText(current, baseline, { mainTip: graph.mainTip, now })}; ${slowerText(current, baseline)}`;
	const final = finalFiles(current);
	const failedFiles = final.filter((file) => file.label === "FAIL");
	const failed = failedFiles.map((file) => `${file.path} [${failureClass(file, current, baseline, records)}; ${file.cause ?? "unknown cause"}]`);
	for (const name of current.unnamedFailures ?? []) failed.push(`${name} [unnamed]`);
	const passedOnlyWithoutCoverage = final.filter((file) => {
		const labels = (current.files ?? []).filter((entry) => entry.path === file.path);
		return file.label === "PASS" && file.coverage === false
			&& labels.some((entry) => entry.coverage === true && entry.label === "FAIL");
	}).map((file) => file.path);
	const counts = recordCounts(current);
	const lane = laneTotals(root, current, records, runGit);
	const last = `${RECORD_LINE_PREFIX} ${counts.PASS} PASS, ${counts.FAIL} FAIL; failed: ${failed.length ? failed.join(", ") : "none"}; passed only without coverage: ${passedOnlyWithoutCoverage.length ? passedOnlyWithoutCoverage.join(", ") : "none"}; this lane: ${lane.count} full runs, ${lane.minutes} min`;
	return [first, last];
}
