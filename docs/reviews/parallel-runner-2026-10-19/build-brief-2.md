# parallel-runner: build brief 2

**Builder:** a Claude Sonnet subagent in `~/nana-pi-wt/parallel-runner`, branch `feat/parallel-runner`, tip `d50de2f` plus the seat's commit of its pairs record. **Class:** gate. Rules as brief 1: single test files only, no push, no `HANDOFF.md` or `docs/sessions/` edits. Rows R-1470 to R-1479 only.

The seat's wrong-code pairs (`seat-mutate.mjs`, record `seat-mutate-output-d50de2f.txt`) went 24 of 27 red. The independent check holds with no MUST. Close these gaps; keep everything else as it is.

**1. M17 survived (deterministic): nothing checks the temp folder after a normal `--jobs` run.** With the pool keeping each finished file's temp root, 9 roots stay behind on every run. Add to R-1471's parallel run (or its own check under an existing row) an assertion that the run's temp folder holds no `nana-test` root afterwards. The `run()` helper already returns that folder.

**2. M15 survived (race): `failed:` and WARN lines print in completion order, not collection order, and no fixture forces an out-of-order finish.** Give R-1471's fixture an earlier failing file that sleeps longer than a later failing file, so the pool always finishes them out of order. The check then compares the `failed:` line (and WARN lines, if the fixture has one) with the serial run's, exactly.

**3. The independent check's finding 1: with `--jobs` above 1, a last file block over 64 KB loses the summary through a pipe.** `scripts/test.mjs` writes each block with one `process.stdout.write` and then reaches `process.exit` synchronously; a macOS pipe reader got 65,536 bytes and no totals line, WARN lines, `failed:` list or self-test verdict. The exit code stayed right. The serial path prints it complete. Fix it (set `process.exitCode` and return instead of `process.exit`, or wait for stdout to drain before the summary and exit), and add a check under R-1471 or R-1472: a fixture whose red file prints more than 64 KB, run with `--jobs=2` and its output read through a pipe, still ends with the totals line and the `failed:` list. Show it red on `d50de2f` first.

**4. M16 (race on the pipe-holder reap) stays a declared limit.** Do not try to force it; say in your report whether your change to item 3 affects it.

**Wrong code to try** (each must turn its named check red, then restore): the pool keeps finished temp roots; `failed:` in completion order; `process.exit` right after the last block write.

**Done:** the pool's three new or widened checks pass, each shown red first; `test-runner-parallel`, `test-runner`, `test-locked`, `runtime-map` and the three requirement tests pass alone; `npm run map:check` and `npm run readme:check` clean; one commit.

**Report** (at most 10 lines): VERDICT DONE or BLOCKED; the commit; each item's red-then-green evidence; files touched.
