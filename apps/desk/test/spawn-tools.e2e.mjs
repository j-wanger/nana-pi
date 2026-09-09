// E2E for per-spawn built-in tool narrowing in the spawn picker (2026-09-08,
// work package F, review round 2).
//
// The bug this pins: the picker read the GLOBAL settings and called that the
// "effective set". A trusted project's `.pi/settings.json` defaultTools REPLACES
// the global array (settings.md "Tools"), so a project-enabled tool was missing
// from the picker entirely — visible in the session, impossible to drop. The set
// therefore has to be recomputed from /api/resources on every cwd change AND on
// every flip of the trust box.
//
// Drives the REAL desk page in a browser against the REAL server and a STUB pi
// that records its argv:
//   1. untrusted (trust box off) → the GLOBAL list, labelled "global settings.json"
//   2. trusting the project → the PROJECT list, labelled "project settings.json",
//      including the tool only the project enables
//   3. unchecking that project-enabled tool spawns with `-xt <it>` and never `-t`
//   4. a cwd with no project settings falls back to the global list
//
// Run: node apps/desk/test/spawn-tools.e2e.mjs   (PW_ROOT if playwright is elsewhere)
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
// The desk imports pi's session parser from the install tied to the `pi` it
// SPAWNS — and this test deliberately puts a stub `pi` first on PATH, which no
// package contains. So the harness names the real package explicitly; without it
// the desk refuses to start rather than guess which install to parse with.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-spawn-tools-"));
const PI_DIR = path.join(TD, ".pi", "agent");
const repo = path.join(TD, "repo");
const binDir = path.join(TD, "bin");
const OUT = path.join(TD, "runs.jsonl");
for (const d of [path.join(PI_DIR, "sessions"), path.join(repo, ".pi"), binDir]) fs.mkdirSync(d, { recursive: true });
// global enables read/bash/edit/write; the project ADDS find and drops write —
// a replacement, not a merge, so both differences must show
fs.writeFileSync(path.join(PI_DIR, "settings.json"), JSON.stringify({ defaultTools: ["read", "bash", "edit", "write"] }, null, 2));
fs.writeFileSync(path.join(repo, ".pi", "settings.json"), JSON.stringify({ defaultTools: ["read", "bash", "edit", "find"] }, null, 2));

fs.writeFileSync(path.join(binDir, "pi"), `#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(process.env.STUB_OUT, JSON.stringify({ argv: process.argv.slice(2) }) + "\\n");
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
let buf = "";
process.stdin.on("data", (c) => {
	buf += c; let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const l = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!l.trim()) continue;
		let cmd; try { cmd = JSON.parse(l); } catch { continue; }
		const ok = (d) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data: d });
		if (cmd.type === "get_state") ok({ isStreaming: false, sessionFile: "/tmp/spawn-tools-stub.jsonl", model: { provider: "stub", id: "stub" }, thinkingLevel: "off" });
		else ok({});
	}
});
`, { mode: 0o755 });

const server = spawn("node", [SERVER], {
	env: { ...process.env, DESK_PI_ROOT: PI_ROOT, HOME: TD, DESK_PORT: String(PORT), STUB_OUT: OUT, PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
	stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const argvs = () => (fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf-8").trim().split("\n").filter(Boolean).map((l) => ` ${JSON.parse(l).argv.join(" ")} `) : []);
let browser;
const die = (code) => { browser?.close().catch(() => {}); server.kill(); fs.rmSync(TD, { recursive: true, force: true }); process.exit(code); };

// the tools section redraws async; read it once it names a source
const toolRows = (page) => page.$$eval("#popover .tools-wrap .checkrow", (rs) => rs.map((r) => r.textContent.trim()));
const toolHead = (page) => page.$eval("#popover .tools-wrap .res-head", (h) => h.textContent);
async function toolsShowing(page, pred, what) {
	for (let i = 0; i < 60; i++) {
		try {
			if (pred(await toolRows(page), await toolHead(page))) return;
		} catch {}
		await sleep(100);
	}
	throw new Error(`tools never ${what}: ${JSON.stringify(await toolRows(page).catch(() => null))} / ${await toolHead(page).catch(() => null)}`);
}

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(`${BASE}/api/live`); break; } catch { await sleep(250); }
		if (i === 39) throw new Error(`desk server never came up: ${log}`);
	}
	browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	const errs = [];
	page.on("pageerror", (e) => errs.push(String(e.message)));
	await page.goto(BASE, { waitUntil: "domcontentloaded" });
	await page.click("#btn-spawn");
	await page.waitForSelector("#popover .path-row input");

	// ── navigate to the repo with trust ON (the picker's default) ──
	await page.fill("#popover .path-row input", repo);
	await page.press("#popover .path-row input", "Enter");
	await toolsShowing(page, (rows) => rows.includes("find"), "showed the project set");
	check("a trusted project's defaultTools is the effective set", (await toolRows(page)).join(",") === "read,bash,edit,find", JSON.stringify(await toolRows(page)));
	check("…and the picker says where it came from", /project settings\.json/.test(await toolHead(page)), await toolHead(page));

	// ── 1. untrust → back to the global list, relabelled ──
	await page.uncheck("#popover .spawn-foot .checkrow input");
	await toolsShowing(page, (rows) => rows.includes("write"), "fell back to the global set");
	check("unchecking trust falls back to the GLOBAL list (pi would not read the project file)", (await toolRows(page)).join(",") === "read,bash,edit,write", JSON.stringify(await toolRows(page)));
	check("…relabelled to its real source", /global settings\.json/.test(await toolHead(page)), await toolHead(page));

	// ── 2. re-trust → project again, and drop the project-only tool ──
	await page.check("#popover .spawn-foot .checkrow input");
	await toolsShowing(page, (rows) => rows.includes("find"), "came back to the project set");
	await page.uncheck('#popover .tools-wrap .checkrow:has-text("find") input');
	await page.click('#popover button:has-text("Open here")');
	for (let i = 0; i < 60 && !argvs().length; i++) await sleep(100);
	const a = argvs().at(-1) || "";
	check("dropping a PROJECT-enabled built-in reaches pi as -xt", / -xt find /.test(a), a);
	check("…never as -t, which would drop the extension tools too", !/ -t /.test(a), a);
	check("…and the trust decision still rode along", / -a /.test(a), a);

	// ── 3. a cwd with no project settings uses the global list ──
	await page.click("#kill").catch(() => {});
	await page.keyboard.press("Escape");
	await page.click("#btn-spawn");
	await page.waitForSelector("#popover .path-row input");
	await page.fill("#popover .path-row input", TD);
	await page.press("#popover .path-row input", "Enter");
	await toolsShowing(page, (rows) => rows.includes("write"), "showed the global set");
	check("a cwd with no .pi/settings.json shows the global list", (await toolRows(page)).join(",") === "read,bash,edit,write", JSON.stringify(await toolRows(page)));
	check("no page errors along the way", errs.length === 0, JSON.stringify(errs));

	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message, "\n--- server log ---\n", log.slice(-1500));
	die(3);
}
