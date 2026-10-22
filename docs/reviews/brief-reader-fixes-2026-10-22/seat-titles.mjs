// Seat title check for lane brief-reader-fixes (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/brief-reader-fixes-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2616: a numbered step list straight after a plain Precedent list is not read as entries",["R-2616"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2617: a bold Precedent label line starts the Precedent section",["R-2617"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2618: a brief with no Precedent section is told the label stands on a line of its own",["R-2618"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2619: bold and punctuated Precedent paths are checked as the bare path",["R-2619"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2620: a heading such as Precedent audit is not read as the Precedent section",["R-2620"]],
		["packages/nana-pack/tests/brief-check.test.mjs","R-2621: brief-check names the brief path it tried and the base a relative brief resolves from",["R-2621"]],
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
