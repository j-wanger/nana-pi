Feature: FEAT-039 · See the product and its decisions in one report. Lane page-detail. Class: ordinary. Builder: pi-worker (larger lane). Build session 3.

Work in the lane worktree on feat/page-detail. Sessions 1 and 2 built the whole lane and stopped BLOCKED with the work uncommitted in this worktree: every step of build briefs 1 and 2 is done except the locked full suite, the final checks, the real-page counts and sizes, the seat check and the commit, and all 26 hand red cases went red. Session 2 stopped, rightly, on an existing check outside the allowed list: `R-2740: a passing land writes the product report for HEAD under the git common directory after its suite record and runtime data, and names it in one land note` in `packages/nana-pack/tests/runtime-land.test.mjs` fails with `TypeError: Cannot read properties of undefined (reading '0')`. Its helper `ageFor` (`:231-234`) reads a deliverable's `artifactLines[0]` from `model.capabilities[].deliverables[]`, and this lane moved those lines to the home feature's block in `feature.detailSections`. The seat checked that no other test, script or tool reads the moved model fields. The brief did not name that helper; this brief does. Keep all of the earlier sessions' work, make that one change, finish, and commit. Do not edit HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, nana-land.mjs or the review tools, `templates/`, `packages/nana-setup/`, any checker other than session 1's `readerKind` change in `scripts/deliverables.mjs`, or any review-folder file except `docs/reviews/page-detail-2026-10-25/build-1-checks.md`.

Precedent:
- packages/nana-pack/tests/runtime-land.test.mjs:231-234 — `ageFor`, the one helper this session changes.
- scripts/product-report.mjs:850-857 — where a deliverable's block, with its heading and `artifactLines`, joins its home feature's `detailSections`.
- docs/reviews/page-detail-2026-10-25/build-brief-1.md — the checks, Done and Report this session completes.

No private helper moves to a shared module beyond the eight session 1 reported; report any other.

The task:
1. In `packages/nana-pack/tests/runtime-land.test.mjs`, change only `ageFor`'s body: find the block whose heading starts with `${row} ` among `model.features[].detailSections[].blocks`, take its first artifact line, and join that line's segment texts into one string before the existing regular expression; an absent block or line still gives `""`. Use the block field names session 1's model actually has. Do not change R-2740's title, any assertion, `pageModel`, or any other helper or check in that file.
2. Run `npm test -- packages/nana-pack/tests/runtime-land.test.mjs` and see R-2740 pass. Then try one red case by hand: make `ageFor` read the second artifact line, see R-2740 fail, and restore.
3. Finish build brief 1's remaining checks and the real-page render: Product, Artifacts and FEAT-013 line counts, and the page's size before (2,242,158 bytes) and after.
4. If any other existing assertion outside build brief 1's steps 8 and 9 and this brief breaks, stop and report it again, with the check's title and its failure output.

Checks before your one commit: build brief 1's focused `npm test --` list; then `npm run test:locked` whole, with its output kept out of the worktree; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`, and `node scripts/requirements-tree.mjs --root .` must still print `deliverables: 21 of 21 made and read by code, 21 more parked`; `node scripts/known-bugs.mjs --root .`; then `git status --short` must print nothing after the commit. Keep every escape sequence in test literals intact. Do not run the install check. Do not push.

Seat check: `node docs/reviews/page-detail-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Commit once, with explicit paths, covering the earlier sessions' files and this session's change: every file `git status --short` lists.

Done: R-2740 passes with only `ageFor` changed; build brief 1's Done holds in full.

Report (at most 20 lines after the VERDICT line): build brief 1's Report items, plus this session's `ageFor` change and its red case.
