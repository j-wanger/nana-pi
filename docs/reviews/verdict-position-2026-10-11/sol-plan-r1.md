## MUST

1. **The first-line fallback restores the rejection-masking defect.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:52-59`

   This output records `LAND` under the proposed algorithm:

   ```text
   VERDICT: LAND 9/10
   Findings follow.
   ΕERDICT: SEND-BACK
   ```

   The final look-alike avoids `T`, leaving exactly `[S]`. The parser therefore accepts the stale first-line LAND.

   The land-rule review previously required final-line selection specifically to close this path. Calling it deliberate forgery does not make the land rule fail closed.

   The permitted backticks create a second masking form:

   ```text
   `VERDICT: LAND`
   This quoted format is wrong. The change must be sent back.
   ```

   The quoted first line matches the proposed grammar. The prose rejection contains no second token, so the ledger records LAND.

   **Smallest fix:** use a narrower grammar for first-line fallback. Accept the corpus-required plain form only, and reject code-wrapped or verdict-like later lines, including confusable labels. Preserve the existing Greek-look-alike regression.

2. **The test promise contradicts the proposed behavior.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:40-42,57-59`  
   `packages/nana-pack/tests/review-ledger.test.mjs:206-217`

   The declaration says every existing case still holds. Two existing cases cannot hold:

   - `VERDICT: LAND\nprose after verdict` currently records empty. The new first-line rule must accept this general shape to solve Yokai’s output.
   - `VERDICT: LAND\nΕERDICT: SEND-BACK` currently records empty. The declared residual says it will record LAND.

   A builder cannot satisfy both the declared design and unchanged test expectations.

   **Smallest fix:** list each changed expectation explicitly. Keep the look-alike case empty, and replace the generic trailing-prose rejection with accepted first-line review notes plus adversarial rejection prose.

## SHOULD

1. **Correct the corpus claim and state the compatibility boundary.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:19-21,63-67`

   I found 336 existing ledger-referenced outputs. The proposed grammar classifies 249 by the last line, 53 by the first, and 12 by both.

   Eight ledger-referenced reviews have a standalone verdict only in the middle, followed by a score. The requirements review corpus contains those examples.

   The named repositories also contain established shapes this grammar refuses:

   - `~/work-desk/docs/reviews/slice3-2026-09-16-sol-r2.md:69` uses a middle heading verdict.
   - `~/game-world/docs/reviews/design-2026-09-06/round-9.md:17` ends with `VERDICT: LAND — <reason>`.
   - `~/jev-research/docs/reviews/local-tool-judge-2026-09-19/contract3-astra-r1.md:4` uses a middle emphasized verdict.
   - Yokai’s current reviews use the intended first-line bare-score form.

   Strictly refusing historical shapes may be the safe choice. The declaration must not claim they do not exist or report zero disagreements without naming them.

   **Smallest fix:** publish corpus counts by shape, name all exceptions, and define which historical forms remain deliberately unsupported.

2. **Define “carries `VERDICT:`” normatively.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:35-36,52-53`

   The design defines a bounded token. Neither draft row includes that boundary.

   `XVERDICT: LAND` therefore “carries” the literal text under an ordinary reading, but the proposed implementation ignores it.

   **Smallest fix:** put the “not preceded by a letter, digit, or underscore” rule into the requirement text and add a tagged boundary test.

## NOTE

- Each proposed row contains exactly one `shall`.
- Both rows are table-testable once the token boundary and changed expectations are explicit.
- The bare-score addition matches the current Yokai review outputs.
- The `T == [S]` check blocks exact later corrections and quoted exact labels when first-line fallback is used.
- The final-line branch still rejects malformed final lines rather than extracting a leading LAND.
- The central first-line fallback is not safe enough to build as declared.

**Score: 4/10.** The plan fixes the observed compatibility failure, but knowingly restores a previously proven LAND-masking path.

VERDICT: SEND-BACK
