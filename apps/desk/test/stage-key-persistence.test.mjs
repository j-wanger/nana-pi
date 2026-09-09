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
//      under B's recorded key, a LIVE block signed with that other key is still
//      dropped (live path = this child's key only), and this child's key is
//      recorded under B
//   4  RESTART, resume B → both keys' blocks verify (any-of-recorded-keys)
//
// Plus direct StageKeyStore checks for the file properties the server path cannot
// show deterministically: the 8-key cap, a corrupt store, an interrupted write, and
// the existence prune's refusal to act on an empty session enumeration.
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

const DESK = Number(process.env.DESK_TEST_PORT || 4441);
const PA = 4442, PB = 4443;
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
// where the server will put its own store, given HOME=TD
const STORE = path.join(TD, ".pi", "agent", "nana-desk", "stage-keys.json");
const OUT = path.join(TD, "stub-out.jsonl");
const OLD_KEY = path.join(TD, "old-key.txt");
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
		const ok = (data) => say({ type: "response", id: cmd.id, command: cmd.type, success: true, data });
		switch (cmd.type) {
			case "get_state": ok({ isStreaming: false, isCompacting: false, sessionName: "stub", sessionFile, sessionId, model: { provider: "stub", id: "stub" }, thinkingLevel: "off" }); break;
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
const A = `http://127.0.0.1:${PA}`, B = `http://127.0.0.1:${PB}`, D = `http://127.0.0.1:${DESK}`;
const post = (base, p, body, origin = base) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body ?? {}) });
const get = (base, p) => fetch(base + p).then((r) => r.json());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readStore = () => (fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, "utf-8")) : null);
const manifestOf = (n) => JSON.parse(fs.readFileSync(path.join(appsDir, `${n}.json`), "utf-8"));
const setManifestSession = (n, file) => fs.writeFileSync(path.join(appsDir, `${n}.json`), JSON.stringify({ ...manifestOf(n), session: file }));

