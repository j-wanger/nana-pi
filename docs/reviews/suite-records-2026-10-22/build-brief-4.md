Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane suite-records, row R-2548. Class: ordinary. Builder: pi-worker (small lane). Build session 4: one finding from the final review, round 1 at 18036bc6.

Work in ~/nana-pi-wt/suite-records on feat/suite-records. Read `docs/reviews/suite-records-2026-10-22/must-meet.md` (R-2548's row and test cases, D4, D8). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, packages/nana-pack/rules/ or docs/reviews/. No push.

Finding (MUST, final review round 1):
- **F1 — a stop during a land's rerun of two or more files does not stop the rerun.** Main reran every failed file in one `runCommand` call, and a stop ended it. This lane reruns each failed file in its own call (`scripts/test-locked.mjs`, the `for (const file of failed)` loop), and the loop never checks `stopping`. On SIGINT or SIGTERM during the first rerun file, the handler kills that file and its `termination` releases the machine lock; the loop then starts each remaining file outside the lock, and the run returns the signal code only at the end. The reviewer reproduced it with three coverage-only failures and SIGINT during the first rerun: the second and third files ran to the end with the lock gone. R-2548's stop-during-rerun case has one rerun file only, so it passes.

Steps:
1. In the rerun loop, stop starting files once `stopping` is set, and return `signalExitCode ?? 1` after the loop when stopping. No record is stored (R-2548 as it stands).
2. Add a case to R-2548's check in `packages/nana-pack/tests/suite-records.test.mjs`: a land whose coverage run fails two files that pass alone, stopped during the first file's plain rerun; the second file never starts, the exit code is the signal's, and no record is stored. Title and `// req:` marker stay.
3. Run the changed test file plainly and with `NANA_COVERAGE_DIR` set to a temp folder, then `npm run test:locked` before your commit. Apply the wrong version (the loop without the stop check), see R-2548 go red by name, then restore. Commit with explicit paths.

Seat check: `node docs/reviews/suite-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- A stop during any rerun file ends the land's run with the signal's code, starts no further file, and stores no record; R-2548 catches the loop without the check.
- The full suite is green; the seat check prints `0 missing`; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the wrong version and its result; the changed test file's results plain and under coverage; the full suite's summary line; seat-check status.
