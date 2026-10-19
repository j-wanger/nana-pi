# Review — win-path-commands (on Windows, install puts pi-review, pi-worker, nana-land and nana-setup on the path as sh and .cmd launchers), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff 22ccd849..HEAD` on `feat/win-path-commands` (the lane's base is `22ccd849`, and `git merge-base HEAD
main` is `22ccd849`; main has since moved to `cb1a5b57` with two lands this lane has not merged, review-ledger-run-reviewer
and adopt-structure-markers). The plan of record is `docs/reviews/win-path-commands-2026-10-19/must-meet.md`: eight
must-meet checks, rows R-1610 to R-1617, plus R-1618, which `build-brief-2.md` added after the independent check.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` to `build-brief-4.md` are the four builds. The seat's
record is `seat-verify-03f1faf.md`: CI run 39332394588 on macOS, Ubuntu and Windows (`ci-windows-run-4.log` beside it),
the macOS wrong-code pairs (`seat-mutate.mjs`; 19 of 19 red on f7c5db53 and on a73e8a1, 0 survived, three declared
items), the Windows-only pairs run in place on CI's Windows leg (`seat-mutate-win.mjs`, `win-pairs.mjs`;
`seat-mutate-win-output-03f1faf.txt`: 5 of 5 red) and the independent check (`independent-check-03f1faf.md`: run at
f7c5db53, HOLDS, no MUST; its two known bugs fixed in build 2). The final reviewer's brief is `review-brief.md`.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run before the seat's notes commit, which
changes no row):

```
tree movement 22ccd84..c39bda8: 13 rows in 3 features
FEAT-013 · Install and connect harness runtimes
  R-589 text changed; also applies: FEAT-015
  R-995 implemented -> retired
  R-1610 new (implemented)
  R-1611 new (implemented)
  R-1612 new (implemented)
  R-1613 new (implemented)
  R-1614 new (implemented)
  R-1615 new (implemented)
  R-1616 new (implemented)
  R-1617 new (implemented)
  R-1618 new (implemented)
FEAT-015 · Diagnose the active environment
  R-1072 text changed
FEAT-019 · Release usable templates and report support
  R-684 text changed
```

The code under review: `packages/nana-setup/lib/win-shims.mjs` (new), which renders the launchers every Windows owner
will type through; `lib/fsops.mjs`, whose new `writeBytesWithBackup` now also carries linkFile's copy branch, the path
every win32 rule and skill copy takes; `lib/steps.mjs` (stepPath's win32 branch and its PATH-check line);
`lib/doctor.mjs` (`winShimState`, the win32 PATH rows and the new `PATH resolves pi-review` row);
`lib/install-check.mjs` and `lib/install-check-config.mjs` (the bin folder first on win32; the win32 note list);
`lib/state-manifest.mjs` (four `.cmd` rows); the Support line in three front doors and the two READMEs' Windows
paragraphs. Tests: `tests/win-shims.test.mjs` (new) and edits in five existing test files.

Judge whether the lane fails open: doctor reading ✓ for a launcher that is missing, stale, linked or not first on PATH;
the install check passing a Windows install whose PATH rows are wrong; a `.cmd` launcher that runs a node other than the
first `node.exe` on PATH, keeps reading a launcher its bin rewrote, or exits 0 when no node is found. Judge whether it
leaves a harm the review standard lists: an owner's hand-written file at a launcher path lost or written through a
symlink, a dry run that writes, a broken install or doctor on any platform, or a test writing outside its temp folders
and temp homes. Judge whether anything main does today stopped working: the POSIX PATH symlinks and their doctor rows
and exit codes on macOS and Linux; win32 install's other steps and its rule and skill copies after the copy-branch
refactor, whose dry-run wording over a link changed (unpinned, a HANDOFF residual); the install check on both legs;
uninstall's refusal on win32; the state manifest. On a Windows real home without the bin folder on the user Path, doctor
now exits 1 where main printed notes; judge whether that change, and the plan's known limits HANDOFF records (the shells'
argument limits, the other-drive form under the console code page, backups, Windows uninstall leaving the launchers),
are harms the standard lists or known limits.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; Git Bash, cmd.exe
and Windows PowerShell 5.1; hostile arguments and folder names; a `node.cmd` in the caller's folder; a hand-written file
or a symlink at a launcher path; install rewriting its own running launcher; another `pi-review.cmd` earlier on PATH;
the console code page). Deliberate forgery is out (a planted `node.exe` on PATH, a deliberate edit that keeps a
launcher's bytes, registry settings made to break cmd.exe). Lane class: install, hook or gate — nana-setup install and
doctor, and the install check.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.
