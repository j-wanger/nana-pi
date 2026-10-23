Feature: FEAT-006 · Launch builders with execution limits. Lane build-records, row R-2598. Class: ordinary. Builder: pi-worker (larger lane). Build session 2: one test fix the seat's wrong-code pairs found.

Work in the lane worktree on feat/build-records. Build 1 is fa4a2406 and 7804e7ed. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-pack/tests/build-records.test.mjs — R-2598's library cases (about :222-240): `ignoresLargeReview` with `sessionReadMaxBytes: 512`, and `tiny` with 64.
- packages/nana-pack/lib/build-records.mjs — `collectBuildUsage`, whose head read and whole read the cases pin.
- packages/nana-pack/lib/mutation-runner.mjs — `baseChildEnv` and the per-file HOME, TMPDIR, TEMP and TMP it sets (about :418-440, :573-577).

F1 (must fix). R-2598 passes in the lane worktree but fails in every scratch worktree of the seat's pair runner, before any mutation (`BASELINE FAIL`, all 19 pairs unjudged). The seat reproduced it: with `TMPDIR`, `TEMP` and `TMP` set to a long folder (the runner gives each test file its own), R-2598 fails, and every other check passes. The cause is the fixed `sessionReadMaxBytes: 512` in the `ignoresLargeReview` case: the matching session's header holds the lane path, so a long temp path pushes that file past 512 bytes, its whole read fails with ERR_TOO_LARGE, and the cost reads as unknown. The case must hold for any honest temp path.

1. Size that case's cap from the files the test writes: a cap at least the matching session's byte size and below the pi-review session's byte size, with the review session made large enough that the gap always exists. Keep what the case proves: a large non-matching session beside a matching one leaves the cost known. Check the `tiny` case the same way; change it only if it can fail for the same reason. Change nothing else.
2. Run the file under a long temp folder outside the worktree, for example `L="$(mktemp -d)/$(printf 'x%.0s' {1..120})"; mkdir -p "$L"` and then `TMPDIR="$L" TEMP="$L" TMP="$L" node packages/nana-pack/tests/build-records.test.mjs`, and under the default one. Both must pass. Then run `node packages/nana-pack/tests/build-report.test.mjs` the same two ways.
3. Run `npm run test:locked` before your commit. Try this wrong version, see R-2598 go red under both temp folders, then restore: in `packages/nana-pack/lib/build-records.mjs`, read the whole session under `sessionHeadBytes` instead of `sessionReadMaxBytes`.

Seat check: `node docs/reviews/build-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- R-2598 passes under the default and a long temp folder; the wrong version turns it red under both; the full suite is green; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the change; each departure from the Precedent files with its reason; both temp-folder results; the wrong version tried and its result; the full suite's summary line; the seat-check status.
