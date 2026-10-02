/**
 * @module packages/nana-pack/tests/gate-survives-mutation.test.mjs
 * @purpose Pins that the gate survives its own config being rewritten mid-session by a write it never saw — loosening never applies without a reload, tightening applies at once, and a malformed block never falls back to defaults
 * @inputs extensions/nana-gate.ts, user and project nana-pack.json rewritten underneath it with fs, and a nana-trusted temp project under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, config files, temp project), process (sets HOME, spawns fresh node processes for the restart cases)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// L2 acceptance (astra F, 2026-09-28): the gate survives its own config being rewritten
// mid-session by a write it did not see (standing in for `python -c`, a custom tool, anything).
// Register the gate, fire session_start, then write the config files directly with fs:
//   (1) user allowPatterns [".*"] → rm -rf ~ still BLOCKs, a write to nana-pack.json still BLOCKs
//   (2) same for [""] and for PROJECT scope (a nana-trusted project)
//   (3) tightening is live: a new extraPattern blocks at once
//   (4) malformed mid-session → the last-good extraPatterns stay enforced (L1's in-memory
//       last-good; nothing persisted) — and a live tightening never un-tightens mid-session
//   (4b) a FRESH process with a malformed user gate block → every gated class blocked with
//       the repair reason; no fallback to defaults or to any file the agent could plant
//   (5) session_start reason:"reload" adopts the loosened config and journals gate_policy_widened
//   (6) an empty-matching allow pattern is rejected at load with a warning
//   (7) the status tally stays correct throughout
//   (+) STOP → repair → resume inside ONE process (astra residual)
// Run: node --experimental-strip-types <this file>
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const HOME = fs.mkdtempSync(path.join(os.tmpdir(), "gate-mut-home-"));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
const AGENT = path.join(HOME, ".pi", "agent");
fs.mkdirSync(AGENT, { recursive: true });
const USER_CFG = path.join(AGENT, "nana-pack.json");
const JOURNAL = path.join(AGENT, "nana-journal.jsonl");
const PROJ = fs.mkdtempSync(path.join(os.tmpdir(), "gate-mut-proj-"));
fs.mkdirSync(path.join(PROJ, ".pi"));
const PROJ_CFG = path.join(PROJ, ".pi", "nana-pack.json");

const GATE_URL = new URL("../extensions/nana-gate.ts", import.meta.url).href;
const config = await import(new URL("../lib/config.ts", import.meta.url).href);
// Trust evidence stub: this project's trust was decided (pi asked). Installed before pi's own
// module can resolve, so the project file is honored exactly as under a real /trust.
config.usePiTrustModule({ hasTrustRequiringProjectResources: () => true, ProjectTrustStore: class { get() { return true; } } });
const ext = (await import(GATE_URL)).default;

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };
const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o));
const journal = () => { try { return fs.readFileSync(JOURNAL, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };

function register(cwd) {
	const h = {};
	ext({ on: (name, fn) => { h[name] = fn; } });
	const statuses = [];
	const notes = [];
	const ctx = {
		cwd, hasUI: true, isProjectTrusted: () => true,
		sessionManager: { getSessionId: () => "mut-session" },
		ui: {
			select: async () => "Block", // the default answer: identical to a headless block
			setStatus: (_k, t) => statuses.push(t), notify: (m) => notes.push(m), theme: { fg: (_c, t) => t },
		},
	};
	let checked = 0, gated = 0;
	const call = async (toolName, input) => {
		const r = await h.tool_call({ toolName, input }, ctx);
		checked++;
		if (r?.block) gated++;
		return r?.block ? "BLOCK" : "ALLOW";
	};
	const bash = (command) => call("bash", { command });
	const start = (reason) => h.session_start({ type: "session_start", reason }, ctx);
	const tally = () => statuses.at(-1) === `gate ✓ ${checked} checked · ${gated} gated`;
	return { bash, call, start, tally, notes, statuses };
}

const BASE = { gate: { extraPatterns: [], allowPatterns: ["^rm -rf node_modules$"], protectedPaths: [] } };
writeJson(USER_CFG, BASE);
const g = register(PROJ);
await g.start("startup");
check("baseline: rm -rf build gated", (await g.bash("rm -rf build")) === "BLOCK");
check("baseline: rm -rf node_modules exempt", (await g.bash("rm -rf node_modules")) === "ALLOW");

// (1) user allow-everything written behind the gate's back
writeJson(USER_CFG, { gate: { ...BASE.gate, allowPatterns: ["^rm -rf node_modules$", ".*"] } });
// req: R-059
check("1: user .* → rm -rf ~ BLOCK", (await g.bash("rm -rf ~")) === "BLOCK");
check("1: user .* → rm -rf build BLOCK (not in the session baseline)", (await g.bash("rm -rf build")) === "BLOCK");
check("1: user .* → write nana-pack.json BLOCK", (await g.call("write", { path: USER_CFG })) === "BLOCK");
check("1: user .* → write .pi/nana-pack.json BLOCK", (await g.call("write", { path: ".pi/nana-pack.json" })) === "BLOCK");
check("1: tally correct", g.tally(), g.statuses.at(-1));

// (2) the empty string, and project scope
writeJson(USER_CFG, { gate: { ...BASE.gate, allowPatterns: ["^rm -rf node_modules$", ""] } });
check("2: user \"\" → rm -rf ~ BLOCK", (await g.bash("rm -rf ~")) === "BLOCK");
check("2: user \"\" → rm -rf build BLOCK", (await g.bash("rm -rf build")) === "BLOCK");
// a live REMOVAL of an allow pattern tightens at once
writeJson(USER_CFG, { gate: { ...BASE.gate, allowPatterns: [] } });
// req: R-059
check("2: removing an allow pattern applies live", (await g.bash("rm -rf node_modules")) === "BLOCK");
writeJson(USER_CFG, BASE);
// req: R-061
check("2: restoring it mid-session does NOT re-open it", (await g.bash("rm -rf node_modules")) === "BLOCK");
writeJson(PROJ_CFG, { gate: { allowPatterns: [".*", "^rm"], extraPatterns: ["\\bterraform\\s+plan\\b"] } });
check("2: project .*/^rm → rm -rf ~ BLOCK", (await g.bash("rm -rf ~")) === "BLOCK");
// req: R-060
check("2: project ^rm → rm -rf build BLOCK (loosening waits for session_start)", (await g.bash("rm -rf build")) === "BLOCK");
check("2: project .* → write nana-pack.json BLOCK", (await g.call("edit", { path: PROJ_CFG })) === "BLOCK");
check("2: the project file IS honored (its extraPattern gates live)", (await g.bash("terraform plan")) === "BLOCK");
fs.rmSync(PROJ_CFG);
check("2: tally correct", g.tally(), g.statuses.at(-1));

