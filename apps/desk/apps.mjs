// apps.mjs — one listener PER APP for the UI-centric frontend
// (docs/agent-frontend-design-2026-09-04.md §3.4).
//
// Every app manifest in ~/.pi/agent/apps/<name>.json gets its own
// 127.0.0.1:<port> — its own browser origin, distinct from the desk (7317) and
// from every other app. A listener serves that app's stage host and exactly
// these routes; nothing else exists on it (no spawn, live, session/:id, bash,
// rpc passthrough, delete, settings):
//
//   POST /api/session            spawn this app's session from its manifest, or return the live one
//   GET  /api/session            the live child, or null
//   GET  /api/events             SSE: desk_hello, then live events
//   POST /api/prompt             {message, mode?}
//   POST /api/ui-response        {id, value?|confirmed?|cancelled?}
//   POST /api/abort
//   GET  /api/entries?since=     get_entries passthrough (the one RPC a stage page needs)
//   GET  /api/manifest           {name, title, cwd, mutating, tools} — read-only
//
// Routes carry no app name and no child id: the listener IS the app and holds
// exactly one child reference. Everything about the spawn (cwd, tools → -t,
// extensions, skills, project trust → -a/-na, last session file) comes from the
// manifest; the client body is ignored. `session` is written back atomically
// after spawn from get_state.sessionFile so a restart reattaches the right file.
//
// The desk server owns the children; this module borrows its primitives via
// `deps` (no circular import, no second child map).

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { verifyBlock } from "../../packages/nana-stage/lib/sign.mjs";

// The provenance tooth (server side). A block reaches a page only if it carries
// a valid signature under this child's key AND, on the live path, was stamped by
// the very tool event carrying it. Used on tool_execution_end (server.mjs) and
// on the ledger read (/api/entries below).
export function verifiedBlocks(key, blocks, event) {
	if (!Array.isArray(blocks)) return [];
	return blocks.filter((b) => b && typeof b === "object" && verifyBlock(key, b)
		&& (!event || (b.produced_by.toolCallId === event.toolCallId && b.produced_by.tool === event.toolName)));
}
const ENTRY_TYPE = "nana-block";
function verifiedEntries(key, entries) {
	return entries.filter((e) => !(e && e.type === "custom" && e.customType === ENTRY_TYPE) || verifyBlock(key, e.data));
}

const isStr = (v) => typeof v === "string" && v.length > 0;
const strList = (v) => (Array.isArray(v) ? v.filter(isStr) : []);

export function loadManifests(dir) {
	const out = new Map();
	if (!fs.existsSync(dir)) return out;
	for (const f of fs.readdirSync(dir)) {
		if (!f.endsWith(".json")) continue;
		const name = f.slice(0, -5);
		const file = path.join(dir, f);
		let raw;
		try {
			raw = JSON.parse(fs.readFileSync(file, "utf-8"));
		} catch (e) {
			console.error(`apps: ${f}: ${e.message}`);
			continue;
		}
		const m = normalizeManifest(name, file, raw);
		if (m.error) console.error(`apps: ${f}: ${m.error}`);
		else out.set(name, m);
	}
	return out;
}

export function normalizeManifest(name, file, raw) {
	if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) return { error: "name must be [a-z0-9-]" };
	const port = Number(raw.port);
	if (!Number.isInteger(port) || port < 1024 || port > 65535) return { error: "port: integer 1024-65535" };
	const cwd = isStr(raw.cwd) ? raw.cwd.replace(/^~(?=$|\/)/, process.env.HOME || "") : "";
	if (!cwd || !fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) return { error: `cwd: no such directory ${raw.cwd}` };
	const extensions = strList(raw.extensions);
	for (const p of extensions) if (!fs.existsSync(p)) return { error: `extensions: no such file ${p}` };
	const skills = strList(raw.skills);
	for (const p of skills) if (!fs.existsSync(p)) return { error: `skills: no such path ${p}` };
	const trust = raw.trust === "approve" ? "approve" : "no-approve";
	const tools = strList(raw.tools);
	// An EMPTY allowlist would mean "pi defaults" (bash, edit, write...). Refuse
	// rather than silently widen: an app session names every tool it gets.
	if (!tools.length) return { error: "tools: a non-empty allowlist is required (an empty list would enable pi's default tools)" };
	return {
		name, file, port, cwd, extensions, skills, trust,
		tools,
		mutating: strList(raw.mutating),
		title: isStr(raw.title) ? raw.title : name,
		session: isStr(raw.session) ? raw.session : null,
		raw,
	};
}

// Atomic write-back of one field (temp file + rename) — the manifest is the
// server's own record of the app's last session file.
export function writeManifestSession(m, sessionFile) {
	m.session = sessionFile;
	const next = { ...m.raw, session: sessionFile };
	const tmp = `${m.file}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, JSON.stringify(next, null, "\t") + "\n");
	fs.renameSync(tmp, m.file);
}

// Explicit static map — no directory traversal, no listing.
function staticMap(dirs) {
	return {
		"/": path.join(dirs.stage, "index.html"),
		"/index.html": path.join(dirs.stage, "index.html"),
		"/stage.js": path.join(dirs.stage, "stage.js"),
		"/stage.css": path.join(dirs.stage, "stage.css"),
		"/desk-client.mjs": path.join(dirs.public, "desk-client.mjs"),
		"/styles.css": path.join(dirs.public, "styles.css"),
		"/md.js": path.join(dirs.public, "md.js"),
		"/blocks.mjs": dirs.blocks,
	};
}
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css" };

export function startAppListeners({ manifests, deps, dirs }) {
	const servers = [];
	for (const m of manifests.values()) {
		const app = { manifest: m, childId: null, spawning: null };
		const server = http.createServer((req, res) => handle(app, req, res, deps, staticMap(dirs)));
		server.listen(m.port, "127.0.0.1", () => console.log(`app ${m.name} → http://127.0.0.1:${m.port}`));
		server.on("error", (e) => console.error(`app ${m.name}: ${e.message}`));
		servers.push({ app, server });
	}
	return servers;
}

