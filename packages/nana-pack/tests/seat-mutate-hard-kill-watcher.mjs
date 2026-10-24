#!/usr/bin/env node
/**
 * @module packages/nana-pack/tests/seat-mutate-hard-kill-watcher.mjs
 * @purpose Prove the hard-kill watcher's named wrong-code pairs against its must-meet checks.
 * @inputs the lane tip, mutation-runner environment and the worker, watcher and build-report tests
 * @outputs one mutation-runner record
 * @effects process and disk (delegates scratch worktrees and test runs to mutation-runner)
 * @errors exits with mutation-runner's refused or table-fault status
 */
import { runMutations } from "../lib/mutation-runner.mjs";

const worker = "packages/nana-pack/tests/worker-claude.test.mjs";
const report = "packages/nana-pack/tests/build-report.test.mjs";
const watcher = "packages/nana-pack/tests/lane-watcher.test.mjs";
const pair = (n, name, edits, tests, expectRed) => ({ n: String(n), name, edits, tests, expectRed });
const edit = (file, anchor, replacement, times = 1) => ({ file, anchor, replacement, times });
const laneWatcher = "packages/nana-pack/lib/lane-watcher.mjs";
const workerBin = "packages/nana-pack/bin/pi-worker.mjs";
const child = "packages/nana-pack/lib/lane-watcher-child.mjs";
const lock = "packages/nana-pack/lib/lane-lock.mjs";

