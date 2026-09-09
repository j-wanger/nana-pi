// Stage signing keys survive a desk restart (design B, 2026-09-09).
//
// Drives the REAL desk server (own HOME, own apps dir, own key store) against a
// STUB `pi` that writes a REAL pi session file, signs blocks with the
// NANA_STAGE_KEY it was handed, and appends them as `nana-block` entries — so the
// blocks on disk outlive the process that minted them, exactly as nana-stage's do.
// Four server runs, in order:
//
//   1  fresh session A → a signed block → /api/entries returns it unredacted
//   2  RESTART, resume A → the SAME block is still unredacted        ← the regression
//      (and: a hand-appended bogus signature, and a block signed under a key this
//       desk never issued, are still redacted to `nana-block-rejected`)
//   3  rename A's file, resume by the NEW path → still verified (keyed by the pi
//      session header id, not the path); then switch_session into session B (whose
//      key was issued to a DIFFERENT app child in run 1): B's own history verifies
//      under B's recorded key, an UNRESOLVED get_state falls back to this child's
//      key alone (no stale authority), a LIVE block signed with that other key is
//      still dropped (live path = this child's key only), a FORK of B inherits B's
//      whole key set so its copied mixed-key blocks keep verifying, and a fork after
//      a switch whose observation FAILED inherits from what the child actually
//      holds, not from the stale predecessor
//   4  RESTART, resume B → both keys' blocks verify (any-of-recorded-keys)
//   5  RESTART, resume a fork whose ledger was NEVER read → still verifies, which is
//      only true if the desk recorded the fork when it observed it
//
// Plus direct StageKeyStore checks for the store properties the server path cannot
// show deterministically: the 8-key cap, modes, a path-shaped session id refused as a
// filename, an interrupted write, a failed save retried by the next record for that
// session, a corrupt record costing only its own session, a pre-existing directory
// left as the operator made it, and the existence prune (which never acts on an empty
// enumeration).
//
// Run: node apps/desk/test/stage-key-persistence.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { signBlock } from "../../../packages/nana-stage/lib/sign.mjs";
import { resolvePiBin, resolvePiPackage } from "../pi-session.mjs";
import { StageKeyStore } from "../stage-keys.mjs";

// The desk port is DYNAMIC (DESK_PORT=0, read back from the startup line) so it can
// never collide with another test's. App ports come from a manifest and must be
// fixed before the server starts: 4452/4453, the first free pair — nothing else
// under apps/desk/test uses 445x (in use elsewhere: 4381-4383, 4391, 4401-4413,
// 4421-4423, 4431-4432, 4441-4443).
const PA = 4452, PB = 4453;
let DESK = 0;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// stub `pi` first on PATH → name the real package explicitly, or the desk refuses
// to start rather than guess which install to parse sessions with.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;

const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-stagekey-"));
const binDir = path.join(TD, "bin");
const appsDir = path.join(TD, "apps");
const cwdA = path.join(TD, "repo-a");
const cwdB = path.join(TD, "repo-b");
const SESSIONS = path.join(TD, ".pi", "agent", "sessions");
// where the server will put its own store, given HOME=TD (a DIRECTORY, one file per session)
const STORE = path.join(TD, ".pi", "agent", "nana-desk", "stage-keys");
const OUT = path.join(TD, "stub-out.jsonl");
const OLD_KEY = path.join(TD, "old-key.txt");
const NO_STATE = path.join(TD, "no-state.flag"); // its presence makes the stub fail get_state
const AFTER_FORK = path.join(TD, "after-fork.flag"); // "fail" | "hold:<ms>" for the state read after a fork
const HOLD_FORK = path.join(TD, "hold-fork.flag"); // ms to delay the fork RESPONSE itself
const TRACE = path.join(TD, "trace.jsonl"); // every command the stub received, with its arrival time
for (const d of [binDir, appsDir, cwdA, cwdB, SESSIONS]) fs.mkdirSync(d, { recursive: true });
const extStage = path.join(TD, "nana-stage.ts");
fs.writeFileSync(extStage, "export default function () {}\n");

