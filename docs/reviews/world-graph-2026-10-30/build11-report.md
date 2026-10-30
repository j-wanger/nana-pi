# Build 11 — readable city journey

VERDICT: PARTIAL — local implementation, visual acceptance and gates pass. The pushed-tip CI result follows in the final worker response.

Feature: FEAT-039. Lane: world-graph. Class: ordinary. Starting tip: 6d86bf60, the build-11 brief on 72b1d710. This work serves the objective of improving products through the owner's feedback.

## Changes and rows

No new IDs. Only R-3172, R-3174 and R-3177 were amended; all remain `implemented` with backticked `file::title` evidence.

| Row | Change | Files |
| --- | --- | --- |
| R-3174 | Sequential outgoing/incoming fades in the same final 15 percent; small upward slide; at most one card above 0.05 opacity. One reading screen plus capped half-screen travel per chapter. Scroll-driven plan-to-tower opening; no-hash still/reduced load skips to chapter 01. Phone view centre follows actual header/card geometry. | `REQUIREMENTS.md`, `apps/hive/{main,tour,camera,config,index.html,README.md}`, `scripts/hive-gesture-check.mjs`, `packages/nana-pack/tests/hive-city.test.mjs` |
| R-3172 | Five low-key house types face local trays in separated blocks; narrow height variation, yards and gaps. Lattice diagnostics include houses. | `REQUIREMENTS.md`, `apps/hive/{city,config,README.md}`, `apps/hive/assets/{hive,parts}.mjs`, `packages/nana-pack/tests/hive-city.test.mjs` |
| R-3177 | Broad rooftop clerestories carry status; absent lots retain an unlit cap and complete form. | `REQUIREMENTS.md`, `apps/hive/assets/district.mjs`, `apps/hive/{config,README.md}`, both changed test files |

Other files: generated `docs/code-map.md`; this report; `build11-capture.mjs` and the build11 logs in this folder. R-3134's existing sealed-default test now pins the roof-strip dimensions; its row did not change.

The role workers, tray geometry, lane traffic, raised ring, intentional exploration and scroll-only camera driver remain. The camera has no idle settle or independent flight clock. A small scroll-driven reading push-in keeps the chapter's place framed until the transition window, rather than moving halfway to the next place while its card is still being read.

## Tests changed

All paths below are under `packages/nana-pack/tests/`.

Four new must-meet cases in `hive-city.test.mjs`, all tagged R-3174:

1. `R-3174: card boundary never overlaps readable text and slides upward` — samples the whole stage range, checks the zero-opacity handover and upward motion.
2. `R-3174: every chapter keeps a reading screen at desktop and phone widths` — each span at 1280 and 390 px is at least 0.8 and at most 1.5 screens.
3. `R-3174: opening is a scroll-driven flat plan ending at the tower` — flat start, fractional rise, exact chapter-01 end, deterministic scroll pose, skip behavior and actual wiring.
4. `R-3174: phone chapter targets project above the card and below the header` — actual THREE projection for every chapter at anchors and mid-span, with short and tall cards; the reading half holds the named target.

Six existing cases changed where the old expectations became false:

| File / exact title | Edit |
| --- | --- |
| `hive-city.test.mjs::R-3172: radial city separates districts and rejects grid and ring controls` | Adds deterministic house count, five types, street-facing normals and narrow heights; square and hex house controls must fail the existing lattice diagnostic. Existing named-lot controls remain. |
| `hive-city.test.mjs::R-3174: scroll position maps to continuous stage without short-input dead zones` | Eight-screen total becomes fourteen to twenty-one screens; keeps mapping, monotonicity and orbit-blend assertions; adapts the card result shape. |
| `hive-city.test.mjs::R-3174: continuous scroll holds pose for two seconds and seals span and fade values` | Pins revised reading/travel/fade/dolly/slide values. Retains execution of the actual frame body at two injected times. |
| `hive-city.test.mjs::R-3172: dense town scale retains chosen lot and housing dimensions` | Pins the new house vocabulary, narrow height band, setbacks and block gaps instead of grid spacing. |
| `hive-city.test.mjs::R-3177: window lights follow audit status and dark target forms stay complete` | Adds a broad roof strip per lot, with status-specific material. Full lit/dark geometry equality remains; roof light material joins entrance windows as the allowed status difference. |
| `hive-assets.test.mjs::R-3134: visual and serving defaults retain their sealed values and provenance` | Pins roof width/depth/height. |

No test was deleted. No other test changed. Existing per-case limits still await every async case. No suite test imports, runs or copies the capture or gesture scripts. No new line-oriented parser or repository-writing fixture was added.

## Wrong-code and mutation pairs

