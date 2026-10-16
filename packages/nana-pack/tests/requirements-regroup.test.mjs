/**
 * @module packages/nana-pack/tests/requirements-regroup.test.mjs
 * @purpose Pin the regroup checker's refusals and its review page against a built fixture ledger and proposal.
 * @inputs scripts/requirements-regroup.mjs, scripts/requirements-lift.mjs, scripts/requirements-tree.mjs, and a fixture ledger/proposal built by this file under the OS temp directory.
 * @outputs PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
 * @effects disk (creates fixtures and scratch files under the OS temp directory; never touches a real project), process (spawns node as a child)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, linkSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { isTextPlaced, regroupProblems, resolveTargetOutcome } from "../../../scripts/requirements-regroup.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };

const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const REGROUP = join(REPO_ROOT, "scripts/requirements-regroup.mjs");
const LIFT = join(REPO_ROOT, "scripts/requirements-lift.mjs");

const NODE_WARNING = [/^\(node:\d+\) /, /^Reparsing as ES module because/, /^To eliminate this warning, add "type": "module"/, /^\(Use `node --trace-warnings/];
const lines = (s) => (s ?? "").replace(/\r/g, "").split("\n").filter((l, i, all) => !(l === "" && i === all.length - 1));
const own = (stderr) => lines(stderr).filter((l) => !NODE_WARNING.some((re) => re.test(l)));
const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^GIT_/.test(k)) delete env[k]; return env; };
const node = (args, cwd, extra = {}) => spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 120_000, env: cleanEnv(), ...extra });
const regroup = (args, cwd, script = REGROUP) => node([script, ...args], cwd);
const lift = (args, cwd) => node([LIFT, ...args], cwd);
/** A refusal must be the command's own named one, never Node's crash. */
const crashed = (r) => /Cannot find module|\bERR_[A-Z_]+|^\s+at .+:\d+:\d+\)?$/m.test(r?.stderr ?? "") || r?.status === null;
const said = (r) => [...own(r?.stderr), ...lines(r?.stdout)].join("\n");
const mentions = (r, x) => (x instanceof RegExp ? x.test(said(r)) : said(r).includes(x));
const word = (n) => new RegExp(`(?<![\\w-])${n}(?![\\w-])`);
const bare = (seg) => seg.replace(/\r?\n$/, "");
const lineOf = (txt, heading, nth = 1) => { let k = 0; const ls = txt.split("\n"); for (let i = 0; i < ls.length; i++) if (ls[i] === heading && ++k === nth) return i + 1; return -1; };

const scratchRoot = tmpDir(join(tmpdir(), "regroup-test-"));
let caseN = 0;

// ---------------------------------------------------------------- the fixture (built here; never a real project's)
const H = { partA: "# Part A. Ingest", load: "## 1. Load files", build: "## 2. Build at production size", sizing: "### 2a. Sizing", partB: "# Part B. Report", render: "## 3. Render", partG: "# Part G. General engineering requirements", g1: "## G1. Configuration", g2: "## G2. Module boundaries", oq: "## Open questions", dom: "## Deliberate omissions" };
const TH = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
const FX = [
  "# fixture requirements", "", "Intro prose for the regroup fixture.", "",
  H.partA, "",
  H.load, "", ...TH,
  "| R-001 | WHEN a file arrives, the loader shall read every line of it into the staging table before any check runs. | implemented | `tests/load.test.mjs::R-001: the loader reads every line` |",
  "| R-002 | The loader shall refuse a file whose header row names an unknown column, naming that column and its position. | implemented | `tests/load.test.mjs::R-002: an unknown column is refused` |",
  "| R-003 | The loader shall record each refused file in the import log with the time, the file name and the refusal reason. | planned | — |",
  "",
  H.build, "", ...TH,
  "| R-004 | The fixture builder shall write the production-size dataset with ten thousand accounts and their transactions in one run. | implemented | `tests/build.test.mjs::R-004: the builder writes the full dataset` |",
  "| R-005 | The fixture builder shall finish the production-size run within the time budget the build notes declare for it. | planned | `tests/missing.test.mjs::R-005: the builder finishes in budget` |",
  "",
  H.sizing, "", ...TH,
  "| R-006 | The sizing script shall print the row count of every staging table after the production-size build completes. | untested | — |",
  "",
  H.partB, "",
  H.build, "", ...TH,
  "| R-007 | The report build shall render every analyst page from the production-size dataset without sampling any table. | implemented | `tests/render.test.mjs::R-007: every page renders from the full dataset` |",
  "| R-008 | The report build shall refuse to publish a page whose source table holds fewer rows than the production-size floor. | planned | — |",
  "",
  H.render, "", ...TH,
  "| R-009 | The renderer shall write each analyst page as one HTML file whose title names the account under review. | implemented | `tests/render.test.mjs::R-009: each page is one HTML file` |",
  "| R-010 | The renderer shall escape every account name before it places that name inside the page's HTML markup. | violated | `tests/render.test.mjs::R-010: account names are escaped` |",
  "",
  H.partG, "", "Prose for the general block.", "",
  H.g1, "", ...TH,
  "| G-001 | The fixture's first general row shall hold for every module the fixture's code map lists by name. | untested | — |",
  "| G-002 | The fixture's second general row shall hold for every tunable the fixture's configuration surface defines by name. | untested | — |",
  "",
  H.g2, "", ...TH,
  "| G-004 | The fixture's third general row shall hold for every module boundary the fixture's code map draws between two layers. | untested | — |",
  "",
  H.oq, "", "1. An open question.", "",
  H.dom, "", "1. A deliberate omission.", "",
].join("\n");
const FX_FILES = { "tests/load.test.mjs": "// fixture test file\n", "tests/build.test.mjs": "// fixture test file\n", "tests/render.test.mjs": "// fixture test file\n", "src/report/render.mjs": "export {};\n", "README.md": "# fixture\n" };
const L15 = lineOf(FX, H.build, 1), L30 = lineOf(FX, H.build, 2);
const L7 = lineOf(FX, H.load), L22 = lineOf(FX, H.sizing), L37 = lineOf(FX, H.render);
const FX_HOME = { "R-001": "FEAT-001", "R-002": "FEAT-001", "R-003": "FEAT-001", "R-004": "FEAT-002", "R-005": "FEAT-002", "R-006": "SUB-001", "R-007": "FEAT-002", "R-008": "FEAT-004", "R-009": "FEAT-004", "R-010": "FEAT-004", "G-001": "SUB-900", "G-002": "SUB-900", "G-004": "SUB-901" };
const FX_PLACED = ["R-003", "R-005", "R-006", "R-008", "G-001", "G-002", "G-004"]; // Evidence names no path under the root
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const lfOf = (text) => text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
const pinOf = (text) => ({ sha256: sha(Buffer.from(lfOf(text), "utf8")), rows: (text.match(/^\|\s*[RG]-\d{3,4}\s*\|/gm) ?? []).length });
const tag = (k) => `item ${k}`;

