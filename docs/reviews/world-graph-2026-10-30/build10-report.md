# Build 10 — continuous tour, trays and role workers

VERDICT: PARTIAL

The implementation and local gates pass. Visual acceptance is incomplete: spec line 10 fails at whole-city scale. The entrance windows are too small there to distinguish lit and dark buildings reliably. No fourth art round was attempted.

## Scope and rows

Feature: FEAT-039. Lane class: ordinary. Starting tip: 44588f4c (the brief commit on top of 40ed75c8).

No new requirement IDs were allocated. Amended rows remain `implemented` with backticked `file::title` evidence:

- R-3174: monotonic page-driven stage, eight travel-weighted screen heights, last-15-percent card cross-fade, two-second idle pose hold, native smooth rail/picker scrolling.
- R-3173: shaded outlined tray geometry, raised ring and piers, lane traffic, gatehouses, painted names, no ground dashes.
- R-3122: role-equipped jointed figures, three builders per lit bay, fixed reduced/still poses, no figures at dark future lots. Audit activity stays in the data, rather than creating duplicate idle figures.
- R-3134: changed street values and new density-fade thresholds; added the exact outline pin citation.

Files: `apps/hive/main.mjs`, `tour.mjs`, `config.mjs`, `index.html`, `README.md`; `assets/{parts,road,residents,hive,district,materials}.mjs`; `scripts/hive-gesture-check.mjs`; the three hive test modules; `REQUIREMENTS.md`; generated `docs/code-map.md`; the art spec and this build's records.

## Tests changed

Only the following existing cases changed because the old assertions or behavior became false:

| File | Exact title | Change |
| --- | --- | --- |
| `hive-city.test.mjs` | R-3173: scene streets match pale narrow connected frontage and the single outbound gate | Solid back trays replace ground dashes; shaded shadow-casting decks, outlines and piers are required. Existing topology/frontage checks remain. |
| `hive-city.test.mjs` | R-3174: scroll position maps to continuous stage without short-input dead zones | Added travel-weighted spans, exact starts, monotonic traversal and final-span cross-fade checks. Existing numeric mapping and orbit-blend checks remain. |
| `hive-city.test.mjs` | R-3174: continuous scroll holds pose for two seconds and seals span and fade values | Replaces the obsolete idle/flight config pin. Pins eight screens, 15 percent, 2000 ms and travel floor; executes the actual frame body with an injected clock at 100 and 2100 ms. |
| `hive-page.test.mjs` | R-3122: residents inhabit their places and activity gives capped worker figures | Preserves audit cap checks; pins new kit values and budget, role equipment/joints, three builders, customs, absent-lot exclusion, and frozen versus live transforms. Duplicate activity figures are no longer expected. |
| `hive-assets.test.mjs` | R-3134: visual and serving defaults retain their sealed values and provenance | Pins revised tray dimensions and ring values. |

The only new case is the sealed-value pin `hive-assets.test.mjs::R-3134: outline density fade retains chosen pixel thresholds`.

The async harnesses still await every case under their existing per-case timeout. Fixtures stay in OS temporary directories. No suite test runs, imports or copies the gesture/capture scripts. No new line-oriented parser was added.

## Wrong-code and mutation pairs

Logs are consolidated in `build10-checks.log`.

| Broken code | Red command / exit | Restored command / exit |
| --- | --- | --- |
| Original basic strips and dashed back roads | hive-city / 1, R-3173 red | hive-city / 0 |
| Original equal spans, missing span/fade API | hive-city / 1, R-3174 red | hive-city / 0 |
| Original idle/flight configuration | hive-city / 1, amended clock case red | hive-city / 0 |
| Original generic residents and old kit budget | hive-page / 1, R-3122 red | hive-page / 0 |
| Original street defaults; old width cap | hive-assets / 1 for both pin runs | hive-assets / 0 |
| Missing sealed outline configuration | hive-assets / 1, new pin red | hive-assets / 0 |
| Explicit code mutation: snap `desired` to rounded stage after 400 ms inside the real draw body | hive-city / 1, two-second hold case red | hive-city / 0 |

