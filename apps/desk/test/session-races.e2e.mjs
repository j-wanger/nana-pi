// E2E: the desk page's async continuations must be tied to the session that
// started them, and a response can never arrive "too early" for the DOM node it
// belongs to. Real desk server + STUB pi (no model) + headless Chromium.
//
// Every interleaving here is CONTROLLED, not timed: `page.route()` holds the
// exact response under test until the test releases it, and the release point is
// a condition on what the page has already received (an SSE spy installed by
// `addInitScript`, which sees each event in the same dispatch as the app's own
// handler, before it). No sleeps decide any outcome.
//
//   1. switch mid-resync — A's `get_messages` is held, the user selects B,
//      then A's answer is released: B's pane must still show only B.
//   2. reconnect — the SSE socket is destroyed and the browser reconnects: one
//      dialog node, one status chip, EXACTLY ONE extra `get_messages`, and the
//      chip recovers from "disconnected".
//   3. bash echo-before-fetch — the child's `bash_execution_update` and
//      `desk_bash_result` reach the page before the POST that creates the row
//      resolves (the server forwards the command to the child BEFORE it writes
//      the HTTP response, server.mjs `action === "bash"`): one row, output kept,
//      finished — not a card that spins forever.
//   4. prompt dedup — (a) echo beats fetch → one bubble (the 2026-09-02 case,
//      pinned here without a model call); (b) the response is lost AFTER pi
//      echoed the message → the text must NOT be pushed back into the editor;
//      (c) a genuine rejection with no echo → the text IS restored and the
//      optimistic bubble removed; (d) a prompt rejected after a session switch
//      must not restore A's text into B's editor.
//
// Run: PW_ROOT=<dir with playwright> node apps/desk/test/session-races.e2e.mjs
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

const DESK = Number(process.env.DESK_TEST_PORT || 4441);
const BASE = `http://127.0.0.1:${DESK}`;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The desk parses sessions with the pi install tied to the `pi` it SPAWNS, and
// this harness puts a stub `pi` first on PATH. Name the real package explicitly.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "desk-races-"));
const binDir = path.join(tmp, "bin");
const cwdA = path.join(tmp, "alpha");
const cwdB = path.join(tmp, "bravo");
const cwdC = path.join(tmp, "charlie");
for (const d of [binDir, cwdA, cwdB, cwdC]) fs.mkdirSync(d, { recursive: true });

