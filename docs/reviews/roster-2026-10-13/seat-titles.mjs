// Seat title check for lane roster (frozen per session; written by the seat 2026-10-13 before the build, after
// sol plan r3 LAND 9/10 and the Node-entry amendment). Run from the worktree root:
//   node docs/reviews/roster-2026-10-13/seat-titles.mjs <session>
// Titles live in several test files, so each entry is [file, title, rows]. For each entry the file must hold the
// title verbatim as a check("…") title, exactly once, with a `// req:` line directly above it naming every listed
// row. Case-helper form per file: the three existing files use `check("<title>", …)` with the title on the call's
// own line; the two new files (nana-roster, win32-launch) use the same form, optionally awaited
// (`await check("<title>", …)`), because the preamble asks for every async case to be awaited. GONE titles must not
// appear as a check title in their file. It proves the cases EXIST; the seat's pair runner later proves they bite.
// Source: CHANGE.md §5, "29 new, 2 refits, 1 renamed". acceptance.mjs does not import this file.
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

const NR = "packages/nana-pack/tests/nana-roster.test.mjs"; // new
const W32 = "packages/nana-pack/tests/win32-launch.test.mjs"; // new
const WL = "packages/nana-pack/tests/worker-lane.test.mjs";
const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";

const PLAIN = /^\s*check\(\s*"((?:[^"\\]|\\.)*)"/;
const AWAITABLE = /^\s*(?:await\s+)?check\(\s*"((?:[^"\\]|\\.)*)"/;
const FORM = { [NR]: AWAITABLE, [W32]: AWAITABLE, [WL]: PLAIN, [TR]: PLAIN, [RT]: PLAIN };

// R-291's literal is the base's leaf total plus nine. main bc84b70 (process landed, fresh-install not) totals 1,100,
// so the roster lane makes it 1,109. If fresh-install lands first the base is 1,104 and both literals below move
// (1,104 → 1,113); the seat edits them in a dated amendment, never the builder.
const TREE_BEFORE = "R-291: every real heading's committed IDs survive expansion and leaf counts total 1,100";
const TREE_AFTER = "R-291: every real heading's committed IDs survive expansion and leaf counts total 1,109";