Assertions were not inverted for mutation proof.

## Captures and frames

All images stay outside git. No reference folder was written.

- Partial round 1: `/tmp/world-graph-build10-round1` (05 and 13).
- Full round 2: `/tmp/world-graph-build10-round2`.
- Final full round 3: `/tmp/world-graph-build10-round3`.
- Final gestures: `/tmp/world-graph-build10-gestures-final`.
- Frame strips and selected Explore: `/tmp/world-graph-build10-frames`.

Rounds 2 and 3 each capture 00, 02, 03, 05, 06, 07, 08, 13 and Explore at 380 and 1280 px, using real audit data and first-look's `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <external folder>`. Every capture command exited 0. Browser checks observed WebGL, not the pixel fallback.

The final folder has eight continuous-scroll images per width across 02 to 06. A 12-second browser scroll was captured through CDP screencasting, then sampled at eight increasing positions, including exact stages 2 and 6. There were 50 source frames at 380 and 45 at 1280. Four mid-chapter stop images per width were requested at 0.5-second intervals; camera pose and stage are identical. Screenshots take additional time, so these are minimum intervals rather than an exact camera sampling clock. `poses.json` records each pose. The four `*-strip-*.png` files are contact strips.

An initial screenshot-driven continuous strip reached its end too early because captures took time. It was replaced by the real continuous screencast, not counted as an accepted strip. A local Pillow contact-strip attempt exited 1 because Pillow is absent; browser Canvas produced the strips with exit 0. No packages were installed.

## Own art judgement

Round 1 was partial; a dash means not judged in that round. Round 2 exposed worker occlusion by detached window panels. Round 3 moved those windows onto solid entrance panels, widened the tower's worker deck and grounded reviewers on the step geometry. Line 7a's old flat-strip wording was amended to the owner's newer tray requirement before final captures.

| Spec line | Round 1 | Round 2 | Round 3 | Final observation |
| --- | --- | --- | --- | --- |
| 1 full-viewport scene | PASS | PASS | PASS | Edge-to-edge stage at both widths. |
| 2 legible depth and models | FAIL | FAIL | PASS | Shaded trays, piers and outlined solid figures; detached audit panels no longer cover workers. |
| 3 restrained palette | PASS | PASS | PASS | White, grey and ink only. |
| 4 typography | PASS | PASS | PASS | Monospace rail, numbered label and short headline. |
| 5 one readable frosted card | PASS | PASS | PASS | One card at anchors; two opacity-weighted cards only within the required cross-fade. |
| 6 same object at 380 | PASS | PASS | PASS | Fixed scene, picker and bottom card, not a stacked document. |
| 7a park, tower, outbound street and trays | PASS | PASS | PASS | Open central tower, fence, ring viaduct and northbound shipping street. |
| 7b non-grid park arrangement | PASS | PASS | PASS | Park halls occupy different bearings and distances. Housing infill remains intentionally repeated. |
| 8 centred journey, matching label/card, inbound street | — | PASS | PASS | Named place and numbered current label agree; the gesture walk reaches every chapter. |
| 9 selected phone Explore | — | PASS | PASS | Additional selected-Explore frames show outline, dark incident streets and Enter/Back to tour at whole-city scale. Default Explore is deliberately unselected. |
| 10 lights and people | FAIL | FAIL | FAIL | Workers are visible at working places, but lit/dark entrance windows remain too small in the whole-city frames. |

Final judgement: 10 spec lines pass, 1 fails. No model sessions or subagents were started.

## Gesture result

`node scripts/hive-gesture-check.mjs --url <preview> --out <external folder>`: exit 0, **11 passed, 0 failed**.

