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
import { tmpDir } from "./tmp-dir.mjs";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const HOME = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "nana-u2h-")));
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

// ── C: deleted cwd with a relative PI_CODING_AGENT_DIR (child process: it deletes its own cwd) ──
if (process.platform === "win32") {
	console.log("SKIP section C: deleted-cwd probes (Windows locks a live cwd and will not delete it)");
} else {
	const script = path.join(HOME, "gone-child.mjs");
	fs.writeFileSync(script, `
import * as fs from "node:fs"; import * as os from "node:os"; import * as path from "node:path";
import { tmpDir } from ${JSON.stringify(new URL("./tmp-dir.mjs", import.meta.url).href)};
const tmpRoot = tmpDir(path.join(os.tmpdir(), "u2-bulk-"));
for (let i = 0; i < 50000; i++) fs.mkdirSync(path.join(tmpRoot, "empty-" + i));
const d = tmpDir(path.join(tmpRoot, "u2-gone-")); process.chdir(d); process.env.PI_CODING_AGENT_DIR = "agent"; fs.rmdirSync(d);
const began = Date.now();
const out = {};
const gp = await import(${JSON.stringify(PATHS)});
for (const [n, f] of [["piAgentDir", () => gp.piAgentDir()], ["piAgentDirIsCwdRelative", () => gp.piAgentDirIsCwdRelative()], ["piTrustStorePath", () => gp.piTrustStorePath()], ["commandPolicyHit", () => gp.commandPolicyHit("echo x > agent/nana-pack.json", ".")]])
	try { out[n] = { ok: f() }; } catch (e) { out[n] = { threw: String(e) }; }
const { loadConfig } = await import(${JSON.stringify(CONFIG)});
try { out.loadConfig = { ok: loadConfig({ cwd: ".", hasUI: false }).gate.stopReason }; } catch (e) { out.loadConfig = { threw: String(e) }; }
const ext = (await import(${JSON.stringify(GATE)})).default; let h; ext({ on: (e, f) => { if (e === "tool_call") h = f; } });
try { out.tool_call = { ok: await h({ toolName: "bash", input: { command: "echo safe" } }, { cwd: ".", hasUI: false, isProjectTrusted: () => false }) }; } catch (e) { out.tool_call = { threw: String(e) }; }
out.elapsedMs = Date.now() - began;
out.siblingCount = fs.readdirSync(tmpRoot).length;
process.chdir(${JSON.stringify(HOME)});
fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(JSON.stringify(out));
`);
	const res = JSON.parse(execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", script], { env: { ...process.env, HOME, USERPROFILE: HOME }, encoding: "utf-8", timeout: 30000 }).trim().split("\n").at(-1));
	// req: R-826
	check("C: deleted-cwd handlers return promptly with 50,000 temporary siblings", res.elapsedMs < 10000, `${res.elapsedMs}ms`);
	// req: R-826
	check("C: the deleted cwd shares the isolated temp root with 50,000 direct sibling directories", res.siblingCount === 50000, String(res.siblingCount));
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
