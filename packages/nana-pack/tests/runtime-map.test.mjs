/**
 * @module packages/nana-pack/tests/runtime-map.test.mjs
 * @purpose Pin the runtime-map feature's measure-command rows (R-1271, R-1275, R-1277, R-1278) from OUTSIDE the measure command.
 * @inputs the real scripts/runtime-measure.mjs and packages/nana-pack/lib/runtime-map.mjs, and fixture git repositories this file builds
 * @outputs one PASS / FAIL line per check and a non-zero exit when any check failed
 * @effects process (spawns git, the copied test runner, the real runtime-measure CLI, and fake multi-level process trees for the signal case), disk (temp git repositories and data files under one mkdtemp tree, removed at exit)
 * @errors a FAIL line naming the broken behaviour; a non-zero exit code
 */
// must-meet.md (docs/reviews/runtime-map-2026-10-17/): MM2, MM6, MM8, MM9. MM1 (R-1270, the
// runner's own knob-unset contract) lives in test-runner.test.mjs instead, beside the runner it
// pins; MM3, MM4, MM5 and MM7 (the impact command's rows) land with scripts/code-map.mjs's own
// runtime block.
import { tmpDir } from "./tmp-dir.mjs";
import { measure } from "../../../scripts/runtime-measure.mjs";
import { dataPath, loadRuntime } from "../lib/runtime-map.mjs";
import { COMPLETION_FILE, COVERAGE_ENV, RECORD_FILE } from "../lib/runtime-map-config.mjs";
import { spawn, spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RUNNER = path.join(REPO, "scripts", "test.mjs");
const TEST_LOCKED = path.join(REPO, "scripts", "test-locked.mjs");
const RUNTIME_MEASURE = path.join(REPO, "scripts", "runtime-measure.mjs");
const RUNTIME_MAP_CONFIG = path.join(REPO, "packages", "nana-pack", "lib", "runtime-map-config.mjs");
const RUNTIME_MAP_READER = path.join(REPO, "packages", "nana-pack", "lib", "runtime-map.mjs");
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "runtime-map-test-")));
const posix = process.platform !== "win32";

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const skip = (n, why) => console.log("SKIP", n, "—", why);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const gone = (pid) => { try { process.kill(pid, 0); return false; } catch { return true; } };

/** A throwaway git repository with one commit holding the given files (path -> body). */
function mkGitFixture(name, files) {
	const root = path.join(TD, name);
	for (const [rel, body] of Object.entries(files)) {
		const p = path.join(root, rel);
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, body);
	}
	spawnSync("git", ["init", "-q"], { cwd: root });
	spawnSync("git", ["add", "."], { cwd: root });
	spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture"], { cwd: root });
	return root;
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM2 (R-1271): a measurement credits each test file with the files it (and its node child) ran.
// ════════════════════════════════════════════════════════════════════════════════════════════
const rootMM2 = mkGitFixture("mm2", {
	"scripts/test.mjs": fs.readFileSync(RUNNER, "utf8"),
	"packages/nana-pack/lib/runtime-map-config.mjs": fs.readFileSync(RUNTIME_MAP_CONFIG, "utf8"),
	"packages/probe/moduleA.mjs": "export const A = 1;\n",
	"packages/probe/moduleB.mjs": "export const B = 2;\n",
	"packages/probe/run-child.mjs": 'import { B } from "./moduleB.mjs";\nconsole.log("child saw", B);\n',
	"packages/probe/tests/a.test.mjs": [
		'import { A } from "../moduleA.mjs";',
		'import { U } from "../untracked.mjs";',
		'console.log("PASS a ran", A, U);',
		"",
	].join("\n"),
	"packages/probe/tests/b.test.mjs": [
		'import { spawnSync } from "node:child_process";',
		'import * as path from "node:path";',
		'import { fileURLToPath } from "node:url";',
		'const here = path.dirname(fileURLToPath(import.meta.url));',
		'const r = spawnSync(process.execPath, [path.join(here, "..", "run-child.mjs")], { env: { PATH: process.env.PATH }, encoding: "utf8" });',
		'console.log("PASS b ran", r.status, r.stdout);',
		"",
	].join("\n"),
});
// written AFTER the commit, so it is never added to git — the "credits no untracked file" case
fs.writeFileSync(path.join(rootMM2, "packages", "probe", "untracked.mjs"), "export const U = 3;\n");

