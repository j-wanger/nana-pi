Feature: FEAT-028 · Maintain requirement identity and trace links. Lane artifact-registry. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/artifact-registry. The spec is `docs/reviews/artifact-registry-2026-10-24/must-meet.md`; read it whole, then `entry-table.md` beside it, which holds every registry line, every rewritten Made-by line and every correction to paste. `plan-draft.md` and the three `plan-attack-*.md` files are its inputs; where they differ from the must-meet or the entry table, those two hold. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

Precedent:
- scripts/deliverables.mjs — `ownFieldLines`, `deliverableClaims`, the claim parser and `checkDeliverables`; the registry parse and checks go here, and `ownFieldLines` takes a label set.
- scripts/requirements-tree.mjs — feature-span field parsing and the outline renderer with its field check; the `Artifacts:` outline line goes here.
- scripts/requirements-moved.mjs — the capability section and the summary line; the artifacts section follows them.
- scripts/requirements-lift.mjs — feature prose carried through a lift, with and without a mapping.
- packages/nana-pack/lib/brief-precedent.mjs — `trackedAtHead`, which the tracked-class and writer checks build on.
- apps/bench/lib/checkers.mjs — `globMatch`, imported for tracked globs, never copied.
- packages/nana-pack/tests/requirements-deliverables.test.mjs — the temporary git repository fixture, the R-2536, R-2743 and R-2730 tests and their control ledger.
- packages/nana-pack/tests/requirements-tree.test.mjs — the historical outline checks (R-2446) and the copied-CLI file list (R-2538).
- packages/nana-pack/tests/requirements-moved.test.mjs — the movement report tests.
- packages/nana-pack/tests/requirements-cap-kinds.test.mjs — the lift dry-run and mapping fixtures.

No private helper moves to a shared module.

The task:
1. Rows R-2780 to R-2787 under FEAT-028, worded as in the must-meet, `implemented` once their tests pass; the text changes to R-2536, R-2538 and R-2730 the must-meet names.
2. The checks the rows state, in `scripts/deliverables.mjs` (registry parse, classes and shapes as sealed contract values with provenance comments and one seal test naming R-2781, the binding, the built-from rule, duplicates, dead spans, the kindless rule, the gate) and the outline, movement and lift changes in their own scripts.
3. Until lane 2: `deliverableClaims` resolves a registry reference to the string today's page expects, as the must-meet and entry table rulings 2 and 3 say (a store entry maps back to its machine-local name only under today's exact R-2743 test; a glob entry resolves to no artifact; any other entry resolves to its location). `scripts/product-report.mjs` does not change.
4. The ledger: paste table A's entries into their maker features' spans (after Status and Also applies, before any subgroup), table B's Made-by lines and table C's corrections, anchoring by feature heading and row ID, not by line number. Where main changed a claim line after fc06e29d, keep main's text and add only the third part. Update the ID-blocks, organization, governance and checks paragraphs; `templates/_shared/requirements-organization.md`; the requirements skill. Regenerate `docs/requirements-tree.md`.
5. The tree check's deliverable line must stay `deliverables: 19 of 22 made and read by code, 19 parked` and print no deliverable note; R-2730 must stay green on this repository.

Try each must-meet row's red case by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: the four test files named above, each alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run report` and confirm the page builds; `npm run test:locked`.

Seat check: `node docs/reviews/artifact-registry-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the eight rows and their tests exist and pass, the ledger carries every entry, rewritten claim and correction, the tree check prints the same count line and no note, the page builds, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; entries pasted and claims rewritten (counts); each red case's hand check; the count line; the full suite's summary line; map, readme, trace, tree, report and seat-check status; any departure from the entry table, with its reason.
