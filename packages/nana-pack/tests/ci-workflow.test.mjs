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
  assert.match(workflow, /^      - run: git config user\.name "github-actions\[bot\]"\n      - run: git config user\.email "41898282\+github-actions\[bot\]@users\.noreply\.github\.com"\n      - run: node scripts\/template-release\.mjs --push/m);
  assert(workflow.indexOf("pi --version") < workflow.indexOf("npm test"));
  assert.match(workflow, /PI_VERSION: 1\.0\.2/);
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const release = workflow.match(/^  release:\n([\s\S]*)$/m)?.[1] ?? "";
  for (const [job, body] of [["suite", suite], ["release", release]]) {
    const setup = [
      "uses: actions/checkout@v4",
      "uses: actions/setup-node@v4",
      "node-version: 22",
      "uses: astral-sh/setup-uv@v5",
      "uses: pnpm/action-setup@v4",
      "version: 11",
      "run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION}",
    ];
    const positions = setup.map((step) => body.indexOf(step));
    assert(positions.every((position) => position >= 0), `${job} must include every pinned toolchain setup step`);
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b), `${job} toolchain setup steps must stay ordered`);
  }
});
if (failures) process.exitCode = 1;
