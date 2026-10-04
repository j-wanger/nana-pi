/**
 * @module packages/nana-pack/tests/agent-dir-hostile.test.mjs
 * @purpose Regression cases for the hostile agent-dir shapes — a symlinked policy file is enforced at its target, a dangling link stops rather than falling to the defaults, and a relative dir under a deleted cwd never throws
 * @inputs extensions/nana-gate.ts, lib/config.ts, lib/gate-paths.ts, symlinked and dangling nana-pack.json / trust.json under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, symlinks, a deleted cwd), process (sets HOME and PI_CODING_AGENT_DIR, runs a shell through execFileSync)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// U2 fix round (sol adversarial r1, 2026-09-28) — the reviewer's three probes as regressions:
//  (A) a SYMLINKED nana-pack.json / trust.json (active dir AND default dir): the gate reads the
//      TARGET, so edit/write/shell writes to the target are on the floor;
//  (B) a DANGLING user nana-pack.json symlink is an unusable policy file — stop / last-valid,
//      never a silent fall to the defaults; directory and unreadable cases keep stopping;
//  (C) a relative PI_CODING_AGENT_DIR under a DELETED cwd: piAgentDir(), piTrustStorePath(),
//      loadConfig() and the tool handler all return (none throws).
// Run: node --experimental-strip-types packages/nana-pack/tests/agent-dir-hostile.test.mjs
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const HOME = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "nana-u2h-")));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
delete process.env.PI_CODING_AGENT_DIR;

const GATE = new URL("../extensions/nana-gate.ts", import.meta.url).href;
const CONFIG = new URL("../lib/config.ts", import.meta.url).href;
const PATHS = new URL("../lib/gate-paths.ts", import.meta.url).href;
const ext = (await import(GATE)).default;
const { loadConfig } = await import(CONFIG);
let handler;
ext({ on: (ev, fn) => { if (ev === "tool_call") handler = fn; } });
const ctx = { cwd: HOME, hasUI: false, isProjectTrusted: () => false };
const call = async (toolName, input) => ((await handler({ toolName, input }, ctx))?.block ? "BLOCK" : "ALLOW");

let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : extra); if (!ok) fails++; };

let canLink = true;
try {
	fs.symlinkSync(os.tmpdir(), path.join(HOME, "probe-link"), "dir");
} catch {
	canLink = false;
	console.log("SKIP-NOTE: no symlink privilege — A and B rows skipped");
}

if (canLink) {
	// ── A: active dir, symlinked FILES ──
	const agent = path.join(HOME, "agent");
	fs.mkdirSync(agent);
	const target = path.join(HOME, "actual-policy.json");
	fs.writeFileSync(target, JSON.stringify({ gate: { extraPatterns: ["LINK_DENY"] } }));
	fs.symlinkSync(target, path.join(agent, "nana-pack.json"));
	const trustTarget = path.join(HOME, "dotfiles-trust.json");
	fs.writeFileSync(trustTarget, "{}");
	fs.symlinkSync(trustTarget, path.join(agent, "trust.json"));
	process.env.PI_CODING_AGENT_DIR = agent;
	// req: R-195
	check("A: the linked policy is the one enforced (LINK_DENY blocked)", (await call("bash", { command: "LINK_DENY" })) === "BLOCK");
	for (const t of [target, trustTarget]) {
		// req: R-195
		check(`A: edit ${path.basename(t)} (symlink target) BLOCKED`, (await call("edit", { path: t })) === "BLOCK");
		check(`A: write ${path.basename(t)} (symlink target) BLOCKED`, (await call("write", { path: t })) === "BLOCK");
		check(`A: printf x > ${path.basename(t)} BLOCKED`, (await call("bash", { command: `printf x > ${t}` })) === "BLOCK");
		check(`A: tee ${path.basename(t)} BLOCKED`, (await call("bash", { command: `echo x | tee ${t}` })) === "BLOCK");
	}
	check("A: the link itself stays BLOCKED", (await call("edit", { path: path.join(agent, "nana-pack.json") })) === "BLOCK");
	check("A: an unrelated sibling file stays ALLOWED", (await call("edit", { path: path.join(HOME, "notes.txt") })) === "ALLOW");

	// ── A: DEFAULT dir, symlinked file (no PI_CODING_AGENT_DIR) ──
	delete process.env.PI_CODING_AGENT_DIR;
	const def = path.join(HOME, ".pi", "agent");
	fs.mkdirSync(def, { recursive: true });
	const defTarget = path.join(HOME, "dotfiles", "pack.json");
	fs.mkdirSync(path.dirname(defTarget));
	fs.writeFileSync(defTarget, JSON.stringify({ gate: { extraPatterns: ["DEF_DENY"] } }));
	fs.symlinkSync(defTarget, path.join(def, "nana-pack.json"));
	// req: R-195
	check("A-default: the linked default policy is enforced", (await call("bash", { command: "DEF_DENY" })) === "BLOCK");
	check("A-default: edit the target BLOCKED", (await call("edit", { path: defTarget })) === "BLOCK");
	check("A-default: shell write to the target BLOCKED", (await call("bash", { command: `printf x > ${defTarget}` })) === "BLOCK");

	// ── B: dangling user nana-pack.json → stop, not defaults ──
	const cases = [];
	const dang = path.join(HOME, "dang");
	fs.mkdirSync(dang);
	fs.symlinkSync(path.join(HOME, "no-target"), path.join(dang, "nana-pack.json"));
	cases.push(["dangling", dang, /dangling symlink/]);
	const dircfg = path.join(HOME, "dircfg");
	fs.mkdirSync(path.join(dircfg, "nana-pack.json"), { recursive: true });
	cases.push(["directory", dircfg, /EISDIR/]);
	const missing = path.join(HOME, "missing");
	fs.mkdirSync(missing);
	cases.push(["absent (control)", missing, null]);
	for (const [name, dir, want] of cases) {
		process.env.PI_CODING_AGENT_DIR = dir;
		const c = loadConfig({ cwd: HOME, hasUI: false, sessionManager: { getSessionId: () => `b-${name}` } });
		// req: R-196
		if (want) check(`B: ${name} user nana-pack.json → stop naming it`, want.test(c.gate.stopReason ?? "") && (c.gate.stopReason ?? "").includes(path.join(dir, "nana-pack.json")), String(c.gate.stopReason));
		else check(`B: ${name} → no stop, defaults`, c.gate.stopReason === null, String(c.gate.stopReason));
	}
	// last-valid rule applies to a file that BECOMES dangling mid-process
	const mid = path.join(HOME, "mid");
	fs.mkdirSync(mid);
	const midTarget = path.join(HOME, "mid-target.json");
	fs.writeFileSync(midTarget, JSON.stringify({ gate: { extraPatterns: ["MID_DENY"] } }));
	fs.symlinkSync(midTarget, path.join(mid, "nana-pack.json"));
	process.env.PI_CODING_AGENT_DIR = mid;
	const c1 = loadConfig({ cwd: HOME, hasUI: false });
	fs.rmSync(midTarget);
	const c2 = loadConfig({ cwd: HOME, hasUI: false });
	// req: R-196
	check("B: link goes dangling mid-process → last valid deny kept, no stop", c1.gate.extraPatterns.includes("MID_DENY") && c2.gate.extraPatterns.includes("MID_DENY") && c2.gate.stopReason === null, JSON.stringify(c2.gate));
	delete process.env.PI_CODING_AGENT_DIR;
}

// ── C: deleted cwd with a relative PI_CODING_AGENT_DIR (child process: it deletes its own cwd) ──
{
	const script = path.join(HOME, "gone-child.mjs");
	fs.writeFileSync(script, `
import * as fs from "node:fs"; import * as os from "node:os"; import * as path from "node:path";
const d = fs.mkdtempSync(path.join(os.tmpdir(), "u2-gone-")); process.chdir(d); process.env.PI_CODING_AGENT_DIR = "agent"; fs.rmdirSync(d);
const out = {};
const gp = await import(${JSON.stringify(PATHS)});
for (const [n, f] of [["piAgentDir", () => gp.piAgentDir()], ["piAgentDirIsCwdRelative", () => gp.piAgentDirIsCwdRelative()], ["piTrustStorePath", () => gp.piTrustStorePath()], ["commandPolicyHit", () => gp.commandPolicyHit("echo x > agent/nana-pack.json", ".")]])
	try { out[n] = { ok: f() }; } catch (e) { out[n] = { threw: String(e) }; }
const { loadConfig } = await import(${JSON.stringify(CONFIG)});
try { out.loadConfig = { ok: loadConfig({ cwd: ".", hasUI: false }).gate.stopReason }; } catch (e) { out.loadConfig = { threw: String(e) }; }
const ext = (await import(${JSON.stringify(GATE)})).default; let h; ext({ on: (e, f) => { if (e === "tool_call") h = f; } });
try { out.tool_call = { ok: await h({ toolName: "bash", input: { command: "echo safe" } }, { cwd: ".", hasUI: false, isProjectTrusted: () => false }) }; } catch (e) { out.tool_call = { threw: String(e) }; }
console.log(JSON.stringify(out));
`);
	const res = JSON.parse(execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", script], { env: { ...process.env, HOME, USERPROFILE: HOME }, encoding: "utf-8" }).trim().split("\n").at(-1));
	for (const n of ["piAgentDir", "piAgentDirIsCwdRelative", "piTrustStorePath", "commandPolicyHit", "loadConfig", "tool_call"])
		// req: R-826
		check(`C: ${n} returns under a deleted cwd`, res[n] && !("threw" in res[n]), JSON.stringify(res[n]));
	// req: R-197
	check("C: loadConfig STOPS (the active file is unknowable) rather than using defaults", /agent dir unresolvable/.test(res.loadConfig?.ok ?? ""), JSON.stringify(res.loadConfig));
	// req: R-826
	check("C: the handler blocks with that reason (does not throw)", res.tool_call?.ok?.block === true && /agent dir unresolvable/.test(res.tool_call.ok.reason), JSON.stringify(res.tool_call));
}

fs.rmSync(HOME, { recursive: true, force: true });
console.log(fails ? `${fails} FAIL` : "all PASS");
process.exit(fails ? 1 : 0);
