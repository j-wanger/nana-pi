#!/usr/bin/env node
// Seat wrong-code pairs for lane win-flake-hardening (ordinary), written by the seat 2026-10-23 after build 1, on the
// shared runner, at tip 6406ea8e, re-run at 409ce615 after build 2. They are the must-meet's pairs in its order (the draft's list with the seat's changes),
// less pair 6, plus p5b and p17. The shared runner runs each test file directly, not through scripts/test.mjs, so the
// lane's runner edits are judged by the copies the tests make. Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/win-flake-hardening-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RUNNER = "scripts/test.mjs";
const CFG = "packages/nana-pack/lib/test-runner-config.mjs";
const T_RUN = "packages/nana-pack/tests/test-runner.test.mjs";
const T_PAR = "packages/nana-pack/tests/test-runner-parallel.test.mjs";
const T_BR = "packages/nana-pack/tests/build-report.test.mjs";
const T_BC = "packages/nana-pack/tests/brief-check.test.mjs";
const R_1470 = /^R-1470: /; // R-1470
const R_1472 = /^R-1472: /; // R-1472
const R_2666 = /^R-2666: /; // R-2666
const R_2667 = /^R-2667: /; // R-2667
const R_2668 = /^R-2668: /; // R-2668
const R_2669 = /^R-2669: /; // R-2669
const R_2670 = /^R-2670: /; // R-2670
const SEAL_RUNNER = /^seal: a finished file's temp folder removal retries /; // R-2666
const SEAL_BRIEF = /^seal: R-2585's children have a 30-second limit /; // R-2670
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const each = (file, anchor, replacement, times) => ({ file, anchor, replacement, times });

const OLD_REMOVE = "fs.rmSync(fileTmp, { recursive: true, force: true }); activeFileTmp.delete(fileTmp);";
const GUARD_TAIL = "\t\tconsole.log(`FAIL ${failure}`);\n\t\tunnamedFailures.push(failure);\n\t\ttally.FAIL++;\n\t}\n}\nconst width";
const KILL_CALL = 'if (platform === "win32") runner("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });';
const PARTNER_WAIT = "'while (!fs.existsSync(__partner) && Date.now() < __deadline) await __sleep(20);',";
const MEETING_WAIT = "'while (!partnerFiles.every((file) => fs.existsSync(path.join(process.env.PROBE_OUT, file))) && Date.now() < deadline) await sleep(20);',";
const POOL = "\t\tlet next = 0;\n\t\tconst workerCount = Math.max(1, Math.min(size, queue.length));\n\t\tawait Promise.all(\n\t\t\tArray.from({ length: workerCount }, async () => {\n\t\t\t\tfor (;;) {\n\t\t\t\t\tconst i = next++;\n\t\t\t\t\tif (i >= queue.length) return;\n\t\t\t\t\tawait runOne(queue[i]);\n\t\t\t\t}\n\t\t\t}),\n\t\t);";

const DECLARED = [
	"(plan) p1 to p16 follow the draft's wrong-code list in order, with the must-meet's changes to pairs 4, 5, 6 and 14 and its new pair 17",
	"(seat) pair 6 is dropped: the build's off-Windows kill is the child's own SIGKILL, not a process-group kill, so no unguarded group kill exists to restore",
	"(seat) p5 calls main's execFileSync in place of the injected runner (red on macOS because the default runner is never called); p5b removes the kill's try, so the throwing runner escapes",
	"(seat) p14 writes the sampler shim outside the PATH folder; moving the stub folder after the real PATH would let the machine's real pi start",
	"(seat) p16 is two runs, one per seal: p16a CHILD_LIMIT_MS back at 15 s, p16b the removal retries at 3",
];

