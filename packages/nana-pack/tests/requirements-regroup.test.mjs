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
import { PROBLEM_LINE_CAP, buildIdentityMapping } from "../../../scripts/requirements-lift.mjs";

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
/** Build 6 item 4 (T14, mutation survivor B5/7): FEAT-900's own table row names both its seed
 * label and its seed status ("active"), pinned by that one row — not by the two substrings
 * appearing anywhere in the table, where another row's own "active" status would mask a
 * blanked FEAT-900 cell. */
const feat900RowOk = (block) => /\|\s*FEAT-900\s*\|\s*Adopt the general engineering requirements\s*\|\s*active\s*\|/.test(block);

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
  // Item 7: brief 4's rule, applied here too — stderr only, never the lift's own echoed
  // stdout (row IDs, node IDs, line numbers), so a case naming only an ID pins nothing.
  return x.r.status === 1 && !crashed(x.r) && names.every((nm) => saysOwn(x.r, nm)) && !existsSync(x.page);
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
  // Item 9 (finding 40): a run the LIFT refuses (not only a regroup-level problem) still
  // removes an earlier review page at --out.
  const liftFailPage = join(scratchRoot, `lift-fail-page-${++caseN}.md`);
  const liftFailFirst = runFx("lift-fail-earlier-page", fxProposal(), { out: liftFailPage });
  const hadLiftFailPage = liftFailFirst.r.status === 0 && existsSync(liftFailPage);
  const liftFailSecond = runFx("lift-fail-earlier-page-fail", bad, { out: liftFailPage });
  const liftFailRemoved = hadLiftFailPage && liftFailSecond.r.status === 1 && !crashed(liftFailSecond.r) && !existsSync(liftFailPage);
  // req: R-1171
  check("R-1171: a run the lift's dry run refuses removes an earlier review page at --out, same as a regroup-level refusal", liftFailRemoved,
    `hadPage=${hadLiftFailPage} status=${liftFailSecond.r.status} page=${existsSync(liftFailPage)}`);
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
  // Item 8 (B2/4): the refusal's own words, not just the outward status/exists outcome a later,
  // different catch (the write-failure one) could also produce.
  const ok = r.status === 1 && !crashed(r) && existsSync(dirOut) && saysOwn(r, "this path is a directory");
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

// ================================================================== R-1171 (item 10: --out /dev/stdout on a terminal must not hang)
if (process.platform !== "win32") {
  // A FIFO stands in for a terminal device: opening either for reading, with nothing on the
  // other end, blocks forever. A failing run must never try to read an earlier page at --out
  // unless that path is a REGULAR file — proven here with a 5-second timeout, well under the
  // 120-second one every other case tolerates.
  const fifoPath = join(scratchRoot, `page-fifo-${++caseN}`);
  const mk = spawnSync("mkfifo", [fifoPath]);
  if (mk.status === 0) {
    const failing = variant((q) => { q.regroup.reasons = q.regroup.reasons.slice(1); });
    const dir = fxRoot(`fifo-case-${caseN}`, failing);
    const prop = join(dir, PROP_REL);
    const r = node([REGROUP, "--root", dir, "--proposal", prop, "--out", fifoPath], scratchRoot, { timeout: 5000 });
    const ok = r.status === 1 && r.signal === null && !crashed(r);
    // req: R-1171
    check("R-1171: a failing run reads --out for an earlier page only when it is a regular file, so a FIFO (standing in for a terminal) never hangs", ok,
      `status=${r.status} signal=${r.signal} ` + own(r.stderr ?? "").slice(0, 2).join(" | "));
  }
}

