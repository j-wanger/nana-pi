# Catch ledger — results (E1, 2026-09-28; corrected 2026-09-28 after sol r1 BLOCK)

## The finding — what this evidence licenses

**Most of the distinctive functional catches are defects in fixes made after sol's last round, and
only astra reviewed those fixes. The evidence licenses "review the final fixes again". It does
not license "use astra", any particular reviewer role, or astra's cost premium.**

Here the reviewer and the position are the same variable: astra is the only rung that reads the
post-sol-r3 folds. Nothing in this corpus separates "a second model catches more" from "whoever
reviews the last fix catches its defects". To separate them, a sol re-review of the same final
folds, a seeded-defect run or a clean-patch control is needed. None was run.

**P1 is unresolved on the original five lanes, and it is not evidence either way about ceremony.**
It depends on the matcher (details under Claims). Under matcher A it is YES on the 6 lanes and on
the original 5. Under matcher B, and under the intersection of the two, it is YES on 6 and NO on
the original 5. The 6-lane YES rests on 2 rows, l3/astra-r1#1 and t2c/astra-r1#2, and both have
`semantic` disposition confidence. A result that changes with the matcher is **not** evidence that
"astra's rung is not ceremony". The pre-registration's "YES → the rung is not ceremony on this
evidence" is withdrawn for this dataset. Settling P1 needs the controls the research specified.

**Confirm rounds (astra r2) are not measured here** (see "Confirm rounds" below). "25 findings,
1 accepted, 1 unique" counts newly accepted defects only. It does not say whether a confirm round
correctly verified the MUSTs or safely authorized the land.

**P3 must not be used operationally.** Do not quote "~20% trace to seat specification error": κ(origin)
= 0.52 fails the gate.

Pre-registration: `PREREG.md`, committed in `fcf012d` **before** any judge call (dated amendments at
its foot). Every number below comes from `results.json` / `table.md`, rebuilt with **no model call**
by `node apps/bench/catch-ledger.mjs build`. That command reads only the committed extraction plus
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
- The judge labelled 240 of the 270 non-verification rows as findings. Of those, 65 are within-report restatements: a later row whose same-defect *component* already holds an earlier row of the same report, typically a CARRY line summarising the report's own finding. That leaves **175 distinct findings**. Before the component fix, which used direct edges, the figures were 48 and 192.
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
- **Sample wording.** PREREG says "40 findings". The sample was actually drawn over all 270 non-verification rows, so it includes rows that a judge labels `not_a_finding` (3 by A, 5 by B). Among the 35 rows that both judges call findings, κ(top) = 0.735 (`kappa.top_given_both_finding`), so the gate outcome does not change.
- All 145 accepted/overridden/carried dispositions carry a fix-brief quote. All 145 were found verbatim, and any quote not found would have been forced to `unmatched`. Verbatim only proves that the text exists *somewhere in the brief*, not that it addresses this finding.
- **`match_confidence`** is now implemented as pre-registered. It is structural and computed from the stored quote, with no model call (`matchConfidence` in `lib/catch-stats.mjs`). Of the 87 accepted distinct findings, **14 are `explicit`** (the quote names the item or shares a ≥6-word span with it) and **73 are `semantic`**. **All 15 P1 rows are `semantic`.** The accepted-based numbers therefore rest mainly on the judge's reading that a brief quote answers a finding.
- The per-row pairs are in `kappa-pairs.json`.

## Table (pass-A labels, pass-A matcher, same-defect components; `table.md`)

| model | round | class | found | of which CARRY rows | accepted | unique-accepted |
|---|---|---|---|---|---|---|
| astra | r1 | evolvability | 12 | 6 | 9 | 8 |
| astra | r1 | functional | 25 | 16 | 10 | 6 |
| astra | r2 | evolvability | 6 | 2 | 0 | 0 |
| astra | r2 | functional | 19 | 17 | 1 | 1 |
| astra | r3 | functional | 5 | 4 | 0 | 0 |
| sol | r1 | evolvability | 16 | 6 | 5 | 5 |
| sol | r1 | false_positive | 1 | 0 | 0 | 0 |
| sol | r1 | functional | 39 | 9 | 31 | 25 |
| sol | r2 | evolvability | 14 | 9 | 5 | 5 |
| sol | r2 | functional | 20 | 4 | 15 | 10 |
| sol | r3 | evolvability | 4 | 2 | 2 | 2 |
| sol | r3 | functional | 14 | 8 | 9 | 7 |

Matcher stages across the 87 cross-rung matched pairs:
- **4 were supported by a same-file hint**;
- **0 by line ±5**;
- **83 were semantic-only**.

The structural stages of the AACR matcher barely fire on this corpus. CARRY rows and docs findings cite no `file:line`.

**Hints shown to the judge.** The cached matcher runs (`matches-a/b.jsonl`) were prompted with the old basename-only rule. Re-running them with path-aware hints would change the prompt hash and require new matching spend, which this round rules out. So `build` measures the bias instead. Of the 241 hints shown, 11 are false under full-path comparison: 9 are on t2b and 2 on t2c, all `file`-level. **Matcher A put an edge on none of the 11** (`false_hints_shown_to_judge`). The stage counts above use path-aware hints.

## Claims

**P1: astra's first ruling contributes a seat-accepted functional finding that no sol finding matched, on ≥ 2 lanes.**

