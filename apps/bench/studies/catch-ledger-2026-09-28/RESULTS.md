# Catch ledger — results (E1, 2026-09-28; rebuilt after sol r2 BLOCK)

## P1: UNRESOLVED

**Land posture: measurement tooling only.** Nobody should change review practice, model choice,
roles or spend on the strength of these numbers until two controls have been run: a
**seeded-defect control**, where known defects are planted and recall is measured, and a
**clean-patch control**, where a defect-free patch is reviewed and false positives are measured.
Both are prerequisites. Neither has been run.

**P1 (astra's first ruling adds a seat-accepted functional catch that no sol finding matched, on ≥ 2 lanes) is
UNRESOLVED.** The reasons are below. The per-matcher numbers under "Claims" are detail only. They are
not an answer.
- **Every one of the 18 P1 rows has `semantic` disposition confidence.** "Accepted" is the judge's reading that
  a fix-brief quote answers the row. No verified quote names any of these rows by number or shares a 6-word span with it.
- **The answer moves with analysis choices made after the data existed.** Before the `same_as`/`covers`
  split, matcher B said NO on the original 5 lanes. After the split, both matchers say YES. When a
  post-hoc change to the relation definition flips the answer, the answer is not settled.
- **Two matchers agreeing does not make the matching reliable.** No κ or human check exists for
  matching. The audit below still finds over-merged components under B. It also finds at least one
  pair that A plausibly under-matched (`l3/astra-r1#2` ~ `l3/sol-r2#13`).
- **No control was run.** The pre-registration's "YES → the rung is not ceremony" is withdrawn for this dataset.

## What this evidence licenses

**Most of the distinctive functional catches are defects in fixes made after sol's last round, and
only astra reviewed those fixes. The evidence licenses "review the final fixes again". It does
not license "use astra", any particular reviewer role, or astra's cost premium.**

Here the reviewer and the position are the same variable: astra is the only rung that reads the
post-sol-r3 folds. Nothing in this corpus separates "a second model catches more" from "whoever
reviews the last fix catches its defects". (The claim that most of these catches are late-fold defects comes from the r1 reading. It was not re-derived row by row for the rebuilt P1 set.)

**Confirm rounds (astra r2) are not measured here** (see "Confirm rounds" below). "29 findings,
1 accepted, 1 unique" counts only newly accepted defects.

**P3 must not be used operationally**, because κ(origin) = 0.52 fails the gate. **P4 is scoped to
this corpus.** After the rebuild, the t2c alignment is back (see P4).

Pre-registration: `PREREG.md`, committed in `fcf012d` **before** any judge call (dated amendments at
its foot, including the relation split). Every number below comes from `results.json` / `table.md`, rebuilt with **no model call**
by `node apps/bench/catch-ledger.mjs build`. That command reads only the committed extraction plus
cached judge output whose prompt hash matches today's prompts.

## Reproduce

```bash
ls docs/reviews/tranche*-2026-09-28/ | grep -cE -- '-(sol-r[0-9]|astra-land|astra-r[0-9])\.md$'   # 35 reviewer reports
ls docs/reviews/tranche*-2026-09-28/ | grep -cE -- '-fix[0-9]*-brief\.md$'                          # 28 fix briefs
ls docs/reviews/tranche*-2026-09-28/ | grep -cE -- '-worker-r[0-9]+\.md$'                          # 36 worker reports
node apps/bench/catch-ledger.mjs extract   # structural; deterministic (test asserts byte-identical reruns)
node apps/bench/catch-ledger.mjs build     # κ, table, claims from cached labels; exits 1 if any label is missing
node apps/bench/test/catch-ledger.test.mjs # κ by hand, extractor, matcher stages, judge fail-closed
# re-labelling (spends): label a · label b · label c · match a · match b
# pre-split graphs, for the before/after below: git show 3dca12e:apps/bench/studies/catch-ledger-2026-09-28/{ledger.jsonl,results.json}
```

## Extraction

- 35/35 reports yield rows, so **no report is unparsed**. The extraction produced 361 rows: 120 finding, 150 carry and 91 verification.
- Every other top-level block (367) is logged in `skipped.jsonl` with a reason, and a test asserts that no top-level item is lost. Of those 367:
  - 197 are notes-section bullets;
  - 47 are MUST/CARRY/NEW label lines;
  - 28 were attached as the body of the preceding item;
  - 95 are ruling prose.
- The judge labelled 240 of the 270 non-verification rows as findings. **42 of them are within-report duplicates**, which leaves **198 distinct findings**. A row counts as a duplicate in two cases:
  - an earlier row of the same report is in its `same_as` component;
  - it `covers` another row of the same report. The bundle is dropped and the atomic rows stay. This case accounts for 15 of the 42.
- History of these counts: before the relation split, with one relation, they were 65 and 175; with direct edges (r0) they were 48 and 192.
- **By design, a defect stated only in a reviewer's prose, and never itemized, is not a row.** Example: t2b-astra-land §D, "**MED:** accidental slot consumption".
- Fix briefs: 23 answer a report; 5 answer no reviewer (l2-fix2, t2a-fix, t2b-fix2, t2c-fix, t2c-fix5 are seat- or worker-raised). Lane u and the LAND reports have no answering brief, so their findings are `unmatched` by construction.

## Reliability (κ, Cohen, n = 40 seeded sample; A = Opus 5.5, B = Sonnet 5, independent calls; labels unchanged by the split)

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
- **`match_confidence`** is now implemented as pre-registered. It is structural and computed from the stored quote, with no model call (`matchConfidence` in `lib/catch-stats.mjs`). Of the 101 accepted distinct findings, **14 are `explicit`** (the quote names the item or shares a ≥6-word span with it) and **87 are `semantic`**. **All 18 P1 rows (matcher A) are `semantic`.** The rule is conservative and probably undercounts explicit matches, since a brief can answer a finding in its own words. It is an honest structural rule, not a calibrated confidence. The accepted-based numbers therefore rest mainly on the judge's reading that a brief quote answers a finding.
- The per-row pairs are in `kappa-pairs.json`.

## Match relation: `same_as` vs `covers` (sol r2 HIGH)

The matcher used to have one relation: "restatement, summary, or subset". The stats took connected components over it. Containment is neither symmetric nor transitive, so a bundling row welded together the distinct defects it bundled. Example: `t2c/astra-r1#5` summarises `#2` and `#3`, and so made `#3` a duplicate of `#2`.

The judge now outputs two lists (`lib/catch-judge.mjs` `MATCH_GUIDE`, `matchSchema`):
- `same_as` is equivalence: the same single defect.
- `covers` is directed containment.

The stats treat them as follows (`matchGraph`, `buildLedger` in `lib/catch-stats.mjs`):
- Components are taken over `same_as` only.
- A row counts as matched at rung R if either (a) its component contains an R row, or (b) it has a one-hop containment edge, in either direction, to a row whose component contains an R row.
- Validation fails closed. An unknown id, or an id listed in both fields, throws.

Both matchers were re-run with the new prompt.

| graph (`results.json` → `match_graph`) | components | multi-row | ≥ 3 rows | largest | `same_as` pairs | `covers` pairs | mutual covers → same_as | same_as-vs-covers → covers |
|---|---|---|---|---|---|---|---|---|
| A before (one relation) | 132 | 59 | 24 | 8 | — | — | — | — |
| **A after** | **189** | 45 | **5** | **4** | 58 | 66 | **0** | 0 |
| B before (one relation) | 88 | 54 | 32 | 17 | — | — | — | — |
| **B after** | **173** | 50 | **10** | **4** | 91 | 92 | **0** | 0 |

The "before" rows were computed from the superseded records, which are still in `matches-a/b.jsonl`, against the 3dca12e ledger pool.

Under A, `t2c/astra-r1#5` now `covers` `#2` and `#3`, and these three are in three separate components. `#5` is the within-report duplicate. `#3` is no longer a duplicate of `#2`. This case is the regression test "bundle:" in `test/catch-ledger.test.mjs`.

### Component audit: every `same_as` component of ≥ 3 rows, read from the row bodies

**The l2 8-row components (named in sol r2) no longer exist.** Under A the old component
`l2/astra-r1#3 · astra-r1#6 · astra-r2#6 · sol-r3#14 · #15 · #16 · #20 · #21` breaks up as follows:
- `astra-r1#6` and `sol-r3#20` are bundles, and now `cover` the atomic rows;
- `sol-r3#16` ~ `#21` is kept as a real pair (accumulated deny cap leak / bound the ratchet);
- `astra-r1#3` (docs wording) is isolated.

The other l2 8-row component (`astra-r1#5 · sol-r1#6 · sol-r2#7–#10 · #15 · sol-r3#19`) keeps only `astra-r1#5` ~ `sol-r3#19` (both are "pathological regex can hang the gate; isolate"; this is right). `sol-r2#15` now covers `sol-r2#7–#10`, and `sol-r1#6` covers the regex pair. Under B, no l2 component has 3 or more rows.

Matcher A (5):
- `t2a/astra-r1#4 · astra-r2#5 · sol-r1#1 · sol-r3#17`: **one issue, borderline.** `sol-r1#1` is the original "untrusted OBJECTIVE.md becomes governing" defect. The other three are its residual semantic-steering policy decision, which is arguably a narrower part, i.e. `covers` rather than `same_as`. No P1 effect, because the astra rows would be sol-matched through containment either way.
- `l3/astra-r2#9 · sol-r2#13 · sol-r3#11`: **one defect**. L5 must not treat read errors as absence.
- `t2c/astra-r1#7 · astra-r2#13 · astra-r3#7`: **one defect** (the separate deny-policy fix).
- `t2c/astra-r2#6 · #10 · astra-r3#3`: **one defect** (broken `trust.json` symlink diagnosis/remedy).
- `t2c/astra-r2#8 · #12 · astra-r3#5`: **one defect** (hook-cwd relative-override resolution).

Matcher B (10). The 3 that A shares (deny-policy, hook-cwd, t2a governing prose) have the same verdicts as above. The rest:
- `l3/astra-r1#2 · astra-r2#9 · sol-r2#13 · sol-r3#11`: **borderline over-merge.** `astra-r1#2` is the specific broken-store (dangling entry) case. The others are the L5 missing-vs-error contract.
- `t2a/sol-r2#9 · #14 · sol-r3#15 · #18`: **over-merged.** r2#9 (incomplete UTF-8 at EOF never flushed) and r3#15 (invalid continuation after the cap, a defect in the fold) are different defects. This is all sol, so there is no P1 effect.
- `t2b/sol-r2#11 · #16 · #17 · #18`: **mildly over-merged.** `#11` is itself a bundle (untracked/EOL/modes/submodules), and `#17` (stage-only invariant) is plausibly distinct. This is all one sol report. It affects only within-report duplicate counts.
- `t2b/sol-r2#12 · #19 · sol-r3#6 · #8`: **borderline.** r2 is "completion never re-verifies the tree" and r3 is "the fix leaves a pre-lock TOCTOU window". Same family, but arguably a fold defect. All sol.
- `t2c/astra-r1#2 · astra-r2#7 · #11 · astra-r3#4`: **borderline over-merge.** `astra-r1#2` is the concrete `trust.json.lock` obstruction. The r2/r3 rows are the broader "writability pre-checks are not proof". No sol row is involved.
- `t2c/astra-r1#3 · astra-r2#6 · #10 · astra-r3#3`: **over-merged.** `astra-r1#3` is a dangling agent-*directory* symlink, and the others are a broken `trust.json` *file* symlink. No sol row is involved.
- `t2a/sol-r2#7 · #12 · #15`: **one defect** (the no-lines "governing" incoherence, its remedy, and its test).

**Also over-merged, and affecting P1 under B: a 2-row component.** B puts `t2c/astra-r1#5` (lock-path + dangling-dir bundle) `same_as` `t2c/sol-r2#6` (truthful trust-store failure label). Through that edge, `#2` and `#3` become sol-matched by containment. So B's drop of `t2c/astra-r1#2` from P1 rests on a questionable edge. The error runs in the conservative direction, making astra look less unique.

Net: A's ≥3 components are sound, with one borderline. **B still over-merges**: 2 of its 10 components are clearly over-merged and 1 mildly, 3 more are borderline, and a 2-row edge feeds P1. Nothing was excluded, and every count below uses the graphs as produced. Over-merging can only lower uniqueness. Under-matching, which the split makes more likely, raises it.

## Table (pass-A labels, pass-A matcher, `same_as` components + containment; `table.md`)

| model | round | class | found | of which CARRY rows | accepted | unique-accepted |
|---|---|---|---|---|---|---|
| astra | r1 | evolvability | 11 | 5 | 9 | 8 |
| astra | r1 | functional | 28 | 18 | 11 | 9 |
| astra | r2 | evolvability | 6 | 2 | 0 | 0 |
| astra | r2 | functional | 23 | 20 | 1 | 1 |
| astra | r3 | functional | 5 | 5 | 0 | 0 |
| sol | r1 | evolvability | 16 | 6 | 5 | 4 |
| sol | r1 | false_positive | 1 | 0 | 0 | 0 |
| sol | r1 | functional | 40 | 10 | 31 | 26 |
| sol | r2 | evolvability | 15 | 9 | 6 | 6 |
| sol | r2 | functional | 27 | 8 | 22 | 20 |
| sol | r3 | evolvability | 8 | 5 | 5 | 5 |
| sol | r3 | functional | 18 | 10 | 11 | 11 |

Cross-report edges by structural stage, under A (`match_pairs_by_stage`):
- `same_as`: 31 edges. 0 are supported by line ±5, 1 by a same-file hint, and 30 are semantic-only.
- `covers`: 34 edges. 0 are supported by line ±5, 1 by a same-file hint, and 33 are semantic-only.

The structural stages of the AACR matcher barely fire on this corpus, because CARRY rows and docs findings cite no `file:line`.

**Path-normalisation caveat (kept).** The matcher prompts, including this round's re-run, show the judge the legacy basename-only hints, so the bias measurement stays comparable. `build` measures the bias:
- 11 of the 241 hints shown are false under full-path comparison (9 on t2b, 2 on t2c, all `file`-level).
- **Matcher A put an edge (of either kind) on none of them** (`false_hints_shown_to_judge`).
- The stage counts above use path-aware hints.
- `samePath` now resolves `..` canonically (`a/b/../c` → `a/c`) instead of deleting it.

## Claims

**P1: UNRESOLVED** (see top). **The following is detail, not an answer.** Source: `results.json` → `p1_by_matcher`. A row counts as sol-matched through its `same_as` component, or through one containment hop.

| matcher | sol-unmatched accepted rows (functional) | functional lanes | ≥2 of 6 | ≥2 of original 5 |
|---|---|---|---|---|
| A, one relation, *before split* | 15 (7) | l1 l2 l3 t2b t2c | YES | YES |
| B, one relation, *before split* | 4 (2) | l3 t2c | YES | NO |
| A, split | 18 (10) | l1 l2 l3 t2b t2c | YES | YES |
| B, split | 10 (5) | l1 l2 l3 t2b t2c | YES | YES |
| A ∩ B, split | 9 (5) | l1 l2 l3 t2b t2c | YES | YES |

- What the split changed under A: it added `l2/astra-r1#3`, `l3/astra-r1#2`, `t2b/astra-r1#1` and `t2c/astra-r1#3`, and dropped `t2a/astra-r1#1`.
- Under B it added 7 rows, mostly rows that B's old 17-row component had absorbed, and dropped `t2c/astra-r1#2`. That drop comes via the questionable `#5` ~ `sol-r2#6` edge.
- In A ∩ B, each of the 5 lanes rests on **exactly one** functional row: `l1/astra-r1#4`, `l2/astra-r1#1`, `l3/astra-r1#1`, `t2b/astra-r1#2` and `t2c/astra-r1#1`. All five are `semantic`.
- `l1/astra-r1#4` reads as a risk note ("concurrent SDK isolation untested: potential cross-session impact"), not a demonstrated defect.
- Of astra-r1's 20 accepted distinct findings, only 2 are sol-matched under A. That is a large drop from the one-relation graph. Some of it is correct un-welding. Some of it is plausibly under-matching: the audit found `l3/astra-r1#2` ~ `l3/sol-r2#13` and judged that A missing it is plausible.
- **This is not evidence that "astra's rung is not ceremony"**, whatever the per-matcher table says.

**P2: sol r3, new scope vs verification.** 58 sol-r3 items:
- **32 are structural verification lines** (FIXED / PARTIAL / RULED). This part is regex.
- 26 are distinct findings. Opus labels 17 of them fold-defect, 5 restatement and **4 new-scope** (15%).
- κ on the relation axis is 0.37 (n = 38; labels are unchanged by the split), so **the data cannot say** whether the cap cuts off mostly new scope.
- The one-relation graph gave 50 items and 18 findings. The split un-merged within-report rows.

**P3: seat specification errors.** 22 of 101 accepted distinct findings (22%) have origin `seat_spec`. t2c alone has 6. The one-relation graph gave 18 of 87.
- κ(origin) = 0.52 < 0.6, so **this is not an answer.** **Do not use it operationally.**

**P4: astra SCORE, and only in this corpus.** The 13 scores are:
- first ruling: BLOCK 7 ×5, BLOCK 6 ×1 (t2c);
- confirm: LAND 9 ×5, BLOCK 7 ×1 (t2c-r2);
- r3: LAND 9 ×1.

12 of 13 scores follow from the verdict alone (BLOCK → 7, LAND → 9). **After the rebuild, the t2c alignment comes back.** t2c-land, the one deviation at 6, again has the most accepted functional findings: 3, against 1–2 on the other first rulings. It had 2 under the one-relation graph, and that drop came from the `#5` over-merge that sol r2 named. That is one data point in the expected direction, with n = 1.
- **In this corpus, SCORE carries no information beyond VERDICT that can be detected.** This does not show that SCORE carries none in general. The corpus cannot test that.

## Confirm rounds (astra r2): what "29 / 1 / 1" measures

The astra-r2 rows are **29 distinct findings, 1 accepted, 1 unique-accepted**. It was 25 / 1 / 1 under the one-relation graph and 27 / 1 / 1 with direct edges. **This measures only whether a confirm round raised a *new* defect that the seat then accepted.** It does not measure what a confirm round is for:
- The six astra-r2 reports extracted 62 rows. **17 are verification rows** ("MUST n FIXED" etc.), and by design verification is never a finding, so that work is invisible in this count.
- **5 of the 6 astra-r2 reports are LAND with no answering fix brief** (l1 l2 l3 t2a t2b). With no seat ruling, every finding in them is forced to `unmatched`, which means *not ruled*, not *rejected*.
- The ledger therefore **cannot say** whether a confirm round correctly verified the MUSTs, caught a bad fold, or safely authorized the land. Do not read "1 accepted" as "confirm rounds are near-valueless".

## What the data cannot say

- **Recall.** The gold standard is the seat's own acceptance, which is circular for precision.
- **Role value.** Role tags appear on sol r1 only (32 findings in 6 reports), and role is confounded with model and round.
- **Independence.** Astra reads the sol reports before it rules, so "matched" can mean "echoed".
- **Model vs position.** Astra is the only rung that reviews the folds made *after* sol's r3. Its sol-unmatched functional catches (A ∩ B: one per lane on l1 l2 l3 t2b t2c) are mostly defects introduced by those late folds. The data cannot separate "astra is a better reviewer" from "astra is the only reviewer of the last fix".
- **Late rounds.** LAND reports have no answering brief. Astra r2/r3 and sol LAND-round findings are therefore mostly `unmatched`, which means *no seat ruling exists*, not *rejected*.

- **Matching reliability.** No κ or human calibration exists for `same_as`/`covers`. The audit above is one reader, and that reader is the worker.

Judge spend: $13.95 in total, including superseded labels and matches (`results.json` → `judge_cost_usd`). This round's re-match cost $0.68 (A) + $3.16 (B).

