// Seat title check for lane project-drift-notice (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/project-drift-notice-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-setup/tests/project-stale.test.mjs","R-2623: a session in a project whose working section differs gets one project-stale line naming nana-setup project for its root",["R-2623"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2624: no project-stale line where the region matches or nana-setup project would not refresh it, while one changed byte in the same region brings it",["R-2624"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2625: a pi session in a drifted project gets the producer's project-stale line as its section, gone after a refresh and a reload",["R-2625"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2626: reviewer and worker children get no project-stale line in either seat, and the same folder with no role does",["R-2626"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2627: deciding the project-stale line starts no child process and loads no TypeScript in either seat",["R-2627"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2628: the project-stale line appears exactly where project --check says the working region differs",["R-2628"]],
		["packages/nana-setup/tests/project-stale.test.mjs","seal: the project-stale prefix is [nana:project] PROJECT STALE: and its pi section key is nana-project-stale",["R-2623", "R-2625"]],
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
