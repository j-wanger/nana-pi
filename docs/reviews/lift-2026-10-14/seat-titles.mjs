// Seat title check for lane lift (frozen per build; written by the seat 2026-10-14 before the build, from CHANGE.md
// §5 "Verification" T1–T31 and §2's R-291 rule, plan frozen at 2a859ef). Run from anywhere inside the checkout under
// test (the files are read from the cwd's git root):
//   node docs/reviews/lift-2026-10-14/seat-titles.mjs <build>
// Each entry is [file, title, rows]. A title is the string the test PRINTS; every §5 title here is a plain literal (no
// render loop prints these), so the builder writes each one once. For each entry the file must hold exactly one
// check(…) call that prints the title, with the title on the call's own line, and `// req:` lines directly above it
// (stacked lines merge, as the rail reads them) naming every listed row. T25 names R-1166 as well as R-1167 (§5: "the
// BOM case also cites R-1166"). GONE titles must not appear. It proves the cases EXIST; acceptance.mjs checks that each
// one prints PASS, and the seat's mutation runner later proves they bite. acceptance.mjs imports this file (the one
// title list); no suite test may import or run it. Writes nothing.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const LT = "packages/nana-pack/tests/requirements-lift.test.mjs";
export const TR = "packages/nana-pack/tests/templates-render.test.mjs";
export const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";
export const FILES = [LT, TR, RT];

/** Placeholder values a template-literal title may carry (none of this lane's titles does; kept for the form). */
export const PLACEHOLDERS = { language: ["typescript", "python"], mode: ["scaffold", "adopt"] };

// The rail's call form (templates/typescript/template/tests/requirements-trace.ts callRegex), for the name `check`:
// the title is the first quoted argument on the call's own line, in ', " or ` quotes.
const CALL = /(?:^|[^\w.$])check\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;

/** The checkout under test: the cwd's git root (the cwd itself outside git). */
export function repoRoot(cwd = process.cwd()) {
	const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" });
	return r.status === 0 ? r.stdout.trim() : cwd;
}

/** Every title a source title can print: a template with only known placeholders expands; any other `${` prints nothing we can match. */
export function expansions(source) {
	if (!source.includes("${")) return [source];
	const names = [...source.matchAll(/\$\{(\w+)\}/g)].map((m) => m[1]);
	if (source.replace(/\$\{\w+\}/g, "").includes("${") || names.some((n) => !PLACEHOLDERS[n])) return [];
	let out = [source];
	for (const name of new Set(names)) out = out.flatMap((t) => PLACEHOLDERS[name].map((v) => t.split(`\${${name}}`).join(v)));
	return out;
}

// R-291's title carries the tree's leaf total. The lane adds eight rows (R-1162 to R-1169), so the title moves from
// the base's total to base + 8 (CHANGE §2: 1,128 → 1,136 at d9cf0bc). The base total is READ from the merge base's
// requirements-tree test, never hard-coded, so a merge of a newer main moves both literals with it.
const TREE_PREFIX = "R-291: every real heading's committed IDs survive expansion and leaf counts total ";
export const LANE_ROWS_ADDED = 8; // CHANGE §2: R-1162 to R-1169 added; no row reworded or retired
export function treeTitles(root = repoRoot()) {
	const base = spawnSync("git", ["merge-base", "main", "HEAD"], { cwd: root, encoding: "utf8" });
	if (base.status !== 0) return { error: `git merge-base main HEAD failed: ${base.stderr.trim()}` };
	const sha = base.stdout.trim();
	const src = spawnSync("git", ["show", `${sha}:${RT}`], { cwd: root, encoding: "utf8" });
	if (src.status !== 0) return { error: `git show ${sha.slice(0, 7)}:${RT} failed` };
	const m = new RegExp(`check\\(\\s*"${TREE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\d,]+)"`).exec(src.stdout);
	if (!m) return { error: `no R-291 leaf-total title in ${RT} at ${sha.slice(0, 7)}` };
	const before = Number(m[1].replace(/,/g, ""));
	const fmt = (n) => n.toLocaleString("en-US");
	return { base: sha, beforeTotal: before, afterTotal: before + LANE_ROWS_ADDED, before: `${TREE_PREFIX}${fmt(before)}`, after: `${TREE_PREFIX}${fmt(before + LANE_ROWS_ADDED)}` };
}

