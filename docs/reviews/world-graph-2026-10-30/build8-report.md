VERDICT: PARTIAL

## Result and spend

This revision serves the shared-toolkit experience: a readable product story instead of the rejected component graph. The city implementation and automated gates pass. I do not accept its reference-art quality: the whole-city phone view is too small, and its window states are not readable enough. No model session or subagent was started.

One build commit is intended after the green locked run. The final worker response records its hash, push and finished CI result; this pre-push record does not claim CI success.

## Files and rows

- City source/checker: `apps/hive/city.json`, `city.mjs`, `layout.mjs`, `runtime.mjs`, `config.mjs`. R-3171 and R-3172 replace graph validation and ellipse settlement with declared places, drift reporting, footprint-sized radial bands, obstacle routing and four shape controls. The frozen fixture has 19 missing placements, derived by comparing its IDs with the plan.
- Rendering: `assets/parts.mjs`, `district.mjs`, `residents.mjs`, `hive.mjs`, `materials.mjs`, `road.mjs`. R-3173 and R-3177 cover physical streets, frontage, crossings, full dark forms and status windows. R-3122 now describes resident and worker figures instead of flying activity bees. The court, records and style wings share a compound plinth; future feedback has a road form.
- Story and modes: `tour.mjs`, `camera.mjs`, `main.mjs`, `text-layer.mjs`, `pixel.mjs`. R-3174 follows the request and anchored visits. R-3175 keeps the original gesture test body unchanged. The phone picker and rail have identical labels/order, without a duplicate overview option.
- Publication: `scripts/hive-page.mjs`, `.github/workflows/pages.yml`, `scripts/component-audit.mjs`, `scripts/deliverables.mjs`. R-3127, R-3130, R-3131 and R-3139 lose graph-specific rules. Layout overrides are serve-only. Audit and deliverable graph-only exports/fields are restored to their main baseline.
- Retirement: R-3170 and R-3176 are retired. R-3120 remains retired; its replacement citation now points to the city test. R-3171–R-3174 are rewritten; R-3175 changes evidence path only; R-3177 is the only new row.
- Unchanged row text with affected tests: R-3126 (journey/picker), R-3134 (new sealed city values), R-3156 (named removal of the hive-to-bee import). All other row text remains unchanged.
- Consumer documentation: `apps/hive/README.md`, generated `docs/code-map.md` and `docs/requirements-tree.md`. README explicitly leaves visual acceptance open.

Deleted as the plan requires: `scripts/component-graph.mjs`, `component-graph-config.mjs`, `component-graph-layout.mjs`; `apps/hive/graph.mjs`, `roads.mjs`; `docs/components/graph-contract.json`, `graph-fixture.json`, `loop.json`; `packages/nana-pack/tests/fixtures/hive-graph-base.json`; `packages/nana-pack/tests/hive-graph.test.mjs`.

The v1 component contract and fixture are byte-identical to `d797a9f1`. No HANDOFF, known-bug file or session archive was edited.

## Every changed/deleted test

New `hive-city.test.mjs` contains the five replacement must-meet cases R-3171, R-3172, R-3173, R-3174 and R-3177, plus the unchanged R-3175 case moved from the deleted graph file. Its fixtures stay in OS temporary folders. `fixtures/hive-city-controls.json` carries historical grid/oval positions and the two new park controls.

Existing changes, only for the changed behavior or new sealed pins:

| File | Cases | Reason |
|---|---|---|
| `hive-page.test.mjs` | R-3122 | Assert nine resident kinds, places, low-poly budget, lit-bay crews and capped worker counts. |
| same | R-3126 / R-3174 | City chapter order, library-theater name, card count, pixel disclaimer and matching picker. |
| same | R-3127 | Refuse malformed city rather than graph contracts. |
| same | R-3130 | Exact copied app plus components; no graph flag/document. |
| same | R-3139 | Preserve atomic component refusal without the deleted graph input. |
| `hive-assets.test.mjs` | R-3134 | Pin new city, street, light, vocabulary, framing and footprint configuration. |
| `pages-workflow.test.mjs` | R-3131, R-3139 | Remove deleted graph production/scanning from the expected workflow. |
| `code-map-launch.test.mjs` | R-3156 | Name the intentional lost hive-to-bee edge; residents replace bees. The first full run caught this omission. |

