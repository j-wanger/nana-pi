Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane land-test-split. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on branch tip 6839d60d. Round 1's reviewer said LAND (kept in this folder as `r1-*.md`). This build records its notes only. Change no code or test.

## Precedent

- `docs/known-bugs/FEAT-031.md`
- `docs/known-bugs/FEAT-008.md`

Report each departure.

## Build

Add one line each, naming "(land-test-split, review round 1)", in each file's existing line style:
1. In `docs/known-bugs/FEAT-031.md`: `profile-store-guards.test.mjs` takes 249.5 s alone on the Windows laptop and 264 s on the hosted Windows runner, close to the 300 s per-file limit.
2. In the known-bug file of the feature whose table holds R-3490 and R-3491 (the tree says FEAT-008): R-3490's 180 s bound is backed only by lane-folder timing records; no tagged check measures time, so a later slowdown goes uncaught.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff 6839d60d HEAD --stat` lists only those known-bug files. Green, run locally: the known-bugs check, `npm run readme:check`, and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
