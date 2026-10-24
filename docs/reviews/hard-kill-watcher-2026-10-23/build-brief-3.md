Feature: FEAT-006 · Launch builders with execution limits. Lane hard-kill-watcher. Class: gate. Builder: pi-worker (small lane). Build session 3: the Windows CI suite leg fails at every tip since build 1 (runs 40052982470, 40056844401, 40057408224, 40059923100; last at 46a55957).

Work in the lane worktree on feat/hard-kill-watcher. The spec is still `docs/reviews/hard-kill-watcher-2026-10-23/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder. Do not change product code under `packages/nana-pack/lib/` or `packages/nana-pack/bin/`: the evidence below says the watcher works on Windows and the tests cannot see it.

Precedent:
- packages/nana-pack/tests/worker-claude.test.mjs — `watchersFor` and `watcherReady`, the Windows branch to fix; its macOS `ps` branch stays as it is.
- packages/nana-pack/tests/build-report.test.mjs — `watcherLines` and the R-2725 `watcherReady` and `watcherGone` waits, the same fix.
- packages/nana-pack/lib/lane-watcher.mjs — `startLaneWatcher` passes the lane spec as `JSON.stringify(absolute)` on the hop's command line, and lane-watcher-child.mjs passes it on to the `--watch` process; unchanged.
- packages/nana-pack/tests/process-tree-helper.mjs — the lane's shared test module; put a lookup both files share here rather than copying it.

The failure, the same five checks on every run: in worker-claude.test.mjs R-2721, R-2722, R-2724 and R-2728, and in build-report.test.mjs R-2725. Each observation has `ready: false` and `watcherGone: false` (R-2728: `betaIntact: false`, `allGone: false`), while the product's own effects are right: R-2725 has `endArrived: true` with one `stopped` end record, and R-2721 and R-2722 have the temp folder empty and the lock as expected. macOS and Linux pass.

The seat's diagnosis (inferred from the code; not run on Windows):
- W1. The Windows lookup matches `CommandLine -like '*<root>*'` with the raw root. The watcher's command line carries the root inside JSON, so every backslash is doubled (`C:\\Users\\...`), and the raw root never matches. So no `--watch` line is ever found: `ready` stays false.
- W2. The PowerShell process that runs `Get-CimInstance` has both search strings in its own command line, so it matches itself. The list is never empty: `watcherGone` stays false.

Fix both helpers so that on Windows they list only real watcher processes of this test's lane: node processes other than the query itself (exclude PowerShell's `$PID`, or filter on the process name), matched by a token that survives JSON escaping (for example the lane folder's last path segment, or the root as JSON escapes it). Keep each wait's limit, or raise it on Windows only if one PowerShell call is slow enough to need it; say which in the report. A shared lookup goes in process-tree-helper.mjs.

You cannot run Windows here. Do not claim the Windows leg passes. The seat pushes your commit and reads the Windows CI leg; a failure there comes back in the next brief.

Checks before your one commit: worker-claude, build-report and lane-watcher test files each alone with `CLAUDE_CONFIG_DIR` unset and a scratch TMPDIR, then confirm no `lane-watcher-child.mjs` process is left; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/hard-kill-watcher-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: both helpers exclude the query's own process and match the JSON-escaped command line on Windows, the macOS branches are unchanged, the full suite is green on macOS, the seat check prints `0 missing`, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; W1 and W2 done and how; any limit you changed; the full suite's summary line; map, readme, trace, tree and seat-check status; the Windows leg as unverified.
