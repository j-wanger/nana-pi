# Adjudication — round 1 (pi gpt-5.6-sol, VERDICT: BLOCK)

Seat's read, finding by finding. REAL = the seat agrees and the design must change; BY-DESIGN = the
behaviour is intended and the doc must say so; REFUTED = the finding misreads the design. Findings
that revise a RATIFIED rule (§3) are Jake's to re-ratify; the seat does not fold them silently.

## A. Projection + re-embedding

- **A1 push-out not total — REAL.** Fix candidate: push toward the camera; if no non-solid cell
  that way, push away; if none on the whole axis, the state is INVALID and the *cause* is refused:
  an `edit` commit is validated for re-embeddability of every entity in the current mode AND in 3D
  before it lands; a mode switch that would strand an entity is refused with a reason. "Out" means
  a cell whose material is not solid AND has no entity (see A2). Not ratified — Jake.
- **A2 projected collision — half BY-DESIGN, half REAL.** A far solid blocking a projected cell
  whose true cell is empty IS the Fez mechanic (walls at another depth are real walls in 2D); the
  doc must say so. REAL: entering a projected-passable cell whose true cell holds a hidden solid or
  another entity. Fix: entities participate in front-most like cells (one occupant per true cell;
  the projected cell is passable only if the FRONT-MOST cell is passable AND the mover's true
  destination cell is free); no two entities ever share a true cell. Jake.
- **A3 nested 1D order — REAL.** The doc said "fixed order" and named none. Fix: 1D is entered
  only from a 2D view; it collapses the 2D view's axis that is NOT the movement axis, camera sign
  = the 2D camera's for the first collapse and "from above" for the second; visibility is
  lexicographic (outer collapse first). Or subtract 1D from v1 (F3). Jake.
- **A4 no-move round trip — REAL, and the seat's invariant was sloppy.** Re-embedding must be a
  PURE repair with no physics; physics runs only on the ordinary tick clock. Identity then holds
  for "switch and switch back with no tick, no input, no edit". Fold as stated; it does not change
  the ratified push-out rule, it separates it from the tick.

## B. Physics in visible dimensions

- **B1 top-view fluids vs frozen depth — REAL.** Two coherent options: (i) frozen depth is the
  truth — the player at y=3 is simply above the pool and `passableFromTop` only matters when the
  frozen y is the surface + 1; (ii) surface snapping in top view. (i) is the smaller rule and
  consistent with §3.5. Jake.
- **B2 velocity — REAL. Recommend SUBTRACTION:** v1 physics is memoryless and quasi-static (one
  cell per tick, no velocity); a mode flip mid-fall is then trivially defined (the fall resumes
  when its axis is visible again). Bounciness and friction leave v1 (F3) or get cellular
  definitions later. Jake.
- **B3 gravity-into-screen suspension — BY-DESIGN as a lever,** consistent with §9.3; the doc
  must state the suspension consequence explicitly.

## C. Solver + generator

- **C1 state tuple — REAL.** Fold: a canonical state tuple with finite domains for every field
  (positions, mode + facing + projection stack, gravity dir/on, material property values from
  enumerated domains, remaining budget, per-voxel element state once elements exist); numeric edit
  arguments are enumerated steps, never free numbers. Per-voxel element state IS exponential in
  room volume — rooms stay small and the solver is bounded-depth; state the bound honestly.
- **C2 non-triviality gameable — REAL.** Replace event counting with ablation: a system or edit
  counts only if removing it makes the puzzle unsolvable. Generator-phase work; fold the rule now.
- **C3 generator constraints — REAL, deferred** to the generator design (after the smallest
  playable); the hint contract (a hint may only reveal facts the solver used) folds now.

## D. The agent boundary

- **D1 preview/commit is not a gate — REAL and important.** The kit's mutating-action rule only
  governs CLICKED block actions; the model can call preview then commit in one turn. Fix: commit is
  never a model tool. The preview block carries an "apply" action that posts to the game server
  same-origin (the app-owned data seam), bound to the preview id + world revision + cost; the model
  has `preview_edit` only. Alternative: commit through an `extension_ui_request` confirm so it
  lands on the gate bar. Recommend the first (the player's click IS the commit). Jake.
- **D2 zod is shape not authority — REAL.** Fold: target allowlists, immutable fields (budget, goal,
  room bounds, gravity rules unless the puzzle grants them), enumerated property domains,
  server-computed cost, revision check, atomic commit, post-commit invariant validation.
- **D3 audit claim overstated — REAL.** Narrow to "tool provenance is signed and replayable"; a full
  game replay needs a transition log the game server writes (inputs, mode switches, commits, seed).
  Fold the narrowing; the log is a v1 server deliverable if the audit mechanic is wanted.

## E. The menu test — the finding that answers Jake's own concern

- **E1 v1 is menu-sized — REAL.** With gravity + modes + a property table whose half is inert, a
  target/property/value dialog plus an inspect-depth button replaces the agent exactly. The seat's
  smallest-playable gate (§10.3) would have tested a forced agent. The reviewer's minimum addition:
  a **bounded compositional rule-edit grammar** — predicates over contact/material/state/mode
  joined to engine-defined effects ("when fire touches this material it becomes gas"; "in top view
  this material is passable"), solver-validated, cost = complexity — so the agent's edit language
  is open while every edit stays deterministic. Elements activate that grammar; more property rows
  alone are a bigger menu. **This reorders the plan: the menu test cannot be passed by the v1
  systems as ratified.** Jake.

## F. Kit fit

- **F1 no state-sharing path — REAL and architectural.** The human plays in the browser; the agent's
  tools run in the pi child; the kit offers pages, fixed-argv GET data, prompts, and blocks — no
  browser-to-authoritative-sim mutation channel. The game needs an **authoritative game server**
  (the sim, one process) with same-origin action routes for the player and the same server behind
  the agent's tools. That is more than a block type, so by the frontend design's §5 rule the game
  is **bespoke on top of the kit** (uses blocks, ledger, listener isolation, gate bar; adds its own
  server) — or the kit boundary is amended to allow an app-owned server behind the listener. Jake.
- **F2 the bubble as a forbidden kit change — REFUTED.** The bubble is Jake's feature request for
  the kit itself (2026-09-06), landed and tested on both existing desks; it is not a change the
  slice needs. The `agent:changed` point (generic, fires with an error flag) is fair and folds into
  F1: the game server, not the refresh event, carries state.
- **F3 subtract inert properties and 1D from v1 — REAL.** Fold: v1 material table = state,
  passableFromTop, hardness (with a breaking rule) and density (with a buoyancy rule) only;
  flammability/conductivity/opacity/reflectivity arrive with elements/light through a versioned
  property registry; 1D leaves the smallest playable.

## Verdict on the verdict

BLOCK stands. Two findings change the plan rather than the wording: **E1** (the v1 agent surface is
menu-replaceable; a rule-edit grammar is the minimum that makes the agent real) and **F1** (the
game needs its own authoritative server; the slice is bespoke-on-kit unless the kit boundary is
amended). The rest fold into a v2 draft once Jake rules on the items marked "Jake" above.
