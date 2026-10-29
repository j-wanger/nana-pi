VERDICT: DONE

# hive-render · build 2 technical record

Feature: FEAT-039. Branch: feat/hive-render. Built on build 1, without changing the frozen contract or fixture. The final response names the implementation commit and its post-commit checks.

## Files

- `apps/hive/index.html`: edge-to-edge fixed canvas; translucent rail; title and three voices; one visible frosted card; phone chapter picker; retained study credit, renderer line, pixel and still links.
- `apps/hive/assets/hive.mjs`: original multi-part structures with floors, columns, shelves, braces, cranes, gatehouses, steps, footings, elevated connecting walkways and a continuous governance perimeter. Existing feature cells become shallow foundations; their fill still comes from the data. Absent components get empty footings, not invented buildings. Activity still uses the imported bee builder, including for absent components with activity.
- `apps/hive/assets/materials.mjs`, `apps/hive/config.mjs`: monochrome materials, ground, revised architectural/camera scale and shadow-map seal. No reference geometry, code or assets were used.
- `apps/hive/main.mjs`: shadowed neutral lighting, viewport-aware projection offsets, slower focus interpolation, chapter picker and voice wiring. Imports the unchanged `focus` function. Preserves picking, gestures, motion preferences, renderer fallback and ready marking.
- `apps/hive/text-layer.mjs`: numbered chapters and Plain / Technical / From the work voices. All chapter articles remain in the DOM; inactive articles and voices are hidden. Plain shows the metaphor, Technical shows status, features and parts, and From the work shows the gap and complete ask.
- `apps/hive/README.md`: documents the new layout, voices, foundations and adjacency-only walkways.
- `docs/code-map.md`: regenerated module descriptions.
- `REQUIREMENTS.md`: R-3134 wording only, detailed below.
- Three existing test files changed as listed below. This report is the only new tracked file.

## Every row changed

R-3134 now names monochrome colours, architectural scale and lighting rather than the earlier generic visual scale. It remains `implemented` with unchanged backticked evidence:

`packages/nana-pack/tests/hive-assets.test.mjs::R-3134: visual and serving defaults retain their sealed values and provenance`

No other row changed. R-3120–R-3133 retain their status and evidence. No IDs were allocated, no tree placement changed, and no contract field or fixture value changed.

### Changed and new seals

- R-3133 background: `#171b19` → `#d7d9d5`. The existing first-look config imports this value, keeping the empty-canvas oracle aligned.
- R-3134 status colours: sound `#eeefed`, partial `#b9bcb9`, gap `#454947`, absent `#888d89`.
- R-3134 kind rims: workflow `#b7bcb8`, governance `#e2e5e1`.
- R-3134 STYLE changes: chamberGap 4 → 1.8; framePadding 1.25 → 1.08; cameraElevation 0.9 → 0.68; beeScale 0.26 → 0.16; beeHeight 2.4 → 8.8; focusEase 0.09 → 0.025.
- R-3134 new STYLE seals: structureHeight 8 and shadowMapSize 2048. The existing seal test pins both.
- Other seals, including triangle budgets, activity cap, cell dimensions, raster resolution and ready timeout, remain unchanged. Dated reasons remain beside the definitions.

## Every test changed and wrong-code pairs

No new test was added or deleted. All planned must-meet tests from build 1 remain.

| Existing test | Change and reason | Wrong code → correct code |
|---|---|---|
| `hive-assets.test.mjs::R-3134: visual and serving defaults retain their sealed values and provenance` | Update the palette/STYLE oracle and pin the two new architectural seals; the old values contradict the owner's new look. | Old orange/green configuration failed the updated test (exit 1); monochrome architectural values passed (exit 0). |
| `first-look.test.mjs::R-3133: hive URL capture waits for drawing, reduces motion and names empty or timed-out canvases` | Background pin follows the new neutral clear colour; no capture assertions changed. | Old dark background failed the updated test (exit 1); imported neutral background passed (exit 0). |
| `hive-page.test.mjs::R-3126: rail order and active cards retain the complete component story` | Replace the assertion requiring one concatenated paragraph with assertions that each voice paragraph exists; the one-paragraph rendering is now false. Model story, order, counts, hash and article-count assertions remain. | No new test or claimed mutation pair; this is the necessary existing-test adaptation for separate voices. |

