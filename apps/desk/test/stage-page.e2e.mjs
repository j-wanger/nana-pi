// E2E render check for the STAGE HOST page against a STUB pi (no model):
//   1. a stamped block arriving on tool_execution_end renders on stage;
//      an UNSTAMPED one in the same event never does
//   2. reload rebuilds the same stage from get_entries (leafId ancestry)
//   3. a per-row action composes the prompt from the row (stub records it)
//   4. a same-id block replaces IN PLACE (position kept, content updated)
//   5. the gate bar shows a pending select with the drawer COLLAPSED, and
//      after a reload (desk_hello); answering clears it
//   6. the desk's own routes are absent on the app port
//   7. the chat BUBBLE: closed by default, a reading that lands while it is closed
//      shows on the badge, opening clears it; Esc closes
// Run: PW_ROOT=<dir with playwright> node apps/desk/test/stage-page.e2e.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
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

const DESK = Number(process.env.DESK_TEST_PORT || 4421);
const APP = 4422;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The desk imports pi's session parser from the install tied to the `pi` it
// SPAWNS — and this test deliberately puts a stub `pi` first on PATH, which no
// package contains. So the harness names the real package explicitly; without it
// the desk refuses to start rather than guess which install to parse with.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stage-page-"));
const binDir = path.join(tmp, "bin"), appsDir = path.join(tmp, "apps"), cwd = path.join(tmp, "repo");
for (const d of [binDir, appsDir, cwd]) fs.mkdirSync(d, { recursive: true });
const OUT = path.join(tmp, "prompts.jsonl");

const STAMP = { tool: "board_table", args: { board: "general" }, toolCallId: "c1", at: "2026-09-04T00:00:00.000Z" };
const TABLE = { id: "blk_board_general", type: "table", title: "General board", scope: "fixture board", columns: [{ key: "rank", label: "#", type: "number" }, { key: "player", label: "Player" }], rows: [{ rank: 1, player: "Nikola Jokić" }, { rank: 2, player: "Luka Dončić" }], actions: [{ label: "Card", prompt: "Show the player card for {player}", per_row: true }], slot: "main", show: true, produced_by: STAMP };
const CARD = { id: "blk_player_1", type: "card", title: "Nikola Jokić", scope: "fixture card", fields: [{ label: "PTS", value: 29.6 }], slot: "side", show: true, produced_by: { ...STAMP, tool: "player_card", args: { name: "Nikola Jokić" } } };
const UNSTAMPED = { id: "blk_forged", type: "card", title: "FORGED", scope: "x", fields: [{ label: "a", value: 1 }] };

