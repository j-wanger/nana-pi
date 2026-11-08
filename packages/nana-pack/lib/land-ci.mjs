/**
 * @module packages/nana-pack/lib/land-ci.mjs
 * @purpose Judge land CI scope, workflow verdicts and complete latest-attempt suite evidence.
 * @inputs Remote names and URL, tip workflow paths, a workflow-runs JSON string, the source tip, and its parsed GitHub repository.
 * @outputs A GitHub repository or skip note, CI success lines or refusal, and aggregated suite-leg records.
 * @effects none
 * @errors Malformed workflow-run data is returned as a named refusal reason.
 */
import path from "node:path";
import { finalFiles } from "./suite-records.mjs";
import {
	CI_DONE_STATUS,
	CI_HOST,
	CI_PASS_CONCLUSION,
	CI_REMOTE,
	CI_WORKFLOW_DIR,
	CI_WORKFLOW_EXTENSIONS,
	TIP_DIGITS,
	SUITE_FALLBACK_PATHS,
	SUITE_CHANGED_REASON,
	CI_TOOLKIT_NAME, CI_LANE_JOBS, CI_WINDOWS_JOBS, CI_LEGACY_WINDOWS_JOB,
} from "./land-config.mjs";

// contract (R-1511): strict GitHub origin spellings, with no credentials and an optional .git suffix.
export const GITHUB_REMOTE = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([^/]+)\/([^/]+?)(?:\.git)?$/;

/** Read the owner and repository from one strict github.com origin URL. */
export function githubRepoOf(url) {
	const match = GITHUB_REMOTE.exec(String(url ?? "").trim());
	return match ? { owner: match[1], repo: match[2] } : null;
}

