Feature: FEAT-006 · Launch builders with execution limits. Lane hard-kill-watcher. Class: gate. Builder: pi-worker (small lane). Build session 4: build 3 (7d03134b) fixed four of the five Windows failures; R-2728 still fails on Windows (CI run 40062423521).

Work in the lane worktree on feat/hard-kill-watcher. The spec is still `docs/reviews/hard-kill-watcher-2026-10-23/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder. Do not change product code under `packages/nana-pack/lib/` or `packages/nana-pack/bin/`.

Precedent:
- packages/nana-pack/tests/worker-claude.test.mjs — the R-2728 block: `alphaGone` and `betaIntact` match each watcher by the worker's pid inside its command line.
- packages/nana-pack/tests/process-tree-helper.mjs — `windowsLaneWatchers`, build 3's shared lookup; a pid reader both platforms share goes here.
- packages/nana-pack/lib/lane-watcher.mjs — the spec reaches the watcher as one JSON argument, unchanged.

The failure at 7d03134b: `{"started":true,"ready":true,"alphaGone":true,"betaIntact":false,"allGone":true,"empty":true,"alphaLock":false,"betaLock":false}`. macOS and Linux pass.

The seat's diagnosis (inferred from the code; not run on Windows):
- W3. `alphaGone` and `betaIntact` look for the substring `"workerPid":<pid>` in each watcher's command line. On Windows the JSON argument is quoted, so each `"` inside it reads `\"`, and the line holds `\"workerPid\":<pid>`. The substring never matches there. So `betaIntact` is always false on Windows, and `alphaGone` is true without testing anything.
- W4 (check it after W3). beta's build sleeps 3 seconds. On Windows each lookup is one PowerShell call, so the ready wait, the kill and the alpha wait may outlast beta's build, and beta may end before `betaIntact` is read. If so, give beta a longer sleep on Windows only, still well inside the case limit.

Fix W3 by reading the worker pid from each watcher line in a form that holds with and without the `\"` escaping (one shared helper, both checks), and fix W4 if it applies. Keep the macOS behaviour of the check the same. Do not touch R-1713 in hooks-win32-exec.test.mjs: it failed once in that run, on timing, and this lane does not touch the knowledge hook.

You cannot run Windows here. Do not claim the Windows leg passes; the seat pushes and reads it.

Checks before your one commit: worker-claude, build-report and lane-watcher test files each alone with `CLAUDE_CONFIG_DIR` unset and a scratch TMPDIR, then confirm no `lane-watcher-child.mjs` process is left; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/hard-kill-watcher-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: both R-2728 matches read the worker pid with and without the escaping, beta's sleep is long enough on Windows if W4 applies, the macOS suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; W3 done and how; W4 applied or not, and why; the full suite's summary line; map, readme, trace, tree and seat-check status; the Windows leg as unverified.
