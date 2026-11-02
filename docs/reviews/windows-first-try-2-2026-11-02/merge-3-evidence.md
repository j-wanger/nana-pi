# Merge 3 evidence

Merged origin/main at 816f63db6d3de3bb819c38660e1ac90c601bbc4e into the lane from 731bcf2f.

## Preservation

- No behavior change, new requirement, test, tunable or mutation pair.
- R-3540 and R-3541 remain unchanged. No existing test was edited by this build.
- The lane's four test/helper modules remain byte-identical to the pre-merge tip.
- Every file outside the lane's scope matches origin/main, including deleted lines.
- The session archive remains byte-identical to the pre-merge tip; removing only the lane's whole entry yields origin/main byte for byte. Main's entries retain their newest-first order.
- The four FEAT-031 round-1 notes remain unchanged: load-sensitive control, helper coverage gaps, label-based retry exclusion and hidden producer crashes. Every other FEAT-031 line matches main, including main's deletions. This build fixes no known bug.
- The lane's FEAT-013 lines and previous review folder remain intact. No README delta exists against main.
- Both generated documents conflicted. Their generators resolved them; neither was hand-merged.
- Precedent: kept the existing session entry whole, newest first. No departure.

## Commands and exits

Full output is in the adjacent merge-3-*.log files. Warning paths in two logs use <worktree> instead of the absolute checkout path.

- git fetch origin: 0.
- git merge --no-commit origin/main: 1, expected generated-document conflicts.
- npm run map: 0.
- npm run req:tree: 0.
- npm test -- packages/nana-pack/tests/objective-golden.test.mjs packages/nana-setup/tests/hooks-win32-exec.test.mjs: 0; 2 files, 1 PASS, 0 FAIL, 1 SKIP; 1280 checks pass.
- npm run map:check: 0; 590 modules, 0 problems.
- npm run readme:check: 0.
- node scripts/requirements-trace.mjs: 0; 2433 rows, 2177 traced, 0 off form.
- node scripts/requirements-tree.mjs --check: 0.
- node scripts/known-bugs.mjs --root .: 0; names=0, sizes=1 (report-only FEAT-013 size note).
- node scripts/identity-scan.mjs --root .: 0.
- Preservation comparison: 0 after correcting an initial overly strict comparison that expected all FEAT-031 lines to stay unchanged. Main intentionally changed unrelated lines; the corrected comparison verifies the four lane notes and exact main content elsewhere. The initial comparison exited 1.
- git diff --check: 0 (unstaged). git diff --cached --check: 2 on inherited main whitespace only; git diff --check origin/main: 0. Main files remain untouched.
- node scripts/lane-class.mjs --root .: 0; ordinary.

CI covers the suite. No locked full suite, model session, seat script, GitHub issue write, HANDOFF edit or prohibited temporary-path write ran. The Windows-only test skips locally; CI must execute it. No mutation pairs were rerun because the merge changes no behavior.
