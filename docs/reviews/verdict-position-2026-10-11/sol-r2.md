## MUST

1. **`packages/nana-pack/bin/review-round.mjs:434` — repeated non-plain first and final lines bypass the first-line grammar.**

   The code uses value equality to decide whether the first and final lines are different:

   ```js
   if (first !== final && carries(first)) {
   ```

   Separate physical lines with identical text compare equal. The parser therefore skips the required plain-first-line validation.

   Real `admit()` and `complete()` probes recorded `LAND` for all four outputs:

   ```text
   # VERDICT: LAND
   body
   # VERDICT: LAND
   ```

   The same failure occurs with repeated quoted, indented, or bold verdict lines.

   This leaves the first round-one finding partially open and violates both requirement rows. The first line remains non-plain even when its text equals the final line.

   **Smallest fix:** use `nonblank.length > 1` instead of `first !== final`. Add repeated-text regressions for the four non-plain forms.

## SHOULD

None.

## NOTE

- The configured look-alike now folds correctly before and after normalization.
- Every configured table entry reaches its target in the invariant test.
- The requirements evidence now cites canonicalization and refusal coverage.
- The configuration provenance now describes all entries without omitting Cherokee.
- The README explicitly documents ignored middle verdicts.
- The focused ledger suite passed.
- Seat acceptance passed 72 of 72 cases.
- The local corpus matched all 338 files, with zero prototype mismatches.
- The code-map check passed with zero problems.
- The README check passed with zero problems.
- The committed mutation run reports 17 of 17 mutations red.
- No additional rejection-to-LAND path appeared beyond the declared residuals.
- The external corpus was not rerun from this immutable checkout.

**Score: 8/10.** The prior security-sensitive paths are fixed, but one equality error still bypasses the required first-line grammar.

VERDICT: SEND-BACK
