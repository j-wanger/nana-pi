// Seat title check for lane roster-notice (frozen per build; written by the seat 2026-10-16 before the build, from
// CHANGE.md §5.1 "New checks (36 titles, plus 4 loop instances)" and §5.2 "Census of existing checks that change",
// plan frozen at 61b48e1 after sol plan r2 LAND). Run from anywhere inside the checkout under test (the files are read
// from the cwd's git root):
//   node docs/reviews/roster-notice-2026-10-16/seat-titles.mjs <build>
// Three kinds of entry:
//   TITLE  [file, title, rows]: the file holds exactly one check(…) (or test(…)/it(…)) call that prints the title, with the
//          title on the call's own line, and the stacked `// req:` lines directly above it name every listed row.
//          §5.1's 36 titles; §5.2's seven renamed titles under their new names; R-291's leaf-total title renamed to the
//          base total plus §2's 26 rows; and §5.2's one kept title whose marker gains a row (settings-merge
//          "POSIX desiredHooks deep-equals today's fixture" gains R-1208, the only check §5 gives that row).
//   LOOP   [file, template, name, rows]: §5.1's "Loop instances from extended lists": the check whose title source is
//          the template is printed by a `for (const x of [ … ])` loop whose literal list holds "<name>" (or, if the loop
//          reads a named list, the file holds "<name>" quoted), with the listed rows on its req: lines.
//   GONE   [file, title]: the old name of each renamed title (and R-291's base title) is no longer printed.
// The Windows-leg titles (X1, X2, the hooks-win32-exec loop instance) are checked for existence here like any other;
// they print PASS only on the Windows leg. It proves the cases EXIST; acceptance.mjs (g) checks that each macOS title
// and each macOS loop instance (its printed form, loopPrinted below) prints PASS, and the seat's mutation runner later
// proves they bite. acceptance.mjs imports this file (the one title list); no suite test may import or run it. Writes
// nothing.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const RN = "packages/nana-pack/tests/roster-notice.test.mjs"; // new
export const RH = "packages/nana-setup/tests/roster-notice-hook.test.mjs"; // new
export const IC = "packages/nana-setup/tests/install-check.test.mjs";
export const NR = "packages/nana-pack/tests/nana-roster.test.mjs";
export const WL = "packages/nana-pack/tests/worker-lane.test.mjs";
export const TR = "packages/nana-pack/tests/templates-render.test.mjs";
export const XW = "packages/nana-setup/tests/hooks-win32-exec.test.mjs"; // Windows leg only
export const SM = "packages/nana-setup/tests/settings-merge.test.mjs";
export const RC = "packages/nana-pack/tests/readme-check.test.mjs";
export const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";
export const IN = "packages/nana-setup/tests/install.test.mjs";
export const WD = "packages/nana-setup/tests/win32-degrade.test.mjs";
/** Files whose checks run only on the Windows CI leg (scripts/test.mjs SKIPS them elsewhere). */
export const WINDOWS_ONLY = [XW];

// The rail's call form (templates/typescript/template/tests/requirements-trace.ts callRegex; CALL_NAMES test, it,
// check): the title is the first quoted argument on the call's own line, in ', " or ` quotes.
const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const FOR_OF = /for\s*\(\s*const\s+\w+\s+of\s+(\[[^\]]*\]|[\w.$]+)/;

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

// R-291's title carries the tree's leaf total. CHANGE §2: "26 rows added (R-1190 to R-1215), 12 reworded, none retired
// … the lane adds 26 to whatever main holds at its base" (1,139 at 2dbc817; 1,152 once feat/regroup is in the base).
// The base total is READ from the merge base's requirements-tree test, never hard-coded, so a merge of a newer main
// moves both literals with it.
const TREE_PREFIX = "R-291: every real heading's committed IDs survive expansion and leaf counts total ";
export const LANE_ROWS_ADDED = 26;
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

// §5.2's seven renamed titles: [file, old title, new title, rows]. The new names follow the census's "renamed" column.
export const RENAMED = [
	[SM, "five active hook entries are wanted", "six active hook entries are wanted", []],
	[SM, "empty settings: all five active entries added", "empty settings: all six active entries added", []],
	[SM, "the other five are added", "the other six are added", []],
	[SM, "win32 desiredHooks: the four hook entries name packages/nana-setup/claude/hooks/", "win32 desiredHooks: the five hook entries name packages/nana-setup/claude/hooks/", ["R-1051"]],
	[SM, "forced-win32 removeInstallerHooks removes exactly the five entries", "forced-win32 removeInstallerHooks removes exactly the six entries", ["R-1050"]],
	[IC, "dispatch: the three SessionStart entries start before any of them finishes", "dispatch: every SessionStart entry starts before any of them finishes", ["R-1075"]],
	[RC, "front-door descriptions name both runtimes and all seven extensions", "front-door descriptions name both runtimes and all eight extensions", ["R-658"]],
];

