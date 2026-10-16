// Seat acceptance for lane regroup-shares (frozen; written by the seat 2026-10-15 before the build, from CHANGE.md §5
// "Seat acceptance" A1–A4, the observable clauses of §2's rows R-1181 to R-1183 and reworded R-1167, §3's design, §3.6
// and §4's scope, plan frozen at e5837c1 after sol plan r1 LAND; sol-plan-r1.md's two SHOULDs are cases (n4) and (v)).
// Hardened 2026-10-15 before the build from the independent verifier's findings: (p), A3's one-ID-per-line check, the
// merge of two features sharing a row, the proof's extra kept line under a capability; (e) reads R-1181 from §2 as
// CHANGE.md's "Seat amendment (2026-10-15): R-1181 one shall" rewords it.
// Run from anywhere inside the checkout under test; the build is read from the cwd's git root, the spec (CHANGE.md,
// seat-titles.mjs) from this script's own folder:
//   node docs/reviews/regroup-shares-2026-10-15/acceptance.mjs
// nana-pi's own ledger is read ONLY as a copy: `git show HEAD:REQUIREMENTS.md`, written into this run's scratch folder.
// (a) seat-titles 1 prints `seat-titles 1: 0 missing`.
// (n) on the copy of nana-pi's ledger (§5 A0–A4): the plain dry run is refused only by the 22 G rows, never by a share
//     (§1, A §3); A1 moves the G rows on the copy's identity (built from the exported buildIdentityMapping) to SUB-900
//     to SUB-904 and lifts with exit 0, the diff holding only the G rows leaving FEAT-033, the CAP-90 block and blank
//     lines in FEAT-033's re-laid span, the 31 share lines byte-equal and the G shares passing the tree check; A2 the
//     emitted identity round-trips byte-identical and --verify passes; A3 a declared drop and add print as two share
//     lines (one row ID each) before the proof line, change exactly two lines, and --verify passes the committed change; R-756 moved into
//     FEAT-033 is refused "is homed in this feature" without the drop and proves with it; A4 an undeclared drop of
//     FEAT-001's eight shares is refused naming each, in the dry run, --write and --verify; the tip's proveLift, called
//     directly, names a deleted kept line ("1 missing"), a changed byte in a kept line, an undeclared add to a kept
//     line, a share line added to a feature with none and a kept line copied under CAP-01's Outcome line ("1 unaccounted
//     extra"), and the recount is independent of also_applies: a declared
//     drop beside a silent one is refused naming the silent one, and an output holding the declared result proves
//     although also_applies says otherwise (R-1182, §3.4).
// (r) one reader (§3.1, R-1167): on built fixtures, an Also applies line that is a second in its span (in the field
//     block, after the table), under a capability or subgroup, in the head, a kept section or the closing heading's
//     span, fenced, under a fence closer underlined by ---, in a flat ledger, and a feature's only share line with no
//     line ending are each refused with §3.1's wording naming the line, in the dry run, --emit-mapping, --write and
//     --verify; a passing tree with shares lifts.
// (b) R-1181's bytes: the identity --write of LF no-space, BOM+CRLF and mixed-ending ledgers keeps each feature's share
//     line byte-identical, and a share line after its table moves up after Status with its bytes and nothing else moved.
// (m) R-1181 and R-1183: a merge of two features that share the same row carries one share line holding both features'
//     shares, as a set, to the merged feature, a demotion carries the demoted feature's share line (bytes kept) to the
//     feature holding the subgroup, and neither prints a share line.
// (p) R-1183's "one line per share": two declared adds on one feature and a drop on another print three share lines
//     before the proof line, one row ID each, the first feature's two lines first.
// (v) R-1167's mapping clause (T8): an undeclared drop or add, a drop not carried, an add carried or of an unknown row, a
//     sharing heading named by a capability or the tail, a string shares_added, and repeated IDs in also_applies,
//     shares_added or shares_dropped (sol r1 SHOULD 2) are each refused, named, in the dry run, and --write and --verify
//     leave the ledger unchanged; empty shares_added and shares_dropped arrays mean no change (sol r1 SHOULD 1).
// (e) rows R-1181 to R-1183 carry §2's text, sit after R-1168 (or after a first lander's rows there) line by line, cite their §5 titles (read
//     from seat-titles.mjs, the one title list) and read implemented, each with one `shall`; R-1167 carries §2's two
//     clause edits on the base text and swaps T22b's citation for T7 and T8; R-291 does not cite the base title; no other
//     base row changes text or status; the row set is the base's plus three.
// (f) `git diff --name-only <base>..HEAD` ⊆ §4 In plus this review folder; nothing in §3.6 (the tree checker, the
//     requirements skill, packages/nana-setup/); MAPPING_FORMAT stays 1; the proof imports nothing from the lift; HANDOFF's
//     share sentence (residual 5); map/readme/tree/trace checks; the build is committed.
// (k) the cross-lane PROPOSAL_KEYS step, only when the regroup lane is on main at the base (§4 Overlap, S11); otherwise
//     a note records that the regroup merge owns it.
// (g) the test files exit 0 and print PASS once for every §5 title, T22 included.
// <base> is `git merge-base main HEAD` (e451c90 when written), so a merge of a newer main moves it with the lane.
// Cases marked (guard) hold at the base too and catch a regression; (harness) cases check this script's inputs; every
// other case depends on the build and reads red at the base. Every copy, repo and fixture lives in one scratch folder
// under the OS temp dir, removed at the end; nothing is written inside the checkout (the last case checks git status)
// or inside any project. No suite test may import or run this file. Not run here: the full `npm run test:locked`
// (the land checklist's), and the Windows CI leg.
// Before the land only: after it, `git merge-base main HEAD` is the tip itself and every build case reads red.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LANE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SEAT_TITLES = path.join(LANE_DIR, "seat-titles.mjs");
const { required, repoRoot, checkTitles, regroupAtBase, LANE_ROWS_ADDED, LT, RT, RG, REGROUP_SCRIPT, T22, T22B } = await import(pathToFileURL(SEAT_TITLES).href);
const root = repoRoot();
if (!fs.existsSync(path.join(LANE_DIR, "CHANGE.md")) || !fs.existsSync(path.join(root, "scripts/requirements-tree.mjs"))) {
	console.error("run inside a nana-pi checkout: node <lane>/docs/reviews/regroup-shares-2026-10-15/acceptance.mjs");
	process.exit(2);
}
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
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, "")); } catch { return null; } };

