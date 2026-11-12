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
const { commandInvokes, desiredHooks, retiredKnowledgeHook, entryInvokes, hasHook, hookTargets, installerTarget, mergeHooks, mergeRepoHooks, serialize, shq, migrateLegacyHooks } = await import(new URL("../lib/settings.mjs", import.meta.url).href);
const { SetupError, install, readClaudeSettings, stepSettings, withSettingsLock, writeSettingsAtomic } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { resolveLayout, platform } = await import(new URL("../lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};
const skip = (n, why) => console.log("SKIP", n, "—", why);
const posixModeReason = "POSIX mode bits (win32 stat reports a fixed mode regardless of what was requested)";

const wanted = desiredHooks({ hooksDir: "/h", repoRoot: "/r" });
// Historical descriptors exercise public helpers, not install's active wanted set.
const historicalHooks = options => [...desiredHooks(options), retiredKnowledgeHook(options)];
const spec = (label) => (wanted.find((w) => w.label === label) ?? retiredKnowledgeHook()).spec;
check("five active hook entries are wanted", wanted.length === 5);

/* --- paths are quoted, so a space in the home or clone still runs --------------------- */
{
	const w = historicalHooks({ hooksDir: "/Users/Jane Doe/.claude/hooks", repoRoot: "/Users/Jane Doe/nana-pi" });
	// req: R-319
	check("Node hook commands single-quote the path", w[0].entry.command === "node '/Users/Jane Doe/.claude/hooks/nana-objective.mjs'");
	check("the node command single-quotes the path", w.find((x) => x.label === "UserPromptSubmit knowledge pull").entry.command === "NODE_NO_WARNINGS=1 node '/Users/Jane Doe/nana-pi/packages/nana-knowledge/bin/nana-knowledge.ts' hook");
	// req: R-319
	check("a quote inside a path is escaped", shq("/a/b'c/d") === `'/a/b'\\''c/d'`);
	for (const entry of w) check(`quoted command still matches its own spec (${entry.label})`, commandInvokes(entry.entry.command, entry.spec));
}

{
	const objective = spec("SessionStart objective");
	const knowledge = spec("UserPromptSubmit knowledge pull");
	const script = objective.script;
	const knowledgePath = "/r/packages/nana-knowledge/bin/nana-knowledge.ts";
	const cases = [
		[objective, `node '/a b/${script}'`, true],
		[objective, `node \"/a b/${script}\"`, true],
		[objective, `node /a\\ b/${script}`, true],
		[objective, `NODE_NO_WARNINGS=1 node /x/${script}`, true],
		[objective, `A=1 B=2 node /x/${script}`, true],
		[objective, `/usr/bin/node /x/${script}`, true],
		[knowledge, `NODE_NO_WARNINGS=1 node '${knowledgePath}' hook`, true],
		[objective, `node '/x/${script}`, false],
		[objective, `echo node /x/${script}`, false],
		[objective, `env node /x/${script}`, false],
		[objective, `echo /x/${script}`, false],
		[objective, `cat /x/${script}`, false],
		[objective, `node /x/old-${script}`, false],
		[objective, `node /x/${script}.disabled`, false],
		[objective, `node --inspect /x/${script}`, false],
		[objective, `nodemon /x/${script}`, false],
		[knowledge, `node ${knowledgePath} build`, false],
		[knowledge, `node ${knowledgePath}`, false],
		[knowledge, `node ${knowledgePath} build hook`, false],
		[objective, `node '/x/a && b/${script}'`, true],
		[objective, `node $HOME/x/${script}`, true],
		[objective, "node ~/.claude/hooks/nana-shared-memory.mjs", false],
		...["&&", "||", ";", "|", ">", "<", "&", "$(", "`"].map(op => [objective, `node /x/${script} ${op} z`, false]),
	];
	const results = cases.map(([hookSpec, command, expected]) => ({ command, expected, actual: commandInvokes(command, hookSpec) }));
	// req: R-317 R-922
	check("R-317: a hook counts as present only when its command, read with shell quoting and leading VAR=value words dropped, runs the interpreter on a path ending in the script with the expected argument",
		results.every((result) => result.actual === result.expected), JSON.stringify(results));
}

/* --- unit: merge into an empty object ------------------------------------------------- */
{
	const s = {};
	const r = mergeHooks(s, wanted);
	check("empty settings: all five active entries added", r.added.length === 5);
	check("empty settings: one group per event", s.hooks.SessionStart.length === 1 && s.hooks.UserPromptSubmit === undefined);
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
	check("nana SessionStart hooks appended to the same group", s.hooks.SessionStart[0].hooks.length === 5 && s.hooks.SessionStart.length === 1);
	// req: R-316
	check("a matcher-scoped group is left alone", s.hooks.UserPromptSubmit[0].matcher === "Bash" && s.hooks.UserPromptSubmit[0].hooks.length === 1);
	// req: R-316
	check("unrelated events untouched", JSON.stringify(s.hooks.Stop) === before);
	// req: R-316
	check("unrelated top-level keys untouched", s.permissions.defaultMode === "auto");
	const all = JSON.stringify(s);
	check("second merge is a no-op", mergeHooks(s, wanted).added.length === 0 && JSON.stringify(s) === all);
}

/* --- matcher scans retain the review regression on an active win32 hook ---------------- */
{
	const wantedMatcher = desiredHooks({ hooksDir: "/unused", repoRoot: repo, platform: "win32" });
	const objective = wantedMatcher.find(w => w.label === "SessionStart objective");
	for (const healthy of [false, true]) {
		const entry = healthy ? { ...objective.entry } : { ...objective.entry, args: ["/old-clone/packages/nana-setup/claude/hooks/nana-objective.mjs"] };
		const before = JSON.stringify(entry);
		const settings = { hooks: { SessionStart: [{ matcher: "*", hooks: [entry] }] } };
		const result = mergeRepoHooks(settings, { repoRoot: repo, wanted: wantedMatcher, platform: "win32" });
		const row = result[objective.label];
		// req: R-1056
		check(`every group is scanned regardless of matcher: ${healthy ? "healthy" : "stale"} active win32 entry under matcher "*", no twin`,
			row.found && row.replaced === !healthy && settings.hooks.SessionStart[0].hooks.length === 1 &&
			JSON.stringify(settings.hooks.SessionStart[0].hooks[0]) === (healthy ? before : JSON.stringify(objective.entry)));
	}
}

/* --- win32 exec form: desiredHooks, entryInvokes, hasHook, hookTargets, installerTarget ------- */
{
	// (R-1050, R-1051) every win32 entry is exec form, unquoted and unescaped, from the checkout.
	const weird = "/Users/Jane Doe/nana pi $x `y %z% o'q";
	const w32 = desiredHooks({ hooksDir: "/unused", repoRoot: weird, platform: "win32" });
	// req: R-1050
	check("win32 desiredHooks: every entry is exec form with no shell key", w32.every((w) => w.entry.command === "node" && Array.isArray(w.entry.args) && !("shell" in w.entry)));
	// req: R-1051
	check("win32 desiredHooks: the four SessionStart entries name packages/nana-setup/claude/hooks/", ["nana-objective.mjs", "nana-adoption.mjs", "nana-shared-memory.mjs", "nana-roster-notice.mjs"].every((name) => w32.find((w) => w.spec.script === name).entry.args[0] === `${weird}/packages/nana-setup/claude/hooks/${name}`));
	// req: R-1050
	check("win32 desiredHooks: no active entry adds a subcommand", w32.every(w => w.entry.args.length === 1));
}
{
	// (R-1061) POSIX desiredHooks is byte-identical to today's, with or without an explicit non-win32 platform.
	const canon = (v) => (Array.isArray(v) ? v.map(canon) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])) : v);
	const eq = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));
	const fixture = [
		{ event: "SessionStart", label: "SessionStart objective", marker: "nana-objective.mjs", spec: { interpreters: ["node"], script: "nana-objective.mjs" }, entry: { type: "command", command: "node '/h/nana-objective.mjs'", timeout: 5, statusMessage: "nana: objective + current priority" } },
		{ event: "SessionStart", label: "SessionStart adoption", marker: "nana-adoption.mjs", spec: { interpreters: ["node"], script: "nana-adoption.mjs" }, entry: { type: "command", command: "node '/h/nana-adoption.mjs'", timeout: 5, statusMessage: "nana: unadopted repositories" } },
		{ event: "SessionStart", label: "SessionStart shared-memory", marker: "nana-shared-memory.mjs", spec: { interpreters: ["node"], script: "nana-shared-memory.mjs" }, entry: { type: "command", command: "node '/h/nana-shared-memory.mjs'", timeout: 5, statusMessage: "nana: shared memory index" } },
		{ event: "SessionStart", label: "SessionStart roster notice", marker: "nana-roster-notice.mjs", spec: { interpreters: ["node"], script: "nana-roster-notice.mjs" }, entry: { type: "command", command: "node '/h/nana-roster-notice.mjs'", timeout: 5, statusMessage: "nana: roster notice" } },
		{ event: "PreToolUse", matcher: "Bash", label: "PreToolUse rm guard", marker: "nana-rm-guard.mjs", spec: { interpreters: ["node"], script: "nana-rm-guard.mjs" }, entry: { type: "command", command: "node '/h/nana-rm-guard.mjs'", timeout: 5, statusMessage: "nana: agent deletion guard" } },
	];
	// req: R-1061
	// req: R-1208
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
	check("entryInvokes: POSIX reads a copied Windows exec fragment as not installed", !entryInvokes({ command: "node", args: ["C:\\Users\\owner\\nana-pi/packages/nana-setup/claude/hooks/nana-objective.mjs"] }, objSpec, undefined));
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
	const knowledgeWin = retiredKnowledgeHook({ repoRoot: '/repo', platform: 'win32' });
	const knowledgePosix = retiredKnowledgeHook({ repoRoot: '/repo' });
	const objPosix = wantedPosix.find((w) => w.label === "SessionStart objective");
	// req: R-1056
	check("installerTarget accepts the POSIX knowledge form on every platform", installerTarget({ command: "NODE_NO_WARNINGS=1 node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5, statusMessage: "nana: knowledge pull" }, knowledgeWin, "win32")?.form === "posix" && installerTarget({ command: "NODE_NO_WARNINGS=1 node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5, statusMessage: "nana: knowledge pull" }, knowledgePosix, undefined)?.form === "posix");
	// req: R-1056
	check("installerTarget accepts the earlier win32 knowledge form", installerTarget({ command: "node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5, statusMessage: "nana: knowledge pull" }, knowledgeWin, "win32")?.form === "win32-legacy");
	// req: R-1050
	// req: R-1056
	check("installerTarget accepts the R-1050 exec form", installerTarget({ command: "node", args: ["/old/packages/nana-setup/claude/hooks/nana-objective.mjs"], timeout: 5, statusMessage: "nana: objective + current priority" }, objWin, "win32")?.form === "win32-exec");
	// req: R-923
	check("installerTarget rejects an extra args element", installerTarget({ command: "node", args: ["/old/packages/nana-setup/claude/hooks/nana-objective.mjs", "--extra"], timeout: 5, statusMessage: "nana: objective + current priority" }, objWin, "win32") === null);
	// req: R-923
	check("installerTarget rejects a relative path", installerTarget({ command: "node", args: ["packages/nana-setup/claude/hooks/nana-objective.mjs"], timeout: 5, statusMessage: "nana: objective + current priority" }, objWin, "win32") === null);
	// final review r1 astra MUST 3: ownership is the entry's REPOSITORY suffix, not merely the
	// script's basename — a customized target outside the checkout's own tree, sharing only the
	// basename, is kept as a hand-written variant rather than repaired onto nana's checkout.
	// req: R-923
	check("installerTarget on win32 rejects a customized target outside the checkout's own tree, same basename", installerTarget({ command: "node", args: ["C:/custom/nana-objective.mjs"], timeout: 5, statusMessage: "nana: objective + current priority" }, objWin, "win32") === null);
	// req: R-923
	check("installerTarget on win32 rejects a customized knowledge target outside the checkout's own tree, same basename", installerTarget({ command: "node", args: ["C:/custom/nana-knowledge.ts", "hook"], timeout: 5, statusMessage: "nana: knowledge pull" }, knowledgeWin, "win32") === null);
	// the suffix check is root-agnostic (any checkout root carrying the entry's own repository
	// suffix is still ours to repair) and compares across `/` and `\`, since a hand-written entry
	// may use backslashes throughout its root while the installer's own suffix is forward-slash.
	// req: R-1056
	check("installerTarget on win32 accepts any root carrying the entry's own repository suffix", installerTarget({ command: "node", args: ["/elsewhere/packages/nana-setup/claude/hooks/nana-objective.mjs"], timeout: 5, statusMessage: "nana: objective + current priority" }, objWin, "win32")?.form === "win32-exec");
	// req: R-1056
	check("installerTarget on win32 compares the repository suffix across / and \\", installerTarget({ command: "node", args: ["C:\\old\\packages\\nana-setup\\claude\\hooks/nana-objective.mjs"], timeout: 5, statusMessage: "nana: objective + current priority" }, objWin, "win32")?.form === "win32-exec");
	// req: R-653
	check("installerTarget rejects another status message", installerTarget({ command: "node", args: ["/old/packages/nana-setup/claude/hooks/nana-objective.mjs"], timeout: 5, statusMessage: "another status message" }, objWin, "win32") === null && installerTarget({ command: "NODE_NO_WARNINGS=1 node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5, statusMessage: "another status message" }, knowledgePosix, undefined) === null);
	// req: R-1061
	// req: R-653
	// req: R-923
	check("installerTarget returns null for a missing status message", installerTarget({ command: "node", args: ["/old/packages/nana-setup/claude/hooks/nana-objective.mjs"], timeout: 5 }, objWin, "win32") === null && installerTarget({ command: "NODE_NO_WARNINGS=1 node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5 }, knowledgePosix, undefined) === null);
	// req: R-1056
	// req: R-653
	check("installerTarget on win32 rejects a shell form carrying args", installerTarget({ command: "node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", args: ["ignored"], timeout: 5, statusMessage: "nana: knowledge pull" }, knowledgeWin, "win32") === null);
	// req: R-1056
	// req: R-653
	check("installerTarget on win32 rejects the POSIX prefixed form carrying args", installerTarget({ command: "NODE_NO_WARNINGS=1 node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", args: ["ignored"], timeout: 5, statusMessage: "nana: knowledge pull" }, knowledgeWin, "win32") === null);
	// req: R-1061
	// req: R-653
	check("installerTarget on POSIX rejects the two win32-only forms", installerTarget({ command: "node '/old/packages/nana-knowledge/bin/nana-knowledge.ts' hook", timeout: 5, statusMessage: "nana: knowledge pull" }, knowledgePosix, undefined) === null && installerTarget({ command: "node", args: ["/old/packages/nana-setup/claude/hooks/nana-objective.mjs"], timeout: 5, statusMessage: "nana: objective + current priority" }, objPosix, undefined) === null);
}
/* --- exact legacy SessionStart entries migrate in place -------------------------------- */
{
	const foreign = { type: "command", command: "echo foreign", timeout: 5, statusMessage: "other" };
	const settings = { hooks: { SessionStart: [{ hooks: [
		{ type: "command", command: "bash ~/.claude/hooks/nana-objective.sh", timeout: 5, statusMessage: "nana: objective + current priority" },
		foreign,
		{ type: "command", command: "bash '/Users/example/.claude/hooks/nana-adoption.sh'", timeout: 5, statusMessage: "nana: unadopted repositories" },
	] }] } };
	// req: R-908
	check("legacy managed bash hooks replace commands in place", migrateLegacyHooks(settings, { hooksDir: "/Users/example/.claude/hooks", claudeHome: "/Users/example/.claude" }) && settings.hooks.SessionStart[0].hooks[0].command === "node '/Users/example/.claude/hooks/nana-objective.mjs'" && settings.hooks.SessionStart[0].hooks[2].command === "node '/Users/example/.claude/hooks/nana-adoption.mjs'" && settings.hooks.SessionStart[0].hooks[1] === foreign && settings.hooks.SessionStart[0].hooks.length === 3);
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
	check("near-match legacy entries stay byte-identical across keys, fields, command, and event", !migrateLegacyHooks(settings, { hooksDir: "/Users/example/.claude/hooks", claudeHome: "/Users/example/.claude" }) && JSON.stringify(settings) === before);
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
const homeSnapshot = (root) => {
	const entries = [];
	const walk = (dir, relative = "") => {
		for (const name of fs.readdirSync(dir).sort()) {
			const absolute = path.join(dir, name);
			const child = relative ? `${relative}/${name}` : name;
			const stat = fs.lstatSync(absolute);
			if (stat.isSymbolicLink()) entries.push([child, "link", fs.readlinkSync(absolute)]);
			else if (stat.isDirectory()) { entries.push([child, "directory"]); walk(absolute, child); }
			else if (stat.isFile()) entries.push([child, "file", fs.readFileSync(absolute).toString("base64")]);
			else entries.push([child, "other"]);
		}
	};
	walk(root);
	return JSON.stringify(entries);
};

{
	const refusedBodies = [
		'{"hooks":',
		"[]",
		"null",
		'"x"',
		'{"hooks":null}',
		'{"hooks":[]}',
		'{"hooks":{"Stop":{}}}',
		'{"hooks":{"Stop":[1]}}',
		'{"hooks":{"Stop":[null]}}',
		'{"hooks":{"Stop":[{"hooks":"x"}]}}',
	];
	const refused = refusedBodies.map((body) => {
		const home = freshHome();
		const file = path.join(home, ".claude", "settings.json");
		fs.writeFileSync(file, body);
		const before = homeSnapshot(home);
		const result = run(["install"], home);
		return { body, status: result.status, named: result.stderr.includes(file), unchanged: homeSnapshot(home) === before, stderr: result.stderr };
	});
	const acceptedBodies = [
		" \n\t ",
		'{"theme":"dark"}',
		'{"hooks":{"Notification":[{"matcher":"x"}]}}',
	];
	const objective = desiredHooks({ hooksDir: "/h", repoRoot: "/r" }).find((entry) => entry.label === "SessionStart objective").spec;
	const accepted = acceptedBodies.map((body) => {
		const home = freshHome();
		const file = path.join(home, ".claude", "settings.json");
		fs.writeFileSync(file, body);
		const result = run(["install"], home);
		let parsed = null;
		let readError = null;
		try { parsed = JSON.parse(fs.readFileSync(file, "utf8")); }
		catch (error) { readError = error.message; }
		const entries = parsed?.hooks?.SessionStart?.flatMap((group) => Array.isArray(group?.hooks) ? group.hooks : []) ?? [];
		return { body, status: result.status, invokes: entries.some((entry) => entryInvokes(entry, objective, platform())), readError, stderr: result.stderr };
	});
	// req: R-320
	check("R-320: preflight refuses a settings.json that does not parse or breaks any rung of the hooks shape, and accepts a blank file, no hooks key and a foreign group without hooks",
		refused.every((result) => result.status === 2 && result.named && result.unchanged) &&
			accepted.every((result) => result.status === 0 && result.invokes && result.readError === null),
		JSON.stringify({ refused, accepted }));
}

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
	// req: R-660
	check("exact nana context invocation is removed", !JSON.stringify(after).includes('"command": "bash ~/.claude/hooks/context-size-check.sh"'), JSON.stringify(after));
	// req: R-660
	check("owner command variant with arguments is preserved", after.hooks.UserPromptSubmit[0].hooks.some((h) => h.command === "bash ~/.claude/hooks/context-size-check.sh --custom"));
	check("retirement reports that the hook was removed", /UserPromptSubmit context-size retirement/.test(r.stdout), r.stdout);
	if (platform() === "win32") {
		skip("file mode is preserved across the atomic write", posixModeReason);
	} else {
		// req: R-321
		check("file mode is preserved across the atomic write", (fs.statSync(path.join(home, ".claude", "settings.json")).mode & 0o777) === 0o600);
	}
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

/* --- R-924: an unparseable body and a shape the merge will not edit both abort before any
   write, exit 2, and name the settings file -------------------------------------------- */
{
	const unparseableHome = freshHome();
	const unparseableFile = path.join(unparseableHome, ".claude", "settings.json");
	fs.writeFileSync(unparseableFile, '{ "hooks": { "SessionStart": [ } }');
	const beforeUnparseable = homeSnapshot(unparseableHome);
	const unparseableResult = run(["install"], unparseableHome);
	const afterUnparseable = homeSnapshot(unparseableHome);

	const shapeHome = freshHome();
	const shapeFile = path.join(shapeHome, ".claude", "settings.json");
	fs.writeFileSync(shapeFile, '{"hooks":"disabled"}');
	const beforeShape = homeSnapshot(shapeHome);
	const shapeResult = run(["install"], shapeHome);
	const afterShape = homeSnapshot(shapeHome);

	// req: R-924
	check("R-924: install over a settings.json that does not parse, or parses to a shape it will not edit, exits 2 naming the file with everything under the home unchanged",
		unparseableResult.status === 2 &&
			shapeResult.status === 2 &&
			unparseableResult.stderr.includes(unparseableFile) &&
			shapeResult.stderr.includes(shapeFile) &&
			afterUnparseable === beforeUnparseable &&
			afterShape === beforeShape,
		`${unparseableResult.status} ${shapeResult.status}\n${unparseableResult.stderr}\n${shapeResult.stderr}`);
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
	if (platform() === "win32") skip("after re-reading: mode preserved", posixModeReason);
	else check("after re-reading: mode preserved", (fs.statSync(file).mode & 0o777) === 0o600);
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
	fs.writeFileSync(path.join(home, ".claude", "enforce"), "");
	const held = { pid: 4242, at: Date.now() - 90_000 };
	fs.writeFileSync(lockOf(home), JSON.stringify(held));
	const before = homeSnapshot(home);
	const r = run(["install"], home);
	const after = homeSnapshot(home);
	// req: R-1590
	check("lock: a held lock stops install before its first write", r.status === 2 && r.stderr.includes("Nothing was written") && after === before, `${r.status}\n${r.stderr}\n${after}`);
// req: R-925
	check("lock: the other run's lock is left exactly as it was", fs.readFileSync(lockOf(home), "utf8") === JSON.stringify(held));
	const lock = lockOf(home);
	const win32Lines = [
		"  in Command Prompt:",
		`    del "${lock}"`,
		"  in PowerShell:",
		`    Remove-Item -LiteralPath '${lock}'`,
	];
	const expectedLines = process.platform === "win32" ? win32Lines : [`  rm '${lock}'`];
	const printedLines = r.stderr.split(/\r?\n/);
	const start = printedLines.findIndex((line) => line === expectedLines[0]);
	let forcedWin32 = null;
	if (process.platform !== "win32") {
		forcedWin32 = spawnSync(process.execPath, [cli, "install", "--home", home], {
			encoding: "utf8",
			env: { ...process.env, NANA_SETUP_PLATFORM: "win32" },
		});
	}
	const forcedLines = forcedWin32?.stderr.split(/\r?\n/) ?? [];
	const forcedStart = forcedLines.findIndex((line) => line === win32Lines[0]);
	// req: R-2080
	check("R-2080: a held settings lock stops install printing the lock path, the recorded pid, its age and each removal command alone on its line under its shell",
		r.status === 2 &&
			r.stderr.includes(lock) &&
			r.stderr.includes("pid 4242") &&
			/\b9\ds ago\b/.test(r.stderr) &&
			start >= 0 &&
			JSON.stringify(printedLines.slice(start, start + expectedLines.length)) === JSON.stringify(expectedLines) &&
			(process.platform !== "win32" || !printedLines.some((line) => line.startsWith("  rm "))) &&
			(!forcedWin32 ||
				forcedWin32.status === 2 &&
				forcedStart >= 0 &&
				JSON.stringify(forcedLines.slice(forcedStart, forcedStart + win32Lines.length)) === JSON.stringify(win32Lines) &&
				!forcedLines.some((line) => line.startsWith("  rm "))),
		`${r.stderr}${forcedWin32 ? `\nforced win32:\n${forcedWin32.stderr}` : ""}`);
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
	// req: R-926
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
	if (platform() === "win32") skip("post-write: mode preserved", posixModeReason);
	else check("post-write: mode preserved", (fs.statSync(file).mode & 0o777) === 0o600);
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
	if (platform() === "win32") {
		// win32 wires hooks in exec form AS PART of stepSettings itself (stepHooks is a no-op
		// there, settings.mjs:191-208), so settings.json carries no surviving evidence once that
		// step aborts (the sneaked-in bytes check above proves it reverted). stepRules runs BEFORE
		// stepSettings on every platform and, on win32, copies (never links) each rule — that copy
		// is the equivalent "a step before settings ran" proof here.
		const soulPath = path.join(home, ".claude", "rules", "nana-soul.md");
		check("full install: the steps BEFORE settings did run (win32: a rule was copied, not linked)", fs.existsSync(soulPath) && !fs.lstatSync(soulPath).isSymbolicLink());
	} else {
		check("full install: the steps BEFORE settings did run (hooks are in place)", fs.lstatSync(path.join(home, ".claude", "hooks", "nana-objective.mjs")).isSymbolicLink());
	}
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
	// migrateLegacyHooks runs only off win32 (steps.mjs:521) — win32 has no hooksDir symlink
	// shape for a legacy SessionStart command to migrate INTO, so this whole scenario is
	// POSIX-only there; each of its four checks is SKIPped individually, same slots, same titles.
	const legacyReason = "migrateLegacyHooks is off on win32 (steps.mjs skips it; win32 install wires exec form directly, never through hooksDir)";
	if (platform() === "win32") {
		skip("dry-run reports the in-place legacy migration as would-migrate", legacyReason);
		skip("install reports the in-place legacy migration as UPDATED", legacyReason);
		skip("install migrates the three exact legacy commands in place without disturbing foreign objects", legacyReason);
		skip("second install after migration reports nothing to do", legacyReason);
	} else {
		const dry = run(["install", "--dry-run"], home);
		// req: R-908
		check("dry-run reports the in-place legacy migration as would-migrate", dry.status === 0 && /SessionStart retired hook migration.*would migrate/i.test(dry.stdout));
		const result = run(["install"], home);
		// req: R-908
		check("install reports the in-place legacy migration as UPDATED", result.status === 0 && /SessionStart retired hook migration.*updated/i.test(result.stdout));
		const migrated = JSON.parse(fs.readFileSync(file, "utf8")).hooks.SessionStart[0].hooks;
		const expected = ["nana-objective.mjs", "nana-shared-memory.mjs", "nana-adoption.mjs"];
		// req: R-908
		check("install migrates the three exact legacy commands in place without disturbing foreign objects", result.status === 0 && migrated.length === 6 && migrated[0].command === before.command && migrated[4].command === after.command && JSON.stringify(migrated[0]) === JSON.stringify(before) && JSON.stringify(migrated[4]) === JSON.stringify(after) && migrated.slice(1, 4).every((entry, index) => entry.command === `node ${shq(path.join(layout.hooksDir, expected[index]))}`));
		const again = run(["install"], home);
		// req: R-908
		check("second install after migration reports nothing to do", again.status === 0 && /nothing to do/.test(again.stdout));
	}
}

/* --- every hook label: hand-written variants fall through to hasHook (R-923) --- */
for (const w of desiredHooks({ hooksDir: "/unused", repoRoot: repo, platform: "win32" })) {
	const home = freshHome("nana-setup-win32-variant-");
	const file = path.join(home, ".claude", "settings.json");
	const handWritten = { type: "command", command: "node", args: w.entry.args, timeout: 5, statusMessage: `my own ${w.label} message` };
	const group = w.matcher ? { matcher: w.matcher, hooks: [handWritten] } : { hooks: [handWritten] };
	fs.writeFileSync(file, JSON.stringify({ hooks: { [w.event]: [group] } }, null, 2) + "\n");
	const r = spawnSync(process.execPath, [cli, "install", "--home", home], { encoding: "utf8", env: { ...process.env, NANA_SETUP_PLATFORM: "win32" } });
	const after = JSON.parse(fs.readFileSync(file, "utf8"));
	const matching = (after.hooks[w.event] ?? []).flatMap((g) => g.hooks ?? []).filter((h) => JSON.stringify(h).includes(w.spec.script));
	// req: R-923
	check(`forced win32: a hand-written exec-form variant (another status message) is kept byte for byte, no twin — ${w.label}`, r.status === 0 && matching.length === 1 && JSON.stringify(matching[0]) === JSON.stringify(handWritten), JSON.stringify(matching));
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