const PAIRS = [
	{ n: "p1", name: "main's unguarded removal at both sites", edits: [
		each(RUNNER, "removeFinishedTemp(name, fileTmp);", OLD_REMOVE, 2),
	], tests: [T_RUN], expectRed: [R_2666] },
	{ n: "p2", name: "a guard that swallows the error and prints nothing", edits: [
		one(RUNNER, GUARD_TAIL, "\t}\n}\nconst width"),
	], tests: [T_RUN], expectRed: [R_2666] },
	{ n: "p3", name: "the guard on the pool site only", edits: [
		one(RUNNER, "\t\t\tremoveFinishedTemp(name, fileTmp);", `\t\t\t${OLD_REMOVE}`),
	], tests: [T_RUN], expectRed: [R_2666] },
	{ n: "p4", name: "the busy folder printed as a WARN with the exit code left at 0", edits: [
		one(RUNNER, GUARD_TAIL, "\t\tconsole.log(`WARN ${failure}`);\n\t}\n}\nconst width"),
	], tests: [T_RUN], expectRed: [R_2666] },
	{ n: "p5", name: "main's execFileSync taskkill inside the kill function", edits: [
		one(T_BR, 'import { spawn, spawnSync } from "node:child_process";', 'import { execFileSync, spawn, spawnSync } from "node:child_process";'),
		one(T_BR, KILL_CALL, KILL_CALL.replace('runner("taskkill"', 'execFileSync("taskkill"')),
	], tests: [T_BR], expectRed: [R_2667] },
	{ n: "p5b", name: "the kill function without its try", edits: [
		one(T_BR, "} catch { /* the tree already ended or the kill command could not start */ }", "} finally { /* p5b */ }"),
	], tests: [T_BR], expectRed: [R_2667] },
	{ n: "p7", name: "main's R-1472 fixtures with the skew kept", edits: [
		one(T_PAR, PARTNER_WAIT, "'',"),
	], tests: [T_PAR], expectRed: [R_2668, R_1472] },
	{ n: "p8", name: "only the late file waits for its partner", edits: [
		one(T_PAR, PARTNER_WAIT, `delayMs ? ${PARTNER_WAIT.slice(0, -1)} : '',`),
	], tests: [T_PAR], expectRed: [R_2668] },
	{ n: "p9", name: "the skew removed", edits: [
		one(T_PAR, 'recordTiming("v2", "v1", START_SKEW_MS)', 'recordTiming("v2", "v1")'),
		one(T_PAR, 'recordTiming("r2", "r1", START_SKEW_MS)', 'recordTiming("r2", "r1")'),
	], tests: [T_PAR], expectRed: [R_2668] },
	{ n: "p10", name: "main's R-1470 fixtures with the skew kept", edits: [
		one(T_PAR, MEETING_WAIT, "'',"),
	], tests: [T_PAR], expectRed: [R_2669, R_1470] },
	{ n: "p11", name: "the three-way meeting dropped at three jobs", edits: [
		one(T_PAR, '"packages/probe/tests/a.test.mjs": meetingFixture("a", ["b", "c"]),', '"packages/probe/tests/a.test.mjs": meetingFixture("a", ["c"]),'),
	], tests: [T_PAR], expectRed: [R_2669] },
	{ n: "p12", name: "a batching pool in the copied runner", edits: [
		one(RUNNER, POOL, "\t\tfor (let i = 0; i < queue.length; i += size) await Promise.all(queue.slice(i, i + size).map((file) => runOne(file)));"),
	], tests: [T_PAR], expectRed: [R_1470, R_2669] },
	{ n: "p13", name: "main's --poll 0.1 with the shim", edits: [
		one(T_BC, '"--poll", String(WORKER_POLL_SECS)', '"--poll", "0.1"'),
	], tests: [T_BC], expectRed: [R_2670] },
	{ n: "p14", name: "the sampler shim written outside the PATH folder", edits: [
		one(T_BC, 'const samplerShim = path.join(stubDir, process.platform === "win32" ? "powershell.cmd" : "ps");', 'const samplerShim = path.join(temp, process.platform === "win32" ? "powershell.cmd" : "ps");'),
	], tests: [T_BC], expectRed: [R_2670] },
	{ n: "p15", name: "FAKE_PI_HOLD_MS dropped from the fakes", edits: [
		one(T_BC, "}, ${FAKE_PI_HOLD_MS});", "}, 0);"),
	], tests: [T_BC], expectRed: [R_2670] },
	{ n: "p16a", name: "CHILD_LIMIT_MS back at 15 s", edits: [
		one(T_BC, "const CHILD_LIMIT_MS = 30_000;", "const CHILD_LIMIT_MS = 15_000;"),
	], tests: [T_BC], expectRed: [SEAL_BRIEF] },
	{ n: "p16b", name: "the removal retries changed", edits: [
		one(CFG, "export const TEMP_REMOVE_RETRIES = 5;", "export const TEMP_REMOVE_RETRIES = 3;"),
	], tests: [T_RUN], expectRed: [SEAL_RUNNER] },
	{ n: "p17", name: "the pool site's home guarded but not its temp folder", edits: [
		one(RUNNER, "\n\t\tremoveFinishedTemp(name, fileTmp);", `\n\t\t${OLD_REMOVE}`),
	], tests: [T_RUN], expectRed: [R_2666] },
];

process.exitCode = await runMutations({ lane: "win-flake-hardening", self: import.meta.url, tip: "409ce615", declared: DECLARED, pairs: PAIRS });
