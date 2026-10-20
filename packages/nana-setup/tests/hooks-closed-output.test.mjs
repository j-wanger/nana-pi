/**
 * @module packages/nana-setup/tests/hooks-closed-output.test.mjs
 * @purpose Prove Claude Code hooks fail open when their stdout or stderr reader closes.
 * @inputs Six canonical scripts, their arguments and fixture inputs, stream closures, and throwaway homes.
 * @outputs One PASS or FAIL check per closed-output contract and a nonzero exit when any check fails.
 * @effects disk (creates throwaway hook and knowledge state), process (spawns Node hook children and an index build).
 * @errors A watchdog kills an over-limit child; a failed check reports both exit codes and the first diagnostic line.
 */
import { spawn, spawnSync } from "node:child_process";
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

const CASE_LIMIT_MS = 15_000; // Chosen to bound every child beyond the installed 5 s hook limit.
const firstLine = (text) => text.split(/\r?\n/, 1)[0] ?? "";
const run = (script, args, childEnv, input, streamToClose) => new Promise((resolve) => {
	const child = spawn(process.execPath, [script, ...args], {
		cwd: projectDir,
		env: childEnv,
		stdio: ["pipe", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	let spawnError = "";
	let timedOut = false;
	if (streamToClose === "stdout") child.stdout.destroy();
	else child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
	if (streamToClose === "stderr") child.stderr.destroy();
	else child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
	child.stdin.on("error", () => {});
	child.stdin.end(input);
	child.on("error", (error) => { spawnError = String(error); });
	const watchdog = setTimeout(() => {
		timedOut = true;
		child.kill("SIGKILL");
	}, CASE_LIMIT_MS);
	child.on("close", (code, signal) => {
		clearTimeout(watchdog);
		resolve({ code, signal, stdout, stderr: stderr || spawnError, timedOut });
	});
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
	const script = path.join(hooksDir, testCase.hook);
	const open = await run(script, [], env, testCase.input, null);
	const closed = await run(script, [], env, testCase.input, "stdout");
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

{
	const script = path.join(hooksDir, "verifier-pipe.mjs");
	const open = await run(script, [], env, "not json", null);
	const closed = await run(script, [], env, "not json", "stderr");
	// req: R-2014
	check("verifier hook ignores a closed stderr and exits 0", open.code === 0 && /nana verifier-pipe:/.test(open.stderr) && closed.code === 0 && !open.timedOut && !closed.timedOut, open, closed);
}

{
	const knowledgeHome = path.join(home, "knowledge");
	const knowledgeSource = path.join(home, "knowledge-source");
	fs.mkdirSync(knowledgeHome, { recursive: true });
	fs.mkdirSync(knowledgeSource, { recursive: true });
	fs.writeFileSync(path.join(knowledgeSource, "review-rounds.md"), "# Review round cap\n\nReview round cap guidance for independent checks.\n");
	fs.writeFileSync(path.join(knowledgeHome, "sources.json"), JSON.stringify({ roots: [{ path: knowledgeSource, kind: "articles" }] }));
	const knowledgeEnv = { ...env, NANA_KNOWLEDGE_HOME: knowledgeHome };
	delete knowledgeEnv.NANA_ROLE;
	const knowledgeCli = path.join(pkg, "..", "nana-knowledge", "bin", "nana-knowledge.ts");
	const build = spawnSync(process.execPath, [knowledgeCli, "build"], { cwd: projectDir, env: knowledgeEnv, encoding: "utf8" });
	if (build.status !== 0) throw new Error(`knowledge build failed: ${build.stderr || build.stdout}`);
	const payload = (session_id) => JSON.stringify({ session_id, prompt: "Explain the Review round cap policy" });
	const open = await run(knowledgeCli, ["hook"], knowledgeEnv, payload("closed-output-open"), null);
	const closed = await run(knowledgeCli, ["hook"], knowledgeEnv, payload("closed-output-closed"), "stdout");
	// req: R-2015
	check("knowledge pull hook ignores a closed stdout and exits 0", open.code === 0 && open.stdout.includes("[nana:knowledge]") && closed.code === 0 && closed.stderr === "" && !open.timedOut && !closed.timedOut, open, closed);
}

if (failures) process.exitCode = 1;
