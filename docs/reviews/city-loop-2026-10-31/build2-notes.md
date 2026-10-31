# city-loop — build 2 technical record

## Change

The tour's plan, claims, chapter text, audit contract and flow evidence table are unchanged. This is a rendering and framing correction.

- `apps/hive/tour.mjs`: fit the participating lots and complete ground routes, rather than whole-city bounds for chapter 12. Symmetric horizontal bounds keep the chapter place at the optical centre. Roads widen the fit; they never move that place sideways.
- `apps/hive/camera.mjs`: fit the reserved vertical reading band directly in projected-corner math. Do not divide the fitted eye distance, including its depth allowance, a second time. Chapter 12 uses a sealed 65-degree lens.
- `apps/hive/assets/hive.mjs`: solid ink built returns, dark dashed unbuilt returns, ground-painted names, and ground routing for the two claims classified as air. The original handoffs and their evidence remain unchanged. Active ribbons have a 3 px width floor; active paint has a 7 px height floor. Paint candidates avoid other painted names and viewport edges while remaining on ground/trays. Hidden paint stays transparent, so its immutable GPU geometry uploads before scrolling.
- `apps/hive/assets/parts.mjs`: keep return centre attributes and render callbacks through the existing per-material batching pass; extend the tiny alphabet for the digit and separator in the existing bay name. Ribbons still use the imported `ribbon`; names still use the imported `trayName`.
- Packets retain a nine-pixel white head with an ink rim. Eight diminishing, fading samples trace the preceding 0.35 seconds on the actual path. Still mode omits the wake. Listed built returns carry packets; the original complete gate-to-drafting return remains visible in the whole-city view. Inactive per-road packets do not crowd that view.
- `apps/hive/main.mjs`: retain packet-owned markers rather than replacing them with the old generic five-pixel dot.
- `apps/hive/config.mjs`: seal the lens, paint height, screen floors and packet trail values, with provenance.
- `apps/hive/README.md`: describe the new visible contract; `docs/code-map.md` records the public route import.

## Rows and tests

Only R-3173 and R-3174 changed. Both are implemented with backticked `file::title` evidence. No new requirement ID was allocated. R-3187 and its working-code table are unchanged. The generated requirements outline remained byte-identical after regeneration.

Existing test edits, all in `packages/nana-pack/tests/hive-city.test.mjs`:

1. `R-3173: scene streets match pale narrow connected frontage and the single outbound gate`: air-kind returns now match the imported ground router, not the old floating path. Assert painted names, ink built materials, ground/tray heights and solid/dashed counts on the grounded path. Pin the new return paint and screen values.
2. `R-3174: request journey frames fourteen narrated chapters`: check the place's projected centre against the middle horizontal third and the card, and both actual ends of every listed road against the viewport. Keep the existing complete lot/visit corner checks. Assert chapter 12 is closer than the whole-city pose and pin its lens. Inactive paint is transparent while inactive ribbons retain 0.25 opacity.

Only new test, authorized by the sealed-tunable exception:

- `R-3173: packets retain nine pixel markers and eight fading trail samples over 0.35 seconds`: pins all three packet values, exercises actual batched point markers and moving trail buffers, and checks decreasing positive sample opacity and no wake in still mode. Every async case remains awaited under the existing per-case timeout. No suite test imports, copies or runs a seat script. No test writes this repository.

### Wrong-code pairs

- `build2-wrong-before.txt`, exit 1: unchanged production code fails the amended return check on missing painted names, framing on an off-centre place, and the new packet check on the absent packet configuration. `build2-city-tests.txt`, exit 0: all 19 city checks pass after implementation.
- `build2-wrong-lens.txt`, exit 1: the new lens pin fails before the lens is implemented. The same framing test is green in the final city and locked-suite runs.
- `build2-wrong-road-scale.txt`, exit 1: the new screen-floor pins fail before those values and their renderer are implemented. The return check is green in the final runs.

These pairs change or retain wrong production code; they do not invert assertions. No extra test was added for narration, flows, gestures or other unrelated behaviour.

## Precedent

Read all six named precedent files completely before designing. Followed the camera pose/fit, explicit THREE, shared ribbon, packet animation and sealed-config patterns. No private helper was copied, moved or exported.

Additional public reuse: both tour framing and ribbon construction import `pathBetween` from `apps/hive/city.mjs`, filtering out air roads at the call boundary. They do not duplicate the router or change the evidence-bearing plan. This is an additional precedent dependency, not a replacement routing implementation.

Necessary extensions of the precedent: shader screen floors preserve the human-scale crate and street geometry; ground-painted name placement uses projected candidates because fixed physical paint is unreadable at phone city distance. The existing batching pass now preserves those attributes/callbacks. The existing generic distance marker cannot supply the fading trail, so packet markers belong to the asset rather than main's generic resident loop.

The capture driver retains build 1's documented departure: first-look's browser injection seam requests 390 instead of its sealed 380 width, retains animation, refuses pixel fallback and takes viewport frames. It still receives `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <external folder>`. Reference directories were read only. No model session was started.

## Captures and builder judgement

Final frame root: `/tmp/city-loop-2-accepted/`.

- `review-ladder`, `land-gate`, `library`, `closing`: chapters 07, 08, 12 and 13, each with `page-1280.png` and `page-390.png`, spec, references and manifest.
- `enter-ledger`, `enter-archive`, `enter-watchtower`, `enter-key-cabinet`: close visits at both widths.
- `explore-workshop`: whole-city phone exploration with selected bay, incident streets and Enter/Back controls.
- `return-strip-1280` and `return-strip-390`: four raw frames at 0.8, 1.3, 1.8 and 2.3 seconds, plus `strip.png` and `frames.json`. The driver fixes only the animation clock. It draws no debug circle, label or pointer. Captures contain only the page's own painted names and place labels.

