Feature: FEAT-013 · Install and connect harness runtimes. Lane launch-limits-identity. Class: ordinary. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/launch-limits-identity, on top of the commit that adds this brief. Session 1 built the lane (6ac0931a), and it works: CI passed every leg on the first attempt, Windows included, and the local install check passed 18 of 18. The seat's pairs (`seat-mutate.mjs`) found one case where the test file crashes instead of failing its row. This session changes the test file only. Do not edit REQUIREMENTS.md rows' text, packages/nana-setup/lib/, HANDOFF, docs/sessions/, docs/known-bugs/, or any file in a review folder.

Precedent:
- packages/nana-setup/tests/pi-launch-limits.test.mjs — session 1's R-2890 bystander case near line 335 and its `answered` promise.
- docs/reviews/launch-limits-identity-2026-10-25/seat-mutate.mjs — the seat's pairs; read pairs 1 and 13 there.

No private helper moves to a shared module.

The task:
1. Pair 13 (R-2890 and R-2893, "the judge signals a process it cannot confirm"): when the judge kills the bystander, `bystander.send("ping")` throws EPIPE, and the bystander has no `error` listener, so the whole file dies at R-2890. Give the bystander an `error` listener, and treat a failed send, an error, or an exit before the pong as "not answered". Then R-2890 fails by name, and R-2893 and every later check still run. Pair 1 can hit the same crash; the same change covers it.
2. Keep the answer wait bounded by a named limit, so a lost reply cannot hang the file.

After your commit, run `SEAT_MUTATE_TIP=HEAD node docs/reviews/launch-limits-identity-2026-10-25/seat-mutate.mjs 1 13` with SEAT_MUTATE_OUT unset (console only); each must turn its named rows red with no crash. Then run it with no pair numbers; every pair must be red. Amend your commit only if a pair still survives or crashes, then run both again. Do not commit any file it leaves.

Checks before your commit: pi-launch-limits.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing. Do not run the install check; the seat runs it.

Seat check: `node docs/reviews/launch-limits-identity-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: pairs 1 and 13 turn their rows red with no crash; every pair is red; only the test file changed; the full suite is green; `git status --short` is empty; and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; both pair runs' RESULT lines; the full suite's summary line; map, readme, trace, tree and seat-check status.
