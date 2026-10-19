# Seat checks — leaf-total-drop build 1, tip 32ca20b (2026-10-19)

- CI on the draft pull request, run 39298848848, GitHub's merge of 32ca20b into main 713d6aa (merge commit 4d91dd55):
  Windows `157 files: 140 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6484 pass, 0 fail, 83 skip` (`ci-windows-run-1.log`);
  macOS 157 files, 155 PASS, 0 FAIL, 2 SKIP (7,557 checks pass); Ubuntu 157 files, 155 PASS, 0 FAIL, 2 SKIP (7,502
  checks pass); install-check macOS and Windows success. None of main's known failures showed.
- requirements-tree.test passes 93 checks on all three legs, the new R-291 accounting check and R-1640 to R-1643
  among them; Windows `PASS  packages/nana-pack/tests/requirements-tree.test.mjs  93 pass  1.5s`. The seat's local
  run at 32ca20b: 93 pass, `all passed`.
- Build 1 (f3d26f9, Claude Sonnet 5) replaced the R-291 "leaf counts total 1,298" literal with a test-local
  `treeAccounting` and added R-1640 to R-1643 as implemented. `grep -nE "1,2[0-9]{2}|=== 1[0-9]{3}"` on the test file
  finds nothing; the R-288 heading count `=== 68` stays, as the plan says. `scripts/requirements-tree.mjs`, the
  templates and the requirements skill are untouched.
- Wrong-code tries: the build commit's message records no W1 to W7 results, and no builder report sits in this folder,
  so this record cannot confirm them on the build. The only written record is the adversary's prototype in
  `plan-attack.md`: W1 to W7 each turned its named check red, and two extra cases (counting only `rowsInTables`, and
  an accounting that returns nothing) went red too.
- 32ca20b is the seat's hand merge of main 713d6aa. It keeps the lane's `requirements-tree.test.mjs`; main's side
  (6b3e432..713d6aa) changed that file only to raise the literal from 1,285 to 1,298. `git diff 713d6aa..32ca20b`
  holds only the lane's six files.
- The seat's re-run at 32ca20b: `node scripts/requirements-trace.mjs` reads `1302 total (1016 implemented · 1 planned ·
  18 retired · 262 untested · 5 violated)` and `ears: 0 rows off form`, exit 0; `npm run map:check` reads 299 modules,
  0 problems; `node scripts/requirements-tree.mjs --check` exits 0; R-1640 to R-1643 read `implemented` in
  REQUIREMENTS.md.
- Tree movement (`requirements-moved --base main`): 4 rows in 1 feature, FEAT-028, R-1640 to R-1643 new (implemented).
- No wrong-code pairs and no independent check: an ordinary lane (one test file, four ledger rows, the regenerated
  outline).
- Main moved after the CI run: it is at 27603d4, two lands (audit-open-questions, review-timeline) past the lane's
  merge-base 713d6aa, and main's side raised the literal again, to 1,306. The lane has not merged it; that merge keeps
  the lane's test file and needs its own confirmation round.
- The literal's history: 46 commits had changed it when the plan was written, 49 by 713d6aa, 51 on main at 27603d4.
- Known limits of `must-meet.md` stay open; HANDOFF carries each as a residual.
