// Deterministic tests for the per-app listeners (design §6 deliverable 3).
// Drives the REAL desk server with two app manifests against a STUB `pi`
// that records its argv + cwd and speaks just enough RPC. Zero-dep.
// Run: node apps/desk/test/app-listener.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { reduceEntries } from "../../../packages/nana-stage/lib/blocks.mjs";
import { resolvePiBin, resolvePiPackage } from "../pi-session.mjs";

const DESK = Number(process.env.DESK_TEST_PORT || 4401);
const PA = 4402, PB = 4403;
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
// The desk imports pi's session parser from the install tied to the `pi` it
// SPAWNS — and this test deliberately puts a stub `pi` first on PATH, which no
// package contains. So the harness names the real package explicitly; without it
// the desk refuses to start rather than guess which install to parse with.
const PI_ROOT = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
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
const SIGN = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../../packages/nana-stage/lib/sign.mjs");
const STUB = `#!/usr/bin/env node
const fs = require("node:fs");
fs.appendFileSync(process.env.STUB_OUT, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), hasKey: /^[0-9a-f]{64}$/.test(process.env.NANA_STAGE_KEY || ""), expect: process.env.NANA_STAGE_EXPECT_TOOLS || null }) + "\\n");
// like nana-stage: report tool readiness on the status channel — unless this child is the SILENT one
if (process.env.STUB_DIE_IN && process.cwd().includes(process.env.STUB_DIE_IN)) setTimeout(() => process.exit(7), 400);
if (!/silent/.test(process.cwd())) setTimeout(() => process.stdout.write(JSON.stringify({ type: "extension_ui_request", id: "st-1", method: "setStatus", statusKey: "nana-tools", statusText: "ready" }) + "\\n"), 150);
const BLOCK = { id: "blk_x", type: "card", title: "X", scope: "s", fields: [{ label: "a", value: 1 }], slot: "main", show: true };
const stamp = (id, tool, call) => ({ ...BLOCK, id, produced_by: { tool, args: {}, toolCallId: call, at: "2026-09-04T00:00:00.000Z" } });
let signBlock = null;
const ready = import(${JSON.stringify(SIGN)}).then((m) => { signBlock = m.signBlock; });
const signed = (b) => ({ ...b, produced_by: { ...b.produced_by, sig: signBlock(process.env.NANA_STAGE_KEY, b) } });
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
			case "get_entries": ready.then(() => ok({ entries: [
				{ id: "e1", parentId: null, type: "message" },
				{ id: "e2", parentId: "e1", type: "custom", customType: "nana-block", data: signed(stamp("blk_ok", "t", "c1")) },
				{ id: "e3", parentId: "e2", type: "custom", customType: "nana-block", data: stamp("blk_forged", "t", "c2") },
				{ id: "e4", parentId: "e3", type: "custom", customType: "other", data: { keep: true } },
			], leafId: "e4", since: cmd.since || null })); break;
			case "prompt": {
				ok({});
				say({ type: "agent_start" });
				if (/timed/.test(cmd.message)) say({ type: "extension_ui_request", id: "ui-t", method: "confirm", title: "Quick?", timeout: 400 });
				else if (/ask/.test(cmd.message)) say({ type: "extension_ui_request", id: "ui-1", method: "select", title: "Allow?", options: ["Allow", "Deny"] });
				else if (/blocks/.test(cmd.message)) ready.then(() => {
					say({ type: "tool_execution_end", toolCallId: "c9", toolName: "t", isError: false, result: { content: [{ type: "text", text: "x" }], details: { blocks: [
						signed(stamp("blk_live_ok", "t", "c9")),         // signed by this event → passes
						stamp("blk_live_unsigned", "t", "c9"),          // no sig → dropped
						signed(stamp("blk_live_othercall", "t", "c8")), // signed but another call → dropped
					] } } });
					say({ type: "agent_end", messages: [] }); say({ type: "agent_settled" });
				});
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
// gamma: an app with its OWN page and durable-state data commands (slice 2 seam)
const PG = 4407, G = `http://127.0.0.1:${PG}`;
const pageDir = path.join(tmp, "page"); fs.mkdirSync(pageDir);
fs.writeFileSync(path.join(pageDir, "index.html"), "<!doctype html><title>gamma page</title><script type=module src=/stage.js></script><script type=module src=/app.js></script>");
fs.writeFileSync(path.join(pageDir, "app.js"), "// gamma app.js\n");
fs.writeFileSync(path.join(pageDir, "stage.js"), "// MUST NOT be served: kit modules stay the kit's\n");
fs.writeFileSync(path.join(appsDir, "gamma.json"), JSON.stringify(manifest(PG, cwdA, {
	page: pageDir,
	data: {
		"tape": ["node", "-e", "console.log(JSON.stringify({ label: 'live', cwd: process.cwd(), argv: process.argv.slice(1) }))"],
		"boom": ["node", "-e", "process.stderr.write('kaput'); process.exit(3)"],
		"text": ["node", "-e", "console.log('not json')"],
		"gone": ["/no/such/binary"],
		"slow": ["node", "-e", "setTimeout(() => console.log('{}'), 5000)"],
	},
	quick: [["panel", "Show the panel"], ["bad"], "nope"],
})));
fs.writeFileSync(path.join(appsDir, "badpage.json"), JSON.stringify(manifest(4408, cwdA, { page: path.join(tmp, "nowhere") })));
fs.writeFileSync(path.join(appsDir, "baddata.json"), JSON.stringify(manifest(4409, cwdA, { data: { "Bad Key": ["node"] } })));
fs.writeFileSync(path.join(appsDir, "baddata2.json"), JSON.stringify(manifest(4410, cwdA, { data: { ok: "node -e 1" } })));
// delta: a child that NEVER reports its tools (its cwd name tells the stub to stay silent)
const PD = 4411, Dl = `http://127.0.0.1:${PD}`;
const cwdSilent = path.join(tmp, "repo-silent"); fs.mkdirSync(cwdSilent);
fs.writeFileSync(path.join(appsDir, "delta.json"), JSON.stringify(manifest(PD, cwdSilent)));
fs.writeFileSync(path.join(appsDir, "alpha.json"), JSON.stringify(manifest(PA, cwdA)));
fs.writeFileSync(path.join(appsDir, "beta.json"), JSON.stringify(manifest(PB, cwdB, { trust: "approve", mutating: ["add_thing"] })));
fs.writeFileSync(path.join(appsDir, "Bad Name.json"), JSON.stringify(manifest(4404, cwdA)));
fs.writeFileSync(path.join(appsDir, "badcwd.json"), JSON.stringify(manifest(4405, "/no/such/dir")));
fs.writeFileSync(path.join(appsDir, "notools.json"), JSON.stringify(manifest(4406, cwdA, { tools: [] })));

