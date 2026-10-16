// Seat title check for lane regroup (frozen per build; written by the seat 2026-10-15 before the build, from CHANGE.md
// §5 "Verification" T1–T23 and §2's R-291 rule, plan frozen at 1066464). Run from anywhere inside the checkout under
// test (the files are read from the cwd's git root):
//   node docs/reviews/regroup-2026-10-15/seat-titles.mjs <build>
// Each entry is [file, title, rows]. A title is the string the test PRINTS; every §5 title here is a plain literal (no
// render loop prints these), so the builder writes each one once. For each entry the file must hold exactly one
// check(…) call that prints the title, with the title on the call's own line, and `// req:` lines directly above it
// (stacked lines merge, as the rail reads them) naming every listed row. GONE titles must not appear. It proves the
// cases EXIST; acceptance.mjs checks that each one prints PASS, and the seat's mutation runner later proves they bite.
// acceptance.mjs imports this file (the one title list); no suite test may import or run it. Writes nothing.
// Before the land only: after it, `git merge-base main HEAD` is the tip itself and R-291's base total moves with it.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const LT = "packages/nana-pack/tests/requirements-lift.test.mjs";
export const RG = "packages/nana-pack/tests/requirements-regroup.test.mjs";
export const TR = "packages/nana-pack/tests/templates-render.test.mjs";
export const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";
export const FILES = [LT, RG, TR, RT];

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

// R-291's title carries the tree's leaf total. The lane adds twelve rows (R-1170 to R-1180 and R-1184), so the title
// moves from the base's total to base + 12 (CHANGE §2: 1,136 → 1,148 at e451c90). The base total is READ from the
// merge base's requirements-tree test, never hard-coded, so a merge of a newer main moves both literals with it.
const TREE_PREFIX = "R-291: every real heading's committed IDs survive expansion and leaf counts total ";
export const LANE_ROWS_ADDED = 12; // CHANGE §2: R-1170 to R-1180 and R-1184 added; no row reworded or retired
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
			// requirements-lift.test.mjs (§5).
			row(LT, "R-1170: on a flat ledger whose two sections share one heading text, a mapping's dry run prints each named heading's line, text and node, and each row move by old line with its row IDs", ["R-1170"]), // T1
			// requirements-regroup.test.mjs (§5, in its order).
			row(RG, "R-1171: a passing proposal writes the review page, and one the lift's dry run refuses writes no page and names the lift's problem", ["R-1171"]), // T2
			row(RG, "R-1171: run through a symlink to the script, the command still writes its page", ["R-1171"]), // T3 (skipped on win32)
			row(RG, "R-1171: an --out naming the ledger or the proposal is refused and leaves that file byte-identical", ["R-1171"]), // T19
			row(RG, "R-1171: an --out that is a symlink to the proposal is refused and leaves the proposal byte-identical", ["R-1171"]), // T20 (skipped on win32)
			row(RG, "R-1171: a failing run removes an earlier review page at --out and leaves a file there that is not a review page unchanged", ["R-1171"]), // T21
			row(RG, 'R-1172: a node outside the reserved general-engineering nodes that keeps a "Not yet sorted:" purpose or outcome is refused', ["R-1172"]), // T4
			row(RG, "R-1173: each line the lift reports needs exactly one reason by old line and node, a missing, repeated or stale reason is refused, and two same-text headings are reasoned apart", ["R-1173"]), // T5
			row(RG, "R-1174: a proposed feature with no evidence path, a missing path or a path leaving the root is refused, and an existing path written with backslashes passes", ["R-1174"]), // T6
			row(RG, "R-1175: a review record missing a row, repeating one, naming a stale home, an unknown verdict or target, an empty reason or a target without its own reason is refused", ["R-1175"]), // T7
			row(RG, "R-1175: each move or share target needs exactly one outcome keyed by row and target, so a share carried to one feature and refuted for another passes, and a target left unresolved or resolved twice is refused", ["R-1175"]), // T8
			row(RG, "R-1175: a record whose drafter and reviewer share a lineage is refused unless it declares same-family", ["R-1175"]), // T9
			row(RG, "R-1176: a text-placed row without a placed reason, or a placed reason for a row with local evidence, is refused", ["R-1176"]), // T10
			row(RG, "R-1177: a proposal with more problems than the cap prints at most the problem-line cap and the count of the rest", ["R-1177"]), // T11
			row(RG, "R-1177 fixture: a run missing --root, --proposal or --out exits 2 with usage", ["R-1177"]), // T12
			row(RG, "R-1177: a misspelled key in any object level of a proposal is refused naming its path, and so is a question without a recommendation", ["R-1177"]), // T13 (18 levels)
			row(RG, "R-1178: the page opens with both hashes, the proof line, the lineages and the placement and claim verdict counts, then the numbered questions, the feature table with status mix, and every node with its purpose and each proposed feature's evidence", ["R-1178"]), // T14
			row(RG, 'R-1178: a same-family record reads "same-family review" on the page and never "another lineage"', ["R-1178"]), // T15
			row(RG, "R-1179: the page lists each reported line with its reason and rows, each move and share target with its own outcome, each rejected claim with its reason, each text-placed row with its reason, and every row only in the appendix after them", ["R-1179"]), // T16
			row(RG, "R-1184: each purpose and outcome outside the reserved nodes and each reported line's reason needs exactly one accept or reject verdict with a reason and the claim's current text, a missing, repeated, stale or reasonless one is refused, and a reserved node needs none", ["R-1184"]), // T22
			row(RG, "R-1184: a rejected claim named in no question is refused, and one named in a question passes", ["R-1184"]), // T23
			// templates-render.test.mjs, beside checkRequirementsSkillTreeText (§4, :454-499).
			row(TR, "requirements skill's regroup paragraph names the regroup check, what the agent reads, a review of every placement and every purpose, outcome and section reason, the owner's yes before --write, --verify with --mapping and gaps as proposed features, and only flags the regroup has", ["R-1180"]), // T17
			// requirements-tree.test.mjs: R-291 renamed (base total plus twelve).
			...(tree.error ? [] : [row(RT, tree.after, ["R-291"])]), // T18
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
