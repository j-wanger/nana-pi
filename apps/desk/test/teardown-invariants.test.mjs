// Teardown property (2026-09-08, whole-unit review): the desk NEVER stops counting
// a child it cannot prove is gone. Every capacity slot it frees must correspond to
// a process that really ended — otherwise `MAX_CHILDREN` bounds nothing and a
// spawn/delete loop leaves live pi processes behind with nothing tracking them.
//
// A child that survives SIGKILL cannot be faked portably, so the kill is made to
// FAIL instead (fixtures/no-kill-preload.cjs patches ChildProcess#kill to return
// false and emit 'error', which is what Node does on EPERM). That reaches the same
// two code paths:
//   1. the ChildProcess 'error' event on a LIVE child — it fires for a failed kill,
//      not only for a failed spawn, and marking the child "exited" there freed its
//      slot and made a later DELETE a no-op   (pre-fix: state "exited")
//   2. the post-SIGKILL deadline — the record was deleted on a timer alone, with
//      the process still running   (pre-fix: record gone, slot free, pid alive)
// Plus: teardown is idempotent, and the record comes back only when the pid really
// goes. Plus: a second SIGINT/SIGTERM leaves immediately instead of waiting out the
// shutdown grace.
//
// Run: node apps/desk/test/teardown-invariants.test.mjs   (exit 0 = all PASS)
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
const PORT = Number(process.env.DESK_TEST_PORT) || (await freePort());
const BASE = `http://127.0.0.1:${PORT}`;
const GRACE = 1200; // DESK_KILL_GRACE_MS
const NOKILL = "UNKILLABLE"; // --name marker the preload matches on
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The desk imports pi's session parser from the install tied to the `pi` it
// SPAWNS — and this test deliberately puts a stub `pi` first on PATH, which no
// package contains. So the harness names the real package explicitly; without it
// the desk refuses to start rather than guess which install to parse with.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const PRELOAD = new URL("./fixtures/no-kill-preload.cjs", import.meta.url).pathname;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-teardown-"));
const binDir = path.join(TD, "bin");
const appsDir = path.join(TD, "apps");
const repo = path.join(TD, "repo");
const pidDir = path.join(TD, "pids");
for (const d of [binDir, appsDir, repo, pidDir]) fs.mkdirSync(d, { recursive: true });

