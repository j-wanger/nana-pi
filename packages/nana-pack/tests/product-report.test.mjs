/**
 * @module packages/nana-pack/tests/product-report.test.mjs
 * @purpose Pins the product report's ledger, HANDOFF, git provenance, escaping, and deterministic output contracts.
 * @inputs the product-report module and temporary repository fixtures.
 * @outputs named PASS/FAIL checks for report behavior.
 * @effects disk (temporary fixture repositories); process (git commands).
 * @errors failed assertions set a nonzero test exit.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { generateReport, renderInto } from "../../../scripts/product-report.mjs";
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
    check("report includes complete capabilities, features, rows, violations, full asks and unassessed slots", data.capabilities.length > 0 && data.capabilities.every((capability) => capability.purpose && typeof capability.outcome === "string" && Array.isArray(capability.features)) && data.features.length > 0 && data.features.every((feature) => feature.purpose && feature.status && feature.assessment === "unassessed" && Object.values(feature.counts).reduce((sum, count) => sum + count, 0) === feature.rows.length) && sourceRows.every((row) => featureRows.includes(row.id)) && JSON.stringify(data.violated.map((row) => row.id)) === JSON.stringify(expectedViolations) && JSON.stringify(data.asks) === JSON.stringify(expectedAsks) && data.asks.every((ask) => ask.title && ask.kind && ask.since && ask.body.length > 0));
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
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
if (fails) process.exitCode = 1;
