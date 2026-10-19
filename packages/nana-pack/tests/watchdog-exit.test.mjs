/**
 * @module packages/nana-pack/tests/watchdog-exit.test.mjs
 * @purpose Pins that the watchdog ends an attempt the moment pi exits, by any code or by a
 *  signal the watchdog did not send, rather than at the next poll tick or on a close listener
 *  that may have already fired.
 * @inputs bin/pi-review.mjs, bin/pi-worker.mjs, bin/pi-watchdog.mjs, a fake pi process, and
 *  temporary git repositories, worktrees and HOMEs under the OS temp directory
 * @outputs PASS/FAIL lines per check on stdout, and a non-zero exit when any check fails
 * @effects disk (temp HOME/agent dirs, git repositories, worktrees, capture files), process
 *  (spawns the launcher CLIs and the fake pi process, some of which self-terminate by signal)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected
 *  throw propagates and fails the run
 */
// watchdog-exit: R-1390 to R-1395 (must-meet WE1 to WE6). Fix: pi-watchdog.mjs's runOnce races
// each poll against the child's own 'exit'/'error' event (not only a timer), and the after-loop
// wait is that same settled promise rather than a 'close' listener attached only after a wake —
// which could be registered after 'close' had already fired for a signal-killed child, leaving
// the await unsettled forever (pi-review's exit 13). See docs/reviews/watchdog-exit-2026-10-19/.
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const bin = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin");
const PI_REVIEW = path.join(bin, "pi-review.mjs");
const PI_WORKER = path.join(bin, "pi-worker.mjs");
const real = (p) => (process.platform === "win32" ? fs.realpathSync.native(p) : fs.realpathSync(p));

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };

// ---------------------------------------------------------------------- tunables (each chosen)
// A limit is half its poll, so a full-poll wait — today's bug — fails it; see must-meet.md.
const POLL_LONG_SECS = 60; // chosen: WE1/WE2 — long enough that the 30s half-poll margin clears
// CI scheduling jitter by a wide factor while the fix's near-zero gap stays nowhere close to it.
const POLL_LONG_LIMIT_MS = 30_000; // chosen: half of POLL_LONG_SECS (the brief's bound rule).
const WE1_TIMEOUT_MS = 90_000; // chosen: brief-named spawnSync guard for WE1.
const WE2_TIMEOUT_MS = 45_000; // chosen: brief-named spawnSync guard for WE2 — well above the
// fixed-code elapsed and well below the buggy multi-poll elapsed, so a regression times out
// instead of hanging the suite, rather than racing the assertion itself.
const POLL_SHORT_SECS = 4; // chosen: WE3 — short enough to keep the between-polls case fast
// while leaving two full CPU-poll ticks before the test releases pi.
const POLL_SHORT_LIMIT_MS = 2_000; // chosen: half of POLL_SHORT_SECS.
const WE3_STALL_SECS = 100; // chosen: far longer than the case can run, so the stall killer
// never preempts the exit-on-end behaviour this case measures.
const WE3_TIMEOUT_MS = 30_000; // chosen: brief-named spawn guard for WE3.
const WE4_POLL_SECS = 1; // chosen: WE4 checks exit code and counts, not timing, so the
// shortest usable poll keeps the two-attempt review case fast.
const WE4_TIMEOUT_MS = 30_000; // chosen: two short attempts plus review-worktree setup stay
// well inside this guard.
const WE5_POLL_SECS = 1; // chosen: brief-named.
const WE5_STALL_SECS = 3; // chosen: brief-named.
const WE5_TIMEOUT_MS = 60_000; // chosen: brief-named spawnSync guard for WE5.
const WE6_POLL_SECS = 1; // chosen: WE6 checks exit code and lock state, not timing, so the
// shortest usable poll keeps each lane attempt fast.
const WE6_TIMEOUT_MS = 30_000; // chosen: one short attempt plus lane worktree setup stay well
// inside this guard.

// ---------------------------------------------------------------------- fixture plumbing
const root = real(tmpDir(path.join(os.tmpdir(), "watchdog-exit-test-")));
const agentDir = path.join(root, "agent-empty"); // PI_CODING_AGENT_DIR: empty, so lane mode's
// roster resolver reads no ambient machine config (worker-lane.test.mjs's defaultAgentDir).
fs.mkdirSync(agentDir, { recursive: true });

