#!/usr/bin/env node
/**
 * @module scripts/test.mjs
 * @purpose The canonical test runner — run every collected `*.test.mjs` file in its own process tree with a
 *  fresh temp HOME and report one line each.
 * @inputs argv (--verbose, --self-test, --jobs=N, path substrings), env NANA_TEST_SELFTEST, NANA_TEST_TIMEOUT_MS,
 *  NANA_COVERAGE_DIR (runtime-map's coverage knob), NANA_SUITE_RECORD_FILE (whole-run record knob), PI_CODING_AGENT_DIR and CLAUDE_CONFIG_DIR, the test files directly under each package's tests/
 *  dir, apps/desk/test and apps/bench/test (e2e, studies and fixture dirs excluded), the declared run-alone
 *  list (test-runner-config.mjs), and on win32 the declared Windows skip list (windows-skips-config.mjs)
 * @outputs one PASS / FAIL / SKIP line per file with its check counts and timing, the first 20 failing lines of a red
 *  file in non-verbose mode, one counted FAIL line when a finished file's temporary folder remains busy,
 *  a totals line with warnings and the self-test verdict, and the exit code; with
 *  --jobs=N greater than 1 the same report apart from timings and file-block order, each file's shown output
 *  and result line written together as one block; while NANA_COVERAGE_DIR is set, also the knob line and,
 *  per file, a coverage folder with a path/label/seconds record, plus one completion record naming the
 *  collected file count; while NANA_SUITE_RECORD_FILE names a file, one schema-1 whole-run record with the default per-file limit
 * @effects process (spawns each file as `node --experimental-strip-types` in its own group with a child env
 *  scrubbed of every ambient NANA_* but the NANA_TEST_* knobs, and of PI_CODING_AGENT_DIR and CLAUDE_CONFIG_DIR, kills that group or taskkills the tree on
 *  timeout, SIGINT or SIGTERM), disk (a mkdtemp scratch dir, a per-file temp HOME and the self-test
 *  fixtures, with each finished file's removals retried and all removed on every exit path when possible;
 *  while NANA_COVERAGE_DIR is set, a record and a completion
 *  file under that folder, never removed by this runner; while NANA_SUITE_RECORD_FILE is set, its run record)
 * @errors exit 1 when any file failed, timed out, died on a signal, matched nothing, left a temporary
 *  folder that survived its retries, or a self-test fixture missed its expected verdict; exit 130 on
 *  SIGINT and 143 on SIGTERM; exit 0 otherwise
 */
