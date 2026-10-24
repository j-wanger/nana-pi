// Seat title check for lane report-at-land (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/report-at-land-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/runtime-land.test.mjs","R-2740: a passing land writes the product report for HEAD under the git common directory after its suite record and runtime data, and names it in one land note",["R-2740"]],
		["packages/nana-pack/tests/runtime-land.test.mjs","R-2741: filtered, tipless, wrong-tip, hand-measure and failing runs leave the earlier product report byte for byte and print no product report note",["R-2741"]],
		["packages/nana-pack/tests/runtime-land.test.mjs","R-2742: a land whose product report refuses or cannot be written prints one product report note on one line and keeps the suite's exit code",["R-2742"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2743: a machine-local artifact passes only under its own maker kind and writer path, and any other untracked artifact still gets a note",["R-2743"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2744: suite-runs shows the newest suite record in HEAD's history with its tip, time, commits and days to HEAD, or says why it cannot",["R-2744"]],
		["packages/nana-pack/tests/product-report.test.mjs","R-2745: build-records shows the newest ended build in HEAD's history with its tip, end time, commits and days to HEAD, or says why it cannot",["R-2745"]],
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
