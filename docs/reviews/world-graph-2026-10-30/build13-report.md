# Build 13 — eased page following and visible city work

VERDICT: DONE for implementation and local acceptance. Exact-tip reruns, push and finished CI are reported in the worker's final response.

Feature: FEAT-039. Lane: world-graph. Class: ordinary. Base: 1499688d (the build-13 brief after 34899e07). This work serves improvement through the owner's product feedback. No model session or subagent ran.

## Changes, rows and tests

No new requirement IDs. R-3122 and R-3174 remain `implemented`, with backticked `file::title` evidence. No component contract or fixture changed.

| Item | Files | Contract |
| --- | --- | --- |
| Page-selected eased stage | `apps/hive/tour.mjs`, `config.mjs`, `main.mjs` | R-3174: analytic critically damped follow, 0.15 s response, clamped toward the page target, exact rest by about 0.5 s, then 2 s stillness. Reduced motion and still use the page target directly. |
| One render clock | `apps/hive/main.mjs` | Scroll records only target stage using cached viewport height. Event handlers request work; only the RAF loop draws. Phone clipping uses one colour pass, not two. |
| Bounded overlay work | `apps/hive/main.mjs`, `labels.mjs` | Chapter/voice keys control text rebuilding; 32 fade buckets control card styles. Overlay and label metrics invalidate only with chapter, readable card, voice or viewport changes. Projected anchors still update each moving frame. |
| No scrolling shadow rebuild | `apps/hive/main.mjs` | Full-height architectural shadows cache behind the opaque opening's first frame. Later opening growth does not rebuild the map. A redundant ResizeObserver notification cannot clear an already-ready still canvas. |
| Visible motion and bay | `apps/hive/config.mjs`, `assets/district.mjs` | R-3122: four-second work loops, exposed raised/front jib, opened centre roof, broader swing and offset turntable load. Existing lifts already cover their full travel; their speed doubles. |
| Whole-city life | `apps/hive/main.mjs` | Distant real figures and moving crates retain minimum ink points, using the existing outline pixel values. Human/crate geometry and ratios stay unchanged. |
| Opening drawing | `apps/hive/pixel.mjs`, `index.html`, `main.mjs` | R-3174: title/invitation above the drawing; scaled street widths from the same STREETS config, ring and local paths, round tower and simple building/house footprints. |
| Consumer contract and evidence | `apps/hive/README.md`, `scripts/hive-gesture-check.mjs`, `docs/code-map.md`, `build13-capture.mjs` and logs here | Optional `--scroll` adds four Metal measurement cases. All fixtures/publications/images remain outside git. |

Only two test files changed; no test was added or deleted. Every async case remains awaited under a per-case limit. No suite test runs, imports or copies either seat driver. This change adds no line-oriented production reader.

| Existing test changed | Reason / retained checks |
| --- | --- |
| `hive-city.test.mjs::R-3174: request journey frames fourteen narrated chapters` | Moving travel into the latter half made the former absolute one-unit continuity probe false on long legs. It now checks the analytic smoothstep derivative bound against actual target distance. All narration, order, bounds and hash checks remain. |
| `hive-city.test.mjs::R-3174: eased scroll settles within half a second then holds for two seconds` | Replaces the old immediate-hold title/contract. Pins the complete TOUR_SCROLL object, including new follow, settle, bucket, camera-step and travel-fraction tunables. Exercises monotonic bounds, no immediate jump, direction changes, exact settlement and two-second holds at 30/60/120 Hz. The original injected-clock actual draw-body stillness check remains. It also rejects rendering/text work inside the actual scroll handler. |
| `hive-city.test.mjs::R-3174: opening is a scroll-driven flat plan ending at the tower` | Adds actual plan street-width hierarchy and house/building polygon checks. Original flat-plan, tower endpoint, skip and deterministic-pose checks remain. |
| `hive-page.test.mjs::R-3122: residents inhabit their places and activity gives capped worker figures` | The sealed WORKERS period changes from eight to four seconds. Gate-arrival samples now use the shared half-period instead of the former absolute four-second midpoint. All twelve jobs, dark/frozen poses, signed-arrival guard, jointed figures, geometry budget, routes and sparse town population remain checked. |

Test paths in this table are under `packages/nana-pack/tests/`. No other existing case changed. The tests pin mechanics and data, not every aesthetic judgement in the visual table.

## Wrong code first and mutation pairs

Requirement diff preceded tests, then production changes. `build13-wrong-city.log` and `build13-wrong-page.log` record exit 1 against unchanged production code. `build13-wrong-travel.log` records exit 1 for the newly pinned camera-travel fraction before its implementation. The first green attempt also caught two mistakes in the new assertions (a direction-change target could lie below the current stage; a road named local could actually be an avenue); those assertions were corrected to their stated contracts, not inverted.