export function required(build, root = repoRoot()) {
	const tree = treeTitles(root);
	const row = (file, title, ids) => [file, title, ids];
	const lists = {
		"1": [
			// requirements-lift.test.mjs (§5, in its order).
			row(LT, "R-1162: a dry run prints one line per planned heading, no move, and the proof line, and writes nothing", ["R-1162"]), // T1
			row(LT, "R-1162: --emit-mapping writes only the named new file and refuses one that exists", ["R-1162"]), // T2
			row(LT, "R-1162: run through a symlink to the script, the dry run still prints its plan", ["R-1162"]), // T3 (skipped on win32)
			row(LT, "R-1162: --emit-mapping on a lifted ledger writes the identity mapping, which --mapping applies with no move line and the same bytes", ["R-1162"]), // T31
			row(LT, "R-1163: the default lift passes its proof, keeps every row line byte-identical and in file order, the row-ID multiset equal and the tree checker clean", ["R-1163"]), // T4
			row(LT, "R-1163: CRLF, BOM-and-CRLF, mixed-ending and unterminated ledgers keep every row line byte-identical with its own ending", ["R-1163"]), // T5
			row(LT, "R-1163: the proof names a dropped row, a changed byte, a stripped CR, a new row-shaped line, a reordered leaf, a lost prose line, prose moved to another node, a dropped blank line and two swapped lines in an in-place leaf, and, with no mapping, a leaf's rows and a section's lines out of input order", ["R-1163"]), // T6 (nineteen tampers)
			row(LT, "R-1163: the proof module imports nothing from the lift module", ["R-1163"]), // T7
			row(LT, "R-1164: --write replaces a clean tracked ledger with the proved bytes in a project in a subfolder of its repository", ["R-1164"]), // T8
			row(LT, "R-1164: --write refuses an uncommitted, staged-only, untracked or git-less ledger, an unborn HEAD, git missing from PATH and an uncommitted ledger edit in a second worktree, naming that worktree, and leaves the ledger unchanged", ["R-1164"]), // T9
			row(LT, "R-1164: --write refuses a mapping file in a subfolder that is untracked or differs from HEAD, and one outside the repository, naming the reason, and accepts a committed one", ["R-1164"]), // T10
			row(LT, "R-1164: --write accepts a clean CRLF checkout under core.autocrlf=true and keeps its CRLF rows", ["R-1164"]), // T11
			row(LT, "R-1164: --write refuses when the ledger changes between the proof and the rename", ["R-1164"]), // T12
			row(LT, "R-1165: the default makes each Part a capability and each ## and ### a feature and subgroup in file order, keeping old heading text as labels and the title and intro in place", ["R-1165"]), // T13
			row(LT, 'R-1165: every default purpose and outcome starts with the unsorted prefix, and the prefix is "Not yet sorted:"', ["R-1165"]), // T14
			row(LT, "R-1165: sections under no Part, and sections after the general-engineering sections, open a Not yet sorted capability", ["R-1165"]), // T15
			row(LT, "R-1165: the general-engineering sections take the seed's CAP-90, FEAT-900 and SUB-900 to SUB-904 headings, purposes and row homes", ["R-1165"]), // T16
			row(LT, "R-1165: Open questions and Deliberate omissions stay verbatim under the seed's closing heading", ["R-1165"]), // T17
			row(LT, "R-1165: prose between table fragments stays between them, and each headless or padded fragment gets the exact table header", ["R-1165"]), // T18
			row(LT, "R-1166: the mapping --emit-mapping writes, passed back with --mapping, gives the default lift's bytes", ["R-1166"]), // T19
			row(LT, "R-1166: a mapping applies to a lifted ledger, moving rows between features in its order and naming each move", ["R-1166"]), // T20
			row(LT, "R-1166: one mapping applies to a ledger's LF and CRLF copies", ["R-1166"]), // T21
			row(LT, "R-1167: the lift refuses a UTF-16 ledger, an ANSI line that is not valid UTF-8, a ledger with no rows, a fenced row, a level-4 or setext heading, an Also applies line and a carried field line, naming each line", ["R-1167"]), // T22
			row(LT, "R-1167: without --mapping, the lift refuses a ledger with a tree or near-tree heading, or a row the default cannot place, naming them", ["R-1167"]), // T23
			row(LT, "R-1167: a mapping is refused, each problem named, for another ledger's pin, a missing, repeated or unknown row, an old heading named twice or never, a G row outside its seed subgroup, an R row in a reserved node and a row under a proposed feature", ["R-1167"]), // T24
			row(LT, "R-1167: a UTF-16, ANSI or line-broken mapping file, or one outside the root, is refused naming the reason, and one with a BOM is accepted", ["R-1167", "R-1166"]), // T25 (the BOM case also cites R-1166)
			row(LT, "R-1167: a mapping missing 1,000 rows prints at most the problem-line cap and the count of the rest", ["R-1167"]), // T26
			row(LT, "R-1167 fixture: a run without --root, or with --write and --emit-mapping together, exits 2 with usage", ["R-1167"]), // T27
			row(LT, "R-1168: --verify passes a committed lift with its mapping in a subfolder against its base and names a hand-edited one's first differing line, in a project in a subfolder", ["R-1168"]), // T28
			// templates-render.test.mjs, in checkRequirementsSkillTreeText (§4, :452-470).
			row(TR, "requirements skill names the lift's dry run, the owner's yes before --write, a clean ledger in every worktree, never discarding another session's lines, and only flags the lift has", ["R-1169"]), // T29
			// requirements-tree.test.mjs: R-291 renamed (base total plus eight).
			...(tree.error ? [] : [row(RT, tree.after, ["R-291"])]), // T30
		],
	};
	const gone = { "1": tree.error ? [] : [[RT, tree.before]] };
	return { entries: lists[build], gone: gone[build] ?? [], treeError: tree.error ?? null, tree };
}
export const BUILDS = ["1"];

