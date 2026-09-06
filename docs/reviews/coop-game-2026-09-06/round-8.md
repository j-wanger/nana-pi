### A. Fold check

**FINDING (severity: minor):** The top-view liquid room now has one successor: the player moves into the empty surface+1 cell, with no operative `passableFromTop` rule remaining. Nothing was softened. However, §4.1 and §9.5 still call v1’s table “four-property”; both should say “three-property.” The remaining mentions of `passableFromTop` explicitly document its removal or possible veto and do not affect transitions.

### B. Totality + determinism

**FINDING (severity: blocker):** In a stable 3D room with gravity −Y, place a sinking player at `(0,1,0)` over non-fragile solid, liquid at `(1,1,0)`, and fragile solid at `(1,0,0)`. On `move +X`, stage 1 puts the player in the liquid. Stage 2 breaks the fragile support and says the player keeps `(1,1,0)` this tick, but stage 3 gives every sinking entity in liquid an along-gravity intent; because the broken cell is now `none`, it moves the player to `(1,0,0)`. The written rules therefore yield two successors.

### C. Solver

**FINDING (severity: blocker):** The canonical state space is finite, so breadth-first search terminates, but it is not exact while the reachable liquid-over-fragile transition above permits either staying or sinking during the breaking tick. An implementation must add an unstated precedence rule.

### D. Verdict discipline

**FINDING (severity: blocker):** The liquid-over-fragile room exposes a contradictory reachable transition, meeting the brief’s BLOCK criterion; the stale property counts are only minor editorial residue.

VERDICT: BLOCK — Stage 2’s fragile-support freeze conflicts with stage 3’s unconditional liquid buoyancy intent on a reachable state.
