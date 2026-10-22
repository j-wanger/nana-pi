Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane suite-records, rows R-2546 to R-2555. Class: ordinary. Builder: pi-worker (larger lane). Build session 3 of 3: a passing land's rerun files in the record lines, and two test gaps the seat's pairs found.

Work in ~/nana-pi-wt/suite-records on feat/suite-records (tip after this brief's commit). The plan of record is `docs/reviews/suite-records-2026-10-22/must-meet.md`, including its amendment after build 2. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, packages/nana-pack/rules/ or docs/reviews/. No push.

The seat checked build 2 at 01f5aabe: the seat check prints `0 missing`; your full run's two record lines read right; the seat's pairs are 12 of 14 red (`docs/reviews/suite-records-2026-10-22/seat-mutate.mjs`).

- **F1 (MUST) — a land that passed through the rerun prints a failure.** The record of a land whose coverage run failed a file that then passed alone holds that file twice (coverage FAIL, plain PASS), as D8 asks. `suiteRecordLines` counts the FAIL entry, so the land prints "N PASS, 1 FAIL; failed: <file> [new; exit 1]" although it passed, and `slowerText` can name the file twice. Fix: the last line restates the counts of the run's final result (a rerun file counts by its plain label), lists only files that failed in the final result, and names once each file that failed under coverage and passed when rerun alone, with a declared string such as "passed only without coverage: <file>"; the slower list reads one entry per file (the plain one for a rerun file). R-2554's text changes to the amendment's. Add a case to R-2554's check: a land through the rerun whose file passed alone prints "0 FAIL", "failed: none" and the file once under the new string; one whose file failed again prints it as failed with its plain cause.
- **F2 — R-2549 cannot see a dirty baseline.** Add a case: the only record at the merge base is dirty, and a clean one sits at its parent; the parent must be the baseline. With `dirty === 0` dropped from the filter, R-2549 must go red.
- **F3 — R-2548 cannot see a store after a stop during the rerun.** Add a case: a land whose coverage run fails one file, stopped during the plain rerun of that file; no record is stored. With `!stopping` dropped from `finishRecord`, R-2548 must go red.

1. Fix F1 and add the F2 and F3 cases.
2. Run the changed test files plainly and with the coverage knob set through the runner, `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your last commit; copy its last two output lines into your report. Run `SEAT_MUTATE_OUT=<scratch file> node docs/reviews/suite-records-2026-10-22/seat-mutate.mjs` (do not commit its output) and report its RESULT line; s2 and s10 must now go red, and fix any anchor the change moved by saying which pair and why. Commit with explicit paths.

Seat check: `node docs/reviews/suite-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- A passing land's rerun file reads as passed only without coverage, never as a failure, and appears once in each line; R-2549 and R-2548 catch a dirty baseline and a store after a stop during the rerun.
- The changed tests pass plainly and under coverage; map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 10 lines after the VERDICT line): the commit shas; the check results plainly and under coverage; the pairs' RESULT line; the full suite's summary line and its two record lines; map, readme, trace and seat-check status.
