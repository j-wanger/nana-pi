Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 5, on the tip of build 4 (c85d8e05).

Build 4 is the first that holds up: the loop is one oval street with stages 01 to 09 around it, no crossings, ground lots, shadows, a stepped review ladder, and the notice-board chapter passes every line. Keep all of it. The seat's judge answers are `docs/reviews/world-graph-2026-10-30/judge-build4.md`. This build finishes composition and placement.

## 1. The scene runs under the rail (spec line 1)

Three builds in a row the judge called the rail opaque. The seat checked: the rail is already frosted (`#stories::before`, 70% alpha, 12 px blur). The real cause is the overview camera: it frames the world into the area right of the rail, so nothing is drawn behind it, and the right half of the frame is empty ground. Fix the framing, not the CSS:
- Frame the overview on the whole viewport, so streets, lots and buildings run under the rail and the card and off the edges, as in the reference frames.
- Give the world surroundings beyond the loop (the ground grid continues, outer streets or lots run off the frame) so no edge shows empty ground.
- At 380 px the scene fills the screen behind the header and the card.
- Nothing important sits only under the rail: the numbered loop stays readable in the visible part.

## 2. Placement (spec line 7)

- 01 Compass sits on the loop, fronting the street like every other numbered stage (the judge: "01 Compass sits off the loop, above its top end").
- 05.2 Lab sits on a short spur from 05, not a long spoke.
- The depot (Stage, Key cabinet, Night shift) sits together beside one numbered stage on a short road, not chained off 05 and Lab on long roads.
- Space the numbered stages evenly along the ring.
- Extend R-3172's frontage pin to every stage including 01, and add a sealed maximum spur length for support structures and the depot.

## 3. Forms and the phone (spec lines 2, 6)

- The judge: "'Contract' is just upright slabs, and 'Library' is a black block grid." Give the requirement contract and the library forms with more parts and finish. The library becomes the movie theater in a later lane, so keep its footprint.
- At 380 px, no model or label may cover the header, the voice tabs, the renderer line or the Pixel view and Hold still controls. Keep a safe band clear, or move labels.

## Show your work

As build 4: real audit data; the six first-look URLs with `--hive --reference /private/tmp/nana-3dmk-ref --spec docs/reviews/world-graph-2026-10-30/world-art-spec.md --out <folder outside git>`; every 380 shot `RENDERER: WEBGL`; your own pass or fail per line against the frames and `judge-build4.md`, up to three rounds; the gesture check at 380 px. Spec line 9 applies only to the `#explore/workshop` capture. No model sessions; never write into `/private/tmp/nana-3dmk-ref/`. Locked full suite in the foreground.

## Done when

All rows stay `implemented` (R-3120 `retired`) with backticked `file::title` evidence; v1 contract and fixture byte-identical; locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs` green. Push and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once before reporting.

Report: the screenshot folder; the spec table; the gesture result; every row or test changed; each departure from the Precedent.

## Precedent

- `apps/hive/camera.mjs`: the overview framing to widen.
- `scripts/component-graph.mjs`: the loop placement and spurs.
- `apps/hive/assets/hive.mjs`: the library and contract forms.
- `apps/hive/index.html`: the phone safe band.
