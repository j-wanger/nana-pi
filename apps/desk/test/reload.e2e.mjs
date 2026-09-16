// E2E: a LIVE session picks up skills added after it started, without a restart.
//
// pi scans skill/extension locations at STARTUP only and RPC has no reload
// command, so the desk's `/reload` sends nana-pack's `reload-runtime` as a
// PROMPT (pi runs extension commands straight off a prompt) and re-reads
// `get_commands` afterwards. What is pinned here:
//   1. no nana-pack in the session → `/reload` sends NOTHING and says so.
//   2. nana-pack present → `/reload` sends a prompt whose text is
//      `/reload-runtime`, then re-reads get_commands, and the toast reports the
//      counts get_commands came back with.
//   3. auto-detect: a skill dir appears under the session's cwd `.pi/skills`,
//      window `focus` fires → the same reload runs by itself and the toast names
//      the new skill.
//   4. mid-turn, the same gain does NOT reload: it waits for `agent_settled`.
//   5. a prompt typed WHILE a reload is running is held until it answers — it
//      would otherwise be posted into the middle of `ctx.reload()`.
//   6. a reload the prompt endpoint only DETACHED from (`{pending:true}` after
//      5 s) is not reported as done — and does not release the held prompt, or
//      even re-read the commands — until pi actually answers (desk_prompt_settled).
//   7. …and a detached reload that FAILS late reports the failure and releases
//      the prompt it was holding, rather than holding it forever.
//   8. …and one that changes NO command still finishes the moment pi answers.
//      (The old ceiling-and-poll made this case a 15 s hold with the user's
//      prompt stuck in the composer, and ended in a claim nothing had verified.)
//   9. …and one whose settled event arrives BEFORE the answer that names the
//      promptId still finishes: the page keeps the outcome, so a waiter
//      installed after the event is answered out of what it already knows.
//  10. …and one whose settled event is broadcast while the SSE stream is DOWN
//      finishes on the reconnect, out of the desk_hello snapshot.
// The toast always reports what get_commands ACTUALLY returned, never what
// /api/resources predicted — a session spawned with a narrowed skill set
// re-applies its CLI flags on reload and gains nothing.
//
// Real desk server + STUB pi (no model) + headless Chromium. The stub's
// get_commands answer is read from a control file on every call, so the test
// decides what pi "has" at each point.
//
// Run: PW_ROOT=<dir with playwright> node apps/desk/test/reload.e2e.mjs
// Exit 0 = all PASS, 1 = assertion failed, 3 = harness error.
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
const PORT = Number(process.env.DESK_TEST_PORT) || (await freePort());
const BASE = `http://127.0.0.1:${PORT}`;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The desk parses sessions with the pi install tied to the `pi` it SPAWNS, and
// this harness puts a stub `pi` first on PATH. Name the real package explicitly.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;

const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-reload-"));
const binDir = path.join(TD, "bin");
const plain = path.join(TD, "plain"); // session 1: no nana-pack
const packed = path.join(TD, "packed"); // sessions 2-4: nana-pack loaded
const LOG = path.join(TD, "rpc.jsonl"); // every command the stub received
const CMDS = path.join(TD, "commands.json"); // what get_commands answers, live
const CTL = path.join(TD, "control.json"); // how long the stub holds the reload prompt
for (const d of [binDir, plain, packed, path.join(TD, ".pi", "agent", "sessions")]) fs.mkdirSync(d, { recursive: true });

const RELOAD_CMD = { name: "reload-runtime", description: "Reload extensions, skills…", source: "extension", sourceInfo: { scope: "user", path: "/x/nana-lifecycle.ts" } };
const skillCmd = (name) => ({ name: `skill:${name}`, description: `${name} skill`, source: "skill", sourceInfo: { scope: "user", path: `/x/${name}` } });
const setCommands = (byCwd) => fs.writeFileSync(CMDS, JSON.stringify(byCwd));
setCommands({ plain: [], packed: [RELOAD_CMD] });
// `reloadDelayMs` holds the ANSWER to the `/reload-runtime` prompt, which is
// what pi does with a slow extension command (the prompt's success is emitted
// only once the handler resolved). `commandsAfterReload`, if set, becomes what
// get_commands answers at that same moment — so a poll cannot see it early.
const setCtl = (o) => fs.writeFileSync(CTL, JSON.stringify(o));
setCtl({});

