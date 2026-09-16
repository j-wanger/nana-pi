// E2E: the desk page's async continuations must be tied to the session that
// started them, and a response can never arrive "too early" for the DOM node it
// belongs to. Real desk server + STUB pi (no model) + headless Chromium.
//
// Every interleaving here is CONTROLLED, not timed: `page.route()` holds the
// exact response under test until the test releases it, and the release point is
// a condition on what the page has already received — an SSE spy and a fetch
// spy installed by `addInitScript`. The SSE spy's listener is registered in the
// EventSource constructor, so it sees each event in the same dispatch as (and
// just before) app.js's own handler; the fetch spy resolves before the app's
// own `.then` chain on the same response. Ordering is therefore never a race.
// A NEGATIVE assertion ("A never appeared") additionally needs the losing
// continuation to have had its turn: each one first waits for that response to
// be consumed (the fetch spy), then a short bounded settle window. Those settle
// windows are the only waits in this file, they are marked `SETTLE`, and no
// POSITIVE outcome depends on one.
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
//      must not restore A's text into B's editor; (e) an EXPLICIT rejection that
//      arrives after a matching echo still restores — the server answering
//      "refused" outranks an echo that may be another client's.
//   5. Esc — reclaim then abort: the abort must carry the session Esc was
//      pressed in, never the one you switched to while clear_queue was pending.
//   6. bash result over the retention window — buffered and rendered clipped.
//   7. reconnect while a bash POST is held: the transcript is rebuilt under it,
//      so the POST claims no card and builds none from its buffer — it drops the
//      buffer and re-reads history once, which is where the card comes from.
//   8. a spawn whose response lands after you picked another stage must not
//      yank the stage back to the session it created.
//   9. an image whose FileReader finishes after a switch must not attach to the
//      session you moved to.
//  10. a rebuilt transcript is never claimed: a still-running command's later
//      output must not land on an older identical command's card.
//  11. a buffered DESK-side failure (bash timeout, dead child) — which history
//      cannot record — is said as a toast and pinned to no card.
//  12. an oversized error is bounded and reported, like an oversized output.
//  13. the retention window never opens on half a surrogate pair.
//  14. a stale slash-command rejection paints no toast.
//  15. repair reads asked for while one is running coalesce into exactly one
//      follow-up, however many asked.
//  16. the same coalescing holds for DIRECT callers of the read (a settled turn,
//      a reconnect), not only the repair path.
//  17. a command still RUNNING when the transcript is rebuilt: history has no
//      record of it yet, so the read finds nothing — the terminal event that
//      arrives later is what brings the finished card back.
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
const bashes = []; // finished bash executions, replayed by get_messages like pi does
let twiceDone = false;   // the twice command completes ONCE, then only ever runs
let pendingTwice = null; // the id of that second, never-answered run
let lingering = null;    // a run in flight, completed on demand
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
			case "get_messages": ok({ messages: [{ role: "user", content: [{ type: "text", text: "marker-" + MARK }] }, ...bashes] }); break;
			case "get_session_stats": ok({ tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, cost: 0, totalMessages: 1, contextUsage: null }); break;
			case "get_commands": ok({ commands: [] }); break;
			case "clear_queue": ok({ steering: [], followUp: [] }); break;
			// bash: stream a chunk and answer IMMEDIATELY — the server writes its
			// HTTP response only after handing us the command, so both of these can
			// beat the POST to the page
			case "bash": {
				// one command that finishes ONCE and afterwards only ever runs: the
				// second execution never reaches history, which is what makes an
				// identical older card unattributable
				if (/^twice/.test(cmd.command)) {
					if (twiceDone) { pendingTwice = cmd.id; break; }
					twiceDone = true;
					say({ type: "bash_execution_update", id: cmd.id, delta: "FIRST-RUN\\n" });
					bashes.push({ role: "bashExecution", command: cmd.command, output: "FIRST-RUN\\n", exitCode: 0 });
					say({ type: "response", id: cmd.id, success: true, data: { exitCode: 0 } });
					break;
				}
				// makes the still-running second twice produce output on demand
				if (/^poke/.test(cmd.command)) {
					if (pendingTwice) say({ type: "bash_execution_update", id: pendingTwice, delta: "SECOND-RUN\\n" });
					say({ type: "response", id: cmd.id, success: true, data: { exitCode: 0 } });
					break;
				}
				// never answers, never reaches history: a run still in flight
				if (/^hold/.test(cmd.command)) break;
				// lingers like a long command, then completes on demand — pi records
				// a run in history only when it FINISHES
				if (/^linger/.test(cmd.command)) { lingering = { id: cmd.id, command: cmd.command }; break; }
				if (/^finish/.test(cmd.command)) {
					if (lingering) {
						bashes.push({ role: "bashExecution", command: lingering.command, output: "LINGER-DONE\\n", exitCode: 0 });
						say({ type: "response", id: lingering.id, success: true, data: { output: "LINGER-DONE\\n", exitCode: 0 } });
						lingering = null;
					}
					say({ type: "response", id: cmd.id, success: true, data: { exitCode: 0 } });
					break;
				}
				// makes the page resync the way a finished turn does
				if (/^settle/.test(cmd.command)) {
					bashes.push({ role: "bashExecution", command: cmd.command, output: "", exitCode: 0 });
					say({ type: "response", id: cmd.id, success: true, data: { exitCode: 0 } });
					say({ type: "agent_settled" });
					break;
				}
				// history records the RUN (exit 0); the transport fails separately
				if (/^failing/.test(cmd.command)) {
					bashes.push({ role: "bashExecution", command: cmd.command, output: "partial\\n", exitCode: 0 });
					say({ type: "response", id: cmd.id, success: false, error: "bash timeout" });
					break;
				}
				if (/^bigerr/.test(cmd.command)) {
					say({ type: "response", id: cmd.id, success: false, error: "e".repeat(50000) });
					break;
				}
				if (/^emoji/.test(cmd.command)) {
					// 25 000 astral characters plus one BMP char: the 20 000-unit cut
					// lands between the halves of a surrogate pair
					say({ type: "response", id: cmd.id, success: true, data: { output: "\u{1F600}".repeat(25000) + "A", exitCode: 0 } });
					break;
				}
				if (/^big/.test(cmd.command)) {
					const big = "x".repeat(50000);
					bashes.push({ role: "bashExecution", command: cmd.command, output: big, exitCode: 0 });
					say({ type: "response", id: cmd.id, success: true, data: { output: big, exitCode: 0 } });
					break;
				}
				say({ type: "bash_execution_update", id: cmd.id, delta: "chunk-one\\n" });
				say({ type: "bash_execution_update", id: cmd.id, delta: "chunk-two\\n" });
				// pi records the finished command in its own history too, which is
				// what a resync replays
				bashes.push({ role: "bashExecution", command: cmd.command, output: "chunk-one\\nchunk-two\\n", exitCode: 0 });
				say({ type: "response", id: cmd.id, success: true, data: { exitCode: 0 } });
				break;
			}
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

