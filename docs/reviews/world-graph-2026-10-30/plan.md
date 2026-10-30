# Plan: world-graph (2026-10-30), revision 3: the city

Worktree `~/nana-pi-wt/world-graph`, branch `feat/world-graph` (PR 273), tip `b452f8be`, merge base and main `d797a9f1`. Rows R-3170 to R-3177 belong to this lane (shops-flows holds R-3161 to R-3169; selective-ci holds R-3178 to R-3186). No new artifact ID: the city plan ships inside A-087, the public hive page, as its app files do.

## Revision 3 changes

- The owner rejected the graph layout and the oval loop of builds 2 to 5 ("lines which are rows are too solid", "shape looks bad"). He then settled a city design in his city story doc on 2026-10-30. This revision plans that city and replaces revision 2.
- **Dropped:** the publish-time graph. That covers the spring layout and the graph deriver, the derived `graph.json` and its contract and fixtures, the saved 3,551-line base graph, the loop file and the `--graph` flag. Roads are now declared handoffs in a hand city plan, not counted imports. With no deriver left, the `paths` field in `deliverableClaims` and the `contains` export have no caller, so both go back to main's code.
- **Kept, as precedent:** the scroll tour mechanics (`apps/hive/tour.mjs`), safe tapping in `#explore` (`bindGestures`, Enter-only camera, R-3175 unchanged), `scripts/hive-gesture-check.mjs`, `apps/hive/assets/parts.mjs`, the label safe bands, the first-look viewport fix and the full-viewport overview framing.
- **Rows:** R-3170 and R-3176 are retired. R-3171 to R-3174 are reworded for the city. R-3177 is new (lights and dark lots). R-3122 is widened from bees to residents. R-3127, R-3130, R-3131 and R-3139 go back to main's wording.
- `world-art-spec.md` line 7 is rewritten for the city and split into 7a (the parts are present) and 7b (the arrangement). Lines 8 and 9 are adjusted, and a line 10 is added. The negative controls are main's 3x3 grid page and build 5's oval. Line 7b must fail on both before the next build.
- **Attack 3 taken** (`plan-attack-3.md`), all eight findings, with the seat's rulings:
  - MUST 1: line 7 is split into 7a and 7b. Two near-miss renders (a grid park and a one-ring park) are judged after build 6, through a serve-only `--layout` override. 7b must fail both and pass the real build.
  - MUST 2: the shape check uses a lattice rule and a radius-band rule. The controls are four (main's grid, build 5's oval, a grid park, a one-ring park), plus the real city as the must-pass case.
  - MUST 3: one plan, with no fixture plan. A place whose component the audit lacks still stands, dark, labelled "Not in audit".
  - MUST 4: the built scene is checked against the layout module (positions, and streets one to one). Street colour is compared with the ground mesh's own material, and street width is capped. A pixel probe of streets against ground joins the seat's acceptance checks, because a unit test cannot see pixels.
  - SHOULD 5: findings leave the park by the entry. Frontage is measured from each lot's door.
  - SHOULD 6: the camera stays on the step during its visits. A full scroll check at 380 px joins the seat's gesture check.
  - SHOULD 7: every break the deletion causes is listed in A18. R-3175's test stays unchanged because `config.mjs` keeps the names it pins.
  - SHOULD 8: lit and dark windows have a sealed minimum brightness gap. Spec line 10 needs a lit and a dark building in the same frame.

## Purpose

The owner's reading is agreed. It is his city story doc of 2026-10-30, which records his answers to its five open questions. Its purpose, in his words: "The page is a working map of how nana turns one wish into shipped work. A stranger should be able to explain the workflow after one scroll." Also: "Every building does a real job, and every road carries a real handoff." And: "If a part has no place or no road, the product has a gap. The page shows the gap instead of hiding it." And: "The city draws the product we are aiming for. Parts that do not exist yet stand as dark lots."

His five decisions:
- The tower stands in the town, outside the factory park.
- Customers are other projects built the nana way.
- Dark lots show what they will become, with the lights off.
- One courthouse.
- The scroll tour follows one request's journey, from signal to customer.

The doc's design:
- A reception tower collects the owner's signals. The owner is an alien in the sky.
- A factory park holds many halls for parallel lanes: drafting office (planner and adversary), dispatch yard (queue), workshop bays (one per lane), inspection (visual judge), review ladder, and the land gate, the park's only exit. The tool depot and test lab are inside. The night depot and key vault are dark lots.
- The town rings the park: library theater, one courthouse, the billboard facing north, survey office, utilities, control room (frozen), stage, and customs at the edge on the outbound freight road.
- Customer towns lie outside. Their feedback rises to the sky as new signals.
- Residents and workers are visible.
- There is a free exploration mode with safe tapping.

This lane delivers one feature: **a stranger scrolling the hive page follows one request from the owner's signal through the tower, the factory park's halls and its one gate, past customs to a customer town and back, in a radial city where every audited part has a lit, half-lit or dark place on a street, and can then explore without a tap ever moving the camera.**

## Assumptions

