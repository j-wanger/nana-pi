VERDICT: DONE for implementation and local acceptance. Exact-tip checks, push and finished CI follow in the worker's final response.

# Build 14 — inhabited blocks, calm opening and a readable bay crane

Feature: FEAT-039. Lane: world-graph. Class: ordinary. Base: 877778b6, the brief after ed10ed12. This serves the owner's product-improvement priority. No model session, subagent, issue operation, HANDOFF edit, known-bug edit or session-archive edit occurred.

## Files and rows

Only R-3122, R-3172 and R-3174 changed; all remain `implemented` with backticked `file::title` evidence. No new requirement ID was allocated. The component contract and frozen fixture remain unchanged.

| Item | Files | Result |
| --- | --- | --- |
| Town blocks | `apps/hive/city.mjs`, `config.mjs`, `assets/parts.mjs`, `assets/hive.mjs` | Existing routing joins neighbouring town frontages with local block trays. Existing placement follows them with the same setbacks, gaps, five house types and dimensions. Housing uses one instanced mesh per type, built from the existing public `house` kit, with per-vertex roof/door colours and cached architectural shadows. Static batching preserves instances. |
| Calm title | `apps/hive/main.mjs`, `index.html` | The drawing and letters fade separately. The soft-edged opaque band does not fade underneath readable text. Pulses pass behind it. |
| Bay crane | `apps/hive/assets/district.mjs` | A side mast, counterweight, triangular braced jib and suspended carryable crate form a clear silhouette above the roof. Each four-second loop swings inward and lowers the crate through the open roof. The clerestory moves to the rear rather than sitting above the crane. The rising frame remains inside the bay. |
| Life between places | `apps/hive/assets/hive.mjs`, `main.mjs` | Reuses the already-correct drafting-to-yard runner and yard-to-lit-bay carriers. Adds a loaded truck on the declared ladder/land-gate/customs path. Existing traffic animation drives it. Minimum ink signs use the existing five-pixel full-outline threshold rather than the 1.5-pixel edge-fade threshold; actual worker/crate dimensions do not change. Additional block trays naturally add sparse walkers. |
| Preserve smoothness | `apps/hive/config.mjs`, `tour.mjs` | A chosen 0.3 front-load warp precedes the existing smoothstep over the same latter-half travel interval. This removes the late close-up speed peak without widening the 0.12 bound, shortening chapter holds, changing destinations or changing the 0.15 s follower and 0.5 s settlement. |
| Contract and evidence | `apps/hive/README.md`, `REQUIREMENTS.md`, `docs/code-map.md`, `build14-capture.mjs`, `build14-*.log` | Updated consumer contract, trace evidence, generated map, external captures and retained Metal/gesture measurements. |

### Density baseline

Build 11's `3961ff90` city/config/layout modules were loaded from an OS temporary directory against today's real audit and the unchanged city plan. They place **30 house lots**. The starting build-13 layout also places 30; this was not a measured count reduction for speed. The old and new recorded whole-city frames both showed sparse isolated spoke clusters. Rather than only matching that floor, this build adds connected blocks: **77 house lots**, 2.57 times the measured baseline, across the same five types. A row-three lot contains three attached homes; counts consistently use placed lots, not doors. `DENSITY.build11Houses = 30` pins the requested historical floor.

The new routes still use the public existing obstacle router. The radial, clearance, non-lattice and road-connectivity checks all remain green. No houses were dropped to meet the performance budget.

## Tests changed, wrong code first and mutation pairs

One test file changed: `packages/nana-pack/tests/hive-city.test.mjs`. No test was deleted. Every async case remains awaited under its existing 60-second per-case limit. No suite test imports, executes or copies a seat driver. No new production line-oriented text reader was added.

Four new must-meet tests:

1. `R-3172: whole-city housing retains the build-11 floor with one instance batch per house type` — pins the 30-lot floor, retained instance count, five vertex-coloured shadow-casting batches and local block trays after actual batching.
2. `R-3174: opening title keeps an opaque calm band while the plan fades` — pins the actual browser source's independent drawing/text fades and the actual CSS band. Pixel appearance is judged separately in captures.
3. `R-3122: bay jib reaches over the opening and lowers a crate into it each loop` — checks the braced side jib, full repeating loop, vertical range and actual world-space load entering the opening.
4. `R-3122: sheet runner bay carriers and outbound truck travel between places after batching` — exercises the actual batched scene, both lit-bay carriers, sheet runner and truck path crossing both sides of the gate; all travelers change position.

Three existing tests edited only where the change makes them false:

