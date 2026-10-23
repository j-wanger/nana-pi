// Seat title check for lane claude-code-builder-parity (written by the seat 2026-10-23 before the build, from must-meet.md).
// Run from the lane worktree root:   node docs/reviews/claude-code-builder-parity-2026-10-22/seat-titles.mjs <session|all>
// For each listed [file, title, rows]: the file holds exactly one check/test/it call whose first quoted argument is the
// title, on the call's own line, with the stacked `// req:` lines directly above it naming every listed row.
// It proves the checks EXIST; the suite proves they pass. No suite test may import or run it.
import * as fs from "node:fs";
import * as path from "node:path";

const CALL = /(?:^|[^\w.$])(?:check|test|it)\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/;
const MARKER = /^\s*\/\/\s*req:\s*(.*)$/;
const SESSIONS = {
	1: [
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2646: lane size larger starts a Claude Code larger-lane builder as claude -p with its model, default permission mode, project settings only, no MCP servers and the builder tools, in the locked worktree",["R-2646"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2647: the Claude Code builder's prompt file holds the rendered preamble, the brief and the feature's known bugs once each in that order, and is gone after the build",["R-2647"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2648: for a Claude Code builder a failing brief is refused with brief-check's line before the lock and claude, and a passing brief prints brief-check's launch line",["R-2648"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2649: a Claude Code larger-lane launch prints one builder line naming claude-code and its model before claude starts",["R-2649"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2650: Windows: a claude.cmd larger-lane builder starts through cmd.exe with its arguments unchanged and a brief holding quotes, percent, bang and line breaks intact in its prompt file",["R-2650"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2651: a Claude Code builder whose CPU stays flat past the stall limit runs to its end, and the ceiling and SIGTERM still stop it",["R-2651"]],
		["packages/nana-pack/tests/templates-render.test.mjs","R-2652: the shared working pattern starts the larger-lane builder, pi or Claude Code, through pi-worker --lane-size larger and a small lane through --lane-size small",["R-2652"]],
		["packages/nana-pack/tests/build-records.test.mjs","R-2653: a Claude Code build's start record names provider claude-code, its model and a null thinking",["R-2653"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2654: a Claude Code builder runs with auto-memory off and the builder Bash limit as both Bash time limits",["R-2654"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2655: a Claude Code builder gets a settings file outside the worktree carrying only the login keys and network env names from the user settings, named in one line without values, and gone after the build",["R-2655"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2664: the builder's settings file holds the sealed builder env whatever the user settings env says",["R-2664"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","R-2665: a missing, unreadable, malformed or non-object user settings file prints one carry line without its content, and the builder still starts with only the sealed env",["R-2665"]],
		["packages/nana-pack/tests/worker-claude.test.mjs","seal: a Claude Code builder uses default permission mode, project and local settings, a carried settings file, no MCP servers, tools Read,Grep,Glob,Bash,Edit,Write, a prompt file, no stall stop, auto-memory off and the builder Bash limit",["R-2646", "R-2651", "R-2654", "R-2655"]],
	],
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