/** Every record R-1170's lift reader derives for this flat fixture, in §3.2's order (for the honest fixture only). */
const WANT_RECORDS = [
  { line: lineOf(FX, H.partA), to: "CAP-01", rows: [] }, { line: lineOf(FX, H.load), to: "FEAT-001", rows: [] },
  { line: L15, to: "FEAT-002", rows: [] }, { line: lineOf(FX, H.sizing), to: "SUB-001", rows: [] },
  { line: lineOf(FX, H.partB), to: "CAP-02", rows: [] }, { line: L30, to: "FEAT-002", rows: [] }, { line: L30, to: "FEAT-004", rows: ["R-008"] },
  { line: lineOf(FX, H.render), to: "FEAT-004", rows: [] }, { line: lineOf(FX, H.partG), to: "FEAT-900", rows: [] },
  { line: lineOf(FX, H.g1), to: "SUB-900", rows: [] }, { line: lineOf(FX, H.g2), to: "SUB-901", rows: [] },
];

/** The honest proposal (§3.3): FEAT-003 folds into FEAT-002, R-008 moves to FEAT-004, FEAT-005 is a gap with evidence. */
function fxProposal() {
  const f = (h, nth = 1) => ({ line: lineOf(FX, h, nth), heading: h });
  const p = {
    lift: 1, pin: pinOf(FX), head: { through: lineOf(FX, H.partA) - 1 },
    tree: [
      { id: "CAP-01", label: "Ingest", purpose: "Load the analyst's source files into staging and build the dataset the desk reads.", outcome: "Every source file the analyst drops is staged whole, refused by name or logged.", from: [f(H.partA)], features: [
        { id: "FEAT-001", label: "Load source files", purpose: "Read each arriving file into staging, refusing unknown columns by name and logging each refusal.", status: "active", from: [f(H.load)], rows: ["R-001", "R-002", "R-003"], subgroups: [] },
        { id: "FEAT-002", label: "Build at production size", purpose: "Build the full dataset in one run, inside the time budget the build notes declare.", status: "active", from: [f(H.build, 1), f(H.build, 2)], rows: ["R-004", "R-005", "R-007"], subgroups: [
          { id: "SUB-001", label: "Sizing", purpose: "Print the staging table sizes after each full build.", from: [f(H.sizing)], rows: ["R-006"] }] }] },
      { id: "CAP-02", label: "Report", purpose: "Render the analyst pages from the full dataset and publish only what the floor allows.", outcome: "Each analyst page is one escaped HTML file built from unsampled tables.", from: [f(H.partB)], features: [
        { id: "FEAT-004", label: "Render analyst pages", purpose: "Write each analyst page as one escaped HTML file and hold back pages under the floor.", status: "active", from: [f(H.render)], rows: ["R-009", "R-010", "R-008"], subgroups: [] },
        { id: "FEAT-005", label: "Export analyst pages", purpose: "Export the rendered analyst pages for the case file; no row holds it yet.", status: "proposed", from: [], rows: [], subgroups: [] }] },
      { id: "CAP-90", from: [], features: [{ id: "FEAT-900", from: [f(H.partG)], rows: [], subgroups: [{ id: "SUB-900", from: [f(H.g1)], rows: ["G-001", "G-002"] }, { id: "SUB-901", from: [f(H.g2)], rows: ["G-004"] }] }] },
    ],
    tail: { heading: "# Open questions and deliberate omissions", from: [], keep: [f(H.oq), f(H.dom)] },
  };
  const mappingNodesOf = (q) => q.tree.flatMap((c) => [{ id: c.id, level: 1, node: c }, ...(c.features ?? []).flatMap((ft) => [{ id: ft.id, level: 2, node: ft }, ...(ft.subgroups ?? []).map((s) => ({ id: s.id, level: 3, node: s }))])]);
  const reasons = WANT_RECORDS.map((r, k) => ({ line: r.line, to: r.to, why: `the rows under this old line serve the node they now sit in (reason ${tag(k)})` }));
  const verdicts = Object.keys(FX_HOME).map((id, k) => ({ id, at: FX_HOME[id], verdict: "keep", reason: `the row serves its home directly (keep ${tag(k)})` }));
  const v3 = verdicts.find((v) => v.id === "R-003"); delete v3.reason; v3.verdict = "move"; v3.targets = [{ to: "FEAT-004", reason: "the import log is read when the pages render (target alpha)" }];
  const v5 = verdicts.find((v) => v.id === "R-005"); delete v5.reason; v5.verdict = "share"; v5.targets = [{ to: "FEAT-001", reason: "the build budget also bounds file loading (target bravo)" }, { to: "FEAT-004", reason: "the renderer reads inside the same budget (target charlie)" }];
  p.regroup = {
    read: ["README.md", "tests/"], reasons,
    placed: Object.fromEntries(FX_PLACED.map((id, k) => [id, `placed by its text alone, which names this node's work (placed ${tag(k)})`])),
    evidence: { "FEAT-005": ["src\\report\\render.mjs"] },
    review: { drafter: "anthropic", reviewer: "openai", verdicts, claims: [] },
    refuted: [{ id: "R-003", to: "FEAT-004", reason: "the log is written at load time, so it stays with loading (refute alpha)" }, { id: "R-005", to: "FEAT-004", reason: "rendering keeps its own budget (refute bravo)" }],
    questions: [
      { ask: "Should the build budget row also bind file loading (ask alpha)?", recommendation: "Yes, share it once shares can be carried (recommend alpha).", about: [{ id: "R-005", to: "FEAT-001" }] },
      { ask: "The floor row's move to rendering stands but its reason was rejected; keep the move (ask bravo)?", recommendation: "Keep the move and reword the reason (recommend bravo).", about: [{ line: L30, to: "FEAT-004" }] },
    ],
  };
  const claims = [];
  for (const x of mappingNodesOf(p)) {
    if (["CAP-90", "FEAT-900", "SUB-900", "SUB-901"].includes(x.id)) continue;
    claims.push({ node: x.id, field: "purpose", text: x.node.purpose, verdict: "accept", reason: `the claim matches the rows it describes (claim ${tag(claims.length)})` });
    if (x.level === 1) claims.push({ node: x.id, field: "outcome", text: x.node.outcome, verdict: "accept", reason: `the claim matches the rows it describes (claim ${tag(claims.length)})` });
  }
  for (const r of reasons) claims.push({ line: r.line, to: r.to, text: r.why, verdict: "accept", reason: `the claim matches the rows it describes (claim ${tag(claims.length)})` });
  p.regroup.review.claims = claims;
  const rj = claims.find((c) => c.line === L30 && c.to === "FEAT-004");
  rj.verdict = "reject"; rj.reason = "the move stands but this reason names the wrong reader (reject zulu)";
  return p;
}
/** A mutated copy of the honest proposal (claim text is NOT re-synced: a mutation that makes a quoted claim text stale must stay stale). */
function variant(fn) {
  const p = structuredClone(fxProposal());
  fn(p);
  return p;
}
function mappingNodesOf(q) { return q.tree.flatMap((c) => [{ id: c.id, level: 1, node: c }, ...(c.features ?? []).flatMap((ft) => [{ id: ft.id, level: 2, node: ft }, ...(ft.subgroups ?? []).map((s) => ({ id: s.id, level: 3, node: s }))])]); }
const verdictOf = (p, id) => p.regroup.review.verdicts.find((v) => v.id === id);
const claimAt = (p, pred) => p.regroup.review.claims.findIndex(pred);

