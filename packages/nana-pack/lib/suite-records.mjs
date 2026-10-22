/**
 * @module packages/nana-pack/lib/suite-records.mjs
 * @purpose Resolve, atomically retain, prune, and read full-suite run records shared by a clone's worktrees.
 * @inputs A repository root and run record, with injectable filesystem, git runner, clock, process id, and retention cap.
 * @outputs Git facts, a stored record path, or valid current-schema records ordered newest first.
 * @effects disk (git-common-dir suite record files), process (git queries through the injected runner).
 * @errors Throws a named git, filesystem, record-tip, or clock error for callers to report without changing a suite verdict.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { MAIN_REF, RECORD_SCHEMA, STORE_SUBPATH, SUITE_RECORDS_KEEP } from "./suite-records-config.mjs";

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
	const mergeBase = gitText(root, ["merge-base", tip, MAIN_REF], runGit);
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
	return { tip, mergeBase, dirty };
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
			if (record?.schema === RECORD_SCHEMA) records.push(record);
		} catch {}
	}
	return records;
}
