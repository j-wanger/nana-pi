Feature: FEAT-006 · Launch builders with execution limits. Lane build-records, row R-2598. Class: ordinary. Builder: pi-worker (larger lane). Build session 3: one missing must-meet case the seat's pairs found.

Work in the lane worktree on feat/build-records. Builds 1 and 2 end at cb2d3f0a. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-pack/tests/win32-launch.test.mjs — the short-path lane launch (about :347-375): the PowerShell `Scripting.FileSystemObject` ShortPath probe, the launch with `cwd` set to the 8.3 form, and the SKIP line when the volume keeps no short name.
- packages/nana-pack/tests/build-records.test.mjs — R-2598's cases and the `runWorker` helper.
- docs/reviews/build-records-2026-10-22/must-meet.md — R-2598's "What each test does": "On win32, one build launches from the 8.3 short path (skipped when the volume keeps no short names)."

F1 (must fix). R-2598 has no win32 short-path build, which the plan of record lists. The seat's pair p13 (the session folder encoded from `fsReal(process.cwd())` instead of the raw `process.cwd()`) survives on macOS, because a POSIX process's cwd is already its real path; on Windows, `realpathSync.native` expands an 8.3 short name that pi's own encoder keeps, so only a short-path launch can show the difference.

1. Add to R-2598's test, on win32 only, one lane build launched with `cwd` set to the worktree's 8.3 short path, found the way win32-launch.test.mjs finds it. Assert the end record's `cost` equals the stub session's cost and its `sessions` list holds that session. When the volume keeps no short name, print one `SKIP` line with that reason and treat the case as passed, as the precedent does. Change nothing else.
2. Run `node packages/nana-pack/tests/build-records.test.mjs` (on macOS the new case does not run), then `npm run test:locked` before your commit.

Seat check: `node docs/reviews/build-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- R-2598 holds a win32 short-path build with its skip rule; the test file and the full suite are green on macOS; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the change; each departure from the Precedent files with its reason; the full suite's summary line; the seat-check status.
