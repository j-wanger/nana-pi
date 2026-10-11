# Lane land-rule — continuation 9: the final line only (sol build r3 SEND-BACK 7/10; astra r3 LAND 10/10)   (2026-10-11 · feat/land-rule)

Read `sol-build-r3.md`. Two parser paths still turn malformed review output into LAND:
(1) the parser picks the last line that CARRIES `VERDICT:`, so a final `VERDICT: SEND-BACK` followed
by a fenced example containing `VERDICT: LAND` records LAND, and a look-alike label on the final line
lets an earlier LAND stand; (2) the prefix check uses ASCII `\w`, so `拒否: VERDICT: LAND` or
`→ VERDICT: LAND` records LAND. The rule that closes both: only the FINAL NON-BLANK LINE of the
output counts, and only markdown marks may precede the label. Every review brief already demands the
verdict as the last line.

- [ ] **A. Rows** (SUB-009). Reword exactly:
  - R-969: "Each completed review shall record as its verdict the verdict word — capital letters and
    hyphens — after `VERDICT:` on the final non-blank line of its output, allowing before the label
    only whitespace and the marks `#`, `>`, `-`, `*`, `_` and backtick, and after the word one score
    written `(n/m)` or `— n/m`, one trailing `.`, `,`, `;` or `:`, whitespace, and the marks `*`, `_`
    and backtick."
  - R-1010: "IF the final non-blank line of a completed review's output is not a verdict line that
    R-969 allows, THEN the review ledger shall record an empty verdict for that review."
  R-701 (whether a review counts as produced) is unchanged.
- [ ] **B. Code** (`verdictWord` in `review-round.mjs`). Take the final line whose trim is non-empty;
  match it against one pattern built from R-969's exact sets (no `\w`; use explicit character
  classes); anything else → `null`.
- [ ] **C. Tests** (`review-ledger.test.mjs`, R-969 and R-1010 tests, each case's FAIL line carrying
  the test title as before): a fenced example after the final SEND-BACK → empty; a look-alike label
  (Greek `Ε`) on the final line after a LAND → empty; trailing blank and whitespace-only lines after
  the verdict → the verdict; `拒否: VERDICT: LAND` and `→ VERDICT: LAND` → empty;
  `> - **VERDICT:** LAND` → LAND; prose after the final verdict line → empty; every existing corpus
  case still holds. The seat script has these and fails five.

Then: `npm run req:tree`, `npm run map:check`, `npm run test:locked` (must pass; report the summary
line), commit, then both seat acceptance scripts into `seat-verify-land-output.txt` (both exit 0) and
`python3 docs/reviews/land-rule-2026-10-10/seat-mutate.py > docs/reviews/land-rule-2026-10-10/seat-mutate-output.txt`
(report its last line; if B moved a verdict anchor so a mutation reports SKIP, say which — do not
edit the runner); commit. Rules as `build-brief.md`; frozen as before. Report ≤ 15 lines, first line
`VERDICT: …`.
