/**
 * @module packages/nana-setup/tests/hooks-win32-exec.test.mjs
 * @purpose Spawn every installed Claude Code hook entry exactly as Windows exec form does — no shell, real `node`, each entry's own args — and read the result.
 * @inputs a detached git worktree of HEAD under a temp folder whose name carries a space and several shell-only characters; the real install and doctor CLIs; sample Claude Code event stdin
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a detached worktree, a throwaway home and project, both removed at the end), process (spawns the installer, doctor and every hook entry with `shell: false`)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; this file is SKIPped on every leg but the Windows one (scripts/test.mjs SKIPS)
 */
// Windows-leg-only (R-1058, R-1063, R-1064): the other legs never reach process.platform ===
// "win32", so this file is declared in scripts/test.mjs SKIPS everywhere else and runs for real
// only on the non-blocking Windows CI leg. It does NOT force NANA_SETUP_PLATFORM — the exec-form
// entries this file spawns are whatever the REAL install on the REAL platform wrote, the way
// Claude Code itself would spawn them: node finds `node.exe` on PATH and quotes each `args`
// element into the Windows command line (INFERRED that Claude Code's own spawner meets the same
// documented contract — section 3 of the lane's CHANGE.md). There is no Git Bash, PowerShell or
// cmd.exe step, because exec form uses none of them.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { withPiStub } from "./stub-pi.mjs";
import { desiredHooks, entryInvokes } from "../lib/settings.mjs";
import { platform } from "../lib/paths.mjs";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)), "..", "..");
let fails = 0;
// final review r1 (sol MUST 3): the detail/extra argument is printed on every line, not only on
// FAIL — R-1058 records each entry's spawn duration there, which only this Windows leg can read.
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, extra ?? "");
	if (!ok) fails++;
};

// A space plus every shell-only character the plan names. They stay in the name to show that no
// shell is involved — exec form never tokenizes them.
const weird = ["space", "$x", "`y", "%z%", "o'q", "&", "(", ")", ";", "^"].join(" ");
const worktree = path.join(os.tmpdir(), `nana-win32-exec-${process.pid}-${weird}`);
const removeWorktree = () => {
	spawnSync("git", ["worktree", "remove", "--force", worktree], { cwd: repoRoot });
	fs.rmSync(worktree, { recursive: true, force: true });
};

const added = spawnSync("git", ["worktree", "add", "--detach", worktree, "HEAD"], { cwd: repoRoot, encoding: "utf8" });
check("setup: a detached worktree of HEAD was added", added.status === 0, added.stderr);

