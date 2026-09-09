// The desk's session READ path is now pi's own parser (`parseSessionEntries` +
// `migrateSessionEntries`, imported from the installed package root — see
// apps/desk/pi-session.mjs). This test is the parity contract for that swap:
//
//   1. RESOLUTION — the parser comes from the install that is TIED to the binary the
//      desk spawns, and carries the three exports it needs. (The ways resolution can
//      be fooled — shims, stale copies, two identical versions — are
//      `test/pi-resolution.test.mjs`; this file only checks the happy path holds.)
//   2. PARITY on a session written by pi ITSELF (SessionManager, public root
//      export): the desk's /api/sessions + /api/transcript answers are identical to
//      what the OLD hand-rolled parser produced, on the four things a reader
//      actually uses — title, name, active-branch length, leaf id.
//   3. pi is the JUDGE of the branch: the desk's on-branch ids must equal
//      `SessionManager.getBranch()` (session_info dropped, which the desk does not
//      render), including across a real branch point.
//   4. Three DELIBERATE divergences from the old parser, all of them the reason for
//      the swap (plus, at the end, the corruption shapes the swap could have
//      regressed: a session line that is valid JSON but not an object, and a header
//      with no id):
//        a. a v1 session (no id/parentId, `hookMessage` role) rendered as ZERO
//           entries before; pi's migration makes it readable, in memory only —
//           the file on disk must be byte-identical afterwards, and the ids must be
//           the SAME on a second read (pi's migration mints random ones).
//        b. after a rename, pi chains the next message to the `session_info` entry.
//           The old walk had no such entry in its index, so the chain broke there
//           and the whole history came back dimmed as an abandoned branch.
//
// Zero-dep. Needs the real pi installed (so does the desk). Own port, own HOME.
// Run: node apps/desk/test/pi-session-parity.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadPiSession, PI_MIN_VERSION, resolvePiBin } from "../pi-session.mjs";

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };

const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-pi-parity-"));
const repo = path.join(TD, "repo");
const SESS = path.join(TD, ".pi", "agent", "sessions", "--parity--");
for (const d of [repo, SESS]) fs.mkdirSync(d, { recursive: true });

// ── the OLD parser, verbatim (pre-2026-09-09 server.mjs) — the "before" side ──
function oldReadSessionMeta(file) {
	let head, size;
	try {
		size = fs.statSync(file).size;
		const fd = fs.openSync(file, "r");
		const buf = Buffer.alloc(65536);
		const n = fs.readSync(fd, buf, 0, 65536, 0);
		fs.closeSync(fd);
		head = buf.toString("utf-8", 0, n);
	} catch {
		return null;
	}
	const lines = head.split("\n");
	let header;
	try {
		header = JSON.parse(lines[0]);
	} catch {
		return null;
	}
	let title = "";
	let name = null;
	const scanLine = (line) => {
		if (!line) return;
		if (!title && line.includes('"role":"user"')) {
			try {
				const e = JSON.parse(line);
				if (e.type === "message" && e.message?.role === "user") {
					const c = e.message.content;
					const text = typeof c === "string" ? c : (c || []).find((b) => b.type === "text")?.text || "";
					title = text.slice(0, 120).replace(/\s+/g, " ").trim();
				}
			} catch {}
		}
		if (line.includes('"type":"session_info"')) {
			try {
				const e = JSON.parse(line);
				if (e.type === "session_info" && typeof e.name === "string") name = e.name || null;
			} catch {}
		}
	};
	for (const line of lines.slice(1)) scanLine(line);
	if (size > 65536) {
		const fd = fs.openSync(file, "r");
		const buf = Buffer.alloc(32768);
		const n = fs.readSync(fd, buf, 0, 32768, Math.max(0, size - 32768));
		fs.closeSync(fd);
		for (const line of buf.toString("utf-8", 0, n).split("\n")) scanLine(line);
	}
	return { cwd: header.cwd, id: header.id, title, name };
}

