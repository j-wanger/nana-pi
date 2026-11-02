Feature: FEAT-042 · Measure builder context

Lane anatomy-labeller (Part 1). Class: ordinary. Builder: pi-worker (small lane). Build session 4, on branch tip b4b4bc0a. Round 3 said LAND at b4b4bc0a (kept in this folder), but main moved to d7af5876 (memory-replay and making-session-end landed) before the land. This build only merges main so the branch can fast-forward.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-040.md`

Report each departure.

## Build

Merge `origin/main` into `feat/anatomy-labeller`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted: never restore a line main removed. Keep this lane's additions: R-3390 to R-3398 and A-098, its `apps/bench/` changes, its session entry, its `docs/known-bugs/FEAT-042.md` lines if any, and its review folder. In `docs/sessions/2026-10.md` keep every entry whole, byte for byte as on its branch, newest first. In `HANDOFF.md` take main's "Lanes in flight" line. Change no behaviour. Renumber nothing. Regenerate maps and the requirements tree only if the merge requires it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only `apps/bench/`, `REQUIREMENTS.md`, `docs/code-map.md`, `docs/requirements-tree.md`, `docs/sessions/2026-10.md`, `docs/known-bugs/FEAT-042.md` if this lane changed it, and this lane's review folder. Green, run locally: `node apps/bench/test/anatomy-labels.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push the branch and stop.
