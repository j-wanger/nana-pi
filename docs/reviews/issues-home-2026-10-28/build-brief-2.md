Feature: FEAT-002 · Resume decisions and next actions

Lane issues-home. Class: install, hook or gate. Builder: pi-worker (larger lane). Build session 2.

Build 1 stopped BLOCKED, correctly: moving `ghResult` needs the private helper `firstLine`, and brief 1 did not name that move. Its work is uncommitted in this worktree: REQUIREMENTS.md rows R-2970 to R-2979 as `planned`, a partial `packages/nana-pack/lib/gh-runner.mjs`, `packages/nana-pack/tests/handoff-issues.test.mjs`, edits to nana-land, both ci-records files, the identity-scan and hook-deadlines tests, and `docs/reviews/issues-home-2026-10-28/wrong-code.txt`. Read them, check them against the plan, and finish the lane from there.

## Named moves (the 2026-10-22 second-caller ruling)

- `firstLine` moves from `packages/nana-pack/lib/ci-records.mjs:29` into `packages/nana-pack/lib/gh-runner.mjs` as a named export. `ci-records.mjs` imports it from there and keeps no copy; gh-runner holds the only definition.
- `ghResult` lives at `packages/nana-pack/lib/ci-records.mjs:44-57`, not in `scripts/ci-records.mjs` as the plan says. It moves into gh-runner.mjs from there, and `ghJson` imports it back.
- `ghFromEnvironment` (`scripts/ci-records.mjs:19-35`) moves into gh-runner.mjs. It fixes `timeout: CI_READ_TIMEOUT_MS` in its spawn today; after the move the caller passes the timeout, because gh-runner takes no default. ci-records passes `CI_READ_TIMEOUT_MS`, so its behaviour holds.
- If another private helper turns out to block a move, move it the same way, import it back, and name it in your report.

Everything else stands as build brief 1 says: the plan of record, must-meet 1 to 9, the three sealed tunables and their values, the done-when checks and the report. Run the locked full suite as a plain foreground command with its output on screen, and run the local install check once before your report.

## Precedent

- `packages/nana-pack/lib/ci-records.mjs:29-57`: `firstLine` and `ghResult`, the code that moves.
- `scripts/ci-records.mjs:19-35`: `ghFromEnvironment`, the command seam that moves.
- `packages/nana-pack/bin/nana-land.mjs:30-46`: `ghEnvironment` and `ghDefault`, which move and are re-exported from nana-land.
- `packages/nana-pack/lib/frontier-summary.mjs:42-101`: the frontier block the issue read joins.
- `packages/nana-setup/lib/hook-producer.mjs:23-62`: the launcher that appends `--limit-ms`.
- `packages/nana-setup/tests/hook-deadlines.test.mjs`: R-2672's late-start preload for the end-to-end test.
