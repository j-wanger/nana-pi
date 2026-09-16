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
for (const d of [binDir, plain, packed, path.join(TD, ".pi", "agent", "sessions")]) fs.mkdirSync(d, { recursive: true });

const RELOAD_CMD = { name: "reload-runtime", description: "Reload extensions, skills…", source: "extension", sourceInfo: { scope: "user", path: "/x/nana-lifecycle.ts" } };
const skillCmd = (name) => ({ name: `skill:${name}`, description: `${name} skill`, source: "skill", sourceInfo: { scope: "user", path: `/x/${name}` } });
const setCommands = (byCwd) => fs.writeFileSync(CMDS, JSON.stringify(byCwd));
setCommands({ plain: [], packed: [RELOAD_CMD] });

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
		fs.appendFileSync(process.env.STUB_LOG, JSON.stringify({ mark: MARK, type: cmd.type, message: cmd.message || null }) + "\\n");
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
			case "prompt":
				if (!String(cmd.message || "").startsWith("/")) say({ type: "message_end", message: { role: "user", content: [{ type: "text", text: cmd.message }] } });
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
	env: {
		...process.env, DESK_PI_ROOT: PI_ROOT, HOME: TD, DESK_PORT: String(PORT),
		DESK_APPS_DIR: path.join(TD, "no-apps"), STUB_LOG: LOG, STUB_CMDS: CMDS,
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
const die = (code) => { browser?.close().catch(() => {}); server.kill(); fs.rmSync(TD, { recursive: true, force: true }); process.exit(code); };

const rpcLog = () => (fs.existsSync(LOG) ? fs.readFileSync(LOG, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const reloadPrompts = (mark) => rpcLog().filter((e) => e.mark === mark && e.type === "prompt" && e.message === "/reload-runtime");
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
	const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	const errs = [];
	page.on("pageerror", (e) => errs.push(String(e.message)));
	await page.goto(BASE, { waitUntil: "domcontentloaded" });

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

	check("no page errors along the way", errs.length === 0, JSON.stringify(errs));
	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message, "\n--- rpc log ---\n", JSON.stringify(rpcLog()), "\n--- server log ---\n", log.slice(-1500));
	die(3);
}
