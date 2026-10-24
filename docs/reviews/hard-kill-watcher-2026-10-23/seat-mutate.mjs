#!/usr/bin/env node
// Seat wrong-code pairs for lane hard-kill-watcher (gate), written by the seat 2026-10-23 after build 1 and re-run after build 2, at tip 65b43672.
// They are the draft's pairs 1 to 14 (13 split into its two variants) and the must-meet's 16 to 22; pair 15 is declared; pair 23 came after build 2.
// Each pair was checked against must-meet.md's wording and the code at the tip; the builder's own table
// (packages/nana-pack/tests/seat-mutate-hard-kill-watcher.mjs) was the starting point. Run from the lane worktree root,
// with CLAUDE_CONFIG_DIR unset (the mutation runner does not scrub it) and a scratch TMPDIR:
//   SEAT_MUTATE_DRY=1 node docs/reviews/hard-kill-watcher-2026-10-23/seat-mutate.mjs
//   SEAT_MUTATE_OUT=<file> node docs/reviews/hard-kill-watcher-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LW = "packages/nana-pack/lib/lane-watcher.mjs";
const CHILD = "packages/nana-pack/lib/lane-watcher-child.mjs";
const LOCK = "packages/nana-pack/lib/lane-lock.mjs";
const PW = "packages/nana-pack/bin/pi-worker.mjs";
const T_WC = "packages/nana-pack/tests/worker-claude.test.mjs";
const T_BR = "packages/nana-pack/tests/build-report.test.mjs";
const T_LW = "packages/nana-pack/tests/lane-watcher.test.mjs";

// Exact titles (seat-titles.mjs); the runner matches a FAIL line that starts with the title and a space.
const R_2646 = "R-2646: lane size larger starts a Claude Code larger-lane builder as claude -p with its model, default permission mode, project settings only, no MCP servers and the builder tools, in the locked worktree";
const R_2651 = "R-2651: a Claude Code builder whose CPU stays flat past the stall limit runs to its end, and the ceiling and SIGTERM still stop it";
const R_2720 = "R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher";
const R_2722 = "R-2722: a hard kill while the lane lock names another process, live or dead, leaves that lock unchanged, the temp folder empty and no watcher";
const R_2723 = "R-2723: off Windows, after SIGKILL of pi-worker alone the builder's group is gone while the other members of pi-worker's own process group and an unrelated process keep running";
const R_2724 = "R-2724: after a finished build and after the ceiling the watcher exits and the ledger holds that build's one end record";
const R_2725 = "R-2725: a hard-killed lane build gets one end record from its watcher and the report lists it as stopped, exit -, with its session cost";
const R_2726 = "R-2726: off Windows, a recorded builder pid now held by a process started after the record is not signalled and the lane lock stays";
const R_2727 = "R-2727: a watcher whose recorded builder still runs after the stop wait, or whose Windows builder ran through cmd.exe, keeps the lane lock and removes the temp files";
const R_2728 = "R-2728: a hard kill of one lane's pi-worker while a second lane builds in the same temp folder leaves the second lane's build, files, lock and watcher untouched";

const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const KILL = "killTree(builder.pid, { platform })";
const KILL_LINE = "try { killTree(builder.pid, { platform }); } catch { /* shared helper is best effort */ }";
const NORMAL_END = "if (!exists(spec.folder) && !ownsLock) return;";
const RELEASE_CALL = "releaseLaneLock(spec.lock, spec.workerPid, { readFile: options.readFile, remove: options.remove })";
const WATCH_OPTS = "captureRoot: preambleDir, onSpawn, validateAttempt";
const IDENTITY = "const identitySafe = !leaderAlive || (started instanceof Date && Number.isFinite(started.getTime()) && started.getTime() <= builder.recordedAt + LANE_WATCHER_START_TOLERANCE_MS);";
// A bounded linger (30 s, far past every test's watcher wait of about 7.7 s) so no mutated watcher outlives the run.
const LINGER_MS = "30_000";

