// Seat title check for lane regroup-shares (frozen per build; written by the seat 2026-10-15 before the build, from
// CHANGE.md §5 "Verification" T1–T10 and §2's R-291 rule, plan frozen at e5837c1 after sol plan r1 LAND). Run from
// anywhere inside the checkout under test (the files are read from the cwd's git root):
//   node docs/reviews/regroup-shares-2026-10-15/seat-titles.mjs <build>
// Each entry is [file, title, rows]. A title is the string the test PRINTS; every §5 title here is a plain literal (no
// render loop prints these), so the builder writes each one once. For each entry the file must hold exactly one
// check(…) call that prints the title, with the title on the call's own line, and `// req:` lines directly above it
// (stacked lines merge, as the rail reads them) naming every listed row. GONE titles must not appear: T22b's title
// (§5 "Removed: T22b") and R-291's base leaf-total title. T10 is required only when the regroup lane is on main at the
// base (`scripts/requirements-regroup.mjs` exists at `git merge-base main HEAD`): §4 Overlap gives T10 to whichever lane
// lands second, so while the regroup lane has not landed, the regroup merge owns it and this list does not hold it.
// It proves the cases EXIST; acceptance.mjs checks that each one prints PASS, and the seat's mutation runner later
// proves they bite. acceptance.mjs imports this file (the one title list); no suite test may import or run it.
// Writes nothing.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const LT = "packages/nana-pack/tests/requirements-lift.test.mjs";
export const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";
export const RG = "packages/nana-pack/tests/requirements-regroup.test.mjs";
export const REGROUP_SCRIPT = "scripts/requirements-regroup.mjs";
export const FILES = [LT, RT, RG];

/** Placeholder values a template-literal title may carry (none of this lane's titles does; kept for the form). */
export const PLACEHOLDERS = {};

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

/** The merge base the lane is measured from: `git merge-base main HEAD`. */
export function mergeBase(root = repoRoot()) {
	const r = spawnSync("git", ["merge-base", "main", "HEAD"], { cwd: root, encoding: "utf8" });
	return r.status === 0 ? { sha: r.stdout.trim() } : { error: `git merge-base main HEAD failed: ${r.stderr.trim()}` };
}

// R-291's title carries the tree's leaf total. The lane adds three rows (R-1181 to R-1183), so the title moves from
// the base's total to base + 3 (CHANGE §2: 1,136 → 1,139 at e451c90; 1,151 when the regroup lane's 12 rows are in the
// base). The base total is READ from the merge base's requirements-tree test, never hard-coded, so a merge of a newer
// main moves both literals with it (§4 Overlap: the second lander sets the literal).
const TREE_PREFIX = "R-291: every real heading's committed IDs survive expansion and leaf counts total ";
export const LANE_ROWS_ADDED = 3; // CHANGE §2: R-1181 to R-1183 added; R-1167 reworded; no row retired
export function treeTitles(root = repoRoot()) {
	const base = mergeBase(root);
	if (base.error) return { error: base.error };
	const sha = base.sha;
	const src = spawnSync("git", ["show", `${sha}:${RT}`], { cwd: root, encoding: "utf8" });
	if (src.status !== 0) return { error: `git show ${sha.slice(0, 7)}:${RT} failed` };
	const m = new RegExp(`check\\(\\s*"${TREE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([\\d,]+)"`).exec(src.stdout);
	if (!m) return { error: `no R-291 leaf-total title in ${RT} at ${sha.slice(0, 7)}` };
	const before = Number(m[1].replace(/,/g, ""));
	const fmt = (n) => n.toLocaleString("en-US");
	return { base: sha, beforeTotal: before, afterTotal: before + LANE_ROWS_ADDED, before: `${TREE_PREFIX}${fmt(before)}`, after: `${TREE_PREFIX}${fmt(before + LANE_ROWS_ADDED)}` };
}

/** Whether the regroup lane is on main at the base: its checker script exists in the merge-base commit (§4 Overlap, S11). */
export function regroupAtBase(root = repoRoot()) {
	const base = mergeBase(root);
	if (base.error) return { error: base.error, landed: false };
	const r = spawnSync("git", ["cat-file", "-e", `${base.sha}:${REGROUP_SCRIPT}`], { cwd: root, encoding: "utf8" });
	return { base: base.sha, landed: r.status === 0 };
}

