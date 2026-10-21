Feature: FEAT-010 · Guard risky commands and protected resources. Lane gate-rm-gitbash-tmp, rows R-2490 to R-2497. Class: install, hook or gate. Builder: pi-worker (small lane). Build session 4 of 4: finish session 3's commit, then the headers, README and wording.

Work in ~/nana-pi-wt/gate-rm-gitbash-tmp on feat/gate-rm-gitbash-tmp. Session 3 left its work uncommitted (REQUIREMENTS.md, docs/requirements-tree.md, extensions/nana-gate.ts, tests/gate-rm-outside.test.mjs) because the trace refused its rows. That was the seat's brief error, not yours: a row whose test carries a `req:` marker cannot be `untested`. Keep that work. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. No push.

0. Session 3's rows: set R-2495, R-2496 and R-2497 to `implemented`, with evidence `` `packages/nana-pack/tests/gate-rm-outside.test.mjs::<exact title>`; Windows-leg-only ``, the form R-2273 uses (REQUIREMENTS.md, FEAT-010). The seat verifies them on the Windows CI leg before the land. Run `node scripts/requirements-trace.mjs` (exit 0), then commit session 3's files with explicit paths.

1. Headers and map: `packages/nana-pack/lib/gate-rm-outside.ts` `@inputs` (adds the injected platform and environment) and `@outputs` (adds `gitBashPath` and the three constants); the test file's header: its check counts (17 checks: 14 plus 3 SKIP off Windows; 16 plus 1 SKIP on Windows, the R-2497 SKIP when Git Bash is missing) and its `@effects` naming the Git Bash spawn R-2497 adds. Then `npm run map`.

2. `packages/nana-pack/README.md`, the "Plain `rm` outside the working folder asks first" bullet:
   - After "including `/tmp` on macOS and Linux, still pass", add the Git Bash rule in one or two sentences: on Windows, bash targets and `cd` folders spelled the Git Bash way are read as Git for Windows mounts them — `/tmp` as the folder TMP names (else TEMP), `/c/…` as drive C — after collapsing `.` and `..`; PowerShell spellings and other systems are not translated.
   - In the known limits, replace "Git Bash drive paths ask" with the must-meet's known limits in short form: other shells and a hand-edited fstab; Git Bash fixes `/tmp` once per user while any Git Bash runs; `/usr`, `/etc`, `/home` and `/cygdrive`, `/mnt`, `//host` spellings ask; only lowercase `/tmp`; with neither TMP nor TEMP set, `/tmp` asks.
   - The wording fixes: "`/tmp` on macOS and Linux" becomes "`/tmp` on every system but Windows" where the README names the POSIX `/tmp` rule (the lane-builder paragraph and this bullet), and in the bare-repository bullet "whether valid or not, as git also stops there," becomes "whether valid or not (git itself skips an invalid `.git` entry and keeps walking),".
   - Keep every other sentence word for word. No machine path, no owner name.
3. Comments only: `packages/nana-pack/lib/gate-temp-roots.ts` (around :21-22) "`/tmp` on macOS and Linux" → "`/tmp` on every system but Windows"; `packages/nana-pack/lib/gate-rm-inside.ts` (around :65-66) "(declared survivor: it asks more, never less)" → say that a symlinked HEAD, objects or refs is not recognised, so such an rm runs unasked.

4. Run `node packages/nana-pack/tests/gate-rm-outside.test.mjs` (14 PASS, 3 SKIP on macOS), `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check` and `node scripts/requirements-trace.mjs`, then the full suite with `npm run test:locked` before your last commit. If a gate test fails only when you run it alone inside your own session, say so and move on (the seat runs them outside).

Seat check: `node docs/reviews/gate-rm-gitbash-tmp-2026-10-21/seat-titles.mjs all` must print `0 missing`.

Done:
- Session 3's work is committed with R-2495 to R-2497 implemented (Windows-leg-only); the headers, README and comments are updated; map:check, readme:check and trace are green.
- gate-rm-outside passes on macOS (14 PASS, 3 SKIP); the seat check prints `0 missing`; the full suite is green; everything is committed with explicit paths.

Report (at most 12 lines after the VERDICT line): both commit shas; check results; the README sentences you added, quoted; map, readme, trace and seat-check status; the full suite's summary line with its check count.