Each new case first failed against build 10 before implementation (`build11-wrong-first.log`). Revised roof values failed before code (`build11-wrong-roof-pin.log`). The new reading-pose assertion failed before delaying travel (`build11-wrong-reading-pose.log`). Initial new-test failure included one floating-point endpoint comparison; the comparison now uses a numerical tolerance, without weakening the opacity-overlap assertion.

A later explicit code mutation run exercised working APIs, not missing exports. All six mutations were applied together; every named check below independently printed FAIL. Assertions were unchanged. The code was restored before the green run.

| Broken code | Red case / exit | Restored command / exit |
| --- | --- | --- |
| Simultaneous `1-mix` / `mix` opacities | New card-boundary case / 1 | hive-city / 0 |
| Remove base reading screen | New reading-span case and existing scroll-map case / 1 | hive-city / 0 |
| Unconditionally skip opening | New opening case / 1 | hive-city / 0 |
| Return zero projection offset | New phone-projection case / 1 | hive-city / 0 |
| Omit houses from lattice diagnostic | Existing radial case, house lattice control / 1 | hive-city / 0 |
| Light every roof regardless of audit | Existing window-light case / 1 | hive-city / 0 |

Evidence: `build11-mutations-red.log`, then `build11-city.log` (13 checks), `build11-assets.log` (4 checks) and `build11-page.log` (10 checks), all restored runs exit 0.

## Frame folders and measurements

Images are outside git; no reference or notes folder was written.

- Round 1: `/tmp/world-graph-build11-round1`.
- Round 2: `/tmp/world-graph-build11-round2`.
- Final round 3: `/tmp/world-graph-build11-round3`.
- Final phone gestures: `/tmp/world-graph-build11-round3/gestures`.

Final `390/` and `1280/` folders each contain:

- Fourteen `chapter-00-mid.png` through `chapter-13-mid.png` images at each section's physical midpoint, with normal motion/opening enabled. The last section intentionally holds stage 13.
- Six `boundary-0.png` through `boundary-5.png` images around the queue/workshop handover: 85, 89, 92.5, 95, 98 and 101 percent of the outgoing section.
- Fourteen exact chapter anchors, three opening frames and selected whole-city Explore.
- Eight `scroll-strip-*` images sampled during one actual fourteen-second continuous browser scroll from chapters 02 through 06, not eight separate scroll jumps.
- Four `idle-*` images at a fixed mid-chapter position, requested at least 0.5 s apart. Pose and stage match; worker animation is allowed to continue.

`poses.json` records stages and poses. `mid-contact-390.png` and `mid-contact-1280.png` show all fourteen midpoint frames together. The opening reaches stage 1 exactly; stage 0 is the crisp thin plan with the title and Scroll to enter. Signal pulses animate without changing the pose. Initial low-resolution plan captures looked soft; round 3 draws the same imported plan at viewport resolution.

The final folder also holds nine `first-look-*` folders: chapters 00, 02, 03, 05, 06, 07, 08, 13 and Explore. These use the unchanged first-look tool at its sealed 380 and 1280 widths, with `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md`. Each returned 0. Custom required frames add 390 px. Renderer checks observed WebGL, not pixel fallback.

The final real canvas roof probe found **12 lit and 2 dark named places at 1280 px**; at 390 it found 9 lit and 1 dark. Dark examples are night-depot and vault; lit examples include tower, drafting and yard. The first probe incorrectly expected raw white >=230 despite ACES rendering it near 226, and omitted the phone projection offset. The probe was corrected, not the product or any suite assertion. The rejected measurement is retained in `build11-roof-probe-calibration.log`. Subsequent captures remeasure the same third-round art; they are not a fourth art iteration.

## Own spec judgement

No model sessions or subagents were started. This is the builder's judgement, not an independent review.

| Spec line | Round 1 | Round 2 | Round 3 | Final observation |
| --- | --- | --- | --- | --- |
| 1 edge-to-edge scene | PASS | PASS | PASS | Fixed full-viewport city, with overlays. |
| 2 legible model, depth and shadows | PASS | PASS | PASS | Outlined forms, tray shadows, quiet house silhouettes and solid role figures. The opening drawing is now crisp. |
| 3 restrained palette | PASS | PASS | PASS | White, grey and ink only. |
| 4 deliberate typography | PASS | PASS | PASS | Numbered monospace rail/picker and short headlines remain. |
| 5 one readable frosted card | PASS | PASS | PASS | Outgoing text disappears before incoming text appears; blank handover has no stacked text. |
| 6 same object on a phone | PASS | PASS | PASS | Fixed stage and bottom card at 380/390; not a stacked column. |
| 7a park, tower, outbound route and trays | PASS | PASS | PASS | Original central plaza, fence, gate, viaduct and outbound customs route remain. |
| 7b varied non-lattice arrangement | PASS | PASS | PASS | Named places retain radial bands; houses follow local streets with five forms and block gaps. |
| 8 subject, label, card and inbound route | FAIL | PASS | PASS | Round 1 mid-span travelled away from the named place. Reading now holds its target with a small scroll-driven push-in; the gate remains above its card. |
| 9 selected phone Explore | PASS | PASS | PASS | Whole-city selected view, outlined workshop, dark incident streets and Enter/Back to tour controls. |
| 10 lit/dark buildings and workers | PASS | PASS | PASS | Broad lit/unlit roof windows distinguish named buildings together; roles remain visible at close working places. Final pixel counts above support the whole-city judgement. |