Deleted graph-file cases: R-3170 `graph counts recorded sources in their own units through shared parsers`; R-3171 `loop drift and incompatible graph pairs refuse before output without changing v1`; both R-3172 cases (`published loop geometry matches goldens and sealed bounds clearance and attachments`, `every stage fronts its continuous loop within the sealed one unit`); R-3173 `typed roads avoid third footprints and meet the base crossing caps`; R-3174 `numbered tour anchors frame structures and walk roads at every viewport`; R-3176 `publisher ships paired graphs and Pages derives and scans them in order`. R-3175 is relocated, not removed. No other test case is deleted.

## Red runs and mutation pairs

Initial red logs are `build8-wrong-city.txt`, `build8-wrong-page.txt` and `build8-wrong-assets.txt`. Important process departure: several initial reds were missing-module failures, not substantive wrong implementations. Later mutations provide the substantive proof, but do not repair that chronology.

| Row | Broken code | Mutant exit → restored exit | Log suffix |
|---|---|---|---|
| R-3171 | Bypass duplicate-plan refusal | 1 → 0 | `mutation-plan` |
| R-3172 | Move the yard off the origin | 1 → 0 | `mutation-origin` |
| R-3173 | Make street surfaces dark | 1 → 0 | `mutation-pale` |
| R-3174 | Move a visit camera target | 1 → 0 | `mutation-visit` |
| R-3177 | Light every window | 1 → 0 | `mutation-lights` |
| R-3122 | Drop residents | 1 → 0 | `mutation-residents` |

Each log is `build8-<suffix>.txt`; assertions were never inverted. Additional red pins cover street depth offset, plan vocabulary, ground-probe offset, town growth and duplicate picker entries. Final city/page/assets runs pass. All async suite cases are awaited under per-case limits; no suite test imports or runs the gesture seat check.

## Visual evidence

Outside-git root: `/tmp/world-graph-build8/`.

- Round 1: `overview/`, `workshop/`.
- Round 2: `round2/{overview,signal,workshop,identity-scan,explore,explore-workshop}/`.
- Final third round: `final/{overview,signal,workshop,identity-scan,explore,explore-workshop}/`.
- Near misses: `final/near-grid/`, `final/near-ring/`.
- Each capture has `page-380.png` and `page-1280.png`, with the supplied reference and art spec. All eight final phone pages report WEBGL; `build8-browser.txt` records the check and a workshop resize preserving its chapter.
- Capture commands use `scripts/first-look.mjs --page url --after <served hash> --hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <outside-git folder>`; all exit 0. The reference folder was only read.

Own judgement, after three rounds; these are not model-judge verdicts:

| Spec line | Verdict | Frame evidence |
|---|---|---|
| 1, full viewport | PASS | Overview fills the page; no central inset canvas. |
| 2, detailed architecture | FAIL | Close views show complete forms, but the overview reduces them to tiny repeated plinths. It does not meet the reference's readable massing. |
| 3, restrained palette | PASS | Grey ground, pale buildings/roads, dark fine detail. |
| 4, typography | PASS | Mono small-caps labels and clear card headings; numbered rail and matching picker, not raw identifiers. |
| 5, one frosted card | PASS | Right on desktop, bottom on phone; measured active-footprint overlap is zero across the full phone scroll. |
| 6, phone composition | PASS | The same overlaid scene and one card remain at 380 px, not a column of data cards. |
| 7a, city relationships | PASS | South tower, fenced park, northern gate/customs/freight and customer towns beyond. |
| 7b, park shape | PASS | Real halls occupy varied radial bands. Grid-park and ring-park controls both FAIL this line visibly. The historical oval also fails district separation. |
| 8, scroll and explore | PASS | Journey steps and visits; exploration selects without entering. Enter alone moves inside. |
| 9, phone explore | PASS | The selection frame keeps the whole city, outlines the workshop and darkens its street; its card has Enter and Back to tour. |
| 10, lights and people | FAIL | Figures and complete dark forms exist, but the phone frames do not clearly show lit and dark window states together. |

Final gesture result: **6 passed, 0 failed**. The preserved four checks pass, full scroll reaches every chapter in order, and all measured card-overlap fractions are `0.0000`. Street/ground luminance pairs are `0.6990/0.5828`, `0.6182/0.5828`, `0.6609/0.5828`, `0.6990/0.5828`, `0.6609/0.5828`. Depth bias fixes distant z-fighting; a sealed three-world-unit ground offset avoids sampling the same antialiased road fringe. Sampling uses floored pixel coordinates.

## Precedent and moves

