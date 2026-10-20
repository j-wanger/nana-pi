# Seat checks — post-edit-win-survivors build 1, tip 2be1e76 (2026-10-19)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`): one pass, commit 2be1e76d, verdict DONE.
  Per the builder's report, not re-run by the seat: on macOS post-edit-hardening reads 22 PASS, 1 SKIP and
  post-edit-status 32 PASS, 1 SKIP; R-1820 added and `implemented`; R-093 and R-096 `retired`; R-787's evidence gains
  (a)'s gone check; the status file's marker `R-788 R-096` becomes `R-788`. Each of its four wrong-code tries on macOS
  turned a named check red: killTree always sends SIGTERM and never escalates (exit 3: FAIL a's gone check, b's orphan
  check and c's new check); onAbort settles without a kill (c's new check); the group kill replaced by a direct kill
  (b's orphan check, the tree check and c's new check); a test-side abort before the tree is built (c's new check).
  Not run by the builder, per its brief: the full suite and the Windows mutation. bdfc5cd6 adds only the seat's
  Windows pair table, its helper and its output; no code or test changed after 2be1e76.
- CI run 39333881920 on draft pull request #77 (2be1e76d; GitHub's merge onto 22ccd849, merge commit d06d9822;
  2be1e76 already holds 22ccd849, so the merge's tree should be 2be1e76's, inferred):
  - macOS `166 files: 164 PASS, 0 FAIL, 2 SKIP` (7,650 checks pass, 18 skip). post-edit-hardening `22 pass, 1 skip`
    (the skip is the win32 fallback check, Windows-only); post-edit-status `32 pass, 1 skip`.
  - Ubuntu `166 files: 164 PASS, 0 FAIL, 2 SKIP` (7,595 checks pass, 36 skip). post-edit-hardening `22 pass, 1 skip`;
    post-edit-status `32 pass, 1 skip`.
  - Windows `166 files: 149 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6589 pass, 0 fail, 79 skip`
    (`ci-windows-run-1.log`). post-edit-hardening `17 pass` with no skip. That is main's count too, because (c)'s new
    check replaces the old pgrep one. The pid-based checks now print PASS on win32:
    ```
    PASS a: resolved within deadline + kill grace (395ms)
    PASS a: the checker is gone, not just abandoned
    PASS c: aborted run resolved within the kill grace (73ms)
    PASS c: an aborted turn ends the check's process and that process's still-running child
    ```
    post-edit-status `33 pass, 1 skip`.
  - install-check: macOS and Windows success. None of main's known failures showed.
- The seat's Windows wrong-code run (must-meet "Verification (seat)"), in place on the Windows CI leg: scratch branch
  `seatmut/post-edit-win-survivors`, commit 0994a272 (the lane tip 2be1e76d plus the pair table and a Windows-only CI
  job), run 39333944297, never merged. The helper `win-pairs.mjs` runs the file through `npm test -- --verbose`, as the
  suite job does. Pair K1 (`seat-mutate-win.mjs`): killTree's win32 branch runs `taskkill /F /PID` without `/T`, and
  both its `error` and `close` fallbacks do nothing. Result (`seat-mutate-win-output-2be1e76.txt`, committed in
  bdfc5cd6): post-edit-hardening `13 pass, 4 fail`, exit 4. The four FAILs are exactly the four named checks:
  `a: the checker is gone, not just abandoned`, `tree: a timed-out check's process and that process's still-running
  child are both ended`, `win32: with taskkill off PATH the timed-out check's shell is killed and the run settles` and
  `c: an aborted turn ends the check's process and that process's still-running child`. The file ends on
  `process.exit(fails)`, so exit 4 with 13 + 4 = 17 checks reported means it ran through (j); no cleanup throw cut it
  short, and the log holds no EBUSY. This is what the plan's Verification required. Baseline on the same checkout:
  exit 0, every check PASS (the helper's "18 PASS" also counts the runner's own PASS line for the file; the file
  prints 17). Under the same broken kill code, main's file passed (a) and (c) and then threw EBUSY in (c)'s cleanup
  (run 39317131316); run 39314443000 crashed in (a)'s cleanup. So the adversary's claim most likely wrong, that (a)'s
  pid check fails by name under this mutant, held: cmd.exe had started the checker before the kill.
- Independent check: none. An ordinary lane gets none (tests, rows, one pack README clause and two generated docs).
  No independent findings to settle.
- `git diff 22ccd849..HEAD -- packages/nana-pack/extensions/ scripts/test.mjs` is empty: the extension and the test
  runner did not change. (b) and (f) still use `survivors()` (pgrep) and stay POSIX-gated; `survivors()` now throws
  off POSIX instead of returning "".
- Rows: R-1820 reads `implemented` in REQUIREMENTS.md; R-093 and R-096 read `retired` with their superseding rows.
  The seat helper's re-run on bdfc5cd6 plus these notes: `node scripts/requirements-trace.mjs` reads `1397 total (1111
  implemented · 1 planned · 26 retired · 254 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`, exit 0;
  `npm run map:check` reads 319 modules, 0 problems; `npm run readme:check` reads 709 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base 22ccd849): 3 rows in FEAT-030 —
  R-093 implemented -> retired; R-096 implemented -> retired; R-1820 new (implemented). R-787 keeps its status; only
  its evidence grew.
- HANDOFF: one Landed line. The post-edit-win-pin residual about the pgrep checks is gone: abort now has a Windows
  check, both blind checks find their processes by pid, and broken kill code fails four named checks with no crash.
  That line named three blind checks; there were two, (a) and (c), since (b) runs only on macOS and Linux, and (c)
  was also the line's untested abort case. The post-edit-win-pin line on a slow process tree now says the abort check
  waits on the same 2.5 s limit. New residuals for this lane: (a) has no started-before-the-kill guard; (b) and (f)
  stay POSIX-only with no Windows SKIP line, and (b)'s comment misstates its spawner; only the seat's one scratch run
  shows broken kill code failing on Windows. The plan's other known limits (a taskkill that starts and then fails, a
  reused or unreaped pid) were already HANDOFF residuals from post-edit-win-pin. The seat also added three
  stale-copies-hooks residuals from that lane's final reviews.
- Main moved after the CI run: it is at f497c5ad, three lands past the lane's merge base 22ccd849
  (review-ledger-run-reviewer 02f1c139, adopt-structure-markers cb1a5b57, stale-copies-hooks f497c5ad). The lane has
  not merged them. That merge needs its own accepted review coverage, and HANDOFF's stale-copies residual block will
  conflict there (both sides add lines after the same line).