const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@test.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args], { cwd, encoding: "utf8" });
function makeRepo(name) {
	const dir = path.join(root, name);
	fs.mkdirSync(dir, { recursive: true });
	const init = git(dir, "init", "-q");
	if (init.status !== 0) throw new Error(init.stderr);
	fs.writeFileSync(path.join(dir, "seed"), "seed\n");
	git(dir, "add", "seed");
	git(dir, "commit", "-qm", "seed");
	return dir;
}
function makeHome(name) {
	const home = path.join(root, name);
	fs.mkdirSync(home, { recursive: true });
	return home;
}

// The fake pi: ONE Node body, every mode selected at run time by FAKE_MODE so every test shares
// it. Every mode appends a line to COUNT when COUNT is set; every mode that exits on its own
// (ok, fail, release) writes Date.now() to EXITED just before it does, so a test can measure
// from pi's own exit stamp rather than from the launcher's start (WE1/WE3).
const FAKE_PI_BODY = `const fs = require("node:fs");
if (process.env.COUNT) fs.appendFileSync(process.env.COUNT, "run\\n");
function markExited() {
  if (process.env.EXITED) fs.writeFileSync(process.env.EXITED, String(Date.now()));
}
switch (process.env.FAKE_MODE) {
  case "ok":
    markExited();
    console.log("VERDICT: LAND");
    break;
  case "fail":
    markExited();
    console.log("503 upstream");
    process.exit(1);
    break;
  case "release": {
    const poll = () => {
      if (fs.existsSync(process.env.RELEASE)) { markExited(); console.log("VERDICT: LAND"); }
      else setTimeout(poll, 50);
    };
    poll();
    break;
  }
  case "kill":
    console.log("about to be killed");
    process.kill(process.pid, "SIGKILL");
    break;
  case "hang":
    setInterval(() => {}, 0x7fffffff);
    break;
  default:
    process.exit(1);
}
`;
const stubDir = path.join(root, "stub");
fs.mkdirSync(stubDir, { recursive: true });
if (process.platform === "win32") {
	writeFakePi(stubDir, FAKE_PI_BODY);
} else {
	// POSIX: pi is a #!/bin/sh wrapper that MUST exec the Node body — a sh PARENT that merely ran
	// the body as a plain command would absorb a self-SIGKILL into its own ordinary exit (137),
	// which the watched child object would then report as a plain exitCode, not a signal; WE4 and
	// WE6 would pass on today's code even unfixed. exec replaces the shell's process image (same
	// pid), so the signal reaches the process spawn() is actually watching.
	const bodyPath = path.join(stubDir, "fake-pi-body.cjs");
	fs.writeFileSync(bodyPath, FAKE_PI_BODY);
	fs.writeFileSync(path.join(stubDir, "pi"), `#!/bin/sh\nexec "${process.execPath}" "${bodyPath}" "$@"\n`);
	fs.chmodSync(path.join(stubDir, "pi"), 0o755);
}
function envFor(home, extra = {}) {
	return { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: agentDir, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, ...extra };
}
const countLines = (file) => (fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean).length : 0);
const exitedAt = (file) => (fs.existsSync(file) ? Number(fs.readFileSync(file, "utf8").trim()) : NaN);

// ---------------------------------------------------------------------- WE1 (R-1390)
const we1Repo = makeRepo("we1-repo");
const we1Home = makeHome("we1-home");
const we1Count = path.join(root, "we1-count");
const we1Exited = path.join(root, "we1-exited");
const we1Out = path.join(root, "we1-out.md");
const we1Run = spawnSync(process.execPath, [
	PI_REVIEW, "--out", we1Out, "--item", "we1", "--poll", String(POLL_LONG_SECS), "--retries", "0", "--", "-p", "x",
], { cwd: we1Repo, encoding: "utf8", timeout: WE1_TIMEOUT_MS, env: envFor(we1Home, { FAKE_MODE: "ok", COUNT: we1Count, EXITED: we1Exited }) });
const we1ClosedAt = Date.now();
const we1Elapsed = we1ClosedAt - exitedAt(we1Exited);
// req: R-1390
check("R-1390: pi-review ends under half the poll after pi exits before the first poll",
	we1Run.status === 0 && fs.existsSync(we1Out) && /VERDICT/.test(fs.readFileSync(we1Out, "utf8")) && Number.isFinite(we1Elapsed) && we1Elapsed < POLL_LONG_LIMIT_MS,
	JSON.stringify({ status: we1Run.status, elapsedMs: we1Elapsed, stderr: we1Run.stderr }));

