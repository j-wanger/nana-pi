# Review — win-hook-settings-repair (on Windows, install repairs Claude Code hook settings carried from a Mac or Linux home: each nana hook ends in exec form naming this checkout, with one verifier under `Bash|PowerShell`), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff d4423eff..HEAD` on `feat/win-hook-settings-repair` (main was `d4423eff` when the lane branched; `git
merge-base HEAD main` is `d4423eff`). Main has since moved to `bffa2f2d` (readme-windows-checklist,
knowledge-unreadable-root and hook-output-fail-open landed; none changed `packages/nana-setup/lib/settings.mjs`), so
the land needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/win-hook-settings-repair-2026-10-19/must-meet.md`: eight must-meet checks, rows R-1880 to R-1885 (block
R-1880 to R-1889) and a pin on R-653, fixtures F1 to F4 and the known limits. `plan-attack.md` holds the adversary's
AMEND; `build-brief-1.md` is build 1 (14844fc6, merged with main at 805d225a), and `build-brief-2.md` is build 2
(dc56f0d8), which fixed the independent check's F1 and pinned the four surviving pairs as rows R-1886 to R-1889, three
more checks. The seat's record is `seat-verify-dc56f0d8.md`: CI run 39361563148 on draft pull request #91, 0 failing
files on macOS and Ubuntu and one on Windows, main's mutation-runner lock check (the Windows suite log
`ci-windows-dc56f0d8.log` beside it); the wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-805d225a.txt`: 9 of
13 red, M10 to M13 survived; `seat-mutate-output-dc56f0d8.txt`: 14 of 14 red, 0 survived; pairs run on macOS with
win32 forced); and the independent check (`independent-check-805d225a.md`: HOLDS, no MUST, eight probes, run on build
1; its F1 fixed in build 2, which it did not re-run on). No code or test changed after dc56f0d8. The local macOS
install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement d4423ef..f78ece8: 10 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-1880 new (implemented)
  R-1881 new (implemented)
  R-1882 new (implemented)
  R-1883 new (implemented)
  R-1884 new (implemented)
  R-1885 new (implemented)
  R-1886 new (implemented)
  R-1887 new (implemented)
  R-1888 new (implemented)
  R-1889 new (implemented)
```

CAP-04 moves from 387 to 397 rows, FEAT-013 from 130 to 140 and SUB-013 from 22 to 32. R-316's evidence gains the
win32 exception and R-653's gains the look-alike pin; the report does not list evidence changes.

The code under review: in `packages/nana-setup/lib/settings.mjs`, two win32-only `installerTarget` forms
(`posix-shell` for the five Node hooks under the POSIX installer's default hooks folder, `POSIX_INSTALLER_HOOKS_SUFFIX`;
`posix-unquoted` for the first installer's unquoted knowledge command), each requiring a byte-equal command; and the
win32 verifier pass in `mergeRepoHooks`, which scans `POSIX_VERIFIER_MATCHER` groups, splices timeout-5
installer-shaped verifiers, drops only a group its own splice emptied, appends one exec-form verifier under
`WIN_VERIFIER_MATCHER` only when no installer-shaped one is there, and sets `replaced` from the move. The header rules
comment, the setup README's hooks row, its "Install never removes or reorders" bullet and its tests table follow. The
checks sit in the new `packages/nana-setup/tests/win32-hook-repair.test.mjs`, eleven checks under forced win32.

Judge whether, on Windows, one install over a settings.json whose nana entries the POSIX installer wrote for another
home leaves each nana hook in exec form naming this checkout, with exactly one installer-shaped verifier under
`Bash|PowerShell`; whether doctor then reads all six settings rows ✓ and a second install changes no bytes; and
whether every owner entry stays byte-identical and in order: foreign entries in the `Bash` group, an owner's empty
`Bash` group, the F4 look-alikes and an owner verifier look-alike under `Bash|PowerShell`. Judge whether POSIX install
and doctor output is unchanged. Judge too whether each check would fail with its behaviour removed: the seat's pairs
cover macOS with win32 forced; on Windows, CI shows all eleven checks pass natively, but no pair ran there.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; a settings.json
copied or synced from a Mac or Linux home; the first pre-release installer's unquoted knowledge entry; the doubled
verifier today's install leaves); deliberate forgery is out (an owner entry that copies nana's exact timeout, status
message, quoting and `.claude/hooks/` folder is claimed as nana's). Lane class: install, hook or gate — it changes
nana-setup install's settings merge.

Check: (1) the must-meet checks and build 2's three are not vacuous: each named pair turns its check red, and the
R-1883 and R-653 pins catch the wrong codes the plan names; (2) no owner entry is lost, reordered or rewritten, and the
one exception, the verifier move out of `Bash`, matches R-316's recorded exception and R-1881, R-1882 and R-1886 to
R-1889; (3) no install leaves a home with no nana verifier, and none leaves two installer-shaped ones; (4) nothing main
does today stopped working: POSIX install and doctor, a healthy win32 home, uninstall's exact-desired-hook removal,
and the existing settings, degrade, stale-copies and install test files on all three legs; (5) the test writes only
inside the temp homes it owns and cleans up; (6) HANDOFF and the session entry are true, including the removed
doubled-verifier line, the new residuals and the independent check's build; (7) any MUST.

## Chain note (the seat, after this brief was written)

Since `17c1ce4b`, the seat merged `531ff1ec`, the win-silent-skips lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `531ff1ec` becomes main before this lane lands. Review this lane's own change as `git diff 531ff1ec...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff d6307224` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 531ff1ec`):

```
tree movement 531ff1e..d630722: 10 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-1880 new (implemented)
  R-1881 new (implemented)
  R-1882 new (implemented)
  R-1883 new (implemented)
  R-1884 new (implemented)
  R-1885 new (implemented)
  R-1886 new (implemented)
  R-1887 new (implemented)
  R-1888 new (implemented)
  R-1889 new (implemented)
```
