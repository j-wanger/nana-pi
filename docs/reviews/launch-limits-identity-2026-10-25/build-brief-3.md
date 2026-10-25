Feature: FEAT-013 · Install and connect harness runtimes. Lane launch-limits-identity. Class: ordinary. Builder: pi-worker (small lane). Build session 3.

Work in the lane worktree on feat/launch-limits-identity, on top of the commit that adds this brief. Sessions 1 and 2 built the lane, and it works. Session 1 put rows R-2890 to R-2895 in FEAT-031's table, but the plan of record (`must-meet.md`, its Feature line and its "Must-meet rows (FEAT-013 …)" heading) places them in FEAT-013, beside R-2023, the check they judge. Session 1's report did not name this departure. This session moves the six rows only. Do not edit any row's text, any test, any code, HANDOFF, docs/sessions/, docs/known-bugs/, or any file in a review folder.

Precedent:
- REQUIREMENTS.md — FEAT-013's row table, which holds R-2023 and R-2300.
- scripts/requirements-tree.mjs — the tree check and `npm run req:tree`, which regenerates docs/requirements-tree.md.

No private helper moves to a shared module.

The task:
1. Move rows R-2890 to R-2895, unchanged and in ID order, from FEAT-031's table to the end of FEAT-013's row table.
2. Regenerate docs/requirements-tree.md with `npm run req:tree`, and docs/code-map.md with `npm run map` if map:check asks.
3. Confirm `node scripts/requirements-moved.mjs --root . --base main` lists the six rows under FEAT-013.

Checks before your commit: pi-launch-limits.test.mjs alone; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing. Do not run the install check; the seat runs it.

Seat check: `node docs/reviews/launch-limits-identity-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: the six rows sit in FEAT-013 with their text unchanged; the movement report lists them there; the full suite is green; `git status --short` is empty; and the work is committed.

Report (at most 6 lines after the VERDICT line): the commit sha; `git show --stat HEAD`'s file lines; the movement report's FEAT-013 lines; the full suite's summary line; map, readme, trace, tree and seat-check status.
