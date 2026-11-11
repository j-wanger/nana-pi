/**
 * @module packages/nana-knowledge/tests/build-busy.test.mjs
 * @purpose Prove transient SQLite contention preserves builds and recovery refuses late writers.
 * @inputs Real CLI, temporary knowledge homes, and independent SQLite lock processes.
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
import { LOCK_TTL_MS, RECLAIM_ORPHAN_MS } from "../lib/build.ts";

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
async function held(s) {
 const r = child(s, ["-e", `
 const fs = require('node:fs');
 const { DatabaseSync } = require('node:sqlite');
 const d = new DatabaseSync(process.env.NK_DB);
 d.exec('BEGIN EXCLUSIVE');
 process.stdout.write('ready');
 const poll = setInterval(() => {
  if (!fs.existsSync(process.env.NK_LOCK)) return;
  clearInterval(poll); process.stdout.write('overlap');
  setTimeout(() => { d.exec('COMMIT'); d.close(); process.exit(0); }, 500);
 }, 1);
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
  const holder = await held(s);
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
  d.exec("PRAGMA journal_mode=DELETE");
 } finally { d.close(); }
 const inode = fs.statSync(s.db).ino;
 fs.writeFileSync(path.join(s.home, "sources.json"), '{"roots":[],}');
 const holder = await held(s);
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

// req: R-4049
await check("M3: connection defaults read back", async (s) => {
 await seed(s);
 for (const [opts, expected] of [[{}, dbLib.QUERY_BUSY_TIMEOUT_MS], [{ create: true }, dbLib.BUILD_BUSY_TIMEOUT_MS]]) {
  const d = await dbLib.openDb(s.db, opts);
  try { assert.equal(d.prepare("PRAGMA busy_timeout").get().timeout, expected); } finally { d.close(); }
 }
});

// req: R-4048
await check("M3: recovery refuses a late writer without a build busy wait and keeps the index", async (s) => {
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

// req: R-4051
await check("build lock is atomic, records its pid and releases only its owner", async (s) => {
 const r = child(s, ["--input-type=module", "-e", `
 import assert from 'node:assert/strict';
 import fs from 'node:fs';
 import { acquireBuildLock, releaseBuildLock, build, BuildLockedError } from ${JSON.stringify(new URL("../lib/build.ts", import.meta.url).href)};
 const lockFile = process.env.NK_LOCK;
 const won = [acquireBuildLock(), acquireBuildLock(), acquireBuildLock()];
 assert.equal(won.filter(Boolean).length, 1);
 assert.equal(JSON.parse(fs.readFileSync(lockFile, 'utf8')).pid, process.pid);
 await assert.rejects(build(), BuildLockedError);
 fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid + 99999, at: Date.now() }));
 releaseBuildLock();
 assert.equal(fs.existsSync(lockFile), true);
 fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, at: Date.now() }));
 releaseBuildLock();
 assert.equal(fs.existsSync(lockFile), false);
 `], "");
 await r.done;
 assert.equal(r.code, 0, r.err);
});

async function deadOwner(s) {
 const r = child(s, ["-e", "process.exit(0)"], "");
 await r.done;
 assert.equal(r.code, 0, r.err);
 assert.throws(() => process.kill(r.c.pid, 0), { code: "ESRCH" });
 return r.c.pid;
}
function lockFixture(s, pid, age = 0) {
 const lock = s.env.NK_LOCK;
 fs.writeFileSync(lock, JSON.stringify({ pid, at: Date.now() - age }));
 const time = (Date.now() - age) / 1000;
 fs.utimesSync(lock, time, time);
 return lock;
}
function noLocks(s) {
 assert.equal(fs.existsSync(s.env.NK_LOCK), false);
 assert.equal(fs.existsSync(s.env.NK_LOCK + ".reclaim"), false);
}

// req: R-4053
await check("build refuses an expired lock with a live owner without touching the index", async (s) => {
 await seed(s);
 const before = fs.readFileSync(s.db);
 const lock = lockFixture(s, process.pid, LOCK_TTL_MS + 5000);
 const stat = fs.statSync(lock);
 const contents = fs.readFileSync(lock);
 const r = child(s, [cli, "build", "--rebuild"], "");
 await r.done;
 assert.equal(r.code, 0, r.err);
 assert.match(r.err, /another nana-knowledge build holds/);
 assert.deepEqual(fs.readFileSync(s.db), before);
 assert.deepEqual(fs.readFileSync(lock), contents);
 assert.equal(fs.statSync(lock).mtimeMs, stat.mtimeMs);
 assert.equal(fs.existsSync(lock + ".reclaim"), false);
});

// req: R-4054
await check("build reclaims a fresh lock with a dead owner", async (s) => {
 lockFixture(s, await deadOwner(s));
 const r = await command(s, "build");
 assert.equal(r.code, 0, r.err);
 assert.equal(r.err, "");
 assert.ok(await builtAt(s) > 0);
 noLocks(s);
});

// req: R-4055
await check("build reclaims an expired lock with a dead owner", async (s) => {
 lockFixture(s, await deadOwner(s), LOCK_TTL_MS + 5000);
 const r = await command(s, "build");
 assert.equal(r.code, 0, r.err);
 assert.equal(r.err, "");
 assert.ok(await builtAt(s) > 0);
 noLocks(s);
});

// req: R-4056
await check("build refuses a second reclaimer and leaves the stale lock alone", async (s) => {
 const lock = lockFixture(s, await deadOwner(s));
 const before = fs.readFileSync(lock);
 fs.writeFileSync(lock + ".reclaim", "");
 const r = await command(s, "build");
 assert.equal(r.code, 0, r.err);
 assert.match(r.err, /another nana-knowledge build holds/);
 assert.deepEqual(fs.readFileSync(lock), before);
 assert.equal(fs.existsSync(lock + ".reclaim"), true);
 assert.equal(fs.existsSync(s.db), false);
});

// req: R-4057
await check("build sweeps an orphan reclaim lock without granting the build lock", async (s) => {
 const lock = lockFixture(s, await deadOwner(s));
 const before = fs.readFileSync(lock);
 fs.writeFileSync(lock + ".reclaim", "");
 const time = (Date.now() - RECLAIM_ORPHAN_MS - 5000) / 1000;
 fs.utimesSync(lock + ".reclaim", time, time);
 const r = await command(s, "build");
 assert.equal(r.code, 0, r.err);
 assert.match(r.err, /another nana-knowledge build holds/);
 assert.deepEqual(fs.readFileSync(lock), before);
 assert.equal(fs.existsSync(lock + ".reclaim"), false);
 assert.equal(fs.existsSync(s.db), false);
 await seed(s);
 assert.ok(await builtAt(s) > 0);
 noLocks(s);
});

// req: R-4058
await check("16 concurrent builds reclaim one stale lock with exactly one protected worker", async (s) => {
 const lock = lockFixture(s, await deadOwner(s), LOCK_TTL_MS + 5000);
 fs.writeFileSync(s.db, "damaged index");
 const racers = Array.from({ length: 16 }, () => child(s, ["--input-type=module", "-e", `
 import { build, BuildLockedError } from ${JSON.stringify(new URL("../lib/build.ts", import.meta.url).href)};
 process.stdout.write('READY\\n');
 await new Promise(resolve => process.stdin.once('data', resolve));
 try {
  await build({ onRecoveryLocking: async () => {
   process.stdout.write('WON\\n');
   await new Promise(resolve => process.stdin.once('data', resolve));
   process.stdin.pause();
  } });
 } catch (e) {
  if (!(e instanceof BuildLockedError)) throw e;
  process.stdout.write('LOST\\n');
  process.stdin.pause();
 }
 `]));
 await waitFor(() => racers.every(r => r.out.includes("READY")));
 for (const r of racers) r.c.stdin.write("go");
 await waitFor(() => racers.every(r => /WON|LOST/.test(r.out)));
 const winners = racers.filter(r => r.out.includes("WON"));
 assert.equal(winners.length, 1);
 assert.equal(JSON.parse(fs.readFileSync(lock, "utf8")).pid, winners[0].c.pid);
 for (const r of racers) r.c.stdin.end("release");
 await Promise.all(racers.map(r => r.done));
 for (const r of racers) assert.equal(r.code, 0, r.err);
 assert.ok(await builtAt(s) > 0);
 noLocks(s);
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
