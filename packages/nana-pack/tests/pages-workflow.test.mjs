/**
 * @module packages/nana-pack/tests/pages-workflow.test.mjs
 * @purpose Pins the public product-page workflow's triggers, permissions, branch gate and identity scan.
 * @inputs The repository's Pages workflow file.
 * @outputs Requirement-tagged PASS/FAIL checks.
 * @effects disk (reads the workflow).
 * @errors Failed assertions set a nonzero exit.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const text = fs.readFileSync(path.join(root, ".github/workflows/pages.yml"), "utf8");
let failures = 0;
function check(title, fn) { try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); } }
// req: R-2980 R-2986
check("R-2980: Pages builds for main and issue changes, deploys only main with least privilege and serialization", () => {
  assert.match(text, /^on:\n  push:\n    branches: \[main\]\n  issues:\n    types: \[opened, edited, closed, reopened, labeled, unlabeled, deleted\]\n  workflow_dispatch:/m);
  assert.match(text, /^permissions:\n  contents: read\n\njobs:/m);
  const build = text.match(/^  build:\n([\s\S]*?)(?=^  deploy:)/m)?.[1] ?? "";
  const deploy = text.match(/^  deploy:\n([\s\S]*)$/m)?.[1] ?? "";
  assert.match(build, /uses: actions\/checkout@v4\n        with:\n          fetch-depth: 0/);
  assert.match(build, /permissions:\n      contents: read\n      issues: read\n    steps:/);
  assert.match(build, /name: Build product page\n        env:\n          GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(deploy, /permissions:\n      pages: write\n      id-token: write\n    environment:/);
  assert.match(deploy, /^    if: github\.ref == 'refs\/heads\/main'$/m);
  assert.match(text, /^  cancel-in-progress: false$/m);
  assert.doesNotMatch(text, /^\s*run:.*\$\{\{\s*github\.event/m);
});
// req: R-2985
check("R-2985: identity scan checks the uploaded page before upload without escapes", () => {
  const scan = text.indexOf("run: node scripts/identity-scan.mjs --stdin --root . < site/index.html");
  const upload = text.indexOf("uses: actions/upload-pages-artifact@v3");
  assert(scan >= 0 && upload > scan);
  const scanStep = text.slice(text.lastIndexOf("      - name:", scan), upload);
  assert(!/continue-on-error|\|\|\s*true/.test(scanStep));
  assert.match(text, /path: site/);
});
process.exitCode = failures ? 1 : 0;
