# Catch ledger — results (E1, 2026-09-28)

Pre-registration: `PREREG.md`, committed in `fcf012d` **before** any judge call. Every number below
comes from `results.json` / `table.md`, rebuilt with **no model call** by
`node apps/bench/catch-ledger.mjs build`. That command reads only the committed extraction plus
cached judge labels whose prompt hash matches today's extraction.

## Reproduce

```bash
ls docs/reviews/tranche*-2026-09-28/ | grep -cE -- '-(sol-r[0-9]|astra-land|astra-r[0-9])\.md$'   # 35 reviewer reports
ls docs/reviews/tranche*-2026-09-28/ | grep -cE -- '-fix[0-9]*-brief\.md$'                          # 28 fix briefs
ls docs/reviews/tranche*-2026-09-28/ | grep -cE -- '-worker-r[0-9]+\.md$'                          # 36 worker reports
node apps/bench/catch-ledger.mjs extract   # structural; deterministic (test asserts byte-identical reruns)
node apps/bench/catch-ledger.mjs build     # κ, table, claims from cached labels; exits 1 if any label is missing
node apps/bench/test/catch-ledger.test.mjs # κ by hand, extractor, matcher stages, judge fail-closed
# re-labelling (spends): label a · label b · label c · match a · match b
```

## Extraction

- 35/35 reports yield rows, so **no report is unparsed**. The extraction produced 361 rows: 120 finding, 150 carry and 91 verification.
- Every other top-level block (367) is logged in `skipped.jsonl` with a reason, and a test asserts that no top-level item is lost. Of those 367:
  - 197 are notes-section bullets;
  - 47 are MUST/CARRY/NEW label lines;
  - 28 were attached as the body of the preceding item;
  - 95 are ruling prose.