const linesOf = (value) => String(value ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
const pathsOf = (value) => {
	const text = String(value ?? "");
	return (text.includes("\0") ? text.split("\0") : text.split(/\r?\n/)).filter(Boolean);
};

/** Decide whether the local remote and source-tip tree put this land under GitHub CI. */
export function ciScope({ remoteNames = "", originUrl = "", workflowPaths = "" } = {}) {
	if (!linesOf(remoteNames).includes(CI_REMOTE)) return { applies: false, note: "no origin remote" };
	const repository = githubRepoOf(originUrl);
	if (!repository) return { applies: false, note: `origin is not a ${CI_HOST} repository URL` };
	const workflow = pathsOf(workflowPaths).some((file) => path.posix.dirname(file) === CI_WORKFLOW_DIR && CI_WORKFLOW_EXTENSIONS.includes(path.posix.extname(file)));
	if (!workflow) return { applies: false, note: "the tip tracks no workflow" };
	return { applies: true, repository };
}

/** Judge the captured-main-to-tip path list without treating other scripts as proof changes. */
export function changedSuitePaths(changedPaths) {
	const changed = linesOf(changedPaths).some((file) => SUITE_FALLBACK_PATHS.some((entry) => entry.endsWith("/") ? file.startsWith(entry) : file === entry));
	return changed ? { ok: false, reason: SUITE_CHANGED_REASON } : { ok: true };
}

/** Keep the toolkit's named-job contract out of adopted projects. */
export function toolkitCi(manifest) {
	try { return JSON.parse(manifest).name === CI_TOOLKIT_NAME; } catch { return false; }
}

/** Require named jobs independently of a workflow's aggregate conclusion; Linux remains advisory. */
export function requiredCiJobs(jobs, { main = false } = {}) {
	const historical = main && jobs.some((job) => job.name === CI_LEGACY_WINDOWS_JOB);
	const windows = historical ? [CI_LEGACY_WINDOWS_JOB, ...CI_WINDOWS_JOBS.filter((name) => !name.startsWith("suite ("))] : CI_WINDOWS_JOBS;
	const required = [...CI_LANE_JOBS, ...(main ? windows : [])];
	const problems = [];
	for (const name of required) {
		const job = jobs.find((item) => item.name === name);
		if (!job) problems.push(`${name}: missing`);
		else if (job.status !== CI_DONE_STATUS || job.conclusion !== CI_PASS_CONCLUSION) problems.push(`${name}: ${job.status === CI_DONE_STATUS ? job.conclusion : job.status}`);
	}
	return { ok: problems.length === 0, problems };
}

/** Distinguish a complete lane pack proof from ordinary substring-filtered output. */
export function suiteScopeProblem(record) {
	if (!Array.isArray(record.filters) || record.filters.length) return "CI suite record does not prove an unfiltered run";
	const pack = record.packRun;
	if (pack === undefined) return null; // historical full suites remain valid
	if (pack?.complete !== true || !Array.isArray(pack.packs) || !pack.packs.includes("land") || !pack.packs.includes("module")) return "CI pack record omits complete land and module packs";
	const selection = pack.selection;
	if (!selection || !Array.isArray(selection.changedPaths) || !Array.isArray(selection.module) || !Array.isArray(selection.changedTests)
		|| !(selection.changedFrom === null || typeof selection.changedFrom === "string")
		|| [...selection.module, ...selection.changedTests].some(item => typeof item?.path !== "string" || !Array.isArray(item.reasons) || !item.reasons.length)) return "CI pack record omits module selection";
	return null;
}

/** Select each leg's newest record, then combine complete shard groups without counting old attempts. */
export function ciSuiteLegs(result) {
	const newest = new Map();
	for (const item of result?.parsed ?? []) {
		const key = `${item.run.id}/${item.leg}`;
		if (!newest.has(key) || newest.get(key).attempt < item.attempt) newest.set(key, item);
	}
	const records = [], groups = new Map(), problems = [];
	const identity = (leg) => /^(.*)-shard-(\d+)-of-(\d+)$/.exec(leg);
	const groupFor = (run, leg) => {
		const match = identity(leg);
		if (!match) return null;
		const [, base, indexText, countText] = match;
		const index = Number(indexText), count = Number(countText), key = `${run.id}/${base}`;
		if (!groups.has(key)) groups.set(key, { run, base, count, items: new Map(), jobs: new Map() });
		const group = groups.get(key);
		if (!Number.isSafeInteger(count) || count < 1 || index < 1 || index > count || group.count !== count) problems.push(`${base}: invalid shard identity ${leg}`);
		return { group, index };
	};
	for (const item of newest.values()) {
		const shard = groupFor(item.run, item.leg);
		if (shard) shard.group.items.set(shard.index, item);
		else records.push(item);
	}
	for (const { run, job, leg } of result?.jobs ?? []) {
		const shard = groupFor(run, leg);
		if (!shard) continue;
		const prior = shard.group.jobs.get(shard.index);
		if (!prior || Number(job.run_attempt ?? run.run_attempt) >= Number(prior.run_attempt ?? run.run_attempt)) shard.group.jobs.set(shard.index, job);
	}
	for (const group of groups.values()) {
		const { run, base, count, items, jobs } = group;
		// Compare sizes before walking: an honest missing leg cannot turn into a huge loop.
		if (items.size !== count || jobs.size !== count) problems.push(`${base}: missing shard (expected ${count} records and jobs)`);
		const members = [...items].sort(([a], [b]) => a - b);
		for (const [index, item] of members) {
			const job = jobs.get(index), record = item.record;
			if (!job || job.status !== CI_DONE_STATUS || job.conclusion !== CI_PASS_CONCLUSION) problems.push(`${item.leg}: shard job did not pass`);
			// GitHub can report the newest run_attempt even for carried jobs.
			// Only an older started_at proves carry-forward; no timestamp fails closed.
			const latestAttempt = Number(job?.run_attempt ?? run.run_attempt);
			const carried = Date.parse(job?.started_at) < Date.parse(item.artifact?.created_at);
			if (latestAttempt > item.attempt && !carried) problems.push(`${item.leg}: attempt ${latestAttempt} left no record`);
			if (record.shard?.index !== index || record.shard?.count !== count) problems.push(`${item.leg}: record shard identity differs`);
			if (JSON.stringify(record.packRun) !== JSON.stringify(members[0][1].record.packRun)) problems.push(`${item.leg}: pack selection differs across shards`);
			if (record.platform !== members[0][1].record.platform || suiteScopeProblem(record) || !finalFiles(record).length || record.exitCode !== 0 || record.unnamedFailures?.length || finalFiles(record).some((file) => file.label === "FAIL")) problems.push(`${item.leg}: shard record did not pass an unfiltered suite`);
		}
		if (!members.length) continue;
		if (records.some((item) => String(item.run.id) === String(run.id) && item.leg === base)) problems.push(`${base}: mixed sharded and unsharded records`);
		const values = members.map(([, item]) => item);
		const files = values.flatMap((item) => finalFiles(item.record));
		if (new Set(files.map((file) => file.path)).size !== files.length) problems.push(`${base}: duplicate file across shards`);
		const first = values[0];
		records.push({ ...first, leg: base, attempt: Math.max(...values.map((item) => item.attempt)), record: {
			...first.record, shard: undefined,
			shards: values.map((item) => ({ leg: item.leg, attempt: item.attempt, wallSeconds: item.record.wallSeconds })),
			files, wallSeconds: values.reduce((sum, item) => sum + Number(item.record.wallSeconds), 0),
			unnamedFailures: values.flatMap((item) => item.record.unnamedFailures ?? []),
			exitCode: values.some((item) => item.record.exitCode !== 0) ? 1 : 0,
		} });
	}
	for (const { leg, record } of records) {
		if (record.packRun === undefined) continue;
		const problem = suiteScopeProblem(record);
		if (problem) problems.push(`${leg}: ${problem}`);
		else {
			const paths = new Set(finalFiles(record).map(file => file.path));
			if ([...record.packRun.selection.module, ...record.packRun.selection.changedTests].some(item => !paths.has(item.path))) problems.push(`${leg}: selected test file missing from pack record`);
		}
	}
	return { ok: problems.length === 0, reason: problems.join("; "), records };
}

/** Require each same-platform leg to prove a successful full suite or complete lane pack selection. */
export function proveCiSuite(result, runs, platform) {
	if (result?.code !== 0 || !Array.isArray(result?.parsed) || result?.problems?.length || result?.budgetStopped) return { ok: false, reason: result?.budgetStopped ? "CI suite records exceeded their budget" : "CI suite records could not be read" };
	const judged = new Set(runs.map((run) => String(run.id)));
	const selected = ciSuiteLegs({ ...result, parsed: result.parsed.filter((item) => judged.has(String(item.run?.id))), jobs: result.jobs?.filter((item) => judged.has(String(item.run?.id))) });
	if (!selected.ok) return { ok: false, reason: selected.reason };
	const legs = selected.records.filter((item) => item.record?.platform === platform);
	if (!legs.length) return { ok: false, reason: `no CI suite record for platform ${platform}` };
	for (const { record } of legs) {
		const scopeProblem = suiteScopeProblem(record);
		if (scopeProblem) return { ok: false, reason: scopeProblem };
		if (finalFiles(record).length === 0) return { ok: false, reason: "CI suite record has no final files" };
		if (record.exitCode !== 0 || record.unnamedFailures?.length || finalFiles(record).some(file => file.label === "FAIL")) return { ok: false, reason: "CI suite record did not exit 0" };
	}
	return { ok: true, records: legs };
}

const isId = (value) => (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) || (typeof value === "string" && value.length > 0);
const isRun = (run) => run !== null && typeof run === "object" && !Array.isArray(run)
	&& isId(run.workflow_id) && typeof run.name === "string" && run.name.length > 0 && isId(run.id)
	&& Number.isSafeInteger(run.run_number) && run.run_number >= 0
	&& Number.isSafeInteger(run.run_attempt) && run.run_attempt >= 1
	&& typeof run.event === "string" && run.event.length > 0 && typeof run.status === "string" && run.status.length > 0
	&& (run.conclusion === null || typeof run.conclusion === "string");
const stateOf = (run) => run.status !== CI_DONE_STATUS ? run.status : String(run.conclusion);
const remedyOf = (run, repository) => {
	if (run.status !== CI_DONE_STATUS) return "wait for the run to finish";
	const rerun = `gh run rerun ${run.id} --repo ${repository.owner}/${repository.repo}`;
	if (run.conclusion === "cancelled") return `run ${rerun}`;
	if (run.conclusion === "failure" || run.conclusion === "timed_out") return `run ${rerun} --failed, or fix the failure`;
	return "fix the workflow result, then run it again";
};

/** Judge each workflow's highest-numbered run, independent of API list order or workflow name. */
export function judgeRuns(stdout, tip, repository) {
	let body;
	try { body = JSON.parse(String(stdout ?? "")); }
	catch { return { ok: false, message: "CI response is not a workflow-run list" }; }
	if (body === null || typeof body !== "object" || Array.isArray(body) || !Number.isSafeInteger(body.total_count) || body.total_count < 0 || !Array.isArray(body.workflow_runs) || !body.workflow_runs.every(isRun))
		return { ok: false, message: "CI response is not a workflow-run list" };
	if (body.workflow_runs.length === 0) return { ok: false, runs: [], message: `no CI run for ${String(tip).slice(0, TIP_DIGITS)} on origin; push the tip to its open pull request, then wait for CI` };
	const newest = new Map();
	for (const run of body.workflow_runs) {
		const key = String(run.workflow_id); const prior = newest.get(key);
		if (!prior || run.run_number > prior.run_number || (run.run_number === prior.run_number && run.run_attempt > prior.run_attempt)) newest.set(key, run);
	}
	const bad = [...newest.values()].filter((run) => run.status !== CI_DONE_STATUS || run.conclusion !== CI_PASS_CONCLUSION);
	if (bad.length) {
		const details = bad.map((run) => `${run.name} run ${run.id} attempt ${run.run_attempt} is ${stateOf(run)}; ${remedyOf(run, repository)}`);
		return { ok: false, runs: [...newest.values()], message: `CI at ${String(tip).slice(0, TIP_DIGITS)}: ${details.join("; ")}` };
	}
	const runs = [...newest.values()];
	return { ok: true, runs, lines: runs.map((run) => `ci: ${run.name} run ${run.id} attempt ${run.run_attempt} (${run.event}) success at ${String(tip).slice(0, TIP_DIGITS)}`) };
}
