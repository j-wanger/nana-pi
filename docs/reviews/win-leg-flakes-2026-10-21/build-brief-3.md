Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane win-leg-flakes, rows R-2480 to R-2486 (block R-2480 to R-2489). Class: ordinary. Builder: pi-worker (small lane). Build session 3 of 3: the launch-limit margin (R-2484) and the PowerShell limit (R-2485), then the closing checks.

Work in ~/nana-pi-wt/win-leg-flakes on feat/win-leg-flakes. Sessions 1 and 2 are committed. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. Other open lanes hold R-2470 to R-2479 and R-2490 to R-2499. No push.

Read `docs/reviews/win-leg-flakes-2026-10-21/must-meet.md` first: rows R-2484 and R-2485 verbatim, "What each test does", the tunables (`HANG_STOP_MARGIN_MS` = 3_500, not 5_000: a 5 s margin would put the bound above the relay's own backstop, and `POWERSHELL_LIMIT_MS` = 60_000) and designs C and D.

Trace rule: put each `// req: R-24xx` on the line directly above its `check("R-24xx: …", …)` call. The title's opening quote sits on the same line as `check(`. Use the must-meet titles exactly.

Order: rows first, then the tests, then the code.

1. REQUIREMENTS.md, FEAT-031: add R-2484 and R-2485 between R-2483 and R-2486, verbatim, each `untested`; flip each to `implemented` with backticked `file::title` evidence once its check passes.

2. `packages/nana-setup/tests/pi-launch-limits.test.mjs` (design C): add `HANG_STOP_MARGIN_MS = 3_500` with its provenance comment; set `RELAY_ELAPSED_BOUND_MS = LIMIT_MS + RELAY_SETTLE_MS + HANG_STOP_MARGIN_MS`; `PARENT_KILL_BOUND_MS` keeps `RELAY_ELAPSED_MARGIN_MS`. Add the R-2484 pin check exactly as the must-meet describes it (five conditions, every value in the detail; `RELAY_BACKSTOP_MS` is already read by this file). R-2020 to R-2022 stay as they are in form. Update the header's check count.

3. `packages/nana-pack/tests/pack-config-utf16.test.mjs` (design D): add `POWERSHELL_LIMIT_MS = 60_000` with its provenance comment; move the Windows PowerShell launch (around :116) into a helper `runWindowsPowerShell(…, spawn = spawnSync)` that passes `timeout: POWERSHELL_LIMIT_MS`, and call it there. Add the R-2485 check, which runs on every platform: it calls the helper with a recording spawn and asserts the recorded `options.timeout === POWERSHELL_LIMIT_MS`, `POWERSHELL_LIMIT_MS === 60_000` and `POWERSHELL_LIMIT_MS > timeout`. The node children keep `timeout = 15_000`.

4. Closing: run `node packages/nana-setup/tests/pi-launch-limits.test.mjs` and `node packages/nana-pack/tests/pack-config-utf16.test.mjs`, then every file this lane touched, one at a time: install-check, stale-copies, stale-copies-slow. Then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your last commit.

No inline tunables.

Wrong code to try — run each and report its result; revert after:
- `HANG_STOP_MARGIN_MS` at 5_000: the R-2484 pin red (the bound would pass the relay backstop).
- `HANG_STOP_MARGIN_MS` at 1_000: the R-2484 pin red.
- The helper passes the shared `timeout` instead of `POWERSHELL_LIMIT_MS`: R-2485 red.

Seat check: `node docs/reviews/win-leg-flakes-2026-10-21/seat-titles.mjs all` must print `0 missing`.

Done:
- Both files pass on macOS, with R-2484 and R-2485 red on 363df471.
- All seven rows R-2480 to R-2486 are implemented; map:check, readme:check and trace are green.
- The seat check prints `0 missing`; each wrong-code result is in your report; the full suite is green; the work is committed with explicit paths.

Report (at most 12 lines after the VERDICT line): the tip sha; each check's result; red on 363df471 per row; each wrong-code result; every existing check you edited and why; map, readme, trace and seat-check status; the full suite's summary line with its check count.
