The tree matches the approved design, but two verification gaps prevent landing. One remains in the named r3 proof fix.

## MUST

### 1. The proof bypasses new-row validation when the row equals its placeholder

**Location:** `docs/reviews/req-tree-2026-10-09/prove.mjs:88–105`

**Evidence:** The equality shortcut runs before the new-row validation. The expected rows contain `untested | —`, so that exact combination bypasses the required status and evidence checks.

On a scratch copy, I changed R-291’s final cells to:

```text
| untested | — |
```

The proof exited **0**, printing its normal preservation summary. Trailing bytes, a fifth cell, `untested` with existing evidence, and empty evidence each correctly exited **1**.

This does not reopen the trailing-byte hole. It leaves the r3 fix’s explicit `implemented` and evidence requirements unenforced for the placeholder combination. The trace rail supplies separate protection, but the proof’s acceptance remains wrong.

**Smallest fix:** Validate every new row before the equality shortcut. Add the combined `untested | —` mutation for all five additions.

### 2. The suite ignores real-ledger purpose-placement violations

**Location:** `packages/nana-pack/tests/requirements-tree.test.mjs:27`; `scripts/requirements-tree.mjs:76–80,112–122`

**Evidence:** The real-ledger R-288 assertion checks only heading count and non-empty parsed purposes. Parsing can find a purpose after its table, while `checkPurposes` correctly rejects that placement. The test never asserts that rejection is absent.

On a scratch copy, I moved FEAT-001’s existing purpose below its complete table, immediately before FEAT-002:

- `checkTree` reported the R-288 violation.
- The rendered outline remained byte-identical.
- The complete requirement-tree test exited **0**, reporting `all passed`.

No excluded Markdown construct was involved. This contradicts the promised suite enforcement of “before any table or heading.”

**Smallest fix:** Assert that the real ledger has no structural problems, while retaining the row-specific diagnostics. Add this late-purpose mutation.

## NOTE

### 3. The preserved introduction overstates the remaining reserve

**Location:** `REQUIREMENTS.md:11`

The introduction still says R-287–R-299 “stay the reserve,” although this change consumes R-287–R-291. Eight IDs remain in that reserve, not thirteen.

This follows the approved instruction to preserve the introduction, rather than an undeclared builder edit.

**Smallest fix:** Obtain a narrow correction authorization and update the preservation expectation accordingly. At minimum, state the eight-ID balance explicitly at checkpoint 2.

## Tree and reader ruling

**The mapping is faithful.** My independent comparison found:

- Eight capabilities, 38 features and 21 subgroups.
- Every one of the 1,009 rows in its approved leaf, in approved order.
- All 1,004 original row lines byte-identical.
- Exactly R-287–R-291 added.
- No undeclared membership, label, purpose or parent changes.

The declared deviations are sound:

- Keeping all 22 G rows together preserves the shared engineering contract. The cross-references retain discoverability.
- R-285/R-286 belong with builder execution because they govern worker isolation.
- Flat subgroup IDs avoid identity changes when groups move.
- R-287–R-291 belong with requirement identity and traceability.

The purposes explain what the toolkit enables without claiming that every underlying obligation is satisfied. The builder feature explicitly distinguishes execution limits from semantic scope control.

The generated outline now reports correct aggregate counts and complete IDs, including G prefixes and two-ID runs. The dated section map accounts for 64 former headings: four Part headings and 60 numbered sections. Apart from the reserve statement above, I found no misleading count or section-map claim.

## R3 fixes and integration evidence

The restored R-291 equality assertion works:

- Appended outline text: **exit 1**.
- Renderer changed to emit `Purpose: MUTATED`: **exit 1**.
- Restored scratch copy: **exit 0**.

Checks run on the reviewed checkout:

| Check | Result |
|---|---|
| Preservation proof | 1,004 original rows; five additions; 125 blocks; 1,554 lines; 64 headings accounted |
| Requirement-tree test | Passed |
| Trace rail test | Passed |
| Trace report | 1,009 rows; 723 implemented/traced; zero EARS failures |
| `map:check` | 244 modules; zero problems |
| `readme:check` | 639 claims; zero problems |
| `req:rows` for the new script | Returned R-287–R-291 |
| Independent R-756 comparison | All 22 shared G Requirement cells equal |

Startup guidance still uses ID lookup. Existing ledger consumers remain heading-independent. Product changes stay within the declared allowlist, and frozen checkpoint inputs are unchanged.

I did not run the full suite. All mutations used scratch copies; the reviewed checkout remains unchanged.

## Accepted residuals and their price

- **HTML blocks/comments:** Low present exposure because the ledger uses none. Future use could make rendered visibility disagree with checked membership. The price is manual review or parser work before introducing them.
- **Link reference definitions:** Low present exposure. Future definitions can confuse the simplified block interpretation, causing incorrect boundaries or diagnostics. The price is a focused fixture and parser correction when needed.
- **Indented code:** Low present exposure. Future examples can disagree with the checker’s interpretation. The price is avoiding that syntax here or explicitly supporting it.
- **Regroups visible, not pinned:** Accepted as Jake’s decision 4. The price is mandatory human review of the outline diff; regeneration alone cannot establish authorization. Increment 2’s declared-feature control remains future work.
- **Wrong-feature placement:** Accepted as owner judgment. The price is navigation mistakes and potentially mis-scoped work, not lost requirement identity. Checkpoint 2 must judge meaning rather than treat green tests as approval.

Neither MUST finding is covered by these accepted residuals.

**Score: 7/10.** The migration and reader result are sound. Two small, reproducible verification holes remain.

VERDICT: SEND-BACK
