## Land review — round 2

**Score: 9/10. Both round-1 findings are closed. One documentation fix remains; no implementation blocker found.**

Reviewed `eeeca20..5c266a2`, including the tree’s last review record.

### MUST

None.

**Round-1 MUST closed: valid row endings.**

- TypeScript: `templates/typescript/template/tests/requirements-trace.ts:47–65,203–209` preserves CRLF, trailing spaces/tabs, and Unicode characters inside cells.
- Python: `templates/python/template/tests/conftest.py:58–78,151–164` preserves raw newline boundaries and applies the same ending normalization.
- Both rails reject genuinely missing closing pipes with file-and-line diagnostics.

Independent verification passed for both ledger files, both ID widths, and both rails. U+2028 no longer silently drops a TypeScript row.

### SHOULD — Finish the author-facing line definition

The documentation is **partially complete**:

- `templates/typescript/template/REQUIREMENTS.md.jinja:46`
- `templates/python/template/REQUIREMENTS.md.jinja:48`

Both declare allowed row endings, but neither defines a line as text between **LF (`"\n"`) characters**.

`docs/reviews/req-ids-2026-10-10/CHANGE.md:39–42` says “newline characters,” which leaves the Unicode-separator distinction ambiguous. Its “Compatibility break, declared in full” paragraph at lines 47–53 also omits the newly rejected trailing-character case.

Add an explicit statement to both template ledgers and the declaration:

> Lines split only at LF (`"\n"`). Only spaces, tabs and carriage returns are ignored after the closing pipe. Any other trailing character, including a no-break space, makes a candidate row fail with its file and line.

This completes the requested consumer-facing contract without changing code.

**Round-1 SHOULD closed: HANDOFF accuracy.**

- `HANDOFF.md:12` now says the owner **requires** Windows testing, not that testing occurred.
- `HANDOFF.md:56` distinguishes the accepted tree from the four-digit change awaiting final review.

### NOTE — Compatibility ruling

The remaining compatibility break is acceptable: NBSP, BOM, or another non-allowed character after the closing pipe causes a named failure.

This is preferable to silently accepting different row shapes across languages. CRLF and ordinary trailing spaces/tabs remain supported. Complete the declaration above before landing.

### NOTE — Scope and identity preservation

Independent comparison found:

- **1,012 existing rows unchanged**, byte-for-byte.
- Exactly **two additions:** `R-1000` and `R-1001`.
- New allocation starts at `R-1000`.
- No existing row renumbering, retirement, relocation, or sharing change.

Production changes remain limited to widening IDs, the declared near-miss check, and necessary parser consistency. Tree ranges, counts, and sharing references recognize four-digit IDs.

The prior tree-review record adds no production behavior. HANDOFF’s additional changes record owner decisions and pending work, rather than claiming their implementation.

### Evidence

Independently executed successfully:

- Seat verifier: **zero mismatches; Python exercised**.
- Trace test file: **all passed**.
- Tree test file: **all passed**.
- Existing-row preservation comparison: **zero changed or missing rows**.

I did not rerun the full suite or template acceptance. Their successful runs remain builder-reported evidence.

### Accepted residuals

- Lexical sorting of diagnostic ID lists.
- Indented rows remain outside recognition.
- Reserved prefixes apply inside fences and unrelated tables.
- Downstream rail migrations remain separate.
- Previously accepted tree limitations and the owner's outstanding checkpoint decisions remain.

The documentation fix requires independent acceptance before merging; this verdict does not authorize an unreviewed follow-up commit.

VERDICT: LAND-WITH-FIXES
