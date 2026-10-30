# The hive

A static component atlas of nana-pi: a numbered lane loop, recorded roads, a scroll tour and deliberate free exploration. The product report remains separate. The visual reference is https://3dmk.com/; no code or assets come from that site.

## Install

Runtime dependencies: Node.js 22 or later for publishing and serving; a browser with ES modules, fetch and Canvas 2D. WebGL2 enables 3D. Three.js 0.186.1 is vendored unmodified under `apps/hive/vendor/` with its MIT licence. No package installation, CDN or font service is needed. Optional Playwright powers captures and the phone gesture check through the existing resolver.

## Run

From the repository root, serve the paired fixtures:

```sh
node scripts/hive-page.mjs --serve
```

Open the printed loopback URL, not a file URL. The server chooses an available port; `--port` overrides it. Scroll to follow the numbered chapters. On a phone, vertical swipes scroll the same tour. The rail and phone chapter picker share the tour order. Plain, Technical and From the work change the one frosted card's reading voice.

Explore leaves the scroll tour. A tap selects a structure without moving the camera or changing the hash. Drag to orbit and pinch within bounded zoom limits. Only Enter enters a structure. Back to tour returns to its chapter. Hashes are shareable: `#drafting-table` opens its chapter, `#explore` opens the whole-loop exploration, `#explore/workshop` selects without entering, and `#enter/workshop` enters. Add `?still` to stop animation or `?view=pixel` for the fallback. Reduced motion snaps to chapter anchors. Pixel mode keeps the published positions, overview roads and stories, without a camera.

For real data:

```sh
node scripts/component-audit.mjs --out /tmp/nana-components.json
node scripts/component-graph.mjs --out /tmp/nana-graph.json
node scripts/hive-page.mjs --serve --data /tmp/nana-components.json --graph /tmp/nana-graph.json
```

To publish into an absent folder:

```sh
node scripts/hive-page.mjs --out /tmp/nana-hive-preview
node scripts/hive-page.mjs --out /tmp/nana-hive-custom --data /tmp/nana-components.json --graph /tmp/nana-graph.json
```

The publisher requires `--data` and `--graph` together, checks both before output, and atomically stages the app minus this README plus components.json and graph.json. Pages runs audit, graph derivation, publication, then identity scans of both documents, retaining the product index.

The frozen v1 component contract and fixture stay unchanged. The sibling graph contract lives in `docs/components/graph-contract.json`. Its nodes publish positions once in Node; browsers never run the spring. Spine slots follow equal street distances around an oval. Every stage fronts the closed street within one world unit of its published footprint. Support springs cannot displace the spine. `docs/components/loop.json` holds only the nine spine stages and support, gate or outside chapter assignments. The deriver refuses missing, duplicate or unknown components and hand-written positions or edges.

Roads mean relationships, not adjacency: distinct import links, artifact IDs, deliverable rows or shared feature IDs. The overview draws only the wide loop street and narrower chapter spurs, with zero crossings on the saved base graph. Flat ribbons carry edge lines and broken lane marks below the foundations. Selection adds thin incident artifact, import and shared-feature lines on the ground. Chapter ties and loop segments without a recorded relationship are explicitly declared, not inferred. Routed roads can share bends and street junctions instead of crossing. Stage, Key cabinet and Night shift share one compact depot yard beside their strongest related stage, falling back to Notice board. The rail names them Depot rather than inventing stage 10. The spring and visibility routing live in `scripts/component-graph-layout.mjs`. Geometry and crossing limits live in `scripts/component-graph-config.mjs`; browser values live in `apps/hive/config.mjs`. The deriver prints counts in their units and crossings without pinning the live graph's counts. The saved base graph pins geometry independently of later code changes. Compact ellipse slots and minimum full-size live foundations keep the buildings close; absent parts retain their small empty footings.

Capture the served page and check its actual phone wiring:

```sh
node scripts/first-look.mjs --page url --hive --before http://127.0.0.1:8000 --after http://127.0.0.1:8000 --out /tmp/nana-hive-look
node scripts/hive-gesture-check.mjs --url http://127.0.0.1:8000 --out /tmp/nana-hive-gestures
```

The capture waits for the renderer-named ready mark after the linked chapter's scroll and pose. A pixel fallback needs another capture for WebGL acceptance. The gesture check uses a touch viewport and real scene hit testing. Output folders must be outside git.

## Test

```sh
node packages/nana-pack/tests/hive-graph.test.mjs
node packages/nana-pack/tests/hive-page.test.mjs
node packages/nana-pack/tests/hive-assets.test.mjs
node packages/nana-pack/tests/first-look.test.mjs
node packages/nana-pack/tests/pages-workflow.test.mjs
npm run test:locked
```

Assets take THREE explicitly. Shared beams, fences and flat street ribbons live in `apps/hive/assets/parts.mjs`; release hashes live in `scripts/hive-page-config.mjs`. Pure graph, layout, tour, focus, text and gesture models run in Node. The tests use temporary git fixtures, geometry goldens, actual EventTarget bindings and atomic publication. Served-page captures still judge real WebGL appearance and phone scrolling.

Status is an audit judgement, not a current test result. Feature cells retain implemented-row fill; absent components retain empty foundations. Bees count activity, not success. The library retains its archive form pending the later structure-animation lane. Outside-reader's product-specific view list is not used for this atlas.
