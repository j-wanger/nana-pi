/**
 * @module packages/nana-pack/tests/test-packs-runner.test.mjs
 * @purpose Exercise real pack execution, conservative impact selection and locked complete-pack runs.
 * @inputs Real runner dependency closure and OS temporary git and test fixtures.
 * @outputs Awaited bounded must-meet PASS/FAIL lines.
 * @effects disk (OS temp only), process (runner and git children).
 * @errors Failed assertions set exit 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { check, execute, fixtureRoot, git, put, REPO, TEMP } from "./pack-fixtures.mjs";
import { readSuiteRecords } from "../lib/suite-records.mjs";
import { TEST_PACKS } from "../lib/test-packs-config.mjs";
import { selectPackFiles } from "../../../scripts/test-packs.mjs";
import { proveCiSuite } from "../lib/land-ci.mjs";

const land = "packages/probe/tests/land.test.mjs";
const caller = "packages/probe/tests/caller.test.mjs";
const launch = "packages/probe/tests/launch.test.mjs";
const changed = "packages/probe/tests/changed.test.mjs";
const blind = "packages/probe/tests/blind.test.mjs";
const idle = "packages/probe/tests/idle.test.mjs";
const header = file => `/**\n * @module ${file}\n * @purpose Fixture module.\n * @inputs none\n * @outputs PASS\n * @effects none\n * @errors none\n */\n`;
function selectionRoot(name) {
  const membership = { [land]: "land", [caller]: "module", [launch]: "module", [changed]: "module", [blind]: "module", [idle]: "module" };
  const files = Object.fromEntries(Object.keys(membership).map(f => [f, header(f) + 'console.log("PASS fixture");\n']));
  files[caller] = header(caller) + ['import', '{ value }', 'from', '"../lib/value.mjs"; console.log("PASS", value);\n'].join(" ");
  files[launch] = header(launch) + 'import { spawnSync } from "node:child_process"; spawnSync(process.execPath, [new URL("../lib/value.mjs", import.meta.url).pathname]); console.log("PASS launch");\n';
  files[blind] = header(blind) + 'import { spawnSync } from "node:child_process"; spawnSync(process.execPath, ["-e", process.env.PROBE_CODE || ""]); console.log("PASS blind");\n';
  files["packages/probe/lib/value.mjs"] = header("packages/probe/lib/value.mjs") + "export const value = 1;\n";
  files["code-map.config.json"] = JSON.stringify({ roots: ["packages/probe/lib", { path: "packages/probe/tests", layerExempt: true }], moduleExtensions: [".mjs"], layers: [{ id: "all", title: "All", blurb: "Fixture", match: ".*" }], packages: [{ id: "probe", prefix: "" }], mapPath: "map.md", ignore: [] });
  const root = fixtureRoot(name, files, membership);
  git(root, "init", "-b", "main"); git(root, "config", "user.email", "fixture@example.invalid"); git(root, "config", "user.name", "Fixture");
  git(root, "add", "."); git(root, "commit", "-m", "base");
  return { root, membership };
}
// req: R-3851
await check("M2: pack execution selects exact land and affected module paths with reasons", async () => {
  const { root } = selectionRoot("selection");
  const only = execute(root, ["--pack=land"]);
  assert.equal(only.status, 0, only.out); assert.deepEqual(only.record.files.map(f => f.path), [land]);
  put(root, "packages/probe/lib/value.mjs", header("packages/probe/lib/value.mjs") + "export const value = 2;\n");
  git(root, "add", "."); git(root, "commit", "-m", "module");
  const r = execute(root, ["--pack=land,module", "--changed-from=main~1"]);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(r.record.files.map(f => f.path).sort(), [land, caller, launch, blind].sort());
  for (const [file, reason] of [[caller, "caller"], [launch, "caller"], [blind, "blind reach"]]) {
    assert(r.out.split("\n").some(line => line.includes(file) && line.includes(reason)), r.out);
  }
  put(root, changed, header(changed) + 'console.log("PASS edited");\n'); git(root, "add", "."); git(root, "commit", "-m", "test");
  const edited = execute(root, ["--pack=land,module", "--changed-from=HEAD~1"]);
  assert(edited.record.files.some(f => f.path === changed)); assert.match(edited.out, /changed test/);
  for (const text of ["# input\r\n", "# input \t\n", "# input"]) {
    put(root, "packages/nana-pack/prompts/probe.md", text); git(root, "add", "."); git(root, "commit", "-m", "text reader");
    const watched = execute(root, ["--pack=land,module", "--changed-from=HEAD~1"]);
    assert.equal(watched.status, 0, watched.out); assert.equal(watched.record.files.length, 6); assert.match(watched.out, /watch glob/);
  }
  put(root, "packages/probe/tests/unassigned.test.mjs", 'console.log("PASS must not run");');
  const unknown = execute(root, ["--pack=land"]); assert.equal(unknown.status, 1); assert.match(unknown.out, /unassigned\.test\.mjs/);
});
// req: R-3852
await check("M3: unreadable diffs graph errors and policy changes run all module files", async () => {
  const { root, membership } = selectionRoot("failsafe");
  const { selectPackFiles } = await import("../../../scripts/test-packs.mjs");
  const files = Object.keys(membership);
  const allModules = files.filter(f => membership[f] === "module");
  for (const options of [
    { readDiff: () => { throw new Error("diff unavailable"); } },
    { readDiff: () => ["packages/probe/lib/value.mjs"], makeGraph: () => { throw new Error("graph unavailable"); } },
    ...["scripts/test.mjs", "scripts/test-packs.mjs", "packages/nana-pack/lib/test-packs-config.mjs", "packages/nana-pack/lib/test-runner-config.mjs", "package.json", "code-map.config.json"].map(file => ({ readDiff: () => [file] })),
  ]) {
    const selected = await selectPackFiles({ root, files, packs: ["land", "module"], changedFrom: "main", membership, ...options });
    assert.deepEqual(selected.files.sort(), files.sort()); assert(selected.selection.failSafe);
    assert.deepEqual(selected.selection.module.map(f => f.path).sort(), allModules.sort());
    assert(selected.selection.module.every(f => f.reasons.some(reason => reason.includes("fail-safe"))));
  }
  const bad = execute(root, ["--pack=land,module", "--changed-from=missing-ref"]);
  assert.equal(bad.status, 0, bad.out); assert.equal(bad.record.files.length, files.length); assert.match(bad.out, /fail-safe.*diff/);
});
// req: R-3851
// req: R-3853
await check("M11: acceptance-win-cmd replay selects edited release tests and release import callers", async () => {
  // Frozen name-only diff of 59e7d598; replay without requiring that commit in shallow CI clones.
  const replay = ["REQUIREMENTS.md", "docs/code-map.md", "docs/requirements-tree.md",
    ...["evidence.md", "map-check.log", "map.log", "native.log", "readme.log", "release-tests.log", "touched-tests.log", "trace.log", "tree.log", "wrong-code.log"].map(f => `docs/reviews/acceptance-win-cmd/${f}`),
    "packages/nana-pack/tests/template-acceptance.test.mjs", "packages/nana-pack/tests/template-release.test.mjs", "scripts/template-acceptance.mjs"];
  const files = Object.keys(TEST_PACKS).filter(f => f.endsWith(".test.mjs"));
  const edited = replay.filter(f => files.includes(f));
  for (const diff of [replay, ["packages/nana-pack/tests/template-release.test.mjs"], ["scripts/template-release.mjs"], ["packages/nana-pack/lib/release-status.mjs"]]) {
    const selected = await selectPackFiles({ root: REPO, files, packs: ["land", "module"], changedFrom: "main", readDiff: () => diff });
    assert.equal(selected.selection.failSafe, null);
    for (const file of edited.filter(f => diff.includes(f))) {
      assert(selected.files.includes(file), `edited test omitted: ${file}`);
      assert.deepEqual(selected.selection.changedTests.find(item => item.path === file)?.reasons, ["changed test"]);
    }
    assert(selected.packs.includes("release"), `release omitted for ${diff.join(",")}`);
    assert(files.filter(f => TEST_PACKS[f] === "release").every(f => selected.files.includes(f)));
  }
});
// req: R-3851
await check("M12: ci-wait replay selects and proves the edited main-pack test", async () => {
  const edited = "packages/nana-pack/tests/ci-wait.test.mjs";
  const files = Object.keys(TEST_PACKS).filter(f => f.endsWith(".test.mjs"));
  const selected = await selectPackFiles({ root: REPO, files, packs: ["land", "module"], changedFrom: "main", readDiff: () => ["packages/nana-pack/lib/ci-wait.mjs", edited] });
  assert.equal(selected.selection.failSafe, null);
  assert(selected.files.includes(edited), `edited test omitted: ${edited}`);
  assert.deepEqual(selected.selection.changedTests, [{ path: edited, reasons: ["changed test"] }]);
  const run = { id: 71, run_attempt: 1 };
  const record = { filters: [], platform: process.platform, exitCode: 0,
    packRun: { complete: true, packs: selected.packs, selection: selected.selection },
    files: selected.files.map(path => ({ path, label: "PASS", seconds: 0 })) };
  const proof = record => proveCiSuite({ code: 0, parsed: [{ run, leg: "macos-latest", attempt: 1, record }], problems: [] }, [run], process.platform);
  assert.equal(proof(record).ok, true);
  const missing = { ...record, files: record.files.filter(f => f.path !== edited) };
  assert.equal(proof(missing).ok, false, "reader accepted an omitted edited main test");
  assert.equal(proof({ ...record, files: record.files.map(f => f.path === edited ? { ...f, label: "FAIL" } : f) }).ok, false);
});
// req: R-3858
await check("M9: complete-pack locked runs serialize retain records and path filters bypass", async () => {
  const { root } = selectionRoot("locked");
  const lock = path.join(root, "machine.lock"), events = path.join(root, "events"), fixture = path.join(root, "suite.mjs");
  put(root, "suite.mjs", `import fs from "node:fs";
