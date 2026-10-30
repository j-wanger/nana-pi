# Build 12 — human-scale cargo and a working city

VERDICT: PARTIAL. The implementation and local gates pass. The bay jib still loses its silhouette against the roof in some frames. The frame budget passes with headless Metal, not with software rendering. Finished-tip CI is reported in the final response.

Feature: FEAT-039. Lane: world-graph. Class: ordinary. Start: 48b660e1, including the two authorized build-12 brief commits after 3961ff90. This work serves the current priority of improving products through owner feedback.

## Files and rows

No new requirement IDs. R-3122 and R-3173 were amended and remain `implemented` with backticked `file::title` evidence. The tests pin the structural and animation contracts, not visual acceptance of every frame.

| Item | Files | Rows / result |
| --- | --- | --- |
| One scale | `apps/hive/config.mjs`, `assets/parts.mjs`, `assets/road.mjs`, `assets/hive.mjs`, `assets/residents.mjs` | R-3173: 1.8-unit worker; crate 0.28 worker heights (0.504), lane 1.26, crate/lane 0.4. Shared grey outlined cargo, request beacon, ring pallets, loaded outbound and empty inbound trucks. |
| Job mechanisms | `apps/hive/assets/district.mjs`, `assets/hive.mjs` | R-3122: twelve named jobs, inactive future rigs, deterministic still poses; stamped-arrival gate guard. |
| Workers and town | `apps/hive/assets/residents.mjs`, `assets/hive.mjs`, `config.mjs` | R-3122: four interpolated limb poses, attached shoes, yard carriers, drafting runner, tread-grounded reviewers, operators, sparse walkers on local trays. |
| Framing and cost | `apps/hive/camera.mjs`, `main.mjs`, `assets/parts.mjs` | Existing R-3125/R-3174 framing contracts retained. Projected-corner fitting moves closer without cropping bounding corners. Static batches retain picking and selected-road shading; articulated subtrees remain separate. |
| Consumer contract | `apps/hive/README.md` | Scale, jobs, frozen behavior, sparse traffic, batching, cached architectural shadows and contact shadows are stated where the page consumer reads them. |
| Tests | Three files listed below | One new scale case; three existing cases amended. |
| Generated / evidence | `docs/code-map.md`, this report, `build12-capture.mjs`, all `build12-*.log` beside it | Map, captures, mutations and command exits. No protected file changed. |

The widened trays remain within the revised chosen caps: a two-lane avenue is at most a fifth of the median small-lot width, a local one tenth. The former caps were too small for a half-metre crate with the requested clearance. Three builders remain at each lit bay. Town density is one walker per six local trays; ring traffic is one opposing pair per six ring spans, rather than one pair per tessellated segment.

## Tests changed

All test paths are under `packages/nana-pack/tests/`.

| File / exact title | Change and reason |
| --- | --- |
| `hive-assets.test.mjs::R-3173: cargo shares worker scale and forty percent lane clearance` | The sole new test, requested by the brief. Pins worker height, crate/worker and crate/lane ratios, pallet height and ring sparsity; checks the actual shared crate, grey material, ink edge, carrier and beacon. |
| `hive-assets.test.mjs::R-3134: visual and serving defaults retain their sealed values and provenance` | Old absolute street widths and width caps became false. Reads the derived dimensions and pins the new caps. |
| `hive-page.test.mjs::R-3122: residents inhabit their places and activity gives capped worker figures` | Old role set and WORKERS object became false. Includes the new operators, runner and town stride. Checks all twelve moving jobs, stopped future jobs, signed-arrival guard, sparse town population and runner route. Existing capped activity, crew count, geometry budget, joint/equipment, contact position and frozen snapshots remain. |
| `hive-city.test.mjs::R-3177: window lights follow audit status and dark target forms stay complete` | Cargo beacons and scanner lamps now turn dark at future lots. They join windows and roof lamps as explicit allowed material differences; full lit/dark geometry equality remains. |

No other test changed or was deleted. Every async case remains awaited under a per-case limit. No suite test imports, copies or runs the capture or gesture script. Fixtures still use OS temporary folders. This change adds no line-oriented production reader.