- `R-3172: dense town scale retains chosen lot and housing dimensions`: the complete DENSITY pin gains `build11Houses: 30`; all prior dimensions stay identical.
- `R-3174: eased scroll settles within half a second then holds for two seconds`: the complete TOUR_SCROLL pin gains `cameraTravelBias: 0.3`; all previous follow, settle, stillness and source checks remain.
- `R-3174: request journey frames fourteen narrated chapters`: the continuity oracle includes the new front-load warp's derivative bound, `1 + bias`, before smoothstep's existing 1.5 bound. It continues to check the same chapter endpoints, framing, narration and continuous target travel. Real measurements independently retain the unchanged 0.12 camera-step gate.

Requirements were amended before these tests, and tests ran before their implementation.

| Wrong CODE → restored CODE | Red evidence | Green evidence |
| --- | --- | --- |
| Original individual sparse housing / no instance batches → local blocks and instanced kit | `build14-wrong-first.log`, exit 1, new R-3172 failure | `build14-city.log`, exit 0 |
| Original parent-opacity fade exposing the city → independent opaque band | Same red log, new R-3174 failure | Same green city run |
| Original small front rig / no braced reach → side jib and inward lowering | Same red log, new crane R-3122 failure | Same green city run |
| No inter-place gate truck → declared-path truck, retaining existing carriers | Same red log, new route R-3122 failure | Same green city run |
| Original unwarped travel → chosen front-load bias | `build14-wrong-bias.log`, exit 1, sealed-value/continuity failures | Same green city run |

These are wrong-implementation-first pairs; assertions were never inverted. No additional synthetic mutation campaign was run. The first title-check utility attempt used the wrong return shape and failed before checking titles; the corrected utility uses the exported map and scanner and reports zero missing.

## Before and after measurements

Same existing `measureScrolling` function and Metal backend, real audit, 1000-pixel viewport height, ten seconds of input plus settlement. Baseline: `build14-before.log`; after: final retained gesture run in `build14-round2.log`. All cases report `ANGLE Metal Renderer: Apple M1 Max`. The baseline itself narrowly misses the retained step bound; that is why camera timing changed in round two.

| Width/input | p95 ms before → after | Maximum world step before → after | Maximum relative step before → after |
| --- | --- | --- | --- |
| 1280/ticks | 10.2 → 9.8 | 6.651 → 7.344 | 0.05034 → 0.04354 |
| 1280/smooth | 10.2 → 10.0 | 8.578 → 9.241 | 0.12029 → 0.10922 |
| 390/ticks | 10.1 → 10.3 | 35.759 → 35.499 | 0.03897 → 0.04014 |
| 390/smooth | 10.0 → 10.0 | 25.314 → 43.825 | 0.05812 → 0.04939 |

Relative step divides by the prior eye-target distance. World-space travel may grow while that visual-relative measure falls. Every final case has **zero moving-leg reversals, zero stage reversals, zero settle error, unchanged settled pose, zero scrolling shadow invalidations, zero buffer uploads and zero geometry allocations**. Each draw has one colour render. No long-task entry occurred (`maxTaskMs: 0`); this does not mean every browser task takes zero time.

Round-two's independent initial measurement also passed all four cases (largest relative step 0.09838; p95 10.1–10.3 ms). The final gesture rerun reached a larger 0.10922, still under 0.12. The wheel and touch cases retain two full seconds of unchanged stage/camera after the settling allowance.

Ten-second whole-city views: **1280 median 8.3 ms, p95 9.8 ms, 1202 frames**; **390 median 8.3 ms, p95 10.1 ms, 1202 frames**. The greater population stays well under the inherited 33 ms median and requested 20 ms scroll-p95 limits.

## Frame folders and rounds

No output was written into either protected reference/notes directory. All screenshots and raw JSON are external; logs and the driver are committed here.

- Baseline telemetry: `/tmp/world-graph-build14-before/scroll/`.
- Round one: `/tmp/world-graph-build14-round1/`. Density, title and crane passed visual inspection; smooth-camera acceptance failed because desktop smooth maximum was 0.12229. Phone gestures passed 14/14. This is not counted as a fully accepted round.
- **Final round two:** `/tmp/world-graph-build14-round2/1280/` and `/390/`.
- Requested chapters: `chapter-00-mid.png`, `chapter-05-mid.png`, `chapter-13-mid.png` in each width folder. `opening-0.png` through `opening-4.png` include exact chapter-00 start and quarter-span samples, including its title while the city rises.
- **Whole-city four-frame strips:** each width has `motion-13-0.png` through `motion-13-3.png`, sampled exactly 500 ms apart, and the unscaled horizontal `strip-13.png`.
- Inherited work-motion evidence: desktop chapters 02–10 each have four half-second frames and an unscaled strip.
- Inherited slow-scroll evidence: each width has `slow-scroll-00.png` through `slow-scroll-29.png` over two seconds. `poses.json` records browser-clock times, stages and camera poses.
- Phone gesture image: final `gestures/gesture-390.png`. Final gated scroll JSON: `gestures/scroll/`. Initial round-two measurement: `scroll/`. Whole-city timing: each width's `whole-city.json`.
- Both widths also include all fourteen chapter midpoint frames and selected Explore. Captures and measurements explicitly refuse pixel fallback.

