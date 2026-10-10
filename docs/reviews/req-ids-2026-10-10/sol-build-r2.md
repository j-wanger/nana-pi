## Findings

**MUST 1 — `templates/typescript/template/tests/requirements-trace.ts:68` and `templates/python/template/tests/conftest.py:78` — marker parsing still disagrees.**

Evidence:

- `R-1000\u2028G-1000` is silently ignored by TypeScript.
- Python traces both IDs from the same marker.
- A UTF-8 BOM before the first marker is accepted by TypeScript but silently ignored by Python.
- The current tests cover CRLF markers, but not these instructed compatibility cases.

Smallest fix: normalize one leading BOM and replace runtime-dependent `\s` behavior with an explicit, identical marker grammar. Add cross-rail fixtures for BOM, U+2028, U+2029, and U+0085.

**MUST 2 — `templates/typescript/template/tests/requirements-trace.ts:47-48` and `templates/python/template/tests/conftest.py:54-55` — row recognition still depends on incompatible `\s` definitions.**

Evidence:

- With U+0085 before `R-1000`, Python loads the row while TypeScript silently returns zero rows and zero problems.
- With U+FEFF before `R-1000`, TypeScript loads the row while Python silently returns zero rows and zero problems.
- A BOM before a first-line requirement row is silently skipped by both rails.
- This leaves the instructed BOM case and line-definition parity unresolved.

Smallest fix: strip one file-leading BOM before line processing and use explicit ASCII space/tab classes around row IDs. Add fixtures that require both rails to produce identical rows or identical file-and-line failures.

## Confirmed

- The acceptance script exited zero with 0 mismatches.
- The root trace self-test passed.
- CRLF ledgers, CRLF marker files, trailing spaces, trailing tabs, and missing closing pipes behave correctly.
- A final row without a newline loads in both rails.
- Mutation checks worked:
  - Removing the TypeScript `s` flag caused one failure.
  - Restoring Python `splitlines()` caused two failures.
  - Restoring TypeScript `trimEnd()` caused five failures.
- The scoped diff matches the brief.
- No pre-existing requirement row’s cells changed.
- The whole change remains unaccepted because the two parity defects block this independent review.

**Score: 6/10**

VERDICT: SEND-BACK