| Broken code, never assertions | Red result | Restored green |
| --- | --- | --- |
| Immediate target assignment in `followStage` | R-3174 rejects the short-input jump; `build13-mutation-jump.log`, exit 1 | `node packages/nana-pack/tests/hive-city.test.mjs`, exit 0, 13 checks |
| Put `reading(); frame();` back in the scroll handler | R-3174 rejects the handler; `build13-mutation-handler.log`, exit 1 | Same city command, exit 0 |

All mutations were restored before final verification and the full suite.

## Measurements before changing the causes

`build13-before.log` measured the original app before production edits. `build13-before-final.log` repeats the original app with the final instrumentation, serving the exact original app bytes from 1499688d into an OS temporary publication. It never restores or writes old code into this worktree. The table uses that comparable repeat and `build13-verification.log` for after.

- **Duplicate draws: confirmed.** During 10 s smooth input plus 1 s settling, desktop made 2,511 draw/render calls before versus 1,320 after. Phone made 2,493 draws and 4,986 colour renders before versus 1,320 of each after. The extra phone pass was separate from the scroll-handler duplication.
- **Wheel jumps: confirmed.** The largest normalized wheel step was 0.7647 eye-target distances before, 0.0434 after at 1280 px.
- **`reading()` on each scroll: confirmed, with a qualification.** Full text already rebuilt only on chapter changes. However, all-card fade/style work ran on every scroll event. Smooth input called reading/fade work 1,195 times before versus 192 after at 1280 px; full text rebuilds remain nine in both.
- **Shadow rebuilding: confirmed for opening growth.** There were 15 invalidations with ticks and 112–118 during smooth scrolling before, zero after warm-up in every final case.
- **Geometry rebuilding: refuted.** Instrumented BufferGeometry allocations during scrolling were zero before and after. Before had delayed uploads of existing geometry as detail became visible, not new geometry. Final runs have zero buffer uploads too.
- **Forced layout: confirmed.** Phone smooth input made 64,094 bounding-rect reads before, 255 after. Remaining reads occur when actual overlay content/visibility or label metrics change, not once per scroll/frame. Stage dimensions are cached for frame projection.

Headless Chromium explicitly uses `--use-angle=metal`; every case reported `ANGLE Metal Renderer: Apple M1 Max`. Viewport height is 1000 px. Each case warms up, measures ten seconds of either 100 real 100 px wheel ticks or one uninterrupted page scroll to the release-route region, then observes settlement. Long-task observation covers the measured/settling period. No recorded task exceeded 50 ms; `maxTaskMs: 0` means no long-task entry, not that all browser tasks take zero time.

| Width / input | p95 ms before → after | Maximum world step before → after | Maximum step / eye-target distance before → after | Moving-leg reversals before → after |
| --- | --- | --- | --- | --- |
| 1280 / ticks | 10.2 → 9.9 | 74.929 → 6.661 | 0.7647 → 0.0434 | 0 → 0 |
| 1280 / smooth | 9.9 → 10.1 | 17.457 → 8.240 | 0.3802 → 0.1147 | 4 → 0 |
| 390 / ticks | 10.0 → 10.1 | 215.732 → 34.048 | 0.4123 → 0.0386 | 0 → 0 |
| 390 / smooth | 10.0 → 10.2 | 26.849 → 33.905 | 0.1613 → 0.0580 | 7 → 0 |

Frame p95 already passed before; this is chiefly a jump/reversal and redundant-work improvement, not a claimed frame-rate rescue. World-space steps can grow on the much more distant phone camera even while visual-relative steps shrink. All after cases pass the sealed **0.12 eye-target-distance** bound, have zero displayed-stage reversals, zero target overshoot, zero settlement error and unchanged settled pose. The real wheel/touch check then pins two full seconds of stillness after the settling allowance.

A spatial route changes bearing between chapters. The reversal metric compares consecutive nonstationary steps within a moving leg, resetting at a stationary reading hold; it does not label a new chapter's different bearing as autonomous reversal. The first exploratory log used an overbroad comparison across stationary holds. The comparable before/after repeat uses the corrected identical metric. All raw samples are retained externally.

## Frame folders

No reference or notes folder was written. All pages use the real audit and explicitly refuse pixel fallback for measurement/capture acceptance.