No third polishing round was needed. The exact-tip verification reruns the same checks without changing the design.

## Own spec table

Builder judgements, not a model review. Final judgement uses round-two frames. The inherited 380-pixel design line was inspected at the brief's requested 390 pixels; no new exact-380 capture is claimed.

| Spec line | Round 1 → final round 2 | Evidence / qualification |
| --- | --- | --- |
| Art 1: edge-to-edge scene | PASS → PASS | Full fixed viewport; no new scene container. |
| Art 2: legible model, depth, light and shadow | PASS → PASS | Existing cached architectural shadows; crane is now unmistakable at both chapter widths. |
| Art 3: restrained palette | PASS → PASS | Same white/grey/ink materials, retained in housing vertex colours. |
| Art 4: typography hierarchy | PASS → PASS | Existing numbered rail/picker, no added data text. |
| Art 5: readable single card/rail | PASS → PASS | Existing sequential fade and phone overlap checks remain green. Opening invitation is a separate initial title, not another chapter data card. |
| Art 6: same phone design | PASS → PASS at 390 | Same header, city, picker and single bottom card; exact 380 is not remeasured. |
| Art 7a: park, tower, exit/customs/customer route, solid pale trays | PASS → PASS | Layout and fence crossings retained; new town trays remain outside the park. |
| Art 7b: varied, non-lattice arrangement | PASS → PASS | Five house types, varied local frontages, shared router and green shape controls. Town blocks replace isolated spoke clusters. |
| Art 8: framed named chapter with inbound route | PASS → PASS | Fourteen chapter captures and original pure framing/hash tests. |
| Art 9: phone Explore selection and explicit Enter/Back | PASS → PASS | Selected Explore frame and actual hit-tested gesture check. |
| Art 10: complete lit/dark places and workers | PASS → PASS | Whole-city pair retained; workers visible at chapter distance. Whole-city roles remain signs, not recognizable people. |
| Build 14.1: town density and varied types | PASS → PASS | 77 lots versus the measured historical floor of 30; five instance batches, no population reduction. |
| Build 14.1: p95 below 20 ms | PASS → PASS | Every scroll case below 10.4 ms in both rounds. |
| Build 14.2: title/prompt never cross road/building | PASS → PASS | Opaque calm band persists throughout five opening samples at both widths; letters fade independently. |
| Build 14.3: bay jib carries crate inward each loop | PASS → PASS | Both-width chapter-05 frames; desktop half-second strip and world-space loop test. |
| Build 14.4: runner, builders and truck between places | PASS → PASS | Existing carrying routes preserved after batching; actual-path gate truck added; visible moving ink signs on trays. |
| Build 14.4: whole-city motion visible | PASS → PASS | Both-width chapter-13 strips show multiple changing positions. Figure/crate meshes retain the shared physical scale. |
| Retain build-13 camera bound and monotonicity | FAIL → PASS | Round one 0.12229, final maximum 0.10922 against unchanged 0.12. No camera/stage reversal. |
| Retain single render, caches, settlement and stillness | PASS → PASS | Zero rebuild counters; 26/26 final gesture/scroll checks, including two-second holds. |

## Precedent and departures

Every named precedent file was read completely before design.

