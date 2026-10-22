/**
 * @module packages/nana-pack/tests/product-report.test.mjs
 * @purpose Pins the product report's ledger, HANDOFF, git provenance, escaping, and deterministic output contracts.
 * @inputs the product-report module and temporary repository fixtures.
 * @outputs named PASS/FAIL checks for report behavior.
 * @effects disk (temporary fixture repositories); process (git commands).
 * @errors failed assertions set a nonzero test exit.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as vm from "node:vm";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { buildReport, generateReport, generatePackets, renderInto, validateStore } from "../../../scripts/product-report.mjs";
import * as productReportModule from "../../../scripts/product-report.mjs";
import * as deliverablesModule from "../../../scripts/deliverables.mjs";
import { MAX_GIT_BUFFER } from "../../../scripts/requirements-moved.mjs";
import { OPEN_SECTION_NAME, OPEN_SECTION_PREFIX } from "../lib/frontier-config.mjs";
import { splitOpenSection } from "../lib/handoff-asks.mjs";
import { parseLedger, readRequirementRows } from "../../../scripts/requirements-tree.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const temp = tmpDir(path.join(os.tmpdir(), "product-report-"));
let fails = 0;
function check(name, ok, detail = "") {
  console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
  if (!ok) fails++;
}
// Match the canonical runner's established per-file ceiling while giving each new async case its own watchdog.
const CASE_LIMIT_MS = Number(process.env.NANA_TEST_TIMEOUT_MS) || 5 * 60 * 1000;
async function withinCaseLimit(label, action) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(action),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} exceeded ${CASE_LIMIT_MS} ms`)), CASE_LIMIT_MS); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
function fixture(name = "repo") {
  const root = path.join(temp, name);
  fs.mkdirSync(root, { recursive: true });
  fs.copyFileSync(path.join(ROOT, "REQUIREMENTS.md"), path.join(root, "REQUIREMENTS.md"));
  fs.copyFileSync(path.join(ROOT, "HANDOFF.md"), path.join(root, "HANDOFF.md"));
  const git = (args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
  git(["init", "-q"]); git(["config", "user.email", "test@example.com"]); git(["config", "user.name", "Test"]);
  git(["add", "REQUIREMENTS.md", "HANDOFF.md"]); git(["commit", "-qm", "fixture"]);
  return { root, git };
}
function treeFixture(name, ledger, handoff = "# Handoff\n\n## Open for the owner\n") {
  const root = path.join(temp, name);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), ledger);
  fs.writeFileSync(path.join(root, "HANDOFF.md"), handoff);
  const git = (args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
  git(["init", "-q"]); git(["config", "user.email", "test@example.com"]); git(["config", "user.name", "Test"]);
  git(["add", "REQUIREMENTS.md", "HANDOFF.md"]); git(["commit", "-qm", "fixture"]);
  return { root, git };
}
const table = (rows) => `| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n${rows.map(([id, status]) => `| ${id} | ${id} shall work. | ${status} | — |`).join("\n")}\n`;
const capabilityCards = (view) => view.root.children.filter((node) => node.tag === "article");
const capabilityCard = (view, id) => capabilityCards(view).find((card) => card.children.some((node) => node.tag === "h3" && node.textContent.startsWith(`${id} · `)));
const pinsKindedHeadings = (view, expected) => expected.every(([id, label]) => capabilityCard(view, id)?.children.some((node) => node.tag === "h3" && node.textContent === `${id} · ${label}`));
const hashRow = (id, requirement, status) => createHash("sha256").update(JSON.stringify([id, requirement, status])).digest("hex");
function makeAssessment(root, commit, featureId = "FEAT-001") {
  const parsed = parseLedger(fs.readFileSync(path.join(root, "REQUIREMENTS.md"), "utf8").replace(/\r\n?/g, "\n").split("\n").map((line) => line.replace(/[ \t]+$/g, "")).join("\n"));
  const feature = parsed.headings.find((heading) => heading.id === featureId);
  const descendants = parsed.headings.filter((heading) => { for (let current = heading; current; current = current.parent) if (current === feature) return true; return false; });
  const own = readRequirementRows(parsed).filter((row) => descendants.includes(row.heading));
  const shared = feature.alsoApplies.map((id) => readRequirementRows(parsed).find((row) => row.id === id)).filter(Boolean);
  const rows = [...own.map((row) => ({ ...row, mark: "own" })), ...shared.map((row) => ({ ...row, mark: "shared" }))];
  return { id: feature.id, what_it_does: "Keeps the requirements together.", maturity: "partial", maturity_reason: "Some checks remain open.", gaps: ["A missing check."], risks: ["A stale result."], decisions: ["A future choice."], next_step: "Run the full suite.", written_by: "seat", checked_by: "reviewer", date: "2026-10-11", stamp: { commit, purpose: feature.purpose, status: feature.status, rows: rows.map((row) => ({ id: row.id, mark: row.mark, status: row.status, sha256: hashRow(row.id, row.requirement, row.status) })) } };
}
function writeStore(root, features) {
  const storePath = path.join(root, "docs/product-report/assessments.json");
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify({ version: 1, features }, null, 2));
  return storePath;
}
// Replaces one row's Evidence cell in a fixture's own REQUIREMENTS.md, by line number, so a
// test can exercise a cited-test shape without disturbing the row's requirement text or status.
function setRowEvidence(root, id, evidence) {
  const ledgerPath = path.join(root, "REQUIREMENTS.md");
  const text = fs.readFileSync(ledgerPath, "utf8");
  const target = readRequirementRows(parseLedger(text)).find((candidate) => candidate.id === id);
  if (!target) throw new Error(`fixture row ${id} not found`);
  const lines = text.split("\n");
  lines[target.line - 1] = `| ${target.id} | ${target.requirement} | ${target.status} | ${evidence} |`;
  fs.writeFileSync(ledgerPath, lines.join("\n"));
}
// Schema-1 runtime data at the fixture's own .git/nana/runtime-map.json (R-1278's default
// place), never injected and never the real clone's.
function writeRuntimeFile(root, data) {
  const common = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: root, encoding: "utf8" }).stdout.trim();
  const file = path.join(path.resolve(root, common), "nana", "runtime-map.json");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
  return file;
}
function productLedger(artifacts) {
  const rows = artifacts.map((_, index) => `R-${8500 + index}`);
  return [
    "# CAP-85 · Artifact stage", "Purpose: make artifacts.", "Outcome: artifacts exist.", "Kind: product", `Deliverables: ${rows.join(", ")}`,
    ...artifacts.flatMap((artifact, index) => [`Made by: ${rows[index]} · build: REQUIREMENTS.md · ${artifact}`, `Read by: ${rows[index]} · code: REQUIREMENTS.md`]), "",
    "## FEAT-085 · Artifact report", "Purpose: report artifact ages.", "Status: active", "", table(rows.map((id) => [id, "implemented"])).trimEnd(),
  ].join("\n");
}
function historyFixture(name, artifacts, date = "2026-01-01T00:00:00Z", parent = temp) {
  const root = path.join(parent, name);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), productLedger(artifacts));
  fs.writeFileSync(path.join(root, "HANDOFF.md"), "# Handoff\n\n## Open for the owner\n");
  const run = (args, options = {}) => spawnSync("git", args, { cwd: root, encoding: "utf8", ...options });
  run(["init", "-q"]); run(["config", "user.email", "test@example.com"]); run(["config", "user.name", "Test"]);
  run(["add", "REQUIREMENTS.md", "HANDOFF.md"]);
  run(["commit", "-qm", "fixture ledger"], { env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
  return { root, git: run };
}
function commitAt(repo, message, date, files, { messageFile = false } = {}) {
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(repo.root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  repo.git(["add", "-A"]);
  const env = { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date };
  if (messageFile) {
    const file = path.join(temp, `commit-message-${Math.random().toString(16).slice(2)}`);
    fs.writeFileSync(file, message);
    repo.git(["commit", "-qF", file], { env });
  } else repo.git(["commit", "-qm", message], { env });
  return repo.git(["rev-parse", "HEAD"]).stdout.trim();
}
async function renderedProduct(repo, name, gitRunner) {
  const out = path.join(temp, `${name}.html`);
  await generateReport({ root: repo.root, out, ...(gitRunner ? { gitRunner } : {}) });
  return { out, view: renderHtmlAt(fs.readFileSync(out, "utf8"), "#product") };
}
function renderedClaims(view) {
  return view.nodes.filter((node) => node.tag === "ul" && node.attrs?.class === "deliverable-claims").flatMap((node) => node.children.map((item) => item.textContent));
}
// The one helper every new check renders through (must-meet.md, report-test-details-2026-10-19):
// pull the renderer source and the report-data JSON from the HTML generateReport wrote, evaluate
// the renderer in a fresh vm context (so a reference to an import or module constant the real
// page cannot see throws exactly as it would in the browser), and render one hash into a stub DOM.
function renderHtmlAt(html, hash = "") {
  const prefix = "const renderInto = (";
  const start = html.indexOf(prefix);
  if (start === -1) throw new Error("renderer source not found in generated page");
  const afterStart = start + prefix.length;
  const close = /\);\r?\n(?=const data = JSON\.parse)/.exec(html.slice(afterStart));
  if (!close) throw new Error("renderer close not found in generated page");
  const source = html.slice(afterStart, afterStart + close.index);
  const sandbox = {};
  vm.runInNewContext(`renderInto = (${source});`, sandbox);
  const dataMatch = html.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/);
  const model = JSON.parse(dataMatch[1]);
  const handlers = [];
  const rootNode = { tag: "main", children: [], appendChild(node) { this.children.push(node); }, replaceChildren(...children) { this.children = children; } };
  const make = (tag) => { const node = { tag, children: [], attrs: {}, appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, setAttribute(name, value) { this.attrs[name] = value; }, addEventListener(type, callback) { handlers.push({ node: this, type, callback }); } }; Object.defineProperty(node, "textContent", { get() { return this.children.map((child) => child.textContent ?? child.text ?? "").join(""); }, set(value) { this.children = [{ text: String(value) }]; } }); return node; };
  const document = { getElementById: () => rootNode, createElement: make, createTextNode: (value) => ({ text: String(value), get textContent() { return this.text; } }) };
  sandbox.renderInto(document, model, { hash });
  const flatten = (node) => [node, ...(node.children ?? []).flatMap(flatten)];
  return { nodes: flatten(rootNode), root: rootNode, model, handlers };
}
// Finds a row's <article> card (detail/issues/requirements views share row()) by its heading's
// leading "<id> " text, and that card's row-tests <ol> items.
function cardFor(view, rowId) {
  return view.nodes.find((node) => node.tag === "article" && node.children.some((child) => child.tag === "h3" && child.textContent.startsWith(`${rowId} `)));
}
function testItemsOf(card) {
  return card?.children.find((child) => child.tag === "ol" && child.attrs?.class === "row-tests")?.children.filter((child) => child.tag === "li") ?? [];
}
// Rewrites one heading's section of a fixture's REQUIREMENTS.md in place: everything from right
// after `heading`'s own line up to (not including) the next line starting with "#", replaced
// with `bodyLines`. `keepHeading: false` drops the heading line too. Used only by R-1570 and
// R-1571, so those two checks can hand the written page a deterministic open-questions section
// without disturbing the rest of the real ledger.
function setLedgerSection(root, heading, bodyLines, { keepHeading = true, eol = "\n" } = {}) {
  const ledgerPath = path.join(root, "REQUIREMENTS.md");
  const lines = fs.readFileSync(ledgerPath, "utf8").replace(/\r\n?/g, "\n").split("\n");
  const at = lines.indexOf(heading);
  if (at === -1) throw new Error(`fixture ledger has no "${heading}" heading`);
  let end = lines.length;
  for (let i = at + 1; i < lines.length; i++) if (lines[i].startsWith("#")) { end = i; break; }
  const kept = keepHeading ? [lines[at], ...bodyLines] : [...bodyLines];
  lines.splice(at, end - at, ...kept);
  fs.writeFileSync(ledgerPath, lines.join(eol));
}
// The helper R-1570 and R-1571 render through (must-meet.md, audit-open-questions-2026-10-19):
// run the written page's own inline bootstrap script -- the <script> with no id -- in node:vm
// against a minimal stub document (a "report" root, a "report-data" node holding the raw model
// JSON), location.hash, a no-op addEventListener and window.scrollTo, so a reference the reader's
// browser could not resolve throws here exactly as it would in the page. A throw counts as a
// failed check.
function renderPageAt(html, hash = "") {
  const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
  const bootstrap = scripts.find(([, attrs]) => !attrs.includes("id="));
  if (!bootstrap) throw new Error("bootstrap script not found in generated page");
  const dataMatch = html.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/);
  if (!dataMatch) throw new Error("report-data script not found in generated page");
  const rootNode = { tag: "main", children: [], appendChild(node) { this.children.push(node); }, replaceChildren(...children) { this.children = children; } };
  const make = (tag) => { const node = { tag, children: [], attrs: {}, appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, setAttribute(name, value) { this.attrs[name] = value; }, addEventListener() {} }; Object.defineProperty(node, "textContent", { get() { return this.children.map((child) => child.textContent ?? child.text ?? "").join(""); }, set(value) { this.children = [{ text: String(value) }]; } }); return node; };
  const reportDataNode = { textContent: dataMatch[1] };
  const document = { getElementById: (id) => (id === "report" ? rootNode : id === "report-data" ? reportDataNode : null), createElement: make, createTextNode: (value) => ({ text: String(value), get textContent() { return this.text; } }) };
  const context = { document, location: { hash }, addEventListener() {}, window: { scrollTo() {} } };
  vm.runInNewContext(bootstrap[2], context);
  const flatten = (node) => [node, ...(node.children ?? []).flatMap(flatten)];
  return flatten(rootNode);
}
{
  const entries = splitOpenSection([
    "## Open for Avery",
    "- **[optional, since 2026-10-10] First ask.** body",
    "## Open formats",
    "- **[optional, since 2026-10-10] Format control.** body",
    "## Open for Rowan (notes)",
    "- **[parked, since 2026-10-09] Second ask.** body",
    "## Open",
    "- **[blocking, since 2026-10-08] Bare control.** body",
  ].join("\n"));
  // req: R-2514
  check("an Open for heading with any name is read as the asks section", OPEN_SECTION_PREFIX === "Open for " && OPEN_SECTION_NAME === "Open for the owner" && JSON.stringify(entries.map((entry) => entry.title?.title)) === JSON.stringify(["First ask", "Second ask"]));
}
try {
  {
    const { root, git } = fixture("deterministic");
    git(["remote", "add", "origin", "https://github.com/example-org/example-repo.git"]);
    writeRuntimeFile(root, { schema: 1, hashes: { "packages/nana-pack/tests/product-report.test.mjs": "0".repeat(64) }, tests: { "packages/nana-pack/tests/product-report.test.mjs": { label: "PASS", seconds: 1, ran: [] } } });
    const first = path.join(temp, "first.html"); const second = path.join(temp, "second.html");
    await generateReport({ root, out: first }); await generateReport({ root, out: second });
    // req: R-1012
    check("same commit and tree produce byte-identical reports", fs.readFileSync(first).equals(fs.readFileSync(second)));
  }
  {
    const { root, git } = fixture("provenance");
    const expectedHash = git(["rev-parse", "HEAD"]).stdout.trim();
    const expectedDate = git(["log", "-1", "--format=%cI"]).stdout.trim();
    const metadataChecks = [];
    for (const [name, dirty] of [["clean", false], ["tracked", true], ["untracked", "untracked"]]) {
      if (dirty === true) fs.appendFileSync(path.join(root, "HANDOFF.md"), "\nchanged\n");
      if (dirty === "untracked") fs.writeFileSync(path.join(root, "new-file"), "new\n");
      const out = path.join(temp, `${name}.html`); await generateReport({ root, out });
      const html = fs.readFileSync(out, "utf8");
      const json = html.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
      const report = JSON.parse(json);
      metadataChecks.push(report.commit === expectedHash && report.date === expectedDate && report.clean === !dirty);
      if (dirty) { fs.rmSync(path.join(root, "new-file"), { force: true }); git(["checkout", "--", "HANDOFF.md"]); }
    }
    // req: R-1013
    check("git metadata reflects actual commit date and clean state for clean, tracked, and untracked trees", metadataChecks.length === 3 && metadataChecks.every(Boolean));
    const out = path.join(temp, "git-error.html");
    let refused = false;
    try { await generateReport({ root, out, gitRunner: () => ({ status: 1, stdout: "", stderr: "injected git failure" }) }); } catch (error) { refused = /git/i.test(error.message); }
    // req: R-1013
    check("git runner failures refuse report generation", refused && !fs.existsSync(out));
  }
  {
    const { root } = fixture("content");
    const model = (await buildReport({ root }));
    model.features.find((item) => item.id === "FEAT-039").assessmentState = "current";
    model.features.find((item) => item.id === "FEAT-039").assessment = { what_it_does: "Keeps requirements together.", maturity: "partial", maturity_reason: "Some checks remain open.", gaps: ["A missing check.", "**Another** `gap`."], risks: ["A stale result."], decisions: ["A future choice."], next_step: "Run the full suite.", written_by: "seat", checked_by: "reviewer", date: "2026-10-11" };
    model.asks[0].body += " **bold span** and `code span`";
    const render = (hash = "") => {
      const nodes = []; const handlers = [];
      const rootNode = { tag: "main", children: [], appendChild(node) { this.children.push(node); }, replaceChildren(...children) { this.children = children; } };
      const make = (tag) => { const node = { tag, children: [], attrs: {}, value: "", appendChild(child) { this.children.push(child); }, append(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, setAttribute(name, value) { this.attrs[name] = value; }, addEventListener(type, callback) { handlers.push({ node: this, type, callback }); } }; Object.defineProperty(node, "textContent", { get() { return this.children.map((child) => child.textContent ?? child.text ?? "").join(""); }, set(value) { this.children = [{ text: String(value) }]; } }); nodes.push(node); return node; };
      const document = { getElementById: () => rootNode, createElement: make, createTextNode: (value) => ({ text: String(value), get textContent() { return this.text; } }) };
      renderInto(document, model, { hash });
      const flatten = (node) => [node, ...(node.children ?? []).flatMap(flatten)];
      return { text: flatten(rootNode).map((node) => typeof node.text === "string" ? node.text : "").join(" "), nodes: flatten(rootNode), root: rootNode, handlers };
    };
    const product = render("#product"); const features = render("#features"); const detail = render("#FEAT-039");
    const requirements = render("#requirements"); const issues = render("#issues"); const decisions = render();
    // req: R-1013
    check("rendered provenance section states exact commit, date, and clean state", decisions.nodes.some((node) => node.tag === "p" && node.textContent === `Commit: ${model.commit} · ${model.date} · Working tree: ${model.clean ? "clean" : "dirty"}`));
    // req: R-1014
    check("rendered #product cards show exact capability purpose, outcome, links and counts", model.capabilities.every((cap) => { const card = product.nodes.find((node) => node.tag === "article" && node.children.some((child) => child.tag === "h3" && child.textContent === `${cap.id} · ${cap.label}`)); return card && card.children.some((child) => child.tag === "p" && child.textContent === `Purpose: ${cap.purpose}`) && card.children.some((child) => child.tag === "p" && child.textContent === `Outcome: ${cap.outcome}`) && cap.features.every((id) => card.children.some((child) => child.tag === "p" && child.children.some((link) => link.tag === "a" && link.textContent.startsWith(id) && link.attrs.href === `#${id}`))); }));
    // req: R-1014
    check("product feature bars carry their model's exact segment values", model.capabilities.every((cap) => cap.features.every((id) => { const item = model.features.find((feature) => feature.id === id); const card = product.nodes.find((node) => node.tag === "article" && node.children.some((child) => child.tag === "h3" && child.textContent === `${cap.id} · ${cap.label}`)); const featureLine = card?.children.findIndex((child) => child.tag === "p" && child.children.some((link) => link.tag === "a" && link.attrs.href === `#${id}`)); const bar = card?.children[featureLine + 1]?.children?.find((node) => node.attrs?.class === "status-bar"); return bar && bar.children.map((segment) => segment.attrs.style).join(",") === ["implemented", "untested", "planned", "violated", "retired"].map((status) => `flex-grow:${item.counts[status] ?? 0}`).join(","); })));
    // req: R-1015
    check("rendered #features and feature detail views show the feature facts and shared rows", model.features.every((f) => features.text.includes(f.id) && features.text.includes(f.label) && features.text.includes(f.status) && features.text.includes(f.assessmentState)) && detail.text.includes("Purpose") && detail.text.includes("What it does") && detail.text.includes("current — matches the stamped ledger, not rechecked against later decisions"), `${features.text.slice(0, 250)} / ${detail.text.slice(0, 250)}`);
    const summaryFailures = model.features.filter((item) => { const card = features.nodes.find((node) => node.tag === "article" && node.children.some((child) => child.tag === "h3" && child.children.some((link) => link.attrs?.href === `#${item.id}`))); const flatten = (node) => [node, ...(node.children ?? []).flatMap(flatten)]; const descendants = card ? flatten(card) : []; return !card || !descendants.some((child) => child.textContent === `Status: ${item.status}`) || !descendants.some((child) => child.textContent === `Assessment: ${item.assessmentState}`) || !descendants.some((child) => child.textContent === `Shared in: ${item.shared.join(", ") || "None"}`) || !descendants.some((child) => child.textContent === `Shared by: ${item.sharedBy.join(", ") || "None"}`) || !descendants.some((child) => child.attrs?.class === "count-label" && child.textContent === `Counts: ${["implemented", "untested", "planned", "violated", "retired"].map((status) => `${status} ${item.counts[status]}`).join(" · ")}`); });
    // req: R-1015
    check("feature summary cards render exact counts, status, incoming and outgoing shares", summaryFailures.length === 0, summaryFailures.slice(0, 2).map((item) => item.id).join(","));
    const detailText = detail.text;
    const featureHeadings = detail.nodes.filter((node) => /^h[1-6]$/.test(node.tag) && node.textContent.includes("FEAT-039") && node.textContent.includes(model.features.find((item) => item.id === "FEAT-039").label));
    // req: R-1040
    check("feature detail shows its title once", featureHeadings.length === 1);
    const detailListItems = detail.nodes.filter((node) => node.tag === "li");
    // req: R-1041
    check("assessment lists render separate text-only list items", detail.nodes.filter((node) => node.tag === "ul").length === 3 && ["A missing check.", "Another gap."].every((value) => detailListItems.some((item) => item.textContent === value)) && detailListItems.some((item) => item.children.some((child) => child.tag === "b")) && detailListItems.some((item) => item.children.some((child) => child.tag === "code")));
    // req: R-1041
    check("assessment lists do not join entries into punctuation", !detail.text.includes(".;"));
    // req: R-1015
    check("feature detail places human-labelled assessment before counts, shares and rows", detail.nodes.some((node) => node.attrs?.class?.includes("state-current") && node.textContent.startsWith("current — matches the stamped ledger")) && detailText.indexOf("What it does") < detailText.indexOf("Counts") && detailText.indexOf("Counts") < detailText.indexOf("Shared by") && detailText.indexOf("Shared by") < detailText.lastIndexOf("Requirements"));
    // req: R-1015
    check("feature IDs link to their detail views in product, features, shared and detail views", [product, features, render("#shared"), detail].every((view) => view.nodes.filter((node) => node.tag === "a" && /^FEAT-/.test(node.textContent ?? "")).every((node) => node.attrs.href === `#${node.textContent.split(" · ")[0]}`)) && model.features.every((item) => features.nodes.some((node) => node.tag === "a" && node.attrs.href === `#${item.id}`)));
    // req: R-1015
    check("feature detail shows exact status counts and stacked bar segments", (() => { const item = model.features.find((feature) => feature.id === "FEAT-039"); const bar = detail.nodes.find((node) => node.attrs?.class === "status-bar"); const counts = detail.nodes.find((node) => node.attrs?.class === "count-label"); return bar && bar.children.map((segment) => segment.attrs.style).join(",") === ["implemented", "untested", "planned", "violated", "retired"].map((status) => `flex-grow:${item.counts[status]}`).join(",") && counts.textContent === `Counts: ${["implemented", "untested", "planned", "violated", "retired"].map((status) => `${status} ${item.counts[status]}`).join(" · ")}`; })());
    // req: R-1015
    check("rendered views never expose raw assessment store keys", [product, features, detail, render("#shared"), requirements, issues, decisions].every((view) => !/what_it_does|maturity_reason/.test(view.text)));
    const plain = (value) => String(value ?? "").replaceAll("**", "").replaceAll("`", "").replace(/\s+/g, " ").trim();
    const allRows = [...new Map(model.features.flatMap((feature) => feature.rows.map((row) => [row.id, row]))).values()];
    const requirementText = requirements.text.replace(/\s+/g, " ");
    const normalizeWords = (value) => String(value ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(/\s+/).filter(Boolean);
    const requirementWords = new Set(normalizeWords(requirementText));
    const carries = (source, value) => { const available = source === requirementText ? requirementWords : new Set(normalizeWords(source)); return normalizeWords(value).every((word) => available.has(word)); };
    const renderPlain = (value) => String(value ?? "").replaceAll("**", "").replaceAll("`", "").replace(/\s+/g, " ").trim();
    const requirementCardFailures = requirements.nodes.filter((card) => card.tag === "article").flatMap((card) => { const heading = card.children.find((child) => child.attrs?.class === "row-heading"); const expected = allRows.find((row) => heading?.textContent.startsWith(`${row.id} `)); return !expected || !card.children.some((node) => node.attrs?.class === "row-heading" && node.textContent === `${expected.id} ${expected.status}`) || !renderPlain(card.textContent).includes(renderPlain(expected.requirement)) || !renderPlain(card.textContent).includes(renderPlain(expected.evidence)) ? [heading?.textContent ?? "no heading"] : []; });
    // req: R-1016
    check("rendered #requirements view shows each row's exact text, pill and evidence in its own card", allRows.length === requirements.nodes.filter((node) => node.tag === "article").length && requirementCardFailures.length === 0, JSON.stringify(requirementCardFailures.slice(0, 3).map((heading) => ({ heading, row: allRows.find((item) => heading.startsWith(item.id)), actual: requirements.nodes.find((card) => card.tag === "article" && card.children.find((child) => child.attrs?.class === "row-heading")?.textContent === heading)?.children.map((child) => [child.attrs?.class, child.textContent]) }))));
    // req: R-1016
    check("requirement cards keep evidence in the smaller monospace presentation", /\.row-evidence\s*\{[^}]*font:\s*\.8rem[^;}]*monospace[^}]*\}/.test(model.template));
    // req: R-1017
    check("rendered #issues view shows every violated row and evidence", model.violated.every((row) => issues.text.includes(row.id) && issues.text.includes(row.requirement) && issues.text.includes(row.evidence)));
    // req: R-1017
    check("each Issues card shows the violated pill without undefined", issues.nodes.filter((node) => node.tag === "article").length === model.violated.length && issues.nodes.filter((node) => node.tag === "article").every((card) => card.children.some((heading) => heading.attrs?.class === "row-heading" && heading.children.some((pill) => pill.textContent === "violated" && pill.attrs?.class === "status-pill status-violated")) && !card.textContent.includes("undefined")));
    // req: R-1018
    check("rendered decisions view shows every ask kind, since-date, title and full body", model.asks.every((ask) => decisions.text.includes(ask.kind) && decisions.text.includes(ask.since) && carries(decisions.text, ask.title) && carries(decisions.text, ask.body)));
    // req: R-1018
    check("rendered decisions view preserves every full ask body", model.asks.length > 0 && decisions.nodes.filter((node) => node.tag === "article").length === model.asks.length && decisions.nodes.filter((card) => card.tag === "article").every((card) => { const ask = model.asks.find((item) => card.children.find((child) => child.tag === "h3")?.textContent === item.title); return ask && card.children.some((child) => child.tag === "p" && child.textContent === `Ask: ${plain(ask.body)}`); }));
    const routeSource = fs.readFileSync(path.join(ROOT, "scripts/product-report.mjs"), "utf8");
    const prototypeHashesRenderDecisions = ["#constructor", "#__proto__", "#hasOwnProperty"].every((hash) => {
      const view = render(hash);
      return model.asks.length > 0 && model.asks.every((ask) => carries(view.text, ask.body)) && view.nodes.some((node) => /^h[1-6]$/.test(node.tag) && /decision/i.test(node.textContent));
    });
    // req: R-1019
    check("unknown prototype hashes render Decisions", prototypeHashesRenderDecisions && /Object\.prototype\.hasOwnProperty\.call\(views, hash\)/.test(routeSource));
    check("renderer turns markdown spans into b and code nodes", decisions.nodes.some((node) => node.tag === "b") && decisions.nodes.some((node) => node.tag === "code") && !decisions.text.includes("**bold span**") && !decisions.text.includes("`code span`"));
    check("renderer includes tab links and requirements controls", features.nodes.some((node) => node.tag === "a") && requirements.nodes.some((node) => node.tag === "input") && requirements.nodes.some((node) => node.tag === "select"));
    const bootstrap = model.template.split("<script>\n")[1].split("</script>")[0].replace("const renderInto = (__RENDERER__);", "");
    let hashHandler; let scrollAfterRender = false; let renderCount = 0;
    const bootstrapRoot = { children: [], replaceChildren(...children) { this.children = children; renderCount++; }, appendChild(child) { this.children.push(child); } };
    const bootstrapDocument = { getElementById(id) { return id === "report" ? bootstrapRoot : { textContent: JSON.stringify(model) }; }, createElement(tag) { return { tag, children: [], attrs: {}, appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, setAttribute(key, value) { this.attrs[key] = value; }, addEventListener() {} }; }, createTextNode(text) { return { text: String(text), get textContent() { return this.text; } }; } };
    vm.runInNewContext(bootstrap, { renderInto, document: bootstrapDocument, location: { hash: "#product" }, addEventListener(type, callback) { if (type === "hashchange") hashHandler = callback; }, window: { scrollTo() { scrollAfterRender = renderCount === 2 && bootstrapRoot.children.length > 0; } } });
    hashHandler();
    // req: R-1042
    check("hashchange bootstrap renders before scrolling to top", renderCount === 2 && scrollAfterRender);
  }
  {
    const { root } = fixture("feature-filter");
    const model = (await buildReport({ root }));
    const sharedRow = model.features.flatMap((feature, index) => feature.shared.map((id) => ({ receiver: feature, index, id }))).find(({ receiver, index, id }) => {
      const ownerIndex = model.features.findIndex((feature) => feature.rows.some((row) => row.id === id && row.mark === "own"));
      return ownerIndex >= 0 && index < ownerIndex && model.features.some((feature, later) => later > ownerIndex && feature.shared.includes(id));
    });
    const made = [];
    const rootNode = { children: [], replaceChildren(...children) { this.children = children; }, appendChild(child) { this.children.push(child); } };
    const make = (tag) => { const node = { tag, children: [], attrs: {}, value: "", appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, setAttribute(key, value) { this.attrs[key] = value; }, addEventListener(type, callback) { this[type] = callback; } }; Object.defineProperty(node, "textContent", { get() { return this.children.map((child) => child.textContent ?? child.text ?? "").join(""); }, set(value) { this.children = [{ text: String(value) }]; } }); made.push(node); return node; };
    const document = { made, getElementById: () => rootNode, createElement: make, createTextNode: (value) => ({ text: String(value), get textContent() { return this.text; } }) };
    renderInto(document, model, { hash: "#requirements" });
    const featureSelect = made.find((node) => node.tag === "select" && node.attrs["aria-label"] === "Filter by feature");
    const cardTexts = () => { const flatten = (node) => [node, ...(node.children ?? []).flatMap(flatten)]; return flatten(rootNode).filter((node) => node.tag === "article").map((node) => node.textContent); };
    const sees = (featureId) => { featureSelect.value = featureId; featureSelect.change(); return cardTexts().some((text) => text.includes(sharedRow.id)); };
    const owner = model.features.find((feature) => feature.rows.some((row) => row.id === sharedRow.id && row.mark === "own"));
    const later = model.features.find((feature) => model.features.indexOf(feature) > model.features.indexOf(owner) && feature.shared.includes(sharedRow.id));
    // req: R-1015
    check("feature requirement filter retains a row for earlier receiver, owner, and later receiver", Boolean(sharedRow && sees(sharedRow.receiver.id) && sees(owner.id) && sees(later.id)));
  }
  {
    const { root } = fixture("hostile");
    const ledgerPath = path.join(root, "REQUIREMENTS.md");
    fs.writeFileSync(ledgerPath, fs.readFileSync(ledgerPath, "utf8").replace("byte-identical product reports.", "byte-identical product reports </script><img src=x onerror=alert(1)>."));
    const handoffPath = path.join(root, "HANDOFF.md");
    const handoff = fs.readFileSync(handoffPath, "utf8").replace("- **[optional, since 2026-10-10] Push main.**", "- **[optional, since 2026-10-10] Push main.** </script><img src=x onerror=alert(1)>");
    fs.writeFileSync(handoffPath, handoff);
    const out = path.join(temp, "hostile.html"); await generateReport({ root, out });
    const html = fs.readFileSync(out, "utf8");
    const dataScripts = [...html.matchAll(/<script id="report-data" type="application\/json">/g)];
    // req: R-1019
    check("hostile ledger markup remains inert data", dataScripts.length === 1 && !html.includes("<img src=x onerror=alert(1)>"));
  }
  {
    const root = { children: [], appendChild(node) { this.children.push(node); }, replaceChildren(...nodes) { this.children = nodes; } };
    const made = [];
    const document = { getElementById: () => root, createElement: (tag) => { const node = { tag, children: [], appendChild(child) { this.children.push(child); }, append(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, setAttribute() {}, addEventListener() {} }; made.push(node); return node; }, createTextNode: (text) => ({ text: String(text) }) };
    renderInto(document, { commit: "a".repeat(40), date: "2026-10-11T00:00:00Z", clean: true, capabilities: [], features: [], violated: [], asks: [{ kind: "optional", since: "2026-10-10", title: "<img onerror=alert(1)>", body: "<script>bad</script>" }] });
    // req: R-1019
    check("renderer inserts all dynamic strings only through text nodes", made.every((node) => !("innerHTML" in node) && !("outerHTML" in node)) && root.children.length > 0 && !made.some((node) => node.tag === "script"));
  }
  {
    const { root } = fixture("crlf");
    fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), fs.readFileSync(path.join(root, "REQUIREMENTS.md"), "utf8").replaceAll("\n", "\r\n"));
    const out = path.join(temp, "crlf.html");
    let succeeded = true; try { await generateReport({ root, out }); } catch { succeeded = false; }
    // req: R-1014
    check("CRLF ledger is normalized before parsing", succeeded && fs.readFileSync(out, "utf8").includes("CAP-01"));
  }
  {
    const { root } = fixture("bad-tree");
    fs.appendFileSync(path.join(root, "REQUIREMENTS.md"), "\n| R-9999 | malformed row | implemented | — |\n");
    const out = path.join(temp, "bad-tree.html"); let error = "";
    try { await generateReport({ root, out }); } catch (caught) { error = caught.message; }
    // req: R-1025
    check("tree-checker problems are named and refuse output", /tree checker/i.test(error) && error.includes("R-9999") && !fs.existsSync(out));
  }
  {
    const { root } = fixture("bad-ask");
    fs.appendFileSync(path.join(root, "HANDOFF.md"), "\n## Open for the owner\n- **[optional, since 2026-10-10] Missing title grammar\n");
    const out = path.join(temp, "bad-ask.html"); let error = "";
    try { await generateReport({ root, out }); } catch (caught) { error = caught.message; }
    // req: R-1030
    check("malformed ask is named and refuses output", /HANDOFF.*line/i.test(error) && !fs.existsSync(out));
    const invalidDateRoot = fixture("bad-ask-date").root;
    fs.appendFileSync(path.join(invalidDateRoot, "HANDOFF.md"), "\n## Open for the owner\n- **[optional, since 2026-99-99] Bad date.** body\n");
    const invalidDateOut = path.join(temp, "bad-ask-date.html"); let dateError = "";
    try { await generateReport({ root: invalidDateRoot, out: invalidDateOut }); } catch (caught) { dateError = caught.message; }
    check("malformed ask date is named and refuses output", /HANDOFF.*line/i.test(dateError) && !fs.existsSync(invalidDateOut));
    const unknownKindRoot = fixture("bad-ask-kind").root;
    fs.appendFileSync(path.join(unknownKindRoot, "HANDOFF.md"), "\n## Open for the owner\n- **[mystery, since 2026-10-10] Unknown kind.** body\n");
    const unknownKindOut = path.join(temp, "bad-ask-kind.html"); let kindError = "";
    try { await generateReport({ root: unknownKindRoot, out: unknownKindOut }); } catch (caught) { kindError = caught.message; }
    // req: R-1030
    check("unknown ask kind is named and refuses output", /HANDOFF.*line \d+: malformed/i.test(kindError) && !fs.existsSync(unknownKindOut), kindError);
  }
  {
    const { root, git } = fixture("store-valid");
    const commit = git(["rev-parse", "HEAD"]).stdout.trim();
    const storePath = writeStore(root, [makeAssessment(root, commit)]);
    // req: R-1020 R-1027
    check("validates assessment store schema and uniqueness", validateStore({ root, storePath }).length === 0, JSON.stringify(validateStore({ root, storePath })));
    // req: R-1027
    check("missing assessment store is valid and empty", validateStore({ root, storePath: path.join(root, "missing.json") }).length === 0);
    const cases = [
      ["root keys", (s) => { s.extra = true; }],
      ["version", (s) => { s.version = 2; }],
      ["feature keys", (s) => { s.features[0].extra = true; }],
      ["feature identifier", (s) => { s.features[0].id = "FEAT-00"; }],
      ["feature prose type", (s) => { s.features[0].what_it_does = 2; }],
      ["nonempty prose", (s) => { s.features[0].gaps = [""]; }],
      ["rating enum", (s) => { s.features[0].maturity = "great"; }],
      ["real date", (s) => { s.features[0].date = "2026-02-30"; }],
      ["stamp keys", (s) => { s.features[0].stamp.extra = true; }],
      ["full commit hash", (s) => { s.features[0].stamp.commit = "abc"; }],
      ["feature status", (s) => { s.features[0].stamp.status = "invalid"; }],
      ["row keys", (s) => { s.features[0].stamp.rows[0].extra = true; }],
      ["requirement identifier", (s) => { s.features[0].stamp.rows[0].id = "R-01"; }],
      ["row mark enum", (s) => { s.features[0].stamp.rows[0].mark = "maybe"; }],
      ["row status enum", (s) => { s.features[0].stamp.rows[0].status = "invalid"; }],
      ["fingerprint format", (s) => { s.features[0].stamp.rows[0].sha256 = "xyz"; }],
      ["duplicate row", (s) => { s.features[0].stamp.rows.push({ ...s.features[0].stamp.rows[0] }); }],
      ["duplicate feature", (s) => { s.features.push(structuredClone(s.features[0])); }],
    ];
    const checks = cases.map(([name, mutate], i) => {
      const assessment = makeAssessment(root, commit);
      const store = { version: 1, features: [assessment] };
      mutate(store);
      const target = path.join(temp, `invalid-store-${i}.json`);
      fs.writeFileSync(target, JSON.stringify(store));
      return [name, validateStore({ root, storePath: target }).length > 0];
    });
    // req: R-1027
    check("rejects every closed-schema and uniqueness violation", checks.every(([, passed]) => passed), JSON.stringify(checks.filter(([, passed]) => !passed)));
  }
  {
    const { root, git } = fixture("store-history");
    const firstHash = git(["rev-parse", "HEAD"]).stdout.trim();
    const originalAssessment = makeAssessment(root, firstHash, "FEAT-039");
    const storePath = writeStore(root, [originalAssessment]);
    fs.appendFileSync(path.join(root, "REQUIREMENTS.md"), "\\n<!-- later ledger revision -->\\n");
    git(["add", "REQUIREMENTS.md"]); git(["commit", "-qm", "second ledger"]);
    const calls = [];
    const runner = (args, options) => { calls.push(args); return spawnSync("git", args, options); };
    // req: R-1020 R-1026
    check("validates assessment stamps against their historical ledger", validateStore({ root, storePath, gitRunner: runner }).length === 0 && calls.some((args) => args.join(" ") === `show ${firstHash}:REQUIREMENTS.md`), JSON.stringify(validateStore({ root, storePath, gitRunner: runner })));
    const stampMutations = [
      (a) => { a.stamp.rows[0].status = a.stamp.rows[0].status === "implemented" ? "untested" : "implemented"; },
      (a) => { a.stamp.rows[0].sha256 = "0".repeat(64); },
      (a) => { const shared = a.stamp.rows.find((row) => row.mark === "shared"); if (shared) shared.mark = "own"; },
      (a) => { a.stamp.purpose += " changed"; },
      (a) => { a.stamp.status = "retired (change)"; },
    ];
    const historicalMismatches = stampMutations.map((mutate) => {
      const changed = structuredClone(originalAssessment); mutate(changed);
      fs.writeFileSync(storePath, JSON.stringify({ version: 1, features: [changed] }));
      return validateStore({ root, storePath }).length > 0;
    });
    // req: R-1026
    check("rejects forged historical row status, fingerprint, mark, purpose and feature status", historicalMismatches.every(Boolean), JSON.stringify(historicalMismatches));
    const unknownPath = writeStore(root, [makeAssessment(root, "0".repeat(40))]);
    const unknown = validateStore({ root, storePath: unknownPath });
    // req: R-1026
    check("unknown stamped commit asks for full history", unknown.some((problem) => problem.includes("0".repeat(40)) && /fetch full history/i.test(problem)));
  }
  {
    const { root, git } = fixture("store-invalid-rules");
    // FEAT-002's own rows are all implemented in the live ledger (handoff-pins flips its last
    // eight); a "solid rating has an unready own row" check needs a fixture with one, so this
    // commits a fixture-local downgrade before stamping — built the same way the
    // planned-own-row block below builds its own, but to "untested" and for FEAT-002.
    const invalidLedgerPath = path.join(root, "REQUIREMENTS.md");
    const invalidLedgerText = fs.readFileSync(invalidLedgerPath, "utf8");
    const invalidParsedLedger = parseLedger(invalidLedgerText);
    const invalidFeatureHeading = invalidParsedLedger.headings.find((heading) => heading.id === "FEAT-002");
    const invalidFeatureRows = readRequirementRows(invalidParsedLedger).filter((row) => { for (let heading = row.heading; heading; heading = heading.parent) if (heading === invalidFeatureHeading) return true; return false; });
    const invalidUntestedRow = invalidFeatureRows[0];
    let invalidNormalizedLedger = invalidLedgerText;
    for (const row of invalidFeatureRows) {
      const oldLine = `| ${row.id} | ${row.requirement} | ${row.status} | ${row.evidence} |`;
      invalidNormalizedLedger = invalidNormalizedLedger.replace(oldLine, oldLine.replace(`| ${row.status} |`, "| implemented |"));
    }
    const oldUntestedRow = `| ${invalidUntestedRow.id} | ${invalidUntestedRow.requirement} | implemented | ${invalidUntestedRow.evidence} |`;
    fs.writeFileSync(invalidLedgerPath, invalidNormalizedLedger.replace(oldUntestedRow, oldUntestedRow.replace("| implemented |", "| untested |")));
    git(["add", "REQUIREMENTS.md"]); git(["commit", "-qm", "untested own row"]);
    const commit = git(["rev-parse", "HEAD"]).stdout.trim();
    const invalid = makeAssessment(root, commit, "FEAT-002");
    invalid.maturity = "solid";
    const solidPath = writeStore(root, [invalid]);
    const proseFields = ["what_it_does", "maturity_reason", "next_step", "gaps", "risks", "decisions"];
    const digitCases = proseFields.map((field) => {
      const candidate = structuredClone(invalid);
      if (Array.isArray(candidate[field])) candidate[field] = ["Contains 2 digits"];
      else candidate[field] = "Contains 2 digits";
      fs.writeFileSync(solidPath, JSON.stringify({ version: 1, features: [candidate] }));
      return validateStore({ root, storePath: solidPath }).some((problem) => /digit|what_it_does|maturity_reason|next_step|gaps|risks|decisions/i.test(problem));
    });
    fs.writeFileSync(solidPath, JSON.stringify({ version: 1, features: [invalid] }));
    const problems = validateStore({ root, storePath: solidPath });
    // req: R-1023 R-1024
    check("rejects digits in every assessment prose field", digitCases.every(Boolean), JSON.stringify(digitCases));
    // req: R-1024
    check("rejects solid ratings with unready own rows", problems.some((problem) => /solid/i.test(problem)), JSON.stringify(problems));
    const plannedRoot = fixture("solid-planned-own-row");
    const plannedLedgerPath = path.join(plannedRoot.root, "REQUIREMENTS.md");
    const plannedLedger = fs.readFileSync(plannedLedgerPath, "utf8");
    const parsed = parseLedger(plannedLedger);
    const plannedFeature = parsed.headings.find((heading) => heading.id === "FEAT-039");
    const featureRows = readRequirementRows(parsed).filter((row) => { for (let heading = row.heading; heading; heading = heading.parent) if (heading === plannedFeature) return true; return false; });
    const plannedRow = featureRows[0];
    let normalizedPlannedLedger = plannedLedger;
    for (const row of featureRows) {
      const oldLine = `| ${row.id} | ${row.requirement} | ${row.status} | ${row.evidence} |`;
      normalizedPlannedLedger = normalizedPlannedLedger.replace(oldLine, oldLine.replace(`| ${row.status} |`, "| implemented |"));
    }
    const oldRow = `| ${plannedRow.id} | ${plannedRow.requirement} | implemented | ${plannedRow.evidence} |`;
    fs.writeFileSync(plannedLedgerPath, normalizedPlannedLedger.replace(oldRow, oldRow.replace("| implemented |", "| planned |")));
    plannedRoot.git(["add", "REQUIREMENTS.md"]); plannedRoot.git(["commit", "-qm", "planned own row"]);
    const plannedAssessment = makeAssessment(plannedRoot.root, plannedRoot.git(["rev-parse", "HEAD"]).stdout.trim(), "FEAT-039");
    plannedAssessment.maturity = "solid";
    const plannedStore = writeStore(plannedRoot.root, [plannedAssessment]);
    const plannedProblems = validateStore({ root: plannedRoot.root, storePath: plannedStore });
    // req: R-1024
    check("rejects solid ratings with planned own rows", plannedProblems.some((problem) => /solid/i.test(problem)), JSON.stringify(plannedProblems));
  }
  {
    const { root, git } = fixture("store-normalization");
    const ledgerPath = path.join(root, "REQUIREMENTS.md");
    fs.writeFileSync(ledgerPath, fs.readFileSync(ledgerPath, "utf8").split("\n").map((line) => `${line}  `).join("\r\n"));
    git(["add", "REQUIREMENTS.md"]); git(["commit", "-qm", "normalized ledger"]);
    const commit = git(["rev-parse", "HEAD"]).stdout.trim();
    const storePath = writeStore(root, [makeAssessment(root, commit)]);
    // req: R-1020 R-1022
    check("fingerprints ignore CRLF and trailing whitespace", validateStore({ root, storePath }).length === 0, JSON.stringify(validateStore({ root, storePath })));
  }
  {
    const { root, git } = fixture("packets");
    const initialCommit = git(["rev-parse", "HEAD"]).stdout.trim();
    const storePath = writeStore(root, [makeAssessment(root, initialCommit, "FEAT-039"), makeAssessment(root, initialCommit, "FEAT-002")]);
    const ledgerPath = path.join(root, "REQUIREMENTS.md");
    fs.writeFileSync(ledgerPath, fs.readFileSync(ledgerPath, "utf8").replace("Purpose: Rebuild one report of the product, its features, their requirements and the decisions waiting on the owner, from the repo at any commit from its first build on.", "Purpose: Rebuild one report of the product, its features, requirements and decisions waiting on the owner, from the repo at any commit from its first build on."));
    git(["add", "REQUIREMENTS.md"]); git(["commit", "-qm", "change feature purpose"]);
    const firstDir = path.join(temp, "packets-first");
    const secondDir = path.join(temp, "packets-second");
    await generatePackets({ root, dir: firstDir }); await generatePackets({ root, dir: secondDir });
    const names = fs.readdirSync(firstDir).sort();
    const packet = JSON.parse(fs.readFileSync(path.join(firstDir, "FEAT-039.json"), "utf8"));
    const unassessed = JSON.parse(fs.readFileSync(path.join(firstDir, "FEAT-001.json"), "utf8"));
    const currentModel = await buildReport({ root });
    const expectedNames = currentModel.features.filter((feature) => feature.assessmentState !== "current").map((feature) => `${feature.id}.json`).sort();
    const allPacketsIdentical = names.every((name) => fs.readFileSync(path.join(firstDir, name)).equals(fs.readFileSync(path.join(secondDir, name))));
    const currentFeatureHasNoPacket = !names.includes("FEAT-002.json");
    const expectedPacketRows = (await buildReport({ root })).features.find((feature) => feature.id === "FEAT-039").rows.map(({ id, mark, requirement, status, evidence }) => ({ id, mark, requirement, status, evidence }));
    const staleAssessmentCandidate = { ...packet.assessment, id: packet.feature.id, stamp: packet.stamp };
    const unassessedCandidate = { id: unassessed.feature.id, what_it_does: "Current prose without digits.", maturity: "partial", maturity_reason: "Some checks remain open.", gaps: ["A missing check."], risks: ["A stale result."], decisions: ["A future choice."], next_step: "Run the full suite.", written_by: "seat", checked_by: "reviewer", date: "2026-10-11", stamp: unassessed.stamp };
    const guidedEntries = [structuredClone(packet.assessment)];
    for (const candidate of [staleAssessmentCandidate, unassessedCandidate]) {
      const existingIndex = guidedEntries.findIndex((entry) => entry.id === candidate.id);
      if (existingIndex >= 0) guidedEntries[existingIndex] = candidate;
      else guidedEntries.push(candidate);
    }
    const roundTripPath = writeStore(root, guidedEntries);
    // req: R-1029
    check("writes deterministic stale and unassessed packets with HEAD stamps and a validating round trip", names.includes("FEAT-039.json") && packet.version === 1 && Object.keys(packet).sort().join(",") === "assessment,differences,feature,rows,stamp,version" && Object.keys(packet.feature).sort().join(",") === "id,label,purpose,status" && packet.feature.purpose.includes("requirements") && packet.rows.every((row) => Object.keys(row).sort().join(",") === "evidence,id,mark,requirement,status") && JSON.stringify(packet.rows) === JSON.stringify(expectedPacketRows) && packet.assessment?.id === "FEAT-039" && packet.stamp.commit === git(["rev-parse", "HEAD"]).stdout.trim() && packet.stamp.rows.length === packet.rows.length && packet.differences.purpose?.was && packet.differences.purpose?.now && unassessed.assessment === null && unassessed.differences.added.length === 0 && unassessed.rows.some((row) => row.mark === "shared") && currentFeatureHasNoPacket && JSON.stringify(names) === JSON.stringify(expectedNames) && allPacketsIdentical && validateStore({ root, storePath: roundTripPath }).length === 0);
    // req: R-1029
    check("refresh guide recipe copies packet IDs, replaces stale entries, appends unassessed entries, and validates", staleAssessmentCandidate.id === packet.feature.id && unassessedCandidate.id === unassessed.feature.id && guidedEntries.length === 2 && guidedEntries.some((entry) => entry.id === packet.feature.id && entry.stamp.commit === packet.stamp.commit) && guidedEntries.some((entry) => entry.id === unassessed.feature.id && entry.stamp.commit === unassessed.stamp.commit) && validateStore({ root, storePath: roundTripPath }).length === 0);
    const packetSource = fs.readFileSync(path.join(ROOT, "scripts/product-report.mjs"), "utf8");
    const earlyRefusal = packetSource.indexOf("if (initialEntries.length)");
    const buildAfterRefusal = packetSource.indexOf("const model = await buildReport", earlyRefusal);
    const refusalDir = path.join(temp, "packets-nonempty"); fs.mkdirSync(refusalDir); fs.writeFileSync(path.join(refusalDir, "keep"), "untouched");
    let refused = false; try { await generatePackets({ root, dir: refusalDir }); } catch { refused = true; }
    // req: R-1029
    check("refuses non-empty packet directories without writing", refused && fs.readFileSync(path.join(refusalDir, "keep"), "utf8") === "untouched" && fs.readdirSync(refusalDir).join(",") === "keep" && earlyRefusal >= 0 && buildAfterRefusal > earlyRefusal);
    check("accepts an empty packet directory", await generatePackets({ root, dir: path.join(temp, "packets-empty") }).then(() => true, () => false));
  }
  {
    const { root } = fixture("dirty-packet-ledger");
    fs.appendFileSync(path.join(root, "REQUIREMENTS.md"), "\\n<!-- uncommitted ledger change -->\\n");
    const target = path.join(temp, "dirty-packets"); let message = "";
    try { await generatePackets({ root, dir: target }); } catch (error) { message = error.message; }
    // req: R-1029
    check("packets refuse while REQUIREMENTS.md differs from HEAD without writing", /commit REQUIREMENTS\.md first/.test(message) && !fs.existsSync(target));
  }
  {
    const { root, git } = fixture("staleness");
    const commit = git(["rev-parse", "HEAD"]).stdout.trim();
    const storePath = writeStore(root, [makeAssessment(root, commit, "FEAT-039")]);
    const baseline = await (await import("../../../scripts/product-report.mjs")).buildReport({ root });
    check("stamped assessment is current while its ledger matches", baseline.model.features.find((feature) => feature.id === "FEAT-039")?.assessmentState === "current");
    const ledgerPath = path.join(root, "REQUIREMENTS.md");
    fs.writeFileSync(ledgerPath, fs.readFileSync(ledgerPath, "utf8").replace("Purpose: Rebuild one report of the product, its features, their requirements and the decisions waiting on the owner, from the repo at any commit from its first build on.", "Purpose: Rebuild one report of the product, its features, their requirements and decisions waiting on the owner, from the repo at any commit from its first build on.").replace("## FEAT-039 · See the product and its decisions in one report\nPurpose: Rebuild one report of the product, its features, their requirements and decisions waiting on the owner, from the repo at any commit from its first build on.\nStatus: active", "## FEAT-039 · See the product and its decisions in one report\nPurpose: Rebuild one report of the product, its features, their requirements and decisions waiting on the owner, from the repo at any commit from its first build on.\nStatus: frozen (fixture)"));
    git(["add", "REQUIREMENTS.md"]); git(["commit", "-qm", "later ledger"]);
    const report = await (await import("../../../scripts/product-report.mjs")).buildReport({ root });
    const feature = report.model.features.find((item) => item.id === "FEAT-039");
    // req: R-1028
    check("unassessed feature state is explicit", report.model.features.find((item) => item.id === "FEAT-002")?.assessmentState === "unassessed");
    // req: R-1021
    check("outdated feature names purpose and status changes and carries full difference shape", feature?.assessmentState === "out of date" && feature.differences.purpose?.was && feature.differences.purpose?.now && feature.differences.status?.was === "active" && feature.differences.status?.now === "frozen (fixture)" && Array.isArray(feature.differences.added) && Array.isArray(feature.differences.removed) && Array.isArray(feature.differences.changed));
    check("stale feature preserves the assessment", feature?.assessment?.id === "FEAT-039" && fs.existsSync(storePath));
    const moved = fixture("moved-home-shared");
    const oldCommit = moved.git(["rev-parse", "HEAD"]).stdout.trim();
    writeStore(moved.root, [makeAssessment(moved.root, oldCommit, "FEAT-039")]);
    const oldLedger = fs.readFileSync(path.join(moved.root, "REQUIREMENTS.md"), "utf8");
    const oldParsed = parseLedger(oldLedger);
    const targetFeature = oldParsed.headings.find((heading) => heading.id === "FEAT-039");
    const ownRow = readRequirementRows(oldParsed).find((row) => { for (let heading = row.heading; heading; heading = heading.parent) if (heading === targetFeature) return true; return false; });
    const movedLine = `| ${ownRow.id} | ${ownRow.requirement} | ${ownRow.status} | ${ownRow.evidence} |`;
    const homeLine = oldParsed.lines.findIndex((line) => line === movedLine);
    const newHomeTable = oldParsed.tables.find((table) => { for (let heading = table.heading; heading; heading = heading.parent) if (heading.id === "FEAT-002") return true; return false; });
    const updatedLines = [...oldParsed.lines];
    updatedLines.splice(homeLine, 1);
    updatedLines.splice(newHomeTable.rowLines.at(-1), 0, movedLine);
    const appliesLine = updatedLines.findIndex((line) => line.startsWith("Also applies: R-287,"));
    updatedLines[appliesLine] += `, ${ownRow.id}`;
    fs.writeFileSync(path.join(moved.root, "REQUIREMENTS.md"), updatedLines.join("\n"));
    moved.git(["add", "REQUIREMENTS.md"]); moved.git(["commit", "-qm", "move row home and share it back"]);
    const movedReport = await buildReport({ root: moved.root });
    const movedFeature = movedReport.model.features.find((item) => item.id === "FEAT-039");
    // req: R-1021
    check("row moved home and shared back is named as changed", movedFeature?.assessmentState === "out of date" && movedFeature.differences.changed.includes(ownRow.id), JSON.stringify({ state: movedFeature?.assessmentState, id: ownRow.id, changed: movedFeature?.differences.changed, added: movedFeature?.differences.added, removed: movedFeature?.differences.removed }));
  }
  {
    const cases = ["added", "removed", "text", "status"];
    const renderedDifferences = [];
    for (const kind of cases) {
      const repo = fixture(`rendered-difference-${kind}`);
      const commit = repo.git(["rev-parse", "HEAD"]).stdout.trim();
      writeStore(repo.root, [makeAssessment(repo.root, commit, "FEAT-039")]);
      const ledgerPath = path.join(repo.root, "REQUIREMENTS.md");
      const parsed = parseLedger(fs.readFileSync(ledgerPath, "utf8"));
      const feature = parsed.headings.find((heading) => heading.id === "FEAT-039");
      const own = readRequirementRows(parsed).find((row) => { for (let heading = row.heading; heading; heading = heading.parent) if (heading === feature) return true; return false; });
      const rowLine = `| ${own.id} | ${own.requirement} | ${own.status} | ${own.evidence} |`;
      const lines = fs.readFileSync(ledgerPath, "utf8").split("\n");
      const at = lines.indexOf(rowLine);
      if (kind === "added") lines.splice(at + 1, 0, "| R-9998 | The fixture shall name its added requirement. | implemented | Added fixture evidence. |");
      if (kind === "removed") lines.splice(at, 1);
      if (kind === "text") lines[at] = rowLine.replace(own.requirement, `${own.requirement} Changed fixture wording.`);
      if (kind === "status") lines[at] = rowLine.replace(`| ${own.status} |`, `| ${own.status === "implemented" ? "untested" : "implemented"} |`);
      fs.writeFileSync(ledgerPath, lines.join("\n"));
      repo.git(["add", "REQUIREMENTS.md"]); repo.git(["commit", "-qm", `change ${kind}`]);
      const report = await buildReport({ root: repo.root });
      const item = report.features.find((entry) => entry.id === "FEAT-039");
      const rootNode = { children: [], replaceChildren(...children) { this.children = children; }, appendChild(child) { this.children.push(child); } };
      const make = (tag) => { const node = { tag, children: [], attrs: {}, appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, setAttribute(key, value) { this.attrs[key] = value; }, addEventListener() {} }; Object.defineProperty(node, "textContent", { get() { return this.children.map((child) => child.textContent ?? child.text ?? "").join(""); }, set(value) { this.children = [{ text: String(value) }]; } }); return node; };
      const document = { getElementById: () => rootNode, createElement: make, createTextNode: (value) => ({ text: String(value), get textContent() { return this.text; } }) };
      renderInto(document, report, { hash: "#FEAT-039" });
      const flattened = [rootNode, ...rootNode.children.flatMap((child) => [child, ...(child.children ?? [])])];
      const difference = kind === "added" ? `Added rows: R-9998` : kind === "removed" ? `Removed rows: ${own.id}` : `Changed rows: ${own.id}`;
      renderedDifferences.push(item.assessmentState === "out of date" && item.differences[kind === "text" || kind === "status" ? "changed" : kind].includes(kind === "added" ? "R-9998" : own.id) && flattened.some((node) => node.tag === "p" && node.textContent === difference));
    }
    // req: R-1021
    check("rendered difference sections name added, removed, text-changed, and status-changed rows", renderedDifferences.length === 4 && renderedDifferences.every(Boolean), JSON.stringify(renderedDifferences));
  }
  {
    const { root } = fixture("cited-tests");
    setRowEvidence(root, "R-1013", "`packages/nana-pack/tests/widget.test.mjs::renders the widget`, `tests/test_widget.py::test_renders`, `other-repo:packages/nana-pack/tests/widget.test.mjs::renders the widget`, `Known gap: manual review only.`");
    const out = path.join(temp, "cited-tests.html");
    await generateReport({ root, out });
    const html = fs.readFileSync(out, "utf8");
    const detail = renderHtmlAt(html, "#FEAT-039");
    const requirements = renderHtmlAt(html, "#requirements");
    const expectedTests = [{ title: "renders the widget", file: "packages/nana-pack/tests/widget.test.mjs" }, { title: "test_renders", file: "tests/test_widget.py" }];
    const checkView = (view) => { const items = testItemsOf(cardFor(view, "R-1013")); return items.length === 2 && expectedTests.every((expected) => items.some((item) => item.textContent.includes(expected.title) && item.textContent.includes(expected.file))); };
    // req: R-1510
    check("R-1510: each cited test is its own item with title and file as separate text, for TypeScript and Python citations, and external or prose citations are not listed",
      checkView(detail) && checkView(requirements),
      JSON.stringify({ detail: testItemsOf(cardFor(detail, "R-1013")).map((i) => i.textContent), requirements: testItemsOf(cardFor(requirements, "R-1013")).map((i) => i.textContent) }));
  }
  {
    const { root, git } = fixture("origin-links");
    setRowEvidence(root, "R-1014", "`packages/nana-pack/tests/thing.test.mjs::does the thing`");
    setRowEvidence(root, "R-1015", "`packages/nana-pack/tests/../../../etc/passwd.test.mjs::traversal attempt`");
    const commit = git(["rev-parse", "HEAD"]).stdout.trim();
    const expectedHref = `https://github.com/example-org/example-repo/blob/${commit}/packages/nana-pack/tests/thing.test.mjs`;
    const renderCard = async (label, rowId) => {
      const out = path.join(temp, `origin-links-${label}.html`);
      await generateReport({ root, out });
      const html = fs.readFileSync(out, "utf8");
      const view = renderHtmlAt(html, "#FEAT-039");
      return testItemsOf(cardFor(view, rowId))[0];
    };
    const setOrigin = (url) => { git(["remote", "remove", "origin"]); if (url) git(["remote", "add", "origin", url]); };
    const spellings = [
      ["https", "https://github.com/example-org/example-repo.git"],
      ["ssh", "ssh://git@github.com/example-org/example-repo.git"],
      ["scp", "git@github.com:example-org/example-repo.git"],
      ["https-no-git", "https://github.com/example-org/example-repo"],
    ];
    const spellingResults = [];
    for (const [label, url] of spellings) {
      setOrigin(url);
      const item = await renderCard(label, "R-1014");
      const link = item?.children.find((child) => child.tag === "a");
      spellingResults.push([label, Boolean(link) && link.attrs.href === expectedHref && link.attrs.target === "_blank" && link.attrs.rel === "noopener noreferrer"]);
    }
    setOrigin(null);
    const noOriginItem = await renderCard("none", "R-1014");
    setOrigin("https://gitlab.com/example-org/example-repo.git");
    const otherHostItem = await renderCard("other-host", "R-1014");
    setOrigin("https://user:pass@github.com/example-org/example-repo.git");
    const credentialsItem = await renderCard("credentials", "R-1014");
    setOrigin("https://github.com/example-org/example-repo.git");
    const traversalItem = await renderCard("traversal", "R-1015");
    const hasLink = (item) => Boolean(item?.children.some((child) => child.tag === "a"));
    // req: R-1511
    check("R-1511: cited test files link in a new tab to their GitHub page at the report's commit for each GitHub origin spelling, and nothing links otherwise",
      spellingResults.every(([, ok]) => ok) && !hasLink(noOriginItem) && !hasLink(otherHostItem) && !hasLink(credentialsItem) && !hasLink(traversalItem) && (traversalItem?.textContent ?? "").includes("traversal attempt"),
      JSON.stringify({ spellingResults, noOrigin: hasLink(noOriginItem), otherHost: hasLink(otherHostItem), credentials: hasLink(credentialsItem), traversal: hasLink(traversalItem) }));
  }
  {
    const { root, git } = fixture("run-state");
    setRowEvidence(root, "R-1016", "`packages/nana-pack/tests/cited-one.test.mjs::covers one`, `tests/cited_two.py::covers_two`");
    fs.writeFileSync(path.join(root, ".gitattributes"), "* -text\n");
    const testsDir = path.join(root, "packages", "nana-pack", "tests");
    fs.mkdirSync(testsDir, { recursive: true });
    fs.writeFileSync(path.join(testsDir, "cited-one.test.mjs"), "// cited fixture one\n");
    fs.mkdirSync(path.join(root, "tests"), { recursive: true });
    fs.writeFileSync(path.join(root, "tests", "cited_two.py"), "# cited fixture two\n");
    git(["add", "-A"]); git(["commit", "-qm", "cited fixture files"]);
    const hashOne = createHash("sha256").update(fs.readFileSync(path.join(testsDir, "cited-one.test.mjs"))).digest("hex");
    const hashTwo = createHash("sha256").update(fs.readFileSync(path.join(root, "tests", "cited_two.py"))).digest("hex");
    writeRuntimeFile(root, {
      schema: 1,
      hashes: { "packages/nana-pack/tests/cited-one.test.mjs": hashOne, "tests/cited_two.py": hashTwo },
      tests: {
        "packages/nana-pack/tests/cited-one.test.mjs": { label: "PASS", seconds: 1.1, ran: ["packages/nana-pack/tests/cited-one.test.mjs"] },
        "tests/cited_two.py": { label: "FAIL", seconds: 0.4, ran: ["tests/cited_two.py"] },
      },
    });
    const checkoutOut = path.join(temp, "run-state-checkout.html");
    await generateReport({ root, out: checkoutOut });
    const worktreeDir = path.join(temp, "run-state-worktree");
    git(["worktree", "add", "--detach", worktreeDir]);
    const worktreeOut = path.join(temp, "run-state-worktree.html");
    await generateReport({ root: worktreeDir, out: worktreeOut });
    const itemsFor = (htmlPath) => testItemsOf(cardFor(renderHtmlAt(fs.readFileSync(htmlPath, "utf8"), "#FEAT-039"), "R-1016"));
    const checkoutItems = itemsFor(checkoutOut);
    const worktreeItems = itemsFor(worktreeOut);
    const hasLabel = (items, file, label) => items.some((item) => item.textContent.includes(file) && /file.*last measured run:/i.test(item.textContent) && item.textContent.includes(label));
    // req: R-1512
    check("R-1512: a cited test shows its file's recorded PASS, FAIL or SKIP worded as the file's result, read from the clone's runtime data in a checkout and a linked worktree",
      hasLabel(checkoutItems, "packages/nana-pack/tests/cited-one.test.mjs", "PASS") && hasLabel(checkoutItems, "tests/cited_two.py", "FAIL") &&
      hasLabel(worktreeItems, "packages/nana-pack/tests/cited-one.test.mjs", "PASS") && hasLabel(worktreeItems, "tests/cited_two.py", "FAIL"),
      JSON.stringify({ checkout: checkoutItems.map((i) => i.textContent), worktree: worktreeItems.map((i) => i.textContent) }));
  }
  {
    const { root } = fixture("changed-since");
    setRowEvidence(root, "R-1013", "`packages/nana-pack/tests/r1513-a.test.mjs::a`");
    setRowEvidence(root, "R-1014", "`packages/nana-pack/tests/r1513-b.test.mjs::b`");
    setRowEvidence(root, "R-1015", "`packages/nana-pack/tests/r1513-c.test.mjs::c`");
    setRowEvidence(root, "R-1016", "`packages/nana-pack/tests/r1513-d.test.mjs::d`");
    const testsDir = path.join(root, "packages", "nana-pack", "tests");
    fs.mkdirSync(testsDir, { recursive: true });
    const write = (name, content) => { fs.writeFileSync(path.join(testsDir, name), content); return createHash("sha256").update(content).digest("hex"); };
    const hashA = write("r1513-a.test.mjs", "unchanged\n");
    const hashB = write("r1513-b.test.mjs", "original\n");
    const hashC = write("r1513-c.test.mjs", "will be deleted\n");
    const hashD = write("r1513-d.test.mjs", "unchanged too\n");
    const depPath = path.join(root, "packages", "nana-pack", "lib", "r1513-dep.mjs");
    fs.mkdirSync(path.dirname(depPath), { recursive: true });
    fs.writeFileSync(depPath, "original dep\n");
    const depHash = createHash("sha256").update("original dep\n").digest("hex");
    writeRuntimeFile(root, {
      schema: 1,
      hashes: {
        "packages/nana-pack/tests/r1513-a.test.mjs": hashA,
        "packages/nana-pack/tests/r1513-b.test.mjs": hashB,
        "packages/nana-pack/tests/r1513-c.test.mjs": hashC,
        "packages/nana-pack/tests/r1513-d.test.mjs": hashD,
        "packages/nana-pack/lib/r1513-dep.mjs": depHash,
      },
      tests: {
        "packages/nana-pack/tests/r1513-a.test.mjs": { label: "PASS", seconds: 1, ran: ["packages/nana-pack/tests/r1513-a.test.mjs"] },
        "packages/nana-pack/tests/r1513-b.test.mjs": { label: "PASS", seconds: 1, ran: ["packages/nana-pack/tests/r1513-b.test.mjs"] },
        "packages/nana-pack/tests/r1513-c.test.mjs": { label: "PASS", seconds: 1, ran: ["packages/nana-pack/tests/r1513-c.test.mjs"] },
        "packages/nana-pack/tests/r1513-d.test.mjs": { label: "PASS", seconds: 1, ran: ["packages/nana-pack/tests/r1513-d.test.mjs", "packages/nana-pack/lib/r1513-dep.mjs"] },
      },
    });
    fs.writeFileSync(path.join(testsDir, "r1513-b.test.mjs"), "changed\n");
    fs.rmSync(path.join(testsDir, "r1513-c.test.mjs"));
    fs.writeFileSync(depPath, "changed dep\n");
    const out = path.join(temp, "changed-since.html");
    await generateReport({ root, out });
    const html = fs.readFileSync(out, "utf8");
    const view = renderHtmlAt(html, "#FEAT-039");
    const itemFor = (rowId) => testItemsOf(cardFor(view, rowId))[0];
    const changedSince = (item) => /changed since/i.test(item?.textContent ?? "");
    // req: R-1513
    check("R-1513: a recorded label is marked changed when the test file or a file it ran changed or is gone since the run, and unmarked otherwise",
      !changedSince(itemFor("R-1013")) && changedSince(itemFor("R-1014")) && changedSince(itemFor("R-1015")) && changedSince(itemFor("R-1016")),
      JSON.stringify({ a: itemFor("R-1013")?.textContent, b: itemFor("R-1014")?.textContent, c: itemFor("R-1015")?.textContent, d: itemFor("R-1016")?.textContent }));
  }
  {
    const { root } = fixture("no-run-state");
    setRowEvidence(root, "R-1013", "`packages/nana-pack/tests/r1514.test.mjs::cited`");
    const runtimeDir = path.join(root, ".git", "nana");
    const runtimeFile = path.join(runtimeDir, "runtime-map.json");
    fs.mkdirSync(runtimeDir, { recursive: true });
    const render = async (label) => {
      const out = path.join(temp, `no-run-state-${label}.html`);
      await generateReport({ root, out });
      const html = fs.readFileSync(out, "utf8");
      const view = renderHtmlAt(html, "#FEAT-039");
      return testItemsOf(cardFor(view, "R-1013"))[0];
    };
    const results = {};
    results.missing = await render("missing");
    fs.writeFileSync(runtimeFile, "{not json");
    results.unreadable = await render("unreadable");
    fs.writeFileSync(runtimeFile, JSON.stringify({ schema: 2, hashes: {}, tests: {} }));
    results.otherSchema = await render("other-schema");
    fs.writeFileSync(runtimeFile, JSON.stringify({ schema: 1, hashes: {}, tests: {} }));
    results.silent = await render("silent");
    const noRecorded = (item) => /no recorded run/i.test(item?.textContent ?? "") && !/\b(PASS|FAIL|SKIP)\b/.test(item?.textContent ?? "");
    // req: R-1514
    check("R-1514: missing, unreadable, other-schema or silent runtime data shows no recorded run and never a label",
      Object.values(results).every(noRecorded),
      JSON.stringify(Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v?.textContent]))));
  }
  {
    const { root } = fixture("none-cited");
    setRowEvidence(root, "R-1013", "`No test in this repository covers this; manual review only.`");
    setRowEvidence(root, "R-1014", "`packages/nana-pack/tests/r1515.test.mjs::cited`");
    const out = path.join(temp, "none-cited.html");
    await generateReport({ root, out });
    const html = fs.readFileSync(out, "utf8");
    const view = renderHtmlAt(html, "#FEAT-039");
    const noneCard = cardFor(view, "R-1013");
    const citedCard = cardFor(view, "R-1014");
    const noneText = "Tests: none cited in this repository";
    // req: R-1515
    check("R-1515: a row citing no test in this repository says so, and a row citing one does not",
      (noneCard?.textContent ?? "").includes(noneText) && !(citedCard?.textContent ?? "").includes(noneText),
      JSON.stringify({ none: noneCard?.textContent, cited: citedCard?.textContent }));
  }
  {
    const { root } = fixture("not-passed");
    // Block-local: setRowEvidence (above) keeps a row's status, so this sets both the status and
    // the evidence a fixture row needs (build-brief-1.md amendment 4).
    const setRowStatusAndEvidence = (id, status, evidence) => {
      const ledgerPath = path.join(root, "REQUIREMENTS.md");
      const text = fs.readFileSync(ledgerPath, "utf8");
      const target = readRequirementRows(parseLedger(text)).find((candidate) => candidate.id === id);
      if (!target) throw new Error(`fixture row ${id} not found`);
      const lines = text.split("\n");
      lines[target.line - 1] = `| ${target.id} | ${target.requirement} | ${status} | ${evidence} |`;
      fs.writeFileSync(ledgerPath, lines.join("\n"));
    };
    const testsDir = path.join(root, "packages", "nana-pack", "tests");
    fs.mkdirSync(testsDir, { recursive: true });
    const hashes = {};
    const runs = {};
    // Fixture-only file names no real row cites (build-brief-1.md): np-*.test.mjs. Each measured
    // one is written to disk and hashed; the two behind R-1030 and R-1040 are rewritten afterwards
    // so their recorded label survives while they read as changed since (R-1654).
    const measure = (name, label) => {
      const file = `packages/nana-pack/tests/${name}`;
      const content = `// ${name}\n`;
      fs.writeFileSync(path.join(testsDir, name), content);
      hashes[file] = createHash("sha256").update(content).digest("hex");
      runs[file] = { label, seconds: 0.1, ran: [] };
    };
    for (const [name, label] of [
      ["np-skip-1.test.mjs", "SKIP"], ["np-skip-2.test.mjs", "SKIP"], ["np-skip-3.test.mjs", "SKIP"],
      ["np-pass-1.test.mjs", "PASS"], ["np-pass-2.test.mjs", "PASS"], ["np-skip-4.test.mjs", "SKIP"],
      ["np-pass-3.test.mjs", "PASS"], ["np-fail-1.test.mjs", "FAIL"], ["np-pass-4.test.mjs", "PASS"],
      ["np-fail-2.test.mjs", "FAIL"], ["np-fail-3.test.mjs", "FAIL"], ["np-skip-5.test.mjs", "SKIP"],
      ["np-changed-skip.test.mjs", "SKIP"], ["np-changed-pass.test.mjs", "PASS"], ["np-control-skip.test.mjs", "SKIP"],
    ]) measure(name, label);

    setRowStatusAndEvidence("R-1020", "implemented", "`packages/nana-pack/tests/np-skip-1.test.mjs::skip one`");
    setRowStatusAndEvidence("R-1021", "implemented", "`packages/nana-pack/tests/np-skip-2.test.mjs::skip two`, `packages/nana-pack/tests/np-skip-3.test.mjs::skip three`");
    setRowStatusAndEvidence("R-1022", "implemented", "`packages/nana-pack/tests/np-pass-1.test.mjs::pass one`");
    setRowStatusAndEvidence("R-1023", "implemented", "`packages/nana-pack/tests/np-pass-2.test.mjs::pass two`, `packages/nana-pack/tests/np-skip-4.test.mjs::skip four`");
    setRowStatusAndEvidence("R-1024", "implemented", "`packages/nana-pack/tests/np-pass-3.test.mjs::pass three`, `packages/nana-pack/tests/np-unmeasured-1.test.mjs::unmeasured one`");
    setRowStatusAndEvidence("R-1025", "implemented", "`packages/nana-pack/tests/np-fail-1.test.mjs::fail one`");
    setRowStatusAndEvidence("R-1026", "implemented", "`packages/nana-pack/tests/np-pass-4.test.mjs::pass four`, `packages/nana-pack/tests/np-fail-2.test.mjs::fail two`");
    setRowStatusAndEvidence("R-1027", "implemented", "`packages/nana-pack/tests/np-fail-3.test.mjs::fail three`, `packages/nana-pack/tests/np-unmeasured-2.test.mjs::unmeasured two`");
    setRowStatusAndEvidence("R-1028", "implemented", "`packages/nana-pack/tests/np-unmeasured-3.test.mjs::unmeasured three`");
    setRowStatusAndEvidence("R-1029", "implemented", "`packages/nana-pack/tests/np-skip-5.test.mjs::skip five`, `packages/nana-pack/tests/np-unmeasured-4.test.mjs::unmeasured four`");
    setRowStatusAndEvidence("R-1030", "implemented", "`packages/nana-pack/tests/np-changed-skip.test.mjs::changed skip`");
    setRowStatusAndEvidence("R-1040", "implemented", "`packages/nana-pack/tests/np-changed-pass.test.mjs::changed pass`");
    setRowStatusAndEvidence("R-1041", "untested", "`packages/nana-pack/tests/np-control-skip.test.mjs::control skip`");

    writeRuntimeFile(root, { schema: 1, hashes, tests: runs });
    // R-1654: rewritten after being recorded, so each keeps its recorded label but reads as changed.
    fs.writeFileSync(path.join(testsDir, "np-changed-skip.test.mjs"), "// np-changed-skip.test.mjs, changed\n");
    fs.writeFileSync(path.join(testsDir, "np-changed-pass.test.mjs"), "// np-changed-pass.test.mjs, changed\n");

    // R-1655's discriminator must prove the heading counts the LISTED rows and not the ledger's
    // VIOLATED rows, without depending on how many rows the live REQUIREMENTS.md this fixture
    // was copied from happens to mark violated right now — that count drifts with the ledger
    // (build-brief-2.md: an honest split there once collided it with the heading's 6 by
    // coincidence). The fixture pins its own count instead: every row the copy started out
    // violated is neutralized, and exactly one unrelated row is forced violated, so the number
    // compared against is fixed by construction, never 6.
    const VIOLATED_COUNT = 1;
    {
      const ledgerPath = path.join(root, "REQUIREMENTS.md");
      const text = fs.readFileSync(ledgerPath, "utf8");
      const lines = text.split("\n");
      for (const row of readRequirementRows(parseLedger(text)))
        if (row.status === "violated") lines[row.line - 1] = `| ${row.id} | ${row.requirement} | untested | ${row.evidence} |`;
      fs.writeFileSync(ledgerPath, lines.join("\n"));
    }
    setRowStatusAndEvidence("R-1042", "violated", "fixture-controlled violated row for the R-1655 discriminator");

    const out = path.join(temp, "not-passed.html");
    await generateReport({ root, out });
    const view = renderHtmlAt(fs.readFileSync(out, "utf8"), "#issues");
    const headingRe = /^Implemented rows that did not pass in this clone's last measured run: (\d+)$/;
    const headingIndex = view.root.children.findIndex((node) => node.tag === "h3" && headingRe.test(node.textContent));
    const heading = view.root.children[headingIndex];
    const headingCount = heading ? Number(headingRe.exec(heading.textContent)[1]) : null;
    const listedCards = headingIndex === -1 ? [] : view.root.children.slice(headingIndex + 1).filter((node) => node.tag === "article");
    const listedIds = listedCards.map((card) => card.children.find((child) => child.tag === "h3")?.textContent.trim().split(" ")[0]);
    // R-1040 is excluded from the Issues list by design (PASS, no FAIL), so it has no card there;
    // the "changed since" mark on both is read from the detail view, which shows every row.
    const detailView = renderHtmlAt(fs.readFileSync(out, "utf8"), "#FEAT-039");
    const changedSinceTextOf = (id) => testItemsOf(cardFor(detailView, id))[0]?.textContent ?? "";

    const { root: noRuntimeRoot } = fixture("not-passed-no-runtime");
    const noRuntimeOut = path.join(temp, "not-passed-no-runtime.html");
    await generateReport({ root: noRuntimeRoot, out: noRuntimeOut });
    const noRuntimeView = renderHtmlAt(fs.readFileSync(noRuntimeOut, "utf8"), "#issues");
    const noRuntimeHeading = noRuntimeView.root.children.find((node) => node.tag === "h3" && headingRe.test(node.textContent));
    const noRuntimeCount = noRuntimeHeading ? Number(headingRe.exec(noRuntimeHeading.textContent)[1]) : null;

    // req: R-1650
    check("R-1650: an implemented row whose cited files all last ran SKIP, one file or two, is listed as not passed, and an untested row citing such a file is not",
      listedIds.includes("R-1020") && listedIds.includes("R-1021") && !listedIds.includes("R-1041"),
      JSON.stringify(listedIds));
    // req: R-1651
    check("R-1651: an implemented row citing a failing file is listed as not passed, alone, beside a passing file and beside a file with no recorded run",
      listedIds.includes("R-1025") && listedIds.includes("R-1026") && listedIds.includes("R-1027"),
      JSON.stringify(listedIds));
    // req: R-1652
    check("R-1652: an implemented row citing a passing file and no failing one, alone or beside a skipped file or a file with no recorded run, is left out of the not-passed list",
      Boolean(heading) && !listedIds.includes("R-1022") && !listedIds.includes("R-1023") && !listedIds.includes("R-1024") && listedIds.includes("R-1020"),
      JSON.stringify({ heading: Boolean(heading), listedIds }));
    // req: R-1653
    check("R-1653: a row citing a file with no recorded run, alone or beside a skipped file, is left out, and with no runtime data the not-passed list is empty",
      Boolean(heading) && !listedIds.includes("R-1028") && !listedIds.includes("R-1029") && listedIds.includes("R-1020") && noRuntimeCount === 0,
      JSON.stringify({ heading: Boolean(heading), listedIds, noRuntimeCount }));
    // req: R-1654
    check("R-1654: a label marked changed since still decides, so a row whose only file last ran SKIP and changed since is listed and one whose only file last ran PASS and changed since is not",
      listedIds.includes("R-1030") && !listedIds.includes("R-1040") && /changed since/i.test(changedSinceTextOf("R-1030")) && /changed since/i.test(changedSinceTextOf("R-1040")),
      JSON.stringify({ listedIds, r1030: changedSinceTextOf("R-1030"), r1040: changedSinceTextOf("R-1040") }));
    // req: R-1655
    check("R-1655: the not-passed heading states the number of rows listed under it",
      Boolean(heading) && headingCount === listedCards.length &&
      JSON.stringify([...listedIds].sort()) === JSON.stringify(["R-1020", "R-1021", "R-1025", "R-1026", "R-1027", "R-1030"].sort()) &&
      view.model.violated.length === VIOLATED_COUNT && headingCount !== VIOLATED_COUNT,
      JSON.stringify({ headingCount, listedIds, violated: view.model.violated.length }));
  }
  {
    // req: R-1027
    check("validateStore accepts the real repository without a store", (await validateStore()).length === 0);
  }
  {
    // T13/T14: spawn the report CLI (exercises the Windows leg's main guard and .ts import),
    // on ledgers with no HANDOFF.md and no git — a refusal here is the ledger's, not a missing
    // HANDOFF or git.
    const REPORT_CLI = path.join(ROOT, "scripts/product-report.mjs");
    const runReport = (args, cwd) => spawnSync(process.execPath, [REPORT_CLI, ...args], { cwd, encoding: "utf8" });
    const NODE_WARNING = [/^\(node:\d+\) /, /^Reparsing as ES module because/, /^To eliminate this warning, add "type": "module"/, /^\(Use `node --trace-warnings/];
    const noWarn = (s) => (s ?? "").split("\n").filter((l) => l && !NODE_WARNING.some((re) => re.test(l)));
    const writeLedger = (name, content) => { const dir = path.join(temp, name); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, "REQUIREMENTS.md"), content); return dir; };

    let flat = "# A flat ledger\n\n## 1. Things\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n";
    for (let i = 1; i <= 1000; i++) flat += `| R-${String(i).padStart(3, "0")} | The thing numbered ${i} shall work. | untested | — |\n`;
    const flatDir = writeLedger("cli-flat1000", flat);
    const flatOut = path.join(temp, "cli-flat1000.html");
    const flatRun = runReport(["--root", flatDir, "--out", flatOut], temp);
    const flatErr = noWarn(flatRun.stderr);
    const flatNoTreeLines = flatErr.filter((l) => /\b1000 requirement rows\b/.test(l) && /no requirements tree yet/.test(l) && /requirements skill/.test(l));
    // req: R-1159
    check("a ledger with rows and no tree is refused with one problem line, not one per row",
      flatRun.status === 1 && flatNoTreeLines.length === 1 &&
      !flatErr.some((l) => l.includes("not in a feature or subgroup table")) && !fs.existsSync(flatOut),
      flatErr.join(" | "));

    const TREE1 = "# CAP-01 · Cap\nPurpose: capability\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | The thing shall work. | untested | — |\n";
    const utf16 = (s) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, "utf16le")]);
    const utf16Dir = path.join(temp, "cli-utf16");
    fs.mkdirSync(utf16Dir, { recursive: true });
    fs.writeFileSync(path.join(utf16Dir, "REQUIREMENTS.md"), utf16(TREE1));
    const utf16Out = path.join(temp, "cli-utf16.html");
    const utf16Run = runReport(["--root", utf16Dir, "--out", utf16Out], temp);
    const utf16Err = noWarn(utf16Run.stderr).join("\n");

    const NOROWS = "# CAP-01 · Cap\nPurpose: capability\n\n## FEAT-001 · Feature\nPurpose: feature\nStatus: active\n";
    const norowsDir = writeLedger("cli-norows", NOROWS);
    const norowsOut = path.join(temp, "cli-norows.html");
    const norowsRun = runReport(["--root", norowsDir, "--out", norowsOut], temp);
    const norowsErr = noWarn(norowsRun.stderr).join("\n");

    // req: R-1160
    check("a UTF-16 ledger and a ledger with no rows are refused by the report, naming the reason, and build no page",
      utf16Run.status === 1 && /NUL/.test(utf16Err) && /UTF-16/.test(utf16Err) && !fs.existsSync(utf16Out) &&
      norowsRun.status === 1 && /no requirement rows/.test(norowsErr) && !fs.existsSync(norowsOut),
      `${utf16Err} / ${norowsErr}`);
  }
  {
    const { root } = fixture("open-questions-numbers");
    // A deterministic Deliberate omissions bullet, so a parser that reads past the heading
    // boundary (W5) picks up a fixed, recognizable line rather than whatever the real section
    // says today.
    setLedgerSection(root, "## Deliberate omissions", ["- An omission."]);
    setLedgerSection(root, "## Open questions", [
      "Unruled decisions, numbered.",
      "",
      "- (lane, 2026-10-01) A bullet question.",
      "1. First **bold** question.",
      "6b. Lettered `code` question.",
      "6. Six after six-b.",
      "12. (origin) Long question",
      "    continued one",
      "    continued two.",
      "",
    ], { eol: "\r\n" });
    const out = path.join(temp, "open-questions-numbers.html");
    await generateReport({ root, out });
    const nodes = renderPageAt(fs.readFileSync(out, "utf8"));
    const list = nodes.find((node) => node.tag === "ul" && node.attrs?.class === "open-questions");
    const items = (list?.children ?? []).filter((node) => node.tag === "li").map((node) => node.textContent);
    const expected = [
      "(lane, 2026-10-01) A bullet question.",
      "1. First bold question.",
      "6b. Lettered code question.",
      "6. Six after six-b.",
      "12. (origin) Long question continued one continued two.",
    ];
    // req: R-1570
    check("R-1570: the Decisions view lists every open question with its number and full text in file order",
      JSON.stringify(items) === JSON.stringify(expected), JSON.stringify(items));
  }
  {
    const NO_OPEN_QUESTIONS = "Open questions: none recorded in REQUIREMENTS.md";
    const saysNone = (nodes) => nodes.filter((node) => node.tag === "p" && node.textContent === NO_OPEN_QUESTIONS).length === 1
      && nodes.filter((node) => node.tag === "ul" && node.attrs?.class === "open-questions").length === 0;

    const noHeading = fixture("open-questions-no-heading");
    setLedgerSection(noHeading.root, "## Open questions", [], { keepHeading: false });
    const noHeadingOut = path.join(temp, "open-questions-no-heading.html");
    await generateReport({ root: noHeading.root, out: noHeadingOut });
    const noHeadingWritten = fs.existsSync(noHeadingOut);
    const noHeadingNodes = noHeadingWritten ? renderPageAt(fs.readFileSync(noHeadingOut, "utf8")) : [];

    const preamble = fixture("open-questions-preamble");
    setLedgerSection(preamble.root, "## Open questions", ["Unruled decisions, numbered."]);
    const preambleOut = path.join(temp, "open-questions-preamble.html");
    await generateReport({ root: preamble.root, out: preambleOut });
    const preambleWritten = fs.existsSync(preambleOut);
    const preambleNodes = preambleWritten ? renderPageAt(fs.readFileSync(preambleOut, "utf8")) : [];

    // req: R-1571
    check("R-1571: a ledger with no open questions heading, or none under it, still writes the page and says none are recorded",
      noHeadingWritten && preambleWritten && saysNone(noHeadingNodes) && saysNone(preambleNodes),
      JSON.stringify({
        noHeading: noHeadingNodes.filter((n) => n.tag === "p" || n.tag === "ul").map((n) => [n.tag, n.textContent]),
        preamble: preambleNodes.filter((n) => n.tag === "p" || n.tag === "ul").map((n) => [n.tag, n.textContent]),
      }));
  }
  {
    const ledger = [
      "# CAP-30 · Guard rails", "Purpose: constrain the stages.", "Outcome: stages stay safe.", "Kind: constraint", "Binds: CAP-33", "",
      "## FEAT-030 · Guard feature", "Purpose: guard the work.", "Status: active", "", table([["R-3000", "implemented"]]),
      "# CAP-31 · Legacy loop", "Purpose: keep the loop.", "Outcome: the loop works.", "",
      "## FEAT-031 · Loop feature", "Purpose: loop the work.", "Status: active", "", table([["R-3001", "implemented"]]),
      "# CAP-32 · Build base", "Purpose: build an artifact.", "Outcome: the base exists.", "Kind: product", "",
      "## FEAT-032 · Base feature", "Purpose: make the base.", "Status: active", "", table([["R-3002", "implemented"]]),
      "# CAP-33 · Use base", "Purpose: consume the artifact.", "Outcome: the artifact is used.", "Kind: product", "Needs: CAP-32", "",
      "## FEAT-033 · Consumer feature", "Purpose: use the base.", "Status: active", "", table([["R-3003", "implemented"]]),
    ].join("\n");
    const current = treeFixture("stage-order", ledger);
    const out = path.join(temp, "stage-order.html");
    await generateReport({ root: current.root, out });
    const product = renderHtmlAt(fs.readFileSync(out, "utf8"), "#product");
    const order = capabilityCards(product).map((card) => card.children.find((node) => node.tag === "h3")?.textContent.split(" · ")[0]);
    const need = capabilityCard(product, "CAP-33")?.children.find((node) => node.tag === "p" && node.textContent.startsWith("Needs:"));

    const historicalLedger = spawnSync("git", ["show", "5548d4c2:REQUIREMENTS.md"], { cwd: ROOT, encoding: "utf8" }).stdout;
    const historical = treeFixture("historical-stage-order", historicalLedger, fs.readFileSync(path.join(ROOT, "HANDOFF.md"), "utf8"));
    const historicalOut = path.join(temp, "historical-stage-order.html");
    await generateReport({ root: historical.root, out: historicalOut });
    const oldProduct = renderHtmlAt(fs.readFileSync(historicalOut, "utf8"), "#product");
    const oldCapabilityIds = parseLedger(historicalLedger).headings.filter((heading) => heading.id.startsWith("CAP-")).map((heading) => heading.id);
    const oldCards = capabilityCards(oldProduct);
    const oldOrder = oldCards.map((card) => card.children[0]?.textContent.split(" · ")[0]);
    const oldShape = oldCards.every((card) => card.children[0]?.tag === "h3" && card.children[1]?.tag === "p" && card.children[1]?.textContent.startsWith("Purpose: ") && card.children[2]?.tag === "p" && card.children[2]?.textContent.startsWith("Outcome: ") && card.children.slice(3).every((node, index) => node.tag === (index % 2 === 0 ? "p" : "div")));
    // req: R-2450
    check("R-2450: the Product view orders product, then kindless, then constraint capabilities, in document order within each, and a product card names its needs", JSON.stringify(order) === JSON.stringify(["CAP-32", "CAP-33", "CAP-31", "CAP-30"]) && need?.textContent === "Needs: CAP-32 · Build base" && pinsKindedHeadings(product, [["CAP-30", "Guard rails"], ["CAP-32", "Build base"], ["CAP-33", "Use base"]]) && JSON.stringify(oldOrder) === JSON.stringify(oldCapabilityIds) && oldShape, JSON.stringify({ order, need: need?.textContent, oldOrder, oldShape }));
  }
  {
    const withFields = [
      "# CAP-40 · First stage", "Purpose: hold the first stage.", "Outcome: first work ships.", "Kind: product", "",
      "## FEAT-040 · First active", "Purpose: use a constraint.", "Status: active", "Also applies: R-4100, R-4103", "", table([["R-4000", "implemented"]]),
      "# CAP-41 · Second stage", "Purpose: hold the second stage.", "Outcome: second work ships.", "Kind: product", "",
      "## FEAT-042 · Second frozen", "Purpose: use an unchecked constraint.", "Status: frozen (fixture)", "Also applies: R-4101", "", table([["R-4103", "implemented"]]),
      "# CAP-42 · Third stage", "Purpose: hold the third stage.", "Outcome: third work ships.", "Kind: product", "",
      "## FEAT-041 · Third proposed", "Purpose: propose a constraint use.", "Status: proposed", "Also applies: R-4102", "",
      "# CAP-43 · Unbound stage", "Purpose: hold an unbound stage.", "Outcome: unbound work ships.", "Kind: product", "",
      "## FEAT-044 · Unbound active", "Purpose: use a constraint outside the bind.", "Status: active", "Also applies: R-4102", "", table([["R-4003", "implemented"]]),
      "# CAP-44 · Safety constraint", "Purpose: constrain selected stages.", "Outcome: selected stages are covered.", "Kind: constraint", "Binds: CAP-40, CAP-41, CAP-42", "",
      "## FEAT-045 · Constraint checks", "Purpose: own the checks.", "Status: active", "", table([["R-4100", "implemented"], ["R-4101", "untested"], ["R-4102", "implemented"]]),
    ].join("\n");
    const withoutFields = withFields.split("\n").filter((line) => !/^(?:Kind|Deliverables|Needs|Binds|Retired):/.test(line)).join("\n");
    const repo = treeFixture("constraint-coverage", withoutFields);
    const stampedCommit = repo.git(["rev-parse", "HEAD"]).stdout.trim();
    const storePath = writeStore(repo.root, [makeAssessment(repo.root, stampedCommit, "FEAT-040")]);
    const before = await buildReport({ root: repo.root });
    fs.writeFileSync(path.join(repo.root, "REQUIREMENTS.md"), withFields);
    repo.git(["add", "REQUIREMENTS.md"]); repo.git(["commit", "-qm", "add capability fields"]);
    const after = await buildReport({ root: repo.root });
    const invariant = before.features.every((feature) => { const changed = after.features.find((item) => item.id === feature.id); return changed && JSON.stringify([feature.counts, feature.shared, feature.sharedBy, feature.assessmentState]) === JSON.stringify([changed.counts, changed.shared, changed.sharedBy, changed.assessmentState]); });
    const out = path.join(temp, "constraint-coverage.html");
    await generateReport({ root: repo.root, out });
    const product = renderHtmlAt(fs.readFileSync(out, "utf8"), "#product");
    const card = capabilityCard(product, "CAP-44");
    const bound = card?.children.flatMap((node) => node.tag === "ul" ? node.children : []).filter((node) => node.attrs?.class?.split(" ").includes("bound")) ?? [];
    const exact = [
      ["CAP-40 · First stage", "R-4100", false],
      ["CAP-41 · Second stage", "gap", true],
      ["CAP-42 · Third stage", "gap", true],
    ].every(([name, value, gap], index) => bound[index]?.textContent.includes(name) && bound[index]?.textContent.includes(value) && bound[index]?.attrs.class.includes("gap") === gap);
    // req: R-2451
    check("R-2451: a constraint card lists each bound capability with its implemented shared constraint rows, or a gap", bound.length === 3 && exact && !card?.textContent.includes("CAP-43") && !card?.textContent.includes("R-4102") && !card?.textContent.includes("R-4103") && invariant && validateStore({ root: repo.root, storePath }).length === 0 && pinsKindedHeadings(product, [["CAP-40", "First stage"], ["CAP-41", "Second stage"], ["CAP-42", "Third stage"], ["CAP-43", "Unbound stage"], ["CAP-44", "Safety constraint"]]), JSON.stringify({ bound: bound.map((item) => [item.textContent, item.attrs.class]), invariant, store: validateStore({ root: repo.root, storePath }) }));
  }
  {
    const ledger = [
      "# CAP-50 · Product stage", "Purpose: produce deliverables.", "Outcome: deliverables are visible.", "Kind: product", "Deliverables: R-5003, R-5000, R-5002, R-5001", "",
      "## FEAT-050 · Direct homes", "Purpose: own direct deliverables.", "Status: active", "", table([["R-5000", "implemented"], ["R-5003", "violated"]]),
      "## FEAT-051 · Grouped homes", "Purpose: own grouped deliverables.", "Status: active", "",
      "### SUB-050 · Group", "Purpose: group deliverables.", "", table([["R-5001", "untested"], ["R-5002", "planned"]]),
      "# CAP-51 · Consumer stage", "Purpose: consume deliverables.", "Outcome: consumers work.", "Kind: product", "Needs: CAP-50", "",
      "## FEAT-052 · First consumer", "Purpose: consume two rows.", "Status: active", "Also applies: R-5000, R-5001", "", table([["R-5100", "implemented"]]),
      "## FEAT-053 · Second consumer", "Purpose: consume one row.", "Status: frozen (fixture)", "Also applies: R-5000", "", table([["R-5101", "implemented"]]),
    ].join("\n");
    const repo = treeFixture("deliverables", ledger);
    const out = path.join(temp, "deliverables.html");
    await generateReport({ root: repo.root, out });
    const product = renderHtmlAt(fs.readFileSync(out, "utf8"), "#product");
    const card = capabilityCard(product, "CAP-50");
    const items = card?.children.flatMap((node) => node.tag === "ul" ? node.children : []).filter((node) => node.attrs?.class?.split(" ").includes("deliverable")) ?? [];
    const byId = Object.fromEntries(items.map((item) => [item.textContent.slice(0, 6), item]));
    const links = (id) => (byId[id]?.children ?? []).filter((node) => node.tag === "a").map((node) => [node.textContent, node.attrs.href]);
    const expectedOrder = ["R-5003", "R-5000", "R-5002", "R-5001"];
    const statuses = { "R-5003": "violated", "R-5000": "implemented", "R-5002": "planned", "R-5001": "untested" };
    const itemFacts = expectedOrder.every((id) => byId[id]?.textContent.includes(statuses[id]) && byId[id]?.attrs.class.includes("gap") === (id !== "R-5000"));
    // req: R-2452
    check("R-2452: a product card lists its deliverables in line order with status and home, and marks every one not implemented as a gap", JSON.stringify(items.map((item) => item.textContent.slice(0, 6))) === JSON.stringify(expectedOrder) && itemFacts && JSON.stringify(links("R-5000")) === JSON.stringify([["FEAT-050 · Direct homes", "#FEAT-050"]]) && JSON.stringify(links("R-5001")) === JSON.stringify([["FEAT-051 · Grouped homes", "#FEAT-051"]]) && pinsKindedHeadings(product, [["CAP-50", "Product stage"], ["CAP-51", "Consumer stage"]]), JSON.stringify(items.map((item) => [item.textContent, item.attrs.class, (item.children ?? []).filter((node) => node.tag === "a").map((node) => [node.textContent, node.attrs.href])])));
  }
  await withinCaseLimit("R-2542", async () => {
    const notMadeByCode = "not made by code";
    const notReadByCode = "not read by code";
    const noArtifactNamed = "no artifact named";
    const ledger = [
      "# CAP-50 · Product stage", "Purpose: produce deliverables.", "Outcome: deliverables are visible.", "Kind: product", "Deliverables: R-5000, R-5001, R-5002, R-5003, R-5004, R-5005, R-5006, R-5007, R-5008",
      "Made by: R-5000 · session start: REQUIREMENTS.md · REQUIREMENTS.md\t", "Read by: R-5000 · code: REQUIREMENTS.md  ",
      "Made by: R-5001 · manual: a person writes it", "Read by: R-5001 · rule: a rule reads it",
      "Made by: R-5002 · land: REQUIREMENTS.md", "Read by: R-5002 · person: a person reads it",
      "Made by: R-5003 · manual: a person writes it", "Read by: R-5003 · prompt: REQUIREMENTS.md",
      "Made by: R-5004 · manual: first maker", "Read by: R-5004 · code: REQUIREMENTS.md", "Made by: R-5004 · suite: REQUIREMENTS.md",
      "Made by: R-5006 · land", "Read by: R-5006 · code: REQUIREMENTS.md",
      "Made by: R-5007 · suite: REQUIREMENTS.md", "Read by: R-5007 · code",
      "Made by: R-5008 · land: REQUIREMENTS.md · REQUIREMENTS.md · extra", "Read by: R-5008 · code: REQUIREMENTS.md", "",
      "## FEAT-050 · Direct homes", "Purpose: own direct deliverables.", "Status: active", "", table([["R-5000", "implemented"], ["R-5001", "implemented"], ["R-5002", "implemented"], ["R-5003", "implemented"], ["R-5004", "implemented"], ["R-5005", "implemented"], ["R-5006", "implemented"], ["R-5007", "implemented"], ["R-5008", "implemented"]]).trimEnd(),
      "# CAP-51 · Consumer stage", "Purpose: consume deliverables.", "Outcome: consumers work.", "Kind: product", "Deliverables: R-5100", "Made by: R-5000 · build: REQUIREMENTS.md", "Made by: R-5100 · build: REQUIREMENTS.md", "Read by: R-5100 · code: REQUIREMENTS.md", "",
      "## FEAT-052 · First consumer", "Purpose: consume two rows.", "Status: active", "Also applies: R-5000, R-5001", "", table([["R-5100", "implemented"]]).trimEnd(),
    ].join("\r\n");
    const repo = treeFixture("deliverable-claims", ledger);
    const out = path.join(temp, "deliverable-claims.html");
    await generateReport({ root: repo.root, out });
    const product = renderHtmlAt(fs.readFileSync(out, "utf8"), "#product");
    const card = capabilityCard(product, "CAP-50");
    const items = card?.children.flatMap((node) => node.tag === "ul" ? node.children : []).filter((node) => node.attrs?.class?.split(" ").includes("deliverable")) ?? [];
    const allItems = capabilityCards(product).flatMap((capability) => capability.children.flatMap((node) => node.tag === "ul" ? node.children : []).filter((node) => node.attrs?.class?.split(" ").includes("deliverable")));
    const byId = Object.fromEntries(items.map((item) => [item.textContent.slice(0, 6), item]));
    const claims = (id) => (byId[id]?.children.find((node) => node.tag === "ul" && node.attrs?.class === "deliverable-claims")?.children ?? []).map((node) => node.textContent.replace(/ · last changed .*$/, ""));
    const mark = (id, value) => byId[id]?.textContent.includes(value) ?? false;
    const expectedClaims = {
      "R-5000": ["Made by: session start: REQUIREMENTS.md · REQUIREMENTS.md", "Read by: code: REQUIREMENTS.md"],
      "R-5001": ["Made by: manual: a person writes it", "Read by: rule: a rule reads it"],
      "R-5004": ["Made by: manual: first maker", "Read by: code: REQUIREMENTS.md", "Made by: suite: REQUIREMENTS.md"],
      "R-5006": ["Made by: land", "Read by: code: REQUIREMENTS.md"],
      "R-5007": ["Made by: suite: REQUIREMENTS.md", "Read by: code"],
      "R-5008": ["Made by: land: REQUIREMENTS.md · REQUIREMENTS.md · extra", "Read by: code: REQUIREMENTS.md"],
    };
    const countLine = product.root.children.find((node) => node.attrs?.class === "deliverable-report-line" && /^deliverables:/.test(node.textContent))?.textContent ?? "";
    const count = /^deliverables: (\d+) of (\d+) made and read by code$/.exec(countLine);
    const withNeitherMark = allItems.filter((item) => !item.textContent.includes(notMadeByCode) && !item.textContent.includes(notReadByCode)).length;
    const expectedMarks = {
      "R-5000": [false, false], "R-5001": [true, true], "R-5002": [false, true], "R-5003": [true, false], "R-5004": [false, false],
      "R-5005": [true, true], "R-5006": [true, false], "R-5007": [false, true], "R-5008": [true, false],
    };
    const exactMarks = Object.entries(expectedMarks).every(([id, [made, read]]) => mark(id, notMadeByCode) === made && mark(id, notReadByCode) === read);
    const homeLinksOnly = Object.values(byId).every((item) => (item.children ?? []).filter((node) => node.tag === "a").length === 1);
    const claimsStayOwned = !claims("R-5000").some((value) => value.includes("build: REQUIREMENTS.md"));
    const artifactMarks = !mark("R-5000", noArtifactNamed) && ["R-5001", "R-5002", "R-5003", "R-5004", "R-5005", "R-5006", "R-5007", "R-5008"].every((id) => mark(id, noArtifactNamed));
    const exactClaims = Object.entries(expectedClaims).every(([id, expected]) => JSON.stringify(claims(id)) === JSON.stringify(expected)) && claims("R-5005").length === 0;
    // req: R-2542
    check("R-2542: a deliverable lists its own capability's maker and reader claims in ledger order with the checker's code marks, and no consumers",
      items.length === 9 && exactClaims && exactMarks && artifactMarks && claimsStayOwned && homeLinksOnly && !card?.textContent.includes("Consumers") &&
      productReportModule.NOT_MADE_BY_CODE === notMadeByCode && productReportModule.NOT_READ_BY_CODE === notReadByCode && productReportModule.NO_ARTIFACT_NAMED === noArtifactNamed &&
      count && Number(count[1]) === withNeitherMark && Number(count[2]) === allItems.length,
      JSON.stringify({ items: items.map((item) => item.textContent), claims: Object.fromEntries(Object.keys(byId).map((id) => [id, claims(id)])), countLine, exports: [productReportModule.NOT_MADE_BY_CODE, productReportModule.NOT_READ_BY_CODE, productReportModule.NO_ARTIFACT_NAMED] }));
  });
  await withinCaseLimit("R-2543", async () => {
    const ledgers = [
      ["product-lines", ["# CAP-80 · Product", "Purpose: make one.", "Outcome: one exists.", "Kind: product", "Deliverables: R-8000", "Made by: R-8000 · manual: a person makes it", "Read by: R-8000 · rule: a rule reads it", "", "## FEAT-080 · Home", "Purpose: own one.", "Status: active", "", table([["R-8000", "implemented"]]).trimEnd()].join("\r\n"), ["deliverables: 0 of 1 made and read by code"]],
      ["product-no-lines", ["# CAP-81 · Product", "Purpose: make one.", "Outcome: one exists.", "Kind: product", "Deliverables: R-8100", "", "## FEAT-081 · Home", "Purpose: own one.", "Status: active", "", table([["R-8100", "implemented"]]).trimEnd()].join("\n"), ["deliverable note: R-8100 has no readable Made by: line", "deliverable note: R-8100 has no readable Read by: line"]],
      ["kindless-one-line", ["# CAP-82 · Legacy", "Purpose: keep one.", "Outcome: one exists.", "Made by: R-8200 · manual: a person makes it", "", "## FEAT-082 · Home", "Purpose: own one.", "Status: active", "", table([["R-8200", "implemented"]]).trimEnd()].join("\n"), ["deliverables: 0 of 0 made and read by code", "deliverable note: line 4: Made by: R-8200 · manual: a person makes it is outside a live Kind: product capability"]],
      ["kindless-no-lines", ["# CAP-83 · Legacy", "Purpose: keep one.\t", "Outcome: one exists.  ", "", "## FEAT-083 · Home", "Purpose: own one.", "Status: active", "", table([["R-8300", "implemented"]]).trimEnd()].join("\n"), []],
    ];
    const comparisons = [];
    for (const [name, ledger, expected] of ledgers) {
      await withinCaseLimit(`R-2543 ${name}`, async () => {
        const repo = treeFixture(`checker-${name}`, ledger);
        const out = path.join(temp, `checker-${name}.html`);
        await generateReport({ root: repo.root, out });
        const view = renderHtmlAt(fs.readFileSync(out, "utf8"), "#product");
        const cli = spawnSync(process.execPath, [path.join(ROOT, "scripts/requirements-tree.mjs"), "--root", repo.root], { cwd: ROOT, encoding: "utf8", timeout: CASE_LIMIT_MS });
        const checkerLines = cli.stdout.trimEnd().split(/\r?\n/).slice(1);
        const pageLines = view.root.children.filter((node) => node.attrs?.class === "deliverable-report-line").map((node) => node.textContent);
        const firstCard = view.root.children.findIndex((node) => node.tag === "article");
        const lineIndexes = view.root.children.map((node, index) => node.attrs?.class === "deliverable-report-line" ? index : -1).filter((index) => index >= 0);
        comparisons.push({ name, ok: cli.status === 0 && JSON.stringify(pageLines) === JSON.stringify(checkerLines) && JSON.stringify(checkerLines) === JSON.stringify(expected) && lineIndexes.every((index) => index < firstCard), checkerLines, pageLines, expected, stderr: cli.stderr });
      });
    }
    const failingLedger = ["# CAP-84 · Product", "Purpose: make one.", "Outcome: one exists.", "Kind: product", "Deliverables: R-8400", "Made by: R-8400 · build: REQUIREMENTS.md", "Read by: R-8400 · code: REQUIREMENTS.md", "", "## FEAT-084 · Home", "Purpose: own one.", "Status: active", "", table([["R-8400", "implemented"]]).trimEnd()].join("\n");
    const failingRepo = treeFixture("checker-head-failure", failingLedger);
    const calls = [];
    const runner = (args, options) => {
      if (args.join(" ") === "ls-tree -r -z --name-only HEAD") { calls.push({ args, options }); return { status: 1, stdout: Buffer.alloc(0), stderr: Buffer.from("fixture failure") }; }
      return spawnSync("git", args, options);
    };
    const failureOut = path.join(temp, "checker-head-failure.html");
    await generateReport({ root: failingRepo.root, out: failureOut, gitRunner: runner });
    const failureView = renderHtmlAt(fs.readFileSync(failureOut, "utf8"), "#product");
    const failureLines = failureView.root.children.filter((node) => node.attrs?.class === "deliverable-report-line").map((node) => node.textContent);
    const exactFailure = "deliverable note: paths not checked: git could not read the ledger folder's HEAD tree";
    // req: R-2543
    check("R-2543: the Product view shows the tree checker's deliverable count line and notes for the same ledger and HEAD",
      comparisons.length === 4 && comparisons.every((entry) => entry.ok) && calls.length === 1 && calls[0].options.maxBuffer === MAX_GIT_BUFFER && failureLines.at(-1) === exactFailure && deliverablesModule.DELIVERABLE_PATHS_NOT_CHECKED === exactFailure,
      JSON.stringify({ comparisons, calls: calls.map((call) => ({ args: call.args, maxBuffer: call.options.maxBuffer })), failureLines, exactFailure }));
  });
  await withinCaseLimit("R-2544", async () => {
    const lastChanged = "last changed";
    const ageUnknown = "age unknown: ";
    const notTracked = "not tracked at HEAD";
    const shallowClone = "shallow clone";
    const historyFailure = "git could not read the history";
    const failures = [];
    const expectClaim = (label, view, predicate) => { const claims = renderedClaims(view); if (!predicate(claims)) failures.push({ label, claims }); };

    const core = historyFixture("artifact-core", ["artifact.txt"]);
    commitAt(core, "make artifact", "2026-01-02T00:00:00Z", { "artifact.txt": "one\n" });
    commitAt(core, "unrelated", "2026-01-03T00:00:00Z", { "other.txt": "other\n" });
    const sweep = commitAt(core, "scrub: sweep records", "2026-01-04T00:00:00Z", { "artifact.txt": "two\n", "b.txt": "b\n", "c.txt": "c\n", "d.txt": "d\n" });
    commitAt(core, "head", "2026-01-05T00:00:00Z", { "head.txt": "head\n" });
    const calls = [];
    const capturingRunner = (args, options) => { calls.push({ args, options }); return spawnSync("git", args, options); };
    const coreView = (await renderedProduct(core, "artifact-core", capturingRunner)).view;
    expectClaim("sweep and first filename", coreView, (claims) => claims.some((claim) => claim.includes(`${lastChanged} 1 commit and 1 day before HEAD by ${sweep.slice(0, 8)}: scrub: sweep records`)));
    const walk = calls.find((call) => call.args[0] === "log" && call.args.includes("--name-only"));
    if (!walk || !["-z", "-c", "--name-only", "--relative", "--root", "--no-renames", "--no-show-signature"].every((flag) => walk.args.includes(flag)) || walk.options.maxBuffer !== MAX_GIT_BUFFER) failures.push({ label: "walk flags and buffer", walk });

    const oldLane = historyFixture("artifact-old-lane", ["artifact.txt"]);
    const oldChange = commitAt(oldLane, "change artifact", "2026-02-05T00:00:00Z", { "artifact.txt": "change\n" });
    const oldLaneBase = oldLane.git(["branch", "--show-current"]).stdout.trim();
    oldLane.git(["checkout", "-qb", "lane"]);
    commitAt(oldLane, "old lane one", "2026-02-02T00:00:00Z", { "lane-one.txt": "one\n" });
    commitAt(oldLane, "old lane two", "2026-02-03T00:00:00Z", { "lane-two.txt": "two\n" });
    oldLane.git(["checkout", "-q", oldLaneBase]);
    commitAt(oldLane, "main work", "2026-02-06T00:00:00Z", { "main.txt": "main\n" });
    oldLane.git(["merge", "-q", "--no-ff", "lane", "-m", "merge old lane"], { env: { ...process.env, GIT_AUTHOR_DATE: "2026-02-07T00:00:00Z", GIT_COMMITTER_DATE: "2026-02-07T00:00:00Z" } });
    const oldCount = Number(oldLane.git(["rev-list", "--count", `${oldChange}..HEAD`]).stdout.trim());
    const oldDays = Math.max(0, Math.floor((Number(oldLane.git(["show", "-s", "--format=%ct", "HEAD"]).stdout.trim()) - Number(oldLane.git(["show", "-s", "--format=%ct", oldChange]).stdout.trim())) / (24 * 60 * 60)));
    expectClaim("parent graph count", (await renderedProduct(oldLane, "artifact-old-lane")).view, (claims) => claims.some((claim) => claim.includes(`${lastChanged} ${oldCount} commits and ${oldDays} days before HEAD by ${oldChange.slice(0, 8)}: change artifact`)));

    const merged = historyFixture("artifact-merge", ["artifact.txt"]);
    commitAt(merged, "base artifact", "2026-03-01T00:00:00Z", { "artifact.txt": "base\n" });
    const mergedBase = merged.git(["branch", "--show-current"]).stdout.trim();
    merged.git(["checkout", "-qb", "side"]);
    commitAt(merged, "side artifact", "2026-03-02T00:00:00Z", { "artifact.txt": "side\n" });
    merged.git(["checkout", "-q", mergedBase]);
    commitAt(merged, "main artifact", "2026-03-03T00:00:00Z", { "artifact.txt": "main\n" });
    merged.git(["merge", "-q", "--no-ff", "side", "-m", "merge both artifacts"], { env: { ...process.env, GIT_AUTHOR_DATE: "2026-03-04T00:00:00Z", GIT_COMMITTER_DATE: "2026-03-04T00:00:00Z" } });
    if (merged.git(["status", "--porcelain"]).stdout) { fs.writeFileSync(path.join(merged.root, "artifact.txt"), "merged\n"); merged.git(["add", "artifact.txt"]); merged.git(["commit", "-qm", "merge both artifacts"], { env: { ...process.env, GIT_AUTHOR_DATE: "2026-03-04T00:00:00Z", GIT_COMMITTER_DATE: "2026-03-04T00:00:00Z" } }); }
    const mergeHash = merged.git(["rev-parse", "HEAD"]).stdout.trim();
    expectClaim("merge change", (await renderedProduct(merged, "artifact-merge")).view, (claims) => claims.some((claim) => claim.includes(`${mergeHash.slice(0, 8)}: merge both artifacts`)));

    const zones = historyFixture("artifact-zones", ["offset.txt", "future.txt"]);
    const offset = commitAt(zones, "offset change", "2026-04-02T13:30:00+14:00", { "offset.txt": "offset\n" });
    const future = commitAt(zones, "future change", "2026-04-05T00:00:00Z", { "future.txt": "future\n" });
    commitAt(zones, "earlier dated head", "2026-04-02T12:30:00-12:00", { "head.txt": "head\n" });
    const zonesView = (await renderedProduct(zones, "artifact-zones")).view;
    expectClaim("epoch days", zonesView, (claims) => claims.some((claim) => claim.includes(`${lastChanged} 2 commits and 1 day before HEAD by ${offset.slice(0, 8)}: offset change`)));
    expectClaim("day clamp", zonesView, (claims) => claims.some((claim) => claim.includes(`${lastChanged} 1 commit and 0 days before HEAD by ${future.slice(0, 8)}: future change`)));

    const halfDay = historyFixture("artifact-half-day", ["artifact.txt"], "2026-04-01T00:00:00Z");
    const halfDayChange = commitAt(halfDay, "half-day change", "2026-04-01T00:00:00Z", { "artifact.txt": "made\n" });
    commitAt(halfDay, "36 hours later", "2026-04-02T12:00:00Z", { "head.txt": "head\n" });
    expectClaim("36 hours is one whole day", (await renderedProduct(halfDay, "artifact-half-day")).view, (claims) => claims.some((claim) => claim.includes(`${lastChanged} 1 commit and 1 day before HEAD by ${halfDayChange.slice(0, 8)}: half-day change`)));

    const folder = historyFixture("artifact-folder", ["made/"]);
    commitAt(folder, "older folder file", "2026-05-01T00:00:00Z", { "made/old.txt": "old\n" });
    const newest = commitAt(folder, "newest folder file", "2026-05-03T00:00:00Z", { "made/new.txt": "new\n" });
    commitAt(folder, "folder head", "2026-05-04T00:00:00Z", { "head.txt": "head\n" });
    expectClaim("folder newest", (await renderedProduct(folder, "artifact-folder")).view, (claims) => claims.some((claim) => claim.includes(`${newest.slice(0, 8)}: newest folder file`)));

    const subParent = path.join(temp, "artifact-sub-parent"); fs.mkdirSync(subParent, { recursive: true });
    const sub = historyFixture("ledger", ["output.txt"], "2026-06-01T00:00:00Z", subParent);
    const subGit = (args, options = {}) => spawnSync("git", args, { cwd: subParent, encoding: "utf8", ...options });
    fs.renameSync(path.join(sub.root, ".git"), path.join(subParent, ".git"));
    sub.root = subParent; sub.git = subGit;
    const subChange = commitAt(sub, "subfolder artifact", "2026-06-02T00:00:00Z", { "ledger/output.txt": "made\n" });
    commitAt(sub, "subfolder head", "2026-06-03T00:00:00Z", { "outside.txt": "head\n" });
    sub.root = path.join(subParent, "ledger");
    expectClaim("ledger-relative artifact", (await renderedProduct(sub, "artifact-subfolder")).view, (claims) => claims.some((claim) => claim.includes(`${subChange.slice(0, 8)}: subfolder artifact`)));

    const large = historyFixture("artifact-large-walk", ["artifact.txt"]);
    const largeChange = commitAt(large, "large walk artifact", "2026-07-01T00:00:00Z", { "artifact.txt": "made\n" });
    for (let index = 0; index < 10; index++) commitAt(large, `${index}-${"x".repeat(110_000)}`, `2026-07-${String(index + 2).padStart(2, "0")}T00:00:00Z`, { [`long-${index}.txt`]: `${index}\n` }, { messageFile: true });
    expectClaim("large walk buffer", (await renderedProduct(large, "artifact-large-walk")).view, (claims) => claims.some((claim) => claim.includes(`${lastChanged} 10 commits`) && claim.includes(largeChange.slice(0, 8))));

    const unknown = historyFixture("artifact-unknown", ["missing.txt"]);
    commitAt(unknown, "unknown head", "2026-08-02T00:00:00Z", { "head.txt": "head\n" });
    expectClaim("not tracked", (await renderedProduct(unknown, "artifact-unknown")).view, (claims) => claims.some((claim) => claim.includes(`${ageUnknown}${notTracked}`)));

    const shallowSource = historyFixture("artifact-shallow-source", ["artifact.txt"]);
    commitAt(shallowSource, "shallow artifact", "2026-09-01T00:00:00Z", { "artifact.txt": "made\n" });
    commitAt(shallowSource, "shallow head", "2026-09-02T00:00:00Z", { "head.txt": "head\n" });
    const shallowRoot = path.join(temp, "artifact-shallow");
    const clone = spawnSync("git", ["clone", "-q", "--depth", "1", pathToFileURL(shallowSource.root).href, shallowRoot], { encoding: "utf8" });
    const shallow = { root: shallowRoot, git: (args, options = {}) => spawnSync("git", args, { cwd: shallowRoot, encoding: "utf8", ...options }) };
    const isShallow = shallow.git(["rev-parse", "--is-shallow-repository"]).stdout.trim() === "true";
    expectClaim("shallow clone", (await renderedProduct(shallow, "artifact-shallow")).view, (claims) => isShallow && clone.status === 0 && claims.some((claim) => claim.includes(`${ageUnknown}${shallowClone}`)));

    const failed = historyFixture("artifact-walk-failure", ["artifact.txt"]);
    commitAt(failed, "failed artifact", "2026-10-01T00:00:00Z", { "artifact.txt": "made\n" });
    const failedRunner = (args, options) => args[0] === "log" && args.includes("--name-only") ? { status: 1, stdout: "", stderr: "fixture history failure" } : spawnSync("git", args, options);
    try {
      const failedRender = await renderedProduct(failed, "artifact-walk-failure", failedRunner);
      expectClaim("walk failure degrades", failedRender.view, (claims) => fs.existsSync(failedRender.out) && claims.some((claim) => claim.includes(`${ageUnknown}${historyFailure}`)));
    } catch (error) {
      failures.push({ label: "walk failure degrades", error: error instanceof Error ? error.message : String(error) });
    }

    // req: R-2544
    check("R-2544: an artifact shows the commits, days, short hash and subject of its last change as git counts them, or why its age is unknown",
      failures.length === 0 && productReportModule.LAST_CHANGED_PREFIX === lastChanged && productReportModule.AGE_UNKNOWN_PREFIX === ageUnknown && productReportModule.NOT_TRACKED_AT_HEAD === notTracked && productReportModule.SHALLOW_CLONE_REASON === shallowClone && productReportModule.GIT_HISTORY_FAILURE_REASON === historyFailure && JSON.stringify(productReportModule.ARTIFACT_WALK_FLAGS) === JSON.stringify(["-z", "-c", "--name-only", "--relative", "--root", "--no-renames", "--no-show-signature"]),
      JSON.stringify({ failures, exports: [productReportModule.LAST_CHANGED_PREFIX, productReportModule.AGE_UNKNOWN_PREFIX, productReportModule.NOT_TRACKED_AT_HEAD, productReportModule.SHALLOW_CLONE_REASON, productReportModule.GIT_HISTORY_FAILURE_REASON] }));
  });
  await withinCaseLimit("R-2545", async () => {
    const measuredAtTip = "measured at tip";
    const ageUnknown = "age unknown: ";
    const noTipOrTime = "the runtime data records no tip or time";
    const badTime = "the runtime data's time does not parse";
    const failures = [];
    const expectRuntime = async (label, repo, data, predicate, runner) => {
      if (data === null) fs.rmSync(path.dirname(writeRuntimeFile(repo.root, { schema: 1 })), { recursive: true, force: true });
      else if (typeof data === "string") { const file = writeRuntimeFile(repo.root, { schema: 1 }); fs.writeFileSync(file, data); }
      else writeRuntimeFile(repo.root, data);
      const rendered = await renderedProduct(repo, `runtime-${label}`, runner);
      const claims = renderedClaims(rendered.view);
      if (!predicate(claims, rendered)) failures.push({ label, claims });
    };
    const runtime = historyFixture("runtime-main", ["runtime-map"]);
    const tip = commitAt(runtime, "measured tip", "2026-11-01T00:00:00Z", { "tip.txt": "tip\n" });
    commitAt(runtime, "after tip one", "2026-11-03T00:00:00Z", { "one.txt": "one\n" });
    commitAt(runtime, "after tip two", "2026-11-04T00:00:00Z", { "two.txt": "two\n" });
    const measured = "2026-10-31T19:00:00-05:00";
    await expectRuntime("record", runtime, { schema: 1, hashes: {}, tests: {}, tip, measuredAt: measured, dirty: 0 }, (claims) => claims.some((claim) => claim.includes(`${measuredAtTip} ${tip.slice(0, 8)} on ${new Date(measured).toISOString()}, 2 commits and 3 days before HEAD`) && !claim.includes("last changed")));
    await expectRuntime("dirty", runtime, { schema: 1, hashes: {}, tests: {}, tip, measuredAt: measured, dirty: 2 }, (claims) => claims.some((claim) => claim.includes("with 2 uncommitted files, 2 commits")));
    await expectRuntime("clamp", runtime, { schema: 1, hashes: {}, tests: {}, tip, measuredAt: "2026-11-10T00:00:00Z", dirty: 0 }, (claims) => claims.some((claim) => claim.includes("2 commits and 0 days before HEAD")));

    const oldLane = historyFixture("runtime-old-lane", ["runtime-map"]);
    const oldTip = commitAt(oldLane, "runtime tip", "2026-12-05T00:00:00Z", { "tip.txt": "tip\n" });
    const runtimeLaneBase = oldLane.git(["branch", "--show-current"]).stdout.trim();
    oldLane.git(["checkout", "-qb", "lane"]);
    commitAt(oldLane, "runtime lane one", "2026-12-02T00:00:00Z", { "lane-one.txt": "one\n" });
    commitAt(oldLane, "runtime lane two", "2026-12-03T00:00:00Z", { "lane-two.txt": "two\n" });
    oldLane.git(["checkout", "-q", runtimeLaneBase]);
    commitAt(oldLane, "runtime main", "2026-12-06T00:00:00Z", { "main.txt": "main\n" });
    oldLane.git(["merge", "-q", "--no-ff", "lane", "-m", "runtime merge"], { env: { ...process.env, GIT_AUTHOR_DATE: "2026-12-07T00:00:00Z", GIT_COMMITTER_DATE: "2026-12-07T00:00:00Z" } });
    const oldCount = Number(oldLane.git(["rev-list", "--count", `${oldTip}..HEAD`]).stdout.trim());
    const oldDays = Math.max(0, Math.floor((Number(oldLane.git(["show", "-s", "--format=%ct", "HEAD"]).stdout.trim()) - Date.parse("2026-12-05T00:00:00Z") / 1000) / (24 * 60 * 60)));
    await expectRuntime("parent-count", oldLane, { schema: 1, hashes: {}, tests: {}, tip: oldTip, measuredAt: "2026-12-05T00:00:00Z", dirty: 0 }, (claims) => claims.some((claim) => claim.includes(`${oldCount} commits and ${oldDays} days before HEAD`)));

    await expectRuntime("none", runtime, null, (claims) => claims.some((claim) => claim.includes(`${ageUnknown}no runtime data`)));
    await expectRuntime("schema", runtime, { schema: 99 }, (claims) => claims.some((claim) => claim.includes(`${ageUnknown}runtime data is another schema version`)));
    await expectRuntime("no-tip", runtime, { schema: 1, hashes: {}, tests: {}, measuredAt: measured }, (claims) => claims.some((claim) => claim.includes(`${ageUnknown}${noTipOrTime}`)));
    await expectRuntime("no-time", runtime, { schema: 1, hashes: {}, tests: {}, tip }, (claims) => claims.some((claim) => claim.includes(`${ageUnknown}${noTipOrTime}`)));
    await expectRuntime("bad-time", runtime, { schema: 1, hashes: {}, tests: {}, tip, measuredAt: "not-a-time" }, (claims) => claims.some((claim) => claim.includes(`${ageUnknown}${badTime}`) && !claim.includes("NaN")));

    const side = historyFixture("runtime-side-tip", ["runtime-map"]);
    commitAt(side, "runtime base", "2027-01-01T00:00:00Z", { "base.txt": "base\n" });
    const sideBase = side.git(["branch", "--show-current"]).stdout.trim();
    side.git(["checkout", "-qb", "side"]);
    const sideTip = commitAt(side, "unmerged runtime tip", "2027-01-02T00:00:00Z", { "side.txt": "side\n" });
    side.git(["checkout", "-q", sideBase]);
    commitAt(side, "runtime head", "2027-01-03T00:00:00Z", { "head.txt": "head\n" });
    await expectRuntime("side-tip", side, { schema: 1, hashes: {}, tests: {}, tip: sideTip, measuredAt: "2027-01-02T00:00:00Z" }, (claims) => claims.some((claim) => claim.includes(`${ageUnknown}tip ${sideTip.slice(0, 8)} is not in HEAD's history`)));
    const fakeTip = "f".repeat(40);
    await expectRuntime("fake-tip", side, { schema: 1, hashes: {}, tests: {}, tip: fakeTip, measuredAt: "2027-01-02T00:00:00Z" }, (claims) => claims.some((claim) => claim.includes(`${ageUnknown}tip ${fakeTip.slice(0, 8)} is not in HEAD's history`)));

    const shallowSource = historyFixture("runtime-shallow-source", ["runtime-map"]);
    const shallowTip = commitAt(shallowSource, "runtime shallow tip", "2027-02-01T00:00:00Z", { "tip.txt": "tip\n" });
    commitAt(shallowSource, "runtime shallow head", "2027-02-02T00:00:00Z", { "head.txt": "head\n" });
    const shallowRoot = path.join(temp, "runtime-shallow");
    const clone = spawnSync("git", ["clone", "-q", "--depth", "1", pathToFileURL(shallowSource.root).href, shallowRoot], { encoding: "utf8" });
    const shallow = { root: shallowRoot, git: (args, options = {}) => spawnSync("git", args, { cwd: shallowRoot, encoding: "utf8", ...options }) };
    const isShallow = shallow.git(["rev-parse", "--is-shallow-repository"]).stdout.trim() === "true";
    await expectRuntime("shallow", shallow, { schema: 1, hashes: {}, tests: {}, tip: shallowTip, measuredAt: "2027-02-01T00:00:00Z" }, (claims) => clone.status === 0 && isShallow && claims.some((claim) => claim.includes(`${ageUnknown}shallow clone`)));

    // req: R-2545
    check("R-2545: the runtime map shows its own tip, time and uncommitted files with commits and days to HEAD, or says why it cannot",
      failures.length === 0 && productReportModule.MEASURED_AT_TIP_PREFIX === measuredAtTip && productReportModule.AGE_UNKNOWN_PREFIX === ageUnknown && productReportModule.RUNTIME_NO_TIP_OR_TIME === noTipOrTime && productReportModule.RUNTIME_TIME_INVALID === badTime,
      JSON.stringify({ failures, exports: [productReportModule.MEASURED_AT_TIP_PREFIX, productReportModule.AGE_UNKNOWN_PREFIX, productReportModule.RUNTIME_NO_TIP_OR_TIME, productReportModule.RUNTIME_TIME_INVALID] }));
  });
  {
    const ledger = [
      "# CAP-60 · Product holder", "Purpose: hold a product feature.", "Outcome: product work exists.", "Kind: product", "",
      "## FEAT-060 · Product feature", "Purpose: do product work.", "Status: active", "", table([["R-6000", "implemented"]]),
      "# CAP-61 · Constraint holder", "Purpose: hold a constraint feature.", "Outcome: constraint work exists.", "Kind: constraint", "Binds: CAP-60", "",
      "## FEAT-061 · Constraint feature", "Purpose: do constraint work.", "Status: active", "", table([["R-6001", "implemented"]]),
      "# CAP-62 · Kindless holder", "Purpose: hold a legacy feature.", "Outcome: legacy work exists.", "",
      "## FEAT-062 · Kindless feature", "Purpose: do legacy work.", "Status: active", "", table([["R-6002", "implemented"]]),
    ].join("\n");
    const repo = treeFixture("detail-capability", ledger);
    const out = path.join(temp, "detail-capability.html");
    await generateReport({ root: repo.root, out });
    const html = fs.readFileSync(out, "utf8");
    const expected = [["FEAT-060", "Capability: CAP-60 · Product holder · product"], ["FEAT-061", "Capability: CAP-61 · Constraint holder · constraint"], ["FEAT-062", "Capability: CAP-62 · Kindless holder"]];
    const details = expected.map(([id, text]) => { const view = renderHtmlAt(html, `#${id}`); const purposeAt = view.root.children.findIndex((node) => node.tag === "p" && node.textContent.startsWith("Purpose:")); return { id, text, actual: view.root.children[purposeAt + 1]?.textContent, all: view.nodes.map((node) => node.textContent ?? node.text ?? "").join(" ") }; });
    const product = renderHtmlAt(html, "#product");
    // req: R-2453
    check("R-2453: a feature's detail view names its capability, and the kind only when the capability has one", details.every((detail) => detail.actual === detail.text) && !details[2].all.includes("undefined") && !details[2].all.includes("null") && pinsKindedHeadings(product, [["CAP-60", "Product holder"], ["CAP-61", "Constraint holder"]]), JSON.stringify(details));
  }
  {
    const ledger = [
      "# CAP-70 · Old product", "Purpose: preserve an old product ID.", "Outcome: history remains legible.", "Kind: product", "Retired: CAP-71", "",
      "# CAP-71 · Live product", "Purpose: hold live product work.", "Outcome: product work continues.", "Kind: product", "",
      "## FEAT-071 · Live product feature", "Purpose: do live work.", "Status: active", "", table([["R-7001", "implemented"]]),
      "# CAP-72 · Old kindless", "Purpose: preserve an old kindless ID.", "Outcome: kindless history remains legible.", "Retired: CAP-71, CAP-73", "",
      "# CAP-73 · Live kindless", "Purpose: hold live legacy work.", "Outcome: legacy work continues.", "",
      "## FEAT-073 · Live kindless feature", "Purpose: do legacy work.", "Status: active", "", table([["R-7003", "implemented"]]),
      "# CAP-74 · Live constraint", "Purpose: constrain live product work.", "Outcome: product work is covered.", "Kind: constraint", "Binds: CAP-71", "",
      "## FEAT-074 · Live constraint feature", "Purpose: check live work.", "Status: active", "", table([["R-7004", "implemented"]]),
    ].join("\n");
    const repo = treeFixture("retired-capabilities", ledger);
    const out = path.join(temp, "retired-capabilities.html");
    await generateReport({ root: repo.root, out });
    const product = renderHtmlAt(fs.readFileSync(out, "utf8"), "#product");
    const order = capabilityCards(product).map((card) => card.children[0]?.textContent.split(" · ")[0]);
    const oldProduct = capabilityCard(product, "CAP-70")?.children.find((node) => node.tag === "p" && node.textContent.startsWith("Retired:"));
    const oldKindless = capabilityCard(product, "CAP-72")?.children.find((node) => node.tag === "p" && node.textContent.startsWith("Retired:"));
    // req: R-2454
    check("R-2454: a retired capability's card comes after every other card and names its successors", JSON.stringify(order) === JSON.stringify(["CAP-71", "CAP-73", "CAP-74", "CAP-70", "CAP-72"]) && oldProduct?.textContent === "Retired: replaced by CAP-71 · Live product" && oldKindless?.textContent === "Retired: replaced by CAP-71 · Live product, CAP-73 · Live kindless" && pinsKindedHeadings(product, [["CAP-70", "Old product"], ["CAP-71", "Live product"], ["CAP-74", "Live constraint"]]), JSON.stringify({ order, oldProduct: oldProduct?.textContent, oldKindless: oldKindless?.textContent }));
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
if (fails) process.exitCode = 1;
