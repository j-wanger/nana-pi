/**
 * @module packages/nana-pack/tests/watchdog-cpu.test.mjs
 * @purpose Pin culture-independent watchdog CPU reads, strict sample parsing, unreadable-sample stalls, and exit-during-read handling.
 * @inputs pi-worker.mjs, pi-watchdog.mjs, worker-config.mjs, fake pi and CPU-reader executables, and temporary marker files.
 * @outputs PASS/FAIL/SKIP lines for R-1890 through R-1893 and a nonzero status when a check fails.
 * @effects disk (temporary fixtures and output files), process (pi-worker, fake pi, ps or PowerShell readers).
 * @errors failed assertions or fixture time limits print FAIL and make the test exit nonzero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PI_WORKER = path.join(packageRoot, "bin", "pi-worker.mjs");
let parseCpuSample;
let watchdogLoadError = "";
try { ({ parseCpuSample } = await import(pathToFileURL(path.join(packageRoot, "bin", "pi-watchdog.mjs")).href)); }
catch (error) { watchdogLoadError = error.message; }
let WIN_CPU_TICKS_PER_SECOND;
let configLoadError = "";
try { ({ WIN_CPU_TICKS_PER_SECOND } = await import(pathToFileURL(path.join(packageRoot, "bin", "worker-config.mjs")).href)); }
catch (error) { configLoadError = error.message; }

let failures = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) failures++; };
const root = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "watchdog-cpu-test-")));

// Every duration is named and chosen so a stuck fixture cannot hold the test file indefinitely.
const FIXTURE_HANG_BOUND_MS = 30_000; // chosen: the brief's 30-second cap is far beyond the four-poll stall case.
const FIXTURE_RELEASE_POLL_MS = 10; // chosen: prompt marker pickup without materially changing one-second polls.
const READER_EXIT_POLL_MS = 10; // chosen: prompt process-exit observation without a tight busy loop.
const READER_EXIT_WAIT_MS = 1_000; // chosen: the brief's one-second wait bounds reader observation after EXITED.
const WORKER_POLL_SECS = 1; // chosen: the brief requires one-second M1, M3 and M4 polls.
const WORKER_STALL_SECS = 3; // chosen: the brief requires a three-poll flat budget.
const M1_PI_SPIN_CAP_MS = 120_000; // chosen: the brief's cap leaves loaded Windows PowerShell ample time for four reads.
const M1_CONTROL_GUARD_MS = 30_000; // chosen: one Windows PowerShell control call should finish well inside 30 seconds.
const M1_CASE_GUARD_MS = 180_000; // chosen: the brief's guard covers four slow Windows PowerShell starts on loaded CI.
const M3_CASE_GUARD_MS = 30_000; // chosen: four one-second reads plus cleanup stay well inside 30 seconds.
const M4_CASE_GUARD_MS = 30_000; // chosen: three polls and one release read stay well inside 30 seconds.

function killTree(child) {
  if (!child?.pid) return;
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/T", "/F", "/PID", String(child.pid)], { stdio: "ignore" });
    else process.kill(-child.pid, "SIGKILL");
  } catch { /* already gone */ }
}

async function runProcess(command, args, options, limitMs, onStderr = () => {}) {
  const child = spawn(command, args, { ...options, detached: true });
  let stdout = "", stderr = "";
  child.stdout?.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
  child.stderr?.on("data", (chunk) => { stderr += chunk.toString("utf8"); onStderr(stderr); });
  return await new Promise((resolve) => {
    let settled = false;
    const finish = (result) => { if (settled) return; settled = true; clearTimeout(guard); resolve({ ...result, stdout, stderr }); };
    const guard = setTimeout(() => { killTree(child); finish({ code: null, signal: "TIMEOUT", timedOut: true }); }, limitMs);
    child.on("error", (error) => finish({ code: null, signal: null, error }));
    child.on("close", (code, signal) => finish({ code, signal, timedOut: false }));
  });
}

function installFakePi(dir) {
  const body = `const fs = require("node:fs");
const hangBoundMs = Number(process.env.FIXTURE_HANG_BOUND_MS);
const releasePollMs = Number(process.env.FIXTURE_RELEASE_POLL_MS);
if (process.env.FAKE_MODE === "hang") {
  setTimeout(() => process.exit(2), hangBoundMs);
} else if (process.env.FAKE_MODE === "release") {
  const poll = () => {
    if (!fs.existsSync(process.env.RELEASE)) { setTimeout(poll, releasePollMs); return; }
    fs.writeFileSync(process.env.EXITED, "exited\\n");
    console.log("fake pi released");
  };
  poll();
} else if (process.env.FAKE_MODE === "busy") {
  const until = Date.now() + Number(process.env.M1_PI_SPIN_CAP_MS);
  while (!fs.existsSync(process.env.RELEASE) && Date.now() < until) {}
  if (!fs.existsSync(process.env.RELEASE)) process.exit(2);
  console.log("fake pi released");
} else {
  process.exit(2);
}
`;
  if (process.platform === "win32") writeFakePi(dir, body);
  else {
    const bodyPath = path.join(dir, "fake-pi.cjs");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(bodyPath, body);
    fs.writeFileSync(path.join(dir, "pi"), `#!/bin/sh\nexec "${process.execPath}" "${bodyPath}" "$@"\n`);
    fs.chmodSync(path.join(dir, "pi"), 0o755);
  }
}

