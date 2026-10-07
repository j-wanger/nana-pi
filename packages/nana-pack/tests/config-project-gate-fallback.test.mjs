/**
 * @module packages/nana-pack/tests/config-project-gate-fallback.test.mjs
 * @purpose Pins the PROJECT-scope mirror of the gate fallback — a nana-trusted project's malformed gate block keeps the last valid policy mid-session and stops conservatively in a fresh process
 * @inputs extensions/nana-gate.ts, lib/config.ts, a nana-trusted temp project and pi's trust store under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, temp git projects, trust store), process (sets HOME, runs git and child node processes)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
import { execFileSync, execSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
// L1 invariant 6 for PROJECT scope (astra land ruling, MUST 1): a nana-trusted
// project's gate block that becomes malformed must never widen the gate relative to
// the last effective policy. Mid-session the last valid project gate loaded in this
// process is kept; in a FRESH process (no last-good project gate) the gate STOPS
// conservatively — every gated tool class blocked with
// "project nana-pack.json gate block is malformed — repair it (<file>:<problem>)",
// symmetric with the user-scope stop. Missing project file = no project contribution
// (no stop); a present VALID project gate keeps replace semantics; an untrusted
// project's file is ignored entirely (no stop).
// Pinned widening shapes (each ALLOWED on 47a1f42 after corrupt + restart):
//   1. project extraPatterns deny (terraform destroy) vanishes
//   2. project `allowPatterns: []` cancels a broad user exception → the exception resurrects
//   3. project protectedPaths entry vanishes
// Trust evidence uses the REAL installed pi trust module (owner-recorded trust.json,
// the store write /trust performs), as in config-trust.test.mjs; every gate run is a
// fresh child node process sharing only the temp HOME.
// Run: node --experimental-strip-types <this file>
function findPiIndex() {
	const cands = [];
	try { cands.push(path.join(execSync("npm root -g", { encoding: "utf-8" }).trim(), "@earendil-works", "pi-coding-agent")); } catch {}
	try {
		const bin = fs.realpathSync(execSync(process.platform === "win32" ? "where pi" : "command -v pi", { encoding: "utf-8", shell: true }).trim().split(/\r?\n/)[0]);
		for (let d = path.dirname(bin); d !== path.dirname(d); d = path.dirname(d)) if (path.basename(d) === "pi-coding-agent") { cands.push(d); break; }
	} catch {}
	for (const c of cands) if (fs.existsSync(path.join(c, "dist", "index.js"))) return path.join(c, "dist", "index.js");
	return null;
}
const piIndex = findPiIndex();
if (!piIndex) {
	console.log("SKIP project gate fallback: @earendil-works/pi-coding-agent is not installed globally");
	process.exit(0);
}
const pi = await import(pathToFileURL(piIndex).href);

const HOME = tmpDir(path.join(os.tmpdir(), "pgatefb-home-"));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
const AGENT = path.join(HOME, ".pi", "agent");
fs.mkdirSync(AGENT, { recursive: true });
const USER_CFG = path.join(AGENT, "nana-pack.json");
const JOURNAL = path.join(AGENT, "nana-journal.jsonl");

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };

const GATE_URL = new URL("../extensions/nana-gate.ts", import.meta.url).href;
const CONFIG_URL = new URL("../lib/config.ts", import.meta.url).href;
// A fresh process: install real pi's trust module, then drive the REAL gate handler.
// argv: [cwd, trusted, [[key, toolName, input], ...], corruptBetween?]
const CHILD = path.join(tmpDir(path.join(os.tmpdir(), "pgatefb-child-")), "child.mjs");
fs.writeFileSync(CHILD, `
import * as fs from "node:fs";
const cfg = await import(${JSON.stringify(CONFIG_URL)});
cfg.usePiTrustModule(await import(${JSON.stringify(pathToFileURL(piIndex).href)}));
const ext = (await import(${JSON.stringify(GATE_URL)})).default;
const h = {}; ext({ on: (n, fn) => { h[n] = fn; } });
const [cwd, trusted, calls, corrupt] = JSON.parse(process.argv[2]);
const ctx = { cwd, hasUI: false, isProjectTrusted: () => trusted };
await cfg.primeNanaTrust({ cwd });
const out = {};
for (const [k, toolName, input] of calls) {
	if (k === "__corrupt__") { fs.writeFileSync(corrupt[0], corrupt[1]); continue; }
	out[k] = (await h.tool_call({ toolName, input }, ctx)) ?? null;
}
console.log(JSON.stringify(out));
`);
function run(cwd, calls, { trusted = true, corrupt = null } = {}) {
	const stdout = execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", CHILD, JSON.stringify([cwd, trusted, calls, corrupt])], {
		env: { ...process.env, HOME, USERPROFILE: HOME },
		encoding: "utf-8",
	});
	return JSON.parse(stdout.trim().split("\n").at(-1));
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PSTOP = (file) => new RegExp(`^nana-gate: project nana-pack\\.json gate block is malformed — repair it \\(${esc(file)}:.+\\)(?:\\. Recovery:.*)?$`, "s");
const blocked = (r) => r?.block === true;
const TRAILING = '{ "gate": { "extraPatterns": ["\\\\bterraform\\\\s+destroy\\\\b"], }, }';

function project(body, { trust = true } = {}) {
	const td = tmpDir(path.join(os.tmpdir(), "pgatefb-proj-"));
	fs.mkdirSync(path.join(td, ".pi"));
	const file = path.join(td, ".pi", "nana-pack.json");
	if (body !== null) fs.writeFileSync(file, typeof body === "string" ? body : JSON.stringify(body));
	if (trust) new pi.ProjectTrustStore(pi.getAgentDir()).set(td, true); // what /trust records
	return { td, file };
}
const ALL = (cmd, p) => [
	["bash", "bash", { command: cmd }],
	["powershell", "powershell", { command: cmd }],
	["edit", "edit", { path: p }],
	["write", "write", { path: p }],
];

check("fixture: pi agent dir is the isolated HOME", pi.getAgentDir() === AGENT);
fs.writeFileSync(USER_CFG, JSON.stringify({ gate: {} })); // valid user scope, no custom deny

// ── shape 1: project deny (extraPatterns) ──
{
	const P = project({ gate: { extraPatterns: ["\\bterraform\\s+destroy\\b"] } });
	const before = run(P.td, [["tf", "bash", { command: "terraform destroy" }]]);
	check("1: valid trusted project deny — terraform destroy BLOCKED", blocked(before.tf), JSON.stringify(before));
	fs.writeFileSync(P.file, TRAILING);
	const after = run(P.td, [["tf", "bash", { command: "terraform destroy" }], ...ALL("ls -la", "src/a.ts")]);
	// req: R-067
	check("1: corrupted + fresh process — terraform destroy still BLOCKED", blocked(after.tf), JSON.stringify(after.tf));
	check("1: stop reason names the project file and the repair", PSTOP(P.file).test(after.tf?.reason ?? ""), after.tf?.reason);
	for (const k of ["bash", "powershell", "edit", "write"])
		check(`1: project stop blocks every gated class — ${k}`, blocked(after[k]) && PSTOP(P.file).test(after[k].reason), JSON.stringify(after[k]));
	// mid-session corruption keeps the last valid project gate (not a stop)
	fs.writeFileSync(P.file, JSON.stringify({ gate: { extraPatterns: ["\\bterraform\\s+destroy\\b"] } }));
	const mid = run(P.td, [["tf0", "bash", { command: "terraform destroy" }], ["__corrupt__"], ["tf", "bash", { command: "terraform destroy" }], ["ls", "bash", { command: "ls -la" }]], { corrupt: [P.file, TRAILING] });
	// req: R-067
	check("1: corrupted mid-session — last valid project deny still enforced", blocked(mid.tf0) && blocked(mid.tf) && !PSTOP(P.file).test(mid.tf?.reason ?? ""), JSON.stringify(mid));
	check("1: corrupted mid-session — benign command allowed (last-good, not a stop)", mid.ls === null, JSON.stringify(mid.ls));
	// repair clears the stop
	fs.writeFileSync(P.file, JSON.stringify({ gate: { extraPatterns: ["\\bterraform\\s+destroy\\b"] } }));
	const fixed = run(P.td, [["tf", "bash", { command: "terraform destroy" }], ["ls", "bash", { command: "ls -la" }]]);
	check("1: repaired — deny enforced, benign allowed", blocked(fixed.tf) && fixed.ls === null, JSON.stringify(fixed));
	const lines = fs.readFileSync(JOURNAL, "utf-8").trim().split("\n").map((l) => JSON.parse(l));
	check("1: the project stop is journaled (config_gate_fallback on the project file)", lines.some((l) => l.event === "config_gate_fallback" && l.file === P.file && /BLOCKED/.test(l.problem)));
}

// ── shape 2: exception resurrection (project allowPatterns: [] cancels a broad user exception) ──
{
	fs.writeFileSync(USER_CFG, JSON.stringify({ gate: { allowPatterns: ["^rm -rf /tmp/"] } }));
	const P = project({ gate: { allowPatterns: [] } });
	const before = run(P.td, [["rm", "bash", { command: "rm -rf /tmp/x" }]]);
	check("2: valid project allowPatterns [] replaces the user exception — rm -rf /tmp/x BLOCKED", blocked(before.rm), JSON.stringify(before));
	fs.writeFileSync(P.file, '{ "gate": { "allowPatterns": [], }, }');
	const after = run(P.td, [["rm", "bash", { command: "rm -rf /tmp/x" }]]);
// req: R-773
	check("2: corrupted + fresh process — user exception does NOT resurrect (BLOCKED)", blocked(after.rm), JSON.stringify(after.rm));
	check("2: blocked by the project stop", PSTOP(P.file).test(after.rm?.reason ?? ""), after.rm?.reason);
	// control: without a project file the user exception applies (missing ≠ stop)
	const none = project(null);
	const ctl = run(none.td, [["rm", "bash", { command: "rm -rf /tmp/x" }], ["ls", "bash", { command: "ls -la" }]]);
	check("2: control — no project file: user exception applies, no stop", ctl.rm === null && ctl.ls === null, JSON.stringify(ctl));
	fs.writeFileSync(USER_CFG, JSON.stringify({ gate: {} }));
}

// ── shape 3: project protectedPaths entry ──
{
	const P = project({ gate: { protectedPaths: ["(^|/)secrets/"] } });
	const before = run(P.td, [["w", "write", { path: "secrets/key.txt" }], ["ok", "write", { path: "src/a.ts" }]]);
	check("3: valid project protectedPaths — write secrets/key.txt BLOCKED, src/a.ts allowed", blocked(before.w) && before.ok === null, JSON.stringify(before));
	fs.writeFileSync(P.file, '{ "gate": { "protectedPaths": ["(^|/)secrets/"], }, }');
	const after = run(P.td, [["w", "write", { path: "secrets/key.txt" }], ["e", "edit", { path: "secrets/key.txt" }]]);
	check("3: corrupted + fresh process — write secrets/key.txt still BLOCKED", blocked(after.w), JSON.stringify(after.w));
	check("3: corrupted + fresh process — edit secrets/key.txt still BLOCKED", blocked(after.e), JSON.stringify(after.e));
	check("3: blocked by the project stop", PSTOP(P.file).test(after.w?.reason ?? ""), after.w?.reason);
}

// ── contract controls ──
{
	// a malformed gate LEAF (not only bad JSON) also stops
	const L = project({ gate: { extraPatterns: "terraform" } });
	const r = run(L.td, [["ls", "bash", { command: "ls -la" }]]);
	check("control: malformed gate leaf (string, not array) in a trusted project → stop", blocked(r.ls) && PSTOP(L.file).test(r.ls.reason), JSON.stringify(r));
	// a malformed NON-gate block does not stop the gate
	const NG = project({ gate: {}, notify: { enabled: "yes" } });
	const ng = run(NG.td, [["ls", "bash", { command: "ls -la" }]]);
	check("control: malformed non-gate block in a trusted project → no stop", ng.ls === null, JSON.stringify(ng));
	// untrusted corrupted project: ignored, not a stop
	const U = project(TRAILING, { trust: false });
	const u = run(U.td, [["ls", "bash", { command: "ls -la" }]], { trusted: false });
	// req: R-069
	check("control: untrusted corrupted project → ignored, no stop", u.ls === null, JSON.stringify(u));
	// nana-only folder pi auto-trusts but the owner never decided: ignored, not a stop
	const A = project(TRAILING, { trust: false });
	const a = run(A.td, [["ls", "bash", { command: "ls -la" }]], { trusted: true });
	// req: R-069
	check("control: auto-trusted (undecided) corrupted project → ignored, no stop", a.ls === null, JSON.stringify(a));
	// valid project keeps replace semantics: project extraPatterns [] replaces the user's deny
	fs.writeFileSync(USER_CFG, JSON.stringify({ gate: { extraPatterns: ["\\bterraform\\s+destroy\\b"] } }));
	const R = project({ gate: { extraPatterns: [] } });
	const rr = run(R.td, [["tf", "bash", { command: "terraform destroy" }]]);
	check("control: valid project gate keeps replace semantics (project [] replaces the user leaf)", rr.tf === null, JSON.stringify(rr));
	// user stop takes precedence over a project stop (the reason names the user file)
	fs.writeFileSync(USER_CFG, TRAILING);
	const B = project(TRAILING);
	const b = run(B.td, [["ls", "bash", { command: "ls -la" }]]);
	// req: R-068
	check("control: both malformed → the user stop wins", blocked(b.ls) && /^nana-gate: user nana-pack\.json gate block is malformed/.test(b.ls.reason), JSON.stringify(b));
	fs.writeFileSync(USER_CFG, JSON.stringify({ gate: {} }));
}

// ── U2 fix (MUST B): a DANGLING project nana-pack.json symlink is an unusable file, not absence ──
{
	const D = project(null);
	let linked = true;
	try {
		fs.symlinkSync(path.join(D.td, "no-such-target.json"), D.file);
	} catch {
		linked = false;
		console.log("SKIP-NOTE: no symlink privilege — dangling project row skipped");
	}
	if (linked) {
		const r = run(D.td, [["ls", "bash", { command: "ls -la" }]]);
		// req: R-196
		check("U2-B: dangling project nana-pack.json symlink in a trusted project → stop (not defaults)", blocked(r.ls) && PSTOP(D.file).test(r.ls.reason) && /dangling symlink/.test(r.ls.reason), JSON.stringify(r));
	}
}

process.exit(fails);
