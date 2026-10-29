VERDICT: DONE

Commits:
- `cde7b037` — updated `REQUIREMENTS.md`, `packages/nana-pack/lib/ask-shape.mjs`, and `packages/nana-pack/tests/ask-shape.test.mjs`. R-3052 remains `implemented`.
- New test: `R-3052: ask bodies parse numbered indented issue questions and values`.
- Mutation pair: the old parser failed the new fixture with 1 group instead of 3 (exit 1); the fix passes (exit 0).
- Existing R-3052 assertions were updated for the new `default` field in question groups.

Issue 256 now parses as three questions. Its first Overview entry shows “When should the reader run?”, the full first default as “Seat recommends,” and the cost line; it also parses the other two questions.

Checks: `npm run test:locked` (0); `npm run map:check` (0); `npm run readme:check` (0); requirements trace (0); requirements tree (0); known-bugs check (0); identity scan (0). The working tree is clean. An initial standalone `product-report.test.mjs` run timed out at 60 seconds; the full suite passed it.

Suite summary: **234 files: 232 PASS, 0 FAIL, 2 SKIP; 8,677 checks passed, 0 failed, 44 skipped.**

Precedent departures: none. Not done: no first-look run was requested for this build.