- The judge labelled 240 of the 270 non-verification rows as findings. Of those, 48 are within-report restatements (a CARRY line summarising the report's own finding), which leaves **192 distinct findings**.
- **By design, a defect stated only in a reviewer's prose, and never itemized, is not a row.** Example: t2b-astra-land §D, "**MED:** accidental slot consumption".
- Fix briefs: 23 answer a report; 5 answer no reviewer (l2-fix2, t2a-fix, t2b-fix2, t2c-fix, t2c-fix5 are seat- or worker-raised). Lane u and the LAND reports have no answering brief, so their findings are `unmatched` by construction.

## Reliability (κ, Cohen, n = 40 seeded sample; A = Opus 5.5, B = Sonnet 5, independent calls)

| axis | κ | p_o |
|---|---|---|
| is_finding | 0.72 | 0.95 |
| **top-level class (gate)** | **0.71** | 0.85 |
| sub-class | 0.64 | 0.70 |
| disposition | 0.79 | 0.875 |
| origin (P3) | **0.52** → P3 unreliable | 0.675 |
| P2 relation (post-hoc, all sol-r3 findings, n = 38) | **0.37** → P2 split unreliable | 0.55 |

- The gate passed (0.71 ≥ 0.6), so the table is published.
- All 145 accepted/overridden/carried dispositions carry a fix-brief quote. All 145 were found verbatim, and any quote not found would have been forced to `unmatched`.
- The per-row pairs are in `kappa-pairs.json`.

## Table (pass-A labels, pass-A matcher; `table.md`)

| model | round | class | found | of which CARRY rows | accepted | unique-accepted |
|---|---|---|---|---|---|---|
| astra | r1 | evolvability | 12 | 6 | 9 | 8 |
| astra | r1 | functional | 28 | 18 | 11 | 7 |
| astra | r2 | evolvability | 6 | 2 | 0 | 0 |
| astra | r2 | functional | 21 | 18 | 1 | 1 |
| astra | r3 | functional | 5 | 4 | 0 | 0 |
| sol | r1 | evolvability | 16 | 6 | 5 | 5 |
| sol | r1 | false_positive | 1 | 0 | 0 | 0 |
| sol | r1 | functional | 40 | 10 | 31 | 25 |
| sol | r2 | evolvability | 15 | 9 | 5 | 5 |
| sol | r2 | functional | 24 | 4 | 19 | 14 |
| sol | r3 | evolvability | 6 | 4 | 3 | 3 |
| sol | r3 | functional | 18 | 10 | 11 | 9 |

Matcher stages across the 87 cross-rung matched pairs:
- **4 were supported by a same-file hint**;
- **0 by line ±5**;
- **83 were semantic-only**.

The structural stages of the AACR matcher barely fire on this corpus. CARRY rows and docs findings cite no `file:line`.

## Claims

**P1: astra's first ruling contributes a seat-accepted functional finding that no sol finding matched, on ≥ 2 lanes.**
- **YES under the pre-registered matcher.** It holds on 5 of 6 lanes (l1, l2, l3, t2b, t2c) and on 4 of the original 5.
- Astra-r1 had 20 accepted findings; 16 are sol-unmatched, of which 8 are functional and 8 evolvability.
- **Matcher-sensitive.** With the Sonnet matcher, only l3 and t2c qualify. That is still YES on 6 lanes, but NO on the original 5.
- I hand-read the 5 pairs where the two matchers disagree:
  - In 4 of them, Sonnet paired astra's catch with a sol finding in the same area that is a different defect. Example: l2's `--version` stdin bypass is a regression introduced by the fix for sol's r2 stdin finding.
  - One is borderline: t2c#1 against sol-r3 `PI_CODING_AGENT_DIR`.
- Astra's unique accepted catches are **not** all evolvability, so the "documentation check" reading is not supported.
- This does not rule on ceremony. No seeded-defect or clean-patch control was run.

**P2: sol r3, new scope vs verification.** 56 sol-r3 items:
- **32 (57%) are structural verification lines** (FIXED / PARTIAL / RULED). This part is regex, not the judge.
- 24 are distinct findings. Opus labels 15 of them fold-defect, 5 restatement and **4 new-scope**. Sonnet labels 11 new-scope.
- κ on the relation axis is 0.37, so **the data cannot say** whether the cap cuts off mostly new scope. It can say that most of r3's items re-verify earlier folds.

**P3: seat specification errors.** 19 of 95 accepted findings (20%) have origin `seat_spec`; t2c alone has 6.
- κ(origin) = 0.52 < 0.6, so **per the pre-registration this number is unreliable and is not an answer.**

**P4: astra SCORE.** The 13 scores are:
- first ruling: BLOCK 7 ×5, BLOCK 6 ×1 (t2c);
- confirm: LAND 9 ×5, BLOCK 7 ×1 (t2c-r2);
- r3: LAND 9 ×1.

12 of 13 scores follow from the verdict alone (BLOCK → 7, LAND → 9). The one deviation, t2c-land at 6, is also the ruling with the most accepted functional MUSTs (3, against 1–2 elsewhere). That is n = 1. **SCORE carries no information beyond the verdict that this corpus can detect.**

## What the data cannot say

- **Recall.** The gold standard is the seat's own acceptance, which is circular for precision.
- **Role value.** Role tags appear on sol r1 only (32 findings in 6 reports), and role is confounded with model and round.
- **Independence.** Astra reads the sol reports before it rules, so "matched" can mean "echoed".
- **Model vs position.** Astra is the only rung that reviews the folds made *after* sol's r3. Its unique functional catches (l2, t2c ×3) are mostly defects introduced by those late folds. The data cannot separate "astra is a better reviewer" from "astra is the only reviewer of the last fix".
- **Late rounds.** LAND reports have no answering brief. Astra r2/r3 and sol LAND-round findings are therefore mostly `unmatched`, which means *no seat ruling exists*, not *rejected*.

Judge spend: $10.11 in total, including labels superseded by extraction fixes (see `results.json`).
