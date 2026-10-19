# Review — tree-briefs (briefs, reviews and lands show how the requirements tree moved), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Review `git diff b3f6ec2..HEAD` on `feat/tree-briefs` (main is `b3f6ec2` when this brief was written; `git merge-base
HEAD main` is `b3f6ec2`). The plan of record is `docs/reviews/tree-briefs-2026-10-19/must-meet.md` (R-1460 to R-1463,
the adversary's amendment inside). The seat's record `seat-verify-19f44f1.md` holds CI, its Windows log beside it.

Tree movement (the lane's own report, `node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement b3f6ec2..19f44f1: 4 rows in 1 features
FEAT-028 · Maintain requirement identity and trace links
  R-1460 new (implemented)
  R-1461 new (implemented)
  R-1462 new (implemented)
  R-1463 new (implemented)
```

Judge whether the report prints the right rows under the right features for the honest cases the plan names (subgroups,
shared rows, Evidence-only edits, main merged back in, a subfolder ledger, Windows line endings), and whether the new
process text in AGENTS.md, the README and the requirements skill is true and runnable as written.

Threat model: honest variation in ledgers, branches and platforms in scope; deliberate forgery out. Lane class: ordinary —
a repo script, its test, four rows and docs.

Check: (1) R-1460 to R-1463 and their tests are not vacuous; (2) the commands the docs name run as written; (3) nothing
main does today changed; (4) HANDOFF and the session entry are true; (5) any MUST.
