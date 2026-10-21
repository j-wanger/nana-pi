Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane win-leg-flakes, rows R-2480 to R-2486 (block R-2480 to R-2489). Class: ordinary. Builder: pi-worker (small lane). Build session 2 of 3: stale-copies (R-2482, R-2483).

Work in ~/nana-pi-wt/win-leg-flakes on feat/win-leg-flakes. Session 1 is committed (6c99f999: R-2480, R-2481, R-2486; the seat ran its five wrong-code tries, 5 of 5 red). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. Other open lanes hold R-2470 to R-2479 and R-2490 to R-2499. No push.

Read `docs/reviews/win-leg-flakes-2026-10-21/must-meet.md` first: rows R-2482 and R-2483 verbatim, "What each test does", the tunables (`INSTALL_CHILD_LIMIT_MS`, `CASE_LIMIT_MS`, `SLOW_INSTALL_MS`, `META_RUN_LIMIT_MS`) and design B. This session builds only R-2482, R-2483 and the R-2482 pin. Session 3 builds the rest; do not start it.

Trace rule: put each `// req: R-24xx` on the line directly above its `check("R-24xx: …", …)` call. The title's opening quote sits on the same line as `check(`. Use the must-meet titles exactly.

Order: rows first, then the tests, then the code.

1. REQUIREMENTS.md, FEAT-031: add R-2482 and R-2483 between R-2481 and R-2486, verbatim, each `untested`; flip each to `implemented` with backticked `file::title` evidence once its check passes (the pin is extra evidence on R-2482).

2. `packages/nana-setup/tests/stale-copies.test.mjs` (test-only changes, design B):
   - Add `INSTALL_CHILD_LIMIT_MS = 20_000` with its provenance comment and use it at both install spawns (`installHome`, around :72-77, and `repairCase`, around :385). `CASE_LIMIT_MS` stays 5000 for hook children and the phase races; give it its provenance comment.
   - In `buildBroken` (around :233-242) time the `hookResult` call into `hookMs`; `labelFacts` (around :299) gains `hookStatus`, `hookSignal`, `hookMs` and `unavailable` (the hook output lines starting with the unavailable prefix) for every case. Read the file first and reuse its own helpers.
   - Add the pin titled `R-2482: the stale-copies install-child limit is sealed at 20 seconds` (`// req: R-2482`) beside the existing seal check (around :271). Export or otherwise expose `INSTALL_CHILD_LIMIT_MS` so the pin reads the name, never a second literal.
   - Update the file header if its counts or effects change.

3. New file `packages/nana-setup/tests/stale-copies-slow.test.mjs` with the six-tag header (`@module`, `@purpose` in one sentence, `@inputs`, `@outputs`, `@effects`, `@errors`). It holds the R-2482 and R-2483 checks exactly as the must-meet describes them: CommonJS preloads in a `tmpDir`; meta-runs of `stale-copies.test.mjs` with `spawnSync(process.execPath, ["--experimental-strip-types", file])` from `packages/nana-setup`; `NODE_OPTIONS` appended with `--require="<preload path with forward slashes>"`; `TMPDIR`, `TMP` and `TEMP` set to a folder under the test's own `tmpDir`; `timeout: META_RUN_LIMIT_MS`. On win32 both checks print a SKIP line naming the reason the must-meet gives. Follow `packages/nana-pack/tests/review-test-waits.test.mjs:73-125` for the preload pattern, and match the real fixture home names, the real R-1761 title and the real summary line format by reading `stale-copies.test.mjs` and `scripts/test.mjs` — do not guess them.

4. Run `node packages/nana-setup/tests/stale-copies.test.mjs` and `node packages/nana-setup/tests/stale-copies-slow.test.mjs` (the slow file takes about a minute on macOS). Then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your last commit.

No inline tunables.

Wrong code to try — this time you must run each and report its result; revert after:
- `INSTALL_CHILD_LIMIT_MS` back to 5000: R-2482's meta-run red and the pin red.
- `repairCase` still on `CASE_LIMIT_MS` (only `installHome` changed): R-2482's meta-run red.
- Drop the four hook keys from `labelFacts`: R-2483 red.

Seat check: `node docs/reviews/win-leg-flakes-2026-10-21/seat-titles.mjs 2` must print `0 missing`, and `node docs/reviews/win-leg-flakes-2026-10-21/seat-titles.mjs 1` must still print `0 missing`.

Done:
- Both stale-copies files pass on macOS, with R-2482 and R-2483 red on 363df471 (the must-meet records the probes; confirm them).
- map:check, readme:check and trace are green; R-2482 and R-2483 are implemented.
- Both seat checks print `0 missing`; each wrong-code try's result is in your report; the full suite is green; the work is committed with explicit paths.

Report (at most 12 lines after the VERDICT line): the tip sha; each check's result; red on 363df471 per row; each wrong-code result; every existing check you edited and why; map, readme, trace and seat-check status; the full suite's summary line with its check count.
