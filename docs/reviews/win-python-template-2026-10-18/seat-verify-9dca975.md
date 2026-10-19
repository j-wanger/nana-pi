# Seat checks — win-python-template build 1, tip 9dca975 (2026-10-18)

- Full suite on the Mac on 9dca975 (base main 4df86da): `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7459 pass,
  0 fail, 14 skip · 797.3s`, exit 0. Template acceptance passes in it.
- CI on draft pull request #25, run 1 (`ci-windows-run-1.log`, 9dca975): templates-update 34 pass, no fail; both PT1
  checks pass, not skipped ("python scaffold" and "python adopt"); templates-render 163 pass, 2 skip; template-acceptance
  12 pass. Windows failing 24 of 150 files (25 on main 4df86da).
- The same run's Ubuntu leg fails one check, lane-write-guard's symlink escape; it fails on every main run since at least
  e9d7d3d and HANDOFF carries it ("one Linux CI symlink check fails"). Not this lane.
- The seat's notes commit narrows R-1360 to what PT1 pins (amendment in `must-meet.md`); requirement-rows, trace and tree
  tests pass on it, and the map and README checks show 0 problems.
- No wrong-code pairs and no independent check: an ordinary lane (template tests, one check, one row).
