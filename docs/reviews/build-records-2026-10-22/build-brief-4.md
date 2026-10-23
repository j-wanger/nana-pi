Feature: FEAT-006 · Launch builders with execution limits. Lane build-records, row R-2601's test only. Class: ordinary. Builder: pi-worker (small lane). Build session 4: the Windows cleanup in the build report's test.

Work in the lane worktree on feat/build-records. Change only `packages/nana-pack/tests/build-report.test.mjs`. Do not edit HANDOFF, the session archive, the known-bug files, the rows or any code under `lib/` or `bin/`.

Finding F4 (draft PR CI, Windows suite leg, tip 967fc32f): both checks pass, then the file exits 1. Its last line, `fs.rmSync(TD, { recursive: true, force: true })`, throws `EBUSY: resource busy or locked, rmdir '…\build-report-test-…\linked'`. The test runner's own cleanup of its temp folder then hits the same EBUSY on `linked`. The hard-kill case starts pi-worker with `cwd: LINKED`, kills pi-worker with SIGKILL, then sends SIGTERM to the fake pi's pid. On Windows a SIGKILL ends pi-worker alone, not the processes it started, and a killed process's handle can outlive the kill for a moment. So something started under `LINKED` still holds it when the file removes `TD`. macOS and Linux pass.

Precedent:
- packages/nana-pack/tests/agent-dir-parity.test.mjs — lines 213 to 221: a named retry count and delay with a `chosen` provenance comment, passed to `fs.rmSync` as `maxRetries` and `retryDelay`.
- packages/nana-pack/tests/immutable-review.test.mjs — `TEMP_REMOVE_MAX_RETRIES` and `TEMP_REMOVE_RETRY_DELAY_MS` at its cleanup.
- packages/nana-pack/tests/post-edit-hardening.test.mjs — `POST_KILL_POLL_MS` and its win32 `taskkill` tree kill, for waiting until a killed process is gone.

1. Make the hard-kill case end every process it started before the file removes `TD`, on every platform. On win32, kill pi-worker's whole tree (`taskkill /PID <pid> /T /F`, as the post-edit precedent does) where the test now sends SIGKILL; elsewhere keep SIGKILL. The check must still see a start with no end record, so the kill must still stop pi-worker before it writes its end record. Then wait, under a named limit, until the fake pi's pid no longer answers `process.kill(pid, 0)`.
2. Remove `TD` with a named retry count and delay, each with a `chosen` provenance line, as the precedents do. A removal that still fails prints one line naming the path and the error and leaves the exit code to the checks.
3. Keep both check titles, their `// req:` markers and every assertion unchanged.
4. Run the file, then run it once more with TMPDIR, TEMP and TMP pointed at a long folder outside the worktree (about 120 extra characters). Then run `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `npm run test:locked` before your one commit.

Seat check: `node docs/reviews/build-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done: the file ends 0 on macOS with both checks passing, its kill and wait steps run on every platform, and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; what holds `linked` on Windows, by reasoning from the code (say it is inferred); the two runs' results; each departure from the Precedent files with its reason; the full suite's summary line; map, readme, trace and seat-check status.
