#!/usr/bin/env node
// Seat wrong-code pairs for lane parallel-runner (gate lane), written by the seat 2026-10-19 on the lane tip d50de2f,
// on the shared runner. Each pair reverts one product site the lane changed to today's main form or the obvious
// wrong implementation: the build brief's W1-W14 (build-brief-1.md "Wrong code to try"), plus the harm sites the
// gate ladder probes (a fail-open tally, a file never started, the pool's normal temp-root removal, the --jobs
// regex anchor, the empty NANA_SUITE_JOBS case, the collection-order replay of WARN and failed:). The table runs
// unsplit (config SHARDS_DEFAULT 1): land suites share this machine. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/parallel-runner-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "scripts/test.mjs";
const L = "scripts/test-locked.mjs";
const C = "packages/nana-pack/lib/test-runner-config.mjs";
const TP = "packages/nana-pack/tests/test-runner-parallel.test.mjs";
const TL = "packages/nana-pack/tests/test-locked.test.mjs";
const TR = "packages/nana-pack/tests/test-runner.test.mjs";
const R1470 = "R-1470: --jobs=2 and --jobs=3 keep exactly that many files running and never more, and a freed slot starts the next file while a longer one still runs";
const R1471 = "R-1471: a parallel run that overlaps reports every label, count, excerpt, warning, failed name, self-test verdict, total and exit code exactly as a serial run";
const R1472 = "R-1472: files that ran at the same time print their verbose output, or their failing excerpt, and their result line as uninterrupted blocks";
const R1473 = "R-1473: a file on the run-alone list runs while no other file runs, and the other files still overlap";
const R1474 = "R-1474: the run-alone list names only collected test files, each with a reason";
const R1475 = "R-1475: SIGINT and SIGTERM during a parallel run kill every running tree and remove every running temp root (external signals on POSIX; handler trigger on Windows)";
const R1476 = "R-1476: an unfiltered locked run passes --jobs= with NANA_SUITE_JOBS, or the declared suite job count when it is unset or empty, to npm test";
const R1477 = "R-1477: --jobs=0, --jobs=abc, --jobs=2.5, --jobs= and a bare --jobs each exit 1 naming the argument before any file starts";
const R627 = "npm CLI receives a Windows metacharacter filter as one literal argument without a shell while a lock is held";
const VERBOSE = "--verbose streams a passing file's own output";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const POOL_RUN = "const r = await runFile(file, cwd, env, timeoutMs, false);";
const LOCKED_ARGS = 'args: [process.env.npm_execpath, "test", "--", ...(FILTERS.length ? FILTERS : [jobsArg])],';

const DECLARED = [
	"(a) every pair runs on darwin; the win32 half of R-1475 (taskkill per child, the IPC trigger with two children running) runs only on the Windows CI leg",
	"(b) no pair for RUN_ALONE membership: R-1474 checks only that each listed path is collected and has a reason; which load-sensitive files belong on the list is the seat's parallel full-run evidence (must-meet.md)",
	"(c) no pair for SUITE_JOBS (chosen, read by name by every check, so a retune must turn nothing red), JOBS_FLAG (the contract spelling every --jobs check passes literally), the coverage position (runtime-measure reads the path from each record; the position only names the folder), or the jobs=1 branch leaving RUN_ALONE unread (no check; M20 pins only its live verbose streaming)",
	"(d) no pair for the machine lock: the lane leaves test-locked.mjs's lock code unchanged, and R-626's existing checks pin it",
	"(e) M15 and M17 probe sites no must-meet check forces: M15 (WARN and failed: in completion order) goes red only when R-1471's fixtures finish out of collection order; M17 (the pool keeps a finished file's temp root) names R-1475, the nearest row, which covers only the signal path. Either may survive",
	"(f) M16 reverts the pipe-holder reap to main's form, which the plan's probe saw lose the hang line's note in 5 of 6 runs at --jobs=3: a GREEN M16 is the sixth run, not a pass",
];

