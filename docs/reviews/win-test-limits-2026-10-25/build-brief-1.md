Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane win-test-limits. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Work in the lane worktree on feat/win-test-limits. The spec is `docs/reviews/win-test-limits-2026-10-25/must-meet.md`; read it whole before designing. `plan-draft.md` and `plan-attack.md` beside it are its inputs; where they differ, the must-meet holds. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, any file under `templates/` or `packages/nana-setup/`, `packages/nana-pack/tests/adoption-reader.test.mjs`, `packages/nana-pack/tests/requirements-deliverables.test.mjs`, `packages/nana-pack/tests/process-tree-helper.mjs`, any product file other than the run-alone list and its comment in `packages/nana-pack/lib/test-runner-config.mjs`, or any file in a review folder.

What the lane does, in one sentence: each Windows check that missed a child limit or wait on a cold start gets a named limit and a forced late start that fails main's code every run, the slow-sampler shim moves to one shared test helper, GP4 stops judging a reused pid, and two load-sensitive files run alone.

Precedent:
- REQUIREMENTS.md:2608 — R-2667 and R-2670 in FEAT-031 for other features' tests (win-flake-hardening): where this lane's rows go.
- docs/reviews/win-flake-hardening-2026-10-23/must-meet.md — one row per flake, a forced slow schedule that fails main's code every run, tunables with provenance.
- scripts/test.mjs:237 — the self-test's 3 s limit and its fixture that ends itself after 15 s (`:249`): R-2880's ratio.
- packages/nana-pack/tests/test-runner-parallel.test.mjs:121-138 — `meetingFixture`: a delay inside the fixture body, recorded as `delayedMs` under `PROBE_OUT`; the detail argument at `:40`; R-1474 at `:491-496`.
- packages/nana-pack/tests/test-runner.test.mjs:522-533 — the record fixture and `runRecorded`; R-2753 at `:611`; R-917's mkdtemp scan at `:620-629`.
- packages/nana-setup/tests/hook-deadlines.test.mjs:55 — the `Atomics.wait` late start (read only).
- packages/nana-pack/tests/brief-check.test.mjs:50-53 — the constants, shim (`:63-67`), resolution (`:69-71`), sampler-free launch (`:77`), comparison (`:119-123`) and R-2670's seal (`:138`); the shim, resolution, comparison and the three sampler constants move out.
- packages/nana-pack/tests/fake-pi.mjs:1-9 — a shared test helper module's header and form, for the new `slow-sampler.mjs`.
- packages/nana-pack/tests/worker-lane.test.mjs:72-75 — `run`; the default stub at `:64`; R-2619 at `:266`; `launchTogether` at `:577` stays at `--poll 0.1`; the ceiling case at `:624`.
- packages/nana-pack/bin/pi-watchdog.mjs:221 — the first timer is `min(poll, time left)` and the ceiling check (`:235`) runs before a sample (read only).
- packages/nana-pack/tests/mutation-runner.test.mjs:151-154 — the probe's rendezvous branch and its wait (`:133`); R-1775's matching waits at `:422` and `:451`; the child guards at `:692` and `:740`; the contend case at `:1323-1337`.
- packages/nana-pack/tests/post-edit-hardening.test.mjs:279-342 — the R-1701 case and its SKIP line; TREE_DEADLINE_MS at `:98`; `writeTreeFixture` at `:129`; R-1700's seal at `:273`.
- packages/nana-pack/tests/windows-skip-lines.test.mjs:117-120 — R-1954: every check title in a win32 block needs its exact-title SKIP line in the block's `} else {`, and a `${` truncates the scanned title.
- packages/nana-pack/lib/test-runner-config.mjs:48-65 — RUN_ALONE and its provenance comment.
- packages/nana-setup/lib/hook-producer.mjs:23 — HOOK_PRODUCER_TIMEOUT_MS and HOOK_DEADLINE_MS (`:28`), imported by name, never copied (read only).
- packages/nana-pack/tests/mutation-runner-takeover.test.mjs:24 — DEAD_PID, the impossible owner pid.
- packages/nana-pack/tests/path-spelling.test.mjs:405-408 — GP4's dead pid and folder name; pi-review's reclaim pattern at `packages/nana-pack/bin/pi-review.mjs:88-91` (read only).
- packages/nana-knowledge/tests/sources-file.test.mjs:36-42 — `run` and its 10 s limit.
- packages/nana-pack/tests/writing-injection.test.mjs:121 — the inline 5 s guard.

