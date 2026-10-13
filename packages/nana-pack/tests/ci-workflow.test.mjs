/**
 * @module packages/nana-pack/tests/ci-workflow.test.mjs
 * @purpose Pins root CI triggers, suite matrix, and gated release permissions and ordering.
 * @inputs The root GitHub Actions workflow.
 * @outputs PASS/FAIL lines and exit status.
 * @effects disk (reads the workflow).
 * @errors Failed checks exit nonzero.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let failures = 0;
const check = (title, fn) => { try { fn(); console.log("PASS", title); } catch (error) { failures++; console.log("FAIL", title, error.message); } };
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const workflow = readFileSync(process.env.CI_WORKFLOW_PATH ?? path.join(repoRoot, ".github/workflows/ci.yml"), "utf8");
// req: R-597
check("root CI runs the suite on macOS, Linux, and Windows and gates tag release", () => {
  assert(workflow.includes("on:\n  push:\n    branches: [main]\n  pull_request:"));
  assert.match(workflow, /^permissions:\n  contents: read/m);
  assert.match(workflow, /^  suite:\n    strategy:/m);
  assert.match(workflow, /os: \[macos-latest, ubuntu-latest, windows-latest\]/);
  assert.match(workflow, /^    continue-on-error: \$\{\{ matrix\.os != 'macos-latest' \}\}/m);
  assert.match(workflow, /^      - run: npm test/m);
  assert.match(workflow, /^  release:\n    needs: \[suite, install-check\]\n    if: github.event_name == 'push' && github.ref == 'refs\/heads\/main'/m);
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
// req: R-1090
check("every pi install in CI resolves at the declared cutoff", () => {
  const installLines = workflow.split("\n").filter((line) => !/^\s*#/.test(line) && line.includes("@earendil-works/pi-coding-agent"));
  assert(installLines.length >= 2, "at least two pi install lines are required");
  assert(installLines.every((line) => line.endsWith(' --before="${PI_BEFORE}"')), "every pi install line must end with the cutoff flag");
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const release = workflow.match(/^  release:\n([\s\S]*)$/m)?.[1] ?? "";
  for (const [job, body] of [["suite", suite], ["release", release]]) {
    assert(body.split("\n").some((line) => line.includes("@earendil-works/pi-coding-agent") && line.endsWith(' --before="${PI_BEFORE}"')), `${job} job must hold a cutoff-pinned install`);
  }
});
// req: R-1091
check("the pi resolution cutoff is declared once, quoted, in UTC ISO form beside PI_VERSION", () => {
  assert.equal((workflow.match(/^\s*PI_BEFORE:/gm) ?? []).length, 1, "exactly one PI_BEFORE key is required");
  const env = workflow.match(/^env:\n((?:[ \t].*\n)*)/m)?.[1] ?? "";
  const lines = env.split("\n");
  const versionIndex = lines.findIndex((line) => /^  PI_VERSION:/.test(line));
  const cutoffIndex = lines.findIndex((line) => /^  PI_BEFORE:/.test(line));
  assert(versionIndex >= 0 && cutoffIndex > versionIndex, "PI_BEFORE must follow PI_VERSION in workflow env");
  assert(lines.slice(versionIndex + 1, cutoffIndex).every((line) => line === "" || /^  #/.test(line)), "only comments may separate the keys");
  const value = lines[cutoffIndex].match(/^  PI_BEFORE: "([^"\n]+)"$/)?.[1];
  assert(value, "PI_BEFORE must be double quoted");
  assert.match(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.equal(new Date(value).toISOString(), value.replace("Z", ".000Z"), "cutoff must be a real UTC instant");
});
// req: R-1091
check("the pi resolution cutoff is sealed at the seat's install moment", () => {
  assert.match(workflow, /^  PI_BEFORE: "2026-10-04T06:57:57Z"$/m);
});
// req: R-1092
check("npm's before is never set through the environment or a repository-root .npmrc", () => {
  assert.doesNotMatch(workflow.split("\n").filter((line) => !/^\s*#/.test(line)).join("\n"), /npm_config_before/i);
  const npmrc = process.env.CI_NPMRC_PATH ?? path.join(repoRoot, ".npmrc");
  if (existsSync(npmrc)) {
    assert.doesNotMatch(readFileSync(npmrc, "utf8").split("\n").filter((line) => !/^\s*#/.test(line)).join("\n"), /^\s*before\s*=/im);
  }
});
// req: R-996
check("suite job requires copier on every matrix leg", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const release = workflow.match(/^  release:\n([\s\S]*)$/m)?.[1] ?? "";
  assert.match(suite, /^    env:\n      NANA_TEST_REQUIRE_COPIER: "1"$/m);
  assert.doesNotMatch(release, /^      NANA_TEST_REQUIRE_COPIER:/m);
});
// req: R-1031
check("suite runs on Windows with bash and the pinned toolchain", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  assert.match(suite, /^    defaults:\n      run:\n        shell: bash$/m);
  assert.match(suite, /windows-latest/);
  assert.match(suite, /^    env:\n      NANA_TEST_REQUIRE_COPIER: "1"$/m);
  const setup = [
    "uses: actions/checkout@v4",
    "uses: actions/setup-node@v4",
    "node-version: 22",
    "uses: astral-sh/setup-uv@v5",
    "uses: pnpm/action-setup@v4",
    "version: 11",
    "run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION}",
    "pi --version",
    "run: npm test",
  ];
  const positions = setup.map((step) => suite.indexOf(step));
  assert(positions.every((position) => position >= 0), "Windows suite must include all pinned setup and test steps");
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), "suite setup, version check, and npm test must stay ordered");
});
// req: R-1032
check("Windows suite failure does not block release", () => {
  assert.match(workflow, /^    continue-on-error: \$\{\{ matrix\.os != 'macos-latest' \}\}/m);
  assert.match(workflow, /^  release:\n    needs: \[suite, install-check\]\n/m);
});
// req: R-1078
check("install check is a blocking macOS and Windows job before suite", () => {
  const job = workflow.match(/^  install-check:\n([\s\S]*?)(?=^  suite:)/m)?.[1] ?? "";
  assert(job.length > 0);
  assert(workflow.indexOf("  install-check:") < workflow.indexOf("  suite:"));
  assert.match(job, /os: \[macos-latest, windows-latest\]/);
  assert.match(job, /^    timeout-minutes: 20$/m);
  assert.doesNotMatch(job, /continue-on-error/);
  assert.match(job, /^        run: node packages\/nana-setup\/bin\/install-check\.mjs$/m);
  assert.match(job, /npm i -g --ignore-scripts @earendil-works\/pi-coding-agent@\$\{PI_VERSION\}/);
});
// req: R-686
check("suite checkout fetches full history for historical-commit tests", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  assert.match(suite, /uses: actions\/checkout@v4\n        with:\n          fetch-depth: 0/);
});
if (failures) process.exitCode = 1;
