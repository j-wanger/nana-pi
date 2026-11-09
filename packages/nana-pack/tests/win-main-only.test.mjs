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
import { ciFixture, commit, executeCi, git, gitRunner, ensureCiReview, recordReview, mergeSnapshot, mergeInLane } from "./land-fixtures.mjs";
import { readLandLedger, landRecordsPath } from "../lib/land-records.mjs";
import { parseLandArgs } from "../bin/nana-land.mjs";
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
function fixture({ laneBad, mainBad, state = "failure", missing = false, noMain = false, pending = false, platform = "darwin", fixesRed, moved = false, change, unreadable, refusal } = {}) {
 const f = ciFixture("windows-main", { workflowOnMain: true });
 commit(f.main, "package.json", '{"name":"nana-pi"}\n', "toolkit policy");
 git(f.feature, "merge", "--no-edit", "main"); f.tip = git(f.feature, "rev-parse", "HEAD");
 if (moved) commit(f.main, "main-only.txt", "main\n", "move main");
 ensureCiReview(f);
 if (moved) { f.capturedMain = git(f.main, 'rev-parse', 'HEAD'); mergeInLane(f); }
 if (refusal === "uncovered") f.tip = commit(f.feature, "uncovered.txt", "new\n", "uncovered");
 if (refusal === "review") recordReview(f.feature, f.home, "another", "SEND-BACK");
 if (refusal === "conflict") { commit(f.main, "base.txt", "main\n", "conflict main"); f.tip = commit(f.feature, "base.txt", "lane\n", "conflict lane"); f.reviewed = null; }
 const before = mergeSnapshot(f);
 const mainSha = git(f.main, "rev-parse", "HEAD");
 const run = (id, event, sha) => ({ id, workflow_id: 1, run_number: id, run_attempt: 1, name: "ci", path: ".github/workflows/ci.yml", head_branch: event === "push" ? "main" : "lane", head_sha: sha, event, status: "completed", conclusion: "success" });
 const lane = run(71, "pull_request", f.tip), main = run(70, "push", mainSha);
 if (pending) { main.status = "in_progress"; main.conclusion = null; }
 const jobs = isMain => [...mac, "suite (ubuntu-latest)", ...(isMain ? windows : [])]
  .filter(name => !(missing && name === (isMain ? mainBad : laneBad)))
  .map(name => ({ name, status: "completed", conclusion: name === (isMain ? mainBad : laneBad) ? state : "success", run_attempt: 1 }));
 const artifacts = isMain => (refusal === "suite" && !isMain ? [] : jobs(isMain)).filter(j => j.name.startsWith("suite (")).map((j, i) => ({ id: i + 1, name: `suite-record-${j.name.slice(7, -1)}-1`, created_at: "2026-11-07T01:00:00Z" }));
 if (refusal === "workflow") lane.conclusion = "failure";
 let mainReads = 0;
 const output = [];
 const runGh = (_cwd, args) => {
  if (args[0] === "repo") return { status: 0, stdout: '{"nameWithOwner":"example/fixture"}' };
  if (args[0] === "api") {
   const endpoint = args.at(-1), isMain = /\/70\//.test(endpoint);
   if (endpoint.includes("event=push") && ++mainReads === 2) {
    if (change === "attempt") main.run_attempt++;
    if (change === "run") main.id++;
   }
   if (isMain && ((unreadable === "jobs" && endpoint.includes("/jobs?")) || (unreadable === "records" && endpoint.includes("/artifacts?")))) return { status: 1, stderr: "evidence unavailable" };
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
  record.packRun = { complete: true, packs: ["land", "main", "module", "retire"], selection: {
   changedFrom: null, changedPaths: [], changedTests: [], failSafe: null,
   module: (index ? [1, 2, 3].map(shard) : [leg]).map(name => ({ path: `${name}.test.mjs`, reasons: ["complete module pack"] })),
  } };
  fs.writeFileSync(path.join(dir, "record.json"), JSON.stringify(record)); return { status: 0 };
 };
 const land = executeCi(f, [lane], { runGh, platform, "fixes-red": fixesRed,
  ...(refusal === "suite" ? { runCommand: () => ({ status: 1 }) } : {}),
  keepLandCiRecords: () => ({ lines: [], notes: [] }) });
 const end = readLandLedger(landRecordsPath(path.resolve(f.main, git(f.main, "rev-parse", "--git-common-dir")))) .records.at(-1);
 const mainResult = mainCi({ cwd: f.main, env: {}, runGh, runGit: gitRunner, tempRoot: f.root, writeLine: line => output.push(line) });
 return { land, end, before, after: mergeSnapshot(f), main: mainResult, output: output.join("\n"), unchanged: git(f.main, "rev-parse", "HEAD") === mainSha };
}

// req: R-3872
await check("M1: fixes-red lands the reviewed green fix and records the red run", () => {
 const args = parseLandArgs(["merge", "--tree", "lane", "--main", "main", "--suite", "test", "--reviewed", "sha=item", "--fixes-red", "70"]);
 assert.equal(args["fixes-red"], "70");
 const result = fixture({ mainBad: windows[0], fixesRed: "70" });
 assert.equal(result.land.code, 0, result.land.text); assert.equal(result.end.fixesRed, "70"); assert(!result.unchanged);
});
// req: R-3873
await check("M2: red main without fixes-red still refuses naming the run", () => {
 const result = fixture({ mainBad: windows[0] }); assert.equal(result.land.code, 1); assert.match(result.land.text, /run 70/); assert.deepEqual(result.after, result.before);
});
// req: R-3874
await check("M3: wrong green and unfinished named runs refuse unchanged", () => {
 for (const options of [{ fixesRed: "69", mainBad: windows[0] }, { fixesRed: "70" }, { fixesRed: "70", pending: true }, { fixesRed: "70", noMain: true }]) {
  const result = fixture(options); assert.equal(result.land.code, 1, result.land.text); assert.match(result.land.text, /fixes-red/); assert.deepEqual(result.after, result.before);
 }
});
// req: R-3875
await check("M4: green main rejects unnecessary fixes-red and ordinary lands still pass", () => {
 const named = fixture({ fixesRed: "70" }); assert.equal(named.land.code, 1); assert.match(named.land.text, /unnecessary/); assert.deepEqual(named.after, named.before);
 const plain = fixture(); assert.equal(plain.land.code, 0, plain.land.text);
});
// req: R-3876
await check("M5: ruling and shared checklist name the fixes-red landing path", () => {
 const clause = "The fix lands through `nana-land` with `--fixes-red <run-id>`.";
 assert(read("packages/nana-pack/rules/nana-rulings.md").split("\n").find(line => line.startsWith("- 2026-11-09: An independent reviewer")).includes(clause));
 const shared = read("templates/_shared/working-under-nana-pi.md"); assert(shared.split("\n").find(line => line.startsWith("- Land checklist:")).includes(clause));
 assert.equal(read("AGENTS.md").split("<!-- nana:working-under-nana-pi begin -->\n")[1].split("<!-- nana:working-under-nana-pi end -->")[0], shared);
});
// req: R-3877
await check("M6: unreadable named main evidence is not red authorization", () => {
 for (const unreadable of ["jobs", "records"]) {
  const result = fixture({ mainBad: windows[0], fixesRed: "70", unreadable });
  assert.equal(result.land.code, 1); assert.match(result.land.text, /main CI evidence read/i); assert.equal(result.end.fixesRed ?? null, null); assert.deepEqual(result.after, result.before);
 }
});
// req: R-3878
await check("M7: changed main CI refuses both landing paths without checkout writes", () => {
 for (const moved of [false, true]) for (const change of ["attempt", "run"]) {
  const result = fixture({ mainBad: windows[0], fixesRed: "70", moved, change });
  assert.equal(result.land.code, 1, result.land.text); assert.match(result.land.text, /changed main CI/i); assert.deepEqual(result.after, result.before); assert.equal(result.end.fixesRed ?? null, null);
 }
});
// req: R-3879
await check("M8: fixes-red preserves every other land refusal", () => {
 for (const [refusal, pattern] of [["uncovered", /uncovered commits/], ["review", /non-LAND/], ["workflow", /run 71.*failure/], ["mac", /install-check \(macos-latest, floor\)/], ["suite", /suite failed/], ["conflict", /main has moved.*git merge main/]]) {
  const result = fixture({ mainBad: windows[0], fixesRed: "70", refusal, ...(refusal === "mac" ? { laneBad: mac[2], missing: true } : {}) });
  assert.equal(result.land.code, 1, result.land.text); assert.match(result.land.text, pattern); assert.deepEqual(result.after, result.before);
 }
});

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
 for (const job of [suite, install]) assert.match(job, /^    if: \$\{\{ github.event_name != 'pull_request'/m);
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
