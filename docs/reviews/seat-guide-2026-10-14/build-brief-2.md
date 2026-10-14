# Lane seat-guide — build brief 2 (2026-10-14 · feat/seat-guide · tip cac50d7)

**Builder: Claude Sonnet 5.5.** The seat's checks passed on build 1 (acceptance 52/52, titles 0 missing, the seat's
mutation runner 19/19 red with none surviving). An independent check found one gap. Fix only this; build brief 1's
rules all hold.

**R-1140: "hold no other bullet" is pinned only for top-level `- ` bullets.** `packages/nana-setup/tests/seat-rule.test.mjs:46`
counts a line as a bullet only when it starts with `- `. An indented sub-bullet (`  - Check the builder transcript every
turn.`) or a `* ` or `+ ` bullet leaves every check green, though it adds exactly the per-turn checking this lane exists
to stop. Change the bullet detection to `/^\s*[-*+]\s/` on the `\r`-stripped lines, keep the title exactly, and show it
red first: with that sub-bullet added under the third rule in the guide, the check must fail on the old detection's
fix and pass when you revert the guide. Do not change the guide, the rows or any other test.

## Done
`npm run test:locked` (0 failed); `node docs/reviews/seat-guide-2026-10-14/seat-titles.mjs 1` → `0 missing`;
`node docs/reviews/seat-guide-2026-10-14/acceptance.mjs > docs/reviews/seat-guide-2026-10-14/acceptance-output.txt 2>&1`
→ `0 mismatch(es)`. Commit, push. No CI wait is needed for this test-only change.

## Report
≤ 12 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit, the red you saw, the `test:locked` summary line,
the last line of each seat output.
