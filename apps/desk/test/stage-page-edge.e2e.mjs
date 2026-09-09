// Browser E2E for the slice-2 seam: an app's OWN page (edge-screener/desk) over a stub pi.
// Proves the contract the chain test cannot: app-owned views paint from /api/data/*; a
// mutating tool's tool_execution_end → stage.js dispatches agent:changed → app.js re-fetches
// the shelf and the DOM changes; the chart block renders (SVG path + legend + table view).
// Run: PW_ROOT=<dir with playwright> node apps/desk/test/stage-page-edge.e2e.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { resolvePiBin, resolvePiPackage } from "../pi-session.mjs";

function resolvePlaywright() {
	const roots = [process.env.PW_ROOT, path.dirname(new URL(import.meta.url).pathname)].filter(Boolean);
	for (const r of roots) {
		const req = createRequire(path.join(r, "package.json"));
		for (const name of ["playwright", "playwright-core"]) { try { return req(name); } catch {} }
	}
	throw new Error("playwright not found — set PW_ROOT");
}
const { chromium } = resolvePlaywright();

const DESK = Number(process.env.DESK_TEST_PORT || 4431);
const APP = 4432;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The desk imports pi's session parser from the install tied to the `pi` it
// SPAWNS — and this test deliberately puts a stub `pi` first on PATH, which no
// package contains. So the harness names the real package explicitly; without it
// the desk refuses to start rather than guess which install to parse with.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const pageDir = process.env.EDGE_PAGE || path.join(os.homedir(), "edge-screener", "desk");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stage-page-edge-"));
const binDir = path.join(tmp, "bin"), appsDir = path.join(tmp, "apps"), cwd = path.join(tmp, "repo");
for (const d of [binDir, appsDir, cwd]) fs.mkdirSync(d, { recursive: true });
const COUNTER = path.join(tmp, "shelf-calls");
fs.writeFileSync(COUNTER, "0");

// data commands: the shelf grows by one exploratory item per call (so a refresh is observable)
const shelfCmd = ["node", "-e", `const fs=require("node:fs");const n=Number(fs.readFileSync(${JSON.stringify(COUNTER)},"utf-8"))+1;fs.writeFileSync(${JSON.stringify(COUNTER)},String(n));const items=[{path:"reports/edge-verdict-corrected-live.md",kind:"verdicts",bytes:1,mtime:"2026-07-20T00:00:00Z"}];for(let i=0;i<n;i++)items.push({path:"reports/explore/x"+i+".md",kind:"exploratory",bytes:1,mtime:"2026-09-0"+(i+1)+"T00:00:00Z"});console.log(JSON.stringify({items}))`];
const tapeCmd = ["node", "-e", `console.log(JSON.stringify({label:"live",symbols:504,start:"2010-01-04",end:"2026-05-29",n_bars:4126,source:"yfinance"}))`];
const rosterCmd = ["node", "-e", `console.log(JSON.stringify({personas:[{id:"p",name:"Breakout Rider",tolerance_pct:25,engine:"x",candidate:false,last:{session:"s",direction:"high_52w",in_mandate:"0/4",signal:"refined"}}]}))`];

const STAMP = { tool: "explore_screen", args: { screen: "high_52w" }, toolCallId: "c1", at: "2026-09-04T00:00:00.000Z" };
const TABLE = { id: "blk_explore_high_52w", type: "table", title: "high_52w — would hold today (exploratory)", scope: "fixture", columns: [{ key: "rank", label: "#", type: "number" }, { key: "symbol", label: "Symbol" }], rows: [{ rank: 1, symbol: "NVDA" }], note: "NOT A VERDICT", slot: "main", show: true, produced_by: STAMP };
const CHART = { id: "blk_oos_x", type: "chart", kind: "line", title: "x — OOS growth of $1 vs SPY", scope: "fixture", x: { type: "date", label: "week" }, y: { label: "growth of $1" }, series: [{ key: "s", label: "x", points: [["2013-01-04", 1], ["2013-01-11", 1.1], ["2013-01-18", 1.3]] }, { key: "spy", label: "SPY", points: [["2013-01-04", 1], ["2013-01-11", 1.02], ["2013-01-18", 1.01]] }], slot: "main", show: true, produced_by: { ...STAMP, tool: "screen_detail", args: { screen: "x" }, toolCallId: "c2" } };

