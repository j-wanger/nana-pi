// Bounded-buffer property (2026-09-09): a LOCAL producer — a pi child, an extension
// inside it, an app `data` command, or a browser tab that stops reading — cannot grow
// this process without bound, and cannot cost the operator the other sessions. The desk
// is ONE Node process holding every live session, so "runs out of memory" is a
// whole-desk outage, not a failed request.
//
// Drives the REAL server (ephemeral ports, own HOME, own apps dir) against a STUB `pi`,
// with the four caps lowered by env (the DESK_KILL_GRACE_MS / DESK_DATA_TIMEOUT_MS
// pattern) so each one is reached in milliseconds instead of gigabytes.
// Every case FAILS on the pre-fix code:
//   1. a child stdout line 2× the cap with no newline — pre-fix: `pending` grows
//      forever; the RPC whose response it was hangs until its 600 s timer
//   1b. a COMPLETE line one character over the cap, newline and all — pre-fix the
//      remainder check never sees it, so it is parsed and broadcast like any other
//      event and "past the cap is discarded" is false (sol review, finding A)
//   2. an SSE client that never reads while the child floods — pre-fix: the write
//      buffer for that one socket grows without bound (measured: 12 MB after 200
//      64 KiB writes, and still climbing) and nothing disconnects it
//   3. N+1 concurrent RPCs against a child that answers slowly — pre-fix: the pending
//      map takes all of them
//   4. an app `data` command that prints past the cap — pre-fix: read whole; the
//      timeout kills on time, never on size
//
// Run: node apps/desk/test/buffer-caps.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { resolvePiBin, resolvePiPackage } from "../pi-session.mjs";

const freePort = () =>
	new Promise((resolve) => {
		const s = net.createServer();
		s.listen(0, "127.0.0.1", () => {
			const { port } = s.address();
			s.close(() => resolve(port));
		});
	});
// ephemeral by default so concurrent runs cannot collide
const PORT = Number(process.env.DESK_TEST_PORT) || (await freePort());
const APP_PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;
const APP = `http://127.0.0.1:${APP_PORT}`;

// the four caps, lowered for the test
const LINE_CAP = 256 * 1024;
const SSE_CAP = 512 * 1024;
const PENDING_CAP = 4;
const DATA_CAP = 64 * 1024;
const SLOW_MS = 2500; // how long the "slow" stub holds every response
// The flood is PACED (one 64 KiB event every 8 ms ≈ 8 MB/s). A reading client keeps
// up and never approaches the cap; a client that reads nothing crosses it as soon as
// the kernel's ~750 KB of socket buffer is full. Without pacing the two are the same
// race and the test would disconnect the healthy client too.
const FLOOD_N = 160, FLOOD_MS = 8;

const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The desk imports pi's session parser from the install tied to the `pi` it SPAWNS —
// and this test deliberately puts a stub `pi` first on PATH, which no package contains.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-buffers-"));
const binDir = path.join(TD, "bin");
const appsDir = path.join(TD, "apps");
const plainCwd = path.join(TD, "repo-plain");
const slowCwd = path.join(TD, "repo-slow");
const appCwd = path.join(TD, "repo-app");
const pidDir = path.join(TD, "pids");
for (const d of [binDir, appsDir, plainCwd, slowCwd, appCwd, pidDir, path.join(TD, ".pi", "agent", "sessions")]) fs.mkdirSync(d, { recursive: true });
const DATA_PID = path.join(TD, "data-pid");