export function required(build, root = repoRoot()) {
	const tree = treeTitles(root);
	const row = (file, title, ids) => [file, title, ids];
	const lists = {
		"1": [
			// packages/nana-pack/tests/roster-notice.test.mjs (new): L1–L16.
			row(RN, "roster notice: one line that starts with the prefix and names the builders, reviewer and land by model and thinking", ["R-1194"]), // L1
			row(RN, "roster notice: each entry shows its model and thinking and never its provider field, for a default, a file and a Claude Code roster and a model id that contains its provider", ["R-1195"]), // L2
			row(RN, "roster notice: sealed values — prefix, size labels, Claude Code mark, default mark, refusal head and cut, change pointer, relative-dir text, shown start sources and widget key", ["R-1194", "R-1196", "R-1197", "R-1201", "R-1202", "R-1203", "R-1206", "R-1210", "R-1215"]), // L3
			row(RN, "roster notice: a larger-lane builder is named for larger lanes before the builder for small lanes", ["R-1196"]), // L4
			row(RN, "roster notice: a Claude Code entry's model is followed by the Claude Code mark, and a pi entry's is not", ["R-1197"]), // L5
			row(RN, "roster notice: a null land reads land seat", ["R-1198"]), // L6
			row(RN, "roster notice: a scout is never named, set or null", ["R-1199"]), // L7
			row(RN, "roster notice: a lone builder carries no size label", ["R-1200"]), // L8
			row(RN, "roster notice: only the default roster is marked default, and a file roster equal to the default is not", ["R-1201"]), // L9
			row(RN, "roster notice: every refusal kind shows the problem cut before its first ' (' with no echoed value or line break, and a roster path holding ' (' stays whole", ["R-1202"]), // L10
			row(RN, "roster notice: every notice, refused ones included, ends with the change pointer and the roster file", ["R-1203"]), // L11
			row(RN, "roster notice: the roster file shows the home folder as ~ wherever it appears", ["R-1204"]), // L12
			row(RN, "extension: with a UI, startup, new, resume and fork each set exactly one widget above the editor holding only the notice, a refused roster included, and raise no notify", ["R-1210"]), // L13
			row(RN, "extension: no UI, and the reload reason, each set no widget and raise nothing", ["R-1210"]), // L14
			row(RN, "parity: the hook and the extension show the same notice for a default, a file and a refused roster", ["R-1211"]), // L15
			row(RN, "relative agent dir: the hook and the extension each show the unknown line and the change pointer, naming no lineup, for a file and a refused roster", ["R-1215"]), // L16
			// packages/nana-setup/tests/roster-notice-hook.test.mjs (new): H1–H3.
			row(RH, "roster notice hook: one JSON object with the notice as SessionStart context on every source and with no source, and exit 0", ["R-1205"]), // H1
			row(RH, "roster notice hook: the notice is a user message for startup, resume, clear and fork, for a missing or unreadable source and for an input that fails on read, and not for compact", ["R-1206"]), // H2
			row(RH, "roster notice hook: a copy that cannot load its modules prints the unavailable notice in both fields with no path, and exits 0", ["R-1207"]), // H3
			// install-check.test.mjs: I1.
			row(IC, "roster notice: plain text, two objects, a missing user message, a missing SessionStart context or the unavailable notice each fail", ["R-1209"]), // I1
			// nana-roster.test.mjs: N1–N5.
			row(NR, "a machine roster without largerBuilder reads it as null, and one with a pi or a Claude Code entry keeps it as written", ["R-1121"]), // N1
			row(NR, "each invalid largerBuilder, and a runtime field in any other slot, is refused naming the slot or field", ["R-1122"]), // N2
			row(NR, "roster command prints largerBuilder after the builder: claude-code and the model, a pi entry's three fields, or none", ["R-1123"]), // N3
			row(NR, "roster command --json prints one roster object whose roster value, set as the roster member of a file holding the installer's seed, the resolver reads back as the same roster, for the default and a file roster", ["R-1192"]), // N4
			row(NR, "roster command --json prints a refused roster on stderr with empty stdout and exits 1", ["R-1192"]), // N5
			// worker-lane.test.mjs: W1–W6.
			row(WL, "lane size larger starts pi with the larger-lane builder's provider, model and thinking, each flag once", ["R-1190", "R-961"]), // W1
			row(WL, "lane size larger with no larger-lane builder starts pi with the builder", ["R-1190"]), // W2
			row(WL, "lane size larger refuses a Claude Code larger-lane builder before lock or spawn, naming roster.largerBuilder and both ways out as the user's choice", ["R-1191"]), // W3
			row(WL, "lane size with a missing or unknown value refuses before pi spawn", ["R-960"]), // W4
			row(WL, "lane size larger prints the larger-lane builder line before starting pi", ["R-1124"]), // W5
			row(WL, "with a larger-lane builder set, a launch with no lane size, the --lane-size=larger form included, is refused before lock or spawn, naming largerBuilder and both sizes", ["R-1212"]), // W6
			// templates-render.test.mjs: T1–T3.
			row(TR, "shared working pattern sends a larger or riskier lane to the roster's larger-lane builder, a pi entry through lane size larger and a Claude Code entry as a subagent in the lane worktree", ["R-1193"]), // T1
			row(TR, "shared working pattern says a seat that cannot start the larger-lane builder stops and asks the user", ["R-1213"]), // T2
			row(TR, "shared working pattern says the builder builds every lane when the roster sets no larger-lane builder", ["R-1214"]), // T3
			// hooks-win32-exec.test.mjs (Windows leg only): X1, X2.
			row(XW, "roster notice: exit 0 within its own timeout, no module-resolution error", ["R-1058"]), // X1
			row(XW, "roster notice: one JSON object whose user message starts with the roster notice prefix", ["R-1063"]), // X2
			// §5.2: the seven renamed titles, under their new names.
			...RENAMED.map(([file, , now, rows]) => row(file, now, rows)),
			// §5.2: settings-merge's POSIX fixture check keeps its title; its marker gains R-1208 (pair 32 reds it).
			row(SM, "POSIX desiredHooks deep-equals today's fixture", ["R-1061", "R-1208"]),
			// §5.2: R-291 renamed (base total plus 26).
			...(tree.error ? [] : [row(RT, tree.after, ["R-291"])]),
		],
	};
	const loops = {
		"1": [
			// §5.1 "Loop instances from extended lists".
			[IN, "hook ${h} is a symlink into the repo", "nana-roster-notice.mjs", ["R-301", "R-985"]],
			[XW, "doctor: \"${label}\" is ✓", "settings SessionStart roster notice", ["R-1055"]],
			[WD, "win32: ${label} reports skipped (win32)", "hook nana-roster-notice.mjs", []],
			[WD, "win32: ${label} is created, not skipped", "settings SessionStart roster notice", []],
		],
	};
	const gone = { "1": [...RENAMED.map(([file, old]) => [file, old]), ...(tree.error ? [] : [[RT, tree.before]])] };
	return { entries: lists[build] ?? [], loops: loops[build] ?? [], gone: gone[build] ?? [], treeError: tree.error ?? null, tree };
}
export const BUILDS = ["1"];
/** The title a LOOP entry's instance prints: its template with the one `${…}` replaced by the listed name. */
export const loopPrinted = (template, name) => template.replace(/\$\{[^}]*\}/, name);

