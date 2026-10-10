## Score: 6/10

All round-one and round-two findings are closed, but two contract-level checks remain defeatable.

## MUST

### 1. R-291 does not enforce exact outline equality in the suite

**Location:** `packages/nana-pack/tests/requirements-tree.test.mjs:31`

The test validates known fields individually, but never compares the committed outline with `actual.outline`.

On a scratch copy, I appended an extra line to the outline. The requirement-tree test still exited 0. The CLI check correctly exited 1.

I also changed the renderer to emit `Purpose: MUTATED`. The requirement-tree test still exited 0.

Therefore, the suite does not enforce R-291’s requirement that the committed outline equal the rendered outline.

**Smallest fix:** Add a test marked for R-291 that asserts `map === actual.outline`. Retain field tests for diagnostic coverage.

### 2. The byte proof accepts unaccounted trailing bytes on new rows

**Location:** `docs/reviews/req-tree-2026-10-09/prove.mjs:90-94`

The exception for R-287–R-291 compares only the ID and Requirement cells. It then accepts the entire physical line.

On a scratch copy, I appended `UNACCOUNTED-BYTES` after R-291’s closing pipe. The proof still exited 0 with its normal success summary.

The approved design says every physical line must be accounted for. Flexibility in newly authored status and evidence cells does not permit bytes outside the canonical four-cell row.

**Smallest fix:** Parse each new row as exactly four canonical cells with no trailing content. Require the declared `implemented` status and validate the evidence cell. Add this attack as a negative proof fixture.

## NOTE

### Previous findings

All eight substantive findings from rounds one and two are closed:

- Ordinary and intervening ATX headings now act as boundaries.
- Unrelated peer headings close hierarchy state.
- G-row prefixes survive rendering.
- Parent counts aggregate descendants.
- Two-ID runs survive compression and expansion.
- Tables require a delimiter and contiguous rows.
- SETEXT headings act as boundaries.
- The committed outline contains all 1,009 IDs, with none missing or extra.

Disabling each R-287 through R-290 checker made its test red. Disabling the R-291 renderer behavior did not, as described above.

### Byte and scope evidence

The canonical proof passed with 1,004 preserved rows, five new rows, 125 blocks, 1,554 lines, and 64 mapped headings.

Independent comparison found all 1,004 original row lines byte-identical. Added IDs are exactly R-287–R-291, with no removals or duplicates.

Row, prose, blank-line, note-position, intro, and closing-block mutations all made the proof exit nonzero.

Frozen inputs are unchanged. Changed product files stay within the allowlist.

### Consumers and reader view

The trace rail passed with 1,009 rows and zero EARS failures. Requirement impact, map, and README checks passed.

The outline now reports aggregate parent counts and IDs. It is accurate and no longer shows misleading zero-row parents.

The declared HTML, link-definition, and indented-code limitations remain residual parser boundaries. The current ledger uses none.

VERDICT: SEND-BACK
