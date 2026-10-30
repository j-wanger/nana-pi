Feature: FEAT-039 · See the product and its decisions in one report

Lane shops-flows. Class: ordinary. Builder: pi-worker (larger lane). Build session 1.

Build to the plan of record, `docs/reviews/shops-flows-2026-10-29/plan.md` (revision 2), which has taken the adversary's attack in `plan-attack.md`. Build rows R-3161 to R-3169 exactly as its must-meet section says. Roads are distinct pairs with one shop end and the A-ID list they carry, running to the feature stops, as the plan reads it; the seat accepts that reading.

The owner's questions are posted as optional issue 270; build on the plan's defaults (one world, the 11-shop list as revised, buyers and restocks with "not measured" for untracked stores).

## The picture

The previous hive lane passed its plumbing tests and its first picture was rejected as "ai slop". Judge the picture as you build: serve the page with the real audit and shop data, run `npm run first-look -- --page url --after <url>#<view> --hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/shops-flows-2026-10-29/shops-art-spec.md --out <folder outside git>` for the overview, `#shop-project-memory` and `#flow-CAP-04`, at 380 and 1280 px. Check each 380 shot shows `RENDERER: WEBGL`; a pixel-view capture is a capture flake, so capture again. Judge each spec line yourself, pass or fail with one reason, up to three rounds. Do not start model sessions; the seat runs the visual judge after the build and shows the owner the frames before build 2. Never write into `/private/tmp/nana-3dmk-ref/`.

If build 1 runs long, stop after the data, the overview drawing and the shop and flow cards, and report what the plan moves to a later lane.

Write `shops-art-spec.md` first, as the plan's visual acceptance item 4 says.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

Every new row is `implemented` with backticked `file::title` evidence, and the v1 contract and fixture match their sealed sha256. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green. Push and report the finished CI run for the new tip, naming the Windows suite leg.

Report: the screenshot folder; the spec table; the built counts beside the plan's (roads by kind, buyers, restocks, the order findings); every row and test changed; each departure from the Precedent.

## Precedent

- `docs/components/contract.json`: the shape for the v2 contract.
- `scripts/component-contract.mjs`: `checkComponentData`, beside which `checkShopData` sits.
- `scripts/deliverables.mjs`: the only parsers of the artifact, reads, read-by and parked lines.
- `scripts/product-report.mjs`: the shallow-clone check and the tracked-location matcher.
- `apps/hive/layout.mjs`: the deterministic geometry model for the town layout.
- `apps/hive/assets/hive.mjs`: the injected-THREE structure builders.
- `apps/hive/text-layer.mjs`: the cards and voices.