// ---------------------------------------------------------------------- WE2 (R-1391)
const we2Home = makeHome("we2-home");
const we2Work = path.join(root, "we2-work");
fs.mkdirSync(we2Work, { recursive: true });
const we2Count = path.join(root, "we2-count");
const we2Out = path.join(root, "we2-out.md");
const we2Started = Date.now();
const we2Run = spawnSync(process.execPath, [
	PI_WORKER, "--out", we2Out, "--poll", String(POLL_LONG_SECS), "--retries", "2", "--", "-p", "x",
], { cwd: we2Work, encoding: "utf8", timeout: WE2_TIMEOUT_MS, env: envFor(we2Home, { FAKE_MODE: "fail", COUNT: we2Count }) });
const we2Elapsed = Date.now() - we2Started;
const we2Order = ["attempt 1/3", "attempt 1 did not succeed — retrying", "attempt 2/3", "attempt 2 did not succeed — retrying", "attempt 3/3", "attempt 3 did not succeed", "FAILED after 3 attempt(s)"];
const we2Indices = we2Order.map((line) => we2Run.stderr.indexOf(line));
// req: R-1391
check("R-1391: pi-worker runs every retry in under half the poll when pi fails at once",
	we2Run.status === 1 && countLines(we2Count) === 3 && we2Elapsed < POLL_LONG_LIMIT_MS
		&& we2Indices.every((i) => i >= 0) && we2Indices.every((i, idx) => idx === 0 || i > we2Indices[idx - 1])
		&& !/cpu=/.test(we2Run.stderr),
	JSON.stringify({ status: we2Run.status, elapsedMs: we2Elapsed, countLines: countLines(we2Count), indices: we2Indices, stderr: we2Run.stderr }));

// ---------------------------------------------------------------------- WE3 (R-1392)
const we3Home = makeHome("we3-home");
const we3Work = path.join(root, "we3-work");
fs.mkdirSync(we3Work, { recursive: true });
const we3Count = path.join(root, "we3-count");
const we3Exited = path.join(root, "we3-exited");
const we3Release = path.join(root, "we3-release");
const we3Out = path.join(root, "we3-out.md");
const CPU_LINE = /^ {2}\[pi-worker a1\] cpu=[\d.]+s flat=\d+\/25$/;
const we3Child = spawn(process.execPath, [
	PI_WORKER, "--out", we3Out, "--poll", String(POLL_SHORT_SECS), "--stall-secs", String(WE3_STALL_SECS), "--", "-p", "x",
], { cwd: we3Work, env: envFor(we3Home, { FAKE_MODE: "release", COUNT: we3Count, EXITED: we3Exited, RELEASE: we3Release }) });
let we3Stderr = "";
we3Child.stderr.on("data", (chunk) => {
	we3Stderr += chunk.toString("utf8");
	const matches = we3Stderr.split(/\r?\n/).filter((line) => CPU_LINE.test(line)).length;
	if (matches >= 2 && !fs.existsSync(we3Release)) fs.writeFileSync(we3Release, "release\n");
});
let we3ClosedAt = null;
const we3Result = await new Promise((resolve) => {
	const guard = setTimeout(() => { try { we3Child.kill("SIGKILL"); } catch { /* already gone */ } resolve({ code: null, signal: "TIMEOUT" }); }, WE3_TIMEOUT_MS);
	we3Child.on("close", (code, signal) => { clearTimeout(guard); we3ClosedAt = Date.now(); resolve({ code, signal }); });
});
const we3CpuLineCount = we3Stderr.split(/\r?\n/).filter((line) => CPU_LINE.test(line)).length;
const we3Elapsed = we3ClosedAt - exitedAt(we3Exited);
// req: R-1392
check("R-1392: an attempt ends under half the poll after pi exits between polls, with no extra cpu line",
	we3Result.code === 0 && we3CpuLineCount === 2 && Number.isFinite(we3Elapsed) && we3Elapsed < POLL_SHORT_LIMIT_MS,
	JSON.stringify({ result: we3Result, cpuLines: we3CpuLineCount, elapsedMs: we3Elapsed, stderr: we3Stderr }));

