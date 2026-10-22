/**
 * @module packages/nana-pack/tests/test-runner-parallel.test.mjs
 * @purpose Pin the test runner's --jobs=N parallel-pool contract (R-1470..R-1475, R-1477) from OUTSIDE it.
 * @inputs scripts/test.mjs, every packages/nana-pack/lib/*.mjs module its import lines name, and the suite config's land dependency (copied
 *  verbatim into each throwaway root, so the real bytes run, read from source), the fixture test files
 *  this file writes, and env PROBE_OUT it hands each child
 * @outputs one PASS / FAIL line per check and a non-zero exit when any check failed
 * @effects process (runs the copied runner as a child per case; two cases leave a running process tree the
 *  runner must kill on signal, reaped here if it does not), disk (one mkdtemp tree holding every fixture
 *  root, removed at exit)
 * @errors a FAIL line naming the broken runner behaviour; a non-zero exit code
 */
// must-meet.md (docs/reviews/parallel-runner-2026-10-19/) is the plan of record: R-1470 to R-1475 and
// R-1477 (R-1476 lives in test-locked.test.mjs instead, beside the command it changes).
//
// mkRoot copies the real scripts/test.mjs plus every packages/nana-pack/lib/*.mjs module ITS OWN import
// lines name (parsed from its source) and suite-records-config's required land-config dependency. Fixtures report their observations by writing JSON
// into $PROBE_OUT rather than printing, and derive overlap from {start, end} timestamps they record
// themselves — never from guessing at scheduling.
import { tmpDir } from "./tmp-dir.mjs";
import { RUN_ALONE } from "../lib/test-runner-config.mjs";
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const RUNNER = path.join(REPO, "scripts", "test.mjs");
const RUNNER_SOURCE = fs.readFileSync(RUNNER, "utf8");
const LIB_DIR = path.join(REPO, "packages", "nana-pack", "lib");
const LIB_NAMES = [...new Set([
	...[...RUNNER_SOURCE.matchAll(/from\s+"\.\.\/packages\/nana-pack\/lib\/([\w.-]+\.mjs)"/g)].map((m) => m[1]),
	"land-config.mjs",
])];
const TD = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "runner-parallel-test-")));
const posix = process.platform !== "win32";

let fails = 0;
const check = (n, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : why); if (!ok) fails++; };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function gone(pid, budgetMs = 4000) {
	const until = Date.now() + budgetMs;
	for (;;) {
		try { process.kill(pid, 0); } catch { return true; }
		if (Date.now() > until) return false;
		sleepSync(100);
	}
}
const emptyDir = (d) => { try { return fs.readdirSync(d).length === 0; } catch { return false; } };

// ── fixture roots ────────────────────────────────────────────────────────────────────────────
/** A throwaway repo root: the real runner plus every lib module it imports, plus the given files. */
function mkRoot(name, files) {
	const root = path.join(TD, name);
	fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
	fs.copyFileSync(RUNNER, path.join(root, "scripts", "test.mjs"));
	fs.mkdirSync(path.join(root, "packages", "nana-pack", "lib"), { recursive: true });
	for (const libName of LIB_NAMES) {
		fs.copyFileSync(path.join(LIB_DIR, libName), path.join(root, "packages", "nana-pack", "lib", libName));
	}
	for (const [relPath, body] of Object.entries(files)) {
		const p = path.join(root, relPath);
		fs.mkdirSync(path.dirname(p), { recursive: true });
		fs.writeFileSync(p, body);
	}
	return root;
}

/** Run the copied runner in `root`; returns {code, out, out_dir, tmp}. */
function run(root, args = [], extraEnv = {}, timeoutMs = 120000) {
	const tmp = tmpDir(path.join(TD, "tmpdir-"));
	const out_dir = tmpDir(path.join(TD, "probeout-"));
	const env = { ...process.env, TMPDIR: tmp, TEMP: tmp, TMP: tmp, PROBE_OUT: out_dir, ...extraEnv };
	const r = spawnSync(process.execPath, [path.join(root, "scripts", "test.mjs"), ...args], {
		cwd: root, env, encoding: "utf8", timeout: timeoutMs,
	});
	return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? ""), out_dir, tmp };
}

