import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// Permission-block exception (L1 invariant 2, astra r2 HIGH): for the gate block,
// "default" is never the fallback once a valid policy existed. Every valid load
// persists ~/.pi/agent/nana-pack.gate.validated.json; a malformed user gate block
// enforces that snapshot (mid-session AND in a fresh process), and with no snapshot
// the gate stops conservatively: every gated tool class is blocked with
// "repair nana-pack.json". A malformed gate block never allows more than the last
// valid one. Drives the REAL registered gate handler; the fresh-process cases run
// in a child node process sharing only the temp HOME.
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
		snap: path.join(home, ".pi", "agent", "nana-pack.gate.validated.json"),
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
const TRAILING = '{ "gate": { "extraPatterns": ["\\\\bterraform\\\\s+destroy\\\\b"], }, }';

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
	check("a: a validated snapshot was persisted beside the config", JSON.parse(fs.readFileSync(A.snap, "utf-8")).gate.extraPatterns[0] === "\\bterraform\\s+destroy\\b");
	fs.writeFileSync(A.cfg, TRAILING); // corrupted mid-session
	check("a: corrupted mid-session — terraform destroy STILL blocked", blocked(await bash(call, "terraform destroy")));
	check("a: corrupted mid-session — rm -rf /tmp/x blocked", blocked(await bash(call, "rm -rf /tmp/x")));
	check("a: corrupted mid-session — benign command still allowed", (await bash(call, "ls -la")) === undefined);
	const lines = fs.readFileSync(A.journal, "utf-8").trim().split("\n").map((l) => JSON.parse(l));
	check("a: one config_invalid line names the file", lines.filter((l) => l.event === "config_invalid" && l.file === A.cfg).length === 1);
	check("a: the fallback is journaled (config_gate_fallback)", lines.some((l) => l.event === "config_gate_fallback" && l.file === A.cfg));
}

// (b) FRESH PROCESS with the corrupted file → the snapshot is enforced
{
	const out = freshProcess(A.home, [["tf", "bash", { command: "terraform destroy" }], ["rm", "bash", { command: "rm -rf /tmp/x" }], ["ls", "bash", { command: "ls -la" }]]);
	check("b: fresh process + corrupted file — terraform destroy blocked (snapshot)", out.tf?.block === true, JSON.stringify(out));
	check("b: fresh process — built-in rm -rf still blocked", out.rm?.block === true);
	check("b: fresh process — benign command allowed (snapshot is a real policy, not a stop)", out.ls === null);
}

// (c) FRESH PROCESS, corrupted file, NO snapshot → conservative stop of every gated class
{
	const C = freshHome();
	fs.writeFileSync(C.cfg, TRAILING);
	const out = freshProcess(C.home, [
		["ls", "bash", { command: "ls -la" }],
		["ps", "powershell", { command: "Get-ChildItem" }],
		["edit", "edit", { path: "src/a.ts" }],
		["write", "write", { path: "notes.md" }],
		["read", "read", { path: "src/a.ts" }],
	]);
	for (const k of ["ls", "ps", "edit", "write"])
		check(`c: no snapshot — ${k} blocked with the repair reason`, out[k]?.block === true && /repair nana-pack\.json/.test(out[k]?.reason ?? ""), JSON.stringify(out[k]));
	check("c: no snapshot — tools outside the gate's scope untouched (read)", out.read === null);
	// interactive sessions stop too — no dialog can re-open a gate whose policy is unknown
	let dialogs = 0;
	const call = gate({ hasUI: true, ui: { select: async () => { dialogs++; return "Allow once"; }, setStatus() {}, notify() {}, theme: { fg: (_c, t) => t } } });
	const r = await bash(call, "ls");
	check("c: interactive + no snapshot — blocked without a dialog", blocked(r) && dialogs === 0);
	// repairing the file restores normal service in the same session
	fs.writeFileSync(C.cfg, JSON.stringify({ gate: {} }));
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
	const fresh = freshProcess(D.home, [["rm", "bash", { command: "rm -rf /tmp/x" }]]);
	check("d: fresh process — still blocked", fresh.rm?.block === true);
	// a corrupted SNAPSHOT is not trusted either
	fs.writeFileSync(D.snap, '{"gate":{"allowPatterns":7}}');
	const out = freshProcess(D.home, [["ls", "bash", { command: "ls" }]]);
	check("d: malformed config + malformed snapshot → conservative stop", out.ls?.block === true && /repair nana-pack\.json/.test(out.ls.reason));
}

// (e) a missing user config is not "malformed": defaults, no stop, no snapshot
{
	const E = freshHome();
	const call = gate();
	check("e: no user config — benign allowed", (await bash(call, "ls")) === undefined);
	check("e: no user config — no snapshot written", !fs.existsSync(E.snap));
}

process.exit(fails);
