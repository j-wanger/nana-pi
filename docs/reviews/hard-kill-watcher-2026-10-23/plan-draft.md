# hard-kill-watcher · plan draft (planner, 2026-10-24, main c273b4de)

Feature: FEAT-006 · Launch builders with execution limits

Why this feature: the watcher belongs to pi-worker's lane launch. The temp folder, the carried Claude settings, the lane lock, the builder stop and the build records are all FEAT-006 rows (R-2596, R-2597, R-2655, R-2692, R-2693). Both known-bug lines this lane closes sit in `docs/known-bugs/FEAT-006.md`: "Lane temp files (lane-temp-cleanup): a hard kill of pi-worker leaves…" and "Build records (build-records): `no end` covers…". New rows go in FEAT-006's table right after R-2694, before R-1212. No heading is added.

Spend line: the owner's 2026-10-24 pick from HANDOFF's queue, "a cleanup watcher for hard-killed builds". The current priority (every artifact made by an existing run and read by code) gains only through the build ledger: a hard-killed build gets its end record, so the build report reads `stopped` where it now reads `no end`. The rest is the safety item the owner queued on 2026-10-23.

Stakes: medium blast, reversible. Every lane build on every machine gets one detached process that may SIGKILL a process group after pi-worker dies. A wrong target ends unrelated work, and that loss cannot be undone. No stored format changes: the end record uses the existing schema and outcome. A revert restores main.

No unmerged branch touches pi-worker.mjs, pi-watchdog.mjs, build-records.mjs, process-tree.mjs, worker-claude.test.mjs or FEAT-006's known bugs, and none adds an R-27xx row; one stale seat-mutation branch touches worker-config.mjs (measured, `git diff main...<branch>` over every unmerged local and remote branch). R-2718 to R-2799 are unused in REQUIREMENTS.md, the tree, packages, scripts and docs/reviews (measured, grep).

Every claim below is marked measured or inferred. Probes and data are in `<scratch>/hkw/`: `fixture.mjs`, `probe-main.mjs`, `probe-proto.mjs`, `probe-early.mjs`, `probe-sibling.mjs`, `probe-quit.mjs`, `probe-cost.mjs` with their `*-results*.json`, the pipe test in `pipe/`, and a prototype in `proto/` (a `git archive` copy of main with the design applied; `main/` is the untouched copy). Every probe ran on this Mac (macOS, node 22.22.2) with HOME and TMPDIR inside `<scratch>/hkw/`, `CLAUDE_CONFIG_DIR` and `NANA_*` unset, and fake `claude` and `pi` builders. No model was called. Every process the probes started was gone afterwards (measured, `ps`).

## What I measured

**Main's leftovers after a hard kill** (`probe-main.mjs`, fake builder that writes its pid, starts one grandchild in its own process group and sleeps; all measured):

| Kill | Temp folder after 1.5 s | Key in temp | Lane lock | Builder and grandchild | Ledger |
|---|---|---|---|---|---|
| SIGKILL of pi-worker, Claude builder | preamble folder (preamble, prompt, settings) and `pi-review-*` capture folder (`out.txt`) | yes | left | both running | start, no end |
| Group SIGKILL of `bash -c '<node> pi-worker …'` started detached (pi 1.0.2's bash tool spawn), Claude builder | the same | yes | left | both running | start, no end |
| The same with `--lane-size small`, pi builder | preamble folder and capture folder | no | left | both running | start, no end |
| SIGQUIT of pi-worker (`probe-quit.mjs`) | the same as SIGKILL | yes | left | running | start, no end |
| SIGKILL of pi-worker alone, under a shell that stays alive (`probe-sibling.mjs`, 3 runs) | the same | yes | left | running | start, no end |

**Process groups.** Before the kill, `ps` showed pi-worker in the shell's group and the builder as its own session and group leader (`Ss`, pgid equal to its pid), with its grandchild in the builder's group (measured). The builder is spawned `detached: true` (`pi-watchdog.mjs:190`); for a Claude builder on POSIX `reviewLaunch` returns no options, so the default holds (read). The watchdog runs inside pi-worker's own process, so it dies with it (read). A group kill of the seat's shell therefore never reaches the builder.

**What a pi seat's stop sends.** Installed pi 1.0.2: the bash tool spawns the shell `detached: true` off Windows (`dist/core/tools/bash.js:65`), and abort and timeout call `killProcessTree`, which is `process.kill(-pid, "SIGKILL")` off Windows and `taskkill.exe /F /T /PID` on Windows (`dist/utils/shell.js:157-187`) (measured by reading the installed package).

**The parent poll precedent.** `bounded-spawn-child.mjs:111-118` polls `process.ppid === spec.parentPid` every `RELAY_PARENT_POLL_MS` (200 ms) and skips the poll on win32 (read). It is spawned `detached` on POSIX by `bounded-spawn.mjs:54` (read).

**Three liveness designs tried in the prototype** (all measured):
- A stdin pipe from pi-worker, carried through a hop process: the watcher read end-of-file 1 ms after it started, while pi-worker was alive. It then killed the live builder and removed its folder (first prototype run, `runs/proto-oYQ95Z/watch.log`). Cause, isolated in `pipe/`: Node destroys a child's `stdin` when that child exits, so the hop's exit closes pi-worker's write end. Without the hop the pipe works (EOF arrived at pi-worker's exit).
- Finding the builder by its command line (the unique temp folder path is in its argv): pi sets `process.title = "pi"` (`dist/cli/setup.js:4`), and a node process that does so shows only `pi` in macOS `ps -ww -o args=` and `ps -E` (measured). So a real pi builder cannot be found by argv.
- Polling `process.kill(workerPid, 0)` from a watcher started through a hop, and ending the builder by the pid pi-worker recorded at spawn: works in every run below.

