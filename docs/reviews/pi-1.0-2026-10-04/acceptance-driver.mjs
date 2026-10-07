// Drive one pi RPC session through a scripted conversation and log what happens.
// usage: node rpc-drive.mjs <cwd> <log.jsonl> <steps.json>
// steps: [{prompt:"..."} | {settle:true, timeoutMs} | {waitText:"regex", timeoutMs} | {sleep:ms}]
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const [cwd, logPath, stepsPath] = process.argv.slice(2);
const steps = JSON.parse(fs.readFileSync(stepsPath, "utf8"));
const log = fs.createWriteStream(logPath);
const t0 = Date.now();
const ts = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(6) + "s";
const knowledgeHome = fs.mkdtempSync(path.join(os.tmpdir(), "acceptance-knowledge-"));
const pi = spawn("pi", ["--mode", "rpc"], { cwd, env: { ...process.env, NANA_KNOWLEDGE_HOME: knowledgeHome }, stdio: ["pipe", "pipe", "pipe"] });
pi.stderr.on("data", (d) => log.write(JSON.stringify({ t: Date.now() - t0, stderr: String(d) }) + "\n"));
pi.once("close", () => fs.rmSync(knowledgeHome, { recursive: true, force: true }));
pi.on("error", () => {});
const send = (o) => pi.stdin.write(JSON.stringify(o) + "\n");

let settledCount = 0;
let waiters = [];
const seen = [];
const rl = readline.createInterface({ input: pi.stdout });
rl.on("line", (line) => {
  log.write(JSON.stringify({ t: Date.now() - t0, line }) + "\n");
  let e;
  try { e = JSON.parse(line); } catch { return; }
  seen.push(line);
  if (e.type === "extension_ui_request" && ["select", "confirm", "input", "editor"].includes(e.method)) {
    console.log(ts(), "UI dialog", e.method, "→ cancelled:", String(e.title ?? e.message ?? "").slice(0, 120));
    send({ type: "extension_ui_response", id: e.id, cancelled: true });
  }
  if (e.type === "agent_start") console.log(ts(), "agent_start");
  if (e.type === "agent_settled") { settledCount++; console.log(ts(), "agent_settled #" + settledCount); }
  if (e.type === "tool_execution_start") console.log(ts(), "tool", e.toolName, JSON.stringify(e.args ?? {}).slice(0, 160));
  if (e.type === "message_end" && e.message) {
    const m = e.message;
    const text = Array.isArray(m.content) ? m.content.filter((b) => b.type === "text").map((b) => b.text).join(" ") : String(m.content ?? "");
    if (m.role === "assistant" && text.trim()) console.log(ts(), "ASSISTANT:", text.replace(/\s+/g, " ").slice(0, 400));
    if (m.role === "custom" || m.customType) console.log(ts(), "CUSTOM", m.customType, text.replace(/\s+/g, " ").slice(0, 300));
    if (m.role === "user") console.log(ts(), "USER:", text.replace(/\s+/g, " ").slice(0, 160));
  }
  for (const w of [...waiters]) if (w.test(e, line)) { waiters = waiters.filter((x) => x !== w); w.resolve(true); }
});

const wait = (test, timeoutMs) => new Promise((resolve) => {
  const w = { test, resolve };
  waiters.push(w);
  setTimeout(() => { if (waiters.includes(w)) { waiters = waiters.filter((x) => x !== w); resolve(false); } }, timeoutMs);
});

const isEnd = (l) => { try { return JSON.parse(l).type === "message_end"; } catch { return false; } };
let n = 0;
for (const s of steps) {
  if (s.prompt) { console.log(ts(), ">>> prompt:", s.prompt.slice(0, 160)); send({ id: "p" + ++n, type: "prompt", message: s.prompt }); }
  else if (s.settle) {
    const target = settledCount + 1;
    const ok = await wait(() => settledCount >= target, s.timeoutMs ?? 300000);
    console.log(ts(), ok ? "settled" : "TIMEOUT waiting for settle");
  } else if (s.waitText) {
    const re = new RegExp(s.waitText);
    const already = seen.some((l) => isEnd(l) && re.test(l));
    const ok = already || await wait((e, line) => e.type === "message_end" && re.test(line), s.timeoutMs ?? 600000);
    console.log(ts(), ok ? `matched /${s.waitText}/` : `TIMEOUT waiting for /${s.waitText}/`);
  } else if (s.waitCount) {
    const re = new RegExp(s.waitCount, "g");
    const count = () => seen.filter((l) => isEnd(l)).reduce((a, l) => a + ((l.match(re) || []).length), 0);
    const ok = count() >= s.count || await wait(() => count() >= s.count, s.timeoutMs ?? 900000);
    console.log(ts(), ok ? `count /${s.waitCount}/ reached ${s.count}` : `TIMEOUT: /${s.waitCount}/ at ${count()} of ${s.count}`);
  } else if (s.sleep) await new Promise((r) => setTimeout(r, s.sleep));
}
send({ id: "state", type: "get_state" });
await wait((e) => e.type === "response" && e.id === "state", 10000);
const st = seen.map((l) => { try { return JSON.parse(l); } catch { return {}; } }).find((e) => e.type === "response" && e.id === "state");
console.log(ts(), "sessionFile:", st?.data?.sessionFile, "pid:", pi.pid);
pi.kill("SIGTERM");
setTimeout(() => process.exit(0), 1500);
