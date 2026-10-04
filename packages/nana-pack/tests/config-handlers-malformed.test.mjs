/**
 * @module packages/nana-pack/tests/config-handlers-malformed.test.mjs
 * @purpose Pins that every registered nana-pack handler survives every malformed user config without throwing, while the gate still blocks and the problem is journaled once
 * @inputs the seven extensions under extensions/, malformed nana-pack.json variants, and a fresh temp HOME and workspace per variant
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOMEs, config files and workspaces), process (sets HOME and USERPROFILE)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// L1 invariant 1 end-to-end: every registered nana-pack handler, driven under each
// malformed USER config, must not throw (a throw in tool_call BLOCKS the tool; in
// other handlers it breaks the agent). The gate still blocks `rm -rf /tmp/x`
// headless; the objective yields its text or the OBJECTIVE UNAVAILABLE marker; the
// problem is journaled as exactly one `config_invalid` line naming the file, and
// shown as one UI warning per session when a UI exists.
// Each variant: fresh temp HOME + USERPROFILE, fresh workspace, fresh registrations.
// Run: node --experimental-strip-types <this file>
const EXT = ["nana-gate", "nana-post-edit", "nana-objective", "nana-handoff", "nana-notify", "nana-lifecycle", "nana-writing"];
const exts = {};
for (const n of EXT) exts[n] = (await import(new URL(`../extensions/${n}.ts`, import.meta.url).href)).default;

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };

// [label, file text, expected config_invalid lines for the user file]
const VARIANTS = [
	...[null, 7, "x", [], true].map((v) => [`whole file = ${JSON.stringify(v)}`, JSON.stringify(v), 1]),
	["trailing-comma file (Opus)", '{ "notify": { "headless": false }, }', 1],
	["binary garbage", "\u0000ÿ{{", 1],
	...["gate", "postEdit", "notify", "journal", "handoff", "objective", "receipts"].map((b) => [`${b} = 7`, JSON.stringify({ [b]: 7 }), 1]),
	["sol postEdit.commands = null", JSON.stringify({ postEdit: { commands: null } }), 1],
	["sol objective.path = 7", JSON.stringify({ objective: { path: 7 } }), 1],
	["handoff.path = []", JSON.stringify({ handoff: { path: [] } }), 1],
	["journal.path = 7", JSON.stringify({ journal: { path: 7 } }), 1],
	["receipts.dir = 42", JSON.stringify({ receipts: { dir: 42 } }), 1],
	["notify.enabled = \"x\"", JSON.stringify({ notify: { enabled: "x" } }), 1],
	["gate.allowPatterns = null", JSON.stringify({ gate: { allowPatterns: null } }), 1],
	["gate.allowPatterns = [\".*\", 7]", JSON.stringify({ gate: { allowPatterns: [".*", 7] } }), 1],
	["{} (valid)", "{}", 0],
	["{unexpected:1} (valid)", JSON.stringify({ unexpected: 1 }), 0],
];

for (const [label, text, expectLines] of VARIANTS) {
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "hm-home-"));
	process.env.HOME = home;
	process.env.USERPROFILE = home;
	const agent = path.join(home, ".pi", "agent");
	fs.mkdirSync(agent, { recursive: true });
	const userCfg = path.join(agent, "nana-pack.json");
	fs.writeFileSync(userCfg, text);
	fs.writeFileSync(path.join(agent, "nana-objective.md"), "OBJ: ship the thing\n");
	const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "hm-ws-"));
	fs.writeFileSync(path.join(cwd, "a.ts"), "x\n");

	const h = {};
	const api = { on: (ev, fn) => (h[ev] ??= []).push(fn), registerCommand() {} };
	for (const n of EXT) exts[n](api);
	const ctx = { cwd, hasUI: false, isProjectTrusted: () => true, signal: new AbortController().signal };
	const errors = [];
	const fire = async (ev, event) => {
		const out = [];
		for (const fn of h[ev] ?? []) {
			try { out.push(await fn(event, ctx)); } catch (e) { errors.push(`${ev}: ${e?.message ?? e}`); }
		}
		return out;
	};

	await fire("session_start", { reason: "startup" }); // lifecycle, objective, handoff
	const gateOut = await fire("tool_call", { toolName: "bash", input: { command: "rm -rf /tmp/x" } });
	await fire("tool_result", { toolName: "edit", isError: false, input: { path: "a.ts" }, content: [{ type: "text", text: "edited" }] });
	const bas = await fire("before_agent_start", { systemPrompt: "BASE" });
	await fire("agent_settled", {});
	await fire("session_before_compact", {});
	await fire("session_compact", { compactionEntry: { summary: "state" }, reason: "manual" });
	await fire("session_compact_failed", {});
	await fire("session_shutdown", { reason: "quit" });

	// req: R-083
	check(`${label}: no handler throws`, errors.length === 0, errors.join("; "));
	check(`${label}: gate still blocks rm -rf /tmp/x headless`, gateOut.some((r) => r?.block === true), JSON.stringify(gateOut));
	// chain the before_agent_start results the way pi does (last systemPrompt wins in this fake)
	const prompts = bas.filter(Boolean).map((r) => r.systemPrompt).join("\n");
	check(`${label}: objective text or OBJECTIVE UNAVAILABLE marker injected`, prompts.includes("OBJ: ship the thing") || prompts.includes("OBJECTIVE UNAVAILABLE"));
	const journal = path.join(agent, "nana-journal.jsonl");
	const lines = fs.existsSync(journal) ? fs.readFileSync(journal, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
	const invalid = lines.filter((l) => l.event === "config_invalid" && l.file === userCfg);
	// req: R-082
	check(`${label}: exactly ${expectLines} config_invalid journal line(s) naming the file`, invalid.length === expectLines, JSON.stringify(invalid));
}

// One UI warning per (file, problem) per session, however many handlers load config.
{
	const home = fs.mkdtempSync(path.join(os.tmpdir(), "hm-ui-"));
	process.env.HOME = home;
	process.env.USERPROFILE = home;
	fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const userCfg = path.join(home, ".pi", "agent", "nana-pack.json");
	fs.writeFileSync(userCfg, JSON.stringify({ postEdit: { commands: null } }));
	const h = {};
	for (const n of EXT) exts[n]({ on: (ev, fn) => (h[ev] ??= []).push(fn), registerCommand() {} });
	const warnings = [];
	const mk = (sid) => ({
		cwd: fs.mkdtempSync(path.join(os.tmpdir(), "hm-uiws-")),
		hasUI: true,
		isProjectTrusted: () => false,
		sessionManager: { getSessionId: () => sid },
		ui: { notify: (m, t) => warnings.push({ m, t }), setStatus() {}, select: async () => "Block", theme: { fg: (_c, t) => t } },
	});
	const ctx = mk("s1");
	for (const ev of ["session_start", "before_agent_start", "session_compact", "session_shutdown"])
		for (const fn of h[ev] ?? []) await fn(ev === "session_start" ? { reason: "startup" } : { systemPrompt: "B", compactionEntry: { summary: "s" } }, ctx);
	const mine = () => warnings.filter((w) => w.m.includes(userCfg) && w.m.includes("postEdit.commands"));
	// req: R-082
	check("UI: exactly one warning for the problem in a session", mine().length === 1 && mine()[0].t === "warning", JSON.stringify(warnings));
	for (const fn of h.session_start) await fn({ reason: "startup" }, mk("s2"));
// req: R-780
	check("UI: a new session warns once more", mine().length === 2);
}

process.exit(fails);
