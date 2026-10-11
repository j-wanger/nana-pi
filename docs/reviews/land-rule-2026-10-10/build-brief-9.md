# Lane land-rule — continuation 8: sol build r2 (SEND-BACK, 8/10) — one bypass, one record (2026-10-10 · feat/land-rule)

astra's round 2 is LAND 10/10 (`astra-land-r2.md`). sol's round 2 (`sol-build-r2.md`) reproduced a
bypass. Two items; do both.

- [ ] **A. Select the last line that CARRIES `VERDICT:`, then validate it (R-969, R-1010).**
  `verdictWord` in `packages/nana-pack/bin/review-round.mjs` searches backward only among lines whose
  label is line-leading, so in
  ```
  VERDICT: LAND
  Correction: VERDICT: SEND-BACK
  ```
  it skips the second line and records LAND — a reviewer's final rejection is masked, and the land
  goes through. R-969 says "the last line of its output that carries `VERDICT:`". Select the last
  line containing the bounded token `VERDICT:` (not preceded by a letter, digit or underscore)
  anywhere on the line; THEN apply the strict whole-line pattern; a final line that fails it (such as
  `Correction: VERDICT: SEND-BACK`) records an empty verdict. Keep R-701's rule for whether a review
  counts as produced unchanged. Add both cases to the R-1010 test (the correction line → empty) and
  the R-969 test (quoted verdict lines indented in the body, then a final `VERDICT: SEND-BACK` →
  SEND-BACK). The seat script now has both and fails the first.
- [ ] **B. Refresh the mutation record.** `seat-mutate-output.txt` still shows build 8's 14/15 (the
  seat has since moved the lock mutation's anchor). Re-run the runner after A and commit its output.

Then: `npm run req:tree`, `npm run map:check`, `npm run test:locked` (must pass; report the summary
line), commit, then both seat acceptance scripts into `seat-verify-land-output.txt` (both exit 0) and
`python3 docs/reviews/land-rule-2026-10-10/seat-mutate.py > docs/reviews/land-rule-2026-10-10/seat-mutate-output.txt`
(must print 15/15 red; if A moved the verdict-line anchor, report it — do not edit the runner);
commit. Rules as `build-brief.md`; frozen as before. Report ≤ 15 lines, first line `VERDICT: …`.
