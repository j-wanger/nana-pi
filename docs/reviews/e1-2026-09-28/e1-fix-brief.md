# Worker brief — E1 fix round (Opus 5.5), after sol r1 BLOCK (3 HIGH, 2 MED, 1 LOW)

Worktree `~/nana-pi-wt/e1`, branch `lane/e1-catch-ledger` (HEAD `36a7e34`). Read `~/nana-pi/docs/reviews/e1-2026-09-28/sol-r1.md`.

The seat reported your headline to Jake before this review landed and has had to retract it. Two of the three HIGHs are about the result, not the code, and the third is the algorithm that produces it.

## MUST 1 (HIGH) — uniqueness is computed from direct edges, not same-defect components
`lib/catch-stats.mjs:43-65,86-98`. sol's scratch attack supplied a valid chain `sol-r1 ~ astra-r2 ~ astra-r1`: `buildLedger` returned `matched_sol:false` for astra-r1 and `claims()` counted it in `unique_accepted_rows`, although that row has `unique:false` and sits in a component containing sol. "Same underlying defect" is an equivalence relation, so uniqueness must be computed over **connected components**, not direct edges. Fix it, add sol's chain as a regression, and then **recompute P1** — it may change, and that is the point.

## MUST 2 (HIGH) — P1 must be reported as matcher-dependent, not as a finding
On the original five lanes matcher A gives YES on four and matcher B gives NO on all but l3. Your hand-read of the disagreements was not pre-registered and cannot adjudicate your own headline. After MUST 1, report P1 as: the answer under each matcher, the answer under the intersection, and an explicit statement that a matcher-dependent result is **not** evidence for "astra's rung is not ceremony". If the two matchers still disagree, the honest output is that P1 is unresolved at this sample size and needs the controls the research specified.

## MUST 3 (HIGH) — say what the evidence licenses, in the results file itself
sol: *"Most distinctive functional catches are defects in folds made after sol r3, which only astra saw. The evidence licenses 'review the final fixes again'; it does not license 'use astra', a particular reviewer role, or astra's cost premium."* Put that sentence, or a truer one, at the top of `RESULTS.md` as the finding — above P1 — because it is the conclusion the data actually supports and the one a reader will otherwise take away wrongly.

## MUST 4 (INFO→correction) — the confirm-round number is not a measure of confirm rounds
Confirm rounds produced 62 extracted rows including 17 verification rows; verification is excluded from findings by design, and five of six LAND reports have no answering fix brief, so their items are forced to `unmatched`. State in `RESULTS.md` that "27 findings, 1 accepted, 1 unique" measures **newly accepted defects only** and cannot say whether a confirm round correctly verified the MUSTs or safely authorized the land. The seat repeated the wrong reading to Jake; make the file impossible to misread that way.

## Also
- **MED** `lib/catch-stats.mjs:25-39`: `stageHints` compares only the basename, so `src/one/config.ts:10` and `src/two/config.ts:12` are called same-file line-adjacent, and that hint is shown to the judge. Compare full resolved paths.
- **MED** the pre-registered `match_confidence = explicit|semantic` was never implemented (`lib/catch-judge.mjs:38-65,131-147`); quote validation only proves the text exists somewhere in the brief. Implement it or amend the pre-registration in place with a dated note saying it was dropped and why — do not leave the contract unmet silently.
- **LOW** the κ sample is drawn over all non-verification rows, so it includes rows one judge calls `not_a_finding`; the registered wording says 40 findings. Note it; sol confirmed the gate outcome is unchanged (κ 0.735 among rows both judges call findings).
- P3 handling was correct — reported descriptively and declared unreliable. Add one line forbidding its operational use.

## NOT
No new claims. No re-labelling spend. Do not rule any role ceremony. `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; the component fix has sol's chain as a regression; P1 is restated with both matchers and the intersection; `RESULTS.md` leads with what the evidence licenses.

## Report (≤20 lines)
Commit · P1 before/after the component fix (the numbers) · the licensing sentence as it now reads · the confirm-round correction · the two MED fixes · `npm test` · residuals · the one claim most likely wrong · `VERDICT: DONE`.
