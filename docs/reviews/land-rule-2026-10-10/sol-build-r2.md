## MUST

1. **Select the last line carrying `VERDICT:` before validating its shape.**  
   `packages/nana-pack/bin/review-round.mjs:415` filters for line-leading verdict labels while searching backward. This contradicts `REQUIREMENTS.md:433`, which requires the last line carrying `VERDICT:`.

   I reproduced a bypass using the lane’s own commands and a scratch `HOME`:

   ```text
   VERDICT: LAND
   Correction: VERDICT: SEND-BACK
   ```

   The ledger recorded `LAND`, and `nana-land merge` landed the revision. A reviewer’s final rejection can therefore be masked.

   The cited test at `packages/nana-pack/tests/review-ledger.test.mjs:195-199` covers two line-leading labels, but not a later prose-prefixed label.

   **Smallest fix:** first select the final physical line containing the bounded `VERDICT:` token. Then apply the strict whole-line grammar. Record `null` when that final line is malformed. Add this exact regression to the cited test and seat acceptance script.

## SHOULD

1. **Refresh the final mutation evidence.**  
   `docs/reviews/land-rule-2026-10-10/seat-mutate-output.txt:5,17` records one skipped mutation and `14/15 red`. The current runner’s repaired anchor at `docs/reviews/land-rule-2026-10-10/seat-mutate.py:13` now finds the mutation.

   I ran that mutation independently. Its named lock test failed as intended.

   **Smallest fix:** rerun the current mutation runner and replace the stale output with the resulting `15/15 red` record.

## NOTE

- Both seat verification scripts passed with zero gaps or mismatches.
- The locked suite passed: 132 files passed, one skipped, with 6,706 checks passed.
- The land tests passed all 51 checks.
- Requirements tree, code map, and README checks passed.
- The shared working sections are byte-identical.
- The annotated-tag fix, version-two cutover, locked final reading, snapshot checks, canonical names, CRLF parsing, and exemption removal behaved as intended.
- The checkout remained clean.

**Score: 8/10.** The core land enforcement is strong, but the reproduced verdict-selection bypass can land a revision after a reviewer’s final rejection.

VERDICT: SEND-BACK
