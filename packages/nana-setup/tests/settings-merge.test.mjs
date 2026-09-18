// Gate: the settings.json merge ADDS and nothing else. Someone else's hooks, someone else's
// keys, and someone else's ordering all survive; a file we cannot parse stops the installer
// before anything on disk has moved.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const { desiredHooks, hasHook, mergeHooks } = await import(new URL("../lib/settings.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const wanted = desiredHooks({ hooksDir: "/h", repoRoot: "/r" });
check("four hook entries are wanted", wanted.length === 4);

/* --- unit: merge into an empty object ------------------------------------------------- */
{
	const s = {};
	const r = mergeHooks(s, wanted);
	check("empty settings: all four added", r.added.length === 4);
	check("empty settings: one group per event", s.hooks.SessionStart.length === 1 && s.hooks.UserPromptSubmit.length === 1);
	check("empty settings: merging again adds nothing", mergeHooks(s, wanted).added.length === 0);
}

/* --- unit: foreign hooks are preserved, never duplicated ------------------------------ */
{
	const s = {
		permissions: { defaultMode: "auto" },
		hooks: {
			SessionStart: [{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/session-start.sh" }] }],
			UserPromptSubmit: [
				{ matcher: "Bash", hooks: [{ type: "command", command: "bash ~/.claude/hooks/block-dangerous-bash.sh" }] },
				{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh" }] },
			],
			Stop: [{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/session-stop.sh" }] }],
		},
	};
	const before = JSON.stringify(s.hooks.Stop);
	const r = mergeHooks(s, wanted);
	check("existing context-size hook is recognised by substring, not re-added", !r.added.includes("UserPromptSubmit context-size"));
	check("the other three are added", r.added.length === 3);
	check("foreign SessionStart hook still first", s.hooks.SessionStart[0].hooks[0].command.endsWith("session-start.sh"));
	check("nana SessionStart hooks appended to the same group", s.hooks.SessionStart[0].hooks.length === 3 && s.hooks.SessionStart.length === 1);
	check("a matcher-scoped group is left alone", s.hooks.UserPromptSubmit[0].matcher === "Bash" && s.hooks.UserPromptSubmit[0].hooks.length === 1);
	check("the knowledge hook went into the un-matched group", s.hooks.UserPromptSubmit[1].hooks.length === 2);
	check("unrelated events untouched", JSON.stringify(s.hooks.Stop) === before);
	check("unrelated top-level keys untouched", s.permissions.defaultMode === "auto");
	const all = JSON.stringify(s);
	check("no duplicate context-size entry", all.split("context-size-check.sh").length - 1 === 1);
	check("second merge is a no-op", mergeHooks(s, wanted).added.length === 0 && JSON.stringify(s) === all);
}

/* --- unit: hasHook ignores command shape ---------------------------------------------- */
{
	const s = { hooks: { SessionStart: [{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/nana-objective.sh" }] }] } };
	check("a `~` command counts as present", hasHook(s, "SessionStart", "nana-objective.sh"));
	check("a hook on another event does not count", !hasHook(s, "UserPromptSubmit", "nana-objective.sh"));
	check("garbage groups do not throw", hasHook({ hooks: { SessionStart: "nope" } }, "SessionStart", "x") === false);
}

/* --- end to end: a real settings.json with foreign hooks ------------------------------ */
const tmps = [];
function freshHome() {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-settings-"));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	fs.mkdirSync(path.join(td, ".claude"), { recursive: true });
	return td;
}
const run = (args, home) => spawnSync(process.execPath, [cli, ...args, "--home", home], { encoding: "utf8" });

{
	const home = freshHome();
	const original = {
		model: "fable",
		hooks: {
			UserPromptSubmit: [{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh" }] }],
			PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "bash ~/.claude/hooks/block-dangerous-bash.sh" }] }],
		},
	};
	fs.writeFileSync(path.join(home, ".claude", "settings.json"), JSON.stringify(original, null, 2) + "\n");
	const r = run(["install"], home);
	check("install over an existing settings.json exits 0", r.status === 0, r.stderr);
	const after = JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8"));
	check("model key survives", after.model === "fable");
	check("PreToolUse survives untouched", JSON.stringify(after.hooks.PreToolUse) === JSON.stringify(original.hooks.PreToolUse));
	check("the hand-written context-size hook is kept as-is", after.hooks.UserPromptSubmit[0].hooks[0].command === "bash ~/.claude/hooks/context-size-check.sh");
	check("no second context-size hook", JSON.stringify(after).split("context-size-check.sh").length - 1 === 1);
	check("the knowledge hook was added", JSON.stringify(after).includes("nana-knowledge.ts hook"));
	const again = run(["install"], home);
	check("re-install reports nothing to do", again.stdout.includes("nothing to do"));
}

/* --- end to end: unparseable settings.json aborts and touches nothing ------------------ */
{
	const home = freshHome();
	const broken = '{ "hooks": { "SessionStart": [ } }';
	fs.writeFileSync(path.join(home, ".claude", "settings.json"), broken);
	const r = run(["install"], home);
	check("broken settings.json: non-zero exit", r.status === 2, String(r.status));
	check("broken settings.json: the message names the file", r.stderr.includes(path.join(home, ".claude", "settings.json")));
	check("broken settings.json: the message says nothing was changed", /Nothing was changed/.test(r.stderr));
	check("broken settings.json: file untouched", fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8") === broken);
	check("broken settings.json: no hooks were installed", !fs.existsSync(path.join(home, ".claude", "hooks")));
	check("broken settings.json: no pi config was seeded", !fs.existsSync(path.join(home, ".pi", "agent", "nana-pack.json")));
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