// The canonical test path: `npm test` from the repo root.
//
// Runs every packages/*/tests/*.test.mjs, apps/desk/test/*.test.mjs (unit only — the *.e2e.mjs
// browser suites bind fixed ports and are never run here) and apps/bench/test/*.test.mjs (stub
// children, zero model calls), one file at a time, each as `node --experimental-strip-types
// <file>` from its package dir, each with a FRESH temp HOME and USERPROFILE so no file can read
// (or write) the real machine's dotfiles, and with every ambient NANA_* (but the NANA_TEST_* runner
// knobs) plus PI_CODING_AGENT_DIR and CLAUDE_CONFIG_DIR scrubbed from the child env, so the caller's context cannot
// change what the suite tests. Nothing under apps/bench/studies/** or any fixture(s)/ directory is
// ever collected.
//
// While NANA_COVERAGE_DIR (the runtime-map knob, imported by name from runtime-map-config.mjs)
// names a folder, the runner prints it once before the first file's line, gives each collected
// file its own run-position subfolder as that file's NODE_V8_COVERAGE (so Node's per-file V8
// coverage lands there, its own and any child's that inherits the variable), writes a
// {path, label, seconds} record there for every file including a SKIP, and writes one completion
// record naming the collected file count once the loop ends. The knob sits outside NANA_TEST_ on
// purpose: R-618's scrub above already keeps it out of every test file's own env with no new
// code. Unset (the default), none of this runs and nothing changes.
//
// One line per file — PASS / FAIL / SKIP — then a total; exits 1 if any file failed.
// The verdict is the exit code: a file FAILs if it exits non-zero, dies on a signal, times
// out, or exits 0 without a passing check. A `FAIL` line from an exit-0 file with a PASS is a
// WARN. A file is SKIPped only when its declared precondition is false.
//
// Every child runs in its own process tree; on timeout, Ctrl-C (exit 130) or SIGTERM (exit 143)
// the runner kills that whole tree (POSIX process-group SIGKILL; win32 `taskkill /T /F`) and
// removes its scratch dir. After a child exits the runner waits at most DRAIN_MS for its stdio
// to close — a descendant that escaped the tree and holds the pipe cannot hang the run.
//
//   npm test                     the default set
//   npm test -- --verbose        also stream every file's output
//   npm test -- --self-test      add the runner's own fixtures (red, warn, pipe-holding hang);
//                                the run must exit non-zero
//   NANA_TEST_SELFTEST=1 npm test   same as --self-test
//   npm test -- <substring>...   only files whose path contains one of the substrings
//   npm test -- --jobs=N         keep up to N collected files running at once (default 1); a file
//                                on the declared run-alone list (test-runner-config.mjs) still runs
//                                alone, after the pool of every other file drains
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { COMPLETION_FILE, COVERAGE_ENV, KNOB_LINE, RECORD_FILE } from "../packages/nana-pack/lib/runtime-map-config.mjs";
import { killProcessTree } from "../packages/nana-pack/lib/process-tree.mjs";
import { RECORD_FILE_ENV, RECORD_LINE_PREFIX, RECORD_SCHEMA } from "../packages/nana-pack/lib/suite-records-config.mjs";
import { WINDOWS_SKIPS } from "../packages/nana-pack/lib/windows-skips-config.mjs";
import {
	checkoutSpellingSkipReason,
	JOBS_FLAG,
	RUN_ALONE,
	TEMP_REMOVE_RETRIES,
	TEMP_REMOVE_RETRY_DELAY_MS,
} from "../packages/nana-pack/lib/test-runner-config.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const verbose = argv.includes("--verbose");
const selfTest = argv.includes("--self-test") || process.env.NANA_TEST_SELFTEST === "1";
const filters = argv.filter((a) => !a.startsWith("--"));
const TIMEOUT_MS = Number(process.env.NANA_TEST_TIMEOUT_MS) || 5 * 60 * 1000;
const DRAIN_MS = 2000; // after `exit`, how long stdio may stay open before we stop waiting
const KILL_GRACE_MS = 5000; // after a timeout kill, how long we wait for `exit` at all
const posix = process.platform !== "win32";

// ── --jobs=N (R-1470, R-1477): refused before anything is collected or spawned ──────────────────
const JOBS_RE = new RegExp(`^${JOBS_FLAG}([0-9]+)$`);
function parseJobs(args) {
	let n = 1;
	for (const a of args) {
		if (!a.startsWith("--jobs")) continue;
		const m = JOBS_RE.exec(a);
		const value = m ? Number(m[1]) : NaN;
		if (!m || !Number.isSafeInteger(value) || value < 1) {
			console.log(`[runner] bad --jobs argument: ${a}`);
			process.exit(1);
		}
		n = value;
	}
	return n;
}
const jobs = parseJobs(argv);

const rel = (p) => path.relative(root, p).split(path.sep).join("/");
const isDir = (p) => {
	try {
		return fs.statSync(p).isDirectory();
	} catch {
		return false;
	}
};

// ── cleanup: every active child's tree and the scratch dir, on EVERY exit path ──────────────
// Sets, not a single slot: at --jobs=N greater than 1 several files run at once, so more than
// one child and one file temp root can be active together.
let scratch = null;
const active = new Set(); // every currently-running child
const activeFileTmp = new Set(); // every currently-running file's temp root

/** Kill a child's whole tree. POSIX: it leads its own process group. win32: taskkill /T. */
function killTree(child) {
	killProcessTree(child?.pid);
}

/** Self-test only: the hang fixture records its escaped grandchild so the runner can reap it. */
function reapPipeHolder() {
	try {
		const pid = Number(fs.readFileSync(path.join(scratch, "pipe-holder.pid"), "utf8"));
		if (pid > 0) process.kill(pid, "SIGKILL");
	} catch {}
}

