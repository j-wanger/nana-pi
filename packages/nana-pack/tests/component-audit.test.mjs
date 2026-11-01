#!/usr/bin/env node
/**
 * @module packages/nana-pack/tests/component-audit.test.mjs
 * @purpose Pins component audit validation, evidence, activity, asks, staleness and mapped coverage.
 * @inputs Component audit modules and temporary repository fixtures.
 * @outputs PASS/FAIL lines and nonzero exit for a failed contract.
 * @effects disk (OS temporary fixtures only)
 * @errors A failed assertion exits 1.
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { checkComponentData } from "../../../scripts/component-contract.mjs";
import { ASK_LABELS, parseAskBody } from "../lib/ask-shape.mjs";
import { ACTIVITY_WINDOW_DAYS, AUDIT_PATH, CONTRACT_PATH, STALE_COMMIT_LIMIT } from "../../../scripts/component-audit-config.mjs";
import { buildAudit, main } from "../../../scripts/component-audit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let passed = 0;
const CASE_LIMIT_MS = 20_000;
async function test(title, fn) {
  let timer;
  try {
    await Promise.race([fn(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`case exceeded ${CASE_LIMIT_MS} ms`)), CASE_LIMIT_MS); })]);
    passed++; console.log("PASS", title);
  } catch (error) { console.log("FAIL", title, error.stack ?? error.message); process.exitCode = 1; }
  finally { clearTimeout(timer); }
}
const temp = () => fs.mkdtemp(path.join(os.tmpdir(), "nana-component-audit-"));
const git = (root, args, options = {}) => spawnSync("git", args, { cwd: root, encoding: "utf8", ...options });
const run = (root, args, options = {}) => { const result = git(root, args, options); assert.equal(result.status, 0, result.stderr); return result.stdout.trim(); };
const initRepo = async (root) => { run(root, ["init", "-b", "main"]); run(root, ["config", "user.name", "Fixture"]); run(root, ["config", "user.email", "fixture@example.invalid"]); };
const commit = (root, message, date) => { run(root, ["add", "."]); run(root, ["commit", "-m", message], { env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } }); return run(root, ["rev-parse", "HEAD"]); };
const statusGit = (root, args) => ({ status: 0, stdout: args[0] === "show" ? "1793232000" : args[0] === "rev-parse" ? "a2ad3f2121ae96aa0eb6e70d12d060d5918714c7" : args[0] === "rev-list" ? "0" : "", stderr: "" });

// req: R-3100
await test("R-3100: check passes tracked source and names each missing component path", async () => {
  const real = await buildAudit({ root: ROOT, mappedModules: [] });
  assert.deepEqual(real.problems, [], real.problems.join("\n"));
  const root = await temp();
  try {
    const data = structuredClone(real.source);
    data.components[0].parts[0] = "renamed-part.mjs";
    data.components[0].evidence[0] = "renamed-evidence.mjs";
    await fs.writeFile(path.join(root, "nana-pi.json"), JSON.stringify(data));
    const result = await buildAudit({ root, sourcePath: "nana-pi.json", allowMissingGitHistory: true, mappedModules: [], trackedPaths: [] });
    assert.ok(result.problems.some((line) => line.includes(`${data.components[0].id}`) && line.includes("renamed-part.mjs")));
    assert.ok(result.problems.some((line) => line.includes(`${data.components[0].id}`) && line.includes("renamed-evidence.mjs")));
    let output = "";
    const code = await main(["--check"], { root, source: data, mappedModules: [], trackedPaths: [], stdout: { write: (text) => { output += text; } } });
    assert.equal(code, 1);
    assert.ok(output.includes(`${data.components[0].id}: cited path is not tracked at HEAD (renamed-part.mjs)`));
    assert.ok(output.includes(`${data.components[0].id}: cited path is not tracked at HEAD (renamed-evidence.mjs)`));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

// req: R-3101
await test("R-3101: unknown feature and evidence IDs are named", async () => {
  const base = await buildAudit({ root: ROOT, mappedModules: [] });
  const result = await buildAudit({ root: ROOT, mappedModules: [], source: { contract: "nana-components", version: 1, project: "nana-pi", components: [{ ...base.source.components[0], features: ["FEAT-999"], evidence: ["R-9999"] }] } });
  assert.ok(result.problems.some((line) => line.includes("FEAT-999")));
  assert.ok(result.problems.some((line) => line.includes("R-9999")));
});

// req: R-3102
await test("R-3102: frozen contract accepts fixture and names schema-rule violations", async () => {
  const contract = JSON.parse(await fs.readFile(path.join(ROOT, "docs/components/contract.json"), "utf8"));
  const fixture = JSON.parse(await fs.readFile(path.join(ROOT, "docs/components/fixture.json"), "utf8"));
  assert.deepEqual(checkComponentData(fixture, contract), []);
  const cases = [
    [d => { delete d.project; }, "project"], [d => { d.components[0].kind = "other"; }, "kind"],
    [d => { d.components[0].status = "unknown"; }, "status"], [d => { d.version++; }, "version"],
    [d => { d.components[1].id = d.components[0].id; }, "id"],
    [d => { d.components[0].status = "absent"; }, "parts"],
    [d => { d.components[0].status = "partial"; d.components[0].gap = null; }, "gap"],
    [d => { d.components[0].ask = { question: "a", default: "b", gains: "c", cost: "d", otherwise: "e" }; }, "ask"],
    [d => { d.components[0].features[0].implemented = d.components[0].features[0].rows + 1; }, "implemented"],
    [d => { d.components[0].activity.recentCommits = -1; }, "activity"],
  ];
  for (const [mutate, field] of cases) { const copy = structuredClone(fixture); mutate(copy); assert.ok(checkComponentData(copy, contract).some((line) => line.includes(field)), field); }
});

// req: R-3103
await test("R-3103: derived feature values come from ledger and hand source cannot prefill them", async () => {
  const ledgerText = `## FEAT-003 · Fixture feature\nPurpose: Test derived counts.\nStatus: active\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-9001 | One. | implemented | test |\n| R-9002 | Two. | untested | test |\n| R-9003 | Three. | implemented | test |\n`.replaceAll("\n", "\r\n").replace("| R-9003 | Three. | implemented | test |\r\n", "| R-9003 | Three. | implemented | test | \t\r\n").replace(/\r\n$/, "");
  const source = { contract: "nana-components", version: 1, project: "nana-pi", components: [{ id: "fixture", name: "Fixture", metaphor: "A fixture", kind: "workflow", parts: ["packages/nana-pack/bin/pi-worker.mjs"], features: ["FEAT-003"], status: "sound", gap: null, ask: null, evidence: ["packages/nana-pack/bin/pi-worker.mjs"], auditedAt: run(ROOT, ["rev-parse", "HEAD"]), anchors: [] }] };
  const result = await buildAudit({ root: ROOT, source, ledgerText, trackedPaths: ["packages/nana-pack/bin/pi-worker.mjs"], mappedModules: [] });
  assert.deepEqual(result.problems, []);
  const feature = result.document.components[0].features[0];
  assert.deepEqual(feature, { id: "FEAT-003", label: "Fixture feature", rows: 3, implemented: 2 });
  assert.ok(result.source.components.every((item) => !Object.hasOwn(item, "activity") && item.features.every((featureId) => typeof featureId === "string")));
  const withActivity = structuredClone(source);
  withActivity.components[0].activity = { recentCommits: 1, inFlight: 0 };
  const rejected = await buildAudit({ root: ROOT, source: withActivity, ledgerText, trackedPaths: ["packages/nana-pack/bin/pi-worker.mjs"], mappedModules: [] });
  assert.ok(rejected.problems.some((line) => line.includes("fixture") && line.includes("keys")));
});

// req: R-3104
await test("R-3104: activity counts recent first-parent changes and unmerged feature refs", async () => {
  const root = await temp();
  try {
    await initRepo(root);
    await fs.writeFile(path.join(root, "part.txt"), "old\n");
    commit(root, "old", "2020-01-01T00:00:00Z");
    await fs.writeFile(path.join(root, "other.txt"), "other\n");
    commit(root, "unrelated", "2026-10-25T00:00:00Z");
    await fs.writeFile(path.join(root, "part.txt"), "recent\n");
    commit(root, "recent", "2026-10-28T00:00:00Z");
    run(root, ["checkout", "-b", "feat/open"]);
    await fs.writeFile(path.join(root, "part.txt"), "branch\n");
    commit(root, "branch change", "2026-10-29T00:00:00Z");
    run(root, ["update-ref", "refs/remotes/origin/feat/open", "HEAD"]);
    const source = { contract: "nana-components", version: 1, project: "nana-pi", components: [{ id: "fixture", name: "Fixture", metaphor: "A fixed activity fixture", kind: "workflow", parts: ["part.txt"], features: [], status: "sound", gap: null, ask: null, evidence: ["part.txt"], auditedAt: run(root, ["rev-parse", "HEAD"]), anchors: [] }] };
    const counts = await buildAudit({ root, source, parts: ["part.txt"], windowDays: ACTIVITY_WINDOW_DAYS, mappedModules: [], trackedPaths: ["part.txt"] });
    assert.equal(counts.activity.recentCommits, 2);
    assert.equal(counts.activity.inFlight, 1);
    run(root, ["checkout", "main"]);
    run(root, ["merge", "--no-ff", "feat/open", "-m", "merge feature"]);
    const merged = await buildAudit({ root, source, parts: ["part.txt"], windowDays: ACTIVITY_WINDOW_DAYS, mappedModules: [], trackedPaths: ["part.txt"] });
    assert.equal(merged.activity.inFlight, 0);
    run(root, ["branch", "-m", "main", "trunk"]);
    const withoutMain = await buildAudit({ root, source, parts: ["part.txt"], windowDays: ACTIVITY_WINDOW_DAYS, mappedModules: [], trackedPaths: ["part.txt"] });
    assert.ok(withoutMain.activity.recentCommits > 0, "HEAD history still contributes activity");
    assert.ok(withoutMain.lines.includes("activity: unmerged feature comparison skipped (local main unavailable)"));
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

// req: R-3105
await test("R-3105: tracked audit has workflow and governance homes", async () => {
  const { source } = await buildAudit({ root: ROOT, mappedModules: [] });
  assert.ok(source.components.some((item) => item.kind === "workflow" && item.parts.length));
  assert.ok(source.components.some((item) => item.kind === "governance" && item.parts.length));
});

// req: R-3106
await test("R-3106: asks round-trip through planner labels and identity scan", async () => {
  const { asks, source } = await buildAudit({ root: ROOT, mappedModules: [] });
  const components = source.components.filter((item) => item.ask);
  assert.equal(asks.length, components.length);
  for (let index = 0; index < components.length; index++) {
    const [title, ...body] = asks[index].trim().split("\n");
    assert.ok(title.includes(components[index].name));
    assert.ok(title.split(/\s+/).length < 25);
    assert.equal(body.length, 5);
    for (const label of Object.values(ASK_LABELS).slice(0, 5)) assert.ok(body.some((line) => line.startsWith(`${label}:`)), label);
    const expected = components[index].ask;
    assert.deepEqual(parseAskBody(body.join("\n")).groups[0], { question: expected.question, default: expected.default, gains: expected.gains, cost: expected.cost, otherwise: expected.otherwise });
  }
  let cliOutput = "";
  const cliCode = await main(["--asks"], { root: ROOT, mappedModules: [], stdout: { write: (text) => { cliOutput += text; } } });
  assert.equal(cliCode, 0);
  assert.equal(cliOutput, `${asks.join("\n\n")}\n\n`);
  assert.match(components[0].ask.default, /searched, reviewed store/i);
  assert.match(components[0].ask.gains, /searched.*misses.*printed index/i);
  assert.match(components[0].ask.cost, /^(easy|hard) to undo:/i);
  assert.match(components[0].ask.default, /memory MCP tools as prior art/i);
  const scanned = spawnSync("node", [path.join(ROOT, "scripts/identity-scan.mjs"), "--stdin", "--root", ROOT], { input: cliOutput, encoding: "utf8" });
  assert.equal(scanned.status, 0, scanned.stdout + scanned.stderr);
  const emptySource = structuredClone(source);
  for (const item of emptySource.components) item.ask = null;
  let emptyOutput = "";
  const emptyExit = await main(["--asks"], { root: ROOT, source: emptySource, mappedModules: [], stdout: { write: (text) => { emptyOutput += text; } } });
  assert.equal(emptyOutput, "");
  assert.equal(emptyExit, 0);
});

// req: R-3107
await test("R-3107: sealed audit values retain provenance", async () => {
  const config = await fs.readFile(path.join(ROOT, "scripts/component-audit-config.mjs"), "utf8");
  assert.equal(ACTIVITY_WINDOW_DAYS, 14);
  assert.equal(STALE_COMMIT_LIMIT, 20);
  assert.equal(AUDIT_PATH, "docs/components/nana-pi.json");
  assert.equal(CONTRACT_PATH, "docs/components/contract.json");
  for (const value of ["ACTIVITY_WINDOW_DAYS", "STALE_COMMIT_LIMIT", "AUDIT_PATH", "CONTRACT_PATH"]) assert.match(config, new RegExp(`(?:chosen|contract|measured)[^\\n]*\\nexport const ${value}`, "i"));
});

// req: R-3108
await test("R-3108: status and anchor rules name the component, rule and anchor", async () => {
  const source = JSON.parse(await fs.readFile(path.join(ROOT, "docs/components/nana-pi.json"), "utf8"));
  const options = { root: ROOT, mappedModules: [], gitRunner: statusGit, trackedPaths: source.components.flatMap((item) => [...item.parts, ...item.evidence.filter((value) => !/^(?:R-\\d{3,4}|G-\\d{3}|FEAT-\\d{3}|CAP-\\d{2})$/.test(value))]) };
  const cases = [
    (copy, item) => { item.anchors = ["measured 2026-10-29: test"]; return ["sound", "measured"]; },
    (copy, item) => { item.features = ["FEAT-038"]; return ["planned or violated", "FEAT-038"]; },
    (copy, item) => { item.status = "partial"; item.gap = "Some support is missing."; return ["partial", "anchors"]; },
    (copy, item) => { item.status = "gap"; item.gap = "A need remains."; item.anchors = ["measured 2026-10-29: test"]; item.ask = null; return ["gap", "ask"]; },
    (copy, item) => { item.anchors = ["docs/known-bugs/FEAT-039.md:1"]; return ["known-bug", "docs/known-bugs/FEAT-039.md:1"]; },
    (copy, item) => { item.anchors = ["R-2800"]; return ["row anchor", "R-2800"]; },
    (copy, item) => { item.status = "gap"; item.gap = "A need remains."; item.ask = { question: "Q", default: "D", gains: "G", cost: "C", otherwise: "O" }; item.anchors = ["measured 2026-10-29 malformed"]; return ["measured anchor", "measured 2026-10-29 malformed"]; },
  ];
  for (const mutate of cases) {
    const copy = structuredClone(source);
    const item = copy.components.find((entry) => entry.status === "sound");
    const [rule, anchor] = mutate(copy, item);
    const result = await buildAudit({ ...options, source: copy });
    assert.ok(result.problems.some((line) => line.includes(item.id) && line.includes(rule) && line.includes(anchor)), result.problems.join("\\n"));
  }
  const rowSource = structuredClone(source);
  const rowComponent = rowSource.components.find((entry) => entry.id === "library");
  rowComponent.status = "gap"; rowComponent.gap = "A need remains."; rowComponent.ask = { question: "Q", default: "D", gains: "G", cost: "C", otherwise: "O" };
  rowComponent.anchors = ["R-2933"];
  const rowResult = await buildAudit({ ...options, source: rowSource });
  assert.ok(rowResult.problems.some((line) => line.includes("library") && line.includes("row anchor") && line.includes("R-2933")), rowResult.problems.join("\n"));
  const tracked = await buildAudit({ root: ROOT, mappedModules: [] });
  assert.deepEqual(tracked.problems, [], tracked.problems.join("\n"));
  const root = await temp();
  try {
    const anchors = ["docs/known-bugs/FEAT-039.md:1", "docs/known-bugs/FEAT-038.md:1", "docs/known-bugs/FEAT-037.md:1"];
    const contents = ["- CRLF\r\n", "- trailing space \t", "- no final newline"];
    const files = [];
    for (let index = 0; index < anchors.length; index++) {
      const relative = anchors[index].split(":")[0];
      await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true });
      await fs.writeFile(path.join(root, relative), contents[index]); files.push(relative);
    }
    const source = { contract: "nana-components", version: 1, project: "nana-pi", components: anchors.map((anchor, index) => ({ id: `anchor-${index}`, name: "Anchor", metaphor: "A real bullet", kind: "workflow", parts: ["part.txt"], features: [], status: "partial", gap: "A checkable issue remains.", ask: null, evidence: ["AGENTS.md"], auditedAt: "a2ad3f2121ae96aa0eb6e70d12d060d5918714c7", anchors: [anchor] })) };
    const result = await buildAudit({ root, source, mappedModules: [], gitRunner: statusGit, trackedPaths: [...files, "part.txt", "AGENTS.md"] });
    assert.deepEqual(result.problems, []);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

// req: R-3109
await test("R-3109: stale age is report-only, limit is inclusive, non-ancestor fails", async () => {
  const root = await temp();
  try {
    await initRepo(root);
    await fs.writeFile(path.join(root, "part.txt"), "one\n");
    const auditedAt = commit(root, "start", "2026-10-01T00:00:00Z");
    let latest = auditedAt;
    let atLimit = auditedAt;
    for (let i = 0; i < STALE_COMMIT_LIMIT + 1; i++) { await fs.writeFile(path.join(root, "part.txt"), `${i}\n`); latest = commit(root, `change ${i}`, `2026-10-02T00:00:${String(i).padStart(2, "0")}Z`); if (i === 0) atLimit = latest; }
    const result = await buildAudit({ root, mappedModules: [], source: { contract: "nana-components", version: 1, project: "nana-pi", components: [{ id: "part", name: "Part", metaphor: "A part", kind: "workflow", parts: ["part.txt"], features: [], status: "sound", gap: null, ask: null, evidence: ["part.txt"], auditedAt, anchors: [] }] } });
    assert.ok(result.lines.some((line) => line.startsWith("stale: part") && line.includes(String(STALE_COMMIT_LIMIT + 1))));
    assert.equal(result.exitCode, 0, result.problems.join("\n"));
    const atLimitResult = await buildAudit({ root, mappedModules: [], source: { contract: "nana-components", version: 1, project: "nana-pi", components: [{ id: "part", name: "Part", metaphor: "A part", kind: "workflow", parts: ["part.txt"], features: [], status: "sound", gap: null, ask: null, evidence: ["part.txt"], auditedAt: atLimit, anchors: [] }] } });
    assert.ok(!atLimitResult.lines.some((line) => line.startsWith("stale: part")));
    const invalid = await buildAudit({ root, mappedModules: [], source: { contract: "nana-components", version: 1, project: "nana-pi", components: [{ id: "part", name: "Part", metaphor: "A part", kind: "workflow", parts: ["part.txt"], features: [], status: "sound", gap: null, ask: null, evidence: ["part.txt"], auditedAt: "0".repeat(40), anchors: [] }] } });
    assert.ok(invalid.problems.some((line) => line.includes("part") && line.includes("ancestor")));
    const unreadable = await buildAudit({ root: ROOT, mappedModules: [], trackedPaths: ["AGENTS.md"], gitRunner: () => ({ status: 1, stderr: "history unavailable", stdout: "" }), source: { contract: "nana-components", version: 1, project: "nana-pi", components: [{ id: "missing-history", name: "Missing history", metaphor: "No history", kind: "workflow", parts: [], features: [], status: "absent", gap: "No parts exist.", ask: null, evidence: ["AGENTS.md"], auditedAt: "a2ad3f2121ae96aa0eb6e70d12d060d5918714c7", anchors: [] }] } });
    assert.equal(unreadable.lines.filter((line) => line.startsWith("stale:")).length, 1);
    assert.match(unreadable.lines.find((line) => line.startsWith("stale:")), /not measured/);
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});

// req: R-3110
await test("R-3110: mapped module coverage names unclaimed paths and never fails", async () => {
  const auditedAt = run(ROOT, ["rev-parse", "HEAD"]);
  const result = await buildAudit({ root: ROOT, trackedPaths: ["a.mjs"], mappedModules: ["a.mjs", "b.mjs", "c.mjs"], source: { contract: "nana-components", version: 1, project: "nana-pi", components: [{ id: "one", name: "One", metaphor: "One", kind: "workflow", parts: ["a.mjs"], features: [], status: "sound", gap: null, ask: null, evidence: ["a.mjs"], auditedAt, anchors: [] }] } });
  assert.ok(result.lines.includes("unclaimed: b.mjs"));
  assert.ok(result.lines.includes("unclaimed: c.mjs"));
  assert.ok(result.lines.includes("unclaimed: 2 of 3 mapped modules"));
  const filtered = await buildAudit({ root: ROOT, trackedPaths: ["a.mjs"], mappedModules: ["a.mjs", "packages/nana-pack/tests/example.test.mjs", "packages/nana-pack/tests/fixture-helper.mjs", "scripts/product.mjs"], source: { contract: "nana-components", version: 1, project: "nana-pi", components: [{ id: "one", name: "One", metaphor: "One", kind: "workflow", parts: ["a.mjs"], features: [], status: "sound", gap: null, ask: null, evidence: ["a.mjs"], auditedAt, anchors: [] }] } });
  assert.ok(!filtered.lines.some((line) => line.includes("packages/nana-pack/tests/")));
  assert.ok(filtered.lines.includes("unclaimed: scripts/product.mjs"));
  assert.ok(filtered.lines.includes("unclaimed: 1 of 2 mapped modules"));
  assert.equal(result.exitCode, 0, result.problems.join("\n"));
});

if (!process.exitCode) console.log(`${passed} component-audit checks passed`);
