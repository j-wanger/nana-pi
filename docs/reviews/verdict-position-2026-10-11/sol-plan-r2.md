## MUST

1. **A malformed first-line rejection can still record LAND.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:49-50,74-75`

   This output records `LAND` under the declared algorithm:

   ```text
   VERDICT: SEND-BACK 4/10 — blockers remain
   Findings follow.
   VERDICT: LAND
   ```

   The first line clearly rejects the change but fails the strict verdict-line grammar because prose follows the score. The valid final line therefore wins.

   **Smallest fix:** when the final line is selected, reject any verdict-like first line that is malformed or carries a different word. Add this exact regression case.

2. **The corpus declaration still contradicts itself and does not reconcile its totals.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:19-21,35-43`

   Lines 19–21 say no ledger output has its verdict only in the middle. Lines 40–42 say eight ledger outputs do.

   The stated categories also account for only 314 of 336 outputs:

   ```text
   249 + 53 + 12 = 314
   ```

   The declaration identifies eight middle-only outputs and one prose-suffix example, leaving thirteen outputs unexplained.

   **Smallest fix:** replace these claims with mutually exclusive categories totaling 336. Name every unsupported or unreadable category and remove the stale “never only in the middle” claim.

## SHOULD

1. **A zero-width character bypasses the later-verdict guard.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:76-81`

   NFKC preserves a zero-width space. This visually conflicting output therefore records `LAND`:

   ```text
   VERDICT: LAND
   V​ERDICT: SEND-BACK
   ```

   The declared residual covers omitted look-alike letters, not invisible separators.

   **Smallest fix:** remove Unicode default-ignorable characters before the secondary scan, or explicitly name this case as a residual and add a pinning test.

2. **The fold vocabulary is placed outside the declared configuration surface.**  
   `docs/reviews/verdict-position-2026-10-11/CHANGE.md:54-55,76-78`  
   `REQUIREMENTS.md:1470,1485`

   The plan puts a behavior-controlling vocabulary inside the parser. The standing engineering rows require vocabularies in a declared configuration surface without point-of-use literals.

   **Smallest fix:** export the fold map from a pack configuration module, retain its provenance there, and import it into the parser.

## NOTE

- The revised scope now correctly identifies the one changed existing expectation.
- The existing Greek-look-alike test remains empty as promised.
- The plain first-line grammar closes the backtick-quoted fallback found in round 1.
- The declared middle-only and prose-suffix refusals are acceptable compatibility boundaries once the corpus accounting is complete.
- The current checkout still contains the final-line-only implementation; this review assesses the declaration before build.

**Score: 5/10.** The revision closes both round-one examples, but one malformed rejection still authorizes LAND and the corpus evidence remains internally inconsistent.

VERDICT: SEND-BACK
