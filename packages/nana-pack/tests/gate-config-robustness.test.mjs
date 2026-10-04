/**
 * @module packages/nana-pack/tests/gate-config-robustness.test.mjs
 * @purpose Pins that a malformed gate config never throws out of the tool_call handler, since a throw there is upstream-blocked and would wrongly refuse a benign edit
 * @inputs extensions/nana-gate.ts and nana-pack.json files with null gate arrays under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME and config files), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// L1 fixture: a nana-only `.pi/` is never nana-trusted (pi auto-trusts it; that is not a
// decision), so this file's config lives at USER scope under an isolated HOME
// (os.homedir() reads HOME on posix, USERPROFILE on win32).
const NANA_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "nana-home-"));
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const USER_CFG = path.join(NANA_HOME, ".pi", "agent", "nana-pack.json");
fs.mkdirSync(path.dirname(USER_CFG), { recursive: true });
// Robustness property: a malformed gate config (e.g. `"allowPatterns": null`) must
// NOT throw out of the tool_call handler — a throw there is fail-safe-BLOCKED
// upstream, so a null pattern array would wrongly block an otherwise-benign edit.
// compileRegexes returning [] for a non-array is what keeps the handler alive; the
// built-in gate still fires. Drives the REAL registered gate handler.
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

// Fresh trusted workspace whose project config carries `gate`, plus the registered handler.
function setup(gate) {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "gate-"));
	fs.mkdirSync(path.join(td, ".pi"));
	fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false }, gate }));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true };
	const call = (toolName, input) => handlers.tool_call({ toolName, input }, ctx);
	return { td, call };
}

// L1 fixture: this process first loads a VALID (empty) user gate block, so the malformed
// gate blocks below fall back to that in-memory last-good policy. A process that never
// loaded a valid one stops conservatively instead (every gated tool blocked — pinned in
// config-gate-fallback.test.mjs (b)/(c)).
{
	const { td, call } = setup({});
	await call("bash", { command: "ls" });
	fs.rmSync(td, { recursive: true, force: true });
}

// (a) gate.allowPatterns: null — a benign edit must return normally (no throw, no block).
{
	const { td, call } = setup({ allowPatterns: null });
	let res, threw = false;
	try { res = await call("edit", { path: path.join(td, "src", "foo.ts") }); } catch { threw = true; }
	// req: R-070
	check("a: null allowPatterns does not throw", !threw);
	check("a: benign edit returns normally (not blocked)", res === undefined);
	fs.rmSync(td, { recursive: true, force: true });
}

// (b) all three gate arrays null — the built-in gate still fires (a dangerous command
// is blocked headless) and nothing throws: the array guard hardens, it does not disable.
{
	const { td, call } = setup({ allowPatterns: null, extraPatterns: null, protectedPaths: null });
	let res, threw = false;
	try { res = await call("bash", { command: "rm -rf /tmp/whatever" }); } catch { threw = true; }
	// req: R-070
	check("b: all-null gate arrays do not throw", !threw);
// req: R-774
	check("b: built-in dangerous pattern still blocks headless", res?.block === true);
	fs.rmSync(td, { recursive: true, force: true });
}

process.exit(fails);
