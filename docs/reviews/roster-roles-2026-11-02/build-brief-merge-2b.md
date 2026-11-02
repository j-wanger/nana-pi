Feature: FEAT-041 · Shape each agent's context by role

Lane roster-roles. Class: hook. Builder: pi-worker (small lane). Continue the merge build: `build-brief-merge-2.md` stopped BLOCKED with the merge of origin/main in progress in this worktree (`merge-2-report.md`): this lane's rows R-3530 and R-3531 collide with rows main now holds (lane windows-first-try).

Authorization: renumber this lane's R-3530 to R-3536 and R-3531 to R-3537 everywhere this lane uses them (REQUIREMENTS.md rows, `// req:` tags, evidence cells, the seal tests, the lane folder's plan references if a check reads them). Main's R-3530 and R-3531 stay exactly as main has them. Then finish everything `build-brief-merge-2.md` asks, including its known-bug lines, and complete the merge commit.

## Precedent

- `REQUIREMENTS.md`
- `docs/sessions/2026-10.md`

Report each departure.

Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Done when

As `build-brief-merge-2.md` says, with the requirements trace green (0 missing, no duplicate IDs) and the identity scan run after `git add`. Push and stop.
