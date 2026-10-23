#!/usr/bin/env node
// Seat wrong-code pairs for lane shared-helpers (gate), written by the seat 2026-10-23 after build 2, at tip 77cba752, judged by main's runner at dbb98cbb.
// They are the draft's pairs 1 to 22 with the must-meet's changes (pair 2 also names the seal; pair 5 not the seal;
// pair 21 names R-2662 alone) and its new pairs 24 to 27; pair 23 is Windows only and runs on a scratch CI branch.
// The lane changes the mutation runner's own kill, so main's runner judges them (must-meet S5): run this table from a
// detached worktree of main, as an untracked copy at the same relative path, with SEAT_MUTATE_TIP=<lane tip>:
//   SEAT_MUTATE_TIP=<sha> SEAT_MUTATE_OUT=<file> node docs/reviews/shared-helpers-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const PT = "packages/nana-pack/lib/process-tree.mjs";
const SCAN = "packages/nana-pack/lib/tree-kill-scan.mjs";
const RR = "packages/nana-pack/lib/rename-retry.mjs";
const ROUND = "packages/nana-pack/bin/review-round.mjs";
const RUNNER = "scripts/test.mjs";
const WD = "packages/nana-pack/bin/pi-watchdog.mjs";
const PE = "packages/nana-pack/extensions/nana-post-edit.ts";
const PRE = "packages/nana-pack/prompts/builder-preamble.md";
const RUL = "packages/nana-pack/rules/nana-rulings.md";
const T_PT = "packages/nana-pack/tests/process-tree.test.mjs";
const T_RR = "packages/nana-pack/tests/rename-retry.test.mjs";
const T_LEDGER = "packages/nana-pack/tests/review-ledger.test.mjs";
const T_LANE = "packages/nana-pack/tests/worker-lane.test.mjs";
const T_RUL = "packages/nana-pack/tests/rulings.test.mjs";
const R_2656 = /^R-2656: /; // R-2656
const R_2657 = /^R-2657: /; // R-2657
const R_2658 = /^R-2658: /; // R-2658
const R_2659 = /^R-2659: /; // R-2659
const R_2660 = /^R-2660: /; // R-2660
const R_2661 = /^R-2661: /; // R-2661
const R_2662 = /^R-2662: /; // R-2662
const R_2663 = /^R-2663: /; // R-2663
const SEAL_KILL = /^seal: taskkill, SIGKILL by default, and the four declared tree-kill exceptions/; // R-2656 R-2657 R-2661
const SEAL_RENAME = /^seal: three attempts 20 ms apart on EPERM, EBUSY and EACCES/; // R-2659
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const WAIT_POSIX = "\t\ttry {\n\t\t\tkill(-pid, signal);\n\t\t\treturn true;\n\t\t} catch {\n\t\t\tuseFallback(fallback, signal);\n\t\t\treturn false;\n\t\t}";
const RENAME_SIG = "export function renameWithRetry(src, dest, {\n\trename = renameSync,\n\tdelay = () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, RENAME_RETRY_DELAY_MS),\n\trecheck = () => {},\n} = {}) {";

const DECLARED = [
	"(plan) p1 to p22 follow the draft's wrong-code list in order, with the must-meet's changes to pairs 2, 5 and 21; p24 to p27 are the must-meet's new pairs",
	"(seat) p23 (post-edit passes no fallback, expecting R-1701) runs only on the Windows leg, so it is not in this macOS table",
	"(seat) p1, p13 and p16 name only the lane's own titles; their side effects on R-1233, R-912 and R-986 are not run here",
	"(seat) p17 to p19 restore main's own kill bodies in scripts/test.mjs, pi-watchdog and post-edit",
];

