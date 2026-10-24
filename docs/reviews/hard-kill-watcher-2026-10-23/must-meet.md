# hard-kill-watcher · must-meet of record (seat, 2026-10-23)

Feature: FEAT-006 · Launch builders with execution limits

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass in three lenses (`plan-attack-safety.md`, `plan-attack-platforms.md`, `plan-attack-rows.md`), all kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds. The draft's dates read 2026-10-24; the real day of the pick and the plan is 2026-10-23, and every "chosen" provenance date in the build uses 2026-10-23.

Spend line: in part the current priority (since 2026-10-23, artifacts made by an existing run and read by code; its appetite names land and build records): R-2725 completes the build record of a hard-killed build. The builder stop, the temp-file removal and the lock release are the safety fix the owner queued and picked on 2026-10-23; they serve no current line, and this plan proposes no change to the lines.

Stakes: medium blast. Every lane build on every machine gets one detached process that may SIGKILL a process group after pi-worker dies; a wrong target ends unrelated work and cannot be undone. No stored format changes: the end record uses the existing schema and outcome. A revert restores main.

## Seat decisions

- **Design as the draft**, parts 1 to 4 (a detached watcher started through a one-shot hop right after the temp folder; it polls pi-worker's pid; when pi-worker is gone and its folder or own lock remains, it ends the recorded builder group off Windows, removes the folder, writes the missing end record, and releases the lock if it is still pi-worker's), with the changes below.
- **Safety M-1 adopted (pid reuse).** Before it signals the recorded builder, the watcher checks that the process now holding that pid started no later than pi-worker recorded it: the leader's start time (`LC_ALL=C ps -o lstart= -p <pid>`, whole seconds) against `builder.pid`'s mtime, within `LANE_WATCHER_START_TOLERANCE_MS`. A later start, or a start time it cannot read, means no signal and the lock stays. New row R-2726, pair 22. The draft's "a reused worker pid never causes a kill" and "milliseconds, not reproducible" are withdrawn: the attack measured a freed pid signalled 57 to 170 ms after it was freed, 8 of 8 runs, and an unrelated group killed in a simulated reuse, 2 of 2.
- **Rows M-1, Safety S-1, Platforms M-1 adopted (the lock rule).** The watcher leaves the lock in place when the recorded builder still runs after the stop wait, and on win32 whenever the builder was launched through `cmd.exe` (the recorded pid is then `cmd.exe`, not claude). New row R-2727, tested through an exported core with injected seams, once as darwin and once as win32. Pair 16. R-2721 therefore uses a directly launched builder.
- **Rows M-2, Safety S-2 adopted (two lanes).** New row R-2728 with a second worktree sharing the case's temp root. Pair 17 (the builder pid file at a shared temp path instead of the lane folder).
- **Rows S-1 adopted.** R-2723's setup is the leader shape (`bash -c 'sleep 30 & echo $! > <sib>; exec <node> <args>'`, so pi-worker leads a group with a sibling); its text drops "signal only". Pair 18 (the worker's group signalled as well). Pair 5's expected catch is "builder group alive".
- **Rows S-2, Platforms S-2 adopted (deterministic waits).** Before every kill, the test waits until exactly one `--watch` process and no `--hop` process exist for the case root. After every kill it waits, yielding (never a synchronous loop: a synchronously waited pi-worker stays a zombie and the watcher reads it as alive), until no watcher exists for the case root, bounded by a test-only case limit; then it asserts every state once. R-2724 polls for the watcher's exit instead of sleeping. Case c passes `--stall-secs 10`.
- **Rows S-3 adopted.** Rows carry no timing clauses; each says "and then exit". No latency bound is sealed.
- **Platforms M-2, Rows S-4 adopted.** The hop and the watcher are spawned with an explicit `cwd` outside every worktree and temp folder (`path.parse(process.execPath).root`), after every path in the spec is made absolute. No pair; CI's Windows leg is the evidence.
- **Platforms S-3 adopted.** Every spawn the watcher makes passes `windowsHide: true`, git included. **Rows N-10 adopted.** The watcher's `git rev-parse HEAD` gets a timeout, `LANE_WATCHER_GIT_TIMEOUT_MS`; on timeout the end record carries a null tip.
- **Platforms S-4 adopted.** The watcher unlinks the prompt and settings files by name first, then removes the folder with retries.
- **Rows N-3, Platforms S-5 adopted.** The draft's pair 15 (removal without retries) becomes a declared non-pair.
- **Rows S-5 adopted (ruling 2026-10-22).** `pidIsAlive` moves from `packages/nana-pack/lib/mutation-runner.mjs` to `packages/nana-pack/lib/process-tree.mjs` as an exported `pidAlive`; mutation-runner and the watcher import it. review-round's identical private `alive` stays and gets a FEAT-007 known-bug line. build-report's `killWorkerTree` moves to a shared test module beside `tests/tmp-dir.mjs`, imported by build-report and worker-claude; R-2667's check stays in build-report.
- **Rows S-6 adopted.** Only `releaseLaneLock(lock, ownerPid = process.pid)` moves to `lib/lane-lock.mjs`. The lock file name stays inline in `acquireLaneLock`; no `LANE_LOCK_FILE` or `laneLockPath`.
- **Rows S-7 adopted.** R-2722 also asserts the watcher has exited, and adds a subcase whose lock names a dead process that is not pi-worker. Pairs 19 and 20.
- **Rows N-5, N-6, N-7, N-8 adopted.** Case b runs `bash -c 'cd <lane> && <node> <args>'`. With `WC_GRANDCHILD` set the fake builder ignores SIGTERM; pair 21 (SIGTERM in place of SIGKILL). pi-worker makes the build id before it starts the watcher and passes it in the spec; the watcher matches the start record by that id and the `since` rule goes. R-2725's text says signal null. The install check is named as a reader of end records (no verdict changes). `worker-config.mjs`'s header names the new values.
- **Platforms S-1, N-3 known limits.** `taskkill /T` can follow a dead parent's reused pid to the watcher; a job that forbids breakaway (an OpenSSH session) can take the watcher. R-2721 prints the watcher's parent pid on failure.
- **Open question 1, decided by the seat: no.** The watcher ends no process on win32; a forced kill of pi-worker alone, without `/T`, leaves the builder running and keeps the lock (R-2727). A pi seat's own Windows stop uses `/T`, which ends the builder.
- **Open question 2, decided by the seat: yes.** The watcher writes the end record; it serves the current priority. R-2601's real hard-kill case moves to R-2725.
- **Open question 3, decided by the seat: the gate ladder, by AGENTS.md's letter.** The lane changes `runOnce` in `pi-watchdog.mjs`, which pi-review runs for every review. Opus final reviewer, astra land reviewer, the seat's pairs, one independent check, CI's Windows leg, and the local macOS install check (it runs a real pi-worker lane build and checks the lock release).

