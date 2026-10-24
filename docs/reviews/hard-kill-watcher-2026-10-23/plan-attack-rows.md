# hard-kill-watcher · plan attack · lens: rows, tests, pairs, precedent and standards

Adversary: rows lens. Draft read whole: `<scratch>/lanes/hard-kill-watcher-plan-draft.md`. Repo main at c273b4de (read only).
Work folder: `<scratch>/hkw-attack/rows/`: copies `proto-ok` (the planner's prototype), `main-copy` (main's copy), and two mutants: `proto-overkill` (watcher also calls `killProcessTree(spec.workerPid)`) and `proto-sharedpid` (builder pid file kept at `tmpdir()/builder.pid` instead of inside the lane folder). Probes: `probe-r2723.mjs`, `probe-two-lanes.mjs`, `probe-hop.mjs`, `probe-zombie.mjs`; outputs `*-results.txt` and `probe-hop-*.json` beside them.
Every probe ran on this Mac (macOS, bash 3.2.57, node from PATH), HOME and TMPDIR in the work folder, `CLAUDE_CONFIG_DIR` and `NANA_*` unset, fake `claude` builders only, no model call. After each run `ps` showed no process of mine (by work-folder path, plus a check for the grandchild, decoy and burner command lines). Other adversaries' probes ran on this machine at the same time (load average about 3.8 on 10 cores), so the "idle" timings below are not truly idle.

Severity per the brief: MUST, SHOULD, NOTE. Threat model is the draft's.

## MUST

### M-1. The lock rule "release only when the recorded builder is gone" has no test and no pair, and the prototype breaks it

What I did: read design Part 3 step 4 ("removed only when it still names `workerPid` and the recorded builder is gone"), the Windows notes ("The lock is released only when the recorded builder pid is gone"), the pairs list and every planned test; read `proto/packages/nana-pack/lib/lane-watcher-child.mjs:57-71`.

What happened (measured by reading): the prototype calls `releaseLaneLock(spec.lock, spec.workerPid)` unconditionally after the stop wait, whether or not the builder is still alive. On win32 it never even checks the builder. Every planned test passes it: R-2720, R-2721 and R-2722 all end with a dead builder (SIGKILL group or `taskkill /T`), and no pair removes the condition.

Why it matters: the draft's own Windows notes say a forced kill of pi-worker alone leaves a pi builder running (detached, no job). The known-bug file names the realistic inputs: a Windows console close ends pi-worker about 10 s later without its handlers, and Ctrl+Break (SIGBREAK) has no listener (`docs/known-bugs/FEAT-006.md:95`). With the prototype's code, the watcher then releases the lock under a live builder, and the next launch in that worktree starts a second builder writing the same tree. That is a lock stolen from a running build (inferred on Windows; the code path is measured by reading). On POSIX the only reach is a builder that survives SIGKILL (D state), so a real-process test cannot reach it there.

Change:
- Design: move the watcher's decision and cleanup into one exported function with injected seams, for example `cleanLane(spec, { alive, killTree, platform, readFile, exists, rm, appendEnd, readHead, sleep, now })` in `lib/lane-watcher.mjs`, with `lane-watcher-child.mjs` a thin entry script. Precedent: `process-tree.mjs` injects `kill`, `run` and `platform` (`:25-31`). This also meets nana-standards' "inject resources … at the module boundary, so the module runs without the real resource", which the draft's entry-script-only shape (copied from `bounded-spawn-child.mjs`) does not.
- New row R-2726: "IF the builder pid pi-worker recorded still names a running process when the lane watcher's stop wait ends, THEN the watcher shall leave the lane lock in place." Test `packages/nana-pack/tests/lane-watcher.test.mjs::R-2726: a lane watcher whose recorded builder is still running after its stop wait leaves the lane lock in place`. Use real temp files for the folder and the lock, and set `alive` true for the builder pid. Run it once with platform `darwin` and once with `win32`. Red on main: the module does not exist.
- Pair 16: release the lock without the builder check, as the prototype does → R-2726.
- Optional: in the same fixture, assert that `killTree` is never called under `win32`. This pins "the watcher ends no process on win32", which today is also unpinned. It needs its own row if kept.
- Known limits: when no `builder.pid` was ever written (pi-worker killed between spawn and the write), the watcher releases the lock without knowing about a builder. One line.

### M-2. No test runs two lanes at once; a pid-file slip passes every planned test and kills the other lane's build (measured)