// §5 "Removed: T22b" (test:1386 at e451c90).
export const T22B = "R-1167: a tree-form ledger with an Also applies line in a feature's field block is refused, in every mode, never silently dropped";
// T22 keeps its title and stays green (§2 "R-1167 diff"); acceptance.mjs checks it still prints PASS.
export const T22 = "R-1167: the lift refuses a UTF-16 ledger, an ANSI line that is not valid UTF-8, a ledger with no rows, a fenced row, a level-4 or setext heading, an Also applies line and a carried field line, naming each line";

export function required(build, root = repoRoot()) {
	const tree = treeTitles(root);
	const regroup = regroupAtBase(root);
	const row = (file, title, ids) => [file, title, ids];
	const lists = {
		"1": [
			// requirements-lift.test.mjs (§5, in its order).
			row(LT, "R-1181: the identity mapping of a tree-form ledger with shares writes each Also applies line byte-identical, LF, CRLF, mixed-ending, BOM and no-space lists included, and a line after its table moves up with its bytes kept", ["R-1181"]), // T1
			row(LT, "R-1181: a feature merged with another, or demoted to a subgroup, carries the shares of every old feature heading it names to the feature that holds it", ["R-1181"]), // T2
			row(LT, "R-1181: --write lifts a committed ledger with shares through a committed mapping that declares a drop and an add, and --verify with --mapping passes it", ["R-1181"]), // T3
			row(LT, "R-1182: the proof names an undeclared dropped share, an undeclared added share, a share lost beside a declared drop, a changed byte in a kept share line, a kept line moved to another feature, a kept line copied under a capability and an added share naming no input row", ["R-1182"]), // T4 (seven tampers)
			row(LT, "R-1182: a declared drop and a declared add prove, and a row moved into the feature that shares it proves only with that share declared dropped", ["R-1182"]), // T5
			row(LT, "R-1183: a mapping's dry run prints one line per declared added or dropped share before the proof line, and none for a kept, merged or demoted feature's shares", ["R-1183"]), // T6
			row(LT, "R-1167: an Also applies line that is not a feature heading's first as the tree checker reads it (a second one, one under a capability or subgroup, in the head, a kept section or the closing heading's span, a fenced one, one under a fence closer underlined by ---) and a share line with no line ending are refused naming the line in the dry run, --emit-mapping, --write and --verify", ["R-1167"]), // T7
			row(LT, "R-1167: a mapping that drops or adds a share without declaring it, declares a drop it does not carry or an add it carries or of an unknown row, names a sharing feature heading in a capability or the tail, or holds shares_added as a string is refused, each named, and --write and --verify leave the ledger unchanged", ["R-1167"]), // T8
			// requirements-tree.test.mjs: R-291 renamed (base total plus three).
			...(tree.error ? [] : [row(RT, tree.after, ["R-291"])]), // T9
			// requirements-regroup.test.mjs: only when the regroup lane is on main at the base (§4 Overlap).
			...(regroup.landed ? [row(RG, "R-1177: a proposal whose feature declares shares_added and shares_dropped holds no unknown key and passes the regroup checker", ["R-1177"])] : []), // T10
		],
	};
	const gone = { "1": [[LT, T22B], ...(tree.error ? [] : [[RT, tree.before]])] };
	return { entries: lists[build], gone: gone[build] ?? [], treeError: tree.error ?? null, tree, regroup };
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
	const { entries, gone, treeError, regroup } = required(build, root);
	const cache = new Map();
	const titlesIn = (file) => { if (!cache.has(file)) cache.set(file, checkTitles(path.join(root, file))); return cache.get(file); };
	let bad = 0;
	if (treeError) { bad++; print(`NO-BASE  ${RT} — R-291's base leaf total could not be read: ${treeError}`); }
	if (regroup.error) { bad++; print(`NO-BASE  ${REGROUP_SCRIPT} — whether the regroup lane is in the base could not be read: ${regroup.error}`); }
	else if (!regroup.landed) print(`note     T10 not required: ${REGROUP_SCRIPT} is not in the base ${regroup.base.slice(0, 7)}; the regroup lane's merge owns PROPOSAL_KEYS and T10 (§4 Overlap)`);
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
