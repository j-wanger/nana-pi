// Seat title check for lane artifact-registry (written by the seat 2026-10-24 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/artifact-registry-2026-10-24/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2780: an artifact line is read by its ID, and a reused ID, a malformed or misplaced line, or a live entry in a proposed or retired feature gets one note",["R-2780"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2781: an unknown class or a location of the wrong shape for its class gets one note",["R-2781"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2782: a tracked entry matching nothing, an untracked or non-file writer, a reasonless manual entry, or a second entry at the same location gets one note",["R-2782"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2783: a registry reference binds the claim's run and every writer, a built-from list needs only live entries, and a valid home reference gets no not-tracked note",["R-2783"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2784: this repository's ledger names every unparked deliverable's artifact or what it is built from, and keeps no plain-path artifact",["R-2784"]],
		["packages/nana-pack/tests/requirements-tree.test.mjs","R-2785: the outline lists each feature's artifact IDs, the field check catches a dropped line, and the historical outlines are unchanged",["R-2785"]],
		["packages/nana-pack/tests/requirements-moved.test.mjs","R-2786: the movement report names every artifact entry change, a writer change included, and is unchanged when no entry changed",["R-2786"]],
		["packages/nana-pack/tests/requirements-cap-kinds.test.mjs","R-2787: the lift keeps every artifact line under its feature, with no mapping and when a mapping moves the feature",["R-2787"]],
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
