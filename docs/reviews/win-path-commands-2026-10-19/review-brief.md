# Review — win-path-commands (on Windows, install puts pi-review, pi-worker, nana-land and nana-setup on the path as sh and .cmd launchers), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff 22ccd849..HEAD` on `feat/win-path-commands` (the lane's base is `22ccd849`, and `git merge-base HEAD
main` is `22ccd849`; main has since moved to `cb1a5b57` with two lands this lane has not merged, review-ledger-run-reviewer
and adopt-structure-markers). The plan of record is `docs/reviews/win-path-commands-2026-10-19/must-meet.md`: eight
must-meet checks, rows R-1610 to R-1617 (block R-1610 to R-1619), plus R-1618, which `build-brief-2.md` added after the
independent check. `plan-attack.md` holds the
adversary's AMEND; `build-brief-1.md` to `build-brief-4.md` are the four builds. The seat's record is
`seat-verify-03f1faf.md`: CI run 39332394588 on all three legs (the Windows log `ci-windows-run-4.log` beside it), the
macOS wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-f7c5db53.txt` and `seat-mutate-output-a73e8a1.txt`: 19 of
19 red each, 0 survived, three declared items), the Windows-only pairs run in place on CI's Windows leg
(`seat-mutate-win.mjs`, `win-pairs.mjs`; `seat-mutate-win-output-03f1faf.txt`: 5 of 5 red) and the independent check
(`independent-check-03f1faf.md`: run at f7c5db53, HOLDS, no MUST; its findings settled as the record says). Product code
last changed in db142db4; builds 3 and 4 changed tests and docs only.

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

R-937's and R-1081's evidence cells also changed; their requirement text did not.

The code under review: `packages/nana-setup/lib/win-shims.mjs` (new; renders the LF sh launcher and the CRLF `.cmd`
launcher from npm cmd-shim 7.0.0's layout, with a quoted `dp0`, a `node.exe` PATH lookup that exits 1 to stderr when
none is found, and a `%dp0%`-relative bin on the same drive, absolute otherwise, every `%` doubled); `lib/fsops.mjs`
(`writeBytesWithBackup`, which linkFile's copy branch now calls); `lib/steps.mjs` (stepPath's win32 branch and its
PATH-check predicate); `lib/doctor.mjs` (`winShimState`, the win32 PATH rows and the new `PATH resolves pi-review` row);
`lib/install-check.mjs` and `lib/install-check-config.mjs` (the bin folder first on win32; the win32 note list);
`lib/state-manifest.mjs` (four `.cmd` rows); the Support line in AGENTS.md, README.md and the setup README; the setup
README's Windows paragraph and tests table; the pack README's Windows paragraph. Tests: `tests/win-shims.test.mjs` (new),
and edits in `win32-degrade`, `install`, `install-check`, `state-manifest` and `templates-render`.

Judge whether, on win32, install writes this checkout's sh and `.cmd` launchers for the four commands, leaves
byte-equal ones unchanged and backs up a differing file first (R-1610); whether the sh launcher hands node every
argument and the exit status unchanged (R-1611) and runs none of a self-rewrite (R-1617); whether the `.cmd` launcher does
the same from cmd.exe on the PATH node (R-1612) and from Windows PowerShell (R-1613), runs none of a self-rewrite
(R-1614), and with no node.exe on PATH exits 1 with its message only on stderr (R-1618); and whether doctor marks each
command ✓ only when both launchers match (R-1615) and `PATH resolves pi-review` ✓ only when the bin folder's `.cmd` is
found first (R-1616). Judge too whether each check would fail with that behaviour removed: the seat's 19 macOS pairs
and 5 Windows pairs say yes, except that no pair ran for R-1616's match.

Three points the seat flags. (a) R-1612 now also asserts that the absolute form fails under code page 437 with `é` in
the bin path. That pins a known limit: a fix for the other-drive case must restate the check. Judge whether that is the
right pin. (b) The cmd callers force `chcp 437`, so the shipped relative form is proven under that page only. A
non-ASCII letter in the relative part, such as a checkout folder's own name, would face the same code-page read; the
seat infers this and has not run it. (c) On a Windows real home without the bin folder on the user Path, doctor now
exits 1 where main printed notes. The plan intends this as the win32 twin of R-953.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; Git Bash, cmd.exe
and Windows PowerShell 5.1; arguments with spaces, both quote kinds, `% & ^ ! ( ) | < >`, a line break, an empty one
and an `@<full path>` brief; folder names with a space, `&`, `%`, parentheses, `'`, `$` or a non-ASCII letter; a
`node.cmd` in the caller's folder; a hand-written file or a symlink at a launcher path; install rewriting its own
running launcher; another `pi-review.cmd` earlier on PATH; the console code page). Deliberate forgery is out (a planted
`node.exe` on PATH, a deliberate edit that keeps a launcher's bytes, registry settings made to break cmd.exe). Lane
class: install, hook or gate — nana-setup install and doctor, and the install check.

Check: (1) the must-meet checks are not vacuous, each failing with its behaviour removed; (2) win32 install never writes
through a symlink, never loses a hand-written file, and writes nothing on `--dry-run`; (3) the two renderings: argument
and exit-status handoff, the `'` and `%` escaping, the relative or absolute choice, the line ends, the `node.exe` lookup
and the no-node path; (4) doctor's win32 rows: ✓ only when true, ✗ and exit 1 otherwise, a note under `--home`, and the
remedy text; (5) on macOS and Linux, install, doctor, uninstall and the install check behave as on main; (6) the seat's
points (a) to (c); (7) the README and Support-line sentences match the code and must-meet's known limits; (8) the new
checks write only inside their temp folders and temp homes; (9) HANDOFF and the session entry are true; (10) any MUST.

## Chain note (the seat, after this brief was written)

Since `194ae068`, the seat merged `f497c5ad`, the stale-copies-hooks lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `f497c5ad` becomes main before this lane lands. Review this lane's own change as `git diff f497c5ad...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff bd39d08d` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base f497c5ad`):

```
tree movement f497c5a..bd39d08: 13 rows in 3 features
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
