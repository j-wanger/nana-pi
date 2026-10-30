# Plan attack: world-graph (2026-10-30)

Adversary for `docs/reviews/world-graph-2026-10-30/plan.md`, at `57167e92` in `~/nana-pi-wt/world-graph`. Threat model as the plan states it: honest variation in our tools' output is in scope; deliberate forgery is out.

How it was checked:
- The edge counts were recomputed with a scratch script outside the repo. It used the same parsers: `repoGraph` from `scripts/code-map.mjs`, `artifactRegistry` and `artifactReads` from `scripts/deliverables.mjs`, the audit's `contains` rule, and a line regex for `Made by:`/`Read by:`.
- The layout was simulated with a second scratch script. It is one plausible reading of A7: ellipse slots of 60 by 40, a golden-angle spiral start, Fruchterman–Reingold with log-scaled weights, spine anchor springs, 400 iterations, footprint radius 6. That is about the current chamber radius, since `layout.mjs` gives `radius = SQRT2 * half`, roughly 5.1 for a 3-by-3 cell side. It was run at four anchor strengths (0.02, 0.05, 0.2, 1) and rendered with Playwright.
- The simulation is not the builder's code. Its exact numbers are inferred. Its shape follows from the graph's density, which is measured.

The history says the checks covered the wrong layer twice, so the attack weighs what the owner will see and touch over plumbing.

## MUST

### 1. All 68 roads plus a free spring pass draws a wheel with a hairball inside, not a lane loop

Evidence:
- The graph is dense. There are 64 recorded unordered pairs among the 21 components with any edge, a density of 0.30. Command gate has degree 18 of a possible 20. Setup has 11 and Queue 11 (scratch script, degree list).
- The plan names only Command gate. Setup is an equal hub because `packages/nana-setup/` claims every Claude Code hook (`docs/components/nana-pi.json`, setup `parts`).
- Simulation, all 68 roads drawn:

  | anchor k | road crossings | non-loop roads crossing a loop segment | straight roads through a third footprint | spine angles in loop order | Command gate distance from loop centroid |
  |---|---|---|---|---|---|
  | 0.02 | 148 | 28 | 22 | no | 9.0 |
  | 0.05 | 155 | 28 | 18 | no | 8.8 |
  | 0.2 | 224 | 11 | 34 | yes | 2.1 |
  | 1 | 216 | 11 | 23 | yes | 2.9 |

  With weak anchors the loop folds, so R-3172's angle-order test fails. With strong anchors the loop is only the ellipse the anchors force. The springs add nothing to its shape, and Command gate and Setup settle in the loop's centre (2–13 units from the centroid on a 40–60 unit ellipse). Their 18 and 11 roads become spokes across the interior. The rendered frame reads as a wheel full of crossing lines.
- Drawing only the loop and artifact roads (30 roads; 3 loop segments are also artifact pairs) at the same positions gives 21–22 crossings, 1–8 loop crossings and 5–7 footprint hits.
- Nothing in R-3170 to R-3177 pins clutter. R-3172 pins determinism, clearance, bounds and loop angle order. R-3173 pins one road per pair and no third footprint. A layout with 200 crossings passes every must-meet test.

Fix to the plan:
- (a) Flip Q2's default to "the loop and artifact roads in the overview (30 roads); import lanes and feature footpaths appear when a structure is selected". Today's recommended default is the hairball. The owner's sentence "edges then are naturally fitting as roads" holds for a road network a person can read, and 30 roads is that network.
- (b) Add to R-3172 or R-3173 a pin on what the viewer sees. Over the fixture, the overview's drawn roads have at most a sealed number of crossings, and no non-loop road crosses the loop road. The deriver or layout prints the tracked numbers as a report line (see finding 9 for why the tracked graph should not be pinned).
- (c) Name both hubs in the plan and treat their claimed shared folders explicitly: Command gate's `packages/nana-pack/lib/` and Setup's `packages/nana-setup/`. One option is a utility class drawn under the world, like pipes, rather than as surface roads. Another is to leave their import edges out of the spring weights. Either way the hubs stop pulling to the centroid.

