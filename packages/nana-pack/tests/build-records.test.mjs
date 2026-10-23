/**
 * @module packages/nana-pack/tests/build-records.test.mjs
 * @purpose Pin lane build start/end records, pi session usage, best-effort ledger writes, and the worker's closing line.
 * @inputs pi-worker, build-record modules, installed pi SessionManager, and temporary git worktrees and fake pi launchers.
 * @outputs Five requirement-tagged PASS/FAIL checks.
 * @effects disk (OS-temp fixtures), process (git and bounded worker children).
 * @errors Failed checks print their title and make the process exit nonzero.
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
	BUILD_LEDGER_READ_MAX_BYTES,
	BUILD_RECORD_LINE_PREFIX,
	BUILD_RECORD_SCHEMA,
	BUILD_RECORDS_SUBPATH,
	BUILD_SESSION_READ_MAX_BYTES,
} from "../lib/build-records-config.mjs";
import { collectBuildUsage, readBuildLedger, renderLaneLine } from "../lib/build-records.mjs";
import { findPiRoot } from "./pi-install.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const WORKER = path.join(ROOT, "bin", "pi-worker.mjs");
const REPORT = path.join(ROOT, "bin", "build-report.mjs");
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "build-records-test-")));
const HOME = path.join(TD, "home");
const AGENT = path.join(HOME, ".pi", "agent");
const REPO = path.join(TD, "repo");
const LANE = path.join(TD, "lane");
const STUB = path.join(TD, "stub");
const SPAWNED = path.join(TD, "spawned");
const SNAPSHOT = path.join(TD, "ledger-snapshot");
const SESSION_MARKER = path.join(TD, "session-dir");
const CHILD_PID = path.join(TD, "child-pid");
const WORKER_PID = path.join(TD, "worker-pid");
const PI_ROOT = findPiRoot().root;
const PI_ENTRY = path.join(PI_ROOT, JSON.parse(fs.readFileSync(path.join(PI_ROOT, "package.json"), "utf8")).exports?.["."]?.import ?? "dist/index.js");
const CASE_LIMIT_MS = 30_000;
const real = (value) => process.platform === "win32" ? fs.realpathSync.native(value) : fs.realpathSync(value);
const git = (cwd, ...args) => {
	const result = spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args], { cwd, encoding: "utf8" });
	if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
	return result.stdout.trim();
};
fs.mkdirSync(HOME, { recursive: true });
fs.mkdirSync(REPO, { recursive: true });
fs.mkdirSync(STUB, { recursive: true });
git(REPO, "init", "-q", "-b", "main");
fs.writeFileSync(path.join(REPO, "seed"), "seed\n");
git(REPO, "add", "seed");
git(REPO, "commit", "-qm", "seed");
git(REPO, "worktree", "add", "-q", "-b", "feat/alpha", LANE);
const COMMON = real(path.resolve(LANE, git(LANE, "rev-parse", "--git-common-dir")));
const GIT_DIR = real(path.resolve(LANE, git(LANE, "rev-parse", "--git-dir")));
const LEDGER = path.join(COMMON, ...BUILD_RECORDS_SUBPATH.split("/"));
const LOCK = path.join(GIT_DIR, "nana-lane.lock");
const INSIDE_BRIEF = path.join(LANE, "brief.md");
const OUTSIDE_BRIEF = path.join(TD, "outside-brief.md");
const BRIEF_TEXT = "Feature: FEAT-006 · Build records\r\n\r\nPrecedent:\r\n- seed \t";
fs.writeFileSync(INSIDE_BRIEF, BRIEF_TEXT);
fs.writeFileSync(OUTSIDE_BRIEF, BRIEF_TEXT);

const usage = (n) => ({
	input: n, output: n * 2, cacheRead: n * 3, cacheWrite: n * 4,
	cacheWrite1h: n * 5, reasoning: n * 6, totalTokens: n * 7,
	cost: { input: n / 1024, output: n * 2 / 1024, cacheRead: n * 3 / 1024, cacheWrite: n * 4 / 1024, total: n * 10 / 1024 },
});
const usageValues = [1, 2, 4, 8, 16, 32];
const expectedUsage = usageValues.reduce((acc, n) => {
	const next = usage(n);
	for (const key of ["input", "output", "cacheRead", "cacheWrite", "cacheWrite1h", "reasoning", "totalTokens"]) acc[key] += next[key];
	for (const key of ["input", "output", "cacheRead", "cacheWrite", "total"]) acc.cost[key] += next.cost[key];
	return acc;
}, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0, reasoning: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } });

const STUB_BODY = `const fs = require("node:fs");
const path = require("node:path");
(async () => {
  fs.appendFileSync(process.env.BR_SPAWNED, "spawned\\n");
  fs.writeFileSync(process.env.BR_WORKER_PID, String(process.ppid));
  if (process.env.BR_SNAPSHOT && fs.existsSync(process.env.BR_LEDGER)) fs.copyFileSync(process.env.BR_LEDGER, process.env.BR_SNAPSHOT);
  if (process.env.BR_SWAP_LEDGER) { try { fs.rmSync(process.env.BR_LEDGER, { force: true }); } catch {} fs.mkdirSync(process.env.BR_LEDGER, { recursive: true }); }
  if (process.env.BR_MODE === "sleep") { fs.writeFileSync(process.env.BR_CHILD_PID, String(process.pid)); setInterval(() => {}, 100000); return; }
  if (process.env.BR_MODE !== "no-session") {
    const { SessionManager } = await import(${JSON.stringify(pathToFileURL(PI_ENTRY).href)});
    const custom = process.env.PI_CODING_AGENT_SESSION_DIR || undefined;
    const manager = SessionManager.create(process.cwd(), custom);
    const args = process.argv.slice(2); const at = args.indexOf("--name"); const name = at >= 0 ? args[at + 1] : "missing";
    manager.appendSessionInfo(name);
    const user = manager.appendMessage({ role: "user", content: [{ type: "text", text: "fixture" }], timestamp: Date.now() });
    manager.appendMessage({ role: "assistant", content: [{ type: "text", text: "a1" }], provider: "p", model: "m", usage: ${JSON.stringify(usage(1))}, stopReason: "stop", timestamp: Date.now() });
    manager.appendMessage({ role: "assistant", content: [{ type: "text", text: "a2" }], provider: "p", model: "m", usage: ${JSON.stringify(usage(2))}, stopReason: "stop", timestamp: Date.now() });
    manager.appendMessage({ role: "toolResult", toolCallId: "t", toolName: "t", content: [], isError: false, usage: ${JSON.stringify(usage(4))}, timestamp: Date.now() });
    manager.appendUsage("cache_warm", "p", "m", ${JSON.stringify(usage(8))});
    manager.appendCompaction("summary", user, 1, {}, false, ${JSON.stringify(usage(16))});
    manager.branchWithSummary(null, "branch", {}, false, ${JSON.stringify(usage(32))});
    fs.appendFileSync(manager.getSessionFile(), "{torn");
    fs.writeFileSync(process.env.BR_SESSION_MARKER, manager.getSessionDir());
    if (process.env.BR_DISTRACTORS) {
      const review = SessionManager.create(process.cwd(), custom); review.appendSessionInfo("pi-review-a1-current"); review.appendMessage({ role: "user", content: [{ type: "text", text: "review" }], timestamp: Date.now() }); review.appendMessage({ role: "assistant", content: [], provider: "p", model: "m", usage: ${JSON.stringify(usage(128))}, stopReason: "stop", timestamp: Date.now() });
      const other = SessionManager.create(process.env.BR_OTHER_CWD, custom); other.appendSessionInfo("pi-worker-a1-other"); other.appendMessage({ role: "user", content: [{ type: "text", text: "other" }], timestamp: Date.now() }); other.appendMessage({ role: "assistant", content: [], provider: "p", model: "m", usage: ${JSON.stringify(usage(256))}, stopReason: "stop", timestamp: Date.now() });
    }
  }
  if (process.env.BR_MODE === "commit") { fs.writeFileSync(path.join(process.cwd(), "built"), "built\\n"); require("node:child_process").spawnSync("git", ["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","add","built"], { cwd: process.cwd() }); require("node:child_process").spawnSync("git", ["-c","user.name=Fixture","-c","user.email=fixture@example.invalid","commit","-qm","built"], { cwd: process.cwd() }); }
  console.log("worker output");
  if (process.env.BR_MODE === "fail") process.exit(1);
})().catch((error) => { console.error(error.stack || error); process.exit(2); });
`;
if (process.platform === "win32") writeFakePi(STUB, STUB_BODY);
else {
	const body = path.join(STUB, "body.cjs");
	fs.writeFileSync(body, STUB_BODY);
	fs.writeFileSync(path.join(STUB, "pi"), `#!/bin/sh\nexec "${process.execPath}" "${body}" "$@"\n`, { mode: 0o755 });
}

const baseEnv = () => {
	const env = { ...process.env, HOME, USERPROFILE: HOME, PI_CODING_AGENT_DIR: AGENT, PATH: `${STUB}${path.delimiter}${process.env.PATH ?? ""}`, BR_SPAWNED: SPAWNED, BR_LEDGER: LEDGER, BR_SNAPSHOT: SNAPSHOT, BR_SESSION_MARKER: SESSION_MARKER, BR_CHILD_PID: CHILD_PID, BR_WORKER_PID: WORKER_PID };
	delete env.PI_CODING_AGENT_SESSION_DIR;
	delete env.BR_SWAP_LEDGER;
	return env;
};
let outNumber = 0;
function workerArgs(brief = INSIDE_BRIEF, extra = [], outPath = null) {
	const output = outPath ?? path.join(TD, `out-${++outNumber}.md`);
	return [WORKER, "--poll", "0.1", "--stall-secs", "20", "--out", output, "--lane", "alpha", "--brief", brief, ...extra];
}
function runWorker({ brief = INSIDE_BRIEF, extra = [], env = {}, timeout = CASE_LIMIT_MS, outPath = null, cwd = LANE } = {}) {
	return spawnSync(process.execPath, workerArgs(brief, extra, outPath), { cwd, env: { ...baseEnv(), ...env }, encoding: "utf8", timeout });
}
function lines() {
	if (!fs.existsSync(LEDGER) || !fs.statSync(LEDGER).isFile()) return [];
	return fs.readFileSync(LEDGER, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}
function resetRecords() {
	fs.rmSync(path.dirname(LEDGER), { recursive: true, force: true });
	fs.rmSync(SPAWNED, { force: true }); fs.rmSync(SNAPSHOT, { force: true }); fs.rmSync(SESSION_MARKER, { force: true }); fs.rmSync(CHILD_PID, { force: true }); fs.rmSync(WORKER_PID, { force: true }); fs.rmSync(LOCK, { force: true });
}
async function waitFor(file, child, limit = 10_000) {
	const deadline = Date.now() + limit;
	while (!fs.existsSync(file) && Date.now() < deadline && child.exitCode === null) await new Promise((resolve) => setTimeout(resolve, 25));
	return fs.existsSync(file);
}
async function waitChild(child, limit = CASE_LIMIT_MS) {
	return await Promise.race([
		new Promise((resolve) => child.once("close", (code, signal) => resolve({ code, signal }))),
		new Promise((resolve) => setTimeout(() => { try { child.kill("SIGKILL"); } catch {} resolve({ code: null, signal: "TIMEOUT" }); }, limit)),
	]);
}
let failures = 0;
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) failures++; };

resetRecords();
const largerAgent = path.join(TD, "larger-agent"); fs.mkdirSync(largerAgent, { recursive: true });
fs.writeFileSync(path.join(largerAgent, "nana-pack.json"), JSON.stringify({ roster: { scout: null, builder: { provider: "small-p", model: "small-m", thinking: null }, largerBuilder: { provider: "large-p", model: "large-m", thinking: "medium" }, reviewer: { provider: "r", model: "rm", thinking: null }, land: null } }));
const startRun = runWorker({ brief: INSIDE_BRIEF, extra: ["--lane-size", "larger"], env: { PI_CODING_AGENT_DIR: largerAgent } });
const first = lines();
const snapshot = fs.existsSync(SNAPSHOT) ? fs.readFileSync(SNAPSHOT, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
const start = first.find((row) => row.kind === "start");
const startTip = git(LANE, "rev-parse", "HEAD");
const sessionDir = fs.existsSync(SESSION_MARKER) ? fs.readFileSync(SESSION_MARKER, "utf8") : "";
const insideRelative = "brief.md";
const firstOk = startRun.status === 0 && snapshot.length === 1 && snapshot[0].kind === "start" && start?.v === BUILD_RECORD_SCHEMA && typeof start.build === "string" && start.build.length > 20 && start.lane === "alpha" && start.brief === insideRelative && start.feature === "FEAT-006" && start.tip === startTip && /^[0-9a-f]{40}$/.test(start.tip) && Number.isFinite(Date.parse(start.startedAt)) && start.pid === Number(fs.readFileSync(WORKER_PID, "utf8")) && start.lock === LOCK && start.laneSize === "larger" && start.slot === "largerBuilder" && start.provider === "large-p" && start.model === "large-m" && start.thinking === "medium";
const firstFieldsOk = start?.cwd === LANE && start?.sessionDir === sessionDir && start?.out?.endsWith(`out-${outNumber}.md`);
resetRecords();
const outsideRun = runWorker({ brief: OUTSIDE_BRIEF });
const outsideStart = lines().find((row) => row.kind === "start");
const defaultSlotOk = outsideRun.status === 0 && outsideStart?.brief === real(OUTSIDE_BRIEF) && outsideStart?.slot === "builder" && outsideStart?.provider === "openai-codex" && outsideStart?.model === "gpt-6-luna" && outsideStart?.thinking === "high";
const beforeRefusals = fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, "utf8") : "";
fs.writeFileSync(LOCK, "999999999\n");
const lockRefused = runWorker();
fs.rmSync(LOCK, { force: true });
const badBrief = path.join(TD, "bad-brief.md"); fs.writeFileSync(badBrief, "Feature: FEAT-006 · Bad\n");
const precedentRefused = runWorker({ brief: badBrief });
const refusalOk = lockRefused.status === 1 && precedentRefused.status === 1 && fs.readFileSync(LEDGER, "utf8") === beforeRefusals;
const noHomeRecord = !fs.readdirSync(HOME, { recursive: true }).some((entry) => String(entry).endsWith("build-records.jsonl"));
// req: R-2596
check("R-2596: a lane build appends one start record under the clone's git folder before pi starts", Boolean(firstOk && firstFieldsOk && defaultSlotOk && refusalOk && noHomeRecord), JSON.stringify({ firstOk, firstFieldsOk, defaultSlotOk, refusalOk, noHomeRecord, startTip, lane: LANE, startRun: startRun.status, start, snapshot, sessionDir, outsideStart, lock: lockRefused.stderr, precedent: precedentRefused.stderr }));

resetRecords();
const okRun = runWorker({ env: { BR_MODE: "commit" } });
const failRun = runWorker({ env: { BR_MODE: "fail" } });
const ceilingRun = runWorker({ extra: ["--max-secs", "1"], env: { BR_MODE: "sleep" }, timeout: CASE_LIMIT_MS });
let stoppedOk = true, stopDetail = "skipped on win32";
if (process.platform !== "win32") {
	fs.rmSync(SPAWNED, { force: true });
	const args = workerArgs(INSIDE_BRIEF);
	const child = spawn(process.execPath, args, { cwd: LANE, env: { ...baseEnv(), BR_MODE: "sleep" }, stdio: ["ignore", "ignore", "pipe"] });
	let stderr = ""; child.stderr.on("data", (chunk) => { stderr += chunk; });
	const started = await waitFor(SPAWNED, child); if (started) child.kill("SIGTERM");
	const result = await waitChild(child);
	const pairs = lines(); const end = pairs.filter((row) => row.kind === "end").at(-1); const begin = pairs.find((row) => row.build === end?.build && row.kind === "start");
	stoppedOk = started && result.code === 143 && end?.outcome === "stopped" && end.signal === "SIGTERM" && end.exit === 143 && end.attempts === 1 && end.durationMs === Date.parse(end.endedAt) - Date.parse(begin.startedAt);
	stopDetail = JSON.stringify({ result, end, stderr });
}
const missingOutput = path.join(TD, "missing-output-parent", "out.md");
const outputRun = runWorker({ outPath: missingOutput });
const records = lines();
const starts = new Map(records.filter((row) => row.kind === "start").map((row) => [row.build, row]));
const ends = records.filter((row) => row.kind === "end");
const outcome = (name) => ends.find((row) => row.outcome === name);
const okEnd = outcome("ok"), failEnd = outcome("failed"), ceilingEnd = outcome("ceiling");
const outputEnd = ends.find((row) => row.outputError !== null);
const endShape = ends.every((end) => starts.has(end.build) && end.attempts === 1 && end.durationMs === Date.parse(end.endedAt) - Date.parse(starts.get(end.build).startedAt) && (end.tip === null || /^[0-9a-f]{40}$/.test(end.tip)));
// req: R-2597
check("R-2597: a lane build that succeeds, fails, reaches the ceiling or is stopped appends one end record naming its start", okRun.status === 0 && failRun.status === 1 && ceilingRun.status === 1 && outputRun.status === 1 && outputEnd?.outcome === "failed" && /ENOENT/.test(outputEnd.outputError) && okEnd?.exit === 0 && okEnd.tip !== starts.get(okEnd.build)?.tip && failEnd?.exit === 1 && ceilingEnd?.exit === 1 && ceilingEnd.durationMs >= 1000 && endShape && stoppedOk, JSON.stringify({ ok: okRun.stderr, fail: failRun.stderr, ceiling: ceilingRun.stderr, ends, stopDetail }));

resetRecords();
const usageRun = runWorker({ env: { BR_DISTRACTORS: "1", BR_OTHER_CWD: REPO } });
const usageEnd = lines().find((row) => row.kind === "end");
const usageExact = usageRun.status === 0 && JSON.stringify(usageEnd?.usage) === JSON.stringify(expectedUsage) && usageEnd?.cost === expectedUsage.cost.total && usageEnd?.sessionBadLines === 1 && usageEnd?.sessions?.length === 1;
const flat = path.join(HOME, "flat-sessions");
resetRecords(); fs.mkdirSync(flat, { recursive: true });
const flatRun = runWorker({ env: { PI_CODING_AGENT_SESSION_DIR: "~/flat-sessions", BR_DISTRACTORS: "1", BR_OTHER_CWD: REPO } });
const flatStart = lines().find((row) => row.kind === "start"), flatEnd = lines().find((row) => row.kind === "end");
const flatOk = flatRun.status === 0 && flatStart?.sessionDir === flat && flatEnd?.cost === expectedUsage.cost.total;
resetRecords();
const noSessionRun = runWorker({ env: { BR_MODE: "no-session" } });
const noSessionEnd = lines().find((row) => row.kind === "end");
const noSessionOk = noSessionRun.status === 0 && noSessionEnd?.cost === null && noSessionEnd?.costReason?.includes(noSessionEnd ? lines().find((row) => row.kind === "start")?.sessionDir : "never");
let shortPathOk = true, shortPathDetail = "not run outside win32";
if (process.platform === "win32") {
	const shortPathProbe = spawnSync("powershell", ["-NoProfile", "-Command", `(New-Object -ComObject Scripting.FileSystemObject).GetFolder('${LANE}').ShortPath`], { encoding: "utf8" });
	const shortPath = shortPathProbe.status === 0 ? shortPathProbe.stdout.trim() : null;
	if (!shortPath || shortPath.toLowerCase() === LANE.toLowerCase()) {
		console.log("SKIP short-path build: this volume keeps no 8.3 short name");
	} else {
		resetRecords();
		const shortRun = runWorker({ cwd: shortPath });
		const shortStart = lines().find((row) => row.kind === "start");
		const shortEnd = lines().find((row) => row.kind === "end");
		const writtenSessionDir = fs.existsSync(SESSION_MARKER) ? fs.readFileSync(SESSION_MARKER, "utf8") : "";
		shortPathOk = shortRun.status === 0 && shortStart?.sessionDir === writtenSessionDir && shortEnd?.cost === expectedUsage.cost.total && shortEnd?.sessions?.length === 1 && fs.existsSync(path.join(writtenSessionDir, shortEnd.sessions[0]));
		shortPathDetail = JSON.stringify({ shortPath, shortRun: shortRun.status, shortStart, shortEnd, writtenSessionDir });
	}
}
const libDir = path.join(TD, "lib-sessions"); fs.mkdirSync(libDir, { recursive: true });
const libStarted = new Date(Date.now() - 1000).toISOString();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const review = path.join(libDir, `${stamp}_review.jsonl`);
const matching = path.join(libDir, `${stamp}_matching.jsonl`);
const matchingText = `${JSON.stringify({ type: "session", cwd: LANE, timestamp: new Date().toISOString() })}\n${JSON.stringify({ type: "session_info", name: "pi-worker-a1-match" })}\n${JSON.stringify({ type: "usage", usage: usage(1), timestamp: new Date().toISOString() })}\n`;
const matchingBytes = Buffer.byteLength(matchingText);
const reviewText = `${JSON.stringify({ type: "session", cwd: LANE, timestamp: new Date().toISOString() })}\n${JSON.stringify({ type: "session_info", name: "pi-review-a1-large" })}\n${"x".repeat(matchingBytes + 2048)}`;
fs.writeFileSync(review, reviewText);
fs.writeFileSync(matching, matchingText);
const ignoresLargeReview = collectBuildUsage({ sessionDir: libDir, cwd: LANE, startedAt: libStarted }, { sessionReadMaxBytes: matchingBytes });
fs.rmSync(review); fs.rmSync(matching);
const huge = path.join(libDir, `${new Date().toISOString().replace(/[:.]/g, "-")}_huge.jsonl`);
fs.writeFileSync(huge, `${JSON.stringify({ type: "session", cwd: LANE, timestamp: new Date().toISOString() })}\n${JSON.stringify({ type: "session_info", name: "pi-worker-a1-huge" })}\n${"x".repeat(2048)}`);
const tiny = collectBuildUsage({ sessionDir: libDir, cwd: LANE, startedAt: libStarted }, { sessionReadMaxBytes: 64 });
fs.rmSync(huge); fs.mkdirSync(huge);
const folderFile = collectBuildUsage({ sessionDir: libDir, cwd: LANE, startedAt: new Date(Date.now() - 1000).toISOString() });
const libFailures = ignoresLargeReview.cost === usage(1).cost.total && ignoresLargeReview.sessions.length === 1 && tiny.cost === null && tiny.costReason.includes(libDir) && folderFile.cost === null && folderFile.costReason.includes(libDir);
// req: R-2598
check("R-2598: the end record sums every usage pi wrote in the build's session file, or names why the cost is unknown", usageExact && flatOk && noSessionOk && shortPathOk && libFailures, JSON.stringify({ usageEnd, expectedUsage, flatStart, flatEnd, noSessionEnd, shortPathDetail, tiny, folderFile }));

resetRecords();
fs.mkdirSync(COMMON, { recursive: true }); fs.writeFileSync(path.dirname(LEDGER), "blocker");
const blockedPass = runWorker();
const blockedFail = runWorker({ env: { BR_MODE: "fail" } });
const blockedLines = [blockedPass, blockedFail].map((result) => result.stderr.split(/\r?\n/).filter((line) => line.startsWith(BUILD_RECORD_LINE_PREFIX)));
const startFailureOk = blockedPass.status === 0 && blockedFail.status === 1 && blockedLines.every((found) => found.length === 1 && found[0].includes(LEDGER) && /EEXIST|ENOTDIR/.test(found[0])) && fs.existsSync(SPAWNED);
fs.rmSync(path.dirname(LEDGER), { force: true });
const writable = runWorker();
const writableOut = fs.readFileSync(path.join(TD, `out-${outNumber}.md`), "utf8");
resetRecords();
const endBlocked = runWorker({ env: { BR_SWAP_LEDGER: "1" } });
const endBlockedLines = endBlocked.stderr.split(/\r?\n/).filter((line) => line.startsWith(BUILD_RECORD_LINE_PREFIX));
const endFailureOk = endBlocked.status === writable.status && endBlockedLines.length === 1 && endBlockedLines[0].includes("not kept") && endBlockedLines[0].includes(LEDGER) && endBlockedLines[0].includes("EISDIR") && fs.readFileSync(path.join(TD, `out-${outNumber}.md`), "utf8") === writableOut;
// req: R-2599
check("R-2599: an unwritable build ledger leaves the build's launch and exit code unchanged and names why in one line", startFailureOk && endFailureOk, JSON.stringify({ blockedPass: blockedPass.stderr, blockedFail: blockedFail.stderr, writable: writable.status, endBlocked: endBlocked.stderr }));

resetRecords();
const seedStart = { v: BUILD_RECORD_SCHEMA, kind: "start", build: "old-ok", lane: "alpha", startedAt: new Date(Date.now() - 120_000).toISOString(), cwd: LANE, sessionDir: path.join(TD, "none"), pid: 1 };
const seedEnd = { v: BUILD_RECORD_SCHEMA, kind: "end", build: "old-ok", endedAt: new Date(Date.now() - 60_000).toISOString(), durationMs: 60_000, attempts: 1, exit: 0, outcome: "ok", signal: null, usage: expectedUsage, cost: expectedUsage.cost.total, costReason: null, sessions: [], sessionBadLines: 0 };
const noEnd = { ...seedStart, build: "old-no-end", startedAt: new Date(Date.now() - 30_000).toISOString() };
const beta = { ...seedStart, build: "beta", lane: "beta", startedAt: new Date(Date.now() - 20_000).toISOString() };
const betaEnd = { ...seedEnd, build: "beta", durationMs: 1000, outcome: "failed", exit: 1 };
fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
fs.writeFileSync(LEDGER, [seedStart, seedEnd, noEnd, beta, betaEnd].map((row) => JSON.stringify(row)).join("\n") + "\n");
const lineRun = runWorker();
const lastLine = lineRun.stderr.trimEnd().split(/\r?\n/).at(-1);
const report = spawnSync(process.execPath, [REPORT, "--repo", LANE, "--lane", "alpha"], { encoding: "utf8" });
const alphaLine = report.stdout.trimEnd().split(/\r?\n/).find((line) => line.startsWith("lane alpha"));
const workerEnd = lines().filter((row) => row.kind === "end").at(-1);
const literal = renderLaneLine(readBuildLedger(LEDGER).records, "alpha");
// req: R-2602
check("R-2602: the last stderr line names this build's outcome, minutes and cost and its lane's builds so far", lineRun.status === 0 && lastLine?.startsWith(`${BUILD_RECORD_LINE_PREFIX} ok, exit 0, 0 min, $${expectedUsage.cost.total.toFixed(2)}; `) && lastLine.endsWith(alphaLine) && alphaLine === literal && /3 builds/.test(alphaLine) && /2 ok/.test(alphaLine) && /1 no end/.test(alphaLine) && workerEnd?.outcome === "ok", JSON.stringify({ stderr: lineRun.stderr, report: report.stdout, alphaLine, literal }));

// req: R-2596 R-2599 R-2602
check("seal: build records live at nana/build-records.jsonl in schema 1 and their stderr lines start pi-worker: build record:", BUILD_RECORDS_SUBPATH === "nana/build-records.jsonl" && BUILD_RECORD_SCHEMA === 1 && BUILD_RECORD_LINE_PREFIX === "pi-worker: build record:" && BUILD_SESSION_READ_MAX_BYTES === 64 * 1024 * 1024 && BUILD_LEDGER_READ_MAX_BYTES === 32 * 1024 * 1024);

fs.rmSync(TD, { recursive: true, force: true });
process.exit(failures ? 1 : 0);
