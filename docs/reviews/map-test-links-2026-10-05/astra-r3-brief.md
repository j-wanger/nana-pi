# Review brief — map-test-links round 3 (FINAL), 2026-10-05 (reviewer: gpt-6-astra)

Round 2 (`docs/reviews/map-test-links-2026-10-05/astra-r2.md`, BLOCK 6/10) found every MUST inside
the comment/string lexer added after round 1: it lost real edges in ordinary code and made fake ones
from valid strings. The class it fixed (comment or string text creating a spurious edge) is
PRE-EXISTING on main for all patterns and changed 0 edges on nana-pi, while a lost edge is worse
than a spurious one.

**Seat decision: the lexer is SUBTRACTED.** The four patterns match raw source again, as on main,
plus the `new URL(…, import.meta.url)` form with whitespace tolerance. One monotone guard replaces
the lexer: a match is skipped when its line's first non-blank characters are `//`, or are `*` on a
line with no `*/`. R-863 (the lexer's row) is retired; R-864 is the guard. Open question 12 now
declares the remaining spurious-edge class honestly. Round 1's brief (`astra-brief.md`) still
applies. This is the last round under the cap: rank findings so the seat can land with recorded
residuals where that is the right call.

Review `git diff main..HEAD` in full, then:

1. **Can the guard lose a real import?** Try every line shape: a real import after a `*/` on a
   `*`-line, a `//` inside a string at line start (`"//" + x; import(...)` on one line is not at
   line start — try what is), CR / U+2028 / U+2029 line splits, a line that starts with `*` as
   multiplication. A lost real edge is a MUST.
2. **R-860 and R-864 evidence.** Do the tests pin the whitespace clause and every pattern × guard
   combination? Mutate in a scratch copy and confirm the suite fails.
3. **Round-2 inputs.** Re-run round 2's six MUST inputs: none may lose a real import; any spurious
   edge must fall inside Open question 12's declared class.
4. **Status honesty and the edge diff**, as before (expect 144 → 245 vs main, 0 removed).
5. **Is anything from rounds 1–2 left open** that the subtraction did not address?

## Output

Answer with the full review as your final message; do not write it to a file. Give ranked findings
(MUST / SHOULD / NOTE) with file:line, evidence (what you executed or read) and the smallest fix.
End with `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
