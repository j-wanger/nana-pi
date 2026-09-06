# Review brief — perspective-puzzle game design, round 7 (v7)

You are the independent reviewer from rounds 1–6. v7 folds your single round-6 finding: cells
outside the room are implicit non-fragile solid for every rule. Judge v7 as a no-agent puzzle game.

## Read first (absolute paths)
1. /Users/jwang/nana-pi/docs/coop-perspective-game-design-2026-09-06.md — v7, THE DESIGN under review
2. /Users/jwang/nana-pi/docs/reviews/coop-game-2026-09-06/round-6.md — your round-6 findings
3. /Users/jwang/nana-pi/docs/reviews/coop-game-2026-09-06/adjudication-r6.md — how the seat folded it

## Dimensions
A. **Fold check:** boundary room against v7 — unique successor? Anything softened?
B. **Totality + determinism, fresh pass:** at most three NEW rooms that could yield two successors
   or none; if you cannot construct one, say so plainly.
C. **Solver:** exact + terminating over the written rules?
D. **Verdict discipline:** LAND if only minors remain (list them); FIX-FIRST only for a rule that
   makes the solver wrong on a reachable state; BLOCK only for a partial or contradictory
   transition.

## Output
For each dimension: `PASS` or `FINDING (severity: blocker|major|minor): <one paragraph with the
concrete counterexample>`. End with exactly one line: `VERDICT: LAND | FIX-FIRST | BLOCK` and a
one-sentence reason.
