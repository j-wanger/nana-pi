# Attack: hive-render plan (2026-10-29)

Counts: 3 MUST, 5 SHOULD, 5 NOTE.

## MUST

M1. The vendored files A2 names do not exist. `npm pack three@0.186.1` holds no `build/three.module.min.js` and no `build/three.core.min.js`. Its build folder has only unminified files: `three.module.js` (663 KB) and `three.core.js` (1.46 MB), which come to 2.12 MB tracked and about 420 KB gzipped. Minifying them ourselves would break A3, which says there is no build step. Fix: vendor `three.module.js` plus `three.core.js`, restate the cost as about 2.1 MB, and seal those two hashes.

M2. The must-meets pin plumbing, not the experience. All eight rows can pass on five turning hex clumps. 3dmk feels built because every component is a stop. Each stop gets a camera pose that frames it, a frosted card with that component's story, a rail marker and a hash. No row pins any of those. The ask question, the part that could replace the product page, sits only in a DOM list. Fix: add one row, with `focus(layout, id)` as a pure function. It returns a camera pose whose view frustum holds every cell of that chamber at aspects 380/1000 and 1280/800. The rail lists every component in contract order. `#<id>` makes that component's card active, and the card shows its name, metaphor, status, gap, ask and feature counts. Keep turn-and-tap; this stop is what makes it built.

M3. The seat look cannot yet show what the scene drew. first-look takes its screenshots after `waitUntil: "load"` (`scripts/first-look.mjs` near line 116). The hive's module graph, the `fetch("components.json")` and its first frame all finish after `load`, so the screenshot can be blank or half drawn. The bees also make every screenshot different. Probe result: Playwright 1.61.1's headless Chromium on this Mac returns `webgl2: true` on `ANGLE (… SwiftShader driver)`, so a real WebGL capture is possible. Fix: after its first frame, the page sets `document.documentElement.dataset.hiveReady = "webgl" | "pixel"`. The hive capture waits for that attribute and emulates `prefers-reduced-motion: reduce`. It also fails by name when the canvas's centre pixels equal the background colour.

## SHOULD

S1. Subtraction: first-look already has a URL mode, `--page desk --before <url> --after <url>`, which captures a served page at both sealed widths. Reuse or rename that mode (`--page url`) rather than adding a hive mode with merge-base worktree logic. This removes half of R-3127 and the usage-line churn.

S2. Rows are wider than their tests. R-3127 pins loopback serving, path containment, a capture mode and the Playwright-missing exit, which are four behaviours. R-3123 pins reusability, two triangle budgets, the hashes and the licence. Split each so a failure names one behaviour.

S3. Phone: nothing pins A9, and OrbitControls (O1) blocks scrolling on phones. OrbitControls sets `touch-action: none` on its element. A canvas across the top of a 380 px screen then swallows the vertical swipe that should reach the text below. Fix: cap the canvas at about 60 percent of the viewport height. Either keep `touch-action: pan-y` and orbit with one-finger horizontal drag plus pinch, or arm the controls only after a tap. Add to the seat look a check that `scrollWidth <= innerWidth` at 380 px.

S4. The pixel fallback has no pin beyond the renderer choice. If `pixel.mjs` draws nothing, the fallback is just the text layer. Pin `pixel(layout)` to give one hex per cell, with the honey fill and the status colour, on a fixed small grid.

S5. The swap timing is understated. Neither lane knows it is second until the other lands. The second lane must then merge main, add the swap, and take a confirmation round. Say so in both merge forecasts.

## NOTE

N1. Lane class verified: `node scripts/lane-class.mjs --root . --files <the plan's list>` prints `ordinary` on `a2ad3f21`. One final reviewer is enough.

N2. The shared contract holds. The two sections `diff` identical. Running the literals regenerates both files with exactly the stated sha256 values (`ea48a61…`, `09d3057…`).

N3. The identity scan exits 0 on `three.module.js`, `three.core.js` and `OrbitControls.js` from 0.186.1. `LICENSE` reads "The MIT License / Copyright © 2010-2026 three.js authors", which matches R-3123's pin.

N4. A5 holds. In Node, `import('…/build/three.module.js')` loads, and `new CylinderGeometry(1,1,1,6,1)` gives 24 triangles with no DOM. The module build imports `./three.core.js` relatively, and OrbitControls imports bare `three`, so one import-map entry covers both.

N5. Some ceremony can go. Drop "`package.json` hive script, if wanted",. A12's outside-reader run reads the same landing five times and adds nothing once M2's hashes exist. Run it after M2 lands, with `#<id>` views. Inferred, not observed: newer Chromium may put SwiftShader WebGL behind `--enable-unsafe-swiftshader`. Add that flag if a later Playwright returns no context.

Claim I'd most expect to be wrong: M2's frustum pin at 380 px may be fussy to state exactly. Projecting the chamber's bounding box inside the viewport would do.
