Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane win-leg-flakes, rows R-2480 to R-2486. Class: ordinary. Builder: pi-worker (small lane). Build session 4: a finding from the Windows CI leg — make R-2483 run on Windows.

Work in ~/nana-pi-wt/win-leg-flakes on feat/win-leg-flakes (the seat merged main and committed notes; the tip is the seat's). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. No push.

The finding (CI run 39626329305, suite windows-latest, at the code of bc3e492d): `FAIL packages/nana-setup/tests/stale-copies-slow.test.mjs 0 pass, 2 skip — no check passed and no skip was declared`. On Windows both checks print SKIP, and the runner (`scripts/test.mjs`, test honesty) fails a file that passes nothing unless its skip is declared. The Windows skip list (`packages/nana-pack/lib/windows-skips-config.mjs`) is for the desk and bench only; do not add this file there.

The fix: R-2483 runs on Windows too. Its meta-run forces the stale-copies checker to fail inside the linked Claude folder hook, and it reads only the R-1761 failure line, so the open linked-claude flake cannot make it fail (the forced failure is the point). R-2482 keeps its Windows SKIP and its reason.

1. `packages/nana-setup/tests/stale-copies-slow.test.mjs`:
   - Remove R-2483's win32 SKIP. Keep R-2482's.
   - The R-2483 preload must match the fixture home on every system: the fixtures set both `HOME` and `USERPROFILE` to the fixture home (`stale-copies.test.mjs:78`, `:91`), so test `process.env.HOME || process.env.USERPROFILE`. Match the basename of `process.argv[1]` case-insensitively on win32 (`stale-copies.mjs`).
   - The preload path in `NODE_OPTIONS` stays quoted with forward slashes. The meta child's `TMPDIR`, `TMP` and `TEMP` stay under the test's own `tmpDir`.
   - On win32 the stale-copies file runs only the win32 fixtures, so R-2483 expects at least one `linked-claude` entry with platform `win32`. Keep every assertion the must-meet lists.
   - Update the file header (`@outputs`) for one SKIP on Windows.
2. No other file changes. Do not edit `stale-copies.test.mjs`.

3. Run `node packages/nana-setup/tests/stale-copies-slow.test.mjs` on macOS (2 pass). Then `npm run map`, `npm run map:check`, `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your commit.

Wrong code to try — run and report; revert after:
- Match only `process.env.HOME` (not USERPROFILE) and run the check with `HOME` unset in the meta child's env but `USERPROFILE` set to the fixture home: R-2483 must go red. If you cannot set that up in a test-side probe, say so; the Windows leg is the evidence.

Seat check: `node docs/reviews/win-leg-flakes-2026-10-21/seat-titles.mjs all` must print `0 missing`.

Done:
- stale-copies-slow passes on macOS (2 pass); its header names one Windows SKIP.
- map:check and trace are green; the seat check prints `0 missing`; the full suite is green; the change is committed with explicit paths.

Report (at most 10 lines after the VERDICT line): the tip sha; the check results; the wrong-code result; map, trace and seat-check status; the full suite's summary line with its check count.
