Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 11, on 72b1d710.

Build 10 delivered the owner's three asks: one continuous scroll that never moves on its own, trays and a raised ring that match the buildings, and workers with roles. Keep all of it. The seat stepped through it with short wheel ticks and short swipes at 1280 and 390 px, and found six problems before the owner sees it.

## 1. Cards overlap while they cross-fade

Mid-way between chapters, two cards' titles and text sit on top of each other and neither is readable. Fix: the outgoing card fades out fully before the incoming card fades in, inside the same 15 percent window, with a small upward slide. At every stage value at most one card may have opacity above 0.05. Pin that under R-3174.

## 2. Park chapters fly past

Spans weighted by camera travel give the close park chapters one or two wheel ticks each, and the far chapters ten or more. Each chapter needs time to be read. Give every chapter a base reading span of one screen height, plus a travel span capped at half a screen height. Pin: every chapter's span is at least 0.8 screen heights at 1280 and 390 px.

## 3. Bring the opening back, driven by the scroll

The owner asked for an opening scene, and build 10 removed it because a timed descent would move the camera without input. Build it into the scroll instead:
- At load, the city shows as the flat plan drawing in thin lines, with the title and "Scroll to enter". Signal pulses fall on loop (animation, not camera).
- The first span of the scroll is the descent: as the reader scrolls, the plan rises into the 3D city and the camera comes down onto the tower, reaching chapter 01's pose at the end of the span.
- The camera moves only with the scroll, as R-3174 now requires. `?still` and reduced motion show the end of the descent at once.

## 4. On phones, the card hides the subject

At 390 px the card covers the lower 40 percent of the screen, and several chapters frame their place underneath it (the land gate sits behind its own card). Frame each chapter's target in the visible band above the card: offset the camera's view centre by the card's height. Pin: at 390 px every chapter's target projects into the band between the header and the card's top edge.

## 5. Houses in one repeated box, in rows

The town reads as a grid of identical boxes, which the owner has called AI slop before. Make the houses read as a town:
- Four to six house types (pitched roof, flat roof with terrace, two-storey, row of three, small yard with a tree), with varied heights within a narrow band.
- Houses face their street and sit in blocks along local trays, with yards and gaps between blocks. No hexagonal or square lattice. R-3172's lattice rule applies to houses too; extend its test.
- Keep them plain and quiet, so the named places still stand out.

## 6. Lit and dark not readable in the whole-city view

Spec line 10 still fails. From above, entrance windows are too small. Give lit buildings a lit roof strip or a lit clerestory visible from above, and give dark buildings none. The whole-city frame must show at least three lit and two dark named places, told apart at 1280 px.

## Show your work

As brief 10. Also save, at both widths, 14 frames, one at the middle of each chapter's span, and 6 frames across one chapter boundary, so the seat can check items 1, 2 and 4. Your own pass or fail per spec line, over up to three rounds. The gesture check at 390 px. No model sessions. Never write into `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Locked full suite in the foreground.

## Done when

Amended rows `implemented` with backticked `file::title` evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: the frame folders; the spec table; the gesture result; every row and test changed; each departure from the Precedent.

## Precedent

- `apps/hive/main.mjs`: scroll wiring and card fades.
- `apps/hive/tour.mjs`: span helpers to rebalance.
- `apps/hive/camera.mjs`: the pose blend; add the view-centre offset.
- `apps/hive/text-layer.mjs`: card rendering.
- `apps/hive/pixel.mjs`: the flat drawing for the opening plan.
- `apps/hive/assets/district.mjs`: buildings, lights and houses.
- `apps/hive/assets/parts.mjs`: shared parts for house types.
- `apps/hive/city.mjs`: house placement along local streets.
- `scripts/hive-gesture-check.mjs`: the gesture check to extend.
