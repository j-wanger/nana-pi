# Plan: world-graph (2026-10-30)

Worktree `~/nana-pi-wt/world-graph`, branch `feat/world-graph`, based on main `57167e92`. Rows R-3170 to R-3176 (map-spawn-edges holds R-3149 to R-3160, shops-flows R-3161 to R-3169). No new artifact ID: the graph data is part of A-087, the public hive page, as the component data is.

Revision 1 takes the adversary's attack in `plan-attack.md`:
- All six MUST findings (1 to 6).
- SHOULDs 7 (positions made once at publish time), 8 (a `paths` field in the deliverable parser), 9 (geometry pinned on the base commit's graph, not the live one), 10 (ready mark after the linked chapter), 11 in part (the theater moves to lane 3) and 12 (edge-count units).
- NOTEs 16 (declared loop steps marked), 17 (first-look's own viewport height) and 18 (the deriver can stop the Pages job).
- NOTE 15 (the hive's own code is unclaimed by any component) is a residual, under Later lanes.

This is lane 1 of 3 for the hive's new shape:
1. **world-graph (this lane):** the world's shape (a graph laid out by springs around the lane loop, edges as roads) and the two modes (scroll tour, free exploration). The library keeps its current archive form as a placeholder.
2. **shops-flows:** shops, cargo, buyers and restocks on top of this graph. **Paused.** The seat holds its build until this lane passes its shape gate, then rewrites its brief against this lane's graph file (see "shops-flows: paused, and what it changes").
3. **structure animations (later):** one thematic animation per structure, including the memory component's movie theater: its form, its tapes and its signals.

## Purpose

The owner rejected the landed hive's shape on 2026-10-30: "visual design is ok, but theres no shape to the world, the 3dmk world shape and layout makes sense for its workflow, ours is just 9 boxes next to each other in a 3 x 3 grid, with no flow/process designed". Today `apps/hive/layout.mjs` puts workflow components on a square grid and governance on a ring.

He picked the agreed reading from three offered (lane loop as a road; 3dmk rings; capability districts):

- "Lane loop is closer to my thinking."
- "our setting/code map, capability map, fits more like a graph, so maybe actually plot it with graph based nodes and edges, and with say a spring layout maybe, edges then are naturally fitting as roads"
- "memory can be an 20th century style movie theater playing different tapes and transmitting those as signals or something to the other lanes" (lane 3)
- "if you look more closely at the 3dmk site, it has thematically fitting animations for each building/structure" (lane 3)
- "We also need the scroll script mode and free exploration mode similar to the original, the current exploration is lackluster, as it has no order and its very easy to misclick and zoom into a building especially on mobile"

The lane loop is nana-pi's process: objective and idea, then plan and one adversary, then the queue of issues, then the build in the workshop, then the seat's checks, then the review ladder, the land gate, the release route and the published pages, and back to the next idea.

This lane delivers one feature: **a viewer can trace the numbered lane loop from the layout alone, see each other structure beside the stage it serves, follow roads that are recorded relationships, read the loop chapter by chapter by scrolling, and explore freely without a tap or swipe ever moving the camera.**

### Measured today (main `57167e92`)

The planner measured these with a scratch script over the existing parsers: `repoGraph` in `scripts/code-map.mjs`, `artifactRegistry` and `artifactReads` in `scripts/deliverables.mjs`, and a line regex for `Made by:`/`Read by:`. The adversary reproduced every count (attack NOTE 13). The builder re-measures with the deriver.

Component-to-stage mapping, all 23 components of `docs/components/nana-pi.json`:

| Role | Count | Components (chapter) |
|---|---|---|
| Spine stage, in loop order | 9 | 01 Compass (objective and idea) · 02 Drafting table (plan and adversary) · 03 Queue (issues) · 04 Workshop (build) · 05 Eyes (seat checks: first-look, outside-reader) · 06 Review ladder · 07 Land gate · 08 Release route · 09 Notice board (published pages) |
| Support stage | 5 | Library (memory) under 01 · Tool belt under 04 · Desk under 05 · Lab under 05 · Setup under 08 |
| Governance gate | 6 | Rulings under 01 · Requirement contract under 02 · Code map under 02 · Identity scan under 03 · Writing rule under 03 · Command gate under 04 |
| Cannot place on the loop | 3 | Stage (a product surface for focused apps, not a step of the loop) · Key cabinet (absent) · Night shift (absent). These go in chapter 10, "Outside the loop". |

Two governance components sit on the spine (Review ladder, Land gate); their kind stays `governance` in the contract.

Edges between the 23 components, per source, with each source's count unit:

| Source | Count unit (per directed pair) | Directed pairs | Unordered pairs | Largest pair |
|---|---|---|---|---|
| Code imports between component parts | import links: distinct (importing module, imported module) | 55 | 45 | Setup → Command gate, 60 links |
| Artifact registry: `Artifact:` writer to `Reads:` reader | distinct artifact IDs | 20 | 15 | Library → Setup, 9 |
| Deliverable joins: a row's `Made by:` path to its `Read by:` path | distinct deliverable rows | 28 | 21 | 4, three pairs tie (Tool belt → Setup, Command gate → Setup, Release route → Land gate) |
| Shared feature | distinct shared FEAT IDs | — | 8 | 1 |
| Lane loop (the loop file's spine order, closed) | 1, declared | 9 | 9 | 1 |

- Artifact registry and joins together give 24 unordered pairs.
- The recorded sources give 64 unordered pairs among the 21 components with any edge, a density of 0.30.
- 5 of the 9 loop segments are also recorded edges. The other 4 are declared only: Compass–Drafting table, Drafting table–Queue, Eyes–Review ladder and Notice board–Compass.
- Two hubs come from shared-folder claims. Command gate touches 18 pairs, because its part `packages/nana-pack/lib/` claims the pack's shared library. Setup touches 11, because `packages/nana-setup/` claims every Claude Code hook.
- Key cabinet and Night shift have no edge from any source.
- Four attached components have no recorded road to their stage: Library to Compass, Tool belt to Workshop, Desk to Eyes, and Lab to Eyes.
- 13 of the 22 consecutive tour steps have no recorded road (attack finding 2).

The adversary simulated one reading of the first plan, an all-roads spring pass (attack finding 1, inferred numbers).
- With all 68 roads drawn, the overview had 148 to 224 road crossings. Weak anchors folded the loop. Strong anchors pulled both hubs into the loop's centre, where their roads became spokes.
- With only the loop and artifact roads drawn (30 roads) at the same positions, it had 21 to 22 crossings.

## Assumptions

- A1. Feature placement: the rows go in FEAT-039, the hive's home (A-087, A-086 and R-3120 to R-3139 live there). What may be wrong: FEAT-039 is the largest feature by rows and known-bug lines; shops-flows makes the same choice.
- A2. The v1 component contract stays frozen and untouched. The graph is a sibling document, `graph.json`, with its own contract, `nana-component-graph` version 1, in `docs/components/graph-contract.json`. Every v1 reader keeps working, because no v1 file, field or check changes: the audit, its tests, the fixture and the page's component check. A v1-only consumer ignores `graph.json`. **Roads live only in `graph.json`.**
- A3. Positions are made once, at publish time, in Node, and written into `graph.json`. The graph deriver is their only maker, and the hand source rejects them. Browsers never run the spring, so float differences across chips and engines cannot move the picture. The page reads the positions and road paths and only draws them. This reverses the first plan's "positions stay out of the data" (attack SHOULD 7; the seat's call, taken).
- A4. The lane loop, each component's role and each component's chapter stage live in a tracked hand source, `docs/components/loop.json`, in the style of `docs/components/nana-pi.json`. It holds the spine order. For every other component it holds the role (`support`, `gate` or `outside`) and the spine stage whose chapter it joins, or `outside`. The mapping table above is its first content. It holds no edge, position or count; the deriver rejects any.
- A5. The deriver is a new script, `scripts/component-graph.mjs`. It reads the loop file and `docs/components/nana-pi.json` (for parts and features). It reads `REQUIREMENTS.md` through the existing parsers in `scripts/deliverables.mjs`, and the import graph through the import-only `repoGraph`. So it does not depend on map-spawn-edges' launch edges. It writes one edge record per (from, to, source) with its count in the unit above. Then it calls the layout in `scripts/component-graph-layout.mjs` and writes nodes with positions and roads with paths.
- A6. The deliverable join needs paths that `deliverableClaims` does not return today. The move: each claim gains `paths`, the comma-split detail of a `Made by:` or `Read by:` claim whose kind names paths, and `[]` otherwise. The deriver is its second caller, after the deliverable checker (2026-10-22 helper ruling). The checker's notes and outputs do not change. shops-flows' R-3169 changes `artifactConsumers` in the same file; the two changes touch different functions.
- A7. A file claimed by two components (6 modules today) counts for both. This is the audit's own `contains` rule, so the graph agrees with the audit's activity counts.
- A8. Edges are directed in the data and undirected as roads: one road per unordered pair with any edge. Its record keeps every source with its count. A road card writes the units: "60 import links", "9 artifacts", "3 deliverable rows", "1 shared feature". The 4 declared loop segments carry "loop step, declared", so the loop road stays honest (attack NOTE 16).
- A9. Road classes and when each is drawn:
  - `loop`: the widest road, always drawn.
  - `artifact`: always drawn. With `loop`, this makes the **overview set**, 30 roads today.
  - `spur`: a short declared tie from an attached component to its stage, drawn only where no overview road already joins them. It is marked as the chapter tie, never as a recorded relationship.
  - `import` and `feature`: drawn only for the selected structure, in explore mode, or for the chapter's structure in the tour.
  - A road takes its widest class.
- A10. Forces in the spring pass, a Fruchterman–Reingold pass with these terms:
  - springs on the overview roads only (loop and artifact), weighted by count on a log scale sealed against the real maximum (Library → Setup, 9 artifacts);
  - an anchor spring from each spine stage to its loop slot, an ellipse in loop order;
  - an attachment spring from each attached component to its stage;
  - repulsion between all nodes, and a weak centring force on all nodes.
  - Import and feature edges do not shape positions. So the two hubs' 60-link and 37-link import pairs cannot pull them into the centre. After each iteration, an attached component that falls inside the spine polygon is moved out to the polygon edge, outward. A final pass, in a fixed pair order, pushes apart any two footprints closer than the clearance.
- A11. "Outside the loop" components (Stage, Key cabinet, Night shift) are not in the spring. They stand on a fixed plot, a sealed offset beside Notice board's slot, at sealed spacing in loop-file order. A declared spur, class `spur`, joins the plot to Notice board.
- A12. Determinism without floating drift:
  - The iteration uses only `+ − × ÷` and `Math.sqrt`, which IEEE rounds correctly on every machine.
  - Slot angles, the spiral start and log weights are computed once and rounded to the sealed position grid.
  - Positions are rounded to that grid after every iteration.
  - There is no random source. Initial positions come from the loop slots, plus a golden-angle spiral around each attached component's stage slot, in loop-file order. The repo's seeded `rng` is not needed.
  - The published positions are what the tests pin, rounded.
- A13. The world has a sealed half-extent, `WORLD_HALF_EXTENT`, not computed from positions. The layout clamps every position inside it. The page's overview frames the spine and attached structures; the outside plot is framed in its own chapter.
- A14. Footprints: the deriver takes each component's footprint radius from an exported `footprint(component)` in `apps/hive/layout.mjs`. That is the same rule the page uses to draw it, so clearance and road checks measure what is drawn. `scripts/hive-page.mjs` already imports from `apps/hive/config.mjs`, so a script importing from `apps/hive` is precedented.
- A15. Roads are routed in the deriver: a straight segment between foundation edges, and where that enters a third footprint, one or two bend points around it. Paths are rounded to the position grid and written into `graph.json`.
- A16. Walkways and the governance perimeter ring go. Roads and spurs replace them. The README sentence "walkways depict adjacency, not a claimed data dependency" is replaced by what each road class means.
- A17. Tour chapters, in order:
  - 00 the whole loop;
  - each spine stage, followed by its attached components as sub-chapters (for example 01 Compass, 01.1 Rulings, 01.2 Library);
  - 10 Outside the loop and its three;
  - a closing view of the whole loop with the Explore button.

  Every component has exactly one chapter, so the rail lists all 23, now in tour order. Each structure's floating label carries its chapter number ("01 COMPASS", "02.1 REQUIREMENT CONTRACT").
- A18. What the tour camera follows. The tour path is a walk on drawn roads:
  - stage to its first sub-chapter: out along the spur, or the overview road joining them;
  - one sub-chapter to the next of the same stage: back to the stage, then out;
  - the last sub-chapter to the next stage: back to its stage, then along the loop segment;
  - stage to the next stage with no sub-chapter: along the loop segment;
  - Notice board to chapter 10: along the outside spur.

  Between consecutive chapter anchors, the camera target lies on that walk.
- A19. Scroll drives the tour. The page becomes a scroll document of chapter sections over a fixed scene. Scroll progress maps through a pure function to a camera pose. At a chapter's anchor the pose frames that chapter's structure. Under reduced motion or `?still`, the pose is the nearest anchor's exactly. A component hash `#<id>` scrolls to its chapter, so today's shared links keep working. A resize keeps the current chapter, deriving the pose from the chapter rather than from a reset scroll.
- A20. Hashes and who writes them (attack MUST 5):
  - `#<id>` is a tour chapter;
  - `#explore` opens explore;
  - `#explore/<id>` opens explore with that structure selected, not entered (a deep link for captures);
  - `#enter/<id>` is inside that structure.

  A tap or click only selects: it highlights the structure and its roads and shows a short card with Enter and Back to tour. **Selection never writes the hash.** Only Enter writes a hash (`#enter/<id>`), and only `hashchange` to `#enter/<id>` or `#<id>` moves the camera to a structure. Back writes `#explore`. Back to tour writes the selected structure's chapter hash.
- A21. Gestures:
  - A pure reducer in `apps/hive/explore.mjs` decides them; an exported `bindGestures(target, reducer, apply)` in the same module installs the pointer listeners.
  - `main.mjs` attaches no other pointer listener to the canvas. It writes the hash only through the effect applier.
  - In explore, one-finger drag orbits and two-finger pinch zooms within bounds. Neither ever selects.
  - In the tour, the canvas ignores taps, and vertical swipes scroll the page (`touch-action: pan-y` on a scrollable body).
- A22. The pixel renderer draws the published positions: one mark per structure and one line per overview road, inside its grid. In pixel mode the tour changes the card and the highlight; there is no camera.
- A23. Every structure keeps its current form and cells, at its new position. Library keeps its current archive form as the placeholder for lane 3's theater.
- A24. The page sets `data-hive-chapter` and `data-hive-pose` (the camera target and position, rounded) on the root element after each applied pose. The seat's gesture check reads them.
- A25. A deriver failure on main stops the whole Pages job, product page included, because both run in one job. R-3170's tracked-tree run in the suite catches a loop-file drift before any land (attack NOTE 18).

## Open choices

- O1. Where the graph checker lives: beside `checkComponentData` in `scripts/component-contract.mjs`, or in a new `scripts/component-graph-contract.mjs`. The page needs its own small check in `apps/hive/runtime.mjs` either way, because `scripts/` is not published.
- O2. Bend-point routing (A15): how bends are chosen, within the no-road-through-a-structure test and the crossing caps.
- O3. The loop slot proportions and start angle, and the force strengths, within the sealed tunables and the loop-order test.
- O4. Tour section height, the scroll-to-progress curve, and the camera's lean along the walk.
- O5. Card wording for roads and for the Outside the loop chapter, within the three reading voices and the units in A8.
- O6. Highlight style for a selected structure and its roads, in the monochrome palette.

## Questions for the owner

Question: Is this the lane loop, with these nine stages in this order, each other structure shown beside the stage it serves, and Stage, Key cabinet and Night shift outside the loop?
Default: yes, as in the mapping table: Compass, Drafting table, Queue, Workshop, Eyes, Review ladder, Land gate, Release route, Notice board, and back to Compass.
What the default gains and misses: gains a loop that follows the owner's own sentence stage for stage; misses closer homes for some: Desk is a dashboard over sessions, nearer Workshop than the seat's checks, and Library has no recorded road to Compass.
Cost of a wrong guess: easy to undo: the loop is one hand file; a change re-lays the world and reorders the tour with no code change.
If answered otherwise: the builder writes the owner's order and attachments into `docs/components/loop.json`.

Question: On the whole-world view, should only the loop and artifact roads show (about 30), with code imports and shared features appearing when a structure is selected, or should all 68 roads show at once?
Default: about 30 roads on the overview, plus short ties from each structure to its stage; a selected structure adds its import and feature roads.
What the default gains and misses: gains a road network a person can follow, about 20 crossings in the adversary's simulation; misses the full code wiring at a glance, which the all-roads view shows at 150 to 220 crossings.
Cost of a wrong guess: easy to undo: which classes the overview draws is one sealed list; the data carries every road either way.
If answered otherwise: the overview draws all 68 roads by class width, and the crossing cap is reset by the seat with the owner's answer as its provenance.

Question: In free exploration on a phone, may two fingers pinch to zoom, or should zoom be buttons only?
Default: bounded pinch zoom is allowed; a tap only ever selects, and only Enter moves the camera to a building.
What the default gains and misses: gains the gesture phone users expect; misses the rare case where a two-finger scroll starts a zoom, which buttons-only would rule out.
Cost of a wrong guess: easy to undo: one branch of the gesture reducer and one sealed flag.
If answered otherwise: pinch does nothing, and plus and minus buttons zoom within the same bounds.

## Feature

Feature: FEAT-039 · See the product and its decisions in one report

Lane class: `ordinary` (`node scripts/lane-class.mjs --root . --files docs/components/loop.json,docs/components/graph-contract.json,docs/components/graph-fixture.json,scripts/component-graph.mjs,scripts/component-graph-layout.mjs,scripts/component-graph-config.mjs,scripts/component-audit.mjs,scripts/deliverables.mjs,scripts/hive-page.mjs,scripts/hive-gesture-check.mjs,.github/workflows/pages.yml,apps/hive/layout.mjs,apps/hive/roads.mjs,apps/hive/tour.mjs,apps/hive/explore.mjs,apps/hive/camera.mjs,apps/hive/runtime.mjs,apps/hive/main.mjs,apps/hive/text-layer.mjs,apps/hive/pixel.mjs,apps/hive/config.mjs,apps/hive/index.html,apps/hive/assets/hive.mjs,apps/hive/assets/road.mjs,apps/hive/README.md,packages/nana-pack/tests/hive-graph.test.mjs,packages/nana-pack/tests/fixtures/hive-graph-base.json,packages/nana-pack/tests/hive-page.test.mjs,packages/nana-pack/tests/hive-assets.test.mjs,packages/nana-pack/tests/pages-workflow.test.mjs,packages/nana-pack/tests/component-audit.test.mjs,packages/nana-pack/tests/requirements-deliverables.test.mjs,REQUIREMENTS.md,docs/requirements-tree.md,docs/known-bugs/FEAT-039.md,docs/code-map.md`, re-run 2026-10-30 at `57167e92` after revision 1).

Size: larger. About 900 to 1,200 lines of code and tests: a deriver with layout and routing, a contract, a parser field, a scroll-document page, a gesture reducer and binding, a seat gesture script and Pages wiring. The larger builder (`pi-worker --lane-size larger`) fits.

Rows: R-3170 to R-3176.

Requirement diffs to existing rows (same feature):
- R-3120 (grid placement with a governance ring) is retired; R-3172 replaces it. Its test is replaced.
- R-3126: "list all components in contract order" becomes "list all components in tour order".
- R-3127 gains "or a graph document of another contract name or version, or whose nodes differ from the components".
- R-3129 gains "the ready mark is set only after the hash's chapter scroll and pose are applied".
- R-3130: the builder also writes `graph.json`, and refuses a graph whose nodes differ from the components with one line before creating output.
- R-3131: the identity scan also reads `graph.json`.
- R-3139: the Pages job runs the graph deriver between the audit and the publisher.
- R-3125 (camera focus frames every chamber) stays; Enter uses that focus.

## Builds and the shape gate

- Before build 1, the seat runs the negative control in Visual acceptance step 1. Line 7 of the spec must FAIL on both control captures before any build starts.
- Build 1: every row below. Then the seat's first-look runs, visual-reader and the gesture check.
- Gate: after build 1, the seat shows the owner the frames with one question, "is this the shape?". Build 2 does not start until he answers. An answer that changes the shape goes into build 2's brief.
- Build 2: the owner's shape answer, the visual judge's FAIL lines, the gesture check's failures, and review fixes.
- If build 1 runs long, these move to a later lane:
  - The pixel renderer's road lines. Pixel keeps its marks at the published positions, and its renderer line says "roads in 3D only".
  - Road cards. Selection still highlights the roads.
- If build 1 still runs long, the data half lands first as its own reviewed change: R-3170, R-3171 and R-3176, with the published positions. It has no visual risk, and shops-flows needs it. Both modes and mobile safety never move out of this lane.

## shops-flows: paused, and what it changes

- **Paused.** shops-flows has build brief 1 on its branch and no build. The seat does not start it. After this lane passes its shape gate, the seat rewrites its plan and brief against `graph.json`, and it rebases on this lane's land.
- **Roads live only in `graph.json`.** shops-flows' v2 components document adds `shops` and `flows` and no `roads` field. Its supply, delivery, home and edge roads become road classes in `graph.json`, and shops become nodes with role `shop`. They are made by the graph deriver or a step it calls, with the components' positions held fixed, so adding shops never moves a component. The layout module exports that settle step for this reuse.
- **One publisher command line, agreed for both lanes:**
  `node scripts/hive-page.mjs (--out <dir> | --serve [--port <n>]) [--data <components file> --graph <graph file>]`
  - With neither file, it uses the frozen fixture and its graph fixture.
  - `--data` without `--graph`, or `--graph` without `--data`, exits 2 with the line `hive-page: --data and --graph go together; make the graph with node scripts/component-graph.mjs --out <file>`.
  - shops-flows extends this line only by accepting a version-2 components file in `--data`. It adds no flag.
- Its town layout (its O1: an outer ring past the governance perimeter) is dropped. Its camera stops follow this lane's modes: a shop is a sub-chapter of the stage whose components make its items, and a selectable structure in explore.
- Its R-3127 and R-3130 diffs merge with this lane's diffs to the same rows. It shares `contains`, which this lane exports from `scripts/component-audit.mjs`.

## Threat model

In scope: honest variation in our tools' output. Examples:
- a component added to the audit but not to the loop file, or a loop file naming an unknown stage;
- a file claimed by two components, a hub component claiming a shared folder, or a component with no edge at all;
- a `Reads:` or `Read by:` line the checker flags, or a module with an unparsable import;
- a local `--data` file passed without a matching graph, or a graph from another commit;
- a later lane adding imports between components (the suite pins geometry on the saved base graph, not the live one);
- a phone tap that drifts a few pixels, a vertical swipe, a two-finger scroll, a double tap, or a viewport resize mid-tour;
- a renderer fallback to pixel, and reduced motion.

Out of scope: deliberate forgery, such as a hand-edited `graph.json` with invented edges or positions that passes the contract. A finding outside this model is a residual and goes in the FEAT-039 known-bug file.

## Precedent

- `apps/hive/layout.mjs` (`layout`, `bees`): the pure chamber and cell model with world bounds. It stops placing chambers. It reads each node's published `x`, `z`, keeps its chamber and cell output shape, and exports `footprint` for the deriver. `assets/hive.mjs`, `pixel.mjs` and `camera.mjs` keep their inputs.
- `apps/bench/lib/plan.mjs` (`rng`, mulberry32): the repo's seeded source. It was considered and not used, because the layout needs no random source (A12).
- `apps/hive/camera.mjs` (`focus`, `overview`): framing by bounding box at an aspect. `apps/hive/tour.mjs` builds its chapter anchors from `focus`, and Enter uses `focus` unchanged.
- `apps/hive/runtime.mjs` (`prepare`, `firstFrame`, `animationStep`): the page's contract refusal, ready mark and motion clock. `prepare` gains the graph check, and `firstFrame`'s ready call moves after the chapter pose (R-3129 diff).
- `apps/hive/main.mjs` (pointer handlers, `release`, `pose`, `chooseStop`, the `hashchange` handler): today's misclick path, which the attack traced to three places.
  - Line 180-181 marks only horizontal drags as moved.
  - So a vertical swipe ends at line 186 as a tap, which writes the hash at line 199.
  - The `hashchange` handler at line 170 then flies the camera.

  The gesture logic moves into `apps/hive/explore.mjs`; `main.mjs` keeps only wiring.
- `apps/hive/text-layer.mjs` (`textLayer`, `renderText`): rail, chapter picker, cards and voices. Chapters gain sub-numbers and tour order; the landing card becomes chapter 00.
- `apps/hive/assets/hive.mjs` (`buildHive`, per-id forms, `beam`, `fence`): THREE passed in, and pickable `userData.component`. Roads reuse `beam` and `fence` in `apps/hive/assets/road.mjs`. The walkway loop and the perimeter ring are removed, and every per-id form is kept.
- `apps/hive/config.mjs`: sealed visual values with provenance, pinned by R-3134. The page's new values go here: road widths by class, the overview class list, tap tolerance, zoom bounds, tour section height.
- `apps/hive/pixel.mjs` (`pixel`, `drawPixel`): the draw list inside the sealed grid. Overview roads become lines in the same list.
- `docs/components/nana-pi.json` with `scripts/component-audit.mjs` (`checkSource`): a hand source checked by a tool that rejects derived values written by hand. This is the model for `docs/components/loop.json` and its check.
- `scripts/component-audit.mjs` (`buildAudit`, `main`, private `contains`): the CLI shape (`--out`, `--root`, named problem lines, exit 1 and 2). Move: export `contains`, and the deriver imports it as the second caller.
- `scripts/component-audit-config.mjs`: sealed paths with provenance. This is the model for `scripts/component-graph-config.mjs`, which holds the spring tunables, loop slots, attachment radius, outside plot, `WORLD_HALF_EXTENT`, the position grid, the weight scale, clearance and the two crossing caps.
- `docs/components/contract.json` and `scripts/component-contract.mjs` (`checkComponentData`): a field-list contract with `where: field detail` problem lines. This is the model for `docs/components/graph-contract.json` and the graph check.
- `docs/components/fixture.json`: the five-component fixture. `docs/components/graph-fixture.json` is its graph, written by the deriver over a fixture repo and saved.
- `scripts/code-map.mjs` (`repoGraph`): the import-only module graph with `callees`. This is the deriver's import source.
- `scripts/deliverables.mjs` (`artifactRegistry`, `artifactReads`, `deliverableClaims`): the only parsers of `Artifact:`, `Reads:`, `Made by:` and `Read by:` lines. In-lane change: each `deliverableClaims` claim gains `paths` (A6). Guard: the existing `packages/nana-pack/tests/requirements-deliverables.test.mjs` stays green, and the checker's output on the tracked tree is unchanged.
- `scripts/hive-page.mjs` (`buildHivePage`, `main`): the atomic publisher and its one-line refusals. It gains `--graph` on the agreed command line and writes `graph.json`.
- `.github/workflows/pages.yml` with `packages/nana-pack/tests/pages-workflow.test.mjs` (R-3131, R-3139): the step order and the identity-scan steps.
- `scripts/first-look.mjs` (`resolvePlaywright` via `scripts/playwright-resolve.mjs`, `waitForHive`, `captureUrlPage`) and `scripts/first-look-config.mjs` (`VIEWPORT_WIDTHS`, `VIEWPORT_HEIGHT`): the browser plumbing for the seat's gesture check `scripts/hive-gesture-check.mjs`. R-3174 imports the viewport sizes rather than restating them.
- `scripts/visual-reader.mjs`: the judge, used here also for the negative control.
- `packages/nana-pack/tests/hive-page.test.mjs`, `packages/nana-pack/tests/hive-assets.test.mjs` and `packages/nana-pack/tests/component-audit.test.mjs`: fixture-repo and build-and-compare tests. They are the model for `packages/nana-pack/tests/hive-graph.test.mjs`.
- `docs/reviews/hive-render-2026-10-29/replicate-art-spec.md`: the six spec lines this lane's visual acceptance keeps.

`npm run map:search` results taken:
- "force directed spring layout positions" named `apps/hive/camera.mjs`. No layout precedent exists beyond `apps/hive/layout.mjs`.
- "component owner of a file path parts" named `scripts/component-audit.mjs`, `scripts/component-audit-config.mjs` and `scripts/component-contract.mjs`.
- "scroll progress camera tour" named `apps/hive/camera.mjs`, `apps/hive/config.mjs` and `apps/hive/main.mjs`. No scroll-driven precedent exists.
- "pointer tap gesture select" named nothing relevant (knowledge pointers). `apps/hive/main.mjs` stays the gesture precedent.
- "seeded random deterministic" named `apps/bench/lib/plan.mjs` (`rng`), used only to decide against a random source.
- "artifact reads writers edges" named `scripts/deliverables.mjs` and `scripts/code-map.mjs`.

Impact (`npm run map:impact`):
- `apps/hive/layout.mjs` is called by `main.mjs`, `runtime.mjs` and `hive-assets.test.mjs`. Its tests are `hive-page.test.mjs` and `hive-assets.test.mjs`.
- `apps/hive/assets/hive.mjs` is called by `main.mjs` and `hive-assets.test.mjs`.
- `scripts/hive-page.mjs` is called by `hive-page.test.mjs`.
- `scripts/component-audit.mjs` is called by `component-audit.test.mjs` (39 s measured). Exporting `contains` changes no output.
- `scripts/deliverables.mjs` has 34 transitive callers, among them `scripts/product-report.mjs`, `scripts/code-map.mjs`, `scripts/component-audit.mjs`, `scripts/lane-class.mjs` and 21 test files. Adding `paths` changes no existing field.

Expected test edits (a forecast, not a limit):
- The R-3120 test is replaced by R-3172's.
- The R-3126 test's rail order becomes tour order.
- The R-3127 and R-3130 tests pass a graph with their data and gain the mismatched-graph case.
- The R-3129 test gains the after-chapter ready mark.
- The R-3131/R-3139 workflow test gains the graph step and the `graph.json` scan.
- The R-3134 pin test gains the page's new sealed values.

## Outside precedent

d3-force (Mike Bostock and contributors, ISC licence, github.com/d3/d3-force). Verdict: borrow.
- Its link, many-body, centring and position forces with a cooling alpha are the model for the spring pass. Its position force is the model for the spine's anchor and the attachment spring.
- Skip the dependency. The layout is a short Fruchterman–Reingold pass in `scripts/component-graph-layout.mjs`, so there is no new runtime dependency and nothing vendored.

Other public references: Fruchterman and Reingold, "Graph Drawing by Force-directed Placement" (Software: Practice and Experience, 1991), the algorithm named here. https://3dmk.com/ stays the look and the model for chapter-by-scroll and for an Explore button that leaves the chapters and returns to them. No code, text or assets come from it.

## Must-meet

1. R-3170 · The graph comes only from recorded relationships and the loop file, in named units.
   - Proves: every road traces to an import, an artifact line, a shared feature or the loop file, and every count means one stated thing.
   - Pins: over a fixture repo (a temporary git tree with five components, a ledger and modules), `scripts/component-graph.mjs --out` writes exactly the expected edge records. Each record is one (from, to, source) with its count:
     - `import`: distinct import links between two components' parts;
     - `artifact`: distinct artifact IDs from an `Artifact:` writer and a valid `Reads:` reader;
     - `join`: distinct deliverable rows, from a row's `Made by:` and `Read by:` paths, read through the new `paths` field;
     - `feature`: distinct shared FEAT IDs;
     - `loop`: 1 per consecutive spine pair, closed, marked `declared` where no other source joins the pair.
   - Also:
     - A `Reads:` line the parser marks invalid gives no edge, and a self-pair gives no edge.
     - A file in two components gives edges for both.
     - Each `deliverableClaims` claim carries `paths`, `[]` for a reason-only kind, and the deliverable checker's output on the tracked tree is unchanged.
   - On the tracked tree, the deriver exits 0, every edge end is a component, and it prints the real counts per source as report lines, not assertions.

2. R-3171 · The loop file places every component exactly once, and every reader refuses one that does not.
   - Proves: the loop cannot drift from the audit silently, and the page never draws a graph for other components.
   - Pins: the deriver fails with one line naming the ID for each of these:
     - a component missing from the loop file, or listed twice;
     - an unknown ID;
     - a non-spine stage that is not a spine ID or `outside`;
     - a spine of fewer than three stages;
     - an edge, position or count written by hand.
   - `hive-page` with a graph whose node IDs differ from the components exits 1 with `hive-page: graph nodes must match the components` and creates no output. `prepare(components, graph)` on the same pair returns one plain error and no scene.
   - `docs/components/contract.json` and `docs/components/fixture.json` are byte-identical to `57167e92`.

3. R-3172 · The published layout is deterministic, bounded and shaped like the loop.
   - Proves: the same data gives the same world on every machine, nothing drifts off the map, the loop reads as a loop, and every structure stands beside its stage.
   - Pins, on the graph fixture and on `packages/nana-pack/tests/fixtures/hive-graph-base.json` (the deriver's edge output at `57167e92`, saved once):
     - The published positions, rounded to the sealed grid, deep-equal a saved golden output for each. The test runs on the macOS and Windows legs alike.
     - Every position lies inside the sealed `WORLD_HALF_EXTENT`. The same holds on a fixture variant with two edge-less outside components and one edge-less attached component.
     - No two footprints are closer than the sealed clearance.
     - The spine stages in loop order form a simple closed polygon, and their angles around its centroid run in loop order.
     - Every attached component lies within the sealed `ATTACH_RADIUS` of its stage and outside the spine polygon.
     - Every outside component stands on the sealed outside plot.
   - The tunables in `scripts/component-graph-config.mjs` (iterations, ideal length, repulsion, anchor, attachment, centring, cooling, loop slots, `ATTACH_RADIUS`, outside plot, `WORLD_HALF_EXTENT`, position grid, weight scale, clearance) are sealed with provenance and pinned by this one test. Every other assertion imports them by name.

4. R-3173 · Roads are the edges, typed by source; the overview stays readable, and no road cuts through a structure.
   - Proves: the viewer's roads are recorded relationships or marked ties, the overview is a network a person can follow, and a road never passes through a third building.
   - Pins:
     - The published `roads` hold exactly one road per unordered pair with any edge, plus one `spur` per attached component that no overview road joins to its stage, plus the outside spur. Each road carries its sources with counts, and its class is the widest of `loop`, `artifact`, `spur`, `import`, `feature`.
     - The loop road is one closed path through the spine stages in loop order, with each declared segment marked.
     - On the graph fixture, on the saved base graph, and on two generated graphs (one denser than the fixture, one with a single hub joined to every node), no road path enters the footprint of a structure that is not one of its ends.
     - On the saved base graph, the overview set (`loop`, `artifact`, `spur`) has at most `OVERVIEW_CROSSING_CAP` crossings, and at most `LOOP_CROSSING_CAP` of them cross the loop road. Both caps are sealed in `scripts/component-graph-config.mjs` with provenance: chosen 2026-10-30, at 12 and 2. That is below the adversary's simulated 21 to 22 for the same 30 roads without attachment springs, so the layout must earn the readable network, and above zero, so it stays buildable. The deriver also prints the tracked graph's crossing count as a report line.
     - `buildHive` draws the overview roads as road mesh groups with `userData.road` naming the pair. A selection adds that structure's `import` and `feature` roads. No walkway or perimeter ring remains.

5. R-3174 · The scroll tour walks the loop chapter by chapter, with the camera on the roads.
   - Proves: a reader scrolling the page meets every stage in loop order, sees each one framed and numbered, and travels along drawn roads between them.
   - Pins:
     - `tour(layout, graph)` lists chapters in A17's order, and every component appears exactly once.
     - At each chapter's anchor progress, `tourPose` frames every bounding-box corner of that chapter's structure at each first-look viewport (imported `VIEWPORT_WIDTHS` by `VIEWPORT_HEIGHT`).
     - At three points between every pair of consecutive chapter anchors, the pose's target lies on A18's walk: the loop road, a spur or an overview road joining them.
     - Under reduced motion, `tourPose` returns the nearest anchor's pose exactly.
     - `#<component-id>` resolves to that chapter's progress, and a resize keeps the chapter.
     - The rail and the phone chapter picker list the chapters in the same order, and each structure's label text starts with its chapter number.
     - The ready mark is set only after the hash's chapter scroll and pose are applied (R-3129 diff).

6. R-3175 · In explore, a tap selects without moving the camera or the hash, and only Enter enters a building, through the real page wiring.
   - Proves: the owner's complaint is fixed where it happened. A tap, swipe or misclick on a phone never zooms, flies or rewrites the address, and entering a building is a deliberate act.
   - Pins, on the reducer in `apps/hive/explore.mjs`:
     - In explore, pointer down and up on a structure within the sealed tap tolerance gives exactly one `select` effect. It changes neither the camera target nor the hash.
     - Only `enter` emits a hash effect (`#enter/<id>`) and a camera target of `focus(layout, id)`. `back` emits `#explore`. `tour` emits the structure's chapter hash.
     - A drag beyond the tolerance orbits and never selects. Two pointers zoom within the sealed bounds and never select. A double tap selects once.
     - In tour mode, a tap gives no effect.
   - Pins, through the real binding: a Node test calls `bindGestures` on a plain `EventTarget` with the real reducer and a recording `apply`. It dispatches synthetic pointer events:
     - a tap in the tour;
     - a 40 px vertical swipe in the tour;
     - an 8 px vertical drift tap in explore;
     - a two-pointer pinch in explore;
     - a double tap in explore.

     It asserts that none applies a camera-target or hash effect, and that the explore drift tap applies only `select`.
   - A source check of `apps/hive/main.mjs` finds no canvas pointer listener outside `bindGestures`. It also finds no `location.hash` write outside the effect applier, and no camera move on `hashchange` other than to `#enter/<id>` or a chapter.
   - `#explore` and `#explore/<id>` open explore, the second with that structure selected and not entered. The page sets `data-hive-chapter` and `data-hive-pose` after each applied pose.

7. R-3176 · The publisher and Pages ship the graph beside the components, on the agreed command line.
   - Proves: the public hive is built from the real graph on every Pages run, and a local look needs only the documented commands.
   - Pins:
     - `buildHivePage(out)` with no data writes the fixture and `graph-fixture.json` as `components.json` and `graph.json`.
     - With `--data` and `--graph`, it writes both supplied files.
     - With either flag alone, it exits 2 with `hive-page: --data and --graph go together; make the graph with node scripts/component-graph.mjs --out <file>`.
     - The Pages job runs the audit, then `component-graph --out`, then `hive-page --data --graph`, then the identity scan on both `components.json` and `graph.json`, keeping the product index.
     - Every command in the hive README's Run section exists and runs (the readme check).

### Visual acceptance (the seat, outside the suite)

The spec is `world-art-spec.md` in this lane folder. **The seat writes it before build 1.**
- Lines 1 to 6 are the six lines of `docs/reviews/hive-render-2026-10-29/replicate-art-spec.md`, judged against the reference frames.
- Lines 7 to 9 state facts a judge can see and fail:
  - (7) Structure: "In the whole-loop frame, structure labels numbered 01 to 09 sit in number order along one continuous widest road that closes on itself. Every other label sits beside a numbered stage, joined to it by a short road. At most a few roads cross the space inside the loop. The structures do not stand in rows and columns."
  - (8) Tour: "One structure is framed near the centre. Its label's number matches the chapter number on the card, and a road leads into the frame."
  - (9) Explore on a phone: "One structure is outlined, and its roads are drawn darker than the others. A card shows its name with an Enter button and a Back to tour button. The view shows the whole loop, not a close-up of one building."

1. **Negative control, before build 1.** The seat captures two pages with `npm run first-look -- --page url --after <url> --hive --reference /private/tmp/nana-3dmk-ref --spec world-art-spec.md --out <folder outside git>`, then runs `npm run visual-reader -- --from <folder> --out <folder outside git>` on each.
   - Capture one is main's grid page at `57167e92`: `node scripts/component-audit.mjs --out <tmp>/components.json`, then `node scripts/hive-page.mjs --serve --data <tmp>/components.json`, run from a checkout of `57167e92`.
   - Capture two is an all-roads frame. It is the adversary's simulation render with all 68 roads, or the seat's own render from the same scratch script, served as a static page outside git.
   - Line 7 must FAIL on both. If it passes either, the seat rewrites line 7 and re-runs the control before build 1 starts. The control's outputs are saved outside git, and their verdict lines go in the lane folder as `control-verdicts.md`.
2. **After build 1, serve the page:**
   - `node scripts/component-audit.mjs --out <tmp>/components.json`
   - `node scripts/component-graph.mjs --out <tmp>/graph.json`
   - `node scripts/hive-page.mjs --serve --data <tmp>/components.json --graph <tmp>/graph.json`
3. **Run first-look once per URL**, each run at its sealed widths with reduced motion, with the command in step 1. The six URLs:
   - the tour start `<served>/`;
   - three tour chapters, `<served>/#drafting-table`, `<served>/#review-ladder` and `<served>/#notice-board`;
   - free mode `<served>/#explore`;
   - free mode with a selection, `<served>/#explore/workshop`, judged chiefly on its 380 px frame for line 9.
4. **Run visual-reader** on each capture. Pass means every line judged PASS on its captures: lines 1 to 7 on all six, line 8 on the three chapter captures, line 9 on the selection capture.
   - The seat also checks that the three chapter captures show three different framed structures, named in their labels.
   - A FAIL goes back to the builder in the next brief, or to the owner as YOUR CALL with the frames. The seat does not override a FAIL. Reference frames are never committed.
5. **Gesture check at 380 px**, seat-run and outside the suite: `node scripts/hive-gesture-check.mjs --url <served> --out <folder outside git>`.
   - It opens a 380 by 1000 touch viewport, with `hasTouch` and reduced motion.
   - It reads `data-hive-pose` and `data-hive-chapter`, and checks four things:
     - In explore, a tap on a structure selects it, and the pose and hash stay equal.
     - In the tour, a tap changes nothing.
     - A vertical swipe in the tour changes `scrollY` and the chapter, not the selection or the hash.
     - Scrolling to each of the three chapter sections above gives that chapter's pose.
   - Pass means all four hold. Its output goes in the lane folder as `gesture-check.txt`.
6. **The shape gate** applies after build 1: the seat shows the owner the frames and asks "is this the shape?" before build 2.

## Later lanes (not this one)

- shops-flows, after this lane's shape gate, on `graph.json` and the agreed command line.
- Structure animations: a thematic animation per structure, and the movie theater for the memory component, with its form, tapes and signals.
- Launch edges from map-spawn-edges as another road source, once that lane lands.
- Residual (attack NOTE 15): the hive's own code (`apps/hive/`, `scripts/hive-page.mjs`, the new deriver) is claimed by no component. So the published-pages stage cannot show the page it publishes. A change to Notice board's parts in the hand audit would fix it; this lane does not make it.
