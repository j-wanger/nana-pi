# Plan: hive-render (2026-10-29)

Worktree `hive-render`, branch `feat/hive-render`, based on main `a2ad3f21`. A parallel lane, component-audit, makes the real data this page draws; the two share the data contract below.

Revision 1 takes the adversary's attack in `plan-attack.md` in full: 3 MUST, 5 SHOULD, 5 NOTE. Rows are renumbered R-3120 to R-3133.

## Purpose

The owner's agreed reading (2026-10-29), after studying https://3dmk.com/: "Reading 1 is good, but I dont see why we cant start the rendering lane in parallel and start building the assets, the data behind should be swappable; style reading is good [low-poly animated 3D default, pixel fallback], goal should be eventually replacing the product page, for now it can be a separate page".

Earlier in the same request: "a similarly built 3d experience", "a hivemind themed build first, so hive and bee agents world", "nana-pi only first", "if successful it may even be able to replace the product report".

This lane builds a separate static page, published beside the product page on GitHub Pages, that draws nana-pi as a low-poly animated hive. Components are chambers, features are cells, honey fills built rows, dark cells show gaps, bees show activity, and governance pieces sit in their own ring of homes. The page reads only the shared data contract, so it ships on the fixture and swaps to the audit's data when that lands. Its hive, cell, bee and material parts are reusable modules. Without WebGL it draws a pixel view, and it reads well on a phone.

## Assumptions

- A1. Feature placement: the rows go in FEAT-039 (see Questions), the feature this page may later replace.
- A2. three.js is vendored, not loaded from a CDN: release 0.186.1 (MIT, current on npm on 2026-10-29). The release ships only unminified builds, so the lane vendors `build/three.module.js` (663 KB) and `build/three.core.js` (1.46 MB), which the module build imports relatively, with three.js's `LICENSE` beside them in `apps/hive/vendor/`. Minifying them ourselves would be a build step (A3), so the lane does not. The version and each file's sha256 are sealed in `scripts/hive-page-config.mjs`. Reasons: the public page then loads nothing from a third-party host, as 3dmk loads nothing after its first fetch; the bytes are pinned and reviewed once; local serving works offline; a CDN adds an outage and a supply point that an SRI hash guards for integrity but not for availability. Cost: about 2.12 MB tracked, about 420 KB gzipped over the wire.
- A3. No build step for the page. Hand-written ES modules load through `<script type="module">` with an import map that maps `three` to the vendored file. `scripts/hive-page.mjs` only copies files and writes the data, which is justified because Pages uploads only `site/`.
- A4. The page is served over http only (shared contract). `node scripts/hive-page.mjs --serve` gives a loopback URL for local looks.
- A5. Asset modules take `THREE` as an argument and never import it, so a test runs them in Node against the vendored build; geometry needs no WebGL. Layout, honey, bees, renderer choice, the pixel view and the text layer are pure functions of data, tested in Node. Real WebGL drawing is checked by the seat's first-look screenshots, not by the suite.
- A6. Headless Chromium under Playwright gives a WebGL context: the adversary's probe of Playwright 1.61.1 on this Mac returned `webgl2: true` on SwiftShader. Inferred, not observed: a newer Chromium may put SwiftShader behind `--enable-unsafe-swiftshader`; add that launch flag if a later Playwright returns no context. The text layer and the ready mark always name the renderer used, so a screenshot is never ambiguous.
- A7. The product page gets no link to the hive in this lane. The hive sits at `<pages root>/hive/`, and the product page is unchanged.
- A8. Motion honours `prefers-reduced-motion`: bees hold still and the camera does not drift.
- A9. On a 380 px phone, the canvas is capped at about 60 percent of the viewport height, and the cards read below it. The canvas keeps `touch-action: pan-y`, so a vertical swipe scrolls the page; orbit is a one-finger horizontal drag plus pinch, or the controls arm only after a tap (O1). Tapping a chamber, or opening `#<component id>`, focuses that chamber and opens its card. The page never scrolls sideways at 380 px.
- A10. Tests live in `packages/nana-pack/tests/hive-*.test.mjs`, so the suite's fixed test folders in `scripts/test.mjs` do not change.
- A11. The desk is frozen (ruling 2026-10-10). `apps/desk/` is read as precedent and never imported or edited.
- A12. outside-reader is not run on the hive in this lane. Its sealed views are product-page hashes, so it would read the hive's landing five times and add nothing. Once the `#<id>` cards exist, a hive view list for it is a follow-up, recorded as a known-bug line.
- A13. The seat guide's first-look line is not changed in this lane; the seat runs the hive capture by hand, as the Seat look section says.
- A14. Page text is generic and names no person. The study site is cited by URL only, never its author.

