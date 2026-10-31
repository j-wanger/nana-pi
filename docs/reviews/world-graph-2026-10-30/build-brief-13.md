Feature: FEAT-039 · See the product and its decisions in one report

Lane world-graph. Class: ordinary. Builder: pi-worker (larger lane). Build session 13, on 34899e07.

The owner on build 12: "Right direction, scrolling is very not smooth, but keep polishing". Keep everything build 12 does.

## 1. Smooth scrolling (first and most important)

The seat read `apps/hive/main.mjs` and sees three likely causes. Confirm or refute each with a measurement before changing it:
- The scroll handler sets the pose straight from `scrollY` and calls `frame()`, and `animate` also calls `frame()` every animation frame. So the scene renders twice in some frames, and the camera jumps in 100 px wheel steps.
- `reading()` runs on every scroll event.
- Shadow maps or other heavy work may rebuild while scrolling.

The fix, in the reference's grammar:
- The scroll handler only records the target stage from `scrollY`. Nothing renders in the handler.
- One `requestAnimationFrame` loop renders once per frame. In it, the displayed stage eases toward the target stage with a critically damped follow (time constant about 0.15 s), and the camera pose comes from the displayed stage. The view always moves toward where the page is, never back past it and never on its own beyond it. When input stops, it settles at the scrolled position within about 0.5 s. That honours R-3174: the page alone decides where the view ends.
- Card text updates only when the chapter or fade bucket changes, not on every scroll event.
- No shadow-map rebuild, geometry rebuild or layout read (`getBoundingClientRect`, `offsetTop`) inside the scroll path or the per-frame path, except where the frame truly needs it.

Measure in the headless browser with the Metal backend, at 1280 and 390 px, during a 10 s scripted scroll of short wheel ticks and of one long smooth scroll:
- p95 frame time below 20 ms, with no long task over 50 ms.
- Camera position change per frame below a sealed bound, and no frame where it reverses direction during a one-way scroll.
- Report the before and after numbers.

Amend R-3174's wording and test for the eased follow: the displayed stage moves monotonically toward the target and reaches it within 0.5 s of the last input. Keep the 2 s stillness pin, measured after settling.

## 2. Polish

- **Motion you can see.** At chapter distance the mechanisms move too little to notice. Raise their range and speed where it is subtle (crane swings, lift travel, turntable), and pace each loop at 3 to 6 s.
- **The bay crane.** Move the jib crane or open the roof so it reads at chapter 05.
- **The opening drawing.** The title sits on top of the plan's lines. Place the title and "Scroll to enter" in a clear area, and draw the plan with the same street hierarchy as the 3D city (wide journey street, ring, local streets) and simple building footprints, not boxes joined by lines.
- **Workers in the whole-city view.** Small figures and moving crates should be visible on the trays from the whole-city camera, as signs of life.

## Show your work

As brief 12. Add the scroll measurements before and after, and a 2 s capture of 30 frames during a slow scroll at 1280 px, from which the seat can check smoothness. Your own pass or fail per spec line, over up to three rounds. Gesture check at 390 px. No model sessions. Never write into `/private/tmp/nana-3dmk-ref/` or `/private/tmp/nana-3dmk-notes/`. Locked full suite in the foreground.

## Done when

Amended rows `implemented` with backticked `file::title` evidence. Green: locked full suite, `npm run map:check`, `npm run readme:check`, the requirements trace, the tree check, the known-bugs check and `node scripts/identity-scan.mjs`. Push and report the finished CI run for the new tip. A Windows R-3104 timeout is a known flake: rerun the failed job once.

Report: the measurements; the frame folders; the spec table; the gesture result; every row and test changed; each departure from the Precedent.

## Precedent

- `apps/hive/main.mjs`: the scroll handler and render loop.
- `apps/hive/tour.mjs`: stage helpers.
- `apps/hive/camera.mjs`: pose blend.
- `apps/hive/text-layer.mjs`: card rendering.
- `apps/hive/pixel.mjs`: the plan drawing.
- `apps/hive/assets/district.mjs`: mechanisms and the bay crane.
- `apps/hive/assets/residents.mjs`: workers.
- `scripts/hive-gesture-check.mjs`: the gesture check, gaining the scroll measurements.
