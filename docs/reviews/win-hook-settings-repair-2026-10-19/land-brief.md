# Review — win-hook-settings-repair (on Windows, install repairs Claude Code hook settings carried from a Mac or Linux home: each nana hook ends in exec form naming this checkout, with one verifier under `Bash|PowerShell`), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff d4423eff..HEAD` on `feat/win-hook-settings-repair` (main was `d4423eff` when the lane branched; `git
merge-base HEAD main` is `d4423eff`). Main has since moved to `bffa2f2d` (readme-windows-checklist,
knowledge-unreadable-root and hook-output-fail-open landed; none changed `packages/nana-setup/lib/settings.mjs`), so
the land needs a merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/win-hook-settings-repair-2026-10-19/must-meet.md`: eight must-meet checks, rows R-1880 to R-1885 and a
pin on R-653. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` and `build-brief-2.md` are the two
builds (14844fc6, merged with main at 805d225a; dc56f0d8, which adds rows R-1886 to R-1889). The seat's record is
`seat-verify-dc56f0d8.md`: CI run 39361563148 on macOS, Ubuntu and Windows, 0 failing files on macOS and Ubuntu and
one on Windows, main's mutation-runner lock check (`ci-windows-dc56f0d8.log` beside it); the macOS wrong-code pairs
with win32 forced (`seat-mutate.mjs`; 14 of 14 red on dc56f0d8, 0 survived; 9 of 13 on 805d225a); and the independent
check (`independent-check-805d225a.md`: HOLDS, no MUST, eight probes, run on build 1; its F1 fixed in build 2). The
final reviewer's brief is `review-brief.md`. The local macOS install check runs before the land.

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

The code under review: two win32-only `installerTarget` forms and the win32 verifier pass in `mergeRepoHooks`, both
in `packages/nana-setup/lib/settings.mjs`, which `nana-setup install` runs over the owner's user-scope
`~/.claude/settings.json`; the header rules comment; and the setup README's hooks row, its "Install never removes or
reorders" bullet and its tests table. The checks sit in the new `packages/nana-setup/tests/win32-hook-repair.test.mjs`.

Judge whether the lane fails open: an install that leaves a Windows home with no nana verifier, so a piped test run
before a commit goes unasked, for example by removing the `Bash` verifier and appending none, or by taking an owner
look-alike under `Bash|PowerShell` for nana's; or a repair computed but never written. Judge whether it leaves a harm
the review standard lists: an owner's settings entry or group lost, reordered or rewritten (the verifier move out of
`Bash` is the one recorded exception, R-316); a broken install or hook (an entry Claude Code cannot start, a second
install that keeps rewriting); or a test writing outside the temp homes it owns. Judge whether anything main does
today stopped working: POSIX install and doctor output, a healthy win32 home, doctor's six settings rows, uninstall's
exact-desired-hook removal and the session-start stale-copy line, on any of the three CI legs. The plan's known limits
that HANDOFF records (the mirror case on a Mac; the custom-folder, double-quoted, checkout-folder and backslash shapes
left in place; the unpinned exec-form move; the `created added` wording; the `.sh` entries; Claude Code's firing
inferred; the independent check on build 1 only, with the pairs on macOS only) are known limits unless the review
standard lists them as harms.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; a settings.json
copied or synced from a Mac or Linux home; the first pre-release installer's unquoted knowledge entry; the doubled
verifier today's install leaves); deliberate forgery is out (an owner entry that copies nana's exact timeout, status
message, quoting and `.claude/hooks/` folder is claimed as nana's). Lane class: install, hook or gate — it changes
nana-setup install's settings merge.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

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
