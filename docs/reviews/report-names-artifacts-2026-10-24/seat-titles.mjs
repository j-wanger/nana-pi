// Seat title check for lane report-names-artifacts (written by the seat 2026-10-24 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/report-names-artifacts-2026-10-24/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/product-report.test.mjs","R-2790: each deliverable shows its named artifacts with their ages, what its output is built from, or that no artifact is written down",["R-2790"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2791: an unageable entry shows age not measured with its class, and the page is the same whatever the stores and refs hold",["R-2791"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2792: a tracked entry shows the age of the last commit that changed a file it matches",["R-2792"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2793: a clone-store entry is bound to the age table's run and writer, and the table keys come from the store constants",["R-2793"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2794: each capability card lists its features with no deliverable and their artifacts, never as a deliverable note",["R-2794"]],
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
