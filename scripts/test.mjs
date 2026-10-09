#!/usr/bin/env node
/**
 * @module scripts/test.mjs
 * @purpose The canonical test runner — run every collected `*.test.mjs` file in its own process tree with a
 *  fresh temp HOME and report one line each.
 * @inputs argv (--verbose, --self-test, path substrings), env NANA_TEST_SELFTEST and NANA_TEST_TIMEOUT_MS,
 *  and the test files directly under each package's tests/ dir, apps/desk/test and apps/bench/test (e2e,
 *  studies and fixture dirs excluded)
 * @outputs one PASS / FAIL / SKIP line per file with its check counts and timing, the first 20 failing lines of a red
 *  file in non-verbose mode, a totals line with warnings and the self-test verdict, and the exit code
 * @effects process (spawns each file as `node --experimental-strip-types` in its own group with a child env
 *  scrubbed of every ambient NANA_* but the NANA_TEST_* knobs, and of PI_CODING_AGENT_DIR, kills that group or taskkills the tree on
 *  timeout, SIGINT or SIGTERM), disk (a mkdtemp scratch dir, a per-file temp HOME and the self-test
 *  fixtures, all removed on every exit path)
 * @errors exit 1 when any file failed, timed out, died on a signal, matched nothing, or a self-test fixture
 *  missed its expected verdict; exit 130 on SIGINT and 143 on SIGTERM; exit 0 otherwise
 */
// The canonical test path: `npm test` from the repo root.
//
// Runs every packages/*/tests/*.test.mjs, apps/desk/test/*.test.mjs (unit only — the *.e2e.mjs
// browser suites bind fixed ports and are never run here) and apps/bench/test/*.test.mjs (stub
// children, zero model calls), one file at a time, each as `node --experimental-strip-types
// <file>` from its package dir, each with a FRESH temp HOME and USERPROFILE so no file can read
// (or write) the real machine's dotfiles, and with every ambient NANA_* (but the NANA_TEST_* runner
// knobs) plus PI_CODING_AGENT_DIR scrubbed from the child env, so the caller's context cannot
// change what the suite tests. Nothing under apps/bench/studies/** or any fixture(s)/ directory is
// ever collected.
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
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const verbose = argv.includes("--verbose");
const selfTest = argv.includes("--self-test") || process.env.NANA_TEST_SELFTEST === "1";
const filters = argv.filter((a) => !a.startsWith("--"));
const TIMEOUT_MS = Number(process.env.NANA_TEST_TIMEOUT_MS) || 5 * 60 * 1000;
const DRAIN_MS = 2000; // after `exit`, how long stdio may stay open before we stop waiting
const KILL_GRACE_MS = 5000; // after a timeout kill, how long we wait for `exit` at all
const posix = process.platform !== "win32";

const rel = (p) => path.relative(root, p).split(path.sep).join("/");
const isDir = (p) => {
	try {
		return fs.statSync(p).isDirectory();
	} catch {
		return false;
	}
};

// ── cleanup: the active child's tree and the scratch dir, on EVERY exit path ────────────────
let scratch = null;
let active = null; // the running child, if any
let activeFileTmp = null;

/** Kill a child's whole tree. POSIX: it leads its own process group. win32: taskkill /T. */
function killTree(child) {
	if (!child || child.pid == null) return;
	try {
		if (posix) process.kill(-child.pid, "SIGKILL");
		else spawnSync("taskkill", ["/T", "/F", "/PID", String(child.pid)], { stdio: "ignore", windowsHide: true });
	} catch {}
}

/** Self-test only: the hang fixture records its escaped grandchild so the runner can reap it. */
function reapPipeHolder() {
	try {
		const pid = Number(fs.readFileSync(path.join(scratch, "pipe-holder.pid"), "utf8"));
		if (pid > 0) process.kill(pid, "SIGKILL");
	} catch {}
}