## Open choices

- O1. Camera control: vendor `examples/jsm/controls/OrbitControls.js` from the same release (same licence; it imports bare `three`, which the one import-map entry covers) or write a small drag-and-pinch orbit. Either way, the phone scroll rule in A9 holds: OrbitControls sets `touch-action: none` on its element, so if it is used, it is armed only after a tap or its touch handling is limited to horizontal drag and pinch.
- O2. Palette, light and animation detail, inside the low-poly triangle budgets the tests seal.
- O3. The pixel view's base resolution and how it is scaled (`image-rendering: pixelated` on a small canvas is the expected shape).
- O4. The homes ring's shape: an outer ring of governance chambers around the comb, or a separate small comb beside it.
- O5. How the 3D scene draws a component with no features (one sealed dark cell is the default the layout test pins).

## Questions for the owner

Question: Should the page be one hive you turn and tap, or a scroll-driven tour like 3dmk's chapters?
Default: one hive scene with a rail of components; tapping a chamber or opening `#<id>` flies the camera there.
What the default gains and misses: works the same on a phone and a laptop with fewer moving parts; misses the guided story that makes 3dmk feel like a tour.
Cost of a wrong guess: easy to undo: the camera path lives in the page's main module; the asset, layout and data modules stay as they are.
If answered otherwise: the builder adds a scroll-to-chapter camera path over the same scene in a follow-up lane.

Question: Do both lanes' rows go in FEAT-039, or in a new feature for the component map?
Default: FEAT-039, rows R-3100 onward for component-audit and R-3120 onward for this lane.
What the default gains and misses: no tree change and the page lands in the feature it may replace; misses a clean known-bug file and count for the map.
Cost of a wrong guess: easy to undo: moving rows to a new feature later is an approved regroup, and row IDs never change.
If answered otherwise: the seat creates the new feature heading under CAP-07 with the owner's label before the build, and both briefs name it.

## Feature

Feature: FEAT-039 · See the product and its decisions in one report

Lane class: `ordinary` (`node scripts/lane-class.mjs --root . --files apps/hive/index.html,apps/hive/main.mjs,apps/hive/layout.mjs,apps/hive/camera.mjs,apps/hive/pixel.mjs,apps/hive/text-layer.mjs,apps/hive/assets/hive.mjs,apps/hive/assets/cell.mjs,apps/hive/assets/bee.mjs,apps/hive/assets/materials.mjs,apps/hive/vendor/three.module.js,apps/hive/vendor/three.core.js,apps/hive/vendor/OrbitControls.js,apps/hive/vendor/LICENSE,apps/hive/README.md,scripts/hive-page.mjs,scripts/hive-page-config.mjs,scripts/first-look.mjs,scripts/first-look-config.mjs,.github/workflows/pages.yml,packages/nana-pack/tests/pages-workflow.test.mjs,packages/nana-pack/tests/first-look.test.mjs,packages/nana-pack/tests/hive-page.test.mjs,packages/nana-pack/tests/hive-assets.test.mjs,code-map.config.json,readme-check.config.json,docs/code-map.md,docs/components/contract.json,docs/components/fixture.json,REQUIREMENTS.md,docs/requirements-tree.md,README.md,docs/known-bugs/FEAT-039.md,HANDOFF.md`, rerun 2026-10-29 on main for revision 1; the adversary also got `ordinary`). One final reviewer is enough.

Size: larger. About 1,000 to 1,500 lines of page code, tests and tooling, not counting the 2.12 MB of vendored files, across a new app, a page builder with a serve mode, a first-look capture change and a Pages step. Build with `pi-worker --lane-size larger`. If the first build runs long, the first-look capture is the part to split into its own lane; say so in the report rather than cutting a test.

Rows: R-3120 to R-3133 used, R-3134 to R-3138 spare, R-3139 reserved for the swap if this lane does it (this lane). Fourteen rows is above the usual three to eight because the attack split two wide rows and added the experience rows. Artifact ID: A-087 (component-audit takes A-086).

## Threat model

