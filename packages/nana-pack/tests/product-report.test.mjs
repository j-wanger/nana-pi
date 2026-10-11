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
import { generateReport, renderInto, validateStore } from "../../../scripts/product-report.mjs";
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
    const { root } = fixture("content"); const out = path.join(temp, "content.html");
    await generateReport({ root, out }); const html = fs.readFileSync(out, "utf8");
    const data = JSON.parse(html.match(/<script id="report-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    const expectedAsks = splitOpenForJake(fs.readFileSync(path.join(root, "HANDOFF.md"), "utf8")).map(({ tag, title }) => ({ kind: tag.kind, since: tag.since, title: title.title, body: title.body }));
    const sourceRows = readRequirementRows(parseLedger(fs.readFileSync(path.join(root, "REQUIREMENTS.md"), "utf8")));
    const featureRows = data.features.flatMap((feature) => feature.rows.map((row) => row.id));
    const expectedViolations = sourceRows.filter((row) => row.status === "violated").map((row) => row.id);
    // req: R-1014 R-1015 R-1016 R-1017 R-1018 R-1028
    check("report includes complete capabilities, features, rows, violations, full asks and unassessed slots", data.capabilities.length > 0 && data.capabilities.every((capability) => capability.purpose && typeof capability.outcome === "string" && Array.isArray(capability.features)) && data.features.length > 0 && data.features.every((feature) => feature.purpose && feature.status && feature.assessmentState === "unassessed" && Object.values(feature.counts).reduce((sum, count) => sum + count, 0) === feature.rows.length) && sourceRows.every((row) => featureRows.includes(row.id)) && JSON.stringify(data.violated.map((row) => row.id)) === JSON.stringify(expectedViolations) && JSON.stringify(data.asks) === JSON.stringify(expectedAsks) && data.asks.every((ask) => ask.title && ask.kind && ask.since && ask.body.length > 0));
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
    const nodes = [];
    const root = { children: [], appendChild(node) { this.children.push(node); } };
    const document = {
      getElementById: () => root,
      createElement: (tag) => ({ tag, children: [], appendChild(node) { this.children.push(node); } }),
      createTextNode: (text) => { const node = { text }; nodes.push(node); return node; },
    };
    renderInto(document, { commit: "a".repeat(40), date: "2026-10-11T00:00:00Z", clean: true, asks: [ { title: "<img onerror=alert(1)>" } ] });
    // req: R-1019
    check("renderer inserts all dynamic strings only through text nodes", nodes.length === 3 && nodes.every((node) => typeof node.text === "string") && nodes[2].text.includes("<img onerror=alert(1)>") && root.children.every((node) => !("innerHTML" in node)));
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
    check("unassessed feature state is explicit", report.model.features.find((item) => item.id === "FEAT-002")?.assessmentState === "unassessed");
    // req: R-1021
    check("outdated feature names purpose and status changes and carries full difference shape", feature?.assessmentState === "out of date" && feature.differences.purpose?.was && feature.differences.purpose?.now && feature.differences.status?.was === "active" && feature.differences.status?.now === "frozen (fixture)" && Array.isArray(feature.differences.added) && Array.isArray(feature.differences.removed) && Array.isArray(feature.differences.changed));
    check("stale feature preserves the assessment", feature?.assessment?.id === "FEAT-039" && fs.existsSync(storePath));
  }
  {
    // req: R-1027
    check("validateStore accepts the real repository without a store", (await validateStore()).length === 0);
  }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
if (fails) process.exitCode = 1;
