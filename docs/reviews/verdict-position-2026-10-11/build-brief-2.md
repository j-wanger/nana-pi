# Lane verdict-position — build brief 2: one surviving mutation (2026-10-11)

Round 1 is verified by the seat: the acceptance script passes 64/64 cases and 414/414 corpus files,
the title check shows 0 gaps, and the seat's mutation runner (`seat-mutate.py` in this folder) turns
13 of 14 code mutations red. The survivor: **removing `normalize('NFKC')` from `canon` leaves every
suite test green** — `review-ledger.test.mjs` has no compatibility-form case. (The seat's acceptance
script has one; no suite test may rely on it.)

- [ ] **A.** Add to the R-1010 refused list in `review-ledger.test.mjs`, through the same real launch
  path: a first-line LAND followed by a full-width `ＶＥＲＤＩＣＴ: SEND-BACK` (U+FF36…); a full-width
  first-line rejection above a clean final `VERDICT: LAND`; and one other compatibility form the
  class covers — mathematical bold capitals (`𝐕𝐄𝐑𝐃𝐈𝐂𝐓: SEND-BACK`, U+1D415…) after a first-line LAND.
  Each must record an empty verdict. Wrong code first: remove `normalize('NFKC')`, see the check
  fail, restore it.
- [ ] **B.** Run `python3 docs/reviews/verdict-position-2026-10-11/seat-mutate.py > docs/reviews/verdict-position-2026-10-11/seat-mutate-output.txt 2>&1`
  — it must end `mutations: 14/14 red` and `worktree clean` (it restores the file after each
  mutation; do not edit the script). Then `npm run test:locked`, both seat scripts into their output
  files, commit with explicit paths (add `seat-mutate.py` too — it is the seat's file, committed as is).

No other change. Report ≤ 15 lines, first line `VERDICT: …`: the commit, the last two lines of each
seat output file and of `seat-mutate-output.txt` verbatim, and the `test:locked` summary line.
