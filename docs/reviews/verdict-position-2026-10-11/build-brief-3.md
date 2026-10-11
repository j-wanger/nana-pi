# Lane verdict-position — build brief 3: the two final reviews' findings (2026-10-11)

sol build r1 (`sol-r1.md`, SEND-BACK 7/10) and astra land r1 (`astra-r1.md`, SEND-BACK 7/10; recorded
unverified because the seat committed during it — its findings stand) found two masking paths and
three smaller gaps. CHANGE §4 carries two seat amendments for them. Do every item:

- [ ] **A (sol MUST 1).** In the final-line branch, a first line that carries the label must match
  the PLAIN first-line grammar (`firstGrammar`) with the same word — not the final-line grammar.
  Regression cases through the real launch path: a quoted, a `#`-marked, an indented and a bold
  first-line `VERDICT: LAND` above an agreeing final `VERDICT: LAND` each record empty.
- [ ] **B (astra MUST).** Canonicalise as: remove default-ignorables, fold, NFKC, remove
  default-ignorables, fold, lower-case. Regressions: `VERDIϹT: SEND-BACK` (U+03F9) above a final
  LAND, and after a first-line LAND, each record empty. Add one suite test that pins the invariant
  for the WHOLE table: for every entry, the canonical form of the key is its target letter in lower
  case (so a future entry that NFKC rewrites fails the suite).
- [ ] **C (sol MUST 2).** R-969's selection clause rests on canonical detection: put `R-969` beside
  `R-1010` on the refusal check that exercises it (and on the new invariant test), and cite it in
  R-969's Evidence.
- [ ] **D (sol SHOULD).** `verdict-config.mjs` provenance: name every script in the table (Greek,
  Cyrillic, Cherokee) or say "selected visual look-alikes".
- [ ] **E (astra SHOULD).** Pack README verdict paragraph: say that when the final line is selected,
  only the first line is checked for a conflicting verdict — a verdict line in the middle is not read
  (so `notes`, `VERDICT: SEND-BACK`, `VERDICT: LAND` records LAND). Probe the sentence's example
  against the code.

Wrong code first for A and B. Then `npm run test:locked`, the seat acceptance script into its output
file (it now has 6 more cases and a check per table entry; it must print `0 mismatch(es)`), the
title check into its output file, commit with explicit paths. Do not run `seat-mutate.py`; the seat
runs it after this round. Report ≤ 20 lines, first line `VERDICT: …`: the commit, the last two lines
of each seat output verbatim, the `test:locked` summary line, the one claim most likely wrong.
