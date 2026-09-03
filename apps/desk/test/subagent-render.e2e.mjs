// E2E render check: subagent tracking + post-compaction context meter.
//
// Drives the REAL desk server + REAL app.js in headless Chromium against a STUB
// `pi` binary that replays a scripted RPC scenario (no model, no network):
//   1. a subagent run → the tool card must show agent/model/task/tokens (the
//      subtle strip), not raw args JSON or the raw output dump; the async
//      widget must render decoded (never the PI_SUBAGENT_ASYNC_JSON blob)
//   2. a compaction → the context meter must refresh to the compaction's own
//      estimate ("~N% … (est)") instead of going stale/blank until next reply
//
// Not part of any suite — the desk is zero-dep. Run manually:
//   PW_ROOT=<dir with playwright(-core) in node_modules> node apps/desk/test/subagent-render.e2e.mjs
// Exit 0 = pass, 1 = assertion failed, 3 = harness error.
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

function resolvePlaywright() {
	const roots = [process.env.PW_ROOT, path.dirname(new URL(import.meta.url).pathname)].filter(Boolean);
	for (const root of roots) {
		const req = createRequire(path.join(root, "x.js"));
		for (const name of ["playwright", "playwright-core"]) {
			try { return req(name); } catch { /* next */ }
		}
	}
	throw new Error("playwright not found — set PW_ROOT to a project that has playwright(-core) installed");
}

const PORT = process.env.DESK_TEST_PORT || 4382;
const BASE = `http://127.0.0.1:${PORT}`;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-subagent-e2e-"));

// ── stub pi: speaks just enough `--mode rpc` JSONL for the desk ──
const TASK = "map the corpus deltas for the Q3 screen";
const STUB = `#!/usr/bin/env node
const TASK = ${JSON.stringify(TASK)};
let phase = "pre"; // get_session_stats: pre = 75%, post = percent:null (pi's real post-compaction shape)
let messages = [];
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
const progress = (status) => ({ index: 0, agent: "researcher", status, task: TASK,
	model: "openai-codex/gpt-5.5", toolCount: status === "completed" ? 9 : 4,
	tokens: status === "completed" ? 42100 : 15300, durationMs: status === "completed" ? 161000 : 83000,
	...(status === "running" ? { currentTool: "bash", currentToolArgs: "grep -rn deltas src/" } : {}) });
const details = (status) => ({ results: [{ index: 0, agent: "researcher", task: TASK,
	model: "openai-codex/gpt-5.5", ...(status === "completed" ? { exitCode: 0 } : {}), progress: progress(status) }] });
const SNAPSHOT = "PI_SUBAGENT_ASYNC_JSON:" + JSON.stringify({ kind: "pi-subagents-async-status", version: 1,
	generatedAt: 0, caps: {}, omitted: { runs: 0, children: 0, byteLimitExceeded: false },
	runs: [{ id: "as-1", kind: "single", label: "scout", state: "running", startedAt: Date.now() - 95000,
		activity: { currentTool: "read", toolCount: 7, turnCount: 3 } }] });
const ARGS = { agent: "researcher", task: TASK };
async function subagentScenario() {
	say({ type: "agent_start" });
	say({ type: "message_update", assistantMessageEvent: { type: "toolcall_start", id: "tc1", toolName: "subagent" } });
	say({ type: "tool_execution_start", toolCallId: "tc1", toolName: "subagent", args: ARGS });
	say({ type: "tool_execution_update", toolCallId: "tc1", toolName: "subagent",
		partialResult: { content: [{ type: "text", text: "RAW-STREAM-MUST-NOT-RENDER" }], details: details("running") } });
	say({ type: "extension_ui_request", id: "w1", method: "setWidget", widgetKey: "subagents",
		widgetLines: [SNAPSHOT], widgetPlacement: "aboveEditor" });
	await new Promise((r) => setTimeout(r, 2000)); // window for the e2e to observe the running strip
	say({ type: "tool_execution_end", toolCallId: "tc1", toolName: "subagent", isError: false,
		result: { content: [{ type: "text", text: "final report: 3 deltas mapped" }], details: details("completed") } });
	messages = [
		{ role: "user", content: [{ type: "text", text: "subagent go" }] },
		{ role: "assistant", content: [{ type: "toolCall", id: "tc1", name: "subagent", arguments: ARGS }], stopReason: "toolUse" },
		{ role: "toolResult", toolCallId: "tc1", toolName: "subagent", isError: false,
			content: [{ type: "text", text: "final report: 3 deltas mapped" }], details: details("completed") },
	];
	say({ type: "agent_settled" });
}
function compactionScenario() {
	say({ type: "compaction_start", reason: "manual" });
	phase = "post";
	say({ type: "compaction_end", result: { tokensBefore: 150000, estimatedTokensAfter: 30000, summary: "compacted summary" } });
}
let buf = "";
process.stdin.on("data", (c) => {
	buf += c.toString();
	let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		const ok = (data) => say({ type: "response", id: cmd.id, success: true, ...(data !== undefined ? { data } : {}) });
		switch (cmd.type) {
			case "get_state": ok({ isStreaming: false, isCompacting: false, sessionName: "stub-e2e", sessionFile: null,
				model: { provider: "stub", id: "stub-model", contextWindow: 200000 }, thinkingLevel: "off" }); break;
			case "get_messages": ok({ messages }); break;
			case "get_session_stats": ok({ tokens: { input: 120000, output: 8000, cacheRead: 20000, cacheWrite: 0 },
				cost: 0.42, totalMessages: messages.length,
				contextUsage: phase === "pre" ? { tokens: 150000, contextWindow: 200000, percent: 75 }
					: { tokens: null, contextWindow: 200000, percent: null } }); break;
			case "get_commands": ok({ commands: [] }); break;
			case "prompt": case "steer": case "follow_up":
				ok({});
				if (String(cmd.message).includes("subagent")) subagentScenario();
				else if (String(cmd.message).includes("compact")) compactionScenario();
				break;
			default: ok({});
		}
	}
});
`;
const binDir = path.join(TD, "bin");
fs.mkdirSync(binDir);
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