function cleanup() {
	for (const child of active) killTree(child);
	active.clear();
	for (const dir of activeFileTmp) {
		try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
	}
	activeFileTmp.clear();
	if (!scratch) return;
	reapPipeHolder();
	try {
		fs.rmSync(scratch, { recursive: true, force: true });
	} catch {}
	scratch = null;
}
process.on("exit", cleanup);
function terminate(sig) {
	const code = sig === "SIGINT" ? 130 : 143;
	console.log(`\n[runner] ${sig}: killing the active test's process tree, removing scratch`);
	cleanup();
	process.exit(code);
}
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => terminate(sig));
// IPC lets the cross-platform runner test exercise this handler on Windows, where child.kill(signal)
// forcibly terminates the process instead of delivering a catchable POSIX signal.
process.on("message", (message) => {
	if (message?.type === "runner-terminate" && ["SIGINT", "SIGTERM"].includes(message.signal)) terminate(message.signal);
});

// ── discovery ────────────────────────────────────────────────────────────────────────────────
/** Direct children of `dir` named *.test.mjs — no shell globs, no recursion. */
function testsIn(dir) {
	if (!isDir(dir)) return [];
	return fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((e) => e.isFile() && e.name.endsWith(".test.mjs"))
		.map((e) => path.join(dir, e.name))
		.sort();
}

const excluded = (p) => {
	const r = rel(p);
	const segs = r.split("/");
	return r.endsWith(".e2e.mjs") || r.startsWith("apps/bench/studies/") || segs.includes("fixture") || segs.includes("fixtures");
};

function collect() {
	const files = [];
	const pkgs = path.join(root, "packages");
	if (isDir(pkgs)) {
		for (const name of fs.readdirSync(pkgs).sort()) files.push(...testsIn(path.join(pkgs, name, "tests")));
	}
	files.push(...testsIn(path.join(root, "apps", "desk", "test")));
	files.push(...testsIn(path.join(root, "apps", "bench", "test")));
	return files.filter((f) => !excluded(f)).filter((f) => !filters.length || filters.some((s) => rel(f).includes(s)));
}

const onPath = (cmd) => {
	const r = spawnSync(cmd, ["--version"], { stdio: "ignore" });
	return !(r.error && r.error.code === "ENOENT");
};

/** Declared platform skips: file → () => reason | null. A reason means SKIP, printed. */
const SKIPS = {
	"packages/nana-setup/tests/checkout-spelling.test.mjs": checkoutSpellingSkipReason,
	"packages/nana-setup/tests/checkout-converge.test.mjs": () => process.platform === "win32" ? "POSIX-only: skill links are copies on win32 and uninstall refuses there" : null,
	// On POSIX it proves no child was left running with `pgrep -f`, and reads "pgrep missing" as
	// "nothing left" — so without pgrep it would pass without proving anything. On win32 it does
	// not use pgrep (it guards its own POSIX cases), so it always runs there.
	"packages/nana-pack/tests/post-edit-hardening.test.mjs": () =>
		posix && !onPath("pgrep") ? "needs `pgrep` on POSIX (not on PATH)" : null,
	"apps/bench/test/study-tasks.test.mjs": () =>
		fs.existsSync(path.join(root, "apps", "bench", ".ext", "pi-web-access")) ? null : "needs apps/bench/.ext/pi-web-access (not present)",
	// Windows-leg-only (R-1058): spawns exec-form hook entries exactly as the real platform would;
	// every other leg never reaches process.platform === "win32", so it would assert the POSIX
	// shell-form entries never exist and fail for the wrong reason.
	"packages/nana-setup/tests/hooks-win32-exec.test.mjs": () =>
		process.platform !== "win32" ? "runs only on the Windows leg (process.platform !== \"win32\")" : null,
};

