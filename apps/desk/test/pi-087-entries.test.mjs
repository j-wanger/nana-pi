// pi 0.86/0.87 session entries on the desk's read path (lane U, 2026-09-28).
//
// pi ≥ 0.86 persists three kinds of entry its TUI chat never draws: the prompt/tool
// loadout as `message` entries with `role:"system"`, `usage` entries for cache-warm
// spend, and (0.87) `context_edit`, which changes only future MODEL context. The desk
// page draws any entry type it does not know as a bare "— <type> —" row, so the server
// keeps these out of /api/transcript — but they stay in the branch index, because any
// of them can be pi's leaf and the next message chains to it.
//
// Pins, on a session written by pi's OWN SessionManager (public root export):
//   · none of the three reaches the page;
//   · the active branch still equals SessionManager.getBranch() minus exactly those
//     (and session_info), including a message chained THROUGH a usage entry and a
//     context_edit;
//   · the context_edit target itself is still rendered (raw history is unchanged).
//
// Zero-dep. Needs the real pi ≥ 0.87 installed. Own port (DESK_PORT=0), own HOME.
// Run: node apps/desk/test/pi-087-entries.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadPiSession, resolvePiBin } from "../pi-session.mjs";

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };

const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const TD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-pi087-"));
const repo = path.join(TD, "repo");
const SESS = path.join(TD, ".pi", "agent", "sessions", "--pi087--");
for (const d of [repo, SESS]) fs.mkdirSync(d, { recursive: true });

const USAGE = { input: 0, output: 1, cacheRead: 5000, cacheWrite: 0, totalTokens: 5001, cost: { input: 0, output: 0, cacheRead: 0.01, cacheWrite: 0, total: 0.01 } };

let server;
try {
	const pi = await loadPiSession(resolvePiBin());
	const { SessionManager } = await import(pathToFileURL(pi.entryPoint).href);
	const mgr = SessionManager.create(repo, SESS);
	check("pi exposes the 0.87 appenders (appendUsage, appendContextEdit)",
		typeof mgr.appendUsage === "function" && typeof mgr.appendContextEdit === "function", `pi ${pi.version}`);
	const FILE = mgr.getSessionFile();
	const sys = mgr.appendMessage({ role: "system", content: "", sections: { preamble: "p" }, toolsAdded: [{ name: "read", description: "r", parameters: {} }], timestamp: Date.now() });
	const u1 = mgr.appendMessage({ role: "user", content: [{ type: "text", text: "first question" }], timestamp: Date.now() });
	const a1 = mgr.appendMessage({ role: "assistant", content: [{ type: "text", text: "first answer" }], provider: "test", model: "test-model", usage: USAGE, stopReason: "stop", timestamp: Date.now() });
	const warm = mgr.appendUsage("cache_warm", "test", "test-model", USAGE).id;
	const edit = mgr.appendContextEdit(a1, null);
	const u2 = mgr.appendMessage({ role: "user", content: [{ type: "text", text: "second question" }], timestamp: Date.now() });
	const a2 = mgr.appendMessage({ role: "assistant", content: [{ type: "text", text: "second answer" }], provider: "test", model: "test-model", usage: USAGE, stopReason: "stop", timestamp: Date.now() });
	const warmLeaf = mgr.appendUsage("cache_warm", "test", "test-model", USAGE).id; // a usage entry as a leaf …
	const editLeaf = mgr.appendContextEdit(a2, null); // … then a context_edit as pi's actual leaf (sol r1 LOW)
	const raw = fs.readFileSync(FILE, "utf8");
	check("the fixture file really carries the three new entry kinds",
		raw.includes('"type":"usage"') && raw.includes('"type":"context_edit"') && raw.includes('"role":"system"'));
	const piBranch = mgr.getBranch().map((e) => e.id);
	check("pi's own branch runs through them, ending at the context_edit leaf (via the usage leaf)", piBranch.at(-1) === editLeaf && [sys, warm, edit, warmLeaf].every((id) => piBranch.includes(id)), piBranch.join(","));

	server = spawn("node", [SERVER], { env: { ...process.env, HOME: TD, DESK_PORT: "0" }, stdio: ["ignore", "pipe", "pipe"] });
	let stdout = "";
	let stderr = "";
	server.stdout.on("data", (d) => { stdout += d; });
	server.stderr.on("data", (d) => { stderr += d; });
	let BASE = "";
	for (let i = 0; i < 120 && !BASE; i++) {
		const m = /http:\/\/127\.0\.0\.1:(\d+)/.exec(stdout);
		if (m) BASE = `http://127.0.0.1:${m[1]}`;
		else if (server.exitCode !== null) throw new Error(`desk server exited ${server.exitCode}. stderr:\n${stderr}`);
		else await new Promise((r) => setTimeout(r, 250));
	}
	if (!BASE) throw new Error(`desk server never reported a port. stderr:\n${stderr}`);
	const t = await (await fetch(`${BASE}/api/transcript?file=${encodeURIComponent(FILE)}`)).json();
	const ids = t.entries.map((e) => e.id);
	const types = t.entries.map((e) => (e.type === "message" ? `message:${e.message.role}` : e.type));

	check("no usage entry reaches the page", !types.includes("usage"), types.join(" "));
	check("no context_edit entry reaches the page", !types.includes("context_edit"), types.join(" "));
	check("no system-role message reaches the page", !types.includes("message:system"), types.join(" "));
	check("the context_edit TARGET is still rendered (raw history unchanged)", ids.includes(a1));
	check("every user/assistant message is rendered, in order", JSON.stringify(ids.filter((id) => [u1, a1, u2, a2].includes(id))) === JSON.stringify([u1, a1, u2, a2]), ids.join(","));
	const branch = t.entries.filter((e) => e.onBranch).map((e) => e.id);
	const hidden = new Set([sys, warm, edit, warmLeaf, editLeaf]);
	check("active branch = pi's getBranch() minus the hidden bookkeeping", JSON.stringify(branch) === JSON.stringify(piBranch.filter((id) => !hidden.has(id))), `${branch.join(",")} vs ${piBranch.join(",")}`);
	check("…so nothing is dimmed as an abandoned branch", t.entries.every((e) => e.onBranch), JSON.stringify(t.entries.filter((e) => !e.onBranch).map((e) => e.id)));
	check("the session still lists, titled by its first user message",
		(await (await fetch(`${BASE}/api/sessions`)).json()).flatMap((g) => g.sessions).some((r) => path.basename(r.file) === path.basename(FILE) && r.title === "first question"));
} catch (e) {
	console.log("FAIL harness", e?.stack || e);
	fails++;
} finally {
	if (server) server.kill("SIGTERM");
	fs.rmSync(TD, { recursive: true, force: true });
}
console.log(fails ? `${fails} FAILED` : "all PASS");
process.exit(fails ? 1 : 0);
