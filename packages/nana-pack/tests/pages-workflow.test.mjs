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
function runSteps(source) {
  const lines = source.split(/\r?\n/);
  const steps = [];
  for (let index = 0; index < lines.length; index++) {
    if (!/^\s+- run:/.test(lines[index])) continue;
    const indent = lines[index].match(/^\s*/)[0].length;
    let end = index + 1;
    while (end < lines.length && !(new RegExp(`^ {${indent}}- `).test(lines[end]))) end++;
    steps.push(lines.slice(index, end).join("\n"));
  }
  return steps;
}
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
  assert.doesNotMatch(build, /actions\/configure-pages/);
  assert.match(build, /name: Build product page\n        env:\n          GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(deploy, /permissions:\n      pages: write\n      id-token: write\n    environment:/);
  assert.match(deploy, /^    if: github\.ref == 'refs\/heads\/main'$/m);
  assert.match(text, /^  cancel-in-progress: false$/m);
  assert(runSteps(text).every((step) => !step.includes("github.event")), "no run step, including a block, may mention github.event");
});
// req: R-2985
check("R-2985: identity scan checks the uploaded page before upload without escapes", () => {
  const scan = text.indexOf("run: node scripts/identity-scan.mjs --stdin --root . < site/index.html");
  const upload = text.indexOf("uses: actions/upload-pages-artifact@v3");
  assert(scan >= 0 && upload > scan);
  const scanStep = text.slice(text.lastIndexOf("      - name:", scan), upload);
  assert(!/continue-on-error|\|\|\s*true/.test(scanStep));
  const uploadBlock = text.slice(text.indexOf("uses: actions/upload-pages-artifact@v3"));
  assert.match(uploadBlock, /^\s{10}path: site$/m);
  assert.equal((uploadBlock.match(/^\s{10}path:/gm) ?? []).length, 1);
});
// req: R-3131
check("R-3131: Pages builds the hive beside the product page and scans its data before upload", () => {
  const product = text.indexOf('run: node scripts/product-report.mjs --out site/index.html');
  const hive = text.indexOf('run: node scripts/hive-page.mjs --out site/hive');
  const scan = text.indexOf('run: node scripts/identity-scan.mjs --stdin --root . < site/hive/components.json');
  const upload = text.indexOf('uses: actions/upload-pages-artifact@v3');
  assert(product >= 0 && hive > product && scan > hive && upload > scan);
  assert(!/continue-on-error|\|\|\s*true/.test(text.slice(hive, upload)));
});
// req: R-3139
check("R-3139: Pages derives the real audit before passing it to the hive", () => {
  const audit = text.indexOf('run: node scripts/component-audit.mjs --out "$RUNNER_TEMP/components.json"');
  const hive = text.indexOf('run: node scripts/hive-page.mjs --out site/hive --data "$RUNNER_TEMP/components.json"');
  const scan = text.indexOf('run: node scripts/identity-scan.mjs --stdin --root . < site/hive/components.json');
  assert(audit >= 0 && hive > audit && scan > hive);
  assert(!/continue-on-error|\|\|\s*true/.test(text.slice(audit, scan)));
});
process.exitCode = failures ? 1 : 0;
