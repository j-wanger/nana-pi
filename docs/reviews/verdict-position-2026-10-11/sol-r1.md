## MUST

1. **`packages/nana-pack/bin/review-round.mjs:433-435` — the final-line branch accepts a non-plain first line.**  
   R-969 requires the first line to begin with plain `VERDICT: ` and carry no marks. The code validates it with `finalGrammar`, which permits marks and indentation. Direct probes recorded LAND for quoted, marked, indented, and bold first lines followed by a final LAND. This also contradicts the README’s fail-closed description. Use `firstGrammar` for the first-line agreement check. Add regression cases for these four shapes with an agreeing final LAND.

2. **`REQUIREMENTS.md:433` — R-969’s implemented evidence does not pin its canonicalization clauses.**  
   The two R-969-tagged checks cover accepted grammar, scores, BOM handling, and line endings. NFKC, default-ignorable removal, look-alike folding, and canonical selection are exercised only by the R-1010-tagged refusal check. Add an R-969 marker and evidence citation to the corrected refusal test, then confirm its mutations fail that test.

## SHOULD

1. **`packages/nana-pack/lib/verdict-config.mjs:10-15` — the provenance omits part of the configured vocabulary.**  
   The reason names Greek and Cyrillic letters, but the table also contains Cherokee letters. Name every script represented, or describe the table simply as selected visual look-alikes.

## NOTE

- The review-ledger suite passed completely.
- Seat acceptance passed 64 of 64 cases and matched all 338 locally available corpus files.
- The title-coverage check reported zero gaps.
- The code map reported 245 modules and zero problems.
- The README checker validated 639 claims with zero problems.
- Both requirement rows contain exactly one `shall`.
- R-1010’s cited tests pin malformed selections, conflicting first and final lines, and later verdict mentions.
- The README’s ordinary examples match the parser.
- No undeclared real corpus refusal appeared; the eight middle-only verdicts remain the declared compatibility boundary.
- The HANDOFF and session claims match the available evidence, including the nine historical empty records.
- The cross-repository 76-file run was not repeated from this immutable checkout.

**Score: 7/10**

VERDICT: SEND-BACK
