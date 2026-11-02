Feature: FEAT-042 · Measure builder context

Lane anatomy-label-check. Class: ordinary. Builder: pi-worker (small lane). Build session 3, on the branch tip. Main moved several lands ahead. This build only merges main, before the lane's first review.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-042.md`

Report each departure.

## Build

Merge `origin/main` into `feat/anatomy-label-check`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's additions: R-3399 to R-3406 and R-3397's retune, its `apps/bench/` changes, its session entry, its FEAT-042 known-bug lines and its review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. In `HANDOFF.md` take main's version. Regenerate the code map and requirements tree only if the merge requires it. Change no behaviour.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Never read `~/nana-memory-runs`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: the anatomy tests, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite. Push and stop.
