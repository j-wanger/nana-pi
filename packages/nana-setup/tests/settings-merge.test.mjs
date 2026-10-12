/**
 * @module packages/nana-setup/tests/settings-merge.test.mjs
 * @purpose Pins that the settings.json merge adds active hooks and removes only the exact retired hook — other people's hooks, keys and ordering survive, an unparsable or unrecognised file stops the installer before anything moves, and the write is atomic
 * @inputs lib/settings.mjs, lib/steps.mjs, bin/nana-setup.mjs, and settings fixtures under a throwaway --home
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts, settings files and lock files), process (spawns the installer CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: the settings.json merge adds active hooks and removes only the exact retired hook.
// Someone else's hooks, keys, and ordering all survive; a file we cannot parse OR cannot understand
// stops the installer before anything on disk has moved; the write is atomic and refuses to
// clobber a concurrent edit; and a hook counts as installed only when it really is one.
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const { commandInvokes, desiredHooks, entryInvokes, hasHook, hookTargets, installerTarget, mergeHooks, mergeRepoHooks, removeInstallerHooks, serialize, shq, tokenize, validateShape, migrateLegacyHooks, WIN_VERIFIER_MATCHER, CLAUDE_CODE_EXEC_FLOOR } = await import(new URL("../lib/settings.mjs", import.meta.url).href);
const { SetupError, install, readClaudeSettings, stepSettings, withSettingsLock, writeSettingsAtomic } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const wanted = desiredHooks({ hooksDir: "/h", repoRoot: "/r" });
const spec = (label) => wanted.find((w) => w.label === label).spec;
check("five active hook entries are wanted", wanted.length === 5);

/* --- paths are quoted, so a space in the home or clone still runs --------------------- */
{
	const w = desiredHooks({ hooksDir: "/Users/Jane Doe/.claude/hooks", repoRoot: "/Users/Jane Doe/nana-pi" });
	// req: R-319
	check("Node hook commands single-quote the path", w[0].entry.command === "node '/Users/Jane Doe/.claude/hooks/nana-objective.mjs'");
	check("the node command single-quotes the path", w.find((x) => x.label === "UserPromptSubmit knowledge pull").entry.command === "NODE_NO_WARNINGS=1 node '/Users/Jane Doe/nana-pi/packages/nana-knowledge/bin/nana-knowledge.ts' hook");
	// req: R-319
	check("a quote inside a path is escaped", shq("/a/b'c/d") === `'/a/b'\\''c/d'`);
	for (const entry of w) check(`quoted command still matches its own spec (${entry.label})`, commandInvokes(entry.entry.command, entry.spec));
}

/* --- matching is anchored on the script as a path component -------------------------- */
{
	const objective = spec("SessionStart objective");
	const yes = [
		"node ~/.claude/hooks/nana-objective.mjs",
		"node '/Users/Jane Doe/.claude/hooks/nana-objective.mjs'",
		'node "/Users/x/.claude/hooks/nana-objective.mjs"',
		"/usr/bin/node /Users/x/.claude/hooks/nana-objective.mjs",
		"node /opt/hooks/nana-objective.mjs --quiet",
	];
	for (const c of yes) check(`matches: ${c}`, commandInvokes(c, objective));
	const no = [
		"echo bash /tmp/nana-objective.sh", // mentions an invocation, is not one
		"node /tmp/nana-objective.mjs &&", // not even valid shell
		"node /tmp/nana-objective.mjs | cat",
		"node /tmp/nana-objective.mjs; false",
		"node /tmp/nana-objective.mjs > log",
		"node /tmp/nana-objective.mjs < in",
		"node /tmp/nana-objective.mjs & ",
		"node $(echo /tmp)/nana-objective.mjs",
		"node `echo /tmp`/nana-objective.mjs",
		"echo nana-objective.mjs.disabled",
		"node ~/.claude/hooks/nana-objective.mjs.disabled",
		"node ~/.claude/hooks/old-nana-objective.mjsx",
		"echo '/x/nana-objective.mjs'", // no interpreter
		"node ~/.claude/hooks/nana-shared-memory.mjs",
	];
	for (const c of no) check(`does NOT match: ${c}`, !commandInvokes(c, objective));
	const knowledge = spec("UserPromptSubmit knowledge pull");
	check("knowledge: the real command matches", commandInvokes("NODE_NO_WARNINGS=1 node /r/packages/nana-knowledge/bin/nana-knowledge.ts hook", knowledge));
	check("knowledge: a different subcommand does not", !commandInvokes("node /r/packages/nana-knowledge/bin/nana-knowledge.ts build", knowledge));
	check("knowledge: a bare mention does not", !commandInvokes("echo nana-knowledge.ts hook", knowledge));
	check("knowledge: a quoted path with a space matches", commandInvokes("NODE_NO_WARNINGS=1 node '/x y/nana-knowledge.ts' hook", knowledge));
	check("knowledge: `echo node … hook` does not", !commandInvokes("echo node /x/nana-knowledge.ts hook", knowledge));
	check("unbalanced quoting reads as NOT installed", !commandInvokes("node '/x/nana-objective.mjs", objective));
}

/* --- the tokenizer the matcher is built on -------------------------------------------- */
{
	const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
	check("tokenize: plain words", eq(tokenize("bash /a/b.sh"), ["bash", "/a/b.sh"]));
	check("tokenize: single quotes keep spaces", eq(tokenize("bash '/Jane Doe/b.sh'"), ["bash", "/Jane Doe/b.sh"]));
	check("tokenize: double quotes keep spaces", eq(tokenize('bash "/Jane Doe/b.sh"'), ["bash", "/Jane Doe/b.sh"]));
	check("tokenize: backslash escapes a space", eq(tokenize("bash /Jane\\ Doe/b.sh"), ["bash", "/Jane Doe/b.sh"]));
	check("tokenize: env assignment stays its own word", eq(tokenize("A=1 node x hook"), ["A=1", "node", "x", "hook"]));
	check("tokenize: an empty quoted word survives", eq(tokenize("a '' b"), ["a", "", "b"]));
	check("tokenize: unbalanced quoting is null", tokenize("bash 'x") === null);
	for (const op of ["&&", "||", ";", "|", "&", ">", "<", "`", "$("]) {
		check(`tokenize: \`${op}\` outside quotes is null`, tokenize(`bash /x/y.sh ${op} z`) === null);
	}
	check("tokenize: an operator INSIDE quotes is just text", JSON.stringify(tokenize("bash '/x/a && b.sh'")) === JSON.stringify(["bash", "/x/a && b.sh"]));
	check("tokenize: a bare $ (variable expansion) is fine", JSON.stringify(tokenize("bash $HOME/x.sh")) === JSON.stringify(["bash", "$HOME/x.sh"]));
}

