/**
 * @module packages/nana-pack/tests/runtime-map.test.mjs
 * @purpose Pin the runtime-map feature's nine must-meet rows (R-1271..R-1278) from OUTSIDE the measure command and the impact reader.
 * @inputs the real scripts/runtime-measure.mjs, packages/nana-pack/lib/runtime-map.mjs and scripts/code-map.mjs, fixture git repositories this file builds, and the real checkout's own tracked files and hashes for the --impact fixtures
 * @outputs one PASS / FAIL line per check and a non-zero exit when any check failed
 * @effects process (spawns git, the copied test runner, the real code-map and runtime-measure CLIs, and fake multi-level process trees for the signal case), disk (temp git repositories and data files under one mkdtemp tree, removed at exit)
 * @errors a FAIL line naming the broken behaviour; a non-zero exit code
 */
// must-meet.md (docs/reviews/runtime-map-2026-10-17/): MM2 to MM9. MM1 (R-1270, the runner's own
// knob-unset contract) lives in test-runner.test.mjs instead, beside the runner it pins.
//
// MM3, MM4, MM5 and MM7 spawn the REAL scripts/code-map.mjs CLI against THIS checkout (never a
// fixture clone) with NANA_RUNTIME_MAP_FILE pointed at fixture data this file builds from the
// checkout's OWN current tracked list and hashes (computed with the real hashFile at check time),
// so the "matches" case matches on any checkout, dirty or not, and nothing here reads or writes
// this clone's real runtime data.
import { tmpDir } from "./tmp-dir.mjs";
import { measure } from "../../../scripts/runtime-measure.mjs";
import { hashFile } from "../lib/runtime-map.mjs";
import { COMPLETION_FILE, COVERAGE_ENV, NOTE_PREFIX, RECORD_FILE } from "../lib/runtime-map-config.mjs";
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
const CODE_MAP = path.join(REPO, "scripts", "code-map.mjs");
const GENERATOR = path.join(REPO, "templates", "typescript", "template", "scripts", "code-map.mjs");
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
const MM2_SLEEP_MS = 300; // chosen: a lower bound the recorded seconds must clear; no upper bound asserted
const rootMM2 = mkGitFixture("mm2", {
	"scripts/test.mjs": fs.readFileSync(RUNNER, "utf8"),
	"packages/nana-pack/lib/runtime-map-config.mjs": fs.readFileSync(RUNTIME_MAP_CONFIG, "utf8"),
	"packages/probe/moduleA.mjs": "export const A = 1;\n",
	"packages/probe/moduleB.mjs": "export const B = 2;\n",
	"packages/probe/moduleC.mjs": "export const C = 4;\n",
	"packages/probe/run-child.mjs": 'import { B } from "./moduleB.mjs";\nconsole.log("child saw", B);\n',
	"packages/probe/tests/a.test.mjs": [
		'import { A } from "../moduleA.mjs";',
		'import { U } from "../untracked.mjs";',
		`await new Promise((resolve) => setTimeout(resolve, ${MM2_SLEEP_MS}));`,
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
	// a genuinely failing file (sol MUST 1): with every record forced to PASS/0 this fixture
	// alone would still make every MM2 assertion pass, unless the label and the lower-bound
	// seconds below are checked against it specifically.
	"packages/probe/tests/c.test.mjs": [
		'import { C } from "../moduleC.mjs";',
		'console.log("FAIL c is meant to fail", C);',
		"process.exit(1);",
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
const cEntry = dataMM2Result.tests?.["packages/probe/tests/c.test.mjs"];
const noUntrackedMM2 = !Object.values(dataMM2Result.tests ?? {}).some((t) => (t.ran ?? []).includes("packages/probe/untracked.mjs"));
// req: R-1271
check("R-1271: a fixture measurement credits each test file with the tracked files it ran, a node child's files included when the child's environment lacks the coverage variable, with the file's label and seconds, and credits no untracked file",
	exitMM2 === 1 // c.test.mjs fails, and the suite's own exit code is the measure command's too
		&& aEntry?.label === "PASS" && aEntry?.seconds >= MM2_SLEEP_MS / 1000 && (aEntry?.ran ?? []).includes("packages/probe/moduleA.mjs")
		&& bEntry?.label === "PASS" && typeof bEntry?.seconds === "number"
		&& (bEntry?.ran ?? []).includes("packages/probe/run-child.mjs") && (bEntry?.ran ?? []).includes("packages/probe/moduleB.mjs")
		&& cEntry?.label === "FAIL" && typeof cEntry?.seconds === "number" && (cEntry?.ran ?? []).includes("packages/probe/moduleC.mjs")
		&& noUntrackedMM2,
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// MM3, MM4, MM5, MM7: the real scripts/code-map.mjs CLI against THIS checkout, fed fixture data
// built from the checkout's own current tracked list and hashes.
// ════════════════════════════════════════════════════════════════════════════════════════════
function runCodeMap(args, env = {}) {
	const r = spawnSync(process.execPath, [CODE_MAP, ...args], { cwd: REPO, encoding: "utf8", env: { ...process.env, ...env } });
	return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}
const realTracked = spawnSync("git", ["ls-files"], { cwd: REPO, encoding: "utf8" }).stdout.split("\n").filter(Boolean);
function currentHashes() {
	const h = {};
	for (const f of realTracked) h[f] = hashFile(path.join(REPO, f));
	return h;
}
const NAMED_A = "scripts/test.mjs"; // always tracked in this repo
const NAMED_ZERO = "README.md"; // always tracked, never referenced by the fixture's tests
function mkImpactData(file, hashes) {
	fs.writeFileSync(
		file,
		JSON.stringify({
			schema: 1,
			hashes,
			// inserted shortest-first (astra SHOULD 2): a missing sort would print b before a,
			// in insertion order, instead of the expected longest-first a before b.
			tests: {
				"fixture/b.test.mjs": { label: "FAIL", seconds: 1.1, ran: [NAMED_A] },
				"fixture/a.test.mjs": { label: "PASS", seconds: 2.5, ran: [NAMED_A] },
			},
		}),
	);
}
const mm3Data = path.join(TD, "mm3-data.json");
mkImpactData(mm3Data, currentHashes());
const missingData = path.join(TD, "missing-data.json");

const noData = runCodeMap(["--impact", NAMED_A, NAMED_ZERO], { NANA_RUNTIME_MAP_FILE: missingData });
const noDataSuffix = `\n${NOTE_PREFIX} no runtime data; run npm run map:measure\n`;
const staticOk = noData.out.endsWith(noDataSuffix);
const staticPart = staticOk ? noData.out.slice(0, noData.out.length - noDataSuffix.length) : null;

const withData = runCodeMap(["--impact", NAMED_A, NAMED_ZERO], { NANA_RUNTIME_MAP_FILE: mm3Data });
// req: R-1272
check("R-1272: with runtime data, impact prints the generator's output byte for byte, then the measured test files that ran each named file longest first with seconds and a FAIL label, a zero line for a file no test ran, and the not-counted closing line",
	staticOk
		&& withData.out.startsWith(`${staticPart}\n`)
		&& withData.out.includes(`measured tests for ${NAMED_A} (2):`)
		&& withData.out.includes("2.5s  fixture/a.test.mjs")
		&& withData.out.includes("1.1s  fixture/b.test.mjs [FAIL]")
		&& withData.out.indexOf("2.5s") < withData.out.indexOf("1.1s")
		&& withData.out.includes(`measured tests for ${NAMED_ZERO} (0): —`)
		&& withData.out.includes(NOTE_PREFIX)
		&& withData.out.includes("copies run from a temporary folder and children stopped by a signal are not counted"),
);

// req: R-1273
check("R-1273: with no runtime data, impact prints one note naming npm run map:measure after the generator's output and exits with the generator's code",
	staticOk && noData.out.includes("npm run map:measure") && noData.code === 0,
);

function withOverride(file, overrides) {
	const data = JSON.parse(fs.readFileSync(mm3Data, "utf8"));
	overrides(data);
	fs.writeFileSync(file, JSON.stringify(data));
}
const mm5Changed = path.join(TD, "mm5-changed.json");
withOverride(mm5Changed, (data) => {
	data.hashes = currentHashes();
	data.hashes[NAMED_ZERO] = "0".repeat(64); // a tracked file's content differs from its recorded hash
});
const mm5Added = path.join(TD, "mm5-added.json");
withOverride(mm5Added, (data) => {
	data.hashes = currentHashes();
	delete data.hashes[NAMED_ZERO]; // git tracks it now; the data does not hold it
});
const mm5Removed = path.join(TD, "mm5-removed.json");
withOverride(mm5Removed, (data) => {
	data.hashes = currentHashes();
	data.hashes["no/such/file.txt"] = "f".repeat(64); // the data holds a file git no longer tracks
});
function bothBlocksStale(out) {
	return out.includes(`measured tests for ${NAMED_A} (2): [stale]`)
		&& out.includes(`measured tests for ${NAMED_ZERO} (0): — [stale]`);
}
const mm5Cases = [mm5Changed, mm5Added, mm5Removed].map((f) => runCodeMap(["--impact", NAMED_A, NAMED_ZERO], { NANA_RUNTIME_MAP_FILE: f }));

// A fourth case (sol MUST 3, astra SHOULD 1): an unstaged deletion of a tracked file. git
// ls-files still names it (only `git rm` would drop it), so hashing it off disk must not throw —
// a missing file counts as changed, same as any other content mismatch. This never touches THIS
// checkout (build brief 4): a throwaway fixture repository under the test's own temp folder, the
// same shape MM9 already builds, holds the one file that gets deleted.
const mm5DeletedConfig = {
	roots: ["probe"],
	moduleExtensions: [".mjs"],
	mapPath: "docs/code-map.md",
	runner: "npm run",
	packages: [{ id: "mm5-deleted", prefix: "" }],
	layers: [{ id: "all", title: "All", blurb: "x", match: "^probe/" }],
};
const rootMM5Deleted = mkGitFixture("mm5-deleted", {
	"code-map.config.json": JSON.stringify(mm5DeletedConfig),
	"scripts/code-map.mjs": fs.readFileSync(CODE_MAP, "utf8"),
	"templates/typescript/template/scripts/code-map.mjs": fs.readFileSync(GENERATOR, "utf8"),
	"packages/nana-pack/lib/runtime-map-config.mjs": fs.readFileSync(RUNTIME_MAP_CONFIG, "utf8"),
	"packages/nana-pack/lib/runtime-map.mjs": fs.readFileSync(RUNTIME_MAP_READER, "utf8"),
	"probe/other.mjs": "export const O = 1;\n", // the path this case queries; stays on disk throughout
	"probe/target.mjs": "export const T = 2;\n", // deleted below, unstaged
});
const mm5DeletedData = path.join(TD, "mm5-deleted-data.json");
fs.writeFileSync(mm5DeletedData, JSON.stringify({
	schema: 1,
	hashes: {
		"probe/other.mjs": hashFile(path.join(rootMM5Deleted, "probe", "other.mjs")),
		"probe/target.mjs": hashFile(path.join(rootMM5Deleted, "probe", "target.mjs")),
	},
	tests: {},
}));
fs.unlinkSync(path.join(rootMM5Deleted, "probe", "target.mjs")); // unstaged: still in git ls-files
const mm5DeletedResult = spawnSync(process.execPath, [path.join(rootMM5Deleted, "scripts", "code-map.mjs"), "--impact", "probe/other.mjs"], {
	cwd: rootMM5Deleted, encoding: "utf8", env: { ...process.env, NANA_RUNTIME_MAP_FILE: mm5DeletedData },
});
const mm5DeletedOut = (mm5DeletedResult.stdout ?? "") + (mm5DeletedResult.stderr ?? "");
const mm5DeletedOk = mm5DeletedResult.status === 0 && mm5DeletedOut.includes("measured tests for probe/other.mjs (0): — [stale]");

// req: R-1274
check("R-1274: impact marks the whole runtime section stale after a tracked file is changed, added or removed, a section with no measured test included",
	mm5Cases.every((r) => r.code === 0 && bothBlocksStale(r.out)) && mm5DeletedOk,
);

const garbageData = path.join(TD, "garbage-data.json");
fs.writeFileSync(garbageData, "not json {{{");
const checkNoOverride = runCodeMap(["--check"]);
const checkMissing = runCodeMap(["--check"], { NANA_RUNTIME_MAP_FILE: missingData });
const checkValid = runCodeMap(["--check"], { NANA_RUNTIME_MAP_FILE: mm3Data });
const checkGarbage = runCodeMap(["--check"], { NANA_RUNTIME_MAP_FILE: garbageData });
// req: R-1276
check("R-1276: the map check's output and exit code are the same with no runtime data, valid data and garbage data",
	checkNoOverride.out === checkMissing.out && checkMissing.out === checkValid.out && checkValid.out === checkGarbage.out
		&& checkNoOverride.code === checkMissing.code && checkMissing.code === checkValid.code && checkValid.code === checkGarbage.code,
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
const mm9Config = {
	roots: ["scripts", "packages/probe"],
	moduleExtensions: [".mjs"],
	mapPath: "docs/code-map.md",
	runner: "npm run",
	packages: [{ id: "mm9", prefix: "" }],
	layers: [{ id: "all", title: "All", blurb: "x", match: "^(scripts/|packages/)" }],
};
const mainMM9 = mkGitFixture("mm9-main", {
	"code-map.config.json": JSON.stringify(mm9Config),
	"scripts/test.mjs": fs.readFileSync(RUNNER, "utf8"),
	"scripts/test-locked.mjs": fs.readFileSync(TEST_LOCKED, "utf8"),
	"scripts/runtime-measure.mjs": fs.readFileSync(RUNTIME_MEASURE, "utf8"),
	"scripts/code-map.mjs": fs.readFileSync(CODE_MAP, "utf8"),
	"templates/typescript/template/scripts/code-map.mjs": fs.readFileSync(GENERATOR, "utf8"),
	"packages/nana-pack/lib/runtime-map-config.mjs": fs.readFileSync(RUNTIME_MAP_CONFIG, "utf8"),
	"packages/nana-pack/lib/runtime-map.mjs": fs.readFileSync(RUNTIME_MAP_READER, "utf8"),
	"packages/probe/moduleMM9.mjs": "export const M = 1;\n",
	"packages/probe/tests/a.test.mjs": [
		'import { M } from "../moduleMM9.mjs";',
		'console.log("PASS mm9 ran", M);',
		"",
	].join("\n"),
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

// the real impact command (sol MUST 2): run from the fixture's MAIN checkout, no override, so it
// has to resolve the same shared data file dataPath would, on its own, to show anything at all.
const impactEnvMM9 = { ...process.env };
delete impactEnvMM9.NANA_RUNTIME_MAP_FILE;
const mm9Impact = spawnSync(process.execPath, [path.join(mainMM9, "scripts", "code-map.mjs"), "--impact", "packages/probe/moduleMM9.mjs"], {
	cwd: mainMM9, env: impactEnvMM9, encoding: "utf8",
});
const mm9ImpactOut = (mm9Impact.stdout ?? "") + (mm9Impact.stderr ?? "");

// req: R-1278
check("R-1278: run from a linked worktree with no override, the real measure command writes nana/runtime-map.json under the git common directory and impact in the main checkout reads it",
	mm9Run.status === 0 && createdNanaMM9 && exactlyOneFileMM9
		&& mm9Impact.status === 0
		&& mm9ImpactOut.includes("measured tests for packages/probe/moduleMM9.mjs (1):")
		&& mm9ImpactOut.includes("packages/probe/tests/a.test.mjs"),
);

console.log(fails ? `\n${fails} check(s) failed` : "\nall checks passed");
process.exit(fails ? 1 : 0);
