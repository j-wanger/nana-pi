# Review — page-needs-you (the product page leads with what it does and shows what each ask needs), 2026-10-29 (final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary. `node scripts/lane-class.mjs` prints `ordinary`; pi-worker notes the issue reader also reaches the frontier summary producer and its pi extension. The lane reorders the Overview, adds an ask-body parser, gives the issue reader an opt-in body field, and renders ask questions in Needs you and Decisions.

Threat model: honest variation is in scope: asks in the four-line shape, numbered or indented, or older free-text asks with or without an inline default; zero blocking asks; more than three listable asks; markup or long text in an issue body; gh unavailable; the session-start block and pi extension that share the issue reader. Deliberate forgery is out. A finding outside this model is a residual.

Review `git diff main...HEAD` on `feat/page-needs-you`. The plan of record is `docs/reviews/page-needs-you-2026-10-29/plan.md`, after one adversary pass (`plan-attack.md`). The owner chose "Lane first"; his plan questions are issue 255, built on the defaults.

The seat's record:
- **Three builds.** After each, the seat ran first-look and the new outside reader. Build 2 fixed numbered labels the phone screenshot showed missing. Build 3 fixed per-question recommendations in Decisions and counts in the Records summary, both found by the reader (`outside-reader-build2.md`). The reader's run on build 3 (`outside-reader-build3.md`) found neither again; its two new points are design judgments for the owner.
- **Locked full suite at build 3:** 234 files, 232 pass, 2 skip. Main was merged after build 3 (reader-at-land); the merge touched only generated files and the known-bug file.
- **Notes before this round:** HANDOFF lanes line, session entry, known bugs in FEAT-039, including three carried from the reader-at-land review. The lane's keep wrote `tree-movement.md`.
- **CI** runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green.

Ask above all:
- Does the owner, opening the page, see What it does first and, for each listed ask, a question with its own recommendation?
- Is the session-start block and the pi frontier extension's output unchanged when the issue reader is called without the body flag?
- Can an issue body put markup or script on the public page?
- Is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
