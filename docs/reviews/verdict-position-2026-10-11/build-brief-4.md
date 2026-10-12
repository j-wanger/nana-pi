# Lane verdict-position — build brief 4: two suite gaps the seat's mutation run found (2026-10-11)

Round 3 is verified (acceptance 0 mismatches, title check 0 gaps). The seat's mutation runner (anchors
updated after round 3) leaves two code mutations GREEN in `review-ledger.test.mjs`. Tests only; no
code change:

- [ ] **A. Fold after NFKC.** Removing the fold that runs AFTER `normalize('NFKC')` leaves the suite
  green: no case needs it. A mathematical Greek capital normalises into a table letter (U+1D6AC `𝚬` →
  U+0395 `Ε`). Add to the R-969/R-1010 refusal list, through the real launch path:
  `VERDICT: LAND` then `V𝚬RDICT: SEND-BACK` → empty; and `V𝚬RDICT: SEND-BACK`, notes, a final
  `VERDICT: LAND` → empty.
- [ ] **B. Bare score on the final line (R-969).** Removing ` n/m` from the final-line grammar leaves
  the suite green since round 3 (the first-line check no longer uses that grammar). Add an accepted
  case: `body` then a final `VERDICT: LAND 9/10` → LAND.

Wrong code first for each (make the mutation, see the new case fail, restore). Then
`python3 docs/reviews/verdict-position-2026-10-11/seat-mutate.py > docs/reviews/verdict-position-2026-10-11/seat-mutate-output.txt 2>&1`
(must end `mutations: 17/17 red` and `worktree clean`; do not edit it), `npm run test:locked`, the
acceptance script into its output file, commit with explicit paths (include the seat's updated
`seat-mutate.py` as is). Report ≤ 10 lines, first line `VERDICT: …`, the last two lines of each output
file verbatim.