What I did: built `proto-sharedpid`. pi-worker writes the builder pid to `tmpdir()/builder.pid`; the watcher reads it from the folder's parent and removes it after the kill. That is a one-line slip with the new `LANE_BUILDER_PID_FILE` name. Then I ran `probe-two-lanes.mjs`: two worktrees (`feat/alpha`, `feat/beta`), one shared TMPDIR, as on one machine for one user. Alpha starts, then beta, then pi-worker alpha alone gets SIGKILL.

What happened (measured, 2 of 2 runs each):
- Single lane (the R-2720 case a shape), mutant: temp root empty, lock gone, builder group gone, watcher gone. Every R-2720 assertion passes.
- Two lanes, mutant: alpha's builder group still alive. Beta's builder group killed, so beta's pi-worker ended, and beta's folder and lock were removed. Alpha's lock was also removed while alpha's builder still runs.
- Two lanes, correct prototype: alpha cleaned up; beta's folder, lock, builder group, grandchild, watcher and pi-worker all intact. Beta then stopped on SIGTERM (exit 143) and left the root empty.

Why it matters: two lanes building at once is the standing norm (ruling 2026-10-16), and the threat model names it. No planned test or pair can see a wrong process killed, a live build's files removed or a lock released under a live builder when a second lane is involved.

Change: new row R-2727 (every platform): "WHEN the lane watcher cleans up after one lane's pi-worker died, it shall leave another lane's running pi-worker, builder, watcher, temp folder and lane lock unchanged." Test `worker-claude.test.mjs::R-2727: a hard kill of one lane's pi-worker while a second lane builds in the same temp folder leaves the second lane's build, files, lock and watcher untouched`. Setup:
- a second worktree `feat/beta` in the fixture, sharing alpha's case root as TMPDIR;
- per-lane pid files through an env name, as the probe does with `PIDF`;
- start alpha, then beta, and wait for both builders and both watchers;
- `hardKill` alpha;
- poll until alpha's watcher is gone, then assert beta is intact;
- let beta finish (a short `WC_SLEEP_MS` for beta), then assert the root is empty and both locks are gone.
On win32, `taskkill /T /F` of alpha's tree reaches only alpha's tree. Red on main: alpha's folder and lock stay (measured shape: `probe-main` leftovers).

Pair 17: the shared `tmpdir()/builder.pid` mutant → R-2727 (measured red 2 of 2; green on every single-lane shape).

## SHOULD

### S-1. R-2723 cannot see a signal to pi-worker's former group; pair 5's stated mechanism is wrong (measured)

What I did: ran `probe-r2723.mjs` with the draft's R-2723 shape, `bash -c '<node> <args>; sleep 30'`. Then I ran a "leader" shape, `bash -c 'sleep 30 & echo $! > <sib>; exec <node> <args>'`, where pi-worker leads its group and a sibling shares it. Each shape ran against `proto-ok` and `proto-overkill`, 2 runs each.

What happened (measured): in the draft's shape pi-worker's pgid is the shell's pid, not its own (for example worker 96876, pgid 96874). So `kill(-workerPid)` hits no group:
- the over-kill mutant passes every R-2723 assertion, 2 of 2 (shell alive, decoy alive, builder group gone);
- in the leader shape the mutant kills the sibling, 2 of 2;
- the correct prototype keeps it alive, 2 of 2.
Pair 5 ("the shell dies") cannot fire in the draft's shape. Pair 5 is still caught, but only through "builder alive".

Why it matters: the row's central claim, signalling only the builder's group, is unpinned for any implementation that also signals the worker's group. That group can be live: under pi's bash tool, a simple command is exec'd, so pi-worker leads the seat's group (see N-5). It can also be reused after the worker dies.

Change:
- R-2723 setup: the leader shape. Assert that the sibling and the decoy are alive and that the builder's group is gone.
- Row text: "…it shall end the process group led by the builder pid pi-worker recorded and leave running the other members of the process group pi-worker led and an unrelated process." This drops "signal only", which no test can show.
- Pair 18: the over-kill mutant → R-2723 (measured red in the leader shape).
- Correct pair 5's expected catch to "builder group alive".

### S-2. The test waits as drafted are not deterministic; replace them with event waits

What I did: read worker-claude's `waitFor` (`tests/worker-claude.test.mjs:185-189`). Ran `probe-hop.mjs` (killTree at the moment the builder and grandchild pid files exist, as case d does): 8 runs under the existing load and 10 under 20 CPU burners on 10 cores. Ran `probe-zombie.mjs` (2 runs).

