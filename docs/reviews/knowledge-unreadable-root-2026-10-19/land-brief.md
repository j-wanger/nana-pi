# Review — knowledge-unreadable-root (the knowledge build keeps the search entries of a root or folder it cannot list), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Review `git diff d4423eff..HEAD` on `feat/knowledge-unreadable-root` (main was `d4423eff` when the lane branched; `git
merge-base HEAD main` is `d4423eff`). Main has since moved to `8a9ff9a3` (the readme-windows-checklist land), so the
land needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/knowledge-unreadable-root-2026-10-19/must-meet.md`: rows R-1910 to R-1913, with the R-883 and R-207 pins;
`build-brief-2.md` adds R-1914 and R-1915. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and
`build-brief-2.md` are the two builds (802c8478, merged with main d4423eff at fd0e7ab5; then 08ba23e3). The seat's
record is `seat-verify-08ba23e3.md`: CI run 39360453683 on macOS, Ubuntu and Windows, 0 failing files on each
(`ci-windows-08ba23e3.log` and build 1's `ci-windows-fd0e7ab5-build1.log` beside it); the wrong-code pairs
(`seat-mutate.mjs`; 14 of 19 red on fd0e7ab5, 14 of 16 red on 08ba23e3, M4 and M5 declared survivors); and the
independent check (`independent-check-08ba23e3.md`: HOLDS on build 1, no MUST, eleven probes). The final reviewer's
brief is `review-brief.md`. The local macOS install check runs again before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at 356dc265; the seat's notes commit
changes no row):

```
tree movement d4423ef..356dc26: 8 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-207 untested -> implemented
  R-883 untested -> implemented
  R-1910 new (implemented)
  R-1911 new (implemented)
  R-1912 new (implemented)
  R-1913 new (implemented)
  R-1914 new (implemented)
  R-1915 new (implemented)
```

The code under review: `walk()` and the purge loop in `packages/nana-knowledge/lib/build.ts`, which records every
directory it cannot stat or list in `BuildStats.unreadable` and keeps a configured root's row when its root was not
scanned or the row lies inside an unreadable path; `contains`, now exported from `lib/sources.ts`; and, in
`bin/nana-knowledge.ts`, the UNREADABLE build lines, the rebuild wording and `rootStatus`. The Claude Code knowledge
hook and pi's knowledge extension start this build in the background once the index is over an hour old. The new
checks sit in `packages/nana-knowledge/tests/unreadable-root.test.mjs`, which denies folders by chmod 000, or by an
icacls deny on Windows, and undoes the denial in a `finally`.

Judge whether the lane fails open: a row purged that main would keep (a missing root's, or a file's under a folder
that lists), a row kept that should go (a root dropped from `sources.json`, a file really deleted from a scanned
folder), the build or status exiting non-zero or throwing where main exited 0, or the hook's detached build crashing
or hanging. Judge whether it leaves a harm the review standard lists: index data lost or corrupted, a broken hook or
install, or a test writing outside the temp folders it owns or leaving a denied folder behind. Judge whether anything
main does today stopped working: incremental and full builds, the MISSING line, status, setup's read of the build
summary, the hook's pull and background build, the pi extension's child, and the install check, on macOS, Linux and
Windows. Known gaps the seat records as residuals: on Windows CI the five denial checks skip, because the hosted
runner's account lists a folder behind the deny, so only macOS and Linux prove the fix; a folder with read but no
execute permission still purges its files; an unlistable discover parent still purges its discovered roots' rows, as
main does; a file really deleted under an unlistable folder stays searchable until the folder lists again; the walker's
two stat guards (M4, M5) are unpinned. Judge whether any of these is a harm the standard lists or a known bug.

Threat model: honest variation in our tools' output and the OS is in scope: POSIX modes, macOS privacy denial,
Windows deny rules, offline or missing folders and temp paths of any spelling, on macOS, Linux and Windows under Node 22.
Deliberate forgery is out, including a hostile filesystem and a forged index. Lane class: install, hook or gate —
`lib/build.ts` is the background build both seats' knowledge hooks start, and the CLI is the Claude Code hook command
and the pi extension's child.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Merge note (the seat, after this brief was written)

Since `81eb7496`, the seat committed `61573a27` (it replaces home paths in the builder's committed build-2 output with placeholders; no other change) and merged main `8a9ff9a3` (readme-windows-checklist landed: the setup README's Windows checklist and its rehearsal; no knowledge file). Lanes land by fast-forward, so main is contained before this lane lands. Review this lane's own change as `git diff 8a9ff9a3...HEAD` (three dots) and the merge as `git show --remerge-diff e2fa063c`. The merge helper resolved HANDOFF and the session file (both sides' lines kept) and regenerated the tree and code map. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 8a9ff9a3`):

```
tree movement 8a9ff9a..e2fa063: 8 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-207 untested -> implemented
  R-883 untested -> implemented
  R-1910 new (implemented)
  R-1911 new (implemented)
  R-1912 new (implemented)
  R-1913 new (implemented)
  R-1914 new (implemented)
  R-1915 new (implemented)
```
