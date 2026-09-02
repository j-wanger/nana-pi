/**
 * the pi desk — local server. Zero dependencies, binds 127.0.0.1 only.
 *
 * Surfaces:
 *   GET  /api/sessions              historical sessions from ~/.pi/agent/sessions
 *   GET  /api/transcript?file=      parsed read-only transcript (path must resolve inside sessions dir)
 *   GET  /api/live                  currently running RPC children
 *   POST /api/spawn                 {cwd, session?, name?, extensions?} → spawn `pi --mode rpc`
 *   GET  /api/session/:id/events    SSE: desk_hello state snapshot, then live RPC events
 *   POST /api/session/:id/prompt    {message, mode: prompt|steer|follow_up, images?}
 *   POST /api/session/:id/rpc      {command} → allowlisted RPC passthrough with correlated response
 *   POST /api/session/:id/ui-response  {id, value?|confirmed?|cancelled?} → answer an extension dialog
 *   POST /api/session/:id/bash      {command} → {id}; output streams as bash_execution_update events
 *   GET  /api/session/:id/files     file list of the child cwd (for @-completion)
 *   POST /api/session/:id/export    export session to HTML, returns the document
 *   POST /api/session/:id/abort
 *   DELETE /api/session/:id         kill child
 *   GET  /api/wire                  SSE: tail of the nana-pack lifecycle journal
 *
 * Live transcript architecture: the server does NOT replay event buffers. A client
 * attaching to /events gets a `desk_hello` (open dialogs, statuses, widgets, queue),
 * renders history from `get_messages` via /rpc, then applies live events. `message_end`
 * and `agent_settled` re-sync make that race-free enough for a local tool.
 */

import { execFile, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";

const PORT = Number(process.env.DESK_PORT || 4317);
const SESSIONS_DIR = path.join(os.homedir(), ".pi", "agent", "sessions");
const JOURNAL = path.join(os.homedir(), ".pi", "agent", "nana-journal.jsonl");
const PUBLIC = path.join(path.dirname(new URL(import.meta.url).pathname), "public");
const MAX_CHILDREN = 4;
const DIALOG_METHODS = new Set(["select", "confirm", "input", "editor"]);

// RPC commands a client may send through /rpc. prompt/steer/follow_up/abort/bash and
// extension_ui_response have dedicated endpoints so desk bookkeeping stays consistent.
const RPC_ALLOWED = new Set([
	"get_state", "get_messages", "get_session_stats", "get_commands",
	"get_available_models", "set_model", "cycle_model",
	"get_available_thinking_levels", "set_thinking_level", "cycle_thinking_level",
	"set_steering_mode", "set_follow_up_mode", "clear_queue",
	"compact", "set_auto_compaction", "set_auto_retry", "abort_retry", "abort_bash",
	"new_session", "switch_session", "fork", "clone", "get_fork_messages",
	"get_entries", "get_tree", "get_last_assistant_text", "set_session_name",
]);
const RPC_TIMEOUTS = {
	compact: 600000, new_session: 60000, switch_session: 60000, fork: 60000, clone: 60000,
	// a prompt response can be held for minutes by an extension command that blocks on a dialog
	prompt: 600000, steer: 600000, follow_up: 600000,
};

// ── RPC children ──
const children = new Map(); // id → child record
let nextId = 1;

function broadcast(child, obj) {
	const line = `data: ${JSON.stringify(obj)}\n\n`;
	for (const res of child.clients) res.write(line);
}

function spawnChild({ cwd, session, name, extensions }) {
	if ([...children.values()].filter((c) => c.state === "running").length >= MAX_CHILDREN)
		throw new Error(`max ${MAX_CHILDREN} live sessions`);
	const args = ["--mode", "rpc"];
	if (session) args.push("--session", session);
	if (name) args.push("--name", String(name));
	for (const ext of extensions || []) {
		if (!fs.existsSync(ext)) throw new Error(`no such extension: ${ext}`);
		args.push("-e", ext);
	}
	const proc = spawn("pi", args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
	const id = String(nextId++);
	const child = {
		proc, cwd, clients: new Set(), state: "running", startedAt: Date.now(), stderrTail: "",
		pending: new Map(), // rpcId → {resolve, reject, timer}
		dialogs: new Map(), // uiId → extension_ui_request (unanswered dialog methods)
		statuses: new Map(), widgets: new Map(), title: null,
		queue: { steering: [], followUp: [] },
		nextRpc: 1, files: null, filesAt: 0, exitNote: null,
	};
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
			handleChildEvent(child, obj);
		}
	});
	proc.stderr.on("data", (c) => {
		child.stderrTail = (child.stderrTail + c.toString()).slice(-2000);
	});
	proc.on("exit", (code) => {
		child.state = "exited";
		for (const [, p] of child.pending) {
			clearTimeout(p.timer);
			p.reject(new Error("session process exited"));
		}
		child.pending.clear();
		child.dialogs.clear();
		child.exitNote = { type: "desk_exit", code, stderrTail: child.stderrTail.slice(-500) };
		broadcast(child, child.exitNote);
	});
	proc.on("error", (err) => {
		child.state = "exited";
		child.exitNote = { type: "desk_exit", code: null, stderrTail: String(err) };
		broadcast(child, child.exitNote);
	});
	return id;
}

