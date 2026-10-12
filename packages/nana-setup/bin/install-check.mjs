#!/usr/bin/env node
/**
 * @module packages/nana-setup/bin/install-check.mjs
 * @purpose Runs the isolated install-and-hooks rehearsal.
 * @inputs Checkout and operating-system process launcher.
 * @outputs One verdict line per measured item.
 * @effects disk, process, network
 * @errors Exits nonzero when any reported item is FAIL.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn as childSpawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { runInstallCheck } from "../lib/install-check.mjs";
import { SPAWN_TIMEOUT_MS } from "../lib/install-check-config.mjs";

const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const home = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "nana-install-check-")));
const timeoutFallback = SPAWN_TIMEOUT_MS.pi;
function spawn(command, args, options = {}) {
  return new Promise((resolve) => {
    const started = performance.now();
    let stdout = ""; let stderr = ""; let settled = false;
    const cap = (current, chunk) => (current + chunk.toString()).slice(0, 10000);
    let child;
    try {
      child = childSpawn(command, args, { cwd: options.cwd, env: options.env, windowsHide: true, windowsVerbatimArguments: options.windowsVerbatimArguments, stdio: ["pipe", "pipe", "pipe"] });
      child.stdout.on("data", (chunk) => { stdout = cap(stdout, chunk); });
      child.stderr.on("data", (chunk) => { stderr = cap(stderr, chunk); });
      const timer = setTimeout(() => child.kill(), options.timeout ?? timeoutFallback);
      const finish = (result) => {
        if (settled) return;
        settled = true; clearTimeout(timer);
        resolve({ ...result, stdout, stderr, ms: Math.round(performance.now() - started) });
      };
      child.on("error", (error) => finish({ status: null, signal: null, error }));
      child.on("close", (status, signal) => finish({ status, signal, error: null }));
      if (options.input) child.stdin.end(options.input); else child.stdin.end();
    } catch (error) {
      resolve({ status: null, signal: null, stdout, stderr, error, ms: Math.round(performance.now() - started) });
    }
  });
}
const result = await runInstallCheck({ root, home, platformName: process.platform, env: process.env, spawn, now: () => new Date(), out: (line) => console.log(line) });
if (result.exitCode === 0) fs.rmSync(home, { recursive: true, force: true });
else console.error(`install-check home retained: ${home}`);
process.exitCode = result.exitCode;
