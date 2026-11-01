Feature: FEAT-043 · Measure memory outcomes

Lane outcome-meter. Class: ordinary. Builder: pi-worker (larger lane). Build session 3, on branch tip 8a46ea8f (main 8c665dcd).

Build 2's report flagged that consecutive W-sized windows conflict with the plan's sizing paragraph. The seat resolves it for the plan's sizing intent: warm-up exists only because the lookback is not yet full, so it is a prefix of exactly B interactions (the sealed lookback), not a whole window. After that prefix, windows of W interactions run consecutively; the last unfilled one prints `partial`. With the defaults (B 60, W 80), 233 interactions give the warm-up prefix, two closed windows and a partial tail of 13.

## Precedent

- `packages/nana-pack/lib/outcome-meter.mjs`
- `packages/nana-pack/tests/outcome-meter.test.mjs`

Report each departure.

## Build

1. Change the window rule to: a warm-up prefix of B interactions, then consecutive W windows, then a `partial` tail. The warm-up prefix never enters the pooled lines; items in it can still be earlier items for later repeats.
2. Update R-3310's test to pin the new boundaries: a fixture of B + 2W + k interactions (0 < k < W) prints one `warm-up` row, two closed windows and one `partial` row, and a repeat in the first closed window may match an item in the warm-up prefix. Show it red on the build-2 code, then green.
3. Update the plan-facing wording in the pack README and the REQUIREMENTS row text for R-3310 to say the same rule. Do not edit the plan, HANDOFF, session notes or known-bug files.

Privacy: unchanged from build briefs 1 and 2: synthetic fixtures only, no real transcripts, snapshot or load log, no model calls. Never write to `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`.

## Show your work

The red-then-green run of the R-3310 test. The locked full suite in the foreground (`npm run test:locked`).

## Done when

Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the deliverables check and `node scripts/identity-scan.mjs --root .`. Push and report the finished CI run for the new tip. A macOS desk event-loop timing failure in `apps/desk/test/changes-endpoint.test.mjs` is unrelated to this lane: rerun the failed job once and report it either way.
