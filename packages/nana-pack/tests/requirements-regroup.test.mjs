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
import { chmodSync, existsSync, linkSync, lstatSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { GIST_WORDS, PAGE_HEAD, isTextPlaced, regroupProblems, resolveTargetOutcome } from "../../../scripts/requirements-regroup.mjs";
import { buildIdentityMapping } from "../../../scripts/requirements-lift.mjs";

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
/**
 * Build brief 4's rule for every refusal test from now on: a substring that only the test's
 * own check prints, read from stderr alone — the lift's dry run echoes heading lines and row
 * IDs on stdout even when it fails downstream, so a row ID or line number found anywhere in
 * `said()` pins nothing.
 */
const saysOwn = (r, x) => { const s = own(r?.stderr).join("\n"); return x instanceof RegExp ? x.test(s) : s.includes(x); };
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
/**
 * A private copy of the regroup/lift module graph, laid out exactly like this checkout
 * (scripts/ beside templates/typescript/template/tests/ so every relative import still
 * resolves), under the scratch root. Used to aim --out at "the lift script" without ever
 * pointing at the tracked scripts/requirements-lift.mjs in this checkout (item 8b).
 */
function mirrorScripts() {
  const mirror = join(scratchRoot, `mirror-${++caseN}`);
  const files = [
    "scripts/requirements-regroup.mjs", "scripts/requirements-lift.mjs", "scripts/requirements-lift-proof.mjs",
    "scripts/requirements-tree.mjs", "scripts/requirements-trace.mjs",
    "templates/typescript/template/tests/requirements-trace.ts",
  ];
  for (const rel of files) { const dest = join(mirror, rel); mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, readFileSync(join(REPO_ROOT, rel))); }
  return { regroup: join(mirror, "scripts/requirements-regroup.mjs"), lift: join(mirror, "scripts/requirements-lift.mjs") };
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
{
  // Pin R-1171's "the lift and each evidence path" clause: --out naming the lift script, or
  // an evidence path the proposal names, is refused and leaves that file byte-identical. The
  // lift-script case runs against a private mirror of the module graph (item 8b), never the
  // scripts/requirements-lift.mjs tracked in this checkout — a regression here must not
  // overwrite a real source file.
  const dir = fxRoot("t19c-lift-and-evidence", fxProposal());
  const prop = join(dir, PROP_REL);
  const mirror = mirrorScripts();
  const liftBefore = readFileSync(mirror.lift);
  const liftRun = regroup(["--root", dir, "--proposal", prop, "--out", mirror.lift], scratchRoot, mirror.regroup);
  const liftOk = liftRun.status === 1 && !crashed(liftRun) && readFileSync(mirror.lift).equals(liftBefore);
  const evidencePath = join(dir, "src", "report", "render.mjs");
  const evBefore = readFileSync(evidencePath);
  const evRun = regroup(["--root", dir, "--proposal", prop, "--out", evidencePath], scratchRoot);
  const evOk = evRun.status === 1 && !crashed(evRun) && readFileSync(evidencePath).equals(evBefore);
  // req: R-1171
  check("R-1171: an --out naming the lift script or a proposal's evidence path is refused and leaves that file byte-identical",
    liftOk && evOk, `lift status=${liftRun.status} ok=${liftOk}; evidence status=${evRun.status} ok=${evOk}`);
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
  // Survivor 2/7: a removed file fails this check instead of throwing ENOENT and crashing
  // the whole test file before any later check runs.
  const untouched = third.r.status === 1 && !crashed(third.r) && existsSync(notes) && readFileSync(notes, "utf8") === body;
  // A run that would otherwise crash on a malformed shape (brief 2 item 3) is refused, not
  // crashed, and still removes an earlier page at --out.
  const pagePath2 = join(scratchRoot, "earlier-page-shape.md");
  const firstShape = runFx("earlier-page-shape", fxProposal(), { out: pagePath2 });
  const hadPage2 = existsSync(pagePath2);
  const shapeFail = variant((q) => { q.regroup.review.verdicts.push(null); });
  const secondShape = runFx("earlier-page-shape-fail", shapeFail, { out: pagePath2 });
  const removedShape = firstShape.r.status === 0 && hadPage2 && secondShape.r.status === 1 && !crashed(secondShape.r) && !existsSync(pagePath2);
  // An earlier page is recognised by its FIRST LINE, BOM and trailing CR removed, equalling
  // PAGE_HEAD exactly (M2) — a file whose first line only BEGINS with it is a different file
  // and must survive untouched; a BOM or CRLF page is still recognised and removed.
  const prefixOnly = join(scratchRoot, "prefix-only.md");
  const prefixBody = `${PAGE_HEAD} EXTRA\n\nNot actually a review page.\n`;
  writeFileSync(prefixOnly, prefixBody);
  const prefixRun = runFx("prefix-only-fail", failing, { out: prefixOnly });
  const prefixUntouched = prefixRun.r.status === 1 && !crashed(prefixRun.r) && existsSync(prefixOnly) && readFileSync(prefixOnly, "utf8") === prefixBody;
  const bomPage = join(scratchRoot, "bom-page.md");
  writeFileSync(bomPage, `﻿${PAGE_HEAD}\n\nBody.\n`);
  const bomRun = runFx("bom-page-fail", failing, { out: bomPage });
  const bomRemoved = bomRun.r.status === 1 && !crashed(bomRun.r) && !existsSync(bomPage);
  const crlfPage = join(scratchRoot, "crlf-page.md");
  writeFileSync(crlfPage, `${PAGE_HEAD}\r\n\r\nBody.\r\n`);
  const crlfRun = runFx("crlf-page-fail", failing, { out: crlfPage });
  const crlfRemoved = crlfRun.r.status === 1 && !crashed(crlfRun.r) && !existsSync(crlfPage);
  // A symlinked --out: a failing run removes the page the link points to and leaves the link.
  const linkTarget = join(scratchRoot, "symlink-target-page.md");
  const linkPath = join(scratchRoot, "symlink-to-page.md");
  const linkFirst = runFx("symlink-target-pass", fxProposal(), { out: linkTarget });
  const hadTarget = linkFirst.r.status === 0 && existsSync(linkTarget);
  try { symlinkSync(linkTarget, linkPath); } catch {}
  const linkRun = runFx("symlink-out-fail", failing, { out: linkPath });
  const linkStillThere = (() => { try { return lstatSync(linkPath).isSymbolicLink(); } catch { return false; } })();
  const symlinkOk = hadTarget && linkRun.r.status === 1 && !crashed(linkRun.r) && !existsSync(linkTarget) && linkStillThere;
  // req: R-1171
  check("R-1171: a failing run removes an earlier review page at --out and leaves a file there that is not a review page unchanged", removed && untouched && removedShape && prefixUntouched && bomRemoved && crlfRemoved && symlinkOk,
    `removed=${removed} untouched=${untouched} removedShape=${removedShape} prefixUntouched=${prefixUntouched} bomRemoved=${bomRemoved} crlfRemoved=${crlfRemoved} symlinkOk=${symlinkOk}`);
}

// ================================================================== R-1171 (M2: an unwritable --out is a named refusal)
if (process.platform !== "win32" && process.getuid?.() !== 0) {
  const dir = fxRoot("unwritable-out", fxProposal());
  const prop = join(dir, PROP_REL);
  const outDir = join(scratchRoot, `unwritable-${++caseN}`);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "page.md");
  chmodSync(outDir, 0o000);
  let r;
  try { r = regroup(["--root", dir, "--proposal", prop, "--out", outPath], scratchRoot); } finally { chmodSync(outDir, 0o755); }
  const ok = r.status === 1 && !crashed(r) && own(r.stderr).length > 0;
  // req: R-1171
  check("R-1171: an --out the command cannot write is refused by name, exit 1, with no stack trace", ok, `status=${r.status} crashed=${crashed(r)} ` + own(r.stderr).slice(0, 2).join(" | "));
}

