# Perspective-puzzle game — design (v9)

> **Canonical copy moved to `~/game-world/docs/design.md` (repo named by Jake 2026-09-06). This file is frozen at the round-9 LAND text; the review corpus is copied to `~/game-world/docs/reviews/design-2026-09-06/`.**

*2026-09-06. **Status: design LAND — pi round 9 (gpt-5.6-sol) VERDICT LAND on this v9** after eight BLOCK rounds, each adjudicated in `reviews/coop-game-2026-09-06/` (r1 reshaped the plan; r2–r8 each closed one partial or contradictory transition). Jake's rulings: v1 is a puzzle game WITHOUT the agent; subtractions accepted; re-embedding with nowhere to go = game loss (RESERVED, §3.6); commit is never a model tool. Seat defaults awaiting Jake's veto pass are listed in §9.6. NOT built; no repo yet.*

## 1. Decision

Build a new browser puzzle game (not toy-battle) on a small voxel grid with a few deeply consistent systems: gravity, perspective (3D / 2D side / 2D top), and a material table. Puzzles are generated from the world by scripts and verified by a solver. **v1 has no agent** (Jake, 2026-09-06: "build as a puzzle game first without the agent"). Whether an agent belongs in the game is a question the finished world answers: if players want changes a menu cannot express, the agent's surface is the rule-edit grammar in §5; if not, the game stands alone. Substance before machinery.

## 2. The agent question, deferred

Test (standing): **the agent is forced if a menu could replace it.** Round 1 showed the v1 systems fail that test — a target/property/value dialog plus an "inspect depth" button replaces the agent exactly. The minimum surface that would pass is a bounded compositional rule-edit grammar (§5), which needs elements to be worth anything. So the agent waits for the world; the world is judged by play first.

## 3. The engine core (RATIFIED 2026-09-06, v2 folds marked)

### 3.1 World

- Rooms of voxels on an integer grid, small (v1 target 12×12×12, §9). The voxel grid is **mutable state** (cells break). **Every cell outside the room's bounds is an implicit, non-fragile SOLID for every rule** (v7): projection, enterability, step-up, support, the vertical step. Positions are confined to the grid by construction; a move into the boundary is BLOCKED by §3.3 step 1. Entities are the player and boxes only; each carries a **true 3D integer position** at all times. **One entity per true cell** (v2, A2). **Fluids are cells, never entities** (v3): a cell whose material `state` is `liquid` is enterable; an entity in it is "in liquid". Entity kind and material are static puzzle metadata.
- **Material table, v1 = three properties** (v2 F3 subtraction; v8 removed `passableFromTop` — under frozen depth a player above a pool is simply in the `none` cell at surface + 1, enterable by §3.3, and liquid is not support by §3.7; a walk-on-water mechanic, if wanted, returns as a material `state` such as ice — Jake may veto): `state` (solid | liquid | gas | none; solid blocks, the other three are enterable), `hardness` ∈ {0 fragile, 1 solid} with **one outcome** (v3): *when an entity's gravity step is blocked by a fragile cell, that cell becomes `none` and the entity stays put this tick; it falls into the gap on the next*. `density` ∈ {0 floats, 1 sinks} (entities carry it too): *an entity in liquid moves one cell against gravity per tick if it floats, along gravity if it sinks; with gravity off or its axis collapsed, buoyancy vanishes* (the §3.4 rule). Flammability, conductivity, opacity, reflectivity, friction, bounciness are NOT in v1; they arrive with elements and light through a versioned property registry.
- Gravity is a vector along one grid axis, one of six directions, on/off. **In v1 gravity is a room property set by the puzzle, never a player action** (v3).
- **Physics is memoryless and quasi-static** (v2, B2): no velocity; a falling entity moves one cell per tick; nothing carries momentum across ticks or mode switches. A fall interrupted by a mode switch that hides its axis simply resumes when the axis is visible again.

### 3.2 Modes

- **3D** · **2D side** (four facings: collapse ±X or ±Z) · **2D top** (collapse Y, looking down). **1D is out of v1** (v2, F3); when it returns it nests in the current 2D view with a named order (round-1 A3 spells the rule).

### 3.3 Projection rule: FRONT-MOST

The visible cell at a reduced-mode position is the nearest non-empty cell along the collapsed axis from the camera side; **entities count as occupants** for this purpose. Hidden cells stay hidden. Projection is a pure function of (world, mode).

