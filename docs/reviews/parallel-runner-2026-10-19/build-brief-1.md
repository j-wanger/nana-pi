# parallel-runner: build brief 1

**Builder:** a Claude Sonnet subagent in `~/nana-pi-wt/parallel-runner`, branch `feat/parallel-runner`, created from main at or after 4be0b79 (win-leg-blocking has landed). **Class:** gate. Read `docs/reviews/parallel-runner-2026-10-19/must-meet.md` first. Use rows R-1470 to R-1477 only.
**Rules:** run single test files only, never the full suite; the seat runs it. Do not push. Do not edit `HANDOFF.md` or `docs/sessions/`.

**Change**
1. REQUIREMENTS.md: add R-1470 to R-1477 to the FEAT-031 table as `planned`; flip each to `implemented` with its test title once it passes. Bump the R-291 leaf total in `packages/nana-pack/tests/requirements-tree.test.mjs` by 8 (three spots). Run `npm run req:tree`; commit `docs/requirements-tree.md`.
2. New `packages/nana-pack/lib/test-runner-config.mjs`: six-tag header, `@effects none`, named exports `JOBS_FLAG`, `SUITE_JOBS` (4), `SUITE_JOBS_ENV`, `RUN_ALONE` (frozen; the paths and reasons in must-meet.md), each with its provenance line.
3. `scripts/test.mjs`:
   - Parse `--jobs=N`. Refuse any other argument starting with `--jobs` (R-1477) before collecting or spawning anything.
   - jobs=1: code path and output exactly as today.
   - jobs>1: a pool of N over the non-alone files in collection order; a freed slot takes the next file at once, not in batches. One `process.stdout.write` per file block (verbose output, result line, `      |` excerpt) when the file ends. Alone files run one at a time after the pool drains.
   - Turn `active` and `activeFileTmp` into sets; `cleanup()` handles all of them.
   - Coverage position stays the collection index. Print WARN lines and `failed:` in collection order.
   - Reap the self-test pipe holder only after the fixture that spawns it ends. Today's `if (fx) reapPipeHolder()` races in a pool (must-meet.md).
   - Keep the WINDOWS_SKIPS fallback in the skip check. Update the header's @inputs and @outputs.
4. `scripts/test-locked.mjs`: with no filter and no `NANA_SUITE_TEST_COMMAND`, pass `test -- --jobs=<NANA_SUITE_JOBS if set and not empty, else SUITE_JOBS>`. Nothing else changes. Update the header.
5. Existing-test edits, to be reported: `mkRoot` in `test-runner.test.mjs`, and the MM2 and MM9 roots in `runtime-map.test.mjs` (MM9 copies test-locked too), also copy the new config.
6. README "Tests": one paragraph, as must-meet.md says. Run `npm run map`; commit `docs/code-map.md`.

**Tests** (only these; `// req:` directly above each check; import every name, never a literal):
- New `packages/nana-pack/tests/test-runner-parallel.test.mjs`. Its `mkRoot` copies the runner plus each `packages/nana-pack/lib/*.mjs` the runner's own import lines name, read from its source. Fixtures write `{start,end}` JSON to `PROBE_OUT`; overlap comes from those intervals. Where overlap is required, sleep 1 s or more, for Windows CI start-up skew.
  - R-1470: files a (3000 ms), then b, c, d (1000 ms each). At `--jobs=2` and `--jobs=3`, max overlap equals N. At `--jobs=2`, c starts before a ends.
  - R-1471: a mixed root where each file sleeps 500 ms: PASS, red with more than 20 FAIL lines, WARN, all-SKIP, silent, signal death, and `apps/bench/test/study-tasks.test.mjs` with no `.ext` (a declared SKIP on every platform). Add `--self-test`. Run it with no flag and with `--jobs=3`; the parallel run must overlap. Compare per-file blocks with seconds stripped, as a multiset. Compare exactly: totals, WARN lines, the `failed:` line, the self-test line and the exit code.
  - R-1472: `--verbose --jobs=2`, two files printing 40 tagged lines 25 ms apart. Then plain `--jobs=2`, two overlapping red files each printing 25 tagged FAIL lines. Each file's lines must be contiguous and sit with its own result line.
  - R-1473: the fixture config is `export *` from the real config plus a local `RUN_ALONE` naming one of four 1000 ms files; run at `--jobs=3`.
  - R-1474: read the real config: each path matches a collected test location, exists, and has a non-empty reason.
  - R-1475: two hang files with grandchildren, as in case G. Both pids must appear.
  - R-1477: five bad forms; a marker file must stay absent.
- `test-locked.test.mjs`, R-1476: the existing `npm_execpath` capture, with no lock held and a 10 s timeout. Run with NANA_SUITE_JOBS deleted from the env, set to "", and set to `String(SUITE_JOBS + 1)`.

**Order.** Commit 1: rows, config, tests and fixture copies, with the runner unwired; paste one red line per row. Commit 2: the wiring, README and map.

**Wrong code to try** (break the code, never the assertion): W1 pool size stays 1 → R-1470, R-1472, R-1473, R-1475. W2 N+1 slots → R-1470. W3 everything starts at once → R-1470. W4 live verbose streaming at jobs>1 → R-1472. W5 batches of N → R-1470. W6 RUN_ALONE ignored → R-1473. W7 an alone file only waits for a free slot → R-1473. W8 cleanup kills only the last child → R-1475. W9 counts read from a shared buffer → R-1471. W10 SKIPs dropped at jobs>1 → R-1471. W11 `--jobs=0` taken as 1 → R-1477. W12 test-locked adds `--jobs` to filtered runs → the existing R-627 check. W13 NANA_SUITE_JOBS ignored → R-1476. W14 a RUN_ALONE path misspelled → R-1474.

**Done.** All checks green on macOS. Every row red on commit 1. W1 to W14 each red. `test-runner`, `runtime-map`, `test-locked` and `test-runner-parallel` green as single files. `npm run map:check` and `npm run readme:check` exit 0.

**Report (10 lines at most):** verdict; commits; one red line per row from commit 1; W1 to W14 with the check each turned red; existing-test edits; each single-file run's summary line; the map and readme exit codes; what was not done.
