# records-counts plan · 2026-10-29

Revised after plan-attack.md: 1 MUST, 3 SHOULD, 5 NOTE taken.

Lane class: `node scripts/lane-class.mjs --root . --files scripts/product-report.mjs,packages/nana-pack/tests/product-overview.test.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-039.md` printed `ordinary`.

## Purpose

The owner, 2026-10-29, on the outside reader's finding: "no add them, we can subtract later if they are not useful". The finding asked to "Keep Records collapsed, but include separate failed, skipped and unmeasured counts in its summary."

That is the agreed reading. The closed Records section on the Overview labels its first count `violated` (it counts violated rows only, so `Broken` read as a total of the new counts), then adds three counts: failed, skipped and unmeasured. Gaps and Stale stay. When the clone has no recorded run, the summary says so instead of showing zeros. Records stays closed.

## Assumptions

- A1. Each new count is the number the Broken block already prints, from the same variables in `buildReport` (`scripts/product-report.mjs`, the `overviewLines` block):
  - violated = `violated.length`: rows whose ledger status is `violated` (today 5). The summary says `violated`, not `Broken` (attack M1): Broken is the block holding all four counts.
  - failed = `failed`: implemented rows that did not pass where some cited file's last recorded label is FAIL (today 0).
  - skipped = `notPassed.length - failed`: implemented rows that did not pass with no FAIL, so every cited file was recorded and none passed (the block's "skipped only"; today 6).
  - unmeasured = `noRun`: implemented rows that cite test files, none of which has a recorded run (today 1). The block's label becomes `implemented rows with no recorded run (unmeasured)` so one thing has one name (attack S3); the R-2922 test imports the label, so no literal breaks.
  - Gaps = `deliverableGaps.length` (today 0); Stale = `outdated.length` (today 34). Both unchanged.
  The run data is the clone's runtime-map file, loaded through `loadRuntime(dataPath(root, …))`; `runStateOf(file)` returns its label per cited file.
- A2. With no runtime data (`runtimeData` is null: missing, unreadable or wrong-schema file), failed and skipped cannot be counted, and unmeasured would just count every implemented row with a cited file. The summary then shows `no recorded run` in place of all three, matching the Broken block's own line (`Did not pass …: no recorded run: <reason>`). The reason stays in the block, not the summary.
- A3. The summary's row counts are lower case: `violated`, `failed`, `skipped`, `unmeasured` (the reader's three words plus the ledger status). Gaps and Stale keep their capitals as block names.
- A4. `buildReport` composes the whole summary string and puts it in the model; `renderInto` prints it verbatim. `renderInto` runs through `String()`, so it cannot read module constants; this follows the same reason `model.askLabels` exists. The render no longer reads any block's first-line text, which fixes the page-needs-you known bug where a renamed first-line label silently showed 0.
- A5. With no deliverable lines, Gaps still shows 0 (as today, from an empty `deliverableGaps`). That is the same zero-means-no-data problem the reader named, but it is not in the request. The builder adds one known-bug line for it in `docs/known-bugs/FEAT-039.md`.
- A6. An implemented row that cites no test file is in none of the three new counts, as in the Broken block today. No such row exists in this ledger; the existing known bug on projects with no runtime data covers the Python and hand-tested case (attack N3).
- A7. A violated row whose cited test fails counts under violated only, never failed. Today's five violated rows cite no tests, so it does not arise now.
- A8. Today's numbers come from this clone's runtime data, measured at 46147d50. A clone or Pages build with no runtime data shows the no-run form.

## Open choices

- O1. The builder names the model field (for example `model.recordsSummary`) and the new label keys in `OVERVIEW_LABELS` (for example `skipped`, `unmeasured`, `noRecordedRun`).
- O2. The builder chooses how the R-3082 test reaches `renderInto` with a hand-made model: through the existing `renderHtmlAt` fixture path, or a direct call with the fixtures' document stub.

## Residuals and known bugs for the builder

- S2: the builder extends the FEAT-039 known-bug line "Not-passed list (report-not-passed): a row citing a skipped file beside a file with no recorded run is left out" to say the Records summary's failed, skipped and unmeasured counts also leave that row out. No such row exists today; no code change.
- A5: the builder adds one FEAT-039 known-bug line: with no deliverable lines, the Records summary still shows `Gaps 0`.
- N1 (residual): the summary carries no run age; `failed 0` from an old or changed run reads as current. The age stays in the Broken block, one click away. R-3080's row text says so.
- N2 (residual): counts are rows, not checks; a row citing a PASS file and a SKIP file counts as passed, so `skipped` undercounts. The legend and an existing known bug already say this.
- N4 (residual, not taken): `violated 5 · no recorded run` keeps the no-run words after a separator, as the block does. The M1 relabel removes most of the misreading; the seat may reword later.
- N5 (residual): R-3082 proves the render does not parse block text, not that the summary matches the block. That match rests on R-3080 using the same variables in one fixture.

