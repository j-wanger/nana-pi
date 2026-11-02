Feature: FEAT-006 · Launch builders with execution limits

Lane builder-credential-strip. Class: gate. Builder: pi-worker (small lane). Merge build, on branch tip 7d5f8ea4. Every reviewer said LAND at the previous round (kept in this folder), but main moved to f6a47565 before the land. This build merges main.

## Precedent

- `docs/sessions/2026-10.md`

Report each departure.

## Build

Merge `origin/main` into `feat/builder-credential-strip`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its rows, code, tests, READMEs, known-bug lines, session entry and review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators rather than hand-merging them. Change no behaviour.



Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: every test file this lane touched, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
