Feature: FEAT-042 · Measure what builders see

Lane anatomy-label-check. Class: ordinary. Builder: pi-worker (small lane). Build session 4, on the branch tip fe749bb0. Round 1 said LAND (to be kept in this folder), but main moved to ac20e30a (seat-memory-push-a landed). This build only merges main and fixes one stale HANDOFF sentence.

## Precedent

- `docs/sessions/2026-10.md`
- `HANDOFF.md`
- `docs/reviews/anatomy-label-check-2026-11-01/build-brief-3.md`

Report each departure.

## Build

Merge `origin/main` into `feat/anatomy-label-check`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's additions: its requirement rows, its `apps/bench` changes and config, its README lines, its known-bug edits, its session entry and its review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate the code map and requirements tree only if the merge requires it. Change no behaviour.

In `HANDOFF.md`, the "Lanes in flight" bullet: replace its last two sentences with "Seat memory delivery is building." Then run `nana-writing HANDOFF.md`.

Round 1's five SHOULD findings and NOTE 1 (kept as `r1-reviewer-0dd69bbf.md` in this folder) are known bugs. Add one line each to `docs/known-bugs/FEAT-042.md` in that file's format. For SHOULD 5, rewrite the line it names so it no longer compares the weighted bar with κ; do not add a line for it. Change no code for them.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files plus `HANDOFF.md`. Green, run locally: the lane's anatomy tests under `apps/bench/tests/`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, `nana-writing HANDOFF.md` and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
