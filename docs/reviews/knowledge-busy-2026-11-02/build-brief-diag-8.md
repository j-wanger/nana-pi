Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Diagnostics build on the branch tip; no behaviour change. Every reviewer said LAND at round 7, but M2 (`packages/nana-knowledge/tests/build-busy.test.mjs`) then failed on the macOS CI leg in 2 of 3 runs with `noPull=1, noRebuild=0`, and never locally. The CI summary shows only the first line of an assertion message, so the `missed` detail the test builds after a newline never reaches the log.

## Precedent

- `packages/nana-knowledge/tests/build-busy.test.mjs` (M2's `missed` lines and its `NOTE M2` console line)

Report each departure.

## Build

In M2 only, make a miss fully visible in the CI summary: put every missed run's detail on the assertion message's first line (joined with ` | `, no newline), and add to each missed entry the pull record's `failure` field, the hook's exit code, and the first 120 characters of its stdout and stderr, JSON-escaped. Keep both assertions and their thresholds exactly as they are. Change nothing else, including product code.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node packages/nana-knowledge/tests/build-busy.test.mjs`, `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, the requirements trace and `node scripts/identity-scan.mjs --root .` after `git add`. Show one forced miss locally (a throwaway edit you revert) to prove the detail prints on one line, and paste that line in your report. Do not run the locked full suite; CI is the suite. Push and stop.
