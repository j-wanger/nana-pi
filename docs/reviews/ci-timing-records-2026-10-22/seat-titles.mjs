// Seat title check for lane ci-timing-records (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/ci-timing-records-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/ci-workflow.test.mjs","R-2631: every CI suite step points the runner's record knob at the leg's temp folder",["R-2631"]],
		["packages/nana-pack/tests/ci-workflow.test.mjs","R-2632: every suite leg uploads its record after the suite, failed or not, named by leg and attempt, without failing the leg",["R-2632"]],
		["packages/nana-pack/tests/ci-records.test.mjs","R-2633: a record the runner writes under CI's arguments reads back in ci-records with the runner's own totals",["R-2633"]],
		["packages/nana-pack/tests/ci-records.test.mjs","R-2634: ci-records prints one totals line per record artifact of each CI run of the commit",["R-2634"]],
		["packages/nana-pack/tests/ci-records.test.mjs","R-2635: ci-records lists each record's slowest files, slowest first and capped",["R-2635"]],
		["packages/nana-pack/tests/ci-records.test.mjs","R-2637: ci-records names each suite leg with no readable record and why",["R-2637"]],
		["packages/nana-pack/tests/ci-records.test.mjs","R-2638: ci-records exits 1 with one named line when the revision, gh or every record is missing, and 0 when a record printed",["R-2638"]],
		["packages/nana-pack/tests/ci-records.test.mjs","seal: CI suite records are suite-record- artifacts of .github/workflows/ci.yml runs, and their lines start ci record:",["R-2632", "R-2634"]],
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
