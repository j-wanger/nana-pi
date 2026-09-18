// Gate: the settings.json merge ADDS and nothing else. Someone else's hooks, someone else's
// keys, and someone else's ordering all survive; a file we cannot parse OR cannot understand
// stops the installer before anything on disk has moved; the write is atomic and refuses to
// clobber a concurrent edit; and a hook counts as installed only when it really is one.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const { commandInvokes, desiredHooks, hasHook, mergeHooks, serialize, shq, tokenize, validateShape } = await import(new URL("../lib/settings.mjs", import.meta.url).href);
const { LOCK_STALE_MS, SetupError, install, readClaudeSettings, stepSettings, withSettingsLock, writeSettingsAtomic } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const wanted = desiredHooks({ hooksDir: "/h", repoRoot: "/r" });
const spec = (label) => wanted.find((w) => w.label === label).spec;
check("four hook entries are wanted", wanted.length === 4);

/* --- paths are quoted, so a space in the home or clone still runs --------------------- */
{
	const w = desiredHooks({ hooksDir: "/Users/Jane Doe/.claude/hooks", repoRoot: "/Users/Jane Doe/nana-pi" });
	check("bash commands single-quote the path", w[0].entry.command === "bash '/Users/Jane Doe/.claude/hooks/nana-objective.sh'");
	check("the node command single-quotes the path", w[3].entry.command === "NODE_NO_WARNINGS=1 node '/Users/Jane Doe/nana-pi/packages/nana-knowledge/bin/nana-knowledge.ts' hook");
	check("a quote inside a path is escaped", shq("/a/b'c/d") === `'/a/b'\\''c/d'`);
	for (const entry of w) check(`quoted command still matches its own spec (${entry.label})`, commandInvokes(entry.entry.command, entry.spec));
}

/* --- matching is anchored on the script as a path component -------------------------- */
{
	const objective = spec("SessionStart objective");
	const yes = [
		"bash ~/.claude/hooks/nana-objective.sh",
		"bash '/Users/Jane Doe/.claude/hooks/nana-objective.sh'",
		'bash "/Users/x/.claude/hooks/nana-objective.sh"',
		"/bin/bash /Users/x/.claude/hooks/nana-objective.sh",
		"sh /opt/hooks/nana-objective.sh --quiet",
	];
	for (const c of yes) check(`matches: ${c}`, commandInvokes(c, objective));
	const no = [
		"echo bash /tmp/nana-objective.sh", // mentions an invocation, is not one
		"echo nana-objective.sh.disabled",
		"bash ~/.claude/hooks/nana-objective.sh.disabled",
		"bash ~/.claude/hooks/old-nana-objective.shx",
		"echo '/x/nana-objective.sh'", // no interpreter
		"bash ~/.claude/hooks/nana-shared-memory.sh",
	];
	for (const c of no) check(`does NOT match: ${c}`, !commandInvokes(c, objective));
	const knowledge = spec("UserPromptSubmit knowledge pull");
	check("knowledge: the real command matches", commandInvokes("NODE_NO_WARNINGS=1 node /r/packages/nana-knowledge/bin/nana-knowledge.ts hook", knowledge));
	check("knowledge: a different subcommand does not", !commandInvokes("node /r/packages/nana-knowledge/bin/nana-knowledge.ts build", knowledge));
	check("knowledge: a bare mention does not", !commandInvokes("echo nana-knowledge.ts hook", knowledge));
	check("knowledge: a quoted path with a space matches", commandInvokes("NODE_NO_WARNINGS=1 node '/x y/nana-knowledge.ts' hook", knowledge));
	check("knowledge: `echo node … hook` does not", !commandInvokes("echo node /x/nana-knowledge.ts hook", knowledge));
	check("unbalanced quoting reads as NOT installed", !commandInvokes("bash '/x/nana-objective.sh", objective));
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
	check("an existing unquoted `~` context-size hook is recognised, not re-added", !r.added.includes("UserPromptSubmit context-size"));
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

/* --- unit: a disabled look-alike must NOT count as installed -------------------------- */
{
	const s = { hooks: { SessionStart: [{ hooks: [{ type: "command", command: "echo nana-objective.sh.disabled" }] }] } };
	const r = mergeHooks(s, wanted);
	check("a look-alike command does not suppress the real hook", r.added.includes("SessionStart objective"));
	check("the look-alike is still there, untouched", s.hooks.SessionStart[0].hooks[0].command === "echo nana-objective.sh.disabled");
	check("hasHook now reports the real hook", hasHook(s, "SessionStart", spec("SessionStart objective")));
}

const tmps = [];
function freshHome(prefix = "nana-setup-settings-") {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
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
			UserPromptSubmit: [{ hooks: [{ type: "command", command: "bash ~/.claude/hooks/context-size-check.sh" }] }],
			PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "bash ~/.claude/hooks/block-dangerous-bash.sh" }] }],
		},
	};
	fs.writeFileSync(path.join(home, ".claude", "settings.json"), JSON.stringify(original, null, 2) + "\n", { mode: 0o600 });
	const r = run(["install"], home);
	check("install over an existing settings.json exits 0", r.status === 0, r.stderr);
	const after = JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8"));
	check("model key survives", after.model === "fable");
	check("PreToolUse survives untouched", JSON.stringify(after.hooks.PreToolUse) === JSON.stringify(original.hooks.PreToolUse));
	check("the hand-written context-size hook is kept as-is", after.hooks.UserPromptSubmit[0].hooks[0].command === "bash ~/.claude/hooks/context-size-check.sh");
	check("no second context-size hook", JSON.stringify(after).split("context-size-check.sh").length - 1 === 1);
	check("the knowledge hook was added", JSON.stringify(after).includes("nana-knowledge.ts"));
	check("file mode is preserved across the atomic write", (fs.statSync(path.join(home, ".claude", "settings.json")).mode & 0o777) === 0o600);
	check("no temp file is left behind", fs.readdirSync(path.join(home, ".claude")).every((f) => !f.includes(".tmp")));
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
	check("concurrent edit: our entries were NOT written", !JSON.stringify(after).includes("nana-objective.sh"));
	check("concurrent edit: no temp file left behind", fs.readdirSync(path.join(home, ".claude")).every((f) => !f.includes(".tmp")));

	// and with a fresh snapshot it goes through, atomically and with the mode kept
	const fresh = readClaudeSettings(layout);
	mergeHooks(fresh.settings, wanted);
	writeSettingsAtomic(file, serialize(fresh.settings), fresh.snapshot);
	const done = JSON.parse(fs.readFileSync(file, "utf8"));
	check("after re-reading: the write goes through", JSON.stringify(done).includes("nana-objective.sh"));
	check("after re-reading: the foreign hook is still there", JSON.stringify(done).includes("someone-elses.sh"));
	check("after re-reading: mode preserved", (fs.statSync(file).mode & 0o777) === 0o600);
}