// ── stub pi ─────────────────────────────────────────────────────────────────────
// Writes a real session file (pi's header shape), signs blocks with its own
// NANA_STAGE_KEY, and appends each as a `nana-block` entry so it is still there
// after this process dies. `get_entries` reads the file back.
const SIGN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../packages/nana-stage/lib/sign.mjs");
const STUB = `#!/usr/bin/env node
const fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const argv = process.argv.slice(2);
const flag = (f) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : null);
const KEY = process.env.NANA_STAGE_KEY || "";
fs.appendFileSync(process.env.STUB_OUT, JSON.stringify({ run: process.env.STUB_RUN, cwd: process.cwd(), key: KEY, session: flag("--session") }) + "\\n");
const readEntries = (f) => fs.readFileSync(f, "utf-8").split("\\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
function newSession() {
	const dir = path.join(process.env.STUB_SESSIONS, path.basename(process.cwd()));
	fs.mkdirSync(dir, { recursive: true });
	const f = path.join(dir, "s-" + crypto.randomBytes(5).toString("hex") + ".jsonl");
	fs.writeFileSync(f, JSON.stringify({ type: "session", version: 3, id: crypto.randomUUID(), timestamp: new Date().toISOString(), cwd: process.cwd() }) + "\\n");
	return f;
}
let afterFork = null; // "fail" | "hold:<ms>", armed by a fork for the next get_state
let sessionFile = flag("--session") || newSession();
const idOf = (f) => readEntries(f)[0].id;
let sessionId = idOf(sessionFile);
function append(entry) {
	const es = readEntries(sessionFile);
	const prev = es.filter((e) => e.type !== "session").at(-1);
	const full = { id: crypto.randomBytes(4).toString("hex"), parentId: prev ? prev.id : null, timestamp: new Date().toISOString(), ...entry };
	fs.appendFileSync(sessionFile, JSON.stringify(full) + "\\n");
	return full;
}
const BLOCK = (id) => ({ id, type: "card", title: "X", scope: "s", fields: [{ label: "a", value: 1 }], slot: "main", show: true,
	produced_by: { tool: "t", args: {}, toolCallId: "c1", at: "2026-09-09T00:00:00.000Z" } });
let signBlock = null;
const ready = import(${JSON.stringify(SIGN)}).then((m) => { signBlock = m.signBlock; });
const sign = (b, k) => ({ ...b, produced_by: { ...b.produced_by, sig: signBlock(k, b) } });
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
setTimeout(() => say({ type: "extension_ui_request", id: "st-1", method: "setStatus", statusKey: "nana-tools", statusText: "ready" }), 120);
let buf = "";
process.stdin.on("data", (c) => {
	buf += c;
	let nl;
	while ((nl = buf.indexOf("\\n")) >= 0) {
		const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
		if (!line.trim()) continue;
		let cmd; try { cmd = JSON.parse(line); } catch { continue; }
		try { fs.appendFileSync(process.env.STUB_TRACE, JSON.stringify({ type: cmd.type, t: Date.now() }) + "\\n"); } catch {}
		const ok = (data) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data });
		switch (cmd.type) {
			// STUB_NO_STATE = "this child can no longer say which session it holds", while
			// get_entries keeps working. Empty file = fail every time; a number = fail that
			// many calls, then answer normally again.
			case "get_state": {
				let budget = null;
				try { budget = fs.readFileSync(process.env.STUB_NO_STATE, "utf-8").trim(); } catch { budget = null; }
				if (afterFork === "fail") { afterFork = null; say({ type: "response", id: cmd.id, command: cmd.type, success: false, error: "stub: state unavailable" }); break; }
				if (afterFork && afterFork.startsWith("hold:")) {
					const ms = Number(afterFork.slice(5)); afterFork = null;
					const c = cmd;
					setTimeout(() => say({ type: "response", id: c.id, command: c.type, success: true, data: { isStreaming: false, isCompacting: false, sessionName: "stub", sessionFile, sessionId, model: { provider: "stub", id: "stub" }, thinkingLevel: "off" } }), ms);
					break;
				}
				if (budget !== null && (budget === "" || Number(budget) > 0)) {
					if (budget !== "") {
						const left = Number(budget) - 1;
						if (left > 0) fs.writeFileSync(process.env.STUB_NO_STATE, String(left)); else fs.unlinkSync(process.env.STUB_NO_STATE);
					}
					say({ type: "response", id: cmd.id, command: cmd.type, success: false, error: "stub: state unavailable" });
				} else ok({ isStreaming: false, isCompacting: false, sessionName: "stub", sessionFile, sessionId, model: { provider: "stub", id: "stub" }, thinkingLevel: "off" });
				break;
			}
			// what pi's fork/clone do to the ledger: the source session's entries are COPIED
			// into a NEW file under a NEW header id
			case "fork": case "clone": {
				const src = readEntries(sessionFile);
				const f = path.join(path.dirname(sessionFile), "s-" + crypto.randomBytes(5).toString("hex") + ".jsonl");
				const head = Object.assign({}, src[0], { id: crypto.randomUUID(), timestamp: new Date().toISOString() });
				fs.writeFileSync(f, [head].concat(src.slice(1)).map((e) => JSON.stringify(e)).join("\\n") + "\\n");
				sessionFile = f; sessionId = head.id;
				// arm an action for the state read the desk makes right after this fork
				try { afterFork = fs.readFileSync(process.env.STUB_AFTER_FORK, "utf-8").trim(); fs.unlinkSync(process.env.STUB_AFTER_FORK); } catch {}
				let holdFork = 0;
				try { holdFork = Number(fs.readFileSync(process.env.STUB_HOLD_FORK, "utf-8").trim()); fs.unlinkSync(process.env.STUB_HOLD_FORK); } catch {}
				if (holdFork > 0) { const c = cmd; setTimeout(() => say({ type: "response", id: c.id, command: c.type, success: true, data: { cancelled: false, text: "forked" } }), holdFork); }
				else ok({ cancelled: false, text: "forked" });
				break;
			}
			case "get_entries": ready.then(() => {
				const es = readEntries(sessionFile).filter((e) => e.type !== "session");
				ok({ entries: es, leafId: es.length ? es.at(-1).id : null, since: cmd.since || null });
			}); break;
			case "switch_session": {
				sessionFile = cmd.sessionPath; sessionId = idOf(sessionFile);
				ok({ cancelled: false });
				break;
			}
			case "prompt": ready.then(() => {
				ok({});
				say({ type: "agent_start" });
				if (/oldblock/.test(cmd.message)) {
					// signed with a key issued to ANOTHER child (the ledger accepts it; the live path must not)
					const b = sign(BLOCK("blk_old"), fs.readFileSync(process.env.STUB_OLD_KEY, "utf-8").trim());
					say({ type: "tool_execution_end", toolCallId: "c1", toolName: "t", isError: false, result: { content: [], details: { blocks: [b] } } });
				} else if (/block/.test(cmd.message)) {
					const b = sign(BLOCK("blk_" + crypto.randomBytes(3).toString("hex")), KEY);
					append({ type: "custom", customType: "nana-block", data: b });
					say({ type: "tool_execution_end", toolCallId: "c1", toolName: "t", isError: false, result: { content: [], details: { blocks: [b] } } });
				}
				say({ type: "agent_end", messages: [] });
				say({ type: "agent_settled" });
			}); break;
			case "abort": ok({}); break;
			default: ok({});
		}
	}
});
process.stdin.on("end", () => process.exit(0));
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

const manifest = (port, cwd) => ({ port, cwd, tools: ["read"], extensions: [extStage], trust: "no-approve", title: "T" });
fs.writeFileSync(path.join(appsDir, "alpha.json"), JSON.stringify(manifest(PA, cwdA)));
fs.writeFileSync(path.join(appsDir, "beta.json"), JSON.stringify(manifest(PB, cwdB)));

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const A = `http://127.0.0.1:${PA}`, B = `http://127.0.0.1:${PB}`;
const D = () => `http://127.0.0.1:${DESK}`;
const post = (base, p, body, origin = base) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body ?? {}) });
const get = (base, p) => fetch(base + p).then((r) => r.json());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const recordFile = (id) => path.join(STORE, `${id}.json`);
const recordOf = (id) => (fs.existsSync(recordFile(id)) ? JSON.parse(fs.readFileSync(recordFile(id), "utf-8")) : null);
const keysOf = (id) => recordOf(id)?.keys || [];
const manifestOf = (n) => JSON.parse(fs.readFileSync(path.join(appsDir, `${n}.json`), "utf-8"));
const setManifestSession = (n, file) => fs.writeFileSync(path.join(appsDir, `${n}.json`), JSON.stringify({ ...manifestOf(n), session: file }));

