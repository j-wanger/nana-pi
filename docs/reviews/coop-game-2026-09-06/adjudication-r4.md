# Adjudication — round 4 (pi gpt-5.6-sol, VERDICT: BLOCK)

All REAL. The central one is a seat regression: v4's enterability rule lost v3's "true destination
not solid" check. v5 folds everything.

- **A/B. Hidden solid behind front-most liquid — REAL, seat regression.** v5 enterability step 1
  now checks BOTH the projected destination's front-most cell AND the mover's true destination
  (frozen coordinates applied) for solid. With that, the consistency invariant (§3.6) is implied
  again for moves and pushes.
- **B. Step-up false stair / step-up over a box / "above" undefined — REAL.** v5 defines step-up
  on TRUE cells: it applies only when the mover's true destination is a solid cell (never an
  entity — boxes are never stepped onto; a box in the true destination goes to the push rule).
  "Above" = the direction against gravity. The target is the cell above the true destination; it
  must be enterable by the full rule (front-most non-solid, no other-depth entity, true cell free)
  AND the cell above the mover must be free (true, non-solid, no entity). No remote stairs: a
  front-most solid at another depth is a wall, not a step.
- **B. Fragile support in stacks — REAL.** v5 defines support on the pre-tick snapshot: an entity
  is supported iff the cell along gravity from it is a non-fragile solid, or holds an entity that
  is supported. An entity whose support chain ends on a FRAGILE cell is "fragile-supported": that
  cell breaks this tick (all breaks apply before any movement), every entity in that chain stays
  put this tick, and falls on following ticks bottom-up. Vertical intent along gravity = not
  supported (after breaks) → fall.
- **B. Two against-gravity movers contending — REFUTED by the reviewer itself** (translation by one
  vector is injective); v5 keeps the two-pass rule as written.
- **C. Start-in-3D ablation — PASS** (reviewer agrees it cannot add capability).
- **C. Symmetry group too big — REAL.** v5 restricts normalization to the dihedral group of the
  horizontal plane (rotations about the vertical axis by 90° and reflections across vertical
  planes, 8 elements). It permutes the four side facings, fixes top and 3D, fixes gravity along Y,
  and permutes gravity along X/Z consistently with the facings.
- **A. "Jake may veto" reads as softening — NOTED, not a rule weakness.** The rules are stated
  firmly; the marker records whose call it is, per this repo's practice.
- **D. Fixtures — folded:** fixture 1 gains room bounds and an alternate route; fixture 2 is the
  "false stair" room, whose `+Z` must now resolve to BLOCKED (true destination liquid is
  enterable, so no step-up; but the front-most cell at depth 2 is solid → step 1 blocks).

## Verdict on the verdict

BLOCK was right on the regression. v5 answers each finding; round 5 checks the folds.
