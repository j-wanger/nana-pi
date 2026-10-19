# Review — stale-copies-hooks (each Claude Code session start names a broken nana hook and the skill paths install refuses), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 22ccd849..HEAD` on `feat/stale-copies-hooks` (`git merge-base HEAD main` is `22ccd849`, which was
main when CI ran; main has since moved to `02f1c139`, the review-ledger-run-reviewer land, and this lane has not
merged it). The plan of record is `docs/reviews/stale-copies-hooks-2026-10-19/must-meet.md`: six must-meet checks,
rows R-1760 to R-1765, with R-1601 and R-1602 retired as superseded; build 2 added R-1766. `plan-attack.md` holds the
adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two builds. The seat's record is
`seat-verify-1565bb0.md`: CI run 39332152070 on macOS, Ubuntu and Windows (`ci-windows-run-2.log` beside it), the
macOS wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-f089623a.txt`: 15 of 16 red, M6 survived and became
build 2's first finding; `seat-mutate-output-1565bb0.txt`: 17 of 18 red, M18 survived and recorded as a residual) and
the independent check (`independent-check-f089623a.md`: HOLDS, no MUST, run on build 1 f089623a, not on 1565bb0; its
one known bug is fixed in build 2 with R-1766). The final reviewer's brief is `review-brief.md`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement 22ccd84..51e2423: 9 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-1601 implemented -> retired
  R-1602 implemented -> retired
  R-1760 new (implemented)
  R-1761 new (implemented)
  R-1762 new (implemented)
  R-1763 new (implemented)
  R-1764 new (implemented)
  R-1765 new (implemented)
  R-1766 new (implemented)
```

The code under review: `packages/nana-setup/bin/stale-copies.mjs`, which the Claude Code adoption hook runs at every
session start. It now also reads hook link and hook settings rows from the new `lib/hook-health.mjs`, the same rows
doctor now reads, moved verbatim from `lib/doctor.mjs`. When any row fails, it runs install's skill step as a dry run,
`stepSkills(layout, { dryRun: true })`, and names as paths to move each existing skill path both that dry run and
doctor fail, or the linked Claude home or skills folder once. `lib/stale-copies.mjs` renders the move clause on the
same line, before the install command; with no paths the line is main's byte for byte. The nana-setup README changes
two lines. The checks sit in `tests/stale-copies.test.mjs`.

Judge whether the lane fails open: a broken hook link or hook settings entry doctor marks ✗ that the line does not
name; a failure in the new producer code that leaves the adoption hook silent rather than printing the unavailable
line; a line that tells the user to move a healthy skill, a path outside the home's Claude folder, or a path that does
not exist. Judge whether it leaves a harm the review standard lists: data lost or corrupted (install's skill step run
for real at session start, so the hook relinks or rewrites the owner's skills; or advice that would lose the owner's
folder, where the line should say move, never delete); a broken install or hook (a crash, more than one line, or a session start pushed
toward Claude Code's five-second hook limit); or a test writing outside its temp homes and scratch folders. Judge
whether anything main does today stopped working: the adoption hook's output on a healthy home and on a home where
nana-setup never installed, the rules and skills line, the pi rulings extension's stale section, the unavailable
marker, doctor's rows, statuses, order and exit codes, and install. The plan's known limits that HANDOFF records (the
check goes silent with the adoption hook or an unparseable settings file; settings problems install will not fix
repeat the line; a retired copy whose backup exists repeats it; the unpinned existing-path guard) are known limits
unless the review standard lists them as harms.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows, native and
forced through NANA_SETUP_PLATFORM; a pull that adds or changes a hook; a hand edit; an interrupted install; POSIX links
against Windows copies; a folder, file or link the owner put at a skill path; a linked Claude home or skills folder);
deliberate forgery is out. Lane class: install, hook or gate — doctor and the producer the Claude Code adoption hook
runs.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Chain note (the seat, after this brief was written)

Since `dc636146`, the seat merged `cb1a5b57`, the adopt-structure-markers lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `cb1a5b57` becomes main before this lane lands. Review this lane's own change as `git diff cb1a5b57...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff f76c44f6` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base cb1a5b57`):

```
tree movement cb1a5b5..f76c44f: 9 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-1601 implemented -> retired
  R-1602 implemented -> retired
  R-1760 new (implemented)
  R-1761 new (implemented)
  R-1762 new (implemented)
  R-1763 new (implemented)
  R-1764 new (implemented)
  R-1765 new (implemented)
  R-1766 new (implemented)
```
