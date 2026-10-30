VERDICT: PARTIAL

The mechanical work passes. The overview now uses the whole viewport, the depot has direct stage spurs, and phone controls have a clear band. I do not claim visual completion: Compass still reads above the loop's apex in the whole-loop frame. Three design rounds are complete.

## Commit and files

One build commit on `feat/world-graph`, following the green locked full suite. The worker response gives its hash, last-tip seat checks and finished CI result. The starting tip was `0d97dc50`, the seat's brief/judge commit above build 4 (`c85d8e05`). No merge was needed.

- Framing and phone: `apps/hive/camera.mjs`, `apps/hive/index.html`, `apps/hive/main.mjs`, `apps/hive/labels.mjs`.
- Forms and surroundings: `apps/hive/assets/hive.mjs`.
- Placement and publication: `scripts/component-graph.mjs`, `scripts/component-graph-layout.mjs`, `scripts/component-graph-config.mjs`.
- Goldens: `docs/components/graph-fixture.json`, `packages/nana-pack/tests/fixtures/hive-graph-base.json`.
- Contract, tests and documentation: `REQUIREMENTS.md`, `packages/nana-pack/tests/hive-graph.test.mjs`, `apps/hive/README.md`, generated `docs/code-map.md`.
- Evidence: this report and `build5-*.txt` in this folder.

The generated requirements outline has no diff. No component assessment, hand loop source, v1 component contract or v1 component fixture changed. No protected file, session archive or GitHub issue was edited.

## Every row and test changed

Only R-3172 changed. It now names top-first equal-arc slots, every stage including 01, a nine-world-unit maximum support/depot spur, and direct numbered-stage depot connections. Its status stays `implemented`; its two backticked `file::title` citations remain exact. R-3120 stays `retired`. No new row ID was allocated.

All test edits are in `packages/nana-pack/tests/hive-graph.test.mjs`:

| Test | Exact change and why |
| --- | --- |
| `R-3172: published loop geometry matches goldens and sealed bounds clearance and attachments` | Changed the existing LOOP_START pin from -1.4 to -PI/2. The old value became false when Compass moved to the oval's top slot. Existing determinism, clearance, ordering, depot, bounds and attachment checks remain. |
| `R-3172: every stage fronts its continuous loop within the sealed one unit` | Retained the per-stage frontage check, including Compass. Extended this named must-meet case with the MAX_SPUR_LENGTH = 9 seal, direct stage-to-support/depot connections, and actual routed path lengths. It runs on the live graph and both saved graphs. |
| `R-3173: typed roads avoid third footprints and meet the base crossing caps` | Changed only the expected declared depot pairs from a chain to direct numbered-stage pairs. The old expectation became false. All routing, footprint, source, visibility, markings and zero-crossing assertions remain. |

No new test case was added. No test was deleted. The other two hive test files were run unchanged. Saved graph positions and routes were regenerated using their own saved edges, not replaced with live audit counts.

Evidence-title check: **9 checked, 0 missing**. Contract and component fixture are byte-identical to both `57167e92` and `c85d8e05`; hashes are in `build5-v1-bytes.txt`.

## Wrong-first and mutation pairs

Assertions were never inverted. Every red command exited 1. The restored graph test command exits 0 with eight checks.

| Wrong CODE or old implementation | Red evidence | Restored evidence |
| --- | --- | --- |
| Build 4, without the new seal or direct depot connections | `build5-wrong-first.txt` | `build5-graph-tests.txt` |
| Seal present, old support placement and depot chain | `build5-long-spur-wrong.txt`: Desk spur is 11.7626, over nine; old depot-pair expectation also fails | `build5-graph-tests.txt` |
| Old -1.4 start after changing the top-slot pin | `build5-top-slot-wrong.txt` | `build5-graph-tests.txt` |
| CODE mutation: add four units to the computed depot/support fan radius, leaving the seal and assertions unchanged | `build5-mutation-long-spur.txt`: publication refuses the longer spur and R-3172 rejects the result | `build5-graph-tests.txt` |
| CODE mutation: add four units to each street-junction offset, leaving the one-unit seal and assertions unchanged | `build5-mutation-frontage.txt`: Compass frontage is 5.00048, over one | `build5-graph-tests.txt` |

The spur refusal belongs at the publisher boundary, not the reusable router. The router's existing dense-edge cases intentionally supply changed edges with previously settled nodes. Those are routing probes, not publication geometry. Moving the refusal to `buildGraph` preserved those probes without weakening the published maximum.

