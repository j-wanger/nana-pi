Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 14, on ed10ed12.

Build 13 made scrolling smooth: the biggest camera step per frame fell from 0.76 to 0.05, with p95 frame time near 10 ms. Keep that, and keep its measurements in the gesture check so no later change undoes it.

The owner's standing ask is "keep polishing". The seat compared build 13's frames with build 11's and found three regressions and one gap.

## 1. The town emptied out

At chapter 13 (whole city) the town between the ring and the outer places is mostly empty ground with a few small house clusters, where build 11 had full blocks of houses. Bring the town back to build 11's density, with build 11's varied house types along local trays. If density was cut for speed, draw houses with instancing (one instanced mesh per house type) rather than fewer houses. Keep p95 under 20 ms in the scroll measurement. Add a pin: the whole-city view shows at least as many houses as build 11 placed.

## 2. The title sits on the city

At chapter 00 the title "One wish. A working city." and "Scroll to enter" lie across the ring and buildings. Give them a calm area: either keep the camera high over plain ground until the reader scrolls, or lay a soft frosted band behind the title. Text must never cross a building or a road at 1280 and 390 px.

## 3. The bay crane still does not read

At chapter 05 the roof is opened, but no crane shows; the scene has a frame and two workers. Put a visible jib crane beside or above the bay, carrying a crate into it each loop, readable at chapter 05's camera at 1280 and 390 px.

## 4. Life between places

Workers and crates should also travel between places, not only stand at them: a runner walks the sheet from the drafting office to the yard, builders carry crates from the yard to the bays, and a truck leaves through the land gate. At chapter 13, at least a few moving crates or figures must be visible on the trays.

## Show your work

As brief 13, including the scroll measurements before and after. Frames of chapters 00, 05, 13 at both widths, and a four-frame strip of chapter 13 0.5 s apart. Your own pass or fail per spec line, over up to three rounds. Gesture check at 390 px. No model sessions. Never write into `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Locked full suite in the foreground.

## Done when

Amended rows `implemented` with backticked `file::title` evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: the measurements; the frame folders; the spec table; the gesture result; every row and test changed; each departure from the Precedent.

## Precedent

- `apps/hive/config.mjs`: the DENSITY values.
- `apps/hive/city.mjs`: house placement.
- `apps/hive/assets/district.mjs`: house types, the bay and its crane.
- `apps/hive/assets/residents.mjs`: workers and their routes.
- `apps/hive/main.mjs`: the opening and the render loop.
- `apps/hive/pixel.mjs`: the opening plan drawing.
- `scripts/hive-gesture-check.mjs`: the scroll measurements to keep.

Private helpers inside a Precedent file may move to named exports in `apps/hive/assets/parts.mjs` if a second file needs them; report each move.