const PAIRS = [
	{ n: "p1", name: "the POSIX branch signals pid, not -pid", edits: [
		one(PT, "\t\t\tkill(-pid, signal);\n\t\t\treturn true;", "\t\t\tkill(pid, signal);\n\t\t\treturn true;"),
		one(PT, "try { kill(-pid, signal); } catch { useFallback(fallback, signal); }", "try { kill(pid, signal); } catch { useFallback(fallback, signal); }"),
	], tests: [T_PT], expectRed: [R_2656] },
	{ n: "p2", name: "the default signal is SIGTERM", edits: [
		one(PT, 'export const DEFAULT_KILL_SIGNAL = "SIGKILL";', 'export const DEFAULT_KILL_SIGNAL = "SIGTERM";'),
	], tests: [T_PT], expectRed: [R_2656, SEAL_KILL] },
	{ n: "p3", name: "the helper kills the pid itself when no fallback is given", edits: [
		one(PT, WAIT_POSIX, WAIT_POSIX.replace("\t\t\tuseFallback(fallback, signal);\n\t\t\treturn false;", "\t\t\tif (typeof fallback === \"function\") useFallback(fallback, signal); else try { kill(pid, signal); } catch {}\n\t\t\treturn false;")),
	], tests: [T_PT], expectRed: [R_2656] },
	{ n: "p4", name: "the fallback runs after a successful group signal", edits: [
		one(PT, "\t\t\tkill(-pid, signal);\n\t\t\treturn true;", "\t\t\tkill(-pid, signal);\n\t\t\tuseFallback(fallback, signal);\n\t\t\treturn true;"),
	], tests: [T_PT], expectRed: [R_2656] },
	{ n: "p5", name: "/T dropped", edits: [
		one(PT, 'export const TASKKILL_ARGS = Object.freeze(["/T", "/F", "/PID"]);', 'export const TASKKILL_ARGS = Object.freeze(["/F", "/PID"]);'),
	], tests: [T_PT], expectRed: [R_2657] },
	{ n: "p6", name: "the win32 branch runs the POSIX path", edits: [
		one(PT, '\tif (platform !== "win32") {\n\t\ttry {\n\t\t\tkill(-pid, signal);', '\tif (true) {\n\t\ttry {\n\t\t\tkill(-pid, signal);'),
	], tests: [T_PT], expectRed: [R_2657] },
	{ n: "p7", name: "taskkill runs with shell: true", edits: [
		one(PT, '{ stdio: "ignore", windowsHide: true });\n\t\tif (result', '{ stdio: "ignore", windowsHide: true, shell: true });\n\t\tif (result'),
	], tests: [T_PT], expectRed: [R_2657] },
	{ n: "p8", name: "the no-wait form attaches no error listener", edits: [
		one(PT, '\t\ttaskkill.once("error", failOnce);\n', ""),
	], tests: [T_PT], expectRed: [R_2657] },
	{ n: "p9", name: "the fallback runs on close 0", edits: [
		one(PT, 'taskkill.once("close", (code) => { if (code !== 0) failOnce(); });', 'taskkill.once("close", () => { failOnce(); });'),
	], tests: [T_PT], expectRed: [R_2657] },
	{ n: "p10", name: "the pid guard removed", edits: [
		one(PT, "const validPid = (pid) => Number.isSafeInteger(pid) && pid > 1;", "const validPid = (pid) => true;"),
	], tests: [T_PT], expectRed: [R_2658] },
	{ n: "p11", name: "the guard checks only == null", edits: [
		one(PT, "const validPid = (pid) => Number.isSafeInteger(pid) && pid > 1;", "const validPid = (pid) => pid != null;"),
	], tests: [T_PT], expectRed: [R_2658] },
	{ n: "p12", name: "the rename retry keeps a win32-only gate", edits: [
		one(RR, "if (attempt >= RENAME_RETRY_ATTEMPTS ||", 'if (process.platform !== "win32" || attempt >= RENAME_RETRY_ATTEMPTS ||'),
	], tests: [T_RR], expectRed: [R_2659] },
	{ n: "p13", name: "the recheck runs before the delay", edits: [
		one(RR, "\t\t\tdelay();\n\t\t\trecheck();", "\t\t\trecheck();\n\t\t\tdelay();"),
	], tests: [T_RR], expectRed: [R_2659] },
	{ n: "p14", name: "the retry makes four attempts", edits: [
		one(RR, "export const RENAME_RETRY_ATTEMPTS = 3;", "export const RENAME_RETRY_ATTEMPTS = 4;"),
	], tests: [T_RR], expectRed: [R_2659, SEAL_RENAME] },
	{ n: "p15", name: "ENOENT is retried", edits: [
		one(RR, 'Object.freeze(["EPERM", "EBUSY", "EACCES"]);', 'Object.freeze(["EPERM", "EBUSY", "EACCES", "ENOENT"]);'),
	], tests: [T_RR], expectRed: [R_2659] },
	{ n: "p16", name: "review-round ignores the injected rename", edits: [
		one(ROUND, "renameWithRetry(temp, target, { rename });", "renameWithRetry(temp, target, {});"),
	], tests: [T_LEDGER], expectRed: [R_2660] },
	{ n: "p17", name: "scripts/test.mjs keeps its taskkill line", edits: [
		one(RUNNER, "function killTree(child) {\n\tkillProcessTree(child?.pid);\n}", 'function killTree(child) {\n\tif (!child || child.pid == null) return;\n\ttry {\n\t\tif (posix) process.kill(-child.pid, "SIGKILL");\n\t\telse spawnSync("taskkill", ["/T", "/F", "/PID", String(child.pid)], { stdio: "ignore", windowsHide: true });\n\t} catch {}\n}'),
	], tests: [T_PT], expectRed: [R_2661] },
	{ n: "p18", name: "pi-watchdog keeps its execSync template literal", edits: [
		one(WD, "  killProcessTree(child?.pid, { signal });\n  if (process.platform !== 'win32') try { child.kill(signal); } catch { /* already dead */ }", "  if (process.platform === 'win32') {\n    try { execSync(`taskkill /T /F /PID ${child.pid}`, { stdio: 'ignore' }); } catch { /* tree already gone */ }\n  } else {\n    try { process.kill(-child.pid, signal); } catch { /* group already gone */ }\n    try { child.kill(signal); } catch { /* already dead */ }\n  }"),
	], tests: [T_PT], expectRed: [R_2661] },
	{ n: "p19", name: "post-edit keeps its own killTree", edits: [
		one(PE, '\tkillProcessTreeNoWait(child.pid, { signal, fallback: (sentSignal) => { try { child.kill(sentSignal); } catch { /* already reaped */ } } });', '\tconst pid = child.pid;\n\tif (pid === undefined) return;\n\tif (process.platform !== "win32") { try { process.kill(-pid, signal); } catch { try { child.kill(signal); } catch {} } return; }\n\tconst tk = spawn("taskkill", ["/T", "/F", "/PID", String(pid)], { windowsHide: true, stdio: "ignore" });\n\ttk.on("error", () => { try { child.kill(signal); } catch {} });'),
	], tests: [T_PT], expectRed: [R_2661] },
	{ n: "p20", name: "the exceptions gain post-edit", edits: [
		one(SCAN, '\t"apps/desk/server.mjs": "the frozen desk keeps its existing child lifecycle implementation",\n', '\t"apps/desk/server.mjs": "the frozen desk keeps its existing child lifecycle implementation",\n\t"packages/nana-pack/extensions/nana-post-edit.ts": "post-edit keeps its own kill",\n'),
	], tests: [T_PT], expectRed: [SEAL_KILL] },
	{ n: "p21", name: "the reuse sentence merged into R-2582's line", edits: [
		one(PRE, "report each departure with its reason.\n- When your change needs", "report each departure with its reason. When your change needs"),
	], tests: [T_LANE], expectRed: [R_2662] },
	{ n: "p22", name: "the ruling missing", edits: [
		one(RUL, "- 2026-10-22: A helper's second caller imports it rather than copying it. A plan's Precedent section names any move of a private helper to a shared module.\n", ""),
	], tests: [T_RUL], expectRed: [R_2663] },
	{ n: "p24", name: "the scan's patterns match nothing", edits: [
		one(SCAN, "if (/[\"'`]taskkill(?:\\.exe)?\\b/i.test(line) || /\\bkill\\(\\s*-/.test(line))", "if (false)"),
	], tests: [T_PT], expectRed: [R_2661] },
	{ n: "p25", name: "the pid guard accepts 1", edits: [
		one(PT, "const validPid = (pid) => Number.isSafeInteger(pid) && pid > 1;", "const validPid = (pid) => Number.isSafeInteger(pid) && pid > 0;"),
	], tests: [T_PT], expectRed: [R_2658] },
	{ n: "p26", name: "a fallback throw escapes the no-wait form", edits: [
		one(PT, "\t\tfailed = true;\n\t\tuseFallback(fallback, signal);", '\t\tfailed = true;\n\t\tif (typeof fallback === "function") fallback(signal);'),
	], tests: [T_PT], expectRed: [R_2657] },
	{ n: "p27", name: "an explicit delay: undefined used as the delay", edits: [
		one(RR, RENAME_SIG, 'export function renameWithRetry(src, dest, opts = {}) {\n\tconst { rename = renameSync, recheck = () => {} } = opts;\n\tconst delay = Object.hasOwn(opts, "delay") ? opts.delay : () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, RENAME_RETRY_DELAY_MS);'),
	], tests: [T_RR], expectRed: [R_2659] },
];

process.exitCode = await runMutations({ lane: "shared-helpers", self: import.meta.url, tip: "77cba752", declared: DECLARED, pairs: PAIRS });