## Screenshots and own spec judgement

Final screenshot folder: **`/private/tmp/nana-world-graph-build5/round3/final/`**.

The six subfolders are `overview`, `drafting-table`, `review-ladder`, `notice-board`, `explore`, and `explore-workshop`. Each contains both widths, viewport and full-page frames, copied reference frames, spec, manifest and side-by-side HTML. URLs use `http://127.0.0.1:7355/` with `#overview`, `#drafting-table`, `#review-ladder`, `#notice-board`, `#explore`, and `#explore/workshop`.

Every capture used `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <external folder>`. The original reference folder was only read. Every final 380 frame shows **RENDERER: WEBGL**. No model session or subagent ran.

Round 1 tested the whole-viewport camera, fan placement, new forms and control bands. Round 2 faced the contract toward the camera, enlarged Compass inside its circular lot, and strengthened paving joints. Round 3 started the ellipse exactly at its top. During round 3's safety check, dark roads still projected behind bottom controls; the final band excludes them too. `round3/` retains those initial safety frames; only `round3/final/` is acceptance evidence. This safety correction did not add a fourth composition design.

This table is my own comparison with the frames, the reference and `judge-build4.md`, not an independent judge result. Line 7 concerns whole-loop frames. Line 8 concerns the three tour captures. Line 9 concerns only `#explore/workshop`.

| Spec line | Round 1 | Round 2 | Round 3 final |
| --- | --- | --- | --- |
| 1: scene is the page | PASS: centred world; outer streets and courts continue behind the rail and offscreen. | PASS | PASS: paving continues behind the phone header/card; the rail no longer owns an empty strip. Numbered stages remain outside it. |
| 2: detail, depth and light | FAIL: contract faces away and reads as black covers. | PASS: readable ruled folio, rings, checks, seal and lectern; library has cornices, stacks, individual pale book edges and a reading desk. | PASS: original shadows, grounded lots, stair review and notice-board detail retained. Still less dense than the reference city. |
| 3: restrained palette | PASS | PASS | PASS: white/grey forms with black accents, no saturated colours. |
| 4: typography | PASS | PASS | PASS: numbered mono labels and leaders, one clear card hierarchy; no measured label collisions or clipping. |
| 5: frosted reading | PASS | PASS | PASS: existing rail frost unchanged; one short card, scenery visibly blurred behind it. |
| 6: same phone object | PASS for models/labels; ground roads can darken bottom controls. | Same caveat | PASS after the safety correction: full-bleed paving, one scene/card, header/tabs and bottom controls clear of models, roads and label leaders. |
| 7: ordered loop and short spurs | FAIL: Compass still looks above the street's apex. Direct depot connections and shorter Lab spur improve placement. | FAIL: larger Compass helps but does not settle the visual relation. | FAIL, conservatively: top-first slots and the shared junction pass every frontage assertion, including 01, but Compass still reads above the apex in the overview. The depot no longer chains through Lab; every support/depot spur is at most nine, and both crossing counts remain zero. |
| 8: tour framing | PASS | PASS | PASS: Drafting table, Review ladder and Notice board are centred with matching numbers and entering streets. |
| 9: selected phone exploration | PASS | PASS | PASS: Workshop outlined, incident roads darker, name/Enter/Back to tour visible, whole loop retained. Unselected exploration is not judged against this line. |

No fourth design round ran. Visual line 7 remains open; the protected known-bug file was not changed.

## Gesture and browser results

`node scripts/hive-gesture-check.mjs --url http://127.0.0.1:7355/ --out /private/tmp/nana-world-graph-build5/gestures-final` exits 0:

**gesture checks: 4 passed, 0 failed**.

The checks use actual 380 px touch hit-testing: explore tap does not move or enter; tour tap does nothing; tour swipe scrolls without selecting; scroll and hash reach the same three chapter poses.

`build5-browser-checks.txt`: **12 WEBGL frames; 0 clipped labels; 0 label/overlay collisions; 0 labels in phone safe bands; 0 clipped cards**. The phone band follows actual DOM control bounds, not a new fixed-size tunable. Its current bounds are 157 to 929 px at the captured viewport. Label leaders are clipped to the same band as the render scissor. These are external browser measurements, not new suite cases.

## Commands and exits

