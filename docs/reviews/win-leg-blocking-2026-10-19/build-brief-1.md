# Lane win-leg-blocking — build brief 1 (2026-10-19 · feat/win-leg-blocking · tip after the seat's plan commit)

**Builder: Claude Sonnet 5, a subagent in `<worktrees>/win-leg-blocking`.** Lane class: gate. Read `must-meet.md` here first (the adversary's amended plan; `plan-attack.md` holds its reasons). Requirements first: add the rows `must-meet.md` lists as `planned` in the right feature table of `REQUIREMENTS.md`, run `npm run req:tree`, and bump the R-291 leaf-total literal in `packages/nana-pack/tests/requirements-tree.test.mjs` (three spots) by the rows you add; then the tagged tests; then the code; flip each row to `implemented` when its test passes. Run `npm run map` after adding or moving a module and commit the map. Do not run the full suite and do not push; the seat does both. Do not edit `HANDOFF.md` or `docs/sessions/`.

---

# win-leg-blocking — build brief 1

Worktree `~/nana-pi-wt/win-leg-blocking`, branch `feat/win-leg-blocking` from main b3f6ec2. Rows come only from R-1380 to R-1389; use R-1380 to R-1383. Read `docs/reviews/win-leg-blocking-2026-10-19/must-meet.md` first: row texts, the 20 paths, their causes. The desk is frozen: change no file under apps/desk but its README.

**First:** run `npm run test:locked -- apps/desk apps/bench` on the untouched tip. Commit its per-file lines (labels and check counts; timings may differ) as `docs/reviews/win-leg-blocking-2026-10-19/macos-baseline.txt`.

**Change**
1. REQUIREMENTS.md: add R-1380 to R-1383 to the FEAT-031 table as `planned`; flip each to `implemented` with its test title once green. `packages/nana-pack/tests/requirements-tree.test.mjs`: leaf total 1,215 to 1,219 (lines 40, 54, 55). Run `npm run req:tree` and commit `docs/requirements-tree.md` (R-291 compares it with a fresh render).
2. Add `packages/nana-pack/lib/windows-skips-config.mjs`: six-tag header (@effects none), named export `WINDOWS_SKIPS = Object.freeze({...})`, 20 entries, each reason `win32: desk|bench not supported on Windows (declared 2026-10-17): <cause>` (pick desk or bench). Provenance comment: the CI log path and date.
3. `scripts/test.mjs`: import the config; extend the existing `skipReason` expression only: `SKIPS[rel(file)]?.() ?? (process.platform === "win32" && Object.hasOwn(WINDOWS_SKIPS, rel(file)) ? WINDOWS_SKIPS[rel(file)] : null)`. Keep the one SKIP branch (tally, coverage record). Update the header's @inputs. Change nothing else.
4. Every fixture root that copies the runner also copies the new config: `mkRoot` in test-runner.test.mjs, the MM2 root (about :64) and MM9 root (about :426) in runtime-map.test.mjs. Report these as existing-test edits.
5. Docs: one sentence in README.md "Tests" naming the config path. One "Windows" bullet in apps/desk/README.md "Known limits": the resolver cause (marked inferred), the 16 skipped files, live-feel still runs. One Windows line in apps/bench/README.md "Install, run and test": not supported, the four files and causes. No owner name, no absolute home path.
6. `npm run map`; commit docs/code-map.md.

**Tests** (only these four, in test-runner.test.mjs, each with `// req:` directly above its check)
- One new fixture root: the copied runner, both config modules, `apps/bench/.ext/pi-web-access/`, and a body at every listed path AND every real `apps/desk/test/*.test.mjs` / `apps/bench/test/*.test.mjs` in REPO not listed. Each body writes `<PROBE_OUT>/<rel with "/" replaced by "__">.ran` and prints PASS.
- Two runs of that root, each `node --import <pathToFileURL(force).href> <root>/scripts/test.mjs` through run()'s env (TEMP/TMP needed: forced win32 os.tmpdir() reads TEMP). `force-win32.mjs` and `force-linux.mjs` in TD each hold `Object.defineProperty(process, "platform", { value: "<p>" })`. Pass the preload in argv, never NODE_OPTIONS, so children keep their real platform. Both runs on every host; no platform skip.
- R-1380 (win32 run): the list is non-empty; every listed path's line is SKIP and includes `WINDOWS_SKIPS[path]`; no listed marker exists.
- R-1382 (win32 run): every unlisted desk or bench path's line is PASS and its marker exists.
- R-1381 (linux run): every listed path's line is PASS and its marker exists.
- R-1383: every key matches `^apps/(desk|bench)/test/[^/]+\.test\.mjs$` and exists in REPO; the list is non-empty.

**Order.** Commit 1: config, rows, tree outline, tests and fixture copies, runner unwired; paste R-1380's FAIL line. Commit 2: the runner wiring, docs and map.

**Wrong code to try.** Break the code, never the assertion; each must turn the named check red. W1 predicate ignores the platform: R-1381. W2 whole-app prefix skip on win32: R-1382. W3 runner never reads the list: R-1380. W4 dropped or generic reason: R-1380. W5 SKIP printed but the file still spawned: R-1380. W6 list gains `packages/nana-pack/tests/review-ledger.test.mjs`: R-1383. W7 a listed path misspelled: R-1383.

**Done.** Four checks green on macOS; R-1380 red on commit 1; W1 to W7 each red. `npm run test:locked` green. `npm run map:check` and `npm run readme:check` exit 0. Desk and bench labels and counts match macos-baseline.txt. Do not push; the seat reads the Windows leg.

**Report (≤10 lines):** VERDICT; commits; R-1380's red line from commit 1; W1 to W7 with the check each turned red; existing-test edits; suite summary line with check count; map and readme exit codes; anything not done.