function handleChildEvent(child, obj) {
	if (obj.type === "response" && child.pending.has(obj.id)) {
		const p = child.pending.get(obj.id);
		child.pending.delete(obj.id);
		clearTimeout(p.timer);
		p.resolve(obj);
		return; // correlated responses are not transcript events
	}
	if (obj.type === "extension_ui_request") {
		if (DIALOG_METHODS.has(obj.method)) child.dialogs.set(obj.id, obj);
		else if (obj.method === "setStatus") {
			if (obj.statusText === undefined || obj.statusText === null) child.statuses.delete(obj.statusKey);
			else child.statuses.set(obj.statusKey, obj.statusText);
		} else if (obj.method === "setWidget") {
			if (!obj.widgetLines) child.widgets.delete(obj.widgetKey);
			else child.widgets.set(obj.widgetKey, { lines: obj.widgetLines, placement: obj.widgetPlacement || "aboveEditor" });
		} else if (obj.method === "setTitle") child.title = obj.title;
	} else if (obj.type === "queue_update") {
		child.queue = { steering: obj.steering || [], followUp: obj.followUp || [] };
	}
	broadcast(child, obj);
}

function sendRpc(child, command) {
	if (child.state !== "running") return Promise.reject(new Error("session not running"));
	const id = `desk-${child.nextRpc++}`;
	const timeoutMs = RPC_TIMEOUTS[command.type] ?? 30000;
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			child.pending.delete(id);
			reject(new Error(`rpc timeout: ${command.type}`));
		}, timeoutMs);
		child.pending.set(id, { resolve, reject, timer });
		try {
			child.proc.stdin.write(`${JSON.stringify({ ...command, id })}\n`);
		} catch (e) {
			child.pending.delete(id);
			clearTimeout(timer);
			reject(e);
		}
	});
}

function writeToChild(child, obj) {
	if (child.state !== "running") return false;
	try {
		child.proc.stdin.write(`${JSON.stringify(obj)}\n`);
		return true;
	} catch {
		return false;
	}
}

function sanitizeImages(images) {
	if (!Array.isArray(images)) return undefined;
	const out = images
		.filter((i) => i && typeof i.data === "string" && typeof i.mimeType === "string")
		.slice(0, 8)
		.map((i) => ({ type: "image", data: i.data, mimeType: i.mimeType }));
	return out.length ? out : undefined;
}

// ── file listing for @-completion ──
function listFiles(child) {
	const now = Date.now();
	if (child.files && now - child.filesAt < 30000) return Promise.resolve(child.files);
	return new Promise((resolve) => {
		execFile(
			"git", ["ls-files", "--cached", "--others", "--exclude-standard"],
			{ cwd: child.cwd, maxBuffer: 8 * 1024 * 1024 },
			(err, stdout) => {
				let files;
				if (!err) files = stdout.split("\n").filter(Boolean);
				else files = walkFiles(child.cwd);
				files = files.slice(0, 8000);
				child.files = files;
				child.filesAt = now;
				resolve(files);
			},
		);
	});
}

function walkFiles(root) {
	const out = [];
	const skip = new Set([".git", "node_modules", ".venv", "dist", "build", "__pycache__"]);
	const stack = [""];
	while (stack.length && out.length < 8000) {
		const rel = stack.pop();
		let entries;
		try {
			entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true });
		} catch {
			continue;
		}
		for (const e of entries) {
			if (e.name.startsWith(".") && e.name !== ".pi") continue;
			if (skip.has(e.name)) continue;
			const r = rel ? `${rel}/${e.name}` : e.name;
			if (e.isDirectory()) stack.push(r);
			else out.push(r);
		}
	}
	return out;
}

// ── session listing / transcript parsing ──
function readChunk(file, start, len) {
	const fd = fs.openSync(file, "r");
	try {
		const buf = Buffer.alloc(len);
		const n = fs.readSync(fd, buf, 0, len, start);
		return buf.toString("utf-8", 0, n);
	} finally {
		fs.closeSync(fd);
	}
}

