# Lane runtime-map — build brief 2 (2026-10-17 · feat/runtime-map · tip c9cb60c)

Builder: Claude Sonnet 5, the same builder as build 1. One send-back, found by the lane's independent check on the
runner edit and confirmed by the seat's real measurement. Everything else in build 1 stands.

**The bug (blocks the feature).** `packages/nana-pack/tests/test-runner.test.mjs` case I (R-1270, MM1) fails whenever
its caller has `NODE_V8_COVERAGE` set: the test's `run()` helper copies `process.env`, and its `deleteKeys` never
removes `NODE_V8_COVERAGE`, so the fixture sees the caller's value where the check expects `undefined`. The measure
command sets that variable for every test file, so every real measurement ends red. Seat evidence, `npm run
map:measure` on c9cb60c: `FAIL  packages/nana-pack/tests/test-runner.test.mjs  38 pass, 1 fail` and `measure exit 1`
(the data file was still written). The same failure reproduces with
`NODE_V8_COVERAGE=<dir> node scripts/test.mjs packages/nana-pack/tests/test-runner.test.mjs`.

**The fix.** Add `NODE_V8_COVERAGE` to both `deleteKeys` lists in that test file, and add one run to case I where the
caller sets `NODE_V8_COVERAGE` and the fixture must see the same value (the title already promises "absent or set").
No runner change. Keep the title.

**Done.** `node scripts/test.mjs packages/nana-pack/tests/test-runner.test.mjs` green with and without
`NODE_V8_COVERAGE=<a temp dir>` set on the command; `seat-titles.mjs 1` → `0 missing`; the trace check. Same rules as
brief 1 (never the full suite or `map:measure`; the seat runs those). Commit with explicit paths, push. Report ≤ 8
lines.
