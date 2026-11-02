Feature: FEAT-008 · Integrate and clean up reviewed changes

Lane land-clean-merge. Class: gate. Builder: pi-worker (small lane). Build session 3, on tip 9443eea8. CI run 41483065091 failed only on windows-latest, in `packages/nana-pack/tests/land-clean-merge.test.mjs` M2 ("clean merge content matches literals and an independent ordinary merge"), line 75: the file read from the main checkout is `'lane one\r\n...main nine\r\n'` where the literal is LF. The Windows runner's git converts line endings on checkout; the test reads working-tree files. The tree equality check after it passed, so the merged blobs are right.

## Precedent

- `packages/nana-pack/tests/land-clean-merge.test.mjs` (M2, lines 60-80)
- `packages/nana-pack/tests/land-fixtures.mjs`

Report each departure.

## Build

1. In M2, compare each expected file's committed content (`git show HEAD:<file>` in the main checkout and in the oracle clone) to the literal, not the checked-out working file, so the check holds whatever the runner's line-ending settings are. Keep the literals and the tree equality check as they are.
2. The file took 146.9 s on Windows against the runner's per-file limit (180 s). If a split keeps every check meaningful, move M7's race cases (or the slowest group) into their own test file with the same req markers; otherwise report the per-check times so the seat can decide.

Change nothing else, including product code.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: every land test file this lane touched, `node packages/nana-pack/tests/test-runner.test.mjs`, `npm run map:check`, the requirements trace and `node scripts/identity-scan.mjs --root .` after `git add`. Show M2 passing with a fixture repository whose `core.autocrlf` is `true` (a throwaway local check). Do not run the locked full suite; CI is the suite. Commit and stop; do not push (the seat pushes).
