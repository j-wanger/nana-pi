### A. Fold check

**PASS:** In the round-6 boundary room, a supported player at maximum X issuing `move +X` has one successor. The true destination is implicit solid; step-up also fails because the cell above that destination remains outside and therefore solid. Movement is blocked, support persists, and the state remains unchanged. Nothing was softened.

### B. Totality + determinism

**FINDING (severity: blocker):** `passableFromTop` still contradicts the universal enterability rule. In top view with gravity collapsed, put the player at `(0,1,0)`, a liquid surface at `(1,0,0)` with `passableFromTop=false`, and leave `(1,1,0)` empty. A `+X` move has a non-solid projected destination and non-solid true destination, so §3.3 requires movement to `(1,1,0)`; but §§3.1 and 3.4 say `passableFromTop` determines whether the player can stand there and applies exactly at surface + 1, implying the move is blocked. These yield two successors. This is the only new counterexample I could construct.

### C. Solver

**FINDING (severity: blocker):** The boundary fold makes the state space finite, so BFS terminates, but it is not exact while the reachable top-view liquid move above has two rule-consistent successors. Any implementation must either ignore `passableFromTop` or add an unstated collision rule.

### D. Verdict discipline

**FINDING (severity: blocker):** The `passableFromTop=false` room exposes a contradictory reachable transition, meeting the brief’s BLOCK criterion rather than FIX-FIRST.

VERDICT: BLOCK — Boundary behavior is repaired, but top-surface passability still contradicts enterability on a reachable move.
