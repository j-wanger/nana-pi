# Review — bench-study-scratch (the bench test stops writing into the shipped study), 2026-10-24 (the final reviewer)

Feature: FEAT-034 · Define reproducible comparisons

Class: ordinary (a bench test; no install, hook, gate or land-tool change). Threat model: honest variation in scope (a checkout with no `raw/` folder, as on CI; one with paid evidence under `raw/`; evidence for the same task under other profiles; Windows paths; a slow file system); deliberate forgery out (a hand-planted file meant to fool the listing).

Review `git diff fc06e29d..HEAD` on `feat/bench-study-scratch`. Main is fc06e29d. The lane's commits: d1e37823 (plan of record), 6cff3d58 (build 1, the lane), 64b22c4f (notes), and the final commit with this brief.

The plan of record is `docs/reviews/bench-study-scratch-2026-10-24/must-meet.md`, with the adversary's pass in `plan-attack.md`: rows R-2770 to R-2772; the seat adopted the adversary's M1 (the sidecar path breaks in a scratch folder) and its no-copy design; the trailing removal of the shipped `raw/code-bugfix` is dropped.

The seat's record:
- Build 1's locked full suite: 217 PASS, 0 FAIL, 2 SKIP. The builder turned R-2770 and R-2771 red by hand with wrong versions 1 and 2. The seat confirmed wrong version 3 by reading: the listing records folders and their modification times.
- The seat's diff check finds no removed escaped `\n`. Seat titles: 0 missing. map:check, readme:check, the trace and the tree check are green; `nana-writing HANDOFF.md` finds no long sentence; the frontier check is within budget.
- The notes commit also records the product ledger audit's side findings as known-bug lines in FEAT-017, FEAT-039, FEAT-002, FEAT-001 and FEAT-024, and the audit in the session entry.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement fc06e29..6cff3d5: 3 rows in 1 features
FEAT-034 · Define reproducible comparisons
  R-2770 new (implemented)
  R-2771 new (implemented)
  R-2772 new (implemented)
```

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat lands only on green, and reads that run before the land.

Ask above all: does any part of the orchestration test still write into, change or remove anything under a shipped study folder, and do the three checks fail for the wrong versions they name? Are the new known-bug lines true to the code?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
