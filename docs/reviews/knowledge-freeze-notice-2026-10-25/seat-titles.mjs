// Seat title check for lane knowledge-freeze-notice (written by the seat 2026-10-25 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/knowledge-freeze-notice-2026-10-25/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-knowledge/tests/sources-file.test.mjs","R-2860: a pull with an unparseable or unreadable sources.json prints one frozen-index notice line first, with or without pointers",["R-2860"]],
		["packages/nana-knowledge/tests/sources-file.test.mjs","R-2861: a pull with a parsing or absent sources.json prints no notice, and its own read never creates or rewrites the file",["R-2861"]],
		["packages/nana-setup/tests/doctor-knowledge.test.mjs","R-2862: doctor's knowledge sources row is ok for a parsing file, a note for an absent one and a fail naming the marker, the frozen index and a rescan command for a broken one, and never writes the file",["R-2862"]],
		["packages/nana-setup/tests/doctor-knowledge.test.mjs","R-2863: doctor's knowledge index row gives the built_at age in hours and stays ok when no build time is recorded",["R-2863"]],
		["packages/nana-knowledge/tests/sources-file.test.mjs","seal: the frozen-index clause reads \"The knowledge index is frozen until the user repairs sources.json; the next build after the repair rescans it.\"",["R-2860", "R-2862"]],
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
