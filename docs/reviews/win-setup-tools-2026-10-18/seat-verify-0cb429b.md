# Seat checks — win-setup-tools builds 1 and 2, tip 0cb429b (2026-10-18)

- Full suite on the Mac on 0cb429b: `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7457 pass, 0 fail, 14 skip · 787.7s`, exit 0.
  (The seat's uncommitted audit notes sat in the lane folder during the run; no test reads them.)
- Install check on the Mac on 0cb429b: exit 0, 13 PASS lines and no FAIL.
- CI on draft pull request #22. Run 1 (f2f90cc): doctor-detail, install-check and trust pass; restore fails its extraction.
  Run 2 (`ci-windows-run-2.log`, 0cb429b): every target file passes on Windows — doctor-detail 62 + 1 skip (the launchd
  desk block, 4 checks), install-check 105, restore 14, trust 11. macOS and both install checks green; Windows failing
  34 of 150 files (38 on main ddc45b4's base).
- Restore's root cause, confirmed: GNU tar turns on `--unquote` by default and, in extract mode, unquotes the `-C` operand,
  so `\n` in the runner's `...\Temp\nana-test-...` became a line break. Create mode does not unquote `-C`. Build 2 passes
  `-C` as a bare relative name.
- The seat's checks of builds 1 and 2 (`seat-skip-audit.md`) found no MUST; build 2 took the one SHOULD (the trust check's
  working folder now sits in temp).
- No wrong-code pairs and no independent check: an ordinary lane (tests only; no doctor, install or restore code changed).
- After merging main 12fe4c1 (the install-shape lane) and adding HANDOFF and the session entry, on tip 372b3f3: full suite
  on the Mac `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7457 pass, 0 fail, 14 skip · 783.1s`, exit 0; install
  check exit 0, 13 PASS lines. Windows run 3 (`ci-windows-run-3.log`, 372b3f3): the four target files pass as in run 2,
  every nana-setup test file passes on Windows, and Windows failing is 29 of 150 files (33 on main 12fe4c1).
