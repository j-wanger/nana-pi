Feature: FEAT-039 · See the product and its decisions in one report

Lane first-look. Class: ordinary. Builder: pi-worker (small lane). Build session 2, on the tip of build 1.

The plan of record is still `docs/reviews/first-look-2026-10-29/plan.md`. Build 1 met must-meets 2 to 4. Must-meet 1 is not met for its diff.

## What the seat saw

The seat ran build 1 for real in a scratch clone, with one heading changed in `scripts/product-report.mjs` ("Needs you" to "Needs your call") and `PW_ROOT` set to the main checkout. The four screenshots were right. `accessibility-diff.txt` was 8.6 MB and 116,165 lines. It is not a diff: for every view and every feature anchor it prints the whole "Before" tree, then the whole "After" tree. The one changed heading is on line 208, among 116,000 unchanged lines.

## The fix

1. **A real diff (R-3040).** For each view, write only the lines that differ between the before and after trees, as unified hunks with a few lines of context, under the view's heading. Leave out a view whose trees are equal, and end with one line naming how many views changed and how many did not. With the commit, date and working-tree lines left out, a lane that changes one heading must give a diff of a few lines. Use a small line diff in the script; add no dependency.
2. **Pin it.** The R-3040 test feeds the fake browser two trees that differ in one line, across two views, one of them equal. It asserts that the diff holds that line's before and after, names the changed view, leaves out the equal view, and is under a stated line count. Name that count in `scripts/first-look-config.mjs` with its reason.

Numbers that must not move: the four screenshots and their widths; the sealed list of page-shaping files; the seat guide's thirteen rules.

After the suite is green, run the command once for real in a scratch clone of the tip with one product-report heading changed, as above, and report the diff file's size, its line count and the changed lines it holds.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

The rows stay `implemented` with backticked `file::title` evidence. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green.

Report: the new test title; the real run's diff file in full if it is under 60 lines; each departure from the Precedent; every existing test you changed.

## Precedent

- `scripts/first-look.mjs`: build 1's tree capture and diff writer, which this build replaces.
- `packages/nana-pack/tests/first-look.test.mjs`: build 1's fake browser and the R-3040 test.