Audit source: `/tmp/city-loop-2-audit.json`, generated from the real repository, not the fixture. Capture output: `build2-captures-accepted.txt`; packet coordinates: `build2-return-strip.txt`. Earlier capture outputs remain as intermediate records, not the final judgement.

| Spec line | Builder verdict | Evidence |
|---|---|---|
| 1 | PASS | Edge-to-edge scene with controls over it, at both widths. |
| 2 | PASS | Close visits retain filing racks, ledger and braced cabin, shading and depth. |
| 3 | PASS | White/grey architecture, ink return ribbons, monochrome packet head and wake. |
| 4 | PASS | Existing numbered small caps and short cards; ground paint names the returns. |
| 5 | PASS | One readable card; boundary and full phone-scroll checks pass. |
| 6 | PASS at requested 390 px | Same scene and single card; no stacked-card fallback. 380 px was not this brief's requested measurement. |
| 7a | PASS | Closing retains the central tower, fenced park, town ring and one north route through customs to customers. |
| 7b | PASS | No placement changed; radial/non-grid controls and housing floor remain green. |
| 8 | PASS | Chapter 07's place is centred above the card, with the ledger return in frame. Every chapter-place centre and all listed flow ends pass at 1280 and 390. Chapter 12 reads as a ground return map, not an unlabelled pull-out. |
| 9 | PASS | `explore-workshop/page-390.png`: whole city, selected outlined bay, darker streets and explicit entry controls. |
| 10 | PASS | Whole-city frames retain complete dark bays beside lit roofs. The unannotated strips show the white/ink packet and fading wake at both distances; framed places retain their workers. |

This is the builder's served-frame judgement, not a model or independent reviewer verdict. The phone road names are deliberately small ground paint, not floating DOM labels.

## Gestures and scrolling

Before: `build2-gesture-before.txt`, exit 0, **gesture checks: 26 passed, 0 failed**.
After: `build2-gesture-after.txt`, exit 0, **gesture checks: 26 passed, 0 failed**.

| Width / input | Before p95 ms | After p95 ms | After max relative camera step | Reversals / stage reversals |
|---|---:|---:|---:|---|
| 1280 / ticks | 10.0 | 9.7 | 0.0380 | 0 / 0 |
| 1280 / smooth | 10.0 | 10.0 | 0.1143 | 0 / 0 |
| 390 / ticks | 16.7 | 17.0 | 0.0613 | 0 / 0 |
| 390 / smooth | 10.3 | 16.7 | 0.1138 | 0 / 0 |

All final p95 measurements are below 20 ms on Metal. No long task, geometry allocation or sun-shadow rebuild occurred during scrolling. First visibility of per-road packet resources uploads buffers (70 for ticks, 98 for smooth); this is not a zero-buffer-upload claim. Settling is exact, with no idle drift.

Two intermediate failures are retained honestly:

- `build2-gesture-after-failed.txt`: five street samples caught oversized inactive returns. Screen-width floors now apply only to active returns, and inactive per-road packets no longer obscure the whole-city trays.
- `build2-gesture-after-step.txt`: after that correction, one 390/smooth camera step measured 0.120284 against 0.12, while p95 and every other check passed. An unchanged repeat passed all 26 checks with a maximum of 0.113848. This remains a narrow timing margin, not a claimed code fix.

## Commands and exits

Commands ran from the lane worktree, with standalone exit-code reads and no verifier-output pipe before a commit. Public logs normalize the local checkout prefix to `<repo>`. The first staged identity check found that prefix in eight new logs; normalization removed those findings without changing diagnostics or results.

- `node scripts/component-audit.mjs --out /tmp/city-loop-2-audit.json`: 0.
- `node packages/nana-pack/tests/hive-city.test.mjs`: 0, 19 checks.
- `node packages/nana-pack/tests/hive-assets.test.mjs`: 0, 5 checks.
- `node packages/nana-pack/tests/hive-page.test.mjs`: 0, 10 checks.
- `npm run map`, `npm run req:tree`: 0 each.
- `npm run map:check`, `npm run readme:check`: 0 each.
- `node scripts/requirements-trace.mjs`: 0, 1965 implemented and 1965 traced; 0 EARS-form misses.
- `node scripts/requirements-tree.mjs --check`, `node scripts/known-bugs.mjs --root .`, `node scripts/identity-scan.mjs`: 0 each.
- `node scripts/lane-class.mjs --root . --files <explicit changed paths>`: 0, ordinary.
- Evidence-title check for both amended rows: 0; 13 checked, 0 missing.
- First-look chapter/visit calls and both-width strip driver: 0 each.
- Final `node scripts/hive-gesture-check.mjs --url http://127.0.0.1:62700 --out /tmp/city-loop-2-accepted/gestures-repeat --scroll`: 0.
- `npm run test:locked`: 0, run in the foreground under the repository's one machine-wide lock. Full output: `build2-full-suite.txt`.

**242 files: 240 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8765 pass, 0 fail, 44 skip · 612.4s**

## Scope limits

No known-bug file, HANDOFF, session archive, GitHub issue or model session was changed or started. No known-bug line in the supplied list was fixed incidentally. The brief's named visual failures are the only closures claimed. Existing software-renderer performance, hosted-frame blanking and publication limits remain unchanged.

Not done by the builder: independent review, review-ledger keep, protected notes or land. The final response records the pushed commit and the finished CI run, including any authorized Windows timeout retry.
