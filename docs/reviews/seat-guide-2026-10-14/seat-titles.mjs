// Seat title check for lane seat-guide (frozen per build; written by the seat 2026-10-14 before the build, from
// CHANGE.md §5 "Exact test titles" and "Base update (2026-10-14)"). Run from anywhere inside the checkout under test
// (the files are read from the cwd's git root):
//   node docs/reviews/seat-guide-2026-10-14/seat-titles.mjs <build>
// Titles live in several test files, so each entry is [file, title, rows]. For each entry the file must hold the
// title verbatim as a check(…) title, exactly once, with a `// req:` line directly above it naming every listed row.
// Case-helper form per file: the existing files use `check("<title>", …)` with the title on the call's own line; the
// new seat-rule.test.mjs may also await it. A backtick title with no `${` counts as the same literal title. GONE
// titles must not appear as a check title in their file. It proves the cases EXIST; the seat's mutation runner later
// proves they bite. acceptance.mjs runs this file as a child process; no suite test may import or run it.
// Writes nothing.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

const SEAT = "packages/nana-setup/tests/seat-rule.test.mjs"; // new
const INSTALL = "packages/nana-setup/tests/install.test.mjs";
const W32 = "packages/nana-setup/tests/win32-degrade.test.mjs";
const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";

const LITERAL = String.raw`(?:"((?:[^"\\]|\\.)*)"|` + "`" + String.raw`((?:[^` + "`" + String.raw`\\$]|\\.|\$(?!\{))*)` + "`)";
const PLAIN = new RegExp(String.raw`^\s*check\(\s*` + LITERAL);
const AWAITABLE = new RegExp(String.raw`^\s*(?:await\s+)?check\(\s*` + LITERAL);
const FORM = { [SEAT]: AWAITABLE, [INSTALL]: PLAIN, [W32]: PLAIN, [TR]: PLAIN, [RT]: PLAIN };

/** The checkout under test: the cwd's git root (the cwd itself outside git). */
export function repoRoot(cwd = process.cwd()) {
	const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" });
	return r.status === 0 ? r.stdout.trim() : cwd;
}

// R-291's title carries the tree's leaf total. The lane adds three rows (R-1140, R-1141, R-1142), so the title moves
// from the base's total to base + 3 (CHANGE §2: 1,113 → 1,116 at 484329c). The base total is READ from the merge
// base's requirements-tree test, never hard-coded, so a merge of a newer main moves both literals with it.
const TREE_PREFIX = "R-291: every real heading's committed IDs survive expansion and leaf counts total ";
const LANE_ROWS_ADDED = 3; // CHANGE §2: R-1140, R-1141, R-1142 added; R-301 reworded in place
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
	return { base: sha, before: `${TREE_PREFIX}${fmt(before)}`, after: `${TREE_PREFIX}${fmt(before + LANE_ROWS_ADDED)}` };
}

export function required(build, root = repoRoot()) {
	const tree = treeTitles(root);
	const lists = {
		"1": [
			// seat-rule.test.mjs (new; six-tag header; reads the guide with \r stripped): R-1141 once, R-1140 nine times.
			[SEAT, "seat guide scopes itself to the seat in one sentence before its first bullet", ["R-1141"]],
			[SEAT, "seat guide holds no bullet beyond its eight rules", ["R-1140"]],
			[SEAT, "seat guide carries: launch in the background and end the turn", ["R-1140"]],
			[SEAT, "seat guide carries: no reading or judging partial work mid-run", ["R-1140"]],
			[SEAT, "seat guide carries: act on completion or a monitor's failure or stall", ["R-1140"]],
			[SEAT, "seat guide carries: verify once at the end", ["R-1140"]],
			[SEAT, "seat guide carries: re-run the mutation runner after the seat's own change", ["R-1140"]],
			[SEAT, "seat guide carries: findings back in the next brief", ["R-1140"]],
			[SEAT, "seat guide carries: at most two lanes in flight", ["R-1140"]],
			[SEAT, "seat guide carries: preamble and review standard named, not restated", ["R-1140"]],
			// install.test.mjs: R-301's new symlink check.
			[INSTALL, "rule nana-seat.md is a symlink into the repo", ["R-301"]],
			// win32-degrade.test.mjs: R-350's one new title.
			[W32, "win32: nana-seat.md is installed as a copy matching the repo file", ["R-350"]],
			// templates-render.test.mjs: R-1142's two checks.
			[TR, "shared working pattern carries one seat-guide bullet", ["R-1142"]],
			[TR, "seat-guide bullet names a guide file present in this checkout", ["R-1142"]],
			// requirements-tree.test.mjs: R-291 renamed (base total plus three).
			...(tree.error ? [] : [[RT, tree.after, ["R-291"]]]),
		],
	};
	const gone = { "1": tree.error ? [] : [[RT, tree.before]] };
	return { entries: lists[build], gone: gone[build] ?? [], treeError: tree.error ?? null, tree };
}
export const BUILDS = ["1"];

/** Map title → array of `// req:` lines (one per occurrence; "" when the line above is not a marker). */
export function checkTitles(file, form = PLAIN) {
	let text;
	try { text = fs.readFileSync(file, "utf8"); } catch { return null; }
	const lines = text.split(/\r?\n/);
	const found = new Map();
	lines.forEach((line, i) => {
		const m = form.exec(line);
		if (!m) return;
		let title;
		if (m[1] !== undefined) { try { title = JSON.parse(`"${m[1]}"`); } catch { return; } }
		else { try { title = JSON.parse(`"${m[2].replace(/\\`/g, "`").replace(/"/g, '\\"')}"`); } catch { return; } }
		const above = (lines[i - 1] ?? "").trim();
		found.set(title, [...(found.get(title) ?? []), /^\/\/\s*req:/.test(above) ? above : ""]);
	});
	return found;
}

/** One report line per entry; returns the number of bad entries. */
export function report(build, print = console.log, root = repoRoot()) {
	const { entries, gone, treeError } = required(build, root);
	const cache = new Map();
	const titlesIn = (file) => { if (!cache.has(file)) cache.set(file, checkTitles(path.join(root, file), FORM[file] ?? PLAIN)); return cache.get(file); };
	let bad = 0;
	if (treeError) { bad++; print(`NO-BASE  ${RT} — R-291's base leaf total could not be read: ${treeError}`); }
	for (const [file, title, rows] of entries) {
		const found = titlesIn(file);
		if (!found) { bad++; print(`NO-FILE  ${file} — ${title}`); continue; }
		if (!found.has(title)) { bad++; print(`MISSING  ${file} — ${title}`); continue; }
		const reqs = found.get(title);
		if (reqs.length > 1) { bad++; print(`DUP      ${file} — ${title} (${reqs.length} times)`); continue; }
		const missingRows = rows.filter((r) => !new RegExp(`\\b${r}\\b`).test(reqs[0]));
		if (missingRows.length) { bad++; print(`NO-REQ   ${file} — ${title} — the line above must name ${missingRows.join(", ")} (saw ${JSON.stringify(reqs[0])})`); continue; }
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
