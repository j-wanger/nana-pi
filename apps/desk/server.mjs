/**
 * the pi desk — local server. Zero dependencies, binds 127.0.0.1 only.
 *
 * Surfaces:
 *   GET  /api/sessions              historical sessions from ~/.pi/agent/sessions
 *   GET  /api/transcript?file=      parsed read-only transcript (path must resolve inside sessions dir)
 *   POST /api/pick-dir              open the NATIVE OS folder picker (Finder/Explorer/zenity); → {id}
 *   GET  /api/pick-dir?id=          poll it → {pending:true} | {path} | {cancelled:true} | {error}
 *                                   (start-then-poll so no request is held open while a dialog sits;
 *                                   held XHRs exhaust the browser's per-host connection pool)
 *   GET  /api/resources?cwd=        skills + extensions pi would discover for that cwd (for spawn toggles)
 *   POST /api/rename                {file, name} → append a session_info entry (non-live sessions;
 *                                   same shape pi's set_session_name persists — last one wins on read)
 *   POST /api/derive-titles         {files:[…]} → enqueue headless title derivation for unnamed
 *                                   sessions (server-side serial queue; names persist as session_info
 *                                   entries and surface via the normal sessions refresh)
 *   GET  /api/settings              pi settings.json + mcp.json + nana-pack.json + agents dir (with paths)
 *   POST /api/settings              {patch} → shallow-merge WHITELISTED keys into ~/.pi/agent/settings.json
 *   POST /api/mcp                   {mcpServers} → rewrite that key of ~/.pi/agent/mcp.json
 *   POST /api/nana-pack             {config} → rewrite ~/.pi/agent/nana-pack.json
 *   GET/POST /api/context-file      read/write AGENTS.md | CLAUDE.md | AGENTS.override.md in a directory
 *   GET/POST/DELETE /api/agents     pi-subagents definitions under ~/.pi/agent/agents/
 *                                   (every config write backs up the previous file to <file>.bak)
 *   GET  /api/live                  currently running RPC children
 *   POST /api/spawn                 {cwd, session?, name?, approve?, resources?} → spawn `pi --mode rpc`;
 *                                   resources {skills:[paths], extensions:[paths]} narrows via
 *                                   --no-skills/--skill + --no-extensions/-e; omit for pi defaults
 *   GET  /api/session/:id/events    SSE: desk_hello state snapshot, then live RPC events
 *   POST /api/session/:id/prompt    {message, mode: prompt|steer|follow_up, images?}
 *   POST /api/session/:id/rpc      {command} → allowlisted RPC passthrough with correlated response
 *   POST /api/session/:id/ui-response  {id, value?|confirmed?|cancelled?} → answer an extension dialog
 *   POST /api/session/:id/bash      {command} → {id}; output streams as bash_execution_update events
 *   GET  /api/session/:id/files     file list of the child cwd (for @-completion)
 *   POST /api/session/:id/export    export session to HTML, returns the document
 *   POST /api/session/:id/abort
 *   DELETE /api/session/:id         kill child
 *
 * Live transcript architecture: the server does NOT replay event buffers. A client
 * attaching to /events gets a `desk_hello` (open dialogs, statuses, widgets, queue),
 * renders history from `get_messages` via /rpc, then applies live events. `message_end`
 * and `agent_settled` re-sync make that race-free enough for a local tool.
 */

