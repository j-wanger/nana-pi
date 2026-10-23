# Review — session-start-frontier (each seat session starts with its project's frontier), 2026-10-22 (the final reviewer)

Feature: FEAT-002 · Resume decisions and next actions

Class: hook (the Claude Code SessionStart objective hook gains a second producer under its launcher, and a pi extension is added; nana-setup install, uninstall and doctor do not change: no new settings entry, hook file or installed path). Threat model: honest variation in HANDOFF files seats and the seed write (numbered or bulleted Next, bold leads, nested items and headings, fences, `## NEXT`, the seed's `## Open`, asks with or without title leads, CRLF, BOM, empty, oversized, UTF-16, a folder or symlink named HANDOFF.md) and in where sessions start (root, subfolder, linked worktree, outside a repository, a folder with spaces), launcher children, and a long objective sharing the hook's output; deliberate forgery out (a HANDOFF written to steer the agent is shown as quoted, bounded data).

Review `git diff b5b5f8c2..HEAD` on `feat/session-start-frontier`. Main is b5b5f8c2 (brief-reader-fixes, just landed). The lane branched from 61ac64f3 and merged main once at 2d299ea7 with no conflict; the seat regenerated the tree outline and code map (unchanged). The lane's own commits: 2ba315d6 (plan), c3cf37db (build 1, the code), 2ec99f24 (the seat's pairs), c5804e13 (the independent check, the install check and FEAT-002 known bugs), the merge, e0f3770a (notes), and the final commit with this review's two briefs.

The plan of record is `docs/reviews/session-start-frontier-2026-10-22/must-meet.md`: decisions D1 to D11, eight rows (R-2606 to R-2613), the ledger edit to R-873 and R-327, the tunables and the known limits; `plan-draft.md` and `plan-attack.md` (M 2, S 9, N 14) are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): all 18 red at c3cf37db, each by exactly its named title (`seat-mutate-output-c3cf37db.txt`). The planned "lines split on \\n only" pair was swapped for "the unavailable line without the path": it is an equivalent mutant here, because every title is trimmed and the heading pattern absorbs a trailing carriage return.
- The seat's per-build diff check finds no removed line holding an escaped `\\n`, `\\r` or `\\t`.
- The macOS install check at c3cf37db: every item PASS, the objective hook included (`install-check-c3cf37db.txt`).
- The independent check (`independent-check-c3cf37db.md`): no material problem. Its non-blocking notes are FEAT-002 known bugs, among them title selection that grows with the square of the item count (pi's session start waits; the Claude hook cuts it at 1.5 s).
- Session titles: 0 missing. The builder's locked full suite: `211 files: 209 PASS, 0 FAIL, 2 SKIP`. After the merge, map:check, req:tree, readme:check and the trace are green, and the tree checker prints `deliverables: 15 of 39 made and read by code`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement b5b5f8c..e0f3770: 10 rows in 2 features
FEAT-002 · Resume decisions and next actions
  R-873 Made by/Read by lines changed
  R-2606 new (implemented)
  R-2607 new (implemented)
  R-2608 new (implemented)
  R-2609 new (implemented)
  R-2610 new (implemented)
  R-2611 new (implemented)
  R-2612 new (implemented)
  R-2613 new (implemented)
FEAT-014 · Create or adopt a project workspace
  R-327 Made by/Read by lines changed
```

CI runs on the draft PR at the reviewed tip, the Windows leg included (R-2606 and R-2613 run there from the checkout). The seat lands only on green.