/* --- shape validation ----------------------------------------------------------------- */
{
	check("valid: empty object", validateShape({}) === null);
	check("valid: real-world settings", validateShape({ model: "fable", hooks: { SessionStart: [{ hooks: [{ command: "x" }] }, { matcher: "Bash", hooks: [] }] } }) === null);
	check('invalid: {"hooks":"disabled"}', validateShape({ hooks: "disabled" }) !== null);
	check("invalid: hooks event is not an array", validateShape({ hooks: { SessionStart: { hooks: [] } } }) !== null);
	check("invalid: a group is not an object", validateShape({ hooks: { SessionStart: ["x"] } }) !== null);
	check("invalid: group.hooks is not an array", validateShape({ hooks: { SessionStart: [{ hooks: "x" }] } }) !== null);
	check("invalid: top level is an array", validateShape([]) !== null);
}

/* --- unit: merge into an empty object ------------------------------------------------- */
{
	const s = {};
	const r = mergeHooks(s, wanted);
	check("empty settings: all five active entries added", r.added.length === 5);
	check("empty settings: one group per event", s.hooks.SessionStart.length === 1 && s.hooks.UserPromptSubmit.length === 1);
	// req: R-316
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
				{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/owner-prompt.sh" }] },
			],
			Stop: [{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/session-stop.sh" }] }],
		},
	};
	const before = JSON.stringify(s.hooks.Stop);
	const r = mergeHooks(s, wanted);
	check("the other five are added", r.added.length === 5);
	// req: R-316
	check("foreign SessionStart hook still first", s.hooks.SessionStart[0].hooks[0].command.endsWith("session-start.sh"));
	// req: R-316
	check("nana SessionStart hooks appended to the same group", s.hooks.SessionStart[0].hooks.length === 4 && s.hooks.SessionStart.length === 1);
	// req: R-316
	check("a matcher-scoped group is left alone", s.hooks.UserPromptSubmit[0].matcher === "Bash" && s.hooks.UserPromptSubmit[0].hooks.length === 1);
	check("the knowledge hook appends without replacing the foreign prompt entry", s.hooks.UserPromptSubmit[1].hooks.length === 2 && s.hooks.UserPromptSubmit[1].hooks[0].command.endsWith("owner-prompt.sh"));
	// req: R-316
	check("unrelated events untouched", JSON.stringify(s.hooks.Stop) === before);
	// req: R-316
	check("unrelated top-level keys untouched", s.permissions.defaultMode === "auto");
	const all = JSON.stringify(s);
	check("second merge is a no-op", mergeHooks(s, wanted).added.length === 0 && JSON.stringify(s) === all);
}