## Wrong-code pairs

The new scale test first failed against unchanged build-11 code, before implementation (`build12-wrong-first.log`, exit 1). Its first restored run exposed ordinary floating-point division error; ratio comparisons now allow 1e-12, while the sealed input values still use exact assertions.

Additional mutations broke code, never assertions:

| Broken code | Red evidence / exit | Restored green command / exit |
| --- | --- | --- |
| Crate 1.28 worker heights; ring stride 1 | `build12-mutation-scale.log`: new R-3173 case / 1 | `node packages/nana-pack/tests/hive-assets.test.mjs` / 0, 5 checks |
| Town stride 1 | `build12-mutation-town.log`: R-3122 sealed worker configuration / 1 | `node packages/nana-pack/tests/hive-page.test.mjs` / 0, 10 checks |
| Early return from every job animation | `build12-mutation-rigs.log`: R-3122 names the tower / 1 | Same page command / 0 |
| Open gate for unsigned arriving cargo | `build12-mutation-gate.log`: R-3122 closed-leaf assertion / 1 | Same page command / 0 |

All mutations were restored before the final captures, targeted runs and locked suite. The new sparsity values were pinned after their initial implementation; their wrong-code runs are later code mutations, not a claimed tests-first implementation sequence. This is a process departure.

## Frame folders

No reference or notes folder was written. All scenes use the real audit, not the frozen fixture. All captured pages reported WebGL.

- Round 1: `/tmp/world-graph-build12-round1`.
- Round 2: `/tmp/world-graph-build12-round2`.
- Final round 3: `/tmp/world-graph-build12-round3`.
- Final four-frame strips: `/tmp/world-graph-build12-round3/strips/chapter-02.png` through `chapter-10.png`.
- Strip contact sheet: that folder's `contact.png`.
- Phone gesture image: `/tmp/world-graph-build12-round3/gestures/gesture-390.png`.

Each final `1280/` and `390/` folder contains fourteen physical-midpoint chapter frames, six boundary samples, eight frames from one continuous 14-second scroll, four idle frames and three opening frames, plus selected Explore. The `1280/` folder also contains four motion frames per chapter 02–10. The strips composite those original 1280-wide frames without altering them.

Playwright's browser clock holds each screenshot's phase and advances exactly 500 ms between motion frames. `poses.json` records time, stage, pose and renderer. All nine strips hold one camera pose and stage across their four samples. The unchanged first-look tool also captured chapters 00, 02, 03, 05, 06, 07, 08, 13 and Explore at its original 380/1280 widths, reading the supplied reference and art spec. All nine calls exited 0.

## Own spec table

These are builder judgements, not independent model reviews. Maximum three visual rounds; no model sessions or subagents ran.

| Existing art-spec line | Round 1 | Round 2 | Round 3 | Evidence / qualification |
| --- | --- | --- | --- | --- |
| 1 edge-to-edge scene | PASS | PASS | PASS | Full-viewport stage and overlays retained. |
| 2 model depth, legibility and shadows | FAIL | PASS | PASS | Round 1's cached shadow map retained the flattened opening. Cache invalidation now follows the opening's scale. |
| 3 restrained palette | PASS | PASS | PASS | White, grey and ink only; crates are grey, not black blocks. |
| 4 deliberate typography | PASS | PASS | PASS | Original numbered rail, picker and labels. |
| 5 one readable frosted card | PASS | PASS | PASS | Sequential boundary fades retained. |
| 6 same object at phone width | PASS | PASS | PASS | Original 380 captures plus requested 390 frames. |
| 7a park, tower, route and built trays | PASS | PASS | PASS | Same radial city and route; human-scale two-lane trays and supported ring. |
| 7b non-lattice arrangement | PASS | PASS | PASS | Named lots and five house types retain street-facing blocks. |
| 8 chapter subject, label, card and inbound route | PASS | PASS | PASS | Closer projected-corner poses; phone target remains above card. |
| 9 selected phone Explore | PASS | PASS | PASS | Batched hit ranges select the component; incident roads darken; Enter remains deliberate. |
| 10 lit/dark forms and people | PASS | PASS | PASS | Roof strips remain distinguishable together; complete dark lots; workers at framed places. |

