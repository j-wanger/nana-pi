Feature: FEAT-002 · Resume decisions and next actions

Lane issue-watch. Class: hook. Builder: pi-worker (larger lane). Build session 3.

Work in the lane worktree on feat/issue-watch at 9c9980f4. Read `review-r1.md` (final reviewer: SEND-BACK) and `land-r1.md` (land reviewer: LAND, same finding as a SHOULD) beside this brief. Fix these three. Do not edit `docs/known-bugs/`, `HANDOFF.md` or the session archive.

1. **The cursor never moves back in time.** Each run's cursor, and the `--since` its restart line prints, stays at or above the run's starting floor, whatever the creation time of an edited old comment GitHub returns. Pin it with the reviewer's chain: three bounded runs; the owner edits a day-old comment during run 1; no run prints that comment or any comment created before the first run began.
2. **No owner comment lost in pi.** A comment is marked delivered only after `pi.sendMessage` succeeds. When it throws, the comment stays undelivered for the next poll, and the extension shows one notice. Pin both.
3. **The over-cap block keeps its notice.** When the session-start block is over its cap, it prints the "frontier block omitted" notice as before, then the watch line. Pin it.

Run the locked full suite as a plain foreground command with its output on screen, not redirected to a file and not in the background. Another lane's suite may hold the machine-wide lock; waiting for it is expected.

## Done when

Rows R-2990 to R-2999 and R-682 stay `implemented`. The locked full suite (`npm run test:locked`), `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: each fix and its test; proof each test fails on build 2's code; every existing test you changed.

## Precedent

- `packages/nana-pack/lib/issue-watch.mjs`: the watch, its floor and cursor.
- `packages/nana-pack/extensions/nana-frontier-summary.ts`: the pi delivery.
- `packages/nana-pack/lib/frontier-summary.mjs`: the over-cap path and its notice on main.
- `packages/nana-pack/tests/issue-watch.test.mjs`: the restart and drift tests.
