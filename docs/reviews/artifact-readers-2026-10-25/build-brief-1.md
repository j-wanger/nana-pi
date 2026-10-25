Feature: FEAT-028 · Maintain requirement identity and trace links. Lane artifact-readers. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/artifact-readers, based on main at 61671be0. The spec is `docs/reviews/artifact-readers-2026-10-25/must-meet.md`; read it whole. `plan-draft.md` and `plan-attack.md` beside it are its inputs; where they differ, the must-meet holds. Do not edit HANDOFF.md, `docs/sessions/`, `docs/known-bugs/`, `scripts/product-report.mjs`, `docs/product-report/`, any file in a review folder, any file under `apps/` or `packages/nana-setup/` (the migration names readers there; it changes none), or any file under `templates/` except `templates/_shared/requirements-organization.md`. Add no new module and no new import to `scripts/deliverables.mjs`: the copied-CLI fixtures copy a fixed list of files.

Precedent:
- scripts/deliverables.mjs:205-247 — `artifactReads`, with `ownFieldLines` (:80-96) and `PART_SEPARATOR` (:33): feature-span line parse, own-span scan and tracked-path notes.
- scripts/deliverables.mjs:360-391 — the deliverable park block, with `PARKED_DATE` (:72), `PARKED_LABEL` and `PARKED_SINCE` (:21-23): extract `parkClaim(body)` from it inside this module and call it from both park forms.
- scripts/deliverables.mjs:456-474 — the deliverable Read by checks, with `READER_KINDS` and `REASON_REQUIRED` (:27-29): extract `readerClaim(text)` from it inside this module and call it from both Read by forms; deliverable notes stay byte for byte.
- scripts/deliverables.mjs:272-295 — `deliverableClaims`, `registryReference` (:265-270), `deliverableCodeState` (:298) and `MAKER_RUNS` (:25): the inputs `artifactConsumers` joins.
- scripts/product-report.mjs:817-831 — the page's own reference join, read only, as the shape `artifactConsumers` matches.
- scripts/requirements-tree.mjs:614-621 — `printDeliverableReport` and its field-line gate; scripts/deliverables.mjs:519-534 holds the `artifactsRequireTracked` HEAD read; the new lines join both (R-2830's last clauses).
- apps/bench/lib/checkers.mjs:89-97 — `globMatch`, already imported at scripts/deliverables.mjs:15, applied to the last path segment for R-2833.
- scripts/requirements-moved.mjs:229-239 — the read-change loop, and its registry and reads calls at :148-153, for R-2837.
- packages/nana-pack/tests/requirements-deliverables.test.mjs — `tree` and `registryTree` (:53, :55), the R-2795 and R-2798 checks (:228, :267), R-2537's pinned lists (:381-382), R-2640's cases (:390-442) and the R-2730 repository run (:529-548).
- packages/nana-pack/tests/requirements-moved.test.mjs:349-365 — R-2797's fixture and check, the form for R-2837.
- packages/nana-pack/tests/requirements-cap-kinds.test.mjs:111-114 — R-2787's lift fixture.
- packages/nana-pack/tests/requirements-tree.test.mjs:464-501 — R-2538's CLI fixtures and the copied-script lists that a new import would break.
- REQUIREMENTS.md:2190 — R-1239's park, the wording form for the two artifact parks.
- packages/nana-pack/skills/requirements/SKILL.md:127 — the skill's ledger paragraph, where the one new sentence goes.

No private helper moves to a shared module. `readerClaim` and `parkClaim` are in-module extractions; name them in your report.

The task:
1. Rows R-2830 to R-2834 and R-2837 under FEAT-028, worded as in the must-meet, `implemented` once their tests pass, and the seal test. R-2835 and R-2836 stay unused. R-2787's wording, fixture and test title as the must-meet says.
2. In `scripts/deliverables.mjs`: `readerClaim` and `parkClaim`; artifact `Read by:` and `Parked:` lines in feature spans; the `runtime` kind on both Read by forms; the test-reader note on every reader form; `artifactConsumers` exported with the coverage note; `TEST_READER_GLOB` and the coverage note text beside `MAKER_RUNS` with their provenance comments, and `runtime` appended to `READER_KINDS` and `REASON_REQUIRED`. `artifactRegistry` and `artifactReads` keep their notes byte for byte. Widen the module header's purpose sentence to name the new lines, still one sentence.
3. In `scripts/requirements-moved.mjs`: one artifacts-section line per added, removed or changed feature-span `Read by:` or `Parked:` line, read through the deliverables export.
4. The migration in REQUIREMENTS.md, exactly as the must-meet's Migration section lists it, verifying each reader at the code before writing it. Spans: FEAT-001, FEAT-003, FEAT-007, FEAT-008, FEAT-013, FEAT-014, FEAT-016, FEAT-017, FEAT-018, FEAT-026, FEAT-027, FEAT-028, FEAT-031, FEAT-032, FEAT-033, FEAT-034, FEAT-036, FEAT-037, FEAT-038 and FEAT-039, and the capability spans holding R-437 (CAP-06), R-291 (CAP-07) and R-536 (CAP-08). A-057's park goes in FEAT-007, where A-057 is registered.
5. The prose: REQUIREMENTS.md lines 27, 28 and 46, `templates/_shared/requirements-organization.md` lines 8 and 20, and one sentence in the requirements skill, saying what the must-meet's prose bullet says, including "a currency or presence check is not a reader".
6. The existing-test changes the must-meet expects, and no others; name each in your report. Loosen no assertion.
7. `npm run req:tree` and `npm run map` regenerated.

Test literals: write fixture ledgers as joined arrays of lines or with real line breaks in template literals; keep every existing escape sequence in existing test files exactly as it is.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: each touched test file alone with node, at least requirements-deliverables.test.mjs, requirements-moved.test.mjs, requirements-cap-kinds.test.mjs, requirements-tree.test.mjs, product-report.test.mjs and templates-render.test.mjs; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`, and confirm it prints `deliverables: 20 of 23 made and read by code, 19 parked` and no `deliverable note:` line; `node scripts/requirements-moved.mjs --root . --base main`, and confirm its artifacts section lists the 19 artifact `Read by:` lines and the 2 parks; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/artifact-readers-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: the six rows, their tests and the seal exist and pass; every live artifact entry in this repository has a declared reader or a park and the tree check prints no note; the movement report lists the new lines; the map, readme, trace and tree checks are green; the full suite is green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; the tree check's count line; the movement report's artifacts-section line count; each existing-test change; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the must-meet, with its reason.
