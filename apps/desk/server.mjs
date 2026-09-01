/**
 * the pi desk — local pilot server. Zero dependencies, binds 127.0.0.1 only.
 *
 * Surfaces:
 *   GET  /api/sessions              historical sessions from ~/.pi/agent/sessions
 *   GET  /api/transcript?file=      parsed read-only transcript (path must resolve inside sessions dir)
 *   GET  /api/live                  currently running RPC children
 *   POST /api/spawn                 {cwd, session?} → spawn `pi --mode rpc`
 *   GET  /api/session/:id/events    SSE: replayed buffer + live RPC events
 *   POST /api/session/:id/prompt    {message, mode: prompt|steer|follow_up}
 *   POST /api/session/:id/abort
 *   DELETE /api/session/:id         kill child
 *   GET  /api/wire                  SSE: tail of the nana-pack lifecycle journal
 */

import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";

const PORT = Number(process.env.DESK_PORT || 4317);
const SESSIONS_DIR = path.join(os.homedir(), ".pi", "agent", "sessions");
const JOURNAL = path.join(os.homedir(), ".pi", "agent", "nana-journal.jsonl");
const PUBLIC = path.join(path.dirname(new URL(import.meta.url).pathname), "public");
const MAX_CHILDREN = 4;
const BUFFER_CAP = 4000;

// ── RPC children ──
const children = new Map(); // id → {proc, cwd, buffer, clients, state, startedAt, stderrTail}
let nextId = 1;

function broadcast(child, obj) {
	const line = `data: ${JSON.stringify(obj)}\n\n`;
	for (const res of child.clients) res.write(line);
}

