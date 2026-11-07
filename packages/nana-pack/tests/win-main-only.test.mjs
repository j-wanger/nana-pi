/**
 * @module packages/nana-pack/tests/win-main-only.test.mjs
 * @purpose Pin main-only Windows scheduling, non-Windows lane gates and red-main refusals.
 * @inputs Workflow and rule bytes, temporary repositories and injected GitHub responses.
 * @outputs Awaited bounded must-meet PASS or FAIL lines.
 * @effects disk (OS temporary fixtures), process (local Git).
 * @errors Assertions set exit code one.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ciFixture, commit, executeCi, git, gitRunner } from "./land-fixtures.mjs";
import { mainCi } from "../lib/main-ci.mjs";
import * as policy from "../lib/land-config.mjs";

const read = rel => fs.readFileSync(new URL(`../../../${rel}`, import.meta.url), "utf8");
const workflow = read(".github/workflows/ci.yml");
const shard = i => `windows-latest-shard-${i}-of-3`;
const mac = ["suite (macos-latest)", ...["ceiling", "floor"].map(pi => `install-check (macos-latest, ${pi})`)];
const windows = [...[1, 2, 3].map(i => `suite (${shard(i)})`), ...["ceiling", "floor"].map(pi => `install-check (windows-latest, ${pi})`)];
const check = async (title, fn) => {
 const timer = setTimeout(() => { console.log("FAIL", title, "case limit"); process.exit(1); }, 120000);
 try { await fn(); console.log("PASS", title); }
 catch (error) { console.log("FAIL", title, error.stack); process.exitCode = 1; }
 finally { clearTimeout(timer); }
};
const evaluate = (expression, event, needs = {}) => JSON.parse(JSON.stringify(vm.runInNewContext(expression, {
 github: { event_name: event, ref: "refs/heads/main" }, fromJSON: JSON.parse, needs,
})));
function fixture({ laneBad, mainBad, state = "failure", missing = false, noMain = false, pending = false, platform = "darwin" } = {}) {
 const f = ciFixture("windows-main", { workflowOnMain: true });
 commit(f.main, "package.json", '{"name":"nana-pi"}\n', "toolkit policy");
 git(f.feature, "merge", "--no-edit", "main"); f.tip = git(f.feature, "rev-parse", "HEAD");
 const mainSha = git(f.main, "rev-parse", "HEAD");
 const run = (id, event, sha) => ({ id, workflow_id: 1, run_number: id, run_attempt: 1, name: "ci", path: ".github/workflows/ci.yml", head_branch: event === "push" ? "main" : "lane", head_sha: sha, event, status: "completed", conclusion: "success" });
 const lane = run(71, "pull_request", f.tip), main = run(70, "push", mainSha);
 if (pending) { main.status = "in_progress"; main.conclusion = null; }
 const jobs = isMain => [...mac, "suite (ubuntu-latest)", ...(isMain ? windows : [])]
  .filter(name => !(missing && name === (isMain ? mainBad : laneBad)))
  .map(name => ({ name, status: "completed", conclusion: name === (isMain ? mainBad : laneBad) ? state : "success", run_attempt: 1 }));
 const artifacts = isMain => jobs(isMain).filter(j => j.name.startsWith("suite (")).map((j, i) => ({ id: i + 1, name: `suite-record-${j.name.slice(7, -1)}-1`, created_at: "2026-11-07T01:00:00Z" }));
 const output = [];
 const runGh = (_cwd, args) => {
  if (args[0] === "repo") return { status: 0, stdout: '{"nameWithOwner":"example/fixture"}' };
  if (args[0] === "api") {
   const endpoint = args.at(-1), isMain = endpoint.includes("/70/");
   const body = endpoint.includes("/jobs?") ? { total_count: jobs(isMain).length, jobs: jobs(isMain) }
    : endpoint.includes("/artifacts?") ? { artifacts: artifacts(isMain) }
    : { total_count: 1, workflow_runs: endpoint.includes("event=push") || endpoint.includes(`head_sha=${mainSha}`) ? (noMain ? [] : [main]) : [lane] };
   return { status: 0, stdout: JSON.stringify(body) };
  }
  assert.equal(args[0], "run"); assert.equal(args[1], "download");
  const leg = args[args.indexOf("--name") + 1].slice("suite-record-".length, -2), dir = args[args.indexOf("--dir") + 1];
  fs.mkdirSync(dir, { recursive: true });
  const index = /-shard-(\d)-of-3/.exec(leg)?.[1];
  const record = { schema: 1, platform: leg.startsWith("windows") ? "win32" : leg.startsWith("macos") ? "darwin" : "linux", filters: [], files: [{ path: `${leg}.test.mjs`, label: "PASS", seconds: 1 }], exitCode: 0, jobs: 4, wallSeconds: 1, ...(index ? { shard: { index: Number(index), count: 3 } } : {}) };
  fs.writeFileSync(path.join(dir, "record.json"), JSON.stringify(record)); return { status: 0 };
 };
 const land = executeCi(f, [lane], { runGh, platform, keepLandCiRecords: () => ({ lines: [], notes: [] }) });
 const mainResult = mainCi({ cwd: f.main, env: {}, runGh, runGit: gitRunner, tempRoot: f.root, writeLine: line => output.push(line) });
 return { land, main: mainResult, output: output.join("\n"), unchanged: git(f.main, "rev-parse", "HEAD") === mainSha };
}

// req: R-3824
await check("M10: PR matrices omit Windows and main push matrices include every leg", () => {
 const suite = workflow.split("\n  suite:\n")[1].split("\n  release:\n")[0];
 const install = workflow.split("\n  install-check:\n")[1].split("\n  suite:\n")[0];
 const suiteExpr = suite.match(/^        include: \$\{\{ (.+) \}\}$/m)?.[1];
 const osExpr = install.match(/^        os: \$\{\{ (.+) \}\}$/m)?.[1];
 assert(suiteExpr && osExpr, "event-selected matrices required, not skipped steps on Windows runners");
 for (const event of ["pull_request", "push"]) {
  const expected = ["macos-latest", "ubuntu-latest", ...(event === "push" ? [shard(1), shard(2), shard(3)] : [])];
  const matrix = evaluate(suiteExpr, event);
  assert.deepEqual(matrix.map(item => item.leg), expected);
  for (const item of matrix) assert.equal(item.os, item.leg.startsWith("windows") ? "windows-latest" : item.leg);
  assert.deepEqual(matrix.map(item => item.shard), event === "push" ? ["", "", "1/3", "2/3", "3/3"] : ["", ""]);
  assert.deepEqual(evaluate(osExpr, event), event === "push" ? ["macos-latest", "windows-latest"] : ["macos-latest"]);
 }
 assert.match(install, /pi: \[ceiling, floor\]/);
 assert.doesNotMatch(`${suite}\n${install}`, /^    if:/m);
});
// req: R-3825
await check("M11: lanes require macOS legs but not Windows and Linux stays advisory", () => {
 for (const platform of ["darwin", "win32"]) {
  const good = fixture({ platform }); assert.equal(good.land.code, 0, good.land.text); assert.equal(good.land.suiteRan, false, `${platform} must use the non-Windows CI proof`); assert.match(good.land.text, /suite: ci .*platform darwin/);
 }
 for (const laneBad of mac) for (const options of [{ state: "failure" }, { state: "cancelled" }, { missing: true }]) {
  const result = fixture({ laneBad, ...options }); assert.equal(result.land.code, 1, result.land.text); assert(result.unchanged); assert(result.land.text.includes(laneBad));
 }
 const linux = fixture({ laneBad: "suite (ubuntu-latest)" }); assert.equal(linux.land.code, 0, linux.land.text);
});
// req: R-3826
await check("M12: red or missing newest main legs block lands and match the main report", () => {
 for (const mainBad of [...mac, ...windows]) for (const options of [{}, { state: "cancelled" }, { missing: true }]) {
  const result = fixture({ mainBad, ...options }); assert.equal(result.land.code, 1, result.land.text); assert(result.unchanged); assert(result.land.text.includes(mainBad), result.land.text);
  assert.equal(result.main.red, true); assert(result.output.includes(mainBad), result.output);
 }
 for (const options of [{ noMain: true }, { pending: true }]) {
  const result = fixture(options); assert.equal(result.land.code, 1, result.land.text); assert(result.unchanged); assert.notEqual(result.main.red, false);
 }
 const green = fixture(); assert.equal(green.land.code, 0, green.land.text); assert.equal(green.main.red, false, green.output);
 const linux = fixture({ mainBad: "suite (ubuntu-latest)" }); assert.equal(linux.land.code, 0, linux.land.text);
});
// req: R-3826
await check("seal: toolkit required CI job vocabulary is fixed", () => {
 assert.equal(policy.CI_TOOLKIT_NAME, "nana-pi");
 assert.equal(policy.CI_LANE_PLATFORM, "darwin");
 assert.deepEqual(policy.CI_LANE_JOBS, mac);
 assert.deepEqual(policy.CI_WINDOWS_JOBS, windows);
 assert.equal(policy.CI_LEGACY_WINDOWS_JOB, "suite (windows-latest)");
});
// req: R-3827
await check("M13: main-only release still needs Windows and all rule surfaces agree", () => {
 const release = workflow.split("\n  release:\n")[1];
 assert.match(release, /needs: \[suite, install-check\]/);
 const expression = release.match(/^    if: (.+)$/m)?.[1]; assert(expression);
 const needs = { suite: { result: "success", outputs: { shard1: "success", shard2: "success", shard3: "success" } }, "install-check": { result: "success" } };
 // Actions uses a hyphenated job identifier, which JavaScript needs bracket access for.
 const expr = expression.replaceAll("needs.install-check", 'needs["install-check"]');
 assert.equal(evaluate(expr, "push", needs), true); assert.equal(evaluate(expr, "pull_request", needs), false);
 for (const state of ["failure", "cancelled", "skipped"]) {
  for (const job of ["suite", "install-check"]) { const altered = structuredClone(needs); altered[job].result = state; assert.equal(evaluate(expr, "push", altered), false); }
  for (const i of [1, 2, 3]) { const altered = structuredClone(needs); altered.suite.outputs[`shard${i}`] = state; assert.equal(evaluate(expr, "push", altered), false); }
 }
 const sentence = "In nana-pi, lanes land without waiting for Windows; Windows runs on main after each land, and a red main blocks further lands.";
 assert(read("packages/nana-pack/rules/nana-rulings.md").includes(`- 2026-11-07: ${sentence}`));
 const shared = read("templates/_shared/working-under-nana-pi.md"), agents = read("AGENTS.md");
 assert.equal(agents.split("<!-- nana:working-under-nana-pi begin -->\n")[1].split("<!-- nana:working-under-nana-pi end -->")[0], shared);
 assert(shared.split("\n").find(line => line.startsWith("- Land checklist:")).includes(sentence));
 assert(agents.split("\n").find(line => line.startsWith("Support:")).includes("lanes land without waiting for Windows; Windows runs on main after each land, and a red main blocks further lands"));
});
