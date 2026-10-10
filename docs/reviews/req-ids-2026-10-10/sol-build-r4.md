## Findings

### MUST — `scripts/requirements-tree.mjs:20` — the tree still disagrees with the rail on malformed rows

The tree’s `ROW` expression checks only the row prefix. It does not require a complete four-cell row.

Reproduction using U+0085 and U+001F around `R-1000`, with the closing pipe removed:

- Trace rail: rejects `REQUIREMENTS.md:10` as malformed.
- Tree: records `R-1000`, reports zero problems, and renders `Rows: 1 · IDs: R-1000`.

This violates the requested rail/tree agreement and can place malformed lines in the generated outline.

Smallest fix:

- Export shared complete-row recognition from the trace rail.
- Use it for tree row collection, while retaining the shared whitespace and ID definitions.
- Add tree fixtures for a missing closing pipe and a non-whitespace suffix.

### SHOULD — `REQUIREMENTS.md:1248` — R-287 cites the wrong whitespace-placement proof

The cited “load only inside a feature” test at `packages/nana-pack/tests/requirements-tree.test.mjs:161` checks only the accepted inside case.

The actual refusal proof is at `packages/nana-pack/tests/requirements-tree.test.mjs:164`, but R-287 does not cite it.

Smallest fix: add the outside-feature test citation to R-287’s Evidence cell.

### NOTE — `templates/typescript/template/tests/requirements-trace.test.ts.jinja:182`

The test title claims direct `loadRequirements()` support for one leading BOM, but its assertion omits `R-010`.

Directly calling `loadRequirements()` with a BOM-prefixed first-line row returns no row after the normalization refactor. The file-based `check()` path remains correct.

Document the normalized-text precondition or split public normalization from internal parsing.

## Confirmed

- The acceptance script exited zero with `seat-verify-ids: 0 mismatch(es)`.
- U+0085 and U+001F valid rows are counted, placed, rendered, and refused outside features.
- Both rails agree on one and two leading BOMs in exercised ledger and marker paths.
- Focused trace and tree suites passed.
- Template acceptance passed.
- `git diff --check` passed.
- The checkout remained clean.

**Score: 7/10**

VERDICT: SEND-BACK
