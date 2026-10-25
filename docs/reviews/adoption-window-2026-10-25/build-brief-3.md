Feature: FEAT-014 · Create or adopt a project workspace. Lane adoption-window. Class: hook. Builder: pi-worker (small lane). Build session 3.

Work in the lane worktree on feat/adoption-window, on top of the commit that adds this brief. Session 2 finished the lane (f3927f37), and it works; the independent check found nothing material. The seat's pairs (`seat-mutate.mjs`) found one must-meet red case the tests cannot catch. This session changes tests only: do not edit packages/nana-pack/lib/adoption.mjs, packages/nana-pack/lib/adoption-config.mjs, packages/nana-pack/bin/nana-adoption.mjs, REQUIREMENTS.md rows' text, HANDOFF, docs/sessions/, docs/known-bugs/, or any file in a review folder.

Precedent:
- packages/nana-pack/tests/adoption-reader.test.mjs — session 2's R-2852 journal and its linear fixture builder.
- docs/reviews/adoption-window-2026-10-25/seat-mutate.mjs — the seat's pairs; read pair 18's edit there.

No private helper moves to a shared module.

The task:
1. Pair 18 (R-2852, "whatever undated lines come before that line in the read"): the R-2852 journal holds only non-JSON undated lines. Add JSON lines with no `ts`, such as `{"event":"handoff_missing"}`, before the 8-day line, beside the non-JSON line the must-meet names. Keep the journal over the cap and keep the fixture's geometry assertion. Build it in linear time.

After your commit, run `SEAT_MUTATE_TIP=HEAD node docs/reviews/adoption-window-2026-10-25/seat-mutate.mjs 18` with SEAT_MUTATE_OUT unset (console only); it must report 1/1 red with R-2852 red. Then run it with no pair numbers; it must report 22/22 red. Amend your commit only if a pair still survives, then run both again. Do not commit any file it leaves.

Checks before your commit: adoption-reader.test.mjs alone, with its time; adoption-producer.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing. Do not run the install check; the seat runs it.

Seat check: `node docs/reviews/adoption-window-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: all 22 pairs are red, only the test file changed, the full suite is green, `git status --short` is empty, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; both pair runs' RESULT lines; the reader test's time; the full suite's summary line; map, readme, trace, tree and seat-check status.
