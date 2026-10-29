# Review — records-counts (the Records summary separates failed, skipped and unmeasured counts), 2026-10-29 (final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary. `node scripts/lane-class.mjs` prints `ordinary`. The lane changes the closed Records section's summary line and the Broken section's no-run label in `scripts/product-report.mjs`.

Threat model: honest variation is in scope: a clone with runtime data, a clone with none (the public page), rows citing failed, skipped or unrun test files, a renamed block label, no deliverable lines. Deliberate forgery is out. A finding outside this model is a residual.

Review `git diff main...HEAD` on `feat/records-counts`. The plan of record is `docs/reviews/records-counts-2026-10-29/plan.md`, after one adversary pass (`plan-attack.md`). The owner said "no add them, we can subtract later if they are not useful". The plan had no questions for the owner.

The seat's record:
- **One build** (ca75511a). Locked full suite at the build: 235 files, 233 pass, 2 skip. Main was then merged (ask-stakes, which also edits `scripts/product-report.mjs`); the merge auto-merged that file, and the seat reran the three product-report test files: 116 checks pass.
- **First-look and the outside reader** ran on the build. The summary reads `Records: violated 5 · failed 0 · skipped 6 · unmeasured 0 · Gaps 0 · Stale 34`. The reader's one finding (`outside-reader-build1.md`): the counts do not say they come from this clone's own recorded runs.
- **Notes before this round:** HANDOFF lanes line, session entry, known bugs in FEAT-039, including two carried from the ask-stakes review. The lane's keep wrote `tree-movement.md`.
- **CI** runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all:
- Does each count mean what its word says, and does the public page say "no recorded run" rather than show zeros?
- Does the summary come from the report model, so a renamed label cannot show a silent 0?
- Did the merge with ask-stakes leave both lanes' rendering intact?
- Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
