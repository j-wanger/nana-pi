Feature: FEAT-040 · Make and keep memory

Lane making-session-end. Class: hook. Builder: pi-worker (small lane). Build session 6, on branch tip 90b9c2c1. Round 3 said LAND at 90b9c2c1, but main moved to b757e4d0 (memory-replay landed) before the land. This build only merges main so the branch can fast-forward.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-043.md`

Report each departure.

## Build

Merge `origin/main` into `feat/making-session-end`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted: never restore a line main removed. Keep this lane's additions: R-3350 to R-3362 and its SUB-024 rows, its session entry, its `docs/known-bugs/FEAT-040.md` lines, its HANDOFF "Lanes in flight" line, and its review folder. In `docs/sessions/2026-10.md` keep every entry whole, byte for byte as on its branch, newest first. Change no behaviour. Renumber nothing. Regenerate maps and update heading counts only if the merge requires it. Re-run the lane's mutation runner and report it.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files: its packages and tests, `REQUIREMENTS.md`, `docs/code-map.md`, `docs/requirements-tree.md`, `docs/sessions/2026-10.md`, `HANDOFF.md`, `docs/known-bugs/FEAT-040.md`, `README.md` files it changed, and its review folder. Green, run locally: the touched test files, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Run `node packages/nana-setup/bin/install-check.mjs` and report its exit. Do not run the locked full suite; CI is the suite. Push the branch and stop.
