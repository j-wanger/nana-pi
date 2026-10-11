# Lane pi-cmd-launch — build brief 2: make the Windows leg prove the lane (2026-10-11)

Round 1 is green on macOS (suite, seat acceptance 86/86, title check). The first Windows CI run
(draft PR #2, run 38166757684; seat extract in the session scratch, summary below) shows:

- `post-edit-status.test.mjs` PASSES on Windows (30 pass, 1 skip) — R-105 and R-1038 hold there.
- `doctor-runtime.test.mjs`: the same 7 failures as `main`'s baseline run (POSIX test scaffolding,
  out of this lane's scope); the lane's new doctor checks pass. Leave the 7 alone.
- `pi-registration.test.mjs`: 48 pass, then the file CRASHES at the existing POSIX-only test
  ("install adds only the missing per-package entry, never a root entry": an extensionless `#!/bin/sh`
  fake `pi` and a `:`-joined PATH). On win32 that test's un-injected `stepPiRegister` now finds the
  runner's REAL global `pi.cmd` and runs a real `pi install` into the temp agent dir; the fake log is
  never written, `readFileSync` throws, and the Windows-only npm-shim test after it NEVER RUNS.
- `win-command.test.mjs`: 48 failures, all in the Windows pin of the internal-command set. `where`
  found `date`, `dir`, `echo` (Git's coreutils are on the runner's PATH), and `cmd /d /c "<name> /?"`
  exited non-zero for every one of the 45 names. The names are right; the probe was wrong (CHANGE §5
  now carries the seat amendment).

Do every item:

- [ ] **A. Guard the POSIX-only registration test.** Run it only when `process.platform !== "win32"`;
  on win32 print `SKIP` with the reason (the injected cases already pin R-323's launch on every
  platform). No test may run a real `pi install` — check the rest of the file for the same hazard.
- [ ] **B. The new internal-command probe (CHANGE §5, seat amendment).** On win32, for each name:
  `where.exe` (full path under `%SystemRoot%\System32`) run with `PATH` set to
  `%SystemRoot%\System32;%SystemRoot%` finds nothing; and `cmd.exe /d /c "<name> /?"` gives non-empty
  stdout and empty stderr. Add one CONTROL case: a name that does not exist
  (`nana-no-such-command-xyz`) gives empty stdout and non-empty stderr — so the probe can fail. Each
  failure message prints the status and the first line of stdout and stderr. Keep one check per name
  so a wrong name is named.
- [ ] **C. Read the Windows run.** Push this branch (no approval needed for a non-main branch); wait
  for the draft PR's CI run; from its log, report the Windows lines for `win-command.test.mjs`,
  `pi-registration.test.mjs` (the npm-shim test must print PASS with the exact argv check), and
  `post-edit-status.test.mjs`, verbatim. If any lane check still fails on Windows, diagnose it from
  the log, fix it, push again, and report each run. Use `gh run list --branch feat/pi-cmd-launch` and
  `gh run view <id> --log`; do not wait in a tight loop (poll every 60 s at most).

Rules as brief 1 (wrong code first, break code not assertions, no test deletion — the title check
must stay `0 gap(s)`, no suite test runs a seat script, no real `~/.pi`). Then `npm run test:locked`,
both seat scripts into their output files, commit with explicit paths, push.

Report ≤ 30 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; each Windows run's id and
the verbatim Windows lines for the three files; the `test:locked` summary line; the last two lines of
each seat output; the one claim most likely wrong.