const server = spawn("node", [SERVER], {
	env: { ...process.env, DESK_PI_ROOT: PI_ROOT, DESK_PORT: String(DESK), DESK_APPS_DIR: appsDir, STUB_OUT: OUT, DESK_DATA_TIMEOUT_MS: "800", DESK_READY_BOUND_MS: "1500", PATH: `${binDir}${path.delimiter}${process.env.PATH}` },
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
		try { await fetch(A + "/api/manifest"); await fetch(B + "/api/manifest"); await fetch(G + "/api/manifest"); await fetch(Dl + "/api/manifest"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 39) throw new Error("app listeners never came up: " + serverLog);
	}
	check("invalid manifests rejected at load (bad name, bad cwd, EMPTY tools)", /Bad Name.json/.test(serverLog) && /badcwd.json/.test(serverLog) && /notools.json: tools: a non-empty/.test(serverLog), serverLog.split("\n").filter((l) => /apps:/.test(l)).join(" | "));
	check("empty-tools app has no listener", await fetch("http://127.0.0.1:4406/api/manifest").then(() => false).catch(() => true));

	// ── route table: none of the desk's surfaces exist on an app port ──
	for (const [method, p] of [["GET", "/api/live"], ["POST", "/api/spawn"], ["POST", "/api/session/1/bash"], ["GET", "/api/settings"], ["GET", "/api/sessions"], ["DELETE", "/api/session/1"], ["POST", "/api/session/1/rpc"]]) {
		const r = await fetch(A + p, { method, headers: { "content-type": "application/json", origin: A }, body: method === "GET" ? undefined : "{}" });
		check(`app port has no ${method} ${p}`, r.status === 404, String(r.status));
	}
	check("manifest is read-only public info", (await get(A, "/api/manifest")).name === "alpha");

	// ── slice 2: app page + data commands ──
	check("bad page / data manifests rejected at load", /badpage.json: page: no index.html/.test(serverLog) && /baddata.json: data: key 'Bad Key'/.test(serverLog) && /baddata2.json: data.ok: non-empty argv/.test(serverLog), serverLog.split("\n").filter((l) => /bad(page|data)/.test(l)).join(" | "));
	const gm = await get(G, "/api/manifest");
	check("manifest exposes quick prompts (well-formed only) and data keys, never argv", JSON.stringify(gm.quick) === JSON.stringify([["panel", "Show the panel"]]) && JSON.stringify(gm.data) === JSON.stringify(["tape", "boom", "text", "gone", "slow"]) && !JSON.stringify(gm).includes("node"), JSON.stringify(gm));
	check("app page served from the manifest's page dir", /gamma page/.test(await fetch(G + "/").then((r) => r.text())) && /gamma page/.test(await fetch(G + "/index.html").then((r) => r.text())));
	check("app.js served from the page dir", /gamma app.js/.test(await fetch(G + "/app.js").then((r) => r.text())));
	check("stage.js is the KIT's even when the page dir has its own", !/MUST NOT/.test(await fetch(G + "/stage.js").then((r) => r.text())));
	check("alpha (no page) has no /app.js", (await fetch(A + "/app.js")).status === 404);
	check("alpha (no page) serves the kit stage page", /<title>stage<\/title>/.test(await fetch(A + "/").then((r) => r.text())));
	const tape = await post(G, "/api/data/tape?x=1&argv=evil", { argv: ["evil"] }).then((r) => r.json());
	check("data command runs with fixed argv in the app cwd; query string and body ignored", tape.label === "live" && tape.cwd === fs.realpathSync(cwdA) && JSON.stringify(tape.argv) === "[]", JSON.stringify(tape));
	let dr = await post(G, "/api/data/boom", {});
	check("failing data command → 500 with its stderr, never a guess", dr.status === 500 && /exit 3/.test((await dr.json()).error), String(dr.status));
	dr = await post(G, "/api/data/text", {});
	check("non-JSON stdout → 500", dr.status === 500 && /did not print JSON/.test((await dr.json()).error));
	dr = await post(G, "/api/data/gone", {});
	check("unstartable command → 500", dr.status === 500 && /failed to start/.test((await dr.json()).error));
	check("unknown data key → 404", (await post(G, "/api/data/nope", {})).status === 404);
	dr = await post(G, "/api/data/slow", {});
	check("data command over the timeout → 504, killed", dr.status === 504 && /timed out/.test((await dr.json()).error), String(dr.status));
	// the route is a POST under the Origin + JSON rule: no GET exists, cross-site POSTs cannot run the command
	check("GET /api/data → 404 (no command-running GET exists for legacy cross-site fetches)", (await fetch(G + "/api/data/tape")).status === 404);
	check("cross-origin POST /api/data → 403", (await post(G, "/api/data/tape", {}, A)).status === 403);
	check("text/plain POST /api/data (a form/simple request) → 403", (await fetch(G + "/api/data/tape", { method: "POST", headers: { "content-type": "text/plain", origin: G }, body: "{}" })).status === 403);
	check("same-origin JSON POST /api/data → 200", (await post(G, "/api/data/tape", {})).status === 200);
	check("curl-style POST (no Origin, JSON) → 200", (await fetch(G + "/api/data/tape", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status === 200);
	check("body-less POST with no Origin and no content-type (a legacy simple request) → 403", (await fetch(G + "/api/data/tape", { method: "POST" })).status === 403);
	check("body-less POST with a form content-type → 403", (await fetch(G + "/api/data/tape", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" } })).status === 403);
	check("alpha (no data) → 404 on every data key", (await fetch(A + "/api/data/tape")).status === 404);
	check("no session yet → null", (await get(A, "/api/session")) === null);
	check("events without a session → 404", (await fetch(A + "/api/events")).status === 404);

	// ── spawn ignores the body; argv comes from the manifest ──
	const body = { cwd: "/etc", tools: ["bash"], approve: true, appendSystemPrompt: "pwned", resources: { extensions: ["/x"] } };
	const [s1, s1b, s1c] = await Promise.all([post(A, "/api/session", body), post(A, "/api/session", body), post(A, "/api/session", body)].map((p) => p.then((r) => r.json())));
	check("spawn returns a child", typeof s1.id === "string" && s1.state === "running", JSON.stringify(s1));
	check("three concurrent POST /api/session → ONE child", s1.id === s1b.id && s1b.id === s1c.id && stubRuns().length === 1, `${stubRuns().length} runs`);
	const run = stubRuns().at(-1);
	check("child received a per-session NANA_STAGE_KEY", run.hasKey === true);
	check("child cwd is the manifest cwd, not the body's", run.cwd === fs.realpathSync(cwdA), run.cwd);
	const argv = run.argv.join(" ");
	check("argv: -t from manifest (body tools ignored)", /-t read,player_card\b/.test(argv) && !/bash/.test(argv), argv);
	check("argv: -na for trust=no-approve (body approve ignored)", /\s-na\b/.test(` ${argv}`) && !/\s-a\b/.test(` ${argv}`), argv);
	check("argv: --no-extensions + manifest -e in order (nana-stage last)", argv.includes("--no-extensions") && argv.indexOf(`-e ${extA}`) < argv.indexOf(`-e ${extStage}`), argv);
	check("argv: --no-skills, no system prompt from body", argv.includes("--no-skills") && !argv.includes("--append-system-prompt"), argv);
	const s2 = await post(A, "/api/session", {}).then((r) => r.json());
	check("second POST reattaches the same child", s2.id === s1.id && stubRuns().length === 1);
	check("GET /api/session now returns it", (await get(A, "/api/session"))?.id === s1.id);

	check("child was told the expected tools (NANA_STAGE_EXPECT_TOOLS = manifest tools)", run.expect === "read,player_card", String(run.expect));
	check("session reports tools READY from the stub's status report", s1.tools === "ready", String(s1.tools));

	// ── fail-closed readiness: a child that never reports is UNREPORTED after the bound, never ready ──
	const t0 = Date.now();
	const sD = await post(Dl, "/api/session", {}).then((r) => r.json());
	check("silent child: POST /api/session held until the bound, then tools = unreported", sD.tools === "unreported" && Date.now() - t0 >= 1200, `${sD.tools} after ${Date.now() - t0} ms`);
	const rD = await post(Dl, "/api/prompt", { message: "hi" });
	check("silent child: prompts refused (409) — never run the model without the app's tools", rD.status === 409 && /unreported/.test((await rD.json()).error), String(rD.status));
	check("silent child: GET /api/session shows unreported", (await get(Dl, "/api/session")).tools === "unreported");
	// a child that EXITS before reporting: the spawn answers with an error, never a 200 "waiting"
	const cwdDying = path.join(tmp, "repo-silent-dying"); fs.mkdirSync(cwdDying);
	fs.writeFileSync(path.join(appsDir, "epsilon.json"), JSON.stringify(manifest(4412, cwdDying)));
	// (the server loads manifests at start — spawn a second server for this one app)
	const OUT2 = path.join(tmp, "stub-out-2.jsonl");
	const server2 = spawn("node", [SERVER], { env: { ...process.env, DESK_PI_ROOT: PI_ROOT, DESK_PORT: "4413", DESK_APPS_DIR: appsDir, STUB_OUT: OUT2, STUB_DIE_IN: "dying", DESK_READY_BOUND_MS: "5000", PATH: `${binDir}${path.delimiter}${process.env.PATH}` }, stdio: ["ignore", "pipe", "pipe"] });
	try {
		for (let i = 0; i < 40; i++) { try { await fetch("http://127.0.0.1:4412/api/manifest"); break; } catch { await new Promise((r) => setTimeout(r, 250)); } }
		const rE = await post("http://127.0.0.1:4412", "/api/session", {});
		check("dying child: POST /api/session → 502 naming the exit, not a 200 with tools=waiting", rE.status === 502 && /exited before its tools/.test((await rE.json()).error), String(rE.status));
	} finally { server2.kill(); }

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
	check("entries: leafId + signed nana-block entry pass through", ent.leafId === "e4" && ent.entries.some((e) => e.customType === "nana-block" && e.data.id === "blk_ok"));
	check("entries: FORGED (unsigned) nana-block entry REDACTED, other custom entries kept", !ent.entries.some((e) => e.customType === "nana-block" && e.data?.id === "blk_forged") && ent.entries.some((e) => e.customType === "nana-block-rejected") && ent.entries.some((e) => e.customType === "other"));
	check("entries: topology preserved — the forged node stays as a parent, so the reducer still reaches the valid block", ent.entries.length === 4 && ent.entries[2].id === "e3" && reduceEntries(ent.entries, ent.leafId).map((b) => b.id).join() === "blk_ok");
	// live path: only the block signed by THIS event reaches the SSE clients
	const liveBlocks = await new Promise((resolve, reject) => {
		const ctl = new AbortController();
		let text = "";
		fetch(A + "/api/events", { signal: ctl.signal }).then(async (res) => {
			const reader = res.body.getReader();
			post(A, "/api/prompt", { message: "emit blocks" });
			for (let i = 0; i < 40 && !/tool_execution_end/.test(text); i++) text += new TextDecoder().decode((await reader.read()).value);
			ctl.abort();
			const line = text.split("\n").find((l) => l.startsWith("data: ") && /tool_execution_end/.test(l));
			resolve(JSON.parse(line.slice(6)).result.details.blocks.map((b) => b.id));
		}).catch(reject);
	});
	check("live: unsigned + other-call carriers stripped before broadcast", JSON.stringify(liveBlocks) === JSON.stringify(["blk_live_ok"]), JSON.stringify(liveBlocks));
	await new Promise((r) => setTimeout(r, 200));
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

	// a TIMED dialog expires server-side too: after its timeout the snapshot no longer lists it
	await post(A, "/api/prompt", { message: "timed question" });
	await new Promise((r) => setTimeout(r, 150));
	check("timed dialog pending right after it arrives", (await get(A, "/api/session")).openDialogs === 1);
	await new Promise((r) => setTimeout(r, 900));
	check("timed dialog gone from the snapshot after its timeout", (await get(A, "/api/session")).openDialogs === 0);
	r = await post(A, "/api/ui-response", { id: "ui-t", confirmed: true });
	check("answering an expired dialog → 409", r.status === 409);
} catch (e) {
	console.log("HARNESS ERROR", e, "\n--- server log ---\n" + serverLog);
	fails = 99;
} finally {
	server.kill();
	fs.rmSync(tmp, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
