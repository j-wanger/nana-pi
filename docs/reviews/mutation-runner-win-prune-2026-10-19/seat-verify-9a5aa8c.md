# Seat checks — mutation-runner-win-prune build 2, tip 9a5aa8c (2026-10-19)

- CI run 39336290907 on draft pull request #75 (9a5aa8c5, build 2 with main cb1a5b57 merged in): macOS `166 files: 164
  PASS, 0 FAIL, 2 SKIP` (7,662 checks pass); Ubuntu 164 PASS, 0 FAIL, 2 SKIP (7,607 pass); Windows 149 PASS, 0 FAIL, 17
  SKIP (6,603 pass; `ci-windows-run-2.log`), its skips main's declared ones. mutation-runner.test.mjs passes 34 checks with
  none failing on macOS and Ubuntu, and 32 with 3 skips on Windows; the 3 are the file's existing skips (two POSIX-only, one fake npm).
  On Windows all six new checks and R-1231's cleanup check pass by title. install-check passes on macOS and Windows. The
  seat read each leg's summary line from the job logs.
- CI run 39330086149 on build 1's tip 4aaafdc1: macOS 164 PASS, 0 FAIL, 2 SKIP (7,656 pass); Ubuntu the same file counts
  (7,601); Windows 148 PASS, 1 FAIL, 17 SKIP (6,594 pass, 1 fail; `ci-windows-run-1.log`). The failure was
  mutation-runner.test.mjs, 30 pass, 1 fail, 3 skip: R-1230's existing scratch-worktree check, two pairs in two shards.
  Shard 2's `git worktree add` failed with `fatal: failed to read .git/worktrees/wt/commondir: No error`, its shard exited
  2 with no tally and its pair read MISSING. Inferred cause: shard 1's slower, retried removal overlapped shard 2's add.
  The five build-1 checks and the pin passed on that run. The seat sent build brief 2.
- Build 1 (4aaafdc1, a pi gpt-5.6-sol builder through pi-worker), per its report: T1 to T5 and the seal pin PASS on macOS;
  the wrong-code tries each turned red: W1 (no retry) T1, T2, T4 and T5; W2 (every retry runs) T4; W3 (`prune --expire
  now`) T3; W4 (one retry or no wait) T4; W5 (dead-shard line to the console only) T5; W6 (helper under KEEP) R-1231's
  cleanup check; W7 (raw full-path list compare) T1.
- Build 2 (bd3df051, the same builder), per its report: one cross-shard operation lock covers each worktree add and the
  whole removal with its retries; new row R-1775 with one check, red before the change and with the lock bypassed, green
  after; the check pins the 25 ms lock wait. mutation-runner.test.mjs passed 34 checks on three runs in a row.
- One green Windows run does not prove the race closed: before this lane R-1231's cleanup check passed in 43 of 44 saved
  Windows runs. The R-1775 check drives the lock helper in two child processes; it does not run the runner's own add and
  removal.
- No wrong-code pairs and no independent check: an ordinary lane (the runner is a seat tool). No findings to settle.
- Seat helper, on the worktree at 9a5aa8c plus these notes: the requirements trace exits 0 (`1409 total`, `ears: 0 rows
  off form`); `map:check` reports 0 problems; R-1770 to R-1775 read implemented. Tree movement against main: FEAT-031
  gains R-1770 to R-1775, all new and implemented.
