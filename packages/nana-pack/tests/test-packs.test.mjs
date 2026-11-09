/**
 * @module packages/nana-pack/tests/test-packs.test.mjs
 * @purpose Check complete pack membership and seal conservative selection policy.
 * @inputs Pack configuration and the real runner's direct-child test roots.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk (reads test directories).
 * @errors Failed cases set exit 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
async function check(title, fn) {
  let timer;
  try {
    await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("case limit")), 30000); })]);
    console.log("PASS", title);
  } catch (error) { console.log("FAIL", title, error.message); process.exitCode = 1; }
  finally { clearTimeout(timer); }
}
// req: R-3850
await check("M1: every collected file has exactly one pack and omissions name the file", async () => {
  const { TEST_PACKS, packProblems } = await import("../lib/test-packs-config.mjs");
  const dirs = fs.readdirSync(path.join(root, "packages")).map(name => `packages/${name}/tests`);
  dirs.push("apps/bench/test");
  const files = dirs.filter(dir => fs.existsSync(path.join(root, dir))).flatMap(dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).filter(e => e.isFile() && e.name.endsWith(".test.mjs")).map(e => `${dir}/${e.name}`));
  assert.deepEqual(packProblems(files), []);
  assert.match(packProblems([...files, "packages/probe/tests/unassigned.test.mjs"]).join("\n"), /unassigned\.test\.mjs/);
  assert.match(packProblems(["duplicate.test.mjs"], { "duplicate.test.mjs": ["land", "main"] }).join("\n"), /duplicate\.test\.mjs/);
  assert.match(packProblems(["bad.test.mjs"], { "bad.test.mjs": "typo" }).join("\n"), /bad\.test\.mjs/);
  assert(Object.isFrozen(TEST_PACKS));
});
// req: R-3856
await check("M7: R-3856 watch globs and fail-safe paths are sealed with provenance", async () => {
  const { WATCH_GLOBS, FAIL_SAFE_PATHS, RELEASE_GLOBS, PACK_NAMES } = await import("../lib/test-packs-config.mjs");
  const { PACK_FLAG, CHANGED_FROM_FLAG } = await import("../lib/test-runner-config.mjs");
  assert.equal(PACK_FLAG, "--pack=", "R-3856");
  assert.equal(CHANGED_FROM_FLAG, "--changed-from=", "R-3856");
  assert.deepEqual(PACK_NAMES, ["land", "module", "main", "release", "manual", "retire"], "R-3856");
  assert(Object.isFrozen(PACK_NAMES));
  assert.deepEqual(Object.keys(WATCH_GLOBS), [".github/workflows/*.yml", ".github/workflows/*.yaml", "packages/nana-pack/prompts/*.md", "packages/nana-pack/rules/*.md", "packages/nana-setup/claude/rules/*.md", "templates/**", "copier.yml", "code-map.config.json", "REQUIREMENTS.md", "HANDOFF.md", "docs/known-bugs/**", "**/*.test.mjs"]);
  assert.deepEqual(Object.keys(FAIL_SAFE_PATHS), ["scripts/test.mjs", "scripts/test-packs.mjs", "packages/nana-pack/lib/test-packs-config.mjs", "packages/nana-pack/lib/test-runner-config.mjs", "package.json", "code-map.config.json"]);
  assert.deepEqual(Object.keys(RELEASE_GLOBS), ["templates/**", "copier.yml", "packages/nana-setup/**"]);
  for (const table of [WATCH_GLOBS, FAIL_SAFE_PATHS, RELEASE_GLOBS]) {
    assert(Object.isFrozen(table));
    for (const reason of Object.values(table)) assert.match(reason, /(?:chosen|contract).*R-3856/);
  }
});
