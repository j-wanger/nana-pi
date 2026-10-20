# Seat checks — review-test-waits build 1, tip f53cf02e (2026-10-19)

- CI run 39369629052 on draft pull request #101 (f53cf02e; main and the merge-base are both 6bc2f727): macOS `174 files:
  172 PASS, 0 FAIL, 2 SKIP` (7,781 checks pass); Ubuntu `172 PASS, 0 FAIL, 2 SKIP` (7,726); Windows `156 PASS, 1 FAIL,
  17 SKIP` (6,716 pass, 1 fail; `ci-windows-f53cf02e.log`). The one FAIL is main's mutation-runner lock check (35 pass,
  1 fail), which mutation-runner-win-lock fixes; this lane touches no mutation runner file. install-check passes on
  macOS and Windows.
- The lane's files per leg: immutable-review 18 pass on macOS (14.1 s) and Ubuntu (4.3 s), 16 pass 2 skip on Windows
  (25.5 s); review-ledger 165 pass on macOS and Ubuntu, 163 pass 2 skip on Windows; review-test-waits 5 pass on all
  three (45.2 s macOS, 37.7 s Ubuntu, 50.4 s Windows, against the plan's Windows estimate of up to 200 s), and the
  Windows log prints `PASS R-1920` to `PASS R-1924` by title.
- Wrong-code pairs: none run by the seat (an ordinary lane). The builder showed each new check red on wrong code: a
  fixed five-second wait (R-1920), a split fake write (R-1921), an uncaught cleanup (R-1922), returning on existence
  (R-1923), ignoring closure and the limit (R-1924).
- No independent check: an ordinary lane gets none, so there are no findings to settle.
- From the worktree: the trace reads 1,511 rows, 0 off form; map:check reads 333 modules, 0 problems; the tree
  movement report lists R-1920 to R-1924 new under FEAT-031, each implemented.
