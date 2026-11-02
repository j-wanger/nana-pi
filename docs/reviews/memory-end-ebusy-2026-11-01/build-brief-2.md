Feature: FEAT-040 · Make and keep memory

Lane memory-end-ebusy. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on branch tip fb9aa97d. Round 1 said LAND (kept in this folder), but main moved to 06287a95 (anatomy-labeller and ci-suite landed). This build only merges main.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `docs/code-map.md`

Report each departure.

## Build

Merge `origin/main` into `feat/memory-end-ebusy`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's two test files, its session entry and its review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate the code map only if the merge requires it. Change no behaviour.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only the two test files, `docs/code-map.md` if regenerated, `docs/sessions/2026-10.md` and the lane folder. Both test files, `npm run map:check`, `npm run readme:check` and `node scripts/identity-scan.mjs --root .` pass. Do not run the locked full suite; CI is the suite. Push and stop.