- `config.mjs`: kept all DENSITY dimensions, type vocabulary, work scale, follow/settle timings and camera bound. Added the measured 30-house historical floor and chosen 0.3 camera front-load bias. Reason: a floor pin and the measured late-travel bound miss.
- `city.mjs`: reused public `route`, `roundPosition`, `townHouses` and existing setback/clearance logic. Departure: connect neighbouring town frontages, not only isolated spokes. Reason: restore inhabited blocks without a lattice or fewer houses.
- `assets/district.mjs`: reused its shared-part bindings, public cargo kit and animation dispatch. Departure: side mast and proportional braced jib, deeper lowering, rear clerestory and frame relocation. Reason: the small front rig was lost behind/in front of the architecture at chapter 05.
- `assets/residents.mjs`: unchanged; imported existing builders/animations through hive as before. Actual runner and builder tray routes already existed. No copied or moved helper.
- `main.mjs`: kept one RAF renderer, target-only scroll handler, static shadows and layout caches. Departure: independent drawing/letter fade above an opaque invitation band and stronger distant ink signs using an existing sealed threshold. Reason: prevent title overlap and make whole-city motion readable without enlarging humans/crates.
- `pixel.mjs`: unchanged. Existing public `drawPlan` remains the sole opening drawing and receives the denser layout's footprints/streets automatically.
- `scripts/hive-gesture-check.mjs`: unchanged. Both the driver and final verification reuse its exported measurement and gesture entry points; all build-13 counters, steps, reversal, settlement and pixel checks remain.
- Additional `assets/parts.mjs`/`assets/hive.mjs`: added public `houseInstances`, which calls the existing public `house` once per type, plus one truck using the existing public `cargo` and existing traffic metadata/animator. Reason: keep draw count bounded while adding houses and carry traffic through the actual gate. No private helper moved or copied.
- Additional `tour.mjs`: imported `blendPose` as before, with a monotone endpoint-smooth parameter warp. Reason: preserve the existing step bound despite a reproducible baseline miss. No independent camera clock or pose filter was added.
- Process departure: the direct impact check for the additional parts/hive modules ran after their first edits, rather than before; the initial impact check had already shown them in the affected graph. The direct tour impact check ran before its edit. No files outside the lane worktree were edited except permitted OS-temp fixtures/frames and the temporary commit message.

## Known-bug context touched

The pixel-fallback capture limitation remains; this acceptance explicitly refuses a fallback rather than claiming to fix readiness. Title/overlay presentation touches the broad existing clipping surface, but the older CABINET/RELEASE ROUTE/rail clipping scenario is not claimed closed. The Windows R-3104 timeout is unchanged; a matching failed CI job receives one retry. No other supplied known bug was changed or claimed fixed.

## Commands and exits

Long output is committed in this folder's `build14-*.log` files. Machine-specific home paths in generated logs are normalized before publication.

| Command | Exit / result |
| --- | --- |
| `node packages/nana-pack/tests/hive-city.test.mjs` | 0, 17 city checks |
| `node packages/nana-pack/tests/hive-page.test.mjs` | 0, 10 page checks |
| `node packages/nana-pack/tests/hive-assets.test.mjs` | 0, 5 asset checks |
| Wrong-first city runs, original code and missing bias | Each 1 as expected |
| `node build13-capture.mjs /tmp/world-graph-build14-before --measure-only` from this folder | 0, comparable pre-change Metal measurement |
| `node build14-capture.mjs /tmp/world-graph-build14-round1 --measure` from this folder | 0 for capture/14 gestures; separate measured camera bound FAIL reported above |
| `node build14-capture.mjs /tmp/world-graph-build14-round2 --measure --scroll-check` from this folder | 0, four initially gated measurements, all captures, **gesture checks: 26 passed, 0 failed** |
| `npm run map`, `npm run map:check`, `npm run readme:check` | Each 0 |
| `node scripts/requirements-trace.mjs` | 0 |
| `node scripts/requirements-tree.mjs --check` | 0 |
| `node scripts/known-bugs.mjs --root .` | 0 |
| `node scripts/identity-scan.mjs` | 0 |
| Exported `checkRepo` + `scanSource` evidence-title check | 0; **15 titles checked, 0 missing** for all three amended rows |
| `node scripts/lane-class.mjs --root . --files <changed runtime files>` | 0, ordinary |
| `git diff --check` | 0 |
| `npm run test:locked` | 0; foreground awaited child, one machine-wide lock, exit watcher and 30-second heartbeat |

**242 files: 240 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8763 pass, 0 fail, 44 skip · 608.2s**

The report writing check ran with `--report`, exit 0 (`build14-writing.log`). Its identifier, length, passive and verdict-format findings remain because this brief-required technical worker record requires exact paths, test titles, numbers and qualifications. Technical worker records are outside the owner-prose rule.

## Not done / limits

No model review, land, arbitrary hash-jump step guarantee or software-renderer performance claim. The historical floor was recomputed with today's audit, not represented as a recovered historical audit. Whole-city ink signs show motion, not individual job identities. Visual overlap acceptance is sampled at the requested widths, not an exhaustive viewport proof. Exact 380-pixel inherited captures were not repeated. No helper moves. Exact-tip checks, push and the finished CI result follow in the final worker report.
