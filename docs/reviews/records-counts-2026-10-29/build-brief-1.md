Feature: FEAT-039 · See the product and its decisions in one report

Lane records-counts. Class: ordinary (`node scripts/lane-class.mjs` prints `ordinary` on the planned files). Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/records-counts, based on main after page-needs-you landed. The plan of record is `docs/reviews/records-counts-2026-10-29/plan.md`. Read it whole, and read `plan-attack.md` beside it; the plan already takes every attack point. The plan has no list of allowed edits. Another lane, ask-stakes, edits the ask rendering in `scripts/product-report.mjs` at the same time; keep to the Records summary and the Broken section's no-run label.

What the lane does, in one sentence: the product page's closed Records summary shows violated, failed, skipped and unmeasured counts from the report model, or says "no recorded run" when there is no runtime data.

Build every must-meet in the plan, rows R-3080 to R-3082, and the known-bug lines the plan names. The plan has no questions for the owner.

Numbers that must not move: the Overview order; Records stays closed; the counts already printed inside the Broken section.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background.

## Done when

Each row is `implemented` with backticked `file::title` evidence. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each must-meet's test title; the Records summary as this clone's built page shows it; each departure from the Precedent below; every existing test you changed.

## Precedent

- `scripts/product-report.mjs` (`overviewLines`, the Broken block): the same variables and the `runtimeData ? … : runtimeMissing` branch the summary copies.
- `scripts/product-report.mjs` (`model.askLabels`): labels carried in the model because `renderInto` runs through `String()`.
- `scripts/product-report.mjs` (the Records `details`/`summary` render): the line this lane changes; `firstLineCount` is deleted.
- `packages/nana-pack/tests/product-overview.test.mjs` (R-2922 check): the fixture with one violated row, a FAIL file, a SKIP-only file and an unrecorded file; the new runtime-case test reuses it.
- `packages/nana-pack/tests/product-overview.test.mjs` (R-3050 check): the fixture with no runtime data; its summary assertion changes to the no-run form.
- `REQUIREMENTS.md` R-3050: page-needs-you build 3 edited this row in place for the summary words; this lane edits it again to point at the new rows.