// ── stub pi: marks itself by cwd, logs every command, answers get_commands
// from the control file so the test can change what pi "has" mid-run ──
const STUB = `#!/usr/bin/env node
const fs = require("node:fs");
const MARK = require("node:path").basename(process.cwd());
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
let buf = "";
process.stdin.on("data", (c) => {
	buf += c; let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		fs.appendFileSync(process.env.STUB_LOG, JSON.stringify({ mark: MARK, type: cmd.type, message: cmd.message || null, at: Date.now() }) + "\\n");
		const ok = (data) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data });
		switch (cmd.type) {
			case "get_state": ok({ isStreaming: false, isCompacting: false, sessionName: MARK, sessionFile: null, model: { provider: "stub", id: "stub" }, thinkingLevel: "off" }); break;
			case "get_messages": ok({ messages: [{ role: "user", content: [{ type: "text", text: "marker-" + MARK }] }] }); break;
			case "get_session_stats": ok({ tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, cost: 0, totalMessages: 1, contextUsage: null }); break;
			case "get_commands": {
				let all = {};
				try { all = JSON.parse(fs.readFileSync(process.env.STUB_CMDS, "utf-8")); } catch {}
				ok({ commands: all[MARK] || [] });
				break;
			}
			case "clear_queue": ok({ steering: [], followUp: [] }); break;
			// the two levers the test needs on the turn state
			case "bash":
				if (/^stream-on/.test(cmd.command)) say({ type: "agent_start" });
				if (/^stream-off/.test(cmd.command)) say({ type: "agent_settled" });
				say({ type: "response", id: cmd.id, success: true, data: { exitCode: 0 } });
				break;
			// an extension command produces no echo — pi handles it off the turn
			case "prompt": {
				const msg = String(cmd.message || "");
				if (!msg.startsWith("/")) say({ type: "message_end", message: { role: "user", content: [{ type: "text", text: cmd.message }] } });
				let ctl = {};
				try { ctl = JSON.parse(fs.readFileSync(process.env.STUB_CTL, "utf-8")); } catch {}
				// a slow extension command is a slow ANSWER to the prompt: pi emits
				// the prompt's success only once the command's handler resolved
				const answer = (c) => {
					if (c.commandsAfterReload) fs.writeFileSync(process.env.STUB_CMDS, JSON.stringify(c.commandsAfterReload));
					fs.appendFileSync(process.env.STUB_LOG, JSON.stringify({ mark: MARK, type: "prompt-answered", message: msg, at: Date.now() }) + "\\n");
					if (c.reloadFail) say({ type: "response", id: cmd.id, command: cmd.type, success: false, error: String(c.reloadFail) });
					else ok({});
				};
				// reloadHold: the answer waits for the TEST, not for a clock. The
				// control file is re-read on every poll, so releasing it is an event
				// the test decides the moment of.
				if (msg === "/reload-runtime" && ctl.reloadHold) {
					const poll = setInterval(() => {
						let now = {};
						try { now = JSON.parse(fs.readFileSync(process.env.STUB_CTL, "utf-8")); } catch { return; }
						if (!now.reloadRelease) return;
						clearInterval(poll);
						answer(now);
					}, 100);
					break;
				}
				const delay = msg === "/reload-runtime" ? Number(ctl.reloadDelayMs) || 0 : 0;
				if (!delay) { ok({}); break; }
				setTimeout(() => answer(ctl), delay);
				break;
			}
			default: ok({});
		}
	}
});
process.stdin.on("end", () => process.exit(0));
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

const server = spawn("node", [SERVER], {
	env: {
		...process.env, DESK_PI_ROOT: PI_ROOT, HOME: TD, DESK_PORT: String(PORT),
		DESK_APPS_DIR: path.join(TD, "no-apps"), STUB_LOG: LOG, STUB_CMDS: CMDS, STUB_CTL: CTL,
		PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
	},
	stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let browser;

// Records every SSE event the page's own EventSource delivers, from inside the
// constructor — so this listener runs before app.js's, and "the page has this
// event" is a fact the test can wait on rather than infer.
const SSE_SPY = `
window.__sse = [];
const Native = window.EventSource;
window.EventSource = class extends Native {
	constructor(...a) { super(...a); this.addEventListener("message", (ev) => { try { window.__sse.push(JSON.parse(ev.data)); } catch {} }); }
};
// …and every /prompt answer the page received, cloned before app.js reads it, so
// a test can NAME the promptId a reload is waiting on instead of guessing it.
window.__prompts = [];
const nativeFetch = window.fetch;
window.fetch = (...a) => nativeFetch(...a).then((r) => {
	try { if (String(r.url).endsWith("/prompt")) r.clone().json().then((j) => window.__prompts.push(j)).catch(() => {}); } catch {}
	return r;
});
`;

// ── TCP relay in front of the desk, so test 10 can destroy the SSE socket at a
// moment of its choosing (nothing in the browser or in Playwright can end an
// established EventSource connection). Byte-for-byte pass-through apart from the
// authority in the Host/Origin headers, which the desk checks against the port
// it bound — the relay port has the same digit count so no Content-Length moves.
const RELAY_PORT = PORT + 1;
if (String(RELAY_PORT).length !== String(PORT).length) throw new Error("relay port must have the same digit count as the desk port");
const RELAY = `http://127.0.0.1:${RELAY_PORT}`;
const sseSockets = new Set();
// While this is on the relay carries NO /events connection: what is open is
// destroyed and what tries to reconnect dies at the relay. That turns "the
// stream was down when the settlement was broadcast" from a timing hope into a
// property of the test. Everything else (prompts, rpc, resources) still flows.
let blockSse = false;
const relay = net.createServer((client) => {
	const up = net.connect(PORT, "127.0.0.1");
	const bye = () => { sseSockets.delete(client); client.destroy(); up.destroy(); };
	client.on("data", (c) => {
		const s = c.toString("latin1");
		if (/^GET [^\r\n ]*\/events[ ?]/m.test(s)) {
			if (blockSse) return bye();
			sseSockets.add(client);
		}
		up.write(Buffer.from(s.split(`127.0.0.1:${RELAY_PORT}`).join(`127.0.0.1:${PORT}`), "latin1"));
	});
	up.on("data", (c) => client.write(c));
	for (const ev of ["close", "error", "end"]) { client.on(ev, bye); up.on(ev, bye); }
});
await new Promise((r) => relay.listen(RELAY_PORT, "127.0.0.1", r));
const killSse = () => { for (const s of [...sseSockets]) { sseSockets.delete(s); s.destroy(); } };

