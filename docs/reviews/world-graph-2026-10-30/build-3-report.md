VERDICT: PARTIAL

The streets, depot, overlay and exploration changes are built and tested. Visual line 2 still fails my self-check after three rounds. The seat's judge and the owner's next shape decision remain outstanding. This is not a claim of visual acceptance.

## Commit and scope

One build commit on `feat/world-graph`; its hash and finished CI result are reported in the worker response after push. No v1 component contract, component fixture, hand loop source, graph edge count, loop order, gesture reducer or binding changed. No new rows or test cases were added. R-3120 remains retired; the lane's other rows remain implemented with backticked `file::title` evidence.

Files, grouped by item:

- City scale and depot: `apps/hive/config.mjs`, `apps/hive/layout.mjs`, `apps/hive/camera.mjs`, `scripts/component-graph-config.mjs`, `scripts/component-graph-layout.mjs`, `docs/components/graph-fixture.json`, `packages/nana-pack/tests/fixtures/hive-graph-base.json`.
- Flat streets and visibility: `apps/hive/assets/parts.mjs`, `apps/hive/assets/road.mjs`, `apps/hive/main.mjs`, `scripts/component-graph-layout.mjs`, `scripts/component-graph.mjs`.
- Overlay and depot names: `apps/hive/index.html`, `apps/hive/text-layer.mjs`, `apps/hive/tour.mjs`, `apps/hive/main.mjs`.
- Contract and evidence: `REQUIREMENTS.md`, `apps/hive/README.md`, `docs/code-map.md`, the two test modules below, `gesture-check.txt`, and the `build3-*.txt` records in this folder.

## Every row and test changed

| Row | Contract change | Existing test changed and reason |
| --- | --- | --- |
| R-3172 | Compact 14-by-40 ellipse; one depot near its strongest related stage rather than a remote fixed plot. | `packages/nana-pack/tests/hive-graph.test.mjs::R-3172: published loop geometry matches goldens and sealed bounds clearance and attachments`: re-pin the ellipse, attachment distance, depot search and live-foundation scale; replace the obsolete fixed-plot assertion with yard proximity. Keep goldens, bounds, clearance, attachment and loop-order checks. |
| R-3173 | Flat marked streets; only loop and spurs on overview; zero drawn crossings; thin incident relationship lines on selection. | `packages/nana-pack/tests/hive-graph.test.mjs::R-3173: typed roads avoid third footprints and meet the base crossing caps`: replace artifact-before-spur priority and overview visibility expectations; pin road widths and street dimensions; assert flat geometry, marks, shared loop junctions and zero crossings. Keep source counts, pair uniqueness and third-footprint checks. |
| R-3174 | Depot names replace fictitious stage 10; tour order stays unchanged. | `packages/nana-pack/tests/hive-graph.test.mjs::R-3174: numbered tour anchors frame structures and walk roads at every viewport`: replace `10.1` with `DEPOT`, and update the label source assertion. Keep every pose, path, hash and reduced-motion assertion. |
| R-3175 | Unselected exploration asks for a building tap and has no Enter action. | `packages/nana-pack/tests/hive-graph.test.mjs::R-3175: real gesture binding never enters or changes hash on phone taps swipes or pinches`: update sealed widths/classes and assert the unselected landing model. Keep the real binding checks unchanged. |
| R-3134 | No row wording change. | `packages/nana-pack/tests/hive-assets.test.mjs::R-3134: visual and serving defaults retain their sealed values and provenance`: add the new sealed minimum live-foundation columns to the existing configuration pin. |

The graph fixtures were regenerated from their saved edges, not from the live tree. Absent parts retain their original small footprints. The actual audit graph and both saved graphs have zero drawn overview crossings. The depot's strongest related stage is Eyes, through Desk's three imports, rather than Workshop's one shared feature through Tool belt.

## Wrong-first and code mutation pairs

All red runs exit 1; the restored graph test run exits 0 with seven checks. Assertions were never inverted.

