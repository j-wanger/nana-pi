# Seat checks — knowledge-refresh-pin build 1 and a merge of main, tip 4219497 (2026-10-19)

- CI run 39309685406 on draft pull request #62 (4219497, build 1 `ba0af6a` plus a merge of main `8482c2e`): macOS
  `158 files: 156 PASS, 0 FAIL, 2 SKIP` (7,570 checks pass, 0 fail, 15 skip); Ubuntu `158 files: 156 PASS, 0 FAIL, 2
  SKIP` (7,515 pass, 0 fail, 33 skip); Windows `158 files: 141 PASS, 0 FAIL, 17 SKIP` (6,498 pass, 0 fail, 83 skip;
  `ci-windows-run-1.log`). The skips are main's declared ones: hooks-win32-exec and study-tasks off Windows, the 16
  desk files and study-tasks on it. install-check passes on macOS and Windows. None of main's known failures showed
  (Ubuntu GP1/GP2, the PR merge-commit R-291 total).
- The lane's files on every leg: hook.test passes 96 (94 on earlier lanes' Windows runs today), extension.test 36
  (35 before), requirements-tree 89. On Windows hooks-win32-exec passes 31 with no skip (30 before).
- The Windows leg prints each new check. R-1710 PASS. R-1711 PASS, `NOTE stale pull: exit 154 ms, output closed 154
  ms, rebuilt before close false, rebuilt 153 ms after close`. R-1712 PASS, `NOTE pi stale pull: injected 160 ms,
  rebuilt 154 ms after`. R-1713 PASS in 171 ms, its detail naming `windows-fixture.md` and `rebuilt when the command
  returned: false; rebuilt 214 ms later`. So the plan's Windows pipe-hold worry did not show: the hook's output closed
  when it exited. The adversary's "claim most likely wrong", green on Windows with no hook change, held. The macOS and
  Ubuntu legs print file totals only; the builder's macOS NOTE read exit 76 ms, rebuilt 105 ms after the output closed.
- The seat on 4219497: `node scripts/requirements-trace.mjs` reads 1,312 rows, 0 off form; `npm run map:check` reads 0
  problems. R-1710 to R-1713 read `implemented`; R-230 and R-892 read `implemented`; R-237 and R-897 read `retired`.
  The seat's local macOS install-check, which the plan requires before `nana-land`, is still owed.
- The builder's report (build 1, `ba0af6a`): verdict PARTIAL only because R-1713 cannot run on macOS. Its six
  wrong-code tries each turned the named checks red: W1 R-1711; W2 R-1711 and R-1712; W3 R-1710 to R-1712; W4 R-1710
  plus the two no-index checks; W5 and W6 R-1711 and R-1712. The seat did not re-run them.
- The builder also ran the full suite (7,558 pass, 15 skip). Its brief forbids that: it allowed single test files
  only, each under a temp HOME. The seat does not count that run as evidence; CI is the evidence.
- The plan-attack's stray folder `<tmp>/nk-ext-Lf7lFg` (46 MB, a `stalehome` index built from the owner's stores) is
  still in the macOS temp folder. The seat should delete it; this record changes nothing outside the worktree.
- No wrong-code pairs from the seat and no independent check: an ordinary lane, so no findings to settle. The plan's
  known limits and cut rows go to HANDOFF as carried residuals.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main` on 4219497):

  ```
  tree movement 8482c2e..4219497: 8 rows in 2 features
  FEAT-004 · Retrieve relevant context with provenance
    R-230 untested -> implemented
    R-237 untested -> retired
    R-892 untested -> implemented
    R-897 untested -> retired
    R-1710 new (implemented)
    R-1711 new (implemented)
    R-1712 new (implemented)
  FEAT-013 · Install and connect harness runtimes
    R-1713 new (implemented)
  ```
