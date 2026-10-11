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
    model.features.find((item) => item.id === "FEAT-039").assessment = { what_it_does: "Keeps requirements together.", maturity: "partial", maturity_reason: "Some checks remain open.", gaps: ["A missing check.", "**Another** `gap`."], risks: ["A stale result."], decisions: ["A future choice."], next_step: "Run the full suite.", written_by: "seat", checked_by: "reviewer", date: "2026-10-11" };
    model.asks[0].body += " **bold span** and `code span`";
    const render = (hash = "") => {
      const nodes = [];
      const rootNode = { tag: "main", children: [], appendChild(node) { this.children.push(node); }, replaceChildren(...children) { this.children = children; } };
      const make = (tag) => { const node = { tag, children: [], attrs: {}, value: "", appendChild(child) { this.children.push(child); }, append(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, setAttribute(name, value) { this.attrs[name] = value; }, addEventListener() {} }; Object.defineProperty(node, "textContent", { get() { return this.children.map((child) => child.textContent ?? child.text ?? "").join(""); }, set(value) { this.children = [{ text: String(value) }]; } }); nodes.push(node); return node; };
      const document = { getElementById: () => rootNode, createElement: make, createTextNode: (value) => ({ text: String(value), get textContent() { return this.text; } }) };
      renderInto(document, model, { hash });
      const flatten = (node) => [node, ...(node.children ?? []).flatMap(flatten)];
      return { text: flatten(rootNode).map((node) => typeof node.text === "string" ? node.text : "").join(" "), nodes: flatten(rootNode) };
    };
    const product = render("#product"); const features = render("#features"); const detail = render("#FEAT-039");
    const requirements = render("#requirements"); const issues = render("#issues"); const decisions = render();
    // req: R-1014
    check("rendered #product view shows every capability, purpose, outcome and feature", model.capabilities.every((cap) => product.text.includes(cap.purpose) && product.text.includes(cap.outcome) && cap.features.every((id) => product.text.includes(id))), product.text.slice(0, 250));
    // req: R-1015
    check("rendered #features and feature detail views show the feature facts and shared rows", model.features.every((f) => features.text.includes(f.id) && features.text.includes(f.label) && features.text.includes(f.status) && features.text.includes(f.assessmentState)) && detail.text.includes("Purpose") && detail.text.includes("What it does"), `${features.text.slice(0, 250)} / ${detail.text.slice(0, 250)}`);
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
    check("feature detail places human-labelled assessment before counts, shares and rows", detail.nodes.some((node) => node.attrs?.class?.includes("state-") && node.textContent === model.features.find((item) => item.id === "FEAT-039").assessmentState) && detailText.indexOf("What it does") < detailText.indexOf("Counts") && detailText.indexOf("Counts") < detailText.indexOf("Shared by") && detailText.indexOf("Shared by") < detailText.lastIndexOf("Requirements"));
    // req: R-1015
    check("feature IDs link to their detail views in product, features, shared and detail views", [product, features, render("#shared"), detail].every((view) => view.nodes.filter((node) => node.tag === "a" && /^FEAT-/.test(node.textContent ?? "")).every((node) => node.attrs.href === `#${node.textContent.split(" · ")[0]}`)) && model.features.every((item) => features.nodes.some((node) => node.tag === "a" && node.attrs.href === `#${item.id}`)));
    // req: R-1015
    check("feature detail shows status counts and a stacked bar", detail.nodes.some((node) => node.attrs?.class === "status-bar") && Object.keys(model.features.find((item) => item.id === "FEAT-039").counts).every((status) => detail.text.includes(status)));
    // req: R-1015
    check("rendered views never expose raw assessment store keys", [product, features, detail, render("#shared"), requirements, issues, decisions].every((view) => !/what_it_does|maturity_reason/.test(view.text)));
    const plain = (value) => String(value ?? "").replaceAll("**", "").replaceAll("`", "").replace(/\s+/g, " ").trim();
    const allRows = [...new Map(model.features.flatMap((feature) => feature.rows.map((row) => [row.id, row]))).values()];
    const requirementText = requirements.text.replace(/\s+/g, " ");
    const normalizeWords = (value) => String(value ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(/\s+/).filter(Boolean);
    const requirementWords = new Set(normalizeWords(requirementText));
    const carries = (source, value) => { const available = source === requirementText ? requirementWords : new Set(normalizeWords(source)); return normalizeWords(value).every((word) => available.has(word)); };
    // req: R-1016
    check("rendered #requirements view shows every row text, status and evidence", allRows.every((row) => requirementText.includes(row.id) && carries(requirementText, row.requirement) && requirementText.includes(row.status) && (row.evidence === "—" || carries(requirementText, row.evidence))) && allRows.length === requirements.nodes.filter((node) => node.tag === "article").length && requirements.nodes.filter((node) => node.tag === "article").every((card) => card.children.some((node) => node.attrs.class === "row-heading") && card.children.some((node) => node.attrs.class === "row-evidence")));
    // req: R-1017
    check("rendered #issues view shows every violated row and evidence", model.violated.every((row) => issues.text.includes(row.id) && issues.text.includes(row.requirement) && issues.text.includes(row.evidence)));
    // req: R-1018
    check("rendered decisions view shows every ask kind, since-date, title and full body", model.asks.every((ask) => decisions.text.includes(ask.kind) && decisions.text.includes(ask.since) && carries(decisions.text, ask.title) && carries(decisions.text, ask.body)));
    // req: R-1018
    check("rendered decisions view preserves every full ask body", model.asks.length > 0 && model.asks.every((ask) => normalizeWords(ask.body).length > 0 && carries(decisions.text, ask.body)));
    const routeSource = fs.readFileSync(path.join(ROOT, "scripts/product-report.mjs"), "utf8");
    const prototypeHashesRenderDecisions = ["#constructor", "#__proto__", "#hasOwnProperty"].every((hash) => {
      const view = render(hash);
      return model.asks.length > 0 && model.asks.every((ask) => carries(view.text, ask.body)) && view.nodes.some((node) => /^h[1-6]$/.test(node.tag) && /decision/i.test(node.textContent));
    });
    // req: R-1019
    check("unknown prototype hashes render Decisions", prototypeHashesRenderDecisions && /Object\.prototype\.hasOwnProperty\.call\(views, hash\)/.test(routeSource));
    check("renderer turns markdown spans into b and code nodes", decisions.nodes.some((node) => node.tag === "b") && decisions.nodes.some((node) => node.tag === "code") && !decisions.text.includes("**bold span**") && !decisions.text.includes("`code span`"));
    check("renderer includes tab links and requirements controls", features.nodes.some((node) => node.tag === "a") && requirements.nodes.some((node) => node.tag === "input") && requirements.nodes.some((node) => node.tag === "select"));
    // req: R-1042
    check("hashchange bootstrap scrolls to top after rendering", /addEventListener\("hashchange",\s*\(\)\s*=>\s*\{\s*renderInto\(document, data, \{ hash: location\.hash \}\);\s*window\.scrollTo\(0, 0\);\s*\}\)/.test(model.template));
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
    const plannedRow = readRequirementRows(parsed).find((row) => { for (let heading = row.heading; heading; heading = heading.parent) if (heading === plannedFeature) return true; return false; });
    const oldRow = `| ${plannedRow.id} | ${plannedRow.requirement} | ${plannedRow.status} | ${plannedRow.evidence} |`;
    fs.writeFileSync(plannedLedgerPath, plannedLedger.replace(oldRow, oldRow.replace(`| ${plannedRow.status} |`, "| planned |")));
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
    const currentFeatureHasNoPacket = !names.includes("FEAT-002.json");
    const expectedPacketRows = (await buildReport({ root })).features.find((feature) => feature.id === "FEAT-039").rows.map(({ id, mark, requirement, status, evidence }) => ({ id, mark, requirement, status, evidence }));
    const staleAssessmentCandidate = { ...packet.assessment, stamp: packet.stamp };
    const unassessedCandidate = { id: unassessed.feature.id, what_it_does: "Current prose without digits.", maturity: "partial", maturity_reason: "Some checks remain open.", gaps: ["A missing check."], risks: ["A stale result."], decisions: ["A future choice."], next_step: "Run the full suite.", written_by: "seat", checked_by: "reviewer", date: "2026-10-11", stamp: unassessed.stamp };
    const roundTripPath = writeStore(root, [staleAssessmentCandidate, unassessedCandidate]);
    // req: R-1029
    check("writes deterministic stale and unassessed packets with HEAD stamps and a validating round trip", names.includes("FEAT-039.json") && packet.version === 1 && Object.keys(packet).sort().join(",") === "assessment,differences,feature,rows,stamp,version" && Object.keys(packet.feature).sort().join(",") === "id,label,purpose,status" && packet.feature.purpose.includes("requirements") && packet.rows.every((row) => Object.keys(row).sort().join(",") === "evidence,id,mark,requirement,status") && JSON.stringify(packet.rows) === JSON.stringify(expectedPacketRows) && packet.assessment?.id === "FEAT-039" && packet.stamp.commit === git(["rev-parse", "HEAD"]).stdout.trim() && packet.stamp.rows.length === packet.rows.length && packet.differences.purpose?.was && packet.differences.purpose?.now && unassessed.assessment === null && unassessed.differences.added.length === 0 && unassessed.rows.some((row) => row.mark === "shared") && currentFeatureHasNoPacket && fs.readFileSync(path.join(firstDir, "FEAT-039.json")).equals(fs.readFileSync(path.join(secondDir, "FEAT-039.json"))) && validateStore({ root, storePath: roundTripPath }).length === 0);
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
    // req: R-1027
    check("validateStore accepts the real repository without a store", (await validateStore()).length === 0);
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
if (fails) process.exitCode = 1;
