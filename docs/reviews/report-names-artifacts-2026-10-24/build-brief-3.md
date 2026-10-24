Feature: FEAT-039 · See the product and its decisions in one report. Lane report-names-artifacts. Class: ordinary. Builder: pi-worker (small lane). Build session 3.

Work in the lane worktree on feat/report-names-artifacts at its current tip. The spec is `docs/reviews/report-names-artifacts-2026-10-24/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in the review folder.

Precedent:
- packages/nana-pack/tests/requirements-deliverables.test.mjs — the R-2793 check, its `mismatchLedger` case and its `registryTree` helper; the change stays in that check.

No private helper moves to a shared module.

The finding (seat pair 19, `seat-mutate-dd038e0b.txt`): changing `artifactAgeTableKey` in `scripts/deliverables.mjs` to accept any writer list whose first writer is the table's writer leaves R-2793 green. No case puts a two-writer entry at a table location, so the row's clause "its writer list is exactly that entry's one writer" is not pinned.

The task:
1. Add one case to the R-2793 check: an entry at the suite-records table location with run `suite` and writers `packages/nana-pack/lib/suite-records.mjs, scripts/test-locked.mjs` gets the age-table note, and `artifactAgeTableKey` returns null for it.
2. Change no product code.

Try the red case by hand: drop `entry.writers.length === 1 &&` from `artifactAgeTableKey`, see the R-2793 check turn red, restore, and say so in your report; do not commit it.

Checks before your one commit: requirements-deliverables.test.mjs alone; `node scripts/requirements-trace.mjs`; `npm run map:check`; `npm run test:locked`.

Seat check: `node docs/reviews/report-names-artifacts-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the R-2793 check fails when the one-writer clause is dropped and passes at the tip, the full suite is green, and the work is committed.

Report (at most 6 lines after the VERDICT line): the commit sha; the red case's hand check; the full suite's summary line; trace, map and seat-check status.
