# Lane land-rule — continuation 10: astra's three SHOULDs (round 4: sol LAND 10/10, astra LAND 9/10)   (2026-10-11 · feat/land-rule)

Both round-4 reviews accepted the change. Read `astra-land-r4.md`. The seat fixed two of its points
(the session entry's verdict-line wording; CHANGE §5's recovery text). Two items for you; do both.

- [ ] **A. Score regressions (R-1010).** Add to the R-1010 test in `review-ledger.test.mjs`: a score
  after a hyphen (`VERDICT: LAND - 9/10`), after an en dash (`VERDICT: LAND – 9/10`), and a decimal
  score (`VERDICT: LAND (9.5/10)`) each record an empty verdict.
- [ ] **B. The README's limits paragraph** (`packages/nana-pack/README.md`, "Limits to plan for")
  adds, in plain words: a review's verdict is read from its final non-blank line only, which must be a
  bare `VERDICT:` line (an optional score `(n/m)` or `— n/m`); anything else — a sign-off after it,
  prose before the label, another score form — records an empty verdict; that record stays on the
  revision and refuses it for good, so the fix is a new commit and a fresh review, not a re-run.
  Keep R-981's pinned patterns.

Then: `npm run map:check`, `npm run readme:check`, `npm run test:locked` (must pass; report the
summary line), commit, then both seat acceptance scripts into `seat-verify-land-output.txt` (both
exit 0) and `python3 docs/reviews/land-rule-2026-10-10/seat-mutate.py > docs/reviews/land-rule-2026-10-10/seat-mutate-output.txt`
(must print 17/17 red); commit. Rules as `build-brief.md`; frozen as before. Report ≤ 12 lines, first
line `VERDICT: …`.
