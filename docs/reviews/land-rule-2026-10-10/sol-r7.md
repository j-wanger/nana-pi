## MUST

- Correct the verdict grammar in `packages/nana-pack/README.md:177`.
- The sentence says only whitespace may follow trailing punctuation.
- `verdictWord` allows `*`, `_`, and backticks after that punctuation.
- For example, `VERDICT: LAND.**` records `LAND`.
- The parser also accepts any `\s` after the label and before a score, not only spaces or tabs.
- State both positions as whitespace and permit wrapper marks after trailing punctuation.

## SHOULD

- Add these omitted accepted forms to the probe: `VERDICT: LAND.**`, `VERDICT: LAND (9/10).**`, and non-space `\s`.

## NOTE

- Review coverage is `1836fa3..857d304`.
- Aside from expected review records, the probe, and the round-seven brief, only the README sentence changed.
- No production code or tests changed.
- `git diff --check` passed.
- The 17 recorded probes pass, but they omit the accepted forms that expose this mismatch.

**Score: 8/10.**

VERDICT: LAND-WITH-FIXES
