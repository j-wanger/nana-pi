/**
 * @module packages/nana-pack/tests/land.test.mjs
 * @purpose Pins the land helper's review checks, suite-before-merge order and safe cleanup.
 * @inputs nana-land.mjs and isolated temporary git repositories.
 * @outputs PASS/FAIL lines and a nonzero exit when a land contract fails.
 * @effects disk (temporary test repositories).
 * @errors Failed checks exit nonzero; unexpected exceptions fail the process.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { parseLandArgs, runLand as executeLand, runCleanup } from "../bin/nana-land.mjs";
import { admit, complete, withReviewLedgerLock } from "../bin/review-round.mjs";

let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); }
};
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const repo = (root, name) => {
	const dir = path.join(root, name); mkdirSync(dir, { recursive: true });
	git(dir, "init", "-b", "main"); git(dir, "config", "user.email", "land@test"); git(dir, "config", "user.name", "Land Test");
	writeFileSync(path.join(dir, "base.txt"), "base\n"); git(dir, "add", "base.txt"); git(dir, "commit", "-m", "base"); return dir;
};
const commit = (dir, file, data, message) => { writeFileSync(path.join(dir, file), data); git(dir, "add", file); git(dir, "commit", "-m", message); return git(dir, "rev-parse", "HEAD"); };
const tree = (dir, branch) => { git(dir, "worktree", "add", "-b", branch, path.join(path.dirname(dir), branch)); return path.join(path.dirname(dir), branch); };
const recordReview = (feature, home, item, verdict = "LAND") => {
	const admission = admit(["--item", item, "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs" });
	assert.equal(admission.ok, true, admission.message);
	return complete(admission.res, `VERDICT: ${verdict}`, { home });
};
const reviewTip = (feature, home, item = "item") => {
	const revision = git(feature, "rev-parse", "HEAD");
	const result = recordReview(feature, home, item);
	assert.equal(result.ok, true, result.message);
	return revision;
};
const runLand = (safe) => {
	if ((!safe.reviewed || safe.reviewed.length === 0) && safe.tree && safe.main) {
		const root = path.dirname(safe.tree);
		const home = safe.home ?? path.join(root, "home");
		mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
		const revision = reviewTip(safe.tree, home);
		safe.home = home;
		safe.reviewed = [`${revision}=item`];
	}
	return executeLand(safe);
};

// req: R-975
// req: R-1009
check("merge preflight refuses a non-main checkout", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-main-")); const main = repo(root, "main");
	git(main, "checkout", "-b", "other");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [] }); assert.notEqual(out.code, 0); assert.match(out.text, /main/i);
});
// req: R-975
check("tracked main changes refuse before running the suite", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-dirty-main-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); writeFileSync(path.join(main, "base.txt"), "dirty\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [] });
	assert.notEqual(out.code, 0); assert.match(out.text, /main checkout has tracked changes/i);
});
// req: R-975
check("tracked source changes refuse before running the suite", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-dirty-source-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); writeFileSync(path.join(feature, "base.txt"), "dirty\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [] });
	assert.notEqual(out.code, 0); assert.match(out.text, /tracked changes/i);
});
// req: R-975
check("suite-time main branch switch refuses before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-branch-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => {
		git(main, "checkout", "-b", "other"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /branch main/i); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-975
check("suite-time main tracked changes refuse before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-main-dirty-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => {
		writeFileSync(path.join(main, "base.txt"), "changed in suite\n"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /main checkout has tracked changes/i);
});
// req: R-975
check("suite-time source tracked changes refuse before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-source-dirty-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => {
		writeFileSync(path.join(feature, "base.txt"), "changed in suite\n"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /source tree has tracked changes/i);
});
// req: R-1005
check("final review reading, rechecks and ff-only merge run inside one ledger lock", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-final-lock-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home); const events = []; let lockCalls = 0;
	const runGit = (cwd, args) => {
		if (events.includes("suite")) events.push(`git:${args.join(" ")}`);
		try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
		catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const lock = (ledgerHome, step) => {
		lockCalls++;
		return withReviewLedgerLock(ledgerHome, (records) => { events.push("lock-enter", "locked-reading"); const result = step(records); events.push("lock-exit"); return result; });
	};
	const out = executeLand({ tree: feature, main, suite: "injected", reviewed: [`${tip}=item`], home, runGit, withReviewLedgerLock: lock,
		runCommand: () => { events.push("suite"); return { status: 0 }; },
		readReleaseStatus: () => { events.push("release-status"); return { line: "ready" }; } });
	const suiteAt = events.indexOf("suite"), exitAt = events.lastIndexOf("lock-exit");
	assert.equal(out.code, 0, out.text); assert.equal(lockCalls, 2);
	assert(events.slice(suiteAt + 1, exitAt).includes("locked-reading"));
	assert(events.slice(suiteAt + 1, exitAt).some((event) => event.includes("merge --ff-only")));
	assert(events.slice(suiteAt + 1, exitAt).some((event) => event.includes("branch --show-current")));
	assert(events.slice(suiteAt + 1, exitAt).some((event) => event.includes("rev-parse HEAD")));
	assert(events.slice(exitAt + 1).some((event) => event.includes("branch --show-current")));
	assert(events.slice(exitAt + 1).some((event) => event.includes("refs/heads/main")));
	assert(events.slice(exitAt + 1).some((event) => event.includes("merge-base --is-ancestor")));
	assert(events.slice(exitAt + 1).includes("release-status"));
	assert.equal(events.slice(exitAt + 1).some((event) => event.includes("merge --ff-only")), false);
});

// req: R-1005
check("a verified SEND-BACK written by the suite refuses before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-final-send-back-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home); const before = git(main, "rev-parse", "HEAD");
	const out = executeLand({ tree: feature, main, suite: "injected", reviewed: [`${tip}=item`], home,
		runCommand: () => { assert.equal(recordReview(feature, home, "late-review", "SEND-BACK").ok, true); return { status: 0 }; } });
	assert.notEqual(out.code, 0); assert.match(out.text, /non-LAND verdict/); assert.equal(git(main, "rev-parse", "HEAD"), before);
});

// req: R-975
// req: R-1005
check("suite-time source revision change refuses before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-tip-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => {
		commit(feature, "during-suite.txt", "changed\n", "during suite"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /source tip changed/i);
});
// req: R-975
// req: R-977
check("suite-time main divergence refuses before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-main-tip-")); const main = repo(root, "main");
	const initialMain = git(main, "rev-parse", "refs/heads/main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => {
		commit(main, "parallel.txt", "parallel\n", "parallel"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /HEAD.*captured|main checkout/i);
	assert.notEqual(git(main, "rev-parse", "refs/heads/main"), initialMain);
});
// req: R-975
check("non-fast-forward source tip refuses before running the suite", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-no-ff-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); commit(main, "parallel.txt", "parallel\n", "parallel");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [] });
	assert.notEqual(out.code, 0); assert.match(out.text, /ancestor/i);
});
// req: R-976
check("a reviewed SHA must be ancestor of the source tip and match a LAND record", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-review-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: tip, verdict: "NO-GO" }) + "\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${tip}=item`], home }); assert.notEqual(out.code, 0); assert.match(out.text, /LAND/i);
});
// req: R-976
check("a matching-item LAND round for a different revision cannot authorize a merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-wrong-revision-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const reviewed = commit(feature, "reviewed.txt", "reviewed\n", "reviewed"); const tip = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: tip, verdict: "LAND" }) + "\n");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [`${reviewed}=item`], home, runCommand: () => ({ status: 0 }) });
	assert.notEqual(out.code, 0); assert.match(out.text, /no verified .*LAND review/i); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-976
check("drifted LAND round cannot authorize a merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-unverified-review-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: sha, verdict: "LAND", unverified: true }) + "\n");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [`${sha}=item`], home, runCommand: () => ({ status: 0 }) });
	assert.notEqual(out.code, 0); assert.match(out.text, /no verified .*LAND review/i); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-976
// req: R-1002
check("uncovered integration commits are refused and named", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-reviewed-ok-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const reviewedSha = commit(feature, "reviewed.txt", "reviewed\n", "reviewed");
	const integrationSha = commit(feature, "integrated.txt", "integration\n", "integration"); const tip = commit(feature, "second-integration.txt", "second\n", "second integration");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	git(feature, "checkout", "--detach", reviewedSha); reviewTip(feature, home); git(feature, "checkout", "integration");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${reviewedSha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /uncovered commits/); assert(out.text.includes(tip)); assert(out.text.includes(integrationSha)); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-976
check("main commits outside the reviewed ancestry are not reported as unreviewed", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-already-main-")); const main = repo(root, "main");
	git(main, "checkout", "-b", "review-branch"); const reviewedSha = commit(main, "reviewed.txt", "reviewed\n", "reviewed");
	git(main, "checkout", "main"); const landedSha = commit(main, "landed.txt", "landed\n", "previous lane landed");
	const feature = tree(main, "integration"); git(feature, "merge", "--no-edit", "review-branch");
	const mergeSha = git(feature, "rev-parse", "HEAD"); const tip = commit(feature, "integration.txt", "integration\n", "integration");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	reviewTip(feature, home); const reviewedTip = git(feature, "rev-parse", "HEAD");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${reviewedTip}=item`], home });
	assert.equal(out.code, 0, out.text); assert.doesNotMatch(out.text, new RegExp(landedSha));
});
// req: R-976
check("a LAND round for another item does not authorize this item", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-wrong-item-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "different", revision: sha, verdict: "LAND" }) + "\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /no verified .*LAND review/i);
});
// req: R-976
check("a LAND commit outside the source tip ancestry is refused", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-nonancestor-")); const main = repo(root, "main");
	git(main, "checkout", "-b", "review-only"); const unrelated = commit(main, "review.txt", "review\n", "review");
	git(main, "checkout", "main"); const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: unrelated, verdict: "LAND" }) + "\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${unrelated}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /not an ancestor/i); assert.notEqual(unrelated, tip);
});
// req: R-976
check("annotated tag object IDs are not accepted as reviewed commits (R-976)", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-tag-object-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home); git(feature, "tag", "-a", "reviewed-tag", "-m", "tag");
	const tagObject = git(feature, "rev-parse", "refs/tags/reviewed-tag"); const before = git(main, "rev-parse", "HEAD");
	const out = executeLand({ tree: feature, main, suite: "true", reviewed: [`${tagObject}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /plain commit/i); assert.equal(git(main, "rev-parse", "HEAD"), before); assert.notEqual(tagObject, sha);
});
// req: R-976
check("snapshot review revisions are never accepted as plain reviewed commits", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-snapshot-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${sha}+snap:abc=item`] });
	assert.notEqual(out.code, 0); assert.match(out.text, /plain commit/i);
});
// req: R-976
// req: R-1003
check("runLand requires verified reviews", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-required-review-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); let suiteRan = false;
	const runCommand = () => { suiteRan = true; return { status: 0 }; };
	for (const options of [{}, { reviewed: [] }, { reviewed: [`${sha}=item`] }]) {
		const out = executeLand({ tree: feature, main, suite: "canonical", ...options, runCommand });
		assert.notEqual(out.code, 0); assert.match(out.text, /reviewed|LAND/i);
	}
	assert.equal(suiteRan, false); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-1006
check("an in-flight review of the reviewed tip refuses without merging", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-inflight-tip-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home); const held = admit(["--item", "pending", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs", pid: process.pid });
	assert.equal(held.ok, true, held.message); assert.equal(held.res.pid, process.pid); assert.equal(held.res.revision, tip);
	const before = git(main, "rev-parse", "HEAD"); const out = executeLand({ tree: feature, main, suite: "true", reviewed: [`${tip}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /review in flight/); assert.equal(git(main, "rev-parse", "HEAD"), before);
});

// req: R-1006
check("an in-flight snapshot review of the reviewed tip refuses without merging", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-inflight-snapshot-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home); writeFileSync(path.join(feature, "untracked-inflight.txt"), "snapshot state\\n");
	const held = admit(["--item", "pending-snapshot", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs", pid: process.pid });
	assert.equal(held.ok, true, held.message); assert.equal(held.res.pid, process.pid); assert.match(held.res.revision, new RegExp(`^${tip}\\+snap:`));
	const before = git(main, "rev-parse", "HEAD"); const out = executeLand({ tree: feature, main, suite: "true", reviewed: [`${tip}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /review in flight/); assert.equal(git(main, "rev-parse", "HEAD"), before);
});

// req: R-1006
check("an in-flight review of a different commit does not block land", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-inflight-other-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const prior = git(feature, "rev-parse", "HEAD"); const tip = commit(feature, "next.txt", "next\\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home); git(feature, "checkout", "--detach", prior);
	const held = admit(["--item", "pending-other", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs", pid: process.pid });
	assert.equal(held.ok, true, held.message); assert.notEqual(held.res.revision, tip); git(feature, "checkout", "integration");
	const out = executeLand({ tree: feature, main, suite: "true", reviewed: [`${tip}=item`], home });
	assert.equal(out.code, 0, out.text); assert.equal(git(main, "rev-parse", "HEAD"), tip);
});

// req: R-1004
check("a verified SEND-BACK for another item at the commit refuses land", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-send-back-other-item-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home, "item"); assert.equal(recordReview(feature, home, "another-item", "SEND-BACK").ok, true);
	const out = runLand({ tree: feature, main, suite: "true", reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /non-LAND verdict/i); assert.match(out.text, /another-item\/.*SEND-BACK/);
});
// req: R-1004
check("a verified SEND-BACK at a working-state snapshot refuses land", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-send-back-snapshot-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home, "item"); writeFileSync(path.join(feature, "untracked.txt"), "present during review\n");
	assert.equal(recordReview(feature, home, "snapshot-review", "SEND-BACK").ok, true);
	const out = runLand({ tree: feature, main, suite: "true", reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /non-LAND verdict/i); assert.match(out.text, /snapshot-review\/.*SEND-BACK/);
});
// req: R-1004
check("an explicit empty verdict beside LAND refuses land", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-empty-verdict-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home, "item"); const empty = admit(["--item", "empty-review", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs" });
	assert.equal(empty.ok, true, empty.message); assert.equal(complete(empty.res, "VERDICT: ", { home }).ok, true);
	const out = runLand({ tree: feature, main, suite: "true", reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /non-LAND verdict/i); assert.match(out.text, /empty-review\/.*empty/);
});
// req: R-1004
check("a legacy round without verdict does not block a version-2 LAND", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-legacy-no-verdict-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	const revision = reviewTip(feature, home); const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	const tally = path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl");
	writeFileSync(tally, `${JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "legacy", revision, role: "reviewer" })}\n${readFileSync(tally, "utf8")}`);
	const out = runLand({ tree: feature, main, suite: "true", reviewed: [`${sha}=item`], home });
	assert.equal(out.code, 0, out.text);
});
// req: R-1004
check("an unverified SEND-BACK beside LAND does not block land", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-unverified-send-back-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home, "item"); writeFileSync(path.join(feature, "base.txt"), "changed mid-review\n");
	const admission = admit(["--item", "unverified", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs" });
	assert.equal(admission.ok, true, admission.message); writeFileSync(path.join(feature, "base.txt"), "base\n");
	assert.equal(complete(admission.res, "VERDICT: SEND-BACK", { home }).ok, false);
	const out = runLand({ tree: feature, main, suite: "true", reviewed: [`${sha}=item`], home });
	assert.equal(out.code, 0, out.text);
});
// req: R-1011
check("a version-1 LAND alone refuses on the first tally reading", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-v1-first-read-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	mkdirSync(path.join(home, ".pi", "agent"), { recursive: true }); const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), `${JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: sha, verdict: "LAND" })}\n`);
	const out = runLand({ tree: feature, main, suite: "true", reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /version-2 LAND/i);
});
// req: R-1011
check("a version-1-only second tally reading refuses after the suite", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-v1-second-read-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	const revision = reviewTip(feature, home); const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir")); let suiteRan = false;
	const tally = path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl");
	const out = runLand({ tree: feature, main, suite: "injected", reviewed: [`${sha}=item`], home,
		runCommand: () => { suiteRan = true; writeFileSync(tally, `${JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision, verdict: "LAND" })}\n`); return { status: 0 }; } });
	assert.equal(suiteRan, true); assert.notEqual(out.code, 0); assert.match(out.text, /version-2 LAND/i); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-977
// req: R-1007
check("successful land updates main checkout files and leaves tracked state clean", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-invocations-")); const main = repo(root, "main");
	writeFileSync(path.join(main, "remove.txt"), "remove me\n"); git(main, "add", "remove.txt"); git(main, "commit", "-m", "add removable file");
	const feature = tree(main, "integration");
	writeFileSync(path.join(feature, "base.txt"), "modified\n"); writeFileSync(path.join(feature, "added.txt"), "added\n");
	git(feature, "rm", "remove.txt"); git(feature, "add", "base.txt", "added.txt"); git(feature, "commit", "-m", "change files");
	const tip = git(feature, "rev-parse", "HEAD"); const calls = [];
	const runGit = (cwd, args) => { calls.push({ cwd, args }); try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; } catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: "" }; } };
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runGit, runCommand: () => ({ status: 0 }) });
	assert.equal(out.code, 0, out.text);
	assert.equal(calls.filter(({ cwd, args }) => cwd === main && args[0] === "merge" && args[1] === "--ff-only").length, 1);
	assert(calls.some(({ cwd, args }) => cwd === main && args.join(" ") === `merge --ff-only ${tip}`));
	assert.equal(git(main, "rev-parse", "HEAD"), tip); assert.equal(readFileSync(path.join(main, "base.txt"), "utf8"), "modified\n");
	assert.equal(readFileSync(path.join(main, "added.txt"), "utf8"), "added\n"); assert.equal(existsSync(path.join(main, "remove.txt")), false);
	assert.equal(git(main, "status", "--porcelain", "--untracked-files=no"), "");
});
// req: R-977
check("untracked collision refuses land without changing main", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-collision-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "collision.txt", "landed\n", "add collision");
	writeFileSync(path.join(main, "collision.txt"), "untracked stays\n"); const before = git(main, "rev-parse", "HEAD");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => ({ status: 0 }) });
	assert.notEqual(out.code, 0); assert.match(out.text, /refused|failed/i); assert.doesNotMatch(out.text, /HANDOFF Landed:|Session archive stub:|push command:/);
	assert.equal(git(main, "rev-parse", "HEAD"), before); assert.equal(git(main, "rev-parse", "refs/heads/main"), before);
	assert.equal(readFileSync(path.join(main, "collision.txt"), "utf8"), "untracked stays\n"); assert.notEqual(tip, before);
});
// req: R-977
check("branch switch at merge invocation refuses without a success report", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-merge-switch-")); const main = repo(root, "main");
	const initialMain = git(main, "rev-parse", "refs/heads/main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	git(main, "branch", "other", initialMain);
	const calls = []; let switched = false;
	const runGit = (cwd, args) => {
		calls.push({ cwd, args });
		if (cwd === main && args[0] === "merge" && !switched) { git(main, "checkout", "other"); switched = true; }
		try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
		catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runGit, runCommand: () => ({ status: 0 }) });
	assert(calls.some(({ cwd, args }) => cwd === main && args[0] === "merge"), "switch injection must run immediately before merge");
	assert.notEqual(out.code, 0); assert.match(out.text, /branch main/i); assert.doesNotMatch(out.text, /HANDOFF Landed:|Session archive stub:|push command:/);
	assert.equal(git(main, "rev-parse", "refs/heads/main"), initialMain); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "other")); assert.notEqual(tip, initialMain);
});
// req: R-977
check("main advancing during suite refuses before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-cas-")); const main = repo(root, "main");
	const initialMain = git(main, "rev-parse", "refs/heads/main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	let advancedMain;
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => {
		commit(main, "parallel.txt", "parallel\n", "parallel"); advancedMain = git(main, "rev-parse", "refs/heads/main"); return { status: 0 };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /HEAD.*captured|main checkout/i);
	assert.notEqual(advancedMain, initialMain); assert.equal(git(main, "rev-parse", "refs/heads/main"), advancedMain); assert.notEqual(advancedMain, tip);
});
// req: R-977
check("suite command runs in the source tree", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-suite-cwd-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); let suiteCwd = null;
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: (_command, cwd) => { suiteCwd = cwd; return { status: 0, stdout: "", stderr: "" }; } });
	assert.equal(out.code, 0, out.text); assert.equal(suiteCwd, feature);
});
// req: R-977
check("suite failure leaves main unchanged and prints no success report", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-suite-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); const before = git(main, "rev-parse", "HEAD");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(7)'", reviewed: [] });
	assert.notEqual(out.code, 0); assert.equal(git(main, "rev-parse", "HEAD"), before); assert.doesNotMatch(out.text, /Landed:/);
});
// req: R-977
check("a suite killed by signal refuses and names a nonzero exit", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-signal-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "unused", reviewed: [], runCommand: () => ({ status: null, signal: "SIGTERM", stdout: "", stderr: "" }) });
	assert.notEqual(out.code, 0); assert.match(out.text, /exit SIGTERM/); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-979
check("cleanup refuses a contained branch when checkout is not on main", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-nonmain-")); const main = repo(root, "main");
	const feature = tree(main, "feat/other"); commit(feature, "next.txt", "next\n", "next"); git(main, "merge", "--ff-only", "feat/other"); git(main, "checkout", "-b", "alternate");
	const result = runCleanup("other", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /checkout.*main/i); assert.equal(existsSync(feature), true);
});
// req: R-979
check("cleanup refuses a branch not contained by main", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-")); const main = repo(root, "main");
	const feature = tree(main, "feat/other"); commit(feature, "next.txt", "next\n", "next");
	const result = runCleanup("other", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /contained/i, result.text);
});
// req: R-979
check("cleanup refuses untracked dirt in a contained worktree", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-dirty-")); const main = repo(root, "main");
	const feature = tree(main, "feat/dirty"); commit(feature, "next.txt", "next\n", "next"); git(main, "merge", "--ff-only", "feat/dirty");
	writeFileSync(path.join(feature, "extra.txt"), "untracked\n");
	const result = runCleanup("dirty", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /dirty/i);
});
// req: R-979
check("cleanup refuses a branch checked out in multiple worktrees", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-dupe-")); const main = repo(root, "main");
	const feature = tree(main, "feat/dupe"); commit(feature, "next.txt", "next\n", "next"); git(main, "merge", "--ff-only", "feat/dupe");
	const duplicate = path.join(root, "duplicate"); execFileSync("git", ["worktree", "add", "--force", duplicate, "feat/dupe"], { cwd: main, stdio: "ignore" });
	const result = runCleanup("dupe", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /multiple worktrees/i);
});
// req: R-979
check("cleanup reports a lane branch deleted before cleanup", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-deleted-")); const main = repo(root, "main");
	const feature = tree(main, "feat/deleted"); commit(feature, "next.txt", "next\n", "next");
	git(main, "update-ref", "-d", "refs/heads/feat/deleted");
	const result = runCleanup("deleted", { main, worktree: feature }); assert.notEqual(result.code, 0); assert.match(result.text, /does not exist/i);
});
// req: R-979
check("cleanup removes a contained feat branch without force", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clean-ok-")); const main = repo(root, "main");
	const feature = tree(main, "feat/landed"); commit(feature, "next.txt", "next\n", "next"); git(main, "merge", "--ff-only", "feat/landed");
	const calls = []; const runGit = (cwd, args) => {
		calls.push({ cwd, args });
		try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
		catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const result = runCleanup("landed", { main, worktree: feature, runGit });
	assert.equal(result.code, 0, result.text);
	assert(calls.some(({ cwd, args }) => cwd === main && args.length === 3 && args[0] === "worktree" && args[1] === "remove" && args[2] === feature));
	assert(calls.some(({ cwd, args }) => cwd === main && args.length === 3 && args[0] === "branch" && args[1] === "-d" && args[2] === "feat/landed"));
	assert.equal(existsSync(feature), false); assert.throws(() => git(main, "show-ref", "--verify", "refs/heads/feat/landed"));
});
// req: R-981
check("README and AGENTS describe the land helper", () => {
	const repoRoot = path.resolve(new URL("../../..", import.meta.url).pathname);
	const readme = readFileSync(path.join(repoRoot, "packages/nana-pack/README.md"), "utf8");
	for (const pattern of [/nana-land merge/, /clean source tree/, /clean tracked state.*checkout on `main`/, /verified `LAND` review/, /runs the suite/, /suite in the source tree/, /Immediately before merging it rechecks/, /one `git merge --ff-only/, /main ref equal to the tip/, /verifies containment/, /branch switch.*between the final check and merge is not defended/, /Do not operate the main checkout during a land/, /helper refuses afterwards without success records/, /untracked collision/, /is a separate operation/, /clean worktree whose.*branch is contained in `main`/]) assert.match(readme, pattern);
	const agents = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
	for (const pattern of [/clean source/, /clean `main` checkout/, /verified review rounds/, /suite on the reviewed tip/, /rerun the suite if either checkout changes/, /ff-only merge, and containment verification/, /separate operation/, /clean.*worktree contained in `main`/]) assert.match(agents, pattern);
	assert.match(agents, /use `nana-land`/); assert.match(agents, /clean `main` checkout/); assert.match(agents, /verified review rounds/); assert.match(agents, /rerun the suite if either checkout changes/); assert.match(agents, /ff-only merge, and containment verification/); assert.match(agents, /clean `feat\/<lane>` worktree contained in `main`/);
	assert.equal(JSON.parse(readFileSync(path.join(repoRoot, "packages/nana-pack/package.json"), "utf8")).bin["nana-land"], "bin/nana-land.mjs");
});
// req: R-588
check("successful merge prints post-merge release status and divergence", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-release-normal-")); const main = repo(root, "main");
	writeFileSync(path.join(main, "copier.yml"), "source\n"); mkdirSync(path.join(main, "templates"), { recursive: true }); writeFileSync(path.join(main, "templates", "base"), "base\n");
	git(main, "add", "copier.yml", "templates"); git(main, "commit", "-m", "template base"); git(main, "tag", "v0.1.0");
	const bare = path.join(root, "origin.git"); git(root, "init", "--bare", bare); git(main, "remote", "add", "origin", bare); git(main, "push", "-u", "origin", "main");
	const feature = tree(main, "integration"); commit(feature, "templates/new", "new\n", "template change");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => ({ status: 0 }) });
	assert.equal(out.code, 0, out.text); assert.match(out.text, /release status: .*1 template commit.*v0\.1\.0.*main 1 ahead.*origin/i);
});
// req: R-588
check("release status failure after merge keeps success code and output", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-release-failure-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next"); let releaseStarted = false;
	const runGit = (cwd, args) => {
		if (releaseStarted) return { status: 128, stdout: "", stderr: "injected failure" };
		try {
			const stdout = execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
			if (cwd === main && args.join(" ") === "rev-parse --verify --quiet refs/heads/main") releaseStarted = true;
			return { status: 0, stdout, stderr: "" };
		} catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runGit, runCommand: () => ({ status: 0 }) });
	assert.equal(out.code, 0, out.text); assert.equal(git(main, "rev-parse", "HEAD"), tip);
	assert.match(out.text, /release status: .*unavailable/i); assert.match(out.text, /push command:/); assert.doesNotMatch(out.text, /Session archive stub:|HANDOFF Landed:/);
	const throwingRoot = tmpDir(path.join(os.tmpdir(), "land-release-throw-")); const throwingMain = repo(throwingRoot, "main");
	const throwingFeature = tree(throwingMain, "integration"); const throwingTip = commit(throwingFeature, "next.txt", "next\n", "next");
	const guarded = runLand({ tree: throwingFeature, main: throwingMain, suite: "canonical", reviewed: [], runCommand: () => ({ status: 0 }), readReleaseStatus: () => { throw new Error("injected status reader failure"); } });
	assert.equal(guarded.code, 0, guarded.text); assert.equal(git(throwingMain, "rev-parse", "HEAD"), throwingTip);
	assert.match(guarded.text, /release status: .*unavailable/i); assert.match(guarded.text, /push command:/); assert.doesNotMatch(guarded.text, /Session archive stub:|HANDOFF Landed:/);
});
// req: R-588
check("successful merge without copier reports only the origin release clause", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-release-no-copier-")); const main = repo(root, "main");
	const bare = path.join(root, "origin.git"); git(root, "init", "--bare", bare); git(main, "remote", "add", "origin", bare); git(main, "push", "-u", "origin", "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], runCommand: () => ({ status: 0 }) });
	assert.equal(out.code, 0, out.text); assert.match(out.text, /release status: .*not a template source.*origin/i); assert.doesNotMatch(out.text, /template commits?/i);
});
// req: R-1003
check("unknown land options, including either exemption placement, are named before git runs", () => {
	for (const args of [
		["merge", "--tree", "/tmp/tree", "--main", "/tmp/main", "--suite", "true", "--exempt", "reason", "--reviewed", "abc=item"],
		["merge", "--tree", "/tmp/tree", "--main", "/tmp/main", "--suite", "true", "--reviewed", "abc=item", "--exempt", "reason"],
		["merge", "--tree", "/tmp/tree", "--main", "/tmp/main", "--suite", "true", "--reviewed", "abc=item", "--mystery", "x"],
	]) {
		assert.throws(() => parseLandArgs(args), (error) => {
			const rejected = args[args.indexOf("--exempt") >= 0 ? args.indexOf("--exempt") : args.indexOf("--mystery")];
			assert.match(error.message, new RegExp(rejected)); return true;
		});
	}
});
// req: R-1007
check("successful land output keeps push and release status but has no archive stubs", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-output-shape-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [] });
	assert.equal(out.code, 0, out.text); assert.match(out.text, /push command:/); assert.match(out.text, /release status:/);
	assert.doesNotMatch(out.text, /HANDOFF|session archive/i);
});
// req: R-1009
check("a separate clone is refused before reviewed-SHA resolution or ledger reading", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-clone-order-")); const main = repo(root, "main");
	const clone = path.join(root, "clone"); git(root, "clone", main, clone);
	const reviewed = "a".repeat(40); const calls = [];
	const runGit = (cwd, args) => {
		calls.push({ cwd, args });
		try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
		catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const out = executeLand({ tree: clone, main, suite: "true", reviewed: [`${reviewed}=item`], runGit });
	assert.notEqual(out.code, 0); assert.match(out.text, /share one git repository/);
	assert.equal(calls.some(({ args }) => args[0] === "cat-file" || (args[0] === "rev-parse" && args.includes(reviewed))), false);
});
process.exit(failures ? 1 : 0);