function liveChild(app, deps) {
	if (!app.childId) return null;
	const c = deps.children.get(app.childId);
	if (!c || c.state !== "running") return null;
	return c;
}

function childInfo(id, c) {
	return { id, cwd: c.cwd, state: c.state, startedAt: c.startedAt, title: c.title, openDialogs: c.dialogs.size };
}

async function spawnForApp(app, deps) {
	const m = app.manifest;
	const id = deps.spawnChild({
		cwd: m.cwd,
		session: m.session && fs.existsSync(m.session) ? m.session : undefined,
		name: m.session ? undefined : m.title,
		tools: m.tools,
		trust: m.trust,
		resources: { skills: m.skills, extensions: m.extensions },
		app: m.name,
	});
	app.childId = id;
	const child = deps.children.get(id);
	try {
		const r = await deps.sendRpc(child, { type: "get_state" });
		const f = r?.data?.sessionFile;
		if (isStr(f) && f !== m.session) writeManifestSession(m, f);
	} catch (e) {
		console.error(`app ${m.name}: get_state after spawn failed: ${e.message}`);
	}
	return id;
}

async function handle(app, req, res, deps, files) {
	const { json, readBody, sseHead, originRejection, sendRpc, promptChild, answerDialog } = deps;
	const url = new URL(req.url, "http://localhost");
	const p = url.pathname;
	const m = app.manifest;
	try {
		if (req.method === "GET" && files[p]) {
			let data;
			try {
				data = fs.readFileSync(files[p]);
			} catch {
				return json(res, 404, { error: "not found" });
			}
			res.writeHead(200, { "content-type": MIME[path.extname(files[p])] || "application/octet-stream" });
			return res.end(data);
		}
		if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
			const bad = originRejection(req, m.port);
			if (bad) return json(res, 403, { error: bad });
		}
		if (p === "/api/manifest" && req.method === "GET")
			return json(res, 200, { name: m.name, title: m.title, cwd: m.cwd, mutating: m.mutating, tools: m.tools, port: m.port });
		if (p === "/api/session" && req.method === "GET") {
			const c = liveChild(app, deps);
			return json(res, 200, c ? childInfo(app.childId, c) : null);
		}
		if (p === "/api/session" && req.method === "POST") {
			await readBody(req); // drained and IGNORED: nothing about the spawn is client-supplied
			let c = liveChild(app, deps);
			if (!c) {
				// Serialized: concurrent POSTs share one spawn (else two children, one orphaned).
				if (!app.spawning) app.spawning = spawnForApp(app, deps).finally(() => (app.spawning = null));
				await app.spawning;
				c = deps.children.get(app.childId);
			}
			return json(res, 200, childInfo(app.childId, c));
		}
		const child = liveChild(app, deps);
		if (!child) return json(res, 404, { error: "no live session for this app — POST /api/session first" });
		if (p === "/api/events" && req.method === "GET") {
			sseHead(res);
			const hello = {
				type: "desk_hello", id: app.childId, app: m.name, cwd: child.cwd, state: child.state, startedAt: child.startedAt,
				dialogs: [...child.dialogs.values()], statuses: Object.fromEntries(child.statuses),
				widgets: Object.fromEntries(child.widgets), title: child.title, queue: child.queue,
			};
			res.write(`data: ${JSON.stringify(hello)}\n\n`);
			if (child.exitNote) res.write(`data: ${JSON.stringify(child.exitNote)}\n\n`);
			child.clients.add(res);
			res.on("close", () => child.clients.delete(res));
			return;
		}
		if (p === "/api/prompt" && req.method === "POST") {
			const r = await promptChild(child, await readBody(req));
			return json(res, r.status, r.body);
		}
		if (p === "/api/ui-response" && req.method === "POST") {
			const r = await answerDialog(child, await readBody(req));
			return json(res, r.status, r.body);
		}
		if (p === "/api/abort" && req.method === "POST") {
			const r = await sendRpc(child, { type: "abort" });
			return json(res, 200, { ok: r.success });
		}
		if (p === "/api/entries" && req.method === "GET") {
			const since = url.searchParams.get("since");
			const r = await sendRpc(child, since ? { type: "get_entries", since } : { type: "get_entries" });
			if (!r.success) return json(res, 500, { error: r.error });
			// The provenance tooth, ledger path: a nana-block entry without a valid
			// signature under this child's key (forged by another extension, or a
			// hand-edited session file) is dropped before the page sees it.
			return json(res, 200, { ...r.data, entries: verifiedEntries(child.stageKey || "", r.data.entries || []) });
		}
		json(res, 404, { error: "not found" });
	} catch (e) {
		json(res, 500, { error: String(e.message || e) });
	}
}
