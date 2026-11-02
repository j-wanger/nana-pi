Feature: FEAT-002 · Resume decisions and next actions

Lane builder-credentials. Class: ordinary. Builder: pi-worker (small lane). Merge build, on branch tip 3eefdd5c. Every reviewer said LAND at the previous round (kept in this folder), but main moved to 5bb48872 before the land. This build merges main and records the last review's notes.

## Precedent

- `docs/sessions/2026-10.md`

Report each departure.

## Build

Merge `origin/main` into `feat/builder-credentials`. Every file this lane did not set out to change must end identical to `origin/main`, including lines main deleted. Keep this lane's changes: its rows, code, tests, READMEs, known-bug lines, session entry and review folder. In `docs/sessions/2026-10.md` keep every entry whole, newest first. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` with their generators rather than hand-merging them. Change no behaviour.

Then record the round 1 review notes in `docs/known-bugs/FEAT-002.md`, each line naming "(builder-credentials, review round 1)", in that file's existing line style: (1) the new line forbids using any stored credential, yet `git push` and `gh pr create` both use one, so a literal reader may see a contradiction; the hardening lane builder-credential-strip replaces the push wording; (2) "plain `git push`" can be read too literally on a branch with no upstream; (3) R-3650 sits out of numeric order beside R-2510, as the brief asked. The brief authorizes this known-bug edit.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

`git diff origin/main HEAD --stat` lists only this lane's files. Green, run locally: every test file this lane touched, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs --root .`. Do not run the locked full suite; CI is the suite. Push and stop.
