# Seat checks — readme-install build 1, tip 4725781 (2026-10-19)

- CI on draft pull request #46, run 39289451877 at 4725781 (build 1 893330d merged with main f29827a; GitHub's merge
  2cf32e2 onto `b8616fb`, an ancestor of 4725781, so the run tested 4725781's tree): macOS `157 files: 155 PASS, 0 FAIL,
  2 SKIP` (7,544 checks pass, 0 fail); Ubuntu `157 files: 155 PASS, 0 FAIL, 2 SKIP` (7,491 checks pass, 0 fail); Windows
  `157 files: 140 PASS, 0 FAIL, 17 SKIP` (6,470 checks pass, 0 fail; `ci-windows-run-2.log`). The lane's files pass on
  all three legs: install-check 106, readme-rehearsal 6 (new), fresh-machine 5, requirements-tree 89.
- install-check (macos-latest, image macos-26-arm64): 14 PASS lines, the last two `PASS doctor` and
  `PASS readme checklist` (`ci-install-check-macos-run-2.log`). The rehearsal took about 23 s on the runner (17:02:08 to
  17:02:31). A fresh hosted Mac ran the README's checklist with the home npm prefix and doctor printed `all good`. That
  closes the adversary's most-likely-wrong claim (Homebrew's npm ahead of setup-node's in a login zsh) and is the plan's
  required seat check.
- install-check (windows-latest): 14 PASS lines ending `PASS doctor`, and no `readme checklist` line, by design (the
  rehearsal is macOS only).
- Builder (Claude Sonnet 5) report, build 1 893330d: R-1540 to R-1546 implemented; install-check 106, readme-rehearsal 6,
  fresh-machine 5. It edited one existing fixture: `recordingRun` answers `/bin/zsh` with `all good`, so the darwin checks
  stay green. Its 12 wrong-code pairs each turned their row red and were restored: every backtick a command (R-1541),
  `~/.local/bin` on PATH, ZDOTDIR kept, npm prefix outside the home (R-1542), the global npm install dropped (R-1543),
  `--yes` on every command (R-1542/1543/1545), the adapter ignoring `maxOutput` (R-1544), no expectation still passing
  and steps running on after a failure (R-1545), the gate as `!== "win32"` and the install home reused (R-1540), README
  step 8 without the `cd` (R-1546). Its local install-check ended `PASS doctor` / `PASS readme checklist`.
- Seat on 4725781 (its merge of main f29827a; git recorded one conflict, the tree test's leaf total, set to 1,285):
  install-check, readme-rehearsal, fresh-machine and requirements-tree pass alone; README check clean; requirements trace
  and map check clean. All seven rows read `implemented`.
- No seat wrong-code pairs and no independent check: an ordinary lane.
- Owed before the land: install-check run locally on macOS (the lane touches nana-setup), after the last merge of main.
