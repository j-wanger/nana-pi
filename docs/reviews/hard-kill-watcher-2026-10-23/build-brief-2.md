Feature: FEAT-006 · Launch builders with execution limits. Lane hard-kill-watcher. Class: gate. Builder: pi-worker (small lane). Build session 2: two findings on build 1 (0233a934).

Work in the lane worktree on feat/hard-kill-watcher. The spec is still `docs/reviews/hard-kill-watcher-2026-10-23/must-meet.md`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder; the seat's wrong-code table lives in this review folder and is not yours to change.

Precedent:
- packages/nana-pack/tests/lane-watcher.test.mjs — the R-2727 check and its injected `cleanLane` core, which F2 widens.
- packages/nana-pack/lib/lane-watcher.mjs — `cleanLane` and its `builder.launch !== "cmd"` rule, unchanged.
- packages/nana-pack/tests/tmp-dir.mjs — the shape of a shared test module, for comparison with what F1 removes.

Findings:
- F1. Build 1 committed its own wrong-code table and its output under `packages/nana-pack/tests/` (`seat-mutate-hard-kill-watcher.mjs` and `seat-mutate-hard-kill-watcher-output.txt`). The seat's pairs belong to the seat, in the review folder, and a table with a pinned tip rots in a package folder. Remove both files, and regenerate `docs/code-map.md` (`npm run map`) so no map entry or caller list names them.
- F2. R-2727's row has two halves: a recorded builder still running after the stop wait, and a Windows builder launched through cmd.exe. The check pins only the first. Its stop-wait stand-in reports the builder as still running in both cases, so removing `builder.launch !== "cmd" &&` from `cleanLane` keeps the check green (measured by the seat). Add, inside the same R-2727 check and with its title unchanged: a win32 case whose builder is gone after the stop wait (`alive` false, `waitForExit` true) with `launch: "cmd"`, which must keep the lock naming the worker and remove the temp files; and a control, win32 with a direct launch and the builder gone, which must release the lock. Confirm by hand that removing the `cmd` clause now turns R-2727 red, and say so in the report (do not commit that change).

Checks before your one commit: lane-watcher, worker-claude and build-report test files each alone with `CLAUDE_CONFIG_DIR` unset and a scratch TMPDIR, then confirm no `lane-watcher-child.mjs` process is left; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/hard-kill-watcher-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: both stray files are gone from the package and the map, R-2727 fails without the `cmd` clause and passes with it, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; F1 and F2 done; the hand check; the full suite's summary line; map, readme, trace, tree and seat-check status.