function injectedRunnerStart({ root, env, coverageDir }) {
	return spawn(process.execPath, [path.join(root, "scripts", "test.mjs")], {
		cwd: root,
		env: { ...env, [COVERAGE_ENV]: coverageDir },
		stdio: "ignore",
	});
}
const dataMM2 = path.join(TD, "mm2-data.json");
await measure({ root: rootMM2, dataFile: dataMM2, start: injectedRunnerStart });
const exitMM2 = process.exitCode;
process.exitCode = undefined;
const dataMM2Result = JSON.parse(fs.readFileSync(dataMM2, "utf8"));
const aEntry = dataMM2Result.tests?.["packages/probe/tests/a.test.mjs"];
const bEntry = dataMM2Result.tests?.["packages/probe/tests/b.test.mjs"];
const noUntrackedMM2 = !Object.values(dataMM2Result.tests ?? {}).some((t) => (t.ran ?? []).includes("packages/probe/untracked.mjs"));
// req: R-1271
check("R-1271: a fixture measurement credits each test file with the tracked files it ran, a node child's files included when the child's environment lacks the coverage variable, with the file's label and seconds, and credits no untracked file",
	exitMM2 === 0
		&& aEntry?.label === "PASS" && typeof aEntry?.seconds === "number" && (aEntry?.ran ?? []).includes("packages/probe/moduleA.mjs")
		&& bEntry?.label === "PASS" && typeof bEntry?.seconds === "number"
		&& (bEntry?.ran ?? []).includes("packages/probe/run-child.mjs") && (bEntry?.ran ?? []).includes("packages/probe/moduleB.mjs")
		&& noUntrackedMM2,
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM6 (R-1275): a bad completion record leaves earlier data unchanged and exits non-zero.
// ════════════════════════════════════════════════════════════════════════════════════════════
const rootMM6 = mkGitFixture("mm6", { "README.md": "fixture\n" });
function fakeChild() {
	const ee = new EventEmitter();
	ee.pid = 999999;
	return ee;
}
function startFakeFolder(extra) {
	return ({ coverageDir }) => {
		const dir = path.join(coverageDir, "0000");
		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(path.join(dir, RECORD_FILE), JSON.stringify({ path: "fake/a.test.mjs", label: "PASS", seconds: 1 }));
		extra?.(coverageDir);
		const child = fakeChild();
		setImmediate(() => child.emit("exit", 0, null));
		return child;
	};
}
const dataMM6 = path.join(TD, "mm6-data.json");
const earlierMM6 = JSON.stringify({ schema: 1, hashes: {}, tests: { marker: { label: "PASS", seconds: 0, ran: [] } } });
fs.writeFileSync(dataMM6, earlierMM6);

await measure({ root: rootMM6, dataFile: dataMM6, start: startFakeFolder(), stopWaitMs: 200 });
const exitNoCompletion = process.exitCode;
process.exitCode = undefined;
const unchangedNoCompletion = fs.readFileSync(dataMM6, "utf8") === earlierMM6;

await measure({
	root: rootMM6,
	dataFile: dataMM6,
	start: startFakeFolder((coverageDir) => fs.writeFileSync(path.join(coverageDir, COMPLETION_FILE), JSON.stringify({ files: 5 }))),
	stopWaitMs: 200,
});
const exitWrongCount = process.exitCode;
process.exitCode = undefined;
const unchangedWrongCount = fs.readFileSync(dataMM6, "utf8") === earlierMM6;

// req: R-1275
check("R-1275: a run with no completion record, or with a count that differs from the records read, leaves the earlier runtime data byte for byte unchanged and exits non-zero",
	exitNoCompletion !== 0 && unchangedNoCompletion && exitWrongCount !== 0 && unchangedWrongCount,
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM8 (R-1277): off Windows, SIGINT/SIGTERM end the suite's whole tree without touching the
// caller, which shares the measure command's own process group.
// ════════════════════════════════════════════════════════════════════════════════════════════
const LEVEL_SCRIPT = path.join(TD, "tree-level.mjs");
fs.writeFileSync(LEVEL_SCRIPT, [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	'import { spawn } from "node:child_process";',
	"const depth = Number(process.argv[2]);",
	"const outDir = process.argv[3];",
	"fs.writeFileSync(path.join(outDir, `level-${depth}.pid`), String(process.pid));",
	"if (depth > 1) spawn(process.execPath, [process.argv[1], String(depth - 1), outDir], { detached: true, stdio: \"ignore\" }).unref();",
	'else fs.writeFileSync(path.join(outDir, "ready"), "1");',
	"setTimeout(() => {}, 120000);",
	"",
].join("\n"));
const CALLER_SCRIPT = path.join(TD, "fake-caller.mjs");
fs.writeFileSync(CALLER_SCRIPT, [
	'import { spawn } from "node:child_process";',
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	"const [, , wrapperPath, outDir] = process.argv;",
	'const wrapper = spawn(process.execPath, [wrapperPath], { stdio: "ignore" });',
	'fs.writeFileSync(path.join(outDir, "measure.pid"), String(wrapper.pid));',
	'wrapper.on("exit", (code) => { try { fs.writeFileSync(path.join(outDir, "measure-exit.txt"), String(code)); } catch {} });',
	"setTimeout(() => {}, 120000);",
	"",
].join("\n"));
const STOP_WAIT_TEST_MS = 400; // chosen: short enough to keep the check fast, long enough for a real SIGKILL tree-kill
function writeWrapperScript(wrapperPath, { outDir, root, dataFile }) {
	fs.writeFileSync(wrapperPath, [
		`import { measure } from ${JSON.stringify(RUNTIME_MEASURE)};`,
		'import { spawn } from "node:child_process";',
		'import * as fs from "node:fs";',
		'import * as path from "node:path";',
		"function fakeStart({ coverageDir }) {",
		`	fs.writeFileSync(${JSON.stringify(path.join(outDir, "coverage-dir.txt"))}, coverageDir);`,
		`	return spawn(process.execPath, [${JSON.stringify(LEVEL_SCRIPT)}, "3", ${JSON.stringify(outDir)}], { detached: true, stdio: "ignore" });`,
		"}",
		`await measure({ root: ${JSON.stringify(root)}, dataFile: ${JSON.stringify(dataFile)}, start: fakeStart, stopWaitMs: ${STOP_WAIT_TEST_MS} });`,
		"process.exit(process.exitCode ?? 0);",
		"",
	].join("\n"));
}

async function runStopCase(signal) {
	const outDir = path.join(TD, `mm8-${signal}`);
	fs.mkdirSync(outDir, { recursive: true });
	const root = mkGitFixture(`mm8-root-${signal}`, { "README.md": "fixture\n" });
	const dataFile = path.join(TD, `mm8-data-${signal}.json`);
	const wrapperPath = path.join(TD, `mm8-wrapper-${signal}.mjs`);
	writeWrapperScript(wrapperPath, { outDir, root, dataFile });
	const caller = spawn(process.execPath, [CALLER_SCRIPT, wrapperPath, outDir], { stdio: "ignore" });
	try {
		const readyPath = path.join(outDir, "ready");
		const readyDeadline = Date.now() + 10000;
		while (!fs.existsSync(readyPath) && Date.now() < readyDeadline) await sleep(50);
		if (!fs.existsSync(readyPath)) return false;
		const measurePid = Number(fs.readFileSync(path.join(outDir, "measure.pid"), "utf8"));
		try { process.kill(measurePid, signal); } catch {}
		await sleep(10);
		try { process.kill(measurePid, signal); } catch {}

		const margin = STOP_WAIT_TEST_MS + 4000; // the stop wait plus a margin, named here once
		const pidFiles = ["level-1.pid", "level-2.pid", "level-3.pid"].map((f) => path.join(outDir, f));
		const deadline = Date.now() + margin;
		let treeGone = false;
		while (Date.now() < deadline) {
			if (pidFiles.every((f) => fs.existsSync(f))) {
				const pids = pidFiles.map((f) => Number(fs.readFileSync(f, "utf8")));
				if (pids.every((pid) => gone(pid))) { treeGone = true; break; }
			}
			await sleep(50);
		}
		const callerAlive = !gone(caller.pid);
		let measureExit = null;
		const exitDeadline = Date.now() + margin;
		while (Date.now() < exitDeadline) {
			if (fs.existsSync(path.join(outDir, "measure-exit.txt"))) {
				measureExit = fs.readFileSync(path.join(outDir, "measure-exit.txt"), "utf8").trim();
				break;
			}
			await sleep(50);
		}
		const coverageDirPath = fs.existsSync(path.join(outDir, "coverage-dir.txt")) ? fs.readFileSync(path.join(outDir, "coverage-dir.txt"), "utf8") : null;
		const coverageGone = !!coverageDirPath && !fs.existsSync(coverageDirPath);
		return treeGone && callerAlive && coverageGone && measureExit !== null && measureExit !== "0";
	} finally {
		try { process.kill(caller.pid, "SIGKILL"); } catch {}
	}
}

if (posix) {
	const sigintOk = await runStopCase("SIGINT");
	const sigtermOk = await runStopCase("SIGTERM");
	// req: R-1277
	check("R-1277: off Windows, SIGINT or SIGTERM sent twice to the measure command while a fake three-level suite runs ends the whole tree within the stop wait, removes the coverage folder, leaves the caller alive and exits non-zero", sigintOk && sigtermOk);
} else {
	skip("R-1277: off Windows, SIGINT or SIGTERM sent twice to the measure command while a fake three-level suite runs ends the whole tree within the stop wait, removes the coverage folder, leaves the caller alive and exits non-zero", "runs only off Windows (R-1277 excludes it)");
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM9 (R-1278): the real measure command, run from a linked worktree with no override, writes
// nana/runtime-map.json under the git common directory, and the impact reader resolves the same
// file from the main checkout.
// ════════════════════════════════════════════════════════════════════════════════════════════
const mainMM9 = mkGitFixture("mm9-main", {
	"scripts/test.mjs": fs.readFileSync(RUNNER, "utf8"),
	"scripts/test-locked.mjs": fs.readFileSync(TEST_LOCKED, "utf8"),
	"scripts/runtime-measure.mjs": fs.readFileSync(RUNTIME_MEASURE, "utf8"),
	"packages/nana-pack/lib/runtime-map-config.mjs": fs.readFileSync(RUNTIME_MAP_CONFIG, "utf8"),
	"packages/nana-pack/lib/runtime-map.mjs": fs.readFileSync(RUNTIME_MAP_READER, "utf8"),
	"packages/probe/tests/a.test.mjs": 'console.log("PASS mm9 ran");\n',
});
const worktreeMM9 = path.join(TD, "mm9-worktree");
spawnSync("git", ["worktree", "add", "-b", "mm9-wt", worktreeMM9, "HEAD"], { cwd: mainMM9 });

const gitCommonDirOut = spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd: worktreeMM9, encoding: "utf8" }).stdout.trim();
const resolvedCommonDir = path.resolve(worktreeMM9, gitCommonDirOut);
const nanaDirMM9 = path.join(resolvedCommonDir, "nana");
const existedBeforeMM9 = fs.existsSync(nanaDirMM9);

const lockDirMM9 = path.join(TD, "mm9-lock");
const mm9Env = {
	...process.env,
	NANA_SUITE_TEST_COMMAND: JSON.stringify([process.execPath, path.join(worktreeMM9, "scripts", "test.mjs")]),
	NANA_SUITE_LOCK_DIR: lockDirMM9,
	npm_execpath: "/dummy/npm-cli.js",
};
delete mm9Env.NANA_RUNTIME_MAP_FILE;
const mm9Run = spawnSync(process.execPath, [path.join(worktreeMM9, "scripts", "runtime-measure.mjs")], {
	cwd: worktreeMM9, env: mm9Env, encoding: "utf8", timeout: 60000,
});

const dataFileMM9 = path.join(nanaDirMM9, "runtime-map.json");
const createdNanaMM9 = !existedBeforeMM9 && fs.existsSync(nanaDirMM9);
const exactlyOneFileMM9 = fs.existsSync(dataFileMM9) && fs.readdirSync(nanaDirMM9).length === 1;
const fromMainMM9 = dataPath(mainMM9, { env: {} });
const readFromMainMM9 = loadRuntime(fromMainMM9);

// req: R-1278
check("R-1278: run from a linked worktree with no override, the real measure command writes nana/runtime-map.json under the git common directory and impact in the main checkout reads it",
	mm9Run.status === 0 && createdNanaMM9 && exactlyOneFileMM9 && fromMainMM9 === dataFileMM9 && readFromMainMM9.ok === true,
);

console.log(fails ? `\n${fails} check(s) failed` : "\nall checks passed");
process.exit(fails ? 1 : 0);
