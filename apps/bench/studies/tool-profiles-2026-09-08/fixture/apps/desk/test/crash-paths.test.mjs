// Robustness property (2026-09-08): NOTHING a request or a child can say takes
// the desk process down, wedges its event loop, or leaves a live pi process
// untracked. The desk is a single Node process holding every live session — one
// uncaught throw kills them all, so each case below is a whole-desk outage, not a
// failed request. Child events are the sharp end: they arrive on an EventEmitter
// callback, outside every request's try/catch.
//
// Drives the REAL server (ephemeral ports, own HOME, own apps dir) against a STUB
// `pi`. Cases marked (pre-fix: dies) FAIL on the pre-fix code, verified by
// reverting each fix in place:
//   1. `GET /// HTTP/1.1` — a target Node's parser accepts and `new URL` rejects
//      (pre-fix: dies)
//   2. a child stdout line of `null` — valid JSON, not an object (pre-fix: dies)
//   3. a child event that PARSES and cannot be re-serialized: ~50k nested arrays
//      make JSON.stringify blow the stack inside broadcast() (pre-fix: dies)
//   4. child stdin EPIPE — async 'error' with no listener (pre-fix: dies)
//   5. /api/transcript on a parentId CYCLE — infinite walk (pre-fix: wedged)
//   6. a multi-byte character split across two stdout reads (pre-fix: U+FFFD)
//   7. DELETE with no deadline — a SIGTERM-ignoring child survived forever and
//      stopped counting, so spawn/delete cycles left untracked pi processes
//      (pre-fix: alive after teardown, slot wrongly free)
//   8. one manifest holding `null` threw at module load (pre-fix: desk never came up)
//   9. a POST body that parses to a non-object (pre-fix: 500 from `null.cwd`)
//  10. an SSE client that vanished mid-stream: the fan-out drops it and the route
//      that writes to it cannot throw (invariant coverage — Node 22 returns false
//      rather than throwing here, so this one does not fail pre-fix)
//
// Run: node apps/desk/test/crash-paths.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

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
const GRACE = 800; // DESK_KILL_GRACE_MS for the teardown case
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-crash-"));
const binDir = path.join(TD, "bin");
const appsDir = path.join(TD, "apps");
const SESS = path.join(TD, ".pi", "agent", "sessions", "--stub--");
const plainCwd = path.join(TD, "repo-plain");
const epipeCwd = path.join(TD, "repo-epipe");
const stubbornCwd = path.join(TD, "repo-stubborn");
for (const d of [binDir, appsDir, SESS, plainCwd, epipeCwd, stubbornCwd]) fs.mkdirSync(d, { recursive: true });
const STUBBORN_PID = path.join(stubbornCwd, "pid");
const EPIPE_PID = path.join(epipeCwd, "pid");

// ── the crafted session files ──
const line = (o) => `${JSON.stringify(o)}\n`;
const header = (id) => line({ type: "session", version: 3, id, timestamp: "2026-01-01T00:00:00.000Z", cwd: TD });
// two cycle shapes, each with the cycle ON the tail the branch walk starts from:
// a two-entry ring (aa↔bb, last line bb) and a self-referential entry (cc→cc)
const msg = (id, parentId, text) => line({ type: "message", id, parentId, timestamp: "2026-01-01T00:00:01.000Z", message: { role: "user", content: text } });
const RING_FILE = path.join(SESS, "2026-01-01T00-00-00-000Z_ring.jsonl");
fs.writeFileSync(RING_FILE, header("cyc-1") + msg("aa", "bb", "one") + msg("cc", "cc", "off-branch self-cycle") + msg("bb", "aa", "two"));
const SELF_FILE = path.join(SESS, "2026-01-01T00-00-01-000Z_self.jsonl");
fs.writeFileSync(SELF_FILE, header("cyc-2") + msg("dd", null, "root") + msg("ee", "ee", "self"));

