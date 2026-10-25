// Seat title check for lane artifact-readers (written by the seat 2026-10-25 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/artifact-readers-2026-10-25/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2830: an artifact Read by line reads its own feature's entry, and a malformed, foreign, unknown, untracked, reasonless, repeated or misplaced line gets one note",["R-2830"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2831: a runtime reader needs a reason on both Read by forms and never counts as code",["R-2831"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2832: an artifact park needs its own unread entry, a since date and a reason, and a park of a read entry parks nothing",["R-2832"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2833: a reader path whose file name is a test file gets one note on every reader form, and a harness file in a tests folder gets none",["R-2833"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","R-2834: the shared consumer predicate gives each entry its reader kinds, and an entry with none and no park gets one note",["R-2834"]],
		["packages/nana-pack/tests/requirements-deliverables.test.mjs","seal: the test-reader glob and the no-declared-reader note read as sealed",["R-2833", "R-2834"]],
		["packages/nana-pack/tests/requirements-moved.test.mjs","R-2837: the movement report lists each added, removed or changed artifact Read by and Parked line",["R-2837"]],
		["packages/nana-pack/tests/requirements-cap-kinds.test.mjs","R-2787: the lift keeps every Artifact:, Reads:, Read by: and Parked: line under its feature, with no mapping and when a mapping moves the feature",["R-2787"]],
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