- A1. Feature placement: the rows stay in FEAT-039, the hive's home (A-087, A-086 and R-3120 to R-3139 live there). What may be wrong: FEAT-039 is the largest feature by rows and known-bug lines.
- A2. The city plan is a hand source at `apps/hive/city.json`, contract `nana-city-plan` version 1. It ships with the app files, which the publisher already copies byte for byte (R-3130), so no data flag is added. It holds:
  - places: id, display name, district (`sky`, `park`, `town`, `edge`, `outside`), bearing in degrees, form name, and the component it houses or none;
  - the journey: ordered steps, each naming its place and the components visited at that step;
  - roads: declared handoffs (`forward`, `back` or `air`) between places;
  - residents: kind and place;
  - future lots that no component claims yet.

  It holds no coordinate, radius or count. Positions come from one pure module, `apps/hive/city.mjs`, which the page and the tests both import. What may be wrong: a plan inside the app is nana-pi-specific; a second project's city is a later lane.

  There is one plan and no fixture plan (attack MUST 3). A place whose component is missing from the audit data still stands, dark, labelled "Not in audit", and `checkCityPlan` returns one named line for it. The tracked-tree test fails on any such line. The five-component fixture yields 19 of them and still renders: the fixture city is the real city with most lots dark.
- A2a. Near-miss renders (attack MUST 1): `hive-page --serve --layout <file>` copies a file of `{id: [x, z]}` positions into the served site as `layout-override.json`. The page fetches that file only when it exists and passes the positions to `city.mjs`, which uses them in place of its own. A missing override file is the normal case and is not an error. `--layout` with `--out` exits 2, so Pages can never ship an override. The seat uses it only for the near-miss controls after build 6.
- A3. Subtraction (the precedent each removal falls back to is main `d797a9f1`):
  - deleted: `scripts/component-graph.mjs`, `scripts/component-graph-layout.mjs`, `scripts/component-graph-config.mjs`, `docs/components/loop.json`, `docs/components/graph-contract.json`, `docs/components/graph-fixture.json`, `packages/nana-pack/tests/fixtures/hive-graph-base.json`, `apps/hive/graph.mjs` and `apps/hive/roads.mjs`;
  - back to main: `scripts/deliverables.mjs`, `scripts/component-audit.mjs`, `.github/workflows/pages.yml`, `packages/nana-pack/tests/pages-workflow.test.mjs`, and the graph parts of `scripts/hive-page.mjs`;
  - kept: `scripts/first-look.mjs`'s change (the exported `waitForHive`, used by the gesture check, and the viewport-before-full-page capture order). Also kept: the `product-report.test.mjs` change that skips retired rows.
- A4. The radial plan follows the 3dmk study: one origin, polar placement, bands by scale and one public axis.
  - The origin is the **dispatch yard** (queue). It is the park's chokepoint, where every plan waits for a bay and every bay draws from. This is the 3dmk rule of centre by chokepoint.
  - **North (−z) is public**: the land gate, customs, the freight road, the customer towns and the billboard face north. **South is home**: the reception tower, with the owner's craft above it in the sky.
  - The **park** is a disc fenced at a radius computed from its lots' footprints and the street width, so it is sized by count. Park lots stand on spokes from the yard. The drafting office is south, by the entry. The bays fan east and west. Inspection and the review ladder are north. The land gate sits in the fence at north. The tool depot and test lab stand beside the bays. Guard posts (command gate) stand at each bay's door: one component, drawn at every bay, picked as one. The night depot and key vault are dark lots inside the fence.
  - The **town** is the band outside the fence. A ring street runs round the fence, and town lots front it at their bearings. The band's outer radius is computed from its lots' count. Town lots: tower (south), library theater, courthouse, survey office, utilities, control room, stage, billboard (north, facing north).
  - The **edge**: customs and the freight terminal (release route) sit on the freight road where it leaves the town, north.
  - **Outside**: customer towns past the edge, north. Each is a small cluster from the same lot kit. One future neighbouring park stands dark.
  - **Sky**: the owner's craft above the tower at a sealed height.
- A5. The fence has exactly two openings: the entry, facing the tower, and the land gate, facing the freight road. Work enters by the entry and leaves only by the land gate.
- A6. Bays: four bays, sealed. Two are lit, and two stand dark as future capacity.
  - Lit count: contract, from the 2026-10-16 ruling "at most two lanes build".
  - Total: chosen, for the doc's "many halls", and matching the four builders of the 10-22 power mode.
- A7. The one courthouse is a compound of three wings on one plinth: courthouse (rulings), records office (requirement contract) and style desk (writing rule). Each wing is its component's own pickable lot. The notice board is the billboard. The tower carries an unlabelled transmitter mast as part of its form, for the doc's "outbound transmitter".
- A8. Streets follow a hierarchy (Skylines, EvoStreets, Mini Motorways in `city-prior-art.md`):
  - one **avenue** carries the forward journey: tower, entry, drafting, yard, bays, inspection, ladder, land gate, customs, freight road, customer towns;
  - **local streets**: park spokes and the town ring street, which every lot fronts;
  - **back roads** are dashed footpaths: rules from the courthouse along the ring street to the entry, and findings from the park out through the entry, beside the avenue, then along the ring street to the theater (attack SHOULD 5). No back road crosses the fence anywhere but the entry;
  - **air legs** are thin arcs, shown only on their chapter: the signal beam from the sky to the tower dish, tapes from the theater to the lit bays, and feedback rising from the customer towns.

  Every ground street is a pale flat strip, lighter than the ground, edged with thin model-white kerbs that cast shadow. No street uses the ink or gap material. Street widths live in a new `STREETS.widths` entry keyed `avenue`, `local`, `back` and `air`. The avenue and the local streets are each capped at a sealed fraction of the median lot width. This answers "lines which are rows are too solid".

  Each lot has a door, the gatehouse point of the lot kit, with an outward normal. A lot fronts the nearest street to its door. That street must be in the lot's own district, or be the avenue.
