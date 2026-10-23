// Seat title check for lane objective-hook-win (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/objective-hook-win-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-setup/tests/hook-deadlines.test.mjs","R-2671: the objective and adoption hooks print a producer's output when it takes 1.7 seconds, and the next producer's output after it, also when the hook starts 2.5 seconds late",["R-2671"]],
		["packages/nana-setup/tests/hook-deadlines.test.mjs","R-2672: the objective and adoption hooks print both markers before their installed limit when they start 2.5 seconds late and both producers hang",["R-2672"]],
		["packages/nana-setup/tests/hook-producers.test.mjs","R-2673: with no whole millisecond left before the deadline, the launcher prints the marker and starts no producer",["R-2673"]],
		["packages/nana-setup/tests/hook-producers.test.mjs","R-2674: each producer's limit is the cap, or the whole milliseconds left before the deadline when fewer, and the cap when no deadline is given",["R-2674"]],
		["packages/nana-setup/tests/hook-producers.test.mjs","seal: the producer cap is 2,500 ms and the hook deadline 4,000 ms, 1,000 ms under the installed limit",["R-2674", "R-2672"]],
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
