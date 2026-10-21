Feature: FEAT-010 · Guard risky commands and protected resources. Lane gate-rm-gitbash-tmp, rows R-2490 to R-2497 (block R-2490 to R-2499). Class: install, hook or gate. Builder: pi-worker (small lane). Build session 3 of 4: the gate wiring and the three Windows-only checks (R-2495, R-2496, R-2497).

Work in ~/nana-pi-wt/gate-rm-gitbash-tmp on feat/gate-rm-gitbash-tmp. Sessions 1 and 2 are committed (R-2490 to R-2494; gate-rm-outside 14 pass). The seat ran every gate test file alone outside your session (gate-policy-paths, gate-self-protection, gate-status, gate-rm-inside, gate-config-robustness, gate-corpus, gate-survives-mutation): all pass. A gate test that fails when you run it alone inside your own gated session is not a defect of this lane; report it and move on. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. No push.

Read `docs/reviews/gate-rm-gitbash-tmp-2026-10-21/must-meet.md` first: rows R-2495, R-2496 and R-2497 verbatim, their paragraphs under "What each test does", and design 4. This session builds these three and the wiring only. Do not start session 4.

Trace rule: put each `// req: R-249x` on the line directly above its `check("…", …)` call. Use the must-meet titles exactly.

1. REQUIREMENTS.md, FEAT-010: add R-2495, R-2496 and R-2497 after R-2494, verbatim, each `untested` with its planned evidence cell ending `; Windows-leg-only` (as R-2273 does). The seat flips them to implemented after the Windows leg passes; you do not.

2. `packages/nana-pack/extensions/nana-gate.ts` (around :148-152): add `platform: process.platform, env: process.env` to the rm-outside options. Pass the live `process.env` object itself, never a spread or copy: on Windows only the live object looks names up case-insensitively.

3. Tests in `packages/nana-pack/tests/gate-rm-outside.test.mjs`:
   - The helper `gitBash(p) = "/" + p[0].toLowerCase() + p.slice(2).replaceAll("\\", "/")`.
   - R-2495, R-2496 and R-2497 exactly as the must-meet describes them. Each prints a SKIP line naming its reason off win32; R-2497 also prints SKIP when `%ProgramFiles%\Git\bin\bash.exe` is missing. R-2495 and R-2496 use the real registered handler, headless, the way the file's existing handler checks do. R-2496 includes the case `cd <shellQuote(gitBash(WORK))> && rm -f x` giving reason `""`. R-2497 runs `bash -c "/usr/bin/cygpath -w /c/Users /D/data/x; /usr/bin/mount"` with no timeout of its own, compares case-insensitively, and checks a `usertemp` mount line for `/tmp`.
   - On macOS these three print SKIP; the Windows CI leg is their evidence.

4. Run `node packages/nana-pack/tests/gate-rm-outside.test.mjs` (expect 14 PASS and 3 SKIP on macOS), then `node packages/nana-pack/tests/gate-corpus.test.mjs` and `node packages/nana-pack/tests/gate-survives-mutation.test.mjs`. Then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your last commit.

Wrong code to try — report its result; revert after:
- nana-gate passes no `platform` or `env`: R-2495 and R-2496 can only go red on Windows. Say so; do not invent a macOS stand-in.

Seat check: `node docs/reviews/gate-rm-gitbash-tmp-2026-10-21/seat-titles.mjs all` must print `0 missing`.

Done:
- gate-rm-outside.test.mjs passes on macOS with 14 PASS and 3 SKIP lines, each SKIP naming its reason.
- map:check, readme:check and trace are green; R-2495 to R-2497 are `untested` with Windows-leg-only planned evidence.
- The seat check prints `0 missing`; the full suite is green; the work is committed with explicit paths.

Report (at most 12 lines after the VERDICT line): the tip sha; each check's result on macOS; the wiring diff in one line; map, readme, trace and seat-check status; the full suite's summary line with its check count; any gate test that failed alone in your session.
