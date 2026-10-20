# Seat checks — mutation-runner-lock-overlap build 1, tip 8138f592 (2026-10-20)

- CI run 39399273061 on draft pull request #117 at 8138f592 (GitHub's merge commit 7482a204 merges 8138f592 into its own
  ancestor 15703d8d, so the tree tested is 8138f592's): macOS `178 files: 176 PASS, 0 FAIL, 2 SKIP` (7,864 checks pass);
  Ubuntu 175 PASS, 0 FAIL, 3 SKIP (7,803 pass); Windows 161 PASS, 0 FAIL, 17 SKIP (6,799 pass, 106 skip), its skips
  main's declared ones. install-check passes on macOS and Windows. None of main's known failures showed.
- mutation-runner.test.mjs passes on every leg: macOS `39 pass 37.8s`, Ubuntu `39 pass 19.8s`, Windows
  `PASS  packages/nana-pack/tests/mutation-runner.test.mjs  37 pass, 3 skip  116.7s` (`ci-windows-8138f592.log`
  line 2586); its three Windows skips each print a reason (two POSIX-only checks and the fake npm check), as on main.
  The contention check (R-1776, R-1777)
  prints PASS on Windows at line 2550.
- No wrong-code pairs by the seat and no independent check: an ordinary lane (one test file). The builder's wrong code
  in `lib/mutation-runner.mjs`: W2 (a fresh unreadable lock not treated as held) turns the contention check red with
  enteredFreshUnreadable true; W3 (1 in 100 contended publications steal the lock) turns it red with overlap text naming
  what each worker found (`1:1 found 2:0 …`). So the check still catches a real overlap, and now names it.
- The plan's load evidence (temp clones, 8 copies beside 12 busy loops on a 10-core Mac): the planner saw overlaps in
  9 of 200 runs with the old order, every line a first turn that found the gate marker; the adversary saw 2 of 40
  (`5:0 found gate`, the CI signature) and 0 of 200 with no gate marker. The CI attribution stays inferred: the failing
  record held no marker content.
- Rows: none added or changed; R-1776 and R-1777 read implemented. `requirements-moved --base main`: tree movement none.
  Trace: 1,563 rows, 0 off form. map:check: 340 modules, 0 problems.
- Base: the lane began on 1b54211c and merged main 15703d8d (the pi-probe-timeout land tip) at 8138f592, so its own
  diff is `git diff 15703d8d..HEAD`: the plan files and one test file (3 lines in, 3 out).