// ── self-test fixtures (never in the default set; written to scratch at run time) ─────────────
const FIXTURES = [
	{
		name: "runner-self-test.test.mjs",
		expect: "FAIL",
		body: 'console.log("PASS the runner sees a passing check");\nconsole.log("FAIL the runner must turn this file red");\nprocess.exit(1);\n',
	},
	{
		name: "runner-self-test-warn.test.mjs",
		expect: "PASS+WARN",
		body: 'console.log("FAIL is a reserved token in this parser — prose, not a failed check");\nconsole.log("PASS exit 0 is the verdict");\n',
	},
	{
		// the post-edit-hardening (f) shape: a DETACHED grandchild leaves the group, survives the
		// group kill and holds the inherited stdout open, so `close` never fires on its own
		name: "runner-self-test-hang.test.mjs",
		expect: "FAIL",
		timeoutMs: 3000,
		holdsPipe: true, // only this fixture writes pipe-holder.pid; reapPipeHolder() is gated on it
		// so a sibling fixture ending first in a --jobs pool never reaps it before ITS OWN drain
		// (must-meet.md item 3): that race lost the "stdio still open" note in 5 of 6 runs.
		body: [
			'import { spawn } from "node:child_process";',
			'import * as fs from "node:fs";',
			'// chosen: 15s bounds the detached fixture beyond the 3s runner timeout.',
			'const g = spawn(process.execPath, ["-e", "setTimeout(()=>{},15000)", "nana-runner-selftest-pipe-holder"], { stdio: "inherit", detached: true });',
			'fs.writeFileSync("pipe-holder.pid", String(g.pid));',
			'console.log("PASS spawned a detached grandchild that holds stdout");',
			"// chosen: the 3s self-test timeout fires first; this fixture exits itself after 15s.",
			"setTimeout(() => process.exit(0), 15000);",
			"",
		].join("\n"),
	},
];

// ── one file ─────────────────────────────────────────────────────────────────────────────────
/** Run one file; resolve {code, signal, timedOut, pipesHeld, out}. Always bounded. `liveVerbose`
 *  streams the child's output to stdout as it arrives; otherwise `out` only ever holds it, so a
 *  caller running several files at once can print one file's whole block as a single write. */
function runFile(file, cwd, env, timeoutMs, liveVerbose) {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, ["--experimental-strip-types", file], {
			cwd,
			env,
			stdio: ["ignore", "pipe", "pipe"],
			detached: posix, // own process group, so one group kill takes the whole tree down
			windowsHide: true,
		});
		active.add(child);
		let out = "";
		const take = (chunk) => {
			const s = chunk.toString();
			out += s;
			if (liveVerbose) process.stdout.write(s);
		};
		child.stdout.on("data", take);
		child.stderr.on("data", take);
		let timedOut = false;
		let exited = null;
		let settled = false;
		let drainTimer = null;
		let graceTimer = null;
		const settle = (pipesHeld = false) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			clearTimeout(drainTimer);
			clearTimeout(graceTimer);
			child.stdout.destroy();
			child.stderr.destroy();
			active.delete(child);
			resolve({ code: exited?.code ?? null, signal: exited?.signal ?? null, timedOut, pipesHeld, out });
		};
		const timer = setTimeout(() => {
			timedOut = true;
			killTree(child);
			// if even `exit` never arrives (the kill was denied), stop waiting anyway
			graceTimer = setTimeout(() => {
				out += `\n[runner] no exit ${KILL_GRACE_MS / 1000}s after the timeout kill\n`;
				settle(true);
			}, KILL_GRACE_MS);
		}, timeoutMs);
		child.on("error", (err) => {
			out += `\n[runner] spawn error: ${err.message}\n`;
			settle();
		});
		child.on("exit", (code, signal) => {
			exited = { code, signal };
			clearTimeout(timer);
			clearTimeout(graceTimer);
			// the verdict is known; give the pipes a short bounded drain, then move on
			drainTimer = setTimeout(() => {
				killTree(child); // reap anything still in the tree; an escaped descendant is out of reach
				settle(true);
			}, DRAIN_MS);
		});
		child.on("close", () => settle());
	});
}

const count = (out, word) => out.split(/\r?\n/).filter((l) => new RegExp(`^\\s*${word}\\b`).test(l)).length;

// ── a hermetic child env ─────────────────────────────────────────────────────────────────────
// Every NANA_* var the pack honours changes nana-pack's runtime behaviour, so an ambient one
// silently rewrites what the suite is testing. The live case: a review worker runs under
// NANA_HANDOFF=off (pi-review sets it to mark a non-writer role), the handoff extension then
// skips every write, and handoff-artifact + handoff-symlink go red for a reason that has
// nothing to do with the code under test — which is why the review briefs all say
// `env -u NANA_HANDOFF npm test`. Scrub them here instead, so `npm test` means the same thing
// in every context. NANA_TEST_* is kept: those are the knobs that steer THIS runner.
// PI_CODING_AGENT_DIR and CLAUDE_CONFIG_DIR go too, for the same reason HOME does: they move
// ~/.pi/agent and ~/.claude, so a session that has either set makes install tests target ambient
// runtime folders instead of the defaults under their fake HOME. The rest of PI_* stays: those
// name pi's install (PI_BIN, PI_ROOT, PI_PACKAGE…) and every test that cares sets them itself.
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR" || k === "CLAUDE_CONFIG_DIR";
const BASE_ENV = (() => {
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (SCRUB(k)) delete e[k];
	const count = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
	e[`GIT_CONFIG_KEY_${count}`] = "gc.auto";
	e[`GIT_CONFIG_VALUE_${count}`] = "0";
	e.GIT_CONFIG_COUNT = String(count + 1);
	return e;
})();