const die = (code) => { browser?.close().catch(() => {}); relay.close(); server.kill(); fs.rmSync(TD, { recursive: true, force: true }); process.exit(code); };

const rpcLog = () => (fs.existsSync(LOG) ? fs.readFileSync(LOG, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const reloadPrompts = (mark) => rpcLog().filter((e) => e.mark === mark && e.type === "prompt" && e.message === "/reload-runtime");
const reloadAnswers = (mark) => rpcLog().filter((e) => e.mark === mark && e.type === "prompt-answered");
const userPrompts = (mark, text) => rpcLog().filter((e) => e.mark === mark && e.type === "prompt" && e.message === text);
const commandReads = (mark) => rpcLog().filter((e) => e.mark === mark && e.type === "get_commands");
// SETTLE: the only waits here that back a NEGATIVE assertion — long enough for
// the enumeration (single-digit ms) and the prompt POST to have happened.
const SETTLE = 700;
async function until(pred, what, ms = 8000) {
	for (let i = 0; i < ms / 100; i++) {
		if (pred()) return;
		await sleep(100);
	}
	throw new Error(`never ${what}`);
}

const spawnSession = (cwd) =>
	fetch(`${BASE}/api/spawn`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cwd }) }).then((r) => r.json());
const openByMark = async (page, mark) => {
	await page.waitForFunction((m) => [...document.querySelectorAll("#live-list .live-row .cwd")].some((c) => c.textContent === m), mark, { timeout: 15000 });
	await page.click(`#live-list .live-row:has(.cwd:text-is("${mark}"))`);
	await page.waitForSelector("#input", { state: "visible", timeout: 5000 });
};
// The composer's `/` completion owns Enter while it is open (it completes
// instead of sending) — exactly as it does for /model or /compact, so a submit
// closes it first.
const submit = async (page, text) => {
	await page.fill("#input", text);
	if (!(await page.isHidden("#completion"))) await page.press("#input", "Escape");
	await page.press("#input", "Enter");
};
const lastToast = async (page) => (await page.$$eval("#toasts .toast", (ts) => ts.map((t) => t.textContent))).at(-1) || "";
// The toast is painted after two round trips (get_commands, then /api/resources),
// so it is waited FOR, never assumed to be there — the returned text is what the
// assertion then reads.
async function untilToast(page, re, ms = 8000) {
	let t = "";
	for (let i = 0; i < ms / 100; i++) {
		t = await lastToast(page);
		if (re.test(t)) return t;
		await sleep(100);
	}
	return t;
}
const addSkill = (cwd, name) => {
	const dir = path.join(cwd, ".pi", "skills", name);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: ${name} does things\n---\n\nbody\n`);
};

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(`${BASE}/api/live`); break; } catch { await sleep(250); }
		if (i === 39) throw new Error(`desk server never came up: ${log}`);
	}
	// Both sessions exist before the page loads: the rail refreshes on load and
	// then only every 15 s, and nothing here is about the rail.
	await spawnSession(plain);
	await spawnSession(packed);
	browser = await chromium.launch();
	const errs = [];
	const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	page.on("pageerror", (e) => errs.push(String(e.message)));
	await page.addInitScript(SSE_SPY);
	await page.goto(BASE, { waitUntil: "domcontentloaded" });
	// Every toast the page raises, kept: a toast auto-dismisses, so "did it say
	// `reloaded` before pi answered?" cannot be asked by polling for one.
	await page.evaluate(() => {
		window.__toasts = [];
		new MutationObserver((ms) => {
			for (const m of ms) for (const n of m.addedNodes) if (n.classList?.contains("toast")) window.__toasts.push(n.textContent);
		}).observe(document.getElementById("toasts"), { childList: true });
	});
	const seenToasts = () => page.evaluate(() => window.__toasts.slice());
	const resetToasts = () => page.evaluate(() => (window.__toasts.length = 0));

	// ── 1. no nana-pack in the session: /reload sends nothing ──
	await openByMark(page, "plain");
	await until(() => commandReads("plain").length >= 1, "read the plain session's commands");
	await submit(page, "/reload");
	await sleep(SETTLE);
	check("1: without nana-pack nothing is sent to pi", reloadPrompts("plain").length === 0, JSON.stringify(rpcLog().filter((e) => e.mark === "plain" && e.type === "prompt")));
	check("1: …and the desk says how to get it", /needs nana-pack/.test(await lastToast(page)), await lastToast(page));
	check("1: …and the editor is cleared like any desk command", (await page.inputValue("#input")) === "");

	// ── 2. with nana-pack: the command reaches pi as a PROMPT, then get_commands ──
	await openByMark(page, "packed");
	await until(() => commandReads("packed").length >= 1, "read the packed session's commands");
	const readsBefore = commandReads("packed").length;
	setCommands({ plain: [], packed: [RELOAD_CMD, skillCmd("from-manual")] }); // what the reload finds
	await submit(page, "/reload");
	await until(() => reloadPrompts("packed").length === 1, "sent the reload prompt");
	check("2: /reload reaches pi as a prompt of /reload-runtime", reloadPrompts("packed").length === 1);
	await until(() => commandReads("packed").length > readsBefore, "re-read get_commands after the reload");
	check("2: …and get_commands is re-read afterwards", commandReads("packed").length > readsBefore);
	let t = await untilToast(page, /reloaded/);
	check("2: the toast reports what get_commands returned", /reloaded · 1 skills · 1 extensions/.test(t), t);
	check("2: …and names what appeared", /new: from-manual/.test(t), t);

	// ── 3. auto-detect on focus ──
	await sleep(3100); // the per-session enumeration throttle (RES_CHECK_MS)
	addSkill(packed, "picked-up");
	setCommands({ plain: [], packed: [RELOAD_CMD, skillCmd("from-manual"), skillCmd("picked-up")] });
	const beforeAuto = reloadPrompts("packed").length;
	await page.evaluate(() => window.dispatchEvent(new Event("focus")));
	await until(() => reloadPrompts("packed").length === beforeAuto + 1, "auto-reloaded on focus");
	check("3: a new skill under .pi/skills triggers a reload on focus", reloadPrompts("packed").length === beforeAuto + 1);
	t = await untilToast(page, /new skills found/);
	check("3: …and the toast names it", /new skills found: picked-up/.test(t), t);

	// ── 4. mid-turn the gain waits for agent_settled ──
	await sleep(3100);
	await submit(page, "!stream-on");
	await page.waitForFunction(() => document.querySelector("#chip")?.textContent?.includes("running"), null, { timeout: 8000 }).catch(() => {});
	addSkill(packed, "deferred");
	setCommands({ plain: [], packed: [RELOAD_CMD, skillCmd("from-manual"), skillCmd("picked-up"), skillCmd("deferred")] });
	const beforeDefer = reloadPrompts("packed").length;
	await page.evaluate(() => window.dispatchEvent(new Event("focus")));
	await sleep(SETTLE);
	check("4: a gain found mid-turn does NOT reload under the running turn", reloadPrompts("packed").length === beforeDefer, String(reloadPrompts("packed").length - beforeDefer));
	await submit(page, "!stream-off");
	await until(() => reloadPrompts("packed").length === beforeDefer + 1, "reloaded once the turn settled");
	check("4: …and runs the moment it settles", reloadPrompts("packed").length === beforeDefer + 1);
	t = await untilToast(page, /deferred/);
	check("4: …naming the skill that was waiting", /new skills found: deferred/.test(t), t);

	// ── 5. a prompt typed DURING a reload waits for it ──
	// `/reload-runtime` is a prompt of pi's own; posting the user's on top of it
	// races `ctx.reload()`. checkResources() cannot catch this — it returns
	// immediately while a reload is running — so send() waits on the reload itself.
	await sleep(3100);
	await resetToasts();
	setCtl({ reloadDelayMs: 2000 }); // under the endpoint's 5 s wait: answered, just slowly
	const beforeHeld = reloadPrompts("packed").length;
	await submit(page, "/reload");
	await until(() => reloadPrompts("packed").length === beforeHeld + 1, "sent the held reload prompt");
	await submit(page, "hello during reload");
	await until(() => userPrompts("packed", "hello during reload").length === 1, "sent the user prompt", 20000);
	{
		const answered = reloadAnswers("packed")[0];
		const typed = userPrompts("packed", "hello during reload")[0];
		check("5: the user's prompt reaches pi only after the reload answered", !!answered && typed.at >= answered.at, JSON.stringify({ answeredAt: answered?.at, typedAt: typed?.at }));
		const ts = await seenToasts();
		check("5: …and the composer says why it is holding it", ts.some((t) => /reloading skills/.test(t)), JSON.stringify(ts));
	}
	// that prompt left the session "running" (the stub settles no turn by itself),
	// and runReload refuses to run under a turn — put it back to idle first
	await submit(page, "!stream-off");
	await page.waitForFunction(() => document.querySelector("#chip")?.textContent === "idle", null, { timeout: 10000 });

	// ── 6. a reload the ENDPOINT only detached from is not "reloaded" ──
	// /api/session/:id/prompt waits 5 s for pi's acceptance and then answers
	// {pending:true, promptId}. pi has not finished; the desk must not say it has,
	// must not read commands yet, and must keep holding the user's next prompt —
	// all of which now hang off the desk_prompt_settled event for that promptId.
	await sleep(3100);
	await resetToasts();
	setCtl({
		reloadDelayMs: 7000, // past the endpoint's 5 s detach
		commandsAfterReload: { plain: [], packed: [RELOAD_CMD, skillCmd("from-manual"), skillCmd("picked-up"), skillCmd("deferred"), skillCmd("late")] },
	});
	const beforePending = reloadPrompts("packed").length;
	const answersBefore = reloadAnswers("packed").length;
	await submit(page, "/reload");
	await until(() => reloadPrompts("packed").length === beforePending + 1, "sent the slow reload prompt");
	const readsAtDetach = commandReads("packed").length;
	await submit(page, "hello during a detached reload");
	await sleep(6000); // past the 5 s detach, before the stub answers at 7 s
	{
		const ts = await seenToasts();
		check("6: pi has not answered yet", reloadAnswers("packed").length === answersBefore, `${reloadAnswers("packed").length} vs ${answersBefore}`);
		check("6: …and the desk has not claimed a reload on the detached answer", !ts.some((t) => /reloaded|new skills found/.test(t)), JSON.stringify(ts));
		check("6: …and has not re-read the commands either", commandReads("packed").length === readsAtDetach, `${commandReads("packed").length} vs ${readsAtDetach}`);
		check("6: …and the user's prompt is still held", userPrompts("packed", "hello during a detached reload").length === 0, "");
	}
	t = await untilToast(page, /reloaded/, 20000);
	check("6: …and it reports the reload once pi actually answers", /new: late/.test(t), t);
	check("6: …after pi answered, not before", reloadAnswers("packed").length === answersBefore + 1, String(reloadAnswers("packed").length));
	await until(() => userPrompts("packed", "hello during a detached reload").length === 1, "released the held prompt", 10000);
	{
		const answered = reloadAnswers("packed").at(-1);
		const typed = userPrompts("packed", "hello during a detached reload")[0];
		check("6: …and only then is the held prompt posted", !!answered && typed.at >= answered.at, JSON.stringify({ answeredAt: answered?.at, typedAt: typed?.at }));
	}
	await submit(page, "!stream-off");
	await page.waitForFunction(() => document.querySelector("#chip")?.textContent === "idle", null, { timeout: 10000 });

	// ── 7. a detached reload that FAILS late says so, and releases the prompt ──
	// The prompt is held on the reload, so a reload that never reports would hold
	// the user's typing forever. A late failure has to end the wait like a success.
	await sleep(3100);
	await resetToasts();
	setCtl({ reloadDelayMs: 7000, reloadFail: "reload handler exploded" });
	const beforeFail = reloadPrompts("packed").length;
	await submit(page, "/reload");
	await until(() => reloadPrompts("packed").length === beforeFail + 1, "sent the failing reload prompt");
	await submit(page, "hello after a failed reload");
	await sleep(6000);
	check("7: the user's prompt is held while the failing reload runs", userPrompts("packed", "hello after a failed reload").length === 0, "");
	t = await untilToast(page, /exploded/, 20000);
	check("7: the late failure is reported", /exploded/.test(t), t);
	await until(() => userPrompts("packed", "hello after a failed reload").length === 1, "released the prompt held by a failed reload", 10000);
	check("7: …and the held prompt is released, not lost", userPrompts("packed", "hello after a failed reload").length === 1, "");
	await submit(page, "!stream-off");
	await page.waitForFunction(() => document.querySelector("#chip")?.textContent === "idle", null, { timeout: 10000 });

	// ── 8. a detached reload that changes NOTHING still finishes on the answer ──
	// The old polling read a changed command list as "done", so a reload that adds
	// no command could only end by running out a 15 s ceiling — and the user's
	// prompt sat in the composer for all of it. The settle is the signal now.
	await sleep(3100);
	await resetToasts();
	setCtl({ reloadDelayMs: 7000 }); // no commandsAfterReload: the list is identical
	const beforeQuiet = reloadPrompts("packed").length;
	await submit(page, "/reload");
	await until(() => reloadPrompts("packed").length === beforeQuiet + 1, "sent the quiet reload prompt");
	t = await untilToast(page, /reloaded/, 20000);
	{
		const seenAt = Date.now();
		const answered = reloadAnswers("packed").at(-1);
		check("8: an unchanged command list still reports a reload", /reloaded · /.test(t) && !/new: /.test(t), t);
		check("8: …on pi's answer, not on a ceiling", !!answered && seenAt - answered.at < 3000, `${seenAt - (answered?.at ?? 0)} ms after pi answered`);
	}
	// ── 9. the settled event arrives BEFORE the answer that names it ──
	// The event travels on the SSE stream and the answer it belongs to on the
	// POST, and nothing orders those two. A page that only DISPATCHED settled
	// events would find no waiter for one that arrived first, drop it, and then
	// install a waiter for an event that has already gone past — the reload never
	// finishing and the user's prompt held in the composer behind it. Forced, not
	// hoped for: the POST's response is HELD until the page has the settled event.
	await sleep(3100);
	await resetToasts();
	setCtl({
		reloadDelayMs: 7000,
		commandsAfterReload: { plain: [], packed: [RELOAD_CMD, skillCmd("from-manual"), skillCmd("picked-up"), skillCmd("deferred"), skillCmd("early")] },
	});
	const beforeEarly = reloadPrompts("packed").length;
	const settledBefore = await page.evaluate(() => window.__sse.filter((e) => e.type === "desk_prompt_settled").length);
	let armed = true, releasedAt = 0;
	await page.route("**/api/session/*/prompt", async (route) => {
		let body = {};
		try { body = route.request().postDataJSON() || {}; } catch {}
		if (!armed || body.message !== "/reload-runtime") {
			try { await route.continue(); } catch {} // the socket may be gone mid-flight
			return;
		}
		armed = false;
		const resp = await route.fetch(); // the endpoint has detached: {pending:true, promptId}
		// …and the answer sits here until the page has the settled event, which is
		// the ordering the page has to survive
		await page.waitForFunction((n) => window.__sse.filter((e) => e.type === "desk_prompt_settled").length > n, settledBefore, { timeout: 30000 });
		releasedAt = Date.now();
		try { await route.fulfill({ response: resp }); } catch {}
	});
	await submit(page, "/reload");
	await until(() => reloadPrompts("packed").length === beforeEarly + 1, "sent the reload whose answer is held back");
	await submit(page, "hello behind an early settle");
	t = await untilToast(page, /reloaded/, 25000);
	check("9: a settled event seen BEFORE its own answer still finishes the reload", /new: early/.test(t), t);
	check("9: …on the answer it was holding, not on some later event", releasedAt > 0 && Date.now() - releasedAt < 5000, `${releasedAt ? Date.now() - releasedAt : -1} ms after the answer was released`);
	await until(() => userPrompts("packed", "hello behind an early settle").length === 1, "released the prompt held behind the early settle", 10000);
	check("9: …and the prompt it was holding is posted", userPrompts("packed", "hello behind an early settle").length === 1, "");
	await page.unroute("**/api/session/*/prompt").catch(() => {});
	await submit(page, "!stream-off");
	await page.waitForFunction(() => document.querySelector("#chip")?.textContent === "idle", null, { timeout: 10000 });

	// ── 10. the settled event is broadcast while the stream is DOWN ──
	// The desk replays no event buffers, so that event is gone for good. What
	// brings the answer back is the reconnect's desk_hello: the server keeps the
	// last 32 detached outcomes per session and puts them in the snapshot.
	//
	// Nothing here is timed. pi's answer is HELD until this test releases it, and
	// for the whole window the relay carries no /events connection at all — what
	// was open is destroyed and a reconnect dies at the relay. So "the settlement
	// was broadcast with nothing listening" is a fact the test creates, not one it
	// hopes for, and it is checked afterwards: no live settled event for THIS
	// promptId ever reached the page. One tab only — page 1 is closed first, so
	// the child has no other SSE client the broadcast could have gone to.
	await page.unrouteAll({ behavior: "ignoreErrors" }).catch(() => {});
	await page.close();
	{
		const page2 = await browser.newPage({ viewport: { width: 1280, height: 900 } });
		page2.on("pageerror", (e) => errs.push(String(e.message)));
		await page2.addInitScript(SSE_SPY);
		await page2.goto(RELAY, { waitUntil: "domcontentloaded" });
		const readsBeforeRelay = commandReads("packed").length;
		await openByMark(page2, "packed");
		await until(() => commandReads("packed").length > readsBeforeRelay, "read the commands on the relayed page");
		await sleep(3100);
		const held = { plain: [], packed: [RELOAD_CMD, skillCmd("from-manual"), skillCmd("picked-up"), skillCmd("deferred"), skillCmd("afterdrop")] };
		setCtl({ reloadHold: true, commandsAfterReload: held }); // …until this test says otherwise
		const beforeDrop = reloadPrompts("packed").length;
		const answersBefore = reloadAnswers("packed").length;
		const promptsBefore = await page2.evaluate(() => window.__prompts.length);
		await submit(page2, "/reload");
		await until(() => reloadPrompts("packed").length === beforeDrop + 1, "sent the reload pi is now holding");
		await submit(page2, "hello across a dropped stream");
		// The endpoint detaches after 5 s, so the page HAVING that answer is the
		// positive fact that its waiter is installed — and the answer names the
		// promptId every assertion below is about.
		await page2.waitForFunction((n) => window.__prompts.slice(n).some((p) => p.pending), promptsBefore, { timeout: 25000 });
		const promptId = await page2.evaluate((n) => window.__prompts.slice(n).find((p) => p.pending).promptId, promptsBefore);
		check("10: the reload detached, and the page knows which prompt it waits on", !!promptId, String(promptId));

		// the stream goes down and STAYS down — nothing can be listening from here
		blockSse = true;
		killSse();
		await until(() => sseSockets.size === 0, "the relay let go of its SSE socket");
		await page2.waitForFunction(() => document.getElementById("chip")?.textContent === "disconnected", null, { timeout: 20000 });
		// …and only NOW is pi allowed to answer, into a child with no clients
		setCtl({ reloadHold: true, reloadRelease: true, commandsAfterReload: held });
		await until(() => reloadAnswers("packed").length === answersBefore + 1, "pi answered the held reload", 15000);
		await sleep(500); // the broadcast rides the answer's own stdout line: give it the tick
		blockSse = false;

		await page2.waitForFunction(() => window.__sse.filter((e) => e.type === "desk_hello").length >= 2, null, { timeout: 40000 });
		const seen = await page2.evaluate((id) => {
			const idx = window.__sse.map((e) => e.type).lastIndexOf("desk_hello");
			return {
				live: window.__sse.slice(0, idx).filter((e) => e.type === "desk_prompt_settled" && e.promptId === id).length,
				ring: (window.__sse[idx].settledPrompts || []).filter((s) => s.promptId === id),
			};
		}, promptId);
		check("10: no settled event for this prompt ever reached the page live", seen.live === 0, `${seen.live} live settled events for ${promptId}`);
		check("10: …and the reconnect's hello carries THAT prompt's outcome", seen.ring.length === 1 && seen.ring[0].ok === true, JSON.stringify(seen.ring));
		const t10 = await untilToast(page2, /reloaded/, 25000);
		check("10: a reload whose settled event was missed finishes on the reconnect", /new: afterdrop/.test(t10), t10);
		await until(() => userPrompts("packed", "hello across a dropped stream").length === 1, "released the prompt held across the outage", 15000);
		check("10: …and the prompt it was holding is posted, not lost", userPrompts("packed", "hello across a dropped stream").length === 1, "");
		await page2.close();
	}
	setCtl({});

	check("no page errors along the way", errs.length === 0, JSON.stringify(errs));
	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message, "\n--- rpc log ---\n", JSON.stringify(rpcLog()), "\n--- server log ---\n", log.slice(-1500));
	die(3);
}
