## Score: 8/10

All round-one findings are closed, but the proof still accepts a ledger that differs from the approved render.

### MUST

1. **The proof accepts reordered governed rows.**
   - `docs/reviews/req-tree-2026-10-09/prove.mjs:150-160`
   - The proof validates R-287–R-294 individually, then ignores every positional mismatch whose expected line contains one of those IDs.
   - I swapped the complete R-292 and R-293 ledger lines on a scratch copy.
   - The proof exited 0 and reported every physical line accounted.
   - The tree test also exited 0 because row compression hides this order change.
   - This permits the ledger to differ from the approved `tree-b.json` row order.
   - **Smallest fix:** Permit only explicitly approved cell differences, then compare each complete row at its expected position. Add this swap attack to the acceptance script.

### NOTE — round-one closure

- The complete heading-array comparison now rejects an undeclared heading.
- Duplicate `Status:` and `Also applies:` lines are collected and rejected.
- Every ID from every sharing line is validated.
- The field checker derives all expected data from the parsed ledger.
- It no longer calls the renderer or its field and compression helpers.
- The missing-lister fixture now fails.
- The governance sentence now assigns statuses only to features.
- The review-record exception now reconciles the declared allowlist.

### NOTE — checker attacks

- I disabled each R-292 clause independently in a scratch clone.
- Unknown, duplicate, retired and same-home mutations each made the test exit 1.
- Disabling lifecycle grammar validation made the test exit 1.
- Disabling the proposed-or-retired empty-feature check made the test exit 1.
- Disabling the independent outline status check made the test exit 1.
- Disabling the independent shared-index check made the test exit 1.
- The real tree test passed all 67 checks.

### NOTE — proof, outline and scope

- The requested proof passed on the real ledger.
- The seat script printed every expected result.
- The independent parser found 67 headings and 38 feature statuses.
- It found 113 links over 95 shared rows.
- The shared index exactly matched the ledger and its required ordering.
- The map and README checks passed.
- The frozen inputs remain unchanged after the inputs revision.
- The implementation files and declared review records remain within the amended scope.
- The working tree remained clean.
- My locked-suite run reached 58 passing files before the review timeout.
- The committed builder evidence records 132 passing files, one skipped file and 6,630 passing checks.

VERDICT: SEND-BACK