// ── main ─────────────────────────────────────────────────────────────────────────────────────
const files = collect();
scratch = fs.mkdtempSync(path.join(os.tmpdir(), `nana-test-runner-${process.pid}-`));
const trackedSnapshot = () => {
	const listed = spawnSync("git", ["ls-files", "-s", "-z"], { cwd: root, encoding: "buffer" });
	if (listed.error || listed.status !== 0) return null;
	const dirty = spawnSync("git", ["diff", "--name-only", "--no-renames", "-z"], { cwd: root, encoding: "buffer" });
	if (dirty.error || dirty.status !== 0) return null;
	const dirtyNames = dirty.stdout.toString("utf8").split("\0").filter(Boolean);
	const entries = listed.stdout.toString("utf8").split("\0").filter(Boolean);
	const snapshot = new Map();
	for (const entry of entries) {
		const tab = entry.indexOf("\t");
		const indexState = entry.slice(0, tab);
		const name = entry.slice(tab + 1);
		const target = path.join(root, name);
		let content;
		try {
			const stat = fs.lstatSync(target);
			const bytes = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(target)) : fs.readFileSync(target);
			content = createHash("sha256").update(bytes).digest("hex");
		} catch {
			content = "<missing>";
		}
		const previous = snapshot.get(name) ?? [];
		previous.push(`${indexState}\0${content}`);
		snapshot.set(name, previous);
	}
	for (const name of dirtyNames) {
		const previous = snapshot.get(name) ?? [];
		previous.push("worktree-diff");
		snapshot.set(name, previous);
	}
	return snapshot;
};
const beforeSnapshot = trackedSnapshot();
const fixtureOf = new Map();
if (selfTest) {
	for (const fx of FIXTURES) {
		const f = path.join(scratch, fx.name);
		fs.writeFileSync(f, fx.body);
		fixtureOf.set(f, fx);
		files.push(f);
	}
}
if (!files.length) {
	console.log("no test files matched");
	process.exit(1); // the exit guard removes scratch
}

const tally = { PASS: 0, FAIL: 0, SKIP: 0 };
const checks = { pass: 0, fail: 0, skip: 0 };
const failed = [];
const warns = [];
const selfTestMismatch = [];
const suiteFiles = new Array(files.length);
const unnamedFailures = [];
const display = (f) => (fixtureOf.has(f) ? "(self-test) " + path.basename(f) : rel(f));
const finishedRemoveOptions = { recursive: true, force: true, maxRetries: TEMP_REMOVE_RETRIES, retryDelay: TEMP_REMOVE_RETRY_DELAY_MS };
/** Remove a finished file's temporary folder without aborting the remaining run. */
function removeFinishedTemp(name, folder) {
	try {
		fs.rmSync(folder, finishedRemoveOptions);
		activeFileTmp.delete(folder);
	} catch (error) {
		const failure = `${name}: temp folder not removed: ${folder} (${error?.code ?? "unknown"})`;
		console.log(`FAIL ${failure}`);
		unnamedFailures.push(failure);
		tally.FAIL++;
	}
}
const width = Math.max(...files.map((f) => display(f).length));
const started = Date.now();

// ── the runtime-map coverage knob (R-1270): inert unless NANA_COVERAGE_DIR is set ──────────────
const coverageDir = process.env[COVERAGE_ENV] || null;
if (coverageDir) console.log(`${KNOB_LINE} ${coverageDir}`);
// Coverage position is the file's place in the collected order, fixed up front — so it stays the
// collection index regardless of the order files actually run or finish in (R-1470..R-1475 design).
const coveragePositionOf = new Map(files.map((f, i) => [f, i]));
const writeRecord = (covFolder, record) => {
	fs.mkdirSync(covFolder, { recursive: true });
	fs.writeFileSync(path.join(covFolder, RECORD_FILE), JSON.stringify(record));
};

