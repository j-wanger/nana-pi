#!/usr/bin/env node
// Seat wrong-code pairs for lane knowledge-busy (hook lane), written by the seat 2026-11-02 after build 1 (cadd0b14),
// on the shared runner. One or more pairs per must-meet row, from the plan's named wrong versions and the pi
// adversary's attack (plan-attack.md). M2 (R-3591) is probabilistic on main's code (4 to 5 of 20 runs fail), so pairs
// that only M2 could catch also name a deterministic row. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/knowledge-busy-2026-11-02/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const BB = "packages/nana-knowledge/tests/build-busy.test.mjs";
const RC = "packages/nana-knowledge/tests/recover.test.mjs";
const DB = "packages/nana-knowledge/lib/db.ts";
const BUILD = "packages/nana-knowledge/lib/build.ts";
const R_3590 = /^M1: transient write locks allow existing and first builds to advance built_at/; // R-3590
const R_3592 = /^M3: locked hook stays bounded and connection defaults read back/; // R-3592
const RECOVERY_FAIL_FAST = /^M3: recovery refuses a late writer without a build busy wait and keeps the index/; // R-3592
const SOURCES_PROBLEM_PROBE = /^M1: sources-problem probe waits out a transient lock and keeps the index/; // R-3590
const R_3593 = /^M4: seal: BUILD_BUSY_TIMEOUT_MS is 5000 ms/; // R-3593
const R_3594 = /^M4: seal: QUERY_BUSY_TIMEOUT_MS is 100 ms/; // R-3594
const HOOK = "packages/nana-knowledge/lib/hook.ts";
const R_3595_OPEN = /^M6: first open failure retries and logs its cause/; // R-3595
const R_3595_QUERY = /^M6: first query failure retries and logs its cause/; // R-3595
const R_3596 = /^M6: seal: hook query retry delay is 50 ms and attempt ceiling is 10/; // R-3596
const R_3596_PERSIST = /^M6: persistent failures fail open within budget and log both causes/; // R-3596
const NON_BUSY = /^M8: non-busy open and query failures return after one attempt/; // R-3595
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const PRAGMA = "db.exec(`PRAGMA busy_timeout=${opts.busyTimeoutMs ?? (opts.create ? BUILD_BUSY_TIMEOUT_MS : QUERY_BUSY_TIMEOUT_MS)}`);";

const DECLARED = [
	"(plan) one or more pairs per must-meet row, from the plan's wrong versions and the adversary's attack",
	"(plan) R-3591 (M2, churn) is probabilistic against wrong code, so no pair rests on it alone",
	"(attack SHOULD 4) P5 and P6 test whether recovery's fail-fast and the sources-problem probe are pinned at all",
];

const PAIRS = [
	{ n: "P1", name: "no busy timeout anywhere (main's behaviour)", edits: [
		one(DB, PRAGMA, "db.exec(`PRAGMA busy_timeout=0`);"),
	], tests: [BB], expectRed: [R_3590, R_3592] },
	{ n: "P2", name: "builds get only the short query wait", edits: [
		one(DB, PRAGMA, "db.exec(`PRAGMA busy_timeout=${QUERY_BUSY_TIMEOUT_MS}`);"),
		one(BUILD, "const db = await openDb(paths.db, { create: !problem || !existing, busyTimeoutMs: BUILD_BUSY_TIMEOUT_MS });", "const db = await openDb(paths.db, { create: !problem || !existing });"),
	], tests: [BB], expectRed: [R_3590] },
	{ n: "P3", name: "the hook's query path waits as long as a build", edits: [
		one(DB, PRAGMA, "db.exec(`PRAGMA busy_timeout=${opts.busyTimeoutMs ?? BUILD_BUSY_TIMEOUT_MS}`);"),
	], tests: [BB], expectRed: [R_3592] },
	{ n: "P4", name: "the busy timeout is set after WAL setup, not first", edits: [
		one(DB, PRAGMA, "/* moved below */"),
		one(DB, "db.exec(\"PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;\");", "db.exec(\"PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;\"); db.exec(`PRAGMA busy_timeout=${opts.busyTimeoutMs ?? (opts.create ? BUILD_BUSY_TIMEOUT_MS : QUERY_BUSY_TIMEOUT_MS)}`);"),
	], tests: [BB], expectRed: [R_3590] },
	{ n: "P5", name: "recovery waits a full build timeout instead of refusing at once", edits: [
		one(BUILD, "db.exec(\"PRAGMA busy_timeout=0\");", "db.exec(`PRAGMA busy_timeout=${BUILD_BUSY_TIMEOUT_MS}`);"),
	], tests: [BB, RC], expectRed: [RECOVERY_FAIL_FAST] },
	{ n: "P6", name: "the sources-problem probe loses the build wait", edits: [
		one(BUILD, "const probe = await openDb(paths.db, { readonly: true, busyTimeoutMs: BUILD_BUSY_TIMEOUT_MS });", "const probe = await openDb(paths.db, { readonly: true, busyTimeoutMs: 0 });"),
	], tests: [BB], expectRed: [SOURCES_PROBLEM_PROBE] },
	{ n: "P7", name: "the build timeout is retuned to 4000", edits: [
		one(DB, "export const BUILD_BUSY_TIMEOUT_MS = 5000;", "export const BUILD_BUSY_TIMEOUT_MS = 4000;"),
	], tests: [BB], expectRed: [R_3593] },
	{ n: "P8", name: "the query timeout is retuned to 250", edits: [
		one(DB, "export const QUERY_BUSY_TIMEOUT_MS = 100;", "export const QUERY_BUSY_TIMEOUT_MS = 250;"),
	], tests: [BB], expectRed: [R_3594] },
	// Added by the seat after build 5 (R-3595, R-3596). A retry that ignores the budget has no pair: with a 50 ms
	// delay inside a 1500 ms budget, no check can tell it apart, so it rests on review.
	// Refreshed by the seat after builds 9-11 replaced the single retry with budget-bounded busy-only retries.
	{ n: "P9", name: "the hook never retries (ceiling 1)", edits: [
		one(HOOK, "export const HOOK_QUERY_MAX_ATTEMPTS = 10;", "export const HOOK_QUERY_MAX_ATTEMPTS = 1;"),
	], tests: [BB], expectRed: [R_3595_OPEN, R_3595_QUERY, R_3596] },
	{ n: "P10", name: "a recovered retry does not record its first cause", edits: [
		one(HOOK, "if (attempts === 1) retried = cause;", "if (attempts === 1) retried = undefined;"),
	], tests: [BB], expectRed: [R_3595_OPEN, R_3595_QUERY] },
	{ n: "P11", name: "the retry delay is retuned to 10", edits: [
		one(HOOK, "export const HOOK_QUERY_RETRY_DELAY_MS = 50;", "export const HOOK_QUERY_RETRY_DELAY_MS = 10;"),
	], tests: [BB], expectRed: [R_3596] },
	{ n: "P12", name: "every failure is retried, not only busy and locked", edits: [
		one(HOOK, "retryable = primaryCode === 5 || primaryCode === 6;", "retryable = true;"),
	], tests: [BB], expectRed: [NON_BUSY] },
];

process.exitCode = await runMutations({ lane: "knowledge-busy", self: import.meta.url, tip: "HEAD", declared: DECLARED, pairs: PAIRS });
