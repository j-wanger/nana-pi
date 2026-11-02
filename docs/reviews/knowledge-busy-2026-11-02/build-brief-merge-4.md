Feature: FEAT-013 · Install and connect harness runtimes

Lane knowledge-busy. Class: hook. Builder: pi-worker (small lane). Merge build, on branch tip fe366d6b. Every reviewer said LAND at the previous round (kept in this folder), but main moved to 5bb48872 before the land. This build merges main and records the last review's notes.

## Precedent

- `docs/sessions/2026-10.md`

Report each departure.

## Build

Merge `origin/main` into `feat/knowledge-busy`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its rows, code, tests, READMEs, known-bug lines, session entry and review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators rather than hand-merging them. Change no behaviour.

Then record the round 3 review notes in `docs/known-bugs/FEAT-013.md`, each line naming "(knowledge-busy, review round 3)", in that file's existing line style: (1) the budget checks gate the retry but reserve no time for its synchronous query, so a retry that starts near the end of the budget can run past it (`hook.ts` around line 211); (2) M2's failure detail prints `reason` and `retried` but not `failure`, the second cause; (3) M2's failure path parses `pull.log` with no `try`, so a torn line throws a parse error in place of the detail (the check still fails); (4) the comment on pair P9 in the lane folder's `seat-mutate.mjs` overstates what no check can tell apart. The brief authorizes this known-bug edit; change no code.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: every test file this lane touched, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
