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
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
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
fs.writeFileSync(pi, "#!/bin/sh\nprintf '%s\\n' \"$NANA_ROLE:$NANA_WORKTREE_ROOT\"\nfor arg in \"$@\"; do printf '%s\\n' \"$arg\"; done\n"); fs.chmodSync(pi, 0o755);
const out = path.join(temp, "output.md");
const run = (cwd, args, more = {}) => spawnSync(process.execPath, [worker, "--poll", "1", "--out", out, ...args, "--", "-p", "instruction"], {
	cwd, encoding: "utf8", timeout: 15000,
	env: { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp, ...more },
});
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) process.exitCode = 1; };
// req: R-960
check("lane mode refuses the main checkout before starting pi", /main checkout/.test(run(repo, ["--lane", "alpha", "--brief", brief]).stderr) && !fs.existsSync(out));
fs.mkdirSync(path.join(lane, "nested"));
// req: R-960
check("lane mode refuses a nested cwd", /cwd is not the repository root/.test(run(path.join(lane, "nested"), ["--lane", "alpha", "--brief", brief]).stderr));
// req: R-960
check("lane mode refuses a missing brief before starting pi", /brief file does not exist/.test(run(lane, ["--lane", "alpha", "--brief", "missing.md"]).stderr));
// req: R-960
check("lane mode refuses a switched lane branch before starting pi", (() => { git(lane, "checkout", "-qb", "feat/other"); const result = run(lane, ["--lane", "alpha", "--brief", brief]); git(lane, "checkout", "-q", "feat/alpha"); return /expected feat\/alpha/.test(result.stderr); })());
const good = run(lane, ["--lane", "alpha", "--brief", path.relative(lane, brief)]);
const result = fs.readFileSync(out, "utf8");
// req: R-961
check("verified lane passes role/root and preamble before brief content", good.status === 0 && /worker:/.test(result) && result.indexOf("# nana lane builder") < result.indexOf("lane brief content") && result.includes("on branch feat/alpha"), good.stderr + result);
// req: R-965
check("missing trust prints notice before worker attempt", good.stderr.indexOf("trust: none for") >= 0 && good.stderr.indexOf("trust: none for") < good.stderr.indexOf("attempt 1"));
const trustDir = path.join(temp, ".pi", "agent"); fs.mkdirSync(trustDir, { recursive: true });
fs.writeFileSync(path.join(trustDir, "trust.json"), JSON.stringify({ [fs.realpathSync(lane)]: true }));
const trusted = run(lane, ["--lane", "alpha", "--brief", brief]);
// req: R-965
check("affirmative trust record suppresses notice", trusted.status === 0 && !trusted.stderr.includes("trust: none for"));
const config = await import("../bin/worker-config.mjs");
// req: R-963
check("sealed lane ceiling is 28,800 seconds", config.LANE_MAX_SECS === 28_800);
fs.writeFileSync(pi, "#!/bin/sh\nsleep 10\necho late\n"); fs.chmodSync(pi, 0o755);
const capped = run(lane, ["--lane", "alpha", "--brief", brief, "--max-secs", "1", "--stall-secs", "10"]);
// req: R-963
check("max-secs override kills and names the lane wall-clock ceiling", capped.status === 1 && /wall-clock ceiling 1s reached/.test(capped.stderr));
