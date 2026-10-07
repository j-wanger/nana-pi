/**
 * @module packages/nana-pack/tests/lifecycle-reload.test.mjs
 * @purpose Pins the `/reload-runtime` command the desk depends on — registered exactly once under a non-colliding name, carrying a description, and calling ctx.reload once
 * @inputs extensions/nana-lifecycle.ts and a nana-pack.json under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME and config file), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// L1 fixture: a nana-only `.pi/` is never nana-trusted (pi auto-trusts it; that is not a
// decision), so this file's config lives at USER scope under an isolated HOME
// (os.homedir() reads HOME on posix, USERPROFILE on win32).
const NANA_HOME = tmpDir(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
// /reload-runtime is the only way a non-TUI host (the desk, any RPC client) can
// make a RUNNING session pick up a skill added after it started — pi scans skill
// locations at startup only. Three properties, all of them contract the desk
// depends on:
//   a. the command is registered, under a name that does NOT collide with pi's
//      built-in interactive /reload (pi skips a colliding extension command in
//      the TUI autocomplete and the built-in shadows it, so the handler would
//      never run there);
//   b. the handler calls ctx.reload() exactly once and returns — terminal,
//      because everything after it runs on a stale ctx (docs/extensions.md);
//   c. registering it did not cost the pack its lifecycle handlers.
// Drives the REAL registered handler with a fake pi/ctx that records the calls.
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-lifecycle.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };

// pi 0.84.4 built-ins (dist/core/slash-commands.js BUILTIN_SLASH_COMMANDS).
const BUILTIN_COMMAND_NAMES = new Set([
	"settings", "model", "tree", "thinking", "scoped-models", "export", "import", "share", "copy",
	"name", "session", "changelog", "hotkeys", "fork", "clone", "trust", "login", "logout", "new",
	"compact", "resume", "reload", "quit",
]);

// A trusted workspace with the journal off: these handlers are being driven for
// their UI and reload effects, not to write to the developer's real journal.
const td = tmpDir(path.join(os.tmpdir(), "lifecycle-reload-"));
fs.mkdirSync(path.join(td, ".pi"));
fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false } }));

const handlers = {};
const commands = new Map();
ext({
	on: (name, fn) => { handlers[name] = fn; },
	registerCommand: (name, options) => commands.set(name, options),
});

// ── a. registered, and not under a built-in name ──
// req: R-164
check("a: exactly one command is registered", commands.size === 1, [...commands.keys()].join(","));
const [name, options] = [...commands.entries()][0] ?? [];
// req: R-164
check("a: named reload-runtime", name === "reload-runtime", String(name));
// req: R-164
check("a: does not collide with a pi built-in command", !BUILTIN_COMMAND_NAMES.has(name), String(name));
// req: R-164
check("a: carries a description (desk completion and TUI autocomplete both show it)",
	typeof options?.description === "string" && options.description.length > 0);

// ── b. the handler reloads, and stops ──
{
	const calls = [];
	const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true, reload: async () => calls.push("reload") };
	const returned = await options.handler("", ctx);
	// req: R-165
	check("b: the handler calls ctx.reload() exactly once", calls.join(",") === "reload", calls.join(","));
	// req: R-165
	check("b: …and returns nothing (terminal — no work on a stale ctx)", returned === undefined);
}

// ── c. the lifecycle handlers are still there, and still fire ──
for (const ev of ["session_start", "session_before_compact", "session_compact", "session_compact_failed", "session_shutdown"])
	// req: R-814
	check(`c: ${ev} handler still registered`, typeof handlers[ev] === "function");
{
	const statuses = [];
	const ctx = {
		cwd: td,
		hasUI: true,
		isProjectTrusted: () => true,
		ui: { setStatus: (key, text) => statuses.push({ key, text }), theme: { fg: (c, t) => `[${c}]${t}` } },
	};
	await handlers.session_start({ reason: "reload" }, ctx);
	// req: R-163
	check("c: session_start still sets the nana-pack chip", statuses.at(-1)?.key === "nana-pack", JSON.stringify(statuses));
}

fs.rmSync(td, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
