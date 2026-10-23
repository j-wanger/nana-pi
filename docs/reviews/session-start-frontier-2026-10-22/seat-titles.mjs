// Seat title check for lane session-start-frontier (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/session-start-frontier-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-setup/tests/frontier-hook.test.mjs","R-2606: the objective hook prints the repository HANDOFF's frontier block after the objective block, from a subfolder and a linked worktree",["R-2606"]],
		["packages/nana-pack/tests/frontier-summary.test.mjs","R-2607: Next titles and ask tags and titles are listed in block order, and nested items, fences and other sections are not",["R-2607"]],
		["packages/nana-pack/tests/frontier-summary.test.mjs","R-2608: the block ends with the frontier checker's own summary line and counts",["R-2608"]],
		["packages/nana-pack/tests/frontier-summary.test.mjs","R-2609: the block stays within its caps, renders each title as one clean line, keeps blocking asks first and counts the titles it left out",["R-2609"]],
		["packages/nana-pack/tests/frontier-summary.test.mjs","R-2610: no HANDOFF.md or a reviewer or worker role gives no output and exit 0",["R-2610"]],
		["packages/nana-pack/tests/frontier-summary.test.mjs","R-2611: an unreadable HANDOFF.md gives one FRONTIER UNAVAILABLE line naming its cause and path",["R-2611"]],
		["packages/nana-pack/tests/frontier-golden.test.mjs","R-2612: the pi section equals the Claude hook's frontier block minus its tag line for every session start reason, and is re-read after an edit",["R-2612"]],
		["packages/nana-setup/tests/hook-deadlines.test.mjs","R-2613: objective hook prints both markers before its installed limit when both producers hang, and keeps a long objective whole under the cap",["R-2613"]],
		["packages/nana-pack/tests/frontier-summary.test.mjs","seal: the frontier block's tag is [nana:frontier], its pi section is nana-frontier and its caps are 4,000 and 160 characters",["R-2606", "R-2609", "R-2612"]],
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
