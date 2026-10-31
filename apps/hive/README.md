# The hive

A static city map of how nana turns one wish into shipped work: a reception tower, a fenced factory park, town services and customer towns. Scroll follows one request; Explore selects without entering. The product report remains separate. The visual reference is https://3dmk.com/; no code or assets come from that site.

## Install

Runtime dependencies: Node.js 22 or later for publishing and serving; a browser with ES modules, fetch and Canvas 2D. WebGL2 enables 3D. Three.js 0.186.1 is vendored unmodified under `apps/hive/vendor/` with its MIT licence. No package installation, CDN or font service is needed. Optional Playwright powers captures and the phone gesture check through the existing resolver.

## Run

From the repository root, serve the frozen component fixture against the real city plan:

```sh
node scripts/hive-page.mjs --serve
```

Open the printed loopback URL, not a file URL. The server chooses an available port; `--port` overrides it. Scroll or swipe vertically to follow the request. The rail and phone chapter picker share fourteen numbered chapters. Every short scroll maps to a fractional camera stage. The page alone drives the camera, including native smooth scrolling from rail and picker clicks. Each chapter gets one reading screen plus at most half a screen for travel. The first half holds the subject; eased camera travel occupies the latter half. In the final 15 percent the outgoing card fades fully before the next fades in, with a small upward slide. Text never overlaps. One animation loop follows the page target with a critically damped 0.15-second response, settling exactly within about half a second. It never overshoots the target stage or continues into a new chapter on its own. After settling, the camera stays still. The scroll listener only records the target. Card work runs on chapter or fade-bucket changes, not wheel events. Plain, Technical and From the work change the one frosted card's reading voice.

Explore leaves the scroll tour. A tap selects without changing the camera or hash. Drag to orbit and pinch within bounded zoom limits. Only Enter enters a structure. Back to tour returns to its chapter. Hashes include `#signal`, `#drafting-table`, `#workshop`, `#identity-scan`, `#explore`, `#explore/workshop` and `#enter/workshop`. Add `?still` to stop animation or `?view=pixel` for the fallback. Reduced motion and still mode stop animation and skip the initial descent to chapter 01 when no hash is supplied. Explicit chapter hashes, including the whole-city overview, retain their destinations. Scrolling still blends continuously between chapter poses. Dashed traces show the stopped pulses. Pixel mode keeps cells and the fence, and says that streets are in 3D only.

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

Ground streets are shaded solid white trays with raised kerbs and density-faded ink outlines. The journey has two lanes; locals stay narrow. A raised ring stands on piers, with sloped approaches. Gatehouses and painted tray names mark the mouths. Carryable mid-grey crates with ink edges keep their lanes. Worker height is the 1.8-unit reference: a crate is 0.28 worker heights (about half a metre) and occupies 40 percent of a lane. The request uses that same crate with a white beacon. Ring crates ride flat pallets; freight trucks leave loaded and return empty. Dimensions derive once from the worker height in the config. Back routes are solid and share the entry crossing. Air dashes appear only in their chapter. A pulse falls from the owner's craft; its arrival dispatches the request packet along the journey tray. The library broadcasts expanding rings toward the bays. Every ground lot has a door facing its own district street or the avenue. A malformed plan refuses the page. Drift renders: an unplaced component gets a vacant lot marked No place yet; a place missing from the audit stays complete and dark, marked Not in audit. The tracked-tree test rejects either drift.

