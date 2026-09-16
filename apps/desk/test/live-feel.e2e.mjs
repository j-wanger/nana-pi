// E2E for the three live-feel surfaces (2026-09-16). Real desk server + STUB pi
// (no model, no network) + headless Chromium.
//
// The stub emits the turn ONE STEP AT A TIME, each step driven by a `!step:<x>`
// bash command from the composer, so every assertion is a positive wait on a
// DOM state the page can only reach after that step's events — no timing, no
// settle windows except the two marked SETTLE, which back negative assertions.
//
//   1. activity line — hidden when idle; "Starting…" at agent_start with a
//      running elapsed timer; "Thinking…" on thinking deltas; "Calling read…"
//      when the model emits the tool call, "Reading notes.md…" while it runs,
//      "Thinking…" again when it answers; "Writing…" on text deltas; gone at
//      agent_settled — and gone, with its timer stopped, on a session switch.
//   2. thinking card — a fixed-height window on the LAST lines while it streams
//      (clipped, scrolled to the newest, transcript still pinned), expandable to
//      the full text and back; collapsed to the history <details> with
//      "thinking · N chars · Ns" at the first tool call; and history's own
//      <details> carries the same char count.
//   3. skill trigger — a user message pi expanded into a whole skill file
//      renders as `▸ /skill:NAME` + the typed args, body hidden behind a closed
//      <details>; the optimistic bubble is still swapped for the echo (ONE
//      bubble, not two) even though the echo cannot equal what was typed.
//
// Run: PW_ROOT=<dir with playwright> node apps/desk/test/live-feel.e2e.mjs
// Exit 0 = pass, 1 = assertion failed, 3 = harness error.
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { resolvePiBin, resolvePiPackage } from "../pi-session.mjs";

function resolvePlaywright() {
	const roots = [process.env.PW_ROOT, path.dirname(new URL(import.meta.url).pathname)].filter(Boolean);
	for (const root of roots) {
		const req = createRequire(path.join(root, "x.js"));
		for (const name of ["playwright", "playwright-core"]) { try { return req(name); } catch {} }
	}
	throw new Error("playwright not found — set PW_ROOT");
}
const { chromium } = resolvePlaywright();

const freePort = () =>
	new Promise((resolve) => {
		const srv = net.createServer();
		srv.listen(0, "127.0.0.1", () => {
			const { port } = srv.address();
			srv.close(() => resolve(port));
		});
	});
const DESK = Number(process.env.DESK_TEST_PORT) || (await freePort());
const BASE = `http://127.0.0.1:${DESK}`;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The desk parses sessions with the pi install tied to the `pi` it SPAWNS, and
// this harness puts a stub `pi` first on PATH. Name the real package explicitly.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "desk-livefeel-"));
const binDir = path.join(tmp, "bin");
const cwdA = path.join(tmp, "alpha");
const cwdB = path.join(tmp, "bravo");
for (const d of [binDir, cwdA, cwdB]) fs.mkdirSync(d, { recursive: true });

// What the page should see, spelled out here so the checks below can name it.
const THINK_LINES = 30;
const THINK = Array.from({ length: THINK_LINES }, (_, i) => `reasoning line ${i + 1}`).join("\n");
const SKILL_BODY = "# Demo skill\n\nStep one.\nStep two.";
const SKILL_DIR = "/tmp/skills/demo";
// Byte-for-byte pi's `_expandSkillCommand` (dist/core/agent-session.js).
const SKILL_MSG = `<skill name="demo" location="${SKILL_DIR}/SKILL.md">\nReferences are relative to ${SKILL_DIR}.\n\n${SKILL_BODY}\n</skill>`;

