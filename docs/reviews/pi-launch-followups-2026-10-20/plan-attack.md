# pi-launch-followups — plan attack (one adversary)

Verdict: AMEND

AMEND. The plan is sound: right class, right wait, three real bugs. But the watch design as written cuts pi's one-second Ctrl-C grace to one poll, and no check in the plan notices. All probes ran on macOS with Node 22, in a temp clone of feat/pi-probe-timeout 15703d8d, with a temp HOME and TMPDIR. Nothing was written outside that folder, and the folder is now removed.

Findings:
1. MUST (probed). The plan says "on a change it calls terminate("SIGINT")" from a repeating interval. Built that way, the next tick (200 ms later) calls terminate again. terminate treats a second call as a second Ctrl-C and calls finishTermination at once. Ctrl-C now reaches pi only through this watch, so pi gets at most 200 ms to clean up instead of RELAY_SIGNAL_GRACE_MS. The existing R-2027 lock check stays green because its fake pi cleans up at once.
   - A pi that needs 400 ms to clean up loses its lock under W7 (the watch fires every tick) and keeps it under the fixed watch.
   - A watch that fires once but ignores a termination already in progress (W8) also kills at once. That happens when a supervisor signals install and the relay together.
   - Fix: on a change, clear the interval, and call terminate only when no termination is in progress.
   - Pin: a new row, R-2133, with a two-phase check. It is green today and green on the fixed prototype. It goes red under W3, W7 and W8 (all probed).
2. Probed. The fake pi in R-2130 and R-2131 dies on SIGINT, so those checks never reach the kill after the grace. W6 (the watch passes SIGINT and never kills) passes both. The amendment adds an IGNORE_SIGINT switch to the hang fixture. With it, W6 turns both red. The fixed design ends every process in 1.04 to 1.17 s, inside the 2.2 s bound.
3. Red today, confirmed by probe:
   - R-2130 and R-2131: all three fake processes were still alive at the 2.2 s bound.
   - R-2132: both runs read `failed: spawnSync <node> ENOBUFS`. W4 (8 MiB) is red.
   - W1 is red on R-2130 only. W2 is red on both kill checks. W5 (compare with pid 1) survives on macOS.
   - On the guarded prototype, the file's nine existing checks pass (37 s), as do pi-registration (70/0) and doctor-runtime (21/0).
4. The bug 1 call holds against pi 1.0.2's installed source. withLock takes proper-lockfile's lockSync inside one synchronous read and write, with a busy-wait retry of 10 × 20 ms. A local-folder `pi install` only checks that the path exists and runs no npm.
5. Scope fixes:
   - The feature sentence and README claimed doctor, but only install is checked. The amended text names install only, and a known limit says doctor and the dry run share the relay.
   - The README sentence goes in the Idempotence section, not an "install paragraph".
6. Cross-platform:
   - Linux is not probed: the docker daemon was down. libuv's detached flag maps to setsid on both systems, so Linux should match macOS (inferred). The Ubuntu CI leg does not block, so the seat must read its R-2130, R-2131 and R-2133 lines.
   - win32 is untouched except maxBuffer. R-2132 runs everywhere.
   - nana-setup registers no signal listener (grep), so install dies on a group signal as the design needs.
7. Class: install, hook or gate is right, because the lane changes the relay behind install, its dry run and doctor.

Files the build touches:
- packages/nana-setup/lib/bounded-spawn.mjs
- packages/nana-setup/lib/bounded-spawn-child.mjs
- packages/nana-setup/tests/pi-launch-limits.test.mjs
- packages/nana-setup/README.md
- REQUIREMENTS.md
- docs/requirements-tree.md
- docs/code-map.md
- Seat only: HANDOFF.md, docs/sessions/2026-10.md, docs/reviews/pi-launch-followups-<date>/. The seat retires or rewords the pi-probe-timeout residual lines on the 1 MiB cap, group SIGKILL, lone kill, Windows skip PASS and deadline grace.

Conflicts:
- pi-probe-timeout adds every file this lane edits. The build must wait for it to land.
- config-advice-fixes, install-cli-pins, pack-config-agent-dir-pins and win-lock-fix-command all branch from the pi-probe-timeout tip, and none edits the relay files or pi-launch-limits.test.mjs. win-lock-fix-command edits packages/nana-setup/README.md near lines 273 and 313 and adds a settings-lock row to the test table. None of that touches the Idempotence sentence or the pi-launch-limits row, so the merge should be clean.
- install-cli-pins edits REQUIREMENTS.md hunks ending about six lines above R-2020. The new rows go after R-2027. Regenerate the tree and the map at merge.
- handoff-pins shares no file.
- In this slate, mutation-runner-lock-overlap may edit packages/nana-pack/lib/mutation-runner-config.mjs. The relay imports TASKKILL_ARGS from it, so only a rename or move of that name conflicts. notify-lifecycle-pins and post-edit-timeout-name are pack-side and share no file.
- Every lane shares REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md and HANDOFF.md.

Claim most likely wrong: that Linux behaves like macOS. That covers the detached spawnSync putting the relay in its own session, process.ppid changing when install dies on a hosted Ubuntu runner, and dash as /bin/sh not upsetting the SIGINT-ignoring hang fixture. None of it ran here, and the Ubuntu leg does not block release.
