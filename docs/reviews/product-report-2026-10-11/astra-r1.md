## Land review

Reviewed `0818b72..52c9954198b7680ff2a748a452c83e755295a47a`.

**Score: 6/10.** The implementation builds a usable report, but feature filtering misattributes requirements, several implemented clauses lack adequate tests, and the refresh instructions produce invalid candidates.

### MUST

**M1 — Feature filtering loses requirements from their owning feature.**  
`scripts/product-report.mjs:109–110`

The Requirements view deduplicates rows before filtering, assigning each row to the first feature mentioning it. Earlier shares therefore replace later ownership.

I executed the generated page’s bootstrap with a DOM stub and exercised the filter:

- Selecting `FEAT-009` hides its own `R-021`.
- Selecting `FEAT-001` shows that shared row instead.
- The repository contains **59 rows** whose first occurrence is a share rather than their home.

This also prevents later receiving features from finding shared requirements.

**Smallest fix:** select the feature’s rows before deduplication. Deduplicate globally only for “All.” Add event-driven filter tests covering an earlier receiver, the owner and another receiver.

---

**M2 — The implemented statuses still overclaim rendered-view coverage.**  
`packages/nana-pack/tests/product-report.test.mjs:77,101–145,361–385`

The brief explicitly requires page clauses to be pinned on rendered views. Significant gaps remain:

| Row | Missing proof |
|---|---|
| R-1013 | The provenance test inspects embedded JSON, not the visible commit, date and cleanliness text. |
| R-1014 | The cited test checks text presence, not capability identity, product-view links or displayed count/bar values. |
| R-1015 | Tests check some labels and element presence, but not actual counts, bar proportions or complete incoming/outgoing shares. |
| R-1016 | Requirement and evidence checks use a word set spanning the entire page. Words moved between cards or reordered can still pass. Phone-width wrapping is not exercised. |
| R-1018 | “Full body” checks likewise use page-wide word membership. They do not prove each ask retains its complete body in order. |
| R-1021 | Cited tests inspect model differences. They do not prove added/removed/changed rows and purpose/status changes appear in the rendered difference section. |
| R-1042 | The test matches source text with a regex; it never dispatches `hashchange` and observes render/scroll order. |

The seat acceptance script improves coverage, but does not close these gaps. Its stale-row check can find the row ID in the ordinary requirements list.

**Smallest fix:** use small fixtures with distinct values and assert exact text within each rendered card or difference section. Check numeric bar values, invoke control handlers, and execute the bootstrap for scrolling. Keep any remaining unpinned clauses out of `implemented`.

---

**M3 — Following the refresh guide omits a required field.**  
`docs/product-report/assess-brief.md:12–13`

Step 2 lists candidate fields without `id`. Step 3 replaces the existing object with that candidate. The closed schema requires `id`.

I generated the **12 refresh packets**, constructed a candidate from the listed fields plus `stamp`, and ran validation. It failed with:

> `features[0] has missing or unknown fields`

The guide also says only “replace,” although an unassessed feature has no existing entry.

**Smallest fix:** explicitly copy `packet.feature.id`; replace an existing assessment or append an absent one. Include a complete candidate example and test that exact documented recipe.

### SHOULD

**S1 — A “current” assessment recommends deferring the current priority.**  
`docs/product-report/assessments.json:3019`

The installation assessment recommends deferring Windows tests “until Windows use is planned.” The generated detail view labels this assessment **current**, despite the recorded requirement for Windows testing now.

The stamp correctly detects ledger changes; it cannot detect a changed owner decision outside those stamped fields.

**Smallest fix:** update this migrated recommendation before publication. Explain beside the badge that “current” means matching the stamped ledger, not independently rechecked against current decisions.

---

**S2 — Issues cards render empty status pills.**  
`scripts/product-report.mjs:257`

The `violated` projection drops `status`, but the shared row renderer requires it. All six Issues cards consequently receive an empty pill with `status-undefined`.

**Smallest fix:** preserve `status` in the projection and assert that each rendered Issues card displays `violated`.

---

**S3 — The history requirement is attributed to the wrong command.**  
`README.md:243`; `HANDOFF.md:43`

These passages say the report requires full history and a shallow clone refuses. Report generation does not call `validateStore`; historical `git show` verification happens in the suite’s store validation.

**Smallest fix:** document full history as a requirement for historical stamp validation, or deliberately add validation to generation and test that changed contract.

### NOTE

- All 22 new rows contain one `shall`; the trace check reports zero off-form rows. Clause coverage remains the separate problem in M2.
- Historical stamp reconstruction uses `git show` against the recorded commit. Own/shared marks, fingerprints, purpose and lifecycle status participate in validation.
- The migrated store validates. All **38 assessments** declare inferred migration provenance. ASCII-digit restrictions and the stamped-own-row `solid` rule pass.
- The report contains **27 current, 11 out-of-date and one unassessed** feature. The recorded migration residual is accurate.
- Text-node rendering, escaped embedded JSON and guarded prototype-like routes look sound within the stated threat model.
- Packet generation produced the expected stale/unassessed set. Existing tests passed determinism, non-empty-directory refusal and candidate round-trip checks.

### Verification

Passed:

- Product-report, ask-parser, frontier and requirements-tree tests.
- Seat acceptance: **0 mismatches**.
- Title coverage: **0 gaps**.
- Requirements trace, code-map check and README check.

Generated `/tmp/nana-land-review-product.html` and exercised its actual bootstrap and rendered views through a DOM stub. I did not perform a visual browser check or run the full suite.

The checkout remains unchanged. I did **not** run `seat-mutate.py`.

VERDICT: SEND-BACK