const SIGN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../packages/nana-stage/lib/sign.mjs");
const STUB = `#!/usr/bin/env node
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
// like nana-stage: waiting first, ready shortly after — the page must gate on this
setTimeout(() => say({ type: "extension_ui_request", id: "st-0", method: "setStatus", statusKey: "nana-tools", statusText: "waiting" }), 50);
setTimeout(() => say({ type: "extension_ui_request", id: "st-1", method: "setStatus", statusKey: "nana-tools", statusText: "ready" }), 100);
let signBlock = null; const ready = import(${JSON.stringify(SIGN)}).then((m) => { signBlock = m.signBlock; });
const signed = (b) => ({ ...b, produced_by: { ...b.produced_by, sig: signBlock(process.env.NANA_STAGE_KEY, b) } });
const TABLE = ${JSON.stringify(TABLE)}; const CHART = ${JSON.stringify(CHART)};
const entries = [{ id: "e1", parentId: null, type: "message", message: { role: "user", content: [{ type: "text", text: "earlier" }] } }];
const addEntry = (block) => entries.push({ id: "e" + (entries.length + 1), parentId: "e" + entries.length, type: "custom", customType: "nana-block", data: block });
let buf = "";
process.stdin.on("data", (c) => {
	buf += c; let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		const ok = (data) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data });
		switch (cmd.type) {
			case "get_state": ok({ isStreaming: false, isCompacting: false, sessionName: "stub", sessionFile: "/tmp/stage-page-edge-stub.jsonl", model: { provider: "stub", id: "stub" }, thinkingLevel: "off" }); break;
			case "get_entries": ready.then(() => ok({ entries, leafId: "e" + entries.length })); break;
			case "prompt": {
				ok({}); say({ type: "agent_start" });
				ready.then(() => {
					const emit = (block) => { const sb = signed(block); addEntry(sb);
						say({ type: "tool_execution_start", toolCallId: block.produced_by.toolCallId, toolName: block.produced_by.tool, args: block.produced_by.args });
						say({ type: "tool_execution_end", toolCallId: block.produced_by.toolCallId, toolName: block.produced_by.tool, isError: false, result: { content: [{ type: "text", text: "## " + block.title }], details: { blocks: [sb] } } }); };
					if (/explore/i.test(cmd.message)) emit(TABLE);
					if (/chart/i.test(cmd.message)) emit(CHART);
					say({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: "done." }] } });
					say({ type: "agent_end", messages: [] }); say({ type: "agent_settled" });
				});
				break;
			}
			default: ok({});
		}
	}
});
process.stdin.on("end", () => process.exit(0));
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });
fs.writeFileSync(path.join(appsDir, "edge.json"), JSON.stringify({ port: APP, title: "edge fixture", cwd, tools: ["screen_detail", "explore_screen"], extensions: [], trust: "no-approve", mutating: ["explore_screen"], page: pageDir, data: { tape: tapeCmd, shelf: shelfCmd, roster: rosterCmd }, quick: [["panel", "Show the panel"]] }));

const server = spawn("node", [SERVER], { env: { ...process.env, DESK_PI_ROOT: PI_ROOT, DESK_PORT: String(DESK), DESK_APPS_DIR: appsDir, PATH: `${binDir}${path.delimiter}${process.env.PATH}` }, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));
const A = `http://127.0.0.1:${APP}`;
let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
let browser;
const die = (code) => { browser?.close().catch(() => {}); server.kill(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(code); };

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(A + "/api/manifest"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 39) throw new Error("app listener never came up: " + log);
	}
	browser = await chromium.launch();
	const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
	const errors = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto(A + "/");
	await page.waitForSelector("#chip.ok", { timeout: 10000 });
	await page.waitForSelector("#view-shelf .shelf-item", { timeout: 5000 });
	check("edge page boots on the stub with no page errors", errors.length === 0, errors.join(" | "));
	check("send enabled only after the observed waiting→ready report (session.tools = ready)", (await page.evaluate(() => document.getElementById("btn-send").disabled)) === false && (await page.evaluate(() => window.stage.blocks.length === 0)));
	check("app-owned views painted from /api/data: tape, roster, shelf", (await page.textContent('[data-view="tape"]')).includes("2010-01-04") && (await page.textContent('[data-view="roster"]')).includes("Breakout Rider") && (await page.textContent("#view-shelf .count")) === "(2)");
	check("per-app quick prompt rendered from the manifest", (await page.textContent("#quick")).includes("panel"));

	// mutation → agent:changed → shelf refetch → DOM changes
	const calls0 = Number(fs.readFileSync(COUNTER, "utf-8"));
	await page.evaluate(() => window.stage.compose("explore high_52w"));
	await page.waitForFunction(() => document.querySelector("#view-shelf .count")?.textContent === "(3)", null, { timeout: 8000 });
	check("mutating tool end → agent:changed → shelf re-fetched and re-painted", Number(fs.readFileSync(COUNTER, "utf-8")) === calls0 + 1 && (await page.textContent("#view-shelf")).includes("explore/x1.md"));
	check("the explore table landed on the stage with its note", (await page.textContent("#slot-main")).includes("NOT A VERDICT"));
	// a non-mutating tool must NOT refetch
	await page.evaluate(() => window.stage.compose("show the chart"));
	await page.waitForSelector(".blk-chart svg.chart path.series", { timeout: 8000 });
	await page.waitForTimeout(400);
	check("non-mutating tool → no shelf refetch", Number(fs.readFileSync(COUNTER, "utf-8")) === calls0 + 1 && (await page.textContent("#view-shelf .count")) === "(3)");
	check("chart renders: 2 series paths, legend with 2 keys, y ticks", (await page.$$(".blk-chart path.series")).length === 2 && (await page.$$(".chart-legend .lg-item")).length === 2 && (await page.$$(".chart text.tick")).length >= 4);
	await page.click(".chart-foot .btn");
	check("chart table view lists the points", (await page.textContent(".chart-table")).includes("2013-01-18") && (await page.textContent(".chart-table")).includes("1.3"));
	// reload: app views repaint, stage replays both blocks from the ledger
	await page.reload();
	await page.waitForSelector("#chip.ok", { timeout: 10000 });
	await page.waitForFunction(() => window.stage?.blocks?.length === 2, null, { timeout: 8000 });
	await page.waitForSelector('[data-view="tape"] dd', { timeout: 5000 });
	check("reload: both blocks replayed from the ledger; app views repainted", (await page.$$(".blk")).length === 2 && (await page.textContent('[data-view="tape"]')).includes("504"), `${(await page.$$(".blk")).length} blocks; tape=${(await page.textContent('[data-view="tape"]')).slice(0, 60)}`);
} catch (e) {
	console.log("HARNESS ERROR", e, "\n--- server log ---\n" + log.slice(-2000));
	die(3);
}
die(fails ? 1 : 0);
