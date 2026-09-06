# Review brief — perspective-puzzle game design, round 4 (v4)

You are the independent reviewer from rounds 1–3. v4 folds your round-3 findings. Judge v4 as a
no-agent puzzle game (the agent is deferred by the owner's ruling).

## Read first (absolute paths)
1. /Users/jwang/nana-pi/docs/coop-perspective-game-design-2026-09-06.md — v4, THE DESIGN under review
2. /Users/jwang/nana-pi/docs/reviews/coop-game-2026-09-06/round-3.md — your round-3 findings
3. /Users/jwang/nana-pi/docs/reviews/coop-game-2026-09-06/adjudication-r3.md — how the seat folded them

## Dimensions
A. **Fold check** for each round-3 finding (reduced-depth pushing; liquid/gravity step ordering;
   switch-to-3D / re-embedding; move directions; no-jump; ablation of the start view; decision
   depth; symmetry on the view). Name anything dropped or softened. In particular: is the claim
   "the true world is always consistent, so re-embedding is vacuous in v1" actually implied by
   §3.3 + §3.7 as written (consider pushing, step-up, and the vertical step)?
B. **Totality + determinism, fresh pass on v4 only:** the three-step enterability rule with a
   pushed box whose own projected destination differs from its true destination; step-up into a
   cell whose front-most is solid but whose true cell is liquid; step-up while pushing; two
   against-gravity movers contending; an entity in liquid with gravity off; the fragile rule when
   the blocked mover is a box a player stands on.
C. **Solver:** exact + terminating now? Is "start in 3D when the start view is ablated" sound
   (can it make an unsolvable puzzle solvable, corrupting the ablation test)? Is the symmetry
   group action on views and actions complete for the four side facings under 90° rotations?
D. **Smallest playable:** confirm or replace the first fixture; name a second fixture that
   exercises step-up and the vertical step together.

## Output
For each dimension: `PASS` or `FINDING (severity: blocker|major|minor): <one paragraph with the
concrete counterexample>`. End with exactly one line: `VERDICT: LAND | FIX-FIRST | BLOCK` and a
one-sentence reason.
