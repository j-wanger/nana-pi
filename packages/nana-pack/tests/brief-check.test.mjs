/**
 * @module packages/nana-pack/tests/brief-check.test.mjs
 * @purpose Prove brief-check and pi-worker share lane-brief precedent validation without brief-check starting pi.
 * @inputs The two commands, their shared checker source, and a temporary linked-worktree fixture.
 * @outputs One named PASS/FAIL check.
 * @effects disk (OS temp fixtures), process (git and command subprocesses)
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

const nodeBody = `const fs = require("node:fs");\nfs.writeFileSync(${JSON.stringify(marker)}, "spawned\\n");\nprocess.stdout.write("worker output\\n");\n`;
if (process.platform === "win32") writeFakePi(stubDir, nodeBody);
else {
	const pi = path.join(stubDir, "pi");
	fs.writeFileSync(pi, `#!/bin/sh\nprintf 'spawned\\n' > "${marker}"\nprintf 'worker output\\n'\n`);
	fs.chmodSync(pi, 0o755);
}
const env = { ...process.env, PATH: `${stubDir}${path.delimiter}${process.env.PATH}`, HOME: temp, PI_CODING_AGENT_DIR: agentDir };
const writeBrief = (name, text) => {
	const file = path.join(temp, name);
	fs.writeFileSync(file, text);
	return file;
};
const runWorker = (brief) => spawnSync(process.execPath, [worker, "--poll", "0.1", "--out", out, "--lane", "alpha", "--brief", brief], {
	cwd: lane, encoding: "utf8", timeout: 15_000, env,
});
const runCheck = (brief) => spawnSync(process.execPath, [briefCheck, "--brief", brief, "--tree", lane], {
	cwd: lane, encoding: "utf8", timeout: 15_000, env,
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

const ok = observations.every((entry) => entry.ok) && sharedByBoth;
const check = (title, pass, detail = "") => {
	console.log(pass ? "PASS" : "FAIL", title, pass ? "" : detail);
	if (!pass) process.exitCode = 1;
};
// req: R-2585
check("R-2585: brief-check prints what pi-worker would print for the same brief and starts nothing", ok, JSON.stringify({ observations, sharedByBoth }));
