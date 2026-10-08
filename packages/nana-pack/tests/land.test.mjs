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
import { runLand, runCleanup } from "../bin/nana-land.mjs";

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
check("a valid LAND revision passes and integration commits are called out", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-reviewed-ok-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const reviewedSha = commit(feature, "reviewed.txt", "reviewed\n", "reviewed");
	const tip = commit(feature, "integrated.txt", "integration\n", "integration");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "item", revision: reviewedSha, verdict: "LAND" }) + "\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${reviewedSha}=item`], home });
	assert.equal(out.code, 0, out.text); assert.match(out.text, /not reviewed:/); assert.equal(git(main, "rev-parse", "HEAD"), tip);
});
// req: R-976
check("a LAND round for another item does not authorize this item", () => {
	const root = tmpDir(path.join(os.tmpdir(), "land-wrong-item-")); const main = repo(root, "main");
	const feature = tree(main, "integration"); const sha = commit(feature, "next.txt", "next\n", "next");
	const home = path.join(root, "home"); mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const common = path.resolve(feature, git(feature, "rev-parse", "--git-common-dir"));
	writeFileSync(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl"), JSON.stringify({ v: 1, kind: "round", repo: `git:${common}`, item: "different", revision: sha, verdict: "LAND" }) + "\n");
	const out = runLand({ tree: feature, main, suite: "node -e 'process.exit(0)'", reviewed: [`${sha}=item`], home });
	assert.notEqual(out.code, 0); assert.match(out.text, /no LAND review/i);
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
	const result = runCleanup("landed", { main, worktree: feature });
	assert.equal(result.code, 0, result.text); assert.equal(existsSync(feature), false); assert.throws(() => git(main, "show-ref", "--verify", "refs/heads/feat/landed"));
});
// req: R-981
check("README and AGENTS describe the land helper", () => {
	const repoRoot = path.resolve(new URL("../../..", import.meta.url).pathname);
	assert.match(readFileSync(path.join(repoRoot, "packages/nana-pack/README.md"), "utf8"), /nana-land merge/);
	assert.match(readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8"), /use `nana-land`/);
	assert.equal(JSON.parse(readFileSync(path.join(repoRoot, "packages/nana-pack/package.json"), "utf8")).bin["nana-land"], "bin/nana-land.mjs");
});
process.exit(failures ? 1 : 0);
