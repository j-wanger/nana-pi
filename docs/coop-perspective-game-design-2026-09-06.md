# Perspective-puzzle game — design (v3)

*2026-09-06. **v3 after pi rounds 1–2 (both BLOCK, adjudicated in `reviews/coop-game-2026-09-06/`) and Jake's rulings:** v1 is a puzzle game WITHOUT the agent; subtractions accepted; re-embedding with nowhere to go = game loss; commit is never a model tool. v3 folds round 2: fluids are cells, one fragile outcome, Sokoban pushing, explicit action set, gravity is a room property, mutable grid in the state, ablation defined, switches take no time, hidden-depth legibility. Round 3 reviews this v3. NOT built; no repo yet.*

## 1. Decision

Build a new browser puzzle game (not toy-battle) on a small voxel grid with a few deeply consistent systems: gravity, perspective (3D / 2D side / 2D top), and a material table. Puzzles are generated from the world by scripts and verified by a solver. **v1 has no agent** (Jake, 2026-09-06: "build as a puzzle game first without the agent"). Whether an agent belongs in the game is a question the finished world answers: if players want changes a menu cannot express, the agent's surface is the rule-edit grammar in §5; if not, the game stands alone. Substance before machinery.

## 2. The agent question, deferred

Test (standing): **the agent is forced if a menu could replace it.** Round 1 showed the v1 systems fail that test — a target/property/value dialog plus an "inspect depth" button replaces the agent exactly. The minimum surface that would pass is a bounded compositional rule-edit grammar (§5), which needs elements to be worth anything. So the agent waits for the world; the world is judged by play first.

## 3. The engine core (RATIFIED 2026-09-06, v2 folds marked)

### 3.1 World

- Rooms of voxels on an integer grid, small (v1 target 12×12×12, §9). The voxel grid is **mutable state** (cells break). Entities are the player and boxes only; each carries a **true 3D integer position** at all times. **One entity per true cell** (v2, A2). **Fluids are cells, never entities** (v3): a cell whose material `state` is `liquid` is enterable; an entity in it is "in liquid". Entity kind and material are static puzzle metadata.
- **Material table, v1 = four properties** (v2, F3 subtraction): `state` (solid | liquid | gas | none; solid blocks, the other three are enterable), `passableFromTop` (in top view the front-most cell of a pool is its surface; the table says whether you can stand on it), `hardness` ∈ {0 fragile, 1 solid} with **one outcome** (v3): *when an entity's gravity step is blocked by a fragile cell, that cell becomes `none` and the entity stays put this tick; it falls into the gap on the next*. `density` ∈ {0 floats, 1 sinks} (entities carry it too): *an entity in liquid moves one cell against gravity per tick if it floats, along gravity if it sinks; with gravity off or its axis collapsed, buoyancy vanishes* (the §3.4 rule). Flammability, conductivity, opacity, reflectivity, friction, bounciness are NOT in v1; they arrive with elements and light through a versioned property registry.
- Gravity is a vector along one grid axis, one of six directions, on/off. **In v1 gravity is a room property set by the puzzle, never a player action** (v3).
- **Physics is memoryless and quasi-static** (v2, B2): no velocity; a falling entity moves one cell per tick; nothing carries momentum across ticks or mode switches. A fall interrupted by a mode switch that hides its axis simply resumes when the axis is visible again.

### 3.2 Modes

- **3D** · **2D side** (four facings: collapse ±X or ±Z) · **2D top** (collapse Y, looking down). **1D is out of v1** (v2, F3); when it returns it nests in the current 2D view with a named order (round-1 A3 spells the rule).

### 3.3 Projection rule: FRONT-MOST

The visible cell at a reduced-mode position is the nearest non-empty cell along the collapsed axis from the camera side; **entities count as occupants** for this purpose. Hidden cells stay hidden. Projection is a pure function of (world, mode).

**By design (v2, A2):** a solid at another depth is a real wall in 2D — that is the mechanic. A projected cell is enterable only if its front-most cell is passable AND the mover's true destination cell (frozen coordinates applied) is not solid and holds no entity.

**Pushing (v3, Sokoban rule; Jake may veto):** a player move into a box's cell pushes the box one cell in the move direction if the box's own destination is enterable by this same rule with the box's frozen coordinates; otherwise the move is blocked. Boxes never push boxes.

### 3.4 Physics acts only in the visible dimensions

Collapse an axis and every physical quantity's component along it is dropped. Consequences, no per-mode tables:

- Top view: gravity vanishes. Side view with gravity rotated into the screen: gravity vanishes too — **a lever** (v2 default, B3; §9 may forbid it): an unsupported entity hangs until the axis returns.
- Fluids flow by gravity, so in top view water is a still region.
- **Top-view depth** (v2, B1): frozen depth is the truth. An entity two cells above a pool in top view is simply above it; `passableFromTop` applies only when the entity's frozen coordinate is the surface + 1.

### 3.5 Movement in a reduced mode

An entity moves in the visible plane; its coordinates along collapsed axes are **frozen**; collision resolves per §3.3. Applies to every entity.

### 3.6 Re-embedding on mode change: PUSH OUT (pure), then the clock resumes