// ================================================================== T4
{
  const UNSORTED = "Not yet sorted:";
  // Item 5 (M4): every case keeps its matching claim's quoted text in step with the mutated
  // purpose/outcome, so R-1184's stale-claim-text check cannot refuse it first — only the
  // placeholder check itself (R-1172) can, and each case asserts that check's own words
  // ("purpose still starts with" / "outcome still starts with"), not just the node's ID.
  const placeholderOf = (id) => `${UNSORTED} the rows of old section "${id} (M4 fixture)".`;
  const syncClaim = (q, node, field, text) => { q.regroup.review.claims.find((c) => c.node === node && c.field === field).text = text; };
  const cases = [
    ["FEAT-001 keeps a placeholder purpose, claim kept in step", variant((q) => {
      const ph = placeholderOf("FEAT-001");
      mappingNodesOf(q).find((x) => x.id === "FEAT-001").node.purpose = ph;
      syncClaim(q, "FEAT-001", "purpose", ph);
    }), ["FEAT-001", "purpose still starts with"]],
    ["CAP-02 keeps a placeholder outcome, claim kept in step", variant((q) => {
      const ph = placeholderOf("CAP-02");
      q.tree[1].outcome = ph;
      syncClaim(q, "CAP-02", "outcome", ph);
    }), ["CAP-02", "outcome still starts with"]],
    ["SUB-001 keeps a placeholder purpose, claim kept in step", variant((q) => {
      const ph = placeholderOf("SUB-001");
      mappingNodesOf(q).find((x) => x.id === "SUB-001").node.purpose = ph;
      syncClaim(q, "SUB-001", "purpose", ph);
    }), ["SUB-001", "purpose still starts with"]],
    // Item 5 (M4): a capability's own purpose, not only its outcome — the only node level T4
    // had never covered.
    ["CAP-01 keeps a placeholder purpose, claim kept in step", variant((q) => {
      const ph = placeholderOf("CAP-01");
      q.tree[0].purpose = ph;
      syncClaim(q, "CAP-01", "purpose", ph);
    }), ["CAP-01", "purpose still starts with"]],
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
    // Survivor 4/4: L15 and L30 both hold the heading text "Build at production size", each
    // with its own reason to FEAT-002. Removing only L30's — never touching its claim, so no
    // other check also fires — reds only when reasons key by line, never by heading text (a
    // text key would wrongly see L15's reason as already covering L30 too).
    [`two same-text headings stay distinct by line, not text (line ${L30} -> FEAT-002's own reason removed)`, variant((q) => { q.regroup.reasons = q.regroup.reasons.filter((r) => !(r.line === L30 && r.to === "FEAT-002")); }), [String(L30), "FEAT-002", "no reason"]],
    [`reason for line ${L30} -> FEAT-004 given as the string "${L30}", not an integer`, variant((q) => { const r = q.regroup.reasons.find((y) => y.line === L30 && y.to === "FEAT-004"); r.line = String(r.line); }), [String(L30), "must be an integer"]],
    // M3: a reason's "to" of ["CAP-01"] stringifies to "CAP-01" inside a template-literal key
    // and would otherwise pass by coercion — it must be refused by its own exact type instead.
    [`reason for line -> CAP-01 given "to" as ["CAP-01"], not a string`, variant((q) => { const r = q.regroup.reasons.find((y) => y.to === "CAP-01"); r.to = ["CAP-01"]; }), ["regroup.reasons", "to"]],
    // Mutation survivor 4/1 (brief 2, "Also fix"): the matching claim stayed in sync with the
    // deleted reason's line/to key (its text comparison skips when the reason is simply gone),
    // so only the missing-reason check itself can catch this one.
    [`reason for line ${L22} -> SUB-001 missing, with its claim kept so only the missing-reason check catches it`, variant((q) => { q.regroup.reasons = q.regroup.reasons.filter((r) => !(r.line === L22)); }), [String(L22)]],
  ];
  const { ok, why } = allRefused(cases);
  // req: R-1173
  check("R-1173: each line the lift reports needs exactly one reason by old line and node, a missing, repeated or stale reason is refused, and two same-text headings are reasoned apart", ok, why);
}