// stub pi: records its pid, answers nothing in particular, stays alive
const STUB = `#!/usr/bin/env node
require("node:fs").writeFileSync(${JSON.stringify(pidDir)} + "/" + (process.argv.includes("--name") ? process.argv[process.argv.indexOf("--name") + 1] : "plain") + "-" + Date.now(), String(process.pid));
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
let buf = "";
process.stdin.on("data", (c) => {
	buf += c.toString();
	let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const l = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!l.trim()) continue;
		let cmd; try { cmd = JSON.parse(l); } catch { continue; }
		say({ type: "response", id: cmd.id, command: cmd.type, success: true, data: {} });
	}
});
setInterval(() => {}, 1000);
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

const server = spawn("node", ["--require", PRELOAD, SERVER], {
	env: {
		...process.env, DESK_PI_ROOT: PI_ROOT, HOME: TD, DESK_PORT: String(PORT), DESK_APPS_DIR: appsDir,
		DESK_KILL_GRACE_MS: String(GRACE), DESK_TEST_NOKILL: NOKILL,
		PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
	},
	stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (c) => (log += c));
server.stderr.on("data", (c) => (log += c));
let deskExit = null;
let deskExitAt = 0;
server.on("exit", (code) => { deskExit = code; deskExitAt = Date.now(); });

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (fn, ms = 6000) => { for (let i = 0; i < ms / 100; i++) { if (await fn()) return true; await sleep(100); } return false; };
const post = (p, body) => fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body ?? {}) });
const live = () => fetch(`${BASE}/api/live`).then((r) => r.json());
const pidsFor = (prefix) => fs.readdirSync(pidDir).filter((f) => f.startsWith(prefix)).map((f) => Number(fs.readFileSync(path.join(pidDir, f), "utf-8")));
const isAlive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code !== "ESRCH"; } };

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(`${BASE}/api/live`, { signal: AbortSignal.timeout(2000) }); break; } catch { await sleep(250); }
		if (i === 39) throw new Error(`desk server never came up: ${log}`);
	}

	// ── a child whose kill FAILS ──
	const c = await post("/api/spawn", { cwd: repo, name: NOKILL }).then((r) => r.json());
	check("unkillable-fixture child spawned", typeof c.id === "string", JSON.stringify(c));
	check("its pid was recorded", await waitFor(async () => pidsFor(NOKILL).length === 1));
	const pid = pidsFor(NOKILL)[0];

	check("DELETE accepted", (await fetch(`${BASE}/api/session/${c.id}`, { method: "DELETE" })).status === 200);
	await sleep(200); // the kill error arrives on the next tick
	let rec = (await live()).find((x) => x.id === c.id);
	check("a failed kill does NOT mark a live child exited", rec?.state === "exiting", JSON.stringify(rec));
	check("…the process is indeed still alive", isAlive(pid), `pid ${pid}`);

	// past SIGKILL + the deadline: a timer is not evidence of death
	await sleep(GRACE * 3.5);
	rec = (await live()).find((x) => x.id === c.id);
	check("after the SIGKILL deadline the record is RETAINED (pid still alive)", !!rec, JSON.stringify(await live()));
	check("…still marked exiting, not exited", rec?.state === "exiting", String(rec?.state));
	check("…and the desk said so once", /still alive after SIGKILL/.test(log), log.split("\n").filter((l) => /session/.test(l)).slice(-2).join(" | "));

	// …and it still holds its slot
	const fillers = [];
	for (let i = 0; i < 3; i++) fillers.push(await post("/api/spawn", { cwd: repo }).then((r) => r.json()));
	check("three more children spawn (4 counted with the dying one)", fillers.every((f) => typeof f.id === "string"), JSON.stringify(fillers));
	const over = await post("/api/spawn", { cwd: repo });
	check("the retained child still occupies a slot: the 5th spawn is refused", over.status >= 400 && /max 4 live sessions/.test((await over.json()).error || ""), String(over.status));

	// duplicate teardown is a no-op, not a second lifecycle
	const before = (await live()).length;
	check("a second DELETE is accepted", (await fetch(`${BASE}/api/session/${c.id}`, { method: "DELETE" })).status === 200);
	await sleep(200);
	check("…and changes nothing (one record, still exiting)", (await live()).length === before && (await live()).find((x) => x.id === c.id)?.state === "exiting", JSON.stringify(await live()));
	check("…the desk is still serving", (await fetch(`${BASE}/api/live`)).status === 200);

	// the record comes back only when the pid really goes
	process.kill(pid, "SIGKILL");
	check("once the pid is really gone the record is dropped", await waitFor(async () => !(await live()).some((x) => x.id === c.id), GRACE * 6), JSON.stringify(await live()));
	check("…and the slot is free again", (await post("/api/spawn", { cwd: repo })).status === 200);

	// ── second signal leaves immediately instead of waiting out the grace ──
	// a child the desk cannot kill means the shutdown poll NEVER completes, so
	// without the second-signal path the desk would sit here for the whole grace
	// free a slot first (the killable ones tear down normally)
	for (const x of (await live()).slice(0, 2)) await fetch(`${BASE}/api/session/${x.id}`, { method: "DELETE" });
	await waitFor(async () => (await live()).length <= 2);
	const c2 = await post("/api/spawn", { cwd: repo, name: NOKILL }).then((r) => r.json());
	check("a second unkillable child is live at shutdown", typeof c2.id === "string" && (await waitFor(async () => pidsFor(NOKILL).some((p) => isAlive(p)))), JSON.stringify(c2));
	const t0 = Date.now();
	server.kill("SIGTERM");
	await sleep(150);
	server.kill("SIGTERM"); // the second one must not wait for the poll/grace
	const exited = await waitFor(async () => deskExit !== null, 6000);
	check("the desk exits on shutdown", exited, String(deskExit));
	check("…on the SECOND signal, without waiting out the grace", exited && deskExitAt - t0 < GRACE, `${deskExitAt - t0} ms (grace ${GRACE})`);
} catch (e) {
	console.log("HARNESS ERROR", e.message, "\n--- server log ---\n", log.slice(-2000));
	fails = 99;
} finally {
	server.kill("SIGKILL");
	await sleep(200);
	for (const f of fs.readdirSync(pidDir)) {
		try {
			const p = Number(fs.readFileSync(path.join(pidDir, f), "utf-8"));
			if (p && isAlive(p)) { process.kill(p, "SIGKILL"); console.log(`(test reaped pid ${p})`); }
		} catch {}
	}
	fs.rmSync(TD, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
