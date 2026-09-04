// Deterministic tests for the per-app listeners (design §6 deliverable 3).
// Drives the REAL desk server with two app manifests against a STUB `pi`
// that records its argv + cwd and speaks just enough RPC. Zero-dep.
// Run: node apps/desk/test/app-listener.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DESK = Number(process.env.DESK_TEST_PORT || 4401);
const PA = 4402, PB = 4403;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "desk-apps-"));
const binDir = path.join(tmp, "bin");
const appsDir = path.join(tmp, "apps");
const cwdA = path.join(tmp, "repo-a");
const cwdB = path.join(tmp, "repo-b");
const extA = path.join(tmp, "ext-a.ts");
const extStage = path.join(tmp, "nana-stage.ts");
for (const d of [binDir, appsDir, cwdA, cwdB]) fs.mkdirSync(d, { recursive: true });
fs.writeFileSync(extA, "export default function () {}\n");
fs.writeFileSync(extStage, "export default function () {}\n");
const OUT = path.join(tmp, "stub-out.jsonl");

// ── stub pi: records argv + cwd, answers get_state / get_entries / prompt, emits a dialog on "ask" ──
const STUB = `#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(process.env.STUB_OUT, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd() }) + "\\n");
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
const sessionFile = process.argv.includes("--session") ? process.argv[process.argv.indexOf("--session") + 1] : "/tmp/stub-" + process.pid + ".jsonl";
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
			case "get_state": ok({ isStreaming: false, isCompacting: false, sessionName: "stub", sessionFile, model: { provider: "stub", id: "stub" }, thinkingLevel: "off" }); break;
			case "get_entries": ok({ entries: [{ id: "e1", parentId: null, type: "message" }, { id: "e2", parentId: "e1", type: "custom", customType: "nana-block", data: { id: "blk_x", produced_by: { tool: "t" } } }], leafId: "e2", since: cmd.since || null }); break;
			case "prompt": {
				ok({});
				say({ type: "agent_start" });
				if (/ask/.test(cmd.message)) say({ type: "extension_ui_request", id: "ui-1", method: "select", title: "Allow?", options: ["Allow", "Deny"] });
				else { say({ type: "agent_end", messages: [] }); say({ type: "agent_settled" }); }
				break;
			}
			case "extension_ui_response": say({ type: "agent_end", messages: [] }); say({ type: "agent_settled" }); break;
			case "abort": ok({}); break;
			default: ok({});
		}
	}
});
process.stdin.on("end", () => process.exit(0));
`;
fs.writeFileSync(path.join(binDir, "pi"), STUB, { mode: 0o755 });

const manifest = (port, cwd, extra = {}) => ({ port, cwd, tools: ["read", "player_card"], extensions: [extA, extStage], trust: "no-approve", title: "T", ...extra });
fs.writeFileSync(path.join(appsDir, "alpha.json"), JSON.stringify(manifest(PA, cwdA)));
fs.writeFileSync(path.join(appsDir, "beta.json"), JSON.stringify(manifest(PB, cwdB, { trust: "approve", mutating: ["add_thing"] })));
fs.writeFileSync(path.join(appsDir, "Bad Name.json"), JSON.stringify(manifest(4404, cwdA)));
fs.writeFileSync(path.join(appsDir, "badcwd.json"), JSON.stringify(manifest(4405, "/no/such/dir")));

