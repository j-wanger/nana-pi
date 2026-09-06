# Cooperative perspective-puzzle game — design

*2026-09-06. Status: **engine core RATIFIED by Jake in discussion** (§3); everything else is open (§9). NOT built; no repo yet. Slice 3 candidate over the UI-centric kit (`agent-frontend-design-2026-09-04.md`). **Independent pi review round 1: BLOCK** (`reviews/coop-game-2026-09-06/round-1.md`; seat adjudication in `adjudication-r1.md`) — two findings reshape the plan: the v1 systems as written are menu-replaceable (E1: a bounded rule-edit grammar is the minimum), and the game needs its own authoritative server (F1: bespoke-on-kit or an amended kit boundary). v2 waits on Jake's rulings; this text is round-1 as reviewed.*

## 1. Decision

Build a new browser game (not toy-battle) in which a human is the main player and an agent unlocks the fun. The world is a small voxel grid with a few deeply consistent systems: gravity, perspective (3D / 2D side / 2D top / 1D), a material property table, and later elements (water, fire) and light. Puzzles are not authored one by one; they are generated from the world by scripts and verified by a solver. The agent's power is the property and rule layer, exercised through tools the engine validates within a budget, plus knowledge of the dimensions the player cannot currently see. The player's power is structure and motion: moving, and changing perspective with a fast direct verb.

## 2. Why the agent is not forced

Test (Jake accepted it): **the agent is forced if a menu could replace it.** Authored puzzles enumerate their change space, so they are menus by construction. A systemic world does not enumerate its interactions, and "say what you want to be true" is the natural interface to an open, combinatorial change space (the Scribblenauts lineage; its dominant-strategy failure is answered by the budget). Three unforced roles, all turn-based consults, never inside the movement loop:

1. **Interpreter** of an open change space: the player describes a property change; the agent turns it into a validated, budgeted, previewed engine edit.
2. **Holder of what the player cannot see**: in a reduced mode the agent can query the full 3D world and report it.
3. **The physicist you call when stuck**: chat lives in a collapsible bubble, closed while playing.

Direct manipulation stays where hands beat language (Tears of the Kingdom is the counterexample to keep honest): movement, the perspective switch, building.

## 3. The engine core (RATIFIED 2026-09-06)

### 3.1 World

- Rooms of voxels on an integer grid. Every entity (player, boxes, enemies, fluids) carries a **true 3D integer position** at all times.
- A **material table** is the join key for every system. Properties (v1 set): `hardness`, `friction`, `bounciness`, `flammability`, `conductivity`, `opacity`, `reflectivity`, `density`, `state` (solid | liquid | gas | none), and **`passableFromTop`** (ratified addition: in top view the front-most cell of a pool is its surface; the table says whether you can stand on it).
- Gravity is a vector along one grid axis, one of six directions, magnitude on/off in v1.

### 3.2 Modes

- **3D** · **2D side** (four facings: collapse ±X or ±Z) · **2D top** (collapse Y, looking down) · **1D** = a projection of the *current 2D view* (nested, never a mode of its own), so the front-most rule applies twice in a fixed order.

### 3.3 Projection rule: FRONT-MOST (Jake: "top most makes sense")

The visible cell at a reduced-mode position is the nearest non-empty cell along the collapsed axis from the camera side. Hidden cells stay hidden. Projection is a pure function of (world, mode).

### 3.4 Physics acts only in the visible dimensions

Collapse an axis and every physical quantity's component along it is dropped. Ratified consequences, no per-mode tables:

- Top view: gravity vanishes (its axis is collapsed).
- Side view with gravity rotated into the screen: gravity vanishes too (same rule; a puzzle lever or forbidden by the rules, decided in §9, but never a special case).
- Fluids flow by gravity, so in top view water is a still region. Fire spreads in the plane. Light rays live in the plane.
- 1D: gravity exists only when its axis is the remaining one (a vertical shaft); otherwise a corridor with no gravity.

### 3.5 Movement in a reduced mode

An entity moves in the visible plane; its coordinates along collapsed axes are **frozen**; collision resolves against the projected world (§3.3). Applies to every entity, not just the player.

### 3.6 Re-embedding on mode change: PUSH OUT, THEN RESOLVE

When the mode changes, frozen coordinates return. For every entity, in a fixed order: if its true cell is now inside solid, push it out along the collapsed axis toward the camera (deterministic tie-break toward the camera); then physics runs (fall, slide, drown). Gravity is the arbiter. Consequences are the mechanic: cross a chasm in top view, return to side view, and you fall unless you chose a spot with floor under it.

### 3.7 Invariants (tests, before any renderer)

- Projection is pure and deterministic.
- Re-embedding is deterministic and idempotent (applying it twice equals once).
- **No-move round trip is identity:** a mode change immediately reversed with no movement in between leaves every entity where it was.
- A physics tick is deterministic given (world, mode, gravity, inputs).
- The solver's state space is finite: positions × mode × gravity direction × entity states, with the projection as a pure function.