// ================================================================== T6
{
  // A real file one level above any case root (every case root is scratchRoot/cases/<N>-...),
  // so the "leads outside the root" mutation pair (5/3) cannot be masked by the missing-path
  // refusal — that only happens when `../outside.txt` does not exist, which it now does.
  mkdirSync(join(scratchRoot, "cases"), { recursive: true });
  writeFileSync(join(scratchRoot, "cases", "outside.txt"), "not under any fixture root\n");
  const cases = [
    ["FEAT-005 names no evidence path", variant((q) => { delete q.regroup.evidence["FEAT-005"]; }), ["FEAT-005"]],
    ["FEAT-005's evidence list is empty", variant((q) => { q.regroup.evidence["FEAT-005"] = []; }), ["FEAT-005"]],
    ["FEAT-005 names a missing path", variant((q) => { q.regroup.evidence["FEAT-005"] = ["src/report/missing.mjs"]; }), ["src/report/missing.mjs"]],
    ["FEAT-005 names a path that `..` leads outside the root", variant((q) => { q.regroup.evidence["FEAT-005"] = ["../outside.txt"]; }), ["FEAT-005"]],
    // An "active" feature with no rows anywhere (not even in a subgroup) is a gap in
    // disguise; it needs evidence just as a "proposed" gap does (Also fix, build brief 2).
    // Its own purpose claim is added too (survivor B2/16): otherwise R-1184's missing-claim
    // check refuses the same proposal first, so only a check removed for this exact case —
    // not R-1174's evidence demand — would have been caught.
    ["an active feature with no rows and no evidence path is refused like a gap", variant((q) => {
      q.tree[1].features.push({ id: "FEAT-006", label: "Archive analyst pages", purpose: "Archive the rendered analyst pages after the case closes; no row holds it yet.", status: "active", from: [], rows: [], subgroups: [] });
      q.regroup.review.claims.push({ node: "FEAT-006", field: "purpose", text: "Archive the rendered analyst pages after the case closes; no row holds it yet.", verdict: "accept", reason: "the claim matches the fixture's feature (claim FEAT-006)" });
    }), ["FEAT-006", "evidence"]],
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
    // Unknown rows (brief 2 item 6; brief 1's clarification 5): a verdict, a refuted entry or
    // a question's about entry naming a row the ledger does not hold is refused, naming it.
    ["review record's verdict names a row the ledger does not hold", variant((q) => { q.regroup.review.verdicts.push({ id: "R-999", at: "FEAT-001", verdict: "keep", reason: "bogus" }); }), ["R-999"]],
    ["a refuted entry names a row the ledger does not hold", variant((q) => { q.regroup.refuted.push({ id: "R-999", to: "FEAT-004", reason: "bogus" }); }), ["R-999"]],
    ["a question's about entry names a row the ledger does not hold", variant((q) => { q.regroup.questions[0].about.push({ id: "R-999", to: "FEAT-001" }); }), ["R-999"]],
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

// ================================================================== R-1175 (direct call: CHANGE §3.4 item 2 / residual 2)
{
  // The lift itself refuses an `also_applies` line until regroup-shares lands, so the
  // "carried" outcome can be exercised only by calling regroupProblems/resolveTargetOutcome
  // directly, never through the CLI (pins the clause that only an untested direct call covered).
  const shareP = variant((q) => {
    q.regroup.refuted = q.regroup.refuted.filter((r) => !(r.id === "R-005" && r.to === "FEAT-004"));
    mappingNodesOf(q).find((x) => x.id === "FEAT-004").node.also_applies = ["R-005"];
  });
  const shareDir = fxRoot("direct-carried-share", shareP);
  const sharedProblems = regroupProblems(shareP, FX, shareDir).problems;
  const sharedOutcome = resolveTargetOutcome(shareP, "R-005", "FEAT-004");

  const moveP = variant((q) => {
    q.regroup.refuted = q.regroup.refuted.filter((r) => !(r.id === "R-003" && r.to === "FEAT-004"));
    mappingNodesOf(q).find((x) => x.id === "FEAT-004").node.also_applies = ["R-003"];
  });
  const moveDir = fxRoot("direct-no-carry-for-move", moveP);
  const moveProblems = regroupProblems(moveP, FX, moveDir).problems;
  const moveOutcome = resolveTargetOutcome(moveP, "R-003", "FEAT-004");

  // req: R-1175
  check("R-1175: regroupProblems called directly accepts a share's target carried in also_applies, and a move target never counts as carried even when also_applies names it",
    sharedProblems.length === 0 && sharedOutcome === "carried" && moveOutcome !== "carried" && moveProblems.some((p) => p.includes("R-003") && p.includes("unresolved")),
    `shareProblems=${sharedProblems.length} share=${sharedOutcome} move=${moveOutcome} moveProblems=${moveProblems.slice(0, 2).join(" | ")}`);
}

// ================================================================== T9
{
  const bad = variant((q) => { q.regroup.review.reviewer = q.regroup.review.drafter; });
  const badRun = runFx("same-lineage-no-flag", bad);
  const badOk = badRun.r.status === 1 && !crashed(badRun.r) && (mentions(badRun.r, /same-family/i) || mentions(badRun.r, /lineage/i));
  const good = variant((q) => { q.regroup.review.reviewer = q.regroup.review.drafter; q.regroup.review.same_family = true; });
  const goodRun = runFx("same-lineage-flagged", good);
  const goodOk = goodRun.r.status === 0 && !crashed(goodRun.r);
  // Lineage names compare case-insensitively (clarification 1): a case-only difference is
  // still one shared lineage, so it too needs same_family declared.
  const caseOnly = variant((q) => { q.regroup.review.reviewer = q.regroup.review.drafter.toUpperCase(); });
  const caseOnlyRun = runFx("same-lineage-case-only-no-flag", caseOnly);
  const caseOnlyOk = caseOnlyRun.r.status === 1 && !crashed(caseOnlyRun.r) && (mentions(caseOnlyRun.r, /same-family/i) || mentions(caseOnlyRun.r, /lineage/i));
  // same_family: true is itself refused when the lineages actually differ (clarification 1).
  const falseFlag = variant((q) => { q.regroup.review.same_family = true; });
  const falseFlagRun = runFx("different-lineage-false-flag", falseFlag);
  const falseFlagOk = falseFlagRun.r.status === 1 && !crashed(falseFlagRun.r) && mentions(falseFlagRun.r, /same_family/i);
  // Item 9: lineage names compare trimmed as well as case-folded — a trailing space is still
  // one shared lineage, not "another lineage" (finding 36).
  const trailingSpace = variant((q) => { q.regroup.review.reviewer = `${q.regroup.review.drafter} `; });
  const trailingSpaceRun = runFx("same-lineage-trailing-space-no-flag", trailingSpace);
  const trailingSpaceOk = trailingSpaceRun.r.status === 1 && !crashed(trailingSpaceRun.r) && (mentions(trailingSpaceRun.r, /same-family/i) || mentions(trailingSpaceRun.r, /lineage/i));
  // req: R-1175
  check("R-1175: a record whose drafter and reviewer share a lineage is refused unless it declares same-family", badOk && goodOk && caseOnlyOk && falseFlagOk && trailingSpaceOk,
    `bad status=${badRun.r.status} good status=${goodRun.r.status} caseOnly status=${caseOnlyRun.r.status} falseFlag status=${falseFlagRun.r.status} trailingSpace status=${trailingSpaceRun.r.status}`);
}

// ================================================================== T10
{
  const cases = [
    ["text-placed R-006 has no placed reason", variant((q) => { delete q.regroup.placed["R-006"]; }), ["R-006"]],
    ["R-005 (no local evidence) has no placed reason", variant((q) => { delete q.regroup.placed["R-005"]; }), ["R-005"]],
    ["R-001 (has local evidence) carries a placed reason", variant((q) => { q.regroup.placed["R-001"] = "placed by text (extra)"; }), ["R-001"]],
    ["text-placed R-003's placed reason is empty", variant((q) => { q.regroup.placed["R-003"] = ""; }), ["R-003"]],
    // Unknown rows (brief 2 item 6; brief 1's clarification 5): a placed entry naming a row
    // the ledger does not hold exits 0 today (MUST 6); now it is refused, naming it.
    ["a placed entry names a row the ledger does not hold", variant((q) => { q.regroup.placed["R-999"] = "bogus placed reason"; }), ["R-999"]],
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
  // The missing citation comes FIRST (item 8d): if the cell is read as one whole string
  // instead of split on its comma, the path extracted is the missing one, wrongly marking
  // this text-placed — only a real comma split reaches the second, real citation.
  const plainCell = "tests/missing.test.mjs::a title with a comma in it, tests/mini.test.mjs::R-900: plain form evidence";
  const backtickCell = "`tests/mini.test.mjs::R-900: backtick form evidence`";
  const missingCell = "tests/missing.test.mjs::a title that names no real path";
  const plainOk = !isTextPlaced(dir, { id: "R-900", evidence: plainCell });
  const backtickOk = !isTextPlaced(dir, { id: "R-900", evidence: backtickCell });
  const missingOk = isTextPlaced(dir, { id: "R-901", evidence: missingCell });
  // req: R-1176
  check("R-1176: a row whose evidence names an existing path in the trace rail's plain or backtick form is evidence-placed",
    plainOk && backtickOk && missingOk, `plain=${plainOk} backtick=${backtickOk} missing(still text-placed)=${missingOk}`);
}

// ================================================================== T10 (shares plan, verbatim: amendment 2, seat-titles.mjs)
{
  const p = variant((q) => {
    const feat = mappingNodesOf(q).find((x) => x.id === "FEAT-002").node;
    feat.shares_added = ["R-010"];
    feat.shares_dropped = ["R-009"];
    feat.also_applies = ["R-010"];
    const v10 = verdictOf(q, "R-010"); delete v10.reason; v10.verdict = "share"; v10.targets = [{ to: "FEAT-002", reason: "FEAT-002 also reads the escaping rule (shares-keys add)" }];
    const v9 = verdictOf(q, "R-009"); delete v9.reason; v9.verdict = "share"; v9.targets = [{ to: "FEAT-002", reason: "FEAT-002 no longer needs its own copy of the HTML-file rule (shares-keys drop)" }];
    q.regroup.refuted.push({ id: "R-009", to: "FEAT-002", reason: "FEAT-002's old share is dropped once it reads the rule directly (shares-keys drop refuted)" });
  });
  const dir = fxRoot("shares-keys", p);
  const { problems } = regroupProblems(p, FX, dir);
  // req: R-1177
  check("R-1177: a proposal whose feature declares shares_added and shares_dropped holds no unknown key and passes the regroup checker",
    problems.length === 0, `problems=${problems.slice(0, 3).join(" | ")}`);
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
  // Shape crashes (brief 2 item 3, "never a crash"): targets, about or reasons given as an
  // object instead of an array, and a null verdict entry, are refused by the shape check
  // with a named path, before anything else reads them.
  const baseIdx = i3(fxProposal());
  const q9Idx = fxProposal().regroup.review.verdicts.findIndex((v) => v.id === "R-009");
  const shapeCases = [
    ["R-003's move targets is an object instead of an array", variant((q) => { q.regroup.review.verdicts[i3(q)].targets = { to: "FEAT-004", reason: "x" }; }), [`regroup.review.verdicts[${baseIdx}].targets`]],
    ["a question's about is an object instead of an array", variant((q) => { q.regroup.questions[0].about = { id: "R-005", to: "FEAT-001" }; }), ["regroup.questions[0].about"]],
    ["regroup.reasons is an object instead of an array", variant((q) => { q.regroup.reasons = Object.fromEntries(q.regroup.reasons.map((r, i) => [i, r])); }), ["regroup.reasons"]],
    ["a verdict entry is null", variant((q) => { q.regroup.review.verdicts.push(null); }), ["regroup.review.verdicts"]],
    // M3: id, at, to and node fields are refused by their exact type, never read by coercion.
    ["R-009's verdict id is an array, not a string", variant((q) => { verdictOf(q, "R-009").id = ["R-009"]; }), [`regroup.review.verdicts[${q9Idx}].id`]],
    ["R-009's verdict at is an array, not a string", variant((q) => { verdictOf(q, "R-009").at = ["FEAT-004"]; }), [`regroup.review.verdicts[${q9Idx}].at`]],
    ["R-003's move target to is an array, not a string", variant((q) => { verdictOf(q, "R-003").targets[0].to = ["FEAT-004"]; }), [`regroup.review.verdicts[${baseIdx}].targets[0].to`]],
    ["a refuted entry's id is an array, not a string", variant((q) => { q.regroup.refuted[0].id = ["R-003"]; }), ["regroup.refuted[0].id"]],
    ["CAP-01's purpose claim node is an array, not a string", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "CAP-01" && c.field === "purpose")].node = ["CAP-01"]; }), ["node"]],
  ];
  const shapeMisses = [];
  for (const [label, p, names] of shapeCases) if (!refusedCase(p, names)) shapeMisses.push(label);
  // req: R-1177
  check("R-1177: a misspelled key in any object level of a proposal is refused naming its path, and so is a question without a recommendation",
    misses.length === 0 && noRecOk && shapeMisses.length === 0, `misses=${misses.join(",")} noRecOk=${noRecOk} shapeMisses=${shapeMisses.join(",")}`);
}

