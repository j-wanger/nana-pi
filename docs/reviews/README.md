# Review records

This folder holds referenced reviews, recent memory inputs and records for open lanes.
Old unreferenced folders live in git history, not the working tree.
Runtime dependencies: Git for reading history; Node.js for the retention check.

## Read an old folder

The last commit containing every removed folder is
`5722fc0353e8ca718fe420bfef1f006ec3b3817c`.
From the repository root, this single command lists one removed folder and reads its brief:

```sh
git show 5722fc0353e8ca718fe420bfef1f006ec3b3817c:docs/reviews/adopt-closes-check-2026-10-19 5722fc0353e8ca718fe420bfef1f006ec3b3817c:docs/reviews/adopt-closes-check-2026-10-19/build-brief-1.md
```

Substitute another historical folder and file in the two object names to read it.
The README check executes this command without a shell.

## Keep records safe

Run `node scripts/records-move.mjs` from the repository root.
It derives protection from tracked references outside reviews and session archives,
including bare folder names, brace alternatives and unique file basenames.
It also retains folders last changed on or after 2026-11-01.
Protected folders keep all tracked files and blob IDs from the pre-move baseline.
The declared open lanes remain exempt from removal.
New lane briefs can still live at `docs/reviews/<lane>/`.

Session archives keep their historical references; use the commit above to resolve them.
