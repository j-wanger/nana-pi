Feature: FEAT-029 · Navigate code and investigate impact. Lane runtime-map-live, rows R-2522 to R-2534. Class: install, hook or gate. Builder: pi-worker (larger lane). Build session 1 of 2: every land measures the runtime map on its tip, and the hand measure takes the same path.

Work in ~/nana-pi-wt/runtime-map-live on feat/runtime-map-live. The plan of record is `docs/reviews/runtime-map-live-2026-10-22/must-meet.md`: read its decisions D1 to D9, rows and known limits first, then `plan-attack.md` (M1 to M4, S1 to S6) and `plan-draft.md` (the measurements and the files). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, packages/nana-pack/rules/ or docs/reviews/. No push.

1. `nana-land` (`packages/nana-pack/bin/nana-land.mjs`, its suite step near :103): set `NANA_LAND_TIP` to the source tip's full SHA in the suite's environment (R-2522), and print every suite output line that starts with the land note prefix in the success output too (R-2530). Put the tunables the must-meet lists in one configuration module with provenance (a new `packages/nana-pack/lib/land-config.mjs`, or the runtime map's config where they belong there).
2. The locked suite (`scripts/test-locked.mjs`) with `scripts/runtime-measure.mjs` split into run and write, so both share one write path inside the machine lock:
   - with `NANA_LAND_TIP` naming HEAD on an unfiltered run, run under coverage and write the data with `tip` and `measuredAt` (R-2523);
   - a coverage run that fails: write its data when its completion record matches, rerun only the failed files once without coverage, exit with that run's code, and print each rerun file as a land note (R-2524, D5, with `COVERAGE_FAILURE_POLICY`);
   - a write failure after a passing run: exit 0, keep the earlier data, print one land note naming why (R-2525);
   - Windows (platform injected, so the test runs on every leg): one plain run and a land note (R-2526);
   - SIGINT, SIGTERM or SIGHUP during the coverage run: remove the coverage folder, keep the data, exit non-zero; at start, remove any coverage folder whose recorded owner process is gone (R-2527);
   - a filtered run (including `--jobs=2`), a tip that is not HEAD, or a failing run with no tip: no coverage, no rerun, data byte-equal (R-2532);
   - `npm run map:measure` runs this land path with HEAD as the tip and stamps `dirty`, the count of dirty tracked files (R-2533).
3. R-2531, end to end in `land.test.mjs`'s fixture with a fake suite: after `runLand` merges, the data's `tip` equals `refs/heads/main` and the main checkout shows no drift.
4. D9: in `packages/nana-setup/tests/install.test.mjs`, the R-2498 check (near :117) compares the keys it set, not the env object's key count, so it passes under coverage. No new row.
5. Tests with the must-meet's exact titles and `// req:` markers: R-2522, R-2530 and R-2531 in `packages/nana-pack/tests/land.test.mjs`; R-2523 to R-2527, R-2532 and R-2533 in a new `packages/nana-pack/tests/runtime-land.test.mjs` with the six-tag header. Make each wrong build in the must-meet's "What each test does" fail its test: fixture tips that differ from main's SHA, the fake suite's logged starts and knobs, byte-for-byte data compares. Add the rows to FEAT-029 in REQUIREMENTS.md with the must-meet's texts, status `implemented` and evidence.
6. Every new test must also pass under coverage, because a land runs it so: run each new and changed test file once with the coverage knob set (as the measure sets it) and once without.
7. Run the changed test files, `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node packages/nana-setup/bin/install-check.mjs` (macOS), then `npm run test:locked` before your last commit. Then run one real hand measure (`npm run map:measure`) in this worktree and report its tip and dirty count. Try these wrong versions, see each go red, then restore: drop the variable (R-2522); stamp main's old SHA (R-2531); measure a filtered run (R-2532); rerun every file (R-2524); let a write failure exit 1 (R-2525); drop the note echo (R-2530); a hand measure writing no tip (R-2533). Commit with explicit paths.

Seat check: `node docs/reviews/runtime-map-live-2026-10-22/seat-titles.mjs 1` must print `0 missing`.

Done:
- A land's locked suite measures and writes the map for its tip; a coverage failure keeps the data and reruns only the failed files; notes reach the land's output; the negative cases leave the data alone; the hand measure stamps its tip and dirty count; install.test passes under coverage.
- The changed tests pass with and without coverage; map:check, req:tree, readme:check, the trace, the install check and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 14 lines after the VERDICT line): the commit shas; the check results with and without coverage; the hand measure's tip and dirty count; the wrong versions tried; the install check's and the full suite's summary lines; map, readme, trace and seat-check status.
