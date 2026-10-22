// Seat title check for lane suite-records (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/suite-records-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/test-runner.test.mjs","R-2546: with the record knob set, the runner writes one run record with every file's label, seconds and cause, each unnamed failure, the exit code, wall seconds, job count, platform and coverage",["R-2546"]],
		["packages/nana-pack/tests/suite-records.test.mjs","R-2547: an unfiltered locked run stores one record naming HEAD, the main merge base, the dirty count, the trigger, the final exit code and the land tip under the git common directory, and keeps only the newest records",["R-2547"]],
		["packages/nana-pack/tests/suite-records.test.mjs","R-2548: filtered and stopped locked runs store no record",["R-2548"]],
		["packages/nana-pack/tests/suite-records.test.mjs","R-2553: a missing, unreadable, unwritable or unstorable record keeps the locked run's exit code and names why",["R-2553"]],
	],
	2: [
		["packages/nana-pack/tests/suite-records.test.mjs","R-2549: a locked run names the nearest clean baseline record, land first, or says none exists and what records one",["R-2549"]],
		["packages/nana-pack/tests/suite-records.test.mjs","R-2550: a locked run sorts each failing file into passing in another clean run at this tip, failed only under coverage at the baseline, failing at the baseline too, or new",["R-2550"]],
		["packages/nana-pack/tests/suite-records.test.mjs","R-2551: a locked run lists files slower than the baseline by the declared margins, largest first, and none when job counts differ",["R-2551"]],
		["packages/nana-pack/tests/suite-records.test.mjs","R-2552: a land's locked run prints its record lines with the land note prefix",["R-2552"]],
		["packages/nana-pack/tests/suite-records.test.mjs","R-2554: a locked run prints at most two record lines and the last restates the PASS and FAIL counts and every failed name",["R-2554"]],
		["packages/nana-pack/tests/suite-records.test.mjs","R-2555: a locked run names this lane's stored full-run count and minutes",["R-2555"]],
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
