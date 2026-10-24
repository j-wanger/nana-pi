// Seat title check for lane land-records (written by the seat 2026-10-24 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/land-records-2026-10-24/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/land-records.test.mjs","R-2810: a land attempt appends one start record under the main clone's git common folder before it compares the checkouts",["R-2810"]],
		["packages/nana-pack/tests/land-records.test.mjs","R-2811: each way a land ends appends one end record naming its start, with a null suite time when the suite never ran",["R-2811"]],
		["packages/nana-pack/tests/land-records.test.mjs","R-2812: a CI-passed land records the longest judged run span as its CI wait, and a run without times still lands with a null wait",["R-2812"]],
		["packages/nana-pack/tests/land-records.test.mjs","R-2813: an unwritable land ledger leaves the land's verdict, merge and output unchanged and names why in one last line",["R-2813"]],
		["packages/nana-pack/tests/land-records.test.mjs","R-2814: every ended land attempt's last line names it and its lane's land line exactly as the build report prints it",["R-2814"]],
		["packages/nana-pack/tests/build-report.test.mjs","R-2815: the build report prints each land attempt, one land line per lane and a land total, the same from any checkout",["R-2815"]],
		["packages/nana-pack/tests/land-records.test.mjs","R-2816: the ledger lists the land records as a CAP-02 deliverable read by code at the store's own path",["R-2816"]],
		["packages/nana-pack/tests/land-records.test.mjs","seal: land records live at nana/land-records.jsonl in schema 1, are read up to 32 MiB, and their line starts [nana-land] land record:",["R-2810", "R-2813", "R-2814"]],
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
