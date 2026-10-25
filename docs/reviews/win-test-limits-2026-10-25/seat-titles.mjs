// Seat title check for lane win-test-limits (written by the seat 2026-10-25 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/win-test-limits-2026-10-25/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/test-runner.test.mjs","R-2880: a record-fixture file that passes after 1 second is labelled PASS with no cause, and the file that outlives the record limit is labelled FAIL timed out, serial and parallel",["R-2880"]],
		["packages/nana-pack/tests/test-runner.test.mjs","seal: the record fixture's per-file limit is 5 seconds, its slow file passes after 1 second and its timing-out file ends itself after 25 seconds",["R-2880"]],
		["packages/nana-pack/tests/mutation-runner.test.mjs","R-2881: R-1960's bounded-release child still reports its result when it starts 3 seconds late",["R-2881"]],
		["packages/nana-pack/tests/mutation-runner.test.mjs","R-2882: R-1242's contend case holds when the first run marks its lock 5 seconds late and is released 5 seconds after the refusal",["R-2882"]],
		["packages/nana-pack/tests/mutation-runner.test.mjs","seal: the bounded lock children have a 30-second limit and the contend case waits 30 seconds, with a 3-second late child, a 5-second late mark and a 5-second late release",["R-2881", "R-2882"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2883: worker-lane's launcher runs a fake pi that holds one second to exit 0 without starting a CPU sampler slower than the child limit, and no other launch finds that sampler",["R-2883"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","seal: worker-lane's launches have a 30-second limit and poll less often than that",["R-2883"]],
		["packages/nana-pack/tests/post-edit-hardening.test.mjs","R-2884: with taskkill off PATH and the tree's first level starting 3 seconds late, the shell still ends and the run settles timed out",["R-2884"]],
		["packages/nana-pack/tests/post-edit-hardening.test.mjs","seal: the taskkill-off-PATH case allows 10 seconds and starts its first level 3 seconds late, inside the settle watchdog and the fixture's self-exit",["R-2884"]],
		["packages/nana-pack/tests/test-runner-parallel.test.mjs","R-2885: the run-alone list names hook-deadlines and adoption-reader, each with a reason naming HOOK_DEADLINE_MS or HOOK_PRODUCER_TIMEOUT_MS",["R-2885"]],
		["packages/nana-pack/tests/brief-check.test.mjs","seal: R-2585's children have a 30-second limit and the worker polls less often than that",["R-2670"]],
		["packages/nana-pack/tests/worker-lane.test.mjs","R-2619: bold and punctuated Precedent paths are checked as the bare path",["R-2619"]],
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
