Feature: FEAT-006 · Launch builders with execution limits. Lane win-temp-check. Class: ordinary. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/win-temp-check. The spec is `docs/reviews/win-temp-check-2026-10-24/must-meet.md`; read it whole. `plan-draft.md` and `plan-attack.md` beside it are its inputs; where they differ, the must-meet holds. This lane changes tests only: do not edit any file under `packages/*/bin/`, `packages/*/lib/` or `scripts/`. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in a review folder.

Precedent:
- packages/nana-pack/tests/build-report.test.mjs — R-2725's pi-worker started with `--poll 60` and then killed.
- packages/nana-pack/tests/process-tree-helper.mjs — the exported kill helpers and module header the new function joins.
- packages/nana-pack/tests/worker-claude.test.mjs — `tempEmpty`, `workerArgs`, `hardCase`, the R-2722 loop and the R-2728 block (`argsFor`), and the `check(..., skipped)` style.
- packages/nana-pack/bin/pi-watchdog.mjs — the first sample after `min(poll, time left to the ceiling)`; read only.

No private helper moves to a shared module beyond `tempEmpty`'s replacement, which becomes one exported function in process-tree-helper.mjs.

The task:
1. Row R-2803 under FEAT-006, worded as in the must-meet, `implemented` once its test passes.
2. The exported temp check in process-tree-helper.mjs, its R-2803 test in worker-claude.test.mjs over real planted folders, running on every platform, and the helper's line in that module's header.
3. Replace `tempEmpty` at its three hard-kill uses with the new check. Each observation records the sorted names it found; each pass still needs none left.
4. Start the killed pi-worker with `--poll 60` at the sites the must-meet names: `hardCase`, both owners of the R-2722 loop, and R-2728's alpha only. R-2728's beta keeps `--poll 0.2`.
5. Leave the texts of R-2720, R-2721, R-2722 and R-2728 and their test titles unchanged.

Try each R-2803 red case by hand, see the check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: worker-claude.test.mjs alone; build-report.test.mjs alone; `npm run map:check` (run `npm run map` first if the header change needs it); `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/win-temp-check-2026-10-24/seat-titles.mjs all` must print `0 missing`.

Done: R-2803 and its test exist and pass, the three hard-kill checks judge through the new helper and name what they find, the killed workers start at `--poll 60`, no product file changed, the full suite is green, the seat check prints `0 missing`, and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the row; each red case's hand check; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the must-meet, with its reason.
