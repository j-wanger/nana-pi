/**
 * @module packages/nana-pack/tests/land.test.mjs
 * @purpose Pin land preflight, review authorization and suite checks.
 * @inputs Nana-land fixtures and OS-temp Git repositories.
 * @outputs PASS/FAIL lines and a nonzero exit when a check fails.
 * @effects disk (temporary test repositories and review ledgers).
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

import { PI_REVIEW, TEST_LOCKED, assertCiRefused, recordTextReview, runLand, tallyRows, writeTallyRows } from "./land-checks.mjs";
let failures = 0;
const check = (title, fn) => {
	try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); }
};

// req: R-975
// req: R-1009 R-3490 R-3491
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
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"), tip = reviewTip(feature, home);
	writeFileSync(path.join(feature, "base.txt"), "dirty\n");
	const out = executeLand({ tree: feature, main, home, suite: 'node -e "process.exit(0)"', reviewed: [`${tip}=item`] });
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
check("non-fast-forward source tip without CI refuses before running the suite", () => {
	const fixture = ciFixture("no-ff", { origin: null, workflowOnTip: false });
	commit(fixture.main, "parallel.txt", "parallel\n", "parallel");
	const before = git(fixture.main, "rev-parse", "HEAD");
	let suites = 0;
	const out = executeCi(fixture, [], { runCommand: () => { suites++; return { status: 0 }; } });
	assert.equal(out.code, 1); assert.equal(suites, 0);
	assert.match(out.text, /main has moved.*git merge main/);
	assert.equal(git(fixture.main, "rev-parse", "HEAD"), before);
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
	reviewTip(feature, home);
	const held = admit(["--item", "pending-snapshot", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs", pid: process.pid });
	assert.equal(held.ok, true, held.message); assert.equal(held.res.pid, process.pid);
	// Legacy in-flight snapshot records remain land blockers; new admissions never create them.
	held.res.revision = `${tip}+snap:${"a".repeat(64)}`;
	writeFileSync(path.join(ledgerPaths(home).resDir, `${held.id}.json`), JSON.stringify(held.res));
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
	reviewTip(feature, home, "item");
	assert.equal(recordReview(feature, home, "snapshot-review", "SEND-BACK").ok, true);
	const rows = tallyRows(home), snapshot = "a".repeat(64);
	Object.assign(rows.at(-1), { revision: `${sha}+snap:${snapshot}`, snapshot });
	writeTallyRows(home, rows); // seed the legacy record instead of admitting a dirty tree
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
	reviewTip(feature, home, "item");
	const admission = admit(["--item", "unverified", "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs" });
	assert.equal(admission.ok, true, admission.message);
	writeFileSync(path.join(feature, "base.txt"), "changed mid-review\n");
	assert.equal(complete(admission.res, "VERDICT: SEND-BACK", { home }).ok, false);
	writeFileSync(path.join(feature, "base.txt"), "base\n");
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
process.exit(failures ? 1 : 0);
