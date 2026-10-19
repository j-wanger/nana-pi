# Seat checks — win-review-stubs build 1, tip 7710d09 (2026-10-19)

- CI run 39315973548 on draft pull request #67, GitHub's merge of 7710d09 into faf601e (merge commit 4d86c28;
  faf601e is an ancestor of 7710d09, so the run tested 7710d09's tree): macOS `164 files: 162 PASS, 0 FAIL, 2 SKIP, 0
  WARN · checks: 7637 pass, 0 fail, 16 skip`; Ubuntu `164 files: 162 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7582 pass,
  0 fail, 34 skip`; Windows `164 files: 147 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6574 pass, 0 fail, 79 skip`
  (`ci-windows-run-1.log`). The Windows skips are main's declared ones: the 16 desk files and study-tasks.
  install-check passes on macOS and Windows. None of main's known failures showed (Ubuntu path-spelling GP1/GP2, a pull
  request run's R-291 leaf-total merge artifact).
- review-standard on Windows: `7 pass`, no skip, up from 3 pass, 3 skip on Windows CI run 39278411820 (the plan's red
  probe). The log prints each check: `PASS control: a pack copy with the review standard present exits 0, starts the
  stub and creates the reservation folder`, then `PASS missing review standard is refused before admission` (R-1680),
  `PASS directory at the review standard path is refused before admission` (R-1681) and `PASS blank review standard is
  refused before admission` (R-1682). The control did not run on Windows before. The adversary's claim most likely
  wrong, that the strengthened control passes on the Windows leg, held.
- handoff-writer-role on Windows: `7 pass`, no skip, up from 6 pass, 1 skip. `PASS pi-review: child spawn env contains
  NANA_HANDOFF=off` (R-1683). The `SKIP pi-review spawn env: POSIX shell stub` line is gone.
- Both files on macOS and Ubuntu: 7 pass each, no skip.
- The seat on 7710d09: `node scripts/requirements-trace.mjs` reads 1,382 rows (1,378 at the lane's start; the lane
  adds four rows and edits none), 0 off form; `npm run map:check` reads 0 problems over 316 modules. R-1680 to R-1683
  read `implemented`.
- The builder's report (a Claude Sonnet 5 subagent, build 1 `7710d09`, verdict DONE; single test files only): macOS
  review-standard and handoff-writer-role 7 pass, 0 skip each. Five wrong-code tries, each reverted: (1) pi-watchdog
  without `NANA_HANDOFF: 'off'` fails R-1683's check; (2) the review-standard catch setting the text to `'x'` fails the
  missing and directory checks; (3) the blank check disabled fails the blank check; (4) the POSIX stub without its
  marker fails only the control; (5) the reservation folder misspelled in the test fails only the control, while the
  three refusal checks still pass. So the control now carries the "no reservation" clause, as the plan's amendment 1
  intended. The seat did not re-run them, and none ran on Windows.
- `bin/pi-review.mjs`, `bin/pi-watchdog.mjs`, `tests/fake-pi.mjs` and all other product code are byte-identical to the
  lane's start (`git diff 77aa31d..7710d09` touches only the two test files, REQUIREMENTS.md, the tree, the code map
  and this folder). The brief's leaf-total step did not apply: leaf-total-drop had landed, so the tree test holds no
  typed total.
- The lane started from 77aa31d, the knowledge-refresh-pin lane's reviewed tip, not from main. `git merge-base HEAD
  main` is 904aa30, so `git diff 904aa30..HEAD` also shows that lane's change. The lane's own change is
  `git diff 77aa31d..HEAD`.
- No wrong-code pairs from the seat and no independent check: an ordinary lane (tests and rows only), so no findings to
  settle. The plan's known limits go to HANDOFF as carried residuals.
- Tree movement, the lane's own (`node scripts/requirements-moved.mjs --root . --base 77aa31d1` on 7710d09):

  ```
  tree movement 77aa31d..7710d09: 4 rows in 1 features
  FEAT-007 · Review a specific revision independently
    R-1680 new (implemented)
    R-1681 new (implemented)
    R-1682 new (implemented)
    R-1683 new (implemented)
  ```

  Against main (`--base main`), the report reads `tree movement 904aa30..7710d09: 12 rows in 3 features`; the other
  eight rows (R-230, R-237, R-892, R-897, R-1710 to R-1713) are knowledge-refresh-pin's.