function readSessionMeta(file) {
	// Header is line 1; title = first user message; name = last session_info entry.
	let head, size;
	try {
		size = fs.statSync(file).size;
		head = readChunk(file, 0, 65536);
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
				if (e.type === "session_info" && e.name) name = e.name;
			} catch {}
		}
	};
	for (const line of lines.slice(1)) scanLine(line);
	if (size > 65536) {
		// names are usually set late in the file; scan the tail too
		const tail = readChunk(file, Math.max(0, size - 32768), 32768);
		for (const line of tail.split("\n")) scanLine(line);
	}
	return { cwd: header.cwd, id: header.id, title, name };
}

function listSessions() {
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
			sessions.push({ file: f.full, mtime: f.mtime, title: meta.title, name: meta.name, id: meta.id });
		}
		if (sessions.length) groups.push({ cwd: cwd ?? d, sessions, latest: sessions[0].mtime });
	}
	return groups.sort((a, b) => b.latest - a.latest);
}

const ENTRY_CAP = 2000;

function parseTranscript(file) {
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
		if (e.type === "session") {
			header = e;
			continue;
		}
		if (e.type === "session_info") {
			if (e.name) name = e.name;
			continue;
		}
		if (!e.id) continue;
		entries.push(e);
	}
	// Active branch = parentId chain from the last entry (the file is append-only,
	// so the last entry is the current tip).
	const byId = new Map(entries.map((e) => [e.id, e]));
	const onBranch = new Set();
	let cur = entries.length ? entries[entries.length - 1] : null;
	while (cur) {
		onBranch.add(cur.id);
		cur = cur.parentId ? byId.get(cur.parentId) : null;
	}
	const out = entries.slice(-ENTRY_CAP).map((e) => ({ ...e, onBranch: onBranch.has(e.id) }));
	return { cwd: header?.cwd, sessionId: header?.id, name, total: entries.length, entries: out };
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
			const head = readChunk(JOURNAL, offset, 512);
			const idx = head.indexOf("\n");
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
		const chunks = [];
		let size = 0;
		req.on("data", (c) => {
			size += c.length;
			if (size > 32 * 1024 * 1024) {
				reject(new Error("body too large"));
				req.destroy();
				return;
			}
			chunks.push(c);
		});
		req.on("end", () => {
			try {
				const data = Buffer.concat(chunks).toString("utf-8");
				resolve(data ? JSON.parse(data) : {});
			} catch (e) {
				reject(e);
			}
		});
		req.on("error", reject);
	});
}