| Pair | Wrong code / old implementation | Observed red evidence | Restored green evidence |
| --- | --- | --- | --- |
| Scale, depot, names and exploration | Build 2's old values, remote plot, `10.1` and old exploration model | `build3-wrong-first.txt`: R-3172, R-3173, R-3174 and R-3175 fail | `build3-graph-tests.txt` |
| Larger live foundations and continuous street | Two-column scale and separate foundation-edge loop ends | `build3-round2-wrong-first.txt`: R-3172 and R-3173 fail | `build3-graph-tests.txt` |
| Sealed scale | Two-column STYLE object | `build3-assets-wrong-first.txt`: R-3134 fails | `build3-assets-tests.txt` |
| Final narrow ellipse | 22-by-34 slots instead of 14-by-40 | `build3-round3-wrong-first.txt`: R-3172 fails | `build3-graph-tests.txt` |
| Ground streets | Break the shared ribbon's geometry height to 2 world units | `build3-mutation-beams.txt`: R-3173 rejects raised roads | `build3-graph-tests.txt` |
| Overview roads | Break `visibleRoads` to include artifact roads without selection | `build3-mutation-overview.txt`: R-3173 rejects extra visible roads | `build3-graph-tests.txt` |
| Deliberate entry | Break the unselected exploration actions to include Enter | `build3-mutation-enter.txt`: R-3175 rejects the action | `build3-graph-tests.txt` |

## Screenshots and spec table

Final folder: `/private/tmp/nana-world-graph-build3/round3/`.

Six subfolders: `overview`, `drafting-table`, `review-ladder`, `notice-board`, `explore`, `explore-workshop`. Each holds `page-380.png` and `page-1280.png`, plus the first-look manifest and reference copies. Captures use the real audit and derived graph, reduced motion, `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md`. The original reference folder was read only. No judge or model session was started.

Each round captured all six URLs at both widths. Earlier frames remain in sibling `round1/` and `round2/` folders. Reasons below compare with both the reference frames and `judge-build2.md`. Lines 1–6 apply to all frames; line 7 to whole-loop frames; line 8 to tour chapters; line 9 to selected exploration, as the plan specifies. The new brief explicitly exempts unselected exploration from needing Enter or an outline.

| Spec line | Round 1 | Round 2 | Final round 3 |
| --- | --- | --- | --- |
| 1: edge-to-edge scene | PASS — Buildings and streets continue beneath the rail. | PASS — No opaque scene boundary. | PASS — Scene remains under both overlays, unlike build 2's opaque-rail failure. |
| 2: detailed, legible model | FAIL — Phone overview structures remain small symbols. | FAIL — Larger foundations help, but the phone city still reads sparsely. | FAIL — Compass, Eyes, Lab and Notice board are clearer, but several overview forms remain small; Review ladder still reads as a plain hall, below the reference's dense detail. |
| 3: restrained palette | PASS — White forms and grey streets. | PASS — No saturated accents. | PASS — White/grey forms, black details and muted ground lines. |
| 4: typography | PASS — Monospace labels and one heading hierarchy. | PASS — Same hierarchy without raw paths. | PASS — Chapter labels, title and body remain distinct; no raw data wall. |
| 5: readable frosted text | PASS — Overview copy fits; chapter cards remain short. | PASS — No truncated overview sentence. | PASS — Both-width cards fit; browser measurements find zero clipped cards or labels beneath them. |
| 6: phone composition | PASS — One scene and one overlaid card. | PASS — No card column replaces the scene. | PASS — Same scene/card design at 380; all six renderer lines say WEBGL. |
| 7: visible loop and attachments | FAIL — Loop ends still stop separately at foundations; depot labels are hidden on tour overview. | FAIL — Continuous loop is fixed, but depot labels are still hidden on tour overview. | PASS — One closed widest street, stage order intact, short spurs, visible Depot names and zero overview crossings; no fake stage 10. |
| 8: tour chapter | PASS — Three distinct structures and matching chapter labels. | PASS — Matching anchors and incoming streets. | PASS — Drafting table, Review ladder and Notice board frame separately with matching labels and a street entering each frame. |
| 9: selected phone exploration | PASS — Outline, darker roads and deliberate controls. | PASS — Whole loop stays visible with the selected Workshop. | PASS — Visible Workshop outline, darker streets, thin added relationships and Enter, Back and Back to tour. |

Three rounds used; no fourth visual iteration attempted. The unresolved visual failure is reported here, not added to the protected known-bug file.

## Gesture and browser measurements

`node scripts/hive-gesture-check.mjs --url http://127.0.0.1:7349/ --out /private/tmp/nana-world-graph-build3/gestures` exits 0. `gesture-check.txt`: **gesture checks: 4 passed, 0 failed**.

