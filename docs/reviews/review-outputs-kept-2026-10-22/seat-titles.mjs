// Seat title check for lane review-outputs-kept (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/review-outputs-kept-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/review-ledger.test.mjs","R-2568: a recorded round keeps its review text by hash beside the tally",["R-2568"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","R-2569: a missing or different output file at record time still records and keeps the captured verdict",["R-2569"]],
		["packages/nana-pack/tests/review-timeline.test.mjs","R-2570: the timeline reads MUST findings from the kept text after the scratch folder is deleted",["R-2570"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","R-2575: a failed store write records no round",["R-2575"]],
	],
	2: [
		["packages/nana-pack/tests/land.test.mjs","R-2571: the land refuses a revision whose matching LAND records all have missing or altered kept texts",["R-2571"]],
		["packages/nana-pack/tests/land.test.mjs","R-2572: a land's success report names the kept review texts",["R-2572"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","R-2573: keep writes each kept review text of the item into the lane folder",["R-2573"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","R-2574: keep refuses a differing file and writes nothing",["R-2574"]],
		["packages/nana-pack/tests/land.test.mjs","R-2576: a land notes each earlier kept review text missing from the tip",["R-2576"]],
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
