// Seat title check for lane precedent-first (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/precedent-first-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2578: a lane brief with no Precedent section, an empty one or a reasonless none is refused before the lock and before pi starts",["R-2578"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2579: Precedent entries not tracked at HEAD are refused, each one named",["R-2579"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2580: honest Precedent forms pass and the launch line names the checked entry count",["R-2580"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2581: the named feature's known-bug file follows the brief as the third prompt, and nothing follows when the feature has none",["R-2581"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","seal: a brief's precedent section is Precedent, its no-precedent entry starts none: and its feature line starts Feature:",["R-2578","R-2581"]],
	],
	2: [
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2582: the builder preamble tells the builder to read its Precedent files first, follow their pattern and report each departure",["R-2582"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2583: the builder preamble frames the attached known bugs as context to report, not to fix",["R-2583"]],
		["packages/nana-pack/tests/templates-render.test.mjs","R-2584: the shared working pattern's Plans bullet requires every plan to name its precedent",["R-2584"]],
		["packages/nana-pack/tests/brief-check.test.mjs","R-2585: brief-check prints what pi-worker would print for the same brief and starts nothing",["R-2585"]],
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