`build3-browser-checks.txt` records the served final app at both widths: 12 WEBGL ready marks, zero clipped active cards, zero labels underneath cards. Unselected exploration has no Enter; selected Workshop has Enter. Its 380 frame shows `RENDERER: WEBGL`, as do the other five final phone captures.

## Commands and exit codes

All final commands below exit 0. Logs use the corresponding `build3-*.txt` names unless stated otherwise. Absolute checkout prefixes in Node warnings and stack traces are redacted to `<repo>` before publication.

- `node scripts/component-audit.mjs --out /private/tmp/nana-world-graph-build3/components.json` — audit.
- `node scripts/component-graph.mjs --out /private/tmp/nana-world-graph-build3/graph.json` — derive; 23 overview streets, zero crossings.
- `npm run first-look -- --page url --after <each of six URLs> --hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <external folder>` — six successful runs per round.
- `node packages/nana-pack/tests/hive-graph.test.mjs` — 7 checks.
- `node packages/nana-pack/tests/hive-page.test.mjs` — 10 checks, unchanged tests.
- `node packages/nana-pack/tests/hive-assets.test.mjs` — 3 checks.
- `npm run map` and `npm run map:check` — map generated; zero module problems.
- `npm run readme:check` — zero problems.
- `node scripts/requirements-trace.mjs` — all implemented rows traced; zero off-form rows.
- `node scripts/requirements-tree.mjs` — zero problems.
- `node scripts/known-bugs.mjs --root .` — green.
- `node scripts/identity-scan.mjs` — zero findings.
- `npm run test:locked` — plain foreground command, unfiltered, output on screen, one machine lock.

Suite summary: **240 files: 238 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8734 pass, 0 fail, 44 skip · 593.0s**.

The final-tip seat checks and finished CI are reported by the worker after this commit. No CI conclusion is assumed in this file.

## Precedent and departures

Every brief-named precedent was read before design. `parts.mjs` owns the new ribbon helper; `road.mjs` imports it. No helper was copied or moved from a private scope. The public `depotStage` helper serves settling and road construction in the same layout module.

Departures from build 2's specific behavior, all required by this brief:

- Scale the common foundation model in `layout.mjs`, rather than editing each structure builder in `assets/hive.mjs`. Reason: physical buildings, published radii, camera bounds and clearance must use the same scale; existing per-ID structures remain intact.
- `component-graph.mjs` still delegates geometry to its existing layout/config modules. The depot replaces the remote fixed plot there. Reason: positions remain publish-time data and the graph edges stay unchanged.
- Loop streets share one inward junction per stage instead of separately clipping both ends at its foundation. Reason: the rendered street must actually close, rather than imply a loop through separate building entrances.
- A declared spur takes precedence over an artifact relationship on the same pair. Reason: stage attachments remain visible without exposing unrelated artifact roads on the overview. Every source and count is retained.
- Overview framing includes the compact depot. Reason: its structures and labels should not disappear off-frame or beneath the rail.
- Reduce rail frosting blur rather than making the rail opaque. Reason: keep the scene visible without the old dark blurred streaks.

## Known-bug context touched

- The declared v1 contract/fixture hash limitation is not changed; existing R-3171 byte comparisons still pass.
- Phone WEBGL fallback: measured all six final 380 captures as WEBGL; no fallback code was changed and no universal fix is claimed.
- Label/rail/card clipping: this build changes rail frosting and card sizing; served-page measurements show zero labels covered by cards in these captures. The existing label packer is reused unchanged.
- No other listed known bug is fixed or changed. No edits were made to `HANDOFF.md`, `docs/known-bugs/` or session archives.

## Writing check

`nana-writing --report` exits 0 in report-only mode and emits advisory notes in `build3-writing.txt`. I retain those notes under the writing rule's explicit technical-record exception. The brief requires the `VERDICT: PARTIAL` header, identifiers, paths, rows and command evidence; this is a builder report, not owner-facing prose.

## Not done / open for the seat

Visual line 2 has not reached the agreed quality bar. The seat must run its independent judge on the final frames and bring the remaining shape failure to the owner. This worker did not start that judge, an independent review, another model, a subagent, a GitHub issue or an issue comment. No fourth screenshot round was run. CI results for the pushed tip follow in the worker response.