function spawnChild(cwd, sessionFile) {
	if (children.size >= MAX_CHILDREN) throw new Error(`max ${MAX_CHILDREN} live sessions`);
	const args = ["--mode", "rpc"];
	if (sessionFile) args.push("--session", sessionFile);
	const proc = spawn("pi", args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
	const id = String(nextId++);
	const child = { proc, cwd, buffer: [], clients: new Set(), state: "running", startedAt: Date.now(), stderrTail: "" };
	children.set(id, child);

	// Strict-JSONL framing: split on \n ONLY (upstream docs: readline is
	// non-compliant — it also splits on U+2028/U+2029, valid inside JSON strings).
	let pending = "";
	proc.stdout.on("data", (chunk) => {
		pending += chunk.toString("utf-8");
		let nl;
		while ((nl = pending.indexOf("\n")) >= 0) {
			const line = pending.slice(0, nl).replace(/\r$/, "");
			pending = pending.slice(nl + 1);
			if (!line) continue;
			let obj;
			try {
				obj = JSON.parse(line);
			} catch {
				continue;
			}
			child.buffer.push(obj);
			if (child.buffer.length > BUFFER_CAP) child.buffer.splice(0, child.buffer.length - BUFFER_CAP);
			broadcast(child, obj);
		}
	});
	proc.stderr.on("data", (c) => {
		child.stderrTail = (child.stderrTail + c.toString()).slice(-2000);
	});
	proc.on("exit", (code) => {
		child.state = "exited";
		const note = { type: "desk_exit", code, stderrTail: child.stderrTail.slice(-500) };
		child.buffer.push(note);
		broadcast(child, note);
	});
	return id;
}

function sendToChild(id, obj) {
	const child = children.get(id);
	if (!child || child.state !== "running") return false;
	try {
		child.proc.stdin.write(`${JSON.stringify(obj)}\n`);
		return true;
	} catch {
		return false;
	}
}

// ── session listing / transcript parsing ──
async function listSessions() {
	const groups = [];
	let dirs = [];
	try {
		dirs = fs.readdirSync(SESSIONS_DIR);
	} catch {
		return groups;
	}
	for (const d of dirs) {
		const dirPath = path.join(SESSIONS_DIR, d);
		let files;
		try {
			files = fs
				.readdirSync(dirPath)
				.filter((f) => f.endsWith(".jsonl"))
				.map((f) => {
					const full = path.join(dirPath, f);
					return { full, mtime: fs.statSync(full).mtimeMs };
				})
				.sort((a, b) => b.mtime - a.mtime)
				.slice(0, 15);
		} catch {
			continue;
		}
		if (files.length === 0) continue;
		const sessions = [];
		let cwd = null;
		for (const f of files) {
			const meta = readSessionMeta(f.full);
			if (!meta) continue;
			cwd = cwd ?? meta.cwd;
			sessions.push({ file: f.full, mtime: f.mtime, title: meta.title, id: meta.id });
		}
		if (sessions.length) groups.push({ cwd: cwd ?? d, sessions, latest: sessions[0].mtime });
	}
	return groups.sort((a, b) => b.latest - a.latest);
}

function readSessionMeta(file) {
	// Header is line 1; title = first user message. Cap the read — sessions can be huge.
	let head;
	try {
		const fd = fs.openSync(file, "r");
		const buf = Buffer.alloc(65536);
		const n = fs.readSync(fd, buf, 0, buf.length, 0);
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
	for (const line of lines.slice(1)) {
		try {
			const e = JSON.parse(line);
			if (e.type === "message" && e.message?.role === "user") {
				const t = (e.message.content || []).find((c) => c.type === "text");
				title = (t?.text || "").slice(0, 120).replace(/\s+/g, " ").trim();
				break;
			}
		} catch {
			break; // truncated tail of the capped read
		}
	}
	return { cwd: header.cwd, id: header.id, title };
}

function parseTranscript(file) {
	const entries = [];
	const raw = fs.readFileSync(file, "utf-8").split("\n");
	for (const line of raw) {
		if (!line) continue;
		let e;
		try {
			e = JSON.parse(line);
		} catch {
			continue;
		}
		if (e.type !== "message") continue;
		const m = e.message || {};
		const texts = (m.content || []).filter((c) => c.type === "text").map((c) => c.text);
		const tools = (m.content || [])
			.filter((c) => c.type === "toolCall")
			.map((c) => ({ name: c.name, args: JSON.stringify(c.arguments ?? c.input ?? {}).slice(0, 200) }));
		if (m.role === "user") entries.push({ role: "user", text: texts.join("\n") });
		else if (m.role === "assistant") entries.push({ role: "assistant", text: texts.join("\n"), tools });
		else if (m.role === "toolResult")
			entries.push({ role: "tool", text: texts.join("\n").slice(0, 800), isError: !!m.isError });
	}
	return entries.slice(-500);
}

// ── the wire (journal tail via fs.watch — no polling loops, cleans up on close) ──
function wireStream(res) {
	let offset = 0;
	const sendFrom = () => {
		let stat;
		try {
			stat = fs.statSync(JOURNAL);
		} catch {
			return;
		}
		if (stat.size < offset) offset = 0; // rotated/truncated
		if (stat.size === offset) return;
		const fd = fs.openSync(JOURNAL, "r");
		const buf = Buffer.alloc(stat.size - offset);
		fs.readSync(fd, buf, 0, buf.length, offset);
		fs.closeSync(fd);
		offset = stat.size;
		for (const line of buf.toString("utf-8").split("\n")) {
			if (line.trim()) res.write(`data: ${line}\n\n`);
		}
	};
	// replay tail: last 4KB worth of complete lines
	try {
		const size = fs.statSync(JOURNAL).size;
		offset = Math.max(0, size - 4096);
		if (offset > 0) {
			// skip the first (likely partial) line of the tail window
			const fd = fs.openSync(JOURNAL, "r");
			const buf = Buffer.alloc(512);
			const n = fs.readSync(fd, buf, 0, 512, offset);
			fs.closeSync(fd);
			const idx = buf.toString("utf-8", 0, n).indexOf("\n");
			if (idx >= 0) offset += idx + 1;
		}
		sendFrom();
	} catch {
		/* journal may not exist yet */
	}
	let watcher = null;
	const tryWatch = () => {
		try {
			watcher = fs.watch(JOURNAL, sendFrom);
			watcher.on("error", () => {});
		} catch {
			watcher = null;
		}
	};
	tryWatch();
	const rewatch = setInterval(() => {
		if (!watcher) tryWatch();
	}, 10000);
	res.on("close", () => {
		clearInterval(rewatch);
		watcher?.close();
	});
}

// ── http plumbing ──
function json(res, code, obj) {
	res.writeHead(code, { "content-type": "application/json" });
	res.end(JSON.stringify(obj));
}

function sseHead(res) {
	res.writeHead(200, {
		"content-type": "text/event-stream",
		"cache-control": "no-cache",
		connection: "keep-alive",
	});
	res.write(": ok\n\n");
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		let data = "";
		req.on("data", (c) => {
			data += c;
			if (data.length > 1e6) reject(new Error("body too large"));
		});
		req.on("end", () => {
			try {
				resolve(data ? JSON.parse(data) : {});
			} catch (e) {
				reject(e);
			}
		});
	});
}

