Feature: FEAT-002 · Resume decisions and next actions. Lane frontier-first, rows R-2470 to R-2473 (block R-2470 to R-2479). Class: ordinary. Builder: pi-worker (small lane). Build session 2 of 2: section order (R-2470), this repository's HANDOFF (R-2473), the existing-check updates and the README.

Work in ~/nana-pi-wt/frontier-first on feat/frontier-first. Session 1 is committed (R-2471, R-2472 and the seals). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. Other open lanes hold R-2480 to R-2489 and R-2490 to R-2499. No push.

Read `docs/reviews/frontier-first-2026-10-21/must-meet.md` first: rows R-2470 and R-2473 verbatim, "What each test does", design 1b, design 2 (the three existing checks the new kind makes false) and design 3 (README).

Trace rule: put each `// req: …` on the line directly above its `check("…", …)` call. The title's opening quote sits on the same line as `check(`. Use the must-meet titles exactly.

Order: the tests, then the code.

1. Tests in `packages/nana-pack/tests/frontier.test.mjs`: the R-2470 check with its four fixture files (after-landed, after-residuals, between, frontier-first) and the R-2473 check with its control. Put them before the file's closing summary. Update the file's header (`@purpose`, `@inputs`) to name the read window, the section order and this repository's HANDOFF.md.

2. `packages/nana-pack/bin/nana-frontier.mjs`: the section-order check (design 1b), after the file-size check and before the read-window check, so the order of findings is file-size, section-order, read-window.

3. Existing checks the new kind makes false — edit exactly these, and list each in your report:
   - `fixtures/frontier-baseline.json`, entry `current`: regenerate that one entry's stdout from the new CLI; confirm the only differences from main's entry are added `section-order:` lines and the summary count; paste that entry's diff in your report, at most 8 lines.
   - `frozen 2026-10-06 rewrite passes on 2026-10-07` becomes `frozen 2026-10-06 rewrite reports only its three section-order findings on 2026-10-07`, asserting `findings=3` and exactly three `section-order:` lines (confirm by running). Keep its `// req: R-877` marker. Swap the new title into R-877's evidence cell in REQUIREMENTS.md.
   - `frozen pre-rewrite HANDOFF reports 12 findings and key drift categories`: update the count in its title and assertion to what the new CLI reports (expected 15); keep its kind assertions and markers. If its title is cited in any evidence cell, swap it there too.
   - Any other existing check that turns red: stop, do not edit it, and report it.

4. `packages/nana-pack/README.md`, the HANDOFF frontier checker paragraph: design 3. Keep every other claim word for word. No machine path, no owner name.

5. REQUIREMENTS.md: flip R-2470 and R-2473 to `implemented` with backticked `file::title` evidence.

6. Run `node packages/nana-pack/tests/frontier.test.mjs`, then as single files `packages/nana-pack/tests/requirements-tree.test.mjs`, `packages/nana-pack/tests/product-report.test.mjs` and `packages/nana-pack/tests/readme-check.test.mjs`. Then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your last commit.

No inline tunables.

Wrong code to try — run each and report its result; revert after:
- Ignore Carried residuals as an archive heading: R-2470 red.
- Flag every live heading whenever any archive heading exists: R-2470 red.
- Use the last archive heading instead of the first: R-2470 red.
- Reverse the R-2473 repo check (run it against `git show 363df471:HANDOFF.md` written to a temp file): it must find section-order lines (this proves the repo half can fail; do not commit it).

Seat check: `node docs/reviews/frontier-first-2026-10-21/seat-titles.mjs all` must print `0 missing`.

Done:
- frontier.test.mjs passes, with R-2470 and R-2473 red on 363df471.
- All four rows R-2470 to R-2473 are implemented; map:check, readme:check and trace are green.
- The seat check prints `0 missing`; each wrong-code result is in your report; the full suite is green; the work is committed with explicit paths.

Report (at most 14 lines after the VERDICT line): the tip sha; each check's result; red on 363df471 per row; each wrong-code result; each existing check you edited, with the baseline-entry diff; map, readme, trace and seat-check status; the full suite's summary line with its check count.
