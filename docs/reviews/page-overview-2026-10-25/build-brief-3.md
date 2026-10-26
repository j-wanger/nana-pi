Feature: FEAT-039 · See the product and its decisions in one report. Lane page-overview. Class: ordinary. Builder: pi-worker (small lane). Build session 3.

Work in the lane worktree on feat/page-overview, at ccf3ad60 plus the seat's commit of this brief and the pairs files. The seat's wrong-code pairs at ccf3ad60 went 46 of 47 red (`docs/reviews/page-overview-2026-10-25/seat-mutate-ccf3ad60.txt`). Pair 11 survived: it swaps the optional and parked counts in Needs you's count line, and R-2921's fixture has one optional ask and one parked ask, so the line reads the same. The must-meet's red case "kinds swapped" is therefore unpinned. This session makes the two counts differ in that fixture, and changes nothing else. Do not edit product code, REQUIREMENTS.md, HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, the review tools, `templates/`, `packages/nana-setup/`, any checker, or any review-folder file.

Precedent:
- packages/nana-pack/tests/product-overview.test.mjs:68-77 — R-2921's case; its `handoff` fixture and its first `assert.deepEqual` are the two things this session changes.

No private helper moves to a shared module.

The task:
1. In R-2921's `handoff` array, add one more optional ask under `## Open for the owner`, after the existing optional one, for example `- **[optional, since 2026-01-06] Opt two.** body`. The optional count becomes 2 and the parked count stays 1.
2. In the same case's first `assert.deepEqual`, change the count line to `${L.asks}: 5 · ${L.blocking}: 2 · ${L.optional}: 2 · ${L.parked}: 1`. Every other expected line stays, including the two must-decide lines and their order.
3. Keep the test title, the `req: R-2921` marker and every other clause unchanged. R-2921's row text and evidence stay.
4. Try the red case by hand: in `scripts/product-report.mjs`, swap the optional and parked counts in Needs you's count line, run the overview test, see R-2921 fail, and restore the file. Do not commit the red case.

Checks before your one commit: `npm test -- packages/nana-pack/tests/product-overview.test.mjs`; then `npm run test:locked` whole, with its output kept out of the worktree; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `node scripts/known-bugs.mjs --root .`; then `git status --short` must print nothing after the commit. Keep every escape sequence in test literals intact, including the `"\r\n"` join. Do not run the install check. Do not push.

Seat check: `node docs/reviews/page-overview-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Commit once, with explicit paths: the one test file.

Done: R-2921's fixture has two optional asks and one parked ask; the test passes and fails with the counts swapped; the full suite is green; the map, readme, trace, tree and known-bugs checks are green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s summary line; the hand red case's FAIL line; the full suite's summary line; map, readme, trace, tree, known-bugs and seat-check status; any departure.