What happened:
- `waitFor` stops as soon as the child exits (`child.exitCode === null && child.signalCode === null` in its loop). Reused after a kill, it returns at once and asserts before the watcher acts (read).
- Case d timing (measured): 18 of 18 runs clean, and the hop was gone at the kill every time. But `ps` first saw the watcher only 1 to 70 ms before the kill (for example first seen at 306 ms, killed at 307 ms; under burners 438 vs 439 ms). `ps` polling is coarse, so the true margin is unknown. `killTree` and `taskkill /T` walk the hop's children, so a kill while the hop lives takes the watcher. Windows process start-up is slower (inferred), and R-2721 kills "once the pid file exists".
- A synchronous wait after SIGKILL of the test's own pi-worker child keeps it a zombie (`Z`) for the whole wait. Meanwhile the watcher does nothing: folder, lock and builder all stay. Once the loop turns, cleanup ends within 1.5 s (measured, 2 of 2).
- R-2724 waits a fixed `LANE_WATCHER_POLL_MS + WATCHER_MARGIN_MS` (3.2 s) twice.
- Case c uses `workerArgs`' default `--stall-secs 2` for the fake pi; the Claude builder's stall is overridden but the pi builder's is not (read). A delayed kill lets the stall stop end the build first.

Change, for the test section:
- Before every kill: wait until `watchersFor(root)` shows exactly one `--watch` process and no `--hop` process. This pins "watcher started before the kill" and removes the tree-kill race.
- After every kill: a new `waitUntil(predicate, CASE_LIMIT_MS)` that does not stop on child exit, with completion predicate "no watcher for this root" (the watcher exits only after cleanup). Then assert every state once. `WATCHER_BOUND_MS` becomes only the poll's cap, or goes.
- R-2724: poll for watcher exit, then count end records. No fixed sleep.
- Every wait yields (`await`), never a synchronous loop. Say why in the brief: the zombie.
- Case c: pass `--stall-secs 10`.
- Known limits: add "a tree kill while the hop is alive (tens of ms on macOS, longer on Windows, inferred) takes the watcher and leaves the key file, the folder and the lock". The draft has this only in its Windows notes. Line 61's claim "the key file never exists without a started hop" does not cover tree kills.

### S-3. Rows claim timing their tests do not pin

What happened (read): R-2720 says "within one poll interval plus the stop wait", R-2721 "within one poll interval plus the removal retries", R-2724 "within one poll interval after pi-worker exits". The tests allow the poll plus the stop wait plus 500 ms of retries plus a 3 s margin, or the poll plus 3 s. So each row is wider than its test (nana-standards: "written no wider than the test"). R-2723's "signal only" is unprovable (S-1).

Change: drop the timing clauses. Each row says "shall … and then exit"; the test bounds its waits by `CASE_LIMIT_MS`. If latency matters, make a bound tunable, seal it with its own test, and name it in the row.

### S-4. The hop and the watcher inherit the lane worktree as their cwd; on Windows that can block the tests' final removals

What I did: read Part 1's spawn options and the prototype's `spawn` calls (`lane-watcher.mjs:20`, `lane-watcher-child.mjs:27`): no `cwd`, so both inherit pi-worker's cwd, the worktree root. Precedent `bounded-spawn-child.mjs` passes `cwd` explicitly. Read the final cleanups:
- `worker-claude.test.mjs:694`: `fs.rmSync(TEMP, { recursive, force })`, no retries, uncaught;
- `build-records.test.mjs:318`: the same.
On win32 the last lane run in worker-claude is R-2692's ceiling case; R-2693 and R-2694 skip, so the removal follows within milliseconds.

Why it matters (inferred, Windows only): a directory that is another process's cwd cannot be removed on Windows (EBUSY). A watcher still inside its last 200 ms poll makes those removals throw. The file then exits nonzero on CI's Windows leg, which blocks release. The suite runner's own removal has 500 ms of retries and counts a failure as FAIL (`scripts/test.mjs:405-414`).

Change: Part 1 spawns the hop and the watcher with an explicit `cwd` outside every worktree and temp folder, for example `path.parse(process.execPath).root`. The watcher already runs git with `cwd: start.cwd`. No pair; CI's Windows leg is the evidence.

