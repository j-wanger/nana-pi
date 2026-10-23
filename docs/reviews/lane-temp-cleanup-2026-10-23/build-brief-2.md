Feature: FEAT-006 · Launch builders with execution limits. Lane lane-temp-cleanup. Class: gate (on the owner's word). Builder: pi-worker (small lane). Build session 2: one seat finding.

Work in the lane worktree on feat/lane-temp-cleanup. Build 1 (e5bf20ed) is accepted except for one finding.

F1. Build 1 committed `docs/lane-temp-cleanup-suite.txt`, a 230-line copy of the full suite's output. No brief asked for it, nothing reads it, and the code map and docs do not list it. Remove it with `git rm docs/lane-temp-cleanup-suite.txt`. Change nothing else.

Precedent:
- docs/reviews/lane-temp-cleanup-2026-10-23/build-brief-1.md — the lane's spec and its file list; build 1's other files stay as they are.

Steps:
1. `git rm docs/lane-temp-cleanup-suite.txt`.
2. Checks before your one commit: `npm run map:check`; `npm run readme:check`; `node docs/reviews/lane-temp-cleanup-2026-10-23/seat-titles.mjs all` prints `0 missing`.

Done: the file is gone, the three checks pass, and the removal is committed. Do not run the full suite.

Report (at most 4 lines after the VERDICT line): the commit sha and the three checks' results.
