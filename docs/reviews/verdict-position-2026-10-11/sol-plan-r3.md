## MUST

1. **The final-line branch still permits an invisible first-line rejection to record LAND.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:53,65-66,79-86`

   This proposed output records `LAND`:

   ```text
   V​ERDICT: SEND-BACK
   Findings follow.
   VERDICT: LAND
   ```

   The final line selects the final-line branch. The first line does not carry the exact ASCII token because it contains U+200B.

   Unicode cleanup applies only when the first line is selected. It therefore does not protect the new first-line agreement check.

   The same gap accepts a first-line rejection using a folded Greek or Cyrillic letter.

   **Smallest fix:** normalize, remove invisible characters, and fold the first line before token detection in the final-line branch. If it then carries the bounded token, require a valid verdict line with the same word. Add zero-width and folded-letter regressions for this branch.

## SHOULD

1. **The invisible-character rule remains narrower than the original bypass class.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:83-86,90-92`

   Unicode category `Cf` closes the reported U+200B case. It does not include every default-ignorable character.

   U+034F COMBINING GRAPHEME JOINER is category `Mn`, survives NFKC, and permits this first-line fallback:

   ```text
   VERDICT: LAND
   V͏ERDICT: SEND-BACK
   ```

   **Smallest fix:** remove Unicode `Default_Ignorable_Code_Point` characters instead of only `Cf`. Alternatively, name non-`Cf` default-ignorables as a residual and pin one example.

## NOTE

- The malformed first-line rejection from round 2 is closed for an exact ASCII label. The final-line branch now requires the same valid word.
- The corpus accounting is internally consistent. The artifact contains 265 final, 53 first, 12 agreeing, and 8 middle-only unique paths: 338 total.
- The declaration separately accounts for 26 missing files, reconciling the ledger total of 364.
- The middle-only outputs and prose-suffix output are now explicit unsupported compatibility boundaries.
- The fold vocabulary now has a declared configuration module and provenance requirement.
- A BOM-prefixed first-line verdict remains a rare legitimate refusal because the plain grammar requires `VERDICT:` at column zero. Declare that residual or strip one leading BOM.
- Ordinary review prose containing the word “verdict” after a first-line LAND remains deliberately refused. This is conservative but may reject legitimate notes.
- The current checkout still contains the final-line-only implementation. This review assesses the revised declaration before build.

**Score: 7/10.** All four round-2 findings received direct revisions, but Unicode cleanup is applied to only one selection branch, leaving a rejection-masking path.

VERDICT: SEND-BACK
