# Seat checks — ci-suite-timeout build 1, tip 155ef222 (2026-10-20)

- Build, by a Claude Sonnet 5 subagent (`build-brief-1.md`): 10dc31bf adds the five-line `chosen` comment and
  `    timeout-minutes: 90` to the root CI suite job, directly after `runs-on`, and appends R-2060, R-2061 and the
  contract constant `GITHUB_DEFAULT_JOB_TIMEOUT_MINUTES = 360` to `ci-workflow.test.mjs`; 6d87702a adds both rows to
  FEAT-019 after R-1531 and regenerates the tree. 155ef222 merges main 385c633f (the hook-deadlines land); its one
  conflict was the generated CAP-04 line of the tree, which now lists R-2010 to R-2015 and R-2060, R-2061. The
  release and install-check jobs are unchanged, and so is the README. The seat's notes commit adds only this record,
  the Windows log, the review brief, HANDOFF and the session entry.
- CI run 39384632077 on draft pull request #108 at 155ef222 (GitHub's merge commit 7862106b merges 155ef222 into its
  own ancestor 385c633f, so the tree tested is 155ef222's); all five jobs succeeded:
  - macOS `177 files: 175 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7841 pass, 0 fail, 27 skip`.
  - Ubuntu `177 files: 174 PASS, 0 FAIL, 3 SKIP, 0 WARN · checks: 7780 pass, 0 fail, 45 skip`.
  - Windows `177 files: 160 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6776 pass, 0 fail, 104 skip`
    (`ci-windows-155ef222.log`). The 17 skipped files are main's declared set.
  - `ci-workflow.test.mjs` passes 15 on every leg (13 on main). On Windows, by title:
    ```
    PASS R-2060: the suite job sets one job-level time limit below GitHub's six-hour default for every leg
    PASS R-2061: the suite job's time limit is sealed at 90 minutes with a chosen comment directly above it
    PASS  packages/nana-pack/tests/ci-workflow.test.mjs                   15 pass  0.1s
    ```
  - install-check: macOS and Windows success.
  - Job wall times (GitHub's started to completed, setup included): Windows suite 32.0 min (07:08:53 to 07:40:56),
    macOS suite 16.1 min, Ubuntu suite 11.2 min. pi-probe-timeout's run 39384200809, the same hour, took 34.7 min on
    the Windows suite, 0.2 min over the plan's slowest measured leg (34.5). The sealed 90 is still 2.6 times the
    slowest leg seen. pi-probe-timeout's branch carries no limit; neither leg came near 90.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds 155ef222's
    tree.
- Wrong code, by the builder's report as relayed to the seat (the seat did not re-run it): each variant ran in a temp
  copy of ci.yml through `CI_WORKFLOW_PATH`. W1 no limit, W2 360, W3 a per-OS expression, W4 a limit on the Windows
  test step only and W5 a limit on the release job only each turn R-2060 and R-2061 red. W6 60, W7 "picked" and W8 a
  blank line above the limit turn R-2061 red. W9 two limit lines turns R-2060 red. Every variant left the 13 older
  checks green. The plan's adversary ran the same nine on a temp clone of main 1c539a0e with the same result.
- No seat wrong-code pairs and no independent check: an ordinary lane, so there are no findings to settle.
- Lane class: ordinary, as the plan and its adversary decided. The lane changes the root CI workflow's suite job, one
  pack test file and the requirement files. It touches no install, uninstall, doctor, hook, pi extension, gate policy
  or land or review tool, and nothing under packages/nana-setup, so no local install check runs before the land.
- The plan's known limits:
  - Settled: HANDOFF's win-leg-flip residual that the suite job has no time limit, so a hung leg could hold release
    for six hours. The line is removed.
  - New HANDOFF residuals, one line each: the checks read the setting only, and the limit acts only on a hung leg, so
    its first real test is the next one; re-measure the Windows suite when a leg passes 60 minutes, since a false
    time-out cancels a blocking leg and stops release (CI runs the suite one file at a time); a Linux leg cancelled
    at the limit likely stops release, though a failed one does not (inferred, and true at 360 too); the release job
    keeps GitHub's 360-minute default; the install-check job's 20-minute limit carries no provenance comment; the two
    new checks read the suite job as all text between the suite and release jobs.
  - Not carried: the limit counts from the job's start, so a queue wait still delays release. That is GitHub's
    behaviour, not a bug the lane leaves.
- Rows: R-2060 and R-2061 read `implemented` in REQUIREMENTS.md, in FEAT-019 directly after R-1531. The seat helper's
  re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1545 total (1279 implemented · 1 planned ·
  34 retired · 226 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 336
  modules, 0 problems; `npm run readme:check` reads 718 claims, 0 problems; `node scripts/requirements-tree.mjs
  --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, against the merge base 385c633f):
  ```
  tree movement 385c633..155ef22: 2 rows in 1 features
  FEAT-019 · Release usable templates and report support
    R-2060 new (implemented)
    R-2061 new (implemented)
  ```
  CAP-04 moves from 443 to 445 rows and FEAT-019 from 23 to 25. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite).
- Main is 385c633f, the merge base, so the land needs no further merge unless main moves.
