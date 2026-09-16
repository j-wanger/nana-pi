// The prompt endpoint's DETACH contract (2026-09-16, sol r2 C-HIGH).
//
// `POST /api/session/:id/prompt` waits 5 s for pi's acceptance and then stops
// waiting — an extension command can hold that answer for minutes. What the
// client gets back is `{ok:true, pending:true, promptId}`, and the ONLY thing
// that later says what became of that prompt is a `desk_prompt_settled` event
// carrying the same id. The desk's reload holds the user's typing on it, so the
// wire contract is pinned here rather than inferred from the browser:
//   1. every answer carries a promptId — the fast path too, and they are distinct
//   2. a detached prompt that eventually SUCCEEDS broadcasts settled {ok:true},
//      and no desk_prompt_rejected
//   3. a detached prompt that eventually FAILS broadcasts settled {ok:false,error}
//      AND keeps the older desk_prompt_rejected (clients that only know that one)
//   4. exactly one settled event per detached prompt, and none for a fast one
//
// Real server + STUB pi (no model), zero dependencies.
// Run: node apps/desk/test/prompt-detach.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { resolvePiBin, resolvePiPackage } from "../pi-session.mjs";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const freePort = () =>
	new Promise((resolve) => {
		const s = net.createServer();
		s.listen(0, "127.0.0.1", () => {
			const { port } = s.address();
			s.close(() => resolve(port));
		});
	});
const PORT = Number(process.env.DESK_TEST_PORT) || (await freePort());
const BASE = `http://127.0.0.1:${PORT}`;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The desk parses sessions with the install tied to the `pi` it SPAWNS, and this
// harness puts a stub `pi` first on PATH. Name the real package explicitly.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-prompt-"));
const binDir = path.join(TD, "bin");
const cwd = path.join(TD, "repo");
for (const d of [binDir, cwd, path.join(TD, ".pi", "agent", "sessions")]) fs.mkdirSync(d, { recursive: true });

// HOLD_MS is past the endpoint's 5 s detach: these two prompts can only be
// answered by the settled broadcast, never by the POST they came in on.
const HOLD_MS = 6500;

