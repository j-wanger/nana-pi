# Review — doctor-path-row-remedy (doctor gives the pi-review PATH row to install when the bin folder is already on PATH and only the launcher is missing), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 5ef07f7f..HEAD` on `feat/doctor-path-row-remedy` (main was `5ef07f7f` when this brief was written;
`git merge-base HEAD main` is `5ef07f7f`). Main was `72abe19a` when the lane branched; the seat merged `5ef07f7f`, the
objective-path-shapes land tip, at `333767cf`, and that lane has since landed by fast-forward. The plan of record is
`docs/reviews/doctor-path-row-remedy-2026-10-20/must-meet.md`: six must-meet checks, rows R-2320 to R-2325.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is build 1 (452cd604); build 2 (a63d9ecf, no brief
file) only moved each new check's title onto its `check(` line. The seat's record is `seat-verify-a63d9ecf.md`: CI run
39442784960 at a63d9ecf, 0 failing files on macOS, Ubuntu and Windows (`ci-windows-a63d9ecf.log` beside it;
doctor-fix-line passes 15 on native Windows), the macOS wrong-code pairs (`seat-mutate.mjs`; 12 of 12 red on
452cd604), the Windows-only pairs on a scratch Windows CI job (3 of 4 red, W2 a declared survivor,
`seat-mutate-win-output-3005686b.txt`) and the independent check (`independent-check-a63d9ecf.md`: HOLDS, no MUST, ten
probes, run on 452cd604). The final reviewer's brief is `review-brief.md`. CI has not run on 333767cf or the notes
commit; the seat ran the must-meet file on 333767cf (14 checks PASS). The land runs the locked suite on the reviewed
tip, and the local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 5ef07f7f`; run at 333767cf, before the seat's notes
commit):

```
tree movement 5ef07f7..333767c: 6 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2320 new (implemented)
  R-2321 new (implemented)
  R-2322 new (implemented)
  R-2323 new (implemented)
  R-2324 new (implemented)
  R-2325 new (implemented)
```

The code under review: `packages/nana-setup/lib/doctor.mjs` `diagnose`, the PATH section's win32 and POSIX branches,
which every doctor run on the real home goes through. When the `PATH resolves pi-review` row is wrong, the bin folder
is a PATH entry (in any letter case on Windows) and no earlier entry holds a pi-review, the row now says the bin folder
is on PATH and to run `nana-setup install`, and it carries installLabel `PATH pi-review`, so install's dry run decides
whether the last line gives it to install. Every other case keeps main's add-to-PATH detail and lists the row by hand.
`nana-setup.mjs`, `steps.mjs` and `fsops.mjs` are unchanged. Tests: R-2320 to R-2325 in
`packages/nana-setup/tests/doctor-fix-line.test.mjs`; the setup README's dry-run paragraph states the new rule.

Judge whether the lane fails open: a ✗ row given to install that install cannot fix (the user runs install and the row
stays ✗), a by-hand row hidden from the last line, a ✗ row that now reads ✓ or an exit code that changed, or a check
that passes with the change removed (R-2322 and R-2324 pass on main by design as guards; the pairs M1, M2, M3, M9, M10
and W1 turn them or R-1993 red). Judge whether it leaves a harm the review standard lists, such as a broken doctor or
install on any platform, data lost in the bin folder, or a test writing outside its temp folders and temp homes or
leaving PATH changed. Judge whether anything main does today stopped working: the healthy row, the off-PATH row and its
by-hand listing, doctor's other last-line forms (R-1990 to R-1997), doctor-runtime, win-shims, and both CI install-check
legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: install's PATH
check compares exact strings, so a trailing-slash or doubled-slash entry makes doctor say run install while install
says the folder is not on PATH (the launcher is still created; independent check P3); an entry through a linked parent
counts as off PATH and gets today's advice (P6); an earlier pi-review still gets the add-to-PATH advice; on Windows a
pi-review .bat or .exe in the bin folder found before .cmd still counts as install's repair; on macOS and Linux an
intact link to a target that cannot run gets the run-install advice while the last line lists it by hand; the zsh
command names `$HOME/.local/bin` for any bin folder, as on main; no check sets the environment key spelled `Path` (pairs
survivor W2); padded, quoted or trailing-slash entries and a launcher linked to another checkout are unpinned. The
macOS pairs and the independent check ran on macOS only, with win32 forced where noted, so CI is the only Linux and
native Windows run besides the four Windows pairs.

Threat model: honest variation in our tools' output and the OS is in scope (the bin folder on or off PATH, another
pi-review before or after it, a Windows Path entry in another letter case, padded or quoted; macOS, Linux and Windows);
deliberate forgery is out, such as a pi-review planted to fool the lookup.
Lane class: install, hook or gate — nana-setup doctor's `PATH resolves pi-review` row and its last line.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Chain note (the seat, after this brief was written)

Since `74dc945e`, the seat merged `62f00a1d`, the win-copy-backup-noise lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `62f00a1d` becomes main before this lane lands. Review this lane's own change as `git diff 62f00a1d...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 06a39914` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 62f00a1d`):

```
tree movement 62f00a1..06a3991: 6 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-2320 new (implemented)
  R-2321 new (implemented)
  R-2322 new (implemented)
  R-2323 new (implemented)
  R-2324 new (implemented)
  R-2325 new (implemented)
```
