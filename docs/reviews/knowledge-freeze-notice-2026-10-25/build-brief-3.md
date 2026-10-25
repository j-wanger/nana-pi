Feature: FEAT-003 · Index and connect existing knowledge sources. Lane knowledge-freeze-notice. Class: hook. Builder: pi-worker (small lane). Build session 3.

Work in the lane worktree on feat/knowledge-freeze-notice, on top of the commit that adds this brief. Session 2 closed the pairs' test gaps (1a9d7692; 40 of 40 red). CI at session 1's tip failed R-2862 on the Windows suite leg only. This session changes the doctor test only. Do not edit product code, REQUIREMENTS.md rows' text, HANDOFF, docs/sessions/, docs/known-bugs/, or any file in a review folder.

The cause (read from the code, not yet run on Windows): R-2862's fixture file quotes the path `C:\Users\x\docs`, and the check asserts the doctor detail does not hold `C:\Users`, to prove doctor does not echo file text. On Windows the detail starts with the real sources.json path under the temp folder, which is itself under `C:\Users`, so the check fails for a reason that has nothing to do with echoed file text.

Precedent:
- packages/nana-setup/tests/doctor-knowledge.test.mjs — the R-2862 fixture `f1` and its compound check.
- packages/nana-setup/tests/restore.test.mjs — a check that passes a detail string as its third argument, as the R-958 check does.

No private helper moves to a shared module.

The task:
1. Make the quoted fixture path a sentinel no real path can hold, such as `C:\nana-fixture-only\docs`, and assert the detail lacks that sentinel. Keep the escape sequences in the test literal intact.
2. Give the R-2862 check a detail argument that names which part failed, so a future Windows failure says why.

After your commit, run `SEAT_MUTATE_TIP=HEAD node docs/reviews/knowledge-freeze-notice-2026-10-25/seat-mutate.mjs` with SEAT_MUTATE_OUT unset (console only); every pair must still be red. Do not commit any file it leaves.

Checks before your commit: doctor-knowledge.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing. Do not run the install check; the seat runs it.

Seat check: `node docs/reviews/knowledge-freeze-notice-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: R-2862's check uses a sentinel path and names the failing part; every pair is red; only the doctor test changed; the full suite is green; `git status --short` is empty; and the work is committed.

Report (at most 6 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; the pair run's RESULT line; the full suite's summary line; map, readme, trace, tree and seat-check status.