The seal tests were changed and run red against the old implementation before changing configuration. Assertions were never inverted to manufacture a failure. There is no new line-by-line text reader.

## Precedent

Read all four files named in this build's brief completely before designing.

| Precedent | Followed | Departure and reason |
|---|---|---|
| `apps/hive/main.mjs` | Same data boundary, render-choice flow, ready setter, hash handler, picking and motion wiring. | Fixed viewport stage and projection offsets replace the boxed stage; lighting/shadows and slower easing implement the replication decision. |
| `apps/hive/assets/hive.mjs` | Same explicit THREE namespace, shared materials, component ancestor metadata, imported `buildCell` and `buildBee`. | Multi-part architecture and perimeter replace hex plates; cells remain as feature foundations so the existing data encoding survives. |
| `apps/hive/camera.mjs` | Imported `focus` unchanged; every component still uses its pure camera stop. | No change to the helper. The browser offsets the projection around overlays and crops the overview on narrow screens; this is presentation, not a copied framing function. |
| `apps/hive/text-layer.mjs` | Same DOM-independent reading model and explicit document/container renderer; no HTML interpolation of data. | One visible card and separate voice panels replace the stacked data dump; numbered rail and phone select follow the owner's target. |

No private precedent helper was copied, moved or needed. No desk file was changed or imported. The owner's build-2 decision supersedes plan A9's phone canvas cap and below-scene document scrolling: the scene now stays behind the picker and a scrollable card. The pixel fallback remains deliberately simple, as the brief permits.

## Served screenshots and self-judgement

Final screenshot folder, outside git:

`/var/folders/lg/h9m6nvvd2_9d7s3hyjvdlqxr0000gn/T/nana-replication-2OGGx5/`

After the final green locked suite, `/tmp/hive-build2-capture.mjs` built a temporary site through the publisher and served it through the existing loopback server. It used the existing resolver and `runFirstLook --page url --hive`, reduced motion and `?still`; exit 0. It then captured all five stops, the overview, Library's three voices and pixel fallback at 380 × 1000 and 1280 × 1000. No reference screenshots are tracked.

- `before-380.png`, `before-1280.png`: overview via the existing first-look path.
- `after-380.png`, `after-1280.png`: Library via the existing first-look path.
- `<width>-<chapter>.png`, `<width>-library-<voice>.png`, `<width>-pixel.png`: additional manual inspection frames.
- `browser-checks.json`: WebGL ready marks, one visible article at every stop, canvas bounds exactly matching each viewport, scrollWidth equal to viewport width, complete voice text and zero page errors.
- `comparisons/`: each captured image beside a reference frame. The external comparison script exited 0. Opening/title, commentary, technical and whole-system reference frames were read; the opening is a reference for typography, not a copied loading screen.

### Art spec, line by line

| Line | Result | Reason from the side-by-side look |
|---|---|---|
| 1 · Scene fills the page | PASS | Canvas measures 380 × 1000 and 1280 × 1000; the rail/card float over the model without a canvas box or document column. |
| 2 · Detailed, legible model with depth, light and shadow | PASS | Focused views show floors, shelf bays, braces, cranes, colonnades, steps and walkways; neutral side lighting and filtered cast shadows separate them. Governance homes join the perimeter; dark open frames and empty footings remain distinct. |
| 3 · Restrained monochrome palette | PASS | WebGL uses white/light-grey structure, dark unfinished decks and ink details rather than orange/green tiles. |
| 4 · Deliberate typography | PASS | Small monospace chapter labels and leaders contrast with clear sans-serif headings; default Plain contains no paths or IDs. |
| 5 · One short frosted overlay | PASS | Exactly one article is visible at each stop; voice buttons switch its reading rather than stacking data cards. |
| 6 · Same designed object at 380 px | PASS | The scene remains behind the picker and card, the card scrolls internally, and the page has no horizontal overflow or long document column. |

