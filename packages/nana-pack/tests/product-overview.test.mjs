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
import { CASE_LIMIT_MS, withinCaseLimit, treeFixture, table, makeAssessment, writeStore, writeRuntimeFile, commitAt, renderHtmlAt, feature, stage, code, manual, park, page as pageIn, commitCode as commitCodeIn } from "./report-fixtures.mjs";
import { generateReport, OVERVIEW_BLOCKS, OVERVIEW_LABELS as L, STALE_AGE_DAYS, AGE_NOT_MEASURED_PREFIX, AGE_UNKNOWN_PREFIX, MEASURED_AT_TIP_PREFIX, NEEDS_YOU_ASK_CAP } from "../../../scripts/product-report.mjs";
import { ASK_LABELS } from "../lib/ask-shape.mjs";
import { TIP_DIGITS } from "../lib/land-config.mjs";
import { ARTIFACT_AGE_TABLE } from "../../../scripts/deliverables.mjs";
const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const temp = tmpDir(path.join(os.tmpdir(), "product-overview-"));
let failures = 0;
async function check(title, action) {
  try { await withinCaseLimit(title, action); console.log("PASS", title); }
  catch (error) { failures++; console.log("FAIL", title, error.stack); }
}
const page = (...args) => pageIn(temp, ...args);
const commitCode = (...args) => commitCodeIn(temp, ...args);
const basic = (kind = "product", fields = []) => stage("CAP-01", "First", fields, kind) + "\n" + feature("FEAT-001", [["R-001", "implemented"]]);
function blocks(view) {
  const result = [];
  const visit = (parent) => {
    for (const node of parent.children ?? []) {
      if (node.tag === "h3") result.push({ heading: node, lines: [] });
      if (node.tag === "ul" && result.length) result.at(-1).lines.push(...node.children);
      visit(node);
    }
  };
  visit(view.root);
  const oldAssertions = ["Needs you", "Broken", "Gaps", "Stale", "What it does"];
  return result.sort((left, right) => oldAssertions.indexOf(left.heading.textContent) - oldAssertions.indexOf(right.heading.textContent));
}
const lines = (view, index) => blocks(view)[index]?.lines.map((node) => node.textContent) ?? [];
function cli(repo) {
  const run = spawnSync(process.execPath, [path.join(ROOT, "scripts/requirements-tree.mjs"), "--root", repo.root], { cwd: ROOT, encoding: "utf8", timeout: CASE_LIMIT_MS });
  assert.equal(run.status, 0, run.stderr);
  return run.stdout.trimEnd().split(/\r?\n/).slice(1);
}

