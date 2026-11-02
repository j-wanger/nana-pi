Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Build session 10, on tip 8a07d3e6. CI run 41463549383 failed on all three systems in a test file build 9 did not run: `packages/nana-knowledge/tests/sources-file.test.mjs`, "R-2860: a pull with an unparseable or unreadable sources.json prints one frozen-index notice line first, with or without pointers". It passes on main, so build 9's budget-bounded retry changed the pull's output on that path (likely the frozen notice no longer prints when the pull ends in a retry, budget or query path).

## Precedent

- `packages/nana-knowledge/lib/hook.ts` (the notice and the retry loop)
- `packages/nana-knowledge/tests/sources-file.test.mjs`

Report each departure.

## Build

Find why R-2860 fails on this tip and passes on main, and fix the hook so the frozen-index notice prints first on every return path, as on main, keeping build 9's budget-bounded retry. Do not edit R-2860's assertions. Change nothing else.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: EVERY test file under `packages/nana-knowledge/tests/` (all of them, not only the touched ones), `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, the requirements trace, the known-bugs check, and `node scripts/identity-scan.mjs --root .` after `git add`. Record one wrong-code pair: build 9's code fails R-2860, the fix passes. Do not run the locked full suite; CI is the suite. Commit and stop; do not push (the seat pushes).