- A9. Lights follow the component's audited status. `sound` is lit, `partial` and `gap` are half-lit, and `absent` is dark. Lights are window meshes. Lit and dark window materials differ by at least a sealed luminance gap, and a half-lit lot lights a sealed fraction of its windows (attack SHOULD 8). A place whose component is not in the audit is dark (A2). A dark lot is its full target form with the lights off, never an empty plot. Future lots that no component claims (two dark bays, neighbouring park, feedback road) are dark. Today this gives dark night depot and key vault, and half-lit library theater, control room, test lab and stage, as the doc's table says.
- A10. Residents are the doc's nine kinds: owner (sky), seat (tower), planner and adversary (drafting office), a builder crew per lit bay, visual judge (inspection), reviewers (ladder), projectionist (theater) and customers (customer towns). They are small faceted figures within a sealed triangle budget. Activity workers per lot keep R-3122's formula, min(recent commits + in flight, 12), drawn as figures instead of bees.
- A11. The tour (chapter ids are component ids, so today's `#<id>` links keep working):

  | Step | Place | Component | Visits (sub-chapters) |
  |---|---|---|---|
  | 00 | the whole city | — | — |
  | 01 | signal in the sky | — (owner) | — |
  | 02 | reception tower | compass | rulings (courthouse), writing-rule (style desk) |
  | 03 | drafting office | drafting-table | requirement-contract (records office) |
  | 04 | dispatch yard | queue | night-shift (night depot, dark) |
  | 05 | workshop bays | workshop | tool-belt (tool depot), command-gate (guard posts), code-map (survey office) |
  | 06 | inspection | eyes | lab (test lab), desk (control room) |
  | 07 | review ladder | review-ladder | — |
  | 08 | land gate | land-gate | key-cabinet (key vault, dark) |
  | 09 | customs | identity-scan | — |
  | 10 | freight route | release-route | setup (utilities), notice-board (billboard), stage |
  | 11 | customer towns | — (customers) | — |
  | 12 | the way back | library (theater: findings become tapes; feedback rises) | — |
  | 13 | closing view, with the Explore button | — | — |

  Every component appears exactly once. The visit placement follows the doc's journey text where it names one (the survey office at the bay, the billboard at freight). Otherwise the planner chose it, and a change is a plan-file edit.

  Visits keep their step's anchor (attack SHOULD 6). A visit outlines its lot and changes the card. At most, it pulls the camera back to frame both the step's place and the visit's lot. So the request's camera never leaves the step to tour the town. The camera follows streets or air legs only between journey steps. Labels and the rail show the place name with its step number ("05.3 SURVEY OFFICE"). The card heads with the place name, then the component's name, metaphor and voices.
- A12. Drift shows both ways, and the page still renders (the doc's coherence rule):
  - An audited component with no place in the plan stands on a **vacant lot** on the town ring at a sealed bearing. It is labelled "No place yet", and its card says so.
  - A planned place whose component is not in the audit stands dark, labelled "Not in audit" (A2).

  The suite fails on the tracked tree when either case occurs, so drift is caught before a land. The fixture exercises both: `review-hall` takes the vacant lot, and 19 places read "Not in audit".
- A13. Each lot keeps its current per-id form from `apps/hive/assets/hive.mjs` where it fits: review stair, notice board, archive pavilion, desk, lab, instruments. It is re-dressed onto the shared lot kit of plinth, gatehouse and painted name (3dmk's repeated lot kit). New forms: reception tower with dish and mast, park fence with two gates, bays, courthouse wings, theater (static; its animation is a later lane), customs post, freight terminal, customer towns and the owner's craft.
- A14. The hashes, the gesture reducer and its binding are unchanged (R-3175). `#explore/<id>` selects without entering, and only Enter moves the camera to a building.
- A15. The pixel renderer draws one mark per lot at its city position and the fence circle. Its renderer line says "streets in 3D only". R-3128's cells stay.
- A16. shops-flows stays paused. The two-flag publisher command agreed in revision 2 is withdrawn; `hive-page` takes `--data` alone, as on main. The seat replans shops-flows against the city plan after this lane lands. Its buyers and restocks may fold into the customer towns and the freight road.
- A17. `packages/nana-pack/tests/hive-graph.test.mjs` is renamed `packages/nana-pack/tests/hive-city.test.mjs`. The R-3175 test moves unchanged, and its row's citation follows the rename. It needs these names to stay:
  - `explore` and `bindGestures` in `apps/hive/explore.mjs`;
  - `textLayer`'s explore landing ("Tap a building", the `tour` action);
  - the one `location.hash` write in `main.mjs`, with no canvas pointer listener there;
  - `NAVIGATION` in `apps/hive/config.mjs`, deep-equal to its current value, including `roadWidths` and `overviewClasses`.

  So `NAVIGATION` keeps its values (seat ruling). The city reads its street widths from `STREETS.widths`, which R-3134's test pins. `NAVIGATION.roadWidths` and `NAVIGATION.overviewClasses` go unread, and one known-bug line records them for removal when R-3175's test is next edited.
- A18. Every break the deletion causes, and how each is handled (attack SHOULD 7):
  - `apps/hive/graph.mjs` is imported by `apps/hive/main.mjs`, `apps/hive/runtime.mjs`, `scripts/hive-page.mjs` and two tests. The plan check in `apps/hive/city.mjs` replaces it at each site.
  - `apps/hive/roads.mjs` is imported by `apps/hive/assets/hive.mjs` (`visibleRoads`) and `apps/hive/main.mjs`. Street visibility by chapter (air legs) moves into `apps/hive/city.mjs`, and both importers switch to it.
  - `segmentDistance` in `scripts/component-graph-layout.mjs` is imported by the R-3173 and R-3174 tests. **Move:** it goes into `apps/hive/city.mjs` with `roundPosition`, and the frontage, fence and tour tests import it from there.
  - `tour.mjs`'s `pathBetween` filters roads by the `loop` and `spur` classes. It is rewritten over the city's streets; only its search shape is kept.
  - The test file's `fixtureRepo`, `fixtureLoop` and every `scripts/component-graph*.mjs` import are deleted with the R-3170 and R-3176 tests.
  - `apps/hive/README.md` names `scripts/component-graph.mjs` in its Run section and its road paragraph. Both are rewritten for the city, or the readme check fails.
  - `.github/workflows/pages.yml`, `packages/nana-pack/tests/pages-workflow.test.mjs`, `scripts/hive-page.mjs` and the R-3127, R-3130 and R-3139 tests in `hive-page.test.mjs` lose their graph steps and cases.
  - `scripts/deliverables.mjs` and `scripts/component-audit.mjs` revert cleanly: only `scripts/component-graph.mjs` read `paths` and `contains`.
  - `docs/code-map.md` is regenerated, and `map:check` must pass.

## Open choices

- O1. Exact bearings, spoke lengths and form proportions, within the sealed tunables and the must-meet tests.
- O2. How `city.mjs` routes a declared road over the street network (spoke, ring arc, avenue), within the frontage, fence and footprint tests.
- O3. Whether `tourPose` adds 3dmk's Powers-of-Ten pull-back between far anchors (sky to tower, freight to customer towns). The anchor and walk tests must still hold.
- O4. Card wording per journey step in the three voices, and the legend line for lights.
- O5. The fence, gate and kerb details, built from `fence`, `beam` and `ribbon` in `apps/hive/assets/parts.mjs`.
- O6. Highlight style for a selected lot and its streets, in the monochrome palette.

## Questions for the owner

None. Each choice in this plan is easy to undo. The places, journey and roads live in one hand file, and every tunable is one sealed value. The dropped graph code stays in the branch history. Retiring R-3170 and R-3176 costs two unused IDs.

## Feature

Feature: FEAT-039 · See the product and its decisions in one report

Lane class: `ordinary` (`node scripts/lane-class.mjs --root . --files apps/hive/city.json,apps/hive/city.mjs,apps/hive/layout.mjs,apps/hive/tour.mjs,apps/hive/camera.mjs,apps/hive/explore.mjs,apps/hive/main.mjs,apps/hive/text-layer.mjs,apps/hive/pixel.mjs,apps/hive/labels.mjs,apps/hive/runtime.mjs,apps/hive/config.mjs,apps/hive/index.html,apps/hive/graph.mjs,apps/hive/roads.mjs,apps/hive/README.md,apps/hive/assets/hive.mjs,apps/hive/assets/district.mjs,apps/hive/assets/residents.mjs,apps/hive/assets/road.mjs,apps/hive/assets/parts.mjs,apps/hive/assets/bee.mjs,scripts/hive-page.mjs,scripts/hive-gesture-check.mjs,scripts/component-graph.mjs,scripts/component-graph-layout.mjs,scripts/component-graph-config.mjs,scripts/component-audit.mjs,scripts/deliverables.mjs,.github/workflows/pages.yml,docs/components/loop.json,docs/components/graph-contract.json,docs/components/graph-fixture.json,packages/nana-pack/tests/hive-city.test.mjs,packages/nana-pack/tests/hive-graph.test.mjs,packages/nana-pack/tests/fixtures/hive-city-controls.json,packages/nana-pack/tests/fixtures/hive-graph-base.json,packages/nana-pack/tests/hive-page.test.mjs,packages/nana-pack/tests/hive-assets.test.mjs,packages/nana-pack/tests/pages-workflow.test.mjs,REQUIREMENTS.md,docs/requirements-tree.md,docs/known-bugs/FEAT-039.md,docs/code-map.md`, run 2026-10-30 at `b452f8be`).

Size: larger. It removes about 4,100 lines (the deriver, layout, fixtures and saved base graph). It adds about 1,000 to 1,300 lines of plan, layout, forms, residents and tests. The larger builder (`pi-worker --lane-size larger`) fits.

Rows:
- R-3170 (graph counts): **retired**, with no replacement; roads are declared handoffs.
- R-3171: reworded to the city plan's placement and refusal (must-meet 1).
- R-3172: reworded to radial geometry and the shape check (must-meet 2).
- R-3173: reworded to the street hierarchy, the one exit and pale streets (must-meet 3).
- R-3174: reworded to the journey tour (must-meet 4).
- R-3175: unchanged; its test moves with the file rename.
- R-3176 (paired graph publishing): **retired**; R-3130 and R-3139 at main's wording cover the publisher again.
- R-3177: **new**, for lights and dark lots (must-meet 5).
- R-3122: widened from bees to residents (must-meet 6).
- R-3120: stays retired; its "Replaced by" citation points to R-3172's new test.
- R-3127, R-3130, R-3131, R-3139: back to main's wording. R-3127 also refuses an invalid city plan: "or a city plan failing its check".
- R-3126 (tour order), R-3129 (ready after the chapter pose) and R-3125: keep the lane's wording.

Expected test edits (a forecast, not a limit):
- `hive-city.test.mjs`: R-3170 and R-3176 tests deleted; R-3171 to R-3174 rewritten; R-3177 added; R-3175 unchanged.
- `hive-page.test.mjs`: R-3122 gains residents. R-3127, R-3130 and R-3139 lose the graph cases and gain the city-plan refusal in R-3127. R-3126's order follows the journey.
- `hive-assets.test.mjs`: R-3134's pin gains the new sealed city values; R-3123 keeps its budgets.
- `pages-workflow.test.mjs`: back to main.

## Builds and the shape gate

- Before the next build (build 6), the seat runs the negative control in Visual acceptance step 1. Line 7b must FAIL on both controls.
- Build 6: every row above. Then the seat runs first-look, visual-reader, the near-miss controls and the six-check gesture check (steps 3 to 6).
- Gate: the seat shows the owner the frames with one question, "is this the shape?". Build 7 waits for his answer, and a changed shape goes into its brief.
- If build 6 runs long, these move to a later lane: residents beyond the nine kinds' single figures, the back-road dashes (drawn solid-pale meanwhile), and the customer towns' detail. The radial plan, the fence with one exit, the pale streets, the lights and both modes never leave this lane.

## Threat model

In scope: honest variation in our tools' output. Examples:
- the audit adds a component the plan does not place, or the plan names an ID the audit dropped;
- the fixture's five components against the one tracked plan: one component the plan never places and 19 places the fixture lacks;
- a builder's layout that is a near miss of the owner's shape: a grid park, or halls on one even ring;
- a component with no features, `absent` or `partial` status, or zero activity;
- a plan with a duplicate placement, an unknown district or form, or a road to an unknown place;
- a phone tap that drifts a few pixels, a vertical swipe, a pinch, a double tap, or a resize mid-tour;
- a renderer fallback to pixel, and reduced motion.

Out of scope: deliberate forgery, such as a hand-edited plan that passes its check while naming handoffs nana does not make. A finding outside this model is a residual and goes in the FEAT-039 known-bug file.

## Precedent

- City plan hand source and its check: `docs/components/loop.json` with `checkLoop` in `scripts/component-graph.mjs` (named-line refusals for missing, duplicate and unknown IDs and hand-written derived fields). **Move:** `checkLoop`'s rules move into `checkCityPlan` in `apps/hive/city.mjs`, and both source files are deleted. Also `docs/components/nana-pi.json` with `checkSource` in `scripts/component-audit.mjs`: a hand source whose tool rejects derived values written by hand.
- Polar placement and rounding: `scripts/component-graph-layout.mjs` (`settle`'s slot arithmetic, `roundPosition`, the footprint clearance pass). **Move:** `roundPosition` and `segmentDistance` move into `apps/hive/city.mjs` before the file is deleted. The tests are `segmentDistance`'s second caller, so they import it from there (A18). The spring, ellipse and octagon router are not carried over.
- Footprints and the layout model: `apps/hive/layout.mjs` (`footprint`, `bees`, `layout`'s chamber, cell and bounds shape). `layout` takes city positions from `city.mjs` in place of graph nodes. `apps/hive/assets/hive.mjs`, `pixel.mjs` and `camera.mjs` keep their inputs.
- Streets: `apps/hive/assets/road.mjs` (`buildRoad`: joints, ribbons, edge lines, dash marks) and `apps/hive/assets/parts.mjs` (`ribbon`, `beam`, `fence`). The street surface switches from the gap material to a pale one, the edge lines become model-white kerbs, and the lane dashes become the back roads' dashes. `fence` draws the park fence.
- Forms and the lot kit: `apps/hive/assets/hive.mjs` (`buildHive`, per-id forms, pickable `userData.component`, `userData.labelHeight`). New district and city forms go in `apps/hive/assets/district.mjs`. Residents go in `apps/hive/assets/residents.mjs`, following `apps/hive/assets/bee.mjs` (`buildBee`, a faceted figure within a sealed triangle budget).
- Lights: `apps/hive/assets/materials.mjs` (materials keyed by status and kind) and `STATUS_COLORS` in `apps/hive/config.mjs`.
- Tour: `apps/hive/tour.mjs` (`tour` with sub-chapters, `pathBetween` over drawn roads, `tourPose`, `chapterProgress`). The spine becomes the plan's journey and the visits become sub-chapters. Air legs are walked as their declared arc.
- Camera: `apps/hive/camera.mjs` (`overview` with projected-corner fitting on the whole viewport, `focus`).
- Gestures and explore: `apps/hive/explore.mjs` (`explore`, `bindGestures`), unchanged. `apps/hive/main.mjs` keeps its wiring, safe-band pass and pose marks.
- Labels: `apps/hive/labels.mjs` (`safeBands`, `placeLabels`), unchanged.
- Text: `apps/hive/text-layer.mjs` (`textLayer`, `renderText`): place names head the cards and the rail.
- Sealed values: `apps/hive/config.mjs` and its R-3134 pin in `packages/nana-pack/tests/hive-assets.test.mjs`. New values go here with provenance: band gaps, `STREETS.widths` and the width caps, kerb height, sky height, bays, vacant-lot bearing, the lattice and radius-band limits, frontage and door angle, clearance, world half-extent, the window luminance gap and half-lit fraction, the street pixel margin, the card overlap fraction, and the resident budget.
- Publisher and Pages: `scripts/hive-page.mjs` and `.github/workflows/pages.yml` as on main `d797a9f1`.
- Seat gesture check: `scripts/hive-gesture-check.mjs`. Its four checks stay, and its three chapter ids (`drafting-table`, `review-ladder`, `notice-board`) stay chapters. It gains two seat checks: the full scroll at 380 px, and the street pixel probe (Visual acceptance step 5).
- In-suite geometric checks over published data: the R-3172 and R-3173 tests in `packages/nana-pack/tests/hive-graph.test.mjs` (frontage, footprint, crossing caps). They are the model for the shape check and its controls.
- Visual negative control: `scripts/visual-reader.mjs` and this folder's `control-verdicts.md`.

`npm run map:search` results taken:
- "radial polar placement districts" named `scripts/component-graph.mjs` and `apps/hive/layout.mjs`, nothing radial. Placement starts from `settle`'s slot arithmetic.
- "street road ribbon kerb" named `apps/hive/assets/road.mjs`, `apps/hive/assets/parts.mjs` and `apps/hive/config.mjs`, all taken.
- "dark unlit lot status material" named `apps/hive/assets/materials.mjs` and `apps/hive/assets/cell.mjs`, taken for lights.
- "resident figure worker bee" named `apps/hive/assets/bee.mjs`, taken for residents.
- "scroll chapter journey camera pose" named `apps/hive/tour.mjs`, `apps/hive/main.mjs` and `apps/hive/camera.mjs`, taken.
- "shape check negative control grid" named nothing relevant. The hive-graph geometry tests stay the model.

Impact (`npm run map:impact`):
- `apps/hive/layout.mjs`: callers `apps/hive/main.mjs`, `apps/hive/runtime.mjs`, `scripts/component-graph.mjs` (deleted), and three hive tests.
- `apps/hive/assets/hive.mjs`: `apps/hive/main.mjs` and the three hive tests.
- `apps/hive/tour.mjs`: `apps/hive/main.mjs`, `hive-graph.test.mjs` and `hive-page.test.mjs`.
- `apps/hive/graph.mjs`: `main.mjs`, `runtime.mjs`, `scripts/hive-page.mjs` and two tests. All lose the import.
- `apps/hive/roads.mjs`: `apps/hive/assets/hive.mjs` and `apps/hive/main.mjs`. Both switch to `apps/hive/city.mjs` (A18).
- `scripts/hive-page.mjs`: the two hive tests.
- A tracked-tree search for `component-graph`, `graph-fixture`, `graph.json`, `loop.json`, `hive-graph`, `graph-contract`, `roads.mjs` and `segmentDistance` finds only the files in A3, `REQUIREMENTS.md`, `apps/hive/README.md`, `apps/hive/main.mjs` and `docs/code-map.md`.

## Outside precedent

Medieval Fantasy City Generator (watabou, GPL-3.0, github.com/watabou/TownGeneratorOS). Verdict: borrow the ideas, skip the code.
- Borrowed: wards inside a wall, gates drawn as passages, outskirts spawning by the gates, and a central plaza. These are the model for the fenced park, its two gates and the edge district by the freight road.
- Skipped: the code. It is GPL-3.0, written in Haxe, and our plan is a short polar layout.

Other public references:
- https://3dmk.com/ for the look, the radial bands with a public north, the repeated lot kit, chapter-scoped air arcs and the scroll grammar. No code, text, models or screenshots come from it.
- Kevin Lynch, *The Image of the City* (1960): paths, edges, districts, nodes and landmarks.
- Mini Motorways concept art for pale, flat, rounded streets.
- EvoStreets (Steinbrückner and Lewerentz) for lots fronting their street.

## Must-meet

1. R-3171 · One city plan places every audited component exactly once, refuses a malformed plan, and shows drift both ways without failing the page.
   - Proves: the plan cannot drift from the audit silently, and a gap in the product shows as a gap in the city.
   - Pins:
     - `checkCityPlan(plan, components)` returns one named line each for these:
       - a component placed twice;
       - a component the audit lacks (`<id>: not in audit`);
       - an audited component the plan does not place (`<id>: no place yet`);
       - an unknown district or form;
       - a journey step or visit naming an unknown place or component;
       - a road or resident at an unknown place;
       - a component visited twice in the journey;
       - a coordinate, radius or count written by hand.
     - On the tracked tree, `checkCityPlan` returns no line, and every audited component appears exactly once in the journey.
     - On the fixture, against the same tracked plan:
       - it returns exactly 19 "not in audit" lines and one "no place yet" line, for `review-hall`;
       - `prepare` still returns a scene with no error;
       - the 19 places stand dark, labelled "Not in audit";
       - `review-hall` stands on the vacant lot at the sealed bearing, labelled "No place yet".
     - `prepare(data, plan)` with a plan that has a structural problem (anything above except the two drift lines) returns one plain error and no scene (R-3127).
     - `buildHivePage` copies `city.json` with the app files and writes no `graph.json`. `hive-page --graph x` exits 2 with the usage line. `hive-page --out <dir> --layout <file>` exits 2 before creating output.

2. R-3172 · The city is radial: a fenced park of halls at several distances round the dispatch yard, a town band holding the tower, customs and freight at the north edge, customer towns beyond, and neither a lattice nor an even ring.
   - Proves: the layout reads as the owner's city, not as the grid, the oval, or a near miss of either.
   - Pins, on the nana-pi audit:
     - The dispatch yard is at the origin.
     - Every park lot lies inside the fence circle. No town or edge lot lies inside the fence plus the ring street.
     - The tower lies in the town band, outside the fence, south of the origin.
     - The land gate lies on the fence, north. Customs and the freight terminal lie past the town band on the freight road, north. Customer towns lie past them.
     - The billboard's bearing is within the sealed tolerance of north, and its face normal points north.
     - The owner's craft is above the tower, at the sealed sky height.
     - The fence radius and the town band's outer radius are computed from their lots' footprints. Adding a park place to a copy of the tracked plan in the test grows the fence.
     - Every lot lies inside the sealed world half-extent, and no two footprints are closer than the sealed clearance.
     - Positions are equal across two runs, rounded to the sealed grid.
   - The shape check `cityShapeProblems(layout)` has two rules:
     - **lattice:** at most one family of parallel lines that each hold three or more lot centres at even spacing, not counting lines through the origin (the avenue is one line through the origin);
     - **radius bands:** park lot centres span at least the sealed number of distinct radius bands from the yard.
   - Controls, in `packages/nana-pack/tests/fixtures/hive-city-controls.json`, each the same 23 IDs with the one problem it must trigger:
     - main's grid (rows and columns, from main's grid rule): lattice;
     - build 5's oval, taken once from `b452f8be`'s saved base graph: radius bands;
     - a grid park inside the fence, with the real town: lattice;
     - a one-ring park, with an empty yard and the real town: radius bands.

     The real city is the positive control and returns no problem.
   - The new geometry values are sealed in `apps/hive/config.mjs` with provenance and pinned by R-3134's test. Every assertion here imports them by name.

3. R-3173 · The built streets match the layout, form a hierarchy with one exit from the park, stay pale and narrow, and every lot's door fronts one.
   - Proves: the page draws the city the layout computes, every building has a road it can reach, work leaves the park only through the land gate and customs, and streets read as streets, not solid dark rows.
   - Pins, from the scene `buildHive` builds:
     - Every pickable lot's world position equals its `city.mjs` position, after rounding.
     - The street meshes match the layout's street segments one to one, by endpoints.
     - Every street surface's colour is lighter than the ground mesh's own material colour by relative luminance. No street mesh uses the ink or gap material.
     - The avenue and local street widths are within their sealed caps, as fractions of the median lot width. Kerbs are no taller than the sealed kerb height.
     - A `back` road is built as separate dashes with gaps, and a `forward` road is continuous. `air` legs are hidden outside their chapters.
   - Pins, on the layout:
     - Every lot, including dark, "Not in audit" and vacant lots, has its door within the sealed frontage of a street in its own district or on the avenue, with the door normal facing that street within the sealed angle. The street network is connected.
     - Exactly two street segments cross the fence circle: the avenue at the entry, facing the tower, and the freight road at the land gate. Every back road crosses it only at the entry.
     - In the directed forward roads, every path from the drafting office to a customer town passes the land gate, then customs.
     - No road path enters the footprint of a lot that is not one of its ends.

4. R-3174 · The scroll tour follows one request's journey, from the signal to the customer and back.
   - Proves: a stranger scrolling the page meets each step of the work in order, sees each framed and named, and travels along the city's streets or the signal beam between steps, without side trips.
   - Pins:
     - `tour(layout, plan)` lists chapters in A11's order. Every component appears exactly once, and the visits follow their step as sub-chapters.
     - At each step's anchor, `tourPose` frames every bounding-box corner of that step's place at each first-look viewport (imported `VIEWPORT_WIDTHS` by `VIEWPORT_HEIGHT`).
     - At each visit's anchor, the pose's target equals its step's target, and it frames both the step's place and the visit's lot.
     - At three points between consecutive journey steps, the pose's target lies within the sealed tolerance of a drawn street path joining them. For the declared air legs, it lies on the leg's arc instead. Between a step and its visits, and between visits, the target does not leave the step's framing.
     - Under reduced motion, `tourPose` returns the nearest anchor's pose exactly.
     - `#<component-id>` resolves to its chapter, and a resize keeps the chapter.
     - The ready mark follows the chapter pose (R-3129).
     - The rail and the phone picker list the chapters in the same order. Each label starts with its step number and place name.

5. R-3177 · Lights follow audited status, visibly, and dark lots stand complete with their lights off.
   - Proves: the city shows what works, what is partial and what is not built yet, as the owner asked ("they show what they will become, with the lights off").
   - Pins:
     - Every lot's lights are window meshes. The lit and dark window materials differ by at least the sealed luminance gap, and the half-lit material lies between them.
     - `sound` lights every window. `partial` and `gap` light the sealed fraction of windows. `absent`, "Not in audit" and the declared future lots light none.
     - A dark lot's form has the same mesh count as the same form built lit. Only its window materials differ, so a dark lot is never an empty plot.
     - The two unlit bays, the neighbouring park and the feedback road are dark.
     - On the nana-pi audit, the night depot and key vault are dark. The library theater, control room, test lab and stage are half-lit.
     - The landing card's legend states the three light states in one sentence.

6. R-3122 · Residents and workers are visible at their places.
   - Proves: the city is inhabited by the doc's nine kinds of people, and activity still shows as workers.
   - Pins:
     - Each lot shows min(recentCommits + inFlight, BEE_CAP) worker figures, split into recent and in-flight, with BEE_CAP still sealed at 12.
     - `buildHive` places at least one figure of each of the nine resident kinds (owner, seat, planner, adversary, builder, visual judge, reviewer, projectionist, customer).
     - Each figure stands inside its place's footprint. The owner is at sky height above the tower. One builder crew stands in each lit bay, and none in a dark bay.
     - Each figure stays within the sealed resident triangle budget, pinned in this test.

### Visual acceptance (the seat, outside the suite)

The spec is `world-art-spec.md` in this lane folder, already rewritten for revision 3.
- Lines 1 to 6 are unchanged.
- Line 7a is the parts of the city, and 7b is their arrangement. Line 8 is the journey tour. Line 9 is explore on a phone. Line 10 is lights and people.

1. **Negative control, before build 6.** The seat captures two pages with `npm run first-look -- --page url --after <url> --hive --reference <reference folder> --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <folder outside git>`. Then it runs `npm run visual-reader -- --from <folder> --out <folder outside git>` on each.
   - Control one is main's grid page. From a checkout of `d797a9f1`, run `node scripts/component-audit.mjs --out <tmp>/components.json`, then `node scripts/hive-page.mjs --serve --data <tmp>/components.json`.
   - Control two is build 5's oval. From a checkout of `b452f8be`, run the same audit, then `node scripts/component-graph.mjs --out <tmp>/graph.json`, then `node scripts/hive-page.mjs --serve --data <tmp>/components.json --graph <tmp>/graph.json`.
   - Line 7b must FAIL on both. A FAIL on 7a alone does not count: these pages lack the city's parts, so 7a says nothing about shape. If 7b passes either, the seat rewrites 7b and re-runs the control before build 6. The verdict lines go in `control-verdicts.md` under "Revision 3 controls".
2. **After build 6, serve the page:** `node scripts/component-audit.mjs --out <tmp>/components.json`, then `node scripts/hive-page.mjs --serve --data <tmp>/components.json`.
3. **Run first-look once per URL**, with the command in step 1, at the sealed widths with reduced motion:
   - the whole city, `<served>/#overview`;
   - three journey chapters: `<served>/#signal`, `<served>/#workshop` and `<served>/#identity-scan`;
   - free mode, `<served>/#explore`;
   - free mode with a selection, `<served>/#explore/workshop`.
4. **Run visual-reader** on each capture. Pass means:
   - lines 1 to 6, 7a and 7b PASS on all six captures;
   - lines 8 and 10 PASS on the three chapter captures;
   - line 9 PASSES on the selection capture.

   The seat also checks that the three chapter captures frame three different places, named in their labels. A FAIL goes back to the builder in the next brief, or to the owner as YOUR CALL with the frames. The seat does not override a FAIL. Reference frames are never committed.
5. **Near-miss controls, after build 6** (attack MUST 1). The seat serves build 6 twice more with `node scripts/hive-page.mjs --serve --data <tmp>/components.json --layout <file>`. It uses the grid-park and one-ring-park positions from `packages/nana-pack/tests/fixtures/hive-city-controls.json`, each written to a file outside git. It captures `#overview` and runs visual-reader. Line 7b must FAIL both near-misses and PASS the real build. The verdict lines go in `control-verdicts.md` under "Revision 3 near-miss controls". If 7b passes a near-miss, the seat sharpens 7b and re-judges all three before the shape gate.
6. **Gesture check at 380 px**: `node scripts/hive-gesture-check.mjs --url <served> --out <folder outside git>`. It gains two checks, so pass means all six hold:
   - the four existing checks;
   - **full scroll** (attack SHOULD 6): scroll from top to bottom, and record `data-hive-chapter` at each settle. The sequence must equal `tour()`'s chapter order with no skips. At each journey step's anchor, the projected box of the step's place must overlap the active card's rect by no more than the sealed fraction;
   - **street pixel probe** (attack MUST 4): on the `#overview` frame, the page exposes the screen points of five street centreline samples and five ground samples beside them. Each street pixel must be lighter than its ground neighbour by the sealed luminance margin.

   Its output goes in the lane folder as `gesture-check.txt`.
7. **The shape gate** follows: the seat shows the owner the frames and asks "is this the shape?" before build 7.


## Later lanes (not this one)

- Structure animations: the tower dish turning to a signal, the theater playing tapes, crews at work, freight moving on the road.
- Handoff evidence: back each declared road with a recorded artifact's maker and reader, so the coherence test reads the ledger, not only the plan.
- Neighbouring parks: one view across several nana projects, each its own park.
- shops-flows, replanned against the city plan.
- Residual (attack NOTE 15, carried): the hive's own code (`apps/hive/`, `scripts/hive-page.mjs`) is claimed by no component, so the billboard cannot show the page it publishes.
