/**
 * @module packages/nana-pack/tests/worker-lane.test.mjs
 * @purpose Pins fail-closed lane verification, preamble delivery, and the sealed worker ceiling.
 * @inputs pi-worker, a temporary git repository/worktree, and a stub pi executable
 * @outputs named PASS/FAIL checks
 * @effects disk (OS temp fixtures), process (git and worker subprocesses)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runWatchdog } from "../bin/pi-watchdog.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const worker = path.join(root, "bin", "pi-worker.mjs");
const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "worker-lane-")));
const repo = path.join(temp, "repo"), lane = path.join(temp, "lane"), stubDir = path.join(temp, "stub");
fs.mkdirSync(repo); fs.mkdirSync(stubDir);
const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.invalid", ...args], { cwd, encoding: "utf8" });
const initialized = git(repo, "init", "-q");
if (initialized.status !== 0) throw new Error(initialized.stderr);
fs.writeFileSync(path.join(repo, "seed"), "seed\n");
git(repo, "add", "seed"); git(repo, "commit", "-qm", "seed");
git(repo, "worktree", "add", "-qb", "feat/alpha", lane);
const brief = path.join(temp, "brief.md"); fs.writeFileSync(brief, "lane brief content");
const pi = path.join(stubDir, "pi");
fs.writeFileSync(pi, `#!/bin/sh\nprintf '%s\\n' "$NANA_ROLE:$NANA_WORKTREE_ROOT"\nprev=0; n=0\nfor arg in "$@"; do printf '%s\\n' "$arg"; if [ "$prev" = 1 ]; then n=$((n+1)); cp "$arg" "${path.join(temp, "prompt-")}"$n; prev=0; elif [ "$arg" = "--append-system-prompt" ]; then prev=1; fi; done\n`); fs.chmodSync(pi, 0o755);
const out = path.join(temp, "output.md");
const run = (cwd, args, more = {}, piArgs = ["-p", "instruction"]) => spawnSync(process.execPath, [worker, "--poll", "0.1", "--out", out, ...args, "--", ...piArgs], {
	cwd, encoding: "utf8", timeout: 15000,
	env: { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp, ...more },
});
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) process.exitCode = 1; };
// req: R-960
check("non-lane usage text remains the legacy form", spawnSync(process.execPath, [worker], { cwd: lane, encoding: "utf8" }).stderr === "usage: pi-worker.mjs --out <file> [--stall-secs N] [--retries N] [--poll N] -- <pi args...>\n");
// req: R-960
check("lane mode refuses the main checkout before starting pi", /main checkout/.test(run(repo, ["--lane", "alpha", "--brief", brief]).stderr) && !fs.existsSync(out));
fs.mkdirSync(path.join(lane, "nested"));
// req: R-960
check("lane mode refuses a nested cwd", /cwd is not the repository root/.test(run(path.join(lane, "nested"), ["--lane", "alpha", "--brief", brief]).stderr));
// req: R-960
check("lane mode refuses a missing brief before starting pi", /brief file does not exist/.test(run(lane, ["--lane", "alpha", "--brief", "missing.md"]).stderr));
const briefDirectory = path.join(temp, "brief-directory"); fs.mkdirSync(briefDirectory);
// req: R-960
check("lane mode refuses a brief directory with a named failure", /brief must be a readable regular file/.test(run(lane, ["--lane", "alpha", "--brief", briefDirectory]).stderr));
// req: R-960
check("lane mode refuses a switched lane branch before starting pi", (() => { git(lane, "checkout", "-qb", "feat/other"); const result = run(lane, ["--lane", "alpha", "--brief", brief]); git(lane, "checkout", "-q", "feat/alpha"); return /expected feat\/alpha/.test(result.stderr); })());
const good = run(lane, ["--lane", "alpha", "--brief", path.relative(lane, brief)]);
const result = fs.readFileSync(out, "utf8");
const promptPaths = result.split("\n").reduce((all, arg, i, args) => arg === "--append-system-prompt" ? [...all, args[i + 1]] : all, []);
// req: R-961
check("verified lane passes preamble and validated brief as ordered file paths", good.status === 0 && /worker:/.test(result) && promptPaths.length === 2 && !fs.existsSync(promptPaths[0]) && promptPaths[1] === fs.realpathSync(brief) && fs.readFileSync(path.join(temp, "prompt-1"), "utf8").includes("on branch feat/alpha") && fs.readFileSync(path.join(temp, "prompt-2"), "utf8") === "lane brief content", `${good.stderr}${result} paths=${promptPaths.join(",")}`);
const defaultPairs = [["--provider", "openai-codex"], ["--model", "gpt-6-luna"], ["--thinking", "high"], ["-t", "read,grep,find,bash,edit,write"]];
const receivedArgs = result.split("\n");
// req: R-961
check("lane builder receives canonical defaults", defaultPairs.every(([flag, value]) => receivedArgs.indexOf(flag) >= 0 && receivedArgs[receivedArgs.indexOf(flag) + 1] === value && receivedArgs.filter((seen) => seen === flag).length === 1));
const overridden = run(lane, ["--lane", "alpha", "--brief", brief], {}, ["--provider", "override-provider", "--model", "override-model", "--thinking", "low", "-p", "instruction"]);
const overrideArgs = fs.readFileSync(out, "utf8").split("\n");
// req: R-961
check("lane caller overrides model provider and thinking defaults", overridden.status === 0 && ["override-provider", "override-model", "low"].every((arg) => overrideArgs.includes(arg)) && !["openai-codex", "gpt-6-luna", "high"].some((arg) => overrideArgs.includes(arg)));
const missingTools = run(lane, ["--lane", "alpha", "--brief", brief], {}, ["-t", "read,grep,find,bash", "-p", "instruction"]);
// req: R-961
check("lane refuses caller tools without edit and write", missingTools.status === 1 && /tool-control options are owned by lane mode/.test(missingTools.stderr));
for (const form of [["-t", "read,edit,write"], ["--tools", "read,edit,write"], ["-t", "read,edit,write", "--tools", "read"], ["--exclude-tools", "edit"], ["-xt", "write"], ["--no-tools"], ["-nt"], ["--no-builtin-tools"], ["-nbt"]]) {
	// req: R-961
	check(`lane refuses caller tool control ${form.join(" ")}`, run(lane, ["--lane", "alpha", "--brief", brief], {}, [...form, "-p", "instruction"]).status === 1);
}
// req: R-961
check("lane refuses retries before launch", run(lane, ["--lane", "alpha", "--brief", brief, "--retries", "1"]).status === 1 && /--retries greater than zero/.test(run(lane, ["--lane", "alpha", "--brief", brief, "--retries", "1"]).stderr));
const laneSpawnCount = path.join(temp, "lane-spawns");
fs.writeFileSync(pi, `#!/bin/sh\necho spawned >> "${laneSpawnCount}"\necho output\nsleep 3\n`); fs.chmodSync(pi, 0o755);
const lockChild = spawn(process.execPath, [worker, "--poll", "0.1", "--out", out, "--lane", "alpha", "--brief", brief, "--", "-p", "instruction"], { cwd: lane, env: { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp }, stdio: "ignore" });
await new Promise((resolve) => setTimeout(resolve, 500));
// req: R-960
check("lane lock refuses a second launcher before spawning pi", (() => { const second = run(lane, ["--lane", "alpha", "--brief", brief]); lockChild.kill("SIGTERM"); return second.status === 1 && /already locked/.test(second.stderr) && fs.readFileSync(laneSpawnCount, "utf8").trim().split("\n").length === 1; })());
const retrySpawnCount = path.join(temp, "retry-spawns");
fs.writeFileSync(pi, `#!/bin/sh\necho spawn >> "${retrySpawnCount}"\ngit -C "${lane}" checkout -q feat/other\nexit 1\n`); fs.chmodSync(pi, 0o755);
const retryGuard = await runWatchdog("lane-retry-probe", { piArgs: ["-p", "probe"], cwd: lane, stallSecs: 5, pollSecs: 0.1, retries: 1, maxSecs: 10, childEnv: { PATH: `${stubDir}${path.delimiter}${process.env.PATH}` }, validateAttempt: () => { try { return git(lane, "branch", "--show-current").stdout.trim() === "feat/alpha" ? null : "branch changed"; } catch { return "branch changed"; } } });
git(lane, "checkout", "-q", "feat/alpha");
fs.writeFileSync(pi, `#!/bin/sh\nprintf '%s\\n' "$NANA_ROLE:$NANA_WORKTREE_ROOT"\nprev=0; n=0\nfor arg in "$@"; do printf '%s\\n' "$arg"; if [ "$prev" = 1 ]; then n=$((n+1)); cp "$arg" "${path.join(temp, "prompt-")}"$n; prev=0; elif [ "$arg" = "--append-system-prompt" ]; then prev=1; fi; done\n`); fs.chmodSync(pi, 0o755);
// req: R-960
check("retry revalidates lane branch after attempt one", retryGuard.validationFailed === true && retryGuard.attempt === 1 && fs.readFileSync(retrySpawnCount, "utf8").trim().split("\n").length === 1);
// req: R-965
check("missing trust prints notice before worker attempt", good.stderr.indexOf("trust: none for") >= 0 && good.stderr.indexOf("trust: none for") < good.stderr.indexOf("attempt 1"));
const trustDir = path.join(temp, ".pi", "agent"); fs.mkdirSync(trustDir, { recursive: true });
fs.writeFileSync(path.join(trustDir, "trust.json"), JSON.stringify({ [fs.realpathSync(lane)]: true }));
const trusted = run(lane, ["--lane", "alpha", "--brief", brief]);
// req: R-965
check("affirmative trust record suppresses notice", trusted.status === 0 && !trusted.stderr.includes("trust: none for"));
const laneGitDir = fs.realpathSync(path.resolve(lane, git(lane, "rev-parse", "--git-dir").stdout.trim()));
const lockDir = path.join(laneGitDir, "nana-lane.lock");
// req: R-960
check("handled worker exit removes its worktree lock", !fs.existsSync(lockDir));
fs.mkdirSync(lockDir); fs.writeFileSync(path.join(lockDir, "pid"), "999999999\n");
const staleLockRun = run(lane, ["--lane", "alpha", "--brief", brief]);
// req: R-960
check("dead worktree lock is reclaimed", staleLockRun.status === 0 && !fs.existsSync(lockDir));
const config = await import("../bin/worker-config.mjs");
// req: R-963
check("sealed lane ceiling is 28,800 seconds", config.LANE_MAX_SECS === 28_800);
const descendantPid = path.join(temp, "descendant.pid");
fs.writeFileSync(pi, `#!/bin/sh\nsleep 30 &\necho $! > "${descendantPid}"\nwait\n`); fs.chmodSync(pi, 0o755);
const capped = run(lane, ["--lane", "alpha", "--brief", brief, "--max-secs", "1", "--stall-secs", "10"]);
// req: R-963
check("max-secs override kills and names the lane wall-clock ceiling", capped.status === 1 && /wall-clock ceiling 1s reached/.test(capped.stderr));
let descendantAlive = false;
try { process.kill(Number(fs.readFileSync(descendantPid, "utf8").trim()), 0); descendantAlive = true; } catch { /* process group was reaped */ }
// req: R-963
check("wall-clock ceiling kills the worker process group", capped.status === 1 && !descendantAlive);
