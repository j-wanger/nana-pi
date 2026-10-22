// Seat title check for lane claude-review-launcher (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/claude-review-launcher-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/claude-review.test.mjs","R-2560: claude-review starts the roster's Claude Code reviewer and records its round",["R-2560"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2561: claude-review sends the brief, the review standard once, then the reviewer sentence",["R-2561"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2562: a pi reviewer in the roster is refused before admission",["R-2562"]],
		["packages/nana-pack/tests/nana-roster.test.mjs","R-2563: set reviewer claude-code opus is stored and printed",["R-2563"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2564: Windows: claude-review starts a claude.cmd shim with a multi-line quoted brief on stdin and records a round",["R-2564"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2565: claude-review passes review-ledger's outcome through",["R-2565"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2566: --over-cap reaches the ledger",["R-2566"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2567: a missing, directory or blank brief or standard is refused before admission",["R-2567"]],
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
