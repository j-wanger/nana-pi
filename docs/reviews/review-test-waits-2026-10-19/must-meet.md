# review-test-waits — must-meet

Feature: FEAT-031 · Run checks reliably and without contaminating work
(The spec named FEAT-007. These rows describe the review tools' tests, not pi-review. FEAT-031 holds the runner's and the mutation runner's rows.)
Class: ordinary. The lane changes tests only: never pi-review, the watchdog, the ledger or a hook. Ladder: one final reviewer.
Build: complex. A pi builder runs it through pi-worker, from main after win-watchdog-cpu-read lands, because both lanes edit immutable-review.test.mjs.
Threat model: in scope is honest variation in machine load, process start time, file-write timing and Windows folder handles. A fake or launcher that lies is out.

Feature: on a slow or loaded machine, immutable-review and review-ledger's signal section pass whenever pi-review meets their checks, and a temporary folder still busy at immutable-review's end prints one named FAIL line instead of a crash.

## Cause
- The fake reviewer writes its launch record in two steps: the header, then the argv. The test treats the file's existence as a complete record. Under load it reads the header alone, so the prompt is empty.
- Every watched wait is a fixed 5 s. Windows run 39348142806 failed reclaim with `killedCheckout ""`: the killed review had not launched its reviewer within 5 s.
- In the same run, the final rmSync threw an uncaught EBUSY on the repo folder. The runner's non-verbose excerpt shows only FAIL lines, so the cause never reaches the report.

## Design
- New `tests/launch-wait.mjs` (six-tag header):
  - `LAUNCH_RECORD_WAIT_MS` is a chosen 60 s: twelve times the old wait, and above the slowest whole check seen (34.7 s, Windows).
  - `LAUNCH_RECORD_POLL_MS` is a chosen 25 ms, today's step.
  - `awaitLaunchRecord(file, { closed, isComplete, limitMs, pollMs })` reads first. It returns the text once `isComplete(text)` holds, and returns null only after the launcher has closed or the limit has passed.
- immutable-review.test.mjs:
  - One Node fake body runs on every platform. win32 keeps writeFakePi. On POSIX, `pi` is a sh file that execs node on the body file, so pi-review's pid is kept. The sh twin goes.
  - The body writes the pid file first, then the whole record to `<OBSERVE>.part` in one write, then renames it onto OBSERVE.
  - The dirty-state, signal and reclaim checks wait through awaitLaunchRecord, each with its launcher's close promise.
  - The final rmSync gets maxRetries 5 and retryDelay 100 ms, both chosen. If it still throws, the file prints the FAIL-only line `the test's temporary folder is removed at the end` with the error code and path.
  - The stall check stays as win-watchdog-cpu-read leaves it. The stale "until W7c" comments are reworded; the code under them stays.
- review-ledger.test.mjs section 7:
  - The exit promise is made at spawn, and the test waits for `/^\d+\n$/` in CHILD_PID with it.
  - Only a launcher that still runs gets the signal. A null record fails that case by name.
- New `review-test-waits.test.mjs`:
  - R-1923 and R-1924 call the helper first.
  - Then one child run of immutable-review, with its own TMPDIR, TMP and TEMP, and a chosen 270 s limit.
  - The child gets a runtime-written CommonJS preload, appended to NODE_OPTIONS as `--require="<path with forward slashes>"`.
  - In the preload, pi-review with OBSERVE_PID set sleeps a chosen 10 s before it starts.
  - A process with OBSERVE_PID set sleeps a chosen 1 s before each writeFileSync, appendFileSync or renameSync onto OBSERVE.
  - In the test process, a recursive rmSync of the `immutable-review-test-` root throws EBUSY.

## Must-meet (file: packages/nana-pack/tests/review-test-waits.test.mjs)
| # | Row | Requirement | Test title |
|---|---|---|---|
| M1 | R-1920 | WHEN a pi-review launch that the immutable-review test watches starts its reviewer more than five seconds late, the test shall pass each check that launch meets, waiting up to the chosen launch wait limit for the reviewer's launch record. | `R-1920: immutable-review passes every watched launch's checks when each reviewer starts late` (PASS: dirty-state, review standard, provider and model, source commit, removed after success, reclaim, and signal off win32) |
| M2 | R-1921 | WHEN the immutable-review test's fake reviewer pauses between writes to its launch record, the test shall read that record only once it holds the reviewer's full arguments. | `R-1921: immutable-review reads the full prompt when the fake reviewer pauses while writing its record` (PASS: dirty-state, review standard) |
| M3 | R-1922 | IF the immutable-review test cannot remove its temporary folder when it ends, THEN the test shall print one FAIL line naming the folder and the error code instead of ending on an uncaught exception. | `R-1922: a busy temporary folder at immutable-review's end gives one named FAIL line, not an uncaught exception` (the line with EBUSY and the folder; no stack line; exit status equals the FAIL-line count) |
| M4 | R-1923 | WHEN a review tool test waits for a launched process's record file, the shared launch wait shall return the record only once the caller's completeness test holds for its text. | `R-1923: the launch wait returns a pid record only once it is complete` |
| M5 | R-1924 | IF the launcher exits, or the chosen launch wait limit passes, before the record is complete, THEN the shared launch wait shall return no record. | `R-1924: the launch wait returns no record when the launcher exits first or the limit passes` |
No check skips. NODE_OPTIONS, the Node fake, rename and Atomics.wait work alike on macOS, Linux and Windows.

## Red today (a temp clone of main d4423eff, macOS)
- Root cause, probe A: today's sh fake with 1 s between its writes gave exactly two FAILs, dirty-state and review standard, with `observed[3]` "".
- M1, M2, M3: today's file under the preload gave 13 PASS and 5 FAIL (dirty-state, review standard, source commit, signal, reclaim), then an uncaught EBUSY with a stack, in 32 s.
- Wrong B (unified fake, fixed 5 s waits) under the preload gave the same 5 FAILs and the crash.
- Wrong A (the fix, but the fake writes in two steps) gave exactly dirty-state, review standard and the cleanup line, exit 3.
- The fix under the preload: 18 PASS plus the cleanup FAIL, exit 1, 46 s. A plain run: 18/18 in 13 s. The unified fake alone: 18/18 in three runs.
- M4, M5: no helper exists, so the import fails. The planner's probe H: a helper that returns on existence failed M4; one that ignores exit and the limit failed M5.
- review-ledger, the planner's probe E: section-7 launches 6 s late crashed on an uncaught ENOENT after 67 passes.

## Known limits
- No suite test re-runs review-ledger late, because the file takes about 2.5 minutes. Probe E is its evidence, and M4 pins the wait it uses.
- M3 names a busy folder; it does not free it. The CI holder is inferred: a PowerShell CPU read, working in the test repo, outlived pi-review when the stall check's 30 s guard ended it. win-watchdog-cpu-read's 120 s guard removes that path (inferred).
- The meta run adds about 46 s per suite run on macOS (probed). On Windows the cost is an estimate, up to about 200 s, inside the 270 s limit.
- All probes ran on macOS. The lane's CI run is the Linux and Windows evidence.
- The meta check depends on immutable-review's env names (OBSERVE, OBSERVE_PID) and check titles. A rename fails the meta check by name.
- Seat only: close the "Review tools on Windows" residual, and reword the "until the short-path gate lane lands" entry.