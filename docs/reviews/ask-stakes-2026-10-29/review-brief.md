# Review — ask-stakes (each planner question says what its default gains and may miss), 2026-10-29 (final reviewer)

Feature: FEAT-006 · Launch builders with execution limits

Class: ordinary. `node scripts/lane-class.mjs` prints `ordinary`. The lane changes the planner prompt's question form, the ask parser and the product page's ask rendering.

Threat model: honest variation is in scope: asks in the five-line form, the older four-line form, or free text; a gains value on its own line or below its label; a body with an inline Default or Recommendation; zero blocking asks. Deliberate forgery is out. A finding outside this model is a residual.

Review `git diff main...HEAD` on `feat/ask-stakes`. The plan of record is `docs/reviews/ask-stakes-2026-10-29/plan.md`, after one adversary pass (`plan-attack.md`). The owner said "keep the revertability cost, add the reader suggestion"; his plan question is issue 259, built on the default.

The seat's record:
- **One build** (005092b2). Locked full suite at the build: 235 files, 233 pass, 2 skip.
- **First-look and the outside reader** ran on the build. The page shows issue 259's new line in Needs you and Decisions. The reader's one finding (`outside-reader-build1.md`) is about issue 255's own text, an older ask.
- **Notes before this round:** HANDOFF lanes line, session entry, known bugs in FEAT-039, including two carried from the page-needs-you review. The lane's keep wrote `tree-movement.md`.
- **CI** runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all:
- Does the planner prompt ask for a gains-and-misses line a planner can fill usefully, while keeping the cost line and the blocking rule exactly?
- Does every older open ask still show what it showed before, except issues 255 and 256, which now show their full default?
- Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
