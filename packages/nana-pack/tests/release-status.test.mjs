/**
 * @module packages/nana-pack/tests/release-status.test.mjs
 * @purpose Pins release-status reporting, local Git command scope, and graceful missing-input behavior.
 * @inputs release-status.mjs and temporary Git repositories.
 * @outputs PASS/FAIL lines and a nonzero exit when a release-status contract fails.
 * @effects disk (temporary test repositories).
 * @errors Failed checks exit nonzero; unexpected exceptions fail the process.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { RELEASE_BRANCH_REF, RELEASE_REMOTE_REF, RELEASE_SURFACE, RELEASE_TAG_PATTERN, countTemplateCommits, releaseStatus, selectReleaseTag } from "../lib/release-status.mjs";

let failures = 0;
const check = (title, fn) => { try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); } };
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const repo = (root, name = "repo") => {
  const dir = path.join(root, name); mkdirSync(dir, { recursive: true });
  git(dir, "init", "-b", "main"); git(dir, "config", "user.email", "release@test"); git(dir, "config", "user.name", "Release Test");
  writeFileSync(path.join(dir, "copier.yml"), "_subdirectory: templates/{{ language }}/template\n");
  writeFileSync(path.join(dir, "README.md"), "base\n"); mkdirSync(path.join(dir, "templates")); writeFileSync(path.join(dir, "templates", "base"), "base\n");
  git(dir, "add", "."); git(dir, "commit", "-m", "base"); return dir;
};
const commit = (dir, file, text, message) => { const target = path.join(dir, file); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, text); git(dir, "add", file); git(dir, "commit", "-m", message); return git(dir, "rev-parse", "HEAD"); };
const origin = (root, dir) => { const bare = path.join(root, "origin.git"); git(root, "init", "--bare", bare); git(dir, "remote", "add", "origin", bare); git(dir, "push", "-u", "origin", "main"); return bare; };

// req: R-584
// req: R-585
check("release contract values and exported pure selectors are pinned", () => {
  assert.equal(RELEASE_BRANCH_REF, "refs/heads/main"); assert.equal(RELEASE_REMOTE_REF, "refs/remotes/origin/main");
  assert.deepEqual(RELEASE_SURFACE, ["templates", "copier.yml"]); assert.equal(RELEASE_TAG_PATTERN.source, "^v\\d+\\.\\d+\\.\\d+$");
  assert.equal(selectReleaseTag(["v0.9.0", "v0.10.0", "v0.11.0-rc1"]), "v0.10.0");
  assert.equal(countTemplateCommits("2\n"), 2);
});
// req: R-584
check("counts only template-surface commits after the highest tag", () => {
  const root = tmpDir(path.join(os.tmpdir(), "release-surface-")); const dir = repo(root); git(dir, "tag", "v0.1.0");
  commit(dir, "templates/x", "one\n", "template change"); commit(dir, "copier.yml", "_subdirectory: templates/{{ language }}/template\n# two\n", "copier change"); commit(dir, "README.md", "docs\n", "docs change");
  const status = releaseStatus({ repo: dir }); assert.equal(status.tag, "v0.1.0"); assert.equal(status.templateCommits, 2); assert.match(status.line, /2 template commits?.*v0\.1\.0/);
});
// req: R-584
check("selects the highest plain numeric release tag, not a prerelease or nearest tag", () => {
  const root = tmpDir(path.join(os.tmpdir(), "release-tag-order-")); const dir = repo(root);
  git(dir, "tag", "v0.10.0"); commit(dir, "older.txt", "older\n", "older"); git(dir, "tag", "v0.9.0");
  commit(dir, "newer.txt", "newer\n", "newer"); git(dir, "tag", "v0.11.0-rc1");
  assert.equal(releaseStatus({ repo: dir }).tag, "v0.10.0");
});
// req: R-585
check("reports local ahead and behind counts as of the last fetch", () => {
  const root = tmpDir(path.join(os.tmpdir(), "release-divergence-")); const dir = repo(root); origin(root, dir);
  commit(dir, "local-a.txt", "a\n", "local a"); commit(dir, "local-b.txt", "b\n", "local b");
  let status = releaseStatus({ repo: dir }); assert.equal(status.ahead, 2); assert.equal(status.behind, 0); assert.match(status.line, /as of the last fetch/);
  const base = git(dir, "rev-parse", "HEAD~2"); commit(dir, "upstream.txt", "upstream\n", "upstream"); git(dir, "push", "origin", "main"); git(dir, "reset", "--hard", base); status = releaseStatus({ repo: dir }); assert(status.behind > 0);
});
// req: R-585
check("uses only the release reader's allowed read-only Git subcommands", () => {
  const root = tmpDir(path.join(os.tmpdir(), "release-allowlist-")); const dir = repo(root); origin(root, dir); git(dir, "tag", "v0.1.0");
  const calls = []; const recording = (cwd, args) => { calls.push(args); return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) ? { status: 0, stdout: execFileSync("git", args, { cwd, encoding: "utf8" }), stderr: "" } : { status: 0, stdout: "", stderr: "" }; };
  releaseStatus({ repo: dir, runGit: recording });
  const allowed = new Set(["rev-parse", "cat-file", "for-each-ref", "rev-list"]); assert(calls.length > 0);
  for (const args of calls) assert(allowed.has(args[0]), `unexpected git subcommand ${args[0]}`);
});
// req: R-587
check("names each unavailable release input without throwing", () => {
  const root = tmpDir(path.join(os.tmpdir(), "release-missing-"));
  const empty = path.join(root, "empty"); mkdirSync(empty);
  assert(releaseStatus({ repo: empty }).line.includes("not a git repository"));
  const noMain = path.join(root, "no-main"); mkdirSync(noMain); git(noMain, "init", "-b", "main");
  assert(releaseStatus({ repo: noMain }).line.includes("main ref unavailable"));
  const dir = repo(root, "no-origin");
  assert(releaseStatus({ repo: dir }).line.includes("origin/main tracking ref unavailable"));
  const noCopier = path.join(root, "no-copier"); mkdirSync(noCopier); git(noCopier, "init", "-b", "main"); git(noCopier, "config", "user.email", "release@test"); git(noCopier, "config", "user.name", "Release Test"); writeFileSync(path.join(noCopier, "x"), "x"); git(noCopier, "add", "."); git(noCopier, "commit", "-m", "base");
  const noCopierStatus = releaseStatus({ repo: noCopier });
  assert(noCopierStatus.line.includes("copier.yml unavailable"), noCopierStatus.line);
  git(noCopier, "remote", "add", "origin", path.join(root, "absent.git"));
  assert.match(releaseStatus({ repo: noCopier }).line, /origin/i);
  const noTag = path.join(root, "no-tag"); const noTagBare = path.join(root, "no-tag-origin.git"); const tagged = repo(root, "tagged"); git(root, "init", "--bare", noTagBare); git(tagged, "remote", "add", "origin", noTagBare); git(tagged, "push", "-u", "origin", "main");
  assert(releaseStatus({ repo: tagged }).line.includes("plain vX.Y.Z release tag unavailable"));
  const broken = () => ({ status: 128, stdout: "", stderr: "fatal: injected git failure" });
  assert.doesNotThrow(() => { const result = releaseStatus({ repo: dir, runGit: broken }); assert(result.line.includes("git unavailable")); });
  assert.doesNotThrow(() => { const result = releaseStatus({ repo: dir, runGit: () => ({ error: new Error("spawn ENOENT"), status: null, stderr: "" }) }); assert(result.line.includes("git unavailable")); });
  assert.doesNotThrow(() => { const result = releaseStatus({ repo: dir, runGit: () => { throw new Error("git runner failed"); } }); assert(result.line.includes("git unavailable")); });
});
if (failures) process.exitCode = 1;
