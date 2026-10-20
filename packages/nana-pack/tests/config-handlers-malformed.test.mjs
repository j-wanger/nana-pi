/**
 * @module packages/nana-pack/tests/config-handlers-malformed.test.mjs
 * @purpose Pins that every registered nana-pack handler survives every malformed user config without throwing, while the gate still blocks, the problem is journaled once, and post-edit and lifecycle keep working under five unrelated malformed blocks
 * @inputs the eight extensions under extensions/, malformed nana-pack.json variants, a configured postEdit check on a.ts, and a fresh temp HOME and workspace per variant
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp HOMEs, config files and workspaces), process (sets HOME and USERPROFILE, spawns the configured postEdit checker as a child process)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { tmpDir } from "./tmp-dir.mjs";
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
const EXT = ["nana-gate", "nana-post-edit", "nana-objective", "nana-handoff", "nana-notify", "nana-lifecycle", "nana-writing", "nana-roster-notice"];
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
	const home = tmpDir(path.join(os.tmpdir(), "hm-home-"));
	process.env.HOME = home;
	process.env.USERPROFILE = home;
	const agent = path.join(home, ".pi", "agent");
	fs.mkdirSync(agent, { recursive: true });
	const userCfg = path.join(agent, "nana-pack.json");
	fs.writeFileSync(userCfg, text);
	fs.writeFileSync(path.join(agent, "nana-objective.md"), "OBJ: ship the thing\n");
	const cwd = tmpDir(path.join(os.tmpdir(), "hm-ws-"));
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
	const promptEvent = { systemPromptOptions: { sections: {} } };
	await fire("before_agent_start", promptEvent);
	await fire("agent_settled", {});
	await fire("session_before_compact", {});
	await fire("session_compact", { compactionEntry: { summary: "state" }, reason: "manual" });
	await fire("session_compact_failed", {});
	await fire("session_shutdown", { reason: "quit" });

	// req: R-083
	check(`${label}: no handler throws`, errors.length === 0, errors.join("; "));
	check(`${label}: gate still blocks rm -rf /tmp/x headless`, gateOut.some((r) => r?.block === true), JSON.stringify(gateOut));
	const prompts = Object.values(promptEvent.systemPromptOptions.sections).join("\n");
	// req: R-781
	check(`${label}: objective text or OBJECTIVE UNAVAILABLE marker injected`, prompts.includes("OBJ: ship the thing") || prompts.includes("OBJECTIVE UNAVAILABLE"));
	const journal = path.join(agent, "nana-journal.jsonl");
	const lines = fs.existsSync(journal) ? fs.readFileSync(journal, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
	const invalid = lines.filter((l) => l.event === "config_invalid" && l.file === userCfg);
	// req: R-082
	check(`${label}: exactly ${expectLines} config_invalid journal line(s) naming the file`, invalid.length === expectLines, JSON.stringify(invalid));
}

// One UI warning per (file, problem) per session, however many handlers load config.
{
	const home = tmpDir(path.join(os.tmpdir(), "hm-ui-"));
	process.env.HOME = home;
	process.env.USERPROFILE = home;
	fs.mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
	const userCfg = path.join(home, ".pi", "agent", "nana-pack.json");
	fs.writeFileSync(userCfg, JSON.stringify({ postEdit: { commands: null } }));
	const h = {};
	for (const n of EXT) exts[n]({ on: (ev, fn) => (h[ev] ??= []).push(fn), registerCommand() {} });
	const warnings = [];
	const mk = (sid) => ({
		cwd: tmpDir(path.join(os.tmpdir(), "hm-uiws-")),
		hasUI: true,
		isProjectTrusted: () => false,
		sessionManager: { getSessionId: () => sid },
		ui: { notify: (m, t) => warnings.push({ m, t }), setStatus() {}, select: async () => "Block", theme: { fg: (_c, t) => t } },
	});
	const ctx = mk("s1");
	for (const ev of ["session_start", "before_agent_start", "session_compact", "session_shutdown"]) {
		const event = ev === "session_start" ? { reason: "startup" } : ev === "before_agent_start" ? { systemPromptOptions: { sections: {} } } : { compactionEntry: { summary: "s" } };
		for (const fn of h[ev] ?? []) await fn(event, ctx);
	}
	const mine = () => warnings.filter((w) => w.m.includes(userCfg) && w.m.includes("postEdit.commands"));
	// req: R-082
	check("UI: exactly one warning for the problem in a session", mine().length === 1 && mine()[0].t === "warning", JSON.stringify(warnings));
	for (const fn of h.session_start) await fn({ reason: "startup" }, mk("s2"));
// req: R-780
	check("UI: a new session warns once more", mine().length === 2);
}

// R-781: post-edit and lifecycle under five unrelated malformed blocks (each variant also
// configures a postEdit check on a.ts so post-edit has something to run and fail).
{
	const R781_VARIANTS = [
		["gate = 7", { gate: 7 }],
		["notify = 7", { notify: 7 }],
		["handoff = 7", { handoff: 7 }],
		["objective = 7", { objective: 7 }],
		["journal.path = 7", { journal: { path: 7 } }],
	];
	let r781Pass = true;
	const r781Detail = [];
	for (const [label, block] of R781_VARIANTS) {
		const home = tmpDir(path.join(os.tmpdir(), "hm-r781-home-"));
		process.env.HOME = home;
		process.env.USERPROFILE = home;
		const agent = path.join(home, ".pi", "agent");
		fs.mkdirSync(agent, { recursive: true });
		const raw = { ...block, postEdit: { commands: [{ match: "\\.ts$", run: 'node -e "process.exit(1)"' }] } };
		fs.writeFileSync(path.join(agent, "nana-pack.json"), JSON.stringify(raw));
		fs.writeFileSync(path.join(agent, "nana-objective.md"), "OBJ: ship the thing\n");
		const cwd = tmpDir(path.join(os.tmpdir(), "hm-r781-ws-"));
		fs.writeFileSync(path.join(cwd, "a.ts"), "x\n");

		const h = {};
		const api = { on: (ev, fn) => (h[ev] ??= []).push(fn), registerCommand() {} };
		for (const n of EXT) exts[n](api);
		const ctx = { cwd, hasUI: false, isProjectTrusted: () => true, signal: new AbortController().signal, sessionManager: { getSessionId: () => `r781-${label}` } };
		const fire = async (ev, event) => {
			const out = [];
			for (const fn of h[ev] ?? []) out.push(await fn(event, ctx));
			return out;
		};

		await fire("session_start", { reason: "startup" });
		const editResults = await fire("tool_result", { toolName: "edit", isError: false, input: { path: "a.ts" }, content: [{ type: "text", text: "edited" }] });

		const postEditText = editResults.map((r) => (r?.content ?? []).map((c) => c.text).join("\n")).join("\n");
		const postEditPass = postEditText.includes("[nana-post-edit] 1 check(s) failed");
		const journal = path.join(agent, "nana-journal.jsonl");
		const journalText = fs.existsSync(journal) ? fs.readFileSync(journal, "utf-8") : "";
		const lifecyclePass = journalText.split("\n").some((l) => l.includes('"event":"session_start"'));

		// A stopped gate blocks every edit before post-edit ever runs — so in pi, post-edit's own
		// feedback is unreachable under gate = 7, and only lifecycle is asserted for that variant.
		const variantOk = lifecyclePass && (label === "gate = 7" || postEditPass);
		if (!variantOk) r781Pass = false;
		r781Detail.push(`${label}: lifecycle=${lifecyclePass} postEdit=${postEditPass}`);
	}
	// req: R-781
	check("with an unrelated block malformed, post-edit still feeds back its check's failure and lifecycle still journals the session start",
		r781Pass,
		r781Detail.join(" | "),
	);
}

process.exit(fails);
