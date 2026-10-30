/**
 * @module packages/nana-pack/tests/ci-workflow.test.mjs
 * @purpose Pins root CI triggers, ceiling and floor pi install-check coverage, suite matrix, and gated release permissions and ordering.
 * @inputs The root GitHub Actions workflow.
 * @outputs PASS/FAIL lines and exit status.
 * @effects disk (reads the workflow).
 * @errors Failed checks exit nonzero.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CI_ARTIFACT_PREFIX } from "../lib/suite-records-config.mjs";

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
  assert.match(workflow, /^      - run: npm test/m);
  assert.match(workflow, /^  release:\n    needs: \[suite, install-check\]\n    if: github.event_name == 'push' && github.ref == 'refs\/heads\/main'/m);
  assert.match(workflow, /^    permissions:\n      contents: write/m);
  assert.match(workflow, /^    concurrency:\n      group: template-release\n      cancel-in-progress: false/m);
  assert.match(workflow, /^        with:\n          fetch-depth: 0/m);
  assert.match(workflow, /^      - run: git config user\.name "github-actions\[bot\]"\n      - run: git config user\.email "41898282\+github-actions\[bot\]@users\.noreply\.github\.com"\n      - run: node scripts\/template-release\.mjs --push/m);
  assert(workflow.indexOf("pi --version") < workflow.indexOf("npm test"));
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
  assert(installLines.every((line) =>
    (line.endsWith(' --before="${PI_BEFORE}"') && line.includes("@${PI_VERSION}")) ||
    (line.endsWith(' --before="${PI_FLOOR_BEFORE}"') && line.includes("@${PI_FLOOR_VERSION}"))),
  "every pi install line must use the cutoff declared with its version");
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const release = workflow.match(/^  release:\n([\s\S]*)$/m)?.[1] ?? "";
  for (const [job, body] of [["suite", suite], ["release", release]]) {
    assert(body.split("\n").some((line) => line.includes("@earendil-works/pi-coding-agent@${PI_VERSION}") && line.endsWith(' --before="${PI_BEFORE}"')), `${job} job must hold a ceiling cutoff-pinned install`);
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
  assert.match(workflow, /^  PI_BEFORE: "2026-10-23T18:35:54Z"$/m);
});
// req: R-2712
check("R-2712: the floor pi and its cutoff are declared once, the cutoff quoted in UTC ISO form, directly after PI_BEFORE", () => {
  assert.equal((workflow.match(/^  PI_FLOOR_VERSION:/gm) ?? []).length, 1, "exactly one PI_FLOOR_VERSION key is required");
  assert.equal((workflow.match(/^  PI_FLOOR_BEFORE:/gm) ?? []).length, 1, "exactly one PI_FLOOR_BEFORE key is required");
  const env = workflow.match(/^env:\r?\n((?:[ \t].*(?:\r?\n|$))*)/m)?.[1] ?? "";
  const lines = env.split(/\r?\n/);
  const ceilingCutoff = lines.findIndex((line) => /^  PI_BEFORE:/.test(line));
  const floorVersion = lines.findIndex((line) => /^  PI_FLOOR_VERSION:/.test(line));
  const floorCutoff = lines.findIndex((line) => /^  PI_FLOOR_BEFORE:/.test(line));
  assert(ceilingCutoff >= 0 && floorVersion > ceilingCutoff && floorCutoff > floorVersion, "the floor pair must follow PI_BEFORE");
  assert(lines.slice(ceilingCutoff + 1, floorVersion).every((line) => line === "" || /^  #/.test(line)), "only comments may precede PI_FLOOR_VERSION");
  assert(lines.slice(floorVersion + 1, floorCutoff).every((line) => line === "" || /^  #/.test(line)), "only comments may separate the floor keys");
  const value = lines[floorCutoff].match(/^  PI_FLOOR_BEFORE: "([^"\r\n]+)"$/)?.[1];
  assert(value, "PI_FLOOR_BEFORE must be double quoted");
  assert.match(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.equal(new Date(value).toISOString(), value.replace("Z", ".000Z"), "floor cutoff must be a real UTC instant");
});
// req: R-2711 R-2712
check("pin R-2711 and R-2712: CI tests the sealed ceiling and floor pi at the sealed floor cutoff", () => {
  for (const pattern of [/^  PI_VERSION: 1\.4\.0$/gm, /^  PI_FLOOR_VERSION: 1\.0\.3$/gm, /^  PI_FLOOR_BEFORE: "2026-10-05T08:40:00Z"$/gm]) {
    assert.equal((workflow.match(pattern) ?? []).length, 1);
  }
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
// Reads the suite job's job-level `continue-on-error:` and returns, for a matrix os name,
// whether that leg's failure stops the release job (R-1530, R-1531). The sole step-level
// exception is `true` on the upload-artifact@v4 step; every other step-level use is refused.
function suiteBlocksOn(workflowText) {
  const suite = workflowText.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const suiteLines = suite.split("\n");
  const lines = suiteLines.filter((line) => line.includes("continue-on-error:"));
  const jobLines = lines.filter((line) => /^ {4}continue-on-error:/.test(line));
  const stepLines = lines.filter((line) => !/^ {4}continue-on-error:/.test(line));
  if (jobLines.length > 1) throw new Error(`more than one job-level continue-on-error line in the suite job: ${jobLines.join(" | ")}`);
  for (const line of stepLines) {
    const index = suiteLines.indexOf(line);
    let start = index;
    while (start >= 0 && !/^ {6}- /.test(suiteLines[start])) start--;
    let end = index + 1;
    while (end < suiteLines.length && !/^ {6}- /.test(suiteLines[end])) end++;
    const step = suiteLines.slice(start, end).join("\n");
    if (line !== "        continue-on-error: true" || !/^ {6}- uses: actions\/upload-artifact@v4$/m.test(step)) {
      throw new Error(`continue-on-error is allowed only on the upload-artifact@v4 step: ${JSON.stringify(line)}`);
    }
  }
  if (stepLines.length > 1) throw new Error(`more than one upload continue-on-error line in the suite job: ${stepLines.join(" | ")}`);
  let expr = "false";
  if (jobLines.length === 1) {
    expr = jobLines[0].slice(jobLines[0].indexOf(":") + 1).trim();
  }
  return (os) => {
    if (expr === "true") return false;
    if (expr === "false") return true;
    const m = expr.match(/^\$\{\{\s*matrix\.os\s*(==|!=)\s*'([a-z0-9-]+)'\s*\}\}$/);
    if (!m) throw new Error(`unrecognized continue-on-error expression: ${expr}`);
    const [, op, matchOs] = m;
    const continues = op === "==" ? os === matchOs : os !== matchOs;
    return !continues;
  };
}
// req: R-1530
check("R-1530: a failing macOS or Windows suite leg stops the release job", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const matrixLine = suite.match(/^ {8}os: \[(.+)\]$/m)?.[1] ?? "";
  assert(matrixLine.includes("macos-latest"), "suite matrix must include a macOS leg");
  assert(matrixLine.includes("windows-latest"), "suite matrix must include a Windows leg");
  const needsLine = workflow.match(/^  release:\n {4}needs: \[(.+)\]$/m)?.[1] ?? "";
  assert(needsLine.split(",").map((n) => n.trim()).includes("suite"), `release needs must include suite: ${needsLine}`);
  const releaseHeader = workflow.match(/^  release:\n([\s\S]*?)^ {4}steps:/m)?.[1] ?? "";
  assert(!/always\(\)|failure\(\)|cancelled\(\)/.test(releaseHeader), `release header must call none of always()/failure()/cancelled(): ${releaseHeader}`);
  const blocks = suiteBlocksOn(workflow);
  assert(blocks("macos-latest"), "a failing macOS suite leg must stop release");
  assert(blocks("windows-latest"), "a failing Windows suite leg must stop release");
});
// req: R-1531
check("R-1531: a failing Linux suite leg alone does not stop the release job", () => {
  const blocks = suiteBlocksOn(workflow);
  assert(!blocks("ubuntu-latest"), "a failing Linux suite leg alone must not stop release");
});
// req: R-1313
check("R-1313: the Windows suite leg runs the suite verbose", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  assert.match(suite, /^      - run: npm test -- --verbose --jobs=\$\{\{ env\.NANA_CI_JOBS \}\}\n        if: matrix\.os == 'windows-latest'$/m);
  assert.match(suite, /^      - run: npm test -- --verbose --jobs=/m);
});
// req: R-2556
check("R-2556: every CI suite step passes the job count to the runner after npm's separator", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const runs = suite.split("\n").filter((line) => /^\s+- run: npm test(?:\s|$)/.test(line));
  assert(runs.length >= 2, "the suite job must have at least two npm test steps");
  for (const line of runs) {
    const command = line.slice(line.indexOf("run:") + 4).trim();
    const separator = command.match(/(?:^|\s)--(?=\s|$)/);
    assert(separator, `npm test must pass runner arguments after a standalone --: ${line}`);
    const splitAt = separator.index + separator[0].length;
    const before = command.slice(0, separator.index);
    const after = command.slice(splitAt).trim();
    assert.doesNotMatch(before, /(?:^|\s)--jobs=/, "--jobs must not be consumed by npm");
    assert.equal((after.match(/--jobs=/g) ?? []).length, 1, "runner args must carry one job-count argument");
    assert.match(after, /(?:^|\s)--jobs=\$\{\{ env\.NANA_CI_JOBS \}\}(?=\s|$)/, "runner args must use the env-based job count");
  }
});
// req: R-2557
check("R-2557: the suite job's count of test files at once is sealed at 4 with a chosen comment directly above it", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const lines = suite.split("\n");
  const keys = lines.map((line, index) => ({ line, index })).filter(({ line }) => /^      NANA_CI_JOBS:/.test(line));
  assert.equal(keys.length, 1, "suite job env must define NANA_CI_JOBS exactly once");
  assert.equal(keys[0].line, '      NANA_CI_JOBS: "4"');
  const comments = [];
  for (let i = keys[0].index - 1; i >= 0 && /^      #/.test(lines[i]); i--) comments.unshift(lines[i]);
  assert(comments.some((line) => /\bchosen\b/.test(line)), "a chosen provenance comment must directly precede the key");
  assert.equal((workflow.match(/^\s*NANA_CI_JOBS:/gm) ?? []).length, 1, "the job count must have one home in the workflow");
});
// req: R-2558
check("R-2558: the per-file time limit is set once, in the suite job's env, sealed at 900000 with a chosen comment directly above it", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const lines = workflow.split("\n");
  const occurrences = lines.map((line, index) => ({ line, index })).filter(({ line }) => line.includes("NANA_TEST_TIMEOUT_MS"));
  assert.equal(occurrences.length, 1, "the timeout key may occur only once in the workflow");
  const entry = occurrences[0];
  assert.equal(entry.line, '      NANA_TEST_TIMEOUT_MS: "900000"');
  assert(suite.includes(entry.line), "the timeout must live in the suite job");
  const comments = [];
  for (let i = entry.index - 1; i >= 0 && /^      #/.test(lines[i]); i--) comments.unshift(lines[i]);
  assert(comments.some((line) => /\bchosen\b/.test(line)), "a chosen provenance comment must directly precede the key");
  assert.doesNotMatch(lines.filter((line) => /NANA_TEST_TIMEOUT_MS=/.test(line)).join("\n"), /NANA_TEST_TIMEOUT_MS=/, "the timeout must not be assigned inline in a run line");
});
// req: R-2631
check("R-2631: every CI suite step points the runner's record knob at the leg's temp folder", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const lines = suite.split("\n");
  const starts = lines.map((line, index) => /^ {6}- run: npm test(?:\s|$)/.test(line) ? index : -1).filter((index) => index >= 0);
  assert(starts.length >= 2, "the suite job must have at least two npm test steps");
  for (const start of starts) {
    let end = start + 1;
    while (end < lines.length && !/^ {6}- /.test(lines[end])) end++;
    const block = lines.slice(start, end).join("\n");
    assert.match(block, /^ {8}env:\n {10}NANA_SUITE_RECORD_FILE: \$\{\{ runner\.temp \}\}\/\$\{\{ env\.NANA_CI_RECORD_NAME \}\}$/m);
  }
  const keys = lines.map((line, index) => ({ line, index })).filter(({ line }) => /^ {6}NANA_CI_RECORD_NAME:/.test(line));
  assert.equal(keys.length, 1, "the suite job env must define NANA_CI_RECORD_NAME exactly once");
  assert.equal(keys[0].line, '      NANA_CI_RECORD_NAME: "nana-suite-record.json"');
  const comments = [];
  for (let index = keys[0].index - 1; index >= 0 && /^ {6}#/.test(lines[index]); index--) comments.unshift(lines[index]);
  assert(comments.some((line) => /\bchosen\b/.test(line)), "a chosen comment must directly precede the record name");
  assert.equal((workflow.match(/^\s*NANA_CI_RECORD_NAME:/gm) ?? []).length, 1, "the record name must have one home");
});
// req: R-2632
check("R-2632: every suite leg uploads its record after the suite, failed or not, named by leg and attempt, without failing the leg", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const lines = suite.split("\n");
  const starts = lines.map((line, index) => line === "      - uses: actions/upload-artifact@v4" ? index : -1).filter((index) => index >= 0);
  assert.equal(starts.length, 1, "the suite job must have exactly one upload-artifact@v4 step");
  const start = starts[0];
  let end = start + 1;
  while (end < lines.length && !/^ {6}- /.test(lines[end])) end++;
  const step = lines.slice(start, end).join("\n");
  const lastTest = lines.map((line, index) => /^ {6}- run: npm test(?:\s|$)/.test(line) ? index : -1).filter((index) => index >= 0).at(-1);
  assert(start > lastTest, "the upload step must follow the last npm test step");
  assert.match(step, /^ {8}if: \$\{\{ !cancelled\(\) \}\}$/m);
  assert.match(step, /^ {8}continue-on-error: true$/m);
  assert.match(step, new RegExp(`^ {10}name: ${CI_ARTIFACT_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\$\\{\\{ matrix\\.os \\}\\}-\\$\\{\\{ github\\.run_attempt \\}\\}$`, "m"));
  assert.match(step, /^ {10}path: \$\{\{ runner\.temp \}\}\/\$\{\{ env\.NANA_CI_RECORD_NAME \}\}$/m);
  assert.doesNotMatch(step, /^\s*if-no-files-found:\s*error\s*$/m);
  suiteBlocksOn(workflow);
  const moved = workflow
    .replace("        continue-on-error: true\n", "")
    .replace("        if: matrix.os != 'windows-latest'", "        if: matrix.os != 'windows-latest'\n        continue-on-error: true");
  assert.throws(() => suiteBlocksOn(moved), /allowed only on the upload-artifact@v4 step/);
});
// req: R-2577
check("R-2577: the suite job warms the copier cache before its first suite step", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const steps = suite.split("\n").filter((line) => /^      - run:/.test(line));
  const warmups = steps.filter((line) => line === "      - run: uvx copier --version");
  assert.equal(warmups.length, 1, "the suite job must run the exact copier version probe once");
  const firstSuiteStep = steps.findIndex((line) => /npm test/.test(line));
  assert(firstSuiteStep >= 0, "the suite job must include an npm test step");
  assert(steps.indexOf(warmups[0]) < firstSuiteStep, "the copier probe must precede the first npm test step");
});
// req: R-2711
check("R-2711: the install check runs on macOS and Windows at the ceiling and the floor pi, every leg installing and checking only its own version, then running the one ungated check step", () => {
  const job = workflow.match(/^  install-check:\r?\n([\s\S]*?)(?=^  suite:)/m)?.[1] ?? "";
  assert.match(job, /^ {8}os: \[macos-latest, windows-latest\]$/m);
  assert.match(job, /^ {8}pi: \[ceiling, floor\]$/m);
  assert.match(job, /^ {6}fail-fast: false$/m);
  const matrix = job.match(/^ {6}matrix:\r?\n([\s\S]*?)(?=^ {4}\S)/m)?.[1] ?? "";
  assert.doesNotMatch(matrix, /^\s*(?:include|exclude):/m);
  const lines = job.split(/\r?\n/);
  const starts = lines.map((line, index) => /^ {6}- /.test(line) ? index : -1).filter((index) => index >= 0);
  const steps = starts.map((start, index) => lines.slice(start, starts[index + 1] ?? lines.length));
  const runOf = (step) => step.find((line) => /^ {6}- run:/.test(line) || /^ {8}run:/.test(line))?.replace(/^\s*-?\s*run:\s*/, "") ?? "";
  const ifOf = (step) => step.find((line) => /^ {8}if:/.test(line))?.trim().slice(4) ?? null;
  const installs = steps.filter((step) => runOf(step).includes("@earendil-works/pi-coding-agent"));
  assert.equal(installs.length, 2, "one ceiling and one floor install step are required");
  const ceilingInstall = installs.find((step) => runOf(step).includes("@${PI_VERSION}"));
  const floorInstall = installs.find((step) => runOf(step).includes("@${PI_FLOOR_VERSION}"));
  assert(ceilingInstall && floorInstall, "both install versions are required");
  assert.equal(ifOf(ceilingInstall), "matrix.pi == 'ceiling'");
  assert.equal(ifOf(floorInstall), "matrix.pi == 'floor'");
  assert.equal(runOf(floorInstall), runOf(ceilingInstall).replaceAll("PI_VERSION", "PI_FLOOR_VERSION").replaceAll("PI_BEFORE", "PI_FLOOR_BEFORE"));
  assert(installs.every((step) => !(runOf(step).includes("PI_VERSION") && runOf(step).includes("PI_FLOOR_VERSION"))), "one step may not install both versions");
  const versions = steps.filter((step) => runOf(step).includes('test "$(pi --version)"'));
  assert.equal(versions.length, 2, "one version check per pi is required");
  const ceilingVersion = versions.find((step) => runOf(step).includes('"${PI_VERSION}"'));
  const floorVersion = versions.find((step) => runOf(step).includes('"${PI_FLOOR_VERSION}"'));
  assert.equal(ifOf(ceilingVersion), "matrix.pi == 'ceiling'");
  assert.equal(ifOf(floorVersion), "matrix.pi == 'floor'");
  const checkSteps = steps.filter((step) => runOf(step).includes("packages/nana-setup/bin/install-check.mjs"));
  assert.equal(checkSteps.length, 1, "exactly one install-check step is required");
  assert.equal(ifOf(checkSteps[0]), null, "the install-check step must run on every matrix leg");
  const checkAt = steps.indexOf(checkSteps[0]);
  for (const step of [...installs, ...versions]) assert(steps.indexOf(step) < checkAt, "installs and version checks must precede install-check");
  assert(steps.indexOf(ceilingVersion) > steps.indexOf(ceilingInstall));
  assert(steps.indexOf(floorVersion) > steps.indexOf(floorInstall));
});
// req: R-1078
check("install check is a blocking macOS and Windows job", () => {
  const job = workflow.match(/^  install-check:\n([\s\S]*?)(?=^  suite:)/m)?.[1] ?? "";
  assert(job.length > 0);
  assert(workflow.indexOf("  install-check:") < workflow.indexOf("  suite:"));
  assert.match(job, /os: \[macos-latest, windows-latest\]/);
  assert.match(job, /^    timeout-minutes: 20$/m);
  assert.doesNotMatch(job, /continue-on-error/);
  assert.match(job, /^        run: node packages\/nana-setup\/bin\/install-check\.mjs$/m);
  assert.match(job, /npm i -g --ignore-scripts @earendil-works\/pi-coding-agent@\$\{PI_VERSION\}/);
});
// req: R-1078
check("install check job runs in bash and checks pi's version after the pinned install and before the check", () => {
  const job = workflow.match(/^  install-check:\n([\s\S]*?)(?=^  suite:)/m)?.[1] ?? "";
  assert.match(job, /^    defaults:\n      run:\n        shell: bash$/m);
  const install = job.indexOf("run: npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION}");
  const version = job.indexOf('run: test "$(pi --version)" = "${PI_VERSION}"');
  const check = job.indexOf("run: node packages/nana-setup/bin/install-check.mjs");
  assert(install >= 0 && version > install && check > version);
});

