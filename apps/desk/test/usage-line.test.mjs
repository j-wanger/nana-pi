/**
 * @module apps/desk/test/usage-line.test.mjs
 * @purpose Pins the desk usage line triggers, exact fields and privacy boundary.
 * @inputs the desk server, a temporary HOME, an app manifest and a stub pi executable
 * @outputs PASS/FAIL lines and a failing exit code when the usage contract changes
 * @effects disk (temporary fixtures), process (desk and stub pi), network (ephemeral loopback listeners)
 * @errors failed checks increment the failure count; unexpected errors fail the process
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolvePiBin, resolvePiPackage } from "../pi-session.mjs";

const tmp = tmpDir(path.join(os.tmpdir(), "desk-usage-"));
const home = path.join(tmp, "home");
const agent = path.join(home, ".pi", "agent");
const sessions = path.join(agent, "sessions");
const apps = path.join(tmp, "apps");
const bin = path.join(tmp, "bin");
const cwd = path.join(tmp, "repo-CWDMARK");
for (const dir of [sessions, apps, bin, cwd]) fs.mkdirSync(dir, { recursive: true });
const sessionId = "usage-session-id";
const sessionFile = path.join(sessions, `${sessionId}.jsonl`);
fs.writeFileSync(sessionFile, JSON.stringify({ type: "session", version: 3, id: sessionId, timestamp: new Date().toISOString(), cwd }) + "\n");
const piRoot = process.env.DESK_PI_ROOT || resolvePiPackage(resolvePiBin()).root;
const stub = `#!/usr/bin/env node
const say = (o) => process.stdout.write(JSON.stringify(o) + "\\n");
const sessionFile = process.argv.includes("--session") ? process.argv[process.argv.indexOf("--session") + 1] : ${JSON.stringify(sessionFile)};
setTimeout(() => say({type:"extension_ui_request", method:"setStatus", statusKey:"nana-tools", statusText:"ready"}), 80);
let buf = "";
process.stdin.on("data", c => { buf += c; let n; while ((n=buf.indexOf("\\n")) >= 0) { const line=buf.slice(0,n); buf=buf.slice(n+1); let cmd; try { cmd=JSON.parse(line); } catch { continue; } const ok=data=>say({type:"response",id:cmd.id,command:cmd.type,success:true,data}); if(cmd.type==="get_state") ok({isStreaming:false,isCompacting:false,sessionName:"stub",sessionFile,model:{provider:"stub",id:"stub"},thinkingLevel:"off"}); else if(cmd.type==="prompt") { ok({}); say({type:"agent_end",messages:[]}); say({type:"agent_settled"}); } else ok({}); }});
`;
fs.writeFileSync(path.join(bin, "pi"), stub, { mode: 0o755 });
fs.writeFileSync(path.join(apps, "uapp.json"), JSON.stringify({ port: 0, cwd, tools: ["read"] }));
const serverPath = new URL("../server.mjs", import.meta.url).pathname;
const server = spawn("node", [serverPath], { env: { ...process.env, HOME: home, PI_CODING_AGENT_DIR: agent, DESK_PI_ROOT: piRoot, DESK_PORT: "0", DESK_APPS_DIR: apps, PATH: `${bin}${path.delimiter}${process.env.PATH}` }, stdio: ["ignore", "pipe", "pipe"] });
let stdout = "";
let stderr = "";
server.stdout.on("data", c => { stdout += c; });
server.stderr.on("data", c => { stderr += c; });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const get = (base, route) => fetch(base + route);
const post = (base, route, body) => fetch(base + route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
let failures = 0;
const check = (name, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", name, extra); if (!ok) failures++; };

try {
	let desk = 0, app = 0;
	for (let i = 0; i < 100; i++) {
		const match = stdout.match(/nana code → http:\/\/127\.0\.0\.1:(\d+)/);
		if (match) desk = Number(match[1]);
		if (desk) {
			try {
				const listeners = await fetch(`http://127.0.0.1:${desk}/api/apps`).then(r => r.json());
				app = listeners.find(x => x.name === "uapp")?.port || 0;
				if (app) break;
			} catch {}
		}
		await pause(50);
	}
	if (!desk || !app) throw new Error(`listeners did not bind: ${stdout} | ${stderr}`);
	const D = `http://127.0.0.1:${desk}`, A = `http://127.0.0.1:${app}`;
	await get(D, "/");
	await get(D, "/app.js");
	await get(D, "/styles.css");
	await get(D, "/api/sessions");
	await get(D, "/api/live");
	await get(D, `/api/transcript?file=${encodeURIComponent(sessionFile)}`);
	const spawned = await post(D, "/api/spawn", { cwd }).then(r => r.json());
	if (!spawned.id) throw new Error(`desk spawn failed: ${JSON.stringify(spawned)}`);
	await post(D, `/api/session/${encodeURIComponent(spawned.id)}/prompt`, { message: "MSGMARK" });
	await get(A, "/");
	await get(A, "/stage.js");
	const appSession = await post(A, "/api/session", {}).then(r => r.json());
	if (!appSession.id) throw new Error(`app session failed: ${JSON.stringify(appSession)}`);
	await post(A, "/api/prompt", { message: "APPMARK" });
	await pause(100);
	const usageCount = text => text.split("\n").filter(line => line.includes('"event":"desk_usage"')).length;
	const beforeNegatives = usageCount(stdout);
	const sse = new AbortController();
	const sseResponse = await fetch(`${A}/api/events`, { signal: sse.signal });
	sse.abort();
	const entriesResponse = await get(A, "/api/entries");
	const dataResponse = await post(A, "/api/data/nope", {});
	const rpcResponse = await post(D, `/api/session/${encodeURIComponent(spawned.id)}/rpc`, { command: { type: "not_a_real_rpc_command" } });
	const rejectedResponse = await post(D, "/api/spawn", { cwd: "/definitely/not/a/desk/cwd" });
	await pause(100);
	const afterNegatives = usageCount(stdout);
	const lines = stdout.split("\n").filter(line => line.includes('"event":"desk_usage"'));
	const records = lines.map(line => JSON.parse(line));
	const actual = records.map(({ surface, action }) => `${surface}:${action}`).sort();
	// req: R-699
	check("usage triggers are exactly desk open/view/prompt and app open/prompt", JSON.stringify(actual) === JSON.stringify(["app:uapp:open", "app:uapp:prompt", "desk:open", "desk:prompt", "desk:view"].sort()), JSON.stringify(actual));
	// req: R-699
	check("each usage record carries exactly the four permitted keys", records.length === 5 && records.every(record => JSON.stringify(Object.keys(record).sort()) === JSON.stringify(["action", "event", "surface", "ts"])), JSON.stringify(records));
	const start = Date.now() - 15000, end = Date.now() + 1000;
	// req: R-699
	check("usage timestamps parse and fall within the request window", records.length === 5 && records.every(({ ts }) => Number.isFinite(Date.parse(ts)) && Date.parse(ts) >= start && Date.parse(ts) <= end), JSON.stringify(records.map(r => r.ts)));
	// req: R-699
	check("usage records expose no request, prompt, cwd or session markers", records.length === 5 && !lines.join("\n").includes("MSGMARK") && !lines.join("\n").includes("APPMARK") && !lines.join("\n").includes("CWDMARK") && !lines.join("\n").includes(sessionId) && !lines.join("\n").includes(sessionFile), lines.join(" | "));
	// req: R-699
	check("usage lines are written to stdout only", lines.length === 5 && !stderr.includes('"event":"desk_usage"'), `stdout=${lines.length}, stderr=${stderr}`);
	// req: R-699
	check("SSE attach, entries, data, RPC and rejected requests add no usage line", beforeNegatives === 5 && afterNegatives === beforeNegatives && sseResponse.status === 200 && entriesResponse.status === 200 && dataResponse.status === 404 && rpcResponse.status >= 400 && rejectedResponse.status >= 400, `before=${beforeNegatives}, after=${afterNegatives}; statuses=${sseResponse.status}/${entriesResponse.status}/${dataResponse.status}/${rpcResponse.status}/${rejectedResponse.status}`);
} catch (error) {
	failures++;
	console.log("FAIL usage line fixture", error.stack || error);
} finally {
	server.kill("SIGTERM");
	await Promise.race([new Promise(resolve => server.once("exit", resolve)), pause(2000)]);
}
if (failures) process.exitCode = 1;
