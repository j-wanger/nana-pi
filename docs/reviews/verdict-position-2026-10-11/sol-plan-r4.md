## MUST

None.

## SHOULD

None.

## NOTE

- **Round-3 branch gap closed.** `docs/reviews/verdict-position-2026-10-11/CHANGE.md:90-103`; `seat-proto.mjs:5-27`  
  Every detection path uses the canonical form. Raw grammar matching still controls acceptance.  
  U+200B and Greek-look-alike first-line rejections both overrode a final LAND in the probe.

- **Default-ignorable gap closed.** `docs/reviews/verdict-position-2026-10-11/CHANGE.md:90-95`; `seat-proto.mjs:5-6,59`  
  The prototype removes `Default_Ignorable_Code_Point`, including U+034F. The CGJ rejection probe returned empty.

- **BOM note closed.** `docs/reviews/verdict-position-2026-10-11/CHANGE.md:88-89`; `seat-proto.mjs:12,60`  
  One leading BOM is removed. The BOM-prefixed supported verdict returned LAND.

- **Corpus claim reproduced.** `docs/reviews/verdict-position-2026-10-11/CHANGE.md:39-53`; `seat-proto.mjs:30-53`  
  The ledger run produced 265 final, 53 first, 12 agreeing, and 8 empty results with zero mismatches.  
  Yokai-world at `c4f3f2e` produced 74 accepted first-line outputs and 2 empty outputs.

- **Residuals are explicit.** `docs/reviews/verdict-position-2026-10-11/CHANGE.md:109-114`  
  The declaration names prose without “verdict,” uncovered look-alikes, middle-only labels, deliberate prose refusals, and runtime Unicode-table dependence.

**Score: 10/10.** Every round-3 finding is closed in the declaration and demonstrated by the prototype.

VERDICT: LAND
