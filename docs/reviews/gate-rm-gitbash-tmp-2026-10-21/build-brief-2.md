Feature: FEAT-010 · Guard risky commands and protected resources. Lane gate-rm-gitbash-tmp, rows R-2490 to R-2497 (block R-2490 to R-2499). Class: install, hook or gate. Builder: pi-worker (small lane). Build session 2 of 4: the guards against over-translation (R-2493, R-2494).

Work in ~/nana-pi-wt/gate-rm-gitbash-tmp on feat/gate-rm-gitbash-tmp. Session 1 is committed (c33dd1f6: R-2490 to R-2492; the seat ran gate-status alone and it passes, 23 pass, so its standalone failure in your session came from that session's environment, not the change). Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. The other open lane holds R-2480 to R-2489. No push.

Read `docs/reviews/gate-rm-gitbash-tmp-2026-10-21/must-meet.md` first: rows R-2493 and R-2494 verbatim and their paragraphs under "What each test does". This session builds only these two. Do not start session 3.

Trace rule: put each `// req: R-249x` on the line directly above its `check("…", …)` call. Use the must-meet titles exactly.

1. REQUIREMENTS.md, FEAT-010: add R-2493 and R-2494 after R-2492, verbatim, each `untested`; flip each to `implemented` with backticked `file::title` evidence once its check passes.

2. Tests in `packages/nana-pack/tests/gate-rm-outside.test.mjs`:
   - The fixture link `TEMP_ROOT/linkout` → OUTSIDE, created with the file's `linkType` (a junction on win32), beside the file's other fixture links.
   - The R-2493 check, with every case and the positive control. The lookalikes assert exact hit paths (`[path.resolve(WORK, "/tmpx/y")]` and so on), not just a count; the climb-out `rm -f /tmp/../outside/x` asserts exactly `[path.resolve(WORK, "/outside/x")]`.
   - The R-2494 check, with tempRoots built by `acceptedTempRoots` imported from `../lib/gate-temp-roots.ts`, the three excluded folders, `TEMP: HOME`, and the positive control. NAME is never created.
   - No production code should be needed. If a check fails, fix `gate-rm-outside.ts` to meet the row, not the check, and say so in the report.

3. Run `node packages/nana-pack/tests/gate-rm-outside.test.mjs` (expect 14 checks), then the other gate test files one at a time as in session 1. Then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your last commit.

Wrong code to try — run each and report its result; revert after:
- A `/tmp` prefix test with no boundary (`spelling.startsWith("/tmp")`): R-2493 red.
- Translate for PowerShell too: R-2493 red.
- Translate on every platform: R-2493 red.
- Translate before collapsing `..` (drop the normalize step): R-2493 red.
- Add TMP straight to tempRoots, skipping the shared rule: R-2494 red.

Seat check: `node docs/reviews/gate-rm-gitbash-tmp-2026-10-21/seat-titles.mjs 2` and `… 1` must each print `0 missing`.

Done:
- gate-rm-outside.test.mjs passes on macOS with 14 checks; R-2493 and R-2494 are red on bc529014 through their controls and exact-path cases.
- map:check, readme:check and trace are green; R-2493 and R-2494 are implemented.
- Both seat checks print `0 missing`; each wrong-code result is in your report; the full suite is green; the work is committed with explicit paths.

Report (at most 12 lines after the VERDICT line): the tip sha; each check's result; red on bc529014 per row; each wrong-code result; any production change and why; map, readme, trace and seat-check status; the full suite's summary line with its check count.