/* --- a recognized stale knowledge hook is atomically migrated, unknown entries survive -- */
{
	const wantedKnowledge = desiredHooks({ hooksDir: "/unused", repoRoot: "/repo" });
	const desired = wantedKnowledge.find((w) => w.label === "UserPromptSubmit knowledge pull").entry.command;
	check("fixture: the desired knowledge command matches today's shape", desired === "NODE_NO_WARNINGS=1 node '/repo/packages/nana-knowledge/bin/nana-knowledge.ts' hook");
	const customized = { type: "command", command: "NANA_KNOWLEDGE_HOME=/custom node /old-clone/packages/nana-knowledge/bin/nana-knowledge.ts hook", timeout: 5, statusMessage: "nana: knowledge pull" };
	const original = { hooks: { UserPromptSubmit: [{ hooks: [
		{ type: "command", command: "NODE_NO_WARNINGS=1 node '/old-clone/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5, statusMessage: "nana: knowledge pull" },
		{ type: "command", command: "node /hand-written/packages/nana-knowledge/bin/nana-knowledge.ts hook", timeout: 5, statusMessage: "personal knowledge" },
		customized,
		{ type: "command", command: "echo /old-clone/packages/nana-knowledge/bin/nana-knowledge.ts" },
	] }] } };
	const result = mergeRepoHooks(original, { repoRoot: "/repo", wanted: wantedKnowledge });
	const row = result["UserPromptSubmit knowledge pull"];
	// req: R-394
	check("recognized stale absolute knowledge command is replaced in place with no duplicate", row.found && row.replaced && original.hooks.UserPromptSubmit[0].hooks[0].command === desired && original.hooks.UserPromptSubmit[0].hooks.length === 4);
	// req: R-653
	check("unrecognized hand-written node hook entry remains exactly equal", JSON.stringify(original.hooks.UserPromptSubmit[0].hooks[1]) === JSON.stringify({ type: "command", command: "node /hand-written/packages/nana-knowledge/bin/nana-knowledge.ts hook", timeout: 5, statusMessage: "personal knowledge" }));
	// req: R-653
	check("unrecognized customized knowledge hook entry remains exactly equal", JSON.stringify(original.hooks.UserPromptSubmit[0].hooks[2]) === JSON.stringify(customized));
	// req: R-653
	check("unrecognized echo entry remains exactly equal", JSON.stringify(original.hooks.UserPromptSubmit[0].hooks[3]) === JSON.stringify({ type: "command", command: "echo /old-clone/packages/nana-knowledge/bin/nana-knowledge.ts" }));
	check("absolute knowledge hook target outside repository is not accepted as healthy", row.replaced);
}

/* --- win32 exec form: desiredHooks, entryInvokes, hasHook, hookTargets, installerTarget ------- */
{
	// (R-1050, R-1051) every win32 entry is exec form, unquoted and unescaped, from the checkout.
	const weird = "/Users/Jane Doe/nana pi $x `y %z% o'q";
	const w32 = desiredHooks({ hooksDir: "/unused", repoRoot: weird, platform: "win32" });
	// req: R-1050
	check("win32 desiredHooks: every entry is exec form with no shell key", w32.every((w) => w.entry.command === "node" && Array.isArray(w.entry.args) && !("shell" in w.entry)));
	// req: R-1051
	check("win32 desiredHooks: the four hook entries name packages/nana-setup/claude/hooks/", ["nana-objective.mjs", "nana-adoption.mjs", "nana-shared-memory.mjs", "verifier-pipe.mjs"].every((name) => w32.find((w) => w.spec.script === name).entry.args[0] === `${weird}/packages/nana-setup/claude/hooks/${name}`));
	// req: R-1050
	check("win32 desiredHooks: only the knowledge entry adds `hook`", w32.filter((w) => w.entry.args.length > 1).length === 1 && w32.find((w) => w.label === "UserPromptSubmit knowledge pull").entry.args[1] === "hook");
	// req: R-1050
	check("win32 desiredHooks: the knowledge target is the checkout's own nana-knowledge CLI", w32.find((w) => w.label === "UserPromptSubmit knowledge pull").entry.args[0] === `${weird}/packages/nana-knowledge/bin/nana-knowledge.ts`);
	// req: R-1053
	check("WIN_VERIFIER_MATCHER is Bash-or-PowerShell", WIN_VERIFIER_MATCHER === "Bash|PowerShell");
	// req: R-1053
	check("win32 desiredHooks: the verifier group's matcher is WIN_VERIFIER_MATCHER", w32.find((w) => w.label === "PreToolUse verifier pipe").matcher === WIN_VERIFIER_MATCHER);
	// req: R-1060
	check("CLAUDE_CODE_EXEC_FLOOR is 2.1.139", CLAUDE_CODE_EXEC_FLOOR === "2.1.139");
}
{
	// (R-1061) POSIX desiredHooks is byte-identical to today's, with or without an explicit non-win32 platform.
	const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
	const eq = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
	const fixture = [
		{ event: "SessionStart", label: "SessionStart objective", marker: "nana-objective.mjs", spec: { interpreters: ["node"], script: "nana-objective.mjs" }, entry: { type: "command", command: "node '/h/nana-objective.mjs'", timeout: 5, statusMessage: "nana: objective + current priority" } },
		{ event: "SessionStart", label: "SessionStart adoption", marker: "nana-adoption.mjs", spec: { interpreters: ["node"], script: "nana-adoption.mjs" }, entry: { type: "command", command: "node '/h/nana-adoption.mjs'", timeout: 5, statusMessage: "nana: unadopted repositories" } },
		{ event: "SessionStart", label: "SessionStart shared-memory", marker: "nana-shared-memory.mjs", spec: { interpreters: ["node"], script: "nana-shared-memory.mjs" }, entry: { type: "command", command: "node '/h/nana-shared-memory.mjs'", timeout: 5, statusMessage: "nana: shared memory index" } },
		{ event: "PreToolUse", matcher: "Bash", label: "PreToolUse verifier pipe", marker: "verifier-pipe.mjs", spec: { interpreters: ["node"], script: "verifier-pipe.mjs" }, entry: { type: "command", command: "node '/h/verifier-pipe.mjs'", timeout: 5, statusMessage: "nana: verifier pipe" } },
		{ event: "UserPromptSubmit", label: "UserPromptSubmit knowledge pull", marker: "nana-knowledge.ts hook", spec: { interpreters: ["node"], script: "nana-knowledge.ts", args: ["hook"] }, entry: { type: "command", command: "NODE_NO_WARNINGS=1 node '/r/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5, statusMessage: "nana: knowledge pull" } },
	];
	// req: R-1061
	check("POSIX desiredHooks deep-equals today's fixture", eq(desiredHooks({ hooksDir: "/h", repoRoot: "/r", platform: "darwin" }), fixture));
	// req: R-1061
	check("desiredHooks with no platform deep-equals the same fixture", eq(desiredHooks({ hooksDir: "/h", repoRoot: "/r" }), fixture));
}
{
	const objSpec = spec("SessionStart objective");
	const knowledgeSpec = spec("UserPromptSubmit knowledge pull");
	// req: R-1050
	check("entryInvokes: win32 recognizes an exec-form entry", entryInvokes({ command: "node", args: ["/h/nana-objective.mjs"] }, objSpec, "win32"));
	// req: R-1050
	check("entryInvokes: win32 a non-array args reads as not installed", !entryInvokes({ command: "node", args: "/h/nana-objective.mjs" }, objSpec, "win32"));
	check("entryInvokes: win32 a non-string args element reads as not installed", !entryInvokes({ command: "node", args: [123] }, objSpec, "win32"));
	// req: R-1050
	check("entryInvokes: win32 an exec command of NODE_NO_WARNINGS=1 with node in args reads as not installed", !entryInvokes({ command: "NODE_NO_WARNINGS=1", args: ["node", "/r/packages/nana-knowledge/bin/nana-knowledge.ts", "hook"] }, knowledgeSpec, "win32"));
	// req: R-1061
	check("entryInvokes: POSIX reads a copied Windows exec fragment as not installed", !entryInvokes({ command: "node", args: ["C:\\Users\\jake\\nana-pi/packages/nana-setup/claude/hooks/nana-objective.mjs"] }, objSpec, undefined));
	// req: R-1061
	check("entryInvokes: an entry carrying args with a shell-form command reads as commandInvokes reads its command (POSIX)", entryInvokes({ command: "node '/h/nana-objective.mjs'", args: ["whatever", "ignored"] }, objSpec, undefined) === commandInvokes("node '/h/nana-objective.mjs'", objSpec));
}
{
	const settings = { hooks: { SessionStart: [{ hooks: [{ type: "command", command: "node", args: ["/h/nana-objective.mjs"], timeout: 5 }] }] } };
	// req: R-1051
	check("hasHook on win32 finds an exec-form entry under the expected event and matcher", hasHook(settings, "SessionStart", spec("SessionStart objective"), undefined, "win32"));
	check("hasHook on win32 does not find it under a different matcher", !hasHook(settings, "SessionStart", spec("SessionStart objective"), "Bash", "win32"));
}
{
	const stale = { hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: "node", args: ["/missing/packages/nana-knowledge/bin/nana-knowledge.ts", "hook"], timeout: 5 }] }] } };
	// req: R-1055
	check("hookTargets reads an exec-form target on win32", hookTargets(stale, "UserPromptSubmit", spec("UserPromptSubmit knowledge pull"), "win32").length === 1);
}
{
	const wantedWin = desiredHooks({ hooksDir: "/unused", repoRoot: "/repo", platform: "win32" });
	const objWin = wantedWin.find((w) => w.label === "SessionStart objective");
	const wantedPosix = desiredHooks({ hooksDir: "/h", repoRoot: "/repo" });
	const knowledgeWin = wantedWin.find((w) => w.label === "UserPromptSubmit knowledge pull");
	const knowledgePosix = wantedPosix.find((w) => w.label === "UserPromptSubmit knowledge pull");
	const objPosix = wantedPosix.find((w) => w.label === "SessionStart objective");
	// req: R-1056
	check("installerTarget accepts the POSIX knowledge form on every platform", installerTarget({ command: "NODE_NO_WARNINGS=1 node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5 }, knowledgeWin, "win32")?.form === "posix" && installerTarget({ command: "NODE_NO_WARNINGS=1 node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5 }, knowledgePosix, undefined)?.form === "posix");
	// req: R-1056
	check("installerTarget accepts the earlier win32 knowledge form", installerTarget({ command: "node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5 }, knowledgeWin, "win32")?.form === "win32-legacy");
	// req: R-1050
	// req: R-1056
	check("installerTarget accepts the R-1050 exec form", installerTarget({ command: "node", args: ["/old/packages/nana-setup/claude/hooks/nana-objective.mjs"], timeout: 5 }, objWin, "win32")?.form === "win32-exec");
	// req: R-923
	check("installerTarget rejects an extra args element", installerTarget({ command: "node", args: ["/old/packages/nana-setup/claude/hooks/nana-objective.mjs", "--extra"], timeout: 5 }, objWin, "win32") === null);
	// req: R-923
	check("installerTarget rejects a relative path", installerTarget({ command: "node", args: ["packages/nana-setup/claude/hooks/nana-objective.mjs"], timeout: 5 }, objWin, "win32") === null);
	// req: R-1056
	// req: R-653
	check("installerTarget on win32 rejects a shell form carrying args", installerTarget({ command: "node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", args: ["ignored"], timeout: 5 }, knowledgeWin, "win32") === null);
	// req: R-1061
	// req: R-653
	check("installerTarget on POSIX rejects the two win32-only forms", installerTarget({ command: "node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5 }, knowledgePosix, undefined) === null && installerTarget({ command: "node", args: ["/old/packages/nana-setup/claude/hooks/nana-objective.mjs"], timeout: 5 }, objPosix, undefined) === null);
}
{
	const wantedWin32 = desiredHooks({ hooksDir: "/unused", repoRoot: "/repo", platform: "win32" });
	const settings = { hooks: {} };
	for (const w of wantedWin32) {
		settings.hooks[w.event] ??= [];
		let group = settings.hooks[w.event].find((g) => g.matcher === w.matcher);
		if (!group) { group = { ...(w.matcher ? { matcher: w.matcher } : {}), hooks: [] }; settings.hooks[w.event].push(group); }
		group.hooks.push(w.entry);
	}
	settings.hooks.SessionStart[0].hooks.push({ type: "command", command: "node", args: ["/repo/packages/nana-setup/claude/hooks/nana-objective.mjs", "--extra"], timeout: 5, statusMessage: "nana: objective + current priority" });
	const removed = removeInstallerHooks(settings, { hooksDir: "/unused", repoRoot: "/repo", platform: "win32" });
	// req: R-1050
	check("forced-win32 removeInstallerHooks removes exactly the five entries", removed.length === 5, JSON.stringify(removed));
	check("forced-win32 removeInstallerHooks keeps the entry whose args differ", settings.hooks.SessionStart[0].hooks.length === 1 && settings.hooks.SessionStart[0].hooks[0].args.includes("--extra"), JSON.stringify(settings.hooks.SessionStart));
}

/* --- exact legacy SessionStart entries migrate in place -------------------------------- */
{
	const foreign = { type: "command", command: "echo foreign", timeout: 5, statusMessage: "other" };
	const settings = { hooks: { SessionStart: [{ hooks: [
		{ type: "command", command: "bash ~/.claude/hooks/nana-objective.sh", timeout: 5, statusMessage: "nana: objective + current priority" },
		foreign,
		{ type: "command", command: "bash '/Users/jwang/.claude/hooks/nana-adoption.sh'", timeout: 5, statusMessage: "nana: unadopted repositories" },
	] }] } };
	// req: R-908
	check("legacy managed bash hooks replace commands in place", migrateLegacyHooks(settings, { hooksDir: "/Users/jwang/.claude/hooks", claudeHome: "/Users/jwang/.claude" }) && settings.hooks.SessionStart[0].hooks[0].command === "node '/Users/jwang/.claude/hooks/nana-objective.mjs'" && settings.hooks.SessionStart[0].hooks[2].command === "node '/Users/jwang/.claude/hooks/nana-adoption.mjs'" && settings.hooks.SessionStart[0].hooks[1] === foreign && settings.hooks.SessionStart[0].hooks.length === 3);
}

/* --- near-match legacy entries are not migrated -------------------------------------- */
{
	const entries = [
		{ type: "command", command: "bash ~/.claude/hooks/nana-objective.sh", timeout: 5, statusMessage: "nana: objective + current priority", owner: "foreign" },
		{ type: "command", command: "bash ~/.claude/hooks/nana-objective.sh", timeout: 6, statusMessage: "nana: objective + current priority" },
		{ type: "command", command: "bash ~/.claude/hooks/nana-objective.sh", timeout: 5, statusMessage: "custom objective message" },
		{ type: "command", command: "bash ~/.claude/hooks/nana-objective-custom.sh", timeout: 5, statusMessage: "nana: objective + current priority" },
		{ type: "prompt", command: "bash ~/.claude/hooks/nana-objective.sh", timeout: 5, statusMessage: "nana: objective + current priority" },
	];
	const wrongEvent = { type: "command", command: "bash ~/.claude/hooks/nana-objective.sh", timeout: 5, statusMessage: "nana: objective + current priority" };
	const settings = { hooks: { SessionStart: [{ hooks: entries }], Stop: [{ hooks: [wrongEvent] }] } };
	const before = JSON.stringify(settings);
	// req: R-908
	check("near-match legacy entries stay byte-identical across keys, fields, command, and event", !migrateLegacyHooks(settings, { hooksDir: "/Users/jwang/.claude/hooks", claudeHome: "/Users/jwang/.claude" }) && JSON.stringify(settings) === before);
}

/* --- unit: a disabled look-alike must NOT count as installed -------------------------- */
{
	const s = { hooks: { SessionStart: [{ hooks: [{ type: "command", command: "echo nana-objective.sh.disabled" }] }] } };
	const r = mergeHooks(s, wanted);
	// req: R-923
	check("a look-alike command does not suppress the real hook", r.added.includes("SessionStart objective"));
	// req: R-923
	check("the look-alike is still there, untouched", s.hooks.SessionStart[0].hooks[0].command === "echo nana-objective.sh.disabled");
	check("hasHook now reports the real hook", hasHook(s, "SessionStart", spec("SessionStart objective")));
}

const tmps = [];
function freshHome(prefix = "nana-setup-settings-") {
	const td = tmpDir(path.join(os.tmpdir(), prefix));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	fs.mkdirSync(path.join(td, ".claude"), { recursive: true });
	return td;
}
const run = (args, home) => spawnSync(process.execPath, [cli, ...args, "--home", home], { encoding: "utf8" });

/* --- end to end: a real settings.json with foreign hooks ------------------------------ */
{
	const home = freshHome();
	const original = {
		model: "fable",
		hooks: {
			UserPromptSubmit: [{ hooks: [
			{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh" },
			{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh --custom" },
		] }],
			PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "bash ~/.claude/hooks/block-dangerous-bash.sh" }] }],
		},
	};
	fs.writeFileSync(path.join(home, ".claude", "settings.json"), JSON.stringify(original, null, 2) + "\n", { mode: 0o600 });
	const r = run(["install"], home);
	check("install over an existing settings.json exits 0", r.status === 0, r.stderr);
	const after = JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8"));
	check("model key survives", after.model === "fable");
	const preTool = after.hooks.PreToolUse.flatMap((group) => group.hooks);
	// req: R-985
	check("PreToolUse preserves the foreign hook and appends the Node verifier hook", preTool[0].command === original.hooks.PreToolUse[0].hooks[0].command && preTool.some((entry) => entry.command.endsWith("/verifier-pipe.mjs'")));
	// req: R-660
	check("exact nana context invocation is removed", !JSON.stringify(after).includes('"command": "bash ~/.claude/hooks/context-size-check.sh"'), JSON.stringify(after));
	// req: R-660
	check("owner command variant with arguments is preserved", after.hooks.UserPromptSubmit[0].hooks.some((h) => h.command === "bash ~/.claude/hooks/context-size-check.sh --custom"));
	check("retirement reports that the hook was removed", /UserPromptSubmit context-size retirement/.test(r.stdout), r.stdout);
	check("the knowledge hook was added", JSON.stringify(after).includes("nana-knowledge.ts"));
	// req: R-321
	check("file mode is preserved across the atomic write", (fs.statSync(path.join(home, ".claude", "settings.json")).mode & 0o777) === 0o600);
	check("no temp file is left behind", fs.readdirSync(path.join(home, ".claude")).every((f) => !f.includes(".tmp")));
	const again = run(["install"], home);
	check("re-install reports nothing to do", again.stdout.includes("nothing to do"));
}

/* --- end-to-end: retained retired commands fail installation ------------------------- */
{
	const home = freshHome();
	const command = "/bin/bash /x/nana-objective.sh";
	fs.writeFileSync(path.join(home, ".claude", "settings.json"), JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: "command", command }] }] } }));
	const r = run(["install"], home);
	const after = JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8"));
	// req: R-909
	check("install reports retained retired bash invocation as PROBLEM and exits nonzero", r.status === 1 && /PROBLEM.*retired/i.test(r.stdout) && r.stdout.includes(command) && after.hooks.SessionStart.some((group) => group.hooks.some((entry) => entry.command === command)), r.stdout + r.stderr);
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

