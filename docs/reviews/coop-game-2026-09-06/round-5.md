### A — Fold check

**PASS:** All round-4 findings are present without material softening: true-destination solids are checked for moves and pushes; step-up uses true cells and against-gravity “above”; fragile support traverses stacks using the pre-tick snapshot; symmetry is horizontal-dihedral; and both fixtures are included. Given a uniquely resolved transition, §3.3 plus §3.7 preserves §3.6 for moves, pushes, step-ups, and vertical steps: every destination is checked for solids and occupants before placement.

### B — Totality and determinism

**FINDING (severity: blocker):** Fragile support conflicts with movement already performed earlier in the tick. With gravity `−Y`, put the player at `(0,2,0)`, a box at `(0,1,0)`, and fragile solid at `(0,0,0)`; leave `(1,2,0)` and `(1,1,0)` empty, then move `+X`. Step 1 moves the player to `(1,2,0)`, but the pre-tick snapshot places it in the fragile-supported chain, and step 2 says every entity in that chain “stays put this tick.” The rule does not say whether to undo the horizontal move, retain it while suppressing the player’s fall, or evaluate the chain after movement and let it fall. The other requested cases are determinate: an occupied cell above the mover blocks step-up; the pushed box may step up from its true solid destination if its checks pass; a floating box stops at a solid ceiling; switching in liquid performs no physics; and with gravity `+X` collapsed by the `+X` side view, all four `±Y/±Z` moves are allowed and step-up is disabled.

### C — Solver

**FINDING (severity: blocker):** Visited-state BFS over the stated finite tuple terminates, and no persistent field or action appears missing, but it is not exact while the reachable fragile-stack example has multiple plausible successors. Different implementations can therefore disagree about reachability, shortest solutions, and ablation results. The repaired symmetry group is closed over the view and action sets.

### D — Verdict discipline

**FINDING (severity: blocker):** This is not merely an open balance or presentation choice: the fragile-stack example makes `step(state, move)` partial or contradictory on a reachable state, so BLOCK—not LAND or FIX-FIRST—is required under the stated discipline.

VERDICT: BLOCK — Pre-tick fragile-chain freezing conflicts with the already-resolved horizontal movement, leaving a reachable tick without a unique successor.
