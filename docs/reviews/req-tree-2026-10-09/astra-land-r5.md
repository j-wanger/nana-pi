The r4 findings are closed. Amendment A1 is sound, and the reviewed revision is ready to land.

## Findings

**No open MUST or SHOULD findings.**

### NOTE — R4 placeholder bypass closed

**Location:** `docs/reviews/req-tree-2026-10-09/prove.mjs:96–114`

New-row validation now decides acceptance before the equality shortcut. Invalid new rows report a failure and cannot fall through.

Independent scratch-copy tests:

- Each of R-287–R-291 changed to `untested | —`: **exit 1**.
- Trailing bytes, a fifth cell, and empty evidence, tested separately on all five rows: **exit 1**.
- Unmodified ledger: **exit 0**.

**Smallest fix:** None remaining.

### NOTE — R4 real-ledger structural check closed

**Location:** `packages/nana-pack/tests/requirements-tree.test.mjs:27`

The test now asserts that the real ledger has **zero structural problems**, while retaining individual diagnostics.

I moved FEAT-001’s purpose below its table in a scratch ledger and ran the actual test through its ledger-path override. It exited **1**, specifically naming FEAT-001’s missing timely purpose.

**Smallest fix:** None remaining.

### NOTE — Amendment A1 correctly repairs the reserve statement

**Locations:** `REQUIREMENTS.md:11`; `docs/reviews/req-tree-2026-10-09/amendment-A1.md:3–14`; `docs/reviews/req-tree-2026-10-09/prove.mjs:41–49`

A1 records the five consumed IDs and leaves R-292–R-299 as the eight-ID reserve. This is bookkeeping for the already-approved additions, not a new product decision.

The proof reads the amendment from the supplied immutable commit and requires a unique replacement. With the specified approved and amendment commits:

- Corrected ledger: **exit 0**.
- Original reserve wording restored: **exit 1**.
- Reserve changed to R-293–R-299: **exit 1**.

**Smallest fix:** No code change. Report A1 at checkpoint 2 as declared.

## Tree fidelity and reader result

The result matches the draft with only the declared deviations.

My independent comparison confirmed:

- **8 capabilities, 38 features, 21 subgroups.**
- Every approved leaf’s row membership and order match.
- All **1,004 original row lines remain byte-identical**.
- Exactly **R-287–R-291** were added.
- Capability and feature identities, labels and purposes match the draft.
- Subgroup labels, purposes and membership match; their IDs follow the declared flat numbering.
- All five frozen checkpoint inputs remain unchanged.

The deviations are sound:

- Keeping all 22 G rows together preserves the shared engineering contract.
- R-285/R-286 fit builder execution and role isolation.
- Flat subgroup IDs avoid renumbering when groups move.
- The five structural requirements belong in FEAT-028.

The introduction explains the hierarchy, its purpose, and how to maintain it. The outline accurately presents aggregate counts, parents and complete row IDs. The dated section map accounts for all **64 former headings**.

The purposes explain intended capabilities without claiming every underlying row is implemented. FEAT-006 explicitly separates execution limits from future semantic scope control. I found no remaining misleading count or section-map claim.

## R3 fixes and integration

The restored R-291 equality assertion remains effective:

| Scratch mutation | Result |
|---|---|
| Append text to committed outline | Exit 1 |
| Change renderer to emit `Purpose: MUTATED` | Exit 1 |
| Restore both files | Exit 0 |

Checks run against this checkout:

| Check | Result |
|---|---|
| Amended preservation proof | 1,004 originals; five additions; 125 blocks; 1,554 lines; 64 headings |
| Requirement-tree test | Passed |
| Trace rail test | Passed |
| Trace report | 1,009 rows; 723 implemented/traced; zero EARS failures |
| `map:check` | 244 modules; zero problems |
| `readme:check` | 639 claims; zero problems |
| `req:rows` for the tree script | Returned R-287–R-291 |
| Independent R-756 comparison | All 22 shared G Requirement cells equal |

The changed product files remain within scope. Startup guidance remains ID-based; ledger consumers remain functional.

I did **not** run the full suite. The seat still owns the locked pre-land run. Mutations used scratch copies; the reviewed checkout remains unchanged.

## Accepted residuals and their price

| Residual | Accepted price |
|---|---|
| HTML blocks/comments are unmodeled | Low current exposure; potentially hidden rows or misleading boundaries if introduced. Review or extend the parser before using them. |
| Link reference definitions are unmodeled | Low current exposure; future definitions can distort boundary detection. Require a focused fixture before introducing them. |
| Indented code is unmodeled | Low current exposure; examples could disagree with checked structure. Avoid that syntax here until supported. |
| Regroups are visible, not pinned | Accept the owner's decision 4. Human review must distinguish authorized regrouping from drift; regeneration does not establish authorization. |
| Wrong-feature placement is owner judgment | Accept navigation and scope-selection risk. Checkpoint 2 must judge meaning, not merely green checks. |

The fifth review round is the explicit exception requested here, not a precedent extending the normal cap. This ruling does not replace the owner's checkpoint-2 acceptance.

**Score: 9/10.** The migration is faithful, the named verification holes are closed, and the remaining limitations are explicit.

VERDICT: LAND