// detached: its own process GROUP, so teardown can signal the desk AND the pi
// children it spawned — a SIGKILL to the desk alone orphans them (it never gets
// to run its own shutdown).
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
// Awaited teardown: the next test file must not race this server's port release.
const die = async (code) => {
	try { await browser?.close(); } catch {}
	killSse();
	await new Promise((r) => relay.close(r));
	if (server.exitCode === null && server.signalCode === null) {
		const gone = new Promise((r) => server.once("exit", () => r("exit")));
		signalTree("SIGTERM");
		// SIGTERM lets the desk tear its children down; if it will not go, SIGKILL
		// the whole group and WAIT for the exit — exiting on a timeout is what
		// orphans a desk and its pi children.
		if ((await Promise.race([gone, new Promise((r) => setTimeout(() => r("timeout"), 5000))])) === "timeout") {
			signalTree("SIGKILL");
			await gone;
		}
	}
	fs.rmSync(tmp, { recursive: true, force: true });
	process.exit(code);
};

// A route callback that throws (a page closed under it, a wait that expires)
// would otherwise take the process down BEFORE die() runs — leaking this test's
// desk server and its pi children into the machine. Route every exit through die.
let dying = false;
for (const ev of ["uncaughtException", "unhandledRejection"]) {
	process.on(ev, (e) => {
		if (dying) return;
		dying = true;
		console.error(`E2E ${ev}:`, e?.message || e);
		die(3);
	});
}

// Records every SSE event the page's own EventSource delivers. The listener is
// registered inside the constructor, so it runs BEFORE app.js's `.onmessage`
// for the same event: seeing an event here means the page has it.
const SSE_SPY = `
window.__sse = [];
const Native = window.EventSource;
window.EventSource = class extends Native {
	constructor(...a) { super(...a); this.addEventListener("message", (ev) => { try { window.__sse.push(JSON.parse(ev.data)); } catch {} }); }
};
// Every response the page receives, recorded before app.js's own .then runs on
// it: "this response has been delivered" is then a fact, not a guess.
window.__fetched = [];
const nativeFetch = window.fetch;
window.fetch = (...a) => nativeFetch(...a).then((r) => { window.__fetched.push(String(r.url)); return r; });
`;
const SETTLE = 400; // see the header: bounded window before a negative assertion only

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
// A reconnect's history read is a POSITIVE fact to wait on, and "the transcript
// was rebuilt" is what it means: renderMessages() replaces every node in the
// pane. Mark the first bubble before the SSE is cut and wait for a bubble that
// does not carry the mark. Waiting on a card COUNT (or on any /rpc response)
// was satisfied by the pre-reconnect pane, so the held POST could be released
// before the read had answered — the server only needs a few ms of other work
// (a git-backed /changes GET rides the same hello) to lose that race.
const markPane = (page) => page.evaluate(() => { const m = document.querySelector("#transcript .msg"); if (m) m.dataset.pre = "1"; return !!m; });
const waitRebuilt = (page) => page.waitForFunction(() => { const m = document.querySelector("#transcript .msg"); return !!m && !m.dataset.pre; }, null, { timeout: 20000 });
const killSse = () => { for (const s of [...sseSockets]) { sseSockets.delete(s); s.destroy(); } };

