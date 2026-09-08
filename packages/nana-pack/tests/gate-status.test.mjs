import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Visibility property: the gate keeps a per-session tally and publishes it on
// every tool call it INSPECTS, so an interactive session can tell "the gate is
// live and letting things through" apart from "there is no gate". Tool calls
// outside its scope stay silent and uncounted, and no status update may ever
// change or block a tool decision (a throw in a tool_call handler BLOCKS the
// tool — pi is fail-safe upstream).
// Drives the REAL registered gate handler with a fake ctx that records UI calls.
// Run: node --experimental-strip-types <this file>
const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

// Fresh trusted workspace + a freshly registered handler (the counters live in
// the registration closure, so every scenario starts from zero).
// opts.select overrides the dialog answer; opts.ui merges into the fake ui.
function setup(gate, opts = {}) {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "gate-status-"));
	fs.mkdirSync(path.join(td, ".pi"));
	fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({
		journal: { enabled: false },
		gate: { extraPatterns: [], allowPatterns: [], protectedPaths: [], ...gate },
	}));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const statuses = [];
	const dialogs = [];
	const ctx = {
		cwd: td,
		hasUI: true,
		isProjectTrusted: () => true,
		ui: {
			setStatus: (key, text) => statuses.push({ key, text }),
			select: async (message, options) => { dialogs.push({ message, options }); return opts.select ?? "Block"; },
			theme: { fg: (color, text) => `[${color}]${text}` },
			...(opts.ui ?? {}),
		},
	};
	const call = (toolName, input) => handlers.tool_call({ toolName, input }, ctx);
	return { td, statuses, dialogs, call };
}

const last = (a) => a.at(-1);

// (a) the running tally: four inspected calls, two of which hit a pattern.
{
	const { td, statuses, dialogs, call } = setup({});
	const benignEdit = await call("edit", { path: path.join(td, "src", "foo.ts") });
	check("a: benign edit is counted and allowed", benignEdit === undefined);
	check("a: status key is nana-gate", last(statuses)?.key === "nana-gate");
	check("a: after 1 inspected call", last(statuses)?.text === "[dim]gate ✓ 1 checked · 0 gated");

	await call("bash", { command: "ls -la" });
	check("a: after 2 inspected calls", last(statuses)?.text === "[dim]gate ✓ 2 checked · 0 gated");

	const blockedCmd = await call("bash", { command: "rm -rf /tmp/nana-gate-status" });
	check("a: dangerous command still blocked after answering Block", blockedCmd?.block === true);
	check("a: dangerous command counted as gated", last(statuses)?.text === "[dim]gate ✓ 3 checked · 1 gated");

	const blockedPath = await call("edit", { path: path.join(td, ".ssh", "config") });
	check("a: protected path still blocked", blockedPath?.block === true);
	check("a: protected path counted as gated", last(statuses)?.text === "[dim]gate ✓ 4 checked · 2 gated");
	check("a: one dialog per gated call", dialogs.length === 2);

	// a tool the gate does not inspect: no counter movement, no status at all
	const before = statuses.length;
	const other = await call("read", { path: path.join(td, "src", "foo.ts") });
	check("a: an uninspected tool returns normally", other === undefined);
	check("a: an uninspected tool publishes no status", statuses.length === before);
	check("a: an uninspected tool is not counted", last(statuses)?.text === "[dim]gate ✓ 4 checked · 2 gated");

	fs.rmSync(td, { recursive: true, force: true });
}

// (b) an allow-list hit is INSPECTED but not gated — the tally must not claim a
// decision the gate never made, and no dialog may be shown.
{
	const { td, statuses, dialogs, call } = setup({ allowPatterns: ["^git push --force-with-lease origin (?!main)"] });
	const res = await call("bash", { command: "git push --force-with-lease origin feature" });
	check("b: allow-listed command is not blocked", res === undefined);
	check("b: allow-listed command is counted as checked, not gated",
		last(statuses)?.text === "[dim]gate ✓ 1 checked · 0 gated");
	check("b: allow-listed command shows no dialog", dialogs.length === 0);
	fs.rmSync(td, { recursive: true, force: true });
}

// (c) "Allow once" still allows, and is still counted as gated (the gate did stop
// and ask — that is what the number means).
{
	const { td, statuses, call } = setup({}, { select: "Allow once" });
	const res = await call("bash", { command: "sudo whoami" });
	check("c: Allow once still allows", res === undefined);
	check("c: Allow once is counted as gated", last(statuses)?.text === "[dim]gate ✓ 1 checked · 1 gated");
	fs.rmSync(td, { recursive: true, force: true });
}

// (d) a hostile/absent UI: a throwing setStatus must NOT escape the handler. A
// throw here is fail-safe-BLOCKED upstream, so it would turn an observability
// bug into "benign edits stop working".
{
	const { td, call } = setup({}, { ui: { setStatus: () => { throw new Error("boom"); } } });
	let benign, threw = false;
	try { benign = await call("edit", { path: path.join(td, "src", "foo.ts") }); } catch { threw = true; }
	check("d: a throwing setStatus does not throw out of the handler", !threw);
	check("d: the benign edit is still allowed", benign === undefined);

	let blocked;
	threw = false;
	try { blocked = await call("bash", { command: "mkfs.ext4 /dev/sdb1" }); } catch { threw = true; }
	check("d: a throwing setStatus does not throw on the gated path either", !threw);
	check("d: the dangerous command is still blocked", blocked?.block === true);
	fs.rmSync(td, { recursive: true, force: true });
}

// (e) headless (print/JSON mode): no ctx.ui at all. The gate must stay silent and
// keep its fail-closed block.
{
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "gate-status-headless-"));
	fs.mkdirSync(path.join(td, ".pi"));
	fs.writeFileSync(path.join(td, ".pi", "nana-pack.json"), JSON.stringify({ journal: { enabled: false } }));
	const handlers = {};
	ext({ on: (name, fn) => { handlers[name] = fn; } });
	const ctx = { cwd: td, hasUI: false, isProjectTrusted: () => true };
	let res, threw = false;
	try { res = await handlers.tool_call({ toolName: "bash", input: { command: "rm -rf /" } }, ctx); } catch { threw = true; }
	check("e: headless gate does not throw without ctx.ui", !threw);
	check("e: headless gate still blocks fail-closed", res?.block === true);
	fs.rmSync(td, { recursive: true, force: true });
}

process.exit(fails);