const totals = (out) => {
	const m = /^(\d+) files: (\d+) PASS, (\d+) FAIL, (\d+) SKIP, (\d+) WARN · checks: (\d+) pass, (\d+) fail, (\d+) skip · [\d.]+s$/m.exec(out);
	return m ? { files: +m[1], pass: +m[2], fail: +m[3], skip: +m[4], warn: +m[5], checks: { pass: +m[6], fail: +m[7], skip: +m[8] } } : null;
};
const readJson = (dir, name) => { try { return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")); } catch { return null; } };
const intervalsOf = (outDir, names) => Object.fromEntries(names.map((n) => [n, readJson(outDir, `${n}.json`)]));

/** The largest number of intervals ([{start,end}, ...]) overlapping at any instant. */
function maxOverlap(intervals) {
	const events = [];
	for (const iv of intervals) {
		if (!iv) continue;
		events.push([iv.start, 1]);
		events.push([iv.end, -1]);
	}
	events.sort((a, b) => a[0] - b[0] || a[1] - b[1]); // an end at the same instant is processed first
	let cur = 0;
	let max = 0;
	for (const [, delta] of events) { cur += delta; if (cur > max) max = cur; }
	return max;
}

/** A fixture that sleeps `ms`, then records {start, end} under `name`.json in $PROBE_OUT. */
const sleepRecordFixture = (name, ms) => [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	"const start = Date.now();",
	`await new Promise((resolve) => setTimeout(resolve, ${ms}));`,
	`fs.writeFileSync(path.join(process.env.PROBE_OUT, ${JSON.stringify(`${name}.json`)}), JSON.stringify({ start, end: Date.now() }));`,
	'console.log("PASS ran");',
	"",
].join("\n");

// ════════════════════════════════════════════════════════════════════════════════════════════
// R-1470: --jobs=N keeps up to N files running at once; a freed slot starts the next file at
// once, never in batches.
// ════════════════════════════════════════════════════════════════════════════════════════════
const root1470 = mkRoot("r1470", {
	"packages/probe/tests/a.test.mjs": sleepRecordFixture("a", 3000),
	"packages/probe/tests/b.test.mjs": sleepRecordFixture("b", 1000),
	"packages/probe/tests/c.test.mjs": sleepRecordFixture("c", 1000),
	"packages/probe/tests/d.test.mjs": sleepRecordFixture("d", 1000),
});
const run1470at2 = run(root1470, ["--jobs=2"]);
const ivl1470at2 = intervalsOf(run1470at2.out_dir, ["a", "b", "c", "d"]);
const run1470at3 = run(root1470, ["--jobs=3"]);
const ivl1470at3 = intervalsOf(run1470at3.out_dir, ["a", "b", "c", "d"]);
const overlap1470at2 = maxOverlap(Object.values(ivl1470at2));
const overlap1470at3 = maxOverlap(Object.values(ivl1470at3));
// the batching discriminator (must-meet.md #2): with a pool, c starts while a (3000ms) still runs;
// with a "start N, wait for all N" batcher, c would only start once BOTH a and b have ended.
const cStartsBeforeAEnds = !!ivl1470at2.a && !!ivl1470at2.c && ivl1470at2.c.start < ivl1470at2.a.end;
// req: R-1470
check("R-1470: --jobs=2 and --jobs=3 keep exactly that many files running and never more, and a freed slot starts the next file while a longer one still runs",
	run1470at2.code === 0 && run1470at3.code === 0 && overlap1470at2 === 2 && overlap1470at3 === 3 && cStartsBeforeAEnds,
	JSON.stringify({ overlap1470at2, overlap1470at3, ivl1470at2, ivl1470at3 }),
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// R-1471: a parallel run that overlaps reports everything a serial run reports, apart from
// timings and file-block order.
// ════════════════════════════════════════════════════════════════════════════════════════════
const PASS_1471 = [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	"const start = Date.now();",
	"await new Promise((resolve) => setTimeout(resolve, 500));",
	'fs.writeFileSync(path.join(process.env.PROBE_OUT, "pass.json"), JSON.stringify({ start, end: Date.now() }));',
	'console.log("PASS ran");',
	"",
].join("\n");
// chosen: 1200ms so this EARLIER-collected failing file (red.test.mjs) always finishes AFTER
// signal.test.mjs and silent.test.mjs (500ms each, LATER in collection order) — forcing the pool
// to complete the run's failing files out of collection order every time (must-meet.md item 2,
// build-brief-2: M15, pushing WARN/failed in completion order, survived because nothing forced
// that divergence before).
const RED_1471 = [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	"const start = Date.now();",
	"await new Promise((resolve) => setTimeout(resolve, 1200));",
	'fs.writeFileSync(path.join(process.env.PROBE_OUT, "red.json"), JSON.stringify({ start, end: Date.now() }));',
	'console.log("not ok - diagnostic assertion");',
	...Array.from({ length: 21 }, (_, i) => `console.log("FAIL diagnostic check ${i + 1}");`),
	"process.exit(1);",
	"",
].join("\n");
const WARN_1471 = [
	"await new Promise((resolve) => setTimeout(resolve, 500));",
	'console.log("FAIL is a reserved token here, not a failed check");',
	'console.log("PASS exit 0 is the verdict");',
	"",
].join("\n");
const ALLSKIP_1471 = [
	"await new Promise((resolve) => setTimeout(resolve, 500));",
	'console.log("SKIP a declared precondition is missing");',
	'console.log("SKIP and another");',
	"",
].join("\n");
const SILENT_1471 = [
	"await new Promise((resolve) => setTimeout(resolve, 500));",
	'console.log("silent file");',
	"",
].join("\n");
const SIGNAL_1471 = [
	"await new Promise((resolve) => setTimeout(resolve, 500));",
	'process.kill(process.pid, "SIGKILL");',
	"",
].join("\n");
const root1471 = mkRoot("r1471", {
	"packages/probe/tests/pass.test.mjs": PASS_1471,
	"packages/probe/tests/red.test.mjs": RED_1471,
	"packages/probe/tests/warn.test.mjs": WARN_1471,
	"packages/probe/tests/allskip.test.mjs": ALLSKIP_1471,
	"packages/probe/tests/silent.test.mjs": SILENT_1471,
	"packages/probe/tests/signal.test.mjs": SIGNAL_1471,
	// a declared SKIP on every platform: the fixture root never has apps/bench/.ext/pi-web-access
	"apps/bench/test/study-tasks.test.mjs": 'console.log("FAIL the declared study-tasks prerequisite skip did not skip");\nprocess.exit(1);\n',
});
const serial1471 = run(root1471, ["--self-test"]);
const parallel1471 = run(root1471, ["--self-test", "--jobs=3"]);
const passIvl1471 = readJson(parallel1471.out_dir, "pass.json");
const redIvl1471 = readJson(parallel1471.out_dir, "red.json");
const overlapped1471 = !!passIvl1471 && !!redIvl1471 && passIvl1471.start < redIvl1471.end && redIvl1471.start < passIvl1471.end;

/** Per-file printed blocks: a result line plus any excerpt lines that directly follow it. */
function blocksOf(output) {
	const blocks = [];
	let current = null;
	for (const line of output.split(/\r?\n/)) {
		if (/^(?:PASS|FAIL|SKIP) {2}/.test(line)) {
			if (current) blocks.push(current.join("\n"));
			current = [line];
		} else if (current && line.startsWith("      | ")) {
			current.push(line);
		} else if (current) {
			blocks.push(current.join("\n"));
			current = null;
		}
	}
	if (current) blocks.push(current.join("\n"));
	return blocks;
}
const stripSeconds = (s) => s.replace(/\d+(?:\.\d+)?s/g, "Xs");
const normalizedBlocks = (out) => blocksOf(out).map(stripSeconds).sort();
const blocksMatch1471 = JSON.stringify(normalizedBlocks(serial1471.out)) === JSON.stringify(normalizedBlocks(parallel1471.out));
const serialTotals1471 = totals(serial1471.out);
const parallelTotals1471 = totals(parallel1471.out);
const totalsMatch1471 = !!serialTotals1471 && JSON.stringify(serialTotals1471) === JSON.stringify(parallelTotals1471);
const linesStartingWith = (out, prefix) => out.split(/\r?\n/).filter((l) => l.startsWith(prefix));
const warnsMatch1471 = JSON.stringify(linesStartingWith(serial1471.out, "WARN ")) === JSON.stringify(linesStartingWith(parallel1471.out, "WARN "));
const lineStartingWith = (out, prefix) => out.split(/\r?\n/).find((l) => l.startsWith(prefix)) ?? null;
const failedMatch1471 = lineStartingWith(serial1471.out, "failed: ") === lineStartingWith(parallel1471.out, "failed: ");
const selfTestLine1471 = lineStartingWith(serial1471.out, "self-test");
const selfTestMatch1471 = selfTestLine1471 !== null
	&& selfTestLine1471 === lineStartingWith(parallel1471.out, "self-test")
	&& selfTestLine1471 === "self-test: every fixture got its expected verdict";
// must-meet.md item 1 (build-brief-2): the pool must remove every finished file's temp root —
// nothing checked that before, so M17 (keep the root instead) survived the seat's wrong-code pairs.
const leftoverTempRoots1471 = fs.existsSync(parallel1471.tmp)
	? fs.readdirSync(parallel1471.tmp).filter((d) => d.startsWith("nana-test-"))
	: ["<tmp folder missing>"];
// req: R-1471
check("R-1471: a parallel run that overlaps reports every label, count, excerpt, warning, failed name, self-test verdict, total and exit code exactly as a serial run",
	serial1471.code !== 0 && serial1471.code === parallel1471.code
		&& overlapped1471 && totalsMatch1471 && warnsMatch1471 && failedMatch1471 && selfTestMatch1471 && blocksMatch1471
		&& leftoverTempRoots1471.length === 0,
	JSON.stringify({ serialTotals1471, parallelTotals1471, overlapped1471, warnsMatch1471, failedMatch1471, selfTestMatch1471, blocksMatch1471, leftoverTempRoots1471, serialCode: serial1471.code, parallelCode: parallel1471.code }),
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// R-1472: files that ran at the same time print their shown output and result line as one
// uninterrupted block.
// ════════════════════════════════════════════════════════════════════════════════════════════
/** A sequence of {owner, kind} entries: "tag" lines (by prefix) and each file's own result line. */
function ownerSequence(out, spec) {
	const seq = [];
	for (const line of out.split(/\r?\n/)) {
		if (line.startsWith(spec.tag1)) { seq.push({ owner: 1, kind: "tag" }); continue; }
		if (line.startsWith(spec.tag2)) { seq.push({ owner: 2, kind: "tag" }); continue; }
		if ((line.startsWith("PASS") || line.startsWith("FAIL")) && line.includes(spec.result1)) { seq.push({ owner: 1, kind: "result" }); continue; }
		if ((line.startsWith("PASS") || line.startsWith("FAIL")) && line.includes(spec.result2)) { seq.push({ owner: 2, kind: "result" }); continue; }
	}
	return seq;
}
/**
 * Exactly two contiguous groups (one transition — no other owner's line sits between two of
 * this owner's lines), each holding both its tag lines and its own result line. The result
 * line sits before the tags in plain/excerpt mode (printed right after the child exits) and
 * after them in --verbose mode (streamed live, then the summary once the child exits) — R-1472
 * only requires the block stay together, not a fixed internal order.
 */
function isContiguousPair(seq) {
	if (seq.length === 0) return false;
	let transitions = 0;
	for (let i = 1; i < seq.length; i++) if (seq[i].owner !== seq[i - 1].owner) transitions++;
	if (transitions !== 1) return false;
	const has = (owner, kind) => seq.some((e) => e.owner === owner && e.kind === kind);
	return has(1, "tag") && has(1, "result") && has(2, "tag") && has(2, "result");
}
// Each fixture also records {start, end}: without that, "no interleaving" would pass vacuously
// against a runner that silently ignored --jobs and ran the two files one at a time (never
// interleaving because they never overlapped at all) — overlap is a precondition, not a detail.
const recordTiming = (name) => [
	'import * as fs from "node:fs";',
	'import * as path from "node:path";',
	"const __start = Date.now();",
	`process.on("exit", () => { try { fs.writeFileSync(path.join(process.env.PROBE_OUT, ${JSON.stringify(`${name}.json`)}), JSON.stringify({ start: __start, end: Date.now() })); } catch {} });`,
].join("\n");
const taggedLines = (tag, n, delayMs) => [
	"const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));",
	`for (let i = 1; i <= ${n}; i++) { await sleep(${delayMs}); console.log(${JSON.stringify(tag)} + "-" + String(i).padStart(4, "0")); }`,
].join("\n");
const rootV1472 = mkRoot("r1472-verbose", {
	"packages/probe/tests/v1.test.mjs": [recordTiming("v1"), taggedLines("v1", 40, 25), 'console.log("PASS tagged fixture ran");', ""].join("\n"),
	"packages/probe/tests/v2.test.mjs": [recordTiming("v2"), taggedLines("v2", 40, 25), 'console.log("PASS tagged fixture ran");', ""].join("\n"),
});
const verboseRun1472 = run(rootV1472, ["--verbose", "--jobs=2"]);
const vSeq1472 = ownerSequence(verboseRun1472.out, { tag1: "v1-", tag2: "v2-", result1: "v1.test.mjs", result2: "v2.test.mjs" });
const vOverlap1472 = maxOverlap([readJson(verboseRun1472.out_dir, "v1.json"), readJson(verboseRun1472.out_dir, "v2.json")]);

const failTaggedLines = (tag, n, delayMs) => [
	"const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));",
	`for (let i = 1; i <= ${n}; i++) { await sleep(${delayMs}); console.log("FAIL " + ${JSON.stringify(tag)} + "-" + String(i).padStart(4, "0")); }`,
	"process.exit(1);",
].join("\n");
const rootR1472 = mkRoot("r1472-plain", {
	"packages/probe/tests/r1.test.mjs": [recordTiming("r1"), failTaggedLines("r1", 25, 25)].join("\n") + "\n",
	"packages/probe/tests/r2.test.mjs": [recordTiming("r2"), failTaggedLines("r2", 25, 25)].join("\n") + "\n",
});
const plainRun1472 = run(rootR1472, ["--jobs=2"]);
const plainSeq1472 = ownerSequence(plainRun1472.out, { tag1: "      | FAIL r1-", tag2: "      | FAIL r2-", result1: "r1.test.mjs", result2: "r2.test.mjs" });
const rOverlap1472 = maxOverlap([readJson(plainRun1472.out_dir, "r1.json"), readJson(plainRun1472.out_dir, "r2.json")]);
// req: R-1472
check("R-1472: files that ran at the same time print their verbose output, or their failing excerpt, and their result line as uninterrupted blocks",
	verboseRun1472.code === 0 && plainRun1472.code === 1 && vOverlap1472 === 2 && rOverlap1472 === 2
		&& isContiguousPair(vSeq1472) && isContiguousPair(plainSeq1472),
	JSON.stringify({ vSeq1472, plainSeq1472, vOverlap1472, rOverlap1472 }),
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// R-1471 (must-meet.md item 3, build-brief-2): the independent review found scripts/test.mjs
// writing its last file block and calling process.exit() right after; a real pipe reader that
// has not drained anything yet can lose that write entirely (probed: a 2 MB console.log before
// process.exit() delivered ZERO bytes to a reader attached after the child had exited).
// spawnSync (the run() helper above) drains continuously as part of its own synchronous loop and
// never reproduces this, so this case spawns the copied runner directly and leaves its stdout and
// stderr UNREAD for a while — the way a slow real pipe reader would — before draining them.
// ════════════════════════════════════════════════════════════════════════════════════════════
const BIG_BLOCK_BYTES = 2_000_000; // chosen: comfortably exceeds any default OS pipe buffer (commonly 64 KB)
const rootPipe1471 = mkRoot("r1471-pipe", {
	"packages/probe/tests/small.test.mjs": [
		"await new Promise((resolve) => setTimeout(resolve, 50));",
		'console.log("PASS small file ran");',
		"",
	].join("\n"),
	"packages/probe/tests/big.test.mjs": [
		"await new Promise((resolve) => setTimeout(resolve, 150));", // finishes after small.test.mjs
		`console.log("FAIL " + "x".repeat(${BIG_BLOCK_BYTES}));`,
		// exitCode, not process.exit(): this fixture's OWN big write must reach the runner's
		// capture intact, or the runner's aggregated block (what this case actually probes) would
		// be corrupted at the source rather than by the bug under test.
		"process.exitCode = 1;",
		"",
	].join("\n"),
});
/** Spawn the copied runner but leave its stdout/stderr UNREAD for `drainAfterMs`, so a real OS
 *  pipe buffer — never spawnSync's own synchronous drain — actually fills while the runner still
 *  has output queued. `safetyMs` force-kills the child so a hang here cannot hang the suite. */
function runLateDrain(root, args, drainAfterMs, safetyMs = 15000) {
	return new Promise((resolve) => {
		const tmp = tmpDir(path.join(TD, "tmpdir-"));
		const out_dir = tmpDir(path.join(TD, "probeout-"));
		const env = { ...process.env, TMPDIR: tmp, TEMP: tmp, TMP: tmp, PROBE_OUT: out_dir };
		const child = spawn(process.execPath, [path.join(root, "scripts", "test.mjs"), ...args], {
			cwd: root, env, stdio: ["ignore", "pipe", "pipe"],
		});
		let out = "";
		let code = null;
		let settled = false;
		const finish = () => {
			if (settled) return;
			settled = true;
			clearTimeout(safety);
			resolve({ code, out, out_dir, tmp });
		};
		child.on("exit", (c) => { code = c; });
		child.on("close", finish);
		const safety = setTimeout(() => { try { child.kill("SIGKILL"); } catch {} finish(); }, safetyMs);
		setTimeout(() => {
			child.stdout.on("data", (c) => { out += c.toString(); });
			child.stderr.on("data", (c) => { out += c.toString(); });
		}, drainAfterMs);
	});
}
const pipeRun1471 = await runLateDrain(rootPipe1471, ["--jobs=2"], 1500);
const pipeTotals1471 = totals(pipeRun1471.out);
const pipeFailedLine1471 = lineStartingWith(pipeRun1471.out, "failed: ");
// req: R-1471
check("R-1471: a last file block over the OS pipe buffer still ends with the totals line and the failed: list, read through a real pipe",
	pipeRun1471.code === 1 && pipeTotals1471 !== null && pipeFailedLine1471 !== null && pipeFailedLine1471.includes("big.test.mjs"),
	JSON.stringify({ code: pipeRun1471.code, pipeTotals1471, pipeFailedLine1471, outLength: pipeRun1471.out.length }),
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// R-1473: a declared run-alone file runs only while no other file runs, with the others still
// overlapping.
// ════════════════════════════════════════════════════════════════════════════════════════════
const REAL_CONFIG_COPY = "test-runner-config.real.mjs";
function mkRootWithAloneOverride(name, aloneFile, files) {
	const root = mkRoot(name, files);
	const configDir = path.join(root, "packages", "nana-pack", "lib");
	const configPath = path.join(configDir, "test-runner-config.mjs");
	// Copy from the REPO's real module directly, never from the root's own copy: mkRoot only
	// copies a lib module the runner's CURRENT import lines name, so before the runner is wired
	// to import test-runner-config.mjs this root would not have one to copy from yet.
	fs.mkdirSync(configDir, { recursive: true });
	fs.copyFileSync(path.join(LIB_DIR, "test-runner-config.mjs"), path.join(configDir, REAL_CONFIG_COPY));
	// ESM: a local export wins over a star re-export of the same name, so JOBS_FLAG, SUITE_JOBS and
	// SUITE_JOBS_ENV stay real while RUN_ALONE is this fixture's own.
	fs.writeFileSync(
		configPath,
		[
			`export * from "./${REAL_CONFIG_COPY}";`,
			`export const RUN_ALONE = Object.freeze({ ${JSON.stringify(aloneFile)}: "fixture: forced alone" });`,
			"",
		].join("\n"),
	);
	return root;
}
// a (pool) ends well before c and d (pool): a wrong pool that lets an "alone" file start as
// soon as ANY slot frees, rather than once the WHOLE pool has drained, would start b around
// when a ends — while c and d are still running — and this fixture is built to catch exactly
// that (W7: an alone file only waits for a free slot).
const root1473 = mkRootWithAloneOverride("r1473", "packages/probe/tests/b.test.mjs", {
	"packages/probe/tests/a.test.mjs": sleepRecordFixture("a", 600),
	"packages/probe/tests/b.test.mjs": sleepRecordFixture("b", 500),
	"packages/probe/tests/c.test.mjs": sleepRecordFixture("c", 2000),
	"packages/probe/tests/d.test.mjs": sleepRecordFixture("d", 2000),
});
const run1473 = run(root1473, ["--jobs=3"]);
const ivl1473 = intervalsOf(run1473.out_dir, ["a", "b", "c", "d"]);
const poolOverlap1473 = maxOverlap([ivl1473.a, ivl1473.c, ivl1473.d]);
const poolEnd1473 = Math.max(ivl1473.a?.end ?? 0, ivl1473.c?.end ?? 0, ivl1473.d?.end ?? 0);
const bRanAlone1473 = !!ivl1473.b && ivl1473.b.start >= poolEnd1473;
// req: R-1473
check("R-1473: a file on the run-alone list runs while no other file runs, and the other files still overlap",
	run1473.code === 0 && poolOverlap1473 >= 2 && bRanAlone1473,
	JSON.stringify({ ivl1473, poolOverlap1473, poolEnd1473 }),
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// R-1474: the declared run-alone list names only collected test files, each with a reason.
// ════════════════════════════════════════════════════════════════════════════════════════════
const runAlonePaths = Object.keys(RUN_ALONE);
const COLLECTED_TEST_PATTERN = /^(?:packages\/[^/]+\/tests|apps\/(?:desk|bench)\/test)\/[^/]+\.test\.mjs$/;
const runAloneOk = runAlonePaths.length > 0 && runAlonePaths.every((p) =>
	COLLECTED_TEST_PATTERN.test(p) && fs.existsSync(path.join(REPO, p)) && typeof RUN_ALONE[p] === "string" && RUN_ALONE[p].trim().length > 0);
// req: R-1474
check("R-1474: the run-alone list names only collected test files, each with a reason", runAloneOk, runAlonePaths.join(", "));

// ════════════════════════════════════════════════════════════════════════════════════════════
// R-1475: SIGINT and SIGTERM during a --jobs run kill every running tree and remove every
// running temp root and the runner's scratch directory (case G from test-runner.test.mjs,
// doubled: two files run at once).
// ════════════════════════════════════════════════════════════════════════════════════════════
const hangFixture1475 = (n) => [
	'import { spawn } from "node:child_process";',
	'import * as fs from "node:fs";',
	`fs.writeFileSync(process.env.PROBE_OUT + "/active-file-tmp${n}.txt", process.env.TMPDIR);`,
	"// chosen: 15s exceeds the signal case's readiness window, and bounds both processes.",
	'const grandchild = spawn(process.execPath, ["-e", "setTimeout(() => {}, 15000)"], { stdio: "ignore" });',
	`fs.writeFileSync(process.env.PROBE_OUT + "/grandchild${n}.pid", String(grandchild.pid));`,
	"setTimeout(() => process.exit(0), 15000);",
	"",
].join("\n");
const root1475 = mkRoot("r1475", {
	"packages/probe/tests/hang1.test.mjs": hangFixture1475(1),
	"packages/probe/tests/hang2.test.mjs": hangFixture1475(2),
});
const signal1475Results = [];
for (const [sig, expectedCode] of [["SIGINT", 130], ["SIGTERM", 143]]) {
	const signalOut = tmpDir(path.join(TD, `r1475-out-${sig}-`));
	const signalTmp = tmpDir(path.join(TD, `r1475-tmp-${sig}-`));
	const signalRunner = spawn(process.execPath, [path.join(root1475, "scripts", "test.mjs"), "--jobs=2"], {
		cwd: root1475,
		env: { ...process.env, TMPDIR: signalTmp, TEMP: signalTmp, TMP: signalTmp, PROBE_OUT: signalOut, NANA_TEST_TIMEOUT_MS: "60000" },
		stdio: ["ignore", "pipe", "pipe", "ipc"],
	});
	let signalOutput = "";
	signalRunner.stdout.on("data", (chunk) => { signalOutput += chunk; });
	signalRunner.stderr.on("data", (chunk) => { signalOutput += chunk; });
	let tmp1, tmp2, pid1, pid2;
	for (let i = 0; i < 100 && (!tmp1 || !tmp2 || !pid1 || !pid2); i++) {
		try { tmp1 = fs.readFileSync(path.join(signalOut, "active-file-tmp1.txt"), "utf8"); } catch {}
		try { tmp2 = fs.readFileSync(path.join(signalOut, "active-file-tmp2.txt"), "utf8"); } catch {}
		try { pid1 = Number(fs.readFileSync(path.join(signalOut, "grandchild1.pid"), "utf8")); } catch {}
		try { pid2 = Number(fs.readFileSync(path.join(signalOut, "grandchild2.pid"), "utf8")); } catch {}
		if (!tmp1 || !tmp2 || !pid1 || !pid2) await wait(50);
	}
	if (posix) signalRunner.kill(sig);
	else signalRunner.send({ type: "runner-terminate", signal: sig });
	const signalExit = await new Promise((resolve) => signalRunner.on("close", (code, signal) => resolve({ code, signal })));
	const tree1Gone = pid1 > 0 && gone(pid1);
	const tree2Gone = pid2 > 0 && gone(pid2);
	if (pid1 > 0 && !tree1Gone) { try { process.kill(pid1, "SIGKILL"); } catch {} }
	if (pid2 > 0 && !tree2Gone) { try { process.kill(pid2, "SIGKILL"); } catch {} }
	signal1475Results.push(
		!!tmp1 && !!tmp2 && tree1Gone && tree2Gone
			&& !fs.existsSync(tmp1) && !fs.existsSync(tmp2)
			&& emptyDir(signalTmp) && signalExit.code === expectedCode && signalOutput.includes(sig),
	);
}
// req: R-1475
check("R-1475: SIGINT and SIGTERM during a parallel run kill every running tree and remove every running temp root (external signals on POSIX; handler trigger on Windows)",
	signal1475Results.every(Boolean),
	JSON.stringify(signal1475Results),
);

// ════════════════════════════════════════════════════════════════════════════════════════════
// R-1477: a bad --jobs argument exits 1 naming it before any file starts.
// ════════════════════════════════════════════════════════════════════════════════════════════
const root1477 = mkRoot("r1477", {
	"packages/probe/tests/marker.test.mjs": [
		'import * as fs from "node:fs";',
		'import * as path from "node:path";',
		'fs.writeFileSync(path.join(process.env.PROBE_OUT, "marker.ran"), "1");',
		'console.log("PASS ran");',
		"",
	].join("\n"),
});
const BAD_JOBS_ARGS = ["--jobs=0", "--jobs=abc", "--jobs=2.5", "--jobs=", "--jobs"];
const badJobsResults = BAD_JOBS_ARGS.map((arg) => {
	const r = run(root1477, [arg]);
	return { arg, ok: r.code === 1 && r.out.includes(arg) && !fs.existsSync(path.join(r.out_dir, "marker.ran")) };
});
// req: R-1477
check("R-1477: --jobs=0, --jobs=abc, --jobs=2.5, --jobs= and a bare --jobs each exit 1 naming the argument before any file starts",
	badJobsResults.every((r) => r.ok),
	JSON.stringify(badJobsResults),
);

fs.rmSync(TD, { recursive: true, force: true });
console.log(fails ? `\n${fails} check(s) failed` : "\nall checks passed");
process.exit(fails ? 1 : 0);