const PROP_REL = join("docs", "regroup", "proposal.json");
function fxRoot(label, p) {
  const d = join(scratchRoot, "cases", `${++caseN}-${label.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}`);
  mkdirSync(join(d, "docs", "regroup"), { recursive: true });
  writeFileSync(join(d, "REQUIREMENTS.md"), FX);
  for (const [rel, body] of Object.entries(FX_FILES)) { mkdirSync(dirname(join(d, rel)), { recursive: true }); writeFileSync(join(d, rel), body); }
  writeFileSync(join(d, PROP_REL), `${JSON.stringify(p, null, 2)}\n`);
  return d;
}
function runFx(label, p, { out = null, script = REGROUP } = {}) {
  const dir = fxRoot(label, p);
  const prop = join(dir, PROP_REL);
  const page = out ?? join(scratchRoot, "pages", `${caseN}.md`);
  mkdirSync(join(scratchRoot, "pages"), { recursive: true });
  const r = regroup(["--root", dir, "--proposal", prop, "--out", page], scratchRoot, script);
  return { dir, prop, page, r, text: (() => { try { return readFileSync(page, "utf8"); } catch { return null; } })() };
}
/** One refusal: exit 1, naming every item in `names`, writing no page. Returns true/false. */
function refusedCase(p, names, opts = {}) {
  const x = runFx(`c${caseN}`, p, opts);
  return x.r.status === 1 && !crashed(x.r) && names.every((nm) => mentions(x.r, nm)) && !existsSync(x.page);
}
/** Runs every {p, names} case; returns {ok, why} naming the first failing case. */
function allRefused(cases) {
  for (const [label, p, names, opts] of cases) {
    if (!refusedCase(p, names, opts)) {
      const x = runFx(`dbg-${caseN}`, p, opts);
      return { ok: false, why: `${label}: status=${x.r.status} crashed=${crashed(x.r)} page=${existsSync(x.page)} ` + own(x.r.stderr).slice(0, 2).join(" | ") };
    }
  }
  return { ok: true, why: "" };
}

// ================================================================== T1 is pinned in requirements-lift.test.mjs (R-1170).

// ================================================================== T2
{
  const pass = runFx("pass", fxProposal());
  const okPass = pass.r.status === 0 && !crashed(pass.r) && pass.text !== null && pass.text.startsWith("# Regroup review packet");
  const bad = variant((q) => { mappingNodesOf(q).find((x) => x.id === "FEAT-004").node.rows = mappingNodesOf(q).find((x) => x.id === "FEAT-004").node.rows.filter((r) => r !== "R-010"); });
  const badRun = runFx("lift-refuses", bad);
  const direct = lift(["--root", badRun.dir, "--mapping", badRun.prop], scratchRoot);
  const liftWords = own(direct.stderr);
  const okRefused = badRun.r.status === 1 && !crashed(badRun.r) && !existsSync(badRun.page) && liftWords.length > 0 && liftWords.every((l) => said(badRun.r).includes(l));
  // req: R-1171
  check("R-1171: a passing proposal writes the review page, and one the lift's dry run refuses writes no page and names the lift's problem", okPass && okRefused,
    `pass: status=${pass.r.status} text=${pass.text !== null} refused: status=${badRun.r.status} words=${liftWords.length}`);
}

