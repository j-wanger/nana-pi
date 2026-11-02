Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-local-suite. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on branch tip eda55e5b. Round 1 said LAND (kept in this folder), but main moved to 151c7099 (anatomy-labeller, ci-suite and memory-end-ebusy landed). This build only merges main.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-031.md`

Report each departure.

## Build

Merge `origin/main` into `feat/windows-local-suite`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted: never restore a line main removed. Keep this lane's additions: R-3450 to R-3455, its new and split test files, `env-path` helper, fixture changes, the `code-map-launch` test edit, its README line, its FEAT-031 known-bug lines, its session entry and its review folder. `profile-fixture.mjs` changed on main (memory-end-ebusy: `close` retries); if this lane changed it too, keep both. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate the code map and the requirements tree only if the merge requires it. Change no behaviour.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: the lane's touched test files, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
