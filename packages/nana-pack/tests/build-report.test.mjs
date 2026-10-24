/**
 * @module packages/nana-pack/tests/build-report.test.mjs
 * @purpose Pin build-report's build, lane, total, unreadable-line, and unpaired-start output.
 * @inputs build-report, build-record readers/renderers, and temporary clone-shared ledgers and session files.
 * @outputs Three requirement-tagged PASS/FAIL checks.
 * @effects disk (OS-temp git fixtures), process (git and report subprocesses).
 * @errors Failed checks print their title and make the process exit nonzero.
 */
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { BUILD_RECORD_SCHEMA, BUILD_RECORDS_SUBPATH } from "../lib/build-records-config.mjs";
import * as workerConfig from "../bin/worker-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { findPiRoot } from "./pi-install.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import { killWorkerTree } from "./process-tree-helper.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, "bin", "build-report.mjs");
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "build-report-test-")));
const REPO = path.join(TD, "repo");
const LINKED = path.join(TD, "linked");
const NOGIT = path.join(TD, "not-repo");
const SESSION_DIR = path.join(TD, "sessions");
const HARD_KILL_WAIT_MS = (workerConfig.LANE_WATCHER_POLL_MS ?? 200) + (workerConfig.LANE_WATCHER_STOP_WAIT_MS ?? 2_000) + (workerConfig.LANE_WATCHER_REMOVE_RETRIES ?? 5) * (workerConfig.LANE_WATCHER_REMOVE_RETRY_MS ?? 100) + 5_000; // test-only CI margin around the product cleanup waits.
const TEMP_REMOVE_MAX_RETRIES = 5; // chosen: gives transient Windows folder handles several chances to close.
const TEMP_REMOVE_RETRY_DELAY_MS = 100; // chosen: bounds cleanup retries to half a second before reporting the failure.
const git = (cwd, ...args) => {
	const result = spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args], { cwd, encoding: "utf8" });
	if (result.status !== 0) throw new Error(result.stderr);
	return result.stdout.trim();
};
for (const dir of [REPO, NOGIT, SESSION_DIR]) fs.mkdirSync(dir, { recursive: true });
git(REPO, "init", "-q", "-b", "main"); fs.writeFileSync(path.join(REPO, "seed"), "seed\n"); git(REPO, "add", "seed"); git(REPO, "commit", "-qm", "seed");
git(REPO, "worktree", "add", "-q", "-b", "feat/report-linked", LINKED);
const COMMON = path.resolve(REPO, git(REPO, "rev-parse", "--git-common-dir"));
const LINKED_GIT_DIR = path.resolve(LINKED, git(LINKED, "rev-parse", "--git-dir"));
const LEDGER = path.join(COMMON, ...BUILD_RECORDS_SUBPATH.split("/"));
const usage = (tokens, cost) => ({ input: tokens, output: 0, cacheRead: 0, cacheWrite: 0, cacheWrite1h: 0, reasoning: 0, totalTokens: tokens, cost: { input: cost, output: 0, cacheRead: 0, cacheWrite: 0, total: cost } });
const start = (build, lane, at, sessionDir = SESSION_DIR) => ({ v: BUILD_RECORD_SCHEMA, kind: "start", build, lane, brief: "brief.md", feature: "FEAT-006", tip: "a".repeat(40), startedAt: at, pid: 1, lock: "lock", laneSize: "small", slot: "builder", provider: "p", model: "m", thinking: null, cwd: REPO, sessionDir, out: "out.md" });
const end = (build, at, durationMs, outcome, exit, u, cost = u?.cost?.total ?? null) => ({ v: BUILD_RECORD_SCHEMA, kind: "end", build, endedAt: at, durationMs, attempts: 1, exit, outcome, signal: null, tip: "b".repeat(40), usage: u, cost, costReason: cost === null ? "not priced" : null, sessions: [], sessionBadLines: 0, outputError: null });
const rows = [
	start("a1", "alpha", "2026-10-22T10:00:00.000Z"), end("a1", "2026-10-22T10:01:01.000Z", 61_000, "ok", 0, usage(10, 0.01)),
	start("a2", "alpha", "2026-10-22T10:02:00.000Z"), end("a2", "2026-10-22T10:04:01.000Z", 121_000, "failed", 1, usage(20, 0.02)),
	start("a3", "alpha", "2026-10-22T10:05:00.000Z"), end("a3", "2026-10-22T10:05:59.000Z", 59_000, "ok", 0, usage(30, 0.03), null),
	start("b1", "beta", "2026-10-22T10:06:00.000Z"), end("b1", "2026-10-22T10:07:00.000Z", 60_000, "ceiling", 1, usage(40, 0.04)),
];
fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
const validLines = rows.map((row, index) => `${JSON.stringify(row)}${index % 2 ? " \t" : ""}`);
fs.writeFileSync(LEDGER, `${validLines.slice(0, 3).join("\r\n")}\r\n{torn\r\n${JSON.stringify({ v: 2, kind: "start", build: "old" })}\n${JSON.stringify({ v: 1, kind: "end", build: "orphan", outcome: "ok" })}\n${validLines.slice(3).join("\n")}`); // no final newline
const run = (cwd, args = []) => spawnSync(process.execPath, [REPORT, ...args], { cwd, encoding: "utf8", timeout: 10_000 });
const readRows = (file) => {
	try { return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse); }
	catch { return []; }
};
let failures = 0;
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) failures++; };
const fromMain = run(REPO);
const fromLinked = run(LINKED);
const alphaOnly = run(LINKED, ["--lane", "beta"]);
const notRepo = run(NOGIT, ["--repo", NOGIT]);
const expected = [
	"build a1 | lane alpha | ok | exit 0 | 1 min | 10 tokens | $0.01",
	"build a2 | lane alpha | failed | exit 1 | 2 min | 20 tokens | $0.02",
	"build a3 | lane alpha | ok | exit 0 | 0 min | 30 tokens | cost unknown: not priced",
	"build b1 | lane beta | ceiling | exit 1 | 1 min | 40 tokens | $0.04",
	"lane alpha | 3 builds | 2 ok, 1 failed | 4 min | 60 tokens | $0.03 | 1 unpriced",
	"lane beta | 1 build | 1 ceiling | 1 min | 40 tokens | $0.04 | 0 unpriced",
	"total | 4 builds | 2 lanes | 1 lane with 2+ builds | 5 min | 100 tokens | $0.07 | 1 unpriced | 3 unreadable lines",
].join("\n") + "\n";
const betaExpected = [
	"build b1 | lane beta | ceiling | exit 1 | 1 min | 40 tokens | $0.04",
	"lane beta | 1 build | 1 ceiling | 1 min | 40 tokens | $0.04 | 0 unpriced",
	"total | 1 build | 1 lane | 0 lanes with 2+ builds | 1 min | 40 tokens | $0.04 | 0 unpriced | 3 unreadable lines",
].join("\n") + "\n";
const capRunner = path.join(TD, "cap-runner.mjs");
fs.writeFileSync(capRunner, `import { runBuildReport } from ${JSON.stringify(pathToFileURL(REPORT).href)}; process.exitCode = runBuildReport(["--repo", process.argv[2]], { ledgerReadMaxBytes: 8 });\n`);
const capped = spawnSync(process.execPath, [capRunner, REPO], { encoding: "utf8", timeout: 10_000 });
// req: R-2600
check("R-2600: the build report prints each build, one line per lane and a total counting lanes with two or more builds", fromMain.status === 0 && fromMain.stdout === expected && fromLinked.status === 0 && fromLinked.stdout === expected && alphaOnly.status === 0 && alphaOnly.stdout === betaExpected && notRepo.status === 1 && notRepo.stderr === `build-report: --repo is not a git repository: ${NOGIT}\n` && capped.status === 1 && capped.stdout === "" && capped.stderr.includes("ledger over 8 bytes"), JSON.stringify({ main: fromMain, linked: fromLinked, beta: alphaOnly, notRepo, capped }));

