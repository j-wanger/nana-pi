// Seat title check for lane runtime-map (frozen per build; written by the seat 2026-10-17 before the build, from
// must-meet.md, the feature-first cut that replaces CHANGE.md's 30 rows and 32 titles with nine must-meet tests).
// Run from anywhere inside the checkout under test (the files are read from the cwd's git root):
//   node docs/reviews/runtime-map-2026-10-17/seat-titles.mjs <build>
// Two kinds of entry:
//   TITLE  [file, title, rows]: the file holds exactly one check(…) (or test(…)/it(…)) call that prints the title, with the
//          title on the call's own line, and the stacked `// req:` lines directly above it name every listed row.
//          The nine must-meet titles MM1-MM9, and R-291's leaf-total title renamed to the base total plus nine.
//   GONE   [file, title]: R-291's base title is no longer printed.
// MM8 prints SKIP on a Windows host by design; on macOS every title runs. It proves the cases EXIST; the seat's suite
// run proves they pass. No suite test may import or run this file. Writes nothing.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const TR = "packages/nana-pack/tests/test-runner.test.mjs"; // changed: MM1
export const RM = "packages/nana-pack/tests/runtime-map.test.mjs"; // new: MM2-MM9
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

// R-291's title carries the tree's leaf total: this lane adds nine rows (must-meet.md) to whatever main holds at its base. The base total is READ from the merge base's
// requirements-tree test, never hard-coded, so a merge of a newer main (the mutate-runner lane lands first) moves both
// literals with it.
const TREE_PREFIX = "R-291: every real heading's committed IDs survive expansion and leaf counts total ";
export const LANE_ROWS_ADDED = 9;
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
			// packages/nana-pack/tests/test-runner.test.mjs: MM1 (the land gate's runner with the knob unset).
			row(TR, "R-1270: with the coverage knob unset, the runner prints no knob line, writes no record or completion file, and passes the caller's NODE_V8_COVERAGE and NODE_OPTIONS unchanged, absent or set", ["R-1270"]), // MM1
			// packages/nana-pack/tests/runtime-map.test.mjs (new): MM2-MM9.
			row(RM, "R-1271: a fixture measurement credits each test file with the tracked files it ran, a node child's files included when the child's environment lacks the coverage variable, with the file's label and seconds, and credits no untracked file", ["R-1271"]), // MM2
			row(RM, "R-1272: with runtime data, impact prints the generator's output byte for byte, then the measured test files that ran each named file longest first with seconds and a FAIL label, a zero line for a file no test ran, and the not-counted closing line", ["R-1272"]), // MM3
			row(RM, "R-1273: with no runtime data, impact prints one note naming npm run map:measure after the generator's output and exits with the generator's code", ["R-1273"]), // MM4
			row(RM, "R-1274: impact marks the whole runtime section stale after a tracked file is changed, added or removed, a section with no measured test included", ["R-1274"]), // MM5
			row(RM, "R-1275: a run with no completion record, or with a count that differs from the records read, leaves the earlier runtime data byte for byte unchanged and exits non-zero", ["R-1275"]), // MM6
			row(RM, "R-1276: the map check's output and exit code are the same with no runtime data, valid data and garbage data", ["R-1276"]), // MM7
			row(RM, "R-1277: off Windows, SIGINT or SIGTERM sent twice to the measure command while a fake three-level suite runs ends the whole tree within the stop wait, removes the coverage folder, leaves the caller alive and exits non-zero", ["R-1277"]), // MM8
			row(RM, "R-1278: run from a linked worktree with no override, the real measure command writes nana/runtime-map.json under the git common directory and impact in the main checkout reads it", ["R-1278"]), // MM9
			// R-291 renamed (base total plus 9).
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
