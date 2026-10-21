Feature: FEAT-010 · Guard risky commands and protected resources. Lane gate-rm-gitbash-tmp, rows R-2490 to R-2497 (block R-2490 to R-2499). Class: install, hook or gate (the gate's rm-outside reading). Builder: pi-worker (small lane). Build session 1 of 4: the Git Bash reading and its two call sites (R-2492, R-2490, R-2491).

Work in ~/nana-pi-wt/gate-rm-gitbash-tmp on feat/gate-rm-gitbash-tmp, based on main bc529014. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. The other open lane holds R-2480 to R-2489 (win-leg-flakes); use none of them. No push.

Read `docs/reviews/gate-rm-gitbash-tmp-2026-10-21/must-meet.md` first: the facts, the security floor, the rows verbatim, "What each test does", the tunables and the design. This session builds R-2492, R-2490 and R-2491 only. Later sessions build the rest; do not start them.

Trace rule: put each `// req: R-249x` on the line directly above its `check("…", …)` call, in this file's own check form. The title's opening quote sits on the same line as `check(`. Use the must-meet titles exactly (this file's titles carry no row prefix).

Order: rows first, then the tests, then the code.

1. REQUIREMENTS.md, FEAT-010: add R-2490, R-2491 and R-2492 directly after R-2338, verbatim, each `untested`. Leave room for R-2493 to R-2497 after them (later sessions). Flip each to `implemented` with backticked `file::title` evidence once its check passes.

2. Tests in `packages/nana-pack/tests/gate-rm-outside.test.mjs`: add the `gbHits(command, { platform = "win32", env = { TMP: TEMP_ROOT }, tool = "bash", tempRoots = [TEMP_ROOT] } = {})` helper (the file's existing module-hit helper plus `platform` and `env`), then the R-2492, R-2490 and R-2491 checks with every case the must-meet lists, built from the file's fixture names (TEMP_ROOT, OUTSIDE, WORK). On Linux the fixture root lies under `/tmp`: never type a fixture's absolute path as a target in a win32-injected check; spell targets as `/tmp/...` or relative paths. R-2492 is a pure check on the exported `gitBashPath`, the same on every platform.

3. `packages/nana-pack/lib/gate-rm-outside.ts`:
   - The three contract constants `GIT_BASH_TEMP`, `GIT_BASH_TEMP_VARIABLES` and `GIT_BASH_DRIVE`, each with its provenance comment from the must-meet's tunables table, and the named export `gitBashPath(spelling, { platform, env })` exactly as design 1 says: unchanged off win32 or with no env; unchanged when the spelling begins with `//` or holds a backslash; otherwise `path.posix.normalize` first, then the `/tmp` rule (TMP, else TEMP, first non-empty; neither → unchanged), then the drive rule (`/c` → `C:/`, never `C:`), else unchanged. Text substitution only, never path.win32.
   - `rmOutsideTargets` options gain `platform` and `env`, both optional; absent means no translation.
   - In `placedTarget` (bash only, not powershell) translate the typed target before `homeExpanded`. In the `cd`/`pushd` branch (bash only) translate `typed` the same way before `homeExpanded`. Thread `platform` and `env` to both places; read nothing from `process`.
   - Do not touch `extensions/nana-gate.ts` this session (session 3 wires it).

4. Run `node packages/nana-pack/tests/gate-rm-outside.test.mjs` (expect 12 checks: 9 old, 3 new), then each other gate test file one at a time: `gate-rm-inside`, `gate-shell`, `gate-temp-roots`, `nana-gate` and any other `packages/nana-pack/tests/gate-*.test.mjs` file that imports `gate-rm-outside` (find them with grep). Then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your last commit.

No inline tunables. The constants are contract values beside `gitBashPath`.

Wrong code to try — run each and report its result; revert after:
- No translation at all (`gitBashPath` returns the spelling): R-2490, R-2491 and R-2492 red.
- Translate in `placedTarget` only, not in the cd branch: R-2491 red.
- Read TEMP before TMP: R-2490 red.
- Lower-case drive letter, or `/c` → `C:`, or a two-letter match: R-2492 red.

Seat check: `node docs/reviews/gate-rm-gitbash-tmp-2026-10-21/seat-titles.mjs 1` must print `0 missing`.

Done:
- gate-rm-outside.test.mjs passes on macOS with 12 checks, each new check red on bc529014; every other gate test file passes alone.
- map:check, readme:check and trace are green; R-2490, R-2491 and R-2492 are implemented.
- The seat check prints `0 missing`; each wrong-code result is in your report; the full suite is green; the work is committed with explicit paths.

Report (at most 12 lines after the VERDICT line): the tip sha; each check's result; red on bc529014 per row; each wrong-code result; every existing check you edited and why; map, readme, trace and seat-check status; the full suite's summary line with its check count.
