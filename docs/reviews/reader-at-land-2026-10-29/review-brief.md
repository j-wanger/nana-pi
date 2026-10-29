# Review — reader-at-land (a cold model reads a lane's page change and names new weaknesses), 2026-10-29 (final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary. `node scripts/lane-class.mjs` prints `ordinary`. The lane adds `scripts/outside-reader.mjs`, its config and prompt, moves first-look's Playwright loader into `scripts/playwright-resolve.mjs`, adds an npm script, a README sentence and one seat-guide rule.

Threat model: honest variation is in scope: no browser, no model, no objective; a model run that fails or times out; curly quotes, punctuation and quotes spanning page elements; an answer of none; a large known-bug file; a lane that changes no page. Deliberate forgery is out. A finding outside this model is a residual.

Review `git diff main...HEAD` on `feat/reader-at-land`. The plan of record is `docs/reviews/reader-at-land-2026-10-29/plan.md`, after one adversary pass (`plan-attack.md`). The owner said "yes plan the reader wiring"; his three plan questions are issue 256, built on the defaults.

The seat's record:
- **One build** (09a373cd, d1518f7a), on the larger builder after a first launch stopped without naming a blocker.
- **Locked full suite at the build:** 234 files, 232 pass, 2 skip. The builder's install check failed at the known pi post-edit step inside pi-worker (`install-check.txt`); the seat's own run passed 18 of 18.
- **Real runs:** the builder's scratch trial (`real-run.txt`) found its planted defect. The seat ran the reader on another lane's first-look folder: two findings, every quote found.
- **Notes before this round:** HANDOFF lanes line, session entry, two known bugs in FEAT-039. The lane's keep wrote `tree-movement.md`.
- **CI** runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all:
- Does the seat get a few new, quoted, owner-useful findings, and nothing when there is nothing new?
- Can the model run see anything beyond its prompt (tools, the repo, context files), or hang the seat?
- Does first-look still work after its loader moved?
- Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