## Must-meet rows (FEAT-006, after R-2694)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2720 | WHERE the platform is not win32, WHEN pi-worker lane mode is killed with SIGKILL while its builder runs, alone, with the process group it runs in, or with its process tree walked by parent pid, its lane watcher shall leave no file or folder of the lane's in the OS temp folder, no lane lock and no live process in the builder's process group, and then exit. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2720: off Windows, SIGKILL of pi-worker, of its process group or of its parent-pid tree while a Claude or pi builder runs leaves no temp file, no lane lock, no builder process group and no watcher` |
| R-2721 | WHERE the platform is win32, WHEN pi-worker lane mode's process tree is ended with `taskkill /F /T` while a builder it launched directly runs, its lane watcher shall leave no file or folder of the lane's in the OS temp folder and no lane lock, and then exit. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2721: Windows: taskkill /F /T of pi-worker's tree while a directly launched builder runs leaves no temp file, no lane lock and no watcher` |
| R-2722 | IF the lane lock names another process, running or not, when pi-worker lane mode is killed hard, THEN its lane watcher shall leave that lock unchanged, remove the lane's temp files and then exit. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2722: a hard kill while the lane lock names another process, live or dead, leaves that lock unchanged, the temp folder empty and no watcher` |
| R-2723 | WHERE the platform is not win32, WHEN the lane watcher ends a dead pi-worker's builder, it shall end the process group led by the builder pid pi-worker recorded and leave running the other members of the process group pi-worker led and an unrelated process. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2723: off Windows, after SIGKILL of pi-worker alone the builder's group is gone while the other members of pi-worker's own process group and an unrelated process keep running` |
| R-2724 | WHEN a lane build ends without a hard kill, by a finished build or the wall-clock ceiling, its lane watcher shall exit and append no build record. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2724: after a finished build and after the ceiling the watcher exits and the ledger holds that build's one end record` |
| R-2725 | WHEN the lane watcher cleans up after pi-worker lane mode died with a start record and no end record, it shall append one end record with that build's id, outcome `stopped`, exit null, signal null and the matched sessions' usage, so the build report lists the build as `stopped` with exit `-` and its session cost. | `packages/nana-pack/tests/build-report.test.mjs::R-2725: a hard-killed lane build gets one end record from its watcher and the report lists it as stopped, exit -, with its session cost` |
| R-2726 | WHERE the platform is not win32, IF the builder pid pi-worker recorded names a running process that started after pi-worker recorded it, or whose start time cannot be read, THEN the lane watcher shall signal no process and leave the lane lock in place. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2726: off Windows, a recorded builder pid now held by a process started after the record is not signalled and the lane lock stays` |
| R-2727 | IF the builder pi-worker recorded still runs when the lane watcher's stop wait ends, or the platform is win32 and the builder was launched through cmd.exe, THEN the lane watcher shall leave the lane lock in place and still remove the lane's temp files. | `packages/nana-pack/tests/lane-watcher.test.mjs::R-2727: a watcher whose recorded builder still runs after the stop wait, or whose Windows builder ran through cmd.exe, keeps the lane lock and removes the temp files` |
| R-2728 | WHEN the lane watcher cleans up after one lane's pi-worker died, it shall leave another lane's running pi-worker, builder, watcher, temp folder and lane lock unchanged. | `packages/nana-pack/tests/worker-claude.test.mjs::R-2728: a hard kill of one lane's pi-worker while a second lane builds in the same temp folder leaves the second lane's build, files, lock and watcher untouched` |

Each row starts `untested`, then becomes `implemented` with its backticked `file::title` when its check passes. R-2724 is green on main by design (it guards the watcher's lifetime; pairs 10 and 12 turn it red). R-2729 stays free. R-2601 keeps its text and title; its check keeps the hand-written ledger rows and gives its real hard-kill case to R-2725. R-2667's text names R-2725 instead of R-2601. R-2596, R-2597, R-2692 and R-2693 keep their text and titles.

## What each test does

As the draft's "What each test does", with the changes above:
- R-2720 a to d: waits as Rows S-2; case b `bash -c 'cd <lane> && …'`; case c `--stall-secs 10`; the fake builder ignores SIGTERM under `WC_GRANDCHILD`.
- R-2721: a builder pi-worker launches directly (not through `cmd.exe`); the kill only after one watcher and no hop exist; on failure it prints the watcher's parent pid.
- R-2722: the live-lock case and a dead-pid case (a child the test started and reaped); asserts the watcher exited.
- R-2723: the leader shape; asserts the sibling and the decoy alive and the builder group gone.
- R-2724: polls for the watcher's exit, then counts end records.
- R-2726: runs the watcher's watch entry directly with a dead worker pid; its folder holds a `builder.pid` whose mtime is set 30 s back, naming a fresh detached decoy with one member; asserts the decoy and its member alive and the lock unchanged. Red on main: no watcher module.
- R-2727: unit test of the exported core with injected seams (process-tree.mjs's injection is the precedent); real temp files for the folder and the lock; `alive` true for the builder pid; once as darwin, once as win32 with a `cmd.exe` launch; asserts the lock stays and the temp files are gone. Red on main: no module.
- R-2728: a second worktree `feat/beta` in the fixture sharing the case root as TMPDIR; start alpha then beta; wait for both builders and both watchers; hard-kill alpha (SIGKILL off win32, `taskkill /T /F` of alpha's tree on win32); wait until alpha's watcher is gone; assert beta's pi-worker, builder, watcher, folder and lock intact; let beta finish; assert the root empty and both locks gone. Red on main: alpha's folder and lock stay.

## Tunables

As the draft's, with "chosen 2026-10-23", and: `LANE_WATCHER_START_TOLERANCE_MS = 1_000` (chosen 2026-10-23: `ps -o lstart=` reports whole seconds); `LANE_WATCHER_GIT_TIMEOUT_MS` (chosen, with a reason); the remove retries keep their own values, chosen, naming R-2666's policy as the reason; no `LANE_LOCK_FILE`. Test only: the case limit. None sealed.

## Wrong-code pairs (each must turn its test red every run)

The draft's 1 to 14, with pair 5's catch "builder group alive", plus:
- 16. Lock released after the stop wait whether or not the builder lives → R-2727.
- 17. `builder.pid` written to `tmpdir()/builder.pid` instead of the lane folder → R-2728.
- 18. The watcher also signals `-workerPid` → R-2723 (leader shape).
- 19. The watcher removes a lock that names a dead pid other than its worker → R-2722.
- 20. The watcher waits until the lock names its worker before it exits → R-2722 (watcher left).
- 21. SIGTERM in place of SIGKILL for the builder group → R-2720.
- 22. No start-time check before the signal → R-2726.
Declared non-pairs: the draft's pair 15 (removal without retries); the `builder.pid` deletion on the builder's exit; the ledger-exists guard; the `lane watcher not started` line; the watcher's start before the first write (`probe-early` in seat step 5 is its only evidence); the explicit watcher `cwd` (CI's Windows leg).

## Known limits (the seat writes them to the named files before the final round)

The draft's list, with: the pid-reuse line rewritten (the watcher refuses to signal a leader that started after the record; a leader whose start time it reads as not later, within one second, can still be a reuse); `taskkill /T` following a dead parent's reused pid to the watcher; a job that forbids breakaway taking the watcher; a tree kill while the hop lives (tens of milliseconds on macOS, longer on Windows, inferred) leaving the key file, the folder and the lock; on Windows a builder behind `cmd.exe`, or any builder after a kill without `/T`, keeps the lock until removed by hand, as on main; no `builder.pid` written (a kill between the spawn and the write) means the lock is released without a builder check; review-round's private pid-liveness copy (FEAT-007).

## Docs that change

As the draft's list, with: the README's hard-kill sentence naming the start-time check and the Windows lock rule; `worker-config.mjs`'s header; the closed and rewritten FEAT-006 and FEAT-031 lines cited by their opening words; FEAT-031's "Windows flakes (win-flake-hardening, plan): build-report's hard-kill worker polls above…" line carried to R-2725's case or closed.

## Seat steps

1. Cut `feat/hard-kill-watcher` from main. Commit this file, the draft, the three attack files, seat titles and build brief 1 in `docs/reviews/hard-kill-watcher-2026-10-23/`; run brief-check; open a draft PR.
2. Build with the roster's larger builder; failure watcher and heartbeat at launch.
3. Seat checks: the removed-escape diff check on `FAKE_BODY`; worker-claude, lane-watcher, build-report, build-records, worker-lane, review-ledger, watchdog-exit, watchdog-cpu, win32-launch, process-tree and mutation-runner tests each alone with a decoy `CLAUDE_CONFIG_DIR` and a scratch TMPDIR, then TMPDIR holds nothing but `node-compile-cache` and `ps` shows no `lane-watcher-child.mjs`; `npm run test:locked`, map, readme, trace, tree; `requirements-moved --base main`.
4. Probes on the tip (macOS, scratch HOME and TMPDIR, fake builders): the planner's `probe-main`, `probe-proto`, `probe-early`, `probe-sibling`, `probe-quit`, and the attack's pid-reuse and two-lane probes; outputs kept in this folder.
5. Pairs 1 to 14 and 16 to 22 through the mutation runner.
6. The local macOS install check.
7. Draft PR CI: Windows must show R-2721, R-2722, R-2724, R-2725, R-2727 and R-2728 PASS and R-2720, R-2723 and R-2726 SKIP; Linux R-2720, R-2723 and R-2726 PASS.
8. The independent check.
9. Notes before the final round (with pi-version-support's late notes); `review-ledger keep`.
10. Opus and astra on the exact tip; then nana-land.
