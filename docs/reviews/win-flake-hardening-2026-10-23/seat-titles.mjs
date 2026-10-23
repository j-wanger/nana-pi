// Seat title check for lane win-flake-hardening (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/win-flake-hardening-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/test-runner.test.mjs","R-2666: a finished file whose temp folder stays busy gets one FAIL line naming the file, the folder and the code, counts as one failure, and every other file still runs, serial and parallel",["R-2666"]],
		["packages/nana-pack/tests/build-report.test.mjs","R-2667: the hard-kill step's tree kill returns without throwing whatever status it gets or when it cannot start",["R-2667"]],
		["packages/nana-pack/tests/test-runner-parallel.test.mjs","R-2668: R-1472's two files still run at the same time when one starts 2.5 seconds late, in verbose and plain mode",["R-2668"]],
		["packages/nana-pack/tests/test-runner-parallel.test.mjs","R-2669: R-1470's pool checks hold when one file starts 2.5 seconds late, at two and three jobs",["R-2669"]],
		["packages/nana-pack/tests/brief-check.test.mjs","R-2670: brief-check and pi-worker give the same line for every brief while a CPU sampler slower than the child limit is first on PATH, and the sampler never runs",["R-2670"]],
		["packages/nana-pack/tests/test-runner.test.mjs","seal: a finished file's temp folder removal retries 5 times on a 100 ms step",["R-2666"]],
		["packages/nana-pack/tests/brief-check.test.mjs","seal: R-2585's children have a 30-second limit and the worker polls less often than that",["R-2670"]],
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
