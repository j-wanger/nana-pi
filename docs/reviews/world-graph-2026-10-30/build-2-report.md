VERDICT: PARTIAL

The implementation and local functional checks are complete. Visual line 2 still fails on the phone overview after three rounds. This is not a shape-gate acceptance or a land recommendation. The seat must run its visual judge and show the frames to the owner. No model session, subagent or issue write was started.

## Commit

One implementation commit on `feat/world-graph`; the worker's final reply names its hash and finished CI run. Its message file is outside the worktree under `$TMPDIR`. The commit includes this report and the text logs in this folder. CI is read after pushing, not represented by a speculative green result here.

## Items, files and rows

| Item | Files | Rows |
|---|---|---|
| Source graph and shared parsers | `scripts/component-graph.mjs`, `scripts/component-audit.mjs`, `scripts/deliverables.mjs`, `docs/components/loop.json` | R-3170, R-3171 |
| Publish-time geometry, routing and goldens | `scripts/component-graph-layout.mjs`, `scripts/component-graph-config.mjs`, `docs/components/graph-contract.json`, `docs/components/graph-fixture.json`, `packages/nana-pack/tests/fixtures/hive-graph-base.json`, `apps/hive/layout.mjs` | R-3172, R-3173; R-3120 retired |
| Road meshes and selection | `apps/hive/assets/parts.mjs`, `apps/hive/assets/road.mjs`, `apps/hive/assets/hive.mjs`, `apps/hive/roads.mjs`, `apps/hive/pixel.mjs` | R-3173 |
| Tour, reading and safe gestures | `apps/hive/tour.mjs`, `apps/hive/explore.mjs`, `apps/hive/camera.mjs`, `apps/hive/main.mjs`, `apps/hive/labels.mjs`, `apps/hive/text-layer.mjs`, `apps/hive/config.mjs`, `apps/hive/index.html` | R-3174, R-3175, R-3126, R-3129 |
| Paired publication and contract refusal | `apps/hive/graph.mjs`, `apps/hive/runtime.mjs`, `scripts/hive-page.mjs`, `.github/workflows/pages.yml`, `apps/hive/README.md` | R-3171, R-3176, R-3127, R-3130, R-3131, R-3139 |
| Browser acceptance plumbing | `scripts/first-look.mjs`, `scripts/hive-gesture-check.mjs` | R-3174, R-3175 |
| Trace and navigation | `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md` | Seven new implemented rows; six changed implemented rows; R-3120 retired |

The v1 `docs/components/contract.json` and `docs/components/fixture.json` remain byte-identical to `57167e92`. R-3171 compares their bytes to that commit. No dependency, workflow permission, component hand audit, known-bug file, HANDOFF or session archive changed.

## Tests changed

Only one new suite file, `packages/nana-pack/tests/hive-graph.test.mjs`, with exactly the seven must-meet cases:

- R-3170: graph counts recorded sources in their own units through shared parsers
- R-3171: loop drift and incompatible graph pairs refuse before output without changing v1
- R-3172: published loop geometry matches goldens and sealed bounds clearance and attachments
- R-3173: typed roads avoid third footprints and meet the base crossing caps
- R-3174: numbered tour anchors frame structures and walk roads at every viewport
- R-3175: real gesture binding never enters or changes hash on phone taps swipes or pinches
- R-3176: publisher ships paired graphs and Pages derives and scans them in order

Each case is awaited under a 60-second limit. Fixtures use OS temporary directories, never the running repository. The ledger fixture includes CRLF, trailing space/tab and no final newline. No suite test imports, runs or copies the gesture-check seat script. The new tunables are pinned inside these cases.

Edits to existing tests, each caused by the changed contract:

- `hive-page.test.mjs`: removed the named R-3120 grid/ring test, replaced by R-3172. R-3126 expects tour order. R-3127 adds graph contract refusals. R-3129 gates readiness on chapter application and checks real entry ordering. R-3130 expects both files and passes paired flags. R-3139 supplies the graph while retaining every incompatible-component refusal.
- `pages-workflow.test.mjs`: R-3131 also checks the graph scan; R-3139 checks graph derivation between audit and publisher and the paired flag.
- `product-report.test.mjs`: its existing R-1021 moved-home/shared-back fixture selected the first own row, now retired R-3120. It now chooses a non-retired own row because the tree correctly refuses sharing retired rows. The first locked run exposed this; no product-report implementation changed.
- `hive-assets.test.mjs` stays byte-for-byte unchanged. All three cases pass, including geometry/material builders and the sealed visual defaults.
- No other test was deleted or edited. The fixture oracle's loop segment Land gate → Workshop was corrected to `declared: false`: its reverse pair already has an artifact relationship. This was an oracle correction, not a mutation proof.

## Wrong-code pairs

Assertions were never inverted. All mutants were removed before green runs.

