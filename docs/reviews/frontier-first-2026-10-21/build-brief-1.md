Feature: FEAT-002 · Resume decisions and next actions. Lane frontier-first, rows R-2470 to R-2473 (block R-2470 to R-2479). Class: ordinary. Builder: pi-worker (small lane). Build session 1 of 2: the read window (R-2471, R-2472) and its seals.

Work in ~/nana-pi-wt/frontier-first on feat/frontier-first, based on main 363df471. The seat's plan commit has already reordered HANDOFF.md and moved notes into docs/sessions/; that is the seat's work, not yours. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. Other open lanes hold R-2480 to R-2489 (win-leg-flakes) and R-2490 to R-2499 (gate-rm-gitbash-tmp); use none of them. No push.

Read `docs/reviews/frontier-first-2026-10-21/must-meet.md` first: the rows verbatim, the facts, what each test does, the tunables and the design. This session builds R-2471 and R-2472 and the two seal checks. Session 2 builds R-2470, R-2473, the existing-check updates and the README; do not start it.

Trace rule: put each `// req: …` on the line directly above its `check("…", …)` call. The title's opening quote sits on the same line as `check(`. Never split a title. Use the must-meet titles exactly.

Order: rows first, then the tests, then the code.

1. REQUIREMENTS.md, FEAT-002's SUB-005 table: add R-2470 to R-2473 directly after R-879, verbatim from the must-meet, each `untested`. Flip R-2471 and R-2472 to `implemented` with backticked `file::title` evidence once their checks pass (the seals are extra evidence on both). R-2470 and R-2473 stay `untested` this session.

2. `packages/nana-pack/lib/frontier-config.mjs`: add `READ_WINDOW_BYTES`, `READ_WINDOW_LINES`, `LIVE_SECTION_NAMES` and `ARCHIVE_SECTION_NAMES` with the provenance comments from the must-meet's tunables table; update `@purpose` and `@outputs` as the must-meet says.

3. Tests in `packages/nana-pack/tests/frontier.test.mjs`: import the new names; add the two seals (`// req: R-2471 R-2472`) next to the existing word-budget seal; add the R-2472 and R-2471 checks with exactly the fixtures the must-meet lists, built from the imported constants. Put them before the file's closing summary.

4. `packages/nana-pack/bin/nana-frontier.mjs`: the `isNamed` helper, then the file-size check (design 1a) and the read-window check (design 1c), appended after the open-tag loop and before printing. Do not add the section-order check this session. Follow the design's byte rule exactly: a section's end byte excludes the end line's own line ending.

5. Run `node packages/nana-pack/tests/frontier.test.mjs`. Expect every old check still passing except none: the file-size and read-window kinds should not change any existing output, because every existing fixture is small and the frozen files are under the window (if an existing check does turn red, stop and report it; do not edit it this session). Then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your last commit.

No inline tunables.

Wrong code to try. Each must turn its check red; revert after.
- Count characters instead of UTF-8 bytes, in read-window: R-2471 red; in file-size: R-2472 red.
- Take the heading's own position instead of the section's end: R-2471 red.
- End a section at the next heading of any level: R-2471 red.
- Count the final newline as an extra line: R-2472 red. Flag at the limit with `>=`: R-2472 red.
- Set `READ_WINDOW_BYTES` to 51199: a seal red.

Seat check: `node docs/reviews/frontier-first-2026-10-21/seat-titles.mjs 1` must print `0 missing`.

Done:
- frontier.test.mjs passes, with R-2471 and R-2472 red on 363df471.
- map:check, readme:check and trace are green; R-2471 and R-2472 are implemented.
- The seat check prints `0 missing`; the full suite is green; the work is committed with explicit paths.

Report (at most 12 lines after the VERDICT line): the tip sha; each check's result; red on 363df471 per row; each wrong-code result; any existing check that changed; map, readme, trace and seat-check status; the full suite's summary line with its check count.