const event = s => fs.appendFileSync(process.env.EVENTS, s + "\\n");
event(fs.existsSync(process.env.NANA_SUITE_LOCK_DIR) ? "start locked" : "start unlocked");
await new Promise(r => setTimeout(r, 300));
event("end");
if (process.env.NANA_SUITE_RECORD_FILE) fs.writeFileSync(process.env.NANA_SUITE_RECORD_FILE, JSON.stringify({schema:1,filters:[],packRun:{packs:["land"],complete:true,selection:{module:[]}},files:[{path:"fixture.test.mjs",label:"PASS",seconds:0}],exitCode:0,wallSeconds:1,jobs:1,platform:process.platform}));
console.log("PASS fixture");\n`);
  const env = { ...process.env, NANA_SUITE_LOCK_DIR: lock, NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, fixture]), EVENTS: events };
  const run = args => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(REPO, "scripts/test-locked.mjs"), ...args], { cwd: root, env, stdio: "pipe" });
    let out = ""; child.stdout.on("data", b => { out += b; }); child.stderr.on("data", b => { out += b; });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("locked child limit")); }, 30000);
    child.once("error", reject); child.once("close", code => { clearTimeout(timer); resolve({ code, out }); });
  });
  const results = await Promise.all([run(["--pack=land"]), run(["--pack=land,module"])]);
  assert(results.every(r => r.code === 0), JSON.stringify(results));
  assert.deepEqual(fs.readFileSync(events, "utf8").trim().split("\n"), ["start locked", "end", "start locked", "end"]);
  assert.equal(readSuiteRecords({ root }).length, 2); assert(!fs.existsSync(lock));
  fs.mkdirSync(lock); fs.writeFileSync(path.join(lock, "pid"), String(process.pid));
  const filtered = await run(["--pack=land", "needle"]);
  assert.equal(filtered.code, 0, filtered.out); assert(fs.existsSync(lock));
  assert.equal(readSuiteRecords({ root }).length, 2);
  fs.rmSync(lock, { recursive: true });
});
