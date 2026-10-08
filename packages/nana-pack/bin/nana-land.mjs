#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-land.mjs
 * @purpose Verify reviewed integration work, land it by fast-forward, and safely remove contained lane worktrees.
 * @inputs merge or cleanup arguments, a home directory for the review ledger, and an injectable process runner.
 * @outputs Named pure argument helpers and command results or printed CLI records.
 * @effects process (runs git and a suite command), disk (git merge and worktree cleanup).
 * @errors Invalid arguments, failed preconditions, suite failures, and git failures return a named refusal without continuing.
 */
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readRounds } from "./review-round.mjs";

const gitDefault = (cwd, args) => spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const commandDefault = (command, cwd) => spawnSync(command, { cwd, shell: true, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
const resultText = (r) => `${r.stdout ?? ""}${r.stderr ?? ""}`;
const git = (runner, cwd, ...args) => {
	const r = runner(cwd, args);
	if (r.error || r.status !== 0) throw new Error(`git ${args.join(" ")} failed in ${cwd} (exit ${r.status ?? r.signal ?? "unknown"}): ${(r.stderr ?? r.error?.message ?? "").trim()}`);
	return (r.stdout ?? "").trim();
};
const assertCleanTracked = (runner, cwd, label) => {
	const r = runner(cwd, ["diff", "--quiet", "HEAD", "--"]);
	if (r.error || r.status !== 0) throw new Error(`${label} has tracked changes (git diff exit ${r.status ?? r.signal ?? "unknown"})`);
};
const isAncestor = (runner, ancestor, descendent, cwd) => {
	const r = runner(cwd, ["merge-base", "--is-ancestor", ancestor, descendent]);
	if (r.error || r.status === null) throw new Error(`git ancestor check failed: ${r.error?.message ?? r.signal ?? "unknown"}`);
	return r.status === 0;
};

/** Parse land CLI arguments, preserving repeated reviewed specifications. */
export function parseLandArgs(args) {
	const mode = args[0];
	if (mode !== "merge" && mode !== "cleanup") throw new Error("usage: nana-land merge|cleanup …");
	const positional = mode === "cleanup" ? args[1] : null;
	const options = { mode, lane: positional, reviewed: [] };
	for (let i = mode === "cleanup" ? 2 : 1; i < args.length; i++) {
		const key = args[i];
		if (!["--tree", "--main", "--suite", "--reviewed", "--exempt"].includes(key)) throw new Error(`unknown option ${key}`);
		const value = args[++i];
		if (!value || value.startsWith("--")) throw new Error(`${key} needs a value`);
		if (key === "--reviewed") options.reviewed.push(value);
		else options[key.slice(2)] = value;
	}
	if (!options.main) throw new Error("--main is required");
	if (mode === "merge" && (!options.tree || !options.suite)) throw new Error("merge requires --tree and --suite");
	if (mode === "cleanup" && (!options.lane || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(options.lane))) throw new Error("cleanup needs a safe lane name");
	if (options.exempt !== undefined) {
		options.exempt = options.exempt.trim();
		if (!options.exempt) throw new Error("--exempt needs a nonblank reason");
	}
	if (options.exempt && options.reviewed.length) throw new Error("--exempt and --reviewed cannot be combined");
	if (mode === "merge" && !options.exempt && !options.reviewed.length) throw new Error("merge requires --reviewed or --exempt");
	return options;
}

function reviewedPairs(pairs) {
	return pairs.map((pair) => {
		const at = pair.indexOf("=");
		if (at < 1 || at === pair.length - 1) throw new Error(`invalid --reviewed ${JSON.stringify(pair)}; expected <sha>=<item>`);
		return { sha: pair.slice(0, at), item: pair.slice(at + 1) };
	});
}

/** Run a fail-closed merge; runGit and runCommand are injectable for controlled callers and tests. */
export function runLand({ tree, main, suite, reviewed = [], exempt, home = os.homedir(), runGit = gitDefault, runCommand = commandDefault, readLedger = readRounds, now = new Date() }) {
	try {
		tree = path.resolve(tree); main = path.resolve(main);
		if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main");
		assertCleanTracked(runGit, main, "main checkout");
		assertCleanTracked(runGit, tree, "source tree");
		const tip = git(runGit, tree, "rev-parse", "HEAD^{commit}");
		const mainSha = git(runGit, main, "rev-parse", "HEAD^{commit}");
		if (!isAncestor(runGit, mainSha, tip, main)) throw new Error("main is not an ancestor of the source tip; fast-forward is impossible");
		const reviewRefs = [];
		if (!exempt) {
			for (const { sha, item } of reviewedPairs(reviewed)) {
				if (!/^[0-9a-f]{40,64}$/i.test(sha)) throw new Error(`review revision ${sha} is not a plain commit SHA`);
				if (sha.includes("+snap:")) throw new Error(`review revision ${sha} is a snapshot, not a plain commit`);
				const type = git(runGit, tree, "cat-file", "-t", sha);
				if (type !== "commit") throw new Error(`review revision ${sha} is not a commit`);
				if (!isAncestor(runGit, sha, tip, tree)) throw new Error(`review revision ${sha} is not an ancestor of source tip`);
				const common = git(runGit, tree, "rev-parse", "--git-common-dir");
				const repo = `git:${realpathSync(path.resolve(tree, common))}`;
				const rounds = readLedger(home, { repo, item });
				if (!rounds.some((round) => round.revision === sha && round.verdict === "LAND" && round.unverified !== true)) throw new Error(`no verified LAND review for item ${item} at revision ${sha}`);
				reviewRefs.push(sha);
			}
		}
		const unreviewed = reviewRefs.length ? git(runGit, tree, "rev-list", tip, "--not", ...reviewRefs).split(/\r?\n/).filter(Boolean) : [];
		const notReviewedText = unreviewed.length ? `not reviewed: ${unreviewed.join(", ")}\n` : "";
		const suiteResult = runCommand(suite, tree);
		const suiteCode = suiteResult.status ?? (suiteResult.signal ? 128 : 1);
		if (suiteResult.error || suiteCode !== 0) return { code: 1, text: `${notReviewedText}suite failed (exit ${suiteResult.status ?? suiteResult.signal ?? "unknown"})\n${resultText(suiteResult)}` };
		if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main immediately before merge");
		assertCleanTracked(runGit, main, "main checkout");
		assertCleanTracked(runGit, tree, "source tree");
		if (git(runGit, tree, "rev-parse", "HEAD^{commit}") !== tip) throw new Error("source tip changed during suite");
		const currentMainSha = git(runGit, main, "rev-parse", "HEAD^{commit}");
		if (!isAncestor(runGit, currentMainSha, tip, main)) throw new Error("main is not an ancestor of the unchanged source tip; fast-forward is impossible");
		git(runGit, main, "merge", "--ff-only", tip);
		if (!isAncestor(runGit, tip, git(runGit, main, "rev-parse", "HEAD"), main)) throw new Error("containment check failed: landed tip is not an ancestor of main");
		const date = now.toISOString().slice(0, 10);
		const archive = `Session archive stub: ${date} — lane ${path.basename(tree)}${reviewRefs.length ? ` — reviewed ${reviewRefs.map((r) => r.slice(0, 12)).join(", ")}` : ""}${exempt ? ` — exempt: ${exempt}` : ""}.`;
		return { code: 0, text: `${notReviewedText}push command: git push\n${archive}\nHANDOFF Landed: ${date} — ${path.basename(tree)} — landed ${tip.slice(0, 12)}.\n` };
	} catch (error) { return { code: 1, text: `refused: ${error.message}\n` }; }
}

/** Safely remove a landed lane worktree and its feat branch; refuses force and dirty trees. */
export function runCleanup(lane, { main, worktree, runGit = gitDefault } = {}) {
	try {
		main = path.resolve(main);
		if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main");
		if (typeof lane !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(lane)) throw new Error("cleanup needs a safe lane name");
		const branch = `feat/${lane}`;
		const exists = runGit(main, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]);
		if (exists.error || exists.status !== 0) throw new Error(`branch ${branch} does not exist`);
		const listed = git(runGit, main, "worktree", "list", "--porcelain");
		const blocks = listed.split(/\n\n/).filter(Boolean);
		const matches = blocks.filter((b) => b.split(/\r?\n/).includes(`branch refs/heads/${branch}`));
		if (matches.length > 1) throw new Error(`branch ${branch} is checked out in multiple worktrees`);
		const match = matches[0];
		if (!match) throw new Error(`branch ${branch} has no registered worktree (or its worktree was deleted)`);
		const registeredPath = match.match(/^worktree (.+)$/m)?.[1];
		if (!registeredPath) throw new Error(`cannot resolve worktree for ${branch}`);
		worktree = path.resolve(worktree ?? registeredPath);
		try {
			if (realpathSync(worktree) !== realpathSync(registeredPath)) throw new Error(`worktree path does not match registered branch ${branch}`);
		} catch (error) { throw new Error(error.message.includes("does not match") ? error.message : `worktree for ${branch} is missing or unavailable: ${error.message}`); }
		const status = git(runGit, worktree, "status", "--porcelain");
		if (status) throw new Error(`worktree ${worktree} is dirty`);
		const mainSha = git(runGit, main, "rev-parse", "HEAD");
		const branchSha = git(runGit, main, "rev-parse", branch);
		if (!isAncestor(runGit, branchSha, mainSha, main)) throw new Error(`branch ${branch} is not contained in main`);
		git(runGit, main, "worktree", "remove", worktree);
		git(runGit, main, "branch", "-d", branch);
		return { code: 0, text: `removed ${worktree} and ${branch}\n` };
	} catch (error) { return { code: 1, text: `refused: ${error.message}\n` }; }
}

export function main(args = process.argv.slice(2)) {
	try {
		const options = parseLandArgs(args);
		return options.mode === "merge" ? runLand(options) : runCleanup(options.lane, options);
	} catch (error) { return { code: 1, text: `refused: ${error.message}\n` }; }
}
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	const result = main(); process.stdout.write(result.text); process.exitCode = result.code;
}
