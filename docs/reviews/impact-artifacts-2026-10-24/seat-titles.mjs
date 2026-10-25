// Seat title check for lane impact-artifacts (written by the seat 2026-10-24 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/impact-artifacts-2026-10-24/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/runtime-map.test.mjs","R-2820: impact lists each artifact a named file writes with every recorded reader and marks readers outside its import radius",["R-2820"]],
		["packages/nana-pack/tests/runtime-map.test.mjs","R-2821: impact lists each artifact a named file reads, stars those whose writer is outside its import radius and marks IDs with no live entry",["R-2821"]],
		["packages/nana-pack/tests/runtime-map.test.mjs","R-2822: impact prints the generator output, then the artifact block with its closing note, then the runtime block",["R-2822"]],
		["packages/nana-pack/tests/runtime-map.test.mjs","R-2823: an unreadable or unusable ledger or an unloadable parse gives one artifact note and keeps the impact output and exit code",["R-2823"]],
		["packages/nana-pack/tests/runtime-map.test.mjs","seal: the artifact block's heading, writes, read by, no import path, reads, star, no live entry, none, closing and note labels",["R-2820", "R-2821", "R-2822", "R-2823"]],
		["packages/nana-pack/tests/runtime-map.test.mjs","R-1272: with runtime data, impact prints the generator's output byte for byte, then the artifact block, then the measured test files that ran each named file longest first with seconds and a FAIL label, a zero line for a file no test ran, and the not-counted closing line",["R-1272"]],
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