/* --- end to end: valid JSON with an impossible shape is also a no-op ------------------- */
{
	const home = freshHome();
	const weird = '{"hooks":"disabled"}';
	fs.writeFileSync(path.join(home, ".claude", "settings.json"), weird);
	const r = run(["install"], home);
	check('{"hooks":"disabled"}: non-zero exit', r.status === 2, String(r.status));
	check('{"hooks":"disabled"}: the message says what is wrong', /shape this installer will not edit/.test(r.stderr), r.stderr);
	check('{"hooks":"disabled"}: settings untouched', fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8") === weird);
	check('{"hooks":"disabled"}: NO files were moved', !fs.existsSync(path.join(home, ".claude", "hooks")) && !fs.existsSync(path.join(home, ".claude", "rules")));
	check('{"hooks":"disabled"}: no shared memory dir', !fs.existsSync(path.join(home, ".claude", "nana-memory")));
	check('{"hooks":"disabled"}: no pi seeds', !fs.existsSync(path.join(home, ".pi", "agent", "nana-pack.json")));
	check('{"hooks":"disabled"}: no PATH entry', !fs.existsSync(path.join(home, ".local", "bin", "pi-review")));
}

/* --- stale knowledge-hook migration is atomic and leaves unknown hooks untouched -------- */
{
	const home = freshHome();
	const file = path.join(home, ".claude", "settings.json");
	const unknown = { type: "command", command: "node /hand-written/packages/nana-knowledge/bin/nana-knowledge.ts hook", timeout: 5, statusMessage: "personal knowledge" };
	const customized = { type: "command", command: "NANA_KNOWLEDGE_HOME=/custom node /old-clone/packages/nana-knowledge/bin/nana-knowledge.ts hook", timeout: 5, statusMessage: "nana: knowledge pull" };
	const stale = "NODE_NO_WARNINGS=1 node '/old-clone/packages/nana-knowledge/bin/nana-knowledge.ts' hook";
	fs.writeFileSync(file, JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [
		{ type: "command", command: stale, timeout: 5, statusMessage: "nana: knowledge pull" },
		unknown,
		customized,
	] }] } }, null, 2) + "\n", { mode: 0o600 });
	const r = run(["install"], home);
	const text = fs.readFileSync(file, "utf8");
	const after = JSON.parse(text);
	const commands = after.hooks.UserPromptSubmit[0].hooks.map((hook) => hook.command);
	// req: R-394
	check("install replaces its stale hook without a duplicate", r.status === 0 && !text.includes(stale) && commands.filter((command) => command.includes(path.join(repo, "packages", "nana-knowledge", "bin", "nana-knowledge.ts")) && command.includes(" hook")).length === 1 && commands[0].includes(path.join(repo, "packages", "nana-knowledge", "bin", "nana-knowledge.ts")), JSON.stringify(commands));
	// req: R-653
	check("install preserves customized knowledge hook entry byte-for-byte", JSON.stringify(after.hooks.UserPromptSubmit[0].hooks[2]) === JSON.stringify(customized));
}

