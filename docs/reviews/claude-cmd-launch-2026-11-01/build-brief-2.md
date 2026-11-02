Feature: FEAT-040 · Make and keep memory

Lane claude-cmd-launch. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on the Mac, on branch tip e06274ee plus the seat's notes. Main moved to ac20e30a since the laptop's merge. This build only merges main.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-040.md`

Report each departure.

## Build

Merge `origin/main` into `feat/claude-cmd-launch`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's additions: R-3470 to R-3474, `packages/nana-pack/lib/claude-launch.mjs` and its config, the runner change in `scripts/memory-shape-runners.mjs`, `claude-launch.test.mjs`, its FEAT-040 known-bug edits, its session entry and its review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate the code map and requirements tree only if the merge requires it. Change no behaviour.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: `node packages/nana-pack/tests/claude-launch.test.mjs`, the memory-shaping test, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite. Push and stop.
