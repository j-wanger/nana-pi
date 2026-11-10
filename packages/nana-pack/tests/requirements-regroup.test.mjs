/**
 * @module packages/nana-pack/tests/requirements-regroup.test.mjs
 * @purpose Pin a reviewed regroup proposal, overwrite safety and the recorded plain-evidence failure.
 * @inputs Regroup/lift modules and the existing synthetic fixture ledger and proposal.
 * @outputs Awaited bounded PASS/FAIL checks.
 * @effects disk (OS-temp repositories and proposal files), process (bounded Node children)
 * @errors Failed assertions set a nonzero exit status.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, linkSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { withinCaseLimit } from "./report-fixtures.mjs";
import { isTextPlaced } from "../../../scripts/requirements-regroup.mjs";

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const REGROUP = join(REPO_ROOT, "scripts/requirements-regroup.mjs"), LIFT = join(REPO_ROOT, "scripts/requirements-lift.mjs");
const scratchRoot = tmpDir(join(tmpdir(), "regroup-test-"));
let caseN = 0, fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^GIT_/.test(k)) delete env[k]; return env; };
const node = (args, cwd) => spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 120_000, env: cleanEnv() });
const regroup = args => node([REGROUP, ...args], scratchRoot);
const sha = buf => createHash("sha256").update(buf).digest("hex");
const lineOf = (txt, heading, nth = 1) => { let k = 0; const ls = txt.split("\n"); for (let i = 0; i < ls.length; i++) if (ls[i] === heading && ++k === nth) return i + 1; return -1; };
const H = { partA: "# Part A. Ingest", load: "## 1. Load files", build: "## 2. Build at production size", sizing: "### 2a. Sizing", partB: "# Part B. Report", render: "## 3. Render", partG: "# Part G. General engineering requirements", g1: "## G1. Configuration", g2: "## G2. Module boundaries", oq: "## Open questions", dom: "## Deliberate omissions" };
const TH = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
const FX = [
  "# fixture requirements", "", "Intro prose for the regroup fixture.", "", H.partA, "", H.load, "", ...TH,
  "| R-001 | WHEN a file arrives, the loader shall read every line of it into the staging table before any check runs. | implemented | `tests/load.test.mjs::R-001: the loader reads every line` |",
  "| R-002 | The loader shall refuse a file whose header row names an unknown column, naming that column and its position. | implemented | `tests/load.test.mjs::R-002: an unknown column is refused` |",
  "| R-003 | The loader shall record each refused file in the import log with the time, the file name and the refusal reason. | planned | — |", "",
  H.build, "", ...TH,
  "| R-004 | The fixture builder shall write the production-size dataset with ten thousand accounts and their transactions in one run. | implemented | `tests/build.test.mjs::R-004: the builder writes the full dataset` |",
  "| R-005 | The fixture builder shall finish the production-size run within the time budget the build notes declare for it. | planned | `tests/missing.test.mjs::R-005: the builder finishes in budget` |", "",
  H.sizing, "", ...TH, "| R-006 | The sizing script shall print the row count of every staging table after the production-size build completes. | untested | — |", "",
  H.partB, "", H.build, "", ...TH,
  "| R-007 | The report build shall render every analyst page from the production-size dataset without sampling any table. | implemented | `tests/render.test.mjs::R-007: every page renders from the full dataset` |",
  "| R-008 | The report build shall refuse to publish a page whose source table holds fewer rows than the production-size floor. | planned | — |", "",
  H.render, "", ...TH,
  "| R-009 | The renderer shall write each analyst page as one HTML file whose title names the account under review. | implemented | `tests/render.test.mjs::R-009: each page is one HTML file` |",
  "| R-010 | The renderer shall escape every account name before it places that name inside the page's HTML markup. | violated | `tests/render.test.mjs::R-010: account names are escaped` |", "",
  H.partG, "", "Prose for the general block.", "", H.g1, "", ...TH,
  "| G-001 | The fixture's first general row shall hold for every module the fixture's code map lists by name. | untested | — |",
  "| G-002 | The fixture's second general row shall hold for every tunable the fixture's configuration surface defines by name. | untested | — |", "",
  H.g2, "", ...TH, "| G-004 | The fixture's third general row shall hold for every module boundary the fixture's code map draws between two layers. | untested | — |", "",
  H.oq, "", "1. An open question.", "", H.dom, "", "1. A deliberate omission.", "",
].join("\n");
const FX_FILES = { "tests/load.test.mjs": "// fixture test file\n", "tests/build.test.mjs": "// fixture test file\n", "tests/render.test.mjs": "// fixture test file\n", "src/report/render.mjs": "export {};\n", "README.md": "# fixture\n" };
const L15 = lineOf(FX, H.build, 1), L30 = lineOf(FX, H.build, 2);
const FX_HOME = { "R-001": "FEAT-001", "R-002": "FEAT-001", "R-003": "FEAT-001", "R-004": "FEAT-002", "R-005": "FEAT-002", "R-006": "SUB-001", "R-007": "FEAT-002", "R-008": "FEAT-004", "R-009": "FEAT-004", "R-010": "FEAT-004", "G-001": "SUB-900", "G-002": "SUB-900", "G-004": "SUB-901" };
const FX_PLACED = ["R-003", "R-005", "R-006", "R-008", "G-001", "G-002", "G-004"];
const WANT_RECORDS = [
  { line: lineOf(FX, H.partA), to: "CAP-01" }, { line: lineOf(FX, H.load), to: "FEAT-001" }, { line: L15, to: "FEAT-002" }, { line: lineOf(FX, H.sizing), to: "SUB-001" },
  { line: lineOf(FX, H.partB), to: "CAP-02" }, { line: L30, to: "FEAT-002" }, { line: L30, to: "FEAT-004" }, { line: lineOf(FX, H.render), to: "FEAT-004" },
  { line: lineOf(FX, H.partG), to: "FEAT-900" }, { line: lineOf(FX, H.g1), to: "SUB-900" }, { line: lineOf(FX, H.g2), to: "SUB-901" },
];
function fxProposal() {
  const f = (h, nth = 1) => ({ line: lineOf(FX, h, nth), heading: h });
  const p = {
    lift: 1, pin: { sha256: sha(Buffer.from(FX)), rows: 13 }, head: { through: lineOf(FX, H.partA) - 1 },
    tree: [
      { id: "CAP-01", label: "Ingest", purpose: "Load the analyst's source files into staging and build the dataset the desk reads.", outcome: "Every source file the analyst drops is staged whole, refused by name or logged.", from: [f(H.partA)], features: [
        { id: "FEAT-001", label: "Load source files", purpose: "Read each arriving file into staging, refusing unknown columns by name and logging each refusal.", status: "active", from: [f(H.load)], rows: ["R-001", "R-002", "R-003"], subgroups: [] },
        { id: "FEAT-002", label: "Build at production size", purpose: "Build the full dataset in one run, inside the time budget the build notes declare.", status: "active", from: [f(H.build, 1), f(H.build, 2)], rows: ["R-004", "R-005", "R-007"], subgroups: [
          { id: "SUB-001", label: "Sizing", purpose: "Print the staging table sizes after each full build.", from: [f(H.sizing)], rows: ["R-006"] }] }] },
      { id: "CAP-02", label: "Report", purpose: "Render the analyst pages from the full dataset and publish only what the floor allows.", outcome: "Each analyst page is one escaped HTML file built from unsampled tables.", from: [f(H.partB)], features: [
        { id: "FEAT-004", label: "Render analyst pages", purpose: "Write each analyst page as one escaped HTML file and hold back pages under the floor.", status: "active", from: [f(H.render)], rows: ["R-009", "R-010", "R-008"], subgroups: [] },
        { id: "FEAT-005", label: "Export analyst pages", purpose: "Export the rendered analyst pages for the case file; no row holds it yet.", status: "proposed", from: [], rows: [], subgroups: [] }] },
      { id: "CAP-90", from: [], features: [{ id: "FEAT-900", from: [f(H.partG)], rows: [], subgroups: [{ id: "SUB-900", from: [f(H.g1)], rows: ["G-001", "G-002"] }, { id: "SUB-901", from: [f(H.g2)], rows: ["G-004"] }] }] },
    ], tail: { heading: "# Open questions and deliberate omissions", from: [], keep: [f(H.oq), f(H.dom)] },
  };
  const reasons = WANT_RECORDS.map((r, k) => ({ ...r, why: `the rows under this old line serve the node they now sit in (reason item ${k})` }));
  const verdicts = Object.keys(FX_HOME).map((id, k) => ({ id, at: FX_HOME[id], verdict: "keep", reason: `the row serves its home directly (keep item ${k})` }));
  const v3 = verdicts.find(v => v.id === "R-003"); delete v3.reason; v3.verdict = "move"; v3.targets = [{ to: "FEAT-004", reason: "the import log is read when the pages render (target alpha)" }];
  const v5 = verdicts.find(v => v.id === "R-005"); delete v5.reason; v5.verdict = "share"; v5.targets = [{ to: "FEAT-001", reason: "the build budget also bounds file loading (target bravo)" }, { to: "FEAT-004", reason: "the renderer reads inside the same budget (target charlie)" }];
  p.regroup = {
    read: ["README.md", "tests/"], reasons, placed: Object.fromEntries(FX_PLACED.map((id, k) => [id, `placed by its text alone, which names this node's work (placed item ${k})`])),
    evidence: { "FEAT-005": ["src\\report\\render.mjs"] }, review: { drafter: "anthropic", reviewer: "openai", verdicts, claims: [] },
    refuted: [{ id: "R-003", to: "FEAT-004", reason: "the log is written at load time, so it stays with loading (refute alpha)" }, { id: "R-005", to: "FEAT-004", reason: "rendering keeps its own budget (refute bravo)" }],
    questions: [
      { ask: "Should the build budget row also bind file loading (ask alpha)?", recommendation: "Yes, share it once shares can be carried (recommend alpha).", about: [{ id: "R-005", to: "FEAT-001" }] },
      { ask: "The floor row's move to rendering stands but its reason was rejected; keep the move (ask bravo)?", recommendation: "Keep the move and reword the reason (recommend bravo).", about: [{ line: L30, to: "FEAT-004" }] },
    ],
  };
  const nodes = p.tree.flatMap(c => [{ id: c.id, level: 1, node: c }, ...(c.features ?? []).flatMap(ft => [{ id: ft.id, level: 2, node: ft }, ...(ft.subgroups ?? []).map(s => ({ id: s.id, level: 3, node: s }))])]);
  const claims = [];
  for (const x of nodes) {
    if (["CAP-90", "FEAT-900", "SUB-900", "SUB-901"].includes(x.id)) continue;
    claims.push({ node: x.id, field: "purpose", text: x.node.purpose, verdict: "accept", reason: `the claim matches the rows it describes (claim item ${claims.length})` });
    if (x.level === 1) claims.push({ node: x.id, field: "outcome", text: x.node.outcome, verdict: "accept", reason: `the claim matches the rows it describes (claim item ${claims.length})` });
  }
  for (const r of reasons) claims.push({ line: r.line, to: r.to, text: r.why, verdict: "accept", reason: `the claim matches the rows it describes (claim item ${claims.length})` });
  const rejected = claims.find(c => c.line === L30 && c.to === "FEAT-004"); rejected.verdict = "reject"; rejected.reason = "the move stands but this reason names the wrong reader (reject zulu)";
  p.regroup.review.claims = claims; return p;
}
const PROP_REL = join("docs", "regroup", "proposal.json");
function fxRoot(p) {
  const dir = join(scratchRoot, `case-${++caseN}`); mkdirSync(join(dir, "docs/regroup"), { recursive: true });
  writeFileSync(join(dir, "REQUIREMENTS.md"), FX);
  for (const [rel, body] of Object.entries(FX_FILES)) { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), body); }
  writeFileSync(join(dir, PROP_REL), `${JSON.stringify(p, null, 2)}\n`); return dir;
}
try {
  await withinCaseLimit("regroup flow and overwrite safety", async () => {
    const proposal = fxProposal(), dir = fxRoot(proposal), prop = join(dir, PROP_REL), page = join(scratchRoot, "page.md");
    const args = ["--root", dir, "--proposal", prop, "--out", page];
    const pass = regroup(args), text = readFileSync(page, "utf8");
    const bad = structuredClone(proposal); bad.tree[1].features[0].rows = bad.tree[1].features[0].rows.filter(id => id !== "R-010");
    writeFileSync(prop, JSON.stringify(bad));
    const refused = regroup(args), direct = node([LIFT, "--root", dir, "--mapping", prop], scratchRoot);
    // req: R-1171 R-1174
    check("R-1171: a passing proposal writes the review page, and one the lift's dry run refuses writes no page and names the lift's problem", pass.status === 0 && text.startsWith("# Regroup review packet") && refused.status === 1 && direct.status === 1 && refused.stderr.includes("R-010") && !existsSync(page), pass.stderr + refused.stderr);
    // req: R-1178
    check("review page names the proposal hash and lift proof", text.includes(sha(`${JSON.stringify(proposal, null, 2)}\n`)) && text.includes(proposal.pin.sha256) && text.includes("lift proof: 13 rows kept byte-identical") && text.includes("anthropic") && text.includes("openai"));
    writeFileSync(prop, `${JSON.stringify(proposal, null, 2)}\n`);
    const link = join(scratchRoot, "proposal-hardlink.json"), before = readFileSync(prop);
    linkSync(prop, link);
    const clash = regroup(["--root", dir, "--proposal", prop, "--out", link]);
    // req: R-1171
    check("R-1171: an --out that is a hard link to the proposal is refused and leaves the proposal byte-identical", clash.status === 1 && readFileSync(prop).equals(before) && readFileSync(link).equals(before), clash.stderr);
  });
  await withinCaseLimit("plain evidence regression", async () => {
    const dir = join(scratchRoot, "rail-form"); mkdirSync(join(dir, "tests"), { recursive: true });
    writeFileSync(join(dir, "tests/mini.test.mjs"), "// fixture test file\n");
    const plainCell = "tests/missing.test.mjs::a title with a comma in it, tests/mini.test.mjs::R-900: plain form evidence";
    const backtickCell = "`tests/mini.test.mjs::R-900: backtick form evidence`";
    const missingCell = "tests/missing.test.mjs::a title that names no real path";
    // req: R-1176
    check("R-1176: a row whose evidence names an existing path in the trace rail's plain or backtick form is evidence-placed", !isTextPlaced(dir, { id: "R-900", evidence: plainCell }) && !isTextPlaced(dir, { id: "R-900", evidence: backtickCell }) && isTextPlaced(dir, { id: "R-901", evidence: missingCell }));
  });
} finally { rmSync(scratchRoot, { recursive: true, force: true }); }
if (fails) process.exitCode = 1;
