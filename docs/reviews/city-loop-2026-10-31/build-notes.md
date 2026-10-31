# city-loop — build 1 technical record

## Scope and choices

Built the plan's show-only loop. No worker, land, hook, knowledge-index or template behaviour changed.

- O1: archive is a park lot at bearing 345; ledger is a town lot at 306; watchtower is a town lot at 15. The watchtower therefore never enters the freight chain.
- O2: static filing racks, a desk ledger and a braced observation cabin use id-keyed branches and the existing parts kit.
- O3: part places use the small standard footprint, not their parent's feature count.
- O4: return width is 0.3 lane widths. Built/unbuilt offsets are -0.2/+0.2 lane widths in canonical segment orientation. Active listed roads have opacity 1; others 0.25. The gate connector follows the existing gate-to-ladder street in reverse.
- O5: chapter text follows the plan's drafts; fourteen chapters remain.
- O6: part cards name the parent and its light, using “dark” instead of “absent”. From the work names unbuilt returns.

## Requirements and tests

Changed rows: R-3171, R-3173, R-3174, R-3177; added only R-3187. All five rows carry implemented status and backticked file::title evidence in REQUIREMENTS.md.

Changed existing tests, all in `packages/nana-pack/tests/hive-city.test.mjs` unless named otherwise:

1. `R-3171: one city plan names drift both ways and refuses malformed sources before output`: adds the three named malformed-field cases.
2. `R-3173: scene streets match pale narrow connected frontage and the single outbound gate`: running ribbons, width and material, solid/broken pieces, paths, offsets, unchanged avenue segments and tunable pins.
3. `R-3174: request journey frames fourteen narrated chapters`: bounds for visits and both flow ends, at 1280 and 390, above the card; batched ribbon emphasis; narration limits and pins.
4. `R-3174: scroll position maps to continuous stage without short-input dead zones`: replaces the old assertion of more than three distinct travel-span lengths. Wider endpoint framing saturates the existing cap; library and closing can share a pose. The test now checks the actual sealed travel-allowance formula for every span.
5. `R-3177: window lights follow audit status and dark target forms stay complete`: parent lights, archive cap, dark fixture forms, part voices, unbuilt flow lines and two-sentence legends.
6. `R-3122: sheet runner bay carriers and outbound truck travel between places after batching`: the second packet, gate/drafting endpoints, declared built legs and real movement after batching; also tagged R-3173. The walk compares planar street segments because the drawing elevates the packet onto the tray surface.
7. `packages/nana-pack/tests/hive-assets.test.mjs::R-3134: visual and serving defaults retain their sealed values and provenance`: adds the three authorized forms to the vocabulary pin.

Only new test: `R-3187: every claimed flow matches one working code line and no text revives a retired claim`. Its table is test-owned; its evidence deletion mutations run in memory, never against this repository. Every evidence entry is also checked with CRLF, trailing space/tab and no final newline.

Wrong-code pairs: `wrong-before.txt` records all five acceptance checks and the packet check failing against the unchanged implementation. `wrong-vocabulary.txt` records the vocabulary pin failing before the forms were added. Green outputs are `city-tests.txt`, `page-tests.txt` and `asset-tests.txt`. R-3187 additionally deletes each matched evidence line and requires the resulting diagnostic to name that road.

## Precedent and departures

Followed every named production precedent. The sole private-helper move is the authorized inline request lane mapping to module-level `laneOffset` in `assets/hive.mjs`. No helper was copied from another module or moved elsewhere.

Additional touched files justified by the implementation:

- `assets/parts.mjs`: preserves a return group's own material through the existing second, city-wide batching pass. The first pass still batches its static pieces, so chapter opacity changes neither rebuild geometry nor add per-piece draw calls.
- `main.mjs`: calls the exported ribbon-emphasis function only when selection/chapter changes. Existing distance markers now include request/return packets, and existing labels include chapter visits. These are necessary browser callers, not a new rendering architecture.
- `hive-assets.test.mjs`: the existing vocabulary pin becomes false when the plan-authorized forms are added.

Capture-driver departure: first-look seals 380 px and forces reduced motion. A temporary caller used its existing browser injection seam to request 390 px, retain running animation, refuse pixel fallback and capture viewport frames without the full-page resize. The existing first-look implementation and its tests were not changed. Every capture passed the requested --hive, --reference, --spec and external --out arguments. Output manifests and HTML were corrected to say 390, not 380. No model session was started.

## Visual record

Real audit: generated by `node scripts/component-audit.mjs --out /tmp/city-loop-audit.json` (exit 0). The serve command used that file, not the fixture.

Frame root: `/tmp/city-loop-frames/`. Fourteen chapter folders: overview, signal, compass, drafting-table, queue, workshop, eyes, review-ladder, land-gate, identity-scan, release-route, customers, library, closing. Each contains `page-1280.png`, `page-390.png`, the supplied spec, copied references and a manifest. The protected reference folders were only read.

Visits: `visit-ledger`, `visit-archive`, `visit-watchtower`, `visit-key-cabinet`; phone exploration: `explore-workshop`.

