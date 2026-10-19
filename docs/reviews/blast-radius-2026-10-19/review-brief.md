# Review — blast-radius (one command draws a change's blast radius as one self-contained page), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-029 · Navigate code and investigate impact

Review `git diff 713d6aa..HEAD` on `feat/blast-radius` (`git merge-base HEAD main` is `713d6aa`, the main this tip last
merged; main has since moved to `a1d07f6`, which this tip does not hold). The plan of record is
`docs/reviews/blast-radius-2026-10-19/must-meet.md` (rows R-1550 to R-1557, FEAT-029), with `plan-attack.md` and
`build-brief-1.md` beside it. The seat's record `seat-verify-e63242f.md` holds CI, the Windows log beside it, and the
rerun of the lane's own page.

Tree movement:

```
tree movement 713d6aa..e63242f: 8 rows in 1 features
FEAT-029 · Navigate code and investigate impact
  R-1550 new (implemented)
  R-1551 new (implemented)
  R-1552 new (implemented)
  R-1553 new (implemented)
  R-1554 new (implemented)
  R-1555 new (implemented)
  R-1556 new (implemented)
  R-1557 new (implemented)
```

Judge whether `node scripts/blast-radius.mjs --root <dir> --base <rev> --out <page>` draws, from the code map alone,
exactly the modules changed since the merge base and their transitive callers and callees, in the four columns, with
exactly the map's edges between drawn nodes, the unmapped list and the no-linked-test labels; whether one checkout gives
the same bytes in any folder; whether its git calls only read; and whether its tests write only inside the temp folders
the shared helper owns.

Threat model: honest variation in our tools' output and the OS in scope (git output on macOS, Linux and Windows;
uncommitted, untracked and git-ignored files; a module both caller and callee; an import cycle; a deleted or map-ignored
module; two folders holding one checkout; a command path through a symlink); deliberate forgery out (a hand-edited page,
a doctored map). Lane class: ordinary — a repo script, its config module, its test and two names added to the code-map
shim's re-export; no install, hook, gate, land or review tool.

Check: (1) each of the eight must-meet checks fails with its row's behaviour removed, and its expected sets are written
out, not computed with `impact()`; (2) the command takes graph facts only through the code-map shim and runs git
read-only (`--no-optional-locks`, no shell); (3) the committed lane page equals a rerun of `node scripts/blast-radius.mjs
--root . --base main --out docs/reviews/blast-radius-2026-10-19/blast-radius.html` on the reviewed tip (the seat's rerun
at e63242f differed in two lines); (4) no test writes outside the temp folders it owns; (5) nothing else changed: the
only edit to an existing test is R-291's leaf total; (6) HANDOFF and the session entry are true; (7) any MUST.
