I reviewed `git diff origin/main...HEAD` on `feat/memory-end-ebusy` (tip `fb9aa97d`). No MUST finding stands: the change can land.

**Will it stop the two Windows failures?**

- **The hook test (`memory-end-hook.test.mjs`).** The temp folder was held by the detached fixture itself. The hook gets `HOME`/`USERPROFILE` set to the temp folder `td`. The hook passes no `home` to `spawnMemory`, so `memory-start.mjs` falls back to `os.homedir()`, which is `td`. The detached run therefore starts with its working folder inside `td`, which blocks `rmdir` on Windows. The fixture now records its own pid. The R-3355 wait (line 79) and the `finally` block (lines 89–92) both poll until that process has exited, for at most 10 s, before calling `rmSync` with the existing retries. On Windows, `process.kill(pid, 0)` reports ESRCH both for a process that has exited and for a pid that no longer exists. So the wait ends when the fixture's process ends, and the existing retries cover the short teardown window after that. This addresses the cause stated in the brief.
- **The profile fixture (`profile-fixture.mjs`).** `close` now uses the shared `TEMP_REMOVE_RETRIES` / `TEMP_REMOVE_RETRY_DELAY_MS` constants. Node 22's `rimrafSync` retries only on EBUSY, EMFILE, ENFILE, ENOTEMPTY and EPERM, waiting longer each time, up to about 1 s. The change only makes cleanup more patient and hides no assertion. This is what the brief asked for. Whether that wait is long enough for whatever held `remote.git` is shown only by the Windows leg (see the third NOTE).

**Is any check weakened?** No. R-3355 still waits for the marker and asserts every condition it asserted before. It also asserts that the fixture recorded its pid and has exited. If the run were not detached, the marker would never appear and the case would still fail. The two waits are bounded at 10 s each, so the worst case (about 14.5 s) stays far inside `check`'s 120 s case timeout.

**Does it wait only for processes the test started, with bounded waits?** Yes. It waits only for the fixture's recorded pid and kills nothing new. With `MEMORY_CASE` filtering, or when the fixture never started, there is no pid file and no wait.

**Does it cause a listed harm?** No. Only test files and docs change, and the new pid file lives inside `td`. Locally on macOS, both changed test files pass (`memory-end-hook` 7/7, `profile-sync` 2/2) and `npm run map:check` reports 0 problems. The CI runs on the tip (41357098472) and the previous commit (41357011147) were still running when I checked. `nana-land` will wait for the tip's run to pass.

**Findings (none is a MUST)**

- **NOTE: the new "fixture exited" check can rarely fail when Windows reuses a pid** (`memory-end-hook.test.mjs:28`, `:79`–`:80`). `isProcessRunning` treats any error other than ESRCH, including EPERM, as still running. Suppose Windows hands the fixture's pid to another long-running process within one 50 ms poll (the suite runs four files at once). R-3355 would then wait 10 s and fail its new assertion. This is rare, and it is a new way for the case to fail rather than a weakened check. On Linux with no init process to clean up exited children (for example, node as PID 1 in a container), the exited fixture would stay visible and fail the same way. That environment is outside the supported ones.
- **NOTE: the brief's "no new inline literal" rule is not fully met** (`memory-end-hook.test.mjs:26`, `:91`). `DETACHED_FIXTURE_EXIT_WAIT_MS` is named, but unlike the repo's other tuning constants it has no "chosen" comment explaining its value. The new `finally` loop also repeats the inline 50 ms poll.
- **NOTE: the profile-fixture fix assumes about 1 s of retries is enough, but nothing was measured** (`profile-fixture.mjs:50`). Every git call in "two machines converge" uses `spawnSync`, so no process the test started outlives its call. Whatever held `remote.git` is outside the test, and `test-runner-config.mjs` itself says "No Windows hold duration was measured". Only the Windows CI leg can show the retries are enough.

None of these changes any line in `docs/known-bugs/FEAT-040.md`.

VERDICT: LAND
