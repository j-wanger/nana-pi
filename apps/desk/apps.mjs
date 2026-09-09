// apps.mjs — one listener PER APP for the UI-centric frontend
// (docs/agent-frontend-design-2026-09-04.md §3.4).
//
// Every app manifest in ~/.pi/agent/apps/<name>.json gets its own
// 127.0.0.1:<port> — its own browser origin, distinct from the desk (7317) and
// from every other app. A listener serves that app's stage host and exactly
// these routes; nothing else exists on it (no spawn, live, session/:id, bash,
// rpc passthrough, delete, settings):
//
//   POST /api/session            spawn this app's session from its manifest (held until nana-stage
//                                reports the manifest tools active: `tools` = ready | waiting |
//                                unreported | missing: …; prompts are refused unless ready),
//                                or return the live one
//   GET  /api/session            the live child, or null
//   GET  /api/events             SSE: desk_hello, then live events
//   POST /api/prompt             {message, mode?}
//   POST /api/ui-response        {id, value?|confirmed?|cancelled?}
//   POST /api/abort
//   GET  /api/entries?since=     get_entries passthrough (the one RPC a stage page needs)
//   GET  /api/manifest           {name, title, cwd, mutating, tools, quick} — read-only
//   POST /api/data/<key>         app-owned durable state: runs the manifest's `data[key]`
//                                command (cwd = manifest.cwd, fixed argv, body ignored,
//                                20 s timeout) and relays its JSON stdout; a POST so the
//                                Origin + JSON rule guards it like every mutating route
//   GET  /<page file>            when the manifest names a `page` dir, its index.html /
//                                app.js / app.css are served in place of the kit's stage
//                                page (the kit modules stay at their paths)
//
// Routes carry no app name and no child id: the listener IS the app and holds
// exactly one child reference. Everything about the spawn (cwd, tools → -t,
// extensions, skills, project trust → -a/-na, last session file) comes from the
// manifest; the client body is ignored. `session` is written back atomically
// after spawn from get_state.sessionFile so a restart reattaches the right file.
//
// The desk server owns the children; this module borrows its primitives via
// `deps` (no circular import, no second child map).