const fixtureB = path.join(root, "fixture-b");
installFakePi(fixtureB);
const readerBody = path.join(fixtureB, "cpu-reader.cjs");
fs.writeFileSync(readerBody, `const fs = require("node:fs");
const args = process.argv.slice(2);
const joined = args.join(" ");
const commandPid = /-Id\\s+(\\d+)/i.exec(joined)?.[1];
const pid = Number(commandPid || args.findLast((arg) => /^\\d+$/.test(arg)));
const counter = process.env.READER_COUNTER;
let index = 0;
try { index = Number(fs.readFileSync(counter, "utf8")); } catch {}
fs.writeFileSync(counter, String(index + 1));
const sequence = process.env.READER_SEQ.split(",");
const action = sequence[index % sequence.length];
const good = () => console.log(process.platform === "win32" ? "5000000" : "0:00.50");
const release = () => {
  fs.writeFileSync(process.env.RELEASE, "release\\n");
  while (!fs.existsSync(process.env.EXITED)) {}
  const deadline = Date.now() + Number(process.env.READER_EXIT_WAIT_MS);
  while (Date.now() < deadline) {
    try { process.kill(pid, 0); } catch { break; }
    const until = Date.now() + Number(process.env.READER_EXIT_POLL_MS);
    while (Date.now() < until) {}
  }
};
switch (action) {
  case "good": good(); break;
  case "na": console.log("n/a"); break;
  case "fail": process.exit(1); break;
  case "release-good": release(); good(); break;
  case "release-fail": release(); process.exit(1); break;
  default: process.exit(2);
}
`);
if (process.platform === "win32") {
  fs.writeFileSync(path.join(fixtureB, "powershell.cmd"), `@echo off\r\n"${process.execPath}" "${readerBody}" %*\r\nexit /b %errorlevel%\r\n`);
} else {
  fs.writeFileSync(path.join(fixtureB, "ps"), `#!/bin/sh\nexec "${process.execPath}" "${readerBody}" "$@"\n`);
  fs.chmodSync(path.join(fixtureB, "ps"), 0o755);
}

function fixtureEnv(extra = {}) {
  return {
    ...process.env,
    PATH: `${fixtureB}${path.delimiter}${process.env.PATH ?? ""}`,
    FIXTURE_HANG_BOUND_MS: String(FIXTURE_HANG_BOUND_MS),
    FIXTURE_RELEASE_POLL_MS: String(FIXTURE_RELEASE_POLL_MS),
    READER_EXIT_POLL_MS: String(READER_EXIT_POLL_MS),
    READER_EXIT_WAIT_MS: String(READER_EXIT_WAIT_MS),
    M1_PI_SPIN_CAP_MS: String(M1_PI_SPIN_CAP_MS),
    ...extra,
  };
}
const cpuLines = (stderr) => stderr.split(/\r?\n/).filter((line) => /\[pi-worker a1\] cpu=/.test(line));

// M1: the product's own win32 CPU read, wrapped in a decimal-comma Windows PowerShell culture.
if (process.platform !== "win32") {
  console.log("SKIP R-1890: on Windows a busy pi runs to its exit when PowerShell writes a decimal comma — Windows PowerShell 5.1 exists only on Windows");
} else {
  const fixtureA = path.join(root, "fixture-a");
  installFakePi(fixtureA);
  const release = path.join(root, "m1-release");
  const realPowerShell = "%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
  fs.writeFileSync(path.join(fixtureA, "powershell.cmd"), `@echo off\r\n"${realPowerShell}" -NoProfile -Command "& { [System.Threading.Thread]::CurrentThread.CurrentCulture = [System.Globalization.CultureInfo]::GetCultureInfo(1031); %~3 | Out-String }"\r\nexit /b %errorlevel%\r\n`);
  const m1Env = { ...fixtureEnv({ FAKE_MODE: "busy", RELEASE: release }), PATH: `${fixtureA}${path.delimiter}${process.env.PATH ?? ""}` };
  const control = spawnSync('powershell -NoProfile -Command "[double]1.5"', { env: m1Env, encoding: "utf8", timeout: M1_CONTROL_GUARD_MS, shell: true });
  const out = path.join(root, "m1-out.txt");
  let released = false;
  const run = await runProcess(process.execPath, [PI_WORKER, "--out", out, "--poll", String(WORKER_POLL_SECS), "--stall-secs", String(WORKER_STALL_SECS), "--", "-p", "busy"],
    { cwd: root, env: m1Env, stdio: ["ignore", "pipe", "pipe"] }, M1_CASE_GUARD_MS, (stderr) => {
      if (!released && cpuLines(stderr).length >= 4) { released = true; fs.writeFileSync(release, "release\n"); }
    });
  const lines = cpuLines(run.stderr);
  const positive = lines.length === 4 && lines.every((line) => { const match = /cpu=([\d.]+)s/.exec(line); return match && Number(match[1]) > 0; });
  // req: R-1890
  check("R-1890: on Windows a busy pi runs to its exit when PowerShell writes a decimal comma", control.status === 0 && control.stdout.trim() === "1,5" && run.code === 0 && !/STALL/.test(run.stderr) && positive,
    JSON.stringify({ control: { status: control.status, stdout: control.stdout, stderr: control.stderr }, run, lines }));
}

