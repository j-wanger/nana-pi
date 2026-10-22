// Seat acceptance for lane lift (frozen; written by the seat 2026-10-14 before the build, from CHANGE.md §5 "Seat
// acceptance", the observable clauses of §2's rows R-1162 to R-1169, §3's design, §3.8 and §4's scope, plan frozen at
// 2a859ef). Run from anywhere inside the checkout under test; the build is read from the cwd's git root, the spec
// (CHANGE.md, seat-titles.mjs) from this script's own folder:
//   node docs/reviews/lift-2026-10-14/acceptance.mjs
// The real ledgers are read ONLY from the seat's copies (LIFT_LEDGERS, default ~/.cache/nana-lift-ledgers, outside every
// repo; never a project), each pinned by its SHA-256 below, and copied again into this run's scratch folder before any run.
// A missing or changed copy reds its harness case by name and skips (d), (v) and (w).
// (a) seat-titles 1 prints `seat-titles 1: 0 missing`.
// (d) dry runs on copies of the real ledgers (R-1162, §5): work-desk → 6 capabilities, 41 features, 2 subgroups, 3
//     header pairs, proof clean; basketball-geek's HEAD copy → 1/9/0; trading-zone → CAP-01, CAP-90, CAP-02 with
//     FEAT-005–FEAT-011 under CAP-02 and 0 checker problems; yokai-world refused naming its tree-heading count; a
//     prose-only ledger refused for no rows. Every plan line carries its heading's row count, read from the written
//     ledger (R-1162). Each lifted output (written with --write in a scratch git copy) is read by
//     this script's own parser: headings, labels, parents, row homes, the seed's reserved nodes, every row segment
//     byte-identical, every other input line kept in order (R-1163, R-1165). The tip's proveLift, called directly,
//     refuses trading-zone's default lift tampered so sections 5–11 sit under CAP-90 with a placement problem, and in
//     mapping mode an output whose parent differs from the mapping's (R-1163, §3.5 check 9).
// (v) basketball-geek's CRLF, BOM+CRLF and mixed-ending copies keep 171/171 rows byte-identical (R-1163, §5); an
//     ANSI-appended copy is refused naming its line (R-1167).
// (w) a scratch git repo: the six uncommitted rows in its main checkout make --write from a lane worktree refuse,
//     naming that checkout, and so do they for a project in a subfolder (R-1164); clean, --write, commit, --verify
//     <base> exits 0, refuses an uncommitted ledger edit naming the file, and names a hand-edited line (R-1168); three
//     prose notes are committed into the lift; --emit-mapping gives the identity mapping that round-trips (R-1162, §3.2);
//     the regroup rehearsal (two capabilities, one merge, three moved rows, one proposed feature, one feature moved
//     under another capability) validates, proves, prints its moves and row counts and writes, each note under its
//     mapped node (R-1163, R-1166); --verify refuses an uncommitted mapping change naming it (R-1168); a BOM'd mapping is
//     accepted and an ANSI one refused naming its line (R-1166, R-1167); usage errors and the --verify conflicts exit 2
//     and create no file (R-1167, §3.6). Every scratch repo persists core.autocrlf=false, so the lift's own git reads it.
// (s) the requirements skill names the dry run, the owner's yes, every worktree, telling the owner about uncommitted
//     ledger edits and never discarding another session's lines, and shows only flags the lift's source has, whole-flag,
//     inside backticks or not (R-1169, §3.7).
// (e) rows R-1162 to R-1169 carry §2's text with one `shall`, sit where §2 says, cite their §5 titles (read from
//     seat-titles.mjs, the one title list) and read implemented; R-291 cites its renamed title; no base row changes
//     text or status; the row set is the base's plus these eight; the tree headings are the base's (68).
// (f) `git diff --name-only <base>..HEAD` ⊆ §4 In plus this review folder; nothing in §3.8; the tree module gains
//     exactly four `export` keywords; the proof module imports nothing from the lift module (§3.1, R-1163); the
//     lift's tunables (§3.1); README names both scripts; map/readme/tree/trace checks; the build is committed.
// (g) the three test files exit 0 and print PASS once for every §5 title.
// <base> is `git merge-base main HEAD` (d9cf0bc when written), so a merge of a newer main moves it with the lane.
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
const { required, repoRoot, checkTitles, LANE_ROWS_ADDED, LT, TR, RT } = await import(pathToFileURL(SEAT_TITLES).href);
const root = repoRoot();
if (!fs.existsSync(path.join(LANE_DIR, "CHANGE.md")) || !fs.existsSync(path.join(root, "scripts/requirements-tree.mjs"))) {
	console.error("run inside a nana-pi checkout: node <lane>/docs/reviews/lift-2026-10-14/acceptance.mjs");
	process.exit(2);
}
// The seat's read-only copies of the real ledgers (plan-lift/ledgers, research-ledgers.md §1), copied 2026-10-14 to a
// folder outside every repo so they outlive the session scratch.
const LEDGERS = process.env.LIFT_LEDGERS ?? path.join(os.homedir(), ".cache", "nana-lift-ledgers");
// Measured 2026-10-14 (shasum -a 256 on plan-lift/ledgers/<name>/REQUIREMENTS.md, equal on the ~/.cache copies).
const LEDGER_SHA256 = {
	"work-desk": "63af2a19f0499aac58e770e2e1fdb68cc71856c1d8e5446926013804b26a5e86",
	"basketball-geek": "133d715bfea77ff7f9f19cc1e572261b8c739cb9d75570d44ed3810d476b6564",
	"basketball-geek-HEAD": "775f126a3848f62b382029534a99e80da46e0455092ab4046361721286f83683",
	"trading-zone": "a7db29abcc1ec32356a8a664f0ed38c37683a5358b413b5245829d414c2581da",
	"yokai-world": "6a8426337e7986b772468d7f82df96c4ede29ad998335885552f8c7a6de59ed7",
	nanaclaw: "657664af9dc027d3a7f5dfedda586e67cb51c0078b4714a49b7244eb243a59c0",
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
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, "")); } catch { return null; } };

