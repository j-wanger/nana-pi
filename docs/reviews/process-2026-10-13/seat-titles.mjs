// Seat title check for lane process (frozen per session; written by the seat 2026-10-13 from CHANGE.md §5).
// Run from the worktree root:
//   node docs/reviews/process-2026-10-13/seat-titles.mjs <session>
// Each REQUIRED entry is [file, title, rows]: the title must appear exactly once in that file, verbatim as a
// check("…") title (every target file's own helper is `check`), with a `// req:` line directly above it naming
// every listed row. Each RENAMED entry is [file, oldTitle, newTitle, rows]: the new title is held to the same rule
// and the old title must be gone. It proves the cases EXIST; the seat's pair runner later proves they bite.
import * as fs from "node:fs";

const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const IR = "packages/nana-pack/tests/immutable-review.test.mjs";
const RS = "packages/nana-pack/tests/review-standard.test.mjs";
const WL = "packages/nana-pack/tests/worker-lane.test.mjs";
const FM = "packages/nana-setup/tests/fresh-machine.test.mjs";
const RT = "packages/nana-pack/tests/requirements-tree.test.mjs";
const PREAMBLE_RULES = [
	"wrong code first", "fix the class", "await every async case", "CRLF and whitespace cases", "IDs from the brief's range",
	"no suite test runs a seat script", "no unnamed test deleted", "touched tests before each commit and the full suite before the last",
	"seat checks before DONE", "long output to a committed file", "read CI once", "the suite check count in the report",
];
const REQUIRED = {
	// 1: the build — 25 new titles and 1 renamed (CHANGE.md §5).
	"1": [
		[TR, "shared working pattern requires a threat model per plan", ["R-1100"]],
		[TR, "shared working pattern caps plan review at one or two rounds", ["R-1101"]],
		[TR, "shared working pattern freezes edits after an all-LAND review", ["R-1102"]],
		[TR, "shared working pattern ships urgent fixes alone", ["R-1103"]],
		[TR, "shared working pattern states the review bar for seats", ["R-1104"]],
		[TR, "AGENTS.md carries the macOS install check outside the shared region", ["R-1109"]],
		[IR, "pi-review appends the review standard text once after the immutable sentence", ["R-1105"]],
		[RS, "missing review standard is refused before admission", ["R-1106"]],
		[RS, "directory at the review standard path is refused before admission", ["R-1106"]],
		[RS, "blank review standard is refused before admission", ["R-1106"]],
		[RS, "review standard asks for a last-line LAND or SEND-BACK verdict", ["R-1107"]],
		[RS, "review standard defines a MUST and limits confirmation rounds to the delta", ["R-1108"]],
		...PREAMBLE_RULES.map((rule) => [WL, `lane preamble carries: ${rule}`, ["R-1110"]]),
		[FM, "fresh-machine step 8 trusts the clone before doctor", ["R-1111"]],
	],
};
const RENAMED = {
	"1": [
		[RT, "R-291: every real heading's committed IDs survive expansion and leaf counts total 1,088",
			"R-291: every real heading's committed IDs survive expansion and leaf counts total 1,100", ["R-291"]],
	],
};

const session = process.argv[2];
if (!REQUIRED[session]) { console.log(`usage: seat-titles.mjs <${Object.keys(REQUIRED).join("|")}>`); process.exit(2); }
const cache = new Map();
const titlesIn = (file) => {
	if (cache.has(file)) return cache.get(file);
	let found = null;
	if (fs.existsSync(file)) {
		found = new Map();
		const lines = fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n").split("\n");
		lines.forEach((line, i) => {
			const m = /^\s*check\(\s*"((?:[^"\\]|\\.)*)"/.exec(line);
			if (!m) return;
			const title = JSON.parse(`"${m[1]}"`);
			const above = (lines[i - 1] ?? "").trim();
			const prior = found.get(title) ?? [];
			found.set(title, [...prior, /^\/\/\s*req:/.test(above) ? above : ""]);
		});
	}
	cache.set(file, found);
	return found;
};
const judge = (file, title, rows) => {
	const found = titlesIn(file);
	if (!found) return `MISSING  ${title} — ${file} does not exist`;
	const hits = found.get(title);
	if (!hits) return `MISSING  ${title} — not a check("…") title in ${file}`;
	if (hits.length > 1) return `DUPLICATE ${title} — ${hits.length} check("…") calls in ${file}`;
	const missingRows = rows.filter((r) => !new RegExp(`\\b${r}\\b`).test(hits[0]));
	if (missingRows.length) return `NO-REQ   ${title} — the line above must name ${missingRows.join(", ")} (saw ${JSON.stringify(hits[0])})`;
	return "";
};
let bad = 0;
for (const [file, title, rows] of REQUIRED[session]) {
	const fault = judge(file, title, rows);
	if (fault) { bad++; console.log(fault); } else console.log(`ok       ${title}`);
}
for (const [file, oldTitle, newTitle, rows] of RENAMED[session] ?? []) {
	const stale = titlesIn(file)?.has(oldTitle) ? `RENAMED  old title still in ${file}: ${oldTitle}` : "";
	const fault = [judge(file, newTitle, rows), stale].filter(Boolean).join("\n");
	if (fault) { bad++; console.log(fault); } else console.log(`ok       ${newTitle} (renamed)`);
}
console.log(`seat-titles ${session}: ${bad} missing`);
process.exit(bad ? 1 : 0);
