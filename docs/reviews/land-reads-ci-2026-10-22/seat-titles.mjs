// Seat title check for lane land-reads-ci (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/land-reads-ci-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/land.test.mjs","R-2586: a tip whose newest CI run of a workflow concluded other than success is refused before the suite",["R-2586"]],
		["packages/nana-pack/tests/land.test.mjs","R-2587: a tip with no CI run, or with a newest run still queued or running, is refused before the suite",["R-2587"]],
		["packages/nana-pack/tests/land.test.mjs","R-2588: the newest run of each workflow at its latest attempt decides, and the land names it",["R-2588"]],
		["packages/nana-pack/tests/land.test.mjs","R-2589: a CI read that cannot complete refuses before the suite and names the cause",["R-2589"]],
		["packages/nana-pack/tests/land.test.mjs","R-2590: a repository or tip without GitHub CI skips the CI read and notes why",["R-2590"]],
		["packages/nana-pack/tests/land.test.mjs","R-2591: the CI read asks github.com for the full tip SHA in origin's repository",["R-2591"]],
		["packages/nana-pack/tests/land.test.mjs","R-2592: the pack README and the shared Land checklist say a land waits for the tip's CI",["R-2592"]],
		["packages/nana-pack/tests/land.test.mjs","seal: the land reads CI from origin on github.com, workflows in .github/workflows, 100 runs a page, within 30 seconds, and passes only completed success",["R-2586", "R-2587", "R-2589", "R-2590", "R-2591"]],
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
