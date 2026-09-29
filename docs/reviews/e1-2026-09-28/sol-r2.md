## Ruling

1. **HIGH uniqueness — PARTIAL** (`catch-stats.mjs:74-105`). Components fix the chain regression, but over-merge bundled summaries. `t2c/astra-r1#5` joins distinct #2 and #3, wrongly making #3 duplicate; the unaudited l2 eight-row component has the same problem (`catch-judge.mjs:84` makes “subset of summary” non-transitive).
2. **MED path hints — FIXED** (`catch-stats.mjs:32-58`; `catch-ledger.mjs:180-191`). Old bias is measured. LOW carry: resolve `..` canonically rather than deleting segments.
3. **MED `match_confidence` — FIXED** (`catch-stats.mjs:161-174`; `PREREG.md:66-72`). It is conservative and probably undercounts explicit matches, but is honestly described—not calibrated confidence.
4. **LOW κ sample wording — FIXED** (`RESULTS.md:70`; `PREREG.md:76-78`).
5. **HIGH P1 reporting — PARTIAL** (`RESULTS.md:14-19,117`). It must read **P1: UNRESOLVED** outright. “Six lanes: YES” rests exactly at threshold on two semantic-disposition rows; one decision flips it, and matcher agreement is not reliability.
6. **HIGH position/model inference — FIXED** (`RESULTS.md:5-10`). The licensed conclusion now correctly leads.
7. Confirm-round and P3 interpretations are corrected (`RESULTS.md:22-27,138-145`).

**P4:** Do not strengthen it unconditionally. The t2c 3→2 change is itself caused by the #5 summary over-merge above. Readers may rely only on the scoped descriptive claim: this corpus detects no information beyond verdict—not that SCORE carries none generally.

Tests/build pass, but deterministic output can deterministically encode the clustering error.

**CARRY:** separate equivalence edges from summary/subset containment (or atomize bundled rows), rebuild all counts, state P1 simply UNRESOLVED, and retain the path-normalization caveat.

After that, this may land as **measurement tooling only**. Seeded-defect and clean-patch controls remain prerequisites before changing review practice, model choice, roles, or spend.

VERDICT: BLOCK