/**
 * Map title → one record per call line that prints it: { line, source, cite, reqs, loopList }. `source` is the title
 * as written (a template keeps its `${…}`), `cite` the rail's evidence form of it (escapes dropped, backticks removed),
 * `reqs` the ids on the stacked `// req:` lines directly above, `loopList` the for-of list text of the nearest loop
 * header within six lines above (null when none). Template titles are keyed by their source.
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
		let loopList = null;
		for (let k = i - 1; k >= Math.max(0, i - 6); k--) { const f = FOR_OF.exec(lines[k]); if (f) { loopList = f[1]; break; } }
		found.set(source, [...(found.get(source) ?? []), { line: i + 1, source, cite, reqs, loopList }]);
	});
	return found;
}

/** One report line per entry; returns the number of bad entries. */
export function report(build, print = console.log, root = repoRoot()) {
	const { entries, loops, gone, treeError } = required(build, root);
	const cache = new Map();
	const titlesIn = (file) => { if (!cache.has(file)) cache.set(file, checkTitles(path.join(root, file))); return cache.get(file); };
	const textOf = (file) => { try { return fs.readFileSync(path.join(root, file), "utf8"); } catch { return ""; } };
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
	for (const [file, template, name, rows] of loops) {
		const found = titlesIn(file);
		if (!found) { bad++; print(`NO-FILE  ${file} — ${template} [${name}]`); continue; }
		const at = found.get(template);
		if (!at) { bad++; print(`MISSING  ${file} — loop title ${template} [${name}]`); continue; }
		const quoted = `"${name}"`;
		const hit = at.filter((x) => (x.loopList?.startsWith("[") ? x.loopList.includes(quoted) : x.loopList !== null && textOf(file).includes(quoted)));
		if (hit.length !== 1) { bad++; print(`MISSING  ${file} — loop instance ${template} for ${quoted}: ${hit.length} loop(s) list it (lines ${at.map((x) => x.line).join(", ")})`); continue; }
		const missingRows = rows.filter((r) => !hit[0].reqs.includes(r));
		if (missingRows.length) { bad++; print(`NO-REQ   ${file}:${hit[0].line} — ${template} [${name}] — the req: lines above must name ${missingRows.join(", ")} (saw ${JSON.stringify(hit[0].reqs)})`); continue; }
		print(`ok       ${template} [${name}]`);
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