let server = null;
let log = "";
async function startServer(run, ports) {
	log = "";
	DESK = 0; // never match the PREVIOUS run's startup line
	server = spawn("node", [SERVER], {
		env: {
			...process.env, DESK_PI_ROOT: PI_ROOT, HOME: TD, DESK_PORT: "0", DESK_APPS_DIR: appsDir,
			STUB_OUT: OUT, STUB_SESSIONS: SESSIONS, STUB_OLD_KEY: OLD_KEY, STUB_RUN: run, STUB_NO_STATE: NO_STATE,
			STUB_AFTER_FORK: AFTER_FORK, STUB_HOLD_FORK: HOLD_FORK, STUB_TRACE: TRACE,
			// explicit: an outer DESK_STAGE_KEYS would beat the temporary HOME and send
			// this test's records into the operator's own store
			DESK_STAGE_KEYS: STORE,
			PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
		},
		stdio: ["ignore", "pipe", "pipe"],
	});
	server.stdout.on("data", (c) => (log += c));
	server.stderr.on("data", (c) => (log += c));
	for (let i = 0; i < 60; i++) {
		// the desk prints the port it actually bound; the app listeners come up after it
		const m = log.match(/nana code → http:\/\/127\.0\.0\.1:(\d+)/);
		if (m) DESK = Number(m[1]);
		try { if (DESK) { for (const p of ports) await fetch(p + "/api/manifest"); return; } } catch { /* not up yet */ }
		await sleep(250);
	}
	throw new Error(`run ${run}: app listeners never came up: ${log}`);
}
async function stopServer() {
	if (!server) return;
	const dead = new Promise((r) => server.on("exit", r));
	server.kill();
	await dead;
	server = null;
	await sleep(300); // let the OS release the listener ports before the next run binds them
}
// prompt and wait for the turn to settle, returning the live blocks of its tool event
async function promptAndCollect(base, message) {
	const ctl = new AbortController();
	const res = await fetch(base + "/api/events", { signal: ctl.signal });
	const reader = res.body.getReader();
	await post(base, "/api/prompt", { message });
	let text = "";
	for (let i = 0; i < 40 && !/agent_settled/.test(text); i++) text += new TextDecoder().decode((await reader.read()).value);
	ctl.abort();
	const line = text.split("\n").find((l) => l.startsWith("data: ") && /tool_execution_end/.test(l));
	return line ? JSON.parse(line.slice(6)).result.details.blocks : null;
}
const rpc = (id, command) => post(D(), `/api/session/${id}/rpc`, { command }, D()).then((r) => r.json());
const blockEntries = (entries) => entries.filter((e) => e.type === "custom" && String(e.customType).startsWith("nana-block"));
// what the stub recorded about each spawn: which run, which cwd, which key it was handed
const spawns = (run, cwd) => fs.readFileSync(OUT, "utf-8").trim().split("\n").map((l) => JSON.parse(l))
	.filter((r) => r.run === run && (!cwd || r.cwd === fs.realpathSync(cwd)));

