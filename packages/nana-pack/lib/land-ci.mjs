/**
 * @module packages/nana-pack/lib/land-ci.mjs
 * @purpose Decide whether GitHub CI applies to a land and judge one workflow-runs response.
 * @inputs Remote names and URL, tip workflow paths, a workflow-runs JSON string, and the source tip.
 * @outputs A GitHub repository or skip note, and CI success lines or a refusal reason.
 * @effects none
 * @errors Malformed workflow-run data is returned as a named refusal reason.
 */
import path from "node:path";
import {
	CI_DONE_STATUS,
	CI_HOST,
	CI_PASS_CONCLUSION,
	CI_REMOTE,
	CI_WORKFLOW_DIR,
	CI_WORKFLOW_EXTENSIONS,
	TIP_DIGITS,
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

const isId = (value) => (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) || (typeof value === "string" && value.length > 0);
const isRun = (run) => run !== null && typeof run === "object" && !Array.isArray(run)
	&& isId(run.workflow_id) && typeof run.name === "string" && run.name.length > 0 && isId(run.id)
	&& Number.isSafeInteger(run.run_number) && run.run_number >= 0
	&& Number.isSafeInteger(run.run_attempt) && run.run_attempt >= 1
	&& typeof run.event === "string" && run.event.length > 0 && typeof run.status === "string" && run.status.length > 0
	&& (run.conclusion === null || typeof run.conclusion === "string");
const stateOf = (run) => run.status !== CI_DONE_STATUS ? run.status : String(run.conclusion);
const remedyOf = (run) => {
	if (run.status !== CI_DONE_STATUS) return "wait for the run to finish";
	if (run.conclusion === "cancelled") return `run gh run rerun ${run.id}`;
	if (run.conclusion === "failure" || run.conclusion === "timed_out") return `run gh run rerun ${run.id} --failed, or fix the failure`;
	return "fix the workflow result, then run it again";
};

/** Judge each workflow's highest-numbered run, independent of API list order or workflow name. */
export function judgeRuns(stdout, tip) {
	let body;
	try { body = JSON.parse(String(stdout ?? "")); }
	catch { return { ok: false, message: "CI response is not a workflow-run list" }; }
	if (body === null || typeof body !== "object" || Array.isArray(body) || !Number.isSafeInteger(body.total_count) || body.total_count < 0 || !Array.isArray(body.workflow_runs) || !body.workflow_runs.every(isRun))
		return { ok: false, message: "CI response is not a workflow-run list" };
	if (body.workflow_runs.length === 0) return { ok: false, message: `no CI run for ${String(tip).slice(0, TIP_DIGITS)} on origin; push the tip to its open pull request, then wait for CI` };
	const newest = new Map();
	for (const run of body.workflow_runs) {
		const key = String(run.workflow_id); const prior = newest.get(key);
		if (!prior || run.run_number > prior.run_number || (run.run_number === prior.run_number && run.run_attempt > prior.run_attempt)) newest.set(key, run);
	}
	const bad = [...newest.values()].filter((run) => run.status !== CI_DONE_STATUS || run.conclusion !== CI_PASS_CONCLUSION);
	if (bad.length) {
		const details = bad.map((run) => `${run.name} run ${run.id} attempt ${run.run_attempt} is ${stateOf(run)}; ${remedyOf(run)}`);
		return { ok: false, message: `CI at ${String(tip).slice(0, TIP_DIGITS)}: ${details.join("; ")}` };
	}
	return { ok: true, lines: [...newest.values()].map((run) => `ci: ${run.name} run ${run.id} attempt ${run.run_attempt} (${run.event}) success at ${String(tip).slice(0, TIP_DIGITS)}`) };
}