import { exec, execFile, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import * as fs from "node:fs";
import * as http from "node:http";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// 7317, NOT 4317: 4317 is the OTLP default and network filters (Tailscale,
// telemetry collectors) can silently eat loopback traffic to it — observed
// live 2026-09-03 (listener healthy, every client stuck in SYN_SENT).
const PORT = Number(process.env.DESK_PORT || 7317);
const SESSIONS_DIR = path.join(os.homedir(), ".pi", "agent", "sessions");
const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
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

function spawnChild({ cwd, session, name, approve, resources, appendSystemPrompt }) {
	if ([...children.values()].filter((c) => c.state === "running").length >= MAX_CHILDREN)
		throw new Error(`max ${MAX_CHILDREN} live sessions`);
	const args = ["--mode", "rpc"];
	if (session) args.push("--session", session);
	if (name) args.push("--name", String(name));
	if (approve) args.push("-a");
	if (appendSystemPrompt) {
		// via a temp FILE (the flag accepts file contents): multiline-safe on every
		// platform and nothing user-written touches a shell line
		const f = path.join(os.tmpdir(), `pi-desk-syspr-${Date.now()}-${randomBytes(3).toString("hex")}.txt`);
		fs.writeFileSync(f, String(appendSystemPrompt).slice(0, 16000));
		args.push("--append-system-prompt", f);
	}
	// Narrowed resources: turn discovery off and load the chosen set explicitly
	// (--skill/-e stay additive under --no-skills/--no-extensions). No `resources`
	// means pure pi defaults — the desk adds no flags at all.
	if (resources) {
		args.push("--no-skills");
		for (const p of resources.skills || []) {
			if (!fs.existsSync(p)) throw new Error(`no such skill: ${p}`);
			args.push("--skill", p);
		}
		args.push("--no-extensions");
		for (const p of resources.extensions || []) {
			if (!fs.existsSync(p)) throw new Error(`no such extension: ${p}`);
			args.push("-e", p);
		}
	}
	// win32: npm installs pi as a .cmd shim, which spawn() can only run through a
	// shell — and shell mode does no arg quoting. Passing values via env vars and
	// referencing `"%VAR%"` on the line makes cmd itself substitute them: one
	// non-recursive expansion, so spaces, `&`, and literal `%` in values are all
	// inert. (Plain manual quoting can't do that — cmd expands %…% inside quotes.)
	let proc;
	if (process.platform === "win32") {
		const env = { ...process.env };
		const line = ["pi", ...args.map((a, i) => {
			// `"` would close the quote after expansion (illegal in paths, dropped);
			// a trailing `\` would escape the closing quote at argv parsing (a path
			// means the same without it). Empty values can't ride env on Windows.
			const v = a.replaceAll('"', "").replace(/\\+$/, "");
			if (!v) return '""';
			env[`NANA_PI_ARG_${i}`] = v;
			return `"%NANA_PI_ARG_${i}%"`;
		})].join(" ");
		proc = spawn(line, { cwd, env, stdio: ["pipe", "pipe", "pipe"], shell: true, windowsHide: true });
	} else {
		proc = spawn("pi", args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
	}
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

function killChild(child) {
	// win32 shell-mode spawn: proc is the cmd.exe wrapper — kill the whole tree
	// or pi itself is orphaned.
	if (process.platform === "win32") execFile("taskkill", ["/pid", String(child.proc.pid), "/t", "/f"], () => {});
	else child.proc.kill();
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
				// empty string = cleared name → fall back to the inferred title
				if (e.type === "session_info" && typeof e.name === "string") name = e.name || null;
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
			if (typeof e.name === "string") name = e.name || null;
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

// ── resource discovery (the skills/extensions a spawn can toggle) ──
// Mirrors pi's documented locations (docs/skills.md, docs/extensions.md,
// docs/settings.md, docs/packages.md). Best-effort: plain paths only (glob and
// !/+/- entries in settings arrays are skipped), silent-skip on anything odd.
// The default spawn path never depends on this — with no narrowing the desk
// passes no flags and pi discovers on its own.
const expandHome = (p) => String(p || "").replace(/^~(?=[\\/]|$)/, () => os.homedir());

function isDirectory(p) {
	try {
		return fs.statSync(p).isDirectory();
	} catch {
		return false;
	}
}
const PI_DIR = path.join(os.homedir(), ".pi", "agent");

function readJsonFile(p) {
	try {
		return JSON.parse(fs.readFileSync(p, "utf-8"));
	} catch {
		return undefined;
	}
}

function parseSkillMeta(file) {
	let head;
	try {
		head = fs.readFileSync(file, "utf-8").slice(0, 4000);
	} catch {
		return null;
	}
	const m = head.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!m) return null;
	return {
		name: m[1].match(/^name:\s*(.+)$/m)?.[1]?.trim(),
		description: m[1].match(/^description:\s*(.+)$/m)?.[1]?.trim(),
	};
}

// Dirs containing SKILL.md are skills (recursive, all locations). Loose .md
// files follow the location's documented rule — mode "pi" (~/.pi/agent/skills,
// .pi/skills): root .md only; mode "agents" (.agents/skills): nested .md in
// grouping folders only; mode "plain" (packages): SKILL.md dirs only.
function addSkills(dir, origin, out, mode, depth = 0) {
	if (depth > 3) return;
	const skillMd = path.join(dir, "SKILL.md");
	if (fs.existsSync(skillMd)) {
		const meta = parseSkillMeta(skillMd) || {};
		out.push({ name: meta.name || path.basename(dir), path: dir, origin, description: meta.description || "" });
		return;
	}
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	const looseMd = mode === "pi" ? depth === 0 : mode === "agents" ? depth >= 1 : false;
	for (const e of entries) {
		if (e.isDirectory() && !e.name.startsWith(".")) addSkills(path.join(dir, e.name), origin, out, mode, depth + 1);
		else if (looseMd && e.isFile() && e.name.endsWith(".md")) {
			const meta = parseSkillMeta(path.join(dir, e.name));
			if (meta?.description)
				out.push({ name: meta.name || e.name.replace(/\.md$/, ""), path: path.join(dir, e.name), origin, description: meta.description });
		}
	}
}

function addSkillPath(p, origin, out) {
	let st;
	try {
		st = fs.statSync(p);
	} catch {
		return;
	}
	if (st.isDirectory()) addSkills(p, origin, out, "pi");
	else if (p.endsWith(".md")) {
		const meta = parseSkillMeta(p);
		if (meta?.description) out.push({ name: meta.name || path.basename(p, ".md"), path: p, origin, description: meta.description });
	}
}

function addExtensions(dir, origin, out) {
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const e of entries) {
		const full = path.join(dir, e.name);
		if (e.isFile() && e.name.endsWith(".ts")) out.push({ name: e.name.replace(/\.ts$/, ""), path: full, origin });
		else if (e.isDirectory() && fs.existsSync(path.join(full, "index.ts")))
			out.push({ name: e.name, path: path.join(full, "index.ts"), origin });
	}
}

function addExtPath(p, origin, out) {
	let st;
	try {
		st = fs.statSync(p);
	} catch {
		return;
	}
	if (st.isDirectory()) addExtensions(p, origin, out);
	else if (p.endsWith(".ts")) out.push({ name: path.basename(p, ".ts"), path: p, origin });
}

// settings `packages` entry → the package's clone/install dir, or null.
// Sources: local path · npm name incl. `npm:` prefix and version suffix
// (~/.pi/agent/npm, .pi/npm) · git (~/.pi/agent/git/<host>/<path>, .pi/git/…)
function resolvePackageDir(source, baseDir, cwd) {
	const s = String(source);
	if (/^(git:|https?:\/\/|ssh:\/\/|git@)/.test(s)) {
		const rest = s
			.replace(/^git:/, "").replace(/^(https?|ssh):\/\//, "").replace(/^git@/, "")
			.replace(":", "/").replace(/@[^/@]*$/, "").replace(/\.git$/, "");
		const segs = rest.split("/").filter(Boolean);
		for (const root of [path.join(PI_DIR, "git"), path.join(cwd, ".pi", "git")]) {
			const p = path.join(root, ...segs);
			if (fs.existsSync(p)) return p;
		}
		return null;
	}
	if (/^[.~]|^[/\\]|^[A-Za-z]:/.test(s)) {
		const p = path.resolve(baseDir, expandHome(s));
		return fs.existsSync(p) ? p : null;
	}
	let name = s.startsWith("npm:") ? s.slice(4) : s;
	const at = name.lastIndexOf("@");
	if (at > 0) name = name.slice(0, at); // version suffix; `@scope/pkg` alone keeps its leading @
	for (const root of [path.join(PI_DIR, "npm"), path.join(cwd, ".pi", "npm")]) {
		const p = path.join(root, "node_modules", ...name.split("/"));
		if (fs.existsSync(p)) return p;
	}
	return null;
}

function addPackage(source, baseDir, cwd, out) {
	const entry = typeof source === "string" ? { source } : source && typeof source === "object" ? source : null;
	if (!entry?.source) return;
	const dir = resolvePackageDir(entry.source, baseDir, cwd);
	if (!dir) return;
	const pkg = readJsonFile(path.join(dir, "package.json")) || {};
	const origin = `pkg:${pkg.name || path.basename(dir)}`;
	const skills = [];
	const exts = [];
	for (const r of pkg.pi?.skills || ["skills"]) addSkills(path.join(dir, r), origin, skills, "plain");
	for (const r of pkg.pi?.extensions || ["extensions"]) addExtensions(path.join(dir, r), origin, exts);
	// object form filters by resource name; absent = all, [] = none
	out.skills.push(...(Array.isArray(entry.skills) ? skills.filter((x) => entry.skills.includes(x.name)) : skills));
	out.extensions.push(...(Array.isArray(entry.extensions) ? exts.filter((x) => entry.extensions.includes(x.name)) : exts));
}

// ── config files (settings/mcp/nana-pack/context/agents) ──
const SETTINGS_PATH = path.join(os.homedir(), ".pi", "agent", "settings.json");
const MCP_PATH = path.join(os.homedir(), ".pi", "agent", "mcp.json");
const NANA_PACK_PATH = path.join(os.homedir(), ".pi", "agent", "nana-pack.json");
const AGENTS_DIR = path.join(os.homedir(), ".pi", "agent", "agents");
// Only keys the desk UI actually exposes — never a whole-file replace, so a
// stale client can't clobber packages/auth-adjacent settings.
const SETTINGS_PATCH_KEYS = new Set(["defaultProvider", "defaultModel", "defaultThinkingLevel", "compaction", "skills", "extensions"]);
const CONTEXT_NAMES = new Set(["AGENTS.md", "CLAUDE.md", "AGENTS.override.md"]);

function backupWrite(file, content) {
	try {
		if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.bak`);
	} catch {}
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, content);
}

function listAgents() {
	const out = [];
	const walk = (dir, depth = 0) => {
		if (depth > 3) return;
		let entries;
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			const full = path.join(dir, e.name);
			if (e.isDirectory()) walk(full, depth + 1);
			else if (e.name.endsWith(".md")) {
				let content = "";
				try {
					content = fs.readFileSync(full, "utf-8");
				} catch {}
				out.push({ path: full, name: path.basename(e.name, ".md"), content });
			}
		}
	};
	walk(AGENTS_DIR);
	return out;
}

// ── title derivation (headless pi, once per session — the name persists) ──
// Server-side queue: the client submits a batch and returns immediately; names
// land in the session files and surface through normal rail refresh. (A client
// that held one request per derivation kept a browser connection busy for
// minutes — the same pool-exhaustion class as the held picker request.)
const titleQueue = [];
const titleQueued = new Set();
let titleWorkerRunning = false;

function enqueueTitles(files) {
	let queued = 0;
	for (const f of files.slice(0, 50)) {
		let real;
		try {
			real = assertInsideSessions(String(f));
		} catch {
			continue;
		}
		if (titleQueued.has(real)) continue;
		const meta = readSessionMeta(real);
		if (!meta || meta.name || !meta.title) continue;
		titleQueued.add(real);
		titleQueue.push(real);
		queued++;
	}
	if (queued && !titleWorkerRunning) {
		titleWorkerRunning = true;
		(async () => {
			try {
				while (titleQueue.length) {
					const real = titleQueue.shift();
					try {
						if (!readSessionMeta(real)?.name) await deriveTitle(real);
					} catch {
						// best-effort; a page reload may retry
					} finally {
						titleQueued.delete(real);
					}
				}
			} finally {
				titleWorkerRunning = false;
			}
		})();
	}
	return queued;
}

function firstUserText(file) {
	const head = readChunk(file, 0, 262144);
	for (const line of head.split("\n").slice(1)) {
		if (!line.includes('"role":"user"')) continue;
		try {
			const e = JSON.parse(line);
			if (e.type === "message" && e.message?.role === "user") {
				const c = e.message.content;
				const text = typeof c === "string" ? c : (c || []).filter((b) => b.type === "text").map((b) => b.text).join(" ");
				if (text?.trim()) return text;
			}
		} catch {}
	}
	return null;
}

// Cross-platform headless pi run (win32: .cmd shim needs a shell; args ride env
// vars so session-derived text can't corrupt or inject — values are single-line).
function runPi(args, cwd, timeoutMs) {
	return new Promise((resolve) => {
		const cb = (err, stdout) => resolve({ code: err ? 1 : 0, out: String(stdout || "") });
		let child;
		if (process.platform === "win32") {
			const env = { ...process.env };
			const line = ["pi", ...args.map((a, i) => {
				const v = a.replaceAll('"', "").replace(/\\+$/, "");
				if (!v) return '""';
				env[`NANA_PI_HARG_${i}`] = v;
				return `"%NANA_PI_HARG_${i}%"`;
			})].join(" ");
			child = exec(line, { cwd, env, timeout: timeoutMs, windowsHide: true, maxBuffer: 1024 * 1024 }, cb);
		} else child = execFile("pi", args, { cwd, timeout: timeoutMs, maxBuffer: 1024 * 1024 }, cb);
		child.stdin?.end(); // pi -p waits for EOF on a piped stdin — without this it hangs to timeout
	});
}

async function deriveTitle(real) {
	const text = firstUserText(real);
	if (!text) throw new Error("no user message to derive from");
	const excerpt = text.replace(/\s+/g, " ").trim().slice(0, 2000);
	// isolation per the headless lesson: no extensions/skills/context files, tmp cwd
	const r = await runPi(
		["-p", "--no-session", "--no-extensions", "--no-skills", "--no-prompt-templates", "--no-context-files",
			`Write a concise 3-7 word title for the coding session that starts with this request. Output ONLY the title text, no quotes. Request: ${excerpt}`],
		os.tmpdir(), 90000,
	);
	const name = r.out.trim().split("\n").filter(Boolean).pop()?.replace(/^["'\s]+|["'\s.]+$/g, "").slice(0, 60);
	if (!name) throw new Error("derivation produced no title");
	const entry = {
		type: "session_info", id: randomBytes(4).toString("hex"), parentId: null,
		timestamp: new Date().toISOString(), name,
	};
	fs.appendFileSync(real, `${JSON.stringify(entry)}\n`);
	return name;
}

// ── native folder picker ──
// The desk binds 127.0.0.1 only, so the browser and this server share a display:
// the server can open the real OS dialog and hand the absolute path back —
// something a web page can never get from its own file pickers. The scripts are
// FIXED STRINGS (no request data is interpolated); the dialog itself is the UI.
// Start-then-poll, never a held request: a dialog can sit open for minutes, and
// a long-held XHR eats one of the browser's ~6 per-host connections — enough of
// those and every desk fetch queues behind them (the "desk feels frozen" bug).
let picker = null; // {id, status: "pending"|"done", result}

function startPicker() {
	if (picker?.status === "pending") return { error: "picker already open" };
	const id = randomBytes(4).toString("hex");
	picker = { id, status: "pending", result: null };
	pickDirectory().then((result) => {
		if (picker?.id === id) picker = { id, status: "done", result };
	});
	return { id };
}

function pollPicker(id) {
	if (!picker || picker.id !== id) return { error: "no such pick" };
	if (picker.status === "pending") return { pending: true };
	const r = picker.result;
	picker = null; // delivered — frees the single-flight guard
	return r;
}

function pickDirectory() {
	const run = (cmd, args) =>
		new Promise((resolve) => {
			execFile(cmd, args, { timeout: 10 * 60 * 1000, windowsHide: false }, (err, stdout) => {
				const out = String(stdout || "").trim();
				if (out) return resolve({ path: out });
				if (err?.code === "ENOENT") return resolve({ error: `no native picker (${cmd} not found) — type a path instead` });
				resolve({ cancelled: true }); // cancel = nonzero exit / empty output, shape varies per OS
			});
		});
	if (process.platform === "darwin")
		// choose folder inside a Finder tell block so the dialog comes to the front
		return run("osascript", [
			"-e", 'tell application "Finder"',
			"-e", "activate",
			"-e", 'set f to choose folder with prompt "Open a pi session in…"',
			"-e", "end tell",
			"-e", "POSIX path of f",
		]);
	if (process.platform === "win32")
		return run("powershell.exe", [
			"-NoProfile", "-STA", "-Command",
			"Add-Type -AssemblyName System.Windows.Forms; " +
				"$owner = New-Object System.Windows.Forms.Form; $owner.TopMost = $true; " +
				"$f = New-Object System.Windows.Forms.FolderBrowserDialog; " +
				"$f.Description = 'Open a pi session in...'; $f.ShowNewFolderButton = $false; " +
				"if ($f.ShowDialog($owner) -eq 'OK') { [Console]::Out.Write($f.SelectedPath) }",
		]);
	return run("zenity", ["--file-selection", "--directory", "--title=Open a pi session in…"]);
}

function listResources(cwd) {
	const out = { skills: [], extensions: [] };
	// project-scoped waves land in here first and get project:true — the client
	// gates them behind the trust toggle (pi won't load them untrusted either)
	const proj = { skills: [], extensions: [] };
	addSkills(path.join(PI_DIR, "skills"), "global", out.skills, "pi");
	addSkills(path.join(os.homedir(), ".agents", "skills"), "global", out.skills, "agents");
	addSkills(path.join(cwd, ".pi", "skills"), "project", proj.skills, "pi");
	// .agents/skills in cwd and ancestors up to the git repo root (docs/skills.md)
	for (let d = cwd; ; ) {
		addSkills(path.join(d, ".agents", "skills"), "project", proj.skills, "agents");
		const up = path.dirname(d);
		if (fs.existsSync(path.join(d, ".git")) || up === d) break;
		d = up;
	}
	addExtensions(path.join(PI_DIR, "extensions"), "global", out.extensions);
	addExtensions(path.join(cwd, ".pi", "extensions"), "project", proj.extensions);
	const gSet = readJsonFile(path.join(PI_DIR, "settings.json")) || {};
	const pSet = readJsonFile(path.join(cwd, ".pi", "settings.json")) || {};
	const plain = (arr) => (Array.isArray(arr) ? arr.filter((x) => typeof x === "string" && !/[*!]/.test(x) && !/^[+-]/.test(x)) : []);
	for (const p of plain(gSet.skills)) addSkillPath(path.resolve(PI_DIR, expandHome(p)), "settings", out.skills);
	for (const p of plain(pSet.skills)) addSkillPath(path.resolve(path.join(cwd, ".pi"), expandHome(p)), "settings", proj.skills);
	for (const p of plain(gSet.extensions)) addExtPath(path.resolve(PI_DIR, expandHome(p)), "settings", out.extensions);
	for (const p of plain(pSet.extensions)) addExtPath(path.resolve(path.join(cwd, ".pi"), expandHome(p)), "settings", proj.extensions);
	for (const src of Array.isArray(gSet.packages) ? gSet.packages : []) addPackage(src, PI_DIR, cwd, out);
	for (const src of Array.isArray(pSet.packages) ? pSet.packages : []) addPackage(src, path.join(cwd, ".pi"), cwd, proj);
	for (const key of ["skills", "extensions"]) out[key].push(...proj[key].map((x) => ({ ...x, project: true })));
	const seen = new Set();
	for (const key of ["skills", "extensions"])
		out[key] = out[key].filter((x) => {
			const k = `${key}:${x.path}`;
			if (seen.has(k)) return false;
			seen.add(k);
			return true;
		});
	return out;
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
			const cwd = expandHome(body.cwd || os.homedir());
			if (!isDirectory(cwd)) return json(res, 400, { error: `no such directory: ${cwd}` });
			let session = body.session;
			if (session) session = assertInsideSessions(session);
			const id = spawnChild({
				cwd, session, name: body.name, approve: body.approve,
				appendSystemPrompt: body.appendSystemPrompt,
				resources: body.resources && {
					skills: (body.resources.skills || []).map(String),
					extensions: (body.resources.extensions || []).map(String),
				},
			});
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
			killChild(child);
			children.delete(dm[1]);
			return json(res, 200, { ok: true });
		}
		if (p === "/api/pick-dir" && req.method === "POST") {
			const r = startPicker();
			return json(res, r.error ? 409 : 200, r);
		}
		if (p === "/api/pick-dir" && req.method === "GET") {
			return json(res, 200, pollPicker(String(url.searchParams.get("id") || "")));
		}
		if (p === "/api/resources" && req.method === "GET") {
			const cwd = path.resolve(expandHome(url.searchParams.get("cwd") || os.homedir()));
			if (!isDirectory(cwd)) return json(res, 400, { error: `no such directory: ${cwd}` });
			return json(res, 200, { cwd, ...listResources(cwd) });
		}
		if (p === "/api/derive-titles" && req.method === "POST") {
			const body = await readBody(req);
			return json(res, 200, { queued: enqueueTitles(Array.isArray(body.files) ? body.files : []) });
		}
		if (p === "/api/settings" && req.method === "GET") {
			return json(res, 200, {
				settingsPath: SETTINGS_PATH, settings: readJsonFile(SETTINGS_PATH) || {},
				mcpPath: MCP_PATH, mcp: readJsonFile(MCP_PATH) || { mcpServers: {} },
				nanaPath: NANA_PACK_PATH, nana: readJsonFile(NANA_PACK_PATH) || {},
				agentsDir: AGENTS_DIR, home: os.homedir(), piDir: PI_DIR,
			});
		}
		if (p === "/api/settings" && req.method === "POST") {
			const body = await readBody(req);
			const cur = readJsonFile(SETTINGS_PATH) || {};
			for (const [k, v] of Object.entries(body.patch || {})) {
				if (!SETTINGS_PATCH_KEYS.has(k)) return json(res, 400, { error: `key not editable here: ${k}` });
				if (v === null) delete cur[k];
				else if (k === "compaction") cur.compaction = { ...cur.compaction, ...v };
				else cur[k] = v;
			}
			backupWrite(SETTINGS_PATH, `${JSON.stringify(cur, null, 2)}\n`);
			return json(res, 200, { ok: true, settings: cur });
		}
		if (p === "/api/mcp" && req.method === "POST") {
			const body = await readBody(req);
			if (!body.mcpServers || typeof body.mcpServers !== "object" || Array.isArray(body.mcpServers))
				return json(res, 400, { error: "mcpServers must be an object" });
			const cur = readJsonFile(MCP_PATH) || {};
			cur.mcpServers = body.mcpServers; // other adapter keys (rendering, guards…) preserved
			backupWrite(MCP_PATH, `${JSON.stringify(cur, null, 2)}\n`);
			return json(res, 200, { ok: true, mcp: cur });
		}
		if (p === "/api/nana-pack" && req.method === "POST") {
			const body = await readBody(req);
			if (!body.config || typeof body.config !== "object" || Array.isArray(body.config))
				return json(res, 400, { error: "config must be an object" });
			backupWrite(NANA_PACK_PATH, `${JSON.stringify(body.config, null, 2)}\n`);
			return json(res, 200, { ok: true });
		}
		if (p === "/api/context-file" && req.method === "GET") {
			const dir = path.resolve(expandHome(url.searchParams.get("dir") || ""));
			const name = url.searchParams.get("name") || "";
			if (!CONTEXT_NAMES.has(name)) return json(res, 400, { error: `name must be one of: ${[...CONTEXT_NAMES].join(", ")}` });
			if (!isDirectory(dir)) return json(res, 400, { error: `no such directory: ${dir}` });
			const file = path.join(dir, name);
			let content = null;
			try {
				content = fs.readFileSync(file, "utf-8");
			} catch {}
			return json(res, 200, { file, exists: content !== null, content: content ?? "" });
		}
		if (p === "/api/context-file" && req.method === "POST") {
			const body = await readBody(req);
			const dir = path.resolve(expandHome(String(body.dir || "")));
			const name = String(body.name || "");
			if (!CONTEXT_NAMES.has(name)) return json(res, 400, { error: `name must be one of: ${[...CONTEXT_NAMES].join(", ")}` });
			if (!isDirectory(dir)) return json(res, 400, { error: `no such directory: ${dir}` });
			backupWrite(path.join(dir, name), String(body.content ?? ""));
			return json(res, 200, { ok: true });
		}
		if (p === "/api/agents" && req.method === "GET") {
			return json(res, 200, { dir: AGENTS_DIR, agents: listAgents() });
		}
		if (p === "/api/agents" && req.method === "POST") {
			const body = await readBody(req);
			const name = String(body.name || "");
			if (!/^[\w.-]{1,64}$/.test(name)) return json(res, 400, { error: "agent name: letters/digits/._- only" });
			backupWrite(path.join(AGENTS_DIR, `${name}.md`), String(body.content ?? ""));
			return json(res, 200, { ok: true, path: path.join(AGENTS_DIR, `${name}.md`) });
		}
		if (p === "/api/agents" && req.method === "DELETE") {
			const target = String(url.searchParams.get("path") || "");
			let real;
			try {
				real = fs.realpathSync(target);
			} catch {
				return json(res, 400, { error: "no such agent file" });
			}
			if (!real.startsWith(fs.realpathSync(AGENTS_DIR) + path.sep)) return json(res, 400, { error: "outside agents dir" });
			if (!real.endsWith(".md")) return json(res, 400, { error: "only agent .md files can be deleted here" });
			// recoverable delete: rename to .bak (pi-subagents only discovers *.md)
			fs.renameSync(real, `${real}.bak`);
			return json(res, 200, { ok: true });
		}
		if (p === "/api/rename" && req.method === "POST") {
			const body = await readBody(req);
			const real = assertInsideSessions(String(body.file || ""));
			// Same entry shape pi's own set_session_name persists (verified against
			// real sessions); readers take the LAST session_info, so append wins.
			// Renaming a file a live pi also holds is last-writer-wins on a display
			// name — benign; the desk UI routes live sessions through RPC instead.
			const entry = {
				type: "session_info", id: randomBytes(4).toString("hex"), parentId: null,
				timestamp: new Date().toISOString(), name: String(body.name ?? "").trim(),
			};
			fs.appendFileSync(real, `${JSON.stringify(entry)}\n`);
			return json(res, 200, { ok: true });
		}
		json(res, 404, { error: "not found" });
	} catch (e) {
		json(res, 500, { error: String(e.message || e) });
	}
});

for (const sig of ["SIGINT", "SIGTERM"]) {
	process.on(sig, () => {
		for (const [, c] of children) killChild(c);
		process.exit(0);
	});
}

server.listen(PORT, "127.0.0.1", () => {
	console.log(`the pi desk → http://127.0.0.1:${PORT}`);
});