// ── stub pi: identifies itself by its cwd, so A's and B's transcripts differ ──
const STUB = `#!/usr/bin/env node
const MARK = require("node:path").basename(process.cwd());
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
// a dialog and a status chip live in the server's desk_hello snapshot, so both
// are replayed on every (re)connect — that is what check 2 counts. Only the
// reconnect session raises a dialog: an open dialog covers the rail.
setTimeout(() => {
	if (MARK === "charlie") say({ type: "extension_ui_request", id: "ui-hold", method: "confirm", title: "hold me" });
	say({ type: "extension_ui_request", id: "st-1", method: "setStatus", statusKey: "k1", statusText: "chip-" + MARK });
}, 30);
let buf = "";
process.stdin.on("data", (c) => {
	buf += c; let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		const ok = (data) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data });
		switch (cmd.type) {
			case "get_state": ok({ isStreaming: false, isCompacting: false, sessionName: MARK, sessionFile: null, model: { provider: "stub", id: "stub" }, thinkingLevel: "off" }); break;
			case "get_messages": ok({ messages: [{ role: "user", content: [{ type: "text", text: "marker-" + MARK }] }] }); break;
			case "get_session_stats": ok({ tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, cost: 0, totalMessages: 1, contextUsage: null }); break;
			case "get_commands": ok({ commands: [] }); break;
			case "clear_queue": ok({ steering: [], followUp: [] }); break;
			// bash: stream a chunk and answer IMMEDIATELY — the server writes its
			// HTTP response only after handing us the command, so both of these can
			// beat the POST to the page
			case "bash":
				say({ type: "bash_execution_update", id: cmd.id, delta: "chunk-one\\n" });
				say({ type: "bash_execution_update", id: cmd.id, delta: "chunk-two\\n" });
				say({ type: "response", id: cmd.id, success: true, data: { exitCode: 0 } });
				break;
			// prompt: echo the user message back the way pi does
			case "prompt":
				say({ type: "message_end", message: { role: "user", content: [{ type: "text", text: cmd.message }] } });
				ok({});
				break;
			default: ok({});
		}
	}
});
process.stdin.on("end", () => process.exit(0));
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

const server = spawn("node", [SERVER], {
	env: { ...process.env, DESK_PI_ROOT: PI_ROOT, HOME: tmp, DESK_PORT: String(DESK), DESK_APPS_DIR: path.join(tmp, "no-apps"), PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
	stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
let browser;
const die = (code) => { browser?.close().catch(() => {}); relay.close(); killSse(); server.kill(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(code); };

// Records every SSE event the page's own EventSource delivers. The listener is
// registered inside the constructor, so it runs BEFORE app.js's `.onmessage`
// for the same event: seeing an event here means the page has it.
const SSE_SPY = `
window.__sse = [];
const Native = window.EventSource;
window.EventSource = class extends Native {
	constructor(...a) { super(...a); this.addEventListener("message", (ev) => { try { window.__sse.push(JSON.parse(ev.data)); } catch {} }); }
};
`;

// ── TCP relay in front of the desk, so the reconnect check can destroy the SSE
// socket at a chosen moment (nothing in the browser or in Playwright can end an
// established EventSource connection; `setOffline` leaves it up). Byte-for-byte
// pass-through apart from the authority in the Host/Origin headers, which the
// desk's loopback rules check against the port it bound — the relay port has the
// same digit count so no Content-Length shifts.
const RELAY_PORT = DESK + 1;
if (String(RELAY_PORT).length !== String(DESK).length) throw new Error("relay port must have the same digit count as the desk port");
const RELAY = `http://127.0.0.1:${RELAY_PORT}`;
const sseSockets = new Set();
const relay = net.createServer((client) => {
	const up = net.connect(DESK, "127.0.0.1");
	const bye = () => { sseSockets.delete(client); client.destroy(); up.destroy(); };
	client.on("data", (c) => {
		const s = c.toString("latin1");
		if (/^GET [^\r\n ]*\/events[ ?]/m.test(s)) sseSockets.add(client);
		up.write(Buffer.from(s.split(`127.0.0.1:${RELAY_PORT}`).join(`127.0.0.1:${DESK}`), "latin1"));
	});
	up.on("data", (c) => client.write(c));
	for (const ev of ["close", "error", "end"]) { client.on(ev, bye); up.on(ev, bye); }
});
await new Promise((r) => relay.listen(RELAY_PORT, "127.0.0.1", r));
const killSse = () => { for (const s of [...sseSockets]) { sseSockets.delete(s); s.destroy(); } };

const spawnSession = (cwd, name) =>
	fetch(`${BASE}/api/spawn`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cwd, name }) }).then((r) => r.json());

const newPage = async (ctx) => {
	const page = await ctx.newPage();
	await page.addInitScript(SSE_SPY);
	page.on("pageerror", (e) => { console.log("FAIL page error:", e.message); fails++; });
	return page;
};
// pick the rail row whose label is this session's marker
const openByMark = async (page, mark) => {
	await page.waitForFunction((m) => [...document.querySelectorAll("#live-list .live-row .cwd")].some((c) => c.textContent === m), mark, { timeout: 15000 });
	await page.click(`#live-list .live-row:has(.cwd:text-is("${mark}"))`);
	await page.waitForSelector("#input", { state: "visible", timeout: 5000 });
};
const rpcType = (route) => { try { return route.request().postDataJSON()?.command?.type; } catch { return null; } };

