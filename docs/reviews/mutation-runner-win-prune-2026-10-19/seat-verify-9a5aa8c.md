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

## Round 1 and build 3 (the seat, after the final reviewer's SEND-BACK on f864d4d0)

- Opus round 1 sent the lane back with two MUSTs, both from the reviewer's own probes. M1: with neither call site taking
  the lock, the file still passed 34/34, because R-1775's check drove the lock helper with a fake operation. M2: the
  lock was not mutually exclusive: `writeFileSync(…, { flag: "wx" })` creates an empty file before writing the pid, so a
  waiter could read the gap, treat the lock as stale and take it (8 processes x 300 acquisitions: 63 of 2,400 overlapped).
  SHOULDs: R-1775's "one lane repository" was wider than the lock; T1's three-shard case read the retry count; a lock
  failure at a shard's end was swallowed silently.
- Build 3 (`build-brief-3.md`, commit 79f6b0b9, a pi gpt-5.6-sol builder): the lock is published atomically by a hard
  link of a complete temp file; a stale or released lock is removed only while it still holds the exact content read;
  an unreadable lock counts as held for up to 30,000 ms (sealed, R-1777); cleanup failures are recorded. R-1775 now
  drives a real shard's add and removal (skipping either lock call fails it), and is narrowed to one runner run; new
  R-1776 runs 8 children for 2,400 acquisitions with an exclusive marker and asserts no overlap; T1's three-shard case
  has its own value. Builder's wrong-code tries: the old lock, a non-atomic publication and an unconditional removal
  each fail. `mutation-runner.test.mjs` 36/36 three runs in a row.
- The HANDOFF line no longer says "and so does a bypassed lock" (the reviewer's S4).

## Round 2 and build 4 (the seat, after the final reviewer's SEND-BACK on d9955553)

- Opus round 2 sent the lane back with one MUST from CI. M3: CI run 39342973804 on `d9955553` was green on macOS
  and Ubuntu and red on Windows: R-1776's contention check saw 7 of 8 workers exit 1 with `EPERM` from the lock read
  (a file being deleted on Windows can be visible and refuse to open); 674 of 2,400 acquisitions completed. A throw in
  the release would have left the lock naming a live pid, so every shard would wait forever. SHOULD S5: a lock naming
  a pid that never dies was held forever. NOTEs: N1 the stale-side content compare is not pinned by a check; N2 a
  hand-run shard with no lock variable threw `path.dirname(undefined)`; N3 the record cited only local runs.
- Build 4 (`build-brief-4.md`, commit c8db77a4, a pi gpt-5.6-sol builder): EPERM, EACCES and EBUSY from the lock's
  read, stat, link, unlink and release count as held and retry on every platform; a release that keeps failing records
  one line naming the lock (R-1778). Any lock naming a live holder makes a waiter stop after
  `WORKTREE_LOCK_WAIT_LIMIT_MS` (30,000 ms, chosen, sealed), record the lock and holder pid once, and leave the lock
  in place (R-1779). A missing lock variable now fails with one line naming it (N2). The builder's checks inject the
  errors on macOS, so both new checks were red before the change; its wrong-code tries (no transient handling, no
  limit, non-atomic publication, unconditional removal) each failed their named check. `mutation-runner.test.mjs`
  38 PASS on four runs in a row.
- N1 stays a known limit (the reviewer's own probe: 40 runs x 16 workers with the compare removed gave 0 overlaps).
- CI run 39347932197 on draft pull request #75 at `f5851dc1` (build 4 with main f0d6da24 merged): macOS 165 PASS,
  0 FAIL, 2 SKIP of 167 files (7,677 checks pass); Ubuntu the same file counts (7,622); Windows 150 PASS, 0 FAIL,
  17 SKIP (6,617), its skips main's declared ones; install-check passes on macOS and Windows. On Windows the test file
  passes 36 with 3 skips, and R-1775 (a shard's add and removal wait for the lock), R-1776 (contention, no overlap),
  R-1778 (transient errors retry) and R-1779 (a never-releasing holder) pass by title. The Windows log is
  `ci-windows-run-3.log`.
- The seat then merged main 4656f646 (`76f75878`; pwsh-lexer-oracle and the lanes before it) and dropped two HANDOFF
  lines the merge helper had kept: a doubled win-pi-registration-test line and a knowledge-refresh-pin line main had
  already removed.