// ================================================================== R-1177 (M1: an evidence value never crashes, gap or not)
{
  // Each case first runs an honest proposal at a shared --out (so a stale page would survive a
  // crash), then the bad-shape proposal at that same --out: refused by name, never a crash,
  // and the earlier page removed — the --out pre-check (allEvidenceAbsPaths) reads evidence
  // before the lift even runs, so an object, a number or a boolean there must never reach it.
  const evidenceShapeCases = [
    ["FEAT-005 (a gap) evidence is an object", variant((q) => { q.regroup.evidence["FEAT-005"] = { path: "src/report/render.mjs" }; }), "regroup.evidence.FEAT-005"],
    ["FEAT-005 (a gap) evidence is a number", variant((q) => { q.regroup.evidence["FEAT-005"] = 5; }), "regroup.evidence.FEAT-005"],
    ["FEAT-005 (a gap) evidence is true", variant((q) => { q.regroup.evidence["FEAT-005"] = true; }), "regroup.evidence.FEAT-005"],
    ["FEAT-004 (not a gap) evidence is an object", variant((q) => { q.regroup.evidence["FEAT-004"] = { path: "tests/render.test.mjs" }; }), "regroup.evidence.FEAT-004"],
  ];
  const misses = [];
  for (const [label, p, name] of evidenceShapeCases) {
    const pagePath = join(scratchRoot, `evidence-shape-${++caseN}.md`);
    const first = runFx(`evidence-shape-pass-${caseN}`, fxProposal(), { out: pagePath });
    if (!(first.r.status === 0 && existsSync(pagePath))) { misses.push(`${label}: honest setup run failed`); continue; }
    const second = runFx(`evidence-shape-fail-${caseN}`, p, { out: pagePath });
    const ok = second.r.status === 1 && !crashed(second.r) && mentions(second.r, name) && !existsSync(pagePath);
    if (!ok) misses.push(`${label}: status=${second.r.status} crashed=${crashed(second.r)} page=${existsSync(pagePath)} ` + own(second.r.stderr).slice(0, 2).join(" | "));
  }
  // req: R-1177
  check("R-1177: an evidence value written as an object, a number or a boolean is refused by name before the --out pre-check reads it, for a gap or a non-gap feature, and a failing run still removes an earlier page",
    misses.length === 0, misses.join(" / "));
}

// ================================================================== R-1177 (M1: a feature status must be a string)
{
  // A status written as a one-element array stringifies to the same text inside a RegExp's
  // implicit coercion but fails `=== "proposed"`/`=== "active"` by strict equality — the real
  // bug: the gap check's isGap test then reads false, skips R-1174's evidence demand, and the
  // lift happily writes the coerced string with no evidence ever named (findings 0, 10). The
  // shape check now refuses a non-string status by its own path before anything reads it as a
  // value, so the gap test and the page always read the same string.
  const proposedArray = variant((q) => {
    mappingNodesOf(q).find((x) => x.id === "FEAT-005").node.status = ["proposed"];
    delete q.regroup.evidence["FEAT-005"];
  });
  const proposedRun = runFx("status-array-proposed", proposedArray);
  const proposedOk = proposedRun.r.status === 1 && !crashed(proposedRun.r) && !existsSync(proposedRun.page) &&
    saysOwn(proposedRun.r, "tree[1].features[1].status") && saysOwn(proposedRun.r, "must be a string");
  const activeArray = variant((q) => {
    q.tree[1].features.push({ id: "FEAT-010", label: "Gap feature for the status-array case", purpose: "A gap feature whose status is written as an array.", status: ["active"], from: [], rows: [], subgroups: [] });
    q.regroup.review.claims.push({ node: "FEAT-010", field: "purpose", text: "A gap feature whose status is written as an array.", verdict: "accept", reason: "the claim matches the fixture's feature (claim FEAT-010)" });
  });
  const activeRun = runFx("status-array-active", activeArray);
  const activeOk = activeRun.r.status === 1 && !crashed(activeRun.r) && !existsSync(activeRun.page) &&
    saysOwn(activeRun.r, "tree[1].features[2].status") && saysOwn(activeRun.r, "must be a string");
  // req: R-1177
  check('R-1177: a feature status written as a one-element array (["proposed"] or ["active"]) on a feature with no rows and no evidence is refused in the shape check',
    proposedOk && activeOk,
    `proposed status=${proposedRun.r.status} ` + own(proposedRun.r.stderr).slice(0, 2).join(" | ") + `; active status=${activeRun.r.status} ` + own(activeRun.r.stderr).slice(0, 2).join(" | "));
}

