// Seat title check for lane land-ci-timings (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/land-ci-timings-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/land-ci-records.test.mjs","R-2750: after the merge, its containment check and outside the ledger lock, the land reads the tip's CI records from github.com in its gh environment and prints the reader's lines",["R-2750"]],
		["packages/nana-pack/tests/land-ci-records.test.mjs","R-2751: each CI record read at a land is kept once in the clone's ci-runs store with its tip, run, attempt, leg, event and time, never among local suite records",["R-2751"]],
		["packages/nana-pack/tests/land-ci-records.test.mjs","R-2752: the ci-runs store keeps only the newest CI_RECORDS_KEEP records",["R-2752"]],
		["packages/nana-pack/tests/test-runner.test.mjs","R-2753: the run record names the default per-file time limit the runner applied",["R-2753"]],
		["packages/nana-pack/tests/land-ci-records.test.mjs","R-2754: a land notes each CI file at or above its share of the record's own per-file limit, slowest first and capped",["R-2754"]],
		["packages/nana-pack/tests/land-ci-records.test.mjs","R-2755: a CI-record failure after the merge is one land note and the land still succeeds",["R-2755"]],
		["packages/nana-pack/tests/land-ci-records.test.mjs","R-2756: the CI-record read starts no gh call past its budget and gives each call a whole-millisecond limit within the time left",["R-2756"]],
		["packages/nana-pack/tests/land-ci-records.test.mjs","seal: CI records are kept in nana/ci-runs up to 4000, files are noted at half their limit, and the read stops after 60 seconds",["R-2751", "R-2752", "R-2754", "R-2756"]],
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
