# Seat checks — report-not-passed build 1, tip 81efff9 (2026-10-19)

- CI run 39299137862 on draft pull request #57 (81efff9, build 1 6253983 plus a merge of main 713d6aa; GitHub's merge
  commit 99896e8 merged it into 713d6aa, which it already contains):
  - macOS `157 files: 155 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7559 pass, 0 fail, 15 skip` (log not copied).
  - Ubuntu `157 files: 155 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7504 pass, 0 fail, 33 skip` (log not copied).
  - Windows `157 files: 140 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6486 pass, 0 fail, 83 skip` (`ci-windows-run-1.log`).
  - product-report passes 69 of 69 and requirements-tree 89 of 89 on all three legs.
  - install-check: macOS and Windows success.
  - No leg failed, so none of main's known failures showed: Ubuntu path-spelling GP1/GP2 (fixed on main at ca27d86) and
    the R-291 leaf-total merge artifact (GitHub merged onto the lane's own base, so the total matched).
- Builder's report (build 1, 6253983; Claude Sonnet 5), not re-run by the seat: the six new checks R-1650 to R-1655 were
  red on the old report and green after (product-report 69 pass, 0 fail). Eight wrong-code tries, each red, then
  reverted: drop the FAIL short-circuit (R-1651); `some` for `every` (R-1652, R-1653, R-1655); a missing run treated as
  non-PASS (R-1653 and R-1017's card check); skip files marked changed (R-1654, R-1655); a changed label treated as
  non-PASS (R-1654); drop the implemented filter (R-1650); count from `model.violated` (R-1655); the heading at module
  scope (the file exits 1 with a ReferenceError). The only existing test it edited is R-291's leaf total, 1,298 to 1,304.
- Seat check on the tip (macOS): the report built from 81efff9 over this clone's 2026-10-17 runtime data lists exactly
  R-1064, R-1058, R-1063, R-1330 and R-1340 as not passed (5, ledger order), the set `must-meet.md` names; the builder's
  rendered heading read 5. The same model's violated list also holds 5 rows, which is why R-1655 asserts against the
  fixture's own violated count.
- R-1650 to R-1655 read `implemented` in REQUIREMENTS.md. `requirements-trace`: 1,304 rows (1,018 implemented, 1
  planned, 18 retired, 262 untested, 5 violated), all 1,018 implemented rows traced, 0 off EARS form; the one planned
  row is R-539, as on the base. `map:check`: 299 modules, 0 problems.
- Tree movement (`requirements-moved --root . --base 713d6aa`): 6 rows in FEAT-039 — R-1650 to R-1655 new
  (implemented).
- No wrong-code pairs and no independent check: an ordinary lane (the report script, its test, the ledger, the README and
  the tree outline). No findings to settle.
- Main moved after this tip: audit-open-questions landed, and main is a1d07f6. It also edits `scripts/product-report.mjs`.
  The lane merges it before the review. The plan's merge probe found one conflict, the buildReport model line. HANDOFF's
  Landed tail, the session file's top and the R-291 leaf total also meet; main reads 1,300, so the merge should read 1,306
  (inferred: 1,300 + 6).
- Known limits in `must-meet.md` stay open: no skip reason; a fixed FAIL stays listed until the next measure; a PASS file
  that skipped the cited check is left out; a SKIP file beside an unmeasured one is left out; the heading reads 0 with no
  runtime data; only this clone's data is read. HANDOFF carries the new ones as "Not-passed list" residual lines, plus
  the plan's most-doubted call (a label marked changed since still counts), which the adversary left to the owner. The
  three that repeat existing "Test details in the report" lines (no skip reason, per-file labels, no CI leg's result)
  are not repeated.
