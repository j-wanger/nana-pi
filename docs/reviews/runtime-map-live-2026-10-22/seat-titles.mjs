// Seat title check for lane runtime-map-live (written by the seat 2026-10-22 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/runtime-map-live-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/land.test.mjs", "the land runs its suite with the source tip's full SHA in NANA_LAND_TIP", ["R-2522"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "a passing land suite writes runtime data naming the land tip and the time it measured", ["R-2523"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "a land failing under coverage keeps its data and reruns only the failed files", ["R-2524"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "a passing land suite whose runtime data cannot be written exits 0, keeps the earlier data and names why", ["R-2525"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "on Windows a land suite runs once without coverage and says the runtime map was not measured", ["R-2526"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "off Windows, a land suite stopped during its coverage run removes the coverage folder, keeps the earlier data and exits non-zero", ["R-2527"]],
		["packages/nana-pack/tests/land.test.mjs", "a passing land shows its suite's land notes", ["R-2530"]],
		["packages/nana-pack/tests/land.test.mjs", "after a land the runtime data names main's tip and is not stale", ["R-2531"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "filtered, wrong-tip and unset-tip runs neither measure nor rerun", ["R-2532"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "a hand measure writes its tip, time and dirty-file count inside the lock", ["R-2533"]],
	],
	2: [
		["packages/nana-pack/tests/land.test.mjs", "the land runs its suite with the source tip's full SHA in NANA_LAND_TIP", ["R-2522"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "a passing land suite writes runtime data naming the land tip and the time it measured", ["R-2523"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "a land failing under coverage keeps its data and reruns only the failed files", ["R-2524"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "a passing land suite whose runtime data cannot be written exits 0, keeps the earlier data and names why", ["R-2525"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "on Windows a land suite runs once without coverage and says the runtime map was not measured", ["R-2526"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "off Windows, a land suite stopped during its coverage run removes the coverage folder, keeps the earlier data and exits non-zero", ["R-2527"]],
		["packages/nana-pack/tests/land.test.mjs", "a passing land shows its suite's land notes", ["R-2530"]],
		["packages/nana-pack/tests/land.test.mjs", "after a land the runtime data names main's tip and is not stale", ["R-2531"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "filtered, wrong-tip and unset-tip runs neither measure nor rerun", ["R-2532"]],
		["packages/nana-pack/tests/runtime-land.test.mjs", "a hand measure writes its tip, time and dirty-file count inside the lock", ["R-2533"]],
		["packages/nana-pack/tests/runtime-map.test.mjs", "impact names the measured tip, its UTC time, its age in hours and how many tracked files differ", ["R-2528"]],
		["packages/nana-pack/tests/runtime-map.test.mjs", "impact says how far main is past the measured tip, or that the tip is not on main", ["R-2529"]],
		["packages/nana-pack/tests/runtime-map.test.mjs", "impact marks stale only the measured tests that ran a changed file", ["R-2534"]],
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
