// Seat title check for lane deliverable-fields (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/deliverable-fields-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/requirements-deliverables.test.mjs", "a manual maker or a rule or person reader with no reason gets one note naming the row", ["R-2535"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs", "a maker or reader path not tracked at HEAD gets one note naming the row and the path", ["R-2536"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs", "a missing or unreadable line, or an automatic claim with no code path, gets one note naming it", ["R-2537"]],
		["packages/nana-pack/tests/requirements-tree.test.mjs", "the tree checker prints deliverable notes in every mode and keeps its exit status and outline", ["R-2538"]],
		["packages/nana-pack/tests/requirements-moved.test.mjs", "the movement report lists a row whose Made by or Read by lines changed", ["R-2540"]],
	],
	2: [
		["packages/nana-pack/tests/requirements-deliverables.test.mjs", "a manual maker or a rule or person reader with no reason gets one note naming the row", ["R-2535"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs", "a maker or reader path not tracked at HEAD gets one note naming the row and the path", ["R-2536"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs", "a missing or unreadable line, or an automatic claim with no code path, gets one note naming it", ["R-2537"]],
		["packages/nana-pack/tests/requirements-tree.test.mjs", "the tree checker prints deliverable notes in every mode and keeps its exit status and outline", ["R-2538"]],
		["packages/nana-pack/tests/requirements-moved.test.mjs", "the movement report lists a row whose Made by or Read by lines changed", ["R-2540"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs", "every deliverable in this repository's ledger has a Made by and a Read by line", ["R-2539"]],
		["packages/nana-pack/tests/requirements-tree.test.mjs", "the tree checker counts the deliverables made and read by code in every mode", ["R-2541"]],
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