const SIGN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../packages/nana-stage/lib/sign.mjs");
const STUB = `#!/usr/bin/env node
const fs = require("node:fs");
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
// like nana-stage: waiting first, ready shortly after — the page must gate on this
setTimeout(() => say({ type: "extension_ui_request", id: "st-0", method: "setStatus", statusKey: "nana-tools", statusText: "waiting" }), 50);
setTimeout(() => say({ type: "extension_ui_request", id: "st-1", method: "setStatus", statusKey: "nana-tools", statusText: "ready" }), 100);
let signBlock = null; const ready = import(${JSON.stringify(SIGN)}).then((m) => { signBlock = m.signBlock; });
const signed = (b) => ({ ...b, produced_by: { ...b.produced_by, sig: signBlock(process.env.NANA_STAGE_KEY, b) } });
const TABLE = ${JSON.stringify(TABLE)}; const CARD = ${JSON.stringify(CARD)}; const UNSTAMPED = ${JSON.stringify(UNSTAMPED)};
// e1 (user turn) → e2 ABANDONED user turn (branch off e1) → the live branch continues from e1
const entries = [
	{ id: "e1", parentId: null, type: "message", message: { role: "user", content: [{ type: "text", text: "earlier turn" }] } },
	{ id: "e2", parentId: "e1", type: "message", message: { role: "user", content: [{ type: "text", text: "ABANDONED BRANCH TURN" }] } },
];
let n = 1; // leaf pointer stays on the e1 lineage; e2 is a dead branch
const addEntry = (block) => { const id = "e" + (entries.length + 1); entries.push({ id, parentId: "e" + n, type: "custom", customType: "nana-block", data: block }); n = entries.length; };
let leaf = () => "e" + n;
let buf = "";
process.stdin.on("data", (c) => {
	buf += c; let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		const ok = (data) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data });
		switch (cmd.type) {
			case "get_state": ok({ isStreaming: false, isCompacting: false, sessionName: "stub", sessionFile: "/tmp/stage-page-stub.jsonl", model: { provider: "stub", id: "stub" }, thinkingLevel: "off" }); break;
			case "get_entries": ready.then(() => ok({ entries, leafId: leaf() })); break;
			case "prompt": {
				fs.appendFileSync(process.env.STUB_OUT, JSON.stringify({ message: cmd.message }) + "\\n");
				ok({}); say({ type: "agent_start" });
				const msg = cmd.message;
				ready.then(() => {
					const emit = (block, forged) => {
						const sb = signed(block);
						addEntry(sb);
						say({ type: "tool_execution_start", toolCallId: block.produced_by.toolCallId, toolName: block.produced_by.tool, args: block.produced_by.args });
						say({ type: "tool_execution_end", toolCallId: block.produced_by.toolCallId, toolName: block.produced_by.tool, isError: false, result: { content: [{ type: "text", text: "## " + block.title }], details: { blocks: forged ? [sb, UNSTAMPED, { ...CARD, id: "blk_stamped_unsigned" }] : [sb] } } });
					};
					if (/board/i.test(msg)) emit(TABLE, true);
					else if (/player card for (.+)/i.test(msg)) emit({ ...CARD, title: msg.match(/player card for (.+)/i)[1] });
					else if (/update/i.test(msg)) emit({ ...TABLE, title: "General board v2", rows: TABLE.rows.slice(0, 1) });
					if (/two/i.test(msg)) { say({ type: "extension_ui_request", id: "ui-8", method: "confirm", title: "First?" }); say({ type: "extension_ui_request", id: "ui-9", method: "select", title: "Overwrite the board?", options: ["Yes", "No"] }); return; }
					if (/ask/i.test(msg)) { say({ type: "extension_ui_request", id: "ui-9", method: "select", title: "Overwrite the board?", options: ["Yes", "No"] }); return; }
					if (/die/i.test(msg)) { say({ type: "extension_ui_request", id: "ui-7", method: "confirm", title: "Doomed?" }); setTimeout(() => process.exit(3), 300); return; }
					say({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "done." }] } });
					say({ type: "agent_end", messages: [] }); say({ type: "agent_settled" });
				});
				break;
			}
			case "extension_ui_response": say({ type: "agent_end", messages: [] }); say({ type: "agent_settled" }); break;
			default: ok({});
		}
	}
});
process.stdin.on("end", () => process.exit(0));
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });
fs.writeFileSync(path.join(appsDir, "fx.json"), JSON.stringify({ port: APP, title: "fixture app", cwd, tools: ["board_table"], extensions: [], trust: "no-approve" }));

const server = spawn("node", [SERVER], { env: { ...process.env, DESK_PI_ROOT: PI_ROOT, DESK_PORT: String(DESK), DESK_APPS_DIR: appsDir, STUB_OUT: OUT, PATH: `${binDir}${path.delimiter}${process.env.PATH}` }, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));
const A = `http://127.0.0.1:${APP}`;
let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const prompts = () => (fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf-8").trim().split("\n").map((l) => JSON.parse(l).message) : []);
let browser;
const die = (code) => { browser?.close().catch(() => {}); server.kill(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(code); };

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(A + "/api/manifest"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 39) throw new Error("app listener never came up: " + log);
	}
	browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
	const errors = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto(A + "/");
	await page.waitForSelector("#chip.ok", { timeout: 10000 });
	check("page boots, session idle, no page errors", errors.length === 0, errors.join(" | "));
	check("history from entries in the drawer: active branch only (abandoned turn absent)", (await page.locator(".turn.user").count()) === 1 && !/ABANDONED/.test(await page.locator("#turns").textContent()));

	// 7. the bubble: closed by default, the page is all stage; open it to chat
	check("bubble: drawer closed by default", await page.locator("#drawer").evaluate((d) => d.classList.contains("collapsed")) && (await page.locator("#drawer-badge").isHidden()));
	check("bubble: stage spans the full width with the drawer closed", (await page.locator("#stage").evaluate((s) => s.getBoundingClientRect().width)) >= 1200);
	await page.click("#btn-drawer");
	check("bubble: click opens the drawer over the page", !(await page.locator("#drawer").evaluate((d) => d.classList.contains("collapsed"))) && (await page.locator("#btn-drawer").getAttribute("aria-expanded")) === "true");

	// 1. live block renders; forged (unstamped) never does
	await page.fill("#input", "show the general board");
	await page.press("#input", "Enter");
	await page.waitForSelector(".blk[data-id='blk_board_general']", { timeout: 10000 });
	check("stamped table block on stage (main slot)", (await page.locator("#slot-main .blk-table").count()) === 1);
	check("unstamped block in the same event NOT on stage", (await page.locator(".blk[data-id='blk_forged']").count()) === 0);
	check("stamped-but-UNSIGNED block in the same event NOT on stage (server stripped it)", (await page.locator(".blk[data-id='blk_stamped_unsigned']").count()) === 0);
	check("provenance footer shows tool + args + scope", /board_table.*general/.test(await page.locator(".blk-by").first().textContent()) && /fixture board/.test(await page.locator(".blk-scope").first().textContent()));
	check("tool row in the drawer names the block it produced", /General board/.test(await page.locator(".tool-card .targ").first().textContent()));

	// 3. per-row action composes from the row — with the bubble CLOSED (a click on the
	//    dashboard is a complete turn; the reading it produces counts on the badge)
	await page.keyboard.press("Escape");
	check("bubble: Esc closes the drawer", await page.locator("#drawer").evaluate((d) => d.classList.contains("collapsed")));
	await page.locator(".tbl tbody tr").nth(1).locator("button").click();
	await page.waitForSelector(".blk[data-id='blk_player_1']", { timeout: 10000 });
	check("per-row action sent the composed prompt", prompts().at(-1) === "Show the player card for Luka Dončić", prompts().at(-1));
	check("card block lands in the side slot", (await page.locator("#slot-side .blk-card").count()) === 1 && !(await page.locator("#slot-side").isHidden()));
	await page.waitForFunction(() => !document.getElementById("drawer-badge").hidden, null, { timeout: 5000 });
	check("bubble: a reading that settled while closed shows on the badge", (await page.locator("#drawer-badge").textContent()) === "1");
	await page.click("#btn-drawer");
	check("bubble: opening clears the badge", await page.locator("#drawer-badge").isHidden());

	// 4. same-id replace in place
	await page.fill("#input", "update it");
	await page.press("#input", "Enter");
	await page.waitForFunction(() => document.querySelector(".blk[data-id='blk_board_general'] .blk-title")?.textContent === "General board v2", null, { timeout: 10000 });
	const ids = await page.$$eval("#slot-main .blk", (els) => els.map((e) => e.dataset.id));
	check("replaced in place: still one table, one row now", ids.filter((i) => i === "blk_board_general").length === 1 && (await page.locator(".tbl tbody tr").count()) === 1);

	// 2. reload rebuilds from the ledger
	await page.reload();
	await page.waitForSelector(".blk[data-id='blk_board_general']", { timeout: 10000 });
	check("after reload: both blocks back from get_entries, latest version", (await page.locator(".blk").count()) === 2 && (await page.locator(".blk[data-id='blk_board_general'] .blk-title").textContent()) === "General board v2");
	check("after reload: forged block still absent", (await page.locator(".blk[data-id='blk_forged']").count()) === 0);

	// 5. gate bar with the drawer collapsed, survives reload, answer clears
	await page.click("#btn-drawer"); // collapse
	check("drawer collapsed", await page.locator("#drawer").evaluate((d) => d.classList.contains("collapsed")));
	await page.click("#btn-drawer"); await page.fill("#input", "please ask first"); await page.press("#input", "Enter"); await page.click("#btn-drawer");
	await page.waitForSelector("#gate-bar:not([hidden]) .dialog-opt", { timeout: 10000 });
	check("gate bar visible while the drawer is collapsed", await page.locator("#gate-bar").isVisible() && await page.locator("#drawer").evaluate((d) => d.classList.contains("collapsed")));
	await page.reload();
	await page.waitForSelector("#gate-bar:not([hidden]) .dialog-opt", { timeout: 10000 });
	check("gate bar back after reload (desk_hello)", await page.locator("#gate-bar .dialog-title").textContent() === "Overwrite the board?");
	await page.locator("#gate-bar .dialog-opt", { hasText: "Yes" }).click();
	await page.waitForFunction(() => document.getElementById("gate-bar").hidden, null, { timeout: 5000 });
	check("answer clears the gate bar", await page.locator("#gate-bar").isHidden());

	// two dialogs at once: both shown; answering one leaves the other
	await page.click("#btn-drawer"); await page.fill("#input", "two questions"); await page.press("#input", "Enter");
	await page.waitForFunction(() => document.querySelectorAll("#gate-bar .gate").length === 2, null, { timeout: 10000 });
	check("two pending dialogs both on the gate bar", (await page.locator("#gate-bar .gate").count()) === 2);
	await page.locator("#gate-bar .gate").nth(0).locator(".dialog-opt", { hasText: "Yes" }).click();
	await page.waitForFunction(() => document.querySelectorAll("#gate-bar .gate").length === 1, null, { timeout: 5000 });
	check("answering one keeps the other pending and visible", (await page.locator("#gate-bar .gate").count()) === 1 && await page.locator("#gate-bar").isVisible());
	await page.locator("#gate-bar .dialog-opt", { hasText: "No" }).click();
	await page.waitForFunction(() => document.getElementById("gate-bar").hidden, null, { timeout: 5000 });

	// reconnect after missed events: the stage AND the drawer are rebuilt from the ledger
	await page.evaluate(() => window.stage.disconnect());
	await fetch(A + "/api/prompt", { method: "POST", headers: { "content-type": "application/json", origin: A }, body: JSON.stringify({ message: "show the player card for Reconnect Test" }) });
	await new Promise((r) => setTimeout(r, 600));
	check("while disconnected nothing new rendered", (await page.locator(".blk[data-id='blk_player_1'] .blk-title").textContent()) !== "Reconnect Test");
	await page.evaluate(() => window.stage.reconnect());
	await page.waitForFunction(() => document.querySelector(".blk[data-id='blk_player_1'] .blk-title")?.textContent === "Reconnect Test", null, { timeout: 10000 });
	check("after reconnect: missed block on stage from the ledger", true);
	check("after reconnect: drawer rebuilt from the active branch (no abandoned turn, history present)", (await page.locator(".turn.user").count()) >= 1 && !/ABANDONED/.test(await page.locator("#turns").textContent()));

	// child death with a pending dialog: the gate bar is cleared with a notice, not left lying
	await page.fill("#input", "please die"); await page.press("#input", "Enter");
	await page.waitForSelector("#gate-bar:not([hidden]) .dialog-opt", { timeout: 10000 });
	await page.waitForFunction(() => document.getElementById("gate-bar").hidden && document.getElementById("chip").textContent === "exited", null, { timeout: 10000 });
	check("child exit clears stale gates and marks the session exited", true);
	check("no page errors across the run", errors.length === 0, errors.join(" | "));

	// 6. no desk routes here
	check("no /api/live on the app port", (await fetch(A + "/api/live")).status === 404);
} catch (e) {
	console.log("HARNESS ERROR", e, "\n--- server log ---\n" + log.slice(-2000));
	die(3);
}
die(fails ? 1 : 0);
