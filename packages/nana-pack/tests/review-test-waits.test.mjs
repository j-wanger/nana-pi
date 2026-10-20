/**
 * @module packages/nana-pack/tests/review-test-waits.test.mjs
 * @purpose Pins complete, bounded launch-record waits and immutable-review's behavior under delayed launches and cleanup failure.
 * @inputs launch-wait.mjs, immutable-review.test.mjs, a runtime preload and temporary folders.
 * @outputs PASS/FAIL checks and a failing process status when a check is false.
 * @effects disk (temporary preload and child roots), process (one immutable-review test child).
 * @errors failed assertions exit nonzero; an unexpected setup or process error propagates.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { awaitLaunchRecord } from "./launch-wait.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const LATE_LAUNCH_MS = 10_000; // chosen: exceeds the former five-second launch-record wait.
const RECORD_GAP_MS = 1_000; // chosen: makes a partial launch record observable without dominating the meta-run.
const META_RUN_LIMIT_MS = 270_000; // chosen: leaves 30 seconds below the runner's 300-second file limit.
const HELPER_RACE_MS = 5_000; // chosen: bounds each helper case well below the meta-run.
const PARTIAL_RECORD_CHECK_MS = 200; // chosen: long enough to show that an empty existing record stays pending.
const LIMIT_CASE_MS = 200; // chosen: keeps the launch-limit case fast while remaining above normal timer jitter.

let failures = 0;
const check = (name, ok, detail = "") => {
  console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
  if (!ok) failures++;
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const bounded = (promise) => Promise.race([
  promise,
  delay(HELPER_RACE_MS).then(() => ({ timedOut: true })),
]);

const root = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "review-test-waits-")));

const partialFile = path.join(root, "partial.pid");
fs.writeFileSync(partialFile, "");
let partialSettled = false;
const partialWait = awaitLaunchRecord(partialFile, {
  closed: new Promise(() => {}),
  isComplete: (text) => /^\d+\n$/.test(text),
}).then((value) => {
  partialSettled = true;
  return value;
});
await delay(PARTIAL_RECORD_CHECK_MS);
const stayedPending = !partialSettled;
fs.writeFileSync(partialFile, "123\n");
const partialResult = await bounded(partialWait);
// req: R-1923
check("R-1923: the launch wait returns a pid record only once it is complete",
  stayedPending && partialResult === "123\n",
  JSON.stringify({ stayedPending, partialResult }));

const closedFile = path.join(root, "closed-empty.pid");
fs.writeFileSync(closedFile, "");
const closedResult = await bounded(awaitLaunchRecord(closedFile, {
  closed: Promise.resolve(),
  isComplete: (text) => /^\d+\n$/.test(text),
}));
const limitedResult = await bounded(awaitLaunchRecord(path.join(root, "missing.pid"), {
  closed: new Promise(() => {}),
  limitMs: LIMIT_CASE_MS,
}));
// req: R-1924
check("R-1924: the launch wait returns no record when the launcher exits first or the limit passes",
  closedResult === null && limitedResult === null,
  JSON.stringify({ closedResult, limitedResult }));

const preload = path.join(root, "slow review preload.cjs");
fs.writeFileSync(preload, `const fs = require("node:fs");
const path = require("node:path");
const sleeper = new Int32Array(new SharedArrayBuffer(4));
const sleep = (ms) => Atomics.wait(sleeper, 0, 0, ms);
const lateLaunchMs = ${LATE_LAUNCH_MS};
const recordGapMs = ${RECORD_GAP_MS};
if (path.basename(process.argv[1] || "") === "pi-review.mjs" && process.env.OBSERVE_PID) sleep(lateLaunchMs);
if (process.env.OBSERVE_PID && process.env.OBSERVE) {
  const observe = path.resolve(process.env.OBSERVE);
  for (const name of ["writeFileSync", "appendFileSync"]) {
    const original = fs[name];
    fs[name] = function (file, ...args) {
      if (typeof file === "string" && path.resolve(file) === observe) sleep(recordGapMs);
      return original.call(this, file, ...args);
    };
  }
  const renameSync = fs.renameSync;
  fs.renameSync = function (from, to) {
    if (typeof to === "string" && path.resolve(to) === observe) sleep(recordGapMs);
    return renameSync.call(this, from, to);
  };
}
const rmSync = fs.rmSync;
fs.rmSync = function (target, options) {
  if (options && options.recursive && path.basename(String(target)).startsWith("immutable-review-test-")) {
    const error = new Error("busy test folder");
    error.code = "EBUSY";
    error.path = target;
    throw error;
  }
  return rmSync.call(this, target, options);
};
`);

const packageFolder = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const immutableReview = path.join(packageFolder, "tests", "immutable-review.test.mjs");
const childTmp = path.join(root, "child tmp");
fs.mkdirSync(childTmp);
const preloadOption = `--require="${preload.replaceAll("\\", "/")}"`;
const metaStart = Date.now();
const meta = spawnSync(process.execPath, [immutableReview], {
  cwd: packageFolder,
  env: {
    ...process.env,
    TMPDIR: childTmp,
    TMP: childTmp,
    TEMP: childTmp,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} ${preloadOption}`,
  },
  encoding: "utf8",
  timeout: META_RUN_LIMIT_MS,
});
const metaMs = Date.now() - metaStart;
const output = `${meta.stdout ?? ""}${meta.stderr ?? ""}`;
const pass = (title) => new RegExp(`^PASS ${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m").test(output);
const watchedPasses = [
  "dirty working state is reproduced exactly and reviewer runs in the immutable checkout",
  "pi-review appends the review standard text once after the immutable sentence",
  "pi-review records its provider, model, actual attempts and duration",
  "source commit during review does not void the admitted round",
  "temporary worktree registration is removed after success",
  "next launch reclaims a SIGKILLed dead-owner checkout but leaves live-owner worktrees alone",
];
if (process.platform !== "win32") watchedPasses.push("temporary worktree registration is removed after signal interruption");
// req: R-1920
check("R-1920: immutable-review passes every watched launch's checks when each reviewer starts late",
  watchedPasses.every(pass),
  JSON.stringify({ missing: watchedPasses.filter((title) => !pass(title)), status: meta.status, signal: meta.signal, metaMs }));
// req: R-1921
check("R-1921: immutable-review reads the full prompt when the fake reviewer pauses while writing its record",
  pass(watchedPasses[0]) && pass(watchedPasses[1]),
  JSON.stringify({ dirtyState: pass(watchedPasses[0]), reviewStandard: pass(watchedPasses[1]), status: meta.status, metaMs }));

const failLines = output.split(/\r?\n/).filter((line) => line.startsWith("FAIL "));
const cleanupLines = failLines.filter((line) => /^FAIL the test's temporary folder is removed at the end EBUSY /.test(line));
const expectedRootPrefix = path.join(childTmp, "immutable-review-test-");
const cleanupNamed = cleanupLines.length === 1 && cleanupLines[0].slice(cleanupLines[0].indexOf(" EBUSY ") + 7).startsWith(expectedRootPrefix);
// req: R-1922
check("R-1922: a busy temporary folder at immutable-review's end gives one named FAIL line, not an uncaught exception",
  cleanupNamed && !/^\s+at /m.test(output) && meta.status === failLines.length,
  JSON.stringify({ cleanupLines, failLines: failLines.length, status: meta.status, signal: meta.signal, hasStack: /^\s+at /m.test(output), expectedRootPrefix, metaMs }));

fs.rmSync(root, { recursive: true, force: true });
process.exit(failures);
