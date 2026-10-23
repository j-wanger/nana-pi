/**
 * @module packages/nana-pack/tests/brief-check.test.mjs
 * @purpose Prove brief-check and pi-worker share lane-brief precedent validation without brief-check starting pi.
 * @inputs The two commands, their shared checker source, and a temporary linked-worktree fixture.
 * @outputs Requirement-tagged PASS/FAIL checks.
 * @effects disk (OS temp fixtures and a slow CPU-sampler shim), process (git, command subprocesses
 *  and the bounded shim)
 * @errors A failed comparison prints its cases and exits nonzero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const worker = path.join(root, "bin", "pi-worker.mjs");
const briefCheck = path.join(root, "bin", "brief-check.mjs");
const sharedCheck = path.join(root, "lib", "brief-precedent.mjs");
const temp = tmpDir(path.join(os.tmpdir(), "brief-check-"));
const repo = path.join(temp, "repo");
const lane = path.join(temp, "lane");
const stubDir = path.join(temp, "stub");
const marker = path.join(temp, "pi-spawned");
const holdRecord = path.join(temp, "pi-hold.json");
const samplerMarker = path.join(temp, "sampler-started");
const out = path.join(temp, "worker-output.md");
const agentDir = path.join(temp, "agent");
fs.mkdirSync(repo);
fs.mkdirSync(stubDir);
fs.mkdirSync(agentDir);

const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args], {
	cwd, encoding: "utf8", timeout: 10_000,
});
let result = git(repo, "init", "-q");
if (result.status !== 0) throw new Error(result.stderr);
fs.writeFileSync(path.join(repo, "seed"), "seed\n");
fs.mkdirSync(path.join(repo, "docs", "known-bugs"), { recursive: true });
fs.writeFileSync(path.join(repo, "docs", "known-bugs", "FEAT-006.md"), "# Fixture known bugs\n");
git(repo, "add", "seed", "docs/known-bugs/FEAT-006.md");
git(repo, "commit", "-qm", "fixture");
git(repo, "worktree", "add", "-qb", "feat/alpha", lane);

// measured 2026-10-23 (R-2670): 15 Windows legs passed brief-check in 1.8 to 4.0 seconds,
// all from legs that failed elsewhere; 30 seconds is 7.5 times the slowest, matches build-records'
// CASE_LIMIT_MS, and keeps seven children under the 300-second per-file land limit.
const CHILD_LIMIT_MS = 30_000;
const WORKER_POLL_SECS = 60; // chosen 2026-10-23 (R-2670): twice the child limit, so the fake exits before a CPU sample.
const FAKE_PI_HOLD_MS = 1_000; // chosen 2026-10-23: ten times the old 0.1-second poll, forcing old code to sample.
const SLOW_SAMPLER_MS = 60_000; // chosen 2026-10-23: twice the child limit, modeling a sampler that outlives it.
const nodeBody = `const fs = require("node:fs");\nconst started = Date.now();\nfs.writeFileSync(${JSON.stringify(marker)}, "spawned\\n");\nsetTimeout(() => { fs.writeFileSync(${JSON.stringify(holdRecord)}, JSON.stringify({ heldMs: Date.now() - started })); process.stdout.write("worker output\\n"); }, ${FAKE_PI_HOLD_MS});\n`;
if (process.platform === "win32") writeFakePi(stubDir, nodeBody);
else {
	const body = path.join(stubDir, "fake-pi.cjs");
	fs.writeFileSync(body, nodeBody);
	const pi = path.join(stubDir, "pi");
	fs.writeFileSync(pi, `#!/bin/sh\nexec "${process.execPath}" "${body}" "$@"\n`);
	fs.chmodSync(pi, 0o755);
}
const samplerBody = path.join(stubDir, "slow-sampler.cjs");
fs.writeFileSync(samplerBody, `const fs = require("node:fs"); fs.writeFileSync(process.env.SAMPLER_MARKER, String(process.pid)); setTimeout(() => {}, Number(process.env.SLOW_SAMPLER_MS));\n`);
const samplerShim = path.join(stubDir, process.platform === "win32" ? "powershell.cmd" : "ps");
if (process.platform === "win32") fs.writeFileSync(samplerShim, `@echo off\r\n"${process.execPath}" "${samplerBody}" %*\r\nexit /b %errorlevel%\r\n`);
else { fs.writeFileSync(samplerShim, `#!/bin/sh\nexec "${process.execPath}" "${samplerBody}" "$@"\n`); fs.chmodSync(samplerShim, 0o755); }
const env = { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp, PI_CODING_AGENT_DIR: agentDir, SAMPLER_MARKER: samplerMarker, SLOW_SAMPLER_MS: String(SLOW_SAMPLER_MS) };
const resolvedSampler = process.platform === "win32"
	? spawnSync("where", ["powershell"], { env, encoding: "utf8", timeout: CHILD_LIMIT_MS }).stdout?.trim().split(/\r?\n/)[0]
	: spawnSync("/bin/sh", ["-c", "command -v ps"], { env, encoding: "utf8", timeout: CHILD_LIMIT_MS }).stdout?.trim();
const writeBrief = (name, text) => {
	const file = path.join(temp, name);
	fs.writeFileSync(file, text);
	return file;
};
const runWorker = (brief) => spawnSync(process.execPath, [worker, "--poll", String(WORKER_POLL_SECS), "--out", out, "--lane", "alpha", "--brief", brief], {
	cwd: lane, encoding: "utf8", timeout: CHILD_LIMIT_MS, env,
});
const runCheck = (brief, cwd = lane) => spawnSync(process.execPath, [briefCheck, "--brief", brief, "--tree", lane], {
	cwd, encoding: "utf8", timeout: CHILD_LIMIT_MS, env,
});
const selectedLine = (stderr) => stderr.split(/\r?\n/).find((line) => line.startsWith("pi-worker: lane refused:") || line.startsWith("pi-worker: precedent:")) ?? null;
const cases = [
	["missing section", writeBrief("missing.md", "Feature: FEAT-006 · Missing\n"), 1, "pi-worker: lane refused:"],
	["untracked path", writeBrief("untracked.md", "Precedent:\n- missing.mjs\n"), 1, "pi-worker: lane refused:"],
	["passing with known bugs", writeBrief("passing.md", "Feature: FEAT-006 · Passing\n\nPrecedent:\n- seed\n"), 0, "pi-worker: precedent:"],
];
const observations = [];
for (const [name, brief, expectedStatus, prefix] of cases) {
	fs.rmSync(marker, { force: true });
	const workerResult = runWorker(brief);
	const workerLine = selectedLine(workerResult.stderr);
	const workerStarted = fs.existsSync(marker);
	fs.rmSync(marker, { force: true });
	const checkResult = runCheck(brief);
	const checkLine = selectedLine(checkResult.stderr);
	observations.push({
		name,
		ok: workerResult.status === expectedStatus && checkResult.status === expectedStatus &&
			workerLine?.startsWith(prefix) && checkLine === workerLine && !fs.existsSync(marker) &&
			(expectedStatus === 0 ? workerStarted && workerLine.includes("known bugs: docs/known-bugs/FEAT-006.md") : !workerStarted),
		workerStatus: workerResult.status,
		checkStatus: checkResult.status,
		workerLine,
		checkLine,
		checkStderr: checkResult.stderr,
	});
}
const workerSource = fs.readFileSync(worker, "utf8");
const checkerSource = fs.existsSync(briefCheck) ? fs.readFileSync(briefCheck, "utf8") : "";
const sharedByBoth = fs.existsSync(sharedCheck) &&
	workerSource.includes("checkBriefForLaunch") && checkerSource.includes("checkBriefForLaunch") &&
	workerSource.includes("../lib/brief-precedent.mjs") && checkerSource.includes("../lib/brief-precedent.mjs") &&
	!["readBrief", "checkPrecedent", "ls-tree", "KNOWN_BUGS_DIR"].some((token) => checkerSource.includes(token));

const hold = fs.existsSync(holdRecord) ? JSON.parse(fs.readFileSync(holdRecord, "utf8")) : null;
const samplerResolvedFirst = resolvedSampler && path.resolve(resolvedSampler).toLowerCase() === path.resolve(samplerShim).toLowerCase();
const ok = observations.every((entry) => entry.ok) && sharedByBoth;
const check = (title, pass, detail = "") => {
	console.log(pass ? "PASS" : "FAIL", title, pass ? "" : detail);
	if (!pass) process.exitCode = 1;
};
// req: R-2585
check("R-2585: brief-check prints what pi-worker would print for the same brief and starts nothing", ok, JSON.stringify({ observations, sharedByBoth }));
// req: R-2670
check("R-2670: brief-check and pi-worker give the same line for every brief while a CPU sampler slower than the child limit is first on PATH, and the sampler never runs",
	ok && samplerResolvedFirst && hold?.heldMs >= FAKE_PI_HOLD_MS && !fs.existsSync(samplerMarker),
	JSON.stringify({ observations, sharedByBoth, resolvedSampler, samplerShim, hold, samplerStarted: fs.existsSync(samplerMarker) }),
);
// req: R-2670
check("seal: R-2585's children have a 30-second limit and the worker polls less often than that", CHILD_LIMIT_MS === 30_000 && WORKER_POLL_SECS * 1000 > CHILD_LIMIT_MS, JSON.stringify({ CHILD_LIMIT_MS, WORKER_POLL_SECS }));

const unreadableName = "passing.md";
const unreadableTreePath = path.join(lane, unreadableName);
const unrelatedBrief = writeBrief(unreadableName, "Precedent:\n- seed\n");
fs.rmSync(unreadableTreePath, { force: true });
const unreadableResult = runCheck(unreadableName, temp);
const unreadableLines = unreadableResult.stderr.trimEnd().split(/\r?\n/);
const expectedTriedPath = path.resolve(lane, unreadableName);
// req: R-2621
check("R-2621: brief-check names the brief path it tried and the base a relative brief resolves from",
	unreadableResult.status === 1 && unreadableLines.length === 1 && unreadableLines[0].startsWith("brief-check:") &&
	unreadableLines[0].includes(expectedTriedPath) && unreadableLines[0].includes("--tree") &&
	fs.existsSync(unrelatedBrief) && !fs.existsSync(unreadableTreePath), unreadableResult.stderr);

if (fs.existsSync(samplerMarker)) {
	const samplerPid = Number(fs.readFileSync(samplerMarker, "utf8"));
	if (samplerPid > 0) { try { process.kill(samplerPid, "SIGKILL"); } catch {} }
}
