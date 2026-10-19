# win-path-commands — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds, but probes found one property the plan leaves unpinned and three rows that promise more than their tests check.

1. The sh shim's `exec` is load-bearing and nothing pins it. In a macOS /bin/sh probe, the stub rewrote its own shim. With `exec` the run gave status 7 and no marker lines. Without it, the run gave status 0, ran 192 marker lines and hit "ARKER: command not found". R-1611 still passes with `exec` dropped. So `nana-setup install`, run from Git Bash and rewriting its own sh shim, would run leftover text. Added R-1617, which tests this on every platform. It is red on macOS today, and "exec dropped" becomes a macOS mutation pair.

2. Some rows were wider than their tests:
- R-1611: Git Bash (MSYS2) rewrites a `/`-shaped argument when it starts node.exe. The row now excludes `/` arguments on win32.
- R-1612: a double-quoted argument that holds its own `\"` and a special character falls outside cmd.exe's quote state. A trailing backslash follows the Microsoft C rules. Both cases are now excluded, and the test drops the `\"` argument. "The node.exe on PATH" is now pinned: the stub prints execPath and the test compares it.
- R-1613: Windows PowerShell 5.1 drops an empty argument and breaks a spaced argument that ends in `\`. Both are now excluded (from known PowerShell behaviour, not probed).
- R-1615: now says ✗ otherwise, to match its ✗ and exit-1 test.

3. Fixture fixes:
- Bin folder `bin 100%&(x)` puts `%`, `&` and parentheses in the .cmd's relative path. Now every embedded `%` is doubled, not only in the absolute form, and a Windows wrong-code try covers it.
- The é sits only in the shared ancestor, so it reaches the .cmd only through `%~dp0`.
- The plan's `$é` folder was red only through a locale quirk (bash read `$` plus the first byte of é as a variable). The folder now uses `$a`.
- Callers never pass arguments on bash.exe's own command line. MSYS2/Cygwin expands `@file` and wildcards there when a native process starts it (inferred), which would wreck the brief argument.
- The caller-folder `node.js` holds `WScript.Quit(42)`, so the npm-style wrong code exits 42 without a script-host dialog hanging CI.

4. R-1610 on Windows also runs the installed nana-setup.cmd with --help. Hosted Windows runners may keep the checkout and temp folders on different drives (inferred), so this exercises the install-rendered form.

5. New known limits:
- `%~$PATH:` may search the caller's folder first (unverified).
- `~/.local/bin` is not on a Windows PATH by default, so doctor reads ✗ on a fresh machine until the owner adds it.
- A changed shim text leaves a dated backup, the same as win32 rule copies.

6. Brief fixes:
- The win32 PATH prepend in install-check joins with `;` under the existing Path key, because tests force win32 on macOS where the delimiter is `:`.
- The R-291 total step is skipped if leaf-total-drop lands first. That planned lane removes the literal.
- The exact new Support-line clause is now given.

Confirmed:
- Red today: a forced-win32 install on main into a temp home prints four `skipped (win32)` PATH rows and creates no bin folder. Doctor prints the four rows as `· skipped (win32)`.
- sh prototype: 8 hostile arguments, including empty, line break and trailing `\`, round-trip with exit 7. CRLF, `$*` and a double-quoted bin path each go red.
- The installed npm's cmd-shim 7.0.0 has the layout the plan cites: unquoted `SET dp0=%~dp0`, `SET "_prog=node"` with the `.JS` removed from PATHEXT, and the endLocal/goto line.
- Uninstall refuses on win32. nana-land compares real paths, so the .cmd's relative argv[1] still works. The test runner finds the new test file by its name.
- Lane class is right: install and doctor.

Subtraction test: dropping the .cmd (Git Bash only) would remove three Windows-only rows. But PowerShell is the default Windows terminal, and `nana-setup install` is the first command an owner types there. Keep it.

Conflicts:
- win-leg-flip: same Support line, R-684 and canonicalSupport. Must land first.
- readme-install: shares install-check.mjs, install-check-config.mjs, its test and the setup README. Its hunks are separate except one adjacent README paragraph that will conflict on merge.
- bom-pack-config, then install-honest-report: share steps.mjs and doctor.mjs, land in that order.
- No conflict: the other in-flight lanes. Main has moved to a1ea491 (clean-revision landed), with no effect on this lane.
- Files: those listed in the plan, unchanged.

Most likely wrong: R-1613, that Windows PowerShell 5.1 wraps each spaced argument in double quotes, so cmd.exe keeps `& ^ ( ) %` literal inside it. The empty-argument and trailing-backslash exclusions are inferred too. No Windows host was available, and the Windows leg decides.
