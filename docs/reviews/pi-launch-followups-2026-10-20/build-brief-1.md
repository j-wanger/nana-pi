# Build brief 1 — pi-launch-followups

Feature: FEAT-013 · Install and connect harness runtimes. Lane class: install, hook or gate. Builder: pi-worker (complex lane). Base: main after pi-probe-timeout lands. Plan of record: must-meet.md beside this brief. Rows R-2130 to R-2133; leave R-2134 to R-2139 unused.

## What to change
1. `packages/nana-setup/lib/bounded-spawn.mjs`
   - POSIX only: pass `detached: true` to the outer spawnSync. Keep every win32 option exactly as it is.
   - Add `parentPid: process.pid` to the launch spec, and pass `maxBuffer: RELAY_RESULT_MAX_BYTES` to the outer spawnSync.
   - Define `RELAY_PARENT_POLL_MS = 200` and `RELAY_RESULT_MAX_BYTES = 16 * 1024 * 1024` beside the RELAY_* constants. Give each a dated `chosen` provenance, with the reasons from must-meet.md. Neither is sealed, so add no pin test.
2. `packages/nana-setup/lib/bounded-spawn-child.mjs`, POSIX only: when `spec.parentPid` is an integer, start an unref'd interval at RELAY_PARENT_POLL_MS. When `process.ppid !== spec.parentPid`, clear the interval. Then call `terminate("SIGINT")` only if no termination is in progress. Leave the deadline path, the Windows path and the signal handlers alone.
3. Update both six-tag headers to match.
4. `packages/nana-setup/tests/pi-launch-limits.test.mjs`
   - Fixtures:
     - hang.cjs installs an empty SIGINT handler when `IGNORE_SIGINT` is set.
     - signal-cleanup.cjs waits `CLEANUP_DELAY_MS` (default 0) after SIGINT before it removes its lock and exits.
     - Existing checks keep their behaviour.
   - R-2130 and R-2131:
     - Use R-2026's wrapper (limit HANG_MS, pi hung on --version) with `IGNORE_SIGINT=1`.
     - Once three pids are recorded, SIGKILL the wrapper's group (R-2130) or the wrapper alone (R-2131).
     - Pass when every recorded pid is dead within RELAY_PARENT_POLL_MS + RELAY_SIGNAL_GRACE_MS + RELAY_ELAPSED_MARGIN_MS of the kill, read by name. Assert that bound is below HANG_MS.
   - R-2132:
     - Use a fake pi (sh or pi.cmd wrapper) whose `--version` prints 1.0.2. Its `install` writes 1 MiB minus 64 bytes of U+0001 to stdout and to stderr, then `\nboom: last line\n` on stderr.
     - Run it once with exit 0 and once with exit 1, with limit HANG_MS. Set the exit with process.exitCode, not process.exit.
     - Name the 1 MiB as a test constant with provenance `contract: R-2132 (main's spawnSync default per stream)`.
     - Exit 0 must read `created` with installExitCode 0. Exit 1 must read problem, with a detail ending `failed: boom: last line`. Run it on every platform.
   - R-2133:
     - Use R-2027's cleanup fixture with CLEANUP_DELAY_MS = 2 × RELAY_PARENT_POLL_MS, and assert it is below RELAY_SIGNAL_GRACE_MS.
     - Phase one: send SIGINT to the wrapper's group.
     - Phase two: send SIGINT to the relay, then straight away to the wrapper's group. The relay is the ppid pi recorded, because the fixture's sh execs pi.
     - Each phase passes when the wrapper exits, the lock is gone and every recorded pid is dead.
   - Each `// req:` marker sits directly above a one-line `check("R-213n: …", …` that carries the must-meet title. The win32 skips for R-2130, R-2131 and R-2133 carry the must-meet reasons.
5. Every skip branch in the file (R-2026, the R-2027 lock check, R-2130, R-2131, R-2133) returns a skip result, and the runner prints SKIP, not PASS, for it.
6. REQUIREMENTS.md: add R-2130 to R-2133 under FEAT-013 after R-2027, with the must-meet text, as `untested`. Flip each to `implemented` with its test once green. Run `npm run req:tree` and `npm run map`.
7. `packages/nana-setup/README.md`:
   - Add one sentence after the launch-limit sentence in the Idempotence section. It says that on macOS and Linux, install's relay also ends its pi launch when install is killed, even with its whole process group, and still gives pi its grace.
   - Extend the pi-launch-limits row of the test table.

## Wrong code to try in a temp copy (never commit it)
- W1, no `detached`: R-2130 red.
- W2, no watch: R-2130 and R-2131 red.
- W3, the watch calls finishTermination at once: the R-2027 lock check and R-2133 red.
- W4, RELAY_RESULT_MAX_BYTES at 8 MiB or no maxBuffer: R-2132 red.
- W6, the watch calls passSignal only: R-2130 and R-2131 red.
- W7, the watch calls terminate on every tick: R-2133 red.
- W8, the watch fires once but ignores a termination in progress: R-2133 red.
- W5, the watch compares process.ppid with 1: expected to survive on macOS; report it.
The plan probed all eight. Write no literal pi launch spelled as spawn("pi" in any docs/reviews script.

## Done
- R-2130 to R-2133 are implemented and green, and R-2020 to R-2027 still pass.
- Run single files only: pi-launch-limits, doctor-runtime, pi-registration, install.
- `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` exit 0.
- Add no typed leaf total.
- Do not run the full suite, push, open a pull request, or edit HANDOFF.md or docs/sessions/.
- Commit on feat/pi-launch-followups.

## Report (at most 10 lines)
VERDICT, the commit, the two constants and their provenance, the README sentence, each wrong-code try and the checks it turned red, the file's PASS and SKIP counts on macOS, and anything not done.
