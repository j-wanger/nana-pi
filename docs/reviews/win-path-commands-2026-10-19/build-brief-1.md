# win-path-commands — build brief 1

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate. Builder: pi gpt-5.6-sol through pi-worker --lane-size larger.
Rows: R-1610 to R-1617 new (block R-1610 to R-1619). R-995 retired; R-589, R-937, R-1072, R-1081 and R-684 change. Read must-meet.md first; its Design section is the spec.
Base: main after win-leg-flip, readme-install, bom-pack-config and install-honest-report have landed.

## Change, in order
1. REQUIREMENTS.md FEAT-013 SUB-015: add R-1610 to R-1617 as `planned`, text from must-meet. Retire R-995 ("retired <date>: win32 install writes shims; R-1610 replaces it"). Edit R-589, R-937, R-1072, R-1081 and R-684 per must-meet's "Old contract text". Run `npm run req:tree`.
2. Tests first; see each new check FAIL on the unchanged code. Windows-only checks print one named SKIP on macOS.
   - win32-degrade.test.mjs, forced win32. R-1610: eight files with the rendered bytes; the installed nana-setup sh shim through sh (Git Bash on Windows) and, on Windows only, nana-setup.cmd through cmd.exe, each with --help, print usage; a second install reports the four PATH rows unchanged and keeps bytes and mtimes; a hand-written pi-worker.cmd ends in pi-worker.cmd.bak-<date> and the shim replaces it. R-1615: four ✓ and exit 0 after install; nana-land.cmd deleted gives ✗ PATH nana-land and exit 1; the pi-worker sh shim replaced by pi-review's rendering gives ✗ PATH pi-worker. Delete the R-995 check, the R-589 win32 check and "win32: no ~/.local/bin entry is created"; drop the four PATH labels from the R-937 loop.
   - New win-shims.test.mjs (six-tag header). Fixture root named with a space, &, %, (, ), ', `$a` and é holds `shims` and `bin 100%&(x)`; the stub in the latter prints `{argv, execPath}` as JSON and exits 7; with `--rewrite` it first overwrites its own shim (path from an env var) with 200 lines that each echo a marker. Shims rendered into `shims`, first on PATH; callers use the bare name. Each caller is a generated file holding the arguments (sh script, .ps1) or a verbatim `/d /s /c` line (cmd.exe), never arguments on bash.exe's own command line (MSYS2 expands `@file` and wildcards there; inferred).
     - R-1611: /bin/sh on POSIX, Git Bash (install-check.mjs findGitBash) on Windows. Args: a space, both quote kinds, `% & ^ ! ( ) | < >`, a trailing `\`, a line break, an empty one, `@<full path>` of a two-line brief in a folder with a space; on Windows none holds `/`.
     - R-1617: same runners, `--rewrite`: stdout holds no marker, status 7.
     - R-1612: every argument double-quoted, none holding `"` or ending in `\`; `100%`; an empty one; the caller's folder holds a `node.js` containing `WScript.Quit(42)` (no dialog if wrong code reaches it); execPath equals the first node.exe on PATH (real paths, any case).
     - R-1613: powershell.exe -NoProfile -ExecutionPolicy Bypass -File; no double quote, no empty argument, none ending in `\`; each holding `& | < > ^ ( )` also holds a space; read $LASTEXITCODE.
     - R-1614: as R-1617, through cmd.exe.
     - R-1616: real-home layout (HOME and USERPROFILE set to the temp home, no --home): bin folder first gives ✓; bin folder absent gives ✗ and exit 1; an earlier folder holding another pi-review.cmd gives ✗ naming it.
   - install.test.mjs Windows branch: delete the four "not installed on win32" checks, "doctor reads every PATH entry skipped on win32" and "second install still has no PATH links on win32"; keep the shebang check; fix the comment above them.
   - install-check.test.mjs: the R-1081 pin; the R-1072 title loses "except on win32"; its win32 assertion expects the bin folder first, joined with `;`, under the fixture's Path key.
   - state-manifest.test.mjs: drop the four bins from posixOnlyInstallTargets. templates-render.test.mjs: canonicalSupport. requirements-tree.test.mjs: R-291 total = the total `node scripts/requirements-trace.mjs` prints (skip if leaf-total-drop has landed).
3. Code: lib/win-shims.mjs; fsops.mjs (the bytes function; linkFile's copy branch calls it); steps.mjs stepPath win32 branch, PATH-check predicate, header; doctor.mjs win32 PATH rows, resolves row, header; install-check-config.mjs DOCTOR_NOTES.win32; install-check.mjs bin folder first on win32; state-manifest.mjs four `.cmd` rebuildable rows.
4. Docs per "Old contract text", plus the setup README's Windows paragraph carrying the known limits and a tests-table row for win-shims.test.mjs.
5. Flip the rows to implemented; Windows-only rows say "Windows leg only" in Evidence. Run `npm run req:tree` and `npm run map`.

## Wrong code to try on macOS (each must turn the named check red)
- stepPath keeps the four skips: R-1610. Shims written through writeIfChanged (no backup): R-1610.
- sh text with CRLF: R-1611. `$*` for `"$@"`: R-1611. Bin path in double quotes: R-1611 (`$a`). `exec` dropped: R-1617.
- doctor checks existence only: R-1615. doctor checks only the .cmd: R-1615.
- install-check keeps `!== "win32"` around the PATH prepend: R-1072. DOCTOR_NOTES.win32 keeps the PATH labels: R-1081.

## Windows-only wrong code (list them in the report; the seat runs them on the Windows leg)
- Unquoted `SET dp0=%~dp0`: R-1612. `SET "_prog=node"`: R-1612 (exit 42). No `endLocal & goto #_undefined_# 2>NUL ||`: R-1614. `%` in the relative path not doubled: R-1612. Absolute bin path for `%dp0%`: R-1612 (é).

## Done
- win-shims, win32-degrade, install, install-check, state-manifest, templates-render and requirements-tree pass as single files on macOS.
- `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check` exit 0. No `PATH … skipped (win32)` text remains outside dated history.

## Report (10 lines or fewer)
VERDICT; commits; rows changed; each single-file command with exit code and PASS/FAIL/SKIP counts; each macOS wrong-code try and the check it turned red; the Windows-only list; any existing check edited beyond those named here.
