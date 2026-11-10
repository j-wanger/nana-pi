/**
 * @module packages/nana-pack/tests/claude-review-launch.test.mjs
 * @purpose Pin the Claude Code review launcher from roster selection through prompt assembly, ledger admission, platform launch and exit pass-through.
 * @inputs bin/claude-review.mjs, temporary HOME rosters, injected stderr forms and fake claude commands on PATH.
 * @outputs named PASS/FAIL checks, with one Windows-only skip off win32.
 * @effects disk (temporary homes, repositories, pack copies, outputs and fake-command records), process (spawns launchers, git and fake Claude Code commands).
 * @errors failed checks or timed-out launcher cases exit nonzero; unexpected setup errors throw.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLAUDE_REVIEW = path.join(PACK, "bin", "claude-review.mjs");
const CASE_TIMEOUT_MS = 30_000;
const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "claude-review-test-")));
let fails = 0;
const check = (name, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
	if (!ok) fails++;
};
const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8", timeout: CASE_TIMEOUT_MS });
const makeRepo = (name) => {
	const repo = path.join(temp, name);
	fs.mkdirSync(repo, { recursive: true });
	for (const args of [["init", "-q", "-b", "main"], ["config", "core.autocrlf", "false"]]) {
		const r = git(repo, ...args);
		if (r.status !== 0) throw new Error(r.stderr);
	}
	fs.writeFileSync(path.join(repo, "seed.txt"), "seed\n");
	if (git(repo, "add", "seed.txt").status !== 0 || git(repo, "commit", "-qm", "seed").status !== 0) throw new Error("cannot seed repository");
	return repo;
};
const piEntry = (model = "gpt-5.6-sol") => ({ provider: "openai-codex", model, thinking: null });
const claudeEntry = (model) => ({ runtime: "claude-code", model });
const roster = (reviewer = claudeEntry("fable")) => ({
	scout: null,
	builder: { provider: "openai-codex", model: "gpt-6-luna", thinking: "high" },
	largerBuilder: claudeEntry("sonnet"),
	reviewer,
	land: null,
});
let homeCount = 0;
const makeHome = (label, rosterValue = roster()) => {
	const home = path.join(temp, `home-${++homeCount}-${label}`);
	const agent = path.join(home, ".pi", "agent");
	fs.mkdirSync(agent, { recursive: true });
	fs.writeFileSync(path.join(agent, "nana-pack.json"), JSON.stringify({ roster: rosterValue }));
	return { home, agent };
};
const rows = (file) => {
	try { return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse); }
	catch { return []; }
};
const ledgerState = (home, item) => ({
	rounds: rows(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl")).filter((row) => row.kind === "round" && row.item === item),
	reservations: (() => { try { return fs.readdirSync(path.join(home, ".pi", "agent", "review-ledger.reservations")); } catch { return []; } })(),
});
const writeFakeClaude = (dir, record) => {
	fs.mkdirSync(dir, { recursive: true });
	const script = path.join(dir, "fake-claude.cjs");
	fs.writeFileSync(script, `const fs = require("node:fs");
let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { stdin += chunk; });
process.stdin.on("end", () => {
  if (process.env.CLAUDE_RECORD) fs.appendFileSync(process.env.CLAUDE_RECORD, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), role: process.env.NANA_ROLE, handoff: process.env.NANA_HANDOFF, stdin }) + "\\n");
  process.stdout.write(process.env.CLAUDE_ANSWER ?? "Review complete.\\nVERDICT: LAND\\n");
  process.exit(Number(process.env.CLAUDE_EXIT ?? "0"));
});
`);
	if (process.platform === "win32") {
		fs.writeFileSync(path.join(dir, "claude.cmd"), `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`);
	} else {
		fs.writeFileSync(path.join(dir, "claude"), `#!${process.execPath}\nrequire(${JSON.stringify(script)});\n`);
		fs.chmodSync(path.join(dir, "claude"), 0o755);
	}
	return record;
};
const baseEnv = ({ home, agent }, bin, record, extra = {}) => ({
	...process.env,
	HOME: home,
	USERPROFILE: home,
	PI_CODING_AGENT_DIR: agent,
	PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
	CLAUDE_RECORD: record,
	...extra,
});
const runLauncher = ({ launcher = CLAUDE_REVIEW, cwd, tree, brief = "brief.md", out, item, env, extra = [] }) => spawnSync(process.execPath, [launcher, "--item", item, ...(tree === null ? [] : ["--tree", tree]), "--brief", brief, "--out", out, ...extra], {
	cwd,
	env,
	encoding: "utf8",
	timeout: CASE_TIMEOUT_MS,
});
const commitChange = (repo, text) => {
	fs.writeFileSync(path.join(repo, "state.txt"), text);
	const add = git(repo, "add", "state.txt");
	const commit = git(repo, "commit", "-qm", text.trim());
	if (add.status !== 0 || commit.status !== 0) throw new Error(`${add.stderr}\n${commit.stderr}`);
};
const noStack = (text) => !/\n\s+at .+:\d+:\d+/.test(text ?? "");
{
	const item = "claude-main";
	const repo = makeRepo("main-tree");
	const outside = path.join(temp, "outside-main");
	fs.mkdirSync(outside);
	const brief = path.join(repo, "brief.md");
	fs.writeFileSync(brief, "Review the named revision.\n");
	git(repo, 'add', 'brief.md'); git(repo, 'commit', '-qm', 'brief');
	const home = makeHome("main");
	const fakeBin = path.join(temp, "fake-main");
	const record = writeFakeClaude(fakeBin, path.join(temp, "main-record.jsonl"));
	const out = path.join(temp, "main-out.md");
	const answer = "Looks correct.\nVERDICT: LAND\n";
	const result = runLauncher({ cwd: outside, tree: repo, out, item, env: baseEnv(home, fakeBin, record, { CLAUDE_ANSWER: answer }), extra: ["--role", "final"] });
	const calls = rows(record);
	const state = ledgerState(home.home, item);
	// req: R-2560
	check("R-2560: claude-review starts the roster's Claude Code reviewer and records its round",
		result.status === 0 && calls.length === 1 &&
		JSON.stringify(calls[0].argv) === JSON.stringify(["-p", "--model", "fable", "--allowedTools", "Read,Grep,Glob,Bash", "--disallowedTools", "Edit,Write,NotebookEdit", "--setting-sources", "project,local", "--settings", calls[0].argv[calls[0].argv.indexOf('--settings') + 1], "--strict-mcp-config", "--session-id", calls[0].argv.at(-1)]) &&
		calls[0].role === "reviewer" && calls[0].handoff === "off" && fs.realpathSync(calls[0].cwd) === fs.realpathSync(repo) &&
		fs.readFileSync(out, "utf8") === answer && state.rounds.length === 1 && state.rounds[0].model === "fable" && state.rounds[0].role === "final",
		JSON.stringify({ result, calls, state }));
}


{
	const source = makeRepo('dirty-source');
	const repo = path.join(temp, 'dirty-clone');
	const cloned = git(temp, 'clone', '--local', source, repo);
	if (cloned.status !== 0) throw new Error(cloned.stderr);
	const brief = path.join(temp, 'dirty-brief.md');
	fs.writeFileSync(brief, 'Review the committed revision.');
	const fakeBin = path.join(temp, 'fake-dirty');
	const record = writeFakeClaude(fakeBin, path.join(temp, 'dirty-record.jsonl'));
	const home = makeHome('dirty');
	const hook = path.join(repo, '.codex', 'hooks.json');
	fs.mkdirSync(path.dirname(hook)); fs.writeFileSync(hook, '{}');
	const item = 'dirty-launch';
	const invoke = () => runLauncher({ cwd: temp, tree: repo, brief, out: path.join(temp, 'dirty-out.md'), item, env: baseEnv(home, fakeBin, record) });
	const untracked = invoke();
	fs.rmSync(hook); fs.writeFileSync(path.join(repo, 'seed.txt'), 'changed');
	const tracked = invoke();
	git(repo, 'add', 'seed.txt'); fs.writeFileSync(path.join(repo, 'seed.txt'), 'seed\n');
	const indexOnly = invoke();
	const state = ledgerState(home.home, item);
	// req: R-3989
	check('an untracked hooks file refuses Claude before any model call',
		[untracked, tracked, indexOnly].every(r => r.status === 1 && r.stderr.includes('commit or remove them, then review')) &&
		untracked.stderr.includes('.codex/hooks.json') && tracked.stderr.includes('seed.txt') && indexOnly.stderr.includes('seed.txt') &&
		!fs.existsSync(record) && state.rounds.length === 0 && state.reservations.length === 0,
		JSON.stringify({ untracked, tracked, indexOnly, state }));
}

if (fails) process.exitCode = 1;
