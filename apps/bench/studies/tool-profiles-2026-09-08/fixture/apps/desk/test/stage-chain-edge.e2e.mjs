// E2E, the REAL MCP chain (slice 2): desk server → edge app listener → real `pi --mode rpc`
// child with pi-mcp-adapter (direct tools from edge-screener/.pi/mcp.json, bounded result
// details) + nana-stage → one model turn → card + chart blocks from a Python MCP server.
// Proves: the details.mcpResult path carries blocks; nana-stage stamps/signs them and the
// model reads the canonical rendering; the ledger replays them; the app page + data routes
// serve; and — in a second child with a tiny detailsMaxBytes — an over-cap result is turned
// into an error naming the cap, with nothing minted.
//
// Run: node apps/desk/test/stage-chain-edge.e2e.mjs     (needs ~/edge-screener + uv + pi-mcp-adapter)
// Exit 0 = pass, 1 = assertion failed, 2 = never settled, 3 = harness error.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { reduceEntries, renderBlockText } from "../../../packages/nana-stage/lib/blocks.mjs";

const DESK = Number(process.env.DESK_TEST_PORT || 4421);
const APP = 4422, APP2 = 4423;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const HERE = path.dirname(new URL(import.meta.url).pathname);
const repo = process.env.EDGE_REPO || path.join(os.homedir(), "edge-screener");
const adapter = process.env.MCP_ADAPTER || path.join(os.homedir(), ".pi/agent/npm/node_modules/pi-mcp-adapter/index.ts");
const stage = path.resolve(HERE, "../../../packages/nana-stage/extensions/nana-stage.ts");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stage-chain-edge-"));
const appsDir = path.join(tmp, "apps");
fs.mkdirSync(appsDir);
const TOOLS = ["screen_panel", "screen_detail", "construction_table", "stop_table", "direction_board", "explore_screen"];
fs.writeFileSync(path.join(appsDir, "edge.json"), JSON.stringify({
	port: APP, title: "edge e2e", cwd: repo, tools: TOOLS, extensions: [adapter, stage], trust: "no-approve", mutating: ["explore_screen"],
	page: path.join(repo, "desk"),
	data: { tape: ["uv", "run", "python", "-m", "edge_screener.desk.data", "tape"] },
}));
// overflow child: a cwd whose .pi/mcp.json caps details at 512 bytes; the server still reads the real repo
const tinyCwd = path.join(tmp, "tiny");
fs.mkdirSync(path.join(tinyCwd, ".pi"), { recursive: true });
fs.writeFileSync(path.join(tinyCwd, ".pi/mcp.json"), JSON.stringify({
	settings: { directToolResultDetails: "bounded", outputGuard: { detailsMaxBytes: 512 } },
	mcpServers: { "edge-desk": { command: "uv", args: ["run", "--project", repo, "python", "-m", "edge_screener.desk.mcp_server"], env: { EDGE_DESK_ROOT: repo }, directTools: true, toolPrefix: "none", lifecycle: "eager" } },
}));
fs.writeFileSync(path.join(appsDir, "tiny.json"), JSON.stringify({ port: APP2, title: "edge tiny", cwd: tinyCwd, tools: TOOLS, extensions: [adapter, stage], trust: "no-approve" }));

