Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane windows-first-try. Class: ordinary. Builder: pi-worker (small lane). Merge build, on branch tip 448e88ef. Every reviewer said LAND at the previous round (kept in this folder), but main moved to 7c4e7e19 before the land. This build merges main and records the last review's notes.

## Precedent

- `docs/sessions/2026-10.md`

Report each departure.

## Build

Merge `origin/main` into `feat/windows-first-try`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its rows, code, tests, READMEs, known-bug lines, session entry and review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators rather than hand-merging them. Change no behaviour.

Then add three lines to `docs/known-bugs/FEAT-031.md`, each naming "(windows-first-try, review round 1)", in that file's existing line style: (1) the stagger check now reads `SEAT_MUTATE_STAGGER_SECS` from the test's own environment and `scripts/test.mjs` does not remove it, so a seat that exports a short stagger gets a local FAIL; (2) a `git worktree add` of 1000 ms or more lets a missing stagger pass the check; (3) a shard set-up over about 2 s can still fail the check.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: every test file this lane touched, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