// ================================================================== T3
if (process.platform !== "win32") {
  const link = join(scratchRoot, "regroup-link.mjs");
  try { symlinkSync(REGROUP, link); } catch {}
  const pass = runFx("pass-for-link", fxProposal());
  const x = runFx("via-link", fxProposal(), { script: link });
  // req: R-1171
  check("R-1171: run through a symlink to the script, the command still writes its page", x.r.status === 0 && !crashed(x.r) && x.text !== null && x.text === pass.text,
    `status=${x.r.status} ` + own(x.r.stderr).slice(0, 3).join(" | "));
}

// ================================================================== T19
{
  const clash = (pick) => {
    const dir = fxRoot(`clash-${caseN}`, fxProposal());
    const prop = join(dir, PROP_REL);
    const target = pick(dir, prop);
    const before = readFileSync(target);
    const r = regroup(["--root", dir, "--proposal", prop, "--out", target], scratchRoot);
    return r.status === 1 && !crashed(r) && readFileSync(target).equals(before);
  };
  const ok = clash((dir) => join(dir, "REQUIREMENTS.md")) && clash((dir, prop) => prop);
  // req: R-1171
  check("R-1171: an --out naming the ledger or the proposal is refused and leaves that file byte-identical", ok);
}

// ================================================================== T20
if (process.platform !== "win32") {
  const dir = fxRoot("t20-link", fxProposal());
  const prop = join(dir, PROP_REL);
  const link = join(scratchRoot, `prop-link-${++caseN}.json`);
  try { symlinkSync(prop, link); } catch {}
  const before = readFileSync(prop);
  const r = regroup(["--root", dir, "--proposal", prop, "--out", link], scratchRoot);
  // req: R-1171
  check("R-1171: an --out that is a symlink to the proposal is refused and leaves the proposal byte-identical", r.status === 1 && !crashed(r) && readFileSync(prop).equals(before),
    `status=${r.status} ` + own(r.stderr).slice(0, 2).join(" | "));
}

// ================================================================== R-1171 (--out against every alias, build brief 2 item 2)
{
  // A case-only alias of the ledger, on a case-insensitive file system only; realpathSync keeps
  // the case as typed (the MUST the seat found), so the fix compares by device and inode instead.
  const probeDir = join(scratchRoot, "case-probe");
  mkdirSync(probeDir, { recursive: true });
  writeFileSync(join(probeDir, "CaseProbe.tmp"), "x");
  const caseInsensitive = existsSync(join(probeDir, "caseprobe.tmp"));
  if (caseInsensitive) {
    const dir = fxRoot("t19b-case-alias", fxProposal());
    const prop = join(dir, PROP_REL);
    const ledgerUpper = join(dir, "REQUIREMENTS.MD");
    const before = readFileSync(join(dir, "REQUIREMENTS.md"));
    const r = regroup(["--root", dir, "--proposal", prop, "--out", ledgerUpper], scratchRoot);
    const ok = r.status === 1 && !crashed(r) && readFileSync(join(dir, "REQUIREMENTS.md")).equals(before);
    // req: R-1171
    check("R-1171: an --out that is a case-only alias of the ledger is refused and leaves the ledger byte-identical", ok,
      `status=${r.status} ` + own(r.stderr).slice(0, 2).join(" | "));
  }
}
{
  // A hard link to the proposal: a different path, the same inode; realpathSync never resolves
  // a hard link to its sibling, so the fix must compare device and inode, not the real path string.
  const dir = fxRoot("t20b-hardlink", fxProposal());
  const prop = join(dir, PROP_REL);
  const link = join(scratchRoot, `prop-hardlink-${++caseN}.json`);
  let linked = false;
  try { linkSync(prop, link); linked = true; } catch { /* no hard-link support on this volume; skip */ }
  if (linked) {
    const before = readFileSync(prop);
    const r = regroup(["--root", dir, "--proposal", prop, "--out", link], scratchRoot);
    const ok = r.status === 1 && !crashed(r) && readFileSync(prop).equals(before);
    // req: R-1171
    check("R-1171: an --out that is a hard link to the proposal is refused and leaves the proposal byte-identical", ok,
      `status=${r.status} ` + own(r.stderr).slice(0, 2).join(" | "));
  }
}
{
  // A directory at --out is refused by name, never a crash (writeFileSync would otherwise throw EISDIR).
  const dir = fxRoot("t-dir-out", fxProposal());
  const prop = join(dir, PROP_REL);
  const dirOut = join(scratchRoot, `dir-out-${++caseN}`);
  mkdirSync(dirOut, { recursive: true });
  const r = regroup(["--root", dir, "--proposal", prop, "--out", dirOut], scratchRoot);
  const ok = r.status === 1 && !crashed(r) && existsSync(dirOut);
  // req: R-1171
  check("R-1171: an --out naming a directory is refused, never a crash", ok, `status=${r.status} ` + own(r.stderr).slice(0, 2).join(" | "));
}