**Enterability, one rule for every mover (v5):** a `move` toward a projected destination resolves in order. The mover's *true destination* is its true position plus the move vector (frozen coordinates apply along collapsed axes); in 3D the projected and true destinations coincide.
1. **Solids:** the projected destination's front-most cell must be non-solid AND the mover's true destination cell must be non-solid; if the true destination is solid, see step-up below; if only the front-most cell is solid, BLOCKED (a solid at another depth is a wall in 2D — the Fez mechanic);
2. **Other-depth entities:** if the front-most occupant is an entity that is NOT in the mover's true destination cell, BLOCKED — an entity at another depth is a wall too, never pushed remotely;
3. **Push:** if the true destination holds an entity, that entity is **pushed** one cell in the move direction under this same rule from its own true position (Sokoban; boxes never push boxes); if the push is blocked, so is the move;
4. otherwise the mover moves into its true destination.

**Step-up (v5; the v1 platformer verb; Jake may veto):** applies only when the mover's TRUE destination is a solid cell (never an entity — a box in the true destination goes to step 3, and a box is never stepped onto). "Above" means against gravity, for any gravity direction; step-up exists only when gravity is on and visible. The move then resolves as a move to the cell above the true destination, which must itself be enterable by steps 1–4 from the mover's position, AND the cell above the mover must be free (true cell, non-solid, no entity). One cell only; a front-most solid at another depth is a wall, never a step. There is no jump beyond this.

### 3.4 Physics acts only in the visible dimensions

Collapse an axis and every physical quantity's component along it is dropped. Consequences, no per-mode tables:

- Top view: gravity vanishes. Side view with gravity rotated into the screen: gravity vanishes too — **a lever** (v2 default, B3; §9 may forbid it): an unsupported entity hangs until the axis returns.
- Fluids flow by gravity, so in top view water is a still region.
- **Top-view depth** (v2, B1): frozen depth is the truth. An entity above a pool in top view is simply above it, in whatever cell its frozen coordinate names; nothing about the pool's surface changes enterability.

### 3.5 Movement in a reduced mode

An entity moves in the visible plane; its coordinates along collapsed axes are **frozen**; collision resolves per §3.3. Applies to every entity.

### 3.6 View change: the true world is always consistent (v4); re-embedding RESERVED

Because every move requires the mover's TRUE destination to be free of solid and of entities (§3.3), no sequence of moves and view changes can put an entity inside solid or on another entity. **In v1 a `switch` changes nothing but the view**; there is nothing to repair. The chasm mechanic survives unchanged: in top view you walk onto a true cell above the gap, switch to side view, and fall on the next `move`/`wait` tick.

