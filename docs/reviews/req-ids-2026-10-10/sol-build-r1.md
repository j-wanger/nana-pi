## Score: 8/10

One cross-platform compatibility defect blocks landing.

### MUST

- `templates/typescript/template/tests/requirements-trace.ts:51-54` and `templates/python/template/tests/conftest.py:62,152,233,367` reject valid rows with trailing whitespace.
- The TypeScript rail also rejects every valid requirement row in a CRLF ledger.
- OS-temp fixtures produced:
  - TypeScript CRLF row: malformed at `REQUIREMENTS.md:3`.
  - Python CRLF row: accepted.
  - Both rails rejected a valid row whose closing pipe had trailing spaces.
- This regresses the prior whitespace tolerance and conflicts with the stated “closing pipe” row grammar.
- It is especially blocking because `.gitattributes:1` does not enforce LF on Windows.
- Smallest fix: normalize trailing whitespace before validating and parsing rows, without trimming leading whitespace. Add CRLF and trailing-space fixtures to both template self-tests and the root test.

### SHOULD

None.

### NOTE

- `templates/typescript/template/tests/requirements-trace.ts:45` and `templates/python/template/tests/conftest.py:54` correctly enforce ASCII three-digit IDs and non-zero-leading four-digit IDs.
- Temp fixtures rejected Unicode digits, `R-0999`, `R-10000`, and `R-1000a`.
- Mixed marker lists containing one bad ID failed in both rails with the exact source line.
- `packages/nana-pack/tests/requirements-trace.test.mjs:177-225` correctly checks both raw files before merging.
- A malformed final line without a trailing newline failed with the exact general-file line.
- Fenced examples, unrelated R/G tables, missing closing pipes, and tabs behaved as declared.
- `packages/nana-pack/tests/requirements-tree.test.mjs:153-159` pins four-digit placement, counts, sharing, and the range crossing 999 to 1000.
- No live requirement-ID matcher remained three-digit-only. Remaining matches are declared historical tools or unrelated identifiers.
- `REQUIREMENTS.md:1256-1257` adds only the two intended rows. An independent comparison found zero changed or removed prior rows.
- The mutation evidence in `docs/reviews/req-ids-2026-10-10/builder-report-1.md:9-13` covers both new rows and both rails.
- Template ledger wording correctly documents the grammar and reserved prefix, but the implementation currently contradicts its closing-pipe wording.
- The declared frozen review files have identical object hashes at the builder brief and current tip.
- The post-build diff contains only review records and the handoff update.
- The prior requirements-tree review record accurately documents its narrow scope and LAND result.
- The handoff update accurately carries the new priority, rulings, residuals, and queue.
- The focused trace and tree suites passed.
- The map check and tree regeneration passed, leaving the worktree clean.
- The seat acceptance script exited 0 with 0 mismatches.
- The builder records a successful full locked suite and template acceptance. I did not rerun template acceptance because it cannot expose the missing CRLF fixture.

VERDICT: SEND-BACK
