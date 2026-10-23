Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane win-flake-hardening. Class: ordinary. Builder: pi-worker (larger lane). Build session 1: the whole lane.

Work in the lane worktree on feat/win-flake-hardening. The spec is `docs/reviews/win-flake-hardening-2026-10-23/must-meet.md`: read it whole before designing. It holds over `plan-draft.md` where they differ; read the draft for the measured causes, fixture designs and tunables it points to. Do not edit HANDOFF, the session archive, `docs/known-bugs/`, or any file in this review folder.

What the lane does, in one sentence: five Windows CI failures that no lane caused stop being timing-dependent, each with an injected slow schedule that fails main's code every run: the runner fails and goes on when a finished file's temp folder stays busy; build-report's hard-kill step cannot throw; R-1472's and R-1470's fixtures meet instead of hoping to overlap; and R-2585's worker never starts the slow CPU sampler.

Precedent:
- docs/reviews/win-leg-flakes-2026-10-21/must-meet.md — one verdict per flake, an injected slow schedule that fails main's code every run, tunables with provenance.
- scripts/test.mjs — `cleanup()`, the serial and pool removal sites, and the "tracked repository files changed by tests" FAIL line counted as an unnamed failure: the form R-2666's FAIL line follows.
- packages/nana-pack/lib/test-runner-config.mjs — home of the runner's new tunables, beside `RUN_ALONE`.
- packages/nana-pack/tests/test-runner.test.mjs — `mkRoot`, `run`, the totals regex and `runForced`, which preloads a module into the runner only.
- packages/nana-pack/tests/review-test-waits.test.mjs — R-1922: a preload whose `rmSync` throws EBUSY, and a named FAIL line instead of an uncaught exception.
- packages/nana-pack/tests/test-runner-parallel.test.mjs — `mkRoot`, `run`, `maxOverlap`, `recordTiming`, `sleepRecordFixture`, and the R-1470 and R-1472 checks.
- packages/nana-pack/tests/build-report.test.mjs — the hard-kill case and its retried folder removal.
- packages/nana-pack/tests/watchdog-cpu.test.mjs — a test's tree kill that cannot throw.
- packages/nana-pack/tests/brief-check.test.mjs — the fixture, the stub folder first on PATH, `runWorker` and `runCheck`.
- packages/nana-pack/tests/fake-pi.mjs — the win32 fake pi layout.
- packages/nana-pack/tests/build-records.test.mjs — `CASE_LIMIT_MS = 30_000` for pi-worker runs in a test.
- packages/nana-pack/bin/pi-watchdog.mjs — read only: `cpuSeconds` and the exit race.

Steps, in order:
1. Rows first: add R-2666 to R-2670 to `REQUIREMENTS.md` in FEAT-031 after R-2486, as the must-meet states them, `untested` until each check passes, then `implemented` with backticked `file::title` evidence. R-1470, R-1472, R-2585 and R-2601 keep their text and titles.
2. Tests, each with its `// req:` marker directly above and the exact title the must-meet gives, plus the two seal tests. Each injected slow schedule must fail main's code every run, not by chance; check that by hand against main's code once per row and say so in the report (do not commit those checks). Floors on measured milliseconds are reached by a sleep loop, never a single timer.
3. Code: the runner's two removal sites with the sealed retries and the FAIL line counted as one unnamed failure; build-report's kill function with its injected runner and the hard-kill worker's poll above the start wait; the R-1472 and R-1470 meeting fixtures; brief-check's poll, child limit, fake hold and slow sampler shim.
4. Docs: the README `npm test` paragraph; module headers for `scripts/test.mjs` and `test-runner-config.mjs`, and `@effects` in the test files that gain a shim or preload. Regenerate `docs/code-map.md` and `docs/requirements-tree.md` (`npm run map`, `npm run req:tree`).
5. Checks before your one commit: test-runner, test-runner-parallel, brief-check, build-report and review-test-waits test files; `npm run map:check`; `npm run readme:check`; `node scripts/requirements-trace.mjs`; `node scripts/requirements-tree.mjs --check`; `npm run test:locked`.

Seat check: `node docs/reviews/win-flake-hardening-2026-10-23/seat-titles.mjs all` must print `0 missing`.

Done: every must-meet test passes, each injected schedule fails main's code every run, the seat check prints `0 missing`, the full suite is green, and the work is committed.

Report (at most 12 lines after the VERDICT line): the commit sha; each must-meet title's result; the hand check against main's code for each row; each departure from the Precedent files or the must-meet, with its reason; the full suite's summary line; map, readme, trace, tree and seat-check status; anything not done.
