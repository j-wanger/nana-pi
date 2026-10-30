Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 4, on the tip of build 3 (3a3d0405).

Build 3 is a clear step up: recognisable buildings, marked streets, one depot, no crossing roads on the overview. Keep all of it. The seat's visual judge still fails it on six captures; its full answers are `docs/reviews/world-graph-2026-10-30/judge-build3.md`. This build merges main and finishes the world.

## 1. Merge main

The map-spawn-edges lane landed; the pull request reports conflicts in generated files. Merge `origin/main` into this branch and regenerate (`npm run -s req:tree`, `node scripts/code-map.mjs --write`); union known-bug files and session notes.

## 2. One loop street through every stage (spec line 7)

The judge: "the only wide road is a narrow house-shaped path in the middle. Stages 01, 02, 03 and 05 sit off it", and "08, 03 and 03.2, and then 07, 04 and 04.1, line up in rows". Make the loop a single continuous wide street, roughly ring-shaped, that passes directly in front of each numbered stage 01 to 09 in order and closes on itself; every numbered stage fronts onto it. Support structures sit on the outer side, on short spurs. No visible rows. Pin it: each numbered stage's footprint is within a sealed distance of the loop street centre line.

## 3. Ground, density and light (spec line 2)

The judge: "small tokens floating on flat grey ... no ground, little shadow and lots of empty space", "roads break into loose floating slabs and thin crossing lines". Give every structure a ground lot (a pad with kerbs and paths to its street); give the loop's inside a plaza or green so the field is not empty; strengthen cast shadows so every building throws one; make every road piece continuous and on the ground, with no floating slabs. The selection-only relationship lines are thin marks on the ground, never mid-air. Give the review ladder a form that reads as stepped review (tiers or a stair of stages), not a generic block, and do the same for any spine stage the judge called a plain block (07, 06, 04.1, 04).

## 4. The overlay and the phone (spec lines 1, 4, 5, 6)

- The left rail at 1280 px is frosted and see-through: the scene runs under it with no hard divider, and its text stays readable over the blur.
- At 380 px the scene fills the whole screen behind the header and the card; neither sits on its own band.
- Labels never run off the right edge or overlap ("DEPOT: STAGE" over "KEY CABINET"); shorten or move them.
- The selection card keeps spacing between its body line and its buttons.

## Show your work

As build 3: real audit data, the six first-look URLs with `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <folder outside git>`, every 380 shot `RENDERER: WEBGL`, your own pass or fail per line against the frames and `judge-build3.md`, up to three rounds, and the gesture check at 380 px. No model sessions; never write into `/private/tmp/nana-3dmk-ref/`. Locked full suite in the foreground.

## Done when

All rows stay `implemented` (R-3120 `retired`) with backticked `file::title` evidence; v1 contract and fixture byte-identical; locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` green. Push and report the finished CI run for the new tip.

Report: the screenshot folder; the spec table; the gesture result; every row or test changed; each departure from the Precedent.

## Precedent

- `scripts/component-graph.mjs`: the publish-time layout to reshape around one loop street.
- `apps/hive/assets/parts.mjs`: road ribbons and shared parts.
- `apps/hive/assets/hive.mjs`: the structure builders.
- `apps/hive/index.html`: the rail, card and phone layout.
- `apps/hive/text-layer.mjs`: labels and cards.
