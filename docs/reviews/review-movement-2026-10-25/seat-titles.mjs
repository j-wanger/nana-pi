// Seat title check for lane review-movement (written by the seat 2026-10-25 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/review-movement-2026-10-25/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/claude-review.test.mjs","R-2900: claude-review sends one tree movement section, computed in the reviewed tree against main, between the brief and the review standard",["R-2900"]],
		["packages/nana-pack/tests/immutable-review.test.mjs","R-2901: pi-review appends one tree movement section as a file outside the checkout, computed against main, after the review standard, and removes the file when it exits",["R-2901"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2902: a movement that cannot be computed reaches the reviewer as one not-computed line and the review still records its round",["R-2902"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2903: a tree with no committed ledger gets no tree movement section, even with an untracked ledger in the working tree",["R-2903"]],
		["packages/nana-pack/tests/immutable-review.test.mjs","R-2904: pi-review appends no tree movement section for a revision with no committed ledger",["R-2904"]],
		["packages/nana-pack/tests/review-movement.test.mjs","R-2905: the ledger lists the tree movement report as a CAP-07 deliverable made by the review launchers, read in the reviewer's prompt and pointed to by the seat's land report",["R-2905"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2906: a tree movement report longer than 64 KiB reaches the reviewer whole",["R-2906"]],
		["packages/nana-pack/tests/immutable-review.test.mjs","R-2907: a tree movement section longer than 32,767 characters reaches the pi reviewer whole",["R-2907"]],
		["packages/nana-pack/tests/immutable-review.test.mjs","R-2908: on a repository with no main branch, pi-review appends one not-computed tree movement section, records its round and exits 0",["R-2908"]],
		["packages/nana-pack/tests/review-movement.test.mjs","seal: the tree movement section is headed ## Tree movement with its lead line, computed against main by the pack's own requirements-moved within 30 seconds and 16 MiB, and a failed run reads tree movement: not computed:",["R-2900", "R-2901", "R-2902", "R-2906", "R-2907", "R-2908"]],
		["packages/nana-pack/tests/claude-review.test.mjs","R-2561: claude-review sends the brief, the review standard once, then the reviewer sentence",["R-2561"]],
		["packages/nana-pack/tests/immutable-review.test.mjs","pi-review appends the review standard text once after the immutable sentence",["R-1105"]],
		["packages/nana-pack/tests/requirements-moved.test.mjs","R-1460: added, removed, re-statused and reworded rows are listed under their feature, evidence-only edits are not",["R-1460"]],
		["packages/nana-pack/tests/requirements-moved.test.mjs","R-1461: rows main gained after the branch point are not reported",["R-1461"]],
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
