Feature: FEAT-042 · Measure what builders see

Lane anatomy-label-check. Class: ordinary. Builder: pi-worker (small lane). Build session 5, on branch tip fb9e41c0. Round 2 said LAND (kept in this folder), but main moved to d4285b6c (claude-cmd-launch landed). This build only merges main.

## Precedent

- `docs/sessions/2026-10.md`
- `docs/reviews/anatomy-label-check-2026-11-01/build-brief-4.md`

Report each departure.

## Build

Merge `origin/main` into `feat/anatomy-label-check`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its requirement rows, its `apps/bench` changes and config, its README lines, its known-bug edits, its HANDOFF sentence, its session entry and its review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate the code map and requirements tree only if the merge requires it. Change no behaviour.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files plus `HANDOFF.md`. Green, run locally: the lane's anatomy tests under `apps/bench/test/`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `nana-writing HANDOFF.md` and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
