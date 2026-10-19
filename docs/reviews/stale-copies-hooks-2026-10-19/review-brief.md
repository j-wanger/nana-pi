# Review — stale-copies-hooks (each Claude Code session start names a broken nana hook and the skill paths install refuses), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 22ccd849..HEAD` on `feat/stale-copies-hooks` (`git merge-base HEAD main` is `22ccd849`, which was
main when CI ran; main has since moved to `02f1c139`, the review-ledger-run-reviewer land, and this lane has not
merged it). The plan of record is `docs/reviews/stale-copies-hooks-2026-10-19/must-meet.md`: six must-meet checks,
rows R-1760 to R-1765, with R-1601 and R-1602 retired as superseded. Build 2 added R-1766 (`build-brief-2.md`).
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two builds. The seat's
record is `seat-verify-1565bb0.md`: CI run 39332152070 on all three legs (the Windows log `ci-windows-run-2.log`
beside it), the macOS wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-f089623a.txt`: 15 of 16 red, M6
survived; `seat-mutate-output-1565bb0.txt`: 17 of 18 red, M18 survived and recorded as a residual) and the independent
check (`independent-check-1565bb0.md`: HOLDS, no MUST). The independent check ran on build 1 (f089623a), not on
1565bb0; its one known bug, impossible move paths under a linked `~/.claude`, is fixed in build 2 with R-1766. No
code or test changed after 1565bb0e.

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

The code under review: `packages/nana-setup/lib/hook-health.mjs` (new: doctor's hook-link and hook-settings loops,
moved verbatim, as labelled rows), `lib/doctor.mjs` (an import change and the two loops replaced by calls that map
those rows), `bin/stale-copies.mjs` (the producer the adoption hook runs: hook link, rule, skill and settings labels in
doctor's order; when any row fails, install's skill step as a dry run; move paths from skills both the dry run and
doctor fail, or the linked Claude home or skills folder once), `lib/stale-copies.mjs` (`staleNotice(labels,
movePaths)`, byte-identical to main's line with no paths), two lines of the nana-setup README, and
`tests/stale-copies.test.mjs`. The brief said the dry run runs only when a skill row fails; the code runs it when any
row fails.

Judge whether the adoption hook's line names exactly the hook link, hook settings, rule and skill rows doctor marks ✗,
by doctor's labels (R-1760, R-1761); whether its paths to move are exactly the skill paths both doctor and install's
dry run fail (R-1762), or the linked parent once and never a path that does not exist (R-1766); whether moving what it
names and running the install it names clears it (R-1763); whether a current install gets no line (R-1764); and whether
the hook leaves every file, folder and link in the home unchanged (R-1765). Judge too whether each check would fail
with its behaviour removed: the seat's 18 pairs cover macOS, with the win32 fixtures forced; on Windows, CI shows every
new check passes on the native win32 fixtures.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows, native and
forced through NANA_SETUP_PLATFORM; a pull that adds or changes a hook; a hand edit; an interrupted install; POSIX links
against Windows copies; a folder, file or link the owner put at a skill path; a linked Claude home or skills folder);
deliberate forgery is out (a forged settings entry, crafted special files, hostile checkout paths). Lane class:
install, hook or gate — doctor and the producer the Claude Code adoption hook runs.

Check: (1) the must-meet checks are not vacuous: each named pair turns its check red, and M18's survivor leaves only
the existing-path guard unpinned; (2) doctor's rows (label, status, detail, order) and exit codes are unchanged on POSIX
and win32; (3) the hook writes nothing in the home, because install's skill step stays a dry run; (4) the line stays
one line, names the install command last, and never names a move path outside the home's Claude folder or one that
does not exist; (5) a healthy home's hook output is byte-identical to main's, and the rulings extension is unchanged;
(6) the tests write only inside their temp homes and scratch folders, and R-1763 never moves a path outside the
fixture home; (7) the README sentences match the code and the plan's known limits; (8) HANDOFF and the session entry
are true; (9) any MUST.
