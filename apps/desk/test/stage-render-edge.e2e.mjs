// Browser E2E for the STAGE RENDERER's hostile/awkward inputs, over a STUB pi.
// Everything here is a block that PASSES validation and carries a real signature,
// i.e. exactly what an app tool can put on the stage:
//   1. a series label carrying markup must render as TEXT in the chart tooltip —
//      it used to go through innerHTML and run with the app origin's authority
//   2. a shape the renderer cannot take (badges: {length: 2}) is rejected by the
//      validator, so it is DROPPED by the page instead of throwing — live and
//      again on the ledger replay after a reload
//   3. legal-but-awkward shapes still draw: rows missing a column's key, an
//      all-null series beside a drawable one, a single-point series
//   4. the drawer's OTHER innerHTML sink (mdToHtml) stays escape-first: markup and
//      a javascript: link in an assistant message render as text, not as elements
//   5. no page errors anywhere in the run
// Run: PW_ROOT=<dir with playwright> node apps/desk/test/stage-render-edge.e2e.mjs
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

const DESK = Number(process.env.DESK_TEST_PORT || 4441);
const APP = 4442;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stage-render-edge-"));
const binDir = path.join(tmp, "bin"), appsDir = path.join(tmp, "apps"), cwd = path.join(tmp, "repo");
for (const d of [binDir, appsDir, cwd]) fs.mkdirSync(d, { recursive: true });

const STAMP = { tool: "screen_detail", args: {}, toolCallId: "c1", at: "2026-09-08T00:00:00.000Z" };
// The payload a hostile/compromised data source can carry into a label: as markup
// it executes; as text it is just an ugly series name.
const XSS = '<img src=x onerror="window.__xssRan = true">';
const CHART_XSS = {
	id: "blk_xss", type: "chart", kind: "line", title: "label injection", scope: "fixture",
	x: { type: "date", label: "week" }, y: { label: "growth" },
	series: [{ key: "s", label: XSS, points: [["2013-01-04", 1], ["2013-01-11", 1.2], ["2013-01-18", 0.9]] }],
	slot: "main", show: true, produced_by: { ...STAMP, toolCallId: "c1" },
};
// Legal today, unrenderable before the validator covered every type's `badges`.
const BAD_BADGES = {
	id: "blk_badges", type: "table", title: "badges shaped wrong", scope: "fixture",
	columns: [{ key: "a", label: "A" }], rows: [{ a: "x" }], badges: { length: 2 },
	slot: "main", show: true, produced_by: { ...STAMP, toolCallId: "c2" },
};
// Awkward but legal: a row missing `salary`, a row missing `player`, a null cell.
const SPARSE = {
	id: "blk_sparse", type: "table", title: "sparse rows", scope: "fixture",
	columns: [{ key: "player", label: "Player" }, { key: "salary", label: "Salary", type: "number" }],
	rows: [{ player: "has both", salary: 4.5 }, { player: "no salary" }, { salary: 1 }, { player: null, salary: null }],
	slot: "main", show: true, produced_by: { ...STAMP, toolCallId: "c3" },
};
// One drawable series + one that is all-null (nothing to plot), and a lone point.
const THIN = {
	id: "blk_thin", type: "chart", kind: "line", title: "thin series", scope: "fixture",
	x: { type: "date" },
	series: [{ key: "a", label: "A", points: [["2013-01-04", 1]] }, { key: "b", label: "B", points: [["2013-01-04", null], ["2013-01-11", null]] }],
	slot: "main", show: true, produced_by: { ...STAMP, toolCallId: "c4" },
};

// The drawer renders assistant text through mdToHtml + innerHTML; md.js is
// escape-first, so this must come out as characters, not as an <img> or an <a>.
const MD_XSS = 'reading: <img src=y onerror="window.__mdXssRan = true"> and [click](javascript:alert(1))';