export const REQUIRED = {
	"1": [
		// nana-roster.test.mjs (new): R-1120–R-1123, 11 titles.
		[NR, "sealed default roster is luna high builder, sol reviewer, astra land and no scout", ["R-1120"]],
		[NR, "absent user nana-pack.json yields the default roster", ["R-1120"]],
		[NR, "user nana-pack.json without a roster yields the default roster", ["R-1120"]],
		[NR, "a valid machine roster replaces every slot, keeping a null scout and a null land", ["R-1121"]],
		[NR, "a machine roster saved with a byte-order mark and CRLF line endings is read", ["R-1121"]],
		[NR, "the roster is read from PI_CODING_AGENT_DIR, not the home agent dir", ["R-1121"]],
		[NR, "a project .pi/nana-pack.json roster is never read", ["R-1121"]],
		[NR, "each invalid roster shape is refused naming the slot or field", ["R-1122"]],
		[NR, "an unreadable or malformed user nana-pack.json is refused naming the file", ["R-1122"]],
		[NR, "roster command prints one line per slot and the source", ["R-1123"]],
		[NR, "roster command prints a refused roster on stderr and exits 1", ["R-1123"]],
		// worker-lane.test.mjs: 1 refit (title kept, values by name) and 5 new.
		[WL, "lane passes only the sealed roster and fixed brief instruction", ["R-961"]],
		[WL, "lane passes the machine roster builder to pi, each flag once", ["R-961"]],
		[WL, "lane omits --thinking when the machine roster builder thinking is null", ["R-961"]],
		[WL, "lane refuses a refused roster before starting pi, naming the file", ["R-961"]],
		[WL, "lane ignores a roster in project .pi/nana-pack.json", ["R-1121"]],
		[WL, "lane prints the resolved builder and roster source on stderr before starting pi", ["R-1124"]],
		// templates-render.test.mjs: 3 new and the R-684 refit (title kept, canonical line changed).
		[TR, "shared working pattern makes the pattern the default with the machine roster", ["R-1126"]],
		[TR, "shared working pattern gives the land review to the seat when the roster sets no land model", ["R-1127"]],
		[TR, "nana-soul carries the shared default-pattern and seat land review bullets", ["R-1128"]],
		[TR, "three front doors carry one identical scoped platform claim", ["R-684"]],
		// requirements-tree.test.mjs: R-291 renamed (base plus nine).
		[RT, TREE_AFTER, ["R-291"]],
		// win32-launch.test.mjs (new): four forced-win32 titles on every leg ...
		[W32, "win32 launch runs the npm pi package's bin entry with the running node and the arguments unchanged", ["R-1125"]],
		[W32, "win32 launch starts a pi.exe directly", ["R-1125"]],
		[W32, "win32 launch refuses with a named reason when pi, its package, its bin or its entry is missing", ["R-1125"]],
		[W32, "non-win32 launch is pi by name with the arguments unchanged", ["R-1125"]],
		// ... and six Windows-leg titles (printed SKIP elsewhere).
		[W32, "Windows: lane pi-worker prints the builder line and starts the npm-installed pi entry with node and the lane argv", ["R-1125", "R-1124"]],
		[W32, "Windows: non-lane pi-worker hands pi line breaks, %, !, quotes and a trailing backslash unchanged", ["R-1125"]],
		[W32, "Windows: pi-review hands the review standard to pi as text", ["R-1125"]],
		[W32, "Windows: a busy pi is not stopped as stalled", ["R-1125"]],
		[W32, "Windows: a pi.cmd with no npm package beside it starts nothing and leaves no capture directory", ["R-1125"]],
		[W32, "Windows: lane pi-worker starts pi from a short or differently cased worktree path", ["R-1125"]],
	],
};

export const GONE = {
	"1": [
		[RT, TREE_BEFORE],
	],
};

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
		try { title = JSON.parse(`"${m[1]}"`); } catch { return; }
		const above = (lines[i - 1] ?? "").trim();
		found.set(title, [...(found.get(title) ?? []), /^\/\/\s*req:/.test(above) ? above : ""]);
	});
	return found;
}

/** One report line per entry; returns the number of bad entries. */
export function report(session, print = console.log) {
	const cache = new Map();
	const titlesIn = (file) => { if (!cache.has(file)) cache.set(file, checkTitles(file, FORM[file] ?? PLAIN)); return cache.get(file); };
	let bad = 0;
	for (const [file, title, rows] of REQUIRED[session]) {
		const found = titlesIn(file);
		if (!found) { bad++; print(`NO-FILE  ${file} — ${title}`); continue; }
		if (!found.has(title)) { bad++; print(`MISSING  ${file} — ${title}`); continue; }
		const reqs = found.get(title);
		if (reqs.length > 1) { bad++; print(`DUP      ${file} — ${title} (${reqs.length} times)`); continue; }
		const missingRows = rows.filter((r) => !new RegExp(`\\b${r}\\b`).test(reqs[0]));
		if (missingRows.length) { bad++; print(`NO-REQ   ${file} — ${title} — the line above must name ${missingRows.join(", ")} (saw ${JSON.stringify(reqs[0])})`); continue; }
		print(`ok       ${title}`);
	}
	for (const [file, title] of GONE[session] ?? []) {
		const found = titlesIn(file);
		if (found?.has(title)) { bad++; print(`NOT-GONE ${file} — ${title}`); continue; }
		print(`gone     ${title}`);
	}
	print(`seat-titles ${session}: ${bad} missing`);
	return bad;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const session = process.argv[2];
	if (!REQUIRED[session]) { console.log(`usage: seat-titles.mjs <${Object.keys(REQUIRED).join("|")}>`); process.exit(2); }
	process.exit(report(session) ? 1 : 0);
}