Return packet: `return-strip/strip.png`, four source frames and `frames.json`, sampled from the actual animation at phases 0.8, 1.3, 1.8 and 2.3 seconds. The temporary driver fixed only the animation clock, not geometry, packet positions or the path. Raw telemetry is also kept in `return-strip.txt`. The strip circles the live camera's projection of the actual packet position; the four `raw-*.png` files retain the unannotated frames.

### Builder spec judgement

| Spec line | Verdict | Evidence / limit |
|---|---|---|
| 1 | PASS | All chapter frames keep the full-viewport scene behind the overlay. |
| 2 | PASS | Close visits show filing boxes, the ledger and braced cabin, with depth and cast shadows. |
| 3 | PASS | White/grey kit, ink outlines and monochrome return materials. |
| 4 | PASS | Numbered small-caps labels and plain short cards; no new path dump. |
| 5 | PASS | One readable card; the gesture check samples every chapter and 31 boundary positions. |
| 6 | PASS at 390 | Same scene, picker and single card on the requested phone width; 380 was not the requested measurement. |
| 7a | PASS | Closing frames retain central tower, fence, raised ring, north gate and customer route. |
| 7b | PASS | Radial clearance and non-grid controls pass; new lots preserve the housing floor. |
| 8 | FAIL for return-heavy chapters | Both road ends fit, but a wide road chapter cannot also keep its one main place near the centre. Visits are labelled; the place/step label still matches its card. |
| 9 | PASS | `explore-workshop/page-390.png`: whole city, outlined selected bay, darker incident streets, Enter and Back to tour. |
| 10 | FAIL at whole-city phone scale | Complete dark and lit forms remain, and framed workers animate, but a phone whole-city still does not clearly separate individual window lights or the moving return packet by eye. |

The unit checks prove the visible ribbon geometry and the moving return packet exist. They do not turn the two failed visual judgements into passes.

## Gesture and scroll

Before: `gesture-before.txt`, exit 0, **gesture checks: 26 passed, 0 failed**.
After: `gesture-after.txt`, exit 0, **gesture checks: 26 passed, 0 failed**.

| Width / input | Before p95 ms | After p95 ms | After max relative step | Reversals / stage reversals |
|---|---:|---:|---:|---|
| 1280 / ticks | 10.0 | 10.0 | 0.0272 | 0 / 0 |
| 1280 / smooth | 10.1 | 10.0 | 0.0951 | 0 / 0 |
| 390 / ticks | 10.3 | 16.9 | 0.0527 | 0 / 0 |
| 390 / smooth | 9.9 | 10.3 | 0.0866 | 0 / 0 |

Metal renderer, all p95 values below 20 ms, no long task, exact settling, no idle drift, no scroll-time geometry/buffer/shadow rebuild. An intermediate after run failed the street-pixel sample after overview was unnecessarily shrunk. Keeping the original no-flow overview/closing fit restored all five pixel checks; the final run above is green.

## Commands and exits

- `npm run test:locked`: first exit 1 (only five stale generated-outline assertions); regenerated `docs/requirements-tree.md` with `npm run req:tree`, exit 0; final foreground locked run exit 0.
- Final suite: **242 files: 240 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8764 pass, 0 fail, 44 skip · 609.7s**. Full output: `full-suite.txt`; the earlier stale-outline run: `full-suite-before-outline.txt`.
- `node packages/nana-pack/tests/hive-city.test.mjs`: exit 0, 18 checks.
- `node packages/nana-pack/tests/hive-page.test.mjs`: exit 0, 10 checks; unchanged test source.
- `node packages/nana-pack/tests/hive-assets.test.mjs`: exit 0, 5 checks.
- `npm run map`, `npm run map:check`, `npm run readme:check`: exit 0 each.
- `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .`, `node scripts/identity-scan.mjs`: exit 0 each.
- `node packages/nana-pack/bin/nana-writing.mjs HANDOFF.md`: exit 0; file unchanged.
- First-look chapter/visit/explore calls and return strip: exit 0 each; gesture before and after: exit 0 each.

## Notes step — seat carries, not edits to protected files

The builder was explicitly forbidden to edit HANDOFF.md, docs/known-bugs/ or session archives. Those files remain untouched. The following lines are written here for the seat's permitted notes step, not silently claimed as completed edits:

- City page (world-graph, final review): R-3171 requires checkCityPlan(plan, live audit) to return nothing, so a later lane that adds a component to the audit turns it red until city.json gets a lot; the drift signal reaches lanes that never touch the hive.
- City page (world-graph, final review): the published page fetches layout-override.json on every load; Pages answers 404, which the code handles, but it leaves a console error.
- City page (world-graph, final review): city.json ships hand-written chapter text that the Pages identity scan does not cover (extends the components.json-only scan bug).
- City page (world-graph, final review): the comment at apps/hive/city.mjs:40 names a file that no longer exists.
- City page (city-loop, plan): the flow evidence check matches one working line by regex; it cannot prove the line runs.

Known bugs touched: only the brief-named false library-to-builder, review-to-library and automatic customer-feedback claims, including their old drawn trays and README text. The four carried world-graph bugs above are not fixed.

Not done here: edits to protected notes, a reviewer/model session, review-ledger keep or a land. No GitHub issue was created, edited, commented on or closed. The visual failures above remain open for the seat, not a findings-closure list.