const LIFT_SCRIPT = "scripts/requirements-lift.mjs";
const PROOF_SCRIPT = "scripts/requirements-lift-proof.mjs";
const RT_SCRIPT = "scripts/requirements-tree.mjs";
const SEED_PATH = "templates/_shared/requirements-general.md";
const LIFT = path.join(root, LIFT_SCRIPT);
const PROOF = path.join(root, PROOF_SCRIPT);
const TREE = path.join(root, RT_SCRIPT);
const ROW = /^\|\s*([RG]-(?:[0-9]{3}|[1-9][0-9]{3}))\s*\|/;
const TABLE_HEADER = "| ID | Requirement | Status | Evidence |";
const DELIM_TEXT = "|---|---|---|---|";
const DELIM = /^\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*$/;
const CLOSING = "# Open questions and deliberate omissions";
// §3.1's two refusal wordings, verbatim.
const NOT_FIRST = (k) => `line ${k}: "Also applies:" is not a feature heading's first share line as the tree checker reads it`;
const NO_ENDING = (k) => `line ${k}: the share line has no line ending (end the file with a line break first)`;
// The proof's summary line is unchanged (§3.6, S6), so the lift acceptance's form still reads it.
const PROOF_LINE = /^lift proof: (\d+) rows kept byte-identical; (\d+) prose lines carried; (\d+) headings replaced; (\d+) lines inserted; tree check 0 problems$/;
// Node's own warning block (MODULE_TYPELESS_PACKAGE_JSON on the .ts import through the trace shim).
const NODE_WARNING = [/^\(node:\d+\) /, /^Reparsing as ES module because/, /^To eliminate this warning, add "type": "module"/, /^\(Use `node --trace-warnings/];
const own = (stderr) => lines(stderr).filter((l) => !NODE_WARNING.some((re) => re.test(l)));
const node = (args, cwd = root, extra = {}) => spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 300_000, env: cleanEnv(), maxBuffer: 64 * 1024 * 1024, ...extra });
const lift = (args, cwd) => node([LIFT, ...args], cwd);
/** A refusal must be the lift's own named one, never Node's crash (a missing module, an uncaught throw and its stack). */
const crashed = (r) => /Cannot find module|\bERR_[A-Z_]+|^\s+at .+:\d+:\d+\)?$/m.test(r?.stderr ?? "") || r?.status === null;
const proofOf = (stdout) => { const ps = lines(stdout).map((l) => PROOF_LINE.exec(l)).filter(Boolean); return ps.length === 1 ? { rows: +ps[0][1], prose: +ps[0][2], headings: +ps[0][3], inserted: +ps[0][4] } : null; };
/** R-1183's plan lines: a line naming a feature, a row and `added` or `dropped`. */
const shareLinesOf = (stdout) => lines(stdout).filter((l) => /\b(added|dropped)\b/.test(l) && /\bFEAT-\d{3}\b/.test(l) && /\b[RG]-\d{3,4}\b/.test(l));
/** The row IDs a plan line names; R-1183's "one line per share" means exactly one per share line. */
const rowIdsIn = (l) => l.match(/\b[RG]-\d{3,4}\b/g) ?? [];
const moveLinesOf = (stdout) => lines(stdout).filter((l) => l.includes(" -> "));
/** The share lines print before the proof line (R-1183): every share line's index is below the proof line's. */
const beforeProof = (stdout) => { const ls = lines(stdout); const p = ls.findIndex((l) => PROOF_LINE.test(l)); return p >= 0 && ls.every((l, i) => !shareLinesOf(l).length || i < p); };
/** A named refusal: one stderr line is the reason, or ends with ": " + the reason (--verify's prefix). */
const named = (r, reason) => own(r?.stderr).some((l) => l === reason || l.endsWith(`: ${reason}`));

// ---------------------------------------------------------------- readers: the tree module's parser (the contract's reader, §3.1; unchanged by §3.6, guarded in (f))
const TM = await import(pathToFileURL(TREE).href);
const bomless = (buf) => { const t = Buffer.isBuffer(buf) ? buf.toString("utf8") : (buf ?? ""); return t.startsWith("﻿") ? t.slice(1) : t; };
/** Raw segments with their own terminators, after the BOM: the lift's `body.split(/(?<=\n)/)`. */
const segs = (buf) => { const t = bomless(buf); return t === "" ? [] : t.split(/(?<=\n)/); };
const bare = (seg) => seg.replace(/\r?\n$/, "");
const parse = (buf) => { try { return TM.parseLedger(Buffer.isBuffer(buf) ? buf.toString("utf8") : (buf ?? "")); } catch { return { headings: [], lines: [] }; } };
const featOfParsed = (p, id) => p.headings.find((h) => h.id === id) ?? null;
/** Each feature's shares as the tree parser reads them: { id → { shares, line (1-based first share line), seg } }. */
function sharesOf(buf) {
	const p = parse(buf), ss = segs(buf ?? ""), m = new Map();
	for (const h of p.headings.filter((x) => x.id.startsWith("FEAT-"))) {
		const first = h.alsoAppliesLines?.[0];
		m.set(h.id, { shares: [...(h.alsoApplies ?? [])], line: first?.line ?? null, seg: first ? (ss[first.line - 1] ?? null) : null, count: h.alsoAppliesLines?.length ?? 0 });
	}
	return m;
}
const shareLineSegs = (buf) => segs(buf ?? "").filter((s) => /^Also applies:/.test(s));
const setEq = (a, b) => JSON.stringify([...new Set(a ?? [])].sort()) === JSON.stringify([...new Set(b ?? [])].sort());
/** The feature a row is homed in, as the tree checker reads it (a subgroup's row is its feature's). */
function homeOf(buf, id) {
	for (const r of TM.readRequirementRows(parse(buf))) if (r.id === id) { const h = r.heading; return h?.id?.startsWith("SUB-") ? (h.parent?.id ?? null) : (h?.id ?? null); }
	return null;
}
/** 0-based [start, end) of a heading's span in segment indices: to the next heading at or above `level`, or EOF. */
function spanOf(buf, id, level) {
	const p = parse(buf);
	const h = featOfParsed(p, id);
	if (!h) return null;
	const ends = (p.allHeadings ?? []).filter((x) => x.line > h.line && x.level <= level).map((x) => x.line);
	return [h.line - 1, ends.length ? Math.min(...ends) - 1 : segs(buf).length];
}
/** Replace (or, with null, delete) segment index i of a buffer's text, keeping any BOM. */
const withSeg = (buf, i, seg) => { const t = Buffer.isBuffer(buf) ? buf.toString("utf8") : (buf ?? ""); const bom = t.startsWith("﻿") ? "﻿" : ""; const ss = segs(t); if (i < 0 || i >= ss.length) return null; ss.splice(i, 1, ...(seg === null ? [] : [seg])); return bom + ss.join(""); };
const insertSeg = (buf, i, seg) => { const t = Buffer.isBuffer(buf) ? buf.toString("utf8") : (buf ?? ""); const bom = t.startsWith("﻿") ? "﻿" : ""; const ss = segs(t); ss.splice(i, 0, seg); return bom + ss.join(""); };
const fileList = (dir) => { const acc = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.name === ".git") continue; if (e.isDirectory()) walk(p); else acc.push(`${path.relative(dir, p)} ${sha(fs.readFileSync(p)).slice(0, 12)}`); } }; walk(dir); return acc.sort(); };
const feats = (m) => (m?.tree ?? []).flatMap((c) => c.features ?? []);
const featIn = (m, id) => feats(m).find((f) => f.id === id);
/** A structured-clone edit of a mapping; null when the mapping is missing (the base) or the edit cannot apply. */
const edit = (m, fn) => { if (!m) return null; const c = structuredClone(m); try { fn(c); return c; } catch { return null; } };
const json = (v) => `${JSON.stringify(v, null, 2)}\n`;
/** A child Node run of `code`; its last stdout line is JSON. */
const probe = (code) => { const r = node(["--input-type=module", "-e", code]); let v = null; try { v = JSON.parse(lines(r.stdout).at(-1) ?? ""); } catch {} return { v, err: own(r.stderr).slice(-3).join(" | ") }; };

// ---------------------------------------------------------------- built fixtures (never a real project's)
const HDR = TABLE_HEADER, DLM = DELIM_TEXT;
/** A passing tree: CAP-01 with FEAT-001 (R-001), FEAT-002 (R-002; SUB-001 R-003; shares R-001,R-004, no-space),
 *  FEAT-003 (R-004; shares R-002) and FEAT-004 (R-005; shares R-001), the closing heading and both kept sections.
 *  Each slot inserts lines; `unterminated` drops the final line break. */
function small(o = {}) {
	const L = [];
	const ins = (arr) => { for (const l of arr ?? []) L.push(l); };
	L.push("# Fixture requirements"); ins(o.head); L.push("", "Intro prose for the fixture.", "");
	L.push("# CAP-01 · What the product does", "Purpose: name what this product does.", "Outcome: name the outcome this capability delivers."); ins(o.cap); L.push("");
	L.push("## FEAT-001 · First feature", "Purpose: name the first feature.", "Status: active"); ins(o.f1Field); L.push("", HDR, DLM, "| R-001 | The first feature shall work. | untested | — |"); ins(o.f1After); L.push("");
	L.push("## FEAT-002 · Second feature", "Purpose: name the second feature.", "Status: active"); ins(o.f2Field ?? ["Also applies: R-001,R-004"]); L.push("", HDR, DLM, "| R-002 | The second feature shall work. | untested | — |"); ins(o.f2After); L.push("");
	L.push("### SUB-001 · A subgroup", "Purpose: name the subgroup."); ins(o.sub); L.push("", HDR, DLM, "| R-003 | The subgroup shall work. | untested | — |", "");
	L.push("## FEAT-003 · Third feature", "Purpose: name the third feature.", "Status: active"); ins(o.f3Field ?? ["Also applies: R-002"]); L.push("", HDR, DLM, "| R-004 | The third feature shall work. | untested | — |", "");
	L.push("## FEAT-004 · Fourth feature", "Purpose: name the fourth feature.", "Status: active"); ins(o.f4Field ?? ["Also applies: R-001"]); L.push("", HDR, DLM, "| R-005 | The fourth feature shall work. | untested | — |"); ins(o.f4After);
	if (o.tail !== false) { L.push("", CLOSING); ins(o.closing); L.push("", "## Open questions"); ins(o.open); L.push("", "1. (none yet)", "", "## Deliberate omissions", "", "- (none yet)"); }
	return L.join("\n") + (o.unterminated ? "" : "\n");
}
/** A flat ledger (no tree heading) whose first section holds a share line. */
const flat = () => ["# Flat fixture", "", "Intro prose.", "", "## 1. One", "", "Also applies: R-002", "", HDR, DLM, "| R-001 | One shall work. | untested | — |", "", "## 2. Two", "", HDR, DLM, "| R-002 | Two shall work. | untested | — |", ""].join("\n");
const lineOf = (t, target) => segs(t).map(bare).lastIndexOf(target) + 1;
const crlf = (s) => s.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");

const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "shares-accept-")));
const repos = [];
const plainDir = (label, content, files = {}) => {
	const d = path.join(scratch, label);
	fs.mkdirSync(d, { recursive: true });
	fs.writeFileSync(path.join(d, "REQUIREMENTS.md"), content ?? "");
	for (const [k, v] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(d, k)), { recursive: true }); fs.writeFileSync(path.join(d, k), v); }
	return d;
};
// Each scratch repo persists core.autocrlf=false in its own config (§5), so the lift's own git calls read it.
const gitRepo = (label, content, files = {}) => {
	const d = plainDir(label, content, files);
	const r = [gitIn(d, "init", "-q", "-b", "main"), gitIn(d, "config", "core.autocrlf", "false"), gitIn(d, "add", "-A"), gitIn(d, "commit", "-qm", "ledger")];
	repos.push(d);
	return { dir: d, ok: r.every((x) => x.status === 0) };
};
const commitAll = (d, msg) => { gitIn(d, "add", "-A"); return gitIn(d, "commit", "-qm", msg, "--allow-empty"); };
const headOf = (d) => gitIn(d, "rev-parse", "HEAD").stdout.trim();
const ledgerOf = (d) => readBuf(path.join(d, "REQUIREMENTS.md"));
const persistedAutocrlf = (d) => spawnSync("git", ["config", "--get", "core.autocrlf"], { cwd: d, encoding: "utf8", env: cleanEnv() }).stdout.trim();
const treeCheck = (dir) => node([TREE, "--root", dir], scratch);
const emitIdentity = (label, content) => { const d = plainDir(label, content); const p = path.join(d, "identity.json"); const r = lift(["--root", d, "--emit-mapping", p], scratch); return { r, map: r.status === 0 ? readJson(p) : null }; };

try {
	out("(harness) git merge-base main HEAD resolves", /^[0-9a-f]{40}$/.test(base), true, base);
	out("(harness) the scratch folder is outside the checkout", path.relative(fs.realpathSync(root), scratch).startsWith(".."), true, scratch);
	out("(harness) the lift, its proof and the tree checker exist (§4 In)", [fs.existsSync(LIFT), fs.existsSync(PROOF), fs.existsSync(TREE)], [true, true, true]);
	const seedText = text(SEED_PATH) ?? "";
	const seedSub = new Map(TM.readRequirementRows(TM.parseLedger(seedText)).filter((r) => r.heading?.id?.startsWith("SUB-")).map((r) => [r.id, r.heading.id]));
	out("(harness) the seed places 22 G rows in SUB-900 to SUB-904 as 5/8/3/3/3", ["SUB-900", "SUB-901", "SUB-902", "SUB-903", "SUB-904"].map((s) => [...seedSub.values()].filter((x) => x === s).length), [5, 8, 3, 3, 3]);

	// ---------------------------------------------------------------- (a) the title check
	const titles = node([SEAT_TITLES, "1"]);
	const titleLines = lines(titles.stdout);
	out("(a) seat-titles 1 prints `seat-titles 1: 0 missing` and exits 0 (§5: every T1–T9 title exists under its req: marker, T22b and the base R-291 title gone)", [titleLines.at(-1) ?? null, titles.status], ["seat-titles 1: 0 missing", 0],
		titleLines.filter((l) => !/^(ok|gone|note) /.test(l)).slice(0, 4).join(" | ") + titles.stderr);

	// ---------------------------------------------------------------- (n) nana-pi's ledger, as a copy (§5 A0–A4)
	const shown = git("show", "HEAD:REQUIREMENTS.md");
	const L = shown.status === 0 ? Buffer.from(shown.stdout, "utf8") : Buffer.alloc(0);
	const Lsh = sharesOf(L);
	const sharing = [...Lsh.values()].filter((x) => x.count > 0);
	const rowsTotal = segs(L).filter((s) => ROW.test(bare(s))).length;
	const f001 = Lsh.get("FEAT-001")?.shares ?? [];
	const gIn33 = TM.readRequirementRows(parse(L)).filter((r) => r.id.startsWith("G-") && (r.heading?.id === "FEAT-033" || r.heading?.parent?.id === "FEAT-033")).map((r) => r.id);
	const gShares = ["FEAT-028", "FEAT-029", "FEAT-032"].map((f) => (Lsh.get(f)?.shares ?? []).filter((x) => x.startsWith("G-")).length);
	out("(harness) the copy (git show HEAD:REQUIREMENTS.md) is a passing tree with 31 share lines, one per sharing feature (factcheck-repo.md census)",
		[shown.status, TM.checkTree(L.toString("utf8")).problems.length, shareLineSegs(L).length, sharing.length, sharing.every((x) => x.count === 1)], [0, 0, 31, 31, true]);
	out("(harness) on the copy FEAT-001 shares eight rows, FEAT-005 shares R-641, FEAT-033 shares R-756 (homed in FEAT-028) and holds the 22 G rows, R-781 is homed in FEAT-011, and FEAT-028/029/032 share 3/7/3 G rows (§5 A3, A4; factcheck-repo.md)",
		[f001.length, Lsh.get("FEAT-005")?.shares, Lsh.get("FEAT-033")?.shares, homeOf(L, "R-756"), gIn33.length, homeOf(L, "R-781"), gShares], [8, ["R-641"], ["R-756"], "FEAT-028", 22, "FEAT-011", [3, 7, 3]]);

	// A0 at the tip: the plain dry run is refused only on the G-row rule (§1; A §3), never on a share line.
	{
		const d = plainDir("nana-dry", L);
		const before = fileList(d);
		const r = lift(["--root", d], scratch);
		const errs = own(r.stderr);
		const gLine = /^FEAT-033: row G-\d{3} belongs to the seed subgroup SUB-90[0-4], not here$/;
		out("(n) A0: the dry run on the copy exits 1 with exactly the 22 G-row problems, no line about a share, and writes nothing (§1, §5 A1: \"refused on the G-row rule, not on shares\")",
			[r.status, crashed(r), errs.length, errs.filter((l) => gLine.test(l)).length, errs.filter((l) => /Also applies|share/i.test(l)), JSON.stringify(fileList(d)) === JSON.stringify(before)], [1, false, 22, 22, [], true], errs.slice(0, 3).join(" | "));
	}

	// A1: the copy's identity, built from the exported buildIdentityMapping, with the 22 G rows moved to SUB-900–SUB-904.
	const ledgerCopy = path.join(plainDir("nana-src", L), "REQUIREMENTS.md");
	const gm = probe(`import * as fs from "node:fs";
const { buildIdentityMapping } = await import(${JSON.stringify(pathToFileURL(LIFT).href)});
const { parseLedger, readRequirementRows } = await import(${JSON.stringify(pathToFileURL(TREE).href)});
const text = fs.readFileSync(${JSON.stringify(ledgerCopy)}, "utf8");
const seed = parseLedger(fs.readFileSync(${JSON.stringify(path.join(root, SEED_PATH))}, "utf8"));
const subOf = new Map(); for (const r of readRequirementRows(seed)) if (r.heading?.id?.startsWith("SUB-")) subOf.set(r.id, r.heading.id);
const m = buildIdentityMapping(text);
const subs = new Map();
for (const cap of m.tree) for (const f of cap.features) for (const holder of [f, ...(f.subgroups ?? [])]) {
  const g = (holder.rows ?? []).filter((r) => r.startsWith("G-"));
  if (!g.length) continue;
  holder.rows = holder.rows.filter((r) => !r.startsWith("G-"));
  for (const r of g) { const s = subOf.get(r); if (!subs.has(s)) subs.set(s, []); subs.get(s).push(r); }
}
const order = ["SUB-900", "SUB-901", "SUB-902", "SUB-903", "SUB-904"];
m.tree.push({ id: "CAP-90", from: [], features: [{ id: "FEAT-900", from: [], rows: [], subgroups: order.filter((s) => subs.has(s)).map((s) => ({ id: s, from: [], rows: subs.get(s) })) }] });
console.log(JSON.stringify({ mapping: m, counts: order.map((s) => (subs.get(s) ?? []).length) }));`);
	const gmove = gm.v?.mapping ?? null;
	out("(harness) A1's mapping: the copy's identity with the 22 G rows moved out of FEAT-033 into SUB-900 to SUB-904 as 5/8/3/3/3 (§5 A1)", gm.v?.counts ?? null, [5, 8, 3, 3, 3], gm.err);
	const R1 = gitRepo("nana-r1", L, { "docs/lift/gmove.json": json(gmove) });
	{
		const d = plainDir("nana-a1-dry", L, { "gmove.json": json(gmove) });
		const r = lift(["--root", d, "--mapping", path.join(d, "gmove.json")], scratch);
		out("(n) A1: the --mapping dry run with the G rows moved exits 0 with the proof line over every row and no share line (§5 A1, R-1183)",
			[r.status, proofOf(r.stdout)?.rows ?? null, shareLinesOf(r.stdout)], [0, rowsTotal, []], r.stdout.slice(-200) + own(r.stderr).slice(0, 3).join(" | "));
	}
	const w1 = lift(["--root", R1.dir, "--mapping", path.join(R1.dir, "docs/lift/gmove.json"), "--write"], scratch);
	const O1 = w1.status === 0 ? ledgerOf(R1.dir) : null;
	const A1out = O1 ?? L; // the base cannot lift; every later case then runs on the unlifted copy and reads red
	{
		// The diff holds only the G rows leaving FEAT-033, the CAP-90 block and blank-line changes in FEAT-033's re-laid
		// span (§5 A1 as fact-checked: factcheck-repo.md WRONG 5): the input less its G rows, and the output less the
		// CAP-90 block, are equal once blank lines inside FEAT-033's span are set aside on each side.
		const inS = segs(L), outS = segs(O1 ?? "");
		const gSegs = inS.filter((s) => ROW.exec(bare(s))?.[1]?.startsWith("G-"));
		const s33in = spanOf(L, "FEAT-033", 2), s33out = spanOf(O1 ?? "", "FEAT-033", 2);
		const p1 = parse(O1 ?? "");
		const cap90 = p1.headings.find((h) => h.id === "CAP-90");
		const cap90End = cap90 ? Math.min(outS.length, ...(p1.allHeadings ?? []).filter((h) => h.line > cap90.line && h.level === 1).map((h) => h.line - 1)) : -1;
		const inside = (span, i) => span && i >= span[0] && i < span[1];
		const lhs = inS.map((s, i) => ({ s, i })).filter(({ s }) => !gSegs.includes(s)).filter(({ s, i }) => !(bare(s) === "" && inside(s33in, i))).map(({ s }) => s);
		const rhs = outS.map((s, i) => ({ s, i })).filter(({ i }) => !(cap90 && i >= cap90.line - 1 && i < cap90End)).filter(({ s, i }) => !(bare(s) === "" && inside(s33out, i))).map(({ s }) => s);
		const block = cap90 ? outS.slice(cap90.line - 1, cap90End) : [];
		const blockKinds = block.filter((s) => bare(s) !== "" && !(/^#{1,3} (CAP-90|FEAT-900|SUB-90[0-4]) · /.test(s) || /^(Purpose|Outcome|Status):/.test(s) || bare(s) === TABLE_HEADER || DELIM.test(bare(s)) || gSegs.includes(s)));
		const blockG = block.filter((s) => gSegs.includes(s));
		out("(n) A1: --write of the committed G move exits 0, and the diff holds only the 22 G rows leaving FEAT-033, the CAP-90 block (headings, field lines, tables and those rows) and blank lines in FEAT-033's re-laid span (§5 A1)",
			[w1.status, gSegs.length, Boolean(O1) && lhs.length > 0 && JSON.stringify(lhs) === JSON.stringify(rhs), blockKinds.map((s) => bare(s).slice(0, 40)), [...blockG].sort().join("") === [...gSegs].sort().join("") && blockG.length === 22],
			[0, 22, true, [], true], own(w1.stderr).slice(0, 3).join(" | "));
		const o1sh = sharesOf(O1 ?? "");
		const gHomes = TM.readRequirementRows(p1).filter((r) => r.id.startsWith("G-")).map((r) => `${r.id}@${r.heading?.id}`);
		out("(n) A1: the lifted copy's ^Also applies: lines equal the input's byte for byte, in order (31), and each G row sits in its seed subgroup (§5 A1, R-1181)",
			[Boolean(O1), shareLineSegs(O1 ?? "").length, JSON.stringify(shareLineSegs(O1 ?? "")) === JSON.stringify(shareLineSegs(L)), gHomes.filter((x) => x.split("@")[1] !== seedSub.get(x.split("@")[0]))], [true, 31, true, []]);
		const ck = treeCheck(R1.dir);
		out("(n) A1: the tree checker passes the lifted copy, and FEAT-028, FEAT-029 and FEAT-032 keep their G shares (§5 A1)",
			[Boolean(O1), ck.status, ["FEAT-028", "FEAT-029", "FEAT-032"].map((f) => setEq(o1sh.get(f)?.shares, Lsh.get(f)?.shares) && (o1sh.get(f)?.shares ?? []).some((x) => x.startsWith("G-")))], [true, 0, [true, true, true]], lines(ck.stdout).concat(own(ck.stderr)).slice(0, 3).join(" | "));
	}

	// A2: the round trip of A1's committed output through its emitted identity (§5 A2, R-1181, R-1166).
	commitAll(R1.dir, "A1");
	const A1sha = headOf(R1.dir);
	const idPath = path.join(R1.dir, "docs/lift/identity.json");
	const em = lift(["--root", R1.dir, "--emit-mapping", idPath], scratch);
	const idMap = em.status === 0 ? readJson(idPath) : null;
	{
		const o1sh = sharesOf(A1out);
		const mismatch = feats(idMap).filter((f) => !setEq(f.also_applies ?? [], o1sh.get(f.id)?.shares ?? [])).map((f) => f.id);
		out("(n) A2: --emit-mapping on A1's committed output exits 0, and each feature's also_applies equals its shares as the tree parser reads them (§3.2: the identity writes also_applies)",
			[em.status, Boolean(O1), feats(idMap).length > 0, mismatch], [0, true, true, []], own(em.stderr).slice(0, 3).join(" | "));
		commitAll(R1.dir, "identity");
		const dry = lift(["--root", R1.dir, "--mapping", idPath], scratch);
		const w = lift(["--root", R1.dir, "--mapping", idPath, "--write"], scratch);
		const after = ledgerOf(R1.dir);
		out("(n) A2: the identity --mapping dry run proves with no move or share line, and --write leaves the bytes equal, all 31 share lines included (§5 A2, R-1181, R-1183)",
			[dry.status, proofOf(dry.stdout)?.rows ?? null, moveLinesOf(dry.stdout), shareLinesOf(dry.stdout), w.status, Boolean(O1) && Boolean(after?.equals(O1)), JSON.stringify(shareLineSegs(after ?? "")) === JSON.stringify(shareLineSegs(L))],
			[0, rowsTotal, [], [], 0, true, true], own(dry.stderr).concat(own(w.stderr)).slice(0, 3).join(" | "));
		const v = lift(["--root", R1.dir, "--verify", A1sha, "--mapping", idPath], scratch);
		out("(n) A2: --verify <A1's commit> --mapping <identity> exits 0 (§5 A2, R-1168)", [Boolean(O1), v.status], [true, 0], own(v.stderr).slice(0, 3).join(" | "));
	}

	// The mappings A3, A4 and the recount probe draw from the identity (pin = A1's output).
	const a3 = edit(idMap, (m) => { const f33 = featIn(m, "FEAT-033"), f5 = featIn(m, "FEAT-005"); f33.shares_dropped = ["R-756"]; delete f33.also_applies; f5.shares_added = ["R-781"]; f5.also_applies = ["R-641", "R-781"]; });
	const a4 = edit(idMap, (m) => { delete featIn(m, "FEAT-001").also_applies; });
	const [id1, id2] = f001;
	const rI = edit(idMap, (m) => { const f = featIn(m, "FEAT-001"); f.shares_dropped = [id1]; f.also_applies = f001.filter((x) => x !== id1 && x !== id2); });
	const holder756 = (m) => [...feats(m), ...feats(m).flatMap((f) => f.subgroups ?? [])].find((x) => (x.rows ?? []).includes("R-756"));
	const m756a = edit(idMap, (m) => { const h = holder756(m); h.rows = h.rows.filter((x) => x !== "R-756"); featIn(m, "FEAT-033").rows.push("R-756"); });
	const m756b = edit(m756a, (m) => { const f = featIn(m, "FEAT-033"); f.shares_dropped = ["R-756"]; delete f.also_applies; });
	const P3 = plainDir("nana-a3-dry", A1out, { "a3.json": json(a3), "a4.json": json(a4), "ri.json": json(rI), "m756a.json": json(m756a), "m756b.json": json(m756b) });
	const dryP3 = (f) => lift(["--root", P3, "--mapping", path.join(P3, f)], scratch);

	// A3: a declared drop and add (§5 A3, R-1181, R-1183).
	{
		const r = dryP3("a3.json");
		const sl = shareLinesOf(r.stdout);
		out("(n) A3: the dry run exits 0 and prints exactly two share lines, one row ID each, FEAT-005's R-781 added then FEAT-033's R-756 dropped, before the proof line, and no move line (§5 A3, R-1183, §3.5)",
			[r.status, sl.length, sl.map((l) => rowIdsIn(l).length), /FEAT-005/.test(sl[0] ?? "") && /\bR-781\b/.test(sl[0] ?? "") && /\badded\b/.test(sl[0] ?? ""), /FEAT-033/.test(sl[1] ?? "") && /\bR-756\b/.test(sl[1] ?? "") && /\bdropped\b/.test(sl[1] ?? ""), beforeProof(r.stdout), moveLinesOf(r.stdout)],
			[0, 2, [1, 1], true, true, true, []], r.stdout.slice(-300) + own(r.stderr).slice(0, 3).join(" | "));
	}
	const a3Path = path.join(R1.dir, "docs/lift/a3.json");
	fs.writeFileSync(a3Path, json(a3));
	commitAll(R1.dir, "a3 mapping");
	const A2sha = headOf(R1.dir);
	const w3 = lift(["--root", R1.dir, "--mapping", a3Path, "--write"], scratch);
	const O3 = w3.status === 0 ? ledgerOf(R1.dir) : null;
	{
		const sh = sharesOf(A1out);
		const s5 = sh.get("FEAT-005"), s33 = sh.get("FEAT-033");
		let want = null;
		if (s5?.line && s33?.line) { const eol = /\r\n$/.test(s5.seg) ? "\r\n" : "\n"; want = withSeg(withSeg(A1out, s33.line - 1, null), s5.line - 1, `Also applies: R-641, R-781${eol}`); }
		out("(n) A3: --write exits 0 and changes exactly two lines: FEAT-033's share line goes and FEAT-005's reads `Also applies: R-641, R-781` (§5 A3, R-1181)",
			[w3.status, Boolean(O1), want !== null && O3 !== null && O3.toString("utf8") === want], [0, true, true], own(w3.stderr).slice(0, 3).join(" | "));
		const ck = treeCheck(R1.dir);
		out("(n) A3: the tree checker finds 0 problems in A3's output (§5 A3)", [Boolean(O3), ck.status], [true, 0], lines(ck.stdout).concat(own(ck.stderr)).slice(0, 3).join(" | "));
		commitAll(R1.dir, "A3");
		const v = lift(["--root", R1.dir, "--verify", A2sha, "--mapping", a3Path], scratch);
		out("(n) A3: --verify <the commit before A3> --mapping <A3's mapping> exits 0 on the committed share change (§5, R-1181 T3, R-1168)", [Boolean(O3), v.status], [true, 0], own(v.stderr).slice(0, 3).join(" | "));
	}
	{
		const ra = dryP3("m756a.json"), rb = dryP3("m756b.json");
		out("(n) A3: R-756 moved into FEAT-033 is refused naming \"is homed in this feature\" without the drop, and exits 0 with it declared (§5 A3, §3.2 \"No implicit drop\", R-1182 T5)",
			[Boolean(m756a), ra.status, crashed(ra), own(ra.stderr).some((l) => /FEAT-033/.test(l) && /\bR-756\b/.test(l) && /is homed in this feature/.test(l)), rb.status, proofOf(rb.stdout) !== null],
			[true, 1, false, true, 0, true], own(ra.stderr).slice(0, 2).concat(own(rb.stderr).slice(0, 2)).join(" | "));
	}

	// A4: an undeclared drop of FEAT-001's eight shares (§5 A4, R-1167, R-1182).
	const R4 = gitRepo("nana-r4", A1out, { "docs/lift/a4.json": json(a4), "docs/lift/ri.json": json(rI) });
	{
		const r = dryP3("a4.json");
		const errs = own(r.stderr);
		const perId = f001.map((id) => errs.filter((l) => /\bFEAT-001\b/.test(l) && new RegExp(`\\b${id}\\b`).test(l) && /shares_dropped/.test(l)).length);
		out("(n) A4: an identity whose FEAT-001 lost also_applies, with no declaration, is refused in the dry run with eight problems, each naming FEAT-001, one of its shares and shares_dropped, and no proof line (§5 A4, §3.2)",
			[r.status, crashed(r), errs.filter((l) => /\bFEAT-001\b/.test(l)).length, perId, proofOf(r.stdout)], [1, false, 8, f001.map(() => 1), null], errs.slice(0, 3).join(" | "));
		const before = ledgerOf(R4.dir);
		const w = lift(["--root", R4.dir, "--mapping", path.join(R4.dir, "docs/lift/a4.json"), "--write"], scratch);
		const v = lift(["--root", R4.dir, "--verify", "HEAD", "--mapping", path.join(R4.dir, "docs/lift/a4.json")], scratch);
		out("(n) A4: --write with that committed mapping exits 1 naming FEAT-001 and leaves the ledger unchanged, and --verify with it exits 1 naming FEAT-001 (§5 A4, T8)",
			[Boolean(O1), w.status, crashed(w), own(w.stderr).some((l) => /\bFEAT-001\b/.test(l)), Boolean(before && ledgerOf(R4.dir)?.equals(before)), v.status, own(v.stderr).some((l) => /\bFEAT-001\b/.test(l))],
			[true, 1, false, true, true, 1, true], own(w.stderr).slice(0, 2).concat(own(v.stderr).slice(0, 2)).join(" | "));
	}
	// The recount is independent of also_applies (seat revision 2, R-1182): FEAT-001 declares one drop and silently loses a second.
	{
		const r = dryP3("ri.json");
		out(`(n) a declared drop of ${id1} beside a silent drop of ${id2} in FEAT-001's also_applies is refused in the dry run naming FEAT-001, ${id2} and shares_dropped, with no proof line (R-1167, §3.2)`,
			[r.status, crashed(r), own(r.stderr).some((l) => /\bFEAT-001\b/.test(l) && new RegExp(`\\b${id2}\\b`).test(l) && /shares_dropped/.test(l)), proofOf(r.stdout)], [1, false, true, null], own(r.stderr).slice(0, 3).join(" | "));
		const before = ledgerOf(R4.dir);
		const w = lift(["--root", R4.dir, "--mapping", path.join(R4.dir, "docs/lift/ri.json"), "--write"], scratch);
		out("(n) the same mapping committed: --write exits 1 and leaves the ledger unchanged (R-1167, T8)", [Boolean(O1), w.status, crashed(w), Boolean(before && ledgerOf(R4.dir)?.equals(before))], [true, 1, false, true], own(w.stderr).slice(0, 3).join(" | "));
	}
	// The tip's proveLift, called directly (§3.4; T4's form): tampers built here from A3's true output and A1's output.
	{
		const sh3 = sharesOf(O3 ?? ""), sh1 = sharesOf(A1out);
		const k1 = sh3.get("FEAT-001");
		const eolOf = (s) => (/\r\n$/.test(s ?? "") ? "\r\n" : "\n");
		const noShare = parse(O3 ?? "").headings.find((h) => h.id.startsWith("FEAT-") && !["FEAT-005", "FEAT-011", "FEAT-033"].includes(h.id) && (sh3.get(h.id)?.count ?? 1) === 0 && h.statusLine && !TM.readRequirementRows(parse(O3 ?? "")).some((r) => r.id === "R-781" && (r.heading?.id === h.id || r.heading?.parent?.id === h.id)));
		// 0-based segment index of CAP-01's Outcome: line in A3's output (-1 when there is none before the next heading).
		const capOutcome = (() => { const c = parse(O3 ?? "").headings.find((h) => h.id === "CAP-01"); const ss = segs(O3 ?? ""); if (!c) return -1; for (let i = c.line; i < ss.length; i++) { if (/^#{1,6} /.test(ss[i])) return -1; if (/^Outcome:/.test(ss[i])) return i; } return -1; })();
		const files = {
			input: A1out, seed: seedText, mapA3: JSON.stringify(a3), outA3: O3 ?? "",
			outMissing: k1?.line ? withSeg(O3, k1.line - 1, null) : "",
			outChanged: k1?.line ? withSeg(O3, k1.line - 1, `${bare(k1.seg)}${/\r\n$/.test(k1.seg) ? "\n" : "\r\n"}`) : "",
			outAddKept: k1?.line ? withSeg(O3, k1.line - 1, `${bare(k1.seg)}, R-781${eolOf(k1.seg)}`) : "",
			outAddNew: noShare ? insertSeg(O3, noShare.statusLine, `Also applies: R-781${eolOf(segs(O3)[0])}`) : "",
			// FEAT-001's kept share line, kept in place, and a byte copy of it inserted right after CAP-01's Outcome: line
			// (a shape the tree checker passes; only the accounting's "added" clause sees it).
			outCapCopy: k1?.line && capOutcome >= 0 ? insertSeg(O3, capOutcome + 1, k1.seg) : "",
			mapRI: JSON.stringify(rI),
			// What a writer following also_applies produces for rI: FEAT-001's line regenerated without id1 and id2.
			outRI: sh1.get("FEAT-001")?.line && rI ? withSeg(A1out, sh1.get("FEAT-001").line - 1, `Also applies: ${f001.filter((x) => x !== id1 && x !== id2).join(", ")}${eolOf(sh1.get("FEAT-001").seg)}`) : "",
			// The declared result (carried less id1), although rI's also_applies says otherwise: the proof never reads it.
			outRIdeclared: sh1.get("FEAT-001")?.line && rI ? withSeg(A1out, sh1.get("FEAT-001").line - 1, `Also applies: ${f001.filter((x) => x !== id1).join(", ")}${eolOf(sh1.get("FEAT-001").seg)}`) : "",
		};
		const pd = path.join(scratch, "prove-direct");
		fs.mkdirSync(pd);
		for (const [k, v] of Object.entries(files)) fs.writeFileSync(path.join(pd, k), v ?? "");
		const P = Object.fromEntries(Object.keys(files).map((k) => [k, path.join(pd, k)]));
		const pr = probe(`import * as fs from "node:fs";
const { proveLift } = await import(${JSON.stringify(pathToFileURL(PROOF).href)});
const P = ${JSON.stringify(P)}; const rd = (k) => fs.readFileSync(P[k], "utf8");
const input = rd("input"), seed = rd("seed");
const call = (map, output) => { try { const r = proveLift(input, JSON.parse(rd(map)), rd(output), seed, { fromDefault: false }); return Array.isArray(r?.problems) ? r.problems.map(String) : ["unknown return shape"]; } catch (e) { return ["threw: " + e.message]; } };
console.log(JSON.stringify({ control: call("mapA3", "outA3"), missing: call("mapA3", "outMissing"), changed: call("mapA3", "outChanged"), addKept: call("mapA3", "outAddKept"), addNew: call("mapA3", "outAddNew"), capCopy: call("mapA3", "outCapCopy"), recount: call("mapRI", "outRI"), declared: call("mapRI", "outRIdeclared") }));`);
		const has = (k, ...res) => Array.isArray(pr.v?.[k]) && pr.v[k].some((p) => res.every((re) => re.test(p)));
		out("(n) the tip's proveLift passes A3's true output, and names FEAT-001's deleted kept line with \"1 missing\" (§5 A4, R-1182, §3.4c)",
			[pr.v?.control ?? null, Boolean(O3) && has("missing", /\bFEAT-001\b/), has("missing", /\b1 missing\b/)], [[], true, true], pr.err || JSON.stringify(pr.v?.missing ?? "").slice(0, 200));
		out("(n) the tip's proveLift names a changed byte in a kept share line (its line ending flipped, unseen by the tree parser) as one missing and one unaccounted extra line (R-1182 \"changed\", §3.4c)",
			[Boolean(O3) && Boolean(k1), has("changed", /line accounting/, /\b1 missing\b/, /\b1 unaccounted extra\b/)], [true, true], JSON.stringify(pr.v?.changed ?? "").slice(0, 200));
		out("(n) the tip's proveLift names an undeclared R-781 appended to FEAT-001's kept line, and an undeclared share line added to a feature with none, naming each feature and R-781 (R-1182 recount, §3.4b)",
			[Boolean(O3) && Boolean(noShare), has("addKept", /\bFEAT-001\b/, /\bR-781\b/), has("addNew", new RegExp(`\\b${noShare?.id ?? "FEAT-none"}\\b`), /\bR-781\b/)], [true, true, true], JSON.stringify([pr.v?.addKept, pr.v?.addNew] ?? "").slice(0, 300));
		out("(n) the tip's proveLift names a byte copy of FEAT-001's kept share line inserted after CAP-01's Outcome line as one unaccounted extra line (R-1182 accounting \"added\", §3.4c)",
			[Boolean(O3) && Boolean(k1) && capOutcome >= 0, has("capCopy", /line accounting/, /\b1 unaccounted extra\b/)], [true, true], JSON.stringify(pr.v?.capCopy ?? "").slice(0, 200));
		out(`(n) the recount reads the declarations, never also_applies: FEAT-001 declaring ${id1} dropped while its regenerated line also lacks ${id2} is named with ${id2}, and the output holding exactly the declared result proves (seat revision 2, R-1182, §3.4b)`,
			[Boolean(O1) && Boolean(rI), has("recount", /\bFEAT-001\b/, new RegExp(`\\b${id2}\\b`)), pr.v?.declared ?? null], [true, true, []], JSON.stringify([pr.v?.recount, pr.v?.declared] ?? "").slice(0, 300));
	}

	// ---------------------------------------------------------------- (r) one reader: every other Also applies line is refused (§3.1, R-1167, T7)
	const S0 = small();
	{
		const ck = treeCheck(plainDir("small-check", S0));
		out("(harness) the built two-share-feature fixture is a passing tree", [ck.status, lines(ck.stdout).at(-1) ?? ""], [0, "requirements tree: 0 problems; rows 5; features 4"], own(ck.stderr).join(" | "));
		const d = plainDir("small-dry", S0);
		const before = fileList(d);
		const r = lift(["--root", d], scratch);
		out("(r) a passing tree with three share lines (one a no-space list) lifts: the dry run exits 0 with the proof line, no share line, and writes nothing (R-1181, R-1167)",
			[r.status, proofOf(r.stdout)?.rows ?? null, shareLinesOf(r.stdout), JSON.stringify(fileList(d)) === JSON.stringify(before)], [0, 5, [], true], own(r.stderr).slice(0, 3).join(" | "));
	}
	const SHAPES = [
		["a second share line in a feature's field block", small({ f2Field: ["Also applies: R-001,R-004", "Also applies: R-005"] }), "Also applies: R-005", NOT_FIRST, false],
		["a second share line after a feature's table", small({ f2After: ["", "Also applies: R-005"] }), "Also applies: R-005", NOT_FIRST, false],
		["a share line under a capability", small({ cap: ["Also applies: R-005"] }), "Also applies: R-005", NOT_FIRST, true],
		["a share line under a subgroup", small({ sub: ["Also applies: R-005"] }), "Also applies: R-005", NOT_FIRST, true],
		["a share line in the head", small({ head: ["", "Also applies: R-005"] }), "Also applies: R-005", NOT_FIRST, true],
		["a share line under a kept section (## Open questions)", small({ open: ["", "Also applies: R-005"] }), "Also applies: R-005", NOT_FIRST, true],
		["a share line in the closing heading's span", small({ closing: ["", "Also applies: R-005"] }), "Also applies: R-005", NOT_FIRST, true],
		["a fenced share line in a feature's span", small({ f2After: ["", "```text", "Also applies: R-005", "```"] }), "Also applies: R-005", NOT_FIRST, true],
		["a share line under a fence closer underlined by --- (probe/fence)", small({ f1After: ["", "```text", "example", "```", "---", "Also applies: R-005"] }), "Also applies: R-005", NOT_FIRST, true],
		["a share line in a flat ledger", flat(), "Also applies: R-002", NOT_FIRST, false],
		["a feature's only share line, after its table, ending the file with no line break (probe/unterm)", small({ f4Field: [], f4After: ["", "Also applies: R-001"], tail: false, unterminated: true }), "Also applies: R-001", NO_ENDING, true],
	];
	{
		const passing = SHAPES.filter((s) => s[4]).map(([key, t]) => [key, treeCheck(plainDir(`shape-tree-${SHAPES.findIndex((s) => s[0] === key)}`, t)).status]);
		out("(harness) the tree checker passes every refused shape but the two second lines and the flat ledger: each is a shape the tree reader accepts (factcheck-proof.md, factcheck-repo.md W1)", passing.filter(([, st]) => st !== 0).map(([k]) => k), []);
	}
	SHAPES.forEach(([key, t, target, reason], k) => {
		const at = lineOf(t, target);
		const why = reason(at);
		const d1 = plainDir(`shape-${k}-dry`, t);
		const before1 = fileList(d1);
		const dry = lift(["--root", d1], scratch);
		const d2 = plainDir(`shape-${k}-emit`, t);
		const emit = lift(["--root", d2, "--emit-mapping", path.join(d2, "map.json")], scratch);
		const repo = gitRepo(`shape-${k}-git`, t);
		const w = lift(["--root", repo.dir, "--write"], scratch);
		const unchanged = ledgerOf(repo.dir)?.equals(Buffer.from(t, "utf8")) ?? false;
		const v = lift(["--root", repo.dir, "--verify", "HEAD"], scratch);
		const modes = [
			[dry.status, crashed(dry), named(dry, why), proofOf(dry.stdout) === null && JSON.stringify(fileList(d1)) === JSON.stringify(before1)],
			[emit.status, crashed(emit), named(emit, why), !fs.existsSync(path.join(d2, "map.json"))],
			[w.status, crashed(w), named(w, why), unchanged],
			[v.status, crashed(v), named(v, why), true],
		];
		out(`(r) ${key}: line ${at} is refused naming "${why.slice(why.indexOf(":") + 2, why.indexOf(":") + 40)}…" in the dry run, --emit-mapping, --write and --verify, writing nothing (R-1167, §3.1, T7)`,
			modes, modes.map(() => [1, false, true, true]), [dry, emit, w, v].map((r) => own(r.stderr)[0] ?? "").join(" | "));
	});

	// ---------------------------------------------------------------- (b) R-1181's bytes through the identity --write
	{
		const lfFirstCrlfShares = small().split(/(?<=\n)/).map((s) => (/^Also applies:/.test(s) ? s.replace(/\n$/, "\r\n") : s)).join("");
		const after = small({ f4Field: [], f4After: ["", "Also applies: R-001"] });
		const variants = [["LF with a no-space list", Buffer.from(S0)], ["BOM+CRLF", Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(crlf(S0))])], ["mixed-ending (LF file, CRLF share lines)", Buffer.from(lfFirstCrlfShares)]];
		out("(harness) the mixed fixture's first line is LF and its share lines CRLF; the BOM fixture starts with a BOM", [segs(lfFirstCrlfShares)[0].endsWith("\r\n"), shareLineSegs(lfFirstCrlfShares).every((s) => s.endsWith("\r\n")), variants[1][1][0]], [false, true, 0xef]);
		for (const [label, bytes] of variants) {
			const repo = gitRepo(`bytes-${label.split(" ")[0]}`, bytes);
			const w = lift(["--root", repo.dir, "--write"], scratch);
			const o = ledgerOf(repo.dir);
			const inSh = sharesOf(bytes), outSh = sharesOf(o ?? "");
			const diffs = [...inSh].filter(([, x]) => x.count).filter(([id, x]) => outSh.get(id)?.seg !== x.seg).map(([id]) => id);
			out(`(b) ${label}: the identity --write exits 0 and keeps every feature's share line byte-identical, line ending included (R-1181, T1)`,
				[w.status, diffs, shareLineSegs(o ?? "").length], [0, [], 3], own(w.stderr).slice(0, 3).join(" | "));
		}
		const repo = gitRepo("bytes-after-table", after);
		const w = lift(["--root", repo.dir, "--write"], scratch);
		const o = ledgerOf(repo.dir)?.toString("utf8") ?? "";
		const ss = segs(after);
		const from = ss.lastIndexOf("Also applies: R-001\n");
		const status4 = ss.findIndex((s, i) => s === "Status: active\n" && ss[i - 2]?.startsWith("## FEAT-004 "));
		const want = (() => { const c = [...ss]; const [line] = c.splice(from, 1); c.splice(status4 + 1, 0, line); return c.join(""); })();
		out("(b) a feature's only share line after its table moves up right after its Status line with its bytes kept, and no other line moves (R-1181, §3.3, residual 2)",
			[from > status4 && status4 > 0, w.status, o === want], [true, 0, true], own(w.stderr).slice(0, 3).join(" | "));
	}

	// ---------------------------------------------------------------- (m) merges and demotions (R-1181, R-1183, T2, T6)
	{
		// Both merged features share R-002 (FEAT-003: R-002; FEAT-004: R-001, R-002), so the merged line is a set, not a
		// concatenation, and must be one line (verifier MUST 2).
		const MG = small({ f4Field: ["Also applies: R-001, R-002"] });
		const mgCk = treeCheck(plainDir("merge-check", MG));
		out("(harness) the merge fixture (FEAT-003 sharing R-002, FEAT-004 sharing R-001 and R-002) is a passing tree", [mgCk.status, sharesOf(MG).get("FEAT-003")?.shares, sharesOf(MG).get("FEAT-004")?.shares], [0, ["R-002"], ["R-001", "R-002"]], lines(mgCk.stdout).concat(own(mgCk.stderr)).slice(0, 3).join(" | "));
		const mIdent = emitIdentity("merge-src", MG);
		const merge = edit(mIdent.map, (m) => { const f3 = featIn(m, "FEAT-003"), f4 = featIn(m, "FEAT-004"); f3.from = [...f3.from, ...f4.from]; f3.rows = [...f3.rows, ...f4.rows]; f3.also_applies = ["R-001", "R-002"]; m.tree[0].features = m.tree[0].features.filter((f) => f !== f4); });
		const repo = gitRepo("merge", MG, { "map.json": json(merge) });
		const dry = lift(["--root", repo.dir, "--mapping", path.join(repo.dir, "map.json")], scratch);
		const w = lift(["--root", repo.dir, "--mapping", path.join(repo.dir, "map.json"), "--write"], scratch);
		const o = ledgerOf(repo.dir);
		const osh = sharesOf(o ?? "");
		const ck = treeCheck(repo.dir);
		out("(m) FEAT-004 merged into FEAT-003, both sharing R-002: the dry run proves with the merge's move line and no share line, and --write gives FEAT-003 one share line holding both features' shares as a set, the tree checker passing (R-1181, R-1183, T2, T6)",
			[mIdent.r.status, dry.status, proofOf(dry.stdout) !== null, moveLinesOf(dry.stdout).some((l) => l.includes("FEAT-004") && l.includes("FEAT-003")), shareLinesOf(dry.stdout), w.status, osh.has("FEAT-004"), (osh.get("FEAT-003")?.shares ?? []).slice().sort(), osh.get("FEAT-003")?.count === 1, ck.status],
			[0, 0, true, true, [], 0, false, ["R-001", "R-002"], true, 0], own(dry.stderr).concat(own(w.stderr)).slice(0, 3).join(" | "));
		// A demotion: FEAT-003 (its share line CRLF in an LF file, so a regenerated line would show) becomes SUB-002 under
		// FEAT-001, which has no share line of its own: one source, no declaration, so its line is copied byte for byte.
		const D = small({ f3Field: ["Also applies: R-002\r"] });
		const dIdent = emitIdentity("demote-src", D);
		const demote = edit(dIdent.map, (m) => { const f1 = featIn(m, "FEAT-001"), f3 = featIn(m, "FEAT-003"); f1.subgroups = [...(f1.subgroups ?? []), { id: "SUB-002", label: "Third feature", purpose: "name the third feature.", from: f3.from, rows: f3.rows }]; f1.also_applies = ["R-002"]; m.tree[0].features = m.tree[0].features.filter((f) => f !== f3); });
		const repo2 = gitRepo("demote", D, { "map.json": json(demote) });
		const dry2 = lift(["--root", repo2.dir, "--mapping", path.join(repo2.dir, "map.json")], scratch);
		const w2 = lift(["--root", repo2.dir, "--mapping", path.join(repo2.dir, "map.json"), "--write"], scratch);
		const o2 = ledgerOf(repo2.dir);
		const o2sh = sharesOf(o2 ?? "");
		const ck2 = treeCheck(repo2.dir);
		out("(m) FEAT-003 demoted to SUB-002 under FEAT-001: the dry run proves with no share line, and --write gives FEAT-001 FEAT-003's share line byte for byte (CRLF kept), SUB-002 under it, the tree checker passing (R-1181 S3/S5, R-1183, T2, T6)",
			[dIdent.r.status, dry2.status, proofOf(dry2.stdout) !== null, shareLinesOf(dry2.stdout), w2.status, o2sh.get("FEAT-001")?.seg ?? null, parse(o2 ?? "").headings.find((h) => h.id === "SUB-002")?.parent?.id ?? null, o2sh.has("FEAT-003"), ck2.status],
			[0, 0, true, [], 0, "Also applies: R-002\r\n", "FEAT-001", false, 0], own(dry2.stderr).concat(own(w2.stderr)).slice(0, 3).join(" | "));
	}

	// ---------------------------------------------------------------- (p) R-1183's one line per share (verifier MUST 1)
	{
		const pIdent = emitIdentity("plan-src", S0);
		const pm = edit(pIdent.map, (m) => { const f1 = featIn(m, "FEAT-001"), f2 = featIn(m, "FEAT-002"); f1.shares_added = ["R-002", "R-004"]; f1.also_applies = ["R-002", "R-004"]; f2.shares_dropped = ["R-004"]; f2.also_applies = ["R-001"]; });
		const d = plainDir("plan-dry", S0, { "map.json": json(pm) });
		const r = lift(["--root", d, "--mapping", path.join(d, "map.json")], scratch);
		const sl = shareLinesOf(r.stdout);
		const what = (l) => `${l.match(/\bFEAT-\d{3}\b/)?.[0]} ${rowIdsIn(l)[0]} ${l.match(/\b(added|dropped)\b/)?.[0]}`;
		out("(p) FEAT-001 declaring R-002 and R-004 added and FEAT-002 declaring R-004 dropped: the dry run exits 0 and prints exactly three share lines before the proof line, one row ID each, FEAT-001 R-002 added, FEAT-001 R-004 added and FEAT-002 R-004 dropped, both FEAT-001 lines first (R-1183 \"one line per share\", §3.5)",
			[Boolean(pm), r.status, sl.length, sl.map((l) => rowIdsIn(l).length), sl.map(what).sort(), sl.slice(0, 2).map((l) => /\bFEAT-001\b/.test(l)), beforeProof(r.stdout)],
			[true, 0, 3, [1, 1, 1], ["FEAT-001 R-002 added", "FEAT-001 R-004 added", "FEAT-002 R-004 dropped"], [true, true], true], r.stdout.slice(-300) + own(r.stderr).slice(0, 3).join(" | "));
	}

	// ---------------------------------------------------------------- (v) the validator's share checks (R-1167 mapping clause, T8; sol r1 SHOULDs)
	{
		const M0 = emitIdentity("val-src", S0).map;
		const p0 = parse(S0);
		const f3Line = p0.headings.find((h) => h.id === "FEAT-003")?.line ?? -1;
		const word = (s) => new RegExp(`\\b${s}\\b`);
		const V = [
			["an undeclared drop (FEAT-002 loses R-004 from also_applies)", edit(M0, (m) => { featIn(m, "FEAT-002").also_applies = ["R-001"]; }), [/\bFEAT-002\b/, word("R-004"), /shares_dropped/]],
			["an undeclared add (FEAT-001 gains R-002 in also_applies)", edit(M0, (m) => { featIn(m, "FEAT-001").also_applies = ["R-002"]; }), [/\bFEAT-001\b/, word("R-002"), /shares_added/]],
			["a declared drop it does not carry (FEAT-001 drops R-002)", edit(M0, (m) => { featIn(m, "FEAT-001").shares_dropped = ["R-002"]; }), [/\bFEAT-001\b/, word("R-002")]],
			["a declared add it already carries (FEAT-002 adds R-001)", edit(M0, (m) => { featIn(m, "FEAT-002").shares_added = ["R-001"]; }), [/\bFEAT-002\b/, word("R-001")]],
			["a declared add of an unknown row (FEAT-001 adds R-999)", edit(M0, (m) => { const f = featIn(m, "FEAT-001"); f.shares_added = ["R-999"]; f.also_applies = ["R-999"]; }), [/\bFEAT-001\b/, word("R-999")]],
			["a sharing feature heading named by a capability (FEAT-003's old heading under CAP-01)", edit(M0, (m) => { const f3 = featIn(m, "FEAT-003"); m.tree[0].from = [...m.tree[0].from, ...f3.from]; f3.from = []; delete f3.also_applies; }), [word(String(f3Line)), /capabilit|CAP-01/i]],
			["a sharing feature heading named by the tail (FEAT-003's old heading in tail.from)", edit(M0, (m) => { const f3 = featIn(m, "FEAT-003"); m.tail.from = [...m.tail.from, ...f3.from]; f3.from = []; delete f3.also_applies; }), [word(String(f3Line)), /tail/i]],
			["shares_added held as a string", edit(M0, (m) => { featIn(m, "FEAT-001").shares_added = "R-002"; }), [/\bFEAT-001\b/, /shares_added/]],
			["a repeated ID in also_applies (sol r1 SHOULD 2)", edit(M0, (m) => { featIn(m, "FEAT-002").also_applies = ["R-001", "R-004", "R-001"]; }), [/\bFEAT-002\b/, word("R-001")]],
			["a repeated ID in shares_added (sol r1 SHOULD 2)", edit(M0, (m) => { const f = featIn(m, "FEAT-001"); f.shares_added = ["R-002", "R-002"]; f.also_applies = ["R-002"]; }), [/\bFEAT-001\b/, word("R-002")]],
			["a repeated ID in shares_dropped (sol r1 SHOULD 2)", edit(M0, (m) => { const f = featIn(m, "FEAT-002"); f.shares_dropped = ["R-004", "R-004"]; f.also_applies = ["R-001"]; }), [/\bFEAT-002\b/, word("R-004")]],
		];
		const files = Object.fromEntries(V.map(([, m], k) => [`maps/v${k}.json`, json(m)]));
		const empty = edit(M0, (m) => { const f = featIn(m, "FEAT-002"); f.shares_added = []; f.shares_dropped = []; });
		files["maps/empty.json"] = json(empty);
		const dryDir = plainDir("val-dry", S0, files);
		const repo = gitRepo("val-git", S0, files);
		const original = Buffer.from(S0, "utf8");
		V.forEach(([key, m, res], k) => {
			const rel = `maps/v${k}.json`;
			const dry = lift(["--root", dryDir, "--mapping", path.join(dryDir, rel)], scratch);
			const w = lift(["--root", repo.dir, "--mapping", path.join(repo.dir, rel), "--write"], scratch);
			const unchanged = ledgerOf(repo.dir)?.equals(original) ?? false;
			const v = lift(["--root", repo.dir, "--verify", "HEAD", "--mapping", path.join(repo.dir, rel)], scratch);
			out(`(v) ${key} is refused, named, in the dry run with no proof line, and --write and --verify exit 1 leaving the ledger unchanged (R-1167, T8)`,
				[Boolean(m), dry.status, crashed(dry), own(dry.stderr).some((l) => res.every((re) => re.test(l))), proofOf(dry.stdout), w.status, crashed(w), unchanged, v.status, crashed(v)],
				[true, 1, false, true, null, 1, false, true, 1, false], own(dry.stderr).slice(0, 3).join(" | "));
		});
		const dry = lift(["--root", dryDir, "--mapping", path.join(dryDir, "maps/empty.json")], scratch);
		const w = lift(["--root", repo.dir, "--mapping", path.join(repo.dir, "maps/empty.json"), "--write"], scratch);
		const seg2 = sharesOf(S0).get("FEAT-002")?.seg;
		out("(v) empty shares_added and shares_dropped arrays mean no change: the dry run proves with no share line and --write keeps FEAT-002's no-space share line byte-identical (R-1181 \"declares no change\", sol r1 SHOULD 1)",
			[Boolean(empty), dry.status, proofOf(dry.stdout) !== null, shareLinesOf(dry.stdout), w.status, sharesOf(ledgerOf(repo.dir) ?? "").get("FEAT-002")?.seg ?? null], [true, 0, true, [], 0, seg2], own(dry.stderr).concat(own(w.stderr)).slice(0, 3).join(" | "));
	}
	out("(harness) every scratch repository the run made persists core.autocrlf=false in its own config", [repos.length > 0, repos.filter((d) => persistedAutocrlf(d) !== "false").map((d) => path.basename(d))], [true, []]);
} finally {
	fs.rmSync(scratch, { recursive: true, force: true });
}

// ---------------------------------------------------------------- (e) rows
const change = spec("CHANGE.md");
const delta = change.slice(change.indexOf("## 2. Requirement delta"), change.indexOf("## 3. Design"));
const drafts = new Map(delta.split("\n").filter((l) => /^\| R-\d+ \|/.test(l)).map((l) => { const c = l.split("|").map((s) => s.trim()); return [c[1], c[3]]; }));
const NEW = ["R-1181", "R-1182", "R-1183"];
const shalls = (s) => ((s ?? "").replace(/`[^`]*`/g, "").match(/\bshall\b/gi) ?? []).length;
// The requirements skill: "one `shall` per row" (SKILL.md:9); CHANGE §2: "One `shall` per row".
out("(harness) CHANGE §2 gives one-shall text for each of R-1181 to R-1183, and the lane adds three rows", [NEW.map((id) => shalls(drafts.get(id))), NEW.filter((id) => drafts.has(id)).length, LANE_ROWS_ADDED], [NEW.map(() => 1), 3, 3]);
// §2 "R-1167 diff": the two clause edits, read from the plan (line-wrapped spans joined, escaped backticks unescaped).
const diffPara = delta.slice(delta.indexOf("**R-1167 diff.**"), delta.indexOf("The ledger clause says")).replace(/\s*\n\s*/g, " ");
const dm = /Ledger clause: `(.+?)` → `(.+?)`\. Mapping clause, inserted before `(.+?)`: `(.+?)`\.\s*$/.exec(diffPara);
const unesc = (s) => (s ?? "").replace(/\\`/g, "`");
const [ledgerOld, ledgerNew, anchor, insertion] = dm ? dm.slice(1, 5).map(unesc) : [null, null, null, null];
const reqLines = lines(text("REQUIREMENTS.md"));
const baseReqLines = lines(atBase("REQUIREMENTS.md"));
const rowAt = (id, ls = reqLines) => ls.findIndex((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
const cells = (id, ls = reqLines) => { const i = rowAt(id, ls); return i < 0 ? [] : ls[i].split(/(?<!\\)\|/).map((s) => s.trim()); };
const count = (s, sub) => (s && sub ? s.split(sub).length - 1 : 0);
const base1167 = cells("R-1167", baseReqLines)[2] ?? "";
out("(harness) §2's R-1167 diff parses into a ledger clause and a mapping clause, each found exactly once in the base row (§2)", [Boolean(dm), count(base1167, ledgerOld), count(base1167, anchor)], [true, 1, 1], diffPara.slice(0, 200));
const want1167 = dm ? base1167.replace(ledgerOld, ledgerNew).replace(anchor, `${insertion} ${anchor}`) : "(no diff)";
for (const id of NEW) {
	const rows = reqLines.filter((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
	out(`(e) ${id} is one row carrying CHANGE §2's text`, [rows.length, cells(id)[2] ?? null], [1, drafts.get(id) ?? "(no draft)"]);
}
out("(e) R-1181 to R-1183 each carry exactly one \"shall\" outside code spans (SKILL.md:9; §2 \"One `shall` per row\")", NEW.map((id) => shalls(cells(id)[2])), NEW.map(() => 1));
// §2 "FEAT-028 after R-1168"; §4 Overlap: the second lander puts its FEAT-028 rows after the other's. The anchor is
// R-1168 at the base, extended over any rows numbered above R-1168 that directly follow it there (a lane that landed
// first, e.g. the regroup lane's FEAT-028 rows); at e451c90 R-1000 follows R-1168, so the anchor is R-1168 itself.
const anchorRow = (() => {
	let i = rowAt("R-1168", baseReqLines);
	if (i < 0) return null;
	while (i + 1 < baseReqLines.length && Number(ROW.exec(baseReqLines[i + 1])?.[1]?.slice(2) ?? 0) > 1168) i++;
	return ROW.exec(baseReqLines[i])?.[1] ?? null;
})();
out("(harness) the anchor is R-1168 at the base, or the last of the rows numbered above it that directly follow it (§2, §4 Overlap)", typeof anchorRow === "string" && /^R-\d+$/.test(anchorRow), true, anchorRow);
{
	const chain = [anchorRow, ...NEW];
	const headParsed = TM.parseLedger(text("REQUIREMENTS.md") ?? "");
	const homeAt = new Map(TM.readRequirementRows(headParsed).map((r) => [r.id, r.heading?.id?.startsWith("SUB-") ? r.heading.parent?.id : r.heading?.id]));
	out(`(e) R-1181–R-1183 follow ${anchorRow} line by line in FEAT-028 (§2, §4 Overlap)`, [NEW.filter((id, k) => rowAt(id) < 0 || rowAt(id) !== rowAt(chain[k]) + 1), NEW.filter((id) => homeAt.get(id) !== "FEAT-028")], [[], []]);
}
out("(e) R-1167 carries the base text with §2's two clause edits and nothing else (§2 \"R-1167 diff\")", cells("R-1167")[2] ?? null, want1167);
const { entries, tree: rtTitles } = required("1", root);
const sourceCache = new Map();
const sourcesOf = (file, title) => { if (!sourceCache.has(file)) sourceCache.set(file, checkTitles(path.join(root, file)) ?? new Map()); return (sourceCache.get(file).get(title) ?? []).map((x) => `${file}::${x.cite}`); };
const cites = (s) => [...(s ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]);
const wantCites = (id) => [...new Set(entries.filter(([, , rows]) => rows.includes(id)).flatMap(([file, title]) => { const s = sourcesOf(file, title); return s.length ? s : [`${file}::${title} (not in the test file)`]; }))];
for (const id of NEW) {
	const want = wantCites(id);
	out(`(e) ${id}'s evidence cites its §5 title(s) as the rail reads them`, want.length ? want.filter((c) => !cites(cells(id)[4]).includes(c)) : "no §5 title for this row", []);
}
{
	const ev = cites(cells("R-1167")[4]), baseEv = cites(cells("R-1167", baseReqLines)[4]);
	const t22b = `${LT}::${T22B}`;
	out("(e) R-1167's evidence cites T7 and T8, drops T22b's title and keeps every other base citation (§2: \"T22b's title leaves; T7 and T8 join\")",
		[wantCites("R-1167").filter((c) => !ev.includes(c)), ev.includes(t22b), baseEv.filter((c) => c !== t22b && !ev.includes(c))], [[], false, []]);
}
// §5 T9 renames the title under `// req: R-291`; R-291's evidence cites no leaf-total title at e451c90, so none is required,
// but the base one must not be cited once renamed.
out("(guard) R-291's evidence does not cite the base leaf-total title (T9 renames it)", rtTitles.error ? rtTitles.error : cites(cells("R-291")[4]).includes(`${RT}::${rtTitles.before}`), false);
out("(e) R-1181 to R-1183, R-1167 and R-291 read implemented", [...NEW, "R-1167", "R-291"].filter((id) => (cells(id)[3] ?? "") !== "implemented"), []);
out("(guard) R-291's evidence keeps every base citation other than the base leaf-total title", rtTitles.error ? rtTitles.error : cites(cells("R-291", baseReqLines)[4]).filter((c) => !c.endsWith(rtTitles.before) && !cites(cells("R-291")[4]).includes(c)), []);
const baseIds = baseReqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
const headIds = reqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
out("(guard) no base row other than R-1167 changes its Requirement text or Status (§2)", baseIds.filter((id) => id !== "R-1167").filter((id) => { const a = cells(id, baseReqLines), b = cells(id); return a[2] !== b[2] || a[3] !== b[3]; }), []);
out(`(e) the row set is the base's plus R-1181 to R-1183, each once: leaf total ${baseIds.length} → ${baseIds.length + LANE_ROWS_ADDED} (§2)`,
	{ added: headIds.filter((id) => !baseIds.includes(id)).sort(), removed: baseIds.filter((id) => !headIds.includes(id)), count: headIds.length }, { added: [...NEW].sort(), removed: [], count: baseIds.length + NEW.length });
out("(e) the leaf totals agree with R-291's renamed title (T9)", rtTitles.error ? rtTitles.error : [rtTitles.beforeTotal, rtTitles.afterTotal], [baseIds.length, headIds.length]);
const treeHeads = (ls) => ls.filter((l) => /^#{1,3} (CAP|FEAT|SUB)-/.test(l));
out(`(guard) nana-pi's tree headings are the base's (${treeHeads(baseReqLines).length}; §2 "no tree change")`, treeHeads(reqLines), treeHeads(baseReqLines));
out("(harness) R-1181 to R-1183 are unused at the base (§2)", baseReqLines.filter((l) => /\bR-118[1-3]\b/.test(l)).length, 0);
const rail = node(["scripts/requirements-trace.mjs"]);
out("(guard) the trace rail is green: node scripts/requirements-trace.mjs exits 0 (§5 Suite)", rail.status, 0, (rail.stdout + rail.stderr).split("\n").filter((l) => /^\s{2}\S/.test(l)).slice(0, 5).join(" | "));

// ---------------------------------------------------------------- (f) scope
// §4 "In.", quoted: "`scripts/requirements-lift.mjs`: … `scripts/requirements-lift-proof.mjs`: … `requirements-lift.test.mjs`
// (T1 to T8; T22b removed); `requirements-tree.test.mjs` (T9). `REQUIREMENTS.md` (three rows, R-1167), regenerated
// `docs/requirements-tree.md` and `docs/code-map.md`, `HANDOFF.md:63`'s share sentence, `docs/sessions/2026-10.md`, and the
// corpus `docs/reviews/regroup-shares-2026-10-15/` … If this lane lands second: `scripts/requirements-regroup.mjs`'s
// `PROPOSAL_KEYS` and `requirements-regroup.test.mjs` (T10)."
const regroup = regroupAtBase(root);
const SCOPE = [LIFT_SCRIPT, PROOF_SCRIPT, LT, RT, "REQUIREMENTS.md", "docs/requirements-tree.md", "docs/code-map.md", "HANDOFF.md", "docs/sessions/2026-10.md", ...(regroup.landed ? [REGROUP_SCRIPT, RG] : [])];
const SCOPE_PREFIX = "docs/reviews/regroup-shares-2026-10-15/";
const diff = git("diff", "--name-only", `${base}..HEAD`);
const changed = diff.stdout.split("\n").filter(Boolean);
out(`(guard) git diff --name-only ${base.slice(0, 7)}..HEAD lists only §4 In paths and this review folder`, diff.status === 0 ? changed.filter((p) => !SCOPE.includes(p) && !p.startsWith(SCOPE_PREFIX)) : `git exit ${diff.status}`, []);
// §3.6: "No change to the tree checker …, the requirements skill …, `packages/nana-setup/**`, … or any other project."
const FROZEN = [RT_SCRIPT, "packages/nana-pack/skills/requirements/", "packages/nana-setup/"];
out("(guard) the merge-base diff touches nothing §3.6 names: the tree checker, the requirements skill, packages/nana-setup/ (§3.6, §5 Suite)", changed.filter((p) => FROZEN.some((x) => p === x || p.startsWith(x))), []);
const liftProbe = node(["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(LIFT).href)}); console.log(JSON.stringify([m.MAPPING_FORMAT, m.PROBLEM_LINE_CAP, typeof m.buildIdentityMapping, typeof m.applyMapping]));`]);
out("(guard) MAPPING_FORMAT stays 1 and PROBLEM_LINE_CAP 40, and buildIdentityMapping and applyMapping stay exported (§3.6, S6; §5 A1 builds from the export)", lines(liftProbe.stdout).at(-1) ?? null, JSON.stringify([1, 40, "function", "function"]), own(liftProbe.stderr).slice(-2).join(" "));
// R-1163: the proof imports only the tree module, the trace shim and node builtins, and nothing it reaches is the lift module.
const importsOf = (abs) => { let src; try { src = fs.readFileSync(abs, "utf8"); } catch { return null; } return [...src.matchAll(/(?:^|[\s;])(?:import|export)\s*(?:[^'"`;]*?\sfrom\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1] ?? m[2]); };
const direct = importsOf(PROOF);
const reach = new Set(); const stack = direct ? [PROOF] : [];
while (stack.length) { const f = stack.pop(); if (reach.has(f)) continue; reach.add(f); for (const s of importsOf(f) ?? []) if (s.startsWith(".")) stack.push(path.resolve(path.dirname(f), s)); }
out("(guard) the proof module imports only the tree module, the trace shim and node builtins, and reaches no lift module (R-1163; §3.1 \"R-1163 bars only the lift module\")",
	direct === null ? "no proof module" : [direct.filter((s) => !s.startsWith("node:") && !["./requirements-tree.mjs", "./requirements-trace.mjs"].includes(s)), [...reach].filter((f) => path.basename(f) === "requirements-lift.mjs")], [[], []]);
const handoff = collapse(text("HANDOFF.md") ?? "");
out("(f) HANDOFF.md's share sentence reads that the lift carries shares and changes one only where the mapping declares it, and no longer that it refuses a ledger with shares (residual 5, §4 In)",
	[/the lift carries shares and changes one only where the mapping declares it/i.test(handoff), /the tool refuses a ledger with shares/i.test(handoff)], [true, false]);
for (const [label, args] of [["node scripts/requirements-tree.mjs --check", [RT_SCRIPT, "--check"]], ["map:check (node scripts/code-map.mjs --check)", ["scripts/code-map.mjs", "--check"]], ["readme:check (node scripts/readme-check.mjs)", ["scripts/readme-check.mjs"]]]) {
	const r = node(args);
	out(`(guard) ${label} exits 0 (§5 Suite)`, r.status, 0, (r.stdout + r.stderr).slice(-300));
}
out("(f) HANDOFF.md and the session entry docs/sessions/2026-10.md are in the lane's diff (§4 In, the land checklist)", ["HANDOFF.md", "docs/sessions/2026-10.md"].filter((p) => !changed.includes(p)), []);
// The build must be committed: an untracked or modified path outside this review folder would pass every case above
// that reads the working tree.
out("(guard) the build is committed: no uncommitted or untracked path outside this review folder (§4)", lines(statusBefore).filter((l) => !l.slice(3).startsWith(SCOPE_PREFIX)), []);

// ---------------------------------------------------------------- (k) the cross-lane key handoff (§4 Overlap, S11)
if (regroup.error) out("(harness) whether the regroup lane is in the base can be read", regroup.error, null);
else if (!regroup.landed) console.log(`note PROPOSAL_KEYS and T10: ${REGROUP_SCRIPT} is not in the base ${base.slice(0, 7)}, so the regroup lane has not landed; its merge of main owns adding shares_added and shares_dropped to PROPOSAL_KEYS and writing T10 (§4 Overlap, S11). Not checked here.`);
else {
	// The regroup plan names PROPOSAL_KEYS as "each object level's keys" (regroup CHANGE.md §3.4) without a shape; the
	// feature level is read as an array or a Set under `feature` or `features` (INFERRED from that plan, not from code).
	const kp = node(["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(path.join(root, REGROUP_SCRIPT)).href)}); const K = m.PROPOSAL_KEYS; const f = K?.feature ?? K?.features; const has = (k) => Array.isArray(f) ? f.includes(k) : f instanceof Set ? f.has(k) : false; console.log(JSON.stringify([Boolean(f), has("shares_added"), has("shares_dropped")]));`]);
	out("(k) the regroup checker's PROPOSAL_KEYS lets a feature hold shares_added and shares_dropped (§4 Overlap, S11, R-1177, T10)", lines(kp.stdout).at(-1) ?? null, JSON.stringify([true, true, true]), own(kp.stderr).slice(-2).join(" "));
}

// ---------------------------------------------------------------- (g) the §5 titles print PASS
const runs = new Map();
for (const file of [LT, RT, ...(regroup.landed ? [RG] : [])]) {
	const r = node(["--experimental-strip-types", file], root);
	runs.set(file, r);
	out(`(guard) ${file} exits 0 (§5 Suite)`, r.status, 0, lines(r.stdout).filter((l) => /^FAIL /.test(l)).slice(0, 3).join(" | ") + own(r.stderr).slice(-2).join(" | "));
}
const printed = (file, word, title) => lines(runs.get(file)?.stdout).filter((l) => l.startsWith(`${word} ${title}`) && l.slice(word.length + 1 + title.length).trim() === "").length;
out("(g) every §5 title prints PASS exactly once and never FAIL or SKIP", entries.filter(([file, title]) => printed(file, "PASS", title) !== 1 || printed(file, "FAIL", title) || printed(file, "SKIP", title)).map(([, title]) => title.slice(0, 60)), [], `${entries.length} titles`);
out("(guard) T22 keeps its title and prints PASS once (§2: \"T22 keeps its title and stays green\")", printed(LT, "PASS", T22), 1);

out("(harness) the run wrote nothing inside the checkout (git status unchanged)", statusOf() === statusBefore, true);
console.log(`cases: ${n - bad}/${n} (build cases red: ${badBuild}/${nBuild}; guard and harness red: ${bad - badBuild}/${n - nBuild})`);
console.log(`regroup-shares acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
