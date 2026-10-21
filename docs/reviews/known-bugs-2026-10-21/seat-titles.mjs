// Seat title check for lane known-bugs (written by the seat 2026-10-21 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/known-bugs-2026-10-21/seat-titles.mjs <session|all>
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
			"R-2504: this repository's HANDOFF.md gets no file-size finding",
			[
				"R-2504"
			]
		],
		[
			"packages/nana-pack/tests/known-bugs.test.mjs",
			"R-2505: this repository's HANDOFF.md points to the known-bugs folder from a Known bugs section with no list item and has no Carried residuals heading",
			[
				"R-2505"
			]
		],
		[
			"packages/nana-pack/tests/known-bugs.test.mjs",
			"R-2506: a known-bug entry named for a missing, proposed or retired feature, or not named for a feature, is reported",
			[
				"R-2506"
			]
		],
		[
			"packages/nana-pack/tests/known-bugs.test.mjs",
			"R-2507: a known-bug file over the read window in bytes or in lines is reported with its counts",
			[
				"R-2507"
			]
		],
		[
			"packages/nana-pack/tests/known-bugs.test.mjs",
			"R-2508: this repository's known-bugs folder holds feature files and gets no name finding",
			[
				"R-2508"
			]
		],
		[
			"packages/nana-pack/tests/templates-render.test.mjs",
			"R-2509: the shared working pattern records a non-blocking finding in its feature's known-bug file, not HANDOFF",
			[
				"R-2509"
			]
		],
		[
			"packages/nana-pack/tests/worker-lane.test.mjs",
			"R-2510: the builder preamble forbids editing HANDOFF.md, the known-bugs folder and session archives",
			[
				"R-2510"
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
