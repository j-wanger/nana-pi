All five MUSTs are done and committed as **`8553603`** on `lane/e1-catch-ledger`. P1 now leads `RESULTS.md` as UNRESOLVED, even though after the rebuild both matchers say YES.

- **What the split changed:** `same_as` and `covers` are now separate in the schema, the guide and the stats. Components are built from `same_as` only.
  - Matcher A: components with 3+ rows went from 24 to 5, largest from 8 to 4.
  - Matcher B: 32 to 10, largest from 17 to 4.
  - Mutual containment happened 0 times under A and 0 under B. Within-report duplicates fell from 65 to 42 (15 of them are bundles), leaving 198 distinct findings.
  - `t2c/astra-r1#5` now covers `#2` and `#3`, which stay separate. That case is a regression test, alongside the tests for bundle-first order, no leak through the bundle, and fail-closed validation.
- **P1 after the rebuild (detail only):**

  | matcher | sol-unmatched accepted rows | of which functional | functional lanes | 6 lanes | original 5 |
  |---|---|---|---|---|---|
  | A | 18 | 10 | l1 l2 l3 t2b t2c | YES | YES |
  | B | 10 | 5 | l1 l2 l3 t2b t2c | YES | YES |
  | A∩B | 9 | 5 | l1 l2 l3 t2b t2c | YES | YES |

  In A∩B each lane rests on one row. The headline still says UNRESOLVED:
  - all 18 P1 rows count as accepted only because the judge read a fix-brief quote as answering them (`semantic` confidence);
  - the answer flipped because of a relation change made after the data existed;
  - nothing checks the matching itself;
  - no controls were run.
- **Component audit:** A's five components are one defect each; one of them, on t2a, is borderline. Under B, 2 components are clearly over-merged, 1 mildly and 3 borderline. One B edge (`#5` treated as the same as `sol-r2#6`) knocks `t2c/astra-r1#2` out of P1 under B. Nothing was excluded.
  - **l2:** both 8-row components are gone. What remains are two correct pairs (`sol-r3#16`/`#21` and `astra-r1#5`/`sol-r3#19`); the bundle rows now use `covers`.
- **P4:** scoped to "in this corpus, SCORE carries no information beyond VERDICT". The t2c alignment comes back: t2c-land has 3 accepted functional findings against 1–2 elsewhere, but that is one data point.
- **Land posture:** "measurement tooling only", with seeded-defect and clean-patch controls as prerequisites, is stated in both `RESULTS.md` and `CHECKPOINT.md`. `PREREG.md` has a dated amendment for the split. `samePath` now resolves `..` properly, and the path caveat stays.
- **`npm test`:** exits 0 (72 files, 4532 checks). `build` reproduces byte-identical `results.json`, `table.md` and `ledger.jsonl`. Nothing outside `apps/bench` was touched.
- **Spend:** $3.84 this round (matcher A $0.68, B $3.16), about $2.40 for this session, and $13.95 of judge spend in total, including superseded runs. Labels were not re-run.
- **Residuals:**
  - There is still no κ or human calibration for matching; the audit was done by me, the worker.
  - Matcher prompts still show the old basename-only file hints, kept deliberately so the bias measurement stays comparable.
  - The claim that most of these catches are defects in late fixes comes from the r1 reading and was not re-derived for the new P1 rows.
- **Claim most likely wrong:** matcher A now under-matches. Only 2 of astra-r1's 20 accepted findings are matched to sol, which overstates how unique astra's catches are. One example is `l3/astra-r1#2` versus `l3/sol-r2#13`.

VERDICT: DONE