// (3) tightening is live
writeJson(USER_CFG, { gate: { ...BASE.gate, extraPatterns: ["\\bterraform\\s+destroy\\b"] } });
// req: R-059
check("3: new extraPattern → terraform destroy BLOCK", (await g.bash("terraform destroy -auto-approve")) === "BLOCK");

// (4) malformed mid-session: last-good extraPatterns enforced; and removal does not un-tighten
fs.writeFileSync(USER_CFG, '{ "gate": { "extraPatterns": ["\\\\bterraform\\\\s+destroy\\\\b"], }, }');
check("4: malformed mid-session → terraform destroy still BLOCK", (await g.bash("terraform destroy")) === "BLOCK");
check("4: malformed mid-session → no stop (benign ls allowed)", (await g.bash("ls")) === "ALLOW");
writeJson(USER_CFG, BASE); // valid again, WITHOUT the extra pattern
// req: R-061
check("4: dropping the live-added pattern mid-session does not loosen", (await g.bash("terraform destroy")) === "BLOCK");
// req: R-066
check("4: no persisted snapshot next to the config", fs.readdirSync(AGENT).filter((f) => !["nana-pack.json", "nana-journal.jsonl"].includes(f)).length === 0, fs.readdirSync(AGENT).join(","));
check("4: tally correct", g.tally(), g.statuses.at(-1));

// (6) empty-matching allow pattern: rejected at load, with a warning (and a journal line)
writeJson(USER_CFG, { gate: { ...BASE.gate, allowPatterns: ["^rm -rf node_modules$", "^rm -rf build$", "^", ".*"] } });
await g.bash("ls");
// req: R-043
check("6: warning names the empty-matching pattern", g.notes.some((m) => m.includes('"^"') && m.includes("empty string")), JSON.stringify(g.notes));
// req: R-043
check("6: journal config_invalid for it", journal().some((e) => e.event === "config_invalid" && String(e.problem).includes('".*"')));

// (5) reload adopts the loosened config and journals it
await g.start("reload");
check("5: after reload the new exception applies", (await g.bash("rm -rf build")) === "ALLOW");
check("5: after reload terraform no longer gated (the owner dropped it)", (await g.bash("terraform destroy")) === "ALLOW");
// req: R-043
check("5: after reload .* / ^ still exempt nothing", (await g.bash("rm -rf dist")) === "BLOCK");
check("5: after reload the floor holds", (await g.bash("rm -rf ~")) === "BLOCK");
const widened = journal().filter((e) => e.event === "gate_policy_widened");
// req: R-060
check("5: gate_policy_widened journaled with reason reload", widened.some((e) => e.reason === "reload" && e.allowAdded?.includes("^rm -rf build$") && e.extraRemoved?.includes("\\bterraform\\s+destroy\\b")), JSON.stringify(widened));
// req: R-062
check("5: the rejected patterns are not in the widened line", !widened.some((e) => e.allowAdded?.includes(".*") || e.allowAdded?.includes("^")));
check("7: tally correct", g.tally(), g.statuses.at(-1));

