/**
 * @module packages/nana-pack/tests/ci-workflow.test.mjs
 * @purpose Pins root CI triggers, suite matrix, and gated release permissions and ordering.
 * @inputs The root GitHub Actions workflow.
 * @outputs PASS/FAIL lines and exit status.
 * @effects disk (reads the workflow).
 * @errors Failed checks exit nonzero.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let failures = 0;
const check = (title, fn) => { try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); } };
const workflow = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.github/workflows/ci.yml"), "utf8");
// req: R-597
check("root CI runs the locked suite on macOS and nonblocking Ubuntu and gates tag release", () => {
  assert(workflow.includes("on:\n  push:\n    branches: [main]\n  pull_request:"));
  assert.match(workflow, /^permissions:\n  contents: read/m);
  assert.match(workflow, /^  suite:\n    strategy:/m);
  assert.match(workflow, /os: \[macos-latest, ubuntu-latest\]/);
  assert.match(workflow, /^    continue-on-error: \$\{\{ matrix\.os == 'ubuntu-latest' \}\}/m);
  assert.match(workflow, /^      - run: npm test/m);
  assert.match(workflow, /^  release:\n    needs: suite\n    if: github.event_name == 'push' && github.ref == 'refs\/heads\/main'/m);
  assert.match(workflow, /^    permissions:\n      contents: write/m);
  assert.match(workflow, /^    concurrency:\n      group: template-release\n      cancel-in-progress: false/m);
  assert.match(workflow, /^        with:\n          fetch-depth: 0/m);
  assert.match(workflow, /^      - run: node scripts\/template-release.mjs --push/m);
  assert(workflow.indexOf("pi --version") < workflow.indexOf("npm test"));
  assert.match(workflow, /PI_VERSION: 1\.0\.2/);
});
if (failures) process.exitCode = 1;
