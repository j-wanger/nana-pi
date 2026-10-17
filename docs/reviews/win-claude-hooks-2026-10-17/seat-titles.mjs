// Seat title check for lane win-claude-hooks (written by the seat 2026-10-17 before the build, from must-meet.md:
// KH1; KH2 is the Windows CI leg's evidence). Run from anywhere inside the checkout under test:
//   node docs/reviews/win-claude-hooks-2026-10-17/seat-titles.mjs <build>
//   TITLE  [file, title, rows]: the file holds exactly one check(…) call printing the title, on the call's own line,
//          with the stacked `// req:` lines directly above it naming every listed row.
//   GONE   [file, title]: a retired title is no longer printed.
// It proves the checks EXIST; the suite and the Windows leg prove they pass. No suite test may import or run it.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const HW = "packages/nana-setup/tests/hooks-win32-exec.test.mjs"; // KH1 (Windows only; SKIPs elsewhere)
export const RT = "packages/nana-pack/tests/requirements-tree.test.mjs"; // R-291's leaf total
/** Files whose checks run only on the Windows CI leg (scripts/test.mjs SKIPS them elsewhere): none in this lane. */
export const WINDOWS_ONLY = [];

// The rail's call form (templates/typescript/template/tests/requirements-trace.ts callRegex; CALL_NAMES test, it,
// check): the title is the first quoted argument on the call's own line, in ', " or ` quotes.
const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;

/** The checkout under test: the cwd's git root (the cwd itself outside git). */
export function repoRoot(cwd = process.cwd()) {
	const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" });
	return r.status === 0 ? r.stdout.trim() : cwd;
}

/** The merge base the lane is measured from: `git merge-base main HEAD`. */
export function mergeBase(root = repoRoot()) {
	const r = spawnSync("git", ["merge-base", "main", "HEAD"], { cwd: root, encoding: "utf8" });
	return r.status === 0 ? { sha: r.stdout.trim() } : { error: `git merge-base main HEAD failed: ${r.stderr.trim()}` };
}

// R-291's title carries the tree's leaf total: this lane adds one row (R-1330) to whatever main holds at its base. The base total is READ from the merge base's
// requirements-tree test, never hard-coded, so a merge of a newer main (the mutate-runner lane lands first) moves both
// literals with it.
const TREE_PREFIX = "R-291: every real heading's committed IDs survive expansion and leaf counts total ";
export const LANE_ROWS_ADDED = 1;
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

export function required(build, root = repoRoot()) {
	const tree = treeTitles(root);
	const row = (file, title, ids) => [file, title, ids];
	const lists = {
		"1": [
			row(HW, "R-1330: on Windows the installed knowledge hook command prints a pull block naming the fixture file for a matching prompt", ["R-1330"]), // KH1
			...(tree.error ? [] : [row(RT, tree.after, ["R-291"])]),
		],
	};
	const gone = { "1": tree.error ? [] : [[RT, tree.before]] };
	return { entries: lists[build] ?? [], gone: gone[build] ?? [], treeError: tree.error ?? null, tree };
}
export const BUILDS = ["1"];

/**
 * Map title → one record per call line that prints it: { line, source, cite, reqs }. `source` is the title as written,
 * `cite` the rail's evidence form of it (escapes dropped, backticks removed), `reqs` the ids on the stacked `// req:`
 * lines directly above.
 */
export function checkTitles(file) {
	let text;
	try { text = fs.readFileSync(file, "utf8"); } catch { return null; }
	const lines = text.replace(/^﻿/, "").split(/\r?\n/);
	const found = new Map();
	lines.forEach((line, i) => {
		const m = CALL.exec(line);
		if (!m) return;
		const source = m[2].replace(/\\(.)/g, "$1");
		const cite = source.replace(/`/g, "");
		const reqs = [];
		for (let k = i - 1; k >= 0 && MARKER.test(lines[k]); k--) reqs.unshift(...MARKER.exec(lines[k])[1].split(/[\s,]+/).filter(Boolean));
		found.set(source, [...(found.get(source) ?? []), { line: i + 1, source, cite, reqs }]);
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
