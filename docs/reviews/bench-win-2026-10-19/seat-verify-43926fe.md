# Seat checks — bench-win build 1, tip 43926fe (2026-10-19)

- CI run 39267951680 on draft pull request #40 (43926fe merged by GitHub onto `4be0b79`, the lane's base):
  Windows `153 files: 136 PASS, 0 FAIL, 17 SKIP` (`ci-windows-run-1.log`). The four bench files run and pass there:
  agentdir 25 pass, 1 skip (`SKIP the dir is 0700 — Windows has no POSIX mode bits to hold`), argv 32 pass, 1 skip,
  catch-ledger 76 pass (R-1520 included), usage 90 pass; test-runner 44 pass (R-1521 included). The 17 SKIPs are the
  16 declared desk files and study-tasks (its optional extension is missing, as on every leg).
- Against another lane's CI run merged onto the same base `4be0b79`: Windows moves from 132 PASS, 0 FAIL, 21 SKIP
  (6,205 checks pass) to 136 PASS, 0 FAIL, 17 SKIP (6,428 pass), so the four files add 223 passing checks. macOS
  per-file counts match that run except catch-ledger 75 → 76 and test-runner 43 → 44 (the plan's seat evidence 2).
- macOS `153 files: 151 PASS, 0 FAIL, 2 SKIP`. Ubuntu `150 PASS, 1 FAIL, 2 SKIP`: path-spelling GP1/GP2, main's Linux
  regression that the linux-path-spelling lane fixes, not this lane's. install-check succeeds on macOS and Windows.
- Red first (builder's report and commit messages): at 443e705, rows and checks with the product and skip list
  untouched, catch-ledger read 70 pass, 6 fail (R-1520, the four R-537 stub checks, "judge well-formed") and
  test-runner 43 pass, 1 fail on R-1521, naming the four bench entries. 43926fe is green.
- The builder's wrong-code tries W1–W7 each turned their named check red (its report): W1 callJudge ignores `spawn`;
  W2 `cwd: "/tmp"` kept; W3 `cwd` omitted; W4 one bench entry left on the skip list; W5 extension paths resolved
  against `process.cwd()`; W6 pi-exports drops the Tried list; W7 no `0o700` on the agent folder.
- Rows R-1520 and R-1521 read `implemented`. On the tip (seat helper, macOS) `node scripts/requirements-trace.mjs`
  and `npm run map:check` are clean. The seat did not run the locked full suite on the tip; CI's macOS leg is the
  full-suite evidence here.
- The plan's seat evidence 4: this commit removes HANDOFF's "Bench tests on Windows (win-leg-blocking)" residual and
  cuts the skip-list residual's hidden-check count from about 285 to about 75 (desk files only).
- No wrong-code pairs and no independent check: an ordinary lane. No findings to settle.
- Left open, recorded in HANDOFF's residuals: the real judge on Windows is untested (an npm-installed Claude Code is
  a `.cmd` shim `spawnSync` cannot start, inferred); nothing checks the agent folder's Windows access rights, and the
  linked-credentials check fails on a Windows machine without symlink rights; recorded study labels were not re-run
  after the judge's macOS and Linux working folder moved from `/tmp` to `$TMPDIR`.
