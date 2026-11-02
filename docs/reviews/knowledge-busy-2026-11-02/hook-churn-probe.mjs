// How often does the real knowledge hook miss its pull block, or its background rebuild fail,
// while another process churns read-write connections on the index? Usage: node hook-churn-probe.mjs <repo> [runs]
import { spawn, spawnSync } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [repo, runsArg = "20"] = process.argv.slice(2);
const cli = path.join(repo, "packages", "nana-knowledge", "bin", "nana-knowledge.ts");
const home = fs.mkdtempSync(path.join(os.tmpdir(), "hookchurn-"));
const src = path.join(home, "src"); fs.mkdirSync(src);
for (let i = 0; i < 30; i++) fs.writeFileSync(path.join(src, `n${i}.md`), `# Quasar telemetry ${i}\nnebula telescope horizon findings ${i}.\n`);
fs.writeFileSync(path.join(home, "sources.json"), JSON.stringify({ roots: [{ path: src, kind: "articles" }] }));
const env = { ...process.env, NANA_KNOWLEDGE_HOME: home, NODE_NO_WARNINGS: "1" };
const db = path.join(home, "index.db");
if (spawnSync(process.execPath, ["--experimental-strip-types", cli, "build"], { env }).status !== 0) throw new Error("first build failed");
const builtAt = () => { try { const d = new DatabaseSync(db, { readOnly: true }); try { d.exec("PRAGMA busy_timeout=2000"); return d.prepare("SELECT value FROM meta WHERE key='built_at'").get()?.value; } finally { d.close(); } } catch { return "busy"; } };

const churn = spawn(process.execPath, ["-e", `
const { DatabaseSync } = require("node:sqlite");
for (;;) { try { const d = new DatabaseSync(${JSON.stringify(db)}); d.prepare("SELECT count(*) FROM docs").get(); d.close(); } catch {} }
`], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 300));

let noPull = 0, noRebuild = 0; const reasons = {};
const runs = Number(runsArg);
for (let i = 0; i < runs; i++) {
 while (fs.existsSync(path.join(home, "build.lock"))) await new Promise((r) => setTimeout(r, 50));
 const stale = Date.now() / 1000 - 7200; fs.utimesSync(db, stale, stale);
 const before = builtAt();
 const input = JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "quasar nebula telescope horizon findings", cwd: home, session_id: `churn-${i}` });
 const t = Date.now();
 const h = spawnSync(process.execPath, ["--experimental-strip-types", cli, "hook"], { env, input, encoding: "utf8" });
 const ms = Date.now() - t;
 const pulled = (h.stdout || "").startsWith("[nana:knowledge]");
 if (!pulled) noPull++;
 const until = Date.now() + 15000; let after = before;
 while (Date.now() < until) { after = builtAt(); if (after !== before && after !== "busy" && !fs.existsSync(path.join(home, "build.lock"))) break; await new Promise((r) => setTimeout(r, 100)); }
 const rebuilt = after !== before && after !== "busy";
 if (!rebuilt) noRebuild++;
 const key = `${pulled ? "pull" : "NO-PULL"}/${rebuilt ? "rebuilt" : "NOT-REBUILT"}`; reasons[key] = (reasons[key] ?? 0) + 1;
 if (!pulled || !rebuilt) console.log(JSON.stringify({ run: i, ms, pulled, rebuilt, stdoutHead: (h.stdout || "").slice(0, 60) }));
}
churn.kill();
console.log(JSON.stringify({ platform: process.platform, runs, noPull, noRebuild, outcomes: reasons }));
await new Promise((r) => setTimeout(r, 300));
fs.rmSync(home, { recursive: true, force: true });
