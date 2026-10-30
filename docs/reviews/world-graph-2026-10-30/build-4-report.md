VERDICT: PARTIAL

The merge and world changes pass the mechanical checks. The final overview still misses the reference's density and phone composition. Three visual rounds are complete; this is not visual acceptance.

## Commit and files

One merge/build commit on `feat/world-graph`; the worker response supplies its hash and finished CI result. Main's merged tip is `d797a9f1`. Generated conflicts occurred only in `docs/code-map.md` and `docs/requirements-tree.md`; both were regenerated. Main's known-bug lines and session notes were retained automatically, without hand edits. HANDOFF also changed only through the merge.

Build-owned files:

- Street geometry: `scripts/component-graph-config.mjs`, `scripts/component-graph-layout.mjs`, `docs/components/graph-fixture.json`, `packages/nana-pack/tests/fixtures/hive-graph-base.json`.
- Ground, structures and light: `apps/hive/assets/hive.mjs`, `apps/hive/assets/road.mjs`, `apps/hive/config.mjs`, `apps/hive/main.mjs`.
- Overlay and composition: `apps/hive/index.html`, `apps/hive/text-layer.mjs`, `apps/hive/camera.mjs`.
- Evidence: `REQUIREMENTS.md`, `apps/hive/README.md`, the two test files below, generated maps, this report and `build4-*.txt` records in this folder.

`build4-files.txt` inventories staged paths, including all unchanged imports from main. No v1 component contract, component fixture, hand loop source or component assessment changed. `build4-v1-bytes.txt` records byte identity against build 3. R-3120 stays retired; the remaining lane rows stay implemented with backticked `file::title` evidence. No new row ID was allocated.

## Rows and every build-owned test change

| Row | Change | Test |
| --- | --- | --- |
| R-3172 | Equal-arc 16-by-48 oval slots; fixed spine; maximum one-unit footprint-to-street gap. | Edited `hive-graph.test.mjs::R-3172: published loop geometry matches goldens and sealed bounds clearance and attachments` to pin the new ellipse, rotation and 360 arc samples. Existing golden, clearance, ordering, depot and attachment assertions remain. Old slot values became false. |
| R-3172 | New must-meet frontage test, also pinning `LOOP_FRONTAGE = 1`. | Added `hive-graph.test.mjs::R-3172: every stage fronts its continuous loop within the sealed one unit`. It checks the live graph and both saved graphs, shared junctions, footprint clearance and actual distance to every loop segment. |
| R-3173 | Loop width grows from 1.8 to 3.6; round ground joints seal ribbon corners. | Edited only the width pin in `hive-graph.test.mjs::R-3173: typed roads avoid third footprints and meet the base crossing caps`; the old width became false. All existing routing, source, flatness, marking, visibility and crossing checks remain. |
| R-3175 | Same width configuration, no gesture behavior change. | Edited only the width inside the configuration pin in `hive-graph.test.mjs::R-3175: real gesture binding never enters or changes hash on phone taps swipes or pinches`. |
| R-3134 | Sealed lighting: ambient 0.65, sun 4.5 at [-45, 65, 35], shadow map 4096. | Edited `hive-assets.test.mjs::R-3134: visual and serving defaults retain their sealed values and provenance` because the old STYLE object became false. |

Test paths in the table are under `packages/nana-pack/tests/`. No other build-owned test was edited or added. No test was deleted. The saved graph fixtures were regenerated from their saved edges, not replaced with live audit counts.

Main imports, not new lane authoring:

- Rows R-3149, R-3150, R-3152 through R-3160, and changes to R-1272 and R-2822.
- New `packages/nana-pack/tests/code-map-launch.test.mjs` and shared `git-fixtures.mjs`.
- `code-map.test.mjs`: count actual test modules and use the launch-aware untraced label.
- `code-search.test.mjs`: import `gitShow` from the new fixture module instead of its old private copy; assertions unchanged.
- `runtime-map.test.mjs`: renamed R-1272 and R-2822 cases for the shim block, asserted blind-reach ordering, and supplied launch configuration in its historical fixture.