### S-5. Ruling 2026-10-22: the watcher would be the third copy of the pid-liveness helper, and the test helper copy is unnamed

What happened (measured by grep): `review-round.mjs:475` `alive(pid)` and `mutation-runner.mjs:216` `pidIsAlive(pid)` are identical private helpers (EPERM counts as alive). The prototype's watcher adds a third (`lane-watcher-child.mjs:34`). The draft's planned `hardKill(child)` in worker-claude copies build-report's `killWorkerTree` (`build-report.test.mjs:104-110`, which R-2667 pins).

Change: the Precedent section names the moves.
- Move `pidIsAlive` from `mutation-runner.mjs` to `process-tree.mjs` as an exported `pidAlive`. mutation-runner and the watcher import it. review-round's copy gets a known-bug line, or moves too, since the lane is gate-class anyway (N-2).
- Move `killWorkerTree` to a shared test module beside `tests/tmp-dir.mjs`, imported by build-report and worker-claude. R-2667's check stays in build-report.

### S-6. `LANE_LOCK_FILE` and `laneLockPath` are not needed, and the draft's no-retune claim is false for them

What happened (measured by grep): the lock name appears as a literal in 6 test files (worker-claude, worker-lane, build-records, build-report, watchdog-exit, install-check) and in `packages/nana-setup/lib/install-check-config.mjs:148`. That copy carries "Contract: pi-worker.mjs:382 … (R-2686)". The watcher's spec already carries the full lock path, so it never needs the name.

Why it matters: "Retuning any of them changes no test, because every bound imports the names" is wrong for `LANE_LOCK_FILE`. The move also creates a named constant beside an unnamed contract copy in nana-setup, and the draft forbids touching nana-setup.

Change: move only `releaseLaneLock(lock, ownerPid = process.pid)` to `lib/lane-lock.mjs`, and leave the lock name inline in `acquireLaneLock`. If the name does move, treat it as a contract value: provenance names the row (R-960 or R-2686), one seal test, and install-check-config's copy is named in Precedent with a decision.

### S-7. R-2722 passes a watcher that never exits on a foreign lock, or that reclaims a dead pid's lock

What happened (read): R-2722 asserts the lock and the temp root but not the watcher's exit. It writes only a live pid (the test's own).

Change:
- Add `watchersFor(root)` empty to R-2722.
- Add a second subcase whose lock names a dead pid, for example a child the test started and reaped.
- Pair 19: watcher removes a lock whose pid is dead → R-2722. Pair 20: watcher waits until the lock names its worker → R-2722.
The README says the launch never reclaims a lock (R-960); the watcher must not either.

## NOTE

