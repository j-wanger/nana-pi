/**
 * @module packages/nana-pack/tests/product-overview.test.mjs
 * @purpose Pin the product report Overview's routing, counts, missing inputs and artifact ages through its shipped renderer.
 * @inputs Report contract constants and caller-scoped temporary repositories.
 * @outputs Nine named PASS/FAIL checks and a failing exit status on any broken contract.
 * @effects disk (temporary fixtures and pages), process (git and the tree checker).
 * @errors Case errors and timeouts become named failures.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { CASE_LIMIT_MS, withinCaseLimit, treeFixture, table, makeAssessment, writeStore, writeRuntimeFile, commitAt, renderHtmlAt } from "./report-fixtures.mjs";
import { generateReport, OVERVIEW_BLOCKS, OVERVIEW_LABELS as L, STALE_AGE_DAYS, AGE_NOT_MEASURED_PREFIX, AGE_UNKNOWN_PREFIX, MEASURED_AT_TIP_PREFIX } from "../../../scripts/product-report.mjs";
import { TIP_DIGITS } from "../lib/land-config.mjs";
import { ARTIFACT_AGE_TABLE } from "../../../scripts/deliverables.mjs";
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const temp = tmpDir(path.join(os.tmpdir(), "product-overview-"));
let failures = 0;
async function check(title, action) {
  try { await withinCaseLimit(title, action); console.log("PASS", title); }
  catch (error) { failures++; console.log("FAIL", title, error.stack); }
}
const feature = (id, rows, extra = [], status = "active") => [`## ${id} · ${id}`, "Purpose: keep output.", `Status: ${status}`, ...extra, "", table(rows).trimEnd()].join("\n");
const stage = (id, label, fields = [], kind = "product") => [`# ${id} · ${label}`, "Purpose: make output.", "Outcome: output exists.", ...(kind ? [`Kind: ${kind}`] : []), ...fields, ""].join("\n");
const basic = (kind = "product", fields = []) => stage("CAP-01", "First", fields, kind) + "\n" + feature("FEAT-001", [["R-001", "implemented"]]);
async function page(repo, name) {
  const out = path.join(temp, `${name}.html`);
  await generateReport({ root: repo.root, out });
  return fs.readFileSync(out, "utf8");
}
function blocks(view) {
  const result = [];
  for (const node of view.root.children) {
    if (node.tag === "h3") result.push({ heading: node, lines: [] });
    if (node.tag === "ul" && result.length) result.at(-1).lines.push(...node.children);
  }
  return result;
}
const lines = (view, index) => blocks(view)[index]?.lines.map((node) => node.textContent) ?? [];
function cli(repo) {
  const run = spawnSync(process.execPath, [path.join(ROOT, "scripts/requirements-tree.mjs"), "--root", repo.root], { cwd: ROOT, encoding: "utf8", timeout: CASE_LIMIT_MS });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trimEnd().split(/\r?\n/).slice(1);
}
const code = (id) => [`Made by: ${id} · suite: make.mjs`, `Read by: ${id} · code: read.mjs`];
const manual = (id) => [`Made by: ${id} · manual: owner makes it`, `Read by: ${id} · person: owner reads it`];
const park = (id) => `Parked: ${id} · since 2026-01-01: owner holds it`;
function commitCode(repo) { commitAt(temp, repo, "code", "2026-01-02T00:00:00Z", { "make.mjs": "export const made = true;\n", "read.mjs": "export const read = true;\n" }); }

// req: R-2920
await check("R-2920: the overview is the landing view and first tab, unknown and #shared hashes render it, and its five blocks come in order with links to their views", async () => {
  assert.deepEqual(OVERVIEW_BLOCKS, [["Needs you", "#decisions"], ["Broken", "#issues"], ["Gaps", "#product"], ["Stale", "#features"], ["What it does", "#product"]]);
  const repo = treeFixture(temp, "routing", basic());
  const html = await page(repo, "routing");
  for (const hash of ["", "#overview", "#shared", "#nope", "#constructor"]) {
    const view = renderHtmlAt(html, hash);
    assert.equal(view.nodes.find((node) => node.tag === "h2")?.textContent, "Overview");
    const nav = view.nodes.find((node) => node.tag === "nav");
    assert.deepEqual(nav.children.map((node) => node.textContent), ["Overview", "Decisions", "Product", "Artifacts", "Features", "Issues", "Requirements"]);
    assert.equal(nav.children[0].attrs["aria-current"], "page");
    assert.deepEqual(blocks(view).map(({ heading }) => [heading.textContent, heading.children.filter((n) => n.tag === "a").length, heading.children[0]?.attrs.href]), OVERVIEW_BLOCKS.map(([heading, href]) => [heading, 1, href]));
  }
});
// req: R-2921
await check("R-2921: Needs you counts asks as blocking, optional and parked, lists each blocking ask's title in file order, and counts the open questions the Decisions view lists", async () => {
  const handoff = ["# Handoff", "## Open for the owner", "- **[optional, since 2026-01-05] Opt.** body", "- **[optional, since 2026-01-06] Opt two.** body", "- **[Blocking, since 2026-02-01] Zeta.** body", "## Open for the second owner", "- **[parked, since 2026-01-03] Held.** body", "- **[blocking, since 2026-01-01] Alpha.** body"].join("\r\n");
  const ledger = basic() + "\n## Open questions\n1. Open one.  \n- (lane) Open bullet.\t\n## Closed questions\n2. (closed 2026-01-01) Done.\n## Deliberate omissions\n- An omission.";
  const repo = treeFixture(temp, "asks", ledger.replaceAll("\n", "\r\n"), handoff);
  const html = await page(repo, "asks");
  assert.deepEqual(lines(renderHtmlAt(html), 0), [`${L.asks}: 5 · ${L.blocking}: 2 · ${L.optional}: 2 · ${L.parked}: 1`, `${L.mustDecide}: Zeta · ${L.since} 2026-02-01`, `${L.mustDecide}: Alpha · ${L.since} 2026-01-01`, `${L.questions}: 2`]);
  const questions = renderHtmlAt(html, "#decisions").nodes.find((node) => node.attrs?.class === "open-questions");
  assert.equal(questions?.children.length, 2);
});
// req: R-2922
await check("R-2922: Broken names the violated rows and the implemented rows that did not pass, split into failed and skipped only, beside the rows with no recorded run and the runtime data's tip", async () => {
  let ledger = stage("CAP-01", "First") + "\n" + feature("FEAT-001", [["R-001", "violated"], ["R-002", "implemented"], ["R-003", "untested"], ["R-004", "implemented"], ["R-005", "implemented"], ["R-006", "untested"]]);
  const evidence = { "R-002": "f", "R-003": "f", "R-004": "s", "R-005": "n", "R-006": "n" };
  ledger = ledger.split("\n").map((line) => { const id = /^\| (R-\d+) /.exec(line)?.[1]; return evidence[id] ? line.replace("—", `\`tests/${evidence[id]}.test.mjs::case\``) : line; }).join("\n");
  const repo = treeFixture(temp, "broken", ledger);
  const tip = repo.git(["rev-parse", "HEAD"]).stdout.trim();
  writeRuntimeFile(repo.root, { schema: 1, hashes: {}, tests: { "tests/f.test.mjs": { label: "FAIL", seconds: 1, ran: [] }, "tests/s.test.mjs": { label: "SKIP", seconds: 0, ran: [] } }, tip, measuredAt: "2026-01-01T00:00:00Z" });
  const html = await page(repo, "broken");
  const actual = lines(renderHtmlAt(html), 1);
  assert.equal(actual[0], `${L.violated}: 1`);
  assert.equal(actual[1], "R-001");
  assert.ok(actual[2].startsWith(`${L.notPassed}: 2 · ${L.failed}: 1 · ${L.skippedOnly}: 1 · ${L.noRun}: 1 · ${MEASURED_AT_TIP_PREFIX} ${tip.slice(0, TIP_DIGITS)} on 2026-01-01T00:00:00.000Z`), actual[2]);
  assert.match(actual[2], /\d+ commits? and \d+ days? before HEAD$/);
  assert.equal(actual[3], "R-002, R-004");
  const ids = renderHtmlAt(html, "#issues").nodes.filter((node) => node.attrs?.class === "row-heading").map((node) => node.textContent.split(" ")[0]);
  assert.deepEqual(ids, ["R-001", "R-002", "R-004"]);
});
// req: R-2923
await check("R-2923: Gaps names the unparked deliverables code does not make and read and the artifacts with no declared reader, each beside its parked count, and counts the checker's notes", async () => {
  const fields = ["Deliverables: R-005, R-001, R-002, R-003, R-004", ...code("R-001"), ...manual("R-002"), ...manual("R-005"), ...manual("R-003"), park("R-003"), ...code("R-004"), park("R-004")];
  const entries = [5, 1, 2, 3, 4].map((n) => `Artifact: A-00${n} · item ${n} · other project: <project>/item${n} · manual: owner`);
  const ledger = stage("CAP-01", "First", fields) + "\n" + feature("FEAT-001", [1, 2, 3, 4, 5].map((n) => [`R-00${n}`, "implemented"]), [...entries, "Parked: A-003 · since 2026-01-01: owner holds it", "Read by: A-004 · person: owner reads it"]) + "\n" + feature("FEAT-002", [["R-007", "implemented"]], ["Reads: A-001 · read.mjs"]);
  const repo = treeFixture(temp, "gaps", ledger);
  commitCode(repo);
  const checker = cli(repo);
  const notes = checker.filter((line) => line.startsWith("deliverable note:")).length;
  assert.ok(notes > 0);
  assert.deepEqual(lines(renderHtmlAt(await page(repo, "gaps")), 2), [`${L.deliverableGaps}: 2 · ${L.parked}: 1 · ${L.notes}: ${notes}`, "R-005, R-002", `${L.artifactGaps}: 2 · ${L.parked}: 1`, "A-002, A-005"]);
});
// req: R-2924
await check("R-2924: Stale counts live features' out-of-date and unassessed assessments, and artifacts older than the stale age before HEAD's commit time, beside the not-measured and unknown counts", async () => {
  const runtimeKey = Object.keys(ARTIFACT_AGE_TABLE).find((key) => ARTIFACT_AGE_TABLE[key].writer === "scripts/runtime-measure.mjs");
  const extra = ["Artifact: A-001 · first · tracked: a.txt · manual: owner", "Artifact: A-002 · boundary · tracked: b.txt · manual: owner", "Artifact: A-003 · home · user-home store: ~/fixture · manual: owner", "Artifact: A-004 · missing · tracked: absent.txt · manual: owner", `Artifact: A-005 · runtime · clone store: ${runtimeKey} · land: scripts/runtime-measure.mjs`];
  const ledger = stage("CAP-01", "First") + "\n" + feature("FEAT-001", [["R-001", "implemented"]], extra) + "\n" + feature("FEAT-002", [["R-002", "implemented"]]) + "\n" + feature("FEAT-003", [], [], "proposed");
  const repo = treeFixture(temp, "stale", ledger, undefined, "2020-01-01T00:00:00Z");
  const first = commitAt(temp, repo, "artifacts", "2020-01-01T00:00:00Z", { "a.txt": "a\n", "b.txt": "b\n" });
  const assessment = makeAssessment(repo.root, first);
  writeStore(repo.root, [assessment]);
  commitAt(temp, repo, "boundary", "2020-01-02T00:00:00Z", { "b.txt": "changed\n" });
  commitAt(temp, repo, "head", "2020-02-01T00:00:00Z", { "REQUIREMENTS.md": ledger.replace("R-001 shall work.", "R-001 shall change.") });
  writeRuntimeFile(repo.root, { schema: 1, hashes: {}, tests: {}, tip: first, measuredAt: "2019-12-01T00:00:00Z" });
  const view = renderHtmlAt(await page(repo, "stale"));
  assert.deepEqual(lines(view, 3), [`${L.assessments}: 1 · ${L.unassessed}: 1`, "FEAT-001, FEAT-002", `${L.staleArtifacts}: 2 · ${L.notMeasured}: 1 · ${L.unknown}: 1`, `A-001 · first · ${STALE_AGE_DAYS + 1} days`, `A-005 · runtime · ${STALE_AGE_DAYS + 32} days`]);
  const linked = blocks(view)[3].lines[1].children.filter((node) => node.tag === "a").map((node) => node.attrs.href);
  assert.deepEqual(linked, ["#FEAT-001", "#FEAT-002"]);
  const ages = renderHtmlAt(await page(repo, "age-prefixes"), "#artifacts").nodes.filter((node) => node.tag === "p").map((node) => node.textContent);
  assert.ok(ages.some((text) => text.startsWith(`Age: ${AGE_NOT_MEASURED_PREFIX}`)) && ages.some((text) => text.startsWith(`Age: ${AGE_UNKNOWN_PREFIX}`)));
  const second = treeFixture(temp, "young", stage("CAP-01", "First") + "\n" + feature("FEAT-001", [["R-001", "implemented"]], [extra[0], extra[2], extra[3]]), undefined, "2020-01-01T00:00:00Z");
  commitAt(temp, second, "artifact", "2020-01-27T00:00:00Z", { "a.txt": "young\n" });
  commitAt(temp, second, "head", "2020-02-01T00:00:00Z", { "head.txt": "head\n" });
  const secondLines = lines(renderHtmlAt(await page(second, "young")), 3);
  assert.equal(secondLines[2], `${L.staleArtifacts}: 0 · ${L.notMeasured}: 1 · ${L.unknown}: 1`);
  assert.equal(secondLines.length, 3);
});
// req: R-2925
await check("R-2925: What it does shows the checker's count line and one line per live product stage whose counts add up to it", async () => {
  const ledger = stage("CAP-01", "First", ["Deliverables: R-001, R-002", ...code("R-001"), ...manual("R-002"), park("R-002")]) + "\n" + feature("FEAT-001", [["R-001", "implemented"], ["R-002", "implemented"]]) + "\n" + stage("CAP-02", "Second", ["Deliverables: R-003, R-004", ...manual("R-003"), ...code("R-004"), park("R-004")]) + "\n" + feature("FEAT-002", [["R-003", "implemented"], ["R-004", "implemented"]]) + "\n" + stage("CAP-03", "Constraint", ["Binds: CAP-01"], "constraint") + "\n" + feature("FEAT-003", [["R-005", "implemented"]]) + "\n" + stage("CAP-04", "Retired", ["Retired: CAP-01"]);
  const repo = treeFixture(temp, "stages", ledger);
  commitCode(repo);
  const expected = cli(repo).find((text) => text.startsWith("deliverables:"));
  assert.equal(expected, "deliverables: 2 of 3 made and read by code, 1 more parked");
  const actual = lines(renderHtmlAt(await page(repo, "stages")), 4);
  assert.deepEqual(actual, [expected, "CAP-01 · First: 1 of 1 made and read by code, 1 more parked", "CAP-02 · Second: 1 of 2 made and read by code"]);
  const sums = actual.slice(1).reduce((totals, text) => { const match = /: (\d+) of (\d+) made and read by code(?:, (\d+) more parked)?$/.exec(text); return totals.map((n, i) => n + Number(match[i + 1] ?? 0)); }, [0, 0, 0]);
  assert.deepEqual(sums, [2, 3, 1]);
});
// req: R-2927
await check("R-2927: with no runtime data, no artifact registry or no deliverable lines, each overview line that reads it names the missing input in place of a count", async () => {
  for (const [name, ledger] of [["kindless", basic("")], ["product-no-lines", basic("product", ["Deliverables: R-001"])]]) {
    const repo = treeFixture(temp, name, ledger);
    const html = await page(repo, name);
    const view = renderHtmlAt(html);
    const legend = renderHtmlAt(html, "#issues").nodes.find((node) => node.tag === "p" && node.textContent.includes("No recorded run anywhere"))?.textContent;
    const reason = /No recorded run anywhere in this report: (.*)\.$/.exec(legend)?.[1];
    assert.ok(reason);
    assert.deepEqual(lines(view, 1), [`${L.violated}: 0`, `${L.notPassed}: ${L.runtimeMissing}${reason}`]);
    assert.deepEqual(lines(view, 2), [`${L.deliverableGaps}: ${L.noDeliverables}`, `${L.artifactGaps}: no artifact registry`]);
    assert.equal(lines(view, 3).at(-1), `${L.staleArtifacts}: no artifact registry`);
    assert.deepEqual(lines(view, 4), [L.noDeliverables]);
  }
});
// req: R-2794
await check("R-2794: a capability card whose list has no item shows its label with none and no empty list", async () => {
  const ledger = basic("product", ["Deliverables: R-001", ...code("R-001")]) + "\n" + stage("CAP-02", "Constraint", ["Binds: CAP-01"], "constraint");
  const repo = treeFixture(temp, "empty-cards", ledger);
  commitCode(repo);
  const view = renderHtmlAt(await page(repo, "empty-cards"), "#product");
  const cards = view.root.children.filter((node) => node.tag === "article");
  assert.equal(cards.length, 2);
  for (const [index, label] of ["Features with no deliverable", "Artifacts of this constraint's features"].entries()) {
    assert.ok(cards[index].children.some((node) => node.tag === "p" && node.textContent === `${label}: none`));
    assert.ok(!cards[index].children.some((node) => node.attrs?.class === "capability-artifacts"));
  }
});
// req: R-2924
await check("seal: the overview's stale age is 30 days", async () => { assert.equal(STALE_AGE_DAYS, 30); });
process.exitCode = failures ? 1 : 0;