// ================================================================== R-1179 (item 10: empty target and reported-line sections print "(none)")
{
  // An identity mapping of a tiny tree-form ledger: nothing moves (every "from" names its own
  // node's own old heading), so R-1170 reports no line; every row's verdict is "keep", so no
  // move or share target exists either — both sections must print "(none)", not blank.
  const NTH = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  const NT = { cap: "# CAP-01 · Cap", f1: "## FEAT-001 · Alpha" };
  const NONE_FX = [
    NT.cap, "", "Purpose: capability purpose for the none-sections fixture.", "Outcome: a visible outcome for the none-sections fixture.", "",
    NT.f1, "", "Purpose: alpha feature purpose.", "Status: active", "", ...NTH,
    "| R-001 | WHEN alpha runs, it shall do alpha things. | implemented | `tests/alpha.test.mjs::R-001: alpha` |", "",
  ].join("\n");
  const noneDir = join(scratchRoot, `none-sections-fx-${++caseN}`);
  mkdirSync(join(noneDir, "docs", "regroup"), { recursive: true });
  mkdirSync(join(noneDir, "tests"), { recursive: true });
  writeFileSync(join(noneDir, "tests", "alpha.test.mjs"), "// fixture test file\n");
  writeFileSync(join(noneDir, "REQUIREMENTS.md"), NONE_FX);
  const noneMapping = {
    ...buildIdentityMapping(NONE_FX),
    regroup: {
      reasons: [], placed: {}, evidence: {},
      review: {
        drafter: "anthropic", reviewer: "openai",
        verdicts: [{ id: "R-001", at: "FEAT-001", verdict: "keep", reason: "R-001 stays at Alpha (keep)" }],
        claims: [
          { node: "CAP-01", field: "purpose", text: "capability purpose for the none-sections fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
          { node: "CAP-01", field: "outcome", text: "a visible outcome for the none-sections fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
          { node: "FEAT-001", field: "purpose", text: "alpha feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
        ],
      },
      refuted: [], questions: [],
    },
  };
  writeFileSync(join(noneDir, "docs", "regroup", "proposal.json"), `${JSON.stringify(noneMapping, null, 2)}\n`);
  const nonePage = join(scratchRoot, `none-sections-page-${++caseN}.md`);
  const noneRun = regroup(["--root", noneDir, "--proposal", join(noneDir, "docs", "regroup", "proposal.json"), "--out", nonePage], scratchRoot);
  const noneText = (() => { try { return readFileSync(nonePage, "utf8"); } catch { return null; } })();
  const posLines = noneText?.indexOf("## Reported lines") ?? -1;
  const posTargets = noneText?.indexOf("## Move and share targets") ?? -1;
  const posClaims = noneText?.indexOf("## Rejected claims") ?? -1;
  const linesNoneOk = posLines >= 0 && noneText.slice(posLines, posTargets).includes("(none)");
  const targetsNoneOk = posTargets >= 0 && noneText.slice(posTargets, posClaims).includes("(none)");
  // req: R-1179
  check('R-1179: an empty "Reported lines" or "Move and share targets" section prints "(none)", same as every other empty section',
    noneRun.status === 0 && !crashed(noneRun) && linesNoneOk && targetsNoneOk,
    `status=${noneRun.status} ` + own(noneRun.stderr).slice(0, 2).join(" | ") + ` lines=${linesNoneOk} targets=${targetsNoneOk}`);
}

// ================================================================== R-1179 (item 10: a bare <placeholder> in row text is escaped in gists and the appendix)
{
  // The same tiny ledger, R-001's own text holding a bare "<placeholder>" (findings 30): a
  // Markdown renderer reads an unescaped "<placeholder>" as literal, unrecognised HTML and
  // drops it from view, in both the text-placed gist and the appendix.
  const PTH = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  const PT = { cap: "# CAP-01 · Cap", f1: "## FEAT-001 · Alpha" };
  const PLACEHOLDER_FX = [
    PT.cap, "", "Purpose: capability purpose for the placeholder fixture.", "Outcome: a visible outcome for the placeholder fixture.", "",
    PT.f1, "", "Purpose: alpha feature purpose.", "Status: active", "", ...PTH,
    "| R-001 | WHEN alpha runs, it shall replace every <placeholder> with its bound value. | implemented | — |", "",
  ].join("\n");
  const phDir = join(scratchRoot, `placeholder-fx-${++caseN}`);
  mkdirSync(join(phDir, "docs", "regroup"), { recursive: true });
  writeFileSync(join(phDir, "REQUIREMENTS.md"), PLACEHOLDER_FX);
  const phMapping = {
    ...buildIdentityMapping(PLACEHOLDER_FX),
    regroup: {
      reasons: [], placed: { "R-001": "placed by its text alone, which names this node's work" }, evidence: {},
      review: {
        drafter: "anthropic", reviewer: "openai",
        verdicts: [{ id: "R-001", at: "FEAT-001", verdict: "keep", reason: "R-001 stays at Alpha (keep)" }],
        claims: [
          { node: "CAP-01", field: "purpose", text: "capability purpose for the placeholder fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
          { node: "CAP-01", field: "outcome", text: "a visible outcome for the placeholder fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
          { node: "FEAT-001", field: "purpose", text: "alpha feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
        ],
      },
      refuted: [], questions: [],
    },
  };
  writeFileSync(join(phDir, "docs", "regroup", "proposal.json"), `${JSON.stringify(phMapping, null, 2)}\n`);
  const phPage = join(scratchRoot, `placeholder-page-${++caseN}.md`);
  const phRun = regroup(["--root", phDir, "--proposal", join(phDir, "docs", "regroup", "proposal.json"), "--out", phPage], scratchRoot);
  const phText = (() => { try { return readFileSync(phPage, "utf8"); } catch { return null; } })();
  const escapedOk = phText !== null && phText.includes("&lt;placeholder&gt;") && !phText.includes("<placeholder>");
  // req: R-1179
  check('R-1179: a bare <placeholder> in row text is escaped ("&lt;placeholder&gt;") in its gist and the appendix, never a literal, vanishing HTML tag',
    phRun.status === 0 && !crashed(phRun) && escapedOk,
    `status=${phRun.status} ` + own(phRun.stderr).slice(0, 2).join(" | ") + ` escaped=${escapedOk}`);
}

// ================================================================== Item 2 (finding 39): a Markdown code span is never escaped, even when the row also holds a bare placeholder
{
  const CTH = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  const CT = { cap: "# CAP-01 · Cap", f1: "## FEAT-001 · Alpha" };
  const CODE_SPAN_FX = [
    CT.cap, "", "Purpose: capability purpose for the code-span fixture.", "Outcome: a visible outcome for the code-span fixture.", "",
    CT.f1, "", "Purpose: alpha feature purpose.", "Status: active", "", ...CTH,
    "| R-001 | WHEN alpha calls `<provider>`, it shall replace every <placeholder> with its bound value. | implemented | — |", "",
  ].join("\n");
  const csDir = join(scratchRoot, `code-span-fx-${++caseN}`);
  mkdirSync(join(csDir, "docs", "regroup"), { recursive: true });
  writeFileSync(join(csDir, "REQUIREMENTS.md"), CODE_SPAN_FX);
  const csMapping = {
    ...buildIdentityMapping(CODE_SPAN_FX),
    regroup: {
      reasons: [], placed: { "R-001": "placed by its text alone, which names this node's work" }, evidence: {},
      review: {
        drafter: "anthropic", reviewer: "openai",
        verdicts: [{ id: "R-001", at: "FEAT-001", verdict: "keep", reason: "R-001 stays at Alpha (keep)" }],
        claims: [
          { node: "CAP-01", field: "purpose", text: "capability purpose for the code-span fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
          { node: "CAP-01", field: "outcome", text: "a visible outcome for the code-span fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
          { node: "FEAT-001", field: "purpose", text: "alpha feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
        ],
      },
      refuted: [], questions: [],
    },
  };
  writeFileSync(join(csDir, "docs", "regroup", "proposal.json"), `${JSON.stringify(csMapping, null, 2)}\n`);
  const csPage = join(scratchRoot, `code-span-page-${++caseN}.md`);
  const csRun = regroup(["--root", csDir, "--proposal", join(csDir, "docs", "regroup", "proposal.json"), "--out", csPage], scratchRoot);
  const csText = (() => { try { return readFileSync(csPage, "utf8"); } catch { return null; } })();
  const placeholderEscapedOk = csText !== null && csText.includes("&lt;placeholder&gt;") && !csText.includes("<placeholder>");
  const codeSpanVerbatimOk = csText !== null && csText.includes("`<provider>`") && !csText.includes("&lt;provider&gt;");
  // req: R-1179
  check("R-1179: a row holding both a bare <placeholder> and a code span naming <provider> shows the first escaped and the second verbatim, in its gist and the appendix",
    csRun.status === 0 && !crashed(csRun) && placeholderEscapedOk && codeSpanVerbatimOk,
    `status=${csRun.status} ` + own(csRun.stderr).slice(0, 2).join(" | ") + ` placeholder=${placeholderEscapedOk} codeSpan=${codeSpanVerbatimOk}`);
}

// ================================================================== Build 6 item 3 (R-1178, R-1179): proposal text escaped everywhere, not only the gists and the appendix
{
  // A bare "<placeholder>" and a code span naming "<provider>" sit together in BOTH a
  // feature's own purpose (the nodes renderer) and a reported line's reason (the lines
  // renderer) -- proposal text the earlier escaping tests never touched (those cover only a
  // row's own text, the gist and the appendix).
  const escVariant = variant((q) => {
    const f1 = q.tree[0].features[0]; // FEAT-001
    f1.purpose = "Route each request to its <placeholder> target, naming the binding as `<provider>`.";
    const pc = q.regroup.review.claims.find((c) => c.node === "FEAT-001" && c.field === "purpose");
    pc.text = f1.purpose;
    const r = q.regroup.reasons.find((x) => x.line === L15 && x.to === "FEAT-002");
    r.why = "Moves because the <placeholder> target changes together with `<provider>`.";
    const rc = q.regroup.review.claims.find((c) => c.line === L15 && c.to === "FEAT-002");
    rc.text = r.why;
  });
  const run = runFx("escape-everywhere", escVariant);
  const page = run.text ?? "";
  const purposeLineOk = /Purpose: .*&lt;placeholder&gt;.*`<provider>`/.test(page);
  const reasonLineOk = /- Reason: .*&lt;placeholder&gt;.*`<provider>`/.test(page);
  const noBareOk = !page.includes("<placeholder>");
  const codeSpanOk = !page.includes("&lt;provider&gt;");
  // req: R-1178
  check("R-1178: a feature's purpose holding a bare <placeholder> and a code span naming <provider> shows the first escaped and the second verbatim",
    run.r.status === 0 && !crashed(run.r) && purposeLineOk && noBareOk && codeSpanOk,
    `status=${run.r.status} purpose=${purposeLineOk} noBare=${noBareOk} codeSpan=${codeSpanOk} ` + own(run.r.stderr).slice(0, 2).join(" | "));
  // req: R-1179
  check("R-1179: a reported line's reason holding a bare <placeholder> and a code span naming <provider> shows the first escaped and the second verbatim",
    run.r.status === 0 && !crashed(run.r) && reasonLineOk && noBareOk && codeSpanOk,
    `status=${run.r.status} reason=${reasonLineOk} noBare=${noBareOk} codeSpan=${codeSpanOk} ` + own(run.r.stderr).slice(0, 2).join(" | "));
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
    [`reason for line ${L22} -> SUB-001 missing`, variant((q) => { q.regroup.reasons = q.regroup.reasons.filter((r) => !(r.line === L22)); q.regroup.review.claims = q.regroup.review.claims.filter((c) => c.line !== L22); }), [String(L22), "has no reason"]],
    [`reason for line ${L37} -> FEAT-004 repeated`, variant((q) => { q.regroup.reasons.push({ ...q.regroup.reasons.find((r) => r.line === L37 && r.to === "FEAT-004") }); }), [String(L37), "has more than one reason"]],
    [`stale reason for line ${L7}`, variant((q) => { q.regroup.reasons.push({ line: L7, to: "FEAT-002", why: "a reason for a line the lift does not report (stale)" }); }), [String(L7), "a stale reason"]],
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
    [`reason for line ${L22} -> SUB-001 missing, with its claim kept so only the missing-reason check catches it`, variant((q) => { q.regroup.reasons = q.regroup.reasons.filter((r) => !(r.line === L22)); }), [String(L22), "has no reason"]],
  ];
  const { ok, why } = allRefused(cases);
  // Item 6 (M5): the moved-reason case. Line 30's own reason to FEAT-002 is given AT line 15
  // instead (its line field changed, claim kept in step), so line 15 -> FEAT-002 now carries
  // two reasons and line 30 -> FEAT-002 carries none — a per-key count, not a line/heading-text
  // multiset shortfall, is the only way both halves are caught at once.
  const movedP = variant((q) => {
    const r30 = q.regroup.reasons.find((r) => r.line === L30 && r.to === "FEAT-002");
    r30.line = L15;
    const c30 = q.regroup.review.claims.find((c) => c.line === L30 && c.to === "FEAT-002");
    c30.line = L15;
  });
  const movedRun = runFx("moved-reason", movedP);
  const movedOk = movedRun.r.status === 1 && !crashed(movedRun.r) && !existsSync(movedRun.page) &&
    saysOwn(movedRun.r, `line ${L15} -> FEAT-002 has more than one reason`) &&
    saysOwn(movedRun.r, `line ${L30} -> FEAT-002 has no reason`);
  // req: R-1173
  check("R-1173: line 30's reason for -> FEAT-002 given at line 15 instead is refused naming both line 15's excess reason and line 30's missing one",
    movedOk, `status=${movedRun.r.status} crashed=${crashed(movedRun.r)} page=${existsSync(movedRun.page)} ` + own(movedRun.r.stderr).slice(0, 3).join(" | "));
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
    ["FEAT-005 names no evidence path", variant((q) => { delete q.regroup.evidence["FEAT-005"]; }), ["FEAT-005", "names no evidence path"]],
    ["FEAT-005's evidence list is empty", variant((q) => { q.regroup.evidence["FEAT-005"] = []; }), ["FEAT-005", "names no evidence path"]],
    ["FEAT-005 names a missing path", variant((q) => { q.regroup.evidence["FEAT-005"] = ["src/report/missing.mjs"]; }), ["src/report/missing.mjs", "does not exist under the root"]],
    ["FEAT-005 names a path that `..` leads outside the root", variant((q) => { q.regroup.evidence["FEAT-005"] = ["../outside.txt"]; }), ["FEAT-005", "does not exist under the root"]],
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

// ================================================================== Build 6 item 2 (R-1174): evidence through a symlink leaving the root
{
  // A symlink inside the root pointing at a folder outside it: FEAT-005's evidence path runs
  // through "docs/generated", a symlink the case creates pointing outside the case root. The
  // path is lexically under the root (a lexical check alone would pass it), but its real
  // location is not.
  const symProposal = variant((q) => { q.regroup.evidence["FEAT-005"] = ["docs/generated/plan.md"]; });
  const dir = fxRoot("evidence-symlink-escape", symProposal);
  const outsideDir = join(scratchRoot, `outside-evidence-${++caseN}`);
  mkdirSync(outsideDir, { recursive: true });
  writeFileSync(join(outsideDir, "plan.md"), "a plan the case root never holds\n");
  try { symlinkSync(outsideDir, join(dir, "docs", "generated"), "dir"); } catch {}
  const prop = join(dir, PROP_REL);
  mkdirSync(join(scratchRoot, "pages"), { recursive: true });
  const page = join(scratchRoot, "pages", `${++caseN}.md`);
  const r = regroup(["--root", dir, "--proposal", prop, "--out", page], scratchRoot);
  const ok = r.status === 1 && !crashed(r) && !existsSync(page) && saysOwn(r, "FEAT-005") && saysOwn(r, "docs/generated/plan.md") && saysOwn(r, "does not exist under the root");
  // req: R-1174
  check('R-1174: an evidence path through a symlink whose real location leaves the root is refused like a literal ".." leaves',
    ok, `status=${r.status} ` + own(r.stderr).slice(0, 3).join(" | "));
}

// ================================================================== T7
{
  const cases = [
    ["review record misses R-009", variant((q) => { q.regroup.review.verdicts = q.regroup.review.verdicts.filter((v) => v.id !== "R-009"); }), ["R-009", "has no verdict"]],
    ["review record repeats R-009", variant((q) => { q.regroup.review.verdicts.push({ ...verdictOf(q, "R-009") }); }), ["R-009", "is repeated"]],
    ["R-008's verdict names a stale home", variant((q) => { verdictOf(q, "R-008").at = "FEAT-002"; }), ["R-008", "names a stale home"]],
    // Item 7 (T7's unknown verdict): removing the own-words check falls through to the
    // "names no target" branch below, which also names R-009 — only the check's own exact
    // phrase pins the right branch.
    ["R-009's verdict is neither keep, move nor share", variant((q) => { verdictOf(q, "R-009").verdict = "maybe"; }), ["R-009", "is neither keep, move nor share"]],
    ["R-003's move names an unknown target", variant((q) => { verdictOf(q, "R-003").targets[0].to = "FEAT-999"; q.regroup.refuted[0].to = "FEAT-999"; }), ["FEAT-999", "is not a node in this proposal"]],
    ["R-009's keep verdict has an empty reason", variant((q) => { verdictOf(q, "R-009").reason = ""; }), ["R-009", "keep verdict has an empty reason"]],
    ["R-005's share target carries no reason of its own", variant((q) => { delete verdictOf(q, "R-005").targets[0].reason; }), ["R-005", "target has an empty reason"]],
    // Unknown rows (brief 2 item 6; brief 1's clarification 5): a verdict, a refuted entry or
    // a question's about entry naming a row the ledger does not hold is refused, naming it.
    ["review record's verdict names a row the ledger does not hold", variant((q) => { q.regroup.review.verdicts.push({ id: "R-999", at: "FEAT-001", verdict: "keep", reason: "bogus" }); }), ["R-999", "regroup.review.verdicts", "is not a row in this ledger"]],
    ["a refuted entry names a row the ledger does not hold", variant((q) => { q.regroup.refuted.push({ id: "R-999", to: "FEAT-004", reason: "bogus" }); }), ["R-999", "regroup.refuted", "is not a row in this ledger"]],
    // Item 8 (B2/23): the unknown-row message's own words — "names no move or share target",
    // the OTHER check that also names R-999, reads differently and must not be mistaken for it.
    ["a question's about entry names a row the ledger does not hold", variant((q) => { q.regroup.questions[0].about.push({ id: "R-999", to: "FEAT-001" }); }), ["R-999", "which is not in this ledger"]],
    // Item 9 (finding 38): a refuted entry's own reason, empty.
    ["a refuted entry's reason is empty", variant((q) => { q.regroup.refuted[0].reason = ""; }), ["R-003", "FEAT-004", "has an empty reason"]],
    // Item 9 (finding 38): a move or share verdict naming targets as an empty array (not a
    // missing field) is still "no target named".
    ["R-003's move verdict names targets as an empty array", variant((q) => { verdictOf(q, "R-003").targets = []; }), ["R-003", "names no target"]],
    // Item 9 (finding 38): a target refuted twice (two refuted entries for the same row and
    // target), not only a target mixed between refuted and asked (T8's own case).
    ["R-003's move target FEAT-004 is refuted twice", variant((q) => { q.regroup.refuted.push({ ...q.regroup.refuted.find((r) => r.id === "R-003" && r.to === "FEAT-004") }); }), ["R-003", "FEAT-004", "resolved more than once"]],
    // Item 10 (finding 3): an about entry with an id but no "to" is refused, not silently accepted.
    ["a question's about entry names R-009 with no \"to\"", variant((q) => { q.regroup.questions[0].about.push({ id: "R-009" }); }), ["R-009", "but no target"]],
    // Item 10 (finding 3): an empty about entry (no id, node or line) is refused.
    ["a question's about entry names nothing", variant((q) => { q.regroup.questions[0].about.push({}); }), ["about entry names nothing"]],
    // Item 10 (finding 3): a claim-style about entry naming a claim that is NOT rejected
    // (FEAT-002's purpose claim is accepted) is refused, not silently accepted.
    ["a question's about entry names FEAT-002's purpose claim, which is accepted, not rejected", variant((q) => { q.regroup.questions[0].about.push({ node: "FEAT-002", field: "purpose" }); }), ["FEAT-002 purpose", "names no rejected claim"]],
  ];
  const { ok, why } = allRefused(cases);
  // req: R-1175
  check("R-1175: a review record missing a row, repeating one, naming a stale home, an unknown verdict or target, an empty reason or a target without its own reason is refused", ok, why);
}

// ================================================================== T8
{
  const cases = [
    ["R-003's move names two targets", variant((q) => { verdictOf(q, "R-003").targets.push({ to: "FEAT-002", reason: "also feeds the build (target delta)" }); q.regroup.refuted.push({ id: "R-003", to: "FEAT-002", reason: "it does not (refute delta)" }); }), ["R-003", "names more than one target"]],
    ["R-003's move target is left unresolved", variant((q) => { q.regroup.refuted = q.regroup.refuted.filter((x) => x.id !== "R-003"); }), ["R-003", "target is left unresolved"]],
    ["R-005's share target FEAT-004 is left unresolved", variant((q) => { q.regroup.refuted = q.regroup.refuted.filter((x) => x.id !== "R-005"); }), ["R-005", "FEAT-004", "target is left unresolved"]],
    ["R-005's share target FEAT-004 is resolved twice", variant((q) => { q.regroup.questions[0].about.push({ id: "R-005", to: "FEAT-004" }); }), ["R-005", "target is resolved more than once"]],
  ];
  const { ok, why } = allRefused(cases);
  const pass = runFx("mixed-share-pass", fxProposal());
  const passOk = pass.r.status === 0 && !crashed(pass.r);
  // Item 9 (finding 42): the title's "a share carried … passes" needs an actual carried share,
  // run through the command — now that the lift carries shares for real (seat amendment 2
  // landed), not only through a direct call to regroupProblems. FEAT-002 adds a fresh share of
  // R-010 (owned by FEAT-004); the input ledger is flat, so this is a brand new share, not one
  // carried from an old heading.
  const sharedPass = variant((q) => {
    const feat002 = mappingNodesOf(q).find((x) => x.id === "FEAT-002").node;
    feat002.shares_added = ["R-010"];
    feat002.also_applies = ["R-010"];
    const v10 = verdictOf(q, "R-010");
    delete v10.reason;
    v10.verdict = "share";
    v10.targets = [{ to: "FEAT-002", reason: "the escaping rule also bounds the production-size build (shared through the command)" }];
  });
  const sharedRun = runFx("carried-share-via-command", sharedPass);
  const sharedPage = sharedRun.text ?? "";
  const sharedOk = sharedRun.r.status === 0 && !crashed(sharedRun.r) && /R-010 \(home FEAT-004\) -> FEAT-002 \[share\]: proposed because .*shared through the command.* — carried/.test(sharedPage);
  // req: R-1175
  check("R-1175: each move or share target needs exactly one outcome keyed by row and target, so a share carried to one feature and refuted for another passes, and a target left unresolved or resolved twice is refused", ok && passOk && sharedOk, why || `mixed-share pass status=${pass.r.status} shared status=${sharedRun.r.status} shared=${sharedOk}`);
}

// ================================================================== R-1175 (direct call: CHANGE §3.4 item 2 / residual 2)
{
  // T8 above now exercises a genuine carried share through the real command (seat amendment 2
  // landed). This direct call is still needed for the move case: a real lift run would always
  // refuse an `also_applies` that names a row no `shares_added` backs, so the only way to pin
  // "a move's target is never carried even when also_applies wrongly names it" is to build that
  // inconsistent state by hand and call regroupProblems/resolveTargetOutcome directly.
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
// Item 9 (finding 38): a review record must NAME its drafter and reviewer lineages — an empty
// or missing one is refused on its own, apart from the same-lineage clause above.
{
  const noDrafter = variant((q) => { delete q.regroup.review.drafter; });
  const noDrafterOk = refusedCase(noDrafter, ["names no drafter lineage"]);
  const emptyReviewer = variant((q) => { q.regroup.review.reviewer = ""; });
  const emptyReviewerOk = refusedCase(emptyReviewer, ["names no reviewer lineage"]);
  // req: R-1175
  check("R-1175: a review record names no drafter or an empty reviewer lineage is refused", noDrafterOk && emptyReviewerOk, `noDrafter=${noDrafterOk} emptyReviewer=${emptyReviewerOk}`);
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
  const N = PROBLEM_LINE_CAP + 20; // > PROBLEM_LINE_CAP, so the cap and "… and N more" both fire
  const p = variant((q) => { for (let k = 1; k <= N; k++) q[`x${String(k).padStart(2, "0")}`] = k; });
  const x = runFx("cap", p);
  const errLines = own(x.r.stderr);
  const shown = new Set(errLines.flatMap((l) => [...l.matchAll(/(?<![\w-])x\d{2}(?![\w-])/g)].map((m) => m[0])));
  // Item 9 (finding 45): the exact count of the REST (N minus the cap, 20), not just any
  // digit near "more" — printing the total (60) instead must go red.
  const restMatch = errLines.some((l) => new RegExp(`\\b${N - PROBLEM_LINE_CAP}\\b[^\\n]*\\bmore\\b`).test(l));
  const totalMismatch = !errLines.some((l) => new RegExp(`\\b${N}\\b[^\\n]*\\bmore\\b`).test(l));
  // Item 8: the cap's own name, not an inline 40/41 literal — retuning PROBLEM_LINE_CAP must
  // change no test.
  const ok = x.r.status === 1 && !crashed(x.r) && errLines.length <= PROBLEM_LINE_CAP + 1 && shown.size > 0 && shown.size <= PROBLEM_LINE_CAP && restMatch && totalMismatch && !existsSync(x.page);
  // req: R-1177
  check("R-1177: a proposal with more problems than the cap prints at most the problem-line cap and the count of the rest", ok,
    `lines=${errLines.length} shown=${shown.size} rest=${restMatch} totalMismatch=${totalMismatch}`);
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
    // Item 8 (B3/20, B3/22 to B3/26): the remaining exact-type checks — a reason-claim's own
    // "to", a refuted entry's "to", and a question about entry's id, to, node and line.
    [`line ${L30} -> FEAT-004 reason claim's to is an array, not a string`, variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.line === L30 && c.to === "FEAT-004")].to = ["FEAT-004"]; }), ["regroup.review.claims", "to"]],
    ["a refuted entry's to is an array, not a string", variant((q) => { q.regroup.refuted[0].to = ["FEAT-004"]; }), ["regroup.refuted[0].to"]],
    ["a question about entry's id is an array, not a string", variant((q) => { q.regroup.questions[0].about[0].id = ["R-005"]; }), ["regroup.questions[0].about[0].id"]],
    ["a question about entry's to is an array, not a string", variant((q) => { q.regroup.questions[0].about[0].to = ["FEAT-001"]; }), ["regroup.questions[0].about[0].to"]],
    ["a question about entry's node is an array, not a string", variant((q) => { q.regroup.questions[0].about[0].node = ["FEAT-001"]; }), ["regroup.questions[0].about[0].node"]],
    ["a question about entry's line is a string, not an integer", variant((q) => { q.regroup.questions[0].about[0].line = String(L30); }), ["regroup.questions[0].about[0].line", "must be an integer"]],
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
  // and the earlier page removed. Item 10 (finding 47): main() no longer special-cases this
  // before the lift runs — allEvidenceAbsPaths already guards a non-array value, and the
  // shape bucket inside regroupProblems refuses the same proposal with the same message.
  const evidenceShapeCases = [
    ["FEAT-005 (a gap) evidence is an object", variant((q) => { q.regroup.evidence["FEAT-005"] = { path: "src/report/render.mjs" }; }), "regroup.evidence.FEAT-005"],
    ["FEAT-005 (a gap) evidence is a number", variant((q) => { q.regroup.evidence["FEAT-005"] = 5; }), "regroup.evidence.FEAT-005"],
    ["FEAT-005 (a gap) evidence is true", variant((q) => { q.regroup.evidence["FEAT-005"] = true; }), "regroup.evidence.FEAT-005"],
    ["FEAT-004 (not a gap) evidence is an object", variant((q) => { q.regroup.evidence["FEAT-004"] = { path: "tests/render.test.mjs" }; }), "regroup.evidence.FEAT-004"],
    // Item 8 (B3/8): FEAT-004 is not a gap, so R-1174's evidence-path demand never runs on it —
    // only this shape check's own string-entry test can catch a non-string array entry here.
    ["FEAT-004 (not a gap) evidence is an array holding a non-string", variant((q) => { q.regroup.evidence["FEAT-004"] = [123]; }), "regroup.evidence.FEAT-004"],
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
  check("R-1177: an evidence value written as an object, a number or a boolean is refused by name, for a gap or a non-gap feature, and a failing run still removes an earlier page",
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

// ================================================================== Item 1 (finding 0): a padded status is refused in the shape check, with no evidence ever demanded for it
{
  const paddedCases = [
    ["a trailing space", "proposed "],
    ["a leading space", " active"],
    ["a trailing tab", "proposed\t"],
  ];
  const misses = [];
  for (const [label, status] of paddedCases) {
    const p = variant((q) => {
      mappingNodesOf(q).find((x) => x.id === "FEAT-005").node.status = status;
      delete q.regroup.evidence["FEAT-005"];
    });
    const run = runFx(`padded-status-${label}`, p);
    const ok = run.r.status === 1 && !crashed(run.r) && !existsSync(run.page) &&
      saysOwn(run.r, "tree[1].features[1].status") && saysOwn(run.r, "is padded") && saysOwn(run.r, "trimmed");
    if (!ok) misses.push(`${label}: status=${JSON.stringify(status)} run.status=${run.r.status} ` + own(run.r.stderr).slice(0, 2).join(" | "));
  }
  // req: R-1177
  check("R-1177: a feature status that differs from its own trimmed self (a trailing space, a leading space or a trailing tab) is refused in the shape check, with no evidence ever demanded for it",
    misses.length === 0, misses.join(" / "));
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
  // proposal names no label or status of its own for FEAT-900. Build 6 item 4 (mutation
  // survivor B5/7): pinned by FEAT-900's OWN row, not by the label and "active" appearing
  // anywhere in the table — another row's own "active" status must not mask a blanked FEAT-900 cell.
  const tableReservedOk = feat900RowOk(tableBlock);
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
  // Item 5 (finding 12): every capability's own label, purpose and outcome — CAP-02's, not
  // only CAP-01's, so dropping CAP-02's own text (while keeping its heading's ID) goes red.
  const capLabelOk = nodesBlock.includes("### CAP-01 — Ingest") && nodesBlock.includes("### CAP-02 — Report");
  const capPurposeOutcomeOk = nodesBlock.includes("Render the analyst pages from the full dataset and publish only what the floor allows.") &&
    nodesBlock.includes("Each analyst page is one escaped HTML file built from unsampled tables.");
  // Item 5 (finding 12): a subgroup's own label and purpose (SUB-001's), not just its ID.
  const subgroupTextOk = nodesBlock.includes("##### SUB-001 — Sizing") && nodesBlock.includes("Print the staging table sizes after each full build.");
  // Item 5 (finding 12): a reserved subgroup's own seed label and purpose (SUB-900's), never
  // blank — the honest fixture's SUB-900 carries no label or purpose of its own.
  const reservedSubOk = nodesBlock.includes("Configuration and provenance") && nodesBlock.includes("a tunable is defined once, with provenance, and a retune changes no code.");
  // Seat-titles (frozen, build 1 §5, T14): this exact title is required verbatim; the
  // strengthened clauses above (item 4) are asserted in the body, not the title.
  // req: R-1178
  check("R-1178: the page opens with both hashes, the proof line, the lineages and the placement and claim verdict counts, then the numbered questions, the feature table with status mix, and every node with its purpose and each proposed feature's evidence",
    pass.r.status === 0 && headerOk && orderOk && recommendationOk && tableOk && tableStatusOk && tableReservedOk && statusMixOk && purposesOk && purposeTextOk && outcomeTextOk && nestedOk && noIndentOk && reservedOk && capLabelOk && capPurposeOutcomeOk && subgroupTextOk && reservedSubOk,
    `status=${pass.r.status} header=${headerOk} order=${orderOk} recommendation=${recommendationOk} table=${tableOk} tableStatus=${tableStatusOk} tableReserved=${tableReservedOk} statusMix=${statusMixOk} purposes=${purposesOk} purposeText=${purposeTextOk} outcomeText=${outcomeTextOk} nested=${nestedOk} noIndent=${noIndentOk} reserved=${reservedOk} capLabel=${capLabelOk} capPurposeOutcome=${capPurposeOutcomeOk} subgroupText=${subgroupTextOk} reservedSub=${reservedSubOk}`);
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
  // Build 6 item 4 (mutation survivor B5/7): FEAT-900's own row, not the table at large.
  const seedOk = feat900RowOk(tableBlock);
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

// ================================================================== R-1178/R-1179 (item 10: field lines never merge into one Markdown paragraph)
{
  // Finding 26: two field lines with no blank line between them merge into one paragraph in
  // a Markdown renderer. Each pair named there is separated so a renderer never merges them:
  // the header's hashes and proof line, a question's ask and recommendation, and a node's
  // Purpose and Outcome each get a blank line; a reported line's reason is its own bullet list
  // item instead (findings 26 and the acceptance harness's own line-adjacency read of this
  // exact section both need the reason on the very next line, with no blank line before it —
  // a bullet list still starts a new Markdown block right after a paragraph, no blank needed).
  const pass = runFx("no-merge-page", fxProposal());
  const page = pass.text ?? "";
  const lines = page.split("\n");
  const blankAfter = (needle) => { const i = lines.findIndex((l) => l.startsWith(needle)); return i >= 0 && i + 1 < lines.length && lines[i + 1] === ""; };
  const headerOk = blankAfter("Proposal SHA-256:") && blankAfter("Ledger pin SHA-256:");
  const questionOk = blankAfter("1. Should the build budget row");
  const nodeOk = blankAfter("### CAP-01 — Ingest") && blankAfter("Purpose: Load the analyst's source files into staging and build the dataset the desk reads.");
  const lineIdx = lines.findIndex((l) => l.startsWith(`Line ${L15}: "${H.build}"`));
  const lineOk = lineIdx >= 0 && lines[lineIdx + 1]?.startsWith("- Reason:");
  // req: R-1178
  check("R-1178: the header's hashes and proof line, and a question's ask and recommendation, are each their own paragraph, never merged by a Markdown renderer",
    pass.r.status === 0 && headerOk && questionOk, `status=${pass.r.status} header=${headerOk} question=${questionOk}`);
  // req: R-1179
  check("R-1179: a node's Purpose and Outcome, and a reported line and its reason, are each their own paragraph, never merged by a Markdown renderer",
    pass.r.status === 0 && nodeOk && lineOk, `status=${pass.r.status} node=${nodeOk} line=${lineOk}`);
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
  // Item 10 (findings 25/27): the target's own argument is labelled "proposed because", and a
  // refuted target also shows the refutation's own reason beside "refuted" — not only the
  // target's own argument, which used to read (wrongly) as if it were the refutation's reason.
  const targetsOk = /R-003 \(home FEAT-001\) -> FEAT-004 \[move\]: proposed because .*target alpha.* — refuted — .*refute alpha/.test(targetsBlock) &&
    /R-005 \(home FEAT-002\) -> FEAT-001 \[share\]: proposed because .*target bravo.* — asked in question 1\b/.test(targetsBlock) &&
    /R-005 \(home FEAT-002\) -> FEAT-004 \[share\]: proposed because .*target charlie.* — refuted — .*refute bravo/.test(targetsBlock);
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
  // Item 5 (finding 13): every ledger row ID shows in the appendix under its OWN node's
  // heading, a subgroup included — R-006 under SUB-001, G-004 under SUB-901, not lumped
  // under their parent feature (whose own section the check above already covers).
  const appendixHeadings = [...appendixBlock.matchAll(/^### Appendix — ([A-Z]+-\d+)$/gm)].map((m) => ({ id: m[1], index: m.index }));
  const appendixSectionOf = (id) => {
    const i = appendixHeadings.findIndex((h) => h.id === id);
    if (i < 0) return null;
    const start = appendixHeadings[i].index;
    const end = i + 1 < appendixHeadings.length ? appendixHeadings[i + 1].index : appendixBlock.length;
    return appendixBlock.slice(start, end);
  };
  const appendixSubOk = (appendixSectionOf("SUB-001") ?? "").includes("R-006") && (appendixSectionOf("SUB-901") ?? "").includes("G-004");
  // Seat-titles (frozen, build 1 §5, T16): this exact title is required verbatim; the
  // strengthened clauses above (item 4) are asserted in the body, not the title.
  // req: R-1179
  check("R-1179: the page lists each reported line with its reason and rows, each move and share target with its own outcome, each rejected claim with its reason, each text-placed row with its reason, and every row only in the appendix after them",
    pass.r.status === 0 && orderOk && linesOk && lineReasonOk && targetsOk && targetReasonOk && claimsOk && placedOk && placedFieldsOk && refutedOk && appendixOk && appendixGroupOk && appendixSubOk,
    `order=${orderOk} lines=${linesOk} lineReason=${lineReasonOk} targets=${targetsOk} targetReason=${targetReasonOk} claims=${claimsOk} placed=${placedOk} placedFields=${placedFieldsOk} refuted=${refutedOk} appendix=${appendixOk} appendixGroup=${appendixGroupOk} appendixSub=${appendixSubOk}`);
}

// ================================================================== Item 5 (T16, finding 14): an asked target named in the SECOND question, not the first
{
  const QTH = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  const QT = { cap: "# CAP-01 · Cap", f1: "## FEAT-001 · Alpha", f2: "## FEAT-002 · Bravo" };
  const ASKQ2_FX = [
    QT.cap, "", "Purpose: capability purpose for the asked-question fixture.", "Outcome: a visible outcome for the asked-question fixture.", "",
    QT.f1, "", "Purpose: alpha feature purpose.", "Status: active", "", ...QTH,
    "| R-001 | WHEN alpha runs, it shall do alpha things. | implemented | `tests/alpha.test.mjs::R-001: alpha` |", "",
    QT.f2, "", "Purpose: bravo feature purpose.", "Status: active", "", ...QTH,
    "| R-002 | WHEN bravo runs, it shall do bravo things. | implemented | `tests/bravo.test.mjs::R-002: bravo` |", "",
  ].join("\n");
  const askDir = join(scratchRoot, `askq2-fx-${++caseN}`);
  mkdirSync(join(askDir, "tests"), { recursive: true });
  writeFileSync(join(askDir, "tests", "alpha.test.mjs"), "// fixture test file\n");
  writeFileSync(join(askDir, "tests", "bravo.test.mjs"), "// fixture test file\n");
  writeFileSync(join(askDir, "REQUIREMENTS.md"), ASKQ2_FX);
  const askMapping = {
    ...buildIdentityMapping(ASKQ2_FX),
    regroup: {
      reasons: [], placed: {}, evidence: {},
      review: {
        drafter: "anthropic", reviewer: "openai",
        verdicts: [
          { id: "R-001", at: "FEAT-001", verdict: "share", targets: [{ to: "FEAT-002", reason: "alpha's rule also binds bravo (asked-q2 share)" }] },
          { id: "R-002", at: "FEAT-002", verdict: "keep", reason: "R-002 stays at Bravo (keep)" },
        ],
        claims: [
          { node: "CAP-01", field: "purpose", text: "capability purpose for the asked-question fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
          { node: "CAP-01", field: "outcome", text: "a visible outcome for the asked-question fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
          { node: "FEAT-001", field: "purpose", text: "alpha feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
          { node: "FEAT-002", field: "purpose", text: "bravo feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
        ],
      },
      refuted: [],
      questions: [
        { ask: "Is the fixture's own wording fine as written (ask one)?", recommendation: "Yes, leave it as written (recommend one).", about: [] },
        { ask: "Should R-001 also serve FEAT-002 (ask two)?", recommendation: "Yes, share it (recommend two).", about: [{ id: "R-001", to: "FEAT-002" }] },
      ],
    },
  };
  mkdirSync(join(askDir, "docs", "regroup"), { recursive: true });
  writeFileSync(join(askDir, "docs", "regroup", "proposal.json"), `${JSON.stringify(askMapping, null, 2)}\n`);
  const askPage = join(scratchRoot, `askq2-page-${++caseN}.md`);
  const askRun = regroup(["--root", askDir, "--proposal", join(askDir, "docs", "regroup", "proposal.json"), "--out", askPage], scratchRoot);
  const askText = (() => { try { return readFileSync(askPage, "utf8"); } catch { return null; } })();
  const askedQ2Ok = askText !== null && /R-001 \(home FEAT-001\) -> FEAT-002 \[share\]: proposed because .*asked-q2 share.* — asked in question 2\b/.test(askText);
  // req: R-1179
  check('R-1179: an asked target named in the SECOND question reads "asked in question 2", not a constant "question 1"',
    askRun.status === 0 && !crashed(askRun) && askedQ2Ok,
    `status=${askRun.status} ` + own(askRun.stderr).slice(0, 2).join(" | "));
}

// ================================================================== T22
{
  const cases = [
    ["FEAT-001's purpose has no claim verdict", variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.node === "FEAT-001" && c.field === "purpose"), 1); }), ["FEAT-001", "has no claim verdict"]],
    ["CAP-02's outcome has no claim verdict", variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.node === "CAP-02" && c.field === "outcome"), 1); }), ["CAP-02", "has no claim verdict"]],
    ["SUB-001's purpose has no claim verdict", variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.node === "SUB-001" && c.field === "purpose"), 1); }), ["SUB-001", "has no claim verdict"]],
    [`line ${L37} -> FEAT-004 reason has no claim verdict`, variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.line === L37 && c.to === "FEAT-004"), 1); }), [String(L37), "has no claim verdict"]],
    ["FEAT-004's purpose has two claim verdicts", variant((q) => { q.regroup.review.claims.push({ ...q.regroup.review.claims[claimAt(q, (c) => c.node === "FEAT-004" && c.field === "purpose")] }); }), ["FEAT-004", "has more than one claim verdict"]],
    ["FEAT-002's purpose claim quotes a stale text", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "FEAT-002" && c.field === "purpose")].text = "Build the dataset (an older wording)."; }), ["FEAT-002", "claim quotes a stale text"]],
    // Item 6: a reason reworded AFTER its claim was recorded — the claim still quotes the old
    // text, so it is a stale-text claim too, not just a node's purpose or outcome.
    [`line ${L22} -> SUB-001's reason is reworded after review; its claim still quotes the old text`, variant((q) => {
      q.regroup.reasons.find((y) => y.line === L22 && y.to === "SUB-001").why += " (reworded after review)";
    }), [String(L22), "claim quotes a stale text"]],
    ["SUB-001's purpose claim has an empty reason", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "SUB-001")].reason = ""; }), ["SUB-001", "claim has an empty reason"]],
    ["CAP-01's purpose claim is neither accept nor reject", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "CAP-01" && c.field === "purpose")].verdict = "maybe"; }), ["CAP-01", "claim verdict is neither accept nor reject"]],
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
    // Item 9 (finding 49): the match keys by field as well as node — CAP-01's purpose and
    // outcome are both rejected, but the question names only the purpose field, so the
    // outcome's rejection must still be named in no question (a node-only match would
    // wrongly see the purpose question as covering the outcome too).
    ["CAP-01's outcome is rejected and named in no question, though a question names CAP-01's purpose field", variant((q) => {
      q.regroup.review.claims[claimAt(q, (y) => y.node === "CAP-01" && y.field === "purpose")].verdict = "reject";
      q.regroup.review.claims[claimAt(q, (y) => y.node === "CAP-01" && y.field === "outcome")].verdict = "reject";
      q.regroup.questions.push({ ask: "Should CAP-01's purpose be reworded (ask field-match)?", recommendation: "Yes (recommend field-match).", about: [{ node: "CAP-01", field: "purpose" }] });
    }), ["CAP-01", "outcome", "named in no question"]],
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

  // Item 3(a) (finding 27, amendment 3): FEAT-001 keeps its EXISTING share of R-002 unchanged
  // (also_applies still names it, no shares_dropped) — amendment 3's own exemption is that a
  // share that stays needs no verdict review of its own. R-002's own verdict, unrelated to the
  // share, is a plain "keep" at its home (Bravo), with no target.
  const keptShare = treeVariant((p) => {
    const f1 = featOf(p, "FEAT-001");
    delete f1.shares_dropped;
    f1.also_applies = ["R-002"];
    p.regroup.refuted = [];
    const v2 = verdictOfT(p, "R-002");
    delete v2.targets;
    v2.verdict = "keep";
    v2.reason = "R-002 stays at Bravo; FEAT-001's existing share of it is unchanged (keep)";
  });
  const keptShareOk = regroupProblems(keptShare, TREE_FX, treeDir).problems.length === 0;
  // req: R-1187
  check("R-1187: a feature that keeps an existing share unchanged (also_applies names it still, no shares_dropped) needs no share verdict for it",
    keptShareOk, `problems=${regroupProblems(keptShare, TREE_FX, treeDir).problems.slice(0, 2).join(" | ")}`);
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
    /R-001 \(home FEAT-001\) -> FEAT-003 \[share\]: proposed because .*merge share.* — carried/.test(mergePage);
  // req: R-1187
  check("R-1187: a feature's merge that carries another feature's share onto also_applies is refused with no share verdict and passes, carried, with one",
    mergeNoOk && mergeYesOk, `no=${mergeNoOk} status=${mergeNoRun.status} ` + own(mergeNoRun.stderr).slice(0, 2).join(" | ") + `; yes=${mergeYesOk} status=${mergeYesRun.status} ` + own(mergeYesRun.stderr).slice(0, 2).join(" | "));

  // Item 3(b) (finding 15): R-001's share verdict targets FEAT-001 (its own home), not FEAT-003
  // (the feature actually absorbing Bravo's carried share) — "with that feature among its
  // targets" is unchecked otherwise, so a verdict naming the wrong feature would let the
  // merged share reach the ledger with no real review of it.
  const mergeWrongTarget = { ...mergeMapping(), regroup: mergeRegroup([
    { id: "R-001", at: "FEAT-001", verdict: "share", targets: [{ to: "FEAT-001", reason: "wrong target: names R-001's own home, not the feature actually absorbing Bravo's share (merge share, wrong target)" }] },
    { id: "R-002", at: "FEAT-003", verdict: "keep", reason: "R-002 moves to Charlie with the merge (keep)" },
    { id: "R-003", at: "FEAT-003", verdict: "keep", reason: "R-003 stays at Charlie (keep)" },
  ]) };
  const mergeWrongPage = join(scratchRoot, `merge-wrong-page-${++caseN}.md`);
  writeFileSync(join(mergeDir, "docs", "regroup", "proposal.json"), `${JSON.stringify(mergeWrongTarget, null, 2)}\n`);
  const mergeWrongRun = regroup(["--root", mergeDir, "--proposal", join(mergeDir, "docs", "regroup", "proposal.json"), "--out", mergeWrongPage], scratchRoot);
  const mergeWrongOk = mergeWrongRun.status === 1 && !crashed(mergeWrongRun) && !existsSync(mergeWrongPage) &&
    saysOwn(mergeWrongRun, "FEAT-003") && saysOwn(mergeWrongRun, "R-001") && saysOwn(mergeWrongRun, "also_applies") && saysOwn(mergeWrongRun, "has no share verdict targeting FEAT-003");
  // req: R-1187
  check("R-1187: a merge's carried share is refused when its row's share verdict targets a feature other than the one actually absorbing it, naming the absorbing feature",
    mergeWrongOk, `status=${mergeWrongRun.status} ` + own(mergeWrongRun.stderr).slice(0, 2).join(" | "));
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
    /R-001 \(home FEAT-001\) -> FEAT-003 \[share\]: proposed because .*demotion share.* — carried/.test(demotePage);
  // req: R-1187
  check("R-1187: a feature's demotion to a subgroup that carries its share onto the absorbing feature's also_applies is refused with no share verdict and passes, carried, with one",
    demoteNoOk && demoteYesOk, `no=${demoteNoOk} status=${demoteNoRun.status} ` + own(demoteNoRun.stderr).slice(0, 2).join(" | ") + `; yes=${demoteYesOk} status=${demoteYesRun.status} ` + own(demoteYesRun.stderr).slice(0, 2).join(" | "));
}