const parseProblems = [];
if (typeof parseCpuSample !== "function") parseProblems.push(`parseCpuSample is not exported${watchdogLoadError ? `: ${watchdogLoadError}` : ""}`);
else {
  const winExpected = typeof WIN_CPU_TICKS_PER_SECOND === "number" ? 5_000_000 / WIN_CPU_TICKS_PER_SECOND : null;
  const winCases = [["5000000", winExpected], ["5000000\r\n", winExpected], [" \t5000000\t ", winExpected]];
  if (winExpected !== null) for (const [raw, expected] of winCases) if (parseCpuSample(raw, "win32") !== expected) parseProblems.push(`win32 ${JSON.stringify(raw)} => ${parseCpuSample(raw, "win32")}`);
  for (const raw of ["0,6416708", "0.6416708", "", "-1", "1E-07"]) if (parseCpuSample(raw, "win32") !== null) parseProblems.push(`win32 rejected ${JSON.stringify(raw)} => ${parseCpuSample(raw, "win32")}`);
  const posixCases = [["0:00.03", 0.03], ["  1:05.50\n", 65.5], ["00:01:05", 65], ["01:00:00", 3600], ["1-02:03:04", 93784], ["1-00:00:01", 86401]];
  for (const [raw, expected] of posixCases) if (parseCpuSample(raw, "darwin") !== expected) parseProblems.push(`ps ${JSON.stringify(raw)} => ${parseCpuSample(raw, "darwin")}`);
  for (const raw of ["n/a", ""]) if (parseCpuSample(raw, "linux") !== null) parseProblems.push(`ps rejected ${JSON.stringify(raw)} => ${parseCpuSample(raw, "linux")}`);
}
// req: R-1891
check("R-1891: the CPU sample parser reads whole Windows ticks and ps times, and no number from comma, point or empty text", parseProblems.length === 0, parseProblems.join("; "));
// req: R-1891
check("R-1891 seal: WIN_CPU_TICKS_PER_SECOND is 10,000,000", WIN_CPU_TICKS_PER_SECOND === 10_000_000, configLoadError || String(WIN_CPU_TICKS_PER_SECOND));

async function runFixture(name, mode, sequence, limitMs) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  const counter = path.join(dir, "reader-counter");
  const release = path.join(dir, "release");
  const exited = path.join(dir, "exited");
  const out = path.join(dir, "out.txt");
  const run = await runProcess(process.execPath, [PI_WORKER, "--out", out, "--poll", String(WORKER_POLL_SECS), "--stall-secs", String(WORKER_STALL_SECS), "--", "-p", name], {
    cwd: dir,
    env: fixtureEnv({ FAKE_MODE: mode, READER_SEQ: sequence, READER_COUNTER: counter, RELEASE: release, EXITED: exited }),
    stdio: ["ignore", "pipe", "pipe"],
  }, limitMs);
  return { ...run, out, output: fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "" };
}

const m3 = await runFixture("m3", "hang", "good,na,good,fail", M3_CASE_GUARD_MS);
const m3Lines = cpuLines(m3.stderr);
// req: R-1892
check("R-1892: unreadable CPU samples print unreadable and count as flat against the last readable time", m3.code === 1 && /STALL/.test(m3.stderr) && m3Lines.length === 4 && /cpu=unreadable flat=1\/3/.test(m3Lines[1]) && /cpu=unreadable flat=3\/3/.test(m3Lines[3]) && !m3Lines.some((line) => /cpu=0s|NaN/.test(line)),
  JSON.stringify({ run: m3, lines: m3Lines }));

const m4Good = await runFixture("m4-good", "release", "good,good,good,release-good", M4_CASE_GUARD_MS);
const m4Fail = await runFixture("m4-fail", "release", "good,good,good,release-fail", M4_CASE_GUARD_MS);
const m4Result = (run) => run.code === 0 && /fake pi released/.test(run.output) && !/STALL/.test(run.stderr) && cpuLines(run.stderr).length === 3;
// req: R-1893
check("R-1893: a pi that exits during a CPU read ends by its own exit status, whether the read fails or repeats the last time", m4Result(m4Good) && m4Result(m4Fail),
  JSON.stringify({ good: { ...m4Good, lines: cpuLines(m4Good.stderr) }, fail: { ...m4Fail, lines: cpuLines(m4Fail.stderr) } }));

fs.rmSync(root, { recursive: true, force: true });
process.exit(failures ? 1 : 0);
