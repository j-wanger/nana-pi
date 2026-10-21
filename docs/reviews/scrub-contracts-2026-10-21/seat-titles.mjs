// Seat title check for lane scrub-contracts (written by the seat 2026-10-21 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/scrub-contracts-2026-10-21/seat-titles.mjs <session|all>
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
			"packages/nana-pack/tests/identity-scan.test.mjs",
			"the scan finds identity words in every written form",
			[
				"R-2512"
			]
		],
		[
			"packages/nana-pack/tests/identity-scan.test.mjs",
			"an allowlisted file with one more, one fewer or swapped identity words is reported",
			[
				"R-2513"
			]
		],
		[
			"packages/nana-pack/tests/identity-scan.test.mjs",
			"seal: identity word digests",
			[
				"R-2511"
			]
		]
	],
	"2": [
		[
			"packages/nana-pack/tests/product-report.test.mjs",
			"an Open for heading with any name is read as the asks section",
			[
				"R-2514"
			]
		],
		[
			"packages/nana-pack/tests/frontier.test.mjs",
			"an Open for heading with any name gets every live-section check",
			[
				"R-2515"
			]
		],
		[
			"packages/nana-pack/tests/writing-trial-extractor.test.mjs",
			"a rule attached under any Writing for title counts as attached",
			[
				"R-2516"
			]
		]
	],
	"3": [
		[
			"packages/nana-pack/tests/identity-scan.test.mjs",
			"no tracked file outside the allowlist carries an identity word",
			[
				"R-2511"
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
