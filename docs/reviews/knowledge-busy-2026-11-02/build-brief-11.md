Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Build session 11, on tip 2f80ac48. CI run 41482921468 failed on ubuntu-latest and windows-latest in `packages/nana-knowledge/tests/recover.test.mjs`, "R-2402: a pull over a page-overwritten index older than one hour starts a build that heals it, and a later pull hits" (it passes on main; it flaked once on macOS at round 7). Seat reading, inferred, not reproduced: build 9's budget-bounded retry now retries every open or query failure, including a damaged index's (not only SQLite busy), so a pull over a damaged index spends its whole budget retrying and holding read handles, which delays or blocks the heal.

## Precedent

- `packages/nana-knowledge/lib/hook.ts` (the retry loop)
- `packages/nana-knowledge/tests/recover.test.mjs` (R-2402)
- `packages/nana-knowledge/tests/build-busy.test.mjs`

Report each departure.

## Build

1. Confirm the cause: run R-2402 with build 9's code and with main's code, and report what differs (pull time, attempt count, whether the heal build starts).
2. Retry only on busy or locked errors (SQLite errcode 5 or 6, as the structured cause records them); any other open or query failure returns at once as before build 9, so the heal path behaves as on main. Keep the budget bound and the attempt count in the record.
3. Add one check: an injected non-busy failure returns after one attempt; keep the N-times-busy check.

Do not edit R-2402's assertions. Change nothing else.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: EVERY test file under `packages/nana-knowledge/tests/` (recover three times), `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, the requirements trace, the known-bugs check, and `node scripts/identity-scan.mjs --root .` after `git add`. Record one wrong-code pair: build 9's retry-everything fails the new non-busy check. Do not run the locked full suite; CI is the suite. Commit and stop; do not push (the seat pushes).