**The prototype** (`proto/`): pi-worker starts the watcher right after `mkdtempSync`; pi-watchdog gains two optional options (`captureRoot`, `onSpawn`); pi-worker writes `builder.pid` into its temp folder on spawn and removes it on the builder's exit. Results (measured):
- 39 of 39 hard kills that reached the watcher cleaned up: the temp folder empty (key file and capture folder gone), the lock gone, the builder and its grandchild dead, one `stopped` end record with exit null, and no watcher left. Cleanup ended 45 to 305 ms after the kill. Runs: SIGKILL of pi-worker (6), group SIGKILL with a Claude builder (6) and a pi builder (6), group SIGKILL with an unrelated detached decoy (6, decoy alive every time), a parent-pid tree kill (`scripts/runtime-measure.mjs` `killTree`, 2), SIGKILL of pi-worker alone under a live shell (3, shell and decoy alive), group SIGKILL at the folder's first appearance (3 of 5), SIGQUIT (1), and a foreign lock (6, below).
- The other 2 of 5 kills at the folder's first appearance landed before the watcher existed. Each left one empty preamble folder: no key file, no lock, no builder.
- A lock rewritten to another pid before the SIGKILL stayed, 6 of 6; the temp folder was still emptied.
- A finished build: `spawnSync` returned in 509 to 543 ms, the temp folder was empty, and the watcher exited within one poll of pi-worker (5 of 5). A SIGTERM stop: exit 143, `close` 0 to 1 ms after `exit`, so the watcher holds none of pi-worker's streams (5 of 5).
- Without the hop, a parent-pid tree kill took the watcher with the tree and left the folder, the key file and the lock (2 of 2). A group SIGKILL without the hop still cleaned up (2 of 2), because `detached` alone gives the watcher its own session.
- worker-claude (14 pass, 1 skip), build-records (7), review-ledger (171) and watchdog-exit (6) give the same results on the prototype as on main's copy. watchdog-cpu (4 pass, 1 skip) and win32-launch (5 pass, 8 skip) pass on the prototype; I did not run them on main's copy. worker-lane fails on both copies and process-tree's R-2661 fails on both, because a scratch copy is not a git checkout and has no `templates/`.
- build-report stays green by timing only. Once the test waits for the watcher's end record, the report reads `stopped | exit - | 0 min | 128 tokens | $0.13` and R-2601's hard case fails, 3 of 3. Main reads `no end | exit - | 0 min | 128 tokens | $0.13`.
- The first prototype re-created the build-report fixture's deleted ledger folder: the test removed its temp root while the watcher appended, and `appendBuildRecord` makes missing folders. Appending only while the ledger file exists removed the leftover (5 of 5 runs clean).
- The build-report direct run on main leaves one preamble folder and one capture folder in the caller's temp folder; the prototype leaves none (measured; FEAT-031's "build-report test (lane-temp-cleanup plan)" line).

**Cost per build** (`probe-cost.mjs`, measured): a finished lane launch took 306 ms median on main and 313 ms on the prototype (10 runs each). The watcher holds 39.6 MB resident while idle and used 0.05 s of CPU in its first 10 s, mostly start-up. The hop lives about 35 ms.

**A zombie counts as alive.** `process.kill(pid, 0)` succeeds on a zombie process on macOS (measured with an unreaped `sleep`).

