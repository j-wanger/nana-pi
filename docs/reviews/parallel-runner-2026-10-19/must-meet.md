# parallel-runner: the land suite runs four test files at once (2026-10-19)

**Feature.** With `--jobs=N`, `scripts/test.mjs` keeps up to N collected test files running at once. It reports what a serial run reports: labels, check counts, excerpts, warnings, the failed list, the self-test verdict, totals and exit code; only timings and block order differ. It prints each file's output as one block. It runs each file on the declared run-alone list while nothing else runs. `npm run test:locked` with no filter passes `--jobs=4`; `NANA_SUITE_JOBS` overrides it, and 1 restores today's serial run.

**Class: gate.** Every `nana-land` runs this suite; win-leg-blocking and runtime-map set the precedent for runner edits. Ladder: final reviewer, land reviewer, the seat's wrong-code pairs, one independent check. No nana-setup file is touched, so no install check.
**Threat model.** In scope: honest variation in test timing under load, platform (darwin, win32, linux), core count, how signals arrive (POSIX signals; the IPC trigger on Windows) and how npm passes arguments. Out of scope: deliberate forgery, such as a test that hides its own timing bound.

**Measured (2026-10-19, the 10-core seat Mac, a temp clone at a0e0a69, other lanes running).** Serial baseline: roster-set's land suite, 151 files in 814.5 s.
| Run | review-ledger | immutable-review | requirements-lift | others | timing-tight loop (hook, extension, bounded-read, test-locked, post-edit-hardening, test-runner) |
|---|---|---|---|---|---|
| alone, one after another | 137.4s | 70.2s | 40.0s | mutation-runner 49.4s | hook 4.5, extension 1.1, bounded-read 0.1, test-locked 4.6 |
| 4 at once, lock free | 126.1s | 70.9s | 40.3s | wall 148s for 247.6s of serial work | 4 rounds x 6 files: 24/24 PASS, times unchanged |
| 8 at once | 138.9s | 73.9s | 52.2s (1.3x) | mutation-runner 59.5, objective-golden 32.3, regroup 33.8, all PASS | 24/24 PASS; extension up to 1.5s |
Simulation from the runtime map (149 files, 761 s under coverage, 10-17), collection order plus the alone tail: 4 jobs 202-221 s, 6 jobs 187 s, 8 jobs 196 s. review-ledger (125-140 s) sets the floor. Longest-first saves about 4 s at 4 jobs. Expected land suite: about 13.6 minutes down to about 4. No file went red at 4 or 8 at once.

**Design.**
- New `packages/nana-pack/lib/test-runner-config.mjs`, six-tag header, `@effects none`:
  - `JOBS_FLAG = "--jobs="` (contract R-1470, R-1477).
  - `SUITE_JOBS = 4`. Chosen: 4 at once measured clean; 6 simulates 15-35 s faster but adds load beside other lanes' builders; 8 is slower.
  - `SUITE_JOBS_ENV = "NANA_SUITE_JOBS"` (contract R-1476). R-618's scrub already keeps it from test files.
  - `RUN_ALONE`, a frozen map from path to reason. Seed: `packages/nana-knowledge/tests/hook.test.mjs` (1500/1800 ms bounds), `packages/nana-knowledge/tests/extension.test.mjs` (1000/1500 ms), `packages/nana-pack/tests/bounded-read.test.mjs` (1000 ms), `packages/nana-pack/tests/test-locked.test.mjs` (1200 ms, and 70-250 ms launch waits). Chosen: each passed 8 of 8 under load, but each bound is load-sensitive by construction; alone costs about 10 s. Bounds are never loosened.
- The run-alone list sits beside SKIPS and WINDOWS_SKIPS, not as a marker in test files: the desk is frozen, and a list can be checked (R-1474).
- `scripts/test.mjs` parses `--jobs=N`; absent means 1.
  - jobs=1: today's loop, order, live verbose streaming and output, unchanged; RUN_ALONE ignored.
  - jobs>1: a pool of N over the non-alone files in collection order; a freed slot takes the next file at once, never in batches. A SKIP prints when reached, without a process. Each file's verbose output, result line and excerpt go out in one write when it ends. Alone files run one at a time after the pool drains.
  - `active` and `activeFileTmp` become sets; cleanup kills every live tree and removes every live temp root.
  - Coverage position stays the collection index. WARN lines and `failed:` print in collection order. Totals, the tracked-file check and the self-test verdict are unchanged.
  - The self-test pipe holder is reaped only after the fixture that spawns it ends. Probe: a pool prototype that kept today's reap after every fixture lost the hang line's "stdio still open" note in 5 of 6 runs at `--jobs=3`; reaping only after the hang fixture kept it 6 of 6.
- `scripts/test-locked.mjs`: with no filter and no `NANA_SUITE_TEST_COMMAND`, the npm arguments become `test -- --jobs=<NANA_SUITE_JOBS if set and not empty, else SUITE_JOBS>`. Filtered runs and the override are unchanged, so R-627 holds. test.mjs checks the value, so a bad NANA_SUITE_JOBS fails the land closed and names it.
- `npm test` and CI stay serial. `map:measure` goes through test:locked, so it runs parallel too.
- README "Tests" gets one paragraph: `--jobs=N`, the config path, test:locked's default and `NANA_SUITE_JOBS=1`.