const pairs = [
	pair(1, "no watcher", [edit(laneWatcher, "\tconst absolute = {", "\treturn false;\n\tconst absolute = {")], [worker], ["R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher"]),
	pair(2, "watcher starts without the hop", [edit(laneWatcher, "[childScript, LANE_WATCHER_HOP_FLAG, JSON.stringify(absolute)]", "[childScript, LANE_WATCHER_WATCH_FLAG, JSON.stringify(absolute)]")], [worker], ["R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher"]),
	pair(3, "hop and watcher are not detached", [edit(laneWatcher, "\t\t\tdetached: true,", "\t\t\tdetached: false,"), edit(child, "\t\t\tdetached: true,", "\t\t\tdetached: false,")], [worker], ["R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher"]),
	pair(4, "watcher does not stop the builder", [edit(laneWatcher, "\t\t\t\t\ttry { killTree(builder.pid, { platform }); } catch { /* shared helper is best effort */ }", "\t\t\t\t\ttry { void builder.pid; } catch { /* mutation: no builder stop */ }")], [worker], ["R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher"]),
	pair(5, "watcher targets the worker group", [edit(laneWatcher, "killTree(builder.pid, { platform })", "killTree(spec.workerPid, { platform })")], [worker], ["R-2723: off Windows, after SIGKILL of pi-worker alone the builder's group is gone while the other members of pi-worker's own process group and an unrelated process keep running"]),
	pair(6, "lock release ignores its owner", [edit(lock, "\t\tif (Number(readFile(lock, \"utf8\").trim()) !== ownerPid) return false;", "\t\tNumber(readFile(lock, \"utf8\").trim());")], [worker], ["R-2722: a hard kill while the lane lock names another process, live or dead, leaves that lock unchanged, the temp folder empty and no watcher"]),
	pair(7, "watcher never releases the lock", [edit(laneWatcher, "\t\tif (mayRelease) releaseLaneLock(spec.lock, spec.workerPid, { readFile: options.readFile, remove: options.remove });", "\t\tif (false && mayRelease) releaseLaneLock(spec.lock, spec.workerPid, { readFile: options.readFile, remove: options.remove });")], [worker], ["R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher"]),
	pair(8, "builder capture stays outside the lane folder", [edit(workerBin, "captureRoot: preambleDir, onSpawn", "captureRoot: undefined, onSpawn")], [worker], ["R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher"]),
	pair(9, "builder pid callback is not wired", [edit(workerBin, "captureRoot: preambleDir, onSpawn, validateAttempt", "captureRoot: preambleDir, onSpawn: undefined, validateAttempt")], [worker], ["R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher"]),
	pair(10, "normal completion watcher lingers", [edit(laneWatcher, "\t\tif (!exists(spec.folder) && !ownsLock) return;", "\t\tif (!exists(spec.folder) && !ownsLock) { await new Promise((resolve) => setTimeout(resolve, 10_000)); return; }")], [worker], ["R-2724: after a finished build and after the ceiling the watcher exits and the ledger holds that build's one end record"]),
	pair(11, "watcher writes no end record", [edit(laneWatcher, "\t\ttry { keepStoppedEnd(spec, { exists, run: options.run }); } catch { /* silent best effort */ }", "\t\ttry { void spec.build; } catch { /* mutation: no end record */ }")], [report], ["R-2725: a hard-killed lane build gets one end record from its watcher and the report lists it as stopped, exit -, with its session cost"]),
	pair(12, "normal completion gets a duplicate end", [edit(laneWatcher, "\t\tif (!exists(spec.folder) && !ownsLock) return;", "\t\tif (false && !exists(spec.folder) && !ownsLock) return;"), edit(laneWatcher, "\tif (!start || records.some((record) => record.kind === \"end\" && record.build === spec.build)) return;", "\tif (!start) return;")], [worker], ["R-2724: after a finished build and after the ceiling the watcher exits and the ledger holds that build's one end record"]),
	pair(13, "watcher records failed outcome", [edit(laneWatcher, "\t\toutcome: \"stopped\",", "\t\toutcome: \"failed\",")], [report], ["R-2725: a hard-killed lane build gets one end record from its watcher and the report lists it as stopped, exit -, with its session cost"]),
	pair(14, "watcher treats its live worker as gone", [edit(laneWatcher, "\t\twhile (alive(spec.workerPid)) await wait(LANE_WATCHER_POLL_MS);", "\t\twhile (false && alive(spec.workerPid)) await wait(LANE_WATCHER_POLL_MS);")], [worker], ["R-2646: lane size larger starts a Claude Code larger-lane builder as claude -p with its model, default permission mode, project settings only, no MCP servers and the builder tools, in the locked worktree"]),
	pair(16, "lock releases while builder survives", [edit(laneWatcher, "\t\tif (mayRelease) releaseLaneLock", "\t\tif (true) releaseLaneLock")], [watcher], ["R-2727: a watcher whose recorded builder still runs after the stop wait, or whose Windows builder ran through cmd.exe, keeps the lane lock and removes the temp files"]),
	pair(17, "builder pid file is shared by lanes", [edit(workerBin, "const builderPidFile = path.join(preambleDir, LANE_BUILDER_PID_FILE);", "const builderPidFile = path.join(path.dirname(preambleDir), LANE_BUILDER_PID_FILE);"), edit(laneWatcher, "const file = path.join(folder, LANE_BUILDER_PID_FILE);", "const file = path.join(path.dirname(folder), LANE_BUILDER_PID_FILE);")], [worker], ["R-2728: a hard kill of one lane's pi-worker while a second lane builds in the same temp folder leaves the second lane's build, files, lock and watcher untouched"]),
	pair(18, "watcher also signals the worker group", [edit(laneWatcher, "killTree(builder.pid, { platform })", "(killTree(builder.pid, { platform }), killTree(spec.workerPid, { platform }))")], [worker], ["R-2723: off Windows, after SIGKILL of pi-worker alone the builder's group is gone while the other members of pi-worker's own process group and an unrelated process keep running"]),
	pair(19, "watcher removes another dead owner's lock", [edit(laneWatcher, "releaseLaneLock(spec.lock, spec.workerPid, { readFile: options.readFile, remove: options.remove })", "releaseLaneLock(spec.lock, lockOwner(spec.lock, options.readFile), { readFile: options.readFile, remove: options.remove })")], [worker], ["R-2722: a hard kill while the lane lock names another process, live or dead, leaves that lock unchanged, the temp folder empty and no watcher"]),
	pair(20, "watcher waits on a foreign lock", [edit(laneWatcher, "\t\tawait cleanLane(spec, { ...options, alive });", "\t\tif (lockOwner(spec.lock, options.readFile) !== spec.workerPid) await new Promise((resolve) => setTimeout(resolve, 10_000));\n\t\tawait cleanLane(spec, { ...options, alive });")], [worker], ["R-2722: a hard kill while the lane lock names another process, live or dead, leaves that lock unchanged, the temp folder empty and no watcher"]),
	pair(21, "watcher uses SIGTERM for the builder group", [edit(laneWatcher, "killTree(builder.pid, { platform })", "killTree(builder.pid, { platform, signal: \"SIGTERM\" })")], [worker], ["R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher"]),
	pair(22, "watcher skips builder start identity", [edit(laneWatcher, "\t\t\t\tconst identitySafe = !leaderAlive || (started instanceof Date && Number.isFinite(started.getTime()) && started.getTime() <= builder.recordedAt + LANE_WATCHER_START_TOLERANCE_MS);", "\t\t\t\tconst identitySafe = true;")], [worker], ["R-2726: off Windows, a recorded builder pid now held by a process started after the record is not signalled and the lane lock stays"]),
];

process.exitCode = await runMutations({
	lane: "hard-kill-watcher",
	branch: "feat/hard-kill-watcher",
	tip: "feat/hard-kill-watcher",
	self: import.meta.url,
	pairs,
	declared: ["15 removal retries are a declared non-pair"],
	config: { SHARDS_DEFAULT: 2, BASELINE_RETRIES: 0 },
});
