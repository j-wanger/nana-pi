#!/usr/bin/env node
// The canonical test path: `npm test` from the repo root.
//
// Runs every packages/*/tests/*.test.mjs plus apps/desk/test/*.test.mjs (unit only — the
// *.e2e.mjs browser suites bind fixed ports and are never run here), one file at a time, each
// as `node --experimental-strip-types <file>` from its package dir, each with a FRESH temp HOME
// and USERPROFILE so no file can read (or write) the real machine's dotfiles.
//
// One line per file — PASS / FAIL / SKIP — then a total; exits 1 if any file failed.
// A file FAILs if it exits non-zero, times out, or prints a `FAIL` line. A file is SKIPped
// only when it is declared below as unrunnable on this platform; nothing is hidden.
//
//   npm test                     the default set
//   npm test -- --verbose        also stream every file's output
//   npm test -- --self-test      add a deliberately failing fixture; must exit non-zero
//   NANA_TEST_SELFTEST=1 npm test   same as --self-test
//   npm test -- <substring>...   only files whose path contains one of the substrings
import { spawn, spawnSync } from "node:child_process";
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

const rel = (p) => path.relative(root, p).split(path.sep).join("/");
const isDir = (p) => {
	try {
		return fs.statSync(p).isDirectory();
	} catch {
		return false;
	}
};

/** Direct children of `dir` named *.test.mjs — no shell globs, no recursion. */
function testsIn(dir) {
	if (!isDir(dir)) return [];
	return fs
		.readdirSync(dir, { withFileTypes: true })
		.filter((e) => e.isFile() && e.name.endsWith(".test.mjs"))
		.map((e) => path.join(dir, e.name));
}

const excluded = (p) => {
	const r = rel(p);
	return r.endsWith(".e2e.mjs") || (r.startsWith("apps/bench/studies/") && r.split("/").includes("fixture"));
};

function collect() {
	const files = [];
	const pkgs = path.join(root, "packages");
	if (isDir(pkgs)) {
		for (const name of fs.readdirSync(pkgs).sort()) files.push(...testsIn(path.join(pkgs, name, "tests")).sort());
	}
	files.push(...testsIn(path.join(root, "apps", "desk", "test")).sort());
	return files.filter((f) => !excluded(f)).filter((f) => !filters.length || filters.some((s) => rel(f).includes(s)));
}

const onPath = (cmd) => {
	const r = spawnSync(cmd, ["--version"], { stdio: "ignore" });
	return !(r.error && r.error.code === "ENOENT");
};

/** Declared platform skips: file → () => reason | null. A reason means SKIP, printed. */
const SKIPS = {
	// proves no child was left running with `pgrep -f`, and reads "pgrep missing" as "nothing
	// left" — so without pgrep the file would pass without proving anything.
	"packages/nana-pack/tests/post-edit-hardening.test.mjs": () => (onPath("pgrep") ? null : "needs `pgrep` (not on PATH)"),
};

/** The --self-test fixture: a test file that reports one PASS and one FAIL and exits 1. */
function selfTestFixture(dir) {
	const f = path.join(dir, "runner-self-test.test.mjs");
	fs.writeFileSync(f, 'console.log("PASS the runner sees a passing check");\nconsole.log("FAIL the runner must turn this file red");\nprocess.exit(1);\n');
	return f;
}

/** Run one file serially; resolve {code, signal, timedOut, out}. */
function runFile(file, cwd, env) {
	return new Promise((resolve) => {
		const posix = process.platform !== "win32";
		const child = spawn(process.execPath, ["--experimental-strip-types", file], {
			cwd,
			env,
			stdio: ["ignore", "pipe", "pipe"],
			detached: posix, // own process group, so a timeout can take the whole tree down
		});
		let out = "";
		const take = (chunk) => {
			const s = chunk.toString();
			out += s;
			if (verbose) process.stdout.write(s);
		};
		child.stdout.on("data", take);
		child.stderr.on("data", take);
		let timedOut = false;
		const timer = setTimeout(() => {
			timedOut = true;
			try {
				if (posix) process.kill(-child.pid, "SIGKILL");
				else child.kill("SIGKILL");
			} catch {}
		}, TIMEOUT_MS);
		child.on("error", (err) => {
			clearTimeout(timer);
			resolve({ code: null, signal: null, timedOut, out: out + `\n[runner] spawn error: ${err.message}\n` });
		});
		child.on("close", (code, signal) => {
			clearTimeout(timer);
			resolve({ code, signal, timedOut, out });
		});
	});
}

const count = (out, word) => out.split(/\r?\n/).filter((l) => new RegExp(`^\\s*${word}\\b`).test(l)).length;

const files = collect();
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "nana-test-runner-"));
if (selfTest) files.push(selfTestFixture(scratch));
if (!files.length) {
	console.log("no test files matched");
	process.exit(1);
}

const tally = { PASS: 0, FAIL: 0, SKIP: 0 };
const checks = { pass: 0, fail: 0, skip: 0 };
const failed = [];
const display = (f) => (f.startsWith(scratch) ? "(self-test) " + path.basename(f) : rel(f));
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
		const home = fs.mkdtempSync(path.join(scratch, "home-"));
		const env = { ...process.env, HOME: home, USERPROFILE: home };
		// run from the package dir (the dir holding tests/ or test/), the way every file was written
		const cwd = file.startsWith(scratch) ? scratch : path.dirname(path.dirname(file));
		const t0 = Date.now();
		const r = await runFile(file, cwd, env);
		const secs = ((Date.now() - t0) / 1000).toFixed(1);
		const p = count(r.out, "PASS");
		const f = count(r.out, "FAIL");
		const s = count(r.out, "SKIP");
		checks.pass += p;
		checks.fail += f;
		checks.skip += s;
		const ok = r.code === 0 && !r.timedOut && f === 0;
		const why = r.timedOut ? `timed out after ${TIMEOUT_MS / 1000}s` : r.code !== 0 ? `exit ${r.code ?? r.signal}` : f ? `${f} FAIL line(s) despite exit 0` : "";
		const stat = `${p} pass${f ? `, ${f} fail` : ""}${s ? `, ${s} skip` : ""}  ${secs}s`;
		tally[ok ? "PASS" : "FAIL"]++;
		console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(width)}  ${stat}${why ? `  — ${why}` : ""}`);
		if (!ok) {
			failed.push(name);
			if (!verbose) {
				const tail = r.out.trimEnd().split(/\r?\n/);
				const shown = tail.filter((l) => /^\s*FAIL\b/.test(l));
				for (const l of (shown.length ? shown : tail).slice(-30)) console.log(`      | ${l}`);
			}
		}
		fs.rmSync(home, { recursive: true, force: true });
	}
} finally {
	fs.rmSync(scratch, { recursive: true, force: true });
}

console.log(
	`\n${files.length} files: ${tally.PASS} PASS, ${tally.FAIL} FAIL, ${tally.SKIP} SKIP · checks: ${checks.pass} pass, ${checks.fail} fail, ${checks.skip} skip · ${((Date.now() - started) / 1000).toFixed(1)}s`,
);
if (failed.length) console.log(`failed: ${failed.join(", ")}`);
process.exit(tally.FAIL ? 1 : 0);