### 2. The spring pass has no force that puts a component near the stage it is toured under, and 13 of 22 tour steps have no road for the camera to follow

Evidence:
- Four of the 11 attached components have no recorded road to their own stage: Library to Compass, Tool belt to Workshop, Desk to Eyes and Lab to Eyes (scratch script).
- Library's only roads are to Command gate and Setup. Both come from shared-folder claims: `nana-shared-memory.mjs` is claimed by both Library and Setup, and the pack library is claimed by Command gate. So the theater, the owner's named centrepiece, settles wherever those two hubs pull it, not beside Compass.
- In the tour order of A10, 13 of 22 consecutive chapter pairs have no road:
  - rulings to library
  - library to drafting-table
  - code-map to queue
  - identity-scan to writing-rule
  - writing-rule to workshop
  - workshop to tool-belt
  - eyes to desk
  - desk to lab
  - lab to review-ladder
  - setup to notice-board
  - notice-board to stage
  - stage to key-cabinet
  - key-cabinet to night-shift
- A11 says "between two anchors the camera target moves along the road between them". That is undefined for most of the tour.
- R-3174 pins "halfway between two spine anchors". But spine anchors are not consecutive in the tour, because sub-chapters sit between them. The pin is ambiguous and covers the least of the scroll.
- In the simulation, Command gate (toured under Workshop) and Setup (toured under Release route) sit at the centre. A sub-chapter scroll would swing the camera across the world and back.

Fix to the plan:
- Give each attached component an attachment spring to its stage from `docs/components/loop.json`, or place it on the outside of the loop at its stage's slot. A gate or support component then visibly belongs to its stage.
- Draw that tie as a short driveway or spur marked as the chapter tie, not as a recorded road, so R-3170's honesty holds.
- Pin it: every attached component lies within a sealed distance of its stage and outside the spine polygon.
- Define the camera path for a step with no road. For example, along the spur out from the stage and back, then along the loop road.
- Rewrite R-3174's road clause as: "between consecutive chapter anchors, the target lies on the loop road, a spur or a road joining them".

### 3. Components with no edge fly out of the world, and R-3172's bounds assertion cannot fail

Evidence:
- A8 has Key cabinet and Night shift settle "by their spiral start and the repulsion alone". With no attractive force, they are pushed outward on every iteration until the cooling cap stops them. The simulation put them at (−680, 738) and (−587, −820), against a loop of radius 60.
- `apps/hive/camera.mjs` `overview` frames every chamber with `kind === 'workflow'`. Key cabinet and Night shift are `workflow` (`docs/components/nana-pi.json`). So the whole-loop chapter 00 and the "Outside the loop" chapter zoom out until the loop is a speck.
- R-3172's "every position lies inside the returned bounds" is true by construction. `layout.mjs` computes `bounds` as the min and max of the chambers. It pins nothing.

Fix to the plan:
- Add a weak centring (gravity) force for every node, or put the outside-the-loop components on a fixed sealed plot beside the loop.
- Replace the bounds clause with a falsifiable one: the world extent stays within a sealed multiple of the loop-slot extent on the fixture, and on a fixture variant with two edge-less nodes.

### 4. The art spec's structure line and phone line give the visual judge nothing it can fail on, and nothing it can see

Evidence:
- Line 7 is "a viewer can trace the lane loop from the layout alone; roads follow real relationships; no grid". "Roads follow real relationships" is not visible in a frame. The judge either marks it UNJUDGED or passes it on trust.
- "Trace the lane loop" is judged on frames that carry name labels. The labels hold no stage numbers (`main.mjs:63-65` labels hold `c.name` only), so the judge cannot check the order.
- There is no negative control. `visual-reader --control` (R-3146) is a positive control only.
- The last hive lane passed its judge and was rejected twice. A structure line that has never been shown to fail on a bad layout repeats that.
- Line 9 needs "Enter on a selection". `#explore` opens explore mode with no selection (A12), so no capture can show Enter. That line is UNJUDGED or FAIL on every run, or the judge invents a pass.

