import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
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
	fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({ journal: { enabled: false }, gate }));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true };
	const call = (toolName, input) => handlers.tool_call({ toolName, input }, ctx);
	return { td, call };
}

// (a) gate.allowPatterns: null — a benign edit must return normally (no throw, no block).
{
	const { td, call } = setup({ allowPatterns: null });
	let res, threw = false;
	try { res = await call("edit", { path: path.join(td, "src", "foo.ts") }); } catch { threw = true; }
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
	check("b: all-null gate arrays do not throw", !threw);
	check("b: built-in dangerous pattern still blocks headless", res?.block === true);
	fs.rmSync(td, { recursive: true, force: true });
}

process.exit(fails);