// ================================================================== T21
{
  const pagePath = join(scratchRoot, "earlier-page.md");
  const first = runFx("earlier-page", fxProposal(), { out: pagePath });
  const hadPage = existsSync(pagePath);
  const failing = variant((q) => { q.regroup.reasons = q.regroup.reasons.slice(1); });
  const second = runFx("earlier-page-fail", failing, { out: pagePath });
  const removed = first.r.status === 0 && hadPage && second.r.status === 1 && !crashed(second.r) && !existsSync(pagePath);
  const notes = join(scratchRoot, "not-a-page.md");
  const body = "# my notes\n\nThis file is not a review page.\n";
  writeFileSync(notes, body);
  const third = runFx("not-a-page-fail", failing, { out: notes });
  const untouched = third.r.status === 1 && !crashed(third.r) && readFileSync(notes, "utf8") === body;
  // req: R-1171
  check("R-1171: a failing run removes an earlier review page at --out and leaves a file there that is not a review page unchanged", removed && untouched,
    `removed=${removed} untouched=${untouched}`);
}

// ================================================================== T4
{
  const UNSORTED = "Not yet sorted:";
  const cases = [
    ["FEAT-001 keeps a placeholder purpose", variant((q) => { mappingNodesOf(q).find((x) => x.id === "FEAT-001").node.purpose = `${UNSORTED} the rows of old section "1. Load files".`; }), ["FEAT-001"]],
    ["CAP-02 keeps a placeholder outcome", variant((q) => { q.tree[1].outcome = `${UNSORTED} the rows of old section "Part B. Report" sorted into the tree.`; }), ["CAP-02"]],
    ["SUB-001 keeps a placeholder purpose", variant((q) => { mappingNodesOf(q).find((x) => x.id === "SUB-001").node.purpose = `${UNSORTED} the rows of old section "2a. Sizing".`; }), ["SUB-001"]],
  ];
  const { ok: refuseOk, why } = allRefused(cases);
  const exempt = variant((q) => { const c = q.tree.find((x) => x.id === "CAP-90"); c.purpose = `${UNSORTED} reserved.`; c.outcome = `${UNSORTED} reserved.`; c.features[0].purpose = `${UNSORTED} reserved.`; for (const sg of c.features[0].subgroups) sg.purpose = `${UNSORTED} reserved.`; });
  const exemptRun = runFx("reserved-placeholder", exempt);
  const exemptOk = exemptRun.r.status === 0 && !crashed(exemptRun.r) && exemptRun.text !== null;
  // req: R-1172
  check('R-1172: a node outside the reserved general-engineering nodes that keeps a "Not yet sorted:" purpose or outcome is refused', refuseOk && exemptOk, why || `exempt status=${exemptRun.r.status}`);
}

// ================================================================== T5
{
  const cases = [
    [`reason for line ${L22} -> SUB-001 missing`, variant((q) => { q.regroup.reasons = q.regroup.reasons.filter((r) => !(r.line === L22)); q.regroup.review.claims = q.regroup.review.claims.filter((c) => c.line !== L22); }), [String(L22)]],
    [`reason for line ${L37} -> FEAT-004 repeated`, variant((q) => { q.regroup.reasons.push({ ...q.regroup.reasons.find((r) => r.line === L37 && r.to === "FEAT-004") }); }), [String(L37)]],
    [`stale reason for line ${L7}`, variant((q) => { q.regroup.reasons.push({ line: L7, to: "FEAT-002", why: "a reason for a line the lift does not report (stale)" }); }), [String(L7)]],
    [`two same-text headings reasoned by text (line ${L30})`, variant((q) => { const r = q.regroup.reasons.find((y) => y.line === L30 && y.to === "FEAT-002"); r.line = L15; q.regroup.review.claims = q.regroup.review.claims.filter((c) => !(c.line === L30 && c.to === "FEAT-002")); }), [String(L30)]],
  ];
  const { ok, why } = allRefused(cases);
  // req: R-1173
  check("R-1173: each line the lift reports needs exactly one reason by old line and node, a missing, repeated or stale reason is refused, and two same-text headings are reasoned apart", ok, why);
}

// ================================================================== T6
{
  const cases = [
    ["FEAT-005 names no evidence path", variant((q) => { delete q.regroup.evidence["FEAT-005"]; }), ["FEAT-005"]],
    ["FEAT-005's evidence list is empty", variant((q) => { q.regroup.evidence["FEAT-005"] = []; }), ["FEAT-005"]],
    ["FEAT-005 names a missing path", variant((q) => { q.regroup.evidence["FEAT-005"] = ["src/report/missing.mjs"]; }), ["src/report/missing.mjs"]],
    ["FEAT-005 names a path that `..` leads outside the root", variant((q) => { q.regroup.evidence["FEAT-005"] = ["../outside.txt"]; }), ["FEAT-005"]],
  ];
  const { ok, why } = allRefused(cases);
  const pass = runFx("backslash-pass", fxProposal());
  const passOk = pass.r.status === 0 && !crashed(pass.r);
  // req: R-1174
  check("R-1174: a proposed feature with no evidence path, a missing path or a path leaving the root is refused, and an existing path written with backslashes passes", ok && passOk, why || `backslash pass status=${pass.r.status}`);
}

// ================================================================== T7
{
  const cases = [
    ["review record misses R-009", variant((q) => { q.regroup.review.verdicts = q.regroup.review.verdicts.filter((v) => v.id !== "R-009"); }), ["R-009"]],
    ["review record repeats R-009", variant((q) => { q.regroup.review.verdicts.push({ ...verdictOf(q, "R-009") }); }), ["R-009"]],
    ["R-008's verdict names a stale home", variant((q) => { verdictOf(q, "R-008").at = "FEAT-002"; }), ["R-008"]],
    ["R-009's verdict is neither keep, move nor share", variant((q) => { verdictOf(q, "R-009").verdict = "maybe"; }), ["R-009"]],
    ["R-003's move names an unknown target", variant((q) => { verdictOf(q, "R-003").targets[0].to = "FEAT-999"; q.regroup.refuted[0].to = "FEAT-999"; }), ["FEAT-999"]],
    ["R-009's keep verdict has an empty reason", variant((q) => { verdictOf(q, "R-009").reason = ""; }), ["R-009"]],
    ["R-005's share target carries no reason of its own", variant((q) => { delete verdictOf(q, "R-005").targets[0].reason; }), ["R-005"]],
  ];
  const { ok, why } = allRefused(cases);
  // req: R-1175
  check("R-1175: a review record missing a row, repeating one, naming a stale home, an unknown verdict or target, an empty reason or a target without its own reason is refused", ok, why);
}