Fix to the plan:
- Rewrite line 7 as visible facts only. For example: "In the whole-loop frame, the stage labels numbered 01 to 09 sit in number order along one continuous widest road that closes on itself; at most a few roads cross the space inside it; the structures are not on a grid."
- Have chapter numbers on the stage labels.
- Run the same `world-art-spec.md` once against main's grid page at `57167e92` (`hive-page --serve --data` with the audit), and once against a frame with all 68 roads drawn. Line 7 must FAIL on both. If it passes either, rewrite the line before build 2.
- Add a deep link that opens explore with a structure selected but not entered, such as `#explore/<id>`. Capture that link for line 9.

### 5. The mobile misclick is a wiring bug in the browser, and the plan tests it only in a pure reducer

Evidence:
- Today's fly-in comes from three places in `apps/hive/main.mjs`:
  - Line 180-181 sets `moved` only for horizontal drags.
  - So a vertical swipe ends at line 186 as a tap and writes `location.hash = id` at line 199.
  - Line 170's `hashchange` handler then runs `chooseStop`, which flies the camera.
- On top of that, `body{overflow:hidden}` and `canvas{touch-action:pan-y}` (`apps/hive/index.html:7`) let the browser claim vertical swipes that can never scroll.
- R-3175 pins only `apps/hive/explore.mjs`. If `main.mjs` keeps writing the hash on select, or keeps `hashchange` tied to the camera, the reducer test passes and the phone still flies.
- R-3174 is likewise pure. No test or seat step shows that scrolling the real page lands on a chapter's pose.
- The suite has no browser test. Playwright is optional and resolved at run time (`scripts/playwright-resolve.mjs`), so CI never runs it.
- R-3175's `touch-action` clause is about runtime mode switching. A static read of `index.html` can only check the CSS rules, not that the mode class is applied.

Fix to the plan:
- (a) Make the reducer own the hash too. Selection never writes the hash; only `enter`, `tour` and `back` emit a hash or scroll effect. Pin the effect list.
- (b) Have `main.mjs` export a small `bindGestures(target, reducer, apply)`, and add a Node test. It dispatches synthetic pointer events (down/up, an 8 px vertical drift, a two-pointer pinch, a double tap) through the real binding, on a plain `EventTarget`, and asserts that no camera or hash effect is applied.
- (c) Add a seat-run browser gesture check to Visual acceptance, written down in the plan with its pass rule. It runs at 380 by 1000 with `hasTouch`, and the page exposes its camera pose and scroll chapter on a `data-` attribute. It checks four things:
  - In explore, a tap on a structure selects it and leaves the pose equal.
  - In tour, a tap changes nothing.
  - A vertical swipe in tour changes `scrollY` and the chapter, not the selection.
  - Scrolling to each of three chapter sections gives that chapter's pose.

  Save the output in the lane folder. The precedent for the browser plumbing is `scripts/first-look.mjs` (`resolvePlaywright`, `waitForHive`).

### 6. shops-flows already has a build brief on the old shape, and the two plans' publisher command lines conflict

Evidence:
- `~/nana-pi-wt/shops-flows` has `613ed19a shops-flows: build brief 1 names the art spec file` on top of `57167e92`, with no build yet.
- Its plan builds its own town layout. Its O1 is an outer ring past the governance perimeter, and its R-3167 is `town` layout determinism. It also has roads as a v2 data field (its R-3164) and serves with `hive-page --serve --data <v2 file>` alone (its Visual acceptance step 1).
- This plan removes the perimeter (A9) and puts roads in `graph.json`. Its R-3177 makes `--data` without `--graph` exit 2.
- If shops-flows builds first, its town ring and road field are throwaway. Main would then carry two road tables in two documents, and one lane's hive-page tests fail on the other's command line.
- "What shops-flows changes when it rebases" assumes the rebase is cheap. With a ready brief it is a rewrite.

