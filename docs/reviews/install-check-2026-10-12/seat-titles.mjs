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
	// 2d: the seat's 2c same-environment case was wrong (it contradicted R-1075 and R-1079's per-step
	// additions); 2d replaces it with the per-step rule, then the hook set, matcher, form and dispatch cases.
	"2d": [
		["environment: every child gets the base environment plus only its own step's additions (CLAUDE_PROJECT_DIR for each hook, NANA_TEST_TEMP_ROOTS empty for the pi session)", ["R-1071", "R-1075", "R-1079"]],
		["pi session: runs with NANA_TEST_TEMP_ROOTS set empty", ["R-1079"]],
		["hook set: an exact set passes", ["R-1074"]],
		["hook set: a missing row fails", ["R-1074"]],
		["hook set: a duplicate entry fails", ["R-1074"]],
		["hook set: an unmapped extra entry fails", ["R-1074"]],
		["hook set: a missing type, async true, a shell field, non-string args, or a missing or non-5 timeout each fail", ["R-1074"]],
		["hook set: a group without the matcher-and-hooks nesting fails", ["R-1074"]],
		["matcher: *, empty and omitted admit everything", ["R-1074"]],
		["matcher: 'Bash, PowerShell' and 'Bash|PowerShell' admit both tools", ["R-1074"]],
		["matcher: ^Bash$ admits Bash", ["R-1074"]],
		["matcher: NotBash does not admit Bash", ["R-1074"]],
		["matcher: a resume SessionStart matcher fails", ["R-1074"]],
		["matcher: win32 requires PowerShell in the verifier matcher", ["R-1074"]],
		["form: a shell-form entry under win32 fails", ["R-1082"]],
		["form: an exec-form entry under darwin fails", ["R-1082"]],
		["form: each row's form is read from the sealed table, never inferred from args", ["R-1082"]],
		["pin R-1074 R-1082: the hook table with its form columns and the allowed entry keys", ["R-1074", "R-1082"]],
		["dispatch: an entry with args runs as exec form with no shell", ["R-1075"]],
		["dispatch: an entry without args runs /bin/sh -c on POSIX and Git Bash bash -c on win32", ["R-1075"]],
		["dispatch: Git Bash is derived from git.exe in cmd, bin or mingw64\\bin, and System32\\bash.exe is refused", ["R-1075"]],
		["dispatch: each hook runs in the fixture project with CLAUDE_PROJECT_DIR set to it", ["R-1075"]],
		["dispatch: the three SessionStart entries start before any of them finishes", ["R-1075"]],
		["dispatch: a hook that runs past its timeout is a FAIL whose reason prints the duration", ["R-1075"]],
	],
	"2e": [
		["objective: the failure marker fails even though it starts with [nana:objective]", ["R-1076"]],
		["objective: output without the run token fails", ["R-1076"]],
		["adoption: ADOPTION UNAVAILABLE fails", ["R-1076"]],
		["adoption: output that does not name the project fails", ["R-1076"]],
		["shared memory: output without the seeded '- [' line fails", ["R-1076"]],
		["shared memory: a link at another key or with another target fails", ["R-1076"]],
		["output: a 10,001-character stdout fails", ["R-1076"]],
		["verifier: an allow decision fails", ["R-1077"]],
		["verifier: a missing hookEventName fails", ["R-1077"]],
		["verifier: malformed JSON fails", ["R-1077"]],
		["verifier: two JSON lines fail", ["R-1077"]],
		["verifier: a miss sample that prints anything fails", ["R-1077"]],
		["knowledge: an empty output fails", ["R-1083"]],
		["knowledge: a win32 ~\\notes\\docs\\install-check.md pointer matches by file name", ["R-1083"]],
		["checklist: the check writes only the objective lines and one MEMORY.md line, and puts the bin folder first on PATH except on win32", ["R-1072"]],
		["checklist: pi install npm:pi-subagents uses doctor's floor, from the fixture project, launched as install launches pi", ["R-1072"]],
		["doctor: exit 1 with only check and ! marks is a FAIL", ["R-1081"]],
		["doctor: exit 0 with a note row off the note list is a FAIL", ["R-1081"]],
		["doctor: a known-red note row is an XFAIL", ["R-1081", "R-1080"]],
		["pin R-1081: the doctor note list", ["R-1081"]],
		["pi list: colour codes are stripped", ["R-1073"]],
		["pi list: a relative ../../ source still matches", ["R-1073"]],
		["pi list: D:\\ matches d:\\ on win32", ["R-1073"]],
		["pi list: a (filtered) entry fails", ["R-1073"]],
		["pi list: runs from the fixture project with no PI_CODING_AGENT_DIR", ["R-1073"]],
	],
	// 3a (after the seat's mutation runner, 38/44 at 7b6c650): the verifier is ONE entry whose matcher admits
	// every tool of its row (cc writes "Bash|PowerShell"); the spawn adapter reports timeouts and keeps enough
	// stdout for the cap to bite.
	"3a": [
		["verifier row: on win32 one entry whose matcher admits Bash and PowerShell satisfies the hook set and both verifier lines", ["R-1074", "R-1077"]],
		["verifier row: on win32 an entry whose matcher admits only Bash fails the PowerShell line", ["R-1074", "R-1077"]],
		["verifier row: on darwin one entry admitting Bash satisfies the verifier line and no PowerShell line is printed", ["R-1074", "R-1077"]],
		["spawn adapter: a child killed at its timeout reports ETIMEDOUT and its duration", ["R-1075"]],
		["spawn adapter: stdout is kept to 10,001 characters, so a 10,001-character output fails the cap", ["R-1076"]],
		["timeout: a hook past its timeout reports the timeout code, not no-output", ["R-1075", "R-1080"]],
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
