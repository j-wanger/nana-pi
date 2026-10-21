Feature: FEAT-031 · Run checks reliably and without contaminating work. Lane win-leg-flakes, rows R-2480 to R-2486 (block R-2480 to R-2489). Class: ordinary. Builder: pi-worker (small lane). Build session 1 of 3: the install check's pi-subagents retry (R-2480, R-2481, R-2486).

Work in ~/nana-pi-wt/win-leg-flakes on feat/win-leg-flakes, based on main 363df471. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. Other open lanes hold R-2470 to R-2479 (frontier-first) and R-2490 to R-2499 (gate-rm-gitbash-tmp); use none of them. No push.

Read `docs/reviews/win-leg-flakes-2026-10-21/must-meet.md` first: the rows verbatim, what each test does, the tunables with their provenance, the design and the known limits. This session builds only rows R-2480, R-2481 and R-2486 and the R-2480 pin. Sessions 2 and 3 build the rest; do not start them.

Trace rule: put each `// req: R-24xx` on the line directly above its `check("R-24xx: …", …)` call (stack two markers, or list both IDs on one marker, for the pin). The title's opening quote sits on the same line as `check(`. Never split a title onto the next line. Use the must-meet titles exactly.

Order: rows first, then the tests, then the code.

1. REQUIREMENTS.md, FEAT-031: add R-2480, R-2481 and R-2486 directly after R-2172, verbatim from the must-meet, each `untested`. Leave room: sessions 2 and 3 add R-2482 to R-2485 between R-2481 and R-2486, so put R-2486 last. Flip each to `implemented` with backticked `file::title` evidence once its check passes; the R-2480 pin is extra evidence on R-2480 and R-2481.

2. `packages/nana-setup/lib/install-check-config.mjs`: add `PI_SUBAGENTS_RETRY = { attempts: 3, pauseMs: 5000, codeLeads: ["npm error code ", "npm ERR! code "] }` with the provenance comments from the must-meet's tunables table beside it. Update the module header if its outputs change.

3. Tests in `packages/nana-setup/tests/install-check.test.mjs`, titles exactly as the must-meet gives them:
   - `recordingRun` (around :218, called at :308) gains a `sleep` passthrough that defaults to a recording no-op; the direct `runInstallCheck` call around :637 (every spawn exits 1) gets `sleep: async () => {}` so the file never waits 10 s.
   - The R-2480, R-2481 and R-2486 checks, each covering every case its must-meet paragraph lists. Import the config names; no literal 3, 5000 or code strings outside the fixture's own npm output.
   - The pin titled `R-2480: the pi-subagents retry is sealed at three attempts, a five-second pause and npm's two error-code line leads`, marked for R-2480 and R-2481, asserting deepEqual on `PI_SUBAGENTS_RETRY`.
   - Read how `piRun` reports a timeout and how the existing FAIL line words it before you write R-2486's fixture and assertion; match them exactly.

4. `packages/nana-setup/lib/install-check.mjs`: `runInstallCheck` (around :290) gains an injected `sleep = (ms) => new Promise((r) => setTimeout(r, ms))`. At around :358-359 the single pi-subagents install becomes a loop of up to `attempts`. After an attempt with no error and a numeric non-zero status, push `NOTE pi-subagents attempt ${n} of ${attempts} failed — ${code line ?? existing reason}` where the code line comes from a small exported pure helper (first stderr line starting with a `codeLeads` entry, trimmed). Then `await sleep(pauseMs)` and try again. A timeout or a launch error stops the loop at once. PASS and FAIL line formats stay exactly as they are. `bin/install-check.mjs` stays unchanged.

5. `packages/nana-setup/README.md`, section "Install check": add one sentence — the pi-subagents install is retried up to three times, five seconds apart, after an exit failure, and each failed attempt prints a NOTE line with npm's error-code line. Keep every other sentence word for word. No machine path, no owner name.

6. Run `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`. Run as single files: `node packages/nana-setup/tests/install-check.test.mjs`, `node packages/nana-setup/tests/readme-rehearsal.test.mjs` and `node packages/nana-pack/tests/readme-check.test.mjs`. Then the full suite with `npm run test:locked` before your last commit.

No inline tunables.

Wrong code to try. Each must turn its check red; revert after.
- Remove the retry loop (one attempt): R-2480 red.
- Drop the NOTE line: R-2481 red.
- Always print attempt 1's code line in every NOTE: R-2481 red.
- Retry a timeout too: R-2486 red.
- Set `attempts` to 2: the pin red.

Seat check: `node docs/reviews/win-leg-flakes-2026-10-21/seat-titles.mjs 1` must print `0 missing`.

Done:
- install-check.test.mjs passes, with R-2480 and R-2481 red on 363df471 (R-2486 is a guard, green on main by design; say so).
- map:check, readme:check and trace are green; R-2480, R-2481 and R-2486 are implemented.
- The seat check prints `0 missing`.
- The full suite is green; the work is committed on feat/win-leg-flakes with explicit paths.

Report (at most 12 lines after the VERDICT line): the tip sha; each check's result; red on 363df471 per row; each wrong-code result; every existing check you edited and why; map, readme, trace and seat-check status; the full suite's summary line with its check count.
