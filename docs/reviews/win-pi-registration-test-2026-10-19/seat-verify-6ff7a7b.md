# Seat checks — win-pi-registration-test build 1, tip 6ff7a7b (2026-10-19)

- CI on draft pull request #61, run 39305895780, GitHub's merge of 6ff7a7b into main 27603d4 (merge commit 7d5f958):
  Windows `158 files: 140 PASS, 1 FAIL, 17 SKIP, 0 WARN · checks: 6495 pass, 1 fail, 82 skip` (`ci-windows-run-1.log`);
  macOS `158 files: 156 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7566 pass, 0 fail, 15 skip`; Ubuntu `158 files: 156
  PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7511 pass, 0 fail, 33 skip`; install-check macOS and Windows success. None of
  main's known failures showed (Ubuntu path-spelling GP1/GP2, a pull request run's R-291 leaf-total merge artifact).
- pi-registration on Windows: `PASS  packages/nana-setup/tests/pi-registration.test.mjs  67 pass, 2 skip`, up from 64
  pass, 3 skip on main's run 39293614371. The `SKIP POSIX-only fake-pi registration test` line is gone. The block's
  three checks pass there for the first time: `win32 install runs a pi.cmd through cmd.exe to add only the missing
  per-package entry, never a root entry` (R-1690), `knowledge-only registration leaves nana-pack's manifest extension
  directory uncovered` (R-392) and `doctor names nana-pack's uncovered extensions directory` (R-654). The plan's claim
  most likely wrong (64/3 to 67/2 on the first Windows run) held.
- pi-registration on macOS and Ubuntu: 64 pass, 3 skip, as on main; there the block runs R-323's title.
- The one Windows failure is `packages/nana-pack/tests/mutation-runner.test.mjs` (24 pass, 1 fail, 3 skip), a file the
  lane does not touch: `mutation runner: after a run at one shard and at three, and after one whose shard is killed
  outright, no running test file, scratch folder or git worktree entry is left …` failed with `shards=3: worktree list`
  still holding a scratch `repo` entry. The seat's saved CI logs show that check passing in 43 of 44 Windows runs (this
  run is the one failure), 43 of 43 macOS runs and 44 of 44 Ubuntu runs. The seat reads it as a flaky check and re-ran
  the failed Windows job (attempt 2); its result was still pending when these notes were written. Since win-leg-flip
  landed, a Windows failure blocks release, so HANDOFF carries the flake as a residual.
- Per the builder's report (Claude Sonnet 5, build 1 b57e7b2), each wrong-code try in `steps.mjs` turned the shared
  assertion red on macOS (the R-323 branch) and was reverted: W1 install every package root, W2 install the
  manifest root, W4 report `created` without running install, W5 skip the version probe. W3, launching the `.cmd`
  without ComSpec, is Windows-only and did not run; its expected EINVAL is inferred.
- One existing check changed: R-323's `install adds only the missing per-package entry, never a root entry`. Its title
  is unchanged byte for byte. It now runs through the shared recorder and asserts status `created` and the exact
  argument lists `[["--version"], ["install", <repo>/packages/nana-pack]]`. Before, it checked two calls, the second
  being that install, and no `install <repo>`. The builder's commit message calls the assertion unchanged; it is
  stricter. The reviewer judges the edit.
- Among other existing tests only the R-291 leaf total changed: 1,306 at 27603d4, 1,307 at the tip.
- 6ff7a7b is the seat's merge of main 27603d4 (the review-timeline land) into b57e7b2; its one conflict was the R-291
  leaf total in `requirements-tree.test.mjs`.
- The seat's re-run at 6ff7a7b: `node scripts/requirements-trace.mjs` reads `1307 total (1021 implemented · 1 planned ·
  18 retired · 262 untested · 5 violated)` and `ears: 0 rows off form`, exit 0; `npm run map:check` reads 303
  modules, 0 problems; R-1690 reads `implemented` in REQUIREMENTS.md.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`): `27603d4..6ff7a7b: 1 rows in 1 features`,
  FEAT-013 · Install and connect harness runtimes, R-1690 new (implemented).
- No wrong-code pairs and no independent check: an ordinary lane (tests and one row).
- Main moved after the CI run started: it is at f9cd9fd, four lands (win-leg-flip, readme-install, parallel-runner,
  adopt-closes-check) past the lane's merge-base 27603d4. The lane has not merged it; that merge needs its own confirmation round.
- Still owed before `nana-land`: the locked full suite on the reviewed tip, and `node
  packages/nana-setup/bin/install-check.mjs` on macOS, since the lane touches `packages/nana-setup/`.
- The known limits in `must-meet.md` stay open, except that the R-392 and R-654 checks now pass on Windows (no longer
  inferred). HANDOFF carries each open one as a residual.