| Build-12 line | Round 1 | Round 2 | Round 3 | Final observation |
| --- | --- | --- | --- | --- |
| One worker/crate/lane scale | PASS | PASS | PASS | Same shared 0.504 crate kit in hands, rigs, request and traffic. |
| Ring pallets / freight loaded out, empty back | PASS | PASS | PASS | Supported carrier geometry, correct opposing streams. |
| Reception dish and stem lift | PASS | PASS | PASS | Dish turns; lift descends with a beacon crate. |
| Drafting feeder and runner | FAIL | FAIL | PASS | Feeder now aligns with planner/adversary desks; runner stays on the tray. |
| Dispatch gantry | PASS | PASS | PASS | Hoist traverses and raises a waiting crate. |
| Bay jib and stepped frame | FAIL | FAIL | FAIL | Both animate, but the jib boom still merges with the front roof edge at this camera angle. A hanging load moves; the crane's silhouette is not consistently clear. |
| Inspection turntable | PASS | PASS | PASS | Offset crate and table marker visibly turn under the frame. |
| Review lift, climb and stamp | FAIL | FAIL | PASS | Feet now meet actual tread tops; lift and stamp remain on the exposed front. |
| Signed-arrival land leaves / operator | FAIL | FAIL | PASS | Open porch centre reveals the leaves and operator; no unsigned or distant opening in the code check. |
| Customs barrier, scanner and operator | FAIL | FAIL | PASS | Operator and scanner now stand on the actual conveyor top. |
| Freight trucks | PASS | PASS | PASS | Loaded outward leg and empty return. |
| Theater reel and broadcast | PASS | PASS | PASS | Spoked reel, expanding rooftop rings. |
| Courthouse / utilities | PASS | PASS | PASS | Slow clock; water tower, connected pipes and wheel. |
| Future / still behavior | PASS | PASS | PASS | Future rigs stay stopped and unlit; frozen snapshots do not inherit a moving pose. |
| Visible workers and town life | FAIL | FAIL | PASS | Four-pose limbs, on-tray carriers/runner, tread climbing and sparse walkers. Grounding and checkpoint sightlines corrected. This is sampled visual evidence, not an exhaustive collision proof. |
| Frame budget | FAIL | FAIL | PASS on Metal only | 8.3 ms median; software rendering still misses. See below. |

The remaining bay silhouette miss is why the verdict is PARTIAL, despite green tests and gates.

## Gesture and frame time

Final gesture command: `node scripts/hive-gesture-check.mjs --url <served audit> --out <external folder>` — exit 0.

**gesture checks: 14 passed, 0 failed**

All phone chapter targets remain between header and card. Wheel/touch idle camera poses hold. Reading spans, sequential fades, hit-tested selection and street contrast retain their checks.

Final frame measurement: 1280 × 1000, whole-city closing view, headless Chromium with `--use-angle=metal`, Apple M1 Max. After warm-up, 1,201 requestAnimationFrame intervals over 10,001.3 ms give a **median 8.3 ms**. Renderer telemetry at the sample: 341 calls, 134,922 triangles, approximately 3 ms CPU frame work. The capture log records the actual GPU string.

The default headless browser chose SwiftShader, not the hardware GPU. Initial unbatched measurement was 333.3 ms. Static and articulated-subtree batching, sparse traffic, projected-size culling and cached static shadows reduced the software result to 116.7 ms in the last software probe (before the final sightline edits). This does **not** satisfy 33 ms on software-only rendering. Hardware timing is not substituted silently for that failed measurement.

Open question for the seat: must the 33 ms budget include software-only Chromium? There is no claim that SwiftShader passes. Moving mechanisms use solid shading, while only static architecture casts cached sun shadows; figures retain their explicit contact shadows.

## Precedent and departures

All eight named precedent files were read completely before design.

