#!/usr/bin/env node
/**
 * @module scripts/test-locked.mjs
 * @purpose Serialize unfiltered suite runs across worktrees while allowing filtered runs concurrently.
 * @inputs Filter arguments, NANA_SUITE_LOCK_DIR, and an optional fixture command override.
 * @outputs The invoked suite's exit code.
 * @effects disk (lock directory), process (spawns npm or the injected command).
 * @errors Propagates suite failures through the process exit code and reports lock errors.
 */
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

// chosen: keep the machine-wide lock in the user's private home, independent of each worktree.
const LOCK_DIR = process.env.NANA_SUITE_LOCK_DIR || path.join(os.homedir(), ".nana", "suite.lock");
const STALE_PIDLESS_MS = 60_000; // contract (design R-626): reclaim a pid-less lock only after 60 seconds
const RETRY_MS = 100; // chosen: short polling interval keeps contention responsive without busy-waiting
const FILTERS = process.argv.slice(2);
const TEST_COMMAND = process.env.NANA_SUITE_TEST_COMMAND
  ? JSON.parse(process.env.NANA_SUITE_TEST_COMMAND)
  : null;

let child = null;
let ownsLock = false;
let stopping = false;
let signalExitCode = null;
let termination = null;

function releaseLock() {
  if (!ownsLock) return;
  ownsLock = false;
  try {
    const holder = Number(fs.readFileSync(path.join(LOCK_DIR, "pid"), "utf8").trim());
    if (holder === process.pid) fs.rmSync(LOCK_DIR, { recursive: true, force: true });
  } catch {}
}

function holderIsDead() {
  const pidFile = path.join(LOCK_DIR, "pid");
  try {
    const text = fs.readFileSync(pidFile, "utf8").trim();
    if (!text) return false;
    const pid = Number(text);
    if (!Number.isInteger(pid) || pid < 1) return true;
    try {
      process.kill(pid, 0);
      return false;
    } catch (error) {
      return error?.code !== "EPERM";
    }
  } catch (error) {
    if (error?.code !== "ENOENT") return false;
    try {
      return Date.now() - fs.statSync(LOCK_DIR).mtimeMs > STALE_PIDLESS_MS;
    } catch {
      return true;
    }
  }
}

async function acquireLock() {
  fs.mkdirSync(path.dirname(LOCK_DIR), { recursive: true });
  for (;;) {
    if (stopping) throw new Error("suite run interrupted before lock acquisition");
    try {
      fs.mkdirSync(LOCK_DIR);
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (holderIsDead()) {
        const quarantine = `${LOCK_DIR}.stale-${randomUUID()}`;
        try {
          fs.renameSync(LOCK_DIR, quarantine);
          fs.rmSync(quarantine, { recursive: true, force: true });
        } catch (reclaimError) {
          if (!['ENOENT', 'EEXIST', 'ENOTEMPTY', 'EPERM'].includes(reclaimError?.code)) throw reclaimError;
        }
        continue;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
      continue;
    }

    const token = fs.statSync(LOCK_DIR);
    try {
      fs.writeFileSync(path.join(LOCK_DIR, "pid"), `${process.pid}\n`, { flag: "wx" });
      ownsLock = true;
      return;
    } catch (error) {
      try {
        const current = fs.statSync(LOCK_DIR);
        if (current.dev === token.dev && current.ino === token.ino) fs.rmSync(LOCK_DIR, { recursive: true, force: true });
      } catch {}
      throw error;
    }
  }
}

function commandSpec() {
  if (TEST_COMMAND) {
    if (!Array.isArray(TEST_COMMAND) || TEST_COMMAND.length === 0 || TEST_COMMAND.some((part) => typeof part !== "string")) {
      throw new Error("NANA_SUITE_TEST_COMMAND must be a JSON array of strings");
    }
    return { command: TEST_COMMAND[0], args: [...TEST_COMMAND.slice(1), ...FILTERS], options: {} };
  }
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  return {
    command,
    args: FILTERS.length ? ["test", "--", ...FILTERS] : ["test"],
    options: process.platform === "win32" ? { shell: true } : {},
  };
}

function runCommand() {
  const spec = commandSpec();
  return new Promise((resolve, reject) => {
    child = spawn(spec.command, spec.args, { cwd: process.cwd(), stdio: "inherit", detached: process.platform !== "win32", ...spec.options });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      child = null;
      resolve(code ?? (signal ? 128 + (os.constants?.signals?.[signal] ?? 1) : 1));
    });
  });
}

function signalChild(signal, target = child) {
  if (!target) return;
  try {
    if (process.platform !== "win32") process.kill(-target.pid, signal);
    else target.kill(signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

function terminateChild(signal) {
  if (!child) return Promise.resolve();
  const active = child;
  return new Promise((resolve) => {
    let childExited = false;
    let escalationFinished = false;
    const finish = () => { if (childExited && escalationFinished) resolve(); };
    active.once("exit", () => { childExited = true; finish(); });
    signalChild(signal, active);
    setTimeout(() => {
      signalChild("SIGKILL", active);
      escalationFinished = true;
      finish();
    }, 500);
  });
}

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    if (stopping) return;
    stopping = true;
    signalExitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 129;
    termination = terminateChild(signal);
    void termination.then(() => releaseLock());
  });
}
process.on("exit", releaseLock);

try {
  if (FILTERS.length === 0) await acquireLock();
  process.exitCode = await runCommand();
} catch (error) {
  console.error(`[test-locked] ${error.message}`);
  process.exitCode = 1;
} finally {
  if (termination) await termination;
  releaseLock();
  if (signalExitCode !== null) process.exitCode = signalExitCode;
}
