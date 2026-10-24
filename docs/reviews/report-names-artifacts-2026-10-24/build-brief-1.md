Feature: FEAT-039 · See the product and its decisions in one report. Lane report-names-artifacts. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/report-names-artifacts. The spec is `docs/reviews/report-names-artifacts-2026-10-24/must-meet.md`; read it whole. `plan-attack.md` beside it is its input; where they differ, the must-meet holds. Lane 1's plan and attacks are in `docs/reviews/artifact-registry-2026-10-24/`, for background only. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in either review folder.

Precedent:
- scripts/product-report.mjs — `artifactAges`, `STORE_READERS_BY_WRITER`, `recordStoreEntries`, the deliverable card rendering, `artifactNote` in `buildReport`, and `NO_ARTIFACT_NAMED`; new line text is built into the model in `buildReport` the way `artifactNote` is, and `renderInto` reads no module constant.
- scripts/deliverables.mjs — `deliverableClaims`, `resolvedArtifact` and `REGISTRY_STORE_NAMES` (the lane-1 shim to remove), `MACHINE_LOCAL_ARTIFACTS` and `RUNTIME_MAP_ARTIFACT` (to replace with the age table and its one predicate), `artifactRegistry` and `registryReference`.
- apps/bench/lib/checkers.mjs — `globMatch`, imported for tracked globs, never copied.
- packages/nana-pack/tests/product-report.test.mjs — `productLedger`, `renderedClaims`, the R-2542, R-2544, R-2545, R-2744 and R-2745 checks, and the byte-identical page test (R-1012).
- packages/nana-pack/tests/requirements-deliverables.test.mjs — the temporary repository fixture, the R-2743 check, and the R-2536 and R-2783 tests.

No private helper moves to a shared module; the age table and its predicate are new exports of `scripts/deliverables.mjs`.

The task:
1. Rows R-2790 to R-2794 under FEAT-039, worded as in the must-meet, `implemented` once their tests pass. R-2743 retired with its Evidence naming R-2793. The text changes to R-2542, R-2544, R-2545, R-2744 and R-2745 the must-meet names.
2. The page changes and the checker binding the rows state: one artifact block per deliverable, ages off the claim lines, ages by class, the age table and its predicate as sealed contract values with provenance comments, the features lists on capability cards, the old store names as plain paths, the registry parsed once per ledger.
3. The existing tests the must-meet lists, changed as it says. The docs it lists. Both modules' headers.
4. Regenerate `docs/requirements-tree.md` and the code map if they change.
5. The tree check's deliverable line must stay `deliverables: 19 of 22 made and read by code, 19 parked` and print no deliverable note; R-2730 must stay green on this repository.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: product-report.test.mjs and requirements-deliverables.test.mjs, each alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run report`, then open the written page and confirm A-006, A-032 and A-033's deliverables show a record age and a home entry shows `age not measured: user-home store`; `npm run test:locked`.

Seat check: `node docs/reviews/report-names-artifacts-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the five rows and their tests exist and pass, the retired row and the changed rows read as the must-meet says, the page shows every deliverable's artifact block, the tree check prints the same count line and no note, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; how many deliverables show each of the four block kinds on this repository's page; the count line; the full suite's summary line; map, readme, trace, tree, report and seat-check status; any departure from the must-meet, with its reason.