**Reserved (Jake's ruling, round-1 A1), for when a cell can change under an entity** (agent edits; elements such as ice): re-embedding is a pure repair with no physics — for every entity in lexicographic order of true position, if its cell is now solid, push it along the last-collapsed axis toward the camera to the nearest free cell, else away; if none on the whole axis, the entity is destroyed, and for the player that is the loss of the puzzle. Until such a system exists, this rule has no trigger.

### 3.7 Actions and tick order (v3)

**Action set, v1:** `move` in one of the allowed directions — **the ± directions of the visible axes, minus gravity's axis when gravity is on and visible** (v4: side view with visible gravity → 2; side view with gravity collapsed or off → 4; top → 4; 3D with gravity on → 4, off → 6); `switch` to any of the six views (3D, four side facings, top — all reachable at all times, the §9.2 default); `wait`.

**A `switch` takes no time** (v3, D): its tick changes the view and runs the goal check only (§3.6: nothing to repair in v1). Gravity and buoyancy run on `move` and `wait` ticks. The player reads it as "nothing moves while you look".

Tick order for `move` / `wait`:
1. Movement resolution incl. pushing and step-up (§3.3, §3.5).
2. **Support and fragile breaking (v6), on the post-movement snapshot** — evaluated after stage 1 has placed every entity, before any vertical step: an entity is *supported* iff the cell along gravity from it is a non-fragile solid, or holds an entity that is supported. An entity whose support chain ends on a **fragile** cell is fragile-supported: that cell becomes `none` this tick (all breaks apply before any vertical movement), every entity in that chain keeps its post-movement position this tick, and falls on following ticks bottom-up. An entity that moved out of a chain in stage 1 is judged where it now stands. With gravity off or its axis collapsed, nothing is evaluated.
3. **One vertical step per entity** (v9): each entity's *vertical intent* is decided in this order — **fragile-supported this tick (stage 2): none**; else in liquid: the buoyancy direction (float = against gravity, sink = along it); else not supported (after breaks): along gravity; else none; with gravity off or its axis collapsed, every intent is none. Resolution in two passes: along-gravity movers first, processed from the far end of the gravity axis toward its source (stacks resolve bottom-up); then against-gravity movers, from the source toward the far end. A mover whose target cell is occupied or solid when its turn comes stays.
4. Loss check (destroyed player — no trigger in v1) and goal check.

### 3.8 Invariants (tests, before any renderer)

- Projection is pure and deterministic.
- **The true world is always consistent:** after any action, no entity's cell is solid and no two entities share a cell (v4; this is what makes §3.6 vacuous in v1).
- **Switch-and-reverse is identity:** a `switch` changes only the view.
- A tick is deterministic given (state, input).
- **Canonical state tuple, finite domains** (v3, C1): the voxel grid (material id per cell — mutable) · entity positions and alive flags · view (3D | side facing | top) · gravity direction + on/off · goal state. Static per puzzle (not in the tuple): entity kinds/materials, the material table. Equality and hashing are over the canonical serialization after symmetry normalization (§6). Room volume bounds everything; the solver is exact over this space once §3.3 and §3.7 are total, which v4 claims.

### 3.9 Legibility rule (v3, C)

In a reduced mode the renderer marks every adjacent destination the mover cannot enter because of a true-depth obstruction (a blocked overlay showing the hidden cell), so a refused move is never indistinguishable from ignored input. Hidden-depth collision stays; its cause is shown at the moment it matters.

## 4. Systems, in build order

1. **v1:** grid gravity, the three mode families, the three-property table, the tick order. This is the whole first game.
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
- **Non-triviality by ablation** (v4, C2): ablation removes one view (one side facing, or top) from the action set — **and if it is the start view, the ablated puzzle starts in 3D instead; 3D is never ablated** — then re-solves; a view counts toward the puzzle only if its removal makes it unsolvable. A v1 puzzle must have at least one counting view. **Decision depth** = the minimum number of `switch` actions over all shortest solutions (single-valued); that is the difficulty metric, never input length.
- **Symmetry normalization (v5):** the **dihedral group of the horizontal plane** (rotations about the vertical axis by 90° and reflections across vertical planes; 8 elements) acts on the WHOLE state — grid, entities, gravity, goal, and the view/facing (it permutes the four side facings, fixes top and 3D, fixes gravity along Y, permutes gravity along X/Z with the facings) — and on actions; the canonical form is the lexicographically smallest image. Duplicates are rejected on the normalized hash.
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
5. Whether the three-property rules in §3.1 (fragile breaks under a fall; float/sink one cell per tick) are the v1 rules or too thin.
6. Veto points from v3–v8: Sokoban pushing and the enterability rule (§3.3); step-up as the only vertical verb (§3.3); switches take no time (§3.7); `passableFromTop` removed from v1 (§3.1).

## 10. Gates before build

1. ~~pi review~~ LANDED at round 9. Jake's veto pass over §9.6, then the repo.
2. **Smallest playable:** one room, 3D + side + top, gravity on/off, the three-property table, player + one box, reach the exit; the solver proves the room; twenty minutes of play. **Fixture 1 (round-3 D):** a bounded room, gravity −Y, flat floor, player at (0,1,0), box at (2,1,1), side view from +X, exit beyond the box's projected square, with an alternate route (e.g. via top view) so the room is solvable; the single `+Z` move from the start must resolve to BLOCKED in the renderer's legality preview and in the headless solver alike. **Fixture 2 (round-4 D, "false stair"):** gravity −Y, side view from +X, player at (0,1,0), liquid at the true destination (0,1,1), a solid at (2,1,1) only, free cells at (0,2,0) and (0,2,1); `+Z` must resolve to BLOCKED (the true destination is liquid, so no step-up; the front-most cell at depth 2 is solid, so step 1 blocks) — no stair, no drop.
3. Ten generated puzzles played. Then, and only then, the agent question (§2) with evidence from play.
