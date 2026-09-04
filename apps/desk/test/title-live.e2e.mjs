// E2E: title derivation routes through the live session, not a file append.
//
// Drives the REAL desk server against a STUB `pi` that speaks both modes:
//   --mode rpc  → a live child whose get_state reports a session file
//   -p          → headless title derivation (prints a fixed title)
// HOME is pointed at a temp dir so the server's sessions dir is isolated.
//
// Asserts:
//   1. deriving a title for a file a LIVE child holds → set_session_name RPC
//      lands (live get_state shows the name), a desk_renamed event is
//      broadcast, and the FILE is untouched (pi owns persistence there)
//   2. deriving for a file NO child holds → session_info appended to the file
//   3. /api/rename on the live file → same RPC routing, file untouched
//
// Not part of any suite — run manually: node apps/desk/test/title-live.e2e.mjs
// Exit 0 = pass, 1 = assertion failed, 3 = harness error.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = process.env.DESK_TEST_PORT || 4383;
const BASE = `http://127.0.0.1:${PORT}`;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-title-e2e-"));
const DERIVED = "Stub Derived Title";

// isolated sessions dir (server resolves it from HOME at startup)
const SESS = path.join(TD, ".pi", "agent", "sessions", "--stub--");
fs.mkdirSync(SESS, { recursive: true });
const sessionLine = (id) => JSON.stringify({ type: "session", version: 3, id, timestamp: new Date().toISOString(), cwd: TD });
const userLine = (text) => JSON.stringify({ type: "message", id: "u1", parentId: null, timestamp: new Date().toISOString(), message: { role: "user", content: [{ type: "text", text }] } });
const LIVE_FILE = path.join(SESS, "2026-01-01T00-00-00-000Z_live.jsonl");
const COLD_FILE = path.join(SESS, "2026-01-01T00-00-01-000Z_cold.jsonl");
fs.writeFileSync(LIVE_FILE, `${sessionLine("live-1")}\n${userLine("wire the flux capacitor")}\n`);
fs.writeFileSync(COLD_FILE, `${sessionLine("cold-1")}\n${userLine("polish the chrome dome")}\n`);

// ── stub pi: rpc mode reports LIVE_FILE; -p mode prints the derived title ──
const STUB = `#!/usr/bin/env node
if (process.argv.includes("-p")) { console.log(${JSON.stringify(DERIVED)}); process.exit(0); }
const LIVE_FILE = ${JSON.stringify(LIVE_FILE)};
let sessionName;
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
let buf = "";
process.stdin.on("data", (c) => {
	buf += c.toString();
	let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		const ok = (data) => say({ type: "response", id: cmd.id, success: true, ...(data !== undefined ? { data } : {}) });
		switch (cmd.type) {
			case "get_state": ok({ isStreaming: false, isCompacting: false, sessionName, sessionFile: LIVE_FILE,
				model: { provider: "stub", id: "stub-model" }, thinkingLevel: "off" }); break;
			case "set_session_name": sessionName = cmd.name; ok({}); break;
			case "get_messages": ok({ messages: [] }); break;
			case "get_session_stats": ok({ tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, cost: 0, totalMessages: 0 }); break;
			default: ok({});
		}
	}
});
`;
const binDir = path.join(TD, "bin");
fs.mkdirSync(binDir);
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

const server = spawn("node", [SERVER], {
	env: { ...process.env, HOME: TD, DESK_PORT: String(PORT), PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
	stdio: ["ignore", "pipe", "pipe"],
});
const die = (code) => { server.kill(); fs.rmSync(TD, { recursive: true, force: true }); process.exit(code); };

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const rpc = (id, command) => fetch(`${BASE}/api/session/${id}/rpc`, {
	method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ command }),
}).then((r) => r.json());
const hasNameEntry = (file) => fs.readFileSync(file, "utf-8").includes('"session_info"');

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(BASE + "/api/live"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 39) throw new Error("desk server never came up");
	}
	const spawned = await fetch(BASE + "/api/spawn", {
		method: "POST", headers: { "content-type": "application/json" },
		body: JSON.stringify({ cwd: TD, name: "title-live-e2e" }),
	}).then((r) => r.json());
	if (!spawned.id) throw new Error("spawn failed: " + JSON.stringify(spawned));

	// collect broadcast events for the desk_renamed assertion
	const events = [];
	fetch(`${BASE}/api/session/${spawned.id}/events`).then(async (r) => {
		const dec = new TextDecoder();
		for await (const chunk of r.body) {
			for (const m of dec.decode(chunk).matchAll(/^data: (.*)$/gm)) {
				try { events.push(JSON.parse(m[1])); } catch {}
			}
		}
	}).catch(() => {});

	// ── 1. live session: derivation must land via RPC, not file append ──
	const q = await fetch(BASE + "/api/derive-titles", {
		method: "POST", headers: { "content-type": "application/json" },
		body: JSON.stringify({ files: [LIVE_FILE, COLD_FILE] }),
	}).then((r) => r.json());
	check("both files queued", q.queued === 2);

	let liveName = null;
	for (let t = 0; t < 60; t++) {
		liveName = (await rpc(spawned.id, { type: "get_state" })).data?.sessionName;
		if (liveName) break;
		await new Promise((r) => setTimeout(r, 500));
	}
	check("live child named via set_session_name", liveName === DERIVED);
	check("live session file NOT appended (pi owns persistence)", !hasNameEntry(LIVE_FILE));
	check("desk_renamed broadcast", events.some((e) => e.type === "desk_renamed" && e.name === DERIVED));

	// ── 2. cold session: derivation falls back to a session_info append ──
	for (let t = 0; t < 60 && !hasNameEntry(COLD_FILE); t++) await new Promise((r) => setTimeout(r, 500));
	check("cold session file got session_info append", hasNameEntry(COLD_FILE));

	// ── 3. manual rename of the live file routes through RPC too ──
	await fetch(BASE + "/api/rename", {
		method: "POST", headers: { "content-type": "application/json" },
		body: JSON.stringify({ file: LIVE_FILE, name: "Renamed Live" }),
	}).then((r) => r.json());
	const renamed = (await rpc(spawned.id, { type: "get_state" })).data?.sessionName;
	check("manual rename hit the live child", renamed === "Renamed Live");
	check("manual rename did not append to live file", !hasNameEntry(LIVE_FILE));

	console.log(fails ? `${fails} FAILED` : "ALL PASS");
	die(fails ? 1 : 0);
} catch (e) {
	console.error("E2E error:", e.message);
	die(3);
}
