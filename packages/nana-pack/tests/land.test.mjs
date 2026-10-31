/**
 * @module packages/nana-pack/tests/land.test.mjs
 * @purpose Pins the land helper's review checks, suite-before-merge order and safe cleanup.
 * @inputs nana-land.mjs and isolated temporary git repositories.
 * @outputs PASS/FAIL lines and a nonzero exit when a land contract fails.
 * @effects disk (temporary test repositories).
 * @errors Failed checks exit nonzero; unexpected exceptions fail the process.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { ciFixture, commit, ensureCiReview, executeCi, git, gitRunner, recordReview, repo, reviewTip, runList, tree, workflowRun } from "./land-fixtures.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import * as nanaLand from "../bin/nana-land.mjs";
const { parseLandArgs, runLand: executeLand, runCleanup } = nanaLand;
import { admit, complete, ledgerPaths, reviewTextPath, withReviewLedgerLock } from "../bin/review-round.mjs";
import { realPath } from "../lib/real-path.mjs";
import * as landConfig from "../lib/land-config.mjs";
const { LAND_NOTE_PREFIX, LAND_TIP_ENV } = landConfig;
import { COMPLETION_FILE, COVERAGE_ENV } from "../lib/runtime-map-config.mjs";
import { checkoutDrift, hashFile } from "../lib/runtime-map.mjs";

const TEST_LOCKED = fileURLToPath(new URL("../../../scripts/test-locked.mjs", import.meta.url));

const PI_REVIEW = fileURLToPath(new URL("../bin/pi-review.mjs", import.meta.url));

let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); }
};
const tallyRows = (home) => readFileSync(ledgerPaths(home).tally, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const writeTallyRows = (home, rows) => writeFileSync(ledgerPaths(home).tally, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
const recordTextReview = (feature, home, item, text) => {
	const admission = admit(["--item", item, "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs" });
	assert.equal(admission.ok, true, admission.message);
	const completed = complete(admission.res, text, { home, text });
	assert.equal(completed.ok, true, completed.message);
	return tallyRows(home).at(-1);
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
const assertCiRefused = (fixture, runs, expected, options = {}) => {
	const before = git(fixture.main, "rev-parse", "HEAD"); const out = executeCi(fixture, runs, options);
	assert.equal(out.code, 1, out.text); assert.match(out.text, /^refused:/); assert.match(out.text, expected); assert.equal(out.suiteRan, false); assert.equal(git(fixture.main, "rev-parse", "HEAD"), before); return out;
};

// req: R-975
// req: R-1009
check("merge preflight refuses a non-main checkout", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-main-")); const main = repo(root, "main");
	git(main, "checkout", "-b", "other");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [] }); assert.notEqual(out.code, 0); assert.match(out.text, /main/i);
});
// req: R-975
check("tracked main changes refuse before running the suite", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-dirty-main-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); writeFileSync(path.join(main, "base.txt"), "dirty\n");
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [] });
	assert.notEqual(out.code, 0); assert.match(out.text, /main checkout has tracked changes/i);
});
// req: R-975
check("tracked source changes refuse before running the suite", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-dirty-source-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); writeFileSync(path.join(feature, "base.txt"), "dirty\n");
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [] });
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
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [] });
	assert.notEqual(out.code, 0); assert.match(out.text, /ancestor/i);
});
// req: R-976
check("a reviewed SHA must be ancestor of the source tip and match a LAND record", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-review-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: tip, verdict: "NO-GO" }) + "\n");
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${tip}=item`], home }); assert.notEqual(out.code, 0); assert.match(out.text, /LAND/i);
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
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${reviewedSha}=item`], home });
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
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${reviewedTip}=item`], home });
	assert.equal(out.code, 0, out.text); assert.doesNotMatch(out.text, new RegExp(landedSha));
});
// req: R-976
check("a LAND round for another item does not authorize this item", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-wrong-item-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "different", revision: sha, verdict: "LAND" }) + "\n");
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${sha}=item`], home });
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
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${unrelated}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /not an ancestor/i); assert.notEqual(unrelated, tip);
});
// req: R-976
check("annotated tag object IDs are not accepted as reviewed commits (R-976)", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-tag-object-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home); git(feature, "tag", "-a", "reviewed-tag", "-m", "tag");
	const tagObject = git(feature, "rev-parse", "refs/tags/reviewed-tag"); const before = git(main, "rev-parse", "HEAD");
	const out = executeLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${tagObject}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /plain commit/i); assert.equal(git(main, "rev-parse", "HEAD"), before); assert.notEqual(tagObject, sha);
});
// req: R-976
check("snapshot review revisions are never accepted as plain reviewed commits", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-snapshot-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${sha}+snap:abc=item`] });
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
	const before = git(main, "rev-parse", "HEAD"); const out = executeLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${tip}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /review in flight/); assert.equal(git(main, "rev-parse", "HEAD"), before);
});

// req: R-1006
check("an in-flight snapshot review of the reviewed tip refuses without merging", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-inflight-snapshot-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home); writeFileSync(path.join(feature, "untracked-inflight.txt"), "snapshot state\\n");
	const held = admit(["--item", "pending-snapshot", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs", pid: process.pid });
	assert.equal(held.ok, true, held.message); assert.equal(held.res.pid, process.pid); assert.match(held.res.revision, new RegExp(`^${tip}\\+snap:`));
	const before = git(main, "rev-parse", "HEAD"); const out = executeLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${tip}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /review in flight/); assert.equal(git(main, "rev-parse", "HEAD"), before);
});

// req: R-1006
check("an in-flight review of a different commit does not block land", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-inflight-other-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const prior = git(feature, "rev-parse", "HEAD"); const tip = commit(feature, "next.txt", "next\\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home); git(feature, "checkout", "--detach", prior);
	const held = admit(["--item", "pending-other", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs", pid: process.pid });
	assert.equal(held.ok, true, held.message); assert.notEqual(held.res.revision, tip); git(feature, "checkout", "integration");
	const out = executeLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${tip}=item`], home });
	assert.equal(out.code, 0, out.text); assert.equal(git(main, "rev-parse", "HEAD"), tip);
});

// req: R-1004
check("a verified SEND-BACK for another item at the commit refuses land", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-send-back-other-item-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home, "item"); assert.equal(recordReview(feature, home, "another-item", "SEND-BACK").ok, true);
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /non-LAND verdict/i); assert.match(out.text, /another-item\/.*SEND-BACK/);
});
// req: R-1004
check("a verified SEND-BACK at a working-state snapshot refuses land", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-send-back-snapshot-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home, "item"); writeFileSync(path.join(feature, "untracked.txt"), "present during review\n");
	assert.equal(recordReview(feature, home, "snapshot-review", "SEND-BACK").ok, true);
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /non-LAND verdict/i); assert.match(out.text, /snapshot-review\/.*SEND-BACK/);
});
// req: R-1004
check("an explicit empty verdict beside LAND refuses land", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-empty-verdict-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	reviewTip(feature, home, "item"); const empty = admit(["--item", "empty-review", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs" });
	assert.equal(empty.ok, true, empty.message); assert.equal(complete(empty.res, "VERDICT: ", { home }).ok, true);
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /non-LAND verdict/i); assert.match(out.text, /empty-review\/.*empty/);
});
// req: R-1004
check("a legacy round without verdict does not block a version-2 LAND", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-legacy-no-verdict-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	const revision = reviewTip(feature, home); const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	const tally = path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl");
	writeFileSync(tally, `${JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "legacy", revision, role: "reviewer" })}\n${readFileSync(tally, "utf8")}`);
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${sha}=item`], home });
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
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${sha}=item`], home });
	assert.equal(out.code, 0, out.text);
});
// req: R-1011
check("a version-1 LAND alone refuses on the first tally reading", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-v1-first-read-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	mkdirSync(path.join(home, ".pi", "agent"), { recursive: true }); const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), `${JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: sha, verdict: "LAND" })}\n`);
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${sha}=item`], home });
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
// req: R-2571
check("R-2571: the land refuses a revision whose matching LAND records all have missing or altered kept texts", () => {
	const make = (name) => {
		const root = tmpDir(path.join(os.tmpdir(), `land-kept-${name}-`)); const main = repo(root, "main");
		const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
		return { root, main, feature, tip, home };
	};
	{
		const f = make("one-holds");
		const intact = recordTextReview(f.feature, f.home, "item", "intact review\nVERDICT: LAND\n");
		const missing = recordTextReview(f.feature, f.home, "item", "missing review\nVERDICT: LAND\n");
		const missingFile = reviewTextPath(f.home, missing.text); unlinkSync(missingFile);
		const out = executeLand({ tree: f.feature, main: f.main, home: f.home, suite: 'node -e "process.exit(0)"', reviewed: [`${f.tip}=item`] });
		assert.equal(out.code, 0, out.text); assert.match(out.text, /note.*missing/i); assert.match(out.text, new RegExp(path.basename(missingFile)));
		assert.match(out.text, new RegExp(path.basename(reviewTextPath(f.home, intact.text))));
	}
	{
		const f = make("none-hold");
		for (const text of ["gone one\nVERDICT: LAND\n", "gone two\nVERDICT: LAND\n"]) {
			const row = recordTextReview(f.feature, f.home, "item", text); unlinkSync(reviewTextPath(f.home, row.text));
		}
		const out = executeLand({ tree: f.feature, main: f.main, home: f.home, suite: 'node -e "process.exit(0)"', reviewed: [`${f.tip}=item`] });
		assert.notEqual(out.code, 0); assert.match(out.text, new RegExp(`item.*${f.tip}`, "i")); assert.match(out.text, /re-run.*same revision/i);
	}
	{
		const f = make("altered"); const row = recordTextReview(f.feature, f.home, "item", "unaltered\nVERDICT: LAND\n");
		writeFileSync(reviewTextPath(f.home, row.text), "altered by one byte\nVERDICT: LAND\n");
		const out = executeLand({ tree: f.feature, main: f.main, home: f.home, suite: 'node -e "process.exit(0)"', reviewed: [`${f.tip}=item`] });
		assert.notEqual(out.code, 0); assert.match(out.text, /re-run.*same revision/i);
	}
	{
		const f = make("legacy"); recordTextReview(f.feature, f.home, "item", "legacy review\nVERDICT: LAND\n");
		writeTallyRows(f.home, tallyRows(f.home).map(({ text: _text, ...row }) => row));
		const out = executeLand({ tree: f.feature, main: f.main, home: f.home, suite: 'node -e "process.exit(0)"', reviewed: [`${f.tip}=item`] });
		assert.equal(out.code, 0, out.text); assert.match(out.text, /note.*pre-store|note.*no text/i);
	}
	{
		const f = make("malformed"); recordTextReview(f.feature, f.home, "item", "malformed reference\nVERDICT: LAND\n");
		writeTallyRows(f.home, tallyRows(f.home).map((row) => ({ ...row, text: { sha256: "bad", bytes: 1 } })));
		const out = executeLand({ tree: f.feature, main: f.main, home: f.home, suite: 'node -e "process.exit(0)"', reviewed: [`${f.tip}=item`] });
		assert.notEqual(out.code, 0); assert.match(out.text, /re-run.*same revision/i);
	}
});

// req: R-2572
check("R-2572: a land's success report names the kept review texts", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-kept-report-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next"); const home = path.join(root, "home");
	const row = recordTextReview(feature, home, "item", "report fixture\r\nVERDICT: LAND\r\n");
	const out = executeLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${tip}=item`], home });
	assert.equal(out.code, 0, out.text); assert.match(out.text, new RegExp(path.basename(reviewTextPath(home, row.text))));
});

// req: R-2576
check("R-2576: a land notes each earlier kept review text missing from the tip", () => {
	const make = (name, commitCopy) => {
		const root = tmpDir(path.join(os.tmpdir(), `land-earlier-${name}-`)); const main = repo(root, "main");
		const feature = tree(main, "integration"); const home = path.join(root, "home");
		commit(feature, "first.txt", "first\n", "first");
		const earlier = recordTextReview(feature, home, "item", "earlier finding\r\nVERDICT: SEND-BACK\r\n");
		if (commitCopy) writeFileSync(path.join(feature, "r1-reviewer-kept.md"), readFileSync(reviewTextPath(home, earlier.text)));
		const tip = commit(feature, commitCopy ? "r1-reviewer-kept.md" : "second.txt", commitCopy ? readFileSync(path.join(feature, "r1-reviewer-kept.md")) : "second\n", "tip");
		recordTextReview(feature, home, "item", "tip accepted\nVERDICT: LAND\n");
		return { main, feature, home, tip, earlier };
	};
	const absent = make("absent", false);
	const missing = executeLand({ tree: absent.feature, main: absent.main, suite: 'node -e "process.exit(0)"', reviewed: [`${absent.tip}=item`], home: absent.home });
	assert.equal(missing.code, 0, missing.text); assert.match(missing.text, /note.*earlier kept review text.*tip/i);
	assert.match(missing.text, new RegExp(path.basename(reviewTextPath(absent.home, absent.earlier.text))));
	const present = make("present", true);
	const kept = executeLand({ tree: present.feature, main: present.main, suite: 'node -e "process.exit(0)"', reviewed: [`${present.tip}=item`], home: present.home });
	assert.equal(kept.code, 0, kept.text); assert.doesNotMatch(kept.text, /earlier kept review text.*tip/i);
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
// req: R-2522
check("the land runs its suite with the source tip's full SHA in NANA_LAND_TIP", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-tip-env-")); const main = repo(root, "main");
	const mainBefore = git(main, "rev-parse", "HEAD");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	const output = path.join(root, "suite-tip.txt"); const probe = path.join(root, "write-tip.mjs");
	writeFileSync(probe, `import { writeFileSync } from "node:fs"; writeFileSync(process.argv[2], process.env.${LAND_TIP_ENV} ?? "");\n`);
	const suite = `${JSON.stringify(process.execPath)} ${JSON.stringify(probe)} ${JSON.stringify(output)}`;
	const out = runLand({ tree: feature, main, suite, reviewed: [] });
	assert.notEqual(tip, mainBefore); assert.equal(out.code, 0, out.text); assert.equal(readFileSync(output, "utf8"), tip);
});

// req: R-2530
check("a passing land shows its suite's land notes", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-notes-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const note = `${LAND_NOTE_PREFIX} visible note`;
	const trailing = `${LAND_NOTE_PREFIX} trailing note \t`;
	const noFinalNewline = `${LAND_NOTE_PREFIX} stderr note without final newline`;
	const out = runLand({ tree: feature, main, suite: "injected", reviewed: [], runCommand: () => ({ status: 0, stdout: `${note}\r\n${trailing}\r\nordinary suite output\r\n`, stderr: noFinalNewline }) });
	assert.equal(out.code, 0, out.text); assert.ok(out.text.includes(`${note}\n`)); assert.ok(out.text.includes(`${trailing}\n`)); assert.ok(out.text.includes(`${noFinalNewline}\n`));
	assert.doesNotMatch(out.text, /ordinary suite output/);
});

// req: R-2586
check("R-2586: a tip whose newest CI run of a workflow concluded other than success is refused before the suite", () => {
	const fixture = ciFixture("red");
	for (const [index, conclusion] of ["failure", "cancelled", "timed_out", "action_required", "neutral", "skipped", "stale", "startup_failure", null].entries()) {
		const run = workflowRun({ id: 200 + index, run_attempt: 2, conclusion });
		const out = assertCiRefused(fixture, [run], new RegExp(`ci run ${run.id} attempt 2.*${conclusion === null ? "null" : conclusion}`, "i")); assert.match(out.text, /ci/i);
		if (conclusion === "cancelled") assert.match(out.text, new RegExp(`gh run rerun ${run.id} --repo example/fixture`));
		if (conclusion === "failure") assert.match(out.text, new RegExp(`gh run rerun ${run.id} --repo example/fixture --failed`));
	}
	assertCiRefused(fixture, [workflowRun({ id: 210, run_number: 10 }), workflowRun({ id: 211, run_number: 11, conclusion: "failure" })], /ci run 211 attempt 1.*failure/i);
	assertCiRefused(fixture, [workflowRun({ workflow_id: 1, name: "one", id: 220, run_number: 40 }), workflowRun({ workflow_id: 2, name: "two", id: 221, run_number: 3, conclusion: "failure" })], /two run 221 attempt 1.*failure/i);
	assertCiRefused(fixture, [workflowRun({ workflow_id: 1, name: "same", id: 230 }), workflowRun({ workflow_id: 2, name: "same", id: 231, conclusion: "failure" })], /same run 231 attempt 1.*failure/i);
});

// req: R-2587
check("R-2587: a tip with no CI run, or with a newest run still queued or running, is refused before the suite", () => {
	const fixture = ciFixture("unfinished");
	assertCiRefused(fixture, [], new RegExp(`no CI run for ${fixture.tip.slice(0, 8)}`, "i"));
	for (const [index, status] of ["queued", "in_progress", "waiting", "requested", "pending"].entries()) {
		const run = workflowRun({ id: 300 + index, status, conclusion: null }); assertCiRefused(fixture, [run], new RegExp(`run ${run.id} attempt 1.*${status}`, "i"));
	}
	assertCiRefused(fixture, [workflowRun({ id: 310, run_attempt: 2, status: "in_progress", conclusion: "success" })], /run 310 attempt 2.*in_progress/i);
});

// req: R-2588
check("R-2588: the newest run of each workflow at its latest attempt decides, and the land names it", () => {
	const cases = [
		["attempt", [workflowRun({ id: 757, run_number: 757, run_attempt: 2, event: "push" }), workflowRun({ id: 756, run_number: 756 })], [/^ci: ci run 757 attempt 2 \(push\) success at /m]],
		["new-green", [workflowRun({ id: 411, run_number: 11 }), workflowRun({ id: 410, run_number: 10, conclusion: "failure" })], [/ci: ci run 411/]],
		["oldest-first", [workflowRun({ id: 420, run_number: 10, conclusion: "failure" }), workflowRun({ id: 421, run_number: 11 })], [/ci: ci run 421/]],
		["two", [workflowRun({ workflow_id: 1, name: "one", id: 430, run_number: 10 }), workflowRun({ workflow_id: 1, name: "one", id: 429, run_number: 9, conclusion: "failure" }), workflowRun({ workflow_id: 2, name: "two", id: 431, run_number: 2 })], [/ci: one run 430/, /ci: two run 431/]],
	];
	for (const [name, runs, patterns] of cases) {
		const fixture = ciFixture(`green-${name}`); const events = []; const out = executeCi(fixture, runs, { events });
		assert.equal(out.code, 0, out.text); assert.equal(out.suiteRan, true); for (const pattern of patterns) assert.match(out.text, pattern);
		assert.equal((out.text.match(/^ci: /gm) ?? []).length, patterns.length); assert(events.findIndex((event) => event.kind === "gh") < events.findIndex((event) => event.kind === "suite"));
		const beforeSuite = events.slice(0, events.findIndex((event) => event.kind === "suite"));
		assert.equal(beforeSuite.filter((event) => event.kind === "gh").length, 1); assert.equal(beforeSuite.filter((event) => event.kind === "gh").some((event) => event.args.some((arg) => /\/jobs|\/attempts\//.test(arg))), false);
	}
});

// req: R-2589
check("R-2589: a CI read that cannot complete refuses before the suite and names the cause", () => {
	const originListFailure = ciFixture("origin-list-failure");
	assertCiRefused(originListFailure, [], /git remote failed.*injected remote-list failure/i, { runGit: (cwd, args) => args.join(" ") === "remote" ? { status: 128, stdout: "", stderr: "injected remote-list failure" } : gitRunner(cwd, args) });
	const originUrlFailure = ciFixture("origin-url-failure");
	assertCiRefused(originUrlFailure, [], /remote get-url origin failed.*injected origin failure/i, { runGit: (cwd, args) => args.join(" ") === "remote get-url origin" ? { status: 128, stdout: "", stderr: "injected origin failure" } : gitRunner(cwd, args) });
	const fixture = ciFixture("gh-failures");
	const ghCases = [
		[{ error: Object.assign(new Error("spawn gh ENOENT"), { code: "ENOENT" }), status: null, stdout: "", stderr: "" }, /gh.*PATH/i],
		[{ status: 4, stdout: "", stderr: "To get started with GitHub CLI, please run:  gh auth login\nmore" }, /gh.*To get started with GitHub CLI/i],
		[{ status: 1, stdout: "", stderr: "error connecting to api.github.com\ncheck your internet connection or https:\/\/githubstatus.com" }, /error connecting to api\.github\.com/i],
		[{ status: 1, stdout: "", stderr: "Get api.github.com: proxyconnect tcp: connection refused\nsecond" }, /proxyconnect tcp: connection refused/i],
		[{ error: Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }), status: null, signal: "SIGTERM", stdout: "", stderr: "" }, /timed out.*30000/i],
	];
	for (const [answer, pattern] of ghCases) assertCiRefused(fixture, [], pattern, { runGh: () => answer });
	for (const stdout of ["not json", "null", "[]", "1", "{}", '{"message":"Not Found"}', '{"workflow_runs":[]}', '{"total_count":"1","workflow_runs":[]}', '{"workflow_runs":{}}', runList([null]), runList([{ ...workflowRun(), status: undefined }]), runList([{ ...workflowRun(), run_number: undefined }]), runList([{ ...workflowRun(), workflow_id: undefined }])])
		assertCiRefused(fixture, [], /not a workflow-run list/i, { runGh: () => ({ status: 0, stdout, stderr: "" }) });
	if (process.platform !== "win32") {
		const slow = ciFixture("slow-gh"); const bin = path.join(slow.root, "bin"); mkdirSync(bin); const gh = path.join(bin, "gh"); writeFileSync(gh, "#!/bin/sh\nsleep 2\nprintf '%s' '{\"total_count\":0,\"workflow_runs\":[]}'\n"); chmodSync(gh, 0o755);
		const runner = nanaLand.ghDefault({ timeoutMs: 200, maxBuffer: 1024 });
		assertCiRefused(slow, [], /timed out.*200/i, { runGh: (cwd, args, options) => runner(cwd, args, { ...options, env: { ...options.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` } }) });
	}
	const missing = ciFixture("real-missing-gh"); const empty = path.join(missing.root, "empty-bin"); mkdirSync(empty);
	const runner = nanaLand.ghDefault();
	assertCiRefused(missing, [], /gh.*PATH/i, { runGh: (cwd, args, options) => runner(cwd, args, { ...options, env: { ...options.env, PATH: empty } }) });
	const childFixture = ciFixture("missing-gh-child"); ensureCiReview(childFixture); const before = git(childFixture.main, "rev-parse", "HEAD");
	const locate = process.platform === "win32" ? ["where.exe", ["git"]] : ["which", ["git"]]; const gitPath = execFileSync(locate[0], locate[1], { encoding: "utf8" }).trim().split(/\r?\n/)[0];
	const childBin = path.join(childFixture.root, "node-git-bin"); mkdirSync(childBin);
	let childPath;
	if (process.platform === "win32") {
		childPath = path.dirname(gitPath);
	} else {
		for (const [name, real] of [["node", process.execPath], ["git", gitPath]]) symlinkSync(real, path.join(childBin, name));
		childPath = childBin;
	}
	const childEnv = { ...process.env, HOME: childFixture.home, USERPROFILE: childFixture.home, PATH: childPath };
	const extensions = process.platform === "win32" ? (process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";") : [""];
	const ghResolves = childPath.split(path.delimiter).some((dir) => extensions.some((extension) => existsSync(path.join(dir, `gh${extension}`))));
	if (ghResolves) console.log("SKIP R-2589 child no-gh assertions: gh resolves on the isolated node/git PATH");
	else {
		const suite = `${JSON.stringify(process.execPath)} -e ${JSON.stringify("process.exit(0)")}`;
		const child = spawnSync(process.execPath, [fileURLToPath(new URL("../bin/nana-land.mjs", import.meta.url)), "merge", "--tree", childFixture.feature, "--main", childFixture.main, "--suite", suite, "--reviewed", childFixture.reviewed[0]], { cwd: childFixture.feature, env: childEnv, encoding: "utf8", timeout: 30000 });
		assert.equal(child.status, 1, `${child.stdout}\n${child.stderr}`); assert.match(child.stdout, /^refused:.*gh.*PATH/im); assert.equal(git(childFixture.main, "rev-parse", "HEAD"), before);
	}
});

// req: R-2590
check("R-2590: a repository or tip without GitHub CI skips the CI read and notes why", () => {
	const scenarios = [
		["no-origin", { origin: null }, /no origin remote/],
		["local", { origin: "LOCAL" }, /origin is not a github\.com repository URL/],
		["gitlab", { origin: "https://gitlab.com/example/fixture.git" }, /origin is not a github\.com repository URL/],
		["substring", { origin: "https://example.com/github.com/fixture.git" }, /origin is not a github\.com repository URL/],
		["uppercase", { origin: "https://GitHub.com/example/fixture.git" }, /origin is not a github\.com repository URL/],
		["credentials", { origin: "https://user:token@github.com/example/fixture.git" }, /origin is not a github\.com repository URL/],
		["deleted", { workflowOnMain: true, workflowOnTip: false }, /the tip tracks no workflow/],
		["readme", { workflowPath: ".github/workflows/README.md" }, /the tip tracks no workflow/],
		["nested", { workflowPath: ".github/workflows/sub/x.yml" }, /the tip tracks no workflow/],
	];
	for (const [name, settings, reason] of scenarios) {
		const fixture = ciFixture(`skip-${name}`, settings); let ghCalls = 0; const out = executeCi(fixture, [], { runGh: () => { ghCalls++; throw new Error("gh must not run"); } });
		assert.equal(out.code, 0, out.text); assert.equal(out.suiteRan, true); assert.equal(ghCalls, 0); const notes = out.text.split(/\r?\n/).filter((line) => line.startsWith(`${LAND_NOTE_PREFIX} note: CI not read:`)); assert.equal(notes.length, 1, out.text); assert.match(notes[0], reason);
	}
	const lineEndings = ciFixture("remote-lines"); let ghCallsForLines = 0;
	const lineOut = executeCi(lineEndings, [], { runGit: (cwd, args) => args.join(" ") === "remote" ? { status: 0, stdout: "upstream \t\r\nbackup", stderr: "" } : gitRunner(cwd, args), runGh: () => { ghCallsForLines++; throw new Error("gh must not run"); } });
	assert.equal(lineOut.code, 0, lineOut.text); assert.equal(ghCallsForLines, 0); assert.match(lineOut.text, /CI not read: no origin remote/);
	const tipOnly = ciFixture("tip-only"); let ghCalls = 0; let suiteStarted = false; const out = executeCi(tipOnly, [workflowRun()], {
		runGh: () => { if (!suiteStarted) ghCalls++; return { status: 0, stdout: runList([workflowRun()]), stderr: "" }; },
		runCommand: () => { suiteStarted = true; return { status: 0, stdout: "", stderr: "" }; },
	});
	assert.equal(out.code, 0, out.text); assert.equal(ghCalls, 1);
});

// req: R-2591
check("R-2591: the CI read asks github.com for the full tip SHA in origin's repository", () => {
	const origins = ["https://github.com/example/fixture.git", "https://github.com/example/fixture", "git@github.com:example/fixture.git", "ssh://git@github.com/example/fixture.git"];
	const oldHost = process.env.GH_HOST, oldRepo = process.env.GH_REPO, oldColor = process.env.CLICOLOR_FORCE, oldForceTty = process.env.GH_FORCE_TTY;
	try {
		process.env.GH_HOST = "example.invalid"; process.env.GH_REPO = "wrong/other"; process.env.CLICOLOR_FORCE = "1"; process.env.GH_FORCE_TTY = "1";
		for (const [index, origin] of origins.entries()) {
			const fixture = ciFixture(`request-${index}`, { origin }); const calls = []; const out = executeCi(fixture, [workflowRun()], { runGh: (cwd, args, options) => { calls.push({ cwd, args, options }); return { status: 0, stdout: runList([workflowRun()]), stderr: "" }; } });
			assert.equal(out.code, 0, out.text); assert.equal(calls[0].cwd, path.resolve(fixture.main));
			assert.deepEqual(calls[0].args, ["api", "--hostname", landConfig.CI_HOST, `repos/example/fixture/actions/runs?head_sha=${fixture.tip}&per_page=${landConfig.CI_RUNS_PAGE_SIZE}`]);
			const expectedEnv = { ...process.env, CLICOLOR_FORCE: "0" }; for (const key of Object.keys(expectedEnv)) if (key.toUpperCase() === "GH_FORCE_TTY") delete expectedEnv[key];
			assert.deepEqual(calls[0].options.env, expectedEnv); assert.notEqual(calls[0].options.env, process.env);
		}
	} finally {
		if (oldHost === undefined) delete process.env.GH_HOST; else process.env.GH_HOST = oldHost;
		if (oldRepo === undefined) delete process.env.GH_REPO; else process.env.GH_REPO = oldRepo;
		if (oldColor === undefined) delete process.env.CLICOLOR_FORCE; else process.env.CLICOLOR_FORCE = oldColor;
		if (oldForceTty === undefined) delete process.env.GH_FORCE_TTY; else process.env.GH_FORCE_TTY = oldForceTty;
	}
	if (process.platform !== "win32") {
		const fixture = ciFixture("fake-gh-child"); ensureCiReview(fixture); const fakeBin = path.join(fixture.root, "fake-bin"); mkdirSync(fakeBin); const record = path.join(fixture.root, "gh-record.txt"); const fake = path.join(fakeBin, "gh");
		writeFileSync(fake, `#!/bin/sh\nprintf '%s\\n' "$PWD" "$@" >> ${JSON.stringify(record)}\nprintf '%s\\n' '--call--' >> ${JSON.stringify(record)}\nif { [ -n "$CLICOLOR_FORCE" ] && [ "$CLICOLOR_FORCE" != "0" ]; } || [ -n "$GH_FORCE_TTY" ]; then\n\tprintf '\\033[32m%s\\033[0m\\n' '${runList([workflowRun()])}'\nelse\n\tprintf '%s\\n' '${runList([workflowRun()])}'\nfi\n`); chmodSync(fake, 0o755);
		const gitPath = execFileSync("which", ["git"], { encoding: "utf8" }).trim(); const env = { ...process.env, HOME: fixture.home, USERPROFILE: fixture.home, PATH: `${fakeBin}${path.delimiter}${path.dirname(gitPath)}`, HTTPS_PROXY: "http://127.0.0.1:9", CLICOLOR_FORCE: "1", GH_FORCE_TTY: "1" };
		const suite = `${JSON.stringify(process.execPath)} -e ${JSON.stringify("process.exit(0)")}`;
		const child = spawnSync(process.execPath, [fileURLToPath(new URL("../bin/nana-land.mjs", import.meta.url)), "merge", "--tree", fixture.feature, "--main", fixture.main, "--suite", suite, "--reviewed", fixture.reviewed[0]], { cwd: fixture.feature, env, encoding: "utf8", timeout: 30000 });
		assert.equal(child.status, 0, `${child.stdout}\n${child.stderr}`); const lines = readFileSync(record, "utf8").trim().split("\n"); const firstEnd = lines.indexOf("--call--"); assert.equal(realpathSync(lines[0]), realpathSync(fixture.main)); assert.deepEqual(lines.slice(1, firstEnd), ["api", "--hostname", landConfig.CI_HOST, `repos/example/fixture/actions/runs?head_sha=${fixture.tip}&per_page=${landConfig.CI_RUNS_PAGE_SIZE}`]);
	}
});

// req: R-2592
check("R-2592: the pack README and the shared Land checklist say a land waits for the tip's CI", () => {
	const repoRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url))); const readme = readFileSync(path.join(repoRoot, "packages/nana-pack/README.md"), "utf8"); const shared = readFileSync(path.join(repoRoot, "templates/_shared/working-under-nana-pi.md"), "utf8");
	assert(readme.includes("Where `origin` is on github.com and the tip tracks a workflow under `.github/workflows`, the helper refuses until the newest CI run of each workflow for the tip has passed at its latest attempt."));
	const bullets = shared.split(/\r?\n/).filter((line) => line.startsWith("- Land checklist:")); assert.equal(bullets.length, 1); assert(bullets[0].includes("Where origin is on github.com and the tip tracks a workflow, `nana-land` also refuses until the newest CI run of each workflow for the tip has passed, so push the tip to its open pull request, do not cancel its run, and wait for CI."));
});

// req: R-2586
// req: R-2587
// req: R-2589
// req: R-2590
// req: R-2591
check("seal: the land reads CI from origin on github.com, workflows in .github/workflows, 100 runs a page, within 30 seconds, and passes only completed success", () => {
	assert.equal(landConfig.CI_REMOTE, "origin", "R-2590"); assert.equal(landConfig.CI_HOST, "github.com", "R-2591"); assert.equal(landConfig.CI_WORKFLOW_DIR, ".github/workflows", "R-2590"); assert.deepEqual(landConfig.CI_WORKFLOW_EXTENSIONS, [".yml", ".yaml"], "R-2590");
	assert.equal(landConfig.CI_RUNS_PATH, "repos/<owner>/<repo>/actions/runs", "R-2591"); assert.equal(landConfig.CI_RUNS_PAGE_SIZE, 100, "R-2591"); assert.equal(landConfig.CI_READ_TIMEOUT_MS, 30000, "R-2589"); assert.equal(landConfig.CI_DONE_STATUS, "completed", "R-2587"); assert.equal(landConfig.CI_PASS_CONCLUSION, "success", "R-2586"); assert.equal(landConfig.CHILD_OUTPUT_MAX_BYTES, 16 * 1024 * 1024, "R-2589");
});

if (process.platform === "win32") console.log("SKIP after a land the runtime data names main's tip and is not stale — R-2526: Windows lands do not measure");
else {
// req: R-2531
check("after a land the runtime data names main's tip and is not stale", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-runtime-map-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	const dataFile = path.join(root, "runtime-map.json"); const lockDir = path.join(root, "suite.lock");
	const fakeSuite = path.join(root, "fake-suite.mjs");
	writeFileSync(fakeSuite, [
		'import { mkdirSync, writeFileSync } from "node:fs";',
		'import path from "node:path";',
		`const coverage = process.env.${COVERAGE_ENV};`,
		`if (coverage) { mkdirSync(coverage, { recursive: true }); writeFileSync(path.join(coverage, ${JSON.stringify(COMPLETION_FILE)}), JSON.stringify({ files: 0 })); }`,
	].join("\n"));
	const out = runLand({ tree: feature, main, suite: "locked fixture", reviewed: [], runCommand: (_command, cwd, options = {}) => spawnSync(process.execPath, [TEST_LOCKED], {
		cwd, encoding: "utf8", timeout: 15000,
		env: { ...options.env, NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, fakeSuite]), NANA_SUITE_LOCK_DIR: lockDir, NANA_RUNTIME_MAP_FILE: dataFile },
	}) });
	assert.equal(out.code, 0, out.text); const data = JSON.parse(readFileSync(dataFile, "utf8"));
	assert.equal(data.tip, git(main, "rev-parse", "refs/heads/main")); assert.equal(data.tip, tip);
	const tracked = git(main, "ls-files").split("\n").filter(Boolean);
	const drift = checkoutDrift(data, { tracked, hashOf: (file) => hashFile(path.join(main, file)) });
	assert.deepEqual(drift, { added: [], removed: [], changed: [], stale: false });
});
}

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
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(7)"', reviewed: [] });
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
	// W7c: cleanup now removes by git's OWN registered spelling, not the --worktree argument's — on
	// this Mac, the default TMPDIR's /var -> /private/var symlink already makes the two differ, so
	// the captured real path (while the worktree still exists) is what the remove call must name.
	// SHOULD 6 (brief 2): compare through realPath on both sides, not by raw string — git's own
	// registered path always uses forward slashes, while `realpathSync.native` on Windows returns
	// backslashes, so a literal `===` would fail there even though both name the same entry.
	const featureReal = realpathSync.native(feature);
	const calls = []; const runGit = (cwd, args) => {
		calls.push({ cwd, args });
		try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
		catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const result = runCleanup("landed", { main, worktree: feature, runGit });
	assert.equal(result.code, 0, result.text);
	assert(calls.some(({ cwd, args }) => cwd === main && args.length === 3 && args[0] === "worktree" && args[1] === "remove" && realPath(args[2]) === realPath(featureReal)));
	assert(calls.some(({ cwd, args }) => cwd === main && args.length === 3 && args[0] === "branch" && args[1] === "-d" && args[2] === "feat/landed"));
	assert.equal(existsSync(feature), false); assert.throws(() => git(main, "show-ref", "--verify", "refs/heads/feat/landed"));
});
// req: R-981
check("README and AGENTS describe the land helper", () => {
	const repoRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
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
	const out = runLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [] });
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
	const out = executeLand({ tree: clone, main, suite: 'node -e "process.exit(0)"', reviewed: [`${reviewed}=item`], runGit });
	assert.notEqual(out.code, 0); assert.match(out.text, /share one git repository/);
	assert.equal(calls.some(({ args }) => args[0] === "cat-file" || (args[0] === "rev-parse" && args.includes(reviewed))), false);
});
// req: R-1372
check("normalized checkout review lands its exact tip", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-mm3-"));
	const main = repo(root, "mm3-main"); // repo() commits base.txt "base\n" under core.autocrlf=false
	git(main, "config", "core.autocrlf", "true"); // the linked worktree below checks base.txt out CRLF
	git(main, "config", "core.fileMode", "false");
	writeFileSync(path.join(main, "run.sh"), "#!/bin/sh\n");
	git(main, "add", "run.sh");
	git(main, "update-index", "--chmod=+x", "run.sh"); // a committed mode, never chmod
	git(main, "commit", "-m", "exec");
	const feature = tree(main, "mm3-integration"); // `git worktree add` checks out base.txt as CRLF here
	commit(feature, "next.txt", "next\n", "next");
	chmodSync(path.join(feature, "run.sh"), 0o644); // the committed exec bit is lost on disk
	const crlfBytes = readFileSync(path.join(feature, "base.txt"));
	assert.ok(crlfBytes.includes(0x0d), "precondition: base.txt was not checked out with CRLF");
	mkdirSync(path.join(feature, "docs", "reviews", "x"), { recursive: true });
	const tip = git(feature, "rev-parse", "HEAD");
	const home = path.join(root, "home");
	mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const fakeBin = path.join(root, "fake-bin");
	if (process.platform === "win32") writeFakePi(fakeBin, "console.log('VERDICT: LAND');\n");
	else { mkdirSync(fakeBin, { recursive: true }); writeFileSync(path.join(fakeBin, "pi"), "#!/bin/sh\necho 'VERDICT: LAND'\n"); chmodSync(path.join(fakeBin, "pi"), 0o755); }
	const out = path.join(feature, "docs", "reviews", "x", "r1.md");
	const env = { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: path.join(home, '.pi/agent'), PATH: `${fakeBin}${path.delimiter}${process.env.PATH}` };
	const review = spawnSync(process.execPath, [PI_REVIEW, "--item", "mm3", "--out", out, "--retries", "0", "--", "-p", "review"], { cwd: feature, env, encoding: "utf8", timeout: 30000 });
	assert.equal(review.status, 0, review.stderr);
	const result = executeLand({ tree: feature, main, suite: 'node -e "process.exit(0)"', reviewed: [`${tip}=mm3`], home });
	assert.equal(result.code, 0, result.text);
	assert.equal(git(main, "rev-parse", "HEAD"), tip);
});

process.exit(failures ? 1 : 0);