function oldParseTranscript(file) {
	const raw = fs.readFileSync(file, "utf-8").split("\n");
	let header = null;
	const entries = [];
	let name = null;
	for (const line of raw) {
		if (!line) continue;
		let e;
		try {
			e = JSON.parse(line);
		} catch {
			continue;
		}
		if (e.type === "session") { header = e; continue; }
		if (e.type === "session_info") { if (typeof e.name === "string") name = e.name || null; continue; }
		if (!e.id) continue;
		entries.push(e);
	}
	const byId = new Map(entries.map((e) => [e.id, e]));
	const onBranch = new Set();
	let cur = entries.length ? entries[entries.length - 1] : null;
	while (cur && !onBranch.has(cur.id)) {
		onBranch.add(cur.id);
		cur = cur.parentId ? byId.get(cur.parentId) : null;
	}
	return {
		cwd: header?.cwd, sessionId: header?.id, name, total: entries.length,
		entries: entries.map((e) => ({ ...e, onBranch: onBranch.has(e.id) })),
	};
}

const branchOf = (t) => t.entries.filter((e) => e.onBranch).map((e) => e.id);
const leafOf = (t) => branchOf(t).at(-1) ?? null;

let server;
try {
	// ── 1. resolution + exports ──
	const PI_BIN = resolvePiBin();
	const pi = await loadPiSession(PI_BIN);
	check("the parser comes from the install tied to the pi we spawn", !!pi.root && !!pi.via, `${pi.via} → ${pi.root}`);
	check("…and it is a real package.json with a version", !!pi.version, String(pi.version));
	check("…exporting parseSessionEntries + migrateSessionEntries + CURRENT_SESSION_VERSION",
		typeof pi.parseSessionEntries === "function" && typeof pi.migrateSessionEntries === "function" && typeof pi.CURRENT_SESSION_VERSION === "number",
		`v${pi.CURRENT_SESSION_VERSION}`);
	check(`…at or above the required minimum ${PI_MIN_VERSION}, with nothing to warn about`, pi.warnings.length === 0, pi.warnings.join("; "));

	// ── the fixtures, written by pi's OWN SessionManager (public root export) ──
	const { SessionManager } = await import(pathToFileURL(pi.entryPoint).href);
	const mgr = SessionManager.create(repo, SESS);
	const FILE = mgr.getSessionFile();
	const u1 = mgr.appendMessage({ role: "user", content: [{ type: "text", text: "  parity  fixture   first message " }] });
	mgr.appendMessage({ role: "assistant", content: [{ type: "text", text: "first answer" }], provider: "test", model: "test-model" });
	const branchPoint = u1;
	mgr.appendMessage({ role: "user", content: [{ type: "text", text: "abandoned follow-up" }] });
	mgr.branch(branchPoint); // everything after this point is a second branch
	mgr.appendMessage({ role: "assistant", content: [{ type: "text", text: "second answer" }], provider: "test", model: "test-model" });
	mgr.appendMessage({ role: "user", content: [{ type: "text", text: "live tip" }] });
	mgr.appendSessionInfo("Named By Pi");

	// second fixture: a v1 file (pre-tree format) — no version, no id/parentId
	const V1 = path.join(SESS, "2026-01-01T00-00-00-000Z_v1.jsonl");
	fs.writeFileSync(V1, [
		JSON.stringify({ type: "session", id: "v1sess", timestamp: "2026-01-01T00:00:00.000Z", cwd: repo }),
		JSON.stringify({ type: "message", timestamp: "2026-01-01T00:00:01.000Z", message: { role: "user", content: "legacy v1 session" } }),
		JSON.stringify({ type: "message", timestamp: "2026-01-01T00:00:02.000Z", message: { role: "hookMessage", content: "legacy role" } }),
	].join("\n") + "\n");
	const v1Before = fs.readFileSync(V1);

	// third fixture: lines that are valid JSON but NOT entries. pi's parser keeps
	// them (it only skips lines that do not parse) and pi's own migration then dies
	// on the first `e.type` — so the desk has to filter them at the boundary or a
	// single stray line 500s /api/sessions for every session on the machine.
	const SCALAR = path.join(SESS, "2026-01-01T00-00-01-000Z_scalar.jsonl");
	fs.writeFileSync(SCALAR, [
		JSON.stringify({ type: "session", version: 3, id: "scalarsess", timestamp: "2026-01-01T00:00:00.000Z", cwd: repo }),
		"null", "12345", '"a string"', "[1,2]", "true",
		JSON.stringify({ type: "message", id: "s1", parentId: null, timestamp: "2026-01-01T00:00:01.000Z", message: { role: "user", content: "survivor" } }),
	].join("\n") + "\n");
	// fourth: message content that is neither a string nor an array of parts. `{}.find`
	// is not a function, and the bounded scan has no per-line try/catch to swallow it —
	// one such entry used to 500 /api/sessions for EVERY session on the machine.
	const BADCONTENT = path.join(SESS, "2026-01-01T00-00-02-000Z_badcontent.jsonl");
	fs.writeFileSync(BADCONTENT, [
		JSON.stringify({ type: "session", version: 3, id: "badcontent", timestamp: "2026-01-01T00:00:00.000Z", cwd: repo }),
		JSON.stringify({ type: "message", id: "b1", parentId: null, timestamp: "2026-01-01T00:00:01.000Z", message: { role: "user", content: {} } }),
		JSON.stringify({ type: "message", id: "b2", parentId: "b1", timestamp: "2026-01-01T00:00:02.000Z", message: { role: "user", content: [{ type: "text", text: 42 }] } }),
		JSON.stringify({ type: "message", id: "b3", parentId: "b2", timestamp: "2026-01-01T00:00:03.000Z", message: { role: "user", content: [{ type: "text", text: "the real first line" }] } }),
	].join("\n") + "\n");
	// fifth: a header with no id. pi keys resume and rename on it, so listing this
	// session offers the user a row nothing can open.
	const NOID = path.join(SESS, "2026-01-01T00-00-03-000Z_noid.jsonl");
	fs.writeFileSync(NOID, [
		JSON.stringify({ type: "session", version: 3, timestamp: "2026-01-01T00:00:00.000Z", cwd: repo }),
		JSON.stringify({ type: "message", id: "n1", parentId: null, timestamp: "2026-01-01T00:00:01.000Z", message: { role: "user", content: "headerless-ish" } }),
	].join("\n") + "\n");

	// DESK_PORT=0 → the OS picks, the server reports what it bound. No
	// reserve-then-close window for another process to win the port in.
	server = spawn("node", [SERVER], { env: { ...process.env, HOME: TD, DESK_PORT: "0" }, stdio: ["ignore", "pipe", "pipe"] });
	let stderr = "";
	let stdout = "";
	server.stderr.on("data", (d) => { stderr += d; });
	server.stdout.on("data", (d) => { stdout += d; });
	let BASE = "";
	for (let i = 0; i < 120; i++) {
		const m = /http:\/\/127\.0\.0\.1:(\d+)/.exec(stdout);
		if (m) { BASE = `http://127.0.0.1:${m[1]}`; break; }
		if (server.exitCode !== null) throw new Error(`desk server exited ${server.exitCode}. stderr:\n${stderr}`);
		await new Promise((r) => setTimeout(r, 250));
	}
	if (!BASE) throw new Error(`desk server never reported a port. stdout:\n${stdout}\nstderr:\n${stderr}`);
	check("the server reports the port it actually bound (DESK_PORT=0)", /^http:\/\/127\.0\.0\.1:[1-9]\d{3,4}$/.test(BASE), BASE);
	check("…and the startup line names the pi install it parses with", /parsing sessions with .*pi-coding-agent .*resolved via /.test(stdout), stdout.split("\n")[0]);
	// (that the Host/Origin rules still bite on a port-0 desk is host-rule.test.mjs's
	// job — it owns the rebind evidence and speaks raw sockets, which fetch cannot:
	// `host` is a forbidden fetch header.)
	const foreignOrigin = await fetch(`${BASE}/api/rename`, { method: "POST", headers: { origin: "http://evil.example", "content-type": "application/json" }, body: "{}" });
	check("…and the Origin rule still bites on a port-0 desk", foreignOrigin.status === 403, String(foreignOrigin.status));
	for (let i = 0; i < 60; i++) {
		try { await fetch(`${BASE}/api/live`); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 59) throw new Error(`desk server never answered. stderr:\n${stderr}`);
	}
	const j = async (u) => (await fetch(BASE + u)).json();
	const transcript = (f) => j(`/api/transcript?file=${encodeURIComponent(f)}`);

	// ── 2. parity with the old parser on a pi-written session ──
	// compare by basename: the desk builds its paths from $HOME as given, the test's
	// tmpdir realpaths through /private on macOS
	const sessionRows = async () => (await j("/api/sessions")).flatMap((g) => g.sessions);
	const rowFor = (rows, f) => rows.find((r) => path.basename(r.file) === path.basename(f));
	const rows = await sessionRows();
	const row = rowFor(rows, FILE);
	const oldMeta = oldReadSessionMeta(FILE);
	check("the pi-written session appears in /api/sessions", !!row, JSON.stringify(rows.map((r) => path.basename(r.file))));
	check("title identical to the old parser's", row?.title === oldMeta.title, `${row?.title} vs ${oldMeta.title}`);
	check("…and it is the first user message, whitespace-collapsed", row?.title === "parity fixture first message", String(row?.title));
	check("name identical to the old parser's", row?.name === oldMeta.name, `${row?.name} vs ${oldMeta.name}`);
	check("…and it is what pi itself reports", row?.name === mgr.getSessionName(), `${row?.name} vs ${mgr.getSessionName()}`);
	check("session id identical to the old parser's", row?.id === oldMeta.id && row?.id === mgr.getSessionId(), `${row?.id} vs ${oldMeta.id}`);

	const t = await transcript(FILE);
	const old = oldParseTranscript(FILE);
	check("transcript name/cwd/sessionId identical to the old parser's",
		t.name === old.name && t.cwd === old.cwd && t.sessionId === old.sessionId, JSON.stringify({ name: t.name, cwd: t.cwd }));
	check("entry count identical to the old parser's", t.total === old.total, `${t.total} vs ${old.total}`);
	check("active branch LENGTH identical to the old parser's", branchOf(t).length === branchOf(old).length, `${branchOf(t).length} vs ${branchOf(old).length}`);
	check("…same ids, same order", JSON.stringify(branchOf(t)) === JSON.stringify(branchOf(old)), branchOf(t).join(","));
	check("leaf id identical to the old parser's", leafOf(t) === leafOf(old), `${leafOf(t)} vs ${leafOf(old)}`);

	// ── 3. pi is the judge: the branch the desk shows is the branch pi resumes ──
	const piBranch = mgr.getBranch().filter((e) => e.type !== "session_info").map((e) => e.id);
	check("active branch equals SessionManager.getBranch()", JSON.stringify(branchOf(t)) === JSON.stringify(piBranch), `${branchOf(t).join(",")} vs ${piBranch.join(",")}`);
	// branching from the FIRST user message abandons the two entries that followed it
	check("…the abandoned entries are present but off-branch",
		t.total === 5 && t.entries.filter((e) => !e.onBranch).length === 2, `${t.total} entries, ${t.entries.filter((e) => !e.onBranch).length} off-branch`);
	check("…and pi's own leaf is the last session_info, whose parent is our leaf",
		mgr.getEntry(mgr.getLeafId())?.type === "session_info" && mgr.getEntry(mgr.getLeafId())?.parentId === leafOf(t), String(mgr.getLeafId()));
	check("reported session version is pi's current one", t.version === pi.CURRENT_SESSION_VERSION && t.parserVersion === pi.CURRENT_SESSION_VERSION, `${t.version}/${t.parserVersion}`);

	// ── 4b. a message appended AFTER the rename still chains (the old walk broke here) ──
	const afterRename = mgr.appendMessage({ role: "user", content: [{ type: "text", text: "after the rename" }] });
	const t2 = await transcript(FILE);
	const old2 = oldParseTranscript(FILE);
	check("post-rename message is on the branch", branchOf(t2).at(-1) === afterRename, JSON.stringify(branchOf(t2)));
	check("…and so is everything before it (chain walks THROUGH session_info)",
		JSON.stringify(branchOf(t2)) === JSON.stringify([...piBranch, afterRename]), branchOf(t2).join(","));
	check("…which the old parser got wrong: it saw a one-entry branch",
		branchOf(old2).length === 1 && branchOf(old2)[0] === afterRename, branchOf(old2).join(","));

	// ── 4a. a v1 session is now readable, and the file is NOT rewritten ──
	const v1 = await transcript(V1);
	const oldV1 = oldParseTranscript(V1);
	check("v1 session: old parser rendered nothing", oldV1.total === 0, String(oldV1.total));
	check("v1 session: pi's migration makes both entries readable", v1.total === 2, String(v1.total));
	check("…with ids and a parent chain the old file never had", v1.entries.every((e) => !!e.id) && v1.entries[1].parentId === v1.entries[0].id);
	check("…the legacy hookMessage role is migrated to custom", v1.entries[1].message?.role === "custom", String(v1.entries[1].message?.role));
	check("…the reported version is the ON-DISK one, not the migrated one", v1.version === 1, String(v1.version));
	check("…and the file on disk is byte-identical (a read never rewrites)", fs.readFileSync(V1).equals(v1Before));
	const v1Row = rowFor(await sessionRows(), V1);
	check("v1 session still lists with its inferred title", v1Row?.title === "legacy v1 session", String(v1Row?.title));
	// pi mints ids with randomUUID during v1 migration, so an unchanged file used to
	// come back with different ids on every refresh — the client's keys, the branch
	// walk and anything the user copied all moved under them.
	const v1again = await transcript(V1);
	check("…and a second read of the unchanged file returns the SAME ids",
		JSON.stringify(v1again.entries.map((e) => [e.id, e.parentId])) === JSON.stringify(v1.entries.map((e) => [e.id, e.parentId])),
		JSON.stringify(v1again.entries.map((e) => e.id)));
	check("…ids derived from position, so they survive a desk restart too",
		v1.entries.map((e) => e.id).join(",") === "v1-000000,v1-000001", v1.entries.map((e) => e.id).join(","));

	// ── corruption the swap could have regressed ──
	const sc = await transcript(SCALAR);
	check("a session line that is valid JSON but not an object does not 500 the read",
		sc.total === 1 && sc.entries[0].id === "s1", JSON.stringify(sc).slice(0, 120));
	check("…and the same file still lists (one stray line ≠ every session gone)",
		!!rowFor(await sessionRows(), SCALAR), JSON.stringify((await sessionRows()).map((r) => path.basename(r.file))));
	check("…with its title read past the junk", rowFor(await sessionRows(), SCALAR)?.title === "survivor", String(rowFor(await sessionRows(), SCALAR)?.title));
	const bad = await transcript(BADCONTENT);
	check("a message whose content is an object does not 500 the read", bad.total === 3, JSON.stringify(bad).slice(0, 120));
	const badRow = rowFor(await sessionRows(), BADCONTENT);
	check("…and the same file still lists", !!badRow, JSON.stringify(badRow));
	check("…with the title taken from the first user message that HAS text", badRow?.title === "the real first line", String(badRow?.title));
	check("a header with no id is not listed (pi keys resume/rename on it)", !rowFor(await sessionRows(), NOID), JSON.stringify(rowFor(await sessionRows(), NOID)));

	// a file that is not a pi session at all is refused, the way pi refuses it
	const NOT = path.join(SESS, "2026-01-01T00-00-02-000Z_not.jsonl");
	fs.writeFileSync(NOT, `${JSON.stringify({ type: "message", id: "x", parentId: null, message: { role: "user", content: "no header" } })}\n`);
	const notRow = rowFor(await sessionRows(), NOT);
	check("a headerless file is not listed as a session", !notRow, JSON.stringify(notRow));
} catch (e) {
	console.log("FAIL harness", e?.stack || e);
	fails++;
} finally {
	if (server) server.kill("SIGTERM");
	fs.rmSync(TD, { recursive: true, force: true });
}
console.log(fails ? `${fails} FAILED` : "all PASS");
process.exit(fails ? 1 : 0);
