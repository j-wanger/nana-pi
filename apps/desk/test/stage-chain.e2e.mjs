// E2E, the REAL chain: desk server → basketball app listener → real `pi --mode rpc`
// child with nana-basketball + nana-stage → one model turn → ledger entries.
// Proves: the manifest spawn works with real pi flags, the tools load under -t,
// the block reaches the session as a stamped nana-block entry, the reducer
// rebuilds the stage from get_entries (reload path), and the model-facing text
// is the canonical rendering. One small model call (the app's default model).
//
// Run: node apps/desk/test/stage-chain.e2e.mjs     (needs ~/basketball-geek + uv)
// Exit 0 = pass, 1 = assertion failed, 2 = never settled, 3 = harness error.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { reduceEntries, renderBlockText } from "../../../packages/nana-stage/lib/blocks.mjs";

const DESK = Number(process.env.DESK_TEST_PORT || 4411);
const APP = 4412;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const HERE = path.dirname(new URL(import.meta.url).pathname);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "stage-chain-"));
const appsDir = path.join(tmp, "apps");
fs.mkdirSync(appsDir);
const repo = process.env.BG_REPO || path.join(os.homedir(), "basketball-geek");
fs.writeFileSync(path.join(appsDir, "bg.json"), JSON.stringify({
	port: APP, title: "bg e2e", cwd: repo,
	tools: ["list_boards", "board_table", "player_card"],
	extensions: [path.join(repo, ".pi/extensions/nana-basketball.ts"), path.resolve(HERE, "../../../packages/nana-stage/extensions/nana-stage.ts")],
	trust: "no-approve",
}));

