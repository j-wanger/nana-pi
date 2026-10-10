## Findings

**MUST 1 — `scripts/requirements-tree.mjs:19` — the tree checker does not share the rail’s whitespace grammar.**

Evidence:

- A row beginning `|<U+0085>R-1000 | ... |` loads in the trace rail.
- The tree checker silently records zero rows and zero problems.
- U+001F produces the same disagreement.
- This violates R-287 and can hide a valid row from the generated outline.
- `packages/nana-pack/tests/requirements-tree.test.mjs:152-156` tests four-digit IDs only with ASCII spaces.

Smallest fix:

- Re-export the shared whitespace definition through `scripts/requirements-trace.mjs`.
- Build the tree’s row prefix from that explicit character class instead of `\s`.
- Add U+0085 and U+001F fixtures proving the trace rail and tree checker both load the row.

## Confirmed

- The acceptance script exited zero with `seat-verify-ids: 0 mismatch(es)`.
- Both trace rails agreed on the supplied BOM, marker, row, general-file, and U+200B cases.
- All 1,014 real ledger candidates are valid rows.
- Both template ledgers retain their existing candidate rows.
- All 1,012 pre-existing requirement rows retain identical cells.
- The two project-setup shares pass the tree checker.
- The generated outline and code map checks passed.
- The focused trace and tree suites passed.
- TS `.trim()`, Python `.strip()`, BOM-removal, and Python `.split()` mutations each made the trace suite fail.
- The seven frozen statuses cite the recorded ruling.
- The handoff and session entry otherwise match the intended merged state.

**Score: 7/10**

VERDICT: SEND-BACK
