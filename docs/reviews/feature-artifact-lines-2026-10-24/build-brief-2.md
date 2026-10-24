Feature: FEAT-028 · Maintain requirement identity and trace links. Lane feature-artifact-lines. Class: ordinary. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/feature-artifact-lines at its current tip. The spec is `docs/reviews/feature-artifact-lines-2026-10-24/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in a review folder.

Precedent:
- packages/nana-pack/tests/requirements-deliverables.test.mjs — the R-2795 and R-2798 checks and their fixtures; the changes stay in those two checks.

No private helper moves to a shared module.

The findings (`seat-mutate-c8a228bb.txt`):
- Seat pair 5: changing `if (!artifact?.live)` to `if (!artifact)` in `artifactReads` (`scripts/deliverables.mjs`) leaves R-2795 green. The R-2795 check covers an unknown ID but no retired entry, so the row's "an ID with no live entry" is pinned only for unknown IDs.
- Seat pair 15: building `readAtHome` from every feature's reads instead of the home feature's leaves R-2798 green. The must-meet's red case "a built-from entry read by a `Reads:` line in another feature passes" has no case.

The task:
1. Add to the R-2795 check: a `Reads:` line naming an entry whose line is retired gets the "has no live entry" note.
2. Add to the R-2798 check: a deliverable whose built-from entry is read by a `Reads:` line in a feature other than its home feature, and neither registered nor read at home, gets the tie note naming the row, the entry and the home feature.
3. Change no product code.

Try both red cases by hand: apply each seat mutation above, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: requirements-deliverables.test.mjs alone; `node scripts/requirements-trace.mjs`; `npm run map:check`; `npm run test:locked`.

Seat check: `node docs/reviews/feature-artifact-lines-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: R-2795 fails under pair 5's mutation and R-2798 under pair 15's, both pass at the tip, the full suite is green, and the work is committed.

Report (at most 6 lines after the VERDICT line): the commit sha; each red case's hand check; the full suite's summary line; trace, map and seat-check status.
