Feature: FEAT-039 · See the product and its decisions in one report. Lane page-overview. Class: ordinary. Builder: pi-worker (larger lane). Build session 2.

Work in the lane worktree on feat/page-overview. Session 1 built the lane and stopped BLOCKED with its work uncommitted in this worktree: the overview rows R-2920 to R-2925 and R-2927 pass in the new `product-overview.test.mjs`, and every new check failed on main's code first. One existing assertion stopped it, rightly. R-2799's test in `packages/nana-pack/tests/product-report.test.mjs` asserts the first three tabs are Decisions, Product, Artifacts, and R-2920 puts the Overview first. R-2799's row says nothing about tab order; only its test checks it. The brief did not name that edit; this brief does. Keep all of session 1's work, make that one change, finish the remaining steps of build brief 1, and commit. Do not edit HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, nana-land.mjs or the review tools, `templates/`, `packages/nana-setup/`, any checker, or any review-folder file.

Precedent:
- packages/nana-pack/tests/product-report.test.mjs:1420-1460 — R-2799's case; its `navLabels.slice(0, 3)` clause is the one this session changes.
- docs/reviews/page-overview-2026-10-25/build-brief-1.md — the steps, checks, Done and Report this session completes.

No private helper moves to a shared module beyond the ones session 1 reported (withinCaseLimit, CASE_LIMIT_MS, treeFixture, table, makeAssessment, hashRow, writeStore, writeRuntimeFile, commitAt, renderHtmlAt into `report-fixtures.mjs`); report any other.

The task:
1. In R-2799's case, change `JSON.stringify(navLabels.slice(0, 3)) === JSON.stringify(["Decisions", "Product", "Artifacts"])` to `JSON.stringify(navLabels.slice(0, 4)) === JSON.stringify(["Overview", "Decisions", "Product", "Artifacts"])`. Its title and every other clause stay. R-2799's row text and evidence stay.
2. Finish build brief 1's remaining steps: `npm run map` and `npm run req:tree` regenerated; every changed module header current; the hand red cases for each new row tried, seen red and restored (do not commit them).
3. Render the real page once from this worktree, as build brief 1 says, and confirm the overview's first screen.

Checks before your one commit: `npm test --` with product-report.test.mjs, product-overview.test.mjs and requirements-tree.test.mjs; then `npm run test:locked` whole, with its output kept out of the worktree; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `node scripts/known-bugs.mjs --root .`; then `git status --short` must print nothing after the commit. Keep every escape sequence in test literals intact. Do not run the install check. Do not push.

Seat check: `node docs/reviews/page-overview-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Commit once, with explicit paths, covering session 1's files and this session's changes: every file `git status --short` lists.

Done: R-2799 expects the Overview first; every new row's test passes and each red case failed by hand; the full suite is green; the map, readme, trace, tree and known-bugs checks are green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 14 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s summary line; each new row's hand red case; the full suite's summary line; the tree checker's deliverables line; the rendered overview's text lines; the page's size before (2,231,455 bytes) and after; map, readme, trace, tree, known-bugs and seat-check status; any departure.
