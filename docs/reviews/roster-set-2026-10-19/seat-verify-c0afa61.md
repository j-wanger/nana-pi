# Seat checks — roster-set build 1, tip c0afa61 (2026-10-19)

- CI on draft pull request #34, run 39248951318 (the pull request's merge of c0afa61 into main's 1e3bf1f): macOS
  `151 files: 149 PASS, 0 FAIL, 2 SKIP` with 7,468 checks passing (`ci-macos-run-1.log`); nana-roster-set 8 pass.
  Ubuntu 148 PASS, 1 FAIL, 2 SKIP: lane-write-guard only, main's (fixed by linux-lane-guard, not yet on main);
  nana-roster-set 8 pass. Windows 127 PASS, 23 FAIL, 1 SKIP: immutable-review, land and review-ledger (main's
  short-path set, fixed by win-review-paths, now on main), 16 desk and 4 bench files; nana-roster-set 8 pass and 1
  skip (R-1403's dangling-symlink case, POSIX-only as planned), and R-1406's symlink check ran and passed there.
  install-check passes on macOS and Windows.
- The roster's other test files pass on all three legs: nana-roster 17, roster-notice 16, worker-lane 52 (51 and 1
  skip on Windows), requirements-tree 89.
- Locally on the exact tip c0afa61 (macOS), the eight must-meet checks pass. `node scripts/requirements-trace.mjs`
  and `npm run map:check` are clean, and R-1400 to R-1407 all read `implemented`.
- Red today: the plan's probes ran R-1400, R-1401, R-1402, R-1404, R-1406 and R-1407 red on b3f6ec2; R-1403 is red
  only on the `set refused:` prefix and R-1405 only on the missing lib (`must-meet.md`, `plan-attack.md`).
- Wrong code: build brief 1 names thirteen tries, each with the check it must turn red. The lane's commits record no
  result for them; the builder's report is not in the lane.
- No wrong-code pairs and no independent check: an ordinary lane (the nana-roster command). No findings to settle.
