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
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { buildReport, generateReport, generatePackets, renderInto, validateStore } from "../../../scripts/product-report.mjs";
import { splitOpenForJake } from "../lib/handoff-asks.mjs";
import { parseLedger, readRequirementRows } from "../../../scripts/requirements-tree.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const temp = tmpDir(path.join(os.tmpdir(), "product-report-"));
let fails = 0;
function check(name, ok, detail = "") {
  console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
  if (!ok) fails++;
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
try {
  {
    const { root } = fixture("deterministic");
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
    fs.appendFileSync(path.join(root, "HANDOFF.md"), "\n## Open for Jake\n- **[optional, since 2026-10-10] Missing title grammar\n");
    const out = path.join(temp, "bad-ask.html"); let error = "";
    try { await generateReport({ root, out }); } catch (caught) { error = caught.message; }
    // req: R-1030
    check("malformed ask is named and refuses output", /HANDOFF.*line/i.test(error) && !fs.existsSync(out));
    const invalidDateRoot = fixture("bad-ask-date").root;
    fs.appendFileSync(path.join(invalidDateRoot, "HANDOFF.md"), "\n## Open for Jake\n- **[optional, since 2026-99-99] Bad date.** body\n");
    const invalidDateOut = path.join(temp, "bad-ask-date.html"); let dateError = "";
    try { await generateReport({ root: invalidDateRoot, out: invalidDateOut }); } catch (caught) { dateError = caught.message; }
    check("malformed ask date is named and refuses output", /HANDOFF.*line/i.test(dateError) && !fs.existsSync(invalidDateOut));
    const unknownKindRoot = fixture("bad-ask-kind").root;
    fs.appendFileSync(path.join(unknownKindRoot, "HANDOFF.md"), "\n## Open for Jake\n- **[mystery, since 2026-10-10] Unknown kind.** body\n");
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
    fs.writeFileSync(ledgerPath, fs.readFileSync(ledgerPath, "utf8").replace("Purpose: Rebuild one report of the product, its features, their requirements and the decisions waiting on Jake, from the repo at any commit from its first build on.", "Purpose: Rebuild one report of the product, its features, requirements and decisions waiting on Jake, from the repo at any commit from its first build on."));
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
    fs.writeFileSync(ledgerPath, fs.readFileSync(ledgerPath, "utf8").replace("Purpose: Rebuild one report of the product, its features, their requirements and the decisions waiting on Jake, from the repo at any commit from its first build on.", "Purpose: Rebuild one report of the product, its features, their requirements and decisions waiting on Jake, from the repo at any commit from its first build on.").replace("## FEAT-039 · See the product and its decisions in one report\nPurpose: Rebuild one report of the product, its features, their requirements and decisions waiting on Jake, from the repo at any commit from its first build on.\nStatus: active", "## FEAT-039 · See the product and its decisions in one report\nPurpose: Rebuild one report of the product, its features, their requirements and decisions waiting on Jake, from the repo at any commit from its first build on.\nStatus: frozen (fixture)"));
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
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
if (fails) process.exitCode = 1;
