Feature: FEAT-006 · Launch builders with execution limits. Lane hard-kill-watcher. Class: gate (pi-watchdog's runOnce runs inside every pi-review). Builder: pi-worker (larger lane). Build session 1: the whole lane.

Work in the lane worktree on feat/hard-kill-watcher. The spec is `docs/reviews/hard-kill-watcher-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ; read the draft for the measurements, the design parts 1 to 4, the test designs, the tunables and the pairs, and the three attack files (`plan-attack-safety.md`, `plan-attack-platforms.md`, `plan-attack-rows.md`) for the findings the must-meet adopts. The planner's prototype under the scratch folder is evidence, not the design: it releases the lock unconditionally and signals a recorded pid without an identity check, both of which this lane forbids. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

What the lane does, in one sentence: right after pi-worker makes its lane temp folder it starts a detached watcher through a one-shot hop, and when pi-worker dies hard the watcher ends the recorded builder's process group off Windows (only if that pid still belongs to a process started no later than the record), removes the lane's temp files, writes the missing `stopped` end record, and releases the lane lock only when it still names pi-worker and no recorded builder may still run.

Precedent:
- packages/nana-setup/lib/bounded-spawn-child.mjs — a detached relay that outlives its caller and polls it, ends a process tree through the shared helper, and spawns with an explicit cwd: the shape of `lane-watcher-child.mjs` (the entry script).
- packages/nana-setup/lib/bounded-spawn.mjs — the launcher half and its poll interval with provenance: the shape of `lane-watcher.mjs`'s start function.
- packages/nana-pack/lib/process-tree.mjs — `killProcessTree` with injected `kill`, `run` and `platform`: the shared kill the watcher imports, and the injection shape for the watcher's exported core (R-2727). `pidAlive` moves here from mutation-runner.
- packages/nana-pack/lib/mutation-runner.mjs — `pidIsAlive`, which moves to process-tree.mjs as exported `pidAlive`; mutation-runner then imports it.
- packages/nana-pack/lib/tree-kill-scan.mjs — the scan the new modules must pass: wait on a leader with `kill(pid, 0)`, never `kill(-pid, 0)`.
- packages/nana-pack/bin/pi-worker.mjs — the temp folder, the inner `finally`, `keepBuildStart` and `keepBuildEnd` (the end-record assembly moves to build-records.mjs), `acquireLaneLock` (the lock name stays inline) and `releaseLaneLock` (moves to `lib/lane-lock.mjs`).
- packages/nana-pack/bin/pi-watchdog.mjs — runOnce's capture folder, the detached spawn and `onChild`, where the two optional options go (`captureRoot`, `onSpawn`); pi-review passes neither.
- packages/nana-pack/bin/worker-config.mjs — the configuration surface for the new tunables, with provenance; its header names them.
- packages/nana-pack/lib/build-records.mjs — `appendBuildRecord`, `readBuildLedger`, `collectBuildUsage`; the end-record helper lands here.
- packages/nana-pack/lib/test-runner-config.mjs — `TEMP_REMOVE_RETRIES` and its delay, the policy the watcher's own retry values name as their reason.
- scripts/runtime-measure.mjs — `killTree`, the parent-pid tree kill R-2720's case d uses.
- packages/nana-pack/tests/worker-claude.test.mjs — the fixture, `baseEnv`, `startWorker`, `caseTemp`, `tempEnv`, `waitFor` (which stops on child exit: do not reuse it after a kill), `stopFixtureBuilder`, and the POSIX-only signal cases with their skip lines.
- packages/nana-pack/tests/build-report.test.mjs — the hard-kill case that becomes R-2725's check, and `killWorkerTree`, which moves to a shared test module beside `tests/tmp-dir.mjs`.
- packages/nana-pack/tests/tmp-dir.mjs — the shared test-module shape for the moved `killWorkerTree`.

Named moves and departures the brief accepts: `pidIsAlive` → process-tree.mjs `pidAlive`; `releaseLaneLock(lock, ownerPid)` → `lib/lane-lock.mjs`; `keepBuildEnd`'s record assembly → build-records.mjs; `killWorkerTree` → a shared test module. The watcher polls pi-worker's pid, not its parent; the hop has no precedent (without it a parent-pid tree kill takes the watcher, measured); the watcher polls on win32 too; it writes nothing to stdio; it ends no process on win32.

Traps:
- Every wait after a kill yields (`await`); a synchronous wait keeps the killed pi-worker a zombie and the watcher reads it as alive.
- Before every kill, wait for exactly one `--watch` and no `--hop` process for the case root.
- `FAKE_BODY` holds escaped `\\n` in a template literal; keep every escape you do not mean to change.
- R-2603 fails if pi-worker's source holds `admit` or `complete` outside a column-zero comment.
- The new modules must pass the tree-kill scan and the map's layer rules (a package may not import from `scripts/` or `apps/`).
- A needed change to review-launch, review-round, pi-review, claude-review, any hook, any extension or nana-setup stops the build: report it instead.

Steps, in order:
1. Rows first: add R-2720 to R-2728 to `REQUIREMENTS.md` in FEAT-006 directly after R-2694, `untested` until each check passes, then `implemented` with backticked `file::title` evidence. Edit R-2667's text to name R-2725.
2. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives, with the must-meet's test changes. Every new check except R-2724 must be red on main's code; check that by hand once per row and say so in the report (do not commit those checks).
3. Code: the watcher (`lib/lane-watcher.mjs` with the start function and the exported core, `lib/lane-watcher-child.mjs` the entry script), `lib/lane-lock.mjs`, the moves above, pi-watchdog's two options, pi-worker's start of the watcher (the build id made before it), the tunables.
4. Docs: `packages/nana-pack/README.md` as the draft's and must-meet's Docs lists say; module headers. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: worker-claude, lane-watcher, build-report, build-records, worker-lane, review-ledger, watchdog-exit, watchdog-cpu, win32-launch, process-tree and mutation-runner test files each alone, with `CLAUDE_CONFIG_DIR` unset and a scratch TMPDIR, then confirm no `lane-watcher-child.mjs` process is left; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`. You cannot run Windows or Linux here; reason about their paths from the code and say what you could not run.

Seat check: `node docs/reviews/hard-kill-watcher-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes and every one but R-2724 was red on main, the seat check prints `0 missing`, the full suite is green, no watcher process is left after the suite, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; the hand check against main; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; what you could not run.