| Row | Wrong implementation | Observed red evidence |
|---|---|---|
| R-3170 | CLI returns success without making a graph | `wrong-first.txt`: expected output missing; exit 1 |
| R-3171 | Loop checker accepts everything | `wrong-first.txt`: missing Key cabinet accepted; exit 1 |
| R-3172 | Empty tunables, then all positions forced to zero with real tunables | `wrong-first.txt`, `mutation-zero-layout.txt`: sealed pin/golden mismatch; exit 1 |
| R-3173 | Road maker returns no roads | `mutation-no-roads.txt`: an edge has no road; exit 1 |
| R-3174 | Tour maker returns no chapters | `mutation-no-tour.txt`: chapter order mismatch; exit 1 |
| R-3175 | Pointer-up writes an enter hash | `mutation-tap-enters.txt`: real binding emits forbidden hash; exit 1 |
| R-3176 | Original publisher omits graph output | `wrong-first.txt`: graph output missing; exit 1 |

`mutation-extra-road-drag.txt` additionally closes the invented-road and vertical-drag-enter mutants: R-3173 and R-3175 both fail, exit 1. The graph test now checks the exact expected road-pair set, the closed loop sources, zero straight-spine crossings and angle order about its centroid; the binding test explicitly checks a 40 px explore drag.

The portrait framing retune also went red before code changed (`framing-wrong-first.txt`). Its requirement diff seals 45-by-75 loop slots; the new golden positions replace the first framing attempt.

## Counts and geometry

Measured on the saved `57167e92` base graph and reproduced on this tracked tree:

| Source | Directed records | Sum in that source's units |
|---|---:|---:|
| Import | 55 | 292 distinct import links, summed per directed component pair |
| Artifact | 20 | 29 distinct artifact IDs, summed per directed component pair |
| Deliverable join | 28 | 49 distinct deliverable rows, summed per directed component pair |
| Shared feature | 8 | 8 shared FEAT IDs, counted once per unordered component pair |
| Loop | 9 | 9 declared steps; 4 have no other recorded source |

There are 68 edge-bearing unordered pairs. The 75 published roads comprise 9 loop, 21 artifact, 12 spur, 29 import and 4 feature roads. The overview has 30 loop/artifact roads plus 12 chapter ties. The saved base graph has **0 overview crossings, 0 loop crossings**, below the sealed caps of 12 and 2. Shared street junctions are not crossings. Import hubs do not influence the spring.

The base's relationship data came from a temporary archive of `57167e92`, not from a later live import graph. The node/road goldens were regenerated only for the declared portrait-framing retune. `derive.txt` records the live counts; the tests do not pin those counts against future lanes. The deliverable-checker output is compared against the historical parser on the same current ledger, not against a live count constant.

## Visual work

Screenshot root: `/private/tmp/nana-world-graph-look2/`. The committed-tip verification re-capture uses `r3-tip/` under that root, without another design round. Round-3 six capture folders: `r3/start`, `r3/drafting`, `r3/review`, `r3/notice`, `r3/explore`, `r3/selected`. Each contains 380 and 1280 viewport frames, full-page frames, the manifest, spec and copied references. No frame was committed. `/private/tmp/nana-3dmk-ref/` was only read.

All six final 380 frames visibly say **RENDERER: WEBGL**. None needed a pixel-flake retry. The three chapter frames show distinct Drafting table, Review ladder and Notice board structures with matching 02, 06 and 09 cards.

| Spec line | Final self-judgment | Reason |
|---|---|---|
| 1 | PASS | The fixed 3D scene fills the viewport beneath overlays. |
| 2 | **FAIL** | Chapter details have geometry and shadows, but several structures remain too small to identify in the 380 overview. |
| 3 | PASS | White/grey forms and ink accents remain monochrome. |
| 4 | PASS | Packed monospace numbered labels and large card headings retain hierarchy without raw-ID dumps. |
| 5 | PASS | One frosted card and the rail/picker carry short default text. |
| 6 | PASS | The phone keeps the same scene, not a column of cards. |
| 7 | PASS on whole-loop frames | Stages 01–09 follow the closed widest chain, supports sit beside stages, and only a few chords occupy the interior; there is no grid. The line's whole-loop condition is not applicable to close-up chapter frames. |
| 8 | PASS on all three chapter URLs | Each named structure is near the centre with a matching numbered card and incoming roads. |
| 9 | PASS on selected phone frame | Workshop has an outline and darker incident roads, Enter and Back to tour; the view remains the whole loop. |

Round 1 failed scale, overlapping labels and linked-chapter capture. Round 2 improved framing and fixed captures; labels still collided. Round 3 restores the precedent's collision packing and leaders. The remaining line-2 failure goes to the seat and owner, not a fourth round. No independent visual-reader was run because the brief prohibits starting model sessions.

