/**
 * @module packages/nana-pack/tests/test-packs-ci.test.mjs
 * @purpose Pin event-specific CI packs and every pack-record consumer through real runner output.
 * @inputs Workflow, pack membership, copied runner fixtures and injected GitHub artifact transport.
 * @outputs Four awaited bounded must-meet verdicts.
 * @effects disk (OS temp only), process (runner and git children).
 * @errors Failed assertions set exit 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { TEST_PACKS } from "../lib/test-packs-config.mjs";
import { proveCiSuite } from "../lib/land-ci.mjs";
import { mainCi } from "../lib/main-ci.mjs";
import { readCiRecords } from "../lib/ci-records.mjs";
import { ciFixture, commit, executeCi, git as landGit, gitRunner } from "./land-fixtures.mjs";
import { check, execute, fixtureRoot, git, put, REPO, TEMP } from "./pack-fixtures.mjs";
const workflow = fs.readFileSync(path.join(REPO, ".github/workflows/ci.yml"), "utf8");
const evaluate = (expr, event, extra = {}) => vm.runInNewContext(expr, { github: { event_name: event, ref: event === 'push' ? 'refs/heads/main' : 'refs/pull/3/merge', workflow: "ci", event: { pull_request: { number: 3 } }, run_id: 7 }, fromJSON: JSON.parse, ...extra });
const suite = workflow.split("\n  suite:\n")[1].split("\n  release:\n")[0];
function suiteArgs(event, shard = "") {
  const line = suite.split("\n").find(line => line.startsWith(shard ? "      - run: npm test -- --verbose" : "      - run: npm test -- --jobs="));
  assert(line, "suite command exists");
  const command = line.replace(/\$\{\{ (.*?) \}\}/g, (_, expr) => String(evaluate(expr, event, { env: { NANA_CI_JOBS: "4" }, matrix: { shard } })));
  return command.split("npm test -- ")[1].trim().split(/\s+/);
}
function runnerFixture(name) {
  const files = {}, membership = {};
  for (const pack of ["land", "module", "main", "retire", "release"]) for (let i = 0; i < 6; i++) {
    const file = `packages/probe/tests/${pack}-${i}.test.mjs`;
    membership[file] = pack; files[file] = `console.log("PASS ${pack}-${i}");\n`;
  }
  return { root: fixtureRoot(name, files, membership), membership };
}
// req: R-3853
await check("M4: PR CI selects macOS packs release watches and cancellation while main runs every OS", async () => {
  assert.match(JSON.parse(fs.readFileSync(path.join(REPO, "package.json"), "utf8")).scripts.release, /--pack=release/);
  const matrix = suite.match(/^        include: \$\{\{ (.+) \}\}$/m)?.[1]; assert(matrix);
  assert.deepEqual(Array.from(evaluate(matrix, "pull_request"), x => x.os), ["macos-latest", "ubuntu-latest"]);
  assert.deepEqual(Array.from(evaluate(matrix, "push"), x => x.os), ["macos-latest", "ubuntu-latest", "windows-latest", "windows-latest", "windows-latest"]);
  assert(suiteArgs("pull_request").includes("--pack=land,module"));
  assert(suiteArgs("pull_request").includes("--changed-from=origin/main"));
  assert(suiteArgs("push").includes("--pack=land,main,module,retire"));
  assert(!suiteArgs("push").some(a => a.startsWith("--changed-from")));
  const concurrency = workflow.match(/^concurrency:\n([\s\S]*?)(?=^\S)/m)?.[1]; assert(concurrency);
  const cancel = concurrency.match(/^  cancel-in-progress: \$\{\{ (.+) \}\}$/m)?.[1]; assert(cancel);
  assert.equal(evaluate(cancel, "pull_request"), true); assert.equal(evaluate(cancel, "push"), false);
  const group = concurrency.match(/^  group: (.+)$/m)?.[1]; assert(group.includes("github.event.pull_request.number")); assert(group.includes("github.run_id"));
  const { root, membership } = runnerFixture("release-watch");
  git(root, "init", "-b", "main"); git(root, "config", "user.name", "Fixture"); git(root, "config", "user.email", "fixture@example.invalid"); git(root, "add", "."); git(root, "commit", "-m", "base");
  const { selectPackFiles } = await import("../../../scripts/test-packs.mjs");
  for (const file of ["templates/input.md", "copier.yml", "packages/nana-setup/lib/input.mjs"]) {
    const selected = await selectPackFiles({ root, files: Object.keys(membership), membership, packs: ["land", "module"], changedFrom: "main", readDiff: () => [file], makeGraph: () => { throw new Error("uncertain graph"); } });
    assert(selected.packs.includes("release"), file);
    assert(Object.keys(membership).filter(f => membership[f] === "release").every(f => selected.files.includes(f)));
  }
});
// req: R-3854
await check("M5: land accepts complete lane pack records and refuses filtered or landless proof", () => {
  const { root } = runnerFixture("proof");
  const r = execute(root, ["--pack=land,module"]); assert.equal(r.status, 0, r.out);
  const run = { id: 71, run_attempt: 1 };
  const proof = record => proveCiSuite({ code: 0, parsed: [{ run, leg: "macos-latest", attempt: 1, record }], problems: [] }, [run], process.platform);
  assert.equal(proof(r.record).ok, true);
  for (const record of [
    { ...r.record, packRun: undefined, filters: ["land"] },
    { ...r.record, packRun: { ...r.record.packRun, packs: ["module"] } },
    { ...r.record, packRun: { ...r.record.packRun, packs: ["land"] } },
    { ...r.record, packRun: { ...r.record.packRun, complete: false } },
    { ...r.record, packRun: { ...r.record.packRun, selection: null } },
    { ...r.record, filters: ["substring"] },
  ]) assert.equal(proof(record).ok, false, JSON.stringify(record.packRun));
});
// req: R-3857
await check("M8: main keeps all collected nonrelease files and an injected retire failure fails its command", () => {
  const before = git(REPO, "ls-tree", "-r", "--name-only", "85ca2b75d458f8d69edcaa2bf1a4de8f0023610c").split("\n").filter(f => /^(?:packages\/[^/]+\/tests|apps\/(?:desk|bench)\/test)\/[^/]+\.test\.mjs$/.test(f));
  const packs = suiteArgs("push").find(arg => arg.startsWith("--pack="))?.slice(7).split(","); assert(packs);
  // Honor committed retirements and the brief-named deletions before their area commit.
  const diet2Retirements = new Set([
    ...["doctor-trust", "seat-rule", "shared-memory-input", "realpath-fallback", "verifier-pipe"].map(name => `packages/nana-setup/tests/${name}.test.mjs`),
    ...["doctor-floor", "doctor-release"].map(name => `packages/nana-setup/tests/${name}.test.mjs`),
    "packages/nana-knowledge/tests/hook.test.mjs",
    "packages/nana-pack/tests/handoff-writer-role.test.mjs",
  ]);
  for (const file of diet2Retirements) assert(!fs.existsSync(path.join(REPO, file)) && TEST_PACKS[file] === undefined, `diet2 retirement restored: ${file}`);
  let base;
  for (const ref of ["main", "origin/main"]) {
    try { base = git(REPO, "rev-parse", "--verify", `${ref}^{commit}`); break; }
    catch { /* PR checkouts have remote-tracking refs, not a local main. */ }
  }
  if (!base) throw new Error("M8 requires main or origin/main to resolve to a commit; fetch the main branch before running this check.");
  base = git(REPO, "merge-base", "HEAD", base);
  const onMain = new Set(git(REPO, "ls-tree", "-r", "--name-only", base).split("\n"));
  const retiredByMain = before.filter(file => !onMain.has(file));
  for (const file of retiredByMain) assert(!fs.existsSync(path.join(REPO, file)), `main deletion restored: ${file}`);
  const atHead = new Set(git(REPO, "ls-tree", "-r", "--name-only", "HEAD").split("\n"));
  for (const file of before) if (atHead.has(file) && !retiredByMain.includes(file) && !diet2Retirements.has(file) && !["release", "manual"].includes(TEST_PACKS[file])) assert(packs.includes(TEST_PACKS[file]), file);
  const all = Object.keys(TEST_PACKS).filter(f => f.endsWith(".test.mjs") && !["release", "manual"].includes(TEST_PACKS[f]));
  assert.deepEqual(Object.keys(TEST_PACKS).filter(f => f.endsWith(".test.mjs") && packs.includes(TEST_PACKS[f])).sort(), all.sort());
  const { root } = runnerFixture("retire-failure");
  put(root, "packages/probe/tests/retire-0.test.mjs", 'console.log("FAIL retire canary"); process.exitCode = 1;\n');
  const r = execute(root, suiteArgs("push")); assert.equal(r.status, 1, r.out);
  assert(r.record.files.some(f => f.path.endsWith("retire-0.test.mjs") && f.label === "FAIL"));
  assert(r.record.files.every(f => !f.path.includes("release-")));
});
// req: R-3859
await check("M10: real pack shards pass every reader and newest missing or failed shards leave main unchanged", () => {
  const { root } = runnerFixture("shard-records");
  const mac = execute(root, ["--pack=land,main,module,retire"]).record;
  const windows = [1, 2, 3].map(index => execute(root, ["--pack=land,main,module,retire", `--shard=${index}/3`]).record);
  assert(mac && windows.every(Boolean));
  for (const mode of ["green", "missing", "failed", "pack-gap", "mixed-selection"]) {
    const f = ciFixture(`pack-${mode}`, { workflowOnMain: true });
    commit(f.main, "package.json", '{"name":"nana-pi"}\n', "toolkit"); landGit(f.feature, "merge", "--no-edit", "main"); f.tip = landGit(f.feature, "rev-parse", "HEAD");
    const mainSha = landGit(f.main, "rev-parse", "HEAD");
    const run = (id, event, sha) => ({ id, workflow_id: 1, run_number: id, run_attempt: 2, name: "ci", path: ".github/workflows/ci.yml", head_branch: event === "push" ? "main" : "lane", head_sha: sha, event, status: "completed", conclusion: "success" });
    const lane = run(71, "pull_request", f.tip), main = run(70, "push", mainSha);
    const leg = index => `windows-latest-shard-${index}-of-3`;
    const items = [{ leg: "macos-latest", attempt: 2, record: { ...mac, platform: "darwin" } }, { leg: "ubuntu-latest", attempt: 2, record: { ...mac, platform: "linux" } }];
    for (let index = 1; index <= 3; index++) {
      const record = { ...structuredClone(windows[index - 1]), platform: "win32" };
      items.push({ leg: leg(index), attempt: 1, record });
      if (index === 2 && mode === "missing") continue;
      const latest = structuredClone(record);
      if (index === 2 && mode === "failed") { latest.exitCode = 1; latest.files[0].label = "FAIL"; }
      if (index === 2 && mode === "pack-gap") latest.packRun.packs = ["module"];
      if (index === 2 && mode === "mixed-selection") latest.packRun.selection.changedFrom = "different-ref";
      items.push({ leg: leg(index), attempt: 2, record: latest });
    }
    const jobs = [...["macos-latest", "ubuntu-latest", leg(1), leg(2), leg(3)].map(name => ({ name: `suite (${name})`, status: "completed", conclusion: mode === "failed" && name === leg(2) ? "failure" : "success", run_attempt: 2, started_at: "2026-11-07T02:30:00Z" })), ...["macos-latest", "windows-latest"].flatMap(os => ["ceiling", "floor"].map(pi => ({ name: `install-check (${os}, ${pi})`, status: "completed", conclusion: "success" })))];
    const runGh = (_cwd, args) => {
      if (args[0] === "repo") return { status: 0, stdout: '{"nameWithOwner":"example/fixture"}' };
      if (args[0] === "api") {
        const endpoint = args.at(-1), isMain = endpoint.includes("/70/") || endpoint.includes("event=push") || endpoint.includes(`head_sha=${mainSha}`);
        const available = isMain ? items : items.filter(x => x.leg === "macos-latest");
        const body = endpoint.includes("/jobs?") ? { total_count: jobs.length, jobs: isMain ? jobs : jobs.filter(j => j.name.includes("macos")) }
          : endpoint.includes("/artifacts?") ? { artifacts: available.map((item, i) => ({ id: i + 1, name: `suite-record-${item.leg}-${item.attempt}`, created_at: `2026-11-07T0${item.attempt + 1}:00:00Z` })) }
          : { total_count: 1, workflow_runs: [isMain ? main : lane] };
        return { status: 0, stdout: JSON.stringify(body) };
      }
      assert.equal(args[0], "run");
      const name = args[args.indexOf("--name") + 1], folder = args[args.indexOf("--dir") + 1];
      const item = items.find(item => name === `suite-record-${item.leg}-${item.attempt}`); assert(item);
      fs.mkdirSync(folder, { recursive: true }); fs.writeFileSync(path.join(folder, "record.json"), JSON.stringify(item.record)); return { status: 0 };
    };
    const records = readCiRecords([mainSha], { cwd: f.main, runGh, runGit: gitRunner, tempRoot: TEMP, writeLine: () => {} });
    assert.equal(proveCiSuite(records, [main], "win32").ok, mode === "green", mode);
    const report = mainCi({ cwd: f.main, env: {}, runGh, runGit: gitRunner, tempRoot: TEMP, writeLine: () => {} });
    assert.equal(report.red, mode !== "green", mode);
    const land = executeCi(f, [lane], { runGh, platform: "win32", keepLandCiRecords: () => ({ lines: [], notes: [] }) });
    assert.equal(land.code, mode === "green" ? 0 : 1, land.text); assert.equal(land.suiteRan, false, land.text);
    assert.equal(landGit(f.main, "rev-parse", "HEAD"), mode === "green" ? f.tip : mainSha);
  }
});