/**
 * Map printed title → one record per check(…) line that prints it: { line, source, cite, reqs }. `source` is the
 * title as written (a template keeps its `${…}`), `cite` is the rail's evidence form of it (escapes dropped,
 * backticks removed), `reqs` the ids on the stacked `// req:` lines directly above (empty when there are none).
 */
export function checkTitles(file) {
	let text;
	try { text = fs.readFileSync(file, "utf8"); } catch { return null; }
	const lines = text.replace(/^﻿/, "").split(/\r?\n/);
	const found = new Map();
	lines.forEach((line, i) => {
		const m = CALL.exec(line);
		if (!m) return;
		const raw = m[2];
		const source = raw.replace(/\\(.)/g, "$1");
		const cite = source.replace(/`/g, "");
		const printed = m[1] === "`" ? expansions(source) : [source];
		const reqs = [];
		for (let k = i - 1; k >= 0 && MARKER.test(lines[k]); k--) reqs.unshift(...MARKER.exec(lines[k])[1].split(/[\s,]+/).filter(Boolean));
		for (const title of printed) found.set(title, [...(found.get(title) ?? []), { line: i + 1, source, cite, reqs }]);
	});
	return found;
}

/** One report line per entry; returns the number of bad entries. */
export function report(build, print = console.log, root = repoRoot()) {
	const { entries, gone, treeError } = required(build, root);
	const cache = new Map();
	const titlesIn = (file) => { if (!cache.has(file)) cache.set(file, checkTitles(path.join(root, file))); return cache.get(file); };
	let bad = 0;
	if (treeError) { bad++; print(`NO-BASE  ${RT} — R-291's base leaf total could not be read: ${treeError}`); }
	for (const [file, title, rows] of entries) {
		const found = titlesIn(file);
		if (!found) { bad++; print(`NO-FILE  ${file} — ${title}`); continue; }
		if (!found.has(title)) { bad++; print(`MISSING  ${file} — ${title}`); continue; }
		const at = found.get(title);
		if (at.length > 1) { bad++; print(`DUP      ${file} — ${title} (printed by lines ${at.map((x) => x.line).join(", ")})`); continue; }
		const missingRows = rows.filter((r) => !at[0].reqs.includes(r));
		if (missingRows.length) { bad++; print(`NO-REQ   ${file}:${at[0].line} — ${title} — the req: lines above must name ${missingRows.join(", ")} (saw ${JSON.stringify(at[0].reqs)})`); continue; }
		print(`ok       ${title}`);
	}
	for (const [file, title] of gone) {
		const found = titlesIn(file);
		if (found?.has(title)) { bad++; print(`NOT-GONE ${file} — ${title}`); continue; }
		print(`gone     ${title}`);
	}
	print(`seat-titles ${build}: ${bad} missing`);
	return bad;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const build = process.argv[2];
	if (!BUILDS.includes(build)) { console.log(`usage: seat-titles.mjs <${BUILDS.join("|")}>`); process.exit(2); }
	process.exit(report(build) ? 1 : 0);
}
