// Seat title check for lane build-records (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/build-records-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/build-records.test.mjs","R-2596: a lane build appends one start record under the clone's git folder before pi starts",["R-2596"]],
		["packages/nana-pack/tests/build-records.test.mjs","R-2597: a lane build that succeeds, fails, reaches the ceiling or is stopped appends one end record naming its start",["R-2597"]],
		["packages/nana-pack/tests/build-records.test.mjs","R-2598: the end record sums every usage pi wrote in the build's session file, or names why the cost is unknown",["R-2598"]],
		["packages/nana-pack/tests/build-records.test.mjs","R-2599: an unwritable build ledger leaves the build's launch and exit code unchanged and names why in one line",["R-2599"]],
		["packages/nana-pack/tests/build-report.test.mjs","R-2600: the build report prints each build, one line per lane and a total counting lanes with two or more builds",["R-2600"]],
		["packages/nana-pack/tests/build-report.test.mjs","R-2601: the build report lists a start with no end as no end, with its session cost",["R-2601"]],
		["packages/nana-pack/tests/build-records.test.mjs","R-2602: the last stderr line names this build's outcome, minutes and cost and its lane's builds so far",["R-2602"]],
		["packages/nana-pack/tests/build-records.test.mjs","seal: build records live at nana/build-records.jsonl in schema 1 and their stderr lines start pi-worker: build record:",["R-2596", "R-2599", "R-2602"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","pi-worker runs a worker under the watchdog (exit 0, output written)",["R-2603"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","pi-worker touched no ledger file",["R-2603"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","pi-worker source never imports the ledger API",["R-2603"]],
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