Entrance windows and broad rooftop clerestories carry audit status: lit means sound, half-lit means partial or gap, and dark means absent or future. Lit roofs remain visible from above; dark roofs have no lit strip. Dark lots keep their target form. Four workshop bays provide two lit crews and two dark capacity lots. A shared jointed white figure kit has ink outlines, grey accents, role equipment and soft contact shadows. The seat turns the dish; planner and adversary exchange a sheet. Three builders carry crates at each lit bay, including a carrier on the yard's actual tray route. A runner carries the drafting sheet to the yard. Four interpolated limb poses make carrying, climbing and operating readable. Sparse town residents walk local trays at lower density. The tower has a descending crate lift; drafting feeds the sheet between desks; dispatch has a translating gantry and each bay a swinging jib with a stepped rising frame. Inspection turns its crate under a viewing frame. Review has a stair lift and stamp arm. The land gate's twin leaves require a stamped crate inside their arrival zone. Customs raises a barrier and lights a scanner; freight trucks return empty. Theater reels turn and rings broadcast from its roof. A courthouse clock and a water-tower wheel animate the town. Work mechanisms loop every four seconds. Bay jibs stand above and in front of the opened roof, with broader swings and an offset inspection load. Checkpoint porches leave the central operating lane open so workers and leaves remain visible. Dark future lots have no workers or moving mechanisms; their cargo beacons stay unlit. Still and reduced motion hold clear poses. Five quiet house types face local trays in separated blocks: pitched roofs, terraces, two-storey homes, rows of three and tree yards. Narrow height variation, setbacks and gaps replace the global housing grid. Recent and in-flight activity remain capped data, not duplicate idle figures or success claims. The audit is a judgement, not a current test result. Feature cells retain their exact implemented-row fill ratios.

Each chapter supplies one camera keyframe. Blends interpolate orbit distance logarithmically and pull back during distant target moves. Streets join neighbouring halls, a plaza avenue, a town ring and short local links. Both chapter and overview poses fit projected corners, avoiding an oversized bounding sphere while retaining the complete building. The overview includes the housing belt over the full viewport. Label safe bands follow the actual controls. On phones the projection centre shifts into the band between the header and the measured card top, without changing the chapter target.

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

Captures wait for the renderer-named ready mark after the requested pose. Pixel fallback is not WebGL acceptance. The gesture check uses real scene hit testing, sixty short wheel ticks, five short swipes, two-second idle pose comparisons after settling, a mid-scroll native smooth picker scroll, a full 390 px phone scroll, target framing, reading spans, sequential boundary fades and five street/ground pixel pairs. Add `--scroll` for ten-second short-wheel and continuous-scroll measurements at 1280 and 390 px on headless Metal: frame p95, long tasks, camera steps, reversals, settling and draw/shadow/geometry/layout counters. Camera steps are measured relative to the previous eye-target distance; stationary chapter holds separate route legs. Output folders must be outside git.

## Test

```sh
node packages/nana-pack/tests/hive-city.test.mjs
node packages/nana-pack/tests/hive-page.test.mjs
node packages/nana-pack/tests/hive-assets.test.mjs
node packages/nana-pack/tests/first-look.test.mjs
node packages/nana-pack/tests/pages-workflow.test.mjs
npm run test:locked
```

Assets take THREE explicitly. Shared boxes, drums, hoops, beams, fences and ribbons live in `apps/hive/assets/parts.mjs`. District forms use that kit. Low-poly residents follow the bee builder's explicit THREE pattern. The browser batches immutable solids and density-faded edges, preserving component hit-test ranges and selected-road shading. Articulated joints remain separate. Distant crews and traffic retain a minimum ink point at the existing outline threshold, so the whole-city view shows life without enlarging the shared human/crate geometry. Static architecture casts shadows cached once at full height behind the opaque opening; moving workers retain soft contact shadows. Scroll never rebuilds geometry or sun shadows. Overlay and label measurements are cached until chapter, visible-card, voice or viewport changes. Release hashes live in `scripts/hive-page-config.mjs`; all sealed city values live in `apps/hive/config.mjs`. Pure city, layout, tour, focus, text and gesture models run in Node. Tests use temporary output folders, geometry controls, actual EventTarget bindings and atomic publication. Served-page captures still judge WebGL appearance and phone scrolling.

On load without a hash, a plan drawing with the city's wide journey, ring, narrow local streets and simple building footprints appears below a clear title and Scroll to enter invitation. Signal pulses loop without moving the camera. The first scroll span raises the city into 3D and descends onto the reception tower at chapter 01. No timed opening moves the camera away from the reader's position. Visual acceptance remains a served-page judgement, not a unit-test claim.

The former graph-only fields in NAVIGATION remain unread to preserve the unchanged gesture contract. Detailed neighbouring towns remain later work. Outside-reader's product-specific view list is not used for this city.