/** The declared skip reason for a file, or null: a SKIPS entry, else the win32 Windows-skip fallback. */
function skipReasonFor(file) {
	return SKIPS[rel(file)]?.() ?? (process.platform === "win32" && Object.hasOwn(WINDOWS_SKIPS, rel(file)) ? WINDOWS_SKIPS[rel(file)] : null);
}

/** Build one finished (non-skip) file's tallies, result line and excerpt lines from its run. */
function reportOf(name, r, timeoutMs, fx, secs) {
	const p = count(r.out, "PASS");
	const f = count(r.out, "FAIL");
	const s = count(r.out, "SKIP");
	const exitedOk = r.code === 0 && !r.timedOut;
	const noPassingCheck = exitedOk && p === 0;
	const ok = exitedOk && !noPassingCheck;
	const cause = r.timedOut ? "timed out" : noPassingCheck ? "no passing check" : r.signal ? `signal ${r.signal}` : !ok ? `exit ${r.code}` : "";
	const why = r.timedOut ? `timed out after ${timeoutMs / 1000}s` : noPassingCheck ? "no check passed and no skip was declared" : !ok ? `exit ${r.code ?? r.signal}` : "";
	const held = r.pipesHeld ? `  (stdio still open ${DRAIN_MS / 1000}s after exit — a descendant holds it; not waited for)` : "";
	const stat = `${p} pass${f ? `, ${f} fail` : ""}${s ? `, ${s} skip` : ""}  ${secs}s`;
	const label = ok ? "PASS" : "FAIL";
	const resultLine = `${label}  ${name.padEnd(width)}  ${stat}${why ? `  — ${why}` : ""}${held}`;
	const excerpt = [];
	if (!ok) {
		const tail = r.out.trimEnd().split(/\r?\n/);
		const shown = noPassingCheck ? tail.filter((l) => /^\s*SKIP\b/.test(l)) : tail.filter((l) => /^\s*(?:FAIL|not ok)\b/.test(l));
		for (const l of (shown.length ? shown : tail).slice(0, 20)) excerpt.push(`      | ${l}`);
	}
	const mismatch = fx && fx.expect !== (ok ? (f ? "PASS+WARN" : "PASS") : "FAIL");
	return { p, f, s, ok, label, cause, resultLine, excerpt, warn: ok && f, mismatch };
}

