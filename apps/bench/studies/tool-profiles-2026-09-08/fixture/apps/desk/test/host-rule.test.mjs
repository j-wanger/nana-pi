// Security property (2026-09-08): DNS rebinding. The origin rule (origin-rule.test.mjs)
// cannot see this attack — after the rebind, evil.example IS the page's origin and the
// desk answers it same-origin, so every READ (settings incl. MCP credentials, session
// transcripts, live event streams) is readable by the attacker page. The one header that
// still names the attacker is Host, so every request — reads included — must address this
// listener by a loopback name and its own port.
//
// Raw sockets, not fetch(): `host` is a forbidden header for fetch, and the attack is
// exactly "a browser sends its own Host". No pi child is ever spawned.
// Run: node apps/desk/test/host-rule.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const freePort = () =>
	new Promise((resolve) => {
		const srv = net.createServer();
		srv.listen(0, "127.0.0.1", () => {
			const { port } = srv.address();
			srv.close(() => resolve(port));
		});
	});
// ephemeral by default so concurrent runs cannot collide
const PORT = Number(process.env.DESK_TEST_PORT) || (await freePort());
const APP_PORT = await freePort();
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-host-"));
const appsDir = path.join(TD, "apps");
const appCwd = path.join(TD, "repo");
fs.mkdirSync(appsDir, { recursive: true });
fs.mkdirSync(appCwd, { recursive: true });
fs.writeFileSync(path.join(appsDir, "good.json"), JSON.stringify({ port: APP_PORT, cwd: appCwd, tools: ["read"], trust: "no-approve", title: "Good" }));