// ── stub pi: behaviour by cwd (slow) and by prompt text (bigline / flood) ──
const STUB = `#!/usr/bin/env node
require("node:fs").writeFileSync(${JSON.stringify(pidDir)} + "/" + process.pid, "");
const slow = /repo-slow/.test(process.cwd());
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
let buf = "";
process.stdin.on("data", (c) => {
	buf += c.toString();
	let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const l = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!l.trim()) continue;
		let cmd; try { cmd = JSON.parse(l); } catch { continue; }
		const ok = (data) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data });
		const state = { isStreaming: false, sessionFile: "/tmp/stub-" + process.pid + ".jsonl", model: { provider: "stub", id: "stub" }, thinkingLevel: "off" };
		if (slow) { setTimeout(() => ok(cmd.type === "get_state" ? state : {}), ${SLOW_MS}); continue; }
		if (cmd.type === "prompt" && /bigline/.test(cmd.message || "")) {
			// NO response: this RPC is in flight when the over-cap line lands, which is
			// exactly the caller the fix has to reject instead of leaving on its timer.
			process.stdout.write("x".repeat(${2 * LINE_CAP}));   // one line, no newline
			process.stdout.write("\\n");                          // …terminated at last
			say({ type: "desk_test_alive", after: "bigline" });
		} else if (cmd.type === "prompt" && /bigcomplete/.test(cmd.message || "")) {
			ok({});
			// a VALID event exactly one char over the cap, written WITH its newline: the
			// chunk that crosses the cap is the one that terminates the line
			const head = '{"type":"desk_test_big","pad":"', tailp = '"}';
			process.stdout.write(head + "q".repeat(${LINE_CAP} + 1 - head.length - tailp.length) + tailp + "\\n");
			say({ type: "desk_test_alive", after: "bigcomplete" });
		} else if (cmd.type === "prompt" && /flood/.test(cmd.message || "")) {
			ok({});
			const blob = "y".repeat(64 * 1024);
			let i = 0;
			const t = setInterval(() => {
				if (i >= ${FLOOD_N}) { clearInterval(t); say({ type: "desk_test_alive", after: "flood" }); return; }
				say({ type: "desk_test_flood", i: i++, blob });
			}, ${FLOOD_MS});
		} else if (cmd.type === "get_state") ok(state);
		else ok({});
	}
});
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

// ── an app whose `data` commands overrun the output cap ──
const flood = `require("node:fs").writeFileSync(${JSON.stringify(DATA_PID)}, String(process.pid)); (function w(){ process.stdout.write("z".repeat(32768)); setTimeout(w, 1); })(); setInterval(() => {}, 1000);`;
fs.writeFileSync(path.join(appsDir, "app.json"), JSON.stringify({
	port: APP_PORT, cwd: appCwd, tools: ["read"], trust: "no-approve", title: "buffers",
	data: { huge: ["node", "-e", flood], small: ["node", "-e", "console.log(JSON.stringify({ ok: true }))"] },
}));

const server = spawn("node", [SERVER], {
	env: {
		...process.env, DESK_PI_ROOT: PI_ROOT, HOME: TD, DESK_PORT: String(PORT), DESK_APPS_DIR: appsDir,
		DESK_STDOUT_LINE_CAP: String(LINE_CAP), DESK_SSE_BUFFER_CAP: String(SSE_CAP),
		DESK_MAX_PENDING_RPC: String(PENDING_CAP), DESK_DATA_OUTPUT_CAP: String(DATA_CAP),
		PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
	},
	stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));
let deskExit = null, deskExited = false; // a signal exit reports code null: track both
server.on("exit", (code, signal) => { deskExit = code ?? signal; deskExited = true; });

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (base, p, body) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
const alive = async () => {
	if (deskExited) return false;
	try { return (await fetch(`${BASE}/api/live`, { signal: AbortSignal.timeout(4000) })).status === 200; } catch { return false; }
};
const live = () => fetch(`${BASE}/api/live`).then((r) => r.json());
const spawnIn = (cwd) => post(BASE, "/api/spawn", { cwd }).then((r) => r.json());
const waitFor = async (fn, ms = 8000) => { for (let i = 0; i < ms / 100; i++) { if (await fn()) return true; await sleep(100); } return false; };
const gone = (pid) => { try { process.kill(pid, 0); return false; } catch (e) { return e?.code === "ESRCH"; } };

// every client this test opens, so teardown can close them all
const openClients = [];
// a well-behaved SSE client: reads everything, keeps the frames it saw
const listen = (id) => {
	const seen = [];
	const ac = new AbortController();
	seen.stop = () => ac.abort();
	fetch(`${BASE}/api/session/${id}/events`, { signal: ac.signal }).then(async (r) => {
		const dec = new TextDecoder();
		let buf = "";
		for await (const chunk of r.body) {
			buf += dec.decode(chunk, { stream: true });
			let nn;
			while ((nn = buf.indexOf("\n\n")) >= 0) {
				const frame = buf.slice(0, nn);
				buf = buf.slice(nn + 2);
				for (const l of frame.split("\n")) if (l.startsWith("data: ")) { try { seen.push(JSON.parse(l.slice(6))); } catch {} }
			}
		}
	}).catch(() => {});
	openClients.push(seen);
	return seen;
};
// the hostile one: a raw socket that asks for the stream and then never reads a byte.
// No 'data' listener and no resume() = a paused readable, so the kernel window fills
// and everything after it piles up in the SERVER's write buffer.
const deafClient = (id) => {
	const st = { closed: false, bytes: 0 };
	const s = net.connect(PORT, "127.0.0.1", () => s.write(`GET /api/session/${id}/events HTTP/1.1\r\nHost: 127.0.0.1:${PORT}\r\n\r\n`));
	s.on("close", () => (st.closed = true));
	s.on("error", () => {});
	// A paused socket is never told the peer went away — nothing reads, so nothing
	// notices the FIN. Start reading at the END of the case: the client drains what
	// it was sent and only then sees the close, which is the proof the desk really
	// ended the response instead of holding the stream open and buffering.
	st.drain = () => { s.on("data", (c) => (st.bytes += c.length)); s.resume(); };
	st.destroy = () => s.destroy();
	openClients.push(st);
	return st;
};

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(`${BASE}/api/live`, { signal: AbortSignal.timeout(2000) }); break; } catch { await sleep(250); }
		if (i === 39) throw new Error(`desk server never came up: ${log}`);
	}

	// ── 1. a child stdout line past the cap ──────────────────────────────────────
	const c1 = await spawnIn(plainCwd);
	check("stub child spawned", typeof c1.id === "string", JSON.stringify(c1));
	const seen1 = listen(c1.id);
	await waitFor(async () => seen1.some((e) => e.type === "desk_hello"));
	const TIMEOUT = "TIMEOUT — the in-flight RPC was left on its 600 s timer";
	const t0 = Date.now();
	const pr = await Promise.race([
		post(BASE, `/api/session/${c1.id}/prompt`, { message: "bigline please" }).then(async (r) => ({ status: r.status, body: await r.json() })),
		sleep(15000).then(() => TIMEOUT),
	]);
	check("an over-cap line does not take the desk down", await alive(), `${Date.now() - t0} ms`);
	check("…the RPC whose response was discarded is rejected, not left on its timer", pr !== TIMEOUT && pr.status === 409 && /exceeded/.test(String(pr.body?.error)), JSON.stringify(pr).slice(0, 200));
	check("…clients are TOLD, once, that a line was dropped", seen1.filter((e) => e.type === "desk_event_dropped" && /stdout line/.test(String(e.reason))).length === 1, JSON.stringify(seen1.filter((e) => e.type === "desk_event_dropped")));
	check("…the desk logs it once", (log.match(/stdout line over cap/g) || []).length === 1, log.split("\n").filter((l) => /stdout line/.test(l)).join(" | "));
	check("…the NEXT line is processed normally", await waitFor(async () => seen1.some((e) => e.type === "desk_test_alive" && e.after === "bigline")), JSON.stringify(seen1.map((e) => e.type)));
	check("…and the child is still running (a bad line does not cost the session)", (await live()).find((c) => c.id === c1.id)?.state === "running", JSON.stringify(await live()));
	const still = await post(BASE, `/api/session/${c1.id}/rpc`, { command: { type: "get_state" } });
	check("…and the session still answers RPCs afterwards", still.status === 200, String(still.status));

	// ── 1b. a COMPLETE line one character over the cap, newline and all ──────────
	// The remainder check alone never sees this one: the chunk that pushes the buffer
	// past the cap is the same chunk that terminates the line, so it used to be parsed
	// and broadcast like any other event.
	await post(BASE, `/api/session/${c1.id}/prompt`, { message: "bigcomplete please" });
	check("…a terminated line over the cap is dropped too, not parsed and broadcast", await waitFor(async () => seen1.some((e) => e.type === "desk_test_alive" && e.after === "bigcomplete")) && !seen1.some((e) => e.type === "desk_test_big"), JSON.stringify(seen1.map((e) => e.type)));
	check("…and its clients are told about that one as well", seen1.filter((e) => e.type === "desk_event_dropped" && /stdout line/.test(String(e.reason))).length === 2, String(seen1.filter((e) => e.type === "desk_event_dropped").length));
	check("…the child survives it too", (await live()).find((c) => c.id === c1.id)?.state === "running", JSON.stringify(await live()));
	seen1.stop();

	// ── 2. an SSE client that never reads ────────────────────────────────────────
	const c2 = await spawnIn(plainCwd);
	const healthy = listen(c2.id);
	await waitFor(async () => healthy.some((e) => e.type === "desk_hello"));
	const deaf = deafClient(c2.id);
	await sleep(500); // let the deaf client's GET land and join the fan-out
	await post(BASE, `/api/session/${c2.id}/prompt`, { message: "flood please" });
	const sawEnd = await waitFor(async () => healthy.some((e) => e.type === "desk_test_alive" && e.after === "flood"), 30000);
	check("a client that stops reading does not stall the flood for everyone", sawEnd, `${healthy.length} frames`);
	const dropLine = log.split("\n").find((l) => /SSE client over cap/.test(l));
	const dropped = Number(/(\d+) bytes/.exec(dropLine || "")?.[1] ?? -1);
	check("…the desk disconnects it once its write buffer passes the cap", dropped > SSE_CAP, dropLine || log.split("\n").filter((l) => /SSE/.test(l)).join(" | "));
	deaf.drain();
	check("…and its response is really ended, not left open and buffering", await waitFor(async () => deaf.closed, 10000), `closed=${deaf.closed} after ${deaf.bytes} bytes`);
	check("…having been sent a BOUNDED slice of the flood, not all 10 MB of it", deaf.bytes < FLOOD_N * 64 * 1024, `${deaf.bytes} bytes of ${FLOOD_N * 64 * 1024}`);
	check("…the healthy client on the same session kept every event", healthy.filter((e) => e.type === "desk_test_flood").length === FLOOD_N, String(healthy.filter((e) => e.type === "desk_test_flood").length));
	check("…and the desk is still serving", await alive());
	deaf.destroy();
	healthy.stop();
	await fetch(`${BASE}/api/session/${c2.id}`, { method: "DELETE" });

	// ── 3. in-flight RPCs per child ──────────────────────────────────────────────
	const c3 = await spawnIn(slowCwd);
	check("slow-answering child spawned", typeof c3.id === "string", JSON.stringify(c3));
	const burst = await Promise.all(
		Array.from({ length: PENDING_CAP + 1 }, () =>
			post(BASE, `/api/session/${c3.id}/rpc`, { command: { type: "get_state" } }).then(async (r) => ({ status: r.status, body: await r.json() }))),
	);
	const over = burst.filter((r) => r.status === 429);
	check(`the ${PENDING_CAP + 1}th concurrent RPC fails fast with 429`, over.length === 1 && /in-flight/.test(String(over[0].body?.error)), JSON.stringify(burst.map((r) => r.status)));
	check(`…the first ${PENDING_CAP} are untouched and still answer on their own timers`, burst.filter((r) => r.status === 200).length === PENDING_CAP, JSON.stringify(burst.map((r) => r.status)));
	check("…and the cap is on IN-FLIGHT work only: the next RPC after they drain is fine", (await post(BASE, `/api/session/${c3.id}/rpc`, { command: { type: "get_state" } })).status === 200);
	await fetch(`${BASE}/api/session/${c3.id}`, { method: "DELETE" });

	// ── 4. an app `data` command that prints past the cap ────────────────────────
	check("the app listener is up", (await fetch(`${APP}/api/manifest`).then((r) => r.json())).name === "app");
	check("a data command under the cap still answers", (await post(APP, "/api/data/small", {}).then((r) => r.json())).ok === true);
	const dt0 = Date.now();
	const dr = await Promise.race([
		post(APP, "/api/data/huge", {}).then(async (r) => ({ status: r.status, body: await r.json() })),
		sleep(15000).then(() => "TIMEOUT"),
	]);
	check("a data command past the output cap → 500 naming the cap", dr !== "TIMEOUT" && dr.status === 500 && new RegExp(`data output exceeded cap \\(${DATA_CAP} bytes\\)`).test(String(dr.body?.error)), JSON.stringify(dr).slice(0, 200));
	check("…and it is killed on SIZE, well before the 20 s timeout", Date.now() - dt0 < 10000, `${Date.now() - dt0} ms`);
	const dataPid = Number(fs.readFileSync(DATA_PID, "utf-8"));
	check("…the process is reaped, not left flooding a dead pipe", await waitFor(async () => gone(dataPid), 8000), `pid ${dataPid}`);
	check("…the app listener still serves after it", (await post(APP, "/api/data/small", {}).then((r) => r.json())).ok === true);
	check("desk still serving at the end", await alive());
} catch (e) {
	check(`harness error: ${e?.stack || e}`, false);
} finally {
	// Teardown is an ASSERTION, not a cleanup: a test that leaves pi stubs or the desk
	// running poisons whatever runs next (and hides a lifecycle bug of its own). Close
	// the clients, end every session through the real route, wait for the server's own
	// exit, and only then prove no recorded pid is still alive.
	for (const c of openClients) { try { c.stop ? c.stop() : c.destroy(); } catch {} }
	try {
		for (const c of await fetch(`${BASE}/api/live`).then((r) => r.json())) await fetch(`${BASE}/api/session/${c.id}`, { method: "DELETE" }).catch(() => {});
	} catch {}
	const exited = new Promise((r) => (deskExited ? r() : server.once("exit", r)));
	try { server.kill("SIGTERM"); } catch {}
	await Promise.race([exited, sleep(8000)]);
	if (!deskExited) {
		try { server.kill("SIGKILL"); } catch {}
		await Promise.race([exited, sleep(3000)]);
	}
	check("the desk process really exited on teardown", deskExited, `exit=${deskExit}`);
	const pids = (fs.existsSync(pidDir) ? fs.readdirSync(pidDir) : []).map(Number).filter(Boolean);
	if (fs.existsSync(DATA_PID)) pids.push(Number(fs.readFileSync(DATA_PID, "utf-8")));
	const survivors = [];
	for (const pid of pids) if (!(await waitFor(async () => gone(pid), 6000))) survivors.push(pid);
	check(`every spawned process is gone (${pids.length} recorded)`, survivors.length === 0, `still alive: ${survivors.join(", ")}`);
	for (const pid of survivors) { try { process.kill(pid, "SIGKILL"); } catch {} } // never leave one behind
	fs.rmSync(TD, { recursive: true, force: true });
}
console.log(fails ? `\n${fails} FAILED` : "\nall passed");
process.exit(fails ? 1 : 0);