import { spawn } from "node:child_process";
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
// REDACT, never delete: an entry is a node in the session tree (id/parentId), and
// a forged one may sit in the ancestry of valid later entries. Dropping it would
// sever the path and blank a valid stage. The payload is replaced instead.
//
// `keys` is the LEDGER key set (server.mjs `ledgerKeys`): this child's key plus
// every key the desk recorded for the session it currently holds. An entry that
// matches none of them is redacted — an empty set redacts everything, which is the
// direction a failure has to fall.
function verifiedEntries(keys, entries) {
	return entries.map((e) => (e && e.type === "custom" && e.customType === ENTRY_TYPE && !keys.some((k) => verifyBlock(k, e.data))
		? { ...e, customType: "nana-block-rejected", data: { rejected: "unsigned or forged nana-block entry", id: e.data?.id ?? null } }
		: e));
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
		// One bad manifest must cost exactly one app. A file holding `null` (valid
		// JSON, not an object) threw on `raw.port` and, because this runs at module
		// load, took the WHOLE desk down before it served anything.
		let m;
		try {
			m = raw && typeof raw === "object" && !Array.isArray(raw)
				? normalizeManifest(name, file, raw)
				: { error: "manifest must be a JSON object" };
		} catch (e) {
			m = { error: `unreadable manifest: ${e.message}` };
		}
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
	// App-owned page + durable-state commands (slice 2). `page` is a directory the
	// listener serves three fixed files from; `data` maps a route key to a fixed
	// argv run in the app cwd. Both are manifest-side (trusted like `extensions`);
	// nothing about them is client-supplied.
	let page = null;
	if (raw.page !== undefined) {
		if (!isStr(raw.page)) return { error: "page: directory path" };
		page = raw.page.replace(/^~(?=$|\/)/, process.env.HOME || "");
		if (!fs.existsSync(path.join(page, "index.html"))) return { error: `page: no index.html in ${raw.page}` };
	}
	const data = {};
	if (raw.data !== undefined) {
		if (raw.data === null || typeof raw.data !== "object" || Array.isArray(raw.data)) return { error: "data: object of key → argv" };
		for (const [k, argv] of Object.entries(raw.data)) {
			if (!/^[a-z0-9][a-z0-9-]*$/.test(k)) return { error: `data: key '${k}' must be [a-z0-9-]` };
			if (!Array.isArray(argv) || !argv.length || !argv.every(isStr)) return { error: `data.${k}: non-empty argv string[]` };
			data[k] = argv;
		}
	}
	const quick = Array.isArray(raw.quick) ? raw.quick.filter((q) => Array.isArray(q) && q.length === 2 && q.every(isStr)) : [];
	const tools = strList(raw.tools);
	// An EMPTY allowlist would mean "pi defaults" (bash, edit, write...). Refuse
	// rather than silently widen: an app session names every tool it gets.
	if (!tools.length) return { error: "tools: a non-empty allowlist is required (an empty list would enable pi's default tools)" };
	return {
		name, file, port, cwd, extensions, skills, trust,
		tools,
		mutating: strList(raw.mutating),
		page, data, quick,
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

// Explicit static map — no directory traversal, no listing. An app `page` dir
// overrides the three page files only; kit modules are always the kit's.
function staticMap(dirs, page) {
	const own = (f) => (page && fs.existsSync(path.join(page, f)) ? path.join(page, f) : null);
	return {
		"/": own("index.html") || path.join(dirs.stage, "index.html"),
		"/index.html": own("index.html") || path.join(dirs.stage, "index.html"),
		"/app.js": own("app.js"),
		"/app.css": own("app.css"),
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
		const files = staticMap(dirs, m.page);
		for (const k of Object.keys(files)) if (!files[k]) delete files[k];
		const server = http.createServer((req, res) => handle(app, req, res, deps, files));
		server.listen(m.port, "127.0.0.1", () => console.log(`app ${m.name} → http://127.0.0.1:${m.port}`));
		server.on("error", (e) => console.error(`app ${m.name}: ${e.message}`));
		servers.push({ app, server });
	}
	return servers;
}

function runData(argv, cwd, env) {
	return new Promise((resolve) => {
		let out = "", err = "";
		const proc = spawn(argv[0], argv.slice(1), { cwd, stdio: ["ignore", "pipe", "pipe"], env });
		const ms = Number(process.env.DESK_DATA_TIMEOUT_MS) || 20000; // env: tests only
		const timer = setTimeout(() => { proc.kill("SIGKILL"); resolve({ status: 504, body: { error: `data command timed out (${ms} ms)` } }); }, ms);
		proc.stdout.on("data", (c) => (out += c));
		proc.stderr.on("data", (c) => (err += c));
		proc.on("error", (e) => { clearTimeout(timer); resolve({ status: 500, body: { error: `data command failed to start: ${e.message}` } }); });
		proc.on("close", (code) => {
			clearTimeout(timer);
			if (code !== 0) return resolve({ status: 500, body: { error: `data command exit ${code}`, stderr: err.slice(-600) } });
			try { resolve({ status: 200, body: JSON.parse(out) }); } catch { resolve({ status: 500, body: { error: "data command did not print JSON", stdout: out.slice(-300) } }); }
		});
	});
}
function liveChild(app, deps) {
	if (!app.childId) return null;
	const c = deps.children.get(app.childId);
	if (!c || c.state !== "running") return null;
	return c;
}

// tools: "ready" | "waiting" | "unreported" | "missing: a,b". The DESK owns the state: an
// app child spawned with an expected tool list is "waiting" until nana-stage's report
// (statusKey nana-tools) says otherwise; if no report arrives within the bound it is
// "unreported" — never assumed ready. A child spawned without expected tools is ready.
const READY_BOUND_MS = Number(process.env.DESK_READY_BOUND_MS) || 35000; // env: tests only
function toolsState(c) {
	const st = c.statuses.get("nana-tools");
	if (st) return st;
	if (!c.toolsExpected) return "ready";
	return Date.now() - c.startedAt > READY_BOUND_MS ? "unreported" : "waiting";
}
function childInfo(id, c) {
	return { id, cwd: c.cwd, state: c.state, startedAt: c.startedAt, title: c.title, openDialogs: c.dialogs.size, tools: toolsState(c) };
}
// Hold until the child's tools state leaves "waiting" (report, exit, or the bound).
async function awaitTools(c) {
	while (toolsState(c) === "waiting" && c.state === "running") await new Promise((r) => setTimeout(r, 150));
	return toolsState(c);
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
		// Record the child's stage key against the session it actually opened, before
		// any block is minted: a desk that dies before the first ledger read must still
		// be able to verify what this child signed.
		deps.noteStageSession(child, r?.data);
		const f = r?.data?.sessionFile;
		if (isStr(f) && f !== m.session) writeManifestSession(m, f);
	} catch (e) {
		console.error(`app ${m.name}: get_state after spawn failed: ${e.message}`);
	}
	return id;
}

async function handle(app, req, res, deps, files) {
	const { json, readBody, sseHead, sseLine, sseWrite, originRejection, hostRejection, failRequest, sendRpc, promptChild, answerDialog } = deps;
	const m = app.manifest;
	try {
		// Inside the boundary: `GET /// HTTP/1.1` is a target Node's parser accepts
		// and `new URL` rejects — thrown out here it killed the whole desk process,
		// this listener and every other app's with it.
		let url;
		try {
			url = new URL(req.url, "http://localhost");
		} catch {
			return json(res, 400, { error: "malformed request URL" });
		}
		const p = url.pathname;
		// same DNS-rebind rule as the desk listener, against THIS app's port
		const badHost = hostRejection(req, m.port);
		if (badHost) return json(res, 403, { error: badHost });
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
			return json(res, 200, { name: m.name, title: m.title, cwd: m.cwd, mutating: m.mutating, tools: m.tools, port: m.port, quick: m.quick, data: Object.keys(m.data) });
		if (p.startsWith("/api/data/") && req.method === "POST") {
			// Running a command is state-changing in cost, so the route is a POST under the
			// same Origin + application/json rule as every other state-changing route: a
			// cross-site <img>/<script>/form cannot send a JSON body with our origin, and a
			// GET (which legacy clients could fire without Fetch Metadata) does not exist here.
			// The shared rule checks the content-type only when a body is present; a body-less
			// simple POST from a client that sends no Origin would slip past it. This route
			// runs a command, so it demands application/json unconditionally.
			if (!/^application\/json\b/i.test(String(req.headers["content-type"] || ""))) return json(res, 403, { error: "content-type must be application/json" });
			await readBody(req); // drained and ignored: nothing client-supplied reaches the command
			const key = p.slice("/api/data/".length);
			const argv = m.data[key];
			if (!argv) return json(res, 404, { error: "no such data key" });
			// Fixed argv from the manifest; the query string is ignored. The command's
			// stdout must be one JSON document. Failures are reported, never guessed.
			// same PATH fix-up the pi child gets (service managers ship a minimal PATH)
			const r = await runData(argv, m.cwd, deps.childEnv ? deps.childEnv() : process.env);
			return json(res, r.status, r.body);
		}
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
			await awaitTools(c);
			if (c.state !== "running") return json(res, 502, { error: `app session exited before its tools were ready (${toolsState(c)})`, exit: c.exitNote || null });
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
			// guarded, same as the desk listener: a client that vanished between the
			// request and here must not throw inside this route
			if (!sseWrite(res, sseLine(hello))) return;
			if (child.exitNote) sseWrite(res, sseLine(child.exitNote));
			child.clients.add(res);
			res.on("close", () => child.clients.delete(res));
			return;
		}
		if (p === "/api/prompt" && req.method === "POST") {
			// A prompt before the app's tools are active would run the model without them
			// (and the allowlist excludes the adapter's proxy): refuse, do not guess.
			const ts = toolsState(child);
			if (ts !== "ready") return json(res, 409, { error: ts === "waiting" ? "app tools not ready yet — retry" : `app tools ${ts}` });
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
			// CONCURRENT, not serial: resolving the key set costs its own get_state RPC
			// (server.mjs `ledgerKeys`), and running it after get_entries would add that
			// round trip — and a second RPC timeout — to every ledger read. `ledgerKeys`
			// never rejects, so Promise.all here cannot lose the entries.
			const [keys, r] = await Promise.all([
				deps.ledgerKeys(child),
				sendRpc(child, since ? { type: "get_entries", since } : { type: "get_entries" }),
			]);
			if (!r.success) return json(res, 500, { error: r.error });
			// The provenance tooth, ledger path: a nana-block entry without a valid
			// signature under one of the keys the desk issued for this session (forged
			// by another extension, or a hand-edited session file) is redacted before
			// the page sees it. Blocks minted before a restart verify here — under an
			// older key of the same session — while the LIVE path stays this child's
			// key alone.
			return json(res, 200, { ...r.data, entries: verifiedEntries(keys, r.data.entries || []) });
		}
		json(res, 404, { error: "not found" });
	} catch (e) {
		failRequest(res, e);
	}
}