Fix to the plan:
- State that the seat holds the shops-flows build until this lane passes its shape gate, and rewrites shops-flows' brief against `graph.json`.
- Decide now that roads live in `graph.json` only, and that shops-flows' v2 adds shops and flows and reuses this lane's road table.
- Settle one hive-page command line for both lanes. One option: `--data` alone keeps working by deriving the graph in-process with the deriver this lane adds, or by pairing it with a matching graph fixture. Another: if it must refuse, its line names the deriver command. Put the same line in both plans.

## SHOULD

### 7. "The same graph gives the same positions on every machine" is unproven across chips and browsers

- R-3172 deep-equals floating-point positions against a golden file. That file is made on the owner's macOS arm64 and checked on the blocking Windows x64 leg.
- Within one Node version, V8's basic arithmetic and its in-tree fdlibm are the same on every OS. Whether the compiler fuses multiply-adds inside fdlibm on arm64 is inferred, not checked.
- The page also runs the layout in the viewer's browser. Safari's JavaScriptCore uses the system maths library for `Math.sin`, `Math.cos` and `Math.log` (inferred from engine design, not measured). A 400-step spring pass can turn a last-bit difference into a visibly different world. The owner may then see a layout on his iPhone that the first-look frames never showed.
- Fix to the plan:
  - Use only `+ − × ÷` and `Math.sqrt` inside the iteration (all correctly rounded in IEEE).
  - Round the slot, spiral and log-weight inputs to a sealed number of decimals once.
  - Round positions to that grid after every iteration, and compare the golden on the rounded values.
  - The other route is to compute positions once at publish time in Node and ship them in the published data, with the deriver as their only maker, so they are never hand-written. That reverses A2's "positions stay out of the data", so it is the seat's call.

### 8. The deliverable-join source needs a parser change the plan says it will not make

- `deliverableClaims` (`scripts/deliverables.mjs:322-345`) returns `text`, `artifact`, `thirdPart` and code flags. It returns no path list.
- The planner measured the 28 joins with "a line regex" (plan line 28). A4 and the Precedent entry say the deriver "never re-parses the ledger" and that there is "no change to them in this lane". The builder must break one of those two claims.
- Fix to the plan:
  - Name the move. Add a `paths` field (the comma-split detail) to each claim in `scripts/deliverables.mjs`, so the deriver is its second caller, per the 2026-10-22 helper ruling.
  - Add `scripts/deliverables.mjs` and its test to the lane's file list, and rerun `scripts/lane-class.mjs`.
  - Note that shops-flows' R-3169 also changes reader-line parsing.

### 9. R-3173's tracked-graph geometry clause is a live-data pin

- "On the tracked graph, no road path enters the footprint of a structure that is not one of its two ends." Every later lane that adds one import between components can then fail the hive suite, in a lane that never touched the hive.
- The plan already declines to pin the real counts for this reason (R-3170: "they move with every lane").
- The simulation had 18–34 straight-road hits with all roads drawn, and 5–7 with the overview set, so one bend point (O2) is not obviously enough.
- Fix to the plan: route roads so the property holds by construction. Pin it on the fixture and on a few generated graphs (denser than the fixture, with one hub), and print the tracked graph's count as a report line, not as an assertion.

### 10. The ready mark can fire before the tour reaches the hash's chapter, so the three tour captures may all show chapter 00

- Chapter sections are made by JavaScript after the data fetch (`main.mjs:59-62`, `reading(); scrollTo(0, 0)`). The browser's own fragment scroll therefore finds no element at load.
- `firstFrame` sets the ready mark on the first draw (`apps/hive/runtime.mjs`). first-look waits for that mark and then captures (`scripts/first-look.mjs:175-178`).
- first-look also takes a full-page shot first (line 177). On a tall scroll document that resizes the viewport before the viewport shot.
- Fix to the plan:
  - Add to the R-3129 diff: "the ready mark is set only after the hash's chapter scroll and pose are applied".
  - Add a seat check that the three tour captures show three different framed structures.