// ================================================================== T8
{
  const cases = [
    ["R-003's move names two targets", variant((q) => { verdictOf(q, "R-003").targets.push({ to: "FEAT-002", reason: "also feeds the build (target delta)" }); q.regroup.refuted.push({ id: "R-003", to: "FEAT-002", reason: "it does not (refute delta)" }); }), ["R-003"]],
    ["R-003's move target is left unresolved", variant((q) => { q.regroup.refuted = q.regroup.refuted.filter((x) => x.id !== "R-003"); }), ["R-003"]],
    ["R-005's share target FEAT-004 is left unresolved", variant((q) => { q.regroup.refuted = q.regroup.refuted.filter((x) => x.id !== "R-005"); }), ["R-005", "FEAT-004"]],
    ["R-005's share target FEAT-004 is resolved twice", variant((q) => { q.regroup.questions[0].about.push({ id: "R-005", to: "FEAT-004" }); }), ["R-005"]],
  ];
  const { ok, why } = allRefused(cases);
  const pass = runFx("mixed-share-pass", fxProposal());
  const passOk = pass.r.status === 0 && !crashed(pass.r);
  // req: R-1175
  check("R-1175: each move or share target needs exactly one outcome keyed by row and target, so a share carried to one feature and refuted for another passes, and a target left unresolved or resolved twice is refused", ok && passOk, why || `mixed-share pass status=${pass.r.status}`);
}

// ================================================================== T9
{
  const bad = variant((q) => { q.regroup.review.reviewer = q.regroup.review.drafter; });
  const badRun = runFx("same-lineage-no-flag", bad);
  const badOk = badRun.r.status === 1 && !crashed(badRun.r) && (mentions(badRun.r, /same-family/i) || mentions(badRun.r, /lineage/i));
  const good = variant((q) => { q.regroup.review.reviewer = q.regroup.review.drafter; q.regroup.review.same_family = true; });
  const goodRun = runFx("same-lineage-flagged", good);
  const goodOk = goodRun.r.status === 0 && !crashed(goodRun.r);
  // req: R-1175
  check("R-1175: a record whose drafter and reviewer share a lineage is refused unless it declares same-family", badOk && goodOk, `bad status=${badRun.r.status} good status=${goodRun.r.status} ` + own(goodRun.r.stderr).slice(0, 2).join(" | "));
}

// ================================================================== T10
{
  const cases = [
    ["text-placed R-006 has no placed reason", variant((q) => { delete q.regroup.placed["R-006"]; }), ["R-006"]],
    ["R-005 (no local evidence) has no placed reason", variant((q) => { delete q.regroup.placed["R-005"]; }), ["R-005"]],
    ["R-001 (has local evidence) carries a placed reason", variant((q) => { q.regroup.placed["R-001"] = "placed by text (extra)"; }), ["R-001"]],
    ["text-placed R-003's placed reason is empty", variant((q) => { q.regroup.placed["R-003"] = ""; }), ["R-003"]],
  ];
  const { ok, why } = allRefused(cases);
  // req: R-1176
  check("R-1176: a text-placed row without a placed reason, or a placed reason for a row with local evidence, is refused", ok, why);
}

// ================================================================== R-1176 (basketball-geek's plain evidence form)
{
  const dir = join(scratchRoot, "r1176-rail-form");
  mkdirSync(join(dir, "tests"), { recursive: true });
  writeFileSync(join(dir, "tests", "mini.test.mjs"), "// fixture test file\n");
  // basketball-geek writes evidence the trace rail's plain way: no backticks, split on commas.
  const plainCell = "tests/mini.test.mjs::R-900: plain form evidence, tests/missing.test.mjs::a title, with a comma in it";
  const backtickCell = "`tests/mini.test.mjs::R-900: backtick form evidence`";
  const missingCell = "tests/missing.test.mjs::a title that names no real path";
  const plainOk = !isTextPlaced(dir, { id: "R-900", evidence: plainCell });
  const backtickOk = !isTextPlaced(dir, { id: "R-900", evidence: backtickCell });
  const missingOk = isTextPlaced(dir, { id: "R-901", evidence: missingCell });
  // req: R-1176
  check("R-1176: a row whose evidence names an existing path in the trace rail's plain or backtick form is evidence-placed",
    plainOk && backtickOk && missingOk, `plain=${plainOk} backtick=${backtickOk} missing(still text-placed)=${missingOk}`);
}

// ================================================================== T11
{
  const N = 60; // > PROBLEM_LINE_CAP (40)
  const p = variant((q) => { for (let k = 1; k <= N; k++) q[`x${String(k).padStart(2, "0")}`] = k; });
  const x = runFx("cap", p);
  const errLines = own(x.r.stderr);
  const shown = new Set(errLines.flatMap((l) => [...l.matchAll(/(?<![\w-])x\d{2}(?![\w-])/g)].map((m) => m[0])));
  const restMatch = errLines.some((l) => /\b(\d+)\b[^\n]*\bmore\b/.test(l));
  // req: R-1177
  check("R-1177: a proposal with more problems than the cap prints at most the problem-line cap and the count of the rest", x.r.status === 1 && !crashed(x.r) && errLines.length <= 41 && shown.size > 0 && shown.size <= 40 && restMatch && !existsSync(x.page),
    `lines=${errLines.length} shown=${shown.size} rest=${restMatch}`);
}