// req: R-3050
// req: R-3081
await check("R-3050: Overview leads with What it does and Needs you, then closes Broken, Gaps and Stale in Records", async () => {
  assert.deepEqual(OVERVIEW_BLOCKS, [["What it does", "#product"], ["Needs you", "#decisions"], ["Broken", "#issues"], ["Gaps", "#product"], ["Stale", "#features"]]);
  const repo = treeFixture(temp, "routing", basic("product", ["Deliverables: R-001", ...code("R-001")]));
  const html = await page(repo, "routing");
  for (const hash of ["", "#overview", "#shared", "#nope", "#constructor"]) {
    const view = renderHtmlAt(html, hash);
    assert.equal(view.nodes.find((node) => node.tag === "h2")?.textContent, "Overview");
    const nav = view.nodes.find((node) => node.tag === "nav");
    assert.deepEqual(nav.children.map((node) => node.textContent), ["Overview", "Decisions", "Product", "Artifacts", "Features", "Issues", "Requirements"]);
    assert.equal(nav.children[0].attrs["aria-current"], "page");
    const details = view.root.children.find((node) => node.tag === "details");
    assert.equal(details.children[0].textContent, "Records: violated 0 · no recorded run · Gaps 0 · Stale 0");
    assert.equal("open" in details.attrs, false);
    const visible = view.root.children.filter((node) => node.tag === "h3").map((node) => node.textContent);
    const nested = details.children.filter((node) => node.tag === "section").flatMap((section) => section.children.filter((node) => node.tag === "h3").map((node) => node.textContent));
    assert.deepEqual(visible, ["What it does", "Needs you"]);
    assert.deepEqual(nested, ["Broken", "Gaps", "Stale"]);
    const actualBlocks = [...view.root.children.filter((node) => node.tag === "h3"), ...details.children.filter((node) => node.tag === "section").flatMap((section) => section.children.filter((node) => node.tag === "h3"))];
    assert.deepEqual(actualBlocks.map((heading) => [heading.textContent, heading.children.filter((n) => n.tag === "a").length, heading.children[0]?.attrs.href]), OVERVIEW_BLOCKS.map(([heading, href]) => [heading, 1, href]));
  }
});
// req: R-3053
await check("R-3053: legacy asks retain kind counts and blocking entries while Needs you counts the open questions", async () => {
  const handoff = ["# Handoff", "## Open for the owner", "- **[optional, since 2026-01-05] Opt.** body", "- **[optional, since 2026-01-06] Opt two.** body", "- **[Blocking, since 2026-02-01] Zeta.** body", "## Open for the second owner", "- **[parked, since 2026-01-03] Held.** body", "- **[blocking, since 2026-01-01] Alpha.** body"].join("\r\n");
  const ledger = basic() + "\n## Open questions\n1. Open one.  \n- (lane) Open bullet.\t\n## Closed questions\n2. (closed 2026-01-01) Done.\n## Deliberate omissions\n- An omission.";
  const repo = treeFixture(temp, "asks", ledger.replaceAll("\n", "\r\n"), handoff);
  const html = await page(repo, "asks");
  assert.deepEqual(lines(renderHtmlAt(html), 0), [`${L.asks}: 5 · ${L.blocking}: 2 · ${L.optional}: 2 · ${L.parked}: 1`, `Zeta · blocking · ${L.since} 2026-02-01`, `Question: body`, "Seat recommends: none recorded", `Alpha · blocking · ${L.since} 2026-01-01`, `Question: body`, "Seat recommends: none recorded", `Opt two · optional · ${L.since} 2026-01-06`, `Question: body`, "Seat recommends: none recorded", "2 more in Decisions", `${L.questions}: 2`]);
  const questions = renderHtmlAt(html, "#decisions").nodes.find((node) => node.attrs?.class === "open-questions");
  assert.equal(questions?.children.length, 2);
});
// req: R-3053
await check("R-3053: Needs you lists blocking asks then cost-ranked optionals, caps and links the remainder", async () => {
  const repo = treeFixture(temp, "selection", basic(), "## Open for the owner\nIssues: https://github.com/example/project/issues\n");
  const items = [
    [16, "Block", "blocking", "Question: Decide now?"],
    [13, "Hard old", "optional", "Question: Hard old?\nCost of a wrong guess: hard to undo; loss."],
    [14, "Hard new", "optional", "Question: Hard new?\nCost of a wrong guess: hard to undo; loss."],
    [15, "Easy newest", "optional", "Question: Easy newest?\nCost of a wrong guess: easy to undo; loss."],
    [17, "Parked", "parked", "Question: Do not list."],
  ].map(([number, title, kind, body], index) => ({ number, title, kind, body, createdAt: `2026-10-${String(index === 1 || index === 2 ? 3 : index + 1).padStart(2, "0")}T00:00:00Z` }));
  const out = path.join(temp, "selection.html");
  await generateReport({ root: repo.root, out, readIssues: async ({ pointer }) => ({ ...pointer, url: "https://github.com/example/project/issues", items }) });
  const view = renderHtmlAt(fs.readFileSync(out, "utf8"));
  const needs = blocks(view).find(({ heading }) => heading.textContent === "Needs you");
  assert.deepEqual(needs.lines.map((node) => node.textContent).filter((text) => /· (blocking|optional) · since/.test(text)), ["Block · blocking · since 2026-10-01", "Hard new · optional · since 2026-10-03", "Hard old · optional · since 2026-10-03"]);
  const remainder = needs.lines.find((node) => node.textContent === "2 more in Decisions");
  assert.equal(remainder.children.find((node) => node.tag === "a")?.attrs.href, "#decisions");
  assert(!needs.lines.some((node) => node.textContent.includes("Parked")));
  assert.equal(NEEDS_YOU_ASK_CAP, 3);
  const failedOut = path.join(temp, "selection-failed.html");
  await generateReport({ root: repo.root, out: failedOut, readIssues: async () => { throw new Error("unavailable"); } });
  const failedNeeds = blocks(renderHtmlAt(fs.readFileSync(failedOut, "utf8"))).find(({ heading }) => heading.textContent === "Needs you");
  assert.match(failedNeeds.lines[0].textContent, /^Asks: unknown/);
  assert.deepEqual(failedNeeds.lines.slice(1).map((node) => node.textContent), ["Open questions in the ledger: 0"]);
});
// req: R-3054
await check("R-3054: Needs you shows each listed ask's question, recommendation, cost and further-question count", async () => {
  const repo = treeFixture(temp, "ask-lines", basic(), "## Open for the owner\nIssues: https://github.com/example/project/issues\n");
  const items = [{ number: 242, title: "Policy", kind: "optional", createdAt: "2026-10-01T00:00:00Z", body: "Question: Keep it?\nRecommendation: keep the narrow rule.\nCost of a wrong guess: hard to undo; exposure.\nQuestion: Change it?" }];
  const out = path.join(temp, "ask-lines.html");
  await generateReport({ root: repo.root, out, readIssues: async ({ pointer }) => ({ ...pointer, url: "https://github.com/example/project/issues", items }) });
  const view = renderHtmlAt(fs.readFileSync(out, "utf8"));
  const needs = blocks(view).find(({ heading }) => heading.textContent === "Needs you");
  assert.deepEqual(needs.lines.map((node) => node.textContent), ["Asks: 1 · blocking (must decide): 0 · optional: 1 · parked: 0", "Policy · optional · since 2026-10-01", "Question: Keep it?", "Seat recommends: keep the narrow rule", "Cost of a wrong guess: hard to undo; exposure.", "1 more questions in the issue", "Open questions in the ledger: 0"]);
  assert.equal(needs.lines[1].children.find((node) => node.tag === "a")?.attrs.href, "https://github.com/example/project/issues/242");
  assert.equal(ASK_LABELS.cost, "Cost of a wrong guess");
  const noRecOut = path.join(temp, "ask-lines-no-rec.html");
  await generateReport({ root: repo.root, out: noRecOut, readIssues: async ({ pointer }) => ({ ...pointer, url: "https://github.com/example/project/issues", items: [{ number: 243, title: "No recommendation", kind: "optional", createdAt: "2026-10-02", body: "Question: Choose?" }] }) });
  const noRec = blocks(renderHtmlAt(fs.readFileSync(noRecOut, "utf8"))).find(({ heading }) => heading.textContent === "Needs you");
  assert(noRec.lines.some((node) => node.textContent === "Seat recommends: none recorded"));
});
// req: R-3053
await check("seal R-3053: Needs you ask cap is three", async () => assert.equal(NEEDS_YOU_ASK_CAP, 3));
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
// req: R-3080
await check("R-3080: Records summary separates violated, failed, skipped and unmeasured runtime counts", async () => {
  let ledger = stage("CAP-01", "First", ["Deliverables: R-001", ...code("R-001")]) + "\n" + feature("FEAT-001", [["R-001", "implemented"], ["R-002", "violated"], ["R-003", "implemented"], ["R-004", "implemented"], ["R-005", "implemented"]]);
  const evidence = { "R-001": "f", "R-003": "s", "R-004": "n" };
  ledger = ledger.split("\n").map((line) => { const id = line.split(" ")[1]; return evidence[id] ? line.replace("—", "`tests/" + evidence[id] + ".test.mjs::case`") : line; }).join("\n");
  const repo = treeFixture(temp, "records-runtime", ledger);
  const tip = repo.git(["rev-parse", "HEAD"]).stdout.trim();
  writeRuntimeFile(repo.root, { schema: 1, hashes: {}, tests: { "tests/f.test.mjs": { label: "FAIL", seconds: 1, ran: [] }, "tests/s.test.mjs": { label: "SKIP", seconds: 0, ran: [] } }, tip, measuredAt: "2026-01-01T00:00:00Z" });
  const view = renderHtmlAt(await page(repo, "records-runtime"));
  const details = view.root.children.find((node) => node.tag === "details");
  assert.equal(details.children[0].textContent, "Records: violated 1 · failed 1 · skipped 1 · unmeasured 1 · Gaps 0 · Stale 0");
  assert.equal("open" in details.attrs, false);
  assert.match(lines(view, 2)[0], /^Deliverables code does not make and read: 0 ·/);
  assert.ok(lines(view, 1)[2].includes(MEASURED_AT_TIP_PREFIX));
});
// req: R-3082
await check("R-3082: Records summary comes from the model when the Broken label is renamed", async () => {
  const repo = treeFixture(temp, "records-model", basic("product", ["Deliverables: R-001", ...code("R-001")]));
  const html = await page(repo, "records-model");
  const openTag = '<script id="report-data" type="application/json">';
  const dataStart = html.indexOf(openTag);
  const dataEnd = html.indexOf("</script>", dataStart);
  assert.ok(dataStart >= 0 && dataEnd > dataStart);
  const data = html.slice(dataStart + openTag.length, dataEnd);
  const model = JSON.parse(data);
  model.overview[2].lines[0][0].text = "Renamed: 9";
  model.recordsSummary = "Records: model summary";
  const changed = html.slice(0, dataStart + openTag.length) + JSON.stringify(model) + html.slice(dataEnd);
  const view = renderHtmlAt(changed);
  assert.equal(view.root.children.find((node) => node.tag === "details").children[0].textContent, "Records: model summary");
});
// req: R-2923
await check("R-2923: Gaps names the unparked deliverables code does not make and read and the artifacts with no declared reader, each beside its parked count, and counts the checker's notes", async () => {
  const fields = ["Deliverables: R-005, R-001, R-002, R-003, R-004", ...code("R-001"), ...manual("R-002"), ...manual("R-005"), ...manual("R-003"), park("R-003"), ...code("R-004"), park("R-004")];
  const entries = [5, 1, 2, 3, 4].map((n) => `Artifact: A-00${n} · item ${n} · other project: <project>/item${n} · manual: owner`);
  const ledger = stage("CAP-01", "First", fields) + "\n" + feature("FEAT-001", [1, 2, 3, 4, 5].map((n) => [`R-00${n}`, "implemented"]), [...entries.filter((line) => !line.startsWith("Artifact: A-002")), "Parked: A-003 · since 2026-01-01: owner holds it", "Read by: A-004 · person: owner reads it"]) + "\n" + feature("FEAT-002", [["R-007", "implemented"]], [entries[2], "Reads: A-001 · read.mjs"]);
  const repo = treeFixture(temp, "gaps", ledger);
  commitCode(repo);
  const checker = cli(repo);
  const notes = checker.filter((line) => line.startsWith("deliverable note:")).length;
  assert.ok(notes > 0);
  const view = renderHtmlAt(await page(repo, "gaps"));
  assert.deepEqual(lines(view, 2), [`${L.deliverableGaps}: 2 · ${L.parked}: 1 · ${L.notes}: ${notes}`, "R-005, R-002", `${L.artifactGaps}: 2 · ${L.parked}: 1`, "A-002 · made in FEAT-002, A-005 · made in FEAT-001"]);
  assert.deepEqual(blocks(view)[2].lines[3].children.filter((node) => node.tag === "a").map((node) => node.attrs.href), ["#FEAT-002", "#FEAT-001"]);
});
// req: R-2924
await check("R-2924: Stale counts live features' out-of-date and unassessed assessments, and artifacts older than the stale age before HEAD's commit time, beside the not-measured and unknown counts", async () => {
  const runtimeKey = Object.keys(ARTIFACT_AGE_TABLE).find((key) => ARTIFACT_AGE_TABLE[key].writer === "scripts/runtime-measure.mjs");
  const extra = ["Artifact: A-001 · first · tracked: a.txt · manual: owner", "Artifact: A-002 · boundary · tracked: b.txt · manual: owner", "Artifact: A-003 · home · user-home store: ~/fixture · manual: owner", "Artifact: A-004 · missing · tracked: absent.txt · manual: owner", `Artifact: A-005 · runtime · clone store: ${runtimeKey} · land: scripts/runtime-measure.mjs`];
  const ledger = stage("CAP-01", "First") + "\n" + feature("FEAT-001", [["R-001", "implemented"]], extra.slice(0, 4)) + "\n" + feature("FEAT-002", [["R-002", "implemented"]], [extra[4]]) + "\n" + feature("FEAT-003", [], [], "proposed");
  const repo = treeFixture(temp, "stale", ledger, undefined, "2020-01-01T00:00:00Z");
  const first = commitAt(temp, repo, "artifacts", "2020-01-01T00:00:00Z", { "a.txt": "a\n", "b.txt": "b\n" });
  const assessment = makeAssessment(repo.root, first);
  writeStore(repo.root, [assessment]);
  commitAt(temp, repo, "boundary", "2020-01-02T00:00:00Z", { "b.txt": "changed\n" });
  commitAt(temp, repo, "head", "2020-02-01T00:00:00Z", { "REQUIREMENTS.md": ledger.replace("R-001 shall work.", "R-001 shall change.") });
  writeRuntimeFile(repo.root, { schema: 1, hashes: {}, tests: {}, tip: first, measuredAt: "2019-12-01T00:00:00Z" });
  const view = renderHtmlAt(await page(repo, "stale"));
  assert.deepEqual(lines(view, 3), [`${L.assessments}: 1 · ${L.unassessed}: 1`, "FEAT-001, FEAT-002", `${L.staleArtifacts}: 2 · ${L.notMeasured}: 1 · ${L.unknown}: 1`, `A-001 · first · ${STALE_AGE_DAYS + 1} days · made in FEAT-001`, `A-005 · runtime · ${STALE_AGE_DAYS + 32} days · made in FEAT-002`]);
  assert.deepEqual(blocks(view)[3].lines.slice(3).map((line) => line.children.filter((node) => node.tag === "a").map((node) => node.attrs.href)), [["#FEAT-001"], ["#FEAT-002"]]);
  const linked = blocks(view)[3].lines[1].children.filter((node) => node.tag === "a").map((node) => node.attrs.href);
  assert.deepEqual(linked, ["#FEAT-001", "#FEAT-002"]);
  const ages = renderHtmlAt(await page(repo, "age-prefixes"), "#FEAT-001").nodes.filter((node) => node.tag === "p").map((node) => node.textContent);
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
