VERDICT: DONE
- Commit `46f3abb` pushed to draft PR #2; worktree clean.
- Files: `REQUIREMENTS.md`, `packages/nana-pack/lib/win-command.mjs`, its test, setup README, and both setup tests.
- Rows: R-1035, R-1036, R-1038, R-1039.
- Mutation pairs: B argument refusals, D direct `PI.EXE` doctor launch, F unsuffixed PATH lookup each went red when broken; **18/18 mutations red**, no `ANCHOR`.
- Commands (exit codes): `npm run test:locked` 0; both seat scripts 0; mutation script 0; map check 0; README check 0.
- Suite summary: **134 files: 133 PASS, 0 FAIL, 1 SKIP; 6,781 pass, 0 fail, 8 skip.**
- Draft PR Windows lines:
  `PASS  packages/nana-pack/tests/win-command.test.mjs                   93 pass  3.2s`
  `PASS  packages/nana-setup/tests/pi-registration.test.mjs              64 pass, 3 skip  11.2s`
  `PASS  packages/nana-setup/tests/doctor-runtime.test.mjs               9 pass, 2 skip  0.5s`
  `PASS  packages/nana-pack/tests/post-edit-status.test.mjs              31 pass, 1 skip  2.6s`
- The broader hosted Windows test run still reports 66 failing files and 212 failing checks; the requested files pass. A native machine rehearsal was not done.
