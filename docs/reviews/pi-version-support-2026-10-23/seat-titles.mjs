// Seat title check for lane pi-version-support (written by the seat 2026-10-23 before the build, from must-meet.md; R-2713 to R-2715 retitled after build 1).
// Run from the lane worktree root:   node docs/reviews/pi-version-support-2026-10-23/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/ci-workflow.test.mjs","R-2711: the install check runs on macOS and Windows at the ceiling and the floor pi, every leg installing and checking only its own version, then running the one ungated check step",["R-2711"]],
		["packages/nana-pack/tests/ci-workflow.test.mjs","R-2712: the floor pi and its cutoff are declared once, the cutoff quoted in UTC ISO form, directly after PI_BEFORE",["R-2712"]],
		["packages/nana-pack/tests/ci-workflow.test.mjs","pin R-2711 and R-2712: CI tests the sealed ceiling and floor pi at the sealed floor cutoff",["R-2711", "R-2712"]],
		["packages/nana-setup/tests/doctor-pi-dependencies.test.mjs","R-2713: a pi package with its own packages installed newer than itself prints a ✗ pi dependencies row naming each of them, both versions and the install hint",["R-2713"]],
		["packages/nana-setup/tests/doctor-pi-dependencies.test.mjs","R-2714: a pi package whose own packages are at or below its version, nested or hoisted, prints a ✓ pi dependencies row naming its version and count",["R-2714"]],
		["packages/nana-setup/tests/doctor-pi-dependencies.test.mjs","R-2715: a pi outside any package, a pre-release or missing version, a missing dependency or an unreadable version prints a · pi dependencies row, never ✗",["R-2715"]],
		["packages/nana-setup/tests/pi-install-pin.test.mjs","R-2716: the root README names CI's floor and ceiling as the supported pi range",["R-2716"]],
		["packages/nana-setup/tests/pi-install-pin.test.mjs","R-2717: the setup README carries one floor pi install command at CI's floor version and cutoff",["R-2717"]],
		["packages/nana-setup/tests/pi-install-pin.test.mjs","every README pi install command carries CI's ceiling or floor version with that version's unquoted cutoff",["R-1093"]],
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