/* --- the lock holds the whole read -> write -> rename sequence ------------------------- */
const lockOf = (home) => path.join(home, ".claude", ".settings.json.nana-setup.lock");
const DEAD_PID = 999999; // above any real pid on macOS/Linux

{
	const home = freshHome();
	const r = run(["install"], home);
	check("lock: a normal install leaves no lock file", r.status === 0 && !fs.existsSync(lockOf(home)), r.stdout);
}
{
	// a live holder: abort, change nothing
	const home = freshHome();
	fs.writeFileSync(path.join(home, ".claude", "settings.json"), "{}\n", { mode: 0o600 });
	fs.writeFileSync(lockOf(home), JSON.stringify({ pid: process.pid, at: Date.now() }));
	const r = run(["install"], home);
	check("lock: a live lock aborts the install", r.status === 2, String(r.status));
	check("lock: the message names the lock and the pid", r.stderr.includes(lockOf(home)) && r.stderr.includes(String(process.pid)), r.stderr);
	check("lock: settings were not written", fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8") === "{}\n");
	check("lock: the foreign lock is still there", fs.existsSync(lockOf(home)));
}
{
	// a young lock whose pid is dead is NOT stale yet
	const home = freshHome();
	fs.writeFileSync(lockOf(home), JSON.stringify({ pid: DEAD_PID, at: Date.now() }));
	const r = run(["install"], home);
	check("lock: a young lock is respected even with a dead pid", r.status === 2, r.stdout);
}
{
	// older than the stale window AND a dead pid: reclaim
	const home = freshHome();
	fs.writeFileSync(lockOf(home), JSON.stringify({ pid: DEAD_PID, at: Date.now() - LOCK_STALE_MS - 5000 }));
	const old = (Date.now() - LOCK_STALE_MS - 5000) / 1000;
	fs.utimesSync(lockOf(home), old, old);
	const r = run(["install"], home);
	check("lock: a stale lock with a dead pid is reclaimed", r.status === 0, r.stderr);
	check("lock: and released again afterwards", !fs.existsSync(lockOf(home)));
	check("lock: the install actually wrote settings", JSON.stringify(JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8"))).includes("nana-objective.sh"));
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
	check("lock: a second acquisition is refused", inner instanceof SetupError, String(inner));
	check("lock: released after the outer call", !fs.existsSync(lockOf(home)));
	let threw = false;
	try {
		withSettingsLock(file, () => {
			throw new Error("boom");
		});
	} catch {
		threw = true;
	}
	check("lock: released when the body throws", threw && !fs.existsSync(lockOf(home)));
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
				tempExisted = fs.existsSync(tmp) && fs.readFileSync(tmp, "utf8").includes("nana-objective.sh");
				fs.writeFileSync(file, foreignRaw);
			},
		}, state);
	} catch (e) {
		err = e;
	}
	check("post-write: the temp file was fully written before the compare", tempExisted === true);
	check("post-write: the write aborts", err instanceof SetupError, String(err));
	check("post-write: the message says another process wrote to it", /changed on disk while nana-setup was running/.test(err?.message ?? ""));
	check("post-write: the temp file was removed", fs.readdirSync(path.join(home, ".claude")).every((f) => !f.includes(".tmp")), fs.readdirSync(path.join(home, ".claude")).join(" "));
	check("post-write: the external writer's bytes are intact", fs.readFileSync(file, "utf8") === foreignRaw);
	check("post-write: our entries were NOT written", !fs.readFileSync(file, "utf8").includes("nana-objective.sh"));
	check("post-write: the lock was released", !fs.existsSync(lockOf(home)));

	// with a fresh preflight it goes through, keeping the foreign hook and the mode
	const fresh = readClaudeSettings(layout);
	stepSettings(layout, { dryRun: false }, fresh);
	const after = fs.readFileSync(file, "utf8");
	check("post-write: a clean re-run writes our entries", after.includes("nana-objective.sh"));
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
	check("full install: the steps BEFORE settings did run (hooks are in place)", fs.lstatSync(path.join(home, ".claude", "hooks", "nana-objective.sh")).isSymbolicLink());
	check("full install: the steps AFTER settings did not (no pi seed)", !fs.existsSync(path.join(home, ".pi", "agent", "nana-pack.json")));
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