In scope: honest variation in our own tools' output and in the viewer's browser. Data with the wrong contract or version, a component with no features, a feature with zero rows, forty components instead of five, a browser with no WebGL, a phone screen, reduced motion, Playwright missing, a merge base without the page. Each must render something readable, fail by name, or be stated as a limit.

Out of scope: deliberate forgery, such as a hand-edited `components.json` that passes the contract with false counts, or a tampered vendored file in a reviewer-accepted commit. The sealed sha256 values catch an accidental change to the vendored files, not a forged one. A finding outside this model is a residual and goes in the known-bug file.

## Shared data contract

This section is word-for-word the same in the component-audit and hive-render plans.

Owner: the component-audit lane. Only that lane, or a later lane in its name, changes the contract, the fixture or the validator. The hive-render lane reads them.

Frozen: version 1, exactly as written below, is frozen for both builds. Neither lane changes a field, an enum, a rule or a fixture value. A need for a change goes to a follow-up lane that bumps `version`, and the builder that finds the need reports it instead of making it.

Files. Both lanes add these two files, byte-identical, each written as `JSON.stringify(value, null, 2) + "\n"` from the literals below:

- `docs/components/contract.json` (sha256 `ea48a6136c4fc7b77d1a1d949d08cf8a23795560f4623e9a0318a253dd2de39e`)
- `docs/components/fixture.json` (sha256 `09d305725ce77b4d6e1aa2cb035bce06bd4c7274fa571bfb5b51714278363ebd`)

Git merges two identical additions cleanly, so either lane may land first. Each lane's reviewer checks both hashes. A byte difference shows up as a merge conflict at the second land, which is the loud failure wanted.

```js
const contract = {
  contract: "nana-components",
  version: 1,
  kinds: ["workflow", "governance"],
  statuses: ["sound", "partial", "gap", "absent"],
  documentFields: ["contract", "version", "project", "components"],
  componentFields: ["id", "name", "metaphor", "kind", "parts", "features", "status", "gap", "ask", "evidence", "activity"],
  featureFields: ["id", "label", "rows", "implemented"],
  askFields: ["question", "default", "gains", "cost", "otherwise"],
  activityFields: ["recentCommits", "inFlight"],
};
const fixture = {
  contract: "nana-components",
  version: 1,
  project: "fixture",
  components: [
    { id: "workshop", name: "Workshop", metaphor: "A workshop where builders make one lane at a time", kind: "workflow",
      parts: ["packages/nana-pack/bin/pi-worker.mjs", "packages/nana-pack/bin/pi-watchdog.mjs"],
      features: [{ id: "FEAT-006", label: "Launch builders with execution limits", rows: 10, implemented: 9 }],
      status: "sound", gap: null, ask: null,
      evidence: ["packages/nana-pack/bin/pi-worker.mjs", "FEAT-006"], activity: { recentCommits: 3, inFlight: 1 } },
    { id: "library", name: "Library", metaphor: "A library the agent reads before it guesses", kind: "workflow",
      parts: ["packages/nana-setup/claude/hooks/nana-shared-memory.mjs", "packages/nana-knowledge/lib/query.ts"],
      features: [
        { id: "FEAT-003", label: "Index and connect existing knowledge sources", rows: 8, implemented: 6 },
        { id: "FEAT-004", label: "Retrieve relevant context with provenance", rows: 4, implemented: 4 },
      ],
      status: "gap", gap: "Fixture gap: the shared index is printed whole under a cap, so the newest entries drop first.",
      ask: { question: "Fixture question: should memory move from a printed index to a searched store?", default: "keep the printed index",
        gains: "Fixture: no new moving part; misses entries past the cap.", cost: "easy to undo", otherwise: "Fixture: plan a searched-store lane." },
      evidence: ["packages/nana-setup/lib/shared-memory-config.mjs", "R-2343"], activity: { recentCommits: 0, inFlight: 0 } },
    { id: "key-cabinet", name: "Key cabinet", metaphor: "A locked cabinet for secrets", kind: "workflow",
      parts: [], features: [], status: "absent", gap: "Fixture gap: no component holds secrets.", ask: null,
      evidence: ["AGENTS.md"], activity: { recentCommits: 0, inFlight: 0 } },
    { id: "review-hall", name: "Review hall", metaphor: "A hall where a different reviewer reads each revision", kind: "governance",
      parts: ["packages/nana-pack/bin/pi-review.mjs", "packages/nana-pack/bin/review-round.mjs"],
      features: [{ id: "FEAT-007", label: "Review a specific revision independently", rows: 12, implemented: 11 }],
      status: "partial", gap: "Fixture gap: the review round is pinned, the reviewer's reading is not.", ask: null,
      evidence: ["packages/nana-pack/bin/pi-review.mjs", "FEAT-007"], activity: { recentCommits: 2, inFlight: 0 } },
    { id: "land-gate", name: "Land gate", metaphor: "A gate that opens only for a reviewed revision", kind: "governance",
      parts: ["packages/nana-pack/bin/nana-land.mjs"],
      features: [{ id: "FEAT-008", label: "Integrate and clean up reviewed changes", rows: 0, implemented: 0 }],
      status: "sound", gap: null, ask: null,
      evidence: ["packages/nana-pack/bin/nana-land.mjs", "FEAT-008"], activity: { recentCommits: 5, inFlight: 0 } },
  ],
};
writeFileSync("contract.json", JSON.stringify(contract, null, 2) + "\n");
writeFileSync("fixture.json", JSON.stringify(fixture, null, 2) + "\n");
```

