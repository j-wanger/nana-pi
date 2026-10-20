# Seat checks — pi-launch-followups build 1, tip 86240f7f (2026-10-20)

- Build, by a pi gpt-5.6-sol builder through pi-worker (`build-brief-1.md`, one build): one commit 8ec28199. Rows
  R-2130 to R-2133 join FEAT-013 SUB-013 after R-2027. `lib/bounded-spawn.mjs` passes `detached: true` to the outer
  spawnSync on POSIX only (the win32 options are unchanged), adds `parentPid: process.pid` to the launch spec, passes
  `maxBuffer: RELAY_RESULT_MAX_BYTES`, and defines `RELAY_PARENT_POLL_MS = 200` and `RELAY_RESULT_MAX_BYTES = 16 MiB`,
  both chosen 2026-10-20 and unsealed. `lib/bounded-spawn-child.mjs`, POSIX only, starts an unref'd interval at
  `RELAY_PARENT_POLL_MS` when the spec carries an integer parentPid; when `process.ppid` differs, it clears the
  interval and calls `terminate("SIGINT")` only when no termination is in progress. The deadline, Windows and
  signal-handler paths are unchanged. Both six-tag headers say the new inputs and purpose. `pi-launch-limits.test.mjs`
  gains the hang fixture's `IGNORE_SIGINT` switch, the cleanup fixture's `CLEANUP_DELAY_MS`, a large-output fixture,
  the four new checks, and a skip result for every win32 skip, so the runner prints SKIP and no PASS for it. The setup
  README gains one Idempotence sentence and extends the pi-launch-limits row of its test table. The code map and the
  tree are regenerated. The lane branched from main 15703d8d (the pi-probe-timeout land tip); 86240f7f merges main
  54f1271f (the config-advice-fixes land tip), whose only conflict was the tree, and brings no change to a lane file.
  8d4783e4 adds the pairs' table and output. No lane module or test file changed after 8ec28199. The seat's notes
  commit adds only this record, the independent check, the Windows log, the review briefs, HANDOFF and the session
  entry.
- CI on build 1, run 39399980825 on draft pull request #120 at 86240f7f (GitHub's merge commit 0825db5e merges
  86240f7f into its own ancestor 54f1271f, so the tree tested is 86240f7f's):
  - macOS 176 PASS, 0 FAIL, 2 SKIP of 178 files (7,887 checks pass); pi-launch-limits 13 pass.
  - Ubuntu 175 PASS, 0 FAIL, 3 SKIP of 178 files (7,826 checks pass); pi-launch-limits 13 pass, so R-2130, R-2131
    and R-2133 pass on Linux (the seat's reading of the Ubuntu log; no log kept here). That settles the plan's
    most-likely-wrong claim: on a hosted Ubuntu runner the detached spawnSync puts the relay in its own session,
    `process.ppid` changes when install dies, and dash as `/bin/sh` runs the SIGINT-ignoring hang fixture. The Ubuntu
    leg does not block release.
  - Windows `178 files: 161 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6817 pass, 0 fail, 109 skip`
    (`ci-windows-86240f7f.log`). The 17 skipped files are main's declared set (16 desk files and the bench's
    study-tasks). pi-launch-limits `8 pass, 5 skip`, by title:
    ```
    PASS R-2020: a pi that hangs on --version makes install and install --dry-run stop at the limit, report pi packages ✗ naming pi --version and the limit, and exit 1
    PASS R-2021: a pi that hangs on --version makes doctor stop at the limit and report pi executable ✗ naming pi --version and the limit
    PASS R-2022: a pi install that hangs makes install stop at the limit, report pi packages ✗ naming pi install, the package folder and the limit, and exit 1
    PASS R-2023: every process a timed-out pi --version or pi install started, pi's own child included, has ended when install, the dry run and doctor report
    PASS R-2024: with no limit injected, install, the dry run and doctor give pi --version 30 s and each pi install 120 s
    PASS R-2027: the relay gives a signalled pi launch 1000 ms to clean up before ending its process tree
    PASS R-2025: pi install started under the limit receives the agent folder install chose as PI_CODING_AGENT_DIR
    SKIP R-2026: SIGINT, SIGTERM and SIGHUP each sent to install's process group end the pi launch it waits on win32 has no process-group signal, and process.kill ends a process without running its handlers
    SKIP R-2027: SIGINT lets pi install remove its lock before install ends its launch processes win32 delivers console Ctrl-C to the attached pi process and has no process-group SIGINT equivalent
    SKIP R-2130: a SIGKILL of install's whole process group ends the pi launch it waits on within the parent check and the signal grace Windows has no process-group SIGKILL
    SKIP R-2131: a SIGKILL of install alone ends the pi launch it waits on within the parent check and the signal grace a Windows parent's death leaves process.ppid unchanged
    PASS R-2132: a pi install that writes just under 1 MiB of control characters to each of stdout and stderr reads created on exit 0 and failed with its last error line on exit 1
    SKIP R-2133: SIGINT to install's process group, alone or with the relay signalled too, still lets a pi install that cleans up over two parent checks remove its lock before its processes end Windows has no process-group SIGINT
    ```
    Each skipped check now prints one SKIP line and no PASS line: eight checks ran natively and five skipped, 13 in
    all. pi-probe-timeout's Windows run printed `9 pass, 2 skip`, where two of the nine PASS lines came from
    skipped checks. That closes the plan's bug 4. R-2132 passes natively on Windows, through a `pi.cmd` fake pi run
    by cmd.exe. Neighbours: doctor-runtime `9 pass, 2 skip`; pi-registration `73 pass, 2 skip`; install `91 pass, 5
    skip`; doctor-fix-line `9 pass`; doctor-detail `67 pass, 1 skip`.
  - install-check: macOS and Windows pass.
  - None of main's known failures showed: Ubuntu's path-spelling GP1 and GP2 were fixed on main at ca27d86, Windows
    main reads 0 FAIL since 4be0b79, and no R-291 merge artifact arises, since GitHub's merge commit holds 86240f7f's
    tree.
