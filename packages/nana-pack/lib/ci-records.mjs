/**
 * @module packages/nana-pack/lib/ci-records.mjs
 * @purpose Read CI suite-record artifacts for one revision without changing repository state.
 * @inputs A revision, repository root, injected git and gh runners, filesystem, temporary root, clock-independent GitHub responses, and output sink.
 * @outputs A process code, record count, and bounded CI totals, slowest-file, missing-input, cleanup, and closing lines.
 * @effects disk (temporary artifact downloads), process (git and injected gh calls), network (through the injected gh runner).
 * @errors Every unavailable revision, origin, gh response, run listing, artifact, record, leg, or cleanup becomes a named line; no readable record returns code 1.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { githubRepoOf } from "./land-ci.mjs";
import { CI_HOST, CI_REMOTE, TIP_DIGITS } from "./land-config.mjs";
import {
	CI_ARTIFACT_PREFIX,
	CI_RECORD_LINE_PREFIX,
	CI_SUITE_JOB,
	CI_WORKFLOW_RUN_PATH,
	GH_OUTPUT_MAX_BYTES,
	GH_PAGE_SIZE,
	SLOWEST_LIST_MAX,
} from "./suite-records-config.mjs";
import { finalFiles, readRunRecord, recordCounts } from "./suite-records.mjs";

const defaultGit = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: GH_OUTPUT_MAX_BYTES });
const numberText = (value) => Number.isInteger(value) ? String(value) : Number(Number(value).toFixed(2)).toString();
const firstLine = (value) => String(value ?? "").split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? "";
const idCompare = (left, right) => Number(left) - Number(right) || String(left).localeCompare(String(right));
const timeOf = (value) => {
	const parsed = Date.parse(String(value ?? ""));
	return Number.isNaN(parsed) ? 0 : parsed;
};

function gitValue(runGit, cwd, args) {
	let result;
	try { result = runGit(cwd, args); }
	catch (error) { return { ok: false, reason: error?.message ?? "git could not start" }; }
	if (result?.error || result?.status !== 0) return { ok: false, reason: firstLine(result?.stderr) || result?.error?.message || `exit ${result?.status ?? result?.signal ?? "unknown"}` };
	return { ok: true, value: String(result.stdout ?? "").trim() };
}

function ghResult(runGh, cwd, args) {
	let result;
	try { result = runGh(cwd, args, { env: process.env }); }
	catch (error) { return { ok: false, reason: `gh could not start: ${error?.message ?? "unknown error"}` }; }
	if (result?.error) {
		const lead = result.error.code === "ENOENT" ? "cannot start gh" : "gh could not start";
		return { ok: false, reason: `${lead}: ${result.error.message}` };
	}
	if (result?.status !== 0) {
		const detail = firstLine(result?.stderr) || firstLine(result?.stdout);
		return { ok: false, reason: `gh failed (exit ${result?.status ?? result?.signal ?? "unknown"})${detail ? `: ${detail}` : ""}` };
	}
	return { ok: true, stdout: String(result.stdout ?? "") };
}

function ghJson(runGh, cwd, args, arrayName) {
	const result = ghResult(runGh, cwd, args);
	if (!result.ok) return result;
	let body;
	try { body = JSON.parse(result.stdout); }
	catch (error) { return { ok: false, reason: `gh response is unreadable: ${error?.message ?? "invalid JSON"}` }; }
	if (body === null || typeof body !== "object" || Array.isArray(body) || !Array.isArray(body[arrayName])) return { ok: false, reason: `gh response has no ${arrayName} list` };
	return { ok: true, values: body[arrayName] };
}

function artifactIdentity(name) {
	if (!String(name).startsWith(CI_ARTIFACT_PREFIX)) return null;
	const match = /^(.*)-(\d+)$/.exec(String(name).slice(CI_ARTIFACT_PREFIX.length));
	return match ? { leg: match[1], attempt: Number(match[2]) } : null;
}

function legOfJob(job) {
	const match = new RegExp(`^${CI_SUITE_JOB.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\((.+)\\)$`).exec(String(job?.name ?? ""));
	return match?.[1] ?? null;
}

function slowestText(item) {
	const files = finalFiles(item.record)
		.filter((file) => file.label !== "SKIP")
		.sort((left, right) => Number(right.seconds) - Number(left.seconds) || String(left.path).localeCompare(String(right.path)))
		.slice(0, SLOWEST_LIST_MAX);
	const values = files.map((file) => `${file.path} ${numberText(file.seconds)}s${file.label === "PASS" ? "" : ` [${file.label}]`}`);
	return `${CI_RECORD_LINE_PREFIX} slowest ${item.record.platform} ${item.leg} run ${item.run.id} attempt ${item.attempt}: ${values.length ? values.join(", ") : "none"}`;
}

function totalsText(item) {
	const counts = recordCounts(item.record);
	return `${CI_RECORD_LINE_PREFIX} ${item.record.platform} ${item.leg} run ${item.run.id} attempt ${item.attempt} (${item.run.event}): ${counts.files} files, ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.SKIP} SKIP, exit ${item.record.exitCode}, wall ${numberText(item.record.wallSeconds)}s at ${item.record.jobs} jobs`;
}

/** Resolve and print one revision's CI records. All resource boundaries are injectable for tests. */
export function readCiRecords(argv = [], {
	cwd = process.cwd(),
	runGit = defaultGit,
	runGh,
	fsApi = fs,
	tempRoot = os.tmpdir(),
	writeLine = console.log,
} = {}) {
	const line = (text) => writeLine(`${CI_RECORD_LINE_PREFIX} ${text}`);
	if (argv.length > 1) { line("usage: ci-records.mjs [<rev>]"); return { code: 1, records: 0 }; }
	const revision = argv[0] ?? "HEAD";
	const resolved = gitValue(runGit, cwd, ["rev-parse", "--verify", "--quiet", `${revision}^{commit}`]);
	if (!resolved.ok || !resolved.value) { line(`revision ${revision} does not resolve to a commit${resolved.reason ? `: ${resolved.reason}` : ""}`); return { code: 1, records: 0 }; }
	const sha = resolved.value;
	const remote = gitValue(runGit, cwd, ["remote", "get-url", CI_REMOTE]);
	if (!remote.ok) { line(`origin cannot be read: ${remote.reason}`); return { code: 1, records: 0 }; }
	const repository = githubRepoOf(remote.value);
	if (!repository) { line("origin is not a github.com repository URL"); return { code: 1, records: 0 }; }
	if (typeof runGh !== "function") { line("gh runner is unavailable"); return { code: 1, records: 0 }; }
	const base = `repos/${repository.owner}/${repository.repo}`;
	const runsResult = ghJson(runGh, cwd, ["api", "--hostname", CI_HOST, `${base}/actions/runs?head_sha=${sha}&per_page=${GH_PAGE_SIZE}`], "workflow_runs");
	if (!runsResult.ok) { line(runsResult.reason); return { code: 1, records: 0 }; }
	const runs = runsResult.values.filter((run) => run?.path === CI_WORKFLOW_RUN_PATH).sort((left, right) => idCompare(left.id, right.id));
	if (!runs.length) { line(`no CI run for ${sha.slice(0, TIP_DIGITS)}`); return { code: 1, records: 0 }; }

	let downloadRoot = null;
	const printed = [];
	const problems = [];
	try {
		fsApi.mkdirSync(tempRoot, { recursive: true });
		downloadRoot = fsApi.mkdtempSync(path.join(tempRoot, "nana-ci-records-"));
		for (const run of runs) {
			const artifactsResult = ghJson(runGh, cwd, ["api", "--hostname", CI_HOST, `${base}/actions/runs/${run.id}/artifacts?per_page=${GH_PAGE_SIZE}`], "artifacts");
			if (!artifactsResult.ok) { problems.push(`run ${run.id}: artifact listing failed: ${artifactsResult.reason.replace(/^gh failed \([^)]*\):?\s*/, "")}`); continue; }
			const jobsResult = ghJson(runGh, cwd, ["api", "--hostname", CI_HOST, `${base}/actions/runs/${run.id}/jobs?filter=latest&per_page=${GH_PAGE_SIZE}`], "jobs");
			if (!jobsResult.ok) problems.push(`run ${run.id}: job listing failed: ${jobsResult.reason.replace(/^gh failed \([^)]*\):?\s*/, "")}`);
			const artifacts = artifactsResult.values
				.map((value) => ({ value, identity: artifactIdentity(value?.name) }))
				.filter(({ value, identity }) => identity && value?.expired !== true);
			for (const { value: artifact, identity } of artifacts) {
				const folder = path.join(downloadRoot, `${run.id}-${artifact.id}`);
				const downloaded = ghResult(runGh, cwd, ["run", "download", String(run.id), "--repo", `${repository.owner}/${repository.repo}`, "--name", artifact.name, "--dir", folder]);
				if (!downloaded.ok) {
					problems.push(`artifact ${artifact.name} from run ${run.id}: download failed: ${downloaded.reason.replace(/^gh failed \([^)]*\):?\s*/, "")}`);
					continue;
				}
				let names;
				try { names = fsApi.readdirSync(folder).filter((name) => name.endsWith(".json")); }
				catch (error) { problems.push(`artifact ${artifact.name} from run ${run.id}: unreadable folder: ${error?.message ?? "unknown error"}`); continue; }
				if (names.length !== 1) { problems.push(`artifact ${artifact.name} from run ${run.id}: expected one JSON file, found ${names.length}`); continue; }
				try {
					const record = readRunRecord(path.join(folder, names[0]), { fsApi });
					printed.push({ run, artifact, leg: identity.leg, attempt: identity.attempt, record });
				} catch (error) { problems.push(`artifact ${artifact.name} from run ${run.id}: ${error?.message ?? "run record is unreadable"}`); }
			}
			if (!jobsResult.ok) continue;
			const newestArtifact = new Map();
			for (const entry of artifacts) {
				const prior = newestArtifact.get(entry.identity.leg);
				if (!prior || timeOf(entry.value.created_at) > timeOf(prior.value.created_at)) newestArtifact.set(entry.identity.leg, entry);
			}
			for (const job of jobsResult.values) {
				const leg = legOfJob(job);
				if (!leg) continue;
				if (job.status !== "completed") { problems.push(`run ${run.id} ${leg}: still running (${job.status ?? "unknown"})`); continue; }
				const newest = newestArtifact.get(leg);
				if (!newest) { problems.push(`run ${run.id} ${leg}: no record (${job.conclusion ?? "unknown"})`); continue; }
				const attempt = Number(job.run_attempt ?? run.run_attempt ?? 1);
				if (attempt > newest.identity.attempt && timeOf(job.started_at) > timeOf(newest.value.created_at)) problems.push(`run ${run.id} ${leg}: attempt ${attempt} left no record`);
			}
		}
	} catch (error) {
		problems.push(`reader failed: ${error?.message ?? "unknown error"}`);
	} finally {
		if (downloadRoot) {
			try { fsApi.rmSync(downloadRoot, { recursive: true, force: true }); }
			catch (error) { problems.push(`temporary folder cleanup failed for ${downloadRoot}: ${error?.code ? `${error.code}: ` : ""}${error?.message ?? "unknown error"}`); }
		}
	}

	printed.sort((left, right) => idCompare(left.run.id, right.run.id) || left.leg.localeCompare(right.leg) || left.attempt - right.attempt);
	for (const item of printed) { writeLine(totalsText(item)); writeLine(slowestText(item)); }
	for (const problem of problems) line(problem);
	if (!printed.length) { line(`no readable record for ${sha.slice(0, TIP_DIGITS)}`); return { code: 1, records: 0 }; }
	line(`${printed.length} records from ${runs.length} CI runs at ${sha.slice(0, TIP_DIGITS)}; seconds are hosted-runner seconds under each record's job count`);
	return { code: 0, records: printed.length };
}
