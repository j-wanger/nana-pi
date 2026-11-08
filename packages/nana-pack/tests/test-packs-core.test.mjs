/**
 * @module packages/nana-pack/tests/test-packs-core.test.mjs
 * @purpose Require every core capability's land guard and byte-preserve moved cases.
 * @inputs Pack membership, move manifest, historical and current test sources.
 * @outputs One awaited bounded must-meet verdict.
 * @effects disk (reads sources), process (bounded read-only git).
 * @errors Failed assertions set exit 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { TEST_PACKS } from "../lib/test-packs-config.mjs";
import { gitShow } from "./git-fixtures.mjs";
import { check, REPO } from "./pack-fixtures.mjs";
// req: R-3855
await check("M6: all core capabilities have land guards and moved cases keep their bytes", () => {
  const pack = "packages/nana-pack/tests/", setup = "packages/nana-setup/tests/";
  const guards = [
    ...["adoption-producer", "agent-dir-config", "bounded-read", "config-gate-fallback", "config-handlers-malformed", "config-normalize", "config-trust", "credential-gate", "first-look", "frontier-summary", "gate-corpus", "gate-policy-paths", "gate-rm-inside", "gate-self-protection", "issue-watch", "land", "lane-write-guard", "main-ci", "nana-roster", "objective-injection", "outside-reader", "pipe-guard", "readme-check", "requirements-trace", "requirements-tree", "review-standard", "roster-notice", "rulings", "skill-claims", "visual-reader", "writing-check", "data-pack-land", "ci-workflow",
      "leak-scan-cli", "identity-tree", "worker-refusal", "objective-smoke", "templates-working", "win32-forced", "claude-review-launch", "agent-dir-policy", "agent-dir-resolver", "code-map-land", "brief-check", "writing-injection", "frontier", "known-bugs", "handoff-issues"].map(name => `${pack}${name}.test.mjs`),
    ...["agent-dir-consumers", "doctor-runtime", "fsops", "hook-producers", "install", "paths", "pi-registration", "project-key", "project-working-region", "roster-notice-hook", "settings-merge", "shared-memory-hook", "shared-memory-input", "uninstall", "doctor-floor", "win-shims-sh"].map(name => `${setup}${name}.test.mjs`),
    "apps/desk/test/host-rule.test.mjs",
  ];
  for (const file of guards) {
    assert.equal(TEST_PACKS[file], "land", `core guard not in land: ${file}`);
    assert.match(fs.readFileSync(path.join(REPO, file), "utf8"), /(?:check|test)\(/, file);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(REPO, "docs/reviews/ci-packs/moves.json"), "utf8"));
  assert(manifest.moves.length >= 6);
  for (const move of manifest.moves) {
    const original = gitShow(manifest.base, move.from);
    const start = original.indexOf(move.start), end = original.indexOf(move.end, start);
    assert(start >= 0 && end > start, move.from);
    const bytes = original.slice(start, end);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), move.sha256);
    assert(fs.readFileSync(path.join(REPO, move.to), "utf8").includes(bytes), `moved bytes changed: ${move.to}`);
    assert(!fs.readFileSync(path.join(REPO, move.from), "utf8").includes(bytes), `case still in source: ${move.from}`);
  }
});