try {
	for (let i = 0; i < 60; i++) {
		try { await fetch(`${BASE}/api/live`); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 59) throw new Error(`desk server never came up: ${log}`);
	}
	const a = await spawnSession(cwdA, "alpha");
	const b = await spawnSession(cwdB, "bravo");
	const c = await spawnSession(cwdC, "charlie");
	if (!a.id || !b.id || !c.id) throw new Error(`spawn failed: ${JSON.stringify([a, b, c])} ${log}`);

	browser = await chromium.launch();
	const ctx = await browser.newContext();

	// ── 1. switch mid-resync ───────────────────────────────────────────────────
	{
		const page = await newPage(ctx);
		let release = null;
		let held = 0;
		await page.route(`**/api/session/${a.id}/rpc`, async (route) => {
			if (rpcType(route) === "get_messages" && held++ === 0) {
				const resp = await route.fetch();
				await new Promise((r) => (release = r)); // hold A's answer
				return route.fulfill({ response: resp });
			}
			return route.continue();
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await openByMark(page, "bravo");
		await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-bravo"), null, { timeout: 10000 });
		release();
		// give the released continuation every chance to paint before we look
		await page.waitForFunction(() => document.querySelectorAll("#transcript .msg.user").length >= 1);
		await page.waitForTimeout(500);
		const t = await page.evaluate(() => ({
			text: document.querySelector("#transcript").textContent,
			users: document.querySelectorAll("#transcript .msg.user").length,
			name: document.getElementById("sess-name").textContent,
		}));
		check("switch mid-resync: the new pane shows the new session", t.text.includes("marker-bravo"), t.text.slice(0, 120));
		check("switch mid-resync: the old session's messages never appear", !t.text.includes("marker-alpha"), t.text.slice(0, 120));
		check("switch mid-resync: exactly one user bubble", t.users === 1, String(t.users));
		check("switch mid-resync: the header still names the new session", t.name === "bravo", t.name);
		await page.close();
	}

	// ── 2. reconnect ───────────────────────────────────────────────────────────
	// Through the TCP relay, so the SSE socket can be destroyed for real at a
	// moment the test picks: the browser's own EventSource then reconnects to the
	// real server and gets a real second desk_hello.
	{
		const page = await newPage(ctx);
		let getMessages = 0;
		await page.route(`**/api/session/${c.id}/rpc`, async (route) => {
			if (rpcType(route) === "get_messages") getMessages++;
			try { await route.continue(); } catch {} // the socket may be gone mid-flight
		});
		await page.goto(RELAY);
		await openByMark(page, "charlie");
		await page.waitForSelector("#dialogs .dialog", { timeout: 10000 });
		await page.waitForFunction(() => document.querySelectorAll("#status-chips .status-chip").length === 1, null, { timeout: 10000 });
		await page.waitForFunction(() => document.getElementById("chip")?.textContent === "idle", null, { timeout: 10000 });
		const before = getMessages;

		killSse();
		await page.waitForFunction(() => document.getElementById("chip")?.textContent === "disconnected", null, { timeout: 20000 });
		// the reconnect is the SECOND desk_hello on this page
		await page.waitForFunction(() => window.__sse.filter((e) => e.type === "desk_hello").length >= 2, null, { timeout: 30000 });
		await page.waitForTimeout(1000); // let every hello-driven continuation land

		const r = await page.evaluate(() => ({
			dialogs: document.querySelectorAll("#dialogs .dialog").length,
			chips: document.querySelectorAll("#status-chips .status-chip").length,
			chip: document.getElementById("chip")?.textContent,
			hellos: window.__sse.filter((e) => e.type === "desk_hello").length,
			users: document.querySelectorAll("#transcript .msg.user").length,
		}));
		check("reconnect: exactly one desk_hello replay", r.hellos === 2, String(r.hellos));
		check("reconnect: exactly one dialog node", r.dialogs === 1, String(r.dialogs));
		check("reconnect: exactly one status chip", r.chips === 1, String(r.chips));
		check("reconnect: exactly one transcript bubble", r.users === 1, String(r.users));
		check("reconnect: exactly one extra get_messages", getMessages - before === 1, `${getMessages - before}`);
		check("reconnect: the chip recovers from disconnected", r.chip === "idle", String(r.chip));
		await page.close();
	}

	// ── 3. bash: the child's output beats the POST that creates the row ────────
	{
		const page = await newPage(ctx);
		await page.route(`**/api/session/${a.id}/bash`, async (route) => {
			const resp = await route.fetch(); // the server has now handed the command to the child
			// hold the answer until the page has ALREADY seen the child's output
			// and its result — the interleaving under test
			await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_bash_result"), null, { timeout: 15000 });
			return route.fulfill({ response: resp });
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "!echo hi");
		await page.press("#input", "Enter");
		await page.waitForSelector(".bash-card", { timeout: 20000 });
		await page.waitForTimeout(500);
		const r = await page.evaluate(() => {
			const cards = [...document.querySelectorAll(".bash-card")];
			return {
				n: cards.length,
				out: cards[0]?.querySelector(".bout")?.textContent || "",
				mark: cards[0]?.querySelector(".mark")?.textContent || "",
				exit: cards[0]?.querySelector(".bexit")?.textContent || "",
			};
		});
		check("bash echo-first: exactly one row", r.n === 1, String(r.n));
		check("bash echo-first: output kept, in order", r.out === "chunk-one\nchunk-two\n", JSON.stringify(r.out));
		check("bash echo-first: the row is finished, not spinning", r.mark === "✓" && r.exit === "exit 0", `${r.mark} ${r.exit}`);
		await page.close();
	}

	// ── 4a. prompt: the echo beats the fetch → one bubble ──────────────────────
	{
		const page = await newPage(ctx);
		await page.route(`**/api/session/${a.id}/prompt`, async (route) => {
			const resp = await route.fetch();
			await page.waitForFunction(() => window.__sse.some((e) => e.type === "message_end" && e.message?.role === "user"), null, { timeout: 15000 });
			return route.fulfill({ response: resp });
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "hello there");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "message_end"), null, { timeout: 20000 });
		await page.waitForTimeout(500);
		const n = await page.evaluate(() => [...document.querySelectorAll("#transcript .msg.user")].filter((e) => e.textContent.includes("hello there")).length);
		check("prompt echo-beats-fetch: exactly one bubble", n === 1, String(n));
		await page.close();
	}

	// ── 4b. prompt: the response is LOST after pi already echoed ───────────────
	{
		const page = await newPage(ctx);
		await page.route(`**/api/session/${a.id}/prompt`, async (route) => {
			await route.fetch(); // the child gets it and echoes
			await page.waitForFunction(() => window.__sse.some((e) => e.type === "message_end" && e.message?.role === "user"), null, { timeout: 15000 });
			return route.abort("connectionreset"); // ...and the answer never arrives
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "accepted but unanswered");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "message_end"), null, { timeout: 20000 });
		await page.waitForTimeout(700);
		const r = await page.evaluate(() => ({
			bubbles: [...document.querySelectorAll("#transcript .msg.user")].filter((e) => e.textContent.includes("accepted but unanswered")).length,
			input: document.getElementById("input").value,
		}));
		check("prompt lost-response: exactly one bubble", r.bubbles === 1, String(r.bubbles));
		check("prompt lost-response: the accepted text is NOT pushed back into the editor", r.input === "", JSON.stringify(r.input));
		await page.close();
	}

	// ── 4c. prompt: a genuine rejection still restores the text ────────────────
	{
		const page = await newPage(ctx);
		await page.route(`**/api/session/${a.id}/prompt`, (route) =>
			route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ ok: false, error: "nope" }) }));
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "will be refused");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => document.getElementById("input").value === "will be refused", null, { timeout: 10000 }).catch(() => {});
		const r = await page.evaluate(() => ({
			bubbles: [...document.querySelectorAll("#transcript .msg.user")].filter((e) => e.textContent.includes("will be refused")).length,
			input: document.getElementById("input").value,
		}));
		check("prompt rejected: the text is restored to the editor", r.input === "will be refused", JSON.stringify(r.input));
		check("prompt rejected: the optimistic bubble is removed", r.bubbles === 0, String(r.bubbles));
		await page.close();
	}

	// ── 4d. prompt rejected AFTER a session switch ─────────────────────────────
	{
		const page = await newPage(ctx);
		let release = null;
		await page.route(`**/api/session/${a.id}/prompt`, async (route) => {
			await new Promise((r) => (release = r));
			return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ ok: false, error: "nope" }) });
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "alpha text");
		await page.press("#input", "Enter");
		for (let i = 0; i < 100 && !release; i++) await page.waitForTimeout(100); // the POST is in the route handler
		if (!release) throw new Error("the prompt POST was never intercepted");
		await openByMark(page, "bravo");
		await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-bravo"), null, { timeout: 10000 });
		release();
		await page.waitForTimeout(700);
		const r = await page.evaluate(() => ({
			input: document.getElementById("input").value,
			text: document.querySelector("#transcript").textContent,
		}));
		check("prompt rejected after a switch: the old text is not restored into the new editor", r.input === "", JSON.stringify(r.input));
		check("prompt rejected after a switch: the new pane is untouched", r.text.includes("marker-bravo") && !r.text.includes("alpha text"), r.text.slice(0, 120));
		await page.close();
	}

	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message, "\n--- server log ---\n", log.slice(-3000));
	die(3);
}
