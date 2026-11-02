# Build 1 technical record

## Scope and rows

R-3703, R-3704 and R-3705 are implemented in FEAT-002 with exact backticked test-title evidence. The requirement diff preceded the three tagged tests, which preceded the corrected implementation. No other tests were added or deleted.

Changed implementation files:
- `packages/nana-pack/tests/issue-watch.test.mjs`
- `packages/nana-pack/tests/issue-watch-timing.mjs`
- `REQUIREMENTS.md`
- `docs/code-map.md` through `npm run map`
- `docs/requirements-tree.md` through `node scripts/requirements-tree.mjs --write`
- This lane folder contains the plan, briefs, evidence drivers and captured results.

Product `lib/`, `bin/` and `extensions/` remain byte-identical. No network calls, real gh invocations, credentials, model sessions or subagents were used.

## Timing surface and arithmetic

Every export in `issue-watch-timing.mjs` has chosen provenance beside its definition; one R-3705 test seals the complete namespace and all ten values.

| Export | ms | Provenance |
| --- | ---: | --- |
| CASE_LIMIT_MS | 8000 | Preserve existing ordinary-case guard. |
| CLI_DEADLINE_MS | 20000 | Chosen above 4000 + 2 × 6390 = 16780; 6390 is the recorded cold Windows node-child observation in frontier-summary-config. This is headroom, not a reproduced CI diagnosis or a guarantee for arbitrary load. |
| CLI_CLEANUP_MS | 2000 | Chosen bounded tree-kill and close allowance. |
| CLI_CASE_MARGIN_MS | 3000 | Cleanup allowance plus 1000 scheduling slack. |
| CLI_START_DELAY_MS | 4000 | Old fixed 3000 window plus this synchronous delay exceeds the old 6000 deadline. |
| SIGNAL_POLL_MS | 25 | O1 default short portable polling; same chosen step as launch-wait. |
| WATCH_POLL_MS | 50 | Preserve existing accelerated fixture interval. |
| DEFAULT_RUNNER_MS | 3000 | Preserve R-2997 delivery limit. |
| ROLE_EXIT_MS | 2000 | Preserve R-2996 exit limit. |
| ABSENT_POINTER_EXIT_MS | 5000 | Preserve R-2994 exit limit. |

29 serial case guards: 26 × 8000 + 3 × (20000 + 3000) = 277000 ms, below the 300000 ms file guard by 23000 ms. Cleanup is already inside the CLI case margin. Zero-delay heartbeat scheduling remains a next-turn primitive, not a real-time deadline. All independent fake-clock scenario data remain unchanged.

## End signal, timeout ownership and cleanup

The test preload intercepts the product's run-end scheduling and returns a cancellable interval handle. It checks the existing fake-gh count file every SIGNAL_POLL_MS and invokes the real end handler only after three list calls. Calls are sequential: the third count proves the second response, including its owner answer, was consumed. There is no fixed 3000 ms run window.

`runCli` owns the child deadline. Expiry distinguishes no third poll, no owner answer line, no restart line, and no exit after restart. It starts the cleanup guard, calls imported `killProcessTreeNoWait` with a child-kill fallback, waits for close, and asserts imported `pidAlive` is false before rejecting. POSIX children get a detached process group; Windows uses the shared taskkill policy. The product aborts any in-flight fake gh at its normal stop. M2 inserts a referenced interval only after the real restart handler runs, then asserts its specific error, elapsed deadline-plus-cleanup bound, recorded pid and dead-child state.

## Existing checks edited

- R-2992 real CLI: extract its fixture into `runCli` for the original case and M1/M2; replace the fixed window with the third-call signal, require three calls instead of two, retain owner-answer and last-line restart assertions, and use the named child deadline plus case margin.
- `check`: optional per-case limit, defaulting to the migrated 8000 ms name; still awaits every asynchronous callback.
- R-2997 default runner: migrate 3000 ms to DEFAULT_RUNNER_MS without changing behaviour.
- R-2996 worker/reviewer exit: migrate 2000 ms to ROLE_EXIT_MS without changing behaviour.
- R-2994 absent pointer exit: migrate 5000 ms to ABSENT_POINTER_EXIT_MS without changing behaviour.
- Module purpose header: describe the bounded real CLI checks rather than claiming no time waits.