const spawnSession = (cwd, name) =>
	fetch(`${BASE}/api/spawn`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cwd, name }) }).then((r) => r.json());

// Drop route handlers BEFORE closing: a handler still parked on a wait would
// throw TargetClosedError into the process.
const closePage = async (page) => {
	await page.unrouteAll({ behavior: "ignoreErrors" }).catch(() => {});
	await page.close();
};
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
// The transcript replays pi's earlier bash history, so a check must name the
// card it means rather than taking the first or the last one.
const bashCard = (page, command) => page.evaluate((c) => {
	const cards = [...document.querySelectorAll(".bash-card")].filter((r) => r.querySelector(".bcmd").textContent === `! ${c}`);
	const card = cards[cards.length - 1];
	return {
		n: cards.length,
		total: document.querySelectorAll(".bash-card").length,
		out: card?.querySelector(".bout")?.textContent ?? null,
		mark: card?.querySelector(".mark")?.textContent ?? null,
		exit: card?.querySelector(".bexit")?.textContent ?? null,
	};
}, command);

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
		const rpcUrl = `/api/session/${a.id}/rpc`;
		const seen = await page.evaluate((u) => window.__fetched.filter((x) => x.includes(u)).length, rpcUrl);
		release();
		// fence: A's held answer has been DELIVERED to the page, so its
		// continuation has run or is one microtask away — then SETTLE
		await page.waitForFunction(
			([u, n]) => window.__fetched.filter((x) => x.includes(u)).length > n, [rpcUrl, seen], { timeout: 10000 });
		await page.waitForTimeout(SETTLE);
		const t = await page.evaluate(() => ({
			text: document.querySelector("#transcript").textContent,
			users: document.querySelectorAll("#transcript .msg.user").length,
			name: document.getElementById("sess-name").textContent,
		}));
		check("switch mid-resync: the new pane shows the new session", t.text.includes("marker-bravo"), t.text.slice(0, 120));
		check("switch mid-resync: the old session's messages never appear", !t.text.includes("marker-alpha"), t.text.slice(0, 120));
		check("switch mid-resync: exactly one user bubble", t.users === 1, String(t.users));
		check("switch mid-resync: the header still names the new session", t.name === "bravo", t.name);
		await closePage(page);
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
		// the resync this hello triggers is a positive fact: wait for the chip it
		// restores, then SETTLE before counting (the count is a negative claim:
		// "no SECOND resync")
		await page.waitForFunction(() => document.getElementById("chip")?.textContent === "idle", null, { timeout: 15000 });
		await page.waitForTimeout(SETTLE);

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
		await closePage(page);
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
		// positive: the finished card for THIS command exists. No delay decides it.
		await page.waitForFunction(() => [...document.querySelectorAll(".bash-card")].some((c) => c.querySelector(".bcmd").textContent === "! echo hi" && c.querySelector(".bexit").textContent), null, { timeout: 25000 });
		await page.waitForTimeout(SETTLE); // "exactly one row" is a negative claim
		const r = await bashCard(page, "echo hi");
		check("bash echo-first: exactly one row", r.n === 1, String(r.n));
		check("bash echo-first: output kept, in order", r.out === "chunk-one\nchunk-two\n", JSON.stringify(r.out));
		check("bash echo-first: the row is finished, not spinning", r.mark === "✓" && r.exit === "exit 0", `${r.mark} ${r.exit}`);
		await closePage(page);
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
		await page.waitForFunction(() => window.__fetched.some((u) => u.includes("/prompt")), null, { timeout: 20000 });
		await page.waitForTimeout(SETTLE); // "exactly one bubble" is a negative claim
		const n = await page.evaluate(() => [...document.querySelectorAll("#transcript .msg.user")].filter((e) => e.textContent.includes("hello there")).length);
		check("prompt echo-beats-fetch: exactly one bubble", n === 1, String(n));
		await closePage(page);
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
		// the POST is aborted, so nothing positive marks the rejection landing:
		// SETTLE is the fence for "the editor was NOT refilled"
		await page.waitForTimeout(SETTLE * 2);
		const r = await page.evaluate(() => ({
			bubbles: [...document.querySelectorAll("#transcript .msg.user")].filter((e) => e.textContent.includes("accepted but unanswered")).length,
			input: document.getElementById("input").value,
		}));
		check("prompt lost-response: exactly one bubble", r.bubbles === 1, String(r.bubbles));
		check("prompt lost-response: the accepted text is NOT pushed back into the editor", r.input === "", JSON.stringify(r.input));
		await closePage(page);
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
		await closePage(page);
	}

	// ── 4d. prompt rejected AFTER a session switch ─────────────────────────────
	{
		const page = await newPage(ctx);
		let release = null;
		let entered = null;
		const intercepted = new Promise((r) => (entered = r));
		await page.route(`**/api/session/${a.id}/prompt`, async (route) => {
			entered();
			await new Promise((r) => (release = r));
			return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ ok: false, error: "nope" }) });
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "alpha text");
		await page.press("#input", "Enter");
		await intercepted; // the POST is now parked in the route handler
		await openByMark(page, "bravo");
		await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-bravo"), null, { timeout: 10000 });
		release();
		await page.waitForFunction(() => window.__fetched.some((u) => u.includes("/prompt")), null, { timeout: 10000 });
		await page.waitForTimeout(SETTLE); // both claims below are negative
		const r = await page.evaluate(() => ({
			input: document.getElementById("input").value,
			text: document.querySelector("#transcript").textContent,
		}));
		check("prompt rejected after a switch: the old text is not restored into the new editor", r.input === "", JSON.stringify(r.input));
		check("prompt rejected after a switch: the new pane is untouched", r.text.includes("marker-bravo") && !r.text.includes("alpha text"), r.text.slice(0, 120));
		await closePage(page);
	}

	// ── 4e. an EXPLICIT rejection that arrives after a matching echo ───────────
	// The echo proves only that SOME client's message of that text was accepted;
	// the server answering "refused" proves ours was not. The text must come back.
	{
		const page = await newPage(ctx);
		const MSG = "explicitly refused";
		await page.route(`**/api/session/${a.id}/prompt`, async (route) => {
			await route.fetch(); // the child gets it and echoes
			await page.waitForFunction((m) => window.__sse.some((e) => e.type === "message_end" && e.message?.role === "user" && e.message.content?.[0]?.text === m), MSG, { timeout: 15000 });
			return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ ok: false, error: "nope" }) });
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", MSG);
		await page.press("#input", "Enter");
		await page.waitForFunction((m) => document.getElementById("input").value === m, MSG, { timeout: 15000 }).catch(() => {});
		const r = await page.evaluate((m) => ({
			input: document.getElementById("input").value,
			bubbles: [...document.querySelectorAll("#transcript .msg.user")].filter((e) => e.textContent.includes(m)).length,
		}), MSG);
		check("prompt explicitly rejected after an echo: the text is restored", r.input === MSG, JSON.stringify(r.input));
		check("prompt explicitly rejected after an echo: the echoed bubble is left alone", r.bubbles === 1, String(r.bubbles));
		await closePage(page);
	}

	// ── 5. Esc: reclaim, then abort the session Esc was pressed in ─────────────
	{
		const page = await newPage(ctx);
		let release = null;
		let entered = null;
		const intercepted = new Promise((r) => (entered = r));
		const aborts = {};
		await page.route("**/api/session/*/abort", (route) => {
			const m = route.request().url().match(/\/api\/session\/(\w+)\/abort/);
			if (m) aborts[m[1]] = (aborts[m[1]] || 0) + 1;
			return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
		});
		await page.route(`**/api/session/${a.id}/rpc`, async (route) => {
			if (rpcType(route) === "clear_queue") {
				const resp = await route.fetch();
				entered();
				await new Promise((r) => (release = r)); // hold A's reclaim
				return route.fulfill({ response: resp });
			}
			return route.continue();
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.press("#input", "Escape");
		await intercepted; // Esc is now parked on A's clear_queue
		await openByMark(page, "bravo");
		await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-bravo"), null, { timeout: 10000 });
		const rpcUrl = `/api/session/${a.id}/rpc`;
		const seen = await page.evaluate((u) => window.__fetched.filter((x) => x.includes(u)).length, rpcUrl);
		release();
		await page.waitForFunction(([u, n]) => window.__fetched.filter((x) => x.includes(u)).length > n, [rpcUrl, seen], { timeout: 10000 });
		await page.waitForTimeout(SETTLE); // "no abort for B" is a negative claim
		check("Esc mid-reclaim: the session you switched to is never aborted", !aborts[b.id], String(aborts[b.id] || 0));
		await closePage(page);
	}

	// ── 6. a bash result larger than the retention window ──────────────────────
	{
		const page = await newPage(ctx);
		await page.route(`**/api/session/${a.id}/bash`, async (route) => {
			const resp = await route.fetch();
			await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_bash_result"), null, { timeout: 15000 });
			return route.fulfill({ response: resp }); // the result was buffered, not rendered
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "!big output");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => [...document.querySelectorAll(".bash-card")].some((c) => c.querySelector(".bcmd").textContent === "! big output" && c.querySelector(".bexit").textContent), null, { timeout: 25000 });
		const r = await bashCard(page, "big output");
		check("buffered oversized result: retained and rendered within the window", r.out?.length === 20000, String(r.out?.length));
		check("buffered oversized result: the cut is reported", /truncated/.test(r.exit || ""), String(r.exit));
		await closePage(page);
	}

	// ── 7. reconnect while the bash POST is held → history wins, no row built ──
	// Through the relay: the resync the reconnect triggers brings back pi's own
	// FINISHED record of the command while the POST is still parked. The page
	// must not build a second card from its buffer — it drops it and re-reads.
	{
		const page = await newPage(ctx);
		let getMessages = 0;
		let before = 0;
		await page.route(`**/api/session/${b.id}/rpc`, async (route) => {
			if (rpcType(route) === "get_messages") getMessages++;
			try { await route.continue(); } catch {}
		});
		await page.route(`**/api/session/${b.id}/bash`, async (route) => {
			const resp = await route.fetch();
			await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_bash_result"), null, { timeout: 15000 });
			await markPane(page);
			killSse();
			await page.waitForFunction(() => window.__sse.filter((e) => e.type === "desk_hello").length >= 2, null, { timeout: 30000 });
			// the resync brought pi's own finished record of this command back
			await waitRebuilt(page);
			await page.waitForFunction(() => document.querySelectorAll(".bash-card").length === 1, null, { timeout: 20000 });
			before = getMessages; // count the repair resync only, from the release on
			return route.fulfill({ response: resp });
		});
		await page.goto(RELAY);
		await openByMark(page, "bravo");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "!echo hi");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => window.__fetched.some((u) => u.includes("/bash")), null, { timeout: 40000 });
		// the repair resync is the positive fact to wait on; SETTLE then guards the
		// negative ones ("no second card", "no second repair")
		for (let i = 0; i < 400 && getMessages === before; i++) await page.waitForTimeout(50);
		await page.waitForTimeout(SETTLE);
		const r = await bashCard(page, "echo hi");
		check("bash + reconnect: exactly one row, from history", r.n === 1 && r.total === 1, `${r.n}/${r.total}`);
		check("bash + reconnect: history's output stands, once", r.out === "chunk-one\nchunk-two\n", JSON.stringify(r.out));
		check("bash + reconnect: one repair resync", getMessages - before === 1, String(getMessages - before));
		await closePage(page);
	}

	// ── 8. a spawn whose response lands after you picked another stage ─────────
	{
		const page = await newPage(ctx);
		let release = null;
		let entered = null;
		const intercepted = new Promise((r) => (entered = r));
		await page.route("**/api/spawn", async (route) => {
			const resp = await route.fetch(); // the session really is created
			entered();
			await new Promise((r) => (release = r));
			return route.fulfill({ response: resp });
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		const railBefore = await page.evaluate(() => document.querySelectorAll("#live-list .live-row").length);
		await page.click("#btn-spawn");
		await page.waitForSelector("#popover .path-row input", { timeout: 10000 });
		await page.waitForFunction(() => document.querySelector("#popover .path-row input")?.value?.length > 0, null, { timeout: 15000 });
		await page.click('#popover button:text-is("Open here")');
		await intercepted; // the spawn POST is parked
		await openByMark(page, "bravo");
		await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-bravo"), null, { timeout: 10000 });
		release();
		await page.waitForFunction(() => window.__fetched.some((u) => u.includes("/api/spawn")), null, { timeout: 15000 });
		await page.waitForFunction((n) => document.querySelectorAll("#live-list .live-row").length > n, railBefore, { timeout: 30000 });
		await page.waitForTimeout(SETTLE); // "the stage did NOT change" is a negative claim
		const r = await page.evaluate(() => ({
			name: document.getElementById("sess-name").textContent,
			text: document.querySelector("#transcript").textContent,
		}));
		check("late spawn response: the stage you chose is kept", r.name === "bravo" && r.text.includes("marker-bravo"), `${r.name} · ${r.text.slice(0, 60)}`);
		await closePage(page);
	}

	// ── 9. an image whose FileReader finishes after a session switch ───────────
	// FileReader is the transport here, so the test substitutes it the way
	// page.route substitutes fetch: the app's own addImageFile still runs, and
	// the test decides when onload fires.
	{
		const page = await ctx.newPage();
		await page.addInitScript(SSE_SPY);
		await page.addInitScript(`
			window.__fr = [];
			window.FileReader = class {
				readAsDataURL() { window.__fr.push(() => { this.result = "data:image/png;base64,AAAA"; this.onload?.(); }); }
			};
			window.__fireFr = () => { for (const f of window.__fr.splice(0)) f(); };
		`);
		page.on("pageerror", (e) => { console.log("FAIL page error:", e.message); fails++; });
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.evaluate(() => {
			const dt = new DataTransfer();
			dt.items.add(new File([new Uint8Array([1, 2, 3])], "shot.png", { type: "image/png" }));
			document.getElementById("composer").dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
		});
		await page.waitForFunction(() => window.__fr.length === 1, null, { timeout: 10000 });
		await openByMark(page, "bravo");
		await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-bravo"), null, { timeout: 10000 });
		await page.evaluate(() => window.__fireFr());
		await page.waitForTimeout(SETTLE); // "no attachment on B" is a negative claim
		const n = await page.evaluate(() => document.querySelectorAll("#attachments .att-chip").length);
		check("late image read: the attachment does not land on the session you switched to", n === 0, String(n));
		await closePage(page);
	}

	// ── 10. a rebuilt transcript never gets the running command's output ──────
	// History holds a finished run of this command; a SECOND run of it is still
	// going (it never reaches history) when an unrelated resync rebuilds the
	// transcript. No card on the page can be identified as the running run's, so
	// none is claimed — its later output must not land on the old run's card.
	{
		const page = await newPage(ctx);
		let getMessages = 0;
		await page.route(`**/api/session/${c.id}/rpc`, async (route) => {
			if (rpcType(route) === "get_messages") getMessages++;
			try { await route.continue(); } catch {}
		});
		let release = null;
		let entered = null;
		const intercepted = new Promise((r) => (entered = r));
		let holdNext = false;
		await page.route(`**/api/session/${c.id}/bash`, async (route) => {
			if (!holdNext) return route.continue();
			holdNext = false;
			const resp = await route.fetch();
			entered();
			await new Promise((r) => (release = r));
			return route.fulfill({ response: resp });
		});
		await page.goto(RELAY);
		await openByMark(page, "charlie");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		// dismiss charlie's dialog: it covers the composer
		await page.click("#dialogs .dialog .dialog-opt.quiet");
		// 1st run finishes and enters history
		await page.fill("#input", "!twice");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => [...document.querySelectorAll(".bash-card")].some((r) => /FIRST-RUN/.test(r.textContent)), null, { timeout: 20000 });
		// 2nd run: held POST, and it never finishes on the child
		holdNext = true;
		await page.fill("#input", "!twice");
		await page.press("#input", "Enter");
		await intercepted;
		// an unrelated rebuild: the reconnect resync replays only the FIRST run
		await markPane(page);
		killSse();
		await page.waitForFunction(() => window.__sse.filter((e) => e.type === "desk_hello").length >= 2, null, { timeout: 30000 });
		await waitRebuilt(page);
		await page.waitForFunction(() => document.querySelectorAll(".bash-card").length === 1, null, { timeout: 20000 });
		const before = getMessages;
		release();
		await page.waitForFunction(() => window.__fetched.some((u) => u.includes("/bash")), null, { timeout: 20000 });
		for (let i = 0; i < 400 && getMessages === before; i++) await page.waitForTimeout(50); // the repair resync
		await page.waitForTimeout(SETTLE); // "and no second repair" is a negative claim
		// now make the still-running command speak
		await page.fill("#input", "!poke");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => [...document.querySelectorAll(".bash-card")].some((r) => /! poke/.test(r.textContent)), null, { timeout: 20000 });
		await page.waitForTimeout(SETTLE); // every claim below is negative
		const r = await bashCard(page, "twice");
		check("rebuilt transcript: the running command's output never lands on the older card", !/SECOND-RUN/.test(r.out || ""), JSON.stringify(r.out));
		check("rebuilt transcript: no duplicate card for the command", r.n === 1, String(r.n));
		check("rebuilt transcript: exactly one repair resync", getMessages - before === 1, String(getMessages - before));
		await closePage(page);
	}

	// ── 11. a buffered transport failure is SAID, not pinned to a card ────────
	// History records the RUN (exit 0). A `desk_bash_result` that failed at the
	// desk (a timeout, a dead child) is about the request, not the run, and no
	// card on the page can be identified as this run's — so it is surfaced as a
	// toast and no card is marked failed.
	{
		const page = await newPage(ctx);
		await page.route(`**/api/session/${b.id}/bash`, async (route) => {
			const resp = await route.fetch();
			await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_bash_result"), null, { timeout: 15000 });
			killSse();
			await page.waitForFunction(() => window.__sse.filter((e) => e.type === "desk_hello").length >= 2, null, { timeout: 30000 });
			await page.waitForFunction(() => [...document.querySelectorAll(".bash-card")].some((r) => /! failing/.test(r.textContent)), null, { timeout: 20000 });
			return route.fulfill({ response: resp });
		});
		await page.goto(RELAY);
		await openByMark(page, "bravo");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "!failing now");
		await page.press("#input", "Enter");
		// positive: the toast appears. No delay decides it — and a missing one is
		// an assertion failure below, not an aborted file.
		await page.waitForFunction(() => /bash timeout/.test(document.getElementById("toasts").textContent), null, { timeout: 40000 }).catch(() => {});
		await page.waitForTimeout(SETTLE); // the card claims below are negative
		const r = await bashCard(page, "failing now");
		const toasts = await page.evaluate(() => [...document.querySelectorAll("#toasts .toast")].map((t) => t.textContent));
		check("buffered failure: exactly one toast naming the command and the error",
			toasts.filter((t) => /^bash: failing now — bash timeout$/.test(t)).length === 1, JSON.stringify(toasts));
		check("buffered failure: no card is marked failed", r.mark === "✓", String(r.mark));
		check("buffered failure: no duplicate row for the command", r.n === 1, `${r.n}/${r.total}`);
		await closePage(page);
	}

	// ── 12. an oversized ERROR is bounded like output is ───────────────────────
	{
		const page = await newPage(ctx);
		await page.route(`**/api/session/${a.id}/bash`, async (route) => {
			const resp = await route.fetch();
			await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_bash_result"), null, { timeout: 15000 });
			return route.fulfill({ response: resp }); // the failure was buffered, not rendered
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "!bigerr now");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => [...document.querySelectorAll(".bash-card")].some((c) => c.querySelector(".bcmd").textContent === "! bigerr now" && c.querySelector(".bexit").textContent), null, { timeout: 25000 });
		const r = await bashCard(page, "bigerr now");
		const errLen = (r.exit || "").replace(" · truncated", "").length;
		check("buffered oversized error: retained and rendered within the window", errLen === 20000, String(errLen));
		check("buffered oversized error: the cut is reported", / · truncated$/.test(r.exit || ""), String(r.exit).slice(-20));
		await closePage(page);
	}

	// ── 13. the cut never splits a surrogate pair ─────────────────────────────
	{
		const page = await newPage(ctx);
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "!emoji wall");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => [...document.querySelectorAll(".bash-card")].some((r) => /! emoji wall/.test(r.textContent) && r.querySelector(".bexit").textContent), null, { timeout: 25000 });
		const r = await bashCard(page, "emoji wall");
		const first = (r.out || "").charCodeAt(0);
		check("surrogate-safe cut: the window does not open on half a character", !(first >= 0xdc00 && first <= 0xdfff), `U+${first.toString(16)}`);
		check("surrogate-safe cut: still within the window", (r.out || "").length <= 20000, String((r.out || "").length));
		await closePage(page);
	}

	// ── 14. a stale command rejection paints nothing ──────────────────────────
	{
		const page = await newPage(ctx);
		let release = null;
		let entered = null;
		const intercepted = new Promise((r) => (entered = r));
		await page.route(`**/api/session/${a.id}/rpc`, async (route) => {
			if (rpcType(route) === "get_available_models") {
				entered();
				await new Promise((r) => (release = r));
				return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ error: "boom-stale-toast" }) });
			}
			return route.continue();
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "/model sonnet");
		await page.press("#input", "Enter");
		await intercepted;
		await openByMark(page, "bravo");
		await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-bravo"), null, { timeout: 10000 });
		release();
		await page.waitForFunction(() => window.__fetched.some((u) => u.includes("/rpc")), null, { timeout: 10000 });
		await page.waitForTimeout(SETTLE * 2); // "no toast appeared" is a negative claim
		const t = await page.evaluate(() => document.getElementById("toasts").textContent);
		check("stale command rejection: nothing is painted on the session you switched to", !t.includes("boom-stale-toast"), JSON.stringify(t.slice(0, 80)));
		await closePage(page);
	}

	// ── 15. repair resyncs coalesce around a running one ──────────────────────
	// Two POSTs come back while a resync is already in flight. That resync began
	// BEFORE either of them asked, so it cannot answer them — but the two of them
	// together are worth exactly ONE follow-up, not one each.
	{
		const page = await newPage(ctx);
		let gm = 0;
		let holdGm = false;
		let gmParked = null;
		let releaseGm = null;
		await page.route(`**/api/session/${a.id}/rpc`, async (route) => {
			if (rpcType(route) !== "get_messages") return route.continue();
			gm++;
			if (!holdGm) return route.continue();
			holdGm = false;
			const resp = await route.fetch();
			gmParked();
			await new Promise((r) => (releaseGm = r));
			return route.fulfill({ response: resp });
		});
		const parked = [];
		await page.route(`**/api/session/${a.id}/bash`, async (route) => {
			if (!/"command":"hold/.test(route.request().postData() || "")) return route.continue();
			const resp = await route.fetch();
			await new Promise((r) => parked.push(r));
			return route.fulfill({ response: resp });
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		for (const cmd of ["!hold1", "!hold2"]) {
			await page.fill("#input", cmd);
			await page.press("#input", "Enter");
		}
		for (let i = 0; i < 200 && parked.length < 2; i++) await page.waitForTimeout(50);
		if (parked.length < 2) throw new Error("both bash POSTs never parked");

		// a COMPLETED resync first, so both parked POSTs are in the rebuilt-transcript case
		const seen = gm;
		await page.fill("#input", "!settle a");
		await page.press("#input", "Enter");
		for (let i = 0; i < 400 && gm === seen; i++) await page.waitForTimeout(50);
		// the card can only come from history now, which proves the render landed
		await page.waitForFunction(() => [...document.querySelectorAll(".bash-card")].some((c) => c.querySelector(".bcmd").textContent === "! settle a"), null, { timeout: 20000 });
		// let anything this phase started finish before the window opens
		for (let last = -1; last !== gm; ) { last = gm; await page.waitForTimeout(SETTLE); } // quiesce

		// now a resync that STAYS in flight
		const base = gm;
		const parkedGm = new Promise((r) => (gmParked = r));
		holdGm = true;
		await page.fill("#input", "!settle b");
		await page.press("#input", "Enter");
		await parkedGm;

		parked.shift()(); // first POST returns: asks for a repair while one runs
		await page.waitForFunction(() => window.__fetched.filter((u) => u.includes("/bash")).length >= 3, null, { timeout: 20000 });
		await page.waitForTimeout(SETTLE); // let an unwanted extra resync start if it is going to
		parked.shift()(); // second POST returns: the same request again
		await page.waitForFunction(() => window.__fetched.filter((u) => u.includes("/bash")).length >= 4, null, { timeout: 20000 });
		await page.waitForTimeout(SETTLE); // again: give a wrong extra read time to start
		releaseGm();
		// positive: the one coalesced follow-up runs
		for (let i = 0; i < 400 && gm - base < 2; i++) await page.waitForTimeout(50);
		await page.waitForTimeout(SETTLE); // "and no more than that" is a negative claim
		check("repair resyncs coalesce: the running resync plus exactly one follow-up", gm - base === 2, String(gm - base));
		await closePage(page);
	}

	// ── 16. DIRECT callers of the read coalesce too ───────────────────────────
	// The repair path is not the only caller: a settled turn, a reconnect and a
	// compaction all re-read history. Two of them arriving while a read is parked
	// are worth one follow-up between them, not one each.
	{
		const page = await newPage(ctx);
		let gm = 0;
		let holdGm = false;
		let gmParked = null;
		let releaseGm = null;
		await page.route(`**/api/session/${b.id}/rpc`, async (route) => {
			if (rpcType(route) !== "get_messages") return route.continue();
			gm++;
			if (!holdGm) return route.continue();
			holdGm = false;
			const resp = await route.fetch();
			gmParked();
			await new Promise((r) => (releaseGm = r));
			return route.fulfill({ response: resp });
		});
		await page.goto(BASE);
		await openByMark(page, "bravo");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		for (let last = -1; last !== gm; ) { last = gm; await page.waitForTimeout(SETTLE); } // quiesce

		const base = gm;
		const parkedGm = new Promise((r) => (gmParked = r));
		holdGm = true;
		await page.fill("#input", "!settle p");
		await page.press("#input", "Enter");
		await parkedGm; // that turn's read is now stuck in the route

		// two more settled turns while it is stuck: two DIRECT resync() calls
		for (const cmd of ["!settle q", "!settle r"]) {
			await page.fill("#input", cmd);
			await page.press("#input", "Enter");
			await page.waitForFunction((c) => window.__sse.some((e) => e.type === "agent_settled") && document.getElementById("input").value === "", c, { timeout: 20000 });
			await page.waitForTimeout(SETTLE); // let a wrong extra read start if it is going to
		}
		releaseGm();
		for (let i = 0; i < 400 && gm - base < 2; i++) await page.waitForTimeout(50); // the follow-up
		await page.waitForTimeout(SETTLE); // "and no more than that" is a negative claim
		check("direct callers coalesce: the parked read plus exactly one follow-up", gm - base === 2, String(gm - base));
		await closePage(page);
	}

	// ── 17. a command still RUNNING when the transcript is rebuilt ────────────
	// pi records a run in history only when it finishes, so the repair read finds
	// nothing. The terminal event that arrives afterwards has no POST left to
	// flush it — it must trigger the read that finally shows the card.
	{
		const page = await newPage(ctx);
		let release = null;
		let entered = null;
		const intercepted = new Promise((r) => (entered = r));
		await page.route(`**/api/session/${b.id}/bash`, async (route) => {
			if (!/"command":"linger/.test(route.request().postData() || "")) return route.continue();
			const resp = await route.fetch();
			entered();
			await new Promise((r) => (release = r));
			return route.fulfill({ response: resp });
		});
		await page.goto(RELAY);
		await openByMark(page, "bravo");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.fill("#input", "!linger a while");
		await page.press("#input", "Enter");
		await intercepted; // the POST is parked and the command is still running

		await markPane(page);
		killSse();
		await page.waitForFunction(() => window.__sse.filter((e) => e.type === "desk_hello").length >= 2, null, { timeout: 30000 });
		await waitRebuilt(page); // the reconnect read has answered and rebuilt the pane
		release();
		await page.waitForFunction(() => window.__fetched.some((u) => u.includes("/bash")), null, { timeout: 20000 });
		await page.waitForTimeout(SETTLE); // the rebuild branch ran: no card exists yet
		const mid = await bashCard(page, "linger a while");
		check("still-running rebuild: history has nothing yet, so no card yet", mid.n === 0, String(mid.n));

		// now the command finishes: the terminal event is the only thing left
		await page.fill("#input", "!finish it");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => [...document.querySelectorAll(".bash-card")].some((r) => r.querySelector(".bcmd").textContent === "! linger a while" && r.querySelector(".bexit").textContent), null, { timeout: 25000 }).catch(() => {});
		const r = await bashCard(page, "linger a while");
		check("still-running rebuild: the finished card appears after the terminal event", r.n === 1, String(r.n));
		check("still-running rebuild: it carries the run's output", r.out === "LINGER-DONE\n", JSON.stringify(r.out));
		await closePage(page);
	}

	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	await die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message, "\n--- server log ---\n", log.slice(-3000));
	await die(3);
}