function cleanup() {
	killTree(active);
	active = null;
	if (activeFileTmp) {
		try { fs.rmSync(activeFileTmp, { recursive: true, force: true }); } catch {}
		activeFileTmp = null;
	}
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
	// On POSIX it proves no child was left running with `pgrep -f`, and reads "pgrep missing" as
	// "nothing left" — so without pgrep it would pass without proving anything. On win32 it does
	// not use pgrep (it guards its own POSIX cases), so it always runs there.
	"packages/nana-pack/tests/post-edit-hardening.test.mjs": () =>
		posix && !onPath("pgrep") ? "needs `pgrep` on POSIX (not on PATH)" : null,
	"apps/bench/test/study-tasks.test.mjs": () =>
		fs.existsSync(path.join(root, "apps", "bench", ".ext", "pi-web-access")) ? null : "needs apps/bench/.ext/pi-web-access (not present)",
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
/** Run one file; resolve {code, signal, timedOut, pipesHeld, out}. Always bounded. */
function runFile(file, cwd, env, timeoutMs) {
	return new Promise((resolve) => {
		const child = spawn(process.execPath, ["--experimental-strip-types", file], {
			cwd,
			env,
			stdio: ["ignore", "pipe", "pipe"],
			detached: posix, // own process group, so one group kill takes the whole tree down
			windowsHide: true,
		});
		active = child;
		let out = "";
		const take = (chunk) => {
			const s = chunk.toString();
			out += s;
			if (verbose) process.stdout.write(s);
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
			if (active === child) active = null;
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
// PI_CODING_AGENT_DIR goes too, for the same reason HOME does: it moves ~/.pi/agent, so a session
// that has it set (a run started from inside pi) makes objective-injection red — it drives the
// real handlers against the DEFAULT location under its fake HOME. The rest of PI_* stays: those
// name pi's install (PI_BIN, PI_ROOT, PI_PACKAGE…) and every test that cares sets them itself.
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR";
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
const display = (f) => (fixtureOf.has(f) ? "(self-test) " + path.basename(f) : rel(f));
const width = Math.max(...files.map((f) => display(f).length));
const started = Date.now();

try {
	for (const file of files) {
		const name = display(file);
		const skipReason = SKIPS[rel(file)]?.();
		if (skipReason) {
			tally.SKIP++;
			console.log(`SKIP  ${name.padEnd(width)}  ${skipReason}`);
			continue;
		}
		const fx = fixtureOf.get(file);
		const fileTmp = fs.mkdtempSync(path.join(os.tmpdir(), `nana-test-${process.pid}-`));
		activeFileTmp = fileTmp;
		const home = fs.mkdtempSync(path.join(scratch, "home-"));
		const env = { ...BASE_ENV, HOME: home, USERPROFILE: home, TMPDIR: fileTmp, TEMP: fileTmp, TMP: fileTmp };
		if (process.platform === "win32") { env.TEMP = fileTmp; env.TMP = fileTmp; }
		// run from the package dir (the dir holding tests/ or test/), the way every file was written
		const cwd = fx ? scratch : path.dirname(path.dirname(file));
		const timeoutMs = fx?.timeoutMs ?? TIMEOUT_MS;
		const t0 = Date.now();
		const r = await runFile(file, cwd, env, timeoutMs);
		const secs = ((Date.now() - t0) / 1000).toFixed(1);
		const p = count(r.out, "PASS");
		const f = count(r.out, "FAIL");
		const s = count(r.out, "SKIP");
		checks.pass += p;
		checks.fail += f;
		checks.skip += s;
		const exitedOk = r.code === 0 && !r.timedOut;
		const noPassingCheck = exitedOk && p === 0;
		const ok = exitedOk && !noPassingCheck;
		const why = r.timedOut ? `timed out after ${timeoutMs / 1000}s` : noPassingCheck ? "no check passed and no skip was declared" : !ok ? `exit ${r.code ?? r.signal}` : "";
		const held = r.pipesHeld ? `  (stdio still open ${DRAIN_MS / 1000}s after exit — a descendant holds it; not waited for)` : "";
		const stat = `${p} pass${f ? `, ${f} fail` : ""}${s ? `, ${s} skip` : ""}  ${secs}s`;
		const label = ok ? "PASS" : "FAIL";
		tally[label]++;
		console.log(`${label}  ${name.padEnd(width)}  ${stat}${why ? `  — ${why}` : ""}${held}`);
		if (ok && f) warns.push(`WARN ${name}: FAIL line with exit 0`);
		if (fx && fx.expect !== (ok ? (f ? "PASS+WARN" : "PASS") : "FAIL")) selfTestMismatch.push(name);
		if (!ok) {
			failed.push(name);
			if (!verbose) {
				const tail = r.out.trimEnd().split(/\r?\n/);
				const shown = noPassingCheck ? tail.filter((l) => /^\s*SKIP\b/.test(l)) : tail.filter((l) => /^\s*(?:FAIL|not ok)\b/.test(l));
				for (const l of (shown.length ? shown : tail).slice(0, 20)) console.log(`      | ${l}`);
			}
		}
		if (fx) reapPipeHolder();
		fs.rmSync(home, { recursive: true, force: true });
		fs.rmSync(fileTmp, { recursive: true, force: true });
		activeFileTmp = null;
	}
} finally {
	cleanup();
}

const afterSnapshot = trackedSnapshot();
if (beforeSnapshot !== null && afterSnapshot !== null) {
	const names = new Set([...beforeSnapshot.keys(), ...afterSnapshot.keys()]);
	const changed = [...names].filter((name) => JSON.stringify(beforeSnapshot.get(name) ?? []) !== JSON.stringify(afterSnapshot.get(name) ?? [])).sort();
	if (changed.length) {
		console.log(`FAIL tracked repository files changed by tests: ${changed.join(", ")}`);
		tally.FAIL++;
	}
}
console.log(
	`\n${files.length} files: ${tally.PASS} PASS, ${tally.FAIL} FAIL, ${tally.SKIP} SKIP, ${warns.length} WARN · checks: ${checks.pass} pass, ${checks.fail} fail, ${checks.skip} skip · ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
for (const w of warns) console.log(w);
if (failed.length) console.log(`failed: ${failed.join(", ")}`);
if (selfTest) console.log(selfTestMismatch.length ? `self-test MISMATCH: ${selfTestMismatch.join(", ")}` : "self-test: every fixture got its expected verdict");
process.exit(tally.FAIL || selfTestMismatch.length ? 1 : 0);