// ── stub pi: a scripted turn, one step per `step:<name>` bash command ──
const STUB = `#!/usr/bin/env node
const MARK = require("node:path").basename(process.cwd());
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
const THINK = ${JSON.stringify(THINK)};
const SKILL_MSG = ${JSON.stringify(SKILL_MSG)};
const ASSISTANT = { role: "assistant", content: [{ type: "thinking", thinking: THINK }, { type: "text", text: "Here is the answer." }] };
const messages = [{ role: "user", content: [{ type: "text", text: "marker-" + MARK }] }];
let streaming = false; // what get_state reports, so the desk's own poll agrees with the script
const ame = (a) => say({ type: "message_update", assistantMessageEvent: a });
function step(name) {
	switch (name) {
		case "start": streaming = true; say({ type: "agent_start" }); say({ type: "message_start" }); break;
		case "think":
			ame({ type: "thinking_start", contentIndex: 0 });
			for (const line of THINK.split("\\n")) ame({ type: "thinking_delta", contentIndex: 0, delta: line + "\\n" });
			break;
		case "call": ame({ type: "toolcall_start", contentIndex: 1, id: "tc1", toolName: "read" }); break;
		case "tool": say({ type: "tool_execution_start", toolCallId: "tc1", toolName: "read", args: { path: "/a/b/notes.md" } }); break;
		case "tool-end": say({ type: "tool_execution_end", toolCallId: "tc1", toolName: "read", result: { content: [{ type: "text", text: "file body" }] } }); break;
		case "text":
			ame({ type: "text_start", contentIndex: 2 });
			ame({ type: "text_delta", contentIndex: 2, delta: "Here is " });
			ame({ type: "text_delta", contentIndex: 2, delta: "the answer." });
			break;
		case "end": messages.push(ASSISTANT); say({ type: "message_end", message: ASSISTANT }); break;
		case "settle": streaming = false; say({ type: "agent_settled" }); break;
	}
}
let buf = "";
process.stdin.on("data", (c) => {
	buf += c; let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		const ok = (data) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data });
		switch (cmd.type) {
			case "get_state": ok({ isStreaming: streaming, isCompacting: false, sessionName: MARK, sessionFile: null, model: { provider: "stub", id: "stub" }, thinkingLevel: "off" }); break;
			case "get_messages": ok({ messages }); break;
			case "get_session_stats": ok({ tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, cost: 0, totalMessages: messages.length, contextUsage: null }); break;
			case "get_commands": ok({ commands: [] }); break;
			case "clear_queue": ok({ steering: [], followUp: [] }); break;
			case "bash":
				if (cmd.command.startsWith("step:")) step(cmd.command.slice(5));
				say({ type: "response", id: cmd.id, success: true, data: { exitCode: 0 } });
				break;
			// pi EXPANDS /skill:<name> [args] before it records the message: the
			// echo is the whole skill file, never what the user typed.
			case "prompt": {
				let text = cmd.message;
				const m = /^\\/skill:(\\S+)(?:\\s+([\\s\\S]*))?$/.exec(String(text).trim());
				if (m && m[1] === "demo") text = m[2] ? SKILL_MSG + "\\n\\n" + m[2].trim() : SKILL_MSG;
				const msg = { role: "user", content: [{ type: "text", text }] };
				messages.push(msg);
				say({ type: "message_end", message: msg });
				ok({});
				break;
			}
			default: ok({});
		}
	}
});
process.stdin.on("end", () => process.exit(0));
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

// detached: its own process GROUP, so teardown can signal the desk AND the pi
// children it spawned — a SIGKILL to the desk alone orphans them.
const server = spawn("node", [SERVER], {
	env: { ...process.env, DESK_PI_ROOT: PI_ROOT, HOME: tmp, DESK_PORT: String(DESK), DESK_APPS_DIR: path.join(tmp, "no-apps"), PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
	stdio: ["ignore", "pipe", "pipe"],
	detached: true,
});
const signalTree = (sig) => {
	try { process.kill(-server.pid, sig); } catch { try { server.kill(sig); } catch {} }
};
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
let browser;
const die = async (code) => {
	try { await browser?.close(); } catch {}
	if (server.exitCode === null && server.signalCode === null) {
		const gone = new Promise((r) => server.once("exit", () => r("exit")));
		signalTree("SIGTERM");
		if ((await Promise.race([gone, new Promise((r) => setTimeout(() => r("timeout"), 5000))])) === "timeout") {
			signalTree("SIGKILL");
			await gone;
		}
	}
	fs.rmSync(tmp, { recursive: true, force: true });
	process.exit(code);
};
let dying = false;
for (const ev of ["uncaughtException", "unhandledRejection"]) {
	process.on(ev, (e) => {
		if (dying) return;
		dying = true;
		console.error(`E2E ${ev}:`, e?.message || e);
		die(3);
	});
}

const SETTLE = 400; // bounded window before a negative assertion only
const spawnSession = (cwd, name) =>
	fetch(`${BASE}/api/spawn`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cwd, name }) }).then((r) => r.json());
const openByMark = async (page, mark) => {
	await page.waitForFunction((m) => [...document.querySelectorAll("#live-list .live-row .cwd")].some((c) => c.textContent === m), mark, { timeout: 15000 });
	await page.click(`#live-list .live-row:has(.cwd:text-is("${mark}"))`);
	await page.waitForSelector("#input", { state: "visible", timeout: 5000 });
};
// one scripted step, through the composer's own bash path
const step = async (page, name) => {
	await page.fill("#input", `!step:${name}`);
	await page.press("#input", "Enter");
};
const activity = (page) => page.evaluate(() => ({
	on: document.getElementById("activity").classList.contains("on"),
	verb: document.getElementById("act-verb").textContent,
	time: document.getElementById("act-time").textContent,
	spin: document.getElementById("act-spin").textContent,
}));
const waitVerb = (page, verb) =>
	page.waitForFunction((v) => document.getElementById("act-verb").textContent === v, verb, { timeout: 15000 });

