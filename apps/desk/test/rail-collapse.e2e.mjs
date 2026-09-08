// E2E for the collapsible sidebar (2026-09-08, work package F).
//
// Drives the REAL desk page in a browser against the REAL server (own port, own
// HOME, no pi needed — nothing here spawns a session):
//   1. the rail starts open, and the masthead's compact "+" is hidden
//   2. the toggle collapses it to zero width, and "+" appears so "open a session"
//      never becomes unreachable
//   3. the choice PERSISTS across a reload (localStorage "nana-code-rail")
//   4. Ctrl/Cmd+B toggles it back, from the page and from inside the composer
//   5. the ≤760px stacked layout collapses too (vertically, not to zero width)
//   6. the compact "+" really opens the spawn popover
//   7. the product name reads "nana code" in <title> and the masthead
//
// Run: node apps/desk/test/rail-collapse.e2e.mjs   (PW_ROOT if playwright is elsewhere)
// Exit 0 = all PASS, 1 = assertion failed, 3 = harness error.
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";

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
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-rail-"));
fs.mkdirSync(path.join(TD, ".pi", "agent", "sessions"), { recursive: true });

const server = spawn("node", [SERVER], {
	env: { ...process.env, HOME: TD, DESK_PORT: String(PORT) },
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

// the collapse animates, so every width/height assertion waits for it to settle
const railBox = (page) => page.evaluate(() => {
	const r = document.getElementById("rail").getBoundingClientRect();
	return { w: r.width, h: r.height };
});
async function settled(page, pred, what) {
	for (let i = 0; i < 60; i++) {
		const b = await railBox(page);
		if (pred(b)) return b;
		await sleep(50);
	}
	throw new Error(`rail never ${what}: ${JSON.stringify(await railBox(page))}`);
}

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(`${BASE}/api/live`); break; } catch { await sleep(250); }
		if (i === 39) throw new Error(`desk server never came up: ${log}`);
	}
	browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
	await page.goto(BASE, { waitUntil: "domcontentloaded" });
	await page.waitForSelector("#rail-toggle");

	// ── 7. the rename is what a user actually sees ──
	check("the page is called \"nana code\"", (await page.title()) === "nana code", await page.title());
	check("…and the masthead says so too", (await page.textContent("#masthead h1")) === "nana code");

	// ── 1. open by default ──
	let box = await railBox(page);
	check("the rail starts open", box.w > 100, JSON.stringify(box));
	check("…the toggle says it is expanded", (await page.getAttribute("#rail-toggle", "aria-expanded")) === "true");
	check("…and the masthead + is hidden while the rail's own spawn button is there", await page.isHidden("#btn-spawn-mast") && await page.isVisible("#btn-spawn"));

	// ── 2. collapse ──
	await page.click("#rail-toggle");
	box = await settled(page, (b) => b.w === 0, "collapsed");
	check("clicking the toggle collapses the rail to zero width", box.w === 0, JSON.stringify(box));
	check("…the toggle says it is collapsed", (await page.getAttribute("#rail-toggle", "aria-expanded")) === "false");
	check("…and the compact + appears, so spawning stays reachable", await page.isVisible("#btn-spawn-mast"));
	check("…nothing inside the folded rail is still focusable", await page.evaluate(() => getComputedStyle(document.getElementById("live-rail")).visibility === "hidden"));
	check("…the preference is stored", (await page.evaluate(() => localStorage.getItem("nana-code-rail"))) === "closed");

	// ── 6. the compact + is a real spawn button ──
	await page.click("#btn-spawn-mast");
	await page.waitForSelector("#popover .pop-title", { timeout: 5000 });
	check("the compact + opens the spawn popover", (await page.textContent("#popover .pop-title")) === "Open a session");
	await page.keyboard.press("Escape");

	// ── 3. it survives a reload ──
	await page.reload({ waitUntil: "domcontentloaded" });
	await page.waitForSelector("#rail-toggle");
	box = await settled(page, (b) => b.w === 0, "collapsed after reload");
	check("the rail is still collapsed after a reload", box.w === 0, JSON.stringify(box));
	check("…and the compact + is still there", await page.isVisible("#btn-spawn-mast"));

	// ── 4. the keyboard shortcut, from the page and from the composer ──
	await page.keyboard.press("Control+b");
	box = await settled(page, (b) => b.w > 100, "re-opened by Ctrl+B");
	check("Ctrl/Cmd+B re-opens the rail", box.w > 100, JSON.stringify(box));
	check("…and the stored preference followed", (await page.evaluate(() => localStorage.getItem("nana-code-rail"))) === "open");
	// the composer's own keydown handler must not swallow it
	await page.evaluate(() => document.getElementById("input").focus());
	await page.keyboard.press("Control+b");
	box = await settled(page, (b) => b.w === 0, "collapsed from the composer");
	check("Ctrl/Cmd+B works with the composer focused", box.w === 0, JSON.stringify(box));
	check("…and typed nothing into it", (await page.inputValue("#input")) === "");
	await page.keyboard.press("Control+b");
	await settled(page, (b) => b.w > 100, "re-opened");

	// ── 5. the stacked (≤760px) layout ──
	await page.setViewportSize({ width: 700, height: 800 });
	box = await settled(page, (b) => b.h > 40, "stacked and open");
	check("stacked layout: the rail is a full-width band", box.w > 600, JSON.stringify(box));
	await page.click("#rail-toggle");
	box = await settled(page, (b) => b.h === 0, "stacked and collapsed");
	check("…and the toggle still collapses it (vertically)", box.h === 0, JSON.stringify(box));
	await page.click("#rail-toggle");
	box = await settled(page, (b) => b.h > 40, "stacked and open again");
	check("…and re-opens it", box.h > 40, JSON.stringify(box));

	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message, "\n--- server log ---\n", log.slice(-1500));
	die(3);
}