function assertInsideSessions(file) {
	const real = fs.realpathSync(file);
	const root = fs.realpathSync(SESSIONS_DIR);
	if (!real.startsWith(root + path.sep)) throw new Error("outside sessions dir");
	return real;
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png" };

function serveStatic(res, p) {
	const rel = p === "/" ? "index.html" : p.slice(1);
	const full = path.normalize(path.join(PUBLIC, rel));
	if (!full.startsWith(PUBLIC + path.sep) && full !== path.join(PUBLIC, "index.html")) return false;
	let data;
	try {
		data = fs.readFileSync(full);
	} catch {
		return false;
	}
	res.writeHead(200, { "content-type": MIME[path.extname(full)] || "application/octet-stream" });
	res.end(data);
	return true;
}

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url, "http://localhost");
	const p = url.pathname;
	try {
		if (req.method === "GET" && !p.startsWith("/api/") && serveStatic(res, p)) return;
		if (p === "/api/sessions" && req.method === "GET") return json(res, 200, listSessions());
		if (p === "/api/transcript" && req.method === "GET") {
			const real = assertInsideSessions(url.searchParams.get("file") || "");
			return json(res, 200, parseTranscript(real));
		}
		if (p === "/api/live" && req.method === "GET") {
			return json(
				res, 200,
				[...children.entries()].map(([id, c]) => ({
					id, cwd: c.cwd, state: c.state, startedAt: c.startedAt,
					openDialogs: c.dialogs.size, queued: c.queue.steering.length + c.queue.followUp.length,
				})),
			);
		}
		if (p === "/api/spawn" && req.method === "POST") {
			const body = await readBody(req);
			const cwd = (body.cwd || os.homedir()).replace(/^~(?=\/|$)/, os.homedir());
			if (!fs.existsSync(cwd)) return json(res, 400, { error: `no such directory: ${cwd}` });
			let session = body.session;
			if (session) session = assertInsideSessions(session);
			const id = spawnChild({ cwd, session, name: body.name, extensions: body.extensions });
			return json(res, 200, { id });
		}
		const m = p.match(/^\/api\/session\/(\w+)\/(events|prompt|rpc|ui-response|bash|files|export|abort)$/);
		if (m) {
			const [, id, action] = m;
			const child = children.get(id);
			if (!child) return json(res, 404, { error: "no such live session" });
			if (action === "events" && req.method === "GET") {
				sseHead(res);
				const hello = {
					type: "desk_hello", id, cwd: child.cwd, state: child.state, startedAt: child.startedAt,
					dialogs: [...child.dialogs.values()],
					statuses: Object.fromEntries(child.statuses),
					widgets: Object.fromEntries(child.widgets),
					title: child.title, queue: child.queue,
				};
				res.write(`data: ${JSON.stringify(hello)}\n\n`);
				if (child.exitNote) res.write(`data: ${JSON.stringify(child.exitNote)}\n\n`);
				child.clients.add(res);
				res.on("close", () => child.clients.delete(res));
				return;
			}
			if (action === "prompt" && req.method === "POST") {
				const body = await readBody(req);
				const mode = ["prompt", "steer", "follow_up"].includes(body.mode) ? body.mode : "prompt";
				const cmd = { type: mode, message: String(body.message || "") };
				const images = sanitizeImages(body.images);
				if (images) cmd.images = images;
				if (mode === "prompt" && body.streamingBehavior) cmd.streamingBehavior = body.streamingBehavior;
				// Acceptance usually answers instantly, but an extension command can hold the
				// response for minutes while it blocks on a dialog. Wait briefly, then detach:
				// a late rejection is surfaced to clients as a desk_prompt_rejected event.
				const p = sendRpc(child, cmd);
				const winner = await Promise.race([
					p.then((r) => ({ r })).catch((e) => ({ r: { success: false, error: String(e.message || e) } })),
					new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
				]);
				if (winner) return json(res, winner.r.success ? 200 : 409, { ok: winner.r.success, error: winner.r.error });
				p.then((r) => {
					if (!r.success) broadcast(child, { type: "desk_prompt_rejected", error: r.error });
				}).catch(() => {});
				return json(res, 200, { ok: true, pending: true });
			}
			if (action === "rpc" && req.method === "POST") {
				const body = await readBody(req);
				const cmd = body.command;
				if (!cmd || !RPC_ALLOWED.has(cmd.type)) return json(res, 400, { error: `rpc type not allowed: ${cmd?.type}` });
				if (cmd.type === "switch_session") cmd.sessionPath = assertInsideSessions(cmd.sessionPath || "");
				delete cmd.id;
				const r = await sendRpc(child, cmd);
				return json(res, 200, r);
			}
			if (action === "ui-response" && req.method === "POST") {
				const body = await readBody(req);
				const uiId = String(body.id || "");
				if (!child.dialogs.has(uiId)) return json(res, 409, { error: "dialog not open" });
				const reply = { type: "extension_ui_response", id: uiId };
				if (body.cancelled) reply.cancelled = true;
				else if (typeof body.confirmed === "boolean") reply.confirmed = body.confirmed;
				else reply.value = body.value;
				const ok = writeToChild(child, reply);
				if (ok) {
					child.dialogs.delete(uiId);
					broadcast(child, { type: "desk_ui_resolved", id: uiId });
				}
				return json(res, ok ? 200 : 409, { ok });
			}
			if (action === "bash" && req.method === "POST") {
				const body = await readBody(req);
				const command = String(body.command || "");
				if (!command) return json(res, 400, { error: "empty command" });
				const rpcId = `desk-${child.nextRpc++}`;
				const timer = setTimeout(() => {
					if (child.pending.delete(rpcId))
						broadcast(child, { type: "desk_bash_result", id: rpcId, success: false, error: "bash timeout" });
				}, 600000);
				child.pending.set(rpcId, {
					resolve: (r) => {
						clearTimeout(timer);
						broadcast(child, { type: "desk_bash_result", id: rpcId, success: r.success, error: r.error, data: r.data });
					},
					reject: (e) => {
						clearTimeout(timer);
						broadcast(child, { type: "desk_bash_result", id: rpcId, success: false, error: String(e.message || e) });
					},
					timer,
				});
				const ok = writeToChild(child, { type: "bash", command, id: rpcId });
				if (!ok) {
					clearTimeout(timer);
					child.pending.delete(rpcId);
					return json(res, 409, { error: "session not running" });
				}
				return json(res, 200, { id: rpcId });
			}
			if (action === "files" && req.method === "GET") {
				return json(res, 200, { files: await listFiles(child) });
			}
			if (action === "export" && req.method === "POST") {
				const out = path.join(os.tmpdir(), `pi-desk-export-${id}-${Date.now()}.html`);
				const r = await sendRpc(child, { type: "export_html", outputPath: out });
				if (!r.success) return json(res, 500, { error: r.error || "export failed" });
				let html;
				try {
					html = fs.readFileSync(r.data?.path || out);
				} finally {
					fs.rmSync(r.data?.path || out, { force: true });
				}
				res.writeHead(200, {
					"content-type": "text/html",
					"content-disposition": `attachment; filename="pi-session-${id}.html"`,
				});
				return res.end(html);
			}
			if (action === "abort" && req.method === "POST") {
				const r = await sendRpc(child, { type: "abort" });
				return json(res, 200, { ok: r.success });
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