// ── stub pi: mode chosen by its cwd, behaviour by the prompt text ──
const STUB = `#!/usr/bin/env node
const fs = require("node:fs");
const cwd = process.cwd();
if (/epipe/.test(cwd)) {
	// the hard case: unwritable stdin AND deaf to SIGTERM — only SIGKILL ends it
	fs.writeFileSync(${JSON.stringify(EPIPE_PID)}, String(process.pid));
	fs.closeSync(0);
	process.on("SIGTERM", () => {});
	setInterval(() => {}, 1000);
	return;
}
if (/stubborn/.test(cwd)) {
	fs.writeFileSync(${JSON.stringify(STUBBORN_PID)}, String(process.pid));
	process.on("SIGTERM", () => {});            // only SIGKILL ends this one
	setInterval(() => {}, 1000);
}
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
		if (cmd.type === "prompt" && /nullline/.test(cmd.message || "")) {
			process.stdout.write("null\\n");      // valid JSON, NOT an object
			process.stdout.write("12345\\n");     // valid JSON number
			process.stdout.write("[1,2]\\n");     // valid JSON array
			ok({});
			say({ type: "desk_test_alive", after: "null" });
		} else if (cmd.type === "prompt" && /deepnest/.test(cmd.message || "")) {
			ok({});
			// parses fine (V8's parser is iterative); JSON.stringify recurses and dies
			const n = 50000;
			process.stdout.write('{"type":"desk_test_deep","d":' + "[".repeat(n) + "]".repeat(n) + "}\\n");
			say({ type: "desk_test_alive", after: "deep" });
		} else if (cmd.type === "prompt" && /utf8split/.test(cmd.message || "")) {
			ok({});
			const b = Buffer.from(JSON.stringify({ type: "desk_test_utf8", text: ${JSON.stringify("héllo — 世界 ✅")} }) + "\\n", "utf8");
			const k = b.indexOf(0xe4);            // first byte of 世 (E4 B8 96)
			process.stdout.write(b.subarray(0, k + 1));
			setTimeout(() => process.stdout.write(b.subarray(k + 1)), 80);
		} else if (cmd.type === "get_state") ok({ isStreaming: false, sessionFile: "/tmp/stub-" + process.pid + ".jsonl", model: { provider: "stub", id: "stub" }, thinkingLevel: "off" });
		else ok({});
	}
});
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

// ── apps dir: one manifest that is valid JSON but NOT an object, next to a good one ──
fs.writeFileSync(path.join(appsDir, "broken.json"), "null\n");
fs.writeFileSync(path.join(appsDir, "good.json"), JSON.stringify({ port: APP_PORT, cwd: plainCwd, tools: ["read"], trust: "no-approve", title: "Good" }));

const server = spawn("node", [SERVER], {
	env: {
		...process.env, HOME: TD, DESK_PORT: String(PORT), DESK_APPS_DIR: appsDir,
		DESK_KILL_GRACE_MS: String(GRACE), PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
	},
	stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));
let deskExit = null;
server.on("exit", (code) => (deskExit = code));

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (base, p, body, raw) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: raw ?? JSON.stringify(body ?? {}) });

// A raw socket: fetch() will not send a request target `new URL` cannot parse.
const rawStatus = (target, port = PORT) =>
	new Promise((resolve) => {
		const s = net.connect(port, "127.0.0.1", () => s.write(`GET ${target} HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nConnection: close\r\n\r\n`));
		let out = "";
		s.on("data", (c) => (out += c));
		s.on("close", () => resolve(out.split("\r\n")[0] || "(closed with no response)"));
		s.on("error", (e) => resolve(`ERR ${e.code}`));
		setTimeout(() => { s.destroy(); resolve(out.split("\r\n")[0] || "(timeout)"); }, 4000);
	});
const alive = async () => {
	if (deskExit !== null) return false;
	// timeout, not an open-ended wait: a WEDGED event loop accepts the connection and
	// never answers, which is exactly the failure this file exists to catch
	try { return (await fetch(`${BASE}/api/live`, { signal: AbortSignal.timeout(4000) })).status === 200; } catch { return false; }
};
// events an SSE client saw for a child; abort() disconnects it mid-stream
const listen = (id) => {
	const seen = [];
	const ac = new AbortController();
	seen.stop = () => ac.abort();
	fetch(`${BASE}/api/session/${id}/events`, { signal: ac.signal }).then(async (r) => {
		// incremental: an SSE frame can be split across chunks (and one of these
		// events is ~100 KB), so hold the remainder instead of dropping it
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
	return seen;
};
const spawnIn = (cwd) => post(BASE, "/api/spawn", { cwd }).then((r) => r.json());
const live = () => fetch(`${BASE}/api/live`).then((r) => r.json());
const waitFor = async (fn, ms = 6000) => { for (let i = 0; i < ms / 100; i++) { if (await fn()) return true; await sleep(100); } return false; };

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(`${BASE}/api/live`, { signal: AbortSignal.timeout(2000) }); break; } catch { await sleep(250); }
		if (i === 39) throw new Error(`desk server never came up: ${log}`);
	}

	// ── 8. a manifest that is valid JSON but not an object costs ONE app, not the desk ──
	check("desk came up despite a `null` app manifest", await alive());
	check("…the bad manifest was logged and skipped", /broken\.json/.test(log), log.split("\n").filter((l) => /apps:/.test(l)).join(" | "));
	check("…and the OTHER app's listener is serving", (await fetch(`${APP}/api/manifest`).then((r) => r.json())).name === "good");

	// ── 1. malformed request targets ──
	for (const target of ["///", "//[", "/\\", "//%"]) {
		const status = await rawStatus(target);
		check(`GET ${target} → 400, desk survives`, /^HTTP\/1\.1 400\b/.test(status) && (await alive()), status);
		if (deskExit !== null) throw new Error("desk died on a malformed request target");
	}
	check("GET /// on an APP port → 400, desk survives", /^HTTP\/1\.1 400\b/.test(await rawStatus("///", APP_PORT)) && (await alive()));
	check("a normal target still routes", (await fetch(`${BASE}/api/live`)).status === 200);

	// ── 9. a body that is valid JSON but not an object ──
	for (const [what, raw] of [["null", "null"], ["an array", "[1,2]"], ["a string", '"cwd"'], ["not JSON at all", "{oops"]]) {
		const r = await post(BASE, "/api/spawn", null, raw);
		check(`POST /api/spawn with ${what} → 400`, r.status === 400, String(r.status));
	}
	check("…and no child was spawned by any of them", (await live()).length === 0, JSON.stringify(await live()));

	// ── 5. transcript with a parentId cycle: answers instead of wedging the loop ──
	const WEDGED = "TIMEOUT — event loop wedged by the parentId cycle";
	const transcript = (f) => Promise.race([
		fetch(`${BASE}/api/transcript?file=${encodeURIComponent(f)}`).then((r) => r.json()),
		sleep(6000).then(() => WEDGED),
	]);
	const t0 = Date.now();
	const ring = await transcript(RING_FILE);
	check("two-entry parentId ring answers (no infinite walk)", ring !== WEDGED && ring.total === 3, `${Date.now() - t0} ms ${JSON.stringify(ring).slice(0, 100)}`);
	check("…each ring member is visited exactly once, off-branch entries stay off", JSON.stringify(ring?.entries?.map((e) => [e.id, e.onBranch])) === '[["aa",true],["cc",false],["bb",true]]', JSON.stringify(ring?.entries?.map((e) => [e.id, e.onBranch])));
	const self = await transcript(SELF_FILE);
	check("self-referential parentId answers too", self !== WEDGED && JSON.stringify(self?.entries?.map((e) => [e.id, e.onBranch])) === '[["dd",false],["ee",true]]', JSON.stringify(self?.entries?.map((e) => [e.id, e.onBranch])));
	check("…desk still serving after the cyclic files", await alive());

	// ── 2. a child stdout line that is valid JSON but not an object ──
	const c1 = await spawnIn(plainCwd);
	check("stub child spawned", typeof c1.id === "string", JSON.stringify(c1));
	const seen1 = listen(c1.id);
	await waitFor(async () => seen1.some((e) => e.type === "desk_hello")); // stream attached
	await post(BASE, `/api/session/${c1.id}/prompt`, { message: "nullline please" });
	const sawAlive = await waitFor(async () => seen1.some((e) => e.after === "null"));
	check("child stdout `null` / number / array lines are skipped, desk survives", await alive());
	check("…and the events after them still reach the client", sawAlive, JSON.stringify(seen1.map((e) => e.type)));

	// ── 3. a child event that parses but cannot be re-serialized ──
	await post(BASE, `/api/session/${c1.id}/prompt`, { message: "deepnest please" });
	await waitFor(async () => seen1.some((e) => e.after === "deep"));
	check("a 50k-deep child event does not take the desk down", await alive());
	check("…the client is TOLD the event was dropped, not silently starved", seen1.some((e) => e.type === "desk_event_dropped" && e.eventType === "desk_test_deep"), JSON.stringify(seen1.map((e) => e.type)));
	check("…and the stream keeps working after it", seen1.some((e) => e.type === "desk_test_alive" && e.after === "deep"), JSON.stringify(seen1.map((e) => e.after)));

	// ── 6. a multi-byte character split across two stdout reads ──
	await post(BASE, `/api/session/${c1.id}/prompt`, { message: "utf8split please" });
	await waitFor(async () => seen1.some((e) => e.type === "desk_test_utf8"));
	const u = seen1.find((e) => e.type === "desk_test_utf8");
	check("a character split across stdout chunks survives intact", u?.text === "héllo — 世界 ✅", JSON.stringify(u?.text));

	// ── 10. an SSE client that disconnects mid-stream ──
	const gone = listen(c1.id);
	const stays = listen(c1.id);
	await waitFor(async () => gone.some((e) => e.type === "desk_hello") && stays.some((e) => e.type === "desk_hello"));
	gone.stop();
	await waitFor(async () => false, 300); // let the abort reach the server
	await post(BASE, `/api/session/${c1.id}/prompt`, { message: "nullline again" });
	check("a broadcast with a disconnected client in the fan-out does not kill the desk", await waitFor(async () => stays.some((e) => e.type === "desk_test_alive")) && (await alive()));
	check("…the disconnected client stopped receiving", !gone.some((e) => e.after === "null"), JSON.stringify(gone.map((e) => e.type)));

	// ── 4. child stdin EPIPE ──
	const c2 = await spawnIn(epipeCwd);
	check("epipe child spawned", typeof c2.id === "string", JSON.stringify(c2));
	await waitFor(async () => fs.existsSync(EPIPE_PID));
	const epipePid = Number(fs.readFileSync(EPIPE_PID, "utf-8"));
	const r2 = await Promise.race([
		post(BASE, `/api/session/${c2.id}/rpc`, { command: { type: "get_state" } }).then((r) => r.status).catch((e) => `fetch failed: ${e.message}`),
		sleep(8000).then(() => "TIMEOUT"),
	]);
	check("writing to a child with a closed stdin answers instead of killing the desk", typeof r2 === "number" && r2 >= 400, String(r2));
	check("…desk still serving after the EPIPE", await alive());
	// the child is STILL ALIVE (it ignores SIGTERM): it must be counted, not written off
	const epipeRec = (await live()).find((c) => c.id === c2.id);
	check("…a child whose stdin failed is not written off as exited while it still runs", epipeRec?.state === "exiting", JSON.stringify(epipeRec));
	check("…it goes through the same escalation and is really killed", await waitFor(() => { try { process.kill(epipePid, 0); return false; } catch { return true; } }, 4 * GRACE), `pid ${epipePid}`);
	check("…and only then is it dropped from the map", await waitFor(async () => !(await live()).some((c) => c.id === c2.id), 4 * GRACE), JSON.stringify(await live()));

	// ── 7. DELETE has a deadline: kill, escalate, and only then stop tracking ──
	const c3 = await spawnIn(stubbornCwd);
	check("stubborn (SIGTERM-ignoring) child spawned", typeof c3.id === "string", JSON.stringify(c3));
	await waitFor(async () => fs.existsSync(STUBBORN_PID));
	const stubbornPid = Number(fs.readFileSync(STUBBORN_PID, "utf-8"));
	// fill the remaining slots so MAX_CHILDREN (4) is reached: c1 + c3 are live
	const filler = [await spawnIn(plainCwd), await spawnIn(plainCwd)];
	check("at MAX_CHILDREN: a further spawn is refused", (await post(BASE, "/api/spawn", { cwd: plainCwd })).status >= 400, JSON.stringify(filler.map((f) => f.id)));
	check("DELETE accepted", (await fetch(`${BASE}/api/session/${c3.id}`, { method: "DELETE" })).status === 200);
	const rec = (await live()).find((c) => c.id === c3.id);
	check("a child that ignores SIGTERM is still TRACKED right after DELETE", !!rec, JSON.stringify(await live()));
	check("…and still holds its slot: spawning is still refused while it is dying", (await post(BASE, "/api/spawn", { cwd: plainCwd })).status >= 400, String(rec?.state));
	check("…the desk escalates to SIGKILL and the process is really gone", await waitFor(() => { try { process.kill(stubbornPid, 0); return false; } catch { return true; } }, 4 * GRACE), `pid ${stubbornPid}`);
	check("…the record is dropped once it exits", await waitFor(async () => !(await live()).some((c) => c.id === c3.id), 4 * GRACE), JSON.stringify(await live()));
	check("…and only THEN is the slot free", (await post(BASE, "/api/spawn", { cwd: plainCwd })).status === 200);
	check("desk still serving at the end", await alive());
} catch (e) {
	console.log("HARNESS ERROR", e.message, "\n--- server log ---\n", log.slice(-2000));
	fails = 99;
} finally {
	server.kill();
	await sleep(300);
	// reap the fixture even if the desk never got to it
	for (const f of [STUBBORN_PID, EPIPE_PID]) {
		try {
			const pid = Number(fs.readFileSync(f, "utf-8"));
			if (pid) { process.kill(pid, "SIGKILL"); console.log(`(test reaped pid ${pid})`); }
		} catch {}
	}
	fs.rmSync(TD, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
