No MUST finding stands; the lane can land.

**Scope reviewed:** `git diff f2b27357..HEAD`. The code change is about ten lines in `packages/nana-pack/bin/pi-worker.mjs`. The tests are in `worker-claude.test.mjs` and `build-records.test.mjs`. The README sentence and the known-bug lines also changed. I read `pi-watchdog.mjs`'s `runWatchdog`/`runOnce` to check how signals are delivered.

**Can a handled refusal, stop or closed pipe still leave the settings file?**
- **Review options:** the check now runs at module top (`pi-worker.mjs:55-59`), before option parsing, the lane block, the roster read, the settings read and `mkdtempSync`. No temp file can exist when it refuses.
- **Every other handled exit after the temp folder exists:** each one still removes it.
  - `laneFailure` removes it, including the held lock.
  - The `w.error` branch removes it (the bad stall option).
  - The `finally` around `runWatchdog` removes it (a finished build, the ceiling, an unwritable output, a signal during the build).
- **Closed stderr:** `process.stderr.on('error', () => {})` turns the uncaught EPIPE crash into a write that is ignored. The watchdog loop then runs to its end and the `finally` cleans up. On main, pi-worker crashed and left the folder, while the detached builder ran on. So this is strictly better.
- **What still leaks:** an uncaught throw between `mkdtempSync` and the watchdog, such as ENOSPC on `writeFileSync`, still leaves the folder. That was true on main too and is outside the handled-exit list. NOTE.

**Can the new listeners or the moved refusal stop or change a healthy build?**
- **No swallow window:** nothing between the no-op registration (`pi-worker.mjs:155`) and `runWatchdog`'s own `process.on` (`pi-watchdog.mjs:278`) awaits.
  - That stretch covers the preamble, prompt and settings writes, `trusted()` via spawnSync, `acquireLaneLock`, `keepBuildStart`, and `runWatchdog` itself up to its first `await` in `runOnce`.
  - A signal sent in that window stays queued and is delivered to both listeners at the first event-loop turn. The watchdog's `stop` sets `signal`, and `interrupted()` kills the just-spawned group.
  - R-2693 pins this for Claude and pi builders, and a build's exit code stays 130/143/129.
- **Non-lane mode is unchanged:** the listeners are inside `if (laneMode)`.
- **Moved refusal:** the check now scans the args before `--` (including the node and script paths) instead of `w.ownArgs`. No real pi-worker call passes those five flags, and anything after `--` is still not checked, as before. The only change in order is that a review option now wins over a usage error, which is harmless.
- **Is a stop signal swallowed so a build runs on?** Only in two narrow cases, both recorded as FEAT-006 lines:
  - A start-up step that really hangs (`trusted()`, a git call) ignores a signal sent to pi-worker's own pid. On main, that signal killed pi-worker. A group signal (terminal Ctrl-C) or SIGKILL still stops it, and no builder is running yet. SHOULD-level at most: I can't name a realistic hang there.
  - A signal sent after the watchdog has returned is ignored, and pi-worker exits with the builder's real result. The builder had already finished, so no build runs on. NOTE.

**Tests:**
- **R-2691** would fail on main. Main prints the carry line and writes the temp folder before it refuses. The missing-brief run catches a late placement inside the lane block (pair V2).
- **R-2692's closed-stderr case** needs exit 0 and an empty folder. On main, pi-worker crashes on the first progress write.
- **R-2693** fails on main, where node exits by default signal action with a null code. It covers all three signals plus a pi-roster run.
- **The decoy setting works:** I ran `worker-claude.test.mjs` with `CLAUDE_CONFIG_DIR` exported to a missing folder, and every check passed. R-2691/2692/2693 PASS, R-2655/2664/2665 PASS, R-2650 SKIP (Windows-only).
- **Writes stay contained:** every per-case temp root lives under the test's `TEMP`, which is removed at the end. Fixture builders are SIGKILLed by pid file. Nothing writes outside the worktree or the OS temp folder.

**Smaller notes (SHOULD/NOTE, for the known-bug file if not already there):**
- NOTE: the start-up signal path starts the builder and kills it at once, so a Claude builder may live for a few milliseconds. It is already recorded.
- NOTE: the README's hard-kill sentence matches the code and the FEAT-006 limits.

VERDICT: LAND