try {
	const cli = path.join(worktree, "packages", "nana-setup", "bin", "nana-setup.mjs");
	const home = path.join(worktree, `home-${weird}`);
	const project = path.join(worktree, `proj-${weird}`);
	fs.mkdirSync(home, { recursive: true });
	fs.mkdirSync(project, { recursive: true });
	fs.copyFileSync(path.join(worktree, "templates", "_shared", "OBJECTIVE.md"), path.join(project, "OBJECTIVE.md"));

	// pi-subagents floor fixture (win32-degrade.test.mjs seeds the same shape) — without it
	// doctor fails `pi pi-subagents` regardless of anything this lane changed.
	const subagentsDir = path.join(home, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagentsDir, { recursive: true });
	const piSubagentsVersion = /PI_SUBAGENTS_FLOOR\s*=\s*"([^"]+)"/.exec(fs.readFileSync(path.join(worktree, "packages", "nana-setup", "lib", "doctor.mjs"), "utf8"))?.[1] ?? "0.75.0";
	fs.writeFileSync(path.join(subagentsDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: piSubagentsVersion }));
	fs.mkdirSync(path.join(home, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(home, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));

	// Seed the shared index with exactly one `- [` line — the hook prints only its header, an
	// optional note, and lines matching `^- \[`.
	const claudeHome = path.join(home, ".claude");
	fs.mkdirSync(path.join(claudeHome, "nana-memory", "shared"), { recursive: true });
	fs.writeFileSync(path.join(claudeHome, "nana-memory", "shared", "MEMORY.md"), "# Shared memory\n\nBlurb.\n\n- [Seeded entry](x.md) — seeded by the Windows leg\n");

	// Bug 4's real repro: today's actual win32 entry — a backslash root, a forward-slash suffix,
	// pointing at a missing checkout. Install must replace it in place with exec form, and doctor
	// must then show ✓. Without this case, only POSIX-path fixtures pin the bug 4 fix.
	fs.mkdirSync(claudeHome, { recursive: true });
	const staleReal = { type: "command", command: "node 'C:\\gone\\checkout/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5, statusMessage: "nana: knowledge pull" };
	fs.writeFileSync(path.join(claudeHome, "settings.json"), JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [staleReal] }] } }, null, 2) + "\n");

	const env = {
		...process.env,
		HOME: home,
		USERPROFILE: home,
		CLAUDE_PROJECT_DIR: project,
		CLAUDE_CONFIG_DIR: claudeHome,
		NANA_KNOWLEDGE_HOME: path.join(home, ".nana-knowledge"),
	};

	// `install --home` skips pi registration, so no pi launch ever sees the `%` in these paths.
	const install = spawnSync(process.execPath, [cli, "install", "--home", home], { encoding: "utf8", env });
	check("install exits 0", install.status === 0, install.stdout + install.stderr);

	const settings = JSON.parse(fs.readFileSync(path.join(claudeHome, "settings.json"), "utf8"));
	const wanted = desiredHooks({ hooksDir: path.join(claudeHome, "hooks"), repoRoot: worktree, platform: platform() });
	const entries = {};
	for (const w of wanted) {
		for (const group of settings.hooks?.[w.event] ?? []) {
			const hook = (group.hooks ?? []).find((h) => entryInvokes(h, w.spec, platform()));
			if (hook) entries[w.spec.script] = { hook, matcher: group.matcher };
		}
	}
	// req: R-1050
	check("every entry has command node, an args array and no shell key", wanted.every((w) => entries[w.spec.script]) && Object.values(entries).every(({ hook }) => hook.command === "node" && Array.isArray(hook.args) && !("shell" in hook)), JSON.stringify(entries));
	// req: R-1056
	check("the stale knowledge entry was replaced in place, not twinned", Boolean(entries["nana-knowledge.ts"]) && (settings.hooks.UserPromptSubmit ?? []).flatMap((g) => g.hooks).filter((h) => JSON.stringify(h).includes("nana-knowledge")).length === 1, JSON.stringify(settings.hooks.UserPromptSubmit));
	// req: R-1053
	check("the verifier group's matcher is Bash-or-PowerShell", entries["verifier-pipe.mjs"]?.matcher === "Bash|PowerShell", JSON.stringify(entries["verifier-pipe.mjs"]));

	// final review r1 (sol MUST 3, astra MUST 4): spawn with the entry's OWN declared timeout ×
	// 1000, no added slack — R-1058 says each hook "shall exit 0 within its timeout", and the old
	// +5000ms margin let a hook that took up to 9s still read as meeting a 5s contract. The
	// duration is returned so every check below can record it.
	const spawnEntry = (hook, stdin) => {
		const startedAt = Date.now();
		const r = spawnSync(hook.command, hook.args, { shell: false, input: JSON.stringify(stdin), env, encoding: "utf8", timeout: hook.timeout * 1000 });
		return { ...r, ms: Date.now() - startedAt };
	};
	const session = { hook_event_name: "SessionStart", source: "startup", cwd: project, session_id: "win32-exec" };
	// not title-bearing (the req: R-1058 marker sits on each literal check() call below, so the
	// static title-trace rail can cite each entry by name): the shared boolean and the duration +
	// timeout-exceeded note that each check's detail records.
	const moduleOk = (r) => r.status === 0 && !/Cannot find module|ERR_MODULE_NOT_FOUND/.test(r.stderr || "");
	const detail = (r) => `${r.ms}ms, timeout ${r.error?.code === "ETIMEDOUT" ? "EXCEEDED" : "not exceeded"}; ${r.stdout}${r.stderr}`;

	{
		const r = spawnEntry(entries["nana-objective.mjs"].hook, session);
		// req: R-1058
		check("objective: exit 0 within its own timeout, no module-resolution error", moduleOk(r), detail(r));
		// req: R-1063
		check("objective: first line starts [nana:objective], no OBJECTIVE UNAVAILABLE", (r.stdout || "").split("\n")[0]?.startsWith("[nana:objective]") && !(r.stdout || "").includes("OBJECTIVE UNAVAILABLE"), r.stdout + r.stderr);
	}
	{
		const r = spawnEntry(entries["nana-adoption.mjs"].hook, session);
		// req: R-1058
		check("adoption: exit 0 within its own timeout, no module-resolution error", moduleOk(r), detail(r));
		// req: R-1063
		check("adoption: exit 0, no ADOPTION UNAVAILABLE", r.status === 0 && !(r.stdout || "").includes("ADOPTION UNAVAILABLE"), r.stdout + r.stderr);
	}
	{
		const r = spawnEntry(entries["nana-shared-memory.mjs"].hook, session);
		// req: R-1058
		check("shared memory: exit 0 within its own timeout, no module-resolution error", moduleOk(r), detail(r));
		// req: R-1063
		check("shared memory: exit 0, header and the seeded \"- [\" index line", r.status === 0 && (r.stdout || "").includes("[nana:shared-memory]") && /^- \[Seeded entry\]/m.test(r.stdout || ""), r.stdout + r.stderr);
		const link = path.join(claudeHome, "projects");
		const projectDirs = fs.existsSync(link) ? fs.readdirSync(link) : [];
		const junction = projectDirs.map((d) => path.join(link, d, "memory", "shared")).find((p) => fs.existsSync(p));
		// req: R-1063
		check("shared memory: the project's memory/shared is a link to the shared folder", Boolean(junction) && fs.lstatSync(junction).isSymbolicLink(), junction ?? "(none found)");
	}
	{
		const v = entries["verifier-pipe.mjs"].hook;
		const ev = (tool, command) => ({ hook_event_name: "PreToolUse", tool_name: tool, tool_input: { command }, cwd: project, session_id: "win32-exec" });
		// final review r1 (sol MUST 4): exactly one non-empty line, parsed whole, naming
		// hookEventName PreToolUse and permissionDecision ask — not merely "first line parses".
		const askLine = (r) => {
			const lines = (r.stdout || "").split("\n").filter((l) => l.length > 0);
			if (lines.length !== 1) return null;
			try {
				const parsed = JSON.parse(lines[0]);
				return parsed?.hookSpecificOutput?.hookEventName === "PreToolUse" && parsed?.hookSpecificOutput?.permissionDecision === "ask" ? parsed : null;
			} catch { return null; }
		};
		const bashAsk = spawnEntry(v, ev("Bash", "npm test | tail -5; git commit -m x"));
		// req: R-1058
		check("verifier: exit 0 within its own timeout, no module-resolution error", moduleOk(bashAsk), detail(bashAsk));
		// req: R-1064
		check("verifier: Bash masked pipe gives exactly one ask line (hookEventName PreToolUse)", Boolean(askLine(bashAsk)), bashAsk.stdout + bashAsk.stderr);
		const psAsk = spawnEntry(v, ev("PowerShell", "set -o pipefail; npm test | Select-Object -Last 5; git commit -m x"));
		// req: R-1064
		check("verifier: PowerShell masked pipe gives exactly one ask line (hookEventName PreToolUse), Bash pipefail syntax stays inactive there", Boolean(askLine(psAsk)), psAsk.stdout + psAsk.stderr);
		const noMatch = spawnEntry(v, ev("Bash", "git status"));
		// req: R-1064
		check("verifier: a non-matching command gives empty stdout", noMatch.status === 0 && (noMatch.stdout || "") === "", JSON.stringify(noMatch.stdout));
	}
	{
		const r = spawnEntry(entries["nana-knowledge.ts"].hook, { hook_event_name: "UserPromptSubmit", prompt: "hello from the windows leg", cwd: project, session_id: "win32-exec" });
		// req: R-1058
		check("knowledge: exit 0 within its own timeout, no module-resolution error", moduleOk(r), detail(r));
	}

	const doctorResult = withPiStub(() => spawnSync(process.execPath, [cli, "doctor", "--home", home], { encoding: "utf8", env }));
	// req: R-1055
	check("doctor: exit 0", doctorResult.status === 0, doctorResult.stdout);
	for (const label of ["settings SessionStart objective", "settings SessionStart adoption", "settings SessionStart shared-memory", "settings PreToolUse verifier pipe", "settings UserPromptSubmit knowledge pull", "node for the objective hook"]) {
		const line = doctorResult.stdout.split("\n").find((l) => l.includes(label)) ?? "";
		// req: R-1055
		check(`doctor: "${label}" is ✓`, line.trim().startsWith("✓"), line);
	}
	// final review r1 (sol MUST 3, astra MUST 4): the note's full MEANING, not only the version
	// string — the floor itself, and that doctor never runs `claude --version` to check it.
	// req: R-1060
	check("doctor: a note names the Claude Code exec-form floor (2.1.139)", doctorResult.stdout.includes("2.1.139") && /need Claude Code 2\.1\.139 or later/.test(doctorResult.stdout) && /claude --version.*never run/.test(doctorResult.stdout), doctorResult.stdout);
} finally {
	removeWorktree();
}

process.exit(fails);
