Feature: FEAT-039 · See the product and its decisions in one report. Lane report-names-artifacts. Class: ordinary. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/report-names-artifacts at its current tip. The spec is `docs/reviews/report-names-artifacts-2026-10-24/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in the review folder.

Precedent:
- packages/nana-pack/tests/product-report.test.mjs — the R-2790 check and its fixture (R-9000 to R-9005); the change stays in that check.

No private helper moves to a shared module.

The finding (seat pair 2, `seat-mutate-809d0571.txt`): removing the de-duplication in `orderedIds` (`scripts/product-report.mjs`) leaves R-2790 green. R-9000 names built-from A-003 on two claims, so the mutated page shows `built from A-003 · …, A-003 · …`. The R-2790 check reads only the start of that line, so it passes. The must-meet's red case "a claim naming the same built-from ID as another claim lists it twice" is therefore not pinned.

The task:
1. Make the R-2790 check assert R-9000's built-from line names A-003 exactly once and does not name A-001, which R-9000 already shows as a named artifact. Read the whole line, not its start.
2. Change no product code.

Try the red case by hand: delete the `if (!seen.has(id))` guard in `orderedIds`, see the R-2790 check turn red, restore, and say so in your report; do not commit it.

Checks before your one commit: product-report.test.mjs alone; `node scripts/requirements-trace.mjs`; `npm run map:check`; `npm run test:locked`.

Seat check: `node docs/reviews/report-names-artifacts-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the R-2790 check fails when the de-duplication is removed and passes at the tip, the full suite is green, and the work is committed.

Report (at most 6 lines after the VERDICT line): the commit sha; the red case's hand check; the full suite's summary line; trace, map and seat-check status.
