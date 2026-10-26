/**
 * @module packages/nana-pack/tests/product-detail.test.mjs
 * @purpose Pin one-line Product deliverables and their owner-scoped detail blocks and artifact cards through the shipped renderer.
 * @inputs Report contract constants and caller-scoped temporary repositories.
 * @outputs Four named PASS/FAIL checks and a failing exit status on any broken contract.
 * @effects disk (temporary fixtures and pages), process (git and the tree checker).
 * @errors Case errors and timeouts become named failures.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { CASE_LIMIT_MS, withinCaseLimit, treeFixture, table, feature, stage, code, manual, park, page, commitCode, commitAt, artifactFlowLedger, renderHtmlAt } from "./report-fixtures.mjs";
import { DELIVERABLE_LINE_LABELS as L, DETAIL_HEADINGS as H, OVERVIEW_LABELS as O, NOT_MADE_BY_CODE, NOT_READ_BY_CODE, NO_ARTIFACT_NAMED, AGE_NOT_MEASURED_PREFIX } from "../../../scripts/product-report.mjs";
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const temp = tmpDir(path.join(os.tmpdir(), "product-detail-"));
let failures = 0;
async function check(title, action) {
  try { await withinCaseLimit(title, action); console.log("PASS", title); }
  catch (error) { failures++; console.log("FAIL", title, error.stack); }
}
const items = (view) => view.nodes.filter((node) => node.tag === "li" && node.attrs?.class?.split(" ").includes("deliverable"));
const blocks = (view) => view.nodes.filter((node) => node.attrs?.class === "deliverable-block");
// req: R-2930
await check("R-2930: a Product view deliverable is one line with its code marks, its readable reader kinds in claim order and its parked state, and no claim or artifact line", async () => {
  const ids = [1, 2, 3, 4, 5, 6].map((n) => `R-00${n}`);
  const fields = [`Deliverables: ${ids.join(", ")}`, ...code("R-001"), "Read by: R-001 · code: other.mjs",
    "Made by: R-002 · manual: owner makes it", "Read by: R-002 · rule: a rule reads it", "Read by: R-002 · person: owner reads it", park("R-002"),
    ...code("R-003"), park("R-003"), "Made by: R-004 · manual: owner makes it", "Read by: R-004 · code", "Read by: R-004 · bogus: x",
    ...manual("R-005"), "Parked: R-005 · owner holds it", "Made by: R-006 · suite: make.mjs", "Read by: R-006 ·code: read.mjs"];
  const ledger = stage("CAP-01", "First", fields) + "\n" + feature("FEAT-001", ids.map((id) => [id, "implemented"]));
  // These same cases exercise CRLF, trailing spaces/tabs and no final newline without another test.
  const repo = treeFixture(temp, "line", ledger.split("\n").map((line, i) => line + (i % 2 ? "\t" : "  ")).join("\r\n"));
  commitCode(temp, repo);
  commitAt(temp, repo, "other reader", "2026-01-03T00:00:00Z", { "other.mjs": "export {};\n" });
  const actual = items(renderHtmlAt(await page(temp, repo, "line"), "#product"));
  const marks = ` · ${NOT_MADE_BY_CODE} · ${NOT_READ_BY_CODE}`;
  const reader = (kind) => `${L.readBy} ${kind}`;
  const parts = [reader("code"), `${NOT_MADE_BY_CODE} · ${NOT_READ_BY_CODE} · ${reader("rule, person")} · ${O.parked}`, reader("code"), `${NOT_MADE_BY_CODE} · ${NOT_READ_BY_CODE} · ${L.noReader}`, `${NOT_MADE_BY_CODE} · ${NOT_READ_BY_CODE} · ${reader("person")}`, `${NOT_READ_BY_CODE} · ${L.noReader}`];
  assert.ok(marks);
  assert.deepEqual(actual.map((node) => node.textContent), ids.map((id, i) => `${id} · implemented · Home: FEAT-001 · FEAT-001 · ${parts[i]} · ${NO_ARTIFACT_NAMED}`));
  for (const item of actual) {
    const elements = item.children.filter((node) => node.tag);
    assert.deepEqual(elements.map((node) => [node.tag, node.attrs.href]), [["a", "#FEAT-001"]]);
    assert.ok(!/Made by:|Read by:/.test(item.textContent));
    assert.ok(!item.children.some((node) => node.tag === "ul" || node.tag === "p"));
  }
});
// req: R-2931
await check("R-2931: a Product view deliverable line ends with the largest day count of the artifacts it names, or why it has none", async () => {
  const ids = Array.from({ length: 9 }, (_, i) => `R-${101 + i}`);
  const names = ["A-001, A-002", "A-003", "A-004", "built from: A-001", null, "c.txt", "A-003, A-001", "A-005", "A-999"];
  const fields = [`Deliverables: ${ids.join(", ")}`, ...ids.flatMap((id, i) => [`Made by: ${id} · suite: make.mjs${names[i] ? ` · ${names[i]}` : ""}`, `Read by: ${id} · code: read.mjs`])];
  const entries = [["A-001", "tracked: a.txt"], ["A-002", "tracked: b.txt"], ["A-003", "user-home store: ~/store"], ["A-004", "tracked: absent.txt"], ["A-005", "tracked: h.txt"]].map(([id, location]) => `Artifact: ${id} · ${id} · ${location} · suite: make.mjs`);
  const repo = treeFixture(temp, "ages", stage("CAP-01", "First", fields) + "\n" + feature("FEAT-001", ids.map((id) => [id, "implemented"]), entries), undefined, "2020-01-01T00:00:00Z");
  commitAt(temp, repo, "code", "2020-01-01T00:00:00Z", { "make.mjs": "export {};\n", "read.mjs": "export {};\n" });
  commitAt(temp, repo, "b", "2020-01-22T00:00:00Z", { "b.txt": "b\n" });
  commitAt(temp, repo, "a", "2020-01-29T00:00:00Z", { "a.txt": "a\n" });
  commitAt(temp, repo, "c", "2020-01-31T00:00:00Z", { "c.txt": "c\n" });
  commitAt(temp, repo, "head", "2020-02-01T00:00:00Z", { "h.txt": "h\n" });
  const html = await page(temp, repo, "ages");
  const ends = ["10 days", O.notMeasured, O.unknown, L.outputOnly, NO_ARTIFACT_NAMED, "1 day", "3 days", "0 days", O.unknown];
  const actual = items(renderHtmlAt(html, "#product"));
  assert.equal(actual.length, ids.length);
  actual.forEach((node, i) => assert.ok(node.textContent.endsWith(` · ${ends[i]}`), node.textContent));
  const block = blocks(renderHtmlAt(html, "#FEAT-001")).find((node) => node.children[0].textContent.startsWith("R-101 · "));
  const line = block?.children.find((node) => node.attrs?.class === "deliverable-artifact" && node.textContent.startsWith("artifact A-002"));
  assert.equal(/and (\d+ days?) before HEAD/.exec(line?.textContent)?.[1], ends[0]);
  assert.ok(renderHtmlAt(html, "#FEAT-001").nodes.some((node) => node.tag === "p" && node.textContent.includes(`${AGE_NOT_MEASURED_PREFIX}user-home store`)));
});
// req: R-2932
await check("R-2932: a feature's detail view shows a Deliverables block per deliverable it homes in Product view order, then its Registered artifacts, before its requirement rows", async () => {
  const entry = (id) => `Artifact: ${id} · ${id} · user-home store: ~/${id} · suite: make.mjs`;
  const ledger = stage("CAP-01", "First", ["Deliverables: R-003, R-001, R-002", ...["R-003", "R-001", "R-002"].flatMap(code)]) + "\n" +
    feature("FEAT-001", [["R-001", "implemented"], ["R-003", "untested"]], [entry("A-002"), entry("A-001")]) + "\n" +
    ["## FEAT-002 · FEAT-002", "Purpose: keep grouped output.", "Status: active", "", "### SUB-001 · Group", "Purpose: group output.", "", table([["R-002", "implemented"]]).trimEnd()].join("\n") + "\n" +
    feature("FEAT-003", [["R-004", "implemented"]], ["Also applies: R-001"]) + "\n" + feature("FEAT-004", [["R-005", "implemented"]], [entry("A-003")]);
  const repo = treeFixture(temp, "sections", ledger);
  commitCode(temp, repo);
  const html = await page(temp, repo, "sections");
  const expected = [
    [["h3", H.deliverables], ["deliverable-block", "R-003 · untested · gap"], ["deliverable-block", "R-001 · implemented"], ["h3", H.artifacts], ["artifact-entry-card", "A-001 · A-001"], ["artifact-entry-card", "A-002 · A-002"], ["h3", "Requirements"]],
    [["h3", H.deliverables], ["deliverable-block", "R-002 · implemented"], ["h3", "Requirements"]],
    [["h3", "Requirements"]],
    [["h3", H.artifacts], ["artifact-entry-card", "A-003 · A-003"], ["h3", "Requirements"]],
  ];
  for (let i = 0; i < expected.length; i++) {
    const children = renderHtmlAt(html, `#FEAT-00${i + 1}`).root.children;
    const start = children.findIndex((node) => node.tag === "p" && node.textContent.startsWith("Shared rows:"));
    const end = children.findIndex((node) => node.tag === "h3" && node.textContent === "Requirements");
    assert.ok(start >= 0 && end > start);
    assert.deepEqual(children.slice(start + 1, end + 1).map((node) => node.tag === "article" ? [node.attrs.class, node.children[0]?.textContent] : [node.tag, node.textContent]), expected[i]);
    assert.ok(children.slice(start + 1, end).every((node) => node.tag === "h3" || node.tag === "article"));
    assert.ok(!children.slice(0, start).some((node) => node.attrs?.class === "deliverable-block" || node.attrs?.class === "artifact-entry-card"));
  }
});
// req: R-2933
await check("R-2933: the tree checker accepts a Reads line that names an entry a later capability registers", async () => {
  const repo = treeFixture(temp, "later-maker", artifactFlowLedger());
  const run = spawnSync(process.execPath, [path.join(ROOT, "scripts/requirements-tree.mjs"), "--root", repo.root], { cwd: ROOT, encoding: "utf8", timeout: CASE_LIMIT_MS });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, "");
});
process.exitCode = failures ? 1 : 0;
