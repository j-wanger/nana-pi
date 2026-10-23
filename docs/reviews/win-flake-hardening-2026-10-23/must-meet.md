# win-flake-hardening · must-meet of record (seat, 2026-10-23)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds.

Spend line: the owner's 2026-10-23 pick, "Plan it now", for a lane that hardens the Windows CI tests failing on timing the lanes did not touch. nana-land now refuses a land until the tip's CI run is green, so each such failure costs about 30 minutes of rerun. Measured over the last 80 CI runs: since CI moved to four files at once, 13 of 45 Windows suite legs failed (29%), most from causes no lane introduced.

Stakes: medium blast, reversible. Four test files and two cleanup sites in the runner that every suite run and every land use. No stored format changes; a revert restores main.

## Seat decisions on the attack

- **M-1 adopted: a busy folder fails, it does not warn.** All four measured runner EBUSY crashes followed that file's own FAIL, so failing costs no extra rerun; a WARN would turn a leaking test green, and nothing in CI, nana-land or the records reads WARN. Precedent: the runner's "tracked repository files changed by tests" FAIL line (`scripts/test.mjs`, counted as an unnamed failure) and R-1922. The planner's open question 1 is closed: fail.
- **Class: ordinary.** With FAIL, the runner never accepts a run it rejects today; it only runs more files before failing. Precedent: suite-records (2026-10-22), a runner edit classed ordinary. Ladder: one final reviewer (Opus).
- **M-2 adopted.** The hard-kill step's tree kill gets an injected runner, defaulting to `spawnSync` with `stdio: "ignore"`. Its check passes fakes that return status 255, return 128, and throw; nothing real is killed, so pair 5 runs on macOS. The row is narrowed to its test.
- **S-1 adopted: the row covers the temp folder only.** All four held paths were under the per-file temp folder, none under the runner's home.
- **S-2 adopted.** `CHILD_LIMIT_MS` provenance: 15 Windows legs passed brief-check in 1.8 to 4.0 s, all from failed legs (a sample biased toward loaded runners).
- **S-3 adopted.** Each fixture that asserts a millisecond floor sleeps in a loop until the measured difference reaches the floor.
- **S-4 adopted.** build-report's hard-kill worker polls above the test's start wait, as brief-check's does; its kill needs a live worker, not a sample. No test pins this; a known limit says so.
- **S-5: land order.** CI timing records first, then Claude Code builder parity, then this lane, merging main each time and re-running brief-check, build-report and test-runner at the merge tip. Shared helpers lands after this lane or merges it.
- **Out of scope:** R-2023 and templates-update (shared-helpers rewrites the relay kill), the objective hook's producer limit (a hook lane), and pi-watchdog's synchronous sampler blocking its own signal handling (a gate lane). Each is a known-limit line.

## Must-meet rows (FEAT-031, after R-2486)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2666 | IF the test runner cannot remove a finished file's temporary folder after its sealed retries, THEN it shall print one FAIL line naming that file, the folder and the error code, count it as one unnamed failure, keep that file's own verdict, and run every remaining file and print its totals, in a serial and in a parallel run. | `packages/nana-pack/tests/test-runner.test.mjs::R-2666: a finished file whose temp folder stays busy gets one FAIL line naming the file, the folder and the code, counts as one failure, and every other file still runs, serial and parallel` |
| R-2667 | WHEN the build-report test's hard-kill step runs its tree kill, it shall return without throwing whatever status the kill returns or when the kill cannot start, and the test shall go on to report R-2601's verdict. | `packages/nana-pack/tests/build-report.test.mjs::R-2667: the hard-kill step's tree kill returns without throwing whatever status it gets or when it cannot start` |
| R-2668 | WHEN one of the two files R-1472's check runs at once starts START_SKEW_MS after the other, that check shall still observe both files running at the same time, in verbose and in plain mode. | `packages/nana-pack/tests/test-runner-parallel.test.mjs::R-2668: R-1472's two files still run at the same time when one starts 2.5 seconds late, in verbose and plain mode` |
| R-2669 | WHEN one file in R-1470's check starts START_SKEW_MS late, that check shall still observe, at two jobs, the third collected file starting while the first still runs, and at three jobs, three files running at once. | `packages/nana-pack/tests/test-runner-parallel.test.mjs::R-2669: R-1470's pool checks hold when one file starts 2.5 seconds late, at two and three jobs` |
| R-2670 | WHILE a CPU sampler first on PATH takes longer than the R-2585 check's per-child limit, the R-2585 check shall still compare brief-check with pi-worker for every brief, and that sampler shall not run. | `packages/nana-pack/tests/brief-check.test.mjs::R-2670: brief-check and pi-worker give the same line for every brief while a CPU sampler slower than the child limit is first on PATH, and the sampler never runs` |

