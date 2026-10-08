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
import { parseLandArgs, runLand, runCleanup } from "../bin/nana-land.mjs";

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

// req: R-975
check("merge preflight refuses a non-main checkout", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-main-")); const main = repo(root, "main");
	git(main, "checkout", "-b", "other");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [], exempt: "test" }); assert.notEqual(out.code, 0); assert.match(out.text, /main/i);
});
// req: R-975
check("tracked main changes refuse before running the suite", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-dirty-main-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); writeFileSync(path.join(main, "base.txt"), "dirty\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [], exempt: "test" });
	assert.notEqual(out.code, 0); assert.match(out.text, /main checkout has tracked changes/i);
});
// req: R-975
check("tracked source changes refuse before running the suite", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-dirty-source-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); writeFileSync(path.join(feature, "base.txt"), "dirty\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [], exempt: "test" });
	assert.notEqual(out.code, 0); assert.match(out.text, /tracked changes/i);
});
// req: R-975
check("suite-time main branch switch refuses before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-branch-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], exempt: "test", runCommand: () => {
		git(main, "checkout", "-b", "other"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /branch main/i); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-975
check("suite-time main tracked changes refuse before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-main-dirty-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], exempt: "test", runCommand: () => {
		writeFileSync(path.join(main, "base.txt"), "changed in suite\n"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /main checkout has tracked changes/i);
});
// req: R-975
check("suite-time source tracked changes refuse before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-source-dirty-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], exempt: "test", runCommand: () => {
		writeFileSync(path.join(feature, "base.txt"), "changed in suite\n"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /source tree has tracked changes/i);
});
// req: R-975
check("suite-time source revision change refuses before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-tip-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], exempt: "test", runCommand: () => {
		commit(feature, "during-suite.txt", "changed\n", "during suite"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /source tip changed/i);
});
// req: R-975
// req: R-977
check("suite-time main divergence refuses before merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-main-tip-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], exempt: "test", runCommand: () => {
		commit(main, "parallel.txt", "parallel\n", "parallel"); return { status: 0, stdout: "", stderr: "" };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /compare-and-swap|update-ref/i);
});
// req: R-975
check("non-fast-forward source tip refuses before running the suite", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-no-ff-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); commit(main, "parallel.txt", "parallel\n", "parallel");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [], exempt: "test" });
	assert.notEqual(out.code, 0); assert.match(out.text, /ancestor/i);
});
// req: R-976
check("a reviewed SHA must be ancestor of the source tip and match a LAND record", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-review-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${git(main, "rev-parse", "--git-common-dir")}`, item: "item", revision: tip, verdict: "NO-GO" }) + "\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${tip}=item`], home }); assert.notEqual(out.code, 0); assert.match(out.text, /LAND/i);
});
// req: R-976
check("drifted LAND round cannot authorize a merge", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-unverified-review-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: sha, verdict: "LAND", unverified: true }) + "\n");
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [`${sha}=item`], home, runCommand: () => ({ status: 0 }) });
	assert.notEqual(out.code, 0); assert.match(out.text, /no verified LAND review/i); assert.equal(git(main, "rev-parse", "HEAD"), git(main, "rev-parse", "main"));
});
// req: R-976
check("a valid LAND revision passes and integration commits are called out", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-reviewed-ok-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const reviewedSha = commit(feature, "reviewed.txt", "reviewed\n", "reviewed");
	const integrationSha = commit(feature, "integrated.txt", "integration\n", "integration"); const tip = commit(feature, "second-integration.txt", "second\n", "second integration");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: reviewedSha, verdict: "LAND" }) + "\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${reviewedSha}=item`], home });
	assert.equal(out.code, 0, out.text); assert.equal(out.text.match(/^not reviewed:.*$/m)?.[0], `not reviewed: ${tip}, ${integrationSha}`); assert.equal(git(main, "rev-parse", "HEAD"), tip);
});
// req: R-976
check("a LAND round for another item does not authorize this item", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-wrong-item-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "different", revision: sha, verdict: "LAND" }) + "\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /no verified LAND review/i);
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
check("snapshot review revisions are never accepted as plain reviewed commits", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-snapshot-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${sha}+snap:abc=item`] });
	assert.notEqual(out.code, 0); assert.match(out.text, /plain commit/i);
});
// req: R-977
check("successful land invokes ff-only merge and containment verification", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-invocations-")); const main = repo(root, "main");
	const capturedMain = git(main, "rev-parse", "refs/heads/main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	const calls = []; const runGit = (cwd, args) => { calls.push({ cwd, args }); try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; } catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; } };
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], exempt: "test", runGit, runCommand: () => ({ status: 0 }) });
	assert.equal(out.code, 0, out.text);
	assert(calls.some(({ cwd, args }) => cwd === main && args.join(" ") === `update-ref refs/heads/main ${tip} ${capturedMain}`));
	assert(calls.some(({ cwd, args }) => cwd === main && args.join(" ") === `merge --ff-only ${tip}`));
	assert(calls.some(({ cwd, args }) => cwd === main && args.join(" ") === `merge-base --is-ancestor ${tip} refs/heads/main`));
});
// req: R-977
check("branch switch at merge invocation refuses without landed records", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-merge-switch-")); const main = repo(root, "main");
	const initialMain = git(main, "rev-parse", "refs/heads/main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	git(main, "branch", "other", initialMain);
	const calls = []; let branchChecks = 0; let switched = false;
	const runGit = (cwd, args) => {
		calls.push({ cwd, args });
		if (cwd === main && args[0] === "branch" && args[1] === "--show-current" && ++branchChecks === 3 && !switched) { git(main, "checkout", "other"); switched = true; }
		try { return { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }), stderr: "" }; }
		catch (error) { return { status: error.status ?? 1, stdout: error.stdout?.toString() ?? "", stderr: error.stderr?.toString() ?? "" }; }
	};
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], exempt: "test", runGit, runCommand: () => ({ status: 0 }) });
	assert.notEqual(out.code, 0); assert.match(out.text, /branch main/i); assert.doesNotMatch(out.text, /HANDOFF Landed:|Session archive stub:|push command:/);
	assert.equal(git(main, "rev-parse", "refs/heads/main"), initialMain); assert.equal(git(main, "rev-parse", "refs/heads/other"), initialMain);
});
// req: R-977
check("main advancing during suite fails the main ref compare-and-swap", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-race-cas-")); const main = repo(root, "main");
	const initialMain = git(main, "rev-parse", "refs/heads/main");
	const feature = tree(main, "integration"); const tip = commit(feature, "next.txt", "next\n", "next");
	let advancedMain;
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], exempt: "test", runCommand: () => {
		commit(main, "parallel.txt", "parallel\n", "parallel"); advancedMain = git(main, "rev-parse", "refs/heads/main"); return { status: 0 };
	} });
	assert.notEqual(out.code, 0); assert.match(out.text, /compare-and-swap|update-ref/i);
	assert.notEqual(advancedMain, initialMain); assert.equal(git(main, "rev-parse", "refs/heads/main"), advancedMain); assert.notEqual(advancedMain, tip);
});
// req: R-977
check("suite command runs in the source tree", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-suite-cwd-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); let suiteCwd = null;
	const out = runLand({ tree: feature, main, suite: "canonical", reviewed: [], exempt: "test", runCommand: (_command, cwd) => { suiteCwd = cwd; return { status: 0, stdout: "", stderr: "" }; } });
	assert.equal(out.code, 0, out.text); assert.equal(suiteCwd, feature);
});
// req: R-977
check("suite failure leaves main unchanged and does not print a landed record", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-suite-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next"); const before = git(main, "rev-parse", "HEAD");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(7)'", reviewed: [], exempt: "test failure" });
	assert.notEqual(out.code, 0); assert.equal(git(main, "rev-parse", "HEAD"), before); assert.doesNotMatch(out.text, /Landed:/);
});
// req: R-978
check("whitespace-only exemption is rejected and nonblank reason is trimmed", () => {
	assert.throws(() => parseLandArgs(["merge", "--tree", "/tree", "--main", "/main", "--suite", "true", "--exempt", "   "]), /nonblank/i);
	assert.equal(parseLandArgs(["merge", "--tree", "/tree", "--main", "/main", "--suite", "true", "--exempt", "  approved  "]).exempt, "approved");
});
// req: R-977
// req: R-978
check("an exemption reason appears in the successful archive record", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-exempt-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	writeFileSync(path.join(main, "local-untracked.txt"), "ignored by tracked cleanliness\n"); git(feature, "checkout", "--detach");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [], exempt: "approved residual review" });
	assert.equal(out.code, 0); assert.match(out.text, /approved residual review/); assert.match(out.text, /push command:/); assert.match(out.text, /Session archive stub:/); assert.match(out.text, /HANDOFF Landed:/); assert.equal(git(main, "rev-parse", "HEAD"), git(feature, "rev-parse", "HEAD"));
});
// req: R-977
check("a suite killed by signal refuses and names a nonzero exit", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-signal-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); commit(feature, "next.txt", "next\n", "next");
	const out = runLand({ tree: feature, main, suite: "unused", reviewed: [], exempt: "test", runCommand: () => ({ status: null, signal: "SIGTERM", stdout: "", stderr: "" }) });
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
	for (const pattern of [/nana-land merge/, /clean source tree/, /clean checkout on `main`/, /verified `LAND` review/, /suite succeeds/, /suite in the source tree/, /Immediately before merging it rechecks/, /`--ff-only`/, /verify containment/, /is a separate operation/, /clean worktree whose.*branch is contained in `main`/]) assert.match(readme, pattern);
	const agents = readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
	for (const pattern of [/clean source/, /clean `main` checkout/, /verified review rounds/, /suite on the reviewed tip/, /rerun the suite if either checkout changes/, /ff-only merge, and containment verification/, /separate operation/, /clean.*worktree contained in `main`/]) assert.match(agents, pattern);
	assert.match(agents, /use `nana-land`/); assert.match(agents, /clean `main` checkout/); assert.match(agents, /verified review rounds/); assert.match(agents, /rerun the suite if either checkout changes/); assert.match(agents, /ff-only merge, and containment verification/); assert.match(agents, /clean `feat\/<lane>` worktree contained in `main`/);
	assert.equal(JSON.parse(readFileSync(path.join(repoRoot, "packages/nana-pack/package.json"), "utf8")).bin["nana-land"], "bin/nana-land.mjs");
});
process.exit(failures ? 1 : 0);