const noEndSession = path.join(TD, "no-end-sessions"); fs.mkdirSync(noEndSession);
const sessionRows = [
	{ type: "session", version: 3, id: "s1", timestamp: "2026-10-22T11:00:30.000Z", cwd: REPO },
	{ type: "session_info", id: "i", parentId: null, timestamp: "2026-10-22T11:00:31.000Z", name: "pi-worker-a1-123" },
	{ type: "usage", id: "u", parentId: "i", timestamp: "2026-10-22T11:02:01.000Z", usage: usage(64, 0.0625) },
];
fs.writeFileSync(path.join(noEndSession, "2026-10-22T11-00-30-000Z_s1.jsonl"), sessionRows.map(JSON.stringify).join("\r\n") + "\t");
const noEndRows = [
	start("n1", "gamma", "2026-10-22T11:00:00.000Z", noEndSession),
	start("n2", "gamma", "2026-10-22T11:03:00.000Z", noEndSession),
	start("n3", "delta", "2026-10-22T12:00:00.000Z", path.join(TD, "missing-sessions")),
];
fs.writeFileSync(LEDGER, noEndRows.map(JSON.stringify).join("\n"));
const noEnd = run(REPO);
const noEndExpected = [
	"build n1 | lane gamma | no end | exit - | 2 min | 64 tokens | $0.06",
	"build n2 | lane gamma | no end | exit - | untimed | 0 tokens | cost unknown: no matching session in " + noEndSession,
	"build n3 | lane delta | no end | exit - | untimed | 0 tokens | cost unknown: no matching session in " + path.join(TD, "missing-sessions"),
	"lane gamma | 2 builds | 2 no end | 2 min | 64 tokens | $0.06 | 1 unpriced",
	"lane delta | 1 build | 1 no end | 0 min | 0 tokens | $0.00 | 1 unpriced",
	"total | 3 builds | 2 lanes | 1 lane with 2+ builds | 2 min | 64 tokens | $0.06 | 2 unpriced | 0 unreadable lines",
].join("\n") + "\n";
const baseNoEndOk = noEnd.status === 0 && noEnd.stdout === noEndExpected && noEnd.stdout.indexOf("build n1") < noEnd.stdout.indexOf("build n2") && noEnd.stdout.includes("2 min | 64 tokens | $0.06");
// req: R-2601
check("R-2601: the build report lists a start with no end as no end, with its session cost", baseNoEndOk, JSON.stringify({ observed: noEnd.stdout, expected: noEndExpected, stderr: noEnd.stderr }));

