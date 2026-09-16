// E2E: the files-changed bar and the floating diff window. Real desk server +
// STUB pi (no model) + headless Chromium, with the stub's cwd a temp git
// repository whose changes the test controls on disk.
//
//   1. the bar appears for a live session in a repo, with the right totals, and
//      stays hidden for a session whose cwd is not a repository
//   2. it expands in place to per-file rows (status, path, +a −r)
//   3. a row opens the floating window with that file's diff, rendered through
//      renderDiff (the .dadd/.ddel lines), and ▶ walks to the next file
//   4. Esc closes the window — and does NOT abort the turn, which is what the
//      capture-phase carve-out in changes.js buys; with no window open Esc
//      still aborts, so the carve-out is narrow
//   5. `agent_settled` re-reads the tree: a file written while the session was
//      idle shows up on the next settled turn
//   6. switching sessions clears the bar
//   7. a /changes answer for a session you have LEFT never paints
//
// Run: PW_ROOT=<dir with playwright> node apps/desk/test/changes-ui.e2e.mjs
// Exit 0 = pass, 1 = assertion failed, 3 = harness error.
import { execFileSync, spawn } from "node:child_process";
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
		const s = net.createServer();
		s.listen(0, "127.0.0.1", () => {
			const { port } = s.address();
			s.close(() => resolve(port));
		});
	});
const DESK = Number(process.env.DESK_TEST_PORT) || (await freePort());
const BASE = `http://127.0.0.1:${DESK}`;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "desk-changes-ui-"));
const binDir = path.join(tmp, "bin");
const cwdA = path.join(tmp, "alpha"); // a git repository with known changes
const cwdB = path.join(tmp, "bravo"); // NOT a repository
for (const d of [binDir, cwdA, cwdB]) fs.mkdirSync(d, { recursive: true });

// ── the repository under test ──
const git = (...args) =>
	execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: cwdA, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
git("init", "-q", ".");
fs.writeFileSync(path.join(cwdA, "tracked.txt"), "one\ntwo\nthree\n");
fs.writeFileSync(path.join(cwdA, "other.txt"), "keep\n");
git("add", "-A");
git("commit", "-qm", "base");
fs.writeFileSync(path.join(cwdA, "tracked.txt"), "one\nTWO\nthree\nfour\n"); // +2 −1
fs.writeFileSync(path.join(cwdA, "fresh.md"), "a\nb\nc\n"); // untracked, +3
// so: 2 files, +5 −1

// ── stub pi: identifies itself by its cwd; `settle` fires agent_settled ──
const STUB = `#!/usr/bin/env node
const MARK = require("node:path").basename(process.cwd());
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
const bashes = [];
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
			case "bash":
				bashes.push({ role: "bashExecution", command: cmd.command, output: "", exitCode: 0 });
				say({ type: "response", id: cmd.id, success: true, data: { exitCode: 0 } });
				if (/^settle/.test(cmd.command)) say({ type: "agent_settled" });
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

// Same spies as session-races.e2e.mjs: an SSE listener registered inside the
// EventSource constructor (so it sees an event before app.js does) and a fetch
// wrapper that records a response before the page's own .then runs on it.
const SPY = `
window.__sse = [];
const Native = window.EventSource;
window.EventSource = class extends Native {
	constructor(...a) { super(...a); this.addEventListener("message", (ev) => { try { window.__sse.push(JSON.parse(ev.data)); } catch {} }); }
};
window.__fetched = [];
const nativeFetch = window.fetch;
window.fetch = (...a) => nativeFetch(...a).then((r) => { window.__fetched.push(String(r.url)); return r; });
`;
const SETTLE = 400; // bounded window before a NEGATIVE assertion only

const spawnSession = (cwd) =>
	fetch(`${BASE}/api/spawn`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cwd }) }).then((r) => r.json());
const closePage = async (page) => {
	await page.unrouteAll({ behavior: "ignoreErrors" }).catch(() => {});
	await page.close();
};
const newPage = async (ctx) => {
	const page = await ctx.newPage();
	await page.addInitScript(SPY);
	page.on("pageerror", (e) => { console.log("FAIL page error:", e.message); fails++; });
	return page;
};
const openByMark = async (page, mark) => {
	await page.waitForFunction((m) => [...document.querySelectorAll("#live-list .live-row .cwd")].some((c) => c.textContent === m), mark, { timeout: 15000 });
	await page.click(`#live-list .live-row:has(.cwd:text-is("${mark}"))`);
	await page.waitForSelector("#input", { state: "visible", timeout: 5000 });
};
const barText = (page) => page.evaluate(() => {
	const b = document.getElementById("changes-bar");
	return {
		hidden: !!b?.hidden,
		files: b?.querySelector(".cg-files")?.textContent ?? null,
		add: b?.querySelector(".cg-head .cg-add")?.textContent ?? null,
		del: b?.querySelector(".cg-head .cg-del")?.textContent ?? null,
		rows: [...(b?.querySelectorAll(".cg-row") || [])].map((r) => `${r.querySelector(".cg-st").textContent} ${r.querySelector(".cg-path").textContent}`),
		listHidden: !!b?.querySelector(".cg-list")?.hidden,
	};
});