const server = spawn("node", [SERVER], { env: { ...process.env, DESK_PORT: String(DESK), DESK_APPS_DIR: appsDir }, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));
const A = `http://127.0.0.1:${APP}`, T = `http://127.0.0.1:${APP2}`;
let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const die = (code) => { server.kill(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(code); };
const post = (base, p, body) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json", origin: base }, body: JSON.stringify(body) }).then((r) => r.json());

// run one prompt on an app port; resolve with {how, events} at agent_settled
function turn(base, message, ms = 240000) {
	return new Promise(async (resolve) => {
		const events = [];
		const ctl = new AbortController();
		let how = "timeout";
		const stream = fetch(base + "/api/events", { signal: ctl.signal }).then(async (res) => {
			const reader = res.body.getReader();
			let buf = "";
			for (;;) {
				const { value, done } = await reader.read();
				if (done) break;
				buf += new TextDecoder().decode(value);
				let i;
				while ((i = buf.indexOf("\n\n")) >= 0) {
					const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
					const line = chunk.split("\n").find((l) => l.startsWith("data: "));
					if (!line) continue;
					try { const e = JSON.parse(line.slice(6)); events.push(e); if (e.type === "agent_settled" || e.type === "desk_exit") { how = e.type; ctl.abort(); return; } } catch {}
				}
			}
		}).catch(() => {});
		const timer = setTimeout(() => ctl.abort(), ms);
		await new Promise((r) => setTimeout(r, 400));
		const pr = await post(base, "/api/prompt", { message });
		if (!pr.ok) { clearTimeout(timer); ctl.abort(); return resolve({ how: "rejected:" + pr.error, events }); }
		await stream;
		clearTimeout(timer);
		resolve({ how, events });
	});
}
const ends = (events, tool) => events.filter((e) => e.type === "tool_execution_end" && e.toolName === tool);

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(A + "/api/manifest"); await fetch(T + "/api/manifest"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 39) throw new Error("app listeners never came up: " + log);
	}
	// page + data served before any session exists
	check("edge page served from the repo's desk/ dir", /edge desk/.test(await fetch(A + "/").then((r) => r.text())));
	const tape = await post(A, "/api/data/tape", {});
	check("data/tape runs the repo's data command", tape.label === "live" && tape.symbols > 500, JSON.stringify(tape).slice(0, 120));

	const s = await post(A, "/api/session", {});
	check("real pi child spawned from the manifest", typeof s.id === "string", JSON.stringify(s));
	// POST /api/session is held until nana-stage reports the manifest's tools active (or names the
	// missing ones) — the adapter registers direct tools asynchronously; the desk does not guess.
	check("session reports its tools READY (nana-stage status via RPC), no sleep", s.tools === "ready", String(s.tools));

	const t1 = await turn(A, "Call the screen_detail tool with screen=amihud_illiquidity. Then reply with exactly one word: done");
	if (t1.how !== "agent_settled") { console.log("turn 1 never settled:", t1.how, "\n", log.slice(-2500), "\n", JSON.stringify(t1.events.slice(-4)).slice(0, 1500)); die(2); }
	const hello1 = t1.events.find((e) => e.type === "desk_hello");
	check("desk_hello carries nana-stage's own report (statuses.nana-tools = ready) — readiness was observed, not defaulted", hello1?.statuses?.["nana-tools"] === "ready", JSON.stringify(hello1?.statuses));
	const e1 = ends(t1.events, "screen_detail");
	check("screen_detail ran as a DIRECT tool (its own tool_execution_end, not the mcp proxy)", e1.length >= 1, `ends: ${t1.events.filter((e) => e.type === "tool_execution_end").map((e) => e.toolName).join(",")}`);
	const end = e1[0];
	const live = end?.result?.details?.blocks || [];
	check("MCP path: two stamped blocks (card + chart) in result.details.blocks", live.length === 2 && live.map((b) => b.type).join() === "card,chart" && live.every((b) => b.produced_by?.tool === "screen_detail" && b.produced_by?.args?.screen === "amihud_illiquidity"), JSON.stringify(live.map((b) => [b.type, b.produced_by?.tool]))); 
	check("blocks are signed", live.every((b) => typeof b.produced_by?.sig === "string" && b.produced_by.sig.length === 64));
	check("raw MCP carrier stripped from the live event (no unstamped blocks under mcpResult)", !(end?.result?.details?.mcpResult?.structuredContent?.blocks), Object.keys(end?.result?.details?.mcpResult?.structuredContent || {}).join(","));
	const txt = end?.result?.content?.[0]?.text || "";
	check("model-facing text == canonical rendering of both blocks", live.length === 2 && txt === live.map(renderBlockText).join("\n\n"), txt.slice(0, 120));
	check("chart block is the 675-point weekly OOS series with a scope naming the frame", live[1]?.series?.[0]?.points?.length > 500 && /initial_train=756/.test(live[1]?.scope || ""));
	check("tool result not an error", end?.isError !== true && end?.result?.isError !== true);
	const ent = await fetch(A + "/api/entries").then((r) => r.json());
	const stageBlocks = reduceEntries(ent.entries, ent.leafId);
	check("reload path: ledger reduces to the same two blocks", stageBlocks.length === 2 && JSON.stringify(stageBlocks) === JSON.stringify(live));

	// the mutating tool: writes ONE file under reports/explore/, and the event names a mutating tool
	const before = new Set(fs.existsSync(path.join(repo, "reports/explore")) ? fs.readdirSync(path.join(repo, "reports/explore")) : []);
	const t2 = await turn(A, "Call the explore_screen tool with screen=high_52w. Then reply with exactly one word: done");
	check("explore turn settled", t2.how === "agent_settled", t2.how);
	const e2 = ends(t2.events, "explore_screen");
	const after = fs.existsSync(path.join(repo, "reports/explore")) ? fs.readdirSync(path.join(repo, "reports/explore")).filter((f) => !before.has(f)) : [];
	check("explore_screen produced a table block and exactly one new report under reports/explore/", e2.length >= 1 && (e2[0].result?.details?.blocks || []).length === 1 && after.length === 1 && /-high_52w\.md$/.test(after[0]), JSON.stringify(after));
	check("explore block carries the NOT A VERDICT note", /NOT A VERDICT/.test(e2[0]?.result?.details?.blocks?.[0]?.note || ""));
	for (const f of after) fs.rmSync(path.join(repo, "reports/explore", f)); // leave the repo as found

	// a refused call through the chain: partial name → error with suggestions, nothing minted
	const t3 = await turn(A, "Call the screen_detail tool with screen=amihud exactly as written (do not correct it, do not call any other tool), then reply with exactly one word: done");
	const e3 = ends(t3.events, "screen_detail");
	check("refused call: isError with suggestions, no blocks, ledger unchanged", t3.how === "agent_settled" && e3.length >= 1 && (e3[0].isError === true || e3[0].result?.isError === true) && /amihud_illiquidity/.test(e3[0].result?.content?.[0]?.text || "") && !(e3[0].result?.details?.blocks || []).length, JSON.stringify({ how: t3.how, text: e3[0]?.result?.content?.[0]?.text?.slice(0, 160) }));
	const ent3 = await fetch(A + "/api/entries").then((r) => r.json());
	check("ledger has exactly the 3 blocks so far (card, chart, explore table)", reduceEntries(ent3.entries, ent3.leafId).length === 3);

	// ── overflow: the second child's adapter caps details at 512 bytes ──
	const s2 = await post(T, "/api/session", {});
	check("tiny-cap child spawned and READY", typeof s2.id === "string" && s2.tools === "ready", JSON.stringify(s2));
	const t4 = await turn(T, "Call the screen_panel tool. Then reply with exactly one word: done");
	const e4 = ends(t4.events, "screen_panel");
	check("over-cap MCP result → nana-stage error naming the cap, nothing on stage", t4.how === "agent_settled" && e4.length >= 1 && (e4[0].isError === true || e4[0].result?.isError === true) && /detailsMaxBytes/.test(e4[0].result?.content?.[0]?.text || "") && !(e4[0].result?.details?.blocks || []).length, JSON.stringify({ how: t4.how, err: e4[0]?.isError ?? e4[0]?.result?.isError, text: e4[0]?.result?.content?.[0]?.text?.slice(0, 200), keys: Object.keys(e4[0]?.result?.details || {}) }));
	const ent4 = await fetch(T + "/api/entries").then((r) => r.json());
	check("tiny-cap ledger holds no blocks", reduceEntries(ent4.entries, ent4.leafId).length === 0);
} catch (e) {
	console.log("HARNESS ERROR", e, "\n--- server log ---\n" + log.slice(-2500));
	die(3);
}
die(fails ? 1 : 0);
