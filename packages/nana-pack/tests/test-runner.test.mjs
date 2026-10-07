/**
 * @module packages/nana-pack/tests/test-runner.test.mjs
 * @purpose Pin the repo test runner's own contract (R-600..R-618) from OUTSIDE it — the runner is
 *  what every other test's verdict depends on, and until now nothing tested it.
 * @inputs scripts/test.mjs (copied verbatim into each throwaway root, so the real bytes run), the
 *  fixture test files this file writes, and env OUTER_HOME / PROBE_OUT / TMPDIR it hands the child
 * @outputs one PASS / FAIL line per check and a non-zero exit when any check failed
 * @effects process (runs the copied runner as a child per case; one case leaves a detached
 *  grandchild, reaped here), disk (one mkdtemp tree holding every fixture root, removed at exit)
 * @errors a FAIL line naming the broken runner behaviour; a non-zero exit code
 */
// The runner is exercised as a CHILD against tiny fixture packages in a temp tree, never against
// the real suite: a copy of scripts/test.mjs sits at <root>/scripts/test.mjs, so its `root` (the
// parent of its own dir) is the fixture root and `collect()` sees only the fixtures. The copy is
// byte-identical and the file imports nothing but node builtins, so this is still the real
// chokepoint — only its repo is fake.
//
// Fixtures report their observations by writing JSON into $PROBE_OUT rather than printing: without
// --verbose the runner (correctly) hides a passing file's output, which is itself a case here.
// Each case gets its own TMPDIR so "the scratch dir is removed" can be asserted without racing
// other work on the machine.
// Run: node --experimental-strip-types packages/nana-pack/tests/test-runner.test.mjs
import { tmpDir } from "./tmp-dir.mjs";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RUNNER = path.join(REPO, "scripts", "test.mjs");
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "runner-test-")));
// an isolated HOME for this file too, so it holds when run directly and not through the runner;
// OUTER_HOME is what a fixture's per-file HOME must NOT be
const NANA_HOME = path.join(TD, "home");
fs.mkdirSync(NANA_HOME, { recursive: true });
process.env.HOME = NANA_HOME;
process.env.USERPROFILE = NANA_HOME;
const OUTER_HOME = os.homedir();
const posix = process.platform !== "win32";

let fails = 0;
const check = (n, ok) => { console.log(ok ? "PASS" : "FAIL", n); if (!ok) fails++; };
const skip = (n, why) => console.log("SKIP", n, "—", why);

// ── fixture roots ────────────────────────────────────────────────────────────────────────────
/** A throwaway repo root: the real runner at scripts/test.mjs plus the given files. */
function mkRoot(name, files) {
	const root = path.join(TD, name);
	fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
	fs.copyFileSync(RUNNER, path.join(root, "scripts", "test.mjs"));
	for (const [rel, body] of Object.entries(files)) {
		const p = path.join(root, rel);
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, body);
	}
	return root;
}

/** Run the copied runner in `root`; returns {code, out, ms, out_dir, tmp}. */
function run(root, args = [], extraEnv = {}) {
	const tmp = tmpDir(path.join(TD, "tmpdir-"));
	const out_dir = tmpDir(path.join(TD, "probeout-"));
	const env = {
		...process.env,
		TMPDIR: tmp, TEMP: tmp, TMP: tmp,
		PROBE_OUT: out_dir,
		OUTER_HOME,
		...extraEnv,
	};
	const t0 = Date.now();
	const r = spawnSync(process.execPath, [path.join(root, "scripts", "test.mjs"), ...args], {
		cwd: root, env, encoding: "utf8", timeout: 120000,
	});
	return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? ""), ms: Date.now() - t0, out_dir, tmp };
}

