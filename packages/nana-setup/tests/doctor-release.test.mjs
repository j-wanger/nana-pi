/**
 * @module packages/nana-setup/tests/doctor-release.test.mjs
 * @purpose Pins doctor release status as informational for lagging and degraded checkouts.
 * @inputs diagnose, release-status Git metadata, and isolated temporary repositories.
 * @outputs PASS/FAIL lines and a nonzero exit when a doctor release row is not informational.
 * @effects disk (temporary test repositories).
 * @errors Failed checks exit nonzero; unexpected exceptions fail the process.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import "./stub-pi.mjs";
import { diagnose, STATUS } from "../lib/doctor.mjs";
import { resolveLayout } from "../lib/paths.mjs";

let failures = 0;
const check = (title, fn) => { try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); } };
const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const makeRepo = (root, name, withOrigin) => {
  const dir = path.join(root, name); mkdirSync(dir, { recursive: true }); git(dir, "init", "-b", "main"); git(dir, "config", "user.email", "doctor@test"); git(dir, "config", "user.name", "Doctor Test");
  writeFileSync(path.join(dir, "copier.yml"), "source\n"); writeFileSync(path.join(dir, "README.md"), "readme\n"); mkdirSync(path.join(dir, "templates")); writeFileSync(path.join(dir, "templates", "base"), "base\n");
  git(dir, "add", "."); git(dir, "commit", "-m", "base"); git(dir, "tag", "v0.1.0");
  if (withOrigin) { const bare = path.join(root, `${name}.git`); git(root, "init", "--bare", bare); git(dir, "remote", "add", "origin", bare); git(dir, "push", "-u", "origin", "main"); }
  return dir;
};
const addTemplate = (dir) => { writeFileSync(path.join(dir, "templates", "past-tag"), "changed\n"); git(dir, "add", "templates/past-tag"); git(dir, "commit", "-m", "template change"); };
const getRow = (repo, root) => diagnose(resolveLayout({ home: path.join(root, "home") }), { projectDir: root, releaseRepo: repo }).find((row) => row.label === "release status");

// req: R-586
check("lagging release status is a NOTE with the root's tag and count", () => {
  const root = tmpDir(path.join(os.tmpdir(), "doctor-release-lag-")); const repo = makeRepo(root, "lagging", true); addTemplate(repo);
  const row = getRow(repo, root); assert.equal(row?.status, STATUS.NOTE); assert.match(row.detail, /v0\.1\.0/); assert.match(row.detail, /1 template commit/);
});
// req: R-586
check("degraded release status without an origin remains a NOTE", () => {
  const root = tmpDir(path.join(os.tmpdir(), "doctor-release-degraded-")); const repo = makeRepo(root, "degraded", false); addTemplate(repo);
  const row = getRow(repo, root); assert.equal(row?.status, STATUS.NOTE); assert.match(row.detail, /origin/i);
});
if (failures) process.exitCode = 1;