- Authorized moves: `box`, `drum`, `hoop` from hive's closure to named exports in `assets/parts.mjs`; explicit THREE, materials and geometry replace captured state. Both hive and district import them.
- Additional authorized private-helper move: `pathBetween` from tour's closure to `city.mjs`; explicit model replaces captured state. Tour and declared handoffs share it, avoiding a second BFS implementation.
- Deleted graph-layout arithmetic, `roundPosition` (now `round`), `segmentDistance`, `crossings` and private `route` move/adapt into the city checker rather than leaving another geometry engine. City-plan validation follows the old loop validator's plain-error/refuse-before-output pattern, with a new schema.
- Routing departure: the plan excludes the old octagon router. The city instead adapts its visibility-graph approach over sealed twelve-sided clearance samples, because straight radial spurs can hit neighbouring lots. The old engine is deleted; tests import the moved distance helper instead of copying it.
- `camera.mjs` keeps framing and Enter-only behavior; overview elevation is sealed. `layout.mjs` retains slot/footprint arithmetic and delegates settlement to the city.
- `assets/road.mjs` keeps the ribbon kit, changing hierarchy, pale material, kerbs and back-road dashes. `materials.mjs` adds status windows without replacing legacy status/cell materials.
- `assets/bee.mjs` is unchanged. Residents follow its explicit THREE/materials pattern with standing low-poly geometry, rather than using a winged flying bee as a person. No private helper is copied.
- `scripts/hive-page.mjs` keeps atomic staging and loopback containment, adding serve-only override staging. `hive-gesture-check.mjs` keeps the four gesture cases and adds the specified full-scroll and pixel probes.
- Deliberate control-check departure: the historical oval has several radii around the new yard, so a radius-count-only rule cannot truthfully reject it. The same city shape checker rejects its town intrusion into the park as well. New ring controls include future park bays when applying the 23 audited IDs.
- Pixel mode omits streets and says so; it keeps cells and the fence. Theater animation and detailed neighbouring towns move to later work under the plan's Order section. Old graph-only NAVIGATION fields remain unread to preserve the unchanged gesture contract.

## Gates and exit codes

All long outputs are committed as `build8-*.txt`; home prefixes are redacted without changing assertions, counts or exits.

| Command | Exit |
|---|---:|
| `node packages/nana-pack/tests/hive-city.test.mjs` | 0 |
| `node packages/nana-pack/tests/hive-page.test.mjs` | 0 |
| `node packages/nana-pack/tests/hive-assets.test.mjs` | 0 |
| `node packages/nana-pack/tests/pages-workflow.test.mjs` | 0 |
| `node packages/nana-pack/tests/code-map-launch.test.mjs` | 0 |
| `npm run map:check` | 0 |
| `npm run readme:check` | 0 |
| `node scripts/requirements-trace.mjs` | 0 |
| `node scripts/requirements-tree.mjs --check` | 0 |
| `node scripts/known-bugs.mjs --root .` | 0 |
| `node scripts/identity-scan.mjs` | 0 |
| Evidence-title check of implemented affected rows | 0, 0 missing |
| `node scripts/hive-gesture-check.mjs --url http://127.0.0.1:62444/ --out /tmp/world-graph-build8/final/gestures` | 0 |
| `git diff --exit-code d797a9f1 -- docs/components/contract.json docs/components/fixture.json` | 0 |
| `npm run test:locked`, foreground, machine-wide lock | 0 |

The writing check exits 0 with style advisories. They remain because this is a technical worker record, which the owner-facing rule excludes. The brief requires the VERDICT line, file paths, row IDs and verbatim test titles.

Suite summary: **241 files: 239 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8745 pass, 0 fail, 44 skip · 594.7s**.

The first locked run failed only the missing named map-edge loss (8744 pass, 1 fail); the second full run is green. An attempted `npm run req:trace` failed because that script does not exist; the direct command above passes. The first custom title checker wrongly required a live marker on retired R-3120; implemented-row checking is green, without changing a test or requirement to hide it.

## Known-bug contact and remaining work

The old CABINET/rail clipping area is replaced by the new city labels and active-only label policy; no general clipping fix is claimed. The pixel-fallback readiness risk remains: this build checks all final phone captures separately rather than changing first-look's readiness contract. Folder-part activity semantics and historical-fixture full-history dependence remain unchanged. No other supplied known bug is fixed.

Not done: reference-art acceptance (lines 2 and 10), a substantive wrong-implementation-first red for every initial case, independent final review, theater animation and detailed neighbouring towns. The last two are the plan's allowed deferrals. CI and exact-tip seat-check results are reported in the final worker response after push. No GitHub issue was created, edited, commented on or closed.