## Wrong-code pairs

See `wrong-code.txt`. All wrong-code variants ran as temporary test modules outside the repository; assertions were never inverted.

- M1 before implementation: main's harness with a synchronous 4000 ms preload delay, exit 1, `CLI limit`. Corrected harness: exit 0.
- M2 before implementation: main-style harness retaining a referenced handle, with only generic case-limit enforcement, exit 1, `case limit`. Corrected harness: exit 0; it catches `CLI deadline: no exit after restart` and verifies the pid is gone.
- M3 before implementation: missing timing surface, exit 1, deep-equality assertion. Corrected sealed module: exit 0.
- M2 post-implementation mutation: replace the named child deadline with generic case-owned expiry, keeping safe kill and close. Exit 1: expected `/no exit after restart/`, received `case limit`. Run twice; the second capture includes the assertion's input line.

The proof driver pins the baseline source to f6a475658217bed9cb58b9413dd21f35e8b11673. It never calls real gh. Evidence captures omit stack frames and redact runtime warning checkout paths.

## Green commands and measurement

- `node packages/nana-pack/tests/issue-watch.test.mjs`: exit 0, 29 PASS.
- `node packages/nana-pack/tests/frontier-summary.test.mjs`: exit 0, 8 PASS.
- `node packages/nana-pack/tests/test-runner.test.mjs`: exit 0, all checks passed.
- `node docs/reviews/issue-watch-cli-limit-2026-11-02/measure.mjs`: exit 0; ten standalone full-file runs, three concurrent pairs with the existing heavy test-runner file, then all three touched test files. Individual timings and results are in `timing.txt` and `build-1-green.txt`.
- Standalone spread: 27.186–27.383 s. Concurrent issue-watch times: 27.859, 28.187, 28.042 s; all three accompanying heavy-file runs exited 0.
- `npm run map`: exit 0; `node scripts/requirements-tree.mjs --write`: exit 0.
- `npm run map:check` and `npm run readme:check`: exit 0. The equivalent direct Node entrypoints and the remaining seat gates are captured individually in `gates.txt`: trace, tree, known bugs, staged identity scan and lane class all exit 0. Lane class prints `ordinary`. Known-bugs reports names=0 and one pre-existing size advisory outside this feature; no bug file changed.
- After the commit, the gate driver in `--verify` mode reruns all three touched files and all seat gates without writing the checkout. Its exit status is reported in the final response.

## Precedent and departures

- Followed issue-watch's temporary-project, fake-gh and preload seams; all fixtures remain in OS temp.
- Followed launch-wait's separate named timing surface and chosen-provenance comments. Its `awaitLaunchRecord` returns text asynchronously and has no cancellable timer handle, so it is not the clock adapter needed here; no helper was copied.
- Imported process-tree's existing public kill and pid helpers. No private helper needed exporting, copying or moving. Exports under standing authorization: none.
- Intentional departures from the original issue-watch harness: third-call completion instead of a fixed run window, named generous child deadline with cleanup ownership instead of immediate kill/reject, and three calls instead of two. All are required by Revision 2. No other departures.
- Read the complete FEAT-002 known-bug file. No listed bug was fixed. This lane exercises the already-known early-stop/no-restart behaviour only as background; its synthetic non-exit begins after restart, and it changes no early-stop product behaviour. No known-bug entry changed.

## Not done

No push, as the build brief explicitly requires commit-only. No CI run was started or read. AGENTS delegates the full suite to CI, so no local full suite ran; the seat still needs the tip's three CI legs before land. No independent reviewer or model session was started. No unresolved design questions.