### 11. The lane is too big for one build and a shape gate

- The last hive lane took five build briefs (`66153356` to `8d703702`). This plan adds all of these in one build: a deriver, a contract, a hand file, a spring layout, road routing, a scroll-document rewrite of a page that today cannot scroll (`index.html:7`), a gesture reducer, a new structure, pixel lines, Pages, 8 new rows and 7 row diffs.
- Fix to the plan:
  - Move R-3176, the theater, to lane 3. It is form only, it does not answer "no shape", and lane 3 already owns its tapes and signals. It also has the weakest road position (finding 2).
  - Keep the plan's own fallbacks (pixel roads, road cards).
  - If build 1 still runs long, land the data half first (R-3170, R-3171, R-3177). It has no visual risk, and shops-flows needs it.

### 12. The edge count's unit is undefined, and the cited extreme is not the largest

- "Command gate's 26-module pair" (A7) matches Notice board to Command gate. The largest import pairs by module import links are Setup to Command gate at 60 and Tool belt to Command gate at 37 (scratch script).
- Fix to the plan:
  - Define `count` for each source: distinct importing modules, import links, artifact IDs, or rows.
  - Seal the log scale against the real maximum.
  - Write the same unit on the road card.

## NOTE

13. Counts verified. Every number in the measured table reproduces exactly:
    - imports: 55 directed, 45 unordered;
    - artifacts: 20 and 15; joins: 28 and 21; artifact sources together: 24;
    - shared feature: 8;
    - 64 recorded pairs, with 12 import pairs also artifact pairs;
    - 5 recorded loop segments and 68 roads;
    - Command gate 18; Key cabinet and Night shift edge-less; 6 double-claimed modules;
    - test-file imports add no pair.
14. Mapping re-checked against all 23 in `docs/components/nana-pi.json`. Each component is placed exactly once, and the kinds match (Review ladder and Land gate are `governance` on the spine). Weak spots worth naming in Q1's "misses":
    - Desk is a dashboard over pi sessions, closer to Workshop than to the seat's checks.
    - Lab is the model bench. Setup sits under Release route but is a hub of 11.
    - Library has no road to Compass (finding 2).
    - Notice board's parts include the test runners (`scripts/test.mjs`, `scripts/test-locked.mjs`), and Eyes does not claim `scripts/visual-reader.mjs`.
15. The hive's own code is unclaimed. `node scripts/component-audit.mjs` lists `apps/hive/*`, and the new `scripts/component-graph.mjs` will join it. So the published-pages stage cannot show the page it publishes. Consider adding `apps/hive/`, `scripts/hive-page.mjs` and the deriver to Notice board's parts. That is the hand source, which is not frozen; only `contract.json` and `fixture.json` are.
16. Four of the nine loop segments are declared in the loop file, not recorded. The widest road is therefore partly hand-drawn. Mark the declared segments on the road card ("loop step, declared") so the feature sentence "roads that are real recorded relationships" stays honest.
17. R-3174 pins 1280 by 800. first-look captures 1280 by 1000 (`scripts/first-look-config.mjs:31`). Import `VIEWPORT_HEIGHT` rather than a new literal.
18. A deriver exit 1 on main fails the whole Pages job, product page included, because both run in one job. R-3170's tracked-tree run in the suite catches a loop-file drift before land, so this is covered. Say so in the threat model.
19. Lane class re-run: `ordinary`, matching the plan.
20. Identity scan:
    - `node scripts/identity-scan.mjs --stdin --root . < docs/reviews/world-graph-2026-10-30/plan.md` exits 0.
    - `node scripts/identity-scan.mjs --root .` prints `summary files=4714 findings=0 totals=5,0,0,4` and exits 0.
    - `graph.json` carries only component IDs, counts and repo paths, so the Pages scan step adds no new exposure.