All final commands below exit 0. Long outputs are committed as `build5-*.txt`; checkout prefixes in stack traces are replaced with `<repo>`.

- `node scripts/component-audit.mjs --out <external components.json>`: real audit data.
- `node scripts/component-graph.mjs --out <external graph.json>`: 23 overview streets; zero overview and loop crossings.
- `node scripts/hive-page.mjs --out <fresh external site> --data <components.json> --graph <graph.json>`: paired publication. Later rounds refreshed the served external app/graph bytes explicitly.
- `npm run first-look -- --page url --after <each URL> --hive --reference <reference folder> --spec <spec path> --out <external folder>`: all six final captures.
- `node packages/nana-pack/tests/hive-graph.test.mjs`: 8 checks.
- `node packages/nana-pack/tests/hive-assets.test.mjs`: 3 checks; unchanged test file.
- `node packages/nana-pack/tests/hive-page.test.mjs`: 10 checks; unchanged test file.
- `npm run -s req:tree`, `npm run -s map`: generated artifacts.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs`, `node scripts/known-bugs.mjs --root .`, `node scripts/identity-scan.mjs`: final seat checks.
- Evidence titles: **9 checked, 0 missing**.
- `node scripts/lane-class.mjs --root . --files <changed code paths>`: ordinary.
- `npm run test:locked`: foreground, unfiltered, one default machine-wide lock, with heartbeat and failure watcher.

Suite summary: **241 files: 239 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8747 pass, 0 fail, 44 skip · 585.3s**.

The worker runs the seat checks again on the committed tip, pushes it and reads the finished CI run. The response supplies that result; this pre-commit record does not presume it.

## Precedent and departures

All four named Precedent files and `judge-build4.md` were read before design.

- `apps/hive/camera.mjs`: retained its projected-corner fitting; removed only the post-fit horizontal shift. Reason: fit the whole viewport, not an imagined rail-free area. No frosting change was used to solve framing.
- `scripts/component-graph.mjs`: kept the existing shared counting/parser imports and layout/router delegation. Added a publisher refusal for overlong spurs. Its layout/config modules now settle the stage's supports and depot together, using a compact fan with a bounded-annulus fallback instead of the old reserved wide spokes and chained yard. Reason: each building must connect directly to a numbered stage by a short road. Top-first slots replace the slight angular start to improve 01's frontage; the ellipse and equal-arc method remain.
- `apps/hive/assets/hive.mjs`: retained the architectural builders and shared imported beam/fence/ribbon helpers. Replaced contract slabs with a bound folio and the dense black library grid with an open archive pavilion. The library footprint is unchanged. Compass has a larger circular instrument/plinth to approach its street. Added unlabelled outer loading courts/streets as scenery, not components or counted relationships. Reason: finish forms and continue the world beyond the loop without inventing audit data.
- `apps/hive/index.html`: retained the existing phone layout/card/control positions and desktop frost. Added a CSS switch and leader clipping for a DOM-measured clear band. The existing `labels.mjs` now exports `safeBands`; `main.mjs` imports it and uses a paving-only background pass plus a scissored scene pass. Reason: keep phone models, dark streets and labels out of the controls while paving remains full-bleed. This renderer-side restriction is the necessary departure from a CSS-only band.

No existing private helper was copied or moved. Existing shared helpers were imported. The extra renderer pass follows the same explicit THREE scene and materials; no second scene implementation was introduced.

## Known-bug context touched

- Contract/fixture hash limitation: unchanged; explicit byte comparison remains the evidence.
- Phone WebGL fallback: all final six phone captures measured WebGL. Fallback selection/readiness logic is unchanged, so no universal closure is claimed.
- Rail/card/label clipping: world framing, scenery and safe bands changed. Final measured labels/cards do not clip or collide. Visual 01 placement remains open above.
- R-3104 Windows timeout: no audit activity code changed. If it fails on this tip's CI, the worker retries that failed job once and reports the result.

No other listed known bug was fixed or edited.

## Not done

Visual line 7 is not accepted. In particular, the frontage test's footprint guarantee is stronger mechanically but still does not prove that Compass looks integrated into the apex. No independent visual judge was launched, as required. No issue or comment was created. No fourth design round ran.

`nana-writing --report` runs on this technical record and the final response. Advisory findings about identifiers, paths, sentence length or the required verdict heading remain under the writing rule's explicit builder-report exception.
