// Seat title check for lane writing-adoption (written by the seat 2026-10-21 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/writing-adoption-2026-10-21/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	"1": [
		[
			"packages/nana-pack/tests/writing-injection.test.mjs",
			"cap: a rule cut between the two halves of a surrogate pair is injected ending before that pair",
			[
				"R-2501"
			]
		],
		[
			"packages/nana-pack/tests/writing-injection.test.mjs",
			"enabled: writing.enabled false in the active agent dir leaves the writing section unset",
			[
				"R-2500"
			]
		],
		[
			"packages/nana-pack/tests/writing-injection.test.mjs",
			"enabled: a trusted project's writing.enabled false leaves the rule injected",
			[
				"R-006"
			]
		],
		[
			"packages/nana-pack/tests/writing-check.test.mjs",
			"this repository's HANDOFF.md live sections hold no over-cap sentence and no banned word",
			[
				"R-2503"
			]
		]
	],
	"2": [
		[
			"packages/nana-setup/tests/install.test.mjs",
			"nana-writing is linked on PATH, runs by bare name, and doctor reads a missing or misdirected link ✗",
			[
				"R-2498"
			]
		],
		[
			"packages/nana-setup/tests/win-shims.test.mjs",
			"Windows: text piped by bare name to nana-writing --report reaches the checker from cmd.exe and PowerShell",
			[
				"R-2499"
			]
		]
	],
	"3": [
		[
			"packages/nana-setup/tests/writing-rule.test.mjs",
			"the rule's Check section is the sealed check text",
			[
				"R-2502"
			]
		]
	]
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
