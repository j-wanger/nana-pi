Feature: FEAT-039 · See the product and its decisions in one report. Lane artifact-flow. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/artifact-flow. The spec is `docs/reviews/artifact-flow-2026-10-24/must-meet.md`; read it whole. `plan-attack.md` beside it is its input; where they differ, the must-meet holds. The earlier artifact lanes' plans are in `docs/reviews/artifact-registry-2026-10-24/`, `docs/reviews/report-names-artifacts-2026-10-24/` and `docs/reviews/feature-artifact-lines-2026-10-24/`, for background only. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in a review folder.

Precedent:
- scripts/product-report.mjs — `renderInto`'s views, nav and requirement cards, the feature detail view, `buildReport`'s model, `artifactAges` and `artifactLinesFor`; new line text is built into the model in `buildReport`, and `renderInto` reads no module constant.
- scripts/deliverables.mjs — `artifactRegistry`, `artifactAgeTableKey` and `artifactReads`, imported, never copied.
- scripts/requirements-tree.mjs — the Needs check (R-2444), read only to confirm it is untouched.
- packages/nana-pack/tests/product-report.test.mjs — the R-2790 to R-2794 fixtures, `renderedProduct`, `capabilityCard`, and the byte-identical page test (R-1012).

No private helper moves to a shared module.

The task:
1. Rows R-2799 to R-2802 under FEAT-039, worded as in the must-meet, `implemented` once their tests pass.
2. The Artifacts view, its nav link, its layout and exact texts, ages for every live entry in the one `artifactAges` call, the flow lines, the two lists and the feature detail lines, as the must-meet states.
3. The docs the must-meet lists, and the module header.
4. The tree check's deliverable line must stay as it is at the lane's base and print no deliverable note; R-2730 must stay green on this repository.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: product-report.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run report`, then open the written page's `#artifacts` view and confirm it shows the flow, both lists and one card per live entry; `npm run test:locked`.

Seat check: `node docs/reviews/artifact-flow-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the four rows and their tests exist and pass, the page's Artifacts view and feature details show what the must-meet says, the tree check prints the same count line and no note, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; on this repository's page, the counts of capability-pair headings, flow lines, items in each list and entry cards; the count line; the full suite's summary line; map, readme, trace, tree, report and seat-check status; any departure from the must-meet, with its reason.
