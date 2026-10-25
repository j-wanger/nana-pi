/**
 * @module packages/nana-pack/tests/review-movement.test.mjs
 * @purpose Pin the movement deliverable's maker and readers and the section's sealed tunables.
 * @inputs The repository ledger and review-movement-config.mjs exports.
 * @outputs Named PASS/FAIL lines and a failing status for any broken assertion.
 * @effects disk (reads the repository ledger).
 * @errors Failed assertions print their reason and set a nonzero exit status.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  MOVEMENT_HEADING, MOVEMENT_LEAD, MOVEMENT_BASE, MOVEMENT_NOT_COMPUTED,
  MOVEMENT_TIMEOUT_MS, MOVEMENT_MAX_BYTES, MOVEMENT_SCRIPT_URL,
} from "../lib/review-movement-config.mjs";

let failures = 0;
function check(title, fn) {
  try { fn(); console.log("PASS", title); }
  catch (error) { failures++; console.log("FAIL", title, error.message); }
}
// req: R-2905
check("R-2905: the ledger lists the tree movement report as a CAP-07 deliverable made by the review launchers, read in the reviewer's prompt and pointed to by the seat's land report", () => {
  const text = readFileSync(new URL("../../../REQUIREMENTS.md", import.meta.url), "utf8");
  const cap = text.slice(text.indexOf("# CAP-07 ·"), text.indexOf("## FEAT-028 ·"));
  assert.match(cap, /^Deliverables: .*\bR-1460\b/m);
  assert.match(cap, /^Made by: R-1460 · review: packages\/nana-pack\/bin\/claude-review\.mjs, packages\/nana-pack\/bin\/pi-review\.mjs, packages\/nana-pack\/lib\/review-movement\.mjs, scripts\/requirements-moved\.mjs · built from: A-030$/m);
  assert.match(cap, /^Read by: R-1460 · prompt: packages\/nana-pack\/bin\/claude-review\.mjs, packages\/nana-pack\/bin\/pi-review\.mjs$/m);
  assert.match(cap, /^Read by: R-1460 · person: the seat's land report points the owner to it$/m);
});
// req: R-2900 R-2901 R-2902 R-2906 R-2907 R-2908
check("seal: the tree movement section is headed ## Tree movement with its lead line, computed against main by the pack's own requirements-moved within 30 seconds and 16 MiB, and a failed run reads tree movement: not computed:", () => {
  assert.equal(MOVEMENT_HEADING, "## Tree movement");
  assert.equal(MOVEMENT_LEAD, "Read every feature this names before you judge the change.");
  assert.equal(MOVEMENT_BASE, "main");
  assert.equal(MOVEMENT_NOT_COMPUTED, "tree movement: not computed:");
  assert.equal(MOVEMENT_TIMEOUT_MS, 30_000);
  assert.equal(MOVEMENT_MAX_BYTES, 16 * 1024 * 1024);
  assert.equal(fileURLToPath(MOVEMENT_SCRIPT_URL), fileURLToPath(new URL("../../../scripts/requirements-moved.mjs", import.meta.url)));
});
process.exitCode = failures ? 1 : 0;