This is computed over same-defect **components**, where "matched" means sharing a connected component with a sol finding. It is no longer based on direct judge edges. The table below is `results.json` → `p1_by_matcher`.

| matcher | sol-unmatched accepted rows (functional) | functional lanes | 6 lanes | original 5 |
|---|---|---|---|---|
| A (Opus), direct edges, *before fix* | 16 (8) | l1 l2 l3 t2b t2c | YES | YES |
| A (Opus), components | **15 (7)** | l1 l2 l3 t2b t2c | YES | YES |
| B (Sonnet), direct edges, *before fix* | 6 (2) | l3 t2c | YES | NO |
| B (Sonnet), components | **4 (2)** | l3 t2c | YES | NO |
| **A ∩ B** (row sol-unmatched under both) | **4 (2)** | l3 t2c | YES | **NO** |

- The component fix drops `t2c/astra-r1#3` under both matchers, and `l3/astra-r1#5` (evolvability) under B. The lane-level answers do not move.
- **Original 5: unresolved.** A says YES and B / A∩B say NO. This sample cannot settle it.
- **6 lanes:** YES under all three. It rests on exactly two rows: l3/astra-r1#1 (legacy-file exclusion bypassed via custom config) and t2c/astra-r1#2 (folder writability ≠ pi lock usability). Both have `semantic` disposition confidence.
- **This is not evidence that "astra's rung is not ceremony".** Taken at its strongest, the 6-lane YES says that something reviewed the late folds and caught defects in them. See "The finding" at the top.
- Astra-r1 had 19 accepted distinct findings. Under A, 15 are sol-unmatched: 7 functional and 8 evolvability. Under A, the unique catches are not all evolvability, so the "documentation check" reading is not supported under A. Under B, 2 of 4 are evolvability.
- The earlier hand-read of the 5 matcher disagreements was not pre-registered and **is withdrawn as an adjudication**. The worker cannot adjudicate its own headline.

**P2: sol r3, new scope vs verification.** 50 sol-r3 items:
- **32 (64%) are structural verification lines** (FIXED / PARTIAL / RULED). This part is regex, not the judge.
- 18 are distinct findings. Opus labels 11 of them fold-defect, 4 restatement and **3 new-scope**. Sonnet labels 7 new-scope.
- κ on the relation axis is 0.37 (n = 38, all sol-r3 finding rows), so **the data cannot say** whether the cap cuts off mostly new scope. It can say that most of r3's items re-verify earlier folds.
- Before the component fix these figures were 56 items, 24 findings, and 4 new-scope under Opus.

**P3: seat specification errors.** 18 of 87 accepted findings (21%) have origin `seat_spec`; t2c alone has 6. Before the component fix this was 19 of 95.
- κ(origin) = 0.52 < 0.6, so **per the pre-registration this number is unreliable and is not an answer.** **Do not use it operationally.** Do not quote it as a rate of seat error, and do not use it to route, weight or budget seat work.

**P4: astra SCORE.** The 13 scores are:
- first ruling: BLOCK 7 ×5, BLOCK 6 ×1 (t2c);
- confirm: LAND 9 ×5, BLOCK 7 ×1 (t2c-r2);
- r3: LAND 9 ×1.

12 of 13 scores follow from the verdict alone (BLOCK → 7, LAND → 9). The one deviation is t2c-land at 6. Before the component fix, t2c-land had the most accepted functional findings (3, against 1–2 elsewhere). After the fix it has 2, tied with l1, l3 and t2b, so even that n = 1 alignment is gone. **SCORE carries no information beyond the verdict that this corpus can detect.**

## Confirm rounds (astra r2): what "25 / 1 / 1" measures

The astra-r2 rows are **25 distinct findings, 1 accepted, 1 unique-accepted**. Before the component fix this was 27 / 1 / 1. **This measures only whether a confirm round raised a *new* defect that the seat then accepted.** It does not measure what a confirm round is for:
- The six astra-r2 reports extracted 62 rows. **17 are verification rows** ("MUST n FIXED" etc.), and by design verification is never a finding, so that work is invisible in this count.
- **5 of the 6 astra-r2 reports are LAND with no answering fix brief** (l1 l2 l3 t2a t2b). With no seat ruling, every finding in them is forced to `unmatched`, which means *not ruled*, not *rejected*.
- The ledger therefore **cannot say** whether a confirm round correctly verified the MUSTs, caught a bad fold, or safely authorized the land. Do not read "1 accepted" as "confirm rounds are near-valueless".

## What the data cannot say

- **Recall.** The gold standard is the seat's own acceptance, which is circular for precision.
- **Role value.** Role tags appear on sol r1 only (32 findings in 6 reports), and role is confounded with model and round.
- **Independence.** Astra reads the sol reports before it rules, so "matched" can mean "echoed".
- **Model vs position.** Astra is the only rung that reviews the folds made *after* sol's r3. Its sol-unmatched functional catches (under A: l2 and t2c ×2, among others; t2c/astra-r1#2 survives both matchers) are mostly defects introduced by those late folds. The data cannot separate "astra is a better reviewer" from "astra is the only reviewer of the last fix".
- **Late rounds.** LAND reports have no answering brief. Astra r2/r3 and sol LAND-round findings are therefore mostly `unmatched`, which means *no seat ruling exists*, not *rejected*.

Judge spend: $10.11 in total, including labels superseded by extraction fixes (see `results.json`).
