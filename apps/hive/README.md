# The hive

A separate static preview of nana-pi's components: a low-poly hive, a pixel fallback and readable component stories. It does not replace the product report. The visual reference is https://3dmk.com/; no code or assets come from that site.

## Install

Runtime dependencies: Node.js 22 or later for the publisher and local server; a modern browser with ES modules, fetch and Canvas 2D. WebGL2 enables 3D. Three.js 0.186.1 is vendored unmodified under `apps/hive/vendor/` with its MIT licence, so no package installation, CDN or font service is needed. Playwright is optional for first-look captures; the existing resolver finds the repository's toolchain.

## Run

From the repository root:

```sh
node scripts/hive-page.mjs --serve
```

Open the printed loopback URL, never a file URL. The server uses an available port; `--port` selects one. Add `?view=pixel` for the pixel renderer, or `?still` for a static frame. Reduced-motion preference also holds motion still. Drag horizontally to orbit, pinch to zoom, and swipe vertically to scroll. Tap a chamber or use the component rail to focus it. Component hashes are shareable. All cards remain readable below the scene on a phone.

```sh
node scripts/hive-page.mjs --out /tmp/nana-hive-preview
node scripts/hive-page.mjs --out /tmp/nana-hive-custom --data docs/components/fixture.json
```

Choose an absent output folder: the publisher refuses an existing folder and stages the complete output before renaming it. The default data is the frozen fixture, not a live audit. The publisher checks the contract name and version; complete validation arrives with the audit lane's swap. `--data` also works with `--serve`.

The output is the app minus this README, plus the component data. Pages publishes it beside the product page. Assets take THREE explicitly; layout, focus, text, raster and frame state work from Node without a DOM or graphics context. Visual values live in `apps/hive/config.mjs`; release hashes live in `scripts/hive-page-config.mjs`.

Capture served URLs with the existing first-look URL path (desk mode remains supported):

```sh
node scripts/first-look.mjs --page url --hive --before http://127.0.0.1:8000 --after http://127.0.0.1:8000 --out /tmp/nana-hive-look
```

The capture reduces motion, waits for the renderer-named ready mark and refuses an empty centre region. The text layer states the renderer used. The URL's pixel query chooses the fallback for a second capture.

## Test

```sh
node packages/nana-pack/tests/hive-page.test.mjs
node packages/nana-pack/tests/hive-assets.test.mjs
node packages/nana-pack/tests/first-look.test.mjs
node packages/nana-pack/tests/pages-workflow.test.mjs
npm run test:locked
```

The suite tests geometry, contract fixtures, camera bounds, reading models, raster draws, serving, publication and capture order. Real WebGL appearance, phone scrolling and browser gestures need a served-page look. A component's status is an audit judgement; honey reflects implemented requirement counts, not recent passing test runs. Bees count activity, not success. Many components make small cells in the whole-hive view; focus a component to inspect it. Pixel mode shows the whole diagram and uses the same rail and cards, without an orbit camera. Outside-reader's product-specific view list is not used for this preview.
