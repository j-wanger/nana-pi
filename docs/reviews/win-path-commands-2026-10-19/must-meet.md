# win-path-commands — must-meet

Feature: FEAT-013 · Install and connect harness runtimes
Class: install, hook or gate (install and doctor). Full ladder: final reviewer, land reviewer or seat-land.md, wrong-code pairs through the mutation runner, one independent check; install check locally before nana-land; Windows CI leg evidence (R-1612, R-1613, R-1614 and R-1616 run only there).

## Feature
WHERE the platform is win32 and the bin directory is on PATH, after install pi-review, pi-worker, nana-land and nana-setup run by bare name from Git Bash, cmd.exe and Windows PowerShell, handing node this checkout's bin with the arguments and exit status unchanged; doctor reads ✓ only when that holds.

## Threat model
In scope (honest variation): the three shells; arguments with spaces, both quote kinds, `% & ^ ! ( ) | < >`, a line break, an empty argument and an `@<full path>` brief; folder names holding a space, `&`, `%`, parentheses, `'`, `$` or a non-ASCII letter; a `node.js` in the caller's folder; a hand-written file at a shim path; install rewriting its own running shim; another `pi-review.cmd` earlier on PATH. Out: a forged `node.exe` planted on PATH, a deliberate edit that keeps a shim's bytes, registry settings made to break cmd.exe.

## Design
- New `packages/nana-setup/lib/win-shims.mjs` (six-tag header, effects none) renders two texts for one bin file and the bin directory:
  - sh, LF: `#!/bin/sh` then `exec node '<absolute bin>' "$@"` (a `'` written `'\''`). `exec` replaces the shell, so a rewrite of the running shim is never read. Git Bash runs it by bare name; cmd.exe and PowerShell ignore an extensionless file.
  - .cmd, CRLF: npm cmd-shim 7.0.0's layout (find_dp0 subroutine, SETLOCAL, `endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & … %*`) with two changes: `SET "dp0=%~dp0"` quoted (a `&` in the folder), and `_prog` = the `node.exe` that `%%~$PATH:I` finds, with a named failure when PATH has none (npm's `SET "_prog=node"` searches the caller's folder first). The bin is `"%dp0%\<relative path>"` when it shares a drive with the bin directory, else absolute; every `%` in the embedded path is doubled. The goto line ends batch reading before node starts.
  - Suffixes, line ends and the layout are contract values with provenance (npm cmd-shim 7.0.0, read 2026-10-19).
- stepPath on win32 writes both shims for the four commands through one fsops function factored out of linkFile's copy branch: byte-equal is unchanged; a differing regular file goes to `<name>.bak-<date>` first; a symlink is replaced, never written through.
- doctor on win32: each `PATH <command>` row ✓ when both shims equal the rendering, else ✗ (exit 1). New row `PATH resolves pi-review`, the win32 twin of R-953, through win-command.mjs findOnPath (PATH and PATHEXT): ✗ on the real home, a note under --home; the remedy names the user Path in Environment Variables, never `setx`. Install's PATH-check line uses the same predicate.
- install-check puts the bin folder first on win32 too, under the existing Path key, joined with `;`; DOCTOR_NOTES.win32 drops the four PATH labels.
- No .ps1: under PowerShell's default Restricted policy a .ps1 shim refuses to run and PowerShell does not fall back to the .cmd.
- Node: the node.exe PATH holds at run time, as the win32 hook entries do; process.execPath would strand a shim after a version-manager switch.