- Initial baseline: `/tmp/world-graph-build13-before/scroll/`.
- Comparable baseline: `/tmp/world-graph-build13-before-final/scroll/`.
- Visual rounds: `/tmp/world-graph-build13-round1/`, `round2/`, `round3/` with the same prefix.
- Final images: `/tmp/world-graph-build13-round3/1280/` and `/390/`.
- **Requested 2 s / 30-frame slow scroll:** `/tmp/world-graph-build13-round3/1280/slow-scroll-00.png` through `slow-scroll-29.png`; `poses.json` records frame times/stage/pose. The paused browser clock advances at 15 samples/s while the page scrolls 200 px/s. The original PNGs are unaltered.
- Four frames 0.5 s apart for chapters 02–10: final `1280/motion-02-0.png` through `motion-10-3.png`.
- Original-size four-frame strips: final `strips/chapter-02.png` through `chapter-10.png`; thumbnail contact sheet: `strips/slow-scroll-contact.png`.
- Post-fix final verification: `/tmp/world-graph-build13-verification/`; its nine `first-look-*` folders retain the original 380/1280 widths and reference/spec inputs. Phone image: `gestures/gesture-390.png`. Final measurement JSON: `gestures/scroll/`.

Each main width also has fourteen chapter midpoint frames, six boundary samples, four settled idle frames, three opening frames and selected Explore. Round 1 stopped during clock-paused bootstrap. Round 2 completed desktop captures but stopped on a clock-paused navigation. The driver now bootstraps with the live clock, pauses only after readiness, and resumes before navigation. Round 3 completed all requested frames. Its phone pixel check exposed a redundant resize clearing a still canvas after readiness (all five pixel pairs read zero); the no-op resize guard fixed that race. The post-fix nine first-look calls and complete gesture/scroll rerun all pass. That verification changes no visual design and adds no fourth polishing round.

The optional PIL compositor was unavailable; the strips use the existing Playwright canvas toolchain instead. No package installation occurred.

## Own spec table

These are builder judgements, not model reviews. Rounds 1–2 have incomplete visual coverage; the final table uses round-3 frames and the post-fix first-look frames.

| Spec line | Final judgement / evidence |
| --- | --- |
| Art 1: edge-to-edge scene | PASS: full viewport stage, overlays retained. |
| Art 2: detailed, legible depth/light/shadow | PASS: full-height cached architectural shadows; exposed bay rig and chapter details. |
| Art 3: restrained palette | PASS: original white/grey/ink materials. |
| Art 4: deliberate typography | PASS: original numbered rail, picker and label hierarchy. |
| Art 5: one readable frosted card | PASS: original sequential fade checks and boundary captures; bucketed updates preserve one readable card. |
| Art 6: same designed object at 380 px | PASS: post-fix original-width first-look captures; requested 390 px frames also retained. |
| Art 7a: central park/tower, one exit, customs/customers and solid trays | PASS: same radial city, pale kerbed/pier-supported roads and shared cargo scale. |
| Art 7b: non-lattice arrangement | PASS: original layout and five street-facing house types remain. |
| Art 8: chapter subject/label/card and inbound route | PASS at chapter holds: same numbered subjects and phone band. Camera travel is intentionally broader during transitions, not a new chapter destination. |
| Art 9: selected phone Explore | PASS: selected outline and incident roads, whole city, explicit Enter/Back to tour. |
| Art 10: lit/dark forms and people | PASS: complete lit/dark buildings together; workers remain visible at chapter distance. |
| Build 13: handler records target only | PASS: actual-source assertion and measured one-render clock. |
| Build 13: critically damped monotone follow, no autonomous destination | PASS: analytic clamped follow and 30/60/120 Hz code check; real scroll samples have no stage reversal or overshoot. |
| Build 13: settle about 0.5 s, then 2 s stillness | PASS: pure time-step check plus actual wheel/touch idle poses. |
| Build 13: chapter/fade-bucket card work | PASS: measured smooth fade calls fall from 1,195 to 192 at desktop; text rebuilds remain chapter keyed. |
| Build 13: no scroll/frame shadow or geometry rebuild, unnecessary layout reads | PASS: zero scrolling shadow invalidations/geometry allocations; cached metrics invalidate only for changed layout. |
| Build 13: p95 <20 ms, no >50 ms task | PASS: all four cases 9.9–10.2 ms, no long-task entries. |
| Build 13: bounded camera step, no moving-leg reversals | PASS: all four below 0.12; no reversals. |
| Build 13: visible mechanisms, 3–6 s loops | PASS: four-second work loops; crane sweeps and turntable offset are more readable. Full-range lifts now run twice as fast. |
| Build 13: bay crane at chapter 05 | PASS: raised/front jib and open centre roof separate the silhouette at both widths. |
| Build 13: clear title and architectural plan | PASS: title/invitation above the plan; shared street hierarchy and house/building footprints. |
| Build 13: whole-city people/crates as signs of life | PASS with scale qualification: distant ink points preserve moving figures/loads rather than enlarging the actual kits. They are signs of life, not individually readable roles at whole-city distance. |

Round 1 failed the initial travel-step bound. Round 2 passed the broader-travel measurements but had incomplete capture coverage. Round 3's final design passes the visual lines; the subsequent readiness correction closes its pixel-probe failure.

## Precedent and departures

