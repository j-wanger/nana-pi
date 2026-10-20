/**
 * @module packages/nana-setup/tests/hooks-closed-output.test.mjs
 * @purpose Prove Claude Code hooks fail open when their stdout reader closes.
 * @inputs Five canonical hooks, their fixture inputs, and a throwaway home.
 * @outputs One PASS or FAIL check per hook and a nonzero exit when any check fails.
 * @effects disk (creates throwaway hook state), process (spawns Node hook children).
 * @errors A failed check reports both exit codes and the first stderr line.
 */
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const hooksDir = path.join(pkg, "claude", "hooks");
const home = tmpDir(path.join(os.tmpdir(), "nana-hooks-closed-output-"));
const agentDir = path.join(home, ".pi", "agent");
const claudeDir = path.join(home, ".claude");
const projectDir = path.join(home, "project");

fs.mkdirSync(projectDir, { recursive: true });
fs.mkdirSync(agentDir, { recursive: true });
fs.mkdirSync(path.join(claudeDir, "nana-memory", "shared"), { recursive: true });
fs.mkdirSync(path.join(agentDir, "nana-journal.jsonl"));
fs.writeFileSync(path.join(claudeDir, "nana-memory", "shared", "MEMORY.md"), "- [Shared entry](entry.md)\n");

const env = {
	...process.env,
	HOME: home,
	USERPROFILE: home,
	PI_CODING_AGENT_DIR: agentDir,
	CLAUDE_CONFIG_DIR: claudeDir,
	CLAUDE_PROJECT_DIR: projectDir,
};
delete env.NANA_SHARED_MEMORY_DIR;
delete env.NANA_TEST_TEMP_ROOTS;
delete env.NANA_SETUP_PLATFORM;

const firstLine = (text) => text.split(/\r?\n/, 1)[0] ?? "";
const run = (hookName, input, closed) => new Promise((resolve) => {
	const child = spawn(process.execPath, [path.join(hooksDir, hookName)], {
		cwd: projectDir,
		env,
		stdio: ["pipe", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	let spawnError = "";
	if (closed) child.stdout.destroy();
	else child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
	child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
	child.stdin.on("error", () => {});
	child.stdin.end(input);
	child.on("error", (error) => { spawnError = String(error); });
	child.on("close", (code, signal) => resolve({ code, signal, stdout, stderr: stderr || spawnError }));
});

let failures = 0;
const check = (title, ok, open, closed) => {
	const detail = ok ? "" : ` — open=${String(open.code)} closed=${String(closed.code)} stderr=${JSON.stringify(firstLine(closed.stderr || open.stderr))}`;
	console.log(ok ? "PASS" : "FAIL", `${title}${detail}`);
	if (!ok) failures++;
};

const cases = [
	{
		row: "R-1940",
		title: "objective hook ignores a closed stdout and exits 0",
		hook: "nana-objective.mjs",
		input: "{}",
	},
	{
		row: "R-1941",
		title: "adoption hook ignores a closed stdout and exits 0",
		hook: "nana-adoption.mjs",
		input: "{}",
	},
	{
		row: "R-1942",
		title: "shared-memory hook ignores a closed stdout and exits 0",
		hook: "nana-shared-memory.mjs",
		input: "{}",
	},
	{
		row: "R-1943",
		title: "roster-notice hook ignores a closed stdout and exits 0",
		hook: "nana-roster-notice.mjs",
		input: JSON.stringify({ source: "startup" }),
	},
	{
		row: "R-1944",
		title: "verifier hook ignores a closed stdout and exits 0",
		hook: "verifier-pipe.mjs",
		input: JSON.stringify({
			hook_event_name: "PreToolUse",
			tool_name: "Bash",
			tool_input: { command: "npm test | tail -1 && git commit -m done" },
		}),
	},
];

for (const testCase of cases) {
	const open = await run(testCase.hook, testCase.input, false);
	const closed = await run(testCase.hook, testCase.input, true);
	const ok = open.code === 0 && open.stdout.length > 0 && closed.code === 0 && closed.stderr === "";
	switch (testCase.row) {
		case "R-1940":
			// req: R-1940
			check("objective hook ignores a closed stdout and exits 0", ok, open, closed);
			break;
		case "R-1941":
			// req: R-1941
			check("adoption hook ignores a closed stdout and exits 0", ok, open, closed);
			break;
		case "R-1942":
			// req: R-1942
			check("shared-memory hook ignores a closed stdout and exits 0", ok, open, closed);
			break;
		case "R-1943":
			// req: R-1943
			check("roster-notice hook ignores a closed stdout and exits 0", ok, open, closed);
			break;
		case "R-1944":
			// req: R-1944
			check("verifier hook ignores a closed stdout and exits 0", ok, open, closed);
			break;
	}
}

if (failures) process.exitCode = 1;
