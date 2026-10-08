/**
 * @module packages/nana-pack/tests/template-release.test.mjs
 * @purpose Pins gated template tag creation and tag-only pushes against isolated Git remotes.
 * @inputs Release command and temporary repositories.
 * @outputs PASS/FAIL lines and exit status.
 * @effects disk (temporary Git repositories).
 * @errors Failed checks exit nonzero.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { runRelease } from "../../../scripts/template-release.mjs";

let failures = 0;
const check = (title, fn) => { try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); } };
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const root = tmpDir(path.join(os.tmpdir(), "template-release-test-"));
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
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
check("release CLI runs its in-process gate from spaced and percent-looking checkout paths", () => {
  const gitBinary = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
  for (const name of ["release path with spaces", "release a%20b checkout"]) {
    const repo = path.join(root, name); mkdirSync(path.join(repo, "scripts"), { recursive: true });
    mkdirSync(path.join(repo, "packages/nana-pack/lib"), { recursive: true });
    for (const file of ["template-release.mjs", "template-acceptance.mjs"]) writeFileSync(path.join(repo, "scripts", file), readFileSync(path.join(repoRoot, "scripts", file), "utf8"));
    writeFileSync(path.join(repo, "packages/nana-pack/lib/release-status.mjs"), readFileSync(path.join(repoRoot, "packages/nana-pack/lib/release-status.mjs"), "utf8"));
    git(repo, "init", "-b", "main"); git(repo, "config", "user.email", "release@test"); git(repo, "config", "user.name", "Release Test");
    writeFileSync(path.join(repo, "copier.yml"), "source\n"); mkdirSync(path.join(repo, "templates")); writeFileSync(path.join(repo, "templates/base"), "base\n");
    git(repo, "add", "."); git(repo, "commit", "-m", "base"); git(repo, "tag", "-a", "v0.6.3", "-m", "v0.6.3");
    writeFileSync(path.join(repo, "templates/base"), "changed\n"); git(repo, "add", "templates/base"); git(repo, "commit", "-m", "template change");
    const bare = path.join(root, `${name}.git`); git(root, "init", "--bare", bare); git(repo, "remote", "add", "origin", bare); git(repo, "push", "-u", "origin", "main", "--tags");
    const toolBin = path.join(root, `${name}-bin`); mkdirSync(toolBin); symlinkSync(gitBinary, path.join(toolBin, "git"));
    const cli = spawnSync(process.execPath, [path.join(repo, "scripts/template-release.mjs")], { cwd: repo, encoding: "utf8", env: { ...process.env, PATH: toolBin } });
    assert.notEqual(cli.status, 0, `${name}: red default acceptance must fail release`);
    assert.match(`${cli.stdout}\n${cli.stderr}`, /uvx/);
    assert.equal(git(repo, "tag", "--points-at", "HEAD"), "");
  }
});
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
