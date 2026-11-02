Feature: FEAT-042 · Measure what each role's context is for

Lane seat-anatomy. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on the merged branch tip. Build 2 made the change but stopped because `npm run map:check` needs the code map regenerated for the new import; this build may regenerate it. CI failed on all three systems on one check: `packages/nana-pack/tests/test-runner.test.mjs`, "the source check detects direct mkdtemp calls while ignoring only generated leak fixtures" (R-917). This lane's `apps/bench/test/anatomy-seat.test.mjs` calls `fs.mkdtempSync` directly (line 21).

## Precedent

- `apps/bench/test/tmp-dir.mjs` and any test in `apps/bench/test/` that imports it with `import { tmpDir } from "./tmp-dir.mjs";`

Report each departure.

## Build

Make `anatomy-seat.test.mjs` take its temp root from the shared `tmpDir` helper, imported with that exact double-quoted line, instead of `mkdtempSync`, and regenerate `docs/code-map.md` with its generator. Change nothing else.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

Green, run locally: `node packages/nana-pack/tests/test-runner.test.mjs`, `node apps/bench/test/anatomy-seat.test.mjs`, `npm run map:check`, the requirements trace and `node scripts/identity-scan.mjs --root .` after `git add`. Do not run the locked full suite; CI is the suite. Push and stop.