const server = spawn("node", [SERVER], {
	env: { ...process.env, DESK_PORT: String(PORT), PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
	stdio: ["ignore", "pipe", "pipe"],
});
const die = (code) => { server.kill(); fs.rmSync(TD, { recursive: true, force: true }); process.exit(code); };

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(BASE + "/api/live"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 39) throw new Error("desk server never came up");
	}
	const spawned = await fetch(BASE + "/api/spawn", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ cwd: TD, name: "subagent-render-e2e" }),
	}).then((r) => r.json());
	if (!spawned.id) throw new Error("spawn failed: " + JSON.stringify(spawned));

	const { chromium } = resolvePlaywright();
	const browser = await chromium.launch(
		process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
	const page = await browser.newPage();
	await page.goto(BASE);
	await page.waitForSelector("#live-list .live-row", { timeout: 10000 });
	await page.click("#live-list .live-row");
	await page.waitForSelector("#input", { timeout: 5000 });

	// ── scenario 1: subagent run ──
	await page.fill("#input", "subagent go");
	await page.press("#input", "Enter");

	// mid-run: the strip is live (stub holds the run open for 2s)
	await page.waitForSelector(".tool-card .sub-strip .sub-child", { timeout: 3000 });
	if (process.env.PW_SHOT) await page.screenshot({ path: process.env.PW_SHOT }); // visual harness: PW_SHOT=/path.png
	const midStrip = await page.$eval(".tool-card .sub-strip", (n) => n.textContent);
	check("running strip shows agent name", midStrip.includes("researcher"));
	check("running strip shows model", midStrip.includes("openai-codex/gpt-5.5"));
	check("running strip shows tokens", midStrip.includes("15.3k tok"));
	check("running strip shows current activity", midStrip.includes("bash grep -rn deltas"));
	const midCard = await page.$eval(".tool-card", (n) => n.textContent);
	check("raw child stream not rendered", !midCard.includes("RAW-STREAM-MUST-NOT-RENDER"));
	const targ = await page.$eval(".tool-card .targ", (n) => n.textContent);
	check("head summary is human-readable", targ === `researcher — ${TASK}`);
	const widget = await page.$eval(".sub-widget", (n) => n.textContent).catch(() => null);
	check("async widget decoded (label visible)", !!widget && widget.includes("scout"));
	check("async widget JSON blob not rendered", !!widget && !widget.includes("PI_SUBAGENT_ASYNC_JSON"));

	// settle → history re-render path (toolResult.details) must keep the strip
	for (let t = 0; t < 60; t++) {
		if ((await page.$eval("#chip", (n) => n.textContent)) === "idle") break;
		await page.waitForTimeout(250);
	}
	await page.waitForTimeout(300); // let resync finish
	const doneStrip = await page.$eval(".tool-card .sub-strip", (n) => n.textContent);
	check("settled strip survives history re-render", doneStrip.includes("researcher") && doneStrip.includes("42.1k tok"));
	const ctxPre = await page.$eval("#ctx-label", (n) => n.textContent);
	check("pre-compaction context meter", ctxPre.includes("75%"));

	// ── scenario 2: compaction refreshes the meter without a new message ──
	await page.fill("#input", "compact now");
	await page.press("#input", "Enter");
	let ctxPost = "";
	for (let t = 0; t < 40; t++) {
		ctxPost = await page.$eval("#ctx-label", (n) => n.textContent);
		if (ctxPost.includes("est")) break;
		await page.waitForTimeout(250);
	}
	check("post-compaction meter shows estimate", ctxPost.includes("~15%") && ctxPost.includes("(est)"));

	await browser.close();
	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message);
	die(3);
}
