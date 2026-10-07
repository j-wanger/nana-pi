/**
 * @module packages/nana-pack/tests/gate-self-protection.test.mjs
 * @purpose Pins the FLOOR — nana's policy files, pi's trust store and the Claude policy files are gated in every path and command form, and no allow pattern exempts them
 * @inputs extensions/nana-gate.ts, lib/gate-paths.ts, and a temp HOME with symlinked policy files and an alternate agent dir
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOME, symlinks, policy fixtures), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// L2 invariant (a) (2026-09-28): tool calls that touch nana's own policy (nana-pack.json, both
// scopes), pi's trust store (default agent dir and PI_CODING_AGENT_DIR), or the Claude policy
// files (.claude/settings.json, settings.local.json, hooks/**) are gated — edit/write on the
// RESOLVED path in every form, and bash/PowerShell commands that name one (redirection, tee,
// sed -i, cp, Set-Content, Out-File). They are the FLOOR: no allow pattern exempts them.
// L3's user-scope handoff store and ordinary files stay ALLOW. L1's path forms are pinned in
// gate-policy-paths.test.mjs; this file adds the Claude files, symlinks, the alt agent dir,
// the command forms and the floor.
// Run: node --experimental-strip-types <this file>
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const HOME = tmpDir(path.join(os.tmpdir(), "gate-self-home-"));
process.env.HOME = HOME;
process.env.USERPROFILE = HOME;
const ALT = path.join(HOME, "alt-agent");
process.env.PI_CODING_AGENT_DIR = ALT;
// U2: the user config lives in pi's ACTIVE agent dir (PI_CODING_AGENT_DIR), not ~/.pi/agent.
const USER_CFG = path.join(ALT, "nana-pack.json");
fs.mkdirSync(path.join(HOME, ".pi", "agent"), { recursive: true });
fs.mkdirSync(path.join(HOME, ".claude", "hooks"), { recursive: true });
fs.mkdirSync(ALT, { recursive: true });
// symlinked alias of ~/.claude (win32 without symlink privilege: those rows are skipped, said so)
let canLink = true;
try { fs.symlinkSync(path.join(HOME, ".claude"), path.join(HOME, "cl-alias"), "dir"); } catch { canLink = false; console.log("SKIP symlink rows: cannot create a symlink here"); }
const linked = (rows) => rows.filter((r) => canLink || !String(r).includes("cl-alias"));
const CWD = tmpDir(path.join(os.tmpdir(), "gate-self-cwd-"));
const ext = (await import(new URL("../extensions/nana-gate.ts", import.meta.url).href)).default;

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };

async function gate(gateCfg = {}) {
	fs.writeFileSync(USER_CFG, JSON.stringify({ journal: { enabled: false }, gate: gateCfg }));
	const h = {};
	ext({ on: (name, fn) => { h[name] = fn; } });
	const ctx = { cwd: CWD, hasUI: false, isProjectTrusted: () => false };
	await h.session_start({ type: "session_start", reason: "startup" }, ctx);
	return async (toolName, input) => ((await h.tool_call({ toolName, input }, ctx))?.block ? "BLOCK" : "ALLOW");
}

const PATHS_BLOCK = [
	// Claude policy files, user scope, every form pi resolves
	"~/.claude/settings.json", `${HOME}/.claude/settings.json`, "~/.claude/settings.local.json", "~/.claude/hooks/x.sh",
	`${HOME}/.claude/hooks/sub/y.py`, "@~/.claude/settings.json", `@${HOME}/.claude/hooks/x.sh`, "~/.CLAUDE/Settings.JSON",
	`${HOME}\\.claude\\settings.json`, "C:\\Users\\x\\.claude\\settings.local.json", "~/.claude/x/../settings.json",
	`file://${HOME}/.claude/settings.json`, `${HOME}/cl-alias/settings.json`, `${HOME}/cl-alias/hooks/z.sh`,
	// project-scope Claude files (hooks there run code in the next Claude session too)
	".claude/settings.json", `${CWD}/.claude/settings.local.json`, ".claude/hooks/pre.sh",
	// nana-pack.json both scopes + trust.json (L1 forms, re-pinned here under the floor)
	"~/.pi/agent/nana-pack.json", ".pi/nana-pack.json", "@.pi/nana-pack.json", ".PI\\NANA-PACK.JSON", `${CWD}/.pi/x/../nana-pack.json`,
	"~/.pi/agent/trust.json", `${HOME}\\.pi\\agent\\trust.json`,
	// pi's trust store under PI_CODING_AGENT_DIR
	`${ALT}/trust.json`, `${ALT}/./trust.json`,
];
const PATHS_ALLOW = [
	"src/nana-pack-notes.md", "~/.pi/agent/handoffs/abc123.md", `${HOME}/.pi/agent/handoffs/proj/handoff.md`,
	".claude/commands/review.md", "docs/claude-settings.md", `${ALT}/sessions/x.jsonl`, "~/.claude/projects/x/memory/MEMORY.md",
];
const CMDS_BLOCK = [
	"echo {} > ~/.pi/agent/nana-pack.json", "echo '{}' >> ~/.pi/agent/trust.json", "sed -i s/a/b/ .pi/nana-pack.json",
	"sed -i '' 's/a/b/' ~/.pi/agent/nana-pack.json", "tee ~/.claude/settings.json < x", "cat x | tee -a \"$HOME/.claude/settings.local.json\"",
	"cp evil.sh ~/.claude/hooks/pre.sh", "printf x > ${HOME}/.claude/hooks/a.sh", `echo x > ${HOME}/cl-alias/settings.json`,
	`echo {} > ${ALT}/trust.json`, "echo {} > .claude/settings.json",
	// PowerShell
	"Set-Content -Path $env:USERPROFILE\\.claude\\settings.json -Value x", "'{}' | Out-File ~\\.pi\\agent\\nana-pack.json",
	"Add-Content .PI\\NANA-PACK.JSON x", "Set-Content ~/.pi/agent/trust.json '{}'",
];
const CMDS_ALLOW = ["echo x > ~/.pi/agent/handoffs/a.md", "cat src/nana-pack-notes.md", "ls ~/.claude/projects"];

{
	const call = await gate();
	// req: R-051 R-054
	for (const p of linked(PATHS_BLOCK)) for (const t of ["edit", "write"]) check(`${t} ${p} BLOCK`, (await call(t, { path: p })) === "BLOCK");
	for (const p of PATHS_ALLOW) for (const t of ["edit", "write"]) check(`${t} ${p} ALLOW`, (await call(t, { path: p })) === "ALLOW");
	// req: R-052 R-054
	for (const c of linked(CMDS_BLOCK)) check(`bash ${JSON.stringify(c)} BLOCK`, (await call("bash", { command: c })) === "BLOCK");
	// req: R-052
	for (const c of CMDS_BLOCK.slice(-4)) check(`powershell ${JSON.stringify(c)} BLOCK`, (await call("powershell", { command: c })) === "BLOCK");
	for (const c of CMDS_ALLOW) check(`bash ${JSON.stringify(c)} ALLOW`, (await call("bash", { command: c })) === "ALLOW");
	// Composed regression (astra residual): a tool write to the trust store is the first step of
	// "plant trust → project config honored next process"; both write channels are refused.
	check("composed: write tool to trust.json refused", (await call("write", { path: "~/.pi/agent/trust.json" })) === "BLOCK");
	// req: R-052
	check("composed: bash redirection to trust.json refused", (await call("bash", { command: "echo '{}' > ~/.pi/agent/trust.json" })) === "BLOCK");
}

// The floor: allow patterns naming the policy files exempt nothing.
{
	const call = await gate({ allowPatterns: ["claude", "nana-pack", "trust", "^echo", "^sed", "^Set-Content", "\\.json$", "\\.env$"] });
	for (const p of ["~/.claude/settings.json", "~/.claude/hooks/x.sh", ".pi/nana-pack.json", "~/.pi/agent/trust.json", `${ALT}/trust.json`])
		// req: R-044
		check(`floor: write ${p} BLOCK under matching allow patterns`, (await call("write", { path: p })) === "BLOCK");
	for (const c of ["echo {} > ~/.pi/agent/nana-pack.json", "sed -i s/a/b/ .pi/nana-pack.json", "Set-Content ~/.claude/settings.json x"])
		// req: R-044
		check(`floor: ${JSON.stringify(c)} BLOCK under matching allow patterns`, (await call("bash", { command: c })) === "BLOCK");
	// a NON-policy protected path is still exemptible by an allow pattern (pre-L2 behavior kept)
	// req: R-055
	check("non-policy protected path (.env) stays exemptible", (await call("write", { path: ".env" })) === "ALLOW");
}
// T2c r4: the gate and the provenance label share ONE resolution of pi's active agent dir (piAgentDir),
// with pi's `~/` expansion — a tilde override protects the same store the label reads.
{
	const { piTrustStorePath, policyFileHit, pathCandidates } = await import(new URL("../lib/gate-paths.ts", import.meta.url).href);
	process.env.PI_CODING_AGENT_DIR = "~/tilde-agent";
	try {
		const active = path.join(HOME, "tilde-agent", "trust.json");
		// req: R-033
		check("tilde override: piTrustStorePath() expands ~ like pi", piTrustStorePath() === active, piTrustStorePath());
		// req: R-033
		check("tilde override: the gate protects the store the label reads", !!policyFileHit(pathCandidates(active, CWD)));
	} finally {
		process.env.PI_CODING_AGENT_DIR = ALT;
	}
}

fs.rmSync(HOME, { recursive: true, force: true });
fs.rmSync(CWD, { recursive: true, force: true });
console.log(fails ? `FAILED ${fails}` : "all PASS");
process.exit(fails ? 1 : 0);
