# Build review — 6/10

## MUST

1. **`docs/product-report/assess-brief.md:12` — the unassessed refresh procedure cannot produce a schema-valid candidate.**  
   The required `id` field is omitted from the candidate instructions. An unassessed packet has `assessment: null`, so there is no existing object from which to recover it. The test manually adds the field at `packages/nana-pack/tests/product-report.test.mjs:328`, masking the guide defect.  
   **Smallest fix:** instruct users to copy `packet.feature.id` into the candidate’s `id` field, then test the documented procedure.

2. **`REQUIREMENTS.md:1502-1504` — three rendered-view rows overclaim their cited tests.**  
   The capability test at `packages/nana-pack/tests/product-report.test.mjs:101` does not assert product-view links or status bars. The feature test at line 103 does not assert every purpose, exact shared rows, sharing features, counts, or bars. The requirement-row test at line 128 does not associate every value with its card or pin the smaller monospace and phone-wrapping clauses. Removing those presentation details would leave the cited tests green.  
   **Smallest fix:** strengthen DOM assertions per rendered card, add stylesheet or computed-style coverage, and cite every test that pins each clause. Otherwise mark the rows `untested` or split them.

3. **`REQUIREMENTS.md:1509` — staleness coverage does not pin the full row.**  
   The tests at `packages/nana-pack/tests/product-report.test.mjs:363-385` cover purpose, feature status, and an own/shared move. They do not make the suite fail when a row is added, removed, or has only its fingerprint changed. The separate seat verifier covers these cases, but it is not collected as requirement evidence.  
   **Smallest fix:** port the added, removed, requirement-text, and row-status cases into the collected product-report test and cite their titles.

4. **`REQUIREMENTS.md:1515` — the cited schema test does not reject schema violations.**  
   The evidence cites only the valid-store test. The actual invalid-schema matrix is a different test, carrying the marker but absent from the evidence cell.  
   **Smallest fix:** cite `rejects every closed-schema and uniqueness violation`, after confirming each schema clause is represented.

5. **`REQUIREMENTS.md:1517` — packet completeness and determinism are under-tested.**  
   At `packages/nana-pack/tests/product-report.test.mjs:322-331`, the test checks two named packets and compares only one file across runs. It does not compare the complete filename set against every stale or unassessed feature, nor compare every packet byte-for-byte. An implementation emitting only those sampled packets could pass.  
   **Smallest fix:** derive the expected filenames from the model, compare the exact directory listings, and compare every corresponding file.

6. **`REQUIREMENTS.md:1518` — malformed-kind refusal is not pinned.**  
   The collected cases cover an invalid date and malformed title, but not an otherwise valid entry with an unknown kind.  
   **Smallest fix:** add an unknown-kind fixture and require refusal with its source line named.

## SHOULD

1. **`scripts/product-report.mjs:255` — issue cards display an `undefined` status pill.**  
   The issue renderer reuses the row renderer, but violated rows are mapped without `status`. The page therefore creates `status-undefined` instead of showing `violated`.  
   **Smallest fix:** include `status: row.status` in the issue model and assert each issue card renders the violated pill.

## NOTE

- The generated page completed successfully and contained one data script.
- The real report showed 27 current, 11 out-of-date, and one unassessed feature.
- Packet generation produced the expected 12 files on this revision.
- The 38 migrated assessments validate against historical git data.
- Assessment prose contained no ASCII digits.
- The focused product test passed 46 checks.
- The seat report verifier passed with zero mismatches.
- The title-coverage verifier passed with zero gaps.
- README, requirement-tree, trace, frontier, and ask-parser checks passed.
- Every new requirement row contains exactly one `shall`.
- I did not run `seat-mutate.py`.

VERDICT: SEND-BACK
