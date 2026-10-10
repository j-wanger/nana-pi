## Score: 5/10

The byte-preserving move is sound, but four structure clauses can remain violated while the tests pass.

## MUST

### 1. R-287 ignores ordinary headings

**Location:** `scripts/requirements-tree.mjs:56-62`, `packages/nana-pack/tests/requirements-tree.test.mjs:39-46`

`checkRowsUnderFeatures` updates `nearest` only for CAP, FEAT, and SUB headings. An ordinary Markdown heading does not clear it.

I moved R-291 under the closing ordinary heading and regenerated the outline in a temporary copy. The tree test still reported `all passed`.

The cited test pins a row directly under a capability. It does not pin “nearest preceding heading.”

**Smallest fix:** Reset the nearest tree heading on every Markdown heading. Bind each row to its current table and that table’s current FEAT or SUB heading. Add the demonstrated closing-heading fixture.

### 2. R-288 permits an intervening heading

**Location:** `scripts/requirements-tree.mjs:66-75`

The purpose check recognizes only headings with one to three `#` characters. A level-four heading can occur between a capability and its purpose.

I inserted such a heading in a temporary ledger. Outline generation and the full tree test both passed.

The cited fixtures pin missing and empty purposes. They do not pin “before any heading.”

**Smallest fix:** Treat every ATX heading level as a boundary. Add a fixture with an intervening level-four heading.

### 3. R-290 preserves a parent across an unrelated peer heading

**Location:** `scripts/requirements-tree.mjs:42-47`, `scripts/requirements-tree.mjs:83-91`

The hierarchy stack contains only recognized tree headings. An unrelated level-one heading does not close the preceding capability.

I inserted an unrelated level-one heading between CAP-01 and FEAT-001. Outline generation and the tree test both passed.

The cited tests pin missing parents at the start of a document. They do not pin Markdown ancestry after an intervening peer heading.

**Smallest fix:** Update or clear hierarchy state for every Markdown heading. Add this intervening-peer fixture.

### 4. R-291 renders G-row IDs as R-row IDs

**Location:** `scripts/requirements-tree.mjs:93-98`, `docs/requirements-tree.md:185-187`

`compressRowIds` discards each ID prefix and always emits `R-`. The committed outline therefore claims FEAT-033 contains R-001–R-022, although the ledger contains G-001–G-022.

The current suite passes despite this incorrect row-ID field. The field mutation fixtures use only R IDs.

**Smallest fix:** Preserve prefixes and compress runs separately by prefix. Add a fixture containing both G and R IDs, plus an assertion against FEAT-033.

## SHOULD

### 5. Parent headings misleadingly report zero rows

**Location:** `scripts/requirements-tree.mjs:99-109`, `docs/requirements-tree.md:5-12`

Every capability and every subgrouped feature reports `Rows: 0 · IDs: —` because the renderer counts only directly attached rows.

This is technically reproducible, but it misleads a reader about the scope beneath those headings.

**Smallest fix:** Aggregate descendant rows, or rename the field to `Direct rows`. Aggregation better serves the stated browsing purpose.

## Verification evidence

- Proof passed: 1,004 base rows preserved, five new rows, 125 blocks, 1,554 lines, and 64 old headings.
- Scratch mutations of a row byte, prose byte, blank line, note position, intro, closing blocks, and section-map note all made the proof exit nonzero.
- Independent comparison found all 1,004 original row lines byte-identical.
- Added IDs were exactly R-287–R-291, with no removed or duplicate IDs.
- No frozen checkpoint input changed.
- `prove.mjs` reads the base ledger, tree, and fixed text from the supplied approved revision.
- `prove.mjs` imports no implementation from `move.mjs`.
- Disabling each R-287–R-290 checker made its cited negative fixture fail.
- Removing an R-291 renderer field made its cited test fail.
- The trace rail passed with 1,009 rows and zero EARS-form failures.
- Requirement-row impact, map check, README check, and the unmodified tree test all passed.
- No product file outside the declared allowlist changed. Additional changes are build records in the declared review corpus.

VERDICT: SEND-BACK