const DECLARED = [
	"(plan) pairs 1 to 14 follow the draft's wrong-code list; 16 to 22 are the must-meet's; 13 is split into 13a (outcome failed) and 13b (exit 137), the draft's two variants",
	"(non-pair) the draft's pair 15, removal without retries: Windows-only, and the mutation runner runs on macOS (must-meet, Rows N-3 and Platforms S-5)",
	"(non-pair) the builder.pid deletion on the builder's exit: the stale file matters only between a builder's exit and pi-worker's own cleanup, so no check changes",
	"(non-pair) the ledger-exists guard in keepStoppedEnd: only the suite runner's temp removal shows the re-created folder",
	"(non-pair) the 'lane watcher not started' line: unpinned",
	"(non-pair) the watcher's start before the first temp write: probe-early in the seat's probes is its only evidence",
	"(non-pair) the explicit watcher cwd outside every worktree and temp folder: CI's Windows leg is its evidence",
	"(seat) pair 1 returns from startLaneWatcher before the hop spawn, main's state for its one caller",
	"(seat) pair 1 also names R-2728, whose must-meet text says main leaves alpha's folder and lock; pairs 4, 5, 7, 8, 9 and 21 name each further title their edit must turn red, beyond the draft's first name",
	"(seat) pair 10 lingers by polling 30 s on the normal-end path only; pair 20 lingers only while a foreign lock stays, after cleanup, so it can turn only R-2722's watcher-exit assertion red",
	"(seat) pair 14 names R-2651 (its builder runs 3 s) and R-2728; R-2646 is only alsoRed, because its builder exits at once, so its red is a race between the watcher's start and the build's end",
	"(seat) pair 16 ignores both stop-wait results and keeps the win32 cmd test; pair 17 moves both pi-worker's writer and the watcher's reader to the shared temp root (the writer alone is pair 9's effect)",
	"(seat) pair 19 releases only a lock whose owner is a dead process other than the worker, so only R-2722's dead subcase can catch it (the builder's version also removed a live owner's lock)",
	"(seat) pair 23, added after build 2 (65b43672) widened R-2727's check: removing the win32 cmd clause now turns R-2727 red; at 0233a934 it stayed PASS, because the injected waitForExit returned false for both cases",
];