All eight named precedent files were read completely before design.

- `main.mjs`: retained the actual scroll/hash/gesture wiring and one performance-time mechanism clock. Departure: events now only invalidate/request work; the sole RAF loop owns rendering and eased displayed stage. The phone's two-pass clip becomes a single scissored colour pass. Architectural shadows prime at full height under the opaque plan, rather than invalidating during growth. These remove the measured duplicate/heavy work.
- `tour.mjs`: retained and imported stage mapping, chapter spans, card blending and opening state. Added the analytic follow here, not a second mapping implementation. Departure: removed the sinusoidal reading dolly because it reverses within one-way scrolling. Camera travel uses smoothstep over the latter half, while cards retain their final-15-percent fade. This spreads the previously compressed high-speed camera leg enough to meet the step bound; chapter destinations, spans and the first-half reading hold remain.
- `camera.mjs`: unchanged; existing `blendPose`, `focus`, `overview` and `viewCentreOffset` are imported, never copied.
- `text-layer.mjs`: unchanged; existing public `textLayer` and `renderText` remain the only card builders.
- `pixel.mjs`: retained the existing projection and added footprint polygons, house footprints and shared-config street widths. Departure: broad outlined pale paths replace uniform thin connecting lines, to read as a city plan.
- `district.mjs`: retained shared solid parts and job rigs. Departure: open bay roof centre, higher/front jib, broader swing, off-centre turntable load and four-second town clock/wheel loops make their motion visible. No private helper moved or copied.
- `residents.mjs`: unchanged. The shared 1.8-unit kit, role equipment, grounding and four-pose loops remain. Whole-city minimum ink signs are browser presentation, not enlarged worker geometry.
- `hive-gesture-check.mjs`: retained actual hit-tested phone gestures and idle/pixel checks. Added an exported Metal measurement routine and optional CLI flag; settlement now precedes the two-second hold. The capture imports that public routine.
- Additional `labels.mjs` change: extended existing public `placeLabels` with an optional invalidatable cache; reused public `safeBands`. This eliminates repeated layout work without copying the existing collision algorithm or moving a private helper.

No private-helper move was required. The capture/compositor reuses the existing browser resolver, page builder and ready helper. No new test harness or model reviewer was launched.

## Known-bug context touched

The old CABINET/RELEASE ROUTE overlay clipping surface is touched by label/overlay caching; this work does not claim that combined old scenario is closed. The pixel-fallback readiness limit remains; acceptance explicitly refuses fallback. The redundant resize race was a separate still-canvas clearing path, now closed. The Windows R-3104 timeout is unchanged; a matching CI failure gets one rerun. No supplied known-bug file, HANDOFF or session archive changed, and no GitHub issue was created or altered.

## Commands and exits

Long output is committed in the `build13-*.log` files beside this report; machine paths are normalized for publication.

| Command / check | Exit / result |
| --- | --- |
| City, page, assets targeted test commands | 0; 13 / 10 / 5 checks respectively. |
| Original wrong-code runs and two code mutations | Each 1 as expected; restored city run 0. |
| Final verification driver with `--first-look --scroll-check` | 0; all nine first-look calls 0; **gesture checks: 26 passed, 0 failed** (14 original phone checks plus 12 scroll assertions). |
| `npm run map`, `npm run map:check` | 0; regenerated map committed. |
| `npm run readme:check` | 0. |
| `node scripts/requirements-trace.mjs` | 0. |
| `node scripts/requirements-tree.mjs --check` | 0. |
| `node scripts/known-bugs.mjs --root .` | 0. |
| `node scripts/identity-scan.mjs` | 0. |
| Evidence-title check using exported `checkRepo` and `scanSource` | 0; **9 titles checked, 0 missing**. |
| `node scripts/lane-class.mjs --root . --files <changed runtime files>` | 0; ordinary. |
| `git diff --check` | 0. |
| `npm run test:locked` | 0; foreground awaited child, one machine-wide lock, launch/exit watcher and 30-second heartbeat. |

**242 files: 240 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8759 pass, 0 fail, 44 skip · 603.7s**

The writing check also ran with `--report` (exit 0, `build13-writing.log`). Its length, passive, heading/verdict and identifier findings remain because this is the brief-required technical worker record, explicitly outside the owner-prose rule; exact paths, titles, measurements and qualifications are required evidence.

## Not done / limits

Software-only rendering was not remeasured; the requested backend is Metal. No unbounded arbitrary-distance hash-jump camera-step guarantee is claimed; the sealed step gate covers the specified short-tick and continuous scroll scenarios. Minimum ink signs preserve whole-city life but do not make each distant role recognizable. Collision/visual evidence is sampled, not an exhaustive proof. No independent model review or land was attempted. Exact-tip seat-check exits, push and the finished CI result follow in the final response.