// ── stub pi: the answer to a prompt is held, or refused, by its text ──
const STUB = `#!/usr/bin/env node
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
let buf = "";
process.stdin.on("data", (c) => {
	buf += c; let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		const ok = (data) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data });
		const msg = String(cmd.message || "");
		if (cmd.type === "get_state") { ok({ isStreaming: false, isCompacting: false, sessionName: "stub", sessionFile: null, model: { provider: "stub", id: "stub" }, thinkingLevel: "off" }); continue; }
		if (cmd.type === "prompt" && msg.startsWith("slow-ok")) { setTimeout(ok, ${HOLD_MS}, {}); continue; }
		if (cmd.type === "prompt" && msg.startsWith("slow-fail")) {
			setTimeout(() => say({ type: "response", id: cmd.id, command: cmd.type, success: false, error: "pi said no, late" }), ${HOLD_MS});
			continue;
		}
		ok({});
	}
});
process.stdin.on("end", () => process.exit(0));
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

const server = spawn("node", [SERVER], {
	env: {
		...process.env, DESK_PI_ROOT: PI_ROOT, HOME: TD, DESK_PORT: String(PORT),
		DESK_APPS_DIR: path.join(TD, "no-apps"), PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
	},
	stdio: ["ignore", "pipe", "pipe"],
	detached: true,
});
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));
const stop = async () => {
	if (server.exitCode === null && server.signalCode === null) {
		const gone = new Promise((r) => server.once("exit", r));
		try { process.kill(-server.pid, "SIGTERM"); } catch { try { server.kill("SIGTERM"); } catch {} }
		await Promise.race([gone, sleep(4000)]);
		try { process.kill(-server.pid, "SIGKILL"); } catch {}
	}
};

// an SSE client that keeps every frame it saw
const listen = (id) => {
	const seen = [];
	const ac = new AbortController();
	seen.stop = () => ac.abort();
	fetch(`${BASE}/api/session/${id}/events`, { signal: ac.signal })
		.then(async (r) => {
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
		})
		.catch(() => {});
	return seen;
};
const prompt = (id, message) =>
	fetch(`${BASE}/api/session/${id}/prompt`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, mode: "prompt" }) }).then((r) => r.json());
const waitFor = async (fn, ms = 15000) => {
	for (let i = 0; i < ms / 100; i++) {
		if (fn()) return true;
		await sleep(100);
	}
	return false;
};

let events;
try {
	for (let i = 0; i < 80; i++) {
		try { await fetch(`${BASE}/api/live`); break; } catch { await sleep(250); }
		if (i === 79) throw new Error(`server never came up: ${log}`);
	}
	const spawned = await fetch(`${BASE}/api/spawn`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cwd }) }).then((r) => r.json());
	if (!spawned.id) throw new Error(`spawn failed: ${JSON.stringify(spawned)} ${log}`);
	events = listen(spawned.id);
	await waitFor(() => events.some((e) => e.type === "desk_hello"));

	// ── 1. the fast path still carries an id ──
	const fast = await prompt(spawned.id, "answered right away");
	check("fast: the answer is ok and not pending", fast.ok === true && !fast.pending, JSON.stringify(fast));
	check("fast: …and it carries a promptId", typeof fast.promptId === "string" && fast.promptId.length > 0, JSON.stringify(fast));

	// ── 2+3. two prompts the endpoint must detach from, one of each outcome ──
	const [good, bad] = await Promise.all([prompt(spawned.id, "slow-ok please"), prompt(spawned.id, "slow-fail please")]);
	check("detach: a prompt pi has not accepted in 5 s answers pending", good.ok === true && good.pending === true, JSON.stringify(good));
	check("detach: …with a promptId of its own", typeof good.promptId === "string" && good.promptId !== fast.promptId, JSON.stringify([fast.promptId, good.promptId]));
	check("detach: …and two detached prompts get two different ids", typeof bad.promptId === "string" && bad.promptId !== good.promptId, JSON.stringify([good.promptId, bad.promptId]));
	const settledFor = (id) => events.filter((e) => e.type === "desk_prompt_settled" && e.promptId === id);
	check("detach: nothing is settled while pi is still holding it", settledFor(good.promptId).length === 0 && settledFor(bad.promptId).length === 0, JSON.stringify(events.filter((e) => e.type === "desk_prompt_settled")));

	const arrived = await waitFor(() => settledFor(good.promptId).length && settledFor(bad.promptId).length);
	check("settle: both detached prompts settled once pi answered", arrived, JSON.stringify(events.filter((e) => e.type?.startsWith("desk_prompt"))));
	check("settle: the one that succeeded settled ok:true, with no error", settledFor(good.promptId)[0]?.ok === true && !settledFor(good.promptId)[0]?.error, JSON.stringify(settledFor(good.promptId)));
	check("settle: the one that failed settled ok:false, and says why", settledFor(bad.promptId)[0]?.ok === false && /late/.test(settledFor(bad.promptId)[0]?.error || ""), JSON.stringify(settledFor(bad.promptId)));

	// ── 4. one event per detached prompt, none for the fast one ──
	await sleep(500); // a second copy would have landed by now
	check("settle: exactly one settled event per detached prompt", settledFor(good.promptId).length === 1 && settledFor(bad.promptId).length === 1, `${settledFor(good.promptId).length} / ${settledFor(bad.promptId).length}`);
	check("settle: a prompt answered inside the 5 s never settles separately", settledFor(fast.promptId).length === 0, JSON.stringify(settledFor(fast.promptId)));
	const rejects = events.filter((e) => e.type === "desk_prompt_rejected");
	check("settle: the late failure still raises the older desk_prompt_rejected", rejects.length === 1 && /late/.test(rejects[0].error || ""), JSON.stringify(rejects));
} catch (e) {
	console.log("FAIL harness:", e.message, "\n--- server log ---\n", log.slice(-2000));
	fails++;
}

events?.stop();
await stop();
fs.rmSync(TD, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
