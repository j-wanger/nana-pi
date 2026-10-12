// Seat title check for lane install-check (frozen per session; written by the seat 2026-10-12 after build
// session 2b came back PARTIAL with its test items unwritten). Run from the worktree root:
//   node docs/reviews/install-check-2026-10-12/seat-titles.mjs <session>
// It reads packages/nana-setup/tests/install-check.test.mjs and requires each listed title to appear
// verbatim as a check("…") title, with a `// req:` line directly above it naming every listed row.
// It proves the cases EXIST; the seat's mutation runner later proves they bite.
import * as fs from "node:fs";

const FILE = "packages/nana-setup/tests/install-check.test.mjs";
const REQUIRED = {
	"2c": [
		["environment: every override variable and every caller npm_config_* variable is removed, without case on win32", ["R-1071"]],
		["environment: HOME, USERPROFILE, TMPDIR, TEMP, TMP and npm_config_cache point into the temporary home", ["R-1071"]],
		["environment: the recording spawn sees the same sanitized environment on every child", ["R-1071", "R-1084"]],
		["spawn: every child goes through the injected spawn (git init twice, Git Bash discovery, install, pi install, pi list, pi session, each hook hit and miss, doctor)", ["R-1084"]],
		["install: the command line carries no override flag", ["R-1071"]],
		["platform: NANA_SETUP_PLATFORM in the caller changes nothing", ["R-1071"]],
		["pi launch: on win32, pi install, pi list and the session go through findPi and winCommand", ["R-1079"]],
		["reporting: a run with any FAIL line exits non-zero and a run of only PASS lines exits 0", ["R-1070"]],
		["reporting: a listed item failing with its sealed code before its expiry prints XFAIL", ["R-1080"]],
		["reporting: a listed item failing with a different code prints FAIL", ["R-1080"]],
		["reporting: a listed item failing on or after its expiry prints FAIL", ["R-1080"]],
		["reporting: a listed item that passes prints FAIL", ["R-1080"]],
		["reporting: the first lines name Git Bash on win32 only, then pi and node", ["R-1070"]],
		["pin R-1071: the override list", ["R-1071"]],
		["pin R-1070 R-1080: the known-red list with each entry's code, owner and expiry", ["R-1070", "R-1080"]],
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
