Feature: FEAT-044 · Deliver memory to each role

Lane seat-memory-push (Lane B). Class: hook. Builder: pi-worker (small lane). Build session B3, on branch tip 4d9b97f8. Round 1 had two reviewers, both LAND (kept in this folder as `r1-reviewer-637c5e3d.md` and `r1-land-15d54af1.md`). Main moved to d4285b6c (claude-cmd-launch landed). This build merges main and records round 1's notes.

## Precedent

- `docs/sessions/2026-10.md`
- `docs/known-bugs/FEAT-044.md`
- `docs/reviews/seat-memory-push-2026-11-01/build-brief-a4.md`

Report each departure.

## Build

1. Merge `origin/main` into `feat/seat-memory-push`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its rows, code, tests, READMEs, known-bug files, session entry and review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators rather than hand-merging them. Change no behaviour.
2. In `docs/known-bugs/FEAT-044.md`, add one line each for the round 1 reviewer's NOTEs 1, 2, 3, 5 and 6, naming "(seat-memory-push, review round 1)". For NOTE 4, remove the attack-N2 line from FEAT-044, since FEAT-040 already holds it. The land reviewer's two SHOULDs are already lines from the independent check; add nothing for them.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: every test file this lane touched, the two unchanged shared-memory tests, `node packages/nana-pack/tests/requirements-tree.test.mjs`, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
