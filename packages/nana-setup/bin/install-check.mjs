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
import { createSpawnAdapter, runInstallCheck } from "../lib/install-check.mjs";

const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const home = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), "nana-install-check-")));
const spawn = createSpawnAdapter(childSpawn);
const result = await runInstallCheck({ root, home, platformName: process.platform, env: process.env, spawn, now: () => new Date(), out: (line) => console.log(line) });
if (result.exitCode === 0) fs.rmSync(home, { recursive: true, force: true });
else console.error(`install-check home retained: ${home}`);
process.exitCode = result.exitCode;
