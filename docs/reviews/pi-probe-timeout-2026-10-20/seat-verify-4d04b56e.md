# Seat checks — pi-probe-timeout builds 1 and 2, tip 4d04b56e (2026-10-20)

- Builds, by a pi gpt-5.6-sol builder through pi-worker. Build 1 (`build-brief-1.md`): one commit 4c67ba2c (rows
  R-2020 and R-2022 to R-2026 in FEAT-013 SUB-013 after R-1036, R-2021 in FEAT-015 after R-952; the new relay
  `lib/bounded-spawn.mjs` and `lib/bounded-spawn-child.mjs`; `PI_LAUNCH_LIMITS_MS` and the two stop rows in
  `stepPiRegister`; diagnose's pi probe; the setup README's Idempotence sentence and tests-table row; the new
  `pi-launch-limits.test.mjs`; the regenerated code map and tree). 4dcc19b5 merges main 8466795b (the doctor-fix-line
  land). Build 2 (`build-brief-2.md`): one commit 5389875b. On SIGINT, SIGTERM or SIGHUP the relay now passes that
  signal to pi's group, waits up to `RELAY_SIGNAL_GRACE_MS` (1000 ms, chosen) for pi to close, then kills the tree
  as before and exits 128 + the signal number; a second signal kills at once; on win32 it waits the same grace, then
  runs taskkill. The deadline path is unchanged: SIGKILL at once. R-2027 and two checks pin it (the SIGINT lock check,
  POSIX only, and the grace's seal). R-2020 to R-2022's elapsed bound is now `LIMIT_MS + RELAY_SETTLE_MS +
  RELAY_ELAPSED_MARGIN_MS` (5 s), below the backstop's `LIMIT_MS + RELAY_BACKSTOP_MS` (8 s). 4d04b56e merges main
  385c633f (the hook-deadlines land tip); its only conflicts were the code map and the tree. cee89671 adds the
  pairs' output. No lane module or test file changed after 5389875b; `steps.mjs`, `doctor.mjs` and the setup README
  changed after it only through that merge. The seat's notes commit adds only this record, the independent check,
  the Windows log, the review briefs, HANDOFF and the session entry.
- CI on build 2, run 39384200809 on draft pull request #107 at 4d04b56e (GitHub's merge commit 8c297be0 merges
  4d04b56e into its own ancestor 385c633f, so the tree tested is 4d04b56e's):
  - macOS 176 PASS, 0 FAIL, 2 SKIP of 178 files (7,848 checks pass).
  - Ubuntu 175 PASS, 0 FAIL, 3 SKIP of 178 files (7,787 checks pass).
  - Windows `178 files: 161 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6783 pass, 0 fail, 106 skip`
    (`ci-windows-4d04b56e.log`). The 17 skipped files are the same set as hook-deadlines' run 39377281189, main's
    declared set. pi-launch-limits `9 pass, 2 skip`, by title:
    ```
    PASS R-2020: a pi that hangs on --version makes install and install --dry-run stop at the limit, report pi packages ✗ naming pi --version and the limit, and exit 1
    PASS R-2021: a pi that hangs on --version makes doctor stop at the limit and report pi executable ✗ naming pi --version and the limit
    PASS R-2022: a pi install that hangs makes install stop at the limit, report pi packages ✗ naming pi install, the package folder and the limit, and exit 1
    PASS R-2023: every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report
    PASS R-2024: with no limit injected, install, the dry run and doctor give pi --version 30 s and each pi install 120 s
    PASS R-2027: the relay gives a signalled pi launch 1000 ms to clean up before ending its process tree
    PASS R-2025: pi install started under the limit receives the agent folder install chose as PI_CODING_AGENT_DIR
    SKIP R-2026: win32 has no process-group signal, and process.kill ends a process without running its handlers
    PASS R-2026: SIGINT, SIGTERM and SIGHUP each sent to install's process group end the pi launch it waits on
    SKIP R-2027: win32 delivers console Ctrl-C to the attached pi process and has no process-group SIGINT equivalent
    PASS R-2027: SIGINT lets pi install remove its lock before install ends its launch processes
    ```
    The two skipped checks return ok after their SKIP line, so each also prints PASS: seven checks ran natively,
    and the file's 9 PASS lines count the two skipped checks too. Neighbours: doctor-runtime `9 pass, 2 skip`;
    pi-registration `73 pass, 2 skip`; install `91 pass, 5 skip`; doctor-fix-line `9 pass`; doctor-detail `66 pass,
    1 skip`.
  - install-check: macOS and Windows pass.
  - So the independent check's most-likely-wrong claim, the Windows tree kill, held: R-2023 passes natively on
    Windows, where the fake pi is a `pi.cmd` run through cmd.exe. It fails unless each of its four stops (install,
    the dry run and doctor on a hung `--version`, install on a hung `pi install`) reports the stop row and its pid
    file names at least three processes (cmd.exe as pi's parent, pi's node and pi's child), all ended within 2 s.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds
    4d04b56e's tree.
- CI on build 1, run 39379023422 at 4dcc19b5: 0 failing files on all three legs (the seat's reading; no log kept
  here).
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, one shard, Node
  22.22.2:
  - Build 1 (4c67ba2c, `seat-mutate-output-4c67ba2c.txt`, committed in 98a81ca7): 23 of 24 red, 1 survived (B3).
    B3 (the relay is never told the limit, so only the outer backstop stops it) survived because the checks' 9 s
    bound let a stop at limit + `RELAY_BACKSTOP_MS` (3 s + 5 s) pass: the tests could not tell a stop at the limit
    from the backstop's. It went to build 2 with the independent check's known bug 1.
  - Build 2 (4d04b56e, `seat-mutate-output-4d04b56.txt`, committed in cee89671): 27 of 29 red, 2 survived (S4, S5),
    both declared. B3 now turns R-2020, R-2021 and R-2022 red. The new S1 (the relay kills at once on a signal,
    build 1's form), S2 (the relay never passes the signal to pi) and S3 (the grace retuned to 5 s) turn R-2027 red.
    S4 (a second signal during the grace is ignored) survives: every check sends one signal. S5 (a child that
    closes during the grace is reported as an ordinary result) survives: the signal reaches install's whole group,
    so install has ended before the relay reports, and no check reads the relay's result or exit code after a
    signal. Both are HANDOFF residuals.
  - Declared in the table: every pair ran on macOS only. The Windows-only pairs W1 (taskkill replaced by the child
    alone) and W2 (`windowsVerbatimArguments` dropped) did not run; CI's native R-2023 pass is the Windows evidence
    for the tree kill. No pair covers the relay's `process.exit` after it reports, its settle timer, the outer
    backstop or the POSIX fallback to the child alone; each acts only when pi's pipes outlive the group kill or the
    group kill fails, and no check holds such a pi. R-2025 is green on main; its pair B2 drops the lane's own env
    pass-through. Since build 2, C2 (the tree kill ends pi's direct child only) names R-2023 only, and C8 is
    re-anchored on the new `terminate()`.
- Independent check (`independent-check-4c67ba2c.md`): it ran on build 1, 4c67ba2c (base cdf4b098), not on
  4d04b56e, in a private copy with HOME and TMPDIR under a temp folder, against a baseline copy of main at cdf4b098.
  Nothing ran on Windows. HOLDS, no MUST, 11 probes. The lane's test file passed 7 of 7 (probe 1). The CLI dry run
  and doctor with a hung fake pi each stopped at 30 s, exited 1 and left no process (probes 2, 3). Real pi 1.0.2
  gave main's rows for doctor, the dry run and install, each launch about 30 ms slower (probe 4). Forced win32 kept
  the ComSpec command line intact and stopped a hung ComSpec at a 2 s limit (probe 6). Killing nana-setup alone left
  pi until the limit, the plan's own known limit (probe 7). The code map, README check, tree movement and the two
  neighbouring test files were green (probe 11). Its findings and how each was settled:
  1. Known bug 1 (probe 8): Ctrl-C during `pi install` SIGKILLed pi's group at once, so pi's lock cleanup never ran
     and its lock folder stayed; main removed it. pi treats the lock as stale after 10 s, so a re-run inside that
     window fails with ELOCKED. Its inferred cut-short settings file was not run. Fixed in build 2, 5389875b, with
     R-2027: the relay passes the signal to pi's group and waits up to 1 s before the kill. R-2027's SIGINT check
     takes probe 8's shape (a fake `pi install` that takes a lock folder and removes it on SIGINT); the pairs S1 and
     S2 turn it red; it passes on macOS and Ubuntu and skips on Windows. Nobody re-ran the independent check on
     build 2; that is a HANDOFF residual.
  2. Known bug 2 (probe 9): the relay puts pi's stdout and stderr into one JSON line, which the outer spawnSync caps
     at its default 1 MiB; before, each stream had its own 1 MiB. Over that, the row reads `could not start` with
     ENOBUFS instead of pi's own error, and a `pi install` that worked would read ✗ (a re-run shows it in place).
     Realistic pi output is far below. Left open by build brief 2; a HANDOFF residual.
  3. Probe 5: a non-executable pi now reads `could not start: spawn pi EACCES` where main read `spawnSync pi
     EACCES`; the row and the exit code are unchanged. A HANDOFF residual.
  4. Probe 10: a pi that prints its version, exits 0 and leaves a child holding stdout now reads as stopped at the
     limit; main waited 8.3 s and read ✓. The deadline covers held pipes by design, and only the wording "gave no
     answer" is loose. A HANDOFF residual.
  5. Its most-likely-wrong claim, the Windows tree kill and Ctrl-C on Windows: the tree kill is settled by CI's
     native R-2023 pass above. Windows Ctrl-C stays untested, since both signal checks skip there; a HANDOFF
     residual from the plan's known limits.
- The plan's other known limits, each a HANDOFF residual: without taskkill, or with taskkill denied, only cmd.exe
  ends; killing nana-setup alone leaves pi until the limit; on a real home with pi's packages unregistered, a hung pi
  costs doctor two version limits (60 s), its own row and then doctor-fix-line's dry run; a kill can leave pi's
  settings lock, and the deadline kill gives pi no grace, by design (the seat's item b); each launch starts one more
  node process, about 30 ms on macOS and unmeasured on Windows; doctor's `node -p` and `launchctl print` probes stay
  unbounded; a pi that leaves its process group or job escapes the kill, outside the threat model. The plan's first
  known limit, nothing run on Windows, is settled by CI's Windows leg.
- HANDOFF: the install-dry-run-pi-packages residual (the dry run's pi version check has no time limit, so a hung pi
  hangs the dry run, install and doctor) goes, since this lane fixes it. The hook-deadlines builder-briefs line now
  also names this lane's first build, whose builder ran the full suite though its brief said single test files only;
  the seat took no action.
- Rows: R-2020 to R-2027 read `implemented` in REQUIREMENTS.md. R-2023 and R-2024 also apply to FEAT-015. The seat
  helper's re-run at the notes commit: `node scripts/requirements-trace.mjs` reads `1551 total (1285 implemented · 1
  planned · 34 retired · 226 untested · 5 violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check`
  reads 339 modules, 0 problems; `npm run readme:check` reads 719 claims, 0 problems; `node
  scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base 385c633f`, the merge base and main):
  ```
  tree movement 385c633..cee8967: 8 rows in 2 features
  FEAT-013 · Install and connect harness runtimes
    R-2020 new (implemented)
    R-2022 new (implemented)
    R-2023 new (implemented); also applies: FEAT-015
    R-2024 new (implemented); also applies: FEAT-015
    R-2025 new (implemented)
    R-2026 new (implemented)
    R-2027 new (implemented)
  FEAT-015 · Diagnose the active environment
    R-2021 new (implemented)
  ```
  CAP-04 moves from 443 to 451 rows, FEAT-013 from 165 to 172 (SUB-013 from 34 to 41) and FEAT-015 from 113 to 114.
  No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land.
- Main was 385c633f when the lane merged it at 4d04b56e, and it is still 385c633f, the merge base, when this record
  was written. So the land needs no merge of main today.