**Windows facts** (read from libuv's `src/win/process.c` on its v1.x branch, fetched; not run): a non-detached child joins a kill-on-close job that allows silent breakaway, so its own children are not in the job; a `detached` child gets `DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP` and joins no job; `uv_kill(pid, 0)` returns ESRCH unless the exit code is `STILL_ACTIVE`.

## Design

One sentence: pi-worker starts a detached watcher through a one-shot hop right after it makes its temp folder; the watcher polls pi-worker's pid and, when pi-worker is gone but its folder or lock remains, ends the builder group pi-worker recorded, removes the folder, writes the missing end record and releases the lock if it is still pi-worker's.

**Part 1: start the watcher (pi-worker, new `lib/lane-watcher.mjs`).** Right after `mkdtempSync` (`pi-worker.mjs:165`) and before any file is written into the folder, call `startLaneWatcher({ folder, lock, workerPid: process.pid, commonDir, since })`. It spawns `node lib/lane-watcher-child.mjs --hop <json>` with `stdio: "ignore"`, `detached: true`, `windowsHide: true`, and unrefs it. A spawn error prints `pi-worker: lane watcher not started: <code>` and the build goes on. pi-worker waits for nothing.
- The hop re-spawns the same module with `--watch <json>`, detached with ignored stdio, and exits. The watcher is then a child of a dead process: no parent-pid tree walk reaches it (`taskkill /T`, `runtime-measure` `killTree`), and off Windows it leads its own session, so no group kill reaches it.
- The key file never exists without a started hop (inferred from order: the hop is forked before the first write).

**Part 2: liveness.** The watcher calls `process.kill(workerPid, 0)` every `LANE_WATCHER_POLL_MS`. ESRCH means pi-worker is gone; EPERM counts as alive. It acts once.
- A reused worker pid reads as alive, so a reuse only delays cleanup; it never causes a kill (inferred).
- The watcher's life is bounded by pi-worker's plus one poll and one cleanup. It needs no ceiling of its own.

**Part 3: what it cleans, in order.** First it decides whether there is anything to do: the temp folder still exists, or the lane lock still names `workerPid`. If neither, pi-worker ended normally (every handled path removes the folder, then releases the lock); the watcher exits.
1. The builder (off win32). pi-worker's `onSpawn` writes the builder's pid to `<folder>/builder.pid` right after the spawn and removes the file on the child's `exit` event. The watcher calls `killProcessTree(pid)` from `process-tree.mjs`, which is `kill(-pid, "SIGKILL")` on POSIX. That signal reaches only the process group led by that pid: the builder's own group. It then waits up to `LANE_WATCHER_STOP_WAIT_MS` for the leader to go. On win32 it ends no process (open question 1).
2. The temp folder: `rmSync(folder, { recursive, force, maxRetries: LANE_WATCHER_REMOVE_RETRIES, retryDelay: LANE_WATCHER_REMOVE_RETRY_MS })`. pi-watchdog's new `captureRoot` option puts the `pi-review-*` capture folder inside the temp folder, so this one removal covers the key file, the prompt, the preamble and the builder's captured output. On the handled paths the existing `finally` (`pi-worker.mjs:365`) still removes the same single folder.
3. The end record. It looks for the newest start record with `pid === workerPid`, `lock === lock` and `startedAt >= since`. If no end record carries that build id, it appends one: outcome `stopped`, exit null, signal null, attempts 1, HEAD read in the start record's `cwd`, and usage from `collectBuildUsage(start)`. It appends only while the ledger file exists, so a deleted clone or fixture is not re-created. The record object comes from one helper moved out of pi-worker's `keepBuildEnd` into `build-records.mjs`, which both callers use.
4. The lock, last: removed only when it still names `workerPid` and the recorded builder is gone. This is `releaseLaneLock`, moved from `pi-worker.mjs:407-410` to a new `lib/lane-lock.mjs`, with an owner-pid argument. A lock left because the builder survived the stop wait falls back to the existing manual rule in the pack README.

Then the watcher exits 0. It writes nothing to stdio and never throws.

**Part 4: pi-watchdog's two options.** `runOnce` makes its capture folder under `opts.captureRoot ?? tmpdir()` (`pi-watchdog.mjs:173`) and calls `opts.onSpawn?.(child)` right after `onChild(child)` (`:193`). pi-review passes neither, so its behaviour is unchanged (inferred; review-ledger's 171 checks pass on the prototype, measured).

**Behaviour changes a seat sees.** A pi seat's Esc, closed terminal, desk stop or bash timeout now ends the builder (off Windows) and leaves no key file, capture folder or lock. The build report shows such a build as `stopped`, exit `-`, with its session cost. There is one more node process per running build.

## Dropped

- A stdin pipe as the liveness signal: Node closes the pipe when the hop exits (measured). Without the hop, a tree kill reaches the watcher (measured, the parent-pid walk).
- Finding the builder by its command line: a real pi rewrites its process title, which hides its argv from `ps` (measured).
- The parent-pid poll of `bounded-spawn-child.mjs`: after the hop the watcher's parent is pid 1 from the start, and Windows does not re-parent (read).
- A sweep of stale folders at the next launch: the builder would run and spend until then, and it needs a liveness rule anyway.
- Steering `TMPDIR` in pi-worker's own environment so runOnce's capture folder lands inside the temp folder: it works by side effect on another module; `captureRoot` says it outright.
- A new outcome word such as `killed`: it changes the `BUILD_OUTCOMES` contract and the report. `stopped` with exit null is told apart by its exit column.
- A ceiling on the watcher: its life already ends with pi-worker's. A ceiling would only make a hung pi-worker's later hard kill leave its files.
- An environment switch that turns the watcher off for tests: it would be a product kill switch that exists for tests.
- A Unix socket or named pipe served by pi-worker: macOS limits socket paths to 104 bytes, and deep temp folders exceed it; it is more code than the poll.
- Closing the empty-folder window by naming the folder before starting the watcher: it replaces `mkdtempSync` to save an empty 0700 folder in rare cases.

## Class

By AGENTS.md's letter the lane is ordinary. pi-worker is not a hook, an extension, gate policy, nana-setup or a land or review tool. pi-watchdog is not named either. pi-review imports it, but pi-review passes neither new option.

