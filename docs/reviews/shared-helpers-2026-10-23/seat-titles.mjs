// Seat title check for lane shared-helpers (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/shared-helpers-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/process-tree.test.mjs","R-2656: off Windows both forms of the shared tree kill signal the pid's process group once, SIGKILL by default, and call the fallback only when that signal throws",["R-2656"]],
		["packages/nana-pack/tests/process-tree.test.mjs","R-2657: on Windows both forms start taskkill /T /F /PID once without a shell, signal no group, call the fallback once when taskkill cannot start or exits non-zero, and contain a throwing fallback",["R-2657"]],
		["packages/nana-pack/tests/process-tree.test.mjs","R-2658: a pid of 0, 1, -1, 1.5, NaN, null or undefined signals nothing, starts no taskkill and calls no fallback",["R-2658"]],
		["packages/nana-pack/tests/rename-retry.test.mjs","R-2659: the shared rename retry waits, rechecks and retries only EPERM, EBUSY and EACCES, on every platform, up to the configured attempts, then throws the last error",["R-2659"]],
		["packages/nana-pack/tests/review-ledger.test.mjs","R-2660: a kept review text whose first rename fails with EPERM, EBUSY or EACCES is still kept and its round recorded, on every platform",["R-2660"]],
		["packages/nana-pack/tests/process-tree.test.mjs","R-2661: the tree-kill scan names each planted taskkill or negative-pid line outside the exceptions, and finds none in the repository",["R-2661"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2662: the builder preamble tells the builder to import a needed function, never copy it, and stop on a private helper the brief does not move",["R-2662"]],
		["packages/nana-pack/tests/rulings.test.mjs","R-2663: the rulings file carries one dated ruling that a helper's second caller imports it and the plan names any move",["R-2663"]],
		["packages/nana-pack/tests/process-tree.test.mjs","seal: taskkill, SIGKILL by default, and the four declared tree-kill exceptions",["R-2656", "R-2657", "R-2661"]],
		["packages/nana-pack/tests/rename-retry.test.mjs","seal: three attempts 20 ms apart on EPERM, EBUSY and EACCES",["R-2659"]],
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
