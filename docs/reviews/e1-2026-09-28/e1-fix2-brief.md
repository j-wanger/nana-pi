# Worker brief — E1 fix round 2 (Opus 5.5), after sol r2 BLOCK

Worktree `~/nana-pi-wt/e1`, branch `lane/e1-catch-ledger` (HEAD `3dca12e`). Read
`~/nana-pi/docs/reviews/e1-2026-09-28/sol-r2.md` first. Your r1 fixes are confirmed FIXED on
four of six items; two HIGHs remain PARTIAL, and the reviewer's own residual — the unaudited
8-row l2 component — turned out to be the same defect it names.

This is the last review round on this lane (three-round cap). After your report the seat either
lands it as measurement tooling or subtracts it.

## MUST 1 (HIGH) — one relation is doing two jobs; split it

`lib/catch-judge.mjs:84` (`MATCH_GUIDE`) tells the judge that a row matches another if it is
"a restatement, **summary, or subset** of the other (e.g. a CARRY bullet that summarises an earlier
finding)". `lib/catch-stats.mjs:74-105` then treats every such edge as an equivalence edge and takes
connected components. A bundling row therefore welds the distinct defects it bundles into one
component. sol's instance: `t2c/astra-r1#5` summarises both `#2` and `#3`, so `#3` becomes a
duplicate of `#2` although they are different defects. The 8-row l2 component is the same shape.
Containment is not transitive and is not symmetric; components over it are unsound.

Split the relation at the source. In `matchSchema` and `MATCH_GUIDE`:

- `same_as` — **equivalence only**: the rows describe the SAME single defect; fixing either one
  fixes the other completely, in both directions. Symmetric.
- `covers` — **containment, directed**: the other row's defect is only PART of what this row claims
  (this row bundles two or more distinct defects, or is strictly broader and the other is one
  instance of it). List only rows narrower than this one. An id must never appear in both fields for
  the same row.

Then in `lib/catch-stats.mjs`:

- `components()` is computed from `same_as` edges ONLY. Containment never merges.
- Mutual containment (A covers B and B covers A) is a contradiction the judge is allowed to make:
  resolve it deterministically as `same_as` and count it in `results.json`.
- **Matched / unique** (this is what P1 reads): a row is matched at rung R if a member of its
  `same_as` component is at rung R, **or** it has a containment edge in either direction to a row
  whose component contains a rung-R row. Containment denies uniqueness but never merges — that is
  conservative in the direction that makes astra look less unique, which is the right way to be
  wrong here.
- **Within-report duplicates:** as now, an earlier same-report row in the same component; **plus**
  a row that `covers` another row of the same report is itself the duplicate and is dropped — the
  bundle goes, the atomic rows stay, whatever their order. Never drop anything across reports.
- Validation stays fail-closed: unknown id in `covers`, or an id in both fields, throws.

Re-run `match a` and `match b` (the prompt changes, so the cache keys change and both re-run;
matcher A cost $0.66 and matcher B $2.69 last time). Then `build`. Every count in `RESULTS.md`,
`table.md` and `results.json` is rebuilt from the new graphs — including the numbers the seat has
already reported.

## MUST 2 (HIGH) — P1 reads UNRESOLVED, full stop

`RESULTS.md:14-19,117`. sol: *"It must read **P1: UNRESOLVED** outright. 'Six lanes: YES' rests
exactly at threshold on two semantic-disposition rows; one decision flips it, and matcher agreement
is not reliability."* Make the P1 headline the words **P1: UNRESOLVED** with no qualifying "YES on
6 lanes" in the headline position. The per-matcher numbers stay below as detail, labelled as
detail. Same in the claims section. A reader who reads only the top of the file must not come away
with a YES.

## MUST 3 — audit the components you now produce

For every `same_as` component of 3 or more rows, state in `RESULTS.md` the component's row ids and
one line saying whether they really are one defect, read by you from the row bodies. If any still
looks over-merged after MUST 1, say so in the file and exclude nothing silently. The l2 8-row
component is named in the review; it gets its own line either way.

## MUST 4 — P4 stays scoped, not unconditional

sol: *"Do not strengthen it unconditionally. The t2c 3→2 change is itself caused by the #5 summary
over-merge."* P4 may claim only: **in this corpus** SCORE carries no information beyond VERDICT. Not
that SCORE carries none generally. Re-derive the P4 numbers after MUST 1 and say plainly if the
t2c alignment comes back.

## MUST 5 — land posture, in the files

`RESULTS.md` (and `CHECKPOINT.md`) must say that this lands as **measurement tooling only**, and
that a seeded-defect control and a clean-patch control are prerequisites before anyone changes
review practice, model choice, roles or spend on the strength of it.

## Also
- **LOW carry:** `samePath` in `lib/catch-stats.mjs:32-38` deletes `..` segments; resolve them
  canonically (`a/b/../c` → `a/c`) instead. Keep the path-normalization caveat in `RESULTS.md` —
  the cached matcher runs were prompted with basename hints and the bias measurement stays.
- `match_confidence` stays as built. Keep sol's note that it is conservative and probably undercounts
  explicit matches, and that it is an honest structural rule, not calibrated confidence.
- Amend `PREREG.md` in place with a dated note: the match relation was split into `same_as` /
  `covers` after labelling, why, and that all matcher output was regenerated.

## NOT
Do not re-run `label a`, `label b` or `label c` — labels are unaffected and re-labelling would cost
real money for nothing. Do not add new claims, do not rule any role ceremony, do not touch anything
outside `apps/bench/**`. `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; `same_as` and `covers` are separate in schema, guide and stats; both matchers
re-run and every count rebuilt; the bundled-summary case is a regression test (a row covering two
rows leaves those two distinct, and the bundle is the within-report duplicate); `RESULTS.md` leads
with `P1: UNRESOLVED`.

## Report (≤20 lines)
Commit · what the split changed in the graphs (components merged before / after, mutual-containment
count) · P1 numbers under A, B and the intersection after the rebuild · the component audit verdict
including l2 · P4 after rebuild · `npm test` · spend · residuals · the one claim most likely wrong ·
`VERDICT: DONE`.
