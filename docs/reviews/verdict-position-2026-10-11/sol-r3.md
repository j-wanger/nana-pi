## MUST

1. **`docs/reviews/verdict-position-2026-10-11/seat-mutate.py:23,30` — the mutation runner no longer applies all 17 mutations.**

   Both anchors still require the removed `first !== final` condition. The current source uses `nonblank.length > 1`.

   Anchor inspection finds zero matches for both mutations. The runner would report two `ANCHOR` failures, reach at most 15/17 red, and exit nonzero.

   Therefore, `seat-mutate-output.txt:19` and `builder-report-5.md:5-7` are stale. They cannot have been produced by the committed runner against the reviewed tip.

   **Smallest fix:** update both anchors and replacements for the positional condition. Rerun the mutation script and commit its truthful output.

## SHOULD

None.

## NOTE

- The round-two product finding is closed at `packages/nana-pack/bin/review-round.mjs:434`.
- Separate identical lines now trigger plain first-line validation by position.
- The four identical marked regressions record empty verdicts.
- Identical plain lines and a single marked final line still record LAND.
- R-969 and R-1010 each contain one `shall`, and their cited tests pin the changed behavior.
- The focused ledger suite passed.
- Seat acceptance passed 77/77 cases.
- The in-checkout corpus matched 338 files with zero prototype mismatches.
- The title-coverage check reported zero gaps.
- I found no additional rejection-to-LAND path beyond the declared residuals.
- The external yokai-world corpus and full locked suite were not rerun.

**Score: 9/10.** The parser fix is sound, but the committed mutation evidence is not reproducible at this tip.

VERDICT: SEND-BACK
