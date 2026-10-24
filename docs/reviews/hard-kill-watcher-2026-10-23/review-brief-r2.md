# Review — hard-kill-watcher, confirmation round 2, 2026-10-23 (the final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class and threat model as round 1's brief, `review-brief.md` in this folder.

This is a confirmation round, for the standard reason: confirmation round on the final tip after fixes to named findings or a merge of current main. Round 1 at e3e2c078 ended LAND from both reviewers (`r1-opus-e1fd163c.md`, `r1-land-698f72da.md` in this folder). Review only `git diff e3e2c078..HEAD` on `feat/hard-kill-watcher`.

What changed since round 1:
- 29875bac merges main at fc06e29d, which landed project-check-line (its own reviewed code under `packages/nana-setup/`; no file this lane touches). The conflicts were notes only: HANDOFF's lanes line and Landed line, the code map (regenerated), and the two new session entries (both kept, this lane's first; project-check-line's Landed line moves into this lane's archived block).
- The same commit fixes round 1's named notes in `docs/known-bugs/FEAT-006.md`: your note (the hard-kill lines gain their `- ` marker), and the land reviewer's SHOULD (the early-kill line now says pi-worker takes the lane lock first, so a kill in that window leaves a stale lock to remove by hand). It adds project-check-line's two final-review notes as `docs/known-bugs/FEAT-014.md` lines.
- The final commit keeps the round 1 texts and adds these briefs.

No code or test of this lane changed since round 1. Map, readme, trace and the requirements tree are green at the tip. CI runs on the draft pull request at this tip; the seat lands only on green.

Ask: are round 1's named notes fixed truly, does the merge resolution keep both lanes' notes intact, and does anything in the change since round 1 block the land?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
