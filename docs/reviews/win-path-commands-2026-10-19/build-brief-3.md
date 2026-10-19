# win-path-commands — build brief 3

Feature: FEAT-013 · Install and connect harness runtimes. Class: install, hook or gate. Builder: pi gpt-5.6-sol through
pi-worker --lane-size larger. Read `must-meet.md`, `build-brief-1.md` and `build-brief-2.md` first. Build 2 is
`db142db4`; the seat merged main into it (`acdefc3a`). You cannot run Windows here: the seat runs the Windows leg.

The seat ran build 2 on the Windows CI leg and ran the five Windows-only wrong-code tries of brief 1 there, one at a
time, in place (scratch run 39326800712). Results:

- **Baseline:** `win-shims.test.mjs` 6 PASS, 1 FAIL on correct code. The failing check is R-1618, "Windows: a .cmd shim
  without node.exe on PATH exits 1 and writes its not-found message only to stderr": `Expected values to be strictly
  equal: 0 !== 1` (the shim run exited 0).
- RED as planned: unquoted dp0 (R-1612), no endLocal-goto line (R-1614), `%` not doubled (R-1612).
- **Survived:** `SET "_prog=node"` (R-1612 still passed) and an absolute bin path in place of `%dp0%` (R-1612 still
  passed).

## Fix, in order

1. **R-1618 on Windows.** Find why the shim run exits 0 when node.exe is not on PATH, and fix the shim or the test,
   whichever is wrong; say which in the report. Read how cmd.exe returns a batch file's `EXIT /b` code through
   `cmd /d /s /c`, and whether the test's PATH really holds no node.exe (System32, the runner's tool folders).
2. **The `_prog=node` trap is inert.** `shellEnv` sets `PATHEXT` to `.COM;.EXE;.BAT;.CMD`, so the caller folder's
   `node.js` (`WScript.Quit(42)`) is never a candidate for a bare `node`. Make the trap reachable under the PATHEXT the
   test sets, for example a `node.cmd` or `node.bat` in the caller folder that exits 42, so a shim that runs a bare
   `node` from the caller's folder fails R-1612. Keep the check that the bin ran on the first node.exe on PATH.
3. **The absolute-path form survives.** Brief 1 expected an absolute bin path holding `é` to break R-1612 when cmd.exe
   reads the shim. It did not. Find out why: for example, whether the fixture's bin path reaches the shim in a form
   without `é`, or whether cmd.exe reads the shim in a code page that keeps it. Then either make R-1612 (or a new
   check in this block) fail on the absolute form, or show why the absolute form also works and say so in the report
   and in must-meet's Known limits; do not keep a design reason that the evidence does not support.
4. **Diagnostics.** Every Windows-only check's failure message carries the shim run's status, stdout and stderr, so the
   next CI failure explains itself.

## Rules
Single test files only, never the full suite. No push. No HANDOFF.md or docs/sessions/ edits. Every `// req:` marker sits
directly above its check call with the title on that line. Run `npm run req:tree`, `npm run map` if headers or modules
change, `node scripts/requirements-trace.mjs`, `npm run map:check` and `npm run readme:check`.

## Report (10 lines or fewer)
VERDICT; commits; each fix and its reason; each single-file command with exit code and PASS/FAIL/SKIP counts; for fix 3,
what you found and how you know; anything only the Windows leg can confirm.
