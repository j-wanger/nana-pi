# Adjudication — round 2 (pi gpt-5.6-sol, VERDICT: BLOCK)

Four findings, all REAL, all mechanical. Folded into v3 as follows; the two rules that add
gameplay (pushing; perspective switches take no time) are seat defaults Jake may veto.

- **A. Liquids / buoyancy / fragile / pushing — REAL.** v2 made fluids entities AND one occupant
  per cell, so nothing could ever be *in* liquid. v3: **fluids are cells** (material `state:
  liquid`), never entities; a liquid cell is enterable. Buoyancy is a gravity-axis rule: a floating
  entity in liquid moves one cell against gravity per tick, a sinking one along it; with gravity
  off or its axis collapsed, buoyancy vanishes (the §3.4 rule, no special case). **Fragile:** when
  an entity's gravity step is blocked by a fragile cell, that cell becomes `none` and the entity
  stays put this tick (it falls into the gap next tick) — one outcome. **Pushing (new, Sokoban
  rule, Jake may veto):** a player move into a box's cell pushes the box one cell in the move
  direction if the box's own destination is enterable under §3.3 with the box's frozen
  coordinates; otherwise the move is blocked. Boxes never push boxes.
- **B. State tuple + action grammar + ablation — REAL.** v3 adds the mutable voxel grid to the
  canonical state (broken cells were invisible to the hash), names entity kind/material as static
  puzzle metadata, and defines the v1 action set explicitly: `move` in the four visible-plane
  directions (two in side view), `switch` to any of the six views (all reachable at all times —
  the §9.2 default), and `wait`. **Gravity is a room property in v1, never a player action**, so
  ablation ranges over views only. Ablation = remove one view (one facing, or top, or 3D) from the
  action set and re-solve; a view counts if its removal makes the puzzle unsolvable. Decision
  depth = number of switches in the shortest solution (computable proxy). Generator contract
  recorded: stable start (a fixed point under `wait`), symmetry normalization under the room's
  rotations/reflections before hashing, loss states terminal, solver = omniscient single-agent
  breadth-first search.
- **C. Hidden-depth collision unreadable — REAL.** v3 adds a legibility rule (§3.9): in a reduced
  mode the renderer marks every adjacent destination the mover cannot enter because of a
  true-depth obstruction (a blocked overlay showing the hidden cell), so a refused move is never
  indistinguishable from ignored input.
- **D. Fold check — REAL on A4.** v2's identity invariant was vacuous because every step ran
  gravity. v3: **a perspective switch takes no time** — the switch tick runs re-embedding and the
  loss/goal check only; gravity and buoyancy run on `move` and `wait` ticks. Switch-and-reverse is
  then identity exactly, and the player reads it as "nothing moves while you look". Jake may
  veto; the alternative is that switching costs a tick, which makes the invariant false by design.
  C1–C3 folds completed per B above.

## Verdict on the verdict

BLOCK was correct on the liquid contradiction. v3 answers every finding; round 3 checks the folds.
