/**
 * @module packages/nana-setup/tests/frontier-hook.test.mjs
 * @purpose Prove the Claude objective hook appends the repository-root frontier block under its shared budget.
 * @inputs The checkout's real objective hook and frontier producer, disposable repositories, homes and objective configuration.
 * @outputs One aggregate PASS/FAIL check for root, nested, linked-worktree, non-repository, spaced, CRLF and disabled-objective cases.
 * @effects disk (temporary fixtures), process (runs real hook and producer CLIs).
 * @errors A failed case sets exit 1; every child runs under a per-case timeout.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { SHARED_MEMORY_OUTPUT_BUDGET } from "../lib/shared-memory-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";

delete process.env.NANA_ROLE;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const HOOK = path.join(ROOT, "packages/nana-setup/claude/hooks/nana-objective.mjs");
const FRONTIER = path.join(ROOT, "packages/nana-pack/bin/nana-frontier-summary.mjs");
const OBJECTIVE = path.join(ROOT, "packages/nana-pack/bin/nana-objective.mjs");
const CASE_LIMIT_MS = 12_000;
let failures = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", `${title}${ok || !detail ? "" : ` — ${detail}`}`);
	if (!ok) failures++;
};
const run = (script, args, cwd, env) => spawnSync(process.execPath, [script, ...args], { cwd, env, encoding: "utf8", timeout: CASE_LIMIT_MS });
const makeHome = (enabled = true) => {
	const home = tmpDir(path.join(os.tmpdir(), "frontier-hook-home-"));
	const agent = path.join(home, ".pi", "agent");
	fs.mkdirSync(agent, { recursive: true });
	fs.writeFileSync(path.join(agent, "nana-objective.md"), "**Objective:** test the frontier hook.\n\n**Current priority:** keep both producers whole.\n");
	fs.writeFileSync(path.join(agent, "nana-pack.json"), JSON.stringify({ objective: { enabled } }));
	return { home, agent };
};
const makeRepo = (name, text, gitShape = "dir") => {
	const root = tmpDir(path.join(os.tmpdir(), `${name}-`));
	if (gitShape === "dir") fs.mkdirSync(path.join(root, ".git"));
	else if (gitShape === "file") fs.writeFileSync(path.join(root, ".git"), "gitdir: ../common/worktrees/lane\n");
	fs.writeFileSync(path.join(root, "HANDOFF.md"), text);
	return root;
};

const cases = [];
const base = "## Next\n1. **Root title.** body\n## Open for the owner\n- **[blocking, since 2026-10-01] Decide root.** body\n";
const rootRepo = makeRepo("frontier-hook-root", base);
cases.push({ name: "root", cwd: rootRepo, home: makeHome() });
const nested = path.join(rootRepo, "src", "deep"); fs.mkdirSync(nested, { recursive: true });
cases.push({ name: "subfolder", cwd: nested, home: makeHome() });
const linked = makeRepo("frontier-hook-linked", "## Next\n- Linked worktree title\n", "file");
const linkedSub = path.join(linked, "packages", "one"); fs.mkdirSync(linkedSub, { recursive: true });
cases.push({ name: "linked-worktree subfolder", cwd: linkedSub, home: makeHome(), includes: "Linked worktree title", excludes: "Root title" });
const outside = makeRepo("frontier hook outside repository with space", "## Next\n- Outside repository title\n", "none");
cases.push({ name: "non-repository and spaced folder", cwd: outside, home: makeHome(), includes: "Outside repository title" });
const crlf = makeRepo("frontier-hook-crlf", "## Next\r\n- CRLF title\r\n## Open for the owner\r\n- **[optional, since 2026-10-01] CRLF ask.** body\r\n");
cases.push({ name: "CRLF", cwd: crlf, home: makeHome(), includes: "CRLF title" });
cases.push({ name: "objective disabled", cwd: rootRepo, home: makeHome(false), disabled: true });

const outcomes = cases.map((testCase) => {
	const env = { ...process.env, HOME: testCase.home.home, USERPROFILE: testCase.home.home, PI_CODING_AGENT_DIR: testCase.home.agent, CLAUDE_PROJECT_DIR: testCase.cwd };
	delete env.NANA_ROLE;
	const objective = run(OBJECTIVE, ["--cwd", testCase.cwd], testCase.cwd, env);
	const remaining = SHARED_MEMORY_OUTPUT_BUDGET - objective.stdout.length;
	const frontier = run(FRONTIER, ["--cwd", testCase.cwd, "--max", String(remaining)], testCase.cwd, env);
	const hook = run(HOOK, [], testCase.cwd, env);
	const tags = hook.stdout.split("\n").filter((line) => line === "[nana:frontier]").length;
	const expected = `${objective.stdout}${frontier.stdout}`;
	const startsRight = testCase.disabled ? !hook.stdout.startsWith("[nana:objective]\n") : hook.stdout.startsWith("[nana:objective]\n");
	const ok = hook.status === 0 && objective.status === 0 && frontier.status === 0 && !hook.signal && startsRight && tags === 1 && hook.stdout === expected &&
		(!testCase.includes || hook.stdout.includes(testCase.includes)) && (!testCase.excludes || !hook.stdout.includes(testCase.excludes));
	return { name: testCase.name, ok, hook: { status: hook.status, signal: hook.signal, out: hook.stdout }, expected };
});

// req: R-2606
check("R-2606: the objective hook prints the repository HANDOFF's frontier block after the objective block, from a subfolder and a linked worktree", outcomes.every((entry) => entry.ok), JSON.stringify(outcomes.filter((entry) => !entry.ok)));

if (failures) process.exitCode = 1;
