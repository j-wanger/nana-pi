/**
 * @module packages/nana-pack/tests/test-packs-core.test.mjs
 * @purpose Require every core capability's land guard.
 * @inputs Pack membership, workflow and current test sources.
 * @outputs One awaited bounded must-meet verdict.
 * @effects disk (reads sources).
 * @errors Failed assertions set exit 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { TEST_PACKS } from "../lib/test-packs-config.mjs";
import { check, REPO } from "./pack-fixtures.mjs";
// req: R-3855
await check("M6: all core capabilities have land guards", () => {
  const pack = "packages/nana-pack/tests/", setup = "packages/nana-setup/tests/";
  const guards = [
    ...["adoption-producer", "agent-dir-config", "bounded-read", "config-gate-fallback", "config-handlers-malformed", "config-normalize", "config-trust", "credential-gate", "first-look", "frontier-summary", "gate-corpus", "gate-policy-paths", "gate-rm-inside", "gate-self-protection", "issue-watch", "land", "lane-write-guard", "main-ci", "nana-roster", "objective-injection", "outside-reader", "pipe-guard", "readme-check", "requirements-trace", "requirements-tree", "review-standard", "roster-notice", "rulings", "skill-claims", "visual-reader", "writing-check", "data-pack-land", "ci-workflow",
      "leak-scan-cli", "identity-tree", "worker-refusal", "objective-smoke", "templates-working", "win32-forced", "claude-review-launch", "agent-dir-policy", "agent-dir-resolver", "brief-check", "writing-injection", "frontier", "known-bugs", "handoff-issues"].map(name => `${pack}${name}.test.mjs`),
    ...["agent-dir-consumers", "doctor-runtime", "fsops", "hook-producers", "install", "paths", "pi-registration", "project-key", "project-working-region", "roster-notice-hook", "settings-merge", "shared-memory-hook", "win-shims-sh"].map(name => `${setup}${name}.test.mjs`),
  ];
  for (const file of guards) {
    assert.equal(TEST_PACKS[file], "land", `core guard not in land: ${file}`);
    assert.match(fs.readFileSync(path.join(REPO, file), "utf8"), /(?:check|test)\(/, file);
  }
  const workflow = fs.readFileSync(path.join(REPO, ".github/workflows/ci.yml"), "utf8");
  assert.match(workflow, /name: Repository checks[\s\S]*?node scripts\/requirements-trace\.mjs/);
  assert.equal(TEST_PACKS[`${pack}requirements-trace.test.mjs`], "land");
});