- N-1 (spend line and dates). Today is 2026-10-23 (measured: 19:49 EDT, 23:49 UTC). The owner queued the watcher on 2026-10-23 (`docs/known-bugs/FEAT-006.md:89`; the session archive's lane-temp-cleanup entry) and picked it the same day. The draft writes 2026-10-24 for the planner date, the pick and every "chosen" provenance date. The current priority (since 2026-10-23) names "land and build records" in its appetite. So R-2725 serves it directly, which is stronger than the draft says, while the builder kill, the files and the lock serve no current line. Suggested line: "Serves the current priority in part: R-2725 completes the build record of a hard-killed build, and build records are in its appetite. The builder kill, the temp-file removal and the lock release are the safety fix the owner queued and picked on 2026-10-23; they serve no current line, and the plan proposes no change to the lines." Fix the provenance dates to the real day.
- N-2 (class). By AGENTS.md's letter this is a gate lane. It changes `runOnce` in `pi-watchdog.mjs`, which pi-review runs for every review (`pi-review.mjs:35` import, `:203` call), and "changes … the land and review tools (`pi-review` …)" covers a change to the code pi-review executes; "pi-review passes neither option" speaks to effect, not to the change. I confirm the gate ladder but dispute "ordinary by letter". Drop open question 3: it is not the owner's call (writing rule: decide and say so). lane-temp-cleanup took the gate ladder on the owner's word. The local install check is not required, but it launches a real pi-worker lane build and checks the lock release (R-2686), which is cheap evidence for this lane.
- N-3 (pair 15). A Windows tree kill likely releases handles before the watcher's first poll, 200 ms later, so "removal without retries" will rarely turn R-2721 red (inferred). That breaks the draft's "each must turn its test red every run". With M-1's injected core, pin the retries with an injected `rm` that fails twice, or declare pair 15 not a pair.
- N-4 (start order). "Start the watcher before the first write" is unpinned. A watcher started after the settings write, or in `onSpawn`, passes every planned test, because every kill waits for the builder pid. Add it to "Not pairs, declared". `probe-early` in seat step 5 is the only evidence.
- N-5 (case b and c shape). `bash -c '<single command>'` execs the command (measured, bash 3.2: `bash -c 'sleep 3'` leaves only `sleep 3` as the group leader; `bash -c 'sleep 3; true'` keeps bash). So case b's "process group it runs in" holds only pi-worker, the same as case a with pi-worker as leader. Use `bash -c 'cd <lane> && <node> <args>'` to match a seat's usual compound command.
- N-6 (signal strength). The fake builder dies on SIGTERM, so a watcher sending SIGTERM instead of SIGKILL passes. With `WC_GRANDCHILD` set, have the fake builder ignore SIGTERM; then pair 21 (SIGTERM in place of SIGKILL) → R-2720.
- N-7 (end-record match). Matching the start by pid, lock and `since` is unpinned. A watcher matching by lock only passes R-2725. Generating the build id before the watcher starts, and passing it in the spec, makes the match exact and drops `since` (subtraction).
- N-8 (consumers and records the design touches):
  - The install check reads end records (`install-check.mjs:309-311`: exactly one end, outcome ok, exit 0). Verdicts do not change, because the watcher acts only on hard kills, which already fail there. Name it as a consumer.
  - R-2597 defines `stopped` "with the signal", but the watcher's `stopped` carries signal null. Say so in R-2725's text or the README's :320 change.
  - FEAT-031's "Windows flakes (win-flake-hardening, plan): build-report's hard-kill worker polls above the test's start wait…" line concerns the case that moves to R-2725. Carry it over or close it.
  - `worker-config.mjs`'s `@purpose` and `@outputs` must name the new lane-watcher values; the draft's header list omits it.
  - `LANE_WATCHER_REMOVE_RETRIES` and `LANE_WATCHER_REMOVE_RETRY_MS` copy R-2666's values by value. Either import `TEMP_REMOVE_RETRIES` or call them chosen on their own.
- N-9 (R-2724). It earns its place: pairs 10 and 12 need it, and nothing else asserts that the watcher exits after a normal end. Keep it, green on main. Its ceiling half goes through the same path as the finished build (folder removed, then lock released), so dropping it is an optional subtraction.
- N-10 (git timeout). The prototype's `spawnSync("git", ["rev-parse","HEAD"])` has no timeout and runs before the lock release (`lane-watcher-child.mjs:45, 70-71`). A hung git blocks the release for good. Give it a timeout tunable with provenance, or release the lock before writing the record.

## Wrong implementations against the planned tests

| Wrong implementation | Caught by the draft's tests? | Proposed catch |
|---|---|---|
| Kills the worker's group in place of the builder's (pair 5) | yes, R-2720 and R-2723 via builder alive; not via "shell dies" (measured pgid) | keep; fix the expected catch |
| Kills the worker's group as well as the builder's | no (measured 2 of 2 passes) | S-1 leader shape, pair 18 |
| Builder pid file at a shared temp path | no (measured 2 of 2 passes) | M-2 R-2727, pair 17 |
| Releases the lock with no owner check (pair 6) | yes, R-2722 (inferred) | keep |
| Releases the lock while the recorded builder lives (prototype) | no (read) | M-1 R-2726, pair 16 |
| Reclaims a dead pid's lock | no | S-7, pair 19 |
| Duplicate end records after a normal end (pair 12) | yes, R-2724 | keep |
| Appends twice on a hard kill | yes, R-2725 "exactly one" | keep |
| Polls the hop or its own parent | yes, R-2724 (second end record) and the existing lane tests | keep |
| Polls the builder pid | yes, R-2720 | keep |
| Starts after the first write | no | N-4, declare |
| Never exits after normal end (pair 10) | yes, R-2724 | keep, with polls (S-2) |
| Never exits on a foreign lock | no | S-7, pair 20 |
| Kills the builder pid, not its group | yes, R-2720 a and b via the grandchild (inferred) | add as a pair so the seat runs it |
| SIGTERM in place of SIGKILL | no | N-6, pair 21 |
| Ends a process on win32 | no | M-1 optional assertion |
| Removal without retries (pair 15) | rarely (inferred) | N-3 |
| Lock-only start match | no | N-7 |