const PAIRS = [
	// ── scripts/test.mjs: the --jobs argument (R-1477) ─────────────────────────────────────────
	{ n: "M1", name: "the --jobs regex is not anchored at its end, so --jobs=2.5 runs as 2", edits: [
		one(T, "([0-9]+)$`);", "([0-9]+)`);"),
	], tests: [TP], expectRed: [R1477] },
	{ n: "M2", name: "--jobs=0 is accepted (W11)", edits: [
		one(T, "value < 1) {", "value < 0) {"),
	], tests: [TP], expectRed: [R1477] },
	{ n: "M3", name: "a bad --jobs argument is named but not refused, so the run goes on at one job", edits: [
		one(T, "process.exit(1);\n\t\t}\n\t\tn = value;", "continue;\n\t\t}\n\t\tn = value;"),
	], tests: [TP], expectRed: [R1477] },

	// ── scripts/test.mjs: the pool (R-1470, R-1471, R-1472, R-1473) ────────────────────────────
	{ n: "M4", name: "the pool size stays 1 (W1)", edits: [
		one(T, "await runPool(poolFiles, jobs);", "await runPool(poolFiles, 1);"),
	], tests: [TP], expectRed: [R1470, R1471, R1472, R1473, R1475] },
	{ n: "M5", name: "the pool runs N+1 files at once (W2)", edits: [
		one(T, "Math.min(size, queue.length)", "Math.min(size + 1, queue.length)"),
	], tests: [TP], expectRed: [R1470] },
	{ n: "M6", name: "every pool file starts at once (W3)", edits: [
		one(T, "Math.max(1, Math.min(size, queue.length))", "Math.max(1, queue.length)"),
	], tests: [TP], expectRed: [R1470] },
	{ n: "M7", name: "the pool starts N files and waits for all N before the next batch (W5)", edits: [
		one(T, "\t\tlet next = 0;", "\t\tfor (let b = 0; b < queue.length; b += size) await Promise.all(queue.slice(b, b + size).map((f) => runOne(f)));\n\t\treturn;\n\t\tlet next = 0;"),
	], tests: [TP], expectRed: [R1470] },
	{ n: "M8", name: "the pool never starts its last queued file", edits: [
		one(T, "if (i >= queue.length) return;", "if (i >= queue.length - 1) return;"),
	], tests: [TP], expectRed: [R1471, R1472] },
	{ n: "M9", name: "a pool file streams its verbose output live (W4)", edits: [
		one(T, POOL_RUN, "const r = await runFile(file, cwd, env, timeoutMs, verbose);"),
		one(T, 'let block = verbose ? r.out : "";', 'let block = "";'),
	], tests: [TP], expectRed: [R1472] },
	{ n: "M10", name: "the run-alone list is ignored (W6)", edits: [
		one(T, "const aloneHere = (file) => Object.hasOwn(RUN_ALONE, rel(file));", "const aloneHere = (file) => false;"),
	], tests: [TP], expectRed: [R1473] },
	{ n: "M11", name: "a run-alone file waits only for a free slot (W7)", edits: [
		one(T, "await runPool(poolFiles, jobs);", "await runPool([...poolFiles, ...aloneFiles], jobs);"),
		one(T, "for (const file of aloneFiles) await runOne(file);", ";"),
	], tests: [TP], expectRed: [R1473] },
	{ n: "M12", name: "counts and excerpts read from one buffer shared by every pool file (W9)", edits: [
		one(T, "const perFile = new Array(files.length);", 'let sharedOut = "";\n\tconst perFile = new Array(files.length);'),
		one(T, POOL_RUN, "const r0 = await runFile(file, cwd, env, timeoutMs, false);\n\t\tsharedOut += r0.out;\n\t\tconst r = { ...r0, out: sharedOut };"),
	], tests: [TP], expectRed: [R1471, R1472] },
	{ n: "M13", name: "a pool SKIP prints no line (W10)", edits: [
		one(T, "process.stdout.write(`SKIP  ${name.padEnd(width)}  ${skipReason}\\n`);", ""),
	], tests: [TP], expectRed: [R1471] },
	{ n: "M14", name: "a failed pool file is not tallied, so the run exits 0 (fail-open)", edits: [
		one(T, "tally[rep.label]++;\n\t\tlet block", "if (rep.ok) tally[rep.label]++;\n\t\tlet block"),
	], tests: [TP], expectRed: [R1471, R1472] },
	{ n: "M15", name: "WARN lines and failed: print in completion order, not collection order", edits: [
		one(T, "perFile[index] = { warn: rep.warn ? `WARN ${name}: FAIL line with exit 0` : null, failed: !rep.ok ? name : null, mismatch: rep.mismatch ? name : null };",
			"if (rep.warn) warns.push(`WARN ${name}: FAIL line with exit 0`);\n\t\tif (!rep.ok) failed.push(name);\n\t\tif (rep.mismatch) selfTestMismatch.push(name);"),
	], tests: [TP], expectRed: [R1471] },
	{ n: "M16", name: "the pipe holder is reaped after any self-test fixture ends (main's form)", edits: [
		one(T, "if (fx?.holdsPipe) reapPipeHolder();\n\t\tfs.rmSync(home", "if (fx) reapPipeHolder();\n\t\tfs.rmSync(home"),
	], tests: [TP], expectRed: [R1471] },
	{ n: "M17", name: "the pool keeps a finished file's temp root", edits: [
		one(T, "fs.rmSync(fileTmp, { recursive: true, force: true });\n\t\tactiveFileTmp.delete(fileTmp);", "activeFileTmp.delete(fileTmp);"),
	], tests: [TP], expectRed: [R1475] },

	// ── scripts/test.mjs: cleanup on a signal (R-1475) ─────────────────────────────────────────
	{ n: "M18", name: "cleanup kills only the last running tree (W8)", edits: [
		one(T, "for (const child of active) killTree(child);", "killTree([...active].at(-1));"),
	], tests: [TP], expectRed: [R1475] },
	{ n: "M19", name: "cleanup removes only the last running temp root", edits: [
		one(T, "for (const dir of activeFileTmp) {", "for (const dir of [...activeFileTmp].slice(-1)) {"),
	], tests: [TP], expectRed: [R1475] },

	// ── scripts/test.mjs: the serial path the lane rewired ─────────────────────────────────────
	{ n: "M20", name: "a serial --verbose run no longer streams a file's output", edits: [
		one(T, "const r = await runFile(file, cwd, env, timeoutMs, verbose);", "const r = await runFile(file, cwd, env, timeoutMs, false);"),
	], tests: [TR], expectRed: [VERBOSE] },

	// ── packages/nana-pack/lib/test-runner-config.mjs (R-1474, R-1476) ─────────────────────────
	{ n: "M21", name: "a run-alone path is misspelled (W14)", edits: [
		one(C, '"packages/nana-pack/tests/bounded-read.test.mjs":', '"packages/nana-pack/tests/bounded_read.test.mjs":'),
	], tests: [TP], expectRed: [R1474] },
	{ n: "M22", name: "a run-alone entry has an empty reason", edits: [
		one(C, '"load-sensitive timing bound (1000 ms)"', '""'),
	], tests: [TP], expectRed: [R1474] },
	{ n: "M23", name: "the suite job count is read from a different env name", edits: [
		one(C, 'export const SUITE_JOBS_ENV = "NANA_SUITE_JOBS";', 'export const SUITE_JOBS_ENV = "SUITE_JOBS";'),
	], tests: [TL], expectRed: [R1476] },

	// ── scripts/test-locked.mjs (R-1476, R-627) ────────────────────────────────────────────────
	{ n: "M24", name: "NANA_SUITE_JOBS is ignored (W13)", edits: [
		one(L, "const jobsArg = `${JOBS_FLAG}${envJobs && envJobs.length > 0 ? envJobs : SUITE_JOBS}`;", "const jobsArg = `${JOBS_FLAG}${SUITE_JOBS}`;"),
	], tests: [TL], expectRed: [R1476] },
	{ n: "M25", name: "an empty NANA_SUITE_JOBS is passed as --jobs=", edits: [
		one(L, "envJobs && envJobs.length > 0 ? envJobs : SUITE_JOBS", "envJobs !== undefined ? envJobs : SUITE_JOBS"),
	], tests: [TL], expectRed: [R1476] },
	{ n: "M26", name: "an unfiltered locked run passes no --jobs (main's form)", edits: [
		one(L, LOCKED_ARGS, 'args: [process.env.npm_execpath, "test", ...(FILTERS.length ? ["--", ...FILTERS] : [])],'),
	], tests: [TL], expectRed: [R1476] },
	{ n: "M27", name: "a filtered locked run also gets --jobs (W12)", edits: [
		one(L, LOCKED_ARGS, 'args: [process.env.npm_execpath, "test", "--", ...FILTERS, jobsArg],'),
	], tests: [TL], expectRed: [R627] },
];

process.exitCode = await runMutations({ lane: "parallel-runner", self: import.meta.url, tip: "5782c50", declared: DECLARED, config: { SHARDS_DEFAULT: 1 }, pairs: PAIRS });
