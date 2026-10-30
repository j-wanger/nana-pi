# The hive

A static city map of how nana turns one wish into shipped work: a reception tower, a fenced factory park, town services and customer towns. Scroll follows one request; Explore selects without entering. The product report remains separate. The visual reference is https://3dmk.com/; no code or assets come from that site.

## Install

Runtime dependencies: Node.js 22 or later for publishing and serving; a browser with ES modules, fetch and Canvas 2D. WebGL2 enables 3D. Three.js 0.186.1 is vendored unmodified under `apps/hive/vendor/` with its MIT licence. No package installation, CDN or font service is needed. Optional Playwright powers captures and the phone gesture check through the existing resolver.

## Run

From the repository root, serve the frozen component fixture against the real city plan:

```sh
node scripts/hive-page.mjs --serve
```

Open the printed loopback URL, not a file URL. The server chooses an available port; `--port` overrides it. Scroll or swipe vertically to follow the request. The rail and phone chapter picker share fourteen numbered chapters. Every short scroll maps to a fractional camera stage. The page alone drives the camera, including native smooth scrolling from rail and picker clicks. Travel-weighted spans cover eight viewport heights. Cards cross-fade over each span's final 15 percent. Stopping input leaves stage and camera unchanged; there is no idle settle or separate camera flight. Plain, Technical and From the work change the one frosted card's reading voice.

Explore leaves the scroll tour. A tap selects without changing the camera or hash. Drag to orbit and pinch within bounded zoom limits. Only Enter enters a structure. Back to tour returns to its chapter. Hashes include `#signal`, `#drafting-table`, `#workshop`, `#identity-scan`, `#explore`, `#explore/workshop` and `#enter/workshop`. Add `?still` to stop animation or `?view=pixel` for the fallback. Reduced motion and still mode stop animation, but scrolling still blends continuously between chapter poses. Dashed traces show the stopped pulses. Pixel mode keeps cells and the fence, and says that streets are in 3D only.

For real data:

```sh
node scripts/component-audit.mjs --out /tmp/nana-components.json
node scripts/hive-page.mjs --serve --data /tmp/nana-components.json
```

To publish into an absent folder:

```sh
node scripts/hive-page.mjs --out /tmp/nana-hive-preview
node scripts/hive-page.mjs --out /tmp/nana-hive-custom --data /tmp/nana-components.json
```

The publisher checks component data and the city plan before output. It atomically stages the app minus this README plus components.json. Pages builds the real audit, publishes the city and scans the data before upload, retaining the product index. The frozen v1 component contract and fixture stay unchanged.

`apps/hive/city.json` is the hand source: places, bearings, forms, declared handoffs, residents and journey narration. Plain reads the fourteen title/text pairs verbatim. Technical keeps component data; side places remain selectable in Explore. No coordinates, radii or counts belong there. `apps/hive/city.mjs` checks it and computes radial positions and clear streets. The tower stands alone on the central plaza at the origin. Park halls ring it in several radial bands, with no inner fence. The gate, customs and freight face north, with customers beyond. The fence has an entry and one work exit. Courthouse, records and style occupy the same civic quarter.

Ground streets are shaded solid white trays with raised kerbs and density-faded ink outlines. The journey has two lanes; locals stay narrow. A raised ring stands on piers, with sloped approaches. Gatehouses and painted tray names mark the mouths. Ink packet boxes keep their lanes. Back routes are solid and share the entry crossing. Air dashes appear only in their chapter. A pulse falls from the owner's craft; its arrival dispatches the request packet along the journey tray. The library broadcasts expanding rings toward the bays. Every ground lot has a door facing its own district street or the avenue. A malformed plan refuses the page. Drift renders: an unplaced component gets a vacant lot marked No place yet; a place missing from the audit stays complete and dark, marked Not in audit. The tracked-tree test rejects either drift.

Windows carry audit status: lit means sound, half-lit means partial or gap, and dark means absent or future. Dark lots keep their target form. Four workshop bays provide two lit crews and two dark capacity lots. A shared jointed white figure kit has ink outlines, grey accents, role equipment and soft contact shadows. The seat turns the dish; planner and adversary exchange a sheet. Three builders carry blocks at each lit bay, including a runner from the yard, while its frame grows. The judge raises a card, reviewers climb and stamp, the librarian turns reels, and customs lifts a barrier. Dark future lots have no workers. Still and reduced motion hold clear poses. Unnamed neutral houses fill the town between named places. Recent and in-flight activity remain capped data, not duplicate idle figures or success claims. The audit is a judgement, not a current test result. Feature cells retain their exact implemented-row fill ratios.

Each chapter supplies one camera keyframe. Blends interpolate orbit distance logarithmically and pull back during distant target moves. Streets join neighbouring halls, a plaza avenue, a town ring and short local links. The overview fits projected corners, including the housing belt, over the full viewport. Label safe bands follow the actual controls.

Shape controls use a serve-only override containing `{ "place-or-component-id": [x, z] }`:

```sh
node scripts/hive-page.mjs --serve --data /tmp/nana-components.json --layout /tmp/nana-layout.json
```

The override deliberately permits invalid street geometry for near-miss renders. `--layout` is refused with `--out`, so publication cannot ship a control. Missing override data is normal for a published page. Historical grid and oval positions and the two near-miss controls live in `packages/nana-pack/tests/fixtures/hive-city-controls.json`.

Capture the served page and check its actual phone wiring:

```sh
node scripts/first-look.mjs --page url --hive --before http://127.0.0.1:8000 --after http://127.0.0.1:8000 --out /tmp/nana-hive-look
node scripts/hive-gesture-check.mjs --url http://127.0.0.1:8000 --out /tmp/nana-hive-gestures
```

Captures wait for the renderer-named ready mark after the requested pose. Pixel fallback is not WebGL acceptance. The gesture check uses real scene hit testing, sixty short wheel ticks, five short swipes, two-second idle pose comparisons, a mid-scroll native smooth picker scroll, a full phone scroll and five street/ground pixel pairs. Output folders must be outside git.

## Test

```sh
node packages/nana-pack/tests/hive-city.test.mjs
node packages/nana-pack/tests/hive-page.test.mjs
node packages/nana-pack/tests/hive-assets.test.mjs
node packages/nana-pack/tests/first-look.test.mjs
node packages/nana-pack/tests/pages-workflow.test.mjs
npm run test:locked
```

Assets take THREE explicitly. Shared boxes, drums, hoops, beams, fences and ribbons live in `apps/hive/assets/parts.mjs`. District forms use that kit. Low-poly residents follow the bee builder's explicit THREE pattern. Release hashes live in `scripts/hive-page-config.mjs`; all sealed city values live in `apps/hive/config.mjs`. Pure city, layout, tour, focus, text and gesture models run in Node. Tests use temporary output folders, geometry controls, actual EventTarget bindings and atomic publication. Served-page captures still judge WebGL appearance and phone scrolling.

On load, the opening chapter stands at the page's initial scroll position. No timed opening moves the camera away from the reader's position. Visual acceptance remains a served-page judgement, not a unit-test claim.

The former graph-only fields in NAVIGATION remain unread to preserve the unchanged gesture contract. Detailed neighbouring towns remain later work. Outside-reader's product-specific view list is not used for this city.
