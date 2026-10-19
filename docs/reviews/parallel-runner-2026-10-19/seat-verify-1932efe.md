# Seat checks — parallel-runner builds 1 and 2, tip 1932efe (2026-10-19)

- Builds by Claude Sonnet 5: build 1 at 3d21ad7 (rows, config and tests, runner unwired) and d50de2f (the wiring);
  build 2 at 5782c50 closed the seat's three gaps, each shown red first by the builder: M17 (R-1471's parallel run now
  checks that no `nana-test` temp root is left), M15 (a fixture forces out-of-order failing finishes, so the `failed:`
  line is compared exactly) and the independent check's finding 1 (below). 535bba2 adds only the seat's pairs record for
  5782c50. 1932efe merges main b8616fb: REQUIREMENTS.md keeps bench-win's rows and this lane's side by side, and
  `scripts/test.mjs` merged cleanly with bench-win's skip-list change. On 1932efe the seat ran test-runner (44),
  test-runner-parallel (8), test-locked (17), runtime-map (8) and the three requirement test files alone; all pass.
- CI run 39287745011 on draft pull request #48 at 1932efe (GitHub's merge onto b8616fb): macOS `157 files: 155 PASS,
  0 FAIL, 2 SKIP` (7,539 checks pass, 0 fail, 733.9 s); Ubuntu `155 PASS, 0 FAIL, 2 SKIP` (7,486 pass, 568.9 s);
  Windows `140 PASS, 0 FAIL, 17 SKIP` (6,465 pass, 1,261.7 s; `ci-windows-run-1.log`, the 17 SKIPs being the 16
  declared desk files and study-tasks). install-check on macOS and Windows: success. No file from main's known set
  failed on this run. The lane's three files on each leg:

  ```
  macOS    PASS  packages/nana-pack/tests/test-runner-parallel.test.mjs          8 pass  28.3s
           PASS  packages/nana-pack/tests/test-runner.test.mjs                   44 pass  17.6s
           PASS  packages/nana-pack/tests/test-locked.test.mjs                   17 pass  4.7s
  Ubuntu   PASS  packages/nana-pack/tests/test-runner-parallel.test.mjs          8 pass  27.9s
           PASS  packages/nana-pack/tests/test-runner.test.mjs                   44 pass  17.0s
           PASS  packages/nana-pack/tests/test-locked.test.mjs                   17 pass  4.7s
  Windows  PASS  packages/nana-pack/tests/test-runner-parallel.test.mjs          8 pass  26.4s
           PASS  packages/nana-pack/tests/test-runner.test.mjs                   44 pass  18.1s
           PASS  packages/nana-pack/tests/test-locked.test.mjs                   13 pass, 1 skip  2.5s
  ```

  On Windows R-1475 passes through its IPC trigger and R-1476 passes; test-locked's one SKIP is the POSIX
  process-group wait. CI still runs the suite serially (`npm test`), so CI proves the serial path and the pool's own
  checks on all three platforms, not a parallel full suite.
- The plan's main evidence, the seat's parallel full run: on this Mac at 535bba2 (build 2 plus the pairs record), with
  other worktrees' builders and reviews running, `npm run test:locked` at its default four jobs printed
  `154 files: 152 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7500 pass, 0 fail, 14 skip · 269.3s`, exit 0. The serial
  locked suite takes about 13 to 15 minutes here (the plan's baseline: 814.5 s for 151 files); CI's serial macOS leg
  took 733.9 s on this run and up to 875 s on others today. Not met: the plan's seat evidence (1) asked for one
  `NANA_SUITE_JOBS=1` run and three parallel runs on the lane tip, with per-file labels and counts compared; the seat
  recorded one parallel run, on 535bba2. The plan's most-likely-wrong claim (only the four seeded files need to run
  alone) rests on that one green run.
- The seat's wrong-code pairs (`seat-mutate.mjs`, 27 pairs, one unsplit run each, macOS):
  - Build 1, d50de2f: 24 of 27 red (22 exactly their named titles, 2 with an unnamed red); M15, M16 and M17 survived,
    as declaration (e) and (f) allowed (`seat-mutate-output-d50de2f.txt`).
  - Build 2, 5782c50: 26 of 27 red (`seat-mutate-output-5782c50.txt`). M15 now turns R-1471 red. M17 turns R-1471's
    new temp-root check red rather than its named R-1475, which covers only the signal path. M16, main's pipe-holder
    reap after any fixture, survives as declared limit (f): the plan's probe saw that form lose the hang line's note in
    5 of 6 runs at `--jobs=3`, so a green M16 is the sixth run.
  - Declared gaps: no pair runs on Windows (the win32 half of R-1475 runs only on CI's Windows leg, which passes it);
    no pair for which files belong on the run-alone list, SUITE_JOBS, JOBS_FLAG, the coverage position or the machine
    lock.
- Independent check (`independent-check-1932efe.md`, run on d50de2f): HOLDS, no MUST. Its 13 probes include main
  against the lane's serial path (byte-identical, P3), Ctrl-C and SIGTERM through the real npm chain (0 sleepers, 0 temp
  roots, lock released, P5), forced win32 (P6), coverage records (P7) and a bad `NANA_SUITE_JOBS` failing closed (P4).
  Findings and how each was settled:
  1. Known bug: with `--jobs` above 1, a last file block over 64 KB lost the totals line, WARN lines, `failed:` list and
     self-test verdict through a pipe; the exit code stayed right. Fixed in build 2 (5782c50): the runner sets
     `process.exitCode` instead of calling `process.exit`, and a new R-1471 check reads an over-64 KB last block through
     a real pipe. The builder showed it red on d50de2f; it passes on all three CI legs.
  2. Known bug, an existing pattern with a new way in: any argument after `npm run test:locked --` counts as a filter,
     so `-- --jobs=6` runs the whole suite in parallel without the machine-wide lock (main does the same for
     `-- --verbose`). Recorded as a HANDOFF carried residual.
- Seat probe at 1932efe, macOS: the `process.exitCode` change reaches the serial path too. Started from a parent that
  holds an IPC channel, the lane's runner printed a one-file summary at 2.4 s and stayed alive until the parent
  disconnected at 10 s; main's runner exited at 2.3 s. The runner's `process.on("message")` listener keeps the channel
  open. Only R-1475's and test-runner's termination tests start the runner with IPC, and both end it through that
  handler; npm, test-locked and nana-land start it without one. Recorded as a HANDOFF residual and named in both
  briefs.
- Rows R-1470 to R-1477 all read `implemented`. At 1932efe: `node scripts/requirements-trace.mjs` 1,281 rows, 0 off
  form, exit 0; `npm run map:check` 0 problems, exit 0; `npm run readme:check` 701 claims, 0 problems, exit 0.
  `requirements-moved.mjs --base main`: 8 rows in FEAT-031, R-1470 to R-1477 new (implemented).
- No nana-setup file or hook changed, so no local install check is owed.
- Still owed before nana-land: main is 6b3e432 (study-stop and gate-rm-workdir landed) and the lane's merge-base is
  b8616fb, so the lane needs main merged again (REQUIREMENTS.md and the R-291 leaf total both move) and a review
  covering that tip; then the locked full suite on the final tip.

## Seat evidence on the merged tip 23c95f2 (added after the main merge)

- Plan item (1), three parallel runs against a serial run. The seat ran `npm run test:locked` (four jobs) on
  1932efe once and on 23c95f2 twice; all three exit 0. On 23c95f2: 158 files, 156 PASS, 2 SKIP, 7,562 checks
  passing, suite time 276.1 s and 403.7 s (wall 506 s and 1,274 s, with up to eight builders and reviewers running).
- The serial run is CI's macOS leg on 23c95f2 (run 39293046161, one file at a time, all jobs green). Each file's
  status, path and check counts, sorted and with times dropped, match that serial run exactly for both parallel runs
  on 23c95f2: 158 lines, 0 differences. The 1932efe run predates the main merge; its 22 differing lines are the
  merged lanes' new files and checks.
- No file was red only in parallel, so the run-alone list did not change.
