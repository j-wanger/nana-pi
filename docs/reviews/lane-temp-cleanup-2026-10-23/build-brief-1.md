Feature: FEAT-006 · Launch builders with execution limits. Lane lane-temp-cleanup. Class: gate (on the owner's word). Builder: pi-worker (larger lane). Build session 1: the whole lane.

Work in the lane worktree on feat/lane-temp-cleanup. The spec is `docs/reviews/lane-temp-cleanup-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ; read the draft for the measured exits, the design parts 1 to 3, the test designs and the pairs, and `plan-attack.md` for the findings the must-meet adopts. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

What the lane does, in one sentence: pi-worker refuses a review option before it reads the brief or the user Claude settings or writes any temp file, holds SIGINT, SIGTERM and SIGHUP from the moment it makes its temp folder until its watchdog takes them, ignores a closed standard-error pipe in lane mode, and its Claude builder tests no longer read a caller's exported `CLAUDE_CONFIG_DIR`, so no refusal, early signal or closed pipe leaves the carried Claude settings file in the OS temp folder.

Precedent:
- packages/nana-pack/bin/pi-worker.mjs — the review-option check that moves, the `own` slice it will read, the first lane refusal it moves above, the temp folder and its files, the cleanups already there (`laneFailure`, the watchdog-option exit, the `finally` after `runWatchdog`), the last await and the synchronous tail.
- packages/nana-pack/bin/pi-review.mjs — setup-phase listeners for SIGINT, SIGTERM and SIGHUP registered before its checkout work, and its refusal of bad arguments before any effect. Named departures: pi-worker keeps its listeners for the life of the process and they do nothing, because its watchdog handles the queued signal (pair V1 shows removing them before the watchdog drops the signal).
- packages/nana-pack/bin/pi-watchdog.mjs — read only: the handler map and stop path the queued signal reaches, and the spawn before the first await. Do not change it.
- packages/nana-pack/tests/review-ledger.test.mjs — R-733's refusal check, kept unchanged, and R-919's capture-folder check (one temp folder for TMPDIR, TEMP and TMP, asserted empty), the precedent for the new empty-temp checks.
- packages/nana-pack/tests/worker-claude.test.mjs — the fixture, `baseEnv`, `workerArgs` and its skip-a-default pattern, `runWorker`, and the POSIX-only SIGTERM subcase with its skip by name.
- packages/nana-pack/tests/build-records.test.mjs — `baseEnv` deleting names from a spread env.
- packages/nana-setup/tests/project-stale.test.mjs — `delete env[key]` for `CLAUDE_CONFIG_DIR` in a spawned env.
- packages/nana-knowledge/tests/hook.test.mjs — a test setting `process.env` before it spawns, the decoy's pattern.
- scripts/test.mjs — the runner's `CLAUDE_CONFIG_DIR` scrub and per-file `TMPDIR`, `TEMP` and `TMP`, the env shape the new cases use.
- docs/reviews/claude-code-builder-parity-2026-10-22/must-meet.md — the rows this lane sits beside (R-2655, R-2664, R-2665).

Traps:
- R-2603's check fails if `pi-worker.mjs` holds the words `admit` or `complete` anywhere but a comment starting at column 0. Indented comments count.
- worker-claude's `FAKE_BODY` holds escaped `\\n` in a template literal; keep every escape you do not mean to change.
- A needed change to pi-watchdog, worker-config, review-launch or build-records code stops the build: report it instead.

Steps, in order:
1. Rows first: add R-2691 to R-2693 to `REQUIREMENTS.md` in FEAT-006 directly after R-2665, `untested` until each check passes, then `implemented` with backticked `file::title` evidence.
2. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives, with the must-meet's additions (R-2691's missing-brief run, R-2692's closed-stderr case and the bad stall option witnessed by its error line, R-2693's pi-roster run). Part 3's fixture edits: `baseEnv` clears `CLAUDE_CONFIG_DIR` before the case's extras, a decoy `CLAUDE_CONFIG_DIR` is set near the top of `worker-claude.test.mjs`, and `build-records.test.mjs`'s `baseEnv` clears it too. Every new check except R-2692 must be red on main's code (R-2692 is red on main only in its closed-stderr case); check that by hand once per row and say so in the report (do not commit those checks).
3. Code, in `pi-worker.mjs` only: the review-option check moved first; the start-up listeners before the temp folder; the stderr error listener in lane mode.
4. Docs: `packages/nana-pack/README.md` as the draft's Docs list says, with the hard-kill sentence naming a pi seat's ordinary stop (Esc, a closed terminal, a desk stop) as the common hard kill, which leaves the settings file and lock and a running builder; `pi-worker.mjs`'s header. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: `worker-claude`, `review-ledger`, `worker-lane`, `build-records`, `build-report`, `brief-check` and `win32-launch` test files each alone, once with a decoy `CLAUDE_CONFIG_DIR` exported; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows here; reason about the win32 paths from the code and say what you could not run.

Seat check: `node docs/reviews/lane-temp-cleanup-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes and was red on main as step 2 says, the seat check prints `0 missing`, the full suite is green, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; the hand check against main; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