// ---------------------------------------------------------------------- WE4 (R-1393), own repo+HOME
const we4Repo = makeRepo("we4-repo");
const we4Home = makeHome("we4-home");
const we4Count = path.join(root, "we4-count");
const we4Out = path.join(root, "we4-out.md");
const we4Run = spawnSync(process.execPath, [
	PI_REVIEW, "--out", we4Out, "--item", "we4", "--poll", String(WE4_POLL_SECS), "--retries", "1", "--", "-p", "x",
], { cwd: we4Repo, encoding: "utf8", timeout: WE4_TIMEOUT_MS, env: envFor(we4Home, { FAKE_MODE: "kill", COUNT: we4Count }) });
const we4Worktrees = git(we4Repo, "worktree", "list", "--porcelain").stdout;
const we4Reservations = path.join(we4Home, ".pi", "agent", "review-ledger.reservations");
const we4ReservationFiles = fs.existsSync(we4Reservations) ? fs.readdirSync(we4Reservations) : [];
// req: R-1393
check("R-1393: pi-review retries a pi killed by a signal, then removes its checkout and releases its reservation",
	we4Run.status === 1 && countLines(we4Count) === 2 && /attempt 2\/2/.test(we4Run.stderr)
		&& /FAILED after 2 attempts/.test(we4Run.stderr) && !/unsettled/.test(we4Run.stderr)
		&& !/nana-review-/.test(we4Worktrees) && we4ReservationFiles.length === 0,
	JSON.stringify({ status: we4Run.status, countLines: countLines(we4Count), stderr: we4Run.stderr, worktrees: we4Worktrees, reservationFiles: we4ReservationFiles }));

// ---------------------------------------------------------------------- WE5 (R-1394, regression guard)
const we5Home = makeHome("we5-home");
const we5Work = path.join(root, "we5-work");
fs.mkdirSync(we5Work, { recursive: true });
const we5Count = path.join(root, "we5-count");
const we5Out = path.join(root, "we5-out.md");
const we5Started = Date.now();
const we5Run = spawnSync(process.execPath, [
	PI_WORKER, "--out", we5Out, "--poll", String(WE5_POLL_SECS), "--stall-secs", String(WE5_STALL_SECS), "--", "-p", "x",
], { cwd: we5Work, encoding: "utf8", timeout: WE5_TIMEOUT_MS, env: envFor(we5Home, { FAKE_MODE: "hang", COUNT: we5Count }) });
const we5Elapsed = Date.now() - we5Started;
// req: R-1394
check("R-1394: a flat-CPU pi is stalled only after --stall-secs",
	we5Run.status === 1 && /STALL/.test(we5Run.stderr) && we5Elapsed >= WE5_STALL_SECS * 1000,
	JSON.stringify({ status: we5Run.status, elapsedMs: we5Elapsed, stderr: we5Run.stderr }));

// ---------------------------------------------------------------------- WE6 (R-1395), own repo+HOME
const we6Repo = makeRepo("we6-repo");
const we6Home = makeHome("we6-home");
const we6Lane = real((() => { const d = path.join(root, "we6-lane"); git(we6Repo, "worktree", "add", "-qb", "feat/we6lane", d); return d; })());
const we6GitDir = real(path.resolve(we6Lane, git(we6Lane, "rev-parse", "--git-dir").stdout.trim()));
const we6LockPath = path.join(we6GitDir, "nana-lane.lock");
const we6Brief = path.join(root, "we6-brief.md");
fs.writeFileSync(we6Brief, "lane brief content for watchdog-exit WE6\n");
const we6Count1 = path.join(root, "we6-count-1");
const we6Out1 = path.join(root, "we6-out-1.md");
const we6Run1 = spawnSync(process.execPath, [
	PI_WORKER, "--out", we6Out1, "--poll", String(WE6_POLL_SECS), "--lane", "we6lane", "--brief", we6Brief,
], { cwd: we6Lane, encoding: "utf8", timeout: WE6_TIMEOUT_MS, env: envFor(we6Home, { FAKE_MODE: "kill", COUNT: we6Count1 }) });
const we6LockGoneAfterFailure = !fs.existsSync(we6LockPath);
const we6Count2 = path.join(root, "we6-count-2");
const we6Out2 = path.join(root, "we6-out-2.md");
const we6Run2 = spawnSync(process.execPath, [
	PI_WORKER, "--out", we6Out2, "--poll", String(WE6_POLL_SECS), "--lane", "we6lane", "--brief", we6Brief,
], { cwd: we6Lane, encoding: "utf8", timeout: WE6_TIMEOUT_MS, env: envFor(we6Home, { FAKE_MODE: "ok", COUNT: we6Count2 }) });
// req: R-1395
check("R-1395: a pi-worker lane whose pi is killed by a signal exits 1 and frees its lane lock for the next run",
	we6Run1.status === 1 && /FAILED after 1 attempt\(s\)/.test(we6Run1.stderr) && we6LockGoneAfterFailure
		&& we6Run2.status === 0 && fs.existsSync(we6Out2) && /VERDICT/.test(fs.readFileSync(we6Out2, "utf8")),
	JSON.stringify({ run1: { status: we6Run1.status, stderr: we6Run1.stderr }, lockGone: we6LockGoneAfterFailure, run2: { status: we6Run2.status, stderr: we6Run2.stderr } }));

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
