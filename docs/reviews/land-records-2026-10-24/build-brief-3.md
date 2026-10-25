Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-records. Class: land tool. Builder: pi-worker (small lane). Build session 3.

Work in the lane worktree on feat/land-records, on top of 27c8877b. The spec is still `docs/reviews/land-records-2026-10-24/must-meet.md`. The seat's wrong-code pairs (`seat-mutate-c354f281.txt`) found two must-meet red cases with no test, and the independent check (`independent-check-c354f281.md`) found two notes this session closes. Fix only these four. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any review-folder file.

Precedent:
- packages/nana-pack/tests/land-records.test.mjs — the R-2812 and R-2814 checks and their fixtures, from session 1.
- packages/nana-pack/lib/record-ledger.mjs — the shared ledger helpers session 1 moved; the error-text helper joins them.
- packages/nana-pack/bin/pi-worker.mjs — `errorText`, the private helper nana-land copied.

One private helper moves: pi-worker's `errorText` moves to record-ledger.mjs as an export, and pi-worker and nana-land import it (the 2026-10-22 ruling: a helper's second caller imports it). Its output stays byte for byte as today, double error code included. lane-watcher.mjs keeps its own copy.

The task:
1. R-2812's red case "a skipped-CI land records a wait" has no case in R-2812's own test: pair 13 (a skipped-CI land recording a wait of 0) turned only R-2814 red. Add a CI-skipped land to the R-2812 test and assert its end record's `ciWaitMs` is null.
2. R-2814's "`no lane` when the attempt has none" has no case: pair 20 (printing `-` instead of `no lane`) survived. Add a land from a source tree not on `feat/<lane>` to the R-2814 test and assert its last line ends with `; no lane`.
3. nana-land's `landRecordErrorText` copies pi-worker's private `errorText`. Move `errorText` to `packages/nana-pack/lib/record-ledger.mjs` as an export, import it in pi-worker.mjs and nana-land.mjs, and delete both private copies. Every printed line stays byte for byte the same; update record-ledger.mjs's header and run `npm run map`.
4. The pack README's land paragraph says each attempt writes a start and an end record. An interrupted attempt leaves only its start, and refusals in the argument parser and a `--main` outside any repository write nothing. Replace that sentence with one that says so, keeping the `[nana-land] land record:` line in it.

Try each new case's wrong code by hand (the pair's edit), see the named check turn red, restore, and say so in your report; do not commit the wrong code.

Checks before your one commit: land-records.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/land-records-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: both cases exist and turn red on their wrong code, the helper is imported, not copied, the README sentence is true, the full suite is green, `git status --short` is empty, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; each case and its hand check; the helper move; the README sentence; the full suite's summary line; map, readme, trace, tree and seat-check status.
