/**
 * @module packages/nana-pack/tests/config-gate-fallback.test.mjs
 * @purpose Pins that a malformed USER gate block never widens the gate — mid-session the last valid policy is kept in memory, and a fresh process stops every gated tool class with the repair reason
 * @inputs extensions/nana-gate.ts and malformed nana-pack.json files under fresh temp HOMEs
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOMEs and config files), process (sets HOME, spawns child node processes for the fresh-process cases)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Permission-block exception (L1 invariant 2, astra r2 HIGH): for the gate block,
// "default" is never the fallback. Mid-session, a malformed user gate block keeps the
// last valid policy loaded IN THIS PROCESS (memory only). In a FRESH process the gate
// stops conservatively: every gated tool class (bash, powershell, edit, write) is
// blocked with "user nana-pack.json gate block is malformed — repair it (<file>:<problem>)".
// Nothing is persisted (sol r1 HIGH: a persisted snapshot is forgeable by the agent the
// gate constrains), so no file anywhere on disk can widen the gate after a restart.
// A malformed gate block never allows more than the last valid one. Drives the REAL
// registered gate handler; the fresh-process cases run in a child node process
// sharing only the temp HOME.
// Run: node --experimental-strip-types <this file>
const GATE_URL = new URL("../extensions/nana-gate.ts", import.meta.url).href;
const ext = (await import(GATE_URL)).default;

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };

function freshHome() {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "gatefb-home-"));
	fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	process.env.HOME = home;
	process.env.USERPROFILE = home;
	return {
		home,
		cfg: path.join(home, ".pi", "agent", "nana-pack.json"),
		journal: path.join(home, ".pi", "agent", "nana-journal.jsonl"),
	};
}
function gate(opts = {}) {
	const handlers = {};
	ext({ on: (n, fn) => { handlers[n] = fn; } });
	const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "gatefb-cwd-"));
	const ctx = { cwd, hasUI: false, isProjectTrusted: () => false, ...opts };
	return (toolName, input) => handlers.tool_call({ toolName, input }, ctx);
}
const bash = (call, command) => call("bash", { command });
const blocked = (r) => r?.block === true;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const TRAILING = '{ "gate": { "extraPatterns": ["\\\\bterraform\\\\s+destroy\\\\b"], }, }';
const STOP = (file) => new RegExp(`^nana-gate: user nana-pack\\.json gate block is malformed — repair it \\(${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:.+\\)(?:\\. Recovery:.*)?$`, "s");

// Runs the gate in a FRESH node process (no in-memory state) against HOME.
const CHILD = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "gatefb-child-")), "child.mjs");
fs.writeFileSync(CHILD, `
const ext = (await import(${JSON.stringify(GATE_URL)})).default;
const h = {}; ext({ on: (n, fn) => { h[n] = fn; } });
const ctx = { cwd: process.cwd(), hasUI: false, isProjectTrusted: () => false };
const out = {};
for (const [k, toolName, input] of JSON.parse(process.argv[2])) out[k] = (await h.tool_call({ toolName, input }, ctx)) ?? null;
console.log(JSON.stringify(out));
`);
function freshProcess(home, calls) {
	const stdout = execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", CHILD, JSON.stringify(calls)], {
		env: { ...process.env, HOME: home, USERPROFILE: home },
		encoding: "utf-8",
	});
	return JSON.parse(stdout.trim().split("\n").at(-1));
}

// (a) custom deny configured + loaded → corrupted MID-SESSION → still blocked
const A = freshHome();
{
	fs.writeFileSync(A.cfg, JSON.stringify({ gate: { extraPatterns: ["\\bterraform\\s+destroy\\b"], allowPatterns: ["^git status$"] } }));
	const call = gate();
	check("a: valid config — terraform destroy blocked", blocked(await bash(call, "terraform destroy")));
	check("a: valid config — allow pattern applies", (await bash(call, "git status")) === undefined);
	// req: R-066
	check("a: nothing persisted beside the config (no policy file to forge)", eq(fs.readdirSync(path.dirname(A.cfg)).filter((f) => f !== "nana-journal.jsonl"), ["nana-pack.json"]));
	fs.writeFileSync(A.cfg, TRAILING); // corrupted mid-session
	// req: R-063
	check("a: corrupted mid-session — terraform destroy STILL blocked", blocked(await bash(call, "terraform destroy")));
	check("a: corrupted mid-session — rm -rf /tmp/x blocked", blocked(await bash(call, "rm -rf /tmp/x")));
	// req: R-063
	check("a: corrupted mid-session — benign command still allowed", (await bash(call, "ls -la")) === undefined);
	const lines = fs.readFileSync(A.journal, "utf-8").trim().split("\n").map((l) => JSON.parse(l));
	check("a: one config_invalid line names the file", lines.filter((l) => l.event === "config_invalid" && l.file === A.cfg).length === 1);
// req: R-772
	check("a: the fallback is journaled (config_gate_fallback)", lines.some((l) => l.event === "config_gate_fallback" && l.file === A.cfg));
}

// (b) FRESH PROCESS with the corrupted file → conservative STOP after restart (the
// mid-session policy is gone with the process; nothing on disk stands in for it)
{
	const out = freshProcess(A.home, [
		["tf", "bash", { command: "terraform destroy" }],
		["ls", "bash", { command: "ls -la" }],
		["ps", "powershell", { command: "Get-ChildItem" }],
		["edit", "edit", { path: "src/a.ts" }],
		["write", "write", { path: "notes.md" }],
		["read", "read", { path: "src/a.ts" }],
	]);
	for (const k of ["tf", "ls", "ps", "edit", "write"])
		// req: R-064
		check(`b: stop after restart — ${k} blocked with the repair reason`, out[k]?.block === true && STOP(A.cfg).test(out[k]?.reason ?? ""), JSON.stringify(out[k]));
	check("b: the reason names the problem (invalid JSON)", /invalid JSON/.test(out.ls?.reason ?? ""), out.ls?.reason);
	check("b: tools outside the gate's scope untouched (read)", out.read === null);
}

// (c) FRESH PROCESS, malformed gate LEAF → stop; interactive too; repair restores service
{
	const C = freshHome();
	fs.writeFileSync(C.cfg, JSON.stringify({ gate: { allowPatterns: ".*" } }));
	const out = freshProcess(C.home, [["ls", "bash", { command: "ls -la" }], ["edit", "edit", { path: "src/a.ts" }]]);
	for (const k of ["ls", "edit"])
		check(`c: malformed leaf, fresh process — ${k} blocked`, out[k]?.block === true && STOP(C.cfg).test(out[k]?.reason ?? ""), JSON.stringify(out[k]));
	// req: R-064
	check("c: the reason names the malformed leaf", /gate\.allowPatterns/.test(out.ls?.reason ?? ""), out.ls?.reason);
	// interactive sessions stop too — no dialog can re-open a gate whose policy is unknown
	let dialogs = 0;
	const call = gate({ hasUI: true, ui: { select: async () => { dialogs++; return "Allow once"; }, setStatus() {}, notify() {}, theme: { fg: (_c, t) => t } } });
	const r = await bash(call, "ls");
	// req: R-064
	check("c: interactive + fresh malformed — blocked without a dialog", blocked(r) && dialogs === 0 && STOP(C.cfg).test(r.reason));
	// repairing the file restores normal service in the same session
	fs.writeFileSync(C.cfg, JSON.stringify({ gate: {} }));
	// req: R-065
	check("c: repaired file — benign command allowed again", (await bash(call, "ls")) === undefined);
}

// (d) a malformed gate block never allows more than the last valid one
{
	const D = freshHome();
	fs.writeFileSync(D.cfg, JSON.stringify({ gate: { allowPatterns: ["^git status$"] } }));
	const call = gate();
	await bash(call, "git status"); // loads + validates
	for (const [label, bad] of [
		["allowPatterns as a string", { gate: { allowPatterns: ".*" } }],
		["a malformed ENTRY beside a widening one", { gate: { allowPatterns: [".*", 7] } }],
		["an invalid regex beside a widening one", { gate: { allowPatterns: [".*", "("] } }],
		["extraPatterns null + widening allow", { gate: { extraPatterns: null, allowPatterns: [".*"] } }],
		["gate block = array", { gate: [".*"] }],
	]) {
		fs.writeFileSync(D.cfg, JSON.stringify(bad));
		check(`d: ${label} — rm -rf /tmp/x still blocked`, blocked(await bash(call, "rm -rf /tmp/x")));
		check(`d: ${label} — the last valid allow still applies`, (await bash(call, "git status")) === undefined);
	}
	const fresh = freshProcess(D.home, [["rm", "bash", { command: "rm -rf /tmp/x" }], ["gs", "bash", { command: "git status" }]]);
	check("d: fresh process — rm -rf still blocked", fresh.rm?.block === true);
	check("d: fresh process — stopped, so not even the last valid allow applies", fresh.gs?.block === true && STOP(D.cfg).test(fresh.gs.reason));
	// A planted WIDER policy file anywhere on disk cannot widen the gate after restart:
	// the old snapshot path, variants beside the config, in HOME, and in the cwd.
	const wide = JSON.stringify({ gate: { allowPatterns: [".*"], extraPatterns: [], protectedPaths: [] } });
	const agent = path.dirname(D.cfg);
	const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "gatefb-cwd-"));
	for (const f of [path.join(agent, "nana-pack.gate.validated.json"), path.join(agent, "nana-pack.gate.json"), path.join(agent, "nana-pack.json.bak"),
		path.join(D.home, "nana-pack.json"), path.join(cwd, ".pi", "nana-pack.json"), path.join(cwd, ".pi", "nana-pack.gate.validated.json")]) {
		fs.mkdirSync(path.dirname(f), { recursive: true });
		fs.writeFileSync(f, wide);
	}
	const planted = execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", CHILD, JSON.stringify([["rm", "bash", { command: "rm -rf /tmp/x" }], ["ls", "bash", { command: "ls" }]])], {
		env: { ...process.env, HOME: D.home, USERPROFILE: D.home }, encoding: "utf-8", cwd,
	});
	const po = JSON.parse(planted.trim().split("\n").at(-1));
	check("d: planted wider policy files after restart — rm -rf blocked", po.rm?.block === true, JSON.stringify(po));
	// req: R-066
	check("d: planted wider policy files after restart — gate still STOPPED (not widened)", po.ls?.block === true && STOP(D.cfg).test(po.ls.reason), JSON.stringify(po));
}

// (e) a missing user config is not "malformed": defaults, no stop, nothing written
{
	const E = freshHome();
	const call = gate();
	check("e: no user config — benign allowed", (await bash(call, "ls")) === undefined);
	check("e: no user config — built-in rm -rf still blocked", blocked(await bash(call, "rm -rf /tmp/x")));
	const out = freshProcess(E.home, [["ls", "bash", { command: "ls" }]]);
	check("e: no user config, fresh process — benign allowed (defaults, no stop)", out.ls === null, JSON.stringify(out));
	check("e: no user config — no policy file written", !fs.existsSync(path.join(path.dirname(E.cfg), "nana-pack.gate.validated.json")));
}

process.exit(fails);
