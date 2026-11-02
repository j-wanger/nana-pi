Feature: FEAT-041 · Shape each agent's context by role

Lane roster-roles. Class: hook. Builder: pi-worker (small lane). Merge build, on branch tip c30fdc81. Every reviewer said LAND at the previous round (kept in this folder), but main moved to 4eda88e2 before the land. This build merges main and records the last review's notes.

## Precedent

- `docs/sessions/2026-10.md`

Report each departure.

## Build

Merge `origin/main` into `feat/roster-roles`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its rows, code, tests, READMEs, known-bug lines, session entry and review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators rather than hand-merging them. Change no behaviour.

Then record the round 1 review notes in `docs/known-bugs/FEAT-041.md`, each line naming "(roster-roles, review round 1)", in that file's existing line style: (1) by default the checker runs on the builder entry, so the independent check shares the model family of the work it checks, and the lineage warning compares the checker only with the reviewer, so this is never flagged; (2) a role launch without `--out` is refused with only `pi-worker: slot refused: usage` and no usage line; (3) a `--brief` value starting with a single `-` passes the role checks and is refused later by the lane check, after the role temp folder was made (the refusal removes it); (4) older checkouts refuse new role keys or a Claude Code scout, as the owner accepted. The brief authorizes this known-bug edit.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: every test file this lane touched, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
