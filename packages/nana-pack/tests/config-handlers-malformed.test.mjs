/**
 * @module packages/nana-pack/tests/config-handlers-malformed.test.mjs
 * @purpose Pin malformed-config handler survival, fail-safe gating and config problem journaling.
 * @inputs Pack extensions, malformed config variants and fresh temp homes and workspaces.
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (temp homes, config files and workspaces), process (sets HOME and USERPROFILE)
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
const EXT = ["nana-gate", "nana-objective", "nana-adoption", "nana-lifecycle", "nana-writing", "nana-roster-notice"];
const exts = {};
for (const n of EXT) exts[n] = (await import(new URL(`../extensions/${n}.ts`, import.meta.url).href)).default;

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };

// [label, file text, expected config_invalid lines for the user file]
const VARIANTS = [
	...[null, 7, "x", [], true].map((v) => [`whole file = ${JSON.stringify(v)}`, JSON.stringify(v), 1]),
	["trailing-comma file (Opus)", '{ "notify": { "headless": false }, }', 1],
	["binary garbage", "\u0000ÿ{{", 1],
	...["gate", "notify", "journal", "objective", "receipts"].map((b) => [`${b} = 7`, JSON.stringify({ [b]: 7 }), b === "notify" ? 0 : 1]),
	["sol postEdit.commands = null", JSON.stringify({ postEdit: { commands: null } }), 0],
	["sol objective.path = 7", JSON.stringify({ objective: { path: 7 } }), 1],
	["handoff.path = []", JSON.stringify({ handoff: { path: [] } }), 0],
	["journal.path = 7", JSON.stringify({ journal: { path: 7 } }), 1],
	["receipts.dir = 42", JSON.stringify({ receipts: { dir: 42 } }), 1],
	["notify.enabled = \"x\"", JSON.stringify({ notify: { enabled: "x" } }), 0],
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

	// req: R-070, R-083
	check(`${label}: no handler throws`, errors.length === 0, errors.join("; "));
	// req: R-774
	check(`${label}: gate still blocks rm -rf /tmp/x headless`, gateOut.some((r) => r?.block === true), JSON.stringify(gateOut));
	const prompts = Object.values(promptEvent.systemPromptOptions.sections).join("\n");
	// req: R-781
	check(`${label}: objective text or OBJECTIVE UNAVAILABLE marker injected`, prompts.includes("OBJ: ship the thing") || prompts.includes("OBJECTIVE UNAVAILABLE"));
	const journal = path.join(agent, "nana-journal.jsonl");
	const lines = fs.existsSync(journal) ? fs.readFileSync(journal, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
	const invalid = lines.filter((l) => l.event === "config_invalid" && l.file === userCfg);
	// req: R-4011
	check(`${label}: exactly ${expectLines} config_invalid journal line(s) naming the file`, invalid.length === expectLines, JSON.stringify(invalid));
}

process.exit(fails);