## 4. Systems, in build order

1. **Data model first** (cannot be added later): grid gravity, the modes with §3.3–3.6, the material table with the full v1 property set.
2. **Elements** as cellular rules over the material table: an element × state table in the Breath of the Wild shape (fire spreads over flammable, water extinguishes, freezes; electricity over conductive). Rules land later; the table carries their properties from day one.
3. **Light** as raycasts over opacity and reflectivity (mirrors, beams, shadows as passage).

Three consistent systems beat eight shallow ones; elements and light wait until the core is felt.

## 5. The agent's contract

- **Tools only.** The agent never writes world state. Two tool families: `inspect` (returns the 3D truth of a region or entity as a block, hidden or shown per tool) and `edit` (a property change on a material or entity, validated by the zod schema, the rules, and the budget; the engine computes and returns a **preview** block before commit; commit is a second, mutating call so the player confirms per the kit's mutating-action rule).
- **Budget:** per puzzle, integer cost per property per magnitude (cost table in §9 open). The engine refuses over-budget edits; the refusal is the tool's error text.
- **Turn-based consults:** an agent turn costs seconds; it is a pause the player chooses. The agent has no tool that moves the player or changes the mode.
- **Audit:** the kit's ledger records every inspection the agent received and every edit it made, so a game can be replayed and the agent's honesty checked afterward (the trust-then-audit mechanic).

## 6. Puzzles from the world

- A puzzle = (room start state, goal predicate, edit budget).
- **Generator and solver are scripts**, never LLM work: pick a start and goal, solve by search over §3.7's state space, reject the trivial (minimum solution length; solution must touch ≥2 systems; open in §9: whether a puzzle must *require* an agent edit or merely allow one).
- **The agent judges and frames**: which verified puzzles are interesting, what the room is called, the hint when stuck. It never introduces an element that has not passed the schema and the solver.

## 7. Relation to the kit

| | |
|---|---|
| App-owned page | the game (Three.js), served from this app's listener per manifest `page` |
| Stage blocks | the agent's inspections and edit previews (`table`/`card`; likely one new block type for a room slice — allowed by the transferability rule) |
| Manifest tools | `inspect_*`, `edit_*`, `commit_edit` (mutating; `agent:changed` → the page hot-reloads the room) |
| Gate bar | unchanged, non-foldable |
| Chat | the requested **collapsible bubble** (closed by default, floating, badge when a reading arrives) — a kit change to `stage.css`/`stage.js`, both desks inherit it |

What this slice tests that slices 1–2 did not: heavy mutation with a live runtime underneath, hidden blocks, and the refresh path under a game loop. The frontend design's §5 failure rule stands: if the kit needs more than a block type, the design failed and the game goes bespoke.

## 8. Technology

- **TypeScript.** Packages in a new sibling repo (name and repo: Jake): `sim` (pure, headless, zod schemas, no DOM; the toy-battle core/sim pattern), `solve` (generator + solver over `sim`), `web` (renderer + page).
- **Three.js for rendering only**, loaded from a CDN import map (no build step, plain modules like the stage page). One scene; orthographic camera snapped to an axis for 2D and 1D, perspective camera for 3D; instanced meshes for voxels (a 16³ room is trivial).
- **No physics library.** Continuous rigid-body engines break the dimension flip and the solver; grid physics is a few hundred lines we own.
- Not Godot, Unity, Babylon: the agent tools and the ledger want a JavaScript runtime they reach directly.

## 9. Open (Jake's calls, in the order they block)

1. Repo and working name.
2. **Must a puzzle require an agent edit**, or is "solvable by the player alone, faster with the agent" the intended spectrum? Shapes the generator's rejection rules.
3. Gravity into the screen in side view: lever or forbidden.
4. The player's perspective verb: which modes are reachable from which (all six facings always? earned?), and its input.
5. Does the agent see full 3D by default, or is that the unlock ladder (Jake's third mechanic)?
6. Edit cost table; budget per puzzle vs per room.
7. 1D specifics: the line is the player's row along the movement axis?
8. v1 elements and states; light mechanics.
9. Death, reset, and win-condition types.

## 10. Gates before build

1. Independent pi review of §3–§6 (round 1 brief in `reviews/coop-game-2026-09-06/`): projection and re-embedding edge cases, solver finiteness, the agent boundary, the menu test against the v1 interaction table.
2. **The interaction table for v1** written out (materials × gravity × modes): if it reads as a menu, the world is too thin and the agent is forced; stop.
3. **Smallest playable:** one room, 3D + side + top, gravity + material table, no elements, no light; the player moves and switches perspective; the agent has `inspect` and one `edit` with budget 1. Twenty minutes of play decides whether elements come next.