const server = spawn("node", [SERVER], {
	env: { ...process.env, DESK_PORT: String(DESK), DESK_APPS_DIR: appsDir, STUB_OUT: OUT, PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
	stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (c) => (serverLog += c));
server.stderr.on("data", (c) => (serverLog += c));

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const A = `http://127.0.0.1:${PA}`, B = `http://127.0.0.1:${PB}`, D = `http://127.0.0.1:${DESK}`;
const post = (base, p, body, origin = base) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify(body ?? {}) });
const get = (base, p) => fetch(base + p).then((r) => r.json());
const stubRuns = () => fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf-8").trim().split("\n").map((l) => JSON.parse(l)) : [];

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(A + "/api/manifest"); await fetch(B + "/api/manifest"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 39) throw new Error("app listeners never came up: " + serverLog);
	}
	check("invalid manifests rejected at load (bad name, bad cwd)", /Bad Name.json/.test(serverLog) && /badcwd.json/.test(serverLog), serverLog.split("\n").filter((l) => /apps:/.test(l)).join(" | "));

	// ── route table: none of the desk's surfaces exist on an app port ──
	for (const [method, p] of [["GET", "/api/live"], ["POST", "/api/spawn"], ["POST", "/api/session/1/bash"], ["GET", "/api/settings"], ["GET", "/api/sessions"], ["DELETE", "/api/session/1"], ["POST", "/api/session/1/rpc"]]) {
		const r = await fetch(A + p, { method, headers: { "content-type": "application/json", origin: A }, body: method === "GET" ? undefined : "{}" });
		check(`app port has no ${method} ${p}`, r.status === 404, String(r.status));
	}
	check("manifest is read-only public info", (await get(A, "/api/manifest")).name === "alpha");
	check("no session yet → null", (await get(A, "/api/session")) === null);
	check("events without a session → 404", (await fetch(A + "/api/events")).status === 404);

	// ── spawn ignores the body; argv comes from the manifest ──
	const s1 = await post(A, "/api/session", { cwd: "/etc", tools: ["bash"], approve: true, appendSystemPrompt: "pwned", resources: { extensions: ["/x"] } }).then((r) => r.json());
	check("spawn returns a child", typeof s1.id === "string" && s1.state === "running", JSON.stringify(s1));
	const run = stubRuns().at(-1);
	check("child cwd is the manifest cwd, not the body's", run.cwd === fs.realpathSync(cwdA), run.cwd);
	const argv = run.argv.join(" ");
	check("argv: -t from manifest (body tools ignored)", /-t read,player_card\b/.test(argv) && !/bash/.test(argv), argv);
	check("argv: -na for trust=no-approve (body approve ignored)", /\s-na\b/.test(` ${argv}`) && !/\s-a\b/.test(` ${argv}`), argv);
	check("argv: --no-extensions + manifest -e in order (nana-stage last)", argv.includes("--no-extensions") && argv.indexOf(`-e ${extA}`) < argv.indexOf(`-e ${extStage}`), argv);
	check("argv: --no-skills, no system prompt from body", argv.includes("--no-skills") && !argv.includes("--append-system-prompt"), argv);
	const s2 = await post(A, "/api/session", {}).then((r) => r.json());
	check("second POST reattaches the same child", s2.id === s1.id && stubRuns().length === 1);
	check("GET /api/session now returns it", (await get(A, "/api/session"))?.id === s1.id);

	// ── manifest session written back atomically after spawn ──
	const mA = JSON.parse(fs.readFileSync(path.join(appsDir, "alpha.json"), "utf-8"));
	check("manifest.session = sessionFile from get_state", typeof mA.session === "string" && mA.session.startsWith("/tmp/stub-"), String(mA.session));
	check("no temp file left behind", !fs.readdirSync(appsDir).some((f) => f.endsWith(".tmp")));

	// ── isolation: beta cannot see alpha; beta spawns its own with its own trust ──
	check("beta has no session while alpha does", (await get(B, "/api/session")) === null);
	const sB = await post(B, "/api/session", {}).then((r) => r.json());
	const runB = stubRuns().at(-1);
	check("beta spawned its own child in its own cwd with -a", sB.id !== s1.id && runB.cwd === fs.realpathSync(cwdB) && /\s-a\b/.test(` ${runB.argv.join(" ")}`));
	check("desk /api/live sees both app children (same user, same machine)", (await get(D, "/api/live")).filter((c) => c.id === s1.id || c.id === sB.id).length === 2);

	// ── Origin rule per port: A's origin cannot POST to B; own origin can ──
	let r = await post(B, "/api/prompt", { message: "hi" }, A);
	check("cross-origin (port A → port B) POST → 403", r.status === 403, String(r.status));
	r = await post(B, "/api/prompt", { message: "hi" }, D);
	check("desk origin → app port POST → 403", r.status === 403, String(r.status));
	r = await post(A, "/api/prompt", { message: "hi" });
	check("own-origin prompt accepted", r.status === 200, String(r.status));
	r = await fetch(A + "/api/prompt", { method: "POST", headers: { "content-type": "text/plain", origin: A }, body: "{}" });
	check("text/plain body → 403", r.status === 403, String(r.status));

	// ── entries passthrough ──
	const ent = await get(A, "/api/entries");
	check("entries: leafId + custom entry pass through", ent.leafId === "e2" && ent.entries[1].customType === "nana-block");
	const ent2 = await get(A, "/api/entries?since=e1");
	check("entries: since cursor forwarded", ent2.since === "e1");

	// ── dialog: desk_hello carries pending dialogs; ui-response answers; foreign origin cannot answer ──
	await post(A, "/api/prompt", { message: "please ask" });
	await new Promise((r) => setTimeout(r, 300));
	const hello = await new Promise((resolve, reject) => {
		const ctl = new AbortController();
		fetch(A + "/api/events", { signal: ctl.signal }).then(async (res) => {
			const reader = res.body.getReader();
			let text = "";
			for (let i = 0; i < 10 && !/^data: /m.test(text); i++) text += new TextDecoder().decode((await reader.read()).value);
			ctl.abort();
			resolve(JSON.parse(text.split("\n").find((l) => l.startsWith("data: ")).slice(6)));
		}).catch(reject);
	});
	check("desk_hello on the app port names the app and carries the pending dialog", hello.app === "alpha" && hello.dialogs.length === 1 && hello.dialogs[0].id === "ui-1", JSON.stringify(hello.dialogs));
	r = await post(A, "/api/ui-response", { id: "ui-1", value: "Allow" }, B);
	check("foreign origin cannot answer the dialog", r.status === 403);
	r = await post(A, "/api/ui-response", { id: "ui-1", value: "Allow" });
	check("own origin answers the dialog", r.status === 200 && (await r.json()).ok === true);
	r = await post(A, "/api/ui-response", { id: "ui-1", value: "Allow" });
	check("answering twice → 409 (dialog no longer open)", r.status === 409);
} catch (e) {
	console.log("HARNESS ERROR", e, "\n--- server log ---\n" + serverLog);
	fails = 99;
} finally {
	server.kill();
	fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