const STATIC = {
	"/": ["index.html", "text/html"],
	"/app.js": ["app.js", "text/javascript"],
	"/styles.css": ["styles.css", "text/css"],
};

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, "http://localhost");
	const p = url.pathname;
	try {
		if (STATIC[p] && req.method === "GET") {
			const [file, type] = STATIC[p];
			res.writeHead(200, { "content-type": type });
			return res.end(fs.readFileSync(path.join(PUBLIC, file)));
		}
		if (p === "/api/sessions" && req.method === "GET") return json(res, 200, await listSessions());
		if (p === "/api/transcript" && req.method === "GET") {
			const file = url.searchParams.get("file") || "";
			const real = fs.realpathSync(file);
			const root = fs.realpathSync(SESSIONS_DIR);
			if (!real.startsWith(root + path.sep)) return json(res, 403, { error: "outside sessions dir" });
			return json(res, 200, parseTranscript(real));
		}
		if (p === "/api/live" && req.method === "GET") {
			return json(
				res,
				200,
				[...children.entries()].map(([id, c]) => ({
					id,
					cwd: c.cwd,
					state: c.state,
					startedAt: c.startedAt,
				})),
			);
		}
		if (p === "/api/spawn" && req.method === "POST") {
			const body = await readBody(req);
			const cwd = (body.cwd || os.homedir()).replace(/^~(?=\/|$)/, os.homedir());
			if (!fs.existsSync(cwd)) return json(res, 400, { error: `no such directory: ${cwd}` });
			const id = spawnChild(cwd, body.session);
			return json(res, 200, { id });
		}
		const m = p.match(/^\/api\/session\/(\w+)\/(events|prompt|abort)$/);
		if (m) {
			const [, id, action] = m;
			const child = children.get(id);
			if (!child) return json(res, 404, { error: "no such live session" });
			if (action === "events" && req.method === "GET") {
				sseHead(res);
				for (const obj of child.buffer) res.write(`data: ${JSON.stringify(obj)}\n\n`);
				child.clients.add(res);
				res.on("close", () => child.clients.delete(res));
				return;
			}
			if (action === "prompt" && req.method === "POST") {
				const body = await readBody(req);
				const mode = ["prompt", "steer", "follow_up"].includes(body.mode) ? body.mode : "prompt";
				const ok = sendToChild(id, { type: mode, message: String(body.message || "") });
				return json(res, ok ? 200 : 409, { ok });
			}
			if (action === "abort" && req.method === "POST") {
				return json(res, 200, { ok: sendToChild(id, { type: "abort" }) });
			}
		}
		const dm = p.match(/^\/api\/session\/(\w+)$/);
		if (dm && req.method === "DELETE") {
			const child = children.get(dm[1]);
			if (!child) return json(res, 404, { error: "no such live session" });
			child.proc.kill();
			children.delete(dm[1]);
			return json(res, 200, { ok: true });
		}
		if (p === "/api/wire" && req.method === "GET") {
			sseHead(res);
			return wireStream(res);
		}
		json(res, 404, { error: "not found" });
	} catch (e) {
		json(res, 500, { error: String(e.message || e) });
	}
});

for (const sig of ["SIGINT", "SIGTERM"]) {
	process.on(sig, () => {
		for (const [, c] of children) c.proc.kill();
		process.exit(0);
	});
}

server.listen(PORT, "127.0.0.1", () => {
	console.log(`the pi desk → http://127.0.0.1:${PORT}`);
});