let server = null;
let log = "";
async function startServer(run, ports) {
	log = "";
	server = spawn("node", [SERVER], {
		env: {
			...process.env, DESK_PI_ROOT: PI_ROOT, HOME: TD, DESK_PORT: String(DESK), DESK_APPS_DIR: appsDir,
			STUB_OUT: OUT, STUB_SESSIONS: SESSIONS, STUB_OLD_KEY: OLD_KEY, STUB_RUN: run,
			PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
		},
		stdio: ["ignore", "pipe", "pipe"],
	});
	server.stdout.on("data", (c) => (log += c));
	server.stderr.on("data", (c) => (log += c));
	for (let i = 0; i < 60; i++) {
		try { for (const p of ports) await fetch(p + "/api/manifest"); return; } catch { await sleep(250); }
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

	// the key store itself
	const store = readStore();
	check("store: v1 shape, keyed by the pi session header id", store?.v === 1 && Array.isArray(store.sessions?.[idA]?.keys) && store.sessions[idA].keys[0] === keyA1, JSON.stringify(store).slice(0, 300));
	const mode = (p) => (fs.existsSync(p) ? fs.statSync(p).mode & 0o777 : null);
	check("store: file mode 0600", mode(STORE) === 0o600, String(mode(STORE)?.toString(8)));
	check("store: directory mode 0700", mode(path.dirname(STORE)) === 0o700, String(mode(path.dirname(STORE))?.toString(8)));
	const storeDir = () => (fs.existsSync(path.dirname(STORE)) ? fs.readdirSync(path.dirname(STORE)) : []);
	check("store: no temp file left behind", storeDir().filter((f) => f.includes(".tmp")).length === 0, JSON.stringify(storeDir()));

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
	check("run 2: resuming reused the recorded key rather than appending a new one", readStore()?.sessions?.[idA]?.keys.length === 1, JSON.stringify(readStore()?.sessions?.[idA]));
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
	let r = await post(D, `/api/session/${s.id}/rpc`, { command: { type: "switch_session", sessionPath: fileB } }, D);
	check("run 3: switch_session accepted", r.status === 200 && (await r.json()).success === true, String(r.status));
	ent = await get(A, "/api/entries");
	be = blockEntries(ent.entries);
	check("run 3: after the switch, session B's own history verifies under B's recorded key",
		be.length === 1 && be[0].customType === "nana-block", JSON.stringify(be.map((e) => e.customType)));
	check("run 3: this child's key is now recorded under session B too (most recent first)",
		readStore()?.sessions?.[idB]?.keys.length === 2 && readStore()?.sessions?.[idB]?.keys[0] === keyA1 && readStore()?.sessions?.[idB]?.keys[1] === keyB1,
		JSON.stringify((readStore()?.sessions?.[idB]?.keys || []).map((k) => k.slice(0, 8))));
	live = await promptAndCollect(A, "oldblock please");
	check("run 3: LIVE path unchanged — a block signed with a recorded but FOREIGN key is dropped", Array.isArray(live) && live.length === 0, JSON.stringify(live));
	live = await promptAndCollect(A, "make a block");
	check("run 3: LIVE path still passes this child's own block", live?.length === 1, JSON.stringify(live));
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

	// ── the store file's own properties (direct, deterministic) ──
	const td2 = fs.mkdtempSync(path.join(os.tmpdir(), "stagekey-unit-"));
	const f2 = path.join(td2, "nested", "stage-keys.json");
	const keys = Array.from({ length: 9 }, () => crypto.randomBytes(32).toString("hex"));
	let st = new StageKeyStore({ file: f2, log: () => {} });
	for (const k of keys) st.record("sid", k);
	check("store: capped at 8 keys, most recent first", JSON.stringify(new StageKeyStore({ file: f2, log: () => {} }).keysFor("sid")) === JSON.stringify(keys.slice().reverse().slice(0, 8)));
	check("store: an already-recorded key is a no-op (no rewrite)", st.record("sid", keys[8]) === false);

	// an interrupted write leaves the previous file intact (temp + rename, never in place)
	const before = fs.readFileSync(f2, "utf-8");
	const realRename = fs.renameSync;
	fs.renameSync = () => { throw new Error("simulated crash between write and rename"); };
	let threw = false;
	try { st.record("sid2", crypto.randomBytes(32).toString("hex")); } catch { threw = true; }
	fs.renameSync = realRename;
	check("store: a write interrupted before the rename does not throw at the caller", threw === false);
	check("store: ...and leaves the previous store byte-identical", fs.readFileSync(f2, "utf-8") === before);
	check("store: ...and leaves no temp file behind", fs.readdirSync(path.dirname(f2)).filter((f) => f.includes(".tmp")).length === 0, JSON.stringify(fs.readdirSync(path.dirname(f2))));

	// corrupt store → moved aside, start empty, still serves
	fs.writeFileSync(f2, "{not json");
	st = new StageKeyStore({ file: f2, log: () => {} });
	check("store: a corrupt store reads as empty", st.keysFor("sid").length === 0);
	check("store: ...and the unreadable file is moved aside, not deleted", fs.readdirSync(path.dirname(f2)).some((f) => f.includes(".corrupt-")), JSON.stringify(fs.readdirSync(path.dirname(f2))));
	const k9 = crypto.randomBytes(32).toString("hex");
	st.record("sid3", k9);
	check("store: ...and the next record writes a fresh, valid store", new StageKeyStore({ file: f2, log: () => {} }).keysFor("sid3")[0] === k9);

	// the existence prune: drops ids with no session file, but NEVER acts on an empty
	// enumeration (indistinguishable from "the sessions dir could not be read")
	st = new StageKeyStore({ file: f2, log: () => {}, knownSessionIds: () => new Set() });
	check("store: an EMPTY session enumeration prunes nothing", st.keysFor("sid3")[0] === k9);
	st = new StageKeyStore({ file: f2, log: () => {}, knownSessionIds: () => new Set(["other"]) });
	check("store: an id with no session file is pruned", st.keysFor("sid3").length === 0);
	st.record("other", k9);
	check("store: ...and a pruned id is not resurrected by the next write", new StageKeyStore({ file: f2, log: () => {} }).keysFor("sid3").length === 0);
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
