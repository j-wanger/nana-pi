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
import { canonicalItem, withReviewLedgerLock, repoKeyOf } from "./review-round.mjs";
import { releaseStatus } from "../lib/release-status.mjs";
import { realPath } from "../lib/real-path.mjs";

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
		if (!["--tree", "--main", "--suite", "--reviewed"].includes(key)) throw new Error(`unknown option ${key}`);
		const value = args[++i];
		if (!value || value.startsWith("--")) throw new Error(`${key} needs a value`);
		if (key === "--reviewed") options.reviewed.push(value);
		else options[key.slice(2)] = value;
	}
	if (!options.main) throw new Error("--main is required");
	if (mode === "merge" && (!options.tree || !options.suite)) throw new Error("merge requires --tree and --suite");
	if (mode === "cleanup" && (!options.lane || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(options.lane))) throw new Error("cleanup needs a safe lane name");
	if (mode === "merge" && !options.reviewed.length) throw new Error("merge requires --reviewed");
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
export function runLand({ tree, main, suite, reviewed = [], home = os.homedir(), runGit = gitDefault, runCommand = commandDefault, withReviewLedgerLock: lockReviews = withReviewLedgerLock, readReleaseStatus = releaseStatus }) {
	try {
		tree = path.resolve(tree); main = path.resolve(main);
		const repo = repoKeyOf(tree);
		if (repo !== repoKeyOf(main)) throw new Error("--tree and --main must share one git repository");
		if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main");
		assertCleanTracked(runGit, main, "main checkout");
		assertCleanTracked(runGit, tree, "source tree");
		const capturedMain = git(runGit, main, "rev-parse", "refs/heads/main");
		const tip = git(runGit, tree, "rev-parse", "HEAD^{commit}");
		if (!isAncestor(runGit, capturedMain, tip, main)) throw new Error("main is not an ancestor of the source tip; fast-forward is impossible");
		const refs = reviewedPairs(reviewed).map(({ sha, item }) => {
			if (!/^[0-9a-f]{40,64}$/i.test(sha)) throw new Error(`review revision ${sha} is not a plain commit SHA`);
			if (git(runGit, tree, "cat-file", "-t", sha) !== "commit") throw new Error(`review revision ${sha} is not a plain commit SHA`);
			const canonicalSha = git(runGit, tree, "rev-parse", "--verify", `${sha}^{commit}`).toLowerCase();
			const canonical = canonicalItem(item);
			if (!isAncestor(runGit, canonicalSha, tip, tree)) throw new Error(`review revision ${canonicalSha} is not an ancestor of source tip`);
			return { sha: canonicalSha, item: canonical };
		});
		const reviewRefs = refs.map((r) => r.sha);
		const firstRead = lockReviews(home, ({ rounds, reservations }) => ({ rounds: rounds.filter((r) => r.repo === repo), reservations: reservations.filter((r) => r.repo === repo) }));
		const checkRecords = (rounds, reservations) => {
			for (const { sha, item } of refs) {
				if (!rounds.some((r) => r.v === 2 && r.revision === sha && r.item === item && r.verdict === "LAND" && r.unverified !== true)) throw new Error(`no verified version-2 LAND review for item ${item} at revision ${sha}`);
				const bad = rounds.filter((r) => r.unverified !== true && (r.revision === sha || r.head === sha) && Object.hasOwn(r, "verdict") && r.verdict !== "LAND");
				if (bad.length) throw new Error(`non-LAND verdict record(s) for ${sha}: ${bad.map((r) => `${r.item}/${r.revision}/${r.verdict ?? "empty"}`).join(", ")}`);
				const inflight = reservations.filter((r) => r.revision === sha || String(r.revision).split("+snap:")[0] === sha);
				if (inflight.length) throw new Error(`review in flight for ${sha}`);
			}
		};
		checkRecords(firstRead.rounds, firstRead.reservations);
		const unreviewed = git(runGit, tree, "rev-list", tip, "--not", capturedMain, ...reviewRefs).split(/\r?\n/).filter(Boolean);
		if (unreviewed.length) {
			const named = unreviewed.map((sha) => `${sha} ${git(runGit, tree, "show", "-s", "--format=%s", sha)}`);
			throw new Error(`uncovered commits (get it reviewed with a new round on the tip or drop it): ${named.join("; ")}`);
		}
		const suiteResult = runCommand(suite, tree);
		const suiteCode = suiteResult.status ?? (suiteResult.signal ? 128 : 1);
		if (suiteResult.error || suiteCode !== 0) return { code: 1, text: `suite failed (exit ${suiteResult.status ?? suiteResult.signal ?? "unknown"})\n${resultText(suiteResult)}` };
		lockReviews(home, ({ rounds, reservations }) => {
			checkRecords(rounds.filter((r) => r.repo === repo), reservations.filter((r) => r.repo === repo));
			if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main immediately before merge");
			assertCleanTracked(runGit, main, "main checkout");
			if (git(runGit, main, "rev-parse", "HEAD") !== capturedMain) throw new Error("main checkout HEAD changed during suite");
			assertCleanTracked(runGit, tree, "source tree");
			if (git(runGit, tree, "rev-parse", "HEAD^{commit}") !== tip) throw new Error("source tip changed during suite");
			git(runGit, main, "merge", "--ff-only", tip);
			if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout switched away from branch main during merge");
			if (git(runGit, main, "rev-parse", "refs/heads/main") !== tip) throw new Error("main ref does not equal landed tip after merge");
		});
		if (git(runGit, main, "branch", "--show-current") !== "main") throw new Error("main checkout is not on branch main after merge");
		if (git(runGit, main, "rev-parse", "refs/heads/main") !== tip) throw new Error("main ref does not equal landed tip after merge");
		assertCleanTracked(runGit, main, "main checkout after merge");
		if (!isAncestor(runGit, tip, "refs/heads/main", main)) throw new Error("containment check failed: landed tip is not an ancestor of main");
		let releaseLine;
		try { releaseLine = readReleaseStatus({ repo: main, runGit }).line; }
		catch (error) { releaseLine = `release status unavailable (${error?.message ?? "unknown error"})`; }
		return { code: 0, text: `push command: git push\nrelease status: ${releaseLine}\n` };
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
			if (realPath(worktree, { mustExist: true }) !== realPath(registeredPath, { mustExist: true })) throw new Error(`worktree path does not match registered branch ${branch}`);
		} catch (error) { throw new Error(error.message.includes("does not match") ? error.message : `worktree for ${branch} is missing or unavailable: ${error.message}`); }
		const status = git(runGit, worktree, "status", "--porcelain");
		if (status) throw new Error(`worktree ${worktree} is dirty`);
		const branchSha = git(runGit, main, "rev-parse", branch);
		if (!isAncestor(runGit, branchSha, "refs/heads/main", main)) throw new Error(`branch ${branch} is not contained in main`);
		// Remove by git's OWN registered spelling (not the possibly differently spelled --worktree
		// argument): worktree remove must match what git registered, or it refuses on some platforms.
		git(runGit, main, "worktree", "remove", registeredPath);
		git(runGit, main, "branch", "-d", branch);
		return { code: 0, text: `removed ${registeredPath} and ${branch}\n` };
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
