// Seat title check for lane mutate-runner (frozen per build; written by the seat 2026-10-17 before the build, from
// CHANGE.md §5.1 "New checks (26 titles)" and §5.2 "Census of existing checks that change", as seat revision 5 leaves
// them). Run from anywhere inside the checkout under test (the files are read from the cwd's git root):
//   node docs/reviews/mutate-runner-2026-10-17/seat-titles.mjs <build>
// Two kinds of entry:
//   TITLE  [file, title, rows]: the file holds exactly one check(…) (or test(…)/it(…)) call that prints the title, with the
//          title on the call's own line, and the stacked `// req:` lines directly above it name every listed row.
//          §5.1's 26 titles (M1 to M26), all in the new packages/nana-pack/tests/mutation-runner.test.mjs; and R-291's
//          leaf-total title renamed to the base total plus §2's 15 rows (§5.2's one renamed title).
//   GONE   [file, title]: the old name of each renamed title (R-291's base title) is no longer printed.
// A title in a file that does not exist yet reads MISSING, like one the file does not hold. It proves the cases EXIST;
// the seat's old-form mutation runner later proves they bite. No suite test may import or run this file. Writes nothing.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const MR = "packages/nana-pack/tests/mutation-runner.test.mjs"; // new
export const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";

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

// R-291's title carries the tree's leaf total. CHANGE §2: "15 rows added, none on main reworded or retired" and "the
// base's total plus 15 (1,193; main 61c5748 still holds 1,178)". The base total is READ from the merge base's
// requirements-tree test, never hard-coded, so a merge of a newer main moves both literals with it.
const TREE_PREFIX = "R-291: every real heading's committed IDs survive expansion and leaf counts total ";
export const LANE_ROWS_ADDED = 15;
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
			// packages/nana-pack/tests/mutation-runner.test.mjs (new): M1–M26.
			row(MR, "mutation runner: a pair's edit lands only in a scratch worktree under the temp folder with the lane repository's git hooks not run, the source checkout stays unchanged, and the next pair in that worktree sees neither the edit nor an untracked or ignored file the test left", ["R-1230"]), // M1
			row(MR, "mutation runner: a scratch path that is not its own git root is refused before any reset or clean, and an untracked file in the repository around it survives", ["R-1230"]), // M2
			row(MR, "mutation runner: after a run at one shard and at three, and after one whose shard is killed outright, no running test file, scratch folder or git worktree entry is left, and with SEAT_MUTATE_KEEP=1 every scratch worktree is left and its path printed", ["R-1231"]), // M3
			row(MR, "mutation runner: SIGTERM during a two-shard run kills every running test file's process tree, leaves no scratch worktree and exits non-zero", ["R-1231"]), // M4
			row(MR, "mutation runner: each test file runs as node --experimental-strip-types from its package folder with its own fresh HOME, USERPROFILE, TMPDIR, TEMP and TMP, no ambient NANA_ or SEAT_MUTATE_ variable or PI_CODING_AGENT_DIR, its NANA_TEST_ variables, and gc.auto 0 after the caller's GIT_CONFIG entries", ["R-1232"]), // M5
			row(MR, "mutation runner: npm's prefix, global config and user config fill only values the caller lacks, the prefix fills a missing global prefix, and an npm that cannot start prints one line naming each value not read", ["R-1232"]), // M6
			row(MR, "mutation runner: a test file past its time limit has its whole process tree killed and is reported timed out", ["R-1233"]), // M7
			row(MR, "mutation runner: a child that a test file leaves running after a normal exit is gone when the file's result returns", ["R-1234"]), // M8
			row(MR, "mutation runner: after a test file exits, a descendant holding its output delays the result by at most the drain", ["R-1234"]), // M9
			row(MR, "mutation runner: an anchor that occurs twice or not at all, or an edit file that does not exist, is ANCHOR-MISS naming the file, runs no test file, and the run exits 3", ["R-1235"]), // M10
			row(MR, "mutation runner: an edit that breaks a .mjs module, or a .ts module a test reaches only through a spawned child, is SYNTAX before any test file runs, a valid .ts edit is not, and the run exits 3", ["R-1235"]), // M11
			row(MR, "mutation runner: a baseline file red once runs again and the run goes on, while one red on every attempt, or a named title with no matching baseline PASS line, ends the shard with exit 2 before any pair is judged, naming it", ["R-1236"]), // M12
			row(MR, "mutation runner judge: with LF or CRLF output, detail after titles and a title given as a pattern, a pair that reds its named title is RED naming it, and a pair with no failing title is GREEN (SURVIVED)", ["R-1237"]), // M13
			row(MR, "mutation runner judge: a RED line lists a named title that stayed green, one not reached, an unnamed failing title, a crashed file and a timed-out file, and leaves a declared also-red title out of the unnamed list", ["R-1237"]), // M14
			row(MR, "mutation runner: at two shards started a stagger apart, pairs dealt round-robin run at the same time in different scratch worktrees", ["R-1238"]), // M15
			row(MR, "mutation runner: the shard count is SEAT_MUTATE_SHARDS, else the configured default, and never more than the selected pair count", ["R-1238"]), // M16
			row(MR, "mutation runner: the record holds the header, the DECLARED lines, each selected pair's line once in table order at one shard and at three, and one RESULT line summed over the shards", ["R-1239"]), // M17
			row(MR, "mutation runner: at one shard and at two, a pair whose shard dies before printing it is a MISSING line, the record still ends with one RESULT line, and the run exits 2", ["R-1239"]), // M18
			row(MR, "mutation runner: an unknown pair id, a repeated or blank table id, an id with white space, a bad shard count or stagger and a tip that names no commit each refuse with exit 2, naming it, before any worktree is created", ["R-1240"]), // M19
			row(MR, "mutation runner: sealed values: the option names, exits 2 and 3, the child's node argument, the drain, the taskkill arguments, the .ts checker command, the npm keys and the overridable tunables, and every config value has its provenance beside it", ["R-1230", "R-1231", "R-1232", "R-1233", "R-1234", "R-1235", "R-1236", "R-1238", "R-1239", "R-1240", "R-1241", "R-1243", "R-1244"]), // M20
			row(MR, "mutation runner: the dry option applies and syntax-checks every selected pair, prints DRY ok for each pair that applies, and runs no test file", ["R-1241"]), // M21
			row(MR, "mutation runner: SEAT_MUTATE_OUT names the record file, SEAT_MUTATE_TIP overrides the table's tip, and a log folder holds each red baseline run's output and each pair's output per test file named by its id with / turned into -, then --, then the file's name", ["R-1230", "R-1239", "R-1241"]), // M22
			row(MR, "mutation runner: a second run given the same record file is refused with exit 2, naming it, before it creates any worktree, the first run's record is whole and its lock gone when it ends, and a lock left by a process that no longer runs is reported and replaced", ["R-1242"]), // M23
			row(MR, "mutation runner: the record's header names the tip's commit and the pair table's hash, and a shard whose table or tip differs from the parent's refuses before creating its worktree, naming both values, so its pairs read MISSING and the run exits 2", ["R-1243"]), // M24
			row(MR, "mutation runner: an edit path that leaves the scratch worktree, by .. or through a symbolic link, is ANCHOR-MISS naming it, a test path that leaves it ends the shard with exit 2 naming it, and nothing outside the worktree is written or run", ["R-1235", "R-1236"]), // M25
			row(MR, "mutation runner: a table config that names one overridable tunable changes only that one, and a config key outside the overridable tunables is refused with exit 2, naming it, before any worktree is created", ["R-1244"]), // M26
			// §5.2: R-291 renamed (base total plus 15).
			...(tree.error ? [] : [row(RT, tree.after, ["R-291"])]),
		],
	};
	const gone = { "1": tree.error ? [] : [[RT, tree.before]] };
	return { entries: lists[build] ?? [], gone: gone[build] ?? [], treeError: tree.error ?? null, tree };
}
export const BUILDS = ["1"];

/**
 * Map title → one record per call line that prints it: { line, source, reqs }. `source` is the title as written,
 * escapes dropped; `reqs` the ids on the stacked `// req:` lines directly above. Null when the file cannot be read.
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
		const reqs = [];
		for (let k = i - 1; k >= 0 && MARKER.test(lines[k]); k--) reqs.unshift(...MARKER.exec(lines[k])[1].split(/[\s,]+/).filter(Boolean));
		found.set(source, [...(found.get(source) ?? []), { line: i + 1, source, reqs }]);
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
		if (!found) { bad++; print(`MISSING  ${file} (no such file) — ${title}`); continue; }
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