- Sixty 100 px wheel ticks: nondecreasing stage; stop at S=12.249436513899324. Pose at 0.1 and 2 seconds is identical: target `[-72.907,4.65,36.889]`, eye `[-72.907,102.749,175.316]`.
- Five short touch swipes: each changes camera. Stop at S=0.09168704156479217. Pose at 0.1 and 2 seconds is identical: target `[-2.084,5.484,-50.107]`, eye `[-2.084,702.896,834.481]`.
- Native picker scrolling, anchor equivalence, full chapter order, card overlap and five street/ground pixel pairs pass.

## Precedent adherence and departures

All ten named precedent files and the read-only deep study were read before design. Shared primitives are imported from `parts.mjs`; the camera's `blendPose` is reused through `tourPose` and `camera.mjs` is unchanged. No private helper was copied or moved.

- `main.mjs`: removed both idle settling and the timed opening descent. A timed opening would violate the new rule that the page alone controls camera movement. Native smooth page scrolling replaces the prior separate camera flight.
- `tour.mjs`: retained the chapter/keyframe and orbit-blend pattern, adding travel-weighted span helpers. Its numeric mapping signature remains compatible for the existing pure callers/tests.
- `road.mjs`: retained `ribbon`, `beam` and shared materials, replacing basic ground strips with decks, kerbs, piers, approaches and traffic. Back routes are solid because the new brief forbids ground dashes.
- `parts.mjs`: added shared outline and DOM-independent bitmap tray-paint helpers; existing primitives remain the only box/drum/beam implementation.
- `district.mjs`: added the shared outlines, an extended reception deck and entrance-mounted audit windows. The former detached panels obstructed workers. This leaves the explicitly reported whole-city window legibility miss.
- `residents.mjs`: replaced the generic miniature with a shared joint hierarchy and role equipment, plus workstations and deterministic loops. Audit activity still counts in the data but no longer generates unrelated duplicate bodies.
- `materials.mjs`: retained the monochrome palette, replacing the unlit street material with shaded model material.
- `hive-gesture-check.mjs`: extended the real browser check from nine to eleven checks. A long swipe now must advance fractional stage, not necessarily cross a chapter, because travel-weighted spans have different lengths.

## Known-bug context touched

The current-chapter-only floating-label rule changes the surface involved in the existing CABINET/RELEASE ROUTE label-clipping note. No claim is made that the old note's complete scenario is closed. The existing pixel-fallback readiness limit is not fixed. The R-3104 Windows timeout is not changed; retry its failed CI job once only if it occurs. No known-bug files, HANDOFF or session archives were edited.

## Commands and gates

`build10-checks.log` holds long targeted, mutation, gesture and gate output. `build10-full-suite.log` holds the foreground locked suite. Local paths in logs are normalized to `$WORKTREE` and `$HOME`.

- `node packages/nana-pack/tests/hive-city.test.mjs`: exit 0, 9 checks.
- `node packages/nana-pack/tests/hive-page.test.mjs`: exit 0, 10 checks.
- `node packages/nana-pack/tests/hive-assets.test.mjs`: exit 0, 4 checks.
- `npm run map`: exit 0; generated map committed.
- `npm run map:check`: exit 0.
- `npm run readme:check`: exit 0.
- `node scripts/requirements-trace.mjs`: exit 0; 1964 implemented rows traced; no EARS errors.
- `node scripts/requirements-tree.mjs --check`: exit 0; 0 problems, 2218 rows, 39 features.
- `node scripts/known-bugs.mjs --root .`: exit 0.
- `node scripts/identity-scan.mjs`: exit 0.
- `npm run test:locked`: exit 0, one machine lock, foreground wrapper with launch/error handling and 30-second heartbeat.

**242 files: 240 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8754 pass, 0 fail, 44 skip · 598.9s**

## Not done / open questions

Visual line 10 is not accepted. The smaller entrance windows avoid worker occlusion but lose whole-city legibility. A further art change needs another brief/round budget. The reference's fine rendering is a quality bar, not a claim of visual equivalence. No new model review was run, as prohibited. CI and exact-tip gate results belong in the final builder report after the commit is pushed; this file predates that commit.