try {
	for (let i = 0; i < 60; i++) {
		try { await fetch(`${BASE}/api/live`); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 59) throw new Error(`desk server never came up: ${log}`);
	}
	const a = await spawnSession(cwdA, "alpha");
	const b = await spawnSession(cwdB, "bravo");
	if (!a.id || !b.id) throw new Error(`spawn failed: ${JSON.stringify([a, b])} ${log}`);

	browser = await chromium.launch();
	const ctx = await browser.newContext();
	const page = await ctx.newPage();
	page.on("pageerror", (e) => { console.log("FAIL page error:", e.message); fails++; });
	await page.goto(BASE);
	await openByMark(page, "alpha");
	await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-alpha"), null, { timeout: 15000 });

	// ── 1. idle: the row is there but says nothing, and reserves its height ───
	{
		const act = await activity(page);
		check("idle: the activity line is off", !act.on && act.verb === "" && act.time === "", JSON.stringify(act));
		const box = await page.evaluate(() => {
			const e = document.getElementById("activity");
			return { h: e.getBoundingClientRect().height, vis: getComputedStyle(e).visibility };
		});
		check("idle: its height is reserved, not collapsed (no jump when a turn starts)", box.h > 8 && box.vis === "hidden", JSON.stringify(box));
	}

	// ── agent_start → "Starting…" + a running timer ────────────────────────────
	await step(page, "start");
	await waitVerb(page, "Starting…");
	{
		const act = await activity(page);
		check("agent_start: the line is on and says Starting…", act.on && act.verb === "Starting…", JSON.stringify(act));
		check("agent_start: an elapsed timer is showing", /^\d+s$/.test(act.time), act.time);
		check("agent_start: a spinner glyph is showing", act.spin.length === 1, JSON.stringify(act.spin));
	}
	await page.waitForFunction(() => document.getElementById("act-time").textContent === "1s", null, { timeout: 8000 });
	check("agent_start: the timer runs", true);

	// ── thinking deltas → "Thinking…" + the streaming card ─────────────────────
	await step(page, "think");
	await waitVerb(page, "Thinking…");
	await page.waitForSelector(".think-card", { timeout: 10000 });
	{
		const card = await page.evaluate(() => {
			const c = document.querySelector(".think-card");
			const win = c.querySelector(".think-win");
			const t = document.getElementById("transcript");
			return {
				open: c.classList.contains("open"),
				lines: c.querySelector(".think-text").textContent.split("\n").filter(Boolean).length,
				first: c.querySelector(".think-text").textContent.includes("reasoning line 1\n"),
				last: c.querySelector(".think-text").textContent.includes(`reasoning line ${30}`),
				winH: Math.round(win.getBoundingClientRect().height),
				clipped: win.scrollHeight > win.clientHeight + 2,
				scrolled: win.scrollTop > 0,
				pinned: t.scrollHeight - t.scrollTop - t.clientHeight < 60,
				label: c.querySelector(".think-label").textContent,
			};
		});
		check("thinking: a compact card, not a wall of text", card.winH > 40 && card.winH < 160, String(card.winH));
		check("thinking: it shows only the last lines", card.lines <= 14 && card.lines >= 4 && !card.first, JSON.stringify(card));
		check("thinking: the newest line is the one at the bottom", card.last && card.clipped && card.scrolled, JSON.stringify(card));
		check("thinking: it is labelled", card.label === "thinking", card.label);
		check("thinking: the growing window does not unpin the transcript", card.pinned, JSON.stringify(card));
	}

	// expandable DURING streaming, and back again
	await page.click(".think-card .think-head");
	{
		const open = await page.evaluate(() => {
			const c = document.querySelector(".think-card");
			const win = c.querySelector(".think-win");
			return {
				open: c.classList.contains("open"),
				first: c.querySelector(".think-text").textContent.startsWith("reasoning line 1\n"),
				lines: c.querySelector(".think-text").textContent.split("\n").filter(Boolean).length,
				atBottom: win.scrollHeight - win.scrollTop - win.clientHeight < 4,
			};
		});
		check("thinking: the header opens the full text so far", open.open && open.first && open.lines === 30, JSON.stringify(open));
		check("thinking: opened, it is scrolled to the newest text", open.atBottom, JSON.stringify(open));
	}
	await page.click(".think-card .think-head");
	check("thinking: it closes again", !(await page.evaluate(() => document.querySelector(".think-card").classList.contains("open"))));

	// ── the model emits the tool call: "Calling read…" and the card collapses ──
	await step(page, "call");
	await waitVerb(page, "Calling read…");
	{
		const d = await page.evaluate(() => {
			const det = [...document.querySelectorAll(".thinking-details")];
			const last = det[det.length - 1];
			return {
				cards: document.querySelectorAll(".think-card").length,
				n: det.length,
				summary: last?.querySelector("summary")?.textContent ?? null,
				open: last?.open ?? null,
				body: last?.querySelector(".thinking-body")?.textContent ?? "",
			};
		});
		check("thinking: the streaming card is gone once the block ends", d.cards === 0, String(d.cards));
		check("thinking: it collapsed to the history <details>", d.n === 1 && d.open === false, JSON.stringify(d));
		check("thinking: the closed header carries chars + duration", /^thinking · [\d.]+k? chars · \d+m?\s?\d*s$/.test(d.summary || ""), JSON.stringify(d.summary));
		check("thinking: the whole reasoning is still there, just closed", d.body.includes("reasoning line 1") && d.body.includes("reasoning line 30"), String(d.body.length));
	}

	// ── the tool runs, then answers ───────────────────────────────────────────
	await step(page, "tool");
	await waitVerb(page, "Reading notes.md…");
	check("tool_execution_start: the activity names the file, not the tool", true);
	await step(page, "tool-end");
	await waitVerb(page, "Thinking…");
	check("tool_execution_end: back to Thinking… while the model resumes", true);

	// ── text deltas ───────────────────────────────────────────────────────────
	await step(page, "text");
	await waitVerb(page, "Writing…");
	check("text_delta: Writing…", true);

	// ── message_end: history's own <details> carries the same char count ───────
	await step(page, "end");
	// the live elements are gone and pi's own record is in: the streaming bubble
	// has been replaced by the rendered-markdown one (the text alone is already on
	// screen from the deltas, so it cannot be the fence)
	await page.waitForFunction(
		() => document.querySelectorAll("#transcript .msg.assistant.md").length === 1 && !document.querySelector("#transcript .msg.assistant.streaming"),
		null, { timeout: 10000 });
	{
		const d = await page.evaluate(() => {
			const det = [...document.querySelectorAll(".thinking-details")];
			return { n: det.length, summary: det[det.length - 1]?.querySelector("summary")?.textContent ?? null, open: det[det.length - 1]?.open ?? null };
		});
		check("history: exactly one thinking block, still closed", d.n === 1 && d.open === false, JSON.stringify(d));
		check("history: its header carries the char count too", /^thinking · [\d.]+k? chars$/.test(d.summary || ""), JSON.stringify(d.summary));
	}

	// ── agent_settled: the line and its timer stop ────────────────────────────
	await step(page, "settle");
	await page.waitForFunction(() => !document.getElementById("activity").classList.contains("on"), null, { timeout: 10000 });
	{
		const first = await activity(page);
		await page.waitForTimeout(SETTLE); // SETTLE: the timer would have ticked twice by now
		const act = await activity(page);
		check("agent_settled: the activity line is gone", !act.on && act.verb === "" && act.time === "", JSON.stringify(act));
		check("agent_settled: its timer is stopped, not just hidden", act.time === first.time && act.spin === "", JSON.stringify([first, act]));
	}

	// ── 3. a /skill: prompt — one bubble, collapsed ───────────────────────────
	await page.fill("#input", "/skill:demo go");
	await page.press("#input", "Enter");
	await page.waitForSelector(".msg.user .skill-trigger", { timeout: 15000 });
	const skillBubble = () => page.evaluate(() => {
		const bubbles = [...document.querySelectorAll(".msg.user")].filter((b) => b.textContent.includes("/skill:demo"));
		const b = bubbles[bubbles.length - 1];
		const det = b?.querySelector("details");
		return {
			bubbles: bubbles.length,
			trigger: b?.querySelector(".skill-trigger")?.textContent ?? null,
			args: [...b.children].filter((c) => c.tagName === "DIV" && !c.classList.contains("skill-trigger")).map((c) => c.textContent),
			summary: det?.querySelector("summary")?.textContent ?? null,
			open: det?.open ?? null,
			// a closed <details> is `content-visibility: hidden` in Chromium — it still
			// has a box, so ask checkVisibility() rather than measuring it
			bodyVisible: det ? det.querySelector(".note-body").checkVisibility() : null,
			body: det?.querySelector(".note-body")?.textContent ?? "",
			expanded: b?.textContent.includes("<skill name=") ?? null,
		};
	});
	{
		const s = await skillBubble();
		check("skill: ONE bubble — the optimistic one was swapped for the echo", s.bubbles === 1, JSON.stringify(s.bubbles));
		check("skill: the trigger is what you see", s.trigger === "▸ /skill:demo", JSON.stringify(s.trigger));
		check("skill: the typed args are shown", s.args.length === 1 && s.args[0] === "go", JSON.stringify(s.args));
		check("skill: the raw expansion is not in the bubble text", s.expanded === false, JSON.stringify(s.expanded));
		check("skill: the body is behind a closed <details>", s.open === false && s.bodyVisible === false, JSON.stringify(s));
		check("skill: the <details> says how much is in there", /^skill contents · \d+ chars$/.test(s.summary || ""), JSON.stringify(s.summary));
		check("skill: the body is the skill file", s.body.includes("# Demo skill") && s.body.includes("Step two."), String(s.body.length));
		check("skill: the args did not leak into the body", !s.body.includes("go\n") && !s.body.endsWith("go"), JSON.stringify(s.body.slice(-20)));
	}
	// …and the same after history is re-read (agent_settled → get_messages)
	await step(page, "settle");
	await page.waitForFunction(() => document.querySelectorAll(".bash-card").length === 0, null, { timeout: 10000 });
	{
		const s = await skillBubble();
		check("skill: history renders it the same way", s.bubbles === 1 && s.trigger === "▸ /skill:demo" && s.open === false, JSON.stringify(s));
	}

	// ── the timer is cleared on a session switch ──────────────────────────────
	await step(page, "start");
	await waitVerb(page, "Starting…");
	await openByMark(page, "bravo");
	await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-bravo"), null, { timeout: 15000 });
	{
		await page.waitForTimeout(SETTLE); // SETTLE: the old stage's ticker would have run twice
		const act = await activity(page);
		check("switch: the activity line does not follow you to the new session", !act.on && act.verb === "" && act.time === "", JSON.stringify(act));
	}

	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	await die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message, "\n--- server log ---\n", log.slice(-3000));
	await die(3);
}
