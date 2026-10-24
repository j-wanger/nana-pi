Feature: FEAT-028 · Maintain requirement identity and trace links. Lane feature-artifact-lines. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/feature-artifact-lines. The spec is `docs/reviews/feature-artifact-lines-2026-10-24/must-meet.md`; read it whole, then `entry-table.md` beside it, which holds every new `Artifact:` line (Table A), every `Reads:` line (Table B), the placement rule and the seat's rulings. `plan-attack.md` and `entry-table-derive.md` there are inputs; where they differ from the must-meet or the entry table, those two hold. Lane 1's and lane 2's plans are in `docs/reviews/artifact-registry-2026-10-24/` and `docs/reviews/report-names-artifacts-2026-10-24/`, for background only. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in a review folder.

Precedent:
- scripts/deliverables.mjs — `artifactRegistry`, `ARTIFACT_LABELS`, `ownFieldLines` with its label set, `registryReference`, `needsTrackedPaths` and the tracked-writer check; the reads parse is one new export beside the registry parse, and its notes reach `deliverableReportLines` the way the registry's do.
- scripts/requirements-tree.mjs — the `Artifacts:` outline line, its field check (R-2785) and the print gate (R-2538).
- scripts/requirements-moved.mjs — the artifacts section and its summary count (R-2786).
- scripts/requirements-lift.mjs — feature prose carried through a lift (R-2787).
- packages/nana-pack/tests/requirements-deliverables.test.mjs — the R-2780 to R-2783 tests, their temporary repository fixture, and the R-2730 control ledger.
- packages/nana-pack/tests/requirements-tree.test.mjs — the R-2785 test and its history helper, which R-2796 reuses rather than copies; the R-2538 test.
- packages/nana-pack/tests/requirements-moved.test.mjs — the R-2786 test.
- packages/nana-pack/tests/requirements-cap-kinds.test.mjs — the R-2787 test.

No private helper moves to a shared module; the reads parse is a new export of `scripts/deliverables.mjs`, imported by the outline, the field check and the movement report.

The task:
1. Rows R-2795 to R-2798 under FEAT-028, worded as in the must-meet, `implemented` once their tests pass; the text changes to R-2538 and R-2787 and the R-2730 test change the must-meet names.
2. The checks the rows state: the `Reads` label as a sealed contract value with provenance, the reads parse and its notes, reads kept out of the registry's entries, ID map and rule-switching count but counted for the print gate and the HEAD-tree read, the built-from tie, the outline line and its field check, and the movement report's reads changes.
3. The ledger: paste Table A's entries and Table B's `Reads:` lines into their features' spans as the placement rule says, anchoring by feature heading, not by line number. Update the organization, governance and checks paragraphs, `templates/_shared/requirements-organization.md` and the requirements skill; no new line in that text may start with `Reads:` inside a capability span. Regenerate `docs/requirements-tree.md`.
4. The tree check's deliverable line must stay `deliverables: 19 of 22 made and read by code, 19 parked` and print no deliverable note; R-2730 must stay green on this repository.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: the four test files named above, each alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `node scripts/requirements-moved.mjs --root . --base main`; `npm run report` and confirm the page builds; `npm run test:locked`.

Seat check: `node docs/reviews/feature-artifact-lines-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the four rows and their tests exist and pass, the changed rows and tests read as the must-meet says, the ledger carries every Table A entry and Table B line, the tree check prints the same count line and no note, the page builds, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; entries and reads lines pasted (counts); each red case's hand check; the count line; the movement report's summary line; the full suite's summary line; map, readme, trace, tree, report and seat-check status; any departure from the entry table, with its reason.