try {
	// ── run 1: two fresh sessions (A for alpha, B for beta), one signed block each ──
	await startServer("1", [A, B]);
	let s = await post(A, "/api/session", {}).then((r) => r.json());
	check("run 1: alpha child spawned", s.state === "running" && s.tools === "ready", JSON.stringify(s));
	await post(B, "/api/session", {}).then((r) => r.json());
	let live = await promptAndCollect(A, "make a block");
	check("run 1: the live path passes the child's own signed block", live?.length === 1, JSON.stringify(live));
	await promptAndCollect(B, "make a block");
	let ent = await get(A, "/api/entries");
	check("run 1: the block is on the ledger unredacted", blockEntries(ent.entries).length === 1 && blockEntries(ent.entries)[0].customType === "nana-block", JSON.stringify(blockEntries(ent.entries).map((e) => e.customType)));
	const fileA = manifestOf("alpha").session, fileB = manifestOf("beta").session;
	check("run 1: the manifests point at the session files the children wrote", fs.existsSync(fileA || "") && fs.existsSync(fileB || ""), `${fileA} ${fileB}`);
	const idA = JSON.parse(fs.readFileSync(fileA, "utf-8").split("\n")[0]).id;
	const idB = JSON.parse(fs.readFileSync(fileB, "utf-8").split("\n")[0]).id;
	const keyA1 = spawns("1", cwdA)[0].key;
	const keyB1 = spawns("1", cwdB)[0].key;
	fs.writeFileSync(OLD_KEY, keyB1);

	// the key store itself: one file per session, named by the pi session header id
	const rec = recordOf(idA);
	check("store: one v1 record per session, named by the pi session header id", rec?.v === 1 && rec.keys[0] === keyA1, JSON.stringify(rec));
	const mode = (p) => (fs.existsSync(p) ? fs.statSync(p).mode & 0o777 : null);
	check("store: record mode 0600", mode(recordFile(idA)) === 0o600, String(mode(recordFile(idA))?.toString(8)));
	check("store: directory mode 0700", mode(STORE) === 0o700, String(mode(STORE)?.toString(8)));
	const storeDir = () => (fs.existsSync(STORE) ? fs.readdirSync(STORE) : []);
	check("store: no temp file left behind", storeDir().filter((f) => f.includes(".tmp")).length === 0, JSON.stringify(storeDir()));
	check("store: the two sessions got SEPARATE records", storeDir().filter((f) => f.endsWith(".json")).length === 2, JSON.stringify(storeDir()));

	await stopServer();

	// hand-edits between the runs: a forged signature and a block signed under a key
	// this desk never issued must BOTH stay redacted after the restart
	const bogus = { id: "blk_bogus", type: "card", title: "X", scope: "s", fields: [], slot: "main", show: true, produced_by: { tool: "t", args: {}, toolCallId: "c1", at: "z", sig: "0".repeat(64) } };
	const foreignKey = crypto.randomBytes(32).toString("hex");
	const foreignRaw = { id: "blk_foreign", type: "card", title: "X", scope: "s", fields: [], slot: "main", show: true, produced_by: { tool: "t", args: {}, toolCallId: "c1", at: "z" } };
	const foreign = { ...foreignRaw, produced_by: { ...foreignRaw.produced_by, sig: signBlock(foreignKey, foreignRaw) } };
	fs.appendFileSync(fileA, JSON.stringify({ id: "hand1", parentId: null, type: "custom", customType: "nana-block", data: bogus }) + "\n");
	fs.appendFileSync(fileA, JSON.stringify({ id: "hand2", parentId: "hand1", type: "custom", customType: "nana-block", data: foreign }) + "\n");

	// ── run 2: RESTART, resume A. THE REGRESSION. ──
	await startServer("2", [A, B]);
	s = await post(A, "/api/session", {}).then((r) => r.json());
	check("run 2: alpha resumed", s.state === "running", JSON.stringify(s));
	const run2 = spawns("2", cwdA);
	check("run 2: the resumed child was handed the SAME key the store recorded for that session", run2[0].key === keyA1, `${run2[0].key.slice(0, 8)} vs ${keyA1.slice(0, 8)}`);
	ent = await get(A, "/api/entries");
	let be = blockEntries(ent.entries);
	check("run 2: a block minted before the restart is STILL unredacted", be.filter((e) => e.customType === "nana-block").length === 1, JSON.stringify(be.map((e) => [e.id, e.customType])));
	check("run 2: a hand-forged signature is still redacted", be.find((e) => e.id === "hand1")?.customType === "nana-block-rejected", JSON.stringify(be.find((e) => e.id === "hand1")));
	check("run 2: a block signed under a key this desk never issued is still redacted", be.find((e) => e.id === "hand2")?.customType === "nana-block-rejected", JSON.stringify(be.find((e) => e.id === "hand2")));
	check("run 2: resuming reused the recorded key rather than appending a new one", keysOf(idA).length === 1, JSON.stringify(recordOf(idA)));
	await stopServer();

	// ── run 3: the session file is RENAMED, then resumed by its new path ──
	const fileA2 = path.join(path.dirname(fileA), `renamed-${path.basename(fileA)}`);
	fs.renameSync(fileA, fileA2);
	setManifestSession("alpha", fileA2);
	await startServer("3", [A, B]);
	s = await post(A, "/api/session", {}).then((r) => r.json());
	ent = await get(A, "/api/entries");
	check("run 3: renamed session file resumes and its old block still verifies (keyed by header id, not path)",
		blockEntries(ent.entries).filter((e) => e.customType === "nana-block").length === 1, JSON.stringify(blockEntries(ent.entries).map((e) => e.customType)));

	// switch_session into B — a session whose key was issued to the OTHER child
	let r = await post(D(), `/api/session/${s.id}/rpc`, { command: { type: "switch_session", sessionPath: fileB } }, D());
	check("run 3: switch_session accepted", r.status === 200 && (await r.json()).success === true, String(r.status));
	ent = await get(A, "/api/entries");
	be = blockEntries(ent.entries);
	check("run 3: after the switch, session B's own history verifies under B's recorded key",
		be.length === 1 && be[0].customType === "nana-block", JSON.stringify(be.map((e) => e.customType)));
	check("run 3: this child's key is now recorded under session B too (most recent first)",
		keysOf(idB).length === 2 && keysOf(idB)[0] === keyA1 && keysOf(idB)[1] === keyB1,
		JSON.stringify(keysOf(idB).map((k) => k.slice(0, 8))));
	// the child can no longer say WHICH session it holds: the ledger read must fall back
	// to this child's key alone, never to the recorded keys of the session it held before
	fs.writeFileSync(NO_STATE, "");
	ent = await get(A, "/api/entries");
	be = blockEntries(ent.entries);
	check("run 3: an unresolved get_state drops the recorded-key widening entirely (no stale authority)",
		be.length === 1 && be[0].customType === "nana-block-rejected", JSON.stringify(be.map((e) => e.customType)));
	fs.rmSync(NO_STATE);
	ent = await get(A, "/api/entries");
	check("run 3: ...and it verifies again as soon as the session can be established",
		blockEntries(ent.entries)[0].customType === "nana-block", JSON.stringify(blockEntries(ent.entries).map((e) => e.customType)));

	live = await promptAndCollect(A, "oldblock please");
	check("run 3: LIVE path unchanged — a block signed with a recorded but FOREIGN key is dropped", Array.isArray(live) && live.length === 0, JSON.stringify(live));
	live = await promptAndCollect(A, "make a block");
	check("run 3: LIVE path still passes this child's own block", live?.length === 1, JSON.stringify(live));

	// FORK: pi copies the source session's entries — signed blocks and all — into a new
	// file with a NEW header id. B's blocks were signed under TWO different keys; both
	// must keep verifying in the fork.
	r = await rpc(s.id, { type: "fork", entryId: "x" });
	check("run 3: fork accepted", r?.success === true, JSON.stringify(r));
	const fileC = (await rpc(s.id, { type: "get_state" }))?.data?.sessionFile;
	const idC = (await rpc(s.id, { type: "get_state" }))?.data?.sessionId;
	ent = await get(A, "/api/entries");
	be = blockEntries(ent.entries);
	check("run 3: a FORK inherits the source session's key set — mixed-key blocks all verify",
		be.length === 2 && be.every((e) => e.customType === "nana-block"), JSON.stringify(be.map((e) => e.customType)));
	check("run 3: the fork's record was seeded from the source, not just given this child's key",
		JSON.stringify(keysOf(idC)) === JSON.stringify([keyA1, keyB1]),
		JSON.stringify(keysOf(idC).map((k) => k.slice(0, 8))));

	// fork AGAIN and restart WITHOUT ever reading the ledger on the new session: the
	// record has to be written when the desk observes the fork, not at the next replay
	r = await rpc(s.id, { type: "fork", entryId: "x" });
	const fileD = (await rpc(s.id, { type: "get_state" }))?.data?.sessionFile;
	check("run 3: second fork accepted", r?.success === true && typeof fileD === "string" && fileD !== fileC, String(fileD));

	// THE WRONG-PREDECESSOR CASE. Move the child into session Z with the follow-up
	// state read FAILING, then fork. The fork must inherit from Z — what the child
	// actually holds, established by asking it before the command — and not from the
	// last id the desk happened to observe, which is now stale.
	const idZ = crypto.randomUUID();
	const keyZ = crypto.randomBytes(32).toString("hex");
	const fileZ = path.join(SESSIONS, "repo-a", `z-${idZ.slice(0, 8)}.jsonl`);
	const rawZ = { id: "blk_z", type: "card", title: "Z", scope: "s", fields: [], slot: "main", show: true, produced_by: { tool: "t", args: {}, toolCallId: "c1", at: "z" } };
	fs.writeFileSync(fileZ, [
		JSON.stringify({ type: "session", version: 3, id: idZ, timestamp: new Date().toISOString(), cwd: cwdA }),
		JSON.stringify({ id: "z1", parentId: null, type: "custom", customType: "nana-block", data: { ...rawZ, produced_by: { ...rawZ.produced_by, sig: signBlock(keyZ, rawZ) } } }),
	].join("\n") + "\n");
	fs.writeFileSync(recordFile(idZ), JSON.stringify({ v: 1, keys: [keyZ], updatedAt: Date.now() }));
	fs.writeFileSync(NO_STATE, "1"); // exactly one get_state fails: the switch's own follow-up
	r = await rpc(s.id, { type: "switch_session", sessionPath: fileZ });
	check("run 3: switch into Z accepted (its follow-up state read fails)", r?.success === true, JSON.stringify(r));
	r = await rpc(s.id, { type: "fork", entryId: "x" });
	const idE = (await rpc(s.id, { type: "get_state" }))?.data?.sessionId;
	check("run 3: a fork after an UNOBSERVED switch inherits from what the child actually holds, not the stale predecessor",
		keysOf(idE).includes(keyZ) && !keysOf(idE).includes(keyB1),
		`${JSON.stringify(keysOf(idE).map((k) => k.slice(0, 8)))} kZ=${keyZ.slice(0, 8)} kB=${keyB1.slice(0, 8)}`);
	ent = await get(A, "/api/entries");
	check("run 3: ...so that fork's inherited block verifies",
		blockEntries(ent.entries).every((e) => e.customType === "nana-block") && blockEntries(ent.entries).length === 1,
		JSON.stringify(blockEntries(ent.entries).map((e) => e.customType)));

	// AN OVERLAPPING LEDGER READ MUST NOT DEFEAT THE FORK. Hold the state read the
	// desk makes right after the fork, and slip a ledger read into that window: it
	// observes the brand-new session, and if it files it under the live child's key
	// alone the inheritance is stranded for good.
	fs.writeFileSync(AFTER_FORK, "hold:900");
	const forking = rpc(s.id, { type: "fork", entryId: "x" });
	await sleep(250); // the fork has landed; its confirmation is still held
	ent = await get(A, "/api/entries"); // ← observes the new session mid-transition
	await forking;
	const idF = (await rpc(s.id, { type: "get_state" }))?.data?.sessionId;
	check("run 3: a ledger read that lands mid-fork does not strand the inheritance",
		keysOf(idF).includes(keyZ) && keysOf(idF).includes(keyA1),
		`${JSON.stringify(keysOf(idF).map((k) => k.slice(0, 8)))} kZ=${keyZ.slice(0, 8)}`);
	ent = await get(A, "/api/entries");
	check("run 3: ...and its inherited block verifies afterwards",
		blockEntries(ent.entries).length === 1 && blockEntries(ent.entries)[0].customType === "nana-block",
		JSON.stringify(blockEntries(ent.entries).map((e) => e.customType)));

	// TWO LIFECYCLE RPCs MUST NOT INTERLEAVE. Hold the first fork's own response and
	// fire a second at once: nothing of the second may reach the child until the
	// first transition has finished, or the second captures a source the first has
	// already moved away from.
	fs.writeFileSync(HOLD_FORK, "700");
	fs.writeFileSync(TRACE, "");
	const f1 = rpc(s.id, { type: "fork", entryId: "x" });
	const f2 = rpc(s.id, { type: "fork", entryId: "x" });
	await Promise.all([f1, f2]);
	const trace = fs.readFileSync(TRACE, "utf-8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
	const firstFork = trace.findIndex((e) => e.type === "fork");
	const nextAfter = trace[firstFork + 1];
	check("run 3: a second lifecycle RPC sends nothing until the first transition completes",
		firstFork >= 0 && nextAfter && nextAfter.t - trace[firstFork].t >= 600,
		JSON.stringify(trace.map((e) => `${e.type}+${e.t - trace[0].t}`)));

	// A COMMAND THAT DID NOT SUCCEED ARMS NOTHING. The child is left wherever it is,
	// and the next observation must record only its own key — no inheritance from a
	// source the desk confirmed for a fork that never happened.
	r = await rpc(s.id, { type: "switch_session", sessionPath: fileZ });
	check("run 3: a later lifecycle RPC still works after the held pair", r?.success === true, JSON.stringify(r));

	// A FAILED POST-FORK OBSERVATION IS RECOVERABLE. The desk confirmed the source
	// before the fork; if the state read that would have attributed the destination
	// fails, the next confirmed observation has to finish the job — otherwise the
	// fork's whole inherited history is lost for a state read that came back empty.
	fs.writeFileSync(AFTER_FORK, "fail");
	r = await rpc(s.id, { type: "fork", entryId: "x" });
	check("run 3: fork accepted though its confirmation failed", r?.success === true, JSON.stringify(r));
	ent = await get(A, "/api/entries"); // the next confirmed observation completes the inheritance
	check("run 3: a fork whose confirmation FAILED still inherits at the next confirmed observation",
		blockEntries(ent.entries).length === 1 && blockEntries(ent.entries)[0].customType === "nana-block",
		JSON.stringify(blockEntries(ent.entries).map((e) => e.customType)));
	await stopServer();

	// ── run 4: RESTART, resume B — two different keys, both recorded ──
	setManifestSession("alpha", fileB);
	await startServer("4", [A, B]);
	await post(A, "/api/session", {}).then((r) => r.json());
	ent = await get(A, "/api/entries");
	be = blockEntries(ent.entries);
	check("run 4: every block of session B verifies, across BOTH keys the desk issued for it",
		be.length === 2 && be.every((e) => e.customType === "nana-block"), JSON.stringify(be.map((e) => [e.data?.id, e.customType])));
	await stopServer();

	// ── run 5: resume the fork nobody ever read the ledger of ──
	setManifestSession("alpha", fileD);
	await startServer("5", [A, B]);
	await post(A, "/api/session", {}).then((r) => r.json());
	ent = await get(A, "/api/entries");
	be = blockEntries(ent.entries);
	check("run 5: a fork resumed after a restart, with no ledger read in between, still verifies both keys",
		be.length === 2 && be.every((e) => e.customType === "nana-block"), JSON.stringify(be.map((e) => [e.data?.id, e.customType])));
	await stopServer();

	// ── the store's own properties (direct, deterministic) ──
	// One file per session, so these are per-file properties: there is no shared
	// document to merge, lock or lose.
	const td2 = fs.mkdtempSync(path.join(os.tmpdir(), "stagekey-unit-"));
	const d2 = path.join(td2, "nested", "stage-keys");
	const rec2 = (id) => path.join(d2, `${id}.json`);
	const ls2 = () => (fs.existsSync(d2) ? fs.readdirSync(d2) : []);
	const keys = Array.from({ length: 9 }, () => crypto.randomBytes(32).toString("hex"));
	let st = new StageKeyStore({ dir: d2, log: () => {} });
	for (const k of keys) st.record("sid", k);
	check("store: capped at 8 keys, most recent first", JSON.stringify(new StageKeyStore({ dir: d2, log: () => {} }).keysFor("sid")) === JSON.stringify(keys.slice().reverse().slice(0, 8)));
	check("store: an already-recorded key is a no-op (no rewrite)", st.record("sid", keys[8]) === false);
	check("store: a directory the desk created is 0700", (fs.statSync(d2).mode & 0o777) === 0o700, (fs.statSync(d2).mode & 0o777).toString(8));
	check("store: each record is 0600", (fs.statSync(rec2("sid")).mode & 0o777) === 0o600, (fs.statSync(rec2("sid")).mode & 0o777).toString(8));

	// seeding is a UNION, not "fill a blank": a record that already exists (an
	// overlapping observation filed the live child's key first) still receives the
	// confirmed source's keys, and keeps what was there in front
	const kNew = crypto.randomBytes(32).toString("hex");
	const kSrc = [crypto.randomBytes(32).toString("hex"), crypto.randomBytes(32).toString("hex")];
	st.record("dest", kNew);
	check("store: seeding a NON-BLANK record adds the source's keys instead of refusing",
		st.seed("dest", kSrc) === true && JSON.stringify(st.keysFor("dest")) === JSON.stringify([kNew, ...kSrc]),
		JSON.stringify(st.keysFor("dest").map((k) => k.slice(0, 6))));
	check("store: ...and seeding what is already there changes nothing", st.seed("dest", kSrc) === false);

	// TWO desks on one directory: the file is authority on every read, so neither can
	// answer from a stale picture of the other's session or overwrite it
	const one = new StageKeyStore({ dir: d2, log: () => {} });
	const two = new StageKeyStore({ dir: d2, log: () => {} });
	const kk = Array.from({ length: 4 }, () => crypto.randomBytes(32).toString("hex"));
	one.keysFor("shared"); // read it once: a cache would freeze what it saw here
	two.record("shared", kk[0]);
	two.record("shared", kk[1]);
	one.record("shared", kk[2]);
	two.record("shared", kk[3]);
	check("store: sequential records from two instances keep every key",
		kk.every((k) => one.keysFor("shared").includes(k)), JSON.stringify(one.keysFor("shared").map((k) => k.slice(0, 6))));
	check("store: ...and either instance reads what the other wrote", JSON.stringify(one.keysFor("shared")) === JSON.stringify(two.keysFor("shared")));

	// a session id becomes a FILENAME here, so anything not name-shaped is refused
	// rather than escaped — neither recorded nor looked up
	check("store: a path-shaped session id is refused, not written", st.record("../escape", keys[0]) === false && !fs.existsSync(path.join(td2, "nested", "escape.json")));
	check("store: ...and never looked up", st.keysFor("../escape").length === 0 && st.keysFor("a/b").length === 0);

	// an interrupted write leaves the previous record intact (temp + rename, never in place)
	const before = fs.readFileSync(rec2("sid"), "utf-8");
	const realRename = fs.renameSync;
	fs.renameSync = () => { throw new Error("simulated crash between write and rename"); };
	let threw = false;
	try { st.record("sid", crypto.randomBytes(32).toString("hex")); } catch { threw = true; }
	fs.renameSync = realRename;
	check("store: a write interrupted before the rename does not throw at the caller", threw === false);
	check("store: ...and leaves the previous record byte-identical", fs.readFileSync(rec2("sid"), "utf-8") === before);
	check("store: ...and leaves no temp file behind", ls2().filter((f) => f.includes(".tmp")).length === 0, JSON.stringify(ls2()));

	// a save that FAILED is retried by the next record for that session, even one that
	// changes nothing — otherwise the desk keeps working and loses the key at the next start
	const kr = crypto.randomBytes(32).toString("hex");
	fs.renameSync = () => { throw new Error("simulated transient failure"); };
	st.record("sidR", kr);
	fs.renameSync = realRename;
	check("store: a failed save leaves nothing on disk for that session", !fs.existsSync(rec2("sidR")));
	check("store: ...and a LATER record of the SAME key retries the save", st.record("sidR", kr) === false && fs.existsSync(rec2("sidR")));
	check("store: ...so the key survives the next restart", new StageKeyStore({ dir: d2, log: () => {} }).keysFor("sidR")[0] === kr);
	check("store: ...and one session's failed write did not disturb another's record", fs.readFileSync(rec2("sid"), "utf-8") === before);

	// a corrupt record costs THAT session and nothing else
	fs.writeFileSync(rec2("sid"), "{not json");
	st = new StageKeyStore({ dir: d2, log: () => {} });
	check("store: a corrupt record reads as empty", st.keysFor("sid").length === 0);
	check("store: ...and is moved aside, not deleted", ls2().some((f) => f.startsWith("sid.json.corrupt-")), JSON.stringify(ls2()));
	check("store: ...while every other session's record still reads", st.keysFor("sidR")[0] === kr);
	const k9 = crypto.randomBytes(32).toString("hex");
	st.record("sid3", k9);
	check("store: ...and the next record writes a fresh, valid one", new StageKeyStore({ dir: d2, log: () => {} }).keysFor("sid3")[0] === k9);

	// a directory that was already there is NOT re-permissioned: it is not ours to change
	const pre = path.join(td2, "pre-existing");
	fs.mkdirSync(pre, { recursive: true });
	fs.chmodSync(pre, 0o777);
	new StageKeyStore({ dir: pre, log: () => {} }).record("sidP", crypto.randomBytes(32).toString("hex"));
	check("store: a pre-existing store directory is left as the operator made it", (fs.statSync(pre).mode & 0o777) === 0o777, (fs.statSync(pre).mode & 0o777).toString(8));

	// the existence prune: drops ids with no session file, but NEVER acts on an empty
	// enumeration (indistinguishable from "the sessions dir could not be read")
	st = new StageKeyStore({ dir: d2, log: () => {}, knownSessionIds: () => new Set() });
	check("store: an EMPTY session enumeration prunes nothing", st.keysFor("sid3")[0] === k9);
	st = new StageKeyStore({ dir: d2, log: () => {}, knownSessionIds: () => new Set(["sidR"]) });
	check("store: an id with no session file is pruned", st.keysFor("sid3").length === 0 && !fs.existsSync(rec2("sid3")));
	check("store: ...and a session that still exists is kept", st.keysFor("sidR")[0] === kr);
	check("store: ...and a moved-aside record is not swept with it", ls2().some((f) => f.startsWith("sid.json.corrupt-")), JSON.stringify(ls2()));
	// the prune deletes records; it must not delete files it could never have written
	fs.writeFileSync(path.join(d2, "operator.notes.json"), "{}");
	fs.writeFileSync(path.join(d2, "sidR.json.12345.abcdef.tmp"), "{}");
	new StageKeyStore({ dir: d2, log: () => {}, knownSessionIds: () => new Set(["sidR"]) }).keysFor("sidR");
	check("store: the prune leaves a file it could not have written (a dotted name is not a session id)", fs.existsSync(path.join(d2, "operator.notes.json")), JSON.stringify(ls2()));
	check("store: ...and leaves stray temps and moved-aside records alone",
		fs.existsSync(path.join(d2, "sidR.json.12345.abcdef.tmp")) && ls2().some((f) => f.startsWith("sid.json.corrupt-")), JSON.stringify(ls2()));

	fs.rmSync(td2, { recursive: true, force: true });
} catch (e) {
	console.error("HARNESS ERROR", e, log.slice(-3000));
	fails++;
} finally {
	await stopServer();
	fs.rmSync(TD, { recursive: true, force: true });
}
console.log(fails ? `${fails} FAILED` : "all PASS");
process.exit(fails ? 1 : 0);
