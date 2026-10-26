// Seat title check for lane page-detail (written by the seat 2026-10-25 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/page-detail-2026-10-25/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/product-detail.test.mjs","R-2930: a Product view deliverable is one line with its code marks, its readable reader kinds in claim order and its parked state, and no claim or artifact line",["R-2930"]],
		["packages/nana-pack/tests/product-detail.test.mjs","R-2931: a Product view deliverable line ends with the largest day count of the artifacts it names, or why it has none",["R-2931"]],
		["packages/nana-pack/tests/product-detail.test.mjs","R-2932: a feature's detail view shows a Deliverables block per deliverable it homes in Product view order, then its Registered artifacts, before its requirement rows",["R-2932"]],
		["packages/nana-pack/tests/product-detail.test.mjs","R-2933: the tree checker accepts a Reads line that names an entry a later capability registers",["R-2933"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2542: a deliverable lists its own capability's maker and reader claims in ledger order with the checker's code marks, and no consumers",["R-2542"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2642: a deliverable's block on its home feature's detail view lists its Parked line among its claims in ledger order",["R-2642"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2790: each deliverable shows its named artifacts with their ages, what its output is built from, or that no artifact is written down",["R-2790"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2791: an unageable entry shows age not measured with its class, and the page is the same whatever the stores and refs hold",["R-2791"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2792: a tracked entry shows the age of the last commit that changed a file it matches",["R-2792"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2799: each maker feature's detail view shows a card per live entry it registers with its class, location, age, run, reading features and deliverables, and the Artifacts view shows none",["R-2799"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2801: the artifacts view lists the artifacts no other feature reads and the ones code reads but no nana run makes",["R-2801"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2544: an artifact shows the commits, days, short hash and subject of its last change as git counts them, or why its age is unknown",["R-2544"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2545: the runtime map shows its own tip, time and uncommitted files with commits and days to HEAD, or says why it cannot",["R-2545"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2744: suite-runs shows the newest suite record in HEAD's history with its tip, time, commits and days to HEAD, or says why it cannot",["R-2744"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2745: build-records shows the newest ended build in HEAD's history with its tip, end time, commits and days to HEAD, or says why it cannot",["R-2745"]],
		["packages/nana-pack/tests/product-report.test.mjs","assessment lists render separate text-only list items",["R-1041"]],
		["packages/nana-pack/tests/product-report.test.mjs","renderer inserts all dynamic strings only through text nodes",["R-1019"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-1511: cited test files link in a new tab to their GitHub page at the report's commit for each GitHub origin spelling, and nothing links otherwise",["R-1511"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-1513: a recorded label is marked changed when the test file or a file it ran changed or is gone since the run, and unmarked otherwise",["R-1513"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-1515: a row citing no test in this repository says so, and a row citing one does not",["R-1515"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2922: Broken names the violated rows and the implemented rows that did not pass, split into failed and skipped only, beside the rows with no recorded run and the runtime data's tip",["R-2922"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2923: Gaps names the unparked deliverables code does not make and read and the artifacts with no declared reader, each beside its parked count, and counts the checker's notes",["R-2923"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2924: Stale counts live features' out-of-date and unassessed assessments, and artifacts older than the stale age before HEAD's commit time, beside the not-measured and unknown counts",["R-2924"]],
	],
};
const want = process.argv[2] ?? "all";
const lists = want === "all" ? Object.values(SESSIONS).flat() : SESSIONS[want];
if (!lists) { console.error(`unknown session ${want}; known: ${Object.keys(SESSIONS).join(", ")}, all`); process.exit(2); }
let missing = 0;
for (const [file, title, rows] of lists) {
	const abs = path.resolve(file);
	if (!fs.existsSync(abs)) { console.log(`MISSING ${file} :: ${title} (no file)`); missing++; continue; }
	const lines = fs.readFileSync(abs, "utf8").split(/\r?\n/);
	const hits = [];
	lines.forEach((line, i) => { const m = CALL.exec(line); if (m && m[2] === title) hits.push(i); });
	if (hits.length !== 1) { console.log(`MISSING ${file} :: ${title} (${hits.length} calls with this exact title)`); missing++; continue; }
	const ids = new Set();
	for (let i = hits[0] - 1; i >= 0; i--) { const m = MARKER.exec(lines[i]); if (!m) break; for (const id of m[1].split(/[\s,]+/).filter(Boolean)) ids.add(id); }
	const absent = rows.filter((r) => !ids.has(r));
	if (absent.length) { console.log(`MISSING ${file} :: ${title} (req marker lacks ${absent.join(", ")})`); missing++; continue; }
	console.log(`OK ${file} :: ${title}`);
}
console.log(`${missing} missing`);
process.exit(missing ? 1 : 0);