`gesture-check.txt`: **4 passed, 0 failed** at 380 × 1000 with touch and reduced motion. It checks real hit selection without pose/hash changes, inert tour taps, scroll-changing tour swipes without selection/hash changes, and equal poses for scrolling versus all three linked chapters. Round 1's coarse search missed tiny structures; the checker now taps published label projection candidates through the real canvas hit test.

## Precedent and plan departures

- Authorized blocker resolution: moved only `beam` and `fence` from `buildHive` to `assets/parts.mjs`. Both callers import them. THREE, materials and shared unit-rod geometry are explicit; beam/fence geometry, defaults, materials and all existing asset tests stay unchanged.
- Also moved the original private `placeLabels` from `main.mjs` into `apps/hive/labels.mjs`, with document, stage and projected nodes explicit. This restores the original collision/leader behavior rather than copying another helper. No other asset helper moved.
- Exported the existing `waitForHive` from `scripts/first-look.mjs`; the gesture checker imports it and `resolvePlaywright`, rather than duplicating browser readiness or resolution.
- Hive first-look captures the viewport before its full-page shot. The full-page screenshot temporarily resizes the scroll page and had reset a linked chapter. Non-hive capture order is unchanged; all existing capture tests remain green.
- The reusable graph boundary check lives in `apps/hive/graph.mjs`, imported by browser and publisher, instead of two copies in runtime and scripts. Its refusal remains one plain line before scene/output creation.
- Routing uses a visibility graph around circumscribed footprints and existing road junctions, not an unconditional straight line with at most two bends. This earns the crossing caps without hiding recorded roads or intersecting structures.
- The outside plot has three linked spur segments rather than one pair record. A single pair could not visit all three outside components while avoiding the third component's footprint. The links are explicitly declared chapter ties.
- Attached starts use a deterministic symmetric outward fan, not a golden-angle spiral. Attachment forces hold that stage-relative slot rather than chasing the small per-iteration displacement of the stage. Clearance, outside-polygon and attachment-radius assertions pin the intended result. No random source was introduced.
- `layout(data)` retains a simple graph-less placement only for existing direct asset/model callers. The page and publisher require a checked graph, and the browser never runs a spring.
- Enter emits the navigation hash; the hash handler applies unchanged `focus`. The reducer does not also move the camera, preserving A20's single camera-move owner.
- Road cards are deferred under the plan's allowed fallback. The graph preserves every source/count and `roadCaption` provides units, but canvas selection currently picks structures only.

## Commands and exit codes

Logs in this folder retain long outputs with machine-specific path prefixes redacted.

- New graph checks: wrong implementations **1**; restored implementation **0**, seven checks.
- `node packages/nana-pack/tests/hive-page.test.mjs`: **0**, ten checks.
- `node packages/nana-pack/tests/hive-assets.test.mjs`: **0**, three unchanged checks.
- `node packages/nana-pack/tests/pages-workflow.test.mjs`: **0**, four checks.
- `node packages/nana-pack/tests/requirements-deliverables.test.mjs`: **0**, 21 checks.
- `node packages/nana-pack/tests/first-look.test.mjs`: **0**, eight unchanged checks.
- `node packages/nana-pack/tests/product-report.test.mjs`: first **1** on the retired-row fixture; after the named fixture edit **0**, 97 checks.
- `npm run test:locked`: first **1**; runs two through four **0**. Each ran as a plain foreground command with output on screen, under the one machine lock. Final: **240 files: 238 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8734 pass, 0 fail, 44 skip · 581.1s** (`suite-summary.txt`).
- `npm run map`, `npm run req:tree`, `npm run readme:check`, requirements trace and identity scan: **0** after regeneration. A first `known-bugs.mjs` call without its required root exited **2**; `node scripts/known-bugs.mjs --root .` exits **0**.
- Audit, graph derivation, all six first-look URLs in each of three rounds: **0**. Gesture check first **1**, then **0** in rounds 2 and 3.
- The worker repeats map, README, trace, tree, known-bugs and identity checks on the committed tip and reports each exit. Lane class remains ordinary.

## Known-bug context touched

The v1 reviewer-only byte check now has an automated byte comparison to the base. The phone pixel fallback remains possible; all measured final phone frames used WebGL. The old rail/card/label collision area is touched by numbered labels and restored packing, without claiming the old specific clipping bug closed. The component-audit Windows activity-timeout context is unchanged apart from exporting `contains`; no timeout was retuned. No other listed known bug was fixed.

The writing checker exited 0 in report-only mode and listed owner-prose findings in `writing-check.txt`. They remain because this is the brief's required technical worker record: its verdict format, identifiers, paths, commands and test titles are mandatory, and builder reports are outside the owner-prose rule.

## What is not done

Visual line 2 is not accepted. The seat's independent visual judgment, owner shape answer, review and land are not done. Road cards are deferred as allowed. The library remains an archive; the theater, thematic animations, shops and flows remain later lanes. No issue was opened or changed. The final reply reports push and the finished CI result, including the Windows suite leg; those results are not guessed in this pre-push record.