const killCases = [
	() => killWorkerTree({ pid: 42 }, { platform: "win32", runner: () => ({ status: 255 }) }),
	() => killWorkerTree({ pid: 42 }, { platform: "win32", runner: () => ({ status: 128 }) }),
	() => killWorkerTree({ pid: 42 }, { platform: "win32", runner: () => { throw Object.assign(new Error("cannot start"), { code: "ENOENT" }); } }),
];
const killReturns = killCases.map((runCase) => { try { runCase(); return true; } catch { return false; } });
let defaultKillOptions = null;
try { killWorkerTree({ pid: 42 }, { platform: "win32", runner: (_command, _args, options) => { defaultKillOptions = options; return { status: 0 }; } }); } catch {}
// req: R-2667
check("R-2667: the hard-kill step's tree kill returns without throwing whatever status it gets or when it cannot start", killReturns.every(Boolean) && defaultKillOptions?.stdio === "ignore", JSON.stringify({ killReturns, defaultKillOptions }));

// A hard-killed worker leaves the start unpaired while its independently running pi session remains reportable.
fs.writeFileSync(LEDGER, "");
const hardBrief = path.join(LINKED, "brief.md"); fs.writeFileSync(hardBrief, "Feature: FEAT-006 · Build records\n\nPrecedent:\n- seed\n");
const hardHome = path.join(TD, "hard-home"), hardAgent = path.join(hardHome, ".pi", "agent"), hardBin = path.join(TD, "hard-bin"), hardPid = path.join(TD, "hard-pid");
fs.mkdirSync(hardBin, { recursive: true });
const piRoot = findPiRoot().root;
const piEntry = path.join(piRoot, JSON.parse(fs.readFileSync(path.join(piRoot, "package.json"), "utf8")).exports?.["."]?.import ?? "dist/index.js");
const hardBody = `const fs=require("node:fs"); (async()=>{ const {SessionManager}=await import(${JSON.stringify(pathToFileURL(piEntry).href)}); const m=SessionManager.create(process.cwd()); const a=process.argv.slice(2), i=a.indexOf("--name"); m.appendSessionInfo(a[i+1]); m.appendMessage({role:"user",content:[{type:"text",text:"hard"}],timestamp:Date.now()}); m.appendUsage("cache_warm","p","m",${JSON.stringify(usage(128, 0.125))}); fs.writeFileSync(process.env.HARD_PID,String(process.pid)); setInterval(()=>{},100000); })().catch(e=>{console.error(e);process.exit(2)});`;
if (process.platform === "win32") writeFakePi(hardBin, hardBody);
else { const body = path.join(hardBin, "body.cjs"); fs.writeFileSync(body, hardBody); fs.writeFileSync(path.join(hardBin, "pi"), `#!/bin/sh\nexec "${process.execPath}" "${body}" "$@"\n`, { mode: 0o755 }); }
const hardWorker = path.join(ROOT, "bin", "pi-worker.mjs");
const hardOut = path.join(TD, "hard-out.md");
const hardChild = spawn(process.execPath, [hardWorker, "--poll", "60", "--stall-secs", "20", "--out", hardOut, "--lane", "report-linked", "--brief", hardBrief], { cwd: LINKED, env: { ...process.env, HOME: hardHome, USERPROFILE: hardHome, PI_CODING_AGENT_DIR: hardAgent, PATH: `${hardBin}${path.delimiter}${process.env.PATH ?? ""}`, HARD_PID: hardPid }, stdio: "ignore" });
const hardClosePromise = new Promise((resolve) => hardChild.once("close", (code, signal) => resolve({ code, signal })));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function pidAlive(pid) {
	if (!Number.isInteger(pid) || pid <= 0) return false;
	try { process.kill(pid, 0); return true; } catch { return false; }
}
async function waitForPidExit(pid) {
	const deadline = Date.now() + HARD_KILL_WAIT_MS;
	while (pidAlive(pid) && Date.now() < deadline) await sleep(20);
	return !pidAlive(pid);
}
const watcherLines = () => {
	if (process.platform === "win32") {
		const result = spawnSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*lane-watcher-child.mjs*' -and $_.CommandLine -like '*${TD.replaceAll("'", "''")}*' } | ForEach-Object { $_.CommandLine }`], { encoding: "utf8", windowsHide: true, timeout: 10_000 });
		return result.status === 0 ? result.stdout.split(/\r?\n/).filter(Boolean) : [];
	}
	const result = spawnSync("ps", ["-A", "-ww", "-o", "args="], { encoding: "utf8", timeout: 10_000 });
	return result.status === 0 ? result.stdout.split("\n").filter((line) => line.includes("lane-watcher-child.mjs") && line.includes(TD)) : [];
};
const waitUntil = async (predicate, limit) => {
	const deadline = Date.now() + limit;
	while (!predicate() && Date.now() < deadline) await sleep(20);
	return predicate();
};
const hardDeadline = Date.now() + 10_000;
while (!(fs.existsSync(hardPid) && fs.existsSync(LEDGER) && fs.statSync(LEDGER).size > 0) && hardChild.exitCode === null && Date.now() < hardDeadline) await sleep(25);
const hardStart = readRows(LEDGER).find((row) => row.kind === "start" && row.lane === "report-linked");
const watcherReady = await waitUntil(() => {
	const lines = watcherLines();
	return lines.filter((line) => line.includes("--watch")).length === 1 && lines.every((line) => !line.includes("--hop"));
}, 5_000);
let hardStarted = fs.existsSync(hardPid) && Boolean(hardStart);
if (hardStarted) killWorkerTree(hardChild);
await sleep(0);
const hardClose = await Promise.race([hardClosePromise, sleep(10_000).then(() => ({ timeout: true }))]);
const endArrived = hardStart ? await waitUntil(() => readRows(LEDGER).some((row) => row.kind === "end" && row.build === hardStart.build), HARD_KILL_WAIT_MS) : false;
const watcherGone = await waitUntil(() => watcherLines().length === 0, HARD_KILL_WAIT_MS);
if (hardStarted) {
	const fakePiPid = Number(fs.readFileSync(hardPid, "utf8"));
	if (process.platform !== "win32") { try { process.kill(fakePiPid, "SIGTERM"); } catch {} }
	if (!await waitForPidExit(fakePiPid)) hardStarted = false;
}
const hardReport = run(LINKED, ["--lane", "report-linked"]);
fs.rmSync(path.join(LINKED_GIT_DIR, "nana-lane.lock"), { force: true });
const hardRows = readRows(LEDGER);
const hardEnds = hardStart ? hardRows.filter((row) => row.kind === "end" && row.build === hardStart.build) : [];
const hardLedger = fs.existsSync(LEDGER) ? fs.readFileSync(LEDGER, "utf8") : "missing";
const hardOk = hardStarted && watcherReady && !hardClose.timeout && endArrived && watcherGone && hardEnds.length === 1 && hardEnds[0].outcome === "stopped" && hardEnds[0].exit === null && hardEnds[0].signal === null && hardReport.status === 0 && /build .* \| lane report-linked \| stopped \| exit -/.test(hardReport.stdout) && hardReport.stdout.includes("128 tokens | $0.13");
// req: R-2725
check("R-2725: a hard-killed lane build gets one end record from its watcher and the report lists it as stopped, exit -, with its session cost", hardOk, JSON.stringify({ hardClose, watcherReady, endArrived, watcherGone, hardEnds, hardReport, hardLedger }));

try {
	fs.rmSync(TD, { recursive: true, force: true, maxRetries: TEMP_REMOVE_MAX_RETRIES, retryDelay: TEMP_REMOVE_RETRY_DELAY_MS });
} catch (error) {
	console.error(`cleanup failed: ${TD}: ${error.code ?? error.message}`);
}
process.exit(failures ? 1 : 0);
