Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 3, on the tip of build 2 (09607546).

## The owner's answer at the shape gate

The seat showed the owner build 2's overview, a tour chapter and the phone explore frame. His answer: "Not close at all lol, agreed with the reviewers this looks very bad haha, lets follow your recommendation and see how it looks, cant judge much on the current look". The seat's visual judge failed all six captures; its full answers are `docs/reviews/world-graph-2026-10-30/judge-build2.md`.

Keep everything that worked: the graph and loop data, the publish-time layout, the loop order, the tour, the tap-select and Enter-only camera, the gesture check, every row. This build changes how the world looks, not what it is.

## The recommendation the owner took

1. **A dense city on the loop, not a diagram.** Buildings are much bigger relative to the world: the loop reads as a street lined with full-size structures, packed close, as the 3dmk frames are dense. Scale the layout down or the buildings up until, at 1280 px, the overview shows identifiable buildings (judge line 2: "you can't tell what an object is" must stop being true), and at 380 px the loop still fills the frame with recognisable structures. Re-pin the layout tests to the new sealed scale; keep the clearance and loop-order checks.
2. **Roads are flat streets on the ground.** Replace the hexagonal beams with flat road ribbons at street scale: a wide loop street, narrower spur streets, with kerb or edge lines and lane marks in the monochrome palette. At a tour close-up a road must look like a road beside a building, never a beam taller than it.
3. **No roads across the loop on the overview.** The overview draws only the loop street and the spurs to each stage. Artifact, import and shared-feature roads appear only when a building is selected, as thin lines on the ground. Pin it: the overview's crossing count of drawn roads stays 0 and no drawn road is wider than the loop street.
4. **One depot for the three outside parts.** Stage, Key cabinet and Night shift sit together as one depot yard beside the loop, near the stage they relate to most (or near Notice board if none), inside the world bounds and clear of the rail, with absent parts as empty foundations as before. Their chapter label stops claiming a stage 10; name the group in the rail instead (for example "Depot: Stage", and so on).
5. **The overlay.** The left rail is frosted and see-through: the scene runs under it, edge to edge, as in the reference. Remove the dark blurred smear at the top of the rail. The overview card fits its text at 1280 and 380 px (its last sentence was cut off) and does not cover labels.
6. **`#explore` with no selection** shows the whole loop, a card that says to tap a building, and no Enter button; `#explore/<id>` keeps the outline, darker roads, and Enter, Back and Back to tour.

## Show your work

Serve with the real audit data as the plan's visual acceptance step 2 says, and run first-look on the same six URLs with `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <folder outside git>`. Every 380 shot must show `RENDERER: WEBGL`. Judge each spec line yourself against the frames and against `judge-build2.md`, pass or fail with one reason, up to three rounds. Re-run `scripts/hive-gesture-check.mjs` at 380 px and update `gesture-check.txt`. Do not start model sessions; the seat runs the judge. Never write into `/private/tmp/nana-3dmk-ref/`.

Run the locked full suite as a plain foreground command with its output on screen.

## Done when

All rows stay `implemented` (R-3120 `retired`) with backticked `file::title` evidence; the v1 contract and fixture stay byte-identical. The locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` are green. Push and report the finished CI run for the new tip.

Report: the screenshot folder; the spec table; the gesture result; every row or test changed; each departure from the Precedent.

## Precedent

- `apps/hive/assets/parts.mjs`: build 2's shared beam and fence helpers, where road ribbons belong.
- `apps/hive/assets/hive.mjs`: the structure builders to scale.
- `scripts/component-graph.mjs`: the publish-time layout and its sealed scale.
- `apps/hive/camera.mjs`: overview framing and the tour poses.
- `apps/hive/index.html`: the rail and card.
- `apps/hive/text-layer.mjs`: the rail labels and cards.