The locked full suite covers these imports. Their source records remain in `docs/reviews/map-spawn-edges-2026-10-29/`.

## Wrong-first and mutation pairs

Assertions were never inverted. All red commands exit 1; restored graph and asset commands exit 0.

| Wrong code | Red record | Green record |
| --- | --- | --- |
| Build 3 values, no frontage seal | `build4-wrong-first.txt` | `build4-graph-tests.txt` |
| Frontage seal present, old radial road geometry | `build4-frontage-wrong.txt` | `build4-graph-tests.txt` |
| Old 2048 shadow map and unsealed old lighting | `build4-light-wrong-first.txt` | `build4-assets-tests.txt` |
| Round 1 ellipse and narrow 1.8 loop | `build4-round2-wrong-first.txt` | `build4-graph-tests.txt` |
| CODE mutation: add four units to each computed street-junction offset, leaving the one-unit seal and assertion intact | `build4-mutation-frontage.txt`: new frontage case rejects Compass at 4.9999 units | `build4-graph-tests.txt`: eight checks |

## Screenshots and visual judgement

Final screenshot folder: `/private/tmp/nana-world-graph-build4/round3/`.

Each of `overview`, `drafting-table`, `review-ladder`, `notice-board`, `explore`, and `explore-workshop` contains both viewport widths, full-page frames, copied reference frames, the spec, manifest and side-by-side page. URLs are `http://127.0.0.1:7354/#overview`, `#drafting-table`, `#review-ladder`, `#notice-board`, `#explore`, and `#explore/workshop`.

Every capture used `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <external folder>`. The original reference folder was never written. All six final 380 frames show **RENDERER: WEBGL**. No model session or subagent ran.

Round 1 remains in `round1/`; round 2 is `round2-live/`. An unsuccessful attempt to publish over an existing folder initially captured stale files into `round2/`. Those are not round 2 evidence. Publication into a fresh folder and a served-file refresh preceded `round2-live/`. `build4-first-look.txt` retains every capture command's output.

The table is my own comparison against the frames, the reference and `judge-build3.md`. It does not substitute for an independent visual judge.

| Spec | Round 1 | Round 2 | Final round 3 |
| --- | --- | --- | --- |
| 1: scene is the page | FAIL: overview still looks stacked on phone. | FAIL: ground paving continues behind the header, but the overview remains isolated below it. | FAIL: tour frames are full-bleed; phone overview still has a large quiet area under the header. |
| 2: detail, depth, light | FAIL: stronger shadows and explicit lots help, but small tokens remain. | FAIL: review terraces and turreted gates read better; overview is still sparse. | FAIL: recognisable props, sawtooth workshop, stair reviews, grounded lots and shadows improve depth; still below the reference city's density. |
| 3: restrained palette | PASS | PASS | PASS: white/grey forms, black details and grey streets. |
| 4: typography | PASS | PASS | PASS: shorter Contract, Identity, Keys and Night labels; browser measurement finds no clipped or overlapping visible labels. |
| 5: frosted reading | PASS | PASS | PASS: no rail divider, 12 px blur, one short card; body precedes buttons with an 18 px gap. |
| 6: same designed phone object | FAIL: overview composition still separates scene and reading. | FAIL: improvement is not enough. | FAIL: one scene and one card, but the phone overview retains the stacked impression named by build 3's judge. |
| 7: numbered loop and spurs | FAIL: depot could occupy the interior. | FAIL: depot was outside, but its driveway was still long. | PASS: one continuous dark widest oval in order, near-stage outer depot, outer supports, zero overview crossings; frontage test covers every stage. |
| 8: tour framing | PASS | PASS | PASS: three distinct centred structures, matching numbers and incoming streets. |
| 9: selected phone exploration | PASS | PASS | PASS: Workshop outline, darker incident streets, name, Enter and Back to tour, whole loop retained. Unselected exploration intentionally has no Enter. |

Three design rounds used; no fourth round attempted. The open visual failures remain in this report, not the protected known-bug file.

## Gesture and browser results

`node scripts/hive-gesture-check.mjs --url http://127.0.0.1:7354/ --out /private/tmp/nana-world-graph-build4/gestures` exits 0: **gesture checks: 4 passed, 0 failed**.