const PAIRS = [
	{ n: "1", name: "no watcher (main): startLaneWatcher returns before the hop", edits: [
		one(LW, "\tconst absolute = {", "\treturn false;\n\tconst absolute = {"),
	], tests: [T_WC, T_BR], expectRed: [R_2720, R_2722, R_2723, R_2725, R_2728] },
	{ n: "2", name: "the watcher spawned directly, detached, with no hop", edits: [
		one(LW, "[childScript, LANE_WATCHER_HOP_FLAG, JSON.stringify(absolute)]", "[childScript, LANE_WATCHER_WATCH_FLAG, JSON.stringify(absolute)]"),
	], tests: [T_WC], expectRed: [R_2720] },
	{ n: "3", name: "neither the hop nor the watcher spawned detached", edits: [
		one(LW, "detached: true,", "detached: false,"),
		one(CHILD, "detached: true,", "detached: false,"),
	], tests: [T_WC], expectRed: [R_2720] },
	{ n: "4", name: "no builder kill", edits: [
		one(LW, KILL_LINE, "/* mutation: no builder kill */"),
	], tests: [T_WC], expectRed: [R_2720, R_2723, R_2728] },
	{ n: "5", name: "the worker's pid signalled in place of the builder's", edits: [
		one(LW, KILL, "killTree(spec.workerPid, { platform })"),
	], tests: [T_WC], expectRed: [R_2720, R_2723, R_2728] },
	{ n: "6", name: "lock removed without the owner check", edits: [
		one(LOCK, "if (Number(readFile(lock, \"utf8\").trim()) !== ownerPid) return false;", "readFile(lock, \"utf8\");"),
	], tests: [T_WC], expectRed: [R_2722] },
	{ n: "7", name: "the watcher never releases the lock", edits: [
		one(LW, "if (mayRelease) releaseLaneLock(", "if (false && mayRelease) releaseLaneLock("),
	], tests: [T_WC], expectRed: [R_2720, R_2723, R_2728] },
	{ n: "8", name: "captureRoot not passed, so the capture folder sits in the temp root", edits: [
		one(PW, WATCH_OPTS, "onSpawn, validateAttempt"),
	], tests: [T_WC], expectRed: [R_2720, R_2722, R_2723, R_2728] },
	{ n: "9", name: "onSpawn not wired, so no builder.pid", edits: [
		one(PW, WATCH_OPTS, "captureRoot: preambleDir, validateAttempt"),
	], tests: [T_WC], expectRed: [R_2720, R_2723] },
	{ n: "10", name: "the watcher keeps polling after a normal end", edits: [
		one(LW, NORMAL_END, `if (!exists(spec.folder) && !ownsLock) { for (const end = Date.now() + ${LINGER_MS}; Date.now() < end;) await sleep(LANE_WATCHER_POLL_MS); return; }`),
	], tests: [T_WC], expectRed: [R_2724, R_2728] },
	{ n: "11", name: "no end record from the watcher", edits: [
		one(LW, "try { keepStoppedEnd(spec, { exists, run: options.run }); } catch { /* silent best effort */ }", "/* mutation: no end record */"),
	], tests: [T_BR], expectRed: [R_2725] },
	{ n: "12", name: "no folder-or-own-lock check and no end-already-present check", edits: [
		one(LW, NORMAL_END, "if (false) return;"),
		one(LW, "if (!start || records.some((record) => record.kind === \"end\" && record.build === spec.build)) return;", "if (!start) return;"),
	], tests: [T_WC], expectRed: [R_2724] },
	{ n: "13a", name: "end outcome failed", edits: [
		one(LW, "outcome: \"stopped\",", "outcome: \"failed\","),
	], tests: [T_BR], expectRed: [R_2725] },
	{ n: "13b", name: "end exit 137", edits: [
		one(LW, "exit: null,", "exit: 137,"),
	], tests: [T_BR], expectRed: [R_2725] },
	{ n: "14", name: "the watcher reads its live worker as gone at once (prototype 1's pipe through a hop)", edits: [
		one(LW, "while (alive(spec.workerPid)) await wait(LANE_WATCHER_POLL_MS);", "while (false && alive(spec.workerPid)) await wait(LANE_WATCHER_POLL_MS);"),
	], tests: [T_WC], expectRed: [R_2651, R_2728], alsoRed: [R_2646] },
	{ n: "16", name: "lock released after the stop wait whether or not the builder lives", edits: [
		one(LW, "mayRelease = await waitForExit(builder.pid);", "await waitForExit(builder.pid); mayRelease = true;"),
		one(LW, "mayRelease = builder.launch !== \"cmd\" && await waitForExit(builder.pid);", "mayRelease = builder.launch !== \"cmd\" && (await waitForExit(builder.pid), true);"),
	], tests: [T_LW], expectRed: [R_2727] },
	{ n: "17", name: "builder.pid at tmpdir()/builder.pid instead of the lane folder", edits: [
		one(PW, "const builderPidFile = path.join(preambleDir, LANE_BUILDER_PID_FILE);", "const builderPidFile = path.join(tmpdir(), LANE_BUILDER_PID_FILE);"),
		one(LW, "const file = path.join(folder, LANE_BUILDER_PID_FILE);", "const file = path.join(path.dirname(folder), LANE_BUILDER_PID_FILE);"),
	], tests: [T_WC], expectRed: [R_2728] },
	{ n: "18", name: "the watcher also signals -workerPid", edits: [
		one(LW, KILL_LINE, "try { killTree(builder.pid, { platform }), killTree(spec.workerPid, { platform }); } catch { /* mutation */ }"),
	], tests: [T_WC], expectRed: [R_2723] },
	{ n: "19", name: "the watcher removes a lock that names a dead pid other than its worker", edits: [
		one(LW, RELEASE_CALL, "releaseLaneLock(spec.lock, ((owner) => owner !== null && owner !== spec.workerPid && !alive(owner) ? owner : spec.workerPid)(lockOwner(spec.lock, options.readFile)), { readFile: options.readFile, remove: options.remove })"),
	], tests: [T_WC], expectRed: [R_2722] },
	{ n: "20", name: "the watcher waits until the lock names its worker before it exits", edits: [
		one(LW, "\t\tawait cleanLane(spec, { ...options, alive });\n", `\t\tawait cleanLane(spec, { ...options, alive });\n\t\tfor (const end = Date.now() + ${LINGER_MS}; Date.now() < end && ![null, spec.workerPid].includes(lockOwner(spec.lock, options.readFile));) await wait(LANE_WATCHER_POLL_MS);\n`),
	], tests: [T_WC], expectRed: [R_2722] },
	{ n: "21", name: "SIGTERM in place of SIGKILL for the builder group", edits: [
		one(LW, KILL, "killTree(builder.pid, { platform, signal: \"SIGTERM\" })"),
	], tests: [T_WC], expectRed: [R_2720, R_2723] },
	{ n: "22", name: "no start-time check before the signal", edits: [
		one(LW, IDENTITY, "const identitySafe = true;"),
	], tests: [T_WC], expectRed: [R_2726] },
	{ n: "23", name: "the win32 cmd.exe launch no longer keeps the lock", edits: [
		one(LW, "mayRelease = builder.launch !== \"cmd\" && await waitForExit(builder.pid);", "mayRelease = await waitForExit(builder.pid);"),
	], tests: [T_LW], expectRed: [R_2727] },
];

process.exitCode = await runMutations({
	lane: "hard-kill-watcher",
	branch: "feat/hard-kill-watcher",
	self: import.meta.url,
	tip: "65b43672",
	declared: DECLARED,
	pairs: PAIRS,
});