- `config.mjs`: derived cargo and lane dimensions from WORKERS once. Added chosen sparse population/traffic strides and pins. Retuned width caps because the previous caps cannot hold the requested crate/lane ratio.
- `road.mjs`: retained ribbon/kerb/pier construction and imported the public shared cargo kit. Departure: one carrier pair per six ring spans and outbound-road traffic replace per-segment boxes; locals are left to pedestrians.
- `assets/hive.mjs`: retained assembly, request path and one animation clock. Request cargo now uses the public kit, lane-centre offsets and ring approach heights. Workers follow existing model handoffs instead of a final straight segment through a bay wall. No path-routing helper was copied.
- `residents.mjs`: retained the private figure kit and role loops; added four interpolated limb poses and attached feet. No `block` or `limb` helper was moved or copied. Existing public cargo builder serves its second caller.
- `district.mjs`: retained shared box/drum/beam/hoop forms and full future geometry. Added twelve articulated rigs. Departure: split checkpoint porch roofs and side stairs leave the operating lane open; customs stands on its conveyor. These avoid occlusion and floating without changing the city layout.
- `parts.mjs`: added public cargo, spoked-wheel and static-batching builders. Departure: batching compiles immutable geometry into shared buffers and keeps component triangle ranges for picking. A GPU edge shader retains the existing distance-based outline fade. No private `add` helper moved.
- `main.mjs`: retained performance-time animation, scroll-only camera, reduced-motion/still control and actual gesture wiring. Added browser-side batching, existing-threshold detail culling and shadow-cache invalidation. Departure: dynamic objects use contact shadows instead of rebuilding the entire architectural sun map each frame, for cost.
- `hive-gesture-check.mjs`: unchanged; imported its public main for the capture's real phone run.
- Additional camera change: `camera.mjs` reuses its existing public overview fitter with an optional elevation argument. This replaces the oversized focus sphere without copying the projected-corner algorithm. The existing corner and phone-band checks remain green.

No authorized private-helper move was needed. No component contract or fixture bytes changed. All build-11 tour behavior remains checked.

## Known-bug context touched

The known CABINET/RELEASE ROUTE clipping note concerns the same overlay surface. Closer chapter fitting touches that surface but does not claim to close the old combined scenario. The pixel-fallback readiness limit remains; captures explicitly refused pixel mode. The Windows R-3104 timeout remains unchanged; a matching failed CI job gets one rerun. No other supplied known bug was fixed or altered. No known-bug file, HANDOFF or session archive changed.

## Commands and exits

All long output is in the committed `build12-*.log` files beside this report. Recorded machine paths are normalized to `$WORKTREE` and `$HOME`.

| Command | Exit / evidence |
| --- | --- |
| Targeted asset / page / city test files | Each 0: 5 / 10 / 13 checks. |
| Final capture with `--first-look` | 0; nine first-look calls 0; gestures 14/0. |
| `npm run map`, `npm run map:check` | Each 0; map committed. |
| `npm run readme:check` | 0. |
| `node scripts/requirements-trace.mjs` | 0. |
| `node scripts/requirements-tree.mjs --check` | 0. |
| `node scripts/known-bugs.mjs --root .` | 0. |
| `node scripts/identity-scan.mjs` | 0. |
| Evidence-title check, using exported row/trace parsers | 0; 3 citations checked, **0 missing**. Initial reporting command used the wrong parser result field; corrected command reads the exported local citations, not a copied parser. |
| `node scripts/lane-class.mjs --root . --files <changed app files>` | 0; ordinary. |
| `npm run test:locked` | 0; one machine lock, foreground child, launch/exit watcher and 30-second heartbeat. |

**242 files: 240 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8759 pass, 0 fail, 44 skip · 602.5s**

## Not done

The bay jib's consistently clear silhouette is not finished. Software-only rendering does not meet the frame budget. The capture evidence samples grounding and separation but supplies no exhaustive collision proof. No independent model review or land was attempted, as forbidden by the brief. Push, exact-tip gate exits and the finished CI result follow in the final worker response.
