/**
 * @module packages/nana-pack/lib/main-ci.mjs
 * @purpose Report main push CI failures and retain per-file flake evidence, optionally posting one scanned seat issue.
 * @inputs Repository cwd, environment, injected gh and optional git runners, job logs, scanner, temporary root, expected main SHA and advisory-Linux land mode.
 * @outputs A verdict, evidenceReadable flag for completed runs, per-leg failed paths and jobs, network-unreadable retry status, unfinished-run notice and exact posting command.
 * @effects disk (temporary CI downloads and clone CI flake records), process (local gh and identity scan), network (gh).
 * @errors Unreadable CI, scan failures, launcher posting and gh failures return code 1 with a named line.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import path from "node:path";
import { readCiRecords } from "./ci-records.mjs";
import { ciSuiteLegs, requiredCiJobs, toolkitCi } from "./land-ci.mjs";
import { finalFiles, readSuiteRecords, storeSuiteRecord } from "./suite-records.mjs";
import { ghDefault, ghNetworkFailure, ghResult } from "./gh-runner.mjs";
import { CI_HOST, CI_READ_TIMEOUT_MS, CI_DONE_STATUS, CI_PASS_CONCLUSION, CI_ADVISORY_JOB, MAIN_REF, TIP_DIGITS, MAIN_CI_FLAKE_FIX_COUNT } from "./land-config.mjs";
import { GH_PAGE_SIZE, CI_WORKFLOW_RUN_PATH, GH_OUTPUT_MAX_BYTES, CI_STORE_SUBPATH, CI_RECORDS_KEEP, RECORD_SCHEMA } from "./suite-records-config.mjs";
import { MAIN_CI_COMMAND_PREFIX, WATCH_COMMAND_PREFIX, WATCH_SEAT_MARKER, LAUNCHER_ROLES } from "./frontier-summary-config.mjs";
import { watchCommand } from "./issue-watch.mjs";

// Reuse the watch command's shell quoting rather than copying its private quote helper.
export function mainCiCommand(root) {
	return watchCommand(root).replace(WATCH_COMMAND_PREFIX, MAIN_CI_COMMAND_PREFIX).replace(" --root ", " --cwd ");
}

const scanner = fileURLToPath(new URL("../../../scripts/identity-scan.mjs", import.meta.url));
const scannerRoot = fileURLToPath(new URL("../../../", import.meta.url));
const defaultScan = (text) => spawnSync(process.execPath, [scanner, "--stdin", "--root", scannerRoot], {
	input: text, encoding: "utf8", timeout: CI_READ_TIMEOUT_MS, maxBuffer: GH_OUTPUT_MAX_BYTES,
});

/** Read failing file paths from one exact job's log; job names are not file evidence. */
export function failedJobFiles(run, job, { call, repository }) {
	if (!Number.isSafeInteger(job.id) || job.id < 1) return [];
	const log = call(["run", "view", String(run.id), "--job", String(job.id), "--attempt", String(job.run_attempt ?? run.run_attempt), "--log", "--repo", `${CI_HOST}/${repository}`]);
	const files = new Set();
	for (const line of log.split(/\r?\n/)) {
		const match = /(?:^|\s)FAIL[ \t]+((?:[A-Za-z]:[\\/])?[^\s]+\.(?:mjs|cjs|js|jsx|ts|tsx|py))(?=\s|$)/.exec(line);
		if (match) files.add(match[1]);
	}
	return [...files];
}

/** Keep idempotent per-file flake evidence in the existing clone CI store. */
export function recordMainFlakes(run, failures, { cwd, runGit, writeLine }) {
	const records = readSuiteRecords({ root: cwd, runGit, subpath: CI_STORE_SUBPATH });
	for (const [job, files] of failures) for (const file of files.length ? files : [`job: ${job}`]) {
		const identity = `${run.id}/${job}/${file}`;
		let prior = records.filter(record => record.flake?.file === file);
		if (!prior.some(record => record.flake.identity === identity)) {
			const record = { schema: RECORD_SCHEMA, tip: run.head_sha, trigger: "main-ci", flake: { identity, file, job, run: run.id }, files: [] };
			storeSuiteRecord(record, { root: cwd, runGit, subpath: CI_STORE_SUBPATH, keep: CI_RECORDS_KEEP, pid: `${run.id}-${records.length}` });
			records.push(record); prior = [...prior, record];
		}
		writeLine(`flake: ${file}`);
		if (new Set(prior.map(record => record.flake.identity)).size >= MAIN_CI_FLAKE_FIX_COUNT) writeLine(`needs fix lane: ${file}`);
	}
}