Helper move, named: `brief-check.test.mjs`'s slow-sampler shim writer, its PATH resolution (the caller passes its spawn limit), its first-on-PATH comparison and SLOW_SAMPLER_MS, WORKER_POLL_SECS and FAKE_PI_HOLD_MS with their provenance move to a new `packages/nana-pack/tests/slow-sampler.mjs`; brief-check and worker-lane import them. Each test file keeps its own CHILD_LIMIT_MS. No other private helper moves; report any other import or copy as a departure.

The task:
1. Rows R-2880 to R-2885 under FEAT-031 after R-2670, worded as in the must-meet, `untested` until each check passes, then `implemented` with backticked `file::title` evidence. Existing rows keep their text and titles.
2. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives, plus the four seal tests. Each forced late start, late mark, late release and hold records its measured delay, and its row asserts that delay. Floors on measured milliseconds are reached by a sleep loop or `Atomics.wait`, never a single short timer.
3. The new `slow-sampler.mjs` with the six-tag header. It writes the shim into a folder its caller passes and calls neither `mkdtempSync` nor `tmpDir`. brief-check imports it; R-2670 keeps its text, title and seal.
4. worker-lane: `run` launches at WORKER_POLL_SECS with worker-lane's own CHILD_LIMIT_MS; R-2883 uses its own shim folder, put first on PATH only for its one launch through `run`'s `more` argument, never the stub folder; R-2619's detail names each launch's entry, status, elapsed ms and stderr tail; `@effects` names the slow CPU-sampler shim.
5. test-runner: RECORD_LIMIT_MS, LATE_PASS_MS and TIMEOUT_FIXTURE_MS as the must-meet says; a-pass records its own measured sleep under a per-run folder; R-2753 imports RECORD_LIMIT_MS instead of `Number("800")`; R-2880's detail names each file's label, cause, seconds and a-pass's recorded sleep, both runs.
6. mutation-runner: CHILD_LIMIT_MS for both child guards; the R-1960 child's late start; the probe's `NANA_TEST_START_DELAY_MS` (default 0) with its measured delay written into the mark; CONTEND_WAIT_MS passed to run1 as `NANA_TEST_WAIT_MS`; the measured late release.
7. post-edit-hardening: `writeTreeFixture`'s `lateStartMs`; WIN_TREE_DEADLINE_MS and TREE_LATE_START_MS in the taskkill-off-PATH case; R-2884's check beside R-1701's with a plain-literal title and its own SKIP line; the details the must-meet lists; the cleanup reaps the shell pid only when the check did not see it end.
8. RUN_ALONE gains hook-deadlines and adoption-reader, each reason naming its hook-producer constant, with the provenance comment extended.
9. sources-file: a named 30 s CHILD_LIMIT_MS (provenance marks the cause inferred); `run` returns each child's elapsed ms; each of its checks prints each child's elapsed ms, status and signal. writing-injection: a named CASE_CHILD_LIMIT_MS. path-spelling: GP4 uses IMPOSSIBLE_PID, asserts first that probing it throws ESRCH, and names each iteration's folder with its index.
10. `npm run map` and `npm run req:tree` regenerated; module headers current.

Build large fixtures in linear time: no fixture loop that rescans or re-joins its own output. Keep every escape sequence in test template literals intact: a `\\n` or `\\r\\n` inside a generated fixture source stays escaped, because an unescaped one passes on macOS and breaks the Windows leg. Do not run the install check; the seat runs it if it applies. Do not push.

Try each must-meet row's red cases by hand on macOS (R-2884's cannot run there; say so), see the named check turn red, restore, and say so in your report; do not commit them.

Checks before your one commit: `npm test --` with each of test-runner.test.mjs, test-runner-parallel.test.mjs, mutation-runner.test.mjs, worker-lane.test.mjs, brief-check.test.mjs, post-edit-hardening.test.mjs, windows-skip-lines.test.mjs, path-spelling.test.mjs, sources-file.test.mjs and writing-injection.test.mjs; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`, with its output kept out of the worktree; then `git status --short` must print nothing.

Seat check: `node docs/reviews/win-test-limits-2026-10-25/seat-titles.mjs all` must print `0 missing`.

Done: the six rows, their tests and the four seals exist and pass; the shim lives only in `slow-sampler.mjs`; every forced delay fails main's code by hand; the map, readme, trace and tree checks are green; the full suite is green; the seat check prints `0 missing`; `git status --short` is empty; and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; the rows; each red case's hand check; worker-lane.test.mjs's and mutation-runner.test.mjs's file times before and after on macOS; the full suite's summary line; map, readme, trace, tree and seat-check status; any departure from the Precedent files or the must-meet, with its reason.
