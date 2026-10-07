/**
 * @module packages/nana-pack/tests/agent-dir-config.test.mjs
 * @purpose Pins that nana-pack's user-scope resources follow pi's active agent dir for an absolute, a relative and a tilde PI_CODING_AGENT_DIR, each naming a symlinked dir
 * @inputs extensions/nana-gate.ts, lib/config.ts, lib/gate-paths.ts, nana-pack.json at both agent dirs under a temp HOME
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME and symlinked agent dirs), process (sets HOME and PI_CODING_AGENT_DIR, changes the process cwd)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// U2 (2026-09-28): nana-pack's user-scope resources follow pi's ACTIVE agent dir
// (PI_CODING_AGENT_DIR, resolved by gate-paths' piAgentDir()), for an absolute, a relative and a
// tilde value, each naming a SYMLINKED agent dir:
//  (a) the gate enforces extraPatterns / protectedPaths written in the ACTIVE dir's nana-pack.json;
//  (b) policyFileHit() / commandPolicyHit() — and the gate — refuse an edit and a shell write to
//      that file, via the env path and via its realpath;
//  (c) with only ~/.pi/agent/nana-pack.json present, config_agent_dir_mismatch fires exactly once
//      per session (journal + UI), the default file is NOT read, and the gate runs on defaults;
//  (d) the review round-cap ledger stays in ~/.pi/agent.
// Run: node --experimental-strip-types packages/nana-pack/tests/agent-dir-config.test.mjs
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const HOME = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "nana-u2-")));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
delete process.env.PI_CODING_AGENT_DIR;
const startCwd = process.cwd();
process.chdir(HOME); // the relative case resolves against the process cwd, as pi does

const DEFAULT_DIR = path.join(HOME, ".pi", "agent");
fs.mkdirSync(DEFAULT_DIR, { recursive: true });
// A stale config in the DEFAULT dir: its deny must never apply while another dir is active.
fs.writeFileSync(path.join(DEFAULT_DIR, "nana-pack.json"), JSON.stringify({ gate: { extraPatterns: ["\\bzorble\\b"] } }));

const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;
const { policyFileHit, commandPolicyHit, pathCandidates, piAgentDir } = await import(new URL("../lib/gate-paths.ts", import.meta.url).href);
const { journalFile, loadConfig } = await import(new URL("../lib/config.ts", import.meta.url).href);
const { receiptsDir } = await import(new URL("../lib/receipts.ts", import.meta.url).href);
const { ledgerPaths } = await import(new URL("../bin/review-round.mjs", import.meta.url).href);
let handler;
ext({ on: (ev, fn) => { if (ev === "tool_call") handler = fn; } });

let fails = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, extra); if (!ok) fails++; };

let canLink = true;
try {
	fs.symlinkSync(os.tmpdir(), path.join(HOME, "probe-link"), "dir");
} catch {
	canLink = false;
	console.log("SKIP-NOTE: no symlink privilege — agent dirs are plain dirs, realpath rows reduce to the plain path");
}

const FORMS = [
	{ name: "absolute", env: path.join(HOME, "abs-agent"), link: path.join(HOME, "abs-agent") },
	{ name: "relative", env: "rel-agent", link: path.join(HOME, "rel-agent") },
	{ name: "tilde", env: "~/tilde-agent", link: path.join(HOME, "tilde-agent") },
];

for (const f of FORMS) {
	const real = path.join(HOME, `real-${f.name}`);
	fs.mkdirSync(real, { recursive: true });
	if (canLink) fs.symlinkSync(real, f.link, "dir");
	else fs.mkdirSync(f.link, { recursive: true });
	process.env.PI_CODING_AGENT_DIR = f.env;
	const cwd = path.join(HOME, `proj-${f.name}`);
	fs.mkdirSync(cwd, { recursive: true });
	const notes = [];
	const ctx = (sid) => ({ cwd, hasUI: true, ui: { notify: (m) => notes.push(m), select: async () => "Block", setStatus() {} }, isProjectTrusted: () => false, sessionManager: { getSessionId: () => sid } });
	const decide = async (c, toolName, input) => ((await handler({ toolName, input }, c))?.block ? "BLOCK" : "ALLOW");
	const T = `[${f.name}]`;

	check(`${T} piAgentDir() is the active dir`, piAgentDir() === f.link, piAgentDir());

	// ---- (c) only the DEFAULT dir holds a config
	const s1 = ctx(`${f.name}-s1`);
	// req: R-829
	check(`${T} (c) stale default deny is NOT read`, (await decide(s1, "bash", { command: "zorble now" })) === "ALLOW");
	// req: R-829
	check(`${T} (c) gate still runs on defaults (built-in deny)`, (await decide(s1, "bash", { command: "rm -rf /" })) === "BLOCK");
	check(`${T} (c) no stop`, loadConfig(s1).gate.stopReason === null);
	await decide(s1, "edit", { path: "src/x.ts" });
	const mine = notes.filter((m) => m.includes("agent dir") || m.includes("PI_CODING_AGENT_DIR"));
	// req: R-194
	check(`${T} (c) mismatch UI note fires exactly once in the session`, mine.length === 1, `${mine.length}`);
	// req: R-194
	check(`${T} (c) the note names both paths`, mine.length === 1 && mine[0].includes(path.join(f.link, "nana-pack.json")) && mine[0].includes(path.join(DEFAULT_DIR, "nana-pack.json")), mine[0]);
	const jf = journalFile(loadConfig(s1));
	// req: R-159 R-191
	check(`${T} journal default is in the active dir`, jf === path.join(f.link, "nana-journal.jsonl"), jf);
	const jl = (fs.existsSync(jf) ? fs.readFileSync(jf, "utf-8") : "").split("\n").filter((l) => l.includes('"config_agent_dir_mismatch"'));
	// req: R-194
	check(`${T} (c) exactly one config_agent_dir_mismatch journal line`, jl.length === 1, `${jl.length}`);
	// req: R-101 R-191
	check(`${T} receipts default is in the active dir`, receiptsDir(loadConfig(s1)) === path.join(f.link, "receipts"));

	// ---- (a) the ACTIVE dir's config is enforced (and the mismatch note stops)
	fs.writeFileSync(path.join(real, "nana-pack.json"), JSON.stringify({ gate: { extraPatterns: ["\\bfrobnicate\\b"], protectedPaths: ["secret-vault"] } }));
	const s2 = ctx(`${f.name}-s2`);
	const before = notes.length;
	check(`${T} (a) active extraPatterns enforced`, (await decide(s2, "bash", { command: "frobnicate --all" })) === "BLOCK");
	check(`${T} (a) active protectedPaths enforced (edit)`, (await decide(s2, "edit", { path: "vault/secret-vault.txt" })) === "BLOCK");
	check(`${T} (a) active protectedPaths enforced (bash)`, (await decide(s2, "bash", { command: "cat vault/secret-vault.txt" })) === "BLOCK");
	check(`${T} (a) control: ordinary command allowed`, (await decide(s2, "bash", { command: "echo hi" })) === "ALLOW");
	check(`${T} (a) no mismatch note once the active dir has a config`, notes.length === before, notes.slice(before).join(" | "));

	// ---- (b) the active config is on the policy floor — env path and realpath
	const viaEnv = path.join(f.link, "nana-pack.json");
	const viaReal = path.join(real, "nana-pack.json");
	for (const p of [viaEnv, viaReal]) {
		check(`${T} (b) policyFileHit ${p}`, !!policyFileHit(pathCandidates(p, cwd)));
		check(`${T} (b) commandPolicyHit printf > ${p}`, !!commandPolicyHit(`printf '{}' > ${p}`, cwd));
		for (const t of ["edit", "write"]) check(`${T} (b) gate refuses ${t} ${p}`, (await decide(s2, t, { path: p })) === "BLOCK");
		check(`${T} (b) gate refuses shell write to ${p}`, (await decide(s2, "bash", { command: `echo '{}' | tee ${p}` })) === "BLOCK");
	}
	if (f.name === "relative") check(`${T} (b) relative tool path from HOME`, !!policyFileHit(pathCandidates(`${f.env}/nana-pack.json`, HOME)));
	for (const v of ["$PI_CODING_AGENT_DIR/nana-pack.json", "${PI_CODING_AGENT_DIR}/nana-pack.json", "%PI_CODING_AGENT_DIR%\\nana-pack.json", "$env:PI_CODING_AGENT_DIR\\trust.json"])
		check(`${T} (b) command via the variable: ${v}`, (await decide(s2, "bash", { command: `printf x > "${v}"` })) === "BLOCK");
	check(`${T} (b) default-dir config still protected`, (await decide(s2, "edit", { path: "~/.pi/agent/nana-pack.json" })) === "BLOCK");
	check(`${T} (b) ordinary file in the agent dir allowed`, (await decide(s2, "write", { path: path.join(f.link, "notes.md") })) === "ALLOW");

	// ---- (d) the round-cap ledger never moves
	// req: R-192
	check(`${T} (d) ledger dir is ~/.pi/agent`, ledgerPaths().dir === DEFAULT_DIR, ledgerPaths().dir);
}

// Missing dir / a FILE as the agent dir: total, no throw, no stop, defaults + the note.
for (const [name, env] of [["missing dir", path.join(HOME, "nope")], ["a file", path.join(DEFAULT_DIR, "nana-pack.json")]]) {
	process.env.PI_CODING_AGENT_DIR = env;
	let cfg;
	try { cfg = loadConfig({ cwd: HOME, hasUI: false }); } catch { cfg = null; }
	check(`${name}: loadConfig total, no stop`, !!cfg && cfg.gate.stopReason === null);
	// req: R-829
	check(`${name}: default config not read`, !!cfg && cfg.gate.extraPatterns.length === 0);
}

// Env unset: unchanged behaviour — the default dir IS the active dir, no note.
delete process.env.PI_CODING_AGENT_DIR;
{
	const n = [];
	const cfg = loadConfig({ cwd: HOME, hasUI: true, ui: { notify: (m) => n.push(m) }, sessionManager: { getSessionId: () => "unset" } });
	check("unset: default config is the user config", cfg.gate.extraPatterns.includes("\\bzorble\\b"));
	check("unset: no mismatch note", n.length === 0, n.join(" | "));
	// req: R-192
	check("unset: (d) ledger dir is ~/.pi/agent", ledgerPaths().dir === DEFAULT_DIR);
}

process.chdir(startCwd);
fs.rmSync(HOME, { recursive: true, force: true });
console.log(fails ? `FAILED ${fails}` : "all PASS");
process.exit(fails ? 1 : 0);