- The seat's wrong-code pairs (`seat-mutate.mjs`), through the shared mutation runner on macOS, one shard, Node
  22.22.2, on 86240f7f (`seat-mutate-output-86240f7f.txt`, committed in 8d4783e4): 9 of 10 red, 1 survived (pair
  6). The baseline file read 13 PASS, 0 FAIL.
  - Red, by their named titles: pair 1 (W1, the outer relay launch not detached) R-2130, and R-2133 unnamed this
    run; pair 2 (no parentPid, so no watch) R-2026, the R-2027 lock check, R-2130, R-2131 and R-2133, which shows the
    old signal checks now rest on the watch; pairs 3 and 4 (W4: the default 1 MiB maxBuffer, then 8 MiB) R-2132; pair
    5 (the comparison inverted, so the watch fires while install lives) R-2020 to R-2023 named and seven more
    unnamed; pair 7 (W3, kill at once with no grace) the R-2027 lock check and R-2133; pair 8 (W6, pass SIGINT and
    never kill) R-2130 and R-2131; pair 9 (W7, terminate on every tick, the plan's watch as first worded) R-2133;
    pair 10 (W8, fire once but ignore a termination in progress) R-2133.
  - Pair 6 survived, as declared (build brief W5): it replaces the parent check with a watch for
    `process.ppid === 1`. On macOS an orphaned relay's parent is pid 1, so the wrong version acts the same there. On Linux a
    subreaper or a container's init can adopt the orphan in place of pid 1, so the two could differ there (inferred,
    not run). A known limit of the pins, not a MUST; a HANDOFF residual.
  - Declared in the table: every pair ran on macOS only, and on win32 only pairs 3 and 4 can turn a check red. No
    pair covers the `clearInterval` calls before an exit, the watch's own `clearInterval` (the `terminatingSignal`
    guard alone stops a second call), `parentTimer.unref()`, the watch's `!finished` guard or its win32 guard. No
    pair retunes `RELAY_PARENT_POLL_MS`. Pair 1 names R-2130 only: R-2133's second phase reddens under W1 only when
    the relay's two back-to-back SIGINTs arrive as two deliveries. The table's first record saw them merge (R-2133
    green); this record saw R-2133 red. R-2133 stayed green on the lane's own code in every run.