Seal tests:
- `packages/nana-pack/tests/test-runner.test.mjs::seal: a finished file's temp folder removal retries 5 times on a 100 ms step` names R-2666.
- `packages/nana-pack/tests/brief-check.test.mjs::seal: R-2585's children have a 30-second limit and the worker polls less often than that` names R-2670.

R-1470, R-1472, R-2585 and R-2601 keep their text and titles. IDs R-2671 to R-2675 stay free.

## What each test does

As the draft's "What each test does", with these changes:
- **R-2666.** The preload makes the first fixture file's temp folder busy (EBUSY with `error.path`) for every removal the runner tries. In the serial and the `--jobs=2` run: the totals line matches; all four files have a result line; the first file keeps PASS and the second FAIL; exactly one line starts `FAIL <first file>: temp folder not removed:`, holding the folder the fixture recorded and `EBUSY`; the FAIL count includes it; exit 1. A third run with only passing files and the same preload exits 1 with that one FAIL line. No stack line appears.
- **R-2667.** The kill is a local function taking an injected runner. Fakes return status 255, return 128, and throw; each call returns without throwing. The default runner is `spawnSync` with `stdio: "ignore"`. R-2601's line prints after the step.
- **R-2668, R-2669, R-2670.** As the draft, with each millisecond floor reached by a sleep loop on the measured difference (S-3).

## Tunables

As the draft's table, with `CHILD_LIMIT_MS` provenance corrected (S-2): "measured 2026-10-23 (R-2670): 15 Windows legs passed brief-check in 1.8 to 4.0 s, all from legs that failed for other reasons; 30 s is 7.5 times the slowest. Seven children at 30 s stay under the 300 s per-file land limit. It matches build-records' `CASE_LIMIT_MS`. Sealed."

## Wrong-code pairs (each must turn its test red every run)

As the draft's list, with:
- 4 (inverted): the busy folder printed as a WARN, with the exit code left at 0 → R-2666's all-pass run.
- 5: main's `execFileSync("taskkill", …)` restored inside the kill function → R-2667, on macOS through the injected runner.
- 6: dropped unless the build keeps an off-Windows group kill; if it does, an unguarded `process.kill(-pid, "SIGKILL")` → R-2667.
- 14 (reworded): the shim placed after the folder holding the real `ps` or `powershell`, or not written → R-2670's resolution assertion.
- 17 (new): the guard covers the pool site's home but not its temp folder → R-2666's parallel run.

## Known limits (the seat writes them to FEAT-031's file before the final round)

- R-1471's and R-1473's overlap preconditions keep their timing; neither failed in 93 Windows attempts.
- worker-lane and build-records keep `--poll 0.1`; worker-lane keeps its 15 s limit. The same slow-sampler exposure applies.
- build-report's hard-kill worker poll is set above the test's start wait by reading; no test pins it.
- pi-watchdog's synchronous sampler blocks its own signal handling while it runs (a SIGTERM at 15 s was handled at 40.7 s, measured). A FEAT-006 gate-lane fix.
- The retry values are chosen, not measured on a Windows hold.
- templates-update's adopt failure and R-2023's relay kill stay for shared-helpers; their link is inferred.
- The Claude Code objective hook's 1,500 ms producer limit failed twice on main's Windows runs; a hook lane.
- R-2628 (the project-stale row) failed once on a Windows pull-request leg on 2026-10-23 (run 39904357481); not yet diagnosed.
- CI reruns cannot prove the rate fell; the proof is the injected schedules and their wrong-code pairs.

## Docs that change

- `README.md`, the `npm test` paragraph: the runner retries removing a finished file's temp folder and, when it cannot, prints one FAIL line naming the file, the folder and the error, counts it as one failure, and goes on.
- `REQUIREMENTS.md`: R-2666 to R-2670 in FEAT-031 after R-2486; FEAT-031's known-bug lines this lane closes (the runner-cleanup line, the R-1472 run-alone line, FEAT-006's brief-check line) are removed by the seat in the notes.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated.

## Seat steps

1. Cut `feat/win-flake-hardening` from main. Commit this file, the draft, the attack, seat titles and build brief 1; run brief-check.
2. Build with the roster's larger builder.
3. Seat checks: test-runner, test-runner-parallel, brief-check, build-report, review-test-waits; `npm run test:locked`, map, readme, trace, `requirements-moved --base main`.
4. Pairs on the tip (the runner's own kill is unchanged, so the lane's runner judges them).
5. Draft PR CI, the Windows leg included.
6. Notes before the final round; one final reviewer (Opus).