// ================================================================== T14
{
  const pass = runFx("page-order", fxProposal());
  const page = pass.text ?? "";
  const dry = lift(["--root", pass.dir, "--mapping", pass.prop], scratchRoot);
  const proofLine = lines(dry.stdout).find((l) => l.startsWith("lift proof: "));
  const posQ1 = page.indexOf("1. Should the build budget row");
  const posTable = page.indexOf("| Feature | Label | Status | Rows | Status mix |");
  const posNodes = page.indexOf("## Capabilities, features and subgroups");
  const posLines = page.indexOf("## Reported lines");
  const hdr = posQ1 > 0 ? page.slice(0, posQ1) : "";
  const propBytes = readFileSync(pass.prop);
  // Item 4 (M3): the exact claim-verdict count, not just any digit, so dropping a claim from
  // the header's own count goes red.
  const claimCount = fxProposal().regroup.review.claims.length;
  const headerOk = page.startsWith("# Regroup review packet") && hdr.includes(sha(propBytes)) && hdr.includes(fxProposal().pin.sha256) && (proofLine === null || hdr.includes(proofLine)) && hdr.includes("anthropic") && hdr.includes("openai") && /placement verdicts: 13/i.test(hdr) && new RegExp(`claim verdicts: ${claimCount}\\b`, "i").test(hdr);
  const orderOk = posQ1 > 0 && posQ1 < posTable && posTable < posNodes && posNodes < posLines;
  // Item 4 (M3): a question's own recommendation, not just its "ask" line.
  const qBlock = page.slice(posQ1, posTable);
  const recommendationOk = qBlock.includes("recommend alpha");
  const tableBlock = page.slice(posTable, posNodes);
  const tableOk = ["FEAT-001", "FEAT-002", "FEAT-004", "FEAT-005", "FEAT-900"].every((id) => tableBlock.includes(id)) && /\b3\b/.test(tableBlock) && /implemented/.test(tableBlock);
  // R-1178 reworded: the feature table also carries each feature's label and status — a
  // proposed gap (FEAT-005) reads "proposed" plainly (sol r3: "feature status dropped").
  const tableStatusOk = tableBlock.includes("Build at production size") && tableBlock.includes("Render analyst pages") && /proposed/.test(tableBlock) && /active/.test(tableBlock);
  // M2: the table's reserved FEAT-900 row shows the lift's seed label and status (as the node
  // list already does), never blank — the honest fixture's lift's own default start, since the
  // proposal names no label or status of its own for FEAT-900.
  const tableReservedOk = tableBlock.includes("Adopt the general engineering requirements") && /\bactive\b/.test(tableBlock);
  // Item 4 (M3): a feature's own subtree row count and status mix, not just any digit anywhere
  // in the table — FEAT-002 carries its own rows (R-004 implemented, R-005 planned, R-007
  // implemented) plus SUB-001's row (R-006 untested): 4 rows, "2 implemented, 1 planned, 1 untested".
  const statusMixOk = /\|\s*FEAT-002\s*\|[^|]*\|[^|]*\|\s*4\s*\|\s*2 implemented, 1 planned, 1 untested\s*\|/.test(tableBlock);
  const nodesBlock = page.slice(posNodes, posLines);
  const purposesOk = ["CAP-01", "FEAT-001", "SUB-001", "CAP-02", "FEAT-004", "FEAT-005"].every((id) => nodesBlock.includes(id)) && (nodesBlock.includes("src/report/render.mjs") || nodesBlock.includes("src\\report\\render.mjs"));
  // Item 4 (M3): a non-reserved node's own purpose text, and a capability's own outcome text —
  // not just its ID — so dropping the field (while keeping the heading) goes red.
  const purposeTextOk = nodesBlock.includes("refusing unknown columns by name and logging each refusal");
  const outcomeTextOk = nodesBlock.includes("Every source file the analyst drops is staged whole, refused by name or logged.");
  // Every node is nested (a feature's heading sits deeper than its capability's) and shows its label.
  const nestedOk = nodesBlock.includes("Load source files") && nodesBlock.indexOf("#### FEAT-001") > nodesBlock.indexOf("### CAP-01") && nodesBlock.indexOf("##### SUB-001") > nodesBlock.indexOf("#### FEAT-002");
  // Nodes nest by heading level alone, with no leading spaces (four spaces make a Markdown
  // code block, not a nested heading — finding 33).
  const noIndentOk = !/^[ \t]+#/m.test(nodesBlock) && !/^[ \t]+(Purpose|Outcome|Evidence):/m.test(nodesBlock);
  // M4: a reserved node (CAP-90, FEAT-900, SUB-900...) shows the lift's seed text, never blank
  // and never proposal text the lift ignores — the honest fixture's reserved nodes carry no
  // label, purpose or outcome of their own, so this is blank unless the page reads the seed.
  // Item 4 (M3) adds the reserved capability's own seed OUTCOME, not only its purpose/label.
  const reservedOk = nodesBlock.includes("every nana project carries the same baseline engineering promises, checkable the same way") &&
    nodesBlock.includes("a rendered project's engineering promises are visible and checkable from day one") &&
    nodesBlock.includes("hold the general engineering rows every nana project ships, unedited per project") &&
    nodesBlock.includes("Keep engineering promises checkable") && nodesBlock.includes("Adopt the general engineering requirements");
  // req: R-1178
  check("R-1178: the page opens with both hashes, the proof line, the lineages and the placement and claim verdict counts, then the numbered questions each with its recommendation, the feature table with each feature's status mix and subtree row count, and every node with its purpose, a capability's outcome, a reserved node's seed outcome and each proposed feature's evidence",
    pass.r.status === 0 && headerOk && orderOk && recommendationOk && tableOk && tableStatusOk && tableReservedOk && statusMixOk && purposesOk && purposeTextOk && outcomeTextOk && nestedOk && noIndentOk && reservedOk,
    `status=${pass.r.status} header=${headerOk} order=${orderOk} recommendation=${recommendationOk} table=${tableOk} tableStatus=${tableStatusOk} tableReserved=${tableReservedOk} statusMix=${statusMixOk} purposes=${purposesOk} purposeText=${purposeTextOk} outcomeText=${outcomeTextOk} nested=${nestedOk} noIndent=${noIndentOk} reserved=${reservedOk}`);
}
// M2 (T14): a proposal that gives FEAT-900 other label/status text still shows the lift's
// seed text in the table — never the proposal's, which the lift ignores for a reserved node.
{
  const otherText = variant((q) => {
    const feat900 = mappingNodesOf(q).find((x) => x.id === "FEAT-900").node;
    feat900.label = "Bogus label the lift ignores";
    feat900.status = "frozen (bogus reason the lift ignores)";
  });
  const run = runFx("feat900-other-text", otherText);
  const page = run.text ?? "";
  const posTable = page.indexOf("| Feature | Label | Status | Rows | Status mix |");
  const posNodes = page.indexOf("## Capabilities, features and subgroups");
  const tableBlock = page.slice(posTable, posNodes);
  const seedOk = tableBlock.includes("Adopt the general engineering requirements") && /\bactive\b/.test(tableBlock);
  const ignoredOk = !tableBlock.includes("Bogus label the lift ignores") && !tableBlock.includes("bogus reason the lift ignores");
  // req: R-1178
  check("R-1178: the feature table shows FEAT-900's label and status from the lift's seed, never other text a proposal gives it",
    run.r.status === 0 && !crashed(run.r) && seedOk && ignoredOk,
    `status=${run.r.status} seed=${seedOk} ignored=${ignoredOk}`);
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
  const posRefuted = page.indexOf("## Refuted items");
  const posAppendix = page.indexOf("## Appendix");
  const orderOk = posLines > 0 && posLines < posTargets && posTargets < posClaims && posClaims < posPlaced && posPlaced < posRefuted && posRefuted < posAppendix;
  const linesBlock = page.slice(posLines, posTargets);
  const linesOk = linesBlock.includes(`Line ${L30}: "${H.build}" -> FEAT-004 (rows R-008)`);
  // Item 4 (M3): the reported line's own reason text, not just its heading and rows.
  const l30r = WANT_RECORDS.findIndex((r) => r.line === L30 && r.to === "FEAT-004");
  const lineReasonOk = linesBlock.includes(`reason item ${l30r}`);
  const targetsBlock = page.slice(posTargets, posClaims);
  // R-1179 reworded: each target line is marked move or share, gives the row's current home,
  // and an asked target reads "asked in question <n>" (sol r3: "question number dropped").
  const targetsOk = /R-003 \(home FEAT-001\) -> FEAT-004 \[move\]: refuted/.test(targetsBlock) &&
    /R-005 \(home FEAT-002\) -> FEAT-001 \[share\]: asked in question 1\b/.test(targetsBlock) &&
    /R-005 \(home FEAT-002\) -> FEAT-004 \[share\]: refuted/.test(targetsBlock);
  // Item 4 (M3): a target's own reason, not just its row/node/outcome — each of the three
  // targets above carries a distinct marker.
  const targetReasonOk = targetsBlock.includes("target alpha") && targetsBlock.includes("target bravo") && targetsBlock.includes("target charlie");
  const claimsBlock = page.slice(posClaims, posPlaced);
  // Item 4 (M3): the rejected claim's own name (its label line), not only its reason.
  const claimsOk = claimsBlock.includes(`Rejected claim: line ${L30} -> FEAT-004`) && claimsBlock.includes("reject zulu");
  const placedBlock = page.slice(posPlaced, posRefuted);
  const placedOk = FX_PLACED.every((id) => placedBlock.includes(id));
  // Item 4 (M3): a text-placed row's gist, home and reason — not just its ID. R-003 is
  // text-placed, home FEAT-001, with "placed item 0" (its own index in FX_PLACED).
  const r003Gist = "The loader shall record each refused file in the import log with the time, the file name and the refusal reason.".split(/\s+/).slice(0, GIST_WORDS).join(" ");
  const placedFieldsOk = placedBlock.includes(`R-003 -> FEAT-001: "${r003Gist}" — placed by its text alone, which names this node's work (placed item ${FX_PLACED.indexOf("R-003")})`);
  const refutedBlock = page.slice(posRefuted, posAppendix);
  const refutedOk = refutedBlock.includes("R-003 -> FEAT-004: refuted") && refutedBlock.includes("refute alpha") && refutedBlock.includes("R-005 -> FEAT-004: refuted") && refutedBlock.includes("refute bravo");
  const appendixBlock = page.slice(posAppendix);
  const appendixOk = appendixBlock.includes("ten thousand accounts") && !page.slice(0, posAppendix).includes("ten thousand accounts");
  // Item 4 (M3): the appendix groups rows under their OWN node's heading, not just anywhere
  // after "## Appendix" — FEAT-002's own appendix section holds R-004, never FEAT-001's.
  const posAppFeat001 = appendixBlock.indexOf("### Appendix — FEAT-001");
  const posAppFeat002 = appendixBlock.indexOf("### Appendix — FEAT-002");
  const appendixGroupOk = posAppFeat001 >= 0 && posAppFeat002 > posAppFeat001 &&
    appendixBlock.slice(posAppFeat001, posAppFeat002).includes("R-001") &&
    !appendixBlock.slice(posAppFeat001, posAppFeat002).includes("R-004") &&
    appendixBlock.slice(posAppFeat002).includes("R-004");
  // req: R-1179
  check("R-1179: the page lists each reported line with its reason and rows, each move and share target with its own reason and outcome, each rejected claim named with its reason, each text-placed row with its gist, home and reason, and every row grouped by node only in the appendix after them",
    pass.r.status === 0 && orderOk && linesOk && lineReasonOk && targetsOk && targetReasonOk && claimsOk && placedOk && placedFieldsOk && refutedOk && appendixOk && appendixGroupOk,
    `order=${orderOk} lines=${linesOk} lineReason=${lineReasonOk} targets=${targetsOk} targetReason=${targetReasonOk} claims=${claimsOk} placed=${placedOk} placedFields=${placedFieldsOk} refuted=${refutedOk} appendix=${appendixOk} appendixGroup=${appendixGroupOk}`);
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
    // Survivor B2/9: names the type check's own message, not only the row/line value.
    [`line ${L7} -> FEAT-001 reason's claim line is a string, not an integer`, variant((q) => { const c = q.regroup.review.claims[claimAt(q, (c) => c.line === L7 && c.to === "FEAT-001")]; c.line = String(c.line); }), [String(L7), "must be an integer"]],
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

// ================================================================== T24 (seat amendment 2, R-1187: shares need a share verdict)
{
  // A tree-form ledger (only a tree ledger can carry an existing share to drop): CAP-01 holds
  // FEAT-001 (R-001, already sharing R-002) and FEAT-002 (R-002).
  const TH2 = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  const T = { cap: "# CAP-01 · Cap", f1: "## FEAT-001 · Alpha", f2: "## FEAT-002 · Bravo" };
  const TREE_FX = [
    T.cap, "", "Purpose: capability purpose for the shares fixture.", "Outcome: a visible outcome for the shares fixture.", "",
    T.f1, "", "Purpose: alpha feature purpose.", "Status: active", "Also applies: R-002", "", ...TH2,
    "| R-001 | WHEN alpha runs, it shall do alpha things. | implemented | `tests/alpha.test.mjs::R-001: alpha` |", "",
    T.f2, "", "Purpose: bravo feature purpose.", "Status: active", "", ...TH2,
    "| R-002 | WHEN bravo runs, it shall do bravo things. | implemented | `tests/bravo.test.mjs::R-002: bravo` |", "",
  ].join("\n");
  const treeDir = join(scratchRoot, "t24-tree-fx");
  mkdirSync(join(treeDir, "tests"), { recursive: true });
  writeFileSync(join(treeDir, "tests", "alpha.test.mjs"), "// fixture test file\n");
  writeFileSync(join(treeDir, "tests", "bravo.test.mjs"), "// fixture test file\n");
  const f = (h) => ({ line: lineOf(TREE_FX, h), heading: h });
  /** The honest identity proposal: FEAT-001 drops its share of R-002 (refuted), FEAT-002 adds a share of R-001 (carried) — the seat r3 case: a reason recording a refused move, resolved as a carried share. */
  function treeFxProposal() {
    return {
      tree: [{ id: "CAP-01", label: "Cap", purpose: "Capability purpose for the shares fixture.", outcome: "A visible outcome for the shares fixture.", from: [f(T.cap)], features: [
        { id: "FEAT-001", label: "Alpha", purpose: "Alpha feature purpose.", status: "active", also_applies: [], shares_dropped: ["R-002"], from: [f(T.f1)], rows: ["R-001"], subgroups: [] },
        { id: "FEAT-002", label: "Bravo", purpose: "Bravo feature purpose.", status: "active", also_applies: ["R-001"], shares_added: ["R-001"], from: [f(T.f2)], rows: ["R-002"], subgroups: [] },
      ] }],
      regroup: {
        reasons: [],
        placed: {},
        evidence: {},
        review: {
          drafter: "anthropic", reviewer: "openai",
          verdicts: [
            { id: "R-001", at: "FEAT-001", verdict: "share", targets: [{ to: "FEAT-002", reason: "the reviewer first refused R-001's move to FEAT-002, but the drafter revised this row into a share to the same feature (seat r3 case)" }] },
            { id: "R-002", at: "FEAT-002", verdict: "share", targets: [{ to: "FEAT-001", reason: "FEAT-001 now reads R-002 directly from FEAT-002, so its own copy of the share is dropped" }] },
          ],
          claims: [
            { node: "CAP-01", field: "purpose", text: "Capability purpose for the shares fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
            { node: "CAP-01", field: "outcome", text: "A visible outcome for the shares fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
            { node: "FEAT-001", field: "purpose", text: "Alpha feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
            { node: "FEAT-002", field: "purpose", text: "Bravo feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
          ],
        },
        refuted: [{ id: "R-002", to: "FEAT-001", reason: "FEAT-001's own copy of the share is dropped once FEAT-002 reads R-002 directly" }],
        questions: [],
      },
    };
  }
  /** A mutated copy of the honest tree proposal. */
  function treeVariant(fn) { const p = structuredClone(treeFxProposal()); fn(p); return p; }
  const featOf = (p, id) => p.tree[0].features.find((x) => x.id === id);
  const verdictOfT = (p, id) => p.regroup.review.verdicts.find((v) => v.id === id);

  const honest = treeFxProposal();
  const honestOk = regroupProblems(honest, TREE_FX, treeDir).problems.length === 0;

  // A dropped share's target may also pass resolved by a question, not only refuted.
  const askedDrop = treeVariant((p) => {
    p.regroup.refuted = [];
    p.regroup.questions = [{ ask: "Should FEAT-001 drop its own copy of R-002 (ask)?", recommendation: "Yes, drop it (recommend).", about: [{ id: "R-002", to: "FEAT-001" }] }];
  });
  const askedDropOk = regroupProblems(askedDrop, TREE_FX, treeDir).problems.length === 0;

  // Case: FEAT-002's also_applies still names R-001 (a new share, unknown to the input ledger's
  // own FEAT-002), but no share verdict targets FEAT-002 for it (keep verdict, no target).
  const addedNoVerdict = treeVariant((p) => {
    verdictOfT(p, "R-001").verdict = "keep"; delete verdictOfT(p, "R-001").targets;
    verdictOfT(p, "R-001").reason = "R-001 stays in place (keep)";
  });
  // Case: shares_dropped names a row with no share verdict targeting the feature (keep verdict, no target).
  const droppedNoVerdict = treeVariant((p) => {
    p.regroup.refuted = [];
    verdictOfT(p, "R-002").verdict = "keep"; delete verdictOfT(p, "R-002").targets;
    verdictOfT(p, "R-002").reason = "R-002 stays in place (keep)";
  });
  // Case: the row's verdict targeting the feature is "move", not "share" — a share declaration
  // is not satisfied by a move (the target still resolves, by refutal, so only R-1187 catches this).
  const movedNotShared = treeVariant((p) => {
    const v = verdictOfT(p, "R-001"); v.verdict = "move"; v.targets[0].reason = "moved instead of shared (wrong code)";
    p.regroup.refuted.push({ id: "R-001", to: "FEAT-002", reason: "the move is refused outright (wrong code)" });
  });

  const addedRefused = regroupProblems(addedNoVerdict, TREE_FX, treeDir).problems;
  const droppedRefused = regroupProblems(droppedNoVerdict, TREE_FX, treeDir).problems;
  const movedRefused = regroupProblems(movedNotShared, TREE_FX, treeDir).problems;
  const names = (problems, ...words) => problems.some((p) => words.every((w) => p.includes(w)));

  // req: R-1187
  check("R-1187: a share added or dropped with no share verdict targeting its feature is refused, an added one with that verdict passes as carried, and a dropped one passes only refuted or asked",
    honestOk && askedDropOk && names(addedRefused, "FEAT-002", "R-001") && names(droppedRefused, "FEAT-001", "R-002") && names(movedRefused, "FEAT-002", "R-001"),
    `honest=${honestOk} askedDrop=${askedDropOk} added=${addedRefused.slice(0, 2).join(" | ")} dropped=${droppedRefused.slice(0, 2).join(" | ")} moved=${movedRefused.slice(0, 2).join(" | ")}`);
}

// ================================================================== T24 (seat amendment 3, R-1187: a merge or a demotion that carries a share)
{
  // A separate tree-form ledger: CAP-01 holds three features. Bravo shares Alpha's row R-001;
  // Charlie shares nothing. Both the merge and the demotion case fold Bravo (and its carried
  // share of R-001) into Charlie, through the real lift — now that regroup-shares has landed,
  // the lift carries a feature's or a subgroup's merge source shares onto the node absorbing
  // it, with no shares_added ever declared (the fail-open bug amendment 3 names).
  const MTH = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  const MT = { cap: "# CAP-01 · Cap", f1: "## FEAT-001 · Alpha", f2: "## FEAT-002 · Bravo", f3: "## FEAT-003 · Charlie" };
  const MERGE_FX = [
    MT.cap, "", "Purpose: capability purpose for the merge fixture.", "Outcome: a visible outcome for the merge fixture.", "",
    MT.f1, "", "Purpose: alpha feature purpose.", "Status: active", "", ...MTH,
    "| R-001 | WHEN alpha runs, it shall do alpha things. | implemented | `tests/alpha.test.mjs::R-001: alpha` |", "",
    MT.f2, "", "Purpose: bravo feature purpose.", "Status: active", "Also applies: R-001", "", ...MTH,
    "| R-002 | WHEN bravo runs, it shall do bravo things. | implemented | `tests/bravo.test.mjs::R-002: bravo` |", "",
    MT.f3, "", "Purpose: charlie feature purpose.", "Status: active", "", ...MTH,
    "| R-003 | WHEN charlie runs, it shall do charlie things. | implemented | `tests/charlie.test.mjs::R-003: charlie` |", "",
  ].join("\n");
  const mergeDir = join(scratchRoot, `t24-merge-fx-${++caseN}`);
  mkdirSync(join(mergeDir, "tests"), { recursive: true });
  for (const n of ["alpha", "bravo", "charlie"]) writeFileSync(join(mergeDir, "tests", `${n}.test.mjs`), "// fixture test file\n");
  writeFileSync(join(mergeDir, "REQUIREMENTS.md"), MERGE_FX);
  const f2Line = lineOf(MERGE_FX, MT.f2);
  const mergeClaims = [
    { node: "CAP-01", field: "purpose", text: "capability purpose for the merge fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
    { node: "CAP-01", field: "outcome", text: "a visible outcome for the merge fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
    { node: "FEAT-001", field: "purpose", text: "alpha feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
    { node: "FEAT-003", field: "purpose", text: "charlie feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
    { line: f2Line, to: "FEAT-003", text: "Bravo's row and its share of R-001 fold into Charlie (merge reason)", verdict: "accept", reason: "the claim matches the fixture's reason" },
  ];
  /** The merge: FEAT-002 (Bravo) vanishes; FEAT-003 (Charlie) absorbs its row (R-002) and,
   * via the merged-in `from`, its carried share of R-001 — never declared through shares_added. */
  function mergeMapping() {
    const m = structuredClone(buildIdentityMapping(MERGE_FX));
    const feats = m.tree[0].features;
    const f2 = feats.find((f) => f.id === "FEAT-002");
    const f3 = feats.find((f) => f.id === "FEAT-003");
    f3.rows = [...f3.rows, ...f2.rows];
    f3.from = [...f3.from, ...f2.from];
    f3.also_applies = ["R-001"];
    m.tree = [{ ...m.tree[0], features: feats.filter((f) => f.id !== "FEAT-002") }];
    return m;
  }
  const mergeRegroup = (verdicts) => ({
    reasons: [{ line: f2Line, to: "FEAT-003", why: "Bravo's row and its share of R-001 fold into Charlie (merge reason)" }],
    placed: {}, evidence: {},
    review: { drafter: "anthropic", reviewer: "openai", verdicts, claims: mergeClaims },
    refuted: [], questions: [],
  });
  const mergeNoVerdict = { ...mergeMapping(), regroup: mergeRegroup([
    { id: "R-001", at: "FEAT-001", verdict: "keep", reason: "R-001 stays at Alpha (keep)" },
    { id: "R-002", at: "FEAT-003", verdict: "keep", reason: "R-002 moves to Charlie with the merge (keep)" },
    { id: "R-003", at: "FEAT-003", verdict: "keep", reason: "R-003 stays at Charlie (keep)" },
  ]) };
  const mergeWithVerdict = { ...mergeMapping(), regroup: mergeRegroup([
    { id: "R-001", at: "FEAT-001", verdict: "share", targets: [{ to: "FEAT-003", reason: "the merge carries Alpha's row into Charlie, now reviewed (merge share)" }] },
    { id: "R-002", at: "FEAT-003", verdict: "keep", reason: "R-002 moves to Charlie with the merge (keep)" },
    { id: "R-003", at: "FEAT-003", verdict: "keep", reason: "R-003 stays at Charlie (keep)" },
  ]) };
  mkdirSync(join(mergeDir, "docs", "regroup"), { recursive: true });
  const mergeNoPage = join(scratchRoot, `merge-no-page-${++caseN}.md`);
  writeFileSync(join(mergeDir, "docs", "regroup", "proposal.json"), `${JSON.stringify(mergeNoVerdict, null, 2)}\n`);
  const mergeNoRun = regroup(["--root", mergeDir, "--proposal", join(mergeDir, "docs", "regroup", "proposal.json"), "--out", mergeNoPage], scratchRoot);
  const mergeNoOk = mergeNoRun.status === 1 && !crashed(mergeNoRun) && !existsSync(mergeNoPage) && saysOwn(mergeNoRun, "FEAT-003") && saysOwn(mergeNoRun, "R-001") && saysOwn(mergeNoRun, "also_applies");
  const mergeYesPage = join(scratchRoot, `merge-yes-page-${++caseN}.md`);
  writeFileSync(join(mergeDir, "docs", "regroup", "proposal.json"), `${JSON.stringify(mergeWithVerdict, null, 2)}\n`);
  const mergeYesRun = regroup(["--root", mergeDir, "--proposal", join(mergeDir, "docs", "regroup", "proposal.json"), "--out", mergeYesPage], scratchRoot);
  const mergePage = (() => { try { return readFileSync(mergeYesPage, "utf8"); } catch { return null; } })();
  const mergeYesOk = mergeYesRun.status === 0 && !crashed(mergeYesRun) && mergePage !== null &&
    /R-001 \(home FEAT-001\) -> FEAT-003 \[share\]: carried/.test(mergePage);
  // req: R-1187
  check("R-1187: a feature's merge that carries another feature's share onto also_applies is refused with no share verdict and passes, carried, with one",
    mergeNoOk && mergeYesOk, `no=${mergeNoOk} status=${mergeNoRun.status} ` + own(mergeNoRun.stderr).slice(0, 2).join(" | ") + `; yes=${mergeYesOk} status=${mergeYesRun.status} ` + own(mergeYesRun.stderr).slice(0, 2).join(" | "));
}
{
  // The demotion case: Bravo (still a top-level feature above) instead becomes a SUBGROUP of
  // Charlie — demoted, not merged — and Charlie still absorbs its carried share of R-001, since
  // a feature's carried shares include its subgroups' own merge sources too.
  const MTH = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  const DT = { cap: "# CAP-01 · Cap", f1: "## FEAT-001 · Alpha", f2: "## FEAT-002 · Bravo", f3: "## FEAT-003 · Charlie" };
  const DEMOTE_FX = [
    DT.cap, "", "Purpose: capability purpose for the demotion fixture.", "Outcome: a visible outcome for the demotion fixture.", "",
    DT.f1, "", "Purpose: alpha feature purpose.", "Status: active", "", ...MTH,
    "| R-001 | WHEN alpha runs, it shall do alpha things. | implemented | `tests/alpha.test.mjs::R-001: alpha` |", "",
    DT.f2, "", "Purpose: bravo feature purpose.", "Status: active", "Also applies: R-001", "", ...MTH,
    "| R-002 | WHEN bravo runs, it shall do bravo things. | implemented | `tests/bravo.test.mjs::R-002: bravo` |", "",
    DT.f3, "", "Purpose: charlie feature purpose.", "Status: active", "", ...MTH,
    "| R-003 | WHEN charlie runs, it shall do charlie things. | implemented | `tests/charlie.test.mjs::R-003: charlie` |", "",
  ].join("\n");
  const demoteDir = join(scratchRoot, `t24-demote-fx-${++caseN}`);
  mkdirSync(join(demoteDir, "docs", "regroup"), { recursive: true });
  mkdirSync(join(demoteDir, "tests"), { recursive: true });
  for (const n of ["alpha", "bravo", "charlie"]) writeFileSync(join(demoteDir, "tests", `${n}.test.mjs`), "// fixture test file\n");
  writeFileSync(join(demoteDir, "REQUIREMENTS.md"), DEMOTE_FX);
  const f2Line = lineOf(DEMOTE_FX, DT.f2);
  const demoteClaims = [
    { node: "CAP-01", field: "purpose", text: "capability purpose for the demotion fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
    { node: "CAP-01", field: "outcome", text: "a visible outcome for the demotion fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
    { node: "FEAT-001", field: "purpose", text: "alpha feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
    { node: "FEAT-003", field: "purpose", text: "charlie feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
    { node: "SUB-001", field: "purpose", text: "Bravo feature purpose.", verdict: "accept", reason: "the claim matches the fixture's subgroup" },
    { line: f2Line, to: "SUB-001", text: "Bravo is demoted to a subgroup of Charlie, carrying its share of R-001 (demotion reason)", verdict: "accept", reason: "the claim matches the fixture's reason" },
  ];
  /** The demotion: FEAT-002 (Bravo) becomes SUB-001, a subgroup of FEAT-003 (Charlie); Charlie
   * carries SUB-001's merge source share (R-001) onto its own also_applies. */
  function demoteMapping() {
    const m = structuredClone(buildIdentityMapping(DEMOTE_FX));
    const feats = m.tree[0].features;
    const f2 = feats.find((f) => f.id === "FEAT-002");
    const f3 = feats.find((f) => f.id === "FEAT-003");
    f3.subgroups = [{ id: "SUB-001", label: "Bravo", purpose: "Bravo feature purpose.", from: f2.from, rows: f2.rows }];
    f3.also_applies = ["R-001"];
    m.tree = [{ ...m.tree[0], features: feats.filter((f) => f.id !== "FEAT-002") }];
    return m;
  }
  const demoteRegroup = (verdicts) => ({
    reasons: [{ line: f2Line, to: "SUB-001", why: "Bravo is demoted to a subgroup of Charlie, carrying its share of R-001 (demotion reason)" }],
    placed: {}, evidence: {},
    review: { drafter: "anthropic", reviewer: "openai", verdicts, claims: demoteClaims },
    refuted: [], questions: [],
  });
  const demoteNoVerdict = { ...demoteMapping(), regroup: demoteRegroup([
    { id: "R-001", at: "FEAT-001", verdict: "keep", reason: "R-001 stays at Alpha (keep)" },
    { id: "R-002", at: "SUB-001", verdict: "keep", reason: "R-002 moves to Charlie's new subgroup with the demotion (keep)" },
    { id: "R-003", at: "FEAT-003", verdict: "keep", reason: "R-003 stays at Charlie (keep)" },
  ]) };
  const demoteWithVerdict = { ...demoteMapping(), regroup: demoteRegroup([
    { id: "R-001", at: "FEAT-001", verdict: "share", targets: [{ to: "FEAT-003", reason: "the demotion carries Alpha's row into Charlie, now reviewed (demotion share)" }] },
    { id: "R-002", at: "SUB-001", verdict: "keep", reason: "R-002 moves to Charlie's new subgroup with the demotion (keep)" },
    { id: "R-003", at: "FEAT-003", verdict: "keep", reason: "R-003 stays at Charlie (keep)" },
  ]) };
  const demoteNoPage = join(scratchRoot, `demote-no-page-${++caseN}.md`);
  writeFileSync(join(demoteDir, "docs", "regroup", "proposal.json"), `${JSON.stringify(demoteNoVerdict, null, 2)}\n`);
  const demoteNoRun = regroup(["--root", demoteDir, "--proposal", join(demoteDir, "docs", "regroup", "proposal.json"), "--out", demoteNoPage], scratchRoot);
  const demoteNoOk = demoteNoRun.status === 1 && !crashed(demoteNoRun) && !existsSync(demoteNoPage) && saysOwn(demoteNoRun, "FEAT-003") && saysOwn(demoteNoRun, "R-001") && saysOwn(demoteNoRun, "also_applies");
  const demoteYesPage = join(scratchRoot, `demote-yes-page-${++caseN}.md`);
  writeFileSync(join(demoteDir, "docs", "regroup", "proposal.json"), `${JSON.stringify(demoteWithVerdict, null, 2)}\n`);
  const demoteYesRun = regroup(["--root", demoteDir, "--proposal", join(demoteDir, "docs", "regroup", "proposal.json"), "--out", demoteYesPage], scratchRoot);
  const demotePage = (() => { try { return readFileSync(demoteYesPage, "utf8"); } catch { return null; } })();
  const demoteYesOk = demoteYesRun.status === 0 && !crashed(demoteYesRun) && demotePage !== null &&
    /R-001 \(home FEAT-001\) -> FEAT-003 \[share\]: carried/.test(demotePage);
  // req: R-1187
  check("R-1187: a feature's demotion to a subgroup that carries its share onto the absorbing feature's also_applies is refused with no share verdict and passes, carried, with one",
    demoteNoOk && demoteYesOk, `no=${demoteNoOk} status=${demoteNoRun.status} ` + own(demoteNoRun.stderr).slice(0, 2).join(" | ") + `; yes=${demoteYesOk} status=${demoteYesRun.status} ` + own(demoteYesRun.stderr).slice(0, 2).join(" | "));
}

// ================================================================== Item 9: smaller refusals, each with a case
{
  // (b) A refuted entry, or a question "about" entry with an id, naming no move or share
  // target of its row is refused (finding 41: a stray entry shown on the page).
  const strayRefuted = variant((q) => { q.regroup.refuted.push({ id: "R-009", to: "FEAT-001", reason: "stray: R-009 names no such target" }); });
  const strayRefutedOk = refusedCase(strayRefuted, ["R-009", "FEAT-001"]);
  const strayAbout = variant((q) => { q.regroup.questions[0].about.push({ id: "R-009", to: "FEAT-001" }); });
  const strayAboutOk = refusedCase(strayAbout, ["R-009", "FEAT-001"]);
  // req: R-1175
  check("R-1175: a refuted entry or a question about entry naming no move or share target of its row is refused", strayRefutedOk && strayAboutOk,
    `refuted=${strayRefutedOk} about=${strayAboutOk}`);
}
{
  // (c) A claim verdict matching no required purpose, outcome or reason is refused (finding 42).
  const strayClaim = variant((q) => { q.regroup.review.claims.push({ node: "FEAT-999", field: "purpose", text: "x", verdict: "accept", reason: "a stray claim for a node outside this proposal" }); });
  const ok = refusedCase(strayClaim, ["FEAT-999"]);
  // req: R-1184
  check("R-1184: a claim verdict matching no required purpose, outcome or reason is refused", ok);
}
{
  // (d) A keep verdict carrying targets is refused (finding 43).
  const keepWithTargets = variant((q) => { const v = verdictOf(q, "R-009"); v.targets = [{ to: "FEAT-001", reason: "stray target on a keep verdict" }]; });
  const ok = refusedCase(keepWithTargets, ["R-009", "keep"]);
  // req: R-1175
  check("R-1175: a keep verdict carrying targets is refused", ok);
}
{
  // (e) A question without "ask" is refused (finding 23).
  const noAsk = variant((q) => { delete q.regroup.questions[0].ask; });
  const ok = refusedCase(noAsk, ["ask"]);
  // req: R-1177
  check("R-1177: a question without ask is refused", ok);
}
{
  // (f) A feature status the tree checker's status pattern refuses is refused. Build brief 4
  // item 1 (finding 44) removed the regroup checker's own copy of the STATUS pattern: a copy
  // reachable only through a direct call risked drifting from the tree checker's own, for no
  // payoff, since the lift's output-side check (checkTree on the written ledger, via
  // proveLift) already refuses this first in every real, full-CLI run — so this is now pinned
  // through the command, not a direct call.
  const badStatus = variant((q) => { q.tree[1].features[0].status = "deprecated"; });
  const run = runFx("bad-status-cli", badStatus);
  const ok = run.r.status === 1 && !crashed(run.r) && !existsSync(run.page) && saysOwn(run.r, "invalid Status");
  // req: R-1177
  check("R-1177: a feature status the tree checker's status pattern refuses is refused", ok, `status=${run.r.status} ` + own(run.r.stderr).slice(0, 3).join(" | "));
}
{
  // (g) Only a proposed or active feature with no rows counts as a gap; a frozen or retired
  // one with no rows passes (finding 37).
  const frozenGap = variant((q) => {
    q.tree[1].features.push({ id: "FEAT-007", label: "Freeze analyst pages", purpose: "A frozen feature that holds no row yet.", status: "frozen (superseded by FEAT-004)", from: [], rows: [], subgroups: [] });
    q.regroup.review.claims.push({ node: "FEAT-007", field: "purpose", text: "A frozen feature that holds no row yet.", verdict: "accept", reason: "the claim matches the fixture's feature (claim FEAT-007)" });
  });
  const frozenOk = runFx("frozen-gap-pass", frozenGap);
  const frozenPass = frozenOk.r.status === 0 && !crashed(frozenOk.r);
  const retiredGap = variant((q) => {
    q.tree[1].features.push({ id: "FEAT-008", label: "Retire analyst pages", purpose: "A retired feature that holds no row.", status: "retired (folded into FEAT-004)", from: [], rows: [], subgroups: [] });
    q.regroup.review.claims.push({ node: "FEAT-008", field: "purpose", text: "A retired feature that holds no row.", verdict: "accept", reason: "the claim matches the fixture's feature (claim FEAT-008)" });
  });
  const retiredOk = runFx("retired-gap-pass", retiredGap);
  const retiredPass = retiredOk.r.status === 0 && !crashed(retiredOk.r);
  // req: R-1174
  check("R-1174: a frozen or retired feature with no rows is not a gap and needs no evidence", frozenPass && retiredPass,
    `frozen status=${frozenOk.r.status} ` + own(frozenOk.r.stderr).slice(0, 2).join(" | ") + `; retired status=${retiredOk.r.status} ` + own(retiredOk.r.stderr).slice(0, 2).join(" | "));
}
{
  // (h) An evidence citation's path is its text before "::", then before the first space,
  // less a trailing :<line> or :<line>-<line> (findings 28/30): a locator, a quoted title or
  // a "·" join after the real path does not make the row text-placed.
  const dir = join(scratchRoot, "r1176-locator-form");
  mkdirSync(join(dir, "src", "report"), { recursive: true });
  writeFileSync(join(dir, "src", "report", "render.mjs"), "export {};\n");
  const space = !isTextPlaced(dir, { id: "R-900", evidence: "src/report/render.mjs §5" });
  const lineRange = !isTextPlaced(dir, { id: "R-901", evidence: "src/report/render.mjs:41-53" });
  const singleLine = !isTextPlaced(dir, { id: "R-902", evidence: "src/report/render.mjs:41" });
  const dotJoin = !isTextPlaced(dir, { id: "R-903", evidence: "src/report/render.mjs · a quoted section title" });
  // req: R-1176
  check("R-1176: an evidence citation's path is read before the first space, less a trailing :<line> or :<line>-<line>, so a locator does not make the row text-placed",
    space && lineRange && singleLine && dotJoin, `space=${space} lineRange=${lineRange} singleLine=${singleLine} dotJoin=${dotJoin}`);
}
{
  // (h) the text-placed refusal names the check's own wording ("names no path that exists"),
  // the row text's phrase, not that the row "has no evidence".
  const noPlacedReason = variant((q) => { delete q.regroup.placed["R-006"]; });
  const run = runFx("placed-wording", noPlacedReason);
  const ok = run.r.status === 1 && !crashed(run.r) && mentions(run.r, "names no path that exists");
  // req: R-1176
  check('R-1176: the text-placed refusal says the Evidence cell "names no path that exists", not that it has no evidence', ok, `status=${run.r.status} ` + own(run.r.stderr).slice(0, 2).join(" | "));
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
