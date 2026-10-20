# review-test-waits — plan attack (one adversary)

Verdict: AMEND

Probes ran in a temp clone of main d4423eff on macOS with a temp HOME and TMPDIR. No repository was edited.

What held:
- Cause, probe A: one second between the sh fake's header and argv writes gave exactly two FAILs, dirty-state and review standard, with observed[3] "".
- CI Windows log, run 39348142806: reclaim FAIL with killedCheckout "", stall FAIL with one cpu line in 30 s, and an uncaught EBUSY at the final rmSync on the repo folder 17 s later.
- The runner's non-verbose excerpt shows only FAIL lines, or the first 20 lines when there are none. A cleanup crash's EBUSY never reaches the report, so R-1922 earns its place.
- Unified Node fake: plain runs gave 18/18 three times, 13 s each.
- Today's file under the preload: 13 PASS, 5 FAIL (dirty-state, review standard, source commit, signal, reclaim), then an uncaught EBUSY. M1, M2 and M3 are red today.
- Wrong B (unified fake, fixed 5 s waits): the same 5 FAILs and the crash.
- The fix under the preload: 18 PASS plus the named cleanup FAIL, exit 1, 46 s.
- Wrong A (two-step write, fix otherwise in place): exactly dirty-state, review standard and the cleanup line FAIL, exit 3.
- A CommonJS preload's fs patch reaches the test's ESM import without syncBuiltinESMExports (Node 22).
- Lane class ordinary is right: tests only.

Amendments:
1. NODE_OPTIONS on Windows. Inside double quotes Node drops backslashes (probed: "/tmp/x\y.cjs" loads /tmp/xy.cjs). Unquoted, the path breaks on a space. Pass `--require="<path with forward slashes>"`.
2. META_RUN_LIMIT_MS goes from 240 s to 270 s, and the helper checks run before the child run. After win-watchdog-cpu-read lands, a loaded Windows immutable-review can take about 200 s (88 s observed, plus up to 120 s for the stall guard, plus the preload's 22 s). The child must fail by name before the runner's 300 s kill.
3. M1 read three titles; R-1920 says "each check that launch meets". M1 now reads every watched launch's title, and its title no longer names the tunable's value.
4. review-ledger section 7 attaches k.once("exit") after the kill. A launcher that exits during the wait would make that await hang forever, and process.kill would throw ESRCH on an exited launcher. The fix makes the exit promise at spawn and signals only a running launcher.
5. R-1924 case (a) uses an empty record file, matching "before the record is complete". The helper reads before it gives up.
6. Corrections. win-watchdog-cpu-read's worktree already carries its immutable-review fold (59340ee7, 9 lines). The plan said it had not edited the file yet. The plan's second risk is retired: Linux `ps -o time=` reports whole seconds, so an idle Node fake always reads flat and the stall check stays reliable there.
7. The feature is now one sentence.