/* --- the atomic write refuses to clobber a concurrent edit ---------------------------- */
{
	const home = freshHome();
	const file = path.join(home, ".claude", "settings.json");
	const original = { hooks: { SessionStart: [{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/session-start.sh" }] }] } };
	fs.writeFileSync(file, JSON.stringify(original, null, 2) + "\n", { mode: 0o600 });
	const layout = resolveLayout({ home });
	const { settings, snapshot } = readClaudeSettings(layout);
	mergeHooks(settings, wanted);

	// ...another process adds a hook while we were merging
	const foreign = JSON.parse(fs.readFileSync(file, "utf8"));
	foreign.hooks.SessionStart[0].hooks.push({ type: "command", command: "bash ~/.claude/hooks/someone-elses.sh" });
	fs.writeFileSync(file, JSON.stringify(foreign, null, 2) + "\n");

	let err = null;
	try {
		writeSettingsAtomic(file, serialize(settings), snapshot);
	} catch (e) {
		err = e;
	}
	check("concurrent edit: the write is refused", err instanceof SetupError, String(err));
	check("concurrent edit: the message says another process wrote to it", /changed on disk while nana-setup was running/.test(err?.message ?? ""));
	const after = JSON.parse(fs.readFileSync(file, "utf8"));
	check("concurrent edit: the foreign hook is intact", after.hooks.SessionStart[0].hooks.some((h) => h.command.includes("someone-elses.sh")));
	check("concurrent edit: our entries were NOT written", !JSON.stringify(after).includes("nana-objective.mjs"));
	check("concurrent edit: no temp file left behind", fs.readdirSync(path.join(home, ".claude")).every((f) => !f.includes(".tmp")));

	// and with a fresh snapshot it goes through, atomically and with the mode kept
	const fresh = readClaudeSettings(layout);
	mergeHooks(fresh.settings, wanted);
	writeSettingsAtomic(file, serialize(fresh.settings), fresh.snapshot);
	const done = JSON.parse(fs.readFileSync(file, "utf8"));
	check("after re-reading: the write goes through", JSON.stringify(done).includes("nana-objective.mjs"));
	check("after re-reading: the foreign hook is still there", JSON.stringify(done).includes("someone-elses.sh"));
	check("after re-reading: mode preserved", (fs.statSync(file).mode & 0o777) === 0o600);
}

/* --- the lock holds the whole read -> write -> rename sequence ------------------------- */
// There is NO stale-lock reclamation on purpose (sol r3): reclaiming under the same lock is a
// race, and a one-shot installer does not earn a second lock. A leftover lock is a human's call.
const lockOf = (home) => path.join(home, ".claude", ".settings.json.nana-setup.lock");

{
	const home = freshHome();
	const r = run(["install"], home);
	check("lock: a normal install leaves no lock file", r.status === 0 && !fs.existsSync(lockOf(home)), r.stdout);
}
{
	const home = freshHome();
	fs.writeFileSync(path.join(home, ".claude", "settings.json"), "{}\n", { mode: 0o600 });
	const held = { pid: 4242, at: Date.now() - 90_000 };
	fs.writeFileSync(lockOf(home), JSON.stringify(held));
	const r = run(["install"], home);
	check("lock: an existing lock aborts the install", r.status === 2, String(r.status));
	check("lock: the message prints the lock path", r.stderr.includes(lockOf(home)), r.stderr);
	check("lock: the message prints the recorded pid", r.stderr.includes("pid 4242"), r.stderr);
	check("lock: the message prints the recorded age", /\b9\ds ago\b/.test(r.stderr), r.stderr);
	check("lock: the message prints the exact rm command", r.stderr.includes(`rm ${lockOf(home)}`), r.stderr);
	check("lock: settings were not written", fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8") === "{}\n");
// req: R-925
	check("lock: the other run's lock is left exactly as it was", fs.readFileSync(lockOf(home), "utf8") === JSON.stringify(held));
}
{
	// an old lock is NOT reclaimed — no age threshold, no pid liveness check
	const home = freshHome();
	fs.writeFileSync(lockOf(home), JSON.stringify({ pid: 999999, at: Date.now() - 86_400_000 }));
	const r = run(["install"], home);
	check("lock: a day-old lock with a dead pid still aborts", r.status === 2, r.stdout);
// req: R-925
	check("lock: it was not unlinked", fs.existsSync(lockOf(home)));
	check("lock: a corrupt lock file aborts too", (() => {
		fs.writeFileSync(lockOf(home), "not json");
		const r2 = run(["install"], home);
		return r2.status === 2 && r2.stderr.includes("unrecorded pid") && fs.existsSync(lockOf(home));
	})());
	// and once the human clears it, the install goes through
	fs.rmSync(lockOf(home));
	const r3 = run(["install"], home);
	check("lock: after `rm`, the install runs", r3.status === 0, r3.stderr);
	check("lock: and leaves no lock behind", !fs.existsSync(lockOf(home)));
}
{
	// --dry-run never takes the lock, and is not blocked by one
	const home = freshHome();
	fs.writeFileSync(lockOf(home), JSON.stringify({ pid: process.pid, at: Date.now() }));
	const r = run(["install", "--dry-run"], home);
	check("lock: --dry-run is not blocked by a lock", r.status === 0, r.stderr);
	check("lock: --dry-run reports what it would add", /settings SessionStart objective\s+created/.test(r.stdout), r.stdout);
	check("lock: --dry-run wrote nothing", !fs.existsSync(path.join(home, ".claude", "hooks")));
	check("lock: --dry-run left the foreign lock alone", fs.existsSync(lockOf(home)));
}
{
	// the lock is released even when the write aborts
	const home = freshHome();
	const file = path.join(home, ".claude", "settings.json");
	fs.writeFileSync(file, "{}\n", { mode: 0o600 });
	const layout = resolveLayout({ home });
	const state = readClaudeSettings(layout);
	fs.writeFileSync(file, '{"model":"other"}\n'); // changed since the preflight
	let err = null;
	try {
		stepSettings(layout, { dryRun: false }, state);
	} catch (e) {
		err = e;
	}
	check("lock: a stale preflight snapshot aborts inside the lock", err instanceof SetupError, String(err));
	check("lock: released after the abort", !fs.existsSync(lockOf(home)));
	check("lock: the newer file is intact", fs.readFileSync(file, "utf8") === '{"model":"other"}\n');
}
{
	// withSettingsLock itself: one holder at a time, released on throw
	const home = freshHome();
	const file = path.join(home, ".claude", "settings.json");
	let inner = null;
	withSettingsLock(file, () => {
		check("lock: the file exists while held", fs.existsSync(lockOf(home)));
		try {
			withSettingsLock(file, () => "should not run");
		} catch (e) {
			inner = e;
		}
	});
	// req: R-321
	check("lock: a second acquisition is refused", inner instanceof SetupError, String(inner));
	check("lock: the refusal names our own pid", (inner?.message ?? "").includes(`pid ${process.pid}`));
	check("lock: released after the outer call", !fs.existsSync(lockOf(home)));
	let threw = false;
	try {
		withSettingsLock(file, () => {
			throw new Error("boom");
		});
	} catch {
		threw = true;
	}
	// req: R-321
	check("lock: released when the body throws", threw && !fs.existsSync(lockOf(home)));
	// a lock someone else replaced ours with is never unlinked by us
	withSettingsLock(file, () => fs.writeFileSync(lockOf(home), JSON.stringify({ pid: 4242, at: Date.now() })));
// req: R-925
	check("lock: a replacement lock is left alone", fs.existsSync(lockOf(home)));
	fs.rmSync(lockOf(home));
}

/* --- the re-compare sits AFTER the temp file is written -------------------------------- */
{
	const home = freshHome();
	const file = path.join(home, ".claude", "settings.json");
	const original = { hooks: { SessionStart: [{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/session-start.sh" }] }] } };
	fs.writeFileSync(file, JSON.stringify(original, null, 2) + "\n", { mode: 0o600 });
	const layout = resolveLayout({ home });
	const state = readClaudeSettings(layout);

	// an external writer that ignores the lock, landing while the temp file already exists
	const foreign = JSON.parse(JSON.stringify(original));
	foreign.hooks.SessionStart[0].hooks.push({ type: "command", command: "bash ~/.claude/hooks/someone-elses.sh" });
	const foreignRaw = JSON.stringify(foreign, null, 2) + "\n";
	let tempExisted = null;
	let err = null;
	try {
		stepSettings(layout, {
			dryRun: false,
			afterTempWrite: (tmp) => {
				tempExisted = fs.existsSync(tmp) && fs.readFileSync(tmp, "utf8").includes("nana-objective.mjs");
				fs.writeFileSync(file, foreignRaw);
			},
		}, state);
	} catch (e) {
		err = e;
	}
	// req: R-321
	check("post-write: the temp file was fully written before the compare", tempExisted === true);
	// req: R-321
	check("post-write: the write aborts", err instanceof SetupError, String(err));
	check("post-write: the message says another process wrote to it", /changed on disk while nana-setup was running/.test(err?.message ?? ""));
	// req: R-321
	check("post-write: the temp file was removed", fs.readdirSync(path.join(home, ".claude")).every((f) => !f.includes(".tmp")), fs.readdirSync(path.join(home, ".claude")).join(" "));
	// req: R-321
	check("post-write: the external writer's bytes are intact", fs.readFileSync(file, "utf8") === foreignRaw);
	check("post-write: our entries were NOT written", !fs.readFileSync(file, "utf8").includes("nana-objective.sh"));
	check("post-write: the lock was released", !fs.existsSync(lockOf(home)));

	// with a fresh preflight it goes through, keeping the foreign hook and the mode
	const fresh = readClaudeSettings(layout);
	stepSettings(layout, { dryRun: false }, fresh);
	const after = fs.readFileSync(file, "utf8");
	check("post-write: a clean re-run writes our entries", after.includes("nana-objective.mjs"));
	check("post-write: the foreign hook survives", after.includes("someone-elses.sh"));
	check("post-write: mode preserved", (fs.statSync(file).mode & 0o777) === 0o600);
}

/* --- install() passes the seam through, so the whole run is exercised ------------------- */
{
	const home = freshHome();
	const file = path.join(home, ".claude", "settings.json");
	fs.writeFileSync(file, "{}\n", { mode: 0o600 });
	const layout = resolveLayout({ home });
	let err = null;
	try {
		install(layout, { afterTempWrite: () => fs.writeFileSync(file, '{"model":"sneaked-in"}\n') });
	} catch (e) {
		err = e;
	}
	check("full install: aborts on a write that lands after the temp file", err instanceof SetupError, String(err));
	check("full install: the sneaked-in bytes survive", fs.readFileSync(file, "utf8") === '{"model":"sneaked-in"}\n');
	check("full install: no temp or lock left behind", fs.readdirSync(path.join(home, ".claude")).every((f) => !f.includes(".tmp") && !f.includes(".lock")), fs.readdirSync(path.join(home, ".claude")).join(" "));
	check("full install: the steps BEFORE settings did run (hooks are in place)", fs.lstatSync(path.join(home, ".claude", "hooks", "nana-objective.mjs")).isSymbolicLink());
	check("full install: the steps AFTER settings did not (no pi seed)", !fs.existsSync(path.join(home, ".pi", "agent", "nana-pack.json")));
}

/* --- managed legacy SessionStart objects migrate in place through installation ---------- */
{
	const home = freshHome();
	const layout = resolveLayout({ home });
	const file = layout.claudeSettings;
	const before = { type: "command", command: "foreign-before", opaque: { keep: true } };
	const after = { type: "command", command: "foreign-after", opaque: [1, 2] };
	const message = (name) => ({ objective: "nana: objective + current priority", shared: "nana: shared memory index", adoption: "nana: unadopted repositories" })[name];
	const old = (name, command) => ({ type: "command", command, timeout: 5, statusMessage: message(name) });
	const settings = { hooks: { SessionStart: [{ hooks: [
		before,
		old("objective", "bash ~/.claude/hooks/nana-objective.sh"),
		old("shared", "bash ~/.claude/hooks/nana-shared-memory.sh"),
		old("adoption", `bash ${shq(path.join(layout.hooksDir, "nana-adoption.sh"))}`),
		after,
	] }] } };
	fs.writeFileSync(file, JSON.stringify(settings, null, 2) + "\n");
	const dry = run(["install", "--dry-run"], home);
	// req: R-908
	check("dry-run reports the in-place legacy migration as would-migrate", dry.status === 0 && /SessionStart retired hook migration.*would migrate/i.test(dry.stdout));
	const result = run(["install"], home);
	// req: R-908
	check("install reports the in-place legacy migration as UPDATED", result.status === 0 && /SessionStart retired hook migration.*updated/i.test(result.stdout));
	const migrated = JSON.parse(fs.readFileSync(file, "utf8")).hooks.SessionStart[0].hooks;
	const expected = ["nana-objective.mjs", "nana-shared-memory.mjs", "nana-adoption.mjs"];
	// req: R-908
	check("install migrates the three exact legacy commands in place without disturbing foreign objects", result.status === 0 && migrated.length === 5 && migrated[0].command === before.command && migrated[4].command === after.command && JSON.stringify(migrated[0]) === JSON.stringify(before) && JSON.stringify(migrated[4]) === JSON.stringify(after) && migrated.slice(1, 4).every((entry, index) => entry.command === `node ${shq(path.join(layout.hooksDir, expected[index]))}`));
	const again = run(["install"], home);
	// req: R-908
	check("second install after migration reports nothing to do", again.status === 0 && /nothing to do/.test(again.stdout));
}

/* --- stale-hook migration uses the same concurrent-write protection ------------------- */
{
	const home = freshHome();
	const file = path.join(home, ".claude", "settings.json");
	fs.writeFileSync(file, JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [
		{ type: "command", command: "NODE_NO_WARNINGS=1 node '/old-clone/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5, statusMessage: "nana: knowledge pull" },
	] }] } }, null, 2) + "\n");
	const concurrent = JSON.stringify({ model: "concurrent writer" }, null, 2) + "\n";
	let err = null;
	try {
		install(resolveLayout({ home }), { afterTempWrite: () => fs.writeFileSync(file, concurrent) });
	} catch (error) { err = error; }
	// req: R-394
	check("stale-hook migration refuses a concurrent replacement and preserves its bytes", err instanceof SetupError && fs.readFileSync(file, "utf8") === concurrent);
}

/* --- forced win32: a hand-written exec-form variant is kept byte for byte, no twin (R-923) ---- */
{
	const home = freshHome("nana-setup-win32-variant-");
	const file = path.join(home, ".claude", "settings.json");
	const hookPath = `${repo}/packages/nana-setup/claude/hooks/nana-objective.mjs`;
	const handWritten = { type: "command", command: "node", args: [hookPath], timeout: 5, statusMessage: "my own objective message" };
	fs.writeFileSync(file, JSON.stringify({ hooks: { SessionStart: [{ hooks: [handWritten] }] } }, null, 2) + "\n");
	const r = spawnSync(process.execPath, [cli, "install", "--home", home], { encoding: "utf8", env: { ...process.env, NANA_SETUP_PLATFORM: "win32" } });
	const after = JSON.parse(fs.readFileSync(file, "utf8"));
	const objectiveEntries = after.hooks.SessionStart[0].hooks.filter((h) => JSON.stringify(h).includes("nana-objective.mjs"));
	// req: R-923
	check("forced win32: a hand-written exec-form variant is kept byte for byte, no twin", r.status === 0 && objectiveEntries.length === 1 && JSON.stringify(objectiveEntries[0]) === JSON.stringify(handWritten), JSON.stringify(objectiveEntries));
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