const server = spawn("node", [SERVER], {
	env: { ...process.env, HOME: TD, DESK_PORT: String(PORT), DESK_APPS_DIR: appsDir },
	stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// raw sockets see the wire, so a chunked body arrives framed — undo that much of it
const dechunk = (raw) => {
	const head = raw.slice(0, raw.indexOf("\r\n\r\n"));
	let body = raw.slice(raw.indexOf("\r\n\r\n") + 4);
	if (!/transfer-encoding:\s*chunked/i.test(head)) return body;
	let out = "";
	while (body) {
		const nl = body.indexOf("\r\n");
		const size = Number.parseInt(body.slice(0, nl), 16);
		if (!Number.isFinite(size) || size === 0) break;
		out += body.slice(nl + 2, nl + 2 + size);
		body = body.slice(nl + 2 + size + 2);
	}
	return out;
};

// raw request; `host === null` sends NO Host header at all (HTTP/1.0)
const raw = (port, method, target, host, extra = "") =>
	new Promise((resolve) => {
		const s = net.connect(port, "127.0.0.1", () => {
			const head = host === null
				? `${method} ${target} HTTP/1.0\r\n${extra}\r\n`
				: `${method} ${target} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n${extra}\r\n`;
			s.write(head);
		});
		let out = "";
		s.on("data", (c) => (out += c));
		s.on("close", () => resolve({ status: Number(out.split(" ")[1]) || 0, body: dechunk(out) }));
		s.on("error", (e) => resolve({ status: 0, body: `ERR ${e.code}` }));
		setTimeout(() => { s.destroy(); resolve({ status: 0, body: "(timeout)" }); }, 4000);
	});

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(`http://127.0.0.1:${PORT}/api/live`); break; } catch { await sleep(250); }
		if (i === 39) throw new Error(`desk server never came up: ${log}`);
	}

	// ── the attack: a rebound page reads the desk's crown jewels ──
	let r = await raw(PORT, "GET", "/api/settings", `evil.example:${PORT}`);
	check("rebound GET /api/settings (Host: evil.example) → 403", r.status === 403, String(r.status));
	check("…and the response body carries no settings", !/settingsPath|mcpServers/.test(r.body), r.body.slice(0, 120));
	for (const [what, target] of [["transcripts", "/api/sessions"], ["live children", "/api/live"], ["the page itself", "/"]]) {
		r = await raw(PORT, "GET", target, "attacker.test");
		check(`rebound GET ${target} (${what}) → 403`, r.status === 403, String(r.status));
	}
	r = await raw(PORT, "POST", "/api/spawn", `evil.example:${PORT}`, "content-type: application/json\r\ncontent-length: 2\r\n\r\n{}");
	check("rebound POST /api/spawn → 403", r.status === 403, String(r.status));

	// ── loopback names still work, including the spellings the desk links to ──
	for (const host of [`127.0.0.1:${PORT}`, `localhost:${PORT}`, `[::1]:${PORT}`, `LOCALHOST:${PORT}`]) {
		r = await raw(PORT, "GET", "/api/live", host);
		check(`Host: ${host} → 200`, r.status === 200, String(r.status));
	}
	r = await raw(PORT, "GET", "/api/live", null);
	check("no Host at all (HTTP/1.0, non-browser) → 200, like the no-Origin rule", r.status === 200, String(r.status));
	r = await raw(PORT, "GET", "/api/live", "127.0.0.1:9999");
	check("right host, WRONG port → 403 (a rebind names its own port)", r.status === 403, String(r.status));
	r = await raw(PORT, "GET", "/api/live", "127.0.0.1");
	check("loopback with no port → 403 (this listener is not on :80)", r.status === 403, String(r.status));

	// names that RESOLVE to loopback but are not loopback names — the rebind shapes
	r = await raw(PORT, "GET", "/api/settings", `127.0.0.1.nip.io:${PORT}`);
	check("nip.io-style name that resolves to 127.0.0.1 → 403", r.status === 403, String(r.status));
	r = await raw(PORT, "GET", "/api/settings", `127.0.0.1.:${PORT}`);
	check("trailing-dot host (127.0.0.1.) → 403", r.status === 403, String(r.status));
	r = await raw(PORT, "GET", "/api/settings", `localhost.evil.example:${PORT}`);
	check("a foreign name PREFIXED by localhost → 403", r.status === 403, String(r.status));

	// absolute-form request target: the Host header still decides
	r = await raw(PORT, "GET", `http://evil.example/api/live`, "evil.example");
	check("absolute-form target with a foreign Host → 403", r.status === 403, String(r.status));
	r = await raw(PORT, "GET", `http://evil.example/api/live`, `127.0.0.1:${PORT}`);
	check("absolute-form target cannot smuggle a foreign authority past the Host rule", r.status === 200, String(r.status));
	r = await raw(PORT, "GET", `http://127.0.0.1:${PORT}/api/live`, `127.0.0.1:${PORT}`);
	check("absolute-form loopback target routes normally", r.status === 200 && r.body.trim().startsWith("["), `${r.status} ${r.body.slice(0, 40)}`);

	// ── the same rule guards every app listener, on its own port ──
	r = await raw(APP_PORT, "GET", "/api/manifest", `evil.example:${APP_PORT}`);
	check("app listener: rebound GET /api/manifest → 403", r.status === 403, String(r.status));
	r = await raw(APP_PORT, "GET", "/", "attacker.test");
	check("app listener: rebound GET / (the app page) → 403", r.status === 403, String(r.status));
	r = await raw(APP_PORT, "POST", "/api/session", `evil.example:${APP_PORT}`, "content-type: application/json\r\ncontent-length: 2\r\n\r\n{}");
	check("app listener: rebound POST /api/session → 403 (no child spawned)", r.status === 403, String(r.status));
	r = await raw(APP_PORT, "GET", "/api/manifest", `127.0.0.1:${APP_PORT}`);
	check("app listener: loopback Host → 200", r.status === 200, String(r.status));
	r = await raw(APP_PORT, "GET", "/api/manifest", `127.0.0.1:${PORT}`);
	check("app listener: the DESK's port in Host → 403 (each listener owns one origin)", r.status === 403, String(r.status));

	check("no child was spawned by any of it", JSON.parse((await raw(PORT, "GET", "/api/live", `127.0.0.1:${PORT}`)).body).length === 0);
} catch (e) {
	console.log("HARNESS ERROR", e.message, "\n--- server log ---\n", log.slice(-2000));
	fails = 99;
} finally {
	server.kill();
	await sleep(200);
	fs.rmSync(TD, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