`build4-browser-checks.txt`: twelve WEBGL ready marks, zero clipped visible labels, zero label overlaps, zero clipped active cards. The selected exploration body-to-button gap measures 18 px at both widths. Browser measurement is not a suite test and does not import a seat script.

## Commands and exits

All final validation commands below exit 0. Logs are committed as `build4-*.txt` in this folder; generated stack traces replace the checkout prefix with `<repo>` before publication.

- `node scripts/component-audit.mjs --out <external components.json>`: real audit.
- `node scripts/component-graph.mjs --out <external graph.json>`: 23 overview streets; zero overview and loop crossings.
- `node scripts/hive-page.mjs --out <fresh external site> --data <components.json> --graph <graph.json>`: paired publication.
- `npm run first-look -- --page url --after <each URL> --hive --reference <reference folder> --spec <spec file> --out <external folder>`: six final successful captures.
- `node packages/nana-pack/tests/hive-graph.test.mjs`: 8 checks.
- `node packages/nana-pack/tests/hive-assets.test.mjs`: 3 checks.
- `node packages/nana-pack/tests/hive-page.test.mjs`: 10 checks, unchanged file.
- `npm run -s req:tree`, `node scripts/code-map.mjs --write`: regenerated merge conflicts.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs`, `node scripts/known-bugs.mjs --root .`, `node scripts/identity-scan.mjs`: green.
- Evidence-title check: **9 checked, 0 missing**.
- `node scripts/lane-class.mjs --root . --files <build-owned code paths>`: ordinary.
- `npm run test:locked`: foreground, unfiltered, one default machine-wide lock; heartbeat and failure watcher active.

Suite summary: **241 files: 239 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8747 pass, 0 fail, 44 skip · 584.8s**.

The worker reruns the named seat checks on the committed tip, pushes it, and reports the finished CI run in its response. No CI outcome is presumed here.

## Precedent and departures

All five brief-named files were read before design. The graph entry point still delegates publication geometry to its existing layout/config modules. Road ribbons, lot paths and paving import `ribbon` from `apps/hive/assets/parts.mjs`; existing beam and fence imports remain. No private helper was moved or copied.

Intentional departures from prior behavior:

- Fixed equal-arc spine slots replace spring movement of numbered stages. Reason: relationships must not pull a stage off its street or form rows.
- Junction offsets use the polygon's inward angle bisector rather than its radial vector. Reason: radial offsets on a long oval put the street through its own stage footprint.
- Depot search rejects interior candidates and reserves space between its stage's two supports. Reason: keep the depot outside on a short driveway while retaining one yard and its recorded stage choice.
- Circular ground lots, an oval plaza and flush paving joints replace bare ground. Reason: explicit street-level context without duplicating an architectural builder.
- The existing workshop and civic builders gain sawtooth roofs and turreted silhouettes; review gets exposed ascending terraces. Reason: the judge called those stages plain blocks.
- Stronger raking light replaces high ambient fill. Reason: cast shadows must be visible in the saved frames.
- Desktop overview shifts the city under the rail; phone header frosting is removed; selection actions follow body copy. Reason: restore overlay composition and spacing without changing the gesture boundary.

## Known-bug context touched

- Contract/fixture hash limitation: unchanged; byte comparison and existing R-3171 still pass.
- Phone WEBGL fallback: all six final phone captures measured WEBGL; fallback code is unchanged, so no universal closure is claimed.
- Rail/card/label clipping: frosting, labels, coordinate caption and button order changed. Final measured labels and cards are not clipped. Visual composition and density remain open above.
- Main's FEAT-029 known-bug additions arrived unchanged through the merge. No other listed known bug was fixed or edited.

## Not done

The world is not visually finished: spec lines 1, 2 and 6 still fail my final judgement. Independent visual acceptance remains for the seat. No GitHub issue, comment, model session or subagent was created. No fourth design round ran.

`nana-writing --report` is run on this technical record. Any advisory findings about paths, identifiers, sentence length or the required verdict heading are retained under the writing rule's explicit builder-report exception.
