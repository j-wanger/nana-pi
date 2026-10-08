/**
 * @module packages/nana-pack/tests/test-locked.test.mjs
 * @purpose Pin shared-machine suite locking using isolated child commands and lock directories.
 * @inputs The locked runner, temporary command fixtures, and environment overrides.
 * @outputs PASS or FAIL checks for serialization, filters, reclamation, and cleanup.
 * @effects process (spawns fixture runners), disk (temporary fixtures and lock state).
 * @errors Reports failed contract checks and exits non-zero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SCRIPT = path.join(REPO, "scripts", "test-locked.mjs");
const ROOT = tmpDir(path.join(os.tmpdir(), "locked-suite-"));
const LOCK = path.join(ROOT, "machine-lock");
const FIXTURE = path.join(ROOT, "fixture.mjs");
const events = path.join(ROOT, "events.log");
fs.writeFileSync(FIXTURE, `import fs from 'node:fs';\nconst event = (s) => fs.appendFileSync(process.env.EVENTS, s + '\\n');\nevent('start');\nevent(fs.existsSync(process.env.NANA_SUITE_LOCK_DIR) ? 'lock-start' : 'no-lock-start');\nawait new Promise(r => setTimeout(r, Number(process.env.DELAY || 250)));\nevent(fs.existsSync(process.env.NANA_SUITE_LOCK_DIR) ? 'lock-end' : 'no-lock-end');\nevent('end');\nprocess.exitCode = Number(process.env.EXIT_CODE || 0);\n`);

let failures = 0;
const check = (name, ok) => { console.log(ok ? "PASS" : "FAIL", name); if (!ok) failures++; };
const env = (extra = {}) => ({
  ...process.env,
  NANA_SUITE_LOCK_DIR: LOCK,
  NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, FIXTURE]),
  EVENTS: events,
  DELAY: "300",
  ...extra,
});
const run = (args = [], extra = {}, timeout = 10000) => spawnSync(process.execPath, [SCRIPT, ...args], {
  cwd: REPO, env: env(extra), encoding: "utf8", timeout,
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const launch = (args = [], extra = {}) => spawn(process.execPath, [SCRIPT, ...args], {
  cwd: REPO, env: env(extra), stdio: "ignore",
});
const finished = (child) => new Promise((resolve) => {
  child.once("error", () => resolve({ code: 1, signal: null }));
  child.once("exit", (code, signal) => resolve({ code, signal }));
});
const exists = () => fs.existsSync(LOCK);
const readEvents = () => fs.existsSync(events) ? fs.readFileSync(events, "utf8").trim().split(/\r?\n/).filter(Boolean) : [];

{
  fs.rmSync(LOCK, { recursive: true, force: true });
  fs.rmSync(events, { force: true });
  const first = launch();
  const firstDone = finished(first);
  await wait(70);
  const second = launch();
  const secondDone = finished(second);
  const results = await Promise.all([firstDone, secondDone]);
  const log = readEvents();
  let active = 0;
  let overlap = false;
  for (const event of log) {
    if (event === "start") { active++; if (active > 1) overlap = true; }
    else if (event === "end") active--;
  }
  // req: R-626
  check("two full suite commands do not overlap", results.every((r) => r.code === 0) && !overlap && log.filter((e) => e === "start" || e === "end").length === 4);
  // req: R-626
  check("full runs hold the lock throughout each command", log.filter((e) => e === "lock-start" || e === "lock-end").length === 4);
  // req: R-626
  check("normal full run releases its lock", !exists());
}

{
  fs.rmSync(LOCK, { recursive: true, force: true });
  const failed = run([], { DELAY: "0", EXIT_CODE: "7" });
  // req: R-626
  check("a nonzero suite exit is preserved and releases the lock", failed.status === 7 && !exists());
}

{
  fs.rmSync(LOCK, { recursive: true, force: true });
  fs.mkdirSync(LOCK, { recursive: true });
  const started = Date.now();
  const filtered = run(["needle"], { DELAY: "0" }, 1500);
  // req: R-627
  check("a filtered run starts without waiting for a held lock", filtered.status === 0 && Date.now() - started < 1200 && exists());
  fs.rmSync(LOCK, { recursive: true, force: true });
}

{
  fs.rmSync(LOCK, { recursive: true, force: true });
  fs.mkdirSync(LOCK, { recursive: true });
  fs.writeFileSync(path.join(LOCK, "pid"), "99999999\n");
  const reclaimed = run([], { DELAY: "0" });
  // req: R-626
  check("a dead holder lock is reclaimed", reclaimed.status === 0 && !exists());
  fs.mkdirSync(LOCK, { recursive: true });
  const expired = new Date(Date.now() - 61_000);
  fs.utimesSync(LOCK, expired, expired);
  const reclaimedPidless = run([], { DELAY: "0" });
  // req: R-626
  check("a pid-less lock older than one minute is reclaimed", reclaimedPidless.status === 0 && !exists());
}

if (process.platform !== "win32") {
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    fs.rmSync(LOCK, { recursive: true, force: true });
    const child = launch();
    const done = finished(child);
    await wait(120);
    child.kill(signal);
    await done;
    if (signal === "SIGINT") {
      // req: R-626
      check("SIGINT releases the full-run lock", !exists());
    } else if (signal === "SIGTERM") {
      // req: R-626
      check("SIGTERM releases the full-run lock", !exists());
    } else {
      // req: R-626
      check("SIGHUP releases the full-run lock", !exists());
    }
  }
} else {
  console.log("SKIP signal lock cleanup on native Windows");
}

if (failures) process.exitCode = 1;
