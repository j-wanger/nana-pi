/**
 * @module packages/nana-pack/tests/land.test.mjs
 * @purpose Pins land CLI options, post-merge release reporting and safe cleanup on disposable repositories.
 * @inputs nana-land.mjs and isolated temporary git repositories.
 * @outputs PASS/FAIL lines and a nonzero exit when a land contract fails.
 * @effects disk (OS temporary test repositories and review ledgers), process (git).
 * @errors Failed checks exit nonzero; unexpected exceptions fail the process.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { parseLandArgs, runLand, runCleanup } from "../bin/nana-land.mjs";

let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); }
	catch (error) { failures++; console.log("FAIL", title, error.message); }
};
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const repo = (root, name) => {
	const dir = path.join(root, name); mkdirSync(dir, { recursive: true });
	git(dir, "init", "-b", "main"); git(dir, "config", "user.email", "land@test"); git(dir, "config", "user.name", "Land Test");
	writeFileSync(path.join(dir, "base.txt"), "base\n"); git(dir, "add", "base.txt"); git(dir, "commit", "-m", "base"); return dir;
};
const commit = (dir, file, data, message) => { writeFileSync(path.join(dir, file), data); git(dir, "add", file); git(dir, "commit", "-m", message); return git(dir, "rev-parse", "HEAD"); };
const integration = (main, name = "integration") => {
	const tree = path.join(path.dirname(main), name); git(main, "worktree", "add", "-b", `feat/${name}`, tree); return tree;
};
const authorization = (tree, root) => {
	const home = path.join(root, "home"); const agent = path.join(home, ".pi", "agent"); mkdirSync(agent, { recursive: true });
	const revision = git(tree, "rev-parse", "HEAD"); const common = path.resolve(tree, git(tree, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(agent, "review-ledger.rounds.jsonl"), JSON.stringify({ v: 2, kind: "round", repo: `git:${common}`, item: "item", revision, verdict: "LAND", role: "reviewer", model: "test", unverified: false }) + "\n");
	return { home, reviewed: [`${revision}=item`] };
};

// req: R-1003
check("land parser accepts the named option set and refuses removed or unknown options by name", () => {
	const args = ["merge", "--tree", "/tree", "--main", "/main", "--suite", "true", "--reviewed", `${"a".repeat(40)}=item`];
	assert.equal(parseLandArgs(args).reviewed.length, 1);
	for (const option of ["--exempt", "--other"]) assert.throws(() => parseLandArgs([...args, option, "value"]), new RegExp(`unknown option ${option}`));
});

// req: R-588
check("successful merge prints release status, and a release-status failure preserves the success result", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-release-")); const main = repo(root, "main");
	const tree = integration(main); commit(tree, "next.txt", "next\n", "next"); const auth = authorization(tree, root);
	const options = { tree, main, suite: "node -e 'process.exit(0)'", ...auth, readReleaseStatus: () => ({ line: "release status test" }) };
	const ok = runLand(options); assert.equal(ok.code, 0, ok.text); assert.match(ok.text, /release status: release status test/);
	const root2 = tmpDir(path.join(os.tmpdir(), "land-release-failure-")); const main2 = repo(root2, "main");
	const tree2 = integration(main2); commit(tree2, "next.txt", "next\n", "next"); const auth2 = authorization(tree2, root2);
	const failed = runLand({ tree: tree2, main: main2, suite: "node -e 'process.exit(0)'", ...auth2, readReleaseStatus: () => { throw new Error("injected"); } });
	assert.equal(failed.code, 0, failed.text); assert.match(failed.text, /release status unavailable/);
});

// req: R-979
check("cleanup removes only a clean contained lane worktree", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-cleanup-")); const main = repo(root, "main");
	const tree = integration(main, "cleanup"); commit(tree, "next.txt", "next\n", "next"); git(main, "merge", "--ff-only", "feat/cleanup");
	const result = runCleanup("cleanup", { main, worktree: tree });
	assert.equal(result.code, 0, result.text); assert.match(result.text, /removed/);
});

// req: R-981
check("README and AGENTS describe the land helper", () => {
	const readme = readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "..", "README.md"), "utf8");
	const agents = readFileSync(path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../AGENTS.md"), "utf8");
	for (const text of [readme, agents]) {
		assert.match(text, /source tree.*clean|clean source/); assert.match(text, /verified.*LAND|verified review/); assert.match(text, /suite/);
		assert.match(text, /ff-only/); assert.match(text, /cleanup/i);
	}
});

if (failures) process.exitCode = 1;