// ================================================================== T12
{
  const dir = fxRoot("usage", fxProposal());
  const prop = join(dir, PROP_REL), page = join(scratchRoot, "pages", "usage.md");
  const runs = [["--proposal", prop, "--out", page], ["--root", dir, "--out", page], ["--root", dir, "--proposal", prop]].map((a) => regroup(a, scratchRoot));
  const ok = runs.every((r) => r.status === 2 && !crashed(r) && ["--root", "--proposal", "--out"].every((f) => said(r).includes(f))) && !existsSync(page);
  // req: R-1177
  check("R-1177 fixture: a run missing --root, --proposal or --out exits 2 with usage", ok, runs.map((r) => r.status).join(","));
}

// ================================================================== T13
{
  const i3 = (q) => q.regroup.review.verdicts.findIndex((v) => v.id === "R-003");
  const LEVELS = [
    ["top", "regroop", (q) => { q.regroop = {}; }],
    ["pin", "pin.sha265", (q) => { q.pin.sha265 = q.pin.sha256; }],
    ["head", "head.thru", (q) => { q.head.thru = 4; }],
    ["capability", "tree[0].lable", (q) => { q.tree[0].lable = "Ingest"; }],
    ["feature", "tree[0].features[0].statsu", (q) => { q.tree[0].features[0].statsu = "frozen"; }],
    ["subgroup", "tree[0].features[1].subgroups[0].purpse", (q) => { q.tree[0].features[1].subgroups[0].purpse = "x"; }],
    ["from", "tree[0].from[0].lin", (q) => { q.tree[0].from[0].lin = 5; }],
    ["tail", "tail.heding", (q) => { q.tail.heding = "x"; }],
    ["keep", "tail.keep[0].headng", (q) => { q.tail.keep[0].headng = "x"; }],
    ["regroup", "regroup.resons", (q) => { q.regroup.resons = []; }],
    ["reason", "regroup.reasons[0].wy", (q) => { q.regroup.reasons[0].wy = "x"; }],
    ["review", "regroup.review.reveiwer", (q) => { q.regroup.review.reveiwer = "openai"; }],
    ["verdict", "regroup.review.verdicts[0].reasn", (q) => { q.regroup.review.verdicts[0].reasn = "x"; }],
    ["target", null, (q) => { q.regroup.review.verdicts[i3(q)].targets[0].reasn = "x"; }],
    ["claim", "regroup.review.claims[0].verdcit", (q) => { q.regroup.review.claims[0].verdcit = "accept"; }],
    ["refuted", "regroup.refuted[0].reasn", (q) => { q.regroup.refuted[0].reasn = "x"; }],
    ["question", "regroup.questions[0].recomendation", (q) => { q.regroup.questions[0].recomendation = "x"; }],
    ["about", "regroup.questions[0].about[0].too", (q) => { q.regroup.questions[0].about[0].too = "FEAT-001"; }],
  ];
  const misses = [];
  for (const [level, p0, fn] of LEVELS) {
    const p = variant(fn);
    const where = p0 ?? `regroup.review.verdicts[${i3(p)}].targets[0].reasn`;
    if (!refusedCase(p, [where])) misses.push(level);
  }
  const noRec = variant((q) => { delete q.regroup.questions[0].recommendation; });
  const noRecOk = refusedCase(noRec, ["recommendation"]);
  // req: R-1177
  check("R-1177: a misspelled key in any object level of a proposal is refused naming its path, and so is a question without a recommendation", misses.length === 0 && noRecOk, `misses=${misses.join(",")} noRecOk=${noRecOk}`);
}

// ================================================================== T14
{
  const pass = runFx("page-order", fxProposal());
  const page = pass.text ?? "";
  const dry = lift(["--root", pass.dir, "--mapping", pass.prop], scratchRoot);
  const proofLine = lines(dry.stdout).find((l) => l.startsWith("lift proof: "));
  const posQ1 = page.indexOf("1. Should the build budget row");
  const posTable = page.indexOf("| Feature | Rows | Status mix |");
  const posNodes = page.indexOf("## Capabilities, features and subgroups");
  const posLines = page.indexOf("## Reported lines");
  const hdr = posQ1 > 0 ? page.slice(0, posQ1) : "";
  const propBytes = readFileSync(pass.prop);
  const headerOk = page.startsWith("# Regroup review packet") && hdr.includes(sha(propBytes)) && hdr.includes(fxProposal().pin.sha256) && (proofLine === null || hdr.includes(proofLine)) && hdr.includes("anthropic") && hdr.includes("openai") && /placement verdicts: 13/i.test(hdr) && /claim verdicts: \d+/i.test(hdr);
  const orderOk = posQ1 > 0 && posQ1 < posTable && posTable < posNodes && posNodes < posLines;
  const tableBlock = page.slice(posTable, posNodes);
  const tableOk = ["FEAT-001", "FEAT-002", "FEAT-004", "FEAT-005", "FEAT-900"].every((id) => tableBlock.includes(id)) && /\b3\b/.test(tableBlock) && /implemented/.test(tableBlock);
  const nodesBlock = page.slice(posNodes, posLines);
  const purposesOk = ["CAP-01", "FEAT-001", "SUB-001", "CAP-02", "FEAT-004", "FEAT-005"].every((id) => nodesBlock.includes(id)) && (nodesBlock.includes("src/report/render.mjs") || nodesBlock.includes("src\\report\\render.mjs"));
  // req: R-1178
  check("R-1178: the page opens with both hashes, the proof line, the lineages and the placement and claim verdict counts, then the numbered questions, the feature table with status mix, and every node with its purpose and each proposed feature's evidence",
    pass.r.status === 0 && headerOk && orderOk && tableOk && purposesOk,
    `status=${pass.r.status} header=${headerOk} order=${orderOk} table=${tableOk} purposes=${purposesOk}`);
}

