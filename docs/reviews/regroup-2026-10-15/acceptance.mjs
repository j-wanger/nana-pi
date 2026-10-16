// Seat acceptance for lane regroup (frozen; written by the seat 2026-10-15 before the build, from CHANGE.md §5 "Seat
// acceptance", the observable clauses of §2's rows R-1170 to R-1180 and R-1184, §3's design, §3.6 and §4's scope, plan
// frozen at 1066464). Run from anywhere inside the checkout under test; the build is read from the cwd's git root, the
// spec (CHANGE.md, seat-titles.mjs) from this script's own folder:
//   node docs/reviews/regroup-2026-10-15/acceptance.mjs
// Before the land only: after it, `git merge-base main HEAD` is the tip itself and every build case reads red.
// The real ledgers are read ONLY from the seat's copies (LIFT_LEDGERS, default ~/.cache/nana-lift-ledgers, outside every
// repo; never a project), each pinned by its SHA-256 below, and copied again into this run's scratch folder before any run.
// A missing or changed copy reds its harness case by name and skips (x) and (y).
// (a) seat-titles 1 prints `seat-titles 1: 0 missing`.
// (l) R-1170, the lift's line-keyed report, on a fixture built here: a flat ledger whose two sections share the heading
//     text "## 2. Build at production size". A mapping's dry run prints exactly one `line N: <heading> -> <node>` line
//     per heading a node names and one `line N: <heading> -> <node> (rows …)` line per old line and new home, the two
//     same-text headings apart (§3.2's format); on the lifted fixture the identity prints none, a merge prints its
//     heading line and a row move its line with its rows; the default dry run prints none.
// (r) the regroup command (R-1171 to R-1177, R-1184) on the same fixture and one honest proposal (§3.3's form: a lift
//     mapping plus one `regroup` object with reasons, placed, evidence, review verdicts and claims, refuted and
//     questions). The proposal passes the lift's dry run at the base (harness). The command writes its page only when
//     every check passes; each refusal is one change to that proposal, exits 1, names its problem, writes no page and
//     changes no file under the root; a failing run removes an earlier page and leaves any other file at --out; --out
//     resolving to the ledger, the proposal, an evidence path or the lift (a mirror of the checkout's scripts in the
//     scratch, so a wrong build can never write into the checkout), directly or through a symlink, is refused; the 18
//     object levels' misspelled keys are each named by path; usage exits 2; more problems than the cap print the cap
//     and the count of the rest. The fixture's G-004 sits in the seed's SUB-901, so exempting SUB-900 alone from R-1172
//     and R-1184 fails the honest proposal; a pin only the lift refuses must still remove an earlier page.
// (p) the page (R-1178, R-1179): opens with PAGE_HEAD, both hashes, the proof line, the lineages and both verdict
//     counts; then the numbered questions with recommendations; one feature table with row counts and status mix;
//     every node with its purpose, each capability's outcome and the gap's evidence; each reported line with its reason
//     and moved rows; each move and share target with its own reason and outcome; each rejected claim with its reason;
//     each text-placed row with its ID, opening GIST_WORDS words, home and reason; then the appendix, the only place a
//     row's full text appears, each row under its new node. A same-family record reads "same-family review".
// (x) aml-desk's copy straight from flat, with a mechanical proposal (every heading kept, §36's "Scale lane" rows moved
//     to the "### Lane A — normalize" subgroup under the second "## 36b.", purposes rewritten, every reason, verdict, claim and placed reason present): the
//     dry run prints lines 484 and 570 apart, the check exits 0 and the page gives each its reason; (guard) after
//     --write in a scratch git copy, §36's lane notes sit once each, in order, above one table under the node naming
//     line 501 (residual 3).
// (y) basketball-geek's HEAD copy end to end: a mechanical proposal with a merge and a move; the check exits 0; (guard)
//     in a scratch git copy, --write, commit, `--verify <base> --mapping <proposal>` exits 0 and plain `--verify <base>`
//     refuses (FR 43, the reason the skill names the full form).
// (s) the requirements skill's description says "regroup"; one paragraph holds the regroup command and §3.5's phrases,
//     what the agent reads (J1's recommendation), and shows no flag the regroup's source lacks inside its span and no
//     lift flag the lift lacks outside it; the old "name no regroup command" clause is gone; T29's phrases stay.
// (e) rows R-1170 to R-1180 and R-1184 carry §2's text with one `shall`, sit where §2 says, cite their §5 titles (read
//     from seat-titles.mjs, the one title list) and read implemented; R-1181 to R-1183 are unused; R-291 keeps its base
//     citations (it cites no leaf-total title at the base, and §5 asks none); no base row changes; the row set is the
//     base's plus these twelve; the tree headings are the base's.
// (f) `git diff --name-only <base>..HEAD` ⊆ §4 In plus this review folder; nothing in §3.6; the lift differs from the
//     base only inside detectMoves and the plan loop's print; detectMoves is exported and returns §3.2's records; the
//     new module's header, purpose sentence, tunables and imports (§3.4); README names the script on its own line;
//     HANDOFF carries residual 8's Windows line; map/readme/tree/trace checks; the build is committed.
// (g) the four test files exit 0 and print PASS once for every §5 title.
// Not checks, so left out: the blind rehearsal on 5b68a91 (a pi worker drafting and reviewing; scored against Jake's
// tree), every agent role's drafting and review on the real projects, each run's wall clock, billed tokens, packet
// words and owner minutes against §7 J2's budget, and §6's per-project cost: all are seat activities the seat records.
// A share CARRIED in a feature's `also_applies` cannot pass the lift until lane regroup-shares lands (residual 2), so
// only T8's direct call can pin that outcome; here the mixed share is asked for one target and refuted for the other.
// The same-family declaration's key is not fixed by the plan (R-1175, §3.3's sample has none): the case takes it from
// the build's PROPOSAL_KEYS (a review-level key other than drafter, reviewer, verdicts and claims) with the value
// "same-family" or true, and reds naming that gap when none is found.
// "Names a path" (R-1176) is read as the rail's evidence form: each backtick span's text before `::`, or a whole span
// without spaces; aml-desk's R-183 names `test/requirements-trace.test.mjs` and only mentions REQUIREMENTS.md in its
// title, so it is text-placed here.
// <base> is `git merge-base main HEAD` (e451c90 when written), so a merge of a newer main moves it with the lane.
// Cases marked (guard) hold at the base too and catch a regression; (harness) cases check this script's inputs; every
// other case depends on the build and reads red at the base. Every copy, repo and fixture lives in one scratch folder
// under the OS temp dir, removed at the end; nothing is written inside the checkout (the last case checks git status)
// or inside any project. No suite test may import or run this file. Not run here: the full `npm run test:locked` (the
// land checklist's), and the Windows CI leg.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LANE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SEAT_TITLES = path.join(LANE_DIR, "seat-titles.mjs");
const { required, repoRoot, checkTitles, LANE_ROWS_ADDED, LT, RG, TR, RT } = await import(pathToFileURL(SEAT_TITLES).href);
const root = repoRoot();
if (!fs.existsSync(path.join(LANE_DIR, "CHANGE.md")) || !fs.existsSync(path.join(root, "scripts/requirements-tree.mjs"))) {
	console.error("run inside a nana-pi checkout: node <lane>/docs/reviews/regroup-2026-10-15/acceptance.mjs");
	process.exit(2);
}
const LEDGERS = process.env.LIFT_LEDGERS ?? path.join(os.homedir(), ".cache", "nana-lift-ledgers");
// Measured 2026-10-14 by the lift's seat (docs/reviews/lift-2026-10-14/acceptance.mjs LEDGER_SHA256), equal on the copies.
const LEDGER_SHA256 = {
	"aml-desk": "63af2a19f0499aac58e770e2e1fdb68cc71856c1d8e5446926013804b26a5e86",
	"basketball-geek-HEAD": "775f126a3848f62b382029534a99e80da46e0455092ab4046361721286f83683",
};
let bad = 0, n = 0, badBuild = 0, nBuild = 0;
const out = (title, got, want, detail = "") => {
	n++;
	const ok = JSON.stringify(got) === JSON.stringify(want);
	const isBuild = !/^\((harness|guard)\)/.test(title);
	if (isBuild) nBuild++;
	if (!ok) { bad++; if (isBuild) badBuild++; }
	console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${JSON.stringify(got).slice(0, 300)} (want ${JSON.stringify(want).slice(0, 300)})${detail ? ` [${String(detail).replace(/\s+/g, " ").slice(0, 400)}]` : ""}`}`);
	return ok;
};
const text = (rel) => { try { return fs.readFileSync(path.join(root, rel), "utf8"); } catch { return null; } };
const spec = (name) => fs.readFileSync(path.join(LANE_DIR, name), "utf8");
const lines = (s) => (s ?? "").replace(/\r/g, "").split("\n").filter((l, i, all) => !(l === "" && i === all.length - 1));
const collapse = (s) => (s ?? "").replace(/\s+/g, " ");
const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^GIT_/.test(k)) delete env[k]; return env; };
const git = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
const gitIn = (cwd, ...args) => spawnSync("git", ["-c", "user.name=seat", "-c", "user.email=seat@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args], { cwd, encoding: "utf8", env: cleanEnv() });
const statusOf = () => git("status", "--porcelain=v1", "-uall").stdout;
const statusBefore = statusOf();
const base = git("merge-base", "main", "HEAD").stdout.trim();
const atBase = (rel) => { const r = git("show", `${base}:${rel}`); return r.status === 0 ? r.stdout : null; };
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const readBuf = (p) => { try { return fs.readFileSync(p); } catch { return null; } };
const readText = (p) => { try { return fs.readFileSync(p, "utf8"); } catch { return null; } };
const isLink = (p) => { try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; } };

const LIFT_SCRIPT = "scripts/requirements-lift.mjs";
const REGROUP_SCRIPT = "scripts/requirements-regroup.mjs";
const RT_SCRIPT = "scripts/requirements-tree.mjs";
const PROOF_SCRIPT = "scripts/requirements-lift-proof.mjs";
const LIFT = path.join(root, LIFT_SCRIPT);
const REGROUP = path.join(root, REGROUP_SCRIPT);
const TREE = path.join(root, RT_SCRIPT);
const REGROUP_SKILL_CMD = 'node "$HOME/nana-pi/scripts/requirements-regroup.mjs" --root . --proposal <file> --out <page>'; // R-1180, §3.4
const LIFT_SKILL_CMD = 'node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root .'; // R-1169 (T29 stays)
const REGROUP_PURPOSE = "Check a regroup proposal against the lift and the regroup rules and write the packet its owner reviews."; // §3.4
const ROW = /^\|\s*([RG]-(?:[0-9]{3}|[1-9][0-9]{3}))\s*\|/;
const TREE_HEADING = /^(#{1,3}) (CAP-\d{2}|FEAT-\d{3}|SUB-\d{3}) · (.+)$/;
const NODE_ID = /\b(CAP-\d{2}|FEAT-\d{3}|SUB-\d{3})\b/g;
const TABLE_HEADER = "| ID | Requirement | Status | Evidence |";
const DELIM = /^\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*$/;
const PROOF = /^lift proof: (\d+) rows kept byte-identical; (\d+) prose lines carried; (\d+) headings replaced; (\d+) lines inserted; tree check 0 problems$/;
// §3.2's format: `line 484: ## 36b. Build at production size -> FEAT-012` and `… -> FEAT-020 (rows R-201, R-207)`.
const REPORT = /^line (\d+): (.*) -> ((?:CAP|FEAT|SUB)-\d+)(?: \(rows? ([^)]*)\))?$/;
const UNSORTED = "Not yet sorted:"; // the lift's UNSORTED_PREFIX (contract, R-1165)
const PIN_MISMATCH = "pin does not match this ledger"; // the lift's pin refusal, which the regroup command does not repeat (R-1171)
const RESERVED = new Set(["CAP-90", "FEAT-900", "SUB-900", "SUB-901", "SUB-902", "SUB-903", "SUB-904"]);
const STATUSES = ["implemented", "planned", "untested", "violated", "retired"];
// Node's own warning block (MODULE_TYPELESS_PACKAGE_JSON on the .ts import through the trace shim).
const NODE_WARNING = [/^\(node:\d+\) /, /^Reparsing as ES module because/, /^To eliminate this warning, add "type": "module"/, /^\(Use `node --trace-warnings/];
const own = (stderr) => lines(stderr).filter((l) => !NODE_WARNING.some((re) => re.test(l)));
const node = (args, cwd = root, extra = {}) => spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 300_000, env: cleanEnv(), ...extra });
const lift = (args, cwd) => node([LIFT, ...args], cwd);
const regroup = (args, cwd, script = REGROUP) => node([script, ...args], cwd);
/** A refusal must be the command's own named one, never Node's crash (a missing module, an uncaught throw and its stack). */
const crashed = (r) => /Cannot find module|\bERR_[A-Z_]+|^\s+at .+:\d+:\d+\)?$/m.test(r?.stderr ?? "") || r?.status === null;
const said = (r) => [...own(r?.stderr), ...lines(r?.stdout)].join("\n");
const mentions = (r, x) => (x instanceof RegExp ? x.test(said(r)) : said(r).includes(x));
const word = (n) => new RegExp(`(?<![\\w-])${n}(?![\\w-])`);
const proofLineOf = (stdout) => { const ps = lines(stdout).filter((l) => PROOF.test(l)); return ps.length === 1 ? ps[0] : null; };

// ---------------------------------------------------------------- independent readers (never the build's code)
const bomless = (buf) => { const t = Buffer.isBuffer(buf) ? buf.toString("utf8") : (buf ?? ""); return t.startsWith("﻿") ? t.slice(1) : t; };
const segs = (buf) => { const t = bomless(buf); return t === "" ? [] : t.split(/(?<=\n)/); };
const bare = (seg) => seg.replace(/\r?\n$/, "");
const lfOf = (buf) => bomless(buf).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
function fenceMask(ls) {
	const mask = Array(ls.length).fill(false);
	let fence = null;
	ls.forEach((l, i) => {
		const f = /^ {0,3}(`{3,}|~{3,})/.exec(l);
		if (fence) { mask[i] = true; if (f && f[1][0] === fence[0] && f[1].length >= fence.length && /^ {0,3}(`{3,}|~{3,})[ \t]*$/.test(l)) fence = null; return; }
		if (f) { mask[i] = true; fence = f[1]; }
	});
	return mask;
}
const cellsOf = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((s) => s.trim());
/** Every row of a ledger: id, line, requirement text, status and evidence cell. */
function ledgerRows(buf) {
	const ls = segs(buf).map(bare);
	const fenced = fenceMask(ls);
	return ls.flatMap((l, i) => { if (fenced[i]) return []; const r = ROW.exec(l); if (!r) return []; const c = cellsOf(l); return [{ id: r[1], line: i + 1, text: c[1] ?? "", status: c[2] ?? "", evidence: c[3] ?? "" }]; });
}
/** The paths an Evidence cell names, read as the rail's form: each backtick span before `::`, or a whole span without spaces. */
const evidencePaths = (cell) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]).flatMap((s) => (s.includes("::") ? [s.split("::")[0]] : /\s/.test(s) ? [] : [s])).map((p) => p.replace(/\\/g, "/")).filter(Boolean);
const under = (dir, p) => { const abs = path.resolve(dir, p); const rel = path.relative(dir, abs); return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel) ? abs : null; };
/** R-1176's text-placed rows: those whose Evidence cell names no path that exists under <dir>. */
const textPlaced = (buf, dir) => ledgerRows(buf).filter((r) => !evidencePaths(r.evidence).some((p) => { const abs = under(dir, p); return abs !== null && fs.existsSync(abs); })).map((r) => r.id);
const pad = (v, w) => String(v).padStart(w, "0");
const expandIds = (list) => (list ?? []).flatMap((item) => {
	const r = /^([RG])-(\d+)–([RG])-(\d+)$/.exec(String(item));
	if (!r) return [String(item)];
	const acc = []; for (let v = +r[2]; v <= +r[4]; v++) acc.push(`${r[1]}-${pad(v, r[2].length === 4 || v >= 1000 ? 4 : 3)}`);
	return acc;
});
/** Mapping nodes in output order: { id, level, parent, node }. */
const mappingNodes = (m) => (m?.tree ?? []).flatMap((c) => [{ id: c.id, level: 1, parent: null, node: c }, ...(c.features ?? []).flatMap((f) => [{ id: f.id, level: 2, parent: c.id, node: f }, ...(f.subgroups ?? []).map((s) => ({ id: s.id, level: 3, parent: f.id, node: s }))])]);
const homes = (m) => { const h = new Map(); for (const x of mappingNodes(m)) for (const r of expandIds(x.node.rows)) h.set(r, x.id); return h; };
/**
 * R-1170's report, derived from the row's words alone: one heading record per `from` a node names whose own tree ID,
 * if any, differs from that node's; one move record per old line and new home for the rows physically under that line
 * (up to the next heading) whose home is not the node naming it.
 */
function reportedLines(buf, mapping) {
	const ls = segs(buf).map(bare);
	const fenced = fenceMask(ls);
	const headLines = ls.map((l, i) => (!fenced[i] && /^ {0,3}#{1,6}(?:[ \t]|$)/.test(l) ? i + 1 : 0)).filter(Boolean);
	const home = homes(mapping);
	const recs = [];
	for (const x of mappingNodes(mapping)) for (const f of x.node.from ?? []) {
		const ownId = TREE_HEADING.exec(ls[f.line - 1] ?? "")?.[2] ?? null;
		if (ownId !== x.id) recs.push({ line: f.line, heading: f.heading, to: x.id, rows: [] });
		const next = headLines.find((h) => h > f.line) ?? ls.length + 1;
		const moved = new Map();
		for (let i = f.line; i < next - 1; i++) { if (fenced[i]) continue; const r = ROW.exec(ls[i]); if (!r) continue; const h = home.get(r[1]); if (h && h !== x.id) moved.set(h, [...(moved.get(h) ?? []), r[1]]); }
		for (const [to, rows] of moved) recs.push({ line: f.line, heading: f.heading, to, rows });
	}
	return recs;
}
const keyOf = (r) => `${r.line}|${r.heading}|${r.to}|${[...(r.rows ?? [])].sort().join(",")}`;
const keys = (recs) => recs.map(keyOf).sort();
/** The dry run's `->` lines read in §3.2's form; any `->` line outside it is listed as odd. */
const reportOf = (stdout) => {
	const recs = [], odd = [];
	for (const l of lines(stdout)) {
		if (!/->|→/.test(l)) continue;
		const m = REPORT.exec(l);
		if (!m) { odd.push(l); continue; }
		recs.push({ line: +m[1], heading: m[2], to: m[3], rows: m[4] ? m[4].split(/[,\s]+/).filter(Boolean) : [] });
	}
	return { recs, odd };
};
const fileList = (dir) => { const acc = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.name === ".git") continue; if (e.isDirectory()) walk(p); else acc.push(`${path.relative(dir, p)} ${e.isSymbolicLink() ? "link" : sha(fs.readFileSync(p)).slice(0, 12)}`); } }; walk(dir); return acc.sort(); };
const NATO = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliett", "kilo", "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango", "uniform", "victor", "whiskey", "xray", "yankee", "zulu"];
/** A digit-free tag for the k-th item (aa, ab, …), so no reason text holds a line number or an ID. */
const tag = (k) => `${NATO[Math.floor(k / NATO.length) % NATO.length]} ${NATO[k % NATO.length]}`;

// ---------------------------------------------------------------- the fixture (built here; never a real project's)
const H = {
	partA: "# Part A. Ingest", load: "## 1. Load files", build: "## 2. Build at production size", sizing: "### 2a. Sizing",
	partB: "# Part B. Report", render: "## 3. Render", partG: "# Part G. General engineering requirements", g1: "## G1. Configuration", g2: "## G2. Module boundaries",
	oq: "## Open questions", dom: "## Deliberate omissions",
};
const TH = [TABLE_HEADER, "|---|---|---|---|"];
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
	// G-004 sits in the seed's SUB-901, so the reserved set must be R-1172's SUB-900 to SUB-904, not SUB-900 alone.
	H.g2, "", ...TH,
	"| G-004 | The fixture's third general row shall hold for every module boundary the fixture's code map draws between two layers. | untested | — |",
	"",
	H.oq, "", "1. An open question.", "",
	H.dom, "", "1. A deliberate omission.", "",
].join("\n");
const FX_FILES = { "tests/load.test.mjs": "// fixture test file\n", "tests/build.test.mjs": "// fixture test file\n", "tests/render.test.mjs": "// fixture test file\n", "src/report/render.mjs": "export {};\n", "README.md": "# fixture\n" };
const lineOf = (txt, heading, nth = 1) => { let k = 0; const ls = txt.split("\n"); for (let i = 0; i < ls.length; i++) if (ls[i] === heading && ++k === nth) return i + 1; return -1; };
const L15 = lineOf(FX, H.build, 1), L30 = lineOf(FX, H.build, 2);
const FXROWS = ledgerRows(FX);
const FXTEXT = new Map(FXROWS.map((r) => [r.id, r.text]));
// Texts the page must carry, each unique and free of digits and IDs.
const T = {
	cap01: "Load the analyst's source files into staging and build the dataset the desk reads.",
	cap01o: "Every source file the analyst drops is staged whole, refused by name or logged.",
	f1: "Read each arriving file into staging, refusing unknown columns by name and logging each refusal.",
	f2: "Build the full dataset in one run, inside the time budget the build notes declare.",
	s1: "Print the staging table sizes after each full build.",
	cap02: "Render the analyst pages from the full dataset and publish only what the floor allows.",
	cap02o: "Each analyst page is one escaped HTML file built from unsampled tables.",
	f4: "Write each analyst page as one escaped HTML file and hold back pages under the floor.",
	f5: "Export the rendered analyst pages for the case file; no row holds it yet.",
	targetA: "the import log is read when the pages render (target alpha)",
	targetB: "the build budget also bounds file loading (target bravo)",
	targetC: "the renderer reads inside the same budget (target charlie)",
	refuteA: "the log is written at load time, so it stays with loading (refute alpha)",
	refuteB: "rendering keeps its own budget (refute bravo)",
	ask1: "Should the build budget row also bind file loading (ask alpha)?",
	rec1: "Yes, share it with loading once shares can be carried (recommend alpha).",
	ask2: "The floor row's move to rendering stands but its reason was rejected; keep the move (ask bravo)?",
	rec2: "Keep the move and reword the reason (recommend bravo).",
	reject: "the move stands but this reason names the wrong reader (reject zulu)",
};
const FX_HOME = { "R-001": "FEAT-001", "R-002": "FEAT-001", "R-003": "FEAT-001", "R-004": "FEAT-002", "R-005": "FEAT-002", "R-006": "SUB-001", "R-007": "FEAT-002", "R-008": "FEAT-004", "R-009": "FEAT-004", "R-010": "FEAT-004", "G-001": "SUB-900", "G-002": "SUB-900", "G-004": "SUB-901" };
const FX_PLACED = ["R-003", "R-005", "R-006", "R-008", "G-001", "G-002", "G-004"]; // no path under the root: "—", or tests/missing.test.mjs
const whyOf = (k) => `the rows under this old line serve the node they now sit in (why ${tag(k)})`;
const keepOf = (k) => `the row serves its home directly (keep ${tag(k)})`;
const placedOf = (k) => `placed by its text alone, which names this node's work (placed ${tag(k)})`;
const claimOf = (k) => `the claim matches the rows it describes (claim ${tag(k)})`;
/** Claims for every purpose and capability outcome outside the reserved nodes and every reason, in that order, all accepted. */
function claimsFor(p) {
	const cl = [];
	for (const x of mappingNodes(p)) {
		if (RESERVED.has(x.id)) continue;
		cl.push({ node: x.id, field: "purpose", text: x.node.purpose, verdict: "accept", reason: "" });
		if (x.level === 1) cl.push({ node: x.id, field: "outcome", text: x.node.outcome, verdict: "accept", reason: "" });
	}
	for (const r of p.regroup.reasons) cl.push({ line: r.line, to: r.to, text: r.why, verdict: "accept", reason: "" });
	cl.forEach((c, k) => { c.reason = claimOf(k); });
	return cl;
}
/** Rewrites each claim's quoted text to the claim's current text (after a variant edits a purpose, outcome or reason). */
function syncClaims(p) {
	for (const c of p.regroup.review.claims) {
		if (c.node) { const x = mappingNodes(p).find((y) => y.id === c.node); if (x) c.text = x.node[c.field]; }
		else { const r = p.regroup.reasons.find((y) => y.line === c.line && y.to === c.to); if (r) c.text = r.why; }
	}
	return p;
}
/** The honest proposal (§3.3): FEAT-003 folds into FEAT-002, R-008 moves to FEAT-004, FEAT-005 is a gap with evidence. */
function fxProposal() {
	const f = (h, nth = 1) => ({ line: lineOf(FX, h, nth), heading: h });
	const p = {
		lift: 1,
		pin: { sha256: sha(lfOf(FX)), rows: FXROWS.length },
		head: { through: lineOf(FX, H.partA) - 1 },
		tree: [
			{ id: "CAP-01", label: "Ingest", purpose: T.cap01, outcome: T.cap01o, from: [f(H.partA)], features: [
				{ id: "FEAT-001", label: "Load source files", purpose: T.f1, status: "active", from: [f(H.load)], rows: ["R-001", "R-002", "R-003"], subgroups: [] },
				{ id: "FEAT-002", label: "Build at production size", purpose: T.f2, status: "active", from: [f(H.build, 1), f(H.build, 2)], rows: ["R-004", "R-005", "R-007"], subgroups: [
					{ id: "SUB-001", label: "Sizing", purpose: T.s1, from: [f(H.sizing)], rows: ["R-006"] }] }] },
			{ id: "CAP-02", label: "Report", purpose: T.cap02, outcome: T.cap02o, from: [f(H.partB)], features: [
				{ id: "FEAT-004", label: "Render analyst pages", purpose: T.f4, status: "active", from: [f(H.render)], rows: ["R-009", "R-010", "R-008"], subgroups: [] },
				{ id: "FEAT-005", label: "Export analyst pages", purpose: T.f5, status: "proposed", from: [], rows: [], subgroups: [] }] },
			{ id: "CAP-90", from: [], features: [{ id: "FEAT-900", from: [f(H.partG)], rows: [], subgroups: [{ id: "SUB-900", from: [f(H.g1)], rows: ["G-001", "G-002"] }, { id: "SUB-901", from: [f(H.g2)], rows: ["G-004"] }] }] },
		],
		tail: { heading: "# Open questions and deliberate omissions", from: [], keep: [f(H.oq), f(H.dom)] },
	};
	const reasons = reportedLines(FX, p).map((r, k) => ({ line: r.line, to: r.to, why: whyOf(k) }));
	const verdicts = FXROWS.map((r, k) => ({ id: r.id, at: FX_HOME[r.id], verdict: "keep", reason: keepOf(k) }));
	const v3 = verdicts.find((v) => v.id === "R-003"); delete v3.reason; v3.verdict = "move"; v3.targets = [{ to: "FEAT-004", reason: T.targetA }];
	const v5 = verdicts.find((v) => v.id === "R-005"); delete v5.reason; v5.verdict = "share"; v5.targets = [{ to: "FEAT-001", reason: T.targetB }, { to: "FEAT-004", reason: T.targetC }];
	p.regroup = {
		read: ["README.md", "tests/"],
		reasons,
		placed: Object.fromEntries(FX_PLACED.map((id, k) => [id, placedOf(k)])),
		evidence: { "FEAT-005": ["src\\report\\render.mjs"] },
		review: { drafter: "anthropic", reviewer: "openai", verdicts, claims: [] },
		refuted: [{ id: "R-003", to: "FEAT-004", reason: T.refuteA }, { id: "R-005", to: "FEAT-004", reason: T.refuteB }],
		questions: [
			{ ask: T.ask1, recommendation: T.rec1, about: [{ id: "R-005", to: "FEAT-001" }] },
			{ ask: T.ask2, recommendation: T.rec2, about: [{ line: L30, to: "FEAT-004" }] },
		],
	};
	p.regroup.review.claims = claimsFor(p);
	const rj = p.regroup.review.claims.find((c) => c.line === L30 && c.to === "FEAT-004");
	if (rj) { rj.verdict = "reject"; rj.reason = T.reject; }
	return p;
}
const variant = (fn) => { const p = fxProposal(); fn(p); return p; };
const verdictOf = (p, id) => p.regroup.review.verdicts.find((v) => v.id === id);
const claimAt = (p, pred) => p.regroup.review.claims.findIndex(pred);

const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "regroup-accept-")));
const PAGES = path.join(scratch, "pages");
fs.mkdirSync(PAGES);
const PROP_REL = path.join("docs", "regroup", "proposal.json");
let caseN = 0;
/** A fresh fixture root holding the ledger, its evidence files and the given proposal. */
function fxRoot(label, p, { bytes = null } = {}) {
	const d = path.join(scratch, "cases", `${++caseN}-${label.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}`);
	fs.mkdirSync(path.join(d, "docs", "regroup"), { recursive: true });
	fs.writeFileSync(path.join(d, "REQUIREMENTS.md"), FX);
	for (const [rel, body] of Object.entries(FX_FILES)) { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), body); }
	fs.writeFileSync(path.join(d, PROP_REL), bytes ?? `${JSON.stringify(p, null, 2)}\n`);
	return d;
}
/** Runs the command on a fresh fixture root; reports the page, and whether any file under the root changed. */
function runFx(label, p, { out: outPath = null, bytes = null, script = REGROUP } = {}) {
	const dir = fxRoot(label, p, { bytes });
	const prop = path.join(dir, PROP_REL);
	const page = outPath ?? path.join(PAGES, `${caseN}.md`);
	const before = fileList(dir);
	const r = regroup(["--root", dir, "--proposal", prop, "--out", page], scratch, script);
	return { dir, prop, page, r, text: readText(page), same: JSON.stringify(fileList(dir)) === JSON.stringify(before) };
}
/** One refusal: exit 1, the command's own words naming each item, no page at --out, no file under the root changed. */
function refused(title, p, names, opts = {}) {
	const x = runFx(title, p, opts);
	return out(`${title} → exit 1 naming ${names.map(String).join(", ")}, no page, nothing else changed`,
		[x.r.status, crashed(x.r), names.filter((nm) => !mentions(x.r, nm)).map(String), fs.existsSync(x.page), x.same], [1, false, [], false, true], own(x.r.stderr).slice(0, 3).join(" | "));
}
/** The build's tunables and exports, read by name in a child (a missing module is a named miss, not a crash here). */
function probeModule(file, names) {
	const r = node(["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(file).href)});
const enc = (v) => v instanceof Set ? { set: [...v] } : v instanceof Map ? { map: Object.fromEntries(v) } : typeof v === "function" ? { fn: v.name || true } : v;
console.log(JSON.stringify(Object.fromEntries(${JSON.stringify(names)}.map((k) => [k, k in m ? enc(m[k]) : { missing: true }]))));`], os.tmpdir());
	try { return JSON.parse(lines(r.stdout).at(-1) ?? ""); } catch { return null; }
}
const unwrap = (v) => (v && typeof v === "object" && !Array.isArray(v) && Object.hasOwn(v, "set") ? v.set : v && typeof v === "object" && !Array.isArray(v) && Object.hasOwn(v, "map") ? v.map : v);
const present = (v) => v !== undefined && v !== null && !(typeof v === "object" && !Array.isArray(v) && v.missing === true);

try {
	out("(harness) git merge-base main HEAD resolves", /^[0-9a-f]{40}$/.test(base), true, base);
	out("(harness) the scratch folder is outside the checkout", path.relative(fs.realpathSync(root), scratch).startsWith(".."), true, scratch);
	const liftTun = probeModule(LIFT, ["PROBLEM_LINE_CAP", "UNSORTED_PREFIX", "detectMoves"]);
	const CAP = typeof liftTun?.PROBLEM_LINE_CAP === "number" ? liftTun.PROBLEM_LINE_CAP : null;
	out("(harness) the lift exports PROBLEM_LINE_CAP and UNSORTED_PREFIX \"Not yet sorted:\" (§3.4: imported from the lift)", [typeof CAP, liftTun?.UNSORTED_PREFIX ?? null], ["number", UNSORTED]);
	const rgTun = probeModule(REGROUP, ["PAGE_SECTIONS", "PROPOSAL_KEYS", "VERDICTS", "CLAIM_VERDICTS", "PAGE_HEAD", "GIST_WORDS", "LIFT_SCRIPT"]);
	const GIST = typeof rgTun?.GIST_WORDS === "number" ? rgTun.GIST_WORDS : null;
	const PAGE_HEAD = typeof rgTun?.PAGE_HEAD === "string" ? rgTun.PAGE_HEAD : null;

	// ---------------------------------------------------------------- (a) the title check
	const titles = node([SEAT_TITLES, "1"]);
	const titleLines = lines(titles.stdout);
	out("(a) seat-titles 1 prints `seat-titles 1: 0 missing` and exits 0 (§5: every T1–T23 title exists under its req: marker)", [titleLines.at(-1) ?? null, titles.status], ["seat-titles 1: 0 missing", 0],
		titleLines.filter((l) => !/^(ok|gone) /.test(l)).slice(0, 4).join(" | ") + titles.stderr);

	// ---------------------------------------------------------------- fixture harness
	const P0 = fxProposal();
	const fxReport = reportedLines(FX, P0);
	const wantReport = [
		[lineOf(FX, H.partA), H.partA, "CAP-01", []], [lineOf(FX, H.load), H.load, "FEAT-001", []], [L15, H.build, "FEAT-002", []], [lineOf(FX, H.sizing), H.sizing, "SUB-001", []],
		[lineOf(FX, H.partB), H.partB, "CAP-02", []], [L30, H.build, "FEAT-002", []], [L30, H.build, "FEAT-004", ["R-008"]], [lineOf(FX, H.render), H.render, "FEAT-004", []],
		[lineOf(FX, H.partG), H.partG, "FEAT-900", []], [lineOf(FX, H.g1), H.g1, "SUB-900", []], [lineOf(FX, H.g2), H.g2, "SUB-901", []],
	].map(([line, heading, to, rows]) => keyOf({ line, heading, to, rows })).sort();
	out("(harness) the fixture: two `## 2. Build at production size` headings at different lines, and this script's R-1170 reader gives the eleven lines §3.2 implies for the proposal",
		[L15 > 0 && L30 > L15, keys(fxReport)], [true, wantReport]);
	out("(harness) the fixture's text-placed rows (R-1176, read here) are the seven the proposal places, and every row is longer than GIST_WORDS words",
		[textPlaced(FX, fxRoot("harness-placed", P0)), FXROWS.filter((r) => r.text.split(/\s+/).length <= (GIST ?? 12)).map((r) => r.id)], [FX_PLACED, []]);
	{
		const dir = fxRoot("harness-lift", P0);
		const r = lift(["--root", dir, "--mapping", path.join(dir, PROP_REL)], scratch);
		out("(harness) the honest proposal passes the checkout's lift dry run (exit 0, one proof line), the lift ignoring its `regroup` object and holding G-004 in the seed's SUB-901 (§3.3, A §2)", [r.status, proofLineOf(r.stdout) !== null], [0, true], own(r.stderr).slice(0, 3).join(" | "));
	}

	// ---------------------------------------------------------------- (l) R-1170: the lift reports each old line
	{
		const dir = fxRoot("l-flat", P0);
		const r = lift(["--root", dir, "--mapping", path.join(dir, PROP_REL)], scratch);
		const rep = reportOf(r.stdout);
		out("(l) flat fixture: the mapping's dry run exits 0 and prints exactly one `line N: <heading> -> <node>` line per named heading and one `… -> <node> (rows …)` line per old line and new home (R-1170, §3.2)",
			[r.status, rep.odd, keys(rep.recs)], [0, [], wantReport], rep.odd.slice(0, 2).join(" | ") + own(r.stderr).slice(0, 2).join(" | "));
		const same = rep.recs.filter((x) => x.heading === H.build);
		out(`(l) flat fixture: the two "${H.build}" headings print apart, keyed by line ${L15} and ${L30}, and line ${L30}'s move to FEAT-004 lists R-008 (R-1170, T1)`,
			same.map(keyOf).sort(), [`${L15}|${H.build}|FEAT-002|`, `${L30}|${H.build}|FEAT-002|`, `${L30}|${H.build}|FEAT-004|R-008`].sort());
		const d2 = fxRoot("l-default", P0);
		const def = lift(["--root", d2], scratch);
		out("(guard) flat fixture: the default dry run (no --mapping) prints no `->` line (R-1162, R-1170 speaks only of --mapping)", [def.status, lines(def.stdout).filter((l) => /->|→/.test(l))], [0, []], own(def.stderr).slice(0, 2).join(" | "));
		// The lifted fixture: the identity prints nothing; a merge prints its heading line, a row move its line and rows.
		const repo = path.join(scratch, "l-lifted");
		fs.mkdirSync(repo);
		fs.writeFileSync(path.join(repo, "REQUIREMENTS.md"), FX);
		for (const a of [["init", "-q", "-b", "main"], ["config", "core.autocrlf", "false"], ["add", "-A"], ["commit", "-qm", "flat"]]) gitIn(repo, ...a);
		const w = lift(["--root", repo, "--write"], scratch);
		gitIn(repo, "commit", "-qam", "lift");
		const idPath = path.join(repo, "identity.json");
		const em = lift(["--root", repo, "--emit-mapping", idPath], scratch);
		const lifted = readBuf(path.join(repo, "REQUIREMENTS.md"));
		const idMap = readText(idPath) ? JSON.parse(readText(idPath)) : null;
		const idDry = lift(["--root", repo, "--mapping", idPath], scratch);
		out("(guard) lifted fixture: the identity mapping's dry run prints no `->` line (R-1162; a heading named by its own node is not reported)", [w.status, em.status, idDry.status, lines(idDry.stdout).filter((l) => /->|→/.test(l))], [0, 0, 0, []], own(idDry.stderr).slice(0, 2).join(" | "));
		let mm = null;
		try {
			mm = structuredClone(idMap);
			const cap2 = mm.tree.find((c) => c.id === "CAP-02"), cap1 = mm.tree.find((c) => c.id === "CAP-01");
			const f2 = cap1.features.find((x) => x.id === "FEAT-002"), f3 = cap2.features.find((x) => x.id === "FEAT-003"), f4 = cap2.features.find((x) => x.id === "FEAT-004"), f1 = cap1.features.find((x) => x.id === "FEAT-001");
			f2.from = [...f2.from, ...f3.from]; f2.rows = [...expandIds(f2.rows), ...expandIds(f3.rows)]; cap2.features = cap2.features.filter((x) => x !== f3);
			f4.rows = expandIds(f4.rows).filter((x) => x !== "R-009"); f1.rows = [...expandIds(f1.rows), "R-009"];
		} catch { mm = null; }
		const mPath = path.join(repo, "merge.json");
		fs.writeFileSync(mPath, `${JSON.stringify(mm, null, 2)}\n`);
		const mDry = lift(["--root", repo, "--mapping", mPath], scratch);
		const mRep = reportOf(mDry.stdout);
		const mWant = mm ? keys(reportedLines(lifted, mm)) : ["(no mapping)"];
		out("(l) lifted fixture: FEAT-003 folded into FEAT-002 prints its heading line `-> FEAT-002`, R-009 moved prints FEAT-004's line `-> FEAT-001 (rows R-009)`, and nothing else (R-1170)",
			[mDry.status, mRep.odd, keys(mRep.recs), mWant.length], [0, [], mWant, 2], mRep.odd.concat(own(mDry.stderr)).slice(0, 3).join(" | "));
		const probe = node(["--input-type=module", "-e", `import * as fs from "node:fs";
const m = await import(${JSON.stringify(pathToFileURL(LIFT).href)});
if (typeof m.detectMoves !== "function") { console.log(JSON.stringify("not exported")); process.exit(0); }
const recs = m.detectMoves(fs.readFileSync(${JSON.stringify(path.join(dir, "REQUIREMENTS.md"))}, "utf8"), JSON.parse(fs.readFileSync(${JSON.stringify(path.join(dir, PROP_REL))}, "utf8")));
console.log(JSON.stringify(Array.isArray(recs) ? recs.map((r) => ({ line: r?.line, heading: r?.heading, to: r?.to, rows: r?.rows === undefined ? [] : r.rows })) : "not an array"));`], scratch);
		let recs = null; try { recs = JSON.parse(lines(probe.stdout).at(-1) ?? ""); } catch {}
		out("(f) the lift exports detectMoves, which returns §3.2's {line, heading, to, rows} records for the flat fixture, heading records without rows (§3.2, §4)",
			Array.isArray(recs) ? [recs.every((x) => typeof x.line === "number" && typeof x.heading === "string" && typeof x.to === "string" && Array.isArray(x.rows)), keys(recs)] : recs, [true, wantReport], own(probe.stderr).slice(-2).join(" | "));
	}

	// ---------------------------------------------------------------- (r) the regroup command on the fixture
	out("(r) scripts/requirements-regroup.mjs exists (§4 In)", fs.existsSync(REGROUP), true);
	const pass = runFx("pass", P0);
	out("(r) the honest proposal passes: exit 0, the page written at --out opening with PAGE_HEAD, nothing under the root changed (R-1171, T2)",
		[pass.r.status, crashed(pass.r), pass.text !== null, PAGE_HEAD !== null && (pass.text ?? "").startsWith(PAGE_HEAD), pass.same], [0, false, true, true, true], own(pass.r.stderr).slice(0, 4).join(" | "));
	{
		const again = runFx("pass-again", P0);
		out("(r) the page carries no timestamp: a second run of the same proposal writes the same bytes (§3.4 item 3)", [again.r.status, again.text !== null && again.text === pass.text], [0, true]);
		const bomCrlf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(`${JSON.stringify(P0, null, 2)}\n`.replace(/\n/g, "\r\n"))]);
		const b = runFx("pass-bom-crlf", P0, { bytes: bomCrlf });
		out("(r) the proposal saved with a UTF-8 BOM and CRLF endings (PowerShell 5.1, Git for Windows; the lift's BOM rule) passes and writes its page (threat model, §3.3)", [b.r.status, crashed(b.r), b.text !== null], [0, false, true], own(b.r.stderr).slice(0, 3).join(" | "));
	}
	{
		// The lift's dry run refuses (R-010 dropped from every node): exit 1, no page, the lift's own words printed as is.
		const p = variant((q) => { const f4 = mappingNodes(q).find((x) => x.id === "FEAT-004").node; f4.rows = f4.rows.filter((x) => x !== "R-010"); });
		const x = runFx("lift-refuses", p);
		const direct = lift(["--root", x.dir, "--mapping", x.prop], scratch);
		const liftWords = own(direct.stderr);
		out("(r) a proposal the lift's dry run refuses: exit 1, no page, and every line the lift prints for it appears in the command's output (R-1171, T2, §3.4 item 1)",
			[direct.status, liftWords.length > 0, x.r.status, crashed(x.r), liftWords.filter((l) => !said(x.r).includes(l)), fs.existsSync(x.page), x.same], [1, true, 1, false, [], false, true], liftWords.slice(0, 2).join(" | ") + " || " + own(x.r.stderr).slice(0, 2).join(" | "));
	}
	{
		const link = path.join(scratch, "regroup-link.mjs");
		try { fs.symlinkSync(REGROUP, link); } catch {}
		const x = runFx("via-link", P0, { script: link });
		out("(r) run through a symlink to the script, the command still writes its page (R-1171, T3, §3.4's realpath main guard)", [x.r.status, x.text !== null && x.text === pass.text], [0, true], own(x.r.stderr).slice(0, 3).join(" | "));
	}
	// --out over an input (R-1171, T19, T20): the ledger, the proposal, an evidence path, each directly or through a symlink.
	{
		const clash = (title, pick) => {
			const dir = fxRoot(title, P0);
			const prop = path.join(dir, PROP_REL);
			const target = pick(dir, prop);
			const real = fs.realpathSync(target);
			const bytes = readBuf(real);
			const before = fileList(dir);
			const r = regroup(["--root", dir, "--proposal", prop, "--out", target], scratch);
			return out(`${title} → exit 1, that file byte-identical, nothing under the root changed`,
				[r.status, crashed(r), readBuf(real)?.equals(bytes) ?? false, JSON.stringify(fileList(dir)) === JSON.stringify(before)], [1, false, true, true], own(r.stderr).slice(0, 2).join(" | "));
		};
		clash("(r) --out naming the ledger (R-1171, T19)", (dir) => path.join(dir, "REQUIREMENTS.md"));
		clash("(r) --out naming the proposal (R-1171, T19)", (dir, prop) => prop);
		clash("(r) --out naming an evidence path the proposal cites (R-1171: each evidence path is an input)", (dir) => path.join(dir, "src", "report", "render.mjs"));
		clash("(r) --out a symlink to the proposal (R-1171, T20)", (dir, prop) => { const l = path.join(scratch, `prop-link-${caseN}.json`); fs.symlinkSync(prop, l); return l; });
		clash("(r) --out the ledger through a symlinked folder (R-1171: the real path, symlinks followed)", (dir) => { const l = path.join(scratch, `root-link-${caseN}`); fs.symlinkSync(dir, l); return path.join(l, "REQUIREMENTS.md"); });
		// The lift is an input too. A mirror of the checkout's scripts in the scratch, so a wrong build writes over the
		// mirror's lift, never the checkout's.
		const mirror = path.join(scratch, "mirror");
		for (const rel of ["scripts", "templates/_shared", "templates/typescript/template/tests/requirements-trace.ts", "package.json"]) {
			if (!fs.existsSync(path.join(root, rel))) continue;
			fs.mkdirSync(path.dirname(path.join(mirror, rel)), { recursive: true });
			fs.cpSync(path.join(root, rel), path.join(mirror, rel), { recursive: true });
		}
		const mRegroup = path.join(mirror, REGROUP_SCRIPT), mLift = path.join(mirror, LIFT_SCRIPT);
		const mp = runFx("mirror-pass", P0, { script: mRegroup });
		const liftBytes = readBuf(mLift);
		const mc = runFx("mirror-lift-out", P0, { script: mRegroup, out: mLift });
		out("(r) --out naming the lift the command runs (a scratch mirror of the checkout's scripts, which itself passes the honest proposal) → exit 1, the lift byte-identical (R-1171)",
			[mp.r.status, mc.r.status, crashed(mc.r), Boolean(liftBytes) && (readBuf(mLift)?.equals(liftBytes) ?? false), mc.same], [0, 1, false, true, true], own(mp.r.stderr).concat(own(mc.r.stderr)).slice(0, 3).join(" | "));
	}
	// A failing run removes an earlier page and leaves any other file at --out (R-1171, T21, residual 5).
	{
		const pagePath = path.join(scratch, "earlier-page.md");
		const first = runFx("earlier-page", P0, { out: pagePath });
		const hadPage = fs.existsSync(pagePath);
		const failing = variant((q) => { q.regroup.reasons = q.regroup.reasons.slice(1); });
		const second = runFx("earlier-page-fail", failing, { out: pagePath });
		out("(r) a failing run removes an earlier review page at --out (R-1171, T21)", [first.r.status, hadPage, second.r.status, crashed(second.r), fs.existsSync(pagePath), second.same], [0, true, 1, false, false, true], own(second.r.stderr).slice(0, 2).join(" | "));
		const notes = path.join(scratch, "not-a-page.md");
		const body = "# my notes\n\nThis file is not a review page.\n";
		fs.writeFileSync(notes, body);
		const third = runFx("not-a-page-fail", failing, { out: notes });
		out("(r) a failing run leaves a file at --out that is not a review page unchanged (R-1171, T21)", [third.r.status, crashed(third.r), readText(notes)], [1, false, body], own(third.r.stderr).slice(0, 2).join(" | "));
	}
	// A proposal only the lift refuses (a pin of 64 zeros; no regroup check reads the pin), run with --out already holding a
	// passing run's page: the lift's refusal decides the run, its words print, and the earlier page goes (R-1171, T2, T21).
	{
		const pagePath = path.join(scratch, "pin-earlier-page.md");
		const first = runFx("pin-earlier-page", P0, { out: pagePath });
		const hadPage = fs.existsSync(pagePath);
		const x = runFx("pin-mismatch", variant((q) => { q.pin.sha256 = "0".repeat(64); }), { out: pagePath });
		const direct = lift(["--root", x.dir, "--mapping", x.prop], scratch);
		out(`(r) a pin of 64 zeros, refused only by the lift, with --out holding a passing run's page → exit 1, the lift's "${PIN_MISMATCH}" line in the output, no file left at --out (R-1171, T2, T21)`,
			[first.r.status, hadPage, direct.status, mentions(direct, PIN_MISMATCH), x.r.status, crashed(x.r), lines(said(x.r)).some((l) => l.includes(PIN_MISMATCH)), fs.existsSync(pagePath), x.same], [0, true, 1, true, 1, false, true, false, true], own(x.r.stderr).slice(0, 3).join(" | "));
	}
	// Usage (R-1177, T12): each of the three flags missing exits 2 with the usage line naming all three.
	{
		const dir = fxRoot("usage", P0);
		const prop = path.join(dir, PROP_REL), page = path.join(PAGES, "usage.md");
		const runs = [["--proposal", prop, "--out", page], ["--root", dir, "--out", page], ["--root", dir, "--proposal", prop]].map((a) => regroup(a, scratch));
		out("(r) a run missing --root, --proposal or --out exits 2 with a usage line naming all three flags, and writes no page (R-1177, T12)",
			[runs.map((x) => x.status), runs.map((x) => crashed(x)), runs.map((x) => ["--root", "--proposal", "--out"].every((f) => said(x).includes(f))), fs.existsSync(page)], [[2, 2, 2], [false, false, false], [true, true, true], false], runs.map((x) => own(x.stderr)[0] ?? "").join(" | "));
	}
	// R-1172 (T4): a placeholder purpose or outcome outside the reserved nodes; the reserved nodes may keep one.
	refused("(r) FEAT-001 keeps a \"Not yet sorted:\" purpose (R-1172, T4)", syncClaims(variant((q) => { mappingNodes(q).find((x) => x.id === "FEAT-001").node.purpose = `${UNSORTED} the rows of old section "1. Load files".`; })), ["FEAT-001"]);
	refused("(r) CAP-02 keeps a \"Not yet sorted:\" outcome (R-1172, T4)", syncClaims(variant((q) => { q.tree[1].outcome = `${UNSORTED} the rows of old section "Part B. Report" sorted into the tree.`; })), ["CAP-02"]);
	refused("(r) SUB-001 keeps a \"Not yet sorted:\" purpose (R-1172, T4)", syncClaims(variant((q) => { mappingNodes(q).find((x) => x.id === "SUB-001").node.purpose = `${UNSORTED} the rows of old section "2a. Sizing".`; })), ["SUB-001"]);
	{
		const p = variant((q) => { const c = q.tree.find((x) => x.id === "CAP-90"); c.purpose = `${UNSORTED} reserved.`; c.outcome = `${UNSORTED} reserved.`; c.features[0].purpose = `${UNSORTED} reserved.`; for (const sg of c.features[0].subgroups) sg.purpose = `${UNSORTED} reserved.`; });
		const x = runFx("reserved-placeholder", p);
		out("(r) the reserved CAP-90, FEAT-900, SUB-900 and SUB-901 may keep a \"Not yet sorted:\" purpose and outcome, with no claim verdict for them: exit 0 and a page (R-1172: SUB-900 to SUB-904, R-1184, T4, T22)", [x.r.status, crashed(x.r), x.text !== null], [0, false, true], own(x.r.stderr).slice(0, 3).join(" | "));
	}
	// R-1173 (T5): exactly one reason per reported line, keyed by old line and node.
	const L22 = lineOf(FX, H.sizing), L37 = lineOf(FX, H.render), L7 = lineOf(FX, H.load);
	refused(`(r) the reason for line ${L22} → SUB-001 missing (its claim dropped too) (R-1173, T5)`, variant((q) => { q.regroup.reasons = q.regroup.reasons.filter((r) => !(r.line === L22)); q.regroup.review.claims = q.regroup.review.claims.filter((c) => c.line !== L22); }), [word(L22)]);
	refused(`(r) the reason for line ${L37} → FEAT-004 repeated (R-1173, T5)`, variant((q) => { q.regroup.reasons.push({ ...q.regroup.reasons.find((r) => r.line === L37 && r.to === "FEAT-004") }); }), [word(L37)]);
	refused(`(r) a stale reason for line ${L7} → FEAT-002, a line the lift reports only for FEAT-001 (R-1173, T5)`, variant((q) => { q.regroup.reasons.push({ line: L7, to: "FEAT-002", why: "a reason for a line the lift does not report (stale)" }); }), [word(L7)]);
	refused(`(r) the same stale reason for line ${L7} → FEAT-002 with its own accepted claim, so only the stale-reason check can refuse it (R-1173, T5: "each reason names such a line")`,
		variant((q) => { const why = "a reason for a line the lift does not report (stale)"; q.regroup.reasons.push({ line: L7, to: "FEAT-002", why }); q.regroup.review.claims.push({ line: L7, to: "FEAT-002", text: why, verdict: "accept", reason: "the stale reason reads true (claim stale)" }); }), [word(L7)]);
	refused(`(r) the second "${H.build}" reasoned by text: line ${L15} given twice for FEAT-002 and line ${L30} → FEAT-002 left without one (R-1173, T5)`,
		variant((q) => { const r = q.regroup.reasons.find((y) => y.line === L30 && y.to === "FEAT-002"); r.line = L15; q.regroup.review.claims = q.regroup.review.claims.filter((c) => !(c.line === L30 && c.to === "FEAT-002")); }), [word(L30)]);
	// R-1174 (T6): a proposed feature's evidence.
	fs.writeFileSync(path.join(scratch, "cases", "outside.txt"), "outside the root\n");
	refused("(r) the proposed FEAT-005 names no evidence path (R-1174, T6)", variant((q) => { delete q.regroup.evidence["FEAT-005"]; }), ["FEAT-005"]);
	refused("(r) the proposed FEAT-005's evidence list is empty (R-1174, T6)", variant((q) => { q.regroup.evidence["FEAT-005"] = []; }), ["FEAT-005"]);
	refused("(r) the proposed FEAT-005 names a missing path (R-1174, T6)", variant((q) => { q.regroup.evidence["FEAT-005"] = ["src/report/missing.mjs"]; }), ["src/report/missing.mjs"]);
	refused("(r) the proposed FEAT-005 names an existing file that `..` leads outside the root (R-1174, T6)", variant((q) => { q.regroup.evidence["FEAT-005"] = ["../outside.txt"]; }), ["../outside.txt"]);
	refused("(r) the proposed FEAT-005 names an absolute path to an existing file outside the root (R-1174)", variant((q) => { q.regroup.evidence["FEAT-005"] = [path.join(scratch, "cases", "outside.txt")]; }), ["FEAT-005"]);
	// R-1175 (T7, T8, T9): the review record.
	refused("(r) the review record misses R-009 (R-1175, T7)", variant((q) => { q.regroup.review.verdicts = q.regroup.review.verdicts.filter((v) => v.id !== "R-009"); }), ["R-009"]);
	refused("(r) the review record repeats R-009 (R-1175, T7)", variant((q) => { q.regroup.review.verdicts.push({ ...verdictOf(q, "R-009") }); }), ["R-009"]);
	refused("(r) R-008's verdict names a stale home, FEAT-002, after the proposal moved it to FEAT-004 (R-1175, T7)", variant((q) => { verdictOf(q, "R-008").at = "FEAT-002"; }), ["R-008"]);
	refused("(r) R-009's verdict is neither keep, move nor share (R-1175, T7)", variant((q) => { verdictOf(q, "R-009").verdict = "maybe"; }), ["R-009"]);
	refused("(r) R-003's move names FEAT-999, a target the proposal does not hold (R-1175, T7)", variant((q) => { verdictOf(q, "R-003").targets[0].to = "FEAT-999"; q.regroup.refuted[0].to = "FEAT-999"; }), ["FEAT-999"]);
	refused("(r) R-009's keep verdict has an empty reason (R-1175, T7)", variant((q) => { verdictOf(q, "R-009").reason = ""; }), ["R-009"]);
	refused("(r) R-005's share target FEAT-001 carries no reason of its own (R-1175, T7)", variant((q) => { delete verdictOf(q, "R-005").targets[0].reason; }), ["R-005"]);
	refused("(r) R-003's move names two targets, each with a reason and refuted (R-1175: one target for a move)", variant((q) => { verdictOf(q, "R-003").targets.push({ to: "FEAT-002", reason: "the import log also feeds the build (target delta)" }); q.regroup.refuted.push({ id: "R-003", to: "FEAT-002", reason: "it does not (refute delta)" }); }), ["R-003"]);
	refused("(r) R-003's move target is left unresolved: neither refuted nor asked (R-1175, T8)", variant((q) => { q.regroup.refuted = q.regroup.refuted.filter((x) => x.id !== "R-003"); }), ["R-003"]);
	refused("(r) R-005's share target FEAT-004 is left unresolved while FEAT-001 stays asked (R-1175, T8: keyed by row and target)", variant((q) => { q.regroup.refuted = q.regroup.refuted.filter((x) => x.id !== "R-005"); }), ["R-005", "FEAT-004"]);
	refused("(r) R-005's share target FEAT-004 is resolved twice: refuted and asked (R-1175, T8)", variant((q) => { q.regroup.questions[0].about.push({ id: "R-005", to: "FEAT-004" }); }), ["R-005"]);
	refused("(r) the review record names no reviewer lineage (R-1175: \"names the drafter's and the reviewer's model lineage\")", variant((q) => { delete q.regroup.review.reviewer; }), [/reviewer/i]);
	refused("(r) R-003's move names no target, and nothing refutes or asks one (R-1175: a move with targets, one target for a move)", variant((q) => { verdictOf(q, "R-003").targets = []; q.regroup.refuted = q.regroup.refuted.filter((x) => x.id !== "R-003"); }), ["R-003"]);
	refused("(r) R-003's refutation of FEAT-004 has an empty reason (R-1175: \"named in `refuted` with a reason\", T8)", variant((q) => { q.regroup.refuted[0].reason = ""; }), ["R-003"]);
	refused("(r) R-003's move to FEAT-004 refuted twice, and R-005's share to FEAT-001 asked by both questions (R-1175, T8: exactly one outcome per target, counted)",
		variant((q) => { q.regroup.refuted.push({ id: "R-003", to: "FEAT-004", reason: "it stays with loading (refute echo)" }); q.regroup.questions[1].about.push({ id: "R-005", to: "FEAT-001" }); }), ["R-003", "R-005"]);
	refused("(r) R-005's share target FEAT-001 carries an empty reason (R-1175, T7: targets \"that each carry their own non-empty reason\")", variant((q) => { verdictOf(q, "R-005").targets[0].reason = ""; }), ["R-005"]);
	out("(r) the honest proposal's share of R-005 is asked for FEAT-001 and refuted for FEAT-004, and it passes (R-1175, T8; a carried outcome waits for regroup-shares, residual 2)", [pass.r.status], [0]);
	refused("(r) drafter and reviewer share a lineage with no same-family declaration (R-1175, T9)", variant((q) => { q.regroup.review.reviewer = q.regroup.review.drafter; }), [/same-family|lineage/i]);
	// The declaration's key is the build's: a review-level key in PROPOSAL_KEYS other than the four §3.3 names.
	const reviewKeys = (() => {
		const found = [];
		const walk = (v) => { const u = unwrap(v); if (Array.isArray(u)) { if (u.includes("drafter") && u.includes("reviewer")) found.push(...u); return; } if (u && typeof u === "object") Object.values(u).forEach(walk); };
		walk(rgTun?.PROPOSAL_KEYS);
		return [...new Set(found)].filter((k) => !["drafter", "reviewer", "verdicts", "claims"].includes(k));
	})();
	let samePage = null, sameForm = null;
	for (const k of reviewKeys) for (const v of ["same-family", true]) {
		if (samePage) break;
		const x = runFx(`same-family-${k}`, variant((q) => { q.regroup.review.reviewer = q.regroup.review.drafter; q.regroup.review[k] = v; }));
		if (x.r.status === 0 && x.text) { samePage = x.text; sameForm = `${k}: ${JSON.stringify(v)}`; }
	}
	out("(r) drafter and reviewer of one lineage, declared same-family (a review key PROPOSAL_KEYS holds, valued \"same-family\" or true), pass (R-1175, T9)", [reviewKeys.length > 0, samePage !== null], [true, true], `review keys beyond §3.3's: ${JSON.stringify(reviewKeys)}; form ${sameForm}`);
	out("(p) a same-family record's page reads \"same-family review\" and never \"another lineage\" (R-1178, T15)", [samePage !== null && samePage.includes("same-family review"), samePage !== null && !/another lineage/i.test(samePage)], [true, true]);
	// R-1176 (T10): placed reasons for exactly the text-placed rows.
	refused("(r) text-placed R-006 has no placed reason (R-1176, T10)", variant((q) => { delete q.regroup.placed["R-006"]; }), ["R-006"]);
	refused("(r) R-005, whose Evidence names a path that does not exist, has no placed reason (R-1176, T10: existence read, not mere mention)", variant((q) => { delete q.regroup.placed["R-005"]; }), ["R-005"]);
	refused("(r) R-001, whose Evidence names an existing test file, has a placed reason (R-1176, T10)", variant((q) => { q.regroup.placed["R-001"] = "placed by text (placed extra)"; }), ["R-001"]);
	refused("(r) text-placed R-003's placed reason is empty (R-1176)", variant((q) => { q.regroup.placed["R-003"] = ""; }), ["R-003"]);
	// R-1184 (T22, T23): claim verdicts.
	refused("(r) FEAT-001's purpose has no claim verdict (R-1184, T22)", variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.node === "FEAT-001" && c.field === "purpose"), 1); }), ["FEAT-001"]);
	refused("(r) CAP-02's outcome has no claim verdict (R-1184, T22)", variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.node === "CAP-02" && c.field === "outcome"), 1); }), ["CAP-02"]);
	refused("(r) SUB-001's purpose has no claim verdict (R-1184, T22: each subgroup's purpose)", variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.node === "SUB-001" && c.field === "purpose"), 1); }), ["SUB-001"]);
	refused(`(r) the reason for line ${L37} → FEAT-004 has no claim verdict (R-1184, T22)`, variant((q) => { q.regroup.review.claims.splice(claimAt(q, (c) => c.line === L37 && c.to === "FEAT-004"), 1); }), [word(L37)]);
	refused("(r) FEAT-004's purpose has two claim verdicts (R-1184, T22)", variant((q) => { q.regroup.review.claims.push({ ...q.regroup.review.claims[claimAt(q, (c) => c.node === "FEAT-004" && c.field === "purpose")] }); }), ["FEAT-004"]);
	refused("(r) FEAT-002's purpose claim quotes a stale text (R-1184, T22)", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "FEAT-002" && c.field === "purpose")].text = "Build the dataset (an older wording)."; }), ["FEAT-002"]);
	refused("(r) SUB-001's purpose claim has an empty reason (R-1184, T22)", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "SUB-001")].reason = ""; }), ["SUB-001"]);
	refused("(r) CAP-01's purpose claim is neither accept nor reject (R-1184, T22)", variant((q) => { q.regroup.review.claims[claimAt(q, (c) => c.node === "CAP-01" && c.field === "purpose")].verdict = "maybe"; }), ["CAP-01"]);
	refused(`(r) the rejected claim on line ${L30} → FEAT-004's reason is named in no question (R-1184, T23)`, variant((q) => { q.regroup.questions = q.regroup.questions.slice(0, 1); }), [word(L30)]);
	refused("(r) FEAT-001's purpose claim is rejected and named in no question (R-1184, T23)", variant((q) => { const c = q.regroup.review.claims[claimAt(q, (y) => y.node === "FEAT-001" && y.field === "purpose")]; c.verdict = "reject"; }), ["FEAT-001"]);
	out("(r) the honest proposal holds a rejected reason claim named in a question, and passes (R-1184, T23)", [pass.r.status], [0]);
	// R-1177 (T13): a misspelled key at each of the 18 object levels, named by its path; a question without a recommendation.
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
			const x = runFx(`key-${level}`, p);
			if (!(x.r.status === 1 && !crashed(x.r) && said(x.r).includes(where) && !fs.existsSync(x.page) && x.same)) misses.push(`${level}: ${where} (exit ${x.r.status})`);
		}
		out("(r) a misspelled key at each of the 18 object levels (top, pin, head, capability, feature, subgroup, from, tail, keep, regroup, reason, review, verdict, target, claim, refuted, question, about) → exit 1 naming its path, no page (R-1177, T13)",
			{ levels: LEVELS.length, misses }, { levels: 18, misses: [] });
	}
	refused("(r) a question without its recommendation (R-1177, T13)", variant((q) => { delete q.regroup.questions[0].recommendation; }), ["recommendation"]);
	// Keys valid at another level but not at this one (R-1177: "a key outside that level's fields"), each named by its path.
	refused("(r) a feature holding a capability's key, tree[0].features[0].outcome (R-1177, T13: per-level fields)", variant((q) => { q.tree[0].features[0].outcome = "Every arriving file is staged (outcome misplaced)."; }), ["tree[0].features[0].outcome"]);
	refused("(r) a subgroup holding a feature's key, tree[0].features[1].subgroups[0].status (R-1177, T13: per-level fields)", variant((q) => { q.tree[0].features[1].subgroups[0].status = "active"; }), ["tree[0].features[1].subgroups[0].status"]);
	refused("(r) a verdict holding a reason's key, regroup.review.verdicts[0].why (R-1177, T13: per-level fields)", variant((q) => { q.regroup.review.verdicts[0].why = "the row serves its home (why misplaced)"; }), ["regroup.review.verdicts[0].why"]);
	// R-1177 (T11): more problems than the cap print the cap and the count of the rest.
	{
		const N = (CAP ?? 40) + 10;
		const p = variant((q) => { for (let k = 1; k <= N; k++) q[`x${pad(k, 2)}`] = k; });
		const x = runFx("cap", p);
		const errLines = own(x.r.stderr);
		const shown = new Set(errLines.flatMap((l) => [...l.matchAll(/(?<![\w-])x\d{2}(?![\w-])/g)].map((m) => m[0])));
		const rest = errLines.map((l) => /\b(\d+)\b[^\n]*\bmore\b|\bmore\b[^\n]*?\b(\d+)\b/.exec(l)).filter(Boolean).map((m) => Number(m[1] ?? m[2]));
		out(`(r) a proposal with ${N} misspelled top-level keys → exit 1 in at most PROBLEM_LINE_CAP + 1 lines, naming at most PROBLEM_LINE_CAP keys and the count of the rest (R-1177, T11)`,
			[CAP !== null, x.r.status, crashed(x.r), errLines.length <= (CAP ?? 0) + 1, shown.size <= (CAP ?? 0) && shown.size > 0, rest.some((c) => c === N - shown.size), fs.existsSync(x.page)], [true, 1, false, true, true, true, false], `${errLines.length} lines, ${shown.size} keys named, rest ${JSON.stringify(rest)}`);
	}

	// ---------------------------------------------------------------- (p) the page (R-1178, R-1179)
	{
		const page = pass.text ?? "";
		const pos = (s) => page.indexOf(s);
		const lineAround = (i) => { if (i < 0) return ""; const s = page.lastIndexOf("\n", i) + 1; const e = page.indexOf("\n", i); return page.slice(s, e < 0 ? page.length : e); };
		const prevLine = (i) => { if (i < 0) return ""; let s = page.lastIndexOf("\n", i); let k = 0; let prev = ""; while (s > 0 && k < 3) { const ps = page.lastIndexOf("\n", s - 1) + 1; prev = page.slice(ps, s); if (prev.trim() !== "") return prev; s = ps - 1; k++; } return prev; };
		const entry = (s) => `${prevLine(pos(s))}\n${lineAround(pos(s))}`;
		const propBytes = fs.readFileSync(pass.prop);
		const dry = lift(["--root", pass.dir, "--mapping", pass.prop], scratch);
		const proofLine = proofLineOf(dry.stdout);
		const q1 = pos(T.ask1), r1 = pos(T.rec1), q2 = pos(T.ask2), r2 = pos(T.rec2);
		const hdr = q1 > 0 ? page.slice(0, q1) : "";
		const hdrLine = (re, k) => hdr.split("\n").some((l) => re.test(l) && word(k).test(l));
		const claims = P0.regroup.review.claims.length, verdicts = P0.regroup.review.verdicts.length;
		out("(p) the page opens with PAGE_HEAD, then, before the first question, the proposal's SHA-256, the pin, the lift's proof line, both lineages and the placement and claim verdict counts (R-1178, T14)",
			[PAGE_HEAD !== null && page.startsWith(PAGE_HEAD), hdr.includes(sha(propBytes)), hdr.includes(P0.pin.sha256), proofLine !== null && hdr.includes(proofLine), hdr.includes("anthropic") && hdr.includes("openai"), hdrLine(/placement/i, verdicts), hdrLine(/claim/i, claims)],
			[true, true, true, true, true, true, true], `${verdicts} placement, ${claims} claim verdicts; proof ${proofLine}`);
		const numbered = (i, k) => [lineAround(i), prevLine(i)].some((l) => new RegExp(`^\\s*(?:[-*>#]+\\s*)?(?:\\*\\*)?(?:Q(?:uestion)?\\s*)?${k}[.):]`, "i").test(l));
		const tableStart = (() => { const i = page.indexOf("\n|", Math.max(r2, 0)); return i < 0 ? -1 : i + 1; })();
		out("(p) then the numbered questions, each with its recommendation, before the feature table (R-1178, T14)",
			[q1 > 0, q1 < r1, r1 < q2, q2 < r2, numbered(q1, 1), numbered(q2, 2), tableStart > r2], [true, true, true, true, true, true, true]);
		// The one feature table: the first Markdown table after the questions; every feature in it; a feature without
		// subgroups carries its row count and its rows' status mix (a feature with subgroups is not checked for counts:
		// the plan does not say whether its count includes its subgroups' rows).
		const block = (() => { if (tableStart < 0) return []; const acc = []; for (const l of page.slice(tableStart).split("\n")) { if (!l.startsWith("|")) break; acc.push(l); } return acc; })();
		const feats = mappingNodes(P0).filter((x) => x.level === 2);
		const featLine = (id) => block.find((l) => word(id).test(l)) ?? null;
		const header = block[0] ?? "";
		const mixOk = (line, ids) => {
			if (!line) return false;
			const hc = cellsOf(header).map((c) => c.toLowerCase()), lc = cellsOf(line);
			const counts = {}; for (const id of ids) { const s = FXROWS.find((r) => r.id === id).status; counts[s] = (counts[s] ?? 0) + 1; }
			const countOk = lc.some((c) => new RegExp(`^${ids.length}(?: rows?)?$`).test(c));
			return countOk && Object.entries(counts).every(([s, c]) => { const col = hc.findIndex((h) => h.includes(s)); return col >= 0 ? Number(lc[col]) === c : new RegExp(`\\b${c}\\b[^|\\d]{0,3}${s}|${s}[^|\\d]{0,3}\\b${c}\\b`, "i").test(line); });
		};
		out("(p) one feature table lists every feature, and each feature without subgroups with its row count and status mix (R-1178, T14)",
			[block.length > 0, feats.filter((x) => !featLine(x.id)).map((x) => x.id), feats.filter((x) => !(x.node.subgroups ?? []).length).filter((x) => !mixOk(featLine(x.id), expandIds(x.node.rows))).map((x) => x.id)], [true, [], []], block.slice(0, 4).join(" / "));
		const whys = P0.regroup.reasons.map((r) => pos(r.why));
		const firstWhy = Math.min(...whys.map((v) => (v < 0 ? Infinity : v)));
		const purposeTexts = mappingNodes(P0).filter((x) => !RESERVED.has(x.id)).flatMap((x) => [x.node.purpose, ...(x.level === 1 ? [x.node.outcome] : [])]);
		const between = (s) => { const i = pos(s); return i > r2 && i < firstWhy; };
		out("(p) then every capability, feature and subgroup with its purpose, each capability's outcome and the proposed FEAT-005's evidence path, before the reported lines (R-1178, T14)",
			[mappingNodes(P0).filter((x) => { const i = page.slice(Math.max(r2, 0), firstWhy === Infinity ? 0 : firstWhy); return !word(x.id).test(i); }).map((x) => x.id), purposeTexts.filter((s) => !between(s)), between("src\\report\\render.mjs") || between("src/report/render.mjs")], [[], [], true]);
		// R-1179: each reported line with its reason and moved rows.
		const reportMiss = reportedLines(FX, P0).filter((rec) => {
			const why = P0.regroup.reasons.find((r) => r.line === rec.line && r.to === rec.to)?.why;
			const e = why && pos(why) >= 0 ? entry(why) : "";
			return !(word(rec.line).test(e) && word(rec.to).test(e) && rec.rows.every((id) => word(id).test(e)));
		}).map((r) => `${r.line}->${r.to}`);
		out("(p) then each line the lift reports, its reason beside its old line, node and moved row IDs, both same-text headings apart (R-1179, T16)", [firstWhy !== Infinity, reportMiss], [true, []]);
		const targetSpec = [["R-003", "FEAT-004", T.targetA, "refuted"], ["R-005", "FEAT-001", T.targetB, "asked"], ["R-005", "FEAT-004", T.targetC, "refuted"]];
		const lastWhy = Math.max(...whys);
		const targetMiss = targetSpec.filter(([id, to, reason, outcome]) => { const l = lineAround(pos(reason)); const others = ["carried", "refuted", "asked"].filter((o) => o !== outcome); return !(pos(reason) > lastWhy && word(id).test(l) && word(to).test(l) && new RegExp(`\\b${outcome}\\b`, "i").test(l) && !others.some((o) => new RegExp(`\\b${o}\\b`, "i").test(l))); }).map(([id, to]) => `${id}->${to}`);
		out("(p) then each move and share target on its own line by row and target, with its own reason and outcome (refuted or asked; R-005 asked for FEAT-001, refuted for FEAT-004) (R-1179, T16)", targetMiss, []);
		const lastTarget = Math.max(...targetSpec.map(([, , r]) => pos(r)));
		const rejAt = pos(T.reject);
		const rejEntry = entry(T.reject);
		out("(p) then each rejected claim with its reason, identifying the claim (R-1179, T16)", [rejAt > lastTarget, (word(L30).test(rejEntry) && word("FEAT-004").test(rejEntry)) || rejEntry.includes(P0.regroup.reasons.find((r) => r.line === L30 && r.to === "FEAT-004").why)], [true, true]);
		const placedMiss = FX_PLACED.filter((id) => {
			const reason = P0.regroup.placed[id];
			const l = lineAround(pos(reason));
			const gist = (FXTEXT.get(id) ?? "").split(/\s+/).slice(0, GIST ?? 0).join(" ");
			return !(GIST !== null && pos(reason) > rejAt && word(id).test(l) && word(FX_HOME[id]).test(l) && l.includes(gist));
		});
		out("(p) then each text-placed row with its ID, opening GIST_WORDS words, home and reason on one line (R-1179, T16)", [GIST, placedMiss], [12, []]);
		const lastPlaced = Math.max(...FX_PLACED.map((id) => pos(P0.regroup.placed[id])));
		const allIds = new Set(mappingNodes(P0).map((x) => x.id));
		const appendixMiss = FXROWS.filter((r) => {
			const i = pos(r.text);
			if (!(i > lastPlaced) || page.indexOf(r.text, i + 1) >= 0) return true;
			const before = page.slice(lastPlaced, i);
			const ids = [...before.matchAll(NODE_ID)].map((m) => m[1]).filter((id) => allIds.has(id));
			return ids.at(-1) !== FX_HOME[r.id];
		}).map((r) => r.id);
		out("(p) and only then the appendix: each row's full text appears once, after the lists, under its new node (R-1179, T16)", [lastPlaced > 0, appendixMiss], [true, []]);
	}

	// ---------------------------------------------------------------- (m) seat amendment 2: shares in the review record
	// R-1187, and R-1178/R-1179 as reworded. Read independently: the reserved nodes' seed text from the checkout's own
	// templates/_shared/requirements-general.md. A dropped share needs a tree-form ledger; T24 alone pins that case here.
	{
		const addShare = (q, row, feat) => { const f = mappingNodes(q).find((x) => x.id === feat).node; f.also_applies = [...(f.also_applies ?? []), row]; f.shares_added = [...(f.shares_added ?? []), row]; };
		const shareVerdict = (q, row, feat, why) => { const v = verdictOf(q, row); delete v.reason; v.verdict = "share"; v.targets = [{ to: feat, reason: why }]; };
		refused("(m) FEAT-001 adds R-009 as a share while R-009's verdict stays keep (R-1187, T24)", variant((q) => addShare(q, "R-009", "FEAT-001")), ["R-009", "FEAT-001"]);
		refused("(m) R-003's refuted move target FEAT-004 is also added as a share (R-1187, T24)", variant((q) => addShare(q, "R-003", "FEAT-004")), ["R-003", "FEAT-004"]);
		const SHARE_WHY = "the build budget also bounds file loading (share m1)";
		const sh = runFx("m-share-carried", variant((q) => { addShare(q, "R-009", "FEAT-001"); shareVerdict(q, "R-009", "FEAT-001", SHARE_WHY); }));
		const shLine = (sh.text ?? "").split("\n").find((l) => word("R-009").test(l) && word("FEAT-001").test(l) && /share/i.test(l)) ?? "";
		out("(m) a share added with a share verdict targeting its feature passes, and the page lists R-009 → FEAT-001 marked share, carried, with its reason (R-1187, R-1179, T24, T16)",
			[sh.r.status, crashed(sh.r), /carried/i.test(shLine), (sh.text ?? "").includes(SHARE_WHY)], [0, false, true, true], shLine || own(sh.r.stderr).slice(0, 2).join(" | "));
		// sol plan r3: a move the reviewer refused and the drafter replaced by a share to the same feature is an honest proposal.
		const inst = runFx("m-shared-instead", variant((q) => {
			q.regroup.refuted = q.regroup.refuted.filter((r) => !(r.id === "R-003" && r.to === "FEAT-004"));
			addShare(q, "R-003", "FEAT-004"); shareVerdict(q, "R-003", "FEAT-004", "the reviewer refused the move; the row also applies to rendering, so it is shared instead (share m2)");
		}));
		out("(m) a refused move the drafter replaced by a share to the same feature passes as a carried share (R-1175, R-1187; sol plan r3)", [inst.r.status, crashed(inst.r)], [0, false], own(inst.r.stderr).slice(0, 2).join(" | "));
		const page = pass.text ?? "";
		const tline = (id, to) => page.split("\n").find((l) => new RegExp(`(?<![\\w-])${id}(?![\\w-]).*(?<![\\w-])${to}(?![\\w-])`).test(l) && /refuted|carried|asked/i.test(l)) ?? "";
		out("(m) each target line is marked move or share: R-003 → FEAT-004 move, R-005 → FEAT-001 and R-005 → FEAT-004 share (R-1179, T16)",
			[/\bmove\b/i.test(tline("R-003", "FEAT-004")), /\bshare\b/i.test(tline("R-005", "FEAT-001")), /\bshare\b/i.test(tline("R-005", "FEAT-004"))], [true, true, true], [tline("R-003", "FEAT-004"), tline("R-005", "FEAT-001")].join(" | "));
		out("(m) an asked target names its question's number: R-005 → FEAT-001 reads \"asked in question 1\" (R-1179, T16)", /asked in question 1\b/i.test(tline("R-005", "FEAT-001")), true, tline("R-005", "FEAT-001"));
		const seed = (() => { try { return fs.readFileSync(path.join(root, "templates", "_shared", "requirements-general.md"), "utf8").replace(/\r\n/g, "\n"); } catch { return ""; } })();
		const seedText = (id) => { const ls = seed.split("\n"); const i = ls.findIndex((l) => new RegExp(`^#{1,3} ${id} · `).test(l)); if (i < 0) return null; const label = ls[i].replace(/^#{1,3} \S+ · /, ""); let purpose = null; for (let k = i + 1; k < ls.length && !/^#/.test(ls[k]); k++) { const m = /^Purpose: (.*)$/.exec(ls[k]); if (m) { purpose = m[1]; break; } } return { label, purpose }; };
		const resIds = mappingNodes(P0).filter((x) => RESERVED.has(x.id)).map((x) => x.id);
		out("(m) every reserved node in the proposal shows the seed's label and purpose on the page, never a blank (R-1178 as reworded, T14)",
			[resIds.length > 0, resIds.filter((id) => { const t = seedText(id); return !t || !t.purpose || !page.includes(t.label) || !page.includes(t.purpose); })], [true, []]);
		const tableStart = page.search(/^\|.*FEAT-0\d\d/m);
		const tableRows = tableStart < 0 ? [] : page.slice(tableStart).split("\n").filter((l) => l.startsWith("|"));
		const feats = mappingNodes(P0).filter((x) => x.level === 2 && !RESERVED.has(x.id));
		out("(m) the feature table names each feature with its label and its status (R-1178 as reworded, T14)",
			feats.filter((x) => { const l = tableRows.find((r) => word(x.id).test(r)) ?? ""; return !l.includes(x.node.label) || !word(x.node.status).test(l); }).map((x) => x.id), [], tableRows.slice(0, 3).join(" / "));
		out("(m) no node heading on the page is indented four or more spaces (a Markdown code block) (R-1178, T14)", page.split("\n").filter((l) => /^ {4,}\S/.test(l) && /(CAP|FEAT|SUB)-\d/.test(l)).length, 0);
	}

	// ---------------------------------------------------------------- (x) aml-desk and (y) basketball-geek: the copies
	ledgerCases: {
		const SRC = { aml: "aml-desk", bg: "basketball-geek-HEAD" };
		const LB = {};
		for (const [k, d] of Object.entries(SRC)) LB[k] = readBuf(path.join(LEDGERS, d, "REQUIREMENTS.md"));
		const pinMisses = Object.entries(SRC).map(([k, d]) => (LB[k] === null ? `${d}: missing` : sha(LB[k]) !== LEDGER_SHA256[d] ? `${d}: changed (sha256 ${sha(LB[k]).slice(0, 12)})` : null)).filter(Boolean);
		if (!out(`(harness) the seat's aml-desk and basketball-geek HEAD copies under ${LEDGERS} exist and match their pinned SHA-256`, pinMisses, [])) { console.log("skip (x) and (y): the seat's ledger copies failed their pins (harness case above)"); break ledgerCases; }
		/** A mechanical proposal: every heading kept unless edited, purposes and outcomes rewritten, every reason, verdict, claim and placed reason present. */
		const mechanical = (buf, mapping, dir) => {
			const p = structuredClone(mapping);
			for (const x of mappingNodes(p)) {
				if (RESERVED.has(x.id)) continue;
				const label = x.node.label ?? x.id;
				x.node.purpose = `Hold the rows the old ledger kept under "${label}".`;
				if (x.level === 1) x.node.outcome = `The rows the old ledger kept under "${label}" hold.`;
			}
			const reasons = reportedLines(buf, p).map((r, k) => ({ line: r.line, to: r.to, why: `the rows under this old line serve this node (mechanical ${tag(k)})` }));
			const home = homes(p);
			const placedIds = textPlaced(buf, dir);
			p.regroup = { read: [], reasons, placed: Object.fromEntries(placedIds.map((id, k) => [id, `placed by its text (mechanical ${tag(k)})`])), evidence: {},
				review: { drafter: "anthropic", reviewer: "openai", verdicts: ledgerRows(buf).map((r, k) => ({ id: r.id, at: home.get(r.id), verdict: "keep", reason: `mechanical keep ${tag(k)}` })), claims: [] }, refuted: [], questions: [] };
			p.regroup.review.claims = claimsFor(p);
			return p;
		};
		const realRoot = (label, buf) => { const d = path.join(scratch, label); fs.mkdirSync(path.join(d, "docs", "regroup"), { recursive: true }); fs.writeFileSync(path.join(d, "REQUIREMENTS.md"), buf); return d; };
		const emit = (dir) => { const f = path.join(scratch, `${path.basename(dir)}-default.json`); const r = lift(["--root", dir, "--emit-mapping", f], scratch); return { r, map: readText(f) ? JSON.parse(readText(f)) : null }; };

		// (x) aml-desk, straight from flat.
		{
			const dir = realRoot("aml-desk", LB.aml);
			const em = emit(dir);
			const ok = out("(harness) aml-desk's copy: the lift emits its default mapping (exit 0)", em.r.status, 0, own(em.r.stderr).slice(0, 2).join(" | "));
			if (ok) {
				const p = structuredClone(em.map);
				const n36 = mappingNodes(p).find((x) => (x.node.from ?? []).some((f) => f.line === 501));
				const n570 = mappingNodes(p).find((x) => (x.node.from ?? []).some((f) => f.line === 570));
				const n484 = mappingNodes(p).find((x) => (x.node.from ?? []).some((f) => f.line === 484));
				const n572 = mappingNodes(p).find((x) => (x.node.from ?? []).some((f) => f.line === 572)); // ### Lane A — normalize, under the second 36b
				// §36's "Scale lane" rows: from the note opening "Scale lane" to the next prose line.
				const ls = segs(LB.aml).map(bare);
				const scaleAt = ls.findIndex((l, i) => i > 500 && i < 569 && l.startsWith("Scale lane"));
				const scaleRows = [];
				for (let i = scaleAt + 1; scaleAt > 0 && i < 569; i++) { const r = ROW.exec(ls[i]); if (r) scaleRows.push(r[1]); else if (ls[i] !== "" && ls[i] !== TABLE_HEADER && !DELIM.test(ls[i])) break; }
				const leaf = (x) => x.node;
				if (n36 && n572 && scaleRows.length) { leaf(n36).rows = expandIds(leaf(n36).rows).filter((id) => !scaleRows.includes(id)); leaf(n572).rows = [...expandIds(leaf(n572).rows), ...scaleRows]; }
				out("(harness) aml-desk: lines 484 and 570 hold the same `## 36b. Build at production size` text under different default nodes, and §36 (line 501) holds a Scale lane block of rows",
					[ls[483], ls[569], Boolean(n484 && n570 && n484.id !== n570.id), n572?.level ?? null, scaleRows.length > 0], ["## 36b. Build at production size", "## 36b. Build at production size", true, 3, true], `scale rows ${scaleRows.join(",")}`);
				const prop = mechanical(LB.aml, p, dir);
				fs.writeFileSync(path.join(dir, PROP_REL), `${JSON.stringify(prop, null, 2)}\n`);
				const dry = lift(["--root", dir, "--mapping", path.join(dir, PROP_REL)], scratch);
				const rep = reportOf(dry.stdout);
				const want = keys(reportedLines(LB.aml, prop));
				out(`(x) aml-desk: the proposal's dry run exits 0 and prints exactly its ${want.length} reported lines, lines 484 and 570 apart and §36's Scale lane rows as one move line (R-1170, §5)`,
					[dry.status, rep.odd.length, keys(rep.recs).length === want.length && JSON.stringify(keys(rep.recs)) === JSON.stringify(want), rep.recs.filter((x) => x.heading === "## 36b. Build at production size" && x.rows.length === 0).map((x) => x.line).sort()], [0, 0, true, [484, 570]],
					rep.odd.slice(0, 2).join(" | ") + own(dry.stderr).slice(0, 2).join(" | "));
				const page = path.join(PAGES, "aml-desk.md");
				const before = fileList(dir);
				const r = regroup(["--root", dir, "--proposal", path.join(dir, PROP_REL), "--out", page], scratch);
				const pg = readText(page) ?? "";
				const lineOfPage = (s) => { const i = pg.indexOf(s); if (i < 0) return ""; const st = pg.lastIndexOf("\n", i) + 1; const e = pg.indexOf("\n", i); return pg.slice(Math.max(0, pg.lastIndexOf("\n", st - 2) + 1), e < 0 ? pg.length : e); };
				const both = [484, 570].map((ln) => { const rs = prop.regroup.reasons.find((x) => x.line === ln && x.to === (ln === 484 ? n484.id : n570.id)); return rs ? word(ln).test(lineOfPage(rs.why)) : false; });
				out("(x) aml-desk: the check exits 0, writes the page and changes nothing under the root, and the page gives line 484 and line 570 each its own reason (§5 seat acceptance)",
					[r.status, crashed(r), pg !== "", JSON.stringify(fileList(dir)) === JSON.stringify(before), both], [0, false, true, true, [true, true]], own(r.stderr).slice(0, 3).join(" | "));
				if (pg) console.log(`info (x) aml-desk: the mechanical packet is ${pg.split(/\s+/).filter(Boolean).length} words, appendix included (the seat records the real one's words and minutes, §7 J2)`);
				// Residual 3: §36 split, its lane notes stay above one table under the node naming line 501.
				const repo = path.join(scratch, "aml-git");
				fs.mkdirSync(path.join(repo, "docs", "regroup"), { recursive: true });
				fs.writeFileSync(path.join(repo, "REQUIREMENTS.md"), LB.aml);
				fs.writeFileSync(path.join(repo, PROP_REL), `${JSON.stringify(prop, null, 2)}\n`);
				for (const a of [["init", "-q", "-b", "main"], ["config", "core.autocrlf", "false"], ["add", "-A"], ["commit", "-qm", "flat and proposal"]]) gitIn(repo, ...a);
				const w = lift(["--root", repo, "--mapping", path.join(repo, PROP_REL), "--write"], scratch);
				const outLs = segs(readBuf(path.join(repo, "REQUIREMENTS.md")) ?? "").map(bare);
				const notes = ls.slice(501, 569).filter((l) => l !== "" && !ROW.test(l) && l !== TABLE_HEADER && !DELIM.test(l) && !/^#/.test(l));
				const hAt = outLs.findIndex((l) => TREE_HEADING.exec(l)?.[2] === n36?.id);
				const nextH = outLs.findIndex((l, i) => i > hAt && TREE_HEADING.test(l));
				const firstTable = outLs.findIndex((l, i) => i > hAt && l === TABLE_HEADER);
				const at = notes.map((nt) => outLs.map((l, i) => (l === nt ? i : -1)).filter((i) => i >= 0));
				out("(guard) aml-desk, §36 split by --write in a scratch git copy: each of its lane notes lands once, in order, under the node naming line 501 and above its one table (residual 3)",
					[w.status, notes.length > 3, at.every((a) => a.length === 1), at.every((a, k) => k === 0 || (a[0] ?? -1) > (at[k - 1][0] ?? -1)), at.every((a) => a[0] > hAt && a[0] < firstTable), outLs.slice(hAt + 1, nextH < 0 ? outLs.length : nextH).filter((l) => l === TABLE_HEADER).length],
					[0, true, true, true, true, 1], own(w.stderr).slice(0, 2).join(" | "));
			}
		}
		// (y) basketball-geek's HEAD copy, end to end.
		{
			const dir = realRoot("bg-head", LB.bg);
			const em = emit(dir);
			const ok = out("(harness) basketball-geek's HEAD copy: the lift emits its default mapping (exit 0)", em.r.status, 0, own(em.r.stderr).slice(0, 2).join(" | "));
			if (ok) {
				const p = structuredClone(em.map);
				const feats = mappingNodes(p).filter((x) => x.level === 2);
				const [f1, f2, f3, f4] = feats.map((x) => x.node);
				const cap = p.tree.find((c) => c.features.includes(f2));
				f1.from = [...f1.from, ...f2.from]; f1.rows = [...expandIds(f1.rows), ...expandIds(f2.rows)]; cap.features = cap.features.filter((x) => x !== f2);
				const movedRow = expandIds(f3.rows)[0];
				f3.rows = expandIds(f3.rows).slice(1); f4.rows = [...expandIds(f4.rows), movedRow];
				const prop = mechanical(LB.bg, p, dir);
				fs.writeFileSync(path.join(dir, PROP_REL), `${JSON.stringify(prop, null, 2)}\n`);
				const page = path.join(PAGES, "bg-head.md");
				const r = regroup(["--root", dir, "--proposal", path.join(dir, PROP_REL), "--out", page], scratch);
				out(`(y) basketball-geek HEAD: a proposal merging ${f2.id} into ${f1.id} and moving ${movedRow} to ${f4.id}: the check exits 0 and writes its page (§5 seat acceptance)`, [r.status, crashed(r), fs.existsSync(page)], [0, false, true], own(r.stderr).slice(0, 3).join(" | "));
				const repo = path.join(scratch, "bg-git");
				fs.mkdirSync(path.join(repo, "docs", "regroup"), { recursive: true });
				fs.writeFileSync(path.join(repo, "REQUIREMENTS.md"), LB.bg);
				for (const a of [["init", "-q", "-b", "main"], ["config", "core.autocrlf", "false"], ["add", "-A"], ["commit", "-qm", "flat"]]) gitIn(repo, ...a);
				const B = gitIn(repo, "rev-parse", "HEAD").stdout.trim();
				fs.writeFileSync(path.join(repo, PROP_REL), `${JSON.stringify(prop, null, 2)}\n`);
				gitIn(repo, "add", PROP_REL); gitIn(repo, "commit", "-qm", "proposal, with the owner's yes");
				const w = lift(["--root", repo, "--mapping", path.join(repo, PROP_REL), "--write"], scratch);
				gitIn(repo, "commit", "-qam", "regroup");
				const v = lift(["--root", repo, "--verify", B, "--mapping", path.join(repo, PROP_REL)], scratch);
				const plain = lift(["--root", repo, "--verify", B], scratch);
				out("(guard) basketball-geek HEAD in a scratch git copy: the committed proposal writes with --write, and after the commit `--verify <base> --mapping <proposal>` exits 0 while plain `--verify <base>` exits 1 (§3.5 step 6, FR 43)",
					[w.status, v.status, plain.status], [0, 0, 1], own(w.stderr).concat(own(v.stderr)).slice(0, 3).join(" | "));
			}
		}
	}
} finally {
	fs.rmSync(scratch, { recursive: true, force: true });
}

// ---------------------------------------------------------------- (s) the requirements skill (R-1180, §3.5)
const skillRaw = text("packages/nana-pack/skills/requirements/SKILL.md") ?? "";
const reqSkill = collapse(skillRaw);
const description = /^description:(.*)$/m.exec(skillRaw.split(/^---$/m)[1] ?? "")?.[1] ?? "";
out("(s) the skill description carries \"regroup\" (R-1180)", /\bregroup\b/i.test(description), true, description.slice(0, 200));
const paras = skillRaw.split(/\n\s*\n/);
const rgParas = paras.filter((p) => collapse(p).includes(REGROUP_SKILL_CMD));
const para = collapse(rgParas[0] ?? "");
out("(s) exactly one skill paragraph names the regroup check as R-1180's command (R-1180, T17)", rgParas.length, 1);
out("(s) that paragraph says every row's placement and every purpose, outcome and section reason are reviewed by another model lineage or a same-family reviewer named as such, --write only after the owner's yes with the proposal committed, `--verify <base> --mapping <proposal>`, and a gap as a proposed feature with no rows (R-1180, T17)",
	["every row's placement", "every purpose, outcome and section reason", "lineage", "same-family", "only after the owner's yes", "--write", "committed", "--verify <base> --mapping <proposal>", "proposed", "with no rows"].filter((s) => !para.includes(s)), []);
out("(s) that paragraph lists what the agent reads, J1's recommendation: req: markers, @purpose headers, the code map, the README, OBJECTIVE.md and HANDOFF (R-1180, §3.5 step 2)",
	["req:", "@purpose", "code map", "README", "OBJECTIVE.md", "HANDOFF"].filter((s) => !para.includes(s)), []);
out("(s) in that paragraph `--verify <base>` never appears without `--mapping` (R-1180, FR 43)", [para.includes("--verify"), (para.match(/--verify <base>(?! --mapping)/g) ?? []).length], [true, 0]);
const FLAG = /(?<![\w-])--[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?![\w-])/g;
const wholeFlag = (src, f) => new RegExp(`(?<![\\w-])${f}(?![\\w-])`).test(src ?? "");
const regroupSource = text(REGROUP_SCRIPT);
const liftSource = text(LIFT_SCRIPT);
{
	const p = rgParas[0] ?? "";
	const spans = [...p.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
	const inSpan = [...new Set(spans.filter((s) => s.includes("requirements-regroup.mjs")).flatMap((s) => s.match(FLAG) ?? []))].sort();
	const outside = [...new Set([...spans.filter((s) => !s.includes("requirements-regroup.mjs") && (s.includes("requirements-lift.mjs") || !/\.(?:mjs|cjs|js|ts|py)\b/.test(s))), p.replace(/`[^`]*`/g, " ")].flatMap((s) => s.match(FLAG) ?? []))].sort();
	out("(s) every flag inside the regroup command's span is in the regroup's source, and every flag elsewhere in the paragraph is in the lift's (R-1180, §3.5: T29's /lift/ scan)",
		[regroupSource !== null, inSpan.filter((f) => !wholeFlag(regroupSource, f)), outside.filter((f) => !wholeFlag(liftSource, f)), ["--root", "--proposal", "--out"].every((f) => inSpan.includes(f))], [true, [], [], true], `span ${inSpan.join(" ")}; outside ${outside.join(" ")}`);
}
out("(s) the lift paragraph's old clause \"name no regroup command until that lane lands\" is gone (§3.5)", reqSkill.includes("name no regroup command"), false);
out("(guard) the requirements skill keeps T29's lift phrases (R-1169)", [LIFT_SKILL_CMD, "only after the owner's yes", "matches HEAD in every worktree", "never commit, stash or discard another session's lines"].filter((p) => !reqSkill.includes(p)), []);
{
	const liftParas = skillRaw.split(/\n\s*\n/).filter((p) => /requirements-lift\.mjs|\blift\b/i.test(p));
	const liftFlags = [...new Set(liftParas.flatMap((p) => {
		const spans = [...p.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((s) => s.includes("requirements-lift.mjs") || !/\.(?:mjs|cjs|js|ts|py)\b/.test(s));
		return [...spans, p.replace(/`[^`]*`/g, " ")].flatMap((s) => s.match(FLAG) ?? []);
	}))].sort();
	out("(guard) T29's scan: every flag the skill shows in a paragraph about the lift, outside a regroup span, is in the lift's source (R-1169)", liftFlags.filter((f) => !wholeFlag(liftSource, f)), [], liftFlags.join(" "));
}

// ---------------------------------------------------------------- (e) rows
const change = spec("CHANGE.md");
const delta = change.slice(change.indexOf("## 2. Requirement delta"), change.indexOf("## 3. Design"));
const draftRows = (sec) => sec.split("\n").filter((l) => /^\| R-\d+ \|/.test(l)).map((l) => { const c = l.split("|").map((s) => s.trim()); return [c[1], c[3]]; });
// Seat amendment 2 (2026-10-16) adds R-1187 and rewords R-1178 and R-1179; its table overrides §2's text for those rows.
const amend2 = change.indexOf("## Seat amendment 2") >= 0 ? change.slice(change.indexOf("## Seat amendment 2")) : "";
const drafts = new Map([...draftRows(delta), ...draftRows(amend2)]);
const NEW = [...Array.from({ length: 11 }, (_, i) => `R-${1170 + i}`), "R-1184", "R-1187"];
const HELD = ["R-1181", "R-1182", "R-1183"];
const shalls = (s) => ((s ?? "").replace(/`[^`]*`/g, "").match(/\bshall\b/gi) ?? []).length;
out("(harness) CHANGE §2 and seat amendment 2 give one-shall text for each of R-1170 to R-1180, R-1184 and R-1187, and the lane adds thirteen rows", [NEW.map((id) => shalls(drafts.get(id))), drafts.size, LANE_ROWS_ADDED], [NEW.map(() => 1), 13, 13]);
const reqLines = lines(text("REQUIREMENTS.md"));
const baseReqLines = lines(atBase("REQUIREMENTS.md"));
const rowAt = (id, ls = reqLines) => ls.findIndex((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
const cells = (id, ls = reqLines) => { const i = rowAt(id, ls); return i < 0 ? [] : ls[i].split(/(?<!\\)\|/).map((s) => s.trim()); };
const headingOf = (i) => { for (let k = i; k >= 0; k--) if (/^#{1,3} /.test(reqLines[k])) return reqLines[k].replace(/ ·.*$/, "").replace(/^#+ /, ""); return null; };
for (const id of NEW) {
	const rows = reqLines.filter((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
	out(`(e) ${id} is one row carrying CHANGE §2's text with exactly one "shall"`, [rows.length, shalls(cells(id)[2]), cells(id)[2] ?? null], [1, 1, drafts.get(id) ?? "(no draft)"]);
}
// §2: R-1170 after R-1168, R-1171 to R-1179 in turn, R-1184 after R-1179, in FEAT-028; R-1180 after R-1169 in FEAT-032.
// Once regroup-shares is on the base, its rows R-1181 to R-1183 come first and this lane's follow them (the shares plan's
// second-lander rule); seat amendment 2 puts R-1187 after R-1184.
const sharesAnchor = ["R-1183", "R-1182", "R-1181"].find((id) => rowAt(id, baseReqLines) >= 0) ?? "R-1168";
const BLOCKS = [[sharesAnchor, "FEAT-028", [...NEW.slice(0, 10), "R-1184", "R-1187"]], ["R-1169", "FEAT-032", ["R-1180"]]];
for (const [anchor, home, ids] of BLOCKS) {
	const chain = [anchor, ...ids];
	out(`(e) ${ids.length > 1 ? `${ids.join(", ")} follow` : `${ids[0]} follows`} ${anchor} line by line in ${home} (§2)`,
		[ids.filter((id, k) => rowAt(id) < 0 || rowAt(id) !== rowAt(chain[k]) + 1), ids.filter((id) => headingOf(rowAt(id)) !== home)], [[], []]);
}
const { entries, tree: rtTitles } = required("1", root);
const sourceCache = new Map();
const sourcesOf = (file, title) => { if (!sourceCache.has(file)) sourceCache.set(file, checkTitles(path.join(root, file)) ?? new Map()); return (sourceCache.get(file).get(title) ?? []).map((x) => `${file}::${x.cite}`); };
const cites = (s) => [...(s ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]);
for (const id of NEW) {
	const mine = entries.filter(([, , rows]) => rows.includes(id));
	const want = [...new Set(mine.flatMap(([file, title]) => { const s = sourcesOf(file, title); return s.length ? s : [`${file}::${title} (not in the test file)`]; }))];
	const ev = cites(cells(id)[4]);
	out(`(e) ${id}'s evidence cites its ${mine.length} §5 title(s) as the rail reads them`, want.length ? want.filter((c) => !ev.includes(c)) : "no §5 title for this row", []);
}
out("(e) R-1170 to R-1180, R-1184, R-1187 and R-291 read implemented", [...NEW, "R-291"].filter((id) => (cells(id)[3] ?? "") !== "implemented"), []);
{
	const markers = [];
	for (const dir of ["packages/nana-pack/tests", "packages/nana-knowledge/tests", "packages/nana-setup/tests", "packages/nana-stage/tests", "apps/bench/test", "apps/desk/test", "scripts"]) {
		const walk = (d) => { let es = []; try { es = fs.readdirSync(path.join(root, d), { withFileTypes: true }); } catch { return; } for (const e of es) { const rel = path.join(d, e.name); if (e.isDirectory()) { if (e.name !== "node_modules") walk(rel); } else if (/\.(mjs|js|ts|cjs)$/.test(e.name)) { const t = text(rel) ?? ""; for (const l of t.split("\n")) if (/\/\/\s*req:/.test(l) && HELD.some((h) => word(h).test(l))) markers.push(`${rel}: ${l.trim()}`); } } };
		walk(dir);
	}
	if (HELD.every((id) => rowAt(id, baseReqLines) >= 0)) out("(guard) R-1181 to R-1183 are base rows now that regroup-shares has landed, each still one row", HELD.map((id) => reqLines.filter((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l)).length), [1, 1, 1]);
	else out("(guard) R-1181 to R-1183 stay unused: no ledger row and no req: marker names them (§2: held for regroup-shares)", [HELD.filter((id) => rowAt(id) >= 0), markers], [[], []]);
}
out("(guard) R-291's evidence keeps every base citation other than the base leaf-total title", rtTitles.error ? rtTitles.error : cites(cells("R-291", baseReqLines)[4]).filter((c) => !c.endsWith(rtTitles.before) && !cites(cells("R-291")[4]).includes(c)), []);
const baseIds = baseReqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
const headIds = reqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
out("(guard) no base row changes its Requirement text or Status (§2)", baseIds.filter((id) => { const a = cells(id, baseReqLines), b = cells(id); return a[2] !== b[2] || a[3] !== b[3]; }), []);
out(`(e) the row set is the base's plus R-1170 to R-1180, R-1184 and R-1187, each once: leaf total ${baseIds.length} → ${baseIds.length + LANE_ROWS_ADDED} (§2)`,
	{ added: headIds.filter((id) => !baseIds.includes(id)).sort(), removed: baseIds.filter((id) => !headIds.includes(id)), count: headIds.length }, { added: [...NEW].sort(), removed: [], count: baseIds.length + NEW.length });
out("(e) the leaf totals agree with R-291's renamed title (T18)", rtTitles.error ? rtTitles.error : [rtTitles.beforeTotal, rtTitles.afterTotal], [baseIds.length, headIds.length]);
const treeHeads = (ls) => ls.filter((l) => /^#{1,3} (CAP|FEAT|SUB)-/.test(l));
out(`(guard) nana-pi's tree headings are the base's (${treeHeads(baseReqLines).length}; §2 "no heading is added")`, treeHeads(reqLines), treeHeads(baseReqLines));
out("(harness) R-1170 to R-1184 are unused in the base ledger (§2)", baseReqLines.filter((l) => /\bR-11(7\d|8[0-4])\b/.test(l)).length, 0);
const rail = node(["scripts/requirements-trace.mjs"]);
out("(guard) the trace rail is green: node scripts/requirements-trace.mjs exits 0 (§5 Suite)", rail.status, 0, (rail.stdout + rail.stderr).split("\n").filter((l) => /^\s{2}\S/.test(l)).slice(0, 5).join(" | "));

// ---------------------------------------------------------------- (f) scope
// §4 "In.", quoted: "New `scripts/requirements-regroup.mjs` and `packages/nana-pack/tests/requirements-regroup.test.mjs` (six-tag
// headers). `scripts/requirements-lift.mjs`: `detectMoves` (export, line key, heading records, row IDs) and the plan loop's
// print, nothing else; `requirements-lift.test.mjs` gains T1. `SKILL.md`: description and regroup paragraph.
// `templates-render.test.mjs` …, `requirements-tree.test.mjs` …. `README.md` names the new script on its own physical line …
// `REQUIREMENTS.md` (12 rows), regenerated `docs/requirements-tree.md` and `docs/code-map.md`, `HANDOFF.md`,
// `docs/sessions/2026-10.md`, this corpus."
const TRACE_TEMPLATE = "templates/typescript/template/tests/requirements-trace.ts";
const SCOPE = [REGROUP_SCRIPT, RG, LIFT_SCRIPT, LT, "packages/nana-pack/skills/requirements/SKILL.md", TR, RT,
	"README.md", "REQUIREMENTS.md", "docs/requirements-tree.md", "docs/code-map.md", "HANDOFF.md", "docs/sessions/2026-10.md",
	// Seat amendment (2026-10-16): the trace rail's citation split, extracted unchanged so the checker imports it.
	"scripts/requirements-trace.mjs", TRACE_TEMPLATE];
const SCOPE_PREFIX = "docs/reviews/regroup-2026-10-15/";
const diff = git("diff", "--name-only", `${base}..HEAD`);
const changed = diff.stdout.split("\n").filter(Boolean);
out(`(guard) git diff --name-only ${base.slice(0, 7)}..HEAD lists only §4 In paths and this review folder`, diff.status === 0 ? changed.filter((p) => !SCOPE.includes(p) && !p.startsWith(SCOPE_PREFIX)) : `git exit ${diff.status}`, []);
// §3.6: "No change to the lift's validation, apply, proof, write gate or verify; the tree checker; `scripts/product-report.mjs`;
// the seeds; the five pi skills …; `packages/nana-setup/**`; any other project's files."
const FIVE = ["scaffold-py", "scaffold-ts", "adopt-py", "adopt-ts", "adopt-structure"];
const FROZEN_PREFIX = [PROOF_SCRIPT, RT_SCRIPT, "scripts/product-report", "templates/", "packages/nana-setup/", ...FIVE.map((s) => `packages/nana-pack/skills/${s}/`)];
out("(guard) the merge-base diff touches nothing §3.6 names (the proof, the tree checker, the product report, the seeds, the five pi skills, nana-setup), less the seat amendment's trace template", changed.filter((p) => p !== TRACE_TEMPLATE && FROZEN_PREFIX.some((x) => p.startsWith(x))), []);
// Seat amendment (2026-10-16): the template's diff is the citation split moved into an exported citesOf, nothing else.
{
	const td = git("diff", "-U0", `${base}..HEAD`, "--", TRACE_TEMPLATE);
	const minus = td.stdout.split("\n").filter((l) => l.startsWith("-") && !l.startsWith("---")).map((l) => l.slice(1).trim());
	const plus = td.stdout.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++")).map((l) => l.slice(1).trim());
	const moved = minus.filter((l) => !l.startsWith("//") && l !== "const cites = (" && l !== ")");
	const ok = td.status === 0 && plus.includes("export function citesOf(evidence: string): string[] {") && plus.includes("const cites = citesOf(evidence);")
		&& moved.every((l) => plus.includes(l)) && plus.filter((l) => /^export /.test(l)).length === 1;
	out("(guard) the trace template's change is the citation split moved unchanged into one exported citesOf (seat amendment 2026-10-16)", ok, true, `minus=${minus.length} plus=${plus.length}`);
}
/** The lift with detectMoves (its JSDoc and body) and the plan loop's move print removed: what §3.6 freezes. */
const liftRest = (src) => {
	if (src === null) return null;
	const ls = src.split("\n");
	// Seat amendment 2: the regroup page shows the reserved nodes' seed text, so the lift may export loadSeed and seedNodeText.
	for (let k = 0; k < ls.length; k++) ls[k] = ls[k].replace(/^export function (loadSeed|seedNodeText)\(/, "function $1(");
	const fi = ls.findIndex((l) => /^(?:export )?function detectMoves\(/.test(l));
	if (fi < 0) return "no detectMoves";
	let s = fi; while (s > 0 && /^(?:\/\*\*|\s\*)/.test(ls[s - 1])) s--;
	let e = fi; while (e < ls.length && ls[e] !== "}") e++;
	const kept = [...ls.slice(0, s), ...ls.slice(e + 1)];
	const p = kept.findIndex((l) => l.includes("for (const n of planNodes) console.log("));
	const q = kept.findIndex((l, i) => i > p && /^\s*if \(proof\.problems\.length\)/.test(l));
	if (p < 0 || q < 0 || kept[p + 1]?.trim() !== "}") return "no plan loop";
	return [...kept.slice(0, p + 2), ...kept.slice(q)].join("\n");
};
const baseLift = atBase(LIFT_SCRIPT);
out("(guard) the lift differs from the base only inside detectMoves and the plan loop's print after the row counts (§3.2, §3.6: \"Nothing else in the lift changes\")", liftRest(liftSource) === liftRest(baseLift) && typeof liftRest(baseLift) === "string" && liftRest(baseLift).length > 1000, true);
const header = (src) => { const m = /^(?:#!.*\n)?\/\*\*([\s\S]*?)\*\//.exec(src ?? ""); return m ? m[1] : ""; };
const TAGS = ["@module", "@purpose", "@inputs", "@outputs", "@effects", "@errors"];
out("(f) scripts/requirements-regroup.mjs opens with the six-tag header and §3.4's purpose sentence", [TAGS.filter((t) => !header(regroupSource).includes(t)), /@purpose\s+(.*)/.exec(header(regroupSource))?.[1]?.trim() ?? null], [[], REGROUP_PURPOSE]);
out("(f) packages/nana-pack/tests/requirements-regroup.test.mjs opens with the six-tag header (§4 In)", TAGS.filter((t) => !header(text(RG)).includes(t)), []);
{
	const t = probeModule(REGROUP, ["PAGE_SECTIONS", "PROPOSAL_KEYS", "VERDICTS", "CLAIM_VERDICTS", "PAGE_HEAD", "GIST_WORDS", "LIFT_SCRIPT"]);
	const arr = (v) => { const u = unwrap(v); return Array.isArray(u) ? [...u].sort() : u; };
	out("(f) the regroup module exports its tunables by name: VERDICTS keep/move/share, CLAIM_VERDICTS accept/reject, GIST_WORDS 12, PAGE_HEAD, PAGE_SECTIONS, PROPOSAL_KEYS and LIFT_SCRIPT naming the lift (§3.4)",
		t ? [arr(t.VERDICTS), arr(t.CLAIM_VERDICTS), t.GIST_WORDS, typeof t.PAGE_HEAD === "string" && t.PAGE_HEAD.length > 0, present(t.PAGE_SECTIONS) && Array.isArray(unwrap(t.PAGE_SECTIONS)) && unwrap(t.PAGE_SECTIONS).length > 0, present(t.PROPOSAL_KEYS) && typeof t.PROPOSAL_KEYS === "object", typeof t.LIFT_SCRIPT === "string" && t.LIFT_SCRIPT.endsWith("requirements-lift.mjs")] : "module did not load",
		[["keep", "move", "share"], ["accept", "reject"], 12, true, true, true, true]);
}
{
	const src = regroupSource ?? "";
	const imp = (from) => [...src.matchAll(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']\\./${from.replace(/\./g, "\\.")}["']`, "g"))].flatMap((m) => m[1].split(",").map((s) => s.trim().split(/\s+as\s+/)[0]));
	const fromLift = imp("requirements-lift.mjs"), fromTree = imp("requirements-tree.mjs");
	out("(f) the regroup module imports PROBLEM_LINE_CAP, UNSORTED_PREFIX and detectMoves from the lift and parseLedger and readRequirementRows from the tree module, defines neither tunable itself, and spawns process.execPath with no shell (§3.4)",
		[["PROBLEM_LINE_CAP", "UNSORTED_PREFIX", "detectMoves"].filter((k) => !fromLift.includes(k)), ["parseLedger", "readRequirementRows"].filter((k) => !fromTree.includes(k)), /\b(?:const|let|var)\s+(?:PROBLEM_LINE_CAP|UNSORTED_PREFIX)\b/.test(src), src.includes("process.execPath"), /shell\s*:\s*true/.test(src)],
		[[], [], false, true, false]);
}
{
	const readme = text("README.md") ?? "";
	const rl = readme.split("\n").filter((l) => l.includes("requirements-regroup.mjs"));
	const firstBare = (l) => /(?<![\w$/.-])(scripts\/[\w.-]+\.(?:mjs|js|ts|py))/.exec(l.replace(/\$HOME\/nana-pi\/scripts\/[\w.-]+/g, " "))?.[1] ?? null;
	out("(f) README names the regroup script on a physical line whose first bare scripts/ path is scripts/requirements-regroup.mjs (§4 In; readme-check gives a line's flags to that path)", rl.some((l) => firstBare(l) === REGROUP_SCRIPT), true, rl.slice(0, 2).join(" | ").slice(0, 300));
}
for (const [label, args] of [["node scripts/requirements-tree.mjs --check", [RT_SCRIPT, "--check"]], ["map:check (node scripts/code-map.mjs --check)", ["scripts/code-map.mjs", "--check"]], ["readme:check (node scripts/readme-check.mjs)", ["scripts/readme-check.mjs"]]]) {
	const r = node(args);
	out(`(guard) ${label} exits 0 (§5 Suite)`, r.status, 0, (r.stdout + r.stderr).slice(-300));
}
out("(f) HANDOFF.md and the session entry docs/sessions/2026-10.md are in the lane's diff (§4 In, the land checklist)", ["HANDOFF.md", "docs/sessions/2026-10.md"].filter((p) => !changed.includes(p)), []);
{
	const handoff = text("HANDOFF.md") ?? "";
	const baseHandoff = atBase("HANDOFF.md") ?? "";
	const isLine = (l) => /nana-setup/.test(l) && /\binstall\b/.test(l) && /Windows/.test(l) && /requirements skill/i.test(l);
	// The base already holds one such line (the lift's, "[optional, since 2026-10-14] The seat guide on Windows"); the lane
	// writes a new one or rewrites that one, so the case asks for a matching line the base does not hold byte for byte.
	const baseSet = new Set(baseHandoff.split("\n"));
	out("(f) HANDOFF.md gains residual 8's line for Jake, new or rewritten: re-run nana-setup install on the Windows Claude Code seat so its requirements skill copy updates (§7 residual 8)", handoff.split("\n").filter((l) => isLine(l) && !baseSet.has(l)).length > 0, true);
}
// The build must be committed: an untracked or modified path outside this review folder would pass every case above
// that reads the working tree.
out("(guard) the build is committed: no uncommitted or untracked path outside this review folder (§4)", lines(statusBefore).filter((l) => !l.slice(3).startsWith(SCOPE_PREFIX)), []);

// ---------------------------------------------------------------- (g) the §5 titles print PASS
const copierVersion = spawnSync("uvx", ["copier", "--version"], { cwd: root, encoding: "utf8" });
out("(harness) uvx copier is available (templates-render.test.mjs runs with NANA_TEST_REQUIRE_COPIER=1)", copierVersion.status, 0, copierVersion.stderr);
const runs = new Map();
for (const file of [LT, RG, TR, RT]) {
	const r = fs.existsSync(path.join(root, file)) ? node(["--experimental-strip-types", file], root, { env: { ...cleanEnv(), NANA_TEST_REQUIRE_COPIER: "1" } }) : { status: "no file", stdout: "", stderr: "" };
	runs.set(file, r);
	out(`${file === RG ? "(g)" : "(guard)"} ${file} exits 0 (§5 Suite)`, r.status, 0, lines(r.stdout).filter((l) => /^FAIL /.test(l)).slice(0, 3).join(" | ") + own(r.stderr).slice(-2).join(" | "));
}
const printed = (file, w, title) => lines(runs.get(file)?.stdout).filter((l) => l.startsWith(`${w} ${title}`) && l.slice(w.length + 1 + title.length).trim() === "").length;
out("(g) every §5 title prints PASS exactly once and never FAIL or SKIP", entries.filter(([file, title]) => printed(file, "PASS", title) !== 1 || printed(file, "FAIL", title) || printed(file, "SKIP", title)).map(([, title]) => title.slice(0, 60)), [],
	`${entries.length} titles`);

out("(harness) the run wrote nothing inside the checkout (git status unchanged)", statusOf() === statusBefore, true);
console.log(`cases: ${n - bad}/${n} (build cases red: ${badBuild}/${nBuild}; guard and harness red: ${bad - badBuild}/${n - nBuild})`);
console.log(`regroup acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