// ================================================================== T24 (seat amendment 4, R-1187: a reused feature ID)
{
  // A tree-form ledger: CAP-01 holds Alpha (R-001), Bravo (R-002, already sharing Alpha's
  // R-001) and Charlie (R-003). The proposal reuses FEAT-002 and FEAT-003's IDs for the OTHER
  // old heading each: the output FEAT-002 continues Charlie (not Bravo) and the output FEAT-003
  // continues Bravo (not Charlie). Output FEAT-002 declares R-001 -- the row the id "FEAT-002"
  // happened to hold already, through a heading FEAT-002 no longer continues -- as a newly
  // added share. Amendment 3's ID-only exemption would wave this through with no share verdict;
  // amendment 4 requires FEAT-002's own (or its subgroups') `from` to actually name FEAT-002's
  // old heading, which it does not (its `from` names Charlie's).
  const RTH = ["| ID | Requirement | Status | Evidence |", "|---|---|---|---|"];
  const RT = { cap: "# CAP-01 · Cap", f1: "## FEAT-001 · Alpha", f2: "## FEAT-002 · Bravo", f3: "## FEAT-003 · Charlie" };
  const REUSE_FX = [
    RT.cap, "", "Purpose: capability purpose for the reused-ID fixture.", "Outcome: a visible outcome for the reused-ID fixture.", "",
    RT.f1, "", "Purpose: alpha feature purpose.", "Status: active", "", ...RTH,
    "| R-001 | WHEN alpha runs, it shall do alpha things. | implemented | `tests/alpha.test.mjs::R-001: alpha` |", "",
    RT.f2, "", "Purpose: bravo feature purpose.", "Status: active", "Also applies: R-001", "", ...RTH,
    "| R-002 | WHEN bravo runs, it shall do bravo things. | implemented | `tests/bravo.test.mjs::R-002: bravo` |", "",
    RT.f3, "", "Purpose: charlie feature purpose.", "Status: active", "", ...RTH,
    "| R-003 | WHEN charlie runs, it shall do charlie things. | implemented | `tests/charlie.test.mjs::R-003: charlie` |", "",
  ].join("\n");
  const reuseDir = join(scratchRoot, "t24-reuse-fx");
  mkdirSync(join(reuseDir, "tests"), { recursive: true });
  for (const n of ["alpha", "bravo", "charlie"]) writeFileSync(join(reuseDir, "tests", `${n}.test.mjs`), "// fixture test file\n");
  const rf = (h) => ({ line: lineOf(REUSE_FX, h), heading: h });
  const bravoLine = lineOf(REUSE_FX, RT.f2), charlieLine = lineOf(REUSE_FX, RT.f3);
  /** FEAT-002 and FEAT-003 swap which old heading they continue: FEAT-002 now continues
   * Charlie (owns R-003) and declares R-001 -- Bravo's own already-held share -- as newly
   * added; FEAT-003 continues Bravo (owns R-002) and declares no share of its own at all. */
  function reuseFxProposal(verdicts) {
    return {
      tree: [{ id: "CAP-01", label: "Cap", purpose: "Capability purpose for the reused-ID fixture.", outcome: "A visible outcome for the reused-ID fixture.", from: [rf(RT.cap)], features: [
        { id: "FEAT-001", label: "Alpha", purpose: "Alpha feature purpose.", status: "active", from: [rf(RT.f1)], rows: ["R-001"], subgroups: [] },
        { id: "FEAT-002", label: "Charlie, reusing FEAT-002", purpose: "Charlie feature purpose, now under the reused id FEAT-002.", status: "active", also_applies: ["R-001"], shares_added: ["R-001"], from: [rf(RT.f3)], rows: ["R-003"], subgroups: [] },
        { id: "FEAT-003", label: "Bravo, reusing FEAT-003", purpose: "Bravo feature purpose, now under the reused id FEAT-003.", status: "active", from: [rf(RT.f2)], rows: ["R-002"], subgroups: [] },
      ] }],
      regroup: {
        reasons: [
          { line: bravoLine, to: "FEAT-003", why: "Bravo's heading continues under the reused id FEAT-003 (reuse reason)" },
          { line: charlieLine, to: "FEAT-002", why: "Charlie's heading continues under the reused id FEAT-002 (reuse reason)" },
        ],
        placed: {},
        evidence: {},
        review: {
          drafter: "anthropic", reviewer: "openai", verdicts,
          claims: [
            { node: "CAP-01", field: "purpose", text: "Capability purpose for the reused-ID fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
            { node: "CAP-01", field: "outcome", text: "A visible outcome for the reused-ID fixture.", verdict: "accept", reason: "the claim matches the fixture's capability" },
            { node: "FEAT-001", field: "purpose", text: "Alpha feature purpose.", verdict: "accept", reason: "the claim matches the fixture's feature" },
            { node: "FEAT-002", field: "purpose", text: "Charlie feature purpose, now under the reused id FEAT-002.", verdict: "accept", reason: "the claim matches the fixture's feature" },
            { node: "FEAT-003", field: "purpose", text: "Bravo feature purpose, now under the reused id FEAT-003.", verdict: "accept", reason: "the claim matches the fixture's feature" },
            { line: bravoLine, to: "FEAT-003", text: "Bravo's heading continues under the reused id FEAT-003 (reuse reason)", verdict: "accept", reason: "the claim matches the fixture's reason" },
            { line: charlieLine, to: "FEAT-002", text: "Charlie's heading continues under the reused id FEAT-002 (reuse reason)", verdict: "accept", reason: "the claim matches the fixture's reason" },
          ],
        },
        refuted: [],
        questions: [],
      },
    };
  }
  const reuseHonest = reuseFxProposal([
    { id: "R-001", at: "FEAT-001", verdict: "share", targets: [{ to: "FEAT-002", reason: "FEAT-002 (now Charlie) adds R-001, the share the old FEAT-002 (Bravo) already held, now reviewed" }] },
    { id: "R-002", at: "FEAT-003", verdict: "keep", reason: "R-002 stays with Bravo's content, now under the reused id FEAT-003 (keep)" },
    { id: "R-003", at: "FEAT-002", verdict: "keep", reason: "R-003 stays with Charlie's content, now under the reused id FEAT-002 (keep)" },
  ]);
  const reuseNoVerdict = reuseFxProposal([
    { id: "R-001", at: "FEAT-001", verdict: "keep", reason: "R-001 stays at Alpha (keep)" },
    { id: "R-002", at: "FEAT-003", verdict: "keep", reason: "R-002 stays with Bravo's content, now under the reused id FEAT-003 (keep)" },
    { id: "R-003", at: "FEAT-002", verdict: "keep", reason: "R-003 stays with Charlie's content, now under the reused id FEAT-002 (keep)" },
  ]);
  const reuseHonestProblems = regroupProblems(reuseHonest, REUSE_FX, reuseDir).problems;
  const reuseHonestOk = reuseHonestProblems.length === 0;
  const reuseRefused = regroupProblems(reuseNoVerdict, REUSE_FX, reuseDir).problems;
  const reuseRefusedOk = reuseRefused.some((p) => p.includes("FEAT-002") && p.includes("R-001"));
  // req: R-1187
  check("R-1187: a feature that reuses an old feature's ID but continues a different old heading needs its own share verdict for a share that old feature already held; refused without one, passing with one",
    reuseHonestOk && reuseRefusedOk,
    `honest=${reuseHonestOk} problems=${reuseHonestProblems.slice(0, 2).join(" | ")}; refused=${reuseRefused.slice(0, 2).join(" | ")}`);
}

// ================================================================== Item 9: smaller refusals, each with a case
{
  // (b) A refuted entry, or a question "about" entry with an id, naming no move or share
  // target of its row is refused (finding 41: a stray entry shown on the page).
  const strayRefuted = variant((q) => { q.regroup.refuted.push({ id: "R-009", to: "FEAT-001", reason: "stray: R-009 names no such target" }); });
  const strayRefutedOk = refusedCase(strayRefuted, ["R-009", "FEAT-001", "names no move or share target"]);
  const strayAbout = variant((q) => { q.regroup.questions[0].about.push({ id: "R-009", to: "FEAT-001" }); });
  const strayAboutOk = refusedCase(strayAbout, ["R-009", "FEAT-001", "names no move or share target"]);
  // req: R-1175
  check("R-1175: a refuted entry or a question about entry naming no move or share target of its row is refused", strayRefutedOk && strayAboutOk,
    `refuted=${strayRefutedOk} about=${strayAboutOk}`);
}
{
  // (c) A claim verdict matching no required purpose, outcome or reason is refused (finding 42).
  const strayClaim = variant((q) => { q.regroup.review.claims.push({ node: "FEAT-999", field: "purpose", text: "x", verdict: "accept", reason: "a stray claim for a node outside this proposal" }); });
  const ok = refusedCase(strayClaim, ["FEAT-999", "matches no required purpose, outcome or reason"]);
  // req: R-1184
  check("R-1184: a claim verdict matching no required purpose, outcome or reason is refused", ok);
}
{
  // (d) A keep verdict carrying targets is refused (finding 43).
  const keepWithTargets = variant((q) => { const v = verdictOf(q, "R-009"); v.targets = [{ to: "FEAT-001", reason: "stray target on a keep verdict" }]; });
  const ok = refusedCase(keepWithTargets, ["R-009", "carries a target, but a keep names no other placement"]);
  // req: R-1175
  check("R-1175: a keep verdict carrying targets is refused", ok);
}
{
  // (e) A question without "ask" is refused (finding 23).
  const noAsk = variant((q) => { delete q.regroup.questions[0].ask; });
  const ok = refusedCase(noAsk, ["question has no ask"]);
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
  // Item 10 (finding 29): an active feature with no rows is a gap too, and the page shows its
  // evidence the same way a proposed gap's is shown — not only for status "proposed".
  const activeGap = variant((q) => {
    q.tree[1].features.push({ id: "FEAT-009", label: "Index analyst pages", purpose: "Index the rendered analyst pages for search; no row holds it yet.", status: "active", from: [], rows: [], subgroups: [] });
    q.regroup.review.claims.push({ node: "FEAT-009", field: "purpose", text: "Index the rendered analyst pages for search; no row holds it yet.", verdict: "accept", reason: "the claim matches the fixture's feature (claim FEAT-009)" });
    q.regroup.evidence["FEAT-009"] = ["src/report/render.mjs"];
  });
  const run = runFx("active-gap-evidence-page", activeGap);
  const page = run.text ?? "";
  const posNodes = page.indexOf("## Capabilities, features and subgroups");
  const posFeat009 = posNodes >= 0 ? page.indexOf("FEAT-009", posNodes) : -1;
  const evidenceBlock = posFeat009 >= 0 ? page.slice(posFeat009, posFeat009 + 400) : "";
  const ok = run.r.status === 0 && !crashed(run.r) && evidenceBlock.includes("Evidence:") && (evidenceBlock.includes("src/report/render.mjs"));
  // req: R-1178
  check("R-1178: an active feature with no rows (a gap) shows its evidence on the page, the same way a proposed one's is shown", ok,
    `status=${run.r.status} ` + own(run.r.stderr).slice(0, 2).join(" | ") + ` evidenceBlock=${evidenceBlock.slice(0, 120)}`);
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
  // Item 10 (finding 4): the real, existing path may follow the "·" join too, a title before
  // it, not only lead it.
  const dotJoinReversed = !isTextPlaced(dir, { id: "R-904", evidence: "a quoted section title · src/report/render.mjs" });
  // req: R-1176
  check("R-1176: an evidence citation's path is read before the first space, less a trailing :<line> or :<line>-<line>, so a locator does not make the row text-placed",
    space && lineRange && singleLine && dotJoin && dotJoinReversed, `space=${space} lineRange=${lineRange} singleLine=${singleLine} dotJoin=${dotJoin} dotJoinReversed=${dotJoinReversed}`);
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
