## Score: 5/10

Round-one findings are closed for the tested cases, but the generated outline omits 74 row IDs and two structural rules remain weaker than their requirements.

## MUST

### 1. The outline silently omits 74 row IDs

**Location:** `scripts/requirements-tree.mjs:117-133`, `packages/nana-pack/tests/requirements-tree.test.mjs:86`, `docs/requirements-tree.md:16`

`compressRowIds` skips the second ID whenever a consecutive run contains exactly two IDs. It emits only `start`, then advances past both values.

My independent expansion found 74 omitted IDs across 37 leaf headings. For example, SUB-001 reports 13 rows but omits R-109, R-113, and R-801. FEAT-006 omits R-286 and R-966.

The R-291 test exercises runs of three IDs only. Comparing the committed outline with the same defective renderer cannot detect this defect.

**Smallest fix:** Emit both IDs or a range for two-item runs. Add a round-trip test proving every input ID appears exactly once after compression and expansion. Assert this across every real leaf heading.

### 2. R-287 accepts rows that are not in a Markdown table

**Location:** `scripts/requirements-tree.mjs:42-48`, `scripts/requirements-tree.mjs:59-78`, `packages/nana-pack/tests/requirements-tree.test.mjs:53-54`

The parser starts a table at the header but never ends it at a blank line, prose line, or invalid separator. It also accepts a header without a delimiter row.

I tested three fixtures: a row after prose, a row after a blank line, and a table without a separator. All returned no structural problems.

This leaves the “sit in a table” clause unenforced.

**Smallest fix:** Require the delimiter immediately after the header and accept only contiguous row lines. End the table at the first non-row line. Add all three negative fixtures.

### 3. SETEXT headings defeat R-287, R-288, and R-290

**Location:** `scripts/requirements-tree.mjs:16`, `packages/nana-pack/tests/requirements-tree.test.mjs:54-56`, `REQUIREMENTS.md:1167-1170`

The parser recognizes only ATX headings. I placed a SETEXT level-one heading after FEAT-001, then added a fresh table and row. `checkTree` returned no problems and attributed the table to FEAT-001.

SETEXT boundaries can also intervene before a purpose or close a capability without detection.

I disagree with carrying this as a residual. The implemented requirements say “heading,” not “ATX heading.”

**Smallest fix:** Recognize SETEXT level-one and level-two headings as boundaries. Alternatively, narrow the requirement rows to ATX headings before retaining `implemented` status.

## NOTE

### Round-one findings

- The ordinary ATX closing-heading attack is now red.
- The intervening level-four ATX heading attack is now red.
- The unrelated level-one ATX heading attack is now red.
- FEAT-033 now preserves the G prefix.
- Parent headings now show aggregate counts and “IDs: listed below.”
- Temporary code mutations disabling each R-287–R-291 implementation made its cited test exit nonzero.

### Byte proof and scope

- The canonical proof passed: 1,004 preserved rows, five new rows, 125 blocks, 1,554 lines, and 64 mapped headings.
- Mutating a row, prose, blank line, note position, intro, or closing block made the proof fail.
- Independent comparison found all 1,004 original row lines unchanged.
- Added IDs are exactly R-287–R-291, with no removed or duplicate IDs.
- The proof reads its frozen inputs from the approved commit and shares no code with the mover.
- No frozen input changed.
- No product file changed outside the allowlist.

### Consumers

- The requirements trace passed with 1,009 rows and zero EARS failures.
- Requirement-row impact passed.
- Map check passed.
- README check passed.
- The tree test passed, demonstrating the test gaps above rather than a healthy outline.

The byte-preserving move remains sound. The incorrect permanent outline and unenforced structure clauses block landing.

VERDICT: SEND-BACK
