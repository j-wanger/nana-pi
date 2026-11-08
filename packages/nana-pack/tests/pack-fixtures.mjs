/**
 * @module packages/nana-pack/tests/pack-fixtures.mjs
 * @purpose Build isolated pack-runner roots from the real dependency closure.
 * @inputs A fixture name, test bodies and path membership.
 * @outputs Temporary roots, bounded runner results and awaited case verdicts.
 * @effects disk (OS temp fixtures), process (bounded node and git children).
 * @errors Assertions for failed children; case failures set exit 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpDir } from "./tmp-dir.mjs";
export const REPO = fileURLToPath(new URL("../../../", import.meta.url));
export const TEMP = tmpDir(path.join(os.tmpdir(), "ci-packs-"));
export async function check(title, fn) {
  const timer = setTimeout(() => { console.log("FAIL", title, "case limit"); process.exit(1); }, 120000);
  try { await fn(); console.log("PASS", title); }
  catch (error) { console.log("FAIL", title, error.stack); process.exitCode = 1; }
  finally { clearTimeout(timer); }
}
export function put(root, file, text) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
}
export function copyClosure(root, file, seen = new Set()) {
  if (seen.has(file)) return;
  seen.add(file);
  const source = fs.readFileSync(path.join(REPO, file), "utf8");
  put(root, file, source);
  for (const match of source.matchAll(/(?:from\s*|import\s*\()\s*["'](\.[^"']+\.mjs)["']/g)) {
    const next = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]));
    if (fs.existsSync(path.join(REPO, next))) copyClosure(root, next, seen);
  }
}
export function fixtureRoot(name, files, membership) {
  const root = tmpDir(path.join(TEMP, `${name}-`));
  copyClosure(root, "scripts/test.mjs");
  copyClosure(root, "packages/nana-pack/lib/test-packs-config.mjs");
  const config = path.join(root, "packages/nana-pack/lib/test-packs-config.mjs");
  fs.writeFileSync(config, fs.readFileSync(config, "utf8").replace(/export const TEST_PACKS = Object.freeze\([\s\S]*?\n\}\);/, `export const TEST_PACKS = Object.freeze(${JSON.stringify(membership, null, 2)});`));
  for (const [file, text] of Object.entries(files)) put(root, file, text);
  return root;
}
export function execute(root, args, extra = {}) {
  const record = path.join(TEMP, `record-${Math.random()}.json`);
  const r = spawnSync(process.execPath, [path.join(root, "scripts/test.mjs"), ...args], { cwd: root, encoding: "utf8", timeout: 60000, env: { ...process.env, NANA_TEST_SELFTEST: "0", NANA_SUITE_RECORD_FILE: record, ...extra } });
  return { ...r, out: `${r.stdout ?? ""}${r.stderr ?? ""}`, record: fs.existsSync(record) ? JSON.parse(fs.readFileSync(record, "utf8")) : null };
}
export function git(root, ...args) {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf8", timeout: 30000 });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}