These are the builder's visual judgements, not an automated claim of pixel equivalence. The frozen five-component fixture is a smaller campus than the reference's many-component city; no extra components were invented to imitate its count.

Additional manual browser measurements on the same code: `?still` and reduced motion each produced identical canvas bytes over 500 ms; normal motion changed the canvas. The phone picker changed the hash to Library in all three modes. The From the work card scrolled 65 px internally to reveal its complete ask. Those measurements live in the preceding external capture folder's `motion-and-picker.json` (`nana-replication-hQNY84` under the same temp parent).

### Closed browser findings

- The first real ready wait failed because fixed-only page content left the root element with zero height. Explicit root/body viewport height restored the existing visible ready wait; the same first-look capture then passed.
- The vendored release warns that PCFSoftShadowMap was removed. Switched to its supported PCFShadowMap; no vendor bytes changed.

## Commands and exit codes

| Command | Exit / result |
|---|---|
| `npm run map:impact -- apps/hive/main.mjs apps/hive/assets/hive.mjs apps/hive/assets/materials.mjs apps/hive/text-layer.mjs apps/hive/config.mjs apps/hive/layout.mjs` | 0; reviewed the upstream tests, pixel fallback, first-look and camera consumers. |
| `node packages/nana-pack/tests/hive-assets.test.mjs` | 1 before configuration change; 0 after, 3 checks. |
| `node packages/nana-pack/tests/hive-page.test.mjs` | 0; 10 checks. |
| `node packages/nana-pack/tests/first-look.test.mjs` | 1 before background change; 0 after, 5 checks. |
| `node packages/nana-pack/tests/pages-workflow.test.mjs` | 0; 3 checks, no assertions changed. |
| `npm run map` | 0; 486 modules. |
| `npm run test:locked` | 0 twice, plain foreground with output on screen and one machine lock. Final summary below. |
| `npm run map:check` | 0; 0 problems. |
| `npm run readme:check` | 0; 859 claims, 0 problems. |
| `node scripts/requirements-trace.mjs` | 0; 2169 rows, 1924 implemented/traced, 0 EARS problems. |
| `node scripts/requirements-tree.mjs --root .` | 0; 2169 rows, 39 features, 0 problems. |
| `node scripts/known-bugs.mjs --root .` | 0; `summary names=0 sizes=0`. An earlier invocation without the required root printed usage; corrected here. |
| `node scripts/identity-scan.mjs` | 0; no findings. |
| `git diff --check` | 0. |
| `node scripts/lane-class.mjs --root . --files <changed implementation paths>` | 0; `ordinary`. |
| `node /tmp/hive-build2-capture.mjs` | Final 0, after the final suite; real WebGL and forced pixel at both widths. |
| `node /tmp/hive-build2-compare.mjs <screenshot folder>` | 0; side-by-side sheets outside git. |

Final suite summary:

`237 files: 235 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8706 pass, 0 fail, 44 skip · 562.4s`

Frozen SHA-256 values still match the sealed plan values:

- `docs/components/contract.json`: `ea48a6136c4fc7b77d1a1d949d08cf8a23795560f4623e9a0318a253dd2de39e`
- `docs/components/fixture.json`: `09d305725ce77b4d6e1aa2cb035bce06bd4c7274fa571bfb5b51714278363ebd`

## Not done / boundaries

- No hive reskin, product-report replacement, contract swap or real-audit data was added. The second lane still owns the documented swap after merging main.
- No supplied FEAT-039 known bug was fixed or otherwise changed. The existing first-look URL path is reused; its product-view, provenance-diff and missing-browser limitations remain unchanged.
- No HANDOFF, known-bug file or session archive was edited. No new test, dependency installation, model session, subagent or GitHub issue mutation was made.
- No independent review or land was performed. Hosted CI is read after this commit; the final response reports the finished result.
- Open questions: none introduced by this build.
