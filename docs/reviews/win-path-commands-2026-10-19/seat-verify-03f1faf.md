# Seat checks — win-path-commands, builds 1 to 4, tip 03f1faf (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through pi-worker (`--lane-size larger`), four builds:
  - Build 1 (`f7c5db53`, `build-brief-1.md`): rows R-1610 to R-1617 new; R-995 retired; R-589, R-937, R-1072, R-1081
    and R-684 updated. Per the builder's report, not re-run by the seat: its locked suite read 165 files, 0 FAIL.
  - Build 2 (`db142db4`, `build-brief-2.md`), after the seat's findings: (1) on Windows run 39322810029, R-1612 failed
    only on the `@<brief>` argument, whose `é` arrived as `├⌐`. The test's cmd caller wrote the arguments into a UTF-8
    batch file, which cmd.exe reads in the OEM code page. Cmd callers now put the command on cmd.exe's own verbatim
    command line; R-1612 keeps `é` and every argument, and R-1614 shares the caller. (2) The `.cmd` shim's no-node
    message escaped its own redirect (`1^>^&2`), so it printed to stdout ending in a literal `1>&2`. The shim now runs
    `1>&2 ECHO …`, and new row R-1618 requires exit 1, empty stdout and the not-found message on stderr. (3) R-1615's
    block threw ENOENT before its title printed when the expected shim was absent (pair M1 on f7c5db53); it now fails
    by name. (4) A repeat Windows install's unchanged row read `sh: write; .cmd: write`; it now reads
    `sh: no write; .cmd: no write`. The seat then merged main 22ccd849 (`acdefc3a`).
  - Build 3 (`a73e8a1d`, `build-brief-3.md`): build 2's R-1618 read exit 0 on the Windows leg (scratch run
    39326800712). The R-1618 case now restores the shared shim before it runs and replaces every spelling of the path
    key. The `_prog=node` trap is now a caller-folder `node.cmd` exiting 42, so the test's PATHEXT reaches it. Every
    Windows-only check's failure message carries each run's status, stdout, stderr and spawn error. Build 3 also
    concluded that an absolute bin path holding `é` works on hosted Windows; that conclusion was wrong (build 4).
  - Build 4 (`03f1faf3`, `build-brief-4.md`): build 3's conclusion came from the seat's scratch run, which ran the
    test file with node directly and so got a different console code page than the suite's `npm test` run. In the
    suite run on a73e8a1d, the absolute form read `é` as `├⌐` and exited 1 with `Cannot find module`. Cmd callers now
    run `chcp 437>nul &` first. R-1612 asserts the shipped relative form passes and the absolute form fails. R-1618's
    PATH keeps System32 so `chcp` resolves. The setup README and must-meet state the proven same-drive failure and the
    inferred cross-drive limit. Build 4 changed only `win-shims.test.mjs`, the setup README and must-meet.
  - Product code (`packages/nana-setup/lib/`) last changed in db142db4; a73e8a1d and 03f1faf3 changed tests and docs
    only. After 03f1faf3, c39bda83 adds only the seat's Windows pair table and output.
