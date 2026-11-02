// For each QUERY_BUSY_TIMEOUT_MS value: patch the scratch checkout's db.ts, then
//  (1) run the real stale-index hook N times under the M2 test's tight read-write churn, counting missed pulls;
//  (2) run the hook 3 times against a 3000 ms held exclusive lock, timing it (R-3592's budget check).
// Usage: node query-timeout-sweep.mjs <scratch repo> <runs> <t1,t2,...>
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [repo, runsArg = "50", listArg = "100,250,500,1000"] = process.argv.slice(2);
const dbTs = path.join(repo, "packages", "nana-knowledge", "lib", "db.ts");
const original = fs.readFileSync(dbTs, "utf8");
const cli = path.join(repo, "packages", "nana-knowledge", "bin", "nana-knowledge.ts");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

function freshHome() {
 const home = fs.mkdtempSync(path.join(os.tmpdir(), "qsweep-"));
 const src = path.join(home, "src"); fs.mkdirSync(src);
 for (let i = 0; i < 30; i++) fs.writeFileSync(path.join(src, `n${i}.md`), `# Quasar telemetry ${i}\nnebula telescope horizon findings ${i}.\n`);
 fs.writeFileSync(path.join(home, "sources.json"), JSON.stringify({ roots: [{ path: src, kind: "articles" }] }));
 const env = { ...process.env, NANA_KNOWLEDGE_HOME: home, NODE_NO_WARNINGS: "1" };
 if (spawnSync(process.execPath, ["--experimental-strip-types", cli, "build"], { env }).status !== 0) throw new Error("first build failed");
 return { home, env, db: path.join(home, "index.db") };
}
const hook = (env, home, sid) => {
 const t = Date.now();
 const r = spawnSync(process.execPath, ["--experimental-strip-types", cli, "hook"], { env, encoding: "utf8", timeout: 15000,
  input: JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "quasar nebula telescope horizon findings", cwd: home, session_id: sid }) });
 const pulled = (r.stdout || "").startsWith("[nana:knowledge]");
 let reason = null;
 try { const lines = fs.readFileSync(path.join(home, "pull.log"), "utf8").trim().split(/\r?\n/); reason = JSON.parse(lines.at(-1)).reason ?? null; } catch {}
 return { ms: Date.now() - t, pulled, reason };
};

try {
 for (const t of listArg.split(",").map(Number)) {
  fs.writeFileSync(dbTs, original.replace(/export const QUERY_BUSY_TIMEOUT_MS = \d+;/, `export const QUERY_BUSY_TIMEOUT_MS = ${t};`));
  // (1) churn
  const h = freshHome();
  const churn = spawn(process.execPath, ["-e", `const { DatabaseSync } = require("node:sqlite"); console.log("ready");
for (;;) { let d; try { d = new DatabaseSync(${JSON.stringify(h.db)}); d.prepare('SELECT count(*) FROM docs').get(); } catch {} finally { try { d?.close(); } catch {} } }`], { stdio: ["ignore", "pipe", "ignore"] });
  await new Promise((r) => churn.stdout.once("data", r));
  let miss = 0; const ms = []; const missReasons = {};
  for (let i = 0; i < Number(runsArg); i++) {
   const until = Date.now() + 15000;
   while (fs.existsSync(path.join(h.home, "build.lock")) && Date.now() < until) await sleep(50);
   const stale = Date.now() / 1000 - 7200; fs.utimesSync(h.db, stale, stale);
   const r = hook(h.env, h.home, `s${t}-${i}`); ms.push(r.ms); if (!r.pulled) { miss++; missReasons[r.reason] = (missReasons[r.reason] ?? 0) + 1; }
  }
  churn.kill(); await sleep(300);
  // (2) held exclusive lock
  const locked = [];
  for (let j = 0; j < 3; j++) {
   const holder = spawn(process.execPath, ["-e", `const { DatabaseSync } = require("node:sqlite"); const d = new DatabaseSync(${JSON.stringify(h.db)}); d.exec("BEGIN EXCLUSIVE"); console.log("held"); setTimeout(() => { d.exec("ROLLBACK"); d.close(); }, 3000);`], { stdio: ["ignore", "pipe", "ignore"] });
   await new Promise((r) => holder.stdout.once("data", r));
   const r = hook(h.env, h.home, `lock${t}-${j}`); locked.push(`${r.ms}ms ${r.pulled ? "pulled" : r.reason}`);
   await new Promise((r) => holder.once("exit", r));
  }
  ms.sort((a, b) => a - b);
  const row = { queryTimeoutMs: t, runs: Number(runsArg), missedPulls: miss, missReasons, hookMsP50: ms[Math.floor(ms.length / 2)], hookMsMax: ms.at(-1), heldLockHookMs: locked };
  results.push(row); console.log(JSON.stringify(row));
  await sleep(500); fs.rmSync(h.home, { recursive: true, force: true });
 }
} finally { fs.writeFileSync(dbTs, original); }
console.log(JSON.stringify({ platform: process.platform, node: process.version, cpus: os.cpus().length, load: process.env.SWEEP_LOAD ?? "none", results }));