## Must-meet
| Row | Test (file::title) | Red today |
|---|---|---|
| R-1610 | packages/nana-setup/tests/win32-degrade.test.mjs::win32 install leaves an sh and a .cmd shim for each PATH command, rewriting only what differs and backing up a hand-written file | Yes. Probe on main, forced win32, temp home: four `skipped (win32)` PATH rows, no bin folder |
| R-1611 | packages/nana-setup/tests/win-shims.test.mjs::sh shim hands node every argument unchanged and returns the bin's exit status | Yes: no renderer (import fails). Prototype under macOS /bin/sh: 8 hostile args round-trip, exit 7; CRLF, `$*` and a double-quoted bin path each fail |
| R-1612 | packages/nana-setup/tests/win-shims.test.mjs::Windows: cmd.exe hands a .cmd shim's bin every double-quoted argument unchanged on the PATH node and returns its exit status | By reading: no .cmd on main. Windows leg only |
| R-1613 | packages/nana-setup/tests/win-shims.test.mjs::Windows: PowerShell hands a .cmd shim's bin every spaced argument unchanged and returns its exit status | As R-1612 |
| R-1614 | packages/nana-setup/tests/win-shims.test.mjs::Windows: a .cmd shim rewritten by its own bin runs none of the new text | As R-1612 |
| R-1615 | packages/nana-setup/tests/win32-degrade.test.mjs::win32 doctor reads each PATH command ✓ only when both its shims are this checkout's | Yes. Probe: forced-win32 doctor prints the four rows `· skipped (win32)` |
| R-1616 | packages/nana-setup/tests/win-shims.test.mjs::Windows: doctor reads PATH resolves pi-review ✓ only when the bin directory's .cmd shim is found first | Main's win32 doctor prints no such row. Windows leg only |
| R-1617 | packages/nana-setup/tests/win-shims.test.mjs::an sh shim rewritten by its own bin runs none of the new text | Yes: no renderer. Probe, macOS /bin/sh: with `exec` status 7, 0 markers; without it status 0, 192 markers |

Skips: R-1612, R-1613, R-1614 and R-1616 need cmd.exe, Windows PowerShell's batch launch and the PATHEXT search, which exist only on Windows; each prints one named SKIP line elsewhere. R-1611 and R-1617 run under /bin/sh on POSIX and Git Bash on Windows (one named SKIP if Git Bash is absent).

## Old contract text (changes here)
- R-995 retired (R-1610 replaces it). R-589 drops "report the link skipped on win32". R-937's evidence drops the four PATH rows. R-1072 drops "except on win32". R-1081's note-list pin drops four labels. R-684 (after win-leg-flip): "no PATH command" becomes "PATH commands as shims that need the bin folder on PATH".
- The Support line in AGENTS.md, README.md, packages/nana-setup/README.md and canonicalSupport: "none of the pack's PATH commands are linked" becomes "the pack's PATH commands are shims that need the bin folder on PATH".
- packages/nana-setup/README.md: the four command rows, "Installer copies and skipped PATH commands", "without the PATH-link step". packages/nana-pack/README.md: "Until the queued PATH lane links".
- install.test.mjs's Windows-branch "not installed on win32" checks; win32-degrade's R-995, R-589 win32 and "no ~/.local/bin entry" checks.
Unchanged: templates/_shared's "Where pi-worker and pi-review are not on PATH (Windows)" fallback, still true; dated history.

## Known limits
- PowerShell 5.1 drops an empty argument and breaks a spaced one ending in `\`. cmd.exe changes an argument with no space but one of `& | < > ^ ( )`, an embedded double quote, or a defined `%NAME%`. Both hold for every .cmd, npm's `pi.cmd` included; use Git Bash or the node form.
- Git Bash rewrites a `/`-shaped argument as a path for any native program, `node <bin>` typed directly included.
- A non-ASCII letter in the .cmd's embedded path (below the shared folder, or a checkout on another drive) likely misreads in the console code page (inferred). Doctor still reads ✓.
- Whether `%~$PATH:` also searches the caller's folder first is unverified; a `node.exe` there would run (inferred).
- `~/.local/bin` is not on a Windows PATH by default, so doctor reads ✗ on the real home until the owner adds it.
- A changed shim text backs up the old shim, as win32 rule copies do. The install PATH-check line is not pinned. Windows uninstall stays unsupported and leaves the shims.

## Seat items (not the builder)
- Windows evidence: draft PR; R-1612, R-1613, R-1614 and R-1616 count only on a green Windows leg; run the Windows-only wrong code there as throwaway commits, or record them unrun.
- Mutation runner on the macOS pairs; install check locally; seat-land.md if the roster prints `land: seat`; requirements-moved output in the review brief and the land; HANDOFF and session lines.
