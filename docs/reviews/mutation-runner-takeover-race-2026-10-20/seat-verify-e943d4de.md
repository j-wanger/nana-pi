# Seat checks — mutation-runner-takeover-race build 1, tip e943d4de (2026-10-20)

- CI run 39406441608 on draft pull request #122 at e943d4de (GitHub's merge commit 6a6d6cdc merges e943d4de into its own
  ancestor aa5f25cd, so the tree tested is e943d4de's): macOS `180 files: 178 PASS, 0 FAIL, 2 SKIP` (7,911 checks pass);
  Ubuntu 177 PASS, 0 FAIL, 3 SKIP (7,850 pass); Windows 163 PASS, 0 FAIL, 17 SKIP (6,847 pass, 107 skip), its skips
  main's declared ones (16 desk files and the bench study-tasks file). install-check passes on macOS and Windows. None of
  main's known failures showed.
- The new mutation-runner-takeover.test.mjs passes on every leg: macOS `3 pass 1.4s`, Ubuntu `3 pass 0.5s`, Windows
  `PASS  packages/nana-pack/tests/mutation-runner-takeover.test.mjs  3 pass  1.3s` (`ci-windows-e943d4de.log` line 2549).
  On Windows R-2170, R-2171 and R-2172 each print PASS by title, at lines 2546, 2547 and 2548. So the plan's known limit
  "Windows behaviour is inferred until the seat reads the Windows leg" is now read: two live child waiters took over one
  dead lock there with no overlap, which no Windows run had done before.
- mutation-runner.test.mjs passes on every leg: macOS `39 pass 57.1s`, Ubuntu `39 pass 20.9s`, Windows
  `PASS  packages/nana-pack/tests/mutation-runner.test.mjs  37 pass, 3 skip  86.3s` (line 2590); its three Windows skips
  each print a reason (two POSIX-only checks and the fake npm check), as on main. On Windows the contention check
  (R-1776, R-1777) prints PASS at line 2554, the transient lock error check at 2555 and R-1960 at 2556.
- No wrong-code pairs by the seat and no independent check: an ordinary lane. The builder's wrong code in
  `lib/mutation-runner.mjs`, per its report: W1 (today's code), W2 (removal under the breaker with no re-check) and W3
  (the breaker written by plain overwrite) each turn R-2170 red; W4 (a dead breaker never removed) turns R-2171 red; W5
  (the breaker kept when the lock removal hits a transient error), W6 (a transient breaker release given up), W7 (the
  breaker never released) and W8 (the breaker kept when the re-read under it hits a transient error) each turn R-2172
  red. Red before the change: R-2170 printed FAIL with `B found A` for both before-removal dead-lock kinds. The builder
  ran the new file three times on macOS (0.99 s, 0.98 s, 0.95 s) and the existing file once (39 PASS, 0 FAIL). The seat
  re-ran none.
- The plan's probes (a temp copy of main 773de493): the before-removal schedule gave `B found A` for a dead pid and for
  an old unreadable lock, 3 runs of 3; the after-read schedule was green. A breaker prototype passed R-2170 in 5 runs of
  5 and the sweep (63 cases in 0.4 s); today's code passed R-2171 and the sweep's 45 cases.
- Rows: R-2170, R-2171 and R-2172 added to FEAT-031 after R-1960, each implemented. `requirements-moved --base main`:
  `tree movement aa5f25c..e943d4d: 3 rows in 1 features`, FEAT-031, each `new (implemented)`. Trace: 1,577 rows, 0 off
  form. map:check: 343 modules, 0 problems.
- The plan's known limits, each a HANDOFF residual: a dead breaker is still removed by compare-then-remove (reasoned, not
  probed, no check); the wait-limit line may name the dead lock's pid rather than the breaker holder's; breaker release
  reuses the 300000 ms release limit, so on a Windows path that stays delete-pending a waiter can outlast the 30000 ms
  acquisition limit.
- The builder reported the rulings unavailable on this machine, the known seat-machine state until the owner's install
  run; no action.
- Base: the lane began on 54433844 and merged main aa5f25cd (the mutation-runner-lock-overlap land tip) at e943d4de, so
  its own diff is `git diff aa5f25cd..HEAD`. Main has since moved to c7f582ad (the post-edit-timeout-name and
  pi-launch-followups lands); the lane has not merged it.
