I built the catch ledger and answered P1–P4 from its table. P1 is YES, P4 says SCORE adds nothing beyond the verdict, and P2 and P3 cannot be answered because their labels failed the reliability check. I stopped at the size checkpoint, so the sol review (scope + adversarial) has **not run yet**.

**Commits** (branch `lane/e1-catch-ledger`, not pushed): `fcf012d` pre-registration, made before any labelling · `5ffe0e8` the ledger · `36a7e34` checkpoint. The tool is `apps/bench/catch-ledger.mjs` plus three files in `apps/bench/lib/`. I put it in the bench app because it is measurement tooling, and `nana-pack/bin` is runtime tooling that ships with the pack.

**Corpus as recounted:** 35 reviewer reports, 28 fix briefs, 36 worker reports, 8 lanes. Astra ruled on **6** lanes, not 5 (t2c is the sixth); P1 is answered both ways.

**Extraction:** all 35 reports parsed; none unparsed. That gives 361 rows (120 finding, 150 carry, 91 verification), which the judge reduced to 192 distinct findings. The 367 other blocks (notes, labels, ruling prose) are logged in `skipped.jsonl`, and a test checks that no top-level item is dropped. A defect stated only in prose and never itemized is not a row, by design. `extract` then `build` reproduces the committed files byte-for-byte.

**κ** (n=40, Opus 5.5 vs Sonnet 5, separate calls): top-level class 0.71, which passes the 0.6 gate. Disposition 0.79, sub-class 0.64, origin **0.52**. The P2 relation axis, checked afterwards on 38 rows, is **0.37**. All 145 fix-brief quotes behind a disposition were found verbatim in the brief.

**Table** (`table.md`, from `node apps/bench/catch-ledger.mjs build`):

| model | round | class | found | accepted | unique-accepted |
|---|---|---|---|---|---|
| sol | r1 | functional / evolvability | 40 / 16 | 31 / 5 | 25 / 5 |
| sol | r2 | functional / evolvability | 24 / 15 | 19 / 5 | 14 / 5 |
| sol | r3 | functional / evolvability | 18 / 6 | 11 / 3 | 9 / 3 |
| astra | r1 | functional / evolvability | 28 / 12 | 11 / 9 | 7 / 8 |
| astra | r2 | functional / evolvability | 21 / 6 | 1 / 0 | 1 / 0 |

Sol r1 also has one false positive. Only 4 of the 87 matched pairs came from the same-file stage; 83 were semantic-only.

**Claims** (all from `results.json`):
- **P1 — YES.** Astra's first ruling has a seat-accepted functional catch that no sol round matched on 5 of 6 lanes (l1, l2, l3, t2b, t2c), and on 4 of the original 5. Of its 16 such accepted catches, 8 are functional and 8 evolvability, so it is not only a documentation check.
  - This depends on the matcher. With the Sonnet matcher only l3 and t2c qualify: still YES on 6 lanes, NO on the original 5.
  - I hand-read the 5 disputed pairs. In 4, Sonnet paired astra's catch with a different defect in the same area; 1 (t2c) is borderline.
- **P2 — only partly answerable.** Of 56 sol r3 items, 32 (57%) are verification lines, found by regex rather than the judge. The other 24 split as 4 new-scope by Opus but 11 by Sonnet, with κ 0.37, so the data cannot say whether the cap mostly cuts off new scope.
- **P3 — not an answer.** 19 of 95 accepted findings (20%) trace to a seat specification error, 6 of them on t2c. But κ(origin) is 0.52, below 0.6, so by the pre-registration this number is unreliable.
- **P4 — no information beyond the verdict.** 12 of 13 scores follow from the verdict (BLOCK→7, LAND→9). The only exception, t2c's first ruling at 6/10, is also the ruling with the most accepted functional MUSTs (3 against 1–2), but that is one case.

**What the data cannot say:**
- Recall: the ground truth is the seat's own acceptance.
- Role value: role tags appear only on sol r1.
- Independence: astra reads the sol reports before ruling, so a match can be an echo.
- Model vs position: astra is the only rung that reviews the fixes made after sol r3, and its unique functional catches are mostly defects in those late fixes.
- LAND reports have no answering fix brief, so their findings show as `unmatched`, meaning no seat ruling exists, not that the seat rejected them.

No role is ruled ceremony.

**`npm test`:** 72 files, 71 pass, 0 fail, 1 skip (a pre-existing skip); 4500 checks.

**Residuals:**
- **Size ceiling crossed.** The code is 783 lines plus 166 test lines across 19 files (12 of them data), over the advisory ≤10 files / ≤600 LOC. Per the checkpoint rule I wrote `CHECKPOINT.md` and stopped there.
- **Not done yet:** the sol review and the land. The review brief and the exact command are ready in `CHECKPOINT.md`; it runs on the Codex subscription, about 5–10 minutes.
- **Spend:** judge calls cost $10.11, including labels I had to redo after two extraction fixes. This session shows about $6.6, so roughly $17 in total against the $25 budget.
- **Optional follow-up:** making P2 and P3 answerable would need sharper label definitions and a re-label, about $7 of judge calls.

**The one claim most likely wrong:** P1 on the original 5 lanes. It flips between the two matchers, and my hand read that breaks the tie was not a pre-registered step.

VERDICT: DONE
