# Seat checks — adopt-closes-check build 1, tip e4c1ba2 (2026-10-19)

- CI run 39297417557 on draft pull request #52 (e4c1ba2; GitHub merged it onto main 713d6aa, which the tip already
  contains): macOS `157 files: 155 PASS, 0 FAIL, 2 SKIP` (7,554 checks pass); Ubuntu `155 PASS, 0 FAIL, 2 SKIP`
  (7,499 pass); Windows `140 PASS, 0 FAIL, 17 SKIP` (6,481 pass; `ci-windows-run-1.log`). The skips are main's
  declared ones: hooks-win32-exec and study-tasks off Windows, the 16 desk files and study-tasks on it.
  install-check passes on macOS and Windows.
- entry-guidance passes 14 of 14 on all three legs, R-1670 among them. The other files the plan names pass on every
  leg: skill-claims 30, project 121, templates-render 168 (167 and 2 skips on Windows), requirements-tree 89,
  readme-check 11.
- The seat re-ran entry-guidance alone on e4c1ba2 on macOS: 14 PASS, 0 FAIL. `node scripts/requirements-trace.mjs`:
  1,299 rows, 0 off form; `npm run map:check`: 0 problems. R-1670 reads `implemented`.
- Wrong-code pairs: none from the seat (an ordinary lane). Per the builder's report, its five wrong-code tries from
  the brief each turned R-1670 red: the closing step before the commit step, adopt-structure left on a plain Report,
  the owner's-yes sentence dropped, the node form dropped, the step put under "## Notes". The seat did not re-run
  them. The adversary's earlier probe in a temp clone turned the first four red, and the check failed on main's skills
  for all three skills.
- Independent check: none (an ordinary lane), so no findings to settle. The plan's known limits go to HANDOFF as
  carried residuals.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main` on e4c1ba2):

  ```
  tree movement 713d6aa..e4c1ba2: 1 rows in 1 features
  FEAT-014 · Create or adopt a project workspace
    R-1670 new (implemented)
  ```
