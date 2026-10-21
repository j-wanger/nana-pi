// Seat title check for lane frontier-first (written by the seat 2026-10-21 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/frontier-first-2026-10-21/seat-titles.mjs <session|all>
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
			"packages/nana-pack/tests/frontier.test.mjs",
			"seal: HANDOFF read window is 51,200 bytes",
			[
				"R-2471",
				"R-2472"
			]
		],
		[
			"packages/nana-pack/tests/frontier.test.mjs",
			"seal: HANDOFF read window is 2,000 lines",
			[
				"R-2471",
				"R-2472"
			]
		],
		[
			"packages/nana-pack/tests/frontier.test.mjs",
			"R-2472: a document over the read window in bytes or in lines gets one file-size finding with its byte and line counts",
			[
				"R-2472"
			]
		],
		[
			"packages/nana-pack/tests/frontier.test.mjs",
			"R-2471: a live section that ends past the read window in bytes or in lines is reported as read-window",
			[
				"R-2471"
			]
		]
	],
	"2": [
		[
			"packages/nana-pack/tests/frontier.test.mjs",
			"R-2470: a Where things stand, Next or Open for Jake heading after a Landed or Carried residuals heading is reported as section-order",
			[
				"R-2470"
			]
		],
		[
			"packages/nana-pack/tests/frontier.test.mjs",
			"R-2473: this repository's HANDOFF.md gets no section-order or read-window finding",
			[
				"R-2473"
			]
		],
		[
			"packages/nana-pack/tests/frontier.test.mjs",
			"frozen 2026-10-06 rewrite reports only its three section-order findings on 2026-10-07",
			[
				"R-877"
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
