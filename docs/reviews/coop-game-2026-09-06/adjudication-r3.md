# Adjudication — round 3 (pi gpt-5.6-sol, VERDICT: BLOCK)

All four findings REAL; all folded into v4. One fold simplifies v1 rather than adding to it.

- **A/D. Reduced-depth pushing — REAL.** v4 makes enterability a three-step rule on the projected
  destination: (1) its front-most cell must be non-solid; (2) if the front-most occupant is an
  entity that is NOT in the mover's true destination cell, the move is BLOCKED — an entity at
  another depth is a wall in 2D, exactly like a solid at another depth (the Fez mechanic), never
  remotely pushed; (3) if the mover's true destination holds an entity, it is pushed one cell in
  the move direction under the same rule with its own frozen coordinates; (4) otherwise the mover
  moves. The reviewer's room (player at (0,1,0), box at (2,1,1), view from +X, move +Z) resolves
  to BLOCKED. That room is the first smallest-playable fixture (§10.2).
- **B. Liquid step ordering — REAL.** v4 defines one vertical step per entity per tick from a
  single "vertical intent": in liquid → buoyancy direction; else unsupported → along gravity; else
  none. Resolution in two passes: along-gravity movers first, processed from the far end of the
  gravity axis toward its source; then against-gravity movers, processed from the source toward
  the far end; a mover whose target is occupied when its turn comes stays. Horizontal pushes
  happen in stage 1, so a box pushed into liquid moves horizontally once and vertically at most
  once in the same tick.
- **B. Switch to 3D has no collapsed axis — REAL, and it exposes that re-embedding is vacuous in
  v1.** Because every move requires the mover's TRUE destination to be free of solid and entities,
  the true world is always consistent; no view change can put an entity inside solid or on top of
  another. v4 states this as an invariant and RESERVES §3.6 (push-out, else loss — Jake's ruling)
  for the moment a cell can change under an entity (agent edits, elements such as ice). The
  chasm mechanic survives unchanged: in top view you walk onto a true cell above the gap, switch
  to side view, and fall on the next tick.
- **B. Move directions when gravity is collapsed — REAL.** v4 rule: allowed `move` directions =
  the ± directions of the visible axes, minus gravity's axis when gravity is on and visible.
  Side view with visible gravity → 2; side view with gravity collapsed or off → 4; top → 4;
  3D with gravity on → 4, off → 6.
- **B. No jump makes dry upward exits unreachable — REAL as a design fact.** v4 adds **step-up**
  as the v1 default (Jake may veto): a `move` into a solid cell succeeds as a move to the cell
  above it if that cell and the cell above the mover are both free; one cell only. It is the
  minimal platformer verb, keeps the state finite, and applies in every view where gravity is
  visible. Boxes are never stepped onto by pushing.
- **C. Ablation of the start view — REAL.** v4: ablating a view removes it from the action set
  and, if it is the start view, the ablated puzzle starts in 3D instead (3D is never ablated).
- **C. Decision depth not single-valued — REAL.** v4: the minimum number of `switch` actions over
  all shortest solutions (the easiest of the shortest).
- **C. Symmetry normalization unsound — REAL.** v4: the symmetry group acts on the whole state —
  grid, entities, gravity, goal, AND the view/facing — and on actions; reflecting across X maps
  side +X to side −X. Normalization = the lexicographically smallest image under the group.

## Verdict on the verdict

BLOCK was right on pushing and liquid ordering. v4 answers each finding; round 4 checks the folds
and the new step-up rule.
