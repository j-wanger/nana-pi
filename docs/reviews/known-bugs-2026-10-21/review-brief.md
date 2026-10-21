# Review — known-bugs (known bugs leave HANDOFF.md for one file per feature), 2026-10-21 (the final reviewer)

Feature: FEAT-002 · Resume decisions and next actions

Class: ordinary (a new repo script, its tests, the shared working-pattern text and its AGENTS.md copy, the builder preamble; no install, hook, extension, gate, land or review tool change). Threat model: honest variation in scope — old lines with only an area tag, a lane whose brief names another feature than its rows, a lane building alongside this one, other projects' HANDOFFs, Windows line endings or a BOM in a known-bug file, a feature split, frozen or retired later, a project with no requirements tree; deliberate forgery out (a file named for a live feature holding unrelated lines, a forged Feature line).

Review `git diff 086eb4b2..HEAD` on `feat/known-bugs` (main is 086eb4b2; the lane branched there). The plan of record is `docs/reviews/known-bugs-2026-10-21/must-meet.md`: the seat decisions, seven rows (R-2504 to R-2510), the shared text and the known limits; `plan-draft.md` and `plan-attack.md` are its inputs (the attack's four MUSTs shaped it). The seat moved the 891 lines in the plan commit c20f107b with `move.mjs`; `placement.tsv` records where each line went and why. Re-run `node docs/reviews/known-bugs-2026-10-21/conserve.mjs` from the worktree root: it must show 0 lost and 0 left in HANDOFF; its ADDED lines are this lane's notes. `build-brief-1.md` is the one builder session (5179f80d); the builder reports seven wrong versions tried, each red. The land runs the locked suite on the reviewed tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 086eb4b..5179f80: 7 rows in 1 features
FEAT-002 · Resume decisions and next actions
  R-2504 new (implemented)
  R-2505 new (implemented)
  R-2506 new (implemented)
  R-2507 new (implemented)
  R-2508 new (implemented)
  R-2509 new (implemented)
  R-2510 new (implemented)
```

CI: the seat pushed the reviewed tip to a draft pull request; its run is not in this brief.

Judge whether the feature works for the owner and every seat, and report:
- no known-bug line is lost, duplicated or rewritten (conserve), and the two lines removed as fixed are really fixed by this change;
- each placement rule in `move.mjs` does what its comment says, and a sample of `placement.tsv` puts lines under a fair owner (the lane-placement limit is declared);
- each must-meet check is red with its feature removed or with the obvious wrong code, and green with it;
- the known-bug check reports names and sizes as the rows say, reads Windows line endings and multibyte text right, and fails only on a name;
- the shared text, AGENTS.md's copy and the builder preamble say what the must-meet says, R-598's path check and R-859's copy check still pass, and nothing else in the repo still sends known bugs to HANDOFF;
- HANDOFF (the queue item removed, one Landed line, two Open asks, the pointer section), the rulings file's two new lines, the known-bug lines this lane adds, and the session entry are accurate.

Known limits already carried (do not send back for them): the word-budget finding stays; placement by lane; untagged lines and an unchecked line format; nothing proves a seat files a finding in the right file; a careless merge of a lane in flight; a feature split turns the folder check red in that lane; the product report shows no known bugs; "residual" survives in two places; other projects keep their old lines.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
