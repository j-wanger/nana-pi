/**
 * @module packages/nana-pack/tests/product-report.test.mjs
 * @purpose Pin report rebuilds, ask drawing, credentials, inert text, shared-row filtering and refusals.
 * @inputs The report module and isolated temporary repository fixtures.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk (temporary repositories and reports), process (git)
 * @errors Failed assertions set a nonzero exit status.
 */
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { tmpDir } from "./tmp-dir.mjs";
import { buildReport, generateReport, renderInto, OVERVIEW_BLOCKS } from "../../../scripts/product-report.mjs";
import { withinCaseLimit, treeFixture, table, renderHtmlAt } from "./report-fixtures.mjs";
import { readHandoffIssues } from "../lib/handoff-issues.mjs";
import { ISSUES_FETCH_CAP } from "../lib/frontier-summary-config.mjs";
import { CI_READ_TIMEOUT_MS } from "../lib/land-config.mjs";

const temp = tmpDir(path.join(os.tmpdir(), "product-report-"));
let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
const ledger = [
  "# CAP-01 · Reports", "Purpose: render reports.", "Outcome: reports exist.", "",
  "## FEAT-001 · Earlier receiver", "Purpose: read shared output.", "Status: active", "Also applies: R-002", "", table([["R-001", "untested"]]),
  "## FEAT-002 · Maker", "Purpose: make shared output.", "Status: active", "", table([["R-002", "implemented"]]).replace("—", "`tests/pin.test.mjs::fixture`"),
  "## FEAT-003 · Later receiver", "Purpose: read shared output.", "Status: active", "Also applies: R-002", "", table([["R-003", "violated"]]),
].join("\n");
function fixture(name) {
  return treeFixture(temp, name, ledger, "## Open for the owner\n- **[optional, since 2026-10-10] Fixture question.**\n");
}
const textOf = view => view.nodes.map(node => node.textContent ?? node.text ?? "").join(" ");
try {
  await withinCaseLimit("report rebuild and issue asks", async () => {
    const { root, git } = fixture("deterministic");
    fs.mkdirSync(path.join(root, "tests")); fs.writeFileSync(path.join(root, "tests/pin.test.mjs"), "// fixture\n");
    fs.writeFileSync(path.join(root, "HANDOFF.md"), "## Open for the owner\nhttps://github.com/example-org/example-repo/issues\n");
    git(["remote", "add", "origin", "https://user:pass@github.com/example-org/example-repo.git"]);
    git(["add", "."]); git(["commit", "-qm", "inputs"]);
    const items = [{ number: 11, title: "Fixture ask", kind: "blocking", createdAt: "2026-10-20", url: "https://github.com/example-org/example-repo/issues/11", body: "Question: Decide?" }];
    const readIssues = async () => ({ url: "https://github.com/example-org/example-repo/issues", items, truncated: false });
    const first = path.join(temp, "first.html"), second = path.join(temp, "second.html");
    await generateReport({ root, out: first, readIssues }); await generateReport({ root, out: second, readIssues });
    const html = fs.readFileSync(first, "utf8");
    // req: R-1012
    check("same commit and tree produce byte-identical reports", fs.readFileSync(first).equals(fs.readFileSync(second)));
    const decisions = renderHtmlAt(html, "#decisions");
    const model = decisions.model;
    // req: R-1013
    check("rendered provenance section states exact commit, date, and clean state", decisions.nodes.some(node => node.tag === "p" && node.textContent === `Commit: ${git(["rev-parse", "HEAD"]).stdout.trim()} · ${git(["log", "-1", "--format=%cI"]).stdout.trim()} · Working tree: clean`));
    for (const hash of ["#overview", "#product", "#features", "#requirements", "#issues", "#decisions", "#artifacts", ...model.features.map(f => `#${f.id}`)]) {
      assert(!/undefined|\[object Object\]/.test(textOf(renderHtmlAt(html, hash))), hash);
    }
    assert(textOf(decisions).includes("Fixture ask"));
    // req: R-1511
    check("credential-bearing origins never become test links", !html.includes("user:pass") && renderHtmlAt(html, "#requirements").nodes.filter(node => node.tag === "a").every(node => !String(node.attrs.href).includes("/blob/")));
    const out = path.join(temp, "git-error.html"); let refused = false;
    try { await generateReport({ root, out, gitRunner: () => ({ status: 1, stdout: "", stderr: "injected git failure" }) }); } catch (error) { refused = /git/i.test(error.message); }
    // req: R-1013
    check("git runner failures refuse report generation", refused && !fs.existsSync(out));
  });
  await withinCaseLimit("shared-row filter", async () => {
    const { root } = fixture("feature-filter");
    const out = path.join(temp, "filter.html"); await generateReport({ root, out });
    const view = renderHtmlAt(fs.readFileSync(out, "utf8"), "#requirements");
    const select = view.handlers.find(({ node, type }) => type === "change" && node.attrs["aria-label"] === "Filter by feature");
    const flatten = node => [node, ...(node.children ?? []).flatMap(flatten)];
    const sees = id => { select.node.value = id; select.callback(); return flatten(view.root).some(node => node.tag === "article" && node.textContent.includes("R-002")); };
    // req: R-1015
    check("feature requirement filter retains a row for earlier receiver, owner, and later receiver", ["FEAT-001", "FEAT-002", "FEAT-003"].every(sees));
  });
  await withinCaseLimit("inert markup", async () => {
    const { root } = fixture("hostile");
    fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), ledger.replace("render reports.", "render reports </script><img src=x onerror=alert(1)>."));
    fs.appendFileSync(path.join(root, "HANDOFF.md"), "- **[optional, since 2026-10-10] Hostile.** </script><img src=x onerror=alert(1)>\n");
    const out = path.join(temp, "hostile.html"); await generateReport({ root, out });
    const html = fs.readFileSync(out, "utf8");
    // req: R-1019
    check("hostile ledger markup remains inert data", [...html.matchAll(/<script id="report-data" type="application\/json">/g)].length === 1 && !html.includes("<img src=x onerror=alert(1)>"));
    // req: R-1019
    check("unknown prototype hashes render the Overview", ["#constructor", "#__proto__", "#hasOwnProperty"].every(hash => {
      const view = renderHtmlAt(html, hash);
      return OVERVIEW_BLOCKS.every(([heading]) => view.nodes.some(node => node.tag === "h3" && node.textContent === heading)) && view.nodes.some(node => node.tag === "h2" && node.textContent === "Overview");
    }));
    const rootNode = { children: [], appendChild(node) { this.children.push(node); }, replaceChildren(...nodes) { this.children = nodes; } };
    const made = [];
    const document = { getElementById: () => rootNode, createElement: (tag) => { const node = { tag, children: [], appendChild(child) { this.children.push(child); }, append(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, attrs: {}, setAttribute(key, value) { this.attrs[key] = value; }, addEventListener() {} }; made.push(node); return node; }, createTextNode: (text) => ({ text: String(text) }) };
    renderInto(document, { commit: "a".repeat(40), date: "2026-10-11T00:00:00Z", clean: true, capabilities: [], features: [], violated: [], asks: [{ kind: "optional", since: "2026-10-10", title: "<img onerror=alert(1)>", body: "<script>bad</script>" }] }, { hash: "#decisions" });
    renderInto(document, { features: [], overview: [{ heading: "Needs you", href: "#decisions", lines: [[{ text: "<img onerror=alert(1)>" }]] }] });
    const before = made.length;
    renderInto(document, { features: [{ id: "FEAT-001", label: "Feature", status: "active", capability: {}, assessmentState: "unassessed", sharedBy: [], shared: [], rows: [], detailSections: [{ heading: "Deliverables", blocks: [{ heading: "<img onerror=alert(1)>", claims: [], artifactLines: [] }] }, { heading: "Registered artifacts", cards: [{ heading: "A-001", lines: [{ segments: [{ text: "<img onerror=alert(2)>" }] }] }] }] }] }, { hash: "#FEAT-001" });
    // req: R-1019
    check("renderer inserts all dynamic strings only through text nodes", made.every(node => !("innerHTML" in node) && !("outerHTML" in node)) && rootNode.children.length > 0 && made.some(node => node.children.some(child => child.text === "<img onerror=alert(1)>")) && !made.some(node => node.tag === "script") && made.slice(before).some(node => node.children.some(child => child.text === "<img onerror=alert(1)>")) && made.slice(before).some(node => node.tag === "article" && node.attrs.class === "deliverable-block") && made.slice(before).some(node => node.tag === "article" && node.attrs.class === "artifact-entry-card" && node.children.some(child => child.children?.some(text => text.text === "<img onerror=alert(2)>"))));
  });
  await withinCaseLimit("line endings and refusals", async () => {
    const { root } = fixture("crlf");
    fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), ledger.replaceAll("\n", "\r\n"));
    const out = path.join(temp, "crlf.html"); await generateReport({ root, out });
    // req: R-1014
    check("CRLF ledger is normalized before parsing", fs.readFileSync(out, "utf8").includes("CAP-01"));
    const bad = fixture("bad-tree");
    fs.appendFileSync(path.join(bad.root, "REQUIREMENTS.md"), "\n| R-9999 | malformed row | implemented | — |\n");
    const badOut = path.join(temp, "bad-tree.html"); let error = "";
    try { await generateReport({ root: bad.root, out: badOut }); } catch (caught) { error = caught.message; }
    // req: R-1025
    check("tree-checker problems are named and refuse output", /tree checker/i.test(error) && error.includes("R-9999") && !fs.existsSync(badOut));
    for (const [name, ask] of [["grammar", "- **[optional, since 2026-10-10] Missing title grammar"], ["date", "- **[optional, since 2026-99-99] Bad date.** body"], ["kind", "- **[mystery, since 2026-10-10] Unknown kind.** body"]]) {
      const bad = fixture(`bad-ask-${name}`); fs.appendFileSync(path.join(bad.root, "HANDOFF.md"), `\n## Open for the owner\n${ask}\n`);
      const page = path.join(temp, `bad-ask-${name}.html`); let reason = "";
      try { await generateReport({ root: bad.root, out: page }); } catch (caught) { reason = caught.message; }
      // req: R-1030
      check(`malformed ask ${name} is named and refuses output`, /HANDOFF.*line/i.test(reason) && !fs.existsSync(page));
    }
  });
  await withinCaseLimit("R-2981", async () => {
    const repo = fixture("pages-issues");
    fs.writeFileSync(path.join(repo.root, "HANDOFF.md"), "## Next\nhttps://github.com/example-org/example-repo/issues\n## Open for the owner\nhttps://github.com/example-org/example-repo/issues\n");
    const seen = [], out = path.join(temp, "pages-issues.html");
    const items = [
      { number: 11, title: "Fixture ask", labels: [{ name: "ask" }, { name: "blocking" }], author: { login: "example-org" }, createdAt: "2026-10-20T12:00:00Z", body: "Question: Decide?" },
      { number: 12, title: "Fixture next", labels: [{ name: "next" }], author: { login: "example-org" }, createdAt: "2026-10-21T12:00:00Z", body: "Next" },
      { number: 13, title: "Foreign ask", labels: [{ name: "ask" }, { name: "optional" }], author: { login: "other" }, createdAt: "2026-10-22T12:00:00Z", body: "Foreign" },
    ];
    while (items.length < ISSUES_FETCH_CAP) items.push({ number: 100 + items.length, title: "Ignored", labels: [], author: { login: "other" }, createdAt: "2026-10-22T12:00:00Z", body: "Ignored" });
    await generateReport({ root: repo.root, out, readIssues: async options => { seen.push(options); return readHandoffIssues({ ...options, runGh: () => ({ status: 0, stdout: JSON.stringify(items) }) }); } });
    const html = fs.readFileSync(out, "utf8"), decisions = renderHtmlAt(html, "#decisions"), model = decisions.model;
    const askCard = decisions.nodes.find(node => node.tag === "article" && node.children.some(child => child.tag === "h3" && child.textContent === "Fixture ask"));
    // req: R-2981
    check("R-2981: issue asks are filtered and drawn with kind, date, link, counts and cap warning", model.asks.length === 1 && model.asks[0].since === "2026-10-20" && model.asks[0].url.endsWith("/11") && model.issueNotice.includes("may be longer") && seen[0].ceilingMs === CI_READ_TIMEOUT_MS && askCard?.children.some(node => node.textContent === "Kind: blocking") && askCard?.children.some(node => node.tag === "h3" && node.children.some(link => link.tag === "a" && link.attrs.href.endsWith("/11"))) && textOf(renderHtmlAt(html, "#overview")).includes("Asks: 1 · blocking (must decide): 1 · optional: 0 · parked: 0"));
  });
  await withinCaseLimit("list asks and failed issue read", async () => {
    const repo = fixture("pages-legacy"); let calls = 0;
    fs.writeFileSync(path.join(repo.root, "HANDOFF.md"), "## Open for Avery (notes)\n- **[optional, since 2026-10-10] Fixture question.**\n");
    const after = path.join(temp, "pages-legacy.html");
    await generateReport({ root: repo.root, out: after, readIssues: () => { calls++; throw new Error("must not call"); } });
    const drawn = renderHtmlAt(fs.readFileSync(after, "utf8"), "#decisions");
    const card = drawn.nodes.find(node => node.tag === "article" && node.children.some(child => child.tag === "h3" && child.textContent === "Fixture question"));
    // req: R-2514
    check("an Open for heading with any name is read as the asks section", calls === 0 && drawn.model.asks.some(ask => ask.title === "Fixture question"));
    // req: R-2983
    check("R-2983: list-ask Decisions drawing matches main's captured text", card?.children[0]?.tag === "h3" && card.children.map(node => node.textContent).join("\n") === "Fixture question\nKind: optional\nSince: 2026-10-10\nAsk: ");
    fs.writeFileSync(path.join(repo.root, "HANDOFF.md"), "## Open for the owner\nhttps://github.com/example-org/example-repo/issues\n");
    const out = path.join(temp, "failed-read.html");
    await generateReport({ root: repo.root, out, readIssues: async options => { assert.equal(options.limitMs, undefined); assert.equal(options.ceilingMs, CI_READ_TIMEOUT_MS); throw new Error("timeout"); } });
    const html = fs.readFileSync(out, "utf8"), overview = renderHtmlAt(html, "#overview");
    const asksLine = overview.nodes.find(node => node.tag === "li" && node.textContent.startsWith("Asks:"))?.textContent;
    // req: R-2984
    check("R-2984: failed issue read renders an unknown Overview count and drawn Issues notice", asksLine?.includes("unknown") && asksLine.includes("unavailable (timeout)") && !asksLine.includes(": 0") && textOf(renderHtmlAt(html, "#decisions")).includes("unavailable (timeout)") && !html.includes("after 0 ms"));
  });
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
if (fails) process.exitCode = 1;
