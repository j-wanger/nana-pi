Feature: FEAT-039 · See the product and its decisions in one report. Lane page-detail. Class: ordinary. Builder: pi-worker (small lane). Build session 4.

Work in the lane worktree on feat/page-detail, at 00c171ae plus the seat's commit of this brief and the pairs files. The seat's wrong-code pairs at 00c171ae went 49 of 50 red (`docs/reviews/page-detail-2026-10-25/seat-mutate-00c171ae.txt`). Pair 7 survived: it drops the two-part test from `readerKind` in `scripts/deliverables.mjs`, so a `Read by:` claim with three parts would gain a reader kind. No fixture in any test has a three-part `Read by:` claim, so nothing pins that test. This session adds one to R-2930's fixture and changes nothing else. Do not edit product code, REQUIREMENTS.md, HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, the review tools, `templates/`, `packages/nana-setup/`, any checker, or any review-folder file.

Precedent:
- packages/nana-pack/tests/product-detail.test.mjs:26-49 — R-2930's case; its `ids`, `fields` and `parts` are the three things this session changes.

No private helper moves to a shared module.

The task:
1. In R-2930's case, change `ids` to seven rows (`[1, 2, 3, 4, 5, 6, 7]`).
2. Append two lines to `fields`, after R-006's: `"Made by: R-007 · suite: make.mjs"` and `"Read by: R-007 · code: read.mjs · extra"`.
3. Append to `parts` the expected text for R-007: `${NOT_READ_BY_CODE} · ${L.noReader}` (code makes it; its only reader claim has three parts, so it has no readable kind and code does not read it). If the rendered line differs, stop and report the actual line rather than change product code.
4. Keep the test title, the `req: R-2930` marker, the CRLF and trailing-space rewrite, and every other clause unchanged. R-2930's row text and evidence stay.
5. Try the red case by hand: in `scripts/deliverables.mjs`, remove the two-part condition from `readerKind`, run `npm test -- packages/nana-pack/tests/product-detail.test.mjs`, see R-2930 fail, and restore the file. Do not commit the red case.

Checks before your one commit: `npm test --` with product-detail.test.mjs and requirements-deliverables.test.mjs; then `npm run test:locked` whole, with its output kept out of the worktree; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `node scripts/known-bugs.mjs --root .`; then `git status --short` must print nothing after the commit. Keep every escape sequence in test literals intact. Do not run the install check. Do not push.

Seat check: `node docs/reviews/page-detail-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Commit once, with explicit paths: the one test file.

Done: R-2930's fixture holds a three-part `Read by:` claim whose line reads not read by code with no readable reader; the test passes and fails with the two-part test removed; the full suite is green; the map, readme, trace, tree and known-bugs checks are green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s summary line; the hand red case's FAIL line; the full suite's summary line; map, readme, trace, tree, known-bugs and seat-check status; any departure.
