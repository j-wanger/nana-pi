/**
 * @module packages/nana-pack/lib/main-ci.mjs
 * @purpose Report the newest finished non-cancelled main push CI run and optionally post one scanned seat issue.
 * @inputs Repository cwd, environment, injected gh and optional git runners, scanner and temporary root.
 * @outputs A verdict, per-leg failed paths and jobs, unfinished-run notice and exact posting command.
 * @effects disk (temporary CI downloads), process (local gh and identity scan), network (gh).
 * @errors Unreadable CI, scan failures, launcher posting and gh failures return code 1 with a named line.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readCiRecords } from "./ci-records.mjs";
import { finalFiles } from "./suite-records.mjs";
import { ghDefault, ghResult } from "./gh-runner.mjs";
import { CI_HOST, CI_READ_TIMEOUT_MS, CI_DONE_STATUS, CI_PASS_CONCLUSION, MAIN_REF, TIP_DIGITS } from "./land-config.mjs";
import { GH_PAGE_SIZE, CI_WORKFLOW_RUN_PATH, GH_OUTPUT_MAX_BYTES } from "./suite-records-config.mjs";
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

export function mainCi({ cwd = process.cwd(), post = false, env = process.env, runGh = ghDefault({ timeoutMs: CI_READ_TIMEOUT_MS }), runGit, scanText = defaultScan, tempRoot, writeLine = console.log } = {}) {
	const line = (text) => writeLine(`Main CI: ${text}`);
	if (post && LAUNCHER_ROLES.includes(env.NANA_ROLE)) { line("posting refused under launcher role"); return { code: 1 }; }
	try {
		const repoResult = ghResult(runGh, cwd, ["repo", "view", "--json", "nameWithOwner"], { env });
		if (!repoResult.ok) throw new Error(repoResult.reason);
		const repository = JSON.parse(repoResult.stdout).nameWithOwner;
		if (typeof repository !== "string" || !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error("unreadable repository");
		const branch = MAIN_REF.replace("refs/heads/", "");
		const endpoint = `repos/${repository}/actions/workflows/${CI_WORKFLOW_RUN_PATH.split("/").at(-1)}/runs?branch=${branch}&event=push&per_page=${GH_PAGE_SIZE}`;
		const result = ghResult(runGh, cwd, ["api", "--hostname", CI_HOST, endpoint], { env });
		if (!result.ok) throw new Error(result.reason);
		const runs = JSON.parse(result.stdout).workflow_runs;
		if (!Array.isArray(runs)) throw new Error("unreadable workflow runs");
		const pushes = runs.filter((run) => run.event === "push" && run.head_branch === branch && run.path === CI_WORKFLOW_RUN_PATH).sort((a, b) => Number(b.id) - Number(a.id));
		const finished = pushes.filter((item) => item.status === CI_DONE_STATUS);
		const run = finished.find((item) => item.conclusion !== "cancelled");
		for (const pending of pushes.filter((item) => item.status !== CI_DONE_STATUS && (!run || Number(item.id) > Number(run.id)))) line(`run ${pending.id} unfinished (${pending.status})`);
		if (!run) {
			if (finished.length) { line(`all ${finished.length} finished main push runs cancelled; nothing to report or post`); return { code: 0 }; }
			line("no finished main push run"); return { code: 1 };
		}
		const skipped = finished.filter((item) => item.conclusion === "cancelled" && Number(item.id) > Number(run.id)).length;
		if (skipped) line(`skipped ${skipped} newer cancelled main push runs`);
		if (!/^[a-f0-9]{40,64}$/i.test(run.head_sha)) throw new Error(`run ${run.id}: unreadable SHA`);
		const records = readCiRecords([run.head_sha], { cwd, runGh: (root, args) => runGh(root, args, { env }), ...(runGit ? { runGit } : {}), ...(tempRoot ? { tempRoot } : {}), runId: run.id, writeLine: () => {} });
		const failures = [];
		// An attempt can copy older successful legs: choose each leg's newest readable record.
		const newest = new Map();
		for (const item of records.parsed) {
			if (String(item.run.id) !== String(run.id)) continue;
			const prior = newest.get(item.leg);
			if (!prior || item.attempt > prior.attempt) newest.set(item.leg, item);
		}
		for (const { leg, record } of newest.values()) {
			const files = finalFiles(record).filter((file) => file.label === "FAIL").map((file) => file.path);
			if (files.length) for (const file of files) failures.push(`${leg}: ${file}`);
			else if (record.exitCode !== 0 || record.unnamedFailures?.length) failures.push(`${leg}: suite`);
		}
		for (const leg of records.missingLegs ?? []) failures.push(`${leg}: suite`);
		for (const problem of records.problems ?? []) { line(problem); }
		for (const { job } of records.jobs ?? []) {
			if (job.status === CI_DONE_STATUS && ![CI_PASS_CONCLUSION, "skipped", "neutral"].includes(job.conclusion)) failures.push(job.name);
		}
		if (run.conclusion !== CI_PASS_CONCLUSION && !failures.length) failures.push("ci");
		const red = failures.length > 0 || Boolean(records.problems?.length) || records.code !== 0;
		line(`run ${run.id} ${run.head_sha.slice(0, TIP_DIGITS)} ${red ? "red" : "green"}`);
		for (const failure of failures) line(failure);
		if (!red) return { code: 0, red };
		line(`post: ${mainCiCommand(cwd)} --post`);
		// Missing inputs are not permission to claim a known failure in a public issue.
		if (!failures.length) return { code: 1, red };
		const title = `main CI: ${failures[0].replace(/^[^:]+: /, "")}`;
		const body = `${WATCH_SEAT_MARKER}\nRun: ${run.id}\nSHA: ${run.head_sha.slice(0, TIP_DIGITS)}\n${[...new Set(failures)].join("\n")}`;
		if (!post) return { code: 0, red, title, body };
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
