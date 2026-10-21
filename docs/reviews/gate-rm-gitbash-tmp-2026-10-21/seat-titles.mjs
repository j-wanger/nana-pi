// Seat title check for lane gate-rm-gitbash-tmp (written by the seat 2026-10-21 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/gate-rm-gitbash-tmp-2026-10-21/seat-titles.mjs <session|all>
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
			"packages/nana-pack/tests/gate-rm-outside.test.mjs",
			"on Windows a Git Bash drive spelling such as /c/ reads as that drive's path",
			[
				"R-2492"
			]
		],
		[
			"packages/nana-pack/tests/gate-rm-outside.test.mjs",
			"on Windows a Git Bash /tmp target is judged in the folder TMP names, or TEMP when TMP is unset",
			[
				"R-2490"
			]
		],
		[
			"packages/nana-pack/tests/gate-rm-outside.test.mjs",
			"on Windows a cd to Git Bash /tmp moves relative rm targets into the temp folder",
			[
				"R-2491"
			]
		]
	],
	"2": [
		[
			"packages/nana-pack/tests/gate-rm-outside.test.mjs",
			"Git Bash lookalikes, climb-outs, links out of /tmp, PowerShell /tmp and /tmp off Windows still ask",
			[
				"R-2493"
			]
		],
		[
			"packages/nana-pack/tests/gate-rm-outside.test.mjs",
			"a Git Bash /tmp target still asks when TMP names a drive root, the home folder or a folder above it",
			[
				"R-2494"
			]
		]
	],
	"3": [
		[
			"packages/nana-pack/tests/gate-rm-outside.test.mjs",
			"on Windows a headless rm -f of a Git Bash /tmp file runs unblocked",
			[
				"R-2495"
			]
		],
		[
			"packages/nana-pack/tests/gate-rm-outside.test.mjs",
			"on Windows a headless rm of, or after a cd to, a Git Bash drive spelling is judged at that drive's path",
			[
				"R-2496"
			]
		],
		[
			"packages/nana-pack/tests/gate-rm-outside.test.mjs",
			"on Windows the gate reads Git Bash drive spellings as Git Bash's own cygpath does, over a usertemp /tmp mount",
			[
				"R-2497"
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
