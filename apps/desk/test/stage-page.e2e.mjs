// E2E render check for the STAGE HOST page against a STUB pi (no model):
//   1. a stamped block arriving on tool_execution_end renders on stage;
//      an UNSTAMPED one in the same event never does
//   2. reload rebuilds the same stage from get_entries (leafId ancestry)
//   3. a per-row action composes the prompt from the row (stub records it)
//   4. a same-id block replaces IN PLACE (position kept, content updated)
//   5. the gate bar shows a pending select with the drawer COLLAPSED, and
//      after a reload (desk_hello); answering clears it
//   6. the desk's own routes are absent on the app port
// Run: PW_ROOT=<dir with playwright> node apps/desk/test/stage-page.e2e.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
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

const DESK = Number(process.env.DESK_TEST_PORT || 4421);
const APP = 4422;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stage-page-"));
const binDir = path.join(tmp, "bin"), appsDir = path.join(tmp, "apps"), cwd = path.join(tmp, "repo");
for (const d of [binDir, appsDir, cwd]) fs.mkdirSync(d, { recursive: true });
const OUT = path.join(tmp, "prompts.jsonl");

const STAMP = { tool: "board_table", args: { board: "general" }, toolCallId: "c1", at: "2026-09-04T00:00:00.000Z" };
const TABLE = { id: "blk_board_general", type: "table", title: "General board", scope: "fixture board", columns: [{ key: "rank", label: "#", type: "number" }, { key: "player", label: "Player" }], rows: [{ rank: 1, player: "Nikola Jokić" }, { rank: 2, player: "Luka Dončić" }], actions: [{ label: "Card", prompt: "Show the player card for {player}", per_row: true }], slot: "main", show: true, produced_by: STAMP };
const CARD = { id: "blk_player_1", type: "card", title: "Nikola Jokić", scope: "fixture card", fields: [{ label: "PTS", value: 29.6 }], slot: "side", show: true, produced_by: { ...STAMP, tool: "player_card", args: { name: "Nikola Jokić" } } };
const UNSTAMPED = { id: "blk_forged", type: "card", title: "FORGED", scope: "x", fields: [{ label: "a", value: 1 }] };

const STUB = `#!/usr/bin/env node
const fs = require("node:fs");
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
const TABLE = ${JSON.stringify(TABLE)}; const CARD = ${JSON.stringify(CARD)}; const UNSTAMPED = ${JSON.stringify(UNSTAMPED)};
const entries = [{ id: "e1", parentId: null, type: "message", message: { role: "user", content: [{ type: "text", text: "earlier turn" }] } }];
let n = 1;
const addEntry = (block) => { n++; entries.push({ id: "e" + n, parentId: "e" + (n - 1), type: "custom", customType: "nana-block", data: block }); };
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
			case "get_entries": ok({ entries, leafId: "e" + n }); break;
			case "prompt": {
				fs.appendFileSync(process.env.STUB_OUT, JSON.stringify({ message: cmd.message }) + "\\n");
				ok({}); say({ type: "agent_start" });
				const msg = cmd.message;
				const emit = (block, forged) => {
					addEntry(block);
					say({ type: "tool_execution_start", toolCallId: block.produced_by.toolCallId, toolName: block.produced_by.tool, args: block.produced_by.args });
					say({ type: "tool_execution_end", toolCallId: block.produced_by.toolCallId, toolName: block.produced_by.tool, isError: false, result: { content: [{ type: "text", text: "## " + block.title }], details: { blocks: forged ? [block, UNSTAMPED] : [block] } } });
				};
				if (/board/i.test(msg)) emit(TABLE, true);
				else if (/player card for (.+)/i.test(msg)) emit({ ...CARD, title: msg.match(/player card for (.+)/i)[1] });
				else if (/update/i.test(msg)) emit({ ...TABLE, title: "General board v2", rows: TABLE.rows.slice(0, 1) });
				if (/ask/i.test(msg)) { say({ type: "extension_ui_request", id: "ui-9", method: "select", title: "Overwrite the board?", options: ["Yes", "No"] }); break; }
				say({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "done." }] } });
				say({ type: "agent_end", messages: [] }); say({ type: "agent_settled" });
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

const server = spawn("node", [SERVER], { env: { ...process.env, DESK_PORT: String(DESK), DESK_APPS_DIR: appsDir, STUB_OUT: OUT, PATH: `${binDir}${path.delimiter}${process.env.PATH}` }, stdio: ["ignore", "pipe", "pipe"] });
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
	check("history from entries in the drawer", (await page.locator(".turn.user").count()) === 1);

	// 1. live block renders; forged (unstamped) never does
	await page.fill("#input", "show the general board");
	await page.press("#input", "Enter");
	await page.waitForSelector(".blk[data-id='blk_board_general']", { timeout: 10000 });
	check("stamped table block on stage (main slot)", (await page.locator("#slot-main .blk-table").count()) === 1);
	check("unstamped block in the same event NOT on stage", (await page.locator(".blk[data-id='blk_forged']").count()) === 0);
	check("provenance footer shows tool + args + scope", /board_table.*general/.test(await page.locator(".blk-by").first().textContent()) && /fixture board/.test(await page.locator(".blk-scope").first().textContent()));
	check("tool row in the drawer names the block it produced", /General board/.test(await page.locator(".tool-card .targ").first().textContent()));

	// 3. per-row action composes from the row
	await page.locator(".tbl tbody tr").nth(1).locator("button").click();
	await page.waitForSelector(".blk[data-id='blk_player_1']", { timeout: 10000 });
	check("per-row action sent the composed prompt", prompts().at(-1) === "Show the player card for Luka Dončić", prompts().at(-1));
	check("card block lands in the side slot", (await page.locator("#slot-side .blk-card").count()) === 1 && !(await page.locator("#slot-side").isHidden()));

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
	check("no page errors across the run", errors.length === 0, errors.join(" | "));

	// 6. no desk routes here
	check("no /api/live on the app port", (await fetch(A + "/api/live")).status === 404);
} catch (e) {
	console.log("HARNESS ERROR", e, "\n--- server log ---\n" + log.slice(-2000));
	die(3);
}
die(fails ? 1 : 0);