Re-embedding is a **pure repair with no physics** (v2, A4). For every entity in a fixed order (by true position, lexicographic): if its true cell is now inside solid or shared with another entity, push it along the collapsed axis toward the camera to the nearest free cell; if none that way, away from the camera; **if none on the whole axis, the entity is destroyed — for the player that is the loss of the puzzle** (Jake's ruling, A1). Physics then runs on the ordinary tick clock, not as part of re-embedding: cross a chasm in top view, return to side view, and you fall on the next tick unless there is floor under you.

### 3.7 Actions and tick order (v3)

**Action set, v1:** `move` in one of the four directions of the visible plane (two in side view: along the plane's non-gravity axis; four in top view and in 3D, where the vertical is gravity's alone — there is no jump in v1); `switch` to any of the six views (3D, four side facings, top — all reachable at all times, the §9.2 default); `wait`.

**A `switch` takes no time** (v3, D): its tick runs re-embedding (§3.6) and the loss/goal check only. Gravity and buoyancy run on `move` and `wait` ticks. The player reads it as "nothing moves while you look".

Tick order for `move` / `wait`:
1. Movement resolution incl. pushing (§3.3, §3.5).
2. Gravity step for every entity, processed from the far end of the gravity axis toward its source so stacks resolve bottom-up; fragile-cell breaking (§3.1, one outcome); buoyancy.
3. Loss check (destroyed player) and goal check.

### 3.8 Invariants (tests, before any renderer)

- Projection is pure and deterministic.
- Re-embedding is pure, deterministic, idempotent.
- **Switch-and-reverse is identity:** because a `switch` runs no physics, a view change immediately reversed leaves every entity and cell where it was (unless the first switch destroyed an entity, which is a loss and terminal).
- A tick is deterministic given (state, input).
- **Canonical state tuple, finite domains** (v3, C1): the voxel grid (material id per cell — mutable) · entity positions and alive flags · view (3D | side facing | top) · gravity direction + on/off · goal state. Static per puzzle (not in the tuple): entity kinds/materials, the material table. Equality and hashing are over the canonical serialization after symmetry normalization (§6). Room volume bounds everything; the solver is exact over this space.

### 3.9 Legibility rule (v3, C)

In a reduced mode the renderer marks every adjacent destination the mover cannot enter because of a true-depth obstruction (a blocked overlay showing the hidden cell), so a refused move is never indistinguishable from ignored input. Hidden-depth collision stays; its cause is shown at the moment it matters.

## 4. Systems, in build order

1. **v1:** grid gravity, the three mode families, the four-property table, the tick order. This is the whole first game.
2. **Elements** (water, fire, ice, electricity) as cellular rules over the table — the point at which a rule-edit grammar (§5) becomes worth having.
3. **Light** as raycasts over opacity and reflectivity.

## 5. If the agent comes (deferred; constraints carried from day one)

- **The simulation is a pure headless package** (`sim`: `step(state, input) → state`, serializable state, an append-only action log). This is required by the solver anyway, and it is what makes an authoritative game server a wrapper rather than a rewrite.
- **Resolution of round-1 F1** (Jake, 2026-09-06): when an agent is added, the game runs its sim in its own server process; the browser sends moves same-origin; the agent's tools sit behind the same server. Bespoke on the kit (blocks, ledger, gate bar, listener isolation reused); the kit boundary is not amended.
- **Commit is never a model tool** (ratified): the model gets `preview`; the player's click on the preview is the commit, bound to preview id + world revision + cost.
- **The candidate agent surface** is a bounded rule-edit grammar: predicates over contact, material, state and mode joined to engine-defined effects, solver-validated, cost = complexity. Never bare property rows.
- Authority: schema plus target allowlists, immutable fields, enumerated domains, server-computed cost, revision check, atomic commit, post-commit invariant check. Audit = signed tool provenance plus the sim's action log; no stronger claim.

## 6. Puzzles from the world

- A puzzle = (room start state, goal predicate). Goal predicates v1: player reaches the exit cell; a box rests on a plate.
- **Generator and solver are scripts.** The solver is an omniscient single-agent breadth-first search over §3.8's state space and §3.7's action set; loss states are terminal; a puzzle is valid only if a solution exists that never enters one. **Stable start:** the start state is a fixed point under `wait`.
- **Non-triviality by ablation** (v3, C2): ablation removes one view (one side facing, or top, or 3D) from the action set and re-solves; a view counts toward the puzzle only if its removal makes it unsolvable. A v1 puzzle must have at least one counting view other than 3D. **Decision depth** = the number of `switch` actions in the shortest solution; that is the difficulty metric, never input length.
- **Symmetry normalization:** rooms are canonicalized under the grid's rotations and reflections (with gravity and the goal transformed alongside) before hashing; duplicates are rejected on the normalized hash.
- Reset = restart the puzzle from its start state.

## 7. Relation to the kit

**v1 uses none of it.** The game is a standalone page in its own repo. The chat bubble, blocks, ledger and listeners become relevant only under §5.

## 8. Technology

- **TypeScript.** Packages: `sim` (pure, headless, zod schemas, no DOM — must run in Node for the solver from the first commit), `solve` (generator + solver over `sim`), `web` (renderer + page).
- **Three.js for rendering only**, loaded from a CDN import map (no build step). One scene; orthographic camera snapped to an axis for 2D, perspective for 3D; instanced meshes for voxels.
- **No physics library.** Grid physics is a few hundred lines we own.

## 9. Open (Jake's calls)

1. Repo and working name.
2. The player's perspective verb: v3 default = all six views reachable at all times; the input (keys / on-screen) is open.
3. Gravity into the screen: lever (default) or forbidden.
4. v1 room size (default 12×12×12) and whether rooms connect.
5. Whether the four-property rules in §3.1 (fragile breaks under a fall; float/sink one cell per tick) are the v1 rules or too thin.
6. Veto points from v3: Sokoban pushing (§3.3); switches take no time (§3.7); no jump in v1.

## 10. Gates before build

1. pi round 3 on this v3 (fold check of round 2; any remaining partial rule).
2. **Smallest playable:** one room, 3D + side + top, gravity on/off, the four-property table, player + one box, reach the exit; the solver proves the room; twenty minutes of play.
3. Ten generated puzzles played. Then, and only then, the agent question (§2) with evidence from play.
