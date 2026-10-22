Feature: FEAT-039 · See the product and its decisions in one report. Lane report-deliverables, row R-2544. Class: ordinary. Builder: pi-worker (small lane). Build session 3: two test gaps the seat's pairs found at 2e8da63e. No product code changes unless a new case shows a real defect.

Work in ~/nana-pi-wt/report-deliverables on feat/report-deliverables. Read `docs/reviews/report-deliverables-2026-10-22/must-meet.md` (R-2544's row and test cases, D2) and the seat's pairs `seat-mutate.mjs` with their output `seat-mutate-output-2e8da63e.txt`: 15 of 16 red. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, packages/nana-pack/rules/ or docs/reviews/. No push.

Findings:
- **F1 — rounded days survive (p4).** R-2544 says whole days, so a change 36 hours before HEAD reads "1 day". No case has a fraction of a day of at least one half, so `Math.round` in place of `Math.floor` passes every check. Add one case to R-2544's check: a change 36 hours before HEAD (both committer times set, same zone) shows "1 day".
- **F2 — a refusing walk crashes the test file instead of failing R-2544 (p14).** When the report throws on a walk failure, `renderedProduct` throws out of the R-2544 case, so the file stops and later checks never run. Make the walk-failure case catch a refusal from the report and record it as a failure of R-2544, so a page that refuses fails that check by name.

Steps:
1. Both changes in `packages/nana-pack/tests/product-report.test.mjs`, inside R-2544's existing check; its title and `// req:` marker stay.
2. Run the changed test file, then `npm run test:locked` before your commit. Apply each wrong version, see R-2544 go red by name with the file completing, then restore: `Math.round` in place of `Math.floor` in the day count; a walk failure that throws. Commit with explicit paths.

Seat check: `node docs/reviews/report-deliverables-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- Both wrong versions turn R-2544 red by name, and the test file runs to its end under each.
- The full suite is green; the seat check prints `0 missing`; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the two wrong versions and their results; the full suite's summary line; seat-check status.
