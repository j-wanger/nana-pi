Feature: FEAT-006 · Launch builders with execution limits. Lane lane-temp-cleanup. Class: gate (on the owner's word). Builder: pi-worker (larger lane). Build session 3: one review finding.

Work in the lane worktree on feat/lane-temp-cleanup. Builds 1 and 2 are accepted. The spec is `docs/reviews/lane-temp-cleanup-2026-10-23/must-meet.md`; read its last section, "Round 1 finding, adopted", whole. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

The finding (land reviewer, round 1, MUST): in lane mode `pi-worker.mjs` registers its no-op SIGINT, SIGTERM and SIGHUP listeners before three reads that can block without end: `trusted(cwd)` (a `spawnSync` of node reading the trust record, no timeout), the read of the user Claude settings file inside `writeClaudeBuilderSettings`, and `git rev-parse HEAD` inside `keepBuildStart`. While one of them hangs, a SIGTERM sent to pi-worker's own process is queued and never acted on; on main that SIGTERM ended pi-worker.

What to change, in `pi-worker.mjs` only:
1. Run `trusted(cwd)` before the listeners and the temp folder; keep its trust line and its place in stderr order relative to the carry line as close as the move allows, and say in the report if the order of stderr lines changes.
2. Split the user Claude settings read from the write: read and parse the source file (and work out the carried keys, env names and reason) before the listeners; after the temp folder exists, write the settings file and print the carry line exactly as today. The carry line's text and every R-2647/R-2655/R-2664/R-2665 assertion stay unchanged.
3. Read the worktree's HEAD for the build-start record before the listeners, and have `keepBuildStart` use that value; its record is unchanged.
Nothing else moves. R-2691's refusal stays first, so a review option still exits before any of these reads.

The test, one new check in `worker-claude.test.mjs` after R-2693's, with its `// req: R-2694` marker directly above and this exact title: `R-2694: off Windows, SIGTERM sent to pi-worker while its trust check, Claude settings read or HEAD read hangs ends it before any temp file or lane lock exists`. Skip it on win32 by name, as R-2693 does. Three cases, each a Claude-roster lane build with a fresh temp folder (TMPDIR, TEMP and TMP), as R-2692's cases set it:
- the trust record pi-worker's trust check reads (find its path from `trustRecord` in `packages/nana-pack/lib/objective.ts` and the agent dir the fixture sets) replaced by a FIFO made with `mkfifo`, so the read blocks;
- `CLAUDE_CONFIG_DIR/settings.json` replaced by a FIFO;
- a `git` shim first on PATH that sleeps on `rev-parse HEAD` and passes every other call to the real git.
For each: start pi-worker, wait until its stderr shows the precedent line (printed before the moved reads) and then a short settle, send SIGTERM to its pid, and assert it ends within a bounded wait, by SIGTERM, with the case's temp folder empty, no lane lock and no fake claude call. Afterwards unblock and remove each FIFO and kill anything left (SIGKILL fallback), so no case leaks a process. Test-local waits get a "chosen" provenance comment, as the file's other constants do. The check must be red at the current tip (it hangs until the bounded wait) and red on main (main leaves the temp folder); check both by hand once and say so in the report (do not commit those checks).

Rows: add R-2694 to `REQUIREMENTS.md` in FEAT-006 directly after R-2693, `untested` until its check passes, then `implemented` with backticked `file::title` evidence. Regenerate `docs/requirements-tree.md` (`npm run req:tree`) and, if `map:check` asks, `docs/code-map.md`. Update `packages/nana-pack/README.md`'s start-up sentence if it describes the order.

Precedent:
- packages/nana-pack/bin/pi-worker.mjs — `trusted`, `writeClaudeBuilderSettings`, `keepBuildStart`, the listeners and the temp folder: the code that moves.
- packages/nana-pack/tests/worker-claude.test.mjs — R-2692's per-case temp folder and R-2693's POSIX-only signal cases with their skip by name and SIGKILL fallback: the shape of the new check.
- packages/nana-pack/lib/objective.ts — `trustRecord`, read only: where the trust record lives.
- packages/nana-setup/tests/hook-deadlines.test.mjs — stub producers that hang, read only: a precedent for a stalled helper in a test.

Traps: R-2603's check fails if `pi-worker.mjs` holds the words `admit` or `complete` anywhere but a column-zero comment. Keep every escape in test template literals you do not mean to change. A needed change to pi-watchdog, worker-config, review-launch, build-records or objective code stops the build: report it instead.

Checks before your one commit: `worker-claude`, `review-ledger`, `worker-lane`, `build-records`, `build-report` and `brief-check` test files each alone, once with a decoy `CLAUDE_CONFIG_DIR` exported; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. Seat check: `node docs/reviews/lane-temp-cleanup-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: R-2694 passes and was red at the current tip and on main, R-2691 to R-2693 and every existing check still pass, the full suite is green, and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; R-2694's result and its elapsed time; the two hand checks; any change in stderr line order; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