**Must-meet.** All checks are in new `packages/nana-pack/tests/test-runner-parallel.test.mjs` except R-1476. No platform skip; R-1475 uses the IPC trigger on Windows, like R-915.
| ID | Row | Test title | Red today |
|---|---|---|---|
| R-1470 | WHEN `--jobs=N` is given, the test runner shall keep up to N test files running at once, starting the next collected file as soon as a running one ends and never running more than N. | `R-1470: --jobs=2 and --jobs=3 keep exactly that many files running and never more, and a freed slot starts the next file while a longer one still runs` | Yes. Probe: main ran four 800 ms files at `--jobs=2` one at a time (max overlap 1, 3.3 s). Adversary probe: a batching prototype (start N, wait for all) also reached exactly N, so max overlap alone cannot catch it; with a 2000 ms file first at `--jobs=2`, its third file started after the first ended, while a pool prototype's started before. |
| R-1471 | WHEN `--jobs=N` is given, the test runner shall report each file's label, check counts and failing-line excerpt, the warnings, the failed-file list, the self-test verdict, the totals and the exit code exactly as the same run without `--jobs`, apart from timings and the order of file blocks. | `R-1471: a parallel run that overlaps reports every label, count, excerpt, warning, failed name, self-test verdict, total and exit code exactly as a serial run` | Yes: the check requires the `--jobs=3` run to overlap, and today it never does. |
| R-1472 | WHERE `--jobs=N` runs files at the same time, the test runner shall print each file's shown output and its result line together as one uninterrupted block. | `R-1472: files that ran at the same time print their verbose output, or their failing excerpt, and their result line as uninterrupted blocks` | Yes: the check requires the two files to overlap. |
| R-1473 | WHERE a test file is on the declared run-alone list and `--jobs=N` is given with N greater than 1, the test runner shall run that file only while no other test file runs. | `R-1473: a file on the run-alone list runs while no other file runs, and the other files still overlap` | Yes: the other files never overlap today, and the list does not exist. |
| R-1474 | The declared run-alone list shall name only test files the runner collects, each with a non-empty reason. | `R-1474: the run-alone list names only collected test files, each with a reason` | Yes: the module does not exist. |
| R-1475 | WHEN the test runner receives SIGINT or SIGTERM while `--jobs=N` has several files running, the test runner shall kill every running file's process tree and remove every running file's temporary root and the runner's scratch directory before it exits. | `R-1475: SIGINT and SIGTERM during a parallel run kill every running tree and remove every running temp root (external signals on POSIX; handler trigger on Windows)` | Yes, inferred: today only the first of two hang files starts, so the second never records its pid. |
| R-1476 | WHEN the locked suite command runs npm test with no filter, the locked suite command shall pass `--jobs=` followed by NANA_SUITE_JOBS when that is set and not empty, otherwise by the declared suite job count. | `packages/nana-pack/tests/test-locked.test.mjs::R-1476: an unfiltered locked run passes --jobs= with NANA_SUITE_JOBS, or the declared suite job count when it is unset or empty, to npm test` | Yes. Probe: test-locked with no filter and a capturing npm_execpath passed `["test"]`. |
| R-1477 | IF a `--jobs` argument is not `--jobs=` followed by a whole number of 1 or more THEN the test runner shall exit 1 naming that argument before it starts any test file. | `R-1477: --jobs=0, --jobs=abc, --jobs=2.5, --jobs= and a bare --jobs each exit 1 naming the argument before any file starts` | Yes. Probe: `--jobs=0` ran the file and exited 0. Adversary probe: `--jobs 4`, with a space, ran only the file whose path held "4" and passed. |

**Seat evidence (no row).** (1) On the lane tip, run `NANA_SUITE_JOBS=1 npm run test:locked` once and `npm run test:locked` three times. Every run must show the same per-file labels and check counts; record wall times. A file red only in parallel joins RUN_ALONE with its measured reason; its bound is never loosened. (2) `map:check` and `readme:check` exit 0. (3) Re-run the wrong-code pairs after any seat edit.

**Known limits.**
- Per-file seconds from a parallel run, including `map:measure`, are seconds under load.
- Load from outside the suite still reaches files off the list: builders' single files and mutation split runs. The seat rule against splitting beside a full suite stands.
- Desk tests take ports from a free-port probe, so two can race for one port; not seen. origin-rule's fixed 4391 runs once per suite.
- With `--jobs`, `--verbose` shows a file's output when the file ends, not live. R-613's wording is unchanged.
- SUITE_JOBS is not capped by core count; on a small machine, set NANA_SUITE_JOBS.
- Files run in collection order, not longest first.
- The runner and the mutation runner still each keep a copy of the child setup and tree kill (the HANDOFF residual stays).