export function mainCi({ cwd = process.cwd(), post = false, env = process.env, runGh = ghDefault({ timeoutMs: CI_READ_TIMEOUT_MS }), runGit, scanText = defaultScan, tempRoot, expectedSha, atSha = false, advisoryLinux = false, writeLine = console.log } = {}) {
	const line = (text) => writeLine(`Main CI: ${text}`);
	const unreadable = (networkError, run) => {
		line(`${run ? `run ${run.id} ${run.head_sha.slice(0, TIP_DIGITS)} ` : ""}unreadable: GitHub did not answer; retry (${networkError.reason})`);
		return { code: 1, evidenceReadable: false, networkError, ...(run ? { run } : {}) };
	};
	if (post && LAUNCHER_ROLES.includes(env.NANA_ROLE)) { line("posting refused under launcher role"); return { code: 1 }; }
	try {
		const repoResult = ghResult(runGh, cwd, ["repo", "view", "--json", "nameWithOwner"], { env });
		if (!repoResult.ok) { if (ghNetworkFailure(repoResult)) return unreadable(repoResult); throw new Error(repoResult.reason); }
		const repository = JSON.parse(repoResult.stdout).nameWithOwner;
		if (typeof repository !== "string" || !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error("unreadable repository");
		const branch = MAIN_REF.replace("refs/heads/", "");
		const endpoint = `repos/${repository}/actions/workflows/${CI_WORKFLOW_RUN_PATH.split("/").at(-1)}/runs?branch=${branch}&event=push&per_page=${GH_PAGE_SIZE}${atSha ? `&head_sha=${expectedSha}` : ''}`;
		const result = ghResult(runGh, cwd, ["api", "--hostname", CI_HOST, endpoint], { env });
		if (!result.ok) { if (ghNetworkFailure(result)) return unreadable(result); throw new Error(result.reason); }
		const runs = JSON.parse(result.stdout).workflow_runs;
		if (!Array.isArray(runs)) throw new Error("unreadable workflow runs");
		const pushes = runs.filter((run) => run.event === "push" && run.head_branch === branch && run.path === CI_WORKFLOW_RUN_PATH).sort((a, b) => Number(b.id) - Number(a.id) || Number(b.run_attempt) - Number(a.run_attempt));
		const run = atSha ? pushes.find(run => run.head_sha === expectedSha) : pushes[0];
		if (!run) { line("no main push run"); return { code: 1, red: true }; }
		if (expectedSha && run.head_sha !== expectedSha) { line(`no main push run for current main ${expectedSha.slice(0, TIP_DIGITS)}`); return { code: 1, red: true }; }
		if (run.status !== CI_DONE_STATUS) { line(`run ${run.id} unfinished (${run.status})`); return { code: 1, red: true, run }; }
		if (!/^[a-f0-9]{40,64}$/i.test(run.head_sha)) throw new Error(`run ${run.id}: unreadable SHA`);
		const records = readCiRecords([run.head_sha], { cwd, runGh: (root, args) => runGh(root, args, { env }), ...(runGit ? { runGit } : {}), ...(tempRoot ? { tempRoot } : {}), runId: run.id, writeLine: () => {} });
		let toolkit = Boolean(expectedSha);
		try { toolkit ||= toolkitCi(readFileSync(path.join(cwd, "package.json"), "utf8")); } catch { /* Adopted projects need no toolkit manifest. */ }
		const failures = toolkit ? requiredCiJobs((records.jobs ?? []).map(({ job }) => job), { main: true }).problems : [];
		// Land and main use the same per-shard latest-execution and completeness decision.
		const selected = ciSuiteLegs(records);
		const networkError = records.ghFailures?.filter(ghNetworkFailure).at(-1);
		const failedJob = records.jobs?.some(({ job }) => job.status === CI_DONE_STATUS && ![CI_PASS_CONCLUSION, "skipped", "neutral"].includes(job.conclusion));
		const failedRecord = selected.records.some(({ record }) => record.exitCode !== 0 || record.unnamedFailures?.length || finalFiles(record).some(file => file.label === "FAIL"));
		if (networkError && run.conclusion === CI_PASS_CONCLUSION && !failedJob && !failedRecord) return unreadable(networkError, run);
		if (!selected.ok) failures.push(selected.reason);
		for (const { leg, record } of selected.records) {
			const files = finalFiles(record).filter((file) => file.label === "FAIL").map((file) => file.path);
			if (files.length) for (const file of files) failures.push(`${leg}: ${file}`);
			else if (record.exitCode !== 0 || record.unnamedFailures?.length) failures.push(`${leg}: suite`);
		}
		for (const leg of records.missingLegs ?? []) failures.push(`${leg}: suite`);
		for (const problem of records.problems ?? []) { line(problem); }
		for (const { job } of records.jobs ?? []) {
			if (job.status === CI_DONE_STATUS && ![CI_PASS_CONCLUSION, "skipped", "neutral"].includes(job.conclusion)) {
				failures.push(job.name);
				try {
					const files = failedJobFiles(run, job, { repository, call: args => {
						const result = ghResult(runGh, cwd, args, { env });
						if (!result.ok) throw new Error(result.reason);
						return result.stdout;
					} });
					for (const file of files) failures.push(`${job.name}: ${file}`);
				} catch (error) { line(`${job.name}: log unavailable: ${error.message}`); }
			}
		}
		if (run.conclusion !== CI_PASS_CONCLUSION && !failures.length) failures.push("ci");
		const blocking = (text) => !advisoryLinux || !(text.startsWith("ubuntu-latest:") || text === CI_ADVISORY_JOB || text.startsWith(`${CI_ADVISORY_JOB}:`) || /^run \S+ ubuntu-latest:/.test(text));
		const evidenceReadable = records.code === 0 && !records.problems?.length && !records.missingLegs?.length;
		const red = run.conclusion !== CI_PASS_CONCLUSION || failures.some(blocking) || Boolean(records.problems?.some(blocking)) || records.code !== 0;
		line(`run ${run.id} ${run.head_sha.slice(0, TIP_DIGITS)} ${red ? "red" : "green"}`);
		for (const failure of failures) line(failure);
		if (run.conclusion === "cancelled") { line("cancelled main run; nothing to post"); return { code: 1, red: true, run, evidenceReadable }; }
		if (!red) return { code: 0, red, run, evidenceReadable };
		line(`post: ${mainCiCommand(cwd)} --post`);
		// Missing inputs are not permission to claim a known failure in a public issue.
		if (!failures.length) return { code: 1, red, run, evidenceReadable };
		const title = `main CI: ${failures[0].replace(/^[^:]+: /, "")}`;
		const body = `${WATCH_SEAT_MARKER}\nRun: ${run.id}\nSHA: ${run.head_sha.slice(0, TIP_DIGITS)}\n${[...new Set(failures)].join("\n")}`;
		if (!post) return { code: 0, red, run, title, body, evidenceReadable };
		const scanned = scanText(`${title}\n${body}`);
		if (scanned?.error || scanned?.status !== 0) throw new Error("identity scan refused the issue");
		const account = ghResult(runGh, cwd, ["api", "--hostname", CI_HOST, "user"], { env });
		if (!account.ok) throw new Error(account.reason);
		if (JSON.parse(account.stdout).login?.toLowerCase() !== repository.split("/")[0].toLowerCase()) throw new Error("posting requires the repository owner's local gh account");
		const listed = ghResult(runGh, cwd, ["issue", "list", "--repo", `${CI_HOST}/${repository}`, "--state", "open", "--search", `${title} in:title`, "--limit", String(GH_PAGE_SIZE), "--json", "title"], { env });
		if (!listed.ok) throw new Error(listed.reason);
		const issues = JSON.parse(listed.stdout);
		if (!Array.isArray(issues)) throw new Error("unreadable open issues");
		if (issues.some((issue) => issue.title === title)) { line("same-title open issue; skipped"); return { code: 0, red, title, body }; }
		const created = ghResult(runGh, cwd, ["issue", "create", "--repo", `${CI_HOST}/${repository}`, "--title", title, "--body", body, "--label", "next"], { env });
		if (!created.ok) throw new Error(created.reason);
		line("posted one next issue");
		return { code: 0, red, title, body };
	} catch (error) { line(error.message); return { code: 1 }; }
}