// ================================================================== T15
{
  const good = variant((q) => { q.regroup.review.reviewer = q.regroup.review.drafter; q.regroup.review.same_family = true; });
  const run = runFx("same-family-page", good);
  const page = run.text ?? "";
  // req: R-1178
  check('R-1178: a same-family record reads "same-family review" on the page and never "another lineage"', run.r.status === 0 && page.includes("same-family review") && !/another lineage/i.test(page), `status=${run.r.status}`);
}

// ================================================================== T16
{
  const pass = runFx("page-sections", fxProposal());
  const page = pass.text ?? "";
  const posLines = page.indexOf("## Reported lines");
  const posTargets = page.indexOf("## Move and share targets");
  const posClaims = page.indexOf("## Rejected claims");
  const posPlaced = page.indexOf("## Text-placed rows");
  const posAppendix = page.indexOf("## Appendix");
  const orderOk = posLines > 0 && posLines < posTargets && posTargets < posClaims && posClaims < posPlaced && posPlaced < posAppendix;
  const linesBlock = page.slice(posLines, posTargets);
  const linesOk = new RegExp(`Line ${L30} -> FEAT-004 \\(rows R-008\\)`).test(linesBlock);
  const targetsBlock = page.slice(posTargets, posClaims);
  const targetsOk = /R-003 -> FEAT-004: refuted/.test(targetsBlock) && /R-005 -> FEAT-001: asked/.test(targetsBlock) && /R-005 -> FEAT-004: refuted/.test(targetsBlock);
  const claimsBlock = page.slice(posClaims, posPlaced);
  const claimsOk = claimsBlock.includes("reject zulu");
  const placedBlock = page.slice(posPlaced, posAppendix);
  const placedOk = FX_PLACED.every((id) => placedBlock.includes(id));
  const appendixBlock = page.slice(posAppendix);
  const appendixOk = appendixBlock.includes("ten thousand accounts") && !page.slice(0, posAppendix).includes("ten thousand accounts");
  // req: R-1179
  check("R-1179: the page lists each reported line with its reason and rows, each move and share target with its own outcome, each rejected claim with its reason, each text-placed row with its reason, and every row only in the appendix after them",
    pass.r.status === 0 && orderOk && linesOk && targetsOk && claimsOk && placedOk && appendixOk,
    `order=${orderOk} lines=${linesOk} targets=${targetsOk} claims=${claimsOk} placed=${placedOk} appendix=${appendixOk}`);
}

// ================================================================== T22
{
  const cases = [
    ["FEAT-001's purpose has no claim verdict", variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.node === "FEAT-001" && c.field === "purpose"), 1); }), ["FEAT-001"]],
    ["CAP-02's outcome has no claim verdict", variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.node === "CAP-02" && c.field === "outcome"), 1); }), ["CAP-02"]],
    ["SUB-001's purpose has no claim verdict", variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.node === "SUB-001" && c.field === "purpose"), 1); }), ["SUB-001"]],
    [`line ${L37} -> FEAT-004 reason has no claim verdict`, variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.line === L37 && c.to === "FEAT-004"), 1); }), [String(L37)]],
    ["FEAT-004's purpose has two claim verdicts", variant((q) => { q.regroup.review.claims.push({ ...q.regroup.review.claims[claimAt(q, (c) => c.node === "FEAT-004" && c.field === "purpose")] }); }), ["FEAT-004"]],
    ["FEAT-002's purpose claim quotes a stale text", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "FEAT-002" && c.field === "purpose")].text = "Build the dataset (an older wording)."; }), ["FEAT-002"]],
    ["SUB-001's purpose claim has an empty reason", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "SUB-001")].reason = ""; }), ["SUB-001"]],
    ["CAP-01's purpose claim is neither accept nor reject", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "CAP-01" && c.field === "purpose")].verdict = "maybe"; }), ["CAP-01"]],
  ];
  const { ok, why } = allRefused(cases);
  const exempt = runFx("reserved-no-claims", variant((q) => {}));
  // the honest proposal already holds no claims for CAP-90/FEAT-900/SUB-900/SUB-901; confirm it still passes (no claim demanded of them).
  const exemptOk = exempt.r.status === 0 && !crashed(exempt.r);
  // req: R-1184
  check("R-1184: each purpose and outcome outside the reserved nodes and each reported line's reason needs exactly one accept or reject verdict with a reason and the claim's current text, a missing, repeated, stale or reasonless one is refused, and a reserved node needs none",
    ok && exemptOk, why || `exempt status=${exempt.r.status}`);
}

// ================================================================== T23
{
  const bad = allRefused([
    [`line ${L30} -> FEAT-004's rejected reason named in no question`, variant((q) => { q.regroup.questions = q.regroup.questions.slice(0, 1); }), [String(L30)]],
    ["FEAT-001's purpose claim is rejected and named in no question", variant((q) => { const c = q.regroup.review.claims[claimAt(q, (y) => y.node === "FEAT-001" && y.field === "purpose")]; c.verdict = "reject"; }), ["FEAT-001"]],
  ]);
  const good = runFx("rejected-in-question-pass", fxProposal());
  const goodOk = good.r.status === 0 && !crashed(good.r);
  // req: R-1184
  check("R-1184: a rejected claim named in no question is refused, and one named in a question passes", bad.ok && goodOk, bad.why || `good status=${good.r.status}`);
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
