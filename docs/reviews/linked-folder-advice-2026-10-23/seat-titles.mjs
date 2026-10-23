// Seat title check for lane linked-folder-advice (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/linked-folder-advice-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-setup/tests/linked-claude-folder.test.mjs","R-2701: under a linked Claude or skills folder, each legacy row install's dry run refuses names that folder and every present path to move by hand, and a row install would move keeps its install advice",["R-2701"]],
		["packages/nana-setup/tests/linked-claude-folder.test.mjs","R-2702: moving every path a legacy row names to move by hand leaves that row ✓",["R-2702"]],
		["packages/nana-setup/tests/linked-claude-folder.test.mjs","R-2703: in a home whose Claude or skills folder is a link, every ✓ skill and legacy row reads as it does in an unlinked home",["R-2703"]],
		["packages/nana-setup/tests/linked-claude-folder.test.mjs","R-2704: a Claude home, or its rules, shared-memory or (off win32) hooks folder, that is a link whose target cannot be reached makes install refuse before any write, naming that link, and a broken skills or win32 hooks link does not",["R-2704"]],
		["packages/nana-setup/tests/linked-claude-folder.test.mjs","R-2705: for such a broken link, doctor's last line names install's refusal instead of telling the user to run install",["R-2705"]],
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
