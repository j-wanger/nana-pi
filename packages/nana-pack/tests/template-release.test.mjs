/**
 * @module packages/nana-pack/tests/template-release.test.mjs
 * @purpose Pins gated template tag creation and tag-only pushes against isolated Git remotes.
 * @inputs Release command and temporary repositories.
 * @outputs PASS/FAIL lines and exit status.
 * @effects disk (temporary Git repositories).
 * @errors Failed checks exit nonzero.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { runRelease } from "../../../scripts/template-release.mjs";

let failures = 0;
const check = (title, fn) => { try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); } };
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const root = tmpDir(path.join(os.tmpdir(), "template-release-test-"));
function setup(name) {
  const repo = path.join(root, name); mkdirSync(repo, { recursive: true }); git(repo, "init", "-b", "main"); git(repo, "config", "user.email", "release@test"); git(repo, "config", "user.name", "Release Test");
  writeFileSync(path.join(repo, "copier.yml"), "source\n"); mkdirSync(path.join(repo, "templates")); writeFileSync(path.join(repo, "templates/base"), "base\n");
  git(repo, "add", "."); git(repo, "commit", "-m", "base"); git(repo, "tag", "-a", "v0.6.3", "-m", "v0.6.3");
  writeFileSync(path.join(repo, "README.md"), "later non-template change\\n"); git(repo, "add", "README.md"); git(repo, "commit", "-m", "docs");
  const bare = path.join(root, `${name}.git`); git(root, "init", "--bare", bare); git(repo, "remote", "add", "origin", bare); git(repo, "push", "-u", "origin", "main", "--tags");
  return { repo, bare };
}
function change(repo) { writeFileSync(path.join(repo, "templates/base"), "changed\n"); git(repo, "add", "templates/base"); git(repo, "commit", "-m", "template change"); return git(repo, "rev-parse", "HEAD"); }

// req: R-596
check("red gate and no template diff create no tag", () => {
  const plain = setup("plain"); let calls = 0; const logs = [];
  assert.equal(runRelease({ repo: plain.repo, gate: () => { calls++; return 0; }, log: (line) => logs.push(line) }), 0);
  assert.equal(calls, 0); assert.match(logs.join("\n"), /nothing to release/);
  const red = setup("red"); change(red.repo); git(red.repo, "push", "origin", "main"); calls = 0;
  assert.equal(runRelease({ repo: red.repo, gate: () => { calls++; return 1; }, log: () => {} }), 1);
  assert.equal(calls, 1); assert.equal(git(red.repo, "tag", "--points-at", "HEAD"), "");
});
// req: R-596
check("green gate creates the next annotated tag and pushes only that tag", () => {
  const { repo, bare } = setup("green"); const sha = change(repo); git(repo, "push", "origin", "main"); const before = git(bare, "for-each-ref", "--format=%(refname) %(objectname)", "refs/heads");
  let gated = "";
  assert.equal(runRelease({ repo, push: true, gate: (_repo, ref) => { gated = ref; return 0; }, log: () => {} }), 0);
  assert.equal(gated, sha); assert.equal(git(repo, "cat-file", "-t", "v0.6.4"), "tag"); assert.equal(git(repo, "rev-parse", "v0.6.4^{commit}"), sha);
  assert.equal(git(bare, "for-each-ref", "--format=%(refname) %(objectname)", "refs/heads"), before);
  assert(git(bare, "show-ref", "--verify", "refs/tags/v0.6.4"));
});
// req: R-596
check("a conflicting remote tag makes tag-only push fail without moving branches", () => {
  const { repo, bare } = setup("collision"); const sha = change(repo); git(repo, "push", "origin", "main");
  git(repo, "tag", "v0.6.4", "v0.6.3"); git(repo, "push", "origin", "refs/tags/v0.6.4"); git(repo, "tag", "-d", "v0.6.4");
  const branchBefore = git(bare, "for-each-ref", "--format=%(refname) %(objectname)", "refs/heads");
  assert.equal(runRelease({ repo, push: true, gate: () => 0, log: () => {} }), 1);
  assert.equal(git(bare, "for-each-ref", "--format=%(refname) %(objectname)", "refs/heads"), branchBefore);
  assert.equal(git(bare, "rev-parse", "refs/tags/v0.6.4^{commit}"), git(repo, "rev-parse", "v0.6.3^{commit}"));
});
// req: R-596
check("a commit outside origin main is refused", () => {
  const { repo } = setup("outside"); change(repo); git(repo, "checkout", "--orphan", "other");
  writeFileSync(path.join(repo, "orphan"), "x"); git(repo, "add", "."); git(repo, "commit", "-m", "orphan");
  assert.equal(runRelease({ repo, gate: () => { throw new Error("gate must not run"); }, log: () => {} }), 1);
});
if (failures) process.exitCode = 1;
