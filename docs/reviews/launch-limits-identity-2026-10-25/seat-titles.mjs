// Seat title check for lane launch-limits-identity (written by the seat 2026-10-25 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/launch-limits-identity-2026-10-25/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-setup/tests/pi-launch-limits.test.mjs","R-2890: a recorded pid still alive when the judge's wait ends makes the run read not ended, is named with its probe result, and is left running",["R-2890"]],
		["packages/nana-setup/tests/pi-launch-limits.test.mjs","R-2891: a run judged after its fixture could have ended by itself, or holding a record with no start time, reads not ended with the reason named",["R-2891"]],
		["packages/nana-setup/tests/pi-launch-limits.test.mjs","R-2892: a probe error other than ESRCH, or a record without a positive integer pid and ppid, makes the judge report its run not ended and name it",["R-2892"]],
		["packages/nana-setup/tests/pi-launch-limits.test.mjs","R-2893: the launch-limit test signals only through its allowed kill calls, imports no tree-kill helper and starts no kill command",["R-2893"]],
		["packages/nana-setup/tests/pi-launch-limits.test.mjs","R-2894: a fixture tree gets a sealed 6-second start allowance apart from the parent-kill bound and a sealed 1-second self-exit margin, and a stopped launch returns at least that margin before the fixture's hang",["R-2894"]],
		["packages/nana-setup/tests/pi-launch-limits.test.mjs","R-2895: the parent-kill check counts a launch whose pi starts its child after the default poll but inside the start allowance as started",["R-2895"]],
		["packages/nana-setup/tests/pi-launch-limits.test.mjs","R-2023: every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report",["R-2023"]],
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
