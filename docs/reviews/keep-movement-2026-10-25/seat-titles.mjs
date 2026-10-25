// Seat title check for lane keep-movement (written by the seat 2026-10-25 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/keep-movement-2026-10-25/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/keep-movement.test.mjs","R-2910: keep writes the tree movement section for the repository's HEAD against main into the lane folder, names it in its count line, and replaces it on the next keep",["R-2910"]],
		["packages/nana-pack/tests/keep-movement.test.mjs","R-2911: keep writes no tree movement file and says nothing about it for a repository with no committed ledger",["R-2911"]],
		["packages/nana-pack/tests/keep-movement.test.mjs","R-2912: a movement that cannot be computed or written leaves no movement section and one warning with its reason, while keep still keeps the review texts and exits 0",["R-2912"]],
		["packages/nana-pack/tests/keep-movement.test.mjs","R-2913: with no kept review text, keep exits 0 when it writes the tree movement file and 1 when it does not",["R-2913"]],
		["packages/nana-pack/tests/keep-movement.test.mjs","R-2574: in a repository with a committed ledger, keep refuses a differing review text and writes no tree movement file",["R-2574"]],
		["packages/nana-pack/tests/keep-movement.test.mjs","seal: review-ledger keep names the lane folder's tree movement file tree-movement.md",["R-2910", "R-2911", "R-2912", "R-2913"]],
		["packages/nana-pack/tests/review-movement.test.mjs","R-2905: the ledger lists the tree movement report as a CAP-07 deliverable made by the review launchers, read in the reviewer's prompt and pointed to by the seat's land report",["R-2905"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","R-2573: keep writes each kept review text of the item into the lane folder",["R-2573"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","R-2574: keep refuses a differing file and writes nothing",["R-2574"]],
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