// req: R-686
check("suite checkout fetches full history for historical-commit tests", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  assert.match(suite, /uses: actions\/checkout@v4\n        with:\n          fetch-depth: 0/);
});
// contract: GitHub Actions' default for jobs.<job_id>.timeout-minutes when a job sets none.
const GITHUB_DEFAULT_JOB_TIMEOUT_MINUTES = 360;
// req: R-2060
check("R-2060: the suite job sets one job-level time limit below GitHub's six-hour default for every leg", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const limitLines = suite.split("\n").filter((line) => /^ {4}timeout-minutes:/.test(line));
  assert.equal(limitLines.length, 1, `the suite job must hold exactly one job-level timeout-minutes line ${limitLines.length} !== 1`);
  const match = limitLines[0].match(/^ {4}timeout-minutes: (\d+)$/);
  assert(match, `job-level timeout-minutes must be a plain integer: ${JSON.stringify(limitLines[0])}`);
  const value = Number(match[1]);
  assert(value > 0 && value < GITHUB_DEFAULT_JOB_TIMEOUT_MINUTES, `timeout-minutes must be above 0 and below GitHub's ${GITHUB_DEFAULT_JOB_TIMEOUT_MINUTES}-minute default: ${value}`);
});
// req: R-2061
check("R-2061: the suite job's time limit is sealed at 90 minutes with a chosen comment directly above it", () => {
  const suite = workflow.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  const lines = suite.split("\n");
  const limitIndex = lines.findIndex((line) => /^ {4}timeout-minutes:/.test(line));
  const firstLine = limitIndex >= 0 ? lines[limitIndex] : undefined;
  assert.equal(firstLine, "    timeout-minutes: 90");
  const commentLines = [];
  for (let i = limitIndex - 1; i >= 0 && /^ {4}#/.test(lines[i]); i--) commentLines.unshift(lines[i]);
  assert(commentLines.some((line) => /\bchosen\b/.test(line)), "a chosen comment must sit directly above the sealed limit, with the word chosen");
});
// req: R-597
check("main pushes run the full suite on all systems without path filters or issue-writing permissions", () => {
  const normalized = workflow.replaceAll("\r\n", "\n").split("\n").map((line) => line.trimEnd()).join("\n");
  assert.match(normalized, /^on:\n  push:\n    branches: \[main\]\n  pull_request:/m);
  assert.doesNotMatch(normalized, /^\s*(paths|paths-ignore|issues):/m);
  const suite = normalized.match(/^  suite:\n([\s\S]*?)(?=^  release:)/m)?.[1] ?? "";
  assert.match(suite, /os: \[macos-latest, ubuntu-latest, windows-latest\]/);
  assert.doesNotMatch(suite, /^    if:/m);
  const commands = [...suite.matchAll(/^      - run: (npm test[^\n]*)\n        if: ([^\n]*)/gm)];
  assert.deepEqual(commands.map((m) => [m[1], m[2]]), [
    ["npm test -- --jobs=${{ env.NANA_CI_JOBS }}", "matrix.os != 'windows-latest'"],
    ["npm test -- --verbose --jobs=${{ env.NANA_CI_JOBS }}", "matrix.os == 'windows-latest'"],
  ]);
});
if (failures) process.exitCode = 1;