const lineFor = (out, needle) => out.split(/\r?\n/).find((l) => l.includes(needle)) ?? "";
const labelFor = (out, needle) => (/^(PASS|FAIL|SKIP)\b/.exec(lineFor(out, needle)) ?? [])[1];
const totals = (out) => {
	const m = /^(\d+) files: (\d+) PASS, (\d+) FAIL, (\d+) SKIP, (\d+) WARN · checks: (\d+) pass, (\d+) fail, (\d+) skip · [\d.]+s$/m.exec(out);
	return m ? { files: +m[1], pass: +m[2], fail: +m[3], skip: +m[4], warn: +m[5], checks: { pass: +m[6], fail: +m[7], skip: +m[8] } } : null;
};
const readJson = (dir, name) => { try { return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")); } catch { return null; } };
const emptyDir = (d) => { try { return fs.readdirSync(d).length === 0; } catch { return false; } };
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
/** Poll until `pid` is gone (or the budget runs out) — the group kill is asynchronous. */
function gone(pid, budgetMs = 4000) {
	const until = Date.now() + budgetMs;
	for (;;) {
		try { process.kill(pid, 0); } catch { return true; }
		if (Date.now() > until) return false;
		sleep(100);
	}
}

const TRAP = (what) => `console.log("FAIL ${what}");\nprocess.exit(1);\n`;

// ── case A: the mixed run — collection, verdicts, labels, tallies, the child env ──────────────
// PATH is pointed at an empty dir so the runner's declared skip for post-edit-hardening
// ("needs `pgrep` on POSIX") fires: that is the only SKIPS entry, and it keys off `pgrep` on PATH.
const noPath = tmpDir(path.join(TD, "nopath-"));
const rootA = mkRoot("A", {
	"packages/probe/ts-probe.ts": "export const bump = (n: number): number => n + 1;\n",
	"packages/probe/tests/a-cwd.test.mjs": [
		'import * as fs from "node:fs";',
		'import { bump } from "../ts-probe.ts";',
		'fs.writeFileSync(process.env.PROBE_OUT + "/cwd.json", JSON.stringify({ cwd: process.cwd(), ts: bump(2), execArgv: process.execArgv }));',
		'console.log("PASS cwd fixture ran");',
		"",
	].join("\n"),
	"packages/probe/tests/b-home.test.mjs": [
		'import * as fs from "node:fs";',
		'import * as os from "node:os";',
		'import * as path from "node:path";',
		"const home = os.homedir();",
		'fs.writeFileSync(path.join(home, ".probe-dotfile"), "x");',
		'fs.writeFileSync(process.env.PROBE_OUT + "/home1.json", JSON.stringify({',
		"\thome, env_home: process.env.HOME, userprofile: process.env.USERPROFILE, outer: process.env.OUTER_HOME,",
		'\tdotfile: fs.existsSync(path.join(home, ".probe-dotfile")),',
		'\touter_touched: fs.existsSync(path.join(process.env.OUTER_HOME, ".probe-dotfile")),',
		"}));",
		'console.log("PASS home fixture ran");',
		"",
	].join("\n"),
	"packages/probe/tests/b2-home.test.mjs": [
		'import * as fs from "node:fs";',
		'import * as os from "node:os";',
		'fs.writeFileSync(process.env.PROBE_OUT + "/home2.json", JSON.stringify({ home: os.homedir() }));',
		'console.log("PASS second home fixture ran");',
		"",
	].join("\n"),
	"packages/probe/tests/c-pass.test.mjs": 'console.log("probe-marker only --verbose shows this");\nconsole.log("PASS pass fixture ran");\n',
	"packages/probe/tests/d-red.test.mjs": 'import * as fs from "node:fs"; import * as os from "node:os"; import * as path from "node:path"; const leaked=fs["mkdtemp"+"Sync"](path.join(os.tmpdir(),"failing-leak-")); fs.writeFileSync(process.env.PROBE_OUT+"/failed-tmpdir.txt",os.tmpdir()); console.log("PASS the red fixture got this far");\nconsole.log("not ok - diagnostic assertion");\n' + Array.from({ length: 21 }, (_, i) => `console.log("FAIL diagnostic check ${i + 1}");`).join("\n") + "\nprocess.exit(1);\n",
	"packages/probe/tests/e-warn.test.mjs": 'console.log("FAIL is a bare token here, not a failed check");\nconsole.log("PASS exit 0 is the verdict");\n',
	"packages/probe/tests/f-allskip.test.mjs": 'console.log("SKIP a declared precondition is missing");\nconsole.log("SKIP and another");\n',
	"packages/probe/tests/g-signal.test.mjs": 'process.kill(process.pid, "SIGKILL");\n',
	"packages/probe/tests/i-temp-leak.test.mjs": [
		'import * as fs from "node:fs";',
		'import * as os from "node:os";',
		'import * as path from "node:path";',
		'const leaked = fs["mkdtemp" + "Sync"](path.join(os.tmpdir(), "fixture-leak-"));',
		'fs.writeFileSync(process.env.PROBE_OUT + "/file-tmp.json", JSON.stringify({ tmp: process.env.TMPDIR, leaked }));',
		'console.log("PASS temporary leak fixture ran");',
		"",
	].join("\n"),
	"packages/probe/tests/h-env.test.mjs": [
		'import * as fs from "node:fs";',
		'fs.writeFileSync(process.env.PROBE_OUT + "/env.json", JSON.stringify({',
		"\thandoff: String(process.env.NANA_HANDOFF), knowledge: String(process.env.NANA_KNOWLEDGE_HOME),",
		"\tstage: String(process.env.NANA_STAGE_KEY), knob: String(process.env.NANA_TEST_TIMEOUT_MS),",
		"\tagent_dir: String(process.env.PI_CODING_AGENT_DIR), pi_bin: String(process.env.PI_BIN),",
		"\tprobe_out: String(!!process.env.PROBE_OUT), tmpdir: process.env.TMPDIR,",
		"}));",
		'console.log("PASS env fixture ran");',
		"",
	].join("\n"),
	// never collected: a nested dir (no recursion), a non-test sibling, a package whose path
	// carries a `fixtures` segment
	"packages/probe/tests/deep/deep.test.mjs": TRAP("a nested tests/deep file was collected"),
	"packages/probe/tests/helper.mjs": TRAP("a non-.test.mjs sibling was collected"),
	"packages/fixtures/tests/trap.test.mjs": TRAP("a fixtures-segment package was collected"),
	// the one declared platform skip; it must never actually run here
	"packages/nana-pack/tests/post-edit-hardening.test.mjs": TRAP("the declared platform skip did not skip"),
});

const A = run(rootA, [], {
	PATH: noPath,
	NANA_HANDOFF: "off",
	NANA_KNOWLEDGE_HOME: "/nope",
	NANA_STAGE_KEY: "sekret",
	NANA_TEST_TIMEOUT_MS: "60000",
	PI_CODING_AGENT_DIR: "/ambient/agent",
	PI_BIN: "/kept/pi",
});
const tA = totals(A.out);
const cwdJson = readJson(A.out_dir, "cwd.json");
const home1 = readJson(A.out_dir, "home1.json");
const home2 = readJson(A.out_dir, "home2.json");
const envJson = readJson(A.out_dir, "env.json");
const fileTmpJson = readJson(A.out_dir, "file-tmp.json");

// req: R-600
check("collects every test file directly under a package tests dir", tA?.files === 11 && ["a-cwd", "b-home", "b2-home", "c-pass", "d-red", "e-warn", "f-allskip", "g-signal", "h-env", "i-temp-leak"].every((n) => A.out.includes(`packages/probe/tests/${n}.test.mjs`)));
// req: R-600
check("collection does not recurse and takes only .test.mjs files", !A.out.includes("deep.test.mjs") && !A.out.includes("helper.mjs"));
// req: R-602
check("a path segment named fixtures is never collected", !A.out.includes("trap.test.mjs"));
// req: R-603
check("each file runs with --experimental-strip-types from its package dir", cwdJson?.cwd === path.join(rootA, "packages", "probe") && cwdJson?.ts === 3 && (cwdJson?.execArgv ?? []).includes("--experimental-strip-types"));
// req: R-604
check("each file gets a fresh temp HOME and USERPROFILE, not the real one", !!home1 && home1.env_home === home1.userprofile && home1.home !== home1.outer && home1.dotfile === true && home1.outer_touched === false);
// req: R-604
check("the temp HOME is per file, not shared between files", !!home2 && home2.home !== home1?.home);
// req: R-917
check("a failing file's TMPDIR and leaked contents are removed", !fs.existsSync(fs.readFileSync(path.join(A.out_dir, "failed-tmpdir.txt"), "utf8")));
// req: R-910
check("a file that exits non-zero is FAIL and the run exits 1", labelFor(A.out, "d-red.test.mjs") === "FAIL" && lineFor(A.out, "d-red.test.mjs").includes("exit 1") && A.code === 1);
check("a file killed by a signal is FAIL, naming the signal", labelFor(A.out, "g-signal.test.mjs") === "FAIL" && /exit SIG/.test(lineFor(A.out, "g-signal.test.mjs")));
// req: R-606 R-910 R-911
check("a FAIL line from an exit-0 file is a WARN and does not flip the verdict", labelFor(A.out, "e-warn.test.mjs") === "PASS" && A.out.includes("WARN packages/probe/tests/e-warn.test.mjs: FAIL line with exit 0") && tA?.warn === 1);
// req: R-608
check("an exit-0 file that printed only SKIP lines is a file-level SKIP", labelFor(A.out, "f-allskip.test.mjs") === "SKIP");
check("without --verbose a passing file's output is hidden and a failing file's diagnostic lines are shown", !A.out.includes("probe-marker") && A.out.includes("| FAIL diagnostic check 1"));
// req: R-916
check("in non-verbose mode a failing file prints its first 20 failing check lines", A.out.includes("| not ok - diagnostic assertion") && A.out.includes("| FAIL diagnostic check 19") && !A.out.includes("| FAIL diagnostic check 20") && !A.out.includes("| FAIL diagnostic check 21") && (A.out.match(/^      \| (?:FAIL|not ok)\b/gm) ?? []).length === 20);
// req: R-616
check("one line per file, then a totals line with both tallies, exiting 1 on a failure", tA?.files === 11 && tA.pass === 7 && tA.fail === 2 && tA.skip === 2 && tA.checks.pass === 8 && tA.checks.fail === 22 && tA.checks.skip === 2 && A.code === 1);
// req: R-917
check("each test gets a unique TMPDIR and the runner removes leaked temp contents", !!fileTmpJson?.tmp && fileTmpJson.tmp !== envJson?.tmpdir && path.basename(fileTmpJson.tmp).startsWith("nana-test-") && fileTmpJson.leaked.startsWith(fileTmpJson.tmp) && !fs.existsSync(fileTmpJson.tmp));
// req: R-618
check("ambient NANA_ vars are scrubbed from the child env and NANA_TEST_ knobs are kept", envJson?.handoff === "undefined" && envJson.knowledge === "undefined" && envJson.stage === "undefined" && envJson.knob === "60000" && envJson.probe_out === "true");
// req: R-618
check("PI_CODING_AGENT_DIR is scrubbed too and the rest of PI_ is left alone", envJson?.agent_dir === "undefined" && envJson.pi_bin === "/kept/pi");

if (posix) {
	// req: R-607
	check("a file declared unrunnable on this platform SKIPs with its reason printed", labelFor(A.out, "post-edit-hardening.test.mjs") === "SKIP" && lineFor(A.out, "post-edit-hardening.test.mjs").includes("needs `pgrep` on POSIX"));
} else {
	skip("a file declared unrunnable on this platform SKIPs with its reason printed", "the only declared skip is POSIX-only");
}

// ── case B: the substring filter, and --verbose ───────────────────────────────────────────────
const B = run(rootA, ["--verbose", "probe/tests/c-pass"]);
const tB = totals(B.out);
// req: R-614
check("a substring argument runs only the files whose repo-relative path contains it", tB?.files === 1 && tB.pass === 1 && B.out.includes("packages/probe/tests/c-pass.test.mjs") && !B.out.includes("d-red.test.mjs") && B.code === 0);
// req: R-613
check("--verbose streams a passing file's own output", B.out.includes("probe-marker only --verbose shows this"));

// ── case C: nothing matched ──────────────────────────────────────────────────────────────────
const C = run(rootA, ["zzz-matches-nothing"]);
// req: R-617
check("no match says so, exits 1, and still removes its scratch dir", C.out.includes("no test files matched") && C.code === 1 && emptyDir(C.tmp));

// ── case D: the per-file timeout kills the whole tree ────────────────────────────────────────
const rootD = mkRoot("D", {
	"packages/probe/tests/hang.test.mjs": [
		'import { spawn } from "node:child_process";',
		'import * as fs from "node:fs";',
		'import * as path from "node:path";',
		'fs.writeFileSync(process.env.PROBE_OUT + "/timeout-tmpdir.txt", process.env.TMPDIR);',
		'fs.mkdirSync(path.join(process.env.TMPDIR, "timeout-leak"));',
		'const g = spawn(process.execPath, ["-e", "setTimeout(()=>{},120000)"], { stdio: "ignore" });',
		'fs.writeFileSync(process.env.PROBE_OUT + "/grandchild.pid", String(g.pid));',
		'console.log("PASS spawned a grandchild inside the tree");',
		"setInterval(() => {}, 1000); // only the runner's timeout ends this",
		"",
	].join("\n"),
});
const D = run(rootD, [], { NANA_TEST_TIMEOUT_MS: "1500" });
const gpid = Number(fs.readFileSync(path.join(D.out_dir, "grandchild.pid"), "utf8"));
// req: R-612
check("NANA_TEST_TIMEOUT_MS sets the per-file timeout and a timed-out file is FAIL", labelFor(D.out, "hang.test.mjs") === "FAIL" && D.out.includes("timed out after 1.5s") && D.code === 1 && D.ms < 60000);
// req: R-609 R-912
check("the timeout kill takes the child's whole process tree with it", gone(gpid));
// req: R-912
check("the scratch dir is removed after the run", emptyDir(D.tmp));
// req: R-917
check("a timed-out file's TMPDIR and leaked contents are removed", !fs.existsSync(fs.readFileSync(path.join(D.out_dir, "timeout-tmpdir.txt"), "utf8")));

// ── case E: tracked repo mutation fails, while untracked files are ignored ────────────────────
const rootMutation = mkRoot("mutation", {
	"packages/probe/tests/change.test.mjs": [
		'import * as fs from "node:fs";',
		'fs.writeFileSync(new URL("../../../tracked.txt", import.meta.url), "changed");',
		'fs.writeFileSync(new URL("../../../untracked.txt", import.meta.url), "new");',
		'console.log("PASS mutation fixture ran");',
		"",
	].join("\n"),
});
spawnSync("git", ["init", "-q"], { cwd: rootMutation });
fs.writeFileSync(path.join(rootMutation, "tracked.txt"), "original");
spawnSync("git", ["add", "tracked.txt"], { cwd: rootMutation });
spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture"], { cwd: rootMutation });
const M = run(rootMutation);
// req: R-918
check("tracked mutation fails naming the tracked file while untracked files do not appear", M.code === 1 && M.out.includes("tracked repository files changed by tests") && M.out.includes("tracked.txt") && !M.out.includes("untracked.txt"));

const rootDirty = mkRoot("mutation-dirty", {
	"packages/probe/tests/change.test.mjs": [
		'import * as fs from "node:fs";',
		'fs.writeFileSync(new URL("../../../tracked.txt", import.meta.url), "dirty after");',
		'console.log("PASS dirty mutation fixture ran");',
		"",
	].join("\n"),
});
spawnSync("git", ["init", "-q"], { cwd: rootDirty });
fs.writeFileSync(path.join(rootDirty, "tracked.txt"), "original");
spawnSync("git", ["add", "tracked.txt"], { cwd: rootDirty });
spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture"], { cwd: rootDirty });
fs.writeFileSync(path.join(rootDirty, "tracked.txt"), "dirty before");
const MD = run(rootDirty);
// req: R-918
check("tracked mutation is detected when the file was already dirty before the run", MD.code === 1 && MD.out.includes("tracked repository files changed by tests") && MD.out.includes("tracked.txt"));

const rootIndex = mkRoot("mutation-index", {
	"packages/probe/tests/stage.test.mjs": [
		'import { spawnSync } from "node:child_process";',
		'import * as fs from "node:fs";',
		'const before = fs.readFileSync(new URL("../../../tracked.txt", import.meta.url), "utf8");',
		'const staged = spawnSync("git", ["add", "-p", "../../tracked.txt"], { cwd: process.cwd(), input: "y\\nn\\n" });',
		'fs.writeFileSync(process.env.PROBE_OUT + "/index-observation.json", JSON.stringify({ before, after: fs.readFileSync(new URL("../../../tracked.txt", import.meta.url), "utf8"), code: staged.status }));',
		"",
	].join("\n"),
});
spawnSync("git", ["init", "-q"], { cwd: rootIndex });
fs.writeFileSync(path.join(rootIndex, "tracked.txt"), "line 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8\nline 9\nline 10\n");
spawnSync("git", ["add", "tracked.txt"], { cwd: rootIndex });
spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-qm", "fixture"], { cwd: rootIndex });
fs.writeFileSync(path.join(rootIndex, "tracked.txt"), "changed 1\nline 2\nline 3\nline 4\nline 5\nline 6\nline 7\nline 8\nline 9\nchanged 10\n");
const MI = run(rootIndex);
const indexObservation = readJson(MI.out_dir, "index-observation.json");
// req: R-918
check("staging an already-dirty tracked file is detected without a working-tree change", MI.code === 1 && MI.out.includes("tracked repository files changed by tests") && MI.out.includes("tracked.txt") && indexObservation?.before === indexObservation?.after && indexObservation?.code === 0);

// ── case F: a descendant that escaped the tree cannot hang the run ───────────────────────────
const rootE = mkRoot("E", {
	"packages/probe/tests/holder.test.mjs": [
		'import { spawn } from "node:child_process";',
		'import * as fs from "node:fs";',
		// detached + stdio:inherit: it leaves the group, survives the group kill, and holds the
		// stdout the runner is reading
		'const g = spawn(process.execPath, ["-e", "setTimeout(()=>{},60000)"], { stdio: "inherit", detached: true });',
		"g.unref();",
		'fs.writeFileSync(process.env.PROBE_OUT + "/holder.pid", String(g.pid));',
		'console.log("PASS spawned a detached stdout holder, then exited");',
		"",
	].join("\n"),
});
const E = run(rootE);
const holder = Number(fs.readFileSync(path.join(E.out_dir, "holder.pid"), "utf8"));
try { process.kill(holder, "SIGKILL"); } catch {}
// req: R-610
check("after a child exits the runner waits only a bounded drain for stdio to close", labelFor(E.out, "holder.test.mjs") === "PASS" && /stdio still open \d+s after exit/.test(E.out) && E.code === 0 && E.ms < 30000);

// ── case G: both termination signals clean the active tree and runner temp roots ─────────────
const rootSignal = mkRoot("signal", {
	"packages/probe/tests/hang.test.mjs": [
		'import { spawn } from "node:child_process";',
		'import * as fs from "node:fs";',
		'fs.writeFileSync(process.env.PROBE_OUT + "/active-file-tmp.txt", process.env.TMPDIR);',
		'const grandchild = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });',
		'fs.writeFileSync(process.env.PROBE_OUT + "/grandchild.pid", String(grandchild.pid));',
		'setInterval(() => {}, 1000);',
		"",
	].join("\n"),
});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const signalResults = [];
for (const [sig, expectedCode] of [["SIGINT", 130], ["SIGTERM", 143]]) {
	const signalOut = tmpDir(path.join(TD, `signal-out-${sig}-`));
	const signalTmp = tmpDir(path.join(TD, `signal-tmp-${sig}-`));
	const signalRunner = spawn(process.execPath, [path.join(rootSignal, "scripts", "test.mjs")], {
		cwd: rootSignal,
		env: { ...process.env, TMPDIR: signalTmp, TEMP: signalTmp, TMP: signalTmp, PROBE_OUT: signalOut, NANA_TEST_TIMEOUT_MS: "60000" },
		stdio: ["ignore", "pipe", "pipe", "ipc"],
	});
	let signalOutput = "";
	signalRunner.stdout.on("data", (chunk) => { signalOutput += chunk; });
	signalRunner.stderr.on("data", (chunk) => { signalOutput += chunk; });
	let fileTmp;
	let grandchildPid;
	for (let i = 0; i < 100 && (!fileTmp || !grandchildPid); i++) {
		try { fileTmp = fs.readFileSync(path.join(signalOut, "active-file-tmp.txt"), "utf8"); } catch {}
		try { grandchildPid = Number(fs.readFileSync(path.join(signalOut, "grandchild.pid"), "utf8")); } catch {}
		if (!fileTmp || !grandchildPid) await wait(50);
	}
	if (posix) signalRunner.kill(sig);
	else signalRunner.send({ type: "runner-terminate", signal: sig });
	const signalExit = await new Promise((resolve) => signalRunner.on("close", (code, signal) => resolve({ code, signal })));
	const treeGone = grandchildPid > 0 && gone(grandchildPid);
	if (grandchildPid > 0 && !treeGone) { try { process.kill(grandchildPid, "SIGKILL"); } catch {} }
	signalResults.push(!!fileTmp && treeGone && !fs.existsSync(fileTmp)
		&& emptyDir(signalTmp) && signalExit.code === expectedCode && signalOutput.includes(sig));
}
// req: R-915 R-917
check("termination cleans the active process tree and runner temp roots (external signals on POSIX; handler trigger on Windows)", signalResults.every(Boolean));

// ── case H: the runner's own self-test ───────────────────────────────────────────────────────
const rootF = mkRoot("F", {});
const F = run(rootF, ["--self-test"]);
check("--self-test adds the runner's own fixtures, each gets its expected verdict, and the run exits non-zero", F.out.includes("self-test: every fixture got its expected verdict") && totals(F.out)?.files === 3 && F.code === 1);
const F2 = run(rootF, [], { NANA_TEST_SELFTEST: "1" });
check("NANA_TEST_SELFTEST=1 is the same as --self-test", F2.out.includes("self-test: every fixture got its expected verdict") && totals(F2.out)?.files === 3 && F2.code === 1);

const testRoots = [
	...fs.readdirSync(path.join(REPO, "packages"), { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => path.join(REPO, "packages", entry.name, "tests")),
	path.join(REPO, "apps", "desk", "test"),
	path.join(REPO, "apps", "bench", "test"),
];
const tempFiles = testRoots.flatMap((dir) => fs.existsSync(dir)
	? fs.readdirSync(dir).filter((name) => name.endsWith(".mjs") && name !== "tmp-dir.mjs").map((name) => path.join(dir, name))
	: []);
const tempSourceOk = tempFiles.every((file) => {
	const source = fs.readFileSync(file, "utf8");
	return !/\b(?:fs\.)?mkdtempSync\s*\(/.test(source)
		&& (!/\btmpDir\s*\(/.test(source) || source.includes('import { tmpDir } from "./tmp-dir.mjs";'));
});
// req: R-917
check("the source check detects direct mkdtemp calls while ignoring only generated leak fixtures", tempSourceOk);
const helperProbe = path.join(TD, "helper-probe.txt");
const helperRun = spawnSync(process.execPath, ["--input-type=module", "-e", [
	`import { tmpDir } from ${JSON.stringify(new URL("./tmp-dir.mjs", import.meta.url).href)};`,
	'import * as fs from "node:fs";',
	'import * as os from "node:os";',
	'import * as path from "node:path";',
	`const root = tmpDir(path.join(os.tmpdir(), "tmp-helper-probe-")); fs.writeFileSync(${JSON.stringify(helperProbe)}, root);`,
].join(" ")], { encoding: "utf8" });
const helperRoot = fs.readFileSync(helperProbe, "utf8");
// req: R-917
check("the shared temp helper removes its registered root when the process exits", helperRun.status === 0 && !fs.existsSync(helperRoot));

fs.rmSync(TD, { recursive: true, force: true });
console.log(fails ? `\n${fails} check(s) failed` : "\nall checks passed");
process.exit(fails ? 1 : 0);
