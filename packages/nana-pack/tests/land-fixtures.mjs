/**
 * @module packages/nana-pack/tests/land-fixtures.mjs
 * @purpose Build isolated land repositories, reviews, CI scopes, and injected process runners shared by land tests.
 * @inputs Temporary-root names, repository and workflow settings, fake CI runs, and optional injected runners and event sinks.
 * @outputs Named repository helpers, reviewed land fixtures, and nana-land results.
 * @effects disk (temporary Git repositories and review ledgers), process (Git commands).
 * @errors Git, review, and assertion failures escape to the calling test case.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runLand } from "../bin/nana-land.mjs";
import { admit, complete } from "../bin/review-round.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { CI_ARTIFACT_PREFIX } from "../lib/suite-records-config.mjs";

export const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

export const repo = (root, name) => {
	const dir = path.join(root, name); mkdirSync(dir, { recursive: true });
	git(dir, "init", "-b", "main"); git(dir, "config", "user.email", "land@test"); git(dir, "config", "user.name", "Land Test");
	git(dir, "config", "core.autocrlf", "false");
	writeFileSync(path.join(dir, "base.txt"), "base\n"); git(dir, "add", "base.txt"); git(dir, "commit", "-m", "base"); return dir;
};

export const commit = (dir, file, data, message) => {
	writeFileSync(path.join(dir, file), data); git(dir, "add", file); git(dir, "commit", "-m", message); return git(dir, "rev-parse", "HEAD");
};

export const tree = (dir, branch) => {
	git(dir, "worktree", "add", "-b", branch, path.join(path.dirname(dir), branch)); return path.join(path.dirname(dir), branch);
};

export const recordReview = (feature, home, item, verdict = "LAND") => {
	const admission = admit(["--item", item, "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs" });
	assert.equal(admission.ok, true, admission.message);
	return complete(admission.res, `VERDICT: ${verdict}`, { home });
};

export const reviewTip = (feature, home, item = "item") => {
	const revision = git(feature, "rev-parse", "HEAD");
	const result = recordReview(feature, home, item);
	assert.equal(result.ok, true, result.message);
	return revision;
};

export const gitRunner = (cwd, args) => {
	try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
	catch (error) { return { status: error.status ?? 1, signal: error.signal ?? null, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "", error: error.code === "ENOENT" ? error : undefined }; }
};

export const workflowRun = (overrides = {}) => ({ workflow_id: 1, name: "ci", id: 101, run_number: 1, run_attempt: 1, event: "pull_request", status: "completed", conclusion: "success", ...overrides });
export const runList = (runs) => JSON.stringify({ total_count: runs.length, workflow_runs: runs });

/** Answer the record reader's external calls, writing downloads only inside its OS-temp folder. */
export function artifactGh(runs, items, { failure = false, afterCall = () => {} } = {}) {
	return (_cwd, args, options) => {
		let result;
		const endpoint = args.at(-1);
		if (args[0] === "api" && endpoint.includes("/actions/runs?")) result = { status: 0, stdout: runList(runs) };
		else if (args[0] === "api" && endpoint.includes("/artifacts?")) {
			const id = /\/runs\/(\d+)\//.exec(endpoint)[1];
			result = failure ? { status: 1, stderr: "artifacts unavailable" } : { status: 0, stdout: JSON.stringify({ artifacts: items.filter((entry) => String(entry.run) === id).map((entry, index) => ({ id: index + 1, name: `${CI_ARTIFACT_PREFIX}${entry.leg}-${entry.attempt}`, created_at: "2026-11-01T00:00:00Z" })) }) };
		} else if (args[0] === "api" && endpoint.includes("/jobs?")) result = { status: 0, stdout: JSON.stringify({ jobs: [] }) };
		else if (args[0] === "run" && args[1] === "download") {
			const name = args[args.indexOf("--name") + 1], dir = args[args.indexOf("--dir") + 1];
			const entry = items.find((value) => String(value.run) === args[2] && name === `${CI_ARTIFACT_PREFIX}${value.leg}-${value.attempt}`);
			assert(entry); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, "record.json"), JSON.stringify(entry.record));
			result = { status: 0, stdout: "" };
		} else result = { status: 9, stderr: "unexpected gh call" };
		afterCall(args, options); return result;
	};
}

export const ciFixture = (name, { origin = "https://github.com/example/fixture.git", workflowOnMain = false, workflowOnTip = true, workflowPath = ".github/workflows/ci.yml" } = {}) => {
	const root = tmpDir(path.join(os.tmpdir(), `land-ci-${name}-`)); const main = repo(root, "main");
	if (workflowOnMain) { mkdirSync(path.join(main, ".github", "workflows"), { recursive: true }); commit(main, workflowPath, "name: ci\n", "main workflow"); }
	if (origin !== null) git(main, "remote", "add", "origin", origin);
	const feature = tree(main, "integration");
	if (workflowOnTip && !workflowOnMain) { mkdirSync(path.join(feature, path.dirname(workflowPath)), { recursive: true }); commit(feature, workflowPath, "name: ci\n", "tip workflow"); }
	else if (!workflowOnTip && workflowOnMain) { git(feature, "rm", workflowPath); git(feature, "commit", "-m", "remove workflow"); }
	else if (workflowOnMain) commit(feature, "next.txt", "next\n", "tip");
	else if (!workflowOnTip) commit(feature, "next.txt", "next\n", "tip");
	return { root, main, feature, tip: git(feature, "rev-parse", "HEAD"), home: path.join(root, "home"), reviewed: null };
};

export const ensureCiReview = (fixture) => {
	if (!fixture.reviewed) { mkdirSync(path.join(fixture.home, ".pi", "agent"), { recursive: true }); fixture.reviewed = [`${reviewTip(fixture.feature, fixture.home)}=item`]; }
};

export const executeCi = (fixture, runs, { runGh, runGit = gitRunner, runCommand, events = [], ...landOptions } = {}) => {
	ensureCiReview(fixture); let suiteRan = false;
	const gh = runGh ?? ((cwd, args, options) => { events.push({ kind: "gh", cwd, args, options }); return { status: 0, stdout: runList(runs), stderr: "" }; });
	const suite = runCommand ?? (() => { suiteRan = true; events.push({ kind: "suite" }); return { status: 0, stdout: "", stderr: "" }; });
	const result = runLand({ tree: fixture.feature, main: fixture.main, suite: "injected", reviewed: fixture.reviewed, home: fixture.home, runGit, runGh: gh, runCommand: suite, readReleaseStatus: () => ({ line: "ready" }), ...landOptions });
	return { ...result, suiteRan, events };
};
