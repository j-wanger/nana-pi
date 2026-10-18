# Seat checks — win-review-tests builds 1 and 2, tip 52e6749 (2026-10-18)

- Full suite on the Mac on 52e6749: `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7457 pass, 0 fail, 14 skip · 783.9s`, exit 0.
- CI on draft pull request #23. Run 1 (`ci-windows-run-1.log`, 153e3d4): worker-lane 51 + 1 skip; immutable-review 5 pass,
  10 fail, 2 skip; review-ledger 130 pass, 22 fail, 3 skip; no "No API key found" line anywhere in the log. Run 2
  (`ci-windows-run-2.log`, 52e6749): worker-lane 51 + 1 skip; immutable-review 9 pass, 6 fail (checks 1, 2, 3, 4, 6 and 11,
  the short-path list), 2 skips; review-ledger 130 pass, 22 fail (the short-path list), 3 skips. The seat checked each of
  the 22 review-ledger failures' detail blocks: every one prints `short=` and `long=`. No "No API key found" line. macOS
  and both install checks green; Windows failing 28 of 150 files (29 on main 2eb0cb8).
- The seat's audit of build 1 (`seat-audit-1.md`: three file checkers and a critic) found three MUSTs; build 2 fixed them,
  and a read-only re-check closed all five items (three MUSTs, two SHOULDs) by running every Windows stub body under node.
- No wrong-code pairs and no independent check: an ordinary lane (tests and one test helper only; no tool code changed).
- Final round 1 (`sol-r1.md`) sent the lane back: the seat had cut the worktree from 12fe4c1, before the setup-tools lane
  landed, and its review brief named 2eb0cb8 as main. The seat merged main 2eb0cb8 (dcd03ff), keeping both lanes'
  HANDOFF and session entries. On dcd03ff: full suite on the Mac `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks:
  7457 pass, 0 fail, 14 skip · 790.4s`, exit 0. Windows run 3 (`ci-windows-run-3.log`, the exact tip dcd03ff): the
  same as run 2 — worker-lane 51 + 1 skip, immutable-review 9 pass, 6 fail, 2 skips, review-ledger 130 pass, 22 fail,
  3 skips, no "No API key found" line — and the setup-tools lane's four files still pass (doctor-detail 62 + 1 skip,
  install-check 105, restore 14, trust 11). Windows failing 28 of 150 files.