## Questions for the owner

None.

## Feature

Feature: FEAT-039 · See the product and its decisions in one report

## Threat model

Honest variation in our own tools' output is in scope: a missing, unreadable or partial runtime-map file, rows with no cited test, a relabelled Overview line. Deliberate forgery of the runtime data or the ledger is out.

## Precedent

- `scripts/product-report.mjs` (`overviewLines`, the Broken block): the same variables and the `runtimeData ? … : runtimeMissing` branch the summary copies.
- `scripts/product-report.mjs` (`model.askLabels`): labels carried in the model because `renderInto` runs through `String()`.
- `scripts/product-report.mjs` (the Records `details`/`summary` render): the line this lane changes; `firstLineCount` is deleted.
- `packages/nana-pack/tests/product-overview.test.mjs` (R-2922 check): the fixture with one violated row, a FAIL file, a SKIP-only file and an unrecorded file; the new runtime-case test reuses it.
- `packages/nana-pack/tests/product-overview.test.mjs` (R-3050 check): the fixture with no runtime data; its summary assertion changes to the no-run form.
- `REQUIREMENTS.md` R-3050: page-needs-you build 3 edited this row in place for the summary words; this lane edits it again to point at the new rows.
- Map search ("product report overview records summary", "runtime data last measured run labels") named `scripts/product-report.mjs`, `scripts/test-locked.mjs`, `scripts/runtime-measure.mjs` and `packages/nana-pack/lib/runtime-map.mjs`. Only the report changes; the runtime writers stay as they are.

Forecast of literals this breaks (`grep -rn "Records: Broken"` outside review folders): the R-3050 test assertion and the R-3050 row. `docs/sessions/2026-10.md` quotes the old summary as history and stays.

## Outside precedent

- Node.js test runner (`node:test`, MIT): borrow. Its run summary prints pass, fail and skipped as separate counts on adjacent lines, so a skip never reads as a pass. No code is adopted.

## Must-meet

- **R-3080 · runtime case.** On the R-2922 fixture shape (one violated row, one implemented row citing a FAIL file, one citing a SKIP-only file, one citing an unrecorded file) plus one deliverables line, `Deliverables: R-001` with `code("R-001")` as in the R-3050 fixture so Gaps is a real count (attack S1), the closed section summary reads exactly `Records: violated 1 · failed 1 · skipped 1 · unmeasured 1 · Gaps 0 · Stale 0`, and the `details` has no `open` attribute. The builder confirms the fixture's real Gaps and Stale counts and pins what it yields, and the test also asserts the Gaps block's first line is a count, not `no deliverable lines`. The row text says the run's age stays in the Broken block (N1). Proves the three counts are separate and match the Broken block.
- **R-3081 · no-run case.** With no runtime data (the R-3050 fixture), the summary reads exactly `Records: violated 0 · no recorded run · Gaps 0 · Stale 0`, and holds none of `failed`, `skipped` or `unmeasured`. Proves no run never shows as zeros.
- **R-3082 · counts from the model.** `renderInto` given a model whose Broken block's first line is relabelled (for example `Renamed: 9`) still prints the model's summary string unchanged. Proves the summary no longer reads block text, closing the renamed-label known bug.

R-3050's row text changes from "summary reads `Records: Broken <b> · Gaps <g> · Stale <s>` with counts from the first lines of those blocks" to a summary "as R-3080 and R-3081 define"; its test's summary assertion becomes the R-3081 words. R-2922's row and test keep their wording; the block's no-run label gains `(unmeasured)` through the imported label. Expected changes to other tests are a forecast only.

Today's page in this clone would read `Records: violated 5 · failed 0 · skipped 6 · unmeasured 1 · Gaps 0 · Stale 34`. With no runtime data (Pages) it reads `Records: violated 5 · no recorded run · Gaps 0 · Stale 34`.

The ask-stakes lane also edits `scripts/product-report.mjs`, but only the ask rendering. This lane touches only the Records summary, its model field, its labels and the block's no-run label.
