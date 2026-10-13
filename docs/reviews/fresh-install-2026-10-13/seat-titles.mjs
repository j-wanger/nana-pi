// Seat title check for lane fresh-install (frozen per session; written by the seat 2026-10-13 before the build,
// after the plan review). Run from the worktree root:
//   node docs/reviews/fresh-install-2026-10-13/seat-titles.mjs <session>
// Titles live in several test files, so each entry is [file, title, rows]. For each entry the file must hold the
// title verbatim as a check("…") title, exactly once, with a `// req:` line directly above it naming every listed
// row. Every target file uses the same case-helper call form, `check("<title>", …)` on one line. GONE titles
// must not appear as a check title in their file. It proves the cases EXIST; the seat's mutation runner later
// proves they bite. acceptance.mjs imports REQUIRED and GONE; running this file directly prints the report.
import * as fs from "node:fs";
import { pathToFileURL } from "node:url";

const PIN = "packages/nana-setup/tests/pi-install-pin.test.mjs";
const BENCH = "apps/bench/test/usage.test.mjs";
const IC = "packages/nana-setup/tests/install-check.test.mjs";
const CIW = "packages/nana-pack/tests/ci-workflow.test.mjs";
const FRESH = "packages/nana-setup/tests/fresh-machine.test.mjs";
const TREE = "packages/nana-pack/tests/requirements-tree.test.mjs";
const DOCTOR = "packages/nana-setup/tests/doctor-runtime.test.mjs";

export const REQUIRED = {
	"1": [
		// CHANGE §5, T1–T6: the new pin test file.
		[PIN, "every README pi install command carries CI's PI_VERSION and an unquoted PI_BEFORE", ["R-1093"]],
		[PIN, "the missing-pi hint carries CI's PI_VERSION and an unquoted PI_BEFORE", ["R-1093"]],
		[PIN, "pi pin reads PI_VERSION and PI_BEFORE from the workflow env with LF or CRLF line ends", ["R-1093"]],
		[PIN, "the missing-pi hint is built from the checkout's CI workflow by pi-pin", ["R-1093", "R-1094"]],
		[PIN, "an unreadable or incomplete workflow gives a placeholder hint, never an empty cutoff", ["R-1094"]],
		[PIN, "pin R-1093: the CI workflow path pi-pin reads", ["R-1093"]],
		// Plan review MUST (seat-named, new): the reader takes only R-1091's shape and a valid instant. Its own
		// title, because a parseable but malformed cutoff is neither unreadable nor incomplete (T5's title).
		[PIN, "a cutoff with a space, a shell metacharacter or a rollover date gives a placeholder hint", ["R-1094"]],
		// T7: after the BENCH_PI_ROOT case, reusing `threw`; the title starts with U+2026 like its neighbours.
		[BENCH, "…and its fix line carries CI's PI_VERSION and an unquoted PI_BEFORE", ["R-1095"]],
		// T8–T16.
		[IC, "install: an install that exits non-zero prints FAIL install with its exit status", ["R-1071"]],
		[IC, "pi session: a get_commands response without reload-runtime prints FAIL pi session", ["R-1079"]],
		[IC, "pi session: a journal without a directory_unadopted line for the fixture project prints FAIL pi session", ["R-1079"]],
		[IC, "dispatch: on win32 Git Bash discovery reads the path variable under any letter case and uses the injected exists", ["R-1075"]],
		[IC, "diagnostics: a run with a FAIL line prints the settings hooks block and the last pull.log record after the result lines", ["R-1096"]],
		[IC, "diagnostics: missing settings and pull.log files print could-not-be-read lines with their error codes", ["R-1096"]],
		[IC, "diagnostics: malformed settings print the error name and an empty pull.log prints none", ["R-1096"]],
		[IC, "pin R-1096: the pull.log path under the temporary home", ["R-1096"]],
		[IC, "pin R-1081: the doctor note list", ["R-1081"]],
		// T17 (rename, body unchanged) and T18.
		[CIW, "install check is a blocking macOS and Windows job", ["R-1078"]],
		[CIW, "install check job runs in bash and checks pi's version after the pinned install and before the check", ["R-1078"]],
		// T19 (title kept, pi clause edited) and T20 (rename).
		[FRESH, "checklist versions match Node, pi CI and pi-subagents sources", ["R-951"]],
		[TREE, "R-291: every real heading's committed IDs survive expansion and leaf counts total 1,092", ["R-291"]],
		// Plan review NOTE: the two existing R-1037 tests of the shared hint gain R-1093 in their markers.
		[DOCTOR, "missing pi names the shared install hint", ["R-1037", "R-1093"]],
		[DOCTOR, "install missing-pi detail imports the same hint and never reaches install", ["R-1037", "R-1093"]],
	],
};

export const GONE = {
	"1": [
		[CIW, "install check is a blocking macOS and Windows job before suite"],
		[TREE, "R-291: every real heading's committed IDs survive expansion and leaf counts total 1,088"],
	],
};

/** Map title → array of `// req:` lines (one per occurrence; "" when the line above is not a marker). */
export function checkTitles(file) {
	let text;
	try { text = fs.readFileSync(file, "utf8"); } catch { return null; }
	const lines = text.split(/\r?\n/);
	const found = new Map();
	lines.forEach((line, i) => {
		const m = /^\s*check\(\s*"((?:[^"\\]|\\.)*)"/.exec(line);
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
	const titlesIn = (file) => { if (!cache.has(file)) cache.set(file, checkTitles(file)); return cache.get(file); };
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
