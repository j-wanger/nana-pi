Feature: FEAT-029 · Navigate code and investigate impact. Lane runtime-map-live, rows R-2522 to R-2534. Class: install, hook or gate. Builder: pi-worker (larger lane). Build session 4 of 4: one test fix for the Windows leg.

Work in ~/nana-pi-wt/runtime-map-live on feat/runtime-map-live (tip after this brief's commit). The plan of record is `docs/reviews/runtime-map-live-2026-10-22/must-meet.md`, including its amendment after build 2. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/known-bugs/, docs/sessions/, packages/nana-pack/rules/ or docs/reviews/. No push. Change only `packages/nana-pack/tests/runtime-land.test.mjs`.

The seat checked build 3 at 56435b70: 17 of 17 wrong-code pairs red; the lane's tests pass plainly and under coverage; the macOS install check passes (17 PASS). On the Windows CI leg at dc931d36, F3 and F4 are fixed: R-1278 passes there, R-2526 passes, and the off-Windows checks skip with their lines. Three checks still fail there (`docs/reviews/runtime-map-live-2026-10-22/ci-windows-dc931d36.txt`):

- **F5 (MUST) — three land cases use the machine's real platform.** R-2523's, R-2524's and R-2525's cases go through `runCase`, which passes no `platform`, so on Windows `runLocked` takes R-2526's branch: no coverage start (`assert.ok(c.starts[0].coverage)` fails), one start instead of two, and the note "runtime map on Windows was not measured" instead of the write note. R-2526's own test injects `win32`, and R-2527's injects `darwin`; do the same here. `runCase` passes a non-Windows platform by default (a named constant in the test, for example `MEASURED_PLATFORM = "linux"`), and a case can still override it. Check every other land-path case in the file (R-2532's three cases) against the same question: does its expectation depend on the real platform?

1. Fix F5.
2. Show the fix bites: make a temporary edit that sets the default platform to `win32`, run the file, see R-2523, R-2524 and R-2525 go red, then restore and see them green. Run the file plainly and through the runner with the coverage knob set, `npm run map:check`, `npm run req:tree`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your commit. Commit with an explicit path.

Seat check: `node docs/reviews/runtime-map-live-2026-10-22/seat-titles.mjs all` must print `0 missing`.

Done:
- No land case in the file depends on the platform the suite runs on; the three named checks go red under a forced `win32` default and green after the fix.
- The file passes plainly and under coverage; map:check, req:tree, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 8 lines after the VERDICT line): the commit sha; the forced-win32 result; the check results plainly and under coverage; the full suite's summary line; seat-check status.
