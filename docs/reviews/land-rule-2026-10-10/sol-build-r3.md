## MUST

1. **Require the verdict to be the final non-whitespace line.**  
   `packages/nana-pack/bin/review-round.mjs:415` searches backward for any bounded token, including tokens inside a later fenced example.

   I reproduced:

   ```text
   VERDICT: SEND-BACK
   ```
   ```text
   VERDICT: LAND
   ```

   The parser records `LAND`. A rejected revision remains landable.

   A Unicode look-alike final label also leaves an earlier `LAND` effective. Trailing blank lines work correctly, and output without any verdict records `null`.

   **Smallest fix:** select the final non-whitespace physical line, then apply the strict grammar. Update R-969 and add fenced-block, look-alike, trailing-whitespace, and absent-verdict regressions.

2. **Reject Unicode prose prefixes.**  
   `packages/nana-pack/bin/review-round.mjs:419` uses ASCII `\w` in the strict prefix check. It therefore accepts Unicode prose as punctuation.

   I reproduced:

   ```text
   拒否: VERDICT: LAND
   ```

   The parser records `LAND`, contradicting R-1010’s prose-prefix rule.

   **Smallest fix:** use Unicode letter and number classes with the `u` flag, or explicitly allow only supported markdown prefix marks. Add this case to `packages/nana-pack/tests/review-ledger.test.mjs:207`.

## SHOULD

None.

## NOTE

- Focused land tests passed: 51 checks.
- Focused review-ledger tests passed: 152 checks.
- Requirements-tree and code-map checks passed.
- The refreshed evidence records 16/16 red mutations and zero seat acceptance gaps.
- The checkout remained clean.
- The round-two correction itself works for ASCII prose-prefixed verdicts and indented quotations.

**Score: 7/10.** The land mechanism remains strong, but two parser paths can still turn malformed review output into authorising LAND records.

VERDICT: SEND-BACK