const LIFT_SCRIPT = "scripts/requirements-lift.mjs";
const PROOF_SCRIPT = "scripts/requirements-lift-proof.mjs";
const RT_SCRIPT = "scripts/requirements-tree.mjs";
const LIFT = path.join(root, LIFT_SCRIPT);
const TREE = path.join(root, RT_SCRIPT);
const LIFT_SKILL_CMD = 'node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root .'; // R-1169
const ROW = /^\|\s*([RG]-(?:[0-9]{3}|[1-9][0-9]{3}))\s*\|/;
const TREE_HEADING = /^(#{1,3}) (CAP-\d{2}|FEAT-\d{3}|SUB-\d{3}) · (.+)$/;
const TREE_ID = /\b(CAP-\d{2}|FEAT-\d{3}|SUB-\d{3})\b/g;
const TABLE_HEADER = "| ID | Requirement | Status | Evidence |";
const DELIM = /^\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*:?-+:?\s*\|\s*$/;
// §3.5's one line, verbatim.
const PROOF = /^lift proof: (\d+) rows kept byte-identical; (\d+) prose lines carried; (\d+) headings replaced; (\d+) lines inserted; tree check 0 problems$/;
const UNSORTED = "Not yet sorted:"; // §3.1 UNSORTED_PREFIX (contract)
const UNSORTED_CAP = "Not yet sorted"; // §3.3 rule 3: `# CAP-nn · Not yet sorted`
const KEPT = ["Open questions", "Deliberate omissions"]; // §3.3 rule 5
// Node's own warning block (MODULE_TYPELESS_PACKAGE_JSON on the .ts import through the trace shim).
const NODE_WARNING = [/^\(node:\d+\) /, /^Reparsing as ES module because/, /^To eliminate this warning, add "type": "module"/, /^\(Use `node --trace-warnings/];
const own = (stderr) => lines(stderr).filter((l) => !NODE_WARNING.some((re) => re.test(l)));
const node = (args, cwd = root, extra = {}) => spawnSync(process.execPath, args, { cwd, encoding: "utf8", timeout: 300_000, env: cleanEnv(), ...extra });
const lift = (args, cwd) => node([LIFT, ...args], cwd);
/** A refusal must be the lift's own named one, never Node's crash (a missing module, an uncaught throw and its stack). */
const crashed = (r) => /Cannot find module|\bERR_[A-Z_]+|^\s+at .+:\d+:\d+\)?$/m.test(r?.stderr ?? "") || r?.status === null;
const tree = (dir, cwd) => node([TREE, "--root", dir], cwd);

// ---------------------------------------------------------------- independent readers (never the lift's code)
const bomless = (buf) => { const t = Buffer.isBuffer(buf) ? buf.toString("utf8") : (buf ?? ""); return t.startsWith("﻿") ? t.slice(1) : t; };
/** Raw segments with their own terminators, after the BOM: the plan's `body.split(/(?<=\n)/)` (§3.4). */
const segs = (buf) => { const t = bomless(buf); return t === "" ? [] : t.split(/(?<=\n)/); };
const bare = (seg) => seg.replace(/\r?\n$/, "");
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
/** Tree headings (outside fences) with level, parent, label, purpose, outcome, status and direct rows; ordinary headings; rows. */
function readTree(src) {
	const ls = segs(src).map(bare);
	const fenced = fenceMask(ls);
	const headings = [], rows = [], ordinary = [];
	let cap = null, feat = null, sub = null, last = null;
	ls.forEach((l, i) => {
		if (fenced[i]) return;
		const atx = /^ {0,3}(#{1,6})(?:[ \t]+(.*))?$/.exec(l);
		if (atx) {
			const t = TREE_HEADING.exec(l);
			const level = atx[1].length;
			if (t) {
				const h = { line: i + 1, level, id: t[2], label: t[3], parent: null, purpose: null, outcome: null, status: null, rows: [] };
				if (level === 1) { cap = h; feat = null; sub = null; }
				else if (level === 2) { feat = h; sub = null; h.parent = cap?.id ?? null; }
				else { sub = h; h.parent = feat?.id ?? null; }
				headings.push(h); last = h;
			} else {
				ordinary.push({ line: i + 1, level, text: (atx[2] ?? "").trim().replace(/\s+#+\s*$/, "") });
				if (level <= 1) cap = null;
				if (level <= 2) feat = null;
				if (level <= 3) sub = null;
				last = null;
			}
			return;
		}
		if (last && /^Purpose:/.test(l) && last.purpose === null) last.purpose = l.slice(8).trim();
		if (last && /^Outcome:/.test(l) && last.outcome === null) last.outcome = l.slice(8).trim();
		if (last && /^Status:/.test(l) && last.status === null) last.status = l.slice(7).trim();
		const r = ROW.exec(l);
		if (r) { rows.push({ id: r[1], line: i + 1, cap: cap?.id ?? null, feat: feat?.id ?? null, sub: sub?.id ?? null }); (sub ?? feat)?.rows.push(r[1]); }
	});
	return { lines: ls, headings, rows, ordinary };
}
/** Old ATX headings at levels 1–3 outside fences: the title, the kept sections and the sections the lift turns into nodes. */
function oldHeadings(buf) {
	const ls = segs(buf).map(bare);
	const fenced = fenceMask(ls);
	const hs = [];
	ls.forEach((l, i) => { if (fenced[i]) return; const m = /^ {0,3}(#{1,3})(?:[ \t]+(.*?))?[ \t]*$/.exec(l); if (m && !/^ {0,3}#{4}/.test(l)) hs.push({ line: i + 1, level: m[1].length, label: (m[2] ?? "").replace(/\s+#+\s*$/, "").trim() }); });
	const title = hs[0]?.level === 1 && hs[0].line === 1 ? hs[0] : null;
	const kept = hs.filter((h) => h.level === 2 && KEPT.includes(h.label));
	const sections = hs.filter((h) => h !== title && !kept.includes(h));
	return { title, kept, sections, lines: ls, fenced };
}
/** Each row's raw segment (terminator included) keyed by ID, in file order. */
function rowSegments(buf) {
	const m = new Map(), order = [];
	for (const s of segs(buf)) { const r = ROW.exec(bare(s)); if (r) { m.set(r[1], [...(m.get(r[1]) ?? []), s]); order.push(r[1]); } }
	return { m, order };
}
/** [rows whose single segment is byte-identical in both, rows in the input, the IDs that differ]. */
function rowsKept(inBuf, outBuf) {
	const a = rowSegments(inBuf), b = rowSegments(outBuf);
	let same = 0; const diff = [];
	for (const [id, ss] of a.m) { const o = b.m.get(id) ?? []; if (ss.length === 1 && o.length === 1 && o[0] === ss[0]) same++; else diff.push(id); }
	for (const id of b.m.keys()) if (!a.m.has(id)) diff.push(id);
	return { same, total: a.m.size, diff, orderIn: a.order, orderOut: b.order };
}
const DECLARED = (l, closing, inputHeadings) => l === "" || TREE_HEADING.test(l) || /^(Purpose|Outcome|Status):/.test(l) || l === TABLE_HEADER || DELIM.test(l) || l === closing || inputHeadings.has(l);
/**
 * The default lift (R-1163, R-1165): every input segment except an old heading and a table header or delimiter line
 * appears in the output, byte for byte, in input order; every other output line is a declared kind (a tree heading, a
 * field line, a table header or delimiter, the closing heading, a blank line, or an input heading kept verbatim).
 */
function accountDefault(inBuf, outBuf, closing) {
	const a = segs(inBuf), b = segs(outBuf);
	const fenced = fenceMask(a.map(bare));
	const isHeading = (l) => /^ {0,3}#{1,6}(?:[ \t]|$)/.test(l);
	const required = a.map((s, i) => ({ s, i })).filter(({ s, i }) => fenced[i] || !(isHeading(bare(s)) || bare(s) === TABLE_HEADER || DELIM.test(bare(s))));
	const old = oldHeadings(inBuf);
	const inputHeadings = new Set([old.title, ...old.kept].filter(Boolean).map((h) => old.lines[h.line - 1])); // the title and the kept sections' headings, verbatim
	const matched = new Set();
	let k = 0, missing = null;
	for (const { s, i } of required) {
		while (k < b.length && b[k] !== s) k++;
		if (k >= b.length) { missing = i + 1; break; }
		matched.add(k++);
	}
	const stray = b.map((s, i) => ({ s, i })).filter(({ s, i }) => !matched.has(i) && !DECLARED(bare(s), closing, inputHeadings)).map(({ s, i }) => `${i + 1}: ${bare(s).slice(0, 60)}`);
	return { missing, stray: stray.slice(0, 5), strayCount: stray.length };
}
/** Mapping mode (R-1163): non-row lines other than headings, field lines and table structure, as a multiset. */
function proseMultiset(buf) {
	const ls = segs(buf).map(bare);
	const fenced = fenceMask(ls);
	return ls.filter((l, i) => fenced[i] || !(l === "" || /^ {0,3}#{1,6}(?:[ \t]|$)/.test(l) || /^(Purpose|Outcome|Status):/.test(l) || l === TABLE_HEADER || DELIM.test(l) || ROW.test(l))).sort();
}
const blanks = (buf) => segs(buf).map(bare).filter((l) => l === "").length;
const fileList = (dir) => { const acc = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.name === ".git") continue; if (e.isDirectory()) walk(p); else acc.push(`${path.relative(dir, p)} ${sha(fs.readFileSync(p)).slice(0, 12)}`); } }; walk(dir); return acc.sort(); };
const idLines = (stdout) => lines(stdout).filter((l) => !PROOF.test(l) && new RegExp(TREE_ID.source).test(l));
const idSet = (stdout) => [...new Set(lines(stdout).flatMap((l) => [...l.matchAll(TREE_ID)].map((m) => m[1])))].sort();
const proofOf = (stdout) => { const ps = lines(stdout).map((l) => PROOF.exec(l)).filter(Boolean); return ps.length === 1 ? { rows: +ps[0][1], prose: +ps[0][2], headings: +ps[0][3], inserted: +ps[0][4] } : null; };
const pad = (v, w) => String(v).padStart(w, "0");
const expandIds = (list) => (list ?? []).flatMap((item) => {
	const r = /^([RG])-(\d+)–([RG])-(\d+)$/.exec(String(item));
	if (!r) return [String(item)];
	const out2 = []; for (let v = +r[2]; v <= +r[4]; v++) out2.push(`${r[1]}-${pad(v, r[2].length === 4 || v >= 1000 ? 4 : 3)}`);
	return out2;
});
/** Mapping nodes in output order: { id, level, parent, node }. */
const mappingNodes = (m) => (m?.tree ?? []).flatMap((c) => [{ id: c.id, level: 1, parent: null, node: c }, ...(c.features ?? []).flatMap((f) => [{ id: f.id, level: 2, parent: c.id, node: f }, ...(f.subgroups ?? []).map((s) => ({ id: s.id, level: 3, parent: f.id, node: s }))])]);
/** Expected default heading sequence from §3.3's rules as §5 states them for each ledger. */
function expectSeq(entries) {
	let c = 0, f = 0, s = 0; const seq = []; let capId = null, featId = null;
	for (const e of entries) {
		const id = e.id ?? (e.level === 1 ? `CAP-${pad(++c, 2)}` : e.level === 2 ? `FEAT-${pad(++f, 3)}` : `SUB-${pad(++s, 3)}`);
		const parent = e.level === 1 ? null : e.level === 2 ? capId : featId;
		if (e.level === 1) { capId = id; featId = null; } else if (e.level === 2) featId = id;
		seq.push([id, e.label, parent]);
	}
	return seq;
}
const seqOf = (t) => t.headings.map((h) => [h.id, h.label, h.parent]);
/** A heading's row count as the written ledger holds it: its own rows and every descendant's. */
const subtreeRows = (t, h) => h.rows.length + t.headings.filter((x) => x.parent === h.id).reduce((s, x) => s + subtreeRows(t, x), 0);
/**
 * R-1162's "with its row count": the written ledger's headings that no plan line carries with their count. A plan line
 * carries a heading when it names the heading's ID and, once its tree IDs and the heading's label are removed, still
 * holds the count as a number (labels such as "1. Data sourcing" or "2026-10-01" never supply it).
 */
const countMisses = (stdout, t) => {
	const ls = lines(stdout).filter((l) => !PROOF.test(l));
	return t.headings.filter((h) => {
		const want = subtreeRows(t, h);
		return !ls.some((l) => [...l.matchAll(TREE_ID)].some((m) => m[1] === h.id)
			&& (l.split(h.label).join(" ").replace(TREE_ID, " ").match(/\d+(?:,\d{3})*/g) ?? []).some((s) => Number(s.replace(/,/g, "")) === want));
	}).map((h) => `${h.id}=${subtreeRows(t, h)}`);
};

const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "lift-accept-")));
const copyLedger = (label, content, sub = "") => { const d = path.join(scratch, label); fs.mkdirSync(path.join(d, sub), { recursive: true }); fs.writeFileSync(path.join(d, sub, "REQUIREMENTS.md"), content); return d; };
// Each scratch repo persists core.autocrlf=false in its own config (§5: "each pinning core.autocrlf=false"), so the
// lift's own git calls read it; the `-c` in gitIn covers only this script's calls.
const repos = [];
const gitRepo = (label, content, sub = "") => {
	const d = copyLedger(label, content, sub);
	const r = [gitIn(d, "init", "-q", "-b", "main"), gitIn(d, "config", "core.autocrlf", "false"), gitIn(d, "add", "-A"), gitIn(d, "commit", "-qm", "flat ledger")];
	repos.push(d);
	return { dir: d, ok: r.every((x) => x.status === 0), head: gitIn(d, "rev-parse", "HEAD").stdout.trim() };
};
const persistedAutocrlf = (d) => spawnSync("git", ["config", "--get", "core.autocrlf"], { cwd: d, encoding: "utf8", env: cleanEnv() }).stdout.trim();
const crlf = (s) => s.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");
const utf8Bom = (b) => Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.isBuffer(b) ? b : Buffer.from(b)]);
try {
	out("(harness) git merge-base main HEAD resolves", /^[0-9a-f]{40}$/.test(base), true, base);
	out("(harness) the scratch folder is outside the checkout", path.relative(fs.realpathSync(root), scratch).startsWith(".."), true, scratch);
	// The seat's copies, copied again into this run's scratch before any run (never a project's file).
	const SRC = { work: "work-desk", bg: "basketball-geek", bgHead: "basketball-geek-HEAD", tz: "trading-zone", yokai: "yokai-world", prose: "nanaclaw" };
	const L = {};
	for (const [k, d] of Object.entries(SRC)) L[k] = readBuf(path.join(LEDGERS, d, "REQUIREMENTS.md"));
	const pinMisses = Object.entries(SRC).map(([k, d]) => (L[k] === null ? `${d}: missing` : sha(L[k]) !== LEDGER_SHA256[d] ? `${d}: changed (sha256 ${sha(L[k]).slice(0, 12)})` : null)).filter(Boolean);
	const ledgersOk = out(`(harness) the seat's six ledger copies under ${LEDGERS} exist and match their pinned SHA-256`, pinMisses, []);
	const rowCount = (b) => segs(b).filter((s) => ROW.test(bare(s))).length;
	out("(harness) the seat's ledger copies: work-desk 365 rows, basketball-geek 171 (165 at HEAD), trading-zone 197, yokai-world a tree, the prose-only ledger no row (research-ledgers.md §1–§5)",
		[rowCount(L.work), rowCount(L.bg), rowCount(L.bgHead), rowCount(L.tz), readTree(L.yokai).headings.length > 0, L.prose ? rowCount(L.prose) : null], [365, 171, 165, 197, true, 0], LEDGERS);
	const seedText = text("templates/_shared/requirements-general.md") ?? "";
	const seed = readTree(seedText);
	const seedSub = new Map(seed.rows.map((r) => [r.id, r.sub]));
	const seedHead = new Map(seed.headings.map((h) => [h.id, h]));
	const closing = (text("templates/python/template/REQUIREMENTS.md.jinja") ?? "").split("\n").find((l) => /^# Open questions and deliberate omissions$/.test(l)) ?? null;
	out("(harness) the seed parses to CAP-90, FEAT-900, SUB-900 to SUB-904 with 22 G rows, and the Python seed carries the closing heading", [seed.headings.map((h) => h.id), seedSub.size, closing], [["CAP-90", "FEAT-900", "SUB-900", "SUB-901", "SUB-902", "SUB-903", "SUB-904"], 22, "# Open questions and deliberate omissions"]);
	out("(d) scripts/requirements-lift.mjs and scripts/requirements-lift-proof.mjs exist (§4 In)", [fs.existsSync(LIFT), fs.existsSync(path.join(root, PROOF_SCRIPT))], [true, true]);

	// ---------------------------------------------------------------- (a) the title check
	const titles = node([SEAT_TITLES, "1"]);
	const titleLines = lines(titles.stdout);
	out("(a) seat-titles 1 prints `seat-titles 1: 0 missing` and exits 0 (§5: every T1–T31 title exists under its req: marker)", [titleLines.at(-1) ?? null, titles.status], ["seat-titles 1: 0 missing", 0],
		titleLines.filter((l) => !/^(ok|gone) /.test(l)).slice(0, 4).join(" | ") + titles.stderr);

	// ---------------------------------------------------------------- (d) dry runs and lifts of the real ledgers
	ledgerCases: {
	if (!ledgersOk) { console.log("skip (d), (v) and (w): the seat's ledger copies failed their pins (harness case above)"); break ledgerCases; }
	/** A dry run on a plain copy (no git), and a --write on a committed copy: what the plan prints and what it writes. */
	const runLedger = (label, bytes) => {
		const dir = copyLedger(`dry-${label}`, bytes);
		const before = fileList(dir);
		const dry = lift(["--root", dir], scratch);
		const unchanged = JSON.stringify(fileList(dir)) === JSON.stringify(before);
		const repo = gitRepo(`git-${label}`, bytes);
		const head0 = repo.head;
		const w = lift(["--root", repo.dir, "--write"], scratch);
		const outBuf = readBuf(path.join(repo.dir, "REQUIREMENTS.md"));
		const st = gitIn(repo.dir, "status", "--porcelain").stdout;
		const head1 = gitIn(repo.dir, "rev-parse", "HEAD").stdout.trim();
		return { dir, dry, unchanged, repo, w, outBuf, t: readTree(outBuf), st, headSame: head0 === head1 };
	};
	const commonCases = (tag, bytes, r, nodes) => {
		const proof = proofOf(r.dry.stdout);
		const old = oldHeadings(bytes);
		out(`(d) ${tag}: the dry run exits 0, prints one line per planned heading (${nodes.length}), no move line and the proof line with ${rowCount(bytes)} rows, ${old.sections.length} headings replaced and tree check 0 problems, writes nothing (R-1162, R-1163, §3.5)`,
			[r.dry.status, idLines(r.dry.stdout).length, idSet(r.dry.stdout), proof?.rows ?? null, proof?.headings ?? null, own(r.dry.stderr), r.unchanged], [0, nodes.length, [...nodes].sort(), rowCount(bytes), old.sections.length, [], true], r.dry.stdout.slice(-300) + own(r.dry.stderr).slice(0, 3).join(" | "));
		out(`(d) ${tag}: --write on a clean committed copy exits 0 with the same proof line, stages nothing and commits nothing (R-1164, §3.8)`,
			[r.w.status, JSON.stringify(proofOf(r.w.stdout)) === JSON.stringify(proof) && proof !== null, r.headSame, r.st], [0, true, true, " M REQUIREMENTS.md\n"], own(r.w.stderr).slice(0, 3).join(" | "));
		out(`(d) ${tag}: every dry-run plan line carries its heading's row count, its own rows and its children's, as the written ledger holds them (R-1162)`,
			[r.dry.status, r.t.headings.length > 0, countMisses(r.dry.stdout, r.t)], [0, true, []], idLines(r.dry.stdout).slice(0, 3).join(" | "));
		const wrote = r.w.status === 0 && Boolean(r.outBuf) && !r.outBuf.equals(bytes);
		const kept = rowsKept(bytes, r.outBuf);
		out(`(d) ${tag}: the written ledger differs from the input, every row line is byte-identical with its ending, the ID multiset equal, in file order (R-1163, R-1165)`, [wrote, kept.same, kept.total, kept.diff.slice(0, 5), JSON.stringify(kept.orderOut) === JSON.stringify(kept.orderIn)], [true, rowCount(bytes), rowCount(bytes), [], true]);
		const acc = accountDefault(bytes, r.outBuf, closing);
		out(`(d) ${tag}: every other input line survives once in input order and every added line is a declared kind (R-1163, R-1165)`, [acc.missing, acc.stray], [null, []], `stray ${acc.strayCount}`);
		const inSegs = segs(bytes), outSegs = segs(r.outBuf ?? "");
		const headEnd = (old.sections[0]?.line ?? 1) - 1;
		out(`(d) ${tag}: the title and the ${headEnd} lines before the first section stay verbatim in place (R-1165 rule 1)`, wrote && outSegs.slice(0, headEnd).join("") === inSegs.slice(0, headEnd).join("") && headEnd > 0, true);
		const ci = outSegs.findIndex((s) => bare(s) === closing);
		const keptText = (h) => { const i = h.line - 1; let j = i + 1; while (j < inSegs.length && !(/^ {0,3}#{1,2}(?:[ \t]|$)/.test(bare(inSegs[j])) && !old.fenced[j])) j++; return inSegs.slice(i, j).join(""); };
		const after = ci < 0 ? "" : outSegs.slice(ci + 1).join("");
		const lastTree = Math.max(0, ...r.t.headings.map((h) => h.line), ...r.t.rows.map((x) => x.line));
		out(`(d) ${tag}: Open questions and Deliberate omissions stay verbatim, in order, under the seed's closing heading after every row and tree heading (R-1165 rule 5)`,
			[ci >= 0, ci + 1 > lastTree, old.kept.map((h) => h.label), old.kept.every((h) => after.includes(keptText(h))), old.kept.length === 2 && after.indexOf(keptText(old.kept[0])) < after.indexOf(keptText(old.kept[1]))], [true, true, KEPT, true, true]);
		const product = r.t.headings.filter((h) => !/^(CAP-90|FEAT-900|SUB-90[0-4])$/.test(h.id));
		out(`(d) ${tag}: every default purpose, and every capability's outcome, starts "${UNSORTED}", and every feature reads Status: active (R-1165, S11)`,
			[product.filter((h) => !(h.purpose ?? "").startsWith(UNSORTED) || (h.level === 1 && !(h.outcome ?? "").startsWith(UNSORTED)) || (h.level === 2 && h.status !== "active")).map((h) => h.id), product.length > 0], [[], true]);
		const ck = tree(r.repo.dir, scratch);
		out(`(d) ${tag}: the tree checker passes the lifted ledger (R-1163)`, [ck.status, lines(ck.stdout)], [0, [`requirements tree: 0 problems; rows ${rowCount(bytes)}; features ${r.t.headings.filter((h) => h.level === 2).length}`]], own(ck.stderr).slice(0, 3).join(" | "));
	};

	// work-desk → 6/41/2, 3 header pairs, proof clean (§5). Every section sits under a Part: no generated capability.
	{
		const old = oldHeadings(L.work);
		const seq = expectSeq(old.sections.map((h) => ({ level: h.level, label: h.label })));
		const nodes = seq.map(([id]) => id);
		const r = runLedger("work-desk", L.work);
		commonCases("work-desk", L.work, r, nodes);
		const kinds = (ids) => [ids.filter((x) => x.startsWith("CAP-")).length, ids.filter((x) => x.startsWith("FEAT-")).length, ids.filter((x) => x.startsWith("SUB-")).length];
		out("(d) work-desk: 6 capabilities, 41 features, 2 subgroups, in the dry run and in the written ledger (§5)", [kinds(idSet(r.dry.stdout)), kinds(r.t.headings.map((h) => h.id))], [[6, 41, 2], [6, 41, 2]]);
		out("(d) work-desk: each Part, ## and ### becomes a capability, feature and subgroup in file order with its old heading text as label and parent by level (R-1165 rule 2)", seqOf(r.t), seq);
		const headers = (b) => segs(b ?? "").filter((s) => bare(s) === TABLE_HEADER).length;
		out("(d) work-desk: the three headless fragments each gain the exact table header: 3 header pairs inserted (§5, R-1165 §3.4)", headers(r.outBuf) - headers(L.work), 3);
	}
	// basketball-geek's HEAD copy → 1/9/0: one generated Not yet sorted capability over the nine sections (§5).
	const bgOld = oldHeadings(L.bgHead);
	const bgSeq = expectSeq([{ level: 1, label: UNSORTED_CAP }, ...bgOld.sections.map((h) => ({ level: h.level, label: h.label }))]);
	{
		const r = runLedger("basketball-geek-HEAD", L.bgHead);
		commonCases("basketball-geek HEAD", L.bgHead, r, bgSeq.map(([id]) => id));
		out("(d) basketball-geek HEAD: CAP-01 · Not yet sorted holds FEAT-001 to FEAT-009, each with its old heading text, no subgroup: 1/9/0 (§5, R-1165 rule 3)", seqOf(r.t), bgSeq);
	}
	// trading-zone → CAP-01, CAP-90, CAP-02 with FEAT-005–FEAT-011 under CAP-02, 0 checker problems (§5).
	{
		const old = oldHeadings(L.tz);
		const firstG = (h) => { const i = h.line; const ls = old.lines; for (let j = i; j < ls.length && !/^ {0,3}#{1,3}(?:[ \t]|$)/.test(ls[j]); j++) { const m = ROW.exec(ls[j]); if (m) return m[1]; } return null; };
		const entries = [];
		let opened = false, inG = false, afterG = false;
		for (const h of old.sections) {
			const g = firstG(h);
			const gSection = h.level === 2 && g?.startsWith("G-");
			if (h.level === 1 && /^Part G\b/.test(h.label)) { entries.push({ id: "CAP-90", level: 1, label: seedHead.get("CAP-90")?.label }, { id: "FEAT-900", level: 2, label: seedHead.get("FEAT-900")?.label }); inG = true; continue; }
			if (gSection) { const sub = seedSub.get(g); entries.push({ id: sub, level: 3, label: seedHead.get(sub)?.label }); continue; }
			if (inG) { afterG = true; inG = false; opened = false; }
			if (!opened) { entries.push({ level: 1, label: UNSORTED_CAP }); opened = true; }
			entries.push({ level: h.level, label: h.label });
		}
		const seq = expectSeq(entries);
		const r = runLedger("trading-zone", L.tz);
		commonCases("trading-zone", L.tz, r, seq.map(([id]) => id));
		out("(d) trading-zone: the capabilities are CAP-01, CAP-90, CAP-02 in that order, FEAT-001–004 under CAP-01, FEAT-900 under CAP-90, FEAT-005–FEAT-011 under CAP-02 (§5, R-1165 rule 3, §3.5 check 9)",
			[r.t.headings.filter((h) => h.level === 1).map((h) => h.id), r.t.headings.filter((h) => h.level === 2).map((h) => `${h.id}@${h.parent}`), afterG],
			[["CAP-01", "CAP-90", "CAP-02"], [1, 2, 3, 4].map((v) => `FEAT-${pad(v, 3)}@CAP-01`).concat(["FEAT-900@CAP-90"], [5, 6, 7, 8, 9, 10, 11].map((v) => `FEAT-${pad(v, 3)}@CAP-02`)), true]);
		out("(d) trading-zone: the whole heading sequence, labels and parents equal the default rule derived from the input (R-1165, §3.5 check 9)", seqOf(r.t), seq);
		const reserved = r.t.headings.filter((h) => /^(CAP-90|FEAT-900|SUB-90[0-4])$/.test(h.id));
		out("(d) trading-zone: CAP-90, FEAT-900 and SUB-900 to SUB-904 carry the seed's labels, purposes, outcome and status (R-1165 rule 4, §3.2)",
			reserved.map((h) => [h.id, h.label, h.purpose, h.outcome, h.status]), [...seedHead.values()].map((s) => [s.id, s.label, s.purpose, s.outcome, s.status]));
		const gRows = r.t.rows.filter((x) => x.id.startsWith("G-"));
		out("(d) trading-zone: every G row sits in the seed subgroup whose table holds it, under FEAT-900 and CAP-90, and no R row sits in CAP-90 (R-1163, R-1165)",
			[gRows.length, gRows.filter((x) => x.sub !== seedSub.get(x.id) || x.feat !== "FEAT-900" || x.cap !== "CAP-90").map((x) => `${x.id}@${x.sub}`), r.t.rows.filter((x) => x.id.startsWith("R-") && x.cap === "CAP-90").map((x) => x.id)], [22, [], []]);
		// One format for the default and a proposal (§3.2, R-1162, R-1166): the emitted default mapping, committed and
		// passed back with --mapping, writes the default lift's bytes.
		const repo2 = gitRepo("git-trading-zone-mapping", L.tz);
		fs.mkdirSync(path.join(repo2.dir, "docs", "lift"), { recursive: true });
		const mapPath = path.join(repo2.dir, "docs", "lift", "tree-map.json");
		const em = lift(["--root", repo2.dir, "--emit-mapping", mapPath], scratch);
		gitIn(repo2.dir, "add", "docs/lift/tree-map.json"); gitIn(repo2.dir, "commit", "-qm", "default mapping");
		const wm = lift(["--root", repo2.dir, "--mapping", mapPath, "--write"], scratch);
		const viaMapping = readBuf(path.join(repo2.dir, "REQUIREMENTS.md"));
		out("(d) trading-zone: the emitted default mapping, committed and passed back with --mapping --write, writes the default lift's bytes (R-1162, R-1166)",
			[em.status, wm.status, Boolean(viaMapping && r.outBuf && viaMapping.equals(r.outBuf)), viaMapping ? !viaMapping.equals(L.tz) : false], [0, 0, true, true], own(em.stderr).concat(own(wm.stderr)).slice(0, 3).join(" | "));
		// The tip's proveLift called directly (§3.5's signature), in a child so a missing or throwing module is a named
		// miss. Sections 5–11 moved under CAP-90 in both the mapping and the output break only the reserved-row rule in
		// mapping mode, so what fromDefault adds over that is placement's (check 9). In mapping mode, an output whose
		// FEAT-004 sits under CAP-02 while the mapping declares CAP-01 breaks the declared placement.
		const defMap = readJson(mapPath);
		const bomText = r.outBuf?.[0] === 0xef ? "﻿" : "";
		const oSegs = segs(r.outBuf ?? "");
		const at = (id) => oSegs.findIndex((s) => TREE_HEADING.exec(bare(s))?.[2] === id);
		const [c2, f4, f5] = ["CAP-02", "FEAT-004", "FEAT-005"].map(at);
		const e4 = f4 < 0 ? -1 : oSegs.findIndex((s, j) => j > f4 && TREE_HEADING.test(bare(s)));
		let capMap = null, capOut = "", parentOut = "";
		if (defMap?.tree && c2 > 0 && f4 > 0 && e4 > f4 && e4 <= c2 && f5 > c2) {
			capMap = structuredClone(defMap);
			const cap2 = capMap.tree.find((c) => c.id === "CAP-02"), cap90 = capMap.tree.find((c) => c.id === "CAP-90");
			if (cap2 && cap90) { cap90.features.push(...cap2.features); capMap.tree = capMap.tree.filter((c) => c !== cap2); } else capMap = null;
			capOut = bomText + [...oSegs.slice(0, c2), ...oSegs.slice(f5)].join("");
			parentOut = bomText + [...oSegs.slice(0, f4), ...oSegs.slice(e4, f5), ...oSegs.slice(f4, e4), ...oSegs.slice(f5)].join("");
		}
		const parentIn = (src, id) => readTree(src).headings.find((h) => h.id === id)?.parent ?? null;
		const probeDir = path.join(scratch, "prove-direct");
		fs.mkdirSync(probeDir);
		const probeFiles = { input: L.tz, output: r.outBuf ?? "", map: JSON.stringify(defMap), capMap: JSON.stringify(capMap), capOut, parentOut, seed: seedText };
		for (const [k, v] of Object.entries(probeFiles)) fs.writeFileSync(path.join(probeDir, k), v);
		const probePaths = Object.fromEntries(Object.keys(probeFiles).map((k) => [k, path.join(probeDir, k)]));
		const probe = node(["--input-type=module", "-e", `import * as fs from "node:fs";
const { proveLift } = await import(${JSON.stringify(pathToFileURL(path.join(root, PROOF_SCRIPT)).href)});
const P = ${JSON.stringify(probePaths)}; const rd = (k) => fs.readFileSync(P[k], "utf8");
const seed = rd("seed"), input = rd("input");
const call = (map, output, fromDefault) => { try { const r = proveLift(input, JSON.parse(rd(map)), rd(output), seed, { fromDefault }); return Array.isArray(r) ? r.map(String) : Array.isArray(r?.problems) ? r.problems.map(String) : "unknown return shape: " + String(JSON.stringify(r)).slice(0, 80); } catch (e) { return ["threw: " + e.message]; } };
console.log(JSON.stringify({ control: call("map", "output", true), controlMapping: call("map", "output", false), capDefault: call("capMap", "capOut", true), capMapping: call("capMap", "capOut", false), parent: call("map", "parentOut", false) }));`]);
		let pr = null;
		try { pr = JSON.parse(lines(probe.stdout).at(-1) ?? ""); } catch {}
		const extra = Array.isArray(pr?.capDefault) && Array.isArray(pr?.capMapping) ? pr.capDefault.filter((p) => !pr.capMapping.includes(p)) : [];
		out("(d) trading-zone: the tip's proveLift passes the true default lift with and without fromDefault, and refuses it tampered so sections 5–11 sit under CAP-90 (mapping and output), with fromDefault naming a placement problem the mapping mode does not (R-1163, §3.5 check 9)",
			[pr?.control ?? null, pr?.controlMapping ?? null, Boolean(capMap) && parentIn(capOut, "FEAT-005") === "CAP-90", Array.isArray(pr?.capMapping) && pr.capMapping.length > 0, extra.length > 0], [[], [], true, true, true],
			extra.length ? extra.slice(0, 2).join(" | ") : own(probe.stderr).slice(-2).join(" | "));
		out("(d) trading-zone: in mapping mode the tip's proveLift refuses an output whose FEAT-004 sits under CAP-02 while the mapping declares CAP-01 (R-1163)",
			[pr?.controlMapping ?? null, parentIn(parentOut, "FEAT-004"), Array.isArray(pr?.parent) && pr.parent.length > 0], [[], "CAP-02", true], Array.isArray(pr?.parent) ? pr.parent.slice(0, 2).join(" | ") : own(probe.stderr).slice(-2).join(" | "));
	}
	// yokai-world → refused naming its tree-heading count (§5, R-1167).
	{
		const count = readTree(L.yokai).headings.length;
		const dir = copyLedger("dry-yokai-world", L.yokai);
		const before = fileList(dir);
		const r = lift(["--root", dir], scratch);
		out(`(d) yokai-world: the dry run exits 1 naming its ${count} tree headings, prints no proof line and writes nothing (§5, R-1167)`,
			[r.status, crashed(r), own(r.stderr).some((l) => new RegExp(`\\b${count}\\b`).test(l)), proofOf(r.stdout), JSON.stringify(fileList(dir)) === JSON.stringify(before)], [1, false, true, null, true], own(r.stderr).slice(0, 3).join(" | "));
	}
	// A prose-only ledger → no rows (§5, R-1167).
	{
		const dir = copyLedger("dry-prose-only", L.prose ?? "");
		const r = lift(["--root", dir], scratch);
		out("(d) a prose-only ledger: the dry run exits 1 saying no requirement rows, with no proof line (§5, R-1167)", [r.status, crashed(r), own(r.stderr).some((l) => /no requirement rows/.test(l)), proofOf(r.stdout)], [1, false, true, null], own(r.stderr).slice(0, 3).join(" | "));
	}

	// ---------------------------------------------------------------- (v) honest variation on basketball-geek's working copy
	{
		const lfText = L.bg.toString("utf8");
		const mixed = lfText.split(/(?<=\n)/).map((s, i) => (i % 3 === 0 ? s.replace(/\n$/, "\r\n") : s)).join("");
		const variants = [["CRLF", Buffer.from(crlf(lfText))], ["BOM+CRLF", utf8Bom(crlf(lfText))], ["mixed-ending", Buffer.from(mixed)]];
		out("(harness) the mixed copy holds both LF and CRLF row lines", [segs(mixed).some((s) => ROW.test(s) && s.endsWith("\r\n")), segs(mixed).some((s) => ROW.test(s) && !s.endsWith("\r\n"))], [true, true]);
		for (const [label, bytes] of variants) {
			const repo = gitRepo(`git-bg-${label}`, bytes);
			const dry = lift(["--root", repo.dir], scratch);
			const w = lift(["--root", repo.dir, "--write"], scratch);
			const outBuf = readBuf(path.join(repo.dir, "REQUIREMENTS.md"));
			const kept = outBuf ? rowsKept(bytes, outBuf) : { same: 0, total: 171, diff: ["no output"] };
			const ck = tree(repo.dir, scratch);
			out(`(v) basketball-geek ${label}: the dry run and --write exit 0, 171/171 rows keep their bytes and endings, the BOM is kept iff present, and the checker passes (§5, R-1163)`,
				[dry.status, proofOf(dry.stdout)?.rows ?? null, w.status, `${kept.same}/${kept.total}`, kept.diff.slice(0, 3), outBuf ? (outBuf[0] === 0xef) === (bytes[0] === 0xef) : false, ck.status],
				[0, 171, 0, "171/171", [], true, 0], own(dry.stderr).concat(own(w.stderr)).slice(0, 3).join(" | "));
			const acc = outBuf ? accountDefault(bytes, outBuf, closing) : { missing: 0, stray: ["no output"] };
			out(`(v) basketball-geek ${label}: the ledger was rewritten, and every other input line survives once in input order, bytes and ending included (R-1163)`, [w.status === 0 && Boolean(outBuf) && !outBuf.equals(bytes), acc.missing, acc.stray], [true, null, []]);
		}
		// An ANSI line appended by Windows PowerShell 5.1 Add-Content (cp1252 é and —), CRLF: refused naming its line.
		const ansi = Buffer.concat([L.bg, Buffer.from("| R-900 | The caf", "latin1"), Buffer.from([0xe9]), Buffer.from(" shall serve. | planned | ", "latin1"), Buffer.from([0x97]), Buffer.from(" |\r\n", "latin1")]);
		const ansiLine = segs(L.bg).length + 1;
		const dir = copyLedger("dry-bg-ansi", ansi);
		const r = lift(["--root", dir], scratch);
		out(`(v) basketball-geek with an ANSI row appended: the dry run exits 1 naming line ${ansiLine}, prints no proof line and leaves the ledger unchanged (§5, R-1167, §3.2 Reads)`,
			[r.status, crashed(r), own(r.stderr).some((l) => new RegExp(`\\b${ansiLine}\\b`).test(l)), proofOf(r.stdout), readBuf(path.join(dir, "REQUIREMENTS.md"))?.equals(ansi) ?? false], [1, false, true, null, true], own(r.stderr).slice(0, 3).join(" | "));
	}

	// ---------------------------------------------------------------- (w) the git flow, the identity mapping and the regroup rehearsal
	{
		const main = gitRepo("bg-main", L.bgHead);
		const B = main.head;
		const lane = path.join(scratch, "bg-lane");
		const wt = gitIn(main.dir, "worktree", "add", "-q", "-b", "lane", lane);
		out("(harness) a scratch repository holds basketball-geek's committed HEAD ledger and a lane worktree", [main.ok, wt.status], [true, 0], wt.stderr);
		const ledger = (d) => readBuf(path.join(d, "REQUIREMENTS.md"));
		// The six uncommitted rows in the main checkout (research-ledgers.md §3).
		fs.writeFileSync(path.join(main.dir, "REQUIREMENTS.md"), L.bg);
		const wDirty = lift(["--root", lane, "--write"], scratch);
		out("(w) with the six uncommitted rows in the main checkout, --write from the lane worktree exits 1 naming that checkout and leaves both ledgers unchanged (§5, R-1164)",
			[wDirty.status, crashed(wDirty), own(wDirty.stderr).some((l) => l.includes(main.dir)), ledger(lane)?.equals(L.bgHead) ?? false, ledger(main.dir)?.equals(L.bg) ?? false], [1, false, true, true, true], own(wDirty.stderr).slice(0, 3).join(" | "));
		gitIn(main.dir, "checkout", "--", "REQUIREMENTS.md");
		// The same refusal for a project in a subfolder of its repository: the scan reads <prefix>REQUIREMENTS.md (§3.6).
		{
			const sub = gitRepo("sub-main", L.bgHead, "proj");
			const subLane = path.join(scratch, "sub-lane");
			const swt = gitIn(sub.dir, "worktree", "add", "-q", "-b", "lane", subLane);
			fs.writeFileSync(path.join(sub.dir, "proj", "REQUIREMENTS.md"), L.bg);
			const sDirty = lift(["--root", path.join(subLane, "proj"), "--write"], scratch);
			out("(w) a project in a subfolder (proj/): with the six uncommitted rows in the main checkout's proj/, --write from the lane worktree's proj/ exits 1 naming the main checkout and leaves both ledgers unchanged (R-1164, §3.6)",
				[sub.ok && swt.status === 0, sDirty.status, crashed(sDirty), own(sDirty.stderr).some((l) => l.includes(sub.dir)), readBuf(path.join(subLane, "proj", "REQUIREMENTS.md"))?.equals(L.bgHead) ?? false, readBuf(path.join(sub.dir, "proj", "REQUIREMENTS.md"))?.equals(L.bg) ?? false],
				[true, 1, false, true, true, true], own(sDirty.stderr).slice(0, 3).join(" | "));
			gitIn(sub.dir, "worktree", "remove", "--force", subLane);
		}
		const w = lift(["--root", lane, "--write"], scratch);
		const lifted = ledger(lane);
		out("(w) with every worktree clean, --write from the lane worktree exits 0 and replaces the ledger (R-1164)", [w.status, Boolean(lifted && !lifted.equals(L.bgHead)), proofOf(w.stdout)?.rows ?? null], [0, true, 165], own(w.stderr).slice(0, 3).join(" | "));
		const lt = readTree(lifted);
		out("(w) the lifted lane ledger is 1/9/0 with every row byte-identical (§5)", [seqOf(lt), rowsKept(L.bgHead, lifted ?? "").same], [bgSeq, 165]);
		gitIn(lane, "commit", "-qam", "lift");
		const Lsha = gitIn(lane, "rev-parse", "HEAD").stdout.trim();
		const v = lift(["--root", lane, "--verify", B], scratch);
		out("(w) --verify <base> on the committed lift exits 0 (§5, R-1168)", v.status, 0, own(v.stderr).slice(0, 3).join(" | "));
		const liftedSegs = segs(lifted ?? "");
		const editAt = liftedSegs.findIndex((s, i) => i > 20 && ROW.test(bare(s)) && s.includes(" shall "));
		const handEdited = liftedSegs.map((s, i) => (i === editAt ? s.replace(" shall ", " shall still ") : s)).join("");
		// The same edit left uncommitted: --verify reads blobs, so only its git gate can see it (R-1168); then restored.
		fs.writeFileSync(path.join(lane, "REQUIREMENTS.md"), handEdited);
		const vDirty = lift(["--root", lane, "--verify", B], scratch);
		gitIn(lane, "checkout", "--", "REQUIREMENTS.md");
		out("(w) --verify <base> with an uncommitted edit to the committed lift exits 1 naming REQUIREMENTS.md, and the edit is then discarded (R-1168)",
			[v.status, editAt > 0, vDirty.status, crashed(vDirty), own(vDirty.stderr).some((l) => l.includes("REQUIREMENTS.md")), ledger(lane)?.equals(lifted ?? Buffer.alloc(0)) ?? false], [0, true, 1, false, true, true], own(vDirty.stderr).slice(0, 3).join(" | "));
		// A hand-edited lift names its first differing line, then the lane goes back to the lift.
		fs.writeFileSync(path.join(lane, "REQUIREMENTS.md"), handEdited);
		gitIn(lane, "commit", "-qam", "hand edit");
		const vBad = lift(["--root", lane, "--verify", B], scratch);
		out(`(w) --verify <base> on a hand-edited lift (the clean lift verified) exits 1 naming its first differing line, ${editAt + 1} (R-1168)`, [v.status, editAt > 0, vBad.status, crashed(vBad), own(vBad.stderr).some((l) => new RegExp(`\\b${editAt + 1}\\b`).test(l))], [0, true, 1, false, true], own(vBad.stderr).slice(0, 3).join(" | "));
		gitIn(lane, "reset", "-q", "--hard", Lsha);

		// Three prose notes, committed into the lift before the identity mapping is drawn, each a line of its own (with a
		// blank line before the section's table) in a section the regroup treats differently: section 3 merges into
		// section 2's node, section 4 loses two rows, section 9 moves under a new capability (R-1166: "each named old
		// heading's other lines under that node").
		const NOTE_SECTIONS = ["FEAT-003", "FEAT-004", "FEAT-009"];
		const eol = /\r\n$/.test(liftedSegs[0] ?? "") ? "\r\n" : "\n";
		const notes = NOTE_SECTIONS.map((id, k) => ({ id, text: `Rehearsal note ${k + 1}: this prose line travels with its old section through the regroup.` }));
		const noteSegs = [...liftedSegs];
		for (const nt0 of [...notes].reverse()) {
			const h = lt.headings.find((x) => x.id === nt0.id);
			const at = h ? noteSegs.findIndex((s, i) => i >= h.line && bare(s) === TABLE_HEADER) : -1;
			if (at > 0) noteSegs.splice(at, 0, `${nt0.text}${eol}`, eol);
		}
		fs.writeFileSync(path.join(lane, "REQUIREMENTS.md"), (lifted?.[0] === 0xef ? "﻿" : "") + noteSegs.join(""));
		gitIn(lane, "commit", "-qam", "three prose notes");
		const Nsha = gitIn(lane, "rev-parse", "HEAD").stdout.trim();
		const noted = ledger(lane);
		const nt = readTree(noted ?? "");
		/** Each note: how many lines hold it, and the tree heading it sits under. */
		const notesIn = (t) => notes.map((x) => { const at = t.lines.map((l, i) => (l === x.text ? i + 1 : 0)).filter(Boolean); return { count: at.length, home: at.length ? ([...t.headings].reverse().find((h) => h.line < at[0]) ?? null) : null }; });
		const noteHomes = notesIn(nt);

		// --emit-mapping on the noted lift: the identity mapping (§3.2 Identity, S8, R-1162).
		fs.mkdirSync(path.join(lane, "docs", "regroup"), { recursive: true });
		const idPath = path.join(lane, "docs", "regroup", "identity.json");
		const beforeEmit = fileList(lane);
		const em = lift(["--root", lane, "--emit-mapping", idPath], scratch);
		const idMap = readJson(idPath);
		const afterEmit = fileList(lane);
		out("(w) --emit-mapping on the noted lift exits 0 and writes only the named file (R-1162)", [em.status, afterEmit.filter((x) => !beforeEmit.includes(x)).map((x) => x.split(" ")[0])], [0, ["docs/regroup/identity.json"]], own(em.stderr).slice(0, 3).join(" | "));
		const lfForm = bomless(noted ?? "").split(/\r?\n/).join("\n");
		const nodes = mappingNodes(idMap);
		out("(w) the emitted mapping is the identity: lift 1, the LF-form pin and row count, every heading mapped to itself with its label and purpose, rows in file order (§3.2, R-1162)",
			[idMap?.lift ?? null, idMap?.pin?.sha256 === sha(lfForm), idMap?.pin?.rows ?? null,
				nodes.map((x) => [x.id, x.node.label, x.node.purpose, x.parent]), nodes.map((x) => (x.node.from ?? []).map((f) => [f.line, f.heading])),
				nodes.filter((x) => x.level > 1).map((x) => [x.id, expandIds(x.node.rows)]), idMap?.head?.through ?? null],
			[1, true, 165, nt.headings.map((h) => [h.id, h.label, h.purpose, h.parent]), nt.headings.map((h) => [[h.line, nt.lines[h.line - 1]]]),
				nt.headings.filter((h) => h.level > 1).map((h) => [h.id, h.rows]), (nt.headings[0]?.line ?? 1) - 1]);
		const em2 = lift(["--root", lane, "--emit-mapping", idPath], scratch);
		out("(w) --emit-mapping refuses a file that exists (the first emit wrote it) and leaves it unchanged (R-1162, §3.6)", [em.status, em2.status !== 0, crashed(em2), JSON.stringify(fileList(lane)) === JSON.stringify(afterEmit)], [0, true, false, true], own(em2.stderr).slice(0, 2).join(" | "));
		gitIn(lane, "add", "docs/regroup/identity.json"); gitIn(lane, "commit", "-qm", "identity mapping");
		const idDry = lift(["--root", lane, "--mapping", idPath], scratch);
		const idW = lift(["--root", lane, "--mapping", idPath, "--write"], scratch);
		out("(w) the identity mapping round-trips: --mapping prints one line per heading and no move line, and --write leaves the ledger's bytes unchanged (R-1162, R-1166)",
			[idDry.status, idLines(idDry.stdout).length, proofOf(idDry.stdout)?.rows ?? null, idW.status, ledger(lane)?.equals(noted ?? Buffer.alloc(0)) ?? false], [0, nt.headings.length, 165, 0, true], own(idDry.stderr).concat(own(idW.stderr)).slice(0, 3).join(" | "));

		// The regroup rehearsal (§5): the identity mapping hand-edited into a proposal, applied with no tool change.
		let proposal = null, moved = [];
		try {
			const m = structuredClone(idMap);
			const cap1 = m.tree.find((c) => c.id === "CAP-01");
			const F = (id) => cap1.features.find((f) => f.id === id);
			const [f1, f2, f3, f4, f6, f7, f9] = ["FEAT-001", "FEAT-002", "FEAT-003", "FEAT-004", "FEAT-006", "FEAT-007", "FEAT-009"].map(F);
			f2.rows = [...expandIds(f2.rows), ...expandIds(f3.rows)]; f2.from = [...f2.from, ...f3.from]; // one merge
			const r4 = expandIds(f4.rows), r7 = expandIds(f7.rows), r6 = expandIds(f6.rows), r1 = expandIds(f1.rows);
			moved = [...r4.slice(-2).map((id) => [id, "FEAT-004", "FEAT-006"]), [r7[0], "FEAT-007", "FEAT-001"]]; // three moved rows
			f4.rows = r4.slice(0, -2); f6.rows = [...r6, ...r4.slice(-2)]; f7.rows = r7.slice(1); f1.rows = [r7[0], ...r1];
			cap1.features = cap1.features.filter((f) => f !== f3 && f !== f9);
			const cap2 = { id: "CAP-02", label: "Rehearsal second capability", purpose: `${UNSORTED} a second capability for the regroup rehearsal.`, outcome: `${UNSORTED} the rehearsal's moved feature sits here.`, from: [],
				features: [f9, { id: "FEAT-010", label: "Rehearsal proposed feature", purpose: `${UNSORTED} a proposed feature with no rows yet.`, status: "proposed", from: [], rows: [], subgroups: [] }] };
			m.tree.splice(m.tree.indexOf(cap1) + 1, 0, cap2);
			proposal = m;
		} catch (e) { proposal = null; }
		const propPath = path.join(lane, "docs", "regroup", "proposal.json");
		fs.writeFileSync(propPath, `${JSON.stringify(proposal, null, 2)}\n`);
		const pNodes = mappingNodes(proposal);
		out("(w) the identity mapping hand-edits into the rehearsal's proposal: two capabilities, one merge, three moved rows, one proposed feature, FEAT-009 moved under CAP-02 (§5)", [pNodes.filter((x) => x.level === 1).length, pNodes.some((x) => x.id === "FEAT-003"), moved.length, pNodes.filter((x) => x.node.status === "proposed").length, pNodes.find((x) => x.id === "FEAT-009")?.parent ?? null], [2, false, 3, 1, "CAP-02"]);
		const pDry = lift(["--root", lane, "--mapping", propPath], scratch);
		const strictPairs = [["FEAT-004", "FEAT-006"], ["FEAT-007", "FEAT-001"]];
		const pIdLines = idLines(pDry.stdout);
		const named = (a, b) => pIdLines.some((l) => l.includes(a) && l.includes(b));
		// A move is a row whose new node does not carry its old section (research-code.md §4); whether a merge also
		// prints a line is the plan's open point, so a merge line is allowed, never required.
		const moveLines = pIdLines.length - pNodes.length;
		out("(w) the regroup rehearsal validates and proves: the dry run exits 0 with the proof line and 165 rows, one line per planned heading and one per move, naming FEAT-004 → FEAT-006 and FEAT-007 → FEAT-001 (§5, R-1162, R-1166)",
			[pDry.status, proofOf(pDry.stdout)?.rows ?? null, moveLines === strictPairs.length || (moveLines === strictPairs.length + 1 && named("FEAT-003", "FEAT-002")), strictPairs.every(([a, b]) => named(a, b))], [0, 165, true, true], pDry.stdout.slice(-400) + own(pDry.stderr).slice(0, 3).join(" | "));
		const pUntracked = lift(["--root", lane, "--mapping", propPath, "--write"], scratch);
		out("(w) --write with the proposal untracked exits 1 naming the mapping file and leaves the ledger unchanged (R-1164)", [pUntracked.status, crashed(pUntracked), own(pUntracked.stderr).some((l) => l.includes("proposal.json")), ledger(lane)?.equals(noted ?? Buffer.alloc(0)) ?? false], [1, false, true, true], own(pUntracked.stderr).slice(0, 3).join(" | "));
		gitIn(lane, "add", "docs/regroup/proposal.json"); gitIn(lane, "commit", "-qm", "proposal");
		const pW = lift(["--root", lane, "--mapping", propPath, "--write"], scratch);
		const regrouped = ledger(lane);
		const rt2 = readTree(regrouped ?? "");
		out("(w) the committed proposal writes: exit 0, its headings, labels, purposes and parents in its order, FEAT-010 proposed and empty (R-1166, R-1163)",
			[pW.status, rt2.headings.map((h) => [h.id, h.label, h.purpose, h.parent]), rt2.headings.find((h) => h.id === "FEAT-010")?.status ?? null, rt2.headings.find((h) => h.id === "FEAT-010")?.rows.length ?? null],
			[0, pNodes.map((x) => [x.id, x.node.label, x.node.purpose, x.parent]), "proposed", 0], own(pW.stderr).slice(0, 3).join(" | "));
		out("(w) each leaf holds its rows in the proposal's order, the three moved rows at their new homes (R-1166)",
			[pW.status, moved.length, rt2.headings.filter((h) => h.level > 1).map((h) => [h.id, h.rows]), moved.map(([id]) => rt2.rows.find((x) => x.id === id)?.feat ?? null)],
			[0, 3, pNodes.filter((x) => x.level > 1).map((x) => [x.id, expandIds(x.node.rows)]), moved.map(([, , to]) => to)]);
		out("(w) every line of the rehearsal's dry-run plan carries its heading's row count as the regrouped ledger holds it (R-1162)",
			[pDry.status, rt2.headings.length > 0, countMisses(pDry.stdout, rt2)], [0, true, []], pIdLines.slice(0, 3).join(" | "));
		const mappedTo = (h) => (h ? pNodes.find((x) => (x.node.from ?? []).some((f) => Number(f.line) === h.line))?.id ?? null : null);
		const notesAfter = notesIn(rt2);
		out("(w) each prose note lands once under the node its old section maps to: section 3's under FEAT-002 (the merge), section 4's under FEAT-004 (rows moved out), section 9's under FEAT-009 (moved under CAP-02) (R-1166)",
			[noteHomes.map((x) => x.home?.id ?? null), noteHomes.map((x) => mappedTo(x.home)), notesAfter.map((x) => [x.count, x.home?.id ?? null])],
			[NOTE_SECTIONS, ["FEAT-002", "FEAT-004", "FEAT-009"], noteHomes.map((x) => [1, mappedTo(x.home)])]);
		const k2 = rowsKept(noted ?? "", regrouped ?? "");
		out("(w) the regrouped ledger keeps every row byte-identical, every prose line once and every blank line (R-1163)",
			[Boolean(regrouped && noted && !regrouped.equals(noted) && readTree(noted).headings.length > 0), `${k2.same}/${k2.total}`, JSON.stringify(proseMultiset(regrouped ?? "")) === JSON.stringify(proseMultiset(noted ?? "")), blanks(regrouped ?? "") >= blanks(noted ?? "")], [true, "165/165", true, true]);
		const ck2 = tree(lane, scratch);
		out("(w) the tree checker passes the regrouped ledger (R-1163)", ck2.status, 0, own(ck2.stderr).slice(0, 3).join(" | "));
		gitIn(lane, "commit", "-qam", "regroup");
		const vR = lift(["--root", lane, "--mapping", propPath, "--verify", Nsha], scratch);
		out("(w) --verify <the noted lift> with the committed proposal exits 0 (R-1168)", vR.status, 0, own(vR.stderr).slice(0, 3).join(" | "));
		// The same proposal rewritten compactly and left uncommitted: --verify reads the mapping's HEAD blob, so only its git
		// gate can see the change (R-1168); then restored.
		const propCommitted = readBuf(propPath);
		fs.writeFileSync(propPath, `${JSON.stringify(proposal)}\n`);
		const vMapDirty = lift(["--root", lane, "--mapping", propPath, "--verify", Nsha], scratch);
		gitIn(lane, "checkout", "--", "docs/regroup/proposal.json");
		out("(w) --verify with an uncommitted change to the mapping file exits 1 naming proposal.json, and the change is then discarded (R-1168)",
			[vR.status, vMapDirty.status, crashed(vMapDirty), own(vMapDirty.stderr).some((l) => l.includes("proposal.json")), Boolean(propCommitted) && (readBuf(propPath)?.equals(propCommitted) ?? false)], [0, 1, false, true, true], own(vMapDirty.stderr).slice(0, 3).join(" | "));

		// A BOM'd mapping is accepted (R-1166); an ANSI one is refused naming its line (R-1167). No git needed.
		const copy = copyLedger("noted-copy", noted ?? "");
		fs.mkdirSync(path.join(copy, "maps"));
		const idText = `${JSON.stringify(idMap, null, 2)}\n`;
		fs.writeFileSync(path.join(copy, "maps", "bom.json"), utf8Bom(idText));
		const bomRun = lift(["--root", copy, "--mapping", path.join(copy, "maps", "bom.json")], scratch);
		out("(w) a mapping saved with a UTF-8 BOM (Windows PowerShell 5.1 -Encoding UTF8) is accepted: exit 0 with the proof line (R-1166, R-1167)", [bomRun.status, proofOf(bomRun.stdout)?.rows ?? null], [0, 165], own(bomRun.stderr).slice(0, 3).join(" | "));
		const ansiMap = structuredClone(idMap ?? {});
		if (ansiMap.tree?.[0]) ansiMap.tree[0].purpose = `${UNSORTED} café rows`;
		const ansiText = `${JSON.stringify(ansiMap, null, 2)}\n`;
		const ansiMapLine = ansiText.split("\n").findIndex((l) => l.includes("café")) + 1;
		fs.writeFileSync(path.join(copy, "maps", "ansi.json"), Buffer.from(ansiText, "latin1"));
		const ansiRun = lift(["--root", copy, "--mapping", path.join(copy, "maps", "ansi.json")], scratch);
		out(`(w) an ANSI (cp1252) mapping is refused: exit 1 naming its line ${ansiMapLine}, no proof line (R-1167, §3.2 Reads)`, [ansiRun.status, crashed(ansiRun), ansiMapLine > 0 && own(ansiRun.stderr).some((l) => new RegExp(`\\b${ansiMapLine}\\b`).test(l)), proofOf(ansiRun.stdout)], [1, false, true, null], own(ansiRun.stderr).slice(0, 3).join(" | "));

		// Usage (R-1167, §3.6): exit 2 with the usage line.
		const shapes = [[], ["--root", copy, "--write", "--emit-mapping", path.join(copy, "maps", "new.json")], ["--root", copy, "--mapping", path.join(copy, "maps", "bom.json"), "--emit-mapping", path.join(copy, "maps", "new2.json")], ["--root", copy, "--verify", "-x"]];
		const runs = shapes.map((a) => lift(a, scratch));
		out("(w) no --root, --write with --emit-mapping, --mapping with --emit-mapping and a <rev> starting - each exit 2 with a usage line naming --root (R-1167, §3.6)",
			[runs.map((x) => x.status), runs.map((x) => crashed(x)), runs.map((x) => /--root/.test(x.stderr)), fs.existsSync(path.join(copy, "maps", "new.json")) || fs.existsSync(path.join(copy, "maps", "new2.json"))], [[2, 2, 2, 2], [false, false, false, false], [true, true, true, true], false], runs.map((x) => own(x.stderr)[0] ?? "").join(" | "));
		// §3.6: "--emit-mapping joins no --mapping, --write or --verify"; --write and --verify are one bracket's two choices.
		const beforeConflicts = fileList(copy);
		const conflicts = [["--root", copy, "--write", "--verify", "HEAD"], ["--root", copy, "--emit-mapping", path.join(copy, "maps", "new3.json"), "--verify", "HEAD"]].map((a) => lift(a, scratch));
		out("(w) --write with --verify, and --emit-mapping with --verify, each exit 2 with a usage line naming --root and create no file (R-1167, §3.6)",
			[conflicts.map((x) => x.status), conflicts.map((x) => crashed(x)), conflicts.map((x) => /--root/.test(x.stderr)), JSON.stringify(fileList(copy)) === JSON.stringify(beforeConflicts)], [[2, 2], [false, false], [true, true], true], conflicts.map((x) => own(x.stderr)[0] ?? "").join(" | "));
		// The main guard through a symlink (§3.6, T3's form): the plan still prints.
		const link = path.join(scratch, "lift-link.mjs");
		try { fs.symlinkSync(LIFT, link); } catch {}
		const viaLink = node([link, "--root", copyLedger("flat-for-link", L.bgHead)], scratch);
		out("(w) run through a symlink to the script, the dry run on the flat HEAD copy still prints its plan and proof line (§3.6, R-1162)", [viaLink.status, idLines(viaLink.stdout).length, proofOf(viaLink.stdout)?.rows ?? null], [0, bgSeq.length, 165], own(viaLink.stderr).slice(0, 2).join(" | "));
		gitIn(main.dir, "worktree", "remove", "--force", lane);
	}
	out("(harness) every scratch repository the run made persists core.autocrlf=false in its own config", [repos.length > 0, repos.filter((d) => persistedAutocrlf(d) !== "false").map((d) => path.basename(d))], [true, []]);
	} // ledgerCases
} finally {
	fs.rmSync(scratch, { recursive: true, force: true });
}

// ---------------------------------------------------------------- (s) the requirements skill (R-1169, §3.7)
// Phrases run on whitespace-collapsed text, so a wrapped line cannot hide one.
const CARVE = "A ledger without a requirements tree keeps its numbered sections; its next step is a lift into the tree, with every row kept byte-identical, then a regroup into capabilities and features that the owner approves.";
const skillRaw = text("packages/nana-pack/skills/requirements/SKILL.md") ?? "";
const reqSkill = collapse(skillRaw);
out("(s) the requirements skill names the lift's dry run exactly and T29's three phrases (R-1169)",
	[LIFT_SKILL_CMD, "only after the owner's yes", "matches HEAD in every worktree", "never commit, stash or discard another session's lines"].filter((p) => !reqSkill.includes(p)), []);
const description = /^description:(.*)$/m.exec(skillRaw.split(/^---$/m)[1] ?? "")?.[1] ?? "";
out("(s) the skill description gains \"requirements tree\" and \"lift\" (§3.7)", [description.includes("requirements tree"), /\blift\b/.test(description)], [true, true], description.slice(0, 200));
out("(guard) the requirements skill keeps R-1154's carve-out sentence (§3.7)", reqSkill.includes(CARVE), true);
// R-1169: "say that the seat reports uncommitted ledger edits to the owner"; §3.7 words it "on uncommitted edits, tell
// the owner" (not quoted there, so the row's own wording is accepted too).
out("(s) the requirements skill says to tell the owner about uncommitted ledger edits (R-1169, §3.7)",
	/uncommitted[^.]*\btell the owner\b/i.test(reqSkill) || /\breports? uncommitted ledger edits to the owner\b/i.test(reqSkill), true);
const liftSource = text(LIFT_SCRIPT);
// The lift's flags: every --flag in a paragraph about the lift, outside backticks or inside a span that names the lift
// or no other script; each must appear in the lift's source as a whole flag, so `--map` never passes on `--mapping`.
const FLAG = /(?<![\w-])--[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?![\w-])/g;
const liftParas = skillRaw.split(/\n\s*\n/).filter((p) => /requirements-lift\.mjs|\blift\b/i.test(p));
const liftFlags = [...new Set(liftParas.flatMap((p) => {
	const spans = [...p.matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((s) => s.includes("requirements-lift.mjs") || !/\.(?:mjs|cjs|js|ts|py)\b/.test(s));
	return [...spans, p.replace(/`[^`]*`/g, " ")].flatMap((s) => s.match(FLAG) ?? []);
}))].sort();
const wholeFlag = (src, f) => new RegExp(`(?<![\\w-])${f}(?![\\w-])`).test(src ?? "");
out("(s) every flag the skill shows for the lift, inside backticks or not, appears in the lift's source as a whole flag, and the skill shows --root and --write (R-1169)",
	[liftFlags.includes("--root") && liftFlags.includes("--write"), liftFlags.filter((f) => !wholeFlag(liftSource, f))], [true, []], liftFlags.join(" "));

// ---------------------------------------------------------------- (e) rows
const change = spec("CHANGE.md");
const delta = change.slice(change.indexOf("## 2. Requirement delta"), change.indexOf("## 3. Design"));
const drafts = new Map(delta.split("\n").filter((l) => /^\| R-\d+ \|/.test(l)).map((l) => { const c = l.split("|").map((s) => s.trim()); return [c[1], c[3]]; }));
const NEW = Array.from({ length: 8 }, (_, i) => `R-${1162 + i}`);
const shalls = (s) => ((s ?? "").replace(/`[^`]*`/g, "").match(/\bshall\b/gi) ?? []).length;
out("(harness) CHANGE §2 gives one-shall text for each of R-1162 to R-1169, and the lane adds eight rows", [NEW.map((id) => shalls(drafts.get(id))), drafts.size, LANE_ROWS_ADDED], [NEW.map(() => 1), 8, 8]);
const reqLines = lines(text("REQUIREMENTS.md"));
const baseReqLines = lines(atBase("REQUIREMENTS.md"));
const rowAt = (id, ls = reqLines) => ls.findIndex((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
const cells = (id, ls = reqLines) => { const i = rowAt(id, ls); return i < 0 ? [] : ls[i].split(/(?<!\\)\|/).map((s) => s.trim()); };
const headingOf = (i) => { for (let k = i; k >= 0; k--) if (/^#{1,3} /.test(reqLines[k])) return reqLines[k].replace(/ ·.*$/, "").replace(/^#+ /, ""); return null; };
for (const id of NEW) {
	const rows = reqLines.filter((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
	out(`(e) ${id} is one row carrying CHANGE §2's text with exactly one "shall"`, [rows.length, shalls(cells(id)[2]), cells(id)[2] ?? null], [1, 1, drafts.get(id) ?? "(no draft)"]);
}
const BLOCKS = [["R-1161", "FEAT-028", NEW.slice(0, 7)], ["R-1156", "FEAT-032", NEW.slice(7)]];
for (const [anchor, home, ids] of BLOCKS) {
	const chain = [anchor, ...ids];
	out(`(e) ${ids.length > 1 ? `${ids[0]}–${ids.at(-1)} follow` : `${ids[0]} follows`} ${anchor} line by line in ${home} (§2)`,
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
out("(e) R-1162 to R-1169 and R-291 read implemented", [...NEW, "R-291"].filter((id) => (cells(id)[3] ?? "") !== "implemented"), []);
out("(guard) R-291's evidence keeps every base citation other than the base leaf-total title", rtTitles.error ? rtTitles.error : cites(cells("R-291", baseReqLines)[4]).filter((c) => !c.endsWith(rtTitles.before) && !cites(cells("R-291")[4]).includes(c)), []);
const baseIds = baseReqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
const headIds = reqLines.map((l) => ROW.exec(l)?.[1]).filter(Boolean);
out("(guard) no base row changes its Requirement text or Status (§2)", baseIds.filter((id) => { const a = cells(id, baseReqLines), b = cells(id); return a[2] !== b[2] || a[3] !== b[3]; }), []);
out(`(e) the row set is the base's plus R-1162 to R-1169, each once: leaf total ${baseIds.length} → ${baseIds.length + LANE_ROWS_ADDED} (§2)`,
	{ added: headIds.filter((id) => !baseIds.includes(id)).sort(), removed: baseIds.filter((id) => !headIds.includes(id)), count: headIds.length }, { added: [...NEW].sort(), removed: [], count: baseIds.length + NEW.length });
out("(e) the leaf totals agree with R-291's renamed title (T30)", rtTitles.error ? rtTitles.error : [rtTitles.beforeTotal, rtTitles.afterTotal], [baseIds.length, headIds.length]);
const treeHeads = (ls) => ls.filter((l) => /^#{1,3} (CAP|FEAT|SUB)-/.test(l));
out(`(guard) nana-pi's tree headings are the base's (${treeHeads(baseReqLines).length}; §2 "headings stay 68")`, treeHeads(reqLines), treeHeads(baseReqLines));
out("(harness) R-1162 to R-1169 are unused at the base (§2)", baseReqLines.filter((l) => /\bR-116[2-9]\b/.test(l)).length, 0);
const rail = node(["scripts/requirements-trace.mjs"]);
out("(guard) the trace rail is green: node scripts/requirements-trace.mjs exits 0 (§5 Suite)", rail.status, 0, (rail.stdout + rail.stderr).split("\n").filter((l) => /^\s{2}\S/.test(l)).slice(0, 5).join(" | "));

// ---------------------------------------------------------------- (f) scope
// §4 "In.", quoted: "New `scripts/requirements-lift.mjs`, `scripts/requirements-lift-proof.mjs`,
// `packages/nana-pack/tests/requirements-lift.test.mjs` (six-tag headers). `scripts/requirements-tree.mjs`: four `export`
// keywords. `packages/nana-pack/skills/requirements/SKILL.md`: the frontmatter description and §4. Tests:
// `templates-render.test.mjs` …, `requirements-tree.test.mjs` …. `README.md` names both new scripts … `REQUIREMENTS.md`,
// regenerated `docs/requirements-tree.md` and `docs/code-map.md`, `HANDOFF.md`, `docs/sessions/2026-10.md`, this corpus."
const SCOPE = [LIFT_SCRIPT, PROOF_SCRIPT, LT, RT_SCRIPT, "packages/nana-pack/skills/requirements/SKILL.md", TR, RT,
	"README.md", "REQUIREMENTS.md", "docs/requirements-tree.md", "docs/code-map.md", "HANDOFF.md", "docs/sessions/2026-10.md"];
const SCOPE_PREFIX = "docs/reviews/lift-2026-10-14/";
const diff = git("diff", "--name-only", `${base}..HEAD`);
const changed = diff.stdout.split("\n").filter(Boolean);
out(`(guard) git diff --name-only ${base.slice(0, 7)}..HEAD lists only §4 In paths and this review folder`, diff.status === 0 ? changed.filter((p) => !SCOPE.includes(p) && !p.startsWith(SCOPE_PREFIX)) : `git exit ${diff.status}`, []);
// §3.8: "No change to the checker's behaviour …, `main` or guard; `scripts/product-report.mjs`; the seeds and templates; the
// five pi skills; `packages/nana-setup/**`; any other project's files."
const FIVE = ["scaffold-py", "scaffold-ts", "adopt-py", "adopt-ts", "adopt-structure"];
const FROZEN_PREFIX = ["scripts/product-report", "templates/", "packages/nana-setup/", ...FIVE.map((s) => `packages/nana-pack/skills/${s}/`)];
out("(guard) the merge-base diff touches nothing §3.8 names", changed.filter((p) => FROZEN_PREFIX.some((x) => p.startsWith(x))), []);
const baseTree = atBase(RT_SCRIPT) ?? "";
const wantTree = baseTree.replace(/^const TABLE_HEADER = /m, "export const TABLE_HEADER = ").replace(/^const TABLE_DELIMITER = /m, "export const TABLE_DELIMITER = ")
	.replace(/^function markdownTableCells\(/m, "export function markdownTableCells(").replace(/^function countRequirementRowLines\(/m, "export function countRequirementRowLines(");
out("(f) requirements-tree.mjs differs from the base by exactly four `export` keywords on TABLE_HEADER, TABLE_DELIMITER, markdownTableCells and countRequirementRowLines (§3.1, §4, §3.8)", (text(RT_SCRIPT) ?? "") === wantTree && wantTree !== baseTree, true);
const exportsProbe = node(["--input-type=module", "-e", `import * as m from ${JSON.stringify(pathToFileURL(TREE).href)}; console.log([typeof m.TABLE_HEADER, m.TABLE_DELIMITER instanceof RegExp, typeof m.markdownTableCells, typeof m.countRequirementRowLines].join(","));`]);
out("(f) the tree module exports the four names (§3.1)", lines(exportsProbe.stdout).at(-1) ?? null, "string,true,function,function", own(exportsProbe.stderr).join(" "));
const liftProbe = node(["--input-type=module", "-e", `const m = await import(${JSON.stringify(pathToFileURL(LIFT).href)}); console.log(JSON.stringify([m.UNSORTED_PREFIX, m.PROBLEM_LINE_CAP, m.MAPPING_FORMAT, m.CANONICAL_DELIMITER, ["UNSORTED_LABEL","UNSORTED_TEXT","CLOSING_HEADING","KEPT_SECTIONS","GENERAL_SEED"].filter((k) => m[k] === undefined), typeof m.UNSORTED_TEXT === "string" && m.UNSORTED_TEXT.startsWith(m.UNSORTED_PREFIX)]));`]);
out("(f) the lift module exports its tunables by name: UNSORTED_PREFIX \"Not yet sorted:\", PROBLEM_LINE_CAP 40, MAPPING_FORMAT 1, CANONICAL_DELIMITER |---|---|---|---|, and the rest defined (§3.1)",
	lines(liftProbe.stdout).at(-1) ?? null, JSON.stringify([UNSORTED, 40, 1, "|---|---|---|---|", [], true]), own(liftProbe.stderr).slice(-2).join(" "));
// R-1163 / §3.1: the proof imports only the tree module, the trace shim and node builtins, and nothing it reaches is the lift module.
const importsOf = (abs) => { let src; try { src = fs.readFileSync(abs, "utf8"); } catch { return null; } return [...src.matchAll(/(?:^|[\s;])(?:import|export)\s*(?:[^'"`;]*?\sfrom\s*)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1] ?? m[2]); };
const proofAbs = path.join(root, PROOF_SCRIPT);
const direct = importsOf(proofAbs);
const reach = new Set(); const stack = direct ? [proofAbs] : [];
while (stack.length) { const f = stack.pop(); if (reach.has(f)) continue; reach.add(f); for (const s of importsOf(f) ?? []) if (s.startsWith(".")) stack.push(path.resolve(path.dirname(f), s)); }
out("(f) the proof module imports only the tree module, the trace shim and node builtins, and reaches no lift module (R-1163, §3.1, T7)",
	direct === null ? "no proof module" : [direct.filter((s) => !s.startsWith("node:") && !["./requirements-tree.mjs", "./requirements-trace.mjs"].includes(s)), [...reach].filter((f) => path.basename(f) === "requirements-lift.mjs")], [[], []]);
out("(f) the lift's source runs no git add, commit, stash, reset, checkout or restore (§3.8)", liftSource === null ? "no lift module" : [...liftSource.matchAll(/["'`](add|commit|stash|reset|checkout|restore)["'`]/g)].map((m) => m[1]), []);
const guardLine = (src) => (src ?? "").split("\n").filter((l) => /^if \(process\.argv\[1\]/.test(l)).at(-1) ?? null;
out("(guard) the tree module's main guard is the base's line, unchanged (§3.8)", Boolean(guardLine(baseTree)) && (text(RT_SCRIPT) ?? "").split("\n").includes(guardLine(baseTree)), true);
const readme = text("README.md") ?? "";
out("(f) README names both new scripts, the lift command with --root beside its git need (§4, readme-check's every-script rule)",
	[readme.includes("requirements-lift-proof.mjs"), readme.split(/\n\s*\n/).some((p) => p.includes("requirements-lift.mjs") && p.includes("--root") && /\bgit\b/.test(p))], [true, true]);
for (const [label, args] of [["node scripts/requirements-tree.mjs --check", [RT_SCRIPT, "--check"]], ["map:check (node scripts/code-map.mjs --check)", ["scripts/code-map.mjs", "--check"]], ["readme:check (node scripts/readme-check.mjs)", ["scripts/readme-check.mjs"]]]) {
	const r = node(args);
	out(`(guard) ${label} exits 0 (§5 Suite)`, r.status, 0, (r.stdout + r.stderr).slice(-300));
}
out("(f) HANDOFF.md and the session entry docs/sessions/2026-10.md are in the lane's diff (§4 In, the land checklist)", ["HANDOFF.md", "docs/sessions/2026-10.md"].filter((p) => !changed.includes(p)), []);
// The build must be committed: an untracked or modified path outside this review folder would pass every case above
// that reads the working tree.
out("(guard) the build is committed: no uncommitted or untracked path outside this review folder (§4)", lines(statusBefore).filter((l) => !l.slice(3).startsWith(SCOPE_PREFIX)), []);

// ---------------------------------------------------------------- (g) the §5 titles print PASS
const copierVersion = spawnSync("uvx", ["copier", "--version"], { cwd: root, encoding: "utf8" });
out("(harness) uvx copier is available (templates-render.test.mjs runs with NANA_TEST_REQUIRE_COPIER=1)", copierVersion.status, 0, copierVersion.stderr);
const runs = new Map();
for (const file of [LT, TR, RT]) {
	const r = node(["--experimental-strip-types", file], root, { env: { ...cleanEnv(), NANA_TEST_REQUIRE_COPIER: "1" } });
	runs.set(file, r);
	out(`${file === LT ? "(g)" : "(guard)"} ${file} exits 0 (§5 Suite)`, r.status, 0, lines(r.stdout).filter((l) => /^FAIL /.test(l)).slice(0, 3).join(" | ") + own(r.stderr).slice(-2).join(" | "));
}
const printed = (file, word, title) => lines(runs.get(file)?.stdout).filter((l) => l.startsWith(`${word} ${title}`) && l.slice(word.length + 1 + title.length).trim() === "").length;
out("(g) every §5 title prints PASS exactly once and never FAIL or SKIP", entries.filter(([file, title]) => printed(file, "PASS", title) !== 1 || printed(file, "FAIL", title) || printed(file, "SKIP", title)).map(([, title]) => title.slice(0, 60)), [],
	`${entries.length} titles`);

out("(harness) the run wrote nothing inside the checkout (git status unchanged)", statusOf() === statusBefore, true);
console.log(`cases: ${n - bad}/${n} (build cases red: ${badBuild}/${nBuild}; guard and harness red: ${bad - badBuild}/${n - nBuild})`);
console.log(`lift acceptance: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