- Independent check (`independent-check-86240f7f.md`): it ran on 86240f7f in a private clone with a temp HOME and
  TMPDIR, on macOS with Node 22.22.2. Nothing ran on Linux or real Windows; CI is the Windows evidence. HOLDS, no
  MUST, over 7 probes plus the must-meet file (13 PASS, 0 FAIL in 41.9 s), pi-registration (70/0) and doctor-runtime
  (21/0), and map:check (0 problems). The relay leads its own session and pi sits in another; a real
  `pi --version` through the relay still returned 1.0.2 (probe 1). Doctor and the dry run, each SIGKILLed by group,
  and the dry run killed alone, ended every process in 1,031 to 1,215 ms, so they get install's cleanup; the plan
  only inferred that (probe 2). With a 900 ms cleanup, pi removed its lock after SIGINT to doctor's group and after
  SIGTERM to the dry run alone; a 1,500 ms cleanup was cut at the 1 s grace, as on main (probe 3). Output that read
  ENOBUFS on main now reports pi's real status: 2 MiB of ASCII per stream on exit 1, and 1 MiB less 1 KiB of control
  characters per stream on exit 0 (probe 4). Forced win32 behaves as main (probe 5). Normal, deadline and missing-pi
  launches are unchanged (probe 6). Only nana-setup's own steps and doctor call the relay, and nana-setup registers no
  signal listener (probe 7). Its findings and how each was settled:
  1. No MUST: no lost data, no writes outside the temp folders, no broken install or hook, nothing main does today
     stopped working.
  2. Known bug: output above 16 MiB once escaped still reads ENOBUFS with status 0 (3 MiB of control characters per
     stream, about 36 MiB escaped). The plan's own known limit; a HANDOFF residual, replacing pi-probe-timeout's
     1 MiB line.
  3. Known bug: Ctrl-Z stops only install; the relay and pi run on until the limit. The plan's own known limit; a
     HANDOFF residual.
  4. Known bug: a second Ctrl-C no longer cuts pi's grace short. The plan's own known limit; a HANDOFF residual.
  5. Its 9 MiB-per-stream run returned a short stdout. The check traced that to its own fixture, which calls
     `process.exit()` before stdout flushes; a plain spawnSync loses it the same way. No action.
- The plan's five bugs from pi-probe-timeout: bug 2 (one 1 MiB cap for both streams) is fixed with R-2132; bug 3 (a
  group SIGKILL orphans a hung pi) is fixed with R-2130 and R-2131, with R-2133 guarding pi's grace on the new path;
  bug 4 (Windows skip lines print PASS) is fixed in the tests. Bug 1 (the deadline kill gives pi no grace) is not
  built: by pi 1.0.2's source, pi takes its settings lock only inside one synchronous read and write, and a local
  `pi install` runs no npm. The HANDOFF line is reworded. Bug 5 (a stuck relay on Windows leaves cmd and pi) stays
  a HANDOFF residual.
- The plan's other known limits, each a HANDOFF residual: Windows is unchanged, so a kill of install alone leaves pi
  until its limit there; Ctrl-C reaches pi up to one parent check later, and pi gets SIGINT whatever signal ended
  install; a SIGKILL of the relay itself leaves pi running. The relay holds pi's output in memory until pi ends,
  which the 16 MiB line covers. Node honours spawnSync's `detached` though its docs omit it; CI's macOS and Ubuntu
  legs now run it, and R-2130 turns red if a Node release drops it. The seat also notes that `pi install` reports a
  launch error as `failed:` where the version checks say `could not start`; a HANDOFF residual.
- HANDOFF: pi-probe-timeout's residual lines on a group SIGKILL orphaning a hung pi and on Windows skip lines printing
  PASS go, since this lane fixes them. Its lines on the 1 MiB combined cap, a kill of install alone, the deadline
  kill's missing grace and the independent check never re-run on its build 2 are reworded to the lane's result.
- Rows: R-2130 to R-2133 read `implemented` in REQUIREMENTS.md. The seat helper's re-run at the notes commit: `node
  scripts/requirements-trace.mjs` reads `1572 total (1314 implemented · 1 planned · 34 retired · 218 untested · 5
  violated)` and `ears: 0 rows off form (allowance 0)`; `npm run map:check` reads 340 modules, 0 problems; `npm run
  readme:check` reads 719 claims, 0 problems; `node scripts/requirements-tree.mjs --check` exits 0.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base 54f1271f`, the merge base):
  ```
  tree movement 54f1271..8d4783e: 4 rows in 1 features
  FEAT-013 · Install and connect harness runtimes
    R-2130 new (implemented)
    R-2131 new (implemented)
    R-2132 new (implemented)
    R-2133 new (implemented)
  ```
  CAP-04 moves from 464 to 468 rows, FEAT-013 from 172 to 176 and SUB-013 from 41 to 45. No existing row changed.
- Not in this record: a seat-run locked full suite (CI's three legs ran the whole suite) and the local macOS install
  check, which runs before the land.
- Main was 54f1271f when the lane merged it at 86240f7f. It is now 54433844, after four lands: install-cli-pins,
  pack-config-agent-dir-pins, win-lock-fix-command and handoff-pins. None touches the relay files or the launch test
  file; they share HANDOFF, REQUIREMENTS.md, the code map, the tree and the setup README. So the land needs a merge
  of main and a confirmation round on the merged tip.
