// Seat title check for lane ci-pi-pin (frozen; written by the seat before the build, 2026-10-13). Run from the
// worktree root: node docs/reviews/ci-pi-pin-2026-10-13/seat-titles.mjs 1
// Each title must appear verbatim as a check("…") title in ci-workflow.test.mjs with a // req: line above it.
import * as fs from "node:fs";

const FILE = "packages/nana-pack/tests/ci-workflow.test.mjs";
const REQUIRED = {
	"1": [
		["every pi install in CI resolves at the declared cutoff", ["R-1090"]],
		["the pi resolution cutoff is declared once, quoted, in UTC ISO form beside PI_VERSION", ["R-1091"]],
		["the pi resolution cutoff is sealed at the seat's install moment", ["R-1091"]],
		["npm's before is never set through the environment or a repository-root .npmrc", ["R-1092"]],
	],
};

const session = process.argv[2];
if (!REQUIRED[session]) { console.log(`usage: seat-titles.mjs <${Object.keys(REQUIRED).join("|")}>`); process.exit(2); }
const lines = fs.readFileSync(FILE, "utf8").split("\n");
const found = new Map();
lines.forEach((line, i) => {
	const m = /^\s*check\(\s*"((?:[^"\\]|\\.)*)"/.exec(line);
	if (!m) return;
	const title = JSON.parse(`"${m[1]}"`);
	const above = (lines[i - 1] ?? "").trim();
	found.set(title, /^\/\/\s*req:/.test(above) ? above : "");
});
let bad = 0;
for (const [title, rows] of REQUIRED[session]) {
	if (!found.has(title)) { bad++; console.log(`MISSING  ${title}`); continue; }
	const req = found.get(title);
	const missingRows = rows.filter((r) => !new RegExp(`\\b${r}\\b`).test(req));
	if (missingRows.length) { bad++; console.log(`NO-REQ   ${title} — the line above must name ${missingRows.join(", ")} (saw ${JSON.stringify(req)})`); continue; }
	console.log(`ok       ${title}`);
}
console.log(`seat-titles ${session}: ${bad} missing`);
process.exit(bad ? 1 : 0);
