Feature: FEAT-006 · Launch builders with execution limits. Lane build-records, rows R-2596 to R-2603, plus the seal test. Class: ordinary. Builder: pi-worker (larger lane). Build session 1 of 1: the start and end records, the session usage sum, the build report and pi-worker's end line.

Work in the lane worktree on feat/build-records. The plan of record is `docs/reviews/build-records-2026-10-22/must-meet.md`: read D1 to D11, the rows, what each test does, the tunables, the known limits and the wrong-code pairs first; then `plan-attack.md` (M1 to M3, S2 to S8, S10, N5, N8 to N12) and `plan-draft.md` (its measurements and its contract notes on pi 1.0.2). Where the draft and the must-meet disagree, the must-meet wins: there is no running/killed split and no pid helper move (D3). Follow packages/nana-pack/README.md's module rules. Do not edit HANDOFF, the session archive or the known-bug files.

Precedent:
- packages/nana-pack/bin/pi-worker.mjs — the lane's facts (`dirs`, `cwd`, `branch`, the roster entry, the lock path, `git()`), `acquireLaneLock`, and the `finally` that writes the output and releases the lock.
- packages/nana-pack/bin/pi-watchdog.mjs — read only: the result shape and the per-attempt session name.
- packages/nana-pack/lib/suite-records.mjs — a clone-shared store under the git common folder whose failures are named and never change the exit code.
- packages/nana-pack/lib/suite-records-config.mjs — the config module form with provenance per value.
- packages/nana-pack/bin/review-ledger.mjs — the `report` subcommand's `--repo` handling, line shape and not-a-repository message.
- packages/nana-pack/bin/review-round.mjs — `repoKeyOf`, and the tally's field names.
- apps/bench/lib/usage.mjs — the Usage sum helpers to move into `packages/nana-pack/lib/pi-usage.mjs` and re-export.
- packages/nana-pack/lib/agent-dir.mjs — `piAgentDir()` and `piNormalizePath`.
- packages/nana-pack/lib/bounded-read.mjs — `readBounded` for the head, session and ledger reads.
- packages/nana-pack/lib/brief-precedent.mjs — `readBrief`'s Feature line and `checkBriefForLaunch`'s ok result.
- packages/nana-pack/tests/worker-lane.test.mjs — the lane harness.
- packages/nana-pack/tests/pi-install.mjs — `findPiRoot`.
- apps/desk/test/pi-087-entries.test.mjs — a session written through pi's own `SessionManager`.
- packages/nana-pack/tests/win32-launch.test.mjs — the short-path launch and its skip rule.
- packages/nana-pack/tests/watchdog-exit.test.mjs — the ceiling and signal lane runs.
- packages/nana-pack/tests/suite-records.test.mjs — R-2553's unwritable-record case.
- packages/nana-pack/tests/review-ledger.test.mjs — R-732's three checks.

1. Move the four Usage helpers (and the private helpers they need) from `apps/bench/lib/usage.mjs` to `packages/nana-pack/lib/pi-usage.mjs`; usage.mjs imports and re-exports them, so R-503's tests and the bench's importers stay unchanged.
2. `packages/nana-pack/lib/build-records-config.mjs`: every tunable and contract name the must-meet lists, each with its provenance. `packages/nana-pack/lib/build-records.mjs`: the session folder rule (D4), the head-read matcher, the usage sum (D5), the record appends that never throw (D7), the ledger reader that skips and counts bad lines, and the one lane-line renderer both readers use (D8). It imports nothing from review-round.
3. `pi-worker.mjs` lane mode: the start record right after the lock and before pi (R-2596); the end record in the `finally`, before the lock release, on every handled exit (R-2597, R-2598, D7); the end line after the SUCCESS, FAILED or aborted line (R-2602). `checkBriefForLaunch` adds `feature` to its ok result. Keep R-2603's words out of new pi-worker text (D9).
4. `packages/nana-pack/bin/build-report.mjs` (R-2600, R-2601, D8), with the six-tag header.
5. Tests with the must-meet's exact titles and `// req:` markers in the two new test files, with every case "What each test does" lists, the stub writing its session through pi's `SessionManager`. Move the three R-732 markers to R-2603. Rows R-2596 to R-2603 in FEAT-006 with the must-meet's texts, `implemented` with evidence; retire R-732 with its reason; swap R-732 for R-2603 on FEAT-007's Also applies line; FEAT-006's Purpose; CAP-02's deliverable lines. The docs the must-meet lists.
6. Run the two new test files, worker-lane, win32-launch, watchdog-exit, brief-check, review-ledger, the bench's usage tests and the requirements-tree and deliverables tests, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs` and `node scripts/deliverables.mjs`, then `npm run test:locked` before your last commit. Try these wrong versions, see each go red, then restore: pairs 1, 5, 9, 12, 15 and 19 of the must-meet's list.

Seat check: `node docs/reviews/build-records-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- A lane build appends a start and an end record under the clone's git folder; the end record carries pi's summed usage or a named reason; an unwritable ledger changes nothing about the build; the report and the end line print the same lane line.
- The bench's tests stay green with the moved helpers.
- map:check, req:tree, readme:check, the trace, the deliverables check and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 14 lines after the VERDICT line): the commit shas; the check results; the deliverables count line; each departure from the Precedent files with its reason; each existing test you edited and why; the wrong versions tried and their results; the full suite's summary line; map, readme, trace and seat-check status.
