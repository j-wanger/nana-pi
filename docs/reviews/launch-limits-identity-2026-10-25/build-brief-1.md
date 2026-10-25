Feature: FEAT-013 · Install and connect harness runtimes. Lane launch-limits-identity. Class: ordinary. Builder: pi-worker (small lane). Build session 1.

Work in the lane worktree on feat/launch-limits-identity. The spec is `docs/reviews/launch-limits-identity-2026-10-25/must-meet.md`; read it whole. `plan-draft.md` and `plan-attack.md` beside it are its inputs; where they differ, the must-meet holds. The seat chose the bare-pid design: no beat files, no stop request, no quiet window.

Do not edit: HANDOFF, the session archive, `docs/known-bugs/`, any file under `templates/`, any product file (`packages/nana-setup/lib/`, `packages/nana-pack/lib/`, `packages/nana-pack/tests/process-tree-helper.mjs`), any other test file, or any file in a review folder. Change only `packages/nana-setup/tests/pi-launch-limits.test.mjs`, `REQUIREMENTS.md` and the regenerated `docs/requirements-tree.md` and `docs/code-map.md`.

Precedent:
- packages/nana-setup/tests/pi-launch-limits.test.mjs — `processAlive`, `waitDeadSync` and `sleepSync` (the probe and the synchronous wait the judge replaces), `readPidRecords`, the hang body in `makeFixture`, `observeParentKill`, `timedStep`, `timedDoctor`, R-2023, R-2303's wrapper cleanup, and R-2484's seal check as the seal pattern.
- packages/nana-pack/lib/process-tree.mjs — `pidAlive`'s injected `kill`, read only; the new probe reverses its polarity so only ESRCH reads gone.
- packages/nana-pack/lib/lane-watcher.mjs — `defaultProcessStartedAt` and `identitySafe`: an unknown answer blocks the verdict; copy the polarity, not the code.
- packages/nana-pack/tests/test-runner-parallel.test.mjs — `START_SKEW_MS` and `RENDEZVOUS_LIMIT_MS`, a start wait named apart from a measured bound; the `"ipc"` child at its R-1475 block for the bystander.
- packages/nana-pack/tests/post-edit-hardening.test.mjs — R-644, a test that reads source text for a forbidden shape.
- scripts/test.mjs — the self-test fixture that exits itself after the runner limit.

No private helper moves to a shared module. Do not import anything from `process-tree-helper.mjs`.

The task:
1. Rows R-2890 to R-2895 under FEAT-013, worded as in the must-meet, `implemented` once their tests pass. Existing rows keep their text and titles.
2. Named values beside the file's other constants, with the provenance lines the must-meet's Seal lines give: `START_ALLOWANCE_MS = 6_000` and `SELF_EXIT_MARGIN_MS = 1_000` (sealed by R-2894's test), and the derived `LATE_CHILD_MS = (PID_POLL_MS + START_ALLOWANCE_MS) / 2`. No inline literal for any of them elsewhere; every assertion imports the name.
3. The hang body writes `at: Date.now()` in its pid record line, before it arms its self-exit timer, and delays pi's child by `CHILD_DELAY_MS` when that variable is set and positive (no delay otherwise).
4. One probe function, `kill(pid, 0)` through an injected `kill` defaulting to `process.kill`: success reads alive, ESRCH reads gone, any other code is returned as that code. `processAlive` becomes "the probe is not gone".
5. The judge, as the must-meet's Seat decisions say: synchronous (`sleepSync`), takes the run's records and `{ kill }`, validates every record (positive integer `pid` and `ppid`, numeric `at`), computes the deadline from the earliest `at`, reports "judged too late" when its first probe comes at or after it, counts a gone read only from a probe that started before it, keeps a pid ended once it read gone, stops waiting at `PID_POLL_MS` or the deadline, sends no signal, and returns started, ended, the reason and each pid's record args, `at` offset and first and last probe results. It replaces `waitDeadSync`.
6. R-2023: its four runs use `START_ALLOWANCE_MS` as their limit; each run is judged right after it returns; it passes only when every run started and ended and every row detail names "stopped" and `START_ALLOWANCE_MS / 1_000` seconds. When any run reads not ended, it waits synchronously until the latest such record's `at + HANG_MS + SELF_EXIT_MARGIN_MS`, probes each pid still alive once more, and adds "after self-exit: gone" or "alive" to the detail; that never changes the verdict. `timedStep` and `timedDoctor` take the limits as a parameter; R-2020 to R-2022 keep `LIMIT_MS`.
7. Delete every failure-path kill: the loops at the old lines 187, 204, 280, 423-425, 445 and 483. R-2303's wrapper cleanup becomes `child.kill("SIGKILL")` with no `processAlive` guard.
8. One start-wait helper over `waitFor` with `START_ALLOWANCE_MS`, used by `observeParentKill` and R-2303. `observeParentKill` takes `childDelay` and passes it as `CHILD_DELAY_MS`. R-2026, R-2027 and R-2133 keep the default wait.
9. The six new checks with the must-meet's exact titles and their `// req:` markers directly above. R-2890's bystander answers IPC pings and ends itself after `HANG_MS`; the check waits up to `PID_POLL_MS` for its answer, then ends it through its handle. R-2893's patterns are built so that the scan's own source does not match them (for example, assemble `task` + `kill`). R-2895 skips on win32.
10. The header's `@outputs` names twenty-four checks; run `npm run map` and `node scripts/requirements-tree.mjs --write` to regenerate the code map and the tree.

Build large fixtures in linear time: no string built by repeated concatenation in a loop and no quadratic search. Keep every escape sequence in test literals intact (`\\n`, `\\\\n` and `\r\n` inside the fixture bodies stay exactly as written); after your edit, `git diff` must show no removed backslash in a line you did not mean to change.

Try each must-meet row's red cases by hand, see the named check turn red, restore, and say so in your report; do not commit them.

Do not run the install check (`packages/nana-setup/bin/install-check.mjs`); the seat runs it.

Checks before your one commit: `node packages/nana-setup/tests/pi-launch-limits.test.mjs` alone, twice, all PASS or SKIP; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/launch-limits-identity-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: the six rows, their tests and the seal exist and pass; R-2023 judges each run at once on the 6 s allowance and names what it saw; no failure-path kill is left; the map, readme, trace and tree checks are green; the full suite is green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; R-2023's passing detail for one run; the time R-2023 took; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the must-meet or the precedent, with its reason.
