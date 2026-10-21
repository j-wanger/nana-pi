// Seat title check for lane win-leg-flakes (written by the seat 2026-10-21 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/win-leg-flakes-2026-10-21/seat-titles.mjs <session|all>
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
			"packages/nana-setup/tests/install-check.test.mjs",
			"R-2480: a pi-subagents install that exits 1 and then 0 prints PASS pi-subagents after one sealed pause",
			[
				"R-2480"
			]
		],
		[
			"packages/nana-setup/tests/install-check.test.mjs",
			"R-2481: each pi-subagents install attempt that exits 1 prints one NOTE line naming its number, the attempt count and that attempt's npm error-code line",
			[
				"R-2481"
			]
		],
		[
			"packages/nana-setup/tests/install-check.test.mjs",
			"R-2486: a pi-subagents install that times out runs once and prints FAIL pi-subagents with its timeout",
			[
				"R-2486"
			]
		],
		[
			"packages/nana-setup/tests/install-check.test.mjs",
			"R-2480: the pi-subagents retry is sealed at three attempts, a five-second pause and npm's two error-code line leads",
			[
				"R-2480",
				"R-2481"
			]
		]
	],
	"2": [
		[
			"packages/nana-setup/tests/stale-copies-slow.test.mjs",
			"R-2482: off Windows, stale-copies passes every check when each install in its legacy fixture homes takes six seconds longer",
			[
				"R-2482"
			]
		],
		[
			"packages/nana-setup/tests/stale-copies-slow.test.mjs",
			"R-2483: when the stale-copies checker fails inside the linked-claude adoption hook, the R-1761 failure names that hook run's status, signal, time and unavailable line",
			[
				"R-2483"
			]
		],
		[
			"packages/nana-setup/tests/stale-copies.test.mjs",
			"R-2482: the stale-copies install-child limit is sealed at 20 seconds",
			[
				"R-2482"
			]
		]
	],
	"3": [
		[
			"packages/nana-setup/tests/pi-launch-limits.test.mjs",
			"R-2484: the launch-limit test accepts a stop up to the limit, the relay settle window and the sealed 3.5-second margin, below the relay backstop",
			[
				"R-2484"
			]
		],
		[
			"packages/nana-pack/tests/pack-config-utf16.test.mjs",
			"R-2485: the pack-config-utf16 test launches Windows PowerShell with the sealed 60-second limit",
			[
				"R-2485"
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
