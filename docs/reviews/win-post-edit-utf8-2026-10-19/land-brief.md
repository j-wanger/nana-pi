# Review — win-post-edit-utf8 (a Python post-edit check's non-ASCII output reaches the model as printed), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-030 · Get trustworthy feedback after edits

Review `git diff f8d20142..HEAD` on `feat/win-post-edit-utf8` (main was `f8d20142` when this brief was written; `git
merge-base HEAD main` is `f8d20142`). The plan of record is `docs/reviews/win-post-edit-utf8-2026-10-19/must-meet.md`:
four must-meet checks, rows R-1740 to R-1743 (R-1744 to R-1749 stay unused). `plan-attack.md` holds the adversary's
AMEND; `build-brief-1.md` is the build. The seat's record is `seat-verify-a05d269.md`: CI run 39315128937 on macOS,
Ubuntu and Windows (`ci-windows-run-1.log` beside it), the wrong-code pairs (`seat-mutate.mjs`,
`seat-mutate-output-a05d269.txt`: 9 of 9 red, 0 survived, four declared gaps), the independent check
(`independent-check-a05d269.md`: HOLDS, no MUST) and the plan's Windows scratch run (pending when this brief was
written; the seat adds its result to the record before this review starts). The final reviewer's brief is
`review-brief.md`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement f8d2014..d0f8d38: 4 rows in 1 features
FEAT-030 · Get trustworthy feedback after edits
  R-1740 new (implemented)
  R-1741 new (implemented)
  R-1742 new (implemented)
  R-1743 new (implemented)
```

The code under review: the check's environment in `packages/nana-pack/extensions/nana-post-edit.ts`, which every pi
session, builder and reviewer loads; the pack README's post-edit bullet and Dependencies line; the new
`packages/nana-pack/tests/post-edit-utf8.test.mjs`. Every check now gets a copy of pi's environment on every platform,
plus `PYTHONUTF8=1` when pi's own value is unset or empty, plus NANA_PI_FILE on win32 as before.

Judge whether the lane fails open: a failing check that now reads as passing, a failure line dropped or cut, a check
that no longer starts, or a timeout or abort that no longer ends a check. Judge whether it leaves a harm the review
standard lists: a broken install or hook (the extension crashing on load or on a tool result, on any platform), data
lost or corrupted (a write into pi's own environment that leaks into later tools or sessions), or a test writing
outside its temp folders. Judge whether anything main does today stopped working: a check under a UTF-8 or C locale,
a non-Python check, a check that reads NANA_PI_FILE on Windows, the owner's own PYTHONUTF8, PYTHONIOENCODING, LANG and
LC_* values, the timeout and kill path, the status chip and the file queue. UTF-8 mode makes a Python check that opens
a file without naming an encoding read it as UTF-8, on Windows with Python before 3.15 and under a non-UTF-8 POSIX
locale; such a check can now fail loudly where it passed. Judge whether that trade is a harm the standard lists or the
known limit the plan and HANDOFF record.

Threat model: honest variation in our tools' output and the OS is in scope (host output encodings: the Windows ANSI
code page, Latin-1 and C locales; Python 3.7 and later; the owner's encoding and locale values; Windows'
case-insensitive environment); deliberate forgery is out (a checker that rewrites its own environment or lies about
its encoding). Lane class: install, hook or gate — a pi extension, nana-post-edit.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
