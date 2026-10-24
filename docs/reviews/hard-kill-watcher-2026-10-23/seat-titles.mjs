// Seat title check for lane hard-kill-watcher (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/hard-kill-watcher-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher",["R-2720"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2721: Windows: taskkill /F /T of pi-worker's tree while a directly launched builder runs leaves no temp file, no lane lock and no watcher",["R-2721"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2722: a hard kill while the lane lock names another process, live or dead, leaves that lock unchanged, the temp folder empty and no watcher",["R-2722"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2723: off Windows, after SIGKILL of pi-worker alone the builder's group is gone while the other members of pi-worker's own process group and an unrelated process keep running",["R-2723"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2724: after a finished build and after the ceiling the watcher exits and the ledger holds that build's one end record",["R-2724"]],
		["packages/nana-pack/tests/build-report.test.mjs","R-2725: a hard-killed lane build gets one end record from its watcher and the report lists it as stopped, exit -, with its session cost",["R-2725"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2726: off Windows, a recorded builder pid now held by a process started after the record is not signalled and the lane lock stays",["R-2726"]],
		["packages/nana-pack/tests/lane-watcher.test.mjs","R-2727: a watcher whose recorded builder still runs after the stop wait, or whose Windows builder ran through cmd.exe, keeps the lane lock and removes the temp files",["R-2727"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2728: a hard kill of one lane's pi-worker while a second lane builds in the same temp folder leaves the second lane's build, files, lock and watcher untouched",["R-2728"]],
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
