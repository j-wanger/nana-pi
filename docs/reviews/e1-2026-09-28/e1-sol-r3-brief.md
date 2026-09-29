# Review brief — E1 catch ledger, round 3 (final), role: adversarial + land posture

You blocked this lane twice. r1 (3 HIGH) and r2 (2 HIGH PARTIAL) are in
`docs/reviews/e1-2026-09-28/sol-r1.md` and `sol-r2.md`. This is the **third and last** round on the
item: after your verdict the seat lands it as measurement tooling, subtracts it, or carries named
residuals. Rule on the artifact in front of you, not on what a fourth round could add.

Worktree `~/nana-pi-wt/e1`, branch `lane/e1-catch-ledger`. Read the worker's report
`docs/reviews/e1-2026-09-28/e1-worker-r3.md` and `git log -p 3dca12e..HEAD`.

## What the fix round was told to do

Your CARRY: *"separate equivalence edges from summary/subset containment (or atomize bundled rows),
rebuild all counts, state P1 simply UNRESOLVED, and retain the path-normalization caveat."* The seat
specified:

1. `matchSchema` / `MATCH_GUIDE` split into `same_as` (equivalence, symmetric) and `covers`
   (directed containment: the other row's defect is only PART of this row's claim).
2. `components()` over `same_as` ONLY; mutual containment resolved as `same_as` and counted.
3. Matched/unique: a containment edge in either direction to a row whose component holds a rung-R
   row denies uniqueness, but never merges.
4. Within-report duplicate: earlier same-report row in the component, **plus** a row that `covers`
   another row of the same report is itself the duplicate, whatever the order.
5. Both matchers re-run, every count rebuilt; `P1: UNRESOLVED` as the headline; P4 scoped to this
   corpus; components of ≥3 rows audited in `RESULTS.md`; `samePath` resolves `..` canonically.

## What to check, in this order

- **Does the split actually hold?** Attack it the way you attacked direct edges: construct a
  scratch `CATCH_REVIEWS`/`CATCH_OUT` corpus where a bundling row covers two distinct rows and a
  third row is equivalent to one of them. Show what the ledger says. Over-merging must be gone AND
  under-matching must not have been introduced — a row genuinely restating one earlier finding must
  still be a duplicate.
- **Is the judge's new instruction answerable?** The two fields are only as good as the model's
  ability to tell "same single defect" from "part of my claim". Read the regenerated
  `matches-a.jsonl` / `matches-b.jsonl`: how often did the judges use `covers`, do the two agree
  about which relation a pair has, and is there a pair where the split is plainly wrong?
- **The component audit (MUST 3).** The l2 component you named: is the worker's written audit
  honest, and does it match what the row bodies say?
- **P1 reporting.** Does the top of `RESULTS.md` now say UNRESOLVED without a qualifying YES a
  reader could quote? Are the per-matcher numbers clearly detail rather than answer?
- **P4.** Scoped to this corpus, and are the rebuilt numbers consistent with the new graph?
- **Determinism.** Rebuild in `/tmp` with the committed caches; `results.json`, `rows.jsonl`,
  `table.md`, `ledger.jsonl` byte-identical.
- **Every number the seat has reported to Jake changed twice.** Say plainly which numbers in the
  current `RESULTS.md` you verified yourself and which you did not.

## The ruling this round must produce

Answer these two, explicitly, in one paragraph each:

1. **Does this land as measurement tooling?** Not "is it perfect" — is the tool sound enough that a
   later study can rest on it, with the residuals named in the file. If no, name the smallest thing
   that would make it land.
2. **What may a reader do with it today?** You wrote that seeded-defect and clean-patch controls are
   prerequisites before changing review practice, model choice, roles or spend. State whether the
   current files make that impossible to misread, and whether any remaining sentence in
   `RESULTS.md` or `PREREG.md` would license a process change on its own.

## NOT
No re-labelling and no new matcher runs — judge spend is closed. Do not propose new claims or new
study designs beyond naming a missing control. Read-only: report, never edit.

## Output
Findings with severity, each at `file:line`, separating executed probes from source reading. End
with `SCORE: n/10`, `MUST:`, `CARRY:` and `VERDICT: LAND|BLOCK`.

## What actually came back (read this before you start)

The rebuild **flipped P1 to YES under matcher A, matcher B and their intersection** — all five
original lanes plus t2c. The file still leads with `P1: UNRESOLVED`, on the grounds that the answer
changed because of a relation change made after the data existed, that all 18 rows rest on
`semantic` disposition confidence, that nothing validates the matching itself, and that no controls
were run. Two extra things you must rule on:

- **Is `UNRESOLVED` over a unanimous YES honest, or is it the seat hiding a result it dislikes?**
  Argue it either way and then decide. A reader must be able to tell what the numbers say AND why
  the file refuses to call it.
- **The worker's own most-likely-wrong claim:** matcher A may now UNDER-match — only 2 of
  astra-r1's 20 accepted findings are matched to sol, and it names `l3/astra-r1#2` vs
  `l3/sol-r2#13` as a probable missed pair. Under-matching inflates exactly the number P1 reads.
  Check that pair and a sample of others yourself, and say whether the split traded over-merging
  for under-matching.
- The worker's component audit reports matcher B still has 2 clearly over-merged components and 3
  borderline. Verify that against the row bodies for at least the two it calls clear.
