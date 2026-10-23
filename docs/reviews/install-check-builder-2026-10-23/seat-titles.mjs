// Seat title check for lane install-check-builder (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/install-check-builder-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-setup/tests/install-check.test.mjs","pi-worker launch: off win32, one build starts by the path of the temporary home's bin pi-worker from a linked worktree of the review repository on the sealed lane branch, with the sealed arguments, a brief and output outside that worktree and the offline value",["R-2681"]],
		["packages/nana-setup/tests/install-check.test.mjs","pi-worker launch: on win32, the temporary home's pi-worker.cmd starts under the command interpreter and Git Bash runs a command naming pi-worker bare, each once from its own worktree on its own lane branch with its own brief and output",["R-2682"]],
		["packages/nana-setup/tests/install-check.test.mjs","pi-worker lines: one line per run, PASS only when the run exits 0 in time and its output's last two non-blank lines are the fixture's answer and verdict lines",["R-2683"]],
		["packages/nana-setup/tests/install-check.test.mjs","pi-worker record: a record missing the rendered builder preamble, the whole brief, the writing tag or the worker role fails, and on win32 the cmd run's record cannot pass the sh run",["R-2684"]],
		["packages/nana-setup/tests/install-check.test.mjs","pi-worker ledger: no record, a start without an end, two starts, a mismatched build id, only another lane's records, another provider or model, or an end that is not ok with exit 0 each fail that run's line",["R-2685"]],
		["packages/nana-setup/tests/install-check.test.mjs","pi-worker lock: a start record naming another lock path, or a lane lock still present after the run, fails that run's line",["R-2686"]],
		["packages/nana-setup/tests/install-check.test.mjs","pi-worker exit: a failed build's line names the exit status and pi's first output line, or the launcher's last stderr line when there is no output, such as a lane refusal",["R-2687"]],
		["packages/nana-setup/tests/install-check.test.mjs","pin R-2681 to R-2687: the build's sealed runs, lanes, labels, folders, brief text, launcher arguments, offline value, roster, settings path, ledger, record kinds, lock, preamble, role and outcome, and its timeout above the lane ceiling",["R-2681", "R-2682", "R-2683", "R-2684", "R-2685", "R-2686", "R-2687"]],
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
