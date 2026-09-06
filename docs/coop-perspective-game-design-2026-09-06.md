# Perspective-puzzle game — design (v4)

*2026-09-06. **v4 after pi rounds 1–3 (all BLOCK, each adjudicated in `reviews/coop-game-2026-09-06/`) and Jake's rulings:** v1 is a puzzle game WITHOUT the agent; subtractions accepted; re-embedding with nowhere to go = game loss (now RESERVED — see §3.6); commit is never a model tool. v4 folds round 3: a three-step enterability rule that settles reduced-depth pushing, a single vertical-intent liquid/gravity step with two ordered passes, move directions derived from visible axes minus gravity, step-up as the v1 platformer verb, ablation of the start view, single-valued decision depth, symmetry acting on the view. Round 4 reviews this v4. NOT built; no repo yet.*

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

**Enterability, one rule for every mover (v4):** a `move` toward a projected destination resolves in order:
1. the destination's front-most cell must be non-solid, else BLOCKED;
2. if the front-most occupant is an entity that is NOT in the mover's true destination cell (frozen coordinates applied), BLOCKED — an entity at another depth is a wall in 2D, exactly like a solid at another depth (the Fez mechanic), and is never pushed remotely;
3. if the mover's true destination holds an entity, that entity is **pushed** one cell in the move direction under this same rule with its own frozen coordinates (Sokoban; boxes never push boxes; a box is never stepped onto); if the push is blocked, so is the move;
4. otherwise the mover moves into its true destination.

**Step-up (v4 default, the v1 platformer verb; Jake may veto):** when step 1 fails because the front-most cell is solid, the move instead succeeds as a move to the cell above that destination if that cell and the cell above the mover are both free (true cells, one cell only), in any view where gravity is on and visible. There is no jump beyond this.

### 3.4 Physics acts only in the visible dimensions

Collapse an axis and every physical quantity's component along it is dropped. Consequences, no per-mode tables:

- Top view: gravity vanishes. Side view with gravity rotated into the screen: gravity vanishes too — **a lever** (v2 default, B3; §9 may forbid it): an unsupported entity hangs until the axis returns.
- Fluids flow by gravity, so in top view water is a still region.
- **Top-view depth** (v2, B1): frozen depth is the truth. An entity two cells above a pool in top view is simply above it; `passableFromTop` applies only when the entity's frozen coordinate is the surface + 1.

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
2. **One vertical step per entity** (v4): each entity's *vertical intent* is — in liquid: the buoyancy direction (float = against gravity, sink = along it); else unsupported: along gravity; else none; with gravity off or its axis collapsed, every intent is none. Resolution in two passes: along-gravity movers first, processed from the far end of the gravity axis toward its source (stacks resolve bottom-up); then against-gravity movers, from the source toward the far end. A mover whose target cell is occupied when its turn comes stays. Fragile breaking (§3.1, one outcome) happens when an along-gravity mover is blocked by a fragile cell.
3. Loss check (destroyed player — no trigger in v1) and goal check.

### 3.8 Invariants (tests, before any renderer)

- Projection is pure and deterministic.
- **The true world is always consistent:** after any action, no entity's cell is solid and no two entities share a cell (v4; this is what makes §3.6 vacuous in v1).
- **Switch-and-reverse is identity:** a `switch` changes only the view.
- A tick is deterministic given (state, input).
- **Canonical state tuple, finite domains** (v3, C1): the voxel grid (material id per cell — mutable) · entity positions and alive flags · view (3D | side facing | top) · gravity direction + on/off · goal state. Static per puzzle (not in the tuple): entity kinds/materials, the material table. Equality and hashing are over the canonical serialization after symmetry normalization (§6). Room volume bounds everything; the solver is exact over this space once §3.3 and §3.7 are total, which v4 claims.

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
- **Non-triviality by ablation** (v4, C2): ablation removes one view (one side facing, or top) from the action set — **and if it is the start view, the ablated puzzle starts in 3D instead; 3D is never ablated** — then re-solves; a view counts toward the puzzle only if its removal makes it unsolvable. A v1 puzzle must have at least one counting view. **Decision depth** = the minimum number of `switch` actions over all shortest solutions (single-valued); that is the difficulty metric, never input length.
- **Symmetry normalization (v4):** the grid's rotation/reflection group acts on the WHOLE state — grid, entities, gravity, goal, and the view/facing (reflecting across X maps side +X to side −X) — and on actions; the canonical form is the lexicographically smallest image. Duplicates are rejected on the normalized hash.
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
6. Veto points from v3/v4: Sokoban pushing and the three-step enterability rule (§3.3); step-up as the only vertical verb (§3.3); switches take no time (§3.7).

## 10. Gates before build

1. pi round 4 on this v4 (fold check of round 3; step-up; any remaining partial rule).
2. **Smallest playable:** one room, 3D + side + top, gravity on/off, the four-property table, player + one box, reach the exit; the solver proves the room; twenty minutes of play. **First fixture (round-3 D):** gravity −Y, flat floor, player at (0,1,0), box at (2,1,1), side view from +X, exit beyond the box's projected square; the single `+Z` move must resolve to BLOCKED in the renderer's legality preview and in the headless solver alike.
3. Ten generated puzzles played. Then, and only then, the agent question (§2) with evidence from play.