try {
	for (let i = 0; i < 80; i++) {
		try { await fetch(`${BASE}/api/live`); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 79) throw new Error(`desk server never came up: ${log}`);
	}
	const a = await spawnSession(cwdA);
	const b = await spawnSession(cwdB);
	if (!a.id || !b.id) throw new Error(`spawn failed: ${JSON.stringify([a, b])} ${log}`);

	browser = await chromium.launch();
	const ctx = await browser.newContext();

	// ── 1-4. the bar, the rows, the window, Esc ───────────────────────────────
	{
		const page = await newPage(ctx);
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForSelector("#changes-bar:not([hidden])", { timeout: 15000 });
		let t = await barText(page);
		check("bar: totals for the working tree vs HEAD", t.files === "2 files changed" && t.add === "+5" && t.del === "−1", JSON.stringify(t));
		check("bar: starts collapsed", t.listHidden === true, JSON.stringify(t));

		await page.click(".cg-summary");
		t = await barText(page);
		check("bar: expands in place to one row per file", JSON.stringify(t.rows) === JSON.stringify(["?? fresh.md", "M tracked.txt"]), JSON.stringify(t.rows));

		// 3. a row opens the floating window with that file's diff
		await page.click('.cg-row:has(.cg-path:text-is("tracked.txt"))');
		await page.waitForSelector(".diffwin", { timeout: 10000 });
		await page.waitForFunction(() => document.querySelector(".diffwin .tdiff .dadd"), null, { timeout: 10000 });
		const w = await page.evaluate(() => ({
			path: document.querySelector(".diffwin .dw-path").textContent,
			count: document.querySelector(".diffwin .dw-count").textContent,
			added: [...document.querySelectorAll(".diffwin .tdiff .dadd")].map((d) => d.textContent),
			removed: [...document.querySelectorAll(".diffwin .tdiff .ddel")].map((d) => d.textContent),
			hunks: document.querySelectorAll(".diffwin .tdiff .dhunk").length,
			modal: !!document.querySelector(".diffwin").closest("dialog"),
			composerUsable: !document.getElementById("composer").hidden,
		}));
		check("window: names the file it is showing", w.path === "tracked.txt" && w.count === "+2 −1", JSON.stringify(w).slice(0, 140));
		check("window: added lines are painted as additions", w.added.includes("+TWO") && w.added.includes("+four"), JSON.stringify(w.added));
		check("window: removed lines are painted as deletions", w.removed.includes("-two"), JSON.stringify(w.removed));
		check("window: the hunk header is marked", w.hunks >= 1, String(w.hunks));
		check("window: it is not a blocking modal — the composer is still there", !w.modal && w.composerUsable, JSON.stringify(w));
		// the page stays usable with a diff open
		await page.fill("#input", "still typing");
		check("window: you can keep typing with a diff open", (await page.inputValue("#input")) === "still typing", "");
		await page.fill("#input", "");

		// prev/next walk the list, and stop at its ends
		const nav = await page.evaluate(() => {
			const n = document.querySelectorAll(".diffwin .dw-nav");
			return { prevDisabled: n[0].disabled, nextDisabled: n[1].disabled };
		});
		check("window: ▶ is disabled on the last file, ◀ is not", nav.nextDisabled === true && nav.prevDisabled === false, JSON.stringify(nav));
		await page.click(".diffwin .dw-nav >> nth=0"); // ◀ back to fresh.md
		// wait for the BODY, not the header: loadDiff names the file first and
		// paints when the fetch comes back
		await page.waitForFunction(() => document.querySelector(".diffwin .tdiff")?.textContent.includes("+++ b/fresh.md"), null, { timeout: 10000 });
		const back = await page.evaluate(() => ({
			path: document.querySelector(".diffwin .dw-path").textContent,
			added: [...document.querySelectorAll(".diffwin .tdiff .dadd")].map((d) => d.textContent),
		}));
		check("window: ◀ walks back and repaints", back.path === "fresh.md" && back.added.includes("+a"), JSON.stringify(back).slice(0, 140));
		check("window: ◀ is disabled on the first file", (await page.evaluate(() => document.querySelector(".diffwin .dw-nav").disabled)) === true, "");

		// 4. Esc closes the window and does NOT abort the turn
		await page.press("body", "Escape");
		await page.waitForSelector(".diffwin", { state: "detached", timeout: 5000 });
		await page.waitForTimeout(SETTLE);
		const aborted = await page.evaluate(() => window.__fetched.filter((u) => u.includes("/abort")).length);
		check("Esc: closes the diff window", (await page.locator(".diffwin").count()) === 0, "");
		check("Esc: with a diff open it does NOT abort the turn", aborted === 0, String(aborted));

		// …and with no window open, Esc still does what it always did
		await page.press("body", "Escape");
		await page.waitForFunction(() => window.__fetched.some((u) => u.includes("/abort")), null, { timeout: 10000 });
		check("Esc: with no diff open it still aborts", true, "");

		// ── 5. a settled turn re-reads the tree ──────────────────────────────
		fs.writeFileSync(path.join(cwdA, "later.md"), "later\n"); // +1, untracked
		await page.fill("#input", "!settle now");
		await page.press("#input", "Enter");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "agent_settled"), null, { timeout: 15000 });
		await page.waitForFunction(() => document.querySelector("#changes-bar .cg-files")?.textContent === "3 files changed", null, { timeout: 15000 });
		t = await barText(page);
		check("settled turn: the bar re-read the tree", t.files === "3 files changed" && t.add === "+6" && t.del === "−1", JSON.stringify(t));
		check("settled turn: the new file has a row", t.rows.includes("?? later.md"), JSON.stringify(t.rows));

		// ── 6. switching sessions clears the bar ─────────────────────────────
		await openByMark(page, "bravo");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await page.waitForTimeout(SETTLE);
		t = await barText(page);
		check("switch: a session whose cwd is not a repo shows no bar", t.hidden === true, JSON.stringify(t));
		check("switch: the old session's rows are gone", t.rows.length === 0, JSON.stringify(t.rows));
		await closePage(page);
	}

	// ── 7. a /changes answer for a session you have LEFT never paints ─────────
	{
		const page = await newPage(ctx);
		let release = null;
		let held = 0;
		await page.route(`**/api/session/${a.id}/changes`, async (route) => {
			if (held++ > 0) return route.continue();
			const resp = await route.fetch();
			await new Promise((r) => (release = r)); // hold alpha's answer
			return route.fulfill({ response: resp });
		});
		await page.goto(BASE);
		await openByMark(page, "alpha");
		await page.waitForFunction(() => window.__sse.some((e) => e.type === "desk_hello"));
		await openByMark(page, "bravo");
		await page.waitForFunction(() => document.querySelector("#transcript")?.textContent.includes("marker-bravo"), null, { timeout: 15000 });
		const seen = await page.evaluate((u) => window.__fetched.filter((x) => x.includes(u)).length, `/api/session/${a.id}/changes`);
		release();
		// fence: alpha's held answer has been DELIVERED to the page, so its
		// continuation has run or is one microtask away — then SETTLE
		await page.waitForFunction(
			([u, n]) => window.__fetched.filter((x) => x.includes(u)).length > n,
			[`/api/session/${a.id}/changes`, seen],
			{ timeout: 15000 },
		);
		await page.waitForTimeout(SETTLE);
		const t = await barText(page);
		check("stale: a left session's changes never paint", t.hidden === true && t.rows.length === 0, JSON.stringify(t));
		check("stale: and the pane is still the session you moved to", (await page.textContent("#transcript")).includes("marker-bravo"), "");
		await closePage(page);
	}

	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	await die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message, "\n--- server log ---\n", log.slice(-3000));
	await die(3);
}
