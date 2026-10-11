## MUST

- Correct the pack README’s Markdown-mark claim.
- It says all six listed marks may precede the label or wrap its parts.
- The parser permits `#`, `>`, and `-` only before the label.
- Only `*`, `_`, and backticks may wrap the label, verdict word, score, or trailing punctuation.
- Split those two accepted sets explicitly, or refer directly to the R-969 grammar.

## SHOULD

None.

## NOTE

- Confirmation covers `1836fa3..4b57f7ef6d684ffca0fc21811823f4b723942f3d`.
- No production code or tests changed after `7db7a53`.
- The delta otherwise contains the expected round-5 records, logs, wording changes, and round-6 brief.
- The session entry and CHANGE §5 no longer make the incorrect “bare” claim.
- `git diff --check`, `npm run readme:check`, and the complete land test passed.
- The remaining README wording still does not state `verdictWord` exactly.

**Score: 8/10.**

VERDICT: LAND-WITH-FIXES