// (+) STOP → repair → resume inside ONE process. A fresh HOME means no last-good for that file.
{
	const HOME2 = fs.mkdtempSync(path.join(os.tmpdir(), "gate-mut-home2-"));
	process.env.HOME = HOME2;
	process.env.USERPROFILE = HOME2;
	const cfg2 = path.join(HOME2, ".pi", "agent", "nana-pack.json");
	fs.mkdirSync(path.dirname(cfg2), { recursive: true });
	fs.writeFileSync(cfg2, '{ "gate": { "allowPatterns": ["^rm -rf build$"], }, }');
	const cwd2 = fs.mkdtempSync(path.join(os.tmpdir(), "gate-mut-cwd2-"));
	const s = register(cwd2);
	await s.start("startup");
	check("+: malformed at start → ls blocked (stop)", (await s.bash("ls")) === "BLOCK");
	writeJson(cfg2, { gate: { allowPatterns: ["^rm -rf build$"] } });
	// req: R-065
	check("+: repaired → benign ls allowed again without restart", (await s.bash("ls")) === "ALLOW");
	// req: R-060
	check("+: repaired file's exception waits for session_start", (await s.bash("rm -rf build")) === "BLOCK");
	await s.start("reload");
	// req: R-065
	check("+: after reload the repaired exception applies", (await s.bash("rm -rf build")) === "ALLOW");
	check("+: tally correct", s.tally(), s.statuses.at(-1));
	process.env.HOME = HOME;
	process.env.USERPROFILE = HOME;
	fs.rmSync(HOME2, { recursive: true, force: true });
	fs.rmSync(cwd2, { recursive: true, force: true });
}

// (4b) a FRESH process with a malformed user gate block: conservative stop, not defaults
{
	const HOME3 = fs.mkdtempSync(path.join(os.tmpdir(), "gate-mut-home3-"));
	const a3 = path.join(HOME3, ".pi", "agent");
	fs.mkdirSync(a3, { recursive: true });
	fs.writeFileSync(path.join(a3, "nana-pack.json"), '{ "gate": { "allowPatterns": [".*"], }, }');
	// files an agent could have planted: none of them may be consulted
	fs.writeFileSync(path.join(a3, "nana-pack.last-good.json"), JSON.stringify({ gate: { allowPatterns: ["^ls"] } }));
	fs.writeFileSync(path.join(a3, "nana-gate-snapshot.json"), JSON.stringify({ gate: { allowPatterns: ["^ls"] } }));
	const script = path.join(HOME3, "child.mjs");
	fs.writeFileSync(script, `
const ext = (await import(${JSON.stringify(GATE_URL)})).default;
const h = {}; ext({ on: (n, f) => { h[n] = f; } });
const ctx = { cwd: ${JSON.stringify(PROJ)}, hasUI: false, isProjectTrusted: () => false };
await h.session_start({ type: "session_start", reason: "startup" }, ctx);
const out = [];
for (const [t, input] of [["bash", { command: "ls" }], ["powershell", { command: "Get-ChildItem" }], ["edit", { path: "src/a.ts" }], ["write", { path: "src/b.ts" }], ["bash", { command: "rm -rf ~" }]]) {
	const r = await h.tool_call({ toolName: t, input }, ctx);
	out.push({ t, block: !!r?.block, reason: r?.reason ?? "" });
}
console.log(JSON.stringify(out));`);
	const env = { ...process.env, HOME: HOME3, USERPROFILE: HOME3 };
	let rows = [];
	try {
		rows = JSON.parse(execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", script], { env, encoding: "utf-8" }).trim().split("\n").at(-1));
	} catch (e) {
		check("4b: child ran", false, String(e).slice(0, 300));
	}
	check("4b: every gated class blocked in a fresh process", rows.length === 5 && rows.every((r) => r.block), JSON.stringify(rows));
	check("4b: with the repair reason", rows.length === 5 && rows.every((r) => /gate block is malformed — repair it/.test(r.reason)), JSON.stringify(rows.map((r) => r.reason)));
	fs.rmSync(HOME3, { recursive: true, force: true });
}

fs.rmSync(HOME, { recursive: true, force: true });
fs.rmSync(PROJ, { recursive: true, force: true });
console.log(fails ? `FAILED ${fails}` : "all PASS");
process.exit(fails ? 1 : 0);
