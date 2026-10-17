# Seat checks — win-project-files builds 1 to 5, tip 72757e3 (2026-10-17)

- Title check: `seat-titles 1: 0 missing`.
- Full suite on the Mac on the final code (`npm run test:locked`): `150 files: 148 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7456 pass, 0 fail, 14 skip · 764.6s`, exit 0.
  Install check (the lane touches `packages/nana-setup/`): exit 0.
- Windows CI on draft pull request #15, one run per build (logs `ci-windows-run-1.log` to `-5.log` here, carriage returns stripped):
  run 1: the refresh passes; project.test crashes on a bare `npm` spawn. Run 2: a raw-path `import()`; the owner-swap check fails.
  Run 3: project.test 112/121 (eight line-ending failures, one slash literal). Run 4 (after merging the line-endings lane): project.test
  121/121; the owner-swap check shows the refresh overwriting a replaced file. Run 5 (64-bit identity): project-working-region 27/27,
  project 121/121, ci-workflow 12/12; the Windows job rerun on the same commit: project-working-region 27/27 again
  (`ci-windows-run-5-rerun.log`). The Windows leg's failing count is 60 of 150 files (main 9fcd4f2: 62).
- macOS and both install checks green on CI; the Linux leg fails only `lane-write-guard.test.mjs`, as main does.
- No wrong-code pairs and no independent check: an ordinary lane.
