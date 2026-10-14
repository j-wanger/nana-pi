// Seat title check for lane tree (frozen per build; written by the seat 2026-10-14 before the build, from CHANGE.md
// §5 "Verification" T1–T15 and §4's R-291 rule, plan frozen at afb4c01). Run from anywhere inside the checkout under
// test (the files are read from the cwd's git root):
//   node docs/reviews/tree-2026-10-14/seat-titles.mjs <build>
// Each entry is [file, title, rows]. A title is the string the test PRINTS: §5's `${language} ${mode}` titles follow
// R-737's form (templates-render.test.mjs:172) and are listed here expanded the way the render loops print them —
// language over LANGS' order (typescript, python), mode over scaffold and adopt; T3 is adopt-only. A check(…) call
// whose title is a template literal holding only `${language}` and `${mode}` placeholders counts for every expansion
// it can print, so the builder may write one helper title or one literal per block. For each entry the file must
// hold exactly one check(…) call that prints the title, with the title on the call's own line, and `// req:` lines
// directly above it (stacked lines merge, as the rail reads them) naming every listed row. GONE titles must not
// appear. It proves the cases EXIST; acceptance.mjs checks that each one prints PASS, and the seat's mutation runner
// later proves they bite. acceptance.mjs imports this file (the one title list); no suite test may import or run it.
// Writes nothing.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const TR = "packages/nana-pack/tests/templates-render.test.mjs";
export const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";
export const PR = "packages/nana-pack/tests/product-report.test.mjs";
export const FILES = [TR, RT, PR];

/** Placeholder values, in the order the render loops print them (LANGS: typescript, then python). */
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

const expand = (titles) => titles.flatMap((t) => expansions(t));
const T = (title) => [title];
const LM = (rest) => expand([`\${language} \${mode}: ${rest}`]);
const LA = (rest) => expand([`\${language} adopt: ${rest}`]);

// R-291's title carries the tree's leaf total. The lane adds twelve rows (R-1150 to R-1161), so the title moves from
// the base's total to base + 12 (CHANGE §2: 1,113 → 1,125 at 484329c; 1,116 → 1,128 if seat-guide lands first). The
// base total is READ from the merge base's requirements-tree test, never hard-coded, so a merge of a newer main moves
// both literals with it.
const TREE_PREFIX = "R-291: every real heading's committed IDs survive expansion and leaf counts total ";
export const LANE_ROWS_ADDED = 12; // CHANGE §2: R-1150 to R-1161 added; no row reworded or retired
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
	const rows = (file, titles, ids) => titles.map((title) => [file, title, ids]);
	const lists = {
		"1": [
			// templates-render.test.mjs, in the four render loops beside the partG calls (T1–T4), and the skill checks (T5–T7).
			...rows(TR, LM("REQUIREMENTS.md passes the requirements tree checker"), ["R-1150"]), // T1
			...rows(TR, LM("every G row is homed in FEAT-900 under CAP-90 with no R row"), ["R-1151"]), // T2
			...rows(TR, LA("the product feature is proposed and holds no row"), ["R-1152"]), // T3
			...rows(TR, LM("REQUIREMENTS.md says how rows are grouped, where a new row goes, who decides and how to check"), ["R-1153"]), // T4
			...rows(TR, T("requirements skill directs every row into the feature it serves, keeps a flat ledger's sections and names the owner"), ["R-1154"]), // T5
			...rows(TR, T("scaffold and adopt skills direct rows into the feature each serves, keep a flat ledger's sections and name no Part G"), ["R-1155"]), // T6
			...rows(TR, T("requirements skill names the tree check and the product report with a project root"), ["R-1156"]), // T7
			// requirements-tree.test.mjs (each spawns the checker CLI on temp dirs).
			...rows(RT, T("R-1157: --root checks another project's ledger, names its problems and writes no outline"), ["R-1157"]), // T8
			...rows(RT, T("R-1160: --root refuses a UTF-16 ledger and a ledger with no rows, naming the reason"), ["R-1160"]), // T9
			...rows(RT, T("R-1158: a CRLF ledger gives the same problems and line numbers as its LF copy"), ["R-1158"]), // T10
			...rows(RT, T("R-1159: a ledger with rows and no tree gets one line naming the row count and the next step"), ["R-1159"]), // T11
			...rows(RT, T('R-1161: a tree heading typed with "-" for "·" is named with its line and the expected form, not taken for a flat ledger'), ["R-1161"]), // T15
			...(tree.error ? [] : rows(RT, T(tree.after), ["R-291"])), // T12: R-291 renamed (base total plus twelve)
			// product-report.test.mjs.
			...rows(PR, T("a ledger with rows and no tree is refused with one problem line, not one per row"), ["R-1159"]), // T13
			...rows(PR, T("a UTF-16 ledger and a ledger with no rows are refused by the report, naming the reason, and build no page"), ["R-1160"]), // T14
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
	const lines = text.replace(/^\ufeff/, "").split(/\r?\n/);
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
