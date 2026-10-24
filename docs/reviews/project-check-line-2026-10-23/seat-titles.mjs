// Seat title check for lane project-check-line (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/project-check-line-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-setup/tests/project-stale.test.mjs","R-2760: a repository with neither an objective file nor a nana working-region marker gets no project line in either seat, whatever its check fails",["R-2760"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2761: an adopted project missing frontier seeds gets one project line naming each missing row in the check's order, in both seats",["R-2761"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2762: the project line names exactly the file rows project --check marks ✗",["R-2762"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2763: rows the check leaves to the owner are named as fixes by hand with the check command, and the line carries nothing read from the entry",["R-2763"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2764: no repository, a linked worktree, a nana-pi checkout and a dismissed root get no project line even with every seed missing",["R-2764"]],
		["packages/nana-setup/tests/project-stale.test.mjs","R-2765: an unreadable, invalid UTF-8 or over-cap AGENTS.md leaves the working section out and the other failing rows in",["R-2765"]],
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