// throwaway stage-key store: this test uses the real HOME, and the desk records a
// signing key per session it spawns — it must not write into the operator's own store.
const server = spawn("node", [SERVER], { env: { ...process.env, DESK_PORT: String(DESK), DESK_APPS_DIR: appsDir, DESK_STAGE_KEYS: path.join(tmp, "stage-keys.json") }, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));
const A = `http://127.0.0.1:${APP}`;
let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const die = (code) => { server.kill(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(code); };

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(A + "/api/manifest"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 39) throw new Error("app listener never came up: " + log);
	}
	const s = await fetch(A + "/api/session", { method: "POST", headers: { "content-type": "application/json", origin: A }, body: "{}" }).then((r) => r.json());
	check("real pi child spawned from the manifest", typeof s.id === "string", JSON.stringify(s));

	// collect events until settled (or exit)
	const events = [];
	const settled = new Promise((resolve) => {
		const ctl = new AbortController();
		fetch(A + "/api/events", { signal: ctl.signal }).then(async (res) => {
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
					try { const e = JSON.parse(line.slice(6)); events.push(e); if (e.type === "agent_settled" || e.type === "desk_exit") { ctl.abort(); resolve(e.type); return; } } catch {}
				}
			}
		}).catch(() => resolve("stream-closed"));
		setTimeout(() => { ctl.abort(); resolve("timeout"); }, 150000);
	});
	await new Promise((r) => setTimeout(r, 500));
	const pr = await fetch(A + "/api/prompt", { method: "POST", headers: { "content-type": "application/json", origin: A }, body: JSON.stringify({ message: "Call board_table with board=general and top=3. Then reply with exactly one word: done" }) }).then((r) => r.json());
	check("prompt accepted", pr.ok === true, JSON.stringify(pr));
	const how = await settled;
	if (how !== "agent_settled") { console.log("never settled:", how, "\n", log.slice(-1500), "\n", JSON.stringify(events.slice(-5))); die(2); }

	const ends = events.filter((e) => e.type === "tool_execution_end" && e.toolName === "board_table");
	check("board_table ran once", ends.length >= 1, String(ends.length));
	const end = ends[0];
	const live = end?.result?.details?.blocks;
	check("live event carries stamped blocks in result.details.blocks", Array.isArray(live) && live.length === 1 && live[0].produced_by?.tool === "board_table" && live[0].produced_by?.args?.board === "general", JSON.stringify(live?.[0]?.produced_by));
	check("live block is the general board, 3 rows", live?.[0]?.id === "blk_board_general" && live?.[0]?.rows?.length === 3);
	const txt = end?.result?.content?.[0]?.text || "";
	check("model-facing text == canonical rendering (tool text dropped)", txt === renderBlockText(live[0]) && !/^board table$/m.test(txt), txt.slice(0, 80));
	check("tool result not an error", end?.isError !== true);

	const ent = await fetch(A + "/api/entries").then((r) => r.json());
	const stage = reduceEntries(ent.entries, ent.leafId);
	check("reload path: reducer over get_entries yields the same block", stage.length === 1 && stage[0].id === "blk_board_general" && JSON.stringify(stage[0]) === JSON.stringify(live[0]));
	const s2 = await fetch(A + "/api/session", { method: "POST", headers: { "content-type": "application/json", origin: A }, body: "{}" }).then((r) => r.json());
	check("reattach returns the same child", s2.id === s.id);
	const m = JSON.parse(fs.readFileSync(path.join(appsDir, "bg.json"), "utf-8"));
	check("manifest.session written back to the real session file", typeof m.session === "string" && fs.existsSync(m.session), String(m.session));
	const bad = await fetch(A + "/api/session/1/bash", { method: "POST", headers: { "content-type": "application/json", origin: A }, body: "{}" });
	check("no bash route on the app port", bad.status === 404);

	// a real malformed request through the full chain: a partial name is REFUSED by the
	// producer (suggestions, isError), so no block is minted and the ledger is unchanged
	const events2 = [];
	const settled2 = new Promise((resolve) => {
		const ctl = new AbortController();
		fetch(A + "/api/events", { signal: ctl.signal }).then(async (res) => {
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
					try { const e = JSON.parse(line.slice(6)); events2.push(e); if (e.type === "agent_settled" || e.type === "desk_exit") { ctl.abort(); resolve(e.type); return; } } catch {}
				}
			}
		}).catch(() => resolve("stream-closed"));
		setTimeout(() => { ctl.abort(); resolve("timeout"); }, 150000);
	});
	await new Promise((r) => setTimeout(r, 300));
	await fetch(A + "/api/prompt", { method: "POST", headers: { "content-type": "application/json", origin: A }, body: JSON.stringify({ message: "Call player_card with name='Jokic' exactly as written (do not correct the spelling, do not call any other tool), then reply with exactly one word: done" }) });
	const how2 = await settled2;
	check("second turn settled", how2 === "agent_settled", how2);
	const pc = events2.filter((e) => e.type === "tool_execution_end" && e.toolName === "player_card");
	check("player_card('Jokic') returned an error with suggestions, no blocks", pc.length >= 1 && (pc[0].isError === true || pc[0].result?.isError === true) && /Did you mean/.test(pc[0].result?.content?.[0]?.text || "") && !(pc[0].result?.details?.blocks || []).length, JSON.stringify({ isError: pc[0]?.isError, resultIsError: pc[0]?.result?.isError, keys: Object.keys(pc[0] || {}), blocks: pc[0]?.result?.details?.blocks, text: pc[0]?.result?.content?.[0]?.text }).slice(0, 400));
	const ent2 = await fetch(A + "/api/entries").then((r) => r.json());
	check("ledger unchanged by the refused call (still one block)", reduceEntries(ent2.entries, ent2.leafId).length === 1);
	check("ledger blocks are signed (sig present on the live block)", typeof live[0].produced_by.sig === "string" && live[0].produced_by.sig.length === 64);
} catch (e) {
	console.log("HARNESS ERROR", e, "\n--- server log ---\n" + log.slice(-2000));
	die(3);
}
die(fails ? 1 : 0);