Final: **11 spec lines PASS, 0 FAIL** (7a and 7b counted separately).

## Gesture result

Final `node scripts/hive-gesture-check.mjs --url <served real audit> --out <external folder>`: **exit 0; 14 passed, 0 failed**, at 390 px.

The checks retain real hit-tested selection, ignored tour taps, monotonic sixty-wheel-tick traversal, five short swipes, native smooth picker scrolling, hash/anchor pose equality, full chapter order, bounded overlap and five street/ground contrast pairs. New checks cover every target's header/card band, the 0.8-screen floor and 31 boundary samples without overlapping readable cards. Wheel and touch poses match at 0.1 s and 2 s after stopping.

## Precedent and departures

All nine named precedent files were read completely before design.

- `main.mjs`: retains native scroll/hash wiring and the draw loop. Departure: the opening overlay returns as an explicit scroll state rather than a timer; sequential opacity and transforms replace simultaneous cross-fades, as requested.
- `tour.mjs`: imports the existing `blendPose`; no copy. Departure: reading-plus-capped-travel spans replace normalized travel-only weights. Reading keeps its target and uses a small scroll-only push-in, because round 1 midpoint frames left the named subject.
- `camera.mjs`: keeps orbit blending and adds a shared projection-offset helper. The actual camera uses `setViewOffset`, not a displaced look-at target, so labels and picking retain one projection.
- `text-layer.mjs`: unchanged; its card rendering and narration remain authoritative. The opening invitation is outside the card layer because it overlays the plan while cards are hidden.
- `pixel.mjs`: imports its existing public `drawPlan` and `pixel` list; no copied drawing function. It is unchanged. The opening uses a separate viewport-resolution canvas to avoid enlarging a tiny raster.
- `district.mjs`: keeps shared solid primitives, outlines and status materials; adds rooftop clerestories without deleting dark structure.
- `parts.mjs`: adds one house builder using the existing public box/drum kit, rather than duplicating primitives.
- `city.mjs`: reuses its existing public `segmentDistance` in the placement logic. Departure: house placement moves from the renderer's global-grid loop to deterministic street-relative model data, so layout diagnostics and rendering consume the same positions. No existing private helper was moved or copied.
- `hive-gesture-check.mjs`: retains the real-browser pattern and adds three checks; its phone viewport changes to the requested 390 px. The shared first-look widths remain unchanged.

No private precedent helper was copied or moved. `assets/hive.mjs` assembles the shared house kit instead of making grid boxes. The changed README states the new behavior where consumers read it.

## Known-bug context touched

The existing CABINET/RELEASE ROUTE label-clipping note concerns this overlay surface. Phone projection and card motion touch it, but this change makes no claim about that older complete scenario. The known pixel-fallback readiness limit remains; captures explicitly checked WebGL. R-3104's Windows timeout is unchanged; if that CI flake appears, its failed job gets one rerun. No HANDOFF, known-bug file or session archive was edited.

## Commands and gates

Long outputs are committed as the `build11-*.log` files beside this report. Gate output is consolidated in `build11-gates.log`; paths in logs are normalized to `$WORKTREE` and `$HOME`.

- `node packages/nana-pack/tests/hive-city.test.mjs`: 0, 13 checks.
- `node packages/nana-pack/tests/hive-assets.test.mjs`: 0, 4 checks.
- `node packages/nana-pack/tests/hive-page.test.mjs`: 0, 10 checks.
- `node docs/reviews/world-graph-2026-10-30/build11-capture.mjs <external round folder>`: final exit 0, including the gesture check.
- `npm run map`: 0; generated map included.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .`, `node scripts/identity-scan.mjs`: each 0.
- Evidence-title check uses the exported requirements rail, not a duplicate parser: 11 citations for amended rows, **0 missing**.
- `npm run test:locked`: 0, one machine-wide lock, foreground wrapper, error handler and 30-second heartbeat.

**242 files: 240 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8758 pass, 0 fail, 44 skip · 601.3s**

## Not done

No independent model review or land was attempted, as the brief forbids model sessions. No known-bug context outside the named fixes was repaired. The finished new-tip CI run and exact-tip gate rerun are reported in the final response, after this record is committed and pushed. No open owner question was raised.