- CI run 39332394588 on draft pull request #71 (03f1faf3; GitHub's merge onto 22ccd849, merge commit c14913a1):
  - macOS `167 files: 165 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7647 pass, 0 fail, 23 skip`.
  - Ubuntu `167 files: 165 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 7592 pass, 0 fail, 41 skip`.
  - Windows `167 files: 150 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6585 pass, 0 fail, 78 skip`
    (`ci-windows-run-4.log`); the 17 file skips are main's declared ones. win-shims `7 pass` with no skip;
    win32-degrade `92 pass`. All seven win-shims checks print PASS on win32:
    ```
    PASS sh shim hands node every argument unchanged and returns the bin's exit status
    PASS an sh shim rewritten by its own bin runs none of the new text
    PASS Windows: cmd.exe hands a .cmd shim's bin every double-quoted argument unchanged on the PATH node and returns its exit status
    PASS Windows: PowerShell hands a .cmd shim's bin every spaced argument unchanged and returns its exit status
    PASS Windows: a .cmd shim rewritten by its own bin runs none of the new text
    PASS Windows: a .cmd shim without node.exe on PATH exits 1 and writes its not-found message only to stderr
    PASS Windows: doctor reads PATH resolves pi-review ✓ only when the bin directory's .cmd shim is found first
    ```
  - install-check: macOS and Windows success. None of main's known failures showed.
  - The plan's "most likely wrong" claim, that Windows PowerShell 5.1 keeps `& ^ ( ) %` literal inside a spaced
    argument (R-1613), passes on the Windows leg. Its empty-argument and trailing-backslash exclusions stay inferred.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`), through the shared mutation runner, one shard, Node
  22.22.2:
  - f7c5db53 (`seat-mutate-output-f7c5db53.txt`, committed in 33df0705): 19 of 19 red, 15 exactly their named titles,
    1 with a named title never reached (M1: win32-degrade crashed before R-1615's title, build 2's finding 3), 3 with
    an unnamed red, 0 survived.
  - a73e8a1d (`seat-mutate-output-a73e8a1.txt`, committed in 31eb1709): 19 of 19 red, 16 exactly their named titles,
    3 (M3, M5, M17) with an extra unnamed red, 0 survived. M2 (no backup) turns its two named checks red, then
    win32-degrade crashes and its later checks never run. Product code has not changed since, so this run covers the
    tip's code.
  - The pairs: M1 stepPath keeps main's four skips; M2 to M5 the shared write (no backup, a byte-equal rewrite, a
    write through a symlink, never unchanged); M6 to M10 the sh shim (CRLF, `$*`, a double-quoted bin, an unescaped
    `'`, no `exec`); M11 to M15 doctor (existence only, the .cmd only, a stale shim as a note, main's skipped notes,
    the resolves row failing under `--home`); M16 and M17 install-check's Path prepend; M18 the doctor note list; M19
    the state manifest's four `.cmd` rows.
  - Declared, no macOS pair: (a) the Windows-only wrong code, run below; (b) on macOS the `.cmd` text is only
    byte-compared against the same renderer, so a `.cmd`-only change survives there by construction; (c) no test pins
    doctor's refusal of a linked shim with the right bytes, install's Windows PATH-check line, or install-check's Path
    key when the environment holds none. Declaration (a) also names a wrong match in doctor's `PATH resolves
    pi-review` row (R-1616), but the Windows table holds no such pair, so none ran.
- The seat's Windows-only pairs (`seat-mutate-win.mjs`, `win-pairs.mjs`), run in place on CI's Windows leg, one at a
  time, on scratch branch `seatmut/win-path-commands`, never merged:
  - a73e8a1d (`seat-mutate-win-output-a73e8a1.txt`): scratch commit 230e198b, run 39328310935; baseline win-shims
    7 PASS. W1 unquoted `dp0`, W2 a bare `node`, W3 no endLocal-goto line and W4 an undoubled `%` each turn their named
    check red: 4 of 4. W5, the absolute bin path in place of `%dp0%`, was declared after it survived an earlier run.
  - 03f1faf3 (`seat-mutate-win-output-03f1faf.txt`, committed in c39bda83): scratch commit 2931b886, run 39332448627,
    each file run through `npm test -- --verbose`, as the suite job runs it; baseline `8 PASS`, which counts the
    runner's file line beside the file's seven checks. W1 to W5 each turn their named check red: 5 of 5, W5 restored.
    W1 and W2 also turn R-1613, R-1614 and R-1618 red; W4 and W5 also turn R-1613 and R-1614 red.
  - No pair restored the old escaped no-node line on Windows. R-1618's empty-stdout assertion fails that line by
    reading (inferred, not run).
  - Lesson: the seat's first in-place helper ran `node <file>`. That run got a different console code page than
    `npm test` and no `npm_execpath`, so W5 survived it and build 3 drew a wrong conclusion from it. The helper now runs
    `npm test -- --verbose <file>` when `npm_execpath` is set. The shared mutation runner still starts node directly.
- Independent check (`independent-check-03f1faf.md`): it ran at f7c5db53 (build 1), in a private clone under a temp
  HOME and `--home`, before build 2. Verdict HOLDS, no MUST, nine probes. POSIX install and doctor match main; the sh
  shim round-trips 12 hostile arguments under `/bin/sh`; forced win32 writes no file on a dry run, never writes through
  a symlink and backs up a directory in the way; doctor catches a shim rendered for another checkout and a CRLF sh
  shim, and install repairs both; the `.cmd` target is relative on the same drive, absolute with `%` doubled on another
  drive, and relative for a UNC path; uninstall is unchanged; the copy-path refactor keeps its statuses and backups.
  Its findings, and how each was settled:
  1. Known bug: the no-node message's escaped redirect sent it to stdout with a literal `1>&2`. Fixed in build 2
     (db142db4), with row R-1618; build 3 (a73e8a1d) fixed R-1618's own case. R-1618 passes on the Windows leg at
     03f1faf3.
  2. Known bug, cosmetic: a repeat win32 install's unchanged row named writes that did not happen. Fixed in build 2
     (db142db4); nothing pins the new wording. The same finding names the copy path's dry-run wording, which changed
     from "would replace a symlink with a copy" to "would replace a symlink and copy". That change stays, unpinned; a
     HANDOFF residual.
  3. Note: on win32 with the real home, doctor now exits 1 until the bin folder is on the user Path, where main printed
     notes. The plan intends this, and the README says so. A HANDOFF residual.
  4. Its "claim most expected to be wrong", that the `.cmd` shim works on cmd.exe and PowerShell, rested on the Windows
     leg still running then. That run (39322810029) failed R-1612 through the test's caller, fixed in build 2. At
     03f1faf3 all five Windows-only checks pass.
- Rows: R-1610 to R-1618 read `implemented` in REQUIREMENTS.md; R-1612, R-1613, R-1614, R-1616 and R-1618 say
  "Windows leg only" in Evidence. R-995 reads retired. The seat helper's re-run at c39bda83:
  `node scripts/requirements-trace.mjs` reads `1405 total (1120 implemented · 1 planned · 25 retired · 254 untested ·
  5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 321 modules, 0 problems;
  `npm run readme:check` reads 709 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge-base 22ccd849): 13 rows in 3
  features — FEAT-013: R-1610 to R-1618 new (implemented), R-995 implemented to retired, R-589 text changed (also
  applies: FEAT-015); FEAT-015: R-1072 text changed; FEAT-019: R-684 text changed. R-937's and R-1081's evidence cells
  changed; their text did not.
- HANDOFF: the adopt-closes-check residual on the bare trust command now says it works on Windows once the bin folder
  is on the user Path. New carried residuals, each naming this lane: the shells' argument limits; Git Bash's path
  rewrite; the other-drive form; doctor red until the Path holds the bin folder; backups, the unpinned PATH-check
  line and Windows uninstall; the node lookup and the caller's folder; the Windows-only rows proven only on CI's
  Windows leg, with no pair for R-1616; the dry-run wording; the stale "not on PATH, as on Windows" text in the three
  adopt skills and the working pattern; the shared runner's console code page.
- Main moved after this lane's base: main is cb1a5b57, two lands past 22ccd849 (review-ledger-run-reviewer and
  adopt-structure-markers). The lane has not merged it. nana-land needs that merge, and the merge needs its own
  accepted review coverage. Expect conflicts in HANDOFF, the session file, the generated tree and code map, and the
  pack README's Windows paragraph, which both sides edited. Main's carried line "Adoption markers
  (adopt-structure-markers): the skill's closing step says the setup command is not on the path on Windows…" is
  superseded by this lane's line on the three adopt skills; drop it in that merge.