const SIGN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../packages/nana-stage/lib/sign.mjs");
const STUB = `#!/usr/bin/env node
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
setTimeout(() => say({ type: "extension_ui_request", id: "st-0", method: "setStatus", statusKey: "nana-tools", statusText: "ready" }), 50);
let signBlock = null; const ready = import(${JSON.stringify(SIGN)}).then((m) => { signBlock = m.signBlock; });
const signed = (b) => ({ ...b, produced_by: { ...b.produced_by, sig: signBlock(process.env.NANA_STAGE_KEY, b) } });
const BLOCKS = ${JSON.stringify([CHART_XSS, BAD_BADGES, SPARSE, THIN])};
const MD_XSS = ${JSON.stringify(MD_XSS)};
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
			case "get_state": ok({ isStreaming: false, isCompacting: false, sessionName: "stub", sessionFile: "/tmp/stage-render-edge-stub.jsonl", model: { provider: "stub", id: "stub" }, thinkingLevel: "off" }); break;
			case "get_entries": ready.then(() => ok({ entries, leafId: "e" + entries.length })); break;
			case "prompt": {
				ok({}); say({ type: "agent_start" });
				ready.then(() => {
					for (const block of BLOCKS) {
						const sb = signed(block);
						addEntry(sb);
						say({ type: "tool_execution_start", toolCallId: block.produced_by.toolCallId, toolName: block.produced_by.tool, args: {} });
						say({ type: "tool_execution_end", toolCallId: block.produced_by.toolCallId, toolName: block.produced_by.tool, isError: false, result: { content: [{ type: "text", text: "## " + block.title }], details: { blocks: [sb] } } });
					}
					say({ type: "message_update", assistantMessageEvent: { type: "text_delta", delta: MD_XSS } });
					say({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: MD_XSS }] } });
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
fs.writeFileSync(path.join(appsDir, "fx.json"), JSON.stringify({ port: APP, title: "render fixture", cwd, tools: ["screen_detail"], extensions: [], trust: "no-approve" }));

const server = spawn("node", [SERVER], { env: { ...process.env, DESK_PORT: String(DESK), DESK_APPS_DIR: appsDir, PATH: `${binDir}${path.delimiter}${process.env.PATH}` }, stdio: ["ignore", "pipe", "pipe"] });
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
	const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
	const errors = [];
	page.on("pageerror", (e) => errors.push(e.message));
	await page.goto(A + "/");
	await page.waitForSelector("#chip.ok", { timeout: 10000 });

	await page.evaluate(() => window.stage.compose("draw them"));
	await page.waitForSelector(".blk[data-id='blk_thin']", { timeout: 10000 });

	// 2. unrenderable shape: dropped by the validator, never drawn, nothing thrown
	check("a block the renderer cannot take (badges: {length:2}) is dropped, not thrown on", (await page.locator(".blk[data-id='blk_badges']").count()) === 0 && errors.length === 0, errors.join(" | "));

	// 3. awkward-but-legal shapes still draw
	check("sparse table: every row drawn, missing cells blank", (await page.locator(".blk[data-id='blk_sparse'] .tbl tbody tr").count()) === 4 && (await page.locator(".blk[data-id='blk_sparse'] .tbl tbody tr").nth(1).locator("td").nth(1).textContent()) === "");
	check("thin chart: the drawable series has a path, the all-null one is summarised", (await page.locator(".blk[data-id='blk_thin'] path.series").count()) === 1 && /B: 2 points, no values/.test(await page.locator(".blk[data-id='blk_thin'] .chart-summary").textContent()));

	// 1. the label is TEXT in the tooltip, never markup
	await page.locator(".blk[data-id='blk_xss'] svg.chart rect").hover();
	await page.waitForSelector(".blk[data-id='blk_xss'] .chart-tip:not([hidden])", { timeout: 5000 });
	const tipText = await page.locator(".blk[data-id='blk_xss'] .chart-tip").textContent();
	check("tooltip shows the series label verbatim as text", tipText.includes(XSS), tipText);
	check("the label produced NO element (no <img> parsed out of it)", (await page.locator(".blk[data-id='blk_xss'] .chart-tip img").count()) === 0 && (await page.locator(".blk[data-id='blk_xss'] .chart-tip b").count()) === 1);
	check("no script from the label ran with the app origin's authority", (await page.evaluate(() => window.__xssRan)) === undefined);

	// 4. the drawer's other innerHTML sink: mdToHtml escapes before it transforms
	await page.waitForSelector("#turns .msg.assistant", { state: "attached", timeout: 5000 }); // the drawer is collapsed by default
	const md = page.locator("#turns .msg.assistant").last();
	check("assistant markdown renders markup as text, not as elements", (await md.textContent()).includes("<img src=y onerror=") && (await md.locator("img").count()) === 0);
	check("a javascript: link is not turned into an anchor", (await md.locator("a").count()) === 0);
	check("no script from an assistant message ran", (await page.evaluate(() => window.__mdXssRan)) === undefined);

	// the ledger path repeats both rules after a reload
	await page.reload();
	await page.waitForSelector(".blk[data-id='blk_thin']", { timeout: 10000 });
	check("after reload: replayed from the ledger, unrenderable block still absent", (await page.locator(".blk").count()) === 3 && (await page.locator(".blk[data-id='blk_badges']").count()) === 0);
	check("no page errors across the run", errors.length === 0, errors.join(" | "));
} catch (e) {
	console.log("HARNESS ERROR", e, "\n--- server log ---\n" + log.slice(-2000));
	die(3);
}
die(fails ? 1 : 0);