Recommendation: the gate ladder. The watcher kills process groups from a detached process after its parent is gone, a wrong target ends unrelated work, the lane touches the watchdog pi-review runs, and the carried settings file may hold a key. Ladder from this machine's roster (measured, `nana-roster.mjs`): the Opus final reviewer (`claude-review`), the astra land reviewer (`pi-review`, so no `seat-land.md`), the seat's wrong-code pairs, one independent check, and CI's Windows leg (ruling 2026-10-10). No install check: no nana-setup, hook or extension file changes. Builder: the larger builder (sol); the timing and kill targets are the risk.

A needed change to review-launch, review-round, pi-review, any hook or nana-setup stops the build, which reports instead.

## Threat model

Honest variation is in scope:
- stops: SIGKILL of pi-worker; a group SIGKILL of the shell that runs it (a pi seat's Esc, a closed terminal, a desk stop, a bash timeout); a parent-pid tree kill; `taskkill /F /T` on Windows; SIGQUIT; the handled stops (SIGINT, SIGTERM, SIGHUP), finished builds, refusals after the folder, the ceiling;
- builders: pi or Claude Code, with children in the builder's group;
- platforms: macOS, Linux, Windows; TMPDIR, TEMP and TMP spellings;
- two lanes building at once on one machine, each with its own watcher, folder, lock and builder; a lock rewritten by hand to another process before a hard kill; the next build taking the lock after a normal end;
- the OS reusing pids (worker or builder) — closed where the design says so, a residual elsewhere;
- the suite runner removing a test file's temp folder while a watcher cleans.

Deliberate forgery is out:
- a planted `builder.pid` or lock naming another process;
- killing the watcher on purpose, or a same-user process racing the temp folder;
- an edited pi-worker, watcher, roster or test.

A finding outside the model is a residual.

## Precedent

Precedent:
- packages/nana-setup/lib/bounded-spawn-child.mjs — a detached relay that outlives its caller and polls it (`:111-118`), ends a process tree through the shared helper (`:54-57`), and is an entry script with no exports: the shape of `lane-watcher-child.mjs`.
- packages/nana-setup/lib/bounded-spawn.mjs — the launcher half: spawns the child detached on POSIX (`:54`) and declares the poll interval with provenance (`:18-19`, `RELAY_PARENT_POLL_MS`): the shape of `lane-watcher.mjs`.
- packages/nana-pack/lib/process-tree.mjs — `killProcessTree`, the one shared group and taskkill implementation; the watcher imports it.
- packages/nana-pack/lib/tree-kill-scan.mjs — the scan that forbids `kill(-` and taskkill spellings outside the exceptions (`:61`); the new modules must pass it, so the watcher waits on the leader with `kill(pid, 0)`, never `kill(-pid, 0)`.
- packages/nana-pack/bin/pi-worker.mjs — the temp folder (`:165`) where the watcher starts; the inner `finally` (`:364-365`); `keepBuildEnd` (`:304-338`), whose record assembly moves to build-records.mjs; `acquireLaneLock` (`:386-406`) and its inline `nana-lane.lock` name; `releaseLaneLock` (`:407-410`), which moves to `lib/lane-lock.mjs`.
- packages/nana-pack/bin/pi-watchdog.mjs — runOnce's capture folder (`:173`), the detached spawn (`:190`) and `onChild` (`:193`), where the two options go.
- packages/nana-pack/bin/worker-config.mjs — pi-worker's configuration surface, where the new tunables go with provenance.
- packages/nana-pack/lib/build-records.mjs — `appendBuildRecord` (`:61-70`, which creates missing folders), `readBuildLedger`, `collectBuildUsage`; the end-record helper lands here.
- packages/nana-pack/lib/test-runner-config.mjs — `TEMP_REMOVE_RETRIES` and `TEMP_REMOVE_RETRY_DELAY_MS` (`:43-46`), the removal policy the watcher's retries copy by value.
- scripts/runtime-measure.mjs — `killTree` (`:148-168`), the parent-pid tree kill R-2720's tree case uses.
- packages/nana-pack/tests/worker-claude.test.mjs — the fixture, `baseEnv`, `startWorker`, `caseTemp`, `tempEnv`, `waitFor`, `stopFixtureBuilder` (`:130-193`), and the POSIX-only signal cases with their skip lines (`:495-551`).
- packages/nana-pack/tests/build-report.test.mjs — the hard-kill case (`:122-161`) that becomes R-2725's check, and `killWorkerTree`'s taskkill spelling (`:104-110`).
- docs/reviews/lane-temp-cleanup-2026-10-23/plan-attack.md — M-1, which named the watcher's shape.
- docs/reviews/lane-temp-cleanup-2026-10-23/seat-probes-f3df8596.md — probes c and d, main's leftovers.
- docs/reviews/lane-temp-cleanup-2026-10-23/plan-draft.md — the plan shape.

Named moves of private helpers (ruling 2026-10-22):
- `releaseLaneLock` and the lock file name leave `pi-worker.mjs` for `lib/lane-lock.mjs` (`releaseLaneLock(lock, ownerPid = process.pid)`, `laneLockPath(gitDir)`); pi-worker and the watcher import them.
- `keepBuildEnd`'s record assembly leaves `pi-worker.mjs` for `build-records.mjs` as one exported helper; pi-worker and the watcher import it.

Departures, each named:
- Liveness polls `process.kill(workerPid, 0)`, not the parent pid. The hop makes the watcher an orphan from the start, and a pipe cannot cross the hop (measured).
- The hop has no precedent. Without it a parent-pid tree kill takes the watcher (measured on macOS), and `taskkill /T` would on Windows (inferred).
- The watcher polls on win32 too; `bounded-spawn-child.mjs` skips its poll there.
- The watcher writes nothing to stdio; the relay prints one JSON result.
- The watcher ends no process on win32 (open question 1).

## Must-meet rows (FEAT-006, after R-2694)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2720 | WHERE the platform is not win32, WHEN pi-worker lane mode is killed with SIGKILL while its builder runs, alone, with the process group it runs in, or with its process tree walked by parent pid, its lane watcher shall, within one poll interval plus the stop wait, leave no file or folder of the lane's in the OS temp folder, no lane lock and no live process in the builder's process group, and then exit. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher` |
| R-2721 | WHERE the platform is win32, WHEN pi-worker lane mode's process tree is ended with `taskkill /F /T` while its builder runs, its lane watcher shall, within one poll interval plus the removal retries, leave no file or folder of the lane's in the OS temp folder and no lane lock, and then exit. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2721: Windows: taskkill /F /T of pi-worker's tree while a Claude builder runs leaves no temp file, no lane lock and no watcher` |
| R-2722 | IF the lane lock names another process when pi-worker lane mode is killed hard, THEN its lane watcher shall leave that lock unchanged and still remove the lane's temp files. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2722: a hard kill while the lane lock names another process leaves that lock unchanged and the temp folder empty` |
| R-2723 | WHERE the platform is not win32, WHEN the lane watcher ends a dead pi-worker's builder, it shall signal only the process group led by the builder pid pi-worker recorded at spawn, leaving pi-worker's former process group and unrelated processes running. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2723: off Windows, after SIGKILL of pi-worker alone the builder's group is gone while the shell that started pi-worker and an unrelated process keep running` |
| R-2724 | WHEN a lane build ends without a hard kill, by a finished build or the wall-clock ceiling, its lane watcher shall exit within one poll interval after pi-worker exits and append no build record. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2724: after a finished build and after the ceiling the watcher has exited and the ledger holds that build's one end record` |
| R-2725 | WHEN the lane watcher cleans up after pi-worker lane mode died with a start record and no end record, it shall append one end record with that build's id, outcome `stopped`, exit null and the matched sessions' usage, so the build report lists the build as `stopped` with exit `-` and its session cost. | `packages/nana-pack/tests/build-report.test.mjs::R-2725: a hard-killed lane build gets one end record from its watcher and the report lists it as stopped, exit -, with its session cost` |

Each row starts `untested`, then becomes `implemented` with its backticked `file::title` when its check passes. R-2724 is green on main by design: it guards the watcher's lifetime, and main has no watcher. Pairs 10 and 12 turn it red. Drop it if a reviewer holds that every must-meet row must be red on main; the watcher's lifetime is then unpinned.

Existing rows: R-2601 keeps its text and title; its check keeps the hand-written ledger rows and gives its real hard-kill case to R-2725. R-2667 (FEAT-031) keeps its test; its text's "letting the test go on to report R-2601's verdict" becomes "R-2725's verdict". R-2596, R-2597, R-2692 and R-2693 keep their text and titles. No seal test: no new sealed tunable.

### What each test does, and why it is red on main

Fixture additions in `worker-claude.test.mjs` (fixture edits, no new title):
- `FAKE_BODY`: when `WC_GRANDCHILD` is set, start one sleeping node child without `detached` (so in the builder's group) and write its pid to `${WC_PID_FILE}.grand`. The doubled `\\n` escapes in `FAKE_BODY` must survive.
- POSIX fake pi: when `WC_PI_SLEEP_SECS` is set, write `$$` to `WC_PID_FILE`, then `exec sleep "$WC_PI_SLEEP_SECS"` (exec keeps the pid).
- `watchersFor(root)`: processes whose command line holds `lane-watcher-child.mjs` and the case root's unique folder name. Off win32 it reads `ps -A -ww -o pid=,args=`; on win32 it reads PowerShell `Get-CimInstance Win32_Process` command lines. The folder name has no backslash, so the JSON escaping in the watcher's argv does not matter.
- `hardKill(child)`: SIGKILL off win32, `taskkill /PID <pid> /T /F` on win32 (build-report's `killWorkerTree` spelling).
- `WATCHER_BOUND_MS` = `LANE_WATCHER_POLL_MS + LANE_WATCHER_STOP_WAIT_MS + LANE_WATCHER_REMOVE_RETRIES * LANE_WATCHER_REMOVE_RETRY_MS + WATCHER_MARGIN_MS`, all imported by name except the test's own chosen margin.
Each case uses a fresh `caseTemp` root through `tempEnv`, clears the lock before and after, and kills any fixture builder it started.

- **R-2720** (POSIX; SKIP on win32 by name). Four cases, each waiting up to `WATCHER_BOUND_MS` after the kill:
  a. Claude build, `WC_GRANDCHILD` set; once the pid and grandchild files exist, SIGKILL pi-worker.
  b. The same build started as `bash -c '<node> <pi-worker args>'` with `detached: true`; `process.kill(-bash.pid, "SIGKILL")`.
  c. As b, with `--lane-size small` and the sleeping fake pi.
  d. As b, killed with `killTree(bash.pid)` from `scripts/runtime-measure.mjs`.
  Assert for each: the temp root is empty, no lock, `process.kill(-builderPid, 0)` throws ESRCH, and `watchersFor(root)` is empty. Red on main: a to c leave the preamble folder with the key file, the capture folder, the lock and both builder processes (measured, `probe-main.mjs`). Case d leaves the folder and the lock, because main has no watcher (inferred; the prototype without the hop left exactly that, measured).
- **R-2721** (win32 only; SKIP elsewhere by name). Claude build through `startWorker`; once the pid file exists, `taskkill /PID <pi-worker> /T /F`. Wait up to `WATCHER_BOUND_MS`; assert an empty temp root, no lock and no watcher. Red on main: inferred, since main has no watcher and a forced kill runs no handler.
- **R-2722** (every platform). Claude build; once the pid file exists, write the lock as `${process.pid}\n` (a live process that is not pi-worker); `hardKill(child)`. Wait up to `WATCHER_BOUND_MS` for an empty temp root. Assert the lock still reads the test's pid and the temp root is empty. Red on main: the folder stays (measured off Windows, `probe-main.mjs`; inferred on Windows).
- **R-2723** (POSIX; SKIP on win32 by name). Start `bash -c '<node> <pi-worker args>; sleep 30'` detached, so the shell outlives pi-worker in pi-worker's former group, and one detached `node -e` decoy. Once the builder and grandchild pids exist, read pi-worker's pid from the ledger's last start record (R-2596's `pid`) and SIGKILL that pid alone. Wait up to `WATCHER_BOUND_MS` for an empty temp root and no lock. Assert the shell and the decoy are alive and `process.kill(-builderPid, 0)` throws ESRCH. Then kill the shell's group and the decoy. Red on main: the builder group is still running (measured 3 of 3, `probe-sibling.mjs`).
- **R-2724** (every platform). Two runs: a finished build (`runWorker`), and the ceiling (`--max-secs 1 --stall-secs 10`, `WC_SLEEP_MS` 10000). After each, wait `LANE_WATCHER_POLL_MS + WATCHER_MARGIN_MS`. Assert `watchersFor(root)` is empty and the ledger holds exactly one end record for that run's build id. Green on main by design.
- **R-2725** (every platform), in `build-report.test.mjs`. The existing hard case keeps its fixture (a fake pi that writes a real session through pi's `SessionManager`) and its kill (SIGKILL off win32, `taskkill /T /F` on win32). After the kill it waits up to the watcher bound for an end record carrying the build's id, then runs the report. Assert a line matching `| lane report-linked | stopped | exit - |`, `128 tokens | $0.13`, and exactly one end record. R-2601's check drops its hard case. Red on main: the report says `no end` (measured, 3 of 3).

## Tunables

In `packages/nana-pack/bin/worker-config.mjs`, each with its provenance line:
- `LANE_WATCHER_POLL_MS = 200` — chosen 2026-10-24: `RELAY_PARENT_POLL_MS`'s interval; macOS cleanup ended 45 to 305 ms after a kill (measured, 39 runs).
- `LANE_WATCHER_STOP_WAIT_MS = 2_000` — chosen 2026-10-24: bounds the wait for the killed builder before the lock is released; the fake builder was gone within 30 ms of SIGKILL (measured); real builders not measured.
- `LANE_WATCHER_REMOVE_RETRIES = 5` and `LANE_WATCHER_REMOVE_RETRY_MS = 100` — chosen 2026-10-24: the suite runner's temp-removal policy (`TEMP_REMOVE_RETRIES`, R-2666), for handles still closing after a Windows tree kill; no Windows hold measured.
- `LANE_BUILDER_PID_FILE = 'builder.pid'` — chosen 2026-10-24: beside the preamble in the lane temp folder.
In `lib/lane-watcher.mjs`: `LANE_WATCHER_HOP_FLAG = '--hop'` and `LANE_WATCHER_WATCH_FLAG = '--watch'`, the contract between the two watcher modules. In `lib/lane-lock.mjs`: `LANE_LOCK_FILE = 'nana-lane.lock'`, moved from pi-worker's inline literal (contract: the lock file the pack README names). Test only: `WATCHER_MARGIN_MS = 3_000`, chosen for CI slack.

None is sealed, so no seal test. Retuning any of them changes no test, because every bound imports the names.

## Wrong-code pairs (the seat runs each; each must turn its test red every run)

"Measured" means I ran the variant once in the prototype or on main's copy.
1. No watcher (main) → R-2720, R-2722, R-2723 and R-2725 (measured); R-2721 on Windows (inferred).
2. The watcher spawned directly, detached, with no hop → R-2720 case d (measured); R-2721 on Windows (inferred).
3. Neither the hop nor the watcher spawned `detached` → R-2720 cases b and c (inferred: the group kill reaches them).
4. No builder kill → R-2720 (builder group alive) and R-2723 (inferred).
5. `killProcessTree(workerPid)` in place of the builder's pid → R-2723 (the shell dies) and R-2720 (the builder lives) (inferred).
6. Lock removed without the owner check → R-2722 (inferred).
7. The watcher never releases the lock → R-2720 (inferred).
8. `captureRoot` not passed → R-2720 (the capture folder stays in the temp root) (inferred).
9. `onSpawn` not wired, so no `builder.pid` → R-2720 (builder alive) (inferred).
10. The watcher keeps polling after a normal end → R-2724 (inferred).
11. No end record from the watcher → R-2725 (inferred).
12. No "folder or own lock left" check and no "end already present" check → R-2724 (two end records) (inferred).
13. End outcome `failed`, or exit 137 → R-2725 (inferred).
14. The stdin-pipe design through a hop (prototype 1) → every lane build test that runs a builder past one second, starting with R-2646 (measured: the watcher killed a live build at once).
15. Removal without retries → R-2721, Windows only (inferred; the mutation runner runs on macOS, so this one is seat-run on CI or not at all).

Not pairs, declared: removing the `builder.pid` deletion on the builder's exit changes no check, because the stale file matters only in the milliseconds between a builder's exit and pi-worker's own cleanup. Removing the ledger-exists guard changes no check, because only the suite runner's temp removal shows the re-created folder. The `lane watcher not started` line is unpinned.

## Windows notes

- R-2721 and R-2725 are the Windows evidence: both end pi-worker with `taskkill /T /F`. R-2722 and R-2724 run there too. R-2720 and R-2723 SKIP by name.
- The hop is spawned `detached`, so it joins no libuv job; the watcher it spawns is detached too. `taskkill /T` walks parent pids, and the watcher's parent, the hop, exits about 35 ms after starting. So `taskkill /T` of the seat's shell does not reach the watcher (inferred from libuv's source and taskkill's documented tree walk; CI must show it).
- A `taskkill /T` that lands during the hop's 35 ms takes both, and the folder stays (inferred).
- The watcher ends no process on win32. After a pi seat's stop, `/T` has already ended the builder (inferred). After a forced kill of pi-worker alone (no `/T`): a Claude builder started through `claude.cmd` has its `cmd.exe` in pi-worker's job, so it dies, but claude's own node process broke away from the job and keeps running; a pi builder is detached and keeps running (inferred, libuv flags). The running builder holds its capture file open, so that file and its folder stay until it exits; the watcher still removes what it can.
- The lock is released only when the recorded builder pid is gone. For `claude.cmd` the recorded pid is `cmd.exe`, so after a forced kill without `/T` the lock can go while claude still runs (inferred).
- `process.kill(pid, 0)` returns ESRCH for a dead process even while another process holds its handle (libuv source, read).
- Removal retries cover handles that close a moment after `taskkill` returns (inferred; R-2666's policy).
- `watchersFor` on win32 uses PowerShell CIM, which takes about a second per call (inferred); it runs three times.

## Known limits (the seat writes them to the named files before the final round)

FEAT-006:
- On Windows the watcher ends no builder. A forced kill of pi-worker alone, without `/T`, leaves a pi builder or the claude behind `claude.cmd` running, holding its capture file, and may release the lock while it runs.
- A kill in the few milliseconds between the temp folder's creation and the hop's start leaves one empty folder, with no key file and no lock (measured 2 of 5 at the folder's first appearance).
- Where pi-worker becomes a zombie that nothing reaps, the watcher reads it as alive and waits. On a host PID 1 always reaps; in a container whose PID 1 is a Node process without an init, it may never reap (measured: `kill(pid, 0)` succeeds on a zombie; the container case inferred).
- A reused pi-worker pid delays cleanup until that process ends; Windows reuses pids sooner than macOS (inferred).
- A builder pid reused by a new process-group leader in the milliseconds between the builder's exit and pi-worker's removal of `builder.pid` could be signalled, if pi-worker is killed inside that window (inferred; not reproducible).
- The watcher's end record says `stopped`, exit null, attempts 1, even when the builder had finished and pi-worker died writing its own end, or died before the builder started (inferred from code).
- A command the builder's tools run in its own process group survives the watcher, as it survives every stop on main (FEAT-006's Claude Code builder line).
- Each running build carries one more node process, about 40 MB resident (measured 39.6 MB on macOS).
- If the watcher itself is killed, main's leftovers return.
- The watcher writes no diagnostics; a failed removal leaves only the files.
- The ledger guard checks that the file exists just before appending; a ledger deleted in between is still re-created (inferred).

FEAT-031:
- None new. The build-report hard-kill leftover line closes.

## Not verified

- Anything on Windows or Linux. Every probe ran on this Mac. CI's Windows leg must show R-2721, R-2722, R-2724 and R-2725 PASS and R-2720 and R-2723 SKIP.
- That `taskkill /T` misses the hopped watcher on Windows.
- A real pi or claude builder; real builders' exit time after SIGKILL.
- A real pi seat's Esc and a desk stop (simulated with a detached `bash -c` and a group SIGKILL, as pi 1.0.2's bash tool does).
- Claude Code's background-task stop and session exit on Windows.
- The pid-reuse and zombie cases, by reasoning only.

## Docs that change

- `packages/nana-pack/README.md`:
  - `:298`, the hard-kill sentence: a pi seat's ordinary stop now leaves nothing off Windows. A detached lane watcher ends the builder group, removes the temp folder with its capture folder, writes a `stopped` end record and releases the lock. On Windows it removes the files and the lock but ends no builder. Name the empty-folder window.
  - `:310`, the lock paragraph: the launch still never reclaims a lock; the watcher releases its own build's lock after the builder is gone.
  - `:320`: `no end` now means a build still running, an exception, or a hard kill the watcher did not see; a watched hard kill reads `stopped` with exit `-`.
  - The readme check stays green: no new command, path or flag.
- Headers: `pi-worker.mjs` `@effects` adds "starts a detached lane watcher"; `pi-watchdog.mjs` `@inputs` adds the optional capture root and spawn callback; `build-records.mjs` gains the end-record helper; three new modules with the six-tag header. Regenerate `docs/code-map.md`; `map:check` and the tree-kill scan stay green.
- `REQUIREMENTS.md`: R-2720 to R-2725 in FEAT-006 after R-2694; R-2667's text names R-2725. Regenerate `docs/requirements-tree.md`.
- `docs/known-bugs/FEAT-006.md`:
  - "Lane temp files (lane-temp-cleanup): a hard kill of pi-worker leaves…" closes, replaced by the Windows and empty-folder limits above.
  - "Lane temp files (lane-temp-cleanup): Claude Code's task stop sends SIGTERM first…": its second sentence becomes the Windows limit.
  - "Lane temp files (lane-temp-cleanup, attack): a Windows console close…": SIGQUIT now cleans up (measured off Windows); the console-close and SIGBREAK cases end pi-worker, so the watcher cleans up after them too (inferred).
  - "Build records (build-records): `no end` covers…" is rewritten as the R-2725 sentence above.
  - Add the other limits above.
- `docs/known-bugs/FEAT-031.md`: "build-report test (lane-temp-cleanup plan): its hard-kill case leaves one lane temp folder…" closes (measured on the prototype).
- HANDOFF, in the reviewed change before the final round: Next item 4 drops the watcher from the queue while it builds; a Landed line; the session entry in `docs/sessions/2026-10.md`. Run `nana-writing HANDOFF.md`.
- Unchanged: pi-review, review-launch, review-round, claude-review, every hook, extension and nana-setup file.

## Seat steps

1. Cut `feat/hard-kill-watcher` from current main (c273b4de or later) at `~/nana-pi-wt/hard-kill-watcher`.
2. Run one adversary pass on this draft. Commit the must-meet of record, this draft, the attack, seat titles and build brief 1 in `docs/reviews/hard-kill-watcher-2026-10-24/`. The brief carries `Feature: FEAT-006 · Launch builders with execution limits` and the Precedent list above. Run `brief-check`.
3. Build with `pi-worker --lane hard-kill-watcher --brief … --out … --lane-size larger` (sol). Start a failure watcher and heartbeat at launch.
4. Seat checks on the tip:
   - Diff-check `worker-claude.test.mjs` for removed escapes in `FAKE_BODY`.
   - Run worker-claude, build-report, build-records, worker-lane, review-ledger, watchdog-exit, watchdog-cpu, win32-launch and process-tree directly, with a decoy `CLAUDE_CONFIG_DIR` and a scratch TMPDIR. Then check that TMPDIR holds nothing but `node-compile-cache`, and that `ps` shows no `lane-watcher-child.mjs` process.
   - `npm run test:locked`, `map:check`, the readme check, the trace, and `scripts/requirements-moved.mjs --root . --base main`, carried into the review briefs and the land.
5. Probes on the tip, macOS, scratch HOME and TMPDIR, fake builders: rerun `probe-main.mjs`, `probe-proto.mjs`, `probe-early.mjs`, `probe-sibling.mjs` and `probe-quit.mjs` against the worktree and keep the outputs in the lane folder.
6. Run pairs 1 to 14 through the mutation runner; pair 15 is Windows-only. Re-run after any seat change to code or tests, before the review.
7. Push a draft PR. CI's Windows leg must show R-2721, R-2722, R-2724 and R-2725 PASS and R-2720 and R-2723 SKIP; Linux must show R-2720 and R-2723 PASS.
8. Write the notes before the final round, and run `review-ledger keep`.
9. Run the Opus final reviewer, the astra land reviewer and the one independent check on the exact tip. Then `nana-land`.

## Open questions to the owner

1. **Windows builder after a forced kill without `/T`.** The watcher removes the files and, when the recorded builder is gone, the lock; it ends no process on Windows. Ending the recorded builder there needs a start-time check against pid reuse, and still misses the claude behind `claude.cmd`. A pi seat's own Windows stop uses `/T`, which already ends the builder (inferred). Default: **no** (known limit).
2. **The watcher's end record.** It makes a hard-killed build read `stopped`, exit `-`, with its session cost, and moves build-report's real hard-kill case from R-2601 to R-2725. Without it, the report keeps `no end` for these builds and R-2725 drops. Default: **yes**.
3. **Ladder.** By AGENTS.md's letter the lane is ordinary; the plan recommends the gate ladder because the watcher kills processes. Default: **gate**.
