# Independent check — pi-probe-timeout at 4c67ba2c (2026-10-20)

VERDICT: HOLDS

Lane tip 4c67ba2c, base cdf4b098. Everything ran in a private copy under $P=$TMPDIR/pi-probe-timeout-check.5eDVjA, with HOME and TMPDIR set to folders under $P. I also made a baseline copy of main at cdf4b098 in $P/main to compare against. No repository was edited. Nothing ran on Windows.

Probes (macOS, node 22, real pi 1.0.2)
1. Must-meet tests: `HOME=$P/home TMPDIR=$P/tmp node packages/nana-setup/tests/pi-launch-limits.test.mjs`
   Output: PASS R-2020, R-2021, R-2022, R-2023, R-2024, R-2025 and R-2026 (7/7), in 35.7 s total. $P/tmp was empty afterwards.
   Verdict: holds.
2. CLI dry run with a hung fake pi (sh → node → a child node) and the default limit: `PATH=$P/probe/hangbin:$PATH node packages/nana-setup/bin/nana-setup.mjs install --dry-run`
   Output: `✗ pi packages  problem  pi --version gave no answer within 30 s and was stopped` / `exit=1 secs=30`. Both recorded pids were dead.
   Verdict: holds.
3. CLI doctor with the same hung pi: `... nana-setup.mjs doctor`
   Output: `✗ pi executable  pi --version gave no answer within 30 s and was stopped — install: npm i -g ...` / `exit=1 secs=30`. Both pids were dead.
   Verdict: holds.
4. Real pi 1.0.2, main and lane side by side: `node $P/probe/step.mjs <root> doctor|dry|install` (calls stepPiRegister and diagnose on a temp layout)
   Output: doctor `ok 1.0.2` (main 281 ms, lane 249 ms). Dry run `created` (would add) on both. Install `created` on both, with the same two `packages` entries in the temp settings.json.
   Verdict: holds. Each launch costs about 30 ms more.
5. pi error variants, main against lane, with PATH=<bin>:/usr/bin:/bin:
   - exit 3 with stderr: `pi --version failed: boom: settings lock held` on both.
   - no pi on PATH: dry run `skipped pi is not on PATH`, doctor `fail pi not found or could not start` on both.
   - pi not executable: main says `could not start: spawnSync pi EACCES`, the lane says `could not start: spawn pi EACCES`.
   - multibyte version line: `ok 1.0.2 é中😀` on both.
   Verdict: holds. Only the EACCES wording changed.
6. win32 forced through the relay: `FAKECMD=... node $P/probe/win.mjs $P/lane [2000]` (platform → win32, ComSpec is a fake recorder)
   Output: argv arrived intact as `/d /v:off /s /c ""C:\Tools\pi\pi.cmd" "install" "<pack>""`. PI_CODING_AGENT_DIR was set on the two installs only (`agent=none` on --version). Install and doctor both said `created`/`ok 1.0.2`. With a hung ComSpec and a 2 s limit: install `2044 ms problem pi --version gave no answer within 2 s and was stopped`, doctor `2142 ms fail ...`. No `sleep 60` was left.
   Verdict: holds. taskkill itself is not exercised on macOS.
7. Only nana-setup killed (kill -9 on step.mjs), limit 4 s:
   Output: at 2 s both pids were alive. At 6.5 s both were dead, and no relay process was left.
   Verdict: holds. This matches the plan's own known limit.
8. Ctrl-C (group SIGINT) while a fake `pi install` holds a lock folder and has a SIGINT handler: `node $P/probe/sigint.mjs <root> $P/probe/settings.json.lock`
   Output: main `{"lockTaken":true,"lockLeftAfterCtrlC":false}`, lane `{"lockTaken":true,"lockLeftAfterCtrlC":true}`.
   Verdict: behaviour change, see finding 1.
9. Large output: a fake pi writes 700 KB of `"` to stderr and exits 1.
   Output: main `pi --version failed: last line here`, lane `pi --version could not start: spawnSync .../node ENOBUFS`.
   Verdict: see finding 2.
10. pi prints its version, exits 0, but leaves a child holding stdout for 8 s. Doctor with a 3 s limit.
    Output: main `8346 ms ok 1.0.2`, lane `3089 ms fail pi --version gave no answer within 3 s and was stopped`.
    Verdict: works as designed, since the deadline also covers held pipes. Only the wording is loose.
11. Repo checks and neighbouring test files:
    - `node scripts/code-map.mjs --check`: `336 modules ... 0 problem(s)`
    - `node scripts/readme-check.mjs`: `716 claims checked; 0 problem(s)`
    - `requirements-moved.mjs --base cdf4b098`: R-2020 to R-2026 new (implemented)
    - `tests/pi-registration.test.mjs` and `tests/doctor-runtime.test.mjs`: exit=0
    Verdict: holds.

Findings
1. Known bug (low). Ctrl-C during `pi install` now kills pi with SIGKILL; before, pi got SIGINT. pi now runs in its own session (detached), so the terminal's SIGINT reaches only the relay, and the relay kills the whole group at once.
   - Effect: pi's proper-lockfile cleanup never runs, so `settings.json.lock` stays behind (probe 8).
   - It recovers by itself: proper-lockfile treats a lock as stale after 10 s. A re-run inside that window fails ✗ with ELOCKED.
   - Inferred, not run: pi writes settings.json with a plain writeFileSync. A SIGKILL landing inside that write could cut the file short. Before, its signal-exit handler ran after the write finished. The window is microseconds.
   - Possible fix: the relay forwards the signal it received to the group, waits briefly, then sends SIGKILL.
2. Known bug (low). The relay puts pi's stdout and stderr together into one JSON line. The outer spawnSync limits that line to its default 1 MiB maxBuffer. Before, each stream had its own 1 MiB.
   - Quote-heavy or combined output over 1 MiB now reports ENOBUFS "could not start" instead of pi's real error (probe 9).
   - A successful `pi install` with that much output would be reported ✗ even though it worked. A re-run would then show it as already in place, so no data is lost.
   - Realistic pi output is far below this.

No MUST findings. I found no data loss and no fail-open. No process was left after any probe, and no file was written outside the temp folders. Everything main does today still worked in probes 4 and 5.

The claim I would most expect to be wrong is the Windows tree kill (`taskkill /T /F /PID`) and Ctrl-C on Windows. They are reasoned from code only; only the hosted Windows run proves them.