Rules. The validator `checkComponentData(data, contract)` in `scripts/component-contract.mjs` (component-audit lane) returns a list of problem strings, empty when the document is valid:

1. The document's keys are exactly `documentFields`; `contract` is `"nana-components"`; `version` equals the contract's `version`; `project` is a non-empty string; `components` is a non-empty array.
2. Each component's keys are exactly `componentFields`. `id` matches `^[a-z][a-z0-9-]*$` and is unique. `name` and `metaphor` are non-empty strings. `kind` is one of `kinds`; `status` is one of `statuses`.
3. `parts` is an array of repo-relative paths (forward slashes, no leading `/`, no `..` segment). It is empty exactly when `status` is `absent`.
4. `features` is an array of objects whose keys are exactly `featureFields`: `id` matches `^FEAT-\d{3}$`, `label` is a non-empty string, `rows` is an integer of at least 0, and `implemented` is an integer from 0 to `rows`.
5. `gap` is `null` exactly when `status` is `sound`; otherwise it is a non-empty string.
6. `ask` is `null`, or an object whose keys are exactly `askFields`, each a non-empty string (the planner's five ask lines). `ask` is `null` when `status` is `sound`.
7. `evidence` is a non-empty array. Each item is a repo-relative path or an ID matching `^(R-\d{3,4}|G-\d{3}|FEAT-\d{3}|CAP-\d{2})$`.
8. `activity` has exactly `activityFields`, each an integer of at least 0. `recentCommits` counts commits on main inside the activity window that touch a part; `inFlight` counts unmerged `origin/feat/*` branches that touch a part.
9. Component order is display order. Whether a path or ID exists is the audit's check, not the contract's, because the page cannot see the repo.

Where the data lives and how the page loads it:

- The real audit is the tracked hand source `docs/components/nana-pi.json` (component-audit lane). It holds judgement only: features are FEAT IDs, and there is no `activity` key. `node scripts/component-audit.mjs --out <file>` writes the contract-shaped document, adding each feature's label and row counts from `REQUIREMENTS.md` and each component's activity from git. That output is built at Pages build time and never tracked, because activity changes with every commit.
- The page is `apps/hive/` (hive-render lane). It loads `components.json` from its own folder with `fetch("components.json")`, and is always served over http: GitHub Pages at `<pages root>/hive/`, or `node scripts/hive-page.mjs --serve` on loopback. It is never opened as a file URL, because browsers refuse ES module and fetch loads from `file://`.
- `node scripts/hive-page.mjs --out site/hive [--data <file>]` (hive-render lane) copies `apps/hive/` and writes `site/hive/components.json` from `--data`, defaulting to the fixture. Until the swap, it checks only `contract` and `version` against `contract.json`.

The swap. Neither lane knows it is second until the other lands. The second lane to land then merges main, does the swap in its own branch, and takes another review round on that change before it lands. The swap is:

1. In `.github/workflows/pages.yml`, the Pages build job runs `node scripts/component-audit.mjs --out "$RUNNER_TEMP/components.json"` before the hive step, and the hive step passes `--data "$RUNNER_TEMP/components.json"`.
2. `scripts/hive-page.mjs` refuses data that `checkComponentData` rejects, importing the validator rather than copying it, with one line naming the first problem.
3. `packages/nana-pack/tests/pages-workflow.test.mjs` and `packages/nana-pack/tests/hive-page.test.mjs` change to match, and the identity scan of `site/hive/components.json` stays.
4. One row pins the swap: R-3119 if component-audit does it, R-3139 if hive-render does. Its sentence: "WHEN the Pages build job runs, it shall build the hive's data with `component-audit --out` and pass it to `hive-page --data`, which shall refuse data that `checkComponentData` rejects."
5. The A-086 entry gains `Read by: A-086 · code: scripts/hive-page.mjs`, and any park line on it goes.

## What the hive encodes

- One chamber per component, in contract order. Workflow chambers form the central comb; governance chambers form the homes ring (O4).
- One hexagonal cell per feature in its chamber. Honey fill height is `implemented / rows`, and 0 when `rows` is 0. A component with no features gets one sealed dark cell.
- Material by status: `sound` warm honey, `partial` pale wax, `gap` dark open cell, `absent` sealed grey cap. Material by kind: governance chambers carry a distinct rim.
- Bees per component: `min(recentCommits + inFlight, BEE_CAP)`. In-flight bees fly a loop between the chamber and the hive entrance; recent bees hover over the chamber. No activity means no bees.
- Every component is a stop, as each 3dmk chapter is. A stop has a camera pose that frames its chamber, a rail marker, a `#<id>` hash and a frosted card. The card holds the component's name, metaphor, kind, status, gap sentence, ask question when present, and features with `implemented of rows`.
- All cards are in the DOM whatever the renderer, so they are the accessible reading, the phone reading, and what first-look's accessibility snapshot sees. One line names the renderer in use.
- After its first frame the page sets `data-hive-ready` on `<html>` to `webgl` or `pixel`. `?still`, or `prefers-reduced-motion: reduce`, holds bees and camera still.

## Planned files

- New app `apps/hive/`: `index.html`, `main.mjs` (scene, picking, hash focus, ready mark), `layout.mjs`, `camera.mjs` (the pure focus function), `text-layer.mjs` (rail and cards), `pixel.mjs`, `assets/hive.mjs`, `assets/cell.mjs`, `assets/bee.mjs`, `assets/materials.mjs`, `vendor/three.module.js`, `vendor/three.core.js`, `vendor/LICENSE`, optional `vendor/OrbitControls.js` (O1), `README.md` (what it is, runtime dependencies including the vendored three.js release, how to serve, build and test).
- New tooling: `scripts/hive-page.mjs` (`--out <dir> [--data <file>]`, `--serve [--port <n>] [--data <file>]`), `scripts/hive-page-config.mjs` (sealed values), `packages/nana-pack/tests/hive-page.test.mjs`, `packages/nana-pack/tests/hive-assets.test.mjs`.
- Shared, byte-identical: `docs/components/contract.json`, `docs/components/fixture.json`.
- Changed: `scripts/first-look.mjs` and `scripts/first-look-config.mjs` (the URL capture learns the ready wait, still motion and the empty-canvas check), `packages/nana-pack/tests/first-look.test.mjs`, `.github/workflows/pages.yml` (hive step and scan), `packages/nana-pack/tests/pages-workflow.test.mjs`, `code-map.config.json` (root `apps/hive`, ignore `apps/hive/vendor`), `readme-check.config.json` (add `apps/hive/README.md`), `docs/code-map.md`, `REQUIREMENTS.md` (FEAT-039 rows R-3120 to R-3133, artifact A-087), `docs/requirements-tree.md`, `README.md`, `docs/known-bugs/FEAT-039.md`, `HANDOFF.md`, `docs/sessions/`.

Artifact entry: `Artifact: A-087 · public hive page · CI record: ci: .github/workflows/pages.yml#github-pages · CI: .github/workflows/pages.yml, scripts/hive-page.mjs` with `Read by: A-087 · person: the owner reads the public hive page beside the product page`.

Merge forecast: both lanes append rows to the FEAT-039 table and regenerate the outline and code map. The second lane to land keeps both blocks and regenerates. The two shared JSON files merge cleanly when their bytes match.

Swap timing, stated plainly: neither lane knows it is second until the other lands. When component-audit lands first, this lane then merges main, adds the swap the shared contract describes, and takes another review round on that change before it lands. When this lane lands first, component-audit does the same.

Impact forecast from `npm run map:impact -- scripts/first-look.mjs scripts/first-look-config.mjs`: callers are `first-look.test.mjs`, `outside-reader.test.mjs`, `outside-reader.mjs` and `outside-reader-config.mjs`. outside-reader imports `PRODUCT_VIEWS` and `VIEWPORT_WIDTHS`; keep both names and values unchanged.

## Precedent

- `apps/desk/public/desk-client.mjs`: a browser ES module whose core takes no DOM ids and is tested from Node (`apps/desk/test/live-feel.test.mjs`). Follow it for `layout.mjs`, `camera.mjs`, `text-layer.mjs` and `pixel.mjs`.
- `apps/desk/server.mjs`: loopback-only bind and path containment for a static folder. Follow it for `--serve`; do not import it (A11).
- `scripts/product-report.mjs`: the `--out` CLI shape, atomic writes and refusing bad input with a named line. Its Pages step is the one the hive step sits after.
- `scripts/product-report/template.html`: light and dark colour tokens and type for the cards, so the two public pages look related.
- `scripts/first-look.mjs`: its existing URL mode (`--page desk --before <url> --after <url>`) already captures a served page at both sealed widths. Reuse that path for the hive, with no merge-base worktree logic. Whether the mode keeps the `desk` name with a hive switch or becomes `--page url` is the builder's call; it reports the choice and keeps `--page desk` working.
- `scripts/playwright-resolve.mjs`: the one way to find Playwright and print its install line.
- `packages/nana-pack/tests/pages-workflow.test.mjs`: the workflow text checks R-3130 extends; R-2980 and R-2985 stay green unchanged.
- `code-map.config.json`: roots, `ignore` and the `exempt` reasons, the nearest shape for keeping vendored code out of the six-tag header rule.
- `readme-check.config.json`: where a new README joins the README contract.
- Pixel view: none: the repo has no canvas or WebGL code.
- Vendored third-party code: none: the repo vendors nothing; the closest is code-map's content-pinned exempt files, whose bytes are also sealed.
- `npm run map:search` results taken: `apps/desk/server.mjs` and `apps/desk/apps.mjs` for loopback serving, `scripts/first-look.mjs` for browser capture, `apps/desk/public/desk-client.mjs` for a tested browser module, `packages/nana-pack/lib/rulings-config.mjs` for the sealed-config style.

## Outside precedent

three.js (MIT), release 0.186.1: adopt, vendored unminified (A2). It is the renderer, geometry and material library; the lane writes only the hive's own assets, layout, camera and page. Keep its `LICENSE` beside the vendored files.

Other public reference: https://3dmk.com/ for the look. Borrow one stop per component (camera pose, frosted card, rail marker, linkable hash), small monospace labels with leader lines, and square rail markers. Skip the single 7 MB file, the scale-to-planet zoom and the persona voice. It states no licence and no code is taken. Cite the URL only, never its author.

## Must-meet

Each test sits in `packages/nana-pack/tests/hive-page.test.mjs`, `hive-assets.test.mjs`, `pages-workflow.test.mjs` or `first-look.test.mjs`, with its `// req:` marker directly above it. Each row names one behaviour, so a failure names one behaviour.

1. R-3120 · Layout is stable and never overlaps. Proves: `layout(data)` gives one chamber per component in contract order, one cell per feature, one dark cell for a component with no features, and governance chambers in the homes ring. Pins: for the fixture and for a generated 40-component, 200-feature document, two calls return identical positions, no two cells are closer than one cell width, and every governance chamber lies outside every workflow chamber's bounds.
2. R-3121 · Honey and status follow the data. Proves: each cell's fill is `implemented / rows` (0 when `rows` is 0) and each chamber's material key comes from its status and kind. Pins: fixture cells give fills 0.9 (workshop), 0.75 and 1 (library), 11/12 (review hall) and 0 (land gate, zero rows); the material table's status and kind keys equal `statuses` and `kinds` read from `docs/components/contract.json`, so a new status fails here.
3. R-3122 · Bees show activity. Proves: bees per component are `min(recentCommits + inFlight, BEE_CAP)`, split into in-flight and recent bees. Pins: the fixture's workshop gets 3 recent and 1 in-flight bee, a quiet component gets none, and activity above the cap gives exactly `BEE_CAP` bees.
4. R-3123 · Assets are reusable and low-poly. Proves: `assets/hive.mjs`, `cell.mjs`, `bee.mjs` and `materials.mjs` export builders that take `THREE` as an argument and run in Node against the vendored build. Pins: a cell stays within `CELL_TRIANGLE_BUDGET` triangles and a bee within `BEE_TRIANGLE_BUDGET`.
5. R-3124 · The vendored three.js is the pinned release. Proves: the two vendored files are the 0.186.1 release bytes under their licence. Pins: `vendor/three.module.js` and `vendor/three.core.js` each match their sealed sha256; `vendor/LICENSE` is the MIT licence reading "Copyright © 2010-2026 three.js authors".
6. R-3125 · Each chamber has a camera stop that frames it. Proves: `focus(layout, id)` in `camera.mjs` is a pure function returning a camera pose for that chamber. Pins: for every fixture component, at aspects 380/1000 and 1280/800, every corner of the chamber's bounding box projects inside the viewport; an unknown id returns the whole-hive pose.
7. R-3126 · The rail and the cards tell each component's story. Proves: the rail lists every component in contract order, and `#<id>` makes that component's card the active one. Pins: for the fixture, the rail holds five markers in order linking `#workshop` to `#land-gate`; with hash `#library`, the active card shows its name, metaphor, status, gap, ask question and both features' counts; an unknown hash leaves the landing card active.
8. R-3127 · The renderer falls back to pixel, and bad data reads as an error. Proves: the choice is WebGL when a context can be made, else pixel, and `?view=pixel` forces pixel. Pins: a stub returning no WebGL context gives `pixel`; data with another contract name or version gives one plain error line and no scene.
9. R-3128 · The pixel view draws the hive. Proves: `pixel(layout)` draws one hex per cell on a fixed small grid, with the honey fill and the status colour. Pins: for the fixture the draw list holds one hex per cell, each filled to its R-3121 fill in its status colour, and none outside the grid.
10. R-3129 · The page says when it has drawn, and can hold still. Proves: after its first frame the page sets `data-hive-ready` to the renderer used; under `?still` or reduced motion, the animation step returns the same bee and camera state on every tick. Pins: the ready setter runs once with `webgl` or `pixel`; two ticks under still give identical state; without still they differ.
11. R-3130 · The page builds for Pages from any contract data. Proves: `node scripts/hive-page.mjs --out <dir>` writes `index.html`, the modules, the vendored files and `components.json` from the fixture, or from `--data <file>`. Pins: the output holds exactly the files of `apps/hive/` minus its README plus `components.json`, byte for byte; a data file with another contract name or version exits 1 with one line and leaves no output folder.
12. R-3131 · Pages publishes the hive beside the product page. Proves: the Pages build job runs `node scripts/hive-page.mjs --out site/hive` after the product page step, and runs the identity scan on `site/hive/components.json` before upload. Pins: the step order and scan line in `.github/workflows/pages.yml`; `site/index.html` is still written by the product page step; R-2980 and R-2985 pass unchanged.
13. R-3132 · The local server stays on loopback inside its folder. Proves: `node scripts/hive-page.mjs --serve` binds 127.0.0.1 only, prints its URL, and serves nothing outside the served folder. Pins: the printed URL's host is `127.0.0.1`; a request for `../package.json` gets 404.
14. R-3133 · first-look captures the drawn hive. Proves: first-look's URL capture, used on the hive, waits for `data-hive-ready`, emulates `prefers-reduced-motion: reduce`, and fails by name on an empty canvas. Pins: with an injected browser, the capture waits for the attribute before each screenshot at both sealed widths; it sets reduced motion; when the canvas's centre pixels equal the sealed background colour it exits 1 with `first-look: the hive canvas is empty`; a ready wait past its sealed timeout fails with one named line.

## Seat look

After build 1, the seat runs `node scripts/hive-page.mjs --serve`, then first-look's URL capture on the printed URL, saving outside git. It looks at both screenshots and the snapshot, and checks that `scrollWidth <= innerWidth` at 380 px and that a vertical swipe on the canvas scrolls the page. Before the final review, it pushes the tip to its draft pull request and reads both the Pages build and the Windows suite leg. outside-reader waits for a hive view list (A12).

## Expected test changes

A forecast, not a limit: `packages/nana-pack/tests/pages-workflow.test.mjs` gains R-3131; `packages/nana-pack/tests/first-look.test.mjs` gains R-3133's case and keeps the desk case green; the suite's tree check and the code-map check see new rows, a new root and an ignored vendor folder; the readme check reads the new app README.
