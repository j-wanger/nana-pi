// Seat title check for lane page-overview (written by the seat 2026-10-25 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/page-overview-2026-10-25/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/product-overview.test.mjs","R-2920: the overview is the landing view and first tab, unknown and #shared hashes render it, and its five blocks come in order with links to their views",["R-2920"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2921: Needs you counts asks as blocking, optional and parked, lists each blocking ask's title in file order, and counts the open questions the Decisions view lists",["R-2921"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2922: Broken names the violated rows and the implemented rows that did not pass, split into failed and skipped only, beside the rows with no recorded run and the runtime data's tip",["R-2922"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2923: Gaps names the unparked deliverables code does not make and read and the artifacts with no declared reader, each beside its parked count, and counts the checker's notes",["R-2923"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2924: Stale counts live features' out-of-date and unassessed assessments, and artifacts older than the stale age before HEAD's commit time, beside the not-measured and unknown counts",["R-2924"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2925: What it does shows the checker's count line and one line per live product stage whose counts add up to it",["R-2925"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2927: with no runtime data, no artifact registry or no deliverable lines, each overview line that reads it names the missing input in place of a count",["R-2927"]],
		["packages/nana-pack/tests/product-overview.test.mjs","R-2794: a capability card whose list has no item shows its label with none and no empty list",["R-2794"]],
		["packages/nana-pack/tests/product-overview.test.mjs","seal: the overview's stale age is 30 days",["R-2924"]],
		["packages/nana-pack/tests/product-report.test.mjs","unknown prototype hashes render the Overview",["R-1019"]],
		["packages/nana-pack/tests/product-report.test.mjs","renderer inserts all dynamic strings only through text nodes",["R-1019"]],
		["packages/nana-pack/tests/product-report.test.mjs","feature IDs link to their detail views in product, features, overview and detail views",["R-1015"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-1570: the Decisions view lists every open question with its number and full text in file order",["R-1570"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-1571: a ledger with no open questions heading, or none under it, still writes the page and says none are recorded",["R-1571"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2642: the Product view lists a deliverable's Parked line among its claims in ledger order",["R-2642"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2794: each capability card lists its features with no deliverable and their artifacts, never as a deliverable note",["R-2794"]],
		["packages/nana-pack/tests/requirements-tree.test.mjs","R-2639: a parked deliverable leaves the count's total once and the line names the parked row count in every mode",["R-2639"]],
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
