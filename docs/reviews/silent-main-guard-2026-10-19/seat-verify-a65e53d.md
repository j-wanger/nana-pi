# Seat checks — silent-main-guard build 1 and a merge of main, tip a65e53d (2026-10-19)

- CI run 39298256239 on draft pull request #53 (a65e53d, build 1 `51128a7` plus a merge of main `713d6aa`): macOS
  `158 files: 156 PASS, 0 FAIL, 2 SKIP` (7559 checks pass, 0 fail); Ubuntu `158 files: 156 PASS, 0 FAIL, 2 SKIP` (7504
  pass, 0 fail); Windows `158 files: 141 PASS, 0 FAIL, 17 SKIP` (6486 pass, 0 fail; `ci-windows-run-1.log`).
  install-check passes on macOS and Windows. linked-launch passes 5 of 5 on all three legs, so the junction checks the
  plan only inferred for Windows pass there; nana-roster passes 18 (with 2 skips on Windows), R-1636 among them.
  None of main's known failures showed (Ubuntu GP1/GP2, the PR merge-commit R-291 total).
- The builder's report (build 1): R-1630 to R-1634 red on the old guards, every linked run exit 0 with empty stdout,
  green after; R-1636 green on both, a regression pin as the plan says. Its four wrong-code tries each turned the named
  check red: W1 the resolve-form guard back in one script, W2 no existsSync in nana-roster (R-1636 throws), W3
  `if (true) main()` (R-1636 prints the roster), W4 `if (false)` as one script's guard (the printed-something
  condition). The red runs were macOS only; no Windows run showed the five checks red on the old guards.
- One named deviation: R-917's source check bans a direct `fs.mkdtempSync` outside `tests/tmp-dir.mjs`, so the builder
  added `tmpDirUnmanaged` there; it makes the link's folder without registering it for exit-time removal. The plan's
  "nothing in the suite removes it recursively" holds for the helper but not for the runner: `scripts/test.mjs`
  removes each file's TMPDIR recursively, so after a crash the runner's `rmSync` meets the link. A seat probe on macOS
  (Node 22.22.2) showed that call removes a directory symlink and keeps its target's files; a Windows junction is
  inferred, not run.
- Tree movement 713d6aa..a65e53d: 6 new rows, all implemented (R-1630, R-1631 in FEAT-028; R-1632 in FEAT-029; R-1633
  in FEAT-039; R-1634, R-1636 in FEAT-006). R-1635 is unused.
- No wrong-code pairs and no independent check: an ordinary lane. Residuals from the plan's known limits are in HANDOFF.
