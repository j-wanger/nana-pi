# Seat checks — win-session-start builds 1 to 3, tip 0b8a045 (2026-10-17)

- Title check: `seat-titles 1: 0 missing`.
- Full suite on the Mac on 0b8a045: `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7457 pass, 0 fail, 14 skip · 770.3s`, exit 0.
  Install check (the lane touches a nana-setup test): exit 0.
- CI on draft pull request #18. Run 1 (39082975152): SS1 passes on Windows (hooks-win32-exec 29 → 30); adoption-producer 60,
  adoption-reader 41 (+1), config-display-text 36 (+2) pass; objective-golden 983 pass, 10 fail. Run 2: objective-golden 978 pass, 4 fail
  (path display). Run 3 (after merging main for the verbose leg; `ci-windows-run-3.log`): every target file passes on Windows —
  objective-golden 982 (+6 SKIP lines), adoption-producer 60, adoption-reader 41 (+1), config-display-text 36 (+2), hooks-win32-exec 30;
  macOS and both install checks green; Windows failing 50 of 150 files.
- Counts: objective-golden runs 1,236 checks on Linux and macOS and 982 on Windows; its six win32 SKIP lines each stand for a whole group of
  POSIX-only cases (mode 000, named pipes, owner, directory modes, chmod listing), which is where the difference lies.
- No wrong-code pairs and no independent check: an ordinary lane (tests only).
