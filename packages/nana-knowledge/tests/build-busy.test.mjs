/**
 * @module packages/nana-knowledge/tests/build-busy.test.mjs
 * @purpose Prove transient SQLite contention preserves builds and bounded prompt pulls.
 * @inputs Real CLI, temporary knowledge homes, and independent SQLite lock and reader processes.
 * @outputs Tagged PASS/FAIL lines and a nonzero exit on failure.
 * @effects disk (OS temporary fixtures), database (fixture indexes), process (bounded children).
 * @errors Each awaited case reports errors within its deadline and ends its children in finally.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import * as dbLib from "../lib/db.ts";
import { BUDGET_MS, STALE_MS } from "../lib/hook.ts";

const cli = fileURLToPath(new URL("../bin/nana-knowledge.ts", import.meta.url));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const CASE_MS = 180_000; // chosen: ten independent 15-second rebuild windows plus startup
const CHILD_MS = 175_000; // chosen: child watchdog expires before the enclosing case
let fails = 0;

async function waitFor(test, ms = 15_000) {
 const until = Date.now() + ms;
 while (Date.now() < until) { if (test()) return; await sleep(2); }
 throw new Error("condition deadline");
}
function child(scope, args, input) {
 const c = spawn(process.execPath, args, { env: scope.env, stdio: ["pipe", "pipe", "pipe"] });
 const r = { c, out: "", err: "", start: Date.now(), code: undefined };
 c.stdout.on("data", (d) => { r.out += d; });
 c.stderr.on("data", (d) => { r.err += d; });
 c.stdin.on("error", () => {});
 r.done = new Promise((resolve) => {
  c.once("error", (e) => { r.err += e.message; resolve(r); });
  c.once("close", (code) => { r.code = code; r.ms = Date.now() - r.start; resolve(r); });
 });
 r.timer = setTimeout(() => c.kill("SIGKILL"), CHILD_MS);
 r.done.then(() => clearTimeout(r.timer));
 if (input !== undefined) c.stdin.end(input);
 scope.children.push(r);
 return r;
}
async function command(s, verb, input) {
 const r = child(s, [cli, verb], input ?? "");
 await r.done;
 return r;
}
async function builtAt(s) {
 let d;
 try {
  d = await dbLib.openDb(s.db, { busyTimeoutMs: dbLib.QUERY_BUSY_TIMEOUT_MS });
  return Number(dbLib.getMeta(d, "built_at"));
 } catch { return 0; } finally { d?.close(); }
}
async function seed(s) {
 const r = await command(s, "build");
 assert.equal(r.code, 0, r.err);
}
async function held(s, releaseMode) {
 const r = child(s, ["-e", `
 const fs = require('node:fs');
 const { DatabaseSync } = require('node:sqlite');
 const d = new DatabaseSync(process.env.NK_DB);
 d.exec('BEGIN EXCLUSIVE');
 process.stdout.write('ready');
 ${releaseMode === "barrier" ? `
 const poll = setInterval(() => {
  if (!fs.existsSync(process.env.NK_LOCK)) return;
  clearInterval(poll); process.stdout.write('overlap');
  setTimeout(() => { d.exec('COMMIT'); d.close(); process.exit(0); }, 500);
 }, 1);` : `setTimeout(() => { d.exec('ROLLBACK'); d.close(); process.exit(0); }, 3000);`}
 `]);
 await waitFor(() => r.out.includes("ready"));
 return r;
}
async function check(title, run) {
 if (process.env.NK_BUSY_ONLY && !title.startsWith(process.env.NK_BUSY_ONLY)) return;
 const home = tmpDir(path.join(os.tmpdir(), "nk-busy-"));
 const s = { home, db: path.join(home, "index.db"), children: [], env: {
  ...process.env, NANA_KNOWLEDGE_HOME: home, NANA_ROLE: "", NODE_NO_WARNINGS: "1",
  NK_DB: path.join(home, "index.db"), NK_LOCK: path.join(home, "build.lock"),
 } };
 const src = path.join(home, "src"); fs.mkdirSync(src);
 for (let i = 0; i < 30; i++) fs.writeFileSync(path.join(src, `n${i}.md`), `# Quasar telemetry ${i}\nnebula telescope horizon findings ${i}.\n`);
 fs.writeFileSync(path.join(home, "sources.json"), JSON.stringify({ roots: [{ path: src, kind: "articles" }] }));
 let timer;
 try {
  await Promise.race([run(s), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("case deadline")), CASE_MS); })]);
  console.log("PASS", title);
 } catch (e) { fails++; console.log("FAIL", title, String(e.message).replaceAll(home, "<temp>").replaceAll(fileURLToPath(new URL("../../../", import.meta.url)).replaceAll("\\", "/"), "<repo>/")); }
 finally {
  clearTimeout(timer);
  for (const r of s.children) { clearTimeout(r.timer); if (r.code === undefined) r.c.kill("SIGKILL"); }
  await Promise.all(s.children.map((r) => r.done));
  // The real hook owns a detached builder. Its lock identifies it even after hook exit.
  try { const { pid } = JSON.parse(fs.readFileSync(s.env.NK_LOCK, "utf8")); process.kill(pid, "SIGKILL"); } catch {}
  await sleep(100);
  fs.rmSync(home, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
 }
}

// req: R-3590
await check("M1: transient write locks allow existing and first builds to advance built_at", async (s) => {
 const errors = [];
 for (const existing of [true, false]) {
  if (existing) await seed(s);
  else for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(s.db + suffix, { force: true });
  const before = existing ? await builtAt(s) : 0;
  const holder = await held(s, "barrier");
  const build = child(s, [cli, "build"], "");
  await waitFor(() => holder.out.includes("overlap"));
  await build.done; await holder.done;
  try {
   assert.equal(build.code, 0, `${existing ? "existing" : "first"}: ${build.err}`);
   assert.ok(await builtAt(s) > before);
  } catch (e) { errors.push(e.message); }
 }
 assert.equal(errors.length, 0, errors.join("\n"));
});

// req: R-3590
await check("M1: sources-problem probe waits out a transient lock and keeps the index", async (s) => {
 await seed(s);
 const before = await builtAt(s);
 const d = await dbLib.openDb(s.db);
 let rows;
 try {
  rows = d.prepare("SELECT count(*) AS n FROM docs").get().n;
  // An exclusive rollback-journal writer blocks the read-only problem probe too.
  d.exec("PRAGMA journal_mode=DELETE");
 } finally { d.close(); }
 const inode = fs.statSync(s.db).ino;
 fs.writeFileSync(path.join(s.home, "sources.json"), '{"roots":[],}');
 const holder = await held(s, "barrier");
 const build = child(s, [cli, "build"], "");
 await waitFor(() => holder.out.includes("overlap"));
 await build.done; await holder.done;
 assert.equal(build.code, 0, build.err);
 assert.doesNotMatch(build.err, /busy|locked/i);
 assert.equal(fs.statSync(s.db).ino, inode);
 assert.ok(await builtAt(s) > before);
 const kept = await dbLib.openDb(s.db);
 try { assert.equal(kept.prepare("SELECT count(*) AS n FROM docs").get().n, rows); }
 finally { kept.close(); }
});

// req: R-3591
await check("M2: ten stale hook pulls and background builds survive read-write churn", async (s) => {
 await seed(s);
 const churn = child(s, ["-e", `
 const { DatabaseSync } = require('node:sqlite');
 process.stdout.write('ready');
 for (;;) { let d; try { d = new DatabaseSync(process.env.NK_DB); d.prepare('SELECT count(*) FROM docs').get(); } catch {} finally { try { d?.close(); } catch {} } }
 `]);
 await waitFor(() => churn.out.includes("ready"));
 let noPull = 0, noRebuild = 0;
 for (let i = 1; i <= 10; i++) {
  await waitFor(() => !fs.existsSync(s.env.NK_LOCK));
  let before = 0;
  const readUntil = Date.now() + 15_000;
  while (!before && Date.now() < readUntil) { before = await builtAt(s); if (!before) await sleep(10); }
  assert.ok(before > 0, `run=${i}: could not read built_at before hook`);
  const stale = (Date.now() - 2 * STALE_MS) / 1000; fs.utimesSync(s.db, stale, stale);
  const h = await command(s, "hook", JSON.stringify({ hook_event_name: "UserPromptSubmit", prompt: "quasar nebula telescope horizon findings", cwd: s.home, session_id: `churn-${i}` }));
  let after = before;
  const until = Date.now() + 15_000;
  while (Date.now() < until) {
   after = await builtAt(s);
   if (after > before && !fs.existsSync(s.env.NK_LOCK)) break;
   await sleep(100);
  }
  const pull = h.code === 0 && h.out.startsWith("[nana:knowledge]") && h.out.includes("Quasar telemetry");
  const rebuild = after > before;
  if (!pull) noPull++;
  if (!rebuild) noRebuild++;
  console.log(`NOTE M2 run=${i} ms=${h.ms} pull=${pull} rebuild=${rebuild} built_at=${before}->${after} stdoutHead=${JSON.stringify(h.out.slice(0, 60))}`);
 }
 assert.equal(noPull, 0, `noPull=${noPull}, noRebuild=${noRebuild}`);
 assert.equal(noRebuild, 0, `noPull=${noPull}, noRebuild=${noRebuild}`);
});

// req: R-3592
await check("M3: locked hook stays bounded and connection defaults read back", async (s) => {
 await seed(s);
 for (const [opts, expected] of [[{}, dbLib.QUERY_BUSY_TIMEOUT_MS], [{ create: true }, dbLib.BUILD_BUSY_TIMEOUT_MS]]) {
  const d = await dbLib.openDb(s.db, opts);
  try { assert.equal(d.prepare("PRAGMA busy_timeout").get().timeout, expected); } finally { d.close(); }
 }
 // Rollback journal makes BEGIN EXCLUSIVE exclude readers, unlike a WAL writer.
 const d = await dbLib.openDb(s.db);
 d.exec("PRAGMA journal_mode=DELETE"); d.close();
 const holder = await held(s, "timed");
 const h = await command(s, "hook", JSON.stringify({ prompt: "quasar nebula telescope horizon findings", session_id: "locked" }));
 assert.equal(h.code, 0); assert.equal(h.out, ""); assert.ok(h.ms < BUDGET_MS + 1000, `hook ms=${h.ms}`);
 await holder.done;
});

// req: R-3592
await check("M3: recovery refuses a late writer without a build busy wait and keeps the index", async (s) => {
 // The incomplete docs schema is the docs-shape damage used by recover.test.mjs.
 const { DatabaseSync } = await dbLib.loadSqlite();
 const damaged = new DatabaseSync(s.db);
 try { damaged.exec("CREATE TABLE docs(id, txt)"); } finally { damaged.close(); }
 const inode = fs.statSync(s.db).ino;
 const buildUrl = new URL("../lib/build.ts", import.meta.url).href;
 const build = child(s, ["--input-type=module", "-e", `
 import { build } from ${JSON.stringify(buildUrl)};
 let started;
 try {
  await build({ onRecoveryLocking: async () => {
   process.stdout.write('damage-found');
   await new Promise(resolve => process.stdin.once('data', resolve));
   process.stdin.pause();
   started = performance.now();
  } });
  console.log('\\nRESULT ' + JSON.stringify({ rejected: false }));
 } catch (e) {
  console.log('\\nRESULT ' + JSON.stringify({ rejected: true, busy: (e.errcode & 255) === 5 || (e.errcode & 255) === 6, ms: performance.now() - started }));
 }
 `]);
 await waitFor(() => build.out.includes("damage-found"));
 // The initial open may establish WAL; snapshot only after it has found the damage.
 const before = fs.readFileSync(s.db);
 const writer = child(s, ["-e", `
 const { DatabaseSync } = require('node:sqlite');
 const d = new DatabaseSync(process.env.NK_DB);
 d.exec('BEGIN IMMEDIATE');
 process.stdout.write('ready');
 process.stdin.resume();
 process.stdin.once('end', () => { d.exec('ROLLBACK'); d.close(); });
 `]);
 await waitFor(() => writer.out.includes("ready"));
 build.c.stdin.end("locked");
 await build.done;
 // Keep the writer through the entire attempt, even if wrong code waits all 5000 ms.
 assert.equal(writer.code, undefined, writer.err);
 assert.equal(build.code, 0, build.err);
 const result = JSON.parse(build.out.split("RESULT ")[1]);
 assert.equal(result.rejected, true);
 assert.equal(result.busy, true);
 assert.ok(result.ms < dbLib.BUILD_BUSY_TIMEOUT_MS / 2, `recovery lock ms=${result.ms}`);
 assert.equal(fs.statSync(s.db).ino, inode);
 assert.deepEqual(fs.readFileSync(s.db), before);
 writer.c.stdin.end();
 await writer.done;
});

// req: R-3593
await check("M4: seal: BUILD_BUSY_TIMEOUT_MS is 5000 ms", async () => {
 assert.equal(dbLib.BUILD_BUSY_TIMEOUT_MS, 5000);
});
// req: R-3594
await check("M4: seal: QUERY_BUSY_TIMEOUT_MS is 100 ms", async () => {
 assert.equal(dbLib.QUERY_BUSY_TIMEOUT_MS, 100);
});
process.exitCode = fails ? 1 : 0;
