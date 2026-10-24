Feature: FEAT-008 · Integrate and clean up reviewed changes. Lane land-records. Class: land tool. Builder: pi-worker (small lane). Build session 2.

Work in the lane worktree on feat/land-records, on top of d54146cb. Session 1 built the lane and passed the seat's checks. It also committed its own suite log, `docs/land-records-test-locked.txt`, which is not part of the change. Fix only that.

Precedent:
- docs/reviews/land-records-2026-10-24/build-brief-1.md — session 1's brief; its checks list stands.

No private helper moves to a shared module.

The task:
1. Remove `docs/land-records-test-locked.txt` from the branch with `git rm`.
2. Change nothing else.
3. When you run the full suite, send its output to a file outside the worktree, or to the terminal only.

Checks before your one commit: `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/land-records-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: the log file is gone from the branch, nothing else changed, the full suite is green, `git status --short` is empty, and the work is committed.

Report (at most 5 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file line; the full suite's summary line; map, readme, trace, tree and seat-check status.