if (jobs === 1) {
	// Today's loop: one file at a time, in collection order, output printed as it happens.
	// RUN_ALONE is never consulted — it only applies where --jobs=N is given with N greater than 1.
	try {
		for (const file of files) {
			const name = display(file);
			const covFolder = coverageDir ? path.join(coverageDir, String(coveragePositionOf.get(file)).padStart(4, "0")) : null;
			const skipReason = skipReasonFor(file);
			if (skipReason) {
				tally.SKIP++;
				console.log(`SKIP  ${name.padEnd(width)}  ${skipReason}`);
				suiteFiles[coveragePositionOf.get(file)] = { path: rel(file), label: "SKIP", seconds: 0 };
				if (covFolder) writeRecord(covFolder, { path: rel(file), label: "SKIP", seconds: 0 });
				continue;
			}
			const fx = fixtureOf.get(file);
			const fileTmp = fs.mkdtempSync(path.join(os.tmpdir(), `nana-test-${process.pid}-`));
			activeFileTmp.add(fileTmp);
			const home = fs.mkdtempSync(path.join(scratch, "home-"));
			const env = { ...BASE_ENV, HOME: home, USERPROFILE: home, TMPDIR: fileTmp, TEMP: fileTmp, TMP: fileTmp };
			if (covFolder) env.NODE_V8_COVERAGE = covFolder;
			if (process.platform === "win32") { env.TEMP = fileTmp; env.TMP = fileTmp; }
			// run from the package dir (the dir holding tests/ or test/), the way every file was written
			const cwd = fx ? scratch : path.dirname(path.dirname(file));
			const timeoutMs = fx?.timeoutMs ?? TIMEOUT_MS;
			const t0 = Date.now();
			const r = await runFile(file, cwd, env, timeoutMs, verbose);
			const secs = ((Date.now() - t0) / 1000).toFixed(1);
			const rep = reportOf(name, r, timeoutMs, fx, secs);
			checks.pass += rep.p;
			checks.fail += rep.f;
			checks.skip += rep.s;
			tally[rep.label]++;
			console.log(rep.resultLine);
			suiteFiles[coveragePositionOf.get(file)] = { path: rel(file), label: rep.label, seconds: Number(secs), ...(rep.cause ? { cause: rep.cause } : {}) };
			if (covFolder) writeRecord(covFolder, { path: rel(file), label: rep.label, seconds: Number(secs) });
			if (rep.warn) warns.push(`WARN ${name}: FAIL line with exit 0`);
			if (rep.mismatch) selfTestMismatch.push(name);
			if (!rep.ok) {
				failed.push(name);
				if (!verbose) for (const l of rep.excerpt) console.log(l);
			}
			if (fx?.holdsPipe) reapPipeHolder();
			fs.rmSync(home, finishedRemoveOptions);
			removeFinishedTemp(name, fileTmp);
		}
	} finally {
		cleanup();
	}
} else {
	// --jobs=N greater than 1: a pool of N workers over every file off the declared run-alone list,
	// in collection order; a freed slot takes the next file at once, never in batches (R-1470). A
	// declared run-alone file runs by itself, after the pool drains (R-1473). Each file's output is
	// buffered and written as one block when the file ends, never streamed live (R-1472) — two files
	// printing at the same time would otherwise interleave on the shared stdout. WARN lines and the
	// failed list are collected per file and replayed in collection order once every file is done
	// (R-1471), regardless of the order files actually finished in.
	const aloneHere = (file) => Object.hasOwn(RUN_ALONE, rel(file));
	const poolFiles = files.filter((file) => !aloneHere(file));
	const aloneFiles = files.filter(aloneHere);
	const perFile = new Array(files.length); // collection-order record of each real file's outcome

	async function runOne(file) {
		const index = coveragePositionOf.get(file);
		const name = display(file);
		const covFolder = coverageDir ? path.join(coverageDir, String(index).padStart(4, "0")) : null;
		const skipReason = skipReasonFor(file);
		if (skipReason) {
			tally.SKIP++;
			process.stdout.write(`SKIP  ${name.padEnd(width)}  ${skipReason}\n`);
			suiteFiles[index] = { path: rel(file), label: "SKIP", seconds: 0 };
			if (covFolder) writeRecord(covFolder, { path: rel(file), label: "SKIP", seconds: 0 });
			return;
		}
		const fx = fixtureOf.get(file);
		const fileTmp = fs.mkdtempSync(path.join(os.tmpdir(), `nana-test-${process.pid}-`));
		activeFileTmp.add(fileTmp);
		const home = fs.mkdtempSync(path.join(scratch, "home-"));
		const env = { ...BASE_ENV, HOME: home, USERPROFILE: home, TMPDIR: fileTmp, TEMP: fileTmp, TMP: fileTmp };
		if (covFolder) env.NODE_V8_COVERAGE = covFolder;
		if (process.platform === "win32") { env.TEMP = fileTmp; env.TMP = fileTmp; }
		const cwd = fx ? scratch : path.dirname(path.dirname(file));
		const timeoutMs = fx?.timeoutMs ?? TIMEOUT_MS;
		const t0 = Date.now();
		const r = await runFile(file, cwd, env, timeoutMs, false); // never live: this file may share the terminal with another
		const secs = ((Date.now() - t0) / 1000).toFixed(1);
		const rep = reportOf(name, r, timeoutMs, fx, secs);
		checks.pass += rep.p;
		checks.fail += rep.f;
		checks.skip += rep.s;
		tally[rep.label]++;
		let block = verbose ? r.out : "";
		block += rep.resultLine + "\n";
		if (!verbose) for (const l of rep.excerpt) block += l + "\n";
		process.stdout.write(block); // one write: the whole block stays together on a shared stdout
		suiteFiles[index] = { path: rel(file), label: rep.label, seconds: Number(secs), ...(rep.cause ? { cause: rep.cause } : {}) };
		if (covFolder) writeRecord(covFolder, { path: rel(file), label: rep.label, seconds: Number(secs) });
		perFile[index] = { warn: rep.warn ? `WARN ${name}: FAIL line with exit 0` : null, failed: !rep.ok ? name : null, mismatch: rep.mismatch ? name : null };
		if (fx?.holdsPipe) reapPipeHolder();
		fs.rmSync(home, finishedRemoveOptions);
		removeFinishedTemp(name, fileTmp);
	}

	/** N workers pull the next queued file as soon as they are free — never started in batches. */
	async function runPool(queue, size) {
		let next = 0;
		const workerCount = Math.max(1, Math.min(size, queue.length));
		await Promise.all(
			Array.from({ length: workerCount }, async () => {
				for (;;) {
					const i = next++;
					if (i >= queue.length) return;
					await runOne(queue[i]);
				}
			}),
		);
	}

	try {
		await runPool(poolFiles, jobs);
		for (const file of aloneFiles) await runOne(file); // one at a time, after the pool drains
	} finally {
		cleanup();
	}

	for (const record of perFile) {
		if (!record) continue; // a SKIP left no record
		if (record.warn) warns.push(record.warn);
		if (record.failed) failed.push(record.failed);
		if (record.mismatch) selfTestMismatch.push(record.mismatch);
	}
}
const afterSnapshot = trackedSnapshot();
if (beforeSnapshot !== null && afterSnapshot !== null) {
	const names = new Set([...beforeSnapshot.keys(), ...afterSnapshot.keys()]);
	const changed = [...names].filter((name) => JSON.stringify(beforeSnapshot.get(name) ?? []) !== JSON.stringify(afterSnapshot.get(name) ?? [])).sort();
	if (changed.length) {
		const failure = `tracked repository files changed by tests: ${changed.join(", ")}`;
		console.log(`FAIL ${failure}`);
		unnamedFailures.push(failure);
		tally.FAIL++;
	}
}
if (coverageDir) {
	fs.mkdirSync(coverageDir, { recursive: true });
	fs.writeFileSync(path.join(coverageDir, COMPLETION_FILE), JSON.stringify({ files: files.length, failures: tally.FAIL + selfTestMismatch.length }));
}
console.log(
	`\n${files.length} files: ${tally.PASS} PASS, ${tally.FAIL} FAIL, ${tally.SKIP} SKIP, ${warns.length} WARN · checks: ${checks.pass} pass, ${checks.fail} fail, ${checks.skip} skip · ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
for (const w of warns) console.log(w);
if (failed.length) console.log(`failed: ${failed.join(", ")}`);
if (selfTest) console.log(selfTestMismatch.length ? `self-test MISMATCH: ${selfTestMismatch.join(", ")}` : "self-test: every fixture got its expected verdict");
if (selfTestMismatch.length) unnamedFailures.push(`self-test mismatch: ${selfTestMismatch.join(", ")}`);
const finalExitCode = tally.FAIL || selfTestMismatch.length ? 1 : 0;
const suiteRecordFile = process.env[RECORD_FILE_ENV];
if (suiteRecordFile) {
	try {
		fs.mkdirSync(path.dirname(suiteRecordFile), { recursive: true });
		fs.writeFileSync(suiteRecordFile, JSON.stringify({
			schema: RECORD_SCHEMA,
			filters,
			files: suiteFiles.filter(Boolean),
			unnamedFailures,
			exitCode: finalExitCode,
			wallSeconds: Number(((Date.now() - started) / 1000).toFixed(1)),
			fileTimeoutMs: TIMEOUT_MS,
			jobs,
			platform: process.platform,
			coverage: coverageDir !== null,
		}));
	} catch (error) {
		console.log(`${RECORD_LINE_PREFIX} write failed: ${error?.message ?? "unknown error"}`);
	}
}
// Not process.exit(): on a pipe, a write queued just before an immediate process.exit() can be
// dropped entirely rather than truncated (confirmed: a 2 MB console.log before process.exit() on
// darwin delivered ZERO bytes to a reader that attached after the child had already exited).
// Setting exitCode and letting the event loop drain on its own lets every queued write flush
// before the process exits — registered SIGINT/SIGTERM/message handlers do not keep it alive once
// there is nothing left to do (must-meet.md item 3, build-brief-2).
process.exitCode = finalExitCode;